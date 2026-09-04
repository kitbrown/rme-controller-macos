import type { JsonObject, JsonValue } from "@elgato/streamdeck";

export type OscSettings = JsonObject & {
  host?: string;
  sendPort?: number;
  receivePort?: number;
};

export type OutputVolumeSettings = OscSettings & {
  outputIndex?: number;
  stepDb?: number;
  muteOnPress?: boolean;
};

export type MixFaderSettings = OscSettings & {
  bus?: "in" | "playback";
  sourceIndex?: number;
  outputIndex?: number;
  stepDb?: number;
};

export type ToggleSettings = OscSettings & {
  path?: string;
  title?: string;
};

export type SnapshotSettings = OscSettings & {
  snapshot?: number;
};

export function n(v: JsonValue | undefined, fallback: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : fallback;
}
export function s(v: JsonValue | undefined, fallback: string): string {
  return typeof v === "string" && v.length ? v : fallback;
}
