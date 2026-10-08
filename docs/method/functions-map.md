---
layout: default
title: Functions and mechanisms map (proposal)
parent: The Method
nav_order: 12
nav_exclude: true
permalink: /method/functions-map/
description: "A taxonomy of the method's five functions and two invariants, the mechanisms that realize each, the gaps, and a one-page executive table. Proposal; not for external citation until a vendor-diverse repeat."
---

# Functions and mechanisms map

**Status: proposal, design only. Do not cite externally** until the vendor-diverse repeat of the critic round is done ([runbook](COPILOT-CRITIC-RUNBOOK-FUNCTIONS.md)). Every critic so far was one model family. Purpose: put the method's parts in order and make the gaps visible. Companion to [the whole lifecycle](lifecycle-whole.md).

Status words (plain scheme): **design only** (a sentence or a specification; nothing run), **demonstrated once** (one run, one project or crafted scenarios, no comparison), **under test** (a design is drafted in the experiment backlog; not frozen, not run), **observation** (author or cohort report). Channel words: **M1** by hand each time, **M2** a file the assistant reads (advisory), **M3** a lookup tool, **M4** an instruction to run something (self-reported), **M5** a hook (runs by itself on commit), **M6** a CI gate on the shared branch, **M7** an enforced gate plus a floor the executor cannot lower. Sections refer to the Compendium (`GenerativeSpecification_Compendium.md`). The mapping comes from one critic's 84-item table (a model, same family as the author's tooling); I resolved double fits to one primary function and note the secondary.

## 1. The taxonomy

| Function | One plain sentence | Executive verb |
|---|---|---|
| **SAY IT ONCE** | Write down what you want built, why, how and what is off limits, in one place, and make it easy for the assistant to find the right part. | Say |
| **CHECK** | A program, not the assistant's own word, tests the result and refuses a change that breaks the rules. | Stop (bad changes) |
| **REMEMBER** | Keep a permanent record of what was decided, why, and every change. | Remember |
| **SHOW** | Report where the project stands to people who do not read code. | (see it) |
| **DECIDE** | A named person says what counts as correct and what may ship, and chooses how strict to be for each part. | (sign it) |
| *Invariant: the executor derives* | The assistant builds the code, tests and documents from what was written. This is the act the five functions govern, not one of them. | |
| *Invariant: the ratchet* | Every mistake becomes a permanent rule or test, and the quality bar only moves up. | |

Executive verbs: "say it, stop bad changes, remember it" map to Say, Check, Remember. "See it, sign it" are Show and Decide. The old "stop" included the map; the map now sits in Say (it helps the assistant find things; it blocks nothing).

Plain definitions used below. **Bridge:** the habits (clear names, layered structure, small units) that carry intent into code the assistant can read and extend. **Sentinel:** a map file, with the files it points to, that tells the assistant where things are. **Phase collapse:** running and checking real behavior in the same pass instead of trusting a plan; the evidence comes from outside the model. **Gate:** a check that blocks a change. **Hook:** a check that runs by itself when you commit. **Ratchet:** a stored floor on quality that a change may not lower and the assistant may not edit. **Lock:** a file recording which version of the spec each artifact came from. **Co-change gate:** a rule that a behavior change must cite or include a spec change. **Ratification:** a person's recorded approval. **Dial:** how much detail and control a component needs, set by the stakes. **Intent diff:** a plain list of what a change means against the spec, for the person who signs. **Inverse inventory:** a list of code and tests that no spec item claims.

## 2. Mechanisms by function

Each mechanism has ONE primary function; secondary ones in the last column.

### 2.1 SAY IT ONCE

| Mechanism | What it does | Channel | Status | Compendium | Secondary |
|---|---|---|---|---|---|
| Spec cascade (functional spec, architecture, constitution, ADRs, use cases) | Derived documents, top to bottom, from one source | M2 | demonstrated once (AX; about 2.9 times the generation cost of an unstructured run, no return on single-shot measures) | 6.2 | Remember (the ADR step) |
| Constitution (CLAUDE.md, AGENTS.md) | Root file: identity, rules, prohibitions | M2 | observation | 6.1 | Check (a file a gate can read) |
| The bridge (disciplines) | Carries intent into readable code | M2 | demonstrated once (AX2, one benchmark, three vendors; structural measures only) | 4.1 | Check (layer rules) |
| Sentinel and its five categories | Map the assistant reads instead of searching | M2; M5 for its frontmatter check | demonstrated once (KX about 3x fewer tokens, one model; layering alone did not help, TX) | 4.4 | none |
| Bounded, Self-describing, Composable properties | Small units, readable by themselves, separable | M2 | demonstrated once (SX, n=2: duplicated code costs about 2.4x tokens) | 4.4 | Show (they are graded) |
| Names as production rules; domain expansion | Words that call up known patterns | M2 | observation | 8.5 | none |
| Use cases and diagrams | Examples that seed contract, test and docs | M2 | observation | 6.7 | Check (they seed tests) |
| Contract sufficiency (what vs how) | States the outcome, not the steps | M2 | design only | 4.5 | Decide (the dial) |
| Mechanism/sample separation | Keeps examples from being read as rules | M2 | design only | 8.16 | none |
| Meta-completeness query | Asks a fresh reader what is missing or guessed | M1 | observation | 8.10 | Show (gaps) |
| Intake and clarification | Questions before building | M1 | observation | 8.7 | Decide |
| Formulas 1, 2, 4 (greenfield, adopt, refine) | Paste-in prompts that build the cascade | M1 | design only (written to the canon, not tested in a registered run) | Formulas | none |
| `gs-check` item 1 to 2b | Checks map targets exist, ids present | M5 | demonstrated once (own tests) | Formulas | Check |
| One-command installer with three depths (`tools/gs-init/gs-init.mjs`, [practice](/practice/scale-adaptive-depth/)) | Writes the sentinel, spec and decision skeleton, chained hooks and the ratchet at L0, L1 or L2, backs up what it changes, and proves its claim with `gs-check --strict` on a copy | M4 (you run it); the hooks it installs are M5 | design, installer tested (19 tests, Windows and Linux container, no model); not in a registered run; not tried by a stranger | 6.1, 4.5.1 | Check |

### 2.2 CHECK

| Mechanism | What it does | Channel | Status | Compendium | Secondary |
|---|---|---|---|---|---|
| Phase collapse (executed behavior checks) | Real run, evidence outside the model | M4 to M6 | demonstrated once (EX; fifteen defects, counted by the builder) | 6.5, 4.4 | Invariant: derive |
| Tests, mutation testing | Behavior spec; checks the tests | M5 to M6 | observation; mutation demonstrated once | 6.6 | Say |
| Multimodal and layered verification | SQL, browser, logs, simulation cross-checked | M4 to M6 | observation | 6.6 | none |
| Hardening suite | Stress, security, chaos, environment | M6 | observation (one project) | 8.11 | none |
| Hooks and CI gates | Block a bad commit or merge | M5, M6 | demonstrated once (crafted violations) | 4.2 | none |
| Branch protection on the shared branch | Stops `--no-verify` and local bypass | M6 | design only | 8.18, 8.20 | Decide |
| Agent-commit marking and signature check (`gs-attribution-hook`, `gs-decide-ci`, [practice](/practice/agent-commit-marking/)) | Refuses an agent `Signed-off-by`, requires `Assisted-by` or `Co-Authored-By` on agent work, re-checks over a range in CI; an unmarked agent session is not detectable | M5, M6 | design, tools tested (own suite); not in a registered run | none | Decide |
| Admissibility rule | A change is admissible only if the layer above is amended | M5 | design only | 4.2 | Say |
| Public-surface diff rule | An interface change needs a spec change | M5 | design only | 4.2 | none |
| Co-change gate | Behavior change must cite or stage a spec change | M5 to M6 | demonstrated once (35 crafted scenarios, one sample) | 8.20 | none |
| Identifiers in both directions; orphan check | Every test and code unit points to a spec item and back | M5 | demonstrated once (same) | 8.20 | Remember |
| Inverse inventory | Lists code and tests no spec item claims | M3 | demonstrated once (same) | 8.20 | Show |
| Fix needs a reproducing test | A defect leaves a failing test first | M5 | demonstrated once (rule checked on one sample) | 8.3 | Remember |
| RED-phase collapse defense | Stops a test from being weakened to pass | M5 | design only | 4.4 | none |
| Application gate | Verifies spec and gate artifacts against benchmarks | M6 | observation | 8.12 | none |
| Frontmatter and sentinel validation | Closed keys, routes exist | M5 | demonstrated once | 4.4 | Say |
| Verifiable, Defended, Executable properties | What is graded for checks existing, blocking, passing live | n/a | demonstrated once (graded, kappa about 0.62 run to run) | 4.4 | Show |
| Debt delta and stored baseline | No new debt per change; floor cannot be edited | M7 | design only for the combined gate; duplication cost under test | 8.19 | Invariant: ratchet |
| Formulas 6, 7, 13; `gs-check`; `gs-lock` | Verify in layers; wire one gate red then green; check the twelve items; lock and co-change tool | M1 to M5 | design only (formulas); demonstrated once (tools, own tests) | Formulas | none |

### 2.3 REMEMBER

| Mechanism | What it does | Channel | Status | Compendium | Secondary |
|---|---|---|---|---|---|
| Decision records (ADR, EDR) | Why a choice was made, what was rejected | M2, M5 (commit cites record) | observation; emission precision diagnosed and patched once (9.3) | 8.4, 8.19 | Say |
| Atomic typed commits | One change per commit, typed and descriptive | M5 | observation | 8.3 | Check (parsed as a trigger) |
| Ratification log | Append-only record of who approved what | M1 to M7 | design only | 8.20 | Decide |
| The lock | Which spec version each artifact came from | M5 to M6 | demonstrated once (crafted scenarios) | 8.20 | Check (stale lock fails build) |
| Status file, session steady state | Where the work stands for the next session | M2 | observation | 8.7 | none (a derived index, not append-only) |
| Three-layer recording (project, individual, team) | Where each kind of note lives | M2 | design only | 4.2 | none |
| Auditable property | Graded: history is reconstructable | n/a | demonstrated once (graded) | 4.4 | Show |
| Post-mortem and hotfix loop | Defect leaves a record and a rule | M1 | design only (no incident template) | 6.5 | Check |
| Change governance by construction | The spec update is the change request; the ADR is the record | M2 | design only (no auditor test) | 8.15 | Show |
| Formula 5 (change) and 8 (lock) | Change with triage; install the lock | M1 | design only | Formulas | none |

### 2.4 SHOW

| Mechanism | What it does | Channel | Status | Compendium | Secondary |
|---|---|---|---|---|---|
| Rubric: seven properties, letters, levels (SAVED, Decagon) | A grade per property and a maturity level | M3 | demonstrated once (kappa about 0.62 run to run, one rater family) | 4.4, 8.22 | none |
| Free scorecard (formula 9, audit) | Coarse letter per property, read by a model | M1 | observation | Formulas | none |
| Criteria coverage | Share of criteria with a passing check | M3 | design only | 8.19 | Check |
| Spec completeness (coverage, open, gaps) | Three numbers kept apart | M3 | design only | 8.19 | Say |
| Governed-as-of snapshot | Level, grades, score, commit, spec version, date in one line | M3 | design only (no tool produces the exact line) | 8.19 | Remember |
| Intent diff | What a change means against the spec, for the signer | M3 | design only | 8.20 | Decide |
| Portfolio table and reports (Part C1, C2) | Snapshots across projects | M3 | design only | 8.21 | Decide |
| Cost and outcome per feature (Part C4) | Cost, KPI movement, how each was measured | M3 | design only; nothing built | 8.21 | none |

### 2.5 DECIDE

| Mechanism | What it does | Channel | Status | Compendium | Secondary |
|---|---|---|---|---|---|
| Ratification (judgment terminus) | A person approves criteria, merge, exceptions; the executor cannot | M1; a hook can require a marker, cannot verify the person | design only | 4.2, 8.19 | Remember (the log) |
| Signed ratification (`gs-decide` entries signed with an SSH key, roles and an `agent` role in `docs/decision-roles.json`; [practice](/practice/agent-commit-marking/)) | A protected change needs an entry whose signature verifies and whose signer is not an agent; it proves custody of a key, not human intent | M5, M6 | design, tools tested (own suite); not in a registered run | none | Check, Remember |
| Branch protection requiring a human reviewer | Makes skipping approval impossible | M6 | design only | 4.2 | Check |
| Specificity dial and three dials (completeness, specificity, register) | Matches control to stakes | M1 | under test (H-S drafted; expert-prompt tie on single shot) | 4.5.1, 4.5.2 | Say |
| Scale-adaptive depth: tiny, normal, risky change, and L0/L1/L2 per project ([practice](/practice/scale-adaptive-depth/)) | Matches the process to the size and risk of the change; only the risky class has a mechanical trigger (protected paths), at L2 | M1/M2 to classify; M5/M6 for the risky class at L2 | design (thresholds are defaults, unmeasured); not in a registered run | 4.5.1 | Check |
| Consequence classification and human confirmation gate | Irreversible acts need a person | M5 to M6 | design only | 4.4 | Check |
| Revival model (practice portfolio) | Which practices pay at which stakes | n/a | design only | 4.6 | none |
| Triage of a failure (cases a to e) | Names which kind of failure before changing anything; a person ratifies b, c, d | M1; M5 marker | demonstrated once (one sample, crafted commits; one real-agent run) | 8.19 | Invariant: ratchet |
| Review surface (`gs-review-surface`) | Lists the places a human must still read in a diff | M3 | design only (specification only; no code) | experiment backlog | Check, Show |

### 2.6 Invariants

| Mechanism | What it does | Channel | Status | Compendium |
|---|---|---|---|---|
| Executor derives; regeneration ("fix the spec, regenerate") | Builds artifacts from the spec | n/a | demonstrated once (AX series and cases) | 4.1, 8.2.1 |
| Living documentation (derived docs) | Docs derived from the spec, not written by hand | M2 | observation | 6.7 |
| CLI as execution surface; Conclave orchestration; model tiering | How the executor runs; multi-agent; right-sizing | n/a | observation; tiering under test (MX) | 8.6, 8.14, 7.8.H |
| Ratchet and gate corpus | Every failure becomes a permanent test or rule; floor only rises | M7 | design only as a whole | 4.4, 8.19 |

## 3. Gap analysis

**Functions thin or aspirational today.**
- **SHOW** is thin. One graded instrument exists (rubric, kappa about 0.62, run-to-run); the report to a non-reader is a coarse scorecard read by a model. No tool produces the snapshot line; coverage, completeness, intent diff and every business report are design only. The business half (portfolio, cost and outcome) has nothing built.
- **DECIDE** is thin. Ratification is a convention: a hook can require a marker that someone approved, it cannot check the person. No ratification log exists; the dial is untested and the one evidence we have (single-shot tie with an expert prompt) points against it at short horizons. The review surface is a specification.
- **REMEMBER** is solid on the record (ADR, commits), thin on "everything": no incident template; the single query "show the chain for change X" is not verified; Status and the lock are indexes, not records.
- **CHECK** is the best supported, mostly on crafted scenarios and one builder-counted production case. The combined debt gate and branch protection are design only.
- **SAY** is well supported on structural measures; it has no intent record upstream of the spec, and the cost is stated (about 2.9 times per generation).

**Mechanisms without a clear function (kept out of the tables or forced):** planning (prompt-bound roadmap, 6.3; incremental cascade, 6.4); the manifest (4.2, gate configuration); the Andon team layer (8.21 C3, roles undefined, coordinates people); migration; disposal and keeping the lights on (uncovered in 8.19); the failure-mode catalog, calibration anchors, lifecycle table and adoption ladder (instruments about the method, not about a project); the twelve working principles (8.17, restatement); guides versus sensors (8.18, an axis, not a function); phase collapse (a mechanism of Check, executed evidence, not a function; listed under Check).

**Five most valuable gaps, ranked** (value = how much a function gains per unit of work; proposals only, no claim of effect):

1. **A ratification record with a required-marker hook (DECIDE, REMEMBER).** Minimal mechanism: an append-only file `ratifications.log` (who, what, spec version, date, reason) plus a hook that rejects a change to criteria, gate configuration or the baseline unless a new line exists, plus a required human reviewer on the shared branch. It cannot verify the person's judgment; it makes skipping the step visible and refusable. Closes the thinnest, most central function.
2. **A snapshot generator (SHOW).** Minimal: extend `gs-check` to print the single line `level · score ± confidence @ rubric vX @ commit @ spec vN @ date` from its own output, plus commits since. No new rubric. Makes the governance claim producible.
3. **`gs-review-surface` (DECIDE, CHECK).** Build to the existing specification. Narrows what a signer reads; supplies the intent diff's first rules.
4. **An incident record and formula (REMEMBER, invariant ratchet).** One page: what happened, case a to e, the rule or test that now prevents it, who ratified. Closes the ratchet loop and the named gap in the lifecycle table.
5. **An intent record at the start (SAY).** One page: problem, measurable outcome, out of scope, owner, signed. The missing upstream half of criteria coverage.

Note: [the whole lifecycle page](lifecycle-whole.md) ranked cells by phase leverage (intent record, review surface, incident record). This ranking is by how thin each function is. The union is the five above; JC chooses the order. Candidates beyond five: a verified "chain for change X" query; evidence for the dial.

## 4. One-page version

| Function | Plain-language promise to an executive | What we can show today |
|---|---|---|
| **Say it once** | What you want is written down once, in plain words, and the assistant works from that, not from guesses. | The written cascade and map on the author's projects; one cross-vendor benchmark where a disciplined spec removed structural violations; cost about 2.9 times per generation. No external user study. |
| **Check** | A program, not the assistant's word, tests each change and refuses one that breaks the rules. | Checks that block planted violations in crafted scenarios; one production project with fifteen defects counted by its builder. No measure yet of defects prevented. |
| **Remember** | You can see what was decided, why, and what changed between any two dates. | Decision records and typed commit history on the author's projects; the lock on crafted scenarios. The one-query chain is not verified. |
| **Show** | You can see where a project stands without reading code. | A coarse scorecard (a letter per property) read by a model; run-to-run agreement about 0.62. The exact dated snapshot line, coverage report and business reports do not exist yet. |
| **Decide** | A named person approves what counts as correct and what ships; the assistant cannot approve its own work. | A convention and a design for the record and the hook. Nothing enforces it today, and the strictness dial is untested. |
| *Derives (invariant)* | The assistant builds from what is written. | The builds in the author's experiments and cases. |
| *Ratchet (invariant)* | Each mistake becomes a permanent rule, so quality only goes up. | A design, with one cost result on duplicated code (n=2). |

## What this map does not claim

That the five functions are complete or validated outside one model family; that any mechanism here produces a business outcome; that the status words are measurements. They are the author's reading of the Compendium's own evidence tags, and a critic's mapping of 84 items (56% clean to one function, 83% without a forced fit).
