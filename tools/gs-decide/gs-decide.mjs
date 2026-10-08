#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Juan Carlos Ghiringhelli, PragmaWorks (licence text in ../LICENSE; provided "AS IS", without warranty).
//
// gs-decide: the append-only DECISIONS log (function DECIDE). One file plus its hook (gs-decide-hook.mjs), Node 18+, no dependencies,
// no model, no network. Status: written to the canon, tested only by its own node:test suite (tools/gs-decide/test); not yet used in a
// registered run on a model-written project.
//
// WHAT IT RECORDS. Any human sign-off, not only spec changes: a spec section, a gate/hook/CI/linter change, a ratchet floor change, a waiver
// of a failing check, an accepted risk. Each entry says who (git identity), role, what (a reference and the hash of the content approved),
// why, scope, and an expiry date for waivers and risks. Entries are CHAINED: each one carries the hash of the previous entry, so editing an
// old entry is detected. The log is docs/decisions.log.md (override: .gs.json {"decide": {"log": "..."}}), LF, never edited, only appended.
//
// WHAT IT CANNOT PROVE. It cannot prove that a human acted. It proves that a NAMED GIT IDENTITY recorded a reason (git config user.name and
// user.email are whatever the shell says). An agent that runs `add` with the person's identity writes a valid entry. The entry carries
// `via: agent-suspected` when an agent environment variable is present (or --agent is passed), and the hook refuses an AI-co-authored commit
// that is approved only by such an entry; a determined agent can still lie. The real enforcement is a person reviewing the log on a protected
// branch (CODEOWNERS on the log and the protected paths) and the --range check in CI, because a local hook can be skipped (--no-verify).
//
// Commands (all accept --root <dir>; default: the current directory):
//   add --kind <k> --role <r> --why "<15+ chars>" [--ref <what>] [--covers <path|dir/|glob>]... [--covers-protected] [--scope <s>]
//       [--expires YYYY-MM-DD] [--closes D-0003] [--commit <rev>] [--agent]
//       kinds: spec gate hook ci linter ratchet waiver risk decision baseline other. waiver and risk REQUIRE --expires (<= 365 days) and a
//       waiver REQUIRES an anchor (--covers or --commit). --covers records the sha256 of each covered file as it is NOW (LF normalised), which
//       is the content approved; a path that does not exist is recorded as "deleted". --closes ends an earlier waiver or risk (a renewal is
//       a new waiver that closes the old one). baseline = accept the current content of the protected files (adopting the tool).
//   list [--json] [--open] [--all] [--last N]   the entries (--all adds gs-lock's docs/ratifications.md, read only)
//   verify [--json] [--require-ratified] [--against <rev>]
//       exit 1 on: MALFORMED CHAIN-BROKEN HISTORY-REWRITTEN EXPIRED WAIVER-NO-CHANGE RATIFICATIONS-EDITED (and UNRATIFIED with the flag).
//       warnings (exit 0): AGENT-ENTRY, EXPIRING-SOON, UNRATIFIED without the flag.
//   protected [--json]    the protected-path classes in force (defaults + .gs.json decide.protect / decide.unprotect)
//   init                  write the empty log header and the .gitattributes line (add does it too)
// Exit codes: 0 ok, 1 findings, 2 usage or environment error.
//
// Optional .gs.json key "decide": { log, protect: [globs], unprotect: [globs], roles: {"email": "role"}, allowOtherSigner: false,
//   aiPattern: "<regex>", maxWaiverDays: 365 }.

import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const LOG = 'docs/decisions.log.md';
export const RATIFICATIONS = 'docs/ratifications.md'; // gs-lock's record: read, never written here
export const SPEC_LOCK = 'docs/spec.lock';
export const GENESIS = '0'.repeat(64);
export const KINDS = ['spec', 'gate', 'hook', 'ci', 'linter', 'ratchet', 'waiver', 'risk', 'decision', 'baseline', 'other'];
const HEADER = '# Decisions and ratifications (append only)\n\nWritten by tools/gs-decide. Never edit or delete an entry: add a new one (`--closes` ends a waiver or a risk).\nEntries are chained by hash: `node tools/gs-decide/gs-decide.mjs verify` detects an edit. The log records that a named git identity gave a reason;\nit does not prove that a human acted.\n';

// Protected paths. The spec and sentinel lists, the ratchet file-name rule and the hook/CI locations are the ones gs-check uses (its
// sentinelCandidates, specCandidates, specDirs, ratchetFileNames); test/decide.test.mjs compares them with gs-check when it is next to this tool.
export const PROTECTED = {
  spec: ['CLAUDE.md', 'AGENTS.md', 'GEMINI.md', '.github/copilot-instructions.md', '.cursor/rules/**', 'SPEC.md', 'docs/SPEC.md', 'docs/spec.md',
    'docs/spec/**', 'docs/specs/**', 'docs/features/**', 'docs/especificacion/**', 'docs/especificaciones/**', 'docs/requisitos/**', SPEC_LOCK],
  gate: ['.githooks/**', '.husky/**', '.git-hooks/**', '.pre-commit-config.yaml', '.github/workflows/**', '.gitlab-ci.yml', 'azure-pipelines.yml', 'Jenkinsfile',
    '.circleci/**', 'scripts/gate*', '.gs.json', 'tools/gs-*/**', '.eslintrc*', 'eslint.config.*', '.flake8', '.pylintrc', 'ruff.toml', '.ruff.toml',
    '.golangci.*', '.dependency-cruiser.*', '.importlinter', 'CODEOWNERS', '.github/CODEOWNERS'],
  waiver: ['docs/waivers*', '.gs-waivers*'],
};
export const RATCHET_NAME = /(ratchet|baseline|floor)/, RATCHET_EXT = /\.(json|ya?ml|toml|cfg|txt)$/i;
export const DEFAULT_AI = '(claude|anthropic|copilot|openai|chatgpt|\\bgpt[-\\s]?\\d|gemini|codex|cursor|devin|aider|\\bai\\b|\\bbot\\b|noreply@anthropic)';
const AGENT_ENV = ['CLAUDECODE', 'CLAUDE_CODE_ENTRYPOINT', 'GS_DECIDE_AGENT', 'CURSOR_AGENT', 'CODEX_SANDBOX', 'AIDER_MODEL', 'GEMINI_CLI'];

// ---------- helpers (CRLF safe: every read is normalised to LF, every write is LF) ----------
export const lf = t => t.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
export const sha = d => createHash('sha256').update(d).digest('hex');
export const contentHash = b => { const buf = Buffer.isBuffer(b) ? b : Buffer.from(b); return buf.includes(0) ? sha(buf) : sha(lf(buf.toString('utf8'))); };
const git = (root, args, o = {}) => spawnSync('git', ['-c', 'core.quotepath=off', ...args], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28, ...o });
export const gitOf = git;
const isRepo = root => git(root, ['rev-parse', '--git-dir']).status === 0;
const hasHead = root => git(root, ['rev-parse', '--verify', '-q', 'HEAD']).status === 0;
const showText = (root, spec) => { const r = git(root, ['show', spec]); return r.status === 0 ? lf(r.stdout) : null; };
const showBuf = (root, spec) => { const r = git(root, ['show', spec], { encoding: 'buffer' }); return r.status === 0 ? r.stdout : null; };
const readText = (root, rel) => { try { return lf(readFileSync(join(root, rel), 'utf8')); } catch { return null; } };
const readBuf = (root, rel) => { try { return readFileSync(join(root, rel)); } catch { return null; } };
export const today = () => process.env.GS_DECIDE_TODAY || new Date().toISOString().slice(0, 10);
const nowIso = () => process.env.GS_DECIDE_NOW || new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const oneLine = s => String(s ?? '').replace(/[\r\n\t]+/g, ' ').replace(/ {2,}/g, ' ').trim();
const isDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s + 'T00:00:00Z')) && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;
const daysBetween = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 864e5);

const globRe = g => { let r = ''; for (let i = 0; i < g.length; i++) { const c = g[i]; if (c === '*') { if (g[i + 1] === '*') { r += '.*'; i++; if (g[i + 1] === '/') i++; } else r += '[^/]*'; } else if (c === '?') r += '[^/]'; else r += c.replace(/[.+^${}()|[\]\\]/g, '\\$&'); } return new RegExp('^' + r + '$'); };
const globMatch = (g, p) => globRe(g).test(g.includes('/') ? p : basename(p));

export function loadConfig(root) {
  let user = {}; try { user = JSON.parse(readText(root, '.gs.json') || '{}').decide || {}; } catch { /* a broken .gs.json: defaults */ }
  return { log: LOG, protect: [], unprotect: [], roles: {}, allowOtherSigner: false, aiPattern: DEFAULT_AI, maxWaiverDays: 365, ...user };
}
// the class of a path ('spec' | 'gate' | 'ratchet' | 'waiver' | 'record') or null
export function protectedClass(rel, cfg) {
  if (cfg.unprotect.some(g => globMatch(g, rel))) return null;
  if (rel === cfg.log || rel === RATIFICATIONS) return 'record';
  for (const [cls, globs] of Object.entries(PROTECTED)) if (globs.some(g => globMatch(g, rel))) return cls;
  if (cfg.protect.some(g => globMatch(g, rel))) return 'configured';
  const b = basename(rel);
  if (RATCHET_NAME.test(b) && RATCHET_EXT.test(b) && !/package-lock|node_modules/.test(rel)) return 'ratchet';
  return null;
}
export const isAi = (text, cfg) => new RegExp(cfg.aiPattern, 'i').test(text || '');

// ---------- the log: parse, format, chain ----------
const SINGLE = ['when', 'who', 'role', 'via', 'kind', 'ref', 'scope', 'why', 'expires', 'closes', 'commit', 'prev'], MULTI = ['covers', 'approves'];
const ORDER = ['when', 'who', 'role', 'via', 'kind', 'ref', 'covers', 'approves', 'scope', 'why', 'expires', 'closes', 'commit', 'prev'];
export function canonical(e) {
  const lines = [`## ${e.id}`];
  for (const k of ORDER) { const v = e[k]; if (Array.isArray(v)) v.forEach(x => lines.push(`${k}: ${x}`)); else if (v) lines.push(`${k}: ${v}`); }
  return lines.join('\n');
}
export const entryHash = e => sha(canonical(e));
export const formatEntry = e => canonical(e) + '\nentry: ' + entryHash(e) + '\n';

export function parseLog(text) {
  const entries = [], problems = [];
  if (text == null) return { entries, problems, header: '' };
  const lines = lf(text).split('\n'); let cur = null; const headerLines = [];
  const close = () => { if (cur) { entries.push(cur); cur = null; } };
  lines.forEach((line, n) => {
    const h = line.match(/^## (D-\d{4,})\s*$/);
    if (h) { close(); cur = { id: h[1], line: n + 1, covers: [], approves: [], _after: false }; return; }
    if (!cur) { headerLines.push(line); return; }
    if (!line.trim()) return;
    const m = line.match(/^([a-z]+): ?(.*)$/);
    if (!m) { problems.push({ code: 'MALFORMED', id: cur.id, note: `line ${n + 1}: not "key: value"` }); return; }
    const [, k, v] = m;
    if (cur._after) { problems.push({ code: 'MALFORMED', id: cur.id, note: `line ${n + 1}: text after the entry hash is not covered by the chain` }); return; }
    if (k === 'entry') { cur.entry = v.trim(); cur._after = true; }
    else if (MULTI.includes(k)) cur[k].push(v);
    else if (SINGLE.includes(k)) { if (cur[k] !== undefined) problems.push({ code: 'MALFORMED', id: cur.id, note: `line ${n + 1}: repeated key ${k}` }); cur[k] = v; }
    else problems.push({ code: 'MALFORMED', id: cur.id, note: `line ${n + 1}: unknown key ${k}` });
  });
  close();
  return { entries, problems, header: headerLines.join('\n') };
}
export function approvesOf(e) { // [{path, hash}]
  return e.approves.map(a => { const m = a.match(/^([0-9a-f]{64}|deleted) (.+)$/); return m ? { hash: m[1], path: m[2] } : null; }).filter(Boolean);
}
export function chainProblems(entries) {
  const out = []; let prev = GENESIS, n = 0;
  for (const e of entries) {
    n++;
    for (const k of ['when', 'who', 'role', 'kind', 'why', 'prev', 'entry']) if (!e[k]) out.push({ code: 'MALFORMED', id: e.id, note: `missing ${k}` });
    if (e.id !== 'D-' + String(n).padStart(4, '0')) out.push({ code: 'CHAIN-BROKEN', id: e.id, note: `expected id D-${String(n).padStart(4, '0')}: an entry was removed, reordered or duplicated` });
    if (e.kind && !KINDS.includes(e.kind)) out.push({ code: 'MALFORMED', id: e.id, note: `unknown kind ${e.kind}` });
    if (e.approves.length !== approvesOf(e).length) out.push({ code: 'MALFORMED', id: e.id, note: 'an approves line is not "<sha256|deleted> <path>"' });
    if (e.prev !== prev) out.push({ code: 'CHAIN-BROKEN', id: e.id, note: `prev is ${String(e.prev).slice(0, 12)}, the previous entry hashes to ${prev.slice(0, 12)}: an earlier entry was edited or removed` });
    const real = entryHash(e);
    if (e.entry !== real) out.push({ code: 'CHAIN-BROKEN', id: e.id, note: `the entry was edited: its text hashes to ${real.slice(0, 12)}, it declares ${String(e.entry).slice(0, 12)}` });
    prev = e.entry || real;
  }
  return out;
}
export function loadLog(root, cfg = loadConfig(root)) {
  const text = readText(root, cfg.log), p = parseLog(text);
  return { exists: text != null, text, entries: p.entries, problems: [...p.problems, ...chainProblems(p.entries)], head: p.entries.length ? p.entries[p.entries.length - 1].entry : GENESIS };
}

// ---------- waivers: status, expiry, closure ----------
export function entryStatus(entries, at = today()) { // id -> 'open' | 'closed' | 'expired' | 'n/a'
  const closed = new Set(entries.filter(e => e.closes).map(e => e.closes)), st = new Map();
  for (const e of entries) {
    const tracked = e.kind === 'waiver' || e.kind === 'risk';
    st.set(e.id, closed.has(e.id) ? 'closed' : tracked && e.expires && e.expires < at ? 'expired' : tracked ? 'open' : (e.expires && e.expires < at ? 'expired' : 'n/a'));
  }
  return st;
}
const validAt = (e, closedIds, at) => !closedIds.has(e.id) && !(e.expires && e.expires < at);

// ---------- gs-lock's record (read only) ----------
export function readRatifications(text) {
  return lf(text || '').split('\n').filter(l => l.startsWith('- ')).map(l => { const f = l.slice(2).split(' | '); return { when: f[0], who: f[1], artifact: f[2], id: f[3], target: f[4], change: f[5], reason: f.slice(6).join(' | ') }; });
}

// ---------- git reading for hook and verify ----------
export function trackedAndUntracked(root) { const r = git(root, ['ls-files', '-z', '-co', '--exclude-standard']); return r.status === 0 ? r.stdout.split('\0').filter(Boolean) : []; }
function expandCovers(root, patterns) { // -> sorted list of {path, hash}
  const files = trackedAndUntracked(root), out = new Map(), missing = [];
  for (const c of patterns) {
    let hit = files.filter(f => f === c || (c.endsWith('/') && f.startsWith(c)) || (/[*?]/.test(c) && globMatch(c, f)));
    if (!hit.length && !/[*?]/.test(c)) hit = files.filter(f => f.startsWith(c.replace(/\/*$/, '/'))); // a directory named without the slash
    if (!hit.length && !/[*?]/.test(c) && !c.endsWith('/')) { out.set(c, 'deleted'); continue; } // a named file that does not exist: the approval is its removal
    if (!hit.length) { missing.push(c); continue; }
    for (const f of hit) { const b = readBuf(root, f); out.set(f, b ? contentHash(b) : 'deleted'); }
  }
  return { list: [...out].sort(([a], [b]) => (a < b ? -1 : 1)).map(([path, hash]) => ({ path, hash })), missing };
}
export function identity(root) { const g = k => git(root, ['config', k]).stdout.trim(); const name = g('user.name'), email = g('user.email'); return name && email ? { name, email, text: `${name} <${email}>` } : null; }
const emailOf = s => ((s || '').match(/<([^>]+)>/) || [])[1]?.toLowerCase() || '';

// ---------- add ----------
export function addEntry(root, a, cfg = loadConfig(root)) { // returns {ok, entry?, error?}
  const err = error => ({ ok: false, error });
  const me = identity(root); if (!me) return err('git user.name and user.email are not set: an entry is signed with the git identity, set both');
  const kind = a.kind; if (!KINDS.includes(kind)) return err(`--kind must be one of: ${KINDS.join(' ')}`);
  const role = oneLine(a.role || cfg.roles[me.email] || cfg.roles[me.email.toLowerCase()]); if (!role) return err('--role is required (or map the e-mail in .gs.json decide.roles)');
  const why = oneLine(a.why); if (why.length < 15) return err('--why needs 15+ characters: the reason is the trace');
  const log = loadLog(root, cfg); if (log.problems.length) return err('the log does not verify, fix that first:\n' + log.problems.map(p => `  ${p.code} ${p.id}: ${p.note}`).join('\n'));
  let covers = [].concat(a.covers || []).flatMap(c => String(c).split(',')).map(s => s.trim()).filter(Boolean);
  if (a.coversProtected) covers = covers.concat(trackedAndUntracked(root).filter(f => { const c = protectedClass(f, cfg); return c && c !== 'record'; }));
  const ref = oneLine(a.ref);
  if (!covers.length && ref) { const p = ref.split('#')[0]; if (readBuf(root, p) || protectedClass(p, cfg)) covers.push(p); }
  const { list, missing } = expandCovers(root, covers); if (missing.length) return err(`--covers matches no file: ${missing.join(', ')}`);
  let expires = a.expires ? String(a.expires) : '';
  if (kind === 'waiver' || kind === 'risk') {
    if (!expires) return err(`a ${kind} needs --expires YYYY-MM-DD: nothing is waived forever`);
    if (!isDate(expires)) return err('--expires must be a real date, YYYY-MM-DD');
    if (expires < today()) return err('--expires is in the past');
    if (daysBetween(today(), expires) > cfg.maxWaiverDays) return err(`--expires is more than ${cfg.maxWaiverDays} days away (decide.maxWaiverDays): renew a shorter waiver instead`);
  } else if (expires && !isDate(expires)) return err('--expires must be a real date, YYYY-MM-DD');
  if (kind === 'waiver' && !list.length && !a.commit) return err('a waiver needs an anchor: --covers <the file it waives> or --commit <the commit it is for>, otherwise it waives nothing the log can check');
  if (a.commit && git(root, ['rev-parse', '--verify', '-q', a.commit + '^{commit}']).status !== 0) return err(`--commit ${a.commit}: no such commit`);
  if (a.closes) {
    const t = log.entries.find(e => e.id === a.closes), st = entryStatus(log.entries);
    if (!t) return err(`--closes ${a.closes}: no such entry`);
    if (!['waiver', 'risk'].includes(t.kind)) return err(`--closes ${a.closes}: only a waiver or a risk can be closed`);
    if (st.get(t.id) === 'closed') return err(`${a.closes} is already closed`);
  }
  if (!ref && !list.length && !a.commit && !a.closes) return err('say what is decided: --ref <what> and/or --covers <path>');
  const e = { id: 'D-' + String(log.entries.length + 1).padStart(4, '0'), when: nowIso(), who: me.text, role, via: a.agent || AGENT_ENV.some(k => process.env[k]) ? 'agent-suspected' : 'human', kind,
    ref: ref || (list.length ? list[0].path : ''), covers: covers.map(oneLine), approves: list.map(x => `${x.hash} ${x.path}`), scope: oneLine(a.scope), why, expires, closes: a.closes || '', commit: a.commit ? git(root, ['rev-parse', a.commit + '^{commit}']).stdout.trim() : '', prev: log.head };
  const path = join(root, cfg.log);
  if (!log.exists) initLog(root, cfg);
  const cur = lf(readFileSync(path, 'utf8'));
  appendFileSync(path, (cur.endsWith('\n') ? '' : '\n') + '\n' + formatEntry(e));
  return { ok: true, entry: e };
}
export function initLog(root, cfg = loadConfig(root)) {
  const p = join(root, cfg.log); let made = false;
  if (!existsSync(p)) { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, HEADER); made = true; }
  const ga = join(root, '.gitattributes'), have = existsSync(ga) ? lf(readFileSync(ga, 'utf8')) : '', want = `${cfg.log} text eol=lf`;
  if (!have.split('\n').some(l => l.trim() === want)) appendFileSync(ga, (have && !have.endsWith('\n') ? '\n' : '') + want + '\n');
  return made;
}

// ---------- the change check (the hook's core) ----------
// post: {log: text|null, ratifications: text|null, read(path) -> Buffer|null}, pre: {log, ratifications, read}, changes: [{s:'A'|'M'|'D', p}]
export function checkChange({ changes, post, pre, message = '', committers = [], at = today(), cfg, requireTrailerChecks = true }) {
  const refusals = [], warnings = [], touched = [];
  const postLog = parseLog(post.log), preLog = parseLog(pre.log);
  const problems = [...postLog.problems, ...chainProblems(postLog.entries)];
  if (post.log != null) problems.forEach(p => refusals.push(`${cfg.log}: ${p.code} ${p.id}: ${p.note}`));
  if (pre.log != null && post.log == null) refusals.push(`${cfg.log} was deleted: the log is append-only`);
  if (pre.log != null && post.log != null && !post.log.startsWith(pre.log)) refusals.push(`${cfg.log} is append-only: an earlier line was edited or removed`);
  if (pre.ratifications && post.ratifications != null && !post.ratifications.startsWith(pre.ratifications)) refusals.push(`${RATIFICATIONS} is append-only (gs-lock's record): a line was edited or removed`);
  if (pre.ratifications && post.ratifications == null) refusals.push(`${RATIFICATIONS} was deleted: the record is append-only`);
  const newEntries = postLog.entries.slice(preLog.entries.length);
  const closedIds = new Set(postLog.entries.filter(e => e.closes).map(e => e.closes));
  const aiCommit = [...message.matchAll(/^co-authored-by:\s*(.+)$/gim)].some(m => isAi(m[1], cfg));
  const human = e => e.via === 'human' && !isAi(e.who, cfg);
  const okFor = (path, hash, needHuman) => postLog.entries.some(e => validAt(e, closedIds, at) && (!needHuman || human(e)) && approvesOf(e).some(a => a.path === path && a.hash === hash));
  const ratGrew = (post.ratifications || '').length > (pre.ratifications || '').length;
  for (const { s, p } of changes) {
    const cls = protectedClass(p, cfg); if (!cls || cls === 'record') continue;
    const buf = s === 'D' ? null : post.read(p), hash = buf ? contentHash(buf) : 'deleted';
    let how = null;
    if (okFor(p, hash, false)) how = okFor(p, hash, true) ? 'entry' : 'entry-nonhuman';
    else if (p === SPEC_LOCK && !aiCommit) {
      if (ratGrew) how = 'gs-lock ratification';
      else if (pre.read(p) && buf && lockOnlyAdds(lf(pre.read(p).toString('utf8')), lf(buf.toString('utf8')))) how = 'lock additions only';
    }
    touched.push({ path: p, class: cls, hash, how });
    if (!how) refusals.push(`${p} (${cls}) changed with no ratification entry for this content (sha256 ${hash === 'deleted' ? 'deleted' : hash.slice(0, 12)}): record one with  node tools/gs-decide/gs-decide.mjs add --kind <kind> --role <role> --covers ${p} --why "<reason>"  and stage ${cfg.log}${aiCommit && p === SPEC_LOCK ? ' (the commit has an AI co-author: a gs-lock marker is not accepted, a human entry is needed)' : ''}`);
    else if (how === 'entry-nonhuman') { if (aiCommit) refusals.push(`${p} (${cls}): the commit has an AI co-author and the only entry covering it is not human (via ${(postLog.entries.find(e => approvesOf(e).some(a => a.path === p && a.hash === hash)) || {}).via || '?'}): a named person must record it`); else warnings.push(`${p}: approved by an agent-suspected entry`); }
    else if (aiCommit && how !== 'entry') refusals.push(`${p} (${cls}): the commit has an AI co-author; a gs-lock marker is not enough, a human gs-decide entry is`);
  }
  if (requireTrailerChecks) {
    for (const e of newEntries) {
      const em = emailOf(e.who);
      if (committers.length && !cfg.allowOtherSigner && !committers.some(c => c && c.toLowerCase() === em)) refusals.push(`${e.id} is signed by ${e.who} but the commit is by ${committers.filter(Boolean).join(' / ')}: sign with the committer identity (decide.allowOtherSigner for a reviewer who signs for someone else)`);
      if (aiCommit && !touched.length && !human(e)) warnings.push(`${e.id}: recorded in an AI-co-authored commit and not by a human identity (flagged)`);
    }
    if (/^Waiver:\s*\S/im.test(message) && !newEntries.some(e => e.kind === 'waiver')) refusals.push('the message carries a "Waiver:" line (gs-cochange) and the commit adds no waiver entry to ' + cfg.log + ': a waiver is recorded with who, why and an expiry');
  }
  return { ok: !refusals.length, refusals, warnings, touched, newEntries: newEntries.map(e => e.id), aiCommit };
}
function lockOnlyAdds(before, after) { const a = new Set(after.split('\n')); return before.split('\n').filter(l => l && !l.startsWith('#')).every(l => a.has(l)); }

// readers for the three places a change can come from
export function stagedView(root) {
  const head = hasHead(root);
  const names = git(root, ['diff', '--cached', '--name-status', '--no-renames', ...(head ? ['HEAD'] : [])]).stdout.split('\n').filter(Boolean).map(l => { const [s, ...p] = l.split('\t'); return { s: s[0], p: p.join('\t') }; });
  const cfg = loadConfig(root);
  const idx = p => showBuf(root, ':' + p), hd = p => (head ? showBuf(root, 'HEAD:' + p) : null);
  const text = (f, p) => { const b = f(p); return b ? lf(b.toString('utf8')) : null; };
  return { changes: names, cfg, post: { log: text(idx, cfg.log), ratifications: text(idx, RATIFICATIONS), read: idx }, pre: { log: text(hd, cfg.log), ratifications: text(hd, RATIFICATIONS), read: hd } };
}
export function commitView(root, rev) {
  const parents = git(root, ['rev-list', '--parents', '-n', '1', rev]).stdout.trim().split(' ').slice(1);
  if (parents.length > 1) return null; // a merge brings no change of its own
  const cfg = loadConfig(root), par = parents[0];
  const names = (par ? git(root, ['diff', '--name-status', '--no-renames', par, rev]) : git(root, ['diff-tree', '-r', '--root', '--no-commit-id', '--name-status', '--no-renames', rev])).stdout.split('\n').filter(Boolean).map(l => { const [s, ...p] = l.split('\t'); return { s: s[0], p: p.join('\t') }; });
  const at = r => p => showBuf(root, `${r}:${p}`), text = (f, p) => { const b = f(p); return b ? lf(b.toString('utf8')) : null; };
  const post = at(rev), pre = par ? at(par) : () => null;
  const info = git(root, ['log', '-1', '--format=%B%x00%ce%x00%ae%x00%cI', rev]).stdout.split('\0');
  return { changes: names, cfg, message: info[0], committers: [info[1], info[2]].map(s => (s || '').trim().toLowerCase()), at: (info[3] || '').slice(0, 10) || today(),
    post: { log: text(post, cfg.log), ratifications: text(post, RATIFICATIONS), read: post }, pre: { log: text(pre, cfg.log), ratifications: text(pre, RATIFICATIONS), read: pre } };
}
export function committerEmails(root) {
  return ['GIT_COMMITTER_IDENT', 'GIT_AUTHOR_IDENT'].map(v => emailOf(git(root, ['var', v]).stdout)).filter(Boolean);
}

// ---------- verify ----------
export function verify(root, { against = null, requireRatified = false, at = today() } = {}) {
  const cfg = loadConfig(root), findings = [], add = (level, code, id, note) => findings.push({ level, code, id: id || '', note });
  const log = loadLog(root, cfg);
  const info = { log: cfg.log, entries: log.entries.length, head: log.head, exists: log.exists };
  if (!log.exists) { add('warn', 'NOLOG', '', `${cfg.log} does not exist: nothing is recorded (run "init" or "add")`); return finish(); }
  log.problems.forEach(p => add('fail', p.code, p.id, p.note));
  if (isRepo(root)) {
    for (const rev of [hasHead(root) ? 'HEAD' : null, against].filter(Boolean)) {
      const old = showText(root, `${rev}:${cfg.log}`);
      if (old != null && !log.text.startsWith(old)) {
        const a = old.split('\n'), b = log.text.split('\n'); let i = 0; while (i < a.length && a[i] === b[i]) i++;
        add('fail', 'HISTORY-REWRITTEN', '', `${cfg.log} no longer starts with its content at ${rev}: first difference at line ${i + 1}`);
      }
      const oldRat = showText(root, `${rev}:${RATIFICATIONS}`), curRat = readText(root, RATIFICATIONS);
      if (oldRat != null && (curRat == null || !curRat.startsWith(oldRat))) add('fail', 'RATIFICATIONS-EDITED', '', `${RATIFICATIONS} (gs-lock's record) no longer starts with its content at ${rev}`);
    }
  }
  const st = entryStatus(log.entries, at), closedIds = new Set(log.entries.filter(e => e.closes).map(e => e.closes));
  for (const e of log.entries) {
    if (st.get(e.id) === 'expired' && !['waiver', 'risk'].includes(e.kind)) add('warn', 'EXPIRED-APPROVAL', e.id, `this ${e.kind} approval lapsed on ${e.expires}: re-approve it with a new entry`);
    else if (st.get(e.id) === 'expired') add('fail', 'EXPIRED', e.id, `${e.kind} expired on ${e.expires} and was not closed: renew it with a new ${e.kind} (--closes ${e.id}) or close it`);
    else if (st.get(e.id) === 'open' && e.expires && daysBetween(at, e.expires) <= 14) add('warn', 'EXPIRING-SOON', e.id, `${e.kind} expires on ${e.expires} (${daysBetween(at, e.expires)} day(s))`);
    if (e.via === 'agent-suspected') add('warn', 'AGENT-ENTRY', e.id, `signed ${e.who} from an agent environment: a person must confirm it (flagged, the log cannot tell)`);
    if (e.closes && !log.entries.some(x => x.id === e.closes && log.entries.indexOf(x) < log.entries.indexOf(e))) add('fail', 'CHAIN-BROKEN', e.id, `closes ${e.closes}, which is not an earlier entry`);
    if (e.kind === 'waiver') {
      const ap = approvesOf(e); let anchored = false;
      if (e.commit && isRepo(root) && git(root, ['merge-base', '--is-ancestor', e.commit, 'HEAD']).status === 0) anchored = true;
      if (!anchored && ap.length && isRepo(root)) anchored = ap.every(a => contentSeen(root, a.path, a.hash));
      else if (!anchored && ap.length) anchored = ap.every(a => { const b = readBuf(root, a.path); return a.hash === 'deleted' ? !b : b && contentHash(b) === a.hash; });
      if (!anchored) add('fail', 'WAIVER-NO-CHANGE', e.id, `the waiver ${e.commit ? 'names commit ' + e.commit.slice(0, 10) + ', which is not in this history' : 'approves content (' + ap.map(a => a.path).join(', ') + ') that no commit or working file ever had'}: it waives nothing that exists`);
    }
  }
  // the ratified state of the protected files in the working tree
  const unrat = [];
  for (const f of trackedAndUntracked(root)) {
    const cls = protectedClass(f, cfg); if (!cls || cls === 'record' || f === SPEC_LOCK) continue;
    const b = readBuf(root, f); if (!b) continue; const h = contentHash(b);
    if (!log.entries.some(e => validAt(e, closedIds, at) && approvesOf(e).some(a => a.path === f && a.hash === h))) unrat.push(`${f} (${cls})`);
  }
  if (unrat.length) add(requireRatified ? 'fail' : 'warn', 'UNRATIFIED', '', `${unrat.length} protected file(s) whose current content no valid entry approves: ${unrat.slice(0, 8).join(', ')}${unrat.length > 8 ? ', ...' : ''}${requireRatified ? '' : ' (reported; --require-ratified makes it fail; "add --kind baseline --covers-protected" adopts the current state)'}`);
  info.unratified = unrat.length;
  info.gsLockRatifications = readRatifications(readText(root, RATIFICATIONS)).length;
  info.open = [...st].filter(([, v]) => v === 'open').map(([id]) => id);
  return finish();
  function finish() { return { ok: !findings.some(f => f.level === 'fail'), findings, info }; }
}
// did `path` ever have this content (any commit, the index or the working tree)?
function contentSeen(root, path, hash) {
  const w = readBuf(root, path); if (hash === 'deleted' ? !w : w && contentHash(w) === hash) return true;
  const idx = showBuf(root, ':' + path); if (idx && contentHash(idx) === hash) return true;
  const revs = git(root, ['log', '--format=%H', '-n', '400', '--', path]).stdout.split('\n').filter(Boolean);
  for (const r of revs) { const b = showBuf(root, `${r}:${path}`); if (hash === 'deleted' ? !b : b && contentHash(b) === hash) return true; }
  return false;
}

// ---------- CLI ----------
const WITH_VALUE = new Set(['--root', '--kind', '--role', '--why', '--ref', '--covers', '--scope', '--expires', '--closes', '--commit', '--last', '--against', '--msg-file', '--range']);
export function parseArgs(argv) {
  const o = { _: [], flags: new Set(), covers: [] };
  for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (WITH_VALUE.has(a)) { const v = argv[++i]; if (a === '--covers') o.covers.push(v); else o[a.slice(2)] = v; } else if (a.startsWith('--')) o.flags.add(a.slice(2)); else o._.push(a); }
  return o;
}
const say = s => process.stdout.write(s + '\n');
const USAGE = 'usage: gs-decide add --kind <k> --role <r> --why "<why>" [--ref <what>] [--covers <path>]... [--covers-protected] [--scope <s>] [--expires YYYY-MM-DD] [--closes D-n] [--commit <rev>] [--agent]\n' +
  '       gs-decide list [--json] [--open] [--all] [--last N] | verify [--json] [--require-ratified] [--against <rev>] | protected [--json] | init      [--root <dir>]\n';

export function main(argv) {
  const o = parseArgs(argv), cmd = o._[0], root = o.root || process.cwd();
  if (cmd === 'init') { const made = initLog(root); say(made ? 'log created' : 'log exists'); return 0; }
  if (cmd === 'add') {
    const r = addEntry(root, { kind: o.kind, role: o.role, why: o.why, ref: o.ref, covers: o.covers, coversProtected: o.flags.has('covers-protected'), scope: o.scope, expires: o.expires, closes: o.closes, commit: o.commit, agent: o.flags.has('agent') });
    if (!r.ok) { process.stderr.write('x add: ' + r.error + '\n'); return 2; }
    const e = r.entry; say(`recorded ${e.id} ${e.kind} by ${e.who} (${e.role}, via ${e.via}): ${e.ref}${e.approves.length ? ` [${e.approves.length} file hash(es)]` : ''}${e.expires ? ' expires ' + e.expires : ''}`);
    say('next: git add ' + loadConfig(root).log + ' together with the change it approves'); return 0;
  }
  if (cmd === 'list') {
    const cfg = loadConfig(root), log = loadLog(root, cfg), st = entryStatus(log.entries);
    let rows = log.entries.map(e => ({ source: 'gs-decide', id: e.id, when: e.when, kind: e.kind, who: e.who, role: e.role, via: e.via, ref: e.ref, expires: e.expires || '', status: st.get(e.id), why: e.why, closes: e.closes }));
    if (o.flags.has('all')) rows = rows.concat(readRatifications(readText(root, RATIFICATIONS)).map((r, i) => ({ source: 'gs-lock', id: 'L-' + String(i + 1).padStart(4, '0'), when: r.when, kind: 'lock', who: r.who, role: '', via: '', ref: `${r.artifact} ${r.id}`, expires: '', status: 'n/a', why: r.reason })));
    if (o.flags.has('open')) rows = rows.filter(r => r.status === 'open');
    if (o.last) rows = rows.slice(-Number(o.last));
    if (o.flags.has('json')) say(JSON.stringify(rows, null, 1));
    else if (!rows.length) say(log.exists ? '(no entries)' : `(no ${cfg.log})`);
    else rows.forEach(r => say(`${r.id} ${r.when} ${r.kind.padEnd(8)} ${r.status.padEnd(7)} ${r.who}${r.role ? ' [' + r.role + ']' : ''}${r.via === 'agent-suspected' ? ' (agent-suspected)' : ''} ${r.ref}${r.expires ? ' expires ' + r.expires : ''} | ${r.why}`));
    return 0;
  }
  if (cmd === 'verify') {
    const r = verify(root, { against: o.against, requireRatified: o.flags.has('require-ratified') });
    if (o.flags.has('json')) say(JSON.stringify(r, null, 1));
    else {
      r.findings.forEach(f => say(`${f.level === 'fail' ? 'x' : '-'} ${f.code}${f.id ? ' ' + f.id : ''}: ${f.note}`));
      say(r.ok ? `ok decisions log: ${r.info.entries} entr${r.info.entries === 1 ? 'y' : 'ies'}, chain head ${r.info.head.slice(0, 12)}` : `x decisions log: ${r.findings.filter(f => f.level === 'fail').length} problem(s) in ${r.info.entries} entries`);
    }
    return r.ok ? 0 : 1;
  }
  if (cmd === 'protected') {
    const cfg = loadConfig(root), all = { ...PROTECTED, ratchet: [`any ${RATCHET_EXT} file whose name matches ${RATCHET_NAME}`], configured: cfg.protect, record: [cfg.log, RATIFICATIONS + ' (append only)'] };
    if (o.flags.has('json')) say(JSON.stringify(all, null, 1)); else for (const [k, v] of Object.entries(all)) say(`${k.padEnd(10)} ${v.join('  ')}`);
    return 0;
  }
  process.stderr.write(USAGE); return 2;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main(process.argv.slice(2));
