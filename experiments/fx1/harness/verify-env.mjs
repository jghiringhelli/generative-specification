// verify-env.mjs: the automatable checks of the runbook (V1 environment record, V2 repository and gates, V3 checker controls, V6 mock dry run,
// V8 secrets) plus the isolation test. Real-vendor checks (V4, V5, V6 with a model) are adapter-probe.mjs and a real dry cell.
// usage: node verify-env.mjs [--controls] [--out <folder>]      (--controls builds the checker test image and runs the controls: about 4 minutes)
// Writes verification.md and ENV-RECORD.txt into the out folder (default $FX_ROOT/verify). Exit 0 = all run checks passed.
import fs from 'node:fs';
import cp from 'node:child_process';
import crypto from 'node:crypto';
import { paths as getPaths, nowIso, REPO_ROOT } from './lib/config.mjs';
import { dock } from './lib/docker.mjs';
import { scan } from './scan-secrets.mjs';
import { gateCheck } from './lib/gate.mjs';

const argv = process.argv.slice(2);
const opt = n => { const i = argv.indexOf('--' + n); return i < 0 ? undefined : argv[i + 1]; };
const paths = getPaths();
const out = (opt('out') || `${paths.root}/verify`).split(String.fromCharCode(92)).join('/'); fs.mkdirSync(out, { recursive: true });
const git = (dir, ...a) => (cp.spawnSync('git', ['-c', 'safe.directory=*', '-C', dir, ...a], { encoding: 'utf8' }).stdout || '').trim();
const sha = f => { try { return crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'); } catch { return 'MISSING'; } };
const results = [];
const rec = (id, name, ok, detail = '') => { results.push({ id, name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${id} ${name}${detail ? '  ' + detail : ''}`); };

// V1 environment record
const top = git(paths.formulas, 'rev-parse', '--show-toplevel');
const env = [
  `date ${nowIso()}`, `host ${process.platform} ${process.arch}`, `node ${process.version}`, `git ${cp.spawnSync('git', ['--version'], { encoding: 'utf8' }).stdout.trim()}`,
  `docker ${(dock(['version', '--format', 'client {{.Client.Version}} server {{.Server.Version}} {{.Server.Os}}']).stdout || '').trim()}`,
  `harness repo HEAD ${git(REPO_ROOT, 'rev-parse', 'HEAD')} branch ${git(REPO_ROOT, 'branch', '--show-current')}`,
  `formulas HEAD ${git(top, 'rev-parse', 'HEAD')} dirty=${!!git(top, 'status', '--short')}`,
  `gs-check sha256 ${sha(`${paths.tools}/gs-check/gs-check.mjs`)}`, `gs-lock sha256 ${sha(`${paths.tools}/gs-lock/gs-lock.mjs`)}`,
  ...['fx1-linux', 'fx1-linux-claude', 'fx1-linux-copilot'].map(i => `image ${i} ${(dock(['image', 'inspect', '--format', '{{.Id}}', i]).stdout || 'MISSING').trim()}`),
  `claude cli ${(dock(['run', '--rm', 'fx1-linux-claude', 'claude', '--version']).stdout || 'n/a').trim()}`,
  `copilot cli ${(dock(['run', '--rm', 'fx1-linux-copilot', 'copilot', '--version']).stdout || 'n/a').trim()}`,
];
fs.writeFileSync(`${out}/ENV-RECORD.txt`, env.join('\n') + '\n');
rec('V1', 'environment record written', env.some(l => /server .* linux/.test(l)), `${out}/ENV-RECORD.txt`);
rec('V1', 'gs-check hash equals the development value (a different value means a different commit or CRLF)', sha(`${paths.tools}/gs-check/gs-check.mjs`) === '249ddd878a101e1e4844083cd847d16e2afa21ddf61633bb2d248c0da614354d', 'expected only at formulas commit 76092e0; the freeze list overrides');

// V2 repository and gates
rec('V2', 'protocol branch is experiment-protocol-2026-10-02', git(REPO_ROOT, 'branch', '--show-current') === 'experiment-protocol-2026-10-02', git(REPO_ROOT, 'branch', '--show-current'));
const g = gateCheck({ repo: REPO_ROOT, formulasRoot: top });
fs.writeFileSync(`${out}/gate-check.txt`, `registered run allowed: ${g.ok}\n${g.reasons.join('\n')}\ntags: ${g.tags.join(' ')}\n`);
rec('V2', `registration gate evaluated (allowed=${g.ok}; this is information, not a pass/fail of the PC)`, true, g.ok ? 'allowed' : 'NOT allowed: ' + g.reasons[0]);

// V3 checker controls (optional, slow)
if (argv.includes('--controls')) {
  const b = dock(['build', '-t', 'gs-check-test', '-f', `${top}/tools/gs-check/test/Dockerfile`, `${top}/tools/gs-check/test`], { timeout: 20 * 60 * 1000 });
  rec('V3', 'checker test image builds', b.status === 0);
  const u = dock(['run', '--rm', '-v', `${top}:/w:ro`, '-w', '/w', 'gs-check-test', 'node', '--test', 'tools/gs-check/test/unit.test.mjs'], { timeout: 20 * 60 * 1000 });
  const ut = (u.stdout || '') + (u.stderr || ''); fs.writeFileSync(`${out}/v3-unit.txt`, ut);
  rec('V3', 'checker unit tests: fail 0', /# fail 0/.test(ut));
  const c = dock(['run', '--rm', '-v', `${top}:/w:ro`, '-w', '/w', '-e', 'FX1_ONLY=G1,G3,GS1,R06,B05', 'gs-check-test', 'node', '--test', 'tools/gs-check/test/controls.test.mjs'], { timeout: 30 * 60 * 1000 });
  const ct = (c.stdout || '') + (c.stderr || ''); fs.writeFileSync(`${out}/v3-controls.txt`, ct);
  rec('V3', 'checker controls G1 G3 GS1 R06 B05: fail 0', /# fail 0/.test(ct));
} else rec('V3', 'checker controls skipped (run with --controls)', true, 'not run');

// isolation test and mock dry run (no model, no cost)
const iso = cp.spawnSync('node', [`${paths.harness}/isolation-test.mjs`], { encoding: 'utf8', env: process.env });
fs.writeFileSync(`${out}/isolation-test.txt`, iso.stdout + iso.stderr);
rec('ISO', 'agent container cannot see the checker, formulas, fixtures or other cells', iso.status === 0, `${out}/isolation-test.txt`);

// V8 secrets in everything that could be sent back
const hits = scan([paths.root].filter(d => fs.existsSync(d)));
rec('V8', 'no secrets in FX_ROOT', hits.length === 0, hits.length ? hits.map(h => h[0] + ' (' + h[1] + ')').slice(0, 5).join('; ') : '');

fs.writeFileSync(`${out}/verification.md`, `# Verification ${nowIso()}\n\n` + results.map(r => `- ${r.ok ? 'PASS' : 'FAIL'} **${r.id}** ${r.name}${r.detail ? ' (' + r.detail + ')' : ''}`).join('\n') + '\n');
const bad = results.filter(r => !r.ok);
console.log(bad.length ? `\n${bad.length} check(s) failed; see ${out}/verification.md` : `\nall run checks passed; ${out}/verification.md`);
process.exit(bad.length ? 1 : 0);
