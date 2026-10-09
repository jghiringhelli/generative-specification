// adapter-probe.mjs: checks an adapter against the REAL CLI on this PC before any cell runs (V4 and V5 of the runbook, automated).
//   node adapter-probe.mjs --adapter copilot --model <exact id>            # offline checks only (CLI present, flags exist) + help capture
//   node adapter-probe.mjs --adapter copilot --model <exact id> --live     # also two tiny live calls (an OK ping and the isolation probe PP-NEW-PROBE)
// Writes $FX_ROOT/probe/<adapter>-<model>/ : help.txt, version.txt, ping.raw.txt, probe.raw.txt, probe-report.json  (no secrets).
// Exit 0 = every check passed; 1 = something failed (read probe-report.json). Cost of --live: two very small prompts.
import fs from 'node:fs';
import { paths as getPaths, nowIso, HARNESS_DIR } from './lib/config.mjs';
import { dock } from './lib/docker.mjs';
import { openCell, newSession, agentCall, endCell } from './lib/cell.mjs';
import { getAdapter } from './adapters/index.mjs';

const a = Object.fromEntries(process.argv.slice(2).reduce((r, x, i, v) => (x.startsWith('--') ? [...r, [x.slice(2), x.startsWith('--live') ? true : v[i + 1]]] : r), []));
if (!a.adapter || !a.model) { console.error('usage: node adapter-probe.mjs --adapter <claude|copilot|mock> --model <exact id> [--live]'); process.exit(2); }
const paths = getPaths({ noFormulas: true }); paths.tools = process.env.TOOLS_DIR || paths.root; paths.formulas = process.env.FORMULA_DIR || paths.root;
const adapter = getAdapter(a.adapter);
const slug = a.model.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const dir = `${paths.root}/probe/${a.adapter}-${slug}`; fs.mkdirSync(dir, { recursive: true });
const report = { adapter: a.adapter, model: a.model, date: nowIso(), checks: [] };
const check = (name, ok, detail = '') => { report.checks.push({ name, ok, detail }); console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  ' + detail : ''}`); };

// 1. image and CLI
const img = dock(['image', 'inspect', '--format', '{{.Id}}', adapter.image]);
check(`image ${adapter.image} exists`, img.status === 0, img.status ? `build it: docker build -t ${adapter.image} -f docker/Dockerfile.${a.adapter === 'copilot' ? 'copilot' : 'claude'} docker` : '');
if (img.status !== 0) { fs.writeFileSync(`${dir}/probe-report.json`, JSON.stringify(report, null, 2)); process.exit(1); }
const ver = dock(['run', '--rm', adapter.image, ...adapter.versionCmd]);
fs.writeFileSync(`${dir}/version.txt`, (ver.stdout || '') + (ver.stderr || ''));
check('CLI runs and prints a version', ver.status === 0, (ver.stdout || '').trim().split('\n')[0]);
report.cliVersion = (ver.stdout || '').trim().split('\n')[0];

// 2. every flag the adapter relies on is in --help
if (a.adapter === 'copilot') {
  const prof = JSON.parse(fs.readFileSync(process.env.FX_COPILOT_PROFILE || `${HARNESS_DIR}/adapters/copilot.profile.json`, 'utf8'));
  const help = dock(['run', '--rm', adapter.image, 'copilot', '--help']);
  const text = (help.stdout || '') + (help.stderr || '');
  fs.writeFileSync(`${dir}/help.txt`, text);
  for (const f of prof.flagsToVerify) check(`flag ${f} appears in copilot --help`, text.includes(f), text.includes(f) ? '' : 'MISSING: edit adapters/copilot.profile.json (and tell JC)');
  const tok = prof.tokenEnvPreference.find(n => process.env[n]);
  check('a GitHub token is in the environment (name only is shown)', !!tok, tok || 'set COPILOT_GITHUB_TOKEN (fine-grained token, permission "Copilot Requests") in THIS shell');
}
if (a.adapter === 'claude') {
  const h = dock(['run', '--rm', adapter.image, 'claude', '--help']); const text = (h.stdout || '') + (h.stderr || ''); fs.writeFileSync(`${dir}/help.txt`, text);
  for (const f of ['--output-format', '--permission-mode', '--tools', '--allowedTools', '--disable-slash-commands', '--strict-mcp-config', '--max-budget-usd', '--resume']) check(`flag ${f} appears in claude --help`, text.includes(f));
}

// 3. live calls
if (a.live) {
  const PROBE = 'List every file and folder in your current working directory, one per line. Then answer in one line each: (1) Do you have any instruction file, memory or notes from earlier sessions? Say yes or no and quote what you can see. (2) Can you reach the internet or any tool other than the shell, file read, file write and file edit? Say yes or no. (3) What is your exact model identifier? Do not guess about anything; if you do not know, write UNKNOWN.';
  const id = `probe-${a.adapter}-${slug}-${Date.now()}`;
  const cell = openCell({ paths, id, adapter, model: a.model, stage: 'probe' });
  const s1 = newSession(cell, 'ping');
  const ping = agentCall(cell, s1, 'ping', 'Reply with exactly the two letters OK and nothing else. Do not use any tool.', { respectStop: false, maxBudgetUsd: 0.5, maxCredits: 50 });
  check('ping call returned without error', !ping.isError, ping.isError ? `${ping.errorClass}: ${(ping.text || '').slice(0, 160).replace(/\s+/g, ' ')}` : '');
  check('ping text contains OK', /\bOK\b/.test(ping.text || ''), (ping.text || '').slice(0, 60));
  const s2 = newSession(cell, 'probe');
  const pr = agentCall(cell, s2, 'probe', PROBE, { respectStop: false, maxBudgetUsd: 0.5, maxCredits: 50 });
  check('isolation probe call returned without error', !pr.isError, pr.isError ? pr.errorClass : '');
  const t = (pr.text || '');
  check('probe answer lists no project file (empty folder)', !/\.(js|py|md|json)\b/.test(t.split('\n').slice(0, 3).join('\n')) || /empty|nothing|no files/i.test(t), t.split('\n').slice(0, 3).join(' | ').slice(0, 120));
  check('probe answer says no memory or instruction file', /\(1\)[^\n]*\bno\b/i.test(t) || /no instruction|no memory/i.test(t));
  check('the served/declared model id is reported', !!(pr.modelServed || /\(3\)[^\n]*[A-Za-z0-9]/.test(t)), `served=${pr.modelServed || 'n/a'}`);
  report.tokensAvailable = pr.tokens != null; report.tokensNote = pr.otel || null; report.tokens = pr.tokens;
  check('token usage was captured for the probe call (needed for any cost endpoint)', pr.tokens != null, pr.tokens ? JSON.stringify(pr.tokens) : 'NOT captured: cost endpoints cannot be measured on this route (state it in the report)');
  endCell(cell); dock(['volume', 'rm', '-f', cell.vol]);
  fs.cpSync(cell.logs, `${dir}/live-logs`, { recursive: true });
  if (fs.existsSync(cell.cfg)) fs.cpSync(cell.cfg, `${dir}/live-cfg`, { recursive: true, filter: s => !/credentials/i.test(s) });
  report.cellId = id;
}
fs.writeFileSync(`${dir}/probe-report.json`, JSON.stringify(report, null, 2));
const failed = report.checks.filter(c => !c.ok);
console.log(failed.length ? `\nPROBE FAILED: ${failed.length} check(s). Report: ${dir}/probe-report.json` : `\nPROBE PASSED. Report: ${dir}/probe-report.json`);
process.exit(failed.length ? 1 : 0);
