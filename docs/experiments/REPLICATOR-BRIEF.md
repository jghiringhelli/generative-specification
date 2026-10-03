# REPLICATOR-BRIEF: what an independent replicator does, gets, delivers and is credited for

Status: **DRAFT, NOT FROZEN, TERMS TO BE AGREED WITH EACH REPLICATOR.** Written 2026-10-02. English; neutral Spanish version: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\REPLICATOR-BRIEF.es.md`. Role definition (role e): `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\ROLES.md`. Protocol: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\EXPERIMENT-PROTOCOL.md`. What would be replicated: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\HYPOTHESES-2026-10-02.md`, `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\BACKLOG.md` (B9 and the second-pass section), `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\prereg\SDX-1.md`, `...\prereg\SDX-1-ARMS.md`. Logbook: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\LOGBOOK\README.md`.

Owed before this brief can be used as an invitation, said plainly: (1) nothing is frozen yet, so there is not yet a frozen preregistration to hand over; recruitment can start, delivery starts after the freeze; (2) the harness, runner and oracle are specified in the preregistration but the replication runbook that goes with them is not written until SDX-0 has produced a working harness; (3) all cost and time figures are estimates from the draft and will be replaced by SDX-0 measurements.

## 1. Why independent replicators

The method's author designed, built and ran the experiments about his own method, and every earlier critic was a Claude model. Preregistration, an external practitioner and different-vendor critics reduce the bias; they do not remove it. A result becomes believable when someone with no stake reruns it from the published package and gets the same answer, or a different one that is reported with equal prominence. The replicator is the last independence role and the only one that spends its own time and accounts on the question.

## 2. Two kinds of replication

| | Model-only replication (type M) | Human-participant replication (type H) |
|---|---|---|
| What is replicated | A frozen model-only experiment: SDX-1 (primary contrast first), later SDX-3, SDX-4 or SDX-5 | The human study SDX-6 (prompt authors) or SDX-7 (live participants) |
| What the replicator runs | The published runner, scaffold, sealed oracle and arm artifacts on their own accounts, machines and agent tools | The published participant protocol with their own participants, their own institution and ethics process, the published tasks and raters' rubric |
| Variant (declared in advance) | **Direct**: same vendor and model family and pinned snapshot if still available. **Conceptual**: a different vendor or model tier (a legitimate and useful replication, reported as a boundary condition and not pooled) | Same task and arms; different population is the point |
| Typical effort | 40 to 80 person hours plus machine time; 4 to 8 weeks calendar | 3 to 6 months; needs funding and an ethics review |
| Model spend (estimate from the draft, replace after SDX-0) | SDX-1 primary contrast only (A4 and A5 at n = 20, plus A0, A0S and A5b at n = 10 as benchmark and validity controls; 70 chains): about 960 sessions, about $385 to $1,150. Full Core: about 1,100 sessions, about $440 to $1,320. SDX-5 Part A: about $250 to $600 | participants' pay and model spend as in BACKLOG B15 and B16 |

The first deliverable of a type-M replicator is a validated harness on their setup (the SDX-0 checks V1 to V13), which is itself useful to the field.

## 3. What a type-M replicator does, in order

1. **Declare** (before receiving the package): the conflict-of-interest form of section 12, funding source, vendor and model they intend to use, and direct or conceptual variant.
2. **Receive and verify** the frozen package: archive and SHA-256 (built with `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\scripts\build-frozen-package.js`), tag, OSF and Zenodo identifiers. Verify hashes before any run. A hash mismatch ends the replication until reconciled.
3. **Build and validate the harness** on their machine: canary probe run cold (recall above zero is INVALID-DESIGN for that model), oracle validation (reference implementation, stubs, mutants), scaffold tamper detection, memory-leak plant (V13), cost and cap-hit check. Report which V checks passed.
4. **Generation phase**: run the registered arms, chain counts and order randomization, in a short window, with the model snapshot, CLI and Node versions recorded. Archive every repository snapshot and session transcript. Compute SHA-256 of the archive.
5. **Register their own analysis plan** before scoring (section 8). The harness separates generation from scoring on purpose: the oracle scores are produced after the replicator's plan is timestamped.
6. **Scoring and confirmatory analysis**, exactly as in the frozen preregistration, plus any extra analyses they pre-declared.
7. **Report**: raw data, deviations log, analysis, a plain statement of which decision row of the frozen decision table applies, whatever it is.

A type-H replicator follows the human protocol's own steps (pilot for intervention fidelity, locked arms before enrollment, random assignment record, blind raters outside the author's orbit, registration before enrollment); those steps are written in `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\BACKLOG.md` (B12 principles, B15, B16) and will have a participant protocol file when SDX-6 or SDX-7 is designed.

## 4. Prerequisites

- Competence in empirical software engineering methods: the registered analyses are permutation tests, bootstrap intervals, equivalence tests and mixed models; the replicator must be able to run and critique them.
- Scripting and a modern toolchain: Node and TypeScript for the scaffold, a scripting language for the harness and analysis, a headless coding-agent CLI for the chosen vendor.
- Their own model access: API accounts or subscriptions with enough capacity for the planned chains; their own machine or server; an uninterrupted window of one to three days of wall clock for the generation phase (3 to 4 chains in parallel).
- Time: see section 2. Authority to publish (employer or institution permission if needed).
- For type H: access to a participant pool, an ethics or institutional review route, funds.
- Not required: any knowledge of GS. Preferred: none or little (see section 6).

## 5. Cost and who pays

Default: the replicator pays their own model spend, or uses their own research credits, so that no one with a stake in the result funds it. If JC offers funding or credits, that is declared in the COI form and in the report, and goes through a neutral channel the replicator controls (for example credits attached to the replicator's account or a grant to their institution with no conditions); it never goes with any request about results. **Decision for JC:** whether to offer funding at all; independence is stronger without it and recruitment is easier with it.

## 6. What they must NOT be given or read beforehand

Until their own analysis plan is timestamped and their generation phase is archived, a replicator is **not given and should not read**:

- Any outcome of the original work: SDX-0 pilot data, SDX-1 main results, any numbers by arm, the logbook entry's result and outcome fields, any figure or table of results, and any conversation about which way the result "should" go.
- Advocacy material: the white paper, the compendium, the courses, the site, talks and posts that argue for GS. The frozen package states what the arms contain; it does not need the argument. After the plan is timestamped the replicator may read anything.
- Proponent-side commentary on the oracle's hidden contents beyond what the frozen package publishes. (The oracle itself is published in the package because a replicator must be able to run it; what is withheld is information about how arms performed on it.)

What they **do** receive includes the preregistration's pre-stated expected ranges (SDX-1 section 2a), because those are part of the registration and let a result be judged against them.

They must not modify any arm artifact, manifest, change text, oracle or scaffold. Any change is a deviation, logged, and makes that part of the run a conceptual variant.

Communication rule: technical questions only, in writing, through one logged channel (a public issue thread or a shared log file kept in the package); answers are added to a public FAQ; no one from the original team discusses expectations or results with the replicator before the replicator's report is submitted; JC and the assistant do not participate in runs or analysis.

## 7. Independence rules

A replicator must satisfy all of the following, declared in the COI form; a "no" on any item is not automatically disqualifying but is disclosed in the report and may make the replication an "informed" or "partially independent" variant, labelled as such.

1. No commercial tie to GS, PragmaWorks or any of their clients, partners or products: no employment, contract, consulting, revenue share, equity, paid training, speaking fee or sponsorship, now or in the last 24 months.
2. No close relationship to the author or the original team that would reasonably be seen as a conflict: not a current or recent (last 3 years) student, advisee, supervisor, co-author or business partner of JC. (Proposed window; to be agreed.)
3. No prior public position for or against GS that they would be unable to put aside; any such position is disclosed, and prior reading of GS material (none, heard, read, trained) is declared.
4. Funding sources for the replication disclosed (section 5).
5. They hold their own API keys, raw logs and archives; they do not hand them to the original team before submitting their report.
6. They may use a vendor different from the original; they may not use an assistant or agent that was supplied or configured by the original team to run or analyse the experiment.
7. They keep the right to stop, to publish, and to withdraw before data collection without penalty.

A competitor or a skeptic is an acceptable replicator, and often a good one, provided the same declaration is made.

## 8. What they receive

1. The frozen preregistration package (archive, SHA-256, tag, OSF and Zenodo ids): SDX-1 and SDX-1-ARMS, change texts and order, scaffold hash, oracle with probe manifest, content manifest, arm artifacts (hashed), detector and analysis scripts with seeds, model, CLI and Node versions of the original, decision table, deviations-log template (empty).
2. The protocol and the role definitions: `EXPERIMENT-PROTOCOL.md`, `ROLES.md` (role e), `PREREG-HOWTO.md` section 8.
3. Runbooks for the harness and for registering their own analysis plan (the replication runbook is owed, see top).
4. The data schema of section 9 and a deviations-log template.
5. A named point of contact for technical questions and a response commitment (proposal: within 5 working days).
6. This brief, the COI form, the proposed authorship terms (section 10) and the data-sharing terms (section 11), all to be agreed in writing before the package is delivered.

## 9. What they deliver

1. **Raw data** in a fixed schema (the schema file ships with the package; fields below are the minimum):
   - `sessions`: chain id, arm, step, attempt, start, end, model id string, CLI version, tokens by category (input, output, cache creation, cache read), tool-call counts by type, exit status, cap-hit flags, cost.
   - `snapshots`: chain id, step, repository archive path and SHA-256, scaffold hash check result.
   - `probes`: chain id, step, probe id, tag (SD or SI, fresh or carried), result, oracle version.
   - `events`: test deletion or weakening, hook blocks and circumventions, questions asked, emergent-substrate detector output.
   - `environment`: machine, OS, Node, CLI and model versions, dates.
2. **Deviations log**: every departure from the frozen package, with date, reason and whether it makes the affected cells conceptual.
3. **Their own analysis plan**, written and timestamped (OSF or equivalent) after the generation phase is archived and before any oracle score is produced: it must restate the frozen confirmatory analysis unchanged and may add pre-declared extras; it also states their own criterion for "replicated" (by default: the same decision row as the original, or an interval that includes the original's point estimate; they may justify a stricter rule).
4. **Report**: methods as run, confirmatory result by the frozen decision table, the extras clearly labelled, limitations, and a statement of independence and funding. They are free to publish it, positive, negative or null, without approval from the original team.

## 10. Credit

- **Acknowledgement**: every replicator is named, with their role and affiliation, in the logbook entry of the replication and in any GS paper or public document that cites their replication, with the exact model ids and dates.
- **Authorship of their own report**: the replicator and their team are the authors of the replication report; the original team does not have to be on it.
- **Co-authorship on a joint paper (proposal, not a promise, to be agreed in writing before the start)**: if a combined paper (original plus replications) is written, authorship follows the standard criteria (the ICMJE criteria or the CRediT-based equivalent in software engineering): a substantial contribution to the design of the replication or to data acquisition, analysis or interpretation; drafting or critical revision; approval of the final version; accountability for the parts they did. Holding an account, running a script or being a colleague is not enough by itself. Author order and corresponding author are agreed when the paper is planned. A replicator may decline authorship and take acknowledgement only. Nobody on the original team can make co-authorship a condition of publishing a replication or veto it.

## 11. Data sharing and licensing (proposal, to be agreed)

- Raw data, deviations log and analysis code of the replication are deposited by the replicator in a public repository (OSF, Zenodo or equivalent) within a time they choose, and no later than the report's publication. Proposed license for data: CC BY 4.0; for their code: any open license that permits reuse; the original package's own license applies to the original files (to be checked and stated in the package before delivery).
- Transcripts and repositories may contain model output only; no personal data is expected in type M. In type H, personal data stay with the replicator's institution under their consent and ethics terms; only anonymized data are shared, and consent must cover that.
- The replicator owns their report. The original team may link to it and quote it with attribution and must not edit it.
- If an embargo is needed (for a journal), it is the replicator's choice and is capped at 90 days after submission of the report (proposal).

## 12. Conflict-of-interest declaration (to be completed and signed before receiving the package)

Name, affiliation, role; for each item of section 7, yes or no and details; prior exposure to GS (none, heard, read, trained) and what; relationship to JC or the original team (none, colleague, former student, other); funding for this replication; employer permission; planned vendor, model and variant (direct or conceptual); any statement made in public about GS. The signed form is kept in the package and cited in the logbook entry.

## 13. How replication results enter the logbook

- Each replication is a **separate, independent entry** with its own id (`<original id>-R<n>`, for example `SDX-1-R1`), written by or with the replicator, its own preregistration (their analysis plan and registration record), its own evidence tier under the protocol (tier A if registered externally before data), and its own outcome label and "what it licenses" in the common template (`C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\LOGBOOK\ENTRY-TEMPLATE.md`).
- The original entry gets a dated note and a link; it is never rewritten (logbook rule). The index gets one row per replication.
- Results are shown side by side. They are pooled only if a pooling rule was registered before any replication data existed; otherwise no pooled estimate is claimed.
- Direct and conceptual replications are labelled as such; a conceptual replication that differs in direction is a boundary condition, not a failure to replicate, unless its pre-declared criterion says otherwise.

## 14. If their results contradict ours

Decided now, so nobody has to decide it later under pressure:

1. The contradicting result is logged with the same prominence, tone and template as a supporting one, in the logbook, in the index and in any paper or page that cites the original. The replicator's wording stands.
2. The validity audit is mandatory for both the original and the replication (the "ix" row logic of `SDX-1.md` section 10): harness logs, controls, oracle, arm artifacts, deviations.
3. The original claim is narrowed to the scope that survives (for example "on a mid-tier model of one vendor") or withdrawn; public statements follow the weaker result until a further registered experiment says otherwise. Nobody rescues a claim with regimes that were not registered in advance.
4. If both audits are clean, a registered joint follow-up is proposed (a third, neutral party running the discriminating condition); if either finds a defect, it is repaired and the affected result is rerun or labelled INVALID-DESIGN.
5. The original team may reply in writing alongside the replication; it may not edit, delay or soften it.

## 15. Candidate profile and screening

There are no named candidates here and no contact details; JC supplies names, and any list built from public sources is checked for the independence rules of section 7 before contact.

**Profiles that fit**
1. Academics and postdocs in empirical software engineering or AI-assisted development with a record of replications, registered reports, artifact evaluation, or mining and experimentation methods (the communities around the ESEM, MSR and ICSE-family venues and their artifact and registered-reports tracks).
2. Graduate students (PhD preferred) in those groups, with a supervisor's agreement, for whom a registered replication is a publishable outcome.
3. Independent senior engineers or applied-AI practitioners with research habits, their own accounts and no commercial tie.
4. Evaluation or benchmarking engineers at organizations with no commercial relation to GS, acting in a personal or institutional research capacity.
5. For type H only: a research group with access to participants and an ethics process.

**Screening, in order**
1. Independence (section 7): any "yes" to items 1 to 3 is escalated and disclosed, never hidden.
2. Method competence: can describe, unprompted, how they would run an equivalence test and what a registered report is; can point to a prior replication or analysis plan they wrote.
3. Capacity: can run the harness (scripting, CLI agent, API access) and commit the weeks required; has an uninterrupted window for the generation phase.
4. Willingness: publishes nulls and negatives; accepts the communication rule and the no-modification rule; can sign the COI form.
5. Diversity of the set: aim for at least two replicators, ideally three, using at least two vendors and different regions or institution types; at most one from any one research group.
6. Red flags: wants to co-design the intervention or the arms (that is a critic's role, not a replicator's); expects a paid engagement from PragmaWorks; has a stated intention to confirm or debunk; cannot commit to the preregistration order (plan before scoring).

**Where to look, without inventing anyone**: program committees and authors of the empirical-SE venues' replication, artifact and registered-reports tracks; the open-science and meta-research groups of software engineering departments; authors of recent papers evaluating coding agents; and community channels for reproducibility. JC chooses; the independence check comes before the first message.

## 16. Recruiting message (JC may send; English)

> Subject: Independent replication of a preregistered study on coding-agent project outcomes
>
> I am looking for an independent group or person to replicate a preregistered, model-based experiment on whether a persistent repository substrate (a navigation map, specification ledger, decision records and enforced gates) changes how well a coding agent keeps a growing project correct, against a strong expert prompt and a naive one. The design is preregistered with a decision table that includes the outcomes I do not expect, uses an invented benchmark with a sealed behavioural oracle, and is built so that a null is a valid, publishable result. I would like you to run the published runner on your own accounts, write your own analysis plan before scoring, and report whatever you find, with no approval from me. I am the author of the method under test, so I will not take part in your runs or analysis, I will not ask for co-authorship as a condition, and I would ask you to declare any conflict of interest. Expected effort is about 40 to 80 hours over 4 to 8 weeks and roughly a few hundred dollars of model spend, and the package will be frozen and timestamped before you receive it. If this might interest you, I can send the short brief and the independence terms first, with no commitment.

## Appendix A. Checklist for JC before sending the first message

1. Is any part frozen? If not, say so in the message (the brief already does) and promise the package after the freeze.
2. Independence check of the candidate against section 7.
3. Has JC decided on funding (section 5)?
4. Is the license of the package stated (section 11)?
5. Is a contact for technical questions named?
