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

$dryArgs = @()
if ($DryRun) {
  $dryArgs += "--dryrun"
}

Write-Host "Uploading hashed/static assets..."
$syncArgs = @(
  "s3", "sync", "$distPath", "s3://$BucketName",
  "--delete",
  "--exclude", "index.html",
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

if ($DryRun) {
  Write-Host "Dry run enabled. CloudFront invalidation skipped."
  exit 0
}

Write-Host "Creating CloudFront invalidation..."
$invalidationId = Invoke-Aws @(
  "cloudfront", "create-invalidation",
  "--distribution-id", $DistributionId,
  "--paths", "/", "/index.html",
  "--query", "Invalidation.Id",
  "--output", "text"
)

Write-Host "Invalidation created: $invalidationId"
