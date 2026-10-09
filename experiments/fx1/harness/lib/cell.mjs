// cell.mjs: one cell = one run = one fresh sandbox volume + one fresh configuration folder per flow session.
// The agent container is built here and ONLY here, with the isolation rules:
//   mounts: /work (the cell's own volume), /cfg (the current session's own folder), /tools/gs-lock (read-only reference lock tool).
//   never: the checker, the formulas, the fixtures, the repository, the results folder, another cell.
import fs from 'node:fs';
import { dock, runNamed, hardening, agentMounts, assertAgentArgs } from './docker.mjs';
import { append, premiumFor, creditsFor, capStatus, markStageStart } from './ledger.mjs';
import { num, nowIso } from './config.mjs';

// Slot handling shared by critic-run and practitioner-run (queue.mjs does the same for FX cells): a FINISHED cell is never run again; any other
// existing cell (void, cap stop, schema failure, crash) is archived as <id>.void1 and the slot is run ONCE more; a second failure is not retried.
export function prepareSlot(paths, id) {
  const dir = `${paths.cells}/${id}`;
  if (!fs.existsSync(dir)) return 'run';
  let st = null; try { st = JSON.parse(fs.readFileSync(`${dir}/logs/meta.json`, 'utf8')).status; } catch {}
  if (st === 'FINISHED') return 'skip-done';
  if (fs.existsSync(`${dir}.void1`)) return 'skip-second-failure';
  fs.renameSync(dir, `${dir}.void1`);
  dock(['volume', 'rm', '-f', `fxvol-${id}`]);
  return 'run-after-void';
}

export class CapStop extends Error { constructor(axes) { super('CAP: ' + axes.join(',')); this.axes = axes; } }

export function openCell({ paths, id, adapter, model, stage = '', noLock = false }) {
  const dir = `${paths.cells}/${id}`;
  if (fs.existsSync(dir)) { console.error(`cell exists: ${dir} (never reuse a cell; archive it as .void1 first)`); process.exit(1); }
  fs.mkdirSync(`${dir}/logs`, { recursive: true });
  fs.mkdirSync(`${dir}/cfg`, { recursive: true });
  try { fs.chmodSync(`${dir}/cfg`, 0o777); } catch {}
  const cell = {
    id, noLock, dir, logs: `${dir}/logs`, cfg: `${dir}/cfg`, work: `${dir}/work`, vol: `fxvol-${id}`, adapter, model, stage, paths,
    turnNo: 0, sessionNo: 0, totalUsd: 0, costs: {}, calls: [], void: null, modelMismatch: false, tokens: { input: 0, output: 0, cached: 0 }, tokensKnown: true,
    startMs: Date.now(),
  };
  dock(['volume', 'create', cell.vol]);
  // make the ownership explicit instead of depending on the image (and never use `docker run -w /work`: it resets the volume root to root:root): the agent user is uid 1001 in every agent image
  dock(['run', '--rm', '-v', `${cell.vol}:/work`, 'fx1-linux', 'chown', '1001:1001', '/work']);
  return cell;
}

export function newSession(cell, label) {
  const key = `${String(++cell.sessionNo).padStart(2, '0')}-${label}`;
  const dir = `${cell.cfg}/${key}`;
  fs.mkdirSync(`${dir}/prompts`, { recursive: true });
  try { fs.chmodSync(dir, 0o777); fs.chmodSync(`${dir}/prompts`, 0o777); } catch {}
  cell.adapter.prepareSession(dir);
  return { key, dir, label, turns: 0, sid: null };
}

// After the cell: remove credentials, and prune the CLI's own noise (account-synced plugins and skills, caches, backups, account file). They are not evidence,
// they can be huge, and on Windows their paths exceed the path limit. Transcripts, prompts, share files and token files are kept.
const NOISE = ['plugins', 'backups', 'skills', 'shell-snapshots', 'session-env', 'cache', 'plugin-cache', 'node_modules', 'telemetry', 'statsig'];
export function endCell(cell) {
  if (!fs.existsSync(cell.cfg)) return;
  for (const s of fs.readdirSync(cell.cfg)) {
    const d = `${cell.cfg}/${s}`;
    cell.adapter.cleanupSession(d);
    const roots = [d, `${d}/home`];
    for (const r of roots) {
      if (!fs.existsSync(r)) continue;
      for (const n of NOISE) { try { fs.rmSync(`${r}/${n}`, { recursive: true, force: true, maxRetries: 2 }); } catch {} }
      for (const f of fs.readdirSync(r)) if (/^\.claude\.json/.test(f)) { try { fs.rmSync(`${r}/${f}`, { force: true }); } catch {} }
    }
  }
}

// One agent call. Returns the normalized result; throws CapStop when a hard cap is reached BEFORE the call.
export function agentCall(cell, sess, label, prompt, opts = {}) {
  const { paths, adapter } = cell;
  markStageStart(paths, cell.stage);
  const cs = capStatus(paths, cell.stage);
  if (cs.hard.length) throw new CapStop(cs.hard);
  if (cs.unmeasured.length) throw new CapStop(['UNENFORCEABLE ' + cs.unmeasured[0]]);
  if (fs.existsSync(paths.stop) && opts.respectStop !== false) throw new CapStop(['STOP-file']);
  sess.turns++; cell.turnNo++;
  const nn = String(cell.turnNo).padStart(2, '0');
  const pf = `${nn}-${label}.txt`;
  fs.writeFileSync(`${sess.dir}/prompts/${pf}`, prompt, { mode: 0o666 });
  const cmd = adapter.command({ model: cell.model, promptFile: `/cfg/prompts/${pf}`, resumeId: sess.sid, turn: sess.turns, label, web: !!opts.web, maxBudgetUsd: opts.maxBudgetUsd ?? num('FX_MAX_BUDGET_USD', 14), maxCredits: opts.maxCredits });
  const name = `fx1-${cell.id}-${nn}`.replace(/[^a-zA-Z0-9_.-]/g, '_');
  const env = [];
  for (const [k, v] of Object.entries(cmd.env || {})) env.push('-e', `${k}=${v}`);
  for (const s of adapter.secretEnv) if (process.env[s]) env.push('-e', s); // by NAME: docker copies the value from this process
  const args = ['--user', '1001:1001', ...hardening(process.env.FX_MEMORY || '8g'), ...agentMounts({ vol: cell.vol, cfgDir: sess.dir, lockDir: cell.noLock ? null : `${paths.tools}/gs-lock` }), ...env, adapter.image, 'sh', '-c', cmd.shell];
  assertAgentArgs(args, cell.noLock ? [cell.vol, sess.dir] : [cell.vol, sess.dir, `${paths.tools}/gs-lock`]);
  const t0 = Date.now();
  const r = runNamed(name, args, num('FX_CALL_TIMEOUT_MIN', 55) * 60 * 1000);
  const durationMs = Date.now() - t0;
  const stdout = r.stdout || '', stderr = (r.stderr || '') + (r.error && !r.timedOut ? `\n[spawn error] ${r.error.message}` : '');
  fs.writeFileSync(`${cell.logs}/turn${nn}-${label}.raw.txt`, stdout + '\n---STDERR---\n' + stderr);
  const p = adapter.parse(stdout, stderr, r.status ?? (r.timedOut ? 124 : 1), { cfgDir: sess.dir, turn: sess.turns, timedOut: !!r.timedOut, sessionKey: sess.key });
  if (r.timedOut) { p.isError = true; p.errorClass = 'infra-timeout'; }
  if (p.sessionId && adapter.name === 'claude') sess.sid = p.sessionId;
  if (adapter.name !== 'claude') sess.sid = sess.key;
  const prem = premiumFor(cell.model);
  const credits = creditsFor(cell.model, p.tokens);
  cell.totalUsd += p.usd || 0; cell.costs[label] = (cell.costs[label] || 0) + (p.usd || 0);
  if (p.tokens) { cell.tokens.input += p.tokens.input || 0; cell.tokens.output += p.tokens.output || 0; cell.tokens.cached += p.tokens.cached || 0; } else cell.tokensKnown = false;
  if (p.modelServed && cell.model && !(p.modelServed.includes(cell.model) || cell.model.includes(p.modelServed))) cell.modelMismatch = true;
  const rec = { ts: nowIso(), cell: cell.id, stage: cell.stage, label, turn: cell.turnNo, adapter: adapter.name, modelAsked: cell.model, modelServed: p.modelServed || null, durationMs, isError: !!p.isError, errorClass: p.errorClass || null, premium: prem.value, premiumKnown: prem.known, credits, usd: p.usd ?? null, tokensIn: p.tokens?.input ?? null, tokensOut: p.tokens?.output ?? null, tokensNote: p.otel || null };
  append(paths, rec); cell.calls.push(rec);
  if (p.isError && String(p.errorClass || '').startsWith('infra') && !cell.void) cell.void = { label, class: p.errorClass, turn: cell.turnNo, line: (p.text || stderr).slice(0, 200).replace(/\s+/g, ' ') };
  return { ...p, j: p };
}
