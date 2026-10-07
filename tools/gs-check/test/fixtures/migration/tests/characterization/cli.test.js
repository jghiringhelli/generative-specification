'use strict';
// @gs AC-001 docs/spec/SPEC.md#acceptance-criteria
// Characterization suite: it pins the observable behavior of the command line. Black-box: it never imports the system's source.
const test = require('node:test');
const assert = require('node:assert');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const ROOT = process.env.GS_SUT_ROOT || path.join(__dirname, '..', '..');
const CMD = process.env.GS_SUT_CMD || 'node src/cli.js';
const run = (...a) => spawnSync(`${CMD} ${a.join(' ')}`, { cwd: ROOT, shell: true, encoding: 'utf8' });

test('AC-001 balance of 3 -1 4 prints 6', () => { const r = run('balance', 3, -1, 4); assert.strictEqual(r.status, 0); assert.strictEqual(r.stdout.trim(), '6'); });
test('AC-002 balance of no entries prints 0', () => { const r = run('balance'); assert.strictEqual(r.status, 0); assert.strictEqual(r.stdout.trim(), '0'); });
test('AC-003 a non-integer entry exits 1 and says so', () => { const r = run('balance', 1.5); assert.strictEqual(r.status, 1); assert.match(r.stderr, /integers/); });
test('AC-004 largest debit of 3 -1 -5 prints 5', () => { const r = run('largest-debit', 3, -1, -5); assert.strictEqual(r.status, 0); assert.strictEqual(r.stdout.trim(), '5'); });
test('AC-005 largest debit without any debit prints 0', () => { const r = run('largest-debit', 1, 2); assert.strictEqual(r.stdout.trim(), '0'); });
test('AC-006 an unknown command exits 2 with a usage line', () => { const r = run('frobnicate'); assert.strictEqual(r.status, 2); assert.match(r.stderr, /usage/); });
test('AC-007 largest-debit rejects a non-integer like balance does', () => { const r = run('largest-debit', 'x'); assert.strictEqual(r.status, 1); assert.match(r.stderr, /integers/); });
