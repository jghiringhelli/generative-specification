'use strict';
// A throwaway clean clone of the project under test, plus the probe engine (plant a violation, try to commit/push, observe).
const fs = require('fs');
const os = require('os');
const path = require('path');
const { sh, git, exists, read, tryRead, posix } = require('./util');

class Sandbox {
  constructor(repo, cfg, label) {
    this.repo = repo; this.cfg = cfg;
    this.dir = fs.mkdtempSync(path.join(os.tmpdir(), `fx1-${label}-`));
    this.root = path.join(this.dir, 'p');
    this.log = [];
  }
  clone() {
    const r = git(this.dir, ['clone', '--no-hardlinks', '-q', this.repo, this.root]);
    this.log.push({ step: 'clone', code: r.code });
    if (r.code !== 0) return { ok: false, out: r.out };
    this.head = git(this.root, ['rev-parse', 'HEAD']).stdout.trim();
    this.branch = git(this.root, ['symbolic-ref', '--short', 'HEAD']).stdout.trim() || 'HEAD';
    return { ok: !!this.head };
  }
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
    return { hooksPath: hp || null, dir: posix(path.relative(this.root, dir)), hooks: names, execBitOk: execOk };
  }
  reset() {
    git(this.root, ['reset', '--hard', '-q', this.head]);
    git(this.root, ['clean', '-fdq', '-e', 'node_modules', '-e', '.venv', '-e', 'package-lock.json']);
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
  attemptCommit(edits, message, { noVerify = false } = {}) {
    this.reset(); this.apply(edits);
    const files = edits.map(e => e.path);
    git(this.root, ['add', '--', ...files]);
    const before = git(this.root, ['rev-parse', 'HEAD']).stdout.trim();
    const args = ['commit', '-q', '-m', message]; if (noVerify) args.push('--no-verify');
    const r = git(this.root, args, { timeout: this.cfg.timeouts.commitMs });
    const after = git(this.root, ['rev-parse', 'HEAD']).stdout.trim();
    const committed = after !== before;
    return { blocked: r.code !== 0 && !committed, committed, code: r.code, out: r.out.slice(-1500) };
  }
  attemptPush(edits, message) {
    const bare = path.join(this.dir, 'remote.git');
    if (!exists(bare)) { git(this.dir, ['init', '--bare', '-q', bare]); git(this.root, ['remote', 'add', 'fx1origin', bare]); }
    const c = this.attemptCommit(edits, message, { noVerify: true });
    if (!c.committed) return { blocked: null, note: 'could not create the probe commit', out: c.out };
    const r = git(this.root, ['push', '-q', 'fx1origin', 'HEAD:refs/heads/fx1-probe'], { timeout: this.cfg.timeouts.commitMs });
    return { blocked: r.code !== 0, code: r.code, out: r.out.slice(-1500) };
  }
  // Run discovered gate scripts (package.json scripts and Makefile targets) on the working tree; returns names that fail.
  scriptFailures(timeoutMs) {
    const fails = [];
    const pkg = tryRead(path.join(this.root, 'package.json'));
    if (pkg) {
      let scripts = {}; try { scripts = JSON.parse(pkg).scripts || {}; } catch { /* ignore */ }
      for (const name of Object.keys(scripts)) {
        if (this.cfg.skipScripts.some(s => name === s || name.startsWith(s + ':'))) continue;
        const r = sh(`npm run ${name} --silent`, { cwd: this.root, timeout: timeoutMs });
        if (r.code !== 0 && !r.timedOut) fails.push('npm:' + name);
      }
    }
    return fails;
  }
  // Full probe: commit attempt; if it was not blocked, also run the scripts on the same mutated tree.
  probe(edits, message, { scripts = true } = {}) {
    const c = this.attemptCommit(edits, message);
    if (c.blocked) return { blockedAt: 'commit', commit: c, scripts: [] };
    let fails = [];
    if (scripts) { this.reset(); this.apply(edits); fails = this.scriptFailures(this.cfg.timeouts.gateMs); }
    return { blockedAt: fails.length ? 'script' : null, commit: c, scripts: fails };
  }
  cleanup() { try { fs.rmSync(this.dir, { recursive: true, force: true, maxRetries: 3 }); } catch { /* best effort */ } }
}
module.exports = { Sandbox };
