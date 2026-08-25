param(
  [string]$DshRoot = $(if ($env:DSH_INSTALL_ROOT) { $env:DSH_INSTALL_ROOT } else { 'D:\deepseek-harness' })
)

$ErrorActionPreference = 'Stop'
$repoRoot = (Resolve-Path (Join-Path $PSScriptRoot '.')).Path
$dsh = Join-Path $DshRoot 'node_modules\.bin\dsh.cmd'
if (-not (Test-Path -LiteralPath $dsh)) { throw "Cannot find dsh.cmd under $DshRoot." }

$dshHomePath = Join-Path $DshRoot 'dsh-home'
$env:DSH_HOME = $dshHomePath
$packDir = Join-Path $repoRoot '.dsh-package'
New-Item -ItemType Directory -Force -Path $packDir | Out-Null
Push-Location $repoRoot
try {
  Write-Host "Packing dsh-web-tools-settings from $repoRoot"
  $packName = npm pack --silent --pack-destination $packDir
} finally {
  Pop-Location
}
if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($packName)) { throw 'npm pack failed.' }
$packageFile = Join-Path $packDir ([IO.Path]::GetFileName(($packName | Select-Object -Last 1)))
if (-not (Test-Path -LiteralPath $packageFile)) { throw "npm pack did not produce $packageFile." }

Write-Host "Installing the packed plugin into profile web: $packageFile"
& $dsh plugin --profile web add $packageFile
if ($LASTEXITCODE -ne 0) { throw "DSH plugin installation failed with exit code $LASTEXITCODE." }

& (Join-Path $PSScriptRoot 'scripts\patch-host-apiproxy.ps1') -DshRoot $DshRoot
Write-Host ''
Write-Host 'Installed. Restart DSH, then open Settings > Plugins > Plugin configuration > Web fetch.'
