# Changelog

## v1.1.0

- Adds `plugins/OEM_Keyboard_Wireless_Controller.js`: per-key RGB over the 2.4 GHz receiver (`3554:FA09`), which the stock plugin shows as a single-LED "OEM Wireless Keyboard". Protocol based on OpenRGB issue #5166.
- Reuses the F99 layout: the receiver keycodes match the wired LED indexes.
- Calibrated on hardware: frames are reduced to an adaptive median-cut palette that fits a packet budget (default 10 packets) and paced to ~180 packets/s, which keeps animation smooth over 2.4G.
- Adds 2.4G Smoothness / Colors (packet budget) and 2.4G Log Stats settings.
- Avoids the solid-color command (0x23) for animation; it stutters on this keyboard.
- Adds diagnostics/2.4g-receiver-measurements.txt with the wired and 2.4G measurements.
- Installer and uninstaller now also install and remove the 2.4G plugin, with backups.

## v1.0.0

- Adds a local installer that maps SinoWealth model/device ID `195 / 0xC3` to the existing SignalRGB `F99` layout.
- Adds a reversible uninstaller with backup restoration.
- Includes sanitized diagnostics and the minimal compatibility change.
- Does not redistribute the full SignalRGB built-in SinoWealth plugin.
