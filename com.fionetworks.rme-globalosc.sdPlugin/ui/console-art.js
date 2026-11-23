// Rendering only. No RME trademarks, OSC commands, or transport side effects.
const esc = input => String(input).replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&apos;" }[c]));
const uri = svg => "data:image/svg+xml," + encodeURIComponent(svg);

const typeface = "DIN Alternate, Helvetica Neue, Arial, sans-serif";
const frame = '<rect x="2" y="2" width="140" height="140" rx="16" fill="#171c20" stroke="#434c50" stroke-width="2"/>' +
  '<defs><linearGradient id="silver" x2="0" y2="1"><stop stop-color="#e5e9e6"/><stop offset="1" stop-color="#869296"/></linearGradient></defs>';

// Center pictograms leave the top and bottom rails available for lettering.
const symbols = {
  MAIN: "M45 67h11l16-13v39L56 80H45z M81 64q11 10 0 20 M87 56q20 18 0 36",
  PHONES: "M48 82v-8a24 24 0 0 1 48 0v8 M48 80h9v14h-9z M87 80h9v14h-9z",
  MIC: "M65 58a7 7 0 0 1 14 0v16a7 7 0 0 1-14 0z M57 72a15 15 0 0 0 30 0 M72 87v8 M62 95h20",
  MONO: "M45 58l23 16-23 16 M99 58L76 74l23 16 M66 74h12",
  DIM: "M47 68h10l13-12v34L57 78H47z M81 69l6 7 7-7",
  TALK: "M46 57h51v29H68L54 97V86h-8z M57 71h7l4-7 7 13 5-6h6",
  TV: "M46 56h52v32H46z M61 95h22",
  SPDIF: "M43 78h12V62h14v22h14V66h17",
  "48V": "M75 51L56 77h15l-3 18 21-30H73z",
  "EQ CUT": "M41 63c17 0 17 24 31 24s14-24 31-24",
  "EQ LIFT": "M41 85c17 0 17-24 31-24s14 24 31 24",
  EQ: "M43 85c14 0 14-26 27-26s13 21 31 21",
  HPF: "M43 90l17-18q6-9 17-9h24",
  LPF: "M43 63h23q11 0 17 9l17 18",
  "LOW SHELF": "M40 61h16c12 0 13 19 28 19h19",
  "HIGH SHELF": "M40 80h16c12 0 13-19 28-19h19",
  AL: "M43 78h13l5-14 8 24 8-34 6 18h17 M44 53h15 M84 89h16",
  REV: "M43 63l12 14 10-22 8 32 7-23 6 17 6-12 6 7",
  ECHO: "M44 88V55l9 8v25 M62 88V62l8 6v20 M80 88V69l8 5v14 M96 88V77",
  EXP: "M44 52v42h57 M58 92l10-24 24-24",
  DYN: "M44 52v42h57 M52 90l14-25 15-9 16-4",
  COMP: "M47 93l25-25 25-7 M46 55v39h52",
  OSC: "M40 76h15l7-17 12 32 9-22 5 7h16",
  SNAP: "M50 54h36v29H50z M57 89h35V61 M64 95h34V68",
  STRIP: "M51 55v39 M72 55v39 M93 55v39 M44 66h14 M65 83h14 M86 72h14"
};

export function renderConsoleKey({ token, status, active, accent, symbol = token, inputTag }) {
  const snapshot = /^S[1-8]$/.test(symbol);
  const path = snapshot ? symbols.SNAP : symbols[symbol] || symbols.STRIP;
  const light = active ? "#ff5d69" : /^#[0-9a-f]{6}$/i.test(accent) ? accent : "#56caff";
  // Stream Deck renders the native snapshot caption and its edited marker below the glyph.
  const caption = snapshot ? "" :
    `<text x="72" y="126" text-anchor="middle" fill="#f2f5f2" font-size="${status.length > 7 ? 12 : 15}">${esc(status)}</text>`;
  return uri(`<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144" font-family="${typeface}" font-weight="700">
    ${frame}
    <rect x="16" y="16" width="112" height="3" rx="1.5" fill="${light}"/>
    ${inputTag ? `<text x="72" y="32" text-anchor="middle" font-size="13" fill="#c1cbd0">${esc(inputTag)}</text>` : ""}
    <text x="72" y="${inputTag ? 50 : 43}" text-anchor="middle" font-size="${inputTag || token.length > 5 ? 18 : 24}" fill="#f2f5f2">${esc(token)}</text>
    <path d="${path}" ${inputTag ? 'transform="translate(0 8)"' : ""} fill="none" stroke="${light}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    ${active ? '<path d="M108 89l5 5 11-13" fill="none" stroke="#f2f5f2" stroke-width="4"/>' : ""}
    ${caption}
  </svg>`);
}

export function renderLevelKey({ label, value, level, muted, mode, mix }) {
  const letters = Array.from(String(label).toUpperCase()).slice(0,12);
  label=esc(letters.join(''));
  value=esc(value);
  level=Math.min(100, Math.max(0, Number(level)||0));
  const accent= muted ? "#ff5d69" : (mix ? "#f6c66a" : "#56caff");
  const thumb=101-level*.58;
  const ticks=Array.from({length:8}, (_,i) =>
    '<path d="M49 '+(47+i*8)+'h7 M88 '+(47+i*8)+'h7" stroke="#7794a8" stroke-width="1.2"/>').join('');
  const leds=Array.from({length:10}, (_,i) =>
    '<rect x="109" y="'+(101-i*6)+'" width="10" height="4" rx="1" fill="'+
    (i < Math.round(level/10) ? accent : "#1c3040") + '"/>').join('');
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">'+frame+
    '<rect x="16" y="15" width="112" height="3" rx="1.5" fill="'+accent+'"/>'+
    '<text x="72" y="33" text-anchor="middle" fill="#edf8ff" font-family="'+typeface+'" font-size="12" textLength="'+ (letters.length > 8 ? 112 : Math.max(12, letters.length * 9)) +'" lengthAdjust="spacingAndGlyphs" font-weight="750">'+label+'</text>'+
    '<rect x="66" y="44" width="12" height="62" rx="4" fill="#07121e" stroke="#3b5165"/>'+ticks+
    '<rect x="49" y="'+(thumb-7).toFixed(1)+'" width="46" height="14" rx="4" fill="url(#silver)" stroke="#0a1a26" stroke-width="1.5"/>'+
    '<path d="M54 '+thumb.toFixed(1)+'h36" stroke="#294557" stroke-width="2"/>'+leds+
    '<rect x="17" y="112" width="110" height="21" rx="6" fill="'+(muted ? "#60272c" : "#152b3b")+'" stroke="'+accent+'"/>'+
    '<text x="72" y="127" text-anchor="middle" fill="#eff8ff" font-family="'+typeface+'" font-size="12" font-weight="800">'+value+'</text>'+
    '<text x="22" y="103" fill="#d0dee7" font-family="'+typeface+'" font-size="10" font-weight="700">'+(mode==="up" ? "+" : mode==="down" ? "−" : "M")+'</text>'+
    '</svg>';
  return uri(svg);
}


// Each vertically adjacent key is a window onto the SAME continuous meter.
// position: 1 = physical bottom; position = segments = physical top.
// No labels, tick marks, discrete blocks, or per-key bezels. Gaps come only from hardware.
export function renderStackKey({level, clipped=false, segments=3, position=1, known=true}) {
  segments=Math.max(1,Math.min(4,Math.trunc(Number(segments)||1)));
  position=Math.max(1,Math.min(segments,Math.trunc(Number(position)||1)));
  level=Math.max(0,Math.min(100,Number(level)||0));

  // Fraction occupied within THIS one physical key, counting bottom upward.
  const fillFraction=known ? Math.max(0,Math.min(1,level*segments/100-(position-1))) : 0;
  const fillY=144*(1-fillFraction);
  const fillHeight=144*fillFraction;

  // Use shared global coordinates for all key slices. A color at the boundary
  // of adjacent keys remains the same color even though the SVGs are separate.
  const gradientBottom=position*144;
  const gradientTop=(position-segments)*144;
  const svg='<svg xmlns="http://www.w3.org/2000/svg" width="144" height="144" viewBox="0 0 144 144">'+
    '<defs><linearGradient id="meter" gradientUnits="userSpaceOnUse" x1="0" y1="'+gradientBottom+'" x2="0" y2="'+gradientTop+'">'+
    '<stop offset="0" stop-color="#39beed"/>'+
    '<stop offset=".54" stop-color="#4ddeb4"/>'+
    '<stop offset=".82" stop-color="#f5c25e"/>'+
    '<stop offset="1" stop-color="#f27970"/>'+
    '</linearGradient></defs>'+
    '<rect width="144" height="144" fill="#0b1720"/>'+
    '<rect x="16" y="0" width="112" height="144" fill="#152734"/>'+
    '<rect x="15" width="2" height="144" fill="#304653"/>'+
    '<rect x="127" width="2" height="144" fill="#304653"/>'+
    (known && fillHeight > 0 ? '<rect x="17" y="'+fillY.toFixed(3)+'" width="110" height="'+fillHeight.toFixed(3)+'" fill="'+(clipped?'#ed4e5c':'url(#meter)')+'"/>' : '')+
    '</svg>';
  return uri(svg);
}
