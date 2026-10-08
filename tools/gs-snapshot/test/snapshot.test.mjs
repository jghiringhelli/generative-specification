// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Juan Carlos Ghiringhelli, PragmaWorks
// Tests of gs-snapshot.mjs. No model, no network. Hand-built projects copied from the known-good controls of gs-check (test/fixtures).
// Run: node --test tools/gs-snapshot/test   (Windows, Linux container). The real-checker test runs only when gs-check and its fixture builder
// are found (GS_CHECK_JS, or tools/gs-check next to this tool); it takes minutes. Scenarios are named S<n>.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, mkdirSync, copyFileSync, existsSync, readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url)), TOOL = join(HERE, '..'), SNAP = join(TOOL, 'gs-snapshot.mjs');
const FIX = join(HERE, 'fixtures'), LOCK_DIR = join(HERE, 'vendor', 'gs-lock');
const DECIDE_DIR = existsSync(join(TOOL, '..', 'gs-decide', 'gs-decide.mjs')) ? join(TOOL, '..', 'gs-decide') : null;
const CHECK_JS = process.env.GS_CHECK_JS || join(TOOL, '..', 'gs-check', 'gs-check.mjs');
const env = (extra = {}) => { const e = { ...process.env }; for (const k of Object.keys(e)) if (/^(NODE_TEST_CONTEXT|GIT_.*|GS_.*|CLAUDECODE|CLAUDE_CODE_ENTRYPOINT)$/.test(k)) delete e[k]; return { ...e, ...extra }; };
const out = r => (r.stdout || '') + (r.stderr || '');
const copy = (src, dst) => { mkdirSync(dst, { recursive: true }); for (const e of readdirSync(src, { withFileTypes: true })) { const s = join(src, e.name), d = join(dst, e.name); if (e.isDirectory()) copy(s, d); else copyFileSync(s, d); } };

function proj({ gs = false, crlf = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'gssnap-'));
  copy(join(FIX, 'good'), dir); if (gs) { copy(join(FIX, 'good-gs'), dir); mkdirSync(join(dir, 'tools/gs-lock'), { recursive: true }); for (const f of ['gs-lock.mjs', 'gs-cochange.mjs']) copyFileSync(join(LOCK_DIR, f), join(dir, 'tools/gs-lock', f)); }
  const sh = (cmd, args, extra = {}) => spawnSync(cmd, args, { cwd: dir, encoding: 'utf8', env: env(extra.env) });
  const g = (...a) => sh('git', a);
  g('init', '-q', '-b', 'main'); g('config', 'user.email', 'maria@example.com'); g('config', 'user.name', 'Maria Ratifier'); g('config', 'core.autocrlf', 'false'); g('config', 'commit.gpgsign', 'false');
  const P = {
    dir, g, w: (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); },
    read: rel => readFileSync(join(dir, rel), 'utf8'),
    json: date => JSON.parse(readFileSync(join(dir, `docs/snapshots/snapshot-${date}.json`), 'utf8')),
    snap: (...a) => sh(process.execPath, [SNAP, '--root', dir, '--lock', join(LOCK_DIR, 'gs-lock.mjs'), ...a]),
    commit(msg) { g('add', '-A'); const r = g('commit', '-q', '-m', msg, '--no-verify'); assert.equal(r.status, 0, out(r)); },
    gate: (...a) => sh(process.execPath, [join(dir, 'tools/gs-lock/gs-lock.mjs'), ...a]),
    decide: (...a) => sh(process.execPath, [join(DECIDE_DIR, 'gs-decide.mjs'), '--root', dir, ...a], { env: { GS_DECIDE_NOW: '2026-10-01T09:00:00Z', GS_DECIDE_TODAY: '2026-10-01' } }),
  };
  if (gs) assert.equal(P.gate('init').status, 0);
  if (crlf) for (const f of g('ls-files', '-co', '--exclude-standard').stdout.split('\n').filter(f => /\.(md|js|json|yml)$/.test(f))) P.w(f, P.read(f).replace(/\r?\n/g, '\r\n'));
  P.commit('chore: the known-good project');
  return P;
}
const stubCheck = (dir, { fail = false, strictOnly = true } = {}) => { // a stand-in for gs-check: writes the report shape to --out
  const f = join(dir, 'fake-gs-check.mjs');
  writeFileSync(f, `import fs from 'node:fs';const a=process.argv.slice(2);const out=a[a.indexOf('--out')+1];const strict=a.includes('--strict');
if (${fail}) { console.error('boom'); process.exit(2); }
const items=Array.from({length:12},(_,i)=>({id:'E'+String(i+1).padStart(2,'0'),name:'item '+(i+1),status:(i===5&&!strict)?'PARTIAL':(i===9?'PARTIAL':'PASS'),reasons:['/tmp/x'+Math.random()]}));
fs.writeFileSync(out,JSON.stringify({checker:'gs-check',checker_version:'0.4.0-stub',config_sha256:'abc',mode:strict?'strict':'default',head:'x',items,summary:{}}));process.exit(1);\n`);
  return f;
};
const strip = s => { const c = JSON.parse(JSON.stringify(s)); delete c.repo; delete c.previous; delete c.diff; delete c.drift; delete c.line; delete c.decisions; delete c.project; return c; };

test('S1 a hand-built project: criteria, tests, ratchet, spec digest and the line, with the checker skipped and said so', () => {
  const P = proj(); const r = P.snap('--date', '2026-10-01', '--no-check'); assert.equal(r.status, 0, out(r));
  const s = P.json('2026-10-01');
  assert.equal(s.schema, 'gs-snapshot/1'); assert.equal(s.date, '2026-10-01'); assert.equal(s.criteria.total, 5); assert.equal(s.criteria.ticked, 0);
  assert.deepEqual(s.criteria.ids, ['AC-001', 'AC-002', 'AC-003', 'AC-004', 'AC-005']); assert.deepEqual(s.criteria.uncited, []); assert.equal(s.criteria.share_cited_by_test, 1);
  assert.equal(s.spec.requirements, 3); assert.equal(s.spec.open_questions, 0); assert.deepEqual(s.spec.files, ['docs/spec/SPEC.md']); assert.match(s.spec.digest, /^[0-9a-f]{12}$/); assert.equal(s.spec.version, null);
  assert.equal(s.tests.cases, 6); assert.equal(s.tests.files, 1); assert.equal(s.tests.run, null);
  assert.deepEqual(s.ratchet.map(x => [x.file, x.key, x.floor, x.current, x.status]), [['docs/ratchet.json', 'tests_min', 6, 6, 'ok']]);
  assert.equal(s.checker.status, 'SKIPPED'); assert.match(s.checker.note, /not judged/);
  assert.match(s.line, /^level n\/a · score n\/a @ rubric n\/a @ [0-9a-f]{7} @ spec unversioned-[0-9a-f]{8} @ 2026-10-01 \| checker SKIPPED$/);
  assert.equal(s.repo.uncommitted_files, 0); assert.equal(s.previous, null); assert.equal(s.diff, null); assert.match(s.not, /not an audit status/);
  const md = P.read('docs/snapshots/snapshot-2026-10-01.md');
  assert.match(md, /^# Snapshot of ledger-fixture as of 2026-10-01/); assert.match(md, /## What this is NOT/); assert.match(md, /cannot detect a wrong spec/); assert.match(md, /this is the baseline/);
  assert.match(out(r), /written: docs[\\/]snapshots[\\/]snapshot-2026-10-01\.md/);
});

test('S2 deterministic: the same state and date give identical bytes, twice', () => {
  const P = proj(); P.snap('--date', '2026-10-01', '--no-check'); const a = [P.read('docs/snapshots/snapshot-2026-10-01.md'), P.read('docs/snapshots/snapshot-2026-10-01.json')];
  P.snap('--date', '2026-10-01', '--no-check'); assert.deepEqual([P.read('docs/snapshots/snapshot-2026-10-01.md'), P.read('docs/snapshots/snapshot-2026-10-01.json')], a);
  assert.doesNotMatch(a[1], /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);   // no wall-clock time anywhere
  assert.equal(P.g('status', '--porcelain').stdout.includes('docs/snapshots'), true);   // the snapshot folder is the only thing it wrote
  assert.equal(P.snap('--date', '2026-10-01', '--no-check', '--dry-run').status, 0);
});

test('S3 a missing checker is SAID, not guessed (the tool is run from a folder with no sibling gs-check)', () => {
  const P = proj(); const iso = mkdtempSync(join(tmpdir(), 'gssnap-tool-')); mkdirSync(join(iso, 'a/b/tools/gs-snapshot'), { recursive: true });
  copyFileSync(SNAP, join(iso, 'a/b/tools/gs-snapshot/gs-snapshot.mjs'));
  const r = spawnSync(process.execPath, [join(iso, 'a/b/tools/gs-snapshot/gs-snapshot.mjs'), '--root', P.dir, '--date', '2026-10-01'], { encoding: 'utf8', env: env() });
  assert.equal(r.status, 0, out(r)); const s = P.json('2026-10-01'); assert.equal(s.checker.status, 'ABSENT'); assert.match(s.checker.note, /gs-check was not found.*NOT judged/);
  assert.match(s.line, /checker ABSENT/); assert.match(out(r), /note: gs-check was not found/); assert.equal(s.decisions.available, false); assert.match(s.decisions.note, /gs-decide was not found/);
  assert.match(P.read('docs/snapshots/snapshot-2026-10-01.md'), /Not judged: gs-check was not found/);
  assert.equal(P.snap('--date', '2026-10-02', '--no-check', '--fail-on-check').status, 1);   // --fail-on-check: not all PASS
  rmSync(iso, { recursive: true, force: true });
});

test('S4 the checker is run in STRICT mode and its 12 items are reported without paths or timings', () => {
  const P = proj(); const stub = stubCheck(P.dir); const r = P.snap('--date', '2026-10-01', '--check', stub); assert.equal(r.status, 0, out(r));
  const s = P.json('2026-10-01'); assert.equal(s.checker.status, 'RAN'); assert.equal(s.checker.mode, 'strict'); assert.equal(s.checker.items.length, 12); assert.equal(s.checker.summary.pass, 11); assert.equal(s.checker.summary.partial, 1);
  assert.deepEqual(Object.keys(s.checker.items[0]), ['id', 'name', 'status']); assert.equal(s.checker.items[9].status, 'PARTIAL'); assert.equal(s.checker.items[5].status, 'PASS');   // item 6 is PARTIAL only in default mode
  assert.match(s.line, /checker strict 11\/12 PASS/); assert.doesNotMatch(JSON.stringify(s.checker), /\/tmp\/x/);
  P.snap('--date', '2026-10-01', '--check', stub); assert.deepEqual(P.json('2026-10-01'), s);   // random strings in the stub's reasons do not leak: same bytes
  assert.match(P.read('docs/snapshots/snapshot-2026-10-01.md'), /\| E10 \| PARTIAL \| item 10 \|/);
});

test('S5 a checker that fails to produce a report is reported as ERROR; a saved report can be handed over (--check-report)', () => {
  const P = proj(); const bad = stubCheck(P.dir, { fail: true }); P.snap('--date', '2026-10-01', '--check', bad);
  assert.equal(P.json('2026-10-01').checker.status, 'ERROR'); assert.match(P.json('2026-10-01').checker.note, /no report \(exit 2\).*boom/);
  const rep = join(P.dir, 'report.json'); writeFileSync(rep, JSON.stringify({ mode: 'strict', checker_version: '0.4.0', items: [{ id: 'E02', name: 'sentinel', status: 'PASS' }, { id: 'E01', name: 'spec', status: 'ABSENT' }] }));
  P.snap('--date', '2026-10-02', '--check-report', rep); const s = P.json('2026-10-02'); assert.equal(s.checker.status, 'RAN'); assert.deepEqual(s.checker.items.map(i => i.id), ['E01', 'E02']); assert.equal(s.checker.summary.absent, 1);
  writeFileSync(rep, JSON.stringify({ mode: 'default', items: [] })); P.snap('--date', '2026-10-03', '--check-report', rep); assert.match(P.json('2026-10-03').checker.note, /NOT strict mode/);
});

test('S6 criteria and tests: an uncited criterion, an open-question marker, ticked boxes and test cases are counted', () => {
  const P = proj(); let spec = P.read('docs/spec/SPEC.md');
  spec = spec.replace('- [ ] AC-002', '- [x] AC-002').replace('## Open questions\n\nNone.', '## Open questions\n\nOPEN: should a zero entry be rejected?\n') + '\n## Acceptance scenarios\n\n- [ ] AC-006 The largest debit of an empty list is 0.\n';
  P.w('docs/spec/SPEC.md', spec); P.commit('docs: add AC-006 and an open question');
  P.snap('--date', '2026-10-01', '--no-check'); const s = P.json('2026-10-01');
  assert.equal(s.criteria.total, 6); assert.equal(s.criteria.ticked, 1); assert.deepEqual(s.criteria.uncited, ['AC-006']); assert.equal(s.spec.open_questions, 1); assert.match(s.spec.open_marks[0], /docs\/spec\/SPEC\.md:\d+/);
  assert.equal(s.criteria.share_cited_by_test, 0.833); assert.equal(s.criteria.in_coverage_file.rows.length, 5);
  assert.match(P.read('docs/snapshots/snapshot-2026-10-01.md'), /No test file cites: AC-006/);
});

test('S7 ratchet floors against the measurable value: BELOW FLOOR is shown; a floor the tool cannot measure is "unknown", not guessed', () => {
  const P = proj(); P.w('docs/ratchet.json', JSON.stringify({ tests_min: 9, duplicated_lines_max: 120, nested: { complexity_max: 10 } })); P.commit('chore: floors');
  P.snap('--date', '2026-10-01', '--no-check'); const s = P.json('2026-10-01');
  const by = Object.fromEntries(s.ratchet.map(r => [r.key, r]));
  assert.equal(by.tests_min.status, 'BELOW FLOOR'); assert.equal(by.tests_min.current, 6); assert.equal(by.duplicated_lines_max.status, 'unknown'); assert.equal(by.duplicated_lines_max.current, null); assert.equal(by.duplicated_lines_max.direction, 'lower-is-better'); assert.equal(by['nested.complexity_max'].floor, 10);
});

test('S8 the lock is checked through gs-lock: CURRENT, then FAILING after a spec section changes; without a lock file, NOLOCK', () => {
  const P = proj({ gs: true }); P.snap('--date', '2026-10-01', '--no-check'); let s = P.json('2026-10-01');
  assert.equal(s.lock.status, 'CURRENT', JSON.stringify(s.lock)); assert.ok(s.lock.artifacts >= 2);
  P.w('docs/spec/SPEC.md', P.read('docs/spec/SPEC.md').replace('is 6', 'is six')); P.commit('docs: reword AC-001');
  P.snap('--date', '2026-10-02', '--no-check'); s = P.json('2026-10-02'); assert.equal(s.lock.status, 'FAILING'); assert.ok(s.lock.findings_by_status.STALE >= 1);
  const Q = proj(); Q.snap('--date', '2026-10-01', '--no-check'); assert.equal(Q.json('2026-10-01').lock.status, 'NOLOCK');
  const R = proj({ gs: true }); R.snap('--date', '2026-10-01', '--no-check', '--lock', join(R.dir, 'does-not-exist.mjs')); assert.ok(['CURRENT', 'NOT-VERIFIED'].includes(R.json('2026-10-01').lock.status));
});

test('S9 decisions and ratifications are read from gs-decide (and gs-lock\'s record): entries, an open waiver, the chain head', { skip: !DECIDE_DIR }, () => {
  const P = proj({ gs: true });
  assert.equal(P.decide('add', '--kind', 'spec', '--role', 'product owner', '--covers', 'docs/spec/SPEC.md', '--why', 'the criteria are what we agreed').status, 0);
  assert.equal(P.decide('add', '--kind', 'waiver', '--role', 'tech lead', '--covers', 'docs/ratchet.json', '--expires', '2026-10-20', '--why', 'floor waived for a spike').status, 0);
  P.w('docs/ratifications.md', '# R\n- 2026-10-01T09:00:00Z | Maria Ratifier <maria@example.com> | src/a.js | AC-001 | docs/spec/SPEC.md#acceptance-criteria | aaaaaaaaaaaaaaaa -> bbbbbbbbbbbbbbbb | wording only\n');
  P.commit('docs: record decisions'); P.snap('--date', '2026-10-05', '--no-check'); const d = P.json('2026-10-05').decisions;
  assert.equal(d.available, true); assert.equal(d.entries.length, 2); assert.equal(d.chain_ok, true); assert.match(d.chain_head, /^[0-9a-f]{64}$/); assert.equal(d.open_waivers.length, 1); assert.equal(d.open_waivers[0].expires, '2026-10-20');
  assert.equal(d.gs_lock_ratifications.count, 1); assert.equal(d.expired, 0); assert.equal(d.entries[0].who, 'Maria Ratifier <maria@example.com>');
  const md = P.read('docs/snapshots/snapshot-2026-10-05.md'); assert.match(md, /Open waivers and risks: 1 \(D-0002 until 2026-10-20\)/); assert.match(md, /gs-lock ratifications \(docs\/ratifications\.md\): 1/);
  P.snap('--date', '2026-10-25', '--no-check'); const late = P.json('2026-10-25').decisions; assert.equal(late.expired, 1); assert.ok(late.findings.some(f => f.code === 'EXPIRED' && f.level === 'fail'));
});

test('S10 a tampered decisions log is shown: chain_ok false in the snapshot, and the next diff says the earlier entries changed', { skip: !DECIDE_DIR }, () => {
  const P = proj(); P.decide('add', '--kind', 'spec', '--role', 'po', '--covers', 'docs/spec/SPEC.md', '--why', 'the criteria are what we agreed');
  P.decide('add', '--kind', 'decision', '--role', 'po', '--ref', 'plan', '--why', 'a plan without any file at all'); P.commit('docs: log'); P.snap('--date', '2026-10-01', '--no-check');
  P.w('docs/decisions.log.md', P.read('docs/decisions.log.md').replace('what we agreed', 'what nobody agreed')); P.commit('docs: quietly edit the log'); P.snap('--date', '2026-10-02', '--no-check');
  const s = P.json('2026-10-02'); assert.equal(s.decisions.chain_ok, false); assert.equal(s.diff.decisions.chain_extends_previous, false);
  assert.match(P.read('docs/snapshots/snapshot-2026-10-02.md'), /NOT the same as in the previous snapshot \(the log was rewritten\)/); assert.match(P.read('docs/snapshots/snapshot-2026-10-02.md'), /DOES NOT VERIFY/);
});

test('S11 drift and DIFF between two dates: spec, criteria, tests, floors (raised and lowered), dependencies, decisions, KPIs', { skip: !DECIDE_DIR }, () => {
  const P = proj(); const kpi1 = join(P.dir, 'kpi1.json'); writeFileSync(kpi1, JSON.stringify([{ name: 'lead time', value: 9, unit: 'days', source: 'jira export 2026-09', measured_by: 'PM' }]));
  P.snap('--date', '2026-10-01', '--no-check', '--kpi', kpi1); const a = P.json('2026-10-01');
  P.w('docs/spec/SPEC.md', P.read('docs/spec/SPEC.md') + '\n## More acceptance criteria\n\n- [ ] AC-006 A new rule.\n- [ ] AC-007 Another new rule.\n'); P.commit('docs: AC-006 and AC-007');
  P.w('tests/more.test.js', "const test = require('node:test');\ntest('AC-006 holds', () => {});\ntest('AC-001 again', () => {});\n"); P.commit('test: cover AC-006');
  P.w('docs/ratchet.json', '{ "tests_min": 8 }\n'); P.commit('chore: raise the floor');
  const pj = JSON.parse(P.read('package.json')); pj.dependencies = { zod: '^3.0.0' }; pj.devDependencies = { eslint: '^9.0.0' }; P.w('package.json', JSON.stringify(pj, null, 2) + '\n'); P.commit('chore: add dependencies');
  P.decide('add', '--kind', 'spec', '--role', 'po', '--covers', 'docs/spec/SPEC.md', '--why', 'AC-006 and AC-007 are agreed'); P.commit('docs: record the decision');
  const kpi2 = join(P.dir, 'kpi2.json'); writeFileSync(kpi2, JSON.stringify({ kpis: [{ name: 'lead time', value: 6, unit: 'days', source: 'jira export 2026-10', measured_by: 'PM' }, { name: 'defects', value: 3 }] }));
  P.snap('--date', '2026-10-08', '--no-check', '--kpi', kpi2); const b = P.json('2026-10-08'), d = b.diff;
  assert.equal(b.drift.commits, 5); assert.equal(b.drift.since, '2026-10-01'); assert.ok(b.drift.by_class.spec >= 1); assert.ok(b.drift.protected_changed.spec.some(x => x.includes('docs/spec/SPEC.md'))); assert.ok(b.drift.protected_changed.ratchet.some(x => x.includes('docs/ratchet.json')));
  assert.match(b.line, /5 commit\(s\) since 2026-10-01/); assert.equal(d.days, 7); assert.equal(d.same_spec_version, false);
  assert.deepEqual(d.criteria.ids.added, ['AC-006', 'AC-007']); assert.deepEqual(d.criteria.total, [5, 7]); assert.deepEqual(d.tests.cases, [6, 8]); assert.deepEqual(d.criteria.cited_by_test, [5, 6]);
  assert.deepEqual(d.ratchet.map(r => [r.key, r.from, r.to, r.move]), [['docs/ratchet.json tests_min', 6, 8, 'raised (tightened)']]);
  assert.ok(d.dependencies.manifests['package.json'].added.includes('zod')); assert.ok(d.dependencies.manifests['package.json'].added.some(x => /eslint/.test(x)));
  assert.equal(d.decisions.new_entries.length, 1); assert.equal(d.decisions.new_entries[0].id, 'D-0001'); assert.equal(d.decisions.chain_extends_previous, true);
  assert.deepEqual(d.kpis.map(k => [k.name, k.from?.value ?? null, k.to?.value ?? null]), [['defects', null, 3], ['lead time', 9, 6]]);
  const md = P.read('docs/snapshots/snapshot-2026-10-08.md'); assert.match(md, /## Changes between 2026-10-01 \(.{7}\) and 2026-10-08/); assert.match(md, /The spec changed between the two snapshots/); assert.match(md, /added: AC-006, AC-007/);
  assert.match(md, /docs\/ratchet\.json tests_min: 6 -> 8 \(raised \(tightened\)\)/); assert.match(md, /lead time: 9 days -> 6 days \(source: jira export 2026-10\)/); assert.match(md, /defects: not reported -> 3 \(source: NONE GIVEN\)/);
  // lowering a floor is called out
  P.w('docs/ratchet.json', '{ "tests_min": 2 }\n'); P.commit('chore: lower the floor'); P.snap('--date', '2026-10-09', '--no-check');
  assert.equal(P.json('2026-10-09').diff.ratchet[0].move, 'LOWERED (loosened)'); assert.match(P.read('docs/snapshots/snapshot-2026-10-09.md'), /LOWERED \(loosened\)/);
  // the CLI diff of two JSON files gives the same section; latest gives the newest line
  const dd = spawnSync(process.execPath, [SNAP, 'diff', join(P.dir, 'docs/snapshots/snapshot-2026-10-01.json'), join(P.dir, 'docs/snapshots/snapshot-2026-10-08.json')], { encoding: 'utf8', env: env() });
  assert.equal(dd.status, 0, out(dd)); assert.match(dd.stdout, /## Changes between 2026-10-01/); assert.match(dd.stdout, /added: AC-006, AC-007/);
  const lt = spawnSync(process.execPath, [SNAP, 'latest', '--root', P.dir], { encoding: 'utf8', env: env() }); assert.equal(lt.stdout.trim(), P.json('2026-10-09').line);
});

test('S12 a snapshot dated between two others diffs against the one before it; --against overrides; a missing previous commit is said', () => {
  const P = proj(); P.snap('--date', '2026-10-10', '--no-check'); P.snap('--date', '2026-10-05', '--no-check'); assert.equal(P.json('2026-10-05').previous, null);
  P.snap('--date', '2026-10-12', '--no-check'); assert.equal(P.json('2026-10-12').previous.date, '2026-10-10'); assert.equal(P.json('2026-10-12').drift.commits, 0);
  P.snap('--date', '2026-10-13', '--no-check', '--against', 'docs/snapshots/snapshot-2026-10-05.json'); assert.equal(P.json('2026-10-13').previous.date, '2026-10-05');
  const j = P.json('2026-10-10'); j.repo.commit = 'f'.repeat(40); writeFileSync(join(P.dir, 'prev.json'), JSON.stringify(j)); P.snap('--date', '2026-10-14', '--no-check', '--against', 'prev.json');
  assert.match(P.json('2026-10-14').drift.note, /not in this history/);
});

test('S13 KPIs and the audit are SUPPLIED, never computed: absent they are empty/n-a, present they carry their source and the label "supplied"', () => {
  const P = proj(); P.snap('--date', '2026-10-01', '--no-check'); let s = P.json('2026-10-01');
  assert.equal(s.kpis.supplied, false); assert.deepEqual(s.kpis.entries, []); assert.equal(s.audit, null); assert.match(P.read('docs/snapshots/snapshot-2026-10-01.md'), /OPTIONAL FIELD.*never computed or invented/); assert.match(P.read('docs/snapshots/snapshot-2026-10-01.md'), /None supplied/);
  assert.doesNotMatch(s.line, /governed/i); assert.doesNotMatch(P.read('docs/snapshots/snapshot-2026-10-01.md').replace(s.not, ''), /\bgoverned\b/);
  writeFileSync(join(P.dir, 'a.json'), JSON.stringify({ level: 'L3', score: 72, confidence: 6, rubric: 'v1', grades: { Verifiable: 'B', Defended: 'C' }, runs: 2, assessor: 'external', date: '2026-09-30' }));
  writeFileSync(join(P.dir, 'k.json'), JSON.stringify([{ name: 'cost per merged PR', value: 4.2, unit: 'USD' }]));
  P.snap('--date', '2026-10-02', '--no-check', '--audit', 'a.json', '--kpi', 'k.json'); s = P.json('2026-10-02');
  assert.match(s.line, /^L3 \(supplied\) · 72 ± 6 \(supplied\) @ rubric v1 \(supplied\) @ /); assert.equal(s.kpis.entries[0].source_missing, true);
  const md = P.read('docs/snapshots/snapshot-2026-10-02.md'); assert.match(md, /NO SOURCE GIVEN/); assert.match(md, /supplied by a separate audit; this tool did not compute or verify it/); assert.match(md, /grades: Verifiable B, Defended C/);
});

test('S14 CRLF-safe: the same project checked out with CRLF gives the same counts, digest and criteria', () => {
  const A = proj(), B = proj({ crlf: true }); A.snap('--date', '2026-10-01', '--no-check'); B.snap('--date', '2026-10-01', '--no-check');
  const a = strip(A.json('2026-10-01')), b = strip(B.json('2026-10-01')); assert.deepEqual(b.criteria, a.criteria); assert.deepEqual(b.spec, a.spec); assert.deepEqual(b.tests, a.tests); assert.deepEqual(b.ratchet, a.ratchet);
});

test('S15 dependency manifests: package.json, requirements.txt, go.mod, Cargo.toml and lockfile hashes are read; a change is in the diff', () => {
  const P = proj(); P.w('requirements.txt', '# comment\nrequests==2.31.0\nPyYAML>=6\n'); P.w('svc/go.mod', 'module x\n\nrequire (\n\tgithub.com/a/b v1.2.3\n)\n'); P.w('svc/Cargo.toml', '[package]\nname = "x"\n\n[dependencies]\nserde = "1.0"\ntokio = { version = "1.2", features = ["full"] }\n'); P.w('package-lock.json', '{ "lockfileVersion": 3 }\n');
  P.commit('chore: manifests'); P.snap('--date', '2026-10-01', '--no-check'); const m = P.json('2026-10-01').dependencies;
  assert.deepEqual(m.manifests['requirements.txt'], { pyyaml: '>=6', requests: '==2.31.0' }); assert.deepEqual(m.manifests['svc/go.mod'], { 'github.com/a/b': 'v1.2.3' }); assert.deepEqual(m.manifests['svc/Cargo.toml'], { serde: '1.0', tokio: '1.2' });
  assert.match(m.lockfiles['package-lock.json'].sha256, /^[0-9a-f]{16}$/);
  P.w('requirements.txt', 'requests==2.32.0\n'); P.w('package-lock.json', '{ "lockfileVersion": 3, "x": 1 }\n'); P.commit('chore: bump'); P.snap('--date', '2026-10-02', '--no-check'); const d = P.json('2026-10-02').diff.dependencies;
  assert.deepEqual(d.manifests['requirements.txt'], { manifest: 'present', added: [], removed: ['pyyaml'], changed: ['requests ==2.31.0 -> ==2.32.0'] }); assert.deepEqual(d.lockfiles, ['package-lock.json: changed']);
});

test('S16 --run-tests runs the project test command and records the result; without it nothing is executed', () => {
  const P = proj(); P.snap('--date', '2026-10-01', '--no-check'); assert.equal(P.json('2026-10-01').tests.run, null);
  P.snap('--date', '2026-10-02', '--no-check', '--run-tests'); const r = P.json('2026-10-02').tests.run; assert.equal(r.cmd, 'npm test --silent'); assert.equal(r.exit, 0); assert.equal(r.pass, 6); assert.equal(r.fail, 0);
});

test('S17 a folder that is not a git repository still produces a snapshot, with no commit and no drift', () => {
  const dir = mkdtempSync(join(tmpdir(), 'gssnap-nogit-')); copy(join(FIX, 'good'), dir);
  const r = spawnSync(process.execPath, [SNAP, '--root', dir, '--date', '2026-10-01', '--no-check'], { encoding: 'utf8', env: env() }); assert.equal(r.status, 0, out(r));
  const s = JSON.parse(readFileSync(join(dir, 'docs/snapshots/snapshot-2026-10-01.json'), 'utf8')); assert.equal(s.repo.commit, null); assert.match(s.line, /@ no-commit @/); assert.equal(s.criteria.total, 5);
  rmSync(dir, { recursive: true, force: true });
});

test('S18 CLI: a bad date, an unknown command and a missing diff argument exit 2; --dry-run writes nothing', () => {
  const P = proj();
  assert.equal(P.snap('--date', '2026-13-45x').status, 2); assert.equal(P.snap('frobnicate').status, 2);
  assert.equal(spawnSync(process.execPath, [SNAP, 'diff', 'only-one.json'], { encoding: 'utf8', env: env() }).status, 2);
  const r = P.snap('--date', '2026-10-01', '--no-check', '--dry-run'); assert.equal(r.status, 0); assert.match(r.stdout, /^# Snapshot of/); assert.equal(existsSync(join(P.dir, 'docs/snapshots')), false);
  assert.equal(spawnSync(process.execPath, [SNAP, 'latest', '--root', P.dir], { encoding: 'utf8', env: env() }).status, 1);
});

// The real checker, on the known-good control built by gs-check's own fixture builder. Minutes. Skipped when gs-check is not found.
const BUILDER = join(dirname(CHECK_JS), 'test', 'build-fixtures.mjs');
test('S19 the real gs-check in strict mode on the known-good wired project: 12 of 12 PASS in the snapshot', { skip: !(existsSync(CHECK_JS) && existsSync(BUILDER)), timeout: 1500000 }, async () => {
  const { buildGood, cleanup } = await import(pathToFileURL(BUILDER).href); const dir = buildGood({ gs: true });
  try {
    const r = spawnSync(process.execPath, [SNAP, '--root', dir, '--date', '2026-10-01', '--check', CHECK_JS, '--lock', join(dir, 'tools/gs-lock/gs-lock.mjs')], { encoding: 'utf8', env: env(), timeout: 1500000 });
    assert.equal(r.status, 0, out(r)); const s = JSON.parse(readFileSync(join(dir, 'docs/snapshots/snapshot-2026-10-01.json'), 'utf8'));
    assert.equal(s.checker.status, 'RAN'); assert.equal(s.checker.mode, 'strict'); assert.equal(s.checker.summary.pass, 12, JSON.stringify(s.checker.items)); assert.match(s.line, /checker strict 12\/12 PASS/); assert.equal(s.lock.status, 'CURRENT');
  } finally { cleanup(dir); }
});
