# IEEE Access Submission — Skeleton & Source Map

> **Target venue:** IEEE Access (JCR / SCIE-indexed mega-journal, continuous submission, ~4-week first decision, APC ~$2,000).
> **Why this venue:** the only JCR outlet that can realistically return an *accepted* letter before the UOC admission deadline (~31 Jan 2027), which is worth 10/10 on the production-science line of the baremo.
> **Submission target:** end of September 2026 (allows one revision cycle before January).
> **DECISION (Aug 2026):** venue locked = **IEEE Access**. APC (~$2,160) approved to secure a JCR-accepted paper before the Jan 2027 UOC deadline (the 10 admission points). IEEE Software is the follow-on reach paper.
> **Scope of THIS paper:** the conceptual paradigm (stateless reader + seven properties + the bridge) with a reproducible evaluation. NOT the decagon/SAVED (that is the follow-on IEEE Software paper) and NOT any confidential or retired material (see the Gate below).

---

## Working title (candidates)

1. *Generative Specification: A Discipline of Derivability for the Stateless Reader* (current WP title, strong, keep)
2. *Specifying for the Stateless Reader: A Pragmatic-Tier Discipline for AI-Assisted Software*
3. *Derivability as a Design Constraint: Generative Specification for AI Code Generation*

Lead with #1 unless a reviewer-facing reframe is wanted.

---

## The confidentiality & honesty Gate (applies to every section)

**OUT of this paper, without exception:**
- The **14-point rubric** as a headline metric. The AX experiment is reported through its **objective, rubric-independent metrics** (mutation score, real coverage, static-analysis counts) and blind-audit outcomes. The rubric may appear once as an internal instrument, never as the evidence of record.
- Any **token-reduction / cost percentage** claim (WP §4.3). Unproven field objection. Keep token economics qualitative at most, or cut.
- **DX1 / Mitikah / the 58-developer field study.** Review WP §5.3 "Field Corroboration" and cut or fully anonymize anything sourced from the employer field report.
- **Employer figures, VairixDX comparative data, the decagon/SAVED rubric.** All belong elsewhere or nowhere.

**IN (clean, reproducible, defensible):**
- The **AX pre-registered multi-agent adversarial study** (purpose-built benchmark, not anyone's production system).
- **Open-source teardowns** (axios, and 1-2 more) as external-validity evidence.
- **The flea-game** as a formal-methods illustration.

---

## Section skeleton (IEEE two-column) with source map

| # | IEEE section | Source in current corpus | Action | Notes |
|---|---|---|---|---|
| — | **Abstract** (200-250w, structured) | WP `## Abstract` (L17) | Rewrite | Frame as a research claim + result, not a manifesto. State the constraint, the discipline, the evaluation, the finding. |
| — | **Index Terms** | new | New | e.g. AI-assisted software engineering, LLM code generation, specification, software quality, empirical software engineering. |
| I | **Introduction: The Stateless Reader** | WP §1 (L33) | Reuse + tighten | Add an explicit **contribution list** (the paradigm, the seven properties, the pre-registered evaluation) and a paper-organization paragraph. |
| II | **Background & Related Work** | WP §8 (L264) + §2.1 (L59) + §2.3 (L77) | Reuse + **expand** | Reviewers will push hardest here. Position vs: spec-driven dev / **GitHub Spec Kit**, SOLID/TDD/DDD, formal methods, and the LLM code-gen + prompt-engineering literature. Be explicit about what is ours vs the field's (WP §2.3). |
| III | **Problem Formalization** | WP §1 + §4.1 (L145, bridge / read-asymmetry) | Rewrite | Make the stateless-reader constraint precise: derivability as a binding constraint. The bridge, the sentinel, and the read-asymmetry as the mechanism. |
| IV | **Generative Specification: The Discipline** | WP §3 (L106, seven properties) + §3.1 (L126, concept map) + §2.2 (L73, phase collapse) + §4.2 (L159, cost inversion) | Reuse | Core contribution. Seven properties + how they cover the space. **Soften/cut** §4.3 token economics per the Gate. |
| IV.A | **Structure of the Seven** (new subsection) | new synthesis (this session's insights) | New | See the dedicated block below. Folds in the lifecycle-vs-internal partition, the drift/audit distinction, and the two-bridges refinement. **Reviewer-safe framing only** (no SAVED/decagon branding, no 0-100 tool). |
| V | **Evaluation Methodology** | Supplement §S1-S4 (pre-registration, benchmark, conditions, blind adversarial audit, metric collection) | Reuse **heavily** | This is the paper's spine and its credibility. A **pre-registered** design with a blind adversarial audit is exactly what a rigorous reviewer rewards. Present conditions (naive / expert-prompting control / GS treatment) cleanly. |
| VI | **Results** | Supplement §S6 (objective metrics), §S7 (real coverage), §S9.1 (mutation testing), §S9.3 (static quality) + axios teardown + flea-game | Rewrite framing | **Report via objective metrics, not the 14-pt rubric.** Mutation score, real coverage, static-analysis deltas across conditions. Add the axios teardown as external validity and the flea-game as a formal illustration. |
| VII | **Threats to Validity** | WP §6 (L234) + Supplement §S13 (L556) | Reuse | Construct / internal / external / conclusion validity. Honest about single-author, benchmark scope, and the assessor design. |
| VIII | **Discussion & Implications for Practice** | WP §7 (L240) | Reuse + trim | What practitioners do differently. Keep grounded, drop aspirational reach. |
| IX | **Conclusion** | WP §9 (L284) | Reuse + tighten | The claim, the evidence, the honest boundary, the next question. |
| — | **References** | WP `## References` (L320) | Expand | Add the related-work sources named in II. Aim for a defensible, current bibliography. |
| — | **Data Availability & Reproducibility** | WP `## Data Availability` (L353) + Supplement §S15 (Replication Instructions, L597) | Reuse | Access values this. Point to the public repo, the benchmark, and the replication steps. Strong differentiator. |
| — | **Lexicon** (optional appendix) | WP §10 (L292) | Optional | Keep only if space and the venue allow an appendix; otherwise fold key terms inline. |

---

## Planned §IV.A — Structure of the Seven (new subsection, folds in this session's insights)

JC's request: a subsection that captures refinements that have surfaced since v4.0. Three ideas, framed as **analysis of the seven**, not as a new product:

1. **The seven partition into two roles.** Five are **lifecycle / process-facing** (Self-describing, Auditable, Verifiable, Executable, Defended) — the properties a non-author stakeholder can inspect and hold the artifact to over its life. Two are **internal / structural invariants** (Bounded, Composable) — properties of the artifact's own construction. This partition explains *why* the seven cover the space: they answer two different questions, "can someone accountable verify it?" and "is it well-formed inside?".
2. **Drift vs audit are different failure modes.** Architectural **drift** (decisions forgotten between sessions, incoherence accumulating) is what the discipline as a whole resists. **Auditability** (can an accountable non-engineer verify and approve it) is a distinct concern that the process-facing properties address. Naming the two failure modes separately sharpens the contribution and pre-empts the "isn't this just code review" reflex.
3. **The two bridges** (needs JC's one-line lock before drafting — see flag). The evolving framing that there are *two* translations/bridges rather than one. Candidate readings from prior framings: intent→spec+architecture (the senior translation) and spec→code+CICD (the junior translation); or the read-side bridge (retrieval, RAG upgraded to a code-knowledge graph) and the write-side bridge (generate→verify). **Do not draft this until JC confirms the exact definition** — a formal paper cannot guess it.

### ⚠ Tension with the Gate — decide before drafting §IV.A
The prior decision (and memory) was to keep the **decagon / SAVED branding and the 0-100 rubric OUT** of the flagship paper, because acronyms read as branding to academic reviewers and the runtime/ops properties dilute the stateless-reader argument. §IV.A can honor that **and** deliver JC's insight if it presents the lifecycle-vs-internal **partition as analysis** (no SAVED/CORE/Bounded acronyms, no scored tool). Recommended: keep the *concept*, drop the *branding*. The branded rubric + 0-100 tool stay in the follow-on IEEE Software paper. **Confirm this middle path with JC.**

## What is strong here (keep front-of-mind)

- The evaluation is **pre-registered** with a **blind adversarial audit** and **rubric-independent objective metrics** (mutation, coverage, static analysis) plus **replication instructions**. That is a genuinely rigorous empirical spine, rare for a paradigm paper.
- The related work already separates *what is ours* from *what is the field's* (WP §2.3), which pre-empts the "this is just spec-driven dev" reviewer reflex if expanded well.

## Known reviewer risks to pre-empt

1. **Distinctness vs GitHub Spec Kit / spec-driven dev.** IEEE Access does **not** gate on novelty (verbatim: "not necessarily expected to have a high level of novelty, but should be distinct from previous publications and technically sound"). So the bar is *distinctness + soundness*, not degree of advance. Section II must show GS is **distinct** (derivability-by-a-stateless-reader as the binding constraint, not just "write specs"), not that it out-novels prior work. This lowers risk #1 substantially.
2. **Single-author / single-benchmark evaluation.** Own it in Threats; lean on pre-registration + objective metrics + open-source teardowns to widen external validity.
3. **The retired rubric leaking in.** Enforce the Gate: metrics of record are objective, not the 14-pt score.
4. **Self-similarity vs the Zenodo preprint.** IEEE Access runs CrossCheck plagiarism/similarity screening. The v4.0 white paper is already public on Zenodo, so this journal version must be a **substantially rewritten, distinct contribution** (empirical reframe), and must **cite the Zenodo DOI as the preprint**. Do not paste WP prose wholesale.

## Confirmed IEEE Access requirements + house form (research, Aug 2026)

**Hard requirements:**
- **Length:** keep **≤ 20 pages** in the mandatory two-column template (over 20 needs EIC permission). No page charges.
- **Files:** source (Word **or** LaTeX) **and** PDF, ≤ 40 MB.
- **Abstract:** single **unstructured** paragraph, **~150-250 words**, and house style **leads the result with a concrete number**, not a promise.
- **Index terms:** 3-10, drawn from the **IEEE Thesaurus** (controlled vocabulary; used to route to an editor).
- **ORCID** required for submitting author; **AI-generated text must be disclosed in Acknowledgements**; **poor grammar = immediate rejection**.
- **APC: $2,160** + tax (IEEE member -5%, Society member -20%; institutional deposit may cover).
- **Decision is binary** (accept / reject-with-feedback), not major/minor cycling. Rapid: ~4-6 weeks end-to-end advertised. First-submission quality is everything.
- **Reproducibility:** DOI'd replication package (Zenodo preferred over bare GitHub); opt-in reproducibility badge via post-publication code review.

**Review gate (what reviewers actually score):** contributes to the body of knowledge · technically sound · comprehensive presentation · applicable/sufficient references · correct English. **Soundness + rigor + clarity + distinctness. Not impact.**

**House section order (from exemplars — supersedes the table order above where they differ):**
Abstract → Introduction (**numbered contributions + RQs** the empirical section answers + one-sentence organization paragraph) → Background / Paradigm framing → **Related Work, placed early** → **Study Design** (use Kitchenham's six subsections: Design & context with explicit baseline/control · Tasks/instruments (tabled) · Participants (N, honestly) · Measurement · **Statistics named up front** · replication package) → **Results (one subsection per RQ**, effect size in % **alongside exact p-values**, **report nulls explicitly**) → Discussion → **Threats to Validity** (Construct / Internal / External / Conclusion, one paragraph each: threat + mitigation) → **Data Availability & Reproducibility** (one sentence, persistent DOI) → Conclusion & Future Work → References → author bios.

**Action items this creates:**
- Add **RQs** to the Introduction (hybrid: contributions list + the RQs the study answers).
- Restructure Section V into **Kitchenham's six subsections**; Section VI into **one subsection per RQ**.
- The Abstract's result sentence needs a **real number** pulled from the objective metrics (currently a qualitative placeholder).
- Register **ORCID**, prepare the **AI-disclosure** line, and plan the **Zenodo replication package**.
- Cite the **Zenodo v4.0 DOI as the preprint** to clear self-similarity.

---

## Next actions (writing phase)

1. Draft the **Abstract + contribution list** (sets the whole frame). 
2. Draft **Section II (Related Work)** first after the abstract, since it is the highest-risk and shapes the positioning.
3. Build **Section V-VI** from the Supplement, re-scored on objective metrics.
4. Assemble in the **IEEE two-column template** (LaTeX or Word), add cover letter + suggested reviewers.
5. Pre-submission **stateless external-judge pass** (fresh context-free review) as a dry run before sending.

*Output location: this folder (`docs/white-paper/ieee-access/`). Canonical master remains `GenerativeSpecification_Compendium.md`; this is a derived submission artifact.*
