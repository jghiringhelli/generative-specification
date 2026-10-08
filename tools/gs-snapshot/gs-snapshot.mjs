#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Juan Carlos Ghiringhelli, PragmaWorks (licence text in ../LICENSE; provided "AS IS", without warranty).
//
// gs-snapshot: the "governed as of [date]" SNAPSHOT generator (function SHOW). One file, Node 18+, no dependencies, no model, no network.
// Status: written to the canon, tested only by its own node:test suite (tools/gs-snapshot/test); not yet used in a registered run.
//
// It gathers what a project can COMPUTE about itself, deterministically, and writes a dated markdown report plus JSON, then diffs against the
// previous snapshot (what changed between two dates: the report for a release review or a KPI review). Same repository state, same date, same
// checker report => the same bytes.
//   - the checker: runs gs-check in STRICT mode when it is found (--check <path>, $GS_CHECK, tools/gs-check next to this tool, $GS_FORMULAS_TOOLS,
//     or the formulas worktree next to this one); a missing checker is SAID, never guessed. --no-check skips it; --check-report <json> reads a
//     report a previous run wrote (gs-check takes minutes; CI can run it once and hand the report over).
//   - the 12 substrate items (status per item), spec files and a spec digest, criteria (total, ticked, cited by a test file, in the coverage
//     file), open-question markers, test counts (static; --run-tests also runs the project's test command), ratchet floors against what can be
//     measured here, the spec lock (via gs-lock), decisions and ratifications (via gs-decide, plus gs-lock's record), drift since the previous
//     snapshot (commits and files by class, via git), dependency manifests and lockfiles.
//   - supplied, never invented: --kpi <json> (KPIs, each with its source), --audit <json> (the level, score, grades of a separate audit).
//
// WHAT THIS IS NOT. It is not an audit status. The word "governed" (all seven properties at level L4, enforced, tied to reality) and the letter
// grade per property come from a SEPARATE audit that is not deterministic (a model reads the repository; two runs agree to about 0.62 kappa);
// this tool does not compute them and never prints "governed" on its own. It cannot detect a wrong spec, a test that proves nothing, or a
// derived document that is false of the code. A passing checker says the form is there and a planted violation was refused. Counts are counts:
// "criteria cited by a test" means a test file mentions the id, not that the test passes or means what the criterion says.
//
// Usage (from the project root; --root <dir> to point elsewhere):
//   node gs-snapshot.mjs [generate] [--date YYYY-MM-DD] [--out <dir>] [--check <gs-check.mjs> | --no-check | --check-report <json>]
//                        [--run-tests] [--kpi <json>] [--audit <json>] [--against <snapshot.json>] [--dry-run] [--fail-on-check]
//   node gs-snapshot.mjs diff <older.json> <newer.json>      the differences between two snapshots, as markdown
//   node gs-snapshot.mjs latest [--out <dir>]                 the snapshot line of the newest snapshot
// Files: <out>/snapshot-YYYY-MM-DD.md and .json (default <out> = docs/snapshots). Exit: 0 written, 1 --fail-on-check and the checker is not all PASS,
// 2 usage or environment error.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, mkdtempSync, rmSync } from 'node:fs';
import { join, dirname, basename, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { pathToFileURL, fileURLToPath } from 'node:url';

export const VERSION = '0.1.0';
const HERE = dirname(fileURLToPath(import.meta.url));
const lf = t => t.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
const sha = d => createHash('sha256').update(d).digest('hex');
const git = (root, args, o = {}) => spawnSync('git', ['-c', 'core.quotepath=off', ...args], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 28, ...o });
const readText = (root, rel) => { try { return lf(readFileSync(join(root, rel), 'utf8')); } catch { return null; } };
const sorted = a => [...a].sort((x, y) => (x < y ? -1 : x > y ? 1 : 0));
const cleanEnv = () => { const e = { ...process.env }; for (const k of Object.keys(e)) if (/^(GIT_DIR|GIT_INDEX_FILE|GIT_WORK_TREE|GIT_PREFIX|GIT_QUARANTINE_PATH|NODE_TEST_CONTEXT|NODE_OPTIONS)$/.test(k)) delete e[k]; return e; };

export const NOT = 'This is not an audit status. The letter grade per property and the word "governed" (every one of the seven properties at level L4, enforced, tied to reality) come from a separate audit that is not deterministic; this tool does not compute them. It cannot detect a wrong spec, a test that proves nothing, or a document that is false of the code. A passing checker says the form is present and a planted violation was refused, not that the software is right. A count of criteria "cited by a test" says a test file mentions the id, not that the test passes. The numbers age: compare snapshots at the same spec version, and read the commit count since this one.';
const DEFAULTS = {
  specDirs: ['docs/spec', 'docs/specs', 'docs/features', 'docs/especificacion', 'docs/especificaciones', 'docs/requisitos'],
  specRoots: ['SPEC.md', 'docs/SPEC.md', 'docs/spec.md'],
  testDirs: ['tests', 'test', '__tests__', 'spec'],
  testFilePattern: '(\\.test\\.|\\.spec\\.|(^|/)test_[^/]*\\.py$|_test\\.(py|go)$)',
  idToken: '\\b[A-Z][A-Z0-9]{0,5}(?:-[A-Z][A-Z0-9]{0,5})?-\\d{1,4}(?:\\.[A-Z]?\\d{1,3}){0,2}\\b',
  criteriaHeading: '(acceptance|criteri|aceptaci|scenario|escenario)',
  openMarkers: ['OPEN:', 'ABIERTA:', 'PREGUNTA ABIERTA:'],
  coverageFiles: ['docs/coverage.md', 'docs/spec/coverage.md', 'docs/spec/COVERAGE.md', 'docs/criteria-coverage.md', 'docs/cobertura.md'],
  lowerIsBetter: '(max|ceiling|violation|error|duplicat|complex|size|lines|warn)',
};
function loadConfig(root) { let user = {}; try { user = JSON.parse(readText(root, '.gs.json') || '{}'); } catch { /* defaults */ } return { ...DEFAULTS, ...user }; }

const listFiles = root => { const r = git(root, ['ls-files', '-z', '-co', '--exclude-standard']); return r.status === 0 && r.stdout ? sorted(r.stdout.split('\0').filter(Boolean)) : walk(root); };
function walk(root, dir = '', acc = []) {
  let es; try { es = readdirSync(join(root, dir), { withFileTypes: true }); } catch { return acc; }
  for (const e of es) { const rel = dir ? `${dir}/${e.name}` : e.name; if (e.isDirectory()) { if (!['node_modules', '.git'].includes(e.name)) walk(root, rel, acc); } else acc.push(rel); }
  return sorted(acc);
}

// ---------- optional siblings: gs-decide, gs-lock, gs-check ----------
async function tryImport(path) { try { return path && existsSync(path) ? await import(pathToFileURL(resolve(path)).href) : null; } catch { return null; } }
export function findTool(name, file, { flag, envVar } = {}) { // -> {path, via} | null
  const tries = [];
  if (flag) tries.push([flag, 'flag']);
  if (envVar && process.env[envVar]) tries.push([process.env[envVar], '$' + envVar]);
  tries.push([join(HERE, '..', name, file), 'next to this tool']);
  if (process.env.GS_FORMULAS_TOOLS) tries.push([join(process.env.GS_FORMULAS_TOOLS, name, file), '$GS_FORMULAS_TOOLS']);
  tries.push([join(HERE, '..', '..', '..', 'gs-formulas', 'tools', name, file), 'the formulas worktree next to this one']);
  for (const [p, via] of tries) if (existsSync(p)) return { path: resolve(p), via };
  return null;
}

// ---------- spec, criteria, tests ----------
const globRe = g => new RegExp('^' + g.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\0').replace(/\*/g, '[^/]*').replace(/\0/g, '.*') + '$');
export function specFiles(files, cfg) {
  return files.filter(f => /\.md$/i.test(f) && (cfg.specRoots.includes(f) || cfg.specDirs.some(d => f.startsWith(d + '/'))) && !/(ratifications|coverage|cobertura)[^/]*$/i.test(f));
}
export function parseSpec(root, files, cfg) {
  const idRe = new RegExp(`^(${cfg.idToken.replace(/\\b/g, '')})(?![\\w-])`), critRe = new RegExp(cfg.criteriaHeading, 'i');
  const criteria = new Map(), requirements = new Map(); let open = 0, ticked = 0; const openMarks = [];
  for (const f of files) {
    const text = readText(root, f); if (text == null) continue; let inCrit = false, fence = false;
    text.split('\n').forEach((line, i) => {
      if (/^\s*(```|~~~)/.test(line)) { fence = !fence; return; }
      if (fence) return;
      const h = line.match(/^(#{1,6})[ \t]+(.*?)[ \t]*#*[ \t]*$/); if (h) { inCrit = critRe.test(h[2]); }
      if (cfg.openMarkers.some(m => new RegExp('^\\s*(?:[-*+]\\s+)?(?:\\*\\*)?' + m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(line))) { open++; openMarks.push(`${f}:${i + 1}`); }
      const core = line.replace(/^\s*(?:#{1,6}[ \t]+|[-*+][ \t]+|\d+[.)][ \t]+)?(?:\[([ xX~])\][ \t]*)?\|?[ \t]*(?:\*\*|__|`)*/, '');
      const m = core.match(idRe); if (!m) return; const isTicked = /\[[xX]\]/.test(line);
      const rec = { file: f, line: i + 1, ticked: isTicked };
      if (inCrit) { if (!criteria.has(m[1])) { criteria.set(m[1], rec); if (isTicked) ticked++; } } else if (!h && !requirements.has(m[1])) requirements.set(m[1], rec);
    });
  }
  return { criteria, requirements, open, openMarks, ticked };
}
const CASE_RE = [/^\s*(?:test|it)(?:\.(?:only|skip|each))?\s*\(/gm, /^\s*(?:async\s+)?def\s+test_\w+/gm, /^\s*func\s+Test\w+\s*\(/gm, /^\s*@Test\b/gm, /^\s*#\[test\]/gm];
export function scanTests(root, files, cfg, ids) {
  const fileRe = new RegExp(cfg.testFilePattern), isTest = f => fileRe.test(f) || cfg.testDirs.some(d => f.startsWith(d + '/') && /\.(m?js|cjs|jsx|tsx?|py|go|rs|java|kt|rb|cs)$/.test(f));
  let cases = 0, n = 0; const cited = new Set();
  for (const f of files.filter(isTest)) {
    const t = readText(root, f); if (t == null) continue; n++;
    for (const re of CASE_RE) cases += (t.match(re) || []).length;
    for (const id of ids) if (!cited.has(id) && new RegExp('(^|[^\\w.-])' + id.replace(/[.]/g, '\\.') + '(?![\\w-])').test(t)) cited.add(id);
  }
  return { files: n, cases, cited };
}
function coverageFile(root, cfg, ids) {
  for (const f of cfg.coverageFiles) {
    const t = readText(root, f); if (t == null) continue; const rows = [];
    for (const line of t.split('\n')) { if (!line.trim().startsWith('|')) continue; const c = line.split('|').slice(1, -1).map(s => s.trim()); const id = c[0]; if (ids.has(id) && c.slice(1).some(x => /[./]/.test(x))) rows.push(id); }
    return { file: f, rows: sorted(new Set(rows)) };
  }
  return null;
}
function specVersion(root, files) {
  for (const f of files.slice(0, 6)) { const t = readText(root, f); if (!t) continue; const head = t.split('\n').slice(0, 30).join('\n'); const m = head.match(/^\s*(?:\*\*)?(?:version|versi[oó]n)(?:\*\*)?\s*[:=]\s*v?([\w.-]+)/im); if (m) return 'v' + m[1]; }
  return null;
}

// ---------- ratchet, dependencies ----------
function numericLeaves(obj, prefix = '', out = []) {
  if (typeof obj === 'number' && Number.isFinite(obj)) out.push([prefix, obj]);
  else if (obj && typeof obj === 'object') for (const k of Object.keys(obj).sort()) numericLeaves(obj[k], prefix ? `${prefix}.${k}` : k, out);
  return out;
}
export function ratchetState(root, files, cfg, testCases) {
  const out = [];
  for (const f of files) {
    const b = basename(f); if (!/(ratchet|baseline|floor)/.test(b) || !/\.(json|ya?ml|toml|cfg|txt)$/i.test(b) || /package-lock|node_modules/.test(f)) continue;
    const t = readText(root, f); if (t == null) continue; let leaves = [];
    if (/\.json$/i.test(f)) { try { leaves = numericLeaves(JSON.parse(t)); } catch { out.push({ file: f, key: '(unparseable JSON)', floor: null, current: null, status: 'unknown' }); continue; } }
    else for (const m of t.matchAll(/^\s*([A-Za-z_][\w.-]*)\s*[:=]\s*(-?\d+(?:\.\d+)?)\s*$/gm)) leaves.push([m[1], Number(m[2])]);
    for (const [key, floor] of leaves) {
      const last = key.split('.').pop(); let current = null, how = 'no value this tool can measure: the project\'s own gate measures it';
      if (/^tests?[_-]?(min|count|total|floor)$/i.test(last)) { current = testCases; how = 'static count of test cases'; }
      const lower = new RegExp(cfg.lowerIsBetter, 'i').test(last);
      out.push({ file: f, key, floor, current, direction: lower ? 'lower-is-better' : 'higher-is-better', status: current == null ? 'unknown' : (lower ? current <= floor : current >= floor) ? 'ok' : 'BELOW FLOOR', how });
    }
  }
  return out;
}
const MANIFESTS = /(^|\/)(package\.json|requirements[^/]*\.txt|go\.mod|Cargo\.toml|pyproject\.toml)$/, LOCKFILES = /(^|\/)(package-lock\.json|yarn\.lock|pnpm-lock\.yaml|poetry\.lock|Cargo\.lock|go\.sum|Pipfile\.lock)$/;
export function dependencies(root, files) {
  const manifests = {}, lockfiles = {};
  for (const f of files) {
    if (/(^|\/)node_modules\//.test(f)) continue;
    if (LOCKFILES.test(f)) { const t = readText(root, f); if (t != null) lockfiles[f] = { sha256: sha(t).slice(0, 16), lines: t.split('\n').length - 1 }; continue; }
    if (!MANIFESTS.test(f)) continue; const t = readText(root, f); if (t == null) continue; const d = {};
    const b = basename(f);
    if (b === 'package.json') { try { const j = JSON.parse(t); for (const s of ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']) for (const [k, v] of Object.entries(j[s] || {})) d[`${s === 'dependencies' ? '' : s.replace('Dependencies', '') + ':'}${k}`] = String(v); } catch { d['(unparseable)'] = ''; } }
    else if (/^requirements/.test(b)) for (const l of t.split('\n')) { const m = l.trim().match(/^([A-Za-z0-9_.-]+)\s*([=<>!~]=?.*)?$/); if (m && !l.trim().startsWith('#')) d[m[1].toLowerCase()] = (m[2] || '').trim(); }
    else if (b === 'go.mod') for (const m of t.matchAll(/^\s*(?:require\s+)?([\w.\-/]+\.[\w.\-/]+)\s+(v[\w.+-]+)/gm)) d[m[1]] = m[2];
    else if (b === 'Cargo.toml' || b === 'pyproject.toml') {
      let sect = ''; for (const l of t.split('\n')) { const s = l.match(/^\[([^\]]+)\]/); if (s) { sect = s[1]; continue; } if (!/dependencies$/.test(sect)) continue; const m = l.match(/^\s*([A-Za-z0-9_.-]+)\s*=\s*(?:"([^"]*)"|\{[^}]*version\s*=\s*"([^"]*)")/); if (m) d[(sect.includes('dev') ? 'dev:' : '') + m[1]] = m[2] ?? m[3] ?? ''; }
    }
    manifests[f] = Object.fromEntries(Object.entries(d).sort(([a], [b2]) => (a < b2 ? -1 : 1)));
  }
  return { manifests, lockfiles };
}

// ---------- the checker ----------
export function checkerSection(root, o) {
  if (o.noCheck) return { status: 'SKIPPED', note: 'skipped by --no-check: the 12 substrate items were not judged in this snapshot' };
  let report = null, path = null, via = null;
  if (o.checkReport) {
    try { report = JSON.parse(readFileSync(o.checkReport, 'utf8')); } catch (e) { return { status: 'ERROR', note: `--check-report ${o.checkReport} could not be read: ${e.message}` }; }
    if (report.strict && report.default) report = report.strict; via = 'a report file';
  } else {
    const found = findTool('gs-check', 'gs-check.mjs', { flag: o.check, envVar: 'GS_CHECK' });
    if (!found) return { status: 'ABSENT', note: 'gs-check was not found (looked at --check, $GS_CHECK, next to this tool, $GS_FORMULAS_TOOLS and the formulas worktree next to this one): the 12 substrate items are NOT judged in this snapshot' };
    path = found.path; via = found.via;
    const tmp = mkdtempSync(join(tmpdir(), 'gs-snapshot-')), outFile = join(tmp, 'report.json');
    try {
      const r = spawnSync(process.execPath, [path, '--repo', root, '--strict', '--out', outFile], { cwd: tmp, encoding: 'utf8', env: cleanEnv(), timeout: Number(o.checkTimeout || 1800) * 1000, maxBuffer: 1 << 27 });
      if (!existsSync(outFile)) return { status: 'ERROR', via, note: `gs-check produced no report (exit ${r.status}${r.error ? ', ' + r.error.code : ''}): ${((r.stderr || '') + (r.stdout || '')).trim().split('\n').slice(-3).join(' | ')}` };
      report = JSON.parse(readFileSync(outFile, 'utf8'));
    } finally { rmSync(tmp, { recursive: true, force: true, maxRetries: 3 }); }
  }
  const items = (report.items || []).map(i => ({ id: i.id, name: i.name || '', status: i.status })).sort((a, b) => (a.id < b.id ? -1 : 1));
  const by = s => items.filter(i => i.status === s).length;
  return { status: 'RAN', via, mode: report.mode || 'unknown', checker_version: report.checker_version || null, config_sha256: report.config_sha256 || null, head: report.head || null,
    uncommitted_changes_ignored: report.uncommitted_changes_ignored ?? null, summary: { pass: by('PASS'), partial: by('PARTIAL'), absent: by('ABSENT'), undeterminable: by('UNDETERMINABLE'), total: items.length }, items,
    note: report.mode === 'strict' ? 'strict enforcement: only a hook that refuses a planted violation is credited' : 'NOT strict mode: a package script that fails is credited, nothing runs it unless a person does' };
}

// ---------- tests run ----------
function runTests(root, cfg) {
  let cmd = cfg.testCmd || null;
  if (!cmd) { try { const t = (JSON.parse(readText(root, 'package.json') || '{}').scripts || {}).test; if (t && !/no test specified/.test(t)) cmd = 'npm test --silent'; } catch { /* none */ } }
  if (!cmd) return { cmd: null, note: 'no test command (set testCmd in .gs.json)' };
  const r = spawnSync(cmd, { cwd: root, shell: true, encoding: 'utf8', env: cleanEnv(), timeout: 600000, maxBuffer: 1 << 27 }), txt = (r.stdout || '') + (r.stderr || '');
  const num = re => { const m = txt.match(re); return m ? Number(m[1]) : null; };
  return { cmd, exit: r.status, pass: num(/^(?:#|ℹ)\s*pass\s+(\d+)/m) ?? num(/(\d+) passed/), fail: num(/^(?:#|ℹ)\s*fail\s+(\d+)/m) ?? num(/(\d+) failed/) };
}

// ---------- git: identity and drift ----------
function repoInfo(root) {
  const head = git(root, ['rev-parse', 'HEAD']); if (head.status !== 0) return { commit: null, note: 'not a git repository with a commit' };
  const dirty = git(root, ['status', '--porcelain', '--untracked-files=normal']).stdout.split('\n').filter(l => l && !/ docs\/snapshots\//.test(l)).length;
  return { commit: head.stdout.trim(), commit_short: head.stdout.trim().slice(0, 7), branch: git(root, ['rev-parse', '--abbrev-ref', 'HEAD']).stdout.trim(), uncommitted_files: dirty };
}
function classify(p, cfg, decide) {
  const c = decide?.protectedClass ? decide.protectedClass(p, decide.loadConfig(process.cwd())) : null;
  if (c === 'spec' || c === 'gate' || c === 'ratchet' || c === 'waiver') return c;
  if (new RegExp(cfg.testFilePattern).test(p) || cfg.testDirs.some(d => p.startsWith(d + '/'))) return 'tests';
  if (/\.(m?js|cjs|jsx|tsx?|py|go|rs|java|kt|rb|php|cs|c|cpp|h|swift|scala)$/i.test(p) && !/^(docs|scripts|tools)\//.test(p)) return 'source';
  if (/^docs\/|\.md$/i.test(p)) return 'docs';
  return 'other';
}
function drift(root, prev, cfg, decide) {
  if (!prev) return { note: 'first snapshot: nothing to compare with' };
  const pc = prev.repo?.commit; if (!pc) return { since: prev.date, note: 'the previous snapshot has no commit' };
  if (git(root, ['cat-file', '-e', pc + '^{commit}']).status !== 0) return { since: prev.date, since_commit: pc.slice(0, 7), note: 'the previous snapshot\'s commit is not in this history (rebased, squashed or a shallow clone): drift cannot be computed' };
  const count = Number(git(root, ['rev-list', '--count', `${pc}..HEAD`]).stdout.trim() || 0);
  const names = git(root, ['diff', '--name-status', '--no-renames', pc, 'HEAD']).stdout.split('\n').filter(Boolean).map(l => { const [s, ...p] = l.split('\t'); return { s: s[0], p: p.join('\t') }; }).filter(x => !x.p.startsWith('docs/snapshots/'));
  const byClass = {}, changed = {};
  for (const n of names) { const c = classify(n.p, cfg, decide); byClass[c] = (byClass[c] || 0) + 1; if (['spec', 'gate', 'ratchet', 'waiver'].includes(c)) (changed[c] ||= []).push(`${n.s} ${n.p}`); }
  for (const k of Object.keys(changed)) changed[k] = sorted(changed[k]).slice(0, 40);
  const stat = git(root, ['diff', '--shortstat', pc, 'HEAD']).stdout.trim();
  return { since: prev.date, since_commit: pc.slice(0, 7), commits: count, files_changed: names.length, by_class: Object.fromEntries(Object.entries(byClass).sort()), protected_changed: changed, shortstat: stat };
}

// ---------- decisions and lock ----------
function decisionsSection(root, date, decide, prev) {
  if (!decide) return { available: false, note: 'gs-decide was not found: decisions and ratifications are NOT reported (looked next to this tool)' };
  const cfg = decide.loadConfig(root), log = decide.loadLog(root, cfg), v = decide.verify(root, { at: date }), st = decide.entryStatus(log.entries, date);
  const rat = decide.readRatifications((() => { try { return readFileSync(join(root, decide.RATIFICATIONS), 'utf8').replace(/\r\n?/g, '\n'); } catch { return ''; } })());
  const short = e => ({ id: e.id, when: e.when, kind: e.kind, who: e.who, role: e.role, via: e.via, ref: e.ref, why: e.why.length > 140 ? e.why.slice(0, 137) + '...' : e.why, expires: e.expires || null, status: st.get(e.id) });
  const prevIds = new Set((prev?.decisions?.entries || []).map(e => e.id));
  const entries = log.entries.map(short);
  return { available: true, log: cfg.log, log_exists: log.exists, entries, chain_ok: !v.findings.some(f => f.level === 'fail' && ['MALFORMED', 'CHAIN-BROKEN', 'HISTORY-REWRITTEN'].includes(f.code)), chain_head: log.head,
    findings: v.findings.map(f => ({ level: f.level, code: f.code, id: f.id })).sort((a, b) => (a.code + a.id < b.code + b.id ? -1 : 1)), verify_ok: v.ok,
    open_waivers: entries.filter(e => e.status === 'open' && ['waiver', 'risk'].includes(e.kind)), expired: entries.filter(e => e.status === 'expired').length,
    unratified_protected_files: v.info.unratified ?? null, new_since_previous: prev ? entries.filter(e => !prevIds.has(e.id)).map(e => e.id) : null,
    gs_lock_ratifications: { count: rat.length, recent: rat.slice(-5).map(r => ({ when: r.when, who: r.who, artifact: r.artifact, id: r.id, reason: r.reason })) } };
}
async function lockSection(root, o) {
  const has = existsSync(join(root, 'docs/spec.lock'));
  if (!has) return { status: 'NOLOCK', note: 'no docs/spec.lock: nothing is locked' };
  const found = findTool('gs-lock', 'gs-lock.mjs', { flag: o.lock, envVar: 'GS_LOCK' }), lines = (readText(root, 'docs/spec.lock') || '').split('\n').filter(l => /^[SA] /.test(l));
  const counts = { artifacts: lines.filter(l => l[0] === 'A').length, sections: lines.filter(l => l[0] === 'S').length };
  const lock = found && await tryImport(found.path);
  if (!lock) return { status: 'NOT-VERIFIED', ...counts, note: 'the lock file exists but gs-lock was not found, so it was not checked' };
  const ctx = lock.fsCtx(root), r = lock.checkLock(ctx, lock.loadConfig(ctx)), by = {};
  for (const f of r.findings) by[f.status] = (by[f.status] || 0) + 1;
  const failing = r.findings.filter(f => f.status !== 'UNCOVERED');
  return { status: failing.length ? 'FAILING' : 'CURRENT', ...counts, findings_by_status: Object.fromEntries(Object.entries(by).sort()), note: failing.length ? `${failing.length} finding(s) fail the lock check` : 'every tagged artifact matches the section it was derived from' + (by.UNCOVERED ? ` (${by.UNCOVERED} spec id(s) have no tag, reported not failing)` : '') };
}

// ---------- supplied inputs ----------
function suppliedKpis(file) {
  if (!file) return { supplied: false, entries: [], note: 'none supplied. Optional field: pass --kpi kpis.json with entries {name, value, unit, source, measured_by, as_of}. This tool never computes or invents a KPI.' };
  let j; try { j = JSON.parse(lf(readFileSync(file, 'utf8'))); } catch (e) { return { supplied: false, entries: [], note: `--kpi ${file} could not be read: ${e.message}` }; }
  const arr = Array.isArray(j) ? j : Array.isArray(j.kpis) ? j.kpis : [];
  return { supplied: true, note: 'supplied by the project; not computed or verified by this tool', entries: arr.map(k => ({ name: String(k.name ?? ''), value: k.value ?? null, unit: k.unit ?? null, source: k.source ?? null, measured_by: k.measured_by ?? null, as_of: k.as_of ?? null, source_missing: !k.source })) };
}
function suppliedAudit(file) {
  if (!file) return null;
  try { const j = JSON.parse(lf(readFileSync(file, 'utf8'))); return { supplied: true, note: 'supplied by a separate audit; this tool did not compute or verify it', level: j.level ?? null, score: j.score ?? null, confidence: j.confidence ?? null, rubric: j.rubric ?? null, grades: j.grades ?? null, runs: j.runs ?? null, assessor: j.assessor ?? null, audit_date: j.date ?? null }; }
  catch (e) { return { supplied: false, note: `--audit ${file} could not be read: ${e.message}` }; }
}

// ---------- the snapshot ----------
export function snapshotLine(s) {
  const a = s.audit?.supplied ? s.audit : null, sv = s.spec.version || `unversioned-${s.spec.digest.slice(0, 8)}`;
  const lvl = a?.level ? `${a.level} (supplied)` : 'level n/a', score = a?.score != null ? `${a.score}${a.confidence != null ? ' ± ' + a.confidence : ''} (supplied)` : 'score n/a', rub = a?.rubric ? `${a.rubric} (supplied)` : 'n/a';
  const chk = s.checker.status === 'RAN' ? `checker ${s.checker.mode} ${s.checker.summary.pass}/${s.checker.summary.total} PASS` : `checker ${s.checker.status}`;
  const dr = s.drift?.commits != null ? ` | ${s.drift.commits} commit(s) since ${s.drift.since}` : '';
  return `${lvl} · ${score} @ rubric ${rub} @ ${s.repo.commit_short || 'no-commit'} @ spec ${sv} @ ${s.date} | ${chk}${dr}`;
}
export async function buildSnapshot(root, o = {}) {
  const cfg = loadConfig(root), files = listFiles(root), date = o.date || process.env.GS_SNAPSHOT_DATE || new Date().toISOString().slice(0, 10);
  const decideFound = findTool('gs-decide', 'gs-decide.mjs', { flag: o.decide, envVar: 'GS_DECIDE' }), decide = decideFound && await tryImport(decideFound.path);
  const prev = o.prev === undefined ? loadPrevious(root, o.out || 'docs/snapshots', date, o.against) : o.prev;
  const sf = specFiles(files, cfg), spec = parseSpec(root, sf, cfg), ids = new Set(spec.criteria.keys());
  const tests = scanTests(root, files, cfg, ids), cov = coverageFile(root, cfg, ids);
  const digest = sha(sf.map(f => `${f}\0${sha(readText(root, f) || '')}`).join('\n')).slice(0, 12);
  const run = o.runTests ? runTests(root, cfg) : null;
  const pkgName = (() => { try { return JSON.parse(readText(root, 'package.json') || '{}').name; } catch { return null; } })();
  const s = {
    schema: 'gs-snapshot/1', tool: { name: 'gs-snapshot', version: VERSION }, date, project: pkgName || basename(resolve(root)), repo: repoInfo(root),
    spec: { files: sf, version: specVersion(root, sf), digest, requirements: spec.requirements.size, open_questions: spec.open, open_marks: spec.openMarks.slice(0, 20) },
    criteria: { total: spec.criteria.size, ticked: spec.ticked, ids: sorted(ids), cited_by_test: sorted([...tests.cited]), uncited: sorted([...ids].filter(i => !tests.cited.has(i))),
      share_cited_by_test: spec.criteria.size ? Math.round((tests.cited.size / spec.criteria.size) * 1000) / 1000 : null, in_coverage_file: cov, basis: 'static: a test file mentions the id; not proof that the test passes or checks what the criterion says' },
    tests: { files: tests.files, cases: tests.cases, run },
    checker: checkerSection(root, o), ratchet: ratchetState(root, files, cfg, tests.cases), lock: await lockSection(root, o),
    decisions: decisionsSection(root, date, decide, prev), dependencies: dependencies(root, files), drift: drift(root, prev, cfg, decide),
    kpis: suppliedKpis(o.kpi), audit: suppliedAudit(o.audit), not: NOT,
  };
  if (!decide) s.decisions.looked_next_to = join(HERE, '..', 'gs-decide');
  s.line = snapshotLine(s);
  s.previous = prev ? { date: prev.date, commit: prev.repo?.commit || null, spec_digest: prev.spec?.digest || null } : null;
  s.diff = prev ? diffSnapshots(prev, s) : null;
  return s;
}
function loadPrevious(root, outDir, date, against) {
  if (against) { try { return JSON.parse(readFileSync(resolve(root, against), 'utf8')); } catch { return null; } }
  const dir = join(root, outDir); if (!existsSync(dir)) return null;
  const names = readdirSync(dir).filter(n => /^snapshot-\d{4}-\d{2}-\d{2}\.json$/.test(n) && n.slice(9, 19) < date).sort();
  if (!names.length) return null;
  try { return JSON.parse(readFileSync(join(dir, names[names.length - 1]), 'utf8')); } catch { return null; }
}

// ---------- the diff between two snapshots ----------
const setDiff = (a, b) => ({ added: sorted(b.filter(x => !a.includes(x))), removed: sorted(a.filter(x => !b.includes(x))) });
export function diffSnapshots(a, b) {
  const d = { from: { date: a.date, commit: a.repo?.commit?.slice(0, 7) || null }, to: { date: b.date, commit: b.repo?.commit?.slice(0, 7) || null }, days: Math.round((Date.parse(b.date) - Date.parse(a.date)) / 864e5) };
  d.same_spec_version = (a.spec?.version || a.spec?.digest) === (b.spec?.version || b.spec?.digest) && a.spec?.digest === b.spec?.digest;
  d.spec = { digest_changed: a.spec?.digest !== b.spec?.digest, version: [a.spec?.version || null, b.spec?.version || null], open_questions: [a.spec?.open_questions ?? null, b.spec?.open_questions ?? null], requirements: [a.spec?.requirements ?? null, b.spec?.requirements ?? null] };
  const ca = a.criteria || {}, cb = b.criteria || {};
  d.criteria = { total: [ca.total ?? null, cb.total ?? null], ticked: [ca.ticked ?? null, cb.ticked ?? null], ids: setDiff(ca.ids || [], cb.ids || []), cited_by_test: [(ca.cited_by_test || []).length, (cb.cited_by_test || []).length], newly_uncited: sorted((cb.uncited || []).filter(i => (ca.ids || []).includes(i) && !(ca.uncited || []).includes(i))) };
  d.tests = { cases: [a.tests?.cases ?? null, b.tests?.cases ?? null], files: [a.tests?.files ?? null, b.tests?.files ?? null] };
  const ia = Object.fromEntries((a.checker?.items || []).map(i => [i.id, i.status])), ib = Object.fromEntries((b.checker?.items || []).map(i => [i.id, i.status]));
  d.checker = { status: [a.checker?.status || null, b.checker?.status || null], pass: [a.checker?.summary?.pass ?? null, b.checker?.summary?.pass ?? null], items_changed: sorted(new Set([...Object.keys(ia), ...Object.keys(ib)])).filter(k => ia[k] !== ib[k]).map(k => ({ id: k, from: ia[k] || null, to: ib[k] || null })) };
  const ra = Object.fromEntries((a.ratchet || []).map(r => [`${r.file} ${r.key}`, r])), rb = Object.fromEntries((b.ratchet || []).map(r => [`${r.file} ${r.key}`, r]));
  d.ratchet = sorted(new Set([...Object.keys(ra), ...Object.keys(rb)])).filter(k => ra[k]?.floor !== rb[k]?.floor).map(k => {
    const x = ra[k]?.floor ?? null, y = rb[k]?.floor ?? null, lower = (rb[k] || ra[k]).direction === 'lower-is-better';
    return { key: k, from: x, to: y, move: x == null ? 'new' : y == null ? 'removed' : (lower ? y < x : y > x) ? 'raised (tightened)' : 'LOWERED (loosened)' };
  });
  d.lock = { status: [a.lock?.status || null, b.lock?.status || null], artifacts: [a.lock?.artifacts ?? null, b.lock?.artifacts ?? null], sections: [a.lock?.sections ?? null, b.lock?.sections ?? null] };
  const ea = (a.decisions?.entries || []), eb = (b.decisions?.entries || []), ids = new Set(ea.map(e => e.id));
  d.decisions = { available: [!!a.decisions?.available, !!b.decisions?.available], new_entries: eb.filter(e => !ids.has(e.id)), chain_head_moved: a.decisions?.chain_head !== b.decisions?.chain_head,
    chain_extends_previous: !ea.length || ea.every((e, i) => eb[i] && eb[i].id === e.id && eb[i].when === e.when && eb[i].who === e.who && eb[i].why === e.why), open_waivers: [(a.decisions?.open_waivers || []).length, (b.decisions?.open_waivers || []).length],
    gs_lock_ratifications: [a.decisions?.gs_lock_ratifications?.count ?? null, b.decisions?.gs_lock_ratifications?.count ?? null] };
  d.dependencies = { manifests: {}, lockfiles: [] };
  const ma = a.dependencies?.manifests || {}, mb = b.dependencies?.manifests || {};
  for (const f of sorted(new Set([...Object.keys(ma), ...Object.keys(mb)]))) {
    const x = ma[f] || {}, y = mb[f] || {}, added = Object.keys(y).filter(k => !(k in x)), removed = Object.keys(x).filter(k => !(k in y)), changed = Object.keys(y).filter(k => k in x && x[k] !== y[k]).map(k => `${k} ${x[k]} -> ${y[k]}`);
    if (added.length || removed.length || changed.length || !(f in ma) || !(f in mb)) d.dependencies.manifests[f] = { manifest: !(f in ma) ? 'new' : !(f in mb) ? 'removed' : 'present', added: sorted(added), removed: sorted(removed), changed: sorted(changed) };
  }
  const la = a.dependencies?.lockfiles || {}, lb = b.dependencies?.lockfiles || {};
  d.dependencies.lockfiles = sorted(new Set([...Object.keys(la), ...Object.keys(lb)])).filter(f => la[f]?.sha256 !== lb[f]?.sha256).map(f => `${f}: ${la[f] ? 'changed' : 'new'}`);
  const ka = Object.fromEntries((a.kpis?.entries || []).map(k => [k.name, k])), kb = Object.fromEntries((b.kpis?.entries || []).map(k => [k.name, k]));
  d.kpis = sorted(new Set([...Object.keys(ka), ...Object.keys(kb)])).map(k => ({ name: k, from: ka[k] ? { value: ka[k].value, unit: ka[k].unit, source: ka[k].source } : null, to: kb[k] ? { value: kb[k].value, unit: kb[k].unit, source: kb[k].source } : null }));
  return d;
}
const arrow = ([x, y]) => (x === y ? `${y ?? 'n/a'} (no change)` : `${x ?? 'n/a'} -> ${y ?? 'n/a'}`);
export function renderDiff(d) {
  const L = [`## Changes between ${d.from.date} (${d.from.commit || 'no commit'}) and ${d.to.date} (${d.to.commit || 'no commit'}), ${d.days} day(s)`, ''];
  if (!d.same_spec_version) L.push(`> The spec changed between the two snapshots (digest or version differ). Scores and counts are comparable only at the same spec version: read the criteria lines below before the numbers.`, '');
  L.push(`- Spec: version ${d.spec.version[0] ?? 'unversioned'} -> ${d.spec.version[1] ?? 'unversioned'}; requirements ${arrow(d.spec.requirements)}; open questions ${arrow(d.spec.open_questions)}`);
  L.push(`- Criteria: total ${arrow(d.criteria.total)}; ticked ${arrow(d.criteria.ticked)}; cited by a test ${arrow(d.criteria.cited_by_test)}`);
  if (d.criteria.ids.added.length) L.push(`  - added: ${d.criteria.ids.added.join(', ')}`); if (d.criteria.ids.removed.length) L.push(`  - removed: ${d.criteria.ids.removed.join(', ')}`);
  if (d.criteria.newly_uncited.length) L.push(`  - existed before and now have no test citing them: ${d.criteria.newly_uncited.join(', ')}`);
  L.push(`- Tests: cases ${arrow(d.tests.cases)}; files ${arrow(d.tests.files)}`);
  L.push(`- Checker: ${arrow(d.checker.status)}; items PASS ${arrow(d.checker.pass)}`);
  d.checker.items_changed.forEach(i => L.push(`  - ${i.id}: ${i.from ?? 'absent'} -> ${i.to ?? 'absent'}`));
  L.push(`- Ratchet floors: ${d.ratchet.length ? '' : 'no floor moved'}`); d.ratchet.forEach(r => L.push(`  - ${r.key}: ${r.from ?? 'n/a'} -> ${r.to ?? 'n/a'} (${r.move})`));
  L.push(`- Lock: ${arrow(d.lock.status)}; artifacts ${arrow(d.lock.artifacts)}; sections ${arrow(d.lock.sections)}`);
  L.push(`- Decisions: ${d.decisions.new_entries.length} new entr${d.decisions.new_entries.length === 1 ? 'y' : 'ies'}; open waivers ${arrow(d.decisions.open_waivers)}; gs-lock ratifications ${arrow(d.decisions.gs_lock_ratifications)}${d.decisions.chain_extends_previous ? '' : '; **the earlier entries are NOT the same as in the previous snapshot (the log was rewritten)**'}`);
  d.decisions.new_entries.forEach(e => L.push(`  - ${e.id} ${e.when} ${e.kind} by ${e.who} [${e.role}]: ${e.ref} | ${e.why}`));
  const dm = Object.entries(d.dependencies.manifests); L.push(`- Dependencies: ${dm.length || d.dependencies.lockfiles.length ? '' : 'no change'}`);
  dm.forEach(([f, x]) => { if (x.manifest !== 'present') L.push(`  - ${f}: manifest ${x.manifest}`); x.added.forEach(k => L.push(`  - ${f}: added ${k}`)); x.removed.forEach(k => L.push(`  - ${f}: removed ${k}`)); x.changed.forEach(k => L.push(`  - ${f}: ${k}`)); });
  d.dependencies.lockfiles.forEach(f => L.push(`  - lockfile ${f}`));
  if (d.kpis.length) { L.push('- KPIs (as supplied by the project):'); d.kpis.forEach(k => L.push(`  - ${k.name}: ${k.from ? `${k.from.value}${k.from.unit ? ' ' + k.from.unit : ''}` : 'not reported'} -> ${k.to ? `${k.to.value}${k.to.unit ? ' ' + k.to.unit : ''} (source: ${k.to.source ?? 'NONE GIVEN'})` : 'not reported'}`)); }
  return L.join('\n').replace(/: \n/g, '\n');
}

// ---------- markdown ----------
export function renderMarkdown(s) {
  const L = []; const row = (...c) => '| ' + c.join(' | ') + ' |';
  L.push(`# Snapshot of ${s.project} as of ${s.date}`, '', '`' + s.line + '`', '', `Commit ${s.repo.commit || 'none'}${s.repo.branch ? ' on ' + s.repo.branch : ''}; ${s.repo.uncommitted_files ? s.repo.uncommitted_files + ' uncommitted file(s) at the time (not judged by the checker)' : 'working tree clean'}. Generated by gs-snapshot ${s.tool.version}; same state and date give the same file.`, '');
  L.push('## What this is NOT', '', s.not, '');
  if (s.diff) L.push(renderDiff(s.diff), ''); else L.push('## Changes since the previous snapshot', '', 'There is no previous snapshot in this folder: this is the baseline.', '');
  L.push('## The checker (the 12 substrate items)', '');
  if (s.checker.status === 'RAN') {
    L.push(`gs-check ${s.checker.checker_version || ''}, mode ${s.checker.mode}, found ${s.checker.via}. ${s.checker.note}.`, '', row('Item', 'Status', 'Name'), row('---', '---', '---'));
    s.checker.items.forEach(i => L.push(row(i.id, i.status, i.name)));
    L.push('', `PASS ${s.checker.summary.pass}, PARTIAL ${s.checker.summary.partial}, ABSENT ${s.checker.summary.absent}, UNDETERMINABLE ${s.checker.summary.undeterminable}.`);
  } else L.push(`Not judged: ${s.checker.note}`);
  L.push('', '## Spec and criteria', '', `- Spec files: ${s.spec.files.length ? s.spec.files.join(', ') : 'none found'}; version ${s.spec.version || 'not declared'}; digest ${s.spec.digest}`,
    `- Criteria: ${s.criteria.total} (${s.criteria.ticked} ticked); requirements ${s.spec.requirements}; open-question markers ${s.spec.open_questions}${s.spec.open_marks.length ? ' (' + s.spec.open_marks.join(', ') + ')' : ''}`,
    `- Cited by at least one test file: ${s.criteria.cited_by_test.length} of ${s.criteria.total}${s.criteria.share_cited_by_test != null ? ' (' + Math.round(s.criteria.share_cited_by_test * 100) + '%)' : ''}. Basis: ${s.criteria.basis}.`);
  if (s.criteria.uncited.length) L.push(`- No test file cites: ${s.criteria.uncited.join(', ')}`);
  L.push(`- Coverage file: ${s.criteria.in_coverage_file ? `${s.criteria.in_coverage_file.file} lists ${s.criteria.in_coverage_file.rows.length} criterion row(s) with a verifier` : 'none found'}`);
  L.push('', '## Tests', '', `- ${s.tests.cases} test case(s) in ${s.tests.files} test file(s) (static count).`);
  L.push(s.tests.run ? (s.tests.run.cmd ? `- Run (\`${s.tests.run.cmd}\`): exit ${s.tests.run.exit}, pass ${s.tests.run.pass ?? 'n/a'}, fail ${s.tests.run.fail ?? 'n/a'}.` : `- Not run: ${s.tests.run.note}.`) : '- Not run in this snapshot (--run-tests runs the project test command).');
  L.push('', '## Ratchet floors against what this tool can measure', '');
  if (s.ratchet.length) { L.push(row('File', 'Key', 'Floor', 'Current', 'Status'), row('---', '---', '---', '---', '---')); s.ratchet.forEach(r => L.push(row(r.file, r.key, r.floor ?? 'n/a', r.current ?? 'n/a', r.status))); L.push('', '"unknown" means the project\'s own gate measures that value; this tool does not.'); } else L.push('No ratchet file found.');
  L.push('', '## Spec lock', '', `${s.lock.status}: ${s.lock.note}${s.lock.artifacts != null ? ` (${s.lock.artifacts} artifact entries, ${s.lock.sections} sections)` : ''}`);
  L.push('', '## Decisions and ratifications', '');
  const dc = s.decisions;
  if (!dc.available) L.push(dc.note);
  else {
    L.push(`- ${dc.log}: ${dc.log_exists ? dc.entries.length + ' entr' + (dc.entries.length === 1 ? 'y' : 'ies') : 'does not exist'}; chain ${dc.chain_ok ? 'verifies' : '**DOES NOT VERIFY**'}; head ${dc.chain_head.slice(0, 12)}. Keep this head: a later snapshot detects a rewritten tail.`);
    L.push(`- Open waivers and risks: ${dc.open_waivers.length}${dc.open_waivers.length ? ' (' + dc.open_waivers.map(w => `${w.id} until ${w.expires}`).join(', ') + ')' : ''}; expired and unclosed: ${dc.expired}; protected files no entry approves: ${dc.unratified_protected_files ?? 'n/a'}`);
    dc.findings.filter(f => f.level === 'fail').forEach(f => L.push(`- **${f.code} ${f.id}**`));
    L.push(`- gs-lock ratifications (docs/ratifications.md): ${dc.gs_lock_ratifications.count}`);
    const recent = dc.entries.slice(-8); if (recent.length) { L.push('', 'Most recent entries:', ''); recent.forEach(e => L.push(`- ${e.id} ${e.when} ${e.kind} (${e.status}) by ${e.who} [${e.role}${e.via === 'agent-suspected' ? ', agent-suspected' : ''}]: ${e.ref} | ${e.why}${e.expires ? ' | expires ' + e.expires : ''}`)); }
  }
  L.push('', '## Drift since the previous snapshot', '');
  const dr = s.drift; if (dr.commits != null) { L.push(`- ${dr.commits} commit(s), ${dr.files_changed} file(s) changed since ${dr.since} (${dr.since_commit}). ${dr.shortstat}`, `- By class: ${Object.entries(dr.by_class).map(([k, v]) => k + ' ' + v).join(', ') || 'none'}`); for (const [k, v] of Object.entries(dr.protected_changed)) L.push(`- ${k} files changed: ${v.join('; ')}`); } else L.push(dr.note);
  L.push('', '## Dependencies', '');
  const mf = Object.entries(s.dependencies.manifests); if (!mf.length) L.push('No manifest found.'); mf.forEach(([f, d]) => L.push(`- ${f}: ${Object.keys(d).length} dependenc${Object.keys(d).length === 1 ? 'y' : 'ies'}`)); Object.entries(s.dependencies.lockfiles).forEach(([f, l]) => L.push(`- ${f}: sha256 ${l.sha256}, ${l.lines} lines`));
  L.push('', '## KPIs', '', '<!-- OPTIONAL FIELD. Supplied by the project with --kpi, never computed or invented by this tool. Each entry needs its source. -->', '');
  if (!s.kpis.supplied || !s.kpis.entries.length) L.push(`None supplied. ${s.kpis.note}`);
  else { L.push(s.kpis.note + '.', '', row('KPI', 'Value', 'As of', 'Measured by', 'Source'), row('---', '---', '---', '---', '---')); s.kpis.entries.forEach(k => L.push(row(k.name, `${k.value ?? 'n/a'}${k.unit ? ' ' + k.unit : ''}`, k.as_of ?? 'n/a', k.measured_by ?? 'n/a', k.source ?? '**NO SOURCE GIVEN**'))); }
  if (s.audit) { L.push('', '## Audit (supplied)', '', s.audit.note + '.'); if (s.audit.supplied) L.push(`- level ${s.audit.level ?? 'n/a'}, score ${s.audit.score ?? 'n/a'}${s.audit.confidence != null ? ' ± ' + s.audit.confidence : ''}, rubric ${s.audit.rubric ?? 'n/a'}, runs ${s.audit.runs ?? 'n/a'}, assessor ${s.audit.assessor ?? 'n/a'}, audit date ${s.audit.audit_date ?? 'n/a'}`, ...(s.audit.grades ? ['- grades: ' + Object.entries(s.audit.grades).map(([k, v]) => `${k} ${v}`).join(', ')] : [])); }
  L.push('', '## Reproduce', '', 'Run `node tools/gs-snapshot/gs-snapshot.mjs` at this commit with the same flags; the JSON next to this file holds every number above.', '');
  return L.join('\n');
}

// ---------- CLI ----------
const WITH_VALUE = new Set(['--root', '--date', '--out', '--check', '--check-report', '--check-timeout', '--kpi', '--audit', '--against', '--decide', '--lock']);
function parseArgs(argv) { const o = { _: [], flags: new Set() }; for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (WITH_VALUE.has(a)) o[a.slice(2).replace(/-(\w)/g, (_, c) => c.toUpperCase())] = argv[++i]; else if (a.startsWith('--')) o.flags.add(a.slice(2)); else o._.push(a); } return o; }
const say = s => process.stdout.write(s + '\n');
const USAGE = 'usage: gs-snapshot [generate] [--date YYYY-MM-DD] [--out <dir>] [--check <gs-check.mjs> | --no-check | --check-report <json>] [--run-tests] [--kpi <json>] [--audit <json>] [--against <snapshot.json>] [--dry-run] [--fail-on-check] [--root <dir>]\n       gs-snapshot diff <older.json> <newer.json> | latest [--out <dir>]\n';
export async function main(argv) {
  const o = parseArgs(argv), cmd = o._[0] || 'generate', root = resolve(o.root || process.cwd());
  if (cmd === 'diff') {
    if (!o._[1] || !o._[2]) { process.stderr.write(USAGE); return 2; }
    try { const a = JSON.parse(lf(readFileSync(o._[1], 'utf8'))), b = JSON.parse(lf(readFileSync(o._[2], 'utf8'))); say(renderDiff(diffSnapshots(a, b))); return 0; } catch (e) { process.stderr.write('x diff: ' + e.message + '\n'); return 2; }
  }
  if (cmd === 'latest') {
    const dir = join(root, o.out || 'docs/snapshots'); const names = existsSync(dir) ? readdirSync(dir).filter(n => /^snapshot-\d{4}-\d{2}-\d{2}\.json$/.test(n)).sort() : [];
    if (!names.length) { say('no snapshot in ' + dir); return 1; } say(JSON.parse(readFileSync(join(dir, names[names.length - 1]), 'utf8')).line); return 0;
  }
  if (cmd !== 'generate') { process.stderr.write(USAGE); return 2; }
  if (o.date && !/^\d{4}-\d{2}-\d{2}$/.test(o.date)) { process.stderr.write('x --date must be YYYY-MM-DD\n'); return 2; }
  const outDir = o.out || 'docs/snapshots';
  const s = await buildSnapshot(root, { date: o.date, out: outDir, check: o.check, noCheck: o.flags.has('no-check'), checkReport: o.checkReport, checkTimeout: o.checkTimeout, runTests: o.flags.has('run-tests'), kpi: o.kpi, audit: o.audit, against: o.against, decide: o.decide, lock: o.lock });
  const md = renderMarkdown(s), json = JSON.stringify(s, null, 2) + '\n';
  if (o.flags.has('dry-run')) say(md);
  else {
    const dir = join(root, outDir); mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, `snapshot-${s.date}.md`), md); writeFileSync(join(dir, `snapshot-${s.date}.json`), json);
    say(s.line); say(`written: ${join(outDir, `snapshot-${s.date}.md`)} and .json`);
    if (s.checker.status !== 'RAN') say(`note: ${s.checker.note}`);
  }
  return o.flags.has('fail-on-check') && !(s.checker.status === 'RAN' && s.checker.summary.pass === s.checker.summary.total) ? 1 : 0;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2)).then(c => { process.exitCode = c; });
