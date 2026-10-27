import assert from "node:assert/strict";
import dgram from "node:dgram";
import {pathToFileURL} from "node:url";

const pluginPath = process.argv[2];
assert(pluginPath, "Pass plugin.js path");
const HOST = "127.0.0.1", SEND = 17028, RECEIVE = 19028;
const sleep = ms => new Promise(done => setTimeout(done, ms));
const pad4 = value => (value + 3) & ~3;
const paddedString = value => { const raw=Buffer.from(value + "\0");const out=Buffer.alloc(pad4(raw.length));raw.copy(out);return out; };
const osc = (path, value) => {
  const arg=Buffer.alloc(4);arg.writeInt32BE(value);
  return Buffer.concat([paddedString(path),paddedString(",i"),arg]);
};
class FakeWebSocket {
  static OPEN=1;static instance;readyState=1;sent=[];listeners=new Map();
  constructor(){FakeWebSocket.instance=this;queueMicrotask(()=>this.listeners.get("open")?.({}));}
  addEventListener(name,callback){this.listeners.set(name,callback);}
  send(payload){this.sent.push(JSON.parse(payload));}
  message(payload){this.listeners.get("message")?.({data:JSON.stringify(payload)});}
}
globalThis.WebSocket=FakeWebSocket;
const rx=dgram.createSocket("udp4"), tx=dgram.createSocket("udp4");
await new Promise(resolve=>rx.bind(SEND,HOST,resolve));
process.argv.push("-port","12345","-pluginUUID","com.fionetworks.rme-globalosc","-registerEvent","registerPlugin");
await import(pathToFileURL(pluginPath).href + "?colors=" + Date.now());
const ws=FakeWebSocket.instance;
const root="com.fionetworks.rme-globalosc";
const settings={host:HOST,sendPort:SEND,receivePort:RECEIVE};
const image=context=>{
  const msg=ws.sent.filter(m=>m.context===context && m.event==="setImage").at(-1);
  return msg && decodeURIComponent(msg.payload.image.split(",")[1]);
};
const expectAccent=(context,expected)=>{
  const svg=image(context);
  assert(svg,"missing key image for "+context);
  const rectangle='<rect x="16" y="16" width="112" height="3" rx="1.5" fill="'+expected+'"/>';
  assert(svg.includes(rectangle),context+" incorrect family/status accent");
  // Preserve current key design: same text display / status and proportions.
  assert(svg.includes('width="144" height="144"'),"changed key artwork size");
  assert(svg.includes('<rect x="21" y="45" width="102" height="35"'),"changed key layout");
  assert(svg.includes('<text x="72" y="126"'),"changed status caption layout");
};
const waitFor=async (predicate,message)=>{
  for(let i=0;i<70;i++){if(predicate())return;await sleep(15);}
  assert.fail(message);
};
const cases=[
  ["mainMute",["/output/0/mute"],"#38d9ff"],
  ["micMute",["/input/0/mute"],"#38d9ff"],
  ["tvSpdifMute",["/input/8/mute"],"#38d9ff"],
  ["spdifOutMute",["/output/8/mute"],"#38d9ff"],
  ["phonesMute",["/output/6/mute"],"#38d9ff"],
  ["dim",["/controlroom/dim"],"#58e6a9"],
  ["mono",["/controlroom/mainmono"],"#58e6a9"],
  ["mic48v",["/input/0/48v","/input/1/48v"],"#58e6a9"],
  ["talkback",["/controlroom/dim"],"#58e6a9"],
  ["custom-mute",["/input/9/mute"],"#38d9ff"],
  ["custom-other",["/controlroom/dim"],"#58e6a9"]
];
for(const [preset,paths,idleAccent] of cases){
  const context="test-"+preset;
  const extra=preset.startsWith("custom") ? {preset:"custom",path:paths[0]} : {preset};
  ws.message({event:"willAppear",action:root+".toggle",context,payload:{settings:{...settings,...extra}}});
  await waitFor(()=>!!image(context),context+" idle artwork missing");
  expectAccent(context,idleAccent);
  for(const path of paths)tx.send(osc(path,1),RECEIVE,HOST);
  await waitFor(()=>image(context)?.includes('<rect x="16" y="16" width="112" height="3" rx="1.5" fill="#ff5d69"'),
    context+" active artwork did not turn red");
  expectAccent(context,"#ff5d69");
  ws.message({event:"willDisappear",action:root+".toggle",context,payload:{}});
  await sleep(10);
}
for(let snapshot=1;snapshot<=8;snapshot++){
  const context="snap-"+snapshot;
  ws.message({event:"willAppear",action:root+".snapshot",context,payload:{settings:{...settings,snapshot}}});
  await waitFor(()=>!!image(context),context+" idle artwork missing");
  expectAccent(context,"#c88cff");
  tx.send(osc("/snapshot/load/"+snapshot,2),RECEIVE,HOST);
  await waitFor(()=>image(context)?.includes('<rect x="16" y="16" width="112" height="3" rx="1.5" fill="#ff5d69"'),
    context+" active artwork did not turn red");
  expectAccent(context,"#ff5d69");
  ws.message({event:"willDisappear",action:root+".snapshot",context,payload:{}});
  await sleep(10);
}
tx.close();rx.close();
console.log("PASS: all 8 snapshots, 5 mute presets, custom mute, and other actions share category idle colors and active red");
process.exit(0);
