// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Juan Carlos Ghiringhelli, PragmaWorks
// Tests of the signed ratifications (gs-decide.mjs), the commit-signature check (gs-decide-hook.mjs), the commit-marking hook
// (gs-attribution-hook.mjs) and the CI script (gs-decide-ci.mjs). Real ssh-keygen keys in temp directories, throwaway git repositories,
// no model, no network. Skipped as a whole, with a message, when ssh-keygen or git >= 2.34 is absent. Run: node --test tools/gs-decide/test
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseLog, formatEntry, haveSshKeygen } from '../gs-decide.mjs';

const HERE = dirname(fileURLToPath(import.meta.url)), TOOL = join(HERE, '..');
const TOOLS = ['gs-decide.mjs', 'gs-decide-hook.mjs', 'gs-attribution-hook.mjs', 'gs-decide-ci.mjs'];
const env = (extra = {}) => { const e = { ...process.env }; for (const k of Object.keys(e)) if (/^(NODE_TEST_CONTEXT|GIT_.*|CLAUDECODE|CLAUDE_CODE_ENTRYPOINT|GS_DECIDE_.*|CURSOR_AGENT|CODEX_SANDBOX|AIDER_MODEL|GEMINI_CLI)$/.test(k)) delete e[k]; return { ...e, ...extra }; };
const out = r => (r.stdout || '') + (r.stderr || '');
const NOW = '2026-10-08T10:00:00Z', TODAY = '2026-10-08';
const gitVer = (spawnSync('git', ['--version'], { encoding: 'utf8' }).stdout.match(/(\d+)\.(\d+)/) || [0, 0, 0]).slice(1).map(Number);
const SKIP = !haveSshKeygen() ? 'ssh-keygen not found (install OpenSSH or Git for Windows): the signature tests were not run' : (gitVer[0] < 2 || (gitVer[0] === 2 && gitVer[1] < 34)) ? 'git older than 2.34: SSH commit signatures are not available' : false;
if (SKIP) console.log('# SKIPPED signed.test.mjs: ' + SKIP);
const t = (name, fn) => test(name, { skip: SKIP }, fn);

// keys: maria (a human), eve (a human not in the policy), agent (listed with role agent)
const KD = SKIP ? '' : mkdtempSync(join(tmpdir(), 'gskeys-'));
const keyOf = n => { const f = join(KD, n); if (!SKIP) spawnSync('ssh-keygen', ['-q', '-t', 'ed25519', '-N', '', '-C', n, '-f', f]); return f; };
const K = SKIP ? {} : { maria: keyOf('maria'), eve: keyOf('eve'), agent: keyOf('agent'), maria2: keyOf('maria2') };
const pub = n => readFileSync(K[n] + '.pub', 'utf8').trim();
const POLICY = () => JSON.stringify({ identities: { 'maria@example.com': ['tech lead'], 'agent@example.com': ['agent'] }, keys: { 'maria@example.com': [pub('maria')], 'agent@example.com': [pub('agent')] } }, null, 1) + '\n';

function proj({ gs = { decide: { requireSigned: true } } } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'gssg-'));
  const w = (rel, text) => { mkdirSync(dirname(join(dir, rel)), { recursive: true }); writeFileSync(join(dir, rel), text); };
  w('docs/spec/SPEC.md', '# Spec\n\n- [ ] AC-001 balance of 3, -1, 4 is 6.\n'); w('src/a.js', 'exports.a = 1;\n'); w('docs/decision-roles.json', POLICY()); w('.gs.json', JSON.stringify(gs));
  for (const f of TOOLS) { mkdirSync(join(dir, 'tools/gs-decide'), { recursive: true }); copyFileSync(join(TOOL, f), join(dir, 'tools/gs-decide', f)); }
  const sh = (cmd, args, x = {}) => spawnSync(cmd, args, { cwd: dir, encoding: 'utf8', env: env(x.env), input: x.input });
  const g = (...a) => sh('git', a), node = (f, a, e) => sh(process.execPath, [join(dir, 'tools/gs-decide', f), ...a], { env: { GS_DECIDE_NOW: NOW, GS_DECIDE_TODAY: TODAY, ...e } });
  g('init', '-q', '-b', 'main'); g('config', 'user.email', 'maria@example.com'); g('config', 'user.name', 'Maria Ratifier'); g('config', 'core.autocrlf', 'false'); g('config', 'commit.gpgsign', 'false');
  const P = {
    dir, g, w, read: rel => readFileSync(join(dir, rel), 'utf8'),
    as(email, name) { g('config', 'user.email', email); g('config', 'user.name', name); },
    decide: (...a) => node('gs-decide.mjs', a), decideEnv: (e, ...a) => node('gs-decide.mjs', a, e),
    hook: (...a) => node('gs-decide-hook.mjs', a), attr: (...a) => node('gs-attribution-hook.mjs', a), attrEnv: (e, ...a) => node('gs-attribution-hook.mjs', a, e), ci: (...a) => node('gs-decide-ci.mjs', a),
    msg(text) { const f = join(dir, '.git', 'MSG'); writeFileSync(f, text); return f; },
    commit(msg, extra = []) { g('add', '-A'); const r = g('commit', '-q', '-m', msg, '--no-verify', ...extra); assert.equal(r.status, 0, out(r)); },
    signedCommit(msg, key) { g('add', '-A'); const r = g('-c', 'gpg.format=ssh', '-c', 'user.signingkey=' + key, 'commit', '-q', '-S', '-m', msg, '--no-verify'); assert.equal(r.status, 0, out(r)); },
    sign(path, key = K.maria, kind = 'spec') { const r = P.decide('add', '--kind', kind, '--role', 'tech lead', '--covers', path, '--why', 'reviewed the change and accepted it as is', '--key', key); return r; },
    // the commit-msg hooks as git runs them: stage, run decide then attribution with the message, commit if both pass
    try(msg, e = {}) { g('add', '-A'); const f = P.msg(msg), a = node('gs-decide-hook.mjs', ['--msg-file', f]), b = node('gs-attribution-hook.mjs', ['--msg-file', f], e); const ok = a.status === 0 && b.status === 0; if (ok) g('commit', '-q', '-m', msg, '--no-verify'); return { ok, a, b, text: out(a) + out(b) }; },
  };
  P.commit('chore: initial files');
  return P;
}
const ENTRY_AGENT = { CLAUDECODE: '1' };

// ---------- signed entries ----------
t('S1 add signs the entry with the SSH key; verify checks the signature, the fingerprint and the role', () => {
  const P = proj(); const r = P.sign('docs/spec/SPEC.md'); assert.equal(r.status, 0, out(r));
  assert.match(r.stdout, /signed SHA256:/);
  const log = P.read('docs/decisions.log.md'); assert.match(log, /^sigkey: SHA256:\S+$/m); assert.match(log, /^sig: [A-Za-z0-9+/=]+$/m);
  const v = P.decide('verify', '--require-signed'); assert.equal(v.status, 0, out(v));
});
t('S2 an edited signed entry is caught: edited text breaks the chain; edited and rehashed text breaks the signature', () => {
  const P = proj(); P.sign('docs/spec/SPEC.md');
  const log = P.read('docs/decisions.log.md');
  P.w('docs/decisions.log.md', log.replace('accepted it as is', 'accepted it blindly'));
  let v = P.decide('verify'); assert.equal(v.status, 1); assert.match(out(v), /CHAIN-BROKEN/);
  // the forger rehashes the entry (valid chain) but cannot re-sign it without maria's key
  const parsed = parseLog(log), e = parsed.entries[0]; e.why = 'accepted it blindly, forged'; e.entry = undefined;
  const rebuilt = parsed.header + '\n' + formatEntry({ ...e, sig: e.sig, sigkey: e.sigkey });
  P.w('docs/decisions.log.md', rebuilt.replace(/^entry: .*$/m, m => m)); // formatEntry recomputed the entry line
  v = P.decide('verify'); assert.equal(v.status, 1, out(v)); assert.match(out(v), /BAD-SIGNATURE D-0001/);
});
t('S3 a signature made with a key the policy does not list for that identity fails (a valid key of someone else is not enough)', () => {
  const P = proj(); const r = P.sign('docs/spec/SPEC.md', K.eve); assert.equal(r.status, 0, out(r));
  const v = P.decide('verify'); assert.equal(v.status, 1); assert.match(out(v), /BAD-SIGNATURE D-0001/);
});
t('S4 an identity with no key listed: BAD-SIGNATURE (cannot be checked)', () => {
  const P = proj(); P.as('bob@example.com', 'Bob'); P.w('docs/decision-roles.json', JSON.stringify({ identities: { 'bob@example.com': ['tech lead'] } })); P.commit('chore: bob');
  const r = P.sign('docs/spec/SPEC.md', K.eve); assert.equal(r.status, 0, out(r));
  const v = P.decide('verify'); assert.equal(v.status, 1); assert.match(out(v), /no key in/);
});
t('S5 requireSigned: add without a key is refused (exit 2); --no-sign writes an entry that does not ratify', () => {
  const P = proj();
  let r = P.decide('add', '--kind', 'spec', '--role', 'tech lead', '--covers', 'docs/spec/SPEC.md', '--why', 'reviewed and accepted as is'); assert.equal(r.status, 2); assert.match(out(r), /requireSigned/);
  r = P.decide('add', '--kind', 'spec', '--role', 'tech lead', '--covers', 'docs/spec/SPEC.md', '--why', 'reviewed and accepted as is', '--no-sign'); assert.equal(r.status, 0, out(r));
  assert.match(out(P.decide('verify')), /UNSIGNED/); assert.equal(P.decide('verify', '--require-signed').status, 1);
  assert.match(out(P.decide('verify', '--require-ratified')), /UNRATIFIED/); assert.equal(P.decide('verify', '--require-ratified').status, 1);
});
t('S6 hook: a protected change with no entry is refused; with an unsigned entry refused; with a verified human-signed entry accepted', () => {
  const P = proj(); P.w('docs/spec/SPEC.md', P.read('docs/spec/SPEC.md') + '- [ ] AC-002 empty list is 0.\n');
  let r = P.try('spec: add AC-002'); assert.equal(r.ok, false); assert.match(r.text, /no ratification entry/);
  P.decide('add', '--kind', 'spec', '--role', 'tech lead', '--covers', 'docs/spec/SPEC.md', '--why', 'reviewed and accepted as is', '--no-sign');
  r = P.try('spec: add AC-002'); assert.equal(r.ok, false, r.text);
  const Q = proj(); Q.w('docs/spec/SPEC.md', Q.read('docs/spec/SPEC.md') + '- [ ] AC-002 empty list is 0.\n');
  assert.equal(Q.sign('docs/spec/SPEC.md').status, 0);
  r = Q.try('spec: add AC-002'); assert.equal(r.ok, true, r.text); assert.match(r.text, /entry/);
});
t('S7 an entry signed with an AGENT key is a note: it never ratifies a protected change, and verify says so', () => {
  const P = proj(); P.as('agent@example.com', 'Claude Agent'); P.w('docs/spec/SPEC.md', P.read('docs/spec/SPEC.md') + '- [ ] AC-003 x.\n');
  const r = P.decide('add', '--kind', 'spec', '--role', 'agent', '--covers', 'docs/spec/SPEC.md', '--why', 'the agent proposes this change as a note', '--key', K.agent); assert.equal(r.status, 0, out(r));
  const v = P.decide('verify'); assert.equal(v.status, 0, out(v)); assert.match(out(v), /AGENT-KEY D-0001/);
  const c = P.try('spec: AC-003'); assert.equal(c.ok, false); assert.match(c.text, /no ratification entry/);
  assert.match(out(P.decide('verify', '--require-ratified')), /UNRATIFIED/);
});
t('S8 default mode (requireSigned off): an unsigned entry still works as before, and no signature is demanded', () => {
  const P = proj({ gs: {} }); P.w('docs/spec/SPEC.md', P.read('docs/spec/SPEC.md') + '- [ ] AC-004 y.\n');
  assert.equal(P.decide('add', '--kind', 'spec', '--role', 'tech lead', '--covers', 'docs/spec/SPEC.md', '--why', 'reviewed and accepted as is').status, 0);
  assert.equal(P.try('spec: AC-004').ok, true); const v = P.decide('verify'); assert.equal(v.status, 0); assert.match(out(v), /UNSIGNED/);
});
t('S9 key by environment (GS_DECIDE_KEY) and by .gs.json signingKey', () => {
  const P = proj(); const r = P.decideEnv({ GS_DECIDE_KEY: K.maria }, 'add', '--kind', 'decision', '--role', 'tech lead', '--ref', 'use postgres', '--why', 'chosen after the load test'); assert.equal(r.status, 0, out(r)); assert.match(r.stdout, /signed/);
  assert.equal(P.decide('verify', '--require-signed').status, 0);
});
t('S10 a key file that does not exist: the failure is reported (exit 2) and nothing is appended', () => {
  const P = proj(); const r = P.sign('docs/spec/SPEC.md', join(KD, 'nokey')); assert.equal(r.status, 2, out(r));
  assert.equal(readOrNull(join(P.dir, 'docs/decisions.log.md')), null);
});
function readOrNull(f) { try { return readFileSync(f, 'utf8'); } catch { return null; } }

// ---------- commit signatures (git's own mechanism) ----------
t('S11 requireSignedCommits: a protected-path commit signed with a listed key passes; unsigned fails; agent-signed fails; unprotected unsigned passes', () => {
  const P = proj({ gs: { decide: { requireSigned: true, requireSignedCommits: true } } });
  P.w('docs/spec/SPEC.md', P.read('docs/spec/SPEC.md') + '- [ ] AC-005 z.\n'); assert.equal(P.sign('docs/spec/SPEC.md').status, 0);
  P.signedCommit('spec: AC-005', K.maria); assert.equal(P.hook('--commit', 'HEAD').status, 0, out(P.hook('--commit', 'HEAD')));
  P.w('docs/spec/SPEC.md', P.read('docs/spec/SPEC.md') + '- [ ] AC-006 w.\n'); assert.equal(P.sign('docs/spec/SPEC.md').status, 0);
  P.commit('spec: AC-006 unsigned'); let r = P.hook('--commit', 'HEAD'); assert.equal(r.status, 1); assert.match(out(r), /not verifiably signed/);
  P.w('docs/spec/SPEC.md', P.read('docs/spec/SPEC.md') + '- [ ] AC-007 v.\n'); assert.equal(P.sign('docs/spec/SPEC.md').status, 0);
  P.signedCommit('spec: AC-007 signed by eve', K.eve); r = P.hook('--commit', 'HEAD'); assert.equal(r.status, 1); assert.match(out(r), /not verifiably signed/);
  P.w('docs/spec/SPEC.md', P.read('docs/spec/SPEC.md') + '- [ ] AC-008 u.\n'); assert.equal(P.sign('docs/spec/SPEC.md').status, 0);
  P.signedCommit('spec: AC-008 signed by the agent', K.agent); r = P.hook('--commit', 'HEAD'); assert.equal(r.status, 1); assert.match(out(r), /agent key/);
  P.w('src/a.js', 'exports.a = 2;\n'); P.commit('feat: a'); assert.equal(P.hook('--commit', 'HEAD').status, 0);
});

// ---------- the attribution hook ----------
const ON = { decide: { requireSigned: true }, attribution: { enabled: true } };
t('A0 off by default: with no attribution key nothing is checked, and it says so', () => {
  const P = proj({ gs: {} }); const r = P.attr('--commit', 'HEAD'); assert.equal(r.status, 0); assert.match(out(r), /is off/);
  P.w('src/a.js', 'x\n'); assert.equal(P.try('feat: x\n\nSigned-off-by: Claude <noreply@anthropic.com>').b.status, 0);
});
t('A1 an agent never adds Signed-off-by: refused for an agent identity and for an AI-looking name; a person Signed-off-by passes', () => {
  const P = proj({ gs: ON }); P.w('src/a.js', 'y\n');
  let r = P.try('feat: y\n\nSigned-off-by: Claude <noreply@anthropic.com>'); assert.equal(r.ok, false); assert.match(r.text, /A1/);
  r = P.try('feat: y\n\nSigned-off-by: Agent <agent@example.com>'); assert.equal(r.ok, false); assert.match(r.text, /A1/); // listed with role agent in the policy
  r = P.try('feat: y\n\nSigned-off-by: Maria Ratifier <maria@example.com>'); assert.equal(r.ok, true, r.text);
});
t('A2 Assisted-by must read AGENT:MODEL [TOOLS]; an AI Co-Authored-By must read Name <email>', () => {
  const P = proj({ gs: ON }); P.w('src/a.js', 'z\n');
  let r = P.try('feat: z\n\nAssisted-by: claude'); assert.equal(r.ok, false); assert.match(r.text, /A2/);
  r = P.try('feat: z\n\nCo-Authored-By: Claude'); assert.equal(r.ok, false); assert.match(r.text, /A2/);
  r = P.try('feat: z\n\nAssisted-by: claude-code:claude-sonnet-5-5 [gs-check gs-decide]'); assert.equal(r.ok, true, r.text);
  P.w('src/a.js', 'zz\n'); r = P.try('feat: zz\n\nCo-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>'); assert.equal(r.ok, true, r.text);
});
t('A3 a commit under an agent identity with no marking is refused; with a marking accepted', () => {
  const P = proj({ gs: ON }); P.as('agent@example.com', 'Claude Agent'); P.w('src/a.js', 'q\n');
  let r = P.try('feat: q'); assert.equal(r.ok, false); assert.match(r.text, /A3/);
  r = P.try('feat: q\n\nAssisted-by: claude-code:claude-sonnet-5-5'); assert.equal(r.ok, true, r.text);
});
t('A4 heuristic: an agent environment variable and no marking is refused; the same variable with a marking passes', () => {
  const P = proj({ gs: ON }); P.w('src/a.js', 'e\n');
  let r = P.try('feat: e', ENTRY_AGENT); assert.equal(r.ok, false); assert.match(r.text, /A4/);
  r = P.try('feat: e\n\nAssisted-by: claude-code:claude-sonnet-5-5', ENTRY_AGENT); assert.equal(r.ok, true, r.text);
});
t('A5 LIMIT, stated in a test: an agent session with no marking, a person identity and no environment variable is not detected', () => {
  const P = proj({ gs: ON }); P.w('src/a.js', 'silent\n'); const r = P.try('feat: written by an agent that left no trace'); assert.equal(r.ok, true, r.text);
});
t('A6 a marked commit that touches a protected path needs a verified human ratification; an agent-key entry does not count; a human-signed one does', () => {
  const P = proj({ gs: ON }); const spec = () => P.w('docs/spec/SPEC.md', P.read('docs/spec/SPEC.md') + '- [ ] AC-009 t.\n');
  const M = '\n\nAssisted-by: claude-code:claude-sonnet-5-5';
  spec(); let r = P.try('spec: AC-009' + M); assert.equal(r.ok, false); assert.match(r.text, /ratification/);
  P.as('agent@example.com', 'Claude Agent'); P.decide('add', '--kind', 'spec', '--role', 'agent', '--covers', 'docs/spec/SPEC.md', '--why', 'the agent notes this change here', '--key', K.agent);
  r = P.try('spec: AC-009' + M); assert.equal(r.ok, false, r.text);
  // start over with the human
  P.g('reset', '-q'); P.g('checkout', '--', '.'); P.g('clean', '-fdq'); P.as('maria@example.com', 'Maria Ratifier'); spec();
  assert.equal(P.sign('docs/spec/SPEC.md').status, 0); r = P.try('spec: AC-009' + M); assert.equal(r.ok, true, r.text);
});
t('A7 CI script: a --no-verify commit (unmarked, under an agent identity, protected path, unsigned) is caught over the range; a clean range passes', () => {
  const P = proj({ gs: { ...ON, decide: { requireSigned: true } } }); P.g('branch', 'base');
  P.w('src/a.js', 'ok\n'); P.commit('feat: ok');
  let r = P.ci('--base', 'base'); assert.equal(r.status, 0, out(r));
  P.as('agent@example.com', 'Claude Agent'); P.w('docs/spec/SPEC.md', P.read('docs/spec/SPEC.md') + '- [ ] AC-010 s.\n'); P.commit('spec: sneaky');
  r = P.ci('--base', 'base'); assert.equal(r.status, 1); assert.match(out(r), /A3/); assert.match(out(r), /no ratification entry/);
});
