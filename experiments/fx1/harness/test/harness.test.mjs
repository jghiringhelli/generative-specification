// Tests that need no model and no key. The container tests need Docker and the images fx1-linux (skipped when Docker is absent).
// Run from anywhere:  FX_ROOT=<empty temp folder> FORMULA_DIR=<formulas>/docs/formulas TOOLS_DIR=<formulas>/tools node --test experiments/fx1/harness/test/harness.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import cp from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { assertAgentArgs } from '../lib/docker.mjs';
import { parseOtel } from '../adapters/copilot.mjs';
import { scan } from '../scan-secrets.mjs';
import { gateCheck } from '../lib/gate.mjs';

const H = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const node = (args, env = {}) => cp.spawnSync('node', args, { encoding: 'utf8', env: { ...process.env, ...env } });
const dockerOk = cp.spawnSync('docker', ['image', 'inspect', 'fx1-linux']).status === 0;

test('schedule is deterministic and blocked', () => {
  const args = [`${H}/schedule.mjs`, '--stage', 't', '--seed', '7', '--vendors', 'anth,oai', '--cells', 'A:hive:en,B:kiln:en', '--reps', '2'];
  const a = node(args).stdout, b = node(args).stdout;
  assert.equal(a, b);
  const rows = a.trim().split('\n').slice(1);
  assert.equal(rows.length, 8);
  assert.equal(new Set(rows.map(r => r.split(',')[2])).size, 8, 'ids unique');
  assert.notEqual(a, node(args.map(x => (x === '7' ? '8' : x))).stdout, 'a different seed gives a different order');
});

test('allow-list refuses the checker mount, host network and the docker socket', () => {
  const ok = ['-v', 'vol:/work', '-v', 'C:/x/cfg/01-f1:/cfg', '-v', 'C:/t/gs-lock:/tools/gs-lock:ro'];
  assert.doesNotThrow(() => assertAgentArgs(ok, ['vol', 'C:/x/cfg/01-f1', 'C:/t/gs-lock']));
  assert.throws(() => assertAgentArgs([...ok, '-v', 'C:/t:/tools:ro'], ['vol', 'C:/x/cfg/01-f1', 'C:/t/gs-lock']), /ISOLATION/);
  assert.throws(() => assertAgentArgs(['--network', 'host'], []), /ISOLATION/);
  assert.throws(() => assertAgentArgs(['-v', '/var/run/docker.sock:/var/run/docker.sock'], []), /ISOLATION/);
  assert.throws(() => assertAgentArgs(['--privileged'], []), /ISOLATION/);
});

test('secret scanner finds planted shapes and an env value, and prints no secret', () => {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'fxscan-'));
  fs.writeFileSync(`${d}/a.txt`, 'token ghp_' + 'a'.repeat(36) + ' end');
  fs.writeFileSync(`${d}/b.txt`, 'OPENAI_API_KEY=' + 'z1'.repeat(14));
  fs.writeFileSync(`${d}/.credentials.json`, '{}');
  fs.writeFileSync(`${d}/clean.txt`, 'nothing here');
  const hits = scan([d]);
  assert.ok(hits.length >= 3);
  assert.ok(hits.every(([f, n]) => !String(n).includes('aaaa')));
  process.env.FX_TEST_SECRET_TOKEN = 'unique-literal-value-12345';
  fs.writeFileSync(`${d}/c.txt`, 'x unique-literal-value-12345 y');
  assert.ok(scan([d]).some(([f, n]) => /FX_TEST_SECRET_TOKEN/.test(n)));
  delete process.env.FX_TEST_SECRET_TOKEN;
  fs.rmSync(d, { recursive: true, force: true });
});

test('otel parser prefers invoke_agent spans and de-duplicates by span id', () => {
  const f = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'fxotel-')), 'o.jsonl');
  const span = (name, id, i, o) => JSON.stringify({ name, spanId: id, attributes: [{ key: 'gen_ai.usage.input_tokens', value: { intValue: i } }, { key: 'gen_ai.usage.output_tokens', value: { intValue: o } }, { key: 'gen_ai.response.model', value: { stringValue: 'm-1' } }] });
  fs.writeFileSync(f, [span('chat m-1', 's1', 100, 10), span('chat m-1', 's1', 100, 10), span('chat m-1', 's2', 50, 5), span('invoke_agent', 's3', 150, 15)].join('\n'));
  const r = parseOtel(f);
  assert.deepEqual(r.tokens, { input: 150, output: 15, cached: 0 });
  assert.equal(r.model, 'm-1');
  assert.equal(parseOtel('/nonexistent').tokens, null);
});

test('gate refuses a registered run today (no frozen formulas tag, no prereg tag, draft status)', () => {
  const repo = path.resolve(H, '..', '..', '..');
  const g = gateCheck({ repo, formulasRoot: '' });
  if (cp.spawnSync('git', ['-C', repo, 'tag', '--list', 'prereg/FX-1-v*'], { encoding: 'utf8' }).stdout.trim()) return; // after the freeze this test no longer applies
  assert.equal(g.ok, false);
  assert.ok(g.reasons.length >= 2);
});

test('critic-targets.json is valid and every runbook file exists on the protocol branch', () => {
  const t = JSON.parse(fs.readFileSync(`${H}/critic-targets.json`, 'utf8')).targets;
  const repo = path.resolve(H, '..', '..', '..');
  for (const [k, v] of Object.entries(t)) {
    if (v.kind !== 'runbook') continue;
    assert.ok(fs.existsSync(`${repo}/${v.runbook}`), `${k} runbook`);
    for (const f of v.files) if (!/^tools\//.test(f)) assert.ok(fs.existsSync(`${repo}/${f}`), `${k}: ${f}`);
  }
});

test('mock cell runs end to end through the container path (paths A and C), writes meta and ledger, never exposes the checker', { skip: !dockerOk || !process.env.FORMULA_DIR || !process.env.TOOLS_DIR }, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fxroot-')).split(String.fromCharCode(92)).join('/');
  const env = { FX_ROOT: root, FX_SKIP_CHECKER: '1' };
  for (const [id, p, lang, fx] of [['t-A-hive-en-mock-r1', 'A', 'en', 'DEV-API-hivelog'], ['t-C-habits-en-mock-r1', 'C', 'en', 'habits']]) {
    const r = node([`${H}/run.mjs`, '--id', id, '--path', p, '--lang', lang, '--fixture', fx, '--adapter', 'mock', '--model', 'mock-1'], env);
    assert.equal(r.status, 0, r.stdout + r.stderr);
    const m = JSON.parse(fs.readFileSync(`${root}/cells/${id}/logs/meta.json`, 'utf8'));
    assert.equal(m.status, 'FINISHED'); assert.ok(m.outputCommits >= 2); assert.deepEqual(m.modelServed, ['mock-1']);
  }
  assert.ok(fs.readFileSync(`${root}/ledger.jsonl`, 'utf8').trim().split('\n').length >= 6);
  const q = node([`${H}/run.mjs`, '--id', 't-A-lamp-en-mock-r1', '--path', 'A', '--lang', 'en', '--fixture', 'DEV-PIPE-lampwatch', '--adapter', 'mock', '--model', 'mock-1'], { ...env, FX_MOCK_FAIL_LABEL: 'f1' });
  assert.equal(q.status, 3, 'an infrastructure failure is a VOID (exit 3)');
});

test('a confirmatory fixture is refused by the gate before any container starts', { skip: !process.env.FORMULA_DIR || !process.env.TOOLS_DIR }, () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'fxroot-')).split(String.fromCharCode(92)).join('/');
  const repo = path.resolve(H, '..', '..', '..');
  if (cp.spawnSync('git', ['-C', repo, 'tag', '--list', 'prereg/FX-1-v*'], { encoding: 'utf8' }).stdout.trim()) return;
  const r = node([`${H}/run.mjs`, '--id', 'x-A-lendmark-en-mock-r1', '--path', 'A', '--lang', 'en', '--fixture', 'FIX-API-lendmark', '--adapter', 'mock', '--model', 'mock-1'], { FX_ROOT: root });
  assert.equal(r.status, 5);
  assert.match(r.stderr, /REFUSED/);
  assert.ok(!fs.existsSync(`${root}/cells/x-A-lendmark-en-mock-r1`));
});
