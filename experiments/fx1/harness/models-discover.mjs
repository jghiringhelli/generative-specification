// models-discover.mjs: which model ids can THIS account actually call through the Copilot CLI? The CLI has no documented non-interactive list command,
// so each candidate gets one tiny ping (a few tokens). Writes $FX_ROOT/models-available.json with, per id: ok, the model the CLI says it used (if any), the error class.
// usage: FX_ROOT=... COPILOT_GITHUB_TOKEN=... node models-discover.mjs [--adapter copilot] [--candidates id1,id2,...]
// Default candidates: every id in models.json (the ids of the CLI reference table of 2026-10-09). Cost: one ping per candidate.
import fs from 'node:fs';
import { paths as getPaths, nowIso } from './lib/config.mjs';
import { dock } from './lib/docker.mjs';
import { loadModels } from './lib/ledger.mjs';
import { openCell, newSession, agentCall, endCell } from './lib/cell.mjs';
import { getAdapter } from './adapters/index.mjs';

const argv = process.argv.slice(2);
const opt = n => { const i = argv.indexOf('--' + n); return i < 0 ? undefined : argv[i + 1]; };
const paths = getPaths({ noFormulas: true }); paths.tools = process.env.TOOLS_DIR || paths.root; paths.formulas = process.env.FORMULA_DIR || paths.root;
const adapter = getAdapter(opt('adapter') || 'copilot');
const cands = opt('candidates') ? opt('candidates').split(',') : Object.keys(loadModels().models);
const out = { date: nowIso(), adapter: adapter.name, results: {} };
for (const m of cands) {
  const id = `discover-${m.replace(/[^a-z0-9]+/gi, '-')}-${Date.now()}`;
  const cell = openCell({ paths, id, adapter, model: m, stage: 'discover', noLock: true });
  try {
    const s = newSession(cell, 'ping');
    const r = agentCall(cell, s, 'ping', 'Reply with exactly the two letters OK and nothing else. Do not use any tool.', { respectStop: false, maxBudgetUsd: 0.3, maxCredits: 30 });
    out.results[m] = { ok: !r.isError && /\bOK\b/.test(r.text || ''), servedModel: r.modelServed, errorClass: r.errorClass, reply: (r.text || '').slice(0, 120), tokens: r.tokens };
  } catch (e) { out.results[m] = { ok: false, error: String(e.message).slice(0, 200) }; }
  endCell(cell); dock(['volume', 'rm', '-f', cell.vol]); fs.rmSync(cell.dir, { recursive: true, force: true });
  console.log((out.results[m].ok ? 'AVAILABLE  ' : 'unavailable') + ' ' + m + (out.results[m].errorClass ? '  (' + out.results[m].errorClass + ')' : ''));
}
fs.writeFileSync(`${paths.root}/models-available.json`, JSON.stringify(out, null, 2));
console.log(`\nwritten ${paths.root}/models-available.json`);
