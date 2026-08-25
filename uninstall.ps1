param(
  [string]$DshRoot = $(if ($env:DSH_INSTALL_ROOT) { $env:DSH_INSTALL_ROOT } else { 'D:\deepseek-harness' })
)

$ErrorActionPreference = 'Stop'
$dshProfilePath = Join-Path $DshRoot 'dsh-home\profiles\web'
$dsh = Join-Path $DshRoot 'node_modules\.bin\dsh.cmd'
if (-not (Test-Path -LiteralPath $dsh)) { throw "Cannot find dsh.cmd under $DshRoot." }
$env:DSH_HOME = Join-Path $DshRoot 'dsh-home'
if (Test-Path -LiteralPath (Join-Path $dshProfilePath 'package.json')) {
  & $dsh plugin --profile web remove dsh-web-tools-settings
  if ($LASTEXITCODE -ne 0) { throw "DSH plugin removal failed with exit code $LASTEXITCODE." }
}
& (Join-Path $PSScriptRoot 'scripts\patch-host-apiproxy.ps1') -DshRoot $DshRoot -Restore
Write-Host 'Uninstalled. Restart DSH.'
