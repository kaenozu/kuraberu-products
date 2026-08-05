[CmdletBinding()]
param(
    [string]$Repository = 'kaenozu/kuraberu-products',
    [string]$Environment = 'production',
    [Parameter(Mandatory)][uri]$SiteUrl,
    [string]$PremiumUrl,
    [string]$SarasaraUrl,
    [string]$ContactUrl,
    [switch]$UseRakutenApi,
    [switch]$Apply,
    [string]$ConfirmApply
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$gh = (Get-Command gh -ErrorAction Stop).Source
if ($SiteUrl.Scheme -ne 'https' -or $SiteUrl.AbsolutePath -ne '/') { throw 'SiteUrl must be an HTTPS site root.' }
if (-not $UseRakutenApi -and ([string]::IsNullOrWhiteSpace($PremiumUrl) -or [string]::IsNullOrWhiteSpace($SarasaraUrl))) {
    throw 'Supply both direct Rakuten URLs or use -UseRakutenApi.'
}

$secretNames = @('CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID')
if ($UseRakutenApi) { $secretNames += @('RAKUTEN_APPLICATION_ID', 'RAKUTEN_ACCESS_KEY', 'RAKUTEN_AFFILIATE_ID') }
$variables = [ordered]@{
    DEPLOYMENT_ENV = 'production'
    PUBLIC_SITE_URL = $SiteUrl.GetLeftPart([System.UriPartial]::Authority)
    PUBLIC_CONTACT_URL = $ContactUrl
    PURCHASE_LINK_MODE = $(if ($UseRakutenApi) { 'api' } else { 'direct' })
    PUBLIC_RAKUTEN_PREMIUM_URL = $(if ($UseRakutenApi) { '' } else { $PremiumUrl })
    PUBLIC_RAKUTEN_SARASARA_URL = $(if ($UseRakutenApi) { '' } else { $SarasaraUrl })
}

Write-Host "Repository: $Repository"
Write-Host "Environment: $Environment"
Write-Host "Secrets to configure: $($secretNames -join ', ')"
Write-Host "Variables to configure: $($variables.Keys -join ', ')"
if (-not $Apply) {
    Write-Host 'Dry run only. Re-run with -Apply -ConfirmApply CONFIGURE_PRODUCTION.'
    return
}
if ($ConfirmApply -ne 'CONFIGURE_PRODUCTION') { throw 'Set -ConfirmApply CONFIGURE_PRODUCTION to mutate GitHub settings.' }

& $gh api --method PUT "repos/$Repository/environments/$Environment" | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Failed to create or update the GitHub environment.' }
foreach ($entry in $variables.GetEnumerator()) {
    & $gh variable set $entry.Key --env $Environment --repo $Repository --body ([string]$entry.Value)
    if ($LASTEXITCODE -ne 0) { throw "Failed to set environment variable $($entry.Key)." }
}
foreach ($name in $secretNames) {
    $secure = Read-Host "$name value" -AsSecureString
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    $plain = $null
    try {
        $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer)
        if ([string]::IsNullOrWhiteSpace($plain)) { throw "$name must not be empty." }
        $plain | & $gh secret set $name --env $Environment --repo $Repository --body -
        if ($LASTEXITCODE -ne 0) { throw "Failed to set environment secret $name." }
    } finally {
        $plain = $null
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    }
}

$listedSecrets = @(& $gh secret list --env $Environment --repo $Repository --json name | ConvertFrom-Json)
$listedVariables = @(& $gh variable list --env $Environment --repo $Repository --json name | ConvertFrom-Json)
$missingSecrets = @($secretNames | Where-Object { $_ -notin $listedSecrets.name })
$missingVariables = @($variables.Keys | Where-Object { $_ -notin $listedVariables.name })
if ($missingSecrets.Count -gt 0 -or $missingVariables.Count -gt 0) {
    throw "Configuration verification failed. Missing secrets=$($missingSecrets -join ',') variables=$($missingVariables -join ',')"
}
Write-Host 'Production environment names were configured and verified. Secret values were not read back or printed.'
