# Thesis Re-Center — Proposal (for JC's sign-off before rewriting the Compendium)

> 2026-09-20. A proposal to re-center the canonical Compendium (and every derivative — IEEE,
> WhitePaper, FieldGuide, course) around what GS matured into. **Nothing in the Compendium is
> touched until JC signs off on this structure.** Grounded in this session: the CR result
> (capacity-relative, bounded, structural-only), the master line (`soma/docs/gtm/
> gs-positioning-master.md`), and the discipline-revival model (`docs/discipline-revival-model.md`).

## 0. Why re-center — the honest situation

Two things happened to the original contribution, and only one is a loss:

1. **The code-quality contribution genuinely receded.** "Structural disciplines used as a
   generation guide produce better code" is *capacity-relative*: it shrinks as models
   internalize navigation, planning, and forced cycles via subtasks. AX2 and CR confirm it
   (ties or loses to a strong prompt at the frontier).
2. **We changed evaluators — and that is maturity, not loss.** Six months ago an LLM reading the
   white paper returned extraordinary reviews; LLMs are sycophantic to ambitious framing. When we
   switched to adversarial evaluation (stateless judges, the CR experiment, honest reviewers) the
   "extraordinary" deflated — because we stopped believing our own framing and started measuring.
   Peer review is adversarial, not sycophantic: it rewards evidence, not seduction.

The seed idea ("disciplines guide the generator") was **one instance** of a more general law that
**grows** as executors get cheaper. That law is the new trunk.

## 1. The new trunk (the central academic abstraction)

> **Required rigor is a function of the project (stakes, longevity, team, verifiability, stack).
> The cheap executor shifts the entire affordability frontier of rigor — reviving a class of
> constructive practices that were validated but abandoned purely for cost — and a calculable
> portfolio model predicts, per project, *which* practices to revive and *how much* rigor to
> apply.**

Three fused ideas, one abstraction:
- **Cheap rigor** (the economic inversion): the executor makes viable constructive costs that did
  not survive contact with reality. It **grows** with model capability — the inverse of the
  receding code-quality delta.
- **The rigor dial** (how much): rigor/specificity is dialed to project need, bounded by required
  assurance (more AI latitude → lighter verification; higher stakes → heavier control). This is
  the 1-D projection.
- **The revival formula** (which): the portfolio model — submodular, covariance-aware, PCA-diagnosed,
  under a human-effort budget — computes the optimal *set* of practices given the project's inputs.
  This is the full multi-dimensional selection; the dial is its scalar summary.

The abstraction is testable, grows over time, and absorbs the rest as instances.

## 2. The contributions (restated, honest)

- **C1 — The stateless reader and derivability at the pragmatic tier.** *Perennial.* A structural
  fact about AI-assisted development; the problem the discipline exists for. Keep it — it is the
  strongest, least-contested foundation. (On "pragmatic programming": see §4.)
- **C2 — The governance layer as the irreducible durable value.** *Perennial, structural.* Two
  reasons it doesn't recede: an LLM cannot be its own trustworthy verifier (the guarantee needs a
  non-LLM checker), and the model's reasoning evaporates (the trace must persist outside it). The
  revival model *explains* this cleanly: governance practices are "always-worth-it," not revivals,
  because their impact κ scales with team/audit exposure, not with model capability.
- **C3 — Cheap rigor + the rigor dial + the revival portfolio model.** *The new, growing trunk.*
  The central abstraction of §1. This is the PhD-worthy claim: a law + a predictive model + a
  validation methodology.

## 3. The early empirical findings — kept, reframed as a documented trajectory

Per JC: mention the initial findings, honestly, conceding the diminishing delta as an academic
curiosity. This is a mature and genuinely novel move — few papers track the *decay* of their own
benefit, and doing so inoculates against "but models do this now" (already conceded, made part of
the story). The record:

| Early finding | Mechanism | Honest status now |
|---|---|---|
| Better order/correctness | the **bridge** (disciplines as generation guide) | receded at the frontier; large on weak models (CR: structural cleanliness) |
| Security / forbidden ops blocked | **hooks / Defended** | durable (a non-LLM gate; part of C2 governance) |
| Reduced retrieval cost | the **sentinel** | durable on large/messy codebases (KX); the navigation lever |
| Correctness under phase collapse | **quality gates reconstitute the lost RED phase** | durable as a *mechanism*; the guarantee, not the code |
| Better code than naive | full cascade | receded vs a strong expert prompt (saturation, pre-registered) |

Framed as: *"the value did not disappear — it migrated, from a code-quality delta that the frontier
absorbed to a rigor-economics and governance layer that it does not. This paper documents that
migration and gives the model that predicts where the value now lives."* The trajectory itself is a
finding.

## 4. On "pragmatic programming" — refocus, do not lead with it

Keep the **pragmatic tier** (Morris) as the home of the stateless-reader problem (C1) — it is
solid and locates the contribution precisely. But: (a) **do not name the discipline "pragmatic
programming"** — it collides with Hunt & Thomas's *The Pragmatic Programmer* and reads as
borrowed; (b) subordinate the tier framing to the trunk: the pragmatic tier is *where* the problem
lives; cheap rigor is the *economic engine* that makes the solution viable and growing. Refocus,
don't retire.

## 5. The experiment that makes C3 load-bearing (required)

Promoting cheap rigor from a frame to the trunk **obliges** the empirical spine, or it is exactly
the grandiose coinage reviewers punish. The experiment:

> Take 2–3 practices abandoned purely for cost (formal property specification, N-version, PBR,
> exhaustive mutation testing). Show that, executed by AI, they now beat the standard baseline on
> real tasks — with human cost as the variable that changed — **and** show which do *not* revive,
> with the revival model predicting both. The negatives are the evidence: not "everything revives",
> but "these revive, these stay dead, and here is the calculable reason (the human residual)."

Risky (a practice may stay dead), important (reframes SE economics), valid (falsifiable, controlled).
CR is one datum inside this frame (structural cleanliness revives on weak models); Loom (ALX) is the
extreme instance (formal spec → compiler). The product's `chronicle-ledger` supplies the validation
dataset (Δ-quality, hours saved, ROI vs t0).

## 6. What changes in each derivative

- **Compendium (canonical master):** re-order to the §1 trunk. Keep §III (stateless reader) as C1.
  Add a cheap-rigor + dial + revival-model section as the trunk (C3). Reframe the bridge and the
  seven properties as the *operationalization* of C3 (intra-code demands → extra-code properties)
  and the early findings (§3) as a documented trajectory. Elevate governance (C2) from scattered to
  a named contribution.
- **IEEE:** the contribution list already moved #4 to the bounded CR result; add C3 (cheap rigor +
  model) as the lead novel contribution, C1/C2 as the frame and the durable value, and present the
  early findings as the honest trajectory. Related-work must now cover the revived practices'
  original literature (formal methods, N-version/Avizienis, Cleanroom, PBR/Basili) — this also fills
  the "13→30-50 refs" gap productively.
- **WhitePaper / FieldGuide:** lead with cheap rigor + the dial ("how much rigor does *your* project
  need, and which practices are worth reviving") — this is also the product's Assessment output, so
  paper and product tell one story.
- **Course (GS Core):** the trunk shift is a canon change → a G-row to the course board; most micros
  stand (they teach the mechanisms, which become instances). C15 ("what you're buying") is the
  natural home for the cheap-rigor + governance reframe.

## 7. Risks and honest guardrails

- **Grandiose-coinage risk:** cheap rigor without the §5 experiment is a slogan. The promotion to
  trunk *requires* the experiment; until it runs, the Compendium states C3 as a *model + hypothesis*
  with Loom + CR as preliminary instances, not a proven law.
- **Novelty-positioning risk:** "AI makes things cheap" is obvious. The defensible core is the
  *class characterization* (validated-but-dead-on-cost), the *predictive model*, the *validation*,
  and the *surprising negatives*. Lead with those, never with "AI is cheap".
- **Calibration bias:** the revival model's `a` (coverage) and `c_res` (human residual) are the bias
  surface — estimate from data (the ledger), flag provisional defaults, or a reviewer discards them.

## 8. Decision requested

Sign off on: (a) the §1 trunk and the three contributions (§2); (b) keeping the early findings as a
documented trajectory (§3); (c) refocusing the pragmatic tier (§4); (d) committing to the §5
experiment as the condition for promoting C3. On sign-off, the next step is to rewrite the
Compendium §-structure to this and propagate to the derivatives — one deliberate pass, not scattered
edits.
