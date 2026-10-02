# Figures for the IEEE Access draft

| Fig. | Content | Status |
|---|---|---|
| 1 | Sentinel navigational tree: a root instruction file with scoped child nodes and the five categories, showing what a session loads for one task | Source below (Mermaid); render to vector for the template |
| 2 | Study design: three conditions (naive, expert prompt, GS) by two stages (original single run; k = 5 replication) plus the post-hoc series, the cross-vendor study and the capacity ladder, with evidence tiers | Source below (Mermaid) |
| 3 | Individual runs per condition for four metrics (k = 5) | Generated: `fig3-strip-plot.svg`, from `experiments/ax/runner/results.csv` |

## Fig. 1 source

```mermaid
flowchart TD
  R["Root (always loaded): identity, standards, prohibitions, tool sequencing, routing"]
  R --> A["Domain node: auth"]
  R --> B["Domain node: articles"]
  R --> C["Domain node: comments"]
  R --> D["Cross-cutting: gates, ADR index"]
  B --> B1["Layer node: application"]
  B --> B2["Layer node: infrastructure"]
  T(["Task: add a field to article responses"]) -. loads only .-> R
  T -.-> B
  T -.-> B1
```

## Fig. 2 source

```mermaid
flowchart LR
  S1["Stage 1 (Mar 2026): one run x 3 conditions; design and 10 predictions committed (author-attested)"] --> S2["Stage 2: k = 5 x 3 conditions (tier A)"]
  S1 --> PH["Post-hoc v2-v8: one run each, iterated (tier C)"]
  S2 --> X["AX2: 3 vendors x 3 conditions x 5 (tier B)"]
  S2 --> CR["CR: invented benchmark, capacity ladder, k = 3 (tier B)"]
```
