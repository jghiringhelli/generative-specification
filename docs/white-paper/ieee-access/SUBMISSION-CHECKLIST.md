# IEEE Access — Submission Checklist & Critical Path

*What stands between now (Sept 1 2026) and hitting "submit." Target: end of Sept 2026 (one revision cycle before the ~Jan 31 2027 UOC deadline = 10 baremo points). The paper is a DERIVED artifact from `GenerativeSpecification_Compendium.md`; keeps the SEVEN properties (not the decagon — that's the follow-on IEEE Software paper); enforces the confidentiality Gate in SKELETON.md.*

## A. Drafting status (what exists vs what's missing)

| Section | Status | Notes |
|---|---|---|
| Abstract + contributions | ✅ drafted (`01-...md`) | ⚠️ result sentence still has a NUMBER-HOLE — fill from objective metrics (mutation/coverage/static) |
| §IV.A Structure of the Seven | ✅ drafted (`02-...md`) | **Two-bridges now UNBLOCKED** — lock confirmed Sept 1 (semiotic crossings). Update to the pragmatics→semantics / semantics→syntax framing; keep lifecycle-vs-internal partition as analysis, no SAVED/decagon branding |
| Related Work (§II) | ✅ drafted (`03-...md`) + refs (`04-...md`) | Highest reviewer risk; verify distinctness-vs-SpecKit framing holds |
| Introduction (§I) | ☐ **missing** | Needs: numbered contributions + **RQs** + one-sentence organization para |
| Problem Formalization (§III) | ☐ **missing** | Stateless-reader as binding constraint; bridge + sentinel + read-asymmetry |
| GS: The Discipline (§IV) | ☐ **missing** | Seven properties + phase collapse + cost inversion (soften §4.3 token econ per Gate) |
| **Study Design (§V)** | ☐ **missing — the spine** | Port from Supplement §S1-S4, restructure into **Kitchenham's 6 subsections** |
| **Results (§VI)** | ☐ **missing — the spine** | Port from Supplement §S6/S7/S9, **one subsection per RQ**, effect-size % + exact p-values, report nulls; objective metrics NOT the 14-pt rubric; + axios teardown + flea-game |
| Threats to Validity (§VII) | ☐ missing | 4 buckets, one para each |
| Discussion (§VIII) + Conclusion (§IX) | ☐ missing | Port + trim from WP §7/§9 |
| Data Availability & Reproducibility | ☐ missing | One sentence + persistent DOI + replication package |

**Honest read: ~35% drafted.** The drafted pieces are the framing (abstract, related work, §IVa). **The spine (Study Design + Results, §V-VI) is the heavy lift and the credibility of the paper — it does not exist yet in IEEE form**, only as Supplement material to be ported + re-structured to Kitchenham + re-scored on objective metrics.

## B. Hard requirements checklist

- [x] **ORCID** for submitting author: **0009-0004-6092-5387** (JC).
- [ ] **IEEE two-column template** (LaTeX preferred; Word ok). Source + PDF, ≤40 MB, **≤20 pages**.
- [ ] **Abstract:** single unstructured paragraph, 150-250 words, **leads with a concrete number** (fill the hole).
- [ ] **Index Terms:** 3-10 from the **IEEE Thesaurus** (controlled vocab). Candidates to verify: *Software engineering · Artificial intelligence · Software quality · Formal specifications · Software architecture · Program processors / Computer languages · Large language models (verify it's in the thesaurus)*.
- [ ] **AI-disclosure line** in Acknowledgements (mandatory — text was AI-assisted). Draft ready-to-paste (below).
- [ ] **CrossCheck / self-similarity:** substantially rewrite vs the Zenodo v4.0 preprint; **cite the Zenodo DOI (10.5281/zenodo.21726017) as the preprint**. Do NOT paste WP prose wholesale.
- [ ] **Replication package** with its own DOI (Zenodo preferred): the AX benchmark + conditions + replication steps.
- [ ] **APC $2,160** (+tax; -5% IEEE member / -20% society member) — approved.
- [ ] **English quality** — poor grammar = immediate rejection. Do the stateless-external-judge dry-run pass.
- [ ] **Cover letter + suggested reviewers.**

## C. Decisions JC must make (blockers)

1. **Title** — lead with #1 (*Generative Specification: A Discipline of Derivability for the Stateless Reader*) unless you want the reviewer-facing reframe (#2). → pick one.
2. **§IV.A middle path** — confirm: keep the lifecycle-vs-internal partition + two-bridges as *analysis*, NO SAVED/decagon branding, NO 0-100 tool (those stay in the IEEE Software follow-on). (Recommended, already the plan — just confirm.)
3. **The result number for the abstract** — which objective metric leads (mutation-score delta? real-coverage delta? static-analysis reduction?). Needs the Supplement number.
4. **Author bio + affiliation** — PragmaWorks LLC? independent researcher? (affects the byline).
5. ~~**ORCID**~~ ✅ **0009-0004-6092-5387**.

## D. AI-disclosure line (ready to paste in Acknowledgements)
> *Portions of this manuscript were drafted with the assistance of AI language models. All technical content, experimental design, results, and conclusions are the author's own; the author reviewed and verified all AI-assisted text and takes full responsibility for the manuscript.*

## E. Critical path to submit (in order)
1. **Lock the 5 decisions in §C** (fast, JC).
2. **Port + write §V Study Design (Kitchenham 6) and §VI Results (per-RQ, objective metrics)** — the spine, the biggest job.
3. Write §I Intro (contributions + RQs), §III Problem Formalization, §IV Discipline.
4. Fill the abstract number-hole; update §IVa to the semiotic two-bridges.
5. Write §VII Threats, §VIII Discussion, §IX Conclusion, Data Availability.
6. Assemble in the two-column template; build the Zenodo replication package (DOI).
7. Stateless-external-judge dry-run (English + soundness); revise.
8. Cover letter + suggested reviewers → submit.

**Realistic timeline:** the spine (§V-VI) is 1-2 focused sessions; the rest 2-3 more; template assembly + replication package + dry-run 1-2. End-Sept is achievable IF the spine starts now. The bottleneck is §V-VI, not the framing.

## F. What I can draft next (no JC input needed)
- Update **§IVa two-bridges** to the semiotic-crossings framing (now unblocked).
- Draft **§I Introduction** with a candidate contributions list + RQs (JC edits).
- Draft **§V Study Design** skeleton in Kitchenham's 6 subsections from the Supplement (the spine — biggest value).
