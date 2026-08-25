param(
  [string]$DshRoot = $(if ($env:DSH_INSTALL_ROOT) { $env:DSH_INSTALL_ROOT } else { 'D:\deepseek-harness' }),
  [switch]$Restore
)

$ErrorActionPreference = 'Stop'
$packageRoot = Join-Path $DshRoot 'node_modules\@deepseek-ai\dsh-host-apiproxy'
$packageJson = Join-Path $packageRoot 'package.json'
$marker = '// dsh-web-tools-settings: rc6 compatibility patch'
$namespace = 'web-tools'

if (-not (Test-Path -LiteralPath $packageJson)) {
  throw "Cannot find @deepseek-ai/dsh-host-apiproxy under $DshRoot. Pass -DshRoot to the DSH installation directory."
}

$dshPackage = Get-Content -Raw -LiteralPath (Join-Path $DshRoot 'node_modules\@deepseek-ai\dsh\package.json') | ConvertFrom-Json
if ($dshPackage.version -ne '0.1.0-rc.6') {
  Write-Host "Detected DSH $($dshPackage.version)."
  Write-Host 'The rc.6 namespace patch is not required/validated for this version; leaving files unchanged.'
  exit 0
}

$targets = @(
  (Join-Path $packageRoot 'lib\index.js'),
  (Join-Path $packageRoot 'lib\types\api-proxy.js')
)

foreach ($target in $targets) {
  if (-not (Test-Path -LiteralPath $target)) { throw "Missing expected host apiproxy file: $target" }
  $backup = "$target.dsh-web-tools-settings.bak"
  $content = Get-Content -Raw -LiteralPath $target

  if ($Restore) {
    if ($content.Contains($marker) -and (Test-Path -LiteralPath $backup)) {
      Copy-Item -LiteralPath $backup -Destination $target -Force
      Remove-Item -LiteralPath $backup -Force
      Write-Host "Restored $target"
    } else {
      Write-Host "No matching backup for $target; skipped."
    }
    continue
  }

  if ($content.Contains($marker)) {
    Write-Host "Already patched: $target"
    continue
  }

  # A future DSH with self-declared settings exposure does not need this rc.6
  # allowlist edit. This keeps the installer safe across the release line.
  if ($content.Contains('expose: "web"') -or $content.Contains("expose: 'web'")) {
    Write-Host "Generic settings exposure detected in $target; skipped."
    continue
  }

  $needle = 'const WEB_SETTINGS_NAMESPACES = ['
  if (-not $content.Contains($needle)) { throw "The expected rc.6 namespace allowlist is missing from $target; refusing an unsafe rewrite." }
  Copy-Item -LiteralPath $target -Destination $backup -Force
  $replacement = "$marker`r`n$needle`r`n`t`"$namespace`"," 
  $patched = $content.Replace($needle, $replacement)
  Set-Content -LiteralPath $target -Value $patched -Encoding UTF8 -NoNewline
  Write-Host "Patched $target"
}

if (-not $Restore) {
  Write-Host 'Restart DSH after this patch. The backup files are kept beside the patched files for uninstall.'
}
