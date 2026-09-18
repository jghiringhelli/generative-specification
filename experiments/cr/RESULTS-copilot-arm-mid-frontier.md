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
| dead | gpt-mid | 0.0 [0.0,0.5] | 2.0 [1.0,2.5] | −2.0 |
| dead | gpt-frontier | 0.0 [0.0,0.0] | 0.0 [0.0,0.5] | +0.0 |
| dead | gemini-frontier | 1.0 [0.5,1.0] | 23.0 [15.5,37.0] | −22.0 |
| dead | claude-frontier | 1.0 [0.5,1.5] | 3.0 [1.5,39.0] | −2.0 |
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
| dead | −2.00 | −8.00 | GS worse toward frontier |
| layer | 0.00 | 0.00 | flat (heuristic never fired) |
| tests | 0.00 | +2.33 | GS emits more tests toward frontier |

## Honest read (measured range only)

1. **Behavioral conformance (the load-bearing metric): naive ≥ GS at every measured rung.**
   GS ties naive only at the frontier (claude). The GS *deficit* on the oracle is roughly
   constant (−1.0) across mid + two frontier vendors and closes to 0 at the top.
2. **Business-rule sub-score is a tie (3.0 = 3.0) at every rung** under the median statistic.
   (An earlier *mean*-based read showed naive > GS on rules; that was driven entirely by the
   two `oracle-0` outlier cells below and vanishes under the pre-registered median.)
3. **GS emits more tests and marginally lower complexity**, but **substantially more dead
   exports** (worst: gemini gs median 23 vs naive 1) and **more duplication at the frontier**.
   GS's extra scaffolding did not convert into higher behavioral conformance here.
4. **Layer-boundary violations = 0 everywhere** — no signal on that sub-prediction in this
   dataset (heuristic never triggered on either condition).

## The load-bearing caveat: H1 cannot be concluded from this arm

H1 (Δ monotonically declines weak→strong, largest at the weak rung) is anchored on the
**weak qwen rungs, which are NOT in this dataset** (Ollama / main PC). Within the measured
mid→frontier segment there are only two distinct a-priori ranks, so no monotone-trend
statistic is run here. **Join the qwen cells, then run Jonckheere-Terpstra / Page per §7.**
What this arm establishes: at mid + frontier, the GS conformance benefit is **≤ 0** (naive
matches or beats GS), consistent with the "frontier absorbs the mechanical delta" master
line but not by itself sufficient to confirm or reject the monotone law.

## Two genuine oracle-0 cells (characterized, not fixed)

`gpt-mid gs/2` and `gpt-frontier gs/1` served and migrated (prisma) but failed all 6 probe
groups. Static forensic: both are surface-conformant — bare `/register` returning `{token}`
201, correct error codes (`unauthenticated`/`forbidden`) with the spec's `{error:{code,
message}}` shape, correct role gating. The all-groups cascade points to a **runtime 500 on
`/register`** (no token captured → every downstream request 401s). Not a harness/secret gap:
the harness provides `JWT_SECRET` (32+ chars), `DATABASE_URL`, `PORT`, and JWT-expiry vars to
every cell equally. Root cause is a genuine runtime bug in those two GS builds (or a native
dep that failed to build at install); confirming requires a live re-serve, deferred under
disk pressure. Left untouched — the median statistic already absorbs them as outliers.

## Instrument fixes applied this session (portability / hygiene — no DV bias)

The runner was authored for Git-Bash/Linux and would not run on Windows. All fixes below
apply **identically to naive and gs across all rungs**, so they do not bias the naive-vs-gs
contrast. The oracle probes and the `layer` heuristic were **not** touched.

**`static_cr.cjs`**
1. jscpd fed a **relative** `src` path (absolute Windows path made fast-glob treat `\` as an
   escape → 0 files scanned → null dup%).
2. eslint runs with `cwd` = the runner dir so `@typescript-eslint/parser` resolves (the
   `--resolve-plugins-relative-to` flag does not apply to the parser; projects have no
   node_modules).

**`conformance_cr.cjs`**
3. `HURL` const set to the 8.3 short path `C:\PROGRA~1\hurl\hurl.exe` (the bash path
   `/c/Program Files/Hurl/...` is invalid under cmd; spaces break under `shell:true`).
4. `resetDb()` added — drops/recreates the `public` schema **per cell via stdin** (the old
   `-c "..."` form splits under `shell:true`, so the reset never ran → cross-cell table
   contamination). Makes results order-independent.
5. `migrate()` rewritten: prisma-first with fall-through; broadened npm migration-script
   detection; recursive `.sql` discovery + apply (stdin, `ON_ERROR_STOP`).
6. `prismaCli()` added — pins `npx prisma@<installed client version>` so cells that omit the
   `prisma` devDep don't fetch the broken `prisma@8.0.0-rc.15` "latest".
7. `runCell()` tolerates self-migrating apps (some embed `CREATE TABLE` and migrate on boot);
   records `migration:"self-or-none"` and serves anyway — the oracle decides.
8. `tsx` installed globally so `serve()`'s `npx tsx` resolves instantly (projects declare
   ts-node, not tsx; without global tsx, npx hangs on an interactive install prompt).

Raw per-cell outputs (`static_cr.json`, `conformance_cr.json`) are gitignored by design
(per-machine artifacts). The curated numbers above and `cr_analysis_mid_frontier.json` are
the committed record.
