[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [ValidateSet('dry-run-direct', 'apply', 'rakuten-api', 'head-mismatch', 'dirty-tree', 'apply-no-token', 'invalid-site-url')]
    [string]$Scenario
)

# Scenario driver for Invoke-ProductionBuildAndDeploy.ps1's contract tests.
# It replaces git/pnpm on PATH with deterministic .cmd stubs (windows-latest
# CI runtime), then runs the REAL build/deploy script with scenario-specific
# parameters and environment. The harness (test-production-build.ps1) runs
# this driver as a child process and asserts exit codes, report.json and the
# stub invocation log.
#
#   - dry-run-direct:    direct Rakuten URLs, no -Apply -> DRY_RUN, full pnpm chain
#   - apply:             -Apply with Cloudflare tokens -> DEPLOYED + wrangler deploy
#   - rakuten-api:       -UseRakutenApi -> rakuten-api mode and RAKUTEN_* env wiring
#   - head-mismatch:     ExpectedHead differs from git HEAD -> fail BEFORE any build
#   - dirty-tree:        git status non-empty without -AllowDirty -> fail BEFORE build
#   - apply-no-token:    -Apply without CLOUDFLARE_API_TOKEN -> fail, no deploy
#   - invalid-site-url:  non-HTTPS SiteUrl -> validation throw, nothing invoked
#
# Every scenario also asserts that the script's finally block restores the
# process environment it mutated (DEPLOYMENT_ENV / PUBLIC_* / RAKUTEN_* /
# PUBLIC_BUILD_SHA), guarding the deploy pipeline against env leakage.

$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$scriptUnderTest = Join-Path $PSScriptRoot 'Invoke-ProductionBuildAndDeploy.ps1'
if (-not (Test-Path $scriptUnderTest)) {
    throw "Script under test not found: $scriptUnderTest"
}

# --- stub executables -------------------------------------------------------
# PowerShell's Join-Path does not honour an absolute second path on Windows
# (it concatenates), so the script's report lands under the repo. Keep it
# under the gitignored .acceptance/ tree and clean it per scenario.
$script:StubOutputRoot = '.acceptance/contract-test'
$repoOutputRoot = Join-Path $repo $script:StubOutputRoot
if (Test-Path $repoOutputRoot) { Remove-Item $repoOutputRoot -Recurse -Force }

$StubTempRoot = Join-Path $env:TEMP ("pb-contract-" + $Scenario)
if (Test-Path $StubTempRoot) { Remove-Item $StubTempRoot -Recurse -Force }
New-Item -ItemType Directory -Path $StubTempRoot -Force | Out-Null
$StubLog = Join-Path $StubTempRoot 'stub.log'
$env:STUB_LOG = $StubLog
$env:STUB_GIT_HEAD = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0'
$env:STUB_GIT_STATUS = ''

$gitStub = @(
    '@echo off',
    '>>"%STUB_LOG%" echo git %*',
    'echo %* | findstr /C:"rev-parse" >nul',
    'if errorlevel 1 goto :notrev',
    '>>"%STUB_LOG%" echo git rev-parse=%STUB_GIT_HEAD%',
    'echo %STUB_GIT_HEAD%',
    'exit /b 0',
    ':notrev',
    'echo %* | findstr /C:"status" >nul',
    'if errorlevel 1 exit /b 0',
    '>>"%STUB_LOG%" echo git status=%STUB_GIT_STATUS%',
    'if defined STUB_GIT_STATUS echo %STUB_GIT_STATUS%',
    'exit /b 0'
) -join "`r`n"
$pnpmStub = @(
    '@echo off',
    '>>"%STUB_LOG%" echo pnpm %*',
    '>>"%STUB_LOG%" echo pnpm env RAKUTEN_APPLICATION_ID=%RAKUTEN_APPLICATION_ID%',
    '>>"%STUB_LOG%" echo pnpm env PUBLIC_BUILD_SHA=%PUBLIC_BUILD_SHA%',
    'exit /b 0'
) -join "`r`n"
# The deploy step runs through `pnpm exec wrangler pages deploy`, so the pnpm
# stub is the only one that needs to see it; there is no direct wrangler call.

[System.IO.File]::WriteAllText((Join-Path $StubTempRoot 'git.cmd'), $gitStub + "`r`n", [System.Text.Encoding]::ASCII)
[System.IO.File]::WriteAllText((Join-Path $StubTempRoot 'pnpm.cmd'), $pnpmStub + "`r`n", [System.Text.Encoding]::ASCII)

$env:PATH = "$StubTempRoot;$env:PATH"
$env:GITHUB_ACTIONS = 'true' # makes Resolve-SecretValue fail fast instead of prompting

# --- snapshot process env (the script must restore it in finally) -----------
$script:StubEnvNames = @(
    'DEPLOYMENT_ENV', 'PUBLIC_SITE_URL', 'PUBLIC_RAKUTEN_PREMIUM_URL',
    'PUBLIC_RAKUTEN_SARASARA_URL', 'PUBLIC_CONTACT_URL', 'RAKUTEN_APPLICATION_ID',
    'RAKUTEN_ACCESS_KEY', 'RAKUTEN_AFFILIATE_ID', 'PUBLIC_BUILD_SHA'
)
$script:StubEnvBefore = @{}
foreach ($name in $script:StubEnvNames) {
    $script:StubEnvBefore[$name] = [Environment]::GetEnvironmentVariable($name, 'Process')
}

# --- run the real script -----------------------------------------------------
$script:StubExitCode = 0
$script:StubError = $null
try {
    $parameters = @{
        SiteUrl     = 'https://example.test'
        PremiumUrl  = 'https://hb.afl.rakuten.co.jp/hgc/premium-link'
        SarasaraUrl = 'https://hb.afl.rakuten.co.jp/hgc/sarasara-link'
        ContactUrl  = 'https://example.test/contact/'
        OutputRoot  = $script:StubOutputRoot
    }
    if ($Scenario -eq 'rakuten-api') { $parameters.UseRakutenApi = $true }
    if ($Scenario -in @('apply', 'apply-no-token')) { $parameters.Apply = $true }
    if ($Scenario -eq 'head-mismatch') { $parameters.ExpectedHead = 'deadbeefdeadbeefdeadbeefdeadbeefdeadbeef' }
    if ($Scenario -eq 'dirty-tree') { $env:STUB_GIT_STATUS = 'M src/pages/index.astro' }
    if ($Scenario -eq 'invalid-site-url') { $parameters.SiteUrl = 'http://example.test' }

    & $scriptUnderTest @parameters
} catch {
    $script:StubExitCode = 1
    $script:StubError = $_.Exception.Message
} finally {
    foreach ($name in $script:StubEnvNames) {
        [Environment]::SetEnvironmentVariable($name, $script:StubEnvBefore[$name], 'Process')
    }
}

# --- assert environment restoration ------------------------------------------
$script:StubRestoreFailures = @()
foreach ($name in $script:StubEnvNames) {
    # [string] normalises the unset-vs-empty quirk: PowerShell's
    # SetEnvironmentVariable($null) writes '' on Windows, so a restored
    # 'unset' state surfaces as ''. Treating both as equal keeps the
    # contract meaningful (real leaks, e.g. a leftover PUBLIC_BUILD_SHA,
    # still differ).
    $after = [string][Environment]::GetEnvironmentVariable($name, 'Process')
    $before = [string]$script:StubEnvBefore[$name]
    if ($after -ne $before) {
        $script:StubRestoreFailures += "${name}: before='$before' after='$after'"
    }
}
if ($script:StubRestoreFailures.Count -gt 0) {
    Write-Host "ENV RESTORE FAILED for scenario ${Scenario}:" -ForegroundColor Red
    foreach ($item in $script:StubRestoreFailures) { Write-Host "  - $item" }
    exit 1
}

Write-Host "[scenario $Scenario] exit=$script:StubExitCode"
if ($script:StubError) { Write-Host "  error: $script:StubError" }
exit $script:StubExitCode
