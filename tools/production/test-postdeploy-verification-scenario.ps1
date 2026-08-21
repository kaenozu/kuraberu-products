[CmdletBinding()]
param(
    [Parameter(Mandatory)][ValidateSet('fresh', 'stale-then-fresh', 'permanent-stale')]
    [string]$Scenario,
    [string]$ExpectedCommitSha = '0123456789abcdef0123456789abcdef01234567',
    [string]$OldCommitSha = 'fedcba9876543210fedcba9876543210fedcba98',
    [string]$OutputRoot = ''
)

# Scenario driver for Invoke-PostDeployVerification.ps1's CDN propagation
# retry contract. It replaces Invoke-WebRequest with a deterministic stub,
# then dot-sources the REAL verification script so the retry loop, report
# generation and exit-code behaviour are exercised end to end.
#
#   - fresh:          every fetch serves the expected build-sha (PASS on
#                     attempt 1)
#   - stale-then-fresh: the first attempt's article fetches serve the old
#                     build-sha (BLOCKER), then the expected one (PASS on
#                     attempt 2) - simulates CDN edge convergence
#   - permanent-stale: every fetch serves the old build-sha (BLOCKER after
#                     MaxAttempts, exit 1) - the gate must NOT be weakened

$ErrorActionPreference = 'Stop'
if (-not $OutputRoot) {
    $OutputRoot = Join-Path $env:TEMP ("pdv-scenario-" + $Scenario)
}

# NOTE: PowerShell variable names are case-insensitive, and the dot-sourced
# verification script binds its `$BaseUrl` param in THIS scope. Prefix stub
# state with 'Stub' so the param binding cannot clobber it.
$script:StubArticleFetches = 0
$StubBaseUrl = 'https://example.test'

function New-HtmlPage {
    param([string]$Path, [string]$Sha)
    $canonical = "$StubBaseUrl$Path"
    $robots = if ($Path -eq '/memo/') { 'noindex, follow' } else { 'index, follow' }
    $jsonLd = ''
    if ($Path -like '/articles/*') {
        $jsonLd = @"
<script type="application/ld+json">{"@type":"Article","headline":"Stub article","url":"$canonical","datePublished":"2026-08-01T00:00:00Z","dateModified":"2026-08-02T00:00:00Z"}</script>
"@
    }
    @"
<!doctype html>
<html>
<head>
<meta name="robots" content="$robots">
<meta name="build-sha" content="$Sha">
<link rel="canonical" href="$canonical">
$jsonLd
</head>
<body>
<a href="https://hb.afl.rakuten.co.jp/hgc/sample">buy</a>
<a href="https://example.test/other">other</a>
</body>
</html>
"@
}

function Get-ShaForArticle {
    if ($Scenario -eq 'fresh') { return $ExpectedCommitSha }
    if ($Scenario -eq 'permanent-stale') { return $OldCommitSha }
    # stale-then-fresh: the article page is fetched twice per attempt, so
    # the first attempt (fetches 1-2) stays stale and the second converges.
    if ($script:StubArticleFetches -le 1) { return $OldCommitSha }
    return $ExpectedCommitSha
}

function Invoke-WebRequest {
    param(
        [Parameter(Mandatory)][uri]$Uri,
        [int]$MaximumRedirection,
        [int]$TimeoutSec,
        [switch]$SkipHttpErrorCheck
    )
    $path = $Uri.AbsolutePath
    $statusCode = 200
    $contentType = 'text/html; charset=utf-8'
    if ($path -eq '/robots.txt') {
        $contentType = 'text/plain; charset=utf-8'
        $content = "User-agent: *`nAllow: /`n"
    } elseif ($path -eq '/sitemap.xml') {
        $contentType = 'application/xml; charset=utf-8'
        $content = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>'
    } elseif ($path -match '^/__acceptance_missing_') {
        $statusCode = 404
        $content = '<!doctype html><html><head><meta name="robots" content="noindex"></head><body>missing</body></html>'
    } elseif ($path -eq '/articles/pampers-newborn/') {
        $script:StubArticleFetches++
        $content = New-HtmlPage -Path $path -Sha (Get-ShaForArticle)
    } else {
        $content = New-HtmlPage -Path $path -Sha $ExpectedCommitSha
    }
    $headers = @{ 'Content-Type' = $contentType }
    $requestMessage = [pscustomobject]@{ RequestUri = $Uri }
    [pscustomobject]@{
        StatusCode = $statusCode
        Headers = $headers
        Content = $content
        BaseResponse = [pscustomobject]@{ RequestMessage = $requestMessage }
    }
}

$scriptUnderTest = Join-Path $PSScriptRoot 'Invoke-PostDeployVerification.ps1'
if (-not (Test-Path $scriptUnderTest)) {
    throw "Verification script not found: $scriptUnderTest"
}
if (Test-Path $OutputRoot) {
    Remove-Item $OutputRoot -Recurse -Force
}

# Dot-source the real verification script. In some invocation modes
# (pwsh -File) `exit 1` inside a dot-sourced script does NOT become the
# process exit code, so derive the exit code from the report afterwards.
. $scriptUnderTest `
    -BaseUrl $StubBaseUrl `
    -ExpectedCommitSha $ExpectedCommitSha `
    -OutputRoot $OutputRoot `
    -MaxAttempts 4 `
    -RetryDelaySeconds 0

$reportFile = Get-ChildItem -Path $OutputRoot -Recurse -Filter 'report.json' |
    Select-Object -First 1
if (-not $reportFile) {
    throw "report.json not found under $OutputRoot"
}
$result = (Get-Content -LiteralPath $reportFile.FullName -Raw | ConvertFrom-Json).result
if ($result -eq 'BLOCKER') { exit 1 }
exit 0
