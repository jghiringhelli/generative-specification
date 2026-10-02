#!/usr/bin/env node
/*
 * build-frozen-package.js
 * Builds the frozen registration archive for an experiment: a deterministic zip of the
 * registered files plus MANIFEST.json (path, bytes, sha256 per file, git commit and tag),
 * and writes the archive's SHA-256 next to it. No dependencies (node >= 18; uses zlib).
 * Windows paths: C:\workspace\PragmaWorks\gs\gs-experiment-protocol\scripts\build-frozen-package.js
 *
 * Build:
 *   node scripts/build-frozen-package.js build --id SDX-1 --version 1 --root <repo root> --list <file with one repo-relative path per line> [--out <dir>] [--allow-dirty]
 * Verify the working tree against a manifest (the data-free dry check run before every run batch):
 *   node scripts/build-frozen-package.js verify --manifest <MANIFEST.json> --root <repo root>
 * Verify an archive against its recorded hash:
 *   node scripts/build-frozen-package.js check-archive --zip <file.zip> --sha256 <hex or path to .sha256 file>
 *
 * The list file: lines starting with # and blank lines are ignored; a line may be a file or a
 * directory (directories are expanded recursively, skipping .git and node_modules).
 * Determinism: files sorted by path, fixed timestamps (1980-01-01), no extra fields, so the same
 * inputs give the same zip bytes and the same SHA-256 on any machine.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

// ---- crc32 (zlib.crc32 exists in newer node; fallback table) ----
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  if (typeof zlib.crc32 === 'function') return zlib.crc32(buf) >>> 0;
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ---- minimal deterministic zip writer (deflate, UTF-8 names, fixed DOS time 1980-01-01) ----
function buildZip(entries) {
  const DOS_TIME = 0;
  const DOS_DATE = (0 << 9) | (1 << 5) | 1; // 1980-01-01
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const { name, data } of entries) {
    const nameBuf = Buffer.from(name, 'utf8');
    const comp = zlib.deflateRawSync(data, { level: 9 });
    const useDeflate = comp.length < data.length;
    const body = useDeflate ? comp : data;
    const method = useDeflate ? 8 : 0;
    const crc = crc32(data);
    const lh = Buffer.alloc(30);
    lh.writeUInt32LE(0x04034b50, 0);
    lh.writeUInt16LE(20, 4);
    lh.writeUInt16LE(0x0800, 6); // UTF-8 names
    lh.writeUInt16LE(method, 8);
    lh.writeUInt16LE(DOS_TIME, 10);
    lh.writeUInt16LE(DOS_DATE, 12);
    lh.writeUInt32LE(crc, 14);
    lh.writeUInt32LE(body.length, 18);
    lh.writeUInt32LE(data.length, 22);
    lh.writeUInt16LE(nameBuf.length, 26);
    lh.writeUInt16LE(0, 28);
    locals.push(lh, nameBuf, body);
    const ch = Buffer.alloc(46);
    ch.writeUInt32LE(0x02014b50, 0);
    ch.writeUInt16LE(20, 4);
    ch.writeUInt16LE(20, 6);
    ch.writeUInt16LE(0x0800, 8);
    ch.writeUInt16LE(method, 10);
    ch.writeUInt16LE(DOS_TIME, 12);
    ch.writeUInt16LE(DOS_DATE, 14);
    ch.writeUInt32LE(crc, 16);
    ch.writeUInt32LE(body.length, 20);
    ch.writeUInt32LE(data.length, 24);
    ch.writeUInt16LE(nameBuf.length, 28);
    ch.writeUInt32LE(0, 38); // external attrs
    ch.writeUInt32LE(offset, 42);
    centrals.push(ch, nameBuf);
    offset += lh.length + nameBuf.length + body.length;
  }
  const centralBuf = Buffer.concat(centrals);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(centralBuf.length, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, centralBuf, end]);
}

// ---- helpers ----
function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out[k] = true;
      else { out[k] = next; i++; }
    } else out._.push(a);
  }
  return out;
}
function die(msg) { console.error('ERROR: ' + msg); process.exit(1); }
function git(root, args) {
  try { return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim(); }
  catch (e) { return null; }
}
function expand(root, rel, acc) {
  const abs = path.join(root, rel);
  if (!fs.existsSync(abs)) die('listed path does not exist: ' + abs);
  const st = fs.statSync(abs);
  if (st.isDirectory()) {
    for (const name of fs.readdirSync(abs).sort()) {
      if (name === '.git' || name === 'node_modules') continue;
      expand(root, path.posix.join(rel.split(path.sep).join('/'), name), acc);
    }
  } else acc.add(rel.split(path.sep).join('/'));
}

function build(args) {
  const id = args.id || die('--id required (for example SDX-1)');
  const version = args.version || die('--version required (for example 1)');
  const root = path.resolve(args.root || die('--root required'));
  const listFile = args.list || die('--list required');
  const outDir = path.resolve(args.out || path.join(root, 'prereg-frozen'));
  const set = new Set();
  for (const line of fs.readFileSync(listFile, 'utf8').split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    expand(root, t, set);
  }
  const files = [...set].sort();
  if (!files.length) die('no files listed');
  const commit = git(root, ['rev-parse', 'HEAD']);
  const branch = git(root, ['rev-parse', '--abbrev-ref', 'HEAD']);
  const tag = `prereg/${id}-v${version}`;
  const tagCommit = git(root, ['rev-parse', '--verify', '--quiet', `refs/tags/${tag}^{commit}`]);
  let dirty = [];
  if (commit) {
    const st = git(root, ['status', '--porcelain', '--', ...files]);
    dirty = st ? st.split(/\r?\n/).filter(Boolean) : [];
  }
  if (dirty.length && !args['allow-dirty']) {
    die('registered files differ from the committed state (commit first, or pass --allow-dirty for a rehearsal):\n' + dirty.join('\n'));
  }
  if (commit && tagCommit && tagCommit !== commit) {
    console.warn(`WARNING: tag ${tag} points to ${tagCommit}, HEAD is ${commit}`);
  }
  const entries = [];
  const manifestFiles = [];
  for (const rel of files) {
    const data = fs.readFileSync(path.join(root, rel));
    entries.push({ name: rel, data });
    manifestFiles.push({ path: rel, bytes: data.length, sha256: sha256(data) });
  }
  const manifest = {
    experiment: id,
    registrationVersion: Number(version),
    expectedTag: tag,
    tagCommit: tagCommit || null,
    headCommit: commit || null,
    branch: branch || null,
    workingTreeCleanForListedFiles: dirty.length === 0,
    node: process.version,
    fileCount: manifestFiles.length,
    files: manifestFiles,
    note: 'The SHA-256 of the zip is not inside this manifest (it cannot be); it is written to the .sha256 file beside the zip. Dates are deliberately not recorded: external timestamps (OSF, Zenodo) carry them.'
  };
  const manifestBuf = Buffer.from(JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  const all = [{ name: 'MANIFEST.json', data: manifestBuf }, ...entries].sort((a, b) => (a.name < b.name ? -1 : 1));
  const zip = buildZip(all);
  fs.mkdirSync(outDir, { recursive: true });
  const base = `${id}-v${version}-registration`;
  const zipPath = path.join(outDir, base + '.zip');
  const hash = sha256(zip);
  fs.writeFileSync(zipPath, zip);
  fs.writeFileSync(path.join(outDir, base + '.zip.sha256'), `${hash}  ${base}.zip\n`);
  fs.writeFileSync(path.join(outDir, base + '.MANIFEST.json'), manifestBuf);
  console.log(`archive:  ${zipPath}`);
  console.log(`files:    ${manifestFiles.length}`);
  console.log(`commit:   ${commit}`);
  console.log(`tag:      ${tag} -> ${tagCommit || '(not created yet)'}`);
  console.log(`sha256:   ${hash}`);
  if (dirty.length) console.log('NOTE: rehearsal build from an uncommitted tree; do not register this archive.');
}

function verify(args) {
  const manifest = JSON.parse(fs.readFileSync(args.manifest || die('--manifest required'), 'utf8'));
  const root = path.resolve(args.root || die('--root required'));
  let bad = 0;
  for (const f of manifest.files) {
    const p = path.join(root, f.path);
    if (!fs.existsSync(p)) { console.error('MISSING  ' + f.path); bad++; continue; }
    const h = sha256(fs.readFileSync(p));
    if (h !== f.sha256) { console.error('CHANGED  ' + f.path); bad++; }
  }
  if (bad) { console.error(`${bad} file(s) differ from the registration. Do not start the run batch.`); process.exit(2); }
  console.log(`OK: ${manifest.files.length} files match ${manifest.experiment} v${manifest.registrationVersion}`);
}

function checkArchive(args) {
  const zip = fs.readFileSync(args.zip || die('--zip required'));
  let want = args.sha256 || die('--sha256 required');
  if (fs.existsSync(want)) want = fs.readFileSync(want, 'utf8').trim().split(/\s+/)[0];
  const got = sha256(zip);
  if (got !== want.toLowerCase()) { console.error(`MISMATCH: archive is ${got}, expected ${want}`); process.exit(2); }
  console.log('OK: archive hash matches ' + got);
}

const args = parseArgs(process.argv.slice(2));
const cmd = args._[0];
if (cmd === 'build') build(args);
else if (cmd === 'verify') verify(args);
else if (cmd === 'check-archive') checkArchive(args);
else die('usage: build | verify | check-archive (see the header of this file)');
