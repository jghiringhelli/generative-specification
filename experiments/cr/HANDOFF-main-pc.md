# CR study — handoff to the main PC (weak rungs + final trend test)

> Written from the Copilot PC after measuring the **mid + frontier** rungs. This doc tells the
> main-PC operator exactly what remains to complete the CR (capacity-relative) study and produce
> the pre-registered result. Read alongside `PREREGISTRATION.md` (the design is authoritative)
> and `RESULTS-copilot-arm-mid-frontier.md` (what this arm found).

## 1. Current state

- **Done (Copilot PC):** all 4 hosted rungs — `gpt-mid`, `gpt-frontier`, `gemini-frontier`,
  `claude-frontier` — generated (naive + gs, k=3) and **measured** (static + oracle). Results in
  `RESULTS-copilot-arm-mid-frontier.md` + `cr_analysis_mid_frontier.json`. Headline: on the
  behavioral oracle, **naive ≥ GS at every measured rung** (GS ties only at the claude frontier).
- **Not done (this doc):** the two **weak local rungs** — `qwen25coder7b` (rung 0) and
  `qwen25coder32b` (rung 1) — via Ollama. Per `ladder.json` these are the a-priori weakest and
  are **where H1 predicts GS's advantage is largest**. Without them the monotone-trend test in
  PREREGISTRATION §7 cannot run. **This is the load-bearing remaining work.**

## 2. What to generate on the main PC

For each `slug ∈ {qwen25coder7b, qwen25coder32b}`, each `cond ∈ {naive, gs}`, each `rep ∈ 0..2`
(k=3): follow `runner/COPILOT_GENERATION_PROMPT.md` verbatim. The non-negotiable rules:

- **Fresh session per generation.** No memory across reps/conditions/models.
- **The generator NEVER sees `benchmark/oracle/`.** It is the grader; showing it = teaching to
  the test and invalidates the cell.
- **naive** = `benchmark/DOMAIN_SPEC.md` + `benchmark/naive/README.md` + the naive prompts.
- **gs** = the `benchmark/gs/` cascade (**`CLAUDE.md` first**), then the gs prompts. **Do NOT**
  give the gs arm the raw `DOMAIN_SPEC.md` — the cascade *is* its spec (that is the experiment).
- Stage each build at `runner/runs/<slug>__<cond>/<rep>/project/` (this dir is gitignored).
- **Canary first, per model (cold recall):** run `runner/canary_probe.md` against each qwen
  model from its name alone; near-zero recall confirms non-contamination. Log it
  (`canary_results.json` already holds the hosted-model canary).
- Ollama ran out of VRAM twice in AX2 (PREREGISTRATION §8): run the weak rung **serially**, one
  generation at a time, kill node zombies between runs. If 32B won't fit, **drop rung 1** — the
  3-rung minimum (qwen7b → gpt-mid → frontier) still spans weak→mid→strong.

## 3. How to measure (same instrument, now cross-platform)

Run the two instruments directly with node (they are the designed entry points; `measure_cr.sh`
is optional and only wraps them):

```
cd experiments/cr/runner
node static_cr.cjs         # → static_cr.json  (append-only; delete the file to re-measure fresh)
node conformance_cr.cjs    # → conformance_cr.json
```

Both auto-discover cells under `runs/`, so once the qwen cells are staged they are picked up
automatically. Both JSON outputs are **gitignored** (per-machine); commit only curated results.

**Portability notes (the instrument was hardened on the Copilot/Windows PC):**
- **Hurl path:** `conformance_cr.cjs` uses `hurl` from PATH on non-Windows; on Windows it defaults
  to the 8.3 short path. Override anywhere with `CR_HURL=/path/to/hurl`.
- **DB:** `ensureDb()` auto-manages a docker `pastura-measure` postgres:16-alpine on port 5545;
  the app is served on PORT 4147. Needs docker + a Node with `npx`. `tsx` should be globally
  available (`npm i -g tsx`) — some cells declare ts-node, and `serve()` uses `npx tsx`.
- **Disk:** each cell's `npm install` is ~300–400 MB. Clean `node_modules` under `runs/` between
  rungs if space is tight (`find runs -name node_modules -type d -prune -exec rm -rf {} +`).
- **Prisma:** cells that omit the `prisma` devDep are pinned to the installed `@prisma/client`
  version to dodge the broken `prisma@8.0.0-rc.15` "latest" (`prismaCli()`); the DB schema is
  reset per cell (`resetDb()`) so results are order-independent.

## 4. Read these instrument caveats before trusting a metric (found this session)

1. **`dead` (raw ts-prune) over-counts GS ~10×** — it flags `index.ts` barrel / public-API
   re-exports as dead because consumers import from source, not the barrel. Use the new
   **`dead_real`** column (barrel-excluded) for the GS-vs-naive contrast. On the hosted arm the
   raw "GS 23 vs naive 1" collapsed to real "GS 0 vs naive 0". Expect the same on qwen.
2. **`layer` heuristic was widened** to also scan entrypoint files (`app|server|index|main.ts`)
   with an entity-only pattern, so it can finally catch **weak-rung naive monoliths** that access
   domain data straight from the entrypoint (the previous route-file-only filter scored them 0).
   This matters most for qwen — the whole point of the layer sub-prediction. Startup boilerplate
   like `pool.query('SELECT 1')` is deliberately not counted.
3. **`dup`**: GS's higher duplication is per-entity boilerplate symmetry (parallel repos/routes),
   not logic clones — a genuine but mild GS cost, not an artifact.
4. **`test`** counts test *files* only — not executed, not asserted, no mutation score. "More
   tests" ≠ verified quality.
5. **Oracle strictness:** at least one GS cell failed the oracle by validating `readingDate` as a
   strict ISO *datetime* and rejecting the spec-conformant date-only value (`DOMAIN_SPEC §3.4`
   says `date`). Real conformance misses look like this — a `422` cascading across rule groups.
   Use the **median [IQR]**, not the mean, so single strict-validation cells don't dominate.

## 5. The final analysis (PREREGISTRATION §7 — do this once qwen is measured)

1. Re-run both instruments so `static_cr.json` + `conformance_cr.json` contain **all** rungs
   (qwen + the hosted four). Or merge with the hosted `cr_analysis_mid_frontier.json` deltas.
2. Per (model × condition) cell: **median [IQR]** of each metric over k.
3. **Δ(m) per metric**, oriented as GS-benefit, across the a-priori ladder
   `qwen7b → qwen32b → gpt-mid → {frontier trio}`.
4. **Test H1:** monotone-trend statistic (**Jonckheere-Terpstra** or **Page's** trend test) on Δ
   across the ordered ladder; report the trend statistic + effect size, not a high-powered p
   (small k → coarse p; report **direction + size**, per §7). H1 = Δ declines weak→strong and
   Δ(frontier) ≪ Δ(weak).
5. **The money figure:** the Δ-vs-capability curve, one line per metric, left→right.
6. Report nulls in the same voice as positives (§7). Do **not** re-order the ladder post hoc (§8);
   the order in `ladder.json` is fixed.

## 6. What the hosted arm already tells you (so you know what to expect)

At mid + frontier the GS oracle benefit is **≤ 0** (naive matches or beats GS) — consistent with
the master line "the frontier absorbs the mechanical delta." **If H1 holds, the qwen rungs should
show GS's oracle/conformance advantage turning positive and largest at qwen7b, with Δ declining
toward the frontier.** If instead Δ is flat/≤0 even at qwen7b, H1 is rejected and the mechanical
benefit does not recede — either outcome is a real result (§10). The trust-axis value of GS is
deliberately **not** measured by this experiment.
