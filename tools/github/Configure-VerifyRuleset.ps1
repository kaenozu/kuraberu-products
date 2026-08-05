[CmdletBinding()]
param(
    [string]$Repository = 'kaenozu/kuraberu-products',
    [string]$Branch = 'feat/affiliate-site-foundation',
    [string]$RequiredCheck = 'verify',
    [ValidateSet('None', 'PullRequest', 'Always')][string]$AdminBypass = 'None',
    [switch]$Apply,
    [string]$ConfirmApply,
    [string]$OutputRoot = '.acceptance'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
Import-Module (Join-Path $PSScriptRoot 'VerifyRulesetContract.psm1') -Force
$gh = (Get-Command gh -ErrorAction Stop).Source

if ($Repository -notmatch '^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$') {
    throw 'Repository must use owner/name form.'
}
if ([string]::IsNullOrWhiteSpace($Branch)) { throw 'Branch must not be empty.' }
if ([string]::IsNullOrWhiteSpace($RequiredCheck)) {
    throw 'RequiredCheck must not be empty.'
}

$repositoryInfoJson = & $gh api "repos/$Repository"
if ($LASTEXITCODE -ne 0) { throw 'Failed to read repository metadata.' }
$repositoryInfo = $repositoryInfoJson | ConvertFrom-Json -Depth 20
if ([string]$repositoryInfo.default_branch -cne $Branch) {
    throw "Branch is not the current default branch: actual=$($repositoryInfo.default_branch) requested=$Branch"
}

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$runDirectory = [System.IO.Path]::GetFullPath(
    (Join-Path $OutputRoot "ruleset-$stamp")
)
New-Item -ItemType Directory -Path $runDirectory -Force | Out-Null

$payload = New-VerifyRulesetPayload `
    -Branch $Branch `
    -RequiredCheck $RequiredCheck `
    -AdminBypass $AdminBypass
$name = [string]$payload.name
$payloadPath = Join-Path $runDirectory 'ruleset-payload.json'
$payload | ConvertTo-Json -Depth 50 | Set-Content -LiteralPath $payloadPath -Encoding utf8
$expectedContract = ConvertTo-VerifyRulesetContract -Ruleset $payload
$expectedContractPath = Join-Path $runDirectory 'expected-contract.json'
$expectedContract | ConvertTo-Json -Depth 50 |
    Set-Content -LiteralPath $expectedContractPath -Encoding utf8

$rulesetListJson = & $gh api "repos/$Repository/rulesets"
if ($LASTEXITCODE -ne 0) { throw 'Failed to list existing rulesets.' }
$rulesetList = @($rulesetListJson | ConvertFrom-Json -Depth 30)
$fullRulesets = [System.Collections.Generic.List[object]]::new()
foreach ($summary in $rulesetList) {
    $detailJson = & $gh api "repos/$Repository/rulesets/$($summary.id)"
    if ($LASTEXITCODE -ne 0) {
        throw "Failed to fetch existing ruleset id=$($summary.id)."
    }
    $fullRulesets.Add(($detailJson | ConvertFrom-Json -Depth 100))
}
$backupPath = Join-Path $runDirectory 'rulesets-before.json'
@($fullRulesets) | ConvertTo-Json -Depth 100 |
    Set-Content -LiteralPath $backupPath -Encoding utf8

$existing = @($fullRulesets | Where-Object { $_.name -eq $name })
if ($existing.Count -gt 1) {
    throw "More than one ruleset named $name exists; no mutation was attempted."
}
$existingDetail = if ($existing.Count -eq 1) { $existing[0] } else { $null }
$existingHash = if ($null -ne $existingDetail) {
    Get-CanonicalJsonSha256 -Value $existingDetail
} else { $null }
$actualContract = if ($null -ne $existingDetail) {
    ConvertTo-VerifyRulesetContract -Ruleset $existingDetail
} else { $null }
$contractErrors = if ($null -ne $actualContract) {
    @(Compare-VerifyRulesetContract -Actual $actualContract -Expected $expectedContract)
} else {
    @('Ruleset does not exist yet.')
}
$contractDiffPath = Join-Path $runDirectory 'contract-diff.json'
[ordered]@{
    rulesetName = $name
    existingRulesetId = $existingDetail.id
    existingSnapshotSha256 = $existingHash
    errors = $contractErrors
} | ConvertTo-Json -Depth 30 |
    Set-Content -LiteralPath $contractDiffPath -Encoding utf8

Write-Host "Ruleset payload: $payloadPath"
Write-Host "Existing rulesets backup: $backupPath"
Write-Host "Semantic contract diff: $contractDiffPath"
Write-Host "Admin bypass: $AdminBypass"
if (-not $Apply) {
    Write-Host 'Dry run only. Review the complete backup and semantic diff before Apply.'
    return
}
if ($ConfirmApply -cne 'APPLY_RULESET') {
    throw 'Set -ConfirmApply APPLY_RULESET to mutate repository protection.'
}

# Re-fetch the target immediately before mutation. Any change since the backup
# invalidates the reviewed plan and requires a new dry run.
if ($null -ne $existingDetail) {
    $latestJson = & $gh api "repos/$Repository/rulesets/$($existingDetail.id)"
    if ($LASTEXITCODE -ne 0) { throw 'Failed to re-read the target ruleset.' }
    $latest = $latestJson | ConvertFrom-Json -Depth 100
    $latestHash = Get-CanonicalJsonSha256 -Value $latest
    if ($latestHash -cne $existingHash) {
        throw 'Ruleset changed after the backup. Run a new dry run; no mutation was attempted.'
    }
    & $gh api --method PUT `
        "repos/$Repository/rulesets/$($existingDetail.id)" `
        --input $payloadPath | Out-Null
} else {
    $latestListJson = & $gh api "repos/$Repository/rulesets"
    if ($LASTEXITCODE -ne 0) { throw 'Failed to re-list rulesets before creation.' }
    $latestMatches = @(
        @($latestListJson | ConvertFrom-Json -Depth 30) |
            Where-Object { $_.name -eq $name }
    )
    if ($latestMatches.Count -ne 0) {
        throw 'A matching ruleset appeared after the backup. Run a new dry run.'
    }
    & $gh api --method POST "repos/$Repository/rulesets" --input $payloadPath |
        Out-Null
}
if ($LASTEXITCODE -ne 0) { throw 'Ruleset mutation failed.' }

$verifiedListJson = & $gh api "repos/$Repository/rulesets"
if ($LASTEXITCODE -ne 0) { throw 'Failed to list rulesets after mutation.' }
$verifiedMatches = @(
    @($verifiedListJson | ConvertFrom-Json -Depth 30) |
        Where-Object { $_.name -eq $name }
)
if ($verifiedMatches.Count -ne 1) {
    throw 'Exactly one target ruleset was not found after mutation.'
}
$verifiedJson = & $gh api "repos/$Repository/rulesets/$($verifiedMatches[0].id)"
if ($LASTEXITCODE -ne 0) { throw 'Failed to fetch applied ruleset detail.' }
$verifiedDetail = $verifiedJson | ConvertFrom-Json -Depth 100
$verifiedContract = ConvertTo-VerifyRulesetContract -Ruleset $verifiedDetail
$verificationErrors = @(
    Compare-VerifyRulesetContract `
        -Actual $verifiedContract `
        -Expected $expectedContract
)
$afterPath = Join-Path $runDirectory 'ruleset-after.json'
$verifiedDetail | ConvertTo-Json -Depth 100 |
    Set-Content -LiteralPath $afterPath -Encoding utf8
$verificationPath = Join-Path $runDirectory 'verification.json'
[ordered]@{
    result = $(if ($verificationErrors.Count -eq 0) { 'PASS' } else { 'BLOCKER' })
    rulesetId = $verifiedDetail.id
    errors = $verificationErrors
} | ConvertTo-Json -Depth 30 |
    Set-Content -LiteralPath $verificationPath -Encoding utf8
if ($verificationErrors.Count -gt 0) {
    throw "Applied ruleset failed deep verification. See $verificationPath"
}
Write-Host "Ruleset contract verified: $name (id=$($verifiedDetail.id))."
Write-Host "Pre-change backup: $backupPath"
