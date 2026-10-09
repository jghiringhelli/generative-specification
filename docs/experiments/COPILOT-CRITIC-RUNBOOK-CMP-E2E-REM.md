# CMP-1, E2E-1 and REM-1 independent critique: Copilot runbook (one critique per model and target)

> **NEW, review before relying on it (written 2026-10-09).** No Copilot runbook existed for these three registrations; the first rounds were Claude-only and their prompts were not all saved (prompt pack, section G items 12 to 14). This file follows the pattern of `docs/experiments/COPILOT-CRITIC-RUNBOOK-SDX-8-9.md` and reuses the examination list of the saved CMP-1 critic prompt (`PP-CRIT-CMP1`). It registers nothing.
>
> **You are the Copilot agent (or a headless Copilot CLI session) on JC's second PC.** You are the model that was selected for this session. Your one job: read the files listed for your TARGET in section 2, act as an adversarial reviewer of that experiment design, write ONE critique file, commit it locally. You do **not** run any experiment, you do **not** edit any design file, and you do **not** read anything outside the allowed files. The critique is scored and merged on the main PC.

**State of review, plainly.** CMP-1, E2E-1 and REM-1 have so far been reviewed only by two fresh Claude critics each (records: `docs/experiments/prereg/CMP-1-REVIEW.md`, `E2E-1-REVIEW.md`, `REM-1-REVIEW.md`). Vendor-diverse review is owed. A round needs at least 3 vendors, at least 2 not Anthropic (same rule as SDX-1). Each target has its own round counter.

## For JC (not for the agent): how to drive this
- **Headless (the harness does it):** `node experiments/fx1/harness/critic-run.mjs --target cmp1|e2e1|rem1 --model <exact CLI model id> --adapter copilot`. The harness builds a snapshot folder with only the allowed files and this runbook, and sends the one line below followed by a DRIVER block that answers section 1.
- **By hand (a chat in the editor):** a NEW chat per model and per target, agent mode, no earlier context, no custom instructions or memory if you can switch them off. Send exactly: `Follow the file docs/experiments/COPILOT-CRITIC-RUNBOOK-CMP-E2E-REM.md in this repository from section 0 with TARGET=CMP-1.` (or `TARGET=E2E-1`, `TARGET=REM-1`). The agent asks for the exact model id and the round; paste them exactly as displayed.

## 0. Resolve paths first (repo-root-relative)
1. Find the repository root: the folder that contains `docs/experiments/prereg/` and this runbook.
2. Set and **print** `REPO=<the absolute path on THIS PC>`.
3. Run `git rev-parse HEAD` and `git branch --show-current` and print both. The branch must be `experiment-protocol-2026-10-02`; if not, stop and tell JC.
4. Take TARGET from the message (`CMP-1`, `E2E-1` or `REM-1`). If it is missing or different, stop and ask.
5. Print the absolute path of each allowed file for your TARGET (section 2) and its SHA-256. Do not continue until all exist and print.
6. Print the output directory `$REPO/docs/experiments/critiques/` (create if missing).

## 1. Ask two things, then wait (or take them from the DRIVER block)
1. The exact model id string (`MODEL_ID_AS_SHOWN`, verbatim). 2. The round (default 1).
Derive `VENDOR` (one lowercase word: `openai`, `google`, `anthropic`, `xai`, `mistral`, `deepseek`, `meta`, or the plain name) and `MODEL_SLUG` (the id lowercased, every run of characters other than a-z and 0-9 replaced by one `-`, trimmed). Output file: `docs/experiments/critiques/cmp-e2e-rem-<target-lowercase>-<VENDOR>-<MODEL_SLUG>.md` (for example `cmp-e2e-rem-cmp-1-openai-gpt-5-4.md`), with `-r<ROUND>` before `.md` for round 2 and later. If the file exists, stop.

## 2. The only files you may read (nothing else, in the repository or anywhere)
| TARGET | Registration under review | Protocol |
|---|---|---|
| CMP-1 | `docs/experiments/prereg/CMP-1.md` (pilot: bare model vs GitHub spec-kit vs GS, one invented task, 2 vendors, k = 5) | `docs/experiments/EXPERIMENT-PROTOCOL.md` |
| E2E-1 | `docs/experiments/prereg/E2E-1.md` (end-to-end 2x2, prompt quality x substrate, medium projects, three vendors) | `docs/experiments/EXPERIMENT-PROTOCOL.md` |
| REM-1 | `docs/experiments/prereg/REM-1.md` (remediation economics: when does remediating a legacy codebase pay back; three vendors) | `docs/experiments/EXPERIMENT-PROTOCOL.md` |

You are deliberately NOT given: the review records of the registrations (`*-REVIEW.md` and `*-review-raw`), sibling designs, the simulations, the formulas, the logbook, any paper, any chat, any other critic's file. The drafts name some of these. Do not open them. If a missing file would change a judgment, say so in section 6 of your output.

## 3. The critic prompt (fixed; follow it exactly; this is your whole assignment)

Read the files completely before writing anything. Then do the following.

---
**ROLE.** You are an adversarial reviewer of an experiment design: a draft preregistration, written by the proponents of a software-engineering method called Generative Specification (GS). The authors have a stake in the answer and have said so. They asked for hostile, honest, independent review in BOTH directions: find where the design is rigged in favour of GS, where it is rigged or handicapped against GS (or against a named comparator), and where it cannot tell anybody anything. Reporting no problems is a failure of the assignment; so is inventing problems you cannot quote. You have no memory of earlier reviews and are not shown any. Do not defer to the authors' own descriptions of their mitigations: check whether each mitigation actually works. Do not repeat a limit the design already declares unless you argue the declared mitigation fails.

**WHAT TO EXAMINE** (cover all; add others you find):
1. Construct validity and arm fairness: does each arm get the tool's or method's own best documented use? Is the comparator a strawman? Does the scripted operator treat arms alike? Do the metrics avoid any arm's own vocabulary or checker? Is the primary readout what the title claims?
2. Favouring GS by construction: authorship of the task, traps, probes and answer sheet, ordering, scripted replies, probe selection, decision-table wording, INVALID-DESIGN symmetry (can the authors declare an unfavourable result invalid more easily than a favourable one?), who analyses, what is charged to which arm.
3. Handicapping a method or tool: scale, headless invocation, scripted ratification, one attempt, cumulative cascades, vendor-CLI confounds, caps, strict rules, anything that could produce a null or negative result for reasons that do not concern the method.
4. Power and statistics: the intervals, tests and classes, multiplicity, what the sample can and cannot show, the claims about it, any simulation as described, interim looks, avoidable analytic freedom, censoring, covariates affected by the arm.
5. Oracle and measurement: sealed probes, trap counting, escaped-defect definition, cost accounting (including setup and token metering), review-surface or maintainability metrics, classifiers, judges (their vendor, blindness, calibration), whether anything measured is targeted by the treatment, whether it can be gamed.
6. Falsifiability and informativeness: is there any result that would make the authors change their mind, as written? Which decision-table rows are reachable and which are escape hatches? What is the most probable outcome and would it change any decision? Does the cost buy information? What may the public statement table permit, and is it honest?
7. Up to three better designs for the same money, with the reason.
8. Anything circular, confusing or ambiguous for a future reader, including naming, licence and etiquette issues.

**RULES OF THE REVIEW.** Quote exactly: every finding must quote (verbatim, in quotation marks) the passage it targets and name the file and the section. Every finding must propose a concrete fix (a changed sentence, rule, control or number with a reason). Rank by severity. Be specific, not general. Do not praise; you may state in one sentence in section 6 what you checked and found sound. At most 30 findings; merge near-duplicates.

**SEVERITY.** BLOCKER: as written, the result would be uninterpretable, or biased for or against the method whatever the data say, or the design cannot be falsified; must be fixed before freezing. MAJOR: materially weakens a conclusion or inflates its permitted claim. MINOR: a real defect with limited effect. NIT: wording, ordering, clarity.

**OUTPUT.** Write exactly the schema in section 5, in one Markdown file. No preface, no closing remarks outside the schema.
---

## 4. Integrity rules (all mandatory; breaking one makes the critique unusable)
1. Do not edit, move, delete or reformat any file other than creating your one critique file. Do not touch anything under `docs/experiments/prereg/`.
2. Do not read any file other than those allowed in section 2; do not open other files in `docs/experiments/critiques/`; do not browse or search the repository.
3. Use no tools beyond reading the allowed files, the git and hashing commands of sections 0 and 6, and creating your output file. No web, no code execution, no other models, no extensions, no other chats.
4. Do not use memory of earlier sessions or conversations with JC. If you recall this project from before, say so in `PRIOR_EXPOSURE`.
5. Do not communicate with other critics; do not soften findings to match what you think the authors want.
6. Do not run any experiment and do not generate any product code.
7. Be honest about uncertainty (`CONFIDENCE`); do not invent facts about the repository or the literature; flag anything cited from memory.
8. One critique per session. After you finish, do nothing else.

## 5. The output file schema (write to the file named in section 1)
Use these exact headings, in this order. The main PC counts severities with a script, so keep the field names and the `### F-nn` block structure exactly.

```markdown
# <TARGET> critique: <VENDOR> <MODEL_ID_AS_SHOWN>

## 0. Header
- VENDOR: <vendor word>
- MODEL_ID_AS_SHOWN: <exact string>
- TARGET: <CMP-1 | E2E-1 | REM-1>
- HARNESS: github-copilot-agent-vscode | github-copilot-cli-headless
- ROUND: <n>
- DATE_UTC: <ISO 8601>
- REPO_HEAD: <git rev-parse HEAD>
- BRANCH: experiment-protocol-2026-10-02
- FILES_READ:
  - <path>  sha256=<hex>
- FILES_NOT_READ_ATTESTATION: I read no other file and used no tool other than reading these files and the git and hash commands.
- PRIOR_EXPOSURE: none | <describe>
- NOTES: <anything odd: truncation, tool limits, context cut>

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
### 3a. Ways the design favours GS by construction
### 3b. Ways the design handicaps GS or a comparator, or is rigged against it
### 3c. Ways the design is unfalsifiable, cannot inform, or has a modal outcome that changes no decision

## 4. Better designs (at most three)
### H-A, H-B, H-C
- STATEMENT:
- WHY MORE INFORMATIVE:
- WHAT IT NEEDS (arms, n, readout):

## 5. Convince-me statements
- WHAT RESULT WOULD CONVINCE ME THE METHOD MATTERS:
- WHAT RESULT WOULD CONVINCE ME IT DOES NOT:
- WHAT THE DESIGN AS WRITTEN WOULD NEED, SO THAT BOTH OF THE ABOVE ARE POSSIBLE:

## 6. What I could not assess, and what I checked and found sound
```

## 6. Finish: commit locally
After the file is written and you have re-read it once for schema compliance (headings, field names, every finding has QUOTE and FIX):
```
git add docs/experiments/critiques/<your file name>
git commit -m "critique(<target>): independent review by <VENDOR> <MODEL_ID_AS_SHOWN> round <ROUND>"
```
Then tell JC: the file path and the number of findings by severity. **Do not push to the protocol repository** unless JC's message tells you to; on JC's second PC the harness (or JC) copies critiques to the private results repository, `pragma-works/genspec-experiment-results`. Do nothing else.

## 7. Notes for the main PC (JC and the assistant; the agent can ignore this)
- Run the leakage scan on each critique (procedure in `docs/experiments/ROLES.md` section 3); count findings by severity with a script; adjudicate per `ROLES.md` section 3.
- Check each critique's file hashes against the commit named in `REPO_HEAD` (a snapshot commit when run by the harness: the real source commit is in the run's `meta.json`).
- This runbook is NEW and unreviewed: read it once, and edit it as a recorded new round if you change the prompt.
