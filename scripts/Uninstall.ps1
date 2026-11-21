$ErrorActionPreference = 'Stop'

Write-Host '=== Remove AULA F99 Noctis SignalRGB overrides (wired 0xC3 + 2.4G) ===' -ForegroundColor Cyan

$documents = [Environment]::GetFolderPath('MyDocuments')
$userPluginDir = Join-Path $documents 'WhirlwindFX\Plugins'
$userPlugin = Join-Path $userPluginDir 'Sinowealth_Keyboard_Controller.js'

Get-Process -ErrorAction SilentlyContinue |
    Where-Object { $_.ProcessName -match 'Signal.?RGB|SignalRgb|Signal-x64' } |
    ForEach-Object {
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }

$backups = @(
    Get-ChildItem `
        -Path $userPluginDir `
        -Filter 'Sinowealth_Keyboard_Controller.js.backup_*' `
        -File `
        -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending
)

if (Test-Path $userPlugin) {
    Remove-Item $userPlugin -Force
    Write-Host 'Custom SinoWealth user plugin removed.' -ForegroundColor Yellow
}

if ($backups.Count -gt 0) {
    Copy-Item $backups[0].FullName $userPlugin -Force
    Write-Host 'Restored the previous custom plugin backup:' -ForegroundColor Green
    Write-Host $backups[0].FullName -ForegroundColor Green
} else {
    Write-Host 'No previous custom plugin backup found.' -ForegroundColor DarkGray
    Write-Host 'SignalRGB will use its built-in SinoWealth plugin after restart.' -ForegroundColor Green
}

# --- 2.4 GHz receiver plugin ------------------------------------------------------
$wirelessPlugin = Join-Path $userPluginDir 'OEM_Keyboard_Wireless_Controller.js'

$wirelessBackups = @(
    Get-ChildItem `
        -Path $userPluginDir `
        -Filter 'OEM_Keyboard_Wireless_Controller.js.backup_*' `
        -File `
        -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending
)

Write-Host ''

if (Test-Path $wirelessPlugin) {
    Remove-Item $wirelessPlugin -Force
    Write-Host 'Custom 2.4G receiver plugin removed.' -ForegroundColor Yellow
}

if ($wirelessBackups.Count -gt 0) {
    Copy-Item $wirelessBackups[0].FullName $wirelessPlugin -Force
    Write-Host 'Restored the previous 2.4G plugin backup:' -ForegroundColor Green
    Write-Host $wirelessBackups[0].FullName -ForegroundColor Green
} else {
    Write-Host 'SignalRGB will use its built-in 2.4G (OEM Wireless Keyboard) plugin after restart.' -ForegroundColor Green
}

Write-Host ''
Write-Host 'Open SignalRGB again.' -ForegroundColor Cyan
