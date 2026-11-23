// Channel-scoped recipes. All writes originate from a key press followed by fresh OSC.
import {isIPv4} from "node:net";
import {PARAMETERS, resolveParameter} from "../ui/parameter-config.js";

function number(raw, fallback, low, high) {
  const n = raw === undefined ? fallback : raw;
  if (typeof n !== "number" || !Number.isFinite(n) || n < low || n > high) return NaN;
  return n;
}

export function recipePlan(settings) {
  const channel = number(settings.channel, 1, 1, 1000);
  if (!Number.isInteger(channel)) return null;
  const mode = settings.preset ?? "eq";
  const sourceIndex = channel - 1;
  const prefix = "/input/" + sourceIndex;
  const steps = [];
  const field = (name, fallback, min, max) => number(settings[name], fallback, min, max);
  const add = (suffix, value, float = true) => steps.push({path: prefix + "/" + suffix, value, float});
  function parameter(key, name, fallback) {
    const {min, max} = PARAMETERS[key];
    const {path} = resolveParameter({paramKey: key, paramBus: "input", sourceIndex});
    steps.push({path, value: field(name, fallback, min, max), float: true});
  }

  let symbol;
  let bypass;
  if (mode === "compressor" || mode === "timedComp") {
    parameter("compThreshold", "threshold", -18);
    parameter("compRatio", "ratio", 2);
    if (mode === "timedComp") {
      add("dynamics/attack", field("attack", 15, 0, 200));
      add("dynamics/release", field("release", 180, 100, 999));
    }
    add("dynamics/enable", 1, false);
    symbol = "COMP";
  } else if (mode === "expander") {
    add("dynamics/expthres", field("expThreshold", -40, -99, -20));
    add("dynamics/expratio", field("expRatio", 2, 1.1, 10));
    bypass = {...steps[1], value: 1};
    add("dynamics/enable", 1, false);
    symbol = "EXP";
  } else if (mode === "hpf") {
    add("lowcut/freq", field("frequency", 70, 20, 500));
    add("lowcut/enable", 1, false);
    symbol = "HPF";
  } else if (mode === "lpf") {
    // RME's type value is the zero-based position in this interface's menu.
    // Require the user to identify Low Pass rather than select an unknown shape.
    const index = {"3": 2, "4": 3}[settings.lowPassPosition];
    if (index === undefined || typeof index !== "number") return null;
    add("eq/band3type", index);
    parameter("eq3Freq", "frequency", 4500);
    add("eq/enable", 1, false);
    symbol = "LPF";
  } else if (["eq", "lowShelf", "highShelf"].includes(mode)) {
    const band = {eq: 2, lowShelf: 1, highShelf: 3}[mode];
    if (band !== 2) add("eq/band" + band + "type", 1); // Bell, then Shelf in RME's table.
    parameter("eq" + band + "Freq", "frequency", {1:100, 2:250, 3:12000}[band]);
    parameter("eq" + band + "Gain", "gain", band === 2 ? -2 : 2);
    add("eq/enable", 1, false);
    symbol = mode === "lowShelf" ? "LOW SHELF" : mode === "highShelf" ? "HIGH SHELF" :
      settings.gain < 0 || (band === 2 && settings.gain === undefined) ? "EQ CUT" : "EQ LIFT";
  } else {
    return null;
  }
  if (steps.some(step => !Number.isFinite(step.value))) return null;
  const label = typeof settings.keyLabel === "string" ? settings.keyLabel.trim().slice(0,8) : "";
  const legacyLabel = (mode === "hpf" && label === "LOW CUT") || (mode === "lpf" && label === "HIGH CUT");
  return {channel, steps, bypass, query: "/sendchan" + prefix, token: legacyLabel ? symbol : label || symbol, symbol};
}

const matches = (a, b) => Math.abs(a - b) < 0.0001;

// Classify the displayed preset from the mixer's incoming values. The same
// Dynamics enable path is shared by many keys; only matching presets light up.
export function recipeState(plan, values) {
  if (!plan) return "SETUP";
  if (values.get(plan.steps.at(-1).path) === 0 ||
      (plan.bypass && values.get(plan.bypass.path) === plan.bypass.value)) return "OFF";
  if (!plan.steps.every(step => values.has(step.path))) return "SYNC";
  return plan.steps.every(step => matches(values.get(step.path), step.value)) ? "ON" : "READY";
}

// UDP has no transaction ID. Serialize recipes on each input, collect a fresh
// baseline, then acknowledge each changed value and re-read the whole recipe.
export class RecipeRunner {
  runs = new Map();

  start(context, settings, endpoint, send, status) {
    if (this.runs.has(context)) return;
    const plan = recipePlan(settings);
    const host = endpoint.host === "localhost" ? "127.0.0.1" : endpoint.host;
    if (!plan || !isIPv4(host)) return status("SETUP");
    const lock = host + "/" + plan.channel;
    if ([...this.runs.values()].some(run => run.lock === lock)) return status("BUSY");
    const run = {context, plan, host, port: endpoint.receivePort, lock, send, status,
      phase: "baseline", values: new Map(), wrote: false};
    this.runs.set(context, run);
    status("READING");
    this.arm(run);
    send(plan.query, 1, false);
  }

  arm(run) {
    clearTimeout(run.timer);
    run.timer = setTimeout(() => this.finish(run, run.wrote ? "CHECK MIX" : "NO DATA"), 1800);
  }

  finish(run, result) {
    this.cancel(run.context);
    run.status(result);
  }

  cancel(context) {
    clearTimeout(this.runs.get(context)?.timer);
    this.runs.delete(context);
  }

  receive(port, host, path, value) {
    for (const run of this.runs.values()) {
      if (run.port !== port || run.host !== host) continue;
      if (path === "/status/connection" && value === 0) {
        this.finish(run, run.wrote ? "CHECK MIX" : "OFFLINE");
        continue;
      }
      if (!Number.isFinite(value) || !run.plan.steps.some(step => step.path === path)) continue;
      run.values.set(path, value);
      if (run.phase === "write" && (path !== run.pending.path || !matches(value, run.pending.value))) continue;
      if (run.values.size !== run.plan.steps.length) continue;
      if (run.phase === "verify") {
        const ok = run.plan.steps.every(step => matches(run.values.get(step.path), step.value));
        this.finish(run, ok ? "APPLIED" : "CHECK MIX");
        continue;
      }
      if (run.phase === "baseline" && run.plan.bypass && recipeState(run.plan, run.values) === "ON") {
        // Bypass expansion alone. The Dynamics switch also controls compression.
        const step = run.plan.bypass;
        run.plan = {...run.plan, steps: [step]};
        run.values = new Map([[step.path, run.values.get(step.path)]]);
      }
      const next = run.plan.steps.find(step => !matches(run.values.get(step.path), step.value));
      if (next) {
        // A changed value for an earlier step during a run is external feedback.
        // Stop instead of chasing another control or repeatedly rewriting the mixer.
        const index = run.plan.steps.indexOf(next);
        if (run.wrote && index <= run.lastIndex) {
          this.finish(run, "CHECK MIX");
          continue;
        }
        run.phase = "write";
        run.wrote = true;
        run.pending = next;
        run.lastIndex = index;
        run.status("APPLYING");
        this.arm(run);
        run.send(next.path, next.value, next.float);
      } else if (run.wrote) {
        run.phase = "verify";
        run.values.clear();
        this.arm(run);
        run.send(run.plan.query, 1, false);
      } else {
        this.finish(run, "MATCHES");
      }
    }
  }
}
