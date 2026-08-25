param(
  [string]$DshRoot = $(if ($env:DSH_INSTALL_ROOT) { $env:DSH_INSTALL_ROOT } else { 'D:\deepseek-harness' }),
  [string]$PluginSpec = 'github:0x677a/dsh-web-tools-settings'
)

$ErrorActionPreference = 'Stop'
$dsh = Join-Path $DshRoot 'node_modules\.bin\dsh.cmd'
if (-not (Test-Path -LiteralPath $dsh)) { throw "Cannot find dsh.cmd under $DshRoot." }

$dshHomePath = Join-Path $DshRoot 'dsh-home'
$env:DSH_HOME = $dshHomePath
Write-Host "Installing dsh-web-tools-settings into profile web from $PluginSpec"
& $dsh plugin --profile web add --save-exact --force $PluginSpec
if ($LASTEXITCODE -ne 0) { throw "DSH plugin installation failed with exit code $LASTEXITCODE." }

& (Join-Path $PSScriptRoot 'scripts\patch-host-apiproxy.ps1') -DshRoot $DshRoot
Write-Host ''
Write-Host 'Installed. Restart DSH, then open Settings > Plugins > Plugin configuration > Web fetch.'
