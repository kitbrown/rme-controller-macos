import assert from "node:assert/strict";
import dgram from "node:dgram";
import {pathToFileURL} from "node:url";

const pluginPath = process.argv[2];
assert(pluginPath, "Usage: node plugin-v1.1-race-test.mjs /path/to/plugin.js");

const HOST = "127.0.0.1";
const SEND_PORT = 17108;
const RX_A = 19108;
const RX_B = 19109;
const PLUGIN = "com.fionetworks.rme-globalosc";
const OUTPUT = `${PLUGIN}.outputvolume`;
const MIX = `${PLUGIN}.mixfader`;
const TOGGLE = `${PLUGIN}.toggle`;
const SNAPSHOT = `${PLUGIN}.snapshot`;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
const pad4 = n => (n + 3) & ~3;

function oscString(value) {
  const raw = Buffer.from(`${value}\0`, "utf8");
  const output = Buffer.alloc(pad4(raw.length));
  raw.copy(output);
  return output;
}
function encode(address, values = [], forcedTags) {
  const tags = forcedTags ?? values.map(value => typeof value === "string" ? "s" : Number.isInteger(value) ? "i" : "f");
  const parts = [oscString(address), oscString(`,${tags.join("")}`)];
  values.forEach((value, index) => {
    const tag = tags[index];
    if (tag === "T" || tag === "F") return;
    if (tag === "s") return parts.push(oscString(value));
    const part = Buffer.alloc(4);
    if (tag === "i") part.writeInt32BE(Number(value));
    else part.writeFloatBE(Number(value));
    parts.push(part);
  });
  return Buffer.concat(parts);
}
function bundle(messages) {
  const parts = [oscString("#bundle"), Buffer.alloc(8)];
  for (const message of messages) {
    const size = Buffer.alloc(4);
    size.writeInt32BE(message.length);
    parts.push(size, message);
  }
  return Buffer.concat(parts);
}
function readString(buffer, offset) {
  const end = buffer.indexOf(0, offset);
  assert(end >= 0);
  return [buffer.toString("utf8", offset, end), pad4(end + 1)];
}
function decode(buffer) {
  let offset = 0;
  let address, tags;
  [address, offset] = readString(buffer, offset);
  [tags, offset] = readString(buffer, offset);
  const values = [];
  for (const tag of tags.slice(1)) {
    if (tag === "f") { values.push(buffer.readFloatBE(offset)); offset += 4; }
    else if (tag === "i") { values.push(buffer.readInt32BE(offset)); offset += 4; }
    else if (tag === "s") { let value; [value, offset] = readString(buffer, offset); values.push(value); }
  }
  return {address, values};
}

class FakeWebSocket {
  static OPEN = 1;
  static instances = [];
  readyState = FakeWebSocket.OPEN;
  listeners = new Map();
  sent = [];
  constructor(url) {
    this.url = url;
    FakeWebSocket.instances.push(this);
    queueMicrotask(() => this.emit("open", {}));
  }
  addEventListener(name, callback) {
    if (!this.listeners.has(name)) this.listeners.set(name, []);
    this.listeners.get(name).push(callback);
  }
  send(value) { this.sent.push(JSON.parse(value)); }
  emit(name, value) { for (const callback of this.listeners.get(name) || []) callback(value); }
  message(value) { this.emit("message", {data: JSON.stringify(value)}); }
  close() { this.readyState = 3; this.emit("close", {}); }
}
globalThis.WebSocket = FakeWebSocket;

const packets = [];
const totalMix = dgram.createSocket("udp4");
totalMix.on("message", packet => packets.push(decode(packet)));
await new Promise(resolve => totalMix.bind(SEND_PORT, HOST, resolve));
const feedback = dgram.createSocket("udp4");
const sendFeedback = (port, packet) => feedback.send(packet, port, HOST);
const settings = (receivePort, extra = {}) => ({host: HOST, sendPort: SEND_PORT, receivePort, ...extra});
const count = address => packets.filter(packet => packet.address === address).length;
const latest = address => packets.filter(packet => packet.address === address).at(-1);
const sent = (ws, event, context) => ws.sent.filter(message => message.event === event && (!context || message.context === context));
const feedbackValues = (ws, context) => sent(ws, "setFeedback", context).map(message => message.payload.value?.value ?? message.payload.value);

async function waitFor(predicate, message, timeout = 1500) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (predicate()) return;
    await sleep(10);
  }
  assert.fail(message);
}

process.argv.push("-port", "12345", "-pluginUUID", PLUGIN, "-registerEvent", "registerPlugin");
await import(`${pathToFileURL(pluginPath).href}?race=${Date.now()}`);
await waitFor(() => FakeWebSocket.instances[0]?.sent.length, "plugin did not register");
const ws = FakeWebSocket.instances[0];
assert.deepEqual(ws.sent[0], {event: "registerPlugin", uuid: PLUGIN});

// No guessed fader state: an early turn alerts, requests state, and sends no control value.
ws.message({event: "willAppear", action: OUTPUT, context: "out", payload: {settings: settings(RX_A, {preset: "custom", label: "Test Out", outputIndex: 2, stepDb: 1})}});
await waitFor(() => count("/sendchan/output/2") >= 1, "output state request missing");
ws.message({event: "dialRotate", action: OUTPUT, context: "out", payload: {ticks: 1}});
await waitFor(() => sent(ws, "showAlert", "out").length === 1, "unsynchronized turn was not blocked");
assert.equal(count("/output/2/volume"), 0, "unsynchronized turn sent a guessed value");

// Simultaneous mix actions share one bulk-state request instead of flooding TotalMix.
const globalBeforeBurst = count("/sendall");
const burstContexts = ["burst-1", "burst-2", "burst-3", "burst-4"];
for (let index = 0; index < burstContexts.length; index += 1) {
  ws.message({
    event: "willAppear",
    action: MIX,
    context: burstContexts[index],
    payload: {settings: settings(RX_A, {preset: "custom", bus: "in", sourceIndex: index, outputIndex: 0})}
  });
}
await waitFor(() => count("/sendall") > globalBeforeBurst, "coalesced global state request missing");
await sleep(100);
assert.equal(count("/sendall"), globalBeforeBurst + 1, "simultaneous actions flooded TotalMix with /sendall");
for (const context of burstContexts) ws.message({event: "willDisappear", context, payload: {}});

// Missing state retries quickly once, then stops immediately after synchronization.
ws.message({event: "willAppear", action: OUTPUT, context: "retry", payload: {settings: settings(RX_A, {preset: "custom", label: "Retry", outputIndex: 12})}});
await waitFor(() => count("/sendchan/output/12") === 1, "initial retry-test state request missing");
const retryStarted = Date.now();
await waitFor(() => count("/sendchan/output/12") === 2, "750 ms state retry missing", 1100);
const firstRetryDelay = Date.now() - retryStarted;
assert(firstRetryDelay >= 600 && firstRetryDelay <= 1100, `first retry occurred at ${firstRetryDelay} ms`);
sendFeedback(RX_A, bundle([
  encode("/output/12/volume", [-12], ["f"]),
  encode("/output/12/mute", [0], ["i"])
]));
await waitFor(() => feedbackValues(ws, "retry").includes("-12.0 dB"), "retry-test state did not synchronize");
await sleep(1600);
assert.equal(count("/sendchan/output/12"), 2, "retry timer continued after synchronization");
ws.message({event: "willDisappear", context: "retry", payload: {}});

sendFeedback(RX_A, bundle([
  encode("/output/2/volume", [-20], ["f"]),
  encode("/output/2/mute", [0], ["i"])
]));
await waitFor(() => feedbackValues(ws, "out").includes("-20.0 dB"), "output did not synchronize");

// Rapid turns are accumulated but coalesced to one outbound fader packet.
ws.message({event: "dialRotate", action: OUTPUT, context: "out", payload: {ticks: 1}});
ws.message({event: "dialRotate", action: OUTPUT, context: "out", payload: {ticks: 2}});
ws.message({event: "dialRotate", action: OUTPUT, context: "out", payload: {ticks: 3}});
await waitFor(() => count("/output/2/volume") === 1, "coalesced output command missing");
assert.equal(latest("/output/2/volume").values[0], -14);

// Contradictory stale UDP feedback cannot roll back a fresh local command.
sendFeedback(RX_A, encode("/output/2/volume", [-20], ["f"]));
await sleep(30);
ws.message({event: "dialRotate", action: OUTPUT, context: "out", payload: {ticks: 1}});
await waitFor(() => count("/output/2/volume") === 2, "second output command missing");
assert.equal(latest("/output/2/volume").values[0], -13, "stale feedback rolled back optimistic state");
sendFeedback(RX_A, encode("/output/2/volume", [-13], ["f"]));

// Mute is feedback-driven, turns are ignored while muted, and red/MUTED feedback is emitted.
ws.message({event: "dialDown", action: OUTPUT, context: "out", payload: {}});
await waitFor(() => count("/output/2/mute") === 1, "output mute missing");
assert.equal(latest("/output/2/mute").values[0], 1);
const volumeCountMuted = count("/output/2/volume");
ws.message({event: "dialRotate", action: OUTPUT, context: "out", payload: {ticks: 8}});
await sleep(50);
assert.equal(count("/output/2/volume"), volumeCountMuted, "muted output accepted a turn");
await waitFor(() => feedbackValues(ws, "out").includes("MUTED"), "muted dial feedback was not rendered");
assert(feedbackValues(ws, "out").includes("MUTED"), "muted dial text missing");
assert(sent(ws, "setFeedback", "out").some(message => message.payload.value?.background === "#74151b"), "muted red background missing");
sendFeedback(RX_A, encode("/output/2/mute", [1], ["i"]));
ws.message({event: "dialDown", action: OUTPUT, context: "out", payload: {}});
await waitFor(() => count("/output/2/mute") === 2, "output unmute missing");
assert.equal(latest("/output/2/mute").values[0], 0);

// Independent receive ports remain live simultaneously.
ws.message({event: "willAppear", action: OUTPUT, context: "out-b", payload: {settings: settings(RX_B, {preset: "custom", label: "Port B", outputIndex: 3})}});
await waitFor(() => count("/sendchan/output/3") >= 1, "second receive-port state request missing");
sendFeedback(RX_B, encode("/output/3/volume", [-8], ["f"]));
sendFeedback(RX_B, encode("/output/3/mute", [0], ["i"]));
await waitFor(() => feedbackValues(ws, "out-b").includes("-8.0 dB"), "second receive port did not deliver feedback");
ws.message({event: "dialRotate", action: OUTPUT, context: "out-b", payload: {ticks: 2}});
await waitFor(() => count("/output/3/volume") === 1, "second receive-port dial missing");
assert.equal(latest("/output/3/volume").values[0], -7);

// All six requested fader presets resolve to their UCX II Global OSC channels.
const faderPresets = [
  [OUTPUT, "preset-main", {preset: "main"}, "/sendchan/output/0"],
  [OUTPUT, "preset-phones", {preset: "phones1"}, "/sendchan/output/6"],
  [MIX, "preset-in12", {preset: "input12"}, "/sendchan/input/0"],
  [MIX, "preset-in34", {preset: "input34"}, "/sendchan/input/2"],
  [MIX, "preset-pb12", {preset: "playback12"}, "/sendchan/playback/0"],
  [MIX, "preset-spdif", {preset: "spdif"}, "/sendchan/input/8"]
];
for (const [action, context, presetSettings, requestPath] of faderPresets) {
  const before = count(requestPath);
  ws.message({event: "willAppear", action, context, payload: {settings: settings(RX_A, presetSettings)}});
  await waitFor(() => count(requestPath) === before + 1, `${context} mapped to the wrong state request`);
}
for (const [, context] of faderPresets) ws.message({event: "willDisappear", context, payload: {}});

// Mix fader press mutes its source and blocks rotation while muted.
ws.message({event: "willAppear", action: MIX, context: "mix", payload: {settings: settings(RX_A, {preset: "custom", label: "Mic", bus: "in", sourceIndex: 3, outputIndex: 4})}});
await waitFor(() => count("/sendchan/input/3") >= 1, "mix state request missing");
sendFeedback(RX_A, bundle([
  encode("/mix/in/3/4/fader", [-22], ["f"]),
  encode("/input/3/mute", [], ["F"])
]));
await waitFor(() => feedbackValues(ws, "mix").includes("-22.0 dB"), "mix state missing");
ws.message({event: "dialDown", action: MIX, context: "mix", payload: {}});
await waitFor(() => count("/input/3/mute") === 1, "mix source mute missing");
const mixCount = count("/mix/in/3/4/fader");
ws.message({event: "dialRotate", action: MIX, context: "mix", payload: {ticks: 2}});
await sleep(50);
assert.equal(count("/mix/in/3/4/fader"), mixCount, "muted mix accepted a turn");
sendFeedback(RX_A, encode("/input/3/mute", [], ["T"]));
await sleep(20);
sendFeedback(RX_A, encode("/input/3/mute", [], ["F"]));
await sleep(20);
ws.message({event: "dialRotate", action: MIX, context: "mix", payload: {ticks: 2}});
await waitFor(() => count("/mix/in/3/4/fader") === mixCount + 1, "unmuted mix turn missing");
assert.equal(latest("/mix/in/3/4/fader").values[0], -21);

// Toggle cannot guess before state; stale feedback cannot turn a just-enabled action back off.
const toggleStateRequests = count("/sendall");
ws.message({event: "willAppear", action: TOGGLE, context: "dim", payload: {settings: settings(RX_A, {preset: "dim"})}});
await waitFor(() => count("/sendall") > toggleStateRequests, "toggle state request missing");
ws.message({event: "keyDown", action: TOGGLE, context: "dim", payload: {}});
await waitFor(() => sent(ws, "showAlert", "dim").length === 1, "unsynchronized toggle was not blocked");
assert.equal(count("/controlroom/dim"), 0);
sendFeedback(RX_A, encode("/controlroom/dim", [], ["F"]));
await waitFor(() => sent(ws, "setState", "dim").some(message => message.payload.state === 0), "toggle false state missing");
const dimOffImage = sent(ws, "setImage", "dim").at(-1)?.payload.image;
assert.match(dimOffImage, /^data:image\/png;base64,/, "toggle off artwork missing");
ws.message({event: "keyDown", action: TOGGLE, context: "dim", payload: {}});
await waitFor(() => count("/controlroom/dim") === 1, "toggle enable missing");
sendFeedback(RX_A, encode("/controlroom/dim", [], ["F"]));
await sleep(20);
ws.message({event: "keyDown", action: TOGGLE, context: "dim", payload: {}});
await waitFor(() => count("/controlroom/dim") === 2, "toggle disable missing");
assert.equal(latest("/controlroom/dim").values[0], 0, "stale feedback changed toggle direction");

// Multi-path functions enable and disable every dependent path together.
ws.message({event: "willAppear", action: TOGGLE, context: "talk", payload: {settings: settings(RX_A, {preset: "talkback"})}});
sendFeedback(RX_A, bundle([
  encode("/controlroom/talkback", [], ["F"]),
  encode("/controlroom/dim", [], ["F"])
]));
await waitFor(() => sent(ws, "setState", "talk").some(message => message.payload.state === 0), "talkback state missing");
ws.message({event: "keyDown", action: TOGGLE, context: "talk", payload: {}});
await waitFor(() => count("/controlroom/talkback") === 1 && count("/controlroom/dim") === 3, "talkback enable dependencies missing");
assert.equal(latest("/controlroom/talkback").values[0], 1);
assert.equal(latest("/controlroom/dim").values[0], 1);
ws.message({event: "keyDown", action: TOGGLE, context: "talk", payload: {}});
await waitFor(() => count("/controlroom/talkback") === 2 && count("/controlroom/dim") === 4, "talkback disable dependencies missing");
assert.equal(latest("/controlroom/talkback").values[0], 0);
assert.equal(latest("/controlroom/dim").values[0], 0);

// The three remaining single-path button presets map to the requested targets.
const singleButtons = [
  ["main-button", "mainMute", "/output/0/mute"],
  ["phones-button", "phonesMute", "/output/6/mute"],
  ["mic-button", "micMute", "/input/0/mute"]
];
for (const [context, preset, path] of singleButtons) {
  ws.message({event: "willAppear", action: TOGGLE, context, payload: {settings: settings(RX_A, {preset})}});
  sendFeedback(RX_A, encode(path, [], ["F"]));
  await waitFor(() => sent(ws, "setState", context).some(message => message.payload.state === 0), `${preset} feedback missing`);
  ws.message({event: "keyDown", action: TOGGLE, context, payload: {}});
  await waitFor(() => count(path) === 1, `${preset} command mapped to wrong path`);
  assert.equal(latest(path).values[0], 1);
}

// Stereo 48V controls both input paths.
ws.message({event: "willAppear", action: TOGGLE, context: "phantom", payload: {settings: settings(RX_A, {preset: "mic48v"})}});
sendFeedback(RX_A, bundle([
  encode("/input/0/48v", [0], ["i"]),
  encode("/input/1/48v", [0], ["i"])
]));
await waitFor(() => sent(ws, "setState", "phantom").some(message => message.payload.state === 0), "48V state missing");
ws.message({event: "keyDown", action: TOGGLE, context: "phantom", payload: {}});
await waitFor(() => count("/input/0/48v") === 1 && count("/input/1/48v") === 1, "stereo 48V enable missing");

// Snapshot state values 2 (active) and 3 (active/changed) are reflected.
const snapshotStateRequests = count("/sendall");
ws.message({event: "willAppear", action: SNAPSHOT, context: "snap", payload: {settings: settings(RX_A, {snapshot: 5})}});
await waitFor(() => count("/sendall") > snapshotStateRequests, "snapshot state request missing");
sendFeedback(RX_A, encode("/snapshot/load/5", [2], ["i"]));
await waitFor(() => sent(ws, "setState", "snap").some(message => message.payload.state === 1), "active snapshot state missing");
const snapshotOnImage = sent(ws, "setImage", "snap").at(-1)?.payload.image;
assert.match(snapshotOnImage, /^data:image\/png;base64,/, "active snapshot artwork missing");
sendFeedback(RX_A, encode("/snapshot/load/5", [3], ["i"]));
await waitFor(() => sent(ws, "setTitle", "snap").some(message => message.payload.title === "SNAP 5*"), "changed snapshot state missing");
ws.message({event: "keyDown", action: SNAPSHOT, context: "snap", payload: {}});
await waitFor(() => count("/snapshot/load/5") === 1, "snapshot recall missing");

// Malformed OSC is contained and settings changes safely move receiver ownership.
sendFeedback(RX_A, Buffer.from([1, 2, 3, 4, 5]));
await sleep(30);
assert.equal(ws.readyState, FakeWebSocket.OPEN);
ws.message({event: "didReceiveSettings", action: OUTPUT, context: "out", payload: {settings: settings(RX_B, {preset: "custom", label: "Moved", outputIndex: 9})}});
await waitFor(() => count("/sendchan/output/9") >= 1, "settings-change state request missing");
sendFeedback(RX_B, bundle([
  encode("/output/9/volume", [-30], ["f"]),
  encode("/output/9/mute", [0], ["i"])
]));
await waitFor(() => feedbackValues(ws, "out").includes("-30.0 dB"), "settings-change feedback missing");
const beforeDisappear = sent(ws, "setFeedback", "out").length;
ws.message({event: "willDisappear", action: OUTPUT, context: "out", payload: {}});
sendFeedback(RX_B, encode("/output/9/volume", [-40], ["f"]));
await sleep(120);
assert.equal(sent(ws, "setFeedback", "out").length, beforeDisappear, "disappeared action still received feedback");

// Stream Deck WebSocket reconnects and re-registers after a close.
ws.close();
await waitFor(() => FakeWebSocket.instances.length === 2, "WebSocket did not reconnect");
await waitFor(() => FakeWebSocket.instances[1].sent.length === 1, "reconnected socket did not register");
assert.deepEqual(FakeWebSocket.instances[1].sent[0], {event: "registerPlugin", uuid: PLUGIN});

feedback.close();
totalMix.close();
console.log(`PASS: event ordering, state readiness, two receive ports, mute guards, presets, snapshots, cleanup, and reconnect (${packets.length} OSC packets / ${ws.sent.length} Stream Deck messages)`);
process.exit(0);
