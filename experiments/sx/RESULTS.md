# SX — Results (pilot, n=1 per cell, claude-sonnet-4-5, S0/S1/S2)

> Two behaviorally-identical twins (both pass the strict RealWorld Hurl oracle 13/13): a clean/GS-disciplined
> Conduit backend (lean) and a calibrated "average real project" mirror (chaotic; 8 documented degradation
> dimensions, each cited — see `calibration.json`). Task: add a computed `readingTime` field to every article
> response (the chaotic twin has the article serialization duplicated across 5 LIVE copies; the clean twin has
> it centralized in one place). Agentic run via `claude -p`; behavior verified by the oracle, coherence by a
> 6-path probe (did `readingTime` appear correctly on all live paths). Sentinel = the authored CLAUDE.md
> navigation map. **n=1 per cell so far — direction strong, add reps for stability.**

## The ablation (total tokens to complete the change)
| Condition | lean | chaotic | chaotic / lean |
|---|---|---|---|
| **S0** — no sentinel either | 801,880 | 3,183,101 | **4.0x** |
| **S1** — sentinel on lean only (the realistic GS-vs-average) | 298,446 | 2,394,170 | **8.0x** |
| **S2** — sentinel on both (navigation equalized) | 298,758 | 893,353 | **3.0x** |

Supporting: writes (edit count) lean = 2 in every condition; chaotic = 12 (S0) -> 11 (S1) -> 7 (S2). Coherence
6/6 in every cell (the frontier model found all 5 live copies — it *pays* rather than *fails*). Oracle 13/13
throughout (behavior preserved). Localization tokens: the sentinel collapses them for BOTH twins (chaotic loc
586k/590k without a map -> 207k with one at S2; lean 352k -> 202k).

## The decomposition (what each mechanism costs)
1. **The sentinel fixes the SEARCH/localization cost, for both twins.** Adding the map cuts the clean twin 63%
   (802k -> 298k) and the chaotic twin 72% (3.18M -> 0.89M). Localization tokens collapse to ~200k on both at
   S2. This is the KX / authored-structure result, and it is the honest reason CodeSeeker-style query-time
   search is superseded: the value is the authored map, not a search tool.
2. **The sentinel does NOT fix the SURFACE/reconciliation cost.** Even with a map on both (S2), the chaotic
   twin still costs **3.0x** the clean one (893k vs 299k) and needs **7 writes vs 2** — because the change must
   be applied to 5 live duplicated copies, which no amount of navigation removes. Only *ordering the code*
   (removing the duplication) removes it.

## Why this matters (resolves the TX boundary; vindicates the original intuition)
TX concluded "structure alone does not cheapen reading; the sentinel does" — but TX's twins were not bloated
(no duplication to reconcile), so it could only see the navigation axis. SX separates the two axes on a
genuinely average-degraded twin:
- **Search cost** (blind pattern-hunting) -> fixed by the authored sentinel (both twins). [field phenomenon #1]
- **Surface cost** (forget-and-duplicate; reconciling N copies) -> NOT fixed by a map; requires refactoring.
  This is the residual 3.0x at S2, structural, and it persists on a FRONTIER model. [field phenomenon #2]
So de-inflating a chaotic project (removing duplication/surface) lowers cost beyond what a sentinel can, for
any model — which is the intuition TX under-stated. The honest sell number: a GS project with its map vs an
average chaotic project without one is ~8x (S1) on the same change; even map-for-map it is ~3x (S2).

## Scope / honesty
n=1 per cell (add reps). Single benchmark (Conduit), one frontier model (claude-sonnet-4-5). The weak-model
(Ollama, agentic) arm is future work and is where the coherence FAILURE (a missed copy -> broken output),
not just the extra cost, is expected to show. Coherence stayed 6/6 here because the frontier model pays the
cost rather than dropping a copy. All per-run data in `runs/` (`*.json`, `*.raw`, `*.probe.json`, `*.hurl.log`).
