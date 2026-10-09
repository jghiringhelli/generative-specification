// setup.mjs: one-time (idempotent) preparation of the second PC. Run from anywhere inside the clone:
//   node experiments/other-pc/setup.mjs [--work <folder>] [--no-claude-image]
// It checks the tools, resolves and prints the repository root, creates the formulas work tree, clones the PRIVATE results repository,
// builds the container images, and writes env.ps1 and env.sh (paths and caps only, NO secrets) into the work folder.
// It never reads or writes a key. The GitHub token for the Copilot CLI is set by YOU in the shell window (see README.md, step 2).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import cp from 'node:child_process';
import { fileURLToPath } from 'node:url';

const BS = String.fromCharCode(92);
const norm = p => p.split(BS).join('/');
const REPO = norm(path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..'));
const argv = process.argv.slice(2);
const opt = n => { const i = argv.indexOf('--' + n); return i < 0 ? undefined : argv[i + 1]; };
const WORK = norm(path.resolve(opt('work') || path.join(os.homedir(), 'fx1')));
const sh = (cmd, args, o = {}) => cp.spawnSync(cmd, args, { encoding: 'utf8', ...o });
let problems = 0;
const say = (ok, msg) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) problems++; };

console.log(`REPO=${REPO}`);
console.log(`WORK=${WORK}`);
if (/\s/.test(WORK)) say(false, 'the work folder path contains a space; choose one without (use --work)');
fs.mkdirSync(WORK, { recursive: true });

const top = sh('git', ['-C', REPO, 'rev-parse', '--show-toplevel']);
say(top.status === 0, 'git works and REPO is a clone');
const branch = sh('git', ['-C', REPO, 'branch', '--show-current']).stdout.trim();
say(branch === 'experiment-protocol-2026-10-02', `branch is ${branch || '(none)'} (must be experiment-protocol-2026-10-02)`);
console.log('HEAD ' + sh('git', ['-C', REPO, 'rev-parse', 'HEAD']).stdout.trim());
const nodeMajor = Number(process.versions.node.split('.')[0]);
say(nodeMajor >= 22, `node ${process.version} (22 or newer)`);
const dv = sh('docker', ['version', '--format', '{{.Server.Os}} {{.Server.Version}}']);
say(dv.status === 0 && /linux/.test(dv.stdout), `docker with Linux containers: ${(dv.stdout || dv.stderr).trim().split(String.fromCharCode(10))[0]}`);
if (problems) { console.log('\nFix the lines marked FAIL and run this again.'); process.exit(1); }

sh('git', ['-C', REPO, 'config', 'core.longpaths', 'true']);
console.log('\n== fetching branches and tags');
sh('git', ['-C', REPO, 'fetch', '--all', '--tags', '--quiet'], { stdio: 'inherit' });
const tags = sh('git', ['-C', REPO, 'tag', '--list']).stdout.trim() || '(none)';
console.log('tags: ' + tags);

console.log('\n== formulas work tree (branch formulas-2026-10-05, detached)');
const FORM = `${WORK}/formulas`;
if (!fs.existsSync(`${FORM}/docs/formulas/greenfield.md`)) {
  const r = sh('git', ['-C', REPO, 'worktree', 'add', '--detach', FORM, 'origin/formulas-2026-10-05'], { stdio: 'inherit' });
  say(r.status === 0, 'formulas work tree created');
} else say(true, 'formulas work tree exists');
console.log('formulas HEAD ' + sh('git', ['-C', FORM, 'rev-parse', 'HEAD']).stdout.trim() + ' (ask JC for the commit to use if he named one)');

console.log('\n== private results repository clone');
const RES = `${WORK}/results`;
if (!fs.existsSync(`${RES}/.git`)) {
  const r = sh('git', ['clone', 'https://github.com/pragma-works/genspec-experiment-results.git', RES], { stdio: 'inherit' });
  say(r.status === 0, 'results repository cloned (needs your GitHub login with access to pragma-works; if it fails, run `gh auth login` first)');
} else say(true, 'results repository clone exists');
sh('git', ['-C', RES, 'config', 'core.longpaths', 'true']);
const origin = sh('git', ['-C', RES, 'remote', 'get-url', 'origin']).stdout.trim();
say(/genspec-experiment-results/.test(origin), `results origin is ${origin}`);

console.log('\n== container images (first build takes several minutes)');
const H = `${REPO}/experiments/fx1/harness`;
const build = (tag, file) => { const r = sh('docker', ['build', '-t', tag, '-f', `${H}/docker/${file}`, `${H}/docker`], { stdio: 'inherit' }); say(r.status === 0, `image ${tag}`); };
build('fx1-linux', 'Dockerfile');
build('fx1-linux-copilot', 'Dockerfile.copilot');
if (!argv.includes('--no-claude-image')) build('fx1-linux-claude', 'Dockerfile.claude');

console.log('\n== environment files (paths and caps only; no secrets)');
const FXR = `${WORK}/run`; fs.mkdirSync(FXR, { recursive: true });
const vars = { FX_WORK: WORK, FX_ROOT: FXR, FORMULA_DIR: `${FORM}/docs/formulas`, TOOLS_DIR: `${FORM}/tools`, FX_RESULTS: RES };
const caps = { FX_CAP_CALLS: '600', FX_CAP_HOURS: '30', FX_SOFT: '0.8' };
const ps = Object.entries({ ...vars, ...caps }).map(([k, v]) => `$env:${k} = '${v}'`).join(String.fromCharCode(13, 10)) + String.fromCharCode(13, 10) + "# FX_CAP_PREMIUM / FX_CAP_CREDITS / FX_CAP_USD: set them from YOUR plan (README step 3). No token here: set COPILOT_GITHUB_TOKEN in the shell (README step 2)." + String.fromCharCode(13, 10);
const sx = Object.entries({ ...vars, ...caps }).map(([k, v]) => `export ${k}='${v}'`).join('\n') + '\n# FX_CAP_PREMIUM / FX_CAP_CREDITS / FX_CAP_USD: set them from YOUR plan (README step 3). No token here: set COPILOT_GITHUB_TOKEN in the shell (README step 2).\n';
fs.writeFileSync(`${WORK}/env.ps1`, ps); fs.writeFileSync(`${WORK}/env.sh`, sx);
console.log(`wrote ${WORK}/env.ps1 and ${WORK}/env.sh`);
console.log(problems ? `\n${problems} problem(s): fix them and run again.` : '\nSETUP DONE. Next: README step 2 (token), then step 3 (start Copilot with the master prompt).');
process.exit(problems ? 1 : 0);
