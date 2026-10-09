// push-results.mjs: copies finished cells and the stage files into a clone of the PRIVATE results repository, scans for secrets, commits on a
// branch named for the phase, and (with --push) pushes that branch. It refuses to push anywhere but a remote named genspec-experiment-results.
// usage: FX_ROOT=... FX_RESULTS=<clone of pragma-works/genspec-experiment-results> node push-results.mjs --phase phase3 --stage fx0d [--cells id1,id2] [--push] [--extra <dir>]
//   --phase  phase1 | phase2 | phase3 | phase4 | s0 ... (becomes the top folder and part of the branch name)
//   --stage  a label for this batch (becomes the second folder)
//   --cells  comma list of cell ids, or 'none' (default: every cell in FX_ROOT/cells that has logs/meta.json, no .void archives)
//   --match  a regular expression the cell id must match (for example '^critic-' for a phase 1 push)
//   --extra  a folder whose files are copied under <phase>/<stage>/extra/ (critiques, practitioner outputs, reports)
// Per cell it keeps: logs/ (raw turn outputs, meta.json, report.json, checker.out.txt), cfg/ (session transcripts, prompts, share files, otel; credential files removed),
// sandbox.bundle (git bundle of the produced project: keeps history, runs no hooks). The produced working tree itself is NOT copied (hooks written by a model).
import fs from 'node:fs';
import path from 'node:path';
import cp from 'node:child_process';
import { paths as getPaths, nowIso, norm } from './lib/config.mjs';
import { scan } from './scan-secrets.mjs';

const argv = process.argv.slice(2);
const opt = n => { const i = argv.indexOf('--' + n); return i < 0 ? undefined : argv[i + 1]; };
const phase = opt('phase'), stage = opt('stage');
if (!phase || !stage) { console.error('usage: node push-results.mjs --phase <p> --stage <s> [--cells a,b] [--extra dir] [--push]'); process.exit(2); }
const paths = getPaths({ noFormulas: true });
const dest = norm(process.env.FX_RESULTS);
if (!dest || !fs.existsSync(`${dest}/.git`)) { console.error('set FX_RESULTS to a clone of the private results repository (git clone https://github.com/pragma-works/genspec-experiment-results.git)'); process.exit(2); }
const git = (...a) => cp.spawnSync('git', ['-c', 'safe.directory=*', '-C', dest, ...a], { encoding: 'utf8' });
const origin = (git('remote', 'get-url', 'origin').stdout || '').trim();
if (argv.includes('--push') && !/genspec-experiment-results/.test(origin)) { console.error(`REFUSED: origin is "${origin}", not the private results repository. Results never go to the public protocol repository.`); process.exit(5); }

const day = new Date().toISOString().slice(0, 10).replace(/-/g, '');
const host = (process.env.COMPUTERNAME || process.env.HOSTNAME || 'pc').toLowerCase().replace(/[^a-z0-9]+/g, '-');
const branch = `${phase}-${stage}-${host}-${day}`;
const cur = (git('branch', '--show-current').stdout || '').trim();
if (cur !== branch) { const c = git('checkout', '-B', branch); if (c.status) { console.error(c.stderr); process.exit(1); } }

const root = `${dest}/${phase}/${stage}`; fs.mkdirSync(root, { recursive: true });
const all = fs.existsSync(paths.cells) ? fs.readdirSync(paths.cells).filter(n => !/\.void\d+$/.test(n) && fs.existsSync(`${paths.cells}/${n}/logs/meta.json`)) : [];
const rx = opt('match') ? new RegExp(opt('match')) : null;
const ids = opt('cells') === 'none' ? [] : opt('cells') ? opt('cells').split(',') : all.filter(n => !rx || rx.test(n));
const NOISE = new Set(['plugins', 'backups', 'skills', 'shell-snapshots', 'session-env', 'cache', 'plugin-cache', 'node_modules', 'telemetry', 'statsig']);
// skip credential-like files, account files (.claude.json holds account identifiers), and tool noise folders (huge or very long names); keep transcripts, prompts, share files, otel files, CLI logs
const skipCfg = f => { const parts = f.split(String.fromCharCode(92)).join('/').split('/'); const b = parts[parts.length - 1]; return /credential|\.pem$|id_rsa|auth\.json$|^\.claude\.json/i.test(b) || parts.some(x => NOISE.has(x)); };
for (const id of ids) {
  const src = `${paths.cells}/${id}`, d = `${root}/cells/${id}`;
  if (!fs.existsSync(src)) { console.log('missing cell', id); continue; }
  fs.mkdirSync(d, { recursive: true });
  fs.cpSync(`${src}/logs`, `${d}/logs`, { recursive: true });
  if (fs.existsSync(`${src}/cfg`)) fs.cpSync(`${src}/cfg`, `${d}/cfg`, { recursive: true, filter: s => !skipCfg(s) });
  if (fs.existsSync(`${src}/work/.git`)) { const b = cp.spawnSync('git', ['-c', 'safe.directory=*', '-C', `${src}/work`, 'bundle', 'create', `${d}/sandbox.bundle`, '--all'], { encoding: 'utf8' }); if (b.status) console.log('bundle failed for', id, b.stderr.trim().slice(0, 120)); }
  console.log('copied', id);
}
for (const f of ['ledger.jsonl', 'queue-state.json', 'drive.log', 'STOP', 'deviations.md', 'daily-log.md', 'failures.csv', 'spend.csv']) if (fs.existsSync(`${paths.root}/${f}`)) fs.cpSync(`${paths.root}/${f}`, `${root}/${f}`);
for (const f of fs.existsSync(paths.root) ? fs.readdirSync(paths.root) : []) if (/^schedule.*\.(csv|txt)$/.test(f)) fs.cpSync(`${paths.root}/${f}`, `${root}/${f}`);
if (fs.existsSync(`${paths.root}/console`)) fs.cpSync(`${paths.root}/console`, `${root}/console`, { recursive: true });
if (opt('extra')) fs.cpSync(opt('extra'), `${root}/extra`, { recursive: true, filter: s => !skipCfg(s) });
fs.writeFileSync(`${root}/PUSH-RECORD.json`, JSON.stringify({ at: nowIso(), phase, stage, branch, cells: ids, host, harnessCommit: (cp.spawnSync('git', ['-C', paths.repo, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout || '').trim() }, null, 2));

const hits = scan([root]);
if (hits.length) { for (const [f, n] of hits) console.log(`HIT ${f} (${n})`); console.error('V8 FAILED: nothing was committed. Remove the hits (and revoke the key if a real secret), then run again.'); process.exit(1); }
git('add', '-A');
const c = git('-c', 'user.name=' + (process.env.GIT_AUTHOR_NAME || 'fx-pc'), '-c', 'user.email=' + (process.env.GIT_AUTHOR_EMAIL || 'fx-pc@users.noreply.github.com'), 'commit', '-q', '-m', `results(${phase}/${stage}): ${ids.length} cell(s) from ${host}; V8 passed\n\nCo-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`);
console.log(c.status === 0 ? `committed on branch ${branch}` : 'nothing to commit: ' + (c.stdout || c.stderr).trim().split('\n')[0]);
if (argv.includes('--push')) { const p = git('push', '-u', 'origin', branch); console.log(p.status === 0 ? `pushed ${branch}` : 'PUSH FAILED: ' + p.stderr); process.exit(p.status ? 1 : 0); }
else console.log('not pushed (add --push)');
