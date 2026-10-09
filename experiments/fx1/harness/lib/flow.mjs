// flow.mjs: the FX run flow (development loop 2), adapter-neutral. Same steps as the development harness run2.js:
//   A greenfield from a brief; B plain MVP then adopt; C legacy migrate A1 then fresh-session A2; all end with the lock formula in a fresh session.
// Each flow SESSION is a fresh configuration folder (and, for the Claude CLI, a fresh conversation); the scripted human messages are fixed.
import { dock, inVol } from './docker.mjs';
import { makePrompts, reportDone } from './formulas.mjs';
import { newSession, agentCall } from './cell.mjs';
import fs from 'node:fs';

const gitHas = (cell, f) => inVol(cell.vol, `git ls-files --error-unmatch ${f} >/dev/null 2>&1 && echo yes || echo no`).stdout.trim() === 'yes';

// first prompt, then up to maxTurns-1 scripted messages; msgs[k] is sent after turn k+1 when not finished
function session(cell, label, first, maxTurns, msgs, done, opts = {}) {
  const s = newSession(cell, label);
  let j = agentCall(cell, s, label, first, opts), n = 1;
  while (n < maxTurns && !j.isError && !(done && done(j.text || '', n))) { j = agentCall(cell, s, label, msgs[Math.min(n - 1, msgs.length - 1)], opts); n++; }
  return { j, n };
}

export function readFixture(paths, fixtureKey, lang) {
  const cands = [`${paths.fixturesDev}/${fixtureKey}.${lang}.md`, `${paths.confirmDir}/${fixtureKey}.md`];
  for (const c of cands) if (fs.existsSync(c)) return { text: fs.readFileSync(c, 'utf8').trim(), file: c };
  throw new Error(`fixture not found for ${fixtureKey}.${lang} (looked in ${cands.join(' and ')})`);
}

export function runFlow(cell, { P, lang, fixtureKey, verify = false }) {
  const { paths } = cell;
  const meta = cell.meta;
  const pr = makePrompts({ formDir: paths.formulas, lang, fixtureKey });
  const ES = pr.ES;
  let since = null, defaultBranch = 'main';
  if (P === 'C') {
    const bundle = `${paths.fixturesLegacy}/${fixtureKey}.bundle`;
    if (!fs.existsSync(bundle)) throw new Error('legacy fixture bundle missing: ' + bundle);
    const r = dock(['run', '--rm', '-v', `${cell.vol}:/work`, '-v', `${paths.fixturesLegacy}:/src:ro`, 'fx1-linux', 'sh', '-c', `git clone -q /src/${fixtureKey}.bundle /work/_c && cp -a /work/_c/. /work/ && rm -rf /work/_c && git -C /work remote remove origin && chown -R 1001:1001 /work`]);
    if (r.status) throw new Error('legacy clone failed: ' + (r.stderr || r.stdout));
    since = inVol(cell.vol, 'git rev-parse HEAD').stdout.trim(); meta.base = since;
    defaultBranch = inVol(cell.vol, 'git branch --show-current').stdout.trim() || 'master';
    const a1 = session(cell, 'a1', pr.migrateA1(), 5, [pr.DECIDE, pr.CONT], (res, n) => n >= 2 && gitHas(cell, 'docs/migration/equivalence.json'));
    meta.turnsA1 = a1.n;
    if (!cell.void) { const a2 = session(cell, 'a2', pr.migrateA2(), 5, [pr.CONT], (res, n) => reportDone(res) || (n >= 2 && /(PRESENT|MISSING|PARTIAL)/.test(res))); meta.turnsA2 = a2.n; }
  } else if (P === 'A') {
    const brief = readFixture(paths, fixtureKey, lang); meta.fixtureFile = brief.file.replace(/^.*[\\/]/, '');
    defaultBranch = 'master';
    const s = session(cell, 'f1', pr.greenfield(ES ? brief.text : '\n' + brief.text + '\n', ES ? 'lo que dice mi spec' : 'as my spec says'), 6, [pr.RATIFY, pr.CONT], (res, n) => n >= 2 && reportDone(res));
    meta.turnsF = s.n;
  } else if (P === 'B') {
    const brief = readFixture(paths, fixtureKey, lang); meta.fixtureFile = brief.file.replace(/^.*[\\/]/, '');
    const ns = newSession(cell, 'mvp');
    const b = agentCall(cell, ns, 'mvp', pr.neutral(brief.text));
    meta.mvpCost = b.usd; meta.mvpResult = (b.text || '').slice(0, 400);
    since = inVol(cell.vol, 'git rev-parse HEAD').stdout.trim(); meta.base = since; meta.mvpBoundary = since;
    meta.mvpSpecFiles = inVol(cell.vol, 'git ls-files docs | head -20').stdout.trim();
    defaultBranch = inVol(cell.vol, 'git branch --show-current').stdout.trim() || 'master';
    if (!cell.void) { const s = session(cell, 'adopt', pr.adopt(), 6, [pr.RATIFY, pr.CONT], (res, n) => n >= 2 && reportDone(res)); meta.turnsB = s.n; }
  } else throw new Error('path must be A, B or C');
  if (!cell.void) {
    const lk = session(cell, 'lock', pr.lock(defaultBranch), 4, [pr.CONT], (res, n) => gitHas(cell, 'docs/spec.lock') && /(exit|salida|código de salida)/i.test(res) && res.length > 600);
    meta.turnsLock = lk.n;
  }
  // optional: the verify formula (13) needs the checker inside the agent container. That is a deliberate exception to the isolation rule and is
  // OFF in this harness: FX-1.md decides whether formula 13 belongs to the registered flow. Enabling it requires a code change and a deviation.
  if (verify) throw new Error('verify formula is disabled in the portable harness (it would mount the checker into the agent container)');
  return { since, defaultBranch };
}
