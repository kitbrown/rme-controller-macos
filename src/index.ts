import streamDeck from "@elgato/streamdeck";
import { OutputVolumeAction } from "./actions/output-volume.js";
import { MixFaderAction } from "./actions/mix-fader.js";
import { ToggleAction } from "./actions/toggle.js";
import { SnapshotAction } from "./actions/snapshot.js";

streamDeck.logger.setLevel("debug");
streamDeck.actions.registerAction(new OutputVolumeAction());
streamDeck.actions.registerAction(new MixFaderAction());
streamDeck.actions.registerAction(new ToggleAction());
streamDeck.actions.registerAction(new SnapshotAction());
streamDeck.connect();
