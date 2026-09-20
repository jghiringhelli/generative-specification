# The Discipline-Revival Model (v1)

> A calculable model that, per project, ranks which engineering disciplines (practices) are
> worth *reviving* under a cheap AI executor, and what advantage each buys — as a **portfolio**,
> covariance-aware, under an effort budget. Formalizes the "cheap rigor" thesis
> (`soma/docs/gtm/gs-positioning-master.md` §5): the executor makes viable constructive costs
> that did not survive contact with reality. Doubles as (a) a new output of the Readiness
> Assessment and (b) the falsifiable model of the PhD/IEEE line.
>
> Inputs wire to the governance product's existing instruments
> (`C:\workspace\PragmaWorks\pragmaworks-gobernanza\`): the three detectors
> (`dogfood\2026-09-17-f1-regeneracion\referencia\src\core\detectores.js`), the thresholds
> (`...\const.js`), the business-policy classifier (`...\negocio.js`), the 7-predicate
> thermometer (`docs\specs\gs-companion.md` §6), and the cost/ROI schema
> (`docs\specs\chronicle-ledger.md` §8). It obeys the tooling anti-patterns GC-1..GC-10
> (`docs\reference\antipatrones-de-tooling.md`).

## 0. The claim it makes calculable

A practice *P* was historically adopted iff `Benefit(P) > Cost(P)`. Many high-benefit
practices (formal specification, N-version, Cleanroom, Perspective-Based Reading, exhaustive
mutation testing, heavy traceability) died because the **human** cost dominated. The AI
executor collapses that cost. *P* **revives** for a project π when the collapse flips the sign.
The model outputs, per project, the **portfolio** of practices to apply and the advantage each
buys — never a single scalar "GS score", and never a claim of "better code".

## 1. Objects

- **Failure modes** `F = {f_1..f_m}`: the classes of defect a practice can prevent. Seeded
  from the seven-property failure modes + the detectors' contradiction classes
  (`contradiccion-clones/-config/-simbolo`) + ForgeDX's pathology catalog. Fixed, published
  (GC-1).
- **Practices** `P = {P_1..P_n}`: the disciplines under evaluation (TDD, mutation testing,
  formal property spec, N-version, PBR, doc-cascade, sentinel, atomic commits, layered
  boundaries, contract tests, hooks/gates, …). Each `P_j` carries a **profile** (§4).
- **Project** `π`: an input vector (§3), partly a short intake, partly automatic from the
  detectors and the ledger.

## 2. Per-failure weight (value at risk)

For each failure mode `f_i` and project π:
- `λ_i(π)` = **exposure** — how much of `f_i` the project is prone to. Automatic: detector
  counts (clones, config/symbol contradictions), the ✗ predicates of the 7-thermometer, and
  ForgeDX pathology density, **normalized by surface** (per-KLOC or per-module — GC-6), scaled
  by churn in the affected zone (`ventanaChurnDias=90`).
- `κ_i(π)` = **impact if it reaches production** — `base_hours(task_type) × rates(role).cost_per_hour`
  (chronicle-ledger §8) × a **policy multiplier** (`esPoliticaComercial` → a contradiction
  touching money/percentages/contractual terms is high-impact) × the project stakes `S`.
- **Weight** `w_i(π) = λ_i(π) · κ_i(π)` — the expected cost the project carries from `f_i`.

Undeterminable `λ_i` or `κ_i` → mark `no medido`, weight 0, never a penalty (GC-5).

## 3. Project input vector π

Short intake (S,L,T,R,V) + automatic (D,N):
- **S** stakes / blast-radius (regulated? money? user-facing?) → scales κ.
- **L** longevity × change-frequency → scales λ for change-payback practices (tests, docs,
  sentinel).
- **T** team size × turnover → scales κ for governance/auditability failure modes.
- **R** audit / regulatory pressure → scales κ for traceability / signed-decisions.
- **V** domain verifiability (is there a cheap oracle?) → caps coverage `a` of verification
  practices (a practice can't catch what can't be checked).
- **D** measured pathology vector (detectors + thermometer misses) → sets λ. Automatic.
- **N** codebase size → scales `c_AI`. Automatic.

## 4. Practice profile `P_j`

- **Coverage vector** `a_j ∈ [0,1]^m`: how well `P_j` catches each failure mode. (Intrinsic;
  the one place proponent bias enters — calibrate from data, §8.)
- `c_AI(P_j, π)` token cost to run `P_j` over π (ledger micro-USD; scales with N).
- `c_res(P_j)` **human residual** — the irreducible judgment/ratification/interruption per use
  (the "rompebolas" factor). The scarce resource. Some practices are high (formal spec: human
  states properties; N-version: human adjudicates), some ~0 (auto-doc).
- `c_setup(P_j)` one-time; **shared** setup (a common harness for hooks/CI/gates) is counted
  once across the practices that share it.
- `h0(P_j)` = `hours_without_ai(task_type)` from `chronicle-ledger.baseline_catalog` — the
  **pre-AI human cost**, used only for the revival filter (§6).
- `prereq(P_j) ⊆ P` practices that must precede it (sentinel enables bounded navigation; a spec
  enables verification).

## 5. Portfolio benefit — covariance-aware (the fix over v0)

Ranking practices independently and summing `B_j = Σ_i a_ji·w_i` **double-counts overlap**.
Instead, model residual risk. For a chosen set `Ω ⊆ P`, the probability `f_i` escapes **all**
practices in Ω (independent-catch model):

```
escape_i(Ω) = Π_{j∈Ω} (1 − a_ji)
Benefit(Ω)  = Σ_i  w_i · ( 1 − Π_{j∈Ω} (1 − a_ji) )
```

`Benefit(Ω)` is **submodular**: a practice that overlaps existing coverage adds little
(diminishing returns) — the covariance is handled structurally, no double-count.

Cost is also non-additive:
```
Cost(Ω) = Σ_{j∈Ω} c_AI(P_j,π)  +  setup(Ω)  +  [human budget constraint]
setup(Ω) counts shared harness once (synergy = negative cost-covariance)
subject to:  Σ_{j∈Ω} c_res(P_j) ≤ H(π)      (scarce human-residual budget; competition = positive cost-covariance)
```

**Objective — the portfolio:**
```
maximize   Benefit(Ω) − ( Σ c_AI + setup(Ω) )
over       Ω ⊆ P,   Σ_{j∈Ω} c_res(P_j) ≤ H(π),   prereq(Ω) satisfied
```
Submodular benefit + a budget/matroid constraint ⇒ **greedy is (1−1/e)-optimal** and cheap:
at each step add the practice with the highest *marginal* benefit-per-residual-hour whose
prerequisites are met, until the human budget H is spent. Output = the ranked portfolio; each
practice's **marginal** `ΔBenefit` is the honest advantage it buys *given the ones already
chosen* (in project cost-hours, decomposed by failure mode).

## 6. The revival filter (what makes it the cheap-rigor thesis, not "always do everything")

`P_j` is a **revival** — a practice worth reviving specifically because the executor is cheap —
iff it was **dead pre-AI** but **live now**:
```
dead pre-AI:  standalone Benefit_j(π)  <  h0(P_j) · rate        (human cost sank it)
live now:     marginal Benefit_j(Ω)    >  c_AI(P_j,π) + c_res(P_j)·rate
```
Practices that pass the second but not the first were *always* worth it (not revivals);
practices that pass neither stay dead. Reporting the three buckets — **revived / always-worth /
still-dead, and why** — is itself the publishable result.

## 7. The PCA / orthogonality diagnostic (JC, 2026-09-20)

The greedy selector already avoids redundancy (submodularity). PCA is the **interpretable
lens** on the same structure, and it prunes the catalog:

- Form the project-weighted coverage matrix `Ã = A · diag(w)^{1/2}` (rows = practices).
- The **Gram/covariance** `Ã Ã^T` has off-diagonal `⟨P_j, P_k⟩` = how much the two practices
  cover the **same weighted failures**. High = redundant *for this project*.
- Its **eigenvalue spectrum** gives the **effective rank** — how many independent coverage
  directions the practice set spans for π. If the top-k eigenvalues hold most of the mass, only
  ~k *complementary* practices matter; the rest are near-collinear and redundant.
- **Near-orthogonal** coverage vectors = complementary practices (each covers a different risk
  direction) — the ones to combine. PCA thus (a) explains a recommendation ("these 3 span your
  risk; #4 is 90% redundant with #1"), and (b) reduces the catalog to a complementary basis
  before the greedy runs.

So: **submodular greedy = the decision; PCA of `ÃÃ^T` = why, and the redundancy/effective-rank
report.** They are two views of the same covariance and must agree.

## 8. Compliance, calibration, validation

- **Anti-patterns (GC-1..GC-10):** fixed published `F` and `P` catalog, no variable denominator
  (GC-1); `λ` from role/graph not folder names (GC-2); undeterminable → `no medido` never FAIL
  (GC-5); everything normalized by surface, and the **marginal Δ / trajectory** is what's
  reported, weighing more than the point snapshot (GC-6).
- **Calibration honesty:** `λ` is objective (detectors). `κ`, `h0` come from the ledger's real
  data. The bias surface is `a` (coverage) and `c_res` (human residual): ship **provisional
  defaults** so the model runs today, but flag them `a-estimar-de-datos`; the rigorous version
  estimates them from outcomes, not by hand (or a reviewer discards them).
- **Validation loop (product ⇄ PhD):** `chronicle-ledger` already measures the outcomes the
  model predicts — Δ-quality, hours saved, ROI, rewrite %, all vs a frozen t0 baseline. So the
  falsifiable test — *does the model's predicted marginal benefit correlate with the measured
  benefit across (practice × project) cells?* — runs on data the product collects at every
  client. The commercial tool is the academic dataset.

## 9. Worked shape (illustrative, not calibrated)

π = a money-touching web backend, small team, moderate churn. Detectors report high
`contradiccion-config` + `esPoliticaComercial` hits and dead-code density; V is high (cheap
HTTP oracle). Then `w` concentrates on {business-rule-drift, config-contradiction,
silent-logic-error}. Greedy first picks **contract/acceptance tests** (covers logic-error +
business-rule at low residual, V high), then **doc-cascade/decision-records** (covers the
audit/business-rule direction — near-orthogonal to tests), then stops when the human budget is
spent; **N-version** never enters (its residual adjudication cost exceeds its marginal benefit
here — reported as *still-dead for this project*). PCA confirms tests and decision-records are
near-orthogonal while a second static-analysis pass is ~redundant with the detectors already
run.

## 10. Status
v1 model, parameters provisional. Next: (a) fix the `F` catalog and each `P_j` profile against
the real detectors + 7-thermometer; (b) pull `κ`, `h0` from a real `chronicle.db`; (c) a first
calibration of `a`/`c_res` from the dogfood outcomes; (d) coordinate with the gobernanza repo
so the Assessment emits this portfolio. Nothing pushed to Gabriel's repo without coordination.
