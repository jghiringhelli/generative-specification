// ledger.mjs: one line per agent call in $FX_ROOT/ledger.jsonl, and the caps that read it.
// The unit of budget on the Copilot route is NOT dollars of tokens we can trust. Three independent guards are kept:
//   FX_CAP_PREMIUM  premium requests (legacy request-based plans: one per CLI prompt times the model multiplier; see models.json)
//   FX_CAP_CREDITS  GitHub AI Credits (token-metered plans, 1 credit = 0.01 USD) computed from OTel tokens when prices are configured
//   FX_CAP_USD      dollars as reported by the Claude CLI (route claude)
//   FX_CAP_CALLS    number of agent calls (always known; the most robust cap)
//   FX_CAP_HOURS    wall-clock hours since the stage start (queue-state.json)
// Unset = no cap on that axis. FX_SOFT (default 0.8) is the fraction at which the queue stops launching new cells.
import fs from 'node:fs';
import path from 'node:path';
import { num, HARNESS_DIR } from './config.mjs';

export function loadModels() {
  const f = process.env.FX_MODELS_FILE || `${HARNESS_DIR}/models.json`;
  try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return { models: {} }; }
}

// premium-request estimate of one prompt on a request-based plan: multiplier of the model (unknown = 1, flagged)
export function premiumFor(model) {
  const m = (loadModels().models || {})[model];
  if (m && typeof m.multiplier === 'number') return { value: m.multiplier, known: true };
  return { value: 1, known: false };
}
export function creditsFor(model, tokens) {
  const m = (loadModels().models || {})[model];
  if (!m || !m.price_per_mtok || !tokens || tokens.input == null) return null;
  const p = m.price_per_mtok; // USD per million tokens: { input, output, cached_input }
  const usd = (tokens.input - (tokens.cached || 0)) / 1e6 * p.input + (tokens.cached || 0) / 1e6 * (p.cached_input ?? p.input) + (tokens.output || 0) / 1e6 * p.output;
  return usd * 100; // 1 credit = 0.01 USD
}

export function append(paths, rec) {
  fs.mkdirSync(path.dirname(paths.ledger), { recursive: true });
  fs.appendFileSync(paths.ledger, JSON.stringify(rec) + '\n');
}

export function summary(paths, filter = () => true) {
  const s = { calls: 0, premium: 0, premiumUnknownCalls: 0, credits: 0, creditsKnown: 0, usd: 0, tokensIn: 0, tokensOut: 0, errors: 0, infraErrors: 0, byModel: {}, firstTs: null, lastTs: null };
  if (!fs.existsSync(paths.ledger)) return s;
  for (const line of fs.readFileSync(paths.ledger, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    let r; try { r = JSON.parse(line); } catch { continue; }
    if (!filter(r)) continue;
    s.calls++; s.premium += r.premium || 0; if (r.premiumKnown === false) s.premiumUnknownCalls++;
    if (r.credits != null) { s.credits += r.credits; s.creditsKnown++; }
    s.usd += r.usd || 0; s.tokensIn += r.tokensIn || 0; s.tokensOut += r.tokensOut || 0;
    if (r.isError) s.errors++; if (r.errorClass && r.errorClass.startsWith('infra')) s.infraErrors++;
    const k = r.modelServed || r.modelAsked || '?'; s.byModel[k] = (s.byModel[k] || 0) + 1;
    s.firstTs = s.firstTs || r.ts; s.lastTs = r.ts;
  }
  return s;
}

export function readState(paths) { try { return JSON.parse(fs.readFileSync(paths.state, 'utf8')); } catch { return {}; } }
export function writeState(paths, st) { fs.writeFileSync(paths.state, JSON.stringify(st, null, 2)); }
// the wall-clock of a stage starts at its first call (or when the queue starts it)
export function markStageStart(paths, stage) {
  const st = readState(paths); st.stages = st.stages || {};
  if (!st.stages[stage]) { st.stages[stage] = { started: new Date().toISOString() }; writeState(paths, st); }
}

// returns { hard: [..axes at/over the cap..], soft: [..axes at/over soft fraction..] }
// Caps apply per STAGE (the first dash-separated part of a cell id, or 'critic' / 'practitioner'): every stage has its own budget and clock.
export function capStatus(paths, stage) {
  const s = summary(paths, stage ? (r => r.stage === stage) : () => true);
  const st = readState(paths);
  const started = stage ? st.stages?.[stage]?.started : st.started;
  const soft = num('FX_SOFT', 0.8);
  const hours = started ? (Date.now() - Date.parse(started)) / 3.6e6 : 0;
  const axes = [['premium', s.premium, num('FX_CAP_PREMIUM')], ['credits', s.credits, num('FX_CAP_CREDITS')], ['usd', s.usd, num('FX_CAP_USD')], ['calls', s.calls, num('FX_CAP_CALLS')], ['hours', hours, num('FX_CAP_HOURS')]];
  const out = { hard: [], soft: [], used: Object.fromEntries(axes.map(a => [a[0], a[1]])), caps: Object.fromEntries(axes.filter(a => a[2] != null).map(a => [a[0], a[2]])), summary: s };
  // a credits cap is only enforceable when credits are computed for the calls (needs token counts AND prices); otherwise it would silently never trigger
  out.unmeasured = [];
  if (num('FX_CAP_CREDITS') != null && s.calls >= 3 && s.creditsKnown < s.calls) out.unmeasured.push('credits (no token counts or no prices for ' + (s.calls - s.creditsKnown) + ' of ' + s.calls + ' calls: use FX_CAP_CALLS, or verify OTel tokens with adapter-probe --live)');
  for (const [n, used, cap] of axes) { if (cap == null) continue; if (used >= cap) out.hard.push(n); else if (used >= soft * cap) out.soft.push(n); }
  return out;
}
