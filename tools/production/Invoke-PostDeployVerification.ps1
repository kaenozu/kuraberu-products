[CmdletBinding()]
param(
    [Parameter(Mandatory)][uri]$BaseUrl,
    [string]$ExpectedCommitSha,
    [string]$OutputRoot = '.acceptance',
    # Core pages that must always be present and healthy.
    [string[]]$RequiredPaths = @(
        '/',
        '/articles/',
        '/memo/',
        '/about/',
        '/privacy/',
        '/disclaimer/',
        '/robots.txt',
        '/sitemap.xml'
    ),
    # Representative article paths covering different content types:
    # - Comparison articles (productCount=2, leftModel/rightModel)
    # - Guide articles (productCount=1, aboutProductNames)
    # - Commercial articles (CommercialArticlePage)
    # - Articles with external embeds (autoload consent gate)
    # - Articles with verified purchase links
    # - Articles with unverified purchase links
    [string[]]$ArticlePaths = @(
        '/articles/pampers-newborn/',           # verified purchase, comparison
        '/articles/thermos-tiger-bottle/',      # comparison, verified purchase
        '/articles/babybjorn/',                 # autoload X embed
        '/articles/babybjorn-bouncer/',         # comparison, unverified
        '/articles/kingjim-tepra-sr-r2500p-vs-sr-mk1/',  # YouTube autoload embed
        '/articles/tiger-mta-j050-guide/',      # guide article
        '/articles/shupot/',                    # multiple autoload X embeds
        '/articles/zojirushi-ec-kv50-vs-ec-ma60/',  # comparison
        '/articles/yamazaki-dust-wagon-45l-2division-vs-3division/',  # verified purchase
        '/articles/merries-newborn/'            # autoload X embed, comparison
    ),
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

    # --- Core page validation ---
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

    # --- Article-level validation across representative paths ---
    # This section validates that articles have proper structured data,
    # build-sha consistency, and no stale artifacts.
    $articleBuildShas = [System.Collections.Generic.List[string]]::new()
    $articleChecks = 0
    $articleFailures = 0

    foreach ($articlePath in $ArticlePaths) {
        $uri = [uri]::new($BaseUrl, $articlePath)
        $response = Fetch $uri
        if ($null -eq $response) {
            Check "Article HTTP $articlePath" $false "Failed to fetch article"
            $articleFailures++
            continue
        }
        $articleOk = [int]$response.StatusCode -eq 200
        Check "Article HTTP $articlePath" $articleOk "status=$([int]$response.StatusCode)"
        $articleChecks++
        if (-not $articleOk) { $articleFailures++; continue }

        $articleHtml = [string]$response.Content

        # JSON-LD structured data validation
        $jsonLdBlocks = [regex]::Matches($articleHtml, '(?is)<script[^>]+type=["'']application/ld\+json["''][^>]*>(?<json>.*?)</script>')
        $articleJson = $null
        foreach ($block in $jsonLdBlocks) {
            try {
                $candidate = $block.Groups['json'].Value | ConvertFrom-Json -Depth 50
                if ($candidate.'@type' -eq 'Article') { $articleJson = $candidate; break }
            } catch {}
        }
        Check "Article JSON-LD $articlePath" ($null -ne $articleJson) 'Article structured data present.'
        $articleChecks++
        if ($null -ne $articleJson) {
            Check "Article JSON-LD URL $articlePath" (-not [string]::IsNullOrWhiteSpace($articleJson.url)) "url=$($articleJson.url)"
            $articleChecks++
            Check "Article dates $articlePath" (-not [string]::IsNullOrWhiteSpace($articleJson.datePublished) -and -not [string]::IsNullOrWhiteSpace($articleJson.dateModified)) 'datePublished and dateModified present.'
            $articleChecks++
        } else { $articleFailures++ }

        # Build-sha consistency detection (stale artifact check)
        if ($ExpectedCommitSha) {
            $buildShaMatch = [regex]::Match($articleHtml, '<meta[^>]+name=["'']build-sha["''][^>]+content=["''](?<value>[^"'']+)', 'IgnoreCase')
            Check "Build-sha present $articlePath" $buildShaMatch.Success 'build-sha meta tag present.'
            $articleChecks++
            if ($buildShaMatch.Success) {
                $sha = $buildShaMatch.Groups['value'].Value
                Check "Build-sha matches $articlePath" ($sha -eq $ExpectedCommitSha) "actual=$sha expected=$ExpectedCommitSha"
                $articleChecks++
                $articleBuildShas.Add($sha)
            } else { $articleFailures++ }
        }

        # Purchase link validation (Rakuten CTA must be present for articles with purchase CTAs)
        $allArticleLinks = [regex]::Matches($articleHtml, '(?i)href=["''](?<href>https://[^"'']+)["'']') | ForEach-Object { $_.Groups['href'].Value }
        $rakutenLinks = @($allArticleLinks | Where-Object { ([uri]$_).Host -match '(^|\.)rakuten\.co\.jp$|(^|\.)r10\.to$' })
        # Some articles (unverified purchase status) may not have Rakuten CTAs, so this is informational
        $hasRakutenCta = $rakutenLinks.Count -ge 1
        if ($hasRakutenCta) {
            Check "Rakuten CTA $articlePath" $true "links=$($rakutenLinks.Count)"
            $articleChecks++
            $disallowedRakuten = @($allArticleLinks | Where-Object { $_ -match '(?i)rakuten' -and ([uri]$_).Host -notmatch '(^|\.)rakuten\.co\.jp$|(^|\.)r10\.to$' })
            Check "Rakuten host allowlist $articlePath" ($disallowedRakuten.Count -eq 0) "disallowed=$($disallowedRakuten.Count)"
            $articleChecks++
        }

        # No mixed content check
        Check "No mixed content $articlePath" ($articleHtml -notmatch '(?i)(?:src|href)=["'']http://') 'No http:// asset or link reference.'
        $articleChecks++

        $pages.Add([ordered]@{ path = $articlePath; status = [int]$response.StatusCode; bytes = [Text.Encoding]::UTF8.GetByteCount($articleHtml) })
    }

    # Stale artifact detection: all articles must have the same build-sha
    if ($articleBuildShas.Count -gt 1) {
        $uniqueShas = $articleBuildShas | Sort-Object -Unique
        Check 'Build-sha consistency across articles' ($uniqueShas.Count -eq 1) "unique SHAs=$($uniqueShas.Count) values=$($uniqueShas -join ', ')"
    } elseif ($articleBuildShas.Count -eq 1) {
        Check 'Build-sha consistency across articles' $true "all $($articleBuildShas.Count) articles share SHA $($articleBuildShas[0])"
    }

    # Article validation summary
    Check "Article validation summary" ($articleFailures -eq 0) "$articleChecks checks, $articleFailures failures across $(@($ArticlePaths).Count) articles"

    $notFoundPath = "/__acceptance_missing_$([guid]::NewGuid().ToString('N')).html"
    $notFound = Fetch ([uri]::new($BaseUrl, $notFoundPath))
    Check 'Generated 404 status' ([int]$notFound.StatusCode -eq 404) "status=$([int]$notFound.StatusCode)"
    $notFoundHtml = [string]$notFound.Content
    Check 'Generated 404 noindex' ($notFoundHtml -match '(?is)<meta[^>]+name=["'']robots["''][^>]+content=["''][^"'']*noindex') '404 contains robots noindex.'

    # Note: Article-level validation (JSON-LD, build-sha, Rakuten CTA, mixed content)
    # is now performed across all $ArticlePaths in the multi-article validation section above.
    # The pampers-newborn article is included in $ArticlePaths for full coverage.

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
