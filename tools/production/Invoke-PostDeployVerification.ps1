[CmdletBinding()]
param(
    [Parameter(Mandatory)][uri]$BaseUrl,
    [string]$ExpectedCommitSha,
    [string]$OutputRoot = '.acceptance',
    [string[]]$RequiredPaths = @('/', '/articles/', '/articles/pampers-newborn/', '/memo/', '/about/', '/privacy/', '/disclaimer/', '/robots.txt', '/sitemap.xml'),
    [string[]]$NonIndexableOkPaths = @('/memo/'),
    [int]$MaxAttempts = 4,
    [int]$RetryDelaySeconds = 15
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if ($BaseUrl.Scheme -ne 'https') { throw 'BaseUrl must use HTTPS.' }
if ($BaseUrl.AbsolutePath -ne '/') { throw 'BaseUrl must point to the site root.' }
if ($MaxAttempts -lt 1) { throw 'MaxAttempts must be at least 1.' }
if ($RetryDelaySeconds -lt 0) { throw 'RetryDelaySeconds must be non-negative.' }
$origin = $BaseUrl.GetLeftPart([System.UriPartial]::Authority)
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$runDirectory = [System.IO.Path]::GetFullPath((Join-Path $OutputRoot "post-deploy-$stamp"))
New-Item -ItemType Directory -Path $runDirectory -Force | Out-Null
$checks = [System.Collections.Generic.List[object]]::new()
$pages = [System.Collections.Generic.List[object]]::new()
$hasFailure = $false

function Check([string]$Name, [bool]$Passed, [string]$Detail) {
    $checks.Add([ordered]@{ name = $Name; status = $(if ($Passed) { 'PASS' } else { 'FAIL' }); detail = $Detail })
    if (-not $Passed) { $script:hasFailure = $true }
}
function Fetch([uri]$Uri, [switch]$AllowHttpError) {
    try {
        $response = Invoke-WebRequest -Uri $Uri -MaximumRedirection 5 -TimeoutSec 20 -SkipHttpErrorCheck
        return $response
    } catch {
        if ($AllowHttpError) { return $null }
        throw
    }
}

# Cloudflare Pages の direct upload 後、エッジへの反映には数秒〜数十秒かかる。
# デプロイ直後に一度だけ検証すると旧エッジを掴み、build-sha 照合が一時的に失敗する。
# そのため1試行の全チェックを1ユニットとして、収束するまで再試行する。
# 全試行が失敗した場合のみ BLOCKER（exit 1）とし、実障害の検出は弱めない。
function Invoke-VerificationAttempt {
    # 試行ごとに累積状態をリセットする。
    $script:hasFailure = $false
    $checks.Clear()
    $pages.Clear()

    foreach ($path in $RequiredPaths) {
        $uri = [uri]::new($BaseUrl, $path)
        $response = Fetch $uri
        $expected = 200
        $ok = [int]$response.StatusCode -eq $expected
        Check "HTTP $path" $ok "status=$([int]$response.StatusCode) final=$($response.BaseResponse.RequestMessage.RequestUri)"
        $contentType = [string]$response.Headers.'Content-Type'
        if ($path -notin @('/robots.txt', '/sitemap.xml')) {
            Check "HTML content type $path" ($contentType -match 'text/html') "Content-Type=$contentType"
            $html = [string]$response.Content
            $canonicalMatch = [regex]::Match($html, '<link[^>]+rel=["'']canonical["''][^>]+href=["''](?<href>[^"'']+)', 'IgnoreCase')
            $expectedCanonical = "$origin$path"
            Check "Canonical $path" ($canonicalMatch.Success -and $canonicalMatch.Groups['href'].Value -eq $expectedCanonical) "actual=$($canonicalMatch.Groups['href'].Value) expected=$expectedCanonical"
            $robotsMatch = [regex]::Match($html, '<meta[^>]+name=["'']robots["''][^>]+content=["''](?<value>[^"'']+)', 'IgnoreCase')
            if ($path -in $NonIndexableOkPaths) {
                Check "Indexable $path (noindex allowed)" ($robotsMatch.Success) "robots=$($robotsMatch.Groups['value'].Value) (allowed: noindex)"
            } else {
                Check "Indexable $path" ($robotsMatch.Success -and $robotsMatch.Groups['value'].Value -notmatch 'noindex') "robots=$($robotsMatch.Groups['value'].Value)"
            }
            Check "No mixed content $path" ($html -notmatch '(?i)(?:src|href)=["'']http://') 'No http:// asset or link reference.'
            $pages.Add([ordered]@{ path = $path; status = [int]$response.StatusCode; bytes = [Text.Encoding]::UTF8.GetByteCount($html) })
        }
    }

    $notFoundPath = "/__acceptance_missing_$([guid]::NewGuid().ToString('N')).html"
    $notFound = Fetch ([uri]::new($BaseUrl, $notFoundPath))
    Check 'Generated 404 status' ([int]$notFound.StatusCode -eq 404) "status=$([int]$notFound.StatusCode)"
    $notFoundHtml = [string]$notFound.Content
    Check 'Generated 404 noindex' ($notFoundHtml -match '(?is)<meta[^>]+name=["'']robots["''][^>]+content=["''][^"'']*noindex') '404 contains robots noindex.'

    $article = Fetch ([uri]::new($BaseUrl, '/articles/pampers-newborn/'))
    $articleHtml = [string]$article.Content
    $jsonLdBlocks = [regex]::Matches($articleHtml, '(?is)<script[^>]+type=["'']application/ld\+json["''][^>]*>(?<json>.*?)</script>')
    $articleJson = $null
    foreach ($block in $jsonLdBlocks) {
        try {
            $candidate = $block.Groups['json'].Value | ConvertFrom-Json -Depth 50
            if ($candidate.'@type' -eq 'Article') { $articleJson = $candidate; break }
        } catch {}
    }
    Check 'Article JSON-LD' ($null -ne $articleJson) 'Article structured data found and parsed.'
    if ($articleJson) {
        Check 'Article JSON-LD URL' ($articleJson.url -eq "$origin/articles/pampers-newborn/") "url=$($articleJson.url)"
        Check 'Article dates' (-not [string]::IsNullOrWhiteSpace($articleJson.datePublished) -and -not [string]::IsNullOrWhiteSpace($articleJson.dateModified)) 'datePublished and dateModified are present.'
    }

    # ExpectedCommitSha が指定された場合は、配信HTMLに埋め込まれたビルド元SHAと突合する
    # （Invoke-ProductionBuildAndDeploy.ps1 が PUBLIC_BUILD_SHA としてビルド時に注入する）。
    if ($ExpectedCommitSha) {
        $buildShaMatch = [regex]::Match($articleHtml, '<meta[^>]+name=["'']build-sha["''][^>]+content=["''](?<value>[^"'']+)', 'IgnoreCase')
        Check 'Deployed build-sha meta' $buildShaMatch.Success 'build-sha meta must be present when a commit is expected.'
        if ($buildShaMatch.Success) {
            Check 'Deployed commit matches expected SHA' ($buildShaMatch.Groups['value'].Value -eq $ExpectedCommitSha) "actual=$($buildShaMatch.Groups['value'].Value) expected=$ExpectedCommitSha"
        }
    }

    $allLinks = [regex]::Matches($articleHtml, '(?i)href=["''](?<href>https://[^"'']+)["'']') | ForEach-Object { $_.Groups['href'].Value }
    $rakutenLinks = @($allLinks | Where-Object { ([uri]$_).Host -match '(^|\.)rakuten\.co\.jp$|(^|\.)r10\.to$' })
    Check 'Rakuten CTA present' ($rakutenLinks.Count -ge 1) "allowed Rakuten links=$($rakutenLinks.Count)"
    $disallowedRakuten = @($allLinks | Where-Object { $_ -match '(?i)rakuten' -and ([uri]$_).Host -notmatch '(^|\.)rakuten\.co\.jp$|(^|\.)r10\.to$' })
    Check 'Rakuten CTA host allowlist' ($disallowedRakuten.Count -eq 0) "disallowed count=$($disallowedRakuten.Count)"

    [pscustomobject]@{
        checks = @($checks)
        pages = @($pages)
        hasFailure = $script:hasFailure
    }
}

$attempt = 0
$resultsPerAttempt = [System.Collections.Generic.List[string]]::new()
$attemptResult = $null
while ($true) {
    $attempt++
    $attemptResult = Invoke-VerificationAttempt
    $status = if ($attemptResult.hasFailure) { 'BLOCKER' } else { 'PASS' }
    $resultsPerAttempt.Add($status)
    Write-Host "Attempt $attempt/${MaxAttempts}: $status"
    if (-not $attemptResult.hasFailure -or $attempt -ge $MaxAttempts) { break }
    Write-Host "Waiting ${RetryDelaySeconds}s before re-verifying (CDN edge propagation)..."
    Start-Sleep -Seconds $RetryDelaySeconds
}

$report = [ordered]@{
    result = $(if ($attemptResult.hasFailure) { 'BLOCKER' } else { 'PASS' })
    generatedAt = (Get-Date).ToString('o')
    baseUrl = $origin
    expectedCommitSha = $ExpectedCommitSha
    attempts = $attempt
    resultsPerAttempt = @($resultsPerAttempt)
    pages = @($attemptResult.pages)
    checks = @($attemptResult.checks)
    secretsIncluded = $false
}
$report | ConvertTo-Json -Depth 50 | Set-Content -LiteralPath (Join-Path $runDirectory 'report.json') -Encoding utf8
$lines = @(
    '# Production post-deploy verification',
    '',
    "- Result: **$($report.result)**",
    "- Base URL: $origin",
    "- Expected commit: $ExpectedCommitSha",
    "- Attempts: $attempt ($($resultsPerAttempt -join ', '))",
    '',
    '## Checks'
)
$lines += @($attemptResult.checks | ForEach-Object { "- [$($_.status)] $($_.name): $($_.detail)" })
$lines | Set-Content -LiteralPath (Join-Path $runDirectory 'report.md') -Encoding utf8
Write-Host "Result: $($report.result)"
Write-Host "Report: $(Join-Path $runDirectory 'report.md')"
if ($attemptResult.hasFailure) { exit 1 }
