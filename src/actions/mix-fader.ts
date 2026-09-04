import { action, DialRotateEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { cfg } from "../config.js";
import { osc } from "../osc.js";
import type { MixFaderSettings } from "../types.js";

const UUID = "com.chris.rme-globalosc.mixfader";
const levels = new Map<string, number>();

@action({ UUID })
export class MixFaderAction extends SingletonAction<MixFaderSettings> {
  private path(settings: MixFaderSettings): string {
    const bus = settings.bus === "playback" ? "playback" : "in";
    const src = typeof settings.sourceIndex === "number" ? settings.sourceIndex : 0;
    const out = typeof settings.outputIndex === "number" ? settings.outputIndex : 0;
    return `/mix/${bus}/${src}/${out}/fader`;
  }

  override async onWillAppear(ev: WillAppearEvent<MixFaderSettings>): Promise<void> {
    if (!ev.action.isDial()) return;
    const c = cfg(ev.payload.settings);
    await osc.listen(c.receivePort);
    const path = this.path(ev.payload.settings);
    await ev.action.setFeedback({ title: "SUBMIX", value: "-- dB", indicator: 0 });
    osc.onMessage(async m => {
      if (m.address === path && typeof m.args[0] === "number") {
        const db = m.args[0];
        levels.set(ev.action.id, db);
        await ev.action.setFeedback({ title: "SUBMIX", value: `${db.toFixed(1)} dB`, indicator: Math.max(0, Math.min(100, ((db + 65) / 71) * 100)) });
      }
    });
    const bus = ev.payload.settings.bus === "playback" ? "playback" : "input";
    const src = typeof ev.payload.settings.sourceIndex === "number" ? ev.payload.settings.sourceIndex : 0;
    osc.send(c.host, c.sendPort, `/sendchan/${bus}/${src}`, 1);
  }

  override async onDialRotate(ev: DialRotateEvent<MixFaderSettings>): Promise<void> {
    const c = cfg(ev.payload.settings);
    const step = typeof ev.payload.settings.stepDb === "number" ? ev.payload.settings.stepDb : 0.5;
    const current = levels.get(ev.action.id) ?? -30;
    const next = Math.max(-65, Math.min(6, current + ev.payload.ticks * step));
    levels.set(ev.action.id, next);
    osc.send(c.host, c.sendPort, this.path(ev.payload.settings), next);
    await ev.action.setFeedback({ title: "SUBMIX", value: `${next.toFixed(1)} dB`, indicator: Math.max(0, Math.min(100, ((next + 65) / 71) * 100)) });
  }
}
