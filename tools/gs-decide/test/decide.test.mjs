// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Juan Carlos Ghiringhelli, PragmaWorks
// Tests of gs-decide.mjs and gs-decide-hook.mjs. No model, no network, throwaway git repositories. Run: node --test tools/gs-decide/test
// (Windows, Linux container). Scenarios are named T<n>.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, mkdirSync, copyFileSync, existsSync, chmodSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url)), TOOL = join(HERE, '..');
const DECIDE = join(TOOL, 'gs-decide.mjs'), HOOK = join(TOOL, 'gs-decide-hook.mjs');
const LOCK_DIR = existsSync(join(TOOL, '..', 'gs-lock', 'gs-lock.mjs')) ? join(TOOL, '..', 'gs-lock') : join(HERE, 'vendor', 'gs-lock');
const CHECK_JS = process.env.GS_CHECK_JS || join(TOOL, '..', 'gs-check', 'gs-check.mjs');
const env = (extra = {}) => { const e = { ...process.env }; for (const k of Object.keys(e)) if (/^(NODE_TEST_CONTEXT|GIT_.*|CLAUDECODE|CLAUDE_CODE_ENTRYPOINT|GS_DECIDE_.*|CURSOR_AGENT|CODEX_SANDBOX|AIDER_MODEL|GEMINI_CLI)$/.test(k)) delete e[k]; return { ...e, ...extra }; };
const out = r => (r.stdout || '') + (r.stderr || '');
const NOW = '2026-10-08T10:00:00Z', TODAY = '2026-10-08';

const SPEC = '# Ledger spec\n\n## Acceptance criteria\n\n- [ ] AC-001 The balance of 3, -1 and 4 is 6.\n- [ ] AC-002 The balance of an empty list is 0.\n';
const files = {
  'docs/spec/SPEC.md': SPEC, 'CLAUDE.md': '# Sentinel\n\nRead the spec first.\n', 'docs/ratchet.json': '{ "tests_min": 2 }\n',
  '.github/workflows/ci.yml': 'name: ci\non: [push]\njobs: {}\n', 'src/ledger.js': 'exports.balance = a => a.reduce((x, y) => x + y, 0);\n', 'README.md': '# Ledger\n',
};

function proj({ withLock = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'gsdec-'));
  const w = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
  for (const [rel, text] of Object.entries(files)) w(rel, text);
  for (const f of ['gs-decide.mjs', 'gs-decide-hook.mjs']) { mkdirSync(join(dir, 'tools/gs-decide'), { recursive: true }); copyFileSync(join(TOOL, f), join(dir, 'tools/gs-decide', f)); }
  if (withLock) for (const f of ['gs-lock.mjs', 'gs-cochange.mjs']) { mkdirSync(join(dir, 'tools/gs-lock'), { recursive: true }); copyFileSync(join(LOCK_DIR, f), join(dir, 'tools/gs-lock', f)); }
  const sh = (cmd, args, extra = {}) => spawnSync(cmd, args, { cwd: dir, encoding: 'utf8', env: env(extra.env), input: extra.input });
  const g = (...a) => sh('git', a);
  g('init', '-q', '-b', 'main'); g('config', 'user.email', 'maria@example.com'); g('config', 'user.name', 'Maria Ratifier');
  g('config', 'core.autocrlf', 'false'); g('config', 'commit.gpgsign', 'false');
  const P = {
    dir, g, w, rm: rel => rmSync(join(dir, rel), { force: true }),
    read: rel => readFileSync(join(dir, rel), 'utf8'),
    decide: (...a) => sh(process.execPath, [join(dir, 'tools/gs-decide/gs-decide.mjs'), ...a], { env: { GS_DECIDE_NOW: NOW, GS_DECIDE_TODAY: TODAY } }),
    decideEnv: (e, ...a) => sh(process.execPath, [join(dir, 'tools/gs-decide/gs-decide.mjs'), ...a], { env: { GS_DECIDE_NOW: NOW, GS_DECIDE_TODAY: TODAY, ...e } }),
    verify: (today, ...a) => sh(process.execPath, [join(dir, 'tools/gs-decide/gs-decide.mjs'), 'verify', ...a], { env: { GS_DECIDE_TODAY: today || TODAY } }),
    hook: (...a) => sh(process.execPath, [join(dir, 'tools/gs-decide/gs-decide-hook.mjs'), ...a], { env: { GS_DECIDE_TODAY: TODAY } }),
    lock: (...a) => sh(process.execPath, [join(dir, 'tools/gs-lock/gs-lock.mjs'), ...a]),
    msg(text) { const f = join(dir, '.git', 'MSG'); writeFileSync(f, text); return f; },
    // the commit-msg hook as git runs it: stage everything, run the hook with the message, commit only if it passes (so tests need no hook install)
    try(msg) { g('add', '-A'); const r = P.hook('--msg-file', P.msg(msg)); if (r.status === 0) g('commit', '-q', '-m', msg, '--no-verify'); return r; },
    commit(msg) { g('add', '-A'); const r = g('commit', '-q', '-m', msg, '--no-verify'); assert.equal(r.status, 0, out(r)); },
    // approve a path (the entry hashes the file as it is now), stage the log with it
    approve(path, kind = 'spec', why = 'reviewed the change and accepted it as is') { const r = P.decide('add', '--kind', kind, '--role', 'tech lead', '--covers', path, '--why', why); assert.equal(r.status, 0, out(r)); return r; },
  };
  P.commit('chore: initial files');
  return P;
}
const logOf = P => P.read('docs/decisions.log.md');
const firstEntryLines = P => logOf(P).split('\n');

// ---------- the log and the chain ----------
test('T1 add writes a chained entry with who, role, kind, why, the approved hash, and list shows it', () => {
  const P = proj(); const r = P.approve('docs/spec/SPEC.md');
  assert.match(out(r), /recorded D-0001 spec by Maria Ratifier <maria@example.com> \(tech lead, via human\)/);
  const log = logOf(P);
  assert.match(log, /^## D-0001$/m); assert.match(log, /^who: Maria Ratifier <maria@example.com>$/m); assert.match(log, /^role: tech lead$/m);
  assert.match(log, /^approves: [0-9a-f]{64} docs\/spec\/SPEC\.md$/m); assert.match(log, /^prev: 0{64}$/m); assert.match(log, /^entry: [0-9a-f]{64}$/m);
  assert.match(out(P.decide('list')), /D-0001 .* spec .* Maria Ratifier <maria@example.com> \[tech lead\] docs\/spec\/SPEC\.md/);
  assert.match(P.read('.gitattributes'), /docs\/decisions\.log\.md text eol=lf/);
  P.approve('CLAUDE.md', 'spec'); assert.match(logOf(P), /^## D-0002$/m);
  const v = P.verify(); assert.equal(v.status, 0, out(v)); assert.match(out(v), /ok decisions log: 2 entries/);
});

test('T2 the entry hash is a pinned vector (same on Windows and Linux)', async () => {
  const m = await import(pathToFileURL(DECIDE).href);
  const e = { id: 'D-0001', when: NOW, who: 'A <a@x.org>', role: 'owner', via: 'human', kind: 'decision', ref: 'x', covers: [], approves: [], scope: '', why: 'a reason long enough', expires: '', closes: '', commit: '', prev: '0'.repeat(64) };
  assert.equal(m.entryHash(e), m.entryHash({ ...e, covers: [] }));
  assert.equal(m.canonical(e), `## D-0001\nwhen: ${NOW}\nwho: A <a@x.org>\nrole: owner\nvia: human\nkind: decision\nref: x\nwhy: a reason long enough\nprev: ${'0'.repeat(64)}`);
  assert.equal(m.entryHash(e), m.sha(m.canonical(e)));
  assert.equal(m.contentHash('a\r\nb\r\n'), m.contentHash('a\nb\n')); assert.equal(m.contentHash('﻿a\n'), m.contentHash('a\n'));
});

test('T3 TAMPER: editing the reason of an old entry is detected', () => {
  const P = proj(); P.approve('docs/spec/SPEC.md'); P.approve('CLAUDE.md');
  P.w('docs/decisions.log.md', logOf(P).replace('reviewed the change', 'rubber stamped the change'));
  const v = P.verify(); assert.equal(v.status, 1); assert.match(out(v), /CHAIN-BROKEN D-0001: the entry was edited/);
});

test('T4 TAMPER: editing an old entry AND rehashing it is caught by the next link', async () => {
  const P = proj(); P.approve('docs/spec/SPEC.md'); P.approve('CLAUDE.md');
  const m = await import(pathToFileURL(DECIDE).href);
  const p = m.parseLog(logOf(P)); const e1 = p.entries[0]; e1.why = 'a different reason that was never given'; const newHash = m.entryHash(e1);
  const forged = logOf(P).replace(/^why: reviewed.*$/m, 'why: ' + e1.why).replace(/^entry: [0-9a-f]{64}$/m, 'entry: ' + newHash);
  P.w('docs/decisions.log.md', forged);
  const v = P.verify(); assert.equal(v.status, 1); assert.match(out(v), /CHAIN-BROKEN D-0002: prev is/);
});

test('T5 TAMPER: removing an entry from the middle breaks the numbering and the chain', () => {
  const P = proj(); P.approve('docs/spec/SPEC.md'); P.approve('CLAUDE.md'); P.approve('docs/ratchet.json', 'ratchet');
  const blocks = logOf(P).split(/\n(?=## D-)/); blocks.splice(2, 1);
  P.w('docs/decisions.log.md', blocks.join('\n'));
  const v = P.verify(); assert.equal(v.status, 1); assert.match(out(v), /CHAIN-BROKEN D-0003/);
});

test('T6 TAMPER: a fully rehashed last entry (or a truncated tail) is caught against the committed log', async () => {
  const P = proj(); P.approve('docs/spec/SPEC.md'); P.approve('CLAUDE.md'); P.commit('docs: record two approvals');
  // the chain alone cannot see a forged TAIL; the committed copy can
  const trunc = logOf(P).split(/\n(?=## D-)/).slice(0, 2).join('\n'); P.w('docs/decisions.log.md', trunc);
  assert.equal(P.verify().status, 1); assert.match(out(P.verify()), /HISTORY-REWRITTEN/);
  const m = await import(pathToFileURL(DECIDE).href);
  P.g('checkout', '--', 'docs/decisions.log.md'); const p = m.parseLog(logOf(P)); const e2 = p.entries[1]; e2.why = 'rewritten tail with a valid hash';
  P.w('docs/decisions.log.md', logOf(P).replace(/^why: reviewed.*$(?![\s\S]*^why: reviewed)/m, 'why: ' + e2.why).replace(/^entry: [0-9a-f]{64}$(?![\s\S]*^entry: )/m, 'entry: ' + m.entryHash(e2)));
  assert.equal(P.verify().status, 1); assert.match(out(P.verify()), /HISTORY-REWRITTEN/); assert.doesNotMatch(out(P.verify()), /CHAIN-BROKEN/);
  assert.equal(P.verify(null, '--against', 'HEAD').status, 1);
});

test('T7 CRLF and BOM are tolerated: a log checked out with CRLF verifies and can be appended to', () => {
  const P = proj(); P.approve('docs/spec/SPEC.md'); P.commit('docs: log');
  P.w('docs/decisions.log.md', '﻿' + logOf(P).replace(/\n/g, '\r\n'));
  assert.equal(P.verify().status, 0, out(P.verify()));
  const r = P.approve('CLAUDE.md'); assert.equal(r.status, 0, out(r));
  assert.doesNotMatch(logOf(P).slice(logOf(P).indexOf('## D-0002')), /\r/); assert.equal(P.verify().status, 0, out(P.verify()));
});

test('T8 add refuses: no role, short reason, unknown kind, no git identity, no covered file', () => {
  const P = proj();
  assert.match(out(P.decide('add', '--kind', 'spec', '--covers', 'CLAUDE.md', '--why', 'long enough reason here')), /--role is required/);
  assert.match(out(P.decide('add', '--kind', 'spec', '--role', 'x', '--covers', 'CLAUDE.md', '--why', 'short')), /15\+ characters/);
  assert.match(out(P.decide('add', '--kind', 'banana', '--role', 'x', '--covers', 'CLAUDE.md', '--why', 'long enough reason here')), /--kind must be one of/);
  assert.match(out(P.decide('add', '--kind', 'gate', '--role', 'x', '--covers', 'nothing/*.cfg', '--why', 'long enough reason here')), /matches no file/);
  assert.equal(P.decide('add', '--kind', 'spec', '--role', 'x', '--why', 'long enough reason here').status, 2);
  P.g('config', '--unset', 'user.email'); P.g('config', '--local', 'user.name', '');
  const r = spawnSync(process.execPath, [join(P.dir, 'tools/gs-decide/gs-decide.mjs'), 'add', '--kind', 'decision', '--role', 'x', '--ref', 'plan', '--why', 'long enough reason here'], { cwd: P.dir, encoding: 'utf8', env: env({ HOME: P.dir, USERPROFILE: P.dir, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: join(P.dir, 'nope') }) });
  assert.equal(r.status, 2); assert.match(out(r), /git user\.name and user\.email are not set/);
  assert.ok(!existsSync(join(P.dir, 'docs/decisions.log.md')));
});

test('T9 a free-form decision with no file (an accepted ref) is recorded and an agent environment is flagged', () => {
  const P = proj();
  P.decide('add', '--kind', 'decision', '--role', 'CTO', '--ref', 'adopt model tiering for tests', '--scope', 'all services', '--why', 'cheaper checks first, proven on the sample');
  assert.match(logOf(P), /^ref: adopt model tiering for tests$/m); assert.match(logOf(P), /^scope: all services$/m); assert.match(logOf(P), /^via: human$/m);
  const r = P.decideEnv({ CLAUDECODE: '1' }, 'add', '--kind', 'decision', '--role', 'CTO', '--ref', 'second thing', '--why', 'written from an agent shell');
  assert.match(out(r), /via agent-suspected/); const v = P.verify(); assert.equal(v.status, 0); assert.match(out(v), /AGENT-ENTRY D-0002/);
});

// ---------- waivers ----------
test('T10 a waiver needs an expiry (within the maximum), a real date, and an anchor', () => {
  const P = proj(); const base = ['add', '--kind', 'waiver', '--role', 'tech lead', '--why', 'the flaky check is waived while the vendor fixes it'];
  assert.match(out(P.decide(...base, '--covers', 'docs/ratchet.json')), /needs --expires/);
  assert.match(out(P.decide(...base, '--covers', 'docs/ratchet.json', '--expires', '2026-02-30')), /real date/);
  assert.match(out(P.decide(...base, '--covers', 'docs/ratchet.json', '--expires', '2026-01-01')), /in the past/);
  assert.match(out(P.decide(...base, '--covers', 'docs/ratchet.json', '--expires', '2028-01-01')), /more than 365 days/);
  assert.match(out(P.decide(...base, '--expires', '2026-11-01')), /needs an anchor/);
  assert.equal(P.decide(...base, '--covers', 'docs/ratchet.json', '--expires', '2026-11-01').status, 0);
});

test('T11 EXPIRED: an open waiver past its date fails verify; closing it, or renewing it, clears it', () => {
  const P = proj(); P.decide('add', '--kind', 'waiver', '--role', 'tech lead', '--covers', 'docs/ratchet.json', '--expires', '2026-10-20', '--why', 'floor waived until the migration lands');
  assert.equal(P.verify('2026-10-10').status, 0); assert.match(out(P.verify('2026-10-10')), /EXPIRING-SOON D-0001/);
  const late = P.verify('2026-10-21'); assert.equal(late.status, 1); assert.match(out(late), /EXPIRED D-0001: waiver expired on 2026-10-20/);
  assert.match(out(P.decide('list', '--open')), /D-0001/);
  const r = P.decide('add', '--kind', 'waiver', '--role', 'tech lead', '--covers', 'docs/ratchet.json', '--expires', '2026-11-15', '--closes', 'D-0001', '--why', 'renewed once, migration slipped');
  assert.equal(r.status, 0, out(r));
  assert.equal(P.verify('2026-10-21').status, 0, out(P.verify('2026-10-21')));
  assert.equal(P.verify('2026-11-16').status, 1);
  assert.equal(P.decide('add', '--kind', 'other', '--role', 'x', '--ref', 'closing', '--closes', 'D-0002', '--why', 'the migration landed, floor restored').status, 0);
  assert.equal(P.verify('2027-01-01').status, 0, out(P.verify('2027-01-01')));
  assert.match(out(P.decide('add', '--kind', 'other', '--role', 'x', '--ref', 'again', '--closes', 'D-0002', '--why', 'closing twice is wrong here')), /already closed/);
  assert.match(out(P.decide('add', '--kind', 'other', '--role', 'x', '--ref', 'again', '--closes', 'D-0099', '--why', 'closing something absent')), /no such entry/);
});

test('T12 WAIVER-NO-CHANGE: a waiver whose content no commit or file ever had is reported; one that matches a commit passes', () => {
  const P = proj();
  P.w('docs/ratchet.json', '{ "tests_min": 1 }\n');
  P.decide('add', '--kind', 'waiver', '--role', 'tech lead', '--covers', 'docs/ratchet.json', '--expires', '2026-11-01', '--why', 'floor lowered once for the spike');
  assert.equal(P.verify().status, 0, out(P.verify()));            // the working file has that content
  P.w('docs/ratchet.json', '{ "tests_min": 2 }\n');               // ... and now it does not, and no commit ever had it
  const v = P.verify(); assert.equal(v.status, 1); assert.match(out(v), /WAIVER-NO-CHANGE D-0001/);
  P.w('docs/ratchet.json', '{ "tests_min": 1 }\n'); P.commit('chore: lower the floor for the spike'); P.w('docs/ratchet.json', '{ "tests_min": 2 }\n');
  assert.equal(P.verify().status, 0, out(P.verify()));            // a commit had it: the history shows the change
  const Q = proj(); const head = Q.g('rev-parse', 'HEAD').stdout.trim();
  assert.match(out(Q.decide('add', '--kind', 'waiver', '--role', 'x', '--commit', 'deadbeef', '--expires', '2026-11-01', '--why', 'a commit that does not exist')), /no such commit/);
  assert.equal(Q.decide('add', '--kind', 'waiver', '--role', 'x', '--commit', head, '--expires', '2026-11-01', '--why', 'the initial files commit is waived').status, 0);
  assert.equal(Q.verify().status, 0, out(Q.verify()));
});

// ---------- protected paths (unit) ----------
test('T13 the protected classes: spec root, gate and hook and CI and linter configuration, ratchet floor, waiver list; ordinary files are not', async () => {
  const m = await import(pathToFileURL(DECIDE).href), cfg = m.loadConfig(mkdtempSync(join(tmpdir(), 'gsdec-cfg-')));
  const cls = p => m.protectedClass(p, cfg);
  for (const p of ['CLAUDE.md', 'AGENTS.md', 'docs/spec/SPEC.md', 'docs/spec/sub/F-001.md', 'SPEC.md', 'docs/spec.lock']) assert.equal(cls(p), 'spec', p);
  for (const p of ['.githooks/pre-commit', '.github/workflows/ci.yml', '.gitlab-ci.yml', '.eslintrc.json', 'web/.eslintrc.cjs', 'eslint.config.mjs', 'ruff.toml', 'scripts/gate.js', '.gs.json', 'tools/gs-lock/gs-lock.mjs', 'tools/gs-decide/gs-decide-hook.mjs', 'CODEOWNERS', '.husky/pre-push']) assert.equal(cls(p), 'gate', p);
  for (const p of ['docs/ratchet.json', 'quality/floor.yml', 'baseline.json', 'ci/coverage-ratchet.toml']) assert.equal(cls(p), 'ratchet', p);
  for (const p of ['docs/waivers.md', '.gs-waivers.json']) assert.equal(cls(p), 'waiver', p);
  for (const p of ['docs/decisions.log.md', 'docs/ratifications.md']) assert.equal(cls(p), 'record', p);
  for (const p of ['src/ledger.js', 'README.md', 'docs/architecture.md', 'tests/a.test.js', 'package-lock.json', 'floor-plan.png', 'docs/decisions/0001-x.md']) assert.equal(cls(p), null, p);
});

test('T14 the embedded lists agree with gs-check (its sentinels, spec files, spec folders, ratchet names) when gs-check is available', async (t) => {
  if (!existsSync(CHECK_JS)) return t.skip('gs-check not found (set GS_CHECK_JS or put the tools side by side)');
  const { defaultConfig: c } = await import(pathToFileURL(CHECK_JS).href), m = await import(pathToFileURL(DECIDE).href);
  const cfg = m.loadConfig(mkdtempSync(join(tmpdir(), 'gsdec-cfg-')));
  for (const s of c.sentinelCandidates) assert.equal(m.protectedClass(s.replace(/\/rules$/, '/rules/x'), cfg), 'spec', s);
  for (const s of c.specCandidates) assert.equal(m.protectedClass(s, cfg), 'spec', s);
  for (const d of c.specDirs) assert.equal(m.protectedClass(d + '/x.md', cfg), 'spec', d);
  assert.equal(m.RATCHET_NAME.source, c.ratchetFileNames); assert.equal(m.protectedClass('docs/ratchet.json', cfg), 'ratchet');
});

test('T15 .gs.json decide.protect adds a path and decide.unprotect removes one', () => {
  const P = proj(); P.w('.gs.json', JSON.stringify({ decide: { protect: ['config/prod.yaml'], unprotect: ['CLAUDE.md'] } })); P.approve('.gs.json', 'gate'); P.commit('chore: config');
  P.w('config/prod.yaml', 'a: 1\n'); const r = P.try('chore: add prod config'); assert.equal(r.status, 1); assert.match(out(r), /config\/prod\.yaml \(configured\)/);
  P.w('CLAUDE.md', '# changed\n'); P.rm('config/prod.yaml'); const q = P.try('docs: edit the sentinel'); assert.equal(q.status, 0, out(q));
});

// ---------- the hook ----------
test('T16 HOOK: an unprotected change passes, with no log at all', () => {
  const P = proj(); P.w('src/ledger.js', 'exports.balance = a => a.length;\n'); P.w('README.md', '# Ledger v2\n');
  const r = P.try('feat: change the balance (AC-001)'); assert.equal(r.status, 0, out(r)); assert.match(out(r), /no protected path touched/);
});

test('T17 HOOK refuses a spec change without an entry, then accepts it with one (same commit)', () => {
  const P = proj(); P.w('docs/spec/SPEC.md', SPEC + '- [ ] AC-003 A non-integer entry throws.\n');
  const red = P.try('docs: add AC-003'); assert.equal(red.status, 1); assert.match(out(red), /docs\/spec\/SPEC\.md \(spec\) changed with no ratification entry/);
  assert.match(out(red), /COMMIT REFUSED/);
  P.approve('docs/spec/SPEC.md', 'spec', 'AC-003 is the agreed behaviour for bad input');
  const green = P.try('docs: add AC-003'); assert.equal(green.status, 0, out(green)); assert.match(out(green), /docs\/spec\/SPEC\.md \(entry\)/);
  assert.match(P.g('log', '-1', '--format=%s').stdout, /add AC-003/);
});

test('T18 HOOK: an entry approves THAT content; editing the file after the approval, or approving another path, does not count', () => {
  const P = proj(); P.w('docs/ratchet.json', '{ "tests_min": 5 }\n'); P.approve('docs/ratchet.json', 'ratchet');
  P.w('docs/ratchet.json', '{ "tests_min": 1 }\n');   // lowered AFTER being approved at 5
  const r = P.try('chore: change the floor'); assert.equal(r.status, 1); assert.match(out(r), /docs\/ratchet\.json \(ratchet\)/);
  P.w('docs/ratchet.json', '{ "tests_min": 5 }\n'); assert.equal(P.try('chore: raise the floor to five').status, 0);
  P.w('.github/workflows/ci.yml', 'name: ci\non: [pull_request]\n');
  const o = P.try('ci: change the trigger'); assert.equal(o.status, 1); assert.match(out(o), /ci\.yml \(gate\)/);   // the ratchet approval covers another path
});

test('T19 HOOK: an approval from an EARLIER commit counts when the content matches; deleting a protected file needs one too', () => {
  const P = proj(); P.w('.github/workflows/ci.yml', 'name: ci\non: [pull_request]\n'); P.approve('.github/workflows/ci.yml', 'ci');
  P.commit('docs: record the approval first');                   // the entry lands before the change
  assert.equal(P.try('ci: change the trigger').status, 0);
  P.rm('docs/ratchet.json'); const del = P.try('chore: drop the floor file'); assert.equal(del.status, 1); assert.match(out(del), /docs\/ratchet\.json \(ratchet\) changed with no ratification entry for this content \(sha256 deleted\)/);
  P.decide('add', '--kind', 'ratchet', '--role', 'tech lead', '--covers', 'docs/ratchet.json', '--why', 'the floor moves to the new tool next week');
  assert.equal(P.try('chore: drop the floor file').status, 0);
});

test('T20 HOOK: the waiver list and gate/hook/linter configuration are protected', () => {
  const P = proj();
  for (const [rel, text] of [['docs/waivers.md', '- skip E06\n'], ['.githooks/pre-commit', '#!/bin/sh\nexit 0\n'], ['.eslintrc.json', '{}\n'], ['scripts/gate.js', 'process.exit(0)\n']]) {
    P.w(rel, text); const r = P.try('chore: touch ' + rel); assert.equal(r.status, 1, rel); assert.match(out(r), new RegExp(rel.replace(/\./g, '\\.')));
    P.g('reset', '-q', '--hard'); P.g('clean', '-fdq');
  }
});

test('T21 HOOK: the log is append only: an edited old line, a deleted log, or a bad chain is refused', () => {
  const P = proj(); P.approve('CLAUDE.md'); P.commit('docs: first approval');
  P.w('docs/decisions.log.md', logOf(P).replace('reviewed the change', 'x'));
  const r = P.try('docs: tidy the log'); assert.equal(r.status, 1); assert.match(out(r), /append-only: an earlier line was edited|CHAIN-BROKEN/);
  P.g('checkout', '--', 'docs/decisions.log.md'); P.rm('docs/decisions.log.md');
  const d = P.try('docs: remove the log'); assert.equal(d.status, 1); assert.match(out(d), /was deleted: the log is append-only/);
});

test('T22 HOOK: a new entry must be signed with the committer identity', () => {
  const P = proj(); P.approve('CLAUDE.md'); P.w('CLAUDE.md', '# Sentinel\n\nchanged\n');
  P.decide('add', '--kind', 'spec', '--role', 'x', '--covers', 'CLAUDE.md', '--why', 'recorded under maria and committed by someone else');
  P.g('config', 'user.email', 'bob@example.com'); P.g('config', 'user.name', 'Bob Committer');
  const r = P.try('docs: edit the sentinel'); assert.equal(r.status, 1); assert.match(out(r), /signed by Maria Ratifier <maria@example.com> but the commit is by bob@example\.com/);
  P.w('.gs.json', JSON.stringify({ decide: { allowOtherSigner: true } }));
  assert.match(out(P.try('docs: edit the sentinel')), /\.gs\.json \(gate\) changed with no ratification/);   // the config file is itself protected
  P.approve('.gs.json', 'gate');
});

test('T23 HOOK: AI co-author trailer: an agent-suspected entry does not approve; a human entry does; a lone AI-recorded entry is flagged', () => {
  const P = proj(); P.w('docs/spec/SPEC.md', SPEC + '- [ ] AC-003 New behaviour.\n');
  P.decide('add', '--kind', 'spec', '--role', 'tech lead', '--covers', 'docs/spec/SPEC.md', '--agent', '--why', 'recorded by an agent session on the person\'s behalf');
  const trailer = '\n\nCo-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>\n';
  const bad = P.try('docs: add AC-003' + trailer); assert.equal(bad.status, 1); assert.match(out(bad), /AI co-author and the only entry covering it is not human/);
  const plain = P.hook('--msg-file', P.msg('docs: add AC-003')); assert.equal(plain.status, 0); assert.match(out(plain), /agent-suspected entry/);   // no AI trailer: accepted, warned
  P.decide('add', '--kind', 'spec', '--role', 'tech lead', '--covers', 'docs/spec/SPEC.md', '--why', 'I read the diff and AC-003 is what we agreed');
  const ok = P.try('docs: add AC-003' + trailer); assert.equal(ok.status, 0, out(ok));
  // an entry recorded alone in an AI-co-authored commit, nothing protected touched
  const Q = proj(); Q.decide('add', '--kind', 'decision', '--role', 'x', '--ref', 'a plan', '--agent', '--why', 'the agent wrote this one for me');
  const w = Q.try('docs: note a plan' + trailer); assert.equal(w.status, 0, out(w)); assert.match(out(w), /recorded in an AI-co-authored commit and not by a human identity \(flagged\)/);
});

test('T24 HOOK: a "Waiver:" line in the message needs a waiver entry in the same commit', () => {
  const P = proj(); P.w('src/ledger.js', '// changed\n');
  const r = P.try('feat: quick change\n\nWaiver: the criterion lands next sprint'); assert.equal(r.status, 1); assert.match(out(r), /"Waiver:" line.*adds no waiver entry/);
  P.decide('add', '--kind', 'waiver', '--role', 'tech lead', '--covers', 'src/ledger.js', '--expires', '2026-11-01', '--why', 'the criterion lands next sprint');
  assert.equal(P.try('feat: quick change\n\nWaiver: the criterion lands next sprint').status, 0);
});

test('T25 HOOK: docs/spec.lock is satisfied by gs-lock (a ratification line, or additions only), not by a silent hash move; with an AI co-author only a human entry', () => {
  const P = proj({ withLock: true });
  const lock = '# spec.lock\nA src/a.js AC-001 docs/spec/SPEC.md#acceptance-criteria 0123456789abcdef\nS docs/spec/SPEC.md#acceptance-criteria 0123456789abcdef\n';
  P.w('docs/spec.lock', lock); P.approve('docs/spec.lock', 'spec', 'first lock written by gs-lock init'); assert.equal(P.try('chore: add the spec lock').status, 0);
  P.w('docs/spec.lock', lock + 'A src/b.js AC-002 docs/spec/SPEC.md#acceptance-criteria 0123456789abcdef\n');
  const add = P.try('chore: lock one more artifact'); assert.equal(add.status, 0, out(add)); assert.match(out(add), /lock additions only/);
  P.w('docs/spec.lock', lock.replace('0123456789abcdef', 'fedcba9876543210'));
  const moved = P.try('chore: move a hash'); assert.equal(moved.status, 1); assert.match(out(moved), /docs\/spec\.lock \(spec\) changed with no ratification/);
  P.w('docs/ratifications.md', '# Ratifications\n- 2026-10-08T10:00:00Z | Maria Ratifier <maria@example.com> | src/a.js | AC-001 | docs/spec/SPEC.md#acceptance-criteria | 0123456789abcdef -> fedcba9876543210 | wording only change\n');
  const rat = P.try('chore: ratify the hash'); assert.equal(rat.status, 0, out(rat)); assert.match(out(rat), /gs-lock ratification/);
  P.w('docs/spec.lock', lock.replace('0123456789abcdef', 'aaaaaaaaaaaaaaaa'));
  P.w('docs/ratifications.md', P.read('docs/ratifications.md') + '- 2026-10-08T11:00:00Z | Maria Ratifier <maria@example.com> | src/a.js | AC-001 | docs/spec/SPEC.md#acceptance-criteria | fedcba9876543210 -> aaaaaaaaaaaaaaaa | another wording change\n');
  const ai = P.try('chore: ratify again\n\nCo-Authored-By: Claude <noreply@anthropic.com>'); assert.equal(ai.status, 1); assert.match(out(ai), /AI co-author/);
});

test('T26 INTEROP with gs-lock: its ratifications are listed (read only), editing them is caught, and a real gs-lock ratify flows through the hook', () => {
  const P = proj({ withLock: true });
  P.w('docs/spec/F-001.md', '# F-001 balance\n\n## Rule\n\nThe balance sums the entries.\n'); P.w('src/ledger.js', '// @gs F-001 docs/spec/F-001.md#rule\nexports.balance = a => a.reduce((x, y) => x + y, 0);\n');
  P.w('.gs.json', '{}\n');
  assert.equal(P.lock('init').status, 0); P.commit('chore: spec, tag and lock');
  P.w('docs/spec/F-001.md', '# F-001 balance\n\n## Rule\n\nThe balance sums the entries, ignoring nulls.\n');
  assert.equal(P.lock('ratify', 'src/ledger.js', '--reason', 'the artifact already ignores nulls, wording only').status, 0);
  const r = P.try('docs: clarify the rule'); assert.equal(r.status, 1); assert.match(out(r), /docs\/spec\/F-001\.md \(spec\) changed with no ratification entry/);   // the SPEC edit needs a person's entry
  assert.doesNotMatch(out(r), /spec\.lock/);                                                                                   // the lock move is covered by gs-lock's ratification
  P.approve('docs/spec/F-001.md', 'spec', 'the null rule is intended behaviour'); const ok = P.try('docs: clarify the rule'); assert.equal(ok.status, 0, out(ok)); assert.match(out(ok), /spec\.lock \(gs-lock ratification\)/);
  const list = P.decide('list', '--all'); assert.match(out(list), /L-0001 .* lock .* src\/ledger\.js F-001 \| the artifact already ignores nulls/); assert.match(out(list), /D-0001/);
  P.w('docs/ratifications.md', P.read('docs/ratifications.md').replace('wording only', 'nothing'));
  const v = P.verify(); assert.equal(v.status, 1); assert.match(out(v), /RATIFICATIONS-EDITED/);
});

// ---------- the state, the real hook, the CI range ----------
test('T27 UNRATIFIED: protected files nobody approved are reported; baseline adopts them; a later silent edit is reported again', () => {
  const P = proj(); const v0 = P.verify(null, '--require-ratified'); assert.equal(P.verify().status, 0);
  assert.match(out(P.verify()), /NOLOG/);
  P.decide('add', '--kind', 'decision', '--role', 'x', '--ref', 'start the log', '--why', 'the log starts here');
  assert.equal(P.verify().status, 0); assert.match(out(P.verify()), /UNRATIFIED: \d+ protected file\(s\)/);
  assert.equal(P.verify(null, '--require-ratified').status, 1);
  const b = P.decide('add', '--kind', 'baseline', '--role', 'tech lead', '--covers-protected', '--why', 'adopting gs-decide: accept the current protected files'); assert.equal(b.status, 0, out(b));
  assert.ok(P.verify(null, '--require-ratified').status === 0, out(P.verify(null, '--require-ratified')));
  P.w('CLAUDE.md', '# edited without a word\n'); const again = P.verify(null, '--require-ratified'); assert.equal(again.status, 1); assert.match(out(again), /CLAUDE\.md \(spec\)/);
  assert.equal(v0.status, 0);   // no log at all: nothing to fail, only the NOLOG notice
});

test('T28 END TO END with git\'s own commit-msg hook: refused with no entry, accepted with one; --no-verify skips it locally and --range in CI catches the commit', () => {
  const P = proj(); P.approve('CLAUDE.md', 'spec'); P.w('CLAUDE.md', '# Sentinel\n\napproved text\n'); P.decide('add', '--kind', 'spec', '--role', 'x', '--covers', 'CLAUDE.md', '--why', 'the second wording is the approved one');
  P.commit('docs: baseline log and sentinel'); const base = P.g('rev-parse', 'HEAD').stdout.trim();
  mkdirSync(join(P.dir, '.git/hooks'), { recursive: true });
  writeFileSync(join(P.dir, '.git/hooks/commit-msg'), '#!/bin/sh\nnode tools/gs-decide/gs-decide-hook.mjs --msg-file "$1"\n'); chmodSync(join(P.dir, '.git/hooks/commit-msg'), 0o755);
  P.w('docs/ratchet.json', '{ "tests_min": 0 }\n'); P.g('add', '-A');
  const red = P.g('commit', '-q', '-m', 'chore: lower the floor to zero'); assert.notEqual(red.status, 0, out(red)); assert.match(out(red), /COMMIT REFUSED/);
  assert.match(P.g('log', '-1', '--format=%s').stdout, /baseline log/);
  const bypass = P.g('commit', '-q', '--no-verify', '-m', 'chore: lower the floor to zero'); assert.equal(bypass.status, 0, out(bypass));
  const ci = P.hook('--range', `${base}..HEAD`); assert.equal(ci.status, 1); assert.match(out(ci), /lower the floor to zero/); assert.match(out(ci), /docs\/ratchet\.json \(ratchet\)/);
  P.g('reset', '-q', '--hard', base); P.w('docs/ratchet.json', '{ "tests_min": 0 }\n'); P.approve('docs/ratchet.json', 'ratchet', 'lowering the floor for the spike, ratified by me'); P.g('add', '-A');
  const green = P.g('commit', '-q', '-m', 'chore: lower the floor to zero'); assert.equal(green.status, 0, out(green));
  assert.equal(P.hook('--range', `${base}..HEAD`).status, 0, out(P.hook('--range', `${base}..HEAD`)));
});

test('T29 --range judges each commit with the log AS OF that commit (an entry added only later does not excuse an earlier commit)', () => {
  const P = proj(); P.approve('CLAUDE.md'); P.commit('docs: log'); const base = P.g('rev-parse', 'HEAD').stdout.trim();
  P.w('docs/ratchet.json', '{ "tests_min": 9 }\n'); P.commit('chore: raise the floor without a record');
  P.approve('docs/ratchet.json', 'ratchet', 'recorded afterwards, too late for the earlier commit'); P.commit('docs: record the floor');
  const r = P.hook('--range', `${base}..HEAD`); assert.equal(r.status, 1); assert.match(out(r), /raise the floor without a record/); assert.match(out(r), /ok decisions hook .*record the floor/);
  assert.equal(P.hook('--commit', 'HEAD').status, 0);
});

test('T30 --pre-push reads git\'s stdin lines and judges the pushed commits', () => {
  const P = proj(); P.approve('CLAUDE.md'); P.commit('docs: log'); const base = P.g('rev-parse', 'HEAD').stdout.trim();
  P.w('docs/ratchet.json', '{ "tests_min": 9 }\n'); P.commit('chore: raise the floor without a record'); const head = P.g('rev-parse', 'HEAD').stdout.trim();
  const r = spawnSync(process.execPath, [HOOK, '--pre-push'], { cwd: P.dir, encoding: 'utf8', env: env({ GS_DECIDE_TODAY: TODAY }), input: `refs/heads/main ${head} refs/heads/main ${base}\n` });
  assert.equal(r.status, 1, out(r)); assert.match(out(r), /COMMIT REFUSED/);
  const del = spawnSync(process.execPath, [HOOK, '--pre-push'], { cwd: P.dir, encoding: 'utf8', env: env(), input: `(delete) ${'0'.repeat(40)} refs/heads/x ${base}\n` }); assert.equal(del.status, 0, out(del));
});

test('T31 an entry whose expiry has passed no longer approves a change (the hook uses the commit date in --range)', () => {
  const P = proj(); P.w('docs/ratchet.json', '{ "tests_min": 1 }\n');
  P.decide('add', '--kind', 'waiver', '--role', 'tech lead', '--covers', 'docs/ratchet.json', '--expires', '2026-10-09', '--why', 'floor waived for one day while the spike lands');
  assert.equal(P.try('chore: lower the floor for the spike').status, 0);
  P.w('docs/ratchet.json', '{ "tests_min": 2 }\n'); P.w('src/x.js', '1\n');
  P.g('add', '-A'); assert.equal(spawnSync(process.execPath, [HOOK, '--msg-file', P.msg('chore: restore the floor')], { cwd: P.dir, encoding: 'utf8', env: env({ GS_DECIDE_TODAY: '2026-10-10' }) }).status, 1);
});

test('T32 CLI: usage errors exit 2; protected and verify --json run; a non-repo is handled', () => {
  const P = proj();
  assert.equal(P.decide().status, 2); assert.equal(P.decide('nonsense').status, 2);
  assert.ok(JSON.parse(out(P.decide('protected', '--json'))).gate.includes('.githooks/**'));
  assert.equal(JSON.parse(out(P.verify(null, '--json'))).ok, true);
  const dir = mkdtempSync(join(tmpdir(), 'gsdec-nogit-')); const r = spawnSync(process.execPath, [HOOK, '--root', dir], { encoding: 'utf8', env: env() });
  assert.equal(r.status, 2); assert.match(out(r), /not a git repository/);
  rmSync(dir, { recursive: true, force: true });
});
