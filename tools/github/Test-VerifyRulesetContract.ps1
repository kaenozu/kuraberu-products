[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'VerifyRulesetContract.psm1') -Force

function Assert-True([bool]$Value, [string]$Message) {
    if (-not $Value) { throw $Message }
}
function Assert-Equal($Actual, $Expected, [string]$Message) {
    if ($Actual -ne $Expected) {
        throw "$Message. actual=[$Actual] expected=[$Expected]"
    }
}

$payload = New-VerifyRulesetPayload `
    -Branch 'feat/affiliate-site-foundation' `
    -RequiredCheck 'verify' `
    -AdminBypass None
$contract = ConvertTo-VerifyRulesetContract -Ruleset $payload
Assert-Equal $contract.name 'protect-feat/affiliate-site-foundation' 'Name mismatch'
Assert-Equal $contract.enforcement 'active' 'Enforcement mismatch'
Assert-True $contract.deletion 'Deletion rule missing'
Assert-True $contract.non_fast_forward 'Non-fast-forward rule missing'
Assert-True $contract.pull_request.present 'Pull request rule missing'
Assert-True $contract.pull_request.required_review_thread_resolution `
    'Review-thread resolution must be required'
Assert-True $contract.required_status_checks.present 'Status rule missing'
Assert-True $contract.required_status_checks.strict 'Strict status policy missing'
Assert-Equal $contract.required_status_checks.contexts.Count 1 `
    'Unexpected required-check count'
Assert-Equal $contract.required_status_checks.contexts[0] 'verify' `
    'Required check mismatch'
Assert-Equal $contract.bypass_actors.Count 0 'None bypass must be empty'

$pullRequestBypass = New-VerifyRulesetPayload `
    -Branch 'feat/affiliate-site-foundation' `
    -RequiredCheck 'verify' `
    -AdminBypass PullRequest
$pullContract = ConvertTo-VerifyRulesetContract -Ruleset $pullRequestBypass
Assert-Equal $pullContract.bypass_actors.Count 1 'PR bypass missing'
Assert-Equal $pullContract.bypass_actors[0].bypass_mode 'pull_request' `
    'PR bypass mode mismatch'

$alwaysBypass = New-VerifyRulesetPayload `
    -Branch 'feat/affiliate-site-foundation' `
    -RequiredCheck 'verify' `
    -AdminBypass Always
$alwaysContract = ConvertTo-VerifyRulesetContract -Ruleset $alwaysBypass
Assert-Equal $alwaysContract.bypass_actors[0].bypass_mode 'always' `
    'Always bypass mode mismatch'

$reordered = $payload | ConvertTo-Json -Depth 50 | ConvertFrom-Json -Depth 50
$reordered.rules = @($reordered.rules | Sort-Object type -Descending)
$reordered.rules |
    Where-Object type -eq 'pull_request' |
    ForEach-Object {
        $_.parameters.allowed_merge_methods = @('squash', 'merge', 'rebase')
    }
$reorderedContract = ConvertTo-VerifyRulesetContract -Ruleset $reordered
Assert-Equal (
    @(Compare-VerifyRulesetContract -Actual $reorderedContract -Expected $contract).Count
) 0 'Order-only changes must normalize away'

$drifted = $payload | ConvertTo-Json -Depth 50 | ConvertFrom-Json -Depth 50
$statusRule = $drifted.rules | Where-Object type -eq 'required_status_checks'
$statusRule.parameters.strict_required_status_checks_policy = $false
$statusRule.parameters.required_status_checks[0].context = 'other-check'
$drifted.rules = @($drifted.rules | Where-Object type -ne 'deletion')
$driftedContract = ConvertTo-VerifyRulesetContract -Ruleset $drifted
$errors = @(Compare-VerifyRulesetContract -Actual $driftedContract -Expected $contract)
Assert-True ($errors -match '^deletion differs') 'Deletion drift was not detected'
Assert-True ($errors -match 'required_status_checks.strict') `
    'Strict status drift was not detected'
Assert-True ($errors -match 'required_status_checks.contexts') `
    'Required-check drift was not detected'

$hashA = Get-CanonicalJsonSha256 -Value $payload
$hashB = Get-CanonicalJsonSha256 -Value $payload
Assert-Equal $hashA $hashB 'Snapshot hash must be deterministic'
Assert-Equal $hashA.Length 64 'Snapshot hash must be SHA-256 hex'

Write-Host 'Verify ruleset contract tests: PASS'
