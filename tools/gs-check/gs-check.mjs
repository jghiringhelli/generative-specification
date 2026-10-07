#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Juan Carlos Ghiringhelli, PragmaWorks (licence text in ../LICENSE; provided "AS IS", without warranty).
//
// gs-check: the substrate conformance checker. ONE file, Node 18+, no dependencies, no model, no network. It judges the twelve items of
// the substrate checklist (docs/formulas/SUBSTRATE-CHECKLIST.md) as "present AND working" on a git repository, and prints the raw result
// of every probe. It clones the repository (committed state only) into a temporary folder and never modifies the repository under test.
// CANONICAL COPY: this file (tools/gs-check/gs-check.mjs in the formulas repository). The study design that uses it (FX-1) lives in the
// protocol repository, which keeps a pointer here and no code.
// Status: a prototype tuned on hand-built controls and on 24 development runs; not validated by independent controls. See README.md.
//
// Usage:  node gs-check.mjs --repo <path> [--strict] [--both] [--only E01,E05] [--since <rev>] [--config <file>] [--out <report.json>] [--keep]
//   --strict   strict enforcement: only a commit hook or a push hook that BLOCKS a planted violation is credited. A package script that
//              fails (npm run check ...) is NOT credited, because nothing runs it unless a person does. Default mode credits scripts.
//   --both     run both modes and print both columns (twice the time).
// Exit: 0 = all twelve PASS, 1 = at least one item is not PASS, 2 = usage or fatal error.
// The checker executes project code (install scripts, hooks, tests): run it on untrusted projects only inside a disposable container.
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import fs0 from 'node:fs';
const nodeRequire = createRequire(import.meta.url);
const __file = fileURLToPath(import.meta.url);
const __defs = {}, __cache = {};
function __require(spec) {
  spec = spec.replace('./lib/', './'); if (!(spec in __defs)) return nodeRequire(spec);
  if (!__cache[spec]) { const m = { exports: {} }; __cache[spec] = m; __defs[spec](m, m.exports, __require); }
  return __cache[spec].exports;
}
const DEFAULT_CONFIG = {
  "_comment": "FX-1 conformance checker parameters. Frozen with the registration (its SHA-256 goes in every report). A change after freeze is a new checker version, never an edit.",
  "version": "0.4.0-migration",
  "timeouts": {
    "installMs": 240000,
    "testMs": 240000,
    "gateMs": 120000,
    "commitMs": 120000,
    "serveSmokeMs": 8000
  },
  "sentinelCandidates": [
    "CLAUDE.md",
    "AGENTS.md",
    "GEMINI.md",
    ".github/copilot-instructions.md",
    ".cursor/rules"
  ],
  "specCandidates": [
    "docs/spec/SPEC.md",
    "docs/SPEC.md",
    "SPEC.md",
    "docs/spec.md"
  ],
  "specDirs": [
    "docs/spec",
    "docs/specs",
    "docs/features",
    "docs/especificacion",
    "docs/especificaciones",
    "docs/requisitos"
  ],
  "decisionDirs": [
    "docs/decisions",
    "docs/adr",
    "docs/adrs",
    "docs/decision-records",
    "docs/architecture/decisions",
    "docs/decisiones",
    "doc/adr",
    "adr",
    "decisions"
  ],
  "minSentinelRoutes": 3,
  "ignoreRefPatterns": [
    "^https?:",
    "^mailto:",
    "node_modules",
    "^dist/",
    "^build/",
    "^coverage/",
    "^\\.venv",
    "^venv/",
    "__pycache__",
    "\\.log$",
    "^\\.git/",
    "^\\.env"
  ],
  "refExtensions": [
    "md",
    "json",
    "js",
    "mjs",
    "cjs",
    "ts",
    "tsx",
    "py",
    "yml",
    "yaml",
    "sh",
    "toml",
    "lock",
    "txt",
    "cfg"
  ],
  "idToken": "\\b[A-Z][A-Z0-9]{0,5}(?:-[A-Z][A-Z0-9]{0,5})?-\\d{1,4}(?:\\.[A-Z]?\\d{1,3}){0,2}\\b",
  "criteriaHeading": "(acceptance|criteri|aceptaci|scenario|escenario)",
  "minCriteria": 3,
  "minCriterionWords": 5,
  "decisionSections": {
    "context": "(context|contexto)",
    "decision": "(decision|decisi[oó]n)"
  },
  "cascadeKinds": {
    "architecture": {
      "name": "(architect|arquitect|layers|capas)",
      "heading": "(architect|arquitect|layers|capas)"
    },
    "dataModel": {
      "name": "(data[-_ ]?model|modelo[-_ ]?de[-_ ]?datos|schema|esquema|state[-_ ]?model|domain[-_ ]?model|modelo[-_ ]?de[-_ ]?dominio)",
      "heading": "(data model|modelo de datos|schema|esquema|state model|domain model|modelo de dominio)"
    },
    "conventions": {
      "name": "(convention|convenci|standards|estandar|est[aá]ndar|style|estilo|guidelines|directrices)",
      "heading": "(convention|convenci|standards|est[aá]ndares|style|estilo|guidelines|directrices)"
    }
  },
  "minCascadeDocLines": 8,
  "coverageFileCandidates": [
    "docs/coverage.md",
    "docs/spec/coverage.md",
    "docs/spec/COVERAGE.md",
    "docs/criteria-coverage.md",
    "docs/coverage.json",
    "coverage-map.json",
    "docs/cobertura.md"
  ],
  "testDirs": [
    "tests",
    "test",
    "__tests__",
    "spec"
  ],
  "testFilePattern": "(\\.test\\.|\\.spec\\.|(^|/)test_[^/]*\\.py$|_test\\.(py|go)$)",
  "minTests": 5,
  "ratchetFileNames": "(ratchet|baseline|floor)",
  "lowerIsBetterKeys": "(max|ceiling|violation|error|duplicat|complex|size|lines|warn)",
  "openMarkers": [
    "OPEN:",
    "ABIERTA:",
    "PREGUNTA ABIERTA:"
  ],
  "skipScripts": [
    "start",
    "dev",
    "serve",
    "watch",
    "install",
    "prepare",
    "preinstall",
    "postinstall",
    "prepublish",
    "build",
    "format",
    "docs"
  ],
  "conventionalCommit": "^(feat|fix|docs|test|chore|refactor|ci|build|perf|style|revert)(\\([^)]+\\))?!?: \\S.{6,}$",
  "genericSubjects": [
    "wip",
    "update",
    "updates",
    "fix",
    "fixes",
    "changes",
    "stuff",
    "misc",
    "tmp",
    "asdf",
    "commit"
  ],
  "minCommits": 4,
  "minConventionalShare": 0.95,
  "maxFilesPerCommit": 30,
  "maxAddedLinesPerCommit": 1500,
  "atomicExemptFirstN": 1,
  "atomicIgnoreFiles": "(package-lock\\.json|yarn\\.lock|pnpm-lock\\.yaml|poetry\\.lock|Cargo\\.lock|go\\.sum|docs/spec\\.lock)$",
  "requireEnforcementAtCommit": [
    "E05"
  ],
  "sourceDirs": [
    "src",
    "lib",
    "app"
  ],
  "sourceExtensions": [
    "js",
    "mjs",
    "cjs",
    "ts",
    "py",
    "go",
    "rs"
  ],
  "lock": {
    "file": "docs/spec.lock",
    "tagRegex": "^[ \\t]*(?:\\/\\/|#|\\*|--|<!--)[ \\t]*@gs[ \\t]+(\\S+)[ \\t]+([^\\s#]+)#([\\p{L}\\p{N}_-]+)",
    "hashLength": 16,
    "verifyHash": false,
    "_verifyHash": "dev loop 2026-10-06: the lock formula states the line grammar and the hash length but not the exact normalisation of the section text, so a recomputed hash is not required to agree; the behavioural probes (a locked section edit is rejected, an unlocked edit accepted) and tag resolution decide. Set true only if a formula registers the normalisation."
  },
  "readme": {
    "headingHint": "(fresh clone|clean clone|getting started|quick ?start|install|build|setup|run|usage|test|testing|tests|development|ejecuci|instal|uso|prueba|desarrollo)",
    "mustContain": [
      "install",
      "test"
    ],
    "installOnlyIfDependencies": true
  },
  "networkErrorPatterns": [
    "ENOTFOUND",
    "ETIMEDOUT",
    "EAI_AGAIN",
    "ECONNRESET",
    "ECONNREFUSED",
    "network is unreachable",
    "Temporary failure in name resolution",
    "Could not resolve host",
    "getaddrinfo"
  ],
  "gateScriptAllow": "(gate|check|lint|test|verify|lock|open|ratchet|cover|spec|sensor|guard|audit|valid)",
  "sourceExcludePattern": "(^|/)(.*\\.config\\.[cm]?[jt]s|setup\\.py|conftest\\.py|noxfile\\.py|eslint[^/]*|vitest[^/]*|jest[^/]*|babel[^/]*|webpack[^/]*|rollup[^/]*)$",
  "conventionalLeniencyOne": true,
  "migration": {
    "manifest": "docs/migration/equivalence.json",
    "inventory": "docs/migration/inventory.md",
    "deferred": "docs/deferred.md",
    "charPattern": "characteri[sz]ation",
    "minCharTests": 5,
    "sourceExt": ["js", "mjs", "cjs", "ts", "py"],
    "mutation": { "count": 12, "minKill": 0.6, "runMs": 60000 },
    "surface": { "minShare": 0.9 }
  },
  "sync": {
    "minShare": 0.9,
    "ignorePrefixes": ["ADR", "RFC", "ISO", "UTF", "PEP", "SHA", "HTTP", "CVE"]
  }
};

__defs["./util"] = (module, exports, require) => {
'use strict';
// Shared helpers for the FX-1 checker: process execution, git, file walking, markdown parsing. Node only.
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const posix = p => p.split(path.sep).join('/');
const sha256 = s => crypto.createHash('sha256').update(s).digest('hex');
const exists = p => { try { fs.accessSync(p); return true; } catch { return false; } };
const read = p => fs.readFileSync(p, 'utf8').replace(/\r/g, '');
const tryRead = p => { try { return read(p); } catch { return null; } };

let _env = null;
function cleanEnv(extra = {}) {
  if (!_env) {
    const empty = path.join(os.tmpdir(), 'fx1-empty-gitconfig');
    if (!exists(empty)) fs.writeFileSync(empty, '');
    _env = {
      ...process.env,
      GIT_CONFIG_GLOBAL: empty, GIT_CONFIG_NOSYSTEM: '1', GIT_TERMINAL_PROMPT: '0',
      GIT_AUTHOR_NAME: 'fx1-checker', GIT_AUTHOR_EMAIL: 'fx1@example.invalid',
      GIT_COMMITTER_NAME: 'fx1-checker', GIT_COMMITTER_EMAIL: 'fx1@example.invalid',
      CI: '', FORCE_COLOR: '0', NO_COLOR: '1'
    };
    // The checker may itself run under `node --test` or `npm test`; scrub what would change how the project's own tools behave
    // (a child `node --test` that sees NODE_TEST_CONTEXT silently skips running files and reports success).
    for (const k of Object.keys(_env)) if (/^(NODE_TEST_CONTEXT|NODE_OPTIONS|NODE_ENV|INIT_CWD|npm_.*)$/i.test(k)) delete _env[k];
  }
  return { ..._env, ...extra };
}

// Run a shell command line with bash (Git Bash on Windows). Returns {code, out, timedOut}.
function sh(cmd, { cwd, timeout = 120000, env = {} } = {}) {
  const shell = process.env.FX1_SHELL || 'bash';
  const r = spawnSync(shell, ['-c', cmd], { cwd, env: cleanEnv(env), encoding: 'utf8', timeout, killSignal: 'SIGKILL', maxBuffer: 32 * 1024 * 1024 });
  const timedOut = !!(r.error && r.error.code === 'ETIMEDOUT');
  const out = ((r.stdout || '') + (r.stderr || '')).replace(/\r/g, '');
  return { code: timedOut ? 124 : (r.status === null ? 1 : r.status), out, timedOut, error: r.error && r.error.code !== 'ETIMEDOUT' ? String(r.error.message) : null };
}
function smoke(cmd, { cwd, timeout = 8000 } = {}) {
  const port = String(20000 + Math.floor(Math.random() * 20000)); // a fresh port per smoke start: a server that ignores a leftover process still binds
  const r = spawnSync(process.execPath, [__file, '--smoke-child', String(timeout), cwd, cmd], { cwd, env: cleanEnv({ PORT: port }), encoding: 'utf8', timeout: timeout + 20000, killSignal: 'SIGKILL', maxBuffer: 32 * 1024 * 1024 });
  const out = ((r.stdout || '') + (r.stderr || '')).replace(/\r/g, '');
  // Windows (development only): the process tree of npm.cmd is broken once npm exits, so also kill whatever listens on the smoke port
  if (process.platform === 'win32') spawnSync('powershell', ['-NoProfile', '-Command', `Get-NetTCPConnection -LocalPort ${port} -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }`], { stdio: 'ignore' });
  return { code: r.status === null ? 1 : r.status, out, timedOut: r.status === 124, error: null };
}
function git(cwd, args, opts = {}) {
  const r = spawnSync('git', ['-c', 'commit.gpgsign=false', '-c', 'core.autocrlf=false', ...args], { cwd, env: cleanEnv(opts.env), encoding: 'utf8', timeout: opts.timeout || 120000, killSignal: 'SIGKILL', maxBuffer: 32 * 1024 * 1024 });
  const out = ((r.stdout || '') + (r.stderr || '')).replace(/\r/g, '');
  return { code: r.status === null ? 1 : r.status, out, stdout: (r.stdout || '').replace(/\r/g, '') };
}

function walk(dir, { skip = ['.git', 'node_modules'] } = {}, acc = []) {
  if (!exists(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (skip.includes(e.name)) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, { skip }, acc); else acc.push(p);
  }
  return acc;
}
const relList = (root, dir, filter) => walk(path.join(root, dir)).map(p => posix(path.relative(root, p))).filter(filter || (() => true)).sort();
const trackedFiles = root => git(root, ['ls-files']).stdout.split('\n').filter(Boolean);

// ---------- markdown ----------
const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
function stripFences(text) {
  const out = []; let inFence = false;
  for (const line of text.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; out.push(''); continue; }
    out.push(inFence ? '' : line);
  }
  return out.join('\n');
}
function fences(text) {
  const blocks = []; let cur = null;
  const lines = text.split('\n');
  lines.forEach((line, i) => {
    const m = line.match(/^\s*(```|~~~)\s*([\w-]*)/);
    if (m) { if (cur) { blocks.push(cur); cur = null; } else cur = { lang: m[2], lines: [], start: i }; }
    else if (cur) cur.lines.push(line);
  });
  return blocks;
}
// Sections by heading (ATX). Also bold-label lines "**Label**" at line start act as headings (level 7).
function sections(text) {
  const lines = text.split('\n'); const out = []; let cur = null; let inFence = false;
  lines.forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) inFence = !inFence;
    const h = !inFence && line.match(/^(#{1,6})[ \t]+(.*?)\s*#*\s*$/);
    const b = !inFence && !h && line.match(/^\*\*([^*]+?)\*\*:?\s*(.*)$/);
    if (h || b) {
      if (cur) { cur.end = i; out.push(cur); }
      const title = h ? h[2] : b[1];
      cur = { level: h ? h[1].length : 7, title, slug: slug(title.replace(/\(.*?\)/g, '')), start: i, end: lines.length, body: [] };
      if (b && b[2]) cur.body.push(b[2]);
    } else if (cur) cur.body.push(line);
  });
  if (cur) { cur.end = lines.length; out.push(cur); }
  return out.map(s => ({ ...s, text: s.body.join('\n') }));
}
function normalizeSection(t) {
  return t.replace(/\r/g, '')
    .replace(/^[ \t]*(?:[-*]|\d+\.)[ \t]+(?:\[[ xX~]\][ \t]*)?/gm, '')
    .replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim();
}
const sectionHash = (t, len = 16) => sha256(normalizeSection(t)).slice(0, len);

// The id a line DEFINES: the first token after any bullet, number, checkbox, table pipe or emphasis marker.
function leadingId(line, idTokenSource) {
  const core = idTokenSource.replace(/\\b/g, '');
  const s = line.replace(/^\s*(?:[-*+]|\d+[.)])?\s*(?:\[[ xX~]\]\s*)?/, '').replace(/^\|\s*/, '').replace(/^(?:\*\*|__|`)+/, '');
  const m = s.match(new RegExp('^(' + core + ')(?![\\w-])'));
  return m ? m[1] : null;
}

// Path-like references in prose: markdown links and inline code outside fences.
// Returns [{ref, soft}]. A "soft" reference (an inline token with a file extension but no directory part, such as pantry.json)
// is a route if it resolves, but is never reported as dangling: it may name a file the program creates at run time.
function refsIn(text, cfg) {
  const t = stripFences(text); const refs = new Map();
  const exts = new Set(cfg.refExtensions);
  const ignore = cfg.ignoreRefPatterns.map(r => new RegExp(r));
  const add = (raw, fromLink) => {
    let r = raw.trim().replace(/^\.\//, '').replace(/[#?].*$/, '').replace(/[.,;:)]+$/, '');
    if (!r || ignore.some(re => re.test(r))) return;
    if (/[\s*<>{}$|\\^~=:]/.test(r) || r.startsWith('-') || r.startsWith('@') || r.startsWith('/')) return; // ':' also drops resource URIs and route templates
    const ext = (r.match(/\.([A-Za-z0-9]+)$/) || [])[1];
    const knownExt = !!(ext && exts.has(ext.toLowerCase()));
    const knownDir = /^(docs|doc|src|tests?|scripts|lib|app|adr|decisions|\.github|\.githooks|\.husky|\.claude|\.cursor)(\/|$)/i.test(r);
    if (!knownExt && !knownDir) return; // prose such as "and/or", unit lists, API paths, runtime data without a known extension
    const soft = !fromLink && !knownDir && !r.includes('/');
    if (!refs.has(r) || (refs.get(r) && !soft)) refs.set(r, soft);
  };
  for (const m of t.matchAll(/\]\(([^)\s]+)\)/g)) add(m[1], true);
  for (const m of t.matchAll(/`([^`\n]+)`/g)) add(m[1], false);
  // (dev loop 2026-10-06, defect C1) The routing table the formulas ask for is "topic | file": the file cell holds a bare path, and
  // sentinels also name paths in plain sentences. Bare paths with a directory part (and bare file names in a table cell) count as references.
  for (const line of t.split('\n')) {
    if (/^\s*\|/.test(line)) for (const cell of line.split('|').map(c => c.trim().replace(/^`|`$/g, ''))) if (/^[\w.][\w./-]*$/.test(cell) && (cell.includes('/') || /\.[A-Za-z0-9]{1,5}$/.test(cell))) add(cell.replace(/\/$/, ''), false);
  }
  // plain sentences only: not table rows (handled above) and not inline code spans (handled by the backtick rule: they may hold commands that create files)
  const prose = t.split('\n').filter(l => !/^\s*\|/.test(l)).join('\n').replace(/`[^`\n]*`/g, ' ');
  for (const m of prose.matchAll(/(?:^|[\s|(])((?:\.?[\w-]+\/)+[\w.-]*[\w-])\/?(?![\w\[\]<{*])/g)) add(m[1], false);
  return [...refs].map(([ref, soft]) => ({ ref, soft }));
}
function resolveRef(root, fromFile, ref) {
  const cands = [path.join(root, path.dirname(fromFile), ref), path.join(root, ref)];
  for (const c of cands) if (exists(c)) return posix(path.relative(root, c));
  return null;
}

module.exports = { posix, sha256, exists, read, tryRead, cleanEnv, sh, smoke, git, walk, relList, trackedFiles, slug, stripFences, fences, sections, normalizeSection, sectionHash, leadingId, refsIn, resolveRef };

};

__defs["./sandbox"] = (module, exports, require) => {
'use strict';
// A throwaway clean clone of the project under test, plus the probe engine (plant a violation, try to commit/push, observe).
const fs = require('fs');
const os = require('os');
const path = require('path');
const { sh, smoke, git, exists, read, tryRead, posix } = require('./util');

class Sandbox {
  constructor(repo, cfg, label) {
    this.repo = repo; this.cfg = cfg;
    this.dir = fs.mkdtempSync(path.join(os.tmpdir(), `fx1-${label}-`));
    this.root = path.join(this.dir, 'p');
    this.log = [];
    this.msgSuffix = '';
    this.pushCount = 0;
    this.baselineBadScripts = null;
  }
  clone() {
    const r = git(this.dir, ['clone', '--no-hardlinks', '-q', this.repo, this.root]);
    this.log.push({ step: 'clone', code: r.code });
    if (r.code !== 0) return { ok: false, out: r.out };
    this.head = git(this.root, ['rev-parse', 'HEAD']).stdout.trim();
    this.branch = git(this.root, ['symbolic-ref', '--short', 'HEAD']).stdout.trim() || 'HEAD';
    return { ok: !!this.head };
  }
  runSmoke(cmd, timeout) { const r = smoke(cmd, { cwd: this.root, timeout }); this.log.push({ step: 'smoke ' + cmd, code: r.code }); return r; }
  run(cmd, timeout) { const r = sh(cmd, { cwd: this.root, timeout }); this.log.push({ step: cmd, code: r.code }); return r; }
  isNetworkFailure(out) { return this.cfg.networkErrorPatterns.some(p => out.includes(p)); }
  hooksState() {
    const hp = git(this.root, ['config', '--get', 'core.hooksPath']).stdout.trim();
    const dirRel = hp || '.git/hooks';
    const dir = path.isAbsolute(dirRel) ? dirRel : path.join(this.root, dirRel);
    let files = [];
    try { files = fs.readdirSync(dir).filter(f => !f.endsWith('.sample') && fs.statSync(path.join(dir, f)).isFile()); } catch { /* none */ }
    const names = files.filter(f => ['pre-commit', 'commit-msg', 'pre-push', 'prepare-commit-msg'].includes(f));
    let execOk = null;
    if (process.platform !== 'win32') execOk = names.every(f => (fs.statSync(path.join(dir, f)).mode & 0o111) !== 0);
    // (dev loop 2026-10-06, defect C8) A hook committed as 100644 is skipped by git on Linux ("hook was ignored because it's not set as executable") and
    // every gate behind it is silently inert. On Windows the file mode is not observable, so also judge the committed mode, on every platform.
    const tracked = names.map(f => ({ f, mode: git(this.root, ['ls-files', '-s', '--', posix(path.join(path.relative(this.root, dir), f))]).stdout.trim().split(/\s+/)[0] })).filter(t => /^\d{6}$/.test(t.mode));
    if (tracked.length) { const modeOk = tracked.every(t => t.mode === '100755'); execOk = execOk === null ? modeOk : (execOk && modeOk); }
    return { hooksPath: hp || null, dir: posix(path.relative(this.root, dir)), hooks: names, execBitOk: execOk };
  }
  reset() {
    git(this.root, ['reset', '--hard', '-q', this.head]);
    git(this.root, ['clean', '-fdxq', '-e', 'node_modules', '-e', '.venv', '-e', 'package-lock.json']);
  }
  apply(edits) {
    for (const e of edits) {
      const p = path.join(this.root, e.path);
      fs.mkdirSync(path.dirname(p), { recursive: true });
      if (e.write !== undefined) fs.writeFileSync(p, e.write);
      else if (e.append !== undefined) fs.appendFileSync(p, e.append);
      else if (e.transform) fs.writeFileSync(p, e.transform(tryRead(p) || ''));
    }
  }
  // Try to commit the edits. blocked = exit code nonzero and HEAD unchanged.
  attemptCommit(edits, message, { noVerify = false, raw = false, hooksPath = null } = {}) {
    this.reset(); this.apply(edits);
    const files = edits.map(e => e.path);
    git(this.root, ['add', '--', ...files]);
    const before = git(this.root, ['rev-parse', 'HEAD']).stdout.trim();
    const msg = (!raw && this.msgSuffix && !message.includes(this.msgSuffix.trim())) ? message + this.msgSuffix : message;
    const args = ['commit', '-q', '-m', msg]; if (noVerify) args.push('--no-verify'); if (hooksPath) args.unshift('-c', `core.hooksPath=${hooksPath}`);
    const r = git(this.root, args, { timeout: this.cfg.timeouts.commitMs });
    const after = git(this.root, ['rev-parse', 'HEAD']).stdout.trim();
    const committed = after !== before;
    return { blocked: r.code !== 0 && !committed, committed, code: r.code, out: r.out.slice(-1500), network: this.isNetworkFailure(r.out) };
  }
  // Push stage: commit without hooks, then push to a fresh branch of a local bare remote (a new name per probe: pushes are never non-fast-forward).
  attemptPush(edits, message) {
    const bare = path.join(this.dir, 'remote.git');
    if (!exists(bare)) { git(this.dir, ['init', '--bare', '-q', bare]); git(this.root, ['remote', 'add', 'fx1origin', bare]); }
    const c = this.attemptCommit(edits, message, { noVerify: true });
    if (!c.committed) return { blocked: null, note: 'could not create the probe commit', out: c.out };
    const name = `fx1-probe-${++this.pushCount}`;
    const r = git(this.root, ['push', '-q', 'fx1origin', `HEAD:refs/heads/${name}`], { timeout: this.cfg.timeouts.commitMs });
    return { blocked: r.code !== 0, code: r.code, out: r.out.slice(-1500), network: this.isNetworkFailure(r.out) };
  }
  // package.json scripts worth running as gates (allow-list), minus the ones that already fail on the clean head.
  gateScriptNames() {
    const pkg = tryRead(path.join(this.root, 'package.json'));
    if (!pkg) return [];
    let scripts = {}; try { scripts = JSON.parse(pkg).scripts || {}; } catch { /* ignore */ }
    const allow = new RegExp(this.cfg.gateScriptAllow, 'i');
    return Object.keys(scripts).filter(n => allow.test(n) && !this.cfg.skipScripts.some(s => n === s || n.startsWith(s + ':')));
  }
  scriptFailures(timeoutMs) {
    const names = this.gateScriptNames();
    if (this.baselineBadScripts === null) { // scripts that fail on the clean head are not evidence of anything
      this.reset();
      this.baselineBadScripts = names.filter(n => { const r = sh(`npm run ${n} --silent`, { cwd: this.root, timeout: timeoutMs }); return r.code !== 0; });
    }
    return names.filter(n => !this.baselineBadScripts.includes(n));
  }
  // Full probe: commit attempt; if not blocked, a push attempt; if not blocked, the gate scripts on the same mutated tree.
  probe(edits, message, { scripts = true, push = true } = {}) {
    const c = this.attemptCommit(edits, message);
    if (c.blocked) return { blockedAt: 'commit', commit: c, scripts: [] };
    let pushed = null;
    if (push) { pushed = this.attemptPush(edits, message); if (pushed.blocked === true) return { blockedAt: 'push', commit: c, push: pushed, scripts: [] }; }
    let fails = [];
    if (scripts && !this.cfg.strictEnforcement) { // strict enforcement: a failing package script is not credited, nothing runs it unless a person does
      const cand = this.scriptFailures(this.cfg.timeouts.gateMs); // computes the baseline on a reset tree first
      this.reset(); this.apply(edits);
      fails = cand.filter(n => { const r = sh(`npm run ${n} --silent`, { cwd: this.root, timeout: this.cfg.timeouts.gateMs }); return r.code !== 0 && !r.timedOut; });
    }
    return { blockedAt: fails.length ? 'script' : null, commit: c, push: pushed, scripts: fails };
  }
  // A folder holding ONLY the project's hook <name> (copied from where it was installed), for probes that must reach one stage alone.
  isolateHook(name) {
    const hs = this.hooksState(); if (!hs.hooks.includes(name)) return null;
    const dir = path.join(this.dir, 'iso-' + name); fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(path.join(this.root, hs.dir, name), path.join(dir, name)); try { fs.chmodSync(path.join(dir, name), 0o755); } catch { /* windows */ }
    return posix(dir);
  }
  cleanup() { try { fs.rmSync(this.dir, { recursive: true, force: true, maxRetries: 3 }); } catch { /* best effort */ } }
}
module.exports = { Sandbox };

};

__defs["./items"] = (module, exports, require) => {
'use strict';
// The twelve substrate items, each judged "present AND working". Deterministic: no model is consulted.
// Status values: PASS (present and working) | PARTIAL (present, not working or incomplete) | ABSENT | UNDETERMINABLE (checker could not decide: environment fault).
// Every enforcement probe is paired with a clean control that differs only in the violation (a block counts only if the control is accepted).
const fs = require('fs');
const path = require('path');
const { sh, git, exists, read, tryRead, posix, relList, trackedFiles, sections, stripFences, fences, sectionHash, leadingId, refsIn, resolveRef, slug, sha256 } = require('./util');

const res = (id, name, status, reasons = [], evidence = {}, subflags = {}) => ({ id, name, status, reasons, evidence, subflags });
const rx = s => new RegExp(s, 'i');
const nonBlank = t => t.split('\n').filter(l => l.trim()).length;
const TEXT_EXT = /\.(md|json|ya?ml|js|mjs|cjs|ts|tsx|py|sh|toml|cfg|txt|lock)$/i;
const ghSlug = s => s.toLowerCase().replace(/[^\p{L}\p{N} -]/gu, '').trim().replace(/\s/g, '-');
const BLOCKED = r => !!r.blockedAt;

// ---------- discovery shared by items ----------
function discover(ctx) {
  if (ctx.found) return ctx.found;
  const { root, cfg } = ctx; const tracked = trackedFiles(root);
  const f = { tracked };
  let sentinel = null;
  for (const c of cfg.sentinelCandidates) {
    const p = path.join(root, c);
    if (!exists(p)) continue;
    if (fs.statSync(p).isDirectory()) { const inner = relList(root, c, x => /\.(md|mdc|txt)$/.test(x)); if (inner.length) { sentinel = inner[0]; f.sentinelExtra = inner.slice(1); break; } } else { sentinel = c; break; }
  }
  f.sentinel = sentinel;
  const specs = new Set();
  for (const c of cfg.specCandidates) if (exists(path.join(root, c)) && fs.statSync(path.join(root, c)).isFile()) specs.add(c);
  for (const d of cfg.specDirs) for (const p of relList(root, d, x => /\.md$/i.test(x))) specs.add(p);
  f.specFiles = [...specs].filter(p => !/coverage|cobertura/i.test(path.basename(p))).sort(); // a coverage table inside the spec folder is not a spec
  f.decisionDir = cfg.decisionDirs.find(d => exists(path.join(root, d)) && fs.statSync(path.join(root, d)).isDirectory()) || null;
  return (ctx.found = f);
}

// Follow "@path" imports (CLAUDE.md that only imports AGENTS.md) and collect text.
function sentinelText(ctx) {
  const f = discover(ctx); if (!f.sentinel) return null;
  const seen = new Set(); let text = ''; const queue = [f.sentinel, ...(f.sentinelExtra || [])];
  while (queue.length) {
    const rel = queue.shift(); if (seen.has(rel)) continue; seen.add(rel);
    const t = tryRead(path.join(ctx.root, rel)); if (t == null) continue;
    text += '\n' + t;
    for (const m of t.matchAll(/^@(\S+)\s*$/gm)) { const r = resolveRef(ctx.root, rel, m[1]); if (r) queue.push(r); }
  }
  return { text, files: [...seen] };
}

// ---------- E01 sentinel ----------
function e01(ctx) {
  const f = discover(ctx);
  const name = 'sentinel routes to existing files';
  if (!f.sentinel) return res('E01', name, 'ABSENT', ['no sentinel file (CLAUDE.md, AGENTS.md, GEMINI.md, copilot-instructions.md, .cursor/rules)']);
  const s = sentinelText(ctx);
  if (nonBlank(s.text) < 5) return res('E01', name, 'PARTIAL', ['sentinel is a stub (fewer than 5 non-blank lines)'], { sentinel: f.sentinel });
  const resolved = [], dangling = [];
  for (const rel of s.files) {
    for (const { ref, soft } of refsIn(read(path.join(ctx.root, rel)), ctx.cfg)) {
      const hit = resolveRef(ctx.root, rel, ref);
      // (dev loop, defect C6) a path the repository itself git-ignores (data files, build output) is created at run time: naming it is not a dangling route
      if (hit) resolved.push(hit); else if (!soft && git(ctx.root, ['check-ignore', '-q', ref]).code !== 0) dangling.push(ref);
    }
  }
  const uniq = a => [...new Set(a)];
  const nonEmpty = rel => { try { const st = fs.statSync(path.join(ctx.root, rel)); return st.isDirectory() ? fs.readdirSync(path.join(ctx.root, rel)).length > 0 : st.size > 0; } catch { return false; } };
  const all = uniq(resolved), empties = all.filter(r => !nonEmpty(r));
  const routes = all.filter(r => !empties.includes(r)), miss = uniq(dangling);
  const docRoutes = routes.filter(r => /\.(md|mdx|txt|rst)$/i.test(r) || /^(docs?|adr|decisions)(\/|$)/i.test(r));
  const routesSpec = !f.specFiles.length || routes.some(r => f.specFiles.includes(r) || f.specFiles.some(sp => sp.startsWith(r.replace(/\/?$/, '/'))));
  const reasons = [];
  if (docRoutes.length < ctx.cfg.minSentinelRoutes) reasons.push(`only ${docRoutes.length} distinct non-empty documentation files or folders routed (need ${ctx.cfg.minSentinelRoutes})`);
  if (!routesSpec) reasons.push('the sentinel routes nowhere near the spec');
  if (miss.length) reasons.push(`referenced but missing: ${miss.slice(0, 8).join(', ')}`);
  if (empties.length) reasons.push(`routed to empty files: ${empties.slice(0, 8).join(', ')}`);
  ctx.shared.sentinelRoutes = routes;
  return res('E01', name, reasons.length ? 'PARTIAL' : 'PASS', reasons, { sentinel: f.sentinel, routes, dangling: miss });
}

// ---------- E02 spec with requirement ids and criterion ids ----------
const CRIT_SHAPE = /-\d+\.\d+$/;
function parseSpecDefs(ctx) {
  const f = discover(ctx); const defs = []; const cfg = ctx.cfg;
  for (const file of f.specFiles) {
    const text = read(path.join(ctx.root, file)); const lines = text.split('\n');
    let inFence = false; const stack = []; // heading stack; a bold label on its own line acts as a level-7 heading
    const push = (level, title) => { while (stack.length && stack[stack.length - 1].level >= level) stack.pop(); stack.push({ level, title }); };
    lines.forEach((line, i) => {
      if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; return; }
      if (inFence) return;
      const h = line.match(/^(#{1,6})[ \t]+(.*?)\s*#*\s*$/);
      const b = !h && line.match(/^\*\*([^*]+?)\*\*:?\s*$/);
      if (h || b) {
        push(h ? h[1].length : 7, h ? h[2] : b[1]);
        const id = h ? leadingId(h[2], cfg.idToken) : null;
        if (id) defs.push({ id, file, line: i + 1, kind: (stack.slice(0, -1).some(s => rx(cfg.criteriaHeading).test(s.title)) || CRIT_SHAPE.test(id)) ? 'criterion' : 'requirement', text: h[2], heading: true });
        return;
      }
      const id = leadingId(line, cfg.idToken); if (!id) return;
      // (dev loop, defect C12) a plain paragraph that merely starts with an id ("F-001.8 to F-001.17 were ratified ...", run b4-A-lamp-en) defines nothing:
      // a definition is a list item, a table row, a bold label or a line that says how it is verified (or any line under a criteria heading)
      if (!/^\s*(?:[-*+]|\d+[.)]|\||\*\*|__)/.test(line) && !/verified by:/i.test(line) && !stack.some(s => rx(cfg.criteriaHeading).test(s.title))) return;
      // (dev loop 2026-10-06, defect C2) a dotted numeric id (F-001.2) is a criterion wherever it sits: the formulas do not ask for a criteria heading
      const inCrit = stack.some(s => rx(cfg.criteriaHeading).test(s.title)) || CRIT_SHAPE.test(id);
      const body = line.replace(/^\s*(?:[-*+]|\d+[.)])?\s*(?:\[[ xX~]\]\s*)?\|?\s*(?:\*\*|__|`)*/, '').replace(id, '');
      let extra = ''; for (let j = i + 1; j < lines.length && /^[ \t]+\S/.test(lines[j]) && !leadingId(lines[j], cfg.idToken); j++) extra += ' ' + lines[j].trim();
      defs.push({ id, file, line: i + 1, kind: inCrit ? 'criterion' : 'requirement', text: (body + extra).trim(), row: /^\s*\|/.test(line) });
    });
  }
  return defs;
}
function e02(ctx) {
  const f = discover(ctx); const cfg = ctx.cfg;
  const name = 'spec with unique requirement ids and criterion ids';
  if (!f.specFiles.length) return res('E02', name, 'ABSENT', ['no spec file (docs/spec/SPEC.md or files under docs/spec, docs/specs, docs/features)']);
  const defs = parseSpecDefs(ctx);
  const reqs = defs.filter(d => d.kind === 'requirement'), crit = defs.filter(d => d.kind === 'criterion');
  // (dev loop 2026-10-06, defect C2) The root file (SPEC.md) lists the features, so an id its listing repeats from a feature file is not a duplicate; two
  // feature files, or one file defining an id twice, are. A list or table line that restates a requirement id is not a definition (only a heading is).
  const isRoot = file => /^docs\/spec\/spec\.md$|^docs\/spec\.md$|^spec\.md$/i.test(file);
  // (dev loop 2, defect C14) A definition is a heading (requirements) or a list or bold-label line (criteria). A table row that merely mentions an id
  // (an assumptions table, a feature listing) is a mention, not a second definition: run b1-C-habits-en had "| F-001 empty name ..." in docs/spec/assumptions.md.
  const byId = new Map(); for (const d of defs) { if (!byId.has(d.id)) byId.set(d.id, []); byId.get(d.id).push(d); }
  const dups = [];
  for (const [id, ds] of byId) {
    let prim = ds[0].kind === 'requirement' ? ds.filter(d => d.heading) : ds.filter(d => !d.row);
    if (prim.some(d => !isRoot(d.file))) prim = prim.filter(d => !isRoot(d.file));
    if (prim.length > 1) dups.push(id);
  }
  const words = t => t.split(/\s+/).filter(w => /[A-Za-zÀ-ɏ]{2,}/.test(w)).length;
  const thin = crit.filter(c => words(c.text) < cfg.minCriterionWords).map(c => c.id);
  const reasons = [];
  const sub = { '2a_requirement_ids': reqs.length >= 1, '2b_criterion_ids': crit.length >= cfg.minCriteria, ids_unique: dups.length === 0, criteria_testable_length: thin.length === 0 };
  if (!sub['2a_requirement_ids']) reasons.push('no requirement ids (an id at the start of a heading or list item outside the criteria sections)');
  if (!sub['2b_criterion_ids']) reasons.push(`${crit.length} criterion ids under a criteria heading (need ${cfg.minCriteria})`);
  if (dups.length) reasons.push(`duplicate ids: ${[...new Set(dups)].slice(0, 8).join(', ')}`);
  if (thin.length) reasons.push(`criteria too short to be testable: ${thin.slice(0, 8).join(', ')}`);
  ctx.shared.criteria = crit; ctx.shared.requirements = reqs;
  const anything = defs.length > 0;
  const status = reasons.length === 0 ? 'PASS' : (anything ? 'PARTIAL' : 'ABSENT');
  return res('E02', name, status, anything ? reasons : ['spec present but defines no ids', ...reasons], { specFiles: f.specFiles, requirements: reqs.length, criteria: crit.length }, sub);
}

// ---------- E03 decision records ----------
function e03(ctx) {
  const f = discover(ctx); const cfg = ctx.cfg; const name = 'decision records exist and are referenced';
  if (!f.decisionDir) return res('E03', name, 'ABSENT', ['no decision directory (docs/decisions, docs/adr, ...)']);
  const files = relList(ctx.root, f.decisionDir, x => /\.md$/i.test(x) && !/(^|\/)(readme|index|template)[^/]*$/i.test(x));
  if (!files.length) return res('E03', name, 'ABSENT', [`${f.decisionDir} has no record files`]);
  const reasons = []; const unstructured = [], unref = [];
  const others = f.tracked.filter(p => TEXT_EXT.test(p));
  const texts = new Map(others.map(p => [p, tryRead(path.join(ctx.root, p)) || '']));
  let referencedFromRoute = false;
  const routeSet = new Set([...(f.specFiles || []), f.sentinel, ...(ctx.shared.sentinelRoutes || [])].filter(Boolean));
  for (const file of files) {
    const secs = sections(read(path.join(ctx.root, file)));
    const hasCtx = secs.some(s => rx(cfg.decisionSections.context).test(s.title)), hasDec = secs.some(s => rx(cfg.decisionSections.decision).test(s.title));
    if (!(hasCtx && hasDec)) unstructured.push(file);
    const base = path.basename(file); const stem = base.replace(/\.md$/i, ''); const num = (base.match(/(\d{3,4})/) || [])[1];
    const adrId = num ? new RegExp(`ADR[- ]?0*${parseInt(num, 10)}(?!\\d)`, 'i') : null;
    let refd = false;
    for (const [p, t] of texts) {
      if (p === file) continue;
      if (t.includes(file) || t.includes(base) || t.includes(stem) || (adrId && adrId.test(t))) { refd = true; if (routeSet.has(p)) referencedFromRoute = true; }
    }
    if (!refd) unref.push(file);
  }
  if (unstructured.length) reasons.push(`records without context and decision sections: ${unstructured.slice(0, 5).join(', ')}`);
  if (unref.length) reasons.push(`records referenced by nothing else: ${unref.slice(0, 5).join(', ')}`);
  if (!referencedFromRoute) reasons.push('no record is referenced from the sentinel or the spec');
  return res('E03', name, reasons.length ? 'PARTIAL' : 'PASS', reasons, { records: files }, {});
}

// ---------- E04 cascade documents reachable from the sentinel ----------
function reachableDocs(ctx, depth = 2) {
  const f = discover(ctx); if (!f.sentinel) return new Set();
  const seen = new Set(); let frontier = [f.sentinel];
  for (let d = 0; d <= depth; d++) {
    const next = [];
    for (const rel of frontier) {
      if (seen.has(rel)) continue; seen.add(rel);
      if (!/\.md$/i.test(rel)) continue;
      const t = tryRead(path.join(ctx.root, rel)); if (t == null) continue;
      for (const { ref } of refsIn(t, ctx.cfg)) { const r = resolveRef(ctx.root, rel, ref); if (r && !seen.has(r)) next.push(r); }
      for (const m of t.matchAll(/^@(\S+)\s*$/gm)) { const r = resolveRef(ctx.root, rel, m[1]); if (r) next.push(r); }
    }
    frontier = next;
  }
  return seen;
}
const NO_DATA = /no (stored |persistent |persisted )?data\b|stores? no data|nothing is stored|sin datos (almacenados|persistentes)|no se (almacenan|guardan|persisten) datos|no hay datos almacenados/i;
function declaresNoData(ctx, reach) {
  const f = discover(ctx);
  const files = [...new Set([...(f.sentinel ? [f.sentinel] : []), ...[...reach].filter(r => /(^|\/)(architecture|arquitectura)[^/]*\.md$/i.test(r))])];
  return files.some(p => NO_DATA.test(tryRead(path.join(ctx.root, p)) || ''));
}
function e04(ctx) {
  const f = discover(ctx); const cfg = ctx.cfg; const name = 'derived cascade (architecture, data model, conventions) routed from the sentinel';
  const mdAll = f.tracked.filter(p => /\.md$/i.test(p));
  const reach = reachableDocs(ctx);
  const specIds = new Set((ctx.shared.criteria || []).concat(ctx.shared.requirements || []).map(d => d.id));
  const found = {}, existsNotRouted = {}, reasons = []; let any = false; const used = new Set();
  for (const [kind, k] of Object.entries(cfg.cascadeKinds)) {
    const matches = md => rx(k.name).test(path.basename(md)) || sections(read(path.join(ctx.root, md))).some(s => rx(k.heading).test(s.title) && s.level <= 2);
    const good = md => nonBlank(read(path.join(ctx.root, md))) >= cfg.minCascadeDocLines;
    const cands = mdAll.filter(md => !/^(CLAUDE|AGENTS|GEMINI|README)\.md$/i.test(md) && !f.specFiles.includes(md) && !used.has(md) && matches(md) && good(md));
    if (cands.length) any = true;
    const routed = cands.find(c => reach.has(c));
    if (routed) {
      used.add(routed); // three distinct documents: one file cannot stand in for all three kinds
      const t = read(path.join(ctx.root, routed));
      const derived = f.specFiles.some(sp => t.includes(sp)) || [...specIds].some(id => t.includes(id)); // full spec path or one of its ids, never a bare file name
      found[kind] = { file: routed, derivedFromSpec: derived };
      if (!derived) reasons.push(`${kind}: ${routed} neither cites the spec path nor any spec id`);
    } else if (cands.length) { existsNotRouted[kind] = cands[0]; reasons.push(`${kind}: ${cands[0]} exists but the sentinel does not route to it`); }
    else if (kind === 'dataModel' && declaresNoData(ctx, reach)) found[kind] = { file: null, declared: 'no stored data', derivedFromSpec: true }; // (dev loop, defect C5) the formulas allow "no stored data" in architecture.md instead of a data-model document
    else reasons.push(`${kind}: no (further) document`);
  }
  if (!any) return res('E04', name, 'ABSENT', reasons, { found });
  const ok = Object.keys(cfg.cascadeKinds).every(k => found[k] && found[k].derivedFromSpec);
  ctx.shared.cascade = found;
  return res('E04', name, ok ? 'PASS' : 'PARTIAL', ok ? [] : reasons, { found, existsNotRouted }, { derived_is_proxy: true });
}

// ---------- shared dynamic setup (probe clone) ----------
function detectStack(root) {
  if (exists(path.join(root, 'package.json'))) return 'node';
  if (['pyproject.toml', 'requirements.txt', 'requirements-dev.txt', 'setup.py', 'pytest.ini', 'setup.cfg'].some(x => exists(path.join(root, x)))) return 'python';
  if (exists(path.join(root, 'go.mod'))) return 'go';
  return 'unknown';
}
function installCommands(ctx, sbx) {
  const readme = ctx.shared.readme;
  const fromReadme = readme ? readme.commands.filter(c => c.kind === 'install').map(c => c.pre + c.cmd) : [];
  const stack = detectStack(sbx.root);
  const dflt = stack === 'node' ? ['npm install --no-audit --no-fund'] : stack === 'python' ? [exists(path.join(sbx.root, 'requirements.txt')) ? 'python -m pip install -q -r requirements.txt' : exists(path.join(sbx.root, 'requirements-dev.txt')) ? 'python -m pip install -q -r requirements-dev.txt' : 'python -m pip install -q -e .'] : [];
  return { fromReadme, dflt, stack };
}
function testCommand(ctx, sbx) {
  const stack = detectStack(sbx.root);
  if (stack === 'node') { const p = tryRead(path.join(sbx.root, 'package.json')); try { const t = (JSON.parse(p).scripts || {}).test; if (t && !/no test specified/.test(t)) return 'npm test --silent'; } catch { /* ignore */ } }
  if (stack === 'python') return 'python -m pytest -q';
  if (stack === 'go') return 'go test ./...';
  const r = ctx.shared.readme; const c = r && r.commands.find(x => x.kind === 'test'); return c ? c.pre + c.cmd : null;
}
// Executed (non-skipped, non-todo) test cases, counted statically.
const SKIPPED = /^\s*(?:test|it|describe)\.(?:todo|skip)\s*\(|^\s*x(?:it|test|describe)\s*\(|@pytest\.mark\.skip|^\s*@unittest\.skip/;
function countTests(root, cfg) {
  const tf = trackedFiles(root).filter(p => new RegExp(cfg.testFilePattern).test(p) || cfg.testDirs.some(d => p.startsWith(d + '/')));
  let n = 0;
  for (const p of tf) {
    const lines = (tryRead(path.join(root, p)) || '').split('\n');
    lines.forEach((l, i) => { if (/^\s*(?:test|it)(?:\.\w+)?\s*\(|^\s*def test_|^\s*func Test\w+/.test(l) && !SKIPPED.test(l) && !(i > 0 && /@pytest\.mark\.skip/.test(lines[i - 1]))) n++; });
  }
  return { files: tf.length, cases: n };
}
function prepareProbe(ctx) {
  if (ctx.probe) return ctx.probe;
  const { Sandbox } = require('./sandbox');
  const sbx = new Sandbox(ctx.repo, ctx.cfg, 'probe'); ctx.sandboxes.push(sbx);
  const P = ctx.probe = { sbx, ok: false, notes: [], undeterminable: null };
  const c = sbx.clone(); if (!c.ok) { P.notes.push('clone failed'); P.undeterminable = 'clone failed: ' + (c.out || '').slice(0, 200); return P; }
  const ic = installCommands(ctx, sbx); P.stack = ic.stack; P.install = { via: null, results: [] };
  const tryInstall = (cmds, via) => {
    for (const cmd of cmds) {
      const r = sbx.run(cmd, ctx.cfg.timeouts.installMs); P.install.results.push({ cmd, code: r.code, tail: r.out.slice(-400) });
      if (r.timedOut) { P.undeterminable = `install timed out: ${cmd}`; return false; }
      if (r.code !== 0) { if (sbx.isNetworkFailure(r.out)) P.undeterminable = `install network failure: ${cmd}`; return false; }
    }
    P.install.via = via; return true;
  };
  let okI = tryInstall(ic.fromReadme, 'readme');
  let hs = sbx.hooksState();
  if ((!okI || !hs.hooks.length) && !P.undeterminable && ic.dflt.length) { okI = tryInstall(ic.dflt, 'default'); hs = sbx.hooksState(); }
  P.installOk = okI || (!ic.fromReadme.length && !ic.dflt.length); P.hooks = hs;
  P.ok = true;
  // C0: a clean, conventional, docs-only change must be accepted. If a plain message is refused, retry with a requirement id in the message
  // (a legitimate traceability policy); all later probes then use the accepted message style.
  const readme = ['README.md', 'readme.md'].find(x => exists(path.join(sbx.root, x))) || 'README.md';
  P.readmePath = readme;
  P.c0 = sbx.attemptCommit([{ path: readme, append: '\n<!-- fx1 clean probe -->\n' }], 'docs: fx1 clean probe change', { raw: true });
  if (P.c0.blocked) {
    const id = ((ctx.shared.criteria || [])[0] || (ctx.shared.requirements || [])[0] || {}).id;
    if (id) { const c1 = sbx.attemptCommit([{ path: readme, append: '\n<!-- fx1 clean probe -->\n' }], `docs: fx1 clean probe change (${id})`, { raw: true }); if (!c1.blocked) { P.c0 = c1; P.c0.retriedWithId = true; sbx.msgSuffix = ` (${id})`; } }
  }
  // (dev loop 2026-10-06, defect C11) Paired control for the PUSH stage: a clean docs-only change pushed with --no-verify on the commit must be accepted by the
  // push hooks. A pre-push gate that is red at baseline (it runs the one command, which is broken) blocks every push, so every push-stage probe would
  // "block" for a reason that is not the violation (seen on a mutant of run b3-A-tally-en: a no-op ratchet script made the one command fail, and E06 still passed).
  if (!P.c0.blocked) {
    P.cPush = sbx.attemptPush([{ path: readme, append: '\n<!-- fx1 clean push probe -->\n' }], 'docs: fx1 clean push probe' + sbx.msgSuffix);
  }
  sbx.reset();
  return P;
}
function confounded(P, id, name, { commitOnly = false } = {}) {
  if (P.undeterminable) return res(id, name, 'UNDETERMINABLE', [P.undeterminable]);
  if (P.c0 && P.c0.blocked) {
    if (P.c0.network) return res(id, name, 'UNDETERMINABLE', ['a network failure blocked the baseline commit (a hook fetched something)']);
    return res(id, name, 'PARTIAL', ['a clean docs-only commit is blocked, so the probe is not informative (confounded by the baseline block)'], { c0: P.c0.out }, { confounded_by: 'baseline-commit-blocked' });
  }
  if (!commitOnly && P.cPush && P.cPush.blocked === true) {
    if (P.cPush.network) return res(id, name, 'UNDETERMINABLE', ['a network failure blocked the baseline push (a hook fetched something)']);
    return res(id, name, 'PARTIAL', ['a clean docs-only push is blocked (a pre-push gate is red at baseline), so a push-stage block does not show a gate for the violation (confounded by the baseline push block)'], { cPush: P.cPush.out }, { confounded_by: 'baseline-push-blocked' });
  }
  return null;
}
const isTestPath = (cfg, p) => new RegExp(cfg.testFilePattern).test(p) || cfg.testDirs.some(d => p.startsWith(d + '/'));
// The source file to plant violations in: one that the tests import, never a config file.
function srcFile(ctx, sbx) {
  const cfg = ctx.cfg; const exts = cfg.sourceExtensions; const tracked = trackedFiles(sbx.root);
  const excl = new RegExp(cfg.sourceExcludePattern);
  const code = tracked.filter(p => exts.includes(p.split('.').pop()) && !isTestPath(cfg, p) && !excl.test(p) && !/^(scripts|tools|bin|build|ci)\//.test(p) && !p.startsWith('.') && !p.startsWith('docs/'));
  const testText = tracked.filter(p => isTestPath(cfg, p)).map(p => tryRead(path.join(sbx.root, p)) || '').join('\n');
  const imported = code.filter(p => { const stem = path.basename(p).replace(/\.[^.]+$/, ''); return stem && new RegExp(`(require|import|from)[^\\n]*\\b${stem.replace(/[-.]/g, '[-_.]')}\\b`).test(testText); });
  const inSrc = code.filter(p => cfg.sourceDirs.some(d => p.startsWith(d + '/')));
  return imported[0] || inSrc[0] || code[0] || null;
}
const commentFor = (file, text) => (/\.(py|sh)$/.test(file) ? '# ' : '// ') + text;
// A planted violation must not be blocked by an unrelated gate: cite a requirement id and stage a doc change that is neither a spec nor locked.
function coChangeSafe(ctx) {
  const f = discover(ctx);
  const id = (ctx.shared.criteria || [])[0] ? ctx.shared.criteria[0].id : (ctx.shared.requirements || [])[0] ? ctx.shared.requirements[0].id : null;
  const okDoc = p => /^docs\/[^/]+\.md$/i.test(p) && !/spec|decision|lock|ratchet|coverage/i.test(p) && !f.specFiles.includes(p);
  const cascadeDoc = ctx.shared.cascade && Object.values(ctx.shared.cascade).map(v => v.file).find(okDoc);
  const docFile = cascadeDoc || f.tracked.find(okDoc);
  return { idSuffix: id ? ` (${id})` : '', docEdit: docFile ? { path: docFile, append: '\nfx1 probe note.\n' } : null };
}
// Trailing new spec section (an unlocked region), with or without an open-question marker.
const trailing = (spec, marker) => ({ path: spec, append: `\n\n## Planted note\n\n${marker ? marker + ' ' : ''}should the planted note block this commit?\n` });

// ---------- E05 tests plus an enforced blocking gate ----------
function e05(ctx) {
  const name = 'tests plus an enforced blocking gate';
  const P = prepareProbe(ctx); if (P.undeterminable) return res('E05', name, 'UNDETERMINABLE', [P.undeterminable]);
  const sbx = P.sbx; const tc = countTests(sbx.root, ctx.cfg);
  if (tc.cases === 0) return res('E05', name, 'ABSENT', ['no executed (non-skipped, non-todo) test cases found'], { tests: tc });
  const reasons = []; const sub = {};
  const cmd = testCommand(ctx, sbx);
  let testsPass = false;
  if (!cmd) reasons.push('no test command found');
  else {
    const r = sbx.run(cmd, ctx.cfg.timeouts.testMs);
    if (r.timedOut) return res('E05', name, 'UNDETERMINABLE', [`test run timed out: ${cmd}`]);
    if (r.code !== 0 && /command not found|not recognized|No module named pytest/.test(r.out)) return res('E05', name, 'UNDETERMINABLE', ['tool missing for the test command: ' + cmd]);
    testsPass = r.code === 0; if (!testsPass) reasons.push(`test command fails in a clean clone: ${cmd}`);
  }
  sub.tests_pass_in_clean_clone = testsPass; sub.test_cases = tc.cases; sub.test_cases_enough = tc.cases >= ctx.cfg.minTests;
  if (!sub.test_cases_enough) reasons.push(`${tc.cases} executed test cases (need ${ctx.cfg.minTests})`);
  sub.hooks = P.hooks.hooks; sub.hook_exec_bit_ok = P.hooks.execBitOk;
  if (P.hooks.execBitOk === false) reasons.push('an installed hook is not executable');
  const cf = confounded(P, 'E05', name); if (cf) { cf.subflags = { ...sub, ...cf.subflags }; if (cf.status === 'PARTIAL') cf.reasons = [...cf.reasons.slice(0, 1), ...reasons]; return cf; }
  const stack = P.stack; const py = stack === 'python';
  const safe = coChangeSafe(ctx); const withSafe = e => (safe.docEdit ? [e, safe.docEdit] : [e]);
  // paired clean control: the safe doc edit alone (with the same message style) must be accepted, otherwise the block below could be caused by it
  const pair = safe.docEdit ? sbx.attemptCommit([safe.docEdit], 'docs: fx1 safe edit control' + safe.idSuffix) : P.c0;
  sub.safe_edit_alone_accepted = !pair.blocked;
  const plantNew = py ? { path: 'tests/test_fx1_planted.py', write: 'def test_fx1_planted():\n    assert False, "fx1 planted failure"\n' } : { path: 'tests/fx1_planted.test.js', write: "throw new Error('fx1 planted failure');\n" };
  const existing = trackedFiles(sbx.root).find(p => isTestPath(ctx.cfg, p) && /\.(js|mjs|cjs|ts|py)$/.test(p));
  const plantAppend = existing ? { path: existing, append: py ? '\n\ndef test_fx1_planted_append():\n    assert False, "fx1 planted failure"\n' : "\nthrow new Error('fx1 planted failure');\n" } : null;
  const msgT = 'test: fx1 planted failing test' + safe.idSuffix;
  let pT = sbx.probe(withSafe(plantNew), msgT, { scripts: true });
  if (!BLOCKED(pT) && plantAppend) pT = sbx.probe(withSafe(plantAppend), msgT, { scripts: true });
  const src = srcFile(ctx, sbx);
  const pS = src ? sbx.probe(withSafe({ path: src, append: '\n)))((( fx1 planted syntax error\n' }), 'fix: fx1 planted syntax error probe' + safe.idSuffix, { scripts: true }) : null;
  sub.planted_test_blocked_at = pT.blockedAt; sub.planted_syntax_blocked_at = pS ? pS.blockedAt : 'no-source-file';
  sub.blocked_output_names_probe = /fx1/i.test((pT.commit && pT.commit.out || '') + (pT.push && pT.push.out || ''));
  sub.blocked_output_tail = { test: (pT.commit && pT.commit.out || '').slice(-300), syntax: pS ? (pS.commit && pS.commit.out || '').slice(-300) : null };
  const enforced = pT.blockedAt === 'commit' || pT.blockedAt === 'push'; // the failing test must be stopped before it reaches the shared branch; a syntax-only gate does not run the tests
  sub.enforced_at_commit_or_push = enforced;
  sub.clean_commit_accepted = !P.c0.blocked;
  const wf = trackedFiles(sbx.root).filter(p => /^\.github\/workflows\/.+\.ya?ml$/.test(p));
  sub.ci_workflow_present = wf.length > 0; sub.ci_static_runs_tests = wf.some(p => /(npm (run )?test|pytest|go test|node --test|vitest|jest)/.test(read(path.join(sbx.root, p))));
  if (pair.blocked) reasons.push('the doc edit used to keep unrelated gates quiet is itself blocked, so a block below is not attributable');
  if (!enforced) reasons.push('no commit-stage or push-stage gate blocked a planted failing test' + (sub.ci_workflow_present ? ' (a CI workflow exists but cannot be executed here, so it is not credited)' : '') + (pS && pS.blockedAt ? '; a syntax error was blocked, so only a lint-level gate exists' : ''));
  const ok = testsPass && sub.test_cases_enough && enforced && !pair.blocked && !P.c0.blocked && P.hooks.execBitOk !== false;
  sbx.reset();
  return res('E05', name, ok ? 'PASS' : 'PARTIAL', ok ? [] : reasons, { tests: tc, hooks: P.hooks, install: P.install }, sub);
}

// ---------- E06 ratchet ----------
function numericLeaves(obj, prefix = '', out = []) {
  if (typeof obj === 'number') out.push({ key: prefix, value: obj });
  else if (obj && typeof obj === 'object') for (const [k, v] of Object.entries(obj)) numericLeaves(v, prefix ? `${prefix}.${k}` : k, out);
  return out;
}
function setLeaves(obj, fn, prefix = '') {
  if (typeof obj === 'number') return fn(prefix, obj);
  if (Array.isArray(obj)) return obj.map((v, i) => setLeaves(v, fn, `${prefix}.${i}`));
  if (obj && typeof obj === 'object') return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, setLeaves(v, fn, prefix ? `${prefix}.${k}` : k)]));
  return obj;
}
function e06(ctx) {
  const name = 'ratchet floor file exists, a regression is rejected and the floor cannot be lowered'; const cfg = ctx.cfg;
  const f = discover(ctx);
  const cand = f.tracked.filter(p => rx(cfg.ratchetFileNames).test(path.basename(p)) && /\.(json|ya?ml|toml|cfg|txt)$/i.test(p) && !/package-lock|node_modules/.test(p)).sort((a, b) => (/^docs\//.test(b) ? 1 : 0) - (/^docs\//.test(a) ? 1 : 0));
  let file = null, leaves = [];
  for (const p of cand) { const t = tryRead(path.join(ctx.root, p)) || ''; if (/\.json$/i.test(p)) { try { const l = numericLeaves(JSON.parse(t)); if (l.length) { file = p; leaves = l; break; } } catch { /* skip */ } } else { const l = [...t.matchAll(/^\s*([\w.-]+)\s*[:=]\s*(-?\d+(?:\.\d+)?)\s*$/gm)].map(m => ({ key: m[1], value: +m[2] })); if (l.length) { file = p; leaves = l; break; } } }
  if (!file) return res('E06', name, 'ABSENT', ['no tracked file named like ratchet/baseline/floor with a numeric value']);
  const P = prepareProbe(ctx); const cf = confounded(P, 'E06', name); if (cf) return cf;
  const sbx = P.sbx; const lowerKey = k => rx(cfg.lowerIsBetterKeys).test(k);
  const mutate = (dir, kind) => { // dir: 'higher' = higher is better; kind: 'unattainable' | 'lowered'
    const f2 = (k, v, hb) => (kind === 'unattainable' ? (hb ? (v <= 1 ? 2 : 1e9) : -1) : (hb ? 0 : 1e9));
    const hb = k => (dir === 'mixed' ? !lowerKey(k) : dir === 'higher');
    const p = path.join(sbx.root, file); const t = read(p);
    if (/\.json$/i.test(file)) return JSON.stringify(setLeaves(JSON.parse(t), (k, v) => f2(k, v, hb(k))), null, 2) + '\n';
    return t.replace(/^(\s*)([\w.-]+)(\s*[:=]\s*)(-?\d+(?:\.\d+)?)(\s*)$/gm, (m, a, k, c, v, e) => `${a}${k}${c}${f2(k, +v, hb(k))}${e}`);
  };
  let result = null;
  for (const dir of ['mixed', 'higher', 'lower']) { // key-name guess first, then both blanket directions
    const pRaise = sbx.probe([{ path: file, write: mutate(dir, 'unattainable') }], 'chore: fx1 probe unattainable ratchet floor');
    if (!BLOCKED(pRaise)) continue;
    const pLower = sbx.probe([{ path: file, write: mutate(dir, 'lowered') }], 'chore: fx1 probe lower ratchet floor');
    result = { dir, pRaise, pLower, lowered: BLOCKED(pLower) }; break;
  }
  sbx.reset();
  const sub = { floor_file: file, direction_tried: result ? result.dir : 'all', regression_rejected_at: result ? result.pRaise.blockedAt : null, lowering_rejected_at: result ? result.pLower.blockedAt : null, tracked: true };
  if (result && result.lowered) return res('E06', name, 'PASS', [], { floor_file: file, numeric_leaves: leaves.length }, sub);
  return res('E06', name, 'PARTIAL', [result ? 'a regression is rejected but lowering the floor is not: the floor can go down' : 'a floor file exists but making the floor unattainable (in any direction) was not rejected by a commit hook, push hook or passing-baseline script'], { floor_file: file, numeric_leaves: leaves.length }, sub);
}

// ---------- E07 open-questions gate ----------
function e07(ctx) {
  const name = 'open-questions gate fails with an open question'; const cfg = ctx.cfg; const f = discover(ctx);
  const P = prepareProbe(ctx); const cf = confounded(P, 'E07', name); if (cf) return cf;
  const sbx = P.sbx; const spec = f.specFiles[0];
  if (!spec) return res('E07', name, 'ABSENT', ['no spec file to plant an open question in']);
  // form 1: a new trailing section; form 2: a new item inside an existing open-questions section. Each marker is paired with its marker-free twin.
  const secEdit = marker => ({ path: spec, transform: t => { const secs = sections(t); const s = secs.find(x => /(open questions|preguntas abiertas)/i.test(x.title)); if (!s) return t; const lines = t.split('\n'); lines.splice(s.end, 0, `- ${marker ? marker + ' ' : ''}should the planted note block this commit?`); return lines.join('\n'); } });
  const hasOq = sections(read(path.join(sbx.root, spec))).some(x => /(open questions|preguntas abiertas)/i.test(x.title));
  let hit = null, confoundedTwin = false;
  const forms = [['trailing', m => trailing(spec, m)]]; if (hasOq) forms.push(['in-section', secEdit]);
  for (const [formName, mk] of forms) {
    const twin = sbx.probe([mk('')], 'docs: fx1 planted note without a marker');
    if (BLOCKED(twin)) { confoundedTwin = true; continue; }
    for (const m of cfg.openMarkers) {
      const lowerCase = m.toLowerCase();
      for (const variant of [m, lowerCase]) {
        const p = sbx.probe([mk(variant)], 'docs: fx1 planted open question');
        if (BLOCKED(p)) { hit = { marker: variant, form: formName, blockedAt: p.blockedAt }; break; }
      }
      if (hit) break;
    }
    if (hit) break;
  }
  sbx.reset();
  const evidence = f.tracked.filter(p => !/\.md$/i.test(p) && TEXT_EXT.test(p)).filter(p => cfg.openMarkers.some(m => (tryRead(path.join(ctx.root, p)) || '').toLowerCase().includes(m.toLowerCase())) || /open[-_]?questions/i.test(p));
  if (hit) return res('E07', name, 'PASS', [], { marker: hit.marker, form: hit.form }, { blocked_at: hit.blockedAt, enforced_at_commit: hit.blockedAt === 'commit', twin_accepted: true });
  if (confoundedTwin) return res('E07', name, 'PARTIAL', ['the marker-free twin of the planted note is blocked too, so a block would not show an open-questions gate (a gate that rejects all spec edits is not one)'], { evidence }, { confounded_by: 'twin-blocked' });
  return res('E07', name, evidence.length ? 'PARTIAL' : 'ABSENT', [evidence.length ? `a script or hook mentions open questions (${evidence.slice(0, 3).join(', ')}) but a planted marker did not fail it` : 'no gate: a planted open question was not rejected and nothing mentions one'], { evidence }, {});
}

// ---------- E08 criteria coverage ----------
// The id must be cited at a test definition: on the line of a test/it/describe/def test_/func Test line, or within 2 lines of one
// (decorator, docstring, a comment right above). Skipped and todo tests do not count. A distant comment does not count.
function citedByATest(text, id) {
  const idRe = new RegExp(id.replace(/[-.]/g, '[-_.]') + '(?![A-Za-z0-9])', 'i');
  const lines = text.split('\n');
  const isDef = l => /^\s*(?:async\s+)?(?:test|it|describe)(?:\.\w+)?\s*\(|^\s*(?:async\s+)?def\s+test_|^\s*func\s+Test\w*|^\s*(?:async\s+)?function\s+test\w*/.test(l) && !SKIPPED.test(l);
  for (let i = 0; i < lines.length; i++) if (isDef(lines[i])) for (let j = Math.max(0, i - 2); j <= Math.min(lines.length - 1, i + 2); j++) if (idRe.test(lines[j])) return true;
  return false;
}
// (dev loop 2026-10-06, defect C3) The substrate checklist defines item 8 as a COMMAND that prints exactly one line "criteria coverage: N/M"
// (M = criterion ids defined, N = ids cited by at least one test, a test citing an unknown id makes it fail). The command is the one in the
// sentinel's gate table (a table with at least 4 columns, row named coverage). The per-criterion mapping mode below stays as the alternative.
function coverageCommand(ctx) {
  const s = sentinelText(ctx); if (!s) return null;
  for (const line of s.text.split('\n')) {
    if (!/^\s*\|/.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map(c => c.trim());
    if (cells.length >= 4 && /coverage|cobertura/i.test(cells[0]) && !/^(gate|topic)$/i.test(cells[0])) {
      const cmd = cells[1].replace(/^`+|`+$/g, '').trim();
      if (cmd && !/^command$/i.test(cmd) && !/^[-: ]+$/.test(cmd)) return cmd;
    }
  }
  return null;
}
// A criterion id as a test may cite it: comment, test name or python function name. Separators are interchangeable and optional between the letter and the digits.
const citeRe = id => { const parts = id.split(/[-.]/); return new RegExp('(^|[^A-Za-z0-9])' + parts[0] + '[-_.]?' + parts.slice(1).join('[-_.]') + '(?![A-Za-z0-9])', 'i'); };
const bareLines = out => out.trim().split('\n').filter(l => l.trim() && !/^>\s/.test(l)); // npm prints "> pkg@1 script" banner lines: they are not the command's output
function e08Command(ctx, crit) {
  const cmd = coverageCommand(ctx); if (!cmd) return { tried: false };
  const P = prepareProbe(ctx); if (P.undeterminable || !P.ok) return { tried: false };
  const sbx = P.sbx; sbx.reset();
  const parse = out => { const l = bareLines(out); const m = l.length === 1 ? l[0].trim().match(/^criteria coverage: (\d+)\/(\d+)$/) : null; return m ? { n: +m[1], m: +m[2] } : null; };
  // make echoes its recipe lines and npm prints a banner: tool noise, not the command's output
  const quiet = c => c.replace(/^make\b(?!\s+-s)/, 'make -s').replace(/^(npm run \S+)(?!.*--silent)/, '$1 --silent');
  const r = sbx.run(quiet(cmd), ctx.cfg.timeouts.gateMs);
  const base = parse(r.out);
  const ids = [...new Set(crit.map(c => c.id))];
  const testFilesAll = trackedFiles(sbx.root).filter(p => isTestPath(ctx.cfg, p) && /\.(js|mjs|cjs|ts|py)$/.test(p));
  const testText = testFilesAll.map(p => tryRead(path.join(sbx.root, p)) || '').join('\n');
  const citedIds = ids.filter(id => citeRe(id).test(testText));
  const reasons = [];
  if (r.code !== 0) reasons.push(`the coverage command exits ${r.code} on the clean head: ${cmd}`);
  if (!base) reasons.push('the coverage command does not print exactly one line "criteria coverage: N/M"');
  else {
    // M must be the number of criterion ids defined; N cannot exceed the ids that tests cite (a command may legitimately skip fixture folders, so it may be lower)
    if (base.m !== ids.length) reasons.push(`it prints M=${base.m} but ${ids.length} criterion ids are defined`);
    if (base.n > citedIds.length) reasons.push(`it prints N=${base.n} but tests cite only ${citedIds.length} of the ids`);
  }
  // behavioural probes next to the project's own tests (the folder the command scans): an orphan id must fail it; citing a not-yet-cited id must raise N by one
  const nCited = p => { const t = tryRead(path.join(sbx.root, p)) || ''; return ids.filter(id => t.includes(id)).length; };
  const exTest = [...testFilesAll].sort((a, b) => nCited(b) - nCited(a))[0];
  const tdir = exTest ? path.dirname(exTest) : 'tests';
  const py = P.stack === 'python';
  const plant = (fname, id) => py ? { path: `${tdir}/test_fx1_${fname}.py`, write: `# ${id}\ndef test_fx1_${fname}():\n    assert True\n` } : { path: `${tdir}/fx1_${fname}.test.js`, write: `// ${id}\nrequire("node:test")("${id} ${fname}", () => {});\n` };
  sbx.reset(); sbx.apply([plant('orphan', 'F-999.9')]);
  const o = sbx.run(quiet(cmd), ctx.cfg.timeouts.gateMs); sbx.reset();
  if (o.code === 0) reasons.push('a test citing an id the spec does not define (orphan) does not make the coverage command fail');
  let raised = null;
  const uncited = ids.find(id => !citeRe(id).test(testText));
  if (base && uncited) {
    sbx.apply([plant('cover', uncited)]);
    const c = sbx.run(quiet(cmd), ctx.cfg.timeouts.gateMs); sbx.reset();
    const after = parse(c.out); raised = !!(after && after.n === base.n + 1);
    if (!raised) reasons.push(`a test citing ${uncited} does not raise N by one (${base.n} -> ${after ? after.n : 'no output'})`);
  }
  return { tried: true, cmd, ok: reasons.length === 0, reasons, printed: base ? `criteria coverage: ${base.n}/${base.m}` : null, recomputed: `${citedIds.length}/${ids.length}`, orphanFailed: o.code !== 0, raisedByCitation: raised };
}
function e08(ctx) {
  const name = 'criteria coverage: a command reports N/M (or every criterion id has a coverage entry)'; const cfg = ctx.cfg; const f = discover(ctx);
  const crit = ctx.shared.criteria || [];
  if (!crit.length) return res('E08', name, 'ABSENT', ['no criterion ids to cover (E02)'], {}, { depends_on: 'E02' });
  const cm = e08Command(ctx, crit);
  if (cm.tried && cm.ok) return res('E08', name, 'PASS', [], { command: cm.cmd, printed: cm.printed }, { mode: 'command', printed: cm.printed, recomputed: cm.recomputed, orphan_fails: cm.orphanFailed });
  const legacy = e08Mapping(ctx, name, crit, f, cfg);
  if (legacy.status === 'PASS') return legacy;
  if (cm.tried) return res('E08', name, 'PARTIAL', cm.reasons, { command: cm.cmd }, { mode: 'command', printed: cm.printed, recomputed: cm.recomputed, orphan_fails: cm.orphanFailed });
  return legacy;
}
function e08Mapping(ctx, name, crit, f, cfg) {
  const covFiles = f.tracked.filter(p => cfg.coverageFileCandidates.includes(p) || (/^docs\//.test(p) && /coverage|cobertura/i.test(path.basename(p)) && /\.(md|json)$/i.test(p)));
  const mapFiles = [...new Set([...covFiles, ...f.specFiles])];
  const pathTok = /(?:^|[\s`("'|])((?:[\w.-]+\/)*[\w.-]+\.[A-Za-z0-9]{1,5})(?=$|[\s`)"'|,;:#])/g;
  const lineBlocks = [];
  for (const mf of mapFiles) { const lines = (tryRead(path.join(ctx.root, mf)) || '').split('\n'); lines.forEach((l, i) => { let t = l; for (let j = i + 1; j < lines.length && /^[ \t]+\S/.test(lines[j]); j++) t += ' ' + lines[j]; lineBlocks.push({ file: mf, text: t }); }); }
  const covered = [], uncovered = [];
  for (const c of crit) {
    let ok = false;
    for (const b of lineBlocks) {
      if (!new RegExp(`(^|[^\\w-])${c.id.replace(/[.]/g, '\\.')}(?![\\w-])`).test(b.text)) continue;
      for (const m of b.text.matchAll(pathTok)) {
        const hit = resolveRef(ctx.root, b.file, m[1]); if (!hit || f.specFiles.includes(hit) || hit === b.file) continue;
        if (citedByATest(tryRead(path.join(ctx.root, hit)) || '', c.id)) { ok = true; break; }
      }
      if (ok) break;
    }
    (ok ? covered : uncovered).push(c.id);
  }
  const sub = { coverage_files: covFiles, covered: covered.length, total: crit.length };
  if (!covered.length && !covFiles.length) return res('E08', name, 'ABSENT', ['no coverage file and no criterion points at a test that cites its id'], {}, sub);
  const ok = uncovered.length === 0;
  return res('E08', name, ok ? 'PASS' : 'PARTIAL', ok ? [] : [`${uncovered.length} of ${crit.length} criteria have no coverage entry pointing at an existing file that cites the id at an executed test: ${uncovered.slice(0, 8).join(', ')}`], { uncovered }, sub);
}

// ---------- E09 commits ----------
function e09(ctx) {
  const name = 'atomic, descriptive, conventional commits'; const cfg = ctx.cfg; const root = ctx.root;
  const range = ctx.since ? [`${ctx.since}..HEAD`] : [];
  const log = git(root, ['log', '--reverse', '--format=%H%x1f%s', ...range]).stdout.split('\n').filter(Boolean).map(l => { const [h, s] = l.split('\x1f'); return { h, s }; });
  if (!log.length) return res('E09', name, 'ABSENT', ['no commits' + (ctx.since ? ` after ${ctx.since}` : '')]);
  const conv = new RegExp(cfg.conventionalCommit); const ign = new RegExp(cfg.atomicIgnoreFiles);
  const nonConv = log.filter(c => !conv.test(c.s));
  const generic = log.filter(c => cfg.genericSubjects.includes(c.s.trim().toLowerCase()) || c.s.trim().length < 10);
  const big = [];
  log.forEach((c, i) => {
    if (i < cfg.atomicExemptFirstN && !ctx.since) return;
    const ns = git(root, ['show', '--numstat', '--format=', c.h]).stdout.split('\n').filter(Boolean).map(l => l.split('\t')).filter(a => a.length === 3 && !ign.test(a[2]));
    const files = ns.length, added = ns.reduce((s, a) => s + (parseInt(a[0], 10) || 0), 0);
    if (files > cfg.maxFilesPerCommit || added > cfg.maxAddedLinesPerCommit) big.push(`${c.h.slice(0, 7)} (${files} files, ${added} lines)`);
  });
  const allowedNonConv = Math.max(Math.floor(log.length * (1 - cfg.minConventionalShare)), cfg.conventionalLeniencyOne ? 1 : 0);
  const reasons = [];
  if (log.length < cfg.minCommits) reasons.push(`${log.length} commits (need ${cfg.minCommits})`);
  if (nonConv.length > allowedNonConv) reasons.push(`${nonConv.length} of ${log.length} subjects are not conventional (at most ${allowedNonConv} allowed): ${nonConv.slice(0, 3).map(c => JSON.stringify(c.s)).join(', ')}`);
  if (generic.length) reasons.push(`non-descriptive subjects: ${generic.slice(0, 3).map(c => JSON.stringify(c.s)).join(', ')}`);
  if (big.length > Math.max(Math.floor(log.length * (1 - cfg.minConventionalShare)), cfg.conventionalLeniencyOne ? 1 : 0)) reasons.push(`non-atomic commits: ${big.slice(0, 3).join(', ')}`);
  return res('E09', name, reasons.length ? 'PARTIAL' : 'PASS', reasons, { commits: log.length, nonConventional: nonConv.length, big, since: ctx.since || null }, {});
}

// ---------- reference tools (tools/gs-lock/gs-lock.mjs, gs-cochange.mjs) ----------
// When the project carries the reference lock tool, E10 and E11 are verified by running it for real (drift, ratify, refactor proof) in addition
// to the generic probes through the project's own hooks. Without it, the generic probes decide (an ad hoc lock written by a model).
function refTools(root) {
  const tracked = trackedFiles(root);
  return { lock: tracked.find(p => /(^|\/)gs-lock\.mjs$/.test(p)) || null, co: tracked.find(p => /(^|\/)gs-cochange\.mjs$/.test(p)) || null };
}
function matchesReference(root, rel) { // compared with the copy next to this checker (tools/gs-lock), when there is one: informative, never a verdict
  try { const here = path.join(path.dirname(__file), '..', 'gs-lock', path.basename(rel)); return exists(here) ? sha256(read(here)) === sha256(read(path.join(root, rel))) : null; } catch { return null; }
}
const lockSection = (txt, name) => sections(txt).find(x => x.slug === name || ghSlug(x.title) === name || slug(x.title) === name);
const tail = (s, n = 6) => String(s || '').trim().split('\n').filter(l => !/^- /.test(l)).slice(-n).join(' | ').slice(0, 400); // "- UNCOVERED ..." report lines are not failures: noise here

// ---------- E10 spec lock ----------
// Probe design (the dev loop of 2026-10-06 found the old "unlocked edit accepted" probe ill posed): the DRIFT is a sentence written INSIDE a tagged
// heading section; the TWIN is a NEW spec file, which can never be inside a locked section. A tool that rejects every spec edit fails the twin.
function e10(ctx) {
  const name = 'spec lock: tags resolve, the lock file matches and a change to a locked section is detected'; const cfg = ctx.cfg; const f = discover(ctx);
  const tagRe = new RegExp(cfg.lock.tagRegex, 'u') /* (dev loop, defect C13) unicode: a Spanish anchor such as #f-008-ubicación was cut at the accent */;
  const tags = [];
  for (const p of f.tracked.filter(x => TEXT_EXT.test(x) && x !== cfg.lock.file && !/^docs\/(spec|specs|features|decisions)\//.test(x))) {
    (tryRead(path.join(ctx.root, p)) || '').split('\n').forEach((line, i) => { const m = line.match(tagRe); if (m) tags.push({ file: p, line: i + 1, id: m[1], spec: m[2], section: m[3] }); });
  }
  const lockPath = path.join(ctx.root, cfg.lock.file); const hasLock = exists(lockPath);
  if (!tags.length && !hasLock) return res('E10', name, 'ABSENT', ['no @gs tags and no lock file']);
  const reasons = []; const S = new Map(), A = new Map();
  if (hasLock) for (const l of read(lockPath).split('\n')) { const p = l.split(' '); if (p[0] === 'S' && p.length === 3) S.set(p[1], p[2]); else if (p[0] === 'A' && p.length === 5) A.set(`${p[1]}|${p[2]}|${p[3]}`, { target: p[3], hash: p[4] }); }
  else reasons.push('tags exist but there is no lock file');
  const formatKnown = S.size + A.size > 0;
  if (hasLock && !formatKnown) reasons.push('the lock file is not in the registered format (S/A lines); hash agreement cannot be checked, only the behaviour');
  if (!tags.length) reasons.push('lock file exists but no @gs tags');
  const cur = target => { const [sp, sec] = target.split('#'); const t = tryRead(path.join(ctx.root, sp)); if (t == null) return { err: `${sp} missing` }; const s = lockSection(t, sec); if (!s) return { err: `${sp} has no section ${sec}` }; return { hash: sectionHash(s.text, cfg.lock.hashLength) }; };
  for (const t of tags) { const c = cur(`${t.spec}#${t.section}`); if (c.err) reasons.push(`tag ${t.file}:${t.line} ${t.id}: ${c.err}`); else if (hasLock && formatKnown) { const a = A.get(`${t.file}|${t.id}|${t.spec}#${t.section}`); if (!a) reasons.push(`tag ${t.file}:${t.line} ${t.id} has no lock entry`); else if (cfg.lock.verifyHash && a.hash !== c.hash) reasons.push(`stale: ${t.file} ${t.id} derived against ${a.hash}, section is now ${c.hash}`); } }
  if (formatKnown) {
    for (const [k] of A) { const [file, id, target] = k.split('|'); if (!tags.some(t => t.file === file && t.id === id && `${t.spec}#${t.section}` === target)) reasons.push(`lock entry without a tag: ${file} ${id}`); }
    for (const [target, h] of S) { const c = cur(target); if (c.err) reasons.push(`lock section ${target}: ${c.err}`); else if (cfg.lock.verifyHash && c.hash !== h) reasons.push(`lock section ${target} hash ${h} but section hashes to ${c.hash}`); }
  }
  const hardReasons = reasons.filter(r => !/not in the registered format/.test(r));
  if (hardReasons.length) return res('E10', name, 'PARTIAL', reasons.slice(0, 12), { tags: tags.length, lockSections: S.size, lockArtifacts: A.size });
  const P = prepareProbe(ctx); const cf = confounded(P, 'E10', name); if (cf) return cf;
  const sbx = P.sbx; const tool = refTools(sbx.root).lock;
  // a tag whose section is a heading (the layout the formulas write): the drift sentence needs a section to be written inside
  const pick = tags.map(t => { const txt = tryRead(path.join(sbx.root, t.spec)); return { t, ok: txt != null && !!lockSection(txt, t.section) }; }).find(x => x.ok);
  const sub = { lock_format_known: formatKnown, tool: tool || null };
  if (!pick) return res('E10', name, 'PARTIAL', ['no tag points at a heading section of an existing spec file, so a drift cannot be planted inside a locked section'], { tags: tags.length }, sub);
  const t0 = pick.t;
  const drift = { path: t0.spec, transform: txt => { const lines = txt.split('\n'); const s = lockSection(txt, t0.section); lines.splice(s ? s.start + 1 : lines.length, 0, 'Fx1 probe: this sentence changes the locked section.', ''); return lines.join('\n'); } };
  const twinFile = { path: posix(path.join(path.dirname(t0.spec), 'fx1-probe-twin.md')), write: '# Probe twin\n\n## Planted\n\nThis new file is not inside any locked section.\n' };
  const toolReasons = [];
  if (tool) {
    sub.tool_matches_reference = matchesReference(sbx.root, tool);
    const run = args => sbx.run(`node ${tool} ${args}`, ctx.cfg.timeouts.gateMs);
    sbx.reset(); const base = run('check'); sub.tool_check_clean_exit = base.code;
    if (base.code !== 0) toolReasons.push(`the tool's own check fails on the clean clone: ${tail(base.out)}`);
    sbx.reset(); sbx.apply([drift]); const d = run('check'); sub.tool_drift_exit = d.code; sub.tool_drift_names_stale = /STALE/.test(d.out);
    if (d.code === 0 || !sub.tool_drift_names_stale) toolReasons.push(`a sentence written inside the locked section ${t0.spec}#${t0.section} is not reported as STALE by the tool (exit ${d.code}): ${tail(d.out)}`);
    sbx.reset(); sbx.apply([twinFile]); const tw = run('check'); sub.tool_twin_exit = tw.code;
    if (tw.code !== 0) toolReasons.push(`a NEW spec file (outside every locked section) makes the tool fail (a frozen spec is not a lock): ${tail(tw.out)}`);
    // the ratify path: refused without a reason, with one it records and the check passes again; the commit check wants the record
    sbx.reset(); sbx.apply([drift]); const lp = path.join(sbx.root, cfg.lock.file); const before = tryRead(lp);
    const r0 = run('ratify --all'); sub.tool_ratify_without_reason_refused = r0.code !== 0 && tryRead(lp) === before;
    if (!sub.tool_ratify_without_reason_refused) toolReasons.push('ratify without a reason moved a hash or exited 0: the escape path leaves no reason');
    const r1 = run('ratify --all --reason "fx1 probe: ratify the planted sentence"'); const ck = run('check');
    const rat = tryRead(path.join(sbx.root, 'docs/ratifications.md')) || '';
    sub.tool_ratify_clears = r1.code === 0 && ck.code === 0 && /fx1 probe: ratify/.test(rat);
    if (!sub.tool_ratify_clears) toolReasons.push(`ratify with a reason does not leave a current lock and a record (ratify exit ${r1.code}, check exit ${ck.code}): ${tail(r1.out + ck.out)}`);
    git(sbx.root, ['add', '-A']); const cc1 = run('commit-check'); sub.tool_commit_check_accepts_recorded = cc1.code === 0;
    fs.rmSync(path.join(sbx.root, 'docs/ratifications.md'), { force: true }); git(sbx.root, ['add', '-A']); const cc2 = run('commit-check'); sub.tool_commit_check_rejects_unrecorded = cc2.code !== 0;
    if (!sub.tool_commit_check_accepts_recorded || !sub.tool_commit_check_rejects_unrecorded) toolReasons.push(`commit-check does not accept a recorded ratification (${cc1.code}) and refuse an unrecorded one (${cc2.code})`);
    sbx.reset();
  }
  // wiring through the project's own hooks: the same drift, committed, must be stopped; the twin must not
  const stale = sbx.probe([drift], 'docs: fx1 probe change to a locked spec section');
  const twin = sbx.probe([twinFile], 'docs: fx1 probe adds a new unlocked spec file'); // paired control
  sbx.reset();
  Object.assign(sub, { stale_detected_at: stale.blockedAt, unlocked_edit_blocked_at: twin.blockedAt });
  if (toolReasons.length) return res('E10', name, 'PARTIAL', toolReasons, { tags: tags.length, tool }, sub);
  if (BLOCKED(stale) && !BLOCKED(twin)) return res('E10', name, 'PASS', [], { tags: tags.length, tool }, sub);
  return res('E10', name, 'PARTIAL', [BLOCKED(twin) ? 'a new spec file (outside every locked section) is blocked too, so a block on the locked section does not show a lock (a frozen spec is not a lock)' : 'tags and lock agree, but changing a locked section was not stopped by any commit hook' + (ctx.cfg.strictEnforcement ? ' or push hook (strict mode: a failing package script is not credited)' : ', push hook or passing-baseline script')], { tags: tags.length, tool }, sub);
}

// ---------- E11 co-change gate ----------
// Probes: (1) a source change with no citation, no spec change and not a refactor is stopped at the commit-msg stage; a cited one and one that stages a
// doc are accepted; (2) a commit TYPED refactor that breaks the parent's tests (and edits a test in the same commit) is stopped, and a comment-only
// refactor is accepted. The refactor probes run with ONLY the project's commit-msg hook active, so a failing test gate at pre-commit cannot be the cause.
function e11(ctx) {
  const name = 'co-change gate: behaviour change needs a spec citation or doc change, a refactor must pass the parent tests'; const f = discover(ctx);
  const P = prepareProbe(ctx); const cf = confounded(P, 'E11', name, { commitOnly: true }); if (cf) return cf;
  const sbx = P.sbx; const src = srcFile(ctx, sbx);
  if (!src) return res('E11', name, 'ABSENT', ['no source file to change']);
  const edit = { path: src, append: '\n' + commentFor(src, 'fx1 co-change probe') + '\n' };
  const p1 = sbx.attemptCommit([edit], 'feat: fx1 co-change probe without any citation', { raw: true });
  const safe = coChangeSafe(ctx);
  const p2a = safe.idSuffix ? sbx.attemptCommit([edit], `feat: fx1 co-change probe${safe.idSuffix}`, { raw: true }) : null;
  const p2b = safe.docEdit ? sbx.attemptCommit([edit, safe.docEdit], 'feat: fx1 co-change probe with doc change', { raw: true }) : null;
  const sub = { source_only_blocked: p1.blocked, cited_commit_accepted: p2a ? !p2a.blocked : null, with_doc_accepted: p2b ? !p2b.blocked : null };
  const allowsSomething = (p2a && !p2a.blocked) || (p2b && !p2b.blocked);
  if (!p1.blocked || !allowsSomething) {
    sbx.reset();
    const ev = f.tracked.some(p => !/\.md$/i.test(p) && /co-?change|doc-?cascade|cascade/i.test((tryRead(path.join(ctx.root, p)) || '').slice(0, 20000)));
    if (p1.blocked && !allowsSomething) return res('E11', name, 'PARTIAL', ['the gate blocks the source change even with a spec citation or a doc change'], {}, sub);
    return res('E11', name, ev ? 'PARTIAL' : 'ABSENT', [ev ? 'something mentions a cascade or co-change, but a source-only change was not rejected at commit' : 'a source-only change without citation or doc change was accepted and nothing mentions a co-change rule'], {}, sub);
  }
  // the refactor probes
  const reasons = [];
  const cfg = ctx.cfg; const tracked = trackedFiles(sbx.root);
  const brk = /\.py$/.test(src) ? '\nraise RuntimeError("fx1 behaviour change")\n' : /\.(js|mjs|cjs|ts|tsx|jsx)$/.test(src) ? '\nthrow new Error("fx1 behaviour change");\n' : null;
  const testFile = tracked.find(p => isTestPath(cfg, p) && /\.(js|mjs|cjs|ts|py)$/.test(p));
  const clean = [{ path: src, append: '\n' + commentFor(src, 'fx1 refactor probe: a comment only') + '\n' }];
  const breaking = brk ? [{ path: src, append: brk }, ...(testFile ? [{ path: testFile, append: '\n' + commentFor(testFile, 'fx1: a test edited in the same commit') + '\n' }] : [])] : null;
  const iso = sbx.isolateHook('commit-msg'); sub.refactor_probes_isolated_to_commit_msg = !!iso;
  const p4 = sbx.attemptCommit(clean, 'refactor: fx1 comment-only change', { raw: true, hooksPath: iso });
  const p3 = breaking ? sbx.attemptCommit(breaking, 'refactor: fx1 behaviour change disguised as a refactor', { raw: true, hooksPath: iso }) : null;
  sub.refactor_clean_accepted = !p4.blocked; sub.refactor_breaking_blocked = p3 ? p3.blocked : null;
  if (!breaking) sub.refactor_probe = 'not planted: no JavaScript, TypeScript or Python source file';
  else if (!p3.blocked) reasons.push('a commit typed refactor whose source breaks the parent\'s tests (with a test edited in the same commit) is accepted: nothing runs the parent\'s tests unchanged against the new source');
  // with the reference tool, run it directly too: a gate that refuses everything because the proof cannot run (no test command) is not a gate
  const co = refTools(sbx.root).co;
  if (co) {
    sub.tool = co; sub.tool_matches_reference = matchesReference(sbx.root, co);
    const direct = edits => { sbx.reset(); sbx.apply(edits); git(sbx.root, ['add', '-A']); fs.writeFileSync(path.join(sbx.dir, 'fx1-msg.txt'), 'refactor: fx1 direct probe\n'); const r = sbx.run(`node ${co} --msg-file "${posix(path.join(sbx.dir, 'fx1-msg.txt'))}"`, ctx.cfg.timeouts.testMs); sbx.reset(); return r; };
    const d4 = direct(clean); sub.tool_direct_clean_exit = d4.code;
    if (d4.code !== 0) reasons.push(`the tool run directly refuses a comment-only refactor (exit ${d4.code}); the proof may be unable to run the project's tests: ${tail(d4.out)}`);
    if (breaking) { const d3 = direct(breaking); sub.tool_direct_breaking_exit = d3.code; if (d3.code !== 1 || !/NOT A REFACTOR/.test(d3.out)) reasons.push(`the tool run directly does not report NOT A REFACTOR for a breaking refactor (exit ${d3.code}): ${tail(d3.out)}`); }
  } else if (p4.blocked && p3 && p3.blocked) sub.note = 'both refactor probes are blocked: every source change needs a citation (no refactor exemption); the proof itself was not shown to run';
  sbx.reset();
  if (reasons.length) return res('E11', name, 'PARTIAL', reasons, {}, sub);
  return res('E11', name, 'PASS', [], {}, sub);
}

// ---------- E12 README clean-clone steps ----------
// Install-like: dependency installs, hook installers and project setup scripts (all of which a reader runs before the tests).
const KIND = [
  ['install', /^(?:.*install[-_]?hooks.*|.*pre-commit install.*|git config core\.hooksPath.*|.*\b(?:setup|bootstrap)\b.*|npx (?:husky|simple-git-hooks).*|make (?:hooks|setup).*)$|^(npm (i|install|ci)\b|yarn( install)?$|pnpm (i|install)\b|pip3? install|python3? -m pip install|poetry install|uv sync|go mod download|bundle install|cargo fetch)/],
  ['test', /(npm (run )?test\b|npm t\b|node --run test|pytest|go test|cargo test|node --test|vitest|jest|make test|yarn test|pnpm test|npm run (check|verify|validate|ci|all)\b|make (check|verify|ci|all)\b|python3? \S*(check|verify|validate)\S*\.py)/], // (dev loop, defect C4) the "one command that runs every check" counts as the test command
  ['build', /^(npm run build|make( build)?$|go build|cargo build|tsc\b)/]
];
function parseReadme(ctx) {
  const root = ctx.root; const rp = ['README.md', 'readme.md', 'README.rst', 'README'].find(x => exists(path.join(root, x)));
  if (!rp) return null;
  const text = read(path.join(root, rp)); const cfg = ctx.cfg;
  const lines = text.split('\n'); const secs = sections(text); const hint = rx(cfg.readme.headingHint);
  const blocks = []; const seenStarts = new Set();
  secs.forEach((s, idx) => {
    if (!hint.test(s.title)) return;
    // a hinted section includes its nested subsections
    let end = s.end; for (let j = idx + 1; j < secs.length && secs[j].level > s.level && s.level < 7; j++) end = secs[j].end;
    for (const b of fences(lines.slice(s.start, end).join('\n'))) { const key = s.start + ':' + b.start; if (!seenStarts.has(key)) { seenStarts.add(key); b.fresh = /(fresh|clean) clone/i.test(s.title); blocks.push(b); } }
  });
  const use = blocks.length ? blocks : fences(text);
  const cmds = []; const cloneDirs = new Set();
  for (const b of use) {
    if (b.lang && !/^(sh|bash|shell|zsh|console)$/i.test(b.lang)) continue; // text, powershell, cmd, output blocks are not run
    const consoleBlock = /^console$/i.test(b.lang || '') || b.lines.some(l => /^\s*\$\s/.test(l));
    let acc = ''; const pre = [];
    for (const raw of b.lines) {
      if (consoleBlock && !/^\s*\$\s/.test(raw)) continue; // output lines of a console transcript
      const comment = (raw.match(/\s#\s*(.*)$/) || [])[1] || '';
      const l = raw.replace(/^\s*\$\s+/, '').replace(/\s+#.*$/, ''); if (!l.trim() || /^\s*#/.test(raw)) continue;
      if (/\\\s*$/.test(l)) { acc += l.replace(/\\\s*$/, ' '); continue; }
      const cmd = (acc + l).trim(); acc = '';
      // (dev loop 2026-10-06, defect C9) 'git clone <url> kilnlog' then 'cd kilnlog': that folder is the clone, even when the project has a package folder of the same name
      const cl = cmd.match(/^git clone\s+(?:-\S+\s+)*(\S+)(?:\s+(\S+))?\s*$/);
      if (cl) cloneDirs.add((cl[2] || cl[1].replace(/\.git$/, '').split('/').pop()).replace(/\/$/, ''));
      if (/^(export |source |\. |cd )/.test(cmd)) { // state-setting lines carry over to the next commands of the block
        if (/^cd\s/.test(cmd) && (cloneDirs.has(cmd.replace(/^cd\s+/, '').trim().replace(/\/$/, '')) || !exists(path.join(root, cmd.replace(/^cd\s+/, '').trim())))) { cmds.push({ cmd, kind: 'skipped', why: 'cd into the clone folder', pre: '' }); continue; }
        pre.push(cmd); continue;
      }
      const prefix = pre.length ? pre.join(' && ') + ' && ' : '';
      if (/<[^>]+>|YOUR_|your-|\[[^\]]*\]$/.test(cmd)) { cmds.push({ cmd, kind: 'skipped', why: 'placeholder', pre: prefix }); continue; }
      if (/^git clone\b/.test(cmd)) { cmds.push({ cmd, kind: 'skipped', why: 'clone', pre: prefix }); continue; }
      if (/(exit(s|ed)?( with)?( code)?\s*[1-9]|\bfails?\b|\berror\b|non-zero)/i.test(comment)) { cmds.push({ cmd, kind: 'skipped', why: 'documented failure', pre: prefix }); continue; }
      const kind = (KIND.find(([, re]) => re.test(cmd)) || ['run'])[0];
      cmds.push({ cmd, kind, pre: prefix, fresh: !!b.fresh });
    }
  }
  // (dev loop, defect C10) the formulas end the Fresh clone block with "the one command that runs every check": it is the test command whatever its name
  if (!cmds.some(c => c.kind === "test")) { const last = [...cmds].reverse().find(c => c.fresh && c.kind === "run"); if (last) last.kind = "test"; }
  return { path: rp, commands: cmds };
}
function declaresDependencies(root) {
  const pj = tryRead(path.join(root, 'package.json'));
  if (pj) { try { const j = JSON.parse(pj); if (Object.keys(j.dependencies || {}).length || Object.keys(j.devDependencies || {}).length) return true; } catch { /* ignore */ } }
  const rq = tryRead(path.join(root, 'requirements.txt')); if (rq && rq.split('\n').some(l => l.trim() && !l.trim().startsWith('#'))) return true;
  const py = tryRead(path.join(root, 'pyproject.toml')); if (py && /dependencies\s*=/.test(py)) return true;
  return false;
}
function e12(ctx) {
  const name = 'README clean-clone steps actually work'; const cfg = ctx.cfg;
  const rd = ctx.shared.readme;
  if (!rd) return res('E12', name, 'ABSENT', ['no README']);
  const runnable = rd.commands.filter(c => c.kind !== 'skipped');
  if (!runnable.length) return res('E12', name, 'ABSENT', ['README has no runnable command block'], { skipped: rd.commands });
  const { Sandbox } = require('./sandbox'); const sbx = new Sandbox(ctx.repo, cfg, 'readme'); ctx.sandboxes.push(sbx);
  const c = sbx.clone(); if (!c.ok) return res('E12', name, 'UNDETERMINABLE', ['clone failed']);
  const results = []; const reasons = [];
  for (const k of runnable) {
    const isRun = k.kind === 'run';
    const r = isRun ? sbx.runSmoke(k.pre + k.cmd, cfg.timeouts.serveSmokeMs) : sbx.run(k.pre + k.cmd, k.kind === 'test' ? cfg.timeouts.testMs : cfg.timeouts.installMs);
    const ok = r.code === 0 || (isRun && r.timedOut);
    results.push({ cmd: k.cmd, kind: k.kind, ok, code: r.code, timedOut: r.timedOut, tail: r.out.slice(-300) });
    if (!ok) {
      if (!isRun && r.timedOut) return res('E12', name, 'UNDETERMINABLE', [`timed out: ${k.cmd}`], { results });
      if (sbx.isNetworkFailure(r.out)) return res('E12', name, 'UNDETERMINABLE', [`network failure: ${k.cmd}`], { results });
      reasons.push(`fails in a clean clone: ${k.cmd} (exit ${r.code})`);
      if (k.kind === 'install') break;
    }
  }
  const kinds = new Set(runnable.map(k => k.kind));
  const needInstall = !cfg.readme.installOnlyIfDependencies || declaresDependencies(sbx.root);
  for (const need of cfg.readme.mustContain) { if (need === 'install' && !needInstall) continue; if (!kinds.has(need)) reasons.push(`README has no ${need} command`); }
  return res('E12', name, reasons.length ? 'PARTIAL' : 'PASS', reasons, { results, skipped: rd.commands.filter(c => c.kind === 'skipped') }, { install_required: needInstall });
}

// E12 runs last: it smoke-starts long-running commands and must not leave state for the probes.
const ORDER = [['E01', e01], ['E02', e02], ['E03', e03], ['E04', e04], ['E05', e05], ['E06', e06], ['E07', e07], ['E08', e08], ['E09', e09], ['E10', e10], ['E11', e11], ['E12', e12]];
function prepare(ctx) { ctx.shared.readme = parseReadme(ctx); }
module.exports = { ORDER, prepare, discover, parseSpecDefs, countTests, citedByATest, installCommands, detectStack };

};

__defs["./migration"] = (module, exports, require) => {
'use strict';
// Migration checks M01 to M09 (run with --migration). A migration is: existing code becomes a recovered spec plus a characterization suite, and the
// project becomes a greenfield substrate built from that spec, with the observable behavior preserved. Deterministic: no model, no network.
//   M01 manifest and suite present      M02 suite passes on the ORIGINAL (and refuses an empty system)   M03 suite passes on the current code
//   M04 the suite is an oracle (mutation probe on both trees)   M05 every characterization test cites a criterion of the recovered spec
//   M06 every criterion is cited by a characterization test or deferred   M07 inventory decisions are complete and consistent
//   M08 the original's public surface (extracted by heuristics, independent of the model) is in the inventory   M09 the deferred list exists and explains each drop
// Convention (stated by the migrate formula): the suite is black-box. It runs the system through GS_SUT_CMD from the directory GS_SUT_ROOT and never
// imports its source, so the SAME suite can be run against the original (a checkout of BASE) and against the current code.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { sh, git, exists, read, tryRead, posix, trackedFiles, sha256 } = require('./util');
const { discover, parseSpecDefs, installCommands } = require('./items');

const res = (id, name, status, reasons = [], evidence = {}, subflags = {}) => ({ id, name, status, reasons, evidence, subflags });
const NAMES = {
  M01: 'equivalence manifest, base commit and characterization suite present',
  M02: 'the suite passes on the ORIGINAL code and refuses an empty system',
  M03: 'the suite passes on the current (migrated) code',
  M04: 'the suite is an oracle: planted behavior changes are refused (mutation probe on both trees)',
  M05: 'every characterization test cites a criterion of the recovered spec',
  M06: 'every criterion of the recovered spec is cited by a characterization test or deferred',
  M07: 'inventory: every element has a decision, kept elements map to criteria, nothing UNCLAIMED is kept',
  M08: 'the public surface found in the original code is in the inventory (heuristic cross-check)',
  M09: 'deferred list exists and explains every dropped, deferred or changed element',
  M10: 'intended changes (new features, changed behaviors) are accounted for and tested outside the characterization suite'
};
const TEST_DECL = /^\s*(?:(?:async\s+)?def\s+test_\w*|(?:test|it)(?:\.\w+)?\s*\(|func\s+Test\w+)/;
const SKIP_DECL = /^\s*(?:test|it)\.(?:todo|skip)\s*\(|^\s*x(?:it|test)\s*\(|@pytest\.mark\.skip|\.skip\(/;
const isTestLike = (cfg, p) => new RegExp(cfg.testFilePattern).test(p) || cfg.testDirs.some(d => p === d || p.startsWith(d + '/')) || /(^|\/)(tests?|__tests__|spec|specs)\//.test(p);

function charFiles(ctx) {
  const re = new RegExp(ctx.cfg.migration.charPattern, 'i');
  return trackedFiles(ctx.root).filter(p => re.test(p) && /\.(js|mjs|cjs|ts|tsx|py|go|sh)$/.test(p));
}
// one segment per declared (non-skipped) test: from its declaration line to the next declaration
function charTests(ctx, files) {
  const out = [];
  for (const f of files) {
    const lines = (tryRead(path.join(ctx.root, f)) || '').split('\n'); let cur = null;
    lines.forEach((l, i) => {
      if (TEST_DECL.test(l)) {
        if (cur) out.push(cur);
        const nm = (l.match(/['"`]([^'"`]+)['"`]/) || l.match(/def\s+(test_\w+)/) || [])[1] || l.trim().slice(0, 50);
        cur = { file: f, line: i + 1, name: nm, skipped: SKIP_DECL.test(l) || (i > 0 && /@pytest\.mark\.skip/.test(lines[i - 1])), text: l };
      } else if (cur) cur.text += '\n' + l;
    });
    if (cur) out.push(cur);
  }
  return out.filter(t => !t.skipped);
}
// (dev loop 2, defect C15) a Python function name cannot hold F-001.2: test_F_001_2_... cites it. Criterion ids are also recognised with _ for - and .
const citedCrit = (critIds, text) => { const out = new Set(); for (const id of critIds) { const m = id.match(/^([A-Z][A-Z0-9]*)-(\d+)\.(\d+)$/); if (m && new RegExp('(^|[^A-Za-z0-9])' + m[1] + '[-_]' + m[2] + '[-_.]' + m[3] + '(?![0-9])').test(text)) out.add(id); else if (!m && text.includes(id)) out.add(id); } return out; };
const unknownCrit = (critIds, text) => { const pre = new Set([...critIds].map(c => c.split('-')[0])); const out = []; for (const p of pre) for (const m of text.matchAll(new RegExp('(?:^|[^A-Za-z0-9])' + p + '[-_](\\d{1,4})(?:[-_.](\\d{1,3}))?(?![0-9])', 'g'))) { const id = p + '-' + m[1] + (m[2] ? '.' + m[2] : ''); if (!critIds.has(id) && ![...critIds].some(c => c.startsWith(id + '.'))) out.push(id); } return out; };
const idsIn = (cfg, text) => [...new Set([...text.matchAll(new RegExp(cfg.idToken, 'g'))].map(m => m[0]))];

function loadManifest(ctx) {
  const p = path.join(ctx.root, ctx.cfg.migration.manifest); const t = tryRead(p);
  if (t == null) return { missing: true };
  let m; try { m = JSON.parse(t); } catch (e) { return { err: 'not valid JSON: ' + e.message }; }
  const errs = [];
  if (!m || typeof m.base !== 'string' || !m.base) errs.push('"base" (the commit of the original code) is missing');
  if (!m || typeof m.suite !== 'string' || !m.suite) errs.push('"suite" (the one command that runs the characterization suite) is missing');
  for (const k of ['original', 'current']) if (!m || !m[k] || typeof m[k].cmd !== 'string' || !m[k].cmd) errs.push(`"${k}.cmd" (how to start or invoke the system) is missing`);
  return errs.length ? { err: errs.join('; '), m } : { m };
}

// ---------- the surface of the original code, extracted by heuristics (independent of the model) ----------
function surfaceTokens(texts) {
  const T = new Map(); const add = (k, v) => { if (v && v.length > 1 && !/^(--?)?(help|h|v)$/.test(v)) T.set(v, k); };
  for (const text of texts) {
    for (const m of text.matchAll(/\b(?:app|router|server|api|route|routes|r)\.(?:get|post|put|patch|delete|all)\s*\(\s*(['"`])(\/[^'"`]*)\1/g)) add('route', m[2]);
    for (const m of text.matchAll(/@\w+\.(?:route|get|post|put|delete|patch)\(\s*['"]([^'"]+)['"]/g)) add('route', m[1]);
    for (const m of text.matchAll(/\b(?:url|pathname|path|route|req\.url)\s*(?:===?|\.startsWith\(|\.includes\(|\.match\()\s*\(?\s*['"`](\/[^'"`]*)['"`]/g)) add('route', m[1]);
    for (const m of text.matchAll(/case\s+['"`](\/[^'"`]*)['"`]\s*:/g)) add('route', m[1]);
    for (const m of text.matchAll(/add_parser\(\s*['"]([\w-]+)['"]/g)) add('command', m[1]);
    for (const m of text.matchAll(/\.command\(\s*['"]([\w-]+)/g)) add('command', m[1]);
    for (const m of text.matchAll(/add_argument\(\s*['"](--?[\w-]+)['"](?:\s*,\s*['"](--?[\w-]+)['"])?/g)) { add('flag', m[1]); add('flag', m[2]); }
    for (const m of text.matchAll(/\b(?:cmd|command|action|sub|subcmd|subcommand|verb|op|mode)\b\s*(?:===?|!==?)\s*['"]([\w-]+)['"]/g)) add('command', m[1]);
    for (const m of text.matchAll(/argv\[\d+\]\s*(?:===?|==)\s*['"]([^'"]+)['"]/g)) add('command', m[1]);
    for (const m of text.matchAll(/case\s+['"]([\w-]+)['"]\s*:/g)) add('command', m[1]);
    for (const m of text.matchAll(/['"](--[a-z][\w-]*)['"]/g)) add('flag', m[1]);
    for (const m of text.matchAll(/process\.env\.([A-Z][A-Z0-9_]+)|process\.env\[['"]([A-Z][A-Z0-9_]+)['"]\]|os\.environ(?:\.get)?[\[(]\s*['"]([A-Z][A-Z0-9_]+)['"]|os\.getenv\(\s*['"]([A-Z][A-Z0-9_]+)['"]/g)) add('env', m[1] || m[2] || m[3] || m[4]);
  }
  return T;
}

// ---------- mutation probe ----------
const OPS = [
  [/===/g, '!=='], [/!==/g, '==='], [/(?<![=!<>])==(?![=])/g, '!='], [/!=(?![=])/g, '=='],
  [/<=/g, '<'], [/>=/g, '>'], [/ < /g, ' <= '], [/ > /g, ' >= '],
  [/&&/g, '||'], [/\|\|/g, '&&'], [/ and /g, ' or '], [/ or /g, ' and '],
  [/\btrue\b/g, 'false'], [/\bfalse\b/g, 'true'], [/\bTrue\b/g, 'False'], [/\bFalse\b/g, 'True'],
  [/ \+ /g, ' - '], [/ - /g, ' + '],
  [/(?<![\w.$"'#-])(\d+)(?![\w.]|\s*[:"'])/g, null] // integer literal: n -> n + 1
];
function inString(line, idx) { let q = null; for (let i = 0; i < idx; i++) { const c = line[i]; if (q) { if (c === '\\') i++; else if (c === q) q = null; } else if (c === '"' || c === "'" || c === '`') q = c; } return q !== null; }
function mutantSites(root, files) {
  const sites = [];
  for (const f of files) {
    const lines = (tryRead(path.join(root, f)) || '').split('\n');
    lines.forEach((line, i) => {
      if (/^\s*(\/\/|#|\*|\/\*|"""|''')/.test(line) || /^\s*(import|from|const\s+\{?[\w\s,]+\}?\s*=\s*require|require)\b/.test(line) || /\b(port|PORT|listen|console\.|print\(|logging|version)\b/.test(line)) return;
      for (const [re, to] of OPS) {
        re.lastIndex = 0; let m;
        while ((m = re.exec(line))) {
          if (m[0].length === 0) { re.lastIndex++; continue; }
          if (inString(line, m.index)) continue;
          const rep = to === null ? String(Number(m[1]) + 1) : to;
          sites.push({ file: f, line: i + 1, col: m.index, from: m[0], to: rep, key: sha256(`${f}:${i}:${m.index}:${m[0]}`).slice(0, 10) });
        }
      }
    });
  }
  return sites.sort((a, b) => a.key.localeCompare(b.key));
}
function syntaxOk(file, abs) {
  if (/\.(js|mjs|cjs)$/.test(file)) return sh(`node --check "${abs}"`, { timeout: 20000 }).code === 0;
  if (/\.py$/.test(file)) { const r = sh(`python3 -c "import ast,sys; ast.parse(open(sys.argv[1]).read())" "${abs}" || python -c "import ast,sys; ast.parse(open(sys.argv[1]).read())" "${abs}"`, { timeout: 20000 }); return r.code === 0; }
  return true;
}
function copyTree(src, dst) {
  fs.cpSync(src, dst, { recursive: true, filter: p => !/[\\/]\.git$/.test(p) && !/[\\/]node_modules$/.test(p) });
  const nm = path.join(src, 'node_modules'); if (exists(nm)) { try { fs.symlinkSync(nm, path.join(dst, 'node_modules'), 'junction'); } catch { /* best effort */ } }
}
function mutationProbe(ctx, label, srcRoot, files, runSuite, tmp) {
  const cfgM = ctx.cfg.migration.mutation; const sites = mutantSites(srcRoot, files);
  const out = { label, sites: sites.length, tried: 0, killed: 0, invalid: 0, survivors: [] };
  if (!sites.length) return out;
  const copy = path.join(tmp, 'mut-' + label); copyTree(srcRoot, copy);
  const perFile = {}; let guard = 0; const cap = new Set(sites.map(x => x.file)).size > 1 ? Math.ceil(cfgM.count / 2) : cfgM.count;
  for (const s of sites) {
    if (out.tried >= cfgM.count || guard++ > cfgM.count * 4) break;
    if ((perFile[s.file] || 0) >= cap) continue;
    const abs = path.join(copy, s.file); const orig = fs.readFileSync(abs, 'utf8');
    const lines = orig.split('\n'); const ln = lines[s.line - 1];
    if (ln.slice(s.col, s.col + s.from.length) !== s.from) continue;
    lines[s.line - 1] = ln.slice(0, s.col) + s.to + ln.slice(s.col + s.from.length);
    fs.writeFileSync(abs, lines.join('\n'));
    if (!syntaxOk(s.file, abs)) { out.invalid++; fs.writeFileSync(abs, orig); continue; }
    perFile[s.file] = (perFile[s.file] || 0) + 1; out.tried++;
    const r = runSuite(copy);
    if (r.code !== 0) out.killed++; else out.survivors.push(`${s.file}:${s.line} ${JSON.stringify(s.from.trim())} to ${JSON.stringify(s.to.trim())}`);
    fs.writeFileSync(abs, orig);
  }
  fs.rmSync(copy, { recursive: true, force: true });
  return out;
}

// ---------- inventory ----------
function parseInventory(text) {
  const lines = text.split('\n'); let hdr = null; const rows = [];
  for (const l of lines) {
    if (!/^\s*\|/.test(l)) { if (hdr && rows.length) break; continue; }
    const cells = l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
    if (cells.every(c => /^:?-{2,}:?$/.test(c))) continue;
    if (!hdr) { const low = cells.map(c => c.toLowerCase()); if (low.some(c => c.startsWith('element')) && low.some(c => c.includes('decision'))) hdr = low; continue; }
    rows.push(cells);
  }
  if (!hdr) return null;
  const col = pred => hdr.findIndex(pred);
  return { rows, iEl: col(c => c.startsWith('element')), iCl: col(c => c.includes('claimed')), iDec: col(c => c.includes('decision')), iWhy: col(c => /reason|why|razón/.test(c)) };
}
const decisionOf = c => { const w = (c || '').toLowerCase().replace(/[`*_]/g, '').trim(); return /^(keep|kept)\b/.test(w) ? 'keep' : /^(drop|dropped)\b/.test(w) ? 'drop' : /^(defer|deferred)\b/.test(w) ? 'defer' : /^(change|changed)\b/.test(w) ? 'change' : null; };
const clean = s => (s || '').replace(/[`*_|]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

function run(ctx, { mutants = null } = {}) {
  const cfg = ctx.cfg; const M = cfg.migration; if (mutants != null) M.mutation.count = mutants;
  const items = []; const push = r => { items.push(r); return r; };
  const f = discover(ctx);
  const defs = parseSpecDefs(ctx); const crit = defs.filter(d => d.kind === 'criterion'); const critIds = new Set(crit.map(c => c.id));
  const files = charFiles(ctx); const tests = charTests(ctx, files);
  const mf = loadManifest(ctx);
  // ---- M01 ----
  {
    const r = [];
    if (mf.missing) push(res('M01', NAMES.M01, 'ABSENT', [`no ${M.manifest}`]));
    else {
      if (mf.err) r.push(mf.err);
      if (mf.m && mf.m.base) {
        const c = git(ctx.root, ['cat-file', '-e', mf.m.base + '^{commit}']);
        if (c.code !== 0) r.push(`base ${mf.m.base} is not a commit of this repository`);
        else {
          if (git(ctx.root, ['merge-base', '--is-ancestor', mf.m.base, 'HEAD']).code !== 0) r.push('base is not an ancestor of HEAD');
          if (git(ctx.root, ['rev-parse', mf.m.base + '^{commit}']).stdout.trim() === git(ctx.root, ['rev-parse', 'HEAD']).stdout.trim()) r.push('base equals HEAD: nothing was migrated');
        }
      }
      if (!files.length) r.push('no characterization test files (a tracked source or test file with "characterization" in its path)');
      else if (tests.length < M.minCharTests) r.push(`${tests.length} characterization tests (need ${M.minCharTests})`);
      // black-box: the suite must not import the system's source
      const trk = trackedFiles(ctx.root);
      const topMods = new Set(trackedFiles(ctx.root).filter(p => /\.py$/.test(p) && !isTestLike(cfg, p)).map(p => p.split('/')[0].replace(/\.py$/, '')));
      const imports = [];
      for (const fl of files) {
        const lines = (tryRead(path.join(ctx.root, fl)) || '').split('\n');
        lines.forEach(l => {
          const rel = (l.match(/(?:require\(|from\s+|import\s+(?:[\w*{}\s,]+\s+from\s+)?)['"](\.{1,2}\/[^'"]+)['"]/) || [])[1];
          if (rel) { const base = posix(path.normalize(path.join(path.dirname(fl), rel))); const hit = [base, base + '.js', base + '.mjs', base + '.ts', base + '/index.js'].find(x => trk.includes(x)); if (hit && !isTestLike(cfg, hit)) imports.push(`${fl} imports ${hit}`); }
          const py = (l.match(/^\s*(?:from|import)\s+([A-Za-z_]\w*)/) || [])[1]; if (py && topMods.has(py) && !/^(tests?|conftest)$/.test(py)) imports.push(`${fl} imports ${py}`);
        });
      }
      if (imports.length) r.push(`the suite is not black-box (it imports the system's source): ${[...new Set(imports)].slice(0, 3).join('; ')}`);
      push(res('M01', NAMES.M01, r.length ? 'PARTIAL' : 'PASS', r, { base: mf.m && mf.m.base, charFiles: files, charTests: tests.length }, {}));
    }
  }
  const usable = !mf.missing && !mf.err && items[0].status !== 'ABSENT';
  // ---- dynamic part: M02 M03 M04 ----
  const dyn = {};
  if (!usable || (items[0].status !== 'PASS' && !files.length)) {
    for (const id of ['M02', 'M03', 'M04']) push(res(id, NAMES[id], 'ABSENT', ['not run: no usable manifest or no characterization suite']));
  } else {
    const { Sandbox } = require('./sandbox'); const sbx = new Sandbox(ctx.repo, cfg, 'mig'); ctx.sandboxes.push(sbx);
    const c = sbx.clone();
    if (!c.ok) for (const id of ['M02', 'M03', 'M04']) push(res(id, NAMES[id], 'UNDETERMINABLE', ['clone failed']));
    else {
      const m = mf.m; const tmp = sbx.dir;
      const ic = installCommands(ctx, sbx); const cmds = ic.fromReadme.length ? ic.fromReadme : ic.dflt;
      for (const cmd of cmds) { const r0 = sbx.run(cmd, cfg.timeouts.installMs); if (r0.code !== 0) break; }
      if (m.current && m.current.setup) sbx.run(m.current.setup, cfg.timeouts.installMs);
      const orig = path.join(tmp, 'orig'); const wt = git(sbx.root, ['worktree', 'add', '--detach', '-q', orig, m.base]);
      if (wt.code !== 0) for (const id of ['M02', 'M03', 'M04']) push(res(id, NAMES[id], 'UNDETERMINABLE', ['cannot check out the base commit: ' + wt.out.slice(0, 200)]));
      else {
        if (m.original && m.original.setup) sbx.run(`cd "${orig}" && ${m.original.setup}`, cfg.timeouts.installMs);
        const suite = (root, cmd, ms) => sh(m.suite, { cwd: sbx.root, timeout: ms || cfg.timeouts.testMs, env: { GS_SUT_ROOT: root, GS_SUT_CMD: cmd } });
        const tail = o => o.trim().split('\n').slice(-4).join(' | ').slice(0, 300);
        // M02
        const r2 = [], s2 = suite(orig, m.original.cmd);
        if (s2.timedOut) r2.push('the suite timed out on the original'); else if (s2.code !== 0) r2.push(`the suite FAILS on the original code (exit ${s2.code}): ${tail(s2.out)}`);
        const empty = path.join(tmp, 'empty'); fs.mkdirSync(empty, { recursive: true });
        const se = suite(empty, m.original.cmd, 120000);
        if (se.code === 0) r2.push('the suite passes against an EMPTY system: it does not run the system under test through GS_SUT_ROOT and GS_SUT_CMD, or asserts nothing');
        dyn.origPass = s2.code === 0; dyn.empty = se.code;
        push(res('M02', NAMES.M02, r2.length ? 'PARTIAL' : 'PASS', r2, { exit_original: s2.code, exit_empty: se.code }, {}));
        // M03
        const s3 = suite(sbx.root, m.current.cmd);
        dyn.curPass = s3.code === 0;
        push(res('M03', NAMES.M03, s3.timedOut ? 'UNDETERMINABLE' : s3.code === 0 ? 'PASS' : 'PARTIAL', s3.code === 0 ? [] : [`the suite FAILS on the migrated code (exit ${s3.code}): ${tail(s3.out)}`], { exit_current: s3.code }, {}));
        // M04
        const srcOf = (root, list) => list.filter(p => M.sourceExt.includes(p.split('.').pop()) && !isTestLike(cfg, p) && !/(^|\/)(node_modules|scripts|tools|docs|bin\/hooks|\.githooks|\.github|build|dist)\//.test(p) && !new RegExp(cfg.sourceExcludePattern).test(p) && !/characteri[sz]ation/i.test(p));
        const origFiles = srcOf(orig, git(sbx.root, ['ls-tree', '-r', '--name-only', m.base]).stdout.split('\n').filter(Boolean));
        const curFiles = srcOf(sbx.root, trackedFiles(sbx.root));
        const r4 = []; const ev = {};
        const probe = (label, root, list, cmd, pass) => {
          if (!pass) { r4.push(`${label}: not run, the suite is red on this tree`); return; }
          const o = mutationProbe(ctx, label, root, list, copy => suite(copy, cmd, M.mutation.runMs), tmp); ev[label] = { sites: o.sites, tried: o.tried, killed: o.killed, invalid: o.invalid, survivors: o.survivors.slice(0, 8) };
          if (!o.tried) r4.push(`${label}: no mutable site found in ${list.length} source files, so the suite's sensitivity could not be judged`);
          else if (o.killed / o.tried < M.mutation.minKill) r4.push(`${label}: the suite refused ${o.killed} of ${o.tried} planted behavior changes (need ${Math.round(M.mutation.minKill * 100)}%); not refused: ${o.survivors.slice(0, 4).join('; ')}`);
        };
        probe('original', orig, origFiles, m.original.cmd, dyn.origPass);
        probe('current', sbx.root, curFiles, m.current.cmd, dyn.curPass);
        dyn.mutation = ev;
        push(res('M04', NAMES.M04, r4.length ? 'PARTIAL' : 'PASS', r4, ev, {}));
        // surface of the original, for M08
        dyn.surface = surfaceTokens(origFiles.map(p => tryRead(path.join(orig, p)) || ''));
        git(sbx.root, ['worktree', 'remove', '--force', orig]);
      }
    }
  }
  // ---- static: M05 M06 ----
  const touched = new Set();
  {
    const r = []; const unknown = new Set();
    for (const t of tests) {
      const hit = [...citedCrit(critIds, t.text)];
      unknownCrit(critIds, t.text).forEach(i => unknown.add(i));
      if (!hit.length) r.push(`${t.file}:${t.line} "${t.name.slice(0, 50)}" cites no criterion of the spec`); else hit.forEach(i => touched.add(i));
    }
    if (unknown.size) r.push(`tests cite ids the spec does not define: ${[...unknown].slice(0, 6).join(', ')}`);
    push(res('M05', NAMES.M05, !tests.length ? 'ABSENT' : r.length ? 'PARTIAL' : 'PASS', !tests.length ? ['no characterization tests'] : r.slice(0, 8), { tests: tests.length, citedCriteria: touched.size }, {}));
  }
  // inventory and deferred (shared by M06 to M09)
  const invText = tryRead(path.join(ctx.root, M.inventory)); const inv = invText ? parseInventory(invText) : null;
  const defText = tryRead(path.join(ctx.root, M.deferred));
  const rows = inv ? inv.rows.map(c => ({ el: c[inv.iEl] || '', claimed: inv.iCl >= 0 ? c[inv.iCl] || '' : '', dec: decisionOf(inv.iDec >= 0 ? c[inv.iDec] : ''), rawDec: inv.iDec >= 0 ? c[inv.iDec] || '' : '', why: inv.iWhy >= 0 ? c[inv.iWhy] || '' : '' })).filter(r => r.el.trim()) : [];
  const droppedClaims = new Set(); rows.filter(r => r.dec === 'drop' || r.dec === 'defer' || r.dec === 'change').forEach(r => idsIn(cfg, r.claimed).forEach(i => droppedClaims.add(i)));
  const changeClaims = new Set(); rows.filter(r => r.dec === 'change').forEach(r => idsIn(cfg, r.claimed).forEach(i => changeClaims.add(i)));
  const isNew = c => /\[new\]/i.test(c.text || '');
  {
    const r = [];
    for (const c of crit) {
      if (/^N-/.test(c.id)) continue;
      if (touched.has(c.id) || droppedClaims.has(c.id) || isNew(c) || (defText && defText.includes(c.id))) continue;
      r.push(c.id);
    }
    push(res('M06', NAMES.M06, !crit.length ? 'ABSENT' : r.length ? 'PARTIAL' : 'PASS', !crit.length ? ['no criteria in the spec'] : r.length ? [`criteria no characterization test cites (and not deferred): ${r.slice(0, 10).join(', ')}`] : [], { criteria: crit.length }, {}));
  }
  {
    const r = [];
    if (!invText) push(res('M07', NAMES.M07, 'ABSENT', [`no ${M.inventory}`]));
    else if (!inv || !rows.length) push(res('M07', NAMES.M07, 'ABSENT', ['no inventory table with columns element and decision']));
    else {
      for (const w of rows) {
        const label = clean(w.el).slice(0, 40);
        if (!w.dec) { r.push(`"${label}": decision "${w.rawDec.slice(0, 20)}" is none of keep, drop, defer, change`); continue; }
        const ids = idsIn(cfg, w.claimed); const unclaimed = /unclaimed/i.test(w.claimed) || !ids.length;
        if (w.dec === 'keep') {
          if (unclaimed) r.push(`"${label}" is kept but UNCLAIMED (no criterion)`);
          else for (const i of ids) { if (!critIds.has(i)) r.push(`"${label}" claims ${i}, which the spec does not define`); else if (!touched.has(i)) r.push(`"${label}" is kept but no characterization test cites ${i}`); }
        } else {
          if (w.dec === 'change') { if (unclaimed) r.push(`"${label}" is changed but names no new criterion`); else for (const i of ids) if (!critIds.has(i)) r.push(`"${label}" is changed and claims ${i}, which the spec does not define`); }
          const why = w.why.trim() || w.rawDec.replace(/^\W*(drop(ped)?|defer(red)?|change[d]?)\W*/i, '').trim();
          if (why.split(/\s+/).filter(Boolean).length < 2) r.push(`"${label}" is ${w.dec === 'drop' ? 'dropped' : w.dec === 'change' ? 'changed' : 'deferred'} without a reason`);
        }
      }
      push(res('M07', NAMES.M07, r.length ? 'PARTIAL' : 'PASS', r.slice(0, 10), { rows: rows.length, keep: rows.filter(x => x.dec === 'keep').length, drop: rows.filter(x => x.dec === 'drop').length, defer: rows.filter(x => x.dec === 'defer').length, change: rows.filter(x => x.dec === 'change').length }, {}));
    }
  }
  // ---- M08 ----
  {
    if (!dyn.surface) push(res('M08', NAMES.M08, usable ? 'UNDETERMINABLE' : 'ABSENT', [usable ? 'the original code could not be examined' : 'not run: no usable manifest, so the original code is unknown']));
    else if (!dyn.surface.size) push(res('M08', NAMES.M08, 'UNDETERMINABLE', ['no routes, commands, flags or environment variables were recognised in the original code: this cross-check cannot judge']));
    else if (!invText) push(res('M08', NAMES.M08, 'ABSENT', [`no ${M.inventory}`]));
    else {
      const low = invText.toLowerCase(); const miss = [...dyn.surface].filter(([t]) => !low.includes(t.toLowerCase()));
      const share = 1 - miss.length / dyn.surface.size;
      push(res('M08', NAMES.M08, share >= M.surface.minShare ? 'PASS' : 'PARTIAL', share >= M.surface.minShare ? [] : [`${miss.length} of ${dyn.surface.size} public elements found in the original are not in the inventory: ${miss.slice(0, 8).map(([t, k]) => `${t} (${k})`).join(', ')}`], { found: dyn.surface.size, missing: miss.length }, {}));
    }
  }
  // ---- M09 ----
  {
    if (defText == null) push(res('M09', NAMES.M09, 'ABSENT', [`no ${M.deferred} (it is required even when nothing is dropped: it then says so)`]));
    else {
      const r = []; const dtLines = defText.split('\n'); const low = clean(defText);
      for (const w of rows.filter(x => x.dec === 'drop' || x.dec === 'defer' || x.dec === 'change')) {
        const key = clean(w.el).slice(0, 40); if (!key) continue;
        const line = dtLines.find(l => clean(l).includes(key));
        if (!line) r.push(`"${key}" is ${w.dec} in the inventory but absent from the deferred list`);
        else if (clean(line).replace(key, '').split(' ').filter(x => /\w{2,}/.test(x)).length < 3) r.push(`"${key}" is in the deferred list without a reason`);
      }
      void low;
      push(res('M09', NAMES.M09, r.length ? 'PARTIAL' : 'PASS', r.slice(0, 8), { listed: rows.filter(x => x.dec === 'drop' || x.dec === 'defer' || x.dec === 'change').length }, {}));
    }
  }
  // ---- M10 intended changes: new features and changed behaviors are accounted for and tested outside the characterization suite ----
  {
    const r = []; const charIds = new Set(); for (const t of tests) citedCrit(critIds, t.text).forEach(i => charIds.add(i));
    const otherFiles = trackedFiles(ctx.root).filter(p => isTestLike(cfg, p) && !files.includes(p) && /\.(js|mjs|cjs|ts|tsx|py|go)$/.test(p));
    const otherIds = new Set(); for (const t of charTests(ctx, otherFiles)) citedCrit(critIds, t.text).forEach(i => otherIds.add(i));
    const intended = crit.filter(c => isNew(c) || changeClaims.has(c.id));
    for (const c of intended) { if (charIds.has(c.id)) r.push(c.id + ' is a new or changed behavior but the characterization suite (which must pass on the original) cites it'); if (!otherIds.has(c.id)) r.push(c.id + ' is a new or changed behavior but no ordinary test cites it'); }
    const unaccounted = crit.filter(c => !/^N-/.test(c.id) && !charIds.has(c.id) && !isNew(c) && !changeClaims.has(c.id) && !droppedClaims.has(c.id) && !(defText && defText.includes(c.id)));
    if (unaccounted.length) r.push('criteria that are neither pinned, new, changed nor deferred: ' + unaccounted.slice(0, 8).map(c => c.id).join(', '));
    push(res('M10', NAMES.M10, r.length ? 'PARTIAL' : 'PASS', r.slice(0, 8), { intended: intended.length, change_rows: rows.filter(x => x.dec === 'change').length }, {}));
  }
  items.sort((a, b) => a.id.localeCompare(b.id));
  return { items, summary: { pass: items.filter(i => i.status === 'PASS').length, total: items.length, all_pass: items.length === 10 && items.every(i => i.status === 'PASS') } };
}

// ---------- spec-code synchronization (path B: an existing project that gets the substrate AND a spec generated from its code) ----------
// Y01 every public element of the code (found by pattern matching, at the boundary commit) appears in the spec   Y02 every criterion is cited by a test
// Y03 no test cites a criterion the spec does not define   Y04 no document cites an id the spec does not define (no orphan ids)
// Y05 the production code is unchanged since the boundary commit (the formula pins behavior, it does not edit it)
function runSync(ctx, { base }) {
  const cfg = ctx.cfg; const S = cfg.sync; const items = []; const push = r => { items.push(r); return r; };
  const NY = {
    Y01: 'every public element of the code (route, command, flag, environment variable) appears in the generated spec',
    Y02: 'every criterion of the generated spec is cited by a test',
    Y03: 'no test cites a criterion id that the spec does not define',
    Y04: 'no document cites an id that the spec does not define (no orphan ids)',
    Y05: 'the production code is unchanged since the boundary commit'
  };
  const f = discover(ctx); const defs = parseSpecDefs(ctx); const crit = defs.filter(d => d.kind === 'criterion'); const critIds = new Set(crit.map(c => c.id)); const allIds = new Set(defs.map(d => d.id));
  const tracked = trackedFiles(ctx.root);
  const testFiles = tracked.filter(p => isTestLike(cfg, p) && /\.(js|mjs|cjs|ts|tsx|py|go)$/.test(p));
  const tests = charTests(ctx, testFiles).filter(t => !/\.(md)$/.test(t.file));
  const noBase = !base || git(ctx.root, ['cat-file', '-e', base + '^{commit}']).code !== 0;
  const srcAtBase = noBase ? [] : git(ctx.root, ['ls-tree', '-r', '--name-only', base]).stdout.split('\n').filter(Boolean).filter(p => cfg.migration.sourceExt.includes(p.split('.').pop()) && !isTestLike(cfg, p) && !/(^|\/)(node_modules|scripts|tools|docs|\.githooks|\.github|build|dist)\//.test(p) && !new RegExp(cfg.sourceExcludePattern).test(p));
  // Y01
  if (noBase) push(res('Y01', NY.Y01, 'UNDETERMINABLE', ['no --base commit given or it is not in the repository']));
  else {
    const toks = surfaceTokens(srcAtBase.map(p => git(ctx.root, ['show', base + ':' + p]).stdout));
    const specText = f.specFiles.map(p => tryRead(path.join(ctx.root, p)) || '').join('\n').toLowerCase();
    if (!toks.size) push(res('Y01', NY.Y01, 'UNDETERMINABLE', ['no routes, commands, flags or environment variables were recognised in the code at the boundary commit']));
    else if (!specText) push(res('Y01', NY.Y01, 'ABSENT', ['no spec']));
    else { const miss = [...toks].filter(([t]) => !specText.includes(t.toLowerCase())); const share = 1 - miss.length / toks.size;
      push(res('Y01', NY.Y01, share >= S.minShare ? 'PASS' : 'PARTIAL', share >= S.minShare ? [] : [miss.length + ' of ' + toks.size + ' public elements of the code are not in the spec: ' + miss.slice(0, 8).map(([t, k]) => t + ' (' + k + ')').join(', ')], { found: toks.size, missing: miss.length }, {})); }
  }
  // Y02, Y03
  const cited = new Set(); const unknown = new Set(); for (const t of tests) { citedCrit(critIds, t.text).forEach(i => cited.add(i)); unknownCrit(critIds, t.text).forEach(i => unknown.add(i)); }
  const unc = crit.filter(c => !/^N-/.test(c.id) && !cited.has(c.id)).map(c => c.id);
  push(res('Y02', NY.Y02, !crit.length ? 'ABSENT' : unc.length ? 'PARTIAL' : 'PASS', !crit.length ? ['no criteria in the spec'] : unc.length ? [unc.length + ' of ' + crit.length + ' criteria are cited by no test: ' + unc.slice(0, 10).join(', ')] : [], { criteria: crit.length, tests: tests.length }, {}));
  push(res('Y03', NY.Y03, unknown.size ? 'PARTIAL' : 'PASS', unknown.size ? ['tests cite ids the spec does not define: ' + [...unknown].slice(0, 8).join(', ')] : [], {}, {}));
  // Y04
  { const prefixes = new Set([...allIds].map(i => i.split('-')[0])); const orphans = new Map();
    for (const p of tracked.filter(x => /\.md$/i.test(x) && !f.specFiles.includes(x))) {
      for (const id of idsIn(cfg, tryRead(path.join(ctx.root, p)) || '')) { if (S.ignorePrefixes.includes(id.split('-')[0])) continue; if (!prefixes.has(id.split('-')[0])) continue; if (!allIds.has(id) && !allIds.has(id.replace(/\.\d+$/, '')) ) { if (!orphans.has(id)) orphans.set(id, p); } }
    }
    const o = [...orphans].filter(([id]) => !crit.some(c => c.id === id));
    push(res('Y04', NY.Y04, !allIds.size ? 'ABSENT' : o.length ? 'PARTIAL' : 'PASS', !allIds.size ? ['no ids in the spec'] : o.length ? ['ids cited in documents but defined nowhere in the spec: ' + o.slice(0, 8).map(([id, p]) => id + ' (' + p + ')').join(', ')] : [], {}, {})); }
  // Y05
  if (noBase) push(res('Y05', NY.Y05, 'UNDETERMINABLE', ['no --base commit']));
  else { const changed = git(ctx.root, ['diff', '--numstat', base + '..HEAD']).stdout.split('\n').filter(Boolean).map(l => l.split('\t')).filter(a => a.length === 3 && (a[0] !== '0' || a[1] !== '0') && srcAtBase.includes(a[2])).map(a => a[2]);
    push(res('Y05', NY.Y05, changed.length ? 'PARTIAL' : 'PASS', changed.length ? ['production files changed since the boundary: ' + changed.slice(0, 6).join(', ')] : [], { sourceFiles: srcAtBase.length }, {})); }
  items.sort((a, b) => a.id.localeCompare(b.id));
  return { items, summary: { pass: items.filter(i => i.status === 'PASS').length, total: items.length, all_pass: items.length === 5 && items.every(i => i.status === 'PASS') } };
}
module.exports = { run, runSync };

};


__defs["./checker"] = (module, exports, require) => {
'use strict';
// It clones the repository (committed state only) into a temp folder and never modifies the repository under test.
// Exit code: 0 = all twelve PASS, 1 = at least one item is not PASS, 2 = usage or fatal error.
const fs = require('fs');
const path = require('path');
const { sha256, git, sh } = require('./lib/util');
const { ORDER, prepare } = require('./lib/items');

function parseArgs(argv) {
  const a = { only: null, keep: false, since: null, strict: false, both: false, verbose: false, migration: false, mutants: null, sync: false, base: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--repo') a.repo = argv[++i];
    else if (argv[i] === '--config') a.config = argv[++i];
    else if (argv[i] === '--out') a.out = argv[++i];
    else if (argv[i] === '--only') a.only = argv[++i].split(',');
    else if (argv[i] === '--keep') a.keep = true;
    else if (argv[i] === '--since') a.since = argv[++i];
    else if (argv[i] === '--strict') a.strict = true;
    else if (argv[i] === '--both') a.both = true;
    else if (argv[i] === '--verbose') a.verbose = true;
    else if (argv[i] === '--migration') a.migration = true;
    else if (argv[i] === '--sync') a.sync = true;
    else if (argv[i] === '--base') a.base = argv[++i];
    else if (argv[i] === '--mutants') a.mutants = +argv[++i];
  }
  return a;
}

function run(repo, { configPath, only = null, keep = false, since = null, strict = false, migration = false, mutants = null, sync = false, base = null } = {}) {
  const cfgText = configPath ? fs.readFileSync(configPath, 'utf8') : JSON.stringify(DEFAULT_CONFIG, null, 2); const cfg = JSON.parse(cfgText);
  cfg.strictEnforcement = !!strict; // the mode, reported separately from the config hash
  const absRepo = path.resolve(repo);
  const started = new Date().toISOString();
  const head = git(absRepo, ['rev-parse', 'HEAD']);
  const report = {
    checker: 'gs-check', checker_version: cfg.version, config_sha256: sha256(cfgText), mode: strict ? 'strict' : 'default',
    repo: absRepo, started, head: head.code === 0 ? head.stdout.trim() : null,
    env: { node: process.version, platform: process.platform, git: git(absRepo, ['--version']).stdout.trim() },
    items: []
  };
  if (head.code !== 0) { report.fatal = 'not a git repository with at least one commit'; report.items = ORDER.map(([id]) => ({ id, status: 'ABSENT', reasons: ['not a git repository with a commit'] })); return finish(report); }
  const status = git(absRepo, ['status', '--porcelain']).stdout.trim();
  report.uncommitted_changes_ignored = status ? status.split('\n').length : 0;
  // Static analysis runs on a clean clone, so only committed content counts.
  const { Sandbox } = require('./lib/sandbox');
  const staticBox = new Sandbox(absRepo, cfg, 'static'); const c = staticBox.clone();
  if (!c.ok) { report.fatal = 'clone failed'; return finish(report); }
  const ctx = { repo: absRepo, root: staticBox.root, cfg, shared: {}, sandboxes: [staticBox], found: null, probe: null, since };
  prepare(ctx);
  // items read what earlier items found (ids, routes, cascade documents): --only pulls in what the chosen items depend on
  const DEPS = { E03: ['E01'], E04: ['E01', 'E02'], E05: ['E02', 'E04'], E06: ['E02', 'E04'], E07: ['E02', 'E04'], E08: ['E02'], E10: ['E02', 'E04'], E11: ['E02', 'E04'] };
  if (only) only = [...new Set(only.flatMap(i => [i, ...(DEPS[i] || [])]))];
  for (const [id, fn] of ORDER) {
    if (only && !only.includes(id)) continue;
    const t0 = Date.now();
    let r;
    try { r = fn(ctx); } catch (e) { r = { id, name: id, status: 'UNDETERMINABLE', reasons: ['checker exception: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : String(e))], evidence: {}, subflags: {} }; }
    r.ms = Date.now() - t0; report.items.push(r);
  }
  report.items.sort((a, b) => a.id.localeCompare(b.id));
  if (migration) { try { report.migration = require('./migration').run(ctx, { mutants }); } catch (e) { report.migration = { items: [{ id: 'M00', status: 'UNDETERMINABLE', reasons: ['checker exception: ' + (e && e.stack ? e.stack.split(String.fromCharCode(10)).slice(0, 3).join(' | ') : String(e))] }], summary: { all_pass: false } }; } }
  if (sync) { try { report.sync = require('./migration').runSync(ctx, { base }); } catch (e) { report.sync = { items: [{ id: 'Y00', status: 'UNDETERMINABLE', reasons: ['checker exception: ' + String(e && e.message)] }], summary: { all_pass: false } }; } }
  if (!keep) ctx.sandboxes.forEach(s => s.cleanup()); else report.kept = ctx.sandboxes.map(s => s.dir);
  return finish(report);
}
function finish(report) {
  const by = s => report.items.filter(i => i.status === s).length;
  report.summary = { pass: by('PASS'), partial: by('PARTIAL'), absent: by('ABSENT'), undeterminable: by('UNDETERMINABLE'), all_pass: report.items.length === 12 && by('PASS') === 12 };
  report.finished = new Date().toISOString();
  return report;
}
const USAGE = 'usage: node gs-check.mjs --repo <path> [--strict] [--both] [--verbose] [--migration] [--mutants N] [--sync --base <rev>] [--only E01,E05] [--since <rev>] [--config <file>] [--out <report.json>] [--keep] | --print-config';
function printReport(report, verbose) {
  console.log(`# gs-check ${report.checker_version} mode=${report.mode} repo=${report.repo} head=${report.head} node=${report.env.node} ${report.env.platform}`);
  for (const i of report.items) {
    console.log(`${i.id} ${i.status.padEnd(14)} ${i.name || ''}`);
    const rs = i.reasons || []; for (const r of (verbose ? rs : rs.slice(0, 3))) console.log('      - ' + r);
    if (verbose && i.subflags && Object.keys(i.subflags).length) console.log('      subflags: ' + JSON.stringify(i.subflags));
  }
  console.log(`summary (${report.mode}): ${JSON.stringify(report.summary)}`);
  if (report.migration) {
    for (const i of report.migration.items) { console.log(`${i.id} ${i.status.padEnd(14)} ${i.name || ''}`); for (const r of ((i.reasons || []).slice(0, verbose ? 99 : 3))) console.log('      - ' + r); if (verbose && i.evidence && Object.keys(i.evidence).length) console.log('      evidence: ' + JSON.stringify(i.evidence).slice(0, 600)); }
    console.log(`migration summary: ${JSON.stringify(report.migration.summary)}`);
  }
  if (report.sync) {
    for (const i of report.sync.items) { console.log(`${i.id} ${i.status.padEnd(14)} ${i.name || ''}`); for (const r of ((i.reasons || []).slice(0, verbose ? 99 : 3))) console.log('      - ' + r); }
    console.log(`sync summary: ${JSON.stringify(report.sync.summary)}`);
  }
}
function smokeChild(ms, cwd, cmd) { // the README "run" commands (servers) are started for a few seconds, then the whole process tree is killed
  const { spawn, spawnSync } = require('child_process'); const win = process.platform === 'win32';
  const child = spawn(process.env.FX1_SHELL || 'bash', ['-c', cmd], { cwd, detached: !win, stdio: ['ignore', 'pipe', 'pipe'], env: process.env });
  let out = '', timed = false;
  child.stdout.on('data', d => { out += d; }); child.stderr.on('data', d => { out += d; });
  const killTree = () => { try { if (win) spawnSync('taskkill', ['/T', '/F', '/PID', String(child.pid)], { stdio: 'ignore' }); else process.kill(-child.pid, 'SIGKILL'); } catch { /* already gone */ } };
  const t = setTimeout(() => { timed = true; killTree(); }, +ms);
  child.on('exit', code => { clearTimeout(t); killTree(); process.stdout.write(out.slice(-4000)); process.exit(timed ? 124 : (code === null ? 1 : code)); });
  child.on('error', e => { process.stdout.write(String(e)); process.exit(1); });
}
module.exports = { run, parseArgs };
module.exports.cli = function cli(argv) {
  if (argv[0] === '--smoke-child') return smokeChild(argv[1], argv[2], argv[3]);
  if (argv.includes('--print-config')) { const text = JSON.stringify(DEFAULT_CONFIG, null, 2); console.log(text); console.error('config_sha256 ' + sha256(text)); return process.exit(0); }
  const a = parseArgs(argv);
  if (!a.repo) { console.error(USAGE); process.exit(2); }
  const opts = { configPath: a.config, only: a.only, keep: a.keep, since: a.since, mutants: a.mutants, base: a.base || a.since };
  const modes = a.both ? [false, true] : [a.strict];
  const reports = modes.map((strict, k) => run(a.repo, { ...opts, strict, migration: a.migration && k === modes.length - 1, sync: a.sync && k === modes.length - 1 }));
  for (const r of reports) printReport(r, a.verbose);
  if (a.out) fs.writeFileSync(a.out, JSON.stringify(a.both ? { default: reports[0], strict: reports[1] } : reports[0], null, 2));
  if (a.both) { console.log('\nitem  default         strict'); for (const i of reports[0].items) console.log(`${i.id}   ${i.status.padEnd(14)}  ${(reports[1].items.find(x => x.id === i.id) || {}).status}`); }
  const lastR = reports[reports.length - 1];
  process.exit(lastR.summary.all_pass && (!lastR.migration || lastR.migration.summary.all_pass) && (!lastR.sync || lastR.sync.summary.all_pass) ? 0 : 1);
};

};


const __util = __require('./util'), __items = __require('./items'), __checker = __require('./checker');
export const run = __checker.run;
export const internals = { util: __util, items: __items };
export const defaultConfig = DEFAULT_CONFIG;
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) __checker.cli(process.argv.slice(2));
