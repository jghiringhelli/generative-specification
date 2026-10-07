// SPDX-License-Identifier: MIT
// Migration controls: a legacy script (the base commit) migrated to a substrate with a recovered spec, a characterization suite and an inventory.
// `expect` lists every migration item (M01..M09) that must NOT be PASS, with its exact status; `expectE` the E01..E12 items that are not PASS (collateral).
// Every other item must be PASS.
const P = 'PARTIAL', A = 'ABSENT';
const stripLines = (h, d, p, ...subs) => subs.forEach(s => h.dropLines(d, p, s));
const CHAR = 'tests/characterization/cli.test.js';

export default [
  { id: 'MG1', kind: 'good', desc: 'known-good migration: manifest, suite green on the original and the new code, mutants refused, spec and inventory consistent, deferred list', expect: {}, expectE: {} },
  { id: 'MG2', kind: 'broken', desc: 'the recovered spec lacks a characterized behavior (AC-007 is tested and kept in the inventory but the spec does not define it)', expect: { M05: P, M07: P }, expectE: {},
    mutate(d, h) {
      h.dropLines(d, 'docs/spec/SPEC.md', 'AC-007'); h.dropLines(d, 'docs/coverage.md', 'AC-007'); h.relock(d);
    } },
  { id: 'MG3', kind: 'broken', desc: 'the suite fails on the migrated code (the new CLI prints a different format)', expect: { M03: P, M04: P }, expectE: { E05: P, E06: P, E07: P, E10: P, E11: P, E12: P },
    mutate: (d, h) => h.replace(d, 'src/cli.js', "console.log(cmd === 'balance' ? balance(nums) : largestDebit(nums));", "console.log('=' + (cmd === 'balance' ? balance(nums) : largestDebit(nums)));") },
  { id: 'MG4', kind: 'broken', desc: 'a behavior of the original is silently dropped: --version is neither in the inventory nor in the deferred list', expect: { M08: P }, expectE: {},
    mutate(d, h) { h.dropLines(d, 'docs/migration/inventory.md', '--version'); h.dropLines(d, 'docs/deferred.md', '--version'); } },
  { id: 'MG5', kind: 'broken', desc: 'there is no deferred list', expect: { M09: A }, expectE: { E01: P },
    mutate(d, h) { h.rm(d, 'docs/deferred.md'); } },
  { id: 'MG6', kind: 'broken', desc: 'the suite is not black-box: it imports the new source, so it cannot run against the original', expect: { M01: P }, expectE: {},
    mutate(d, h) {
      h.replace(d, CHAR, "const test = require('node:test');", "const test = require('node:test');\nconst { balance } = require('../../src/ledger');");
      h.replace(d, CHAR, "test('AC-001 balance of 3 -1 4 prints 6', () => { const r = run('balance', 3, -1, 4); assert.strictEqual(r.status, 0); assert.strictEqual(r.stdout.trim(), '6'); });", "test('AC-001 balance of 3 -1 4 is 6', () => { assert.strictEqual(balance([3, -1, 4]), 6); });");
      h.relock(d);
    } },
  { id: 'MG7', kind: 'broken', desc: 'a vacuous suite: it runs the command but asserts nothing', expect: { M02: P, M04: P }, expectE: {},
    mutate(d, h) { h.edit(d, CHAR, t => t.replace(/assert\.[a-zA-Z]+\([^;]*\);/g, '')); } },
  { id: 'MG8', kind: 'broken', desc: 'the suite codifies the new behavior, not the original (an error text the original never printed)', expect: { M02: P, M04: P }, expectE: {},
    mutate(d, h) { h.replace(d, CHAR, "assert.match(r.stderr, /integers/); });\ntest('AC-004", "assert.match(r.stderr, /invalid entry/); });\ntest('AC-004"); h.replace(d, 'src/cli.js', "console.error('error: entries must be integers');", "console.error('error: invalid entry, entries must be integers');"); } },
  { id: 'MG9', kind: 'broken', desc: 'an element nobody claimed is marked keep (no criterion, no test)', expect: { M07: P }, expectE: {},
    mutate: (d, h) => h.replace(d, 'docs/migration/inventory.md', '| defer | prints a version nobody reads; no known consumer, decide later |', '| keep | |') },
  { id: 'MG10', kind: 'removed', desc: 'no equivalence manifest', expect: { M01: A, M02: A, M03: A, M04: A, M08: A }, expectE: { E01: P },
    mutate(d, h) { h.rm(d, 'docs/migration/equivalence.json'); } },
  { id: 'MG11', kind: 'broken', desc: 'the suite pins too little: only balance is characterized, largest-debit and the usage line are free to change', expect: { M01: P, M04: P, M06: P, M07: P }, expectE: { E08: P },
    mutate(d, h) {
      h.edit(d, CHAR, t => t.split('\n').filter(l => !/^test\('AC-00[4567]/.test(l)).join('\n'));
      h.edit(d, CHAR, t => t.replace(/(AC-00[1-3][^\n]*\n)/, '$1'));
      for (const x of ['AC-004', 'AC-005', 'AC-006', 'AC-007']) { h.edit(d, 'docs/coverage.md', t => t.split('\n').map(l => l.startsWith('| ' + x) ? l.replace('tests/characterization/cli.test.js', 'tests/ledger.test.js') : l).join('\n')); }
    } },
  { id: 'MG12', kind: 'broken', desc: 'a deferred element has no reason in the inventory or in the deferred list', expect: { M07: P, M09: P }, expectE: {},
    mutate(d, h) { h.replace(d, 'docs/migration/inventory.md', '| defer | prints a version nobody reads; no known consumer, decide later |', '| defer | |'); h.replace(d, 'docs/deferred.md', '| flag --version | prints a version number nobody reads, no known consumer of it; not carried to the new code, to be decided with the owner |', '| flag --version | later |'); } },
  { id: 'MG13', kind: 'broken', desc: 'no inventory', expect: { M07: A, M08: A }, expectE: {},
    mutate(d, h) { h.rm(d, 'docs/migration/inventory.md'); stripLines(h, d, 'CLAUDE.md', 'docs/migration/inventory.md'); } }
];
