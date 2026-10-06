'use strict';
// The twelve substrate items, each judged "present AND working". Deterministic: no model is consulted.
// Status values: PASS (present and working) | PARTIAL (present, not working or incomplete) | ABSENT | UNDETERMINABLE (checker could not decide: environment fault).
// Every enforcement probe is paired with a clean control that differs only in the violation (a block counts only if the control is accepted).
const fs = require('fs');
const path = require('path');
const { sh, git, exists, read, tryRead, posix, relList, trackedFiles, sections, stripFences, fences, sectionHash, leadingId, refsIn, resolveRef, slug } = require('./util');

const res = (id, name, status, reasons = [], evidence = {}, subflags = {}) => ({ id, name, status, reasons, evidence, subflags });
const rx = s => new RegExp(s, 'i');
const nonBlank = t => t.split('\n').filter(l => l.trim()).length;
const TEXT_EXT = /\.(md|json|ya?ml|js|mjs|cjs|ts|tsx|py|sh|toml|cfg|txt|lock)$/i;
const ghSlug = s => s.toLowerCase().replace(/[^\p{L}\p{N} -]/gu, '').trim().replace(/\s/g, '-');
const BLOCKED = r => !!r.blockedAt;

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
  f.specFiles = [...specs].filter(p => !/coverage|cobertura/i.test(path.basename(p))).sort(); // a coverage table inside the spec folder is not a spec
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
  const name = 'sentinel routes to existing files';
  if (!f.sentinel) return res('E01', name, 'ABSENT', ['no sentinel file (CLAUDE.md, AGENTS.md, GEMINI.md, copilot-instructions.md, .cursor/rules)']);
  const s = sentinelText(ctx);
  if (nonBlank(s.text) < 5) return res('E01', name, 'PARTIAL', ['sentinel is a stub (fewer than 5 non-blank lines)'], { sentinel: f.sentinel });
  const resolved = [], dangling = [];
  for (const rel of s.files) {
    for (const { ref, soft } of refsIn(read(path.join(ctx.root, rel)), ctx.cfg)) {
      const hit = resolveRef(ctx.root, rel, ref);
      // (dev loop, defect C6) a path the repository itself git-ignores (data files, build output) is created at run time: naming it is not a dangling route
      if (hit) resolved.push(hit); else if (!soft && git(ctx.root, ['check-ignore', '-q', ref]).code !== 0) dangling.push(ref);
    }
  }
  const uniq = a => [...new Set(a)];
  const nonEmpty = rel => { try { const st = fs.statSync(path.join(ctx.root, rel)); return st.isDirectory() ? fs.readdirSync(path.join(ctx.root, rel)).length > 0 : st.size > 0; } catch { return false; } };
  const all = uniq(resolved), empties = all.filter(r => !nonEmpty(r));
  const routes = all.filter(r => !empties.includes(r)), miss = uniq(dangling);
  const docRoutes = routes.filter(r => /\.(md|mdx|txt|rst)$/i.test(r) || /^(docs?|adr|decisions)(\/|$)/i.test(r));
  const routesSpec = !f.specFiles.length || routes.some(r => f.specFiles.includes(r) || f.specFiles.some(sp => sp.startsWith(r.replace(/\/?$/, '/'))));
  const reasons = [];
  if (docRoutes.length < ctx.cfg.minSentinelRoutes) reasons.push(`only ${docRoutes.length} distinct non-empty documentation files or folders routed (need ${ctx.cfg.minSentinelRoutes})`);
  if (!routesSpec) reasons.push('the sentinel routes nowhere near the spec');
  if (miss.length) reasons.push(`referenced but missing: ${miss.slice(0, 8).join(', ')}`);
  if (empties.length) reasons.push(`routed to empty files: ${empties.slice(0, 8).join(', ')}`);
  ctx.shared.sentinelRoutes = routes;
  return res('E01', name, reasons.length ? 'PARTIAL' : 'PASS', reasons, { sentinel: f.sentinel, routes, dangling: miss });
}

// ---------- E02 spec with requirement ids and criterion ids ----------
const CRIT_SHAPE = /-\d+\.\d+$/;
function parseSpecDefs(ctx) {
  const f = discover(ctx); const defs = []; const cfg = ctx.cfg;
  for (const file of f.specFiles) {
    const text = read(path.join(ctx.root, file)); const lines = text.split('\n');
    let inFence = false; const stack = []; // heading stack; a bold label on its own line acts as a level-7 heading
    const push = (level, title) => { while (stack.length && stack[stack.length - 1].level >= level) stack.pop(); stack.push({ level, title }); };
    lines.forEach((line, i) => {
      if (/^\s*(```|~~~)/.test(line)) { inFence = !inFence; return; }
      if (inFence) return;
      const h = line.match(/^(#{1,6})[ \t]+(.*?)\s*#*\s*$/);
      const b = !h && line.match(/^\*\*([^*]+?)\*\*:?\s*$/);
      if (h || b) {
        push(h ? h[1].length : 7, h ? h[2] : b[1]);
        const id = h ? leadingId(h[2], cfg.idToken) : null;
        if (id) defs.push({ id, file, line: i + 1, kind: (stack.slice(0, -1).some(s => rx(cfg.criteriaHeading).test(s.title)) || CRIT_SHAPE.test(id)) ? 'criterion' : 'requirement', text: h[2], heading: true });
        return;
      }
      const id = leadingId(line, cfg.idToken); if (!id) return;
      // (dev loop 2026-10-06, defect C2) a dotted numeric id (F-001.2) is a criterion wherever it sits: the formulas do not ask for a criteria heading
      const inCrit = stack.some(s => rx(cfg.criteriaHeading).test(s.title)) || CRIT_SHAPE.test(id);
      const body = line.replace(/^\s*(?:[-*+]|\d+[.)])?\s*(?:\[[ xX~]\]\s*)?\|?\s*(?:\*\*|__|`)*/, '').replace(id, '');
      let extra = ''; for (let j = i + 1; j < lines.length && /^[ \t]+\S/.test(lines[j]) && !leadingId(lines[j], cfg.idToken); j++) extra += ' ' + lines[j].trim();
      defs.push({ id, file, line: i + 1, kind: inCrit ? 'criterion' : 'requirement', text: (body + extra).trim() });
    });
  }
  return defs;
}
function e02(ctx) {
  const f = discover(ctx); const cfg = ctx.cfg;
  const name = 'spec with unique requirement ids and criterion ids';
  if (!f.specFiles.length) return res('E02', name, 'ABSENT', ['no spec file (docs/spec/SPEC.md or files under docs/spec, docs/specs, docs/features)']);
  const defs = parseSpecDefs(ctx);
  const reqs = defs.filter(d => d.kind === 'requirement'), crit = defs.filter(d => d.kind === 'criterion');
  // (dev loop 2026-10-06, defect C2) The root file (SPEC.md) lists the features, so an id its listing repeats from a feature file is not a duplicate; two
  // feature files, or one file defining an id twice, are. A list or table line that restates a requirement id is not a definition (only a heading is).
  const isRoot = file => /^docs\/spec\/spec\.md$|^docs\/spec\.md$|^spec\.md$/i.test(file);
  const seen = new Map(); const dups = [];
  for (const d of defs) {
    if (!seen.has(d.id)) { seen.set(d.id, d); continue; }
    const first = seen.get(d.id);
    if (d.kind === 'requirement' && (isRoot(d.file) || isRoot(first.file)) && d.file !== first.file) continue;
    if (d.kind === 'requirement' && !d.heading && !first.heading) continue;
    dups.push(d.id);
  }
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
  return res('E02', name, status, anything ? reasons : ['spec present but defines no ids', ...reasons], { specFiles: f.specFiles, requirements: reqs.length, criteria: crit.length }, sub);
}

// ---------- E03 decision records ----------
function e03(ctx) {
  const f = discover(ctx); const cfg = ctx.cfg; const name = 'decision records exist and are referenced';
  if (!f.decisionDir) return res('E03', name, 'ABSENT', ['no decision directory (docs/decisions, docs/adr, ...)']);
  const files = relList(ctx.root, f.decisionDir, x => /\.md$/i.test(x) && !/(^|\/)(readme|index|template)[^/]*$/i.test(x));
  if (!files.length) return res('E03', name, 'ABSENT', [`${f.decisionDir} has no record files`]);
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
  return res('E03', name, reasons.length ? 'PARTIAL' : 'PASS', reasons, { records: files }, {});
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
      for (const { ref } of refsIn(t, ctx.cfg)) { const r = resolveRef(ctx.root, rel, ref); if (r && !seen.has(r)) next.push(r); }
      for (const m of t.matchAll(/^@(\S+)\s*$/gm)) { const r = resolveRef(ctx.root, rel, m[1]); if (r) next.push(r); }
    }
    frontier = next;
  }
  return seen;
}
const NO_DATA = /no (stored |persistent |persisted )?data\b|stores? no data|nothing is stored|sin datos (almacenados|persistentes)|no se (almacenan|guardan|persisten) datos|no hay datos almacenados/i;
function declaresNoData(ctx, reach) {
  const f = discover(ctx);
  const files = [...new Set([...(f.sentinel ? [f.sentinel] : []), ...[...reach].filter(r => /(^|\/)(architecture|arquitectura)[^/]*\.md$/i.test(r))])];
  return files.some(p => NO_DATA.test(tryRead(path.join(ctx.root, p)) || ''));
}
function e04(ctx) {
  const f = discover(ctx); const cfg = ctx.cfg; const name = 'derived cascade (architecture, data model, conventions) routed from the sentinel';
  const mdAll = f.tracked.filter(p => /\.md$/i.test(p));
  const reach = reachableDocs(ctx);
  const specIds = new Set((ctx.shared.criteria || []).concat(ctx.shared.requirements || []).map(d => d.id));
  const found = {}, existsNotRouted = {}, reasons = []; let any = false; const used = new Set();
  for (const [kind, k] of Object.entries(cfg.cascadeKinds)) {
    const matches = md => rx(k.name).test(path.basename(md)) || sections(read(path.join(ctx.root, md))).some(s => rx(k.heading).test(s.title) && s.level <= 2);
    const good = md => nonBlank(read(path.join(ctx.root, md))) >= cfg.minCascadeDocLines;
    const cands = mdAll.filter(md => !/^(CLAUDE|AGENTS|GEMINI|README)\.md$/i.test(md) && !f.specFiles.includes(md) && !used.has(md) && matches(md) && good(md));
    if (cands.length) any = true;
    const routed = cands.find(c => reach.has(c));
    if (routed) {
      used.add(routed); // three distinct documents: one file cannot stand in for all three kinds
      const t = read(path.join(ctx.root, routed));
      const derived = f.specFiles.some(sp => t.includes(sp)) || [...specIds].some(id => t.includes(id)); // full spec path or one of its ids, never a bare file name
      found[kind] = { file: routed, derivedFromSpec: derived };
      if (!derived) reasons.push(`${kind}: ${routed} neither cites the spec path nor any spec id`);
    } else if (cands.length) { existsNotRouted[kind] = cands[0]; reasons.push(`${kind}: ${cands[0]} exists but the sentinel does not route to it`); }
    else if (kind === 'dataModel' && declaresNoData(ctx, reach)) found[kind] = { file: null, declared: 'no stored data', derivedFromSpec: true }; // (dev loop, defect C5) the formulas allow "no stored data" in architecture.md instead of a data-model document
    else reasons.push(`${kind}: no (further) document`);
  }
  if (!any) return res('E04', name, 'ABSENT', reasons, { found });
  const ok = Object.keys(cfg.cascadeKinds).every(k => found[k] && found[k].derivedFromSpec);
  ctx.shared.cascade = found;
  return res('E04', name, ok ? 'PASS' : 'PARTIAL', ok ? [] : reasons, { found, existsNotRouted }, { derived_is_proxy: true });
}

// ---------- shared dynamic setup (probe clone) ----------
function detectStack(root) {
  if (exists(path.join(root, 'package.json'))) return 'node';
  if (['pyproject.toml', 'requirements.txt', 'requirements-dev.txt', 'setup.py', 'pytest.ini', 'setup.cfg'].some(x => exists(path.join(root, x)))) return 'python';
  if (exists(path.join(root, 'go.mod'))) return 'go';
  return 'unknown';
}
function installCommands(ctx, sbx) {
  const readme = ctx.shared.readme;
  const fromReadme = readme ? readme.commands.filter(c => c.kind === 'install').map(c => c.pre + c.cmd) : [];
  const stack = detectStack(sbx.root);
  const dflt = stack === 'node' ? ['npm install --no-audit --no-fund'] : stack === 'python' ? [exists(path.join(sbx.root, 'requirements.txt')) ? 'python -m pip install -q -r requirements.txt' : exists(path.join(sbx.root, 'requirements-dev.txt')) ? 'python -m pip install -q -r requirements-dev.txt' : 'python -m pip install -q -e .'] : [];
  return { fromReadme, dflt, stack };
}
function testCommand(ctx, sbx) {
  const stack = detectStack(sbx.root);
  if (stack === 'node') { const p = tryRead(path.join(sbx.root, 'package.json')); try { const t = (JSON.parse(p).scripts || {}).test; if (t && !/no test specified/.test(t)) return 'npm test --silent'; } catch { /* ignore */ } }
  if (stack === 'python') return 'python -m pytest -q';
  if (stack === 'go') return 'go test ./...';
  const r = ctx.shared.readme; const c = r && r.commands.find(x => x.kind === 'test'); return c ? c.pre + c.cmd : null;
}
// Executed (non-skipped, non-todo) test cases, counted statically.
const SKIPPED = /^\s*(?:test|it|describe)\.(?:todo|skip)\s*\(|^\s*x(?:it|test|describe)\s*\(|@pytest\.mark\.skip|^\s*@unittest\.skip/;
function countTests(root, cfg) {
  const tf = trackedFiles(root).filter(p => new RegExp(cfg.testFilePattern).test(p) || cfg.testDirs.some(d => p.startsWith(d + '/')));
  let n = 0;
  for (const p of tf) {
    const lines = (tryRead(path.join(root, p)) || '').split('\n');
    lines.forEach((l, i) => { if (/^\s*(?:test|it)(?:\.\w+)?\s*\(|^\s*def test_|^\s*func Test\w+/.test(l) && !SKIPPED.test(l) && !(i > 0 && /@pytest\.mark\.skip/.test(lines[i - 1]))) n++; });
  }
  return { files: tf.length, cases: n };
}
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
      if (r.code !== 0) { if (sbx.isNetworkFailure(r.out)) P.undeterminable = `install network failure: ${cmd}`; return false; }
    }
    P.install.via = via; return true;
  };
  let okI = tryInstall(ic.fromReadme, 'readme');
  let hs = sbx.hooksState();
  if ((!okI || !hs.hooks.length) && !P.undeterminable && ic.dflt.length) { okI = tryInstall(ic.dflt, 'default'); hs = sbx.hooksState(); }
  P.installOk = okI || (!ic.fromReadme.length && !ic.dflt.length); P.hooks = hs;
  P.ok = true;
  // C0: a clean, conventional, docs-only change must be accepted. If a plain message is refused, retry with a requirement id in the message
  // (a legitimate traceability policy); all later probes then use the accepted message style.
  const readme = ['README.md', 'readme.md'].find(x => exists(path.join(sbx.root, x))) || 'README.md';
  P.readmePath = readme;
  P.c0 = sbx.attemptCommit([{ path: readme, append: '\n<!-- fx1 clean probe -->\n' }], 'docs: fx1 clean probe change', { raw: true });
  if (P.c0.blocked) {
    const id = ((ctx.shared.criteria || [])[0] || (ctx.shared.requirements || [])[0] || {}).id;
    if (id) { const c1 = sbx.attemptCommit([{ path: readme, append: '\n<!-- fx1 clean probe -->\n' }], `docs: fx1 clean probe change (${id})`, { raw: true }); if (!c1.blocked) { P.c0 = c1; P.c0.retriedWithId = true; sbx.msgSuffix = ` (${id})`; } }
  }
  sbx.reset();
  return P;
}
function confounded(P, id, name) {
  if (P.undeterminable) return res(id, name, 'UNDETERMINABLE', [P.undeterminable]);
  if (P.c0 && P.c0.blocked) {
    if (P.c0.network) return res(id, name, 'UNDETERMINABLE', ['a network failure blocked the baseline commit (a hook fetched something)']);
    return res(id, name, 'PARTIAL', ['a clean docs-only commit is blocked, so the probe is not informative (confounded by the baseline block)'], { c0: P.c0.out }, { confounded_by: 'baseline-commit-blocked' });
  }
  return null;
}
const isTestPath = (cfg, p) => new RegExp(cfg.testFilePattern).test(p) || cfg.testDirs.some(d => p.startsWith(d + '/'));
// The source file to plant violations in: one that the tests import, never a config file.
function srcFile(ctx, sbx) {
  const cfg = ctx.cfg; const exts = cfg.sourceExtensions; const tracked = trackedFiles(sbx.root);
  const excl = new RegExp(cfg.sourceExcludePattern);
  const code = tracked.filter(p => exts.includes(p.split('.').pop()) && !isTestPath(cfg, p) && !excl.test(p) && !p.startsWith('scripts/') && !p.startsWith('.') && !p.startsWith('docs/'));
  const testText = tracked.filter(p => isTestPath(cfg, p)).map(p => tryRead(path.join(sbx.root, p)) || '').join('\n');
  const imported = code.filter(p => { const stem = path.basename(p).replace(/\.[^.]+$/, ''); return stem && new RegExp(`(require|import|from)[^\\n]*\\b${stem.replace(/[-.]/g, '[-_.]')}\\b`).test(testText); });
  const inSrc = code.filter(p => cfg.sourceDirs.some(d => p.startsWith(d + '/')));
  return imported[0] || inSrc[0] || code[0] || null;
}
const commentFor = (file, text) => (/\.(py|sh)$/.test(file) ? '# ' : '// ') + text;
// A planted violation must not be blocked by an unrelated gate: cite a requirement id and stage a doc change that is neither a spec nor locked.
function coChangeSafe(ctx) {
  const f = discover(ctx);
  const id = (ctx.shared.criteria || [])[0] ? ctx.shared.criteria[0].id : (ctx.shared.requirements || [])[0] ? ctx.shared.requirements[0].id : null;
  const okDoc = p => /^docs\/[^/]+\.md$/i.test(p) && !/spec|decision|lock|ratchet|coverage/i.test(p) && !f.specFiles.includes(p);
  const cascadeDoc = ctx.shared.cascade && Object.values(ctx.shared.cascade).map(v => v.file).find(okDoc);
  const docFile = cascadeDoc || f.tracked.find(okDoc);
  return { idSuffix: id ? ` (${id})` : '', docEdit: docFile ? { path: docFile, append: '\nfx1 probe note.\n' } : null };
}
// Trailing new spec section (an unlocked region), with or without an open-question marker.
const trailing = (spec, marker) => ({ path: spec, append: `\n\n## Planted note\n\n${marker ? marker + ' ' : ''}should the planted note block this commit?\n` });

// ---------- E05 tests plus an enforced blocking gate ----------
function e05(ctx) {
  const name = 'tests plus an enforced blocking gate';
  const P = prepareProbe(ctx); if (P.undeterminable) return res('E05', name, 'UNDETERMINABLE', [P.undeterminable]);
  const sbx = P.sbx; const tc = countTests(sbx.root, ctx.cfg);
  if (tc.cases === 0) return res('E05', name, 'ABSENT', ['no executed (non-skipped, non-todo) test cases found'], { tests: tc });
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
  if (!sub.test_cases_enough) reasons.push(`${tc.cases} executed test cases (need ${ctx.cfg.minTests})`);
  sub.hooks = P.hooks.hooks; sub.hook_exec_bit_ok = P.hooks.execBitOk;
  if (P.hooks.execBitOk === false) reasons.push('an installed hook is not executable');
  const cf = confounded(P, 'E05', name); if (cf) { cf.subflags = { ...sub, ...cf.subflags }; if (cf.status === 'PARTIAL') cf.reasons = [...cf.reasons.slice(0, 1), ...reasons]; return cf; }
  const stack = P.stack; const py = stack === 'python';
  const safe = coChangeSafe(ctx); const withSafe = e => (safe.docEdit ? [e, safe.docEdit] : [e]);
  // paired clean control: the safe doc edit alone (with the same message style) must be accepted, otherwise the block below could be caused by it
  const pair = safe.docEdit ? sbx.attemptCommit([safe.docEdit], 'docs: fx1 safe edit control' + safe.idSuffix) : P.c0;
  sub.safe_edit_alone_accepted = !pair.blocked;
  const plantNew = py ? { path: 'tests/test_fx1_planted.py', write: 'def test_fx1_planted():\n    assert False, "fx1 planted failure"\n' } : { path: 'tests/fx1_planted.test.js', write: "throw new Error('fx1 planted failure');\n" };
  const existing = trackedFiles(sbx.root).find(p => isTestPath(ctx.cfg, p) && /\.(js|mjs|cjs|ts|py)$/.test(p));
  const plantAppend = existing ? { path: existing, append: py ? '\n\ndef test_fx1_planted_append():\n    assert False, "fx1 planted failure"\n' : "\nthrow new Error('fx1 planted failure');\n" } : null;
  const msgT = 'test: fx1 planted failing test' + safe.idSuffix;
  let pT = sbx.probe(withSafe(plantNew), msgT, { scripts: true });
  if (!BLOCKED(pT) && plantAppend) pT = sbx.probe(withSafe(plantAppend), msgT, { scripts: true });
  const src = srcFile(ctx, sbx);
  const pS = src ? sbx.probe(withSafe({ path: src, append: '\n)))((( fx1 planted syntax error\n' }), 'fix: fx1 planted syntax error probe' + safe.idSuffix, { scripts: true }) : null;
  sub.planted_test_blocked_at = pT.blockedAt; sub.planted_syntax_blocked_at = pS ? pS.blockedAt : 'no-source-file';
  sub.blocked_output_names_probe = /fx1/i.test((pT.commit && pT.commit.out || '') + (pT.push && pT.push.out || ''));
  sub.blocked_output_tail = { test: (pT.commit && pT.commit.out || '').slice(-300), syntax: pS ? (pS.commit && pS.commit.out || '').slice(-300) : null };
  const enforced = pT.blockedAt === 'commit' || pT.blockedAt === 'push'; // the failing test must be stopped before it reaches the shared branch; a syntax-only gate does not run the tests
  sub.enforced_at_commit_or_push = enforced;
  sub.clean_commit_accepted = !P.c0.blocked;
  const wf = trackedFiles(sbx.root).filter(p => /^\.github\/workflows\/.+\.ya?ml$/.test(p));
  sub.ci_workflow_present = wf.length > 0; sub.ci_static_runs_tests = wf.some(p => /(npm (run )?test|pytest|go test|node --test|vitest|jest)/.test(read(path.join(sbx.root, p))));
  if (pair.blocked) reasons.push('the doc edit used to keep unrelated gates quiet is itself blocked, so a block below is not attributable');
  if (!enforced) reasons.push('no commit-stage or push-stage gate blocked a planted failing test' + (sub.ci_workflow_present ? ' (a CI workflow exists but cannot be executed here, so it is not credited)' : '') + (pS && pS.blockedAt ? '; a syntax error was blocked, so only a lint-level gate exists' : ''));
  const ok = testsPass && sub.test_cases_enough && enforced && !pair.blocked && !P.c0.blocked && P.hooks.execBitOk !== false;
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
  const name = 'ratchet floor file exists, a regression is rejected and the floor cannot be lowered'; const cfg = ctx.cfg;
  const f = discover(ctx);
  const cand = f.tracked.filter(p => rx(cfg.ratchetFileNames).test(path.basename(p)) && /\.(json|ya?ml|toml|cfg|txt)$/i.test(p) && !/package-lock|node_modules/.test(p)).sort((a, b) => (/^docs\//.test(b) ? 1 : 0) - (/^docs\//.test(a) ? 1 : 0));
  let file = null, leaves = [];
  for (const p of cand) { const t = tryRead(path.join(ctx.root, p)) || ''; if (/\.json$/i.test(p)) { try { const l = numericLeaves(JSON.parse(t)); if (l.length) { file = p; leaves = l; break; } } catch { /* skip */ } } else { const l = [...t.matchAll(/^\s*([\w.-]+)\s*[:=]\s*(-?\d+(?:\.\d+)?)\s*$/gm)].map(m => ({ key: m[1], value: +m[2] })); if (l.length) { file = p; leaves = l; break; } } }
  if (!file) return res('E06', name, 'ABSENT', ['no tracked file named like ratchet/baseline/floor with a numeric value']);
  const P = prepareProbe(ctx); const cf = confounded(P, 'E06', name); if (cf) return cf;
  const sbx = P.sbx; const lowerKey = k => rx(cfg.lowerIsBetterKeys).test(k);
  const mutate = (dir, kind) => { // dir: 'higher' = higher is better; kind: 'unattainable' | 'lowered'
    const f2 = (k, v, hb) => (kind === 'unattainable' ? (hb ? (v <= 1 ? 2 : 1e9) : -1) : (hb ? 0 : 1e9));
    const hb = k => (dir === 'mixed' ? !lowerKey(k) : dir === 'higher');
    const p = path.join(sbx.root, file); const t = read(p);
    if (/\.json$/i.test(file)) return JSON.stringify(setLeaves(JSON.parse(t), (k, v) => f2(k, v, hb(k))), null, 2) + '\n';
    return t.replace(/^(\s*)([\w.-]+)(\s*[:=]\s*)(-?\d+(?:\.\d+)?)(\s*)$/gm, (m, a, k, c, v, e) => `${a}${k}${c}${f2(k, +v, hb(k))}${e}`);
  };
  let result = null;
  for (const dir of ['mixed', 'higher', 'lower']) { // key-name guess first, then both blanket directions
    const pRaise = sbx.probe([{ path: file, write: mutate(dir, 'unattainable') }], 'chore: fx1 probe unattainable ratchet floor');
    if (!BLOCKED(pRaise)) continue;
    const pLower = sbx.probe([{ path: file, write: mutate(dir, 'lowered') }], 'chore: fx1 probe lower ratchet floor');
    result = { dir, pRaise, pLower, lowered: BLOCKED(pLower) }; break;
  }
  sbx.reset();
  const sub = { floor_file: file, direction_tried: result ? result.dir : 'all', regression_rejected_at: result ? result.pRaise.blockedAt : null, lowering_rejected_at: result ? result.pLower.blockedAt : null, tracked: true };
  if (result && result.lowered) return res('E06', name, 'PASS', [], { floor_file: file, numeric_leaves: leaves.length }, sub);
  return res('E06', name, 'PARTIAL', [result ? 'a regression is rejected but lowering the floor is not: the floor can go down' : 'a floor file exists but making the floor unattainable (in any direction) was not rejected by a commit hook, push hook or passing-baseline script'], { floor_file: file, numeric_leaves: leaves.length }, sub);
}

// ---------- E07 open-questions gate ----------
function e07(ctx) {
  const name = 'open-questions gate fails with an open question'; const cfg = ctx.cfg; const f = discover(ctx);
  const P = prepareProbe(ctx); const cf = confounded(P, 'E07', name); if (cf) return cf;
  const sbx = P.sbx; const spec = f.specFiles[0];
  if (!spec) return res('E07', name, 'ABSENT', ['no spec file to plant an open question in']);
  // form 1: a new trailing section; form 2: a new item inside an existing open-questions section. Each marker is paired with its marker-free twin.
  const secEdit = marker => ({ path: spec, transform: t => { const secs = sections(t); const s = secs.find(x => /(open questions|preguntas abiertas)/i.test(x.title)); if (!s) return t; const lines = t.split('\n'); lines.splice(s.end, 0, `- ${marker ? marker + ' ' : ''}should the planted note block this commit?`); return lines.join('\n'); } });
  const hasOq = sections(read(path.join(sbx.root, spec))).some(x => /(open questions|preguntas abiertas)/i.test(x.title));
  let hit = null, confoundedTwin = false;
  const forms = [['trailing', m => trailing(spec, m)]]; if (hasOq) forms.push(['in-section', secEdit]);
  for (const [formName, mk] of forms) {
    const twin = sbx.probe([mk('')], 'docs: fx1 planted note without a marker');
    if (BLOCKED(twin)) { confoundedTwin = true; continue; }
    for (const m of cfg.openMarkers) {
      const lowerCase = m.toLowerCase();
      for (const variant of [m, lowerCase]) {
        const p = sbx.probe([mk(variant)], 'docs: fx1 planted open question');
        if (BLOCKED(p)) { hit = { marker: variant, form: formName, blockedAt: p.blockedAt }; break; }
      }
      if (hit) break;
    }
    if (hit) break;
  }
  sbx.reset();
  const evidence = f.tracked.filter(p => !/\.md$/i.test(p) && TEXT_EXT.test(p)).filter(p => cfg.openMarkers.some(m => (tryRead(path.join(ctx.root, p)) || '').toLowerCase().includes(m.toLowerCase())) || /open[-_]?questions/i.test(p));
  if (hit) return res('E07', name, 'PASS', [], { marker: hit.marker, form: hit.form }, { blocked_at: hit.blockedAt, enforced_at_commit: hit.blockedAt === 'commit', twin_accepted: true });
  if (confoundedTwin) return res('E07', name, 'PARTIAL', ['the marker-free twin of the planted note is blocked too, so a block would not show an open-questions gate (a gate that rejects all spec edits is not one)'], { evidence }, { confounded_by: 'twin-blocked' });
  return res('E07', name, evidence.length ? 'PARTIAL' : 'ABSENT', [evidence.length ? `a script or hook mentions open questions (${evidence.slice(0, 3).join(', ')}) but a planted marker did not fail it` : 'no gate: a planted open question was not rejected and nothing mentions one'], { evidence }, {});
}

// ---------- E08 criteria coverage ----------
// The id must be cited at a test definition: on the line of a test/it/describe/def test_/func Test line, or within 2 lines of one
// (decorator, docstring, a comment right above). Skipped and todo tests do not count. A distant comment does not count.
function citedByATest(text, id) {
  const idRe = new RegExp(id.replace(/[-.]/g, '[-_.]') + '(?![A-Za-z0-9])', 'i');
  const lines = text.split('\n');
  const isDef = l => /^\s*(?:async\s+)?(?:test|it|describe)(?:\.\w+)?\s*\(|^\s*(?:async\s+)?def\s+test_|^\s*func\s+Test\w*|^\s*(?:async\s+)?function\s+test\w*/.test(l) && !SKIPPED.test(l);
  for (let i = 0; i < lines.length; i++) if (isDef(lines[i])) for (let j = Math.max(0, i - 2); j <= Math.min(lines.length - 1, i + 2); j++) if (idRe.test(lines[j])) return true;
  return false;
}
// (dev loop 2026-10-06, defect C3) The substrate checklist defines item 8 as a COMMAND that prints exactly one line "criteria coverage: N/M"
// (M = criterion ids defined, N = ids cited by at least one test, a test citing an unknown id makes it fail). The command is the one in the
// sentinel's gate table (a table with at least 4 columns, row named coverage). The per-criterion mapping mode below stays as the alternative.
function coverageCommand(ctx) {
  const s = sentinelText(ctx); if (!s) return null;
  for (const line of s.text.split('\n')) {
    if (!/^\s*\|/.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map(c => c.trim());
    if (cells.length >= 4 && /coverage|cobertura/i.test(cells[0]) && !/^(gate|topic)$/i.test(cells[0])) {
      const cmd = cells[1].replace(/^`+|`+$/g, '').trim();
      if (cmd && !/^command$/i.test(cmd) && !/^[-: ]+$/.test(cmd)) return cmd;
    }
  }
  return null;
}
// A criterion id as a test may cite it: comment, test name or python function name. Separators are interchangeable and optional between the letter and the digits.
const citeRe = id => { const parts = id.split(/[-.]/); return new RegExp('(^|[^A-Za-z0-9])' + parts[0] + '[-_.]?' + parts.slice(1).join('[-_.]') + '(?![A-Za-z0-9])', 'i'); };
const bareLines = out => out.trim().split('\n').filter(l => l.trim() && !/^>\s/.test(l)); // npm prints "> pkg@1 script" banner lines: they are not the command's output
function e08Command(ctx, crit) {
  const cmd = coverageCommand(ctx); if (!cmd) return { tried: false };
  const P = prepareProbe(ctx); if (P.undeterminable || !P.ok) return { tried: false };
  const sbx = P.sbx; sbx.reset();
  const parse = out => { const l = bareLines(out); const m = l.length === 1 ? l[0].trim().match(/^criteria coverage: (\d+)\/(\d+)$/) : null; return m ? { n: +m[1], m: +m[2] } : null; };
  const r = sbx.run(cmd, ctx.cfg.timeouts.gateMs);
  const base = parse(r.out);
  const ids = [...new Set(crit.map(c => c.id))];
  const testFilesAll = trackedFiles(sbx.root).filter(p => isTestPath(ctx.cfg, p) && /\.(js|mjs|cjs|ts|py)$/.test(p));
  const testText = testFilesAll.map(p => tryRead(path.join(sbx.root, p)) || '').join('\n');
  const citedIds = ids.filter(id => citeRe(id).test(testText));
  const reasons = [];
  if (r.code !== 0) reasons.push(`the coverage command exits ${r.code} on the clean head: ${cmd}`);
  if (!base) reasons.push('the coverage command does not print exactly one line "criteria coverage: N/M"');
  else {
    // M must be the number of criterion ids defined; N cannot exceed the ids that tests cite (a command may legitimately skip fixture folders, so it may be lower)
    if (base.m !== ids.length) reasons.push(`it prints M=${base.m} but ${ids.length} criterion ids are defined`);
    if (base.n > citedIds.length) reasons.push(`it prints N=${base.n} but tests cite only ${citedIds.length} of the ids`);
  }
  // behavioural probes next to the project's own tests (the folder the command scans): an orphan id must fail it; citing a not-yet-cited id must raise N by one
  const nCited = p => { const t = tryRead(path.join(sbx.root, p)) || ''; return ids.filter(id => t.includes(id)).length; };
  const exTest = [...testFilesAll].sort((a, b) => nCited(b) - nCited(a))[0];
  const tdir = exTest ? path.dirname(exTest) : 'tests';
  const py = P.stack === 'python';
  const plant = (fname, id) => py ? { path: `${tdir}/test_fx1_${fname}.py`, write: `# ${id}\ndef test_fx1_${fname}():\n    assert True\n` } : { path: `${tdir}/fx1_${fname}.test.js`, write: `// ${id}\nrequire("node:test")("${id} ${fname}", () => {});\n` };
  sbx.reset(); sbx.apply([plant('orphan', 'F-999.9')]);
  const o = sbx.run(cmd, ctx.cfg.timeouts.gateMs); sbx.reset();
  if (o.code === 0) reasons.push('a test citing an id the spec does not define (orphan) does not make the coverage command fail');
  let raised = null;
  const uncited = ids.find(id => !citeRe(id).test(testText));
  if (base && uncited) {
    sbx.apply([plant('cover', uncited)]);
    const c = sbx.run(cmd, ctx.cfg.timeouts.gateMs); sbx.reset();
    const after = parse(c.out); raised = !!(after && after.n === base.n + 1);
    if (!raised) reasons.push(`a test citing ${uncited} does not raise N by one (${base.n} -> ${after ? after.n : 'no output'})`);
  }
  return { tried: true, cmd, ok: reasons.length === 0, reasons, printed: base ? `criteria coverage: ${base.n}/${base.m}` : null, recomputed: `${citedIds.length}/${ids.length}`, orphanFailed: o.code !== 0, raisedByCitation: raised };
}
function e08(ctx) {
  const name = 'criteria coverage: a command reports N/M (or every criterion id has a coverage entry)'; const cfg = ctx.cfg; const f = discover(ctx);
  const crit = ctx.shared.criteria || [];
  if (!crit.length) return res('E08', name, 'ABSENT', ['no criterion ids to cover (E02)'], {}, { depends_on: 'E02' });
  const cm = e08Command(ctx, crit);
  if (cm.tried && cm.ok) return res('E08', name, 'PASS', [], { command: cm.cmd, printed: cm.printed }, { mode: 'command', printed: cm.printed, recomputed: cm.recomputed, orphan_fails: cm.orphanFailed });
  const legacy = e08Mapping(ctx, name, crit, f, cfg);
  if (legacy.status === 'PASS') return legacy;
  if (cm.tried) return res('E08', name, 'PARTIAL', cm.reasons, { command: cm.cmd }, { mode: 'command', printed: cm.printed, recomputed: cm.recomputed, orphan_fails: cm.orphanFailed });
  return legacy;
}
function e08Mapping(ctx, name, crit, f, cfg) {
  const covFiles = f.tracked.filter(p => cfg.coverageFileCandidates.includes(p) || (/^docs\//.test(p) && /coverage|cobertura/i.test(path.basename(p)) && /\.(md|json)$/i.test(p)));
  const mapFiles = [...new Set([...covFiles, ...f.specFiles])];
  const pathTok = /(?:^|[\s`("'|])((?:[\w.-]+\/)*[\w.-]+\.[A-Za-z0-9]{1,5})(?=$|[\s`)"'|,;:#])/g;
  const lineBlocks = [];
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
  return res('E08', name, ok ? 'PASS' : 'PARTIAL', ok ? [] : [`${uncovered.length} of ${crit.length} criteria have no coverage entry pointing at an existing file that cites the id at an executed test: ${uncovered.slice(0, 8).join(', ')}`], { uncovered }, sub);
}

// ---------- E09 commits ----------
function e09(ctx) {
  const name = 'atomic, descriptive, conventional commits'; const cfg = ctx.cfg; const root = ctx.root;
  const range = ctx.since ? [`${ctx.since}..HEAD`] : [];
  const log = git(root, ['log', '--reverse', '--format=%H%x1f%s', ...range]).stdout.split('\n').filter(Boolean).map(l => { const [h, s] = l.split('\x1f'); return { h, s }; });
  if (!log.length) return res('E09', name, 'ABSENT', ['no commits' + (ctx.since ? ` after ${ctx.since}` : '')]);
  const conv = new RegExp(cfg.conventionalCommit); const ign = new RegExp(cfg.atomicIgnoreFiles);
  const nonConv = log.filter(c => !conv.test(c.s));
  const generic = log.filter(c => cfg.genericSubjects.includes(c.s.trim().toLowerCase()) || c.s.trim().length < 10);
  const big = [];
  log.forEach((c, i) => {
    if (i < cfg.atomicExemptFirstN && !ctx.since) return;
    const ns = git(root, ['show', '--numstat', '--format=', c.h]).stdout.split('\n').filter(Boolean).map(l => l.split('\t')).filter(a => a.length === 3 && !ign.test(a[2]));
    const files = ns.length, added = ns.reduce((s, a) => s + (parseInt(a[0], 10) || 0), 0);
    if (files > cfg.maxFilesPerCommit || added > cfg.maxAddedLinesPerCommit) big.push(`${c.h.slice(0, 7)} (${files} files, ${added} lines)`);
  });
  const allowedNonConv = Math.max(Math.floor(log.length * (1 - cfg.minConventionalShare)), cfg.conventionalLeniencyOne ? 1 : 0);
  const reasons = [];
  if (log.length < cfg.minCommits) reasons.push(`${log.length} commits (need ${cfg.minCommits})`);
  if (nonConv.length > allowedNonConv) reasons.push(`${nonConv.length} of ${log.length} subjects are not conventional (at most ${allowedNonConv} allowed): ${nonConv.slice(0, 3).map(c => JSON.stringify(c.s)).join(', ')}`);
  if (generic.length) reasons.push(`non-descriptive subjects: ${generic.slice(0, 3).map(c => JSON.stringify(c.s)).join(', ')}`);
  if (big.length > Math.max(Math.floor(log.length * (1 - cfg.minConventionalShare)), cfg.conventionalLeniencyOne ? 1 : 0)) reasons.push(`non-atomic commits: ${big.slice(0, 3).join(', ')}`);
  return res('E09', name, reasons.length ? 'PARTIAL' : 'PASS', reasons, { commits: log.length, nonConventional: nonConv.length, big, since: ctx.since || null }, {});
}

// ---------- E10 spec lock ----------
function e10(ctx) {
  const name = 'spec lock: tags resolve, the lock file matches and a change to a locked section is detected'; const cfg = ctx.cfg; const f = discover(ctx);
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
  const formatKnown = S.size + A.size > 0;
  if (hasLock && !formatKnown) reasons.push('the lock file is not in the registered format (S/A lines); hash agreement cannot be checked, only the behaviour');
  if (!tags.length) reasons.push('lock file exists but no @gs tags');
  const cur = target => { const [sp, sec] = target.split('#'); const t = tryRead(path.join(ctx.root, sp)); if (t == null) return { err: `${sp} missing` }; const s = sections(t).find(x => x.slug === sec || ghSlug(x.title) === sec || slug(x.title) === sec); if (!s) return { err: `${sp} has no section ${sec}` }; return { hash: sectionHash(s.text, cfg.lock.hashLength) }; };
  for (const t of tags) { const c = cur(`${t.spec}#${t.section}`); if (c.err) reasons.push(`tag ${t.file}:${t.line} ${t.id}: ${c.err}`); else if (hasLock && formatKnown) { const a = A.get(`${t.file}|${t.id}`); if (!a) reasons.push(`tag ${t.file}:${t.line} ${t.id} has no lock entry`); else if (a.hash !== c.hash) reasons.push(`stale: ${t.file} ${t.id} derived against ${a.hash}, section is now ${c.hash}`); } }
  if (formatKnown) {
    for (const [k] of A) { if (!tags.some(t => `${t.file}|${t.id}` === k)) reasons.push(`lock entry without a tag: ${k}`); }
    for (const [target, h] of S) { const c = cur(target); if (c.err) reasons.push(`lock section ${target}: ${c.err}`); else if (c.hash !== h) reasons.push(`lock section ${target} hash ${h} but section hashes to ${c.hash}`); }
  }
  const hardReasons = reasons.filter(r => !/not in the registered format/.test(r));
  if (hardReasons.length) return res('E10', name, 'PARTIAL', reasons.slice(0, 12), { tags: tags.length, lockSections: S.size, lockArtifacts: A.size });
  const P = prepareProbe(ctx); const cf = confounded(P, 'E10', name); if (cf) return cf;
  const sbx = P.sbx; const t0 = tags[0];
  const edit = { path: t0.spec, transform: txt => { const lines = txt.split('\n'); const secs = sections(txt); const s = secs.find(x => x.slug === t0.section || ghSlug(x.title) === t0.section || slug(x.title) === t0.section); const at = s ? s.end : lines.length; lines.splice(at, 0, 'Fx1 probe: this sentence changes the locked section.'); return lines.join('\n'); } };
  const stale = sbx.probe([edit], 'docs: fx1 probe change to a locked spec section');
  const twin = sbx.probe([trailing(t0.spec, '')], 'docs: fx1 planted note in an unlocked spec section'); // paired control: an edit outside every locked section is accepted
  sbx.reset();
  const sub = { stale_detected_at: stale.blockedAt, unlocked_edit_blocked_at: twin.blockedAt, lock_format_known: formatKnown };
  if (BLOCKED(stale) && !BLOCKED(twin)) return res('E10', name, 'PASS', [], { tags: tags.length }, sub);
  return res('E10', name, 'PARTIAL', [BLOCKED(twin) ? 'an edit outside every locked section is blocked too, so a block on the locked section does not show a lock (a frozen spec is not a lock)' : 'tags and lock agree, but changing a locked section was not detected by any commit hook, push hook or passing-baseline script'], { tags: tags.length }, sub);
}

// ---------- E11 co-change gate (commit stage only, as specified) ----------
function e11(ctx) {
  const name = 'co-change gate: behaviour change needs a spec citation or doc change'; const f = discover(ctx);
  const P = prepareProbe(ctx); const cf = confounded(P, 'E11', name); if (cf) return cf;
  const sbx = P.sbx; const src = srcFile(ctx, sbx);
  if (!src) return res('E11', name, 'ABSENT', ['no source file to change']);
  const edit = { path: src, append: '\n' + commentFor(src, 'fx1 co-change probe') + '\n' };
  const p1 = sbx.attemptCommit([edit], 'feat: fx1 co-change probe without any citation', { raw: true });
  const safe = coChangeSafe(ctx);
  const p2a = safe.idSuffix ? sbx.attemptCommit([edit], `feat: fx1 co-change probe${safe.idSuffix}`, { raw: true }) : null;
  const p2b = safe.docEdit ? sbx.attemptCommit([edit, safe.docEdit], 'feat: fx1 co-change probe with doc change', { raw: true }) : null;
  sbx.reset();
  const sub = { source_only_blocked: p1.blocked, cited_commit_accepted: p2a ? !p2a.blocked : null, with_doc_accepted: p2b ? !p2b.blocked : null };
  const allowsSomething = (p2a && !p2a.blocked) || (p2b && !p2b.blocked);
  if (p1.blocked && allowsSomething) return res('E11', name, 'PASS', [], {}, sub);
  const ev = f.tracked.some(p => !/\.md$/i.test(p) && /co-?change|doc-?cascade|cascade/i.test((tryRead(path.join(ctx.root, p)) || '').slice(0, 20000)));
  if (p1.blocked && !allowsSomething) return res('E11', name, 'PARTIAL', ['the gate blocks the source change even with a spec citation or a doc change'], {}, sub);
  return res('E11', name, ev ? 'PARTIAL' : 'ABSENT', [ev ? 'something mentions a cascade or co-change, but a source-only change was not rejected at commit' : 'a source-only change without citation or doc change was accepted and nothing mentions a co-change rule'], {}, sub);
}

// ---------- E12 README clean-clone steps ----------
// Install-like: dependency installs, hook installers and project setup scripts (all of which a reader runs before the tests).
const KIND = [
  ['install', /^(?:.*install[-_]?hooks.*|.*pre-commit install.*|git config core\.hooksPath.*|.*\b(?:setup|bootstrap)\b.*|npx (?:husky|simple-git-hooks).*|make (?:hooks|setup).*)$|^(npm (i|install|ci)\b|yarn( install)?$|pnpm (i|install)\b|pip3? install|python3? -m pip install|poetry install|uv sync|go mod download|bundle install|cargo fetch)/],
  ['test', /(npm (run )?test\b|npm t\b|node --run test|pytest|go test|cargo test|node --test|vitest|jest|make test|yarn test|pnpm test|npm run (check|verify|validate|ci|all)\b|make (check|verify|ci|all)\b|python3? \S*(check|verify|validate)\S*\.py)/], // (dev loop, defect C4) the "one command that runs every check" counts as the test command
  ['build', /^(npm run build|make( build)?$|go build|cargo build|tsc\b)/]
];
function parseReadme(ctx) {
  const root = ctx.root; const rp = ['README.md', 'readme.md', 'README.rst', 'README'].find(x => exists(path.join(root, x)));
  if (!rp) return null;
  const text = read(path.join(root, rp)); const cfg = ctx.cfg;
  const lines = text.split('\n'); const secs = sections(text); const hint = rx(cfg.readme.headingHint);
  const blocks = []; const seenStarts = new Set();
  secs.forEach((s, idx) => {
    if (!hint.test(s.title)) return;
    // a hinted section includes its nested subsections
    let end = s.end; for (let j = idx + 1; j < secs.length && secs[j].level > s.level && s.level < 7; j++) end = secs[j].end;
    for (const b of fences(lines.slice(s.start, end).join('\n'))) { const key = s.start + ':' + b.start; if (!seenStarts.has(key)) { seenStarts.add(key); blocks.push(b); } }
  });
  const use = blocks.length ? blocks : fences(text);
  const cmds = [];
  for (const b of use) {
    if (b.lang && !/^(sh|bash|shell|zsh|console)$/i.test(b.lang)) continue; // text, powershell, cmd, output blocks are not run
    const consoleBlock = /^console$/i.test(b.lang || '') || b.lines.some(l => /^\s*\$\s/.test(l));
    let acc = ''; const pre = [];
    for (const raw of b.lines) {
      if (consoleBlock && !/^\s*\$\s/.test(raw)) continue; // output lines of a console transcript
      const comment = (raw.match(/\s#\s*(.*)$/) || [])[1] || '';
      const l = raw.replace(/^\s*\$\s+/, '').replace(/\s+#.*$/, ''); if (!l.trim() || /^\s*#/.test(raw)) continue;
      if (/\\\s*$/.test(l)) { acc += l.replace(/\\\s*$/, ' '); continue; }
      const cmd = (acc + l).trim(); acc = '';
      if (/^(export |source |\. |cd )/.test(cmd)) { // state-setting lines carry over to the next commands of the block
        if (/^cd\s/.test(cmd) && !exists(path.join(root, cmd.replace(/^cd\s+/, '').trim()))) { cmds.push({ cmd, kind: 'skipped', why: 'cd into the clone folder', pre: '' }); continue; }
        pre.push(cmd); continue;
      }
      const prefix = pre.length ? pre.join(' && ') + ' && ' : '';
      if (/<[^>]+>|YOUR_|your-|\[[^\]]*\]$/.test(cmd)) { cmds.push({ cmd, kind: 'skipped', why: 'placeholder', pre: prefix }); continue; }
      if (/^git clone\b/.test(cmd)) { cmds.push({ cmd, kind: 'skipped', why: 'clone', pre: prefix }); continue; }
      if (/(exit(s|ed)?( with)?( code)?\s*[1-9]|\bfails?\b|\berror\b|non-zero)/i.test(comment)) { cmds.push({ cmd, kind: 'skipped', why: 'documented failure', pre: prefix }); continue; }
      const kind = (KIND.find(([, re]) => re.test(cmd)) || ['run'])[0];
      cmds.push({ cmd, kind, pre: prefix });
    }
  }
  return { path: rp, commands: cmds };
}
function declaresDependencies(root) {
  const pj = tryRead(path.join(root, 'package.json'));
  if (pj) { try { const j = JSON.parse(pj); if (Object.keys(j.dependencies || {}).length || Object.keys(j.devDependencies || {}).length) return true; } catch { /* ignore */ } }
  const rq = tryRead(path.join(root, 'requirements.txt')); if (rq && rq.split('\n').some(l => l.trim() && !l.trim().startsWith('#'))) return true;
  const py = tryRead(path.join(root, 'pyproject.toml')); if (py && /dependencies\s*=/.test(py)) return true;
  return false;
}
function e12(ctx) {
  const name = 'README clean-clone steps actually work'; const cfg = ctx.cfg;
  const rd = ctx.shared.readme;
  if (!rd) return res('E12', name, 'ABSENT', ['no README']);
  const runnable = rd.commands.filter(c => c.kind !== 'skipped');
  if (!runnable.length) return res('E12', name, 'ABSENT', ['README has no runnable command block'], { skipped: rd.commands });
  const { Sandbox } = require('./sandbox'); const sbx = new Sandbox(ctx.repo, cfg, 'readme'); ctx.sandboxes.push(sbx);
  const c = sbx.clone(); if (!c.ok) return res('E12', name, 'UNDETERMINABLE', ['clone failed']);
  const results = []; const reasons = [];
  for (const k of runnable) {
    const isRun = k.kind === 'run';
    const r = isRun ? sbx.runSmoke(k.pre + k.cmd, cfg.timeouts.serveSmokeMs) : sbx.run(k.pre + k.cmd, k.kind === 'test' ? cfg.timeouts.testMs : cfg.timeouts.installMs);
    const ok = r.code === 0 || (isRun && r.timedOut);
    results.push({ cmd: k.cmd, kind: k.kind, ok, code: r.code, timedOut: r.timedOut, tail: r.out.slice(-300) });
    if (!ok) {
      if (!isRun && r.timedOut) return res('E12', name, 'UNDETERMINABLE', [`timed out: ${k.cmd}`], { results });
      if (sbx.isNetworkFailure(r.out)) return res('E12', name, 'UNDETERMINABLE', [`network failure: ${k.cmd}`], { results });
      reasons.push(`fails in a clean clone: ${k.cmd} (exit ${r.code})`);
      if (k.kind === 'install') break;
    }
  }
  const kinds = new Set(runnable.map(k => k.kind));
  const needInstall = !cfg.readme.installOnlyIfDependencies || declaresDependencies(sbx.root);
  for (const need of cfg.readme.mustContain) { if (need === 'install' && !needInstall) continue; if (!kinds.has(need)) reasons.push(`README has no ${need} command`); }
  return res('E12', name, reasons.length ? 'PARTIAL' : 'PASS', reasons, { results, skipped: rd.commands.filter(c => c.kind === 'skipped') }, { install_required: needInstall });
}

// E12 runs last: it smoke-starts long-running commands and must not leave state for the probes.
const ORDER = [['E01', e01], ['E02', e02], ['E03', e03], ['E04', e04], ['E05', e05], ['E06', e06], ['E07', e07], ['E08', e08], ['E09', e09], ['E10', e10], ['E11', e11], ['E12', e12]];
function prepare(ctx) { ctx.shared.readme = parseReadme(ctx); }
module.exports = { ORDER, prepare, discover, parseSpecDefs, countTests, citedByATest };
