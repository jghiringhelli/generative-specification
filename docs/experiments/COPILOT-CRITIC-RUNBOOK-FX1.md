# FX-1 independent critique: Copilot runbook (one critique per model)

> **You are the Copilot agent on JC's second PC.** You are the model currently selected in the Copilot picker. Your one job in this session: read the files listed in section 2, act as an adversarial reviewer of a reliability-estimation study and of the conformance checker that measures it, write ONE critique file, commit it and push it. You do **not** run any experiment, you do **not** run the checker, you do **not** edit any design file, and you do **not** read anything outside the allowed files. The critique is scored and merged on the main PC.

This runbook follows the pattern of `docs/experiments/COPILOT-CRITIC-RUNBOOK.md` (SDX-1) with the target changed. FX-1 is a separate review target with its own round counter; its rounds do not reset SDX-1, SDX-8 or SDX-9. **Status of review so far (2026-10-05): two stateless Claude critics only (`docs/experiments/prereg/FX-1-REVIEW.md`). Vendor-diverse review is owed**: this runbook is how it is obtained. A round needs at least 3 vendors, at least 2 not Anthropic.

## For JC (not for the agent): how to drive this
1. On the second PC: `git fetch`, check out branch `experiment-protocol-2026-10-02`, `git pull`. (Sparse checkout is enough: add `experiments/fx1` and `docs/experiments` to the list.)
2. For each model you want a critique from (newest GPT, newest Gemini, and every other frontier model in the picker; one fresh chat per model, never two models in one chat): open a NEW Copilot chat, agent mode, no earlier context, no custom instructions or memory if you can switch them off, pick the model, and send exactly this one line: `Follow the file docs/experiments/COPILOT-CRITIC-RUNBOOK-FX1.md in this repository from section 0.`
3. The agent will ask you for the exact model id string shown by the picker. Paste it exactly as displayed.
4. When it says the critique is pushed, close the chat. Next model.
5. Round number: default round 1. For a later round add `ROUND=2` to the message; the agent then adds `-r2` to the file name.
6. Before round 1: the benchmark briefs leave the machine inside vendor sessions; confirm in the Copilot and vendor settings that your content is not used for training and record the decision.

---

## 0. Resolve paths first (why they are repo-root-relative)
JC's usual rule is absolute paths always. You are on a different PC, so the absolute location of the repository is unknown to whoever wrote this runbook. Resolve it yourself and pin it, then treat every path below as relative to it.

1. Find the repository root: the folder that contains `docs/experiments/prereg/FX-1.md` and `tools/gs-check/gs-check.mjs`.
2. Set and **print** it: `REPO=<the absolute path on THIS PC>`.
3. Run `git rev-parse HEAD` and `git branch --show-current` and print both. The branch must be `experiment-protocol-2026-10-02`; if not, stop and tell JC.
4. Print the absolute path of each allowed file (section 2) and its SHA-256. Do not continue until all exist and print.
5. Print the output directory `$REPO/docs/experiments/critiques/` (create if missing).

## 1. Ask JC two things, then wait
1. "What is the exact model id string shown in the Copilot picker for this chat?" (record verbatim in `MODEL_ID_AS_SHOWN`).
2. "Which round is this? (default 1)".
Then derive `VENDOR` (one lowercase word: `openai`, `google`, `anthropic`, `xai`, `mistral`, `deepseek`, `meta`, or the plain name) and `MODEL_SLUG` (the id lowercased, every run of characters other than a-z, 0-9 replaced by a single `-`, trimmed). Output file: `docs/experiments/critiques/fx1-<VENDOR>-<MODEL_SLUG>.md` for round 1, `docs/experiments/critiques/fx1-<VENDOR>-<MODEL_SLUG>-r<ROUND>.md` for later rounds. If the file exists, stop and tell JC (never overwrite another session's critique).

## 2. The only files you may read (nothing else)
1. `docs/experiments/prereg/FX-1.md` (the draft registration under review)
2. `docs/experiments/FX-1-CHECKER-SPEC.md` (the checker specification; part of the same registration)
3. `docs/experiments/EXPERIMENT-PROTOCOL.md` (the protocol the registration must obey)
4. `tools/gs-check/gs-check.mjs --print-config` (the frozen parameters of the checker are its embedded default configuration)
5. `experiments/fx1/fixtures/README.md` and the five briefs `experiments/fx1/fixtures/FIX-API-lendmark.md`, `FIX-CLI-stitchcount.md`, `FIX-PIPE-tidewatch.md`, `FIX-GAME-cinderfall.md`, `FIX-MCP-shelfwise.md`
6. `experiments/fx1/simulation/results.md` (the sample-size simulation output)

You are deliberately NOT given the review record (`docs/experiments/prereg/FX-1-REVIEW.md` and `docs/experiments/prereg/FX-1-review-raw/`), the checker's source code, the formulas, any other registration, the logbook, any paper, any chat, any other critic's file. If a missing file would change a judgment, say so in section 6 of your output.

## 3. The critic prompt (fixed; follow it exactly; this is your whole assignment)

Read all files completely before writing anything. Then do the following.

---
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
---

## 4. Integrity rules (all mandatory; breaking one makes the critique unusable)
1. Do not edit, move, delete or reformat any file other than creating your one critique file. Do not touch anything under `docs/experiments/prereg/` or `experiments/`.
2. Do not read any file other than those in section 2. Do not open any other file in `docs/experiments/critiques/` other than to check that your own output path is free. Do not browse or search the repository.
3. Use no tools beyond reading the allowed files, running the git and hashing commands in sections 0, 1 and 6, and creating your one output file. No web search, no code execution, **do not run the checker or the simulation**, no calling other models, no extensions, no other chats.
4. Do not use memory of earlier sessions or conversations with JC. If you recall this project, say so in `PRIOR_EXPOSURE`.
5. Do not communicate with other critics or guess what they will say; do not soften findings to match what you think the authors want.
6. Do not run any experiment and do not generate any project code.
7. Be honest about uncertainty (the `CONFIDENCE` field); do not state invented facts about the repository or the literature. Flag any statistical claim or citation from memory.
8. One critique per session. After you push, do nothing else.

## 5. The output file schema (write to the file named in section 1)

Use these exact headings, in this order; the main PC counts severities with a script.

```markdown
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
```

## 6. Finish: commit and push
After the file is written and you have re-read it once for schema compliance (headings, field names, every finding has QUOTE and FIX):
```
git add docs/experiments/critiques/<your file name>
git commit -m "critique(fx-1): independent review by <VENDOR> <MODEL_ID_AS_SHOWN> round <ROUND>"
git pull --rebase
git push origin experiment-protocol-2026-10-02
```
If `git push` is rejected, run `git pull --rebase` once more and push again; never force-push; never touch another file to resolve a conflict. Then tell JC: the file path, the number of findings by severity, and that it is pushed. Do nothing else.

## 7. Notes for the main PC (JC and the assistant; the agent can ignore this)
- Leakage scan on each critique (`docs/experiments/ROLES.md` section 3): it must not echo wording or ids from the Claude critics' review record; if it does, exclude and rerun that model.
- Check each critique's file hashes against `Get-FileHash` on the commit named in `REPO_HEAD`.
- Count findings by severity with a script; adjudicate per `ROLES.md` section 3 (ACCEPTED, ACCEPTED-AS-DECLARED-LIMIT, REJECTED with written refutation, DEFERRED) into `docs/experiments/prereg/FX-1-REVIEW.md`. A round needs at least 3 vendors, at least 2 not Anthropic. The stop rule is the one of `ROLES.md` section 6, with its own counter for FX-1.
- A different-vendor judge is also needed later for the secondary judgments of FX-1 section 7, and a different-vendor reading of the checker's controls (`tools/gs-check/test/variants.mjs`) is a good use of a second round, because this round does not give the critics the checker's source.
