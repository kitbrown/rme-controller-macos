let websocket, uuid, actionInfo;
function connectElgatoStreamDeckSocket(port, propertyInspectorUUID, registerEvent, info, actionInfoJson) {
  uuid = propertyInspectorUUID;
  actionInfo = JSON.parse(actionInfoJson);
  websocket = new WebSocket(`ws://127.0.0.1:${port}`);
  websocket.onopen = () => {
    websocket.send(JSON.stringify({ event: registerEvent, uuid }));
    websocket.send(JSON.stringify({ event: "getSettings", context: uuid }));
  };
  websocket.onmessage = ev => {
    const msg = JSON.parse(ev.data);
    if (msg.event === "didReceiveSettings") fill(msg.payload.settings || {});
  };
}
function fill(s) {
  document.querySelectorAll("[data-setting]").forEach(el => {
    const k = el.dataset.setting;
    if (s[k] !== undefined) el.value = s[k];
  });
}
function save() {
  const s = {};
  document.querySelectorAll("[data-setting]").forEach(el => {
    const k = el.dataset.setting;
    if (el.type === "number") s[k] = Number(el.value);
    else if (el.type === "checkbox") s[k] = el.checked;
    else s[k] = el.value;
  });
  websocket.send(JSON.stringify({ event: "setSettings", context: uuid, payload: s }));
}
window.addEventListener("change", save);
