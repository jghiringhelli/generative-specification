// drive.mjs: runs the rows of schedule.csv through the harness, N at a time, resumable, stoppable. NEW, review before use.
// usage: FX_ROOT=<run folder> FX_MODEL_<VENDOR>=<exact model id> node drive.mjs schedule.csv <parallel> [--dry]
// - a row whose logs2/<id>/meta.json exists is skipped (so a re-start never repeats a finished run, and never overwrites a sandbox)
// - create a file named STOP in FX_ROOT to stop launching new runs (running ones finish)
// - the harness is the PATCHED copy harness/run2-portable.js for vendor tag 'anth' (it speaks to the Claude CLI only); any other vendor tag needs its own
//   adapter harness/run2-<vendor>.js, and the row is refused (not started) while that file does not exist
// - the vendor tag in the id picks the model id from FX_MODEL_<VENDOR> (upper case)
import fs from 'node:fs';
import cp from 'node:child_process';
const [csv, par = '1', flag] = process.argv.slice(2);
const ROOT = (process.env.FX_ROOT || '').split(String.fromCharCode(92)).join('/');
if (!ROOT) { console.error('set FX_ROOT'); process.exit(2); }
const rows = fs.readFileSync(csv, 'utf8').trim().split('\n').slice(1).map(l => { const [seq, block, id, path, lang, vendor, fixture, key, rep] = l.split(','); return { seq, id, path, lang, vendor, key }; });
let running = 0, next = 0, failed = 0;
const log = m => { const line = new Date().toISOString() + ' ' + m; console.log(line); fs.appendFileSync(ROOT + '/drive.log', line + '\n'); };
function launch() {
  while (running < Number(par) && next < rows.length) {
    if (fs.existsSync(ROOT + '/STOP')) { log('STOP file present: no new runs'); next = rows.length; break; }
    const r = rows[next++];
    if (fs.existsSync(`${ROOT}/logs2/${r.id}/meta.json`)) { log('skip (done) ' + r.id); continue; }
    const model = process.env['FX_MODEL_' + r.vendor.toUpperCase()];
    if (!model) { log('NO MODEL ID for vendor ' + r.vendor + ' (set FX_MODEL_' + r.vendor.toUpperCase() + '): row ' + r.id + ' not started'); failed++; continue; }
    const hf = r.vendor === 'anth' ? 'run2-portable.js' : `run2-${r.vendor}.js`;
    if (!fs.existsSync(`${ROOT}/harness/${hf}`)) { log('NO ADAPTER harness/' + hf + ': row ' + r.id + ' not started'); failed++; continue; }
    const args = [`${ROOT}/harness/${hf}`, r.id, r.path, r.lang, r.key];
    if (flag === '--dry') { log('DRY FX_MODEL=' + model + ' node ' + args.join(' ')); continue; }
    running++; log('start ' + r.id + ' model=' + model);
    const c = cp.spawn('node', args, { env: { ...process.env, FX_MODEL: model, FX_ROOT: ROOT }, stdio: ['ignore', fs.openSync(`${ROOT}/logs2/${r.id}.console.txt`, 'a'), 'inherit'] });
    c.on('exit', code => { running--; log('end ' + r.id + ' exit ' + code); if (code) failed++; launch(); });
  }
  if (running === 0 && next >= rows.length) log('queue empty; failures=' + failed);
}
fs.mkdirSync(ROOT + '/logs2', { recursive: true });
launch();
