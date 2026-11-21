# Changelog

## v1.1.0

- Adds `plugins/OEM_Keyboard_Wireless_Controller.js`: per-key RGB over the 2.4 GHz receiver (`3554:FA09`), which the stock plugin shows as a single-LED "OEM Wireless Keyboard". Protocol based on OpenRGB issue #5166.
- Reuses the F99 layout: the receiver keycodes match the wired LED indexes.
- Adds 2.4G Color Precision and 2.4G Packet Delay settings to tune smoothness against wireless bandwidth.
- Installer and uninstaller now also install and remove the 2.4G plugin, with backups.

## v1.0.0

- Adds a local installer that maps SinoWealth model/device ID `195 / 0xC3` to the existing SignalRGB `F99` layout.
- Adds a reversible uninstaller with backup restoration.
- Includes sanitized diagnostics and the minimal compatibility change.
- Does not redistribute the full SignalRGB built-in SinoWealth plugin.
