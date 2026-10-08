#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Juan Carlos Ghiringhelli, PragmaWorks (licence text in ../LICENSE; provided "AS IS", without warranty).
//
// gs-init: a one-command installer for the Generative Specification substrate. ONE file, Node 18+, no dependencies, no model, no network.
// Status: design, installer tested on throwaway projects (tools/gs-init/test); not yet in a registered run. See README.md.
//
// Usage (in the project folder, the git top level):
//   node gs-init.mjs [--level L0|L1|L2] [--dry-run] [--sentinel CLAUDE.md|AGENTS.md] [--tools <folder>] [--no-proof] [--pubkey <file>] [--root <dir>]
//
// The levels are the scale-adaptive depth (docs/practice/scale-adaptive-depth.md, docs/practice/agent-commit-marking.md):
//   L0  the sentinel and three small documents (spec, decisions, open questions), and the trailer convention. Nothing runs by itself.
//   L1  L0 plus gates and git hooks (spec shape, open questions, ratchet floor, typed commit messages, your tests) and the ratchet. (default)
//   L2  L1 plus gs-decide wired (ratifications, agent-commit marking) and a CI re-check. Signing starts when you give --pubkey.
// What it never does: overwrite a file of yours without a backup (.gs-init-backup/<stamp>/), edit your code, commit, push, or call a network.
// A file that already exists and that is yours (the spec, a decision record) is kept as it is. A sentinel, a README, a hook or .gs.json that
// already exists gets a marked block added (or a key merged), after a backup, and your content stays. Running it again changes nothing.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const VERSION = '0.1.0';
const REPO_URL = 'https://github.com/jghiringhelli/generative-specification';
const LEVELS = ['L0', 'L1', 'L2'];
const TOOL_FILES = {
  'gs-check': ['gs-check.mjs'],
  'gs-lock': ['gs-lock.mjs', 'gs-cochange.mjs', 'gs-redproof.mjs'],
  'gs-decide': ['gs-decide.mjs', 'gs-decide-hook.mjs', 'gs-attribution-hook.mjs', 'gs-decide-ci.mjs'],
};
// Items of the substrate checklist that gs-check must credit in strict mode, per level (what this installer claims; the rest is stated as absent).
const CLAIMED = { L0: ['E01', 'E02', 'E03'], L1: ['E01', 'E02', 'E03', 'E06', 'E07'], L2: ['E01', 'E02', 'E03', 'E06', 'E07'] };

const out = s => process.stdout.write(s + '\n');
const die = (s, code = 2) => { process.stderr.write('gs-init: ' + s + '\n'); process.exit(code); };

export function parseArgs(argv) {
  const a = { level: 'L1', dryRun: false, sentinel: null, tools: null, proof: true, verbose: false, pubkey: null, root: process.cwd(), help: false };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i], v = () => { if (i + 1 >= argv.length) die(`${k} needs a value`); return argv[++i]; };
    if (k === '--level') a.level = v().toUpperCase();
    else if (k === '--dry-run') a.dryRun = true;
    else if (k === '--sentinel') a.sentinel = v();
    else if (k === '--tools') a.tools = path.resolve(v());
    else if (k === '--no-proof') a.proof = false;
    else if (k === '--verbose') a.verbose = true;
    else if (k === '--pubkey') a.pubkey = path.resolve(v());
    else if (k === '--root') a.root = path.resolve(v());
    else if (k === '--help' || k === '-h') a.help = true;
    else die(`unknown option ${k} (try --help)`);
  }
  if (!LEVELS.includes(a.level)) die(`--level must be L0, L1 or L2 (got ${a.level})`);
  if (a.sentinel && !['CLAUDE.md', 'AGENTS.md'].includes(a.sentinel)) die('--sentinel must be CLAUDE.md or AGENTS.md');
  return a;
}

// ---------------------------------------------------------------- git and files
const git = (root, args, input) => spawnSync('git', args, { cwd: root, encoding: 'utf8', input });
const exists = (root, rel) => fs.existsSync(path.join(root, rel));
const read = (root, rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const unbom = s => s.replace(/^﻿/, '');
const posix = p => p.split(path.sep).join('/');
const onPath = cmd => spawnSync(cmd, ['--version'], { encoding: 'utf8' }).status === 0;

// ---------------------------------------------------------------- stack detection
export function detectStack(root) {
  const has = rel => exists(root, rel);
  const ls = (rel = '.') => { try { return fs.readdirSync(path.join(root, rel)); } catch { return []; } };
  const found = [];
  if (has('package.json')) found.push('node');
  if (['pyproject.toml', 'requirements.txt', 'setup.py', 'setup.cfg', 'Pipfile'].some(has) || ls().some(f => /^requirements.*\.txt$/.test(f))) found.push('python');
  if (has('go.mod')) found.push('go');
  const dn = f => /\.(sln|csproj|fsproj|vbproj)$/.test(f);
  if (ls().some(dn) || ls().some(d => { try { return fs.statSync(path.join(root, d)).isDirectory() && !d.startsWith('.') && d !== 'node_modules' && ls(d).some(dn); } catch { return false; } })) found.push('dotnet');
  return { stack: found[0] || 'other', also: found.slice(1) };
}

// The test command written into .gs.json gate.test, only when it can be recognised AND the tool is on this machine. Never invented.
export function detectTestCommand(root, stack) {
  if (stack === 'node') {
    try { const t = JSON.parse(unbom(read(root, 'package.json'))).scripts?.test; if (t && !/no test specified/i.test(t)) return 'npm test'; } catch { /* unreadable package.json */ }
    return null;
  }
  if (stack === 'python') {
    for (const py of ['python', 'python3']) if (onPath(py) && spawnSync(py, ['-m', 'pytest', '--version'], { encoding: 'utf8' }).status === 0) return py + ' -m pytest -q';
    return null;
  }
  if (stack === 'go') return onPath('go') ? 'go test ./...' : null;
  if (stack === 'dotnet') return onPath('dotnet') ? 'dotnet test' : null;
  return null;
}

// ---------------------------------------------------------------- the generated gate (real code, embedded with toString)
// It is written to scripts/gs-gate.mjs in the project. Runs with Node 18+, no dependencies. Commands: spec open ratchet [--init|--raise] test
// commit-msg <file> pre-commit pre-push all. Reads .gs.json: { stack, gate: { test } }.
function gateProgram() {
  const root = process.env.GS_ROOT || process.cwd();
  const cmd = process.argv[2] || 'all', arg = process.argv[3];
  const fail = m => { console.error('gs-gate: ' + m); process.exit(1); };
  const rd = rel => fs.readFileSync(path.join(root, rel), 'utf8').replace(/^﻿/, '').replace(/\r/g, '');
  const ex = rel => fs.existsSync(path.join(root, rel));
  const jr = rel => { try { return JSON.parse(rd(rel)); } catch { return null; } };
  const cfg = jr('.gs.json') || {};
  const SKIP = /^(node_modules|\.git|\.gs-init-backup|vendor|dist|build|bin|obj|target|\.venv|venv|__pycache__|coverage|tools)$/;
  const walk = (rel, filter, acc = []) => {
    let es = []; try { es = fs.readdirSync(path.join(root, rel), { withFileTypes: true }); } catch { return acc; }
    for (const e of es) { const p = rel ? rel + '/' + e.name : e.name; if (e.isDirectory()) { if (!SKIP.test(e.name)) walk(p, filter, acc); } else if (filter(p)) acc.push(p); }
    return acc;
  };
  const REQ = /^#{1,6} +\**([FN]-\d{3})(?!\.\d)/, CRIT = /^[ >|*_[xX-]*\**([FN]-\d{3}\.\d+)/;
  const specFiles = () => walk('docs/spec', p => p.endsWith('.md'));
  const criteria = () => { const ids = []; for (const f of specFiles()) for (const l of rd(f).split('\n')) { const m = l.match(CRIT); if (m && /verified by:/i.test(l)) ids.push(m[1]); } return ids; };

  const spec = () => {
    if (!ex('docs/spec/SPEC.md')) fail('docs/spec/SPEC.md is missing');
    const reqs = new Set(), crits = new Set(), seen = new Set();
    for (const f of specFiles()) for (const [i, l] of rd(f).split('\n').entries()) {
      const r = l.match(REQ); if (r) reqs.add(r[1]);
      const c = l.match(CRIT); if (!c) continue;
      if (!/\b(MUST|SHOULD|MAY|DEBE|DEBERÍA|PUEDE)\b/.test(l)) fail(f + ':' + (i + 1) + ': criterion ' + c[1] + ' has no MUST, SHOULD or MAY');
      if (!/verified by:/i.test(l)) fail(f + ':' + (i + 1) + ': criterion ' + c[1] + ' has no "verified by:"');
      if (seen.has(c[1])) fail(f + ':' + (i + 1) + ': criterion id ' + c[1] + ' is defined twice (ids are never reused)');
      seen.add(c[1]); crits.add(c[1].split('.')[0]);
    }
    if (!reqs.size) fail('no requirement heading with an id (## F-001 ...) in docs/spec');
    for (const r of reqs) if (!crits.has(r)) fail('requirement ' + r + ' has no criterion (a list line starting F-nnn.n)');
  };
  const open = () => {
    const files = [...specFiles(), ...(ex('docs/open-questions.md') ? ['docs/open-questions.md'] : [])];
    for (const f of files) for (const [i, l] of rd(f).split('\n').entries()) if (/^\s*(?:[-*]\s*)?OPEN:/.test(l)) fail(f + ':' + (i + 1) + ': an open question blocks the work: ' + l.trim());
  };
  const TESTRE = {
    node: /^\s*(?:test|it)(?:\.\w+)*\s*\(/gm, python: /^\s*(?:async\s+)?def\s+test_/gm, go: /^func\s+Test\w+/gm,
    dotnet: /\[\s*(?:Fact|Theory|Test|TestCase|TestMethod)\b/g,
  };
  const isTestFile = p => /(^|\/)(tests?|__tests__|spec)\//i.test(p) || /(\.|_)(test|spec)\.[a-z]+$/i.test(p) || /(^|\/)test_[^/]*\.py$/.test(p) || /Tests?\.cs$/.test(p);
  const measure = () => {
    const re = TESTRE[cfg.stack] ? [TESTRE[cfg.stack]] : Object.values(TESTRE);
    let n = 0;
    for (const f of walk('', p => isTestFile(p) && /\.(m?[jt]sx?|cjs|py|go|cs)$/.test(p))) { const t = rd(f); for (const r of re) n += (t.match(r) || []).length; }
    return { tests: n, criteria: criteria().length };
  };
  const ratchet = () => {
    const cur = measure();
    if (arg === '--init') {
      if (ex('docs/baseline.json')) return console.log('gs-gate: docs/baseline.json already exists; floors unchanged');
      fs.mkdirSync(path.join(root, 'docs'), { recursive: true });
      fs.writeFileSync(path.join(root, 'docs/baseline.json'), JSON.stringify({ floors: cur, ceilings: {} }, null, 2) + '\n');
      return console.log('gs-gate: docs/baseline.json created with floors ' + JSON.stringify(cur));
    }
    const b = jr('docs/baseline.json'); if (!b || typeof b.floors !== 'object') fail('docs/baseline.json is missing or not {"floors": {...}, "ceilings": {...}}');
    if (arg === '--raise') {
      for (const k of Object.keys(cur)) b.floors[k] = Math.max(b.floors[k] || 0, cur[k]);
      fs.writeFileSync(path.join(root, 'docs/baseline.json'), JSON.stringify(b, null, 2) + '\n');
      return console.log('gs-gate: floors raised to ' + JSON.stringify(b.floors));
    }
    for (const k of Object.keys(b.floors)) if ((cur[k] ?? 0) < b.floors[k]) fail('ratchet: ' + k + ' is ' + (cur[k] ?? 0) + ', below the floor ' + b.floors[k] + ' (raise the number with real tests or specs; never lower the floor)');
    for (const k of Object.keys(b.ceilings || {})) if ((cur[k] ?? 0) > b.ceilings[k]) fail('ratchet: ' + k + ' is ' + cur[k] + ', above the ceiling ' + b.ceilings[k]);
    const head = cp.spawnSync('git', ['show', 'HEAD:docs/baseline.json'], { cwd: root, encoding: 'utf8' });
    if (head.status === 0) {
      let old = null; try { old = JSON.parse(head.stdout.replace(/^﻿/, '')); } catch { /* old file unreadable */ }
      for (const k of Object.keys((old && old.floors) || {})) if ((b.floors[k] ?? 0) < old.floors[k]) fail('ratchet: floor ' + k + ' was lowered from ' + old.floors[k] + ' to ' + (b.floors[k] ?? 0) + '; the floor only goes up');
      for (const k of Object.keys((old && old.ceilings) || {})) if (!(k in (b.ceilings || {})) || b.ceilings[k] > old.ceilings[k]) fail('ratchet: ceiling ' + k + ' was raised or removed; the ceiling only goes down');
    }
  };
  const test = () => {
    const c = cfg.gate && cfg.gate.test; if (!c) return console.log('gs-gate: no test command set (gate.test in .gs.json); tests not run');
    const env = Object.assign({}, process.env); delete env.NODE_TEST_CONTEXT;
    const r = cp.spawnSync(c, { cwd: root, shell: true, stdio: 'inherit', env });
    if (r.status !== 0) fail('tests failed: ' + c);
  };
  const commitMsg = () => {
    if (!arg) fail('commit-msg needs the message file');
    const subject = rd(arg).split('\n').find(l => l.trim() && !l.startsWith('#')) || '';
    if (/^(Merge|Revert|fixup!|squash!)\b/.test(subject)) return;
    if (!/^(feat|fix|docs|refactor|test|chore|build|ci|perf|style|revert)(\([^)]+\))?!?: \S.{2,}/.test(subject)) fail('the commit subject must read "type: what changed" (feat fix docs refactor test chore build ci perf style revert). Got: ' + subject);
  };
  const cheap = () => { spec(); open(); ratchet(); };
  const table = { spec, open, ratchet, test, 'commit-msg': commitMsg, 'pre-commit': () => { cheap(); test(); }, 'pre-push': () => { cheap(); test(); }, all: () => { cheap(); test(); } };
  if (!table[cmd]) fail('unknown command ' + cmd + ' (spec open ratchet test commit-msg pre-commit pre-push all)');
  table[cmd]();
  if (cmd !== 'commit-msg' && !['--init', '--raise'].includes(arg)) console.log('gs-gate: ' + cmd + ' ok');
}
const GATE_FILE = '#!/usr/bin/env node\n// gs-init: generated file (MIT). Regenerated by `node tools/gs-init/gs-init.mjs`; your edits are backed up before it is replaced.\n' +
  '// The project gates: spec shape, open questions, ratchet floor, typed commit messages, your test command. No dependencies, no model.\n' +
  "import fs from 'node:fs';\nimport path from 'node:path';\nimport cp from 'node:child_process';\n(" + gateProgram.toString().replace(/^function gateProgram\(\)/, 'function ()') + ')();\n';

const HOOKS_FILE = '#!/usr/bin/env node\n// gs-init: generated file (MIT). Points git at the hooks folder named in .gs.json (hooks). Run once after a fresh clone.\n' +
  "import fs from 'node:fs';\nimport path from 'node:path';\nimport cp from 'node:child_process';\n(function () {\n" +
  "  const root = process.env.GS_ROOT || process.cwd();\n  let dir = '.githooks'; try { dir = JSON.parse(fs.readFileSync(path.join(root, '.gs.json'), 'utf8').replace(/^\\uFEFF/, '')).hooks || dir; } catch { /* default */ }\n" +
  "  if (!fs.existsSync(path.join(root, '.git'))) { console.log('install-hooks: not a git checkout; nothing to do'); return; }\n" +
  "  const d = path.join(root, dir); if (fs.existsSync(d)) for (const f of fs.readdirSync(d)) { try { fs.chmodSync(path.join(d, f), 0o755); } catch { /* not allowed on this file system */ } }\n" +
  "  const r = cp.spawnSync('git', ['config', 'core.hooksPath', dir], { cwd: root });\n  console.log(r.status === 0 ? 'install-hooks: git hooks now come from ' + dir : 'install-hooks: could not set core.hooksPath');\n  process.exit(r.status === 0 ? 0 : 1);\n})();\n";

// ---------------------------------------------------------------- templates
const SH_BEGIN = '# >>> gs-init >>>', SH_END = '# <<< gs-init <<<';
const MD_BEGIN = '<!-- gs-init:begin (managed block; edit outside it) -->', MD_END = '<!-- gs-init:end -->';

function hookBlock(name, level) {
  const L = [SH_BEGIN];
  if (name === 'pre-commit') L.push('if [ -f scripts/gs-gate.mjs ]; then node scripts/gs-gate.mjs pre-commit || exit 1; fi');
  if (name === 'commit-msg') {
    L.push('if [ -f scripts/gs-gate.mjs ]; then node scripts/gs-gate.mjs commit-msg "$1" || exit 1; fi');
    if (level === 'L2') {
      L.push('if [ -f tools/gs-decide/gs-decide-hook.mjs ]; then node tools/gs-decide/gs-decide-hook.mjs --msg-file "$1" || exit 1; fi');
      L.push('if [ -f tools/gs-decide/gs-attribution-hook.mjs ]; then node tools/gs-decide/gs-attribution-hook.mjs --msg-file "$1" || exit 1; fi');
    }
  }
  if (name === 'pre-push') {
    L.push('GS_REFS=$(cat)');
    L.push('if [ -f scripts/gs-gate.mjs ]; then node scripts/gs-gate.mjs pre-push || exit 1; fi');
    if (level === 'L2') {
      L.push('if [ -f tools/gs-decide/gs-decide-hook.mjs ]; then printf \'%s\\n\' "$GS_REFS" | node tools/gs-decide/gs-decide-hook.mjs --pre-push || exit 1; fi');
      L.push('if [ -f tools/gs-decide/gs-attribution-hook.mjs ]; then printf \'%s\\n\' "$GS_REFS" | node tools/gs-decide/gs-attribution-hook.mjs --pre-push || exit 1; fi');
    }
  }
  L.push(SH_END);
  return L.join('\n');
}

function sentinelBlock(ctx) {
  const { level, hasGate, hasDecide, testCmd, adr } = ctx;
  const rows = [];
  if (hasGate) {
    rows.push(['spec-shape', '`node scripts/gs-gate.mjs spec`', 'pre-commit, pre-push', '`printf "\\n- F-001.9 The thing MUST work.\\n" >> docs/spec/SPEC.md && node scripts/gs-gate.mjs spec`']);
    rows.push(['open-questions', '`node scripts/gs-gate.mjs open`', 'pre-commit, pre-push', '`printf "OPEN: probe\\n" >> docs/open-questions.md && node scripts/gs-gate.mjs open`']);
    rows.push(['ratchet', '`node scripts/gs-gate.mjs ratchet`', 'pre-commit, pre-push', '`printf "{\\"floors\\":{\\"tests\\":99999},\\"ceilings\\":{}}" > docs/baseline.json && node scripts/gs-gate.mjs ratchet`']);
    rows.push(['commit-message', '`node scripts/gs-gate.mjs commit-msg <file>`', 'commit-msg', '`echo "fixed stuff" > msg.txt && node scripts/gs-gate.mjs commit-msg msg.txt`']);
    if (testCmd) rows.push(['tests', '`' + testCmd + '`', 'pre-commit, pre-push', 'break one test, then run the command']);
  }
  if (level === 'L2' && hasDecide) rows.push(['ratification', '`node tools/gs-decide/gs-decide.mjs verify --require-ratified`', 'commit-msg, pre-push, CI', 'change a protected file with no entry in docs/decisions.log.md']);
  const table = rows.length
    ? ['| gate | command | runs at | red proof |', '|---|---|---|---|', ...rows.map(r => '| ' + r.join(' | ') + ' |')]
    : ['| gate | command | runs at | red proof |', '|---|---|---|---|', '| none yet | nothing runs by itself at level L0 | | |'];
  const where = [
    ['what the project must do, with ids', 'docs/spec/SPEC.md'],
    ['why it was built this way', adr],
    ['questions nobody has answered', 'docs/open-questions.md'],
    ['settings and the level', '.gs.json'],
  ];
  if (hasGate) where.push(['the floor that may only go up', 'docs/baseline.json'], ['the gates', 'scripts/gs-gate.mjs']);
  if (level === 'L2' && hasDecide) where.push(['who accepted what (appended by gs-decide)', 'tools/gs-decide/gs-decide.mjs']);
  const L = [];
  L.push(MD_BEGIN);
  L.push('## Generative Specification: how work is done here (level ' + level + ')');
  L.push('');
  L.push('Read this first. It routes to everything else. Written by `gs-init`; the level is in `.gs.json`.');
  L.push('');
  L.push('### Which case it is');
  L.push('');
  L.push('| the change is | do this |');
  L.push('|---|---|');
  L.push('| tiny (a typo, a comment, a rename, a formatting fix) | make it and commit; ' + (hasGate ? 'the automatic checks are the only review' : 'there are no automatic checks at this level, so look at the diff yourself') + ' |');
  L.push('| normal (new or changed behaviour) | change `docs/spec/SPEC.md` first (a criterion id), then the test, then the code; cite the id in the commit |');
  L.push('| risky (security, money, data, a gate, the spec itself, the floor) | stop: a named person writes down that they accept it, before the commit' + (level === 'L2' ? ' (`gs-decide add`)' : '') + ' |');
  L.push('');
  L.push('### Where things are');
  L.push('');
  L.push('| topic | file |');
  L.push('|---|---|');
  for (const w of where) L.push('| ' + w[0] + ' | `' + w[1] + '` |');
  L.push('');
  L.push('### Tool sequence');
  L.push('');
  L.push(...table);
  L.push('');
  L.push('### Rules');
  L.push('');
  L.push('- Commit messages read `type: what changed` (feat, fix, docs, refactor, test, chore, build, ci, perf, style, revert), one change per commit.');
  L.push('- A commit made with an assistant carries `Assisted-by: AGENT:MODEL` or the tool\'s own `Co-Authored-By:` line. An assistant never adds `Signed-off-by`.');
  L.push('- An assistant proposes; it never records a person\'s acceptance of a risky change for them.');
  L.push('- Requirement and criterion ids (`F-001`, `F-001.1`) are never renumbered or reused. A line `OPEN:` in the spec or in `docs/open-questions.md` blocks the work until it is answered.');
  L.push(MD_END);
  return L.join('\n');
}

const SPEC_MD = (name, adr) => `# ${name}: specification

The source of truth for what this project does. Edit the spec first, then the tests, then the code. Ids are never renumbered or reused.
The three lines below are placeholders that make the form valid; replace every one of them with something true about your project.

## F-001 Replace this with your first requirement

One sentence: what the project must do, for whom, and why it matters.

### Acceptance criteria

- F-001.1 The system MUST do the one observable thing you wrote above. verified by: replace this with a test file, or with a manual step until a test exists
- F-001.2 The system MUST refuse the one input it must never accept. verified by: replace this with a test file, or with a manual step until a test exists
- F-001.3 The system SHOULD stay inside the one limit that matters (time, size, cost). verified by: replace this with a test file, or with a manual step until a test exists

### Decisions

Why it is built this way: ${adr}.
`;

const QUESTIONS_MD = `# Open questions

Questions that nobody has answered yet. A line that starts with \`OPEN:\` blocks the work (the gate refuses the commit) until it is answered and the line is removed or rewritten as a decision.

| question | who can answer | needed by |
|---|---|---|
| (none yet) | | |
`;

const ADR_MD = (level, date) => `# ADR 0001: run this project with Generative Specification, level ${level}

## Status

Proposed. Written by gs-init. The person who owns the project accepts it by changing this line to Accepted in a commit under their own name.

## Date

${date}

## Context

An assistant writes code in this project. What was asked for, why, and what is off limits has to live in files the assistant reads and a program checks, not in a chat.

## Decision

Use the Generative Specification substrate at level ${level}: a sentinel that routes to the spec, decision records and open questions; ids on requirements and criteria; ${level === 'L0' ? 'the trailer convention for assistant commits (no program checks it at this level)' : 'git hooks that refuse a bad commit, a ratchet floor that only goes up'}${level === 'L2' ? ', named ratifications for risky changes and a CI re-check' : ''}.

## Consequences

The spec is edited before the code. ${level === 'L0' ? 'Nothing is enforced yet: move up to L1 when this has been boring for a while.' : 'A commit that breaks a gate is refused until the cause is fixed; \`--no-verify\` skips the local hooks, so the shared branch needs the same checks in CI.'}
`;

const CI_YML = branch => `# gs-init: generated file (MIT). Re-checks on the server what the local hooks check, because a local hook can be skipped.
name: gs
on:
  push:
    branches: [${branch}]
  pull_request:
jobs:
  gs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: node scripts/gs-gate.mjs all
      - run: node tools/gs-decide/gs-decide-ci.mjs --base origin/\${{ github.event.repository.default_branch }}
`;

const README_BLOCK = `${MD_BEGIN}
## Fresh clone (Generative Specification checks)

\`\`\`bash
node scripts/install-hooks.mjs
node scripts/gs-gate.mjs all
\`\`\`

The first line points git at the hooks of this project; the second runs the same checks the hooks run.
${MD_END}`;

// ---------------------------------------------------------------- the installer
export function insertBlock(text, begin, end, block, position) {
  const i = text.indexOf(begin), j = text.indexOf(end);
  if (i >= 0 && j > i) return text.slice(0, i) + block + text.slice(j + end.length);
  if (position === 'afterShebang' && text.startsWith('#!')) { const nl = text.indexOf('\n'); return nl < 0 ? text + '\n' + block + '\n' : text.slice(0, nl + 1) + block + '\n' + text.slice(nl + 1); }
  if (position === 'afterShebang') return block + '\n' + text;
  return text + (text.endsWith('\n') || !text ? '' : '\n') + (text ? '\n' : '') + block + '\n';
}

class Run {
  constructor(a) {
    this.a = a; this.root = a.root; this.ops = []; this.stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
    this.backedUp = [];
  }
  note(kind, rel, extra = '') { this.ops.push({ kind, rel, extra }); }
  backup(rel) {
    const dest = path.join(this.root, '.gs-init-backup', this.stamp, rel);
    fs.mkdirSync(path.dirname(dest), { recursive: true }); fs.copyFileSync(path.join(this.root, rel), dest);
    this.backedUp.push(rel); return posix(path.join('.gs-init-backup', this.stamp, rel));
  }
  write(rel, content, mode = null) {
    const p = path.join(this.root, rel); fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, content); if (mode) { try { fs.chmodSync(p, mode); } catch { /* ignore */ } }
  }
  // kind 'keep': the file is the person's; create it when absent, never change it.
  putKeep(rel, content) {
    if (!exists(this.root, rel)) { if (!this.a.dryRun) this.write(rel, content); return this.note('create', rel); }
    this.note('keep', rel, 'already exists; left as it is');
  }
  // kind 'own': a file generated by gs-init; replaced (after a backup) when it differs.
  putOwn(rel, content, mode = null) {
    if (!exists(this.root, rel)) { if (!this.a.dryRun) this.write(rel, content, mode); return this.note('create', rel); }
    if (read(this.root, rel).replace(/\r\n/g, '\n') === content) { if (!this.a.dryRun && mode) try { fs.chmodSync(path.join(this.root, rel), mode); } catch { /* ignore */ } return this.note('same', rel); }
    const b = this.a.dryRun ? '.gs-init-backup/<stamp>/' + rel : this.backup(rel);
    if (!this.a.dryRun) this.write(rel, content, mode);
    this.note('update', rel, 'backup ' + b);
  }
  // A marked block inside a file that may be the person's. position: 'end' | 'afterShebang'.
  putBlock(rel, begin, end, block, { position = 'end', create = '' } = {}) {
    const p = path.join(this.root, rel);
    if (!fs.existsSync(p)) { if (!this.a.dryRun) this.write(rel, create + block + '\n'); return this.note('create', rel); }
    const raw = read(this.root, rel), eol = raw.includes('\r\n') ? '\r\n' : '\n', text = raw.replace(/\r\n/g, '\n');
    const next = insertBlock(text, begin, end, block, position);
    if (next === text) return this.note('same', rel);
    const hadBlock = text.indexOf(begin) >= 0 && text.indexOf(end) > text.indexOf(begin);
    const b = this.a.dryRun ? '.gs-init-backup/<stamp>/' + rel : this.backup(rel);
    if (!this.a.dryRun) fs.writeFileSync(p, eol === '\r\n' ? next.replace(/\n/g, '\r\n') : next);
    this.note(hadBlock ? 'update' : 'append', rel, 'backup ' + b + (hadBlock ? '; only the managed block changed' : '; your content is untouched'));
  }
}

function findTools(a) {
  const roots = [a.tools, process.env.GS_TOOLS && path.resolve(process.env.GS_TOOLS), path.resolve(HERE, '..')].filter(Boolean);
  const res = {};
  for (const [tool, files] of Object.entries(TOOL_FILES)) {
    res[tool] = null;
    for (const r of roots) { const d = path.join(r, tool); if (files.every(f => fs.existsSync(path.join(d, f)))) { res[tool] = { dir: d, files, licence: [path.join(r, 'LICENSE')].find(fs.existsSync) || null }; break; } }
  }
  return res;
}

function chooseSentinel(a, root) {
  if (a.sentinel) return a.sentinel;
  if (exists(root, 'CLAUDE.md')) return 'CLAUDE.md';
  if (exists(root, 'AGENTS.md')) return 'AGENTS.md';
  return 'CLAUDE.md';
}

function hookDirOf(root) {
  const hp = git(root, ['config', '--get', 'core.hooksPath']).stdout.trim();
  if (hp) return { dir: hp.replace(/\\/g, '/').replace(/^\.\//, ''), preset: true };
  return { dir: '.githooks', preset: false };
}

export function install(a) {
  const root = a.root, level = a.level, name = path.basename(root);
  if (!fs.existsSync(root)) die('folder not found: ' + root);
  const isRepo = git(root, ['rev-parse', '--is-inside-work-tree']).status === 0;
  if (isRepo) {
    const prefix = git(root, ['rev-parse', '--show-prefix']).stdout.trim();
    if (prefix) die('run this in the top folder of the repository (you are in ' + prefix + ' of it), or pass --root');
  }
  const R = new Run(a), tools = findTools(a), st = detectStack(root);
  const sentinel = chooseSentinel(a, root);
  const date = new Date().toISOString().slice(0, 10);

  // L2 needs gs-decide: fail before writing anything.
  const decideNow = exists(root, 'tools/gs-decide/gs-decide.mjs');
  if (level === 'L2' && !tools['gs-decide'] && !decideNow) die(`level L2 needs gs-decide, and it was not found next to this file or in --tools.\n  Fetch tools/gs-decide from ${REPO_URL} and run again with --tools <folder that holds gs-decide>.`);

  if (!isRepo) { if (!a.dryRun) git(root, ['init', '-q']); R.note('create', '.git', 'git init (the folder was not a repository)'); }

  const testCmd = level === 'L0' ? null : detectTestCommand(root, st.stack);
  const hasGate = level !== 'L0';
  // 1. the documents (kept if they exist)
  const existingAdr = exists(root, 'docs/decisions') ? fs.readdirSync(path.join(root, 'docs/decisions')).filter(f => /^\d{4}-.*\.md$/.test(f)).sort()[0] : null;
  const adr = existingAdr ? 'docs/decisions/' + existingAdr : 'docs/decisions/0001-adopt-generative-specification.md';
  R.putKeep('docs/spec/SPEC.md', SPEC_MD(name, adr));
  R.putKeep('docs/open-questions.md', QUESTIONS_MD);
  if (!existingAdr) R.putKeep(adr, ADR_MD(level, date));
  else R.note('keep', 'docs/decisions/', 'you already have decision records');

  // 2. the sentinel
  const decideAvail = level === 'L2';
  R.putBlock(sentinel, MD_BEGIN, MD_END, sentinelBlock({ level, hasGate, hasDecide: decideAvail, testCmd, adr }), { create: `# ${name}: sentinel\n\n` });

  // 3. settings
  const cfgPath = '.gs.json';
  let cfg = {}, cfgOk = true;
  if (exists(root, cfgPath)) { try { cfg = JSON.parse(unbom(read(root, cfgPath))); } catch { cfgOk = false; } }
  const hk = hookDirOf(root);
  if (!cfgOk) R.note('keep', cfgPath, 'exists but is not valid JSON; left as it is, set "level" by hand');
  else {
    const before = JSON.stringify(cfg);
    cfg.level = level; cfg.stack = st.stack; cfg.sentinel = sentinel;
    if (hasGate) { cfg.hooks = cfg.hooks || hk.dir; if (testCmd) { cfg.gate = cfg.gate || {}; if (!cfg.gate.test) cfg.gate.test = testCmd; } }
    if (level === 'L2') { cfg.attribution = cfg.attribution || {}; if (cfg.attribution.enabled === undefined) cfg.attribution.enabled = true; }
    if (a.pubkey) { cfg.decide = cfg.decide || {}; cfg.decide.requireSigned = true; }
    const body = JSON.stringify(cfg, null, 2) + '\n';
    if (!exists(root, cfgPath)) { if (!a.dryRun) R.write(cfgPath, body); R.note('create', cfgPath); }
    else if (JSON.stringify(cfg) === before) R.note('same', cfgPath);
    else { const b = a.dryRun ? '.gs-init-backup/<stamp>/' + cfgPath : R.backup(cfgPath); if (!a.dryRun) R.write(cfgPath, body); R.note('update', cfgPath, 'backup ' + b + '; your other keys are kept'); }
  }

  // 4. tools (copies, never edited) and the generated scripts
  const wantTools = level === 'L0' ? [] : level === 'L1' ? ['gs-check', 'gs-lock', 'gs-decide'] : ['gs-check', 'gs-lock', 'gs-decide'];
  const missing = []; let licence = null;
  for (const t of wantTools) {
    const src = tools[t];
    if (!src) { if (!TOOL_FILES[t].every(f => exists(root, `tools/${t}/${f}`))) missing.push(t); else R.note('same', `tools/${t}/`, 'already present'); continue; }
    for (const f of src.files) R.putOwn(`tools/${t}/${f}`, fs.readFileSync(path.join(src.dir, f), 'utf8').replace(/\r\n/g, '\n'), 0o755);
    if (src.licence) licence = src.licence;
  }
  if (licence) R.putOwn('tools/LICENSE', fs.readFileSync(licence, 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10)));
  if (hasGate) {
    R.putOwn('scripts/gs-gate.mjs', GATE_FILE, 0o755);
    R.putOwn('scripts/install-hooks.mjs', HOOKS_FILE, 0o755);
  }

  // 5. hooks, chained: a block is added to the hook you already have; your lines stay and still run
  const hookNotes = [];
  if (hasGate) {
    const dir = (cfgOk && cfg.hooks) || hk.dir;
    for (const hname of ['pre-commit', 'commit-msg', 'pre-push']) {
      const rel = `${dir}/${hname}`, block = hookBlock(hname, level);
      let adopt = null;
      if (!hk.preset && !exists(root, rel) && isRepo) { // a real hook in .git/hooks is carried into the versioned folder
        const gp = path.resolve(root, git(root, ['rev-parse', '--git-path', 'hooks']).stdout.trim() || '.git/hooks'), orig = path.join(gp, hname);
        if (fs.existsSync(orig) && fs.statSync(orig).isFile()) adopt = fs.readFileSync(orig, 'utf8').replace(/\r\n/g, '\n');
      }
      if (adopt !== null) {
        hookNotes.push(`your existing ${hname} hook was copied into ${rel} and still runs after the checks`);
        const first = adopt.split('\n')[0];
        if (first.startsWith('#!') && !/\b(sh|bash|zsh|dash|ksh)\b/.test(first)) { // not a shell script: keep it as a file of its own and call it
          const prev = `${dir}/${hname}.gs-prev`; if (!a.dryRun) R.write(prev, adopt, 0o755); R.note('create', prev, 'your hook, unchanged');
          if (!a.dryRun) R.write(rel, '#!/bin/sh\n' + block + `\nexec "$(dirname "$0")/${hname}.gs-prev" "$@"\n`, 0o755);
          R.note('create', rel, 'calls your ' + hname + ' hook');
        } else {
          if (!a.dryRun) R.write(rel, insertBlock(adopt, SH_BEGIN, SH_END, block, 'afterShebang'), 0o755);
          R.note('create', rel, 'your .git/hooks/' + hname + ' carried over, checks added above it');
        }
        continue;
      }
      if (exists(root, rel)) {
        const cur = read(root, rel), first = cur.split('\n')[0];
        if (first.startsWith('#!') && !/\b(sh|bash|zsh|dash|ksh)\b/.test(first) && !cur.includes(SH_BEGIN)) {
          const prev = `${rel}.gs-prev`, b = a.dryRun ? '.gs-init-backup/<stamp>/' + rel : R.backup(rel);
          if (!a.dryRun) { R.write(prev, cur, 0o755); R.write(rel, '#!/bin/sh\n' + block + `\nexec "$(dirname "$0")/${hname}.gs-prev" "$@"\n`, 0o755); }
          R.note('update', rel, 'backup ' + b + '; your hook (not a shell script) is kept as ' + posix(path.basename(prev)) + ' and still runs');
          hookNotes.push(`your ${hname} hook is not a shell script: kept as ${prev} and called after the checks`);
          continue;
        }
        if (!cur.includes(SH_BEGIN)) hookNotes.push(`your ${hname} hook keeps running: the checks were added above it`);
      }
      R.putBlock(rel, SH_BEGIN, SH_END, block, { position: 'afterShebang', create: '#!/bin/sh\n' });
      if (!a.dryRun) try { fs.chmodSync(path.join(root, rel), 0o755); } catch { /* ignore */ }
    }
    // activate
    if (!a.dryRun) {
      if (hk.preset) R.note('same', 'core.hooksPath', 'already ' + hk.dir + '; kept');
      else { const r = git(root, ['config', 'core.hooksPath', dir]); R.note(r.status === 0 ? 'config' : 'keep', 'core.hooksPath', r.status === 0 ? 'set to ' + dir : 'could not be set'); }
    } else R.note('config', 'core.hooksPath', hk.preset ? 'already ' + hk.dir : 'would be set to ' + dir);
  }

  // 6. README fresh-clone block, CI, optional roles
  if (hasGate) {
    const hasFresh = exists(root, 'README.md') && /^#{1,6}.*fresh clone/im.test(read(root, 'README.md')) && !read(root, 'README.md').includes(MD_BEGIN);
    if (hasFresh) R.note('keep', 'README.md', 'has its own "Fresh clone" section; add "node scripts/install-hooks.mjs" to it');
    else R.putBlock('README.md', MD_BEGIN, MD_END, README_BLOCK, { create: `# ${name}\n\n` });
  }
  if (level === 'L2') {
    let branch = git(root, ['symbolic-ref', '--short', 'HEAD']).stdout.trim() || git(root, ['config', '--get', 'init.defaultBranch']).stdout.trim() || 'main';
    R.putOwn('.github/workflows/gs.yml', CI_YML(branch));
    if (a.pubkey) {
      if (!fs.existsSync(a.pubkey)) die('--pubkey file not found: ' + a.pubkey);
      const key = fs.readFileSync(a.pubkey, 'utf8').trim().split('\n')[0], email = git(root, ['config', 'user.email']).stdout.trim() || 'you@example.com';
      if (!/^(ssh-|ecdsa-|sk-)/.test(key)) die('--pubkey must be a PUBLIC ssh key file (a line starting ssh-ed25519 ...)');
      R.putKeep('docs/decision-roles.json', JSON.stringify({ identities: { [email]: ['maintainer'] }, keys: { [email]: [key] } }, null, 2) + '\n');
    }
  }

  // 7. keep the backup folder out of git (local, in .git/info/exclude)
  if (!a.dryRun && isRepo) {
    const ex = path.resolve(root, git(root, ['rev-parse', '--git-path', 'info/exclude']).stdout.trim() || '.git/info/exclude');
    try { const cur = fs.existsSync(ex) ? fs.readFileSync(ex, 'utf8') : ''; if (!cur.includes('.gs-init-backup/')) { fs.mkdirSync(path.dirname(ex), { recursive: true }); fs.appendFileSync(ex, (cur && !cur.endsWith('\n') ? '\n' : '') + '.gs-init-backup/\n'); } } catch { /* not fatal */ }
  }

  // 8. the ratchet floor, measured by the generated gate (so the floor is exactly what the gate will measure)
  if (hasGate) {
    if (exists(root, 'docs/baseline.json')) R.note('keep', 'docs/baseline.json', 'already exists; floors unchanged');
    else if (a.dryRun) R.note('create', 'docs/baseline.json', 'floors measured now (tests found, criteria in the spec)');
    else { const r = spawnSync(process.execPath, ['scripts/gs-gate.mjs', 'ratchet', '--init'], { cwd: root, encoding: 'utf8' }); R.note(r.status === 0 ? 'create' : 'keep', 'docs/baseline.json', r.status === 0 ? 'floors measured now' : 'could not be created: ' + (r.stderr || r.stdout).trim()); }
  }

  return { R, st, tools, missing, hookNotes, testCmd, sentinel, level, hasGate, isRepo };
}

// ---------------------------------------------------------------- the proof: gs-check strict on a COPY (it reads only committed state)
function copyTree(root, dest) {
  const r = git(root, ['ls-files', '--cached', '--others', '--exclude-standard']);
  const files = r.status === 0 ? r.stdout.split('\n').filter(Boolean) : [];
  for (const f of files) { const s = path.join(root, f); if (!fs.existsSync(s) || !fs.statSync(s).isFile()) continue; const d = path.join(dest, f); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(s, d); }
  return files.length;
}

export function proof(root, level, checker, timeoutMs = 900000, verbose = false) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-init-proof-'));
  try {
    copyTree(root, tmp);
    const g = args => spawnSync('git', ['-c', 'user.name=gs-init', '-c', 'user.email=gs-init@example.com', ...args], { cwd: tmp, encoding: 'utf8' });
    g(['init', '-q']); g(['add', '-A']);
    for (const f of g(['ls-files']).stdout.split('\n')) if (/(^|\/)(\.githooks|\.husky|hooks)\/[^/]+$/.test(f) || /\.mjs$/.test(f)) g(['update-index', '--chmod=+x', f]);
    g(['commit', '-q', '--no-verify', '-m', 'chore: gs-init proof copy']);
    const r = spawnSync(process.execPath, [checker, '--repo', tmp, '--strict', ...(verbose ? ['--verbose'] : [])], { encoding: 'utf8', timeout: timeoutMs, maxBuffer: 64 * 1024 * 1024 });
    const text = (r.stdout || '') + (r.stderr || '');
    const items = {};
    for (const l of text.split('\n')) { const m = l.match(/^(E\d{2})\s+(PASS|PARTIAL|ABSENT|UNDETERMINABLE)\b/); if (m && !items[m[1]]) items[m[1]] = m[2]; }
    return { status: r.status, items, text, timedOut: r.error && r.error.code === 'ETIMEDOUT' };
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
}

// ---------------------------------------------------------------- report
const LABEL = { create: 'create', append: 'append', update: 'update', keep: 'keep  ', same: 'same  ', config: 'config' };

function plain(level, res, p) {
  const cnt = k => res.R.ops.filter(o => o.kind === k).length;
  const gets = {
    L0: 'a map file for the assistant, a spec with numbered requirements, a decisions folder and an open-questions list; nothing runs by itself',
    L1: 'the map file, the spec, decisions and open questions, plus checks that refuse a bad commit (spec shape, open questions, a quality floor that only goes up, typed messages' + (res.testCmd ? ', your tests' : '') + ')',
    L2: 'everything in L1, plus a record of who accepted each risky change, a rule for marking assistant commits, and the same checks again on the server',
  }[level];
  const next = {
    L0: `replace the example requirement in docs/spec/SPEC.md with a real one, tell your assistant to read ${res.sentinel} first, and move to L1 when this feels boring`,
    L1: `replace the example requirement in docs/spec/SPEC.md, commit this setup, then make one small change with your assistant and watch a bad commit get refused`,
    L2: `replace the example requirement, then record your acceptance of the starting state yourself ("node tools/gs-decide/gs-decide.mjs add --kind baseline --covers-protected --role <your role> --why <reason>"), then commit`,
  }[level];
  const notYet = {
    L0: 'no check runs by itself (the lock, the co-change gate and the ratchet come with L1 and day 7 to 30), and nobody has signed anything',
    L1: 'the spec lock and the co-change gate are for day 7 to 30, once there is code with ids; signed acceptances are L2; the server does not re-check yet',
    L2: 'the spec lock and the co-change gate are for day 7 to 30; ' + (p && false ? '' : 'acceptances are signed only after you give a public key (--pubkey) and make the server check required in your repository settings'),
  }[level];
  return [`You got: ${gets}.`, `Do next: ${next}.`, `Not yet: ${notYet}.`];
}

export async function main(argv) {
  const a = parseArgs(argv);
  if (a.help) { out(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').filter(l => l.startsWith('//')).slice(4, 17).map(l => l.slice(3)).join('\n')); return 0; }
  const res = install(a);
  out(`gs-init ${VERSION}: level ${a.level}, stack ${res.st.stack}${res.st.also.length ? ' (also ' + res.st.also.join(', ') + ')' : ''}, sentinel ${res.sentinel}${a.dryRun ? '  [dry run: nothing was written]' : ''}`);
  for (const o of res.R.ops) out(`  ${(LABEL[o.kind] || o.kind).padEnd(6)} ${o.rel}${o.extra ? '   (' + o.extra + ')' : ''}`);
  for (const t of res.missing) out(`  missing tool ${t}: not found next to gs-init or in --tools. Fetch tools/${t} from ${REPO_URL} (gs-check and gs-lock are on the formulas branch until merged) and run again.`);
  for (const n of [...new Set(res.hookNotes)]) out('  note: ' + n);
  if (res.backedUp?.length || res.R.backedUp.length) out(`  backups of ${res.R.backedUp.length} file(s) in .gs-init-backup/${res.R.stamp}/ (kept out of git through .git/info/exclude)`);

  let code = 0, pr = null;
  const checker = [path.join(a.root, 'tools/gs-check/gs-check.mjs'), res.tools['gs-check'] && path.join(res.tools['gs-check'].dir, 'gs-check.mjs')].filter(Boolean).find(fs.existsSync);
  if (a.dryRun) out('Proof: skipped in a dry run.');
  else if (!a.proof) out('Proof: skipped (--no-proof).');
  else if (!checker) out(`Proof: skipped, gs-check was not found. Fetch tools/gs-check from ${REPO_URL} and run: node tools/gs-check/gs-check.mjs --repo . --strict (it reads committed state only, so commit first).`);
  else if (res.level === 'L0' && false) { /* L0 is proved too, when gs-check is present */ }
  else {
    out('Proof: gs-check --strict on a copy of your working tree (it reads only committed state; your repository is not touched). This takes a minute or two.');
    pr = proof(a.root, a.level, checker, 900000, a.verbose);
    if (a.verbose) out(pr.text);
    const claimed = CLAIMED[a.level];
    const order = Object.keys(pr.items).sort();
    out('  ' + (order.map(k => `${k} ${pr.items[k]}`).join('  ') || '(no item lines read from gs-check; exit ' + pr.status + ')'));
    const bad = claimed.filter(k => pr.items[k] !== 'PASS');
    out(`  claimed at ${a.level}: ${claimed.join(' ')} -> ${bad.length ? 'NOT PASSING: ' + bad.join(' ') : 'all PASS'}`);
    const rest = order.filter(k => pr.items[k] !== 'PASS' && !claimed.includes(k));
    if (rest.length) out(`  not claimed at ${a.level} (so they read ${[...new Set(rest.map(k => pr.items[k]))].join('/')} on purpose): ${rest.join(' ')}. E10 and E11 (lock, co-change) are day 7 to 30; E09 needs 4 commits of history; E05 needs 5 tests and a CI file; E04 and E08 (architecture, coverage) are yours to write.`);
    if (bad.length) { out('  The installer could not prove its own claim. Read the raw lines above with: node tools/gs-check/gs-check.mjs --repo <a committed copy> --strict --verbose'); code = 1; }
  }
  out('');
  for (const l of plain(a.level, res, pr)) out(l);
  return code;
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url))) main(process.argv.slice(2)).then(c => process.exit(c));
