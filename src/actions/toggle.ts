import { action, KeyDownEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { cfg } from "../config.js";
import { osc } from "../osc.js";
import type { ToggleSettings } from "../types.js";

const UUID = "com.chris.rme-globalosc.toggle";
const states = new Map<string, boolean>();

@action({ UUID })
export class ToggleAction extends SingletonAction<ToggleSettings> {
  override async onWillAppear(ev: WillAppearEvent<ToggleSettings>): Promise<void> {
    if (!ev.action.isKey()) return;
    const c = cfg(ev.payload.settings);
    await osc.listen(c.receivePort);
    const path = typeof ev.payload.settings.path === "string" ? ev.payload.settings.path : "/controlroom/dim";
    const title = typeof ev.payload.settings.title === "string" ? ev.payload.settings.title : "DIM";
    await ev.action.setTitle(title);
    osc.onMessage(async m => {
      if (m.address === path && typeof m.args[0] === "number") {
        const on = m.args[0] > 0.5;
        states.set(ev.action.id, on);
        await ev.action.setState(on ? 1 : 0);
        await ev.action.setTitle(title);
      }
    });
    osc.send(c.host, c.sendPort, "/sendstate", 1);
  }

  override async onKeyDown(ev: KeyDownEvent<ToggleSettings>): Promise<void> {
    const c = cfg(ev.payload.settings);
    const path = typeof ev.payload.settings.path === "string" ? ev.payload.settings.path : "/controlroom/dim";
    const next = !(states.get(ev.action.id) ?? false);
    states.set(ev.action.id, next);
    osc.send(c.host, c.sendPort, path, next ? 1 : 0);
    await ev.action.setState(next ? 1 : 0);
  }
}
