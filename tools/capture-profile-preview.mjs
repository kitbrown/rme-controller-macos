// Read profile actions from stdin and capture their Stream Deck display messages.
// Both transports are in memory. Importing the plugin cannot open a real port.
import assert from "node:assert/strict";
import dgram from "node:dgram";
import {EventEmitter} from "node:events";
import {readFileSync} from "node:fs";
import {setTimeout as delay} from "node:timers/promises";
import {recipePlan} from "../com.fionetworks.rme-globalosc.sdPlugin/bin/processing-recipe.js";
import {resolveParameter} from "../com.fionetworks.rme-globalosc.sdPlugin/ui/parameter-config.js";

const pages = JSON.parse(readFileSync(0, "utf8"));
const frames = new Map();
let receiver, deck;
class MixerSocket extends EventEmitter {
  bind() { receiver = this; queueMicrotask(() => this.emit("listening")); }
  send(_bytes, _port, _host, done) { done(); }
  close() {}
}
dgram.createSocket = () => new MixerSocket();
globalThis.WebSocket = class {
  static OPEN = 1;
  readyState = 1;
  listeners = {};
  constructor() { deck = this; }
  addEventListener(name, callback) { this.listeners[name] = callback; }
  send(message) {
    const {context, event, payload} = JSON.parse(message);
    if (context) frames.get(context)[event] = payload;
  }
  close() {}
};
process.argv.push("-port", "1", "-pluginUUID", "preview", "-registerEvent", "registerPlugin");
const {encodeOsc} = await import("../com.fionetworks.rme-globalosc.sdPlugin/bin/plugin.js");
deck.listeners.open();
const actions = pages.flatMap(page => page.Controllers.flatMap(controller => Object.values(controller.Actions)));
for (const {UUID: action, ActionID: context, Settings: settings} of actions) {
  frames.set(context, {});
  deck.listeners.message({data: JSON.stringify({event:"willAppear", action, context, payload:{settings}})});
}
await delay(30);
const mix = new Map(Object.entries({
  "/controlroom/mainmono":0, "/controlroom/dim":0, "/controlroom/talkback":0,
  "/output/0/volume":-12, "/output/8/volume":-6, "/output/6/volume":-18,
  "/output/0/mute":0, "/output/8/mute":0, "/output/6/mute":0,
  "/input/0/mute":0, "/input/8/mute":1, "/playback/0/mute":0,
  "/mix/pb/0/0/fader":-4, "/mix/in/0/0/fader":-8, "/mix/in/8/0/fader":-16,
  "/level/out/0":-10, "/level/out/1":-8, "/input/0/autolevel/enable":0
}));
for (let slot = 1; slot <= 8; slot++) mix.set("/snapshot/load/" + slot, slot === 1 ? 2 : 1);
for (const {UUID, Settings} of actions) {
  if (UUID.endsWith(".parameter")) mix.set(resolveParameter(Settings).path, 0);
  if (UUID.endsWith(".processingrecipe")) {
    const plan = recipePlan(Settings);
    for (const step of plan?.steps || []) if (!mix.has(step.path)) mix.set(step.path, step.value);
  }
}
// One coherent TotalMix state shared by every displayed page.
for (const {Settings} of actions) {
  if (["HPF","1K CUT","DEEP VOX","EXP"].includes(Settings.recipeName)) {
    for (const step of recipePlan(Settings).steps) mix.set(step.path, step.value);
  }
}
for (const [path, value] of mix) receiver.emit("message", encodeOsc(path,[value]), {address:"127.0.0.1"});
await delay(1050); // Allow throttled meters and the diagnostic display to repaint.
for (const page of pages) {
  for (const controller of page.Controllers) {
    for (const action of Object.values(controller.Actions)) {
      const frame = frames.get(action.ActionID);
      if (controller.Type === "Keypad") {
        assert(frame.setImage?.image, action.Name);
        action.image = frame.setImage.image;
        action.title = frame.setTitle?.title || "";
      } else {
        assert(frame.setFeedback?.value, action.Name);
        action.feedback = frame.setFeedback;
      }
    }
  }
}
process.emit("SIGTERM");
process.stdout.write(JSON.stringify(pages));
