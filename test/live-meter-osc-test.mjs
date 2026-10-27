import assert from "node:assert/strict";
import dgram from "node:dgram";
import {pathToFileURL} from "node:url";

const pluginPath = process.argv[2];
assert(pluginPath, "Provide plugin.js path");
const HOST="127.0.0.1",TX=17411,RX=19411;
const sleep = ms => new Promise(resolve => setTimeout(resolve,ms));
const pad4 = n => (n+3)&~3;
const oscStr = s => {const x=Buffer.from(s+"\0");const y=Buffer.alloc(pad4(x.length));x.copy(y);return y;};
function encode(address,value) {
  const f=Buffer.alloc(4);
  Number.isInteger(value)?f.writeInt32BE(value):f.writeFloatBE(value);
  return Buffer.concat([oscStr(address),oscStr(Number.isInteger(value)?",i":",f"),f]);
}
const recvPacket = b => b.toString("utf8",0,b.indexOf(0));
class FakeWebSocket {
  static OPEN=1;static instance;
  readyState=1;sent=[];callbacks=new Map();
  constructor(){FakeWebSocket.instance=this;queueMicrotask(()=>this.emit("open",{}));}
  addEventListener(event,cb){this.callbacks.set(event,cb);}
  emit(event,e){this.callbacks.get(event)?.(e);}
  send(payload){this.sent.push(JSON.parse(payload));}
  message(payload){this.emit("message",{data:JSON.stringify(payload)});}
}
globalThis.WebSocket=FakeWebSocket;
const totalMix=dgram.createSocket("udp4"), feedback=dgram.createSocket("udp4");
const packets=[];
totalMix.on("message",p=>packets.push(recvPacket(p)));
await new Promise(done=>totalMix.bind(TX,HOST,done));
const feedbackOSC=(path,value)=>feedback.send(encode(path,value),RX,HOST);
const settings=(position,extra={})=>({host:HOST,sendPort:TX,receivePort:RX,preset:"main",target:"output",keyMode:"meter",stackSegments:"3",stackPosition:String(position),...extra});
const action="com.fionetworks.rme-globalosc.levelkey";
const images=(context)=>FakeWebSocket.instance.sent.filter(m=>m.context===context&&m.event==="setImage").map(m=>decodeURIComponent(m.payload.image.split(",")[1]));
const last=context=>images(context).at(-1)||"";
const meterHeight=svg=>{
  const m=svg.match(/<rect x="17" y="[\d.]+" width="110" height="([\d.]+)" fill="/);
  return m?Number(m[1]):0;
};
async function until(ok,reason,ms=2000){
  const start=Date.now();while(Date.now()-start<ms){if(ok())return;await sleep(15);}
  assert.fail(reason);
}

process.argv.push("-port","12345","-pluginUUID","com.fionetworks.rme-globalosc","-registerEvent","registerPlugin");
await import(pathToFileURL(pluginPath).href+"?meter="+Date.now());
await until(()=>FakeWebSocket.instance?.sent.length>0,"Stream Deck registration missing");
const ws=FakeWebSocket.instance;
for(const [position,context] of [[1,"bottom"],[2,"middle"],[3,"top"]]){
  ws.message({event:"willAppear",action,context,payload:{settings:settings(position)}});
}
await until(()=>images("bottom").length>0&&images("middle").length>0&&images("top").length>0,"initial stack render missing");
assert.equal(meterHeight(last("bottom")),0,"do not invent initial fader state");
assert.equal(meterHeight(last("top")),0);
await until(()=>packets.includes("/sendchan/output/0"),"initial TotalMix state request missing");
feedbackOSC("/output/0/volume",-29.5); // midpoint of the configured -65..+6 dB range
feedbackOSC("/output/0/mute",0);
await until(()=>meterHeight(last("middle"))>70,"middle segment never received feedback");
assert.equal(meterHeight(last("bottom")),144,"lowest key should fill first");
assert.equal(meterHeight(last("middle")),72,"middle key should be half full");
assert.equal(meterHeight(last("top")),0,"highest key should remain empty");
for(const context of ["bottom","middle","top"]){
  assert(!last(context).includes("<text"),"meter must remain entirely unlabeled");
  assert(!last(context).includes("<line "),"meter must have no segment lines");
}
const initialPackets=packets.length;
for(const context of ["bottom","middle","top"])ws.message({event:"keyDown",action,context,payload:{}});
await sleep(100);
assert.equal(packets.filter(p=>p==="/output/0/volume"||p==="/output/0/mute").length,0,"meter keys must never command fader or mute");
feedbackOSC("/output/0/volume",6);
await until(()=>meterHeight(last("top"))===144,"full-scale stack not filled");
feedbackOSC("/output/0/mute",1);
await until(()=>last("top").includes("#a83743"),"mute must show shared red indication");
feedbackOSC("/output/0/volume",-65);
await until(()=>meterHeight(last("bottom"))===0,"stack should clear when fader moves to minimum");
assert.equal(packets.length,initialPackets,"external feedback must not generate outgoing OSC packets");

// Test fourth independent key and range, without interfering with the existing stack.
ws.message({event:"willAppear",action,context:"fourth",payload:{settings:settings(4,{stackSegments:"4"})}});
await until(()=>images("fourth").length>0,"fourth segment missing");
feedbackOSC("/output/0/volume",6);
await until(()=>meterHeight(last("fourth"))===144,"fourth segment did not reach full scale");
for(const context of ["bottom","middle","top","fourth"])ws.message({event:"willDisappear",action,context,payload:{}});
await sleep(40);
feedback.close();totalMix.close();
console.log("PASS: live OSC drives continuous 3/4-key fader meter, initial unknown, mute, and no-touch safety");
process.exit(0);
