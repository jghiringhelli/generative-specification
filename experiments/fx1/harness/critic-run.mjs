// critic-run.mjs: runs ONE vendor-diverse critic (or one panel role) in a fresh, isolated container through an adapter, and collects the critique.
//   node critic-run.mjs --target <fx1|sdx1|sdx89|cmp1|e2e1|rem1|wp5|functions> --model <exact id> [--adapter copilot|claude|mock] [--round 1]
//                       [--role harsh|...|all] [--run 1]
// What it builds: a SNAPSHOT folder holding ONLY the files the runbook allows (plus the runbook), as a one-commit git repository with the branch
// name the runbook demands. It mounts nothing else. The agent receives the runbook's own one-line instruction, followed by a DRIVER block
// that answers section 1 (model id, round) because nobody is there to answer, and says not to pull or push (the harness collects the file).
// Deviations from the runbooks, recorded in every meta.json (field driverDeviations): DRV-1 headless run with the driver block instead of a chat;
// DRV-2 snapshot repository instead of a clone (REPO_HEAD printed by the agent is the snapshot commit; the real source commit is in meta.json);
// DRV-3 no git pull/push by the agent (the harness collects the file); DRV-4 model id is the id the CLI accepts, not a picker label.
import fs from 'node:fs';
import cp from 'node:child_process';
import crypto from 'node:crypto';
import { paths as getPaths, nowIso, REPO_ROOT, HARNESS_DIR } from './lib/config.mjs';
import { dock } from './lib/docker.mjs';
import { openCell, newSession, agentCall, endCell, CapStop, prepareSlot } from './lib/cell.mjs';
import { getAdapter } from './adapters/index.mjs';

const a = Object.fromEntries(process.argv.slice(2).reduce((r, x, i, v) => (x.startsWith('--') ? [...r, [x.slice(2), v[i + 1]]] : r), []));
if (!a.target || !a.model) { console.error('usage: node critic-run.mjs --target <name> --model <exact id> [--adapter copilot] [--round 1] [--role r|all] [--run 1]'); process.exit(2); }
const T = JSON.parse(fs.readFileSync(`${HARNESS_DIR}/critic-targets.json`, 'utf8')).targets[a.target];
if (!T) { console.error('unknown target ' + a.target); process.exit(2); }
const paths = getPaths({ noFormulas: true }); paths.tools = process.env.TOOLS_DIR || paths.root; paths.formulas = process.env.FORMULA_DIR || paths.root;
const adapter = getAdapter(a.adapter || 'copilot');
const round = Number(a.round || 1);
const slug = a.model.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const vendor = /claude|anthropic/i.test(a.model) ? 'anthropic' : /gpt|^o\d|openai|codex/i.test(a.model) ? 'openai' : /gemini|google/i.test(a.model) ? 'google' : /grok|xai/i.test(a.model) ? 'xai' : /kimi|moonshot/i.test(a.model) ? 'moonshot' : /mistral/i.test(a.model) ? 'mistral' : /mock/i.test(a.model) ? 'mock' : 'other';
const sh = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const git = (dir, ...x) => cp.spawnSync('git', ['-c', 'safe.directory=*', '-C', dir, ...x], { encoding: 'utf8', maxBuffer: 1 << 29 });

function readSource(p, ref) {
  if (ref) { const r = cp.spawnSync('git', ['-C', REPO_ROOT, 'show', `${ref}:${p}`], { maxBuffer: 1 << 29 }); if (r.status) throw new Error(`cannot read ${p} at ${ref}: ${r.stderr}. Run: git fetch --all`); return r.stdout; }
  return fs.readFileSync(`${REPO_ROOT}/${p}`);
}
const realHead = (git(REPO_ROOT, 'rev-parse', 'HEAD').stdout || '').trim();

// ---- roles of a panel, extracted verbatim from the runbook text
function panelRoles() {
  const text = readSource(T.runbook, T.runbookRef).toString('utf8').replace(/\r/g, '');
  const from = text.indexOf(T.rolesFrom), to = text.indexOf(T.rolesTo, from + 5);
  const sec = text.slice(from, to > 0 ? to : undefined);
  let preamble = '';
  if (T.preambleRegex) { const m = new RegExp(T.preambleRegex).exec(sec); if (m) preamble = m[1].replace(/\s*\n\s*/g, ' ').trim(); }
  const lines = sec.split('\n'), roles = [];
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\*\*Role (\d+)\s*[:—–-]+\s*([A-Za-z0-9-]+)([^*]*)\*\*(.*)$/);
    if (!m) continue;
    const body = [];
    for (let j = i + 1; j < lines.length; j++) { if (/^> ?/.test(lines[j])) body.push(lines[j].replace(/^> ?/, '')); else if (body.length) break; }
    roles.push({ n: Number(m[1]), slug: m[2].toLowerCase(), web: /web\s+(search\s+)?ALLOWED/i.test(lines[i]), text: body.join('\n').trim() });
  }
  return { preamble, roles };
}

function snapshot(dir, extra) {
  fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
  const listed = [];
  const put = (p, buf) => { const f = `${dir}/${p}`; fs.mkdirSync(f.slice(0, f.lastIndexOf('/')), { recursive: true }); fs.writeFileSync(f, buf); listed.push({ path: p, sha256: crypto.createHash('sha256').update(buf).digest('hex'), bytes: buf.length }); };
  for (const f of T.files) { const o = typeof f === 'string' ? { path: f } : f; put(o.path, readSource(o.path, o.ref)); }
  if (T.kind === 'runbook') put(T.runbook, readSource(T.runbook));
  if (T.printConfig) {
    const gc = `${paths.tools}/gs-check/gs-check.mjs`;
    const pc = fs.existsSync(gc) ? cp.spawnSync('node', [gc, '--print-config'], { encoding: 'utf8' }).stdout : '(gs-check not available on the harness PC: set TOOLS_DIR to the formulas tools folder; the critic must say it could not see the checker configuration)';
    put('tools/gs-check/gs-check.mjs', Buffer.from(`// Snapshot stub: prints the checker's embedded default configuration as captured by the harness (the checker's source is deliberately not given to this critic).\nprocess.stdout.write(${JSON.stringify(pc)});\n`));
  }
  if (extra) for (const [p, b] of Object.entries(extra)) put(p, Buffer.from(b));
  if (T.kind === 'runbook') {
    git(dir, 'init', '-q', '-b', T.branchRequired || 'main'); git(dir, 'add', '-A');
    git(dir, '-c', 'user.name=snapshot', '-c', 'user.email=snapshot@invalid', 'commit', '-q', '-m', `snapshot of ${realHead} (harness)`);
  }
  return listed;
}

function validateRunbookOutput(text) {
  const need = ['## 0. Header', '## 1. Verdict', '## 2. Findings', '## 3. Mandatory sections', '## 6.'];
  const missing = need.filter(h => !text.includes(h));
  const sev = { BLOCKER: 0, MAJOR: 0, MINOR: 0, NIT: 0 };
  for (const m of text.matchAll(/^- SEVERITY:\s*(BLOCKER|MAJOR|MINOR|NIT)/gm)) sev[m[1]]++;
  const findings = (text.match(/^### F-\d+/gm) || []).length;
  return { ok: missing.length === 0 && findings > 0, missing, findings, severity: sev };
}

async function runOne({ role }) {
  const rid = `critic-${a.target}-${vendor}-${slug}${role ? '-' + role.slug : ''}${a.run && Number(a.run) > 1 ? '-run' + a.run : ''}${round > 1 ? '-r' + round : ''}`;
  const slot = prepareSlot(paths, rid);
  if (slot.startsWith('skip')) { console.log(rid, slot); return 0; }
  const sandbox = `${paths.root}/critic-sandboxes/${rid}`;
  const listed = snapshot(sandbox);
  const cell = openCell({ paths, id: rid, adapter, model: a.model, stage: 'critic', noLock: true });
  const t0 = Date.now();
  cell.meta = { id: rid, kind: 'critic', target: a.target, role: role?.slug || null, adapter: adapter.name, modelAsked: a.model, vendor, round, start: nowIso(), sourceCommit: realHead, harnessCommit: realHead, snapshot: listed,
    driverDeviations: ['DRV-1 headless run with a driver block', 'DRV-2 snapshot repository instead of a clone', 'DRV-3 agent does not pull or push', 'DRV-4 model id is the CLI id'] };
  const cp1 = dock(['run', '--rm', '-v', `${sandbox}:/src:ro`, '-v', `${cell.vol}:/work`, 'fx1-linux', 'sh', '-c', 'cp -a /src/. /work/ && chown -R 1001:1001 /work']);
  if (cp1.status) throw new Error('snapshot copy failed: ' + cp1.stderr);
  let prompt, web = false;
  if (T.kind === 'runbook') {
    prompt = `${T.line}\n\nDRIVER BLOCK (this is a headless run: nobody is present, nobody will answer questions, do not wait for anyone). Your answers to section 1 of the runbook: MODEL_ID_AS_SHOWN=${a.model} ; ROUND=${round}. This folder is a one-commit snapshot of the repository, not a clone: there is no remote. Where the runbook says to commit, commit locally only. Do NOT run git pull, git fetch or git push; the harness will collect your file. Print the snapshot's own HEAD where the runbook asks for REPO_HEAD, and write "source commit ${realHead}" in NOTES. Do not read any file other than those the runbook allows.`;
  } else {
    const fname = T.files[0].path.split('/').pop();
    const body = `${role.text}`;
    prompt = `${T.preamble}\n\nThe attached draft is the file ${fname} in your current working directory. It is the ONLY input; do not open any other file. Your final reply must be the complete critique itself, as plain markdown, because the harness saves your reply verbatim.\n\n${body}`.replace(/^undefined\n\n/, '');
    web = role.web;
  }
  let status = 'FINISHED', exitCode = 0, r = null;
  try { const s = newSession(cell, 'critic'); r = agentCall(cell, s, 'critic', prompt, { web, respectStop: false }); if (cell.void) { status = 'VOID-INFRA'; exitCode = 3; } }
  catch (e) { if (e instanceof CapStop) { status = 'CAP-STOP'; exitCode = 4; } else { status = 'HARNESS-ERROR'; exitCode = 1; cell.meta.error = String(e.stack || e).slice(0, 1500); } }
  endCell(cell);
  fs.mkdirSync(cell.work, { recursive: true });
  dock(['run', '--rm', '-v', `${cell.vol}:/work`, '-v', `${cell.work}:/out`, 'fx1-linux', 'sh', '-c', 'cp -a /work/. /out/ && chown -R 0:0 /out']);
  dock(['volume', 'rm', '-f', cell.vol]);
  const deliv = `${cell.dir}/deliverables`; fs.mkdirSync(deliv, { recursive: true });
  let validation = null;
  if (T.kind === 'runbook') {
    const od = `${cell.work}/${T.outDir}`;
    const files = fs.existsSync(od) ? fs.readdirSync(od).filter(n => n.endsWith('.md')) : [];
    for (const f of files) fs.copyFileSync(`${od}/${f}`, `${deliv}/${f}`);
    validation = files.length ? validateRunbookOutput(fs.readFileSync(`${deliv}/${files[0]}`, 'utf8')) : { ok: false, missing: ['no critique file written'], findings: 0, severity: {} };
    validation.files = files;
    if (status === 'FINISHED' && !validation.ok) { status = 'SCHEMA-FAIL'; exitCode = 6; }
  } else if (r && status === 'FINISHED') {
    const fm = `---\nrole: ${role.slug}\nvendor: ${vendor}\nmodel: ${a.model}\nharness: copilot-cli-headless (${adapter.name})\ndraft: ${T.files[0].path}\ndraft_commit: ${realHead}\ntimestamp: ${nowIso()}\nweb_search_used: ${web}\nnotes: reply saved verbatim by the harness; model served=${r.modelServed || 'n/a'}\n---\n`;
    fs.writeFileSync(`${deliv}/${role.slug}-${vendor}-${slug}${a.run && Number(a.run) > 1 ? '-run' + a.run : ''}.md`, fm + r.text + '\n');
    validation = { ok: r.text.length > 500, chars: r.text.length };
    if (!validation.ok) { status = 'SCHEMA-FAIL'; exitCode = 6; }
  }
  Object.assign(cell.meta, { end: nowIso(), durationSec: Math.round((Date.now() - t0) / 1000), status, validation, calls: cell.calls.length, modelServed: [...new Set(cell.calls.map(c => c.modelServed).filter(Boolean))], tokens: cell.tokensKnown ? cell.tokens : null, usdReported: cell.totalUsd, premiumEstimated: cell.calls.reduce((s, c) => s + (c.premium || 0), 0), premiumMultiplierKnown: cell.calls.every(c => c.premiumKnown !== false), void: cell.void,
    cliVersion: (dock(['run', '--rm', adapter.image, ...adapter.versionCmd]).stdout || '').trim().split('\n')[0] });
  fs.writeFileSync(`${cell.logs}/meta.json`, JSON.stringify(cell.meta, null, 2));
  console.log(rid, status, validation ? JSON.stringify({ findings: validation.findings, sev: validation.severity, chars: validation.chars, missing: validation.missing }) : '');
  return exitCode;
}

let worst = 0;
if (T.kind === 'runbook') worst = await runOne({});
else {
  const { preamble, roles } = panelRoles(); T.preamble = preamble;
  const want = !a.role || a.role === 'all' ? roles : roles.filter(r => r.slug === a.role);
  if (!want.length) { console.error('no such role; have: ' + roles.map(r => r.slug).join(', ')); process.exit(2); }
  if (roles.length < 5) { console.error('role extraction found only ' + roles.length + ' roles; the runbook format changed: stop and tell JC'); process.exit(1); }
  for (const r of want) { const reps = (T.repeat && T.repeat[r.slug]) || 1; for (let k = 1; k <= reps; k++) { a.run = String(k); const c = await runOne({ role: r }); worst = Math.max(worst, c); if (c === 4) process.exit(4); } }
}
process.exit(worst);
