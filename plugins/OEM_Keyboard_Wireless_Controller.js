// User override of SignalRGB's built-in OEM_Keyboard_Wireless_Controller.js
// AULA F99 Noctis over its 2.4 GHz receiver (VID 0x3554 / PID 0xFA09), per-key RGB.
//
// Protocol (from OpenRGB issue #5166 / MR !3027, community reverse engineering):
//   20-byte output report on interface 1, usage page 0xFF02, usage 0x0002
//   [0]=0x13  [1]=0x88 (LED data)  [2]=total packets  [3]=packet index (0-based)
//   [4]=mode|len : 0x10+len = per-key, 0x23 = solid RGB
//   [5..18]=14-byte payload   [19]=sum(bytes 0..18) & 0xFF
//   Per-key payload is a stream of groups [R, G, B, count, keycode x count], split
//   across packets. Keys that are not listed go dark.
//   Keycodes are identical to the wired SinoWealth F99 LED indexes (col*6 + row).
//
// Remove this file from Documents\WhirlwindFX\Plugins to go back to the stock plugin.
export function Name() { return "AULA F99 Noctis (2.4G)"; }
export function VendorId() { return 0x3554; }
export function ProductId() { return [0xFA09]; }
export function Publisher() { return "Community (AULA F99 Noctis 2.4G)"; }
export function Documentation(){ return "troubleshooting"; }
export function Size() { return F99.size; }
export function DeviceType(){ return "keyboard"; }
export function Validate(endpoint) { return endpoint.interface === 1 && endpoint.usage === 0x0002 && endpoint.usage_page === 0xff02 && endpoint.collection === 0x0001; }
export function ImageUrl() { return "https://assets.signalrgb.com/devices/brands/aula/keyboards/f99.png"; }
/* global
shutdownColor:readonly
LightingMode:readonly
forcedColor:readonly
colorPrecision:readonly
packetDelay:readonly
*/
export function ControllableParameters(){
	return [
		{property:"shutdownColor", group:"lighting", label:"Shutdown Color", description: "This color is applied to the device when the System, or SignalRGB is shutting down", min:"0", max:"360", type:"color", default:"#000000"},
		{property:"LightingMode", group:"lighting", label:"Lighting Mode", description: "Determines where the device's RGB comes from. Canvas will pull from the active Effect, while Forced will override it to a specific color", type:"combobox", values:["Canvas", "Forced"], default:"Canvas"},
		{property:"forcedColor", group:"lighting", label:"Forced Color", description: "The color used when 'Forced' Lighting Mode is enabled", min:"0", max:"360", type:"color", default:"#009bde"},
		{property:"colorPrecision", group:"", label:"2.4G Color Precision", description: "Lower precision groups similar colors so fewer wireless packets are needed per frame (smoother effects). Full sends exact colors but updates slower.", type:"combobox", values:["Low (fastest)", "Medium", "High", "Full"], default:"Medium"},
		{property:"packetDelay", group:"", label:"2.4G Packet Delay (ms)", description: "Pause between wireless packets. Raise it if keys flicker or the keyboard lags.", step:"1", type:"number", min:"1", max:"10", default:"3"},
	];
}

const F99 = {
	vLedNames: [
		"Esc", "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10", "F11", "F12", "Del", "Home", "End", "Pgup", "Pgdn",
		"`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-_", "=+", "Backspace", "NumLock", "/", "*", "-",
		"Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\", "Num 7", "Num 8", "Num 9", "+",
		"CapsLock", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter", "Num 4", "Num 5", "Num 6",
		"Left Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Right Shift", "Up Arrow", "Num 1", "Num 2", "Num 3", "Num Enter",
		"Left Ctrl", "Left Win", "Left Alt", "Space", "Right Alt", "Fn", "Right Ctrl", "Left Arrow", "Down Arrow", "Right Arrow", "Num 0", "Num ."
	],
	vLeds: [
		0, 6, 12, 18, 24, 30, 36, 42, 48, 54, 60, 66, 72, 78, 90, 96, 102, 108,
		1, 7, 13, 19, 25, 31, 37, 43, 49, 55, 61, 67, 73, 79, 91, 97, 103, 109,
		2, 8, 14, 20, 26, 32, 38, 44, 50, 56, 62, 68, 74, 80, 92, 98, 104, 110,
		3, 9, 15, 21, 27, 33, 39, 45, 51, 57, 63, 69, 81, 93, 99, 105,
		4, 10, 16, 22, 28, 34, 40, 46, 52, 58, 64, 82, 88, 94, 100, 106, 112,
		5, 11, 17, 35, 53, 59, 65, 83, 89, 95, 101, 107,
	],
	vLedPositions: [
		[0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0], [7, 0], [8, 0], [9, 0], [10, 0], [11, 0], [12, 0], [13, 0], [14, 0], [15, 0], [16, 0], [17, 0],
		[0, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [7, 1], [8, 1], [9, 1], [10, 1], [11, 1], [12, 1], [13, 1], [14, 1], [15, 1], [16, 1], [17, 1],
		[0, 2], [1, 2], [2, 2], [3, 2], [4, 2], [5, 2], [6, 2], [7, 2], [8, 2], [9, 2], [10, 2], [11, 2], [12, 2], [13, 2], [14, 2], [15, 2], [16, 2], [17, 2],
		[0, 3], [1, 3], [2, 3], [3, 3], [4, 3], [5, 3], [6, 3], [7, 3], [8, 3], [9, 3], [10, 3], [11, 3], [13, 3], [14, 3], [15, 3], [16, 3],
		[0, 4], [2, 4], [3, 4], [4, 4], [5, 4], [6, 4], [7, 4], [8, 4], [9, 4], [10, 4], [11, 4], [12, 4], [13, 4], [14, 4], [15, 4], [16, 4], [17, 4],
		[0, 5], [1, 5], [2, 5], [6, 5], [9, 5], [10, 5], [11, 5], [12, 5], [13, 5], [14, 5], [15, 5], [16, 5],
	],
	size: [18, 6],
};

const KEEPALIVE_MS = 500;
let lastFrameKey = "";
let lastSendTime = 0;

export function Initialize() {
	device.setName("AULA F99 Noctis (2.4G)");
	device.setSize(F99.size);
	device.setControllableLeds(F99.vLedNames, F99.vLedPositions);
	device.setImageFromUrl("https://assets.signalrgb.com/devices/brands/aula/keyboards/f99.png");
	device.log(`AULA F99 Noctis 2.4G: per-key mode, ${F99.vLeds.length} keys`);
	lastFrameKey = "";
}

export function Render() {
	sendFrame();
}

export function Shutdown(SystemSuspending) {
	const color = SystemSuspending ? "#000000" : shutdownColor;
	sendFrame(color, true);
}

function quantStep() {
	switch (colorPrecision) {
	case "Low (fastest)": return 64;
	case "High": return 8;
	case "Full": return 1;
	default: return 24;
	}
}

function quantize(v, step) {
	if (step <= 1) { return v; }
	const q = Math.round(v / step) * step;

	return q > 255 ? 255 : q;
}

function sendFrame(overrideColor, force) {
	const step = quantStep();
	const groups = new Map(); // "r,g,b" -> [keycodes]

	for (let i = 0; i < F99.vLeds.length; i++) {
		let color;

		if (overrideColor) {
			color = hexToRgb(overrideColor);
		} else if (LightingMode === "Forced") {
			color = hexToRgb(forcedColor);
		} else {
			const [x, y] = F99.vLedPositions[i];
			color = device.color(x, y);
		}

		const r = quantize(color[0], step), g = quantize(color[1], step), b = quantize(color[2], step);

		if (r === 0 && g === 0 && b === 0) { continue; } // unlisted keys go dark

		const k = `${r},${g},${b}`;

		if (!groups.has(k)) { groups.set(k, []); }

		groups.get(k).push(F99.vLeds[i]);
	}

	// Build payload stream: [R, G, B, count, codes...]
	const stream = [];
	const keys = [...groups.keys()].sort();

	for (const k of keys) {
		const codes = groups.get(k);
		const [r, g, b] = k.split(",").map(Number);

		for (let off = 0; off < codes.length; off += 255) {
			const part = codes.slice(off, off + 255);
			stream.push(r, g, b, part.length, ...part);
		}
	}

	const frameKey = stream.join(".");
	const now = Date.now();

	if (!force && frameKey === lastFrameKey && now - lastSendTime < KEEPALIVE_MS) {
		return;
	}

	lastFrameKey = frameKey;
	lastSendTime = now;

	if (stream.length === 0) {
		writeSolid([0, 0, 0]);

		return;
	}

	// Whole board one color -> a single solid-color packet instead of ~8 per-key packets.
	if (groups.size === 1 && [...groups.values()][0].length === F99.vLeds.length) {
		writeSolid(keys[0].split(",").map(Number));

		return;
	}

	const total = Math.ceil(stream.length / 14);
	const delay = Math.max(1, Math.min(10, Number(packetDelay) || 3));

	for (let p = 0; p < total; p++) {
		const chunk = stream.slice(p * 14, p * 14 + 14);
		const packet = new Array(20).fill(0);
		packet[0] = 0x13;
		packet[1] = 0x88;
		packet[2] = total;
		packet[3] = p;
		packet[4] = 0x10 + chunk.length;

		for (let i = 0; i < chunk.length; i++) { packet[5 + i] = chunk[i]; }

		packet[19] = checksum(packet);
		device.write(packet, 20);
		device.pause(delay);
	}
}

function writeSolid(rgb) {
	const packet = new Array(20).fill(0);
	packet[0] = 0x13;
	packet[1] = 0x88;
	packet[2] = 0x01;
	packet[3] = 0x00;
	packet[4] = 0x23;
	packet[5] = rgb[0];
	packet[6] = rgb[1];
	packet[7] = rgb[2];
	packet[19] = checksum(packet);
	device.write(packet, 20);
	device.pause(1);
}

function checksum(packet) {
	let sum = 0;

	for (let i = 0; i < 19; i++) { sum += packet[i]; }

	return sum & 0xFF;
}

function hexToRgb(hex) {
	const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

	return [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)];
}
