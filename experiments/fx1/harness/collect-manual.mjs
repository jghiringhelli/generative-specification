// collect-manual.mjs: ingests the folder produced by a manual editor-agent run as a cell, writes its meta.json, and runs the checker.
// usage: FX_ROOT=... TOOLS_DIR=... node collect-manual.mjs --id <id> --from <folder> --model "<exact id>" --path A|B --fixture <key> [--base <commit>] [--notes "..."]
import fs from 'node:fs';
import cp from 'node:child_process';
import { paths as getPaths, nowIso, norm } from './lib/config.mjs';
import { dock } from './lib/docker.mjs';
import { runChecker } from './lib/check.mjs';
const a = Object.fromEntries(process.argv.slice(2).reduce((r, x, i, v) => (x.startsWith('--') ? [...r, [x.slice(2), v[i + 1]]] : r), []));
for (const k of ['id', 'from', 'model', 'path', 'fixture']) if (!a[k]) { console.error('missing --' + k); process.exit(2); }
const paths = getPaths({ noFormulas: true }); paths.tools = norm(process.env.TOOLS_DIR);
const dir = `${paths.cells}/${a.id}`;
if (fs.existsSync(dir)) { console.error('cell exists'); process.exit(1); }
fs.mkdirSync(`${dir}/logs`, { recursive: true });
fs.cpSync(a.from, `${dir}/work`, { recursive: true });
const g = (...x) => (cp.spawnSync('git', ['-c', 'safe.directory=*', '-C', `${dir}/work`, ...x], { encoding: 'utf8' }).stdout || '').trim();
const isRepo = fs.existsSync(`${dir}/work/.git`);
const meta = { id: a.id, stage: a.id.split('-')[0], path: a.path, fixture: a.fixture, adapter: 'copilot-vscode-manual', route: 'manual', modelAsked: a.model, modelServed: [a.model + ' (as shown by the picker)'], start: null, end: nowIso(), status: isRepo ? 'FINISHED' : 'NOT-A-REPO', host: process.platform, notes: a.notes || '', base: a.base || null, head: g('log', '--oneline'), tokens: null, usdReported: null, premiumEstimated: null, caveat: 'built on the host by an editor agent: Windows line endings and non-executable hooks may be flagged by the Linux checker; no spend data; never pool with CLI runs' };
fs.writeFileSync(`${dir}/logs/meta.json`, JSON.stringify(meta, null, 2));
if (isRepo) { const code = runChecker({ paths, id: a.id, path: a.path, since: a.base }); console.log(a.id, 'collected; checker exit', code); } else console.log(a.id, 'collected; NOT a git repository: no checker run');
