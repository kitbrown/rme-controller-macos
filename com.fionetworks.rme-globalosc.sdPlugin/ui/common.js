let ws, uuid;

window.connectElgatoStreamDeckSocket = (port, propertyInspectorUUID, registerEvent, info, actionInfoJSON) => {
  uuid = propertyInspectorUUID;
  const actionInfo = JSON.parse(actionInfoJSON);
  ws = new WebSocket(`ws://127.0.0.1:${port}`);
  ws.onopen = () => {
    ws.send(JSON.stringify({event: registerEvent, uuid}));
    fill(actionInfo.payload?.settings || {});
  };
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.event === "didReceiveSettings") fill(m.payload?.settings || {});
  };
};

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

document.addEventListener("change", () => {
  updateVisibility();
  save();
});
document.addEventListener("input", validate);
