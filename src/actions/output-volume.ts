import { action, DialDownEvent, DialRotateEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { cfg } from "../config.js";
import { osc } from "../osc.js";
import type { OutputVolumeSettings } from "../types.js";

const UUID = "com.chris.rme-globalosc.outputvolume";
const levels = new Map<string, number>();
const muted = new Map<string, boolean>();

@action({ UUID })
export class OutputVolumeAction extends SingletonAction<OutputVolumeSettings> {
  override async onWillAppear(ev: WillAppearEvent<OutputVolumeSettings>): Promise<void> {
    if (!ev.action.isDial()) return;
    const dialAction = ev.action;
    const c = cfg(ev.payload.settings);
    await osc.listen(c.receivePort);
    const index = typeof ev.payload.settings.outputIndex === "number" ? ev.payload.settings.outputIndex : 0;
    await dialAction.setFeedback({ title: `OUT ${index}`, value: "-- dB", indicator: 0 });
    osc.onMessage(async m => {
      const volPath = `/output/${index}/volume`;
      const mutePath = `/output/${index}/mute`;
      if (m.address === volPath && typeof m.args[0] === "number") {
        const db = m.args[0];
        levels.set(dialAction.id, db);
        await dialAction.setFeedback({ title: `OUT ${index}`, value: `${db.toFixed(1)} dB`, indicator: Math.max(0, Math.min(100, ((db + 65) / 71) * 100)) });
      } else if (m.address === mutePath && typeof m.args[0] === "number") {
        muted.set(dialAction.id, m.args[0] > 0.5);
      }
    });
    osc.send(c.host, c.sendPort, `/sendchan/output/${index}`, 1);
  }

  override async onDialRotate(ev: DialRotateEvent<OutputVolumeSettings>): Promise<void> {
    const c = cfg(ev.payload.settings);
    const index = typeof ev.payload.settings.outputIndex === "number" ? ev.payload.settings.outputIndex : 0;
    const step = typeof ev.payload.settings.stepDb === "number" ? ev.payload.settings.stepDb : 0.5;
    const current = levels.get(ev.action.id) ?? -30;
    const next = Math.max(-65, Math.min(6, current + ev.payload.ticks * step));
    levels.set(ev.action.id, next);
    osc.send(c.host, c.sendPort, `/output/${index}/volume`, next);
    await ev.action.setFeedback({ title: `OUT ${index}`, value: `${next.toFixed(1)} dB`, indicator: Math.max(0, Math.min(100, ((next + 65) / 71) * 100)) });
  }

  override async onDialDown(ev: DialDownEvent<OutputVolumeSettings>): Promise<void> {
    if (ev.payload.settings.muteOnPress === false) return;
    const c = cfg(ev.payload.settings);
    const index = typeof ev.payload.settings.outputIndex === "number" ? ev.payload.settings.outputIndex : 0;
    const next = !(muted.get(ev.action.id) ?? false);
    muted.set(ev.action.id, next);
    osc.send(c.host, c.sendPort, `/output/${index}/mute`, next ? 1 : 0);
  }
}
