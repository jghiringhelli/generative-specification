# AX2 — results (cross-vendor, Sep 2026)

> What we wanted, what we saw, and the one clean thing we can extend. Honest by construction:
> we report the metric that is fair across independently-generated apps and name the two that are not.

## What AX2 set out to answer
- **RQ1** — does GS produce higher **objective** quality than naive / expert prompting?
- **RQ2** — does the effect **hold across vendors** (not a single-model artifact)? *(the flagship question)*
- **RQ3** — does the gap **widen as capability falls**? *(the novel claim, weak-local tier)*

## What was generated
- **Cross-vendor matrix, n=5 per cell:** GPT (OpenAI), Gemini (gemini-3.8-flash), Claude (opus-4.8),
  all via GitHub Copilot agent mode, × three conditions: **C1-naive**, **C2-expert** (control),
  **C3-gs** (treatment). 45 RealWorld/Conduit backends (TypeScript + Express + Prisma).
- Weak-local tier (Ollama 8B/3B) for RQ3: **incomplete** (memory-limited); no RQ3 number.
- **Harness confound:** every vendor ran inside Copilot's agent harness, so this is "vendor + Copilot",
  not raw-model. Holding the harness constant across vendors is a strength for RQ2; it is a named limit.

## The clean result — convention-independent structural metrics (RQ2)
These are statically computed and do **not** depend on runtime behaviour, REST status conventions, or
per-project test infrastructure, so they are **fair to compare across independently-generated apps**.
Mean over 5 reps.

| vendor | cond | dup % | cc mean | cc>10 | layer viol. | test files |
|---|---|---|---|---|---|---|
| claude | naive | 7.9 | 2.4 | 0.2 | **33.0** | 1.0 |
| claude | control | 1.0 | 1.5 | 0.2 | 0.0 | 9.0 |
| claude | treatment | 0.4 | 1.5 | 0.2 | 0.0 | 12.8 |
| gemini | naive | 17.1 | 4.3 | 2.6 | **35.4** | 4.2 |
| gemini | control | 2.6 | 2.0 | 1.0 | 0.0 | 11.8 |
| gemini | treatment | 6.3 | 2.2 | 1.4 | 0.0 | 11.0 |
| gpt | naive | 5.2 | 2.4 | 0.4 | **18.8** | 1.4 |
| gpt | control | 1.6 | 1.5 | 0.0 | 0.0 | 11.4 |
| gpt | treatment | 0.8 | 1.4 | 0.0 | 0.0 | 6.8 |

**The finding (naive → disciplined, consistent across all three vendors):**
- **Architectural layer violations eliminated:** 18–35 per project → **0**. The strongest, cleanest signal.
- **Duplication down** ~2–4× (e.g. gemini 17.1% → 2.6%).
- **Cyclomatic complexity down** (gemini mean 4.3 → 2.0; claude/gpt 2.4 → 1.5).
- **Tests multiply:** 1–4 test files → 7–13.

This answers **RQ2 on the structural axis**: the discipline's effect on code structure is **cross-vendor,
not a single-model artifact.**

## The honest nuances (do not overclaim)
- **The gap is naive → disciplined, not GS > expert.** C2-expert (control) and C3-gs (treatment) are
  mostly **saturated** (both near-zero on layer, low on dup/cc); on some cells control edges treatment
  (gemini dup: control 2.6 vs treatment 6.3). So the defensible claim is *"a disciplined specification
  beats naive prompting, on every vendor"* — not *"GS beats an expert prompt."* (Consistent with AX's
  saturation finding on mid-complexity Conduit.)
- **Dead code** was flat/noisy (0.4–2.4, no direction) — treatment can have *more* dead exports because it
  writes more code. Not a signal.

## What did NOT yield a clean number (and why — the real lesson)
- **Coverage:** noisy and confounded. Naive has too few tests to compare (% is NaN or meaningless);
  per-rep variance was huge (some reps 1–6%, others 95%, from test-infra failures); vendor-dependent
  (gpt writes few tests even disciplined). Reported, not headlined.
- **Behavioural conformance (strict Hurl oracle): 0/13 for functional apps.** The oracle encodes exact
  REST conventions (201 vs 200 register, 204 vs 200 delete, clearing a field to null). The generated
  apps are **functional RealWorld backends** (register, auth, articles, tags all respond correctly) that
  simply chose different conventions. So the oracle measured *convention-conformance, not functionality*.
- **Root cause + the lesson:** we let each vendor's agent build a **whole heterogeneous project** its own
  way, so convention and config differences swamp the quality signal — every runtime metric needs
  per-project reconciliation. **To measure GS quality cleanly you must control the substrate:** a locked
  scaffold (same package.json, test runner, DB config; only the implementation varies) + a
  convention-tolerant behavioural oracle. That is the next experiment — and it is itself a demonstration
  of the GS thesis: unpinned generation produces heterogeneity you cannot reason about; a spec pins the
  shape and makes it measurable.

## Reproducibility — harness bugs found (all fixed; none were code defects)
1. Docker Desktop was off → coverage silently produced 0/45 in the first measure pass.
2. `localhost` vs `127.0.0.1`: Prisma cannot reach the Docker Postgres via `localhost` (IPv6) on Windows.
3. **JWT expiry `3600` → 3.6 seconds.** Apps pass the value straight to jsonwebtoken's `expiresIn`; the
   `ms` library reads a unit-less "3600" as 3600 **milliseconds**, so tokens expired before the second
   request and auth failed in cascade. Fix: a unit-qualified value ("24h").
4. GPT's app validates `JWT_SECRET` length ≥ 32 (it is *more* rigorous, not broken) — needs a long secret.
5. The strict oracle (above) — a lenient copy (`realworld-spec-lenient`, `== null` → `exists` on
   optional bio/image) removed the null convention but the status-code conventions remained.

## Bottom line
AX2 gives one clean, honest, cross-vendor result: **disciplined specification produces structurally
better code (no layer violations, less duplication, lower complexity, more tests) across GPT, Gemini,
and Claude.** Runtime-quality metrics (coverage, mutation) and behavioural conformance need a
locked-scaffold re-run to be comparable — named as the next experiment. Materials: `experiments/ax2/`,
runner + harness in `experiments/ax/runner/` (`static_ax2.cjs`, `conformance_ax2.cjs`, `coverage_ax2.cjs`,
`measure_ax2_vendors.sh`); per-cell data in `static_ax2.json`, `results_ax2.csv`, `coverage_ax2.json`.
