# SDX-8 and SDX-9 independent critique: Copilot runbook, second critic batch (one critique per model)

> **You are the Copilot agent on JC's second PC.** You are the model currently selected in the Copilot picker. Your one job in this session: read three files, act as an adversarial reviewer of two experiment design drafts, write ONE critique file, commit it and push it. You do **not** run any experiment, you do **not** edit any design file, and you do **not** read anything outside the three allowed files. The critique is scored and merged on the main PC.

This is the **second batch** of critics. The first batch (`COPILOT-CRITIC-RUNBOOK.md`) reviews SDX-1 and is a separate target with separate materials; do not mix them. SDX-8 and SDX-9 are separate later review targets: they are their own registrations, they do not reset the SDX-1 critic counter (`ROLES.md` section 6), and their critic rounds are counted separately.

**State of review, plainly:** SDX-8 and SDX-9 have so far been reviewed only by two stateless Claude critics (record: `docs/experiments/prereg/SDX-8-9-REVIEW.md`). **Vendor-diverse review of SDX-8 and SDX-9 is still owed.** The round needs at least 3 vendors, at least 2 not Anthropic (same rule as SDX-1).

## For JC (not for the agent): how to drive this
1. On the second PC: `git fetch`, check out branch `experiment-protocol-2026-10-02`, `git pull`.
2. For each model you want a critique from (newest GPT, newest Gemini, every other frontier model in the picker; one fresh chat per model, never two models or two critiques in one chat): open a NEW Copilot chat, agent mode, no earlier context, no custom instructions or memory if you can switch them off, pick the model, and send exactly this one line: `Follow the file docs/experiments/COPILOT-CRITIC-RUNBOOK-SDX-8-9.md in this repository from section 0.`
3. The agent will ask you for the exact model id string shown by the picker. Paste it exactly as displayed. Round number default 1; for a later round add `ROUND=2` to the one-line message.
4. When it says the critique is pushed, close the chat. Next model.
5. Optional, stronger: open a Copilot workspace on a folder that holds ONLY copies of the three allowed files plus this runbook.

## 0. Resolve paths first (repo-root-relative, because the absolute location on this PC is unknown to the writer)
1. Find the repository root: the folder that contains `docs/experiments/prereg/SDX-8.md` and `docs/experiments/prereg/SDX-9.md`.
2. Set and **print** `REPO=<the absolute path on THIS PC>`.
3. Run `git rev-parse HEAD` and `git branch --show-current` and print both. The branch must be `experiment-protocol-2026-10-02`; if not, stop and tell JC.
4. Print the absolute path of each of the three allowed files (section 2) and its SHA-256. Do not continue until all three exist and print.
5. Print the output directory `$REPO/docs/experiments/critiques/` (create if missing).

## 1. Ask JC two things, then wait
1. "What is the exact model id string shown in the Copilot picker for this chat?" (record verbatim in `MODEL_ID_AS_SHOWN`).
2. "Which round is this? (default 1)".
Derive `VENDOR` (one lowercase word: `openai`, `google`, `anthropic`, `xai`, `mistral`, `deepseek`, `meta`, or the plain name) and `MODEL_SLUG` (`MODEL_ID_AS_SHOWN` lowercased, every run of characters other than a-z and 0-9 replaced by one `-`, trimmed). Output file: `docs/experiments/critiques/sdx89-<VENDOR>-<MODEL_SLUG>.md` for round 1, `...-r<ROUND>.md` for later rounds. If the file exists, stop and tell JC.

## 2. The only files you may read (nothing else, in the repository or anywhere)
1. `docs/experiments/prereg/SDX-8.md` (draft preregistration: long growing chain, registered crossover in change index)
2. `docs/experiments/prereg/SDX-9.md` (draft preregistration: one fixed spec built in stages to a verified COMPLETE, registered crossover stage)
3. `docs/experiments/EXPERIMENT-PROTOCOL.md` (the protocol the registrations must obey)

You are deliberately NOT given: the SDX-1 files that the two drafts say they share artifacts with (so you cannot check byte-identity or fairness of those shared artifacts; say so in section 6 where it matters), the earlier review files, the logbook, any paper, any chat, any other critic's file. The drafts name some of these. Do not open them.

## 3. The critic prompt (fixed; follow it exactly; this is your whole assignment)

Read the three files completely before writing anything. Then do the following.

---
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
---

## 4. Integrity rules (all mandatory; breaking one makes the critique unusable)
1. Do not edit, move, delete or reformat any file other than creating your one critique file. Do not touch anything under `docs/experiments/prereg/`.
2. Do not read any file other than the three in section 2; do not open other files in `docs/experiments/critiques/`; do not browse or search the repository.
3. Use no tools beyond reading the three files, the git and hashing commands of sections 0 and 6, and creating your output file. No web, no code execution, no other models, no extensions, no other chats.
4. Do not use memory of earlier sessions or conversations with JC. If you recall this project from before, say so in `PRIOR_EXPOSURE`.
5. Do not communicate with other critics; do not soften findings to match what you think the authors want.
6. Do not run any experiment and do not generate any Pastura code.
7. Be honest about uncertainty (`CONFIDENCE`); do not invent facts about the repository or the literature; flag anything cited from memory.
8. One critique per session. After you push, do nothing else.

## 5. The output file schema (write to the file named in section 1)

```markdown
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
```

## 6. Finish: commit and push
After re-reading once for schema compliance (headings, field names, every finding has QUOTE and FIX):
```
git add docs/experiments/critiques/<your file name>
git commit -m "critique(sdx-8-9): independent review by <VENDOR> <MODEL_ID_AS_SHOWN> round <ROUND>"
git pull --rebase
git push origin experiment-protocol-2026-10-02
```
If the push is rejected, `git pull --rebase` once more and push again; never force-push; never touch another file to resolve a conflict (if a conflict is not trivially yours, stop and tell JC). Then tell JC: the file path, the number of findings by severity, and that it is pushed. Do nothing else.

## 7. Notes for the main PC (JC and the assistant; the agent can ignore this)
- Leakage scan per `ROLES.md` section 3: a critique must not echo wording or ids from the Claude critic record `SDX-8-9-REVIEW.md` or from SDX-1 rounds.
- Check each critique's three file hashes against `Get-FileHash` on the commit in `REPO_HEAD`; count severities by script; adjudicate per `ROLES.md` section 3 into a new round section of `SDX-8-9-REVIEW.md` (ACCEPTED, ACCEPTED-AS-DECLARED-LIMIT, REJECTED with written refutation, DEFERRED). A finding that implies a change to a shared SDX-1 artifact is routed to SDX-1's adjudication (cross-registration), not applied in SDX-8 or SDX-9.
- The stop rule of `ROLES.md` section 6 applies to SDX-8 and SDX-9 separately from SDX-1 (two consecutive vendor-diverse rounds with no accepted BLOCKER, maximum four).
- The two drafts share artifacts with SDX-1 that these critics cannot see; the SDX-1 critic rounds are what covers them. A later round may add `SDX-1.md` and `SDX-1-ARMS.md` to the allowed files if JC wants byte-identity claims checked.
- Data-handling check before round 1, as for SDX-1: confirm in the Copilot and vendor settings that content is not used for training; record the decision.
