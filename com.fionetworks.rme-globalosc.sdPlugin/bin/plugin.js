import dgram from "node:dgram";
import {readFileSync} from "node:fs";

const PLUGIN_UUID = "com.fionetworks.rme-globalosc";
const ACTION_OUTPUT = `${PLUGIN_UUID}.outputvolume`;
const ACTION_MIX = `${PLUGIN_UUID}.mixfader`;
const ACTION_TOGGLE = `${PLUGIN_UUID}.toggle`;
const ACTION_SNAPSHOT = `${PLUGIN_UUID}.snapshot`;

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_SEND_PORT = 7008;
const DEFAULT_RECEIVE_PORT = 9008;
const FEEDBACK_INTERVAL_MS = 100;
const COMMAND_COALESCE_MS = 25;
const CAUSAL_GUARD_MS = 250;
const RECONCILE_MS = 350;
const RESYNC_DELAYS_MS = [750, 1500, 3000];
const GLOBAL_REQUEST_DEBOUNCE_MS = 25;

function pngDataUri(relativeUrl) {
  return `data:image/png;base64,${readFileSync(new URL(relativeUrl, import.meta.url)).toString("base64")}`;
}
const TOGGLE_IMAGES = [pngDataUri("../imgs/toggle.png"), pngDataUri("../imgs/toggle-on.png")];
const SNAPSHOT_IMAGES = [pngDataUri("../imgs/snapshot.png"), pngDataUri("../imgs/snapshot-on.png")];

const OUTPUT_PRESETS = {
  main: {label: "Main", outputIndex: 0},
  phones1: {label: "Phones 1", outputIndex: 6},
  spdif: {label: "SPDIF Out", outputIndex: 8}
};
const MIX_PRESETS = {
  input12: {label: "Analog 1/2 In", bus: "in", sourceIndex: 0, outputIndex: 0},
  input34: {label: "Analog 3/4 In", bus: "in", sourceIndex: 2, outputIndex: 0},
  mic1: {label: "Mic 1", bus: "in", sourceIndex: 0, outputIndex: 0},
  playback12: {label: "Core Audio", bus: "playback", sourceIndex: 0, outputIndex: 0},
  spdif: {label: "TV SPDIF", bus: "in", sourceIndex: 8, outputIndex: 0}
};
const TOGGLE_PRESETS = {
  mainMute: {label: "Main Mute", paths: ["/output/0/mute"]},
  dim: {label: "Dim", paths: ["/controlroom/dim"]},
  mono: {label: "Mono", paths: ["/controlroom/mainmono"]},
  micMute: {label: "Mic 1 Mute", paths: ["/input/0/mute"]},
  tvSpdifMute: {label: "TV SPDIF Mute", paths: ["/input/8/mute"]},
  spdifOutMute: {label: "SPDIF Out Mute", paths: ["/output/8/mute"]},
  phonesMute: {label: "Phones Mute", paths: ["/output/6/mute"]},
  mic48v: {label: "Mic 48V", paths: ["/input/0/48v", "/input/1/48v"]},
  talkback: {label: "Talkback", paths: ["/controlroom/talkback", "/controlroom/dim"], feedbackPaths: ["/controlroom/dim"], momentary: true}
};

const instances = new Map();
const contextOperations = new Map();
const receivers = new Map();
const pendingPaths = new Map();
const queuedSends = new Map();
const queuedGlobalRequests = new Map();
const oscTx = dgram.createSocket("udp4");
let sd = null;
let reconnectTimer = null;
let reconnectAttempt = 0;
let shuttingDown = false;

function arg(name) {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}
function finite(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}
function integer(value, fallback, min = 0, max = 65535) {
  return Math.max(min, Math.min(max, Math.trunc(finite(value, fallback))));
}
function cfg(s = {}) {
  return {
    host: typeof s.host === "string" && s.host.trim() ? s.host.trim() : DEFAULT_HOST,
    sendPort: integer(s.sendPort, DEFAULT_SEND_PORT, 1),
    receivePort: integer(s.receivePort, DEFAULT_RECEIVE_PORT, 1)
  };
}
function outputSpec(s = {}) {
  const preset = s.preset || "main";
  if (preset !== "custom" && OUTPUT_PRESETS[preset]) return OUTPUT_PRESETS[preset];
  return {
    label: typeof s.label === "string" && s.label.trim() ? s.label.trim() : "Output",
    outputIndex: integer(s.outputIndex, 0, 0, 999)
  };
}
function mixSpec(s = {}) {
  const preset = s.preset || "input12";
  if (preset !== "custom" && MIX_PRESETS[preset]) return MIX_PRESETS[preset];
  return {
    label: typeof s.label === "string" && s.label.trim() ? s.label.trim() : "Submix",
    bus: s.bus === "playback" ? "playback" : "in",
    sourceIndex: integer(s.sourceIndex, 0, 0, 999),
    outputIndex: integer(s.outputIndex, 0, 0, 999)
  };
}
function toggleSpec(s = {}) {
  const preset = s.preset || ((typeof s.path === "string" || typeof s.title === "string") ? "custom" : "mainMute");
  if (preset !== "custom" && TOGGLE_PRESETS[preset]) return TOGGLE_PRESETS[preset];
  const path = typeof s.path === "string" && s.path.startsWith("/") ? s.path.trim() : "/controlroom/dim";
  return {
    label: typeof s.title === "string" && s.title.trim() ? s.title.trim() : "Toggle",
    paths: [path]
  };
}
function toggleFeedbackPaths(spec) { return spec.feedbackPaths || spec.paths; }
function outputPath(s) { return `/output/${outputSpec(s).outputIndex}/volume`; }
function outputMutePath(s) { return `/output/${outputSpec(s).outputIndex}/mute`; }
function mixPath(s) {
  const x = mixSpec(s);
  return `/mix/${x.bus === "playback" ? "pb" : "in"}/${x.sourceIndex}/${x.outputIndex}/fader`;
}
function mixMutePath(s) {
  const x = mixSpec(s);
  return `/${x.bus === "playback" ? "playback" : "input"}/${x.sourceIndex}/mute`;
}
function clampDb(s, value) {
  const min = finite(s.minDb, -65);
  const max = finite(s.maxDb, 6);
  return Math.max(Math.min(min, max), Math.min(Math.max(min, max), value));
}
function formatDb(db) { return db <= -64.9 ? "-∞ dB" : `${db.toFixed(1)} dB`; }
function indicator(s, db) {
  const min = finite(s.minDb, -65);
  const max = finite(s.maxDb, 6);
  return Math.round(Math.max(0, Math.min(100, ((db - min) / Math.max(0.001, max - min)) * 100)));
}

function pad4(n) { return (n + 3) & ~3; }
function oscString(value) {
  const raw = Buffer.from(`${String(value)}\0`, "utf8");
  const out = Buffer.alloc(pad4(raw.length));
  raw.copy(out);
  return out;
}
function encodeOsc(address, args = []) {
  const tags = `,${args.map(v => typeof v === "string" ? "s" : Number.isInteger(v) ? "i" : "f").join("")}`;
  const parts = [oscString(address), oscString(tags)];
  for (const value of args) {
    if (typeof value === "string") parts.push(oscString(value));
    else {
      const b = Buffer.alloc(4);
      if (Number.isInteger(value)) b.writeInt32BE(value, 0);
      else b.writeFloatBE(Number(value), 0);
      parts.push(b);
    }
  }
  return Buffer.concat(parts);
}
function readString(buf, offset) {
  const end = buf.indexOf(0, offset);
  if (end < 0) throw new Error("Malformed OSC string");
  return [buf.toString("utf8", offset, end), pad4(end + 1)];
}
function decodeOsc(buf) {
  if (buf.length >= 16 && buf.toString("ascii", 0, 7) === "#bundle") {
    const messages = [];
    let offset = 16;
    while (offset + 4 <= buf.length) {
      const size = buf.readInt32BE(offset);
      offset += 4;
      if (size <= 0 || offset + size > buf.length) throw new Error("Malformed OSC bundle");
      messages.push(...decodeOsc(buf.subarray(offset, offset + size)));
      offset += size;
    }
    return messages;
  }
  let offset = 0;
  let address, tags;
  [address, offset] = readString(buf, offset);
  [tags, offset] = readString(buf, offset);
  if (!address.startsWith("/") || !tags.startsWith(",")) throw new Error("Malformed OSC message");
  const args = [];
  for (const tag of tags.slice(1)) {
    if (tag === "f") { if (offset + 4 > buf.length) throw new Error("Truncated float"); args.push(buf.readFloatBE(offset)); offset += 4; }
    else if (tag === "i") { if (offset + 4 > buf.length) throw new Error("Truncated int"); args.push(buf.readInt32BE(offset)); offset += 4; }
    else if (tag === "s") { let value; [value, offset] = readString(buf, offset); args.push(value); }
    else if (tag === "T") args.push(1);
    else if (tag === "F") args.push(0);
    else throw new Error(`Unsupported OSC type ${tag}`);
  }
  return [{address, args}];
}

function sendSD(event, context, payload = {}) {
  if (sd?.readyState === WebSocket.OPEN) sd.send(JSON.stringify({event, context, payload}));
}
function showAlert(context) { sendSD("showAlert", context); }
function setTitle(context, title) { sendSD("setTitle", context, {title, target: 0}); }
function setState(context, state) { sendSD("setState", context, {state}); }
function setImage(context, image) { sendSD("setImage", context, {image}); }
function xml(value) {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"}[char]));
}
function keyToken(inst) {
  if (inst.action === ACTION_SNAPSHOT) return `S${integer(inst.settings.snapshot, 1, 1, 8)}`;
  const preset = inst.settings.preset || "mainMute";
  return ({
    mainMute: "MAIN",
    dim: "DIM",
    mono: "MONO",
    micMute: "MIC",
    tvSpdifMute: "TV",
    spdifOutMute: "SPDIF",
    phonesMute: "PHONES",
    mic48v: "48V",
    talkback: "TALK"
  })[preset] || "OSC";
}
function keyAccent(inst) {
  if (inst.action === ACTION_SNAPSHOT) return "#c88cff";
  const preset = inst.settings.preset || "mainMute";
  return ({
    mainMute: "#38d9ff",
    dim: "#58e6a9",
    mono: "#9aa8ff",
    micMute: "#ffb84d",
    tvSpdifMute: "#c88cff",
    spdifOutMute: "#58e6a9",
    phonesMute: "#9aa8ff",
    mic48v: "#ff8e4d",
    talkback: "#ff5d69"
  })[preset] || "#38d9ff";
}
function keyImage(inst, active) {
  const token = xml(keyToken(inst));
  const accent = keyAccent(inst);
  const bg = active ? accent : "#0b1118";
  const fg = active ? "#071016" : "#edf4fb";
  const ring = active ? "#ffffff" : accent;
  const status = active ? "ON" : "OFF";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">
    <rect x="5" y="5" width="134" height="134" rx="24" fill="${bg}" stroke="${ring}" stroke-width="5"/>
    <rect x="17" y="17" width="110" height="5" rx="2.5" fill="${accent}"/>
    <text x="72" y="77" text-anchor="middle" fill="${fg}" font-family="-apple-system,BlinkMacSystemFont,Arial,sans-serif" font-size="${token.length > 5 ? 23 : 29}" font-weight="750">${token}</text>
    <text x="72" y="108" text-anchor="middle" fill="${active ? fg : "#8fa1b2"}" font-family="-apple-system,BlinkMacSystemFont,Arial,sans-serif" font-size="16" font-weight="650" letter-spacing="2">${status}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}
function renderKeyState(inst, active) {
  const state = active ? 1 : 0;
  setState(inst.context, state);
  setImage(inst.context, keyImage(inst, active));
}
function accentForInstance(inst) {
  if (inst.action === ACTION_OUTPUT) {
    const preset = inst.settings.preset || "main";
    if (preset === "main") return "#38d9ff";
    if (preset === "spdif") return "#58e6a9";
    if (preset === "phones1") return "#9aa8ff";
  }
  if (inst.action === ACTION_MIX) {
    const preset = inst.settings.preset || "input12";
    if (preset === "playback12") return "#4cc9ff";
    if (preset === "mic1") return "#ffb84d";
    if (preset === "spdif") return "#c88cff";
    if (preset === "input12" || preset === "input34") return "#7fd7ff";
  }
  return "#38d9ff";
}
function feedbackPayload(inst) {
  const muted = inst.muted === true;
  const background = muted ? "#5a171c" : "#0b1118";
  const accent = muted ? "#ff5d69" : accentForInstance(inst);
  let label = "RME";
  if (inst.action === ACTION_OUTPUT) label = outputSpec(inst.settings).label;
  else if (inst.action === ACTION_MIX) label = mixSpec(inst.settings).label;
  const value = inst.value === undefined ? "SYNCING" : muted ? "MUTED" : formatDb(inst.value);
  return {
    title: {value: label, color: "#ffffff", background},
    value: {value, color: "#ffffff", background},
    indicator: {
      value: inst.value === undefined ? 0 : indicator(inst.settings, inst.value),
      background,
      bar_bg_c: muted ? "#5a171c" : "#13202b",
      bar_fill_c: accent
    }
  };
}
function flushFeedback(inst) {
  inst.feedbackTimer = null;
  if (!instances.has(inst.context)) return;
  sendSD("setFeedback", inst.context, feedbackPayload(inst));
  inst.lastFeedbackAt = Date.now();
}
function renderDial(inst, immediate = false) {
  if (inst.action !== ACTION_OUTPUT && inst.action !== ACTION_MIX) return;
  if (immediate || !inst.lastFeedbackAt || Date.now() - inst.lastFeedbackAt >= FEEDBACK_INTERVAL_MS) {
    clearTimeout(inst.feedbackTimer);
    flushFeedback(inst);
  } else if (!inst.feedbackTimer) {
    inst.feedbackTimer = setTimeout(() => flushFeedback(inst), FEEDBACK_INTERVAL_MS - (Date.now() - inst.lastFeedbackAt));
  }
}

function receiverEntry(port) {
  return receivers.get(port);
}
async function acquireReceiver(port) {
  const existing = receiverEntry(port);
  if (existing) {
    existing.refs += 1;
    await existing.ready;
    return;
  }
  const socket = dgram.createSocket("udp4");
  const entry = {socket, refs: 1, ready: null};
  entry.ready = new Promise((resolve, reject) => {
    socket.once("listening", resolve);
    socket.once("error", reject);
  });
  socket.on("message", packet => {
    try {
      for (const message of decodeOsc(packet)) handleOsc(port, message);
    } catch (error) {
      console.error("OSC decode:", error.message || error);
    }
  });
  socket.on("error", error => console.error(`OSC RX ${port}:`, error.message || error));
  receivers.set(port, entry);
  socket.bind(port, "0.0.0.0");
  try {
    await entry.ready;
  } catch (error) {
    receivers.delete(port);
    try { socket.close(); } catch {}
    throw error;
  }
}
function releaseReceiver(port) {
  const entry = receiverEntry(port);
  if (!entry) return;
  entry.refs -= 1;
  if (entry.refs > 0) return;
  receivers.delete(port);
  try { entry.socket.close(); } catch {}
}
function sendPacket(settings, address, value) {
  const c = cfg(settings);
  const packet = encodeOsc(address, [value]);
  oscTx.send(packet, c.sendPort, c.host, error => {
    if (error) console.error(`OSC TX ${address}:`, error.message || error);
  });
}
function requestGlobalState(settings) {
  const c = cfg(settings);
  const key = `${c.host}:${c.sendPort}:${c.receivePort}`;
  const queued = queuedGlobalRequests.get(key);
  if (queued) {
    queued.settings = settings;
    return;
  }
  const item = {settings, timer: null};
  item.timer = setTimeout(() => {
    queuedGlobalRequests.delete(key);
    sendPacket(item.settings, "/sendall", 1);
  }, GLOBAL_REQUEST_DEBOUNCE_MS);
  queuedGlobalRequests.set(key, item);
}
function queuePacket(settings, address, value) {
  const c = cfg(settings);
  const key = `${c.host}:${c.sendPort}:${address}`;
  const queued = queuedSends.get(key);
  if (queued) {
    queued.value = value;
    queued.settings = settings;
    return;
  }
  const item = {settings, address, value, timer: null};
  item.timer = setTimeout(() => {
    queuedSends.delete(key);
    sendPacket(item.settings, item.address, item.value);
  }, COMMAND_COALESCE_MS);
  queuedSends.set(key, item);
}
function pendingKey(port, path) { return `${port}:${path}`; }
function markPending(settings, path, expected) {
  const c = cfg(settings);
  pendingPaths.set(pendingKey(c.receivePort, path), {expected, until: Date.now() + CAUSAL_GUARD_MS});
}
function sendCommand(inst, path, value, coalesce = false) {
  markPending(inst.settings, path, value);
  applyValueToMatching(cfg(inst.settings).receivePort, path, value);
  if (coalesce) queuePacket(inst.settings, path, value);
  else sendPacket(inst.settings, path, value);
  clearTimeout(inst.reconcileTimer);
  inst.reconcileTimer = setTimeout(() => requestState(inst), RECONCILE_MS);
}
function guardedValue(port, address, value) {
  const key = pendingKey(port, address);
  const pending = pendingPaths.get(key);
  if (!pending) return value;
  if (Math.abs(Number(value) - Number(pending.expected)) < 0.0001) {
    pendingPaths.delete(key);
    return value;
  }
  if (Date.now() < pending.until) return undefined;
  pendingPaths.delete(key);
  return value;
}

function actionPaths(inst) {
  if (inst.action === ACTION_OUTPUT) return [outputPath(inst.settings), outputMutePath(inst.settings)];
  if (inst.action === ACTION_MIX) return [mixPath(inst.settings), mixMutePath(inst.settings)];
  if (inst.action === ACTION_TOGGLE) return toggleSpec(inst.settings).paths;
  if (inst.action === ACTION_SNAPSHOT) return [`/snapshot/load/${integer(inst.settings.snapshot, 1, 1, 8)}`];
  return [];
}
function matchesReceiver(inst, port) { return cfg(inst.settings).receivePort === port; }
function applyValueToMatching(port, address, rawValue) {
  for (const inst of instances.values()) {
    if (!matchesReceiver(inst, port)) continue;
    if (inst.action === ACTION_OUTPUT) {
      if (address === outputPath(inst.settings)) { inst.value = Number(rawValue); renderDial(inst); }
      else if (address === outputMutePath(inst.settings)) { inst.muted = Number(rawValue) > 0.5; renderDial(inst); }
    } else if (inst.action === ACTION_MIX) {
      if (address === mixPath(inst.settings)) { inst.value = Number(rawValue); renderDial(inst); }
      else if (address === mixMutePath(inst.settings)) { inst.muted = Number(rawValue) > 0.5; renderDial(inst); }
    } else if (inst.action === ACTION_TOGGLE) {
      const spec = toggleSpec(inst.settings);
      if (spec.paths.includes(address)) {
        inst.toggleStates.set(address, Number(rawValue) > 0.5);
        const feedbackPaths = toggleFeedbackPaths(spec);
        const ready = feedbackPaths.every(path => inst.toggleStates.has(path));
        if (ready) renderKeyState(inst, feedbackPaths.every(path => inst.toggleStates.get(path)));
      }
    } else if (inst.action === ACTION_SNAPSHOT && address === actionPaths(inst)[0]) {
      inst.snapshotState = Number(rawValue);
      const active = inst.snapshotState === 2 || inst.snapshotState === 3;
      renderKeyState(inst, active);
      setTitle(inst.context, `SNAP ${integer(inst.settings.snapshot, 1, 1, 8)}${inst.snapshotState === 3 ? "*" : ""}`);
    }
    stopResyncIfReady(inst);
  }
}
function handleOsc(port, message) {
  if (message.address === "/status/connection" && typeof message.args[0] === "number") {
    for (const inst of instances.values()) if (matchesReceiver(inst, port)) inst.connected = message.args[0] > 0.5;
    return;
  }
  if (typeof message.args[0] !== "number") return;
  const value = guardedValue(port, message.address, message.args[0]);
  if (value === undefined) return;
  applyValueToMatching(port, message.address, value);
}

function requestState(inst) {
  if (!instances.has(inst.context)) return;
  const s = inst.settings;
  if (inst.action === ACTION_OUTPUT) {
    sendPacket(s, `/sendchan/output/${outputSpec(s).outputIndex}`, 1);
  } else if (inst.action === ACTION_MIX) {
    const x = mixSpec(s);
    sendPacket(s, `/sendchan/${x.bus === "playback" ? "playback" : "input"}/${x.sourceIndex}`, 1);
    requestGlobalState(s);
  } else {
    requestGlobalState(s);
  }
}
function isReady(inst, operation) {
  if (inst.configuring) return false;
  if (inst.action === ACTION_OUTPUT || inst.action === ACTION_MIX) {
    if (operation === "rotate") return inst.value !== undefined && (inst.settings.muteOnPress === false || inst.muted !== undefined);
    return inst.muted !== undefined;
  }
  if (inst.action === ACTION_TOGGLE) {
    const spec = toggleSpec(inst.settings);
    return toggleFeedbackPaths(spec).every(path => inst.toggleStates.has(path));
  }
  return true;
}
function requiredOperation(inst) {
  return inst.action === ACTION_TOGGLE ? "toggle" : "rotate";
}
function stopResyncIfReady(inst) {
  if (!isReady(inst, requiredOperation(inst))) return false;
  clearTimeout(inst.resyncTimer);
  inst.resyncTimer = null;
  inst.resyncAttempt = 0;
  return true;
}
function scheduleResync(inst) {
  clearTimeout(inst.resyncTimer);
  if (!instances.has(inst.context) || stopResyncIfReady(inst)) return;
  const attempt = integer(inst.resyncAttempt, 0, 0, RESYNC_DELAYS_MS.length - 1);
  inst.resyncTimer = setTimeout(() => {
    inst.resyncTimer = null;
    if (!instances.has(inst.context) || stopResyncIfReady(inst)) return;
    requestState(inst);
    inst.resyncAttempt = Math.min(attempt + 1, RESYNC_DELAYS_MS.length - 1);
    scheduleResync(inst);
  }, RESYNC_DELAYS_MS[attempt]);
}
function blockUntilReady(inst) {
  showAlert(inst.context);
  requestState(inst);
}
async function configureInstance(msg, replacing = false) {
  const settings = msg.payload?.settings || {};
  let inst = instances.get(msg.context);
  const oldPort = inst ? cfg(inst.settings).receivePort : null;
  if (!inst) {
    inst = {
      context: msg.context,
      action: msg.action,
      settings,
      configuring: true,
      value: undefined,
      muted: undefined,
      toggleStates: new Map(),
      snapshotState: undefined,
      lastFeedbackAt: 0,
      feedbackTimer: null,
      reconcileTimer: null,
      resyncTimer: null,
      resyncAttempt: 0,
      connected: undefined
    };
    instances.set(msg.context, inst);
  } else {
    inst.action = msg.action || inst.action;
    inst.settings = settings;
    if (replacing) {
      inst.value = undefined;
      inst.muted = undefined;
      inst.toggleStates.clear();
      inst.snapshotState = undefined;
    }
  }
  const newPort = cfg(settings).receivePort;
  if (oldPort === null || oldPort !== newPort) {
    if (oldPort !== null) releaseReceiver(oldPort);
    try {
      await acquireReceiver(newPort);
    } catch (error) {
      console.error(`Cannot bind OSC receive port ${newPort}:`, error.message || error);
      showAlert(msg.context);
      return;
    }
  } else {
    const entry = receiverEntry(newPort);
    if (entry) await entry.ready;
    else await acquireReceiver(newPort);
  }
  if (inst.action === ACTION_OUTPUT || inst.action === ACTION_MIX) renderDial(inst, true);
  else if (inst.action === ACTION_TOGGLE) {
    setTitle(inst.context, "");
    setImage(inst.context, keyImage(inst, false));
  } else if (inst.action === ACTION_SNAPSHOT) {
    setTitle(inst.context, `SNAP ${integer(settings.snapshot, 1, 1, 8)}`);
    setImage(inst.context, keyImage(inst, false));
  }
  requestState(inst);
  inst.resyncAttempt = 0;
  scheduleResync(inst);
}
function enqueueContext(context, operation) {
  const previous = contextOperations.get(context) || Promise.resolve();
  const current = previous.catch(() => {}).then(operation);
  contextOperations.set(context, current);
  void current.catch(error => console.error(`Context ${context}:`, error.message || error)).finally(() => {
    if (contextOperations.get(context) === current) contextOperations.delete(context);
  });
  return current;
}
function queueConfiguration(msg, replacing = false) {
  const existing = instances.get(msg.context);
  if (existing) existing.configuring = true;
  return enqueueContext(msg.context, async () => {
    try { await configureInstance(msg, replacing); }
    finally {
      const inst = instances.get(msg.context);
      if (inst) inst.configuring = false;
    }
  });
}
function removeInstance(context) {
  const inst = instances.get(context);
  if (!inst) return;
  instances.delete(context);
  clearTimeout(inst.feedbackTimer);
  clearTimeout(inst.reconcileTimer);
  clearTimeout(inst.resyncTimer);
  releaseReceiver(cfg(inst.settings).receivePort);
}
function onDialRotate(msg) {
  const inst = instances.get(msg.context);
  if (!inst || (inst.action !== ACTION_OUTPUT && inst.action !== ACTION_MIX)) return;
  if (!isReady(inst, "rotate")) return blockUntilReady(inst);
  if (inst.muted === true) return;
  const ticks = finite(msg.payload?.ticks, 0);
  if (!ticks) return;
  const step = Math.max(0.01, finite(inst.settings.stepDb, 0.5));
  const min = Math.min(finite(inst.settings.minDb, -65), finite(inst.settings.maxDb, 6));
  const current = inst.value < min && ticks > 0 ? min : inst.value;
  const next = clampDb(inst.settings, current + ticks * step);
  sendCommand(inst, inst.action === ACTION_OUTPUT ? outputPath(inst.settings) : mixPath(inst.settings), next, true);
}
function onDialDown(msg) {
  const inst = instances.get(msg.context);
  if (!inst || (inst.action !== ACTION_OUTPUT && inst.action !== ACTION_MIX) || inst.settings.muteOnPress === false) return;
  if (!isReady(inst, "mute")) return blockUntilReady(inst);
  const path = inst.action === ACTION_OUTPUT ? outputMutePath(inst.settings) : mixMutePath(inst.settings);
  sendCommand(inst, path, inst.muted ? 0 : 1);
}
function onKeyUp(msg) {
  const inst = instances.get(msg.context);
  if (!inst || inst.action !== ACTION_TOGGLE) return;
  const spec = toggleSpec(inst.settings);
  if (!spec.momentary) return;
  for (const path of spec.paths) sendCommand(inst, path, 0);
}
function onKeyDown(msg) {
  const inst = instances.get(msg.context);
  if (!inst) return;
  if (inst.action === ACTION_TOGGLE) {
    if (!isReady(inst, "toggle")) return blockUntilReady(inst);
    const spec = toggleSpec(inst.settings);
    if (spec.momentary) {
      for (const path of spec.paths) sendCommand(inst, path, 1);
      return;
    }
    const feedbackPaths = toggleFeedbackPaths(spec);
    const next = feedbackPaths.every(path => inst.toggleStates.get(path)) ? 0 : 1;
    for (const path of spec.paths) sendCommand(inst, path, next);
  } else if (inst.action === ACTION_SNAPSHOT) {
    if (inst.configuring) return blockUntilReady(inst);
    sendCommand(inst, `/snapshot/load/${integer(inst.settings.snapshot, 1, 1, 8)}`, 1);
  }
}

const port = arg("-port");
const pluginUUID = arg("-pluginUUID");
const registerEvent = arg("-registerEvent");
if (!port || !pluginUUID || !registerEvent) {
  console.error("Missing Stream Deck registration arguments.");
  process.exit(1);
}
function connectStreamDeck() {
  if (shuttingDown) return;
  sd = new WebSocket(`ws://127.0.0.1:${port}`);
  sd.addEventListener("open", () => {
    reconnectAttempt = 0;
    sd.send(JSON.stringify({event: registerEvent, uuid: pluginUUID}));
  });
  sd.addEventListener("message", event => {
    try {
      const msg = JSON.parse(event.data);
      if (msg.event === "willAppear") void queueConfiguration(msg);
      else if (msg.event === "willDisappear") void enqueueContext(msg.context, () => removeInstance(msg.context));
      else if (msg.event === "dialRotate") onDialRotate(msg);
      else if (msg.event === "dialDown") onDialDown(msg);
      else if (msg.event === "keyDown") onKeyDown(msg);
      else if (msg.event === "keyUp") onKeyUp(msg);
      else if (msg.event === "didReceiveSettings") void queueConfiguration(msg, true);
    } catch (error) {
      console.error("Stream Deck message:", error.message || error);
    }
  });
  sd.addEventListener("error", error => console.error("Stream Deck WebSocket:", error.message || error));
  sd.addEventListener("close", () => {
    if (shuttingDown) return;
    clearTimeout(reconnectTimer);
    const delay = Math.min(10000, 250 * (2 ** reconnectAttempt++));
    reconnectTimer = setTimeout(connectStreamDeck, delay);
  });
}
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  clearTimeout(reconnectTimer);
  for (const context of [...instances.keys()]) removeInstance(context);
  for (const item of queuedSends.values()) clearTimeout(item.timer);
  queuedSends.clear();
  for (const item of queuedGlobalRequests.values()) clearTimeout(item.timer);
  queuedGlobalRequests.clear();
  try { oscTx.close(); } catch {}
  try { sd?.close(); } catch {}
}
process.once("SIGTERM", shutdown);
process.once("SIGINT", shutdown);
connectStreamDeck();

export {decodeOsc, encodeOsc};
