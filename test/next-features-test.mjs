import assert from "node:assert/strict";
import dgram from "node:dgram";
import {pathToFileURL} from "node:url";
import {resolveParameter,displayParameter} from "../com.fionetworks.rme-globalosc.sdPlugin/ui/parameter-config.js";
import {readFileSync} from "node:fs";

const PLUGIN=process.argv[2];assert(PLUGIN);
const M=JSON.parse(readFileSync("com.fionetworks.rme-globalosc.sdPlugin/manifest.json","utf8"));
assert.equal(M.Version,"1.1.9.0");
assert(M.Actions.some(a=>a.UUID.endsWith(".parameter")));
assert(M.Actions.some(a=>a.UUID.endsWith(".diagnostic")));
assert.equal(resolveParameter({paramKey:"eq1Gain",paramBus:"input",sourceIndex:1}).path,"/input/1/eq/band1gain");
assert.equal(resolveParameter({paramKey:"eq1Gain",paramBus:"output",sourceIndex:2}).path,"/output/2/eq/band1gain");
assert.equal(resolveParameter({paramKey:"compThreshold",sourceIndex:0}).path,"/input/0/dynamics/compthres");
assert.equal(resolveParameter({paramKey:"mixPan",paramBus:"playback",sourceIndex:3,outputIndex:6}).path,"/mix/pb/3/6/balpan");
assert.equal(resolveParameter({paramKey:"outputPan",outputIndex:8}).path,"/output/8/balpan");
assert.equal(resolveParameter({paramKey:"reverbVolume"}).path,"/reverb/volume");
assert.equal(resolveParameter({paramKey:"echoVolume"}).path,"/echo/volume");
assert.equal(displayParameter(-0.5,resolveParameter({paramKey:"mixPan"})),"L 50%");
assert.equal(displayParameter(0,resolveParameter({paramKey:"mixPan"})),"CENTER");
assert.equal(displayParameter(0.3,resolveParameter({paramKey:"compRatio"})),"0.3:1");

const HOST="127.0.0.1", TX=17188,RX=19188;
const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
const p4=n=>(n+3)&~3;
function oscString(s){const t=Buffer.from(s+"\0");const b=Buffer.alloc(p4(t.length));t.copy(b);return b;}
function osc(address,value){const type=typeof value==="string"?"s":Number.isInteger(value)?"i":"f";
const chunks=[oscString(address),oscString(","+type)];
if(type==="s")chunks.push(oscString(value)); else{const b=Buffer.alloc(4);if(type==="i")b.writeInt32BE(value);else b.writeFloatBE(value);chunks.push(b);}return Buffer.concat(chunks);}
function decode(buf){let at=0;const read=()=>{const end=buf.indexOf(0,at);const text=buf.toString("utf8",at,end);at=p4(end+1);return text;};
const address=read(),tag=read(),value=tag===",i"?buf.readInt32BE(at):tag===",f"?buf.readFloatBE(at):read();return{address,value,tag};}
class FakeWebSocket {static OPEN=1; static instance;listeners=new Map();sent=[];readyState=1;
constructor(){FakeWebSocket.instance=this;queueMicrotask(()=>this.listeners.get("open")?.({}));}
addEventListener(name,cb){this.listeners.set(name,cb);}send(json){this.sent.push(JSON.parse(json));}
message(payload){this.listeners.get("message")?.({data:JSON.stringify(payload)});}close(){}
}
globalThis.WebSocket=FakeWebSocket;
const source=dgram.createSocket("udp4"),feed=dgram.createSocket("udp4"),packets=[];
source.on("message",b=>packets.push(decode(b)));
await new Promise(ok=>source.bind(TX,HOST,ok));
const send=(path,val)=>feed.send(osc(path,val),RX,HOST);
async function until(ok,msg){for(let i=0;i<140;i++){if(ok())return;await sleep(15);}assert.fail(msg);}
const settings=x=>({host:HOST,sendPort:TX,receivePort:RX,...x});
const events=(ctx,name)=>ws.sent.filter(x=>x.context===ctx&&x.event===name);
process.argv.push("-port","12345","-pluginUUID","com.fionetworks.rme-globalosc","-registerEvent","registerPlugin");
await import(pathToFileURL(PLUGIN).href+"?features="+Date.now());
await until(()=>FakeWebSocket.instance?.sent.length,"plugin register missing");
const ws=FakeWebSocket.instance;
const prefix="com.fionetworks.rme-globalosc.";
const appear=(action,ctx,x)=>ws.message({event:"willAppear",action:prefix+action,context:ctx,payload:{settings:settings(x)}});
appear("parameter","eq",{paramKey:"eq1Gain",paramBus:"input",sourceIndex:0,stepValue:0.5});
await until(()=>events("eq","setFeedback").length,"parameter initial feedback missing");
const before=packets.filter(p=>p.address==="/input/0/eq/band1gain").length;
ws.message({event:"dialRotate",context:"eq",payload:{ticks:2}});
await sleep(100);
assert.equal(packets.filter(p=>p.address==="/input/0/eq/band1gain").length,before,"command must be gated before authoritative feedback");
send("/input/0/eq/band1gain",-3);
await until(()=>events("eq","setFeedback").some(e=>e.payload.value?.value==="-3.0 dB"),"confirmed EQ feedback missing");
ws.message({event:"dialRotate",context:"eq",payload:{ticks:2}});
await until(()=>packets.some(p=>p.address==="/input/0/eq/band1gain"&&Math.abs(p.value+2)<0.0001),"EQ step OSC command missing");
assert(packets.some(p=>p.address==="/input/0/eq/band1gain"&&p.tag===",f"),"EQ numeric command must be OSC float");

appear("parameter","pan",{paramKey:"mixPan",paramBus:"playback",sourceIndex:3,outputIndex:6,stepValue:0.05});
send("/mix/pb/3/6/balpan",0);
await until(()=>events("pan","setFeedback").some(e=>e.payload.value?.value==="CENTER"),"pan feedback missing");
ws.message({event:"dialRotate",context:"pan",payload:{ticks:2}});
await until(()=>packets.some(p=>p.address==="/mix/pb/3/6/balpan"&&Math.abs(p.value-0.1)<0.0001),"submix pan command missing");

appear("toggle","eq-switch",{preset:"eqEnable",processingBus:"input",processingIndex:3});
send("/input/3/eq/enable",0);
await until(()=>events("eq-switch","setState").length,"EQ toggle state missing");
ws.message({event:"keyDown",context:"eq-switch",payload:{}});
await until(()=>packets.some(p=>p.address==="/input/3/eq/enable"&&p.value===1),"EQ enable missing");

appear("outputvolume","named",{preset:"custom",outputIndex:2,label:"Fallback",followName:true});
send("/output/2/name","Live Monitors");
send("/output/2/volume",-10);
send("/output/2/mute",0);
await until(()=>events("named","setFeedback").some(e=>e.payload.title?.value==="Live Monitors"),"live TotalMix channel name missing");

ws.message({event:"sendToPlugin",context:"named",payload:{kind:"channelNames"}});
await until(()=>events("named","sendToPropertyInspector").some(e=>e.payload.names?.some(n=>n.name==="Live Monitors")),"channel picker feedback missing");
appear("diagnostic","connection",{});
await until(()=>events("connection","setImage").length,"diagnostic artwork missing");
const initial=events("connection","setImage").at(-1).payload.image;
assert(initial.startsWith("data:image/svg+xml"));
ws.message({event:"keyDown",context:"connection",payload:{}});
await until(()=>packets.filter(p=>p.address==="/sendall").length>0,"read-only sync missing");
await sleep(1100);
const latest=decodeURIComponent(events("connection","setImage").at(-1).payload.image.split(",")[1]);
assert(latest.includes("RX LIVE")||latest.includes("RX%20LIVE"),"diagnostic should report incoming OSC data");
for(const ctx of ["eq","pan","eq-switch","named","connection"])ws.message({event:"willDisappear",context:ctx,payload:{}});
await sleep(60);
source.close();feed.close();
console.log("PASS: feedback-gated EQ, mixer pan, processing switch, live names and read-only OSC diagnostics");
process.exit(0);
