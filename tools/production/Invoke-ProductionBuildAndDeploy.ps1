[CmdletBinding()]
param(
    [Parameter(Mandatory)][uri]$SiteUrl,
    [string]$PremiumUrl,
    [string]$SarasaraUrl,
    [string]$ContactUrl,
    [string]$ExpectedHead,
    [switch]$UseRakutenApi,
    [switch]$Apply,
    [switch]$AllowDirty,
    [string]$OutputRoot = '.acceptance'
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if ($SiteUrl.Scheme -ne 'https' -or $SiteUrl.AbsolutePath -ne '/') { throw 'SiteUrl must be an HTTPS site root.' }
if (-not $UseRakutenApi -and ([string]::IsNullOrWhiteSpace($PremiumUrl) -or [string]::IsNullOrWhiteSpace($SarasaraUrl))) {
    throw 'Supply both direct Rakuten URLs or use -UseRakutenApi.'
}

function Require-Command([string]$Name) {
    $command = Get-Command $Name -ErrorAction SilentlyContinue
    if (-not $command) { throw "Required command not found: $Name" }
    $command.Source
}
function Run([string]$File, [string[]]$ArgumentList, [string]$LogPath) {
    $lines = @(& $File @ArgumentList 2>&1 | ForEach-Object { "$_" })
    $exitCode = $LASTEXITCODE
    if ($LogPath) { $lines | Set-Content -LiteralPath $LogPath -Encoding utf8 }
    if ($exitCode -ne 0) { throw "$File exited with code $exitCode. See $LogPath" }
    [pscustomobject]@{ ExitCode = $exitCode; Lines = $lines; Text = ($lines -join "`n") }
}
function Read-Secret([string]$Prompt) {
    $secure = Read-Host $Prompt -AsSecureString
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
}
function Resolve-SecretValue([string]$Name, [string]$Prompt) {
    $current = [Environment]::GetEnvironmentVariable($Name, 'Process')
    if (-not [string]::IsNullOrWhiteSpace($current)) { return $current }
    if ($env:GITHUB_ACTIONS -eq 'true' -or -not [Environment]::UserInteractive) {
        throw "$Name is required but was not provided to this non-interactive run."
    }
    $value = Read-Secret $Prompt
    if ([string]::IsNullOrWhiteSpace($value)) { throw "$Name must not be empty." }
    return $value
}

$repo = (Resolve-Path (Join-Path $PSScriptRoot '../..')).Path
$git = Require-Command 'git'
$pnpm = Require-Command 'pnpm'
$head = (Run $git @('-C', $repo, 'rev-parse', 'HEAD') '').Text.Trim()
if ($ExpectedHead -and $head -ne $ExpectedHead) { throw "HEAD changed: actual=$head expected=$ExpectedHead" }
$dirty = (Run $git @('-C', $repo, 'status', '--porcelain') '').Text
if (-not $AllowDirty -and -not [string]::IsNullOrWhiteSpace($dirty)) { throw 'Working tree is not clean.' }

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$runDirectory = [System.IO.Path]::GetFullPath((Join-Path $repo "$OutputRoot/production-build-$stamp"))
New-Item -ItemType Directory -Path $runDirectory -Force | Out-Null
$oldEnv = @{}
$names = @('DEPLOYMENT_ENV','PUBLIC_SITE_URL','PUBLIC_RAKUTEN_PREMIUM_URL','PUBLIC_RAKUTEN_SARASARA_URL','PUBLIC_CONTACT_URL','RAKUTEN_APPLICATION_ID','RAKUTEN_ACCESS_KEY','RAKUTEN_AFFILIATE_ID')
foreach ($name in $names) { $oldEnv[$name] = [Environment]::GetEnvironmentVariable($name, 'Process') }

try {
    $env:DEPLOYMENT_ENV = 'production'
    $env:PUBLIC_SITE_URL = $SiteUrl.GetLeftPart([System.UriPartial]::Authority)
    $env:PUBLIC_CONTACT_URL = $ContactUrl
    if ($UseRakutenApi) {
        $env:PUBLIC_RAKUTEN_PREMIUM_URL = $null
        $env:PUBLIC_RAKUTEN_SARASARA_URL = $null
        $env:RAKUTEN_APPLICATION_ID = Resolve-SecretValue 'RAKUTEN_APPLICATION_ID' 'Rakuten application ID'
        $env:RAKUTEN_ACCESS_KEY = Resolve-SecretValue 'RAKUTEN_ACCESS_KEY' 'Rakuten access key'
        $env:RAKUTEN_AFFILIATE_ID = Resolve-SecretValue 'RAKUTEN_AFFILIATE_ID' 'Rakuten affiliate ID'
    } else {
        $env:PUBLIC_RAKUTEN_PREMIUM_URL = $PremiumUrl
        $env:PUBLIC_RAKUTEN_SARASARA_URL = $SarasaraUrl
        $env:RAKUTEN_APPLICATION_ID = $null
        $env:RAKUTEN_ACCESS_KEY = $null
        $env:RAKUTEN_AFFILIATE_ID = $null
    }

    Push-Location $repo
    try {
        Run $pnpm @('install', '--frozen-lockfile') (Join-Path $runDirectory 'install.log') | Out-Null
        Run $pnpm @('validate:env') (Join-Path $runDirectory 'validate-env.log') | Out-Null
        Run $pnpm @('verify') (Join-Path $runDirectory 'verify.log') | Out-Null
        Run $pnpm @('build') (Join-Path $runDirectory 'build.log') | Out-Null
        Run $pnpm @('check:rendered') (Join-Path $runDirectory 'check-rendered.log') | Out-Null
        Run $pnpm @('check:deployment') (Join-Path $runDirectory 'check-deployment.log') | Out-Null
        Run $pnpm @('check:external-link-syntax') (Join-Path $runDirectory 'check-links.log') | Out-Null
        if ($Apply) {
            if (-not $env:CLOUDFLARE_API_TOKEN) { throw 'CLOUDFLARE_API_TOKEN is required for -Apply.' }
            if (-not $env:CLOUDFLARE_ACCOUNT_ID) { throw 'CLOUDFLARE_ACCOUNT_ID is required for -Apply.' }
            # 本番は Cloudflare Pages プロジェクト(kuraberu-products.pages.dev)への Direct Upload。
            # functions/ は実行ディレクトリに存在すれば自動でバンドルされる。
            # --branch=main は production_branch(本番ブランチ)への本番デプロイを明示する。
            Run $pnpm @('exec', 'wrangler', 'pages', 'deploy', 'dist', '--project-name', 'kuraberu-products', '--branch=main') (Join-Path $runDirectory 'wrangler-deploy.log') | Out-Null
        }
    } finally { Pop-Location }

    $report = [ordered]@{
        result = 'PASS'
        mode = $(if ($Apply) { 'DEPLOYED' } else { 'DRY_RUN' })
        generatedAt = (Get-Date).ToString('o')
        repositoryHead = $head
        siteOrigin = $SiteUrl.GetLeftPart([System.UriPartial]::Authority)
        purchaseLinkMode = $(if ($UseRakutenApi) { 'rakuten-api' } else { 'direct-urls' })
        deploymentOutputRecorded = $Apply
        secretsIncluded = $false
    }
    $report | ConvertTo-Json -Depth 20 | Set-Content -LiteralPath (Join-Path $runDirectory 'report.json') -Encoding utf8
    @(
        '# Production build and deploy', '',
        '- Result: **PASS**',
        "- Mode: $($report.mode)",
        "- Repository HEAD: $head",
        "- Site origin: $($report.siteOrigin)",
        "- Purchase-link mode: $($report.purchaseLinkMode)",
        '- Secret values: not included',
        '',
        "Logs: $runDirectory"
    ) | Set-Content -LiteralPath (Join-Path $runDirectory 'report.md') -Encoding utf8
    Write-Host "Result: PASS ($($report.mode))"
    Write-Host "Report: $(Join-Path $runDirectory 'report.md')"
} finally {
    foreach ($name in $names) { [Environment]::SetEnvironmentVariable($name, $oldEnv[$name], 'Process') }
}
