// SPDX-License-Identifier: MIT
// Controls for the spec-code synchronization checks (gs-check --sync --base <rev>, items Y01 to Y05): path B, an existing project that gets the
// substrate and a spec generated from its code. Built from the migration fixture: the legacy script is kept (production code carried, unchanged).
// Run:  node --test tools/gs-check/test/sync.test.mjs     Subset: FX1_ONLY=SY1,SY3
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import { run } from '../gs-check.mjs';
import { buildVariant, cleanup } from './build-fixtures.mjs';

const P = 'PARTIAL';
const only = process.env.FX1_ONLY ? process.env.FX1_ONLY.split(',') : null;
const SRC = "const test = require('node:test');\nconst assert = require('node:assert');\nconst { spawnSync } = require('node:child_process');\ntest('AC-008 the version flag prints the version', () => { const r = spawnSync('node ledger.js --version', { shell: true, encoding: 'utf8' }); assert.strictEqual(r.stdout.trim(), 'ledger 0.1'); });\n";
const variants = [
  { id: 'SY1', desc: 'known-good: every element of the code is in the spec, every criterion tested, no orphan ids, code untouched', expect: {},
    mutate(d, h) { addLegacy(d, h, { spec: true, test: true }); } },
  { id: 'SY2', desc: 'the code has a flag (--version) that the spec never mentions', expect: { Y01: P }, mutate(d, h) { addLegacy(d, h, { spec: false, test: false }); } },
  { id: 'SY3', desc: 'a criterion has no test', expect: { Y02: P }, mutate(d, h) { addLegacy(d, h, { spec: true, test: false }); } },
  { id: 'SY4', desc: 'a test cites a criterion the spec does not define', expect: { Y03: P }, mutate(d, h) { addLegacy(d, h, { spec: true, test: true }); h.write(d, 'tests/orphan.test.js', "const test = require('node:test');\ntest('AC-099 a test of nothing', () => {});\n"); } },
  { id: 'SY5', desc: 'a derived document cites an id the spec does not define', expect: { Y04: P }, mutate(d, h) { addLegacy(d, h, { spec: true, test: true }); h.edit(d, 'docs/architecture.md', t => t + '\nSee also AC-042 for the retry rule.\n'); } },
  { id: 'SY6', desc: 'the production code was edited after the boundary commit', expect: { Y05: P }, mutate(d, h) { addLegacy(d, h, { spec: true, test: true }); h.edit(d, 'ledger.js', t => t.replace("ledger 0.1", "ledger 0.2")); h.edit(d, 'tests/version.test.js', t => t.replace("ledger 0.1", "ledger 0.2")); } }
];
function addLegacy(d, h, { spec, test: withTest }) {
  const base = JSON.parse(fs.readFileSync(d + '/docs/migration/equivalence.json', 'utf8')).base;
  fs.writeFileSync(d + '/ledger.js', run_git(d, ['show', base + ':ledger.js']));
  if (spec) { h.edit(d, 'docs/spec/SPEC.md', t => t.replace('\n## Open questions', '- [ ] AC-008 The flag --version prints the line "ledger 0.1" and exits 0 (REQ-004).\n\n## Open questions')); h.relock(d); }
  if (spec && withTest) h.write(d, 'tests/version.test.js', SRC);
  h.edit(d, 'docs/coverage.md', t => t + (spec && withTest ? '| AC-008 | tests/version.test.js |\n' : ''));
}
import { spawnSync } from 'node:child_process';
function run_git(d, args) { return spawnSync('git', args, { cwd: d, encoding: 'utf8' }).stdout; }

for (const v of variants) {
  if (only && !only.includes(v.id)) continue;
  test(`${v.id}: ${v.desc}`, { timeout: 900000 }, () => {
    const dir = buildVariant({ ...v, migration: true });
    try {
      const base = JSON.parse(fs.readFileSync(dir + '/docs/migration/equivalence.json', 'utf8')).base;
      const rep = run(dir, { sync: true, base, only: ['E02'] });
      const got = Object.fromEntries(rep.sync.items.map(i => [i.id, i.status]));
      const want = { Y01: 'PASS', Y02: 'PASS', Y03: 'PASS', Y04: 'PASS', Y05: 'PASS', ...v.expect };
      const diffs = Object.keys(want).filter(id => got[id] !== want[id]).map(id => `${id}: got ${got[id]}, want ${want[id]} (${(rep.sync.items.find(i => i.id === id).reasons || []).join('; ').slice(0, 220)})`);
      assert.deepStrictEqual(diffs, []);
    } finally { cleanup(dir); }
  });
}
