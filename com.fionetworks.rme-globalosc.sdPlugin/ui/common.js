let ws, uuid;

window.connectElgatoStreamDeckSocket = (port, propertyInspectorUUID, registerEvent, info, actionInfoJSON) => {
  uuid = propertyInspectorUUID;
  const actionInfo = JSON.parse(actionInfoJSON);
  ws = new WebSocket(`ws://127.0.0.1:${port}`);
  ws.onopen = () => {
    ws.send(JSON.stringify({event: registerEvent, uuid}));
    fill(actionInfo.payload?.settings || {});
    ws.send(JSON.stringify({event:"sendToPlugin",context:uuid,payload:{kind:"channelNames"}}));
  };
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.event === "didReceiveSettings") fill(m.payload?.settings || {});
    if (m.event === "sendToPropertyInspector" && m.payload?.kind==="channelNames")
      populateChannelPicker(m.payload.names||[]);
  };
};

function populateChannelPicker(names) {
  const picker=document.querySelector("[data-channel-picker]");
  if(!picker)return;
  const type=document.querySelector("[data-setting='target']")?.value;
  const allowed=type==="output"||!document.querySelector("[data-setting='target']") ?
    picker.dataset.channelBuses.split(",") :
    ["input","playback"];
  const previous=picker.value;
  picker.replaceChildren(new Option("Select a reported channel…",""));
  for(const item of names) {
    if(!allowed.includes(item.bus) || !Number.isInteger(item.index))continue;
    picker.add(new Option(item.bus+" "+item.index+" · "+item.name,item.bus+":"+item.index));
  }
  if([...picker.options].some(o=>o.value===previous))picker.value=previous;
}
function useChannelPicker(picker) {
  if(!picker.value)return;
  const [bus,indexText]=picker.value.split(":"),index=Number(indexText);
  if(!Number.isInteger(index)||index<0||index>999)return;
  const preset=document.querySelector("[data-setting='preset']");
  if(preset)preset.value="custom";
  const target=document.querySelector("[data-setting='target']");
  if(target)target.value=bus==="output"?"output":"mix";
  const out=document.querySelector("[data-setting='outputIndex']");
  const source=document.querySelector("[data-setting='sourceIndex']");
  const sourceBus=document.querySelector("[data-setting='bus']");
  if(bus==="output" && out)out.value=String(index);
  if(bus!=="output" && source)source.value=String(index);
  if(bus!=="output" && sourceBus)sourceBus.value=bus==="playback"?"playback":"in";
  const title=document.querySelector("[data-setting='label']");
  const option=picker.selectedOptions[0];
  if(title && option)title.value=option.textContent.split(" · ").slice(1).join(" · ");
  const follow=document.querySelector("[data-setting='followName']");
  if(follow)follow.checked=true;
  updateVisibility(); save();
}
function validationBox() {
  let box = document.getElementById("validation-message");
  if (box) return box;
  box = document.createElement("div");
  box.id = "validation-message";
  box.hidden = true;
  box.style.cssText = "margin-top:10px;padding:9px 10px;border-left:3px solid #ff5d69;background:#231317;color:#ffc3c7;border-radius:6px;font-size:11px;line-height:1.4";
  document.body.insertBefore(box, document.querySelector("script"));
  return box;
}

function fill(s) {
  document.querySelectorAll("[data-setting]").forEach(el => {
    const k = el.dataset.setting;
    if (s[k] === undefined) return;
    if (el.type === "checkbox") el.checked = !!s[k];
    else el.value = s[k];
  });
  updateVisibility();
  validate();
}

function updateVisibility() {
  const target = document.querySelector("[data-setting='target']")?.value;
  const presetSelect = document.querySelector("[data-setting='preset']");
  if (target && presetSelect) {
    for (const option of presetSelect.options) {
      if (option.dataset.target) option.hidden = option.dataset.target !== target && option.dataset.target !== "both";
    }
    if (presetSelect.selectedOptions[0]?.hidden) {
      const first = [...presetSelect.options].find(option => !option.hidden);
      if (first) presetSelect.value = first.value;
    }
  }
  document.querySelectorAll("[data-show-target]").forEach(el => { el.hidden = target !== el.dataset.showTarget; });
  const mode = document.querySelector("[data-setting='keyMode']")?.value;
  document.querySelectorAll("[data-show-mode]").forEach(el => { el.hidden = mode !== el.dataset.showMode; });
  document.querySelectorAll("[data-hide-mode]").forEach(el => { el.hidden = mode === el.dataset.hideMode; });
  const keys=["eqEnable","dynEnable","lowcutEnable","autoLevelEnable"];
  document.querySelectorAll("[data-show-processing]").forEach(el => {
    el.hidden=!keys.includes(document.querySelector("[data-setting='preset']")?.value);
  });
  const scope=document.querySelector("[data-setting='paramKey']")?.selectedOptions?.[0]?.dataset.paramScope;
  document.querySelectorAll("[data-param-target]").forEach(el=>{
    el.hidden=!el.dataset.paramTarget.split(",").includes(scope);
  });
  const paramBus=document.querySelector("[data-setting='paramBus']");
  if(paramBus) {
    for(const option of paramBus.options)
      option.hidden=(scope==="channel"&&option.value==="playback")||(scope==="mix"&&option.value==="output");
    if(paramBus.selectedOptions[0]?.hidden) {
      const allowed=[...paramBus.options].find(option=>!option.hidden);
      if(allowed)paramBus.value=allowed.value;
    }
  }
  document.querySelectorAll("[data-show-preset]").forEach(el => {
    el.hidden = presetSelect?.value !== el.dataset.showPreset;
  });
}

function settingsFromForm() {
  const s = {};
  document.querySelectorAll("[data-setting]").forEach(el => {
    const k = el.dataset.setting;
    if (el.type === "checkbox") s[k] = el.checked;
    else if (el.type === "number") s[k] = Number(el.value);
    else s[k] = el.value.trim();
  });
  return s;
}

function validate() {
  const errors = [];
  const fields = [...document.querySelectorAll("[data-setting]")];
  for (const el of fields) el.style.borderColor = "";

  const host = document.querySelector("[data-setting='host']");
  if (host && !host.value.trim()) {
    errors.push("Host is required.");
    host.style.borderColor = "#ff5d69";
  }

  for (const name of ["sendPort", "receivePort"]) {
    const el = document.querySelector(`[data-setting='${name}']`);
    if (!el) continue;
    const value = Number(el.value);
    if (!Number.isInteger(value) || value < 1 || value > 65535) {
      errors.push(`${name === "sendPort" ? "TotalMix" : "Plugin"} port must be 1–65535.`);
      el.style.borderColor = "#ff5d69";
    }
  }

  const step = document.querySelector("[data-setting='stepDb']");
  if (step && (!Number.isFinite(Number(step.value)) || Number(step.value) <= 0 || Number(step.value) > 24)) {
    errors.push("dB step must be greater than 0 and no more than 24.");
    step.style.borderColor = "#ff5d69";
  }
  for (const name of ["outputIndex", "sourceIndex"]) {
    const el = document.querySelector(`[data-setting='${name}']`);
    if (!el) continue;
    const value = Number(el.value);
    if (!Number.isInteger(value) || value < 0 || value > 999) {
      errors.push(`${name} must be a whole index from 0 to 999.`);
      el.style.borderColor = "#ff5d69";
    }
  }
  const segments = document.querySelector("[data-setting='stackSegments']");
  const position = document.querySelector("[data-setting='stackPosition']");
  if ((!document.querySelector("[data-setting='keyMode']") ||
     document.querySelector("[data-setting='keyMode']").value === "meter") &&
     segments && position && Number(position.value) > Number(segments.value)) {
    errors.push("Stack position cannot exceed stack height.");
    position.style.borderColor = "#ff5d69";
  }
  const floor = document.querySelector("[data-setting='meterFloorDb']");
  if (floor && (!document.querySelector("[data-setting='keyMode']") ||
      document.querySelector("[data-setting='keyMode']").value === "meter") &&
      (!Number.isFinite(Number(floor.value)) || Number(floor.value) < -120 || Number(floor.value) > -6)) {
    errors.push("Audio meter floor must be between -120 and -6 dBFS.");
    floor.style.borderColor = "#ff5d69";
  }
  const min = document.querySelector("[data-setting='minDb']");
  const max = document.querySelector("[data-setting='maxDb']");
  if (min && max && Number(min.value) >= Number(max.value)) {
    errors.push("Minimum dB must be lower than maximum dB.");
    min.style.borderColor = max.style.borderColor = "#ff5d69";
  }

  const path = document.querySelector("[data-setting='path']");
  const custom = document.querySelector("[data-setting='preset']")?.value === "custom";
  if (custom && path && !path.value.trim().startsWith("/")) {
    errors.push("Custom OSC path must begin with /.");
    path.style.borderColor = "#ff5d69";
  }

  const box = validationBox();
  box.hidden = errors.length === 0;
  box.textContent = errors.join(" ");
  return errors.length === 0;
}

function save() {
  if (!ws || ws.readyState !== WebSocket.OPEN || !validate()) return;
  ws.send(JSON.stringify({event:"setSettings", context:uuid, payload:settingsFromForm()}));
}

document.addEventListener("change", event => {
  if(event.target?.matches?.("[data-channel-picker]")) {
    useChannelPicker(event.target);return;
  }
  updateVisibility();
  save();
});
document.addEventListener("input", validate);
