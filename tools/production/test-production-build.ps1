[CmdletBinding()]
param()

# Contract tests for Invoke-ProductionBuildAndDeploy.ps1, mirroring the
# post-deploy verification harness (test-postdeploy-verification.ps1):
# each scenario runs the driver as a child pwsh process and asserts the
# exit code, report.json contents and the stub invocation log.
#
#     pwsh -File tools/production/test-production-build.ps1
#
# The build/deploy pipeline must fail fast (no pnpm/build) when the gate
# checks fail, must not deploy without Cloudflare tokens, must wire the
# Rakuten API credentials into the build environment, and must always
# restore the environment it mutates.

$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$driver = Join-Path $PSScriptRoot 'test-production-build-scenario.ps1'
if (-not (Test-Path $driver)) {
    throw "Scenario driver not found: $driver"
}

$expectedChain = @(
    'install --frozen-lockfile', 'validate:env', 'verify', 'build',
    'check:rendered', 'check:deployment', 'check:external-link-syntax'
)

$scenarios = @(
    @{ name = 'dry-run-direct';   exitCode = 0; mode = 'DRY_RUN';  purchaseLinkMode = 'direct-urls'; pnpmCalls = 7; deploy = $false; rakutenEnv = $false; report = $true }
    @{ name = 'apply';            exitCode = 0; mode = 'DEPLOYED'; purchaseLinkMode = 'direct-urls'; pnpmCalls = 8; deploy = $true;  rakutenEnv = $false; report = $true }
    @{ name = 'rakuten-api';      exitCode = 0; mode = 'DRY_RUN';  purchaseLinkMode = 'rakuten-api'; pnpmCalls = 7; deploy = $false; rakutenEnv = $true;  report = $true }
    @{ name = 'head-mismatch';    exitCode = 1; pnpmCalls = 0; deploy = $false; report = $false }
    @{ name = 'dirty-tree';       exitCode = 1; pnpmCalls = 0; deploy = $false; report = $false }
    @{ name = 'apply-no-token';   exitCode = 1; pnpmCalls = 7; deploy = $false; report = $false }
    @{ name = 'invalid-site-url'; exitCode = 1; pnpmCalls = 0; deploy = $false; report = $false }
)

$envNames = @('GITHUB_ACTIONS', 'CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID',
    'RAKUTEN_APPLICATION_ID', 'RAKUTEN_ACCESS_KEY', 'RAKUTEN_AFFILIATE_ID')
$envBefore = @{}
foreach ($name in $envNames) { $envBefore[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }

$failures = [System.Collections.Generic.List[string]]::new()

try {
    foreach ($scenario in $scenarios) {
        $name = $scenario.name
        $stubLog = Join-Path $env:TEMP ("pb-contract-" + $name + '\stub.log')

        # Model GitHub secrets/actions context per scenario.
        $env:GITHUB_ACTIONS = 'true'
        $env:CLOUDFLARE_API_TOKEN = $null
        $env:CLOUDFLARE_ACCOUNT_ID = $null
        $env:RAKUTEN_APPLICATION_ID = $null
        $env:RAKUTEN_ACCESS_KEY = $null
        $env:RAKUTEN_AFFILIATE_ID = $null
        if ($name -eq 'apply') {
            $env:CLOUDFLARE_API_TOKEN = 'test-cf-token'
            $env:CLOUDFLARE_ACCOUNT_ID = 'test-cf-account'
        }
        if ($name -eq 'rakuten-api') {
            $env:RAKUTEN_APPLICATION_ID = 'test-app-id'
            $env:RAKUTEN_ACCESS_KEY = 'test-access-key'
            $env:RAKUTEN_AFFILIATE_ID = 'test-affiliate-id'
        }

        Write-Host "=== Scenario: $name ==="
        & pwsh -NoProfile -NonInteractive -File $driver -Scenario $name
        $exitCode = $LASTEXITCODE
        if ($exitCode -ne $scenario.exitCode) {
            $failures.Add("[$name] exit code: expected $($scenario.exitCode), got $exitCode")
        }

        $lines = if (Test-Path $stubLog) { @(Get-Content -LiteralPath $stubLog) } else { @() }
        $pnpmCalls = @($lines | Where-Object { $_ -like 'pnpm *' -and $_ -notlike 'pnpm env*' })
        if ($pnpmCalls.Count -ne $scenario.pnpmCalls) {
            $failures.Add("[$name] pnpm invocations: expected $($scenario.pnpmCalls), got $($pnpmCalls.Count)")
        }
        if ($pnpmCalls.Count -gt 0) {
            $expected = @($expectedChain)
            if ($scenario.deploy) {
                $expected += 'exec wrangler pages deploy dist --project-name kuraberu-products --branch=main'
            }
            $actualChain = @($pnpmCalls | ForEach-Object { $_ -replace '^pnpm ', '' })
            if (($actualChain -join '|') -ne ($expected -join '|')) {
                $failures.Add("[$name] pnpm chain mismatch: [$($actualChain -join ' -> ')]")
            }
        }

        $deployLine = @($lines | Where-Object { $_ -like 'pnpm exec wrangler pages deploy*' })
        if ($scenario.deploy) {
            if ($deployLine.Count -ne 1) {
                $failures.Add("[$name] expected exactly 1 wrangler deploy line, got $($deployLine.Count)")
            } elseif ($deployLine[0] -notlike '*--project-name kuraberu-products --branch=main') {
                $failures.Add("[$name] wrangler deploy args wrong: $($deployLine[0])")
            }
        } elseif ($deployLine.Count -gt 0) {
            $failures.Add("[$name] wrangler deploy must NOT run in this scenario")
        }

        if ($scenario.rakutenEnv) {
            if (@($lines | Where-Object { $_ -eq 'pnpm env RAKUTEN_APPLICATION_ID=test-app-id' }).Count -eq 0) {
                $failures.Add("[$name] RAKUTEN_APPLICATION_ID was not visible to the build step (env wiring broken)")
            }
        }

        $reportRoot = Join-Path $repo '.acceptance/contract-test'
        $reportPath = Get-ChildItem -Path $reportRoot -Recurse -Filter 'report.json' -ErrorAction SilentlyContinue |
            Sort-Object LastWriteTime -Descending | Select-Object -First 1 -ExpandProperty FullName
        if ($scenario.report) {
            if (-not $reportPath) {
                $failures.Add("[$name] report.json not found under $reportRoot")
                continue
            }
            $report = Get-Content -LiteralPath $reportPath -Raw | ConvertFrom-Json
            if ($report.result -ne 'PASS') { $failures.Add("[$name] report.result expected PASS, got $($report.result)") }
            if ($report.mode -ne $scenario.mode) { $failures.Add("[$name] report.mode expected $($scenario.mode), got $($report.mode)") }
            if ($report.purchaseLinkMode -ne $scenario.purchaseLinkMode) {
                $failures.Add("[$name] report.purchaseLinkMode expected $($scenario.purchaseLinkMode), got $($report.purchaseLinkMode)")
            }
            if ($report.siteOrigin -ne 'https://example.test') { $failures.Add("[$name] report.siteOrigin wrong: $($report.siteOrigin)") }
            if ($report.repositoryHead -ne 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0') {
                $failures.Add("[$name] report.repositoryHead wrong: $($report.repositoryHead)")
            }
            if ($report.deploymentOutputRecorded -ne ($scenario.mode -eq 'DEPLOYED')) {
                $failures.Add("[$name] report.deploymentOutputRecorded wrong: $($report.deploymentOutputRecorded)")
            }
            if ($report.secretsIncluded -ne $false) { $failures.Add("[$name] secretsIncluded must be false") }
        } elseif ($reportPath) {
            $failures.Add("[$name] report.json must NOT be written when the gate fails")
        }
    }
} finally {
    foreach ($name in $envNames) {
        [Environment]::SetEnvironmentVariable($name, $envBefore[$name], 'Process')
    }
}

if ($failures.Count -gt 0) {
    Write-Host ''
    Write-Host 'CONTRACT TEST FAILED:' -ForegroundColor Red
    foreach ($failure in $failures) { Write-Host "  - $failure" }
    exit 1
}

Write-Host ''
Write-Host "All $($scenarios.Count) production build/deploy contract scenarios PASS."
exit 0
