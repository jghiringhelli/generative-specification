// queue.mjs: runs the rows of a schedule csv, N at a time, resumable, with caps and stop rules.
// usage: node queue.mjs <schedule.csv> [--parallel 1] [--dry] [--adapter claude|copilot|mock]
// Environment: FX_ROOT, FORMULA_DIR, TOOLS_DIR; FX_MODEL_<VENDOR> (ANTH, OAI, GOOG, ...) = the exact model id for that vendor tag;
//   FX_ROUTE_<VENDOR> (optional) = claude|copilot|mock (default: anth -> claude, others -> copilot); caps FX_CAP_* (see lib/ledger.mjs).
// Resume: a row whose cells/<id>/logs/meta.json has status FINISHED is skipped. A VOID-INFRA or CAP-STOP cell, or a cell without meta.json (crash),
// is archived as <id>.void1 and the slot is re-run ONCE (runbook section 13); a second void is logged and not re-run.
// Stop rules (each writes STOP in FX_ROOT with the reason, running cells finish): hard cap on any axis, soft cap (FX_SOFT x cap),
// two consecutive voids on one vendor (that vendor's remaining rows are skipped), an authentication error, a model-id mismatch, the STOP file.
import fs from 'node:fs';
import cp from 'node:child_process';
import { paths as getPaths, nowIso, HARNESS_DIR } from './lib/config.mjs';
import { dock } from './lib/docker.mjs';
import { capStatus, markStageStart } from './lib/ledger.mjs';
import { routeFor } from './adapters/index.mjs';

const argv = process.argv.slice(2);
const csv = argv[0];
const opt = n => { const i = argv.indexOf('--' + n); return i < 0 ? undefined : argv[i + 1]; };
const par = Number(opt('parallel') || 1), dry = argv.includes('--dry'), forced = opt('adapter');
if (!csv || !fs.existsSync(csv)) { console.error('usage: node queue.mjs <schedule.csv> [--parallel N] [--dry] [--adapter A]'); process.exit(2); }
const paths = getPaths({ noFormulas: dry });
const rows = fs.readFileSync(csv, 'utf8').trim().split('\n').slice(1).map(l => { const [seq, block, id, path, lang, vendor, fixture, key, rep] = l.split(','); return { seq, id, path, lang, vendor, key }; });
const log = m => { const line = nowIso() + ' ' + m; console.log(line); fs.appendFileSync(paths.driveLog, line + '\n'); };
const stop = why => { if (!fs.existsSync(paths.stop)) fs.writeFileSync(paths.stop, nowIso() + ' ' + why + '\n'); log('STOP written: ' + why); };

const stage = rows.length ? rows[0].id.split('-')[0] : 'none';
if (!dry) markStageStart(paths, stage);
let running = 0, next = 0, finished = 0, voids = 0;
const consecVoid = {}; const deadVendor = new Set();

function slotState(id) {
  const m = `${paths.cells}/${id}/logs/meta.json`;
  if (!fs.existsSync(`${paths.cells}/${id}`)) return 'new';
  if (!fs.existsSync(m)) return 'crashed';
  try { const s = JSON.parse(fs.readFileSync(m, 'utf8')).status; return s || 'crashed'; } catch { return 'crashed'; }
}
function archiveVoid(id) {
  let n = 1; while (fs.existsSync(`${paths.cells}/${id}.void${n}`)) n++;
  if (n > 1) return false; // a second void is not re-run
  fs.renameSync(`${paths.cells}/${id}`, `${paths.cells}/${id}.void${n}`);
  dock(['volume', 'rm', '-f', `fxvol-${id}`]);
  return true;
}

function launch() {
  while (running < par && next < rows.length) {
    if (fs.existsSync(paths.stop)) { log('STOP file present: no new cells'); next = rows.length; break; }
    const cs = capStatus(paths, stage);
    if (cs.hard.length) { stop('hard cap on ' + cs.hard.join(',') + ' ' + JSON.stringify(cs.used)); next = rows.length; break; }
    if (cs.unmeasured.length) { stop('cap cannot be enforced: ' + cs.unmeasured[0]); next = rows.length; break; }
    if (cs.soft.length) { stop('soft cap (' + (process.env.FX_SOFT || 0.8) + ') on ' + cs.soft.join(',') + ' ' + JSON.stringify(cs.used)); next = rows.length; break; }
    const r = rows[next++];
    if (deadVendor.has(r.vendor)) { log(`skip (vendor ${r.vendor} stopped after consecutive voids) ${r.id}`); continue; }
    const s = slotState(r.id);
    if (s === 'FINISHED') { log('skip (done) ' + r.id); continue; }
    if (s === 'VOID-INFRA' || s === 'crashed' || s === 'HARNESS-ERROR' || s === 'CAP-STOP') {
      if (dry) log(`DRY would archive ${r.id} (${s}) as .void1 and re-run once`);
      else if (!archiveVoid(r.id)) { log(`second void for slot ${r.id}: NOT re-run; tell JC`); continue; } else log(`archived ${r.id} (${s}) as .void1; re-running once`);
    }
    const model = process.env['FX_MODEL_' + r.vendor.toUpperCase()];
    if (!model) { log(`NO MODEL ID for vendor ${r.vendor} (set FX_MODEL_${r.vendor.toUpperCase()}): ${r.id} not started`); continue; }
    const adapter = forced || routeFor(r.vendor);
    const args = [`${HARNESS_DIR}/run.mjs`, '--id', r.id, '--path', r.path, '--lang', r.lang, '--fixture', r.key, '--adapter', adapter, '--model', model];
    if (dry) { log(`DRY adapter=${adapter} model=${model} node ${args.map(x => x.replace(HARNESS_DIR, '<harness>')).join(' ')}`); continue; }
    running++; log(`start ${r.id} adapter=${adapter} model=${model}`);
    fs.mkdirSync(`${paths.root}/console`, { recursive: true });
    const out = fs.openSync(`${paths.root}/console/${r.id}.console.txt`, 'a');
    const c = cp.spawn('node', args, { env: { ...process.env }, stdio: ['ignore', out, out] });
    c.on('exit', code => {
      running--; log(`end ${r.id} exit ${code}`);
      const v = r.vendor;
      if (code === 3) { voids++; consecVoid[v] = (consecVoid[v] || 0) + 1; if (consecVoid[v] >= 2) { deadVendor.add(v); stop(`2 consecutive voids on vendor ${v} (rule c)`); } }
      else { consecVoid[v] = 0; if (code === 0) finished++; }
      if (code === 4) stop('cell stopped by a cap or the STOP file');
      if (code === 5) stop('gate refused a registered run');
      try { const m = JSON.parse(fs.readFileSync(`${paths.cells}/${r.id}/logs/meta.json`, 'utf8')); if (m.modelMismatch) stop(`model id served differs from the id asked (${r.id}) rule e`); if (m.void && /auth/.test(m.void.class)) stop(`authentication error (${r.id}) rule d`); } catch {}
      launch();
    });
  }
  if (running === 0 && next >= rows.length) log(`queue empty; finished=${finished} voids=${voids}`);
}
if (!dry) fs.mkdirSync(paths.cells, { recursive: true });
launch();
