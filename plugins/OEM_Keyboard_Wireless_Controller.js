// User override of SignalRGB's built-in OEM_Keyboard_Wireless_Controller.js
// AULA F99 Noctis over its 2.4 GHz receiver (VID 0x3554 / PID 0xFA09), per-key RGB.
//
// Protocol (OpenRGB issue #5166 / MR !3027, confirmed on hardware):
//   20-byte output report on interface 1, usage page 0xFF02, usage 0x0002
//   [0]=0x13  [1]=0x88 (LED data)  [2]=total packets  [3]=packet index (0-based)
//   [4]=mode|len : 0x10+len = per-key, 0x23 = solid RGB
//   [5..18]=14-byte payload   [19]=sum(bytes 0..18) & 0xFF
//   Per-key payload: stream of groups [R, G, B, count, keycode x count] split across
//   packets. Every message replaces the whole frame: keys not listed go dark.
//   Keycodes are identical to the wired SinoWealth F99 LED indexes (col*6 + row).
//   Model query: 13 05 01 00 .. -> reply byte 10 = model ID (0xC3 = F99 Noctis).
//
// Measured on hardware: the receiver accepts ~1 packet / 3 ms and gives no per-packet
// acknowledgement. A frame with a unique color per key needs ~38 packets (~115 ms),
// so each frame is reduced to an adaptive palette that fits a fixed packet budget.
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
wirelessQuality:readonly
debugStats:readonly
*/
export function ControllableParameters(){
	return [
		{property:"shutdownColor", group:"lighting", label:"Shutdown Color", description: "This color is applied to the device when the System, or SignalRGB is shutting down", min:"0", max:"360", type:"color", default:"#000000"},
		{property:"LightingMode", group:"lighting", label:"Lighting Mode", description: "Determines where the device's RGB comes from. Canvas will pull from the active Effect, while Forced will override it to a specific color", type:"combobox", values:["Canvas", "Forced"], default:"Canvas"},
		{property:"forcedColor", group:"lighting", label:"Forced Color", description: "The color used when 'Forced' Lighting Mode is enabled", min:"0", max:"360", type:"color", default:"#009bde"},
		{property:"wirelessQuality", group:"", label:"2.4G Smoothness / Colors", description: "The 2.4G link carries ~1 packet every 3 ms. Each frame is reduced to the best palette that fits the packet budget: fewer packets = smoother, more packets = more colors per frame.", type:"combobox", values:Object.keys(BUDGETS), default:DEFAULT_BUDGET},
		{property:"debugStats", group:"", label:"2.4G Log Stats", description: "Writes frame rate, packets per frame and palette size to the device console every 5 seconds.", type:"boolean", default:"false"},
	];
}

// Packet budget per frame. Calibrated on hardware: frames of up to ~10 packets animate
// smoothly; 11+ packets, or flooding the link, make the keyboard stutter.
const BUDGETS = {
	"Smoothest (8 packets)": 8,
	"Balanced (10 packets)": 10,
	"More colors (13 packets, may stutter)": 13,
	"Exact colors (slow)": 40,
};
const DEFAULT_BUDGET = "Balanced (10 packets)";
const MIN_FRAME_MS = 40;    // never more than ~25 fps
// Calibrated: the link stays smooth below ~230 packets/s (10 packets at ~22 fps was smooth).
// Frames are spaced by their size; inside a frame packets go back to back, because
// device.write already blocks ~2.5 ms per packet in SignalRGB.
const PACKET_INTERVAL_MS = 4.4;
const MAX_WAIT_MS = 20;     // wait inside Render up to this long to hit the target time
let nextFrameTime = 0;

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

const KEEPALIVE_MS = 500;   // resend an unchanged frame this often
const BLACK_LEVEL = 6;      // channels this dark are treated as off (saves packets)

let lastFrameKey = "";
let lastSendTime = 0;
const stats = { since: 0, frames: 0, packets: 0, colors: 0, sendMs: 0, renders: 0, gapMs: 0, lastRenderEnd: 0 };

export function Initialize() {
	device.setName("AULA F99 Noctis (2.4G)");
	device.setSize(F99.size);
	device.setControllableLeds(F99.vLedNames, F99.vLedPositions);
	device.setImageFromUrl("https://assets.signalrgb.com/devices/brands/aula/keyboards/f99.png");

	// SignalRGB sleeps 1000/target ms after every Render (default ~30 -> ~33 ms idle).
	// A 10-packet frame already blocks ~28 ms in device.write, so at the default the
	// keyboard only got ~16 fps. At 60 the cycle is ~45 ms (~22 fps), which is what
	// animated smoothly on hardware; the packet pacing below still caps the link rate.
	device.setFrameRateTarget(60);

	const model = queryModel();
	device.log(`AULA F99 2.4G: model ID ${model === null ? "unknown" : "0x" + model.toString(16).toUpperCase()}, per-key, ${F99.vLeds.length} keys`);

	lastFrameKey = "";
	stats.since = Date.now();
}

export function Render() {
	const start = Date.now();

	if (stats.lastRenderEnd) { stats.gapMs += start - stats.lastRenderEnd; }

	stats.renders++;
	sendFrame();
	stats.lastRenderEnd = Date.now();
}

export function Shutdown(SystemSuspending) {
	const color = SystemSuspending ? "#000000" : shutdownColor;
	sendFrame(color, true);
}

export function onwirelessQualityChanged() {
	lastFrameKey = "";
}

// --- model query -------------------------------------------------------------------
function queryModel() {
	try {
		const q = new Array(20).fill(0);
		q[0] = 0x13; q[1] = 0x05; q[2] = 0x01;
		q[19] = checksum(q);
		device.write(q, 20);

		for (let i = 0; i < 4; i++) {
			const r = device.read([0x00], 20, 100);

			if (r && r.length >= 11 && r[0] === 0x13 && r[1] === 0x05) {
				return r[10];
			}
		}
	} catch (e) {
		device.log(`AULA F99 2.4G: model query failed (${e})`);
	}

	return null;
}

// --- frame building ----------------------------------------------------------------
function readColors(overrideColor) {
	const fixed = overrideColor ? hexToRgb(overrideColor) : (LightingMode === "Forced" ? hexToRgb(forcedColor) : null);
	const lit = []; // {r,g,b,code}

	for (let i = 0; i < F99.vLeds.length; i++) {
		let c = fixed;

		if (!c) {
			const [x, y] = F99.vLedPositions[i];
			c = device.color(x, y);
		}

		if (c[0] < BLACK_LEVEL && c[1] < BLACK_LEVEL && c[2] < BLACK_LEVEL) { continue; }

		lit.push({ r: c[0], g: c[1], b: c[2], code: F99.vLeds[i] });
	}

	return lit;
}

// Median-cut palette: split the box with the widest channel range until maxColors.
function palettize(lit, maxColors) {
	const exact = new Map();

	for (const p of lit) {
		const k = (p.r << 16) | (p.g << 8) | p.b;

		if (!exact.has(k)) { exact.set(k, []); }

		exact.get(k).push(p.code);
	}

	if (exact.size <= maxColors) {
		return [...exact.entries()].map(([k, codes]) => ({ r: (k >> 16) & 255, g: (k >> 8) & 255, b: k & 255, codes }));
	}

	let boxes = [lit.slice()];

	while (boxes.length < maxColors) {
		let best = -1, bestRange = 0, bestCh = "r";

		for (let i = 0; i < boxes.length; i++) {
			const box = boxes[i];

			if (box.length < 2) { continue; }

			for (const ch of ["r", "g", "b"]) {
				let lo = 255, hi = 0;

				for (const p of box) { if (p[ch] < lo) { lo = p[ch]; } if (p[ch] > hi) { hi = p[ch]; } }

				// Green weighs more for perceived difference.
				const range = (hi - lo) * (ch === "g" ? 1.2 : 1);

				if (range > bestRange) { bestRange = range; best = i; bestCh = ch; }
			}
		}

		if (best < 0 || bestRange === 0) { break; }

		const box = boxes[best].sort((a, b) => a[bestCh] - b[bestCh]);
		const mid = box.length >> 1;
		boxes.splice(best, 1, box.slice(0, mid), box.slice(mid));
	}

	return boxes.map((box) => {
		let r = 0, g = 0, b = 0;

		for (const p of box) { r += p.r; g += p.g; b += p.b; }

		const n = box.length;

		return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n), codes: box.map((p) => p.code) };
	});
}

function sendFrame(overrideColor, force) {
	if (!force) {
		const wait = nextFrameTime - Date.now();

		// SignalRGB calls Render on its own fixed tick (~30 ms). Skipping a tick that
		// lands just before the target time halves the frame rate, so wait out a short
		// remainder instead and keep the pacing exact.
		if (wait > MAX_WAIT_MS) { return; }

		if (wait > 0) { device.pause(wait); }
	}

	const lit = readColors(overrideColor);
	const budget = BUDGETS[wirelessQuality] || BUDGETS[DEFAULT_BUDGET];
	// payload bytes = 4 per color + 1 per lit key; must fit 14 bytes x budget
	const maxColors = Math.max(1, Math.floor((14 * budget - lit.length) / 4));
	const palette = palettize(lit, maxColors);

	// Merge entries that ended up with the same averaged color.
	const merged = new Map();

	for (const e of palette) {
		const k = (e.r << 16) | (e.g << 8) | e.b;

		if (merged.has(k)) { merged.get(k).codes.push(...e.codes); } else { merged.set(k, e); }
	}

	const stream = [];

	for (const e of merged.values()) {
		for (let off = 0; off < e.codes.length; off += 255) {
			const part = e.codes.slice(off, off + 255);
			stream.push(e.r, e.g, e.b, part.length, ...part);
		}
	}

	const frameKey = stream.join(".");
	const now = Date.now();

	if (!force && frameKey === lastFrameKey && now - lastSendTime < KEEPALIVE_MS) {
		return;
	}

	lastFrameKey = frameKey;
	lastSendTime = now;

	let packets;

	// The solid-color command (0x23) animates poorly on this keyboard, so it is only
	// used to turn everything off; single-color frames go out as per-key (8 packets).
	if (stream.length === 0) {
		writeSolid([0, 0, 0]);
		packets = 1;
	} else {
		packets = writePerKey(stream);
	}

	nextFrameTime = now + Math.max(MIN_FRAME_MS, packets * PACKET_INTERVAL_MS);

	logStats(packets, merged.size, Date.now() - now);
}

function writePerKey(stream) {
	const total = Math.ceil(stream.length / 14);

	for (let p = 0; p < total; p++) {
		const packet = new Array(20).fill(0);
		packet[0] = 0x13;
		packet[1] = 0x88;
		packet[2] = total;
		packet[3] = p;

		const start = p * 14;
		const len = Math.min(14, stream.length - start);
		packet[4] = 0x10 + len;

		for (let i = 0; i < len; i++) { packet[5 + i] = stream[start + i]; }

		packet[19] = checksum(packet);
		device.write(packet, 20);
	}

	return total;
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
}

function logStats(packets, colors, ms) {
	stats.frames++;
	stats.packets += packets;
	stats.colors += colors;
	stats.sendMs += ms;

	const now = Date.now();

	if (now - stats.since >= 5000) {
		if (debugStats === true || debugStats === "true") {
			const s = (now - stats.since) / 1000;
			device.log(`AULA F99 2.4G: ${(stats.frames / s).toFixed(1)} fps sent, ${(stats.packets / stats.frames).toFixed(1)} pkt/frame, ${(stats.colors / stats.frames).toFixed(1)} colors/frame, ${(stats.sendMs / stats.frames).toFixed(1)} ms/frame, ${(stats.renders / s).toFixed(1)} Render calls/s, ${(stats.gapMs / Math.max(1, stats.renders)).toFixed(1)} ms idle between calls`);
		}

		stats.since = now; stats.frames = 0; stats.packets = 0; stats.colors = 0; stats.sendMs = 0; stats.renders = 0; stats.gapMs = 0;
	}
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
