---
layout: default
title: Profiles by project type (proposal)
parent: The Method
nav_order: 13
nav_exclude: true
permalink: /method/profiles/
description: "The five functions hold for any project; the mechanisms and the twelve-element checklist are the code profile. A profile says, for one kind of project, what each function looks like, which elements apply, which are replaced and which do not apply. Design only."
---

# Profiles by project type

**Status: design, not yet in a registered run. Do not cite externally.** Nothing here has been built or run on a second kind of project; the one by-hand application (section 4) is a reading by the author's assistant, not a measurement. Companion to [the functions map](functions-map.md) and [the whole lifecycle](lifecycle-whole.md).

## 1. The principle

The five functions (Say, Check, Remember, Show, Decide) and the two invariants (the executor derives, the ratchet) are about any project in which an assistant produces artifacts and a person answers for them. They do not mention code. What is specific to software is the **mechanisms**: a test suite, a compiler, a lock on spec ids, a co-change gate. The twelve-element checklist ([substrate checklist](/formulas/substrate-checklist/)) is a list of those mechanisms, so it is the **code profile**, not the definition of the method.

A **profile** is a short, per-project-type table. For each function it gives the mechanism in that domain. For each of the twelve elements it gives one of three verdicts:

- **as is**: the element means the same thing and the same check applies;
- **replaced**: the job is the same, the artifact and the check differ (a named equivalent);
- **does not apply**: there is no such job in this domain (say why).

Running the code checklist on a non-code project is a **misapplication**: it reports the absence of mechanisms the project never needed, and hides the absence of the ones it does. A profile prevents that, and it keeps one rule from the code side: every mechanism needs a check that runs, a proof that the check can fail, and a person who owns the verdict.

## 2. The profiles

Verdict key for the elements: **A** as is, **R** replaced, **N** does not apply. E01 sentinel, E02 spec with ids, E02b criteria with how verified, E03 decision records, E04 derived cascade, E05 tests and a blocking gate, E06 ratchet, E07 open-questions gate, E08 criteria coverage, E09 atomic commits, E10 lock, E11 co-change gate, E12 clean-clone instruction.

### 2.1 CODE (the default)

All twelve elements are **A**. Functions as in the functions map: spec cascade and sentinel; tests, hooks, CI, phase collapse; ADRs and typed commits; rubric and snapshot; ratification. Limits: those of the existing tools (tested, not validated; controls written by the checker's author).

### 2.2 DOCUMENTS AND RESEARCH

For a repository whose product is text that makes claims: papers, essays, a compendium and its derivatives, a site, evidence pages, experiment write-ups. The artifact is a **claim in a document**, and the failure is a claim stronger than its evidence, a broken reference, or a derivative that drifted from its master.

| Function | The mechanism for documents | Check that runs (exists or feasible) | Human decision |
|---|---|---|---|
| **Say** | A sentinel that routes to the canonical documents; a **claims ledger** (one row per claim: id, text, source or experiment, evidence status from a closed list); a derivation map saying which document is master and which derive from it | Routes exist; every ledger row has a status from the list and a source that resolves | The author fixes the status vocabulary and which document is canonical |
| **Check** | Link and reference checks; build of the site and PDFs from a clean clone; spelling and style linters; a closed-vocabulary check on evidence-status labels; a **no-claim-exceeds-its-status** check (a document may not use "shows", "proves" or "validated" next to an item labeled design-only or observation) | Each is a script that exits non-zero; each needs a planted-defect proof that it fails | Whether a flagged sentence is a real overclaim |
| **Remember** | A decisions log (what was decided about the paper, what was dropped and why); typed commits; a derived-from stamp (derivative records the master version it was cut from) | Log entries have the required fields and are append-only (no deleted lines); each derivative's stamp matches the master's current version | Ratifies each entry |
| **Show** | A status page: claims by evidence status, open questions, derivatives stale against their master, broken-reference count | Counts computed from the ledger and the stamps | None, except choosing what to publish |
| **Decide** | **Human ratification of every change to a canonical document or to a claim's status**; a status can only be raised by a person, with the evidence cited | A change to a canonical path needs a ratification entry (signed where the repository uses `gs-decide`) | The author: this is the core of the profile |

Elements: E01 **A**. E02 **R** (claims with ids in the ledger). E02b **R** (each claim names its source or experiment and its status instead of "verified by"). E03 **A**. E04 **R** (derivatives from a master, with a stamp, instead of an architecture cascade). E05 **R** (the document gate above). E06 **A** in kind (floors: broken links 0, unlabeled claims 0, never raised without a decision). E07 **A**. E08 **R** (claims coverage: share of ledger rows with a resolving source). E09 **A**. E10 **R** (the derived-from stamp is the lock). E11 **R** (a change to a master must touch or note its derivatives). E12 **R** (the site and PDFs build from a clean clone).

Honest limits. No script can tell that a claim is true, that a source supports it, or that a hedge is the right hedge. A status check catches wording against a label, not a wrong label. The labels themselves are the author's judgment; a model reader can propose and cannot ratify. A style linter enforces taste that someone chose.

### 2.3 CONTENT AND MEDIA

Video, courses, books, social posts, decks. The artifact is a **rendered asset** (a file) made from a brief; the failure is drift from the brief or the brand, an unsourced claim in a script, or an unapproved publication.

| Function | The mechanism | Check that runs (exists or feasible) | Human decision |
|---|---|---|---|
| **Say** | A **content brief** as the spec (audience, message, claims allowed, style, what never to say, with ids); an **asset manifest** (every asset: source, license, tool, version, hash) | Brief ids are unique; every asset in a render is in the manifest; licenses present | Approves the brief |
| **Check** | **Reproducible render** (same inputs, same output hash, or a stated tolerance); **voice and style gates** (the course already has `check-voice.mjs` and rule lists); technical sensors (resolution, duration, loudness, palette); a **claims check** (each claim in a script traces to a source: "cite or cut") | Scripts exit non-zero; renders compared to a stored reference | Whether it sounds like the person and says something worth saying |
| **Remember** | Version of the brief per render; decisions log (why this voice, why this cut); typed commits | Each published asset points at the brief version and manifest it came from | Ratifies |
| **Show** | A piece-status table (draft, rendered, checked, approved, published) | Computed from the manifest and approvals | None |
| **Decide** | **Publication approval**: nothing goes out unless a named person approved that exact render | An approval entry names the asset hash; publish step refuses without it | The author: taste and the publish decision |

Elements: E01 **A**. E02 **R** (brief with ids). E02b **R** (each brief item names the sensor or review that verifies it). E03 **A**. E04 **R** (scripts, captions, thumbnails derived from the brief). E05 **R** (render plus sensors, blocking publication). E06 **R** (an approved asset stays approved; a sensor threshold only tightens). E07 **A**. E08 **R** (share of brief items with a sensor or a review record). E09 **A**. E10 **R** (render records the brief version). E11 **R** (a brief change forces re-render or a note). E12 **R** (render from a clean clone with the tools named).

Honest limits. The sensors give a low ceiling for generative quality (the author's own taxonomy puts art and content at the low end); taste, tone and "is it worth watching" are a person's. Reproducible renders are often impossible bit for bit (models, encoders), so the tolerance has to be declared. A voice gate catches a banned phrase, not a flat paragraph.

### 2.4 GAMES

Games are mostly code, so most of the code profile applies. What is added: a **design document as the spec** (rules, numbers, win conditions, with ids); **golden-run tests** (a fixed seed and scripted input gives a recorded outcome); **balance tests** (headless simulation with declared thresholds, such as win rate per faction in a band); **determinism** (same seed, same result); **build and smoke runs**; **asset budgets** (size, frame time, memory); **playtest records** as Remember and Show evidence (who played, what they hesitated at, each friction turned into a criterion with an observable). Decide: a person says what is fun; no sensor does. Elements: E01 to E09, E12 **A**; E04 **R** (design document and asset pipeline in place of an API cascade); E10 and E11 **A** once the design document has ids. Honest limits: in the author's own map, headless balance simulation is "in development" and frame-time, determinism and usability are "idea, not built"; fun is not measurable; art checks are inferential.

### 2.5 DATA AND ANALYTICS

Also mostly code. What is added: **schemas and contracts as the spec**; **data tests** per batch (types, ranges, nulls, uniqueness); **lineage** (each table and figure traces to sources); **freshness** checks; **metric definitions** written once with ids (a metric is a spec item; two definitions of one metric is the failure); **reproducible notebooks** (run top to bottom from a clean clone to the same numbers); for finance and quant, a **pre-declared acceptance rule** and a harness that cannot see the future. Decide: a person ratifies each metric definition and what a number means to the business. Elements: as in code, with E02 **R** (schemas and metric definitions), E05 **R** (data tests plus notebook run), E04 **R** (derived tables and reports with lineage). Honest limits: data tests show form, not that the data means what the business believes; a green pipeline over a wrong metric definition is still wrong; no evidence yet for this profile beyond the finance cases, which found no edge.

## 3. How the tools would use profiles (specification only)

**Selecting a profile.** A project declares it in one small file at the root, `.gs-profile`, with fields `profile` (code, documents, content, games, data), `scope` (paths it governs), and `frozen` (paths that are records, not governed work). If the file is absent, the tool **proposes** a profile from what it finds and says it was guessed. Mixed repositories get **one profile per path**: for example, documents at the root, code for `tools/` and `scripts/`, and `experiments/` marked frozen (a record of past runs and generated fixtures, not code the project maintains).

**`gs-check --profile <name|auto>`.** Today `gs-check` runs the twelve probes. With a profile it loads a table `element -> verdict -> probe`, runs only the probes of that profile, and reports **replaced** elements under their equivalent's name, and **does not apply** elements as "not applicable here", not as absent. The result keeps the same three states (pass, partial, absent) but the denominator changes, and the report prints the profile and how it was chosen on its first line. `--profile code` is today's behavior. A guessed profile is never used for `--strict` without being confirmed.

**`gs-demo --profile`.** The quick look first counts source files outside `frozen` and vendor paths. If there are none or few, the first lines say, in this order: "This is a documents project. The code checklist does not apply and its result would be misleading. Here is the documents profile: what it asks, what your repository already has, and the three most useful next steps." It then prints the profile's table with found and missing items. It does not print a number.

**The minimal deterministic checks for the documents profile, cheapest first** (each a single script with no model and no network, each with a planted-defect test, none written yet):

1. **Reference check.** Relative links and anchors resolve, understanding the site's permalink front matter (a naive file check on the author's repository reports 97 of 215 relative links as broken, most of them permalink forms such as `../evidence/`, which is the mistake this check must not make). Floor: broken count may not rise.
2. **Status-label vocabulary.** Every evidence label in canonical documents is in a closed list; none is unknown.
3. **Claims ledger well-formed.** Each row has id, status from the list, and a source path that exists.
4. **No claim exceeds its status.** A document carrying an item labeled design-only or observation may not pair it with a listed strong verb; the list is the author's and short.
5. **Derived-from stamp.** Each derivative names its master and the master version; mismatch is a failure.
6. **Build from a clean clone** of the site and PDFs exits zero.
7. **Ratification marker** for changes to canonical paths (reuse `gs-decide`).

Items 1 to 3 are an afternoon each. Items 4 and 5 need the author to fix the list and the stamp format first. Items 6 and 7 reuse what exists.

## 4. Applying the documents profile by hand to `generative-specification`

Read-only, from a fresh clone at `e2ea067` (365 commits). What the repository is: a Jekyll site (`_config.yml`), 115 Markdown files outside `experiments/`, papers and essays, a registry of 51 quality-gate YAML files with a schema and a CI validator (`.github/scripts/validate-gates.js`), `formulas/`, `domains/`, `evidence/`, and `experiments/` holding the runs. Code beside the documents: five scripts under `scripts/` (registry, PDF, gates table), one CI validator, and about 2,470 tracked source files under `experiments/` that are **generated outputs and fixtures of the experiments** (including `CLAUDE.md` files inside experiment projects), not code the repository maintains.

**The earlier reading of 0 pass, 5 partial, 7 absent was a misapplication.** `gs-check --strict` looked for a root sentinel, spec ids and a test floor in a repository whose product is documents, and its probes met experiment fixtures as if they were the project. The result says that a code profile does not fit; it does not say the repository is ungoverned. It is also not a clean pass: some elements are really missing, for the documents profile (below). One finding of the earlier run stands on any profile: 104 of 365 commit subjects were not conventional, and two commits were very large.

| Function | What exists | What is missing | A first honest improvement |
|---|---|---|---|
| **Say** | `START-HERE.md`, `README.md`, an `index.md`, a paper tree, a compendium declared as master, an experiment ledger, a gate registry with schema | No root sentinel for an assistant; no claims ledger (claims live in prose); no machine-readable derivation map | Add a root sentinel that routes to the master and names the frozen paths; start a ledger for the ten to twenty claims the site repeats most, each with status and source |
| **Check** | CI validates gate files on pull request; Jekyll builds on publication; the evidence-status vocabulary is applied by hand across pages (the repository already drops tier letters and softens labels by hand) | No link check; no spelling or style lint; no check that the label vocabulary is closed; no check that a claim does not exceed its label; no CI on the documents | Reference check with permalink awareness, then the closed-vocabulary check, both with a floor, run on pull request |
| **Remember** | 365 commits; a ledger of experiments; preregistration files; a license split by content type | No decisions log for the documents (why a claim was softened, why a paper was split); 104 of 365 subjects unconventional; derivatives (PDFs, working text) not stamped | A decisions log beginning with the recent softening decisions already in the history; stamp each PDF with the master version |
| **Show** | The evidence page states each finding with its bound; the paper tree says what each paper will and will not say | No page counting claims by status or stale derivatives; no figure for broken references | A generated status page from the ledger, once it exists |
| **Decide** | The author edits every canonical document and approves every status by hand; this is the strongest function in practice | No record: ratification is the author's habit, not an entry; no marker a hook could require | A ratification entry for edits to the compendium and to any status raise; adopt `gs-decide` for the canonical paths only |

Elements for the documents profile, as read by hand: E01 partial, E02 absent (R: ledger absent), E03 absent, E04 partial (derivatives exist, unstamped), E05 absent for documents (partial for the gate registry), E06 absent, E07 partial (open questions are in prose), E08 absent, E09 partial, E10 absent, E11 absent, E12 partial (site builds on the host; not checked from a clean clone). That is also not a good score; the difference from the earlier one is that these are the right questions, and the first three improvements are small.

## 5. The derived courses

The course line starts from one free core and four domain guides in `soma/docs/courses`, plus a design note on what to verify per project type (`pragmaworks-marketing/media/curso-gs-v2/COLUMNAS-verificacion-por-tipo.md`, 2026-09-30). The guides share one ten-section arc (idea, bridge, seven properties, ordered method, worked case, 90-minute class, pathologies). By a text search, none of the four guides uses the words ratify, manifest or ratchet; the content and marketing guides cover "cite or cut", and the finance guide covers pre-registration.

| Course | Profile | Already has | Gap |
|---|---|---|---|
| Core (free) | all | The five-function argument at the level of the premise | Does not say that mechanisms differ by project type |
| The Forge (software) | CODE | The whole code profile | Predates the five functions as the frame |
| The Atelier (content) | CONTENT AND MEDIA | Brief as spec, quality gates, critique pipeline; `check-voice` and the voice measurement exist in the marketing repository | No asset manifest, no publication approval, no reproducible render stated as a check; the voice measurements are not yet gates with thresholds |
| Marketing and Business | DOCUMENTS (claims) plus DATA | "Cite or cut", no unsourced numbers, a go-to-market worked case | No claims ledger as a file, no status vocabulary, no human ratification of a deliverable |
| The Crucible (finance) | DATA AND ANALYTICS | Pre-registered acceptance, a harness that cannot see the future, negative cases | Metric definitions with ids; lineage; the approval step |
| (none) research and papers | DOCUMENTS AND RESEARCH | Lived in this project, by hand | **No course.** This profile is documented only here |
| (none) games | CODE plus a games pack | The design note lists the checks | No course; most items are "idea, not built" |

## 6. What not to do

- **Do not multiply profiles.** A profile earns its place when the **artifact** differs (a claim in text, a rendered file, code), because then the checks differ. Three profiles meet that test: code, documents, content and media. **Games and data are code with a domain pack of extra sensors**, not new profiles, until a real project of that kind shows what the pack needs; they are described above so the design is visible, and nothing should be built for them first.
- **No profile without a project that needs it.** The documents profile is justified by this one repository and by the author's papers; the content profile by the course production; games and data by no running project today.
- **Do not let a profile lower the bar.** "Replaced" means an equivalent check that can fail and a person who owns the verdict, not an exemption.
- **The harness is bounded too.** Every added artifact (a ledger, a manifest, a stamp) must pay for itself, or it degrades the work it governs. The first documents profile asks for a sentinel, a ledger of a few claims, and two scripts. It does not ask for a status page, a derivation graph or signed entries until those prove needed.
- **Do not present a profile score as a grade.** The tools print what was found and what is missing, with their limits, and no verdict of "compliant".
- **No external citation** until a profile has run on a project other than its author's, with independent controls.
