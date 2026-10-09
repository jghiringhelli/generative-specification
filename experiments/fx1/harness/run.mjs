// run.mjs: ONE cell. node run.mjs --id <id> --path <A|B|C> --lang <en|es> --fixture <key> --adapter <claude|copilot|mock> --model <exact id> [--stage s]
// Environment: FX_ROOT, FORMULA_DIR, TOOLS_DIR (see README). Exit 0 = the cell finished (the checker result is data, not an exit code),
// 3 = VOID (infrastructure), 4 = stopped by a cap or STOP, 1 = harness failure, 5 = refused by the gate.
import fs from 'node:fs';
import cp from 'node:child_process';
import crypto from 'node:crypto';
import { paths as getPaths, nowIso, norm } from './lib/config.mjs';
import { dock } from './lib/docker.mjs';
import { openCell, endCell, CapStop } from './lib/cell.mjs';
import { runFlow } from './lib/flow.mjs';
import { getAdapter } from './adapters/index.mjs';
import { gateCheck } from './lib/gate.mjs';
import { runChecker } from './lib/check.mjs';
import { DATE, SENTINEL } from './lib/formulas.mjs';

const a = Object.fromEntries(process.argv.slice(2).reduce((r, x, i, v) => (x.startsWith('--') ? [...r, [x.slice(2), v[i + 1]]] : r), []));
for (const k of ['id', 'path', 'lang', 'fixture', 'adapter', 'model']) if (!a[k]) { console.error('missing --' + k); process.exit(2); }
const paths = getPaths();
const adapter = getAdapter(a.adapter);
const git = (dir, ...x) => cp.spawnSync('git', ['-c', 'safe.directory=*', '-C', dir, ...x], { encoding: 'utf8' }).stdout?.trim() || '';

// The confirmatory fixtures never run unless the registration gate holds. One exception, the FX-0 DIAGNOSTIC (runbook stage S2): ids starting with
// "fx0" run on the confirmatory briefs only if JC wrote the file $FX_ROOT/GO-FX0.txt (his written go). Such cells are marked diagnosticOnly in meta.json.
let diagnosticOnly = false;
if (a.fixture.startsWith('FIX-')) {
  const top = git(paths.formulas, 'rev-parse', '--show-toplevel');
  const g = gateCheck({ repo: paths.repo, formulasRoot: top });
  if (!g.ok) {
    if (a.id.startsWith('fx0') && fs.existsSync(`${paths.root}/GO-FX0.txt`)) diagnosticOnly = true;
    else { console.error(`REFUSED (registered run not allowed yet; the FX-0 diagnostic needs the file GO-FX0.txt written by JC):${String.fromCharCode(10)} - ` + g.reasons.join(`${String.fromCharCode(10)} - `)); process.exit(5); }
  }
}

const cell = openCell({ paths, id: a.id, adapter, model: a.model, stage: a.stage || a.id.split('-')[0] });
const sha = f => { try { return crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'); } catch { return null; } };
const formTop = git(paths.formulas, 'rev-parse', '--show-toplevel');
cell.meta = {
  id: a.id, stage: cell.stage, path: a.path, lang: a.lang, fixture: a.fixture, adapter: adapter.name, route: adapter.name, modelAsked: a.model,
  start: nowIso(), harnessCommit: git(paths.repo, 'rev-parse', 'HEAD'), harnessBranch: git(paths.repo, 'branch', '--show-current'),
  formulasCommit: git(formTop, 'rev-parse', 'HEAD'), formulasDirty: !!git(formTop, 'status', '--short'),
  checkerSha256: sha(`${paths.tools}/gs-check/gs-check.mjs`), lockSha256: sha(`${paths.tools}/gs-lock/gs-lock.mjs`),
  scriptedDate: DATE, sentinelName: SENTINEL, diagnosticOnly, host: process.platform, node: process.version,
};
const v = dock(['run', '--rm', adapter.image, ...adapter.versionCmd]);
cell.meta.cliVersion = (v.stdout || v.stderr || '').trim().split('\n')[0];
cell.meta.imageId = (dock(['image', 'inspect', '--format', '{{.Id}}', adapter.image]).stdout || '').trim();
let status = 'FINISHED', exitCode = 0;
let flowRes = {};
try {
  flowRes = runFlow(cell, { P: a.path, lang: a.lang, fixtureKey: a.fixture });
  if (cell.void) { status = 'VOID-INFRA'; exitCode = 3; }
} catch (e) {
  if (e instanceof CapStop) { status = 'CAP-STOP'; exitCode = 4; cell.meta.capAxes = e.axes; }
  else { status = 'HARNESS-ERROR'; exitCode = 1; cell.meta.error = String(e.stack || e).slice(0, 2000); }
}
endCell(cell);
// copy the sandbox out of the volume (ownership root, so nothing in it is executed by accident), then drop the volume
fs.mkdirSync(cell.work, { recursive: true });
dock(['run', '--rm', '-v', `${cell.vol}:/work`, '-v', `${cell.work}:/out`, 'fx1-linux', 'sh', '-c', 'cp -a /work/. /out/ && chown -R 0:0 /out']);
dock(['volume', 'rm', '-f', cell.vol]);
const du = dock(['run', '--rm', '-v', `${cell.work}:/w:ro`, 'fx1-linux', 'sh', '-c', "du -sb /w | cut -f1; find /w -path /w/.git -prune -o -type f -print | wc -l; git -C /w log --oneline 2>/dev/null | wc -l"]);
const [bytes, files, commits] = (du.stdout || '').trim().split('\n').map(Number);
Object.assign(cell.meta, {
  end: nowIso(), durationSec: Math.round((Date.now() - cell.startMs) / 1000), status, calls: cell.calls.length, turnsTotal: cell.turnNo,
  modelServed: [...new Set(cell.calls.map(c => c.modelServed).filter(Boolean))], modelMismatch: cell.modelMismatch,
  usdReported: cell.totalUsd, usdByLabel: cell.costs, tokens: cell.tokensKnown ? cell.tokens : null, tokensNote: cell.tokensKnown ? 'reported by the adapter' : 'not available for at least one call',
  premiumEstimated: cell.calls.reduce((s, c) => s + (c.premium || 0), 0), premiumMultiplierKnown: cell.calls.every(c => c.premiumKnown !== false),
  outputBytes: bytes, outputFiles: files, outputCommits: commits, void: cell.void, base: cell.meta.base ?? null,
  head: git(cell.work, 'log', '--oneline').split('\n').slice(0, 60).join('\n') || 'NO GIT',
});
fs.writeFileSync(`${cell.logs}/meta.json`, JSON.stringify(cell.meta, null, 2));

// the checker: a SEPARATE container, the cell's output mounted read-only, never visible to the agent
if (status === 'FINISHED' && a.fixture && !process.env.FX_SKIP_CHECKER) {
  const code = runChecker({ paths, id: a.id, path: a.path, since: flowRes.since });
  console.log(a.id, 'done usd', cell.totalUsd.toFixed(2), 'calls', cell.calls.length, 'checker exit', code);
} else console.log(a.id, status, 'calls', cell.calls.length, cell.void ? JSON.stringify(cell.void) : '');
process.exit(exitCode);
