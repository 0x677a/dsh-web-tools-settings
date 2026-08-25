param(
  [string]$DshRoot = $(if ($env:DSH_INSTALL_ROOT) { $env:DSH_INSTALL_ROOT } else { 'D:\deepseek-harness' })
)

$ErrorActionPreference = 'Stop'
$dshProfilePath = Join-Path $DshRoot 'dsh-home\profiles\web'
if (Test-Path -LiteralPath (Join-Path $dshProfilePath 'package.json')) {
  pnpm --dir $dshProfilePath remove dsh-web-tools-settings '@deepseek-ai/dsh-web-fetch-http'
}
& (Join-Path $PSScriptRoot 'scripts\patch-host-apiproxy.ps1') -DshRoot $DshRoot -Restore
Write-Host 'Uninstalled. Restart DSH.'
