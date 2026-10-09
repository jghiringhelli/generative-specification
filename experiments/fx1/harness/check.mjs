// check.mjs: (re-)run the checker on an existing cell, for example after a checker-environment hiccup (runbook section 13, UNDETERMINABLE: re-run once).
// usage: FX_ROOT=... TOOLS_DIR=... node check.mjs <cell id> <A|B|C> [--since <commit>] [--out report-r2.json]
import { paths as getPaths } from './lib/config.mjs';
import { runChecker } from './lib/check.mjs';
const [id, P] = process.argv.slice(2);
const opt = n => { const i = process.argv.indexOf('--' + n); return i < 0 ? undefined : process.argv[i + 1]; };
if (!id || !P) { console.error('usage: node check.mjs <cell id> <A|B|C> [--since commit] [--out name.json]'); process.exit(2); }
const paths = getPaths({ noFormulas: true }); paths.tools = (process.env.TOOLS_DIR || '').split(String.fromCharCode(92)).join('/');
const out = opt('out') || 'report-r2.json';
const code = runChecker({ paths, id, path: P, since: opt('since'), outName: out, txtName: out.replace(/\.json$/, '.out.txt') });
console.log('checker exit', code, '->', `${paths.cells}/${id}/logs/${out}`);
