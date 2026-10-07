# Functions abstraction: Copilot critic runbook (vendor-diverse blind critics)

> **You are the Copilot agent on JC's second PC.** Your job is to collect blind critiques of the
> "functions of GS" abstraction from **non-Anthropic (and other) models**, one fresh Copilot chat
> per role per model. You only **collect** critiques. You do not edit any file other than your new
> output files, you do not merge, you do not consolidate. When done, commit and push; JC
> consolidates on the main PC.

**Why this exists, stated plainly.** Every critic in the first validation round (three unprimed
derivers, a taxonomist, a frameworks comparator, a skeptic, a literature researcher, and two
second-round critics) was the **same model family and vendor (Claude)**. A same-family panel
shares blind spots with the author's tooling. Vendor-diverse criticism is therefore **still owed**.
Do not describe the first round as vendor-diverse anywhere.

---

## 0. Paths (repo-root-relative, because this is a different PC)
1. `git fetch`, then check out branch `lifecycle-2026-10-08` of the `generative-specification`
   repo (on the main PC its worktree is `gs\gs-lifecycle`). Find the repo root (the folder that
   contains `docs\white-paper\`).
2. Set and **print** `REPO=<absolute path on THIS PC>`.
3. Confirm and print absolute:
   - `$REPO\docs\white-paper\GenerativeSpecification_Compendium.md` (the ONLY input for every role)
   - `$REPO\docs\white-paper\GenerativeSpecification_FieldGuide.md` (optional input, roles 1 to 3)
   - `$REPO\docs\method\critiques-functions\` (create if missing)

Do not proceed until all print correctly. The Compendium is large (about 480 KB); if the model
cannot take it whole, attach it in the largest parts the picker allows and say so in `notes`.

## 1. Models
Use **at least two non-Anthropic vendors** (priority order): (1) OpenAI / GPT, newest GPT-class;
(2) Google / Gemini, newest; (3) any other vendor in the picker; (4) optional Claude via Copilot
(shows the harness effect only; does not count as diversity). Record the **exact model id**.
Minimum viable: GPT plus Gemini, all roles each.

## 2. Procedure (per vendor, per role)
1. **New chat, cleared context.** Nothing carried from earlier roles or vendors.
2. Attach ONLY the input files named above. Never attach any other repo file, any earlier critique,
   or the validation report.
3. Paste the role prompt **exactly as written**. Add no hints.
4. Web search: only roles 5 and 6 may use it. For roles 1 to 4 turn it off.
5. Save the reply **verbatim** to
   `docs\method\critiques-functions\<role>-<vendor>-<model>.md`
   (role is `deriver`, `taxonomist`, `skeptic`, `deriver-r2`, `frameworks`, `lifecycle-lit`).

### File header (every output file)
```
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
```

## 3. Role prompts (exact text)

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

**Role 5: frameworks (web ALLOWED; verify from primary pages, give URL and date read).**
> You are a fresh reviewer; state today's date. Verify every claim from PRIMARY pages with URLs;
> mark anything unverified as UNVERIFIED. Compare the functions in role 2 (and role 4) with ISO/IEC/IEEE
> 12207 and 15288, NIST SSDF, OWASP SAMM, NIST AI RMF (Govern, Map, Measure, Manage), DORA
> capabilities, CALMS, ITIL 4, COBIT 2019, Deming PDCA and the Toyota Andon, and Ashby's requisite
> variety / generic control-loop functions. For each: its top-level decomposition and where the
> functions are equivalent, finer, coarser or missing. End with a table of candidate functions
> that recur across frameworks and are absent from the three, with counts, and a recommendation
> (keep, revise, add). Under 1800 words.

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

## 4. Integrity rules
- **Blind and stateless:** one fresh chat per (role, model, run). The model sees only the attached
  input and the prompt. No repo browsing, no earlier critique, no history.
- **Verbatim:** save replies unedited; if truncated, ask once "continue" and note it.
- **No steering:** do not tell the model what JC thinks or what other critics said. Do not reroll
  for a nicer answer; if you must rerun, keep BOTH outputs (suffix `-r2`) and note why.
- **No edits** to any file other than your new files under `docs\method\critiques-functions\`.
- **Vendor diversity is the point:** at least two non-Anthropic vendors must complete roles 1 to 4.
  A partial vendor is reported as partial.
- Do not create a consolidated summary; consolidation is JC's and the main agent's.

## 5. Finish
```
git add docs/method/critiques-functions
git commit -m "docs(method): vendor-diverse blind critiques of the functions abstraction, <vendor> <model>"
git push
```
Commit each vendor when complete, then tell JC it is pushed.

## 6. Must NOT do
Do not edit the Compendium or any method page; do not give a critic more than the input files and its
prompt; do not merge, rank or fix the critiques; do not merge the branch, publish or mint a DOI.
