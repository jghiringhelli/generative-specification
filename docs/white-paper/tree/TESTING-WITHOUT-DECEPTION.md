# Testing without deceiving: how each claim will be tested, and what would make the prior wrong (2026-10-03)

Status: proposal; the mechanisms are those of `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\EXPERIMENT-PROTOCOL.md`, applied to the tree in `TREE.md`. JC's field experience with the method is strong and is treated here as motivation and as a prior, never as evidence. The aim is a result that a hostile, competent reader would accept whichever way it falls.

## 1. The mechanisms, and what each does and does not prove

| Mechanism | What it gives | What it does not give |
|---|---|---|
| Preregistration plus logbook (hypothesis, falsifier, decision table frozen before data; one logbook entry per experiment, same template for every outcome) | the verdict is assigned by a rule written before data | it does not check that the plan is good |
| External timestamp (OSF registration or Zenodo deposit citing the tag, commit and archive hash; a git tag alone is tier B at best, because commit and tag dates are author-controlled: the protocol reproduced a tag stamped 2020 on one machine) | a date the author cannot move | embargoed content proves nothing until disclosed; never embargo past the first submission |
| Independent replicators (own accounts, own plan timestamped before scoring, no commercial tie, may use another vendor, free to publish any result) | removes proponent authorship | takes weeks to months; a conceptual replication that differs is a boundary, not a failure |
| Blind judges from another vendor (fresh sessions, artifact only, no arm label, two vendors, a human spot-check; no primary metric judged where a script can decide) | removes same-family favouritism (Panickssery et al.) | judge noise is real (up to 6 points between two runs of one prompt in AX-K5), so judge validity (B11) precedes any audit number |
| Positive and negative controls (state restated in the change text as a known effect; A/A repeat; stale or placebo substrate; floor and ceiling checks) | a null is believed only if the design could have seen an effect | none |
| Metrics the treatment does not target (hidden-oracle behaviour, regression flips on sealed carried probes, follow-on task time, an erosion measure from a tool no gate uses) | outcome independent of the treatment's vocabulary | gate-aligned metrics are reported as "targeted", never as a verdict |
| Nulls, invalid designs and refutations in the same voice (template, headings, prominence, raw data) | no selective emphasis | none |
| Stateless external reader of every manuscript against the logbook index (a claim may print only if it maps to an entry, label and tier) | no claim beyond its tier | it does not replace peer review |
| Human-developer transferability study (section 3) | the only test that touches the "JC is exceptional" alternative | expensive and slow |

## 2. Per trunk: the claim, the test, and what would refute it

| Trunk | Test | Registered refutation (provisional thresholds are placeholders to be justified at each freeze) |
|---|---|---|
| P1 navigation economy | SDX-4: sizes S, M, L by a frozen ballast corpus; map versus expert prompt, a flat file that grows with the project, a stale map, a mechanically perfect map; unit: total tokens per accepted change including upkeep | at size L the map does not lower tokens per accepted change by the SESOI (provisional 20%) with the interval excluding it; or it is cheaper but pass rate falls more than 5 points; or the slope against size is not flatter; equivalent to the flat file means routing adds nothing. Wrong experiment if bare-agent cost at L is not at least twice that at S |
| P2 executed-verification yield | SDX-5: layers D1 to D5 plus an effort-matched review that may not execute, on sealed defects from an external taxonomy and a spec-level negative class | unique catch share of open-field execution below 10 points, or the effort-matched control is within the SESOI, or cost per true catch is worse; if execution also beats review on the spec-level class, the advantage is generic effort |
| P3 coherence and reconstructability | SDX-3: stateless auditors, injected divergence of five families, reconstruction against a fact list, with harness-written commit messages as the cheap rival | the substrate is equivalent to the commit-log arm within the SESOI on reconstruction and detection, or not above the expert prompt, or its advantage is confined to facts it wrote itself |
| P4 durability (flagship) | SDX-1, SDX-2, SDX-8: slopes over a chain; advice versus file versus gate versus substrate | SDX-1 decision rows (iii) and (iv) (no state-dependent gain, or a reversal); a generic gate recovers at least 0.8 of the effect (the claim reduces to "gates"); crossover beyond the horizon; win only when setup and upkeep are excluded; effect without movement of the mediators; faster but more escapes; opposite sign at all horizons |
| P5 practitioner variance | SDX-6, SDX-7: texts replayed under none, placebo and substrate within pre-assessed skill strata | ratio of spreads with an interval including or above 0.9 and no rise of the 10th percentile; interaction of the wrong sign (the substrate helps the strong most, the "amplifier" reading); no practitioner effect at baseline means there is nothing to shrink |
| M methods | audit of the case series; SDX-0; B11 | weakened if the guards would not have changed any verdict, or if judge self-preference and noise measured in B11 are negligible |
| Moderator (capacity) | model tier crossed with arm in P1 to P4; frontier cell | not a claim; if the effect does not shrink with capacity, the moderator is dropped |
| Instrument (I-1) | each property predicts its own outcome and not the others, on projects the method never guided | properties do not discriminate, or the score predicts nothing once general hygiene is controlled |

Cross-trunk refutation of the component story: if removing one component erases all effects together, the trunks are one effect measured several ways and are counted once. Four positive results for the full substrate on shared chains are one bundle result until the ablation (SDX-2) separates them.

## 3. "The method works" versus "JC is exceptionally effective with it"

The strongest alternative to the preregistered story is the **AI-savant alternative**: the effect is real for JC (his repositories show more test lines per production line, fewer short-lived lines, and so on) because he is an unusually good operator of coding agents, with or without this method, or because the method works only when its ratifier has his judgment. A one-subject history cannot separate these: the census is exploratory, tier D, its baseline is not "before AI", a sentinel exists from the first commit in most repositories, and one subject has no counterfactual. The design separates them in four ways.

1. **Operator removed from the model-only studies.** The expert prompt is written by an external practitioner who does not know GS; the substrate is built from a published manifest; replicators rebuild from the manifest on their own accounts and vendors; models run through a harness with no human in the loop. If the effect needs JC, it should vanish in the replications.
2. **Operators varied on purpose.** SDX-6 replays the intent texts of about 30 practitioners in three pre-assessed skill strata under no substrate, placebo and substrate; SDX-7 compares untrained people with the substrate against trained people without it. The estimands are the spread and the arm-by-skill interaction. A substrate that only helps the strong is the amplifier reading and refutes the floor-raising claim.
3. **Prospective adoption by other developers (TRF-1).** At least 20 developers, stepped-wedge or matched control, the same frozen analysis scripts, run on their repositories before and after adoption, registered before adoption; added measures the census lacks (measured line and branch coverage, a sampled mutation score, independently counted defects, a clean-clone executability check); the model logged per commit; two or three reference tasks standardized; mixed-effects analysis with developer and repository as random effects. JC is developer zero with his own random intercept and slope, so his effect is reported as an outlier check, not pooled as proof. Adoption fidelity (gate firings, record updates, ratification events) is measured so a dose-response can be examined: an effect that scales with fidelity and not with prior skill supports the method; an effect that appears only in JC, or only in the highest-skill developers, supports the savant or amplifier alternatives.
4. **Ratification quality measured.** Because the method leaves ratification to a person, the human ratifier's fault-detection rate on injected faults is measured in each arm (a comprehension risk raised by the skill-formation literature), so "works" cannot hide "the person quietly stopped reading".

| Possible world | Pattern that identifies it |
|---|---|
| The method works generally | replications reproduce the registered contrasts; SDX-6 spread narrows; TRF-1 effects appear across skill levels and scale with fidelity |
| Works for JC only (savant) | model-only effects replicate but no human effect transfers, or TRF-1 shows nothing outside JC |
| Amplifier (helps those who need it least) | TRF-1 and SDX-6 interactions favour high-skill developers |
| Works only where models are weak | effect vanishes in the frontier cell and shrinks along the tier ladder |
| Works as gates, not as a substrate | the enforcement-only arm recovers at least 0.8 of the gain |
| Value is governance and cost, not correctness | SDX-1 row (iii) with P3 positive |
| Nothing beyond naive-to-disciplined | no registered contrast beats the expert prompt; the AX2 pattern stands |

## 4. What would make JC's prior wrong

The prior is "the method works and the effect is large". It would be wrong, for the registered scope, if a preregistered, valid design returns any of these: SDX-1 row (iii) or (iv) together with a sufficiency ratio of at least 0.8 in SDX-2; no crossover within the SDX-8 horizon; no unique catch share for executed verification beyond the effort-matched control; the commit-log arm matching the substrate on audit; no narrowing of practitioner spread; and TRF-1 effects absent outside the originator. The possibility that the effect is real for JC and not transferable is therefore a registered outcome, not a footnote, and it would be reported in the same voice as a success. "I do not believe it" is not a defect in a result (protocol guard f): the response to a result that contradicts field experience is a validity audit of the experiment and a falsifiability audit of the intuition, both logged, before anything is explained away.

## 5. What this does not buy

No programme proves a universal. Results are bounded by benchmark, vendor, model snapshot, date and horizon; models drift; the invented domain is one domain; the first experiments are author-run until replicated. What the tree can honestly offer is a record in which every claim carries its tier, every refutation criterion was written before the data, and the one test that could separate the method from its originator was run by other people.
