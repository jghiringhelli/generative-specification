# Migration map: where every section goes, what is cut, what is duplicated (2026-10-03)

Status: PROPOSAL. Companion to `C:\workspace\PragmaWorks\gs\gs-paper-tree\docs\white-paper\tree\TREE.md` (node ids R0, P1 to P6, M, I-1, CR2, TRF-1, CEN-0, WS-1, A-1; branches in `BRANCHES.md`). Nothing has been deleted or edited in the existing documents; this file only says what should move.

Documents mapped (all under `C:\workspace\PragmaWorks\gs\gs-paper-tree\docs\white-paper\` unless stated): `GenerativeSpecification_WhitePaper.md` (v5.0, 9 numbered sections), `GenerativeSpecification_WhitePaper.LONGFORM.md` (adds a lexicon), the `ieee-access\` draft (sections I to IX plus supplements and figures), `GenerativeSpecification_Compendium.md` (the canonical master, 11 sections), `GS_Experiment_Supplement.md`, `GS_Rubric_ScoringGuide.md`, `GenerativeSpecification_FieldGuide.md`, `GenerativeSpecification_PractitionerProtocol.md`, `EXPERIMENT-LEDGER.md`, `THREE-PAPER-ROADMAP.md`, `PAPER-TREE.md`, `THESIS-RECENTER-proposal.md`, `PAPER-DECISIONS.md`.

Legend: **R0** root, **P1..P5** trunks, **M** methods trunk, **Led** a row of the root's evidence ledger, **Log** the logbook entry (the home of the detail), **Comp** Compendium only, **FG** Field Guide/course, **Ess** essay branch, **Br** a separable branch.

## 1. The one correction that must precede everything: evidence labels

The white paper labels its evidence A to D by sample size and replication (AX is "Tier A"; KX, TX, SX, BX, AX2, CR are "Tier B"; EX, RX, ALX, MX, RND-1 are "Tier C"). The experiment protocol labels the same experiments A to D by registration and independence, and states that no entry is tier A or B (`C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\LOGBOOK\README.md`: tier A registered externally before data; B in-repo tag before data; C design text before data or no registration, author-attested; D demonstration). `prereg\SDX-1-ARMS.md` section 1 already says the paper's "Tier A" is a replication label. Two systems using the same letters with different meanings will be read as an inflation. Rule for every derived paper: only logbook tiers and outcome labels are used, verbatim.

| Experiment | White paper label (5.x table) | Logbook label to use |
|---|---|---|
| AX | Tier A (three base conditions), C for the iterated runs | GS vs expert: INVALID-DESIGN (ceiling); series: DEMONSTRATION; tier C/D; no external registration |
| AX-K5 / AX k=5 data | part of AX Tier A | Layer violations: SUPPORTED as mechanism (targeted metric); rubric INCONCLUSIVE; runtime metrics INVALID-DESIGN; tier C |
| AX2 | B | naive vs disciplined SUPPORTED as mechanism; GS vs expert INVALID-DESIGN (saturated); oracle and coverage INVALID-DESIGN; tier C |
| KX | B | tokens and cost SUPPORTED; accuracy INVALID-DESIGN (circular key); tier C |
| TX | B | structure alone NULL (small scale); sentinel SUPPORTED; tier C |
| SX | B | sentinel on search cost SUPPORTED as demonstration (n=2); surface residual INCONCLUSIVE; tier C |
| CR | B | duplication and complexity INCONCLUSIVE, direction as predicted; behaviour and layer metric INVALID-DESIGN; tier C |
| BX | B | INCONCLUSIVE (n=3, circular for one repository); tier C |
| EX | C | DEMONSTRATION; tier D |
| RX | C | DEMONSTRATION; tier D |
| ALX | C | DEMONSTRATION; tier D; backfilled from the ledger, primary record unchecked |
| MX | C | quality INVALID-DESIGN (ceiling); tiering INCONCLUSIVE; tier C/D |
| RND-1 | C | prescriptive spec SUPPORTED (near-definitional); bounded context INVALID-DESIGN; test-faking NULL by floor; tier C/D |

Sentences in the current text that exceed the logbook label (to be changed in any derived paper; the originals are not edited by this branch):

1. White paper abstract and IEEE contribution 3: "one replicated comparison" / "a replicated comparison with its null reported". AX is author-run, k=5, pre-specified in intent only; GS vs expert is INVALID-DESIGN.
2. IEEE contribution 4 and white paper 5.2 CR: "structural benefit largest at the weakest rung". The logbook outcome is INCONCLUSIVE with direction as predicted.
3. White paper table row BX: "the rubric measures something real, not just what its author wanted". Logbook: INCONCLUSIVE, circular for one repository; no validity evidence.
4. White paper table row KX: "more accurate and cheaper". Accuracy is INVALID-DESIGN (answer key came from the structure under test); only tokens and cost are SUPPORTED.
5. White paper table row MX: "the gains come from the specification, not from paying for the biggest model". Logbook: quality at ceiling, tiering INCONCLUSIVE.
6. White paper table row RND-1 and its "what it means": "the complaint ... is a specification-and-verification problem you can fix". Prescriptive-spec result is near-definitional and the independent-verification arm is a null by floor.
7. White paper conclusion (bold): "What you build with AI becomes a verified, auditable, governable process". It is the promise the paper itself says the evidence supports in part (section 5.4 and 6). Belongs to the Field Guide as an aim, not to a paper as a sentence in the conclusion.

## 2. White paper (v5.0) section by section

| WP section | Destination | Cut / change | Duplicated elsewhere (owner after migration) |
|---|---|---|---|
| Front matter blurb and Abstract | R0 abstract, rewritten | drop "one replicated comparison" and the A-D list; the numbers stay in the ledger | IEEE abstract (replaced by R0 abstract) |
| 1 Introduction (Mars Orbiter; stateless reader; "this work requires CLI agents"; the arc; contributions; terms) | R0 section 1 (compressed to about one page) | keep the stateless-reader condition, CLI-agent scope and terms; the "arc" paragraph keeps its "we suspect, and have not measured" sentence; contributions rewritten to the R0 list | IEEE I, Compendium 1 and 1.1 (Comp stays long form) |
| 2 Discipline of removal; 2.1 raw material | R0 section 2 (one paragraph) | Martin-sense "paradigm" wording kept short | Compendium 3, 4.3 |
| 2.2 Phase collapse | P2 framing (its second half, the external guarantee, is the tested part) | the compression/speed half is not claimed anywhere (HYPOTHESES section 0) | Compendium 4.1 |
| 2.3 What is ours and what is the field's | R0 section 2 (keep verbatim in spirit: it is the honesty beat) | none | Compendium |
| 2.4 The theoretical place (pragmatic tier, Morris) | Ess (old D3) | removed from R0: reviewers punished grand framing | Compendium 4.3; Onwards essay |
| 3 Seven properties; 3.1 concept map | R0 section 3 (compact definitions, status "instrument, validity not established") ; ScoringGuide holds the manual | the letter grades are defined once and marked unmeasured | ScoringGuide (owner of the manual), Compendium 4.4 |
| 3.2 Grading and "governed as of" | R0 section 3 (definition only) | no claim that any project is "governed" as evidence | ScoringGuide, Compendium 8.19 |
| 4.1 Bridge, sentinel, read-asymmetry | R0 sections 2 and 4 as explanation; consequences go to P1 | the bridge theory is an explanation, not an operational term; cite consequences only (HYPOTHESES section 0) | Compendium 4.1; IEEE III.C-D |
| 4.2 Cost inversion | Comp; one hypothesis sentence in R0 | tokens-per-correct-output as a candidate metric of P1 and P4 | Compendium 8.2.1 |
| 4.3 Token economics, discipline-role taxonomy | P1 (economics) and Comp | the circulated "~70% token reduction" stays unasserted | Compendium |
| 5 intro and tier definitions A-D | retired for results | replaced by logbook tiers (section 1 above) | EXPERIMENT-PROTOCOL.md section 1 owns tiers |
| 5 experiments table | R0 ledger (one row per logbook entry) | relabelled; "What it means" column removed or rewritten as "what the entry licenses" | logbook entries own the detail |
| 5.1 Production projects | R0 ledger row "provenance of the properties, tier D" | two projects are client-confidential and cannot be cited; none is evidence of effect | Compendium 7.1 to 7.7 |
| 5.2 AX (design, results table, series) | Log AX; R0 ledger keeps the k=5 table as tier C detail; M uses it as defect examples (targeted metric, ceiling, kappa is run-to-run consistency) | the 3/14 to 14/14 path stays a diagnostic series, never an effect size | IEEE V and VI.A-E; Compendium 7.8.B; Supplement S3 to S11; EXPERIMENT-LEDGER |
| 5.2 EX | Log EX; Led; cited by P2 (feasibility) and P4 (gate demonstration), different claims | "15 defects" is builder-counted, no baseline | Compendium 7.8.D; IEEE |
| 5.2 KX | Log KX; P1 evidence | accuracy claim removed (INVALID-DESIGN) | Compendium 7.8.E; IEEE VI.F |
| 5.2 TX and SX | Log TX, SX; P1 evidence (navigation and bounding levers) | n=2 stated | Compendium 7.8.J, 7.8.K; IEEE VI.G; supplement S2 |
| 5.2 AX2 | Log AX2; Led; M (oracle that measured convention; coverage 1 to 95% from infrastructure failures) | runtime sub-metrics stay withdrawn | IEEE VI.H; **no Compendium section yet** (section 4 below) |
| 5.2 CR | Log CR; CR2 leaf; Led | direction as predicted, INCONCLUSIVE | IEEE VI.I; **not yet in Compendium 7.8** (stated in the white paper itself) |
| 5.2 ALX | Log ALX; Br LM-2; Led (tier D) | primary record must be read first | Compendium 7.8.F |
| 5.2 RX | Log RX; Led | none | Compendium 7.8.G |
| 5.2 BX | Log BX; I-1 | validity claim removed | Compendium 7.8.C |
| 5.2 MX, RND-1 | Log MX, RND-1; Led; RND-1 sub-experiments cited by P2 and P4 | "model-agnosticism" and "you can fix it" claims removed | Compendium 7.8.H, 7.8.I |
| 5.3 Field corroboration (workshop) | WS-1 (tier D, hypothesis generating) | private source; anonymization review; not evidence of effect | Compendium 7.8.A; FG |
| 5.4 Expert-prompt tie and H-S | R0 section 6 (agenda) and P4 (H-S becomes the long-horizon hypothesis, with H-NET) | none; this is the most reusable text in the paper | IEEE VIII.B; SDX-1 section 1 |
| 6 Threats to validity | M (full catalogue as defect classes) and R0 section 9 (condensed) | the "author designed, ran and scored everything" paragraph stays prominent | IEEE VII; Compendium 7.8 |
| 7 Implications for practice (document cascade table) | FG | the table of documents is practice, not a result | Compendium 8; Practitioner Protocol |
| 8 Related work | R0 section 8 (condensed) and trunk slices | add the 2026 competitors from the literature map: Gloaguen, Khatri, Lulla, Farrag, RAMP, traceSDD, Canedo | IEEE II; Compendium 3.5 and 5 |
| 9 Conclusion | R0 conclusion, rewritten | bold promise removed (item 7 above) | IEEE IX |
| References, Materials and Evidence, Data Availability | R0 (merged, renumbered); replication package DOI | | IEEE 04-references and `references-verification-log.md` |
| LONGFORM extra: 10 Lexicon of coined terms | Comp (glossary) | not carried to any paper (coinages policy of the old PAPER-TREE) | Compendium glossary |

## 3. IEEE Access draft (`ieee-access\`) section by section

| IEEE file / section | Destination | Cut / change | Duplicated elsewhere |
|---|---|---|---|
| 01 abstract and contributions | R0 abstract and contributions, rewritten | the abstract currently leads with AX numbers and the tie; R0 leads with the framework and the programme and keeps the tie as an honest ledger fact; contributions 3 and 4 relabelled (section 1) | WP abstract |
| 11 I Introduction | R0 section 1 | | WP 1 |
| 08 III Problem (stateless reader, derivability, bridge hypothesis, sentinel) | R0 sections 2 and 4 | | WP 1, 4.1; supplement S3 |
| 09 IV Discipline (A seven properties; B prescriptive specification; C phase collapse and cost inversion; D loop) | R0 sections 3 and 4; IV.C feeds P2 | add L1 to L5 operational definitions from `prereg\SDX-1-ARMS.md` section 1, each with its evidence status | WP 3, 4; supplements S4, S5 |
| 03 II Related work (A to I) | R0 section 8; II.H (empirical method for studies with LLMs) goes to M | | WP 8 |
| 05 V Study design (AX) | Log AX (already) and R0 ledger detail; M uses the "limited meaning of blind" paragraph | | WP 5.2; supplement S1 |
| 07 VI A to E (RQ1 to RQ4, post-hoc series) | R0 ledger detail (tier C/D) ; the series is M's example of post-hoc conditions | RQ labels dropped; "load-bearing question" wording replaced | WP 5.2 |
| 07 VI F (KX) | P1 evidence; R0 ledger row | | WP 5.2 |
| 13 VI.G (TX, SX) | P1 evidence; R0 ledger rows | | WP 5.2; supplement S2 |
| 14 VI.H (AX2) and VI.I (CR) | R0 ledger rows; CR2 leaf; M examples | | WP 5.2 |
| 10 VII Threats | M catalogue; R0 section 9 condensed | the five named threats stay bold | WP 6 |
| 12 VIII.A practice | FG | cut from R0 | WP 7 |
| 12 VIII.B expert-prompt tie and H-S | R0 agenda; P4 | | WP 5.4 |
| 12 IX Conclusion, Data availability, AI disclosure | R0 (rewritten conclusion; keep availability and disclosure lines) | Zenodo replication-package DOI still to be created | WP 9 |
| supplement S1 AX replication protocol | Log AX / A-1 | contains stale text (says the runner is absent); fix before any citation | GS_Experiment_Supplement S15 |
| supplements S2 to S5 | S2 to P1 appendix; S3 to S5 to Comp / ScoringGuide | | WP, Compendium |
| figures: Fig 1 sentinel tree; Fig 2 study design; Fig 3 strip plot | Fig 1 to R0 (L1) and P1; Fig 2 and 3 to the ledger detail | render Figs 1 and 2 | |
| `bridge-test-grounding.md` | Comp; its priors feed P4 (a 2026 study cited there reports that more prompt specificity had no statistical effect on structural quality; cite from the source after checking it, the note says its citations resolve) and P1 | | Compendium 4.1 |
| `perception-based-reading.md` | Comp only | not a load-bearing contribution | |
| `references-verification-log.md`, `REFERENCES-TODO.md` | kept; renumber at assembly | | |
| SKELETON.md and SUBMISSION-CHECKLIST.md | superseded by `ROOT-skeleton.md` for planning; the checklist's hard requirements (ORCID, template, CrossCheck, copy-edit, replication DOI, APC) carry over | | |

### What the IEEE draft becomes

**It becomes the ROOT (R0), cut and re-ordered, with a part of its content spun out to trunk M.** Justification:

1. Its own scope statement is "the stateless-reader constraint, the seven properties, and a replicated comparison with its null reported, bounded by a capacity-relative result": that is a framework plus an evidence ledger. The evidence part is what the root must hold. It is also the one artifact already close to submission, with 56 verified references, honest threats, and a stated "honesty gate".
2. It cannot be trunk M as is: M's single contribution is a methods case series across the whole logbook (nine INVALID-DESIGN rows, the protocol as countermeasure), whereas the draft is about one benchmark's results. But the draft's threats, its "limited meaning of blind" text, and its report of the tie and the saturation are exactly M's raw material; they move there.
3. It cannot stay as a results paper: under the logbook's tiers the study is tier C, GS vs expert is INVALID-DESIGN, and its own checklist (section D) lists six owed experiments before acceptance is plausible on scope. Presenting it as a framework and agenda removes the claim it cannot carry without removing any evidence.
4. What the root adds that the draft lacks: L1 to L5 operational definitions; the five orthogonal hypotheses with dissociation predictions and refutation criteria; the preregistered programme (protocol, roles, replicators); the full ledger (18 entries, not only the AX family); tiers in logbook terms.
5. A sub-decision for JC (D1): the version submitted to the journal may be "ROOT with data" (it keeps the AX k=5 table, the AX2 static table and the CR table as ledger detail, about two pages, relabelled by logbook tiers, because a soundness-gated reviewer will want numbers) while the Zenodo living version is the lean ledger. I recommend "ROOT with data" for the first submission.

Cut from the draft on the way to R0: the claim wording in section 1; the capacity-relative result as a numbered contribution (it becomes the moderator row); the RQ framing; VIII.A practice advice; supplement S3 to S5 detail (stay in Comp). Kept: the honesty gate list, the tie, H-S (now owned by P4), data availability.

## 4. Compendium parts

The Compendium (`GenerativeSpecification_Compendium.md`) stays the canonical master and the union; nothing is removed from it by this migration. It needs these additions so papers never disagree with it (rule 2 of TREE.md section 8): sections for AX2 and CR in the 7.8 series (the headings list stops at 7.8.K), logbook-tier labels, and the L1 to L5 definitions.

| Compendium part | Destination | Note |
|---|---|---|
| Prologue ($327M contract) | Comp | narrative; the Mars Orbiter in WP 1 is the paper version |
| 1, 1.1 the arc | R0 section 1 (condensed) | |
| 2 Abstraction ladder; 3 Theoretical gap; 3.5 Related | Comp; 3.5 feeds R0 section 8 | |
| 4.1 Mechanism (bridge, sentinel, phase collapse, read-asymmetry) | R0 as explanation; P1 and P2 consequences | explanation, not an operational term |
| 4.2 Closed-loop cascade | R0 L2 to L5; P3 (coherence) | |
| 4.3 Three-tier taxonomy (pragmatic tier) | Ess | |
| 4.4 Seven properties; 4.4.1 exemplars | R0 section 3; ScoringGuide; I-1 | |
| 4.5 Contract sufficiency | Comp; one paragraph to R0 | |
| 4.6 Economics of rigor, revival model, what endures | side branch (cheap rigor, B7) and P3/P4 framing of "what endures" | not dropped |
| 5 Related work (all subsections) | R0 section 8 and trunk slices | prior-art sections feed P1 (context files), P2 (verification), P3 (traceability), P4 (erosion) |
| 6 Artifact grammar (sentinel, cascade, loop types, test architecture) | FG; R0 L1 to L5 definitions | |
| 7.1 to 7.7 Case studies (SafetyCorePro, Invellum, ForgeCraft, Conclave, BRAD, Shattered Stars, data platform) | Comp; R0 provenance row tier D | confidential systems not citable; Invellum NDA check (see BRANCHES.md) |
| 7.8.0 Validation strategy; Define/Build/Measure; additional threats | M | |
| 7.8.A Workshop cohort | WS-1 | |
| 7.8.B AX; C BX; D EX; E KX; F ALX; G RX; H MX; I RND-1; J TX; K SX | Log entries; ledger rows; trunks as in section 2 | ALX also Br LM-2 |
| 7.9 Autonomous specification evolution | Br BIOISO (self-evolution line) / Comp | |
| 8.1 to 8.8, 8.10 to 8.14 practice, session loop, hardening, application gate, engineer elevated, adoption ladder | FG | 8.12 application gate also frames P2 |
| 8.9 Prompt engineering objection | P4 framing (expert-prompt tie) | |
| 8.15 Change governance by construction; 8.20 Coherence between spec and code | P3 framing | |
| 8.16 Mechanism-sample conflation | M (a methods lesson) | |
| 8.17 Twelve working principles; 8.18 Guides and sensors | FG; R0 uses the guides/sensors terms (Bockeler) | |
| 8.19 Definitions (debt per change, criteria coverage, lifecycle coverage, triage, governed as of, spec completeness) | R0 instrument definitions; P4 measures (debt per change) | |
| 9 Convergence (9.1 agentic self-refinement; 9.2 interface layer; 9.3 ADR emission gap; 9.4 convergence spiral) | Comp; 9.1 to Br BIOISO | 9.4 is a directional mental model, not a result |
| 10 Conclusion (10.1 contributions, 10.2 limitations, 10.3 future work) | R0 contributions, section 9 threats, agenda | |
| 11 Onwards | Ess | |
| Glossary, Acknowledgements, Provenance, About | Comp | |

## 5. Other documents

| Document | Destination | Note |
|---|---|---|
| `GS_Experiment_Supplement.md` (S1 to S15) | Log AX and A-1 (replication package); S11 (predictions versus actuals: 3 of 10 confirmed) and S12 (failed runs) are M material | |
| `GS_Rubric_ScoringGuide.md` | instrument manual for R0 section 3 and I-1 | |
| `GenerativeSpecification_FieldGuide.md`, `..._PractitionerProtocol.md` | FG (not papers) | carry only claims at their tier |
| `EXPERIMENT-LEDGER.md` (2026-09-20) | superseded by the logbook index; its pruning rule ("retire a sub-metric, not a result; never suppress a contradicting outcome") is adopted by TREE.md rule 6 | its home assignments (Paper 1/2) are replaced by section 9 of TREE.md |
| `THREE-PAPER-ROADMAP.md`, `PAPER-TREE.md` (white-paper), soma `PAPER-TREE.md` | superseded as the plan, kept as history; mapping in TREE.md section 9 | |
| `THESIS-RECENTER-proposal.md` (signed 2026-09-21) | the "unified thesis" (durable core, cheap rigor) is split: durable core to P2 and P4 (to be earned), cheap rigor to the side branch | its caveats (no prediction claim, trajectory framing) remain in force |
| `PAPER-DECISIONS.md`, `v4-revision-notes.md`, `REVIEWING.md` | unchanged; add a dated entry in PAPER-DECISIONS when the tree is accepted | |

## 6. What is duplicated today, and the single owner after migration

| Content | Appears in | Owner after migration |
|---|---|---|
| AX design, results and the post-hoc series | WP 5.2, IEEE V and VI, Compendium 7.8.B, Supplement, LONGFORM, EXPERIMENT-LEDGER | Log AX (detail); R0 ledger (table); everything else cites |
| Definitions of the seven properties | WP 3, IEEE IV, Compendium 4.4, ScoringGuide, FG | ScoringGuide (manual) and R0 (defined once) |
| Evidence tiers | WP 5 (A-D by replication), logbook (A-D by registration) | logbook |
| Expert-prompt tie and H-S | WP 5.4, IEEE VIII.B, SDX-1 section 1 | P4 (hypothesis); R0 states its status |
| Related work | WP 8, IEEE II, Compendium 3.5 and 5 | R0 (condensed); Compendium (long form) |
| Threats to validity | WP 6, IEEE VII, Compendium 7.8 | M (catalogue); R0 (condensed) |
| Sentinel definition | all of the above | R0 L1 (operational definition from SDX-1-ARMS) |
| Test counts for Loom | Loom README (339), state-of-Loom (410), WP (386 ALX) | Br LM-1 and LM-2 after a recount |

## 7. Nothing load-bearing is lost: checklist

| Load-bearing item | Where it lives after migration |
|---|---|
| Derivability premise and stateless reader | R0 sections 1 and 2 |
| Seven properties and rubric | R0 section 3, ScoringGuide, I-1 |
| Bridge, sentinel, read-asymmetry, phase collapse | R0 (explanations) with consequences in P1 and P2 |
| Substrate L1 to L5 | R0 section 4 |
| Capacity-relative scaffolding | moderator inside P1 to P4 and CR2 |
| Cost inversion, token economics | Comp; candidate metrics in P1 and P4 |
| Expert-prompt tie and H-S | R0 agenda; P4 |
| Every experiment, including the nulls and invalid designs | logbook, R0 ledger, M |
| Governance-as-durable-value claim | P3 and P4 (to be earned); not in R0 as a claim |
| Revival model / cheap rigor | side branch (B7, `discipline-revival-model.md`) |
| Pragmatic tier, Onwards, Golden Century | Ess |
| Loom, BIOISO, Chronicle | `BRANCHES.md` |
| Workshop observations, production projects | WS-1, R0 provenance row (tier D) |

## 8. Claims beyond tier: how the migration prevents them

Each node ships with a claims-evidence table (see the three skeletons). A sentence may state a result only if its row cites a logbook entry and quotes the outcome label and tier. A pre-submission script (to be written; BACKLOG-sized) should grep each manuscript for result verbs and numbers and require each to map to a ledger row; until it exists, the table is checked by a stateless external reader who sees only the manuscript and the logbook index.

## 9. Sequencing against JC's PhD calendar

Facts used: UOC application window about December 2026 to about 31 January 2027, start September 2027, accepted papers count at application: JCR journal 10, non-JCR journal 8, international conference 6, national 4, scientific production capped at 10 (`strategy-3yr.md`). Acceptance is not controllable, review times vary, and a revision round can push a decision past the deadline; nothing below promises an acceptance. The baremo cap means a single JCR-indexed acceptance already saturates the 10 points; every other node adds science and CV value, and insurance if the JCR route does not land in time. Whether a journal is JCR-indexed in the application year must be checked per journal.

| Date (verified unless marked) | Event | Node |
|---|---|---|
| 2026-10-14 | OOPSLA 2027 Round 1 deadline | not feasible for any node (Loom paper not ready) |
| 2026-10-23 | ICSE 2027 NIER and SEIP submission deadline; notices 2026-12-18 (NIER) and 2026-12-11 (SEIP); camera-ready 2027-01-20 | M (short) is the candidate for NIER |
| early to mid 2026-11 (target, not a deadline) | IEEE Access submission of R0 | R0 |
| 2026-11-13 / 2026-11-20 | MSR 2027 Registered Reports abstract / initial report; stage-1 notice 2027-02-04 | optional: TRF-1 (a mining and prospective-adoption protocol) or a P4 protocol, only if frozen in time |
| about 2026-12 | UOC application opens (strategy doc) | |
| 2027-01-31 (approx.) | UOC application closes | |
| 2027-02-04 | MSR RR stage-1 notice (after the UOC close; and in-principle acceptance is not an accepted paper, to be confirmed with the commission) | |
| 2027-04-07 | OOPSLA 2027 Round 2 deadline | Br LM-1, if soundness and evaluation work are done |
| 2027-09 | PhD starts | |

### Can be submitted and potentially accepted before about January 2027

1. **R0** to IEEE Access: needs only the re-cut, the relabelling, the logbook merge and archive, the copy-edit and the template; no new experiment. Whether Access accepts a framework-and-ledger paper is a reviewer decision; the existing draft's own checklist says rejection is plausible on scope. Mitigation: "ROOT with data".
2. **M** (short version) to ICSE 2027 NIER, or to IEEE Access as a second paper if bandwidth allows: the case-series core exists in the logbook today. Caveats: the logbook entries were written by the author's assistant on 2026-10-02 and need an independent classification audit; NIER's page limit and the commission's scoring of NIER were not verified.
3. Nothing else. No trunk P1 to P6 has data; none has a frozen preregistration; I-1, replications, CR2, TRF-1 and the branch papers are all later.

### Cannot be accepted before January 2027

P1 to P6 (no data yet; the first plausible data are SDX-5 Part A and the SDX-4 pilot, about Q1 2027, because SDX-0, the critic rounds and the practitioner artifacts come first), I-1 (needs trunk data), independent replications (start at freeze), TRF-1 results, and the Loom, BIOISO and Chronicle papers (BRANCHES.md section 5).

### Recommended order of submission

1. R0 (the foundation every later node cites; use the Zenodo preprint of the same version for a timestamp the day it is submitted).
2. M short, in parallel with R0 only if it does not delay R0 (it is the insurance conference item).
3. Registered-report protocol stages where a protocol exists before data: P4 (the flagship) at the ESEM or MSR track when the SDX-0/SDX-1 pre-freeze sequence is complete; this converts "results gate" into "protocol gate" and gives in-principle acceptance regardless of outcome. ESEM 2027 dates were not found; the 2026 pattern suggests a spring deadline (inference).
4. P2 (SDX-5 Part A is the cheapest trunk and independent of SDX-1), then P1 (SDX-4), both in 2027. P6 (SDX-9, added 2026-10-03) comes after SDX-0 and its criteria-tagged oracle; it is independent of SDX-1 outcomes and of P4, so it can be drafted with SDX-8 in the next design cycle and run in 2027 alongside P1 and P2; it cannot be accepted before the UOC window either. The SDX-8 and SDX-9 drafts are design-only until SDX-0 closes (TREE.md section 11.2).
5. P4 full results (after SDX-1 and SDX-8), then P3 (needs archived SDX-1 chains and B11), then P5 (human studies, 2028).
6. M extended (with SDX-0 and B11 results), I-1 (after at least two trunks), CR2.
7. Branch papers in the order BRANCHES.md section 5 suggests; independent of the GS order, with the dilution guard.

The strategy's own advice stands: submit in parallel so review cycles overlap, and do not let the paper dictate the method or the workshop.

## 10. Added 2026-10-03: what the new trunk and the decisions change in this map

1. **P6 sources.** No existing section of the white paper, the IEEE draft or the Compendium is migrated into P6: its claim has no prior text. Reusable pieces: Compendium section 8.19 definitions (spec completeness, criteria coverage, lifecycle coverage, triage) as the stage vocabulary (wording to be checked); the phase-collapse external-guarantee half (white paper 2.2) as framing; EX (tier D) as the single feasibility row in the ledger. The white paper's compression or speed half of phase collapse remains unclaimed anywhere (HYPOTHESES section 0); P6 tests cost to a verified COMPLETE, not compression.
2. **Section 1 of this file is now actionable.** JC accepted the ROOT and the orthogonal set on 2026-10-03; the seven over-labelled sentences and the concrete edit for each are written out in `TREE.md` section 11.1. The retirement of the A to D letters (D3) is the only item in that section that changes published text; the Zenodo v4.0 record is never edited, a new version carries the changelog.
3. **Sequence.** The order in section 9 stands with two additions: SDX-8 and SDX-9 design drafts (no spend) in the next cycle, and the field-study pilot (`FIELD-STUDY-TEAMS.md`) only after the ROOT is submitted and the registration, analyst and agreements exist; it is not on the critical path of any submission before January 2027.
