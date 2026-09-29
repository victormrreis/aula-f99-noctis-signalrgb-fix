# Minimal upstream change

The existing SinoWealth controller already contains an AULA F99 model entry using the `F99` LED layout.

The tested unit reports model/device ID **195 decimal (`0xC3`)**.

The minimal compatibility addition is:

```js
195: {
    name: "AULA F99 Noctis ABNT2",
    image: "https://assets.signalrgb.com/devices/brands/aula/keyboards/f99.png",
    layout: "F99"
},
```

Observed hardware:

```text
USB VID:PID: 258A:010C
Model ID: 195 / 0xC3
HID interface: 1
Usage: 0x0001
Usage page: 0xFF00
Collection: 0x0006
```

Result: the existing SignalRGB `F99` LED layout controls the tested keyboard correctly.
