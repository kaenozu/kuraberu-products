[CmdletBinding()]
param(
    [string]$ExpectedCommitSha = '0123456789abcdef0123456789abcdef01234567',
    [string]$OldCommitSha = 'fedcba9876543210fedcba9876543210fedcba98'
)

# Contract test for Invoke-PostDeployVerification.ps1's CDN propagation
# retry behaviour. Run it from CI (operations-scripts.yml) and locally:
#
#     pwsh -File tools/production/test-postdeploy-verification.ps1
#
# The retry loop must converge on a stale->fresh transition (PASS with
# attempts=2) and must NOT weaken the gate: a permanently stale deployment
# still ends BLOCKER (exit 1) after MaxAttempts.

$ErrorActionPreference = 'Stop'
$driver = Join-Path $PSScriptRoot 'test-postdeploy-verification-scenario.ps1'
if (-not (Test-Path $driver)) {
    throw "Scenario driver not found: $driver"
}

$scenarios = @(
    @{
        name = 'fresh'
        exitCode = 0
        attempts = 1
        results = @('PASS')
        result = 'PASS'
    },
    @{
        name = 'stale-then-fresh'
        exitCode = 0
        attempts = 2
        results = @('BLOCKER', 'PASS')
        result = 'PASS'
    },
    @{
        name = 'permanent-stale'
        exitCode = 1
        attempts = 4
        results = @('BLOCKER', 'BLOCKER', 'BLOCKER', 'BLOCKER')
        result = 'BLOCKER'
    }
)

$failures = [System.Collections.Generic.List[string]]::new()

foreach ($scenario in $scenarios) {
    $name = $scenario.name
    $outputRoot = Join-Path $env:TEMP ("pdv-contract-" + $name)
    Write-Host "=== Scenario: $name ==="
    & pwsh -NoProfile -NonInteractive -File $driver `
        -Scenario $name `
        -ExpectedCommitSha $ExpectedCommitSha `
        -OldCommitSha $OldCommitSha `
        -OutputRoot $outputRoot
    $exitCode = $LASTEXITCODE

    if ($exitCode -ne $scenario.exitCode) {
        $failures.Add("[$name] exit code: expected $($scenario.exitCode), got $exitCode")
    }

    $reportPath = Get-ChildItem -Path $outputRoot -Recurse -Filter 'report.json' -ErrorAction SilentlyContinue |
        Select-Object -First 1 -ExpandProperty FullName
    if (-not $reportPath) {
        $failures.Add("[$name] report.json not found under $outputRoot")
        continue
    }
    $report = Get-Content -LiteralPath $reportPath -Raw | ConvertFrom-Json

    if ($report.result -ne $scenario.result) {
        $failures.Add("[$name] report.result: expected $($scenario.result), got $($report.result)")
    }
    if ($report.attempts -ne $scenario.attempts) {
        $failures.Add("[$name] report.attempts: expected $($scenario.attempts), got $($report.attempts)")
    }
    $actualResults = @($report.resultsPerAttempt)
    if (($actualResults -join ',') -ne ($scenario.results -join ',')) {
        $failures.Add(
            "[$name] report.resultsPerAttempt: expected [$($scenario.results -join ', ')], " +
            "got [$($actualResults -join ', ')]"
        )
    }

    # The gate must not be weakened: a permanently stale deployment's final
    # attempt must still contain the failing build-sha check.
    if ($name -eq 'permanent-stale') {
        $shaCheck = @($report.checks | Where-Object { $_.name -eq 'Deployed commit matches expected SHA' })
        if ($shaCheck.Count -ne 1 -or $shaCheck[0].status -ne 'FAIL') {
            $failures.Add("[permanent-stale] final attempt must FAIL 'Deployed commit matches expected SHA' (gate weakened)")
        }
        $passChecks = @($report.checks | Where-Object { $_.status -eq 'PASS' })
        if ($passChecks.Count -lt 20) {
            $failures.Add("[permanent-stale] expected the unrelated checks to PASS, got $($passChecks.Count) PASS")
        }
    } else {
        $failChecks = @($report.checks | Where-Object { $_.status -eq 'FAIL' })
        if ($failChecks.Count -gt 0) {
            $names = ($failChecks | ForEach-Object { $_.name }) -join ', '
            $failures.Add("[$name] expected all checks to PASS, got FAIL on: $names")
        }
    }
}

if ($failures.Count -gt 0) {
    Write-Host ""
    Write-Host "CONTRACT TEST FAILED:" -ForegroundColor Red
    foreach ($failure in $failures) {
        Write-Host "  - $failure"
    }
    exit 1
}

Write-Host ""
Write-Host "All 3 post-deploy retry contract scenarios PASS."
exit 0
