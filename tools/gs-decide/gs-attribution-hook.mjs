#!/usr/bin/env node
// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Juan Carlos Ghiringhelli, PragmaWorks (licence text in ../LICENSE; provided "AS IS", without warranty).
//
// gs-attribution-hook: the commit-marking rules for agent-made work. One file next to gs-decide.mjs and gs-decide-hook.mjs (it imports both),
// Node 18+, no dependencies, no model, no network. OFF BY DEFAULT: it does nothing unless .gs.json has {"attribution": {"enabled": true}}.
// Status: design, tools tested (tools/gs-decide/test/attribution.test.mjs); not yet in a registered run.
//
// The rules (the practice: docs/practice/agent-commit-marking.md). The marking forms follow the Linux kernel's coding-assistants document
// (`Assisted-by: AGENT_NAME:MODEL_VERSION [TOOLS]`; an AI agent never adds Signed-off-by; a person is accountable) and Claude Code's
// `Co-Authored-By:` trailer.
//   A1 a Signed-off-by trailer whose identity is an agent is refused (an agent never certifies the origin of a commit).
//   A2 an `Assisted-by:` trailer must read `AGENT:MODEL [TOOLS]` (a name, a colon, a model); a `Co-Authored-By:` trailer must read `Name <email>`.
//   A3 a commit whose AUTHOR or COMMITTER identity is a listed agent identity (policy role `agent`, or attribution.agents) must carry a marking.
//   A4 (commit-msg only, a heuristic) an agent environment variable is present (CLAUDECODE and the like) and the message has no marking: refused.
//   A5 a marked commit (Assisted-by, or an AI Co-Authored-By) that touches a protected path needs a verified HUMAN ratification entry: the check is
//      gs-decide-hook's (signed entries when decide.requireSigned is on), run here for the marked commits.
// WHAT IT CANNOT DO. An agent session that writes no marking, under a person's identity and with no agent environment variable, is
// indistinguishable from the person: nothing in a commit says who typed it. A1 to A5 catch the honest and the careless, not a liar.
// `git commit --no-verify` skips the local hook: run --range in CI. The marking is added by a person or by the tool the person runs; the
// hook cannot check that the person reviewed the work.
//
// Usage (project root; --root <dir> elsewhere):
//   node gs-attribution-hook.mjs --msg-file <file>     commit-msg hook
//   node gs-attribution-hook.mjs --commit <rev> | --range <base>..<head> | --pre-push
// Exit codes: 0 accepted (or the hook is off), 1 refused, 2 usage or environment error.

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { gitOf as git, loadConfig, parseArgs, isAi, DEFAULT_AI } from './gs-decide.mjs';
import { checkStaged, checkRev } from './gs-decide-hook.mjs';

const out = s => process.stdout.write(s + '\n');
const AGENT_ENV = ['CLAUDECODE', 'CLAUDE_CODE_ENTRYPOINT', 'GS_DECIDE_AGENT', 'CURSOR_AGENT', 'CODEX_SANDBOX', 'AIDER_MODEL', 'GEMINI_CLI'];
const ASSISTED = /^assisted-by:\s*(.*)$/gim, COAUTH = /^co-authored-by:\s*(.*)$/gim, SIGNED = /^signed-off-by:\s*(.*)$/gim;
const emailOf = s => ((s || '').match(/<([^>]+)>/) || [])[1]?.toLowerCase() || '';

export function attributionConfig(root) {
  let u = {}; try { u = JSON.parse(readFileSync(root + '/.gs.json', 'utf8').replace(/^﻿/, '')).attribution || {}; } catch { /* absent or broken: off */ }
  const dcfg = loadConfig(root), agents = new Set([...(u.agents || []).map(s => String(s).toLowerCase()),
    ...Object.entries(dcfg.policy?.identities || {}).filter(([, roles]) => roles.includes('agent')).map(([k]) => k)]);
  return { enabled: u.enabled === true, aiPattern: u.aiPattern || dcfg.aiPattern || DEFAULT_AI, agents, detectEnv: u.detectEnv !== false, decide: dcfg };
}
export const isAgentIdentity = (text, a) => a.agents.has(emailOf(text)) || a.agents.has((text || '').toLowerCase().trim());

// pure: -> {ok, refusals, warnings, marked}
export function checkMessage(message, { author = '', committer = '', env = {}, cfg }) {
  const refusals = [], warnings = [], msg = message.split('\n').filter(l => !l.startsWith('#')).join('\n');
  const assisted = [...msg.matchAll(ASSISTED)].map(m => m[1].trim()), coauth = [...msg.matchAll(COAUTH)].map(m => m[1].trim()), signed = [...msg.matchAll(SIGNED)].map(m => m[1].trim());
  for (const s of signed) if (isAgentIdentity(s, cfg) || isAi(s, { aiPattern: cfg.aiPattern })) refusals.push(`A1 Signed-off-by: ${s} is an agent identity: an agent never signs off a commit; a person certifies the origin (remove the line)`);
  for (const a of assisted) if (!/^[^\s:]+:[^\s:]+(\s+\S.*)?$/.test(a)) refusals.push(`A2 "Assisted-by: ${a}" must read AGENT_NAME:MODEL_VERSION [TOOLS], for example  Assisted-by: claude-code:claude-sonnet-5-5`);
  for (const c of coauth) if (isAi(c, { aiPattern: cfg.aiPattern }) && !/^[^<]+<[^<>\s]+@[^<>\s]+>$/.test(c)) refusals.push(`A2 "Co-Authored-By: ${c}" must read Name <email>`);
  const aiCoauth = coauth.some(c => isAi(c, { aiPattern: cfg.aiPattern })), marked = assisted.length > 0 || aiCoauth;
  if (!marked) {
    if (isAgentIdentity(author, cfg) || isAgentIdentity(committer, cfg)) refusals.push(`A3 the commit is made under an agent identity (${author || committer}) and carries no marking: add Assisted-by: AGENT:MODEL or Co-Authored-By: Name <email>`);
    if (cfg.detectEnv && AGENT_ENV.some(k => env[k])) refusals.push(`A4 an agent environment variable (${AGENT_ENV.filter(k => env[k]).join(', ')}) is set and the message has no marking: add  Assisted-by: AGENT:MODEL  (a heuristic: it cannot see a session without such a variable)`);
  }
  return { ok: !refusals.length, refusals, warnings, marked };
}

function report(label, r) {
  if (!r.ok) { out(`x attribution hook: ${label ? label + ': ' : ''}COMMIT REFUSED`); r.refusals.forEach(x => out('  - ' + x)); }
  else out(`ok attribution hook${label ? ' ' + label : ''}: ${r.marked ? 'marked as agent-assisted' : 'no agent marking and none required'}`);
  (r.warnings || []).forEach(w => out('  ! ' + w));
}

export function main(argv, env = process.env) {
  const o = parseArgs(argv), root = o.root || process.cwd();
  if (git(root, ['rev-parse', '--git-dir']).status !== 0) { process.stderr.write('x gs-attribution-hook: not a git repository\n'); return 2; }
  const cfg = attributionConfig(root);
  if (!cfg.enabled) { out('- attribution hook is off (.gs.json {"attribution": {"enabled": true}} turns it on)'); return 0; }
  if (o['msg-file']) {
    const msg = readFileSync(o['msg-file'], 'utf8'), id = k => git(root, ['var', k]).stdout.trim().replace(/\s+\d+\s+[+-]\d{4}$/, '');
    const r = checkMessage(msg, { author: id('GIT_AUTHOR_IDENT'), committer: id('GIT_COMMITTER_IDENT'), env, cfg });
    if (r.ok && r.marked) { const d = checkStaged(root, msg); if (!d.ok) { r.ok = false; d.refusals.forEach(x => r.refusals.push('A5 ' + x)); } d.warnings.forEach(w => r.warnings.push(w)); }
    report('', r); return r.ok ? 0 : 1;
  }
  let revs = [];
  if (o.commit) revs = [o.commit];
  else if (o.range) revs = git(root, ['rev-list', '--reverse', '--no-merges', o.range]).stdout.split('\n').filter(Boolean);
  else if (o.flags.has('pre-push')) {
    for (const line of readFileSync(0, 'utf8').split('\n').filter(Boolean)) {
      const [, local, , remote] = line.split(' '); if (/^0+$/.test(local)) continue;
      revs.push(...(/^0+$/.test(remote) ? git(root, ['rev-list', '--reverse', '--no-merges', local, '--not', '--remotes']) : git(root, ['rev-list', '--reverse', '--no-merges', `${remote}..${local}`])).stdout.split('\n').filter(Boolean));
    }
  } else { process.stderr.write('usage: gs-attribution-hook --msg-file <f> | --commit <rev> | --range <a>..<b> | --pre-push\n'); return 2; }
  let bad = 0;
  for (const rev of revs) {
    const info = git(root, ['log', '-1', '--format=%B%x00%an <%ae>%x00%cn <%ce>%x00%h %s', rev]).stdout.split('\0');
    const r = checkMessage(info[0], { author: info[1], committer: info[2], env: {}, cfg }); // history has no environment: A4 is a commit-time heuristic only
    if (r.marked) { const d = checkRev(root, rev); if (d && !d.ok) { r.ok = false; d.refusals.forEach(x => r.refusals.push('A5 ' + x)); } }
    report((info[3] || '').trim(), r); if (!r.ok) bad++;
  }
  if (!revs.length) out('ok attribution hook: no commits to judge');
  return bad ? 1 : 0;
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) process.exitCode = main(process.argv.slice(2));
