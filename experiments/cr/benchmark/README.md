# CR Benchmark — Pastura (invented, non-memorized)

The measurable core of the capacity-relative study. Authored 2026-09-17. **Do not publish
`DOMAIN_SPEC.md` or this folder until after the runs** (contamination control).

## Contents
- `DOMAIN_SPEC.md` — the shared ground truth (both conditions build to this).
- `naive/README.md` + `prompts/naive-prompts.md` — the naive condition (vibe coding).
- `gs/` (CLAUDE.md sentinel + contracts / use-cases / nfrs / test-architecture) +
  `prompts/gs-prompts.md` — the GS condition (authored cascade).
- `oracle/ORACLE_SPEC.md` — the 24-probe conformance oracle (strict on R1/R2/R3 + error
  contract, tolerant on framework/naming). Generate Hurl probes under `oracle/probes/` from it.

## Run checklist (turnkey; needs the ladder decision — see ../PREREGISTRATION §4, §9)
1. Fix `ladder.json` (weak→frontier roster + a priori capability order + citations).
2. Run the **canary recall probe** cold on each model; log near-zero recall.
3. For each (model × condition) cell, k≥3 runs via the AX2 runner
   (`../../ax/runner/`): naive uses `naive/` + `prompts/naive-prompts.md`; GS uses `gs/` +
   `prompts/gs-prompts.md`.
4. Materialize each output on live Postgres; run the static suite (`static_ax2.cjs`) + the
   Pastura oracle (`conformance_ax2.cjs` pointed at `oracle/probes/`).
5. Aggregate per cell (median [IQR]); compute Δ(m) per metric; test the monotone trend
   (Jonckheere-Terpstra / Page). Plot the Δ-vs-capability curve.

## Status
- [x] Domain spec + oracle authored and consistent (arithmetic verified).
- [x] Naive + GS conditions + fixed prompts authored.
- [ ] `ladder.json` + canary probe (needs infra decision).
- [ ] Hurl probes generated from `oracle/ORACLE_SPEC.md`.
- [ ] Runs.
