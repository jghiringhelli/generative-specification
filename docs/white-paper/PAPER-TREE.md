# The GS Paper Tree — one base, focused derivatives, one superset

> 2026-09-27. Decision (JC): build a **tree** of papers — one BASE, others DERIVED from it, each with
> a clear focus and a clear boundary of *what it says and what it does not*. This is fine — and
> correct — **as long as the Compendium holds everything as the coherent superset.** Refines
> `THREE-PAPER-ROADMAP.md` with concrete say/don't-say boundaries taken from the actual
> `GenerativeSpecification_WhitePaper.md` content inventory.

## The principle
- **Compendium = the master superset (integrity anchor).** Everything lives there, cross-consistent,
  hypotheses marked. Not submitted. It is what makes multiple papers safe: each paper is a *cut* from
  one coherent body, so they cannot drift apart.
- **Each paper = ONE clear focus**, cites the base, and explicitly does NOT carry claims that belong
  to a sibling. The over-bundling the blind reviews punished was exactly one paper carrying five
  focuses at once.
- **Derivatives earn their claim** (their own experiments/argument); they don't get the base's
  evidence for free.

## The tree

### BASE — "Derivable Correctness: the stateless-reader discipline and its rubric"
*The method, why it works, and the evidence it produces software a reader can ratify from outside the
implementation — with honest capacity-relative bounds.*
- **SAYS:** the derivability obligation (stateless reader) · the **seven-property rubric** (the
  operationalization) · the three mechanisms — **bridge + asymmetry**, **sentinel** (bounded
  context), **phase collapse** · **capacity-relative scaffolding** (value highest where the model is
  weak, recedes as it strengthens) · the spec-as-contract root (#3, the abstraction-chain cap:
  RFC 2119/SLA form) · honest bounds.
- **Evidence:** AX (structure), KX (retrieval/sentinel), EX (production), RX (reproducible), TX/SX
  (mechanism), ALX (formal tier), BX (rubric author-independence); MX/RND-1 as supporting.
- **Does NOT say:** "governance is *the* durable value" (→ D1) · cheap-rigor/revival (→ D2) · the
  pragmatic-tier / paradigm-of-removal philosophy (→ D3) · the 21-term coined lexicon (cut; keep 2-3
  load-bearing terms in prose) · the bolded promise "you will build correct systems" (reconcile to
  *assurance/governable process*, matching its own §4.1 concession).
- **Source:** cut down from the current `WhitePaper.md` (remove the three exiled focuses + the
  lexicon + the overclaim). This is the real submission (~12-15pp).

### D1 — "The Externalized Guarantee: what endures under strong models" (governance / durable core)
- **SAYS:** in the single-entry-point world the durable value is the guarantee kept OUTSIDE the model
  (an LLM can't be its own trustworthy verifier) + the regenerable spec imprint; the trust side does
  not recede. This is the academic home of the governance-product thesis.
- **Evidence OWED:** the gating experiment (does an external non-LLM gate catch what strong-model
  self-verification misses, and under what conditions). **Currently nulled by RND-1 under strong
  models** — so this is the highest-risk paper; if it nulls broadly it becomes an honest
  experience/position report, not a defeated claim.
- **Does NOT say:** the rubric/derivability framework (that's the base it cites).

### D2 — "Cheap Rigor: a capacity-gated model of discipline revival"
- **SAYS:** the cheap executor revives validated-but-dead-on-cost practices; revival is
  **exposure-gated (λ), not cost-gated**; the shape taxonomy per practice class; the predictive
  portfolio model.
- **Evidence OWED:** the pre-registered revival program (`experiments/revival/PREREGISTRATION.md`) —
  NX at higher k on the weak-model ladder, a 2nd/3rd practice, model-validation on the held-out fold.
- **Does NOT say:** anything the base already carries; it uses the base's capacity-relative finding
  as its starting point and turns it *predictive*.

### D3 (optional) — "The Pragmatic Tier: a semiotic placement for AI-era programming discipline"
- **SAYS:** the pragmatic-tier placement (Morris), the paradigm-of-removal framing (Martin's sense),
  the theoretical home. A **position/conceptual** paper — no empirical burden.
- **Why separate:** pulling the grand framing OUT of the base removes exactly the "grandiose framing"
  the novelty reviewers punished from the empirical paper, and lets it stand or fall as a position
  piece. Writable now (conceptual); lowest priority.

## The BASE core (locked, JC 2026-09-28)
The base's *minimum sufficient* core = **the three load-bearing mechanisms (bridge, sentinel, phase
collapse) + the whole substrate + the rubric.** That is the core of GS. Then add the items that
directly frame or bound them (below). Everything else → a derivative.

- **Core (must):** derivability / stateless reader (the premise) · **the substrate** (spec + cascade
  + sentinel + hooks/gates + verification, with the **contract-spec root**, #3) · **the bridge +
  asymmetry** · **the sentinel** (bounded context) · **phase collapse** · **the seven-property
  rubric**.
- **Add (frames/bounds the core):** capacity-relative scaffolding (the honest bound on the bridge) ·
  read-asymmetry (the read side of the bridge) · cost inversion / "the spec is the program" (the
  consequence of phase collapse + substrate) · generative execution (the verify step) ·
  tokens-per-correct-output (light).
- **NOT in base:** governance-is-the-durable-value CLAIM (→ D1) · cheap-rigor/revival (→ D2) ·
  pragmatic-tier philosophy (→ D3) · the coined lexicon.

## Contribution distribution
| Contribution | Paper |
|---|---|
| Derivability / stateless reader · substrate · bridge · sentinel · phase collapse · rubric · capacity-relative · read-asymmetry · cost inversion · generative execution · contract-spec root (#3) | **BASE** |
| The externalized guarantee (external non-LLM verifier + regenerable imprint is the durable value) | **D1** |
| Cheap rigor + the capacity-gated revival model + the portfolio selector | **D2** |
| Pragmatic-tier placement · paradigm-of-removal framing | **D3** |

## Experiment distribution
| Exp | Supports | Home (role) |
|---|---|---|
| **AX** | structure quality + rubric | BASE |
| **BX** | rubric author-independence | BASE |
| **KX** | sentinel / retrieval economics | BASE |
| **EX** | phase collapse + production + substrate | BASE (also cited in **D1** as the external-gate existence proof — same experiment, different claim) |
| **RX** | derivability / reproducibility | BASE |
| **TX** | bridge / capacity-relative construction | BASE |
| **SX** | sentinel (search) vs bounding (surface) | BASE |
| **ALX** | derivability at the formal tier | BASE (also cited in **D2** as the extreme-revival instance) |
| **MX** | model-agnosticism (spec, not model) | BASE (supporting) |
| **RND-1** | prescriptive spec suppresses corner-cutting | BASE (supporting) |
| **NX** | N-version revival is exposure-gated | **D2** |
| **CR** | capacity-relative revival datum | **D2** |
| *(new)* revival grid (pre-registered) | the revival model, validated | **D2** (owed) |
| *(new)* gating experiment | external gate catches what strong-model self-verify misses | **D1** (owed — the paper) |

Rule: an experiment may be *cited* by more than one paper for *different* claims (EX, ALX), but each
*claim* is owned by exactly one paper.

## New experiments to create (JC willing to build published ones)
Prioritized by academic leverage — each addresses a blind-review weakness (monoculture:
proponent-authored / single-benchmark / single-model / no-human-raters). Publish each as a
**pre-registered artifact with a call for replication** (the anti-monoculture engine).

**For the BASE (strengthen the core against the monoculture critique):**
1. **Second benchmark / domain** replicating AX's structure result off Conduit → breaks
   *single-benchmark*. HIGH leverage, most needed.
2. **Capability ladder** for the capacity-relative claim (multi-rung, not n=2) → strengthens
   TX/capacity-relative. Can share infrastructure with the D2 revival ladder. HIGH.
3. **Human-rater study (DX2 redesigned)** for the rubric → breaks *no-human-raters*. HIGH; the one
   that cannot be automated (needs disinterested raters).

**For D1:** the **gating experiment** — required; the paper does not exist without it.
**For D2:** the **revival grid** — already pre-registered (`experiments/revival/`).

## Boundary rules (how to decide where content goes)
1. **Evidenced now → base.** Ambitious-but-unproven → the derivative that must earn it. Philosophy →
   D3.
2. **A claim lives in exactly one paper.** If two papers want it, it belongs to the more specific one
   and the other *cites* it.
3. **Coinages:** keep only the 2-3 load-bearing terms (stateless reader, and the mechanism names) in
   prose; no lexicon table. New coinages → the Compendium glossary, not the papers.
4. **The Compendium carries the union**, with each hypothesis marked and each paper's scope noted, so
   the papers never contradict.

## Sequencing
1. **Now:** cut the BASE from `WhitePaper.md` (remove D1/D2/D3 material + lexicon, reconcile the
   overclaim, keep the factual fix). Ships first — it is fully evidenced.
2. **Parallel:** run the D2 revival experiments (already pre-registered); draft D2 when they read out.
3. **After the base lands:** D1 gated on the gating experiment (or as an honest experience report);
   D3 whenever.
4. **Compendium** stays the superset; register it (arXiv/Zenodo DOI) as the citable master.

## What happens to the current WhitePaper.md
It is the raw material, not the base. The base is a focused cut of it. Either (a) transform
`WhitePaper.md` into the base in place (removing the exiled material), or (b) keep it as the long-form
"everything" white paper (Compendium-adjacent) and create a new short base file. Recommendation: (a) —
one focused base is what submits; the long-form role is already the Compendium's.
