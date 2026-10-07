// SPDX-License-Identifier: MIT
// Positive and negative controls for gs-check. Each variant is built from scratch, checked, and compared with the declared expectation.
// A variant with a `strict` key is checked a second time in strict enforcement mode (a failing package script is not credited).
// Run:  node --test tools/gs-check/test/controls.test.mjs        (about 20 s per variant; about 20 minutes in all)
// Subset: FX1_ONLY=G1,R03 node --test tools/gs-check/test/controls.test.mjs
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { run, internals } from '../gs-check.mjs';
import { buildVariant, cleanup } from './build-fixtures.mjs';
import variants from './variants.mjs';

const only = process.env.FX1_ONLY ? process.env.FX1_ONLY.split(',') : null;
const outDir = process.env.FX1_REPORT_DIR || null;
const IDS = Array.from({ length: 12 }, (_, i) => 'E' + String(i + 1).padStart(2, '0'));
const compare = (rep, expect, label) => {
  const got = Object.fromEntries(rep.items.map(i => [i.id, i.status]));
  const want = Object.fromEntries(IDS.map(id => [id, expect[id] || 'PASS']));
  const diffs = IDS.filter(id => got[id] !== want[id]).map(id => `${id}: got ${got[id]}, want ${want[id]} (${(rep.items.find(i => i.id === id).reasons || []).join('; ').slice(0, 200)})`);
  assert.deepStrictEqual(diffs, [], `variant ${label} differs from its declared expectation`);
  assert.strictEqual(rep.summary.undeterminable, 0, 'no item may be UNDETERMINABLE on a control');
};

for (const v of variants) {
  if (only && !only.includes(v.id)) continue;
  test(`${v.id} ${v.kind}: ${v.desc}`, { timeout: 900000 }, () => {
    const dir = buildVariant(v);
    try {
      const rep = run(dir);
      if (outDir) fs.writeFileSync(path.join(outDir, `${v.id}.json`), JSON.stringify(rep, null, 2));
      compare(rep, v.expect, v.id + ' (default mode)');
      if (v.strict) compare(run(dir, { strict: true }), v.strict, v.id + ' (strict mode)');
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
  const { git } = internals.util;
  const dir = buildVariant(variants[0]);
  try {
    const before = git(dir, ['status', '--porcelain']).stdout + git(dir, ['rev-parse', 'HEAD']).stdout + git(dir, ['config', '--list']).stdout;
    run(dir);
    const after = git(dir, ['status', '--porcelain']).stdout + git(dir, ['rev-parse', 'HEAD']).stdout + git(dir, ['config', '--list']).stdout;
    assert.strictEqual(after, before);
  } finally { cleanup(dir); }
});
