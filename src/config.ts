import type { JsonObject } from "@elgato/utils";

export const DEFAULT_HOST = "127.0.0.1";
export const DEFAULT_SEND_PORT = 7008;
export const DEFAULT_RECEIVE_PORT = 9008;

export function cfg(settings: JsonObject) {
  return {
    host: typeof settings.host === "string" ? settings.host : DEFAULT_HOST,
    sendPort: typeof settings.sendPort === "number" ? settings.sendPort : DEFAULT_SEND_PORT,
    receivePort: typeof settings.receivePort === "number" ? settings.receivePort : DEFAULT_RECEIVE_PORT
  };
}
