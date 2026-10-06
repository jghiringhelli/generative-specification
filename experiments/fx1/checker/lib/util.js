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
function refsIn(text, cfg) {
  const t = stripFences(text); const refs = new Set();
  const exts = new Set(cfg.refExtensions);
  const ignore = cfg.ignoreRefPatterns.map(r => new RegExp(r));
  const add = raw => {
    let r = raw.trim().replace(/^\.\//, '').replace(/[#?].*$/, '').replace(/[.,;:)]+$/, '');
    if (!r || ignore.some(re => re.test(r))) return;
    if (/[\s*<>{}$|\\^~=]/.test(r) || r.startsWith('-') || r.startsWith('@') || r.startsWith('/')) return;
    const ext = (r.match(/\.([A-Za-z0-9]+)$/) || [])[1];
    const looksPath = r.includes('/') || (ext && exts.has(ext.toLowerCase()));
    if (!looksPath) return;
    if (r.includes('/') && !ext && !r.endsWith('/') && /^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i.test(r) && !/^(docs|src|tests?|scripts|lib|app|\.github|\.githooks|\.husky|\.claude|\.cursor)\//i.test(r)) return; // "and/or", "input/output" prose
    refs.add(r);
  };
  for (const m of t.matchAll(/\]\(([^)\s]+)\)/g)) add(m[1]);
  for (const m of t.matchAll(/`([^`\n]+)`/g)) add(m[1]);
  return [...refs];
}
function resolveRef(root, fromFile, ref) {
  const cands = [path.join(root, path.dirname(fromFile), ref), path.join(root, ref)];
  for (const c of cands) if (exists(c)) return posix(path.relative(root, c));
  return null;
}

module.exports = { posix, sha256, exists, read, tryRead, cleanEnv, sh, git, walk, relList, trackedFiles, slug, stripFences, fences, sections, normalizeSection, sectionHash, leadingId, refsIn, resolveRef };
