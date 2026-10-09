// run-record.mjs: one JSON summary of a finished run from its turn*.raw.txt files. NEW, review before use.
// usage: node run-record.mjs <log folder of one run> > RUN-RECORD.json
import fs from 'node:fs';
import path from 'node:path';
const dir = process.argv[2];
const files = fs.readdirSync(dir).filter(f => /^turn\d+-.*\.raw\.txt$/.test(f)).sort();
const rec = { log: dir, turns: [], models: {}, totals: { input: 0, output: 0, cache_read: 0, cache_write: 0, cost_usd: 0 }, tokensAvailable: false, errors: 0 };
for (const f of files) {
  const raw = fs.readFileSync(path.join(dir, f), 'utf8').split('\n---STDERR---')[0];
  let j; try { j = JSON.parse(raw); } catch { rec.turns.push({ file: f, parsed: false }); rec.errors++; continue; }
  const u = j.usage || {};
  const t = { file: f, parsed: true, is_error: !!j.is_error, stop_reason: j.stop_reason || null, terminal_reason: j.terminal_reason || null, num_turns: j.num_turns ?? null, duration_ms: j.duration_ms ?? null, cost_usd: j.total_cost_usd ?? null, input: u.input_tokens ?? null, output: u.output_tokens ?? null, cache_read: u.cache_read_input_tokens ?? null, cache_write: u.cache_creation_input_tokens ?? null };
  for (const [m, v] of Object.entries(j.modelUsage || {})) rec.models[m] = (rec.models[m] || 0) + 1;
  if (t.input !== null) { rec.tokensAvailable = true; rec.totals.input += t.input; rec.totals.output += t.output || 0; rec.totals.cache_read += t.cache_read || 0; rec.totals.cache_write += t.cache_write || 0; }
  rec.totals.cost_usd += t.cost_usd || 0; if (t.is_error) rec.errors++; rec.turns.push(t);
}
console.log(JSON.stringify(rec, null, 2));
// SUPERSEDED 2026-10-09 by experiments/fx1/harness/ (kept for history; do not use).
