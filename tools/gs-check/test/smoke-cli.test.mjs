// SPDX-License-Identifier: MIT
// Smoke test of the command that the "Verify the substrate" formula tells an assistant to run, no model involved:
//   node gs-check.mjs --repo <project> --strict --verbose --out <report>
// applied (from OUTSIDE the project folder, as the formula says) to the three hand-built known-good projects (node, python, and node wired to the
// reference lock tool) and to negative controls. Asserts the exit code, the shape of the output (one line per item E01..E12, a summary line, a
// report file), the statuses of the targeted items, and that a second run gives the same statuses.
// Run: node --test tools/gs-check/test/smoke-cli.test.mjs   (about 10 minutes)
import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { buildVariant, cleanup } from './build-fixtures.mjs';
import variants from './variants.mjs';

const CLI = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'gs-check.mjs');
const env = { ...process.env }; for (const k of Object.keys(env)) if (/^(NODE_TEST_CONTEXT|NODE_OPTIONS)$/.test(k)) delete env[k];
const IDS = Array.from({ length: 12 }, (_, i) => 'E' + String(i + 1).padStart(2, '0'));

function verify(variantId) {
  const v = variants.find(x => x.id === variantId);
  const dir = buildVariant(v), outside = fs.mkdtempSync(path.join(os.tmpdir(), 'gs-smoke-'));
  try {
    const reportFile = path.join(outside, 'report.json');
    const run = () => spawnSync(process.execPath, [CLI, '--repo', dir, '--strict', '--verbose', '--out', reportFile], { cwd: outside, encoding: 'utf8', env, timeout: 900000, maxBuffer: 1 << 26 });
    const r1 = run(), r2 = run();
    const status = r => Object.fromEntries([...r.stdout.matchAll(/^(E\d\d) (PASS|PARTIAL|ABSENT|UNDETERMINABLE)\b/gm)].map(m => [m[1], m[2]]));
    return { v, r1, r2, s1: status(r1), s2: status(r2), report: JSON.parse(fs.readFileSync(reportFile, 'utf8')), sha: crypto.createHash('sha256').update(fs.readFileSync(reportFile)).digest('hex') };
  } finally { cleanup(dir); fs.rmSync(outside, { recursive: true, force: true, maxRetries: 3 }); }
}

for (const id of ['G1', 'G3', 'GS1']) {
  test(`smoke ${id}: known-good, the formula's command exits 0 and prints twelve PASS lines, twice the same`, { timeout: 1500000 }, () => {
    const x = verify(id);
    assert.strictEqual(x.r1.status, 0, x.r1.stdout.slice(-1500));
    assert.deepStrictEqual(Object.keys(x.s1), IDS); assert.ok(Object.values(x.s1).every(s => s === 'PASS'), JSON.stringify(x.s1));
    assert.deepStrictEqual(x.s1, x.s2);
    assert.match(x.r1.stdout, /summary \(strict\): \{"pass":12,/); assert.strictEqual(x.report.mode, 'strict'); assert.strictEqual(x.sha.length, 64);
  });
}

// negative controls: [variant, the items that must NOT be PASS in strict mode]
const NEG = [['R06', ['E05', 'E06', 'E07', 'E10', 'E11']], ['B05', ['E05']], ['X01', ['E05', 'E11']], ['R11', ['E10']], ['GS2', ['E10']], ['GS3', ['E10']], ['GS6', ['E11']], ['GS8', ['E07', 'E10']]];
for (const [id, bad] of NEG) {
  test(`smoke ${id}: negative control, the formula's command exits 1 and the statuses of ${bad.join(', ')} are not PASS`, { timeout: 1500000 }, () => {
    const x = verify(id);
    assert.strictEqual(x.r1.status, 1, x.r1.stdout.slice(-1500));
    assert.deepStrictEqual(Object.keys(x.s1), IDS);
    for (const item of bad) assert.notStrictEqual(x.s1[item], 'PASS', `${item} should not be PASS: ${JSON.stringify(x.s1)}`);
    for (const item of IDS.filter(i => !bad.includes(i))) assert.notStrictEqual(x.s1[item], 'UNDETERMINABLE');
    assert.match(x.r1.stdout, /summary \(strict\): /); assert.deepStrictEqual(x.s1, x.s2);
  });
}
