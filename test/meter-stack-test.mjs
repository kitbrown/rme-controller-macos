import assert from "node:assert/strict";
import {renderStackKey} from "../com.fionetworks.rme-globalosc.sdPlugin/ui/console-art.js";

const svg = props => decodeURIComponent(renderStackKey(props).replace(/^data:image\/svg\+xml,/, ""));
const fill = image => {
  const matched = image.match(/<rect x="17" y="([\d.]+)" width="110" height="([\d.]+)" fill="/);
  return matched ? {y:Number(matched[1]),height:Number(matched[2])} : {y:144,height:0};
};

for (const segments of [1,2,3,4]) {
  for (let position=1;position<=segments;position++) {
    const noLevel=svg({segments,position,level:0,known:true});
    const full=svg({segments,position,level:100,known:true});
    const pending=svg({segments,position,level:100,known:false});
    assert.equal(fill(noLevel).height,0);
    assert.equal(fill(pending).height,0);
    assert.equal(fill(full).height,144);
    assert(!noLevel.includes("<text"),"meter must never display labels");
    assert(!noLevel.includes("<path"),"meter must never display tick marks");
    assert(!noLevel.includes("<line "),"meter must never display per-key divisions");
    assert(full.includes('y1="'+(position*144)+'"'),"shared gradient bottom coordinate mismatch");
    assert(full.includes('y2="'+((position-segments)*144)+'"'),"shared gradient top coordinate mismatch");
    assert(full.includes("url(#meter)"),"gradient required");
  }
}

// 50% level across three physical keys fills bottom entirely, middle halfway, top empty.
const bottom=svg({segments:3,position:1,level:50});
const middle=svg({segments:3,position:2,level:50});
const top=svg({segments:3,position:3,level:50});
assert.equal(fill(bottom).height,144);
assert.equal(fill(middle).height,72);
assert.equal(fill(top).height,0);
assert.equal(fill(middle).y,72);
assert.equal(fill(svg({segments:3,position:2,level:50,clipped:true})).height,72);
assert(svg({segments:3,position:2,level:50,clipped:true}).includes("#ed4e5c"));
assert.equal(fill(svg({segments:3,position:2,level:35})).height,7.2);

console.log("PASS: continuous unlabeled vertical 1-4 key fader meter");
