// copilot adapter: the GitHub Copilot CLI (`copilot -p`) inside the container (image fx1-linux-copilot). Route "copilot".
// Written from the documentation only; NOT executed by its author. Run adapter-probe.mjs first on the real PC.
// - Auth: a GitHub token in the environment, passed by NAME. Order: COPILOT_GITHUB_TOKEN, GH_TOKEN, GITHUB_TOKEN. Use a fine-grained
//   token with the "Copilot Requests" permission and nothing else. The agent's shell cannot read it (--secret-env-vars).
// - Every flow session gets its OWN COPILOT_HOME (a folder), and a follow-up message inside the same session uses --continue
//   (the most recent session of that home), so no session id has to be parsed from an undocumented output format.
// - Output: plain text (-s: only the agent response). Tokens come from the OpenTelemetry file exporter when it works (indicative
//   only; the billing page is the truth). The shared transcript (--share) is kept as evidence.
import fs from 'node:fs';
import path from 'node:path';
import { HARNESS_DIR } from '../lib/config.mjs';

const profile = () => JSON.parse(fs.readFileSync(process.env.FX_COPILOT_PROFILE || `${HARNESS_DIR}/adapters/copilot.profile.json`, 'utf8'));

export default {
  name: 'copilot',
  image: 'fx1-linux-copilot',
  secretEnv: ['COPILOT_GITHUB_TOKEN', 'GH_TOKEN', 'GITHUB_TOKEN'],
  versionCmd: ['copilot', '--version'],
  prepareSession(dir) { fs.mkdirSync(`${dir}/home`, { recursive: true }); try { fs.chmodSync(`${dir}/home`, 0o777); } catch {} },
  cleanupSession() {},

  command({ model, promptFile, turn, web = false, maxCredits }) {
    const p = profile();
    const tokenName = p.tokenEnvPreference.find(n => process.env[n]);
    const flags = [...p.alwaysFlags];
    if (web) flags.push(...p.webFlags);
    if (turn > 1) flags.push(p.continueFlag);
    const mc = maxCredits ?? Number(process.env.FX_MAX_AI_CREDITS || p.maxCreditsDefault);
    if (mc) flags.push(`${p.maxCreditsFlag}=${mc}`);
    if (tokenName) flags.push(`${p.secretEnvFlag}=${tokenName}`);
    flags.push(`${p.shareFlag}=/cfg/share-${String(turn).padStart(2, '0')}.md`);
    const shell = `cd /work && ${p.binary} ${p.promptFlag} "$(cat ${promptFile})" ${p.silentFlag} ${p.modelFlag}="$FX_MODEL" ${flags.join(' ')}`;
    const nn = String(turn).padStart(2, '0');
    return { shell, env: { ...p.env, COPILOT_OTEL_FILE_EXPORTER_PATH: `/cfg/otel-${nn}.jsonl`, FX_MODEL: model } };
  },

  parse(stdout, stderr, exit, ctx = {}) {
    const text = (stdout || '').trim();
    const otel = parseOtel(ctx.cfgDir && path.join(ctx.cfgDir, `otel-${String(ctx.turn).padStart(2, '0')}.jsonl`));
    const isError = exit !== 0;
    return {
      text, isError, errorClass: isError ? classify(stdout + '\n' + stderr, ctx.timedOut) : null,
      sessionId: ctx.sessionKey || null, modelServed: otel.model, tokens: otel.tokens, usd: null, parsed: true, otel: otel.note,
    };
  },
};

export function classify(s, timedOut) {
  if (timedOut) return 'infra-timeout';
  if (/rate.?limit|session limit|weekly|429|too many requests/i.test(s)) return 'infra-rate';
  if (/401|403|unauthori[sz]ed|forbidden|not authenticated|login|token|policy|not (enabled|allowed)|no access|subscription/i.test(s)) return 'infra-auth';
  if (/5\d\d|ECONN|ETIMEDOUT|network|unavailable|overloaded|socket/i.test(s)) return 'infra-net';
  return 'agent';
}

// Reads the OpenTelemetry JSONL written by COPILOT_OTEL_FILE_EXPORTER_PATH. Schema is not documented in the pages read, so this walks
// every JSON object looking for the GenAI attribute names. invoke_agent spans (one per user message) win over chat spans to avoid
// double counting; spans are de-duplicated by span id (a known issue reports duplicated usage in some exports). Indicative only.
export function parseOtel(f) {
  const none = { tokens: null, model: null, note: 'no otel file' };
  if (!f || !fs.existsSync(f)) return none;
  const spans = new Map();
  let model = null;
  const walk = (o, ctx) => {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) { o.forEach(x => walk(x, ctx)); return; }
    const attrs = {};
    if (Array.isArray(o.attributes)) for (const a of o.attributes) { if (a && a.key) attrs[a.key] = unwrap(a.value); }
    else if (o.attributes && typeof o.attributes === 'object') Object.assign(attrs, o.attributes);
    for (const k of Object.keys(o)) if (k.startsWith('gen_ai.')) attrs[k] = o[k];
    const pick = re => { const k = Object.keys(attrs).find(x => re.test(x)); return k ? Number(attrs[k]) || 0 : null; };
    const inTok = pick(/(^|\.)usage\.input_tokens$/);
    if (inTok != null) {
      const id = o.spanId || o.span_id || o.id || `${o.name}:${JSON.stringify(attrs).length}:${spans.size}`;
      spans.set(id, { name: String(o.name || attrs['gen_ai.operation.name'] || ''), input: inTok, output: pick(/(^|\.)usage\.output_tokens$/) || 0, cached: pick(/cache_read\.input_tokens$/) || 0, cost: pick(/cost|credits|aiu/i) });
    }
    const m = attrs['gen_ai.response.model'] || attrs['gen_ai.request.model']; if (m) model = String(m).replace(/^chat\s+/, '');
    for (const v of Object.values(o)) if (v && typeof v === 'object') walk(v, ctx);
  };
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) { if (!line.trim()) continue; try { walk(JSON.parse(line), {}); } catch {} }
  const all = [...spans.values()];
  if (!all.length) return { tokens: null, model, note: 'otel file present, no token attributes found' };
  const agent = all.filter(s => /invoke_agent/i.test(s.name));
  const use = agent.length ? agent : all;
  const t = use.reduce((a, s) => ({ input: a.input + s.input, output: a.output + s.output, cached: a.cached + s.cached }), { input: 0, output: 0, cached: 0 });
  return { tokens: t, model, note: `otel ${agent.length ? 'invoke_agent' : 'chat'} spans: ${use.length}` };
}
const unwrap = v => (v && typeof v === 'object') ? (v.intValue ?? v.doubleValue ?? v.stringValue ?? v.boolValue ?? v) : v;
