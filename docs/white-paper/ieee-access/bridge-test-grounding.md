# Bridge Test — Literature Grounding + Grounded Design

> Two parallel verified lit reviews (Sept 2 2026) to ground the bridge test in existing
> studies BEFORE running it (per JC), so we do not re-prove the known, we anchor related
> work, and we position novelty. All citations verified to resolve (arXiv/DOI landing
> page) unless marked unverified.

## What the literature ALREADY establishes (cite, do not re-prove)

### The natural default (what "M" is — the mud twin is NOT artificial)
- **LLMs default to structurally-smelly code:** ~+63% more code smells than human reference (Paul, Zhu & Bayley 2025, arXiv:2510.03029); 60.9% of units carry >=1 smell (Sousa et al. 2025, DOI 10.5753/eniac.2025.12470). Signature defects: **Long Method, God Class, poor naming, high cognitive complexity** — exactly the properties a stateless reader depends on.
- **"Modular Mirage"** (Zhu, Tsantalis & Rigby 2026, arXiv:2605.02741): LLMs achieve *surface* modularity (file separation) but fail at the semantic cohesion a cold reader needs; code volume predicts structural decay almost perfectly (rho=0.94). **Crucially: increasing prompt requirement-specificity had NO statistical effect on structural quality.** => You cannot prompt your way to the bridge; the discipline must be ENFORCED (validates the GS process/harness over mere prompting; parallels AX where treatment's edge over control was reliability, not median).
- **Generated tests are also undisciplined by default** (Ouédraogo et al., TOSEM 2026, arXiv:2410.10628): Assertion Roulette, Magic Number — the tests-as-contracts pillar does not appear on its own.
- **Quality decays with task complexity/size** (Molison et al. 2025 arXiv:2508.00700; Paul 2025): fine on toy tasks, structural problems on complex/OO-heavy ones. Varies most by complexity, then model, weakly language (matches JC: "varies a lot by language/prompt/project").
- Consequence: **M can be a real default generation and we can CITE that it is representative** of documented default behavior — it need not be hand-degraded.

### The micro-level causal link (structure -> AI comprehension/modification) is SHOWN
- **Naming is the channel for intent** (Le et al. 2025, "When Names Disappear", arXiv:2510.03178): stripping identifiers severely degrades comprehension; releases **ClassEval-Obf** (a naming-ablation benchmark, reusable as our naming control). Li et al. 2025 (arXiv:2508.06414): degrading identifier names drops code-gen performance up to **~30 percentage points**.
- **Comments -> better modification** (Vitale et al. 2026, arXiv:2601.23059): comments improve automated bug-fixing accuracy up to **3x**.
- **Low-smell corpora are more derivable** (Xue et al. 2025, TOSEM DOI 10.1145/3793252, arXiv:2508.11958): cleaning smells improves completion + search across models.
- **Structure -> lower token cost** (Ma et al. 2026, arXiv:2606.14061): giving an agent explicit repo *structure* cuts input tokens up to **26%**, concentrated in fault-localization (the reverse-engineering phase). NB manipulates a structure *representation*, not the code's own architecture.

### Reusable measurement harnesses (do not reinvent)
- **SWE-bench** (Jimenez et al. 2023, arXiv:2310.06770, ICLR'24): real issue->patch tasks; the modification-accuracy DV. Its difficulty is cross-file localization — the thing architecture is meant to make easy.
- **RepoBench** (arXiv:2306.03091) + **CrossCodeEval** (arXiv:2310.11248): localization / retrieval-ease DV; separate "find the right place" from "write the code" (maps to hexagonal known-locations).
- **ClassEval-Obf** (Le 2025): naming-ablation control. **Ma 2026** token-accounting method for context cost.

## THE GAP = our novel contribution (crisp, defensible)
No located study manipulates the **architectural** human-maintainability disciplines (SOLID/SRP, hexagonal/layered known-locations, tests-as-contracts) on the **same** system and measures the resulting change in AI **comprehension + modification accuracy + token cost**. Naming, comments, and smells are covered; **"architecture as AI-derivability" is OPEN.** The thesis "human-maintainability structure == AI-derivability" is *partially shown* at identifier/comment/smell granularity and *open* at architecture granularity. Zhu's "prompt specificity did not help" makes the hypothesis genuinely contestable (not foregone) — reviewer-friendly.

## Grounded design (reconciles JC's "M = natural default" with the literature's clean method)
The literature's implied design is **paired refactor-and-compare** (well-structured vs functionally-equivalent unstructured, scored on comprehension/modification/token cost) — "a design the literature sets up but has not run." Reconcile with JC's naturalism:
- **M = a real default generation** (default prompt, no bridge signal). Verify it matches the documented default smell profile (Long Method / God Class / poor names / no interfaces), and cite that profile as evidence M is representative.
- **D = a behavior-preserving disciplined refactor of that same M** (SOLID interfaces + SRP, hexagonal ports/adapters, intention-revealing names, tests-as-contracts). Behavior held identical because **the same behavioral test suite passes on both** (the oracle). Structure is then the only free variable — no confound — while M stays ecologically real.
- **BINARY first** (D vs M), discipline-ladder later (strip one discipline at a time) if the binary separates.
- **Three DVs on a fresh, stateless assistant per twin:**
  1. **Comprehension** (KX-style): ~18 intent/location/invariant questions -> token-F1 vs fixed ground truth.
  2. **Modification** (SWE-bench-style): add/change a feature -> does the shared suite stay green? + tokens + read-breadth.
  3. **Cost/reverse-engineering**: tokens spent + how much of the codebase it had to read (targeted vs whole-tree), per Ma-2026 accounting.
- **Prediction:** D -> accurate, cheap, targeted reads; M -> error-prone, expensive, whole-codebase sweeps. Ties the lifecycle-economics arc: AX (GS costs MORE to generate) + KX + bridge (disciplined structure CHEAPER to read/extend) = the real answer to the token-cost objection.
- **Caveat to pre-register:** varies by language/prompt/project (Zhu, Paul); run on >=1 system, ideally add a second language/domain for external validity; naming is a known strong channel (Le/Li) so the architecture effect must be shown ABOVE the naming effect (use ClassEval-Obf-style naming controls to separate architecture from naming).

## Scope decision for JC (paper placement)
- (a) **Follow-on paper / flagship** — do it fully (paired repos, SWE-bench-style tasks, k reps, second domain). Strongest, but multi-week; the current IEEE paper ships now on AX(k=5)+KX.
- (b) **Scoped pilot in THIS paper** — comprehension-only Q&A on one D/M pair (reuse an AX treatment rep as D, a naive rep as M, with the behavior-nonidentity caveat stated), as preliminary evidence for the §IV.A bridge theory, full version future work.
- (c) **Cut from this paper**, cite the grounding above in §III related work, run properly next.
