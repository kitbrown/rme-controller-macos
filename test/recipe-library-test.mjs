// Exercise the settings actually delivered to Stream Deck, including enable-last ordering.
import assert from "node:assert/strict";
import {execFileSync} from "node:child_process";
import {RecipeRunner} from "../com.fionetworks.rme-globalosc.sdPlugin/bin/processing-recipe.js";

const settings = JSON.parse(execFileSync("python3", ["-c", `
from zipfile import ZipFile
from pathlib import Path
import json
result = []
with ZipFile(next(Path('.').glob('*.sdPlugin/profiles/rme-workflow-xl.streamDeckProfile'))) as archive:
    for name in archive.namelist():
        page = json.loads(archive.read(name))
        if page.get('Name') in ('EQ', 'Compression'):
            result.extend(a['Settings'] for a in page['Controllers'][0]['Actions'].values()
                          if a['UUID'].endswith('.processingrecipe'))
print(json.dumps(result))
`],{encoding:"utf8"}));
const expected = new Map([
  ["EXP", [["dynamics/expthres",-40],["dynamics/expratio",2],["dynamics/enable",1]]],
  ["HPF", [["lowcut/freq",70],["lowcut/enable",1]]],
  ["LOW BST", [["eq/band1type",1],["eq/band1freq",100],["eq/band1gain",2],["eq/enable",1]]],
  ["1K CUT", [["eq/band2freq",1000],["eq/band2gain",-1.5],["eq/enable",1]]],
  ["HI LIFT", [["eq/band2freq",3000],["eq/band2gain",2],["eq/enable",1]]],
  ["HI AIR", [["eq/band3type",1],["eq/band3freq",12000],["eq/band3gain",2],["eq/enable",1]]],
  ["LPF", [["eq/band3type",2],["eq/band3freq",4500],["eq/enable",1]]]
]);
for (const [key,...values] of [
  ["DEEP VOX",-18,3,20,180],["LITE VOX",-16,2,15,150],["OH DRUMS",-14,1.5,30,250],
  ["MID TOMS",-16,3,20,180],["KICK",-14,4,25,120],["GUITAR",-18,2.5,15,160],["BASS",-18,3,25,220]
]) {
  expected.set(key,["compthres","compratio","attack","release","enable"].map((param,i)=>
    ["dynamics/"+param,values[i] ?? 1]));
}
assert.equal(settings.length,expected.size);
for (const config of settings) {
  const runner = new RecipeRunner();
  const sent = [], states = [];
  const endpoint = {host:"127.0.0.1",receivePort:19188};
  const start = () => runner.start("key",config,endpoint,(...packet)=>sent.push(packet),s=>states.push(s));
  const feed = (path,value) => runner.receive(19188,endpoint.host,path,value);
  if (config.preset === "lpf") {
    start();
    assert.deepEqual([sent.length,states.at(-1)],[0,"SETUP"]);
    config.lowPassPosition = "3";
  }
  const steps = expected.get(config.keyLabel).map(([suffix,value])=>["/input/0/"+suffix,value]);
  start();
  for (const [path] of steps) feed(path,0);
  for (const [i,[path,value]] of steps.entries()) {
    assert.deepEqual(sent[i+1],[path,value,!path.endsWith("/enable")],config.keyLabel);
    feed(path,value);
  }
  assert.deepEqual(sent.at(-1),["/sendchan/input/0",1,false]);
  for (const [path,value] of steps) feed(path,value);
  assert.equal(states.at(-1),"APPLIED");
}
console.log("PASS: 14 prepared processing keys, setup gate, exact channel writes and final readback");
