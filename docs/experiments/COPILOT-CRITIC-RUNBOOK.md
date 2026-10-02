# SDX-1 independent critique: Copilot runbook (one critique per model)

> **You are the Copilot agent on JC's second PC.** You are the model currently selected in the Copilot picker. Your one job in this session: read four files, act as an adversarial reviewer of an experiment design, write ONE critique file, commit it and push it. You do **not** run any experiment, you do **not** edit any design file, and you do **not** read anything outside the four allowed files. The critique is scored and merged on the main PC.

## For JC (not for the agent): how to drive this
1. On the second PC: `git fetch`, check out branch `experiment-protocol-2026-10-02`, `git pull`.
2. For each model you want a critique from (newest GPT, newest Gemini, and every other vendor or model in the picker that is a frontier model: one fresh chat per model, never two models in one chat, never two critiques in one chat): open a NEW Copilot chat, agent mode, no earlier context, no custom instructions or memory enabled if you can switch them off, pick the model, and send exactly this one line: `Follow the file docs/experiments/COPILOT-CRITIC-RUNBOOK.md in this repository from section 0.`
3. The agent will ask you for the exact model id string shown by the picker. Paste it exactly as displayed (including any version or date). Do not paraphrase it.
4. When it says the critique is pushed, close the chat. Next model.
5. Optional, stronger: before step 2, open a Copilot workspace on a folder that holds ONLY copies of the four allowed files plus this runbook, so the agent cannot wander. The runbook works either way; the rules in section 4 apply in both.
6. Round number: the default is round 1. For a later round, add to the one-line message: `ROUND=2` (and so on). The agent then adds `-r2` to the file name.

---

## 0. Resolve paths first (why they are repo-root-relative)
JC's usual rule is absolute paths always. You are on a different PC, so the absolute location of the repository is unknown to whoever wrote this runbook. Therefore resolve it yourself and pin it, then treat every path below as relative to it.

1. Find the repository root: the folder that contains `docs/experiments/prereg/SDX-1.md` and `experiments/cr/benchmark/DOMAIN_SPEC.md`.
2. Set and **print** it: `REPO=<the absolute path on THIS PC>`.
3. Run `git rev-parse HEAD` and `git branch --show-current` and print both. The branch must be `experiment-protocol-2026-10-02`; if not, stop and tell JC.
4. Print the absolute path of each of the four allowed files (section 2) and its SHA-256. Do not continue until all four exist and print.
5. Print the output directory `$REPO/docs/experiments/critiques/` (create if missing).

## 1. Ask JC two things, then wait
1. "What is the exact model id string shown in the Copilot picker for this chat?" (record verbatim in `MODEL_ID_AS_SHOWN`).
2. "Which round is this? (default 1)".
Then derive:
- `VENDOR` = one lowercase word for the company behind the model: `openai`, `google`, `anthropic`, `xai`, `mistral`, `deepseek`, `meta`, or the plain name.
- `MODEL_SLUG` = `MODEL_ID_AS_SHOWN` lowercased, every run of characters other than a-z, 0-9 replaced by a single `-`, trimmed of leading and trailing `-`.
- Output file: `docs/experiments/critiques/<VENDOR>-<MODEL_SLUG>.md` for round 1, or `docs/experiments/critiques/<VENDOR>-<MODEL_SLUG>-r<ROUND>.md` for round 2 and later.
If the file already exists, stop and tell JC (never overwrite another session's critique).

## 2. The only files you may read (nothing else, in the repository or anywhere)
1. `docs/experiments/prereg/SDX-1.md` (the draft preregistration under review)
2. `docs/experiments/prereg/SDX-1-ARMS.md` (the arms, the load-bearing list, authorship and manipulation checks; part of the same registration)
3. `docs/experiments/EXPERIMENT-PROTOCOL.md` (the protocol the registration must obey)
4. `experiments/cr/benchmark/DOMAIN_SPEC.md` (the base specification of the invented project "Pastura" that every arm builds; it is the minimum description of the benchmark. Note: SDX-1 section 4 says the final scaffold is fixed to Node with the built-in HTTP server and SQLite and so on; where DOMAIN_SPEC names PostgreSQL or a framework, treat that as superseded by the scaffold described in SDX-1)

You are deliberately NOT given: the earlier review file (`docs/experiments/prereg/SDX-REVIEW.md` and the folder beside it), the pilot design, the logbook, any paper, any chat, any other critic's file in `docs/experiments/critiques/`. SDX-1 mentions some of these by name. Do not open them. If a missing file would change a judgment, say so in section 6 of your output ("what I could not assess").

## 3. The critic prompt (fixed; follow it exactly; this is your whole assignment)

Read the four files completely before writing anything. Then do the following.

---
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
---

## 4. Integrity rules (all mandatory; breaking one makes the critique unusable)
1. Do not edit, move, delete or reformat any file other than creating your one critique file. Do not touch anything under `docs/experiments/prereg/`.
2. Do not read any file other than the four in section 2. In particular do not open any file in `docs/experiments/critiques/` other than to check that your own output path is free, do not open `docs/experiments/prereg/SDX-REVIEW.md` or its raw folder, do not browse the repository, do not search it for text. If your tooling shows you a file listing, you still do not read other files.
3. Use no tools beyond reading the four allowed files, running the git and hashing commands in sections 0, 1 and 6, and creating your one output file. No web search, no web fetch, no code execution, no running tests, no calling other models, no extensions, no reading other chats.
4. Do not use memory of earlier sessions or earlier conversations with JC. If you have any recollection of this project from before this chat, say so in the output header field `PRIOR_EXPOSURE`; do not use it silently.
5. Do not communicate with other critics; do not try to guess what others will say; do not soften findings to match what you think the authors want.
6. Do not run any experiment and do not generate any Pastura code.
7. Be honest about uncertainty: use the `CONFIDENCE` field; do not state invented facts about the repository or about the literature. If you cite a statistical result or a published paper, say how sure you are and flag that it is from memory.
8. One critique per session. After you push, do nothing else.

## 5. The output file schema (write to the file named in section 1)

Use these exact headings, in this order. The main PC counts severities with a script, so keep the field names and the `### F-nn` block structure exactly.

```markdown
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
```

## 6. Finish: commit and push
After the file is written and you have re-read it once for schema compliance (headings, field names, every finding has QUOTE and FIX):
```
git add docs/experiments/critiques/<your file name>
git commit -m "critique(sdx-1): independent review by <VENDOR> <MODEL_ID_AS_SHOWN> round <ROUND>"
git pull --rebase
git push origin experiment-protocol-2026-10-02
```
If `git push` is rejected, run `git pull --rebase` once more and push again; never force-push; never touch another file to resolve a conflict (if a conflict is not trivially yours, stop and tell JC). Then tell JC: the file path, the number of findings by severity, and that it is pushed. Do nothing else.

## 7. Notes for the main PC (JC and the assistant; the agent can ignore this)
- Run the leakage scan on each critique (procedure in `docs/experiments/ROLES.md` section 3): it must not echo wording or ids from any earlier review; if it does, exclude and rerun that model.
- Check each critique's three FILE hashes against `Get-FileHash` on the commit named in `REPO_HEAD`.
- Count findings by severity with a script; adjudicate per `docs/experiments/ROLES.md` section 3 (ACCEPTED, ACCEPTED-AS-DECLARED-LIMIT, REJECTED with written refutation, DEFERRED). A round needs at least 3 vendors, at least 2 not Anthropic.
- Data-handling check before round 1: the benchmark spec leaves the machine inside vendor sessions. Confirm in the Copilot and vendor settings that your content is not used for training; the canary probe (`experiments/cr/runner/canary_probe.md`) measures recall for the generator only. Record the decision.
