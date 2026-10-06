'use strict';
// Unit tests of the checker's helpers (no git, no network). Run: node --test tests/unit.test.js
const test = require('node:test');
const assert = require('node:assert');
const u = require('../lib/util');
const cfg = require('../config.default.json');

test('leadingId reads the id a line defines, not ids it mentions', () => {
  assert.strictEqual(u.leadingId('- [ ] AC-001 The balance is 6 (REQ-001).', cfg.idToken), 'AC-001');
  assert.strictEqual(u.leadingId('| AC-002 | tests/x.test.js |', cfg.idToken), 'AC-002');
  assert.strictEqual(u.leadingId('- **REQ-003** Largest debit', cfg.idToken), 'REQ-003');
  assert.strictEqual(u.leadingId('- The criterion AC-001 says', cfg.idToken), null);
  assert.strictEqual(u.leadingId('F-007.C1 holds', cfg.idToken), 'F-007.C1');
  assert.strictEqual(u.leadingId('AC-0012345 too long', cfg.idToken), null);
});

test('refsIn finds links and inline paths, ignores prose, URLs, fenced blocks and placeholders', () => {
  const t = 'See [spec](docs/spec/SPEC.md) and `docs/a.md`, `npm test`, `and/or`, `https://x.y/z.md`, `dist/out.js`, `docs/<name>.md`, `src/`.\n```\n`docs/in-fence.md`\n```\n';
  assert.deepStrictEqual(u.refsIn(t, cfg).map(x => x.ref).sort(), ['docs/a.md', 'docs/spec/SPEC.md', 'src/']);
});

test('section hash ignores markup, list markers, tick state and whitespace; changes with a word', () => {
  const a = '- [ ] AC-001 The **balance** is 6.\n- [x] AC-002 Empty is 0.';
  const b = '1. AC-001 The balance is   6.\n2. AC-002 Empty is 0.';
  const c = '- [ ] AC-001 The balance is 7.\n- [ ] AC-002 Empty is 0.';
  assert.strictEqual(u.sectionHash(a), u.sectionHash(b));
  assert.notStrictEqual(u.sectionHash(a), u.sectionHash(c));
});

test('sections: heading slug, bold labels, fences do not open sections', () => {
  const s = u.sections('# T\n\n## Acceptance criteria\n- a\n```\n## not a heading\n```\n**Rules**\nx\n');
  assert.deepStrictEqual(s.map(x => x.slug), ['t', 'acceptance-criteria', 'rules']);
});

test('slug matches the rule used by the fixture gate', () => {
  assert.strictEqual(u.slug('Criterios de aceptación'), 'criterios-de-aceptaci-n');
  assert.strictEqual(u.slug('Acceptance criteria (v2)'), 'acceptance-criteria-v2');
});

test('compound ids and the anchored id grammar', () => {
  assert.strictEqual(u.leadingId('- REQ-LOAN-01 Loans are limited', cfg.idToken), 'REQ-LOAN-01');
  assert.strictEqual(u.leadingId('FR-1.2.3 holds', cfg.idToken), 'FR-1.2.3');
  assert.strictEqual(u.leadingId('see AC-001', cfg.idToken), null);
});

test('refsIn: soft references (bare data files) are kept but flagged; route templates, URIs and unit lists are dropped', () => {
  const t = 'Data in `pantry.json`, resource `pantry://inventory`, route `items/:id/status`, units `ml/l/cup`, doc `docs/a.md`.';
  const refs = u.refsIn(t, cfg);
  assert.deepStrictEqual(refs.map(x => [x.ref, x.soft]).sort(), [['docs/a.md', false], ['pantry.json', true]]);
});

test('E08 citation rule: skipped, todo and distant-comment citations do not count', () => {
  const { citedByATest } = require('../lib/items');
  assert.strictEqual(citedByATest("test('AC-001 works', () => {});", 'AC-001'), true);
  assert.strictEqual(citedByATest("test.todo('AC-001 later');", 'AC-001'), false);
  assert.strictEqual(citedByATest("test.skip('AC-001 later', () => {});", 'AC-001'), false);
  assert.strictEqual(citedByATest('// AC-001 will be tested\n\n\n\n\nconst x = 1;', 'AC-001'), false);
  assert.strictEqual(citedByATest('def test_ac_001_works():\n    pass\n', 'AC-001'), true);
});

test('countTests-style skipped pattern is excluded from executed cases', () => {
  const fs = require('fs'), os = require('os'), path = require('path');
  const { countTests } = require('../lib/items');
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'fx1-unit-'));
  require('child_process').spawnSync('git', ['init', '-q'], { cwd: d });
  fs.mkdirSync(path.join(d, 'tests'));
  fs.writeFileSync(path.join(d, 'tests', 'a.test.js'), "test('a', () => {});\ntest.todo('b');\nit.skip('c', () => {});\nit('d', () => {});\n");
  require('child_process').spawnSync('git', ['add', '-A'], { cwd: d });
  assert.strictEqual(countTests(d, cfg).cases, 2);
  fs.rmSync(d, { recursive: true, force: true });
});
