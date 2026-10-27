import assert from "node:assert/strict";
import dgram from "node:dgram";
import {pathToFileURL} from "node:url";

// Test actual UDP Global OSC packet ingestion and Stream Deck artwork emissions.
const pluginPath=process.argv[2];
assert(pluginPath, "Provide path to plugin.js");
const HOST="127.0.0.1", TX=17411, RX=19411;
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const pad4=n=>(n+3)&~3;
const oscStr=s=>{const x=Buffer.from(s+"\0");const y=Buffer.alloc(pad4(x.length));x.copy(y);return y;};
function encode(path,value){
  const b=Buffer.alloc(4);
  Number.isInteger(value)?b.writeInt32BE(value):b.writeFloatBE(value);
  return Buffer.concat([oscStr(path),oscStr(Number.isInteger(value)?",i":",f"),b]);
}
function readPacket(packet){return packet.toString("utf8",0,packet.indexOf(0));}
class FakeWebSocket{
  static OPEN=1;static instance;
  readyState=1;sent=[];callbacks=new Map();
  constructor(){FakeWebSocket.instance=this;queueMicrotask(()=>this.emit("open",{}));}
  addEventListener(event,cb){this.callbacks.set(event,cb);}
  emit(event,data){this.callbacks.get(event)?.(data);}
  send(json){this.sent.push(JSON.parse(json));}
  message(payload){this.emit("message",{data:JSON.stringify(payload)});}
}
globalThis.WebSocket=FakeWebSocket;
const outgoing=dgram.createSocket("udp4"),feed=dgram.createSocket("udp4"),commands=[];
outgoing.on("message",packet=>commands.push(readPacket(packet)));
await new Promise(resolve=>outgoing.bind(TX,HOST,resolve));
const send=(path,val)=>feed.send(encode(path,val),RX,HOST);
const settings=(position,extra={})=>({
  host:HOST,sendPort:TX,receivePort:RX,preset:"main",target:"output",
  keyMode:"meter",stackSegments:"3",stackPosition:String(position),
  meterFloorDb:-60,meterChannels:"mono",...extra
});
const action="com.fionetworks.rme-globalosc.levelkey";
const images=ctx=>FakeWebSocket.instance.sent
  .filter(m=>m.context===ctx&&m.event==="setImage")
  .map(m=>decodeURIComponent(m.payload.image.split(",")[1]));
const last=ctx=>images(ctx).at(-1)||"";
const height=image=>{
  const match=image.match(/<rect x="17" y="[\d.]+" width="110" height="([\d.]+)" fill="/);
  return match?Number(match[1]):0;
};
async function until(predicate,message,timeout=2200){
  const started=Date.now();
  while(Date.now()-started<timeout){if(predicate())return;await sleep(15);}
  assert.fail(message);
}
const appear=(ctx,position,extra={})=>
  ws.message({event:"willAppear",action,context:ctx,payload:{settings:settings(position,extra)}});

process.argv.push("-port","12345","-pluginUUID","com.fionetworks.rme-globalosc","-registerEvent","registerPlugin");
await import(pathToFileURL(pluginPath).href+"?peak="+Date.now());
await until(()=>FakeWebSocket.instance?.sent.length>0,"Stream Deck registration missing");
const ws=FakeWebSocket.instance;
appear("bottom",1);appear("middle",2);appear("top",3);
await until(()=>images("bottom").length&&images("middle").length&&images("top").length,
  "Initial stack artwork missing");
assert.equal(height(last("bottom")),0,"Unreceived peak must not invent audio level");

// OSC fader feedback must NOT drive the meter.
send("/output/0/volume",6);
await sleep(150);
assert.equal(height(last("bottom")),0,"Fader position must never drive peak display");

// Receive real audio peak amplitude via Global OSC /level/out.
send("/level/out/0",-30);
await until(()=>height(last("middle"))===72,"Half-scale peak did not reach middle key");
assert.equal(height(last("bottom")),144,"Audio peak must fill physical bottom first");
assert.equal(height(last("top")),0,"Top must remain empty at half scale");
for(const ctx of ["bottom","middle","top"]){
  assert(!last(ctx).includes("<text"),"Meter must be unlabeled");
  assert(!last(ctx).includes("<line "),"Meter must have no divisions");
}
// Mute and fader changes do NOT create a fake audio level.
send("/output/0/mute",1);
send("/output/0/volume",-65);
await sleep(200);
assert.equal(height(last("middle")),72,"Mute/fader state must not alter measured peak");
assert(!last("middle").includes("#ed4e5c"),"Mute must not fake a clip");
for(const ctx of ["bottom","middle","top"])ws.message({event:"keyDown",action,context:ctx,payload:{}});
await sleep(100);
assert(!commands.includes("/output/0/volume")&&!commands.includes("/output/0/mute"),
  "Visual meter must never send an audio-control command");
send("/level/out/0",0);
await until(()=>height(last("top"))===144,"0 dBFS peak must fill entire meter");
assert(last("top").includes("#ed4e5c"),"True 0 dBFS peak should trigger clip red");
send("/level/out/0",-60);
await until(()=>height(last("bottom"))===0,"Silence/floor should clear meter");

// Stereo pair: use maximum of selected and following output channels.
appear("stereo",3,{meterChannels:"stereo"});
await until(()=>images("stereo").length>0,"Stereo meter not initialized");
send("/level/out/0",-50);
send("/level/out/1",-12);
await until(()=>height(last("stereo"))>50,"Stereo meter did not follow louder right channel");
send("/level/out/1",-60);
await until(()=>height(last("stereo"))===0,"Stereo peak should drop after both channels fall");

// Input and playback paths must be independent of output meters.
appear("mic",1,{target:"mix",preset:"mic1"});
appear("playback",1,{target:"mix",preset:"playback12"});
await until(()=>images("mic").length&&images("playback").length,"Input/playback meter init missing");
send("/level/in/0",-10);
await until(()=>height(last("mic"))>0,"Input peak path missing");
assert.equal(height(last("playback")),0,"Input peak must not update playback meter");
send("/level/pb/0",-8);
await until(()=>height(last("playback"))>0,"Playback peak path missing");

// Fourth key still visualizes its slice of the same audio peak.
appear("fourth",4,{stackSegments:"4"});
await until(()=>images("fourth").length>0,"Fourth key missing");
send("/level/out/0",0);
await until(()=>height(last("fourth"))===144,"Fourth key failed to show full scale");

// No outgoing commands should be generated by passive metering.
assert.equal(commands.length,0,"Passive meters should not cause Global OSC commands");
for(const ctx of ["bottom","middle","top","stereo","mic","playback","fourth"])
  ws.message({event:"willDisappear",action,context:ctx,payload:{}});
await sleep(50);
feed.close();outgoing.close();
console.log("PASS: OSC /level audio peaks, isolated I/O, stereo, 3/4 keys, clip and read-only safety");
process.exit(0);
