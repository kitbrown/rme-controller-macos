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
function fill(s) {
  document.querySelectorAll("[data-setting]").forEach(el => {
    const k = el.dataset.setting;
    if (s[k] === undefined) return;
    if (el.type === "checkbox") el.checked = !!s[k]; else el.value = s[k];
  });
  updateVisibility();
}
function updateVisibility() {
  document.querySelectorAll("[data-show-preset]").forEach(el => {
    const preset = document.querySelector("[data-setting='preset']")?.value;
    el.hidden = preset !== el.dataset.showPreset;
  });
}
function save() {
  if (!ws || ws.readyState !== WebSocket.OPEN) return;
  const s = {};
  document.querySelectorAll("[data-setting]").forEach(el => {
    const k = el.dataset.setting;
    if (el.type === "checkbox") s[k] = el.checked;
    else if (el.type === "number") s[k] = Number(el.value);
    else s[k] = el.value;
  });
  ws.send(JSON.stringify({event:"setSettings", context:uuid, payload:s}));
}
document.addEventListener("change", () => {
  updateVisibility();
  save();
});
