$ErrorActionPreference = 'Stop'

Write-Host '=== Remove AULA F99 Noctis SignalRGB 0xC3 override ===' -ForegroundColor Cyan

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

Write-Host ''
Write-Host 'Open SignalRGB again.' -ForegroundColor Cyan
