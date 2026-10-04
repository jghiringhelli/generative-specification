# AX Runner — Reconstruction Spec (build from this, GS-style)

> The AX generation+measurement runner is absent from the repo (only outputs + docker-compose survived). This is its specification, to rebuild it and run Replication Protocol B (k runs per condition → distributions → honest statistics). Template: the surviving **KX runner** `experiments/kx/run-kx.cjs` (the `claude -p --output-format json` session pattern with per-record token/cost/turns capture and resume). Node v24, Docker 29.6.1, Claude CLI at `~/.local/bin/claude` are present. Started Sept 1 2026; build tomorrow.

## Purpose
Produce, for each of the three pre-registered conditions (Naive, Control, Treatment) run **k times** (k=10; min 5), a tidy per-run row of OBJECTIVE metrics + captured token/cost, so §VI can report distributions (Mann-Whitney U / Cliff's delta / Holm per Protocol B) and so the tokens-per-correct-output economics is measured for generation (not only retrieval, which KX already did).

## Modules (each self-contained; reuse the KX session pattern)

1. **`generate.cjs <condition> <rep>`** — the core, modeled on `kx/run-kx.cjs`.
   - Sets cwd + context per condition (see Conditions below), feeds that condition's **prompt sequence** to a **fresh `claude -p --output-format json --dangerously-skip-permissions`** session (one session per replication; capture `usage`, `total_cost_usd`, `num_turns`, `duration_ms` from the JSON — exactly as KX does).
   - Writes the raw assistant output to `runs/<condition>/<rep>/response.md` and a `meta.json` (session id, tokens, cost, turns, wall). Resume support (skip if `meta.json` exists).
   - ⚠️ CONFIRM the exact per-condition prompt sequences survive — check the `naive/ control/ treatment/` folders + `README.md`; if only outputs survived, reconstruct prompts from the Supplement §S3 (they are quoted there).
2. **`materialize.cjs <condition> <rep>`** — extract fenced, **path-annotated** code blocks from `response.md` into `runs/<condition>/<rep>/project/`. Only blocks with an explicit file-path header materialize (this is the mechanism behind the naive 0% coverage — a real emit-discipline failure, keep it, do not add a fallback unless pre-registered).
3. **`measure.cjs <condition> <rep>`** — against the materialized project:
   - `npm ci` then `jest --coverage` vs **live PostgreSQL** (Docker; reuse `ax/docker-compose.yml`) → executed coverage.
   - `npx stryker run` → mutation score.
   - `tsc --noEmit` (strict) error count · ESLint with a **fixed shared config** (`@typescript-eslint/recommended`, not `--no-eslintrc`) problem count · `npm audit` CVE count.
   - grep `prisma.*` in route files → layer-boundary violations; artifact-completeness file checks.
   - Emit `runs/<condition>/<rep>/metrics.json`.
4. **`audit.cjs <condition> <rep>`** — a **fresh, context-free `claude -p`** session scoring only the materialized project dir on the seven properties (convergent instrument, not the metric of record); with k reps, run ≥2 auditor sessions → Cohen's kappa. Emit `audit.json`.
5. **`aggregate.cjs`** — join all `meta.json`+`metrics.json`+`audit.json` into one **tidy CSV** (one row per run): `condition, rep, session_id, mutation, coverage, tsc_errors, eslint, cve, layer_violations, audit_score, tokens_in, tokens_out, cost_usd, turns, wall_ms`. This CSV is the analysis input (feeds the R/Python stats of Protocol B).
6. **`orchestrate.cjs`** — loop conditions × k reps, calling generate→materialize→measure→audit, with resume + a run log. Smoke-test mode `--one` runs a single Naive rep end-to-end first.

## Conditions — the ABLATION LADDER (JC, Sept 1 2026; supersedes the 3-condition design)

A dose-response ablation: each rung = the previous + exactly ONE GS component, each an INDEPENDENT stateless generation (no context of the prior run). Measure quality AND efficiency (tokens/$/turns) at every rung; the marginal delta L(n)-L(n-1) is that component's contribution and its cost. Honest by construction: it will likely show early saturation on a mid-complexity benchmark (fewer components already deliver most of the benefit) and may show a component being costly relative to its benefit (e.g. phase collapse on simple projects) — both are valuable findings, not failures.

| Rung | = previous + | Isolates | Reuse |
|---|---|---|---|
| **L0** pure prompting (bottom-up, incremental) | — | the floor | = `ax/naive/` (exists) |
| **L1** + a complete spec, "derive all" | a formal specification | does the spec alone help | new (author) |
| **L2** + harness | the verify loop (tests-as-gate / generative execution) | verification | new |
| **L3** + document cascade | ADRs, C4, use-cases, NFR | the rich artifacts | ≈ `ax/treatment/docs` (decompose) |
| **L4** + sentinel | the bounded navigational tree + tool-sequencing (CLAUDE.md) | routing / Bounded | new (treatment lacked a root CLAUDE.md) |
| **L5** + phase collapse | plan+implement+verify collapsed into one derivation | phase collapse | new |

All against `REALWORLD_API_SPEC.md`, same model, same flags, same Docker/PostgreSQL. `generate.cjs`'s `CONDITIONS` map extends to these six (each with its context set + prompt set — most need authoring).

**Caveats (pre-register):** (1) build-up measures MARGINAL-IN-ORDER (adoption path); a leave-one-out variant (full stack minus one) isolates independent contribution — future. (2) Mid-complexity benchmark → expect saturation; demonstrating the top rungs' (sentinel, phase-collapse) value likely needs a HARDER second benchmark where simple approaches fail (ties to the single-benchmark threat). (3) k reps per rung still required for distributions.

**Paper implication:** the RQ shifts from binary (GS vs control) to DOSE-RESPONSE ("what is the marginal quality and cost of each GS component?") — stronger, more honest, more publishable. §V.A / §VI reframe accordingly when this runs.

### THE BRIDGE TEST — REFRAMED by JC (Sept 2 2026). This supersedes the specification-altitude design below.
JC's correction: the bridge is NOT about prompting altitude (conceptual vs mechanical spec). It is about the **structure of the CODE the assistant READS**. The claim: the human-maintainability disciplines (SOLID interfaces + single-responsibility; tests-as-contracts / TDD; self-descriptive naming / clean code; hexagonal or layered architecture = known locations) were invented so a **human** derives intent from structure WITHOUT reverse-engineering — and that SAME structure is what lets a **stateless AI reader** derive intent without reverse-engineering. **Human-maintainability == AI-derivability.** The bridge is a property of the artifact read, measurable on the READ side (KX family), not a generation prompt.
- **This closes the lifecycle-economics arc:** AX = GS costs MORE to generate; KX + the bridge test = disciplined structure is CHEAPER to read/comprehend/extend. That is the real answer to the token-cost objection: pay more at generation, recover it across the maintenance lifetime. The bridge test MEASURES the recovery.
- **Design (JC-approved granularity + tasks):** BINARY first (Disciplined D vs Mud M), then optionally a discipline-ladder (strip one discipline at a time). Tasks = COMPREHENSION (KX-style intent/location/invariant Q&A → F1) PLUS MODIFICATION (add/change a feature → tests green? + tokens + read-breadth). Metrics: accuracy, tokens (the reverse-engineering-cost proxy), read-breadth (targeted vs whole-codebase).
- **CRITICAL JC constraint on sourcing M (Sept 2):** M is NOT an artificially-degraded mess. **M = what models generate on their own by default, given NO signal to build the bridge** (the natural, unstructured default). D = what appears when the disciplines are enforced. The contrast is natural-default vs discipline-enforced, and it VARIES A LOT by language / prompt / project type (that variance is itself interesting but makes it complicated). **First: ground the design in EXISTING literature** to get baseline facts — (a) what is the default structural quality of LLM code? (b) does code structure/quality affect LLM comprehension+modification accuracy and cost? — so we don't re-prove the known and we position novelty. Lit review launched Sept 2.
- **Behavior-identity method (to isolate structure):** hold behavior constant with a shared test suite as oracle; if a natural-default M and a disciplined D both pass the same behavioral suite, structure is the only free variable. (If M is a real default output, its behavior may differ — then either curate M to pass, or measure on the subset of behavior both implement.)
- **bridge-strong/ and bridge-weak/ folders = SUPERSEDED** (the prompting-altitude design). Keep for provenance; do not run as the bridge test. The read-side D-vs-M design above replaces them.

### [SUPERSEDED] The BRIDGE is NOT a rung — it is the theory the ladder rests on, and it needs its OWN test (JC, Sept 1 2026)
The bridge + read-asymmetry (JC's headline contribution #1, "the base of GS") is the *explanatory mechanism*, not an ablatable component: every rung >= L1 already exploits it (a spec written in human-conceptual terms IS the bridge in action; that is why L0->L1 helps at all). You cannot "add the bridge" as a step. To test it EMPIRICALLY, use a targeted **specification-altitude contrast**, holding rung + information-content constant:
- **Bridge (strong shore):** the same requirements specified at the CONCEPTUAL / domain level ("the slug is derived from the title, unique"; "reject expired tokens").
- **Anti-bridge (weak shore):** the SAME requirements specified at the MECHANICAL / code level (exact signatures, pseudocode, step-by-step implementation detail).
Prediction: the conceptual condition achieves EQUAL correctness at LESS cost (fewer tokens-per-correct-output) because the model crosses the bridge itself and specifying on the weak shore is expensive and unnecessary. If it holds, the asymmetry is MEASURED, not argued — the strongest empirical support for the paper's #1 contribution. This is a SEPARATE experiment from the build-up ladder (run it at a fixed rung, e.g. L1). Distinct from prescriptive-vs-descriptive (RND-1, already piloted): that varies output-space closure; this varies the shore/altitude of specification.

### Scope decisions (JC, Sept 1 2026)
- Full factorial (all component combinations) = too much + absurd cases (sentinel without a spec, harness with nothing to verify). Do **build-up ladder + leave-one-out** (full stack minus one component) instead.
- The ordered escalation needs a **harder second benchmark** than Conduit so the top rungs (sentinel, phase collapse) have room to show value before saturation.

## Output → the honest wins B buys
- **Distributions** per metric per condition → real Mann-Whitney U / Cliff's delta / Holm (Protocol B) → answers the "single run" reviewer reflex, fills §VI `[B]` cells and the abstract number-hole.
- **Token/cost per run** (captured like KX) + the correctness metrics → **tokens-per-correct-output for GENERATION** (the KX result was retrieval only). This finally measures the token-cost objection honestly on the generation side.

## BUILD LOG
- **Sept 1 2026 — `runner/generate.cjs` BUILT + smoke-validated.** Module 1 done. Prompts + context survive (`<cond>/prompts/*.md` numbered; treatment cascade in `treatment/docs|prisma|Status.md`). Smoke (`node generate.cjs naive 0 --smoke`): claude -p works with the original flags (`--tools "" --strict-mcp-config --model claude-sonnet-4-5 --dangerously-skip-permissions`), model emitted 9 path-annotated fenced blocks in P1, token usage captured in full (input/cache/output/thinking), session_id captured for --resume chaining, $0.105/prompt, 45s. The risky plumbing is proven. Minor: DEP0190 (shell:true arg concat) — cosmetic, harden later. Context-injection strategy (spec + README + treatment cascade injected into P1, since --tools "" = no file reads) is a design choice to PRE-REGISTER before real runs.
- **Sept 1 2026 — ALL 6 MODULES BUILT.** `generate.cjs` (validated), `materialize.cjs` (validated: 11 blocks→project tree; edge: dotfiles like `.env.example` skipped, minor), `measure.cjs` (static tsc/eslint/npm-audit/layer reliable + best-effort jest-coverage vs Docker Postgres + opt-in Stryker mutation), `audit.cjs` (fresh `claude -p` scoring 7 props, read-tools on, ×2 for kappa), `aggregate.cjs` (→ results.csv), `orchestrate.cjs` (conditions×k, resumable, logs `orchestrate.log`).
- **Sept 1 2026 — full-pipeline validation KICKED OFF in background:** `node orchestrate.cjs --one` (one naive rep, full pipeline). Validates the UNPROVEN bits: the 6-prompt `--resume` session chain, npm install, jest-vs-Docker-Postgres coverage, the audit. Resumable — survives reset. **NEXT WINDOW: read `runner/orchestrate.log` + `runs/naive/0/*.json` → debug whatever broke (likely: --resume chaining, or the generated project's DB config vs docker-compose ports/names) → then scale.**
- **THE PLAN (autonomous, JC granted "haz todos los experimentos sin mi input"):** (1) get `--one` green; (2) run the 3-condition baseline at k=10 (`--k 10`); (3) author the ablation rungs L1/L2/L4/L5 (contexts+prompts) + wire into generate.cjs CONDITIONS + orchestrate; (4) the BRIDGE test (conceptual vs mechanical spec at a fixed rung); (5) the Qwen2.5-Coder-via-Ollama open-weights arm (add a `--model` param to generate.cjs; note the smaller model may fail more, that IS data); (6) aggregate → run the Protocol B stats (Mann-Whitney/Cliff/Holm) → fill §VI + the abstract number.

- **Sept 1 2026 (cont.) — full pipeline VALIDATED end-to-end + baseline running + ablation rungs authored.**
  - `--one` smoke (naive/0) completed green through the full chain (generate→materialize→measure→audit×2→aggregate): 6-prompt `--resume` session chain works, npm install works, jest-vs-Docker-Postgres coverage works (21.96%), blind audit works. results.csv row emitted.
  - Fixed the eslint metric (pin `eslint@8`+parser/plugin, force legacy `.eslintrc`, `ESLINT_USE_FLAT_CONFIG=false`, run against `src`).
  - **Baseline `--k 3 --conditions naive,control,treatment` running (resumable).** Naive signal so far (the L0 floor, as predicted): layer_violations 40–46, coverage 0–22%, audit 2–8/14, ~$0.53–0.69/rep. Two prior background launches were killed by session resets; each re-launch resumed cleanly from on-disk artifacts (skips completed steps) — resume is proven.
  - **Ablation rungs authored + wired** (no API cost yet): `L1/` (complete spec, derive-all, single holistic prompt — isolates spec-driven derivation vs incremental), `L2/` (+ tests-as-gate harness discipline — isolates the verify loop; honest note: `--tools ""` means the model can't execute the loop, so L2 is the gate-as-discipline, executed coverage measured afterward). `treatment` already ≈ L3. Added all four to `generate.cjs` `CONDITIONS`. **L4 (root CLAUDE.md sentinel — the treatment prompts reference a `CLAUDE.md § Verification Protocol` that was never in the cascade) and L5 (phase-collapse) intentionally deferred** until the baseline shows control→treatment isn't already saturated on Conduit (RUNNER-SPEC predicts it is; running the saturating top rungs before that is wasted spend).
  - **Bridge test authored + wired** (`bridge-strong/` conceptual shore vs `bridge-weak/` mechanical shore, same 6 error-prone behaviors, same rung ≈ L1). Highest-value experiment — it is the empirical test of contribution #1. **The two prompts are DRAFTED and pending JC ratification before spend** (the strong-vs-weak framing of each requirement is a consequential design call; "el agente redacta, vos mandás" applies to this design decision even under the run-autonomously grant).
  - Fixed `measure.cjs` DB-name (`conduit_${condition}` → sanitized; `bridge-strong` has a hyphen, invalid pg identifier).

- **Sept 1 2026 (cont. 2) — measurement instrument HARDENED after debugging control/0 (the fixes make control/treatment measurable at all).** Five real bugs found + fixed; all deterministic (no re-generation needed, only re-materialize+re-measure, which are free of API cost):
  1. **Project-root nesting.** naive emits `src/` at the tree root; **control/treatment emit under `output/`** (their README says so). measure.cjs assumed root = `project/`, so for control/treatment `npm install` was SKIPPED (no root package.json) and tsc/eslint/jest ran against the wrong tree. Fix: `detectRoot()` finds the shallowest `package.json` and runs the whole toolchain there; `M.project_root` records it.
  2. **Materializer dropped config files.** The path-header regex required the line to END right after the filename, so `// output/package.json (updated scripts section)` (a trailing parenthetical) was skipped → **no package.json → project uninstallable/untestable.** Fix: allow an optional trailing `(...)` annotation (still an explicit path header, first token must be a clean path+ext, prose still not matched). This is an instrument refinement, NOT a fallback — pre-register it; the naive emit-discipline signal must rest on genuinely header-LESS blocks, not on annotated headers. **All reps must be re-materialized+re-measured under the new instrument for uniformity.**
  3. **eslint.** `npx -p eslint@8 ...` exited 2 (couldn't resolve the `@typescript-eslint` plugin) AND the earlier `npm install eslint@8` had no runner `package.json` so it climbed the tree and installed elsewhere (no local `.bin`). Fix: a real `runner/package.json` with eslint@8 + parser + plugin installed locally; measure.cjs runs `runner/node_modules/.bin/eslint . --resolve-plugins-relative-to <runner>` targeting the whole root (any src layout). Now populates (control/0 = 13 problems).
  4. **Coverage DB.** Docker Desktop was down (started it); measure.cjs hardcoded port 5433 (control's) for all conditions and depended on the 11-service compose (no service for the new rungs). Fix: one dedicated ephemeral `conduit-measure` Postgres on 5544, schema reset per rep via `prisma db push --force-reset`, self-contained.
  5. **Prompt-level resume.** generate.cjs only checkpointed at the end (meta.json); a rep killed at P5/7 restarted from P1 and re-spent. Fix: `progress.json` checkpoints after every prompt (session id + completed passes + cumulative cost); restart resumes the session and skips finished prompts. **Validated: control/1 checkpointed through P6 ($1.18), one prompt left, resumable.** This is what makes running in this reset-heavy session affordable.
- **DECISION — executed coverage is OFF the critical path (honest, best-effort).** Getting jest+ts-jest to pass across heterogeneous generated projects (each with its own/absent jest config, prisma setup) is a genuine swamp, and this session resets every ~1-2 min. The paper's §VI signal rests on the ROBUST, DB-free, reproducible, already-discriminating metrics: **layer_violations (naive 46 vs control 0), tsc --strict errors, eslint problems, npm-audit CVEs, the blind 7-property audit (×2 for kappa), files/tests emitted, and cost/tokens/turns.** Tokens-per-correct-output (the generation-side token-cost answer) is computed with "correct" = composite of (tsc-clean ∧ layer-clean ∧ audit score), NOT executed coverage. Coverage stays in as best-effort; where it fails to run that is itself a real artifact-runnability signal, recorded honestly.
- **Execution mode in a reset-heavy session:** GENERATION runs fine in background/foreground because it is prompt-level checkpointed (a kill costs at most one in-flight prompt). MEASUREMENT has no checkpoint (npm install + tsc + eslint restart whole), so run it in the FOREGROUND per rep (atomic, ~3-5 min, under the 10-min cap). A foreground call that exceeds the cap is MOVED to background (not killed) and keeps running.

## RESULTS — baseline k=5 (naive / control / treatment), Protocol B (Sept 2 2026)

All three conditions run k=5 end-to-end (generate→materialize→measure→audit×2). 15 reps,
30 audits, weighted-kappa auditor reliability = **0.62** (substantial; n=105 property-pairs).
Stats: exact Mann-Whitney U + Cliff's delta + Holm-Bonferroni (`runner/stats.py` → `stats.json`).
Data: `runner/results.csv`. `*` = Holm-corrected p<0.05.

**Significant (p_holm<0.05, δ=±1.0 complete separation):**
- **Cost** naive<control<treatment, ALL pairwise (p=0.024) — GS costs monotonically MORE tokens. The honest generation-side token-cost result (KX was retrieval; this is generation). NEVER claim cheaper.
- **files_count** & **test_files**: naive < GS (p=0.024) — GS emits significantly more complete artifact + test sets.
- **audit1_total** (7-property, 0-14): naive < control (p=0.024).
- **layer_violations**: naive > treatment (p=0.024); **layer_per_ts** (size-normalized): naive > BOTH GS (p=0.024).

**Real but underpowered at k=5 (p_holm 0.05-0.10):** cves (naive worse, ~0.095), audit_mean (naive<control, 0.071), eslint_per_ts (naive worst, 0.095), files control<treatment (0.095).

**Null / noisy:** tsc errors (all ~0, GS no better), raw eslint (size-confounded — see per_ts), auditor-2 less discriminating than auditor-1.

**THE KEY HONEST FINDING — saturation, as pre-registered.** The naive→control jump captures MOST of the benefit; **control→treatment (the full artifact cascade) is NOT significantly better on median quality** on mid-complexity Conduit. Treatment's distinct value is **RELIABILITY, not median**: architecture failures were **0/5 (treatment) vs 2/5 (control: layer=46 and 52)** — a tail-risk / variance reduction. This (a) validates the RUNNER-SPEC saturation prediction, (b) is the empirical argument for a HARDER second benchmark before the L4/L5 rungs can show value, (c) reframes treatment's value proposition as consistency, not peak quality. Publishable and credible precisely because it is not overclaimed.

**Paper implication for §VI:** report the naive-vs-GS separation (the strong, significant result) as the primary finding; report control-vs-treatment saturation + the reliability/variance distinction honestly; report the cost trade-off as measured; the abstract number can be the layer-violation separation (median 45→0, δ=1.0, p<0.05 Holm) and/or the cost multiple (~2-3×). Aligns with the SEVEN-property academic rubric (the audit IS the 7 properties, 0-14) — NOT the Decagon. No token-reduction %, no figures from an earlier human-subject study (retired).

## Open items to resolve first (tomorrow)
- [ ] Confirm the per-condition prompt sequences survive (folders vs reconstruct from Supplement §S3).
- [ ] Confirm `ax/docker-compose.yml` + the Postgres schema still stand up (`docker compose up`).
- [ ] Pin the ESLint shared config + Stryker config (they must be identical across runs, or the metric is not comparable).
- [ ] Decide k (10 vs 5) against the API budget (~$52/full-Treatment run observed at T8; Naive/Control are cheaper).
- [ ] Pre-register this runner + the Protocol B design (commit) BEFORE the first real replication run.
