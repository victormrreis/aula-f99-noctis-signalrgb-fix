# AULA F99 Noctis / Brazilian ABNT2 — SignalRGB `0xC3` fix

Community-tested workaround for an **AULA F99 Noctis / Brazilian ABNT2** that SignalRGB detects only as **“Sinowealth Device”**.

## Tested device

- Keyboard: **AULA F99 Noctis**
- Layout: **Brazilian ABNT2**
- USB VID:PID: **`258A:010C`**
- SinoWealth internal model/device ID: **`195` decimal / `0xC3`**
- Connection tested: **USB wired**

SignalRGB successfully opens the keyboard's vendor HID endpoint, but an affected build logs:

```text
Unknown Device ID: [195]
Model not found in library!
Unknown protocol for 195
```

The stock SinoWealth controller already contains the **AULA F99** LED layout. This fix adds `195 / 0xC3` as another F99 variant and reuses that existing layout.

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

4. Restarts are left to the user so SignalRGB reloads cleanly.

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
