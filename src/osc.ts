import dgram from "node:dgram";

export type OscArg = number | string;
export type OscMessage = { address: string; args: OscArg[] };

function pad4(n: number): number { return (n + 3) & ~3; }

function oscString(value: string): Buffer {
  const raw = Buffer.from(value + "\0", "utf8");
  const out = Buffer.alloc(pad4(raw.length));
  raw.copy(out);
  return out;
}

export function encodeOsc(address: string, args: OscArg[]): Buffer {
  const tags = "," + args.map(v => typeof v === "string" ? "s" : "f").join("");
  const chunks: Buffer[] = [oscString(address), oscString(tags)];
  for (const arg of args) {
    if (typeof arg === "string") chunks.push(oscString(arg));
    else {
      const b = Buffer.alloc(4);
      b.writeFloatBE(arg, 0);
      chunks.push(b);
    }
  }
  return Buffer.concat(chunks);
}

function readString(buf: Buffer, offset: number): [string, number] {
  const end = buf.indexOf(0, offset);
  if (end < 0) throw new Error("Malformed OSC string");
  return [buf.toString("utf8", offset, end), pad4(end + 1)];
}

export function decodeOsc(buf: Buffer): OscMessage[] {
  if (buf.length >= 8 && buf.toString("ascii", 0, 7) === "#bundle") {
    const out: OscMessage[] = [];
    let off = 16;
    while (off + 4 <= buf.length) {
      const size = buf.readInt32BE(off); off += 4;
      if (size <= 0 || off + size > buf.length) break;
      out.push(...decodeOsc(buf.subarray(off, off + size)));
      off += size;
    }
    return out;
  }
  let off = 0;
  const [address, o1] = readString(buf, off); off = o1;
  const [tags, o2] = readString(buf, off); off = o2;
  const args: OscArg[] = [];
  for (const tag of tags.slice(1)) {
    if (tag === "f") { args.push(buf.readFloatBE(off)); off += 4; }
    else if (tag === "i") { args.push(buf.readInt32BE(off)); off += 4; }
    else if (tag === "s") { const [v, no] = readString(buf, off); args.push(v); off = no; }
    else if (tag === "T") args.push(1);
    else if (tag === "F") args.push(0);
    else break;
  }
  return [{ address, args }];
}

export class OscTransport {
  private rx?: dgram.Socket;
  private tx = dgram.createSocket("udp4");
  private listeners = new Set<(m: OscMessage) => void>();
  private boundPort?: number;

  async listen(port: number): Promise<void> {
    if (this.rx && this.boundPort === port) return;
    if (this.rx) { this.rx.close(); this.rx = undefined; }
    this.rx = dgram.createSocket("udp4");
    this.rx.on("message", b => {
      try { for (const m of decodeOsc(b)) for (const fn of this.listeners) fn(m); }
      catch { /* malformed/unneeded OSC is ignored */ }
    });
    await new Promise<void>((resolve, reject) => {
      this.rx!.once("error", reject);
      this.rx!.bind(port, "0.0.0.0", () => { this.rx!.off("error", reject); resolve(); });
    });
    this.boundPort = port;
  }

  onMessage(fn: (m: OscMessage) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  send(host: string, port: number, address: string, ...args: OscArg[]): void {
    const packet = encodeOsc(address, args);
    this.tx.send(packet, port, host);
  }
}

export const osc = new OscTransport();
