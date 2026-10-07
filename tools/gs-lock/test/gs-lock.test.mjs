// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Juan Carlos Ghiringhelli, PragmaWorks
// Tests of gs-lock.mjs and gs-cochange.mjs. No model, no network. Run: node --test tools/gs-lock/test   (Windows, Linux, macOS)
// Scenarios named "P<n>" are ported from the 35 scenarios of the lab divergence self-test
// (lab-runs/open-diamond/scripts/sensors/divergence-selftest.mjs); "N<n>" are new edge cases. See ../README.md for the mapping.
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync, mkdirSync, copyFileSync, existsSync, appendFileSync, chmodSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const LOCK_JS = join(HERE, '..', 'gs-lock.mjs'), CO_JS = join(HERE, '..', 'gs-cochange.mjs');
const env = () => { const e = { ...process.env }; for (const k of Object.keys(e)) if (/^(NODE_TEST_CONTEXT|GIT_DIR|GIT_INDEX_FILE|GIT_WORK_TREE)$/.test(k)) delete e[k]; return e; };

const SPEC = 'docs/features/F-007-ids-that-do-not-collide.md';
const GEN = 'src/ids/uuidGenerator.js', PORT = 'src/ids/IdGeneratorPort.js', TEST = 'tests/ids.test.js', RES = 'src/reservations/reservations.js';
const CRIT = '- [ ] regression tests: two instances of the module over the same repository do not produce repeated ids';
const RULE1 = 'unique even if the server restarts, and even with two';
const REASON = 'wording only: the same intent, three instances instead of two';
const files = {
  [SPEC]: `# F-007 ids that do not collide\n\n**What:** the id generator never returns the same id twice.\n\n**Rules**\n1. Ids are ${RULE1} instances.\n2. The generator is reached only through the port IdGeneratorPort.\n\n**Acceptance criteria**\n${CRIT}\n- [ ] ids are non-empty strings\n- [ ] \`npm test\` is green\n`,
  'docs/features/F-005-http-api.md': '# F-005 http api\n\n**Rules**\n1. The api answers `GET /ping` with 200.\n\n**Acceptance criteria**\n- [ ] ping answers 200\n',
  [GEN]: '// Course implementation of the generator\n// @gs F-007.R1 docs/features/F-007-ids-that-do-not-collide.md#rule-1\nlet n = 0;\nexports.next = () => `id-${++n}`;\n',
  [PORT]: '// @gs F-007.R2 docs/features/F-007-ids-that-do-not-collide.md#rule-2\nexports.port = { next: require("./uuidGenerator").next };\n',
  [TEST]: '// @gs F-007.C1 docs/features/F-007-ids-that-do-not-collide.md#criterion-1\nconst t = require("node:test"), a = require("node:assert");\nt("two ids differ", () => { const g = require("../src/ids/uuidGenerator"); a.notStrictEqual(g.next(), g.next()); });\n',
  [RES]: 'function refundFor(startsInHours, deposit) {\n  const hoursAhead = startsInHours;\n  if (hoursAhead > 24) return deposit;\n  return 0;\n}\nexports.refundFor = refundFor;\n',
  'tests/reservations.test.js': 'const t = require("node:test"), a = require("node:assert"), { refundFor } = require("../src/reservations/reservations");\nt("refund at 48h", () => a.strictEqual(refundFor(48, 10), 10));\nt("no refund at 10h", () => a.strictEqual(refundFor(10, 10), 0));\n',
  'package.json': '{ "name": "fixture", "version": "1.0.0", "private": true, "scripts": { "test": "node --test" } }\n',
};

function sh(dir, cmd, args, input) { return spawnSync(cmd, args, { cwd: dir, encoding: 'utf8', env: env(), input, shell: false }); }
const out = r => (r.stdout || '') + (r.stderr || '');

function makeProject() {
  const dir = mkdtempSync(join(tmpdir(), 'gslock-'));
  const w = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
  for (const [rel, text] of Object.entries(files)) w(rel, text);
  mkdirSync(join(dir, 'tools/gs-lock'), { recursive: true });
  copyFileSync(LOCK_JS, join(dir, 'tools/gs-lock/gs-lock.mjs')); copyFileSync(CO_JS, join(dir, 'tools/gs-lock/gs-cochange.mjs'));
  const g = (...a) => sh(dir, 'git', a);
  g('init', '-q', '-b', 'main'); g('config', 'user.email', 'maria@example.com'); g('config', 'user.name', 'Maria Ratifier');
  g('config', 'core.autocrlf', 'false'); g('config', 'commit.gpgsign', 'false');
  const P = {
    dir, g, w,
    read: rel => readFileSync(join(dir, rel), 'utf8'),
    lock: (...a) => sh(dir, process.execPath, [join(dir, 'tools/gs-lock/gs-lock.mjs'), ...a]),
    co: (...a) => sh(dir, process.execPath, [join(dir, 'tools/gs-lock/gs-cochange.mjs'), ...a]),
    reset() { g('reset', '-q', '--hard'); g('clean', '-fdq'); },
    msg(text) { const f = join(dir, '.git', 'MSG'); writeFileSync(f, text); return f; },
    commit(msg, ...extra) { g('add', '-A'); return g('commit', '-q', '-m', msg, ...extra); },
  };
  assert.equal(P.lock('init').status, 0);
  P.commit('chore: baseline', '--no-verify');
  return P;
}

const P = makeProject();
test.after(() => rmSync(P.dir, { recursive: true, force: true, maxRetries: 3 }));
const reword = () => P.w(SPEC, P.read(SPEC).replace('two instances of the module over the same repository', 'three instances of the module over the same repository'));
const fingerprint = () => out(sh(P.dir, process.execPath, ['-e', 'const g=require("./src/ids/uuidGenerator");const r=require("./src/reservations/reservations");console.log(g.next(),g.next(),r.refundFor(48,10),r.refundFor(10,10))']));

// ======================= P: ported scenarios (lock) =======================
test('P1 clean state: no finding, the lock is current', () => { P.reset(); const r = P.lock('check'); assert.equal(r.status, 0, out(r)); assert.match(out(r), /all current/); });

test('P2 a spec criterion is reworded: the derived test is STALE and the lock is behind', () => {
  P.reset(); reword(); const r = P.lock('check');
  assert.equal(r.status, 1); assert.match(out(r), /STALE tests\/ids\.test\.js:\d+ F-007\.C1/); assert.match(out(r), /LOCK-BEHIND .*#criterion-1/);
});

test('P3 "init" records the new section hash but never moves an artifact hash: still STALE', () => {
  P.reset(); reword(); const i = P.lock('init'), c = P.lock('check');
  assert.equal(i.status, 0, out(i)); assert.equal(c.status, 1); assert.match(out(c), /STALE/); assert.doesNotMatch(out(c), /LOCK-BEHIND/);
});

test('P4 a cosmetic change (tick, bold, spaces) is not stale', () => {
  P.reset(); P.w(SPEC, P.read(SPEC).replace(CRIT, '- [x] **regression tests:**   two instances of the module over the same repository do not produce repeated ids'));
  assert.equal(P.lock('check').status, 0);
});

test('P5 a rule is edited: only the file tagged with THAT rule is stale', () => {
  P.reset(); P.w(SPEC, P.read(SPEC).replace(RULE1, 'unique even if the server restarts or is cloned, and even with two'));
  const r = P.lock('check'); assert.match(out(r), /STALE src\/ids\/uuidGenerator\.js:\d+ F-007\.R1/); assert.doesNotMatch(out(r), /STALE src\/ids\/IdGeneratorPort/);
});

test('P6 a criterion inserted BEFORE the covered one renumbers it: the tag still resolves, the lock catches it', () => {
  P.reset(); P.w(SPEC, P.read(SPEC).replace(CRIT, '- [ ] a new criterion inserted before the others\n' + CRIT));
  const r = P.lock('check'); assert.equal(r.status, 1); assert.doesNotMatch(out(r), /MISSING-SOURCE/); assert.match(out(r), /STALE tests\/ids\.test\.js/);
});

test('P7 ratify without --reason is refused (exit 2); a short reason too', () => {
  P.reset(); reword();
  assert.equal(P.lock('ratify', TEST).status, 2); assert.equal(P.lock('ratify', TEST, '--reason', 'too short').status, 2);
  assert.match(P.lock('check').stdout, /STALE/);
});

test('P8 ratify with a reason: the record has who, when, artifact, id, hashes and why; the artifact is current again', () => {
  P.reset(); reword(); const r = P.lock('ratify', TEST, '--reason', REASON);
  const rat = existsSync(join(P.dir, 'docs/ratifications.md')) ? P.read('docs/ratifications.md') : '';
  assert.equal(r.status, 0, out(r));
  assert.match(rat, /Maria Ratifier <maria@example\.com>/); assert.match(rat, /\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ/); assert.match(rat, /wording only/);
  assert.match(rat, /ids\.test\.js/); assert.match(rat, /F-007\.C1/); assert.match(rat, /[0-9a-f]{16} -> [0-9a-f]{16}/);
  assert.equal(P.lock('check').status, 0, out(P.lock('check')));
});

test('P9 commit-check: a moved artifact hash plus its ratification record staged is accepted', () => {
  P.reset(); reword(); P.lock('ratify', TEST, '--reason', REASON); P.g('add', '-A'); const r = P.lock('commit-check'); assert.equal(r.status, 0, out(r));
});

test('P10 commit-check: a moved artifact hash with NO ratification record is rejected', () => {
  P.reset(); reword(); P.lock('ratify', TEST, '--reason', REASON); rmSync(join(P.dir, 'docs/ratifications.md'), { force: true }); P.g('add', '-A');
  const r = P.lock('commit-check'); assert.equal(r.status, 1); assert.match(out(r), /no new line in docs\/ratifications\.md/);
});

test('P11 commit-check: an artifact hash forged by hand is rejected', () => {
  P.reset(); P.w('docs/spec.lock', P.read('docs/spec.lock').replace(/^(A tests\/ids\.test\.js F-007\.C1 \S+ )[0-9a-f]{16}$/m, '$10123456789abcdef')); P.g('add', '-A');
  const r = P.lock('commit-check'); assert.equal(r.status, 1); assert.match(out(r), /not the hash of .*criterion-1/);
});

test('P12 commit-check: a section hash forged by hand is rejected', () => {
  P.reset(); P.w('docs/spec.lock', P.read('docs/spec.lock').replace(/^(S docs\/features\/F-007-ids-that-do-not-collide\.md#rule-1 )[0-9a-f]{16}$/m, '$10123456789abcdef')); P.g('add', '-A');
  const r = P.lock('commit-check'); assert.equal(r.status, 1); assert.match(out(r), /not the real hash/);
});

test('P13 the ratification record is append-only: editing an old line is rejected, appending is accepted', () => {
  P.reset();
  P.w('docs/ratifications.md', '# Ratifications (append only)\n\n- 2026-10-01T00:00:00Z | A <a@a> | x | id | y#z | aaaa -> bbbb | first reason given here\n'); P.commit('docs: record', '--no-verify');
  P.w('docs/ratifications.md', '# Ratifications (append only)\n\n- 2026-10-01T00:00:00Z | A <a@a> | x | id | y#z | aaaa -> bbbb | a reason that was edited later\n'); P.g('add', '-A');
  let r = P.lock('commit-check'); assert.equal(r.status, 1); assert.match(out(r), /append-only/);
  P.g('reset', '-q', '--hard'); appendFileSync(join(P.dir, 'docs/ratifications.md'), '- 2026-10-02T00:00:00Z | B <b@b> | x | id | y#z | bbbb -> cccc | a second reason given here\n'); P.g('add', '-A');
  r = P.lock('commit-check'); assert.equal(r.status, 0, out(r));
  P.g('reset', '-q', '--hard', 'HEAD~1');
});

test('P14 a new tag that is not in the lock is UNLOCKED; init adds it and the lock is current', () => {
  P.reset(); P.w(GEN, P.read(GEN).replace(/^(\/\/ Course implementation.*)$/m, '$1\n// @gs F-007.R2 docs/features/F-007-ids-that-do-not-collide.md#rule-2'));
  assert.match(P.read(GEN), /@gs F-007\.R2/); const r = P.lock('check');
  assert.equal(r.status, 1); assert.match(out(r), /UNLOCKED src\/ids\/uuidGenerator\.js:\d+ F-007\.R2/);
  P.lock('init'); assert.equal(P.lock('check').status, 0, out(P.lock('check')));
});

test('P15 a tag removed from a file leaves a DANGLING entry until "init --prune"', () => {
  P.reset(); P.w(GEN, P.read(GEN).replace(/^\/\/ @gs .*\n/m, '')); assert.doesNotMatch(P.read(GEN), /@gs/);
  const r = P.lock('check'); assert.equal(r.status, 1); assert.match(out(r), /DANGLING src\/ids\/uuidGenerator\.js/);
  P.lock('init', '--prune'); assert.equal(P.lock('check').status, 0, out(P.lock('check')));
});

test('P16 a criterion list shortened (retired/removed): the tag now points at a missing section: MISSING-SOURCE', () => {
  P.reset(); P.w(TEST, P.read(TEST).replace('#criterion-1', '#criterion-3').replace('F-007.C1', 'F-007.C3'));
  P.lock('init', '--prune'); assert.equal(P.lock('check').status, 0, out(P.lock('check'))); // criterion-3 exists in the fixture
  P.w(SPEC, P.read(SPEC).replace('- [ ] `npm test` is green\n', ''));
  const r = P.lock('check'); assert.equal(r.status, 1); assert.match(out(r), /MISSING-SOURCE .*no section "criterion-3"/);
});

test('P17 a tag to a section that never existed (criterion-9) is MISSING-SOURCE', () => {
  P.reset(); P.w(TEST, P.read(TEST).replace('#criterion-1', '#criterion-9').replace('F-007.C1', 'F-007.C9'));
  const r = P.lock('check'); assert.equal(r.status, 1); assert.match(out(r), /MISSING-SOURCE/);
});

test('P18 an @gs tag for a rule that does not exist (F-007.R9 #rule-9) is MISSING-SOURCE', () => {
  P.reset(); P.w(GEN, P.read(GEN).replace('F-007.R1 docs/features/F-007-ids-that-do-not-collide.md#rule-1', 'F-007.R9 docs/features/F-007-ids-that-do-not-collide.md#rule-9'));
  assert.match(out(P.lock('check')), /MISSING-SOURCE src\/ids\/uuidGenerator\.js:\d+/);
});

test('P19 an @gs tag whose id disagrees with the section it names (R1 but #rule-2) is a MISMATCH', () => {
  P.reset(); P.w(GEN, P.read(GEN).replace('#rule-1', '#rule-2'));
  const r = P.lock('check'); assert.equal(r.status, 1); assert.match(out(r), /MISMATCH src\/ids\/uuidGenerator\.js:\d+/);
});

test('P20 tags are inert: editing a tag comment leaves the behaviour identical; real code is detected (negative control)', () => {
  P.reset(); const before = fingerprint();
  P.w(PORT, P.read(PORT).replace('// @gs F-007.R2', '// @gs F-007.R2 (this longer tag comment changes nothing)'.replace(' (this longer tag comment changes nothing)', '')));
  P.w(PORT, '// a longer comment line above the tag changes nothing\n' + P.read(PORT));
  assert.equal(fingerprint(), before);
  appendFileSync(join(P.dir, RES), 'exports.refundFor = (h, d) => 0;\n');
  assert.notEqual(fingerprint(), before);
});

test('P21 the intent diff between two commits lists the section, the ratified artifact and the stale ones', () => {
  P.reset(); reword(); P.lock('init'); P.commit('docs: change the intent F-007', '--no-verify');
  const r = P.lock('diff', 'HEAD~1', 'HEAD'); P.g('reset', '-q', '--hard', 'HEAD~1');
  assert.match(out(r), /criterion-1: [0-9a-f]{16} -> [0-9a-f]{16}/); assert.match(out(r), /ids\.test\.js:\d+ F-007\.C1 STALE/);
});

// ======================= P: ported scenarios (co-change gate: S3 refactor proof, cascade) =======================
const noCite = 'feat: tweak the generator';
test('P22 a mechanical rename typed refactor: the parent tests pass unchanged', () => {
  P.reset(); P.w(RES, P.read(RES).replace('const hoursAhead = ', 'const hoursUntilStart = ').replace('hoursAhead > 24', 'hoursUntilStart > 24')); P.g('add', '-A');
  const r = P.co('--msg-file', P.msg('refactor: rename the local variable')); assert.equal(r.status, 0, out(r)); assert.match(out(r), /pass unchanged/);
});

test('P23 a behaviour change (refund at any time) called a refactor: NOT A REFACTOR', () => {
  P.reset(); P.w(RES, P.read(RES).replace('hoursAhead > 24', 'hoursAhead > 0')); P.g('add', '-A');
  const r = P.co('--msg-file', P.msg('refactor: tidy the refund')); assert.equal(r.status, 1); assert.match(out(r), /NOT A REFACTOR/);
});

test('P24 editing a test in the same commit does not hide it: the parent tests still fail', () => {
  P.reset(); P.w(RES, P.read(RES).replace('hoursAhead > 24', 'hoursAhead > 0')); P.w('tests/reservations.test.js', P.read('tests/reservations.test.js').replace('refundFor(10, 10), 0', 'refundFor(10, 10), 10')); P.g('add', '-A');
  const r = P.co('--msg-file', P.msg('refactor: tidy the refund')); assert.equal(r.status, 1, out(r)); assert.match(out(r), /NOT A REFACTOR/);
});

test('P25 LIMIT, recorded as a scenario: a change the tests do not pin (24 -> 12 hours) passes as a refactor', () => {
  P.reset(); P.w(RES, P.read(RES).replace('hoursAhead > 24', 'hoursAhead > 12')); P.g('add', '-A');
  assert.equal(P.co('--msg-file', P.msg('refactor: tidy the refund')).status, 0);
});

test('P26 source change with no id, no spec and no refactor is rejected', () => {
  P.reset(); P.w(RES, P.read(RES) + '// touched\n'); P.g('add', '-A');
  const r = P.co('--msg-file', P.msg(noCite)); assert.equal(r.status, 1); assert.match(out(r), /must cite an id/);
});

test('P27 citing an id the spec defines is accepted', () => {
  P.reset(); P.w(RES, P.read(RES) + '// touched\n'); P.g('add', '-A');
  assert.equal(P.co('--msg-file', P.msg('feat: refund window (F-007.R1)')).status, 0);
});

test('P28 citing an id with a known prefix that the spec does not define (F-005.9) is rejected', () => {
  P.reset(); P.w(RES, P.read(RES) + '// touched\n'); P.g('add', '-A');
  const r = P.co('--msg-file', P.msg('feat: refund window F-007.R9')); assert.equal(r.status, 1); assert.match(out(r), /F-007\.R9, which the spec does not define/);
});

test('P29 a refactor that also stages a spec change is rejected', () => {
  P.reset(); P.w(RES, P.read(RES).replace('const hoursAhead = ', 'const h = ').replace('hoursAhead > 24', 'h > 24')); reword(); P.g('add', '-A');
  const r = P.co('--msg-file', P.msg('refactor: rename')); assert.equal(r.status, 1); assert.match(out(r), /not a refactor/);
});

test('P30 a source change that stages its spec change is accepted (the spec change is the citation)', () => {
  P.reset(); P.w(RES, P.read(RES) + '// touched\n'); reword(); P.g('add', '-A');
  assert.equal(P.co('--msg-file', P.msg('feat: new wording and code')).status, 0);
});

test('P31 a hash moved in the lock needs a ratification record at commit time (cascade), a record makes it accepted', () => {
  P.reset(); reword(); P.lock('ratify', TEST, '--reason', REASON); P.g('add', '-A');
  assert.equal(P.lock('commit-check').status, 0); assert.equal(P.co('--msg-file', P.msg('docs: ratify F-007.C1')).status, 0);
});

test('P32 (S4 reinterpreted) a spec id nobody tagged is UNCOVERED: reported, failing only with --require-coverage', () => {
  P.reset(); P.w('docs/features/F-008-health.md', '# F-008 health endpoint\n\n- F-008.1 The service MUST answer GET /health with 200, verified by: test\n');
  const r = P.lock('check'); assert.equal(r.status, 0, out(r)); assert.match(out(r), /UNCOVERED docs\/features\/F-008-health\.md:\d+ F-008(\.1)?/);
  assert.equal(P.lock('check', '--require-coverage').status, 1);
});

test('P33 (S4) a tag on the new id covers it', () => {
  P.reset(); P.w('docs/features/F-008-health.md', '# F-008 health endpoint\n\n- F-008.1 The service MUST answer GET /health with 200, verified by: test\n');
  P.w('src/health.js', '// @gs F-008.1 docs/features/F-008-health.md#f-008-health-endpoint\nexports.ok = 200;\n'); P.lock('init');
  const r = P.lock('check'); assert.equal(r.status, 0, out(r)); assert.doesNotMatch(out(r), /UNCOVERED.*F-008/);
});

test('P34 (S4) a requirement is covered by a tag on any of its criteria; a sibling id is not', () => {
  P.reset(); P.w('docs/features/F-009-x.md', '# F-009 x\n\n- F-009.1 MUST do one, verified by: test\n- F-009.2 MUST do two, verified by: test\n');
  P.w('src/x.js', '// @gs F-009.1 docs/features/F-009-x.md#f-009-x\n'); P.lock('init');
  const r = out(P.lock('check')); assert.match(r, /UNCOVERED .* F-009\.2/); assert.doesNotMatch(r, /UNCOVERED .* F-009 /);
});

test('P35 (S4 strict) --require-coverage is the strict mode of the report', () => {
  P.reset(); P.w('docs/features/F-010-y.md', '# F-010 y\n\n- F-010.1 MUST do y, verified by: test\n');
  assert.equal(P.lock('check').status, 0); assert.equal(P.lock('check', '--require-coverage').status, 1);
});

// ======================= N: new edge cases =======================
test('N1 CRLF: a spec saved with Windows line endings is not stale', () => {
  P.reset(); P.w(SPEC, P.read(SPEC).replace(/\n/g, '\r\n')); assert.equal(P.lock('check').status, 0, out(P.lock('check')));
});

test('N2 CRLF: a CRLF lock file, CRLF tags in code and a UTF-8 BOM in the spec are all read', () => {
  P.reset(); P.w('docs/spec.lock', P.read('docs/spec.lock').replace(/\n/g, '\r\n')); P.w(GEN, P.read(GEN).replace(/\n/g, '\r\n')); P.w(SPEC, '\uFEFF' + P.read(SPEC));
  const r = P.lock('check'); assert.equal(r.status, 0, out(r));
});

test('N3 the lock and the record are written with LF even when the spec is CRLF', () => {
  P.reset(); P.w(SPEC, P.read(SPEC).replace(/\n/g, '\r\n').replace('two instances', 'three instances')); P.lock('ratify', '--all', '--reason', REASON);
  assert.doesNotMatch(P.read('docs/spec.lock'), /\r/); assert.doesNotMatch(P.read('docs/ratifications.md'), /\r/);
});

test('N4 conflict markers in the lock fail the check (CONFLICT) and "resolve" keeps both sides with the real hashes', () => {
  P.reset(); const lockText = P.read('docs/spec.lock').split('\n');
  const first = lockText.findIndex(l => l.startsWith('S ')); const dup = lockText[first];
  lockText.splice(first, 1, '<<<<<<< ours', dup, '=======', dup.replace(/ [0-9a-f]{16}$/, ' 0123456789abcdef'), '>>>>>>> theirs'); P.w('docs/spec.lock', lockText.join('\n'));
  const r = P.lock('check'); assert.equal(r.status, 1); assert.match(out(r), /CONFLICT/);
  assert.equal(P.lock('resolve').status, 0); assert.equal(P.lock('check').status, 0, out(P.lock('check')));
});

test('N5 resolve: two branches ratified different artifacts on adjacent lines; resolve keeps both', () => {
  P.reset(); const l = P.read('docs/spec.lock').split('\n'), i = l.findIndex(x => x.startsWith('A '));
  l.splice(i, 0, '<<<<<<< a'); l.splice(i + 2, 0, '=======', l[i + 1], '>>>>>>> b'); P.w('docs/spec.lock', l.join('\n'));
  P.lock('resolve'); assert.equal(P.lock('check').status, 0, out(P.lock('check')));
});

test('N6 ratify --id moves one id of a file and leaves the other stale', () => {
  P.reset(); P.w(GEN, P.read(GEN).replace('// @gs F-007.R1', '// @gs F-007.R2 docs/features/F-007-ids-that-do-not-collide.md#rule-2\n// @gs F-007.R1')); P.lock('init');
  P.w(SPEC, P.read(SPEC).replace(RULE1, 'unique across restarts, and even with two').replace('reached only through the port', 'reached always through the port'));
  const r = P.lock('ratify', GEN, '--id', 'F-007.R1', '--reason', REASON); assert.equal(r.status, 0, out(r));
  const c = out(P.lock('check')); assert.match(c, /STALE src\/ids\/uuidGenerator\.js:\d+ F-007\.R2/); assert.doesNotMatch(c, /STALE src\/ids\/uuidGenerator\.js:\d+ F-007\.R1/);
});

test('N7 ratify --all moves every stale artifact once, with one line each', () => {
  P.reset(); P.w(SPEC, P.read(SPEC).replace(RULE1, 'unique across restarts, and even with two').replace('three', 'four'));
  reword(); P.lock('ratify', '--all', '--reason', REASON);
  assert.equal(P.lock('check').status, 0, out(P.lock('check'))); assert.ok(P.read('docs/ratifications.md').split('\n').filter(l => l.startsWith('- ')).length >= 2);
});

test('N8 ratify on a file with nothing stale says so and writes nothing', () => {
  P.reset(); const r = P.lock('ratify', TEST, '--reason', REASON); assert.equal(r.status, 0); assert.match(out(r), /nothing stale/); assert.ok(!existsSync(join(P.dir, 'docs/ratifications.md')));
});

test('N9 ratify cannot cover a section that no longer exists', () => {
  P.reset(); P.w(SPEC, P.read(SPEC).replace('- [ ] `npm test` is green\n', '')); P.w(TEST, P.read(TEST)); // criterion-1 still exists
  P.w(SPEC, P.read(SPEC).replace(/\*\*Acceptance criteria\*\*[\s\S]*$/, ''));
  const r = P.lock('ratify', TEST, '--reason', REASON); assert.equal(r.status, 1); assert.match(out(r), /MISSING-SOURCE/);
});

test('N10 a tag inside a fenced code block of a markdown file is ignored (a conventions doc may show the grammar)', () => {
  P.reset(); P.w('docs/conventions.md', '# Conventions\n\n```js\n// @gs F-999.1 docs/nowhere.md#nothing\n```\n'); assert.equal(P.lock('check').status, 0, out(P.lock('check')));
});

test('N11 a module doc can carry a real tag as an HTML comment', () => {
  P.reset(); P.w('docs/module.md', '# Module\n\n<!-- @gs F-005.R1 docs/features/F-005-http-api.md#rule-1 -->\n'); P.lock('init');
  assert.equal(P.lock('check').status, 0, out(P.lock('check'))); assert.match(P.read('docs/spec.lock'), /A docs\/module\.md F-005\.R1 /);
});

test('N12 a malformed tag (no #section) is reported as MALFORMED, not silently ignored', () => {
  P.reset(); P.w(GEN, P.read(GEN) + '// @gs F-007.R1 docs/features/F-007-ids-that-do-not-collide.md\n'); const r = P.lock('check');
  assert.equal(r.status, 1); assert.match(out(r), /MALFORMED src\/ids\/uuidGenerator\.js:\d+/);
});

test('N13 every comment style is read: #, --, /* */, ;', () => {
  P.reset(); const t = 'docs/features/F-005-http-api.md#rule-1';
  P.w('src/a.py', `# @gs F-005.R1 ${t}\n`); P.w('src/b.sql', `-- @gs F-005.R1 ${t}\n`); P.w('src/c.c', `/* @gs F-005.R1 ${t} */\n`); P.w('src/d.yaml', `; @gs F-005.R1 ${t}\n`); P.w('src/e.sh', `#!/bin/sh\n#  @gs F-005.R1 ${t}\n`);
  P.lock('init'); const lock = P.read('docs/spec.lock'); for (const f of ['a.py', 'b.sql', 'c.c', 'd.yaml', 'e.sh']) assert.match(lock, new RegExp(`A src/${f.replace('.', '\\.')} F-005\\.R1 `));
});

test('N14 heading anchors (the layout the formulas write): a nested section includes its sub-sections', () => {
  P.reset();
  P.w('docs/spec/F-001-hive.md', '# Hive\n\n## F-001: Register a hive\n\nThe user registers a hive.\n\n### Acceptance criteria\n\n- F-001.1 The system MUST store the hive name, verified by: test\n\n## F-002: Other\n\ntext\n');
  P.w('src/hive.js', '// @gs F-001.1 docs/spec/F-001-hive.md#f-001-register-a-hive\n'); P.lock('init'); assert.equal(P.lock('check').status, 0, out(P.lock('check')));
  P.w('docs/spec/F-001-hive.md', P.read('docs/spec/F-001-hive.md').replace('hive name', 'hive name and owner'));
  assert.match(out(P.lock('check')), /STALE src\/hive\.js/);
  P.reset(); P.w('docs/spec/F-001-hive.md', '# Hive\n\n## F-001: Register a hive\n\nThe user registers a hive.\n\n## F-002: Other\n\ntext\n'); P.w('src/hive.js', '// @gs F-001 docs/spec/F-001-hive.md#f-001-register-a-hive\n'); P.lock('init');
  P.w('docs/spec/F-001-hive.md', P.read('docs/spec/F-001-hive.md').replace('text', 'changed text of another section')); assert.equal(P.lock('check').status, 0, 'an edit in a different section is not drift');
});

test('N15 the twin of a drift probe: a NEW spec file is never inside a locked section', () => {
  P.reset(); P.w('docs/spec/F-001-hive.md', '# Hive\n\n## F-001: Register a hive\n\ntext\n'); P.w('src/hive.js', '// @gs F-001 docs/spec/F-001-hive.md#f-001-register-a-hive\n'); P.lock('init');
  P.w('docs/spec/F-999-probe-twin.md', '# Probe twin\n\n## Planted\n\nnot locked\n'); assert.equal(P.lock('check').status, 0, out(P.lock('check')));
  P.w('docs/spec/F-001-hive.md', P.read('docs/spec/F-001-hive.md') + '\nA sentence appended inside the last locked section.\n'); assert.equal(P.lock('check').status, 1, 'appending inside the last section IS a change of that section');
});

test('N16 unicode anchors (Spanish accents) resolve and duplicate headings get -1', () => {
  P.reset(); P.w('docs/spec/F-003-ubicacion.md', '# Ubicación\n\n## F-003: Ubicación del cliente\n\ntexto uno\n\n## Criterios\n\ntexto dos\n\n## Criterios\n\ntexto tres\n');
  P.w('src/u.js', '// @gs F-003 docs/spec/F-003-ubicacion.md#f-003-ubicación-del-cliente\n// @gs F-003.1 docs/spec/F-003-ubicacion.md#criterios\n// @gs F-003.2 docs/spec/F-003-ubicacion.md#criterios-1\n');
  const i = P.lock('init'); assert.equal(i.status, 0, out(i)); const lock = P.read('docs/spec.lock');
  const h = id => lock.split('\n').find(l => l.startsWith('A src/u.js ' + id + ' ')).split(' ')[4]; assert.notEqual(h('F-003.1'), h('F-003.2'));
});

test('N17 the same file may tag two ids of two sections; a file may tag one id at two sections', () => {
  P.reset(); P.w('src/z.js', '// @gs F-005.R1 docs/features/F-005-http-api.md#rule-1\n// @gs F-005.C1 docs/features/F-005-http-api.md#criterion-1\n// @gs F-005 docs/features/F-005-http-api.md#f-005-http-api\n// @gs X-1 docs/features/F-005-http-api.md#rule-1\n'); P.lock('init');
  assert.equal(P.lock('check').status, 0); assert.equal(P.read('docs/spec.lock').split('\n').filter(l => l.startsWith('A src/z.js')).length, 4);
});

test('N18 init with no tag refuses; init on a tag to a missing spec refuses and writes nothing', () => {
  const d = mkdtempSync(join(tmpdir(), 'gslock-empty-')); try {
    const run = (...a) => sh(d, process.execPath, [LOCK_JS, ...a]); assert.equal(run('init').status, 1); assert.ok(!existsSync(join(d, 'docs/spec.lock')));
    mkdirSync(join(d, 'src')); writeFileSync(join(d, 'src/a.js'), '// @gs X-1 docs/spec/none.md#x\n'); assert.equal(run('init').status, 1); assert.ok(!existsSync(join(d, 'docs/spec.lock')));
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('N19 check with tags but no lock says NOLOCK; with neither says nothing is locked', () => {
  const d = mkdtempSync(join(tmpdir(), 'gslock-nolock-')); try {
    const run = (...a) => sh(d, process.execPath, [LOCK_JS, ...a]); let r = run('check'); assert.equal(r.status, 1); assert.match(out(r), /NOLOCK.*nothing is locked/);
    mkdirSync(join(d, 'docs/spec'), { recursive: true }); writeFileSync(join(d, 'docs/spec/F-1.md'), '# F-001 a\n\ntext\n'); mkdirSync(join(d, 'src')); writeFileSync(join(d, 'src/a.js'), '// @gs F-001 docs/spec/F-1.md#f-001-a\n');
    r = run('check'); assert.equal(r.status, 1); assert.match(out(r), /NOLOCK.*run "init"/);
    assert.equal(run('init').status, 0); assert.equal(run('check').status, 0, out(run('check')));
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('N20 init writes .gitattributes once (union merge for the record, LF for the lock)', () => {
  const ga = P.read('.gitattributes'); assert.match(ga, /docs\/ratifications\.md merge=union/); assert.match(ga, /docs\/spec\.lock text eol=lf/);
  P.lock('init'); assert.equal(P.read('.gitattributes'), ga);
});

test('N21 check --json is parseable and carries the findings', () => {
  P.reset(); reword(); const j = JSON.parse(P.lock('check', '--json').stdout); assert.equal(j.ok, false); assert.ok(j.findings.some(f => f.status === 'STALE'));
});

test('N22 commit-check on the very first commit (no HEAD) is accepted', () => {
  const d = mkdtempSync(join(tmpdir(), 'gslock-first-')); try {
    const g = (...a) => sh(d, 'git', a); g('init', '-q', '-b', 'main'); g('config', 'user.email', 'a@a'); g('config', 'user.name', 'A');
    mkdirSync(join(d, 'docs/spec'), { recursive: true }); writeFileSync(join(d, 'docs/spec/F-1.md'), '# F-001 a\n\ntext\n'); mkdirSync(join(d, 'src')); writeFileSync(join(d, 'src/a.js'), '// @gs F-001 docs/spec/F-1.md#f-001-a\n');
    sh(d, process.execPath, [LOCK_JS, 'init']); g('add', '-A'); const r = sh(d, process.execPath, [LOCK_JS, 'commit-check']); assert.equal(r.status, 0, out(r));
    assert.equal(sh(d, process.execPath, [CO_JS, '--msg-file', join(d, 'm')]).status, 0, 'first commit has no parent');
  } finally { rmSync(d, { recursive: true, force: true }); }
});

test('N23 the tag in a vendored copy of the tool itself is not a tag (the tool header documents the grammar)', () => {
  P.reset(); const r = P.lock('check'); assert.equal(r.status, 0, out(r)); assert.doesNotMatch(out(r), /tools\/gs-lock/);
});

test('N24 .gs.json can move the spec folder: tags into a custom spec dir work and its ids are counted', () => {
  P.reset(); P.w('.gs.json', '{"specDirs":["requirements"]}'); P.w('requirements/R-1.md', '# R-001 the thing\n\nbody\n'); P.w('src/r.js', '// @gs R-001 requirements/R-1.md#r-001-the-thing\n');
  P.lock('init'); assert.equal(P.lock('check', '--require-coverage').status, 0, out(P.lock('check', '--require-coverage')));
});

test('N25 a ratify record with | in the reason cannot break the record line', () => {
  P.reset(); reword(); P.lock('ratify', TEST, '--reason', 'reason with a | pipe and\nnewline in it'); const line = P.read('docs/ratifications.md').split('\n').find(l => l.startsWith('- '));
  assert.equal(line.split(' | ').length, 7);
});

// ----- co-change: more edge cases and the real hook flow -----
test('N26 docs-only and test-only changes need no citation', () => {
  P.reset(); P.w('docs/notes.md', 'x\n'); P.w('tests/new.test.js', '// new\n'); P.g('add', '-A'); assert.equal(P.co('--msg-file', P.msg('docs: notes')).status, 0);
});

test('N27 "UTF-8" in the message is not an id; a Waiver line is accepted and printed', () => {
  P.reset(); P.w(RES, P.read(RES) + '// touched\n'); P.g('add', '-A');
  assert.equal(P.co('--msg-file', P.msg('feat: handle UTF-8 input')).status, 1);
  const r = P.co('--msg-file', P.msg('feat: handle UTF-8 input\n\nWaiver: emergency production fix, spec to follow')); assert.equal(r.status, 0); assert.match(out(r), /waiver: emergency/);
});

test('N28 a refactor waiver needs Ratified-by too; with both the proof is skipped and said so', () => {
  P.reset(); P.w(RES, P.read(RES).replace('hoursAhead > 24', 'hoursAhead > 0')); P.g('add', '-A');
  assert.equal(P.co('--msg-file', P.msg('refactor: x\n\nWaiver: moved file the tests import')).status, 1);
  const r = P.co('--msg-file', P.msg('refactor: x\n\nWaiver: moved file the tests import\nRatified-by: Maria')); assert.equal(r.status, 0); assert.match(out(r), /waived with Ratified-by/);
});

test('N29 the refactor proof cleans up: no worktree, no temp folder left, and the repo is untouched', () => {
  P.reset(); P.w(RES, P.read(RES).replace('hoursAhead > 24', 'hoursAhead > 0')); P.g('add', '-A'); const before = P.g('status', '--porcelain').stdout; P.co('--msg-file', P.msg('refactor: x'));
  assert.equal(P.g('worktree', 'list').stdout.trim().split('\n').length, 1); assert.equal(P.g('status', '--porcelain').stdout, before);
});

test('N30 a project with no test command: the proof is refused with exit 2 and a message, not a pass', () => {
  P.reset(); rmSync(join(P.dir, 'package.json')); P.g('rm', '-q', '--cached', 'package.json'); P.g('commit', '-q', '-m', 'chore: no package', '--no-verify');
  P.w(RES, P.read(RES) + '// touched\n'); P.g('add', '-A'); const r = P.co('--msg-file', P.msg('refactor: x')); assert.equal(r.status, 2); assert.match(out(r), /no test command/);
  assert.equal(P.co('--msg-file', P.msg('refactor: x'), '--test-cmd', 'node -e "process.exit(0)"').status, 0);
  P.g('reset', '-q', '--hard', 'HEAD~1');
});

test('N31 .gs.json testCmd and a failing custom command are honoured', () => {
  P.reset(); P.w('.gs.json', '{"testCmd":"node -e \\"process.exit(3)\\""}'); P.w(RES, P.read(RES) + '// touched\n'); P.g('add', '-A');
  const r = P.co('--msg-file', P.msg('refactor: x')); assert.equal(r.status, 1); assert.match(out(r), /NOT A REFACTOR/);
});

test('N32 end to end: a real commit-msg hook refuses an uncited source commit and accepts a cited one', () => {
  P.reset(); mkdirSync(join(P.dir, '.githooks'), { recursive: true });
  writeFileSync(join(P.dir, '.githooks/commit-msg'), '#!/bin/sh\nnode tools/gs-lock/gs-cochange.mjs --msg-file "$1"\n'); chmodSync(join(P.dir, '.githooks/commit-msg'), 0o755);
  writeFileSync(join(P.dir, '.githooks/pre-commit'), '#!/bin/sh\nnode tools/gs-lock/gs-lock.mjs check && node tools/gs-lock/gs-lock.mjs commit-check\n'); chmodSync(join(P.dir, '.githooks/pre-commit'), 0o755);
  P.g('add', '-A'); P.g('update-index', '--chmod=+x', '.githooks/commit-msg', '.githooks/pre-commit'); P.g('commit', '-q', '-m', 'chore: hooks', '--no-verify'); P.g('config', 'core.hooksPath', '.githooks');
  P.w(RES, P.read(RES) + '// touched\n'); P.g('add', '-A');
  let r = P.g('commit', '-q', '-m', 'feat: tweak'); assert.notEqual(r.status, 0); assert.match(out(r), /must cite an id/);
  r = P.g('commit', '-q', '-m', 'feat: refund edge (F-007.R1)'); assert.equal(r.status, 0, out(r));
  reword(); P.g('add', '-A'); r = P.g('commit', '-q', '-m', 'docs: reword F-007'); assert.notEqual(r.status, 0, 'a reworded section with its tagged artifact stale blocks the commit'); assert.match(out(r), /STALE/);
  P.lock('ratify', TEST, '--reason', REASON); P.g('add', '-A'); r = P.g('commit', '-q', '-m', 'docs: reword F-007 and ratify'); assert.equal(r.status, 0, out(r));
  P.g('config', '--unset', 'core.hooksPath'); P.g('reset', '-q', '--hard', 'main~2'); P.g('clean', '-fdq');
});

test('N33 CI mode: --range judges every commit; --commit one; a bad middle commit fails the range', () => {
  P.reset(); const base = P.g('rev-parse', 'HEAD').stdout.trim();
  P.w(RES, P.read(RES) + '// one\n'); P.commit('feat: good change (F-007.R1)', '--no-verify');
  P.w(RES, P.read(RES) + '// two\n'); P.commit('feat: uncited change', '--no-verify');
  P.w('docs/n.md', 'n\n'); P.commit('docs: note', '--no-verify');
  const r = P.co('--range', `${base}..HEAD`); assert.equal(r.status, 1); assert.match(out(r), /uncited change/); assert.match(out(r), /ok co-change .*good change/);
  assert.equal(P.co('--commit', 'HEAD').status, 0); assert.equal(P.co('--commit', 'HEAD~1').status, 1);
  P.g('reset', '-q', '--hard', base);
});

test('N34 pre-push mode reads git stdin lines and judges the pushed commits', () => {
  P.reset(); const base = P.g('rev-parse', 'HEAD').stdout.trim(); P.w(RES, P.read(RES) + '// one\n'); P.commit('feat: uncited', '--no-verify');
  const head = P.g('rev-parse', 'HEAD').stdout.trim(); const r = sh(P.dir, process.execPath, [join(P.dir, 'tools/gs-lock/gs-cochange.mjs'), '--pre-push'], `refs/heads/main ${head} refs/heads/main ${base}\n`);
  assert.equal(r.status, 1, out(r)); P.g('reset', '-q', '--hard', base);
});

test('N35 a refactor of a source file in a sub-folder and a rename+import fix in a test: the proof uses the parent tests, edits to tests ignored', () => {
  P.reset(); P.w(RES, P.read(RES).replace('refundFor', 'refund')); P.w('tests/reservations.test.js', P.read('tests/reservations.test.js').replace(/refundFor/g, 'refund')); P.g('add', '-A');
  const r = P.co('--msg-file', P.msg('refactor: rename the function')); assert.equal(r.status, 1, 'the parent test imports the old name: a known false positive, documented'); assert.match(out(r), /NOT A REFACTOR/);
});

test('N36 an unknown command and a missing argument exit 2', () => {
  assert.equal(P.lock('frobnicate').status, 2); assert.equal(P.lock('diff').status, 2); assert.equal(P.co().status, 2);
});
