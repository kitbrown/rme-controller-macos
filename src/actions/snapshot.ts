import { action, KeyDownEvent, SingletonAction, WillAppearEvent } from "@elgato/streamdeck";
import { cfg } from "../config.js";
import { osc } from "../osc.js";
import type { SnapshotSettings } from "../types.js";

const UUID = "com.chris.rme-globalosc.snapshot";

@action({ UUID })
export class SnapshotAction extends SingletonAction<SnapshotSettings> {
  override async onWillAppear(ev: WillAppearEvent<SnapshotSettings>): Promise<void> {
    if (!ev.action.isKey()) return;
    const c = cfg(ev.payload.settings);
    await osc.listen(c.receivePort);
    const snap = typeof ev.payload.settings.snapshot === "number" ? ev.payload.settings.snapshot : 1;
    await ev.action.setTitle(`SNAP ${snap}`);
    osc.onMessage(async m => {
      if (m.address === `/snapshot/load/${snap}` && typeof m.args[0] === "number") {
        await ev.action.setState(m.args[0] > 0.5 ? 1 : 0);
      }
    });
    osc.send(c.host, c.sendPort, "/sendstate", 1);
  }

  override async onKeyDown(ev: KeyDownEvent<SnapshotSettings>): Promise<void> {
    const c = cfg(ev.payload.settings);
    const snap = typeof ev.payload.settings.snapshot === "number" ? ev.payload.settings.snapshot : 1;
    osc.send(c.host, c.sendPort, `/snapshot/load/${snap}`, 1);
  }
}
