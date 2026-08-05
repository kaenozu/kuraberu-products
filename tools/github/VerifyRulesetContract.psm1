Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function New-VerifyRulesetPayload {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)][string]$Branch,
        [Parameter(Mandatory)][string]$RequiredCheck,
        [ValidateSet('None', 'PullRequest', 'Always')][string]$AdminBypass = 'None'
    )

    $bypassActors = @()
    if ($AdminBypass -ne 'None') {
        $bypassActors = @([ordered]@{
            actor_id = 5
            actor_type = 'RepositoryRole'
            bypass_mode = $(
                if ($AdminBypass -eq 'PullRequest') { 'pull_request' }
                else { 'always' }
            )
        })
    }

    return [ordered]@{
        name = "protect-$Branch"
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
                    allowed_merge_methods = @('merge', 'rebase', 'squash')
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
                    required_status_checks = @(
                        [ordered]@{ context = $RequiredCheck }
                    )
                }
            }
        )
    }
}

function ConvertTo-VerifyRulesetContract {
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Ruleset)

    $ruleByType = @{}
    foreach ($rule in @($Ruleset.rules)) {
        if ($null -ne $rule.type) { $ruleByType[[string]$rule.type] = $rule }
    }
    $pullRequest = $ruleByType['pull_request']
    $status = $ruleByType['required_status_checks']
    $bypass = @(
        @($Ruleset.bypass_actors) |
            ForEach-Object {
                [ordered]@{
                    actor_id = [int64]$_.actor_id
                    actor_type = [string]$_.actor_type
                    bypass_mode = [string]$_.bypass_mode
                }
            } |
            Sort-Object actor_type, actor_id, bypass_mode
    )
    $requiredChecks = @(
        @($status.parameters.required_status_checks) |
            ForEach-Object { [string]$_.context } |
            Sort-Object -Unique
    )

    return [ordered]@{
        name = [string]$Ruleset.name
        target = [string]$Ruleset.target
        enforcement = [string]$Ruleset.enforcement
        include = @($Ruleset.conditions.ref_name.include | Sort-Object -Unique)
        exclude = @($Ruleset.conditions.ref_name.exclude | Sort-Object -Unique)
        bypass_actors = $bypass
        deletion = $ruleByType.ContainsKey('deletion')
        non_fast_forward = $ruleByType.ContainsKey('non_fast_forward')
        pull_request = [ordered]@{
            present = $null -ne $pullRequest
            allowed_merge_methods = @(
                @($pullRequest.parameters.allowed_merge_methods) |
                    Sort-Object -Unique
            )
            required_review_thread_resolution =
                [bool]$pullRequest.parameters.required_review_thread_resolution
            required_approving_review_count =
                [int]$pullRequest.parameters.required_approving_review_count
        }
        required_status_checks = [ordered]@{
            present = $null -ne $status
            strict = [bool]$status.parameters.strict_required_status_checks_policy
            do_not_enforce_on_create = [bool]$status.parameters.do_not_enforce_on_create
            contexts = $requiredChecks
        }
    }
}

function Compare-VerifyRulesetContract {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]$Actual,
        [Parameter(Mandatory)]$Expected
    )

    $errors = [System.Collections.Generic.List[string]]::new()
    foreach ($field in @('name', 'target', 'enforcement')) {
        if ([string]$Actual.$field -cne [string]$Expected.$field) {
            $errors.Add("$field differs: actual=$($Actual.$field) expected=$($Expected.$field)")
        }
    }
    foreach ($field in @('include', 'exclude', 'bypass_actors')) {
        $actualJson = $Actual.$field | ConvertTo-Json -Depth 20 -Compress
        $expectedJson = $Expected.$field | ConvertTo-Json -Depth 20 -Compress
        if ($actualJson -cne $expectedJson) {
            $errors.Add("$field differs: actual=$actualJson expected=$expectedJson")
        }
    }
    foreach ($field in @('deletion', 'non_fast_forward')) {
        if ([bool]$Actual.$field -ne [bool]$Expected.$field) {
            $errors.Add("$field differs: actual=$($Actual.$field) expected=$($Expected.$field)")
        }
    }
    foreach ($field in @(
        'present',
        'required_review_thread_resolution',
        'required_approving_review_count'
    )) {
        if ($Actual.pull_request.$field -ne $Expected.pull_request.$field) {
            $errors.Add("pull_request.$field differs")
        }
    }
    $actualMergeMethods = $Actual.pull_request.allowed_merge_methods |
        ConvertTo-Json -Compress
    $expectedMergeMethods = $Expected.pull_request.allowed_merge_methods |
        ConvertTo-Json -Compress
    if ($actualMergeMethods -cne $expectedMergeMethods) {
        $errors.Add('pull_request.allowed_merge_methods differs')
    }
    foreach ($field in @('present', 'strict', 'do_not_enforce_on_create')) {
        if (
            $Actual.required_status_checks.$field -ne
            $Expected.required_status_checks.$field
        ) {
            $errors.Add("required_status_checks.$field differs")
        }
    }
    $actualChecks = $Actual.required_status_checks.contexts | ConvertTo-Json -Compress
    $expectedChecks = $Expected.required_status_checks.contexts | ConvertTo-Json -Compress
    if ($actualChecks -cne $expectedChecks) {
        $errors.Add('required_status_checks.contexts differs')
    }
    return @($errors)
}

function Get-CanonicalJsonSha256 {
    [CmdletBinding()]
    param([Parameter(Mandatory)]$Value)

    $json = $Value | ConvertTo-Json -Depth 100 -Compress
    $bytes = [Text.Encoding]::UTF8.GetBytes($json)
    $hash = [Security.Cryptography.SHA256]::HashData($bytes)
    return [Convert]::ToHexString($hash)
}

Export-ModuleMember -Function @(
    'New-VerifyRulesetPayload',
    'ConvertTo-VerifyRulesetContract',
    'Compare-VerifyRulesetContract',
    'Get-CanonicalJsonSha256'
)
