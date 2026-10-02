# Experiment protocol (the cycle)

Version 1.0, 2026-10-02. Applies to every new experiment in this repository. Repository root of this worktree: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol` (branch `experiment-protocol-2026-10-02`); the canonical location after merge is `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\EXPERIMENT-PROTOCOL.md`.

Companion files: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\LOGBOOK\README.md` (index of all experiments, past and new), `...\LOGBOOK\ENTRY-TEMPLATE.md`, `...\BACKLOG.md`, `...\prereg\` (registrable designs).

## 0. The point of this protocol

The goal is to find out whether the research findings are valuable, not to make them look valuable. Two failure modes are equally forbidden:

- Forcing the truth: choosing metrics, benchmarks, judges, or hypotheses after seeing which ones favor the method.
- Giving up in advance: abandoning a hypothesis because one experiment failed, when the experiment itself may have been the wrong one.

An experiment can fail in two different ways. The hypothesis can be wrong (result: refuted or null), or the experiment can be unable to answer the question (result: invalid design). The protocol exists to tell these apart before anyone interprets anything. "We ran the wrong experiment" is a valid, loggable, first-class result. So is "the hypothesis was replaced by a better one, for this reason".

Not every experiment must appear in the paper, the site, or the course. The complete record lives in the LOGBOOK. Other documents cite a LOGBOOK entry id and carry only what that entry's evidence tier supports.

## 1. Vocabulary

Lifecycle states of an entry (one value at a time, history kept in the entry):

`PROPOSED` -> `DESIGN-REVIEWED` -> `PILOTED` -> `REGISTERED` (frozen) -> `RUNNING` -> `ANALYSED` -> `CLOSED`. Side states: `ABANDONED` (with reason), `SUPERSEDED-BY <id>`.

Outcome of a closed experiment (exactly one, assigned by the pre-registered decision table, section 6):

| Outcome | Meaning | Precondition |
|---|---|---|
| `SUPPORTED` | Pre-registered prediction held and the experiment demonstrably could have shown otherwise | Controls passed (guard a) |
| `REFUTED` | Pre-registered falsifier fired | Controls passed |
| `NULL` | No effect larger than the smallest effect of interest, with enough sensitivity to see one | Positive control detected a known effect at the planned n |
| `INCONCLUSIVE` | Data neither support nor exclude the effect (interval spans both the SESOI and zero) | none |
| `INVALID-DESIGN` | The experiment could not have answered the question (floor/ceiling, construct mismatch, oracle fault, leaked treatment, harness failure, contaminated benchmark) | Evidence of the specific validity defect |

Experiments that test no hypothesis (feasibility demonstrations, field observations, calibration runs) are logged with outcome `DEMONSTRATION`. They carry no verdict and may only be cited as demonstrations.

Evidence tiers for how other documents may use an entry: **A** registered at an external registry or deposit before data, deviations log kept, independent judge, controls passed; **B** registered in-repo before data (annotated tag pushed; no external timestamp); **C** design text committed before the data in repository history, or written without registration; commit dates are author-controlled, so this is author-attested; **D** demonstration or observation, no inferential claim. Past experiments are back-filled into these tiers in the LOGBOOK; a tier can never be raised after the fact. Only tier A or B may be called "pre-registered" in a public document.

## 2. The cycle

Each stage has a gate. An experiment cannot enter the next stage with an open gate item. The entry (from ENTRY-TEMPLATE.md) is created at stage 1 and appended to, never rewritten.

### Stage 1. Hypothesis

- State a hypothesis that can fail: a directional claim, the metric, and the numeric region that would count against it (the falsifier, guard e). If you cannot state what result would make you drop it, it is not yet a hypothesis; write it as a design question instead.
- State the claim the research would be allowed to make if it is supported, and the claim it must stop making if it is refuted. This is the "if this result then this conclusion" table (section 6). Fill it now, while no data exist.
- Name the field-experience intuition behind it, if any, and write it in falsifiable form (guard f).

### Stage 2. Construct-validity check

Before designing runs, answer in writing (Ralph and Tempero 2018 is the source for treating this as a first-class step):

1. What construct do we intend to measure? What number stands for it?
2. Does the treatment directly target the metric (circular)? If yes, the metric is "mechanism evidence" only and a metric the treatment does not target must be primary (guard b).
3. Could a trivial or degenerate output get a good score? Could a good output get a bad one (oracle strictness, convention mismatch)?
4. Is the benchmark in training data (guard c)? Is there a way to check?
5. Who or what scores, and does it share vendor, model, prompt authorship, or incentive with the generator (guard d)?
6. For human subjects: does the intervention given to participants equal the thing the hypothesis is about? Is the thing being tested the method, or the tooling and onboarding around it?

### Stage 3. Design review (adversarial, stateless)

Run at least two critics that see only the design file and this protocol, with no conversation context. At least one critic should be a different vendor from the generator model when feasible. Ask them for: construct-validity holes, ways the treatment arm is favored by construction, ways the comparison arm is handicapped, oracle problems, power problems, and better hypotheses. Record every finding in the entry with accepted, rejected-with-reason, or deferred. Rejection reasons are part of the record. (Design review in the sense of Wohlin et al. 2012, chapter on planning, plus the Registered Report stage-1 idea that peers vet the protocol before data exist.)

### Stage 4. Pilot (harness validity only)

A pilot checks that the harness runs, the oracle discriminates, floor and ceiling are not hit, variance is plausible, and cost is within 3x of the estimate. A pilot never tests the hypothesis and its data are excluded from the main analysis. Pilot outcomes may change the harness and the oracle (disclosed), and the arm artifacts within a pre-declared revision budget. No change may be chosen because of which arm it favors.

### Stage 5. Preregistration, frozen

Contents, all committed together: hypotheses with falsifiers, arms, exact prompts and artifacts (hashed), models and versions, benchmark and its provenance, metric definitions and computation scripts, primary vs secondary vs exploratory labels, sample size and stopping rule, analysis plan, SESOI, controls, decision table, judge protocol, exclusion rules, and the deviations-log file (empty). See section 4 for how to freeze.

### Stage 6. Run

Execute exactly as registered. Order of runs randomised in blocks. Raw outputs stored untouched. Any harness failure, exclusion, or surprise goes to the deviations log the day it happens, with the registered rule it falls under (or "no rule: deviation").

### Stage 7. Analysis as registered

Run the registered scripts on the registered data. Anything not in the plan is labelled **exploratory** and cannot carry a verdict. Deviations from the plan are listed in the result entry with the effect each could have had on the verdict.

### Stage 8. Result entry

Written in the template, same voice and same sections whatever the outcome (guard i). It states the outcome label from section 1, the controls' result, the decision-table row that applies, the deviations, the power note and the limits. Then the intuition-vs-result rule (guard f) is applied if the result contradicts field experience.

### Stage 9. Refinement as a new linked experiment

Never edit a closed or registered entry. If the result suggests a better design or hypothesis, open a new entry with `refines: <id>`, state what changed and why (section 5), and register it before running it. The old entry gets a forward link appended.

## 3. The "just point" guards

These are checklist items in the template; each has a pass/fail line in the entry.

**(a) Controls and floor/ceiling checks.** An experiment must show it can detect a known effect before its null is believed.
- Positive control: an arm or a planted manipulation with a known large effect on the metric (for example a deliberately degraded arm, or injected defects at a known rate). If the experiment cannot detect it at the planned n, any null is `INVALID-DESIGN`, not `NULL`.
- Negative control: an A/A comparison (two identical arms) or a placebo arm of the same length with irrelevant content. It estimates run-to-run noise and the false-positive rate.
- Floor and ceiling: the weakest arm must not be at the ceiling and the strongest must not be at the floor on the primary metric. A prior program example: when naive and expert arms both score near the top of the scale, a difference between expert and treatment cannot appear; that is a ceiling, not an equivalence.

**(b) Metrics not targeted by the treatment.** The primary metric must not be the thing the treatment instructs. If the treatment says "no data-client calls in route files", a count of such calls is mechanism evidence, not a quality outcome. Primary candidates: hidden behavioural pass rate on a sealed oracle, regression flips across changes, change-failure rate, cost per accepted change, mutation score with a fixed scope. Targeted metrics are reported, labelled "targeted", and never carry a verdict alone.

**(c) Non-memorized benchmark.** Use a task with no public reference implementation (an invented domain), plus a canary probe run cold per model to estimate recall (SX/CR-style). Public benchmarks are allowed as a second leg only. Log the canary result in the entry. Contamination is a documented threat to benchmark evaluation (Sainz et al. 2023).

**(d) Independent stateless judges.** Anything that needs judgment is scored by a fresh agent that sees only the artifact, never the arm label where blinding is possible, never the hypothesis, and never the generator's conversation. Judge vendor differs from generator vendor. Use two judges from two vendors for primary judged metrics, report agreement, and add a human spot-check of a registered fraction. Reason: LLM evaluators have been shown to prefer their own generations (Panickssery et al. 2024), so a judge from the generator's family is a bias source, not a neutral instrument. Judge agreement between two runs of the same prompt is consistency, not independence; do not describe it as independent.
Wherever a deterministic probe or script can decide, no judge is used.

**(e) Falsifiers stated in advance.** Each hypothesis carries a numeric falsifier and a decision table row for every outcome class. The falsifier is stated in the same file as the hypothesis, before data.

**(f) Intuition versus result.** When a registered result contradicts field experience, the first action is not to explain it away and not to accept it. Do two audits and log both outcomes:
1. Validity audit of the experiment: re-run the stage-2 construct questions, the controls, the oracle, the harness logs, and the arm artifacts. Is there a defect that makes the result an artifact? If yes the outcome is `INVALID-DESIGN` with the named defect, and a refined experiment is opened.
2. Falsifiability audit of the intuition: was the intuition ever stated in a form that a result could contradict? "The expert prompt is GS-lite" and "structure helps" can be defined so that nothing refutes them. State the version of the intuition that would have been contradicted, and whether this result contradicts that version.
Possible joint verdicts: experiment faulty and intuition intact; experiment sound and intuition wrong or too vague (revise the claim); both sound and the intuition describes a regime the experiment did not cover (state the regime and design for it). The audit does not change the label until a defect is demonstrated; "I do not believe it" is not a defect.

**(g) Stopping rules.** Fixed N declared before the run; no optional stopping and no extra runs after seeing outcome data. Allowed: one pre-declared interim look for validity only (harness failure rate, floor/ceiling, cost), never for outcome. Chain or run level collapse rules are written in the registration. Budget overrun is handled by amending before freeze, never by silently dropping arms.

**(h) Power note and honest limits.** Every registration includes: unit of analysis, smallest effect of interest with its justification, the effect size detectable at about 80% power and the exact test used, what the design cannot detect, and the generalisation boundary (benchmark, models, dates, horizon). Small-n facts to keep in view: with a two-sided exact Mann-Whitney test and 5 vs 5 observations the smallest attainable p is 2/252 = 0.0079, so a Holm correction over more than 6 comparisons makes alpha 0.05 unreachable. Equivalence claims ("A is as good as B") need an equivalence test against the SESOI (Lakens 2017), not a non-significant difference. Results are given as effect size with an interval, not only a p-value.

**(i) Uniform reporting.** Positive, null, refuted, inconclusive and invalid results use the same template, the same headings, the same tone, and the same prominence in the logbook index. No result is described with softer or harder words because of what it means for the thesis. Raw runs are published for all outcomes. If a paper cites an entry, it cites the outcome label verbatim.

## 4. Freezing a registration

Freeze order, all before the first main-run session starts:

1. Complete the registration files (stage 5) and commit.
2. Create an annotated tag `prereg/<ID>-v<N>` on that commit and push the branch and the tag to the public remote.
3. Obtain an external timestamp (below) that cites the tag, the commit hash, and the SHA-256 of a zip of the registration files.
4. Record the tag, commit, external DOI/URL and date in the entry and the logbook index.
5. Run the data-free dry check: a script that verifies the registered hashes (prompts, scaffold, oracle, scripts) against the working tree before every run batch.

What each piece does and does not prove (verified from primary documentation, 2026-10-02):

| Mechanism | What it gives | What it does not give |
|---|---|---|
| Git commit and annotated tag, pushed | A content-addressed record of the design, visible in public history | The date inside a tag or commit is author-controlled: setting `GIT_COMMITTER_DATE` produced an annotated tag stamped 2020-01-01 in a test run on this machine. Force-pushes can rewrite public history. The remote's push time is the host's claim, not an independent one. A tag alone is therefore tier B at best |
| OSF Registries (osf.io/registries) | A registration made from an OSF project using a template, with a timestamp. OSF help states: once submitted the registration and its files cannot be edited or changed; public registrations automatically get a DOI; a registration can be embargoed for up to four years (the DOI is assigned when it becomes public); a registration can be withdrawn but not reinstated, and a withdrawn registration keeps basic metadata and the justification while the content is removed. COS-affiliated and university guides describe OSF as free; no fee page was found | It records that the plan existed; it does not check the plan is good. Embargoed registrations hide content, so for an external reader the proof arrives only when the embargo ends or when you disclose it; do not embargo past the first paper submission |
| Zenodo (zenodo.org) deposit, optionally from a GitHub release | Free upload with a DOI; per-record limit of 50 GB and 100 files (one-time 100 GB quota can be requested); GitHub integration archives a tagged release automatically; each deposit has a version DOI and a concept DOI covering all versions; after publication files change only by publishing a new version | It is a repository, not a registry: no template and no review. As a timestamp it is fine, because the record shows its publication date and a new version leaves the old one intact |
| Registered Report (MSR, ESEM and EMSE registered-reports tracks) | Stage 1 peer review of the protocol before data; an in-principle acceptance means the result is publishable whether or not the hypothesis holds, provided the protocol is followed or deviations are justified | Calendar time (a stage-1 submission window must be met) and a venue fit. Use it for flagship experiments, not for every run |

Practical rule: every experiment gets the git tag. Every experiment whose result may leave this repository (paper, site, offer) additionally gets an OSF registration or a Zenodo deposit before data. Flagship experiments are also considered for a Registered Report. Never describe a design as "pre-registered" in any public document unless tag and external timestamp both exist and predate data; otherwise use "author-attested", "pre-specified in intent", or "design written before runs, not frozen".

## 5. Amendments and refinement

- Before any outcome data: the registration may be amended; each amendment is a new tagged version `prereg/<ID>-v<N+1>` with a changelog entry (what, why). Old versions stay.
- After any outcome data: the registration is closed to change. Allowed responses: (1) declare a deviation (it happened; disclose); (2) open a new linked experiment (`refines:`) with a revised design or revised hypothesis, registered before its own data.
- Hypothesis revision is allowed and encouraged when the evidence says the original was a poor question. Log it as a new entry that states the old hypothesis, the evidence that prompted the change, why the new one is better, and what the new one would refute. A revised hypothesis is never presented as the original.
- Never rewrite past entries. Corrections are appended, dated, signed, and linked. A typo fix is allowed only as a visible correction note.
- Pilot data cannot be reused as main data. Exploratory findings from a main run are hypotheses for a new experiment, not results.
- A refuted or invalid result is not erased when a later run "fixes" it. The index shows the chain.

## 6. Decision table (mandatory in every registration)

A table with one row per plausible outcome, giving the permitted conclusion, the required follow-up, and the forbidden conclusion. It must include these rows at minimum:

| Observed | Permitted conclusion | Forbidden conclusion |
|---|---|---|
| Positive control not detected, or floor/ceiling hit | `INVALID-DESIGN`: this experiment could not have answered; redesign | Anything about the hypothesis, in either direction |
| Controls pass, effect >= SESOI, interval excludes zero | `SUPPORTED` at the stated scope | Generalisation beyond the registered benchmark, models, horizon |
| Controls pass, interval entirely below SESOI, equivalence test passes | `NULL` (equivalence) | "The method does not work" (only: no effect of this size here) |
| Controls pass, interval spans zero and SESOI | `INCONCLUSIVE`, state the n that would resolve it | Either direction |
| Falsifier fires | `REFUTED` for this version of the hypothesis; run the guard-f audits | Reinterpreting the metric to rescue it |
| Result contradicts field experience | Guard-f audits, both logged, before anything else | Dismissal of the result, or dismissal of the experience, without the audits |
| The experiment turns out to be the wrong experiment (construct mismatch found after the fact) | `INVALID-DESIGN` with the named defect and a linked redesign | Counting it as support or as refutation |

## 7. Where results go

- Every closed experiment gets a LOGBOOK entry. Nothing else is required.
- A paper, the site, or a course may cite an entry. It then states the outcome label and tier verbatim and may not strengthen either.
- Experiments that do not serve the current thesis stay in the logbook; that is not suppression, because the index lists all entries with their outcomes.
- Public documents never mention private studies. Human-subject studies done in a context with confidentiality constraints stay in the private repository (soma); only design principles derived from them appear here, without identifying details.

## 8. Sources

Verified to exist in this session (2026-10-02) by retrieving a primary or bibliographic page; details not verified are named.

- Kitchenham, Pfleeger, Pickard, Jones, Hoaglin, El Emam, Rosenberg. "Preliminary guidelines for empirical research in software engineering." IEEE Transactions on Software Engineering 28(8):721-734, 2002.
- Wohlin, Runeson, Host, Ohlsson, Regnell, Wesslen. "Experimentation in Software Engineering." Springer, 2012 (ISBN 978-3-642-29044-2). Used for planning, threats-to-validity vocabulary (construct, internal, external, conclusion).
- Ralph, bin Ali, Baltes, et al. "Empirical Standards for Software Engineering Research." arXiv:2010.03525 (ACM SIGSOFT Paper and Peer Review Quality Initiative); the standards live at the ACM SIGSOFT Empirical Standards repository.
- Ralph, Tempero. "Construct Validity in Software Engineering Research and Software Metrics." EASE 2018, DOI 10.1145/3210459.3210461.
- Chambers. "Registered Reports: A new publishing initiative at Cortex." Cortex 49(3):609-610, 2013, DOI 10.1016/j.cortex.2012.12.016.
- Chambers, Tzavella. "The past, present and future of Registered Reports." Nature Human Behaviour 6:29-42, 2022, DOI 10.1038/s41562-021-01193-7.
- Registered Reports tracks: MSR (with EMSE) and ESEM (with EMSE) describe a two-stage process with in-principle acceptance; see the track pages on conf.researchr.org and https://emsejournal.github.io/registered_reports/. A paper "Registered reports in software engineering" exists at Empirical Software Engineering, DOI 10.1007/s10664-022-10277-5; its authors and volume were not confirmed in this pass (publisher page blocked), so it is not cited by author here.
- Nosek, Ebersole, DeHaven, Mellor. "The preregistration revolution." PNAS 115(11):2600-2606, 2018.
- Simmons, Nelson, Simonsohn. "False-positive psychology: undisclosed flexibility in data collection and analysis allows presenting anything as significant." Psychological Science 22:1359-1366, 2011.
- Kerr. "HARKing: Hypothesizing after the results are known." Personality and Social Psychology Review 2(3):196-217, 1998.
- Lakens. "Equivalence tests: a practical primer for t tests, correlations, and meta-analyses." Social Psychological and Personality Science, 2017, DOI 10.1177/1948550617697177.
- Panickssery, Bowman, Feng. "LLM Evaluators Recognize and Favor Their Own Generations." arXiv:2404.13076, 2024.
- Sainz, Campos, Garcia-Ferrero, Etxaniz, de Lacalle, Agirre. "NLP Evaluation in trouble: On the Need to Measure LLM Data Contamination for each Benchmark." Findings of EMNLP 2023, pp. 10776-10787.
- OSF help, "Welcome to Registrations": https://help.osf.io/article/330-welcome-to-registrations. Zenodo help and policies: https://help.zenodo.org/ and https://about.zenodo.org/policies/ (limits quoted from a secondary summary of those policies; re-check the current limits page before relying on a size).

Not cited because not verified: Holm 1979, Tulving, any claim about an OSF fee schedule, ESEM/MSR submission dates for 2027.
