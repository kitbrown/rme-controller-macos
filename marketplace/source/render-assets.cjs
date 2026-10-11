// Run with Node and the sharp package available: node marketplace/source/render-assets.cjs
// Native SVG compositions; no synthesized device or application screenshots.
const fs=require('fs'),path=require('path'),sharp=require('sharp');
const root=path.resolve(__dirname,'..');
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
const t=(x,y,s,size=32,color='#edf4fb',weight=400)=>`<text x="${x}" y="${y}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" fill="${color}" font-weight="${weight}">${esc(s)}</text>`;
const rect=(x,y,w,h,fill='#121922',stroke='#263341',rx=24)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const begin=(w,h)=>`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#0b0f14"/>`;
// Reuse the project's category SVG geometry at full vector resolution.
const category=fs.readFileSync(path.resolve(root,'../com.fionetworks.rme-globalosc.sdPlugin/imgs/category.svg'),'utf8').match(/<g[\s\S]*<\/g>/)[0];
const mark=(x,y,scale)=>`<g transform="translate(${x} ${y}) scale(${scale})">${category}</g>`;
async function save(folder,name,svg){fs.writeFileSync(path.join(root,folder,name+'.svg'),svg);await sharp(Buffer.from(svg)).png().toFile(path.join(root,folder,name+'.png'));}
(async()=>{
 await save('assets','app-icon-288',begin(288,288)+rect(12,12,264,264,'#121922','#38d9ff',40)+mark(61,24,3)+t(73,240,'FiO',56,'#38d9ff',700)+'</svg>');
 const thumb=begin(1920,960)+t(100,116,'FiO NETWORKS',28,'#38d9ff',700)+t(100,290,'RME Controller',96,'#edf4fb',700)+t(100,399,'for macOS',96,'#edf4fb',700)+t(104,503,'TotalMix FX control for Stream Deck',37,'#8fa1b2')+t(104,585,'Turn to adjust. Press to mute.',36)+t(104,638,'Follow changes in both directions.',36)+rect(1280,200,480,480,'#121922','#263341',64)+mark(1344,265,6.3)+t(105,843,'Global OSC  /  Stream Deck + dials and keys',28,'#8fa1b2')+'<path d="M100 735h420" stroke="#38d9ff" stroke-width="6"/>'+'</svg>';
 await save('assets','thumbnail-1920x960',thumb);
 const items=[['gallery-01-controls','Your mix. At your fingertips.','Adjust levels • Press to mute','Real Stream Deck + photograph','Final controls and touch strip visible'],['gallery-02-feedback','Change it here. See it there.','TotalMix FX ↔ Stream Deck +','Real TotalMix screen + real device photograph','Matching level, mute and Mono states'],['gallery-03-setup','Set up your signal flow.','Presets, custom paths and clear states','Actual installed Property Inspector','Preset and OSC settings; readable crop']];
 for(const [name,title,sub,cap,detail] of items){let svg=begin(1920,960)+t(80,82,'FiO  /  RME CONTROLLER FOR macOS',24,'#38d9ff',700)+t(80,182,title,66,'#edf4fb',700)+t(80,244,sub,30,'#8fa1b2')+rect(80,290,1760,540,'#121922','#526171')+t(150,490,cap,42,'#8fa1b2',700)+t(150,550,detail,30,'#8fa1b2')+t(150,618,'REPLACE THIS AREA WITH CHRIS’S CAPTURE',26,'#ffb84d',700)+t(80,904,'TEMPLATE — NOT FOR UPLOAD',26,'#ffb84d',700)+'</svg>';await save('templates',name,svg);}
 console.log('Rendered icon, thumbnail and 3 gallery templates.');
})();
