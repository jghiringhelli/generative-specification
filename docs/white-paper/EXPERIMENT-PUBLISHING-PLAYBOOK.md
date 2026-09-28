# Experiment publishing & validation — step by step

> 2026-09-28. For JC: exactly what to do with each experiment to make it count academically —
> where to pre-publish, how to make it credible, and whether/how to get someone independent to
> validate it. Built on the anti-monoculture plan (`experiments/revival/PREREGISTRATION.md`,
> THREE-PAPER-ROADMAP §anti-monoculture). The honest core: **pre-register before you run, publish a
> turnkey artifact with a DOI, and buy ONE axis of real independence** — that is what converts a
> proponent's demo into evidence.

## The pipeline (per experiment, in order)

**1. Pre-register — BEFORE running.**
- Write the protocol (hypothesis, design, metrics, the null region, the named falsifier, the
  fit/holdout split). You already have the pattern in `experiments/revival/PREREGISTRATION.md`.
- Publish it to **OSF (osf.io)** — free, the standard registry, gives a timestamped, frozen record
  with a DOI. This is the anti-HARKing proof (you committed the design before seeing data).
- Commit the same file in the repo and log its git hash. OSF timestamp + git hash = double proof.

**2. (Optional, stronger) Registered Report.**
- Submit the *protocol* to a venue that accepts **Registered Reports** (ESEM, EMSE, and a growing
  set) for **in-principle acceptance** before you run. If accepted, the paper publishes *whatever the
  result* — null included. This is the single strongest answer to "proponent-authored," because a
  neutral committee vetted the design before any data existed.

**3. Run** the experiment exactly as pre-registered. Deviations are allowed but must be *disclosed*
as deviations (you already do this — the CR "weak-rung" deviation note is the model).

**4. Publish the artifact (turnkey + citable).**
- Package: benchmark + harness + oracle + raw data + the pre-registration + a README with
  **step-by-step replication instructions** (clone, setup, run, expected output).
- **GitHub** for the code (already there); **tag a release** and **archive that release to Zenodo**
  (GitHub↔Zenodo integration) → a **DOI** for the exact artifact version.
- If submitting to a venue with **Artifact Evaluation** (ICSE, FSE, ESEM), apply for the
  **"Artifact Available / Evaluated / Reusable"** badge. A badge is third-party confirmation the
  artifact runs — cheap credibility.

**5. Pre-publish the paper.**
- **arXiv (cs.SE)** for the preprint (citable immediately, establishes priority).
- Then submit to the target venue (empirical SE / IEEE / the RR track from step 2).

## Independent validation — do you need it, who, and how

**Yes — one axis of *real* independence is what the blind reviews demanded.** Not all "validation"
counts:

**What does NOT count as independent** (a reviewer prices these at zero):
- Graded capstone students you supervise · commercial partners (Gabriel/BYU) with a stake · the
  in-house LLM "stateless judge" running your own harness. These are your own incentive orbit.

**What DOES count, and how to get it:**
1. **A disinterested party runs the scoring/replication of the flagship claim.** Recruit: another
   researcher (a co-author outside the project — e.g. the biologist collaborator for cross-discipline
   eyes; or a contact met through the advice-conversations), or pay a neutral contractor to run the
   turnkey artifact. One genuine independent run of the headline result is worth more than ten
   supervised ones.
2. **Call for replication** on the published artifact (the benchmark-as-artifact strategy). Realistic
   expectation: a handful of downloads and a few "artifact available" citations; genuine adversarial
   re-runs are rare for a non-famous method. So treat the call as *upside*, not the plan — the
   independence in #1 is the plan.
3. **The human-rater study (DX2) — you must organize this one yourself, and it cannot be
   outsourced or automated away.** To count: **blinded** raters, **independently recruited** (not
   your students), a **pre-registered rubric**, and a **disinterested adjudicator** for disagreements.
   This is the arm that breaks the "no human raters" critique for the rubric.

**The honest boundary:** the base paper's experiments are already run and can ship with a full
replication package now; independence for them is the *call-for-replication + one disinterested
re-run of the flagship (AX or KX)*. The owed experiments (D1 gating, D2 revival) get the full
pipeline above, pre-registered from the start.

## Where each thing lives (quick reference)
| Thing | Where | Gives you |
|---|---|---|
| Pre-registration | **OSF** (+ git hash) | timestamped frozen design (anti-HARKing) |
| Design review before running | **Registered Report** venue (ESEM/EMSE) | in-principle acceptance; null publishes |
| Code + harness | **GitHub** (tagged release) | the runnable artifact |
| Citable artifact version | **Zenodo** (from the GitHub release) | a DOI for the exact data+code |
| Preprint / paper | **arXiv (cs.SE)** → venue | priority + peer review |
| Badge | venue **Artifact Evaluation** | third-party "it runs" |

## The order to actually do it (this quarter)
1. Base experiments (AX/KX/EX/RX/TX/SX/ALX/BX): assemble the **replication package + Zenodo DOI**,
   issue a **call for replication**, and line up **one disinterested re-run of AX or KX**. (They are
   already run; this is packaging, not new work.)
2. Register the **Compendium** on Zenodo/arXiv as the citable master (the hub genspec.dev links to).
3. D2 revival: it is already pre-registered — run it, publish the artifact, call for replication.
4. D1 gating + the base-strengthening new experiments (2nd benchmark, capability ladder, DX2
   human-rater): pre-register each on OSF *before* running.
