# Raw output of stateless critic 2 (claude -p, model opus, no tools, saw only the protocol and the 2026-10-01 SDX design draft)

Unedited. Focus prompt: YOUR FOCUS (critic 2, measurement, oracle, judges and statistics): (a) oracle problems: tolerance, holdout, fairness acr...

# SDX design review: measurement, oracle, judges, statistics (critic 2)

Overall: the primary contrast is sound in intent. The current instrument, though, cannot reach `NULL` and probably not `REFUTED`. Several secondary measures also favor A4 by construction.

## Critical

**C1. No positive or negative control; the ceiling check sits on the wrong arm (§10, §13; protocol guard a).**
- A0 is an anchor, not a known effect.
- The floor/ceiling rule tests only whether A0 reaches 95% or more. The AX2 failure was A1 and treatment both near the top, and nothing here checks A1 or A4 for ceiling.
- Without a planted effect, any A4≈A1 result cannot become `NULL`; it can only be `INVALID-DESIGN`.

*Fix:*
- Positive control: an A4-sabotaged arm (substrate states the wrong rest rule, or the ratchet is disabled with corrupted fixtures), with an expected E1 drop of 20 pp or more. It must be detected at the planned n.
- Negative control: A1 vs A1′, two identical arms with different seeds, to give the false-positive rate and noise.
- Ceiling rule: stop if A1 or A4 is at 90% or more of E1 at CR12.

**C2. Power is claimed in Cliff's delta, but SESOI and falsifiers are in percentage points (§9).**
- n = 15 per arm detects δ≈0.6 (d≈1.2). Whether 8 pp is reachable depends on the between-chain SD of E1, which is unknown.
- At SD = 15 pp, 8 pp is d≈0.53, and power is about 30%.
- The falsifier "upper CI bound below SESOI" needs a narrow interval, so the likely outcome is `INCONCLUSIVE` everywhere.
- Collapsed chains scored zero (ITT) make E1 bimodal and widen the intervals further.

*Fix:*
- Use the pilot to estimate the SD of E1 and the collapse rate.
- Compute n for 8 pp with a TOST equivalence test (Lakens), as the protocol requires for `NULL`.
- Fund that n by cutting arms (see E2 below).
- Report collapse rate as a separate prespecified outcome, with an ITT-vs-completers sensitivity analysis.

**C3. Too many contrasts for the data (§1, §6, §9, §10).**
- There are 8 arms, 5 hypotheses, 9 predictions with thresholds that differ from the falsifiers (P1 says 10 pp, SESOI is 8 pp), and Holm within families only. The H1 family E1–E4 is partly redundant (E2 contains E4's flips).
- Claim S is a conjunction (H1 ∧ H5). Each conjunct is underpowered, so S is nearly unattainable even if true. A failed S will then be read as "underpowered", which is the protocol's "giving up in advance" failure in reverse.
- The H1 OR-clause ("A1 not worse in 2 of 3 vendors") rests on n = 5 point estimates. That is close to a coin flip.

*Fix:*
- Register exactly one primary contrast: A4 − A1 on E1 at CR12, stratified permutation test plus TOST.
- Make A4 − A3 the single key secondary, via a gatekeeping order (test it only if the primary passes).
- Treat everything else as secondary or exploratory, and drop numeric P-thresholds that are not falsifiers.
- Replace the vendor sign clause with a registered heterogeneity test, descriptive only.

**C4. H4 reconstruction and the injected-defect classes measure the treatment (§8, guard b).**
- "What was decided and why" credits written rationale, which is exactly what ADRs and the fixes ledger are instructed to produce.
- Three of the five defect classes ("renumbered criterion with stale derived test", "unclaimed public route", "stale doc claim") are relative to artifacts only A4/A5 have, and mirror sensors S1–S5.
- The scoring is incoherent. If an honest "not recorded" counts as correct, A1 can reach high calibration. If it doesn't, the measure is circular.
- The "second judge verifies rationale is present" checks presence, not truth.

*Fix:*
- Label reconstruction "targeted".
- Primary H4: query (ii) only, with defects defined against the common intent source (base spec plus CR list) and injected as behaviour-level code changes by a script. Same script and same sites for every arm, with injection blind to arm where feasible.
- Ground truth for D1/D2 rationale comes from the executor transcripts, not the arm's docs.
- Score accuracy and fabrication as separate outcomes.

## Major

**M1. The acceptance rule is asymmetric (§4).**
- "Builds and own `npm test` passes" means an arm with weak or deleted tests always accepts, while A4's red-first, ratchet and hooks generate extra failed attempts inside identical turn and token caps.
- E2 (computed on accepted states) and the collapse rule are therefore driven by test-suite strictness, not quality.

*Fix:*
- Define attempt boundaries precisely; specify whether hook rejections consume attempts.
- Log test deletions in all arms, not just as A4 "circumvention".
- Report E2 conditional on the hidden oracle, independent of own-test acceptance.

**M2. The oracle can be gamed, and cumulative scoring breaks at CR7 and CR11 (§4, §6).**
- Status-class tolerance lets a server that rejects everything pass all 4xx probes.
- CR7 rewrites the rest rule and CR11 retires CR4. Unless the probe set is versioned, intended changes count as E4 regression flips.
- The "30% holdout never mentioned to any arm" is undefined, since no probe is shown to any arm. If holdouts test manifest constraints absent from R_k, A0 and A2 (no manifest) lose on content rather than durability.

*Fix:*
- Balance 2xx and 4xx probes per rule, and require paired probes (must accept X, must reject Y).
- Version probes per CR, and list which probes are retired or inverted at CR7 and CR11.
- Derive every probe from the base spec plus R_1..k only.
- Validate the oracle in the pilot: a reference implementation scores about 100%, degenerate stubs (always 200, always 400) score low, and hand mutants are detected.

**M3. E5 is listed as treatment-neutral but is targeted (§6).** Mutation score with the arm's own tests rewards the instructed tests-first and red-first. *Fix:* keep only the hidden-suite kill rate as neutral, and label own-test mutation score "targeted".

**M4. The H3 comparison is content removal, not handoff (§1 H3, §7).**
- The falsifier compares A4 with A1-no-prompt. A4 keeps its content in the repo while A1 loses all of it, so the result is decided by construction.
- Handoff vendor ≠ executor vendor also confounds vendor ability with arm unless the pairings are balanced.
- Three CRs at n = 5 per cell cannot resolve an 8 pp effect.

*Fix:*
- Primary H3 contrast: A1-with-prompt vs A4 handoff drop.
- Use a Latin-square vendor assignment.
- Report H3 as descriptive unless the pilot variance shows it is powered.

**M5. Judge vendor is confounded with executor vendor (§5, §8).**
- With 3 vendors and "judges ≠ executor", each executor vendor gets a different judge pair, so judge bias is aliased with stratum.
- Blinding fails visibly for A4.

*Fix:*
- Use fixed judges from a fourth vendor or model family for all chains, plus the two-vendor check.
- Ask judges to guess the arm, and report guess accuracy.
- Prefer probe-scored items; drop judged items wherever a probe exists.

**M6. Treatment instance is n = 1 (§2, §3).** There is one P_expert and one substrate, so the contrast is these two artifacts, not two regimes, and artifact variance is unestimable. *Fix:* use two independently authored P_experts (one external, as §2 already suggests), or state plainly that inference covers these artifacts only.

**M7. The interim look at k = 3 is effectively unblinded outcome data (§11).** Floor and ceiling checks read E1 per arm. *Fix:* a script, run by someone other than JC, reports only pass/fail flags (ceiling on any arm, harness failure rate, cost), never arm-level E1.

## Minor

- **Weak validity criterion:** the van Elteren test with strata of 5 has few attainable p-values. Use a stratified permutation test with prespecified bootstrap CIs.
- **Unpowered H2:** the interaction contrast at n = 15 needs effects about 2× as large to detect. Cut it (see E2).
- **Ambiguous falsifier:** "on E1 and E2" in the H1 falsifier does not say whether both or either must hold.

## What to keep and cut (point e)

### E1. SDX-0 pilot (worth running)

**Keep:**
- One vendor; arms A0, A1, A1′ (A/A copy), A4, and A4-sabotaged.
- k = 3; the full 12-CR horizon (CR11 must be exercised).
- Oracle validation against the reference implementation, stubs and mutants.

**Outputs:**
- Between-chain SD of E1, collapse rate, ceiling status of A1 and A4, attempt and turn usage per arm, cost.
- A registered n computed from these.

**Change the pass criterion:**
- Replace "A0 below A4 on at least one metric" with "oracle discriminates reference from degenerate, and A1 and A4 are both below ceiling". The current wording peeks at the hypothesis and allows forking across metrics.

**Cut from the pilot:** the handoff branches and the audits at k = 2. Instead, check the judge harness on two repos.

### E2. SDX-1 (executable and interpretable)

**Arms:** A0, A1, A3, A4, A4-sabotaged (positive control), A1′ (negative control). Move A5 to secondary and drop A2, A4n and A4e (H2 becomes its own experiment).

**Sample size:** k = pilot-derived n, likely 8–10 per cell.

**Hypotheses and metrics:**
- One primary contrast, A4 − A3 as gatekept secondary.
- H3 and H4 kept as secondary or descriptive.
- Frontier-tier run deferred.

This roughly holds the session budget while doubling n on the contrast that matters.
