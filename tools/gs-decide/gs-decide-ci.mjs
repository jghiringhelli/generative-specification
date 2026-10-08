#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Juan Carlos Ghiringhelli, PragmaWorks (licence text in ../LICENSE; provided "AS IS", without warranty).
//
// gs-decide-ci: the server-side re-check, because `git commit --no-verify` skips every local hook. One command for CI on the shared branch:
//   node tools/gs-decide/gs-decide-ci.mjs --base origin/main [--require-signed] [--root <dir>]
// It runs, in order, and exits 1 if any fails: (1) gs-decide verify --require-ratified [--require-signed]; (2) gs-decide-hook --range <base>..HEAD
// (ratification entries, and commit signatures when .gs.json decide.requireSignedCommits is on); (3) gs-attribution-hook --range <base>..HEAD
// (a no-op when .gs.json attribution.enabled is not true). The checkout needs the full history (GitHub Actions: actions/checkout with fetch-depth: 0).
// It is only as strong as the repository setting that makes it required: a status check that branch protection requires, plus the setting
// "Require signed commits" if you want GitHub itself to refuse unverified commits. A pipeline a contributor can edit on the branch can be
// weakened in the same change: protect the workflow files with CODEOWNERS (they are protected paths of gs-decide, too).
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
export function main(argv) {
  const val = k => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : undefined), root = val('--root') || process.cwd(), base = val('--base'), signed = argv.includes('--require-signed');
  if (!base) { process.stderr.write('usage: gs-decide-ci --base <rev, e.g. origin/main> [--require-signed] [--root <dir>]\n'); return 2; }
  const steps = [
    ['decisions log', 'gs-decide.mjs', ['verify', '--require-ratified', ...(signed ? ['--require-signed'] : [])]],
    ['decisions hook over the range', 'gs-decide-hook.mjs', ['--range', `${base}..HEAD`]],
    ['attribution hook over the range', 'gs-attribution-hook.mjs', ['--range', `${base}..HEAD`]],
  ];
  let bad = 0;
  for (const [label, file, args] of steps) {
    const r = spawnSync(process.execPath, [join(HERE, file), ...args, '--root', root], { encoding: 'utf8' });
    process.stdout.write(`== ${label}: exit ${r.status}\n${r.stdout}${r.stderr}`);
    if (r.status !== 0) bad++;
  }
  process.stdout.write(bad ? `x ${bad} CI check(s) failed\n` : 'ok all CI checks passed\n');
  return bad ? 1 : 0;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main(process.argv.slice(2));
