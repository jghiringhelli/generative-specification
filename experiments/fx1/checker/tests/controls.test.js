'use strict';
// Positive and negative controls for the FX-1 checker. Each variant is built from scratch, checked, and compared with the declared expectation.
// Run:  node --test tests/controls.test.js        (about 20 s per variant)
// Subset: FX1_ONLY=G1,R03 node --test tests/controls.test.js
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { run } = require('../checker');
const { buildVariant, cleanup } = require('./build-fixtures');
const variants = require('./variants');

const only = process.env.FX1_ONLY ? process.env.FX1_ONLY.split(',') : null;
const outDir = process.env.FX1_REPORT_DIR || null;
const IDS = Array.from({ length: 12 }, (_, i) => 'E' + String(i + 1).padStart(2, '0'));

for (const v of variants) {
  if (only && !only.includes(v.id)) continue;
  test(`${v.id} ${v.kind}: ${v.desc}`, { timeout: 600000 }, () => {
    const dir = buildVariant(v);
    try {
      const rep = run(dir);
      if (outDir) fs.writeFileSync(path.join(outDir, `${v.id}.json`), JSON.stringify(rep, null, 2));
      const got = Object.fromEntries(rep.items.map(i => [i.id, i.status]));
      const want = Object.fromEntries(IDS.map(id => [id, v.expect[id] || 'PASS']));
      const diffs = IDS.filter(id => got[id] !== want[id]).map(id => `${id}: got ${got[id]}, want ${want[id]} (${(rep.items.find(i => i.id === id).reasons || []).join('; ').slice(0, 200)})`);
      assert.deepStrictEqual(diffs, [], `variant ${v.id} differs from its declared expectation`);
      assert.strictEqual(rep.summary.undeterminable, 0, 'no item may be UNDETERMINABLE on a control');
    } finally { cleanup(dir); }
  });
}

test('determinism: two runs on the known-good project give identical statuses and reasons', { timeout: 300000, skip: !!only }, () => {
  const dir = buildVariant(variants[0]);
  try {
    const strip = r => r.items.map(i => [i.id, i.status, i.reasons]);
    assert.deepStrictEqual(strip(run(dir)), strip(run(dir)));
  } finally { cleanup(dir); }
});

test('the checker never modifies the repository under test', { timeout: 300000, skip: !!only }, () => {
  const { git } = require('../lib/util');
  const dir = buildVariant(variants[0]);
  try {
    const before = git(dir, ['status', '--porcelain']).stdout + git(dir, ['rev-parse', 'HEAD']).stdout + git(dir, ['config', '--list']).stdout;
    run(dir);
    const after = git(dir, ['status', '--porcelain']).stdout + git(dir, ['rev-parse', 'HEAD']).stdout + git(dir, ['config', '--list']).stdout;
    assert.strictEqual(after, before);
  } finally { cleanup(dir); }
});
