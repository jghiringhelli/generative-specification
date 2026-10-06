'use strict';
// The twelve substrate items, each judged "present AND working". Deterministic: no model is consulted.
// Status values: PASS (present and working) | PARTIAL (present, not working or incomplete) | ABSENT | UNDETERMINABLE (checker could not decide: environment fault).
const fs = require('fs');
const path = require('path');
const { sh, git, exists, read, tryRead, posix, relList, trackedFiles, sections, stripFences, fences, sectionHash, leadingId, refsIn, resolveRef } = require('./util');

const res = (id, name, status, reasons = [], evidence = {}, subflags = {}) => ({ id, name, status, reasons, evidence, subflags });
const rx = s => new RegExp(s, 'i');
const nonBlank = t => t.split('\n').filter(l => l.trim()).length;
const TEXT_EXT = /\.(md|json|ya?ml|js|mjs|cjs|ts|tsx|py|sh|toml|cfg|txt|lock)$/i;

// ---------- discovery shared by items ----------
function discover(ctx) {
  if (ctx.found) return ctx.found;
  const { root, cfg } = ctx; const tracked = trackedFiles(root);
  const f = { tracked };
  let sentinel = null;
  for (const c of cfg.sentinelCandidates) {
    const p = path.join(root, c);
    if (!exists(p)) continue;
    if (fs.statSync(p).isDirectory()) { const inner = relList(root, c, x => /\.(md|mdc|txt)$/.test(x)); if (inner.length) { sentinel = inner[0]; f.sentinelExtra = inner.slice(1); break; } } else { sentinel = c; break; }
  }
  f.sentinel = sentinel;
  const specs = new Set();
  for (const c of cfg.specCandidates) if (exists(path.join(root, c)) && fs.statSync(path.join(root, c)).isFile()) specs.add(c);
  for (const d of cfg.specDirs) for (const p of relList(root, d, x => /\.md$/i.test(x))) specs.add(p);
  f.specFiles = [...specs].sort();
  f.decisionDir = cfg.decisionDirs.find(d => exists(path.join(root, d)) && fs.statSync(path.join(root, d)).isDirectory()) || null;
  return (ctx.found = f);
}

// Follow "@path" imports (CLAUDE.md that only imports AGENTS.md) and collect text.
function sentinelText(ctx) {
  const f = discover(ctx); if (!f.sentinel) return null;
  const seen = new Set(); let text = ''; const queue = [f.sentinel, ...(f.sentinelExtra || [])];
  while (queue.length) {
    const rel = queue.shift(); if (seen.has(rel)) continue; seen.add(rel);
    const t = tryRead(path.join(ctx.root, rel)); if (t == null) continue;
    text += '\n' + t;
    for (const m of t.matchAll(/^@(\S+)\s*$/gm)) { const r = resolveRef(ctx.root, rel, m[1]); if (r) queue.push(r); }
  }
  return { text, files: [...seen] };
}

// ---------- E01 sentinel ----------
function e01(ctx) {
  const f = discover(ctx);
  if (!f.sentinel) return res('E01', 'sentinel routes to existing files', 'ABSENT', ['no sentinel file (CLAUDE.md, AGENTS.md, GEMINI.md, copilot-instructions.md, .cursor/rules)']);
  const s = sentinelText(ctx);
  if (nonBlank(s.text) < 5) return res('E01', 'sentinel routes to existing files', 'PARTIAL', ['sentinel is a stub (fewer than 5 non-blank lines)'], { sentinel: f.sentinel });
  const refs = [];
  for (const rel of s.files) refs.push(...refsIn(read(path.join(ctx.root, rel)), ctx.cfg).map(r => ({ from: rel, ref: r })));
  const resolved = [], dangling = [];
  for (const { from, ref } of refs) { const hit = resolveRef(ctx.root, from, ref); (hit ? resolved : dangling).push(hit || ref); }
  const uniq = a => [...new Set(a)];
  const nonEmpty = rel => { try { const st = fs.statSync(path.join(ctx.root, rel)); return st.isDirectory() ? fs.readdirSync(path.join(ctx.root, rel)).length > 0 : st.size > 0; } catch { return false; } };
  const allRoutes = uniq(resolved), empties = allRoutes.filter(r => !nonEmpty(r));
  const routes = allRoutes.filter(r => !empties.includes(r)), miss = uniq(dangling);
  const reasons = [];
  if (routes.length < ctx.cfg.minSentinelRoutes) reasons.push(`only ${routes.length} distinct existing files routed (need ${ctx.cfg.minSentinelRoutes})`);
  if (miss.length) reasons.push(`referenced but missing: ${miss.slice(0, 8).join(', ')}`);
  if (empties.length) reasons.push(`routed to empty files: ${empties.slice(0, 8).join(', ')}`);
  ctx.shared.sentinelRoutes = routes;
  return res('E01', 'sentinel routes to existing files', reasons.length ? 'PARTIAL' : 'PASS', reasons, { sentinel: f.sentinel, routes, dangling: miss });
}

// ---------- E02 spec with requirement ids and criterion ids ----------
function parseSpecDefs(ctx) {
  const f = discover(ctx); const defs = []; const cfg = ctx.cfg;
  for (const file of f.specFiles) {
    const text = read(path.join(ctx.root, file)); const lines = text.split('\n');
    let inFence = false; const stack = []; // heading stack
    lines.forEach((line, i) => {
      if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; return; }
      if (inFence) return;
      const h = line.match(/^(#{1,6})[ \t]+(.*?)\s*#*\s*$/);
      if (h) {
        const level = h[1].length; while (stack.length && stack[stack.length - 1].level >= level) stack.pop();
        stack.push({ level, title: h[2] });
        const id = leadingId(h[2], cfg.idToken); if (id) defs.push({ id, file, line: i + 1, kind: 'requirement', text: h[2] });
        return;
      }
      const id = leadingId(line, cfg.idToken); if (!id) return;
      const inCrit = stack.some(s => rx(cfg.criteriaHeading).test(s.title));
      const body = line.replace(/^\s*(?:[-*+]|\d+[.)])?\s*(?:\[[ xX~]\]\s*)?\|?\s*(?:\*\*|__|`)*/, '').replace(id, '');
      // continuation lines (indented) belong to the criterion
      let extra = ''; for (let j = i + 1; j < lines.length && /^[ \t]+\S/.test(lines[j]) && !leadingId(lines[j], cfg.idToken); j++) extra += ' ' + lines[j].trim();
      defs.push({ id, file, line: i + 1, kind: inCrit ? 'criterion' : 'requirement', text: (body + extra).trim() });
    });
  }
  return defs;
}
function e02(ctx) {
  const f = discover(ctx); const cfg = ctx.cfg;
  if (!f.specFiles.length) return res('E02', 'spec with unique requirement ids and criterion ids', 'ABSENT', ['no spec file (docs/spec/SPEC.md or files under docs/spec, docs/specs, docs/features)']);
  const defs = parseSpecDefs(ctx);
  const reqs = defs.filter(d => d.kind === 'requirement'), crit = defs.filter(d => d.kind === 'criterion');
  const seen = new Map(); const dups = [];
  for (const d of defs) { if (seen.has(d.id)) dups.push(d.id); else seen.set(d.id, d); }
  const words = t => t.split(/\s+/).filter(w => /[A-Za-zÀ-ɏ]{2,}/.test(w)).length;
  const thin = crit.filter(c => words(c.text) < cfg.minCriterionWords).map(c => c.id);
  const reasons = [];
  const sub = { '2a_requirement_ids': reqs.length >= 1, '2b_criterion_ids': crit.length >= cfg.minCriteria, ids_unique: dups.length === 0, criteria_testable_length: thin.length === 0 };
  if (!sub['2a_requirement_ids']) reasons.push('no requirement ids (an id at the start of a heading or list item outside the criteria sections)');
  if (!sub['2b_criterion_ids']) reasons.push(`${crit.length} criterion ids under a criteria heading (need ${cfg.minCriteria})`);
  if (dups.length) reasons.push(`duplicate ids: ${[...new Set(dups)].slice(0, 8).join(', ')}`);
  if (thin.length) reasons.push(`criteria too short to be testable: ${thin.slice(0, 8).join(', ')}`);
  ctx.shared.criteria = crit; ctx.shared.requirements = reqs;
  const anything = defs.length > 0;
  const status = reasons.length === 0 ? 'PASS' : (anything ? 'PARTIAL' : 'ABSENT');
  return res('E02', 'spec with unique requirement ids and criterion ids', status, anything ? reasons : ['spec present but defines no ids', ...reasons], { specFiles: f.specFiles, requirements: reqs.length, criteria: crit.length }, sub);
}

// ---------- E03 decision records ----------
function e03(ctx) {
  const f = discover(ctx); const cfg = ctx.cfg;
  if (!f.decisionDir) return res('E03', 'decision records exist and are referenced', 'ABSENT', ['no decision directory (docs/decisions, docs/adr, ...)']);
  const files = relList(ctx.root, f.decisionDir, x => /\.md$/i.test(x) && !/(^|\/)(readme|index|template)[^/]*$/i.test(x) && /(\d{3,4}|adr)/i.test(path.basename(x)));
  if (!files.length) return res('E03', 'decision records exist and are referenced', 'ABSENT', [`${f.decisionDir} has no numbered or dated record files`]);
  const reasons = []; const unstructured = [], unref = [];
  const others = f.tracked.filter(p => TEXT_EXT.test(p));
  const texts = new Map(others.map(p => [p, tryRead(path.join(ctx.root, p)) || '']));
  let referencedFromRoute = false;
  const routeSet = new Set([...(f.specFiles || []), f.sentinel, ...(ctx.shared.sentinelRoutes || [])].filter(Boolean));
  for (const file of files) {
    const secs = sections(read(path.join(ctx.root, file)));
    const hasCtx = secs.some(s => rx(cfg.decisionSections.context).test(s.title)), hasDec = secs.some(s => rx(cfg.decisionSections.decision).test(s.title));
    if (!(hasCtx && hasDec)) unstructured.push(file);
    const base = path.basename(file); const stem = base.replace(/\.md$/i, ''); const num = (base.match(/(\d{3,4})/) || [])[1];
    const adrId = num ? new RegExp(`ADR[- ]?0*${parseInt(num, 10)}(?!\\d)`, 'i') : null;
    let refd = false;
    for (const [p, t] of texts) {
      if (p === file) continue;
      if (t.includes(file) || t.includes(base) || t.includes(stem) || (adrId && adrId.test(t))) { refd = true; if (routeSet.has(p)) referencedFromRoute = true; }
    }
    if (!refd) unref.push(file);
  }
  if (unstructured.length) reasons.push(`records without context and decision sections: ${unstructured.slice(0, 5).join(', ')}`);
  if (unref.length) reasons.push(`records referenced by nothing else: ${unref.slice(0, 5).join(', ')}`);
  if (!referencedFromRoute) reasons.push('no record is referenced from the sentinel or the spec');
  return res('E03', 'decision records exist and are referenced', reasons.length ? 'PARTIAL' : 'PASS', reasons, { records: files }, {});
}

// ---------- E04 cascade documents reachable from the sentinel ----------
function reachableDocs(ctx, depth = 2) {
  const f = discover(ctx); if (!f.sentinel) return new Set();
  const seen = new Set(); let frontier = [f.sentinel];
  for (let d = 0; d <= depth; d++) {
    const next = [];
    for (const rel of frontier) {
      if (seen.has(rel)) continue; seen.add(rel);
      if (!/\.md$/i.test(rel)) continue;
      const t = tryRead(path.join(ctx.root, rel)); if (t == null) continue;
      for (const ref of refsIn(t, ctx.cfg)) { const r = resolveRef(ctx.root, rel, ref); if (r && !seen.has(r)) next.push(r); }
      for (const m of t.matchAll(/^@(\S+)\s*$/gm)) { const r = resolveRef(ctx.root, rel, m[1]); if (r) next.push(r); }
    }
    frontier = next;
  }
  return seen;
}
function e04(ctx) {
  const f = discover(ctx); const cfg = ctx.cfg;
  const mdAll = f.tracked.filter(p => /\.md$/i.test(p));
  const reach = reachableDocs(ctx);
  const specIds = new Set((ctx.shared.criteria || []).concat(ctx.shared.requirements || []).map(d => d.id));
  const specPaths = f.specFiles;
  const found = {}, existsNotRouted = {}, reasons = []; let any = false;
  for (const [kind, k] of Object.entries(cfg.cascadeKinds)) {
    const matches = md => rx(k.name).test(path.basename(md)) || sections(read(path.join(ctx.root, md))).some(s => rx(k.heading).test(s.title) && s.level <= 2);
    const good = md => nonBlank(read(path.join(ctx.root, md))) >= cfg.minCascadeDocLines;
    const cands = mdAll.filter(md => !/^(CLAUDE|AGENTS|GEMINI|README)\.md$/i.test(md) && !f.specFiles.includes(md) && matches(md) && good(md));
    if (cands.length) any = true;
    const routed = cands.find(c => reach.has(c));
    if (routed) {
      const t = read(path.join(ctx.root, routed));
      const derived = specPaths.some(sp => t.includes(sp) || t.includes(path.basename(sp))) || [...specIds].some(id => t.includes(id));
      found[kind] = { file: routed, derivedFromSpec: derived };
      if (!derived) reasons.push(`${kind}: ${routed} neither cites the spec nor any spec id`);
    } else if (cands.length) { existsNotRouted[kind] = cands[0]; reasons.push(`${kind}: ${cands[0]} exists but the sentinel does not route to it`); }
    else reasons.push(`${kind}: no document`);
  }
  if (!any) return res('E04', 'derived cascade (architecture, data model, conventions) routed from the sentinel', 'ABSENT', reasons, { found });
  const ok = Object.keys(cfg.cascadeKinds).every(k => found[k] && found[k].derivedFromSpec);
  ctx.shared.cascade = found;
  return res('E04', 'derived cascade (architecture, data model, conventions) routed from the sentinel', ok ? 'PASS' : 'PARTIAL', ok ? [] : reasons, { found, existsNotRouted }, { derived_is_proxy: true });
}

// ---------- shared dynamic setup (probe clone) ----------
function detectStack(root) {
  if (exists(path.join(root, 'package.json'))) return 'node';
  if (['pyproject.toml', 'requirements.txt', 'setup.py', 'pytest.ini', 'setup.cfg'].some(x => exists(path.join(root, x)))) return 'python';
  if (exists(path.join(root, 'go.mod'))) return 'go';
  return 'unknown';
}
function installCommands(ctx, sbx) {
  const readme = ctx.shared.readme;
  const fromReadme = readme ? readme.commands.filter(c => c.kind === 'install').map(c => c.cmd) : [];
  const stack = detectStack(sbx.root);
  const dflt = stack === 'node' ? ['npm install --no-audit --no-fund'] : stack === 'python' ? [exists(path.join(sbx.root, 'requirements.txt')) ? 'python -m pip install -q -r requirements.txt' : 'python -m pip install -q -e .'] : [];
  return { fromReadme, dflt, stack };
}
function testCommand(ctx, sbx) {
  const stack = detectStack(sbx.root);
  if (stack === 'node') { const p = tryRead(path.join(sbx.root, 'package.json')); try { const t = (JSON.parse(p).scripts || {}).test; if (t && !/no test specified/.test(t)) return 'npm test --silent'; } catch { /* ignore */ } }
  if (stack === 'python') return 'python -m pytest -q';
  if (stack === 'go') return 'go test ./...';
  const r = ctx.shared.readme; const c = r && r.commands.find(x => x.kind === 'test'); return c ? c.cmd : null;
}
function countTests(root, cfg) {
  const tf = trackedFiles(root).filter(p => new RegExp(cfg.testFilePattern).test(p) || cfg.testDirs.some(d => p.startsWith(d + '/')));
  let n = 0;
  for (const p of tf) { const t = tryRead(path.join(root, p)) || ''; n += (t.match(/^\s*(?:test|it)(?:\.\w+)?\s*\(|^\s*def test_|^\s*func Test\w+/gm) || []).length; }
  return { files: tf.length, cases: n };
}
// Prepare the probe clone once: install, record hooks, baseline clean-commit probe (C0).
function prepareProbe(ctx) {
  if (ctx.probe) return ctx.probe;
  const { Sandbox } = require('./sandbox');
  const sbx = new Sandbox(ctx.repo, ctx.cfg, 'probe'); ctx.sandboxes.push(sbx);
  const P = ctx.probe = { sbx, ok: false, notes: [], undeterminable: null };
  const c = sbx.clone(); if (!c.ok) { P.notes.push('clone failed'); P.undeterminable = 'clone failed: ' + (c.out || '').slice(0, 200); return P; }
  const ic = installCommands(ctx, sbx); P.stack = ic.stack; P.install = { via: null, results: [] };
  const tryInstall = (cmds, via) => {
    for (const cmd of cmds) {
      const r = sbx.run(cmd, ctx.cfg.timeouts.installMs); P.install.results.push({ cmd, code: r.code, tail: r.out.slice(-400) });
      if (r.timedOut) { P.undeterminable = `install timed out: ${cmd}`; return false; }
      if (r.code !== 0) { if (sbx.isNetworkFailure(r.out)) P.undeterminable = `install network failure: ${cmd}`; else if (/command not found|not recognized|ENOENT/.test(r.out) && !/package/.test(r.out)) P.undeterminable = `tool missing: ${cmd}`; return false; }
    }
    P.install.via = via; return true;
  };
  let okI = tryInstall(ic.fromReadme, 'readme');
  let hs = sbx.hooksState();
  if ((!okI || !hs.hooks.length) && !P.undeterminable && ic.dflt.length) { okI = tryInstall(ic.dflt, 'default'); hs = sbx.hooksState(); }
  P.installOk = okI || (!ic.fromReadme.length && !ic.dflt.length); P.hooks = hs;
  P.ok = true;
  // C0: a clean, conventional, docs-only change must be accepted
  const readme = ['README.md', 'readme.md'].find(x => exists(path.join(sbx.root, x))) || 'README.md';
  P.readmePath = readme;
  P.c0 = sbx.attemptCommit([{ path: readme, append: '\n<!-- fx1 clean probe -->\n' }], 'docs: fx1 clean probe change');
  sbx.reset();
  return P;
}
function confounded(P, id, name) {
  if (P.undeterminable) return res(id, name, 'UNDETERMINABLE', [P.undeterminable]);
  if (P.c0 && P.c0.blocked) return res(id, name, 'PARTIAL', ['a clean docs-only commit is blocked, so the probe is not informative (confounded by the baseline block)'], { c0: P.c0.out }, { confounded_by: 'baseline-commit-blocked' });
  return null;
}
const srcFile = (ctx, sbx) => {
  const exts = ctx.cfg.sourceExtensions; const tracked = trackedFiles(sbx.root);
  const isTest = p => new RegExp(ctx.cfg.testFilePattern).test(p) || ctx.cfg.testDirs.some(d => p.startsWith(d + '/'));
  const inSrc = tracked.filter(p => exts.includes(p.split('.').pop()) && !isTest(p) && ctx.cfg.sourceDirs.some(d => p.startsWith(d + '/')));
  const any = tracked.filter(p => exts.includes(p.split('.').pop()) && !isTest(p) && !p.startsWith('scripts/') && !p.startsWith('.'));
  return (inSrc[0] || any[0] || null);
};
// A planted violation must not be blocked by an unrelated gate (the co-change gate would block any source-only commit):
// cite a criterion id in the message and stage a doc change next to it, so only the violation itself can be the cause.
function coChangeSafe(ctx, sbx) {
  const f = discover(ctx);
  const id = (ctx.shared.criteria || [])[0] ? ctx.shared.criteria[0].id : (ctx.shared.requirements || [])[0] ? ctx.shared.requirements[0].id : null;
  const docFile = (ctx.shared.cascade && Object.values(ctx.shared.cascade)[0] && Object.values(ctx.shared.cascade)[0].file) || f.tracked.find(p => /^docs\/[^/]+\.md$/i.test(p));
  return { idSuffix: id ? ` (${id})` : '', docEdit: docFile ? { path: docFile, append: '\nfx1 probe note.\n' } : null };
}
const commentFor = (file, text) => (/\.(py|sh)$/.test(file) ? '# ' : '// ') + text;

// ---------- E05 tests plus an enforced blocking gate ----------
function e05(ctx) {
  const name = 'tests plus an enforced blocking gate';
  const P = prepareProbe(ctx); const un = P.undeterminable ? res('E05', name, 'UNDETERMINABLE', [P.undeterminable]) : null; if (un) return un;
  const sbx = P.sbx; const tc = countTests(sbx.root, ctx.cfg);
  if (tc.cases === 0) return res('E05', name, 'ABSENT', ['no tests found'], { tests: tc });
  const reasons = []; const sub = {};
  const cmd = testCommand(ctx, sbx);
  let testsPass = false;
  if (!cmd) reasons.push('no test command found');
  else {
    const r = sbx.run(cmd, ctx.cfg.timeouts.testMs);
    if (r.timedOut) return res('E05', name, 'UNDETERMINABLE', [`test run timed out: ${cmd}`]);
    if (r.code !== 0 && /command not found|not recognized|No module named pytest/.test(r.out)) return res('E05', name, 'UNDETERMINABLE', ['tool missing for the test command: ' + cmd]);
    testsPass = r.code === 0; if (!testsPass) reasons.push(`test command fails in a clean clone: ${cmd}`);
  }
  sub.tests_pass_in_clean_clone = testsPass; sub.test_cases = tc.cases; sub.test_cases_enough = tc.cases >= ctx.cfg.minTests;
  if (!sub.test_cases_enough) reasons.push(`${tc.cases} test cases (need ${ctx.cfg.minTests})`);
  sub.hooks = P.hooks.hooks; sub.hook_exec_bit_ok = P.hooks.execBitOk;
  if (P.hooks.execBitOk === false) reasons.push('an installed hook is not executable');
  // planted violations
  const stack = P.stack; const plantTest = stack === 'python' ? { path: 'tests/test_fx1_planted.py', write: 'def test_fx1_planted():\n    assert False, "fx1 planted failure"\n' } : { path: 'tests/fx1_planted.test.js', write: "throw new Error('fx1 planted failure');\n" };
  const src = srcFile(ctx, sbx);
  const plantSyntax = src ? { path: src, append: '\n)))((( fx1 planted syntax error\n' } : null;
  const safe = coChangeSafe(ctx, sbx);
  const withSafe = e => (safe.docEdit ? [e, safe.docEdit] : [e]);
  const pT = sbx.probe(withSafe(plantTest), 'test: fx1 planted failing test' + safe.idSuffix, { scripts: true });
  const pS = plantSyntax ? sbx.probe(withSafe(plantSyntax), 'fix: fx1 planted syntax error probe' + safe.idSuffix, { scripts: true }) : null;
  sub.blocked_output_tail = { test: (pT.commit && pT.commit.out || '').slice(-300), syntax: pS ? (pS.commit && pS.commit.out || '').slice(-300) : null };
  const c0 = P.c0;
  sub.planted_test_blocked_at = pT.blockedAt; sub.planted_syntax_blocked_at = pS ? pS.blockedAt : 'no-source-file';
  let enforced = pT.blockedAt === 'commit' || (pS && pS.blockedAt === 'commit');
  if (!enforced) { // push stage
    const pp = sbx.attemptPush(withSafe(plantTest), 'test: fx1 planted failing test push probe' + safe.idSuffix); sub.planted_test_blocked_at_push = pp.blocked;
    if (pp.blocked === true) enforced = true;
  }
  sub.enforced_at_commit_or_push = !!enforced;
  sub.clean_commit_accepted = !c0.blocked;
  // static CI note (informational only; CI is not executed)
  const wf = trackedFiles(sbx.root).filter(p => /^\.github\/workflows\/.+\.ya?ml$/.test(p));
  sub.ci_workflow_present = wf.length > 0; sub.ci_static_runs_tests = wf.some(p => /(npm (run )?test|pytest|go test|node --test|vitest|jest)/.test(read(path.join(sbx.root, p))));
  if (c0.blocked) reasons.push('the gate blocks a clean docs-only commit');
  if (!enforced) reasons.push('no commit-stage or push-stage gate blocked a planted failing test or syntax error' + (sub.ci_workflow_present ? ' (a CI workflow exists but cannot be executed here, so it is not credited)' : ''));
  const ok = testsPass && sub.test_cases_enough && enforced && !c0.blocked && P.hooks.execBitOk !== false;
  sbx.reset();
  return res('E05', name, ok ? 'PASS' : 'PARTIAL', ok ? [] : reasons, { tests: tc, hooks: P.hooks, install: P.install }, sub);
}

// ---------- E06 ratchet ----------
function numericLeaves(obj, prefix = '', out = []) {
  if (typeof obj === 'number') out.push({ key: prefix, value: obj });
  else if (obj && typeof obj === 'object') for (const [k, v] of Object.entries(obj)) numericLeaves(v, prefix ? `${prefix}.${k}` : k, out);
  return out;
}
function setLeaves(obj, fn, prefix = '') {
  if (typeof obj === 'number') return fn(prefix, obj);
  if (Array.isArray(obj)) return obj.map((v, i) => setLeaves(v, fn, `${prefix}.${i}`));
  if (obj && typeof obj === 'object') return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, setLeaves(v, fn, prefix ? `${prefix}.${k}` : k)]));
  return obj;
}
function e06(ctx) {
  const name = 'ratchet floor file exists and a regression is rejected'; const cfg = ctx.cfg;
  const f = discover(ctx);
  const cand = f.tracked.filter(p => rx(cfg.ratchetFileNames).test(path.basename(p)) && /\.(json|ya?ml|toml|cfg|txt)$/i.test(p) && !/package-lock|node_modules/.test(p));
  let file = null, leaves = [];
  for (const p of cand) { const t = tryRead(path.join(ctx.root, p)) || ''; if (/\.json$/i.test(p)) { try { const l = numericLeaves(JSON.parse(t)); if (l.length) { file = p; leaves = l; break; } } catch { /* skip */ } } else { const l = [...t.matchAll(/^\s*([\w.-]+)\s*[:=]\s*(-?\d+(?:\.\d+)?)\s*$/gm)].map(m => ({ key: m[1], value: +m[2] })); if (l.length) { file = p; leaves = l; break; } } }
  if (!file) return res('E06', name, 'ABSENT', ['no tracked file named like ratchet/baseline/floor with a numeric value']);
  const P = prepareProbe(ctx); const cf = confounded(P, 'E06', name); if (cf) return cf;
  const sbx = P.sbx; const lower = k => rx(cfg.lowerIsBetterKeys).test(k);
  const mutate = (fnHigher, fnLower) => {
    const p = path.join(sbx.root, file); const t = read(p);
    if (/\.json$/i.test(file)) return JSON.stringify(setLeaves(JSON.parse(t), (k, v) => (lower(k) ? fnLower(v) : fnHigher(v))), null, 2) + '\n';
    return t.replace(/^(\s*)([\w.-]+)(\s*[:=]\s*)(-?\d+(?:\.\d+)?)(\s*)$/gm, (m, a, k, c, v, e) => `${a}${k}${c}${lower(k) ? fnLower(+v) : fnHigher(+v)}${e}`);
  };
  const unattainable = mutate(v => (v <= 1 ? 2 : 1e9), () => -1);
  const pRaise = sbx.probe([{ path: file, write: unattainable }], 'chore: fx1 probe unattainable ratchet floor');
  const lowered = mutate(() => 0, () => 1e9);
  const pLower = sbx.probe([{ path: file, write: lowered }], 'chore: fx1 probe lower ratchet floor');
  sbx.reset();
  const sub = { floor_file: file, regression_rejected_at: pRaise.blockedAt, lowering_rejected_at: pLower.blockedAt, tracked: true };
  const ok = !!pRaise.blockedAt;
  return res('E06', name, ok ? 'PASS' : 'PARTIAL', ok ? [] : ['a floor file exists but making the floor unattainable was not rejected by any commit hook or script'], { floor_file: file, numeric_leaves: leaves.length }, sub);
}

// ---------- E07 open-questions gate ----------
function e07(ctx) {
  const name = 'open-questions gate fails with an open question'; const cfg = ctx.cfg; const f = discover(ctx);
  const P = prepareProbe(ctx); const cf = confounded(P, 'E07', name); if (cf) return cf;
  const sbx = P.sbx; const spec = f.specFiles[0];
  if (!spec) return res('E07', name, 'ABSENT', ['no spec file to plant an open question in']);
  const plant = marker => ({ path: spec, append: `\n\n## Planted open question\n\n${marker} should the planted question block this commit?\n` });
  let blockedMarker = null, blockedAt = null;
  for (const m of cfg.openMarkers) { const p = sbx.probe([plant(m)], 'docs: fx1 planted open question', { scripts: true }); if (p.blockedAt) { blockedMarker = m; blockedAt = p.blockedAt; break; } }
  sbx.reset();
  const evidence = f.tracked.filter(p => !/\.md$/i.test(p) && TEXT_EXT.test(p)).filter(p => cfg.openMarkers.some(m => (tryRead(path.join(ctx.root, p)) || '').includes(m)) || /open[-_]?questions/i.test(p));
  if (blockedMarker) return res('E07', name, 'PASS', [], { marker: blockedMarker }, { blocked_at: blockedAt, enforced_at_commit: blockedAt === 'commit' });
  return res('E07', name, evidence.length ? 'PARTIAL' : 'ABSENT', [evidence.length ? `a script or hook mentions open questions (${evidence.slice(0, 3).join(', ')}) but a planted marker did not fail it` : 'no gate: a planted open question was not rejected and nothing mentions one'], { evidence }, {});
}

// ---------- E08 criteria coverage ----------
// The id must be cited at a test definition: on the line of a test/it/describe/def test_/func Test line, or within 2 lines of one
// (decorator, docstring, a comment right above). A criterion id that appears only in a distant comment does not count.
function citedByATest(text, id) {
  const idRe = new RegExp(id.replace(/[-.]/g, '[-_.]') + '(?![A-Za-z0-9])', 'i');
  const lines = text.split('\n');
  const isDef = l => /^\s*(?:async\s+)?(?:test|it|describe)(?:\.\w+)?\s*\(|^\s*(?:async\s+)?def\s+test_|^\s*func\s+Test\w*|^\s*(?:async\s+)?function\s+test\w*/.test(l);
  for (let i = 0; i < lines.length; i++) if (isDef(lines[i])) for (let j = Math.max(0, i - 2); j <= Math.min(lines.length - 1, i + 2); j++) if (idRe.test(lines[j])) return true;
  return false;
}
function e08(ctx) {
  const name = 'criteria coverage: every criterion id has a coverage entry'; const cfg = ctx.cfg; const f = discover(ctx);
  const crit = ctx.shared.criteria || [];
  if (!crit.length) return res('E08', name, 'ABSENT', ['no criterion ids to cover (E02)'], {}, { depends_on: 'E02' });
  const covFiles = f.tracked.filter(p => cfg.coverageFileCandidates.includes(p) || (/^docs\//.test(p) && /coverage/i.test(path.basename(p)) && /\.(md|json)$/i.test(p)));
  const mapFiles = [...new Set([...covFiles, ...f.specFiles])];
  const pathTok = /(?:^|[\s`("'|])((?:[\w.-]+\/)*[\w.-]+\.[A-Za-z0-9]{1,5})(?=$|[\s`)"'|,;:#])/g;
  const lineBlocks = []; // (id, text) pairs: line mentioning id plus indented continuation
  for (const mf of mapFiles) { const lines = (tryRead(path.join(ctx.root, mf)) || '').split('\n'); lines.forEach((l, i) => { let t = l; for (let j = i + 1; j < lines.length && /^[ \t]+\S/.test(lines[j]); j++) t += ' ' + lines[j]; lineBlocks.push({ file: mf, text: t }); }); }
  const covered = [], uncovered = [];
  for (const c of crit) {
    let ok = false;
    for (const b of lineBlocks) {
      if (!new RegExp(`(^|[^\\w-])${c.id.replace(/[.]/g, '\\.')}(?![\\w-])`).test(b.text)) continue;
      for (const m of b.text.matchAll(pathTok)) {
        const hit = resolveRef(ctx.root, b.file, m[1]); if (!hit || f.specFiles.includes(hit) || hit === b.file) continue;
        if (citedByATest(tryRead(path.join(ctx.root, hit)) || '', c.id)) { ok = true; break; }
      }
      if (ok) break;
    }
    (ok ? covered : uncovered).push(c.id);
  }
  const sub = { coverage_files: covFiles, covered: covered.length, total: crit.length };
  if (!covered.length && !covFiles.length) return res('E08', name, 'ABSENT', ['no coverage file and no criterion points at a test that cites its id'], {}, sub);
  const ok = uncovered.length === 0;
  return res('E08', name, ok ? 'PASS' : 'PARTIAL', ok ? [] : [`${uncovered.length} of ${crit.length} criteria have no coverage entry pointing at an existing file that cites the id: ${uncovered.slice(0, 8).join(', ')}`], { uncovered }, sub);
}

// ---------- E09 commits ----------
function e09(ctx) {
  const name = 'atomic, descriptive, conventional commits'; const cfg = ctx.cfg; const root = ctx.root;
  const log = git(root, ['log', '--reverse', '--format=%H%x1f%s']).stdout.split('\n').filter(Boolean).map(l => { const [h, s] = l.split('\x1f'); return { h, s }; });
  if (!log.length) return res('E09', name, 'ABSENT', ['no commits']);
  const conv = new RegExp(cfg.conventionalCommit); const ign = new RegExp(cfg.atomicIgnoreFiles);
  const nonConv = log.filter(c => !conv.test(c.s));
  const generic = log.filter(c => cfg.genericSubjects.includes(c.s.trim().toLowerCase()) || c.s.trim().length < 10);
  const big = [];
  log.forEach((c, i) => {
    if (i < cfg.atomicExemptFirstN) return;
    const ns = git(root, ['show', '--numstat', '--format=', c.h]).stdout.split('\n').filter(Boolean).map(l => l.split('\t')).filter(a => a.length === 3 && !ign.test(a[2]));
    const files = ns.length, added = ns.reduce((s, a) => s + (parseInt(a[0], 10) || 0), 0);
    if (files > cfg.maxFilesPerCommit || added > cfg.maxAddedLinesPerCommit) big.push(`${c.h.slice(0, 7)} (${files} files, ${added} lines)`);
  });
  const share = 1 - nonConv.length / log.length; const reasons = [];
  if (log.length < cfg.minCommits) reasons.push(`${log.length} commits (need ${cfg.minCommits})`);
  if (share < cfg.minConventionalShare) reasons.push(`${nonConv.length} of ${log.length} subjects are not conventional: ${nonConv.slice(0, 3).map(c => JSON.stringify(c.s)).join(', ')}`);
  if (generic.length) reasons.push(`non-descriptive subjects: ${generic.slice(0, 3).map(c => JSON.stringify(c.s)).join(', ')}`);
  if (big.length / log.length > 1 - cfg.minConventionalShare) reasons.push(`non-atomic commits: ${big.slice(0, 3).join(', ')}`);
  return res('E09', name, reasons.length ? 'PARTIAL' : 'PASS', reasons, { commits: log.length, conventional_share: +share.toFixed(3), big }, {});
}

// ---------- E10 spec lock ----------
function e10(ctx) {
  const name = 'spec lock: tags resolve and the lock file matches'; const cfg = ctx.cfg; const f = discover(ctx);
  const tagRe = new RegExp(cfg.lock.tagRegex);
  const tags = [];
  for (const p of f.tracked.filter(x => TEXT_EXT.test(x) && x !== cfg.lock.file && !/^docs\/(spec|specs|features|decisions)\//.test(x))) {
    (tryRead(path.join(ctx.root, p)) || '').split('\n').forEach((line, i) => { const m = line.match(tagRe); if (m) tags.push({ file: p, line: i + 1, id: m[1], spec: m[2], section: m[3] }); });
  }
  const lockPath = path.join(ctx.root, cfg.lock.file); const hasLock = exists(lockPath);
  if (!tags.length && !hasLock) return res('E10', name, 'ABSENT', ['no @gs tags and no lock file']);
  const reasons = []; const S = new Map(), A = new Map();
  if (hasLock) for (const l of read(lockPath).split('\n')) { const p = l.split(' '); if (p[0] === 'S' && p.length === 3) S.set(p[1], p[2]); else if (p[0] === 'A' && p.length === 5) A.set(`${p[1]}|${p[2]}`, { target: p[3], hash: p[4] }); }
  else reasons.push('tags exist but there is no lock file');
  if (!tags.length) reasons.push('lock file exists but no @gs tags');
  const cur = target => { const [sp, sec] = target.split('#'); const t = tryRead(path.join(ctx.root, sp)); if (t == null) return { err: `${sp} missing` }; const s = sections(t).find(x => x.slug === sec); if (!s) return { err: `${sp} has no section ${sec}` }; return { hash: sectionHash(s.text, cfg.lock.hashLength) }; };
  for (const t of tags) { const c = cur(`${t.spec}#${t.section}`); if (c.err) reasons.push(`tag ${t.file}:${t.line} ${t.id}: ${c.err}`); else if (hasLock) { const a = A.get(`${t.file}|${t.id}`); if (!a) reasons.push(`tag ${t.file}:${t.line} ${t.id} has no lock entry`); else if (a.hash !== c.hash) reasons.push(`stale: ${t.file} ${t.id} derived against ${a.hash}, section is now ${c.hash}`); } }
  for (const [k, a] of A) { if (!tags.some(t => `${t.file}|${t.id}` === k)) reasons.push(`lock entry without a tag: ${k}`); }
  for (const [target, h] of S) { const c = cur(target); if (c.err) reasons.push(`lock section ${target}: ${c.err}`); else if (c.hash !== h) reasons.push(`lock section ${target} hash ${h} but section hashes to ${c.hash}`); }
  if (reasons.length) return res('E10', name, 'PARTIAL', reasons.slice(0, 12), { tags: tags.length, lockSections: S.size, lockArtifacts: A.size });
  // working: a changed locked section must be detected
  const P = prepareProbe(ctx); const cf = confounded(P, 'E10', name); if (cf) return cf;
  const sbx = P.sbx; const t0 = tags[0];
  const edit = { path: t0.spec, transform: txt => { const lines = txt.split('\n'); const secs = sections(txt); const s = secs.find(x => x.slug === t0.section); const at = s ? s.end : lines.length; lines.splice(at, 0, 'Fx1 probe: this sentence changes the locked section.'); return lines.join('\n'); } };
  const pr = sbx.probe([edit], 'docs: fx1 probe change to a locked spec section'); sbx.reset();
  const ok = !!pr.blockedAt;
  return res('E10', name, ok ? 'PASS' : 'PARTIAL', ok ? [] : ['tags and lock agree, but changing a locked section was not detected by any commit hook or script'], { tags: tags.length }, { stale_detected_at: pr.blockedAt });
}

// ---------- E11 co-change gate ----------
function e11(ctx) {
  const name = 'co-change gate: behaviour change needs a spec citation or doc change'; const f = discover(ctx);
  const P = prepareProbe(ctx); const cf = confounded(P, 'E11', name); if (cf) return cf;
  const sbx = P.sbx; const src = srcFile(ctx, sbx);
  if (!src) return res('E11', name, 'ABSENT', ['no source file to change']);
  const edit = { path: src, append: '\n' + commentFor(src, 'fx1 co-change probe') + '\n' };
  const p1 = sbx.probe([edit], 'feat: fx1 co-change probe without any citation');
  const critId = (ctx.shared.criteria || [])[0] ? ctx.shared.criteria[0].id : (ctx.shared.requirements || [])[0] ? ctx.shared.requirements[0].id : null;
  const p2a = critId ? sbx.attemptCommit([edit], `feat: fx1 co-change probe (${critId})`) : null;
  const docFile = (ctx.shared.cascade && Object.values(ctx.shared.cascade)[0] && Object.values(ctx.shared.cascade)[0].file) || f.tracked.find(p => /^docs\/[^/]+\.md$/i.test(p));
  const p2b = docFile ? sbx.attemptCommit([edit, { path: docFile, append: '\nfx1 co-change probe note.\n' }], 'feat: fx1 co-change probe with doc change') : null;
  sbx.reset();
  const sub = { source_only_blocked_at: p1.blockedAt, cited_commit_accepted: p2a ? !p2a.blocked : null, with_doc_accepted: p2b ? !p2b.blocked : null };
  const allowsSomething = (p2a && !p2a.blocked) || (p2b && !p2b.blocked);
  if (p1.blockedAt && allowsSomething) return res('E11', name, 'PASS', [], {}, sub);
  const ev = f.tracked.some(p => !/\.md$/i.test(p) && /co-?change|doc-?cascade|cascade/i.test((tryRead(path.join(ctx.root, p)) || '').slice(0, 20000)));
  if (p1.blockedAt && !allowsSomething) return res('E11', name, 'PARTIAL', ['the gate blocks the source change even with a spec citation or a doc change'], {}, sub);
  return res('E11', name, ev ? 'PARTIAL' : 'ABSENT', [ev ? 'something mentions a cascade or co-change, but a source-only change was not rejected' : 'a source-only change without citation or doc change was accepted and nothing mentions a co-change rule'], {}, sub);
}

// ---------- E12 README clean-clone steps ----------
const KIND = [
  ['install', /^(?:.*install[-_]?hooks.*|.*pre-commit install.*|git config core\.hooksPath.*)$|^(npm (i|install|ci)\b|yarn( install)?$|pnpm (i|install)\b|pip3? install|python3? -m pip install|poetry install|uv sync|go mod download|bundle install|cargo fetch)/],
  ['test', /(npm (run )?test\b|npm t\b|pytest|go test|cargo test|node --test|vitest|jest|make test|yarn test|pnpm test)/],
  ['build', /^(npm run build|make( build)?$|go build|cargo build|tsc\b)/]
];
function parseReadme(ctx) {
  const root = ctx.root; const rp = ['README.md', 'readme.md', 'README.rst', 'README'].find(x => exists(path.join(root, x)));
  if (!rp) return null;
  const text = read(path.join(root, rp)); const cfg = ctx.cfg;
  const secs = sections(text); const hint = rx(cfg.readme.headingHint);
  let blocks = [];
  const lines = text.split('\n');
  for (const s of secs.filter(s => hint.test(s.title))) blocks.push(...fences(lines.slice(s.start, s.end).join('\n')));
  if (!blocks.length) blocks = fences(text);
  const cmds = [];
  for (const b of blocks) {
    if (b.lang && !/^(sh|bash|shell|console|zsh|cmd|powershell|ps1|text|)$/i.test(b.lang)) continue;
    let acc = '';
    for (const raw of b.lines) {
      const l = raw.replace(/^\s*\$\s+/, '').replace(/\s+#.*$/, ''); if (!l.trim() || /^\s*#/.test(raw)) continue;
      if (/\\\s*$/.test(l)) { acc += l.replace(/\\\s*$/, ' '); continue; }
      const cmd = (acc + l).trim(); acc = '';
      if (/<[^>]+>|YOUR_|your-|\[.*\]/.test(cmd)) { cmds.push({ cmd, kind: 'skipped', why: 'placeholder' }); continue; }
      if (/^git clone\b/.test(cmd)) { cmds.push({ cmd, kind: 'skipped', why: 'clone' }); continue; }
      if (/^cd\s/.test(cmd)) { const d = cmd.replace(/^cd\s+/, '').trim(); if (!exists(path.join(root, d))) { cmds.push({ cmd, kind: 'skipped', why: 'cd into the clone folder' }); continue; } }
      const kind = (KIND.find(([, re]) => re.test(cmd)) || ['run'])[0];
      cmds.push({ cmd, kind });
    }
  }
  return { path: rp, commands: cmds };
}
function e12(ctx) {
  const name = 'README clean-clone steps actually work'; const cfg = ctx.cfg;
  const rd = ctx.shared.readme = parseReadme(ctx);
  if (!rd) return res('E12', name, 'ABSENT', ['no README']);
  const runnable = rd.commands.filter(c => c.kind !== 'skipped');
  if (!runnable.length) return res('E12', name, 'ABSENT', ['README has no runnable command block'], { skipped: rd.commands });
  const { Sandbox } = require('./sandbox'); const sbx = new Sandbox(ctx.repo, cfg, 'readme'); ctx.sandboxes.push(sbx);
  const c = sbx.clone(); if (!c.ok) return res('E12', name, 'UNDETERMINABLE', ['clone failed']);
  const results = []; const reasons = [];
  for (const k of runnable) {
    const isRun = k.kind === 'run';
    const r = sbx.run(k.cmd, isRun ? cfg.timeouts.serveSmokeMs : (k.kind === 'test' ? cfg.timeouts.testMs : cfg.timeouts.installMs));
    const ok = r.code === 0 || (isRun && r.timedOut);
    results.push({ cmd: k.cmd, kind: k.kind, ok, code: r.code, timedOut: r.timedOut, tail: r.out.slice(-300) });
    if (!ok) {
      if (!isRun && r.timedOut) return res('E12', name, 'UNDETERMINABLE', [`timed out: ${k.cmd}`], { results });
      if (sbx.isNetworkFailure(r.out)) return res('E12', name, 'UNDETERMINABLE', [`network failure: ${k.cmd}`], { results });
      reasons.push(`fails in a clean clone: ${k.cmd} (exit ${r.code})`);
      if (k.kind === 'install') break; // later steps depend on it
    }
  }
  const kinds = new Set(runnable.map(k => k.kind));
  for (const need of cfg.readme.mustContain) if (!kinds.has(need)) reasons.push(`README has no ${need} command`);
  return res('E12', name, reasons.length ? 'PARTIAL' : 'PASS', reasons, { results, skipped: rd.commands.filter(c => c.kind === 'skipped') }, {});
}

const ORDER = [['E12', e12], ['E01', e01], ['E02', e02], ['E03', e03], ['E04', e04], ['E05', e05], ['E06', e06], ['E07', e07], ['E08', e08], ['E09', e09], ['E10', e10], ['E11', e11]];
module.exports = { ORDER, discover, parseSpecDefs };
