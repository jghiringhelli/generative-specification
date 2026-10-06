# FX-1 critique: anthropic claude-opus-5-5

## 0. Header
- VENDOR: anthropic
- MODEL_ID_AS_SHOWN: claude-opus-5-5
- HARNESS: claude-code-subagent
- ROUND: 1
- DATE_UTC: 2026-10-06T03:26:47Z
- REPO_HEAD: a7a94bcfdb504c7c75b8064bafc344b5c4434756
- BRANCH: experiment-protocol-2026-10-02
- FILES_READ:
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\COPILOT-CRITIC-RUNBOOK-FX1.md  sha256=fea788e40f4088810b66a25c5e90f418142220db54d49be933f46f0d958cffc4
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\prereg\FX-1.md  sha256=d231685f56a3162abed072ab8e08cc18497f60019b678ba62deaf8cfa89b1c34
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\FX-1-CHECKER-SPEC.md  sha256=a9847bc1e40c0854aeae1daf283539b9a3b926cf658b0f59445c1e44212a1e58
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\EXPERIMENT-PROTOCOL.md  sha256=b0c830c1572dc75b47c324e2abf9449a7586d930a83cdd9da2588e89b2829cd1
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\experiments\fx1\checker\config.default.json  sha256=ef286374511fcfaccb71e830608d931c405dccfe8bec79c5bc7bdfeda41b602b
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\experiments\fx1\checker\checker.js  sha256=5de01eb004627079d33c73b9076bc22fd9e4f575ec7547c9a38db05aa437b08b
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\experiments\fx1\checker\lib\items.js  sha256=62451dcf18bafa29907511ce780b71d3a3a4eb85442968f1c16dfaadeb2bdecb
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\experiments\fx1\checker\lib\sandbox.js  sha256=554fa2f9068af6bc800cc6e70539590f43861966f450a988f12ac4127b15e8d4
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\experiments\fx1\checker\lib\util.js  sha256=f52cfc8ae0525d17856fc1c939034bf261974f4e54d94cfc9120e8f3de16d306
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\experiments\fx1\checker\tests\variants.js  sha256=418ef82a5ea761804865bca4fc5138c15a5930ae7a8b8d6449c5a93ed6be0b0f
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\experiments\fx1\checker\tests\build-fixtures.js  sha256=87074ab8d6e548a5d8a9444bfec910951b6b0db3a81953b0961741f782c9a7ba
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\experiments\fx1\checker\tests\fixtures\good\scripts\gate.js  sha256=cfbb362be691a75a3f2cf68d96d8727de61e6cf1eb32eb29354da2e09e866c82
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\experiments\fx1\fixtures\README.md  sha256=9cc9ad8ae6de2a257e5de345eefb808dcebc58d75e3016a19ef7740f2f9cc253
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\experiments\fx1\fixtures\FIX-API-lendmark.md  sha256=a6d41d62ab6cee714827d2197edeed6ecc3a794b73ef646b679d813f117f0634
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\experiments\fx1\fixtures\FIX-CLI-stitchcount.md  sha256=e0c282fb20932b7c831299b02c2803de3cc048e06b05dba9825289c87604dbeb
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\experiments\fx1\fixtures\FIX-PIPE-tidewatch.md  sha256=13fb45cfa72ff6f9cafd1aa517f4e6e6d39cbcee627f8976697e8020eb3f725e
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\experiments\fx1\fixtures\FIX-GAME-cinderfall.md  sha256=efc562141420bea20c0259bb1928b923dccf1850a96d4458cea89f8ed2560942
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\experiments\fx1\fixtures\FIX-MCP-shelfwise.md  sha256=2acbdc121a5538c5a25208c8d6e54ea022d05c490ff3d8bf852a1c8e42bf94f9
- FILES_NOT_READ_ATTESTATION: I read no other file and used no tool other than reading these files and the git and hash commands. (The runbook itself was read as instructed; simulation/results.md was not in my allowed list and was not read.)
- PRIOR_EXPOSURE: The session environment loaded the user's project memory index (one-line summaries of unrelated GS project notes); it contains no FX-1 review content. No earlier FX-1 review was seen. An existing file critic-1.md in the output folder was noticed by a directory listing and not opened.
- NOTES: Claude critic, same vendor as one generator (M1); this critique does not count toward the non-Anthropic vendor requirement. Emphasis on the checker source per the brief. All numeric re-computations below are my own hand arithmetic, not runs.

## 1. Verdict in at most five sentences
I would not register this as written. The single most important defect is that the checker's "working" probes do not isolate their cause: any `package.json` script that fails for any reason (including at baseline), and any hook that blocks edits to spec files wholesale, is credited as an open-questions gate, a ratchet, a spec lock and a co-change gate, while the specification's promised "clean tree is accepted" control exists only for a README edit. In the other direction, the README, id, sentinel-route, lock-hash and source-file heuristics are fitted to one hand-built ledger library and will mark correct model-written projects of the five fixture types down for reasons traceable to specific regular expressions. The audit-adjusted bound, as defined, makes `RELIABLE` close to unreachable even for a perfect checker, and the sample-size simulation does not include it. I would not trust a `PASS` on E06, E07, E10 or E11, and I would not trust a non-`PASS` on E01, E02, E10 or E12 without a human look.

## 2. Findings (ranked: all BLOCKER first, then MAJOR, MINOR, NIT)

### F-01
- SEVERITY: BLOCKER
- CATEGORY: checker-leniency
- DIRECTION: OVERSTATES-SUCCESS
- FILE_AND_SECTION: experiments\fx1\checker\lib\sandbox.js, `scriptFailures` and `probe`; FX-1-CHECKER-SPEC.md section 4 and section 3 (E11)
- QUOTE: "if (r.code !== 0 && !r.timedOut) fails.push('npm:' + name);" and "A **script probe** runs every non-lifecycle `package.json` script on the mutated working tree." and (E11) "A source-only change with a message that cites nothing and no doc change is **blocked**"
- PROBLEM: No script is ever run on the clean tree, so a script that already fails at baseline (e.g. `"lint": "eslint ."` with eslint not installed, an `e2e` needing a server, a `typecheck` with errors) turns every script probe into `blockedAt: 'script'`. E07 has no static requirement, so it then `PASS`es with no gate at all; E06 passes if any file is named like `baseline`; E10 passes if tags and lock agree; E11 uses `sbx.probe(...)` (scripts on), so `p1.blockedAt` is set and a plain `attemptCommit` with a citation is accepted: `PASS` with no co-change rule. This also contradicts the E11 spec, which says "blocked" (commit command non-zero). One broken script inflates four elements at once.
- FIX: Run every script on the clean checked head first; exclude scripts that fail at baseline from all probes and report them. Credit a script block only if the same script passes on the paired clean probe (F-02). Make E11 commit-only, as specified (`attemptCommit`, not `probe`). Add a control variant with an always-failing `lint` script and no gates; expected E06/E07/E10/E11 not `PASS`.
- CONFIDENCE: high

### F-02
- SEVERITY: BLOCKER
- CATEGORY: checker-leniency
- DIRECTION: OVERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1-CHECKER-SPEC.md section 3 (E07) and section 1 principle 5; lib\items.js `e07`, `e10`, `coChangeSafe`
- QUOTE: "A planted open-question marker (`OPEN:`, `ABIERTA:`, `PREGUNTA ABIERTA:`) in a new trailing section of the spec is rejected at commit or by a script; the clean tree is accepted." and code "if (blockedMarker) return res('E07', name, 'PASS', [], { marker: blockedMarker }, ..."
- PROBLEM: The only clean control in the code is C0, a README append. There is no paired probe that commits the same trailing spec section without the marker, the same locked-section edit plus an updated lock, or the E05 "safe" doc edit alone. So any hook that rejects all spec edits (a whole-file lock, "spec changes need an ADR", a markdown linter, a frozen `docs/spec`) yields E07 and E10 `PASS`. Worse, `coChangeSafe` falls back to `f.tracked.find(p => /^docs\/[^/]+\.md$/i.test(p))`; in byte order `docs/SPEC.md` sorts before `docs/architecture.md`, so when E04 found nothing routed, the "safe" doc edit is appended to a locked spec and the lock gate, not the test gate, earns E05.
- FIX: For every probe P, run a paired control P0 that differs only in the violation (same files, same message, marker removed / lock updated / floor attainable / safe doc edit alone). Status `PASS` requires P blocked and P0 accepted; P0 blocked is `PARTIAL` with reason "confounded". Never choose a spec file as the co-change-safe document.
- CONFIDENCE: high

### F-03
- SEVERITY: BLOCKER
- CATEGORY: estimation
- DIRECTION: UNDERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1.md section 2.2 item 3 and section 4.3 table
- QUOTE: "**Audit-adjusted lower bound**: the Wilson lower bound computed after subtracting, from the number of `PASS` results, the upper 95% Clopper-Pearson limit of the checker's false-PASS rate measured on the human-audited sample (section 6.3) times the number of `PASS`." and "| **optimistic 0.97** | 0.989 | 0.000 | 0.011 |"
- PROBLEM: My hand arithmetic (not run): Wilson lower bound >= 0.90 at n = 210 needs about 198 passes. With zero false-PASS in about 84 audited `PASS` judgments, the Clopper-Pearson upper limit is about 0.035 (one-sided) to 0.043 (two-sided), so the adjusted bound needs about 205 to 207 observed passes. At a true 0.97 that happens with probability roughly 0.4 to 0.12, not 0.989. A perfect checker is penalised as if it were 4% lenient; the conjunctive headline becomes practically unreachable. The simulation table reports only Wilson (and a bootstrap note), although the conclusion uses the minimum of three. "Section 6.3" does not exist.
- FIX: Rerun the simulation with all three methods jointly, report P(`RELIABLE`) under the actual rule, and either replace the subtraction by a corrected estimator with propagated variance (e.g. rate times estimated checker specificity, interval by delta method or bootstrap over the audit sample), or demote the audit adjustment to a registered sensitivity analysis. Fix the cross-reference to section 6 V-C4.
- CONFIDENCE: medium

### F-04
- SEVERITY: MAJOR
- CATEGORY: controls
- DIRECTION: OVERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1.md section 6 V-C3; tests\variants.js L01
- QUOTE: "Adversarial fakes that satisfy the structure but not the behaviour (hook that prints and exits 0; empty cascade documents of the minimum length; ids with no tests; a ratchet file never read). The checker must return `PARTIAL` or `ABSENT` on each." and "{ id: 'L01', kind: 'known-leak', target: 'E04', desc: 'cascade documents are filler of the minimum length that cite the spec ..."
- PROBLEM: The registration lists "empty cascade documents of the minimum length" as a gaming fake the checker must reject, and the shipped control L01 expects `PASS` for exactly that fake. As written V-C3 fails on the prototype, so either the study cannot freeze or the condition will be reinterpreted at freeze by relabelling a failed gaming control as a "known leak". "Ids with no tests" is also defeated by `test.todo('AC-001 ...')` (F-07), which no control covers.
- FIX: Rewrite V-C3 to list exactly which fakes must be rejected and which are declared leaks with expected `PASS`, and require the rejected list to include: always-failing script (F-01), frozen spec (F-02), `test.todo`/`test.skip` coverage, syntax-only hook (F-07), unenforced script-only gates (F-05).
- CONFIDENCE: high

### F-05
- SEVERITY: MAJOR
- CATEGORY: checker-leniency
- DIRECTION: OVERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1-CHECKER-SPEC.md section 1 principle 1, section 3 (E05, E06, E07, E10); config.default.json; lib\sandbox.js comment
- QUOTE: "A declared gate that was never run, a hook that is not installed in a fresh clone, a ratchet nobody reads, a lock that does not match: all `PARTIAL`." and "\"requireEnforcementAtCommit\": [\"E05\"]," and "// Run discovered gate scripts (package.json scripts and Makefile targets) on the working tree; returns names that fail."
- PROBLEM: E05 is strict ("blocked at script, not at commit" is `PARTIAL`), but E06, E07 and E10 are credited when a `package.json` script nobody runs fails on the mutated tree. That is exactly the "declared gate never shown to block" the census motivated; the dependency matrix even says these "survive when their gate is also a script". The comment promises Makefile targets; the code reads only `package.json`, so the two Python fixtures (CLI, PIPE) can earn these elements only through hooks while the three Node fixtures get the script route. That stack asymmetry will surface as a spurious PROJECT-TYPE effect in section 9.3.
- FIX: One standard for all enforcement elements: commit or push hook in a fresh clone after install (as E05). Report script-only blocks as a subflag and in a registered sensitivity analysis. If scripts stay credited, implement equivalent Python routes (Makefile, `tox`/`nox`, `scripts/*.py`) and say so.
- CONFIDENCE: high

### F-06
- SEVERITY: MAJOR
- CATEGORY: checker-leniency
- DIRECTION: OVERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1-CHECKER-SPEC.md section 3 (E06); FX-1.md section 2.1; lib\items.js `e06`
- QUOTE: "Also recorded, not required: lowering the floor is rejected" and "E06 ratchet (a measured floor that cannot go down)" and "const ok = !!pRaise.blockedAt;"
- PROBLEM: The defining property of a ratchet in FX-1's own definition is that the floor cannot go down; the checker records that and does not require it. A plain threshold check (`if (count < floor.min) fail`) with a freely editable floor passes E06. Combined with L02 (any-edit rejection passes) and F-01 (any failing script passes), E06 `PASS` neither establishes "measured" nor "cannot go down".
- FIX: `PASS` requires both: the unattainable floor rejected AND a lowered floor rejected, with paired clean controls (an unchanged-file commit and, if feasible, a floor raised to the currently measured value accepted, which also separates a ratchet from a frozen file and closes L02).
- CONFIDENCE: high

### F-07
- SEVERITY: MAJOR
- CATEGORY: checker-leniency
- DIRECTION: OVERSTATES-SUCCESS
- FILE_AND_SECTION: lib\items.js `e05`, `countTests`, `citedByATest`; FX-1-CHECKER-SPEC.md section 3 (E05, E08)
- QUOTE: "let enforced = pT.blockedAt === 'commit' || (pS && pS.blockedAt === 'commit');" and "/^\s*(?:test|it)(?:\.\w+)?\s*\(|^\s*def test_|^\s*func Test\w+/gm"
- PROBLEM: E05 is "tests plus an enforced blocking gate", but a hook that only runs `node --check` or a linter on staged files blocks the planted syntax error and earns the gate leg without ever running tests. The test leg counts cases statically (`test.todo(`, `test.skip(`, `it.skip(` all match) and separately requires only that the test command exits 0, so `"test": "exit 0"` plus five `test.todo('AC-00n ...')` lines satisfies it. The same `todo`/`skip` lines satisfy E08's "cited at a test definition". Route: syntax-check hook, todo tests, exit-0 test script: E05 and E08 `PASS` with zero executed assertions.
- FIX: Require the planted failing test specifically to be blocked (the syntax probe becomes a subflag). Count only executed, non-skipped tests from the runner's own output (TAP/JUnit reporter or `pytest --co`/result summary); exclude `.skip`/`.todo`/`xit`/`@pytest.mark.skip` from both E05 counts and E08 citations. Add gaming controls for each.
- CONFIDENCE: high

### F-08
- SEVERITY: MAJOR
- CATEGORY: checker-harshness
- DIRECTION: UNDERSTATES-SUCCESS
- FILE_AND_SECTION: lib\items.js `e05` versus `e06`, `e07`, `e10`, `e11`; FX-1-CHECKER-SPEC.md section 3
- QUOTE: "if (!enforced) { // push stage" (only in `e05`) and (E06) "is rejected at commit or by a script"
- PROBLEM: A push attempt is made only for E05. A project that puts its whole gate in `pre-push` (a common and legitimate design that keeps commits fast) earns E05 but gets E06, E07, E10 and E11 `PARTIAL` or `ABSENT`, unless a failing script rescues them (F-01). The same project gets opposite verdicts on the same gate depending on the element. A pre-push hook that protects only `main` also misses the probe's `HEAD:refs/heads/fx1-probe` push.
- FIX: Apply the same commit-or-push rule to every enforcement element, and push to the clone's default branch name on the bare remote. Add a positive control whose gates live only in `pre-push`.
- CONFIDENCE: high

### F-09
- SEVERITY: MAJOR
- CATEGORY: checker-harshness
- DIRECTION: UNDERSTATES-SUCCESS
- FILE_AND_SECTION: lib\items.js `parseReadme`, `e12`; lib\util.js `sh`
- QUOTE: "if (b.lang && !/^(sh|bash|shell|console|zsh|cmd|powershell|ps1|text|)$/i.test(b.lang)) continue;"
- PROBLEM: `text` and `console` blocks are executed, including their output lines: a Stitchcount README showing `$ stitchcount count --start 24 "k2tog, yo"` followed by `23` runs `23` as a command and fails. Commands documented to fail (the brief requires exit codes 2 and 3) fail E12. `powershell`/`cmd` blocks run under bash. Each line is a separate `bash -c`, so `export PANTRY_FILE=...` (Shelfwise), `source .venv/bin/activate` and `cd sub` do not carry to the next line. A correct, conventional README is marked `PARTIAL`; the effect is fixture-specific.
- FIX: Execute only `sh`/`bash`/`shell`/unlabelled blocks, and in `console` blocks only `$ `-prefixed lines; run each block as one script (`set -e`) so state persists; skip lines whose documented expectation is a non-zero exit (e.g. followed by `# exits 3`). Add controls for each pattern.
- CONFIDENCE: high

### F-10
- SEVERITY: MAJOR
- CATEGORY: checker-harshness
- DIRECTION: UNDERSTATES-SUCCESS
- FILE_AND_SECTION: config.default.json `readme`; lib\items.js `parseReadme`
- QUOTE: "\"headingHint\": \"(clean clone|getting started|quick ?start|install|build|setup|run|usage|ejecuci|instal|uso)\"" and "if (/<[^>]+>|YOUR_|your-|\[.*\]/.test(cmd)) { cmds.push({ cmd, kind: 'skipped', why: 'placeholder' }); continue; }"
- PROBLEM: When any section matches the hint, only blocks inside hinted sections are read, and `sections()` splits at every heading level. A README with `## Installation` and `## Testing` (or `### Tests` under Getting started, or Spanish `## Pruebas`) yields no test command: "README has no test command", `PARTIAL`. The placeholder rule skips `pip install -e ".[dev]"`, the standard way to get pytest as a dev extra, as a "placeholder", so a Python README can lose its only install command. Also `node --run test` (Node 24) is not classified as a test command.
- FIX: Add `test|testing|tests|prueba|desarrollo|development` to the hint and include nested subsections of hinted sections; restrict the placeholder rule to `<...>`, `YOUR_`, `your-` and bracketed words without quotes; add `node --run test`. Controls for each.
- CONFIDENCE: high

### F-11
- SEVERITY: MAJOR
- CATEGORY: checker-harshness
- DIRECTION: UNDERSTATES-SUCCESS
- FILE_AND_SECTION: lib\util.js `refsIn`; FX-1-CHECKER-SPEC.md section 3 (E01)
- QUOTE: "if (r.includes('/') && !ext && !r.endsWith('/') && /^[a-z0-9_.-]+\/[a-z0-9_.-]+$/i.test(r) && !/^(docs|src|tests?|scripts|lib|app|\.github|\.githooks|\.husky|\.claude|\.cursor)\//i.test(r)) return; // \"and/or\", \"input/output\" prose" and "**no** referenced path that does not exist (placeholders, globs, URLs, generated folders are ignored by pattern)"
- PROBLEM: Any inline-code token containing `/` that is not exactly two plain segments is a "reference". The MCP brief's `pantry://inventory` (not matched by `^https?:`), Lendmark routes like `items/:id/status`, unit lists like `ml/l/cup`, and runtime data files with listed extensions (`pantry.json`, `out/report.txt`) are all "referenced but missing": E01 `PARTIAL`. A good sentinel for these fixtures naturally names them, so E01 will fall for API and MCP fixtures for checker reasons and trigger a false PROJECT-TYPE diagnosis.
- FIX: Count a dangling reference only if it has a known file extension or a known directory prefix AND appears in a link or after a routing verb; ignore any `scheme://`, any segment containing `:`, `{`, or a leading HTTP verb. Add fixture-shaped controls (a sentinel that names the resource URI, routes and the data file).
- CONFIDENCE: high

### F-12
- SEVERITY: MAJOR
- CATEGORY: checker-harshness
- DIRECTION: UNDERSTATES-SUCCESS
- FILE_AND_SECTION: lib\items.js `parseSpecDefs`; config.default.json `specDirs`, `coverageFileCandidates`, `idToken`
- QUOTE: "const id = leadingId(h[2], cfg.idToken); if (id) defs.push({ id, file, line: i + 1, kind: 'requirement', text: h[2] });" and "\"coverageFileCandidates\": [\"docs/coverage.md\", \"docs/spec/coverage.md\", \"docs/spec/COVERAGE.md\","
- PROBLEM: (1) An id in a heading is always a requirement, so criteria written as `### AC-001 ...` under `## Acceptance criteria` count zero criteria: E02 `PARTIAL`, E08 `ABSENT`. (2) `**Acceptance criteria**` bold labels are not headings for this parser. (3) Every `.md` under `docs/spec` is a spec file, including the checker's own candidate `docs/spec/coverage.md`; its table rows `| AC-001 | tests/... |` re-define every id: "duplicate ids", E02 `PARTIAL`. A traceability table inside the spec does the same. (4) `FR-1.2.3` truncates to `FR-1.2`, making siblings duplicates; `REQ-LOAN-01`, `[AC-001]`, `AC1` yield no id.
- FIX: Treat ids in headings under a criteria ancestor as criteria; accept bold-label criteria headings; count an id as defined only once per file at its first definition-shaped occurrence and never in tables whose header names tests or coverage; exclude coverage files from specFiles; widen `idToken` to multi-segment ids. Controls for each.
- CONFIDENCE: high

### F-13
- SEVERITY: MAJOR
- CATEGORY: checker-harshness
- DIRECTION: UNDERSTATES-SUCCESS
- FILE_AND_SECTION: lib\util.js `slug`, `normalizeSection`; lib\items.js `e10`; tests\variants.js G2
- QUOTE: "const slug = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');" and "h.replace(d, f, '#acceptance-criteria', '#criterios-de-aceptaci-n');"
- PROBLEM: E10 requires that the project's lock lines equal hashes computed by the checker's private normalisation and that tags use the checker's private slug (accents stripped to `-`, parenthesised text dropped). GitHub-style anchors (`#criterios-de-aceptación`, `#acceptance-criteria-v1`), a different hash (full SHA-256, heading included), or a different lock path or format give "has no section" or "stale": `PARTIAL`, though the lock works. The G2 control passes only because its tags were rewritten into the checker's slug. Unless the formula ships this exact script, E10 measures copying of a format, not a working lock.
- FIX: Judge E10 behaviourally: tags resolve under either slug convention; a locked-section edit is blocked; the same edit plus the project's own relock command is accepted (paired control). Keep hash agreement as a subflag. If the format is mandatory, register that the formula ships the lock tool and the coverage map points at it.
- CONFIDENCE: high

### F-14
- SEVERITY: MAJOR
- CATEGORY: checker-harshness
- DIRECTION: UNDERSTATES-SUCCESS
- FILE_AND_SECTION: lib\items.js `srcFile`; config.default.json `sourceDirs`
- QUOTE: "\"sourceDirs\": [\"src\", \"lib\", \"app\"]," and "const any = tracked.filter(p => exts.includes(p.split('.').pop()) && !isTest(p) && !p.startsWith('scripts/') && !p.startsWith('.'));"
- PROBLEM: Python packages laid out as `stitchcount/` or `tidewatch/` (the default flat layout), or Node projects with root `index.js`/`server.js`, fall to the `any` list, which is sorted: `eslint.config.js`, `setup.py`, `noxfile.py`, `vitest.config.js` come first. The syntax error and the co-change edit are then planted in a config file: tests still pass, a co-change gate correctly scoped to the package ignores it, so E05's syntax leg and E11 fail for reasons unrelated to the project. The good gate's `src/`-only rule is a fixture choice the checker inherited.
- FIX: Choose the planted source file as one imported by the tests (Python: the package named in `pyproject`/`setup`; Node: `main`/`exports` of `package.json` or a module required by a test file); exclude `*.config.*`, `setup.py`, `conftest.py`, `noxfile.py`. Add flat-layout Python and root-layout Node controls.
- CONFIDENCE: medium

### F-15
- SEVERITY: MAJOR
- CATEGORY: checker-harshness
- DIRECTION: UNDERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1.md section 6 V-C6 and section 5; lib\sandbox.js `hooksState`, `attemptCommit`; FX-1-CHECKER-SPEC.md section 6
- QUOTE: "if (process.platform !== 'win32') execOk = names.every(f => (fs.statSync(path.join(dir, f)).mode & 0o111) !== 0);" and "network limited to the package registries"
- PROBLEM: The generation platform is not registered. Hooks written by an agent on Windows are committed without the executable bit (the known-good builder needed `update-index --chmod=+x`), and may carry CRLF shebangs. On the Linux checker, git ignores non-executable hooks or the hook fails to start, so E05, E06, E07, E10, E11 flip with the generator's OS, not the formula. Separately, the Python `pre-commit` framework fetches hook repos from GitHub at first commit; under registry-only network C0 is blocked and every probe element becomes `PARTIAL` "confounded", because `attemptCommit` never applies `isNetworkFailure`, so this is scored as project failure, not `UNDETERMINABLE`.
- FIX: Register the generation OS (Linux container, same image) for all runs. Apply network-failure detection to commit and push attempts and C0, returning `UNDETERMINABLE`. Decide and register whether GitHub is reachable for hook frameworks. Add a Windows-authored control (mode 100644 hooks) with a declared expected result.
- CONFIDENCE: medium

### F-16
- SEVERITY: MAJOR
- CATEGORY: checker-harshness
- DIRECTION: UNDERSTATES-SUCCESS
- FILE_AND_SECTION: lib\items.js `KIND`, `installCommands`, `prepareProbe`; FX-1-CHECKER-SPEC.md section 4
- QUOTE: "^(?:.*install[-_]?hooks.*|.*pre-commit install.*|git config core\.hooksPath.*)$" and "install via the README's install commands, falling back to the stack default (`npm install`, `pip install`) if hooks are not active afterwards"
- PROBLEM: Only README lines classified `install` are executed in the probe clone. `npx husky init`, `npx simple-git-hooks`, `make hooks`, `make setup`, `./scripts/setup.sh`, `bash scripts/bootstrap.sh` are classified `run` and never executed there (they are executed only in E12's separate clone). A project whose README says "run ./scripts/setup.sh" gets E12 `PASS` (setup works) and E05/E11 `PARTIAL` (hooks "not installed") in the same report.
- FIX: In the probe clone execute the full README setup sequence that E12 executes (all non-test, non-long-running commands before the first test command), then fall back to stack defaults. Add a control whose hooks are installed only by `./scripts/setup.sh`.
- CONFIDENCE: high

### F-17
- SEVERITY: MAJOR
- CATEGORY: checker-harshness
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: lib\util.js `sh`; lib\items.js `ORDER`, `e12`; lib\sandbox.js `scriptFailures`, `reset`
- QUOTE: "const r = spawnSync(shell, ['-c', cmd], { cwd, env: cleanEnv(env), encoding: 'utf8', timeout, killSignal: 'SIGKILL', maxBuffer: 32 * 1024 * 1024 });" and "const ORDER = [['E12', e12], ['E01', e01],"
- PROBLEM: E12 runs first and smoke-starts long-running commands for 8 s, then SIGKILLs only the direct child; `npm start` spawns `node`, which survives as an orphan holding its port. Lendmark tests or hooks that bind the same port then fail in E05's test run and in every probe (or in the next repository checked in the same container). Script probes run arbitrary scripts (`clean`, `db:reset`, `release`, `lint:fix`) whose side effects persist (`reset` keeps `node_modules`, `.venv`, `.git/`), contaminating later probes in either direction. V-C5 determinism was only tested on the ledger fixture, which has no server and no such scripts.
- FIX: Start each command in its own process group and kill the group; run E12 last, in its own container; use a fresh probe clone per element (or per probe) rather than reset; skip scripts by an allow-list (names containing `gate`, `check`, `lint`, `test`, `verify`) rather than a deny-list. Add a server-shaped control.
- CONFIDENCE: medium

### F-18
- SEVERITY: MAJOR
- CATEGORY: checker-harshness
- DIRECTION: UNDERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1.md section 3.1; config.default.json `decisionDirs`, `specCandidates`, `specDirs`; tests\variants.js G2
- QUOTE: "The Spanish checker configuration is the same file; the bilingual heading patterns are validated by a Spanish positive control (checker spec section 5)."
- PROBLEM: Only headings are bilingual. Paths are English-only: no `docs/decisiones`, `docs/especificacion`, `docs/especificaciones`, `docs/requisitos`, no Spanish coverage file names, and the slug mangles accented section names (F-13). G2 translates headings but keeps every English path, so it cannot detect this. Unless the Spanish formula forces English paths, the ES streams will be scored down by the instrument and row (g) will then require rewriting a translation that may be fine.
- FIX: Before freeze, either fix the paths in both formula texts and register that the coverage map requires English paths, or add Spanish path candidates. Build the Spanish known-good from a Spanish-path project written by someone else, not by translating G1's headings.
- CONFIDENCE: medium

### F-19
- SEVERITY: MAJOR
- CATEGORY: controls
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: FX-1-CHECKER-SPEC.md section 5.2 and 5.1; tests\variants.js R05
- QUOTE: "the first run disagreed three times (the environment leak, the unrelated-gate confound, and a fixture gate that crashed without a tests directory), all three were defects of the checker or the fixture, not of the matrix, and all three were fixed and re-run." and "| E10 lock stale | E05, E06, E07, E11 (the lock gate blocks every commit) |"
- PROBLEM: The matrix rows describe the ledger fixture's architecture (one `gate.js` running every check in `pre-commit`, co-change in `commit-msg`), not logical consequences; in a project with a separate lock script a stale lock blocks nothing else. Every disagreement was resolved by editing checker or fixture, and controls are tuned to fit (R05 also rewrites `docs/ratchet.json` to `tests_min: 0`), so no outcome could show the matrix wrong. All controls derive from one ledger library: no HTTP server, CLI entry point, pipeline, game engine or MCP server; Python has two variants.
- FIX: Derive the matrix from element definitions only (E02 to E04/E07/E08/E10; E05 tests to E08; C0 block to all probe elements) and treat fixture-architecture couplings as per-control expectations, not matrix rows. Require one known-good per fixture type and stack before freeze, and broken variants for each element on Python.
- CONFIDENCE: high

### F-20
- SEVERITY: MAJOR
- CATEGORY: failure-taxonomy
- DIRECTION: OVERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1.md section 9.3 and section 10 rows (d), (j)
- QUOTE: "**FORMULA-STEP**: the formula instructs the element, and the stream's `PASS` rate for it is below 0.80 with at least two of the three vendors individually below 0.80." and "5. **RUN-VARIANCE**: everything else."
- PROBLEM: An element observed at 0.84 (upper Wilson bound below 0.90: `FAILS-TARGET`) is not FORMULA-STEP (rate not below 0.80), usually not MODEL-SPECIFIC or PROJECT-TYPE, so it is RUN-VARIANCE, and row (d), which requires FORMULA-STEP, does not apply: no row names the formula step. The cascade also says "CHK ... stays below 0.80" without stating point estimate or bound on about 45 English-only runs per path, then applies it to Spanish streams; because CHK is told the checker's own definitions, a harsh checker exonerates the formula and the defect is labelled "definition".
- FIX: Any `FAILS-TARGET` with the formula instructing the element is FORMULA-STEP unless MODEL-SPECIFIC/PROJECT-TYPE fire; RUN-VARIANCE only for `UNRESOLVED`. Define CHK's criterion as an upper Wilson bound below 0.80 per path, and forbid applying English CHK to Spanish streams. Require the checker audit (row h) before row (j) can be used.
- CONFIDENCE: high

### F-21
- SEVERITY: MAJOR
- CATEGORY: procedure
- DIRECTION: UNDERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1-CHECKER-SPEC.md section 3 (E09); FX-1.md section 3 (path B) and 3.2
- QUOTE: "Over the whole history: at least 4 commits; at least 95% of subjects match the conventional pattern" and "Use git and commit your work as you go."
- PROBLEM: In path B the history is mostly written by the neutral MVP prompt, which deliberately says nothing about commit style, before F2 runs. F2 cannot (and should not) rewrite history, so B-stream E09 measures the build prompt, not the formula. Even in path A, with fewer than 20 commits a single non-conventional subject (e.g. "Initial commit", which is exempt only from the size rule) drops the share below 0.95.
- FIX: Score E09 only on commits made after the formula's first step (record the boundary commit in the harness), require at least 4 such commits, and use "at most one non-conventional subject or 95%, whichever is more lenient". State in the coverage map which formula step instructs commit style.
- CONFIDENCE: high

### F-22
- SEVERITY: MAJOR
- CATEGORY: decision-table
- DIRECTION: OVERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1.md section 10 row (a); FX-1-CHECKER-SPEC.md section 7 item 9
- QUOTE: "\"Following formula F, version v, English, on five project types and three model vendors, each of the twelve elements was present and working in at least 90 percent of runs (95 percent interval), and all twelve in at least X percent.\"" and "FX-1 row (a) therefore says the claim is \"meets this operational definition\"."
- PROBLEM: The checker specification asserts that row (a) carries the qualifier; the row's publishable sentence does not. A site reader will read "present and working" semantically (a real spec, a real ratchet), while the instrument certifies filler documents (L01), frozen files (L02) and, as coded, scripts that merely fail (F-01).
- FIX: Row (a) claim: "... each of the twelve elements met the FX-1 checker vX definition of present and working (structural and behavioural; content quality not assessed) in at least 90 percent of runs ...", with a link to the definitions and the declared leaks. Same qualifier on rows (b), (c) and the wording ladder of section 11.
- CONFIDENCE: high

### F-23
- SEVERITY: MAJOR
- CATEGORY: controls
- DIRECTION: UNDERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1.md section 6 V-C4 and section 9.1; FX-1-CHECKER-SPEC.md section 7 item 4
- QUOTE: "an independent human, blind to the checker's output, judges each element by the same written definitions." and "Risk of understating success; measured by the audit."
- PROBLEM: Only false-`PASS` feeds a correction or an invalidation rule; false-`PARTIAL` (harshness), which the code review above suggests is the larger error class for model-written projects, has no registered threshold in the main study and no adjusted estimate. Moreover, if "the same written definitions" are the checker's operational ones (exact id grammar, heading words, lock format), the auditor reproduces the convention dependence and agreement measures fidelity to the operationalisation, not validity.
- FIX: Give the auditor the purpose-level definitions (what the element is for), not the checker's patterns; register a false-`PARTIAL` limit per element (e.g. upper 95% bound above 0.10 makes that element's `FAILS-TARGET` uninterpretable) and report a harshness-adjusted upper bound symmetrically with the leniency-adjusted lower bound.
- CONFIDENCE: medium

### F-24
- SEVERITY: MINOR
- CATEGORY: checker-harshness
- DIRECTION: UNDERSTATES-SUCCESS
- FILE_AND_SECTION: config.default.json `lowerIsBetterKeys`; lib\items.js `e06` `mutate`
- QUOTE: "\"lowerIsBetterKeys\": \"(max|ceiling|violation|error|duplicat|complex|size|lines|warn)\","
- PROBLEM: Direction is guessed from key names. A coverage floor `{"total": {"lines": {"pct": 85}}}` contains `lines`, so it is set to -1 (attainable) and a correct ratchet accepts it: `PARTIAL`. Lower-is-better keys not in the list (`issues`, `todo`, `skipped`, `ms`, `duration`, `debt`, `smells`) are set to 1e9, a looser ceiling, also accepted. Also the first file matching `ratchet|baseline|floor` wins, so a test-data `data/baseline.json` can be mutated instead of the real floor.
- FIX: Read direction from an explicit field the formula fixes (e.g. `"direction"` or `min_`/`max_` prefixes); if absent, probe both directions and count `PASS` if either unattainable mutation is rejected. Prefer files under `docs/` or referenced by a hook or script.
- CONFIDENCE: medium

### F-25
- SEVERITY: MINOR
- CATEGORY: checker-harshness
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: lib\items.js `e07`; tests\fixtures\good\scripts\gate.js `open`
- QUOTE: "## Planted open question" and "if (/^\s*OPEN:/m.test(read(f))) fail('open question in ' + f);"
- PROBLEM: The probe shape matches the fixture gate (marker anywhere at line start). A natural gate that checks only the project's own `## Open questions` section, or only unchecked items in it, misses a marker in a new section titled "Planted open question" (false fail). A gate that greps `/open question/i` blocks on the planted heading text, not the marker (false pass, and not caught without F-02's paired control).
- FIX: Plant the marker in two forms: as a new item in the existing open-questions section (if one exists) and as the trailing section; `PASS` if either is blocked and its marker-free twin is accepted.
- CONFIDENCE: medium

### F-26
- SEVERITY: MINOR
- CATEGORY: checker-harshness
- DIRECTION: UNDERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1-CHECKER-SPEC.md section 3 (E11); lib\items.js `e11`
- QUOTE: "The refactor exemption of the canon (parent tests unchanged) is not probed." and "const edit = { path: src, append: '\n' + commentFor(src, 'fx1 co-change probe') + '\n' };"
- PROBLEM: The probe is a comment-only change with tests unchanged, which is exactly what a canon-conformant gate may exempt as a refactor or a non-behavioural change. Such a gate accepts the probe and is scored `PARTIAL`/`ABSENT`. The exemption is not merely "not probed"; the probe falls into it.
- FIX: Make the probe a behavioural change (e.g. change a returned constant in an exported function) with tests unchanged, and run it after the test probe so a failing test is not the cause; or register that the formula's gate must not exempt comment-only changes.
- CONFIDENCE: medium

### F-27
- SEVERITY: MINOR
- CATEGORY: estimation
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: FX-1.md section 2.1 and 2.2 item 2
- QUOTE: "**Cell-bootstrap 95% interval**: resample the 15 cells with replacement (10,000 replicates, seed registered), percentile method."
- PROBLEM: pi(e,s) is defined as the equal-weight average over these 15 fixed cells; for that fixed estimand the stratified binomial variance applies and Wilson is already conservative. Resampling cells targets a super-population of fixture-by-vendor cells that is not defined, with crossed (not nested) factors and only 3 vendors and 5 fixtures; percentile bootstrap with 15 clusters is known to under-cover (from memory, not verified). The "most conservative of three" then mixes estimands.
- FIX: Declare the estimand explicitly. If it is the 15 fixed cells, drop the cell bootstrap from the verdict and report heterogeneity descriptively; if a population of projects and vendors, use a crossed random-effects model and say the 3-vendor generalisation is weak.
- CONFIDENCE: medium

### F-28
- SEVERITY: MINOR
- CATEGORY: failure-taxonomy
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: lib\items.js `prepareProbe`; FX-1.md section 9.1
- QUOTE: "/command not found|not recognized|ENOENT/.test(r.out) && !/package/.test(r.out)"
- PROBLEM: Whether a missing tool is `UNDETERMINABLE` (environment) or project failure depends on whether the word "package" appears anywhere in the output (npm prints "package.json" constantly). A README using `uv`, `poetry` or `make` absent from the image flips class on incidental text. Git-URL dependencies under registry-only network become `UNDETERMINABLE`, feeding the 3 percent invalidation rule with something the project chose.
- FIX: Register the image's tool list; a README command whose executable is absent from that list is project failure if the brief's stack did not imply it, otherwise `UNDETERMINABLE`; decide by the executable name, not output text.
- CONFIDENCE: medium

### F-29
- SEVERITY: MINOR
- CATEGORY: checker-harshness
- DIRECTION: UNDERSTATES-SUCCESS
- FILE_AND_SECTION: config.default.json `decisionDirs`, `cascadeKinds`; lib\items.js `e03`
- QUOTE: "\"decisionDirs\": [\"docs/decisions\", \"docs/adr\", \"docs/adrs\", \"docs/decision-records\", \"docs/architecture/decisions\"],"
- PROBLEM: Common conventions are missing: `doc/adr` (the default of the adr-tools utility, from memory), root `adr/` or `decisions/`, records named without a number (`use-sqlite.md`); cascade documents named `guidelines`, `coding-guidelines`, `CONTRIBUTING.md` or `domain-model` are not recognised as conventions or data model. Each is scored `ABSENT` rather than present.
- FIX: Extend candidates, or register that the formula fixes these names and that a deviation is a formula-following failure (and say so in the coverage map).
- CONFIDENCE: medium

### F-30
- SEVERITY: MINOR
- CATEGORY: checker-leniency
- DIRECTION: OVERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1-CHECKER-SPEC.md section 3 (E01, E04); lib\items.js `e04`
- QUOTE: "At least 3 distinct **non-empty** existing files or directories routed from it" and "const derived = specPaths.some(sp => t.includes(sp) || t.includes(path.basename(sp))) || [...specIds].some(id => t.includes(id));"
- PROBLEM: E01 passes when the sentinel names any three existing files (`package.json`, `README.md`, `src/index.js`); it need not route to the spec, decisions or cascade. In E04 a single document with three level-2 headings satisfies all three kinds, and if the spec lives at `docs/spec/README.md` the derivation proxy is satisfied by any document that mentions `README.md`.
- FIX: E01: at least one route must reach the spec and one the decisions directory or cascade. E04: require three distinct documents or three distinct sections each citing a spec id; match the spec by full path or an id, never by a generic basename.
- CONFIDENCE: high

## 3. Mandatory sections (write "none found" only after listing what you tried)
### 3a. Ways the study or the checker would overstate success
- Any baseline-failing npm script credits E06, E07, E10, E11 (F-01).
- Gates that block all spec edits, or the co-change-safe edit landing on a locked spec, credit E05, E07, E10 (F-02).
- Unwired scripts credited as gates, contrary to principle 1 (F-05).
- Ratchet need not prevent lowering (F-06); direction guess errors (F-24) go mostly the other way.
- Syntax-only hook, `test.todo`/`skip`, `"test": "exit 0"` pass E05 and E08 (F-07).
- V-C3 relabels a failed gaming control as a known leak (F-04).
- FAILS-TARGET elements between 0.80 and about 0.86 escape row (d) as RUN-VARIANCE; CHK exonerates via the checker's own definitions (F-20).
- Public row (a) sentence lacks the operational qualifier (F-22).
- Weak routing and derivation proxies (F-30).
- Not raised: E09 leniency by tiny commits; atomic-by-size is declared.

### 3b. Ways the study or the checker would understate success
- Audit-adjusted bound penalises a perfect checker, P(`RELIABLE`) at 0.97 far below the reported 0.989 (F-03).
- Push-only gates fail four elements (F-08).
- README executor runs output lines, expected-error demos, other-shell blocks, per-line shells (F-09); heading hint and placeholder rule drop test and install commands (F-10).
- Sentinel dangling-reference heuristic fires on fixture-natural tokens (F-11).
- Spec parser: heading criteria, bold labels, coverage file inside `docs/spec`, hierarchical ids (F-12).
- Lock judged by private slug and hash (F-13).
- Planted source file can be a config file (F-14).
- Generation OS and pre-commit network make five elements platform-dependent (F-15).
- Hook installation only via a narrow regex (F-16).
- Orphan servers and script side effects (F-17).
- Spanish paths (F-18).
- Path B E09 measures the build prompt (F-21).
- Audit does not bound harshness (F-23).
- Probe shapes for E07 and E11 fitted to the fixture gate or colliding with the canon (F-25, F-26); missing directory and name conventions (F-29).

### 3c. Ways the study is unfalsifiable, cannot inform, or has a modal outcome that changes no decision
- The dependency matrix cannot be shown wrong under its own resolution rule (F-19).
- With F-03 as written, the headline CONJ-s is near-unreachable whatever the formulas do, so a miss carries no information about the formulas.
- With the leniency routes of F-01/F-02/F-05, a `MEETS` on E06, E07, E10, E11 cannot distinguish a working gate from an unrelated failure; with the harshness routes, a `FAILS-TARGET` on E01, E02, E10, E12 cannot distinguish a formula failure from a checker convention. The modal outcome the registration predicts ("several `RELIABLE`, several `FAILS-TARGET`") would therefore name formula steps to rewrite on evidence the checker manufactures. The FX-0 audit of 24 runs is the only check and is too small to find per-element defects at rates under about 10 percent.

## 4. Better designs (at most three)
### H-A
- STATEMENT: Validate the checker against a seeded corpus before measuring formulas: a library of about 60 independently authored repositories, one per (element, convention variant, stack, fixture type), with known ground truth including working-but-unconventional and broken-but-conventional cases.
- WHY MORE INFORMATIVE: Yields per-element sensitivity and specificity with intervals on the population the study will actually see (messy, multi-convention), instead of 38 variants of one ledger library; converts F-09 to F-17 from argument into numbers, and lets the main study correct its rates in both directions.
- WHAT IT NEEDS (arms, n, readout): Two independent authors, about 60 repositories (5 fixtures x 2 stacks where relevant x 12 elements x pass/fail variants, sampled); readout per element: false-PASS and false-PARTIAL rates with Clopper-Pearson bounds; gate: both below 0.05 upper bound before FX-1 freezes.

### H-B
- STATEMENT: Replace pooled 210-run streams with a two-stage design: stage 1, 5 runs per cell on the full grid to find elements with clear failure (most hard elements, per section 2.4 priors); stage 2, spend the remaining budget only on elements whose stage-1 rate is above 0.85, with a pre-registered group-sequential or Bayesian rule.
- WHY MORE INFORMATIVE: The registration's own prior puts five elements at 0.3 to 0.8, where 210 runs are wasted; concentrating runs where certification is plausible raises P(decisive) for the elements that matter, and fixes formulas earlier (FX-1b) at lower cost.
- WHAT IT NEEDS (arms, n, readout): FORM only in confirmatory stage; stage 1 about 300 runs over four streams; stage 2 adaptive with registered alpha spending; readout as now per element and stream.

### H-C
- STATEMENT: Make the formula's own self-test the instrument: each formula ends by running a shipped, frozen `substrate-check` that the checker then re-runs in a fresh clone, and FX-1 estimates (i) how often the formula's self-test reports complete and (ii) how often that report agrees with an independent purpose-level human audit.
- WHY MORE INFORMATIVE: Removes convention dependence (the formula fixes names, ids, lock format), tests what a user experiences ("how to check it worked"), and turns checker validity into a measured agreement rate rather than an assumption.
- WHAT IT NEEDS (arms, n, readout): FORM with shipped checker vs FORM without it (to see whether the self-test changes completeness); about 100 runs per arm per language; readout: completeness rate and human-agreement rate with intervals.

## 5. Convince-me statements
- WHAT RESULT WOULD CONVINCE ME THE FORMULAS PRODUCE A COMPLETE, WORKING SUBSTRATE: Lower 95% bounds of at least 0.90 per element in each stream under a checker whose every enforcement probe passed a paired clean control, whose script route was baseline-filtered, and whose false-PASS and false-PARTIAL rates were each shown below 0.05 on an independently authored, fixture-shaped corpus, with a purpose-level human audit agreeing on the main-study sample.
- WHAT RESULT WOULD CONVINCE ME THEY DO NOT: Upper 95% bounds below 0.90 for elements that the formula instructs, where CHK (told exactly, with upper bound) clears 0.80, and where the human audit of a sample of failures confirms the element truly missing or not working (not a convention mismatch).
- WHAT THE DESIGN AS WRITTEN WOULD NEED, SO THAT BOTH ARE POSSIBLE: Paired clean probes and a baseline script filter (F-01, F-02); one enforcement standard across elements and stacks, including push (F-05, F-08); behavioural rather than format-matching definitions for E10 and E12 (F-09, F-10, F-13); fixture-shaped and independently authored positive controls for all five types with a registered generation OS (F-15, F-19); a symmetric audit that bounds harshness as well as leniency (F-23); and a corrected audit adjustment re-simulated with all three interval methods (F-03).

## 6. What I could not assess, and what I checked and found sound
Not assessed: `experiments\fx1\simulation\results.md` and `simulate.js` (not in my list), so the section 4.3 numbers were taken as quoted and only re-derived by hand where noted; the formulas and the `SUBSTRATE-CHECKLIST` (absent, so I cannot tell whether they fix names, ids, lock format and paths, which would move several harshness findings to formula-following failures); the review record; Python adapter beyond the code paths read; actual Linux behaviour of orphan processes and hook exec bits (inferred from code and general knowledge, not run). Checked and found sound: the intersection-union argument for CONJ-s; the trailing-section E07 plant does not change the previous section's normalised hash; C0 confounding is applied uniformly to probe elements; the environment scrub of `npm_*` and `NODE_TEST_CONTEXT`; the co-change fixture gate's logic matches its declared rule.
