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
  assert.deepStrictEqual(u.refsIn(t, cfg).sort(), ['docs/a.md', 'docs/spec/SPEC.md', 'src/']);
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
