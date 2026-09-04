import assert from "node:assert/strict";
import dgram from "node:dgram";
import { pathToFileURL } from "node:url";

const pluginPath = process.argv[2];
assert(pluginPath, "Usage: node plugin-sandbox-test.mjs /path/to/plugin.js");

const SEND_PORT = 17008;
const RECEIVE_PORT = 19008;
const HOST = "127.0.0.1";

const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const pad4 = value => (value + 3) & ~3;

function oscString(value) {
  const raw = Buffer.from(`${value}\0`, "utf8");
  const output = Buffer.alloc(pad4(raw.length));
  raw.copy(output);
  return output;
}

function encode(address, values = [], forcedTags) {
  const tags = forcedTags ?? values.map(value => Number.isInteger(value) ? "i" : typeof value === "string" ? "s" : "f");
  const parts = [oscString(address), oscString(`,${tags.join("")}`)];
  values.forEach((value, index) => {
    const tag = tags[index];
    if (tag === "s") parts.push(oscString(value));
    else if (tag === "T" || tag === "F") return;
    else {
      const part = Buffer.alloc(4);
      if (tag === "i") part.writeInt32BE(Number(value));
      else part.writeFloatBE(Number(value));
      parts.push(part);
    }
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
  assert(end >= 0, "OSC string must terminate");
  return [buffer.toString("utf8", offset, end), pad4(end + 1)];
}

function decode(buffer) {
  let offset = 0;
  let address;
  let tags;
  [address, offset] = readString(buffer, offset);
  [tags, offset] = readString(buffer, offset);
  const values = [];
  for (const tag of tags.slice(1)) {
    if (tag === "f") { values.push(buffer.readFloatBE(offset)); offset += 4; }
    else if (tag === "i") { values.push(buffer.readInt32BE(offset)); offset += 4; }
    else if (tag === "s") { let value; [value, offset] = readString(buffer, offset); values.push(value); }
  }
  return { address, values };
}

class FakeWebSocket {
  static OPEN = 1;
  static instance;
  readyState = FakeWebSocket.OPEN;
  listeners = new Map();
  sent = [];

  constructor(url) {
    this.url = url;
    FakeWebSocket.instance = this;
    queueMicrotask(() => this.emit("open", {}));
  }

  addEventListener(name, callback) { this.listeners.set(name, callback); }
  send(value) { this.sent.push(JSON.parse(value)); }
  emit(name, value) { this.listeners.get(name)?.(value); }
  message(value) { this.emit("message", { data: JSON.stringify(value) }); }
}

globalThis.WebSocket = FakeWebSocket;

const packets = [];
const totalMix = dgram.createSocket("udp4");
totalMix.on("message", packet => packets.push(decode(packet)));
await new Promise(resolve => totalMix.bind(SEND_PORT, HOST, resolve));

const feedback = dgram.createSocket("udp4");
const sendFeedback = packet => feedback.send(packet, RECEIVE_PORT, HOST);

const settings = extra => ({ host: HOST, sendPort: SEND_PORT, receivePort: RECEIVE_PORT, ...extra });
const count = address => packets.filter(packet => packet.address === address).length;
const latest = address => packets.filter(packet => packet.address === address).at(-1);
const sdMessages = (event, context) => FakeWebSocket.instance.sent.filter(message => message.event === event && (!context || message.context === context));

async function waitFor(predicate, message, timeout = 1000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (predicate()) return;
    await sleep(10);
  }
  assert.fail(message);
}

process.argv.push("-port", "12345", "-pluginUUID", "com.fionetworks.rme-globalosc", "-registerEvent", "registerPlugin");
await import(`${pathToFileURL(pluginPath).href}?sandbox=${Date.now()}`);
await waitFor(() => FakeWebSocket.instance?.sent.length, "plugin did not register");

const ws = FakeWebSocket.instance;
assert.equal(ws.url, "ws://127.0.0.1:12345");
assert.deepEqual(ws.sent[0], { event: "registerPlugin", uuid: "com.fionetworks.rme-globalosc" });

ws.message({ event: "willAppear", action: "com.fionetworks.rme-globalosc.outputvolume", context: "output", payload: { settings: settings({ preset: "custom", outputIndex: 2, stepDb: 1 }) } });
await waitFor(() => count("/sendchan/output/2") === 1, "output state request missing");
assert(sdMessages("setFeedback", "output").some(message => message.payload.value?.value === "SYNCING"));

sendFeedback(encode("/output/2/volume", [-20.5], ["f"]));
sendFeedback(encode("/output/2/mute", [0], ["i"]));
await waitFor(() => sdMessages("setFeedback", "output").some(message => message.payload.value?.value === "-20.5 dB"), "output feedback missing");

ws.message({ event: "dialRotate", action: "com.fionetworks.rme-globalosc.outputvolume", context: "output", payload: { ticks: 2 } });
await waitFor(() => count("/output/2/volume") === 1, "output dial packet missing");
assert(Math.abs(latest("/output/2/volume").values[0] - -18.5) < 0.001);

ws.message({ event: "dialDown", action: "com.fionetworks.rme-globalosc.outputvolume", context: "output", payload: {} });
await waitFor(() => count("/output/2/mute") === 1, "output mute packet missing");
assert.equal(latest("/output/2/mute").values[0], 1, "mute feedback must drive the next toggle state");
sendFeedback(encode("/output/2/mute", [1], ["i"]));
await waitFor(() => sdMessages("setFeedback", "output").some(message => message.payload.value?.value === "MUTED"), "mute feedback missing");
await sleep(275);
sendFeedback(encode("/output/2/mute", [0], ["i"]));
await waitFor(() => sdMessages("setFeedback", "output").some(message => message.payload.value?.value === "-18.5 dB"), "external unmute feedback missing");
sendFeedback(encode("/output/2/volume", [5.5], ["f"]));
await sleep(25);
ws.message({ event: "dialRotate", action: "com.fionetworks.rme-globalosc.outputvolume", context: "output", payload: { ticks: 4 } });
await waitFor(() => count("/output/2/volume") === 2, "upper clamp packet missing");
assert.equal(latest("/output/2/volume").values[0], 6);

await sleep(275);
sendFeedback(encode("/output/2/volume", [-64.5], ["f"]));
await sleep(25);
ws.message({ event: "dialRotate", action: "com.fionetworks.rme-globalosc.outputvolume", context: "output", payload: { ticks: -4 } });
await waitFor(() => count("/output/2/volume") === 3, "lower clamp packet missing");
assert.equal(latest("/output/2/volume").values[0], -65);

ws.message({ event: "willAppear", action: "com.fionetworks.rme-globalosc.outputvolume", context: "no-mute", payload: { settings: settings({ preset: "custom", outputIndex: 7, muteOnPress: false }) } });
await waitFor(() => count("/sendchan/output/7") === 1, "second output state request missing");
const muteCount = count("/output/7/mute");
ws.message({ event: "dialDown", action: "com.fionetworks.rme-globalosc.outputvolume", context: "no-mute", payload: {} });
await sleep(30);
assert.equal(count("/output/7/mute"), muteCount, "muteOnPress=false must suppress mute");

ws.message({ event: "willAppear", action: "com.fionetworks.rme-globalosc.mixfader", context: "input-mix", payload: { settings: settings({ preset: "custom", bus: "input", sourceIndex: 3, outputIndex: 4, stepDb: 0.5 }) } });
await waitFor(() => count("/sendchan/input/3") === 1, "input mix state request missing");
await waitFor(() => count("/sendall") === 1, "input mix global fader-state request missing");
sendFeedback(encode("/mix/in/3/4/fader", [-22], ["f"]));
sendFeedback(encode("/input/3/mute", [0], ["i"]));
await waitFor(() => sdMessages("setFeedback", "input-mix").some(message => message.payload.value?.value === "-22.0 dB"), "input mix feedback missing");
ws.message({ event: "dialRotate", action: "com.fionetworks.rme-globalosc.mixfader", context: "input-mix", payload: { ticks: 2 } });
await waitFor(() => count("/mix/in/3/4/fader") === 1, "input mix dial packet missing");
assert.equal(latest("/mix/in/3/4/fader").values[0], -21);

ws.message({ event: "willAppear", action: "com.fionetworks.rme-globalosc.mixfader", context: "playback-mix", payload: { settings: settings({ preset: "custom", bus: "playback", sourceIndex: 5, outputIndex: 1 }) } });
await waitFor(() => count("/sendchan/playback/5") === 1, "playback mix state request missing");
sendFeedback(encode("/mix/pb/5/1/fader", [-10], ["f"]));
sendFeedback(encode("/playback/5/mute", [0], ["i"]));
await waitFor(() => sdMessages("setFeedback", "playback-mix").some(message => message.payload.value?.value === "-10.0 dB"), "playback mix feedback missing");
ws.message({ event: "dialRotate", action: "com.fionetworks.rme-globalosc.mixfader", context: "playback-mix", payload: { ticks: 2 } });
await waitFor(() => count("/mix/pb/5/1/fader") === 1, "playback mix dial packet missing");
assert.equal(latest("/mix/pb/5/1/fader").values[0], -9);
sendFeedback(encode("/mix/pb/5/1/fader", [-9], ["f"]));
sendFeedback(encode("/mix/pb/5/1/fader", [-300], ["f"]));
await waitFor(() => sdMessages("setFeedback", "playback-mix").some(message => message.payload.value?.value === "-∞ dB"), "playback silence feedback missing");
ws.message({ event: "dialRotate", action: "com.fionetworks.rme-globalosc.mixfader", context: "playback-mix", payload: { ticks: 1 } });
await waitFor(() => count("/mix/pb/5/1/fader") === 2, "playback wake-from-silence packet missing");
assert.equal(latest("/mix/pb/5/1/fader").values[0], -64.5);

const toggleStateRequests = count("/sendall");
ws.message({ event: "willAppear", action: "com.fionetworks.rme-globalosc.toggle", context: "toggle", payload: { settings: settings({ path: "/controlroom/dim", title: "DIM" }) } });
await waitFor(() => count("/sendall") > toggleStateRequests, "toggle state request missing");
sendFeedback(encode("/controlroom/dim", [], ["T"]));
await waitFor(() => sdMessages("setState", "toggle").some(message => message.payload.state === 1), "boolean true toggle feedback missing");
const toggleOnImage = sdMessages("setImage", "toggle").at(-1)?.payload.image;
assert.match(toggleOnImage, /^data:image\/png;base64,/, "active toggle image must be an embedded PNG");
ws.message({ event: "keyDown", action: "com.fionetworks.rme-globalosc.toggle", context: "toggle", payload: {} });
await waitFor(() => count("/controlroom/dim") === 1, "toggle command missing");
assert.equal(latest("/controlroom/dim").values[0], 0);

const snapshotStateRequests = count("/sendall");
ws.message({ event: "willAppear", action: "com.fionetworks.rme-globalosc.snapshot", context: "snapshot", payload: { settings: settings({ snapshot: 5 }) } });
await waitFor(() => count("/sendall") > snapshotStateRequests, "snapshot state request missing");
ws.message({ event: "keyDown", action: "com.fionetworks.rme-globalosc.snapshot", context: "snapshot", payload: {} });
await waitFor(() => count("/snapshot/load/5") === 1, "snapshot command missing");
assert.equal(latest("/snapshot/load/5").values[0], 1);

sendFeedback(bundle([
  encode("/output/2/volume", [-7.25], ["f"]),
  encode("/controlroom/dim", [], ["F"])
]));
await waitFor(() => sdMessages("setFeedback", "output").some(message => message.payload.value?.value === "-7.3 dB"), "bundle volume feedback missing");
await waitFor(() => sdMessages("setState", "toggle").some(message => message.payload.state === 0), "bundle boolean feedback missing");
const toggleOffImage = sdMessages("setImage", "toggle").at(-1)?.payload.image;
assert.match(toggleOffImage, /^data:image\/png;base64,/, "inactive toggle image must be an embedded PNG");
assert.notEqual(toggleOffImage, toggleOnImage, "active and inactive toggle artwork must differ");

sendFeedback(Buffer.from([1, 2, 3, 4, 5]));
await sleep(30);
assert.equal(ws.readyState, FakeWebSocket.OPEN, "malformed OSC must not stop the plugin");

ws.message({ event: "didReceiveSettings", action: "com.fionetworks.rme-globalosc.outputvolume", context: "output", payload: { settings: settings({ preset: "custom", outputIndex: 9, stepDb: 0.25 }) } });
await waitFor(() => count("/sendchan/output/9") === 1, "settings-change state request missing");
sendFeedback(encode("/output/9/volume", [-30], ["f"]));
sendFeedback(encode("/output/9/mute", [0], ["i"]));
await waitFor(() => sdMessages("setFeedback", "output").some(message => message.payload.value?.value === "-30.0 dB"), "settings-change feedback missing");
ws.message({ event: "dialRotate", action: "com.fionetworks.rme-globalosc.outputvolume", context: "output", payload: { ticks: 4 } });
await waitFor(() => count("/output/9/volume") === 1, "settings-change dial packet missing");
assert.equal(latest("/output/9/volume").values[0], -29);

const feedbackBeforeDisappear = sdMessages("setFeedback", "output").length;
ws.message({ event: "willDisappear", action: "com.fionetworks.rme-globalosc.outputvolume", context: "output", payload: {} });
sendFeedback(encode("/output/9/volume", [-40], ["f"]));
await sleep(30);
assert.equal(sdMessages("setFeedback", "output").length, feedbackBeforeDisappear, "disappeared actions must stop receiving feedback");

feedback.close();
totalMix.close();
console.log(`PASS: ${packets.length} outbound OSC packets and ${ws.sent.length} Stream Deck messages validated`);
process.exit(0);
