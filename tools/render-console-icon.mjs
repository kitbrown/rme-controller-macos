import {Resvg} from "@resvg/resvg-js";
import {readFileSync,writeFileSync,mkdirSync} from "node:fs";
import {resolve} from "node:path";
const src=readFileSync(resolve("marketplace/source/console-app-icon.svg"),"utf8");
for(const [size,path] of [
  [256,"com.fionetworks.rme-globalosc.sdPlugin/imgs/plugin.png"],
  [512,"com.fionetworks.rme-globalosc.sdPlugin/imgs/plugin@2x.png"],
  [288,"dist/console-marketplace-icon-288.png"]
]){
  mkdirSync(resolve(path,".."),{recursive:true});
  const png=new Resvg(src,{fitTo:{mode:"width",value:size}}).render().asPng();
  writeFileSync(path,png);
  const header=png.subarray(0,8).toString("hex");
  if(header!=="89504e470d0a1a0a"||png.readUInt32BE(16)!==size||png.readUInt32BE(20)!==size)
    throw new Error("Icon PNG validation failed: "+path);
  console.log("CONFIRMED",path,size+"x"+size,png.length+"B");
}
