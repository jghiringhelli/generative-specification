// gate-check.mjs: may a REGISTERED run start? (runbook gates G-2 and G-3, plus "FX-1.md says FROZEN")
// usage: node gate-check.mjs [--repo <protocol repo root>] [--formulas <formulas worktree root>]
// Exit 0 = allowed. Exit 5 = NOT allowed; the reasons are printed. The harness (run.mjs) calls the same code before any FIX-* fixture.
import cp from 'node:child_process';
import { gateCheck } from './lib/gate.mjs';
import { REPO_ROOT, norm } from './lib/config.mjs';

const argv = process.argv.slice(2);
const opt = n => { const i = argv.indexOf('--' + n); return i < 0 ? undefined : norm(argv[i + 1]); };
const repo = opt('repo') || REPO_ROOT;
const fdir = opt('formulas') || (process.env.FORMULA_DIR ? cp.spawnSync('git', ['-C', process.env.FORMULA_DIR, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).stdout.trim() : '');
const g = gateCheck({ repo, formulasRoot: fdir });
console.log('repo     :', repo);
console.log('formulas :', fdir || '(none given)');
console.log('tags     :', g.tags.join(' ') || '(none)');
console.log('REGISTERED RUN ALLOWED:', g.ok ? 'YES' : 'NO');
for (const r of g.reasons) console.log(' - ' + r);
process.exit(g.ok ? 0 : 5);
