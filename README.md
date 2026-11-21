# AULA F99 Noctis / Brazilian ABNT2 — SignalRGB `0xC3` fix

Community-tested workaround for an **AULA F99 Noctis / Brazilian ABNT2** that SignalRGB detects only as **“Sinowealth Device”**.

## Tested device

- Keyboard: **AULA F99 Noctis**
- Layout: **Brazilian ABNT2**
- USB VID:PID: **`258A:010C`**
- SinoWealth internal model/device ID: **`195` decimal / `0xC3`**
- Connections tested: **USB wired** and **2.4 GHz receiver** (`3554:FA09`, per-key, see below)

SignalRGB successfully opens the keyboard's vendor HID endpoint, but an affected build logs:

```text
Unknown Device ID: [195]
Model not found in library!
Unknown protocol for 195
```

The stock SinoWealth controller already contains the **AULA F99** LED layout. This fix adds `195 / 0xC3` as another F99 variant and reuses that existing layout.

## 2.4 GHz receiver (dongle): per-key RGB

> [!WARNING]
> **Not recommended yet.** Per-key RGB over the 2.4 GHz dongle works, but animation is still quite choppy (~21 fps vs ~44 fps wired). For SignalRGB effects, use the **USB cable**. The dongle plugin is included as an experiment.

Over the 2.4 GHz receiver the keyboard enumerates as **`3554:FA09`** ("2.4G Wireless Receiver"). The stock SignalRGB plugin for that ID shows it as **“OEM Wireless Keyboard”** with a single LED (solid color only).

[`plugins/OEM_Keyboard_Wireless_Controller.js`](plugins/OEM_Keyboard_Wireless_Controller.js) replaces that plugin as a user override and shows the keyboard as **AULA F99 Noctis (2.4G)** with the full F99 per-key layout.

- Protocol: 20-byte output reports on interface 1, usage page `0xFF02`. Per-key payload is a stream of `[R, G, B, count, keycodes…]` groups split across packets. Based on community reverse engineering in [OpenRGB issue #5166](https://gitlab.com/CalcProgrammer1/OpenRGB/-/work_items/5166).
- The receiver keycodes are the same values as the wired SinoWealth F99 LED indexes, so the same layout is used on both connections.
- The 2.4G link is the bottleneck (measured, see [`diagnostics/2.4g-receiver-measurements.txt`](diagnostics/2.4g-receiver-measurements.txt)): animation stays smooth only with frames of up to ~10 packets and below ~230 packets/s. A frame with a unique color per key would need ~38 packets.
- So each frame is reduced to an **adaptive palette** (median cut) that fits a packet budget, and frames are paced by size (≤ ~230 packets/s).
- SignalRGB sleeps ~33 ms after every Render by default; since a 10-packet frame already blocks ~28 ms in `device.write`, the plugin calls `device.setFrameRateTarget(60)` to get ~21 fps instead of ~16 fps. SignalRGB marks that API as development-only.
- Even so, 2.4G tops out around ~21 fps (wired: ~44 fps), so fast effects look less fluid than on the cable. Dropping to 8 packets did not change it, which points at the keyboard/radio itself.
- Device settings:
  - **2.4G Smoothness / Colors**: packet budget per frame. *Balanced (10 packets)* is the default; *Smoothest (8)* is safest; *More colors (13)* may stutter.
  - **2.4G Motion Smoothing**: Off / Light / Medium (default) / Strong. Blends each frame with the previous one so colors glide at ~21 fps instead of jumping; stronger reacts a bit later.
  - **2.4G Log Stats**: logs fps, packets/frame and palette size to the device console every 5 s.
- The solid-color command (`0x23`) animates poorly on this keyboard, so single-color frames are sent per-key too.
- The device position on the SignalRGB **Layout** canvas is chosen by SignalRGB, not by plugins. If it lands in an odd spot, move it once; SignalRGB remembers it.
- The extra ABNT2 keys are not mapped, same as the wired layout.

Tested on an AULA F99 Noctis ABNT2 with SignalRGB 2.5.86.

## What the installer does

The repository does **not** redistribute SignalRGB's full built-in SinoWealth plugin.

Instead, `scripts/Install.ps1`:

1. Locates the SignalRGB built-in `Sinowealth_Keyboard_Controller.js` on your PC.
2. Copies it into your SignalRGB **user Plugins** directory.
3. Adds only this model mapping:

```js
195: {
    name: "AULA F99 Noctis ABNT2",
    image: "https://assets.signalrgb.com/devices/brands/aula/keyboards/f99.png",
    layout: "F99"
},
```

4. Copies `plugins/OEM_Keyboard_Wireless_Controller.js` into the same user **Plugins** directory for the 2.4 GHz receiver, backing up any existing copy first.
5. Restarts are left to the user so SignalRGB reloads cleanly.

No keyboard firmware is flashed and no Windows keyboard registry mapping is modified.

## Install

1. Download this repository or the latest Release ZIP.
2. Close SignalRGB completely.
3. Open PowerShell in the extracted folder.
4. Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\Install.ps1
```

5. Open SignalRGB again.

The device should appear as:

```text
AULA F99 Noctis ABNT2
```

instead of:

```text
Sinowealth Device
```

## Uninstall

Run:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\Uninstall.ps1
```

Then reopen SignalRGB.

If a previous custom SinoWealth plugin existed, the uninstaller attempts to restore the newest backup created by the installer.

## Important notes

- **Do not flash keyboard firmware for this fix.**
- This fix was tested on a unit returning model ID **`0xC3 / 195`**.
- `258A:010C` alone is **not enough** to identify an F99 Noctis because multiple SinoWealth devices can share that VID:PID.
- A user plugin override can supersede future SignalRGB built-in updates for that plugin.
- Once SignalRGB adds `0xC3` upstream, remove this override and use the stock plugin again.

## Technical summary

Observed device information:

```text
VID:PID:       258A:010C
Model ID:      195 decimal / 0xC3
HID interface: 1
Usage page:    0xFF00
Collection:    6
```

Before the fix:

```text
Unknown Device ID: [195]
Model not found in library!
Unknown protocol for 195
```

After adding the model mapping, SignalRGB uses the existing `F99` LED layout successfully.

See [`PATCH.md`](PATCH.md) and [`diagnostics/signalrgb-device-id-0xC3.txt`](diagnostics/signalrgb-device-id-0xC3.txt).

## Disclaimer

This is a community workaround and is not an official SignalRGB or AULA release. SignalRGB, WhirlwindFX, AULA and SinoWealth are trademarks or names belonging to their respective owners.
