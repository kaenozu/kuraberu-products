[CmdletBinding()]
param(
    [Parameter(Mandatory)][uri]$BaseUrl,
    [Parameter(Mandatory)][ValidatePattern('^[0-9a-fA-F]{40}$')][string]$ExpectedCommitSha,
    [string]$OutputRoot = '.acceptance',
    [string[]]$RequiredPaths = @('/', '/articles/', '/articles/pampers-newborn/', '/memo/', '/about/', '/privacy/', '/disclaimer/', '/robots.txt', '/sitemap.xml')
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if ($BaseUrl.Scheme -ne 'https') { throw 'BaseUrl must use HTTPS.' }
if ($BaseUrl.AbsolutePath -ne '/') { throw 'BaseUrl must point to the site root.' }
$origin = $BaseUrl.GetLeftPart([System.UriPartial]::Authority)
$expectedSha = $ExpectedCommitSha.ToLowerInvariant()
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

function Get-TagAttribute(
    [string]$Html,
    [string]$TagName,
    [string]$SelectorName,
    [string]$SelectorValue,
    [string]$TargetName
) {
    foreach ($tag in [regex]::Matches($Html, "(?is)<$TagName\b[^>]*>")) {
        $attributes = @{}
        foreach ($match in [regex]::Matches(
            $tag.Value,
            '(?is)(?<name>[a-z_:][-a-z0-9_:.]*)\s*=\s*["''](?<value>.*?)["'']'
        )) {
            $attributes[$match.Groups['name'].Value.ToLowerInvariant()] = $match.Groups['value'].Value
        }
        $selector = $attributes[$SelectorName.ToLowerInvariant()]
        if ($null -ne $selector -and $selector -eq $SelectorValue) {
            return [string]$attributes[$TargetName.ToLowerInvariant()]
        }
    }
    return ''
}

function Check-HtmlContract([string]$Path, [object]$Response, [string]$ExpectedRobots, [switch]$SkipCanonical) {
    $html = [string]$Response.Content
    $contentType = [string]$Response.Headers.'Content-Type'
    Check "HTML content type $Path" ($contentType -match '(?i)text/html') "Content-Type=$contentType"
    if (-not $SkipCanonical) {
        $canonical = Get-TagAttribute $html 'link' 'rel' 'canonical' 'href'
        $expectedCanonical = "$origin$Path"
        Check "Canonical $Path" ($canonical -eq $expectedCanonical) "actual=$canonical expected=$expectedCanonical"
    }
    $robots = Get-TagAttribute $html 'meta' 'name' 'robots' 'content'
    Check "Robots $Path" (($robots -replace '\s+', '').ToLowerInvariant() -eq $ExpectedRobots) "actual=$robots expected=$ExpectedRobots"
    $buildSha = Get-TagAttribute $html 'meta' 'name' 'x-build-sha' 'content'
    Check "Build SHA $Path" ($buildSha.ToLowerInvariant() -eq $expectedSha) "actual=$buildSha expected=$expectedSha"
    Check "No mixed content $Path" ($html -notmatch '(?i)(?:src|href)=["'']http://') 'No http:// asset or link reference.'
    return $html
}

foreach ($path in $RequiredPaths) {
    $uri = [uri]::new($BaseUrl, $path)
    $response = Fetch $uri
    $expected = 200
    $ok = [int]$response.StatusCode -eq $expected
    Check "HTTP $path" $ok "status=$([int]$response.StatusCode) final=$($response.BaseResponse.RequestMessage.RequestUri)"
    $contentType = [string]$response.Headers.'Content-Type'
    if ($path -notin @('/robots.txt', '/sitemap.xml')) {
        $expectedRobots = if ($path -eq '/memo/') { 'noindex,nofollow' } else { 'index,follow' }
        $html = Check-HtmlContract $path $response $expectedRobots
        $pages.Add([ordered]@{ path = $path; status = [int]$response.StatusCode; bytes = [Text.Encoding]::UTF8.GetByteCount($html) })
    }
}

$notFoundPath = "/__acceptance_missing_$([guid]::NewGuid().ToString('N')).html"
$notFound = Fetch ([uri]::new($BaseUrl, $notFoundPath))
Check 'Generated 404 status' ([int]$notFound.StatusCode -eq 404) "status=$([int]$notFound.StatusCode)"
$notFoundHtml = Check-HtmlContract $notFoundPath $notFound 'noindex,nofollow' -SkipCanonical
Check 'Generated 404 body' ($notFoundHtml -match 'ページが見つかりません') '404 contains the not-found recovery copy.'

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

$requiredProducts = @('pampers-premium-newborn', 'pampers-sarasara-newborn')
$ctaTags = @([regex]::Matches($articleHtml, '(?is)<a\b[^>]*\bclass=["''][^"'']*\bcta\b[^"'']*["''][^>]*>'))
foreach ($productId in $requiredProducts) {
    $productPattern = '(?i)\bdata-product-id=["'']' + [regex]::Escape($productId) + '["'']'
    $matches = @($ctaTags | Where-Object { $_.Value -match $productPattern })
    Check "Rakuten CTA $productId count" ($matches.Count -eq 1) "count=$($matches.Count)"
    foreach ($tag in $matches) {
        $href = [regex]::Match($tag.Value, '(?i)\bhref=["''](?<href>https://[^"'']+)["'']').Groups['href'].Value
        $rel = [regex]::Match($tag.Value, '(?i)\brel=["''](?<rel>[^"'']+)["'']').Groups['rel'].Value
        $hostAllowed = $false
        try { $hostAllowed = ([uri]$href).Host -match '(^|\.)rakuten\.co\.jp$|^r10\.to$' } catch {}
        Check "Rakuten CTA $productId host" $hostAllowed "href=$href"
        Check "Rakuten CTA $productId sponsored" (($rel -split '\s+') -contains 'sponsored' -and ($rel -split '\s+') -contains 'nofollow') "rel=$rel"
    }
}
$allLinks = [regex]::Matches($articleHtml, '(?i)href=["''](?<href>https://[^"'']+)["'']') | ForEach-Object { $_.Groups['href'].Value }
$disallowedRakuten = @($allLinks | Where-Object { $_ -match '(?i)rakuten' -and ([uri]$_).Host -notmatch '(^|\.)rakuten\.co\.jp$|^r10\.to$' })
Check 'Rakuten CTA host allowlist' ($disallowedRakuten.Count -eq 0) "disallowed count=$($disallowedRakuten.Count)"

$report = [ordered]@{
    result = $(if ($hasFailure) { 'BLOCKER' } else { 'PASS' })
    generatedAt = (Get-Date).ToString('o')
    baseUrl = $origin
    expectedCommitSha = $expectedSha
    pages = @($pages)
    checks = @($checks)
    secretsIncluded = $false
}
$report | ConvertTo-Json -Depth 50 | Set-Content -LiteralPath (Join-Path $runDirectory 'report.json') -Encoding utf8
$lines = @('# Production post-deploy verification', '', "- Result: **$($report.result)**", "- Base URL: $origin", "- Expected commit: $ExpectedCommitSha", '', '## Checks')
$lines += @($checks | ForEach-Object { "- [$($_.status)] $($_.name): $($_.detail)" })
$lines | Set-Content -LiteralPath (Join-Path $runDirectory 'report.md') -Encoding utf8
Write-Host "Result: $($report.result)"
Write-Host "Report: $(Join-Path $runDirectory 'report.md')"
if ($hasFailure) { exit 1 }
