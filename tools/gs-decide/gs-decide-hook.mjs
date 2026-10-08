#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Juan Carlos Ghiringhelli, PragmaWorks (licence text in ../LICENSE; provided "AS IS", without warranty).
//
// gs-decide-hook: refuses a commit that touches a PROTECTED path unless the decisions log holds a matching entry, in the same commit or an
// earlier one. One file next to gs-decide.mjs (it imports it), Node 18+, no dependencies, no model, no network.
// Protected: the spec cascade root (sentinel, spec files, spec.lock), gate/hook/CI/linter configuration (and these tools), the ratchet floor
// file, the waiver list (see `node gs-decide.mjs protected`). "Matching" = an entry, valid today (not expired, not closed), that approves
// THAT path with the sha256 of the content being committed (LF normalised): an approval of other content does not count.
// Also refused: an edit or removal of an earlier log line (append only), a broken chain, a new entry signed by an identity other than the
// committer's, a "Waiver:" line in the message with no waiver entry, and an AI-co-authored commit whose only approval is not a human entry.
// The lock file docs/spec.lock is also satisfied by a new line in gs-lock's docs/ratifications.md, or by additions only (gs-lock init), unless
// the commit has an AI co-author.
//
// It cannot prove that a human acted: it proves a named git identity recorded a reason. `git commit --no-verify` skips it locally; run
// --range in CI on the shared branch, which a clone cannot bypass. A protected path not in the list, or a rename of the tools, is invisible.
//
// Usage (from the project root; --root <dir> to point elsewhere):
//   node gs-decide-hook.mjs --msg-file <file>      commit-msg hook (the staged change against HEAD; the message is read, so the AI trailer is seen)
//   node gs-decide-hook.mjs                        pre-commit (the staged change; no message, so no trailer or Waiver checks)
//   node gs-decide-hook.mjs --commit <rev>         one commit (CI)
//   node gs-decide-hook.mjs --range <base>..<head> every non-merge commit of the range, each judged with the log as of that commit (CI)
//   node gs-decide-hook.mjs --pre-push             pre-push hook: reads git's stdin lines, checks the commits being pushed
// Exit codes: 0 accepted, 1 refused, 2 usage or environment error.

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { gitOf as git, checkChange, stagedView, commitView, committerEmails, parseArgs, today } from './gs-decide.mjs';

const out = s => process.stdout.write(s + '\n');

function report(label, r) {
  if (!r.ok) { out(`x decisions hook: ${label ? label + ': ' : ''}COMMIT REFUSED`); r.refusals.forEach(x => out('  - ' + x)); }
  else out(`ok decisions hook${label ? ' ' + label : ''}: ${r.touched.length ? r.touched.map(t => `${t.path} (${t.how})`).join(', ') : 'no protected path touched'}${r.newEntries.length ? '; new entries ' + r.newEntries.join(', ') : ''}`);
  r.warnings.forEach(w => out('  ! ' + w));
}

export function checkStaged(root, message = '') {
  const v = stagedView(root);
  return checkChange({ changes: v.changes, post: v.post, pre: v.pre, message, committers: committerEmails(root), at: today(), cfg: v.cfg });
}
export function checkRev(root, rev) {
  const v = commitView(root, rev); if (!v) return null;
  return checkChange({ changes: v.changes, post: v.post, pre: v.pre, message: v.message, committers: v.committers, at: v.at, cfg: v.cfg });
}

export function main(argv) {
  const o = parseArgs(argv), root = o.root || process.cwd();
  if (git(root, ['rev-parse', '--git-dir']).status !== 0) { process.stderr.write('x gs-decide-hook: not a git repository\n'); return 2; }
  let revs = [];
  if (o['msg-file'] || (!o.commit && !o.range && !o.flags.has('pre-push'))) {
    const msg = o['msg-file'] ? readFileSync(o['msg-file'], 'utf8').split('\n').filter(l => !l.startsWith('#')).join('\n') : '';
    const r = checkStaged(root, msg); report('', r); return r.ok ? 0 : 1;
  }
  if (o.commit) revs = [o.commit];
  else if (o.range) revs = git(root, ['rev-list', '--reverse', '--no-merges', o.range]).stdout.split('\n').filter(Boolean);
  else {
    for (const line of readFileSync(0, 'utf8').split('\n').filter(Boolean)) {
      const [, local, , remote] = line.split(' '); if (/^0+$/.test(local)) continue;
      const range = /^0+$/.test(remote) ? git(root, ['rev-list', '--reverse', '--no-merges', local, '--not', '--remotes']) : git(root, ['rev-list', '--reverse', '--no-merges', `${remote}..${local}`]);
      revs.push(...range.stdout.split('\n').filter(Boolean));
    }
  }
  let bad = 0;
  for (const rev of revs) {
    const r = checkRev(root, rev); if (!r) continue;
    report(git(root, ['log', '-1', '--format=%h %s', rev]).stdout.trim(), r); if (!r.ok) bad++;
  }
  if (!revs.length) out('ok decisions hook: no commits to judge');
  return bad ? 1 : 0;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main(process.argv.slice(2));
