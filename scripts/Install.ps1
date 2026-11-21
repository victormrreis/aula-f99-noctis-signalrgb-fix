param(
    # Also install the experimental 2.4 GHz dongle per-key plugin (pre-release, still choppy).
    [switch]$Dongle
)

$ErrorActionPreference = 'Stop'

Write-Host '=== AULA F99 Noctis ABNT2 - SignalRGB 0xC3 fix ===' -ForegroundColor Cyan
Write-Host 'No keyboard firmware will be flashed.' -ForegroundColor DarkGray
Write-Host 'No Windows keyboard registry mapping will be changed.' -ForegroundColor DarkGray
Write-Host ''

$documents = [Environment]::GetFolderPath('MyDocuments')
$userPluginDir = Join-Path $documents 'WhirlwindFX\Plugins'
$userPlugin = Join-Path $userPluginDir 'Sinowealth_Keyboard_Controller.js'

# Close SignalRGB processes so plugins reload cleanly.
Get-Process -ErrorAction SilentlyContinue |
    Where-Object { $_.ProcessName -match 'Signal.?RGB|SignalRgb|Signal-x64' } |
    ForEach-Object {
        Write-Host "Closing $($_.ProcessName)..." -ForegroundColor Yellow
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }

New-Item -ItemType Directory -Path $userPluginDir -Force | Out-Null

# --- 2.4 GHz receiver (3554:FA09): optional experimental per-key plugin ---------
# Only with -Dongle. Installed first so the wired section's early exit cannot skip it.
$wirelessName = 'OEM_Keyboard_Wireless_Controller.js'
$wirelessSource = Join-Path $PSScriptRoot "..\plugins\$wirelessName"
$wirelessPlugin = Join-Path $userPluginDir $wirelessName

if (-not $Dongle) {
    Write-Host '2.4G dongle plugin skipped (experimental). Re-run with -Dongle to install it.' -ForegroundColor DarkGray
    Write-Host ''
} elseif (Test-Path $wirelessSource) {
    Write-Host '2.4G dongle plugin is EXPERIMENTAL: per-key works but animation is still choppy.' -ForegroundColor Yellow
    if (Test-Path $wirelessPlugin) {
        $stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
        $wirelessBackup = "$wirelessPlugin.backup_$stamp"
        Copy-Item $wirelessPlugin $wirelessBackup -Force
        Write-Host "Existing 2.4G plugin backed up to:" -ForegroundColor DarkGray
        Write-Host $wirelessBackup -ForegroundColor DarkGray
    }

    Copy-Item $wirelessSource $wirelessPlugin -Force
    Write-Host '2.4G receiver plugin installed (per-key RGB over the dongle).' -ForegroundColor Green
    Write-Host "User plugin: $wirelessPlugin" -ForegroundColor Green
    Write-Host ''
} else {
    Write-Host "2.4G plugin not found next to this script ($wirelessSource); skipping it." -ForegroundColor Yellow
    Write-Host ''
}

# --- Wired (258A:010C): add model ID 195 to the SinoWealth plugin ----------------

# Locate the built-in/CDN plugin. Prefer the current main cache path.
$candidates = @(
    (Join-Path $env:LOCALAPPDATA 'WhirlwindFX\SignalRgb\cache\plugin_cdn\main\Plugins\Sinowealth\Sinowealth_Keyboard_Controller.js')
)

$candidates += Get-ChildItem `
    -Path (Join-Path $env:LOCALAPPDATA 'WhirlwindFX') `
    -Filter 'Sinowealth_Keyboard_Controller.js' `
    -Recurse `
    -File `
    -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notlike "$userPluginDir*" } |
    Select-Object -ExpandProperty FullName

$source = $candidates |
    Where-Object { $_ -and (Test-Path $_) } |
    Select-Object -First 1

if (-not $source) {
    throw @"
Could not find SignalRGB's built-in Sinowealth_Keyboard_Controller.js.

Open/update SignalRGB once, close it completely, then run this installer again.
"@
}

Write-Host "Source plugin:" -ForegroundColor DarkGray
Write-Host $source -ForegroundColor DarkGray
Write-Host ''

# Preserve any existing user override.
if (Test-Path $userPlugin) {
    $stamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    $backup = "$userPlugin.backup_$stamp"
    Copy-Item $userPlugin $backup -Force
    Write-Host "Existing user plugin backed up to:" -ForegroundColor DarkGray
    Write-Host $backup -ForegroundColor DarkGray
}

$content = Get-Content $source -Raw -Encoding UTF8

# If already supported upstream, don't create an unnecessary override.
if ($content -match '(?m)^\s*195:\s*\{') {
    Write-Host ''
    Write-Host 'Device ID 195 already exists in the current SignalRGB plugin.' -ForegroundColor Green
    Write-Host 'No patch is necessary. If you have an old user override, remove it and use the stock plugin.' -ForegroundColor Green
    exit 0
}

# Find the existing AULA F99 model entry and add 195 immediately after it.
$pattern = '(?ms)(\s*164:\s*\{\s*name:\s*"AULA F99",\s*image:\s*"https://assets\.signalrgb\.com/devices/brands/aula/keyboards/f99\.png",\s*layout:\s*"F99"\s*\},)'

$addition = @'
$1
            195: {
                name: "AULA F99 Noctis ABNT2",
                image: "https://assets.signalrgb.com/devices/brands/aula/keyboards/f99.png",
                layout: "F99"
            },
'@

$patched = [regex]::Replace($content, $pattern, $addition, 1)

if ($patched -eq $content) {
    throw @"
Could not locate the expected AULA F99 entry in the installed SignalRGB plugin.

The upstream plugin structure may have changed. Do not force the patch.
Open an issue and include the SignalRGB version plus a sanitized device snapshot.
"@
}

Set-Content -Path $userPlugin -Value $patched -Encoding UTF8

$verify = Get-Content $userPlugin -Raw -Encoding UTF8
if ($verify -notmatch '(?m)^\s*195:\s*\{' -or $verify -notmatch 'AULA F99 Noctis ABNT2') {
    throw 'Patch verification failed.'
}

Write-Host ''
Write-Host 'Patch installed successfully.' -ForegroundColor Green
Write-Host "User plugin: $userPlugin" -ForegroundColor Green
Write-Host ''
Write-Host 'Open SignalRGB again.' -ForegroundColor Cyan
Write-Host 'Expected device name: AULA F99 Noctis ABNT2' -ForegroundColor Cyan
