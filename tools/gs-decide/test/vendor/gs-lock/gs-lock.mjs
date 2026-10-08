#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Juan Carlos Ghiringhelli, PragmaWorks
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software, to use, copy, modify, merge,
// publish, distribute and sell it, subject to the MIT licence text in ../LICENSE. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY.
//
// gs-lock: the reference spec lock for Generative Specification projects. One file, Node 18+, no dependencies, no model, no network.
// A lockfile for the link between a spec and what was derived from it. Status: written to the canon, tested only by its own node:test
// suite (tools/gs-lock/test), not yet used in a registered run on a model-written project.
//
//   The tag (in a comment, any language):   @gs <id> <spec-path>#<section>     e.g.  // @gs F-001.2 docs/spec/F-001-x.md#f-001-register
//     <id>       the requirement or criterion id the file derives from (no spaces)
//     <spec-path> repository-relative path of the spec file, with forward slashes
//     <section>  GitHub-style anchor of a heading (lowercase, spaces to hyphens, punctuation removed); the section is the heading's text
//                up to the next heading of the same or a higher level (sub-sections included). Also accepted, for the older layout:
//                the slug of a bold label (**Rules**), rule-N (n-th numbered rule) and criterion-N (n-th checklist item).
//   The tag carries NO hash, so a spec change never forces a code edit. Hashes live in docs/spec.lock:
//     S <spec-path>#<section> <hash>                      the locked hash of a section some tag refers to
//     A <artifact> <id> <spec-path>#<section> <hash>      the hash of the section the artifact was derived against
//   hash = first 16 hex of sha256 of the section text with markup (* _ `), list markers, tick state and whitespace removed.
//
// Commands (all accept --root <dir>; run from the project root by default):
//   init [--prune]            write the first lock from the tags; on an existing lock add NEW artifacts and refresh section hashes,
//                             never move the hash an existing artifact was derived against. --prune drops entries whose tag is gone.
//   check [--json] [--require-coverage]
//                             exit 1 on: UNLOCKED (tag not in the lock), STALE (section changed after the artifact), LOCK-BEHIND (section
//                             changed, lock not updated), DANGLING (lock entry, no tag), MISSING-SOURCE, MISMATCH, MALFORMED, CONFLICT,
//                             NOLOCK. UNCOVERED (a spec id no tag points at) is reported; it fails only with --require-coverage.
//   ratify <artifact>|--all [--id <id>] --reason "<why, 15+ chars>"
//                             the one way to move an artifact hash. Appends who, when, what and why to docs/ratifications.md.
//   resolve                   after a git merge left conflict markers in the lock: keep both sides, take the real hashes.
//   commit-check              pre-commit: a moved artifact hash needs a new line in the staged docs/ratifications.md, no hash may be
//                             written by hand (every staged hash must be the real hash), the record is append-only.
//   diff <base> <head>        report for a reviewer: sections whose hash changed in the lock, artifacts stale at <head>.
// Exit codes: 0 ok, 1 findings, 2 usage or environment error.
// Honest limits: it detects that spec and artifact diverged, NOT that the spec is wrong, NOT that a tagged file really implements the
// rule (the tag can lie by omission; that is the tests' job), and `ratify` is a command any agent can run: the trace stays, the real
// enforcement is a person reviewing docs/ratifications.md on a protected branch (CODEOWNERS) because a local hook can be skipped.

import { readFileSync, writeFileSync, appendFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export const LOCK = 'docs/spec.lock';
export const RATIFICATIONS = 'docs/ratifications.md';
export const ID_RE = '[A-Z][A-Z0-9]{0,5}(?:-[A-Z][A-Z0-9]{0,5})?-\\d{1,4}(?:\\.[A-Z]?\\d{1,3}){0,2}';
const CMT = '(?:\\/\\/+|\\/\\*+|#+|\\*|--|<!--|;+|%+)';
const TAG = new RegExp(`^[ \\t]*${CMT}[ \\t]*@gs[ \\t]+(\\S+)[ \\t]+([^\\s#]+)#(\\S+?)(?:[ \\t]*(?:-->|\\*\\/))?[ \\t]*$`, 'u');
const TAG_LOOSE = new RegExp(`^[ \\t]*${CMT}[ \\t]*@gs(?:[ \\t]|$)`);
export const DEFAULTS = {
  specDirs: ['docs/spec', 'docs/specs', 'docs/features', 'docs/especificacion', 'docs/especificaciones', 'docs/requisitos'],
  specRoots: ['SPEC.md', 'docs/SPEC.md', 'docs/spec.md'],
  tagExt: 'js mjs cjs jsx ts tsx py go rs java kt rb php cs c cpp h swift scala sh bash zsh sql lua yaml yml toml md',
  tagSkip: ['node_modules/', '.git/', 'docs/decisions/', 'docs/spec.lock', 'docs/ratifications.md', 'docs/fixes.md'],
};

// ---------- text helpers (CRLF safe: every read is normalised to LF; every write is LF) ----------
export const lf = t => t.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
const slugAscii = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const ghSlug = t => t.replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1').toLowerCase().trim().replace(/[^\p{L}\p{N}\p{M} _-]/gu, '').replace(/ /g, '-');
export function normalizeText(t) {
  return lf(t).replace(/^[ \t]*(?:[-*]|\d+\.)[ \t]+(?:\[[ xX~]\][ \t]*)?/gm, '').replace(/[*_`]/g, '').replace(/\s+/g, ' ').trim();
}
export const hashOf = t => createHash('sha256').update(normalizeText(t)).digest('hex').slice(0, 16);

// ---------- sections ----------
export function parseSections(text) {
  const lines = lf(text).split('\n'), out = new Map(), flat = new Map();
  const heads = [], bolds = []; let fence = false;
  lines.forEach((l, i) => {
    if (/^\s*(```|~~~)/.test(l)) { fence = !fence; return; }
    if (fence) return;
    const h = l.match(/^(#{1,6})[ \t]+(.*?)[ \t]*#*[ \t]*$/), b = !h && l.match(/^\*\*([^*]+?)\*\*:?(.*)$/);
    if (h) heads.push({ level: h[1].length, title: h[2], i });
    else if (b) bolds.push({ title: b[1], rest: b[2], i });
  });
  const seen = new Map();
  heads.forEach((h, k) => { // nested sections: up to the next heading of the same or a higher level
    let end = lines.length; for (let j = k + 1; j < heads.length; j++) if (heads[j].level <= h.level) { end = heads[j].i; break; }
    const text = lines.slice(h.i + 1, end).join('\n'), a = ghSlug(h.title), n = seen.get(a) || 0; seen.set(a, n + 1);
    const name = n ? `${a}-${n}` : a;
    if (!out.has(name)) out.set(name, text);
    for (const s of [slugAscii(h.title), slugAscii(h.title.replace(/\(.*?\)/g, ''))]) if (s && !out.has(s)) out.set(s, text);
  });
  // older layout: flat sections between bold labels and headings (what the lab sensors called sections)
  const marks = [...heads.map(h => ({ ...h, bold: false })), ...bolds.map(b => ({ ...b, bold: true }))].sort((a, b) => a.i - b.i);
  marks.forEach((m, k) => {
    const end = k + 1 < marks.length ? marks[k + 1].i : lines.length;
    const body = (m.bold ? [m.rest] : []).concat(lines.slice(m.i + 1, end)).join('\n');
    const name = slugAscii(m.title.replace(/\(.*?\)/g, ''));
    if (name && !flat.has(name)) flat.set(name, body);
    if (name && m.bold && !out.has(name)) out.set(name, body);
  });
  const items = (body, start) => { const r = []; for (const line of body.split('\n')) { if (start.test(line)) r.push(line); else if (r.length && /^[ \t]+\S/.test(line)) r[r.length - 1] += '\n' + line; } return r; };
  if (flat.has('rules')) items(flat.get('rules'), /^[ \t]{0,3}\d+\.[ \t]+/).forEach((t, i) => out.set(`rule-${i + 1}`, t));
  if (flat.has('acceptance-criteria')) { items(flat.get('acceptance-criteria'), /^-[ \t]\[( |x|X|~)\][ \t]/).forEach((t, i) => out.set(`criterion-${i + 1}`, t)); if (!out.has('criteria')) out.set('criteria', flat.get('acceptance-criteria')); }
  return out;
}

// ids a spec defines: a heading, list item, table row or bold line that STARTS with an id (a plain paragraph does not define one)
export function definedIds(text) {
  const out = []; let fence = false; const re = new RegExp(`^(${ID_RE})(?![\\w-])`);
  lf(text).split('\n').forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) { fence = !fence; return; }
    if (fence) return;
    const structural = /^\s*(?:#{1,6}[ \t]|[-*+][ \t]|\d+[.)][ \t]|\||\*\*|__)/.test(line) || /verified by:/i.test(line);
    if (!structural) return;
    const core = line.replace(/^\s*(?:#{1,6}[ \t]+|[-*+][ \t]+|\d+[.)][ \t]+)?(?:\[[ xX~]\][ \t]*)?\|?[ \t]*(?:\*\*|__|`)*/, '');
    const m = core.match(re); if (m) out.push({ id: m[1], line: i + 1, heading: /^\s*#{1,6}[ \t]/.test(line) });
  });
  return out;
}

// ---------- contexts: the working tree, the git index (''), or a commit ----------
const git = (root, args, o = {}) => spawnSync('git', ['-c', 'core.quotepath=off', ...args], { cwd: root, encoding: 'utf8', maxBuffer: 1 << 27, ...o });
export const gitOf = git;
function walk(root, dir = '', acc = []) {
  let es; try { es = readdirSync(join(root, dir), { withFileTypes: true }); } catch { return acc; }
  for (const e of es) { const rel = dir ? `${dir}/${e.name}` : e.name; if (e.isDirectory()) { if (!['node_modules', '.git'].includes(e.name)) walk(root, rel, acc); } else acc.push(rel); }
  return acc;
}
export function fsCtx(root) {
  return { root, cache: new Map(),
    read: rel => { try { return lf(readFileSync(join(root, rel), 'utf8')); } catch { return null; } },
    list: () => { const r = git(root, ['ls-files', '-z', '-co', '--exclude-standard']); return r.status === 0 && r.stdout ? r.stdout.split('\0').filter(Boolean) : walk(root); } };
}
export function gitCtx(root, rev = '') { // rev '' = the index (what is staged), otherwise a commit-ish
  return { root, cache: new Map(),
    read: rel => { const r = git(root, ['show', `${rev}:${rel}`]); return r.status === 0 ? lf(r.stdout) : null; },
    list: () => { const r = rev === '' ? git(root, ['ls-files', '-z']) : git(root, ['ls-tree', '-r', '-z', '--name-only', rev]); return r.status === 0 ? r.stdout.split('\0').filter(Boolean) : []; } };
}
export function loadConfig(ctx) {
  let user = {}; try { user = JSON.parse(ctx.read('.gs.json') || '{}'); } catch { /* ignore a broken file: defaults */ }
  return { ...DEFAULTS, ...user };
}
const isSpecFile = (rel, cfg) => /\.md$/i.test(rel) && (cfg.specRoots.includes(rel) || cfg.specDirs.some(d => rel.startsWith(d + '/'))) && !/(ratifications|coverage|cobertura)[^/]*$/i.test(rel);
const sectionsOf = (ctx, rel) => { if (!ctx.cache.has(rel)) { const t = ctx.read(rel); ctx.cache.set(rel, t == null ? null : parseSections(t)); } return ctx.cache.get(rel); };
export function sectionHash(ctx, target) {
  const i = target.indexOf('#'), p = target.slice(0, i), s = target.slice(i + 1), secs = sectionsOf(ctx, p);
  if (!secs) return { status: 'MISSING-SOURCE', note: `${p} does not exist` };
  const sec = secs.get(s) ?? secs.get(s.toLowerCase());
  return sec === undefined ? { status: 'MISSING-SOURCE', note: `${p} has no section "${s}"` } : { status: 'ok', hash: hashOf(sec) };
}
export function specIds(ctx, cfg = loadConfig(ctx)) {
  const ids = new Map();
  for (const rel of ctx.list()) if (isSpecFile(rel, cfg)) {
    const t = ctx.read(rel); if (!t) continue;
    const defs = definedIds(t); for (const d of defs) if (!ids.has(d.id)) ids.set(d.id, { file: rel, line: d.line });
    // older layout: a feature F-007 with numbered **Rules** and a checklist of **Acceptance criteria** implicitly defines F-007.R<n> and F-007.C<n>
    const fid = (defs.find(d => d.heading && !d.id.includes('.')) || {}).id;
    if (fid) for (const k of parseSections(t).keys()) { const m = k.match(/^(rule|criterion)-(\d+)$/); if (m) { const id = fid + '.' + (m[1] === 'rule' ? 'R' : 'C') + m[2]; if (!ids.has(id)) ids.set(id, { file: rel, line: 1 }); } }
  }
  return ids;
}

// ---------- tags ----------
export function scanTags(ctx, cfg = loadConfig(ctx)) {
  const tags = [], problems = [], ext = new Set(cfg.tagExt.split(/\s+/));
  const skip = rel => cfg.tagSkip.some(s => rel === s || rel.startsWith(s) || rel.includes('/' + s)) || cfg.specDirs.some(d => rel.startsWith(d + '/')) || cfg.specRoots.includes(rel);
  for (const rel of ctx.list()) {
    if (!ext.has((rel.split('.').pop() || '').toLowerCase()) || skip(rel)) continue;
    const text = ctx.read(rel); if (text == null || !text.includes('@gs')) continue;
    const md = /\.md$/i.test(rel); let fence = false;
    text.split('\n').forEach((line, i) => {
      if (md && /^\s*(```|~~~)/.test(line)) { fence = !fence; return; }
      if (md && fence) return;
      if (!TAG_LOOSE.test(line)) return;
      const m = line.match(TAG);
      if (m) tags.push({ file: rel, line: i + 1, id: m[1], path: m[2], section: m[3], target: `${m[2]}#${m[3]}` });
      else problems.push({ status: 'MALFORMED', file: rel, line: i + 1, id: '', note: 'a tag is "@gs <id> <spec-path>#<section>" in one comment line' });
    });
  }
  const pairs = new Map(), bad = [...problems];
  for (const t of tags) {
    const lg = t.id.match(/^(.+)\.([RC])(\d+)$/), want = lg && (lg[2] === 'R' ? 'rule-' : 'criterion-') + lg[3];
    if (want && /^(rule|criterion)-\d+$/.test(t.section) && t.section !== want) { bad.push({ ...t, status: 'MISMATCH', note: `${t.id} means ${want}, the tag points at ${t.section}` }); continue; }
    pairs.set(`${t.file}|${t.id}|${t.target}`, t);
  }
  return { pairs, problems: bad };
}

// ---------- lock file ----------
export function readLock(ctx) {
  const S = new Map(), A = new Map(), problems = [], raw = ctx.read(LOCK);
  if (raw == null) return { S, A, exists: false, problems };
  raw.split('\n').forEach((line, n) => {
    if (!line || line.startsWith('#')) return;
    if (/^(<<<<<<<|=======|>>>>>>>)/.test(line)) { if (!problems.some(p => p.status === 'CONFLICT')) problems.push({ status: 'CONFLICT', file: LOCK, line: n + 1, id: '', note: 'merge conflict markers in the lock: run "resolve"' }); return; }
    const f = line.split(' ');
    if (f[0] === 'S' && f.length === 3 && /^[0-9a-f]{16}$/.test(f[2])) S.set(f[1], f[2]);
    else if (f[0] === 'A' && f.length === 5 && /^[0-9a-f]{16}$/.test(f[4])) A.set(`${f[1]}|${f[2]}|${f[3]}`, { artifact: f[1], id: f[2], target: f[3], hash: f[4] });
    else problems.push({ status: 'MALFORMED', file: LOCK, line: n + 1, id: '', note: 'not a valid lock line (S <target> <hash> | A <artifact> <id> <target> <hash>)' });
  });
  return { S, A, exists: true, problems };
}
export function lockText({ S, A }) {
  const s = [...S].map(([k, h]) => `S ${k} ${h}`).sort(), a = [...A.values()].map(e => `A ${e.artifact} ${e.id} ${e.target} ${e.hash}`).sort();
  return '# spec.lock: written by gs-lock (init, ratify, resolve). Do not edit by hand.\n' + [...s, ...a].join('\n') + '\n';
}
function writeLock(root, lock) { mkdirSync(dirname(join(root, LOCK)), { recursive: true }); writeFileSync(join(root, LOCK), lockText(lock)); }

// ---------- check ----------
export function checkLock(ctx, cfg = loadConfig(ctx), { withCoverage = true } = {}) {
  const lock = readLock(ctx), { pairs, problems } = scanTags(ctx, cfg), out = [...lock.problems, ...problems];
  const sections = new Set();
  if (!lock.exists && !pairs.size && !problems.length) out.push({ status: 'NOLOCK', file: LOCK, line: 0, id: '', note: 'no lock and no @gs tag: nothing is locked' });
  else if (!lock.exists) out.push({ status: 'NOLOCK', file: LOCK, line: 0, id: '', note: `${LOCK} does not exist: run "init"` });
  for (const [key, p] of pairs) {
    const cur = sectionHash(ctx, p.target);
    if (cur.status !== 'ok') { out.push({ ...p, status: 'MISSING-SOURCE', note: cur.note }); continue; }
    sections.add(p.target);
    const a = lock.A.get(key);
    if (!a) { if (lock.exists) out.push({ ...p, status: 'UNLOCKED', note: 'tagged but not in the lock: run "init"' }); }
    else if (a.hash !== cur.hash) out.push({ ...p, status: 'STALE', declared: a.hash, current: cur.hash, note: `${p.target} changed (derived against ${a.hash}, now ${cur.hash}): regenerate it, or ratify with a reason` });
  }
  if (lock.exists) {
    for (const target of sections) { const cur = sectionHash(ctx, target), locked = lock.S.get(target); if (locked !== cur.hash) out.push({ file: LOCK, line: 0, id: '', target, status: 'LOCK-BEHIND', note: locked ? `${target}: the lock has ${locked}, the section is now ${cur.hash}` : `${target}: section not in the lock: run "init"` }); }
    for (const [key, a] of lock.A) if (!pairs.has(key)) out.push({ file: a.artifact, line: 0, id: a.id, target: a.target, status: 'DANGLING', note: `in the lock but ${a.artifact} carries no such tag any more: restore the tag or run "init --prune"` });
  }
  if (withCoverage) {
    const tagged = [...pairs.values()].map(t => t.id);
    for (const [id, where] of specIds(ctx, cfg)) if (!tagged.some(t => t === id || t.startsWith(id + '.'))) out.push({ status: 'UNCOVERED', file: where.file, line: where.line, id, note: 'defined in the spec, no artifact carries a tag for it' });
  }
  return { findings: out, lock, pairs };
}
const FAILS = (f, requireCoverage) => f.status !== 'UNCOVERED' || requireCoverage;

// ---------- commands ----------
const flagsWithValue = new Set(['--root', '--reason', '--id']);
function parseArgs(argv) {
  const o = { _: [], flags: new Set() };
  for (let i = 0; i < argv.length; i++) { const a = argv[i]; if (flagsWithValue.has(a)) o[a.slice(2)] = argv[++i]; else if (a.startsWith('--')) o.flags.add(a.slice(2)); else o._.push(a); }
  return o;
}
const say = s => process.stdout.write(s + '\n');

function cmdCheck(o) {
  const root = o.root || process.cwd(), ctx = fsCtx(root), cfg = loadConfig(ctx), req = o.flags.has('require-coverage');
  const { findings, lock, pairs } = checkLock(ctx, cfg), failing = findings.filter(f => FAILS(f, req));
  if (o.flags.has('json')) say(JSON.stringify({ ok: !failing.length, artifacts: lock.A.size, sections: lock.S.size, findings }, null, 1));
  else {
    for (const f of findings) say(`${FAILS(f, req) ? 'x' : '-'} ${f.status} ${f.file}${f.line ? ':' + f.line : ''} ${f.id}${f.id ? ': ' : ''}${f.note || ''}`.replace(/\s+$/, ''));
    const unc = findings.filter(f => !FAILS(f, req)).length;
    say(failing.length ? `x spec lock: ${failing.length} problem(s); ${lock.A.size} artifact entries, ${lock.S.size} sections` : `spec lock: ${lock.A.size} artifact entries, ${lock.S.size} sections, all current` + (unc ? ` (${unc} spec id(s) uncovered, not failing: --require-coverage)` : ''));
  }
  return failing.length ? 1 : 0;
}

function cmdInit(o) {
  const root = o.root || process.cwd(), ctx = fsCtx(root), cfg = loadConfig(ctx), lock = readLock(ctx);
  if (lock.problems.length) { lock.problems.forEach(p => say(`x ${p.status} ${p.file}:${p.line} ${p.note}`)); return 1; }
  const { pairs, problems } = scanTags(ctx, cfg);
  if (problems.length) { problems.forEach(p => say(`x ${p.status} ${p.file}:${p.line} ${p.note}`)); return 1; }
  if (!pairs.size) { say('x init: no @gs tag found; tag the derived artifacts first (@gs <id> <spec-path>#<section>)'); return 1; }
  let sections = 0, added = 0, pruned = 0; const wanted = new Set();
  for (const [key, p] of pairs) {
    const cur = sectionHash(ctx, p.target);
    if (cur.status !== 'ok') { say(`x MISSING-SOURCE ${p.file}:${p.line} ${cur.note}`); return 1; }
    wanted.add(p.target);
    if (lock.S.get(p.target) !== cur.hash) { lock.S.set(p.target, cur.hash); sections++; }
    if (!lock.A.has(key)) { lock.A.set(key, { artifact: p.file, id: p.id, target: p.target, hash: cur.hash }); added++; }
  }
  if (o.flags.has('prune')) {
    for (const k of [...lock.A.keys()]) if (!pairs.has(k)) { lock.A.delete(k); pruned++; }
    for (const t of [...lock.S.keys()]) if (!wanted.has(t)) { lock.S.delete(t); pruned++; }
  }
  writeLock(root, lock);
  const ga = join(root, '.gitattributes'), have = existsSync(ga) ? lf(readFileSync(ga, 'utf8')) : '';
  const want = [`${LOCK} text eol=lf`, `${RATIFICATIONS} merge=union text eol=lf`].filter(l => !have.split('\n').some(x => x.trim() === l));
  if (want.length) appendFileSync(ga, (have && !have.endsWith('\n') ? '\n' : '') + want.join('\n') + '\n');
  say(`spec lock written: ${lock.A.size} artifact entries (${added} new), ${lock.S.size} sections (${sections} recorded), ${pruned} pruned; existing artifact hashes untouched`);
  return 0;
}

function who(root) { const g = k => git(root, ['config', k]).stdout.trim(); return `${g('user.name') || 'unknown'} <${g('user.email') || 'unknown'}>`; }
function cmdRatify(o) {
  const root = o.root || process.cwd(), ctx = fsCtx(root), reason = (o.reason || '').trim();
  const artifact = o._[1], all = o.flags.has('all');
  if (!artifact && !all) { process.stderr.write('usage: gs-lock ratify <artifact>|--all [--id <id>] --reason "<why>"\n'); return 2; }
  if (reason.length < 15) { process.stderr.write('ratify needs --reason "<why the artifact still holds, 15+ characters>": the reason is the trace\n'); return 2; }
  const lock = readLock(ctx); if (lock.problems.length) { lock.problems.forEach(p => say(`x ${p.status} ${p.file}:${p.line} ${p.note}`)); return 1; }
  const by = who(root), when = new Date().toISOString().replace(/\.\d+Z$/, 'Z'), records = [];
  for (const [key, a] of lock.A) {
    if ((!all && a.artifact !== artifact) || (o.id && a.id !== o.id)) continue;
    const cur = sectionHash(ctx, a.target);
    if (cur.status !== 'ok') { say(`x MISSING-SOURCE ${a.artifact} ${a.id}: ${cur.note}: restore the section or the tag, a ratification cannot cover a missing section`); return 1; }
    if (cur.hash === a.hash) continue;
    records.push(`- ${when} | ${by} | ${a.artifact} | ${a.id} | ${a.target} | ${a.hash} -> ${cur.hash} | ${reason.replace(/[\r\n|]+/g, ' ')}`);
    lock.A.set(key, { ...a, hash: cur.hash }); lock.S.set(a.target, cur.hash);
  }
  if (!records.length) { say('ratify: nothing stale' + (artifact ? ' for ' + artifact : '')); return 0; }
  writeLock(root, lock);
  const rp = join(root, RATIFICATIONS);
  if (!existsSync(rp)) { mkdirSync(dirname(rp), { recursive: true }); writeFileSync(rp, '# Ratifications (append only)\n\nWho accepted that a derived artifact still holds after its spec section changed, when, and why.\nOne line per artifact and id. Never edit or delete a line: add a new one.\n\n'); }
  const cur = lf(readFileSync(rp, 'utf8')); appendFileSync(rp, (cur.endsWith('\n') ? '' : '\n') + records.join('\n') + '\n');
  records.forEach(r => say('ratified: ' + r));
  return 0;
}

function cmdResolve(o) {
  const root = o.root || process.cwd(), ctx = fsCtx(root), raw = ctx.read(LOCK);
  if (raw == null) { say('x resolve: no lock'); return 1; }
  const S = new Set(), A = new Map();
  for (const l of raw.split('\n')) {
    const f = l.split(' ');
    if (f[0] === 'S' && f.length === 3) S.add(f[1]);
    else if (f[0] === 'A' && f.length === 5) { const k = `${f[1]}|${f[2]}|${f[3]}`; if (!A.has(k)) A.set(k, []); A.get(k).push({ artifact: f[1], id: f[2], target: f[3], hash: f[4] }); }
  }
  const lock = { S: new Map(), A: new Map() };
  for (const t of S) { const cur = sectionHash(ctx, t); if (cur.status === 'ok') lock.S.set(t, cur.hash); }
  for (const [k, list] of A) { const cur = sectionHash(ctx, list[0].target); lock.A.set(k, list.find(e => cur.status === 'ok' && e.hash === cur.hash) ?? list[0]); }
  writeLock(root, lock);
  say(`spec lock resolved: ${lock.A.size} artifact entries, ${lock.S.size} sections; run "check" to see what still needs ratifying`);
  return 0;
}

const lockMaps = text => { const A = new Map(), S = new Map(); for (const l of (text || '').split('\n')) { const f = l.split(' '); if (f[0] === 'A' && f.length === 5) A.set(`${f[1]}|${f[2]}|${f[3]}`, f[4]); else if (f[0] === 'S' && f.length === 3) S.set(f[1], f[2]); } return { A, S }; };
export function commitCheck(root) {
  const problems = [], idx = gitCtx(root, ''), head = gitCtx(root, 'HEAD');
  const stagedLock = idx.read(LOCK), headLock = git(root, ['rev-parse', '--verify', '-q', 'HEAD']).status === 0 ? head.read(LOCK) : null;
  const rat = idx.read(RATIFICATIONS) || '', ratHead = (git(root, ['rev-parse', '--verify', '-q', 'HEAD']).status === 0 ? head.read(RATIFICATIONS) : null) || '';
  if (ratHead && !rat.startsWith(ratHead)) problems.push(`${RATIFICATIONS} is append-only: a line was edited or removed`);
  if (stagedLock != null) {
    const now = lockMaps(stagedLock), before = lockMaps(headLock);
    for (const [key, hash] of now.A) {
      const prev = before.A.get(key); if (prev === hash) continue;
      const [art, id, tgt] = key.split('|'), real = sectionHash(idx, tgt);
      if (real.status === 'ok' && real.hash !== hash) problems.push(`${art} ${id}: the hash ${hash} is not the hash of ${tgt} (${real.hash}): do not edit the lock by hand`);
      if (prev && !rat.split('\n').some(l => l.includes(`| ${art} |`) && l.includes(`| ${id} |`) && l.includes(`${prev} -> ${hash}`))) problems.push(`${art} ${id}: the hash changed (${prev} -> ${hash}) with no new line in ${RATIFICATIONS} saying who accepted it and why`);
    }
    for (const [tgt, hash] of now.S) { if (before.S.get(tgt) === hash) continue; const real = sectionHash(idx, tgt); if (real.status === 'ok' && real.hash !== hash) problems.push(`section ${tgt}: the locked hash ${hash} is not the real hash (${real.hash}): do not edit the lock by hand`); }
  }
  return problems;
}
function cmdCommitCheck(o) {
  const problems = commitCheck(o.root || process.cwd());
  if (problems.length) { say('x spec lock commit check: COMMIT REJECTED'); problems.forEach(p => say('  - ' + p)); return 1; }
  say('ok spec lock commit check'); return 0;
}

function cmdDiff(o) {
  const root = o.root || process.cwd(), [base, head] = [o._[1], o._[2]];
  if (!base || !head) { process.stderr.write('usage: gs-lock diff <base> <head>\n'); return 2; }
  const b = lockMaps(gitCtx(root, base).read(LOCK)), h = lockMaps(gitCtx(root, head).read(LOCK)), ctx = gitCtx(root, head);
  say(`# Intent diff ${base}..${head}`);
  const changed = [...h.S].filter(([t, x]) => b.S.get(t) !== x);
  say(`\n## Sections whose locked hash changed (${changed.length})`); changed.forEach(([t, x]) => say(`- ${t}: ${b.S.get(t) || '(new)'} -> ${x}`));
  const moved = [...h.A].filter(([k, x]) => b.A.has(k) && b.A.get(k) !== x);
  say(`\n## Artifacts ratified in the range (${moved.length})`); moved.forEach(([k, x]) => say(`- ${k.split('|').slice(0, 2).join(' ')}: ${b.A.get(k)} -> ${x}`));
  const { findings } = checkLock(ctx, loadConfig(ctx));
  const stale = findings.filter(f => f.status === 'STALE'), unc = findings.filter(f => f.status === 'UNCOVERED');
  say(`\n## Artifacts stale at ${head} (${stale.length})`); stale.forEach(f => say(`- ${f.file}:${f.line} ${f.id} STALE (${f.target})`));
  say(`\n## Spec ids no artifact points at (${unc.length})`); unc.forEach(f => say(`- ${f.id} (${f.file}:${f.line})`));
  return 0;
}

export function main(argv) {
  const o = parseArgs(argv), cmd = o._[0];
  const table = { init: cmdInit, update: cmdInit, check: cmdCheck, ratify: cmdRatify, resolve: cmdResolve, 'commit-check': cmdCommitCheck, diff: cmdDiff };
  if (!table[cmd]) { process.stderr.write('usage: gs-lock init [--prune] | check [--json] [--require-coverage] | ratify <artifact>|--all [--id <id>] --reason "<why>" | resolve | commit-check | diff <base> <head>   [--root <dir>]\n'); return 2; }
  return table[cmd](o);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main(process.argv.slice(2));
