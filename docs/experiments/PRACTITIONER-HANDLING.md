# Practitioner sessions with models (A5-m): handling, the statelessness decision, and the main-PC checks

2026-10-02. Draft. For JC and the assistant, never shown to the model that plays the practitioner. Role definition: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\ROLES.md` section 2. Design: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\prereg\SDX-1-ARMS.md` sections 3 and 4.

## 1. Why this file exists and why the runbook is separate

The model that plays the practitioner reads `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\COPILOT-PRACTITIONER-RUNBOOK.md`. That file had to be neutral: it cannot mention GS, the load-bearing list, the arms, the hidden tests, the second step of the task, or the sentinel, lock, record and gate vocabulary, because the model reading it is the subject of the leak check. Three consequences follow, and this file handles them:

1. **The second task (the removal) is not in the runbook.** If the model read it first, step 1 would no longer be its natural prompt. JC pastes it as a second message (section 3).
2. **The two memory variants are not both in the runbook.** A model that saw both would know the other exists. The runbook reads a small file, `SESSION-FACTS.md`, whose content JC picks per variant.
3. **The model does not commit or push.** It runs in a clean working folder outside the repository, because a model with the repository open could read the design files. JC copies the outputs into the repository and commits (section 3, step 7). The AX2 runbook pattern (the agent commits and pushes) is kept for the critics, who are meant to know the design.

Inputs prepared in the repository:
- `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\experiments\sdx1\practitioner\PASTURA-PRODUCT-DESCRIPTION.md`: the product description, derived from `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\experiments\cr\benchmark\DOMAIN_SPEC.md` by removing the study header, the stack section (replaced by the fixed technical setting in the runbook) and the scoring section, and the parenthetical that names what the oracle checks. It contains product facts only. If SDX-0 changes the base spec or scaffold, regenerate it and update the technical-setting paragraph in the runbook before any session, and hash both.
- `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\experiments\sdx1\practitioner\SESSION-FACTS.m1.md` and `SESSION-FACTS.m2.md`.

## 2. The decision: tell the model that the assistant has no memory between sessions?

**Question.** The practitioner's brief says what the assistant's situation is. Does saying "the assistant has no memory of earlier sessions; only the project folder carries over" leak the key mechanism (persistence of project state)?

**Arguments for telling.**
- It describes the deployment environment, not a solution. A practitioner who uses coding agents knows sessions start fresh. Without it, the model may write for a chat with continuity ("as we discussed"), and the resulting A5 is weak for the real situation. That is the strength defect M2 exists to prevent.
- The human brief in SDX-1-ARMS section 3 already says it ("a fresh agent session starts each change; it sees the repository as the previous sessions left it"). Telling the models keeps the primary model variant parallel to the primary human arm.
- A5 is derived by deleting every instruction to create, maintain or consult persistent project documents, so telling cannot put persistence content into A5 by construction, only into A6.

**Arguments against telling.**
- It primes persistence. Told that only the folder carries over, almost any strong model will write "leave a summary for the next session". That raises A6-m's content in the direction of L2 and L3, and after the deletion A5-m may still keep softer forms: self-explanatory names and comments, tests as documentation, descriptive commit messages (generic, allowed, but state-bearing). The arm is then less naive about state than an expert who was not told.
- It makes A5-m less comparable with a practitioner who reasoned about state unprompted.

**Decision.** It is genuinely unresolved, because both arguments are correct and they push in opposite directions on two different validity problems (strength versus leak). So both variants are produced, as separate fresh sessions per model:
- **m1 ("told")**: `SESSION-FACTS.m1.md` states the statelessness. It is the primary model variant because it matches the human brief.
- **m2 ("not told")**: `SESSION-FACTS.m2.md` says only that the assistant gets one request at a time. It is the sensitivity variant.
The runbook is identical in both; only that small file differs. The attestation asks, after step 1 is frozen, what the model assumed about memory, so we can see what an unprompted model assumes. The leak check is run on both. If A5-m1 and A5-m2 from the same model show different amounts of L content after deletion, that difference is itself reported as the priming effect.
Human brief parity: the human brief gets the same facts as m1 (`HUMAN-PRACTITIONER-BRIEF.md`), including one addition made here for both humans and models, that nobody answers questions during a session. SDX-1-ARMS section 3 step 2 should be updated at the next revision to say so (open item, listed in the backlog). Registration rule: at most two A5-m arms enter the run (the best-passing m1 by the M2 rule below, and its m2 twin if budget allows); every other produced text is archived and analysed descriptively as "practitioner variety", never run.

**Step 2 message (what JC pastes as the second message, identical for m1 and m2, and for every model; the model sees it only after step 1 is delivered and hashed).**

```
Step 2. Produce a version of your guidance for a study arm in which the assistant may not be told to create, maintain or consult any file other than source code and automated tests (so no notes, plans, README, or decision records), nor to install or require hooks, CI, or other enforcement. Remove what that rules out. Change nothing else and add nothing: every sentence of the new text must already appear, unchanged, in out/A6.md. If a sentence mixes allowed and ruled-out content, delete the whole sentence rather than rewording it. Write the result to out/A5.md.
Then write out/removed.md: every sentence you removed, verbatim, one per line, each followed by a few words saying which part of the constraint it fell under. If you removed nothing, write exactly "nothing removed" in that file and still write out/A5.md.
Then write out/attestation.md with three short answers: (1) what kinds of sources and experience you drew on; (2) what you assumed about whether the assistant remembers anything between requests; (3) in one line each, anything you would have written if the constraint had not applied (do not rewrite A5).
Then write out/meta.json as the procedure says. Do not edit out/A6.md.
```

## 3. What JC does on the second PC (per model, per variant)

Per model: two fresh chats, one for m1 and one for m2. Models: the newest GPT, the newest Gemini, plus other non-Anthropic frontier models available in the Copilot picker. Not the Claude model (the generator's vendor); a Claude variant, if wanted, is labelled "same vendor as generator" and kept out of the model-author claim.

1. Check the data-use settings once: the product description leaves the machine. Confirm that your content is not used for training in the Copilot and vendor settings; record the decision (the canary probe measures recall for the generator only).
2. `git pull` the branch `experiment-protocol-2026-10-02` so you have the files. Do not open the repository folder in the chat session.
3. For each session create a NEW empty folder outside any repository, for example `C:\sdx1-practitioner\<vendor>-<slug>-<variant>\`, containing exactly these three files (rename on copy):
   - `RUNBOOK.md` = a copy of `docs\experiments\COPILOT-PRACTITIONER-RUNBOOK.md`
   - `PASTURA-PRODUCT-DESCRIPTION.md` = a copy of `experiments\sdx1\practitioner\PASTURA-PRODUCT-DESCRIPTION.md`
   - `SESSION-FACTS.md` = a copy of `SESSION-FACTS.m1.md` (variant m1) or `SESSION-FACTS.m2.md` (variant m2), same folder
4. Open Copilot with this folder as the only workspace, a NEW chat, agent mode, no custom instructions or memory features, no repository instruction files in the folder. Pick the model. Send exactly: `Read RUNBOOK.md in this folder and follow it.`
5. When asked, paste the exact model id string shown in the picker. When the agent says "Step 1 delivered", check `out\A6.md` exists, then paste the step 2 message from section 2 as the second message. Do not add anything. Do not answer questions about content; if the model asks one, reply only "Use your own judgment."
6. When `out\A5.md`, `removed.md`, `attestation.md`, `meta.json` exist, close the chat. Do not read the texts to the model, do not comment on them.
7. Copy the `out` folder to `experiments\sdx1\practitioner\models\<vendor>-<slug>\<variant>\` in the repository (so that A6.md, A5.md, removed.md, attestation.md, meta.json are in that folder), then:
   ```
   git add experiments/sdx1/practitioner/models/<vendor>-<slug>/<variant>
   git commit -m "sdx1(practitioner-m): <vendor> <model id> <variant> A6 and A5, unreviewed"
   git pull --rebase
   git push origin experiment-protocol-2026-10-02
   ```
   Commit only after the second message has produced all files. A committed text is never edited; a revision is a new file with a suffix `-rev<N>` and its trigger (the revision budget of SDX-1-ARMS section 3 step 5 applies: at most 3).
8. Tell the assistant on the main PC the slug, vendor, variant and that the files are pushed.

Time: about 15 minutes per session including the copy; 2 sessions per model.

## 4. Main-PC checks (assistant and independent human reviewer; run before any A5-m is used in any run)

All checks run on the committed texts. Nothing from the oracle or any run is used (symmetric firewall). The model that authored a text never judges it. **The judge for each text must be from a vendor that is neither the generator (Anthropic) nor the author's vendor**: a GPT-authored text is judged by a Gemini-class or other third-vendor model; a Gemini-authored text by a GPT-class model. The main PC has no non-Claude judge CLI; the judge route is an API key held by JC or the second PC (a short judge runbook of the same shape as the critic runbook, written when needed). Until a route exists these checks are **owed** and no A5-m may be run.

**Deterministic checks (script, no judge)**
1. **Deletion-only.** After whitespace and Markdown-marker normalization, split A6 and A5 into sentences (by line and by sentence punctuation); every A5 sentence must occur in A6. Report A5 sentences not in A6 (additions or rewordings) and A6 sentences not in A5, and compare the latter with `removed.md` (they must match). Any addition fails the text; it is returned for a clean redo (a new session, not an edit).
2. **Hash and metadata.** SHA-256 of A6 and A5 equal to `meta.json`; `files_read` is exactly the three allowed files; `web_used` false; `tools_used` within the allowed list; model id string present; timestamps coherent; no mention of the repository.
3. **Lexicon scan** on A5 and A6: sentinel, spec lock, ledger, ADR, decision record, ratchet, gate, ratify, supersede, handoff, "next session", "future session", "keep notes", "update the README", `CLAUDE.md`, `AGENTS.md`, hook, CI, `.github`, lock file, "write down", "document your decisions", "summary of what you did". Output: hits per file with line numbers, for the human; never an automatic pass or fail.
4. **Size and shape.** Words, lines, number of headings; compared across models and with A0 (empty) and the human A5. Reported per artifact; sizes are not forced equal.

**Judge checks (a different-vendor stateless judge, run twice per text in two fresh sessions, blind to author vendor and to arm; calibrated first on the 10 planted artifacts of SDX-1-ARMS section 4, replaced if it misses any)**

The judge receives one text and the definitions of L1 to L5 and the grey-case rule from `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\prereg\SDX-1-ARMS.md` section 1, nothing else, and must answer, as JSON with a verbatim quote for every non-ABSENT answer:
- J1. For each of L1 to L5: ABSENT, PARTIAL or PRESENT, with the quote. Instruction included: detect the idea in other words, not only the keywords (for example "leave a short summary for whoever touches this next" is L3-like even without the word decision).
- J2. Does the text instruct the assistant to create, maintain, consult or enforce any persistent project-state artifact other than source code and automated tests, or to install or require any hook, CI or other enforcement? YES or NO with the quote (this is the operational line of the grey-case rule; it applies to A5 and must be NO).
- J3. Does the text contain any product fact (about Pastura's entities, rules, endpoints or numbers) that is not in the product description, or any guess about the content of future change requests or the hidden tests? List each with the quote.
- J4. Which generic engineering items does the text cover? (checklist of the manifest G items once the manifest exists; before that, a free list). Descriptive input for the M2 strength review only, never a pass or fail from the judge.
- J5. For A6-m only: the L1 to L5 status of the unconstrained text, descriptive input for the A6 contrasts; no pass or fail.
Rule (same as SDX-1-ARMS M1): an A5-m with any PARTIAL or PRESENT in J1 from either run, or YES in J2, or a J3 hit, leaks; it is archived with that verdict and not run. At least one text with zero leaks and passing the strength check is needed per registered A5-m arm.

**Human checks (independent reviewer, ROLES.md section 4)**: instrument 1 of M1 on the same texts blind to author vendor; the M2 checklist (does it cover the manifest G items; is it at least as good as what you would write under the constraint).

**Strength selection among A5-m texts (so the choice cannot be tuned to outcomes).** Which A5-m enters the run is decided only by: zero leaks (J1, J2, J3, human), the human M2 checklist, and in SDX-0 the targeted-metric calibration probe (layer-boundary violations, duplication). Never the hidden-oracle pass rate. If more than one text qualifies, choose by a pre-registered random draw (seed recorded) among qualifiers, one per variant.

**What a failure means.** A text that leaks is not "fixed by editing": a new session produces a new text (session-level redo, up to the revision budget). If every model's A5-m leaks or is weak by construction after the budget, the model-authored arm is dropped and that is reported: it is a finding about what expert-prompt models write when told the setting, not a hidden failure.

## 5. How this enters the logbook

One block per text under "Roles and independence record" in `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\LOGBOOK\SDX-1.md`: role `practitioner-model`, exact model id, vendor, variant (m1 or m2), session date, hashes of A6 and A5, J1 to J3 verdicts with judge vendor and model id, human M1 and M2 results, revision count, decision (run, archived, dropped) and why. The session folders, `meta.json` files, the judge outputs and the deterministic-check outputs are in the registration package.
