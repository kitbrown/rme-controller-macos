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
  if (mode !== "eq" && mode !== "compressor") return null;
  const eq = mode === "eq";
  const targets = eq ? [
    ["eq2Freq", settings.frequency, 250], ["eq2Gain", settings.gain, -2]
  ] : [
    ["compThreshold", settings.threshold, -18], ["compRatio", settings.ratio, 2]
  ];
  const steps = targets.map(([paramKey, raw, fallback]) => {
    const {min, max} = PARAMETERS[paramKey];
    const {path} = resolveParameter({paramKey, paramBus: "input", sourceIndex: channel - 1});
    return {path, value: number(raw, fallback, min, max), float: true};
  });
  if (steps.some(step => !Number.isFinite(step.value))) return null;
  const prefix = "/input/" + (channel - 1);
  steps.push({path: prefix + (eq ? "/eq/enable" : "/dynamics/enable"), value: 1, float: false});
  return {channel, steps, query: "/sendchan" + prefix,
    token: eq ? (steps[1].value < 0 ? "EQ CUT" : "EQ LIFT") : "COMP"};
}

const matches = (a, b) => Math.abs(a - b) < 0.0001;

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
