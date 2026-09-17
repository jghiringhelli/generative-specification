# CR Benchmark — Pastura (invented, non-memorized)

The measurable core of the capacity-relative study. Authored 2026-09-17. **Do not publish
`DOMAIN_SPEC.md` or this folder until after the runs** (contamination control).

## Contents
- `DOMAIN_SPEC.md` — the shared ground truth (both conditions build to this).
- `naive/README.md` + `prompts/naive-prompts.md` — the naive condition (vibe coding).
- `gs/` (CLAUDE.md sentinel + contracts / use-cases / nfrs / test-architecture) +
  `prompts/gs-prompts.md` — the GS condition (authored cascade).
- `oracle/ORACLE_SPEC.md` — the 24-probe conformance oracle (strict on R1/R2/R3 + error
  contract, tolerant on framework/naming). Executable Hurl probes are in `oracle/probes/`
  (6 group files = 24 probes; see `oracle/probes/README.md`).

## Runner (all under `../runner/`, reuses the AX2 runner's node_modules/eslint)
- `../ladder.json` — the capability ladder roster (weak→frontier, a priori order fixed).
- `../runner/canary_probe.md` — the contamination canary (run cold, once per model).
- `../runner/ollama_generate_cr.cjs` — weak-local generator (splits the single prompt file).
- `../runner/materialize_cr.cjs` — fenced-block → project/ (copy of AX2 materialize2).
- `../runner/static_cr.cjs` — clean static suite (Pastura layer regex; scans `runs/`).
- `../runner/conformance_cr.cjs` — the Pastura oracle on a live Postgres (`pastura-measure`:5545);
  reports oracle/6 and the load-bearing business-rule sub-score /3.
- `../runner/measure_cr.sh` — orchestrates generate(local)/materialize/static/conformance.

## Run checklist (turnkey; only the ladder + generation remain)
1. `ladder.json` is authored — confirm/trim the rungs (drop 32B if VRAM-bound). Order is
   pre-registered; do not re-order post hoc.
2. Run `../runner/canary_probe.md` cold on each model → `canary_results.json` (near-zero recall).
3. Generate k≥3 per (model × condition):
   - **local (ollama):** `GEN_OLLAMA=1 OLLAMA_MODEL=qwen2.5-coder:7b REPS=3 ../runner/measure_cr.sh`
   - **frontier/mid (Copilot arm / CLI, other PC):** generate with `prompts/naive-prompts.md`
     (naive) and the `gs/` cascade + `prompts/gs-prompts.md` (GS), stage each tree at
     `../runner/runs/<slug>__<naive|gs>/<rep>/project`, then run `../runner/measure_cr.sh`.
4. `measure_cr.sh` runs `static_cr.cjs` + `conformance_cr.cjs` (resumable). Outputs
   `static_cr.json` + `conformance_cr.json`.
5. Compute Δ(m)=naive−gs per metric across the ladder; test the monotone trend
   (Jonckheere-Terpstra / Page — PREREGISTRATION §7). Plot the Δ-vs-capability curve.

## Status
- [x] Domain spec + oracle authored and consistent (arithmetic verified).
- [x] Naive + GS conditions + fixed prompts authored.
- [x] `ladder.json` authored (confirm/trim rungs for local VRAM).
- [x] Hurl probes generated + parse-verified (Hurl 8.0.1).
- [x] Runner glue (generate/materialize/static/conformance/orchestrate) authored + syntax-checked.
- [ ] Canary probe run.
- [ ] Generation runs (needs the second PC / Copilot arm + local Ollama).
- [ ] Δ + trend stats.
