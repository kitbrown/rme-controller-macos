import dgram from "node:dgram";

const HOST = "127.0.0.1";
const SEND_PORT = 7008;
const RECEIVE_PORT = 9008;
const pad4 = value => (value + 3) & ~3;

function oscString(value) {
  const raw = Buffer.from(`${value}\0`, "utf8");
  const output = Buffer.alloc(pad4(raw.length));
  raw.copy(output);
  return output;
}

function encode(address, value = 1) {
  const payload = Buffer.alloc(4);
  payload.writeInt32BE(value);
  return Buffer.concat([oscString(address), oscString(",i"), payload]);
}

function readString(buffer, offset) {
  const end = buffer.indexOf(0, offset);
  if (end < 0) throw new Error("Malformed OSC string");
  return [buffer.toString("utf8", offset, end), pad4(end + 1)];
}

function addresses(buffer, output = []) {
  let address;
  [address] = readString(buffer, 0);
  if (address !== "#bundle") {
    output.push(address);
    return output;
  }
  let offset = 16;
  while (offset + 4 <= buffer.length) {
    const size = buffer.readInt32BE(offset);
    offset += 4;
    if (size <= 0 || offset + size > buffer.length) break;
    addresses(buffer.subarray(offset, offset + size), output);
    offset += size;
  }
  return output;
}

const socket = dgram.createSocket("udp4");
const received = [];
socket.on("message", packet => {
  try { received.push(...addresses(packet)); }
  catch (error) { received.push(`[decode-error: ${error.message}]`); }
});
await new Promise((resolve, reject) => {
  socket.once("error", reject);
  socket.bind(RECEIVE_PORT, HOST, resolve);
});

const probes = [
  ["sendall", "/sendall"],
  ["current output", "/sendchan/output/0"],
  ["legacy output", "/sendchan/0/output"],
  ["current input", "/sendchan/input/0"],
  ["legacy input", "/sendchan/0/input"]
];

for (const [label, address] of probes) {
  const start = received.length;
  socket.send(encode(address), SEND_PORT, HOST);
  await new Promise(resolve => setTimeout(resolve, 500));
  const sample = received.slice(start);
  const mix = sample.filter(item => item.startsWith("/mix/"));
  console.log(`${label}: ${sample.length} messages; ${mix.length} mix faders`);
  console.log([...new Set(sample)].slice(0, 20).join("\n"));
}

socket.close();
