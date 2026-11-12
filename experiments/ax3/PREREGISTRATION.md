# AX3: model capability and the external checks (pre-registration)

> Status: **design, not run.** Drafted 2026-11-10. This file is committed, and its commit hash logged, before any generation. A human ratifies it before the first run. Nothing here is a result.

## Why this experiment

GS puts structure and checks outside the model: a navigation file, specifications, and gates that refuse a bad change. As models improve, some of what these external parts did may be done inside the model. AX2 asked the capacity question (RQ3: does the gap between structured and unstructured work widen as capability falls) but its weak-model tier did not complete, so no number exists. AX3 asks it again on one family of models, with one added measure: whether the model touches the checks that constrain it.

## Relation to earlier work

- **CR** (`experiments/cr/RESULTS-final.md`, 2026-09-19, commit `3bc9db9`) already asked the capacity question across vendors and one local weak model. Result: partially supported, and only on structural cleanliness. Duplication favoured GS by 14.5 points on the weak model and fell to about zero at the frontier. Layer violations showed no signal (0 everywhere) and the behavioural oracle showed none either. n = 3, one weak model.
- **CTX-1** (draft preregistration, not frozen, commit `06729dd` on branch `ctx-1-draft-2026-10-13`) asks whether the value of a context file is the text or the mandatory verification enforced from outside the model, and includes a capacity prediction (P7).
- AX3 does not repeat either. It adds what they do not cover: one family of models in three tiers plus one older generation, and a count of how often the model changes the files that define its checks. If CTX-1 is frozen first, the enforcement arm (C4) of AX3 may be dropped or merged into it, and the change is logged.

## Questions and predictions (written before any run)

- **RQ1, capacity.** Does the gap between unstructured work (C1) and full GS (C3) shrink as model capability rises, on duplication and cyclomatic complexity (where CR found signal)? Layer violations are also reported, as the AX and AX2 instrument. CR found no signal there on newer models, so a flat layer-violation result is possible and is registered as a result, not as a failed run.
  - **Prediction H1:** yes. The gap on duplication and on cyclomatic complexity is largest on the small tier and smallest on the large tier.
  - **Falsified if:** the gap on both is the same or larger on the large tier than on the small tier.
- **RQ2, absorption.** On the large tier, does unstructured work approach the GS result, meaning the model has absorbed what the external structure did?
  - **Prediction H2:** the C1 median approaches the C3 median on the large tier. The expert prompt (C2) already tied GS on the median in AX and AX2, so this is expected to hold for C2 first.
  - **Falsified if:** C1 on the large tier still has a median of layer violations at least as high as C1 on the small tier.
- **RQ3, bypass (exploratory, no direction predicted).** When the gates are enforced in the loop (C4), how often does the model change the files that define the checks, per tier? This is reported as a count and a rate, whatever it shows.

## Design

- **Task:** the RealWorld/Conduit backend, with the same held-out Hurl oracle as AX, AX2 and MX. A build that fails the oracle is reported as failed and is not scored for quality.
- **Models (the capability axis):** one family, three tiers of the current generation (small, mid, large), plus one older mid-tier model (the one AX ran on) as a generation row. Tier and generation are not the same variable, and results are reported per row. The exact model identifiers are frozen in a one-line commit before the first run, after checking that each is available. A model that is unavailable at that point is dropped and the drop is logged, not replaced.
- **Conditions per model:** C1 naive prompt; C2 expert prompt (control); C3 full GS (navigation file, specifications, gate library); C4 = C3 with gates enforced in the loop: the run is rejected when a gate fails, the model gets the failure and up to three rework rounds, and the files that define the gates are hash-checked after each round.
- **Prompts:** C1, C2 and C3 are the frozen AX2 prompts in `experiments/ax2/prompts/`, unchanged. The C2 prompt was written by someone other than the person who designed the experiment, and no condition is tuned after seeing results. C4 uses the C3 prompts plus the gate runner.
- **n:** 5 independent fresh sessions per cell. 4 models x 4 conditions x 5 = 80 builds. n is fixed. No run is added or dropped after seeing results.
- **Runner:** the same command-line agent runner for every cell, per `experiments/ax2/RUNNER-SPEC.md`, so the only thing that changes between cells is the model and the condition.

## Measures

All are computed by tools, not by a model judge, so scoring is blind.

1. **Primary:** duplication percentage and mean cyclomatic complexity (the axes where CR found signal), and layer violations (same instrument as AX and AX2).
2. **Gate:** oracle pass rate. Quality is only scored on builds that pass.
3. **Secondary:** the seven-property audit score; tokens per accepted build (as context, never as a percentage saving).
4. **Bypass (C4 only):** the number of rounds in which a file that defines a check changed (hash mismatch), and the number of builds with at least one such change. Files in scope: gate configuration, test configuration, the CI definition, and the gate runner itself. A change made by the task's own scaffolding is excluded and listed.

## Analysis

- Median and range per cell. Cliff's delta with a confidence interval for the C1-to-C3 gap per model, on each primary measure. With n = 5 the intervals will be wide, and that is reported as is.
- RQ1 is read from the ordering of the gap across tiers and from the sign of the slope of the gap on tier. It is not read from a p-value.
- Null and reversed results are reported in the same place and with the same weight as confirming ones.

## Limits, stated now

One author, one benchmark, one family of models, five runs per cell. Tier and generation are mixed in the older-model row. Results describe these models on this task and say nothing about other tasks or other labs. This is exploratory work and carries the status "pilot" if it runs. The bypass count measures changes to check files, not intent, and says nothing about why the model changed them.

## Replication

Other people can run the generation step with whichever models they can access, using `REPLICATION-KIT.md` in this folder. Their cells are reported separately, labelled by who ran them and with which exact model, and are called "independent" only if the person has no business or personal tie to the author. The kit does not state the predictions.

## Pre-registration checklist

- [ ] This file ratified by a human, committed, and its hash logged before any generation.
- [ ] Model list frozen in a separate one-line commit after an availability check.
- [ ] A critic from another vendor has read this file and the objections are logged.
- [ ] Oracle, prompts and gate runner hash-pinned.
- [ ] n and the stopping rule fixed (no adding runs after looking).
- [ ] Results go to `RESULTS.md` in this folder, with the claim status labelled, and only then to the site.
