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
  attemptCommit(edits, message, { noVerify = false, raw = false } = {}) {
    this.reset(); this.apply(edits);
    const files = edits.map(e => e.path);
    git(this.root, ['add', '--', ...files]);
    const before = git(this.root, ['rev-parse', 'HEAD']).stdout.trim();
    const msg = (!raw && this.msgSuffix && !message.includes(this.msgSuffix.trim())) ? message + this.msgSuffix : message;
    const args = ['commit', '-q', '-m', msg]; if (noVerify) args.push('--no-verify');
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
    if (scripts) {
      const cand = this.scriptFailures(this.cfg.timeouts.gateMs); // computes the baseline on a reset tree first
      this.reset(); this.apply(edits);
      fails = cand.filter(n => { const r = sh(`npm run ${n} --silent`, { cwd: this.root, timeout: this.cfg.timeouts.gateMs }); return r.code !== 0 && !r.timedOut; });
    }
    return { blockedAt: fails.length ? 'script' : null, commit: c, push: pushed, scripts: fails };
  }
  cleanup() { try { fs.rmSync(this.dir, { recursive: true, force: true, maxRetries: 3 }); } catch { /* best effort */ } }
}
module.exports = { Sandbox };
