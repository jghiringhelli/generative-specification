# ROLES: who has to be independent in SDX-1, what they do, and what they are

2026-10-02. Draft, belongs to the SDX-1 registration package. Repository (worktree): `C:\workspace\PragmaWorks\gs\gs-experiment-protocol`, branch `experiment-protocol-2026-10-02`. Design files: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\prereg\SDX-1.md`, `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\prereg\SDX-1-ARMS.md`. Protocol: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\EXPERIMENT-PROTOCOL.md`. Sequence and stop rule: section 6 of this file and `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\PREREG-HOWTO.md`.

Runbooks and briefs that implement this file (all in `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\`):
- `COPILOT-CRITIC-RUNBOOK.md` (role b, executed by the Copilot agent on JC's second PC)
- `COPILOT-PRACTITIONER-RUNBOOK.md` (role a, model variants; written neutral on purpose)
- `PRACTITIONER-HANDLING.md` (what JC does around the neutral runbook, and the main-PC leak and strength checks)
- `HUMAN-PRACTITIONER-BRIEF.md` (role a, the human, one page, Spanish and English)

Contents: English (sections 1 to 6), then Spanish (secciones 1 a 6).

Role (e), the independent replicator, was added on 2026-10-02 as section 5b (after the freeze, outside the pre-freeze sequence): `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\REPLICATOR-BRIEF.md`.

---

# ENGLISH

## 1. Why these roles exist, in one paragraph

Everything so far was written by the people who believe in the method, and every critic was a Claude model. A design written by its proponents can favor the proponents without anyone meaning it: the comparison prompt can be a strawman or can quietly contain the method, the substrate can be built better than the control, the oracle can reward what the method does, and a reviewer who shares the authors' training and blind spots agrees too easily. Each role below removes one named bias by putting a different mind (a different person, or a model from a different vendor) at the exact point where the bias would enter. None of them proves the design is right. They make it much harder for the design to be wrong in the proponents' favor without somebody noticing.

The four roles in one table:

| Role | Bias it removes | Primary filler | Secondary filler | Sees the GS load-bearing list L1 to L5? |
|---|---|---|---|---|
| (a) EXPERT PRACTITIONER | the control arm written by the proponent (strawman, or GS in disguise) | a human senior engineer who is not a GS reader | models from other vendors, labelled A5-m | NO, until the first two deliverables are frozen |
| (b) CRITICS | design flaws and favoring-by-construction that the authors and Claude critics cannot see | models from at least three vendors, stateless | one human skeptic, optional | yes, they review the whole design |
| (c) INDEPENDENT REVIEWER | proponent-authored change texts, manifest tags, probe rule, artifact quality | a human who is not JC, not the practitioner, not an agent | none | yes (needs it to tag and check) |
| (d) BLIND JUDGES | the generator (Claude) grading itself or grading its own kind; arm label leaking into judgments | models from a vendor other than the generator, and other than the artifact's author | the human reviewer as second instrument | rubric only |

Words used the same way everywhere: **generator** = the model that builds Pastura in the runs (Claude, mid-tier, headless CLI). **Vendor** = the company behind a model family (Anthropic, OpenAI, Google, and so on). **Stateless** = a fresh session with no memory, no earlier files, no chat history, no tools beyond the ones the task names. **Different-vendor** = a vendor that is not the generator's.

## 2. ROLE (a): the expert practitioner

### Purpose
Arm A5 ("expert prompt without any load-bearing GS element") is the comparator of the lead hypothesis H1 (A4 minus A5) and the subject of H2 (A5 minus naive). If A5 is weak, H1 is won by default. If A5 secretly contains sentinel, ledger, decision record, gates or lock, H1 is lost by default and the "minus GS" label is false. The practitioner's job is to write what a strong engineer who does not know GS would actually write. They also write A6 (the unconstrained natural prompt), and later the L appendix (A1) and the flat file (A3), which are the same author's best attempt at GS content in a prompt and in one file.

### Who may fill it, and why
- **Primary: a human senior engineer** who uses coding agents professionally and has not read GS material. Why a human: a person has a real practice with real habits, is accountable for the text, can attest authorship, and can credibly be "someone who does not know GS". Models cannot truthfully attest ignorance: every frontier model has absorbed current agent-guidance literature, which often says "keep a notes file for the next session". A model-authored prompt will therefore tend to contain persistence instructions, which is a finding in itself but not a stand-in for a practitioner.
- **Secondary: model-authored variants from vendors other than the generator** (OpenAI, Google, others in the Copilot picker), labelled **A5-m** (derived from A6-m by deletion, exactly like the human's A5) and **A6-m**. Why: they are cheap, they show whether the verdict depends on who writes the expert prompt, and a prompt written by another vendor avoids the concern that the generator reads its own vendor's style more easily. Why secondary: no accountability, no attestation, and the training-data point above. They are clearly labelled in every table and are never pooled with the human arm.
- Two sub-variants for models, because one design decision is unresolved (the memory brief): **A5-m1** (told that the assistant has no memory between sessions) and **A5-m2** (not told). The decision and its reasoning are in `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\PRACTITIONER-HANDLING.md` section 2. Short version: the human brief tells them, so m1 matches the primary arm; m2 measures how much of the persistence mechanism the prompt acquires from being told. Both are produced; neither is hidden.
- A Claude model may act as an extra labelled variant only as "same-vendor as generator" and is excluded from the model-author claim.

### Exact tasks (human)
1. Receive the one-page brief (`C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\HUMAN-PRACTITIONER-BRIEF.md`) and the product description of Pastura (the base spec). Read nothing about GS first.
2. **Task 1 (gives A6):** write the strongest prompt you can, from your own expertise, that a coding agent receives at the start of every session so that it builds and extends this service well. Deliver. The text is hashed (SHA-256) and frozen before anything else is shown.
3. **Task 2 (gives A5), explained only after Task 1 is delivered:** produce the version for an arm in which the agent may not be told to create, maintain or consult any file other than source code and automated tests (no notes, plans, README, decision records), nor to install or require hooks, CI or other enforcement. Remove what that rules out. Change nothing else, add nothing. Deliver the A5 text and a verbatim list of what was removed.
4. Attest in writing: the text is your own; any AI tool used in drafting (name, role) is disclosed; hours spent; what you drew on (books, teams, experience).
5. Later, only after both texts are frozen and hashed: receive the manifest of the five load-bearing elements as a neutral checklist and write (i) the L appendix to A5's body (arm A1) and (ii) the best single flat context file (arm A3), instruction "write the strongest possible artifact".
6. If a pre-declared check fails (leak, strength, parity), revise. At most 3 revisions per artifact; each logged with its trigger.

### What they must NOT see
GS, Generative Specification, the white paper, the course, the site, the sentinel and spec-lock vocabulary, SDX-1, SDX-1-ARMS, the list L1 to L5 (until step 5, and then only as the manifest), any hypothesis, arm or decision table, the change list (changes 1 to 10), the oracle and any probe, any result, any other practitioner's text, any critic file, A4 (the substrate). They are told the truth in general terms ("an experiment on AI coding assistants maintaining a growing project") and that a second short step follows, which is explained after the first is delivered, so the first reflects natural judgment.

### Deliverable and format
Plain Markdown, UTF-8, LF line endings, one file per artifact: `A6.md`, `A5.md`, `removed.md` (verbatim list of deleted lines or sentences), `attestation.md` (fields above), later `A1-appendix.md`, `A3-flat-file.md`. The prompt files contain only the prompt text, no preface, no commentary, so they can be inserted verbatim and hashed. Storage: `experiments\sdx1\practitioner\human\` in the worktree after freezing, hashes listed in the registration manifest.

### Time estimate
Human: Task 1 two to four hours, Task 2 half an hour to an hour, appendix and flat file two to three hours, revisions up to three times an hour, attestation 15 minutes. Total about 6 to 10 hours over one to two weeks. Paid at a market rate is strongly recommended (it also makes the independence cleaner: a commercial relationship with a GS-adjacent firm is the risk, a plain fee is not). Models: minutes per session, a few dollars at most.

### How independence and "no GS in disguise" are ensured
1. **Selection and exposure record.** Before starting, the practitioner declares exposure: none / heard of it / read some / trained or used. None or "heard of it" are eligible for the primary arm. "Read some" or "trained": not eligible for A5 or A6 of the primary arm (the arm would not be "minus GS"); the person may still write an informed-practitioner variant, labelled and outside H1 and H2. If it turns out after the fact that a practitioner had read GS material and did not say so, the arm is INVALID-DESIGN (decision row v, practitioner independence rule).
2. **No commercial tie, not JC, not an agent.** Relationship to JC recorded: name or role, relationship, paid or unpaid.
3. **Blind brief and order.** The brief is neutral (no GS words, no L list). Task 1 is frozen and hashed before Task 2 is explained; both are frozen before the manifest is shown. This order is what makes "A5 = A6 minus the persistence and enforcement instructions" a deletion, not a rewrite.
4. **Deletion-only check, deterministic.** A script checks that every line of `A5.md` appears in `A6.md` (A5 is a subset). Anything added is flagged for the human reviewer. Rewording that happens to preserve a forbidden idea cannot enter this way.
5. **Leak check M1** (SDX-1-ARMS section 4), on A5, A5-m, A0 and every other arm artifact:
   - instrument 1, the independent human reviewer, classifies each of L1 to L5 as ABSENT, PARTIAL or PRESENT, quoting the sentence;
   - instrument 2, a stateless judge from a different vendor than the generator and than the artifact's author, blind to the arm label, run twice, calibrated first on 10 planted artifacts (A5 with one L sentence inserted for each element, a clean A5, A4's sentinel file, a flat file); the judge is replaced if it misses any;
   - a deterministic lexicon scan (sentinel, spec lock, ledger, ADR, decision record, ratchet, gate, ratify, supersede, "next session", "for future sessions", "keep notes", "update the README", `CLAUDE.md`, `AGENTS.md`, hook, CI) that flags text for the human only, never auto-fails;
   - **paraphrase check**: the judge is told to detect the idea in other words, because a smart practitioner will say "leave a short summary of what you did for whoever touches this next" without any GS word.
   Rule: any PARTIAL or PRESENT from either instrument means the artifact leaks; the practitioner revises (counts against the 3 revisions), both instruments rerun; leak count must be zero at freeze.
6. **Strength check M2**: the independent reviewer fills a checklist (every manifest G item present, no obvious errors, "is this at least as good as you would write if you may not use project documents or enforcement? yes/no and what is missing"); then, in SDX-0, a calibration probe on targeted metrics only (layer-boundary violations, duplication; never the hidden-oracle pass rate). The oracle never tunes A5.
7. **Symmetric firewall.** The practitioner sees outputs of their own arm only, never an oracle number or a contrast. JC does not comment on drafts; communications with the practitioner are kept in writing in a file that goes in the package.
8. **What if the practitioner has read GS material.** Disclose in the logbook, move them to the informed variant, find another person for the primary arm. If nobody else exists before the freeze, the primary human arm is absent and the model arms A5-m carry H1 and H2 explicitly as "model-authored expert prompt", with the human arm owed. Do not hide this in the title of an arm.

### How the result enters the logbook
One block in `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\LOGBOOK\SDX-1.md` under "Roles and independence record" (format in section 6). The artifacts, attestation, hashes, hours and the M1 and M2 results are in the registration package.

## 3. ROLE (b): the critics (design review before freezing)

### Purpose
Remove the blind spots of a design written by its proponents and reviewed only by one model family. Their one job is to attack SDX-1 in both directions: find where it is rigged to favor GS, find where it handicaps GS, and find where it cannot tell us anything. A critic who finds nothing wrong has failed the assignment as much as one who invents problems.

### Who may fill it, and why
- **Primary: models of at least three vendors in every round**, counting Claude as one (Claude is cheap and continuity helps) and requiring at least two non-Anthropic vendors (GPT newest, Gemini newest, plus any other frontier vendor in the Copilot picker). Why models: a stateless critic is the only kind that cannot be influenced by JC's enthusiasm, never tires, costs minutes, and can be run many times; vendor diversity is the whole point, because same-vendor critics share training and agree for shared reasons. Why not only models: models can share blind spots about experimental design (they were all trained on the same literature) and do not carry accountability.
- **Secondary, optional: one human skeptic** with statistical or empirical-software-engineering training who has no stake (the independent reviewer may be the same person, in a different session). Valuable once, before the final round.
- A critic from the same vendor as the generator is allowed but counts as one vendor and its findings are labelled.

### Exact tasks
1. Read ONLY the allowed files: `SDX-1.md`, `SDX-1-ARMS.md`, `EXPERIMENT-PROTOCOL.md`, `DOMAIN_SPEC.md` (the base spec of the invented project). Not the earlier review. Not any chat.
2. Apply the fixed critic prompt (in `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\COPILOT-CRITIC-RUNBOOK.md`): construct validity, favoring GS by construction, handicapping GS, power and statistics, oracle, falsifiability, better hypotheses, anything uninformative.
3. Produce a severity-ranked list. Every finding quotes the passage it targets and proposes a concrete fix.
4. Mandatory sections even if empty: ways the design favors GS by construction; ways it handicaps GS; ways it is unfalsifiable or cannot inform; what would convince you the substrate matters; what would convince you it does not.

### What they must NOT see
`SDX-REVIEW.md` and its raw critic files (earlier critics), any other current critic's output, the chat history of this project, JC's expectations beyond what is in the design files, any run result (none exist), the other repository documents (white paper, compendium, logbook). References inside SDX-1 to files they are not given are to be treated as unavailable; if the missing file matters, the critic says so.

### Deliverable and format
One file per critic session: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\critiques\<vendor>-<modelid>.md` (later rounds add `-r<N>`), fixed schema in the runbook (header with exact model id, files read with SHA-256, findings as blocks with id, severity, category, direction, quoted passage, problem, fix, confidence). Markdown so a script can count severities.

### Time estimate
Model session: 10 to 30 minutes. JC's time per model: about 10 to 20 minutes of driving the Copilot picker. A round of 4 vendors: about 1 to 2 hours of JC. Adjudication of a round: 2 to 4 hours (assistant drafts, JC decides contested items). Revision after a round: half a day to two days depending on how many findings are accepted.

### How independence is ensured
- One fresh session per model, never reused; no memory features; no repository files besides the allowed ones (staging folder or a clean workspace; the runbook says how).
- The fixed prompt is identical for every critic in a round; no critic is shown another's output; they are not asked to respond to each other (critics debating one another trades independence for convergence).
- The critic declares in the file which files it read and with which hashes, and the main PC scans for leakage of earlier findings (a critic that quotes earlier critics' wording, "round 1", or finding ids from earlier review is excluded and rerun).
- Findings are adjudicated by a rule set before the round, not by the identity of the vendor (below).

### Rounds, disagreements, stop rule (summary; full in section 6)
- **Round**: at least 3 vendors (at least 2 non-Anthropic), the same prompt, the same design version (commit recorded).
- **Adjudication** (done within one day of the round, written in a critic log in `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\prereg\SDX-REVIEW.md` as a new section per round): every finding gets one disposition: ACCEPTED (design changed, say where), ACCEPTED-AS-DECLARED-LIMIT (cannot be fixed, text added to the threats section so later critics do not rediscover it), REJECTED (written refutation quoting the passage that shows the finding wrong), or DEFERRED (needs SDX-0 data). A BLOCKER or MAJOR finding is ACCEPTED by default; it can be REJECTED only with a written refutation, and if two or more vendors raised it the refutation needs the human reviewer's sign-off. The assistant that wrote the design drafts the dispositions; because it is the author, nothing is closed on the author's word alone for a BLOCKER.
- **When critics disagree** (one says the design is too lax, another too strict; one says add an arm, another cut it): record both; apply, in order, the tie-break principles (1) the more falsifiable option, (2) the option that is less favorable to GS when otherwise equal, (3) the cheaper option when still equal; if the choice changes an arm, a hypothesis or the primary readout, JC decides and writes one sentence why.
- **Stop rule** (section 6): refinement ends when two consecutive vendor-diverse rounds produce no ACCEPTED BLOCKER, with a maximum of four such rounds, then the final pre-freeze round.

### How the result enters the logbook
Per round: one line in the SDX-1 entry (round number, commit, vendors and exact model ids, counts of findings by severity and disposition, accepted blockers, stop-rule counter) and the critic log in SDX-REVIEW.md. The raw critic files stay in `critiques\` and are part of the registration package (the whole record is public after registration, including rejected findings).

## 4. ROLE (c): the independent reviewer (human)

### Purpose
Remove proponent authorship from the parts of the design a reader can only check by understanding the substance: the change texts, the tags on the content manifest, the mechanical rule that generates the state-dependent probes, the quality and parity of the arm artifacts, and the closing of rejected critic findings.

### Who may fill it, and why
A **human**, named by JC, who is not JC, not the practitioner, not an agent, not the person who built A4, and has no commercial tie to GS. They need to know GS enough to tag the manifest and judge parity (so, unlike the practitioner, being GS-literate is fine; independence here means independence of incentives). Why a human: the role is the second instrument of the leak check and the sign-off for rejecting findings; a model reviewer would be one more model (see role d). A second human is better; one is the minimum.

### Exact tasks
1. Re-tag the manifest of about 25 items as G or L1 to L5, blind to the proponent's tags; disagreements are resolved before the manifest is hashed.
2. Read all ten change texts; write or edit at least 3 of the 10 independently and read the whole list for hidden hints and for steering toward one resolution of a decision point.
3. Check the mechanical rule that enumerates state-dependent probes: apply it independently to the reference implementation's call graph and compare the list.
4. Instrument 1 of the M1 leak check on every arm artifact, blind to arm labels where feasible; fill the M2 strength checklist for A5, A5-m and A6.
5. Read A4's initial substrate prose as a human (vendor-of-author concern) and the parity of artifact content.
6. Sign off, or refuse to sign off, on every refutation of a BLOCKER finding raised by two or more vendors.

### What they must NOT see
Any run result or oracle number, any contrast between arms, any hypothesis-specific prediction from JC, the identity of the arm for artifacts during tagging (labels removed), the other reviewer's tags (if two) until both are done.

### Deliverable and format
`reviewer-report.md`: a table per task (item, finding, quoted sentence, verdict), the tags file (CSV: item id, tag), signed statement of independence (relationship to JC, exposure to GS, hours, tools used), hours.

### Time estimate
6 to 9 hours across the pre-freeze period, spread in three sessions (manifest and change texts; artifacts; sign-offs). Paid, as with the practitioner.

### How independence is ensured
Written independence statement; no communication with the practitioner about their text; no access to results; reviewer files committed with hash before the substrate builder sees the change texts (order in SDX-1-ARMS section 3 step 4); all discussion with JC in writing and kept.

### How the result enters the logbook
Roles and independence record plus the signed report in the package; every disagreement with the proponent's tags or texts listed with how it was settled.

## 5. ROLE (d): the blind judges (during analysis)

### Purpose
Wherever a classification needs judgment rather than a script, keep the generator (Claude) from grading itself or its own family, and keep the arm label from leaking into the judgment. SDX-1 judges no primary metric (SDX-1 section 7): judges serve only for (1) M1 leak and parity classification of artifacts, (2) borderline cases of the deterministic emergent-substrate detector in final repositories (is this file an instruction file, a decision record, a ledger or just a comment), (3) classification of logged events (test deletion or weakening, hook circumvention) that a script flags but cannot decide, and (4) the exploratory split of state-dependent probes into propagation and decision probes, before any run.

### Who may fill it, and why
**Models from a vendor other than the generator and other than the author of the artifact judged** (the generator is Claude; GPT-authored text goes to a Gemini or other non-GPT non-Claude judge; Claude-authored text, if any, to GPT or Gemini). Why: self-preference and same-family agreement; the earlier audit (AX-K5) disagreed by up to 6 points between two runs of the same prompt, so every judgment is run twice and a disagreement goes to the human reviewer. The human reviewer is always the second instrument. Judges are calibrated on planted cases first and replaced if they fail.

### Exact tasks
Receive one item at a time with the rubric (the definitions of L1 to L5 for M1; the pattern definitions for detector cases; the event definition) and return a label plus the quoted evidence. Twice per item, in two fresh sessions.

### What they must NOT see
The arm label (path names and file headers normalized, chain ids replaced by random ones), any oracle result, any contrast between arms, the hypotheses, the decision table, other judges' answers, the previous version of the same item. Honest limit, stated in the registration: blinding to the arm label is not blinding to the arm's identity, because an A4 repository looks like an A4 repository. That is why judges get one file or one event, not a repository, and why no primary metric is judged.

### Deliverable and format
One JSON line per judgment: `{item_id, judge_vendor, judge_model_id, run: 1|2, label, quote, rationale<=40 words}`; an agreement table (kappa) and the list of disagreements with the human's final call.

### Time estimate
Calibration half a day; M1 on about 10 artifacts times 2 runs in under an hour; analysis-stage cases a few hours of wall clock, tens of dollars. Judge route: the main PC has no non-Claude CLI; the judge runs through a JC-provided API key or through the Copilot machine. Owed until one exists (SDX-1 section 13 item 3).

### How independence is ensured
Different vendor from generator and author; fresh session per item and run; calibration on planted artifacts with 100% required; a human second instrument; the judge script and rubric hashed in the package.

### How the result enters the logbook
Judge vendor and exact model ids in the Roles record; agreement and calibration in the M1 result; all disagreements and their resolution in the package.

## 5b. ROLE (e): the independent replicator (after the freeze; added 2026-10-02)

Roles (a) to (d) act before or during the original run. Role (e) acts after the freeze and is not part of the pre-freeze sequence of section 6. Full terms, recruiting text and candidate profile: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\REPLICATOR-BRIEF.md` (Spanish: `REPLICATOR-BRIEF.es.md`).

### Purpose
Remove the last bias no earlier role can remove: that the original team ran the experiment. A person or group with no stake reruns a frozen experiment from the published package and reports what they find, including a null or a contradiction.

### Who may fill it, and why
An independent person or group meeting the independence rules of REPLICATOR-BRIEF section 7 (no commercial tie to GS or PragmaWorks, no close relationship to JC in the last 3 years, funding disclosed, prior exposure to GS declared). They must not be JC, an agent supplied by the original team, the practitioner (a), a critic (b), the reviewer (c) or a judge (d) of the same experiment. Why: a replicator who helped design or judge the experiment replicates their own judgments. Two kinds: type M (model-only, own accounts and tools; direct or conceptual variant) and type H (human participants, own institution).

### Exact tasks
Declare conflicts and funding; verify the frozen package hashes; build and validate the harness (SDX-0 checks); run the generation phase and archive it; register their own analysis plan before any score is produced; score and analyse as frozen; deliver raw data in the fixed schema, a deviations log and a report.

### What they must NOT see
Any outcome of the original (pilot or main) and any advocacy material (white paper, compendium, courses, site) until their own plan is timestamped and their generation is archived; they do not modify any arm artifact, change text, oracle or scaffold. Technical questions only, through one logged channel.

### Deliverable and format
Report, raw data (`sessions`, `snapshots`, `probes`, `events`, `environment` tables), deviations log, signed COI form, own registered analysis plan, archive SHA-256.

### Time estimate
Type M: 40 to 80 person hours, 4 to 8 weeks; the SDX-1 primary contrast about 960 sessions, about $385 to $1,150 (estimate). Type H: 3 to 6 months and funding.

### How independence is ensured
COI declaration before receiving the package; the replicator holds keys, logs and archives; plan registered before scoring; the original team does not take part in runs or analysis and cannot edit, delay or veto the report; no authorship condition.

### How the result enters the logbook
As a separate independent entry with its own id (`<original id>-R<n>`), its own registration and tier, side by side with the original and not pooled unless a pooling rule was registered in advance; the original entry gets a dated note. A contradicting result is handled by REPLICATOR-BRIEF section 14.

## 6. The sequence, the stop rule and the logbook format

Sequence before freeze (a short version of this is in `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\PREREG-HOWTO.md`):

1. **Vendor-diverse critic rounds** (role b) on SDX-1 and SDX-1-ARMS. After each round: adjudicate, revise, commit.
2. **Practitioner artifacts** (role a): human A6, A5, then L appendix and flat file; model-authored A5-m1 and A5-m2 per vendor; then **leak checks** (M1, roles c and d) and **strength checks** (M2).
3. **SDX-0 pilot** (harness validity, cost and variance).
4. **SESOI and n fixed** from SDX-0 data, with written justification.
5. **Final critic round** on the complete package (design with values filled, artifacts, manifest): no accepted BLOCKER allowed.
6. **Freeze**: tag `prereg/SDX-1-v1`, OSF registration of record, Zenodo mirror (JC holds both accounts); first main-run session only after both exist.

**Refinement stop rule** (registered here so the refinement itself cannot loop): the critic phase before SDX-0 ends when TWO CONSECUTIVE vendor-diverse rounds each yield no ACCEPTED BLOCKER, with these precisions. (i) A BLOCKER is a finding that would make the result uninterpretable or biased for or against GS whatever the data say, as judged by the critic, and "accepted" is the adjudication outcome above. (ii) A structural change (an arm, a hypothesis, a readout, the oracle or probe rule, a decision table row) resets the consecutive counter to zero; wording and clarification changes do not. (iii) MAJOR findings do not count toward the rule but each needs a disposition; MINOR and NIT never trigger a round. (iv) Maximum four critic rounds before SDX-0. If round four still has an accepted BLOCKER the process stops and JC chooses one of: freeze with the unresolved blockers written verbatim into the threats section, reduce to the Core scope, or shelve; a fifth round needs a written justification. (v) One more round after SDX-0 (item 5) is mandatory and does not count toward the four; a BLOCKER there allows one targeted re-review limited to the changed parts, at most two final rounds. (vi) Any material change after the final round voids it.

**Logbook format** (append to `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\LOGBOOK\SDX-1.md`, section "Roles and independence record"):

`ROLE | person or exact model id | vendor | exposure to GS (none / heard / read / trained) | relationship to JC | paid | session or date | artifact path and SHA-256 | hours | AI tools disclosed | independence statement path`

and per critic round: `ROUND n | commit | vendors and model ids | findings by severity | accepted / declared-limit / rejected / deferred counts | accepted BLOCKERs | counter (consecutive clean rounds)`.

---

# ESPAÑOL

## 1. Por qué existen estos roles, en un párrafo

Hasta ahora todo lo escribimos los que creemos en el método, y todos los críticos fueron modelos Claude. Un diseño escrito por sus propios defensores puede torcerse a favor de ellos sin que nadie lo quiera: el prompt de control puede ser un hombre de paja, o llevar el método escondido adentro; el sustrato puede estar mejor armado que el control; el oráculo puede premiar justo lo que hace el método; y un revisor que comparte el entrenamiento y los puntos ciegos de los autores está de acuerdo con demasiada facilidad. Cada rol de abajo saca un sesgo con nombre, poniendo una cabeza distinta (otra persona, o un modelo de otro proveedor) justo donde el sesgo se colaría. Ninguno prueba que el diseño esté bien. Hacen mucho más difícil que esté mal, a favor nuestro, sin que alguien lo note.

Los cuatro roles en una tabla:

| Rol | Sesgo que saca | Quién lo cubre (principal) | Secundario | ¿Ve la lista L1 a L5 de GS? |
|---|---|---|---|---|
| (a) PRACTICANTE EXPERTO | el control escrito por el proponente (hombre de paja, o GS disfrazado) | una persona senior que no leyó GS | modelos de otros proveedores, etiquetados A5-m | NO, hasta que los dos primeros entregables estén congelados |
| (b) CRÍTICOS | fallas de diseño y sesgo a favor de GS que ni nosotros ni los críticos Claude vemos | modelos de al menos tres proveedores, sin estado | un escéptico humano, opcional | sí, revisan todo el diseño |
| (c) REVISOR INDEPENDIENTE | textos de cambios, etiquetas del manifiesto, regla de probes y calidad de los artefactos escritos por el proponente | una persona que no sea JC, ni el practicante, ni un agente | ninguno | sí (lo necesita para etiquetar) |
| (d) JUECES CIEGOS | que el generador (Claude) se juzgue a sí mismo o a su familia; que la etiqueta del brazo se filtre en el juicio | modelos de un proveedor distinto al generador y al autor del artefacto | el revisor humano como segundo instrumento | solo la rúbrica |

Palabras con el mismo sentido en todo el documento: **generador** = el modelo que construye Pastura en las corridas (Claude, gama media, CLI sin pantalla). **Proveedor** = la empresa detrás de una familia de modelos (Anthropic, OpenAI, Google, etc.). **Sin estado** = sesión nueva, sin memoria, sin archivos previos, sin historial de chat, sin más herramientas que las que la tarea nombra. **Otro proveedor** = uno que no es el del generador.

## 2. ROL (a): el practicante experto

### Para qué sirve
El brazo A5 ("prompt de experto sin ningún elemento portante de GS") es el comparador de la hipótesis principal H1 (A4 menos A5) y el objeto de H2 (A5 menos ingenuo). Si A5 es flojo, H1 se gana de oficio. Si A5 lleva escondido centinela, libro de specs, registro de decisiones, compuertas o candado, H1 se pierde de oficio y la etiqueta "sin GS" es falsa. El trabajo del practicante es escribir lo que de verdad escribiría un ingeniero fuerte que no conoce GS. También escribe A6 (su prompt natural, sin restricciones) y más tarde el apéndice L (A1) y el archivo plano (A3): el mejor intento del mismo autor de poner contenido GS en un prompt y en un solo archivo.

### Quién puede cubrirlo, y por qué
- **Principal: una persona senior** que usa agentes de código en su trabajo y no leyó material de GS. Por qué una persona: tiene práctica real y hábitos reales, responde por el texto, puede atestiguar que es suyo y puede ser creíblemente "alguien que no conoce GS". Un modelo no puede atestiguar ignorancia con verdad: todos los modelos de frontera absorbieron la literatura actual de guías para agentes, que muchas veces dice "dejá un archivo de notas para la próxima sesión". Un prompt escrito por un modelo tiende entonces a traer instrucciones de persistencia, lo cual ya es un hallazgo, pero no reemplaza a un practicante.
- **Secundario: variantes escritas por modelos de otros proveedores que el generador** (OpenAI, Google, otros del selector de Copilot), etiquetadas **A5-m** (derivada de A6-m por borrado, igual que la A5 de la persona) y **A6-m**. Por qué: son baratas, muestran si el veredicto depende de quién escribe el prompt experto, y un prompt de otro proveedor evita la sospecha de que el generador lee más fácil el estilo de su propia casa. Por qué secundarias: no hay responsabilidad ni atestación, y vale lo dicho del entrenamiento. Van etiquetadas en todas las tablas y nunca se mezclan con el brazo humano.
- Dos subvariantes para modelos, porque hay una decisión sin resolver (qué se les cuenta de la memoria): **A5-m1** (se les dice que el asistente no tiene memoria entre sesiones) y **A5-m2** (no se les dice). Decisión y razones en `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\PRACTITIONER-HANDLING.md`, sección 2. En corto: el brief humano sí se lo dice, así que m1 es paralela al brazo principal; m2 mide cuánto del mecanismo de persistencia gana el prompt solo por contárselo. Se producen las dos; ninguna se esconde.
- Un modelo Claude puede ser una variante extra solo como "mismo proveedor que el generador" y queda afuera de la afirmación sobre autoría por modelos.

### Tareas exactas (persona)
1. Recibe el brief de una página (`C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\HUMAN-PRACTITIONER-BRIEF.md`) y la descripción del producto Pastura (la especificación base). No lee nada de GS antes.
2. **Tarea 1 (da A6):** escribir el mejor prompt que pueda, desde su propia experiencia, que un agente de código recibe al comienzo de cada sesión para construir y extender bien este servicio. Entrega. El texto se hashea (SHA-256) y se congela antes de mostrarle otra cosa.
3. **Tarea 2 (da A5), que se explica recién cuando entregó la Tarea 1:** producir la versión para un brazo donde al agente no se le puede pedir que cree, mantenga ni consulte ningún archivo que no sea código fuente y pruebas automáticas (nada de notas, planes, README, registros de decisiones), ni que instale o exija hooks, CI u otro control. Sacar lo que eso excluye. No cambiar nada más, no agregar nada. Entrega el texto A5 y la lista textual de lo que sacó.
4. Atesta por escrito: el texto es suyo; toda herramienta de IA usada al redactar (nombre, para qué) queda declarada; horas; en qué se apoyó (libros, equipos, experiencia).
5. Más adelante, solo con los dos textos congelados y hasheados: recibe el manifiesto de los cinco elementos portantes como lista neutra y escribe (i) el apéndice L sobre el cuerpo de A5 (brazo A1) y (ii) el mejor archivo de contexto plano (brazo A3), con la consigna "escribí el mejor artefacto posible".
6. Si falla un control declarado de antemano (filtración, fuerza, paridad), revisa. Máximo 3 revisiones por artefacto; cada una anotada con su disparador.

### Qué NO debe ver
GS, Generative Specification, el white paper, el curso, el sitio, el vocabulario de centinela y candado de spec, SDX-1, SDX-1-ARMS, la lista L1 a L5 (hasta el paso 5, y entonces solo como manifiesto), cualquier hipótesis, brazo o tabla de decisión, la lista de cambios (1 a 10), el oráculo y sus probes, cualquier resultado, el texto de otro practicante, cualquier archivo de críticos, A4 (el sustrato). Se le dice la verdad en general ("un experimento sobre asistentes de código que mantienen un proyecto que crece") y que hay un segundo paso corto que se explica después del primero, para que el primero refleje su criterio natural.

### Entregable y formato
Markdown plano, UTF-8, saltos LF, un archivo por artefacto: `A6.md`, `A5.md`, `removed.md` (lista textual de líneas o frases borradas), `attestation.md` (campos de arriba), más tarde `A1-appendix.md`, `A3-flat-file.md`. Los archivos de prompt llevan solo el texto del prompt, sin prólogo ni comentario, para insertarlos tal cual y hashearlos. Guardado: `experiments\sdx1\practitioner\human\` en el worktree una vez congelados; los hashes van en el manifiesto del registro.

### Tiempo estimado
Persona: Tarea 1 de dos a cuatro horas, Tarea 2 de media hora a una hora, apéndice y archivo plano de dos a tres horas, revisiones hasta tres de una hora, atestación 15 minutos. En total unas 6 a 10 horas en una o dos semanas. Muy recomendable pagarle a tarifa de mercado (además deja más limpia la independencia: el riesgo es un vínculo comercial con alguien cercano a GS, no un honorario común). Modelos: minutos por sesión, unos pocos dólares como mucho.

### Cómo se asegura la independencia y que no haya "GS disfrazado"
1. **Selección y registro de exposición.** Antes de empezar declara cuánto vio: nada / oyó hablar / leyó algo / se formó o lo usó. Nada u "oyó hablar" sirven para el brazo principal. "Leyó algo" o "se formó": no sirven para A5 ni A6 del brazo principal (el brazo no sería "sin GS"); puede escribir igual una variante informada, etiquetada y fuera de H1 y H2. Si después se descubre que había leído material de GS y no lo dijo, el brazo es INVALID-DESIGN (fila (v) de la tabla de decisión, regla de independencia del practicante).
2. **Sin vínculo comercial, ni JC, ni un agente.** Se anota la relación con JC: nombre o rol, relación, pago o no.
3. **Brief ciego y orden.** El brief es neutro (sin palabras de GS, sin lista L). La Tarea 1 se congela y hashea antes de explicar la Tarea 2; ambas se congelan antes de mostrar el manifiesto. Ese orden es lo que hace que "A5 = A6 menos las instrucciones de persistencia y control" sea un borrado y no una reescritura.
4. **Chequeo de solo-borrado, determinista.** Un script verifica que cada línea de `A5.md` esté en `A6.md` (A5 es subconjunto). Lo agregado se marca para el revisor humano. Un reescrito que conserve la idea prohibida no puede colarse así.
5. **Chequeo de filtración M1** (SDX-1-ARMS sección 4), sobre A5, A5-m, A0 y todo artefacto de brazo:
   - instrumento 1, el revisor humano independiente, clasifica cada L1 a L5 como AUSENTE, PARCIAL o PRESENTE, citando la frase;
   - instrumento 2, un juez sin estado de un proveedor distinto al generador y al autor del artefacto, ciego a la etiqueta del brazo, corrido dos veces, calibrado antes con 10 artefactos plantados (A5 con una frase L insertada por cada elemento, un A5 limpio, el archivo centinela de A4, un archivo plano); se cambia de juez si falla alguno;
   - un barrido léxico determinista (centinela, candado de spec, libro, ADR, registro de decisiones, ratchet, compuerta, ratificar, reemplazar, "próxima sesión", "para sesiones futuras", "llevá notas", "actualizá el README", `CLAUDE.md`, `AGENTS.md`, hook, CI) que solo marca texto para el humano, nunca descarta solo;
   - **chequeo de paráfrasis**: al juez se le pide detectar la idea dicha con otras palabras, porque un practicante vivo escribe "dejá un resumen breve de lo que hiciste para quien toque esto después" sin una sola palabra de GS.
   Regla: cualquier PARCIAL o PRESENTE de cualquiera de los dos instrumentos significa que el artefacto filtra; el practicante revisa (cuenta contra las 3 revisiones), se vuelven a correr los dos instrumentos; al congelar, las filtraciones deben ser cero.
6. **Chequeo de fuerza M2**: el revisor independiente llena una lista (todos los ítems G del manifiesto presentes, sin errores groseros, "¿esto es por lo menos tan bueno como lo que escribirías si no podés usar documentos de proyecto ni controles? sí/no y qué falta"); después, en SDX-0, una sonda de calibración solo con métricas dirigidas (violaciones de capas, duplicación; nunca la tasa de aciertos del oráculo oculto). El oráculo nunca afina A5.
7. **Cortafuego simétrico.** El practicante ve solo salidas de su propio brazo, nunca un número del oráculo ni un contraste. JC no comenta borradores; la comunicación con el practicante queda por escrito en un archivo que entra en el paquete.
8. **Si el practicante leyó material de GS.** Se declara en el cuaderno, pasa a la variante informada y se busca otra persona para el brazo principal. Si no hay nadie antes del congelamiento, el brazo humano principal falta, y los brazos A5-m cargan H1 y H2 diciéndolo explícitamente ("prompt experto escrito por un modelo"), con el brazo humano pendiente. No se esconde en el nombre del brazo.

### Cómo entra en el cuaderno
Un bloque en `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\LOGBOOK\SDX-1.md`, bajo "Roles and independence record" (formato en la sección 6). Los artefactos, la atestación, los hashes, las horas y los resultados de M1 y M2 van en el paquete de registro.

## 3. ROL (b): los críticos (revisión del diseño antes de congelar)

### Para qué sirve
Sacar los puntos ciegos de un diseño escrito por sus defensores y revisado por una sola familia de modelos. Su único trabajo es atacar SDX-1 en las dos direcciones: encontrar dónde está armado a favor de GS, dónde perjudica a GS, y dónde no puede decirnos nada. Un crítico que no encuentra nada falló la consigna tanto como el que inventa problemas.

### Quién puede cubrirlo, y por qué
- **Principal: modelos de al menos tres proveedores en cada ronda**, contando Claude como uno (es barato y da continuidad) y exigiendo al menos dos que no sean Anthropic (GPT más nuevo, Gemini más nuevo, y cualquier otro proveedor de frontera del selector de Copilot). Por qué modelos: un crítico sin estado es el único que no se deja arrastrar por el entusiasmo de JC, no se cansa, cuesta minutos y se puede repetir; la diversidad de proveedores es todo el punto, porque críticos de la misma casa comparten entrenamiento y coinciden por razones compartidas. Por qué no solo modelos: pueden compartir puntos ciegos de diseño experimental (se formaron con la misma literatura) y no responden por nada.
- **Secundario, opcional: un escéptico humano** con formación estadística o en ingeniería de software empírica y sin intereses (puede ser el mismo revisor independiente, en otra sesión). Vale una vez, antes de la ronda final.
- Un crítico del mismo proveedor que el generador se admite, cuenta como un proveedor y sus hallazgos se etiquetan.

### Tareas exactas
1. Leer SOLO los archivos permitidos: `SDX-1.md`, `SDX-1-ARMS.md`, `EXPERIMENT-PROTOCOL.md`, `DOMAIN_SPEC.md` (la especificación base del proyecto inventado). No la revisión anterior. Ningún chat.
2. Aplicar el prompt fijo de crítico (en `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\COPILOT-CRITIC-RUNBOOK.md`): validez de constructo, sesgo a favor de GS por construcción, perjuicio a GS, potencia y estadística, oráculo, falsabilidad, mejores hipótesis, todo lo que no informe.
3. Producir una lista ordenada por gravedad. Cada hallazgo cita el pasaje al que apunta y propone un arreglo concreto.
4. Secciones obligatorias aunque queden vacías: formas en que el diseño favorece a GS por construcción; formas en que la perjudica; formas en que no se puede falsar o no puede informar; qué te convencería de que el sustrato importa; qué te convencería de que no.

### Qué NO debe ver
`SDX-REVIEW.md` y los archivos crudos de críticos anteriores, la salida de otro crítico de la ronda, el historial de chat de este proyecto, las expectativas de JC más allá de lo que dicen los archivos de diseño, cualquier resultado (no hay), los demás documentos del repositorio (white paper, compendio, cuaderno). Las referencias dentro de SDX-1 a archivos que no se les dan se tratan como no disponibles; si el archivo faltante importa, el crítico lo dice.

### Entregable y formato
Un archivo por sesión de crítico: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\critiques\<proveedor>-<idmodelo>.md` (las rondas siguientes agregan `-r<N>`), esquema fijo en el runbook (encabezado con el id exacto del modelo, archivos leídos con SHA-256, hallazgos en bloques con id, gravedad, categoría, dirección, pasaje citado, problema, arreglo, confianza). Markdown, para que un script cuente gravedades.

### Tiempo estimado
Sesión de modelo: de 10 a 30 minutos. Tiempo de JC por modelo: unos 10 a 20 minutos manejando el selector de Copilot. Una ronda de 4 proveedores: de 1 a 2 horas de JC. Adjudicar una ronda: de 2 a 4 horas (el asistente redacta, JC decide lo discutido). Revisar después de una ronda: de medio día a dos días según cuántos hallazgos se acepten.

### Cómo se asegura la independencia
- Una sesión nueva por modelo, nunca reusada; sin funciones de memoria; sin más archivos del repositorio que los permitidos (carpeta de preparación o espacio de trabajo limpio; el runbook dice cómo).
- El prompt fijo es idéntico para todos los críticos de una ronda; ningún crítico ve la salida de otro; no se les pide que se respondan entre sí (que los críticos debatan cambia independencia por convergencia).
- El crítico declara en el archivo qué archivos leyó y con qué hashes, y en la PC principal se busca si se filtraron hallazgos anteriores (un crítico que cita palabras de críticos previos, "ronda 1" o ids de hallazgos viejos se descarta y se repite).
- Los hallazgos se adjudican con reglas fijadas antes de la ronda, no por la identidad del proveedor (abajo).

### Rondas, desacuerdos, regla de corte (resumen; completo en la sección 6)
- **Ronda**: al menos 3 proveedores (al menos 2 que no sean Anthropic), el mismo prompt, la misma versión del diseño (commit anotado).
- **Adjudicación** (dentro del día siguiente a la ronda, escrita como sección nueva por ronda en `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\prereg\SDX-REVIEW.md`): cada hallazgo recibe una disposición: ACEPTADO (cambió el diseño, dónde), ACEPTADO-COMO-LÍMITE-DECLARADO (no se puede arreglar, se agrega al texto de amenazas para que los críticos siguientes no lo redescubran), RECHAZADO (refutación escrita que cita el pasaje que muestra el error del hallazgo) o DIFERIDO (necesita datos de SDX-0). Un hallazgo BLOCKER o MAJOR se ACEPTA por defecto; solo se RECHAZA con refutación escrita, y si lo levantaron dos o más proveedores la refutación necesita la firma del revisor humano. El asistente que escribió el diseño redacta las disposiciones; como es el autor, un BLOCKER nunca se cierra solo con la palabra del autor.
- **Cuando los críticos discrepan** (uno dice que el diseño es muy laxo, otro muy estricto; uno pide agregar un brazo, otro sacarlo): se anotan los dos; se aplican, en orden, los criterios de desempate (1) la opción más falsable, (2) la opción menos favorable a GS si no hay otra diferencia, (3) la opción más barata si aún empatan; si la elección toca un brazo, una hipótesis o la lectura primaria, decide JC y escribe una frase del porqué.
- **Regla de corte** (sección 6): el refinamiento termina cuando dos rondas seguidas, diversas en proveedores, no dejan ningún BLOCKER aceptado, con un máximo de cuatro rondas, y después la ronda final previa al congelamiento.

### Cómo entra en el cuaderno
Por ronda: una línea en la entrada SDX-1 (número de ronda, commit, proveedores e ids exactos de modelo, cantidad de hallazgos por gravedad y disposición, bloqueantes aceptados, contador de la regla de corte) y el registro de críticos en SDX-REVIEW.md. Los archivos crudos quedan en `critiques\` y forman parte del paquete de registro (todo el historial es público tras el registro, incluidos los hallazgos rechazados).

## 4. ROL (c): el revisor independiente (persona)

### Para qué sirve
Sacar la autoría del proponente de las partes del diseño que solo se pueden chequear entendiendo el fondo: los textos de cambios, las etiquetas del manifiesto de contenido, la regla mecánica que genera los probes dependientes del estado, la calidad y paridad de los artefactos de los brazos, y el cierre de los hallazgos rechazados.

### Quién puede cubrirlo, y por qué
Una **persona**, nombrada por JC, que no es JC, ni el practicante, ni un agente, ni quien armó A4, y sin vínculo comercial con GS. Tiene que conocer GS lo bastante para etiquetar el manifiesto y juzgar la paridad (acá, a diferencia del practicante, conocer GS está bien; independencia quiere decir independencia de intereses). Por qué una persona: es el segundo instrumento del chequeo de filtración y firma los rechazos de hallazgos; un revisor modelo sería un modelo más (ver rol d). Dos personas es mejor; una es el mínimo.

### Tareas exactas
1. Re-etiquetar los unos 25 ítems del manifiesto como G o L1 a L5, ciego a las etiquetas del proponente; los desacuerdos se resuelven antes de hashear el manifiesto.
2. Leer los diez textos de cambio; escribir o editar por lo menos 3 de los 10 de forma independiente y leer toda la lista buscando pistas ocultas y empujones hacia una resolución de un punto de decisión.
3. Chequear la regla mecánica que enumera los probes dependientes del estado: aplicarla por su cuenta al grafo de llamadas de la implementación de referencia y comparar la lista.
4. Instrumento 1 del chequeo M1 sobre cada artefacto de brazo, ciego a las etiquetas donde se pueda; completar la lista de M2 para A5, A5-m y A6.
5. Leer como persona la prosa del sustrato inicial de A4 (preocupación del proveedor del autor) y la paridad de contenido de los artefactos.
6. Firmar, o negarse a firmar, cada refutación de un BLOCKER levantado por dos o más proveedores.

### Qué NO debe ver
Resultados de corridas o números del oráculo, contrastes entre brazos, predicciones específicas de JC sobre hipótesis, la identidad del brazo de cada artefacto mientras etiqueta (etiquetas sacadas), las etiquetas del otro revisor (si son dos) hasta que ambos terminen.

### Entregable y formato
`reviewer-report.md`: una tabla por tarea (ítem, hallazgo, frase citada, veredicto), el archivo de etiquetas (CSV: id de ítem, etiqueta), declaración firmada de independencia (relación con JC, exposición a GS, horas, herramientas usadas), horas.

### Tiempo estimado
De 6 a 9 horas en el período previo al congelamiento, repartidas en tres sesiones (manifiesto y textos de cambio; artefactos; firmas). Pago, igual que el practicante.

### Cómo se asegura la independencia
Declaración escrita de independencia; sin conversación con el practicante sobre su texto; sin acceso a resultados; los archivos del revisor se comitean con hash antes de que quien arma el sustrato vea los textos de cambio (orden en SDX-1-ARMS sección 3 paso 4); toda charla con JC por escrito y guardada.

### Cómo entra en el cuaderno
En el registro de roles e independencia, más el informe firmado en el paquete; cada desacuerdo con las etiquetas o textos del proponente, con cómo se resolvió.

## 5. ROL (d): los jueces ciegos (durante el análisis)

### Para qué sirve
Donde una clasificación pide criterio y no un script, evitar que el generador (Claude) se juzgue a sí mismo o a su familia, y evitar que la etiqueta del brazo se filtre en el juicio. SDX-1 no juzga ninguna métrica primaria (SDX-1 sección 7): los jueces sirven para (1) clasificar filtración y paridad M1 de los artefactos, (2) casos límite del detector determinista de sustrato emergente en los repositorios finales (¿este archivo es un archivo de instrucciones, un registro de decisiones, un libro, o solo un comentario?), (3) clasificar eventos registrados (borrado o debilitamiento de pruebas, evasión de hooks) que un script marca pero no puede decidir, y (4) la división exploratoria de probes dependientes del estado en probes de propagación y de decisión, antes de cualquier corrida.

### Quién puede cubrirlo, y por qué
**Modelos de un proveedor distinto al generador y distinto al autor del artefacto juzgado** (el generador es Claude; el texto de GPT va a un juez de Gemini u otro que no sea GPT ni Claude; un texto de Claude, si lo hubiera, a GPT o Gemini). Por qué: autopreferencia y acuerdo de familia; la auditoría anterior (AX-K5) discrepó hasta 6 puntos entre dos corridas del mismo prompt, así que cada juicio se corre dos veces y el desacuerdo va al revisor humano. El revisor humano es siempre el segundo instrumento. Los jueces se calibran antes con casos plantados y se reemplazan si fallan.

### Tareas exactas
Recibir un ítem por vez con la rúbrica (las definiciones de L1 a L5 para M1; las definiciones de patrón para los casos del detector; la definición del evento) y devolver una etiqueta más la evidencia citada. Dos veces por ítem, en dos sesiones nuevas.

### Qué NO debe ver
La etiqueta del brazo (nombres de ruta y encabezados normalizados, ids de cadena cambiados por azarosos), cualquier resultado del oráculo, cualquier contraste entre brazos, las hipótesis, la tabla de decisión, las respuestas de otros jueces, la versión previa del mismo ítem. Límite honesto, declarado en el registro: ciego a la etiqueta del brazo no es ciego a la identidad del brazo, porque un repositorio A4 se parece a un repositorio A4. Por eso los jueces reciben un archivo o un evento, no un repositorio, y por eso no se juzga ninguna métrica primaria.

### Entregable y formato
Una línea JSON por juicio: `{item_id, judge_vendor, judge_model_id, run: 1|2, label, quote, rationale<=40 palabras}`; una tabla de acuerdo (kappa) y la lista de desacuerdos con la decisión final del humano.

### Tiempo estimado
Calibración medio día; M1 sobre unos 10 artefactos por 2 corridas en menos de una hora; los casos de la etapa de análisis unas horas de reloj y decenas de dólares. Ruta del juez: la PC principal no tiene CLI que no sea Claude; el juez corre con una clave de API que ponga JC o a través de la máquina de Copilot. Está pendiente hasta que exista una (SDX-1 sección 13, punto 3).

### Cómo se asegura la independencia
Distinto proveedor que el generador y que el autor; sesión nueva por ítem y por corrida; calibración con artefactos plantados exigiendo 100%; segundo instrumento humano; script y rúbrica del juez hasheados en el paquete.

### Cómo entra en el cuaderno
Proveedor del juez e ids exactos de modelo en el registro de roles; acuerdo y calibración en el resultado de M1; todos los desacuerdos y su resolución en el paquete.

## 5b. ROL (e): el replicador independiente (después del congelamiento; agregado el 2026-10-02)

Los roles (a) a (d) actúan antes o durante la corrida original. El rol (e) actúa después del congelamiento y no forma parte de la secuencia previa de la sección 6. Términos completos, texto de reclutamiento y perfil de candidatos: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\REPLICATOR-BRIEF.es.md` (inglés: `REPLICATOR-BRIEF.md`).

### Para qué sirve
Sacar el último sesgo que ningún rol anterior puede sacar: que el experimento lo corrió el equipo original. Una persona o un grupo sin interés repite un experimento congelado a partir del paquete publicado e informa lo que encuentre, incluso un resultado nulo o una contradicción.

### Quién puede cubrirlo, y por qué
Una persona o un grupo independiente que cumpla las reglas de independencia de REPLICATOR-BRIEF sección 7 (sin vínculo comercial con GS ni con PragmaWorks, sin relación estrecha con JC en los últimos 3 años, financiamiento declarado, exposición previa a GS declarada). No pueden ser JC, un agente suministrado por el equipo original, el practicante (a), un crítico (b), el revisor (c) ni un juez (d) del mismo experimento. Por qué: un replicador que ayudó a diseñar o a juzgar el experimento replica sus propios juicios. Dos tipos: tipo M (solo con modelos, cuentas y herramientas propias; variante directa o conceptual) y tipo H (participantes humanos, institución propia).

### Tareas exactas
Declarar conflictos y financiamiento; verificar los hashes del paquete congelado; construir y validar el arnés (controles de SDX-0); ejecutar la fase de generación y archivarla; registrar su propio plan de análisis antes de producir cualquier puntuación; puntuar y analizar como está congelado; entregar datos crudos con el esquema fijo, una bitácora de desviaciones y un informe.

### Qué NO debe ver
Ningún resultado del original (piloto o principal) ni material de promoción (libro blanco, compendio, cursos, sitio) hasta que su propio plan tenga sello de tiempo y su generación esté archivada; no modifica ningún artefacto de brazo, texto de cambio, oráculo ni andamio. Solo preguntas técnicas, por un único canal registrado.

### Entregable y formato
Informe, datos crudos (tablas `sessions`, `snapshots`, `probes`, `events`, `environment`), bitácora de desviaciones, formulario de conflicto de interés firmado, su plan de análisis registrado, SHA-256 del archivo.

### Tiempo estimado
Tipo M: 40 a 80 horas-persona, de 4 a 8 semanas; el contraste primario de SDX-1, unas 960 sesiones, unos USD 385 a 1.150 (estimación). Tipo H: de 3 a 6 meses y financiamiento.

### Cómo se asegura la independencia
Declaración de conflicto de interés antes de recibir el paquete; el replicador guarda claves, registros y archivos; plan registrado antes de puntuar; el equipo original no participa en ejecuciones ni análisis y no puede editar, demorar ni vetar el informe; sin condición de autoría.

### Cómo entra en el cuaderno
Como entrada separada e independiente con su propio id (`<id original>-R<n>`), su propio registro y nivel, lado a lado con el original y sin combinar salvo que se haya registrado de antemano una regla de combinación; la entrada original recibe una nota fechada. Un resultado contradictorio se trata según REPLICATOR-BRIEF sección 14.

## 6. La secuencia, la regla de corte y el formato del cuaderno

Secuencia antes de congelar (versión corta en `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\PREREG-HOWTO.md`):

1. **Rondas de críticos diversas en proveedores** (rol b) sobre SDX-1 y SDX-1-ARMS. Después de cada ronda: adjudicar, revisar, comitear.
2. **Artefactos del practicante** (rol a): A6 y A5 de la persona, después apéndice L y archivo plano; A5-m1 y A5-m2 por proveedor; luego **chequeos de filtración** (M1, roles c y d) y **de fuerza** (M2).
3. **Piloto SDX-0** (validez del arnés, costo y varianza).
4. **SESOI y n fijados** con datos de SDX-0, con justificación escrita.
5. **Ronda final de críticos** sobre el paquete completo (diseño con valores cargados, artefactos, manifiesto): no se admite ningún BLOCKER aceptado.
6. **Congelamiento**: etiqueta `prereg/SDX-1-v1`, registro de referencia en OSF, espejo en Zenodo (JC tiene las dos cuentas); la primera sesión de la corrida principal solo después de que existan ambos.

**Regla de corte del refinamiento** (registrada acá para que el refinamiento mismo no se vaya en bucle): la fase de críticos antes de SDX-0 termina cuando DOS RONDAS SEGUIDAS, diversas en proveedores, no dejan ningún BLOCKER ACEPTADO, con estas precisiones. (i) Un BLOCKER es un hallazgo que dejaría el resultado ininterpretable o sesgado a favor o en contra de GS digan lo que digan los datos, según el crítico, y "aceptado" es el resultado de la adjudicación de arriba. (ii) Un cambio estructural (un brazo, una hipótesis, una lectura, la regla del oráculo o de probes, una fila de la tabla de decisión) pone el contador de rondas seguidas en cero; los cambios de redacción y aclaración no. (iii) Los MAJOR no cuentan para la regla pero cada uno necesita disposición; los MINOR y NIT nunca disparan una ronda. (iv) Máximo cuatro rondas de críticos antes de SDX-0. Si en la cuarta aún hay un BLOCKER aceptado, el proceso se detiene y JC elige: congelar con los bloqueantes sin resolver escritos tal cual en la sección de amenazas, bajar al alcance Core, o archivar; una quinta ronda necesita justificación escrita. (v) Una ronda más después de SDX-0 (punto 5) es obligatoria y no cuenta entre las cuatro; un BLOCKER ahí permite una re-revisión puntual limitada a lo cambiado, máximo dos rondas finales. (vi) Todo cambio material después de la ronda final la anula.

**Formato del cuaderno** (agregar a `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\LOGBOOK\SDX-1.md`, sección "Roles and independence record"):

`ROL | persona o id exacto de modelo | proveedor | exposición a GS (nada / oyó / leyó / formado) | relación con JC | pago | sesión o fecha | ruta del artefacto y SHA-256 | horas | herramientas de IA declaradas | ruta de la declaración de independencia`

y por ronda de críticos: `RONDA n | commit | proveedores e ids de modelo | hallazgos por gravedad | cantidades aceptados / límite declarado / rechazados / diferidos | BLOCKERs aceptados | contador (rondas limpias seguidas)`.
