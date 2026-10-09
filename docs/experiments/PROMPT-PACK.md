# Prompt pack: every prompt the experiments use, in one place

Status: reference document, 2026-10-09, branch `experiment-protocol-2026-10-02`. It registers nothing and changes no registration. Every prompt text below was **extracted by script from its source file** (the line range is given beside each block, and the SHA-256 of the source file at extraction), not retyped, so a copy here equals the source on that date. The hash is of the working-copy bytes on the main PC (Windows, so possibly CRLF); to compare from a clone use `git hash-object <file>` on the blob or normalise line endings first. Extraction normalises CRLF to LF. If a source file changes, this pack is rebuilt; the source file governs.

What this pack is for: a person on another PC (or a reviewer) can see, per experiment and per role, which prompt exists, what exactly it says, what the receiving model or person must not see, what it must answer in, and whether it may still be edited. Where an experiment needs a prompt that nobody has written, the gap is listed in section G and not filled, except for four short drafts marked **NEW, review before use** that a runbook step cannot proceed without (section D, end).

Not in this pack by design: the formula texts (long; referenced by path, tag and hash in section E), the fixture briefs (invented products; they are inputs, not prompts; the confirmatory ones are not to be opened early, see the FX-1 runbook), and the hidden tests.

## How to read an entry

Each entry gives: **id**, **role** (critic, practitioner or expert-prompt author, judge, auditor, generator, harness script), **used by** (experiment), **purpose**, **source** (file and branch), **must NOT see**, **output schema**, **edit rule after registration**, **status** (WRITTEN, SPEC ONLY, MISSING, NEW), then the exact text in a fenced block. The fences use `~~~~` so that the Markdown inside the prompts (including ``` blocks) is preserved.

## Rules that apply to every prompt in this pack

1. **A prompt that is hashed in a freeze list is never edited.** FX-1.md section 15 lists "the neutral build prompt and the F0 and CHK prompts", "the harness and dry-check scripts" and the formula texts among the hashed items; the SDX-8 and SDX-9 registration packages and CMP-1 and REM-1 hash their scripted replies, answer sheets and arm texts in the same way. Bracketed values (`[FROM FX-0]`, `[AT FREEZE]`) are filled before freezing and "no value may change after". A change is a new version with a new id, a dated line in the logbook, and (FX-1 section 10 row (v)) a change in mid-window makes the affected part `INVALID-DESIGN`.
2. **Critic prompts are identical for every critic of a round** and are followed exactly (`ROLES.md` section 3: "The fixed prompt is identical for every critic in a round; no critic is shown another's output"). Edits between rounds are allowed only as a recorded new round; a structural change resets the stop-rule count (`LOGBOOK/README.md`).
3. **Practitioner texts (A5, A6, X, C, K)** are written by an external, blind author, hashed at delivery and not edited. At most three revisions per artifact, triggered only by a failed check, never by an outcome (SDX-1-ARMS.md line 57). Nobody on the GS side writes or edits them "as if independent" (SDX-1-ARMS.md line 47).
4. **The frozen formula version.** The formulas under test are an **annotated git tag** of the formulas repository (FX-1.md section 13 item 1), with the English text and the registered neutral-Spanish text each hashed and a coverage map (element to step). During FX-0 the formula author may revise each formula text **at most three times**, each revision triggered only by an element whose Wilson upper bound is below 0.90 in a stream, made after reading the failing transcripts and never a rate comparison between vendors, each listed with its trigger in the logbook before FX-1 is frozen. After the freeze the text is not changed; a change mid-window makes the affected stream `INVALID-DESIGN`. As of this pack, **no such frozen tag exists**: the only tag is `formulas-2026-10-05`, a lightweight tag (`commit` object) on the same commit as the branch head, so it is a bookmark, not a freeze.
5. **Prompts that name a vendor tool** (the Copilot critic runbooks) are for the Copilot agent on the second PC; they do not carry a model identity. The model id is asked at the start (`MODEL_ID_AS_SHOWN`) and recorded verbatim.
6. **Prompts must not carry the answer.** A critic prompt names no earlier finding; a generator prompt names no GS element in the neutral and F0 arms; a practitioner brief does not mention the method.

## Index (all entries)

| Id | Role | Used by | What | Status |
|---|---|---|---|---|
| `PP-CRIT-SDX1` | critic | SDX-1 (also the pattern of every other critic round) | SDX-1 design critic (Copilot, one critique per model) | WRITTEN, used |
| `PP-CRIT-FX1` | critic | FX-1 | FX-1 study and checker critic (Copilot) | WRITTEN |
| `PP-CRIT-SDX89` | critic | SDX-8, SDX-9 | SDX-8 and SDX-9 design critic (Copilot) | WRITTEN |
| `PP-CRIT-CMP1` | critic | CMP-1 | CMP-1 critic prompt as run on two fresh Claude critics | WRITTEN but a Claude-only round |
| `PP-CRIT-WP5-1` | critic | White paper 5.0 review (not a numbered experiment) | White paper 5.0 critic, role 1: harsh critic | WRITTEN |
| `PP-CRIT-WP5-2` | critic | White paper 5.0 review (not a numbered experiment) | White paper 5.0 critic, role 2: constructive editor | WRITTEN |
| `PP-CRIT-WP5-3` | critic | White paper 5.0 review (not a numbered experiment) | White paper 5.0 critic, role 3: field-context placer (web search allowed) | WRITTEN |
| `PP-CRIT-WP5-4` | critic | White paper 5.0 review (not a numbered experiment) | White paper 5.0 critic, role 4: practitioner/leader | WRITTEN |
| `PP-CRIT-WP5-5` | critic | White paper 5.0 review (not a numbered experiment) | White paper 5.0 critic, role 5: academic SE researcher | WRITTEN |
| `PP-CRIT-WP5-6` | critic | White paper 5.0 review (not a numbered experiment) | White paper 5.0 critic, role 6: clarity / non-insider reader | WRITTEN |
| `PP-CRIT-FN-1` | critic | Functions abstraction review (not a numbered experiment) | Functions-of-GS abstraction critic, role 1: deriver (unprimed, run 3 times per model) | WRITTEN |
| `PP-CRIT-FN-2` | critic | Functions abstraction review (not a numbered experiment) | Functions-of-GS abstraction critic, role 2: taxonomist (primed, first version) | WRITTEN |
| `PP-CRIT-FN-3` | critic | Functions abstraction review (not a numbered experiment) | Functions-of-GS abstraction critic, role 3: skeptic (primed) | WRITTEN |
| `PP-CRIT-FN-4` | critic | Functions abstraction review (not a numbered experiment) | Functions-of-GS abstraction critic, role 4: taxonomist-r2 (primed, revised five functions; the file name in the runbook says deriver-r2 in one place) | WRITTEN |
| `PP-CRIT-FN-5` | critic | Functions abstraction review (not a numbered experiment) | Functions-of-GS abstraction critic, role 5: frameworks (web allowed) | WRITTEN |
| `PP-CRIT-FN-6` | critic | Functions abstraction review (not a numbered experiment) | Functions-of-GS abstraction critic, role 6: lifecycle-lit (web allowed) | WRITTEN |
| `PP-PRAC-A6` | practitioner / expert prompt author | SDX-0, SDX-1, SDX-8, SDX-9 (inherit A5/A6) | Senior-engineer session, step 1 (produces A6; the whole file is the prompt) | WRITTEN |
| `PP-PRAC-A5-STEP2` | practitioner / expert prompt author | SDX-0, SDX-1, SDX-8, SDX-9 | Step 2 message: reduce A6 to A5 (pasted as the second message) | WRITTEN |
| `PP-PRAC-HUMAN` | practitioner / expert prompt author | SDX-1, SDX-0 | Human senior-engineer brief (English; the Spanish half is in the same file) | WRITTEN with 2 open placeholders for JC (fee/payment, licence confirmation) |
| `PP-PRAC-SDX1-TASKS` | practitioner / expert prompt author | SDX-1, SDX-8, SDX-9 | The two practitioner tasks as registered in SDX-1-ARMS (short form) | WRITTEN (registered wording) |
| `PP-JUDGE-SDX1-LEAK` | judge | SDX-1, SDX-0 | SDX-1 leak and parity judge (M1), checks J1 to J5 - SPECIFICATION ONLY, no final prompt text exists | SPEC ONLY |
| `PP-AUD-AX` | auditor | AX, AX2, AX-K5 | AX/AX2 seven-property project auditor (embedded in code) | WRITTEN (historical, already used; its experiments are closed and backfilled) |
| `PP-FX1-F0` | generator | FX-1 | F0 attribution-control sentence | WRITTEN (sentence) |
| `PP-FX1-NEUTRAL` | generator | FX-1 | Neutral build prompt (path B step 1), English as registered | WRITTEN (English) |
| `PP-FX1-REPLY` | harness script (scripted human reply) | FX-1 | Single fixed reply when the agent asks a question (English, registered) | WRITTEN |
| `PP-FX1-HARNESS-ES` | harness script (scripted human replies and build prompt) | FX-1 development loop 2 (and FX-0, if the harness is reused unchanged) | Development-loop scripted messages, English and Spanish (RATIFY, DECIDE, CONT, NEUTRAL) | WRITTEN in code, not in a registered file |
| `PP-SDX9-FIXED` | harness script (fixed texts) | SDX-9 | SDX-9 fixed protocol texts: claim line, question channel, default answer, confirmation session | WRITTEN (fragments) |
| `PP-SDX8-FIXED` | generator (arm text fragments) | SDX-8, SDX-9 (reuses the gate brief) | SDX-8 fixed fragments: generic gate brief, planted cost control, commit instruction | WRITTEN (fragments) |
| `PP-CMP1-OPERATOR` | harness script (scripted operator) | CMP-1 | CMP-1 operator sentences (question, continue, review points) | WRITTEN (fragments) |
| `PP-NEW-PROBE` | generator / probe | FX-1 | Vendor adapter isolation probe (dry run) | **NEW, review before use** |
| `PP-NEW-F0-WRAP` | generator / probe | FX-1 | F0 wrapper for path A and path B | **NEW, review before use** |
| `PP-NEW-CHK` | generator / probe | FX-1 | CHK arm prompt (checklist as plain requirements) | **NEW, review before use** |
| `PP-NEW-CANARY` | generator / probe | FX-1 | FX-1 canary probe (per fixture and vendor) | **NEW, review before use** |

Experiments with **no registered prompts yet** (proposals): P1 to P4 (registrations not written), HR-1 (extension of P2, no registration), SDX-3 (described in `HYPOTHESES-2026-10-02.md`), see section G.

## Coverage by experiment and role (W = written text exists in a file, S = spec only, M = missing, - = not applicable)

| Experiment | Critic | Practitioner / expert | Judge | Auditor | Generator / arm text | Harness replies |
|---|---|---|---|---|---|---|
| FX-0 and FX-1 | W (FX1 runbook) | - | M (secondary judges; human auditor has a form owed) | human, form owed | W (formulas; F0 sentence, neutral prompt) ; CHK, F0 wrapper, canary NEW | W (English reply in prereg; EN and ES in dev harness, not in git) |
| SDX-0 and SDX-1 | W | W (A6 runbook, step 2, human brief); no practitioner output exists | S (M1/leak judge J1-J5); calibration set M | M | M (A0 task wrapper, 10 change texts, D1/D2 replies, A1, A3, A4 substrate) | M |
| SDX-8 | W (SDX-8-9 runbook) | W (reuses SDX-1 A5) | M (several) | M (escape audit) | fragments only (gate brief, A5-read, commit line) ; 30 change texts, ballast brief M | M |
| SDX-9 | W (SDX-8-9 runbook) | W (reuses A5) | M (several) | M | fragments only ; spec package, stage definitions, nudge M | W (claim line, question channel, confirmation) |
| CMP-1 | W (raw prompt, Claude only; no Copilot runbook) | M (K and B practitioner prompts) | M (gaming-diff, pairwise maintainability, planted-flaw set) | - | M (preamble verbatim, brief, 10 changes, traps) ; formulas by tag | W (operator sentences) |
| E2E-1 | M (prompt not saved; no runbook) | M (X expert prompt) | M | M | M | M |
| REM-1 | M (prompt not saved) | M (arm C practitioner prompt) | M | M | M (wrapper preamble, items, generator) | partly (retry rule only) |
| HR-1, P1 to P4 | none registered | none | none | none | none | none |
| White paper 5.0 | W (6 roles) | - | - | - | - | - |
| Functions abstraction | W (6 roles) | - | - | - | - | - |
| AX, AX2, CR, RX, SX, KX, NX, MX, BX, CX, EX, RND-1 (closed, backfilled) | see section F | see section F | one embedded auditor prompt (AX); others M | - | W (prompt folders) | - |


## A. Critic prompts

### PP-CRIT-SDX1: SDX-1 design critic (Copilot, one critique per model)

- **Role:** critic
- **Used by:** SDX-1 (also the pattern of every other critic round)
- **Purpose:** Adversarial, both-direction review of the SDX-1 draft preregistration, one stateless critic per model.
- **Source (copy extracted by script, not retyped):** `docs/experiments/COPILOT-CRITIC-RUNBOOK.md` on branch `experiment-protocol-2026-10-02`; source file SHA-256 at extraction `4520e36c866a4148...`
- **Must NOT see:** Everything except the allowed files of runbook section 2 (full list quoted under "Critic rounds" below): in particular no earlier review of the same design, no logbook, no papers, no other critic file, no other repository file.
- **Integrity notes:** Runbook section 4, quoted under "Critic rounds" below. One fresh chat per model; one critique per session.
- **Output schema:** The fenced schema below (the main PC counts severities by script, so headings and field names must not change).
- **Edit rule after registration:** Not edited once hashed in the freeze list (rules 1 to 4 above); a change is a new version with a new id and a dated logbook note. Until registration the status line governs.
- **Status:** WRITTEN, used. Vendor-diverse round 1 pending as of the survey.

**Drive message (JC pastes this one line, nothing else)** (line 7)

~~~~text
Follow the file docs/experiments/COPILOT-CRITIC-RUNBOOK.md in this repository from section 0.
~~~~

**Critic prompt (fixed)** (lines 46-62)

~~~~text
**ROLE.** You are an adversarial reviewer of an experiment design: a draft preregistration, written by the proponents of a software-engineering method called Generative Specification (GS), that tests whether a persistent, structured, enforced project "substrate" (arm A4) helps an AI coding agent keep a growing project correct, compared with an expert prompt that contains none of the method's load-bearing elements (arm A5), a naive prompt (A0), and other arms. The authors have a stake in the answer and they have said so. They asked you for hostile, honest, independent review in BOTH directions: find where the design is rigged in favor of the method, find where it is rigged or handicapped against the method, and find where it cannot tell anybody anything. Reporting no problems is a failure of the assignment; so is inventing problems you cannot quote. You have no memory of earlier reviews and you are not shown any. Do not defer to the authors' own descriptions of their mitigations: check whether each mitigation actually works. Do not repeat a limit the design already declares unless you argue the declared mitigation fails.

**WHAT TO EXAMINE** (cover all of these; add others you find):
1. Construct validity: does each arm isolate what the design says it isolates? Is the "load-bearing list" (L1 to L5) defined independently of the outcome, or by the proponents in a way that makes A5 a strawman or the substrate a bundle of arbitrary parts? Does the constraint on A5 handicap it? Is "state-dependent" separable from "state-independent" in practice? Does the 10-change invented project, and the placement of its decision points, supersession and reversal, measure the claimed construct or only the situation the method was built for?
2. Favoring GS by construction: every place where authorship, ordering, scripted replies, probe selection, oracle design, content parity, retry rules, scoring rules, covariate choice, controls or the decision table make a GS-favorable outcome more likely than the underlying truth would. Include effects of who builds which arm, which arm's artifact is longer or better crafted, and whether INVALID-DESIGN triggers are symmetric (can the authors declare an unfavorable result invalid more easily than a favorable one?).
3. Handicapping GS, or rigging against it: places where the design could show no effect or a negative effect for reasons that do not concern the method (scale too small, gates adding friction in headless sessions, one mid-tier model, toy size, forbidden behaviors, scoring that counts gate blocks as failure, and so on).
4. Power and statistics: the primary and co-primary readouts, the covariate adjustment (is the covariate itself affected by the arm?), conditional scoring on antecedent behavior, the collapse rule, multiplicity, the equivalence procedure and the SESOI, the sample-size reasoning, interim looks, any avoidable analytic freedom.
5. Oracle and measurement: sealed hidden probes, status-class tolerance, reference implementation, how probes are tagged state-dependent, whether the oracle can reward one resolution of a decision point, whether it can be gamed, whether anything measured is itself targeted by the treatment.
6. Falsifiability and informativeness: is there any result that would make the authors change their mind, as written? Which decision-table rows are reachable, which are escape hatches? What is the most probable outcome of this design and would it change any decision? Does the cost buy information?
7. Better hypotheses: up to three hypotheses or designs that would be more informative than the current ones for the same budget, with the reason.
8. Anything else uninformative, circular, or confusing for a future reader of the registration.

**RULES OF THE REVIEW.** Quote exactly: every finding must quote (verbatim, in quotation marks) the passage it targets and name the file and the section. Every finding must propose a concrete fix (a changed sentence, a changed rule, an added control, a changed number with a reason), not just a complaint. Rank by severity. Be specific, not general: "the oracle may be gameable" is not a finding; "section 6 allows status-class tolerance, so a server that returns 4xx on every state-dependent probe passes 50% of them; fix: ..." is. Do not praise. You may state what you checked and found sound in one sentence in section 6. At most 30 findings; merge near-duplicates.

**SEVERITY.** BLOCKER: as written, the result would be uninterpretable, or biased for or against the method whatever the data say, or the design cannot be falsified; it must be fixed before the registration is frozen. MAJOR: materially weakens a conclusion or inflates its permitted claim; needs a fix or an explicit declared limit. MINOR: a real defect with limited effect. NIT: wording, ordering, clarity.

**OUTPUT.** Write exactly the schema in section 5 below, in one Markdown file. No preface, no closing remarks outside the schema.
~~~~

**Output schema (the agent writes exactly this)** (lines 80-134)

~~~~text
# SDX-1 critique: <VENDOR> <MODEL_ID_AS_SHOWN>

## 0. Header
- VENDOR: <vendor word>
- MODEL_ID_AS_SHOWN: <exact string JC gave>
- HARNESS: github-copilot-agent-vscode
- ROUND: <n>
- DATE_UTC: <ISO 8601>
- REPO_HEAD: <git rev-parse HEAD>
- BRANCH: experiment-protocol-2026-10-02
- FILES_READ:
  - docs/experiments/prereg/SDX-1.md  sha256=<hex>
  - docs/experiments/prereg/SDX-1-ARMS.md  sha256=<hex>
  - docs/experiments/EXPERIMENT-PROTOCOL.md  sha256=<hex>
  - experiments/cr/benchmark/DOMAIN_SPEC.md  sha256=<hex>
- FILES_NOT_READ_ATTESTATION: I read no other file and used no tool other than reading these files and the git and hash commands.
- PRIOR_EXPOSURE: none | <describe>
- NOTES: <anything odd about the session: truncation, tool limits, context cut>

## 1. Verdict in at most five sentences
<Would you register this design as written? What is the single most important thing wrong with it?>

## 2. Findings (ranked: all BLOCKER first, then MAJOR, MINOR, NIT)
### F-01
- SEVERITY: BLOCKER | MAJOR | MINOR | NIT
- CATEGORY: construct-validity | favors-GS | handicaps-GS | power-stats | oracle | falsifiability | informativeness | better-hypothesis | procedure | other
- DIRECTION: FAVORS-GS | HANDICAPS-GS | NEUTRAL-DEFECT | UNINFORMATIVE
- FILE_AND_SECTION: <file, section number or heading>
- QUOTE: "<verbatim passage>"
- PROBLEM: <what is wrong, and why it matters to the conclusion; at most 120 words>
- FIX: <concrete change; at most 80 words>
- CONFIDENCE: low | medium | high
(repeat ### F-02, F-03 ...)

## 3. Mandatory sections (write "none found" only after listing what you tried)
### 3a. Ways the design favors GS by construction
<bulleted list, each bullet references an F-nn id or says "not raised as a finding because ...">
### 3b. Ways the design handicaps GS, or is rigged against it
<same>
### 3c. Ways the design is unfalsifiable, cannot inform, or has a modal outcome that changes no decision
<same>

## 4. Better hypotheses (at most three)
### H-A, H-B, H-C
- STATEMENT:
- WHY MORE INFORMATIVE:
- WHAT IT NEEDS (arms, n, readout):

## 5. Convince-me statements
- WHAT RESULT WOULD CONVINCE ME THE SUBSTRATE MATTERS: <specific, measurable, in terms of this design's readouts or a modified design>
- WHAT RESULT WOULD CONVINCE ME IT DOES NOT: <same>
- WHAT THE DESIGN AS WRITTEN WOULD NEED, SO THAT BOTH OF THE ABOVE ARE POSSIBLE: <one paragraph>

## 6. What I could not assess, and what I checked and found sound
<short>
~~~~

### PP-CRIT-FX1: FX-1 study and checker critic (Copilot)

- **Role:** critic
- **Used by:** FX-1
- **Purpose:** Adversarial review of the FX-1 reliability study and the gs-check conformance checker, in both directions (overstates and understates success).
- **Source (copy extracted by script, not retyped):** `docs/experiments/COPILOT-CRITIC-RUNBOOK-FX1.md` on branch `experiment-protocol-2026-10-02`; source file SHA-256 at extraction `823dac7c892b14e3...`
- **Must NOT see:** Everything except the allowed files of runbook section 2 (full list quoted under "Critic rounds" below): in particular no earlier review of the same design, no logbook, no papers, no other critic file, no other repository file.
- **Integrity notes:** Runbook section 4, quoted under "Critic rounds" below. One fresh chat per model; one critique per session.
- **Output schema:** The fenced schema below (the main PC counts severities by script, so headings and field names must not change).
- **Edit rule after registration:** Not edited once hashed in the freeze list (rules 1 to 4 above); a change is a new version with a new id and a dated logbook note. Until registration the status line governs.
- **Status:** WRITTEN. Run by two Claude critics (hash of the runbook recorded in their FILES_READ); vendor-diverse round OWED.

**Drive message (JC pastes this one line, nothing else)** (line 9)

~~~~text
Follow the file docs/experiments/COPILOT-CRITIC-RUNBOOK-FX1.md in this repository from section 0.
~~~~

**Critic prompt (fixed)** (lines 46-64)

~~~~text
**ROLE.** You are an adversarial reviewer of a study design and of a measuring instrument. The study (FX-1) was written by the proponents of a software-engineering method called Generative Specification (GS). It estimates how often following the method's canonical prompt templates ("formulas") produces a repository in which twelve required elements (a "substrate") are each present and working, across five invented project types, three model vendors, two entry paths and two prompt languages. The instrument is a deterministic checker that clones a repository, runs its tests, plants violations and tries to commit them. The authors have a stake in the answer and have said so. They asked for hostile, honest, independent review in BOTH directions: find where the study or the checker would overstate success (a lenient checker, a gameable element, thresholds that make success likely), where they would understate it (a harsh or brittle checker, unreachable bars), and where the design cannot tell anybody anything. Reporting no problems is a failure of the assignment; so is inventing problems you cannot quote. You have no memory of earlier reviews and none is shown. Do not defer to the authors' descriptions of their mitigations: check whether each works. Do not repeat a limit the design already declares unless you argue the declared mitigation fails.

**WHAT TO EXAMINE** (cover all; add others you find):
1. Estimation design: are the estimands, the thresholds (0.90 per element, 0.80 for all twelve), the "high confidence" definition and the three interval methods sound and justified? Is the unit of analysis right given runs share fixtures and vendors? Is the intersection-union argument for the conjunctive claim correct? Check the simulation's logic and the numbers quoted from it against `results.md`; say what n, if any, you would choose and why.
2. Informativeness: what is the most probable result, would it change a decision, and what is the real probability that the headline question is answered decisively? Are the pessimistic, central and optimistic assumptions plausible, and is the central one honest?
3. Checker validity, leniency: for each of the twelve elements, how could an agent (or a lazy formula) produce a repository that gets `PASS` without the element truly being present and working? Name concrete gaming routes against the stated rules and thresholds. Include the structural-versus-semantic gap.
4. Checker validity, harshness and brittleness: for each element, how could a correct, well-built repository get a non-`PASS` (heuristics on headings, ids, paths, README commands, stack assumptions, Windows versus Linux, network, timing, hooks that need a tool the sandbox lacks, projects that use a different convention for the same thing)? Does the language-neutral and stack-neutral claim hold across the five fixtures and the Spanish stream?
5. The controls: do the positive, negative and gaming controls and the audit plan establish that the checker is valid before the study? What is missing? Are the declared dependency expectations circular?
6. The failure taxonomy (checker fault, infrastructure fault, formula failure, model failure, project-type failure): can the rules be applied mechanically, can they be gamed in either direction, do they leave a loophole that rescues the formulas or condemns them?
7. Fixtures, arms and procedure: independence and memorization of the briefs; whether F0 and CHK separate the causes as claimed; scripted answers; entry path B (MVP then formulas); the Spanish stream; mid-tier-only scope; ITT treatment of capped runs.
8. The decision table: unreachable or escape-hatch rows, missing rows, forbidden claims that are too weak, and the downstream statements about SDX-1 and P1 to P4 and about what may be published on a site.
9. Better designs: up to three hypotheses or designs more informative for the same budget.
10. Anything else uninformative, circular or confusing for a future reader.

**RULES OF THE REVIEW.** Quote exactly: every finding quotes (verbatim, in quotation marks) the passage it targets and names the file and section. Every finding proposes a concrete fix (a changed sentence, rule, control or number with a reason). Rank by severity. Be specific: "the checker may be gameable" is not a finding; "E06 passes if a tracked file named ratchet.json holds a number and a script named like a gate fails when the number is set to 1e9, so a script that always exits 1 on a changed ratchet file passes; fix: ..." is. Do not praise. You may state what you checked and found sound in one sentence in section 6. At most 30 findings; merge near-duplicates.

**SEVERITY.** BLOCKER: as written the result would be uninterpretable, or biased for or against the formulas whatever the data say, or the instrument cannot be trusted; fix before freeze. MAJOR: materially weakens a conclusion or inflates the permitted claim; needs a fix or an explicit declared limit. MINOR: real defect with limited effect. NIT: wording.

**OUTPUT.** Write exactly the schema in section 5, in one Markdown file. No preface, no closing remarks outside the schema.
~~~~

**Output schema (the agent writes exactly this)** (lines 82-133)

~~~~text
# FX-1 critique: <VENDOR> <MODEL_ID_AS_SHOWN>

## 0. Header
- VENDOR: <vendor word>
- MODEL_ID_AS_SHOWN: <exact string JC gave>
- HARNESS: github-copilot-agent-vscode
- ROUND: <n>
- DATE_UTC: <ISO 8601>
- REPO_HEAD: <git rev-parse HEAD>
- BRANCH: experiment-protocol-2026-10-02
- FILES_READ:
  - <path>  sha256=<hex>   (one line per allowed file)
- FILES_NOT_READ_ATTESTATION: I read no other file and used no tool other than reading these files and the git and hash commands.
- PRIOR_EXPOSURE: none | <describe>
- NOTES: <anything odd about the session>

## 1. Verdict in at most five sentences
<Would you register this design as written? What is the single most important thing wrong with it? Would you trust the checker's PASS?>

## 2. Findings (ranked: all BLOCKER first, then MAJOR, MINOR, NIT)
### F-01
- SEVERITY: BLOCKER | MAJOR | MINOR | NIT
- CATEGORY: estimation | informativeness | checker-leniency | checker-harshness | controls | failure-taxonomy | fixtures | decision-table | better-design | procedure | other
- DIRECTION: OVERSTATES-SUCCESS | UNDERSTATES-SUCCESS | NEUTRAL-DEFECT | UNINFORMATIVE
- FILE_AND_SECTION: <file, section number or heading>
- QUOTE: "<verbatim passage>"
- PROBLEM: <what is wrong and why it matters; at most 120 words>
- FIX: <concrete change; at most 80 words>
- CONFIDENCE: low | medium | high
(repeat ### F-02, F-03 ...)

## 3. Mandatory sections (write "none found" only after listing what you tried)
### 3a. Ways the study or the checker would overstate success
<bulleted, each referencing an F-nn id or saying "not raised as a finding because ...">
### 3b. Ways the study or the checker would understate success
<same>
### 3c. Ways the study is unfalsifiable, cannot inform, or has a modal outcome that changes no decision
<same>

## 4. Better designs (at most three)
### H-A, H-B, H-C
- STATEMENT:
- WHY MORE INFORMATIVE:
- WHAT IT NEEDS (arms, n, readout):

## 5. Convince-me statements
- WHAT RESULT WOULD CONVINCE ME THE FORMULAS PRODUCE A COMPLETE, WORKING SUBSTRATE:
- WHAT RESULT WOULD CONVINCE ME THEY DO NOT:
- WHAT THE DESIGN AS WRITTEN WOULD NEED, SO THAT BOTH ARE POSSIBLE: <one paragraph>

## 6. What I could not assess, and what I checked and found sound
<short>
~~~~

### PP-CRIT-SDX89: SDX-8 and SDX-9 design critic (Copilot)

- **Role:** critic
- **Used by:** SDX-8; SDX-9
- **Purpose:** Adversarial review of the two draft preregistrations (long-chain crossover, spec-to-verified-COMPLETE stages).
- **Source (copy extracted by script, not retyped):** `docs/experiments/COPILOT-CRITIC-RUNBOOK-SDX-8-9.md` on branch `experiment-protocol-2026-10-02`; source file SHA-256 at extraction `78d0f7e7a8a19de1...`
- **Must NOT see:** Everything except the allowed files of runbook section 2 (full list quoted under "Critic rounds" below): in particular no earlier review of the same design, no logbook, no papers, no other critic file, no other repository file.
- **Integrity notes:** Runbook section 4, quoted under "Critic rounds" below. One fresh chat per model; one critique per session.
- **Output schema:** The fenced schema below (the main PC counts severities by script, so headings and field names must not change).
- **Edit rule after registration:** Not edited once hashed in the freeze list (rules 1 to 4 above); a change is a new version with a new id and a dated logbook note. Until registration the status line governs.
- **Status:** WRITTEN. Two Claude critics only; vendor-diverse review OWED.

**Drive message (JC pastes this one line, nothing else)** (line 11)

~~~~text
Follow the file docs/experiments/COPILOT-CRITIC-RUNBOOK-SDX-8-9.md in this repository from section 0.
~~~~

**Critic prompt (fixed)** (lines 40-58)

~~~~text
**ROLE.** You are an adversarial reviewer of two experiment designs: draft preregistrations, written by the proponents of a software-engineering method called Generative Specification (GS), that test whether a persistent, structured, enforced project "substrate" (arm A4 or C4) pays for its own overhead when an AI coding agent works on a growing project (SDX-8: 30 scripted changes with inherited "ballast" code, a registered crossover in change index) or builds a project from a fixed reviewed specification in stages (SDX-9: stage scorer, margins, registered crossover stage). The comparators are an expert prompt without the method's load-bearing elements, a naive prompt, an expert prompt plus a generic must-pass hook, and (SDX-9) the same substrate with advisory gates. The authors have a stake in the answer and have said so. They asked for hostile, honest, independent review in BOTH directions: find where the design is rigged in favour of the method, find where it is rigged or handicapped against the method, and find where it cannot tell anybody anything. Reporting no problems is a failure of the assignment; so is inventing problems you cannot quote. You have no memory of earlier reviews and are not shown any. Do not defer to the authors' own descriptions of their mitigations: check whether each mitigation actually works. Do not repeat a limit the design already declares unless you argue the declared mitigation fails.

**WHAT TO EXAMINE** (cover all; add others you find):
1. Construct validity: does the primary readout measure what the title claims? SDX-8: is "marginal cost per durably accepted change" and "net cumulative cost per durably accepted change" a fair measure of "does the overhead pay off as the repository grows"? Does the ballast create a growth regime without favouring or handicapping an arm? SDX-9: does a frozen scorer's "verified stage" measure completeness, and do the stage definitions, thresholds, tagging rule and the escape band mean what they claim?
2. The crossover as a registered test: is the crossover really pre-registered and not post-hoc (checkpoints, comparators, direction, order, alpha, the fixed-sequence procedure, the descriptive change-point fit)? Can the authors still choose a comparator, a checkpoint, a view (V1, V2, V3), a threshold or a currency after seeing data? Is the procedure valid (familywise error, intersection-union, censoring at a cap, the zero-denominator convention, the ratio estimand)? Is it powered, and is the power statement honest?
3. Favouring GS by construction: authorship, ordering, scripted replies, probe selection, ballast authorship, stage tagging, the question channel, the open-questions and criteria-coverage gates the substrate arm has and the others lack, the cost accounting (what is charged to whom), retry and cap rules, scoring rules, controls, the decision tables, and whether INVALID-DESIGN triggers are symmetric.
4. Handicapping GS, or rigging against it: places where the design could show no effect or a negative effect for reasons that do not concern the method (scale, headless gate friction, one mid-tier model, cost views that charge authoring to one arm, ballast the substrate cannot cover, cap too low, fixed-sequence needing every later checkpoint, strict crossover rule).
5. Power and statistics: sample sizes, SD assumptions, the planned n, what it can and cannot detect, multiplicity, interim looks, avoidable analytic freedom, censoring.
6. Oracle, scorer and measurement: sealed hidden probes, status-class tolerance, durable-acceptance rule and the dropped "corrective follow-up" criterion, held-out suite and the escape band (is the band logically sound?), whether anything measured is itself targeted by the treatment, whether the scorer can be gamed by an agent.
7. Falsifiability and informativeness: is there any result that would make the authors change their mind, as written? Which decision-table rows are reachable and which are escape hatches? Does each include a coherent "wrong experiment" and "no crossover" outcome? What is the most probable outcome and would it change any decision? Does the cost buy information?
8. Sharing between the two drafts and with a third experiment you cannot see (SDX-1): are the claims about shared fixtures, arms and oracle coherent, and do they create double counting or dependence that the decision tables ignore?
9. Better hypotheses: up to three designs that would be more informative for the same budget, with the reason.
10. Anything else uninformative, circular, or confusing for a future reader.

**RULES OF THE REVIEW.** Quote exactly: every finding must quote (verbatim, in quotation marks) the passage it targets and name the file and the section. Every finding must propose a concrete fix (a changed sentence, rule, control or number with a reason). Rank by severity. Be specific: "the crossover may be gameable" is not a finding; "SDX-8 section 8 step 3 lets the comparator set be {A5, A5g}, so a crossover against only one passes if ..., fix: ..." is. Do not praise. You may state what you checked and found sound in one sentence in section 6. At most 30 findings; merge near-duplicates.

**SEVERITY.** BLOCKER: as written, the result would be uninterpretable, or biased for or against the method whatever the data say, or the design cannot be falsified; must be fixed before freezing. MAJOR: materially weakens a conclusion or inflates its permitted claim; needs a fix or an explicit declared limit. MINOR: real defect, limited effect. NIT: wording, ordering, clarity.

**OUTPUT.** Write exactly the schema in section 5, in one Markdown file. No preface, no closing remarks outside the schema.
~~~~

**Output schema (the agent writes exactly this)** (lines 74-124)

~~~~text
# SDX-8 and SDX-9 critique: <VENDOR> <MODEL_ID_AS_SHOWN>

## 0. Header
- VENDOR:
- MODEL_ID_AS_SHOWN:
- HARNESS: github-copilot-agent-vscode
- ROUND:
- DATE_UTC:
- REPO_HEAD:
- BRANCH: experiment-protocol-2026-10-02
- FILES_READ:
  - docs/experiments/prereg/SDX-8.md  sha256=<hex>
  - docs/experiments/prereg/SDX-9.md  sha256=<hex>
  - docs/experiments/EXPERIMENT-PROTOCOL.md  sha256=<hex>
- FILES_NOT_READ_ATTESTATION: I read no other file and used no tool other than reading these files and the git and hash commands.
- PRIOR_EXPOSURE: none | <describe>
- NOTES:

## 1. Verdict in at most five sentences
<Would you register each design as written? The single most important thing wrong with each.>

## 2. Findings (ranked: all BLOCKER first, then MAJOR, MINOR, NIT)
### F-01
- SEVERITY: BLOCKER | MAJOR | MINOR | NIT
- TARGET: SDX-8 | SDX-9 | BOTH
- CATEGORY: construct-validity | crossover-test | favors-GS | handicaps-GS | power-stats | oracle-scorer | falsifiability | informativeness | sharing | better-hypothesis | procedure | other
- DIRECTION: FAVORS-GS | HANDICAPS-GS | NEUTRAL-DEFECT | UNINFORMATIVE
- FILE_AND_SECTION:
- QUOTE: "<verbatim passage>"
- PROBLEM: <at most 120 words>
- FIX: <at most 80 words>
- CONFIDENCE: low | medium | high
(repeat ### F-02, F-03 ...)

## 3. Mandatory sections (write "none found" only after listing what you tried)
### 3a. Ways the designs favour GS by construction
### 3b. Ways the designs handicap GS, or are rigged against it
### 3c. Ways the designs are unfalsifiable, cannot inform, or have a modal outcome that changes no decision

## 4. Better hypotheses (at most three)
### H-A, H-B, H-C
- STATEMENT:
- WHY MORE INFORMATIVE:
- WHAT IT NEEDS (arms, n, readout):

## 5. Convince-me statements
- WHAT RESULT WOULD CONVINCE ME THE SUBSTRATE PAYS ITS OVERHEAD:
- WHAT RESULT WOULD CONVINCE ME IT DOES NOT:
- WHAT THE DESIGNS AS WRITTEN WOULD NEED, SO THAT BOTH ARE POSSIBLE: <one paragraph>

## 6. What I could not assess, and what I checked and found sound
~~~~

### PP-CRIT-CMP1: CMP-1 critic prompt as run on two fresh Claude critics

- **Role:** critic
- **Used by:** CMP-1
- **Purpose:** Both-direction review of the CMP-1 pilot comparison (bare model vs spec-kit vs GS). The draft was pasted inline after the prompt; the LENS line was appended per critic.
- **Source (copy extracted by script, not retyped):** `docs/experiments/prereg/CMP-1-review-raw/critic-prompt.txt` on branch `experiment-protocol-2026-10-02`; source file SHA-256 at extraction `2dc1817c3d0777fc...`
- **Must NOT see:** Only the CMP-1 draft inline. Not shown the protocol, sibling designs, the simulation, the formulas or the spec-kit repository (CMP-1-REVIEW.md).
- **Integrity notes:** No tools and no other files (stated in the prompt itself).
- **Output schema:** In the prompt: header (CRITIC, PRIOR_EXPOSURE, CONFIDENCE), then ### F-nn blocks (SEVERITY, SECTION, QUOTE, PROBLEM, FIX), then ## What I could not assess.
- **Edit rule after registration:** Not edited once hashed in the freeze list (rules 1 to 4 above); a change is a new version with a new id and a dated logbook note. Until registration the status line governs.
- **Status:** WRITTEN but a Claude-only round. Vendor-diverse round owed. No Copilot runbook for CMP-1 exists (GAP).

**Critic prompt (as saved; the LENS field is empty in the saved file, the two lenses were "fairness" and "statistics and measurement" per CMP-1-REVIEW.md)** (whole file)

~~~~text
ROLE. You are an adversarial reviewer of an experiment design: a draft preregistration (file CMP-1.md, inline below) written by the proponents of a software-engineering method called Generative Specification (GS). It is a PILOT comparison of three arms on one invented task: a bare model, GitHub spec-kit (stock), and GS (frozen formulas), with two model vendors, k=5 runs per vendor and arm. The authors have a stake in the answer and say so. They asked for hostile, honest, independent review in BOTH directions: find where the design is rigged in favor of GS, where it is rigged or handicapped against GS or against spec-kit, and where it cannot tell anybody anything. Reporting no problems is a failure; so is inventing problems you cannot quote. Do not defer to the authors' own descriptions of their mitigations: check whether each mitigation works. Do not repeat a limit the design already declares unless you argue the declared mitigation fails.

WHAT TO EXAMINE: (1) construct validity and arm fairness: does each arm get the tool's own best documented use; is the scripted operator fair; is bare a strawman; do the metrics avoid any arm's own vocabulary; (2) favoring GS by construction (authorship, ordering, scripted replies, probes, traps, decision table wording, INVALID-DESIGN symmetry, who analyses); (3) handicapping a tool (scale, headless invocation of spec-kit skills, scripted ratification, one attempt, cumulative cascades, vendor CLI confound); (4) power and statistics (the intervals, the Welch on 2 fixed vendors, the ahead/suggest/tie classes, multiplicity, the claims about what k=5 can show, the simulation as described); (5) oracle and measurement (sealed probes, trap counting, escaped-defect definition, cost accounting, review-surface metric, path classifier); (6) falsifiability and informativeness: reachable rows, composite outcomes, the public-statement table, whether a result could change a decision; (7) up to three better designs for the same money; (8) anything circular or confusing, including the licence and naming etiquette.

RULES. Quote exactly: every finding quotes (verbatim, in quotation marks) the passage it targets and names the section. Every finding proposes a concrete fix. Rank by severity: BLOCKER (uninterpretable, biased whatever the data say, or unfalsifiable; fix before freezing), MAJOR, MINOR, NIT. Be specific. No praise; you may state in one sentence what you checked and found sound. At most 25 findings; merge near-duplicates. You have no tools and no other files: if a missing file would change a judgment, say so. You have no memory of earlier reviews; if you recognize this project, say so in PRIOR_EXPOSURE.

OUTPUT: one Markdown document, no preface. Start with a header block with fields CRITIC (your model name as you know it), PRIOR_EXPOSURE, CONFIDENCE. Then each finding as a block "### F-nn" with fields SEVERITY, SECTION, QUOTE, PROBLEM, FIX. End with "## What I could not assess".

LENS:
~~~~

### PP-CRIT-WP5-1: White paper 5.0 critic, role 1: harsh critic

- **Role:** critic
- **Used by:** White paper 5.0 review (not a numbered experiment)
- **Purpose:** Find overclaims, gaps and contradictions in the white paper 5.0 draft; ends with a hostile-expert paragraph.
- **Source (copy extracted by script, not retyped):** `docs/white-paper/COPILOT-CRITIC-RUNBOOK-WP5.md (worktree C:\workspace\PragmaWorks\gs\gs-wp5)` on branch `white-paper-5.0-draft`; source file SHA-256 at extraction `2a2ab0442e00351f...`
- **Must NOT see:** ONLY the attached draft `docs/white-paper/GenerativeSpecification_WhitePaper_v5.0-DRAFT.md`. No other repo file, no earlier critique, no earlier role or vendor context (runbook sections 2 and 4).
- **Integrity notes:** One fresh chat per role per model; web search only for role 3.
- **Output schema:** Findings ranked Critical/Major/Minor with quote, why wrong, fix; then one-paragraph hostile-expert verdict.
- **Edit rule after registration:** Not edited once hashed in the freeze list (rules 1 to 4 above); a change is a new version with a new id and a dated logbook note. Until registration the status line governs.
- **Status:** WRITTEN. First panel was Claude-only; vendor-diverse run owed.

**Common preamble (prepend verbatim to every role)** (lines 69-73)

~~~~text
Common preamble for all six (prepend verbatim): *"You are a fresh, stateless reviewer. The
only input is the attached draft file; do not use any other file or prior context. The draft
is a METHOD PROPOSAL (not an academic results paper): experiments live elsewhere; advantages
are tagged with a status; Part C is the organization layer; the instrument ends the paper.
Judge it as that."* Then the role text:
~~~~

**Role prompt (a block quote in the source; paste the text, the leading "> " marks are formatting)** (lines 75-82)

~~~~text
**Role 1 — harsh** (no web)
> ROLE: HARSH CRITIC. TASK: find everything wrong: overclaims, unfalsifiable statements,
> logical gaps, undefined terms, internal contradictions, anything that reads as marketing.
> End with what a hostile expert would say, in one paragraph. OUTPUT (markdown): findings
> ranked by severity (Critical / Major / Minor). For each: ID, severity, quoted passage
> (exact, short), why it is wrong, concrete proposed fix (rewrite text where possible). Then
> the one-paragraph hostile-expert verdict. Do not praise. Do not use web search.
~~~~

**Output file header (every saved reply starts with this)** (lines 53-64)

~~~~text
---
role: <harsh|editor|field|practitioner|academic|clarity>
vendor: <openai|google|...>
model: <exact picker id>
harness: github-copilot-chat
draft: docs/white-paper/GenerativeSpecification_WhitePaper_v5.0-DRAFT.md
draft_commit: <output of git rev-parse HEAD in the repo>
timestamp: <ISO 8601>
web_search_used: <true|false>
notes: <refusals, truncation, retries, anything odd>
---
<verbatim model reply>
~~~~

### PP-CRIT-WP5-2: White paper 5.0 critic, role 2: constructive editor

- **Role:** critic
- **Used by:** White paper 5.0 review (not a numbered experiment)
- **Purpose:** Improve structure, order, opening and cuts of the draft.
- **Source (copy extracted by script, not retyped):** `docs/white-paper/COPILOT-CRITIC-RUNBOOK-WP5.md (worktree C:\workspace\PragmaWorks\gs\gs-wp5)` on branch `white-paper-5.0-draft`; source file SHA-256 at extraction `2a2ab0442e00351f...`
- **Must NOT see:** ONLY the attached draft `docs/white-paper/GenerativeSpecification_WhitePaper_v5.0-DRAFT.md`. No other repo file, no earlier critique, no earlier role or vendor context (runbook sections 2 and 4).
- **Integrity notes:** One fresh chat per role per model; web search only for role 3.
- **Output schema:** Recommendations ranked High/Medium/Low; proposed section order; cut list with word savings.
- **Edit rule after registration:** Not edited once hashed in the freeze list (rules 1 to 4 above); a change is a new version with a new id and a dated logbook note. Until registration the status line governs.
- **Status:** WRITTEN. First panel was Claude-only; vendor-diverse run owed.

**Common preamble (prepend verbatim to every role)** (lines 69-73)

~~~~text
Common preamble for all six (prepend verbatim): *"You are a fresh, stateless reviewer. The
only input is the attached draft file; do not use any other file or prior context. The draft
is a METHOD PROPOSAL (not an academic results paper): experiments live elsewhere; advantages
are tagged with a status; Part C is the organization layer; the instrument ends the paper.
Judge it as that."* Then the role text:
~~~~

**Role prompt (a block quote in the source; paste the text, the leading "> " marks are formatting)** (lines 83-91)

~~~~text
**Role 2 — editor** (no web)
> ROLE: CONSTRUCTIVE EDITOR. TASK: how to make it better: structure, order of sections, what
> to cut for length, what to expand, clarity of the central idea on the first page, examples
> that would help, a stronger opening, and what a reader can DO after reading it. OUTPUT
> (markdown): recommendations ranked High / Medium / Low. For each: ID, quoted passage or
> section reference, the problem, concrete proposed fix (draft replacement text for the
> opening and any key rewrites). Include a proposed section order and a cut list with
> approximate word savings. Do not use web search.
~~~~

### PP-CRIT-WP5-3: White paper 5.0 critic, role 3: field-context placer (web search allowed)

- **Role:** critic
- **Used by:** White paper 5.0 review (not a numbered experiment)
- **Purpose:** Place the draft in the current state of the field with verified URLs; audit its own citations.
- **Source (copy extracted by script, not retyped):** `docs/white-paper/COPILOT-CRITIC-RUNBOOK-WP5.md (worktree C:\workspace\PragmaWorks\gs\gs-wp5)` on branch `white-paper-5.0-draft`; source file SHA-256 at extraction `2a2ab0442e00351f...`
- **Must NOT see:** ONLY the attached draft `docs/white-paper/GenerativeSpecification_WhitePaper_v5.0-DRAFT.md`. No other repo file, no earlier critique, no earlier role or vendor context (runbook sections 2 and 4).
- **Integrity notes:** One fresh chat per role per model; web search only for role 3.
- **Output schema:** Per-area verified facts with URLs; ranked must-cite list; prior art unknown to the draft; citation audit table.
- **Edit rule after registration:** Not edited once hashed in the freeze list (rules 1 to 4 above); a change is a new version with a new id and a dated logbook note. Until registration the status line governs.
- **Status:** WRITTEN. First panel was Claude-only; vendor-diverse run owed.

**Common preamble (prepend verbatim to every role)** (lines 69-73)

~~~~text
Common preamble for all six (prepend verbatim): *"You are a fresh, stateless reviewer. The
only input is the attached draft file; do not use any other file or prior context. The draft
is a METHOD PROPOSAL (not an academic results paper): experiments live elsewhere; advantages
are tagged with a status; Part C is the organization layer; the instrument ends the paper.
Judge it as that."* Then the role text:
~~~~

**Role prompt (a block quote in the source; paste the text, the leading "> " marks are formatting)** (lines 92-110)

~~~~text
**Role 3 — field** (web search ALLOWED and expected)
> ROLE: FIELD-CONTEXT PLACER. Today is the date of your run; state it. Web search is allowed
> and expected. Verify every claim from PRIMARY pages and give URLs. Do not invent; mark
> anything unverified as UNVERIFIED. TASK: where does this sit in the CURRENT state of the
> area? Cover: spec-driven development (GitHub spec-kit, Kiro, Tessl and similar, as
> verified); harness engineering and context engineering writing (e.g. Fowler/Boeckeler on
> martinfowler.com, vendor guidance on agent context files such as AGENTS.md / CLAUDE.md);
> design by contract / executable specifications / BDD lineage; formal-methods-lite and
> verification-aware languages (Dafny, Verus, etc.); governance frameworks (NIST AI RMF,
> OWASP SAMM and similar); software-supply-chain assurance (SLSA, SBOM, in-toto etc.);
> academic work on AI-assisted development outcomes (e.g. METR RCT, DORA and other reports,
> peer-reviewed studies). For each area: what overlaps, what is genuinely distinct in the
> draft, what it must cite or distinguish itself from, and any competitor or prior art the
> draft seems unaware of. Also check any external citations the draft makes (author, year,
> URL/DOI correctness) and report errors. OUTPUT (markdown): per-area section with verified
> facts + URLs, then a ranked list of 'must cite / must distinguish' items, then 'prior art
> the draft seems unaware of', then a list of the draft's own citations with
> verified/incorrect status.
~~~~

### PP-CRIT-WP5-4: White paper 5.0 critic, role 4: practitioner/leader

- **Role:** critic
- **Used by:** White paper 5.0 review (not a numbered experiment)
- **Purpose:** Would an engineer and a director know what to do on Monday; go/no-go per persona.
- **Source (copy extracted by script, not retyped):** `docs/white-paper/COPILOT-CRITIC-RUNBOOK-WP5.md (worktree C:\workspace\PragmaWorks\gs\gs-wp5)` on branch `white-paper-5.0-draft`; source file SHA-256 at extraction `2a2ab0442e00351f...`
- **Must NOT see:** ONLY the attached draft `docs/white-paper/GenerativeSpecification_WhitePaper_v5.0-DRAFT.md`. No other repo file, no earlier critique, no earlier role or vendor context (runbook sections 2 and 4).
- **Integrity notes:** One fresh chat per role per model; web search only for role 3.
- **Output schema:** Findings High/Medium/Low split engineer/director; go/no-go for each.
- **Edit rule after registration:** Not edited once hashed in the freeze list (rules 1 to 4 above); a change is a new version with a new id and a dated logbook note. Until registration the status line governs.
- **Status:** WRITTEN. First panel was Claude-only; vendor-diverse run owed.

**Common preamble (prepend verbatim to every role)** (lines 69-73)

~~~~text
Common preamble for all six (prepend verbatim): *"You are a fresh, stateless reviewer. The
only input is the attached draft file; do not use any other file or prior context. The draft
is a METHOD PROPOSAL (not an academic results paper): experiments live elsewhere; advantages
are tagged with a status; Part C is the organization layer; the instrument ends the paper.
Judge it as that."* Then the role text:
~~~~

**Role prompt (a block quote in the source; paste the text, the leading "> " marks are formatting)** (lines 111-121)

~~~~text
**Role 4 — practitioner** (no web)
> ROLE: PRACTITIONER/LEADER. You are two readers at once: a senior software engineer and an
> engineering director. TASK: would you know what to do on Monday, what you get, what it
> costs (time, tokens, people, tooling)? Is the executive summary honest? Is Part C elegant
> or fluffy? What is missing for adoption (first step, smallest viable adoption, how to know
> it works, when NOT to use it, failure modes)? Answer separately as the engineer and as the
> director. OUTPUT (markdown): findings ranked High / Medium / Low with quoted passages and
> concrete proposed fixes (including text for a 'what to do first' box, a cost paragraph,
> and a when-not-to-use paragraph if you find them missing). End with a go/no-go for each
> persona and why. Do not use web search.
~~~~

### PP-CRIT-WP5-5: White paper 5.0 critic, role 5: academic SE researcher

- **Role:** critic
- **Used by:** White paper 5.0 review (not a numbered experiment)
- **Purpose:** Mock academic review, claims-status scheme rigor, falsifiable hypotheses table, construct validity of the instrument.
- **Source (copy extracted by script, not retyped):** `docs/white-paper/COPILOT-CRITIC-RUNBOOK-WP5.md (worktree C:\workspace\PragmaWorks\gs\gs-wp5)` on branch `white-paper-5.0-draft`; source file SHA-256 at extraction `2a2ab0442e00351f...`
- **Must NOT see:** ONLY the attached draft `docs/white-paper/GenerativeSpecification_WhitePaper_v5.0-DRAFT.md`. No other repo file, no earlier critique, no earlier role or vendor context (runbook sections 2 and 4).
- **Integrity notes:** One fresh chat per role per model; web search only for role 3.
- **Output schema:** Mock review (summary, strengths, weaknesses, questions, recommendation); findings; table of 3-6 falsifiable hypotheses.
- **Edit rule after registration:** Not edited once hashed in the freeze list (rules 1 to 4 above); a change is a new version with a new id and a dated logbook note. Until registration the status line governs.
- **Status:** WRITTEN. First panel was Claude-only; vendor-diverse run owed.

**Common preamble (prepend verbatim to every role)** (lines 69-73)

~~~~text
Common preamble for all six (prepend verbatim): *"You are a fresh, stateless reviewer. The
only input is the attached draft file; do not use any other file or prior context. The draft
is a METHOD PROPOSAL (not an academic results paper): experiments live elsewhere; advantages
are tagged with a status; Part C is the organization layer; the instrument ends the paper.
Judge it as that."* Then the role text:
~~~~

**Role prompt (a block quote in the source; paste the text, the leading "> " marks are formatting)** (lines 122-135)

~~~~text
**Role 5 — academic** (no web)
> ROLE: ACADEMIC SOFTWARE-ENGINEERING RESEARCHER (a reviewer at a venue such as ICSE / FSE /
> EMSE / TOSEM New Ideas or Vision track). TASK: assess contribution and novelty as a
> proposal paper; the rigor of the claims-status scheme (are the tags well defined, ordered,
> auditable, can a claim silently drift upward?); threats to validity; how to make the
> research programme falsifiable (name concrete hypotheses, predicted outcomes that would
> refute, designs, measures); what a reviewer would ask; whether the instrument (seven
> properties, letters, levels) has construct-validity risks (what does it measure, is it
> gameable, Goodhart, inter-rater reliability, criterion validity, weighting arbitrariness).
> OUTPUT (markdown): a mock review (summary, strengths, weaknesses, questions to authors,
> recommendation) followed by findings ranked High / Medium / Low with quoted passages and
> concrete proposed fixes, including a table of 3-6 falsifiable hypotheses with refuting
> outcomes. Do not use web search.
~~~~

### PP-CRIT-WP5-6: White paper 5.0 critic, role 6: clarity / non-insider reader

- **Role:** critic
- **Used by:** White paper 5.0 review (not a numbered experiment)
- **Purpose:** 15-minute readability audit, jargon and glossary gaps, what the reader understood.
- **Source (copy extracted by script, not retyped):** `docs/white-paper/COPILOT-CRITIC-RUNBOOK-WP5.md (worktree C:\workspace\PragmaWorks\gs\gs-wp5)` on branch `white-paper-5.0-draft`; source file SHA-256 at extraction `2a2ab0442e00351f...`
- **Must NOT see:** ONLY the attached draft `docs/white-paper/GenerativeSpecification_WhitePaper_v5.0-DRAFT.md`. No other repo file, no earlier critique, no earlier role or vendor context (runbook sections 2 and 4).
- **Integrity notes:** One fresh chat per role per model; web search only for role 3.
- **Output schema:** Ranked findings with rewrites; glossary-gap table.
- **Edit rule after registration:** Not edited once hashed in the freeze list (rules 1 to 4 above); a change is a new version with a new id and a dated logbook note. Until registration the status line governs.
- **Status:** WRITTEN. First panel was Claude-only; vendor-diverse run owed.

**Common preamble (prepend verbatim to every role)** (lines 69-73)

~~~~text
Common preamble for all six (prepend verbatim): *"You are a fresh, stateless reviewer. The
only input is the attached draft file; do not use any other file or prior context. The draft
is a METHOD PROPOSAL (not an academic results paper): experiments live elsewhere; advantages
are tagged with a status; Part C is the organization layer; the instrument ends the paper.
Judge it as that."* Then the role text:
~~~~

**Role prompt (a block quote in the source; paste the text, the leading "> " marks are formatting)** (lines 136-147)

~~~~text
**Role 6 — clarity** (no web)
> ROLE: CLARITY / NON-INSIDER READER, also a skeptical non-native English reader. You are a
> competent developer who has never heard of this project. TASK: audit readability for a
> 15-minute read: jargon, undefined acronyms and coined terms (list each with the line or
> section of first use and where/if it is defined), sentences over 30 words (quote the worst
> 15 with a proposed shorter rewrite), passages that need a definition earlier, idioms or
> metaphors a non-native reader would trip on, paragraphs that could be cut. Also state what
> you understood the central idea to be after page one, in your own words, and what you could
> NOT explain to a colleague. OUTPUT (markdown): ranked findings (High / Medium / Low) with
> quoted passages and concrete rewrites; a glossary-gap table (term, first use, defined?
> where, proposed one-line definition). Do not use web search.
~~~~

### PP-CRIT-FN-1: Functions-of-GS abstraction critic, role 1: deriver (unprimed, run 3 times per model)

- **Role:** critic
- **Used by:** Functions abstraction review (not a numbered experiment)
- **Purpose:** Validate or break the "functions of GS" abstraction against the Compendium.
- **Source (copy extracted by script, not retyped):** `docs/method/COPILOT-CRITIC-RUNBOOK-FUNCTIONS.md (worktree C:\workspace\PragmaWorks\gs\gs-lifecycle)` on branch `lifecycle-2026-10-08`; source file SHA-256 at extraction `a141e0c9fee8dffb...`
- **Must NOT see:** ONLY the Compendium `docs/white-paper/GenerativeSpecification_Compendium.md` (the Field Guide optionally for roles 1-3). No other repo file, no earlier critique, no validation report.
- **Integrity notes:** One fresh chat per role per model; web only for roles 5 and 6; role 1 is run three times per model in three chats and must not mention any function list.
- **Output schema:** As stated inside the prompt.
- **Edit rule after registration:** Not edited once hashed in the freeze list (rules 1 to 4 above); a change is a new version with a new id and a dated logbook note. Until registration the status line governs.
- **Status:** WRITTEN. First round Claude-only; vendor-diverse round owed.

**Role prompt (paste exactly as written; the lines are a block quote, paste the text after the "> ")** (lines 64-78)

~~~~text
**Role 1: deriver (unprimed).** Run it three times per model in three fresh chats (the
convergence test needs independent runs). Do NOT mention any function list.
> You are a fresh, stateless analyst. Use no prior context and no file other than the attached
> Compendium (and the Field Guide if attached). The Compendium describes a method (Generative
> Specification, GS). Derive, from the text alone, the MINIMAL COMPLETE set of FUNCTIONS the method
> performs. A function is a distinct job the method must get done (a short verb phrase plus one
> sentence of definition), not a document, tool or slogan. Minimal = no function can be removed or
> merged without losing something the Compendium relies on; complete = every mechanism, artifact,
> property and lifecycle step serves at least one function. Aim for the smallest honest number; do
> not pad or force a number. OUTPUT (markdown): (1) your function list with why each cannot be
> merged; (2) a mapping table of EVERY mechanism, artifact, property, practice and lifecycle step
> in the Compendium (40 or more rows) to its function(s), marking rows that serve two or more or
> none; (3) what did not fit or fit only by force; (4) confidence and what would change your list.
> Do not guess an expected answer. Do not use web search.
~~~~

**Output file header (every saved reply starts with this)** (lines 48-59)

~~~~text
---
role: <deriver|taxonomist|skeptic|taxonomist-r2|frameworks|lifecycle-lit>
vendor: <openai|google|...>
model: <exact picker id>
harness: github-copilot-chat
input: docs/white-paper/GenerativeSpecification_Compendium.md
commit: <git rev-parse HEAD>
timestamp: <ISO 8601>
web_search_used: <true|false>
notes: <truncation, retries, anything odd>
---
<verbatim reply>
~~~~

### PP-CRIT-FN-2: Functions-of-GS abstraction critic, role 2: taxonomist (primed, first version)

- **Role:** critic
- **Used by:** Functions abstraction review (not a numbered experiment)
- **Purpose:** Validate or break the "functions of GS" abstraction against the Compendium.
- **Source (copy extracted by script, not retyped):** `docs/method/COPILOT-CRITIC-RUNBOOK-FUNCTIONS.md (worktree C:\workspace\PragmaWorks\gs\gs-lifecycle)` on branch `lifecycle-2026-10-08`; source file SHA-256 at extraction `a141e0c9fee8dffb...`
- **Must NOT see:** ONLY the Compendium `docs/white-paper/GenerativeSpecification_Compendium.md` (the Field Guide optionally for roles 1-3). No other repo file, no earlier critique, no validation report.
- **Integrity notes:** One fresh chat per role per model; web only for roles 5 and 6; role 1 is run three times per model in three chats and must not mention any function list.
- **Output schema:** As stated inside the prompt.
- **Edit rule after registration:** Not edited once hashed in the freeze list (rules 1 to 4 above); a change is a new version with a new id and a dated logbook note. Until registration the status line governs.
- **Status:** WRITTEN. First round Claude-only; vendor-diverse round owed.

**Role prompt (paste exactly as written; the lines are a block quote, paste the text after the "> ")** (lines 79-95)

~~~~text
**Role 2: taxonomist (primed, first version).**
> You are a fresh, stateless reviewer. Only input: the attached Compendium. A proposal says GS
> performs THREE FUNCTIONS: (1) SAY IT ONCE: the spec as a single source of truth (what, why, how,
> what not); (2) STOP BAD CHANGES: the map so the assistant knows where things are, plus checks that
> run by themselves and block a bad change (tests, behavior checks, hooks); (3) REMEMBER
> EVERYTHING: every decision and change on record, plus a check that code and spec still agree.
> Mapped to the Compendium: Say = spec cascade + the bridge; Stop = sentinel + phase collapse +
> hooks/gates/ratchet; Remember = decision records + atomic commits + the lock. TASK: are the three
> mutually exclusive and collectively exhaustive over the Compendium's substrate, its seven
> properties and its lifecycle (section 1.1 and 8.17 to 8.22)? Build a table of every element ->
> function(s); list every element that fits none or two, with section citations. Test whether
> any of these is a missing function, yes or no with Compendium evidence: DECIDE/RATIFY by a human;
> MEASURE/REPORT; LEARN/IMPROVE; ENFORCE vs GUIDE. Test whether Stop bundles two functions.
> OUTPUT (markdown): verdict (MECE yes/no/partly), table, orphans, overlaps, missing-function
> candidates with short quoted evidence, recommended revision or "keep". Try to break the claim.
> Do not use web search.
~~~~

### PP-CRIT-FN-3: Functions-of-GS abstraction critic, role 3: skeptic (primed)

- **Role:** critic
- **Used by:** Functions abstraction review (not a numbered experiment)
- **Purpose:** Validate or break the "functions of GS" abstraction against the Compendium.
- **Source (copy extracted by script, not retyped):** `docs/method/COPILOT-CRITIC-RUNBOOK-FUNCTIONS.md (worktree C:\workspace\PragmaWorks\gs\gs-lifecycle)` on branch `lifecycle-2026-10-08`; source file SHA-256 at extraction `a141e0c9fee8dffb...`
- **Must NOT see:** ONLY the Compendium `docs/white-paper/GenerativeSpecification_Compendium.md` (the Field Guide optionally for roles 1-3). No other repo file, no earlier critique, no validation report.
- **Integrity notes:** One fresh chat per role per model; web only for roles 5 and 6; role 1 is run three times per model in three chats and must not mention any function list.
- **Output schema:** As stated inside the prompt.
- **Edit rule after registration:** Not edited once hashed in the freeze list (rules 1 to 4 above); a change is a new version with a new id and a dated logbook note. Until registration the status line governs.
- **Status:** WRITTEN. First round Claude-only; vendor-diverse round owed.

**Role prompt (paste exactly as written; the lines are a block quote, paste the text after the "> ")** (lines 96-106)

~~~~text
**Role 3: skeptic (primed).**
> You are a fresh, stateless hostile reviewer. Only input: the attached Compendium. Claim: the
> method performs three functions, Say it once, Stop bad changes, Remember everything (as defined
> in role 2), as an executive-facing abstraction and later a structure for the whole software and
> business lifecycle. TASK: (a) is it a rebrand of known ideas (spec-first, guardrails, audit
> log)? name the prior art per function; (b) what is genuinely distinct and does that live in the
> three functions or only in the Compendium's mechanisms; (c) what content disappears when you
> speak only of three functions; (d) what would a hostile reviewer, a skeptical engineer and an
> executive each say; (e) where does it overclaim relative to the Compendium's own evidence status.
> End with "Strongest objections" (ranked, max 7) and "What survives". Do not use web search.
~~~~

### PP-CRIT-FN-4: Functions-of-GS abstraction critic, role 4: taxonomist-r2 (primed, revised five functions; the file name in the runbook says deriver-r2 in one place)

- **Role:** critic
- **Used by:** Functions abstraction review (not a numbered experiment)
- **Purpose:** Validate or break the "functions of GS" abstraction against the Compendium.
- **Source (copy extracted by script, not retyped):** `docs/method/COPILOT-CRITIC-RUNBOOK-FUNCTIONS.md (worktree C:\workspace\PragmaWorks\gs\gs-lifecycle)` on branch `lifecycle-2026-10-08`; source file SHA-256 at extraction `a141e0c9fee8dffb...`
- **Must NOT see:** ONLY the Compendium `docs/white-paper/GenerativeSpecification_Compendium.md` (the Field Guide optionally for roles 1-3). No other repo file, no earlier critique, no validation report.
- **Integrity notes:** One fresh chat per role per model; web only for roles 5 and 6; role 1 is run three times per model in three chats and must not mention any function list.
- **Output schema:** As stated inside the prompt.
- **Edit rule after registration:** Not edited once hashed in the freeze list (rules 1 to 4 above); a change is a new version with a new id and a dated logbook note. Until registration the status line governs.
- **Status:** WRITTEN. First round Claude-only; vendor-diverse round owed.

**Role prompt (paste exactly as written; the lines are a block quote, paste the text after the "> ")** (lines 107-123)

~~~~text
**Role 4: taxonomist-r2 (primed, revised five functions).**
> You are a fresh, stateless reviewer. Only input: the attached Compendium. Claim: GS performs FIVE
> FUNCTIONS plus two invariants. (1) SAY IT ONCE: state intent as one source of truth and make it
> findable (spec cascade, constitution, bridge disciplines, sentinel map, bounding). (2) CHECK:
> independent non-LLM verification and blocking (tests, executed behavior checks, hooks, gates, CI,
> spec-code coherence check, debt ratchet). (3) REMEMBER: append-only record (ADR/EDR, atomic typed
> commits, status, the lock, ratification log). (4) SHOW: report state to people who do not read the
> code (rubric, letters, levels, coverage, snapshot, intent diff, value reports). (5) DECIDE: a
> person ratifies what is correct and what ships; the specificity dial sets rigor per component.
> Invariants, not functions: the executor derives between Say and Check; the ratchet (checks only
> tighten). Orthogonal axis: guide (advisory) versus sensor (enforced). TASK: map at least 60
> Compendium elements to exactly one primary function (or none) with section citations, mark forced
> fits, report the percentage mapped without forced fit; list orphans and double-fits; say whether
> any function is still missing with Compendium evidence (LEARN/IMPROVE, MIGRATE/RETIRE, COORDINATE
> people) or whether any of the five is not truly a function; verdict MECE yes/partly/no. Try to
> break the claim. Do not use web search.
~~~~

### PP-CRIT-FN-5: Functions-of-GS abstraction critic, role 5: frameworks (web allowed)

- **Role:** critic
- **Used by:** Functions abstraction review (not a numbered experiment)
- **Purpose:** Validate or break the "functions of GS" abstraction against the Compendium.
- **Source (copy extracted by script, not retyped):** `docs/method/COPILOT-CRITIC-RUNBOOK-FUNCTIONS.md (worktree C:\workspace\PragmaWorks\gs\gs-lifecycle)` on branch `lifecycle-2026-10-08`; source file SHA-256 at extraction `a141e0c9fee8dffb...`
- **Must NOT see:** ONLY the Compendium `docs/white-paper/GenerativeSpecification_Compendium.md` (the Field Guide optionally for roles 1-3). No other repo file, no earlier critique, no validation report.
- **Integrity notes:** One fresh chat per role per model; web only for roles 5 and 6; role 1 is run three times per model in three chats and must not mention any function list.
- **Output schema:** As stated inside the prompt.
- **Edit rule after registration:** Not edited once hashed in the freeze list (rules 1 to 4 above); a change is a new version with a new id and a dated logbook note. Until registration the status line governs.
- **Status:** WRITTEN. First round Claude-only; vendor-diverse round owed.

**Role prompt (paste exactly as written; the lines are a block quote, paste the text after the "> ")** (lines 124-133)

~~~~text
**Role 5: frameworks (web ALLOWED; verify from primary pages, give URL and date read).**
> You are a fresh reviewer; state today's date. Verify every claim from PRIMARY pages with URLs;
> mark anything unverified as UNVERIFIED. Compare the functions in role 2 (and role 4) with ISO/IEC/IEEE
> 12207 and 15288, NIST SSDF, OWASP SAMM, NIST AI RMF (Govern, Map, Measure, Manage), DORA
> capabilities, CALMS, ITIL 4, COBIT 2019, Deming PDCA and the Toyota Andon, and Ashby's requisite
> variety / generic control-loop functions. For each: its top-level decomposition and where the
> functions are equivalent, finer, coarser or missing. End with a table of candidate functions
> that recur across frameworks and are absent from the three, with counts, and a recommendation
> (keep, revise, add). Under 1800 words.
~~~~

### PP-CRIT-FN-6: Functions-of-GS abstraction critic, role 6: lifecycle-lit (web allowed)

- **Role:** critic
- **Used by:** Functions abstraction review (not a numbered experiment)
- **Purpose:** Validate or break the "functions of GS" abstraction against the Compendium.
- **Source (copy extracted by script, not retyped):** `docs/method/COPILOT-CRITIC-RUNBOOK-FUNCTIONS.md (worktree C:\workspace\PragmaWorks\gs\gs-lifecycle)` on branch `lifecycle-2026-10-08`; source file SHA-256 at extraction `a141e0c9fee8dffb...`
- **Must NOT see:** ONLY the Compendium `docs/white-paper/GenerativeSpecification_Compendium.md` (the Field Guide optionally for roles 1-3). No other repo file, no earlier critique, no validation report.
- **Integrity notes:** One fresh chat per role per model; web only for roles 5 and 6; role 1 is run three times per model in three chats and must not mention any function list.
- **Output schema:** As stated inside the prompt.
- **Edit rule after registration:** Not edited once hashed in the freeze list (rules 1 to 4 above); a change is a new version with a new id and a dated logbook note. Until registration the status line governs.
- **Status:** WRITTEN. First round Claude-only; vendor-diverse round owed.

**Role prompt (paste exactly as written; the lines are a block quote, paste the text after the "> ")** (lines 134-145)

~~~~text
**Role 6: lifecycle-lit (web ALLOWED; verify, URL and date read).**
> You are a literature researcher; state today's date. Survey software lifecycle models that
> include business and governance (ISO 12207/15288/14764, ITIL, COBIT, SSDF, SAMM, AI RMF,
> ISO/IEC 5338 and 42001, TOGAF/BizDevOps), AI-assisted development lifecycle proposals from
> 2025 to 2026 (spec-driven tools, DORA AI model, analyst framings, arXiv papers), and what a
> whole-lifecycle method must cover: ideation, creation, extension, environments, evolution in
> production, keeping the lights on, remediation, migration, disposal, post-mortem, constant
> auditability, technical debt, and on the business side strategy and funding intent, product and
> KPIs, release-to-KPI reporting, governance reporting, due diligence and M&A readiness, maturity
> ladder, retirement. Output a coverage matrix (phase by framework), the gaps nobody covers, and a
> checklist. Under 2000 words.
~~~~

#### Critic rounds: the two read-only sections each Copilot runbook adds (what the critic may and may not read, and its integrity rules)

These are quoted for the three experiment critics so that the "must NOT see" rule travels with the prompt. WP5 and Functions critics: see their entries.

**PP-CRIT-SDX1: files the critic may read (runbook section 2)**

~~~~text
1. `docs/experiments/prereg/SDX-1.md` (the draft preregistration under review)
2. `docs/experiments/prereg/SDX-1-ARMS.md` (the arms, the load-bearing list, authorship and manipulation checks; part of the same registration)
3. `docs/experiments/EXPERIMENT-PROTOCOL.md` (the protocol the registration must obey)
4. `experiments/cr/benchmark/DOMAIN_SPEC.md` (the base specification of the invented project "Pastura" that every arm builds; it is the minimum description of the benchmark. Note: SDX-1 section 4 says the final scaffold is fixed to Node with the built-in HTTP server and SQLite and so on; where DOMAIN_SPEC names PostgreSQL or a framework, treat that as superseded by the scaffold described in SDX-1)

You are deliberately NOT given: the earlier review file (`docs/experiments/prereg/SDX-REVIEW.md` and the folder beside it), the pilot design, the logbook, any paper, any chat, any other critic's file in `docs/experiments/critiques/`. SDX-1 mentions some of these by name. Do not open them. If a missing file would change a judgment, say so in section 6 of your output ("what I could not assess").
~~~~

**PP-CRIT-SDX1: integrity rules (runbook section 4)**

~~~~text
1. Do not edit, move, delete or reformat any file other than creating your one critique file. Do not touch anything under `docs/experiments/prereg/`.
2. Do not read any file other than the four in section 2. In particular do not open any file in `docs/experiments/critiques/` other than to check that your own output path is free, do not open `docs/experiments/prereg/SDX-REVIEW.md` or its raw folder, do not browse the repository, do not search it for text. If your tooling shows you a file listing, you still do not read other files.
3. Use no tools beyond reading the four allowed files, running the git and hashing commands in sections 0, 1 and 6, and creating your one output file. No web search, no web fetch, no code execution, no running tests, no calling other models, no extensions, no reading other chats.
4. Do not use memory of earlier sessions or earlier conversations with JC. If you have any recollection of this project from before this chat, say so in the output header field `PRIOR_EXPOSURE`; do not use it silently.
5. Do not communicate with other critics; do not try to guess what others will say; do not soften findings to match what you think the authors want.
6. Do not run any experiment and do not generate any Pastura code.
7. Be honest about uncertainty: use the `CONFIDENCE` field; do not state invented facts about the repository or about the literature. If you cite a statistical result or a published paper, say how sure you are and flag that it is from memory.
8. One critique per session. After you push, do nothing else.
~~~~

**PP-CRIT-FX1: files the critic may read (runbook section 2)**

~~~~text
1. `docs/experiments/prereg/FX-1.md` (the draft registration under review)
2. `docs/experiments/FX-1-CHECKER-SPEC.md` (the checker specification; part of the same registration)
3. `docs/experiments/EXPERIMENT-PROTOCOL.md` (the protocol the registration must obey)
4. `tools/gs-check/gs-check.mjs --print-config` (the frozen parameters of the checker are its embedded default configuration)
5. `experiments/fx1/fixtures/README.md` and the five briefs `experiments/fx1/fixtures/FIX-API-lendmark.md`, `FIX-CLI-stitchcount.md`, `FIX-PIPE-tidewatch.md`, `FIX-GAME-cinderfall.md`, `FIX-MCP-shelfwise.md`
6. `experiments/fx1/simulation/results.md` (the sample-size simulation output)

You are deliberately NOT given the review record (`docs/experiments/prereg/FX-1-REVIEW.md` and `docs/experiments/prereg/FX-1-review-raw/`), the checker's source code, the formulas, any other registration, the logbook, any paper, any chat, any other critic's file. If a missing file would change a judgment, say so in section 6 of your output.
~~~~

**PP-CRIT-FX1: integrity rules (runbook section 4)**

~~~~text
1. Do not edit, move, delete or reformat any file other than creating your one critique file. Do not touch anything under `docs/experiments/prereg/` or `experiments/`.
2. Do not read any file other than those in section 2. Do not open any other file in `docs/experiments/critiques/` other than to check that your own output path is free. Do not browse or search the repository.
3. Use no tools beyond reading the allowed files, running the git and hashing commands in sections 0, 1 and 6, and creating your one output file. No web search, no code execution, **do not run the checker or the simulation**, no calling other models, no extensions, no other chats.
4. Do not use memory of earlier sessions or conversations with JC. If you recall this project, say so in `PRIOR_EXPOSURE`.
5. Do not communicate with other critics or guess what they will say; do not soften findings to match what you think the authors want.
6. Do not run any experiment and do not generate any project code.
7. Be honest about uncertainty (the `CONFIDENCE` field); do not state invented facts about the repository or the literature. Flag any statistical claim or citation from memory.
8. One critique per session. After you push, do nothing else.
~~~~

**PP-CRIT-SDX89: files the critic may read (runbook section 2)**

~~~~text
1. `docs/experiments/prereg/SDX-8.md` (draft preregistration: long growing chain, registered crossover in change index)
2. `docs/experiments/prereg/SDX-9.md` (draft preregistration: one fixed spec built in stages to a verified COMPLETE, registered crossover stage)
3. `docs/experiments/EXPERIMENT-PROTOCOL.md` (the protocol the registrations must obey)

You are deliberately NOT given: the SDX-1 files that the two drafts say they share artifacts with (so you cannot check byte-identity or fairness of those shared artifacts; say so in section 6 where it matters), the earlier review files, the logbook, any paper, any chat, any other critic's file. The drafts name some of these. Do not open them.
~~~~

**PP-CRIT-SDX89: integrity rules (runbook section 4)**

~~~~text
1. Do not edit, move, delete or reformat any file other than creating your one critique file. Do not touch anything under `docs/experiments/prereg/`.
2. Do not read any file other than the three in section 2; do not open other files in `docs/experiments/critiques/`; do not browse or search the repository.
3. Use no tools beyond reading the three files, the git and hashing commands of sections 0 and 6, and creating your output file. No web, no code execution, no other models, no extensions, no other chats.
4. Do not use memory of earlier sessions or conversations with JC. If you recall this project from before, say so in `PRIOR_EXPOSURE`.
5. Do not communicate with other critics; do not soften findings to match what you think the authors want.
6. Do not run any experiment and do not generate any Pastura code.
7. Be honest about uncertainty (`CONFIDENCE`); do not invent facts about the repository or the literature; flag anything cited from memory.
8. One critique per session. After you push, do nothing else.
~~~~


## B. Practitioner and expert-prompt authors

### PP-PRAC-A6: Senior-engineer session, step 1 (produces A6; the whole file is the prompt)

- **Role:** practitioner / expert prompt author
- **Used by:** SDX-0; SDX-1; SDX-8; SDX-9 (inherit A5/A6)
- **Purpose:** A model plays an expert who writes the strongest guidance for a coding assistant, blind to GS. Output A6 (frozen, hashed), later reduced to A5 by step 2.
- **Source (copy extracted by script, not retyped):** `docs/experiments/COPILOT-PRACTITIONER-RUNBOOK.md` on branch `experiment-protocol-2026-10-02`; source file SHA-256 at extraction `b526f01d4e251bea...`
- **Must NOT see:** Only RUNBOOK.md, PASTURA-PRODUCT-DESCRIPTION.md (`experiments/sdx1/practitioner/`) and one SESSION-FACTS file. Not GS, not any arm, not the hidden tests, not the change texts. Not the Claude model (generator vendor).
- **Integrity notes:** Runbook section 5 (Conduct). A6.md is not edited after delivery; its SHA-256 is printed.
- **Output schema:** `out/A6.md`, later `out/A5.md`, `out/removed.md`, `out/attestation.md`, `out/meta.json` (schema inside the runbook, section 4).
- **Edit rule after registration:** Not edited once hashed in the freeze list (rules 1 to 4 above); a change is a new version with a new id and a dated logbook note. Until registration the status line governs.
- **Status:** WRITTEN. No practitioner output exists yet (experiments/sdx1/practitioner holds only the three input files).

**Whole file given to the model as `RUNBOOK.md` (with PASTURA-PRODUCT-DESCRIPTION.md and one SESSION-FACTS file)** (whole file)

~~~~text
# Brief and procedure for the senior-engineer session

> This file is written to be read by the AI model that will play the role of a senior engineer. Read all of it before you start. It is complete: nothing outside the files named here is needed, and nothing outside them may be used.

## 0. Set up and print paths first
Paths in this file are relative to the working folder that holds this file. First resolve and **print** the absolute path of that working folder (`WORK=<absolute path on this PC>`). Then confirm and print the absolute path of each of these, and stop if any is missing:
- `WORK/RUNBOOK.md` (this file)
- `WORK/PASTURA-PRODUCT-DESCRIPTION.md` (the product description)
- `WORK/SESSION-FACTS.md` (a short file of facts about how the assistant is run)
- `WORK/out/` (create it if missing; every file you produce goes here)

Do not open, search or read anything else on this computer. Do not use the web. Do not look at any other folder, repository, earlier chat or instruction file. Use only the tools needed to read the three input files and to write files into `WORK/out/`. If the working folder is inside a version-controlled repository, say so and stop.

Then ask the person driving this session for the **exact model identifier string** shown by the model picker for this chat, and wait for the reply. Record it exactly as given.

## 1. Your role
You are a senior software engineer with many years of experience building and maintaining backend services, and you are expert at instructing AI coding assistants. A study needs the best guidance you can write for an AI coding assistant that will build one specific product and then extend it over a long period.

## 2. The situation
- The product is described in `PASTURA-PRODUCT-DESCRIPTION.md`. It is an invented product: no public implementation exists and none of its details are in anything you have seen.
- The fixed technical setting: Node.js with TypeScript in strict mode, the built-in `node:http` server, the built-in `node:sqlite` module for storage, `vitest` for automated tests, and a fixed project folder layout and fixed function signatures for the business rules, all already in place when the assistant starts. The assistant does not choose the stack. (Where the product description names a different database or a web framework, the setting in this paragraph replaces it.)
- The assistant is a coding agent that can read and edit files in the project folder, run shell commands, and run the test suite. It works unattended in a command-line session: it receives a task, works until it considers the task done, and stops. Nobody answers questions during a session.
- The work comes as a series of change requests from the product owner, arriving one at a time over a long period: first the initial build from the product description, then several further requests whose contents you do not know. After each one the work is checked automatically, by hidden tests, against the product owner's description of the behaviour. You will not see the tests or the requests.
- Further facts about how the assistant is run are in `SESSION-FACTS.md`. Read it. Treat it exactly as part of this brief.

## 3. Your task (step 1 of 2)
Write the strongest guidance you can, from your own expertise, that the assistant receives at the start of every session so that it builds this product well and extends it well over time.

Requirements for the text:
- It is addressed to the assistant, in the second person, as the exact text the assistant will receive. No preface to the reader, no explanation of your reasoning, no commentary, no headings that talk about yourself, no sign-off.
- Plain Markdown. No length requirement and no length limit. Include what you judge necessary and nothing you judge useless; do not pad.
- Use your own engineering judgment about everything: how to work, how to structure code, how to verify work, what to do when something is ambiguous. Do not hold back anything you would normally include.
- Do not copy the product description into the guidance. The assistant receives the product description separately. Refer to it only where you need to.
- You may not ask the person driving the session for ideas, sources or feedback about the content. You may ask for the model identifier (section 0) and for clarification about the procedure only.

Write the text to `WORK/out/A6.md`. Do not write any other file yet. Then compute and print the SHA-256 of `WORK/out/A6.md`, state the number of lines and words, and say: "Step 1 delivered. The text is final and will not be edited." From that moment you may not edit `WORK/out/A6.md`.

## 4. Step 2 comes later, by message
When step 1 is delivered, the person driving the session will send a second message with the second task. You do not know what it is. Do not guess or prepare for it. Do not do anything for it until it arrives. If the second message does not arrive, you are finished after step 1; say so.

When it arrives, follow it exactly. It will name the further files to write to `WORK/out/`. At the end, write `WORK/out/meta.json` with these fields (use `null` where something does not apply):

```json
{
  "model_id_as_shown": "<the exact string you were given in section 0>",
  "variant": "<the value of the line 'variant:' in SESSION-FACTS.md>",
  "harness": "github-copilot-agent-vscode",
  "timestamp_utc_start": "<ISO 8601>",
  "timestamp_utc_end": "<ISO 8601>",
  "files_read": ["RUNBOOK.md", "PASTURA-PRODUCT-DESCRIPTION.md", "SESSION-FACTS.md"],
  "files_written": ["out/A6.md", "..."],
  "sha256_A6": "<hex>",
  "sha256_A5": "<hex or null>",
  "tools_used": ["<only: file read, file write, hash command>"],
  "web_used": false,
  "session_remarks": "<anything odd: truncation, refusals, interruptions>"
}
```

## 5. Conduct
1. Work alone, from your own expertise. Do not use the web, other files, or other models.
2. Do not ask the person driving the session what to write. Do not accept suggestions about content from them; if they offer any, decline and note it in `session_remarks`.
3. Do not edit `A6.md` after it is delivered.
4. Do not run any code, create any project, or build the product. You write text.
5. Be truthful in everything you write about yourself and your sources.
~~~~

**SESSION-FACTS variant m1 ("told": states statelessness; primary)**

~~~~text
variant: m1

Facts about how the assistant is run:

- Every session starts from nothing. The assistant has no memory of any earlier session, request or conversation.
- The only thing that carries over from one session to the next is the content of the project folder, exactly as the previous session left it.
- Each session is given one request.
~~~~

**SESSION-FACTS variant m2 ("not told"; sensitivity)**

~~~~text
variant: m2

Facts about how the assistant is run:

- The assistant is given one request at a time.
~~~~

### PP-PRAC-A5-STEP2: Step 2 message: reduce A6 to A5 (pasted as the second message)

- **Role:** practitioner / expert prompt author
- **Used by:** SDX-0; SDX-1; SDX-8; SDX-9
- **Purpose:** Removes persistence and enforcement instructions from the practitioner own text so that A6 minus A5 is exactly the constrained delta.
- **Source (copy extracted by script, not retyped):** `docs/experiments/PRACTITIONER-HANDLING.md` on branch `experiment-protocol-2026-10-02`; source file SHA-256 at extraction `2b719d766f2b5bbf...`
- **Must NOT see:** The model must not see it before step 1 is delivered and hashed (PRACTITIONER-HANDLING.md lines 7-11).
- **Integrity notes:** Sent only after A6.md is hashed; A6.md is not edited.
- **Output schema:** `out/A5.md`, `out/removed.md` ("nothing removed" if so), `out/attestation.md`, `out/meta.json`.
- **Edit rule after registration:** Not edited once hashed in the freeze list (rules 1 to 4 above); a change is a new version with a new id and a dated logbook note. Until registration the status line governs.
- **Status:** WRITTEN.

**Second message, identical for m1 and m2 and for every model** (lines 39-42)

~~~~text
Step 2. Produce a version of your guidance for a study arm in which the assistant may not be told to create, maintain or consult any file other than source code and automated tests (so no notes, plans, README, or decision records), nor to install or require hooks, CI, or other enforcement. Remove what that rules out. Change nothing else and add nothing: every sentence of the new text must already appear, unchanged, in out/A6.md. If a sentence mixes allowed and ruled-out content, delete the whole sentence rather than rewording it. Write the result to out/A5.md.
Then write out/removed.md: every sentence you removed, verbatim, one per line, each followed by a few words saying which part of the constraint it fell under. If you removed nothing, write exactly "nothing removed" in that file and still write out/A5.md.
Then write out/attestation.md with three short answers: (1) what kinds of sources and experience you drew on; (2) what you assumed about whether the assistant remembers anything between requests; (3) in one line each, anything you would have written if the constraint had not applied (do not rewrite A5).
Then write out/meta.json as the procedure says. Do not edit out/A6.md.
~~~~

### PP-PRAC-HUMAN: Human senior-engineer brief (English; the Spanish half is in the same file)

- **Role:** practitioner / expert prompt author
- **Used by:** SDX-1; SDX-0
- **Purpose:** Recruiting and task brief for a human expert who writes A6 and A5 blind to the method.
- **Source (copy extracted by script, not retyped):** `docs/experiments/HUMAN-PRACTITIONER-BRIEF.md` on branch `experiment-protocol-2026-10-02`; source file SHA-256 at extraction `0fba8200a4e5fa75...`
- **Must NOT see:** Nothing about the method, JC papers/site/courses/posts. Delivered with PASTURA-PRODUCT-DESCRIPTION.md and nothing else.
- **Integrity notes:** Human attests the text is theirs and lists any AI tool used.
- **Output schema:** A6 text, then A5 text, attestation (sources, hours, AI tools, prior exposure).
- **Edit rule after registration:** Not edited once hashed in the freeze list (rules 1 to 4 above); a change is a new version with a new id and a dated logbook note. Until registration the status line governs.
- **Status:** WRITTEN with 2 open placeholders for JC (fee/payment, licence confirmation).

**English text (contains two bracketed JC placeholders: fee, confirm licence)** (lines 8-28)

~~~~text
**What this is.** A controlled experiment on how well AI coding assistants build and then extend a software project over many sessions. We need the strongest guidance an experienced engineer would give such an assistant. Your text is one of the comparison conditions, so what we need from you is your honest professional judgment, not what you think we want.

**What you will be asked.**
1. **Step 1.** You get a description of an invented product (a small REST API) and a few facts about how the assistant is run: it is a coding agent that can edit files and run commands in the project folder and the tests; it works unattended and nobody answers its questions during a session; every session starts from nothing, with no memory of earlier ones, and sees the project folder as the previous session left it; the product will grow through a series of change requests whose content you will not see. Write the best guidance you can, in your own words, that the assistant receives at the start of every session so that it builds the product well and extends it well. Plain text or Markdown, any length you judge right, addressed to the assistant.
2. **Step 2.** A short second task, explained only after you have delivered step 1 so that step 1 is your natural judgment. It asks you to remove parts of your own text, nothing else. About 30 to 60 minutes.
3. **Possibly, later (separate request, only if you agree):** two more short writing tasks of a similar kind.

**How long.** Step 1: 2 to 4 hours. Step 2: 30 to 60 minutes. A short attestation (15 minutes). The optional later tasks: 2 to 3 hours. Total for the core: about 3 to 5 hours, within about two weeks. [JC: fee and payment terms to be filled in.]

**What not to read before you finish step 1.** Anything about "Generative Specification", JC's papers, site, courses, posts, or talks; and please do not look up other published frameworks for guiding AI coding assistants for this task (use what you already know and do). Do not ask an AI tool to write the text for you; if you use any AI tool at all, even to polish, tell us which and for what. Do not discuss the content of your text with anyone while the study is being prepared, and please do not ask JC for opinions about it: he will not comment on drafts.

**What we ask you to attest, in writing.** That the text is your own; any AI tool used; the hours you spent; what you drew on (experience, books, teams); whether you have previously read or used any of JC's material (an honest "yes" does not disqualify you from helping; it changes which arm your text is used in).

**Credit.** Named by default in the registration and in the paper's acknowledgments if you agree, or credited under a pseudonym or role if you prefer. Co-authorship is not part of this arrangement; if your contribution grows beyond these tasks it can be discussed. Your text will be published verbatim, with the hash and the date, as part of the open record (licence: CC BY 4.0 unless you object). [JC: confirm.]

**Confidentiality.** Until the study is publicly registered (date to be communicated), please do not share this brief, your text, or the fact that you are taking part. After registration the whole design, your text and your credit are public. If you are under an employer agreement that touches this, tell JC before starting; do not use any employer-confidential material in your text.

**Independence.** The study depends on you writing blind. You will not be shown anything about the other conditions or any result. Your answer cannot be "wrong"; a text that turns out ordinary is as useful as a clever one.

---
~~~~

### PP-PRAC-SDX1-TASKS: The two practitioner tasks as registered in SDX-1-ARMS (short form)

- **Role:** practitioner / expert prompt author
- **Used by:** SDX-1; SDX-8; SDX-9
- **Purpose:** The registered wording of Task 1 (gives A6) and Task 2 (gives A5).
- **Source (copy extracted by script, not retyped):** `docs/experiments/prereg/SDX-1-ARMS.md section 3` on branch `experiment-protocol-2026-10-02`; source file SHA-256 at extraction `9709fbe2f8a0342d...`
- **Must NOT see:** Practitioner is blind to A4, A3, A1 and results; the brief must not list L1 to L5 or mention GS (SDX-1-ARMS.md lines 50-54).
- **Integrity notes:** A6 and A5 are frozen and hashed before the next steps.
- **Output schema:** A6 then A5 as text; attestation.
- **Edit rule after registration:** Not edited once hashed in the freeze list (rules 1 to 4 above); a change is a new version with a new id and a dated logbook note. Until registration the status line governs.
- **Status:** WRITTEN (registered wording). Note: PP-PRAC-A5-STEP2 is the longer operational form used for models.

**Task 1** (line 52)

~~~~text
Write the strongest prompt you can, from your own expertise, that a coding agent receives at the start of every session so that it builds and extends this service well.
~~~~

**Task 2** (line 53)

~~~~text
Take your prompt and produce the version for a study arm in which the agent may not be told to create, maintain or consult any file other than source code and automated tests (so no notes, plans, README or decision records), nor to install or require hooks, CI or other enforcement. Remove what that rules out; change nothing else, and add nothing.
~~~~


## C. Judges and auditors

### PP-JUDGE-SDX1-LEAK: SDX-1 leak and parity judge (M1), checks J1 to J5 - SPECIFICATION ONLY, no final prompt text exists

- **Role:** judge
- **Used by:** SDX-1; SDX-0
- **Purpose:** A different-vendor stateless judge classifies each practitioner text for L1 to L5 content (leak), persistence/enforcement instructions, product-fact leaks.
- **Source (copy extracted by script, not retyped):** `docs/experiments/PRACTITIONER-HANDLING.md section "Judge checks"` on branch `experiment-protocol-2026-10-02`; source file SHA-256 at extraction `2b719d766f2b5bbf...`
- **Must NOT see:** One text and the definitions of L1 to L5 plus the grey-case rule (SDX-1-ARMS.md section 1) only. Blind to author vendor and arm. Different vendor from the generator and the author.
- **Integrity notes:** Run twice per text in two fresh sessions; calibrated first on 10 planted artifacts (the calibration set is MISSING); replaced if it misses any.
- **Output schema:** JSON; a verbatim quote for every non-ABSENT answer.
- **Edit rule after registration:** Not edited once hashed in the freeze list (rules 1 to 4 above); a change is a new version with a new id and a dated logbook note. Until registration the status line governs.
- **Status:** SPEC ONLY. GAP: the runbook is "written when needed" (PRACTITIONER-HANDLING.md) and the 10-artifact calibration set does not exist.

**What the judge receives and must answer (the nearest thing to a prompt; not a final prompt)** (lines 82-88)

~~~~text
The judge receives one text and the definitions of L1 to L5 and the grey-case rule from `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\prereg\SDX-1-ARMS.md` section 1, nothing else, and must answer, as JSON with a verbatim quote for every non-ABSENT answer:
- J1. For each of L1 to L5: ABSENT, PARTIAL or PRESENT, with the quote. Instruction included: detect the idea in other words, not only the keywords (for example "leave a short summary for whoever touches this next" is L3-like even without the word decision).
- J2. Does the text instruct the assistant to create, maintain, consult or enforce any persistent project-state artifact other than source code and automated tests, or to install or require any hook, CI or other enforcement? YES or NO with the quote (this is the operational line of the grey-case rule; it applies to A5 and must be NO).
- J3. Does the text contain any product fact (about Pastura's entities, rules, endpoints or numbers) that is not in the product description, or any guess about the content of future change requests or the hidden tests? List each with the quote.
- J4. Which generic engineering items does the text cover? (checklist of the manifest G items once the manifest exists; before that, a free list). Descriptive input for the M2 strength review only, never a pass or fail from the judge.
- J5. For A6-m only: the L1 to L5 status of the unconstrained text, descriptive input for the A6 contrasts; no pass or fail.
Rule (same as SDX-1-ARMS M1): an A5-m with any PARTIAL or PRESENT in J1 from either run, or YES in J2, or a J3 hit, leaks; it is archived with that verdict and not run. At least one text with zero leaks and passing the strength check is needed per registered A5-m arm.
~~~~

### PP-AUD-AX: AX/AX2 seven-property project auditor (embedded in code)

- **Role:** auditor
- **Used by:** AX; AX2; AX-K5
- **Purpose:** Score a generated project on seven properties (0/1/2 each) from its files alone; JSON output; run through the claude CLI by `audit.cjs`.
- **Source (copy extracted by script, not retyped):** `experiments/ax/runner/audit.cjs (const PROMPT)` on branch `experiment-protocol-2026-10-02`; source file SHA-256 at extraction `1d6661b964e5b274...`
- **Must NOT see:** Only the project directory. No knowledge of how it was built.
- **Integrity notes:** AX-K5 showed up to 6 points between two runs of one prompt: judge instability is known.
- **Output schema:** JSON per the prompt.
- **Edit rule after registration:** Not edited once hashed in the freeze list (rules 1 to 4 above); a change is a new version with a new id and a dated logbook note. Until registration the status line governs.
- **Status:** WRITTEN (historical, already used; its experiments are closed and backfilled).

**Auditor prompt as embedded (JavaScript template literal; `${...}` placeholders are filled by the script)** (lines 24-35)

~~~~text
const PROMPT = `You are auditing a software project. You have no prior knowledge of how it was built. Read the files in this directory and score it on SEVEN properties, each 0, 1, or 2 (0 = absent, 1 = partial, 2 = fully present). Score ONLY what is materially present in the code and files, never what documentation claims.

1. Self-describing — the system explains its own architecture/decisions from its artifacts, no external knowledge needed.
2. Bounded — units have explicit scope and seams; functions/modules do one thing; no oversized files.
3. Verifiable — correctness is checkable without human judgment (types, tests, lint, coverage present and meaningful).
4. Defended — destructive/invalid operations are structurally prevented (validation, hooks, guards), not just discouraged.
5. Auditable — decisions and history are recoverable from artifacts (ADRs, meaningful commits, changelog).
6. Composable — parts are isolated, single-purpose, combinable without hidden coupling (interfaces/DI).
7. Executable — behavioral contracts run against a real system (integration/e2e tests that exercise it), not merely compile.

Respond with ONLY a JSON object, no prose:
{"self_describing":N,"bounded":N,"verifiable":N,"defended":N,"auditable":N,"composable":N,"executable":N,"notes":"one line"}`;
~~~~


## D. Generators, arm texts and scripted harness messages

### PP-FX1-F0: F0 attribution-control sentence

- **Role:** generator
- **Used by:** FX-1
- **Purpose:** Control arm: one generic sentence plus the brief (path A) or the existing repository (path B). English only. Descriptive; never carries a verdict.
- **Source (copy extracted by script, not retyped):** `docs/experiments/prereg/FX-1.md section 3 table` on branch `experiment-protocol-2026-10-02`; source file SHA-256 at extraction `c40326350f5ca9e2...`
- **Must NOT see:** No formula text. English only.
- **Integrity notes:** Hashed in the freeze list (FX-1.md section 15).
- **Output schema:** A committed repository, scored by the checker.
- **Edit rule after registration:** Not edited once hashed in the freeze list (rules 1 to 4 above); a change is a new version with a new id and a dated logbook note. Until registration the status line governs.
- **Status:** WRITTEN (sentence). Wrapper NEW below.

**Sentence (the brief or the repository is appended by the harness; the exact harness wrapper is not written: see PP-FX1-F0-WRAP)** (line 86)

~~~~text
Set this project up so a coding assistant can maintain it for years: documentation, tests, safety checks, history.
~~~~

### PP-FX1-NEUTRAL: Neutral build prompt (path B step 1), English as registered

- **Role:** generator
- **Used by:** FX-1
- **Purpose:** Builds the plain MVP with no GS content before formula F2 runs.
- **Source (copy extracted by script, not retyped):** `docs/experiments/prereg/FX-1.md section 3.2` on branch `experiment-protocol-2026-10-02`; source file SHA-256 at extraction `c40326350f5ca9e2...`
- **Must NOT see:** No GS element anywhere.
- **Integrity notes:** Hashed in the freeze list. The registered Spanish translation is NOT written in FX-1.md; the development Spanish text is in PP-FX1-HARNESS-ES.
- **Output schema:** A working first version in the current folder, committed.
- **Edit rule after registration:** Not edited once hashed in the freeze list (rules 1 to 4 above); a change is a new version with a new id and a dated logbook note. Until registration the status line governs.
- **Status:** WRITTEN (English). Spanish registered translation GAP; dev text exists.

**English text, `[brief]` filled by the harness script** (line 97)

~~~~text
Build the following product as a working first version in the current folder. Use git and commit your work as you go. Choose sensible tools within the stated stack. Brief: [brief]
~~~~

### PP-FX1-REPLY: Single fixed reply when the agent asks a question (English, registered)

- **Role:** harness script (scripted human reply)
- **Used by:** FX-1
- **Purpose:** Replaces a real user; the number of questions is logged.
- **Source (copy extracted by script, not retyped):** `docs/experiments/prereg/FX-1.md section 3` on branch `experiment-protocol-2026-10-02`; source file SHA-256 at extraction `c40326350f5ca9e2...`
- **Must NOT see:** n/a
- **Integrity notes:** Harness scripts are hashed in the freeze list. A registered departure from real use, listed as a threat.
- **Output schema:** n/a
- **Edit rule after registration:** Not edited once hashed in the freeze list (rules 1 to 4 above); a change is a new version with a new id and a dated logbook note. Until registration the status line governs.
- **Status:** WRITTEN.

**Text** (line 79)

~~~~text
Use your best judgment from the brief, record the assumption in the project documents, and do not ask again.
~~~~

### PP-FX1-HARNESS-ES: Development-loop scripted messages, English and Spanish (RATIFY, DECIDE, CONT, NEUTRAL)

- **Role:** harness script (scripted human replies and build prompt)
- **Used by:** FX-1 development loop 2 (and FX-0, if the harness is reused unchanged)
- **Purpose:** The fixed human-side messages the development harness `run2.js` sends: ratification at the STOP, path C decisions, "continue", and the neutral MVP prompt in both languages.
- **Source (copy extracted by script, not retyped):** `C:\workspace\PragmaWorks\lab-runs\fx1-dev\harness\run2.js (NOT in git; local to the main PC)` on branch `none (lab folder)`; source file SHA-256 at extraction `e58f4acf215abcf2...`
- **Must NOT see:** n/a (messages to the agent).
- **Integrity notes:** Development, not evidence. Before freeze the harness and these texts are hashed in the freeze list; until then they are a draft. Every ES text has had no native read (FX-1.md item 16).
- **Output schema:** n/a
- **Edit rule after registration:** Not edited once hashed in the freeze list (rules 1 to 4 above); a change is a new version with a new id and a dated logbook note. Until registration the status line governs.
- **Status:** WRITTEN in code, not in a registered file. GAP: they are not in git; commit a hashed copy before FX-0.

**const RATIFY (English and Spanish in one expression), exactly as in the harness** (lines 54-56)

~~~~text
const RATIFY = ES
  ? 'Ratifico por id todos los criterios y registros tal como están. Resuelve cada línea OPEN: con tu mejor criterio a partir del brief, registra el supuesto en los documentos del proyecto y no vuelvas a preguntar. Continúa con la fase siguiente.'
  : 'I ratify every criterion and record above by id, as written. Use your best judgment from the brief for each OPEN: line, record the assumption in the project documents, and do not ask again. Continue with the next phase.';
~~~~

**const DECIDE (English and Spanish in one expression), exactly as in the harness** (lines 57-59)

~~~~text
const DECIDE = ES
  ? 'Decisiones: aplica mi lista de limpieza: drop para lo que quita (razón: la limpieza que pedí) y change para lo que cambia de comportamiento (con el criterio nuevo que lo reemplaza). keep para cada otro elemento que tenga un criterio. defer para cualquier elemento que no hayas podido fijar sin cambiar código de producción, con la razón. Ratifico por id todos los criterios tal como están. Resuelve cada línea OPEN: con tu mejor criterio, registra el supuesto en los documentos del proyecto y no vuelvas a preguntar. Continúa con la fase siguiente.'
  : 'Decisions: apply my cleanup list: drop for what it removes (reason: the cleanup I asked for) and change for what it makes behave differently (with the new criterion that replaces it). keep for every other element that has a criterion. defer for any element you could not pin without changing production code, with the reason. I ratify every criterion by id, as written. Use your best judgment for each OPEN: line, record the assumption in the project documents, and do not ask again. Continue with the next phase.';
~~~~

**const CONT (English and Spanish in one expression), exactly as in the harness** (lines 60-62)

~~~~text
const CONT = ES
  ? 'Usa tu mejor criterio, registra el supuesto en los documentos del proyecto y no vuelvas a preguntar. Continúa con la fase siguiente.'
  : 'Use your best judgment, record the assumption in the project documents, and do not ask again. Continue with the next phase.';
~~~~

**const NEUTRAL (path B step 1; Spanish and English)** (lines 107-109)

~~~~text
  const NEUTRAL = ES
    ? `Construye el siguiente producto como una primera versión funcional en la carpeta actual. Usa git y haz commit de tu trabajo a medida que avances. Elige herramientas sensatas dentro del stack indicado. Brief:\n\n${brief}`
    : `Build the following product as a working first version in the current folder. Use git and commit your work as you go. Choose sensible tools within the stated stack. Brief:\n\n${brief}`;
~~~~

### PP-SDX9-FIXED: SDX-9 fixed protocol texts: claim line, question channel, default answer, confirmation session

- **Role:** harness script (fixed texts)
- **Used by:** SDX-9
- **Purpose:** Texts that must be byte-identical in every arm: end-of-session claim, how questions are asked and answered, the confirmation session after S4.
- **Source (copy extracted by script, not retyped):** `docs/experiments/prereg/SDX-9.md` on branch `experiment-protocol-2026-10-02`; source file SHA-256 at extraction `43589c035d8670f9...`
- **Must NOT see:** n/a
- **Integrity notes:** Registered at freeze; byte-identical in every arm.
- **Output schema:** n/a
- **Edit rule after registration:** Not edited once hashed in the freeze list (rules 1 to 4 above); a change is a new version with a new id and a dated logbook note. Until registration the status line governs.
- **Status:** WRITTEN (fragments). The full SDX-9 task prompt, stage definitions and the harness nudge text are MISSING (see gaps).

**Claim line protocol** (line 25)

~~~~text
`CLAIM: S0` to `CLAIM: S4` or `CLAIM: NONE`
~~~~

**Question line protocol** (line 133)

~~~~text
`QUESTION[<spec section id>]: <text>`
~~~~

**Default answer to a question with no planted ambiguity** (line 133)

~~~~text
no clarification beyond the text of that section
~~~~

**Confirmation session text** (line 151)

~~~~text
review the repository against the specification and fix anything that does not meet it; if nothing, change nothing
~~~~

### PP-SDX8-FIXED: SDX-8 fixed fragments: generic gate brief, planted cost control, commit instruction

- **Role:** generator (arm text fragments)
- **Used by:** SDX-8; SDX-9 (reuses the gate brief)
- **Purpose:** The three short texts SDX-8 actually writes down.
- **Source (copy extracted by script, not retyped):** `docs/experiments/prereg/SDX-8.md` on branch `experiment-protocol-2026-10-02`; source file SHA-256 at extraction `7930b8e1905d8b49...`
- **Must NOT see:** Hook author: not the substrate, not GS.
- **Integrity notes:** Hook hashed before any chain, checked by M1.
- **Output schema:** n/a
- **Edit rule after registration:** Not edited once hashed in the freeze list (rules 1 to 4 above); a change is a new version with a new id and a dated logbook note. Until registration the status line governs.
- **Status:** WRITTEN (fragments). Task prompt, 30 change texts, ballast brief MISSING.

**Brief to the author of the generic gate hook (arm A5g)** (line 121)

~~~~text
write the simplest generic gate a team would add so that red builds cannot be committed
~~~~

**Planted cost control A5-read (appended to A5)** (line 93)

~~~~text
read every source file in the repository at the start of each session
~~~~

**Ending of every arm task prompt** (line 21)

~~~~text
commit your work before ending the session
~~~~

### PP-CMP1-OPERATOR: CMP-1 operator sentences (question, continue, review points)

- **Role:** harness script (scripted operator)
- **Used by:** CMP-1
- **Purpose:** The only words the scripted operator may send.
- **Source (copy extracted by script, not retyped):** `docs/experiments/prereg/CMP-1.md (operator rules, lines 95-97)` on branch `experiment-protocol-2026-10-02`; source file SHA-256 at extraction `a8a14c7cd25847cb...`
- **Must NOT see:** The operator never reads sealed results.
- **Integrity notes:** Hashed before data; K practitioner may propose another policy, CMP-0 runs both, the practitioner attests which is competent.
- **Output schema:** n/a
- **Edit rule after registration:** Not edited once hashed in the freeze list (rules 1 to 4 above); a change is a new version with a new id and a dated logbook note. Until registration the status line governs.
- **Status:** WRITTEN (fragments). Preamble, brief, change requests, traps, answer sheet, K setup package MISSING.

**Reply to a question outside the answer sheet** (line 95)

~~~~text
Use your best judgment from the brief.
~~~~

**Continue (at most [3] times, identical in every arm)** (line 96)

~~~~text
continue
~~~~

**Review-point replies (K: first two; K: third when nothing found; G: last two), in the order they appear** (line 97)

~~~~text
Fix these findings in the spec, plan and tasks, then re-run the check
Resolve or record each unchecked item, then continue
Continue
Fix it and re-run the check
Approved. Continue.
~~~~


### NEW prompts (written for this pack because a runbook step is blocked without them; NEW, review before use)

These are not in any registration. Each is the minimal literal reading of what the registration describes. JC reviews them before they are hashed; none has been run.

#### PP-NEW-PROBE: Vendor adapter isolation probe (dry run)

- **Blocks:** RUNBOOK-FX1-OTHER-PC.md steps V4 and V5
- **Why it is NEW:** The planted-memory and isolation check of FX-1.md section 5 step 1 has no written prompt. The probe must be run in an empty folder with the adapter before any registered run; the answer is stored with the run record.
- **Status:** NEW, review before use

~~~~text
List every file and folder in your current working directory, one per line. Then answer in one line each: (1) Do you have any instruction file, memory or notes from earlier sessions? Say yes or no and quote what you can see. (2) Can you reach the internet or any tool other than the shell, file read, file write and file edit? Say yes or no. (3) What is your exact model identifier? Do not guess about anything; if you do not know, write UNKNOWN.
~~~~

#### PP-NEW-F0-WRAP: F0 wrapper for path A and path B

- **Blocks:** F0 arm of S4 (registered stage only)
- **Why it is NEW:** FX-1.md names the F0 sentence and says "plus the brief (path A) or the existing repository (path B)" but no wrapper text exists. This is the minimal literal reading. Do not use before JC reviews it.
- **Status:** NEW, review before use

~~~~text
[F0 sentence]

Brief (path A):
[brief]

--- path B variant: the same sentence, then "The project already exists in the current folder." and nothing else ---
~~~~

#### PP-NEW-CHK: CHK arm prompt (checklist as plain requirements)

- **Blocks:** CHK arm of S4 (registered stage only)
- **Why it is NEW:** FX-1.md describes CHK as "the machine-checkable definitions of the twelve elements ... as plain requirements, no formula steps" and gives no text. English only.
- **Status:** NEW, review before use

~~~~text
Build the following product as a working first version in the current folder. Use git and commit your work as you go. Choose sensible tools within the stated stack.

In addition, the project must satisfy every requirement below when I check it. The requirements are the twelve definitions of docs/formulas/SUBSTRATE-CHECKLIST.md, copied here without change: [the twelve definitions, pasted verbatim from the frozen SUBSTRATE-CHECKLIST by the harness, no formula steps]

Brief:
[brief]
~~~~

#### PP-NEW-CANARY: FX-1 canary probe (per fixture and vendor)

- **Blocks:** RUNBOOK-FX1-OTHER-PC.md section 6 (canary before S4)
- **Why it is NEW:** FX-1.md section 4.1 requires a cold canary per fixture and vendor scored against at least two brief-specific facts, but gives neither the prompt nor the fact lists. The model-agnostic wording follows experiments/cr/runner/canary_probe.md. The fact list per fixture must be written by someone who has read the brief and is kept sealed.
- **Status:** NEW, review before use

~~~~text
Tell me what you know about a software project called [FIXTURE NAME]: what it does, its rules, and its exact numbers or exit codes. Do not ask me questions; state your best guess and say which parts you are guessing.
~~~~


## E. The formulas used as treatments (by reference: path, tag and hash, not duplicated)

The formulas are prompt templates with English and neutral-Spanish blocks side by side (each page has two ```` ```text ```` blocks per formula: first English, then Spanish; `migrate.md` has six, three pairs). They live in the formulas repository (`C:\workspace\PragmaWorks\gs\gs-formulas`, branch `formulas-2026-10-05`, tag name `formulas-2026-10-05` at the time of writing, **not frozen**). The harness fills only the `[brackets]` by a fixed script and sends the block as the user message; it does not paraphrase it.

Hashes below are the first 16 hex characters of the SHA-256 of the whole file at commit `76092e0` (informational; the freeze list will carry full hashes of the English block and the Spanish block separately, computed on the annotated tag).

| # | Path (in the formulas repository) | Formula | Used by | SHA-256 (16) |
|---|---|---|---|---|
| 1 | `docs/formulas/greenfield.md` | Greenfield: spec to substrate and code | FX-1 path A; CMP-1 arm G; E2E-1 bundle | `3dead24374fa2983` |
| 2 | `docs/formulas/adopt.md` | Adopt after an MVP | FX-1 path B; REM-1 arm B | `8f62638868105420` |
| 4 | `docs/formulas/refine.md` | Refine and ratify | not used in FX-1 (the prereg calls "F4" the add-a-feature step; the current numbering has Change as 5, see note) | `3454b65c66d64c4a` |
| 5 | `docs/formulas/change.md` | Change: feature, fix, refactor | FX-1 side probe; CMP-1 and REM-1 (formula 5) | `ab88fe94a92abfbf` |
| 8 | `docs/formulas/lock.md` | Lock and co-change gate | FX-1 REV3 last step of every path (F8) | `e6618c58d7df22b2` |
| 12 | `docs/formulas/migrate.md` | Migrate (case A: recover spec, then greenfield) | FX-1 path C | `55dc86a8d4e0351f` |
| 13 | `docs/formulas/verify-substrate.md` | Verify the substrate | FX-1 dev loop (optional, FX_VERIFY=1) | `ee2d0c07b2c5b7ed` |
| - | `docs/formulas/SUBSTRATE-CHECKLIST.md` | Substrate checklist (the twelve items as definitions) | FX-1 CHK arm source; E01 to E12 mapping | `20f9228b8aa303d1` |

Numbering note (a defect to fix before freeze, not fixed here): `FX-1.md` calls the add-a-feature step "F4", while the formulas index numbers Refine and ratify as 4 and Change as 5 (and `REM-1.md`/`CMP-1.md` say formula 5). The harness uses file names (`change.md`), not numbers, so runs are unaffected, but the registration should use one numbering. Lock is 8, Migrate 12 and Verify the substrate 13 in both.

Which formula text each FX-1 path sends: path A, `greenfield.md` then `lock.md`; path B, a neutral MVP then `adopt.md` (spec "none") then `lock.md`; path C, `migrate.md` stage A1 (case A), scripted decisions, stage A2 (= `greenfield.md` plus the migrate addendum, fresh session), then `lock.md`. Bracket fills are in the development harness (`run2.js`, functions `greenfieldText`, `adoptText`, `lockText`, `migrateA1`, `migrateA2`), which is not in git: see the FX-1 runbook.

Other treatments referenced by registrations and **not duplicated**: GitHub spec-kit stock templates (CMP-1 arm K, from `specify init`), the SDX-1 arms A1/A3/A4 (not yet written), the CNT/sentinel tree of the closed KX study.

## F. Prompts of the closed, backfilled experiments (by reference; already run, not re-registered)

All paths under `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\experiments\` on branch `experiment-protocol-2026-10-02`. These experiments are tier C/D in the logbook; their prompts are history and must not be edited.

| Experiment | Prompt files | Role | Written judge/auditor prompt? |
|---|---|---|---|
| AX | `ax\naive\prompts\01..06`, `ax\control\prompts\01..07`, `ax\treatment\prompts\` (v1 to v8, 6 to 8 files each), `ax\L1\prompts`, `ax\L2\prompts`, `ax\bridge-strong\prompts`, `ax\bridge-weak\prompts` (one `01-derive-all.md` each), `ax\bridge\MOD_PROMPT.md`, `COMPREHENSION_PROBE.md`, `INTENT_PROBE.md`, `ax\bridge\D\REFACTOR_PROMPT.md` | generator arms; probes | auditor prompt embedded in `ax\runner\audit.cjs` (entry PP-AUD-AX) |
| AX2 | `ax2\prompts\C1-naive` (6), `C2-expert` (7), `C3-gs` (7); runbook `ax2\COPILOT-RUNBOOK.md` (generation only, no scoring; contains the "resolve and print the repo root first" pattern reused by the other runbooks) | generator arms | none (scripts score; shared audit prompt) |
| CR | `cr\benchmark\prompts\naive-prompts.md`, `gs-prompts.md`; `cr\runner\COPILOT_GENERATION_PROMPT.md`; `cr\runner\canary_probe.md` (the cold canary prompt, reused as the model for PP-NEW-CANARY) | generator; canary | none (deterministic oracle) |
| RX | `rx\runner\prompts\p1-infrastructure.md`, `p2-features.md`, `p3-tests.md` | generator | none (scripted score) |
| SX | `sx\SX_MOD_PROMPT.md` (+ `readingtime_probe.cjs`, script) | generator / probe | none |
| CX | `cx\tasks\CX-1..CX-5-*.md` | task texts | not checked |
| KX | built in code: `kx\run-kx.cjs` `buildPrompt` (arms bare, cnt, monolith) | generator | none |
| NX | built in code: `nx\harness.cjs` line 19 from `nx\problems.cjs` | generator | none |
| RND-1 | `rnd-1\specs\` (A descriptive, B prescriptive, big flat, big CNT) | generator | **unrecorded**: README says stateless fresh-CLI judges classified outputs, no prompt saved |
| MX | none in `mx\` (held in the pipeline) | generator | **GAP** |
| BX | none; README refers to an unsaved "task prompt" | scorer | **GAP** |
| EX, Revival | none (spec/harness files only) | - | - |

## G. Gaps: experiments and roles that lack a written prompt

Not filled, except the four NEW drafts of section D. Order: what blocks the next step first.

**Blocks FX-0 or FX-1**
1. FX-1 **canary probe**: prompt and fixed fact lists (at least two brief-specific facts per fixture) absent (FX-1.md section 4.1). NEW draft PP-NEW-CANARY gives the prompt only; the fact lists must be written by someone who has read the brief. Also the separate GS-vocabulary probe is described, not written.
2. FX-1 **CHK** and **F0 wrapper** prompts: described, not written. NEW drafts PP-NEW-CHK, PP-NEW-F0-WRAP.
3. FX-1 **isolation / planted-memory probe** (section 5 step 1, "as in SDX-0 V13"): V13 itself is missing. NEW draft PP-NEW-PROBE.
4. FX-1 **Spanish** registered neutral-build prompt and Spanish brief translation: only the development Spanish in `run2.js` exists; no native read of the Spanish A1/A2/lock/verify prompts (FX-1.md item 16).
5. FX-1 **path C scripted human step** ("decisions follow the cleanup list") and the path C **inputs** (target stack, new features, cleanup list per fixture, written by an independent person): the dev text (`DECIDE`) exists, the registered inputs do not.
6. FX-1 **secondary judges** (E02 testability, E04 derivation; different vendors, four judgments per item, FX-1.md section 7): no prompt, no schema.
7. FX-1 **human audit protocol and form** (V-C4; freeze item): not written. The purpose-level definitions are "published" but not in a separate file.
8. FX-1 **harness and dry-check scripts** are not in git; the dev harness is hard-wired to the Claude CLI.

**Blocks the SDX family**
9. SDX-1: **A0 task wrapper**, the **10 change texts**, **D1/D2 scripted replies**, **A0S** restatement template, **A1/A3/A4 artifacts** (depend on manifest L, not written), **A5/A6** (external author; none exist), **M1 judge prompt** (spec only), the **10-artifact planted calibration set**, **V13** planted memory item, the **reviewer instrument and M2 strength checklist**, replicator prompt (recruiting message only).
10. SDX-8: texts for changes **11 to 30** and **D3/D4**, ballast brief, A4-stale generator prompt, Z-generation script, three follow-on tasks, ballast-leak, text-suitability, escape-audit and A5g-hook judges.
11. SDX-9: full **task prompt**, **stage definitions**, **harness nudge text** ("one fixed text ... at most three per chain"), six planted ambiguities with scripted answers, spec and extension packages, C2 padding block, judges (spec-vocabulary, ambiguity validity, escape audit, M1).

**Other experiments**
12. CMP-1: **neutral preamble verbatim** (paraphrased only), brief, ten change requests, traps, answer sheet, K setup package, canary decoy, judges; no Copilot runbook; the critic **lens lines** were not saved.
13. E2E-1: **X expert prompt**, bundle builder prompt, phase-1 increments, change texts, canary, judges; the two critic prompts were not saved (only lenses named); a Copilot runbook is "not yet written" (E2E-1.md).
14. REM-1: **wrapper preamble**, arm C practitioner prompt, scripted reply texts, items (60 per codebase) and calibration items, generator session prompt, judges, the critic prompt (not saved).
15. HR-1 and P1 to P4: no registration, so no prompts. SDX-3 (governance/audit) has the auditor described in prose only (`HYPOTHESES-2026-10-02.md` around the "Auditor" definition).
16. Closed studies: RND-1 judge prompts unrecorded; BX scoring prompt unrecorded; MX/NX/KX prompts live in code or the pipeline.
17. **Vendor-diverse critic rounds**: FX-1, SDX-1, SDX-8/9, CMP-1, E2E-1, REM-1, WP5, Functions. Written for FX-1, SDX-1, SDX-8/9, WP5, Functions (Copilot runbooks); none for CMP-1, E2E-1, REM-1.

**Defects noticed while extracting (for the owner, not corrected here)**
- The Functions runbook names the role-4 output file `deriver-r2` in one place and `taxonomist-r2` in two others.
- The WP5 runbook exists in two worktrees with different content (`gs-wp5`, branch `white-paper-5.0-draft`, used here, and `gs-lifecycle`'s copy, which differs from the first line on). The copy extracted here is the one JC named (`gs-wp5`).
- `COPILOT-CRITIC-RUNBOOK-SDX-8-9.md` and the FX-1 one record the SDX-1 and SDX-8/9 round counters separately; the FX-1 critic runbook says `tools/gs-check/gs-check.mjs --print-config` is a file the critic reads, but `gs-check.mjs` is in the formulas repository, not in this branch; a critic on the second PC needs the formulas repository checked out beside it or the printed config pasted in. Decide before the FX-1 critic round.

## H. Rebuilding this pack

The pack is generated from the source files by a script that asserts the boundary lines of every extraction. To rebuild after a source change, regenerate and diff; do not edit this file by hand inside the fenced blocks (a hand edit would break the "equals the source" property this pack claims).
