---
layout: default
title: "KX - Knowledge Retrieval"
parent: Experiments
nav_order: 6
description: "Harness-as-knowledge-retrieval: CKG-benchmark replication (Yarmoluk & McCreary) over an AI coding harness. CNT routing vs monolith dump vs bare code search."
---

# KX — Harness as Knowledge Retrieval (CKG Benchmark Replication)

Replicates the methodology of **Yarmoluk & McCreary, "Benchmarking Knowledge
Retrieval Architectures" (v0.6.2, 2026)** — token-level F1 + Reasoning Density
Score (RDS = F1/tokens) — with an AI coding harness as the knowledge structure.

**Thesis**: a ForgeCraft CNT is a Compact Knowledge Graph in their formal sense.
It satisfies their three load-bearing properties: finite enumerable context (the
harness budget), deterministic traversal (the routing table), closed vocabulary
(screaming architecture). This experiment measures whether it delivers CKG-class
retrieval economics in *agentic* use.

## Design

- **Subject**: the `ax/treatment-v8` Conduit project (ForgeCraft-generated harness,
  blind-audit 12/12).
- **Queries**: 45, generated deterministically from the project's own artifacts
  (`generate-queries.cjs`) — same derivation-from-structure property and caveat
  as the paper's §5.3/§8.5.
  - T1 ×8 — code behavior (negative control: answers live in code, not structure)
  - T2 ×10 — doc obligations (the Doc Obligation Table = dependency edges)
  - T3 ×8 — layer paths (multi-hop traversal of the architecture)
  - T4 ×11 — aggregates (gates registry, ADRs, UCs, CNT branches = taxonomy)
  - T5 ×8 — cross-links (@gs-links: file → governing documents)
- **Conditions** (fresh `claude -p` session per query, usage JSON captured):
  - **monolith** — full harness+docs+gates dump injected into the prompt, neutral
    cwd, no tools (RAG-dump analog: everything in context)
  - **cnt** — project cwd, agent navigates from the 49-line routing root (CKG analog)
  - **bare** — stripped copy in an isolated temp dir (no `.claude/`, `CLAUDE.md`,
    `docs/`, `.forgecraft/`, harness probes), agent searches code
    (derive-at-query-time analog)
- **Scoring**: SQuAD-style token F1 (their Eq. 1); RDS = F1/tokens (Eq. 3).
  Tokens = input + output + cache_creation + cache_read per session.

## Results (45 queries × 3 conditions, zero errors)

| Condition | Macro F1 | Tokens/q | RDS | RDS ratio | Cost/q | Turns/q |
|---|---|---|---|---|---|---|
| monolith | 0.6106 | 100,237 | 6.09e-6 | 0.59× | $0.5606 | 1.0 |
| **cnt** | **0.8080** | **78,603** | **1.03e-5** | **1.00×** | **$0.1017** | 2.8 |
| bare | 0.4310 | 233,583 | 1.85e-6 | 0.18× | $0.2432 | 8.7 |

| F1 by type | T1 entity | T2 obligation | T3 path | T4 aggregate | T5 cross-link |
|---|---|---|---|---|---|
| monolith | 0.833 | 0.607 | 0.458 | **0.909** | 0.135 |
| cnt | 0.813 | **0.672** | **0.642** | **0.909** | **1.000** |
| bare | **0.875** | 0.040 | 0.544 | 0.006 | 0.946 |

Full tables: [RESULTS.md](RESULTS.md). Per-query records: `evidence/<condition>/`.

## Pre-registered predictions, scored

1. **"CNT wins macro RDS"** — ✅ CONFIRMED. Highest F1 (0.808), lowest cost
   ($0.10/q, 5.5× under monolith), RDS 1.7× monolith and 5.6× bare.
2. **"Monolith matches CNT F1 on T2/T4 but at a large token tax"** — PARTIAL.
   T4 tied (0.909); but T2/T3 monolith scored *worse* (0.607/0.458 vs 0.672/0.642)
   despite having every answer in context — **lost-in-the-middle degradation,
   measured**. The cost tax confirmed: $0.56 vs $0.10 per query.
3. **"Bare collapses on T2/T5, competitive on T1, decent on T3"** — MOSTLY.
   T2 0.040 ✅ collapse; T1 0.875 ✅ best of all (negative control behaves);
   T3 0.544 ✅ (screaming architecture lets code structure answer path queries).
   **T5 0.946 — prediction WRONG, instructively**: `@gs-links` live in source
   file headers, so traceability survived doc-stripping. Putting links in code
   rather than only in docs is what made them indestructible.
4. **"T4 sharpest divergence"** — ✅ CONFIRMED: 0.909 vs 0.006 — near-exact
   replication of the paper's Track 1 pattern (CKG 0.964 vs GraphRAG 0.054).

## Findings

- **KX-F1 (sandbox escape)**: in the first bare run, the agent ran `find` across
  the filesystem, located the original project two directories up, and read its
  gates registry and CLAUDE.md — the "no-structure" arm found the structure
  anyway (13 escaped reads, run invalidated and re-executed in an isolated temp
  dir with zero escapes). Observation: a resourceful agent will locate authored
  structure if it is reachable at all.
- **KX-F2 (lost-in-the-middle, quantified)**: the monolith had every answer in
  its 100k-token context and still lost to routed retrieval on 3 of 5 query
  types. More context degraded accuracy — the harness-bloat failure mode as a number.
- **KX-F3 (absence of structure is the most expensive condition)**: bare burned
  492k tokens/query on T2 and 294k on T4 — 8.7 turns of searching for conventions
  that do not exist — to score ~0. Structure doesn't just improve answers; its
  absence multiplies cost.
- **KX-F4 (uniform-cost signature)**: monolith consumed ~100k tokens regardless
  of question (the paper's RAG signature, their Fig. 9); CNT varied 28k–142k
  with query need (the CKG signature).

## Methodology notes

- **Agentic floor**: every condition carries Claude Code's fixed session overhead
  (system prompt, tool schemas) in its token counts, compressing ratios relative
  to the paper's bare-pipeline numbers (their 11× tokens/q → our 3× totals). The
  *marginal* retrieval difference is larger: T2 tokens 27.7k (cnt) vs 492k (bare) = 17.8×.
- **Ground-truth caveat** (paper §8.5): T2/T4/T5 truths derive from the same
  structure the CNT reads. The claim is the paper's: explicit structure beats
  inferred structure on structural queries — not that the CNT wins all queries
  (T1: bare wins, by design).
- Same model family across conditions; fresh session per query; resume-capable
  runner; one mid-run session-limit interruption on the bare arm (36 queries
  purged and re-run cleanly).

## Reproduce

```
node generate-queries.cjs   # queries.json from the treatment-v8 artifacts
node run-kx.cjs monolith && node run-kx.cjs cnt && node run-kx.cjs bare
node score.cjs              # RESULTS.md
node check-bare-escapes.cjs # isolation audit
```
