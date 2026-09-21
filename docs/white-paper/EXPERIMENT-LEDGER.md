# Experiment Ledger — what we honestly have, and what each supports

> 2026-09-20. Per JC: we already have many experiments; the badly-designed or off-claim ones may
> be set aside **as long as it is not dishonest** (never hide a contradicting result — just don't
> lean a claim on a broken design). This ledger maps each experiment to the claim it supports, its
> design quality, and where it belongs under the re-centered thesis (Paper 1 = stateless reader +
> the honest value-migration; Paper 2 = cheap rigor + the revival model + the experiment). Verify
> the §7.8 letters against the current Compendium before citing.

## The map

| Exp | What it measured | Supports | Design honesty | Verdict → home |
|---|---|---|---|---|
| **AX** (§7.8.B) | Conduit, naive/control/treatment, k=5, static + blind audit | GS ≫ naive (structure); **GS ≈ expert prompt on median (saturation, pre-registered)** | single benchmark + single model; **"expert prompt = GS-lite" confound** | **KEEP, Paper 1** as the early-win + the honest saturation. Feature the null. |
| **AX2** | Cross-vendor structural (GPT/Gemini/Claude), naive→disciplined | layer violations 18-35→0 cross-vendor; dup/complexity down | **JC's flaw: tested prompting, not the enforced loop**; coverage/strict-oracle un-measurable (swamp) | **KEEP w/ caveat, Paper 1** (cross-vendor structural). **Retire honestly** the coverage/strict-oracle sub-metrics (design didn't support them) — say so. |
| **SX / TX** (§7.8.J-K) | Two-lever decomposition (navigation vs bounding); 3B truncation | the mechanism; capacity-relative seed; sentinel=search, bounding=surface | n=2, single benchmark, "mechanism demonstration, not powered" | **KEEP, both papers** — mechanism (P1) + capacity-relative seed (P2). Already labeled honestly. |
| **KX** (§7.8.E) | Retrieval economics: routed sentinel vs monolith vs no-structure | authored structure cheaper **and** more accurate on structural queries | single model; ground truth derived from the structure (own caveat) | **KEEP, Paper 1** — the durable retrieval/navigation value (survives the frontier). |
| **EX** (§7.8.D) | Production deploy: 13/13 probes, 1013 asserts, 6/6 SLO, **15 defects the gate caught** | the **governance/gate** value (Defended/Executable earned against a live system) | single project, demonstration | **KEEP, Paper 1 (C2 governance)** — the gate working is the durable story. |
| **RX** (§7.8.G) | Independent reproducibility: 104 tests from a fresh GS doc, from nothing | **derivability / reproducibility** (C1) | single case | **KEEP, Paper 1 (C1)**. |
| **ALX / Loom** (§7.8.F) | Compiler derived from a *formal* language spec; 386/386; S_realized 0→1 curve | **cheap rigor — the extreme instance** (formal spec revives) + derivability at the formal tier | single artifact; the correction-log is the finding | **KEEP, Paper 2 flagship instance** — this is the strongest single datum for cheap rigor. |
| **CR** | Capacity-relative on invented Pastura, qwen7b→frontier | H1 **partial: structural cleanliness only**, receding; behavior null at weak rung | n=3, GS high-variance at weak, single benchmark, 32B dropped | **KEEP bounded, both** — the receding (P1) + a revival-model datum (P2). Already fully caveated. |
| **MX** (§7.8.H) | Model cost / tiering boundary | tiering economics (cost lever) | verify design | **KEEP as supporting, Paper 2** (the cost axis of the revival model). Verify before featuring. |
| **BX** | The rubric / seven-property study | the rubric as instrument (operationalization) | verify | **KEEP as operationalization**, not a headline result. |
| **DX1** | Mitikah / 58-dev field study | (was: field adoption) | **weak design + employer-confidentiality** | **RETIRED already** — out of all public materials. Honest retirement, documented. |
| **NX** (new) | N-version revival: Avizienis, single-vs-triple, Sonnet + qwen7b, k=1/2 | **the revival model's core prediction**: benefit is **exposure-gated (λ), not cost-gated** — dead on frontier (λ≈0), revives only where the generator errs; **N-version surfaces generator uncertainty** (a lucky single gen hides variance the triple exposes) | k small, single practice, one weak + one frontier model, problems within model competence (need harder for λ>0) | **KEEP, Paper 2** — the first *measured* revival datum + a novel angle; a mechanism demonstration, not powered. `experiments/nx/`. |
| **DX2** | Two-arm human study (designed) | would be: human validation | designed, **not run** | **Candidate for the human-validation the reviewers asked for** — Paper 2, if run. |

## The honest pruning rule (what "ignore" means here)

- **Retire a sub-metric, not a result:** where a design could not support a metric (AX2 coverage/strict-oracle; the "GS > expert on median" reading), we drop *that claim* and **say the design didn't support it** — we do not delete the experiment or hide that it tied/lost.
- **Never suppress a contradicting outcome:** CR's mixed/negative result stays, featured. The saturation null stays, featured. Reporting nulls in the same voice as positives is the credibility move (and the reviewers asked for it).
- **Off-claim ≠ deleted:** experiments that don't serve the new thesis (parts of MX/BX) become supporting/appendix, not headline — but remain in the replication package.

## What the ledger says we still owe (the experiments to run)

Paper 1 is **fully evidenced today** (AX, KX, EX, RX + the CR/AX2 receding = the value-migration story). Paper 2 needs:
1. **The revival experiment** — 2-3 dead-on-cost practices (formal property spec, N-version, PBR, mutation) shown to beat baseline under AI execution, **and which do not**, the model predicting both. Loom is one instance; **NX (N-version) is the first run** — result: *exposure-gated* (revives only where the generator errs; dead when λ≈0), plus a novel uncertainty-surfacing angle. Still owed: **harder problems (λ>0 even on the frontier)** and **a 2nd/3rd practice** to generalize beyond N-version.
2. **The model-validation** — does predicted revival correlate with measured benefit across (practice × project) cells? Bootstrap from the ledger above (each row is a coarse datum); prospective validation via `chronicle-ledger`.
3. **Human validation** (DX2, redesigned) — the independent-rater/control the reviewers asked for.

## Status
Inventory drafted from memory of the §7.8 series; **verify each letter + design detail against the
current Compendium before any of this enters the paper.** No claim here is load-bearing until
checked against the primary record.
