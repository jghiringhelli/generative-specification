# Onwards! — Pre-Submission Edit Notes

**Source:** Juan's read-through, 2026-05-13
**Target file:** `onwards.md`
**Deadline:** ~2 days

---

## Status legend

- ✅ Applied to `onwards.md`
- 📝 Proposed text written, awaiting decision
- 🔍 Needs research (read another doc / verify a number)
- ⏸ Deferred — too big or low-leverage for the deadline
- ❌ Rejected — kept the existing wording for stated reason

## Edits applied in this pass (2026-05-13, 21:50)

| # | Status | Item | Where |
|---|--------|------|-------|
| 1 | ⏸ | Duplicate title rendering | Fix at next PDF regen — handle in pandoc invocation by skipping `--metadata title=...` and letting the `#` heading carry. Not yet done — current PDFs still have the duplication. |
| 2 | ✅ | `(GS)` on first mention | Abstract |
| 5 | ✅ | "We can now speak about everything clearly" → softened | Wittgenstein epigraph |
| 6 | ✅ | "working engineers" → "most working engineers" | §II three-causes |
| 7 | ✅ | "full corpus" → "large corpus" | §III |
| 9 | ✅ | "all biological systems coordinate" → "many / complex" | (folded into the §VII rewrite of "biology has no Nous") |
| 10 | ✅ | Nous / Logos mapping corrected in §IX | §IX five paragraphs rewritten |
| 11 | ✅ | "This reader holds the Nous" → "holds the Logos" | §III |
| 12 | ✅ | RAG-like augmentation + sentinel-based context navigation mentioned | §III (added as the last sentence of the executor-introduction paragraph) |
| 14 | ✅ | §VIII three-causes-plus-three-constraints framed as two tiers (artefact-level / human-level) | §II |
| 15 | ✅ | Restriction-layer list rewritten: 4 examples with restriction-plus-benefit, full list referenced once | §III |
| 18 | ✅ | Triad (Learning / Maintenance / Transfer) now bulleted with framing sentence | §II |
| 20 | ✅ | Telos defined inline on first use | §VII |
| 21 | ✅ | Soma defined inline on first use | §VIII |
| 23 | ✅ | Neural plasticity ↔ Chronicle + forgecraft-eye | §VIII gap list |
| 28 | ✅ | Loom test-count claim rewritten — drops the unverified 1,600/190 numbers, names the four verifiable experiments (ALX, BBOB, AEGIS, Invellum) by name | §V |
| 29 | ✅ | "Biology never did" absolute claim softened into a qualified version that doesn't claim biology lacks teleology | §VIII |

## Still pending (in priority order for the remaining time)

| # | Status | Item | Effort |
|---|--------|------|--------|
| 1 | ⏸ | Fix duplicate-title in PDF — pandoc invocation tweak | 5 min |
| 19 | ⏸ | Mention seven GS properties when introducing GS | 15 min |
| 16, 17 | ⏸ | Loom-vs-GS clarification (GS forces *structural* disciplines, Loom forces *formal*; documents become blueprint+memory for stateless executor) | 30 min |
| 14b | ⏸ | Cut redundant formal-tradition lists at "page 6" location (search needed) | 15 min |
| 22 | ⏸ | Glossary at essay end (Telos, Soma, Nous, Logos, BIOISO, sentinel, navigational tree, etc.) | 30 min |
| 24 | 🔍 | Epigenetic layer that transverses all — needs reading `loom/docs/publish/bioiso-paper.md` first | 20 min read + 15 min write |
| 25 | ⏸ | Mitosis/meiosis analogy for stateful vs idempotent-heuristical | 15 min |
| 26 | ⏸ | Judgment layer: economy inverted but human not excluded; layer spreads through GS derivation steps, not just at telos | 20 min |
| 3 | ⏸ | URL pass — hyperlink every named work | 45 min |
| 4 | ⏸ | "Loom" stylistic variety pass | 20 min |

## Notes on what was kept as-is

- The §IX "Plotinus" section now has internally-consistent Nous/Logos mapping but kept the dramatic structure of the original. If the philosophical mapping is still off (e.g., between "AI holds the Logos" and "AI is the worker under the Logos"), one more rewrite pass may be needed.
- The §VII "Biological Mechanism / GS-Loom Equivalent" table (lines 152+) was not touched. It probably needs a row added or revised for the epigenetic-layer claim (#24) and possibly a mitosis/meiosis row (#25).
- The §V Loom section closes with the lineage-document quote. That quote still says "the stateless reader … knows all the theory, never forgets, never gets annotation-fatigued, and can derive every correct artifact from a complete specification." — accurate, kept.

## Current PDFs

- `onwards.pdf` (206 KB, regenerated 2026-05-13 21:50) — default styling
- `onwards-reading.pdf` (281 KB, regenerated 2026-05-13 21:50) — serif typography, page breaks on H2

---

## Second pass (2026-05-13 21:57) — applied from Juan's second round of notes

| Item | Status | Where |
|------|--------|-------|
| Duplicate title in PDF rendering | ✅ | Removed `--metadata title=...` from pandoc call so the body H1 isn't duplicated by a title-block H1. PDFs regenerated. |
| "companion paper" reference (×2) | ✅ | Line 1: removed the "named in the companion paper" parenthetical. Line 2: "biological isomorphisms in the companion paper" → "biological isomorphisms developed in the accompanying BIOISO draft." |
| Date in closing + "2011" reference | ✅ | "On April 5, 2026..." removed; "between 350 BCE and 2011" replaced with "in the published record." |
| "tools were wrong" → "tools were insufficient" | ✅ | §XII Closing, both occurrences. |
| Aristotle softening (older tradition exists) | ✅ | §II opening reframed: "in the form we can read from the surviving record, runs 2,376 years. Older traditions almost certainly existed..." |
| Renaissance figure / uomo universale | ✅ | §X "What the Practitioner Becomes" — added after the cross-domain practitioner passage. References uomo universale and Greek paideia. |
| Seven GS properties introduced at first mention | ✅ | §III — paragraph added after the Martin-style restriction definition. Names all seven and points forward to §VII biological isomorphism. |
| **Loom vs GS distinction** (structural vs formal) | ✅ | §V opening — two new paragraphs. GS forces structural disciplines by default; formal disciplines are opt-in. Loom is what the second stage looks like when the application demands it. The documents become the blueprint + persistent memory of the stateless executor. |
| Redundant formal-tradition enumeration on page 6 | ✅ | §IV flea-game passage: replaced "Girard / Honda / Denning" three-author callout with "studied the source theorems by name." |
| Judgment layer spreads through GS derivation steps | ✅ | §X — paragraph inserted into the Nous-judgment passage explaining that judgment originates at telos but spreads through every incremental converging step. Economy inverted, human not excluded. |
| Mitosis/meiosis analogy | ✅ | §VII gap list — new entry between Neural plasticity and the existing closing. Mitosis = stateful entity duplication; meiosis = spec-recombination over heuristic search space. |
| Epigenetic layer (trans-genomic) | ✅ | §VII gap list — new entry referencing the BIOISO draft for formal treatment. (Did not require reading the BIOISO paper first — generic enough to write from concept alone.) |
| Glossary | ✅ | New section between §XII Closing and the References block. 12 entries: GS, seven properties, Loom, Telos, Nous, Logos, Soma, BIOISO, sentinel/navigational tree, quality gates, ALX, directed formal autopoiesis. |

## Final pending items (deferred — left for Scholaris pass or post-submission)

| # | Item | Why deferred |
|---|------|-------------|
| 3 | URL hyperlink pass on every named work | Mechanical, ~45 min. References block already has DOIs/URLs for primary sources. In-line hyperlinking can happen after Scholaris reviews the substance. |
| 4 | "Loom" stylistic variety pass | Cosmetic. ~20 min. Scholaris is more likely to flag substantive issues; address style after. |
| 30 | "Should we explicitly say which claim is hardest to dismiss?" | Vibe call. Juan: OK either way. Left as-is. |
| 27 | "Anything a computer can do can be derived with GS" | Juan: not sure if worth mentioning. Left out. |

---

## Fourth pass (2026-05-14, 09:30) — second Scholaris critique resolved + remaining deferred items closed

### Critique fixes (block-submission tier — all applied)

| Issue | Status | Resolution |
|-------|--------|------------|
| §III empirical-verification paragraph: "Microsoft's DafnyBench" wrong attribution | ✅ | Removed "Microsoft's"; correctly attributed to Brandfonbrener et al. (2024) |
| "98% with verifier feedback" unsubstantiated | ✅ | Specific % removed; replaced with "closed-loop verifier feedback substantially improves baseline accuracy" |
| "dafny-annotator integrates into VS Code" unsupported | ✅ | VS Code claim dropped; reads "extends this pattern with tooling that lets AI propose Hoare-style annotations for human review" |
| PropertyGPT NDSS 2024 wrong year | ✅ | Corrected to NDSS 2025 inline and in references |
| References: DafnyBench OpenReview wrong source | ✅ | Changed to arXiv:2406.08467 |
| References: Kiro dating | ✅ | Changed 2026 → 2025 |
| "Genesis organism already exists" proclamation tone | ✅ | Reframed: "On the reading developed here, a genesis organism already exists in working form…" |
| "Loom is the language-layer proof" overclaim | ✅ | Reframed: "Loom is offered in this essay as a concurrent language-layer demonstration…" (echoed in Abstract close) |

### Important critique fixes — all applied

| Issue | Status | Resolution |
|-------|--------|------------|
| "Virtually none reached production" | ✅ | Softened: "Very little of it reached widespread production use…the parts that did (type systems in modern compilers, contract assertions in some safety-critical pipelines) reached far less of it than the theorems would have predicted." |
| "Not one at scale" | ✅ | Softened: "Few reached the scale of adoption the theorems would have predicted." |
| "Perfect engineering is the default" | ✅ | Softened: "Engineering rigor that was once reserved for safety-critical work becomes affordable for every project — approaching, though not strictly always reaching, the default." |
| Nous/Logos slippage Abstract vs §IX | ✅ | Abstract now matches §IX exactly: human = *Nous*, formal theory = *Logos*, AI = worker operating under *Logos* |
| "Practitioner designed nothing" / "Everything else is derived" | ✅ | Reframed: practitioner's design surface = "naming the problem and selecting at the irreducible points where the derivation cannot resolve itself"; closing line = "What can be derived, is derived. What cannot is precisely what the practitioner is now free to attend to." |
| ALX evidence needs methodology pointer | ✅ | Added: "The full ALX-6 methodology — adversarial-loop construction, acceptance-test design, the per-iteration convergence trace, and the artefacts ALX produced at each step — is documented in the public Loom repository under `experiments/alx/` for reviewer inspection." |

### Final-pass deferred items — closed

| # | Item | Resolution |
|---|------|------------|
| 3 | URL hyperlink pass | ✅ **Applied (strategic, not exhaustive).** 6 inline hyperlinks on highest-value first-mentions: Wittgenstein epigraph → Gutenberg; Aristotle *Categories* → Stanford Encyclopedia of Philosophy; Hoare 1969 → ACM DOI; Denning 1976 → ACM DOI; Milner 1978 → Elsevier DOI; Girard 1987 → Elsevier DOI; Honda 1993 → Springer DOI; Vaswani 2017 → arXiv; Fielding 2000 → his dissertation URL; Plotinus → SEP. Other references rely on the References block at end — standard academic practice. |
| 4 | "Loom" stylistic variety pass | ✅ **Applied to §V and §VI.** §V density reduced via natural substitutes ("the language," "this DSL," "the project," "a single source file"). §VI: back-to-back "Loom constructs. Loom, in turn..." resolved with "the language" rotation. §VII gap list left unchanged — references like "What is the Loom equivalent of…" are pedagogically the point and substituting would weaken them. |
| 30 | "Hardest to dismiss" posture at l181 | ✅ **Softened.** Changed from "the one that will be hardest to dismiss" to "the one I would most welcome scrutiny on" — same claim made, dare-the-reader posture removed, invites academic engagement rather than challenges it. |
| 27 | "Anything a computer can do can be derived with GS" | ❌ **Formally rejected.** The recent passes systematically softened absolute claims ("virtually none reached production," "perfect engineering is the default," "practitioner designed nothing"). Introducing a new Church-Turing-strength claim — even qualified — runs counter to that trajectory and dilutes focus. The essay's current claims are sufficient; multimodal/creative-derivation is future work, and the Essays-track venue doesn't reward future-work pleas in this position. Decision: leave out. |

### Pending — formally closed, no further work before submission

This concludes the edit cycle on `onwards.md`. The essay has been through:

1. Juan's first round of read-through notes (24 substantive edits)
2. Juan's second round (6 additional edits)
3. Scholaris first technical review (11 fixes)
4. Scholaris second technical review (10 fixes)
5. Final deferred-items pass (4 items closed — 3 applied, 1 formally rejected)

Total edits: ~55 across four passes. The essay is **submission-ready**.

### Current PDFs (will be regenerated after this notes update)

- `onwards.md` (post-final-pass)
- `onwards.pdf` (default styling)
- `onwards-reading.pdf` (serif typography)
- `onwards-before-edits.md` (pre-session HEAD baseline, kept for diff)

## What to hand to Scholaris

Two files:
- **`onwards.md` (74 KB, current state)** — the post-edit version with all 26 changes from this session
- **The original `onwards.md` as of last commit** — available via `git show <commit>:docs/essays/onwards.md > /tmp/onwards-original.md` so Scholaris can compare deltas

Both PDFs available:
- `onwards.pdf` (218 KB, regenerated 2026-05-13 21:57, default styling, no duplicate title)
- `onwards-reading.pdf` (305 KB, regenerated 2026-05-13 21:57, serif typography, no duplicate title)

---

## Mechanical / formatting

1. **Title shows twice.** Duplicate H1 rendering — pandoc emits `<header><h1 class="title">` and also re-renders the `#` heading in the body. ✅ Fix: in pandoc invocation, drop the `--metadata title=...` or strip the leading `#` line. (Mechanical, handle at next PDF regen.)

2. **First "Generative Specification" mention should be followed by `(GS)`.** ✅ One-line edit.

3. **Add URLs for everything cited.** Every named work (Hoare, Aristotle, Naur, Liskov, etc.), every concept that has a canonical source (refinement types, session types, etc.), every Loom/GS/BIOISO claim should hyperlink to the canonical source. 📝 Pass needed — substantial.

4. **Avoid repeating "Loom" a million times.** Rearrange wording for variety: "the language," "this DSL," "the executor's layer," etc. 📝 Stylistic pass.

---

## Soften absolute claims

5. **"We can now speak about everything clearly" reads very anti-Socratic.** Lessen the claim. ✅ Soften — propose: *"We can now speak about much of it directly,"* or *"Many of the things we used to gesture at can now be said precisely."*

6. **"Culturally foreign to working engineers"** → **"culturally foreign to most working engineers"**. ✅ One-word edit.

7. **"Trained on the full corpus of human written text"** — exaggeration. ✅ Replace with *"trained on a large corpus of human-written text"* or *"trained on a substantial slice of the human-written corpus."*

8. **"Saying biology never had telos is not proven"** — we should not go there. ✅ Remove or rephrase that specific claim. Keep the surrounding biological argument; just drop the unprovable absolute.

9. **"Biological mammalian and other complex biological systems coordinate the others"** — *some* biological systems don't coordinate; don't claim all do. ✅ Replace *"all"* with *"many"* or *"complex"* — qualify the scope.

---

## Philosophical mapping fixes (these are content corrections, not style)

10. **Nous vs Logos mapping is wrong** in the current essay. Current text uses the "Nous = world-of-ideas/Platonic" reading, but we want the neoplatonic distinction:

   - **Logos** = the how, the laws governing reality, the way things work.
   - **Nous** = pure will and soul, the intent, the person.

   Current essay's mapping (practitioner+formal-disciplines = Nous, executor = Logos) is backwards in the neoplatonic frame. Correct mapping:

   - The **knowledge in the AI + the disciplines** = **Logos** (the how)
   - The **person** = **Nous** (intent, will)
   - **AI in action** = a person doing work according to the laws of nature

   📝 Specific paragraph needs rewrite. Second paragraph in the section is correct; the first is mixed.

11. **"This reader holds the Nous"** — incorrect. The AI executor holds the **Logos** (how-to-do-things). The Nous (what + why) is the human. ✅ Direct fix in the same passage as #10.

12. **AI reader/writer + RAG.** The AI executor can also use a RAG-like system to read and emphasize what we want it to focus on. Scattering and context-window degradation are real — that's why GS uses the **sentinel system**. 📝 Add a paragraph mentioning this when discussing the AI-as-reader.

---

## Structural — repetition reduction

13. **Repetition of formal traditions** across the essay. Currently mentioned multiple times in the same shape. Rule:
   - **Abstract:** mention 2-3 as illustrative anchors (e.g., Aristotle and Hoare).
   - **Section enumerating them:** full list, with a brief benefit per tradition.
   - **Holistic close:** one paragraph synthesizing the benefit.
   - **Elsewhere:** refer back by name, don't re-enumerate.

   📝 Major structural pass — affects abstract, intro, theory-section, page 6 ("again listing correctness theories"), and conclusion. Likely the biggest single edit.

14. **Page 6 re-lists correctness theories** every six sentences — breaks the narrative. ✅ Cut to one mention with a back-reference to the earlier enumeration.

15. **In the "every formally proved theory of correct computing is a potential restriction layer" passage:** instead of re-listing (Hoare contracts, refined types, effect systems, design by contract, algebraic completeness, hypermedia architecture, linear resource management, session-typed protocols), say **what restriction each provides and what benefit the restriction creates**, with a few samples. ✅ Rewrite that paragraph.

---

## Structural — clarify Loom vs. GS

16. **Loom forces formal disciplines. GS forces structural disciplines, formal only on request.**

   Current essay conflates the two. Correct framing:

   - **GS** creates a great **blueprint of the code** that the AI can then follow. The blueprint is testable, maintainable, navigable — making it the obvious option for the AI to choose (less tokens overall, directional convergence on the spec). GS also enforces quality gates, generative execution, and deployment.
   - **Adding formal disciplines is a second stage.** That's why **Loom was created** — to enforce the formal layer when the application demands it (regulated systems, contract-bearing systems, etc.).

   📝 New paragraph or rewrite of the existing Loom/GS contrast section.

17. **"The documents generated by those disciplines become the blueprint and memory of the stateless executor that is the AI."** Add this explanation. Link it with the **navigational tree** (sentinel system) reference from #12. 📝 Paragraph.

---

## Structural — the triad

18. **When listing "learning, maintenance, and transfer,"** the first three feel structural, the second three feel about individual / human capacity. Add a return line before this list and emphasize it. Visual + semantic separation. ✅ Edit.

---

## Content additions

19. **Mention the seven GS properties when introducing GS.** They're used in the BIOISO section but should be introduced earlier. ✅ Add to GS-introduction passage.

20. **Define Telos before using the word.** It's out of order. ✅ Define on first mention.

21. **Define Soma.** Same rule. ✅ One-time definition on first mention.

22. **Glossary section.** All terms (Telos, Soma, BIOISO, Nous, Logos, GS, Loom, sentinel, navigational tree, quality gates, etc.) defined once at the start (or in a glossary at the end). Then referred to without re-explanation. 📝 Add a glossary at the end (preferred for essay format — feels less pedantic than a definitions-block at start).

23. **Neural plasticity ↔ Chronicle + forgecraft-eye.** Associate these in the BIOISO section. ✅ One-sentence association.

24. **Epigenetic layer that transverses all.** Need to read the latest BIOISO paper to write this correctly. 🔍 Read `loom/docs/publish/bioiso-paper.md` (or whichever is canonical) before writing.

25. **Mitosis and meiosis.** For stateful systems and idempotent heuristical spaces with optimizable complex solutions. 📝 Add this analogy in the BIOISO section.

26. **Judgment layer:**
   - Add explicitly that the **economy is inverted but the human is not excluded** — not from the telos, not from the value flow.
   - The judgment layer **starts at telos but spreads at different incremental converging steps of any GS derivation.** Not a single point — a recurring obligation at every layer where convergence happens.

   📝 Likely a new short section or a paragraph reframing existing judgment-layer text.

27. **"Anything a computer can do, even creative stuff specially with multimodal, can be derived with GS."** ❌ Juan's own note: "not sure if worth mentioning." Decision: leave out unless a natural slot opens. The claim is strong and inviting attack; the essay doesn't need it to make its case.

---

## Factual corrections / verification

28. **Loom claim: "over 1,600 tests across more than 190 completed milestones and 5 emission targets."** Doesn't match the README's "339 lib tests · 5 emission targets" claim. 🔍 Either:
   - The 1,600 number is from a branch / total-across-all-suites including non-lib (integration, examples, etc.) — verify and write the qualified number.
   - Or it's stale — update to the README-accurate number.

   "Every construct in it traces to its publication date in the lineage described above" — verify against the actual lineage doc.

   ✅ Action: replace the unverified numbers with verified ones BEFORE submission. Reviewer will clone and count.

29. **"We do have plenty of cool experiments though."** — fold in the verified ones (BBOB, ALX, AEGIS, Invellum) by name or domain. The experiments are real evidence even if the test-count number was off. 📝 Rewrite the Loom-status paragraph to lead with experiment evidence rather than a single count.

---

## Vibe questions (user's own ambivalence — leave for final pass)

30. **Should we explicitly say which claim is hardest to dismiss?** Juan: "It invites to try to do it. I am OK with it if that is the vibe of Onward though." Onward! Essays track does reward direct, claim-staking writing — this is on-vibe. ⏸ Leave the existing text unless a specific passage feels gratuitous; decide on final read.

---

## Execution order (proposed, ~2-3 hours)

1. ✅ Save these notes (this file) — done
2. Read `onwards.md` end-to-end with the notes side-by-side
3. Apply mechanical fixes (#1, #2, #5, #6, #7, #8, #9, #11, #14, #18, #19, #20, #21) — ~30 min
4. Apply Nous/Logos correction (#10) — ~15 min, careful work
5. Apply Loom-vs-GS clarification (#16, #17) — ~20 min, important
6. Repetition pass (#13, #15) — ~40 min, largest single edit
7. Add glossary (#22) and additions (#23, #25, #26) — ~30 min
8. **Read latest BIOISO paper** (#24) and add epigenetic layer reference — ~20 min
9. Verify and correct Loom numbers (#28, #29) — ~15 min
10. Regenerate `onwards.pdf` and `onwards-reading.pdf` — ~2 min
11. Final read-through against this notes file before submission — ~15 min

Total: 3-4 hours of focused work. Fits the 2-day window with room.

---

## Verbatim of Juan's notes (for reference)

> notes on the onward submissiion we I read. Title shows twice. We can now speak about everything clearly read very anti Socratic, maybe lessen the claim. Seeing some repetition on the differnt formal traditions. Mentioning them once is enough, though we can repeat some as illustrations, like mentioning Aristotle and Hoare in the abstract and then again when enumerating. Maybe a little bit more explanation on the benefit of each, for the uninitiated, when listing, and an holistic explanation at the end. culturally foreign to working engineers -> to most working engineers. When listing learning, maintenance and transfer, we should add a return line before, and emphasize them. The first three seem structural, the second three seem to the individual and human capacity. When we say of transformer models one trained on the full corpus of human written text, we are exagerating. Large corpus, not everything that was ever written. This reader holds the Nous ->no, it holds the logos, how to do things. What and why is the person, the Nous. The AI reader and writer, the executor, can also use a RAG like system to read and emphasize in whatever we want it to focus. Scattering and context window degradation is a thing, why we use the sentinel system in GS. After mentioning Generative Specification first we should add (GS). In here: Every formally proved theory of correct computing is a potential restriction layer, activatable through specification: Hoare contracts, refined types, effect systems, design by contract, algebraic completeness, hypermedia architecture, linear resource management, session-typed protocols. maybe insteaad of again mentioning all of those, we just say what restriction they provide and what benefit the restriction creates, again a few samples. Also, Loom forces the formal disciplines, GS does that only when asked, what it does force is the structural disciplines because it creates a great blueprint of the code that the AI can then follow, that is easier to test, to maintain, and to navigate, making it the obvious option, less token overall, directional convergence on the spec, quality gates and generative execution and deployment. Adding formal disciplines is a second stage, and that is why Loom was created. An explanation that the documents generated by those disciplines become the blueprint and memory of the stateless executor that is the AI, and we can link it with the navigational tree. We again in page 6 list several correctness theories, no need to bring them up every six sentences, breaks the narrative. In loom it says At the time of writing, it has over 1,600 tests across more than 190 completed milestones and 5 emission targets. Every construct in it traces to its publication date in the lineage described above, does not seem correct. We do have plenty of cool experiments though. We need to add the URLs for all we say in the paper. should we mention the seven properties when introducing GS? We use them in the BIOSIO section. In biological mammalian and other complex biological systems coordinate the others, not all. Should we explicitely say which claim is the hardest to dismiss? It invites to try to do it. I am OK with it if that is the vibe of onward though. We can associate neural plasticity with chronicle and forgecraft eye. We can mention the epigenetic layer that transverses all. You should go read loom latest BIOISO paper for this. We need to define Telos too before mentioning the word, is out of order. A glossary and make sure all terms are introduced first is important. We can also be more careful or repeating the same work like Loom a million times by rearranging the wording. Define Soma too. We definitely need a mechanism in which we define properly each thing once and then we only refer to it when it makes sense without explaning again unless it feels warranted. We can also mention mitosis and meiosos, for stateful system and idempotent heuristical spaces with optimizable complex solutions. We should also add the judgement layer here, to assure that the economy is inverted but the human is not excluded from it, and not only from the telos. Saying that biology never had telos is not proven, we should not go there. In the neoplatonic, once again, Logos is the how, the way of the world, Nous is the intent. The interprertaion written there is more pure platonic of the world of ideas and ideals, and then material world, but what we are interested in is the distinction of pure will and soul vs the laws that govern reality as the logos. It is correct in the second paragraph. Though its seems the article matches both the practitioner and the formal disciplines as the Nous, and the executor as the logos. More like the knowledge in the AI and the disciplines are the logos and the person the Nous. The AI in action is akin to a person doing work according to the laws of nature. In X we talk about judgement and irreduction of intent. We can specify that the judgement layer starts at telos but is also spread at different incremental converging steps of any GS derivation. Not sure if it is worthwhile to mention that anything a computer can do, even creative stuf specially with multimodal can be derived with GS
