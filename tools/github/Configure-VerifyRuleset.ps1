[CmdletBinding()]
param(
    [string]$Repository = 'kaenozu/kuraberu-products',
    [string]$Branch = 'main',
    [string]$RequiredCheck = 'verify',
    [ValidateSet('None', 'PullRequest', 'Always')][string]$AdminBypass = 'None',
    [switch]$Apply,
    [string]$ConfirmApply,
    [string]$OutputRoot = '.acceptance'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$gh = (Get-Command gh -ErrorAction Stop).Source
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$runDirectory = [System.IO.Path]::GetFullPath((Join-Path $OutputRoot "ruleset-$stamp"))
New-Item -ItemType Directory -Path $runDirectory -Force | Out-Null
$name = "protect-$Branch"
$bypassActors = @()
if ($AdminBypass -ne 'None') {
    $bypassActors = @([ordered]@{
        actor_id = 5
        actor_type = 'RepositoryRole'
        bypass_mode = $(if ($AdminBypass -eq 'PullRequest') { 'pull_request' } else { 'always' })
    })
}
$payload = [ordered]@{
    name = $name
    target = 'branch'
    enforcement = 'active'
    bypass_actors = $bypassActors
    conditions = [ordered]@{
        ref_name = [ordered]@{
            include = @("refs/heads/$Branch")
            exclude = @()
        }
    }
    rules = @(
        [ordered]@{ type = 'deletion' },
        [ordered]@{ type = 'non_fast_forward' },
        [ordered]@{
            type = 'pull_request'
            parameters = [ordered]@{
                allowed_merge_methods = @('squash', 'merge', 'rebase')
                dismiss_stale_reviews_on_push = $false
                require_code_owner_review = $false
                require_last_push_approval = $false
                required_approving_review_count = 0
                required_review_thread_resolution = $true
            }
        },
        [ordered]@{
            type = 'required_status_checks'
            parameters = [ordered]@{
                do_not_enforce_on_create = $false
                strict_required_status_checks_policy = $true
                required_status_checks = @([ordered]@{ context = $RequiredCheck })
            }
        }
    )
}
$payloadPath = Join-Path $runDirectory 'ruleset-payload.json'
$payload | ConvertTo-Json -Depth 30 | Set-Content -LiteralPath $payloadPath -Encoding utf8
Write-Host "Ruleset payload: $payloadPath"
Write-Host "Admin bypass: $AdminBypass"
if (-not $Apply) {
    Write-Host 'Dry run only. Review the payload, then re-run with -Apply -ConfirmApply APPLY_RULESET.'
    return
}
if ($ConfirmApply -ne 'APPLY_RULESET') { throw 'Set -ConfirmApply APPLY_RULESET to mutate repository protection.' }

$existingJson = & $gh api "repos/$Repository/rulesets"
if ($LASTEXITCODE -ne 0) { throw 'Failed to list existing rulesets.' }
$existing = @($existingJson | ConvertFrom-Json) | Where-Object { $_.name -eq $name }
if ($existing.Count -gt 1) { throw "More than one ruleset named $name exists; resolve duplicates manually." }
if ($existing.Count -eq 1) {
    & $gh api --method PUT "repos/$Repository/rulesets/$($existing[0].id)" --input $payloadPath | Out-Null
} else {
    & $gh api --method POST "repos/$Repository/rulesets" --input $payloadPath | Out-Null
}
if ($LASTEXITCODE -ne 0) { throw 'Ruleset mutation failed.' }

$verifiedJson = & $gh api "repos/$Repository/rulesets"
$verified = @($verifiedJson | ConvertFrom-Json) | Where-Object { $_.name -eq $name -and $_.enforcement -eq 'active' }
if ($verified.Count -ne 1) { throw 'Active ruleset could not be verified after mutation.' }
Write-Host "Active ruleset verified: $name (id=$($verified[0].id))."
