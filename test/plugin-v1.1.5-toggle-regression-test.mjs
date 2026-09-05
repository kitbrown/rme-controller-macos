import assert from "node:assert/strict";
import dgram from "node:dgram";
import {pathToFileURL} from "node:url";

const pluginPath = process.argv[2];
assert(pluginPath, "Usage: node plugin-v1.1.5-toggle-regression-test.mjs /path/to/plugin.js");

const SEND_PORT = 17018;
const RECEIVE_PORT = 19018;
const HOST = "127.0.0.1";
const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
const pad4 = value => (value + 3) & ~3;

function oscString(value) {
  const raw = Buffer.from(`${value}\0`, "utf8");
  const output = Buffer.alloc(pad4(raw.length));
  raw.copy(output);
  return output;
}
function encode(address, value) {
  const argument = Buffer.alloc(4);
  argument.writeInt32BE(value, 0);
  return Buffer.concat([oscString(address), oscString(",i"), argument]);
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
  return {address, value: tags === ",i" ? buffer.readInt32BE(offset) : buffer.readFloatBE(offset)};
}

class FakeWebSocket {
  static OPEN = 1;
  static instance;
  readyState = FakeWebSocket.OPEN;
  listeners = new Map();
  sent = [];

  constructor() {
    FakeWebSocket.instance = this;
    queueMicrotask(() => this.listeners.get("open")?.({}));
  }
  addEventListener(name, callback) { this.listeners.set(name, callback); }
  send(value) { this.sent.push(JSON.parse(value)); }
  message(value) { this.listeners.get("message")?.({data: JSON.stringify(value)}); }
  close() {}
}
globalThis.WebSocket = FakeWebSocket;

const packets = [];
const totalMix = dgram.createSocket("udp4");
totalMix.on("message", buffer => packets.push(decode(buffer)));
await new Promise(resolve => totalMix.bind(SEND_PORT, HOST, resolve));
const feedback = dgram.createSocket("udp4");

process.argv.push("-port", "12345", "-pluginUUID", "com.fionetworks.rme-globalosc", "-registerEvent", "registerPlugin");
await import(`${pathToFileURL(pluginPath).href}?toggleRegression=${Date.now()}`);
await sleep(20);

const ws = FakeWebSocket.instance;
const settings = {host: HOST, sendPort: SEND_PORT, receivePort: RECEIVE_PORT};

ws.message({
  event: "willAppear",
  action: "com.fionetworks.rme-globalosc.toggle",
  context: "default-toggle",
  payload: {settings}
});
await sleep(40);
assert(ws.sent.some(message =>
  message.event === "setTitle" &&
  message.context === "default-toggle" &&
  message.payload.title === "Main Mute"
), "new Control Toggle must default to Main Mute");

ws.message({event: "willDisappear", action: "com.fionetworks.rme-globalosc.toggle", context: "default-toggle", payload: {}});
await sleep(20);

ws.message({
  event: "willAppear",
  action: "com.fionetworks.rme-globalosc.toggle",
  context: "talkback",
  payload: {settings: {...settings, preset: "talkback"}}
});
await sleep(40);
feedback.send(encode("/controlroom/dim", 0), RECEIVE_PORT, HOST);
await sleep(50);
ws.message({event: "keyDown", action: "com.fionetworks.rme-globalosc.toggle", context: "talkback", payload: {}});
await sleep(80);

assert(packets.some(packet => packet.address === "/controlroom/talkback" && packet.value === 1),
  "Talkback command must be sent once Dim feedback establishes readiness");
assert(packets.some(packet => packet.address === "/controlroom/dim" && packet.value === 1),
  "Talkback + Dim must command Dim together with Talkback");

totalMix.close();
feedback.close();
console.log("v1.1.5 toggle regressions passed");
process.exit(0);
