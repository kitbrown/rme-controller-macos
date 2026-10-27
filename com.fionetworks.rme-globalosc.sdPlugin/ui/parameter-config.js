// Explicit Global OSC parameter allowlist. Hardware support must be
// confirmed by receiving authoritative OSC feedback BEFORE allowing commands.
export const PARAMETERS = Object.freeze({
  mixPan: {label:"Submix Pan",scope:"mix",suffix:"balpan",unit:"pan",step:0.05,min:-1,max:1},
  outputPan: {label:"Output Balance",scope:"output",suffix:"balpan",unit:"pan",step:0.05,min:-1,max:1},
  eq1Gain: {label:"EQ Band 1 Gain",scope:"channel",suffix:"eq/band1gain",unit:"dB",step:0.5,min:-20,max:20},
  eq2Gain: {label:"EQ Band 2 Gain",scope:"channel",suffix:"eq/band2gain",unit:"dB",step:0.5,min:-20,max:20},
  eq3Gain: {label:"EQ Band 3 Gain",scope:"channel",suffix:"eq/band3gain",unit:"dB",step:0.5,min:-20,max:20},
  eq1Freq: {label:"EQ Band 1 Frequency",scope:"channel",suffix:"eq/band1freq",unit:"Hz",step:20,min:20,max:20000},
  eq2Freq: {label:"EQ Band 2 Frequency",scope:"channel",suffix:"eq/band2freq",unit:"Hz",step:20,min:20,max:20000},
  eq3Freq: {label:"EQ Band 3 Frequency",scope:"channel",suffix:"eq/band3freq",unit:"Hz",step:20,min:20,max:20000},
  compThreshold: {label:"Compressor Threshold",scope:"channel",suffix:"dynamics/compthres",unit:"dB",step:1,min:-80,max:0},
  compRatio: {label:"Compressor Ratio",scope:"channel",suffix:"dynamics/compratio",unit:"ratio",step:0.1,min:1,max:20},
  makeupGain: {label:"Dynamics Makeup Gain",scope:"channel",suffix:"dynamics/gain",unit:"dB",step:0.5,min:-20,max:30},
  reverbVolume: {label:"Reverb Volume",scope:"global",suffix:"/reverb/volume",unit:"dB",step:0.5,min:-65,max:6},
  echoVolume: {label:"Echo Volume",scope:"global",suffix:"/echo/volume",unit:"dB",step:0.5,min:-65,max:6}
});
const idx = value => Math.max(0,Math.min(999,Math.trunc(Number.isFinite(Number(value))?Number(value):0)));
export function resolveParameter(s={}) {
  const key=Object.hasOwn(PARAMETERS,s.paramKey)?s.paramKey:"mixPan";
  const def=PARAMETERS[key];
  const requestedBus=s.paramBus==="output"?"output":s.paramBus==="playback"?"playback":"input";
  const bus=def.scope==="mix"?(requestedBus==="playback"?"playback":"input"):
    def.scope==="channel"?(requestedBus==="output"?"output":"input"):requestedBus;
  const sourceIndex=idx(s.sourceIndex),outputIndex=idx(s.outputIndex);
  const path=def.scope==="mix"?"/mix/"+(bus==="playback"?"pb":"in")+"/"+sourceIndex+"/"+outputIndex+"/"+def.suffix:
    def.scope==="output"?"/output/"+outputIndex+"/"+def.suffix:
    def.scope==="global"?def.suffix:
    "/"+(bus==="output"?"output":"input")+"/"+sourceIndex+"/"+def.suffix;
  return {key,...def,bus,sourceIndex,outputIndex,path};
}
export function parameterRange(s={},spec=resolveParameter(s)) {
  const low=Number(s.minValue),high=Number(s.maxValue);
  const min=Number.isFinite(low)&&s.minValue!==""&&s.minValue!==undefined?low:spec.min;
  const max=Number.isFinite(high)&&s.maxValue!==""&&s.maxValue!==undefined?high:spec.max;
  return min<max?{min,max}:{min:spec.min,max:spec.max};
}
export function displayParameter(value,spec) {
  if(value===undefined||!Number.isFinite(value))return "SYNCING";
  if(spec.unit==="pan")return Math.abs(value)<0.005?"CENTER":(value<0?"L ":"R ")+Math.round(Math.abs(value)*100)+"%";
  if(spec.unit==="Hz")return Math.round(value)+" Hz";
  if(spec.unit==="ratio")return value.toFixed(1)+":1";
  return value.toFixed(1)+" dB";
}
