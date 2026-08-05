[CmdletBinding()]
param(
    [string]$Repository = 'kaenozu/kuraberu-products',
    [Parameter(Mandatory)][int]$PullRequest,
    [ValidateSet('Failure', 'Success')][string]$ExpectedPhase,
    [string]$RequiredCheck = 'verify',
    [string]$OutputRoot = '.acceptance'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$gh = (Get-Command gh -ErrorAction Stop).Source
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$runDirectory = [System.IO.Path]::GetFullPath(
    (Join-Path $OutputRoot "ruleset-enforcement-$stamp")
)
New-Item -ItemType Directory -Path $runDirectory -Force | Out-Null

$prJson = & $gh api "repos/$Repository/pulls/$PullRequest"
if ($LASTEXITCODE -ne 0) { throw 'Failed to fetch pull request.' }
$pr = $prJson | ConvertFrom-Json -Depth 50
if ($pr.state -ne 'open') { throw 'Evidence PR must be open.' }
$headSha = [string]$pr.head.sha

$checksJson = & $gh api `
    -H 'Accept: application/vnd.github+json' `
    "repos/$Repository/commits/$headSha/check-runs"
if ($LASTEXITCODE -ne 0) { throw 'Failed to fetch check runs.' }
$checks = @(($checksJson | ConvertFrom-Json -Depth 50).check_runs)
$required = @($checks | Where-Object { $_.name -eq $RequiredCheck })
if ($required.Count -ne 1) {
    throw "Expected exactly one $RequiredCheck check run; found $($required.Count)."
}
$check = $required[0]

# Re-fetch after check collection because mergeable_state is computed lazily.
Start-Sleep -Seconds 2
$prJson = & $gh api "repos/$Repository/pulls/$PullRequest"
$pr = $prJson | ConvertFrom-Json -Depth 50
$mergeableState = [string]$pr.mergeable_state

$expectedConclusion = if ($ExpectedPhase -eq 'Failure') { 'failure' } else { 'success' }
$errors = [System.Collections.Generic.List[string]]::new()
if ([string]$check.status -cne 'completed') {
    $errors.Add("Required check is not completed: status=$($check.status)")
}
if ([string]$check.conclusion -cne $expectedConclusion) {
    $errors.Add(
        "Required check conclusion differs: actual=$($check.conclusion) expected=$expectedConclusion"
    )
}
if ($ExpectedPhase -eq 'Failure') {
    if ($mergeableState -notin @('blocked', 'dirty', 'unstable')) {
        $errors.Add("Failure phase is not merge-blocked: mergeable_state=$mergeableState")
    }
} else {
    if ($mergeableState -notin @('clean', 'has_hooks')) {
        $errors.Add("Success phase is not merge-ready: mergeable_state=$mergeableState")
    }
}

$report = [ordered]@{
    result = $(if ($errors.Count -eq 0) { 'PASS' } else { 'BLOCKER' })
    repository = $Repository
    pullRequest = $PullRequest
    headSha = $headSha
    expectedPhase = $ExpectedPhase
    requiredCheck = [ordered]@{
        name = $check.name
        status = $check.status
        conclusion = $check.conclusion
    }
    mergeableState = $mergeableState
    errors = @($errors)
    secretsIncluded = $false
}
$reportPath = Join-Path $runDirectory 'report.json'
$report | ConvertTo-Json -Depth 30 |
    Set-Content -LiteralPath $reportPath -Encoding utf8
Write-Host "Result: $($report.result)"
Write-Host "Report: $reportPath"
if ($errors.Count -gt 0) { exit 1 }
