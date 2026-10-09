// patch-harness.mjs: makes a COPY of the development harness run on another PC. NEW, review before use.
// usage: node patch-harness.mjs <path of run2.js> <path of the patched copy to write, e.g. run2-portable.js>
// Fails loudly if any expected line is missing (so a changed harness is never patched blindly).
import fs from 'node:fs';
const [src, dst] = process.argv.slice(2);
let t = fs.readFileSync(src, 'utf8');
const P = [
  ["const ROOT = 'C:/workspace/PragmaWorks/lab-runs/fx1-dev';", "const ROOT = (process.env.FX_ROOT || '').split(String.fromCharCode(92)).join('/'); if (!ROOT) throw new Error('set FX_ROOT to the run folder');"],
  ["const sync = () => cp.execFileSync('node', [ROOT + '/harness/sync-creds.js']);", "const sync = () => {}; // API-key auth: no OAuth copy"],
  ["  cp.execFileSync('node', [ROOT + '/harness/sync-creds.js']);\n", ""],
  ["'-e', 'CLAUDE_CONFIG_DIR=/cfg', '-w', '/work'", "'-e', 'CLAUDE_CONFIG_DIR=/cfg', '-e', 'ANTHROPIC_API_KEY', '-w', '/work'"],
  // a fresh configuration folder per run (FX-1.md section 5 step 1); its session transcripts are kept as evidence
  ["fs.mkdirSync(sandbox, { recursive: true }); fs.mkdirSync(logs, { recursive: true });", "fs.mkdirSync(sandbox, { recursive: true }); fs.mkdirSync(logs, { recursive: true }); fs.mkdirSync(ROOT + '/cfg/' + id, { recursive: true }); fs.chmodSync(ROOT + '/cfg/' + id, 0o777);"],
  ["`${ROOT}/claude-config:/cfg`", "`${ROOT}/cfg/${id}:/cfg`"],
  // the agent container sees the reference lock tool only, never the checker source
  ["'-v', `${TOOLS}:/tools:ro`, '-e', 'CLAUDE_CONFIG_DIR=/cfg'", "'-v', `${TOOLS}/gs-lock:/tools/gs-lock:ro`, '-e', 'CLAUDE_CONFIG_DIR=/cfg'"],
];
for (const [a, b] of P) { if (!t.includes(a)) { console.error('PATTERN NOT FOUND, harness differs from the expected version:\n' + a); process.exit(1); } t = t.split(a).join(b); }
fs.writeFileSync(dst, t);
console.log('wrote', dst, '; patches applied:', P.length);
