param(
  [Parameter(Mandatory = $true)]
  [string]$BucketName,

  [Parameter(Mandatory = $true)]
  [string]$DistributionId,

  [string]$Region = "ap-northeast-2",
  [string]$DistDir = "dist",
  [string]$Profile = "",
  [switch]$SkipBuild,
  [switch]$DryRun
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"
$projectRoot = Resolve-Path (Join-Path $PSScriptRoot "..")

function Invoke-Aws {
  param([string[]]$CommandArgs)
  $awsArgs = @()
  if ($Profile -ne "") {
    $awsArgs += @("--profile", $Profile)
  }
  $awsArgs += @("--region", $Region)
  $awsArgs += $CommandArgs

  Write-Host ("aws " + ($awsArgs -join " "))
  & aws @awsArgs
  if ($LASTEXITCODE -ne 0) {
    throw "AWS command failed with code $LASTEXITCODE"
  }
}

function Get-EnvValue {
  param(
    [string[]]$Names,
    [string]$Default = ""
  )

  foreach ($name in $Names) {
    $value = [System.Environment]::GetEnvironmentVariable($name)
    if (-not [string]::IsNullOrWhiteSpace($value)) {
      return $value.Trim()
    }
  }

  return $Default
}

function To-JsStringLiteral {
  param([AllowNull()][string]$Value)
  if ($null -eq $Value) {
    return "''"
  }

  $escaped = $Value.Replace("\", "\\").Replace("'", "\'")
  return "'" + $escaped + "'"
}

if (-not $SkipBuild) {
  Push-Location $projectRoot
  try {
    Write-Host "Building frontend..."
    npm run build
    if ($LASTEXITCODE -ne 0) {
      throw "npm run build failed"
    }
  } finally {
    Pop-Location
  }
}

$distPathInput = $DistDir
if (-not [System.IO.Path]::IsPathRooted($distPathInput)) {
  $candidate = Join-Path $projectRoot $distPathInput
  if (Test-Path $candidate) {
    $distPathInput = $candidate
  }
}
$distPath = Resolve-Path $distPathInput
$indexPath = Join-Path $distPath "index.html"
if (-not (Test-Path $indexPath)) {
  throw "index.html not found in dist directory: $distPath"
}
$appConfigPath = Join-Path $distPath "app-config.js"

$runtimeBackendBaseUrl = Get-EnvValue -Names @(
  "BACKEND_BASE_URL",
  "REACT_APP_BACKEND_BASE_URL",
  "VITE_BACKEND_BASE_URL"
) -Default "/api"
$runtimeKakaoMapKey = Get-EnvValue -Names @(
  "KAKAO_MAP_KEY",
  "VITE_KAKAO_MAP_KEY",
  "REACT_APP_KAKAO_MAP_KEY"
) -Default ""
$runtimeKmaKey = Get-EnvValue -Names @(
  "KMA_KEY",
  "VITE_KMA_KEY",
  "REACT_APP_KMA_KEY"
) -Default ""
$runtimeGeminiApiKey = Get-EnvValue -Names @(
  "GEMINI_API_KEY",
  "VITE_GEMINI_API_KEY",
  "REACT_APP_GEMINI_API_KEY"
) -Default ""

$appConfigContent = @(
  "window.__APP_CONFIG__ = {",
  "  BACKEND_BASE_URL: $(To-JsStringLiteral $runtimeBackendBaseUrl),",
  "  KAKAO_MAP_KEY: $(To-JsStringLiteral $runtimeKakaoMapKey),",
  "  KMA_KEY: $(To-JsStringLiteral $runtimeKmaKey),",
  "  GEMINI_API_KEY: $(To-JsStringLiteral $runtimeGeminiApiKey),",
  "};"
) -join [System.Environment]::NewLine

[System.IO.File]::WriteAllText(
  $appConfigPath,
  $appConfigContent,
  [System.Text.UTF8Encoding]::new($false)
)
Write-Host "Generated app-config.js from environment values."

$dryArgs = @()
if ($DryRun) {
  $dryArgs += "--dryrun"
}

Write-Host "Uploading hashed/static assets..."
$syncArgs = @(
  "s3", "sync", "$distPath", "s3://$BucketName",
  "--delete",
  "--exclude", "index.html",
  "--exclude", "app-config.js",
  "--cache-control", "public,max-age=31536000,immutable"
)
$syncArgs += $dryArgs
Invoke-Aws $syncArgs

Write-Host "Uploading index.html with no-cache..."
$copyArgs = @(
  "s3", "cp", "$indexPath", "s3://$BucketName/index.html",
  "--cache-control", "no-cache,no-store,must-revalidate",
  "--content-type", "text/html; charset=utf-8"
)
$copyArgs += $dryArgs
Invoke-Aws $copyArgs

Write-Host "Uploading app-config.js with no-cache..."
$appConfigCopyArgs = @(
  "s3", "cp", "$appConfigPath", "s3://$BucketName/app-config.js",
  "--cache-control", "no-cache,no-store,must-revalidate",
  "--content-type", "application/javascript; charset=utf-8"
)
$appConfigCopyArgs += $dryArgs
Invoke-Aws $appConfigCopyArgs

if ($DryRun) {
  Write-Host "Dry run enabled. CloudFront invalidation skipped."
  exit 0
}

Write-Host "Creating CloudFront invalidation..."
$invalidationId = Invoke-Aws @(
  "cloudfront", "create-invalidation",
  "--distribution-id", $DistributionId,
  "--paths", "/", "/index.html", "/app-config.js",
  "--query", "Invalidation.Id",
  "--output", "text"
)

Write-Host "Invalidation created: $invalidationId"
