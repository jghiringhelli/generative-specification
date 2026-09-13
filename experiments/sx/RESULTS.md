# SX — Results (pilot, n=2 per cell, claude-sonnet-4-5, S0/S1/S2)

> Two behaviorally-identical twins (both pass the strict RealWorld Hurl oracle 13/13): a clean/GS-disciplined
> Conduit backend (lean) and a calibrated "average real project" mirror (chaotic; 8 documented degradation
> dimensions, each cited — `calibration.json`). Task: add a computed `readingTime` field to every article
> response (chaotic has the article serialization duplicated across 5 LIVE copies; lean has it centralized in
> one place). Agentic run via `claude -p`; behavior verified by the oracle, coherence by a 6-path probe (did
> `readingTime` appear correctly on all live paths). Sentinel = the authored CLAUDE.md navigation map.
> **n=2 per cell.** Mechanism demonstration, single benchmark, one frontier model — not a powered effect size.

## The ablation — total tokens to complete the change (both reps; mean)
| Condition | lean | chaotic | chaotic / lean |
|---|---|---|---|
| **S0** — no sentinel | 802k / 2,104k (mean 1,453k) **high variance** | 3,183k / 2,054k (mean 2,619k) | ~1.8-4x (noisy) |
| **S1** — sentinel on lean only (realistic GS-vs-average) | 298k / 404k (mean **351k**) | 2,394k / 1,956k (mean **2,175k**) | **~6.2x** |
| **S2** — sentinel on both (navigation equalized) | 299k / 305k (mean **302k**) | 893k / 569k (mean **731k**) | **~2.4x** |

Edit count (writes), the cleanest signal (low noise): lean = **2** in every sentinel condition; chaotic = 11-12
(S0) -> 10-11 (S1) -> **7 / 7** (S2). Coherence 6/6 in all 12 runs; oracle 13/13 throughout (behavior preserved).
Localization tokens collapse with the map for both twins (chaotic ~590k without -> ~210k with, at S2).

## Findings
1. **The sentinel fixes the SEARCH/localization cost, for both twins** (localization ~590k -> ~210k on chaotic
   with the map; lean ~350k -> ~205k). Authored structure, consulted by lookup — the KX result. This is why
   query-time semantic search (CodeSeeker-style) is superseded: the value is the authored map.
2. **The sentinel does NOT fix the SURFACE/reconciliation cost.** With a map on both (S2), chaotic still costs
   **~2.4x** the tokens and **3.5x the edits (7 vs 2)** — because the change must hit 5 live duplicated copies,
   which no navigation removes. Only *ordering the code* removes it. Stable across both reps (7 writes both).
3. **The sentinel reduces VARIANCE, not just the mean.** With a map, lean is cheap AND consistent (S1/S2: 2
   edits, ~300-400k, both reps). Without a map (S0), even the CLEAN twin is high-variance: rep0 = 2 edits/802k,
   rep1 = 11 edits/2,104k (the agent wandered). No authored map = unpredictable navigation even on clean code.
4. **The chaotic twin is expensive in every condition; coherence held (6/6) because the FRONTIER model pays
   rather than fails.** The coherence *failure* (a missed copy -> broken output) is the weak-model story
   (future work; TX already shows weak-model truncation).

## Why this matters (resolves the TX boundary; vindicates the original intuition)
TX ("structure alone doesn't cheapen reading; the sentinel does") used un-bloated twins, so it could only see
the navigation axis. SX separates the two axes on a genuinely average-degraded twin:
- **Search cost** (blind pattern-hunting) -> fixed by the authored sentinel. [field phenomenon #1]
- **Surface cost** (reconciling N duplicated copies) -> NOT fixed by a map; requires refactoring; the stable
  S2 residual (~2.4x tokens, 3.5x edits), on a FRONTIER model. [field phenomenon #2]
Honest headline numbers: a GS project with its map vs an average chaotic project without one is ~6x on the
same change (S1); even map-for-map, ordered code is ~2.4x cheaper and needs a third the edits (S2).

## Scope / honesty
n=2 (S0 is high-variance and would need more reps to pin a mean; the sentinel cells S1/S2 are stable and carry
the load-bearing claims). Single benchmark (Conduit), one frontier model (claude-sonnet-4-5). Weak-model
(Ollama, agentic) arm is future work and is where a coherence FAILURE, not just extra cost, is expected. All
per-run data in `runs/` (`*.json`, `*.raw`, `*.probe.json`, `*.hurl.log`); aggregate CSVs `probe_stdout.csv`,
`s1_stdout.csv`, `s2_stdout.csv`, `reps_extra.csv`.
