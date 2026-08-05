[CmdletBinding()]
param(
    [Parameter(Mandatory)][uri]$BaseUrl,
    [Parameter(Mandatory)][ValidatePattern('^[0-9a-fA-F]{40}$')][string]$ExpectedCommitSha,
    [string]$OutputRoot = '.acceptance',
    [string[]]$RequiredPaths = @(
        '/',
        '/articles/',
        '/articles/pampers-newborn/',
        '/memo/',
        '/about/',
        '/privacy/',
        '/disclaimer/',
        '/robots.txt',
        '/sitemap.xml'
    )
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if ($BaseUrl.Scheme -ne 'https') { throw 'BaseUrl must use HTTPS.' }
if ($BaseUrl.AbsolutePath -ne '/' -or $BaseUrl.Query -or $BaseUrl.Fragment) {
    throw 'BaseUrl must point to the site root without query or fragment.'
}
if ($BaseUrl.UserInfo) { throw 'BaseUrl must not contain credentials.' }

$origin = $BaseUrl.GetLeftPart([System.UriPartial]::Authority)
$expectedSha = $ExpectedCommitSha.ToLowerInvariant()
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$runDirectory = [System.IO.Path]::GetFullPath((Join-Path $OutputRoot "post-deploy-$stamp"))
New-Item -ItemType Directory -Path $runDirectory -Force | Out-Null
$checks = [System.Collections.Generic.List[object]]::new()
$pages = [System.Collections.Generic.List[object]]::new()
$hasFailure = $false

function Check([string]$Name, [bool]$Passed, [string]$Detail) {
    $checks.Add([ordered]@{
        name = $Name
        status = $(if ($Passed) { 'PASS' } else { 'FAIL' })
        detail = $Detail
    })
    if (-not $Passed) { $script:hasFailure = $true }
}

function Fetch([uri]$Uri) {
    Invoke-WebRequest `
        -Uri $Uri `
        -MaximumRedirection 5 `
        -TimeoutSec 20 `
        -SkipHttpErrorCheck
}

function Header([object]$Response, [string]$Name) {
    $value = $Response.Headers[$Name]
    if ($null -eq $value) { return '' }
    return [string]($value -join ', ')
}

function FinalUri([object]$Response) {
    [uri]$Response.BaseResponse.RequestMessage.RequestUri
}

function Get-TagAttribute(
    [string]$Html,
    [string]$TagName,
    [string]$SelectorName,
    [string]$SelectorValue,
    [string]$TargetName
) {
    $tags = [regex]::Matches($Html, "(?is)<$TagName\b[^>]*>")
    foreach ($tag in $tags) {
        $attributes = @{}
        foreach ($match in [regex]::Matches(
            $tag.Value,
            '(?is)(?<name>[a-z_:][-a-z0-9_:.]*)\s*=\s*["''](?<value>.*?)["'']'
        )) {
            $attributes[$match.Groups['name'].Value.ToLowerInvariant()] = $match.Groups['value'].Value
        }
        $selector = $attributes[$SelectorName.ToLowerInvariant()]
        if ($null -ne $selector -and $selector.Equals($SelectorValue, [StringComparison]::OrdinalIgnoreCase)) {
            return [string]$attributes[$TargetName.ToLowerInvariant()]
        }
    }
    return ''
}

function Check-ResponseBoundary([string]$Name, [object]$Response, [int]$ExpectedStatus) {
    $final = FinalUri $Response
    Check "$Name status" ([int]$Response.StatusCode -eq $ExpectedStatus) `
        "status=$([int]$Response.StatusCode) expected=$ExpectedStatus"
    Check "$Name final HTTPS" ($final.Scheme -eq 'https') "final=$final"
    Check "$Name final origin" ($final.GetLeftPart([System.UriPartial]::Authority) -eq $origin) `
        "finalOrigin=$($final.GetLeftPart([System.UriPartial]::Authority)) expected=$origin"
    $cacheControl = Header $Response 'Cache-Control'
    Check "$Name public cache" ($cacheControl -notmatch '(?i)(?:^|[,;\s])(private|no-store)(?:$|[,;\s])') `
        "Cache-Control=$cacheControl"
    $setCookie = Header $Response 'Set-Cookie'
    Check "$Name no cookie" ([string]::IsNullOrWhiteSpace($setCookie)) `
        "Set-Cookie present=$(-not [string]::IsNullOrWhiteSpace($setCookie))"
}

function Check-HtmlContract(
    [string]$Path,
    [object]$Response,
    [string]$ExpectedRobots,
    [switch]$SkipCanonical
) {
    $contentType = Header $Response 'Content-Type'
    Check "HTML content type $Path" ($contentType -match '(?i)text/html') "Content-Type=$contentType"
    $html = [string]$Response.Content

    if (-not $SkipCanonical) {
        $canonical = Get-TagAttribute $html 'link' 'rel' 'canonical' 'href'
        $expectedCanonical = "$origin$Path"
        Check "Canonical $Path" ($canonical -eq $expectedCanonical) `
            "actual=$canonical expected=$expectedCanonical"
    }

    $robots = Get-TagAttribute $html 'meta' 'name' 'robots' 'content'
    $normalizedRobots = ($robots -replace '\s+', '').ToLowerInvariant()
    Check "Robots $Path" ($normalizedRobots -eq $ExpectedRobots) `
        "actual=$normalizedRobots expected=$ExpectedRobots"

    $buildSha = Get-TagAttribute $html 'meta' 'name' 'x-build-sha' 'content'
    Check "Build SHA $Path" ($buildSha.ToLowerInvariant() -eq $expectedSha) `
        "actual=$buildSha expected=$expectedSha"

    Check "No mixed content $Path" ($html -notmatch '(?i)(?:src|href)=["'']http://') `
        'No http:// asset or link reference.'

    return $html
}

foreach ($path in $RequiredPaths) {
    $response = Fetch ([uri]::new($BaseUrl, $path))
    Check-ResponseBoundary "HTTP $path" $response 200
    $final = FinalUri $response
    Check "Final path $path" ($final.AbsolutePath -eq $path) `
        "finalPath=$($final.AbsolutePath) expected=$path"

    if ($path -notin @('/robots.txt', '/sitemap.xml')) {
        $html = Check-HtmlContract $path $response 'index,follow'
        $pages.Add([ordered]@{
            path = $path
            status = [int]$response.StatusCode
            bytes = [Text.Encoding]::UTF8.GetByteCount($html)
            buildSha = $expectedSha
        })
    }
}

$robotsResponse = Fetch ([uri]::new($BaseUrl, '/robots.txt'))
$robotsType = Header $robotsResponse 'Content-Type'
$robotsBody = [string]$robotsResponse.Content
Check 'robots.txt content type' ($robotsType -match '(?i)text/plain') "Content-Type=$robotsType"
Check 'robots.txt user agent' ($robotsBody -match '(?im)^\s*User-agent:\s*\*\s*$') 'User-agent: * is present.'
Check 'robots.txt allow root' ($robotsBody -match '(?im)^\s*Allow:\s*/\s*$') 'Allow: / is present.'
Check 'robots.txt does not disallow root' ($robotsBody -notmatch '(?im)^\s*Disallow:\s*/\s*$') `
    'Disallow: / is absent.'
Check 'robots.txt sitemap origin' ($robotsBody -match "(?im)^\s*Sitemap:\s*$([regex]::Escape($origin))/sitemap\.xml\s*$") `
    "Expected sitemap=$origin/sitemap.xml"

$sitemapResponse = Fetch ([uri]::new($BaseUrl, '/sitemap.xml'))
$sitemapType = Header $sitemapResponse 'Content-Type'
$sitemapBody = [string]$sitemapResponse.Content
Check 'sitemap.xml content type' ($sitemapType -match '(?i)(?:application|text)/xml') "Content-Type=$sitemapType"
$sitemapUrls = @(
    [regex]::Matches($sitemapBody, '(?is)<loc>\s*(?<url>https://[^<]+)\s*</loc>') |
        ForEach-Object { $_.Groups['url'].Value.Trim() }
)
Check 'sitemap.xml has URLs' ($sitemapUrls.Count -gt 0) "count=$($sitemapUrls.Count)"
Check 'sitemap.xml URLs unique' (@($sitemapUrls | Sort-Object -Unique).Count -eq $sitemapUrls.Count) `
    "count=$($sitemapUrls.Count) unique=$(@($sitemapUrls | Sort-Object -Unique).Count)"
foreach ($url in $sitemapUrls) {
    $parsed = [uri]$url
    Check "Sitemap HTTPS $url" ($parsed.Scheme -eq 'https') "scheme=$($parsed.Scheme)"
    Check "Sitemap origin $url" ($parsed.GetLeftPart([System.UriPartial]::Authority) -eq $origin) `
        "origin=$($parsed.GetLeftPart([System.UriPartial]::Authority)) expected=$origin"
}
$requiredSitemapPaths = @('/', '/articles/', '/articles/pampers-newborn/', '/memo/', '/about/', '/privacy/', '/disclaimer/')
foreach ($path in $requiredSitemapPaths) {
    Check "Sitemap contains $path" ($sitemapUrls -contains "$origin$path") "expected=$origin$path"
}
Check 'Sitemap excludes 404' (-not ($sitemapUrls | Where-Object { $_ -match '(?i)(?:^|/)404(?:[./]|$)' })) `
    'No 404 URL is listed.'

$notFoundPath = "/__acceptance_missing_$([guid]::NewGuid().ToString('N')).html"
$notFound = Fetch ([uri]::new($BaseUrl, $notFoundPath))
Check-ResponseBoundary 'Generated 404' $notFound 404
$notFoundHtml = Check-HtmlContract $notFoundPath $notFound 'noindex,nofollow' -SkipCanonical
Check 'Generated 404 body' ($notFoundHtml -match 'ページが見つかりません') `
    'Expected Japanese not-found copy is present.'
Check 'Generated 404 recovery link' ($notFoundHtml -match '(?is)<a\b[^>]*href=["'']/["''][^>]*>\s*トップへ戻る\s*</a>') `
    'Top-page recovery link is present.'

$article = Fetch ([uri]::new($BaseUrl, '/articles/pampers-newborn/'))
$articleHtml = [string]$article.Content
$jsonLdBlocks = [regex]::Matches(
    $articleHtml,
    '(?is)<script[^>]+type=["'']application/ld\+json["''][^>]*>(?<json>.*?)</script>'
)
$articleJson = $null
foreach ($block in $jsonLdBlocks) {
    try {
        $candidate = $block.Groups['json'].Value | ConvertFrom-Json -Depth 50
        if ($candidate.'@type' -eq 'Article') { $articleJson = $candidate; break }
    } catch {}
}
Check 'Article JSON-LD' ($null -ne $articleJson) 'Article structured data found and parsed.'
if ($articleJson) {
    Check 'Article JSON-LD URL' ($articleJson.url -eq "$origin/articles/pampers-newborn/") `
        "url=$($articleJson.url)"
    Check 'Article dates' (
        -not [string]::IsNullOrWhiteSpace($articleJson.datePublished) -and
        -not [string]::IsNullOrWhiteSpace($articleJson.dateModified)
    ) 'datePublished and dateModified are present.'
}

$allLinks = @(
    [regex]::Matches($articleHtml, '(?i)href=["''](?<href>https://[^"'']+)["'']') |
        ForEach-Object { $_.Groups['href'].Value }
)
$rakutenLinks = @(
    $allLinks | Where-Object { ([uri]$_).Host -match '(^|\.)rakuten\.co\.jp$|^r10\.to$' }
)
Check 'Rakuten CTA present' ($rakutenLinks.Count -ge 1) "allowed Rakuten links=$($rakutenLinks.Count)"
$disallowedRakuten = @(
    $allLinks | Where-Object {
        $_ -match '(?i)rakuten' -and
        ([uri]$_).Host -notmatch '(^|\.)rakuten\.co\.jp$|^r10\.to$'
    }
)
Check 'Rakuten CTA host allowlist' ($disallowedRakuten.Count -eq 0) `
    "disallowed count=$($disallowedRakuten.Count)"

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
$lines = @(
    '# Production post-deploy verification',
    '',
    "- Result: **$($report.result)**",
    "- Base URL: $origin",
    "- Expected commit: $expectedSha",
    '- Secrets: not included',
    '',
    '## Checks'
)
$lines += @($checks | ForEach-Object { "- [$($_.status)] $($_.name): $($_.detail)" })
$lines | Set-Content -LiteralPath (Join-Path $runDirectory 'report.md') -Encoding utf8
Write-Host "Result: $($report.result)"
Write-Host "Report: $(Join-Path $runDirectory 'report.md')"
if ($hasFailure) { exit 1 }
