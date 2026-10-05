# White paper 5.0 — Copilot critic runbook (vendor-diverse blind critics)

> **You are the Copilot agent on JC's second PC.** Your job: obtain blind critiques of the
> white paper 5.0 draft from **non-Anthropic (and other) models**, one fresh Copilot chat per
> role per model. You only **collect** critiques. You do not edit the draft, you do not
> merge, you do not consolidate. When done, commit and push; JC consolidates on the main PC.

**Why this exists, stated plainly.** The first critic panel (six roles) was run on the main PC,
and every critic there was the **same model family** (Claude). Vendor-diverse criticism is
therefore **still owed**: a same-family panel shares blind spots with the author's tooling.
This runbook closes that gap. Do not describe the first panel as vendor-diverse anywhere.

---

## 0. Paths (repo-root-relative, because this is a different PC)
1. `git fetch` then check out branch `white-paper-5.0-draft` of the `generative-specification`
   repo (on the main PC its worktree is `gs\gs-wp5`). Find the repo root (the folder that
   contains `docs\white-paper\`).
2. Set and **print** `REPO=<absolute path on THIS PC>`.
3. Confirm and print absolute:
   - `$REPO\docs\white-paper\GenerativeSpecification_WhitePaper_v5.0-DRAFT.md` (the ONLY input)
   - `$REPO\docs\white-paper\critiques-wp5\` (create if missing)

Do not proceed until both print correctly.

## 1. Models
In the Copilot picker, use **at least two non-Anthropic vendors** (priority order):
1. **OpenAI / GPT**, newest GPT-class model.
2. **Google / Gemini**, newest Gemini-class model.
3. Any other vendor in the picker (e.g. xAI, Mistral), if present.
4. Optional: Anthropic/Claude via Copilot (to show the harness effect only; it does not
   count as diversity).

Record the **exact model id string** the picker shows. Complete a vendor fully (all six
roles) before the next. Minimum viable: GPT + Gemini, six roles each = 12 chats.

## 2. Procedure (per vendor, per role)
1. **New chat, cleared context.** Nothing carried from any earlier role or vendor.
2. Attach ONLY the draft file (path above). Do not attach or open any other repo file,
   do not point the model at the repo, do not paste any earlier critique.
3. Paste the role prompt below **exactly as written** (the DRAFT line is already adapted:
   the model reads the attached file). Do not add guidance or hints.
4. Web search: ONLY role 3 (field-context placer) may use it. For roles 1, 2, 4, 5, 6 turn
   browsing/search off or tell the model not to use it (already in the prompt).
5. Save the model's reply **verbatim** (no trimming, no fixing) to
   `docs\white-paper\critiques-wp5\<role>-<vendor>-<model>.md`, where `<role>` is one of
   `harsh`, `editor`, `field`, `practitioner`, `academic`, `clarity`; `<vendor>` is
   `openai`, `google`, ...; `<model>` is the picker id, lowercased, spaces to hyphens
   (e.g. `harsh-openai-gpt-5.md`).

### File schema (every output file starts with this header, then the verbatim reply)
```
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
```

## 3. The six role prompts (exact text)

Common preamble for all six (prepend verbatim): *"You are a fresh, stateless reviewer. The
only input is the attached draft file; do not use any other file or prior context. The draft
is a METHOD PROPOSAL (not an academic results paper): experiments live elsewhere; advantages
are tagged with a status; Part C is the organization layer; the instrument ends the paper.
Judge it as that."* Then the role text:

**Role 1 — harsh** (no web)
> ROLE: HARSH CRITIC. TASK: find everything wrong: overclaims, unfalsifiable statements,
> logical gaps, undefined terms, internal contradictions, anything that reads as marketing.
> End with what a hostile expert would say, in one paragraph. OUTPUT (markdown): findings
> ranked by severity (Critical / Major / Minor). For each: ID, severity, quoted passage
> (exact, short), why it is wrong, concrete proposed fix (rewrite text where possible). Then
> the one-paragraph hostile-expert verdict. Do not praise. Do not use web search.

**Role 2 — editor** (no web)
> ROLE: CONSTRUCTIVE EDITOR. TASK: how to make it better: structure, order of sections, what
> to cut for length, what to expand, clarity of the central idea on the first page, examples
> that would help, a stronger opening, and what a reader can DO after reading it. OUTPUT
> (markdown): recommendations ranked High / Medium / Low. For each: ID, quoted passage or
> section reference, the problem, concrete proposed fix (draft replacement text for the
> opening and any key rewrites). Include a proposed section order and a cut list with
> approximate word savings. Do not use web search.

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

## 4. Integrity rules (same spirit as the experiment critic runbook)
- **Blind and stateless:** one fresh chat per (role, model). The model sees only the draft
  and the prompt. No repo, no earlier critique, no conversation history.
- **Verbatim:** save replies unedited. Do not summarize, correct, soften, or merge. If a
  reply is truncated, ask once "continue" and note it in `notes`; do not rewrite it.
- **No steering:** do not tell the model what JC thinks, what other critics said, or what
  the paper is "trying to say" beyond the preamble. Do not reroll for a nicer answer; if you
  must rerun (refusal, error), keep BOTH outputs, suffix the second `-r2`, and note why.
- **No edits to the draft** or any file other than your new files under `critiques-wp5\`.
- **Record the truth:** exact model id, whether web search was used, anything odd.
- **Vendor diversity is the point:** at least two non-Anthropic vendors must complete all
  six roles. A partial vendor is reported as partial, never padded.
- Do not create any consolidated summary; consolidation (accept/reject/defer) is JC's and the
  main agent's, on the main PC, after pull.

## 5. Finish: commit and push (after each completed vendor)
```
git add docs/white-paper/critiques-wp5
git commit -m "docs(wp5): vendor-diverse blind critiques — <vendor> <model>, six roles"
git push
```
Commit each vendor when complete. Then tell JC it is pushed.

## What you must NOT do
- Do not edit the draft or any other existing file.
- Do not give a critic more than the draft and its role prompt.
- Do not merge, rank or "fix" the critiques.
- Do not merge the branch, publish, mint a DOI, or generate a PDF.
