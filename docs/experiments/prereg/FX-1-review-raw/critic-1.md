# FX-1 critique: anthropic claude-opus-5-5

## 0. Header
- VENDOR: anthropic
- MODEL_ID_AS_SHOWN: claude-opus-5-5 (self-reported by the agent; not shown by a picker)
- HARNESS: claude-code-subagent
- ROUND: 1
- DATE_UTC: 2026-10-06T03:24:10Z
- REPO_HEAD: a7a94bcfdb504c7c75b8064bafc344b5c4434756
- BRANCH: experiment-protocol-2026-10-02
- FILES_READ:
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\COPILOT-CRITIC-RUNBOOK-FX1.md  sha256=fea788e40f4088810b66a25c5e90f418142220db54d49be933f46f0d958cffc4   (instructions only)
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\prereg\FX-1.md  sha256=d231685f56a3162abed072ab8e08cc18497f60019b678ba62deaf8cfa89b1c34
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\FX-1-CHECKER-SPEC.md  sha256=a9847bc1e40c0854aeae1daf283539b9a3b926cf658b0f59445c1e44212a1e58
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\EXPERIMENT-PROTOCOL.md  sha256=b0c830c1572dc75b47c324e2abf9449a7586d930a83cdd9da2588e89b2829cd1
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\experiments\fx1\checker\config.default.json  sha256=ef286374511fcfaccb71e830608d931c405dccfe8bec79c5bc7bdfeda41b602b
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\experiments\fx1\fixtures\README.md  sha256=9cc9ad8ae6de2a257e5de345eefb808dcebc58d75e3016a19ef7740f2f9cc253
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\experiments\fx1\fixtures\FIX-API-lendmark.md  sha256=a6d41d62ab6cee714827d2197edeed6ecc3a794b73ef646b679d813f117f0634
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\experiments\fx1\fixtures\FIX-CLI-stitchcount.md  sha256=e0c282fb20932b7c831299b02c2803de3cc048e06b05dba9825289c87604dbeb
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\experiments\fx1\fixtures\FIX-PIPE-tidewatch.md  sha256=13fb45cfa72ff6f9cafd1aa517f4e6e6d39cbcee627f8976697e8020eb3f725e
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\experiments\fx1\fixtures\FIX-GAME-cinderfall.md  sha256=efc562141420bea20c0259bb1928b923dccf1850a96d4458cea89f8ed2560942
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\experiments\fx1\fixtures\FIX-MCP-shelfwise.md  sha256=2acbdc121a5538c5a25208c8d6e54ea022d05c490ff3d8bf852a1c8e42bf94f9
  - C:\workspace\PragmaWorks\gs\gs-experiment-protocol\experiments\fx1\simulation\results.md  sha256=c7a649e77e9d68c6c7c359a553014fb08159f23f5513e8605770cec9c4245d5c
- FILES_NOT_READ_ATTESTATION: I read no other file and used no tool other than reading these files and the git and hash commands.
- PRIOR_EXPOSURE: The launching session's context includes the user's auto-memory index, which names GS concepts (sentinel, formulas, SAVED, experiment protocol) in one-line summaries; none of it concerns FX-1, its checker or its review record. No earlier FX-1 review was seen.
- NOTES: Run as a Claude Code subagent, not via Copilot; no picker id exists, so the model id is self-reported. Critic shares a vendor with generator M1. Numerical claims below that are not in results.md were computed by hand from the standard Wilson and Clopper-Pearson formulas (flagged per finding).

## 1. Verdict in at most five sentences
I would not register this design as written. The single most important defect is that the headline claim (CONJ) is mis-computed: it requires ALL-s at `USUALLY`, which at independent per-element rates of 0.97 or 0.98 is almost never met, and the third interval method (audit-adjusted bound) is absent from the simulation and, by hand calculation, makes `RELIABLE` nearly unreachable below a true rate of about 0.99; the quoted decision probabilities are therefore wrong in the optimistic direction for the design's power and in the pessimistic direction for the formulas. Several taxonomy and decision rules (RUN-VARIANCE, the CHK row, the F0 bar) give the formulas escape hatches, while several checker conventions (README install requirement, source directories, python script route, generation OS) would score correct projects down. I would trust the checker's `PASS` for E03, E08 and E09 roughly as specified; I would not trust it for E05, E06 and E07 until the confounds named below are closed.

## 2. Findings (ranked: all BLOCKER first, then MAJOR, MINOR, NIT)

### F-01
- SEVERITY: BLOCKER
- CATEGORY: estimation
- DIRECTION: UNINFORMATIVE
- FILE_AND_SECTION: FX-1.md, section 4.3 ("The headline claim is the hard one") and section 2.3 (CONJ-s row)
- QUOTE: "If every element truly sits at 0.97, the probability that one stream certifies all twelve is 0.87 if the twelve outcomes are independent and 0.99 if they are perfectly correlated; at 0.95 it is 0.03 to 0.75; at 0.98 it is 1.0."
- PROBLEM: CONJ-s requires "all twelve `MEETS` and ALL-s at `USUALLY` or above". Under independence, theta = 0.97^12 = 0.69 and 0.98^12 = 0.78 (hand computation). results.md gives P(MEETS 0.80) = 0 at true q = 0.75 and 0.432 at 0.85, so at independent 0.97 or 0.98 CONJ is essentially never met, not 0.87 or 1.0. The 0.87 is also 0.989^12 from the homogeneous Wilson-only table; with the registered cell-bootstrap it is about 0.963^12 = 0.64 (moderate) or 0.886^12 = 0.23 (strong), before the audit adjustment (F-02). The headline's decisiveness is overstated and the bar is mis-described to the reader.
- FIX: Simulate CONJ-s jointly (twelve correlated Bernoulli elements per run, cell heterogeneity, all three interval methods, ALL-s rule) and quote that. State plainly: under independence CONJ needs about 0.99 per element (0.9913^12 = 0.90). Either drop the ALL-s clause from CONJ or lower its rung and say why.
- CONFIDENCE: high

### F-02
- SEVERITY: BLOCKER
- CATEGORY: estimation
- DIRECTION: UNDERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1.md, section 2.2 item 3, and section 9.1 (audit disagreement)
- QUOTE: "the Wilson lower bound computed after subtracting, from the number of `PASS` results, the upper 95% Clopper-Pearson limit of the checker's false-PASS rate measured on the human-audited sample (section 6.3) times the number of `PASS`."
- PROBLEM: Not in the simulation, yet a conjunct of `RELIABLE`. With zero false-PASS among about 80 audited PASS judgments the two-sided 95% CP upper limit is about 0.045 (hand computation); 204/210 (true 0.97) adjusted becomes about 195, Wilson lower bound about 0.88, so `RELIABLE` fails even with a perfect checker; it needs roughly 210/210. If the audit is per stream (84 runs "stratified by stream", about 21 per stream) the upper limit is at least 0.13 and nothing can be `RELIABLE`; 9.1's "upper 95% limit is 0.05 or more ... invalidates" kills every element below about 60 audited PASSes even with zero errors. "Section 6.3" does not exist.
- FIX: Specify pooling (per element across streams, with a separate Spanish check), replace the subtraction of an upper limit with a misclassification-corrected interval (Rogan-Gladen with bootstrap over both audit and study samples), size the audit by simulation (likely at least 150 PASS judgments per element), add method 3 to simulate.js, and fix the cross-reference.
- CONFIDENCE: medium

### F-03
- SEVERITY: MAJOR
- CATEGORY: informativeness
- DIRECTION: UNINFORMATIVE
- FILE_AND_SECTION: FX-1.md, section 2.4 and section 4.3 (choice of n)
- QUOTE: "the elements that need executed, verified behaviour (E05 enforced gate, E06 ratchet, E07 open-questions gate, E10 lock, E11 co-change) are expected much lower, 0.3 to 0.8"
- PROBLEM: By the authors' own prior, five elements fail and CONJ and ALL-s fail with near certainty; n = 210 per stream was sized for a "central 0.93" that is not the prior for those elements. results.md shows n = 50 already gives P(FAILS) = 0.96 at 0.70 and 0.556 at 0.80. Row (d) then requires a rewritten step and a linked FX-1b re-run, so most of the 840-run budget buys confirmation of a predicted failure on a formula version that will be replaced. The modal outcome changes a decision (rewrite steps) that a far smaller run would already trigger.
- FIX: Make FX-1 two-stage: a registered diagnostic stage (about 50 runs per stream, FAILS-TARGET only, pre-declared revision budget for formula text per protocol stage 4), then freeze the revised formulas and run the 210-per-stream confirmatory stage once. Budget the FX-1b now rather than implicitly.
- CONFIDENCE: high

### F-04
- SEVERITY: MAJOR
- CATEGORY: failure-taxonomy
- DIRECTION: OVERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1.md, section 9.3 items 2 and 5; section 10 row (d)
- QUOTE: "the stream's `PASS` rate for it is below 0.80 with at least two of the three vendors individually below 0.80"
- PROBLEM: An element with pooled rate 0.80 to 0.89 and an upper bound below 0.90 is `FAILS-TARGET`, but is not FORMULA-STEP (rate not below 0.80), and if vendors and fixtures are similar it is not MODEL-SPECIFIC or PROJECT-TYPE: it falls to "RUN-VARIANCE: everything else". Row (d) applies only with "diagnosis FORMULA-STEP", and no row covers FAILS-TARGET plus RUN-VARIANCE, so a failed element gets no named formula consequence and no required rewrite. Uniform failure across vendors is the strongest evidence of a formula problem, yet it is the case the cascade does not attribute to the formula.
- FIX: FORMULA-STEP: "the formula instructs the element and the element is `FAILS-TARGET` in the stream, and no single vendor or fixture accounts for the shortfall (MODEL-SPECIFIC and PROJECT-TYPE tests negative)". Delete RUN-VARIANCE as a label for `FAILS-TARGET` elements; keep it only for `UNRESOLVED`.
- CONFIDENCE: high

### F-05
- SEVERITY: MAJOR
- CATEGORY: decision-table
- DIRECTION: OVERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1.md, section 10 row (j); section 9.3 item 6
- QUOTE: "The element's definition, the checker or the model class is the limit, not the formula wording"
- PROBLEM: CHK gives the requirements without steps; a formula exists precisely to supply the procedure. A CHK rate below 0.80 does not show the element is unachievable; it shows requirements alone are insufficient, which is the formula's job to fix. Row (j) forbids "Blaming the formula for it", so any hard element is shielded. "Below 0.80" is undefined (point or bound) on 45 to 90 runs (about plus or minus 0.1), CHK is English-only so the rule cannot apply to ES streams, and the formula page would not report the failure.
- FIX: Row (j) permits only "requirements alone do not produce e"; the formula claim for e stays `FAILS-TARGET` and is published as such. Infeasibility needs a stronger ceiling arm (CHK plus a reference implementation of the gate, or a frontier model) with a lower bound below 0.80, and is labelled for the element, not used to exempt the formula.
- CONFIDENCE: high

### F-06
- SEVERITY: MAJOR
- CATEGORY: controls
- DIRECTION: OVERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1.md, section 3 arms table (F0) and section 10 row (i)
- QUOTE: "an element a generic prompt already yields at 0.90 or more is `NOT-ATTRIBUTABLE` to the formula"
- PROBLEM: F0 has 90 runs over two paths, 45 per path, English only. If "reaches the bar" means the registered bar (lower bound at least 0.90), at n = 45 only 45/45 qualifies (Wilson lower bound about 0.92; 44/45 gives about 0.89, hand computation). Row (i) therefore practically never fires, so elements the neutral build step or a generic prompt produce (E09 commits, E12 README, E05 tests on path B, whose brief asks for "It has tests") are credited to the formula. For ES streams there is no F0 at all.
- FIX: Define attribution as a difference: element e is attributable only if the FORM rate exceeds F0 by a registered margin (for example 0.20, Newcombe interval excluding 0) per path; otherwise label it `NOT-ATTRIBUTABLE`. Size F0 per path for that contrast (about 60 runs per path), or state explicitly that attribution in ES is untested.
- CONFIDENCE: high

### F-07
- SEVERITY: MAJOR
- CATEGORY: decision-table
- DIRECTION: OVERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1.md, section 10 row (a) public claim; FX-1-CHECKER-SPEC.md, section 7 item 9
- QUOTE: "each of the twelve elements was present and working in at least 90 percent of runs (95 percent interval)"
- PROBLEM: The checker spec says "FX-1 row (a) therefore says the claim is \"meets this operational definition\"", but the row (a) sentence does not contain that qualifier, and section 11 wording does not either. "In at least 90 percent of runs" also states a sample frequency, while the lower bound is about the underlying probability; readers will read "present and working" as semantic quality, which the checker explicitly does not test (L01, L02, five-word criteria).
- FIX: Row (a) sentence: "... each of the twelve elements met the FX-1 checker's operational definition (structural and behavioural, not content quality) with an estimated success probability of at least 90 percent (lower 95 percent bound) ...". Apply the same qualifier to every rung in section 11.
- CONFIDENCE: high

### F-08
- SEVERITY: MAJOR
- CATEGORY: estimation
- DIRECTION: OVERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1.md, section 2.1 (pi(e,s)) and section 2.2 items 1 and 2
- QUOTE: "averaged with equal weight over the 15 cells of the stream (the design is balanced, so this equals the pooled proportion)"
- PROBLEM: The estimand is conditional on these 15 fixed cells, but the published claims ("five project types and three model vendors") read as generalisation. Wilson on 210 treats runs as iid; the cell bootstrap treats 15 cells as exchangeable draws, but cells are a crossed 5 x 3 design: a vendor effect is shared by five cells, and with three vendors the between-vendor variance is essentially inestimable, so the bootstrap understates uncertainty about "vendors" and a percentile bootstrap with 15 clusters is itself anti-conservative. Neither method's estimand is stated, and the two methods answer different questions.
- FIX: State the estimand as conditional on the registered fixtures and models, and word claims accordingly ("for these three models"). If generalisation is wanted, use a two-way bootstrap (resample fixtures and vendors independently) or a crossed random-effects model, and report per-vendor lower bounds as the primary vendor statement.
- CONFIDENCE: medium

### F-09
- SEVERITY: MAJOR
- CATEGORY: fixtures
- DIRECTION: OVERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1.md, section 4.1; FX-1-CHECKER-SPEC.md, section 3 row E02
- QUOTE: "The briefs are not specifications: they carry no ids, no criteria, no structure; turning one into a specification is the formula's job."
- PROBLEM: Every brief has a numbered "What it must do" list (7 to 9 items), exact numbers (14 days, 0.25 per day, exit codes 2 and 3, 3 MADs) and a three-part first slice: they are near-specifications, and a model can satisfy E02 by prefixing ids to the numbered list. E02's pass bar is also minimal: "at least one **requirement id**" and "at least 3 **criterion ids**", so a spec covering one requirement of a nine-behaviour brief passes. E02 and E08 rates will exceed what a real, vague brief yields.
- FIX: Add at least two fixtures written as unstructured prose with ambiguities (or rewrite all briefs that way via the independent reader) and report them separately. Raise E02 to: at least one requirement id per first-slice feature and at least one criterion per requirement, with the counts registered per fixture.
- CONFIDENCE: high

### F-10
- SEVERITY: MAJOR
- CATEGORY: procedure
- DIRECTION: UNDERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1-CHECKER-SPEC.md, section 3 row E09; FX-1.md, section 3.2
- QUOTE: "Over the whole history: at least 4 commits; at least 95% of subjects match the conventional pattern"
- PROBLEM: On path B the history is mostly written by the neutral build prompt ("Use git and commit your work as you go"), which asks for no convention. F2 cannot honestly rewrite that history. With a handful of commits, one non-conventional MVP commit takes the share below 95%, so E09 on path B measures the neutral prompt, not F2, and is expected to fail regardless of the formula. On path A, it is unspecified who commits uncommitted work at the end.
- FIX: Score E09 on commits after the formula's first step (record the boundary commit in the harness); report whole-history E09 as descriptive. State that the harness never commits; uncommitted work is simply absent.
- CONFIDENCE: high

### F-11
- SEVERITY: MAJOR
- CATEGORY: checker-leniency
- DIRECTION: OVERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1-CHECKER-SPEC.md, section 3 row E06
- QUOTE: "Also recorded, not required: lowering the floor is rejected"
- PROBLEM: E06 is defined in FX-1 2.1 as "a measured floor that cannot go down", but the probe only tests that an unattainable floor blocks; it never requires that lowering the floor is rejected. A repository whose gate compares the current metric to a floor file that anyone can edit downward passes, though it lacks the defining property. Combined with L02 (a frozen file passes), E06 PASS can mean either "file is frozen" or "floor enforced but freely lowerable", neither of which is a ratchet.
- FIX: Require both probes for PASS: (i) unattainable floor rejected, (ii) lowered floor rejected, (iii) a raised-but-attainable floor (current measured value) accepted. Probe (iii) also closes L02, since a frozen file rejects it.
- CONFIDENCE: high

### F-12
- SEVERITY: MAJOR
- CATEGORY: checker-leniency
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: FX-1-CHECKER-SPEC.md, section 4 (script probe) and rows E06, E07, E10
- QUOTE: "A **script probe** runs every non-lifecycle `package.json` script on the mutated working tree."
- PROBLEM: "Rejected ... by a script" is satisfied if any non-skipped script exits non-zero on the mutated tree. Only E07 states that the clean tree must be accepted; for E06 and E10 no clean-tree baseline per script is stated, so a script that always fails (an e2e script needing a server, a lint with pre-existing errors) credits E06 and E10. Conversely, python fixtures (FIX-CLI, FIX-PIPE) have no package.json, so they can pass E06, E07 and E10 only by a hook: an asymmetric bar across stacks that the PROJECT-TYPE rule would then blame on the fixture.
- FIX: Credit "by a script" only for a script that passes on the clean tree and fails on the mutated one, and whose output names the mutated file. Add a python equivalent (a registered set: Makefile targets, `python -m` entries listed in README or pyproject scripts) or drop script credit for both stacks.
- CONFIDENCE: medium

### F-13
- SEVERITY: MAJOR
- CATEGORY: checker-leniency
- DIRECTION: OVERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1-CHECKER-SPEC.md, section 3 row E07
- QUOTE: "A planted open-question marker (`OPEN:`, `ABIERTA:`, `PREGUNTA ABIERTA:`) in a new trailing section of the spec is rejected at commit or by a script; the clean tree is accepted."
- PROBLEM: The negative probe (marker present) is paired with an unmodified clean tree, not with a clean edit of the spec. A gate that rejects any new spec section, any spec edit without a co-changed file, or any spec change at all passes E07 without knowing what an open question is. The same holds for E10 (a fully frozen spec passes stale detection). The marker list is also case-sensitive as written ("Open:" or "OPEN QUESTION:" would go unnoticed).
- FIX: Add a paired positive probe: the same trailing section without the marker must be accepted at commit; PASS requires both outcomes. Make marker matching case-insensitive and include the formula's own marker from the frozen coverage map.
- CONFIDENCE: high

### F-14
- SEVERITY: MAJOR
- CATEGORY: checker-leniency
- DIRECTION: OVERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1-CHECKER-SPEC.md, section 3 row E05; section 7 item 6
- QUOTE: "an installed hook blocks, **at commit or at push**, a planted failing test or a planted syntax error"
- PROBLEM: "or" lets a syntax-only hook (`node --check`, `python -m py_compile`) pass E05 without running tests. The planted failing test is a new untracked test file without criterion coverage, so an E08-style coverage gate or a "new file must be registered" rule blocks it for an unrelated reason, crediting E05 (the declared leak 7.6). The declared mitigation, a stored output tail for audit, covers only 10 percent of runs and is not used in scoring.
- FIX: Require both planted violations to be blocked. Credit a block only if the hook's output contains the planted test's name or the assertion text (for the syntax error: the file name and a parser message). Plant the failing test inside an existing, covered test file instead of a new one.
- CONFIDENCE: high

### F-15
- SEVERITY: MAJOR
- CATEGORY: checker-harshness
- DIRECTION: UNDERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1-CHECKER-SPEC.md, section 3 row E12; config.default.json "readme"
- QUOTE: "at least one install and one test command present"
- PROBLEM: Four of five fixtures are zero-dependency by brief (Cinderfall "no runtime packages", Lendmark "no web framework", Stitchcount and Tidewatch "standard library only"); a correct README may say "no install needed". "All succeed" also fails a CLI README that documents its error behaviour (Stitchcount requires exit codes 2 and 3; a README showing `stitchcount expand "(k2"` exits 2). If commands run as separate shells, `source .venv/bin/activate` does not persist; in a Debian-based image a bare `pip install` fails with externally-managed-environment. All are scored as project faults.
- FIX: Require an install command only when the manifest declares dependencies; run each fenced block as one shell session; accept documented non-zero exits when the README states the expected code; pin an image where `pip install` into a venv or user site is permitted, and add a control for each case.
- CONFIDENCE: medium

### F-16
- SEVERITY: MAJOR
- CATEGORY: failure-taxonomy
- DIRECTION: UNDERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1.md, section 9.3 item 4; config.default.json "sourceDirs"
- QUOTE: "Attributed to the project type (for example an MCP server has no `src/` directory for the co-change gate)."
- PROBLEM: The example is a checker convention gap ("sourceDirs": ["src", "lib", "app"]), not a property of MCP servers. Python CLIs and pipelines conventionally use a package directory named after the project (`stitchcount/`, `tidewatch/`), and small Node servers put `server.js` at the root. E11 and the E05 syntax-error probe ("appended to the first source file") then have nothing to plant into, and the cascade labels the checker's blindness as a project-type failure, putting it in a published row (e) as a fact about project types.
- FIX: Derive source files from the manifest (package.json main/bin/exports, pyproject packages) and tracked non-test code files, not fixed directory names. Add a cascade step before PROJECT-TYPE: "CHECKER-CONVENTION: the element was not probed because the checker could not locate the target"; it routes to row (h), not row (e).
- CONFIDENCE: high

### F-17
- SEVERITY: MAJOR
- CATEGORY: procedure
- DIRECTION: UNDERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1.md, section 6 V-C6 and section 5 step 1
- QUOTE: "The authoritative checker runs on Linux (the executable-bit check of installed hooks and the shell behaviour differ on Windows"
- PROBLEM: The generation environment's OS is not registered. If runs are generated on this Windows machine, hook scripts committed by the agent typically carry mode 100644 (core.filemode false) and may have CRLF shebangs; on the Linux clone git ignores non-executable hooks or fails to run them, so E05, E06, E07, E10, E11 drop to `PARTIAL` (or C0 blocks everything) for a reason the agent could never observe. This is a systematic, vendor-independent bias against the formulas, and it would be mislabelled FORMULA-STEP.
- FIX: Register the generation OS as the same pinned Linux container as the checker (agent runs inside it), or, if generation stays on Windows, add a control (a known-good hook committed from Windows) and a checker rule that normalises mode and line endings before probing, declared as a deviation from a strict Linux user.
- CONFIDENCE: medium

### F-18
- SEVERITY: MAJOR
- CATEGORY: fixtures
- DIRECTION: UNDERSTATES-SUCCESS
- FILE_AND_SECTION: fixtures README.md, table (FIX-CLI, FIX-PIPE); FX-1-CHECKER-SPEC.md, section 4
- QUOTE: "Python 3.11, standard library and pytest only"
- PROBLEM: The stack constraints forbid the usual hook tooling (pre-commit, husky-like packages) on python fixtures; `pre-commit install` also fetches hook repositories from GitHub, which "network limited to the package registries" blocks. An obedient agent either violates the brief or hand-writes hooks, and the checker's fallback ("`npm install`, `pip install`") cannot install a hook for a stdlib-only project. Gate elements will be lower on the python fixtures for reasons of brief wording and sandbox network, which PROJECT-TYPE then attributes to "data pipeline" or "CLI".
- FIX: State in each brief that development tooling is unrestricted (only runtime dependencies are fixed), allow the registries those tools need, and add a python known-good control using pre-commit plus one using a hand-written hooksPath, both run in the pinned container.
- CONFIDENCE: medium

### F-19
- SEVERITY: MAJOR
- CATEGORY: controls
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: FX-1.md, section 6 V-C1 and V-C4
- QUOTE: "every disagreement fixed, the checker version bumped, and the controls re-run"
- PROBLEM: The 24-run pilot is used both to repair the checker and to certify it (agreement at least 0.95, zero false-PASS unresolved): after repairs, the pilot agreement is in-sample and says nothing about validity on new repositories, and 24 runs cannot cover 60 stream x fixture x vendor combinations or the Spanish heuristics. V-C1 known-goods "built by someone who did not write the checker" will be built against the public checker spec, so they test implementation, not harshness. The human auditor judges "by the same written definitions", which are the checker's probes, so agreement measures re-execution, not construct validity; 1,000 such judgments in 20 hours is about 70 seconds each.
- FIX: Split: a repair set (pilot) and a held-out validation set (at least 24 further runs, not used for fixes) that must meet the agreement rule after the last checker change. Build at least two known-goods from the SUBSTRATE-CHECKLIST only, without the checker spec. Give the auditor a construct-level definition plus the probe log, and re-budget audit time.
- CONFIDENCE: medium

### F-20
- SEVERITY: MAJOR
- CATEGORY: procedure
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: FX-1.md, section 14
- QUOTE: "cost per run above 1.7 times the estimate: stop and amend"
- PROBLEM: The cost range ("$900 to $4,100") exceeds the "hard cap $3,500", and the protocol (section 5) forbids amending after outcome data exist; at the 15 percent interim look, checker reports already exist. No rule says what n results if the study stops, and the decision probabilities depend on n (the n = 150 fallback is stated only as a pre-freeze amendment). The time estimate ("4 to 10 minutes of agent time" for about 120 turns with installs and test runs) looks optimistic by several times, which affects wall-clock and vendor-drift exposure ("one date").
- FIX: Register the stop rule now: if the interim look trips the cost flag, the study stops at a pre-declared reduced design (for example drop to two streams, A-EN and B-EN, at the full 210, never fewer runs per cell), with its decision probabilities pre-computed. Take per-run cost and duration from FX-0 and set the cap at the FX-0 upper estimate.
- CONFIDENCE: medium

### F-21
- SEVERITY: MINOR
- CATEGORY: checker-harshness
- DIRECTION: UNDERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1-CHECKER-SPEC.md, section 3 introduction (C0)
- QUOTE: "if C0 is blocked, every probe-based item is `PARTIAL` with the reason \"confounded by the baseline block\""
- PROBLEM: A legitimate strict policy (every commit message must cite a requirement or decision id) blocks C0, a conventional docs-only commit without an id, and zeroes five elements at once. That is a plausible output of a GS formula emphasising traceability.
- FIX: Run C0 with two messages (without and with a valid id taken from the spec); treat the baseline as accepted if either commits, and use the accepted message style for all subsequent probes.
- CONFIDENCE: medium

### F-22
- SEVERITY: MINOR
- CATEGORY: checker-leniency
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: FX-1-CHECKER-SPEC.md, section 3 row E01
- QUOTE: "At least 3 distinct **non-empty** existing files or directories routed from it by markdown links or inline-code paths (outside fenced blocks), and **no** referenced path that does not exist"
- PROBLEM: Lenient: `src/`, `tests/` and `package.json` count as three routes, so a sentinel that routes to no GS document passes. Harsh: a sentinel that names a planned file of a later feature (normal for a first-slice project) is `PARTIAL` for one dangling reference.
- FIX: Require at least three routes to distinct documentation files among spec, decisions and cascade candidates; tolerate dangling references listed under a heading matching "planned" or "future", or count them as a subflag instead of a failure.
- CONFIDENCE: medium

### F-23
- SEVERITY: MINOR
- CATEGORY: checker-harshness
- DIRECTION: UNDERSTATES-SUCCESS
- FILE_AND_SECTION: config.default.json, "idToken" and "criteriaHeading"
- QUOTE: "\"criteriaHeading\": \"(acceptance|criteri|aceptaci)\""
- PROBLEM: Criteria written as Given/When/Then under "Scenarios"/"Escenarios", or as markdown table rows, are not found. The idToken matches the tail of compound ids, so `AC-FEAT-01` and `REQ-FEAT-01` both yield `FEAT-01` and trigger the duplicate-id failure. These conventions are model- and language-dependent, so they bias vendor and ES comparisons.
- FIX: Add scenario/escenario headings and table-row parsing; anchor idToken so it does not match after a hyphen (`(?<![-\w])`), and add controls for each variant, including a Spanish one.
- CONFIDENCE: medium

### F-24
- SEVERITY: MINOR
- CATEGORY: procedure
- DIRECTION: UNDERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1.md, section 3
- QUOTE: "sends the next step of a multi-step formula when the agent finishes the previous one"
- PROBLEM: "Finishes" is not mechanically defined (agent stops, asks to continue, or claims completion), and the fixed reply cannot perform a step the formula assigns to the human (run a hook-install command, ratify a spec), so such formulas fail in a way a real user would not experience.
- FIX: Define step completion as "the agent's turn ends without a tool call"; register that any formula step addressed to the user is performed by the harness as a scripted action listed in the coverage map, and count such steps as a descriptive variable.
- CONFIDENCE: medium

### F-25
- SEVERITY: MINOR
- CATEGORY: procedure
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: FX-1.md, section 5 step 2
- QUOTE: "Per-step cap `[FROM FX-0]` turns and a wall-clock cap per run `[FROM FX-0]`; a cap hit is scored as is."
- PROBLEM: Caps are chosen after seeing pilot runs whose checker outcomes are visible, so the cap can be tuned (loosely or tightly) with knowledge of how elements fare. Under intention to treat, the cap directly moves rates.
- FIX: Register the rule now: cap = 3 x the 90th-percentile turns (and time) of FX-0 runs per path, computed by script without reference to element outcomes.
- CONFIDENCE: medium

### F-26
- SEVERITY: MINOR
- CATEGORY: fixtures
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: FX-1.md, section 4.1
- QUOTE: "recall above zero makes that fixture `INVALID-DESIGN` for that vendor (guard c)"
- PROBLEM: "Recall" has no scoring rule (models answer cold questions with plausible invention), so the trigger is either always or never met at the scorer's discretion. It also guards the wrong contamination: memorised briefs barely matter here, while public GS canon and checker spec in training data (declared Goodhart) do.
- FIX: Define the canary score: the model's answer is checked for at least two brief-specific facts (for example "supporters get half again as long", "exit code 3") by a fixed string list; recall is above zero only if one is matched. Separately probe and report knowledge of GS terms as a descriptive covariate.
- CONFIDENCE: medium

### F-27
- SEVERITY: MINOR
- CATEGORY: estimation
- DIRECTION: OVERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1.md, section 2.3 (CONJ-s row)
- QUOTE: "intersection-union: no multiplicity correction is needed because a conjunctive claim is accepted only if all twelve individual bounds pass"
- PROBLEM: The intersection-union argument is correct for CONJ, but the study also publishes 48 element-stream `RELIABLE` statements individually on formula pages (section 10, downstream item 1). Their family-wise risk of at least one false `RELIABLE` is not controlled by the IUT argument.
- FIX: Add: "Individual element rungs are reported with per-claim 95 percent bounds; the probability that at least one of the 48 is falsely `RELIABLE` is not controlled, and formula pages say so", or use simultaneous (Bonferroni over 12 per stream) bounds for the per-element rung.
- CONFIDENCE: high

### F-28
- SEVERITY: MINOR
- CATEGORY: decision-table
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: FX-1.md, section 10 rows (c), (k), (v); section 9.2
- QUOTE: "No element `FAILS-TARGET`; some `UNRESOLVED` at 0.90 with the lower bound at or above 0.80"
- PROBLEM: An element `UNRESOLVED` at 0.90 with a lower bound below 0.80 and no `FAILS-TARGET` (plausible at a true 0.85) has no row other than (k), which requires "Everything unresolved". Row (v) makes infrastructure loss above 5 percent `INVALID`, while 9.2 calls the same event a "stop-and-amend trigger": two different consequences for one event.
- FIX: Make rows apply per element (each element gets exactly one of a, c, d, e, f, i, j, k), add "UNRESOLVED below 0.80: report the rung reached", and align 9.2 and row (v) on one consequence.
- CONFIDENCE: high

### F-29
- SEVERITY: MINOR
- CATEGORY: failure-taxonomy
- DIRECTION: UNDERSTATES-SUCCESS
- FILE_AND_SECTION: FX-1.md, section 9.1
- QUOTE: "and each verdict uses the less favourable of the two."
- PROBLEM: If an audit finds a harsh-checker defect (correct repositories scored `PARTIAL`), the fix raises rates, but the rule keeps the old, wrong, lower rates. Harshness defects can therefore never be corrected after data, while leniency defects are; asymmetric by construction.
- FIX: Use the less favourable version only for defects classified false-`PASS`; for defects classified false-`PARTIAL` use the corrected checker, provided the fix is a convention addition validated by a new control and the auditor confirms it on the audited sample.
- CONFIDENCE: medium

### F-30
- SEVERITY: NIT
- CATEGORY: other
- DIRECTION: NEUTRAL-DEFECT
- FILE_AND_SECTION: FX-1.md, section 4.3
- QUOTE: "(n = 600 per stream, four times the cost, still leaves 0.28 indecisive at a true 0.93)"
- PROBLEM: 600/210 is 2.9 times, not four. The widths "210: 0.06 and 0.11" are not in results.md (its width table has 200 and 250, not 210), and "the lower bound clears 0.80 with probability above 0.99" at a true 0.93 is not in results.md either.
- FIX: Write "about three times the cost"; add n = 210 to the width table and the 0.93-versus-0.80 probability to simulate.js output, or cite them as hand computations.
- CONFIDENCE: high

## 3. Mandatory sections

### 3a. Ways the study or the checker would overstate success
- RUN-VARIANCE swallows uniform failures (F-04).
- CHK row shields the formula for hard elements (F-05).
- F0 attribution bar unreachable, so generic outcomes are credited to the formula (F-06).
- Public wording drops "operational definition" and reads as observed frequency (F-07).
- Crossed vendor/fixture structure understated; claims read as generalisation (F-08).
- Briefs are near-specs and E02 bar is minimal (F-09).
- E06 never tests "cannot go down" (F-11); script probe credits any failing script (F-12); E07/E10 credit any spec-blocking gate (F-13); E05 "or" and unrelated-gate confound (F-14); E01 routes to code folders (F-22).
- 48 uncorrected per-element claims (F-27).
- Semantic leaks L01/L02 and five-word criteria: not raised separately because declared; F-11 fix partly closes L02.

### 3b. Ways the study or the checker would understate success
- Audit-adjusted bound makes `RELIABLE` nearly unreachable (F-02).
- E09 on path B measures the neutral prompt (F-10).
- E12 install requirement, error-demo commands, venv/PEP 668 (F-15).
- Fixed sourceDirs and the PROJECT-TYPE mislabel (F-16).
- Windows generation versus Linux checking (F-17).
- Stdlib-only python briefs and registry-only network versus hook tooling (F-18).
- C0 blocked by strict-message policies (F-21); id grammar and criteria headings (F-23); user-addressed formula steps (F-24); "less favourable" rule locks in harsh defects (F-29).
- CI not credited: not raised because declared with a sensitivity analysis.

### 3c. Ways the study is unfalsifiable, cannot inform, or has a modal outcome that changes no decision
- CONJ is effectively unreachable under independence, so the headline is decided by the bar, not the data (F-01).
- The authors' own prior predicts the failure that 840 runs would confirm; a small diagnostic stage would trigger the same rewrite (F-03).
- The pilot certifies the checker in-sample (F-19).
- Stop-and-amend after data has no registered landing design (F-20).

## 4. Better designs (at most three)

### H-A
- STATEMENT: Two-stage FX-1: a diagnostic stage that finds `FAILS-TARGET` elements and drives a pre-budgeted formula revision, then one confirmatory stage on the revised, frozen formulas.
- WHY MORE INFORMATIVE: Spends the large n only on a formula version that has a realistic chance of meeting the bar, instead of confirming a predicted failure and then paying for FX-1b.
- WHAT IT NEEDS (arms, n, readout): Stage 1: FORM, 4 streams x 15 cells x 3 to 4 runs (about 50 per stream), readout = upper bound below 0.90 per element (P about 0.96 at true 0.70). Revision budget declared. Stage 2: 210 per stream on revised text, readouts as section 2.3 with the corrected CONJ simulation.

### H-B
- STATEMENT: The formula raises the per-element present-and-working probability over a generic prompt and over the bare checklist by at least 0.20 (lift, not level).
- WHY MORE INFORMATIVE: Attribution is the question that matters for "the formulas produce the substrate"; levels without a contrast cannot separate the formula from the model or the brief, and the current F0/CHK arms are too small to do it.
- WHAT IT NEEDS (arms, n, readout): FORM, F0, CHK at equal n on two streams (A-EN, B-EN), about 105 runs each per stream (7 per cell), Newcombe intervals for FORM minus F0 and FORM minus CHK per element; ES as a separate smaller replication of FORM only.

### H-C
- STATEMENT: Per-element success generalises across project types and models: estimate between-fixture and between-model variance.
- WHY MORE INFORMATIVE: With five fixtures and three models, "on five project types and three vendors" is a conditional statement; more fixtures with fewer runs each gives a predictive interval for a new project, which is what a Field Guide reader needs.
- WHAT IT NEEDS (arms, n, readout): FORM only, A-EN, 15 independently written fixtures x 3 vendors x 5 runs = 225 runs; crossed random-effects logistic model; readout = 95 percent predictive lower bound for a new fixture per element.

## 5. Convince-me statements
- WHAT RESULT WOULD CONVINCE ME THE FORMULAS PRODUCE A COMPLETE, WORKING SUBSTRATE: In every stream, each element's misclassification-corrected lower bound at least 0.90 with a held-out audited false-PASS rate near zero, a FORM minus F0 lift excluding zero for the gate elements, ALL-s lower bound at least 0.80, and per-vendor lower bounds at least 0.80, on fixtures including unstructured briefs, with paired positive and negative probes for every gate.
- WHAT RESULT WOULD CONVINCE ME THEY DO NOT: Upper bounds below 0.90 for the gate elements (E05, E06, E07, E10, E11) on at least two vendors, with CHK plus a reference implementation reaching the bar (so the element is achievable), and a held-out audit showing the checker's PARTIALs are correct.
- WHAT THE DESIGN AS WRITTEN WOULD NEED, SO THAT BOTH ARE POSSIBLE: A corrected joint simulation that shows CONJ is reachable at a stated per-element rate (or a redefined CONJ), a misclassification correction that does not make `RELIABLE` impossible with a perfect checker, a taxonomy where a uniform shortfall is attributed to the formula and CHK cannot exempt it, an F0 contrast defined as a difference, paired probes for E05 to E07 and E06's "cannot go down", stack-symmetric gate routes and source detection, a registered generation OS, and a held-out checker validation set.

## 6. What I could not assess, and what I checked and found sound
Not assessed: the checker source and its controls (`variants.js`), simulate.js itself (the heterogeneity model, the bootstrap implementation, the 1,000-rep Monte Carlo error of about 0.015 visible in the non-monotone central rows), the formulas and their coverage maps, the SUBSTRATE-CHECKLIST, the review record; several findings (F-12, F-14, F-16) could change if the code already handles those cases. Hand computations (F-01, F-02, F-06) use the textbook Wilson and Clopper-Pearson formulas from memory, not simulate.js. Checked and found sound: the quoted per-element classification probabilities at n = 150, 180, 210 and the ALL-s table match results.md, and the intersection-union logic itself is correct for the conjunctive claim.
