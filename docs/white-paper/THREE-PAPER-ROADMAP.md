# Three-Paper Roadmap — the cascade, the owed experiments, the anti-monoculture plan

> 2026-09-22. Decided with JC: build **three papers** off the Compendium master, not one
> over-bundled submission. This sheet is the map to sign BEFORE any paper is written: for each
> paper — the one-sentence thesis, the single contribution, the spine, what is evidenced today,
> what is owed, the anti-monoculture strategy, and the target venue. Plus the shared replication /
> preregistration / outsourcing plan and the ship sequence.
>
> Principle (from the focus decision): **split by EVIDENCE, not by academic-vs-industry.** What has
> an experiment behind it ships in the base; the ambitious-but-unproven becomes an extension that
> must *earn* its claim; the practice/tooling is the product. Nothing load-bearing is deleted — it
> is relocated to where its evidence supports it.

---

## 0. The cascade (what anchors what)

```
COMPENDIUM (canonical master, superset, hypotheses marked)
   │  published as a citable tech report (arXiv / Zenodo DOI) — NOT submitted as a paper
   ├── PAPER 1  (BASE, peer-reviewed)      ── derivability + capacity-relative + rubric
   ├── PAPER 2  (EXTENSION #1)             ── cheap rigor + the revival model   (cites P1)
   └── PAPER 3  (EXTENSION #2)             ── the externalized guarantee        (cites P1)

INDUSTRIAL BODY (not journal papers): field guide + product (Companion/Chronicle Leader) +
   an experience/industry-track report (e.g. ICSE SEIP) + Substack
```

- **Compendium** = the "academic-industrial body that links everything" JC asked for. It stays the
  superset; the papers are derived, focused submissions that cite it. Give it a DOI so it is
  citable without being over-bundled.
- **Base ships first and does not wait** on any owed experiment (it is already evidenced).
- **Extensions ship on their own timeline**, gated on experiments they must run/earn.

---

## PAPER 1 — BASE (peer-reviewed submission)

**Working title:** *Derivable Correctness: the Capacity-Relative Value of Externalized Specification.*

**Thesis (one sentence):** A program's correctness can be ratified by a reader from the
specification, contracts, and audit trail — *without reading the implementation* — and the value of
that externalized specification is **capacity-relative**: greatest where the model is weak,
receding as it strengthens.

**Single contribution:** the *derivability lens* + the seven-property rubric that operationalizes it
+ the capacity-relative descriptive finding + honest bounds. (Descriptive/measured — NOT the
predictive revival model, which is Paper 2.)

**Spine (~12pp):**
1. Problem: the assistant does everything from one entry point; what does "correct" mean when a
   human never reads the implementation.
2. Derivability (premise): correctness ratified from what is externalized; the stateless reader as
   the vivid case (central but underlying, not the headline).
3. GS as the discipline: the artifacts that make a program derivable and ratifiable.
4. The seven properties = the expanded definition of correctness (the rubric as instrument).
5. Evaluation (methods + threats-to-validity): RX (derivability), KX (sentinel/retrieval), EX (the
   governance gate), AX (early wins **and the pre-registered saturation null**), ALX
   (machine-checkable oracle), SX/TX (the mechanism).
6. **The capacity-relative finding** (the honest one): CR + AX2 — the value recedes as the model
   strengthens because the failure mode it targets stops occurring. This *explains* the saturation
   rather than hiding it — it is a strength, not a concession.
7. Limitations, replication package, related work.

**Evidenced today:** RX, KX, EX, AX (incl. the null), ALX, SX/TX, CR, AX2. **Fully evidenced.**

**Owed:** none for the claim. Only the **replication package** (publish benchmarks, harnesses,
oracles, preregistrations) and the related-work fill (specification-driven / pragmatic-tier /
declarative lineage).

**Anti-monoculture in the base:** cross-vendor already present (AX2 = GPT/Gemini/Claude);
non-memorized benchmark already present (Pastura, CR); report the null in the same voice as the
positives. Ship the artifact for badge review; invite replication. (Human raters = deferred to DX2,
stated as a limitation — do NOT overclaim.)

**Sentinel + governance ARE here:** the sentinel is evidenced (KX) as the operationalization of
Bounded/derivability, stripped of mythology; the governance *properties* (Auditable, Defended,
Executable) + EX (the gate catching 15 defects) are here as evidenced rubric properties. What is NOT
here is the *claim* "governance is the durable value" — that is Paper 3.

**Venue:** IEEE (Software / Access) or an SE venue; a focused empirical/position hybrid.

**Status:** ~35% drafted (per ieee-strategy-calibration); spine above is the missing structure. **Ready to write on sign-off.**

---

## PAPER 2 — EXTENSION #1: cheap rigor + the revival model

**Working title:** *Cheap Rigor: a Capacity-Gated Model of Discipline Revival.*

**Thesis:** the AI executor makes *validated-but-dead-on-cost* practices cheap again — but a practice
revives only where defect **exposure λ > 0**; its revival value = f(capability gap), and its **shape
depends on the practice class** (governance = flat/durable, defect-catching = capability-hump,
structural = receding). A predictive portfolio model selects *which* practices to revive for a given
project and what each buys.

**Single contribution:** the *class characterization* (validated-but-dead-on-cost) + the
**predictive model** + its validation + the **surprising negatives** (which stay dead and why). Not
"AI is cheap."

**Evidenced today (as instances, not proof):** Loom/ALX (the extreme instance — formal spec →
compiler), NX k=1 (clean negative → revival is capacity-gated, not cost-gated; N-version surfaces
generator uncertainty), CR (a revival datum, receding class).

**Owed (the scientific risk — this is the reason to do the experiments):**
1. **NX k≥3 on a weak model** (qwen ladder) + **harder problems so λ > 0** even on the frontier —
   the test of whether N-version *revives* where the frontier does not.
2. **A 2nd/3rd practice** (mutation testing, PBR, formal property spec) shown to revive **and** to
   stay dead, the model predicting both.
3. **Model-validation:** does predicted revival correlate with measured benefit across
   (practice × project) cells? Bootstrap from the ledger; prospective via `chronicle-ledger`.
4. **The automatable revival tool** (`revival_v0.cjs` → point at a GS-ready project, get the
   actionable portfolio out).

**Anti-monoculture = the outsourcing engine:** this is the paper to run as a **Registered Report**
(protocol frozen, in-principle acceptance, null publishes) and to ship the **benchmark + harness +
oracle as a first-class artifact with a call for replication**. Every independent replication cites
us AND removes the proponent-authored critique. Recruit runners via St. Thomas capstones, Gabriel/BYU.
We run the first honest pass; others generalize.

**Venue:** Registered Report track (ESEM / an RR-accepting SE venue), or empirical SE.

**Status:** model + ledger drafted; experiments designed, mostly not run. **Gated on the owed runs.**

---

## PAPER 3 — EXTENSION #2: the externalized guarantee (the durable core)

**Working title:** *The Externalized Guarantee: what endures when the model does everything.*

**Thesis:** in the single-entry-point world, the value that outlives any model is the **guardrail
kept OUTSIDE the model** (an LLM cannot be its own trustworthy verifier) + the **regenerable spec
imprint** (code as residue). This is where GS evolved — the governance layer as the durable claim.

**Single contribution:** the durable-core argument, made *falsifiable* by a gating experiment.

**Evidenced today:** EX (the external gate caught 15 defects against a live system) — an existence
proof, not a general claim.

**The honest tension (why this is the riskiest paper):** RND-1 currently **nulls** the
independent-verification arm under strong models — a strong model catches much of what an external
gate would. So the claim is **not yet earned**. The paper's whole job is the experiment that
resolves it:
- **Owed — the gating experiment:** show *under what conditions* an external non-LLM gate catches
  what model self-verification misses (stakes, model strength, defect class). If it nulls broadly,
  this becomes an honest **experience/position report** ("here is where the external guarantee still
  pays, and where the model absorbed it"), NOT a defeated claim.

**Anti-monoculture:** same engine — preregister the gating protocol; publish the harness; invite
replication. The null is publishable and honest either way.

**Venue:** governance/assurance or SE-in-practice track; possibly an experience report if it nulls.

**Status:** thesis clear, experiment un-run, **claim currently un-evidenced.** Lowest priority,
highest risk — write last.

---

## The shared plan — replication, preregistration, outsourcing (the anti-monoculture spine)

The three critiques are separate problems with separate fixes:

| Sub-problem | Fix | Who does it |
|---|---|---|
| **Proponent-authored** | Pre-registration (protocol frozen before data) + third-party replication | Us (design) → neutrals (replicate) |
| **Single-benchmark** | 2-3 problem families + non-memorized (Pastura) + cross-vendor (AX2) | Us |
| **No human raters** | DX2 redesigned (independent raters/control) | **Us — cannot be outsourced** |

**The outsourcing engine (JC's idea, made concrete):** publish each experiment's **benchmark +
harness + oracle + preregistration** as a first-class research artifact, run it as a **Registered
Report** where possible, and issue a **call for replication**. Benchmark/dataset artifacts are among
the most-cited SE outputs; every independent run cites us and simultaneously dissolves the
proponent-authored critique. Recruitment channels already in hand: **St. Thomas capstones** (adjunct
route), **Gabriel / BYU** networks, the **biologist co-author** (cross-discipline eyes), and the
**stateless external judges** as an automated *complement* (never a substitute for human raters).

**The honest boundary:** replication by others takes time — the base cannot wait on it, and the
**human-rater arm (DX2) we must run ourselves**. So: base ships now with a full replication package;
extensions run their first honest pass by us + open the terrain for others.

---

## Ship sequence

1. **Now:** write Paper 1 (base) spine → JC sign-off → full draft. Ship the replication package.
   Re-label the Compendium as internal master; register it (arXiv/Zenodo) for a citable DOI.
2. **In parallel:** run the owed Paper 2 experiments (NX k≥3 weak + λ>0; a 2nd practice), preregister
   them, publish the benchmark-as-artifact with a call for replication.
3. **After the base lands and P2 experiments read out:** draft Paper 2.
4. **Last / gated on the gating experiment:** Paper 3 — as a full claim if the experiment supports
   it, as an honest experience report if it nulls.

---

## Decision requested
Sign off on: (a) the three-paper cascade + Compendium-as-citable-master; (b) Paper 1 as the base to
write now (fully evidenced, sentinel + governance-properties + EX included, durable-core CLAIM
excluded); (c) Paper 2/3 as extensions that must earn their claims via the owed experiments; (d) the
anti-monoculture engine (preregister + benchmark-as-artifact + call for replication + DX2 for human
raters). On sign-off I write the Paper 1 spine for your signature.
