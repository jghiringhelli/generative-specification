// SPDX-License-Identifier: MIT
// Controls for the migration checks (gs-check --migration). Each variant is a legacy script migrated to a substrate; the expectation declares
// the migration items (M01..M09) and the substrate items (E01..E12) that are not PASS. Everything else must be PASS.
// Run:  node --test tools/gs-check/test/migration.test.mjs     Subset: FX1_ONLY=MG1,MG4 node --test ...
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { run } from '../gs-check.mjs';
import { buildVariant, cleanup } from './build-fixtures.mjs';
import variants from './migration-variants.mjs';

const only = process.env.FX1_ONLY ? process.env.FX1_ONLY.split(',') : null;
const outDir = process.env.FX1_REPORT_DIR || null;
const E = Array.from({ length: 12 }, (_, i) => 'E' + String(i + 1).padStart(2, '0'));
const M = Array.from({ length: 9 }, (_, i) => 'M' + String(i + 1).padStart(2, '0'));

for (const v of variants) {
  if (only && !only.includes(v.id)) continue;
  test(`${v.id} ${v.kind}: ${v.desc}`, { timeout: 900000 }, () => {
    const dir = buildVariant({ ...v, migration: true });
    try {
      const rep = run(dir, { migration: true });
      if (outDir) fs.writeFileSync(path.join(outDir, `${v.id}.json`), JSON.stringify(rep, null, 2));
      const got = Object.fromEntries([...rep.items, ...rep.migration.items].map(i => [i.id, i.status]));
      const want = { ...Object.fromEntries([...E, ...M].map(id => [id, 'PASS'])), ...(v.expectE || {}), ...(v.expect || {}) };
      const diffs = [...E, ...M].filter(id => got[id] !== want[id]).map(id => `${id}: got ${got[id]}, want ${want[id]} (${([...rep.items, ...rep.migration.items].find(i => i.id === id).reasons || []).join('; ').slice(0, 260)})`);
      assert.deepStrictEqual(diffs, [], `variant ${v.id} differs from its declared expectation`);
    } finally { cleanup(dir); }
  });
}

test('determinism: two migration runs on the known-good migration give identical statuses and reasons', { timeout: 600000, skip: !!only }, () => {
  const dir = buildVariant({ ...variants[0], migration: true });
  try {
    const strip = r => [...r.items, ...r.migration.items].map(i => [i.id, i.status, i.reasons]);
    assert.deepStrictEqual(strip(run(dir, { migration: true })), strip(run(dir, { migration: true })));
  } finally { cleanup(dir); }
});
