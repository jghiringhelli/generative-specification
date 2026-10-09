// practitioner-run.mjs: Phase 2, one model-authored expert prompt session (A5-m) per COPILOT-PRACTITIONER-RUNBOOK.md and PRACTITIONER-HANDLING.md.
//   node practitioner-run.mjs --model <exact id> --variant m1|m2 [--adapter copilot|claude|mock]
// Sandbox = a folder with exactly RUNBOOK.md, PASTURA-PRODUCT-DESCRIPTION.md, SESSION-FACTS.md (m1 or m2). NOT a git repository (the runbook
// says to stop if it is). Message 1 is the runbook's own sentence plus a DRIVER line that answers the runbook's question about the model id.
// Message 2 (the step 2 text, byte for byte from PRACTITIONER-HANDLING.md section 2) is sent in the SAME session only after out/A6.md exists.
// The produced out/ folder is a deliverable; the harness never reads or edits the texts (no steering, no comment).
import fs from 'node:fs';
import crypto from 'node:crypto';
import { paths as getPaths, nowIso, REPO_ROOT } from './lib/config.mjs';
import { dock } from './lib/docker.mjs';
import { openCell, newSession, agentCall, endCell, CapStop, prepareSlot } from './lib/cell.mjs';
import { getAdapter } from './adapters/index.mjs';
import cp from 'node:child_process';

const a = Object.fromEntries(process.argv.slice(2).reduce((r, x, i, v) => (x.startsWith('--') ? [...r, [x.slice(2), v[i + 1]]] : r), []));
if (!a.model || !['m1', 'm2'].includes(a.variant)) { console.error('usage: node practitioner-run.mjs --model <id> --variant m1|m2 [--adapter copilot]'); process.exit(2); }
const paths = getPaths({ noFormulas: true }); paths.tools = process.env.TOOLS_DIR || paths.root; paths.formulas = process.env.FORMULA_DIR || paths.root;
const adapter = getAdapter(a.adapter || 'copilot');
const slug = a.model.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const vendor = /claude|anthropic/i.test(a.model) ? 'anthropic' : /gpt|openai|codex/i.test(a.model) ? 'openai' : /gemini|google/i.test(a.model) ? 'google' : /grok|xai/i.test(a.model) ? 'xai' : /mock/i.test(a.model) ? 'mock' : 'other';
if (vendor === 'anthropic') console.log('NOTE: an Anthropic model is the generator vendor: label this "same vendor as generator" and keep it out of the model-author claim (PRACTITIONER-HANDLING section 3).');
const id = `practitioner-${vendor}-${slug}-${a.variant}`;

{ const slot = prepareSlot(paths, id); if (slot.startsWith('skip')) { console.log(id, slot); process.exit(0); } }
const sbx = `${paths.root}/critic-sandboxes/${id}`;
fs.rmSync(sbx, { recursive: true, force: true }); fs.mkdirSync(`${sbx}/out`, { recursive: true });
const rd = p => fs.readFileSync(`${REPO_ROOT}/${p}`);
fs.writeFileSync(`${sbx}/RUNBOOK.md`, rd('docs/experiments/COPILOT-PRACTITIONER-RUNBOOK.md'));
fs.writeFileSync(`${sbx}/PASTURA-PRODUCT-DESCRIPTION.md`, rd('experiments/sdx1/practitioner/PASTURA-PRODUCT-DESCRIPTION.md'));
fs.writeFileSync(`${sbx}/SESSION-FACTS.md`, rd(`experiments/sdx1/practitioner/SESSION-FACTS.${a.variant}.md`));
const handling = rd('docs/experiments/PRACTITIONER-HANDLING.md').toString('utf8').replace(/\r/g, '');
const i0 = handling.indexOf('**Step 2 message'); const f0 = handling.indexOf('```', i0); const f1 = handling.indexOf('```', f0 + 3);
const step2 = handling.slice(handling.indexOf('\n', f0) + 1, f1).trim();
if (!/^Step 2\./.test(step2)) { console.error('could not extract the step 2 message from PRACTITIONER-HANDLING.md'); process.exit(1); }
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
const snap = fs.readdirSync(sbx).filter(f => f !== 'out').map(f => ({ path: f, sha256: sha(fs.readFileSync(`${sbx}/${f}`)) }));

const cell = openCell({ paths, id, adapter, model: a.model, stage: 'practitioner', noLock: true });
cell.meta = { id, kind: 'practitioner', variant: a.variant, adapter: adapter.name, modelAsked: a.model, vendor, start: nowIso(), harnessCommit: (cp.spawnSync('git', ['-C', REPO_ROOT, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout || '').trim(), snapshot: snap, step2Sha256: sha(Buffer.from(step2)),
  driverDeviations: ['DRV-1 headless run: the model id question of runbook section 0 is answered in the first message', 'DRV-4 model id is the CLI id, not a picker label'] };
dock(['run', '--rm', '-v', `${sbx}:/src:ro`, '-v', `${cell.vol}:/work`, 'fx1-linux', 'sh', '-c', 'cp -a /src/. /work/ && chown -R 1001:1001 /work']);
let status = 'FINISHED', code = 0;
try {
  const s = newSession(cell, 'prac');
  const m1 = agentCall(cell, s, 'step1', `Read RUNBOOK.md in this folder and follow it.\n\nDRIVER (headless run; nobody will answer questions, do not wait): the exact model identifier string for this chat is: ${a.model}`, { respectStop: false });
  const has = f => dock(['run', '--rm', '-v', `${cell.vol}:/work:ro`, 'fx1-linux', 'sh', '-c', `test -f /work/out/${f} && echo yes || echo no`]).stdout.trim() === 'yes';
  if (cell.void) { status = 'VOID-INFRA'; code = 3; }
  else if (!has('A6.md')) { status = 'STEP1-NOT-DELIVERED'; code = 1; }
  else {
    const m2 = agentCall(cell, s, 'step2', step2, { respectStop: false });
    if (cell.void) { status = 'VOID-INFRA'; code = 3; }
    const missing = ['A5.md', 'removed.md', 'attestation.md', 'meta.json'].filter(f => !has(f));
    cell.meta.missingOutputs = missing; if (missing.length && status === 'FINISHED') status = 'INCOMPLETE';
  }
} catch (e) { if (e instanceof CapStop) { status = 'CAP-STOP'; code = 4; } else { status = 'HARNESS-ERROR'; code = 1; cell.meta.error = String(e.stack || e).slice(0, 1500); } }
endCell(cell);
fs.mkdirSync(cell.work, { recursive: true });
dock(['run', '--rm', '-v', `${cell.vol}:/work`, '-v', `${cell.work}:/out`, 'fx1-linux', 'sh', '-c', 'cp -a /work/. /out/ && chown -R 0:0 /out']);
dock(['volume', 'rm', '-f', cell.vol]);
const deliv = `${cell.dir}/deliverables`; fs.mkdirSync(deliv, { recursive: true });
if (fs.existsSync(`${cell.work}/out`)) fs.cpSync(`${cell.work}/out`, deliv, { recursive: true });
Object.assign(cell.meta, { end: nowIso(), status, calls: cell.calls.length, modelServed: [...new Set(cell.calls.map(c => c.modelServed).filter(Boolean))], tokens: cell.tokensKnown ? cell.tokens : null, usdReported: cell.totalUsd, premiumEstimated: cell.calls.reduce((s, c) => s + (c.premium || 0), 0), premiumMultiplierKnown: cell.calls.every(c => c.premiumKnown !== false), void: cell.void, deliverables: fs.readdirSync(deliv).map(f => ({ file: f, sha256: sha(fs.readFileSync(`${deliv}/${f}`)) })) });
fs.writeFileSync(`${cell.logs}/meta.json`, JSON.stringify(cell.meta, null, 2));
console.log(id, status, JSON.stringify(cell.meta.deliverables.map(d => d.file)));
process.exit(code);
