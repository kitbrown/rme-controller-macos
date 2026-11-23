import assert from "node:assert/strict";
import {RecipeRunner, recipePlan} from "../com.fionetworks.rme-globalosc.sdPlugin/bin/processing-recipe.js";

const endpoint = {host:"127.0.0.1", receivePort:19188};
for (const invalid of [{channel:0}, {channel:1.5}, {preset:"unknown"}, {gain:Infinity},
  {frequency:0}, {preset:"compressor", ratio:0}]) {
  assert.equal(recipePlan(invalid), null);
}
for (const [frequency, gain] of [[250,-2], [3000,2]]) {
  const runner = new RecipeRunner();
  const sent = [], states = [];
  const settings = {channel:4,preset:"eq",frequency,gain};
  const apply = context => runner.start(context,settings,endpoint,(...p)=>sent.push(p),s=>states.push(s));
  const report = (field,v) => runner.receive(endpoint.receivePort,endpoint.host,"/input/3/eq/"+field,v);
  apply("one");
  apply("two");
  assert.equal(states.at(-1),"BUSY");
  assert.deepEqual(sent,[["/sendchan/input/3",1,false]]);
  report("band2freq",1000);report("band2gain",0);
  runner.receive(endpoint.receivePort,"127.0.0.2","/input/3/eq/enable",0);
  runner.receive(endpoint.receivePort+1,endpoint.host,"/input/3/eq/enable",0);
  assert.equal(sent.length,1);
  report("enable",0);report("band2freq",frequency);report("band2gain",gain);report("enable",1);
  assert.deepEqual(sent.slice(1),[
    ["/input/3/eq/band2freq",frequency,true],["/input/3/eq/band2gain",gain,true],
    ["/input/3/eq/enable",1,false],["/sendchan/input/3",1,false]
  ]);
  report("band2freq",frequency);report("band2gain",gain);report("enable",0);
  assert.equal(states.at(-1),"CHECK MIX","final readback disagrees");
  apply("two");
  runner.receive(endpoint.receivePort,endpoint.host,"/status/connection",0);
  assert.equal(states.at(-1),"OFFLINE");
  assert.equal(runner.runs.size,0);
}
console.log("PASS: both EQ presets, target isolation, contention, readback mismatch, disconnect and invalid settings");
