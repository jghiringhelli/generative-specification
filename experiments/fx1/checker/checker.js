#!/usr/bin/env node
'use strict';
// FX-1 conformance checker (prototype). Deterministic; judges twelve substrate items as "present AND working".
// Usage: node checker.js --repo <path-to-git-repo> [--config <file>] [--out <report.json>] [--only E01,E05] [--keep]
// It clones the repository (committed state only) into a temp folder and never modifies the repository under test.
// Exit code: 0 = all twelve PASS, 1 = at least one item is not PASS, 2 = usage or fatal error.
const fs = require('fs');
const path = require('path');
const { sha256, git, sh } = require('./lib/util');
const { ORDER, prepare } = require('./lib/items');

function parseArgs(argv) {
  const a = { only: null, keep: false, since: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--repo') a.repo = argv[++i];
    else if (argv[i] === '--config') a.config = argv[++i];
    else if (argv[i] === '--out') a.out = argv[++i];
    else if (argv[i] === '--only') a.only = argv[++i].split(',');
    else if (argv[i] === '--keep') a.keep = true;
    else if (argv[i] === '--since') a.since = argv[++i];
  }
  return a;
}

function run(repo, { configPath, only = null, keep = false, since = null } = {}) {
  const cfgFile = configPath || path.join(__dirname, 'config.default.json');
  const cfgText = fs.readFileSync(cfgFile, 'utf8'); const cfg = JSON.parse(cfgText);
  const absRepo = path.resolve(repo);
  const started = new Date().toISOString();
  const head = git(absRepo, ['rev-parse', 'HEAD']);
  const report = {
    checker: 'fx1-checker', checker_version: cfg.version, config_sha256: sha256(cfgText),
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
  for (const [id, fn] of ORDER) {
    if (only && !only.includes(id)) continue;
    const t0 = Date.now();
    let r;
    try { r = fn(ctx); } catch (e) { r = { id, name: id, status: 'UNDETERMINABLE', reasons: ['checker exception: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : String(e))], evidence: {}, subflags: {} }; }
    r.ms = Date.now() - t0; report.items.push(r);
  }
  report.items.sort((a, b) => a.id.localeCompare(b.id));
  if (!keep) ctx.sandboxes.forEach(s => s.cleanup()); else report.kept = ctx.sandboxes.map(s => s.dir);
  return finish(report);
}
function finish(report) {
  const by = s => report.items.filter(i => i.status === s).length;
  report.summary = { pass: by('PASS'), partial: by('PARTIAL'), absent: by('ABSENT'), undeterminable: by('UNDETERMINABLE'), all_pass: report.items.length === 12 && by('PASS') === 12 };
  report.finished = new Date().toISOString();
  return report;
}
module.exports = { run };

if (require.main === module) {
  const a = parseArgs(process.argv.slice(2));
  if (!a.repo) { console.error('usage: node checker.js --repo <path> [--config <file>] [--out <report.json>] [--only E01,E05] [--since <rev>] [--keep]'); process.exit(2); }
  const report = run(a.repo, { configPath: a.config, only: a.only, keep: a.keep, since: a.since });
  if (a.out) fs.writeFileSync(a.out, JSON.stringify(report, null, 2));
  for (const i of report.items) console.log(`${i.id} ${i.status.padEnd(14)} ${i.name || ''}${i.reasons && i.reasons.length ? '\n      - ' + i.reasons.slice(0, 3).join('\n      - ') : ''}`);
  console.log(`\nsummary: ${JSON.stringify(report.summary)}`);
  process.exit(report.summary.all_pass ? 0 : 1);
}
