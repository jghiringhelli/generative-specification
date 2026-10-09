// run-phase.mjs: one PHASE of the master plan as a resumable, unattended job. Start it DETACHED and poll phase-status.mjs; do not babysit it.
//   node run-phase.mjs --phase 1 [--targets fx1,sdx1,cmp1,e2e1,rem1,wp5,functions,sdx89] [--models id1,id2,...]   critic rounds (Phase 1)
//   node run-phase.mjs --phase 2 [--models id1,id2,...]                                                        practitioner prompts A5-m (Phase 2)
//   node run-phase.mjs --phase 3 [--seed N] [--parallel 1]                                                     S0 verification, then S1 on DEVELOPMENT fixtures (Phase 3)
// Common: --adapter copilot (default) | claude | mock ; --dry prints the plan only.
// Models default to models.json "defaults" filtered by $FX_ROOT/models-available.json (run models-discover.mjs first). Resumable: finished jobs are skipped.
// Writes $FX_ROOT/phase-<n>.log and $FX_ROOT/phase-<n>-status.json. Stops (exit 4) when a cap or STOP is hit; exit 3 if a job was a VOID (rerun the phase to retry once).
import fs from 'node:fs';
import cp from 'node:child_process';
import { paths as getPaths, nowIso, HARNESS_DIR } from './lib/config.mjs';
import { loadModels, capStatus } from './lib/ledger.mjs';
import { routeFor } from './adapters/index.mjs';

const argv = process.argv.slice(2);
const opt = (n, d) => { const i = argv.indexOf('--' + n); return i < 0 ? d : argv[i + 1]; };
const phase = Number(opt('phase')); const dry = argv.includes('--dry');
if (![1, 2, 3].includes(phase)) { console.error('usage: node run-phase.mjs --phase 1|2|3 [...]'); process.exit(2); }
const adapter = opt('adapter', 'copilot');
const paths = getPaths({ noFormulas: phase !== 3 && adapter !== 'mock' });
const logf = `${paths.root}/phase-${phase}.log`, statf = `${paths.root}/phase-${phase}-status.json`;
const log = m => { const l = `${nowIso()} ${m}`; console.log(l); fs.appendFileSync(logf, l + '\n'); };
const status = { phase, started: nowIso(), jobs: [], done: false };
const save = () => fs.writeFileSync(statf, JSON.stringify(status, null, 2));

const defaults = loadModels().defaults || {};
const avail = (() => { try { const r = JSON.parse(fs.readFileSync(`${paths.root}/models-available.json`, 'utf8')).results; return new Set(Object.keys(r).filter(k => r[k].ok)); } catch { return null; } })();
const pickModels = (listOpt, envName, dflt) => {
  const list = (opt(listOpt) || process.env[envName] || '').split(',').filter(Boolean);
  const m = list.length ? list : dflt;
  if (adapter === 'mock') return list.length ? list : ['mock-1'];
  if (!avail) { log('WARNING: no models-available.json; run models-discover.mjs first. Using the list as given, unchecked.'); return m; }
  const ok = m.filter(x => avail.has(x)); const miss = m.filter(x => !avail.has(x));
  if (miss.length) log('not available to this account, skipped: ' + miss.join(', '));
  return ok;
};
const vendorOf = m => /claude/.test(m) ? 'anthropic' : /gpt/.test(m) ? 'openai' : /gemini/.test(m) ? 'google' : 'other';
const run = (script, args, env = {}) => {
  log(`RUN ${script} ${args.join(' ')}`);
  if (dry) return 0;
  const r = cp.spawnSync('node', [`${HARNESS_DIR}/${script}`, ...args], { encoding: 'utf8', env: { ...process.env, ...env }, maxBuffer: 1 << 28 });
  fs.appendFileSync(logf, (r.stdout || '') + (r.stderr || ''));
  return r.status;
};
const cellStatus = id => { try { return JSON.parse(fs.readFileSync(`${paths.cells}/${id}/logs/meta.json`, 'utf8')).status; } catch { return null; } };
const job = (name, fn) => { const j = { name, at: nowIso() }; try { j.result = fn(); } catch (e) { j.result = 'ERROR ' + e.message; } status.jobs.push(j); save(); return j.result; };
const halt = () => { const cs = capStatus(paths, phase === 1 ? 'critic' : phase === 2 ? 'practitioner' : undefined); return cs.hard.length || fs.existsSync(paths.stop) ? cs.hard.join(',') || 'STOP' : null; };
let worst = 0;

if (phase === 1) {
  const T = JSON.parse(fs.readFileSync(`${HARNESS_DIR}/critic-targets.json`, 'utf8')).targets;
  const targets = (opt('targets') || 'fx1,sdx1,cmp1,e2e1,rem1,wp5,functions,sdx89').split(',').filter(t => T[t]).sort((a, b) => T[a].priority - T[b].priority);
  const models = pickModels('models', 'FX_CRITIC_MODELS', defaults.critic_set || []);
  const vendors = new Set(models.map(vendorOf));
  log(`Phase 1 plan: targets ${targets.join(',')} x models ${models.join(',')} (vendors: ${[...vendors].join(',')})`);
  if (adapter !== 'mock' && (vendors.size < 3 || [...vendors].filter(v => v !== 'anthropic').length < 2)) log('WARNING: fewer than 3 vendors or fewer than 2 non-Anthropic: a protocol critic round needs both. The jobs run, but the round is not complete.');
  for (const t of targets) for (const m of models) {
    const h = halt(); if (h) { log('HALT: ' + h); worst = 4; break; }
    const args = ['--target', t, '--model', m, '--adapter', adapter]; if (T[t].kind === 'panel') args.push('--role', 'all');
    const rc = job(`critic ${t} ${m}`, () => run('critic-run.mjs', args));
    if (rc === 4) { worst = 4; break; } worst = Math.max(worst, rc || 0);
  }
}

if (phase === 2) {
  const models = pickModels('models', 'FX_PRACTITIONER_MODELS', defaults.practitioner_set || []);
  log(`Phase 2 plan: models ${models.join(',')} x variants m1,m2 (non-Anthropic only by default)`);
  for (const m of models) for (const variant of ['m1', 'm2']) {
    const h = halt(); if (h) { log('HALT: ' + h); worst = 4; break; }
    const rc = job(`practitioner ${m} ${variant}`, () => run('practitioner-run.mjs', ['--model', m, '--variant', variant, '--adapter', adapter]));
    if (rc === 4) { worst = 4; break; } worst = Math.max(worst, rc || 0);
  }
}

if (phase === 3) {
  const vm = { ...(defaults.fx_vendor_models || {}) };
  for (const k of ['anth', 'oai', 'goog']) if (process.env['FX_MODEL_' + k.toUpperCase()]) vm[k] = process.env['FX_MODEL_' + k.toUpperCase()];
  const vendors = Object.keys(vm).filter(k => adapter === 'mock' || !avail || avail.has(vm[k]));
  log(`Phase 3 plan: vendors ${vendors.map(k => k + '=' + vm[k]).join(' ')}; S0 then S1 on DEVELOPMENT fixtures only`);
  if (adapter === 'mock') for (const k of Object.keys(vm)) vm[k] = 'mock-1';
  // S0: environment verification (no model) and one dry cell per vendor
  const v = job('S0 verify-env', () => run('verify-env.mjs', []));
  if (v !== 0) { log('S0 FAILED: read verify/verification.md. S1 does not start.'); worst = 1; }
  else {
    let s0ok = true;
    for (const k of vendors) {
      const id = `dry-A-hive-en-${k}-r1`;
      if (cellStatus(id) === 'FINISHED') { log('skip (done) ' + id); continue; }
      const rc = job(`S0 dry ${k}`, () => run('run.mjs', ['--id', id, '--path', 'A', '--lang', 'en', '--fixture', 'DEV-API-hivelog', '--adapter', adapter === 'mock' ? 'mock' : routeFor(k), '--model', vm[k]]));
      if (rc !== 0) { s0ok = false; log(`S0 dry run for ${k} did not finish (exit ${rc}); S1 for this vendor is skipped`); vendors.splice(vendors.indexOf(k), 1); }
    }
    // S1: 6 cells per vendor, the composition of development batches 3 and 4 (RUNBOOK-FX1-OTHER-PC section 9.2)
    if (vendors.length && !halt()) {
      const seed = opt('seed', process.env.FX_SEED || '20261009');
      const csv = `${paths.root}/schedule-s1.csv`;
      if (!fs.existsSync(csv)) {
        const r = cp.spawnSync('node', [`${HARNESS_DIR}/schedule.mjs`, '--stage', 's1', '--seed', seed, '--vendors', vendors.join(','), '--cells', 'A:hive:en,A:kiln:es,A:lamp:en,A:tally:en,B:kiln:en,B:tally:es', '--reps', '1'], { encoding: 'utf8' });
        fs.writeFileSync(csv, r.stdout); fs.writeFileSync(`${paths.root}/schedule-s1.txt`, `seed ${seed}\nvendors ${vendors.join(',')}\nnode schedule.mjs --stage s1 --seed ${seed} --vendors ${vendors.join(',')} --cells A:hive:en,A:kiln:es,A:lamp:en,A:tally:en,B:kiln:en,B:tally:es --reps 1\n`);
      }
      const env = {}; for (const k of vendors) { env['FX_MODEL_' + k.toUpperCase()] = vm[k]; if (adapter !== 'copilot') env['FX_ROUTE_' + k.toUpperCase()] = adapter; }
      const rc = job('S1 queue', () => run('queue.mjs', [csv, '--parallel', opt('parallel', '1'), ...(adapter !== 'copilot' ? ['--adapter', adapter] : [])], env));
      if (rc) worst = Math.max(worst, rc);
    }
  }
  log('Phase 3 ends at the GATE: do NOT start S2 (FX-0 on the confirmatory briefs) or S3/S4. Report to JC (STAGE-REPORT).');
}
status.done = true; status.ended = nowIso(); status.exit = worst; save(); log(`phase ${phase} finished with exit ${worst}`);
process.exit(worst);
