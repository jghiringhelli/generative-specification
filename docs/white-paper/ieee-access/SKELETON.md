# IEEE Access Submission — Skeleton & Source Map (refreshed 2026-10-01)

> **Venue:** IEEE Access (JCR/SCIE mega-journal, binary decision, about 4 to 6 weeks, APC about $2,160). It gates on soundness, distinctness and clarity, not novelty ("not necessarily expected to have a high level of novelty, but should be distinct from previous publications and technically sound").
> **Scope of this paper:** the stateless-reader constraint, the seven properties, and a replicated comparison with its null reported, bounded by a capacity-relative result. It is the base paper of the three-paper roadmap (`../THREE-PAPER-ROADMAP.md`). Governance-as-durable-value, the revival model, the pragmatic-tier placement, the Decagon and any confidential or retired material are out.
> **Source of truth for evidence:** `experiments/ax/runner/stats.json`, `experiments/ax2`, `experiments/cr/RESULTS-final.md`, `experiments/kx`, `experiments/sx`, `experiments/ax/bridge`; the Supplement (`../GS_Experiment_Supplement.md`) and the ledger (`../EXPERIMENT-LEDGER.md`) for the original single run. The white paper (`../GenerativeSpecification_WhitePaper.md`) reports the same AX evidence in broader form; this paper is a subset of it.

## The honesty gate (applies to every section)

- The 14-point rubric is not evidence of record. It appears only as a secondary audit on an earlier 0/1/2 scale and in the labelled single-run and post-hoc series. The letter scale (A to F), levels L4 and L5 and "governed as of" are defined once (IV.A) and are not measured.
- The 3/14 to 14/14 trajectory is reported as a diagnostic series from iterated post-hoc runs, never as an effect size. Three of ten registered predictions were confirmed.
- The expert-prompt tie is reported as a tie with GS without its substrate; the substrate-versus-prompt question is carried as the unrun hypothesis H-S (VIII.B). Nothing claims the advantage.
- One-run results are examples and not rates. No token-reduction percentage is asserted. KX reports tokens and dollars separately.
- No SAVED, Decagon, governance-as-durable, pragmatic-tier or confidential material. DX1 and employer figures stay out.
- Registration language: the original three-condition design is author-attested (the commits are not in the public history); the k = 5 plan is pre-specified in intent only; CR's registration (commit `c4c855e`) is the one that is timestamped in the public history.

## Section map (current files)

| IEEE section | File | State |
|---|---|---|
| Abstract (233 words), index terms, contributions | `01-abstract-and-contributions.md` | Drafted v0.3; numbers checked against stats.json |
| I Introduction (contributions, RQs, terms) | `11-section-I-introduction.md` | Drafted v0.3 |
| II Related work (eight lineages, 55 verified references) | `03-related-work.md`, `04-references.md` | Drafted v0.2; renumber by first citation at assembly |
| III Problem formalization | `08-section-III-problem.md` | Compact v0.3; extended text in `supplement/S3` |
| IV The discipline (seven properties, grouping, grading, loop, coherence design) | `09-section-IV-discipline.md` | Compact v0.3; extended in `supplement/S4`, `supplement/S5` |
| V Study design | `05-section-V-study-design.md` | v0.3 |
| VI Results: A to F (RQ1 to RQ4, post-hoc series, KX) | `07-section-VI-results.md` | v0.3 |
| VI.G Twin studies (TX, SX) | `13-section-VI-twin-study.md` | Compact; full text `supplement/S2` |
| VI.H, VI.I AX2 cross-vendor, CR capacity ladder | `14-section-VI-ax2-crossvendor.md` | v0.3 |
| VII Threats to validity | `10-section-VII-threats.md` | v0.3, includes the five named threats |
| VIII Discussion (A practice, B expert-prompt tie and H-S), IX Conclusion, Data availability, AI disclosure | `12-sections-VIII-IX-data.md` | v0.3 |
| Figures | `figures/` | Fig. 3 generated; Figs. 1 and 2 as Mermaid source |
| Replication protocol (appendix) | `supplement/S1-AX-replication-protocol.md` | Contains stale text (says the runner is absent); see checklist |

Word count after this revision: about 9,200 words across the section files including note lines and tables, plus about 1,500 words of references. At typical two-column density that is about 12 to 14 pages with three figures, inside the 20-page limit with room for the figures and a copy-edit.

## Known reviewer risks (current)

1. **Distinctness against spec-driven tools** (Kiro, Spec Kit, traceSDD): addressed in II.D by claiming no superiority and no new properties.
2. **Single author, probably memorized benchmark, treatment-targeted metric, model-written tests, the expert-prompt tie:** all named in VII; the mitigations are partial and the experiments that would remove them are listed in the checklist.
3. **Self-similarity with the Zenodo v4.0 preprint (CrossCheck):** the introduction and section III were rewritten and compacted; cite the preprint DOI; run a similarity check before submission.
4. **Presentation:** promotional boxes were removed; a human copy-edit is still required (poor grammar is an immediate rejection).
