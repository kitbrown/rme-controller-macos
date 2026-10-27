// Rendering only. No RME trademarks, OSC commands, or transport side effects.
const esc = input => String(input).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&apos;" }[c]));
const uri = svg => "data:image/svg+xml," + encodeURIComponent(svg);

const frame = (
  '<defs>'+
  '<linearGradient id="face" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#2b4051"/><stop offset=".46" stop-color="#172635"/><stop offset="1" stop-color="#0a121c"/></linearGradient>'+
  '<linearGradient id="bezel" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#a2b4c0"/><stop offset=".4" stop-color="#304656"/><stop offset="1" stop-color="#07121b"/></linearGradient>'+
  '<linearGradient id="silver" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#f2f7fa"/><stop offset=".55" stop-color="#a2b8c7"/><stop offset="1" stop-color="#587181"/></linearGradient>'+
  '</defs>'+
  '<rect x="2" y="2" width="140" height="140" rx="23" fill="url(#bezel)"/>'+
  '<rect x="6" y="6" width="132" height="132" rx="20" fill="url(#face)" stroke="#08131d" stroke-width="2"/>'
);

export function renderConsoleKey({ token, status, active, accent }) {
  token = esc(token);
  status = esc(status);
  accent = /^#[0-9a-f]{6}$/i.test(accent) ? accent : "#56caff";
  const mute = status === "MUTED";
  const light = active ? (mute ? "#ff7079" : accent) : "#3d5262";
  const bars = Array.from({length:7}, (_,i) =>
    '<rect x="' + (30 + i*13) + '" y="' + (92 - [9,16,23,11,19,7,15][i]) +
    '" width="8" height="' + [9,16,23,11,19,7,15][i] + '" rx="2" fill="' +
    (active ? light : (i<3 ? "#36546a" : "#213647")) + '"/>').join('');
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">'+frame+
    '<rect x="16" y="16" width="112" height="3" rx="1.5" fill="' + light + '"/>'+
    '<text x="20" y="34" fill="#91a7b9" font-family="Arial,sans-serif" font-size="8" font-weight="700" letter-spacing="2">FIO / FX</text>'+
    '<circle cx="116" cy="29" r="5" fill="' + (active ? light : "#314655") + '" stroke="#9ab7c9"/>'+
    '<rect x="21" y="45" width="102" height="35" rx="6" fill="#091824" stroke="#445a6e"/>'+
    '<text x="72" y="68" text-anchor="middle" fill="#f1f8ff" font-family="Arial,sans-serif" font-size="' + (token.length > 5 ? 18 : 24) + '" font-weight="800" letter-spacing=".7">' + token + '</text>'+
    bars+
    '<rect x="19" y="111" width="106" height="22" rx="6" fill="' + (active ? "#304453" : "#132533") + '" stroke="' + light + '"/>'+
    '<text x="72" y="126" text-anchor="middle" fill="#edf7ff" font-family="Arial,sans-serif" font-size="' + (status.length > 7 ? 12 : 15) + '" font-weight="700" letter-spacing=".5">' + status + '</text>'+
    '</svg>';
  return uri(svg);
}

export function renderLevelKey({ label, value, level, muted, mode, mix }) {
  label=esc(String(label).slice(0,12).toUpperCase());
  value=esc(value);
  level=Math.min(100, Math.max(0, Number(level)||0));
  const accent= muted ? "#ff7079" : (mix ? "#f6c66a" : "#56caff");
  const thumb=101-level*.58;
  const ticks=Array.from({length:8}, (_,i) =>
    '<path d="M49 '+(47+i*8)+'h7 M88 '+(47+i*8)+'h7" stroke="#7794a8" stroke-width="1.2"/>').join('');
  const leds=Array.from({length:10}, (_,i) =>
    '<rect x="109" y="'+(101-i*6)+'" width="10" height="4" rx="1" fill="'+
    (i < Math.round(level/10) ? accent : "#1c3040") + '"/>').join('');
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">'+frame+
    '<rect x="16" y="15" width="112" height="3" rx="1.5" fill="'+accent+'"/>'+
    '<text x="72" y="33" text-anchor="middle" fill="#edf8ff" font-family="Arial,sans-serif" font-size="12" font-weight="750">'+label+'</text>'+
    '<rect x="66" y="44" width="12" height="62" rx="4" fill="#07121e" stroke="#3b5165"/>'+ticks+
    '<rect x="49" y="'+(thumb-7).toFixed(1)+'" width="46" height="14" rx="4" fill="url(#silver)" stroke="#0a1a26" stroke-width="1.5"/>'+
    '<path d="M54 '+thumb.toFixed(1)+'h36" stroke="#294557" stroke-width="2"/>'+leds+
    '<rect x="17" y="112" width="110" height="21" rx="6" fill="'+(muted ? "#60272c" : "#152b3b")+'" stroke="'+accent+'"/>'+
    '<text x="72" y="127" text-anchor="middle" fill="#eff8ff" font-family="Arial,sans-serif" font-size="12" font-weight="800">'+value+'</text>'+
    '<text x="22" y="103" fill="#d0dee7" font-family="Arial,sans-serif" font-size="10" font-weight="700">'+(mode==="up" ? "+" : mode==="down" ? "−" : "M")+'</text>'+
    '</svg>';
  return uri(svg);
}


// One physical key is one segment in a vertical display. Position 1 is always bottom.
// Each segment independently uses the same Global OSC fader path, avoiding a custom transport.
export function renderStackKey({label, value, level, muted, segments, position, known}) {
  segments=Math.max(1,Math.min(4,Math.floor(Number(segments)||1)));
  position=Math.max(1,Math.min(segments,Math.floor(Number(position)||1)));
  level=Math.max(0,Math.min(100,Number(level)||0));
  const segmentFill=known ? Math.max(0,Math.min(1,level*segments/100-(position-1))) : 0;
  const accent=muted ? "#ec5d68" : position===segments ? "#e2aa58" : position===segments-1 ? "#b5cc74" : "#56caff";
  const labelText=esc(String(label).slice(0,11).toUpperCase());
  const valueText=esc(value);
  const bars=Array.from({length:9},(_,i)=>{
    const threshold=i/9;
    const on=segmentFill>=threshold+1/9;
    const partial=segmentFill>threshold && !on;
    const x=25, y=99-i*8;
    return '<rect x="'+x+'" y="'+y+'" width="94" height="6" rx="1.5" fill="'+
      (on ? accent : partial ? accent : "#243b4d")+'" opacity="'+(partial ? "0.55" : "1")+'"/>';
  }).join("");
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">'+frame+
    '<rect x="16" y="14" width="112" height="3" rx="1.5" fill="'+(muted?"#ff6c73":"#3b657d")+'"/>'+
    '<text x="72" y="29" text-anchor="middle" font-size="10" font-weight="800" fill="#eaf6fc" font-family="Arial,sans-serif">'+labelText+'</text>'+
    '<rect x="21" y="33" width="102" height="74" rx="5" fill="#0a1722" stroke="#41566a"/>'+bars+
    '<text x="72" y="124" text-anchor="middle" font-size="12" font-weight="800" fill="'+(muted?"#ff9da6":"#e7f4fd")+'" font-family="Arial,sans-serif">'+valueText+'</text>'+
    '<text x="124" y="132" text-anchor="end" font-size="7.5" font-weight="700" fill="#809aaa" font-family="Arial,sans-serif">'+position+'/'+segments+'</text>'+
    '</svg>';
  return uri(svg);
}
