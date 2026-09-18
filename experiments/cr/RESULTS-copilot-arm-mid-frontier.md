# CR — Results: Copilot arm (mid → frontier rungs)

> Partial results for the **mid and frontier rungs** measured on the Copilot PC.
> The two weak local rungs (`qwen25coder7b`, `qwen25coder32b`) are generated + measured
> separately via Ollama on the main PC and must be **joined before the full H1 trend test**
> (Jonckheere-Terpstra / Page, PREREGISTRATION §7). This file reports only what this arm
> can conclude on its own.

## What was measured

- **Rungs (a priori ladder order, PREREGISTRATION §4 + `ladder.json`):**
  `gpt-mid` (rank 2, mid) → `{gpt-frontier, gemini-frontier, claude-frontier}` (rank 3,
  frontier — extra frontier points per `ladder.json.note_min_rungs`).
- **Conditions:** naive vs gs. **k = 3** reps per cell. **24 cells total**, all served (24/24).
- **Instruments (run directly with Windows node, not `measure_cr.sh`):**
  `static_cr.cjs` (clean static signal) + `conformance_cr.cjs` (behavioral oracle: 6 Hurl
  probe groups vs a per-cell-reset Postgres).
- **Statistic of record:** per-cell **median [IQR]** over k=3 (PREREGISTRATION §7), robust to
  single-rep outliers.

## Per-cell medians [IQR]

`Δ GS-benefit` is oriented so **positive = GS better**: for higher-is-better metrics
(oracle, rules, tests) Δ = median(gs) − median(naive); for lower-is-better metrics
(dup, cc, dead, layer) Δ = median(naive) − median(gs).

| metric | rung | naive [IQR] | gs [IQR] | Δ GS-benefit |
|---|---|---|---|---|
| oracle/6 | gpt-mid | 6.0 [6.0,6.0] | 5.0 [2.5,5.5] | −1.0 |
| oracle/6 | gpt-frontier | 5.0 [5.0,5.5] | 4.0 [2.0,4.5] | −1.0 |
| oracle/6 | gemini-frontier | 6.0 [6.0,6.0] | 5.0 [5.0,5.0] | −1.0 |
| oracle/6 | claude-frontier | 6.0 [6.0,6.0] | 6.0 [5.5,6.0] | +0.0 |
| rules/3 | gpt-mid | 3.0 [3.0,3.0] | 3.0 [1.5,3.0] | +0.0 |
| rules/3 | gpt-frontier | 3.0 [3.0,3.0] | 3.0 [1.5,3.0] | +0.0 |
| rules/3 | gemini-frontier | 3.0 [3.0,3.0] | 3.0 [3.0,3.0] | +0.0 |
| rules/3 | claude-frontier | 3.0 [3.0,3.0] | 3.0 [3.0,3.0] | +0.0 |
| dup% | gpt-mid | 0.0 [0.0,1.6] | 0.0 [0.0,0.0] | +0.0 |
| dup% | gpt-frontier | 0.0 [0.0,0.3] | 1.2 [0.6,1.4] | −1.2 |
| dup% | gemini-frontier | 2.9 [1.5,3.3] | 6.5 [3.5,7.1] | −3.5 |
| dup% | claude-frontier | 0.0 [0.0,0.1] | 0.0 [0.0,0.2] | +0.0 |
| cc.mean | gpt-mid | 1.9 [1.7,1.9] | 1.7 [1.6,1.7] | +0.2 |
| cc.mean | gpt-frontier | 1.7 [1.6,1.8] | 1.6 [1.5,1.6] | +0.1 |
| cc.mean | gemini-frontier | 2.1 [2.1,2.2] | 2.0 [2.0,2.1] | +0.1 |
| cc.mean | claude-frontier | 1.6 [1.6,1.8] | 1.5 [1.5,1.5] | +0.2 |
| dead (raw) | gpt-mid | 0.0 | 2.0 | −2.0 |
| dead (raw) | gpt-frontier | 0.0 | 0.0 | +0.0 |
| dead (raw) | gemini-frontier | 1.0 | 23.0 | −22.0 |
| dead (raw) | claude-frontier | 1.0 | 3.0 | −2.0 |
| **dead_real** (barrel-aware) | gpt-mid | 0.0 | 2.0 | −2.0 |
| **dead_real** (barrel-aware) | gpt-frontier | 0.0 | 0.0 | +0.0 |
| **dead_real** (barrel-aware) | gemini-frontier | 0.0 | 0.0 | +0.0 |
| **dead_real** (barrel-aware) | claude-frontier | 1.0 | 0.0 | +1.0 |
| layer | (all rungs) | 0.0 | 0.0 | +0.0 |
| tests | gpt-mid | 1.0 [0.5,1.0] | 1.0 [1.0,1.5] | +0.0 |
| tests | gpt-frontier | 2.0 [2.0,2.5] | 5.0 [4.5,5.0] | +3.0 |
| tests | gemini-frontier | 4.0 [4.0,5.5] | 6.0 [6.0,8.0] | +2.0 |
| tests | claude-frontier | 6.0 [4.5,6.0] | 8.0 [7.5,9.5] | +2.0 |

## Δ trend over the measured range (mid rank 2 → frontier rank 3)

| metric | Δ mid | Δ frontier (mean of 3) | direction |
|---|---|---|---|
| oracle/6 | −1.00 | −0.67 | GS-deficit shrinks toward frontier |
| rules/3 | 0.00 | 0.00 | flat (tie) |
| dup% | 0.00 | −1.59 | GS worse toward frontier |
| cc.mean | +0.15 | +0.13 | flat (GS marginally better) |
| dead (raw) | −2.00 | −8.00 | artifact — barrel re-exports (see correction) |
| dead_real | −2.00 | +0.33 | flat (GS ≈ naive real dead ≈ 0) |
| layer | 0.00 | 0.00 | flat (both layer cleanly; heuristic scope-limited) |
| tests | 0.00 | +2.33 | GS emits more tests toward frontier |

## Honest read (measured range only)

1. **Behavioral conformance (the load-bearing metric): naive ≥ GS at every measured rung.**
   GS ties naive only at the frontier (claude). The GS *deficit* on the oracle is roughly
   constant (−1.0) across mid + two frontier vendors and closes to 0 at the top.
2. **Business-rule sub-score is a tie (3.0 = 3.0) at every rung** under the median statistic.
   (An earlier *mean*-based read showed naive > GS on rules; that was driven entirely by the
   two `oracle-0` outlier cells below and vanishes under the pre-registered median.)
3. **GS emits more tests and marginally lower complexity.** The raw `dead`-export metric shows
   GS far higher (gemini gs median 23 vs naive 1), **but this is a metric artifact — see the
   correction below.** After excluding `index.ts` barrel re-exports (`dead_real`), GS's real
   dead code is **≈ 0 at every rung** (gpt-mid 2, elsewhere 0), on par with naive. GS's genuine
   cost here is **more duplication at the frontier** (per-entity boilerplate, not logic clones).
4. **Layer-boundary violations = 0 everywhere** — both conditions route DB access through a
   repo/service; no route/controller calls the data client directly at mid+frontier. See the
   validity caveat below: the heuristic only scans route-named files, so it will false-negative
   on weak-rung naive monoliths (inline data calls in `app.ts`) — widen it before measuring qwen.

## Dead-code correction: the raw metric penalizes GS's public API surface

The pre-registered `dead` metric is a raw `ts-prune` count. ts-prune flags any export not
imported **through its own path** — which includes every `index.ts` barrel / public-API
re-export, because consumers import the symbol from its **source** file, not the barrel. GS's
own standards mandate exactly this surface: an `index.ts` public API per module, port
interfaces (`IUserRepository`), swappable adapters (`InMemoryUserRepository`), a custom
exception hierarchy, and named constants. Each becomes a re-export ts-prune misreports as dead.

Verified on the worst cell (`gemini gs/2`): all **51** raw "dead" exports are `index.ts`
re-exports of **live** symbols (`ValidationError` 31 refs, `AuthService` 12, `IUserRepository`
5, even `InMemoryUserRepository` 4). Barrel-excluded count = **0**. Naive scores ~0 on the raw
metric only because it builds no barrels/ports — it imports concretely file-to-file. `dead_real`
(barrel-aware, added to `static_cr.cjs`, applied identically to both conditions) is the fair
count; the "GS 23 vs naive 1" gap collapses to "GS 0 vs naive 0".

## The load-bearing caveat: H1 cannot be concluded from this arm

H1 (Δ monotonically declines weak→strong, largest at the weak rung) is anchored on the
**weak qwen rungs, which are NOT in this dataset** (Ollama / main PC). Within the measured
mid→frontier segment there are only two distinct a-priori ranks, so no monotone-trend
statistic is run here. **Join the qwen cells, then run Jonckheere-Terpstra / Page per §7.**
What this arm establishes: at mid + frontier, the GS conformance benefit is **≤ 0** (naive
matches or beats GS), consistent with the "frontier absorbs the mechanical delta" master
line but not by itself sufficient to confirm or reject the monotone law.

## What still needs analysis (open items, ranked)

1. **Layer metric — validity fix APPLIED this session (no results change).** `layer=0/0` is
   *real* at mid+frontier (verified: data-client calls live in repository/service files, none in
   route handlers, both conditions). The heuristic previously scanned only `routes/…|route.ts|
   controller` files, so a weak-rung naive **monolith** inlining `prisma.paddock` in `app.ts`
   would score 0 falsely. Fixed: `static_cr.cjs` now also scans entrypoint files
   (`app|server|index|main.ts`, excluding data-layer dirs) with an **entity-only** pattern
   (`LAYER_ENTITY_RE`, no raw `query|execute|…` verbs) so it catches monolith domain access
   without false-positiving on startup boilerplate like `pool.query('SELECT 1')` health checks.
   Re-checked across all 24 cells: **0 change at mid+frontier** — the fix only arms the metric
   for the qwen monoliths, exactly where GS is predicted to win.
2. **Duplication is real but benign for GS.** GS's higher dup (gemini 6.5% vs 2.9%) is
   **per-entity boilerplate symmetry** — repeated CRUD/mapper blocks *within* each repository and
   parallel validate→delegate→respond skeletons *across* route files (`herd.routes` ↔
   `paddock.routes`). Not duplicated business logic. It is the DRY-vs-explicit-layering trade GS
   makes (one module per entity). Worth reporting as a genuine (mild) GS cost, not an artifact.
3. **The two oracle-0 GS cells — RESOLVED this session** (see the dedicated section below). Live
   re-serve of `gpt-frontier gs/1` proved register works (201); the real cause is a **422 on
   `/readings`** from over-strict `readingDate` datetime validation (spec §3.4 says `date`). A
   genuine GS conformance miss, not a harness artifact. Median already handles it as an outlier.
4. **Test metric = presence only.** `test` counts test *files*; it does not run them or measure
   assertions/mutation (MSI). GS's higher test count is not evidence the tests pass or assert —
   that needs the tests executed + Stryker, not done here. Treat "more tests" as scaffolding
   volume, not verified quality.
5. **cc / dup / tests still use the mean in the earlier console summary** — the record of truth
   is the **median [IQR]** table above (robust to the two outlier cells). Prefer it.

## Two genuine oracle-0 cells — root cause verified by live re-serve

`gpt-mid gs/2` and `gpt-frontier gs/1` served, migrated (prisma), and **register works**
(`POST /register` → `201 {token}`, confirmed by a live re-serve of `gpt-frontier gs/1`:
fresh `npm install`, clean schema reset, `prisma generate` + `migrate deploy`, then curl).
So the earlier "runtime 500 on register" guess was **wrong** — corrected here.

Running the six oracle probes against the live server reproduced 0/6 deterministically. The
failing step (Hurl `--error-format long`) is `POST /readings` returning **`422 {"error":
{"code":"validation","message":"Invalid ISO datetime"}}`**. The probe sends the
spec-conformant `"readingDate":"2026-01-01"`, but this GS build validated `readingDate` as a
strict ISO **datetime** and rejects a date-only value. **DOMAIN_SPEC §3.4 defines `readingDate`
as a `date`**, so the app is over-strict and **genuinely non-conformant** to the data contract.
Because every rule group (capacity/budget/overlap) needs a reading first, the 422 cascades to
all six groups → oracle 0.

This is a **real GS conformance miss** (a data-contract type error), not measurement noise, and
it is a *GS-flavored* failure: the "strict validation / fail-fast" discipline pushed the model
to `z.datetime()`, which then rejects a valid `date`. The naive gpt-frontier build accepts the
date-only value and passes. The median statistic already treats these as the minority outliers
they are (the cell's other reps pass), so no numbers change — but the cause is now documented,
not guessed. Not "fixed" (editing generated cells would corrupt the sample).

## Instrument fixes applied this session (portability / hygiene — no DV bias)

The runner was authored for Git-Bash/Linux and would not run on Windows. All fixes below
apply **identically to naive and gs across all rungs**, so they do not bias the naive-vs-gs
contrast. The oracle probes and the `layer` heuristic were **not** touched.

**`static_cr.cjs`** (portability + one transparent metric augmentation)
1. jscpd fed a **relative** `src` path (absolute Windows path made fast-glob treat `\` as an
   escape → 0 files scanned → null dup%).
2. eslint runs with `cwd` = the runner dir so `@typescript-eslint/parser` resolves (the
   `--resolve-plugins-relative-to` flag does not apply to the parser; projects have no
   node_modules).
3. **`dead_real` added** — a barrel-aware dead-export count (ts-prune output excluding
   `index.ts` re-exports), reported **alongside** the untouched pre-registered raw `dead`. This
   is an *addition, not a replacement*: both numbers are emitted so nothing is hidden. Applied
   identically to naive and gs. Rationale in the "Dead-code correction" section above.

**`conformance_cr.cjs`**
1. `HURL` const set to the 8.3 short path `C:\PROGRA~1\hurl\hurl.exe` (the bash path
   `/c/Program Files/Hurl/...` is invalid under cmd; spaces break under `shell:true`).
2. `resetDb()` added — drops/recreates the `public` schema **per cell via stdin** (the old
   `-c "..."` form splits under `shell:true`, so the reset never ran → cross-cell table
   contamination). Makes results order-independent.
3. `migrate()` rewritten: prisma-first with fall-through; broadened npm migration-script
   detection; recursive `.sql` discovery + apply (stdin, `ON_ERROR_STOP`).
4. `prismaCli()` added — pins `npx prisma@<installed client version>` so cells that omit the
   `prisma` devDep don't fetch the broken `prisma@8.0.0-rc.15` "latest".
5. `runCell()` tolerates self-migrating apps (some embed `CREATE TABLE` and migrate on boot);
   records `migration:"self-or-none"` and serves anyway — the oracle decides.
6. `tsx` installed globally so `serve()`'s `npx tsx` resolves instantly (projects declare
   ts-node, not tsx; without global tsx, npx hangs on an interactive install prompt).

Raw per-cell outputs (`static_cr.json`, `conformance_cr.json`) are gitignored by design
(per-machine artifacts). The curated numbers above and `cr_analysis_mid_frontier.json` are
the committed record.
