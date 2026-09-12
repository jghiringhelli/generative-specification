# SX — the Chaos Twin Study (surface/bounding lever)

> Companion to TX (§7.8.J). TX held content constant (a monolithic vs a layered twin of the same code) and
> found that *reorganization alone* did not lower a stateless reader's read cost. SX isolates the lever TX did
> NOT exercise: **bounding / surface**. A real chaotic project carries duplication, dead code, high-complexity
> methods, low test coverage, and documentation that drifts from the code. Ordering it via the disciplines
> *removes surface* and *makes the docs trustworthy*. SX tests whether that lowers token cost, and whether the
> saving holds on frontier models (prediction: yes, because fewer input tokens help every model — surface is
> NOT capacity-relative, unlike the coherence benefit TX measured).

## Hypotheses
- **H1 (surface lever):** the ordered/lean twin costs fewer tokens (read AND generation) than the calibrated
  chaotic twin, for a fixed task set, on BOTH a weak and a frontier model. (This is the claim TX could not test.)
- **H2 (not capacity-relative):** the token gap between chaotic and lean persists on the frontier model, not
  only the weak one, because surface reduction is a flat reduction in input, independent of model capacity.
- **H3 (coherence, capacity-relative, replicates TX):** on cross-cutting modification, the weak model drops or
  breaks functionality more on the chaotic twin than the lean one; this effect shrinks on the frontier model.
- **H4 (decomposition):** the read economy splits into a code-surface component and a sentinel component. At
  **S0 (no sentinel)** the chaotic-vs-lean gap is the surface lever alone; at **S2 (sentinel on both)** the
  residual gap is code-surface net of navigation; the sentinel's marginal value is the S1-vs-S0 shift. We
  predict a non-zero surface gap already at S0 (which TX could not have seen).
- **Null we will report honestly:** if organization-only (the real monolithic vs layered anchor) shows no
  token gap, that REPLICATES TX and is reported as such, not buried. Likewise, if the surface gap is zero at
  S0 and only appears once a sentinel is added, that VINDICATES TX's "the sentinel carries it" conclusion and
  we report it plainly.

## Design: two twin pairs, two purposes
1. **Real anchor pair (organization axis, replicates/extends TX):**
   - CLEAN: `gothinkster/node-express-realworld-example-app` (TS + Express + Prisma; controller/service/mapper).
   - MESSY(monolithic): `skopekreep/typescript-node-express-realworld-example-app` (TS + Express + Sequelize;
     302-line `articles-routes.ts` God-file, no layers).
   - Purpose: independent replication of TX on real code + a realism sanity-check for the synthetic twin below.
   - HONEST LIMIT: the messy real twin is *monolithic, not bloated* — it is roughly TX again, so it tests
     organization, not surface. That is exactly why it is the anchor, not the main test.
2. **Calibrated synthetic pair (surface/bounding axis — the main test):**
   - LEAN base: the clean gothinkster implementation (or a clean GS-generated Conduit backend).
   - CHAOTIC twin: the lean base degraded to **industry-average chaos** (calibration table below),
     behavior-preserved against the Hurl oracle. The degradation is scripted and each parameter cites a
     published norm, so the chaotic twin is *representative, not adversarially rigged* (see Threats).

## Conditions: the sentinel ablation (three levels) — resolves the TX confound
TX added an authored sentinel to BOTH twins and then concluded the read economy belonged to the sentinel, not
the structure. But it never ran the no-sentinel condition on a bloated-vs-lean pair, so it could not see the
surface lever at all. SX makes the sentinel an explicit factor. Every twin pair is run under three conditions:

- **S0 — no sentinel (both twins raw).** The stateless reader gets the code alone. Chaotic-vs-lean here
  isolates the **surface/bounding lever free of any navigation aid** — the condition TX never ran, and the
  cleanest test of H1. If lean beats chaotic on tokens at S0, the surface lever exists independent of the sentinel.
- **S1 — sentinel on one side.** Primary: the sentinel is authored for the **lean/ordered twin only** (the
  realistic GS-vs-chaos picture — the disciplined project also gets the map, the chaotic one does not); this is
  the total real-world effect. Mirror (optional): sentinel on the **chaotic twin only**, to test whether an
  authored map can *rescue* chaotic code (navigation compensating for bloat).
- **S2 — sentinel on both.** Navigation equalized. Any chaotic-vs-lean token gap that remains is the **pure
  code-surface contribution net of the sentinel** — the TX-analog condition, now with a genuinely bloated twin.

Decomposition this buys us: gap(S0) = surface lever alone; gap(S2) = surface lever with navigation held equal;
[condition S1 minus S0] = the sentinel's marginal contribution; comparing S0/S1/S2 separates **code-surface**
from **sentinel** from their **interaction**. This is the factorial TX collapsed.

## The oracle (shared, guarantees behavioral equivalence)
The RealWorld API suite, **Hurl** (the same tool used in TX): 13 files (articles, auth, comments, favorites,
feed, pagination, profiles, tags, 5 errors_*). Two copies exist: the strict current one at
`realworld-apps/realworld` `specs/api/hurl/` and our own AX copy at `experiments/ax/evidence/hurl/`.

**Finding (Sep 2026, verified by re-running our lean base D):** the oracle is a **differential equivalence**
check, not a conformance check. TX's headline "13/13" meant *13/13 files produce IDENTICAL results on both
twins* (its own words: "same 1 pass, same 12 strict-RealWorld-spec failures, 0 differ"), NOT "13/13 pass".
Our GS Conduit (and every older community RealWorld impl we cloned) deviates from the *current strict* spec on
~12 files (default image URL, 200-vs-204 on delete, null-vs-absent fields), because they target an older,
looser spec. Re-running D against the AX oracle reproduced exactly the documented result (1 pass, 12 strict
failures), confirming D as a known, reproducible lean base and confirming the oracle works.

**Design consequence — two credibility levels (pick one):**
- **(A) Differential equivalence (TX-style, fast):** oracle = "the chaotic twin produces results IDENTICAL to
  the lean base." Behavior held constant between twins; the base need not fully pass the strict spec.
- **(B) Conformance-preserving (more credible, more work):** first patch the lean base to FULLY pass the
  strict `realworld-apps` oracle (the ~12 deviations are small/cosmetic: status codes, default fields), so
  "behavior preserved" means "correctness preserved," and both twins pass the real spec. Removes the reviewer
  objection "was your base even correct?".

Recommendation: **B** for the headline (the chaotic twin is then a *correct* codebase degraded to
industry-average chaos, not an equally-nonconformant one). Both twins in a pair MUST pass identically; a task
is only counted where behavioral equivalence holds.

## Calibration table (the chaotic twin is built to these published norms)
| Dimension | Target in the chaotic twin | Anchor (source) | Confidence |
|---|---|---|---|
| Code duplication | ~10-15% of LOC cloned | Roy & Cordy, *Survey on Software Clone Detection*, TR 2007-541 (5-20% typical) | **Solid** (most replicated) |
| Cyclomatic complexity | low mean (2-4/method) + a few God-methods at CC 20-40 | McCabe 1976 (>10 = high); real corpora show low mean, heavy right tail | **Solid** (shape), tool-dependent |
| Dead / unused code | ~15-25% of methods (wide band, labeled uncertain) | Romano et al., *A Multi-Study Investigation into Dead Code*, IEEE TSE 2018 (~15% Java methods) | **Shaky** — use a range, not a point |
| Test coverage | ~30-40% line, with modules at 0 (skewed) | Kochhar/Lo APSEC'14; Hilton et al. ASE'18 (median ~40%, skewed to zero) | **Solid** (shape more than point) |
| Doc / comment drift | modeled as a MECHANISM (comments lag code; new code uncommented; refactors orphan refs), NOT a percentage | Fluri/Gall 2007; Wen et al. ICPC'19 (co-evolution; no prevalence %) | **No reliable %** exists — do not fabricate one |
| Comment density / docs amount | ~15-20% comment lines (mean 18.7%, ~1 per 5 LOC), high variance; README present but ~15-35% of modules with no meaningful doc | Arafat & Riehle, ICSE 2009 (n≈5,229); arXiv 2605.16701 (README presence) | **Solid** (density); README-% figures partly vendor/grey |
| Dependency freshness / staleness | median ~3-4 months / ~1 minor behind, long tail; ~80% of deps >1yr stale, ~10-15% known-vulnerable/years-old | Zerouali et al. JSEP 2019 + Cox et al. ICSE 2015 (libyear) [PR]; Snyk 2024 / Sonatype 2024 [vendor, corroboration only] | **Solid** (PR anchors); pair the ~80% (vendor) with the PR lag figure |
| Style / pattern inconsistency | modeled as a MECHANISM ("many hands, no enforced convention": mixed patterns — some layered, some direct-DB-in-controller; async/await mixed with promises/callbacks; dispar error handling), NOT a % | linter-density↔maintainability (ICSEIM 2023); ESLint config heterogeneity (Tomasdottir et al. TSE 2020) — phenomenon real, **no population baseline** | **Absent** — mechanism, do not invent a rate. THE key driver of failure mode #1 (pattern-search fails) |
| Naming / convention deviation | ~7-10% of identifiers off-convention (directional) | Butler et al. ICSME 2015 (Java, NOMINAL) | **Shaky** (Java-specific); formatting has no figure -> fold into the many-hands mechanism |

Honesty rule: duplication, coverage-shape, and CC-shape are the confident anchors; dead-code is a labeled-
uncertain band; doc-drift is a behavioral rule, never a fabricated number. Every degradation parameter is
recorded in `calibration.json` with its citation so the chaotic twin is auditable and reproducible.

## The two field-observed failure modes this targets (JC, Sep 2026)
From early spec-driven work (incomplete spec, no cascade/harness), two things happened a lot, and they are
what SX must capture, not as separate metrics but as they co-occur under one realistic modification:
1. **Blind localization — the read phase GUESSES where things are and searches by pattern**, wasting tokens on
   extensive search. This is the *retrieve* side, and it is **structural**: any model without an authored map
   must search a messy codebase, so it is expected to persist on frontier models (not capacity-relative). The
   chaotic twin makes it worse (dead code pollutes search, duplication hides the real copy).
2. **Forget-and-duplicate — even after finding the code, the model forgets and re-generates disconnected,
   duplicated code**, producing incoherence. This is the *construction* side, and it is **partly
   capacity-relative** (newer models forget less), but without a cascade/harness it still happens.
These map to the two levers: search = retrieve (sentinel/CKG); forget-duplicate = Bounded/coherence.

## Tasks (fixed, identical across twins and models)
**Centerpiece task (exercises BOTH failure modes at once):** a modification that lands in the duplicated
region, e.g. *"change the shape of the `article` response"* (or add a field to it). To do it the model must
(a) SEARCH to find every duplicated serializer copy (measures localization cost) and (b) update ALL copies
coherently or it forgets one and ships an inconsistent/duplicated result (measures coherence; the Hurl oracle
catches a missed copy as red). On the lean twin this is one edit in one place; on the chaotic twin it is N
copies to find and reconcile. The gap is **structural**, so it tests the frontier point too.
- **Secondary comprehension probes:** a few fixed "where/what/why" questions (localization cost without a
  modification).
- Stateless runs, k independent repetitions per **(twin x task x model x sentinel-condition S0/S1/S2)**. The
  sentinel condition is the ablation above; the same task set runs unchanged across S0/S1/S2 so the only
  thing that varies is the presence/placement of the authored navigation tree.
- Reading must be **agentic and task-scoped** (the model navigates with grep/read tools; NOT a whole-codebase
  dump), or the token difference is the trivial "more bytes to read" and proves nothing.

## Models
- **Weak:** local Ollama (e.g. llama3.1:8b / a code model if available) — the capacity-stress condition.
- **Frontier:** `claude -p` (current frontier) — the H2 test (does the surface gap persist?).

## Metrics (objective) — the two failure modes made measurable
Primary DVs (built around the two field phenomena):
- **Localization cost (search):** read tokens + read-breadth (distinct files opened) **before the first edit**
  — the "where is it" phase. Structural; expected to persist on frontier. Collapsed by the sentinel (S1/S2).
- **Coherence / duplication miss:** did the model find and update ALL N duplicate copies? Hard metric = the
  Hurl oracle (a missed copy -> inconsistency -> red) + a count of copies actually edited vs the N that exist.
  Partly capacity-relative; expected to fail more on the weak model.
- **Total cost to green:** total tokens (read + generation) and tasks-to-green per condition.
Supporting: compile status, endpoints preserved, and the measured code metrics on each twin (CC, duplication
%, dead-code %, coverage) to PROVE the calibration held (already in `calibration.json`).
Token accounting: `claude -p` usage via the token-visibility parser; Ollama via `prompt_eval_count` /
`eval_count`.

## Threats to validity (and mitigations)
- **Self-rigging (the main one):** we build the chaotic twin, so we could exaggerate the chaos. *Mitigation:*
  every degradation parameter is calibrated to a published industry norm (table above) and recorded with its
  citation; the real anchor pair (skopekreep) checks that the synthetic chaos is not cartoonish.
- **External quality judgments on the real repos are preliminary** (from file trees, not measured); confirm by
  running linters/complexity/coverage after cloning.
- **Not verified to build/run/pass the oracle yet** — first step is to clone both real repos and confirm they
  pass the current Hurl suite before anything else.
- **Single benchmark (Conduit), few models** — mechanism demonstration, not a cross-benchmark effect size
  (same honest scope statement as TX).
- **Doc-drift** has no ground-truth prevalence; its effect is reported qualitatively, not as a calibrated number.

## Predictions (stated as predictions, not results)
Lean twin costs fewer tokens than chaotic for all models (H1); the gap persists on the frontier model (H2);
the weak model additionally loses coherence on the chaotic twin (H3, the TX effect). If the real anchor shows
no organization-only gap, that replicates TX and bounds the claim to the surface lever.

## Status
Design frozen from two research passes (RealWorld candidate hunt + industry-metric calibration, Sep 2026).

**Lean base READY and conformant (Option B done, Sep 2026).** The lean base is a copy of the TX disciplined
twin D (Express + Prisma) at `experiments/sx/twins/lean`, on Postgres `sx-pg`:5546 / db `conduit_sx_lean`,
served on :3001. It was patched to **FULLY pass the strict RealWorld Hurl oracle: 13/13, 0 failures, 154
requests, independently re-verified after a clean DB reset.** Patches (code only, oracle untouched): DELETE
article/comment -> 204 (but unfavorite/unfollow stay 200-with-body, per the oracle); empty bio/image -> null;
RealWorld error format `{errors:{field:[msg]}}` with correct statuses (401/403/404/409/422) and messages
across auth/user/article/comment/profile; `updateArticle` now handles `tagList`. So "behavior preserved" now
means "correctness preserved."

**Both twins READY and verified (Sep 2026).** The calibrated chaotic twin is built at
`experiments/sx/twins/chaotic` (Postgres `conduit_sx_chaotic`, port 3002), degraded to the industry-average
targets and **independently re-verified at 13/13 oracle (behavior identical to the lean base)** after a clean
DB reset. Measured actuals (in `calibration.json`, each with target range + citation + tool):
- Duplication **13.48%** (jscpd; target 10-15%; baseline 6.39%).
- Cyclomatic complexity: 3 God-methods at **CC 37 / 31 / 20** over a low-mean tail (eslint complexity).
- Dead code **~17.6%** of functions (ts-prune; target 15-25%).
- Coverage **37.78%** line, with serializers + ArticleProcessor at 0% (jest; target ~30-40% skewed; baseline 71%).
- Doc drift injected as a mechanism (stale JSDoc, orphaned @see/@param, contradictory comments); no % fabricated.
- **Live duplication (strengthened):** the article serialization is inlined as **5 live copies** across the 7
  article-returning endpoints (a real DRY violation, abstractable), so "change every article response" must
  reconcile all 5 or the oracle breaks. Dead code is a SEPARATE axis (unchanged). jscpd 13.71%.
- **Mixed patterns/styles (mechanism):** 3 read endpoints bypass service+repo and hit Prisma directly in the
  controller while their sibling writes stay layered; mixed async/await vs .then(); inconsistent error
  handling; ~7-10% off-convention identifiers. This makes "search by pattern" fail (failure mode #1).
- **Thin docs:** comment density 15.34% (high variance; 26% of modules zero-comment); README a stub.
- **Dependency staleness (light):** 4 non-critical deps pinned ~1yr back; build + oracle green.
So the two twins are behaviorally identical (both 13/13, tsc clean) and differ only in the eight measured/
mechanism dimensions of the calibration table, each with a citation. This is a faithful mirror of the average
real project, not our arbitrary chaos. Note: the lean
base's own jest suite has 4 pre-existing test-vs-impl mismatches (409-vs-422, 204-vs-200) that are NOT
behavioral (the Hurl oracle is the behavioral truth and passes 13/13); reconcile the jest suite later, not
load-bearing.

**Next step — the measurement runs:** S0 / S1 / S2 x {weak Ollama, frontier claude -p}, fixed task set
(comprehension probes + modification tasks), tokens read + generation per task, k reps. Build/adapt from the
TX probe scripts (`experiments/ax/bridge/run_probe.cjs`, `ollama_mod.cjs`).
