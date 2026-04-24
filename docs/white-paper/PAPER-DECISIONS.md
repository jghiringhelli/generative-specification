# Generative Specification White Paper — Decision Record

This file is the ADR (Architecture Decision Record) for the white paper itself.
It applies GS's own discipline to the artifact that defines it: every structural
decision, critique, and deliberate preservation is recorded here so that future
revision sessions start with full context rather than reconstructing it from git
blame.

**Rule:** If a structural change is made to the paper — framing, section placement,
content added or removed — an entry goes here. Commit messages say *what* changed;
this file says *why*, what was considered and rejected, and what must not be
undone without understanding why it was done.

---

## Format

```
## [Date] — [Short label]
**Trigger:** what prompted the change
**Decision:** what was changed and why
**Preserved:** content explicitly kept despite pressure to cut or change
**Rejected options:** alternatives considered and not taken
**Open:** unresolved questions flagged for the next round
```

---

## Late March 2026 — Initial submission: proto-v1.0 (`e42ee53`)

**Trigger:** First arXiv-targeted draft integrating AX adversarial experiment results.

**Decision:** The paper opened cold with the theoretical apparatus — Morris semiotic
tripartition in the abstract, Chomsky structural analogy in §4.1.a, seven properties
immediately. No narrative warm-up. The argument sequence was: abstraction ladder →
theoretical gap → GS principle → artifact grammar → six case studies → experiments →
implications → conclusion.

**What was already settled and never changed afterward:**
- The seven property names: Self-describing, Bounded, Verifiable, Defended, Auditable,
  Composable, Executable. All seven names present and final in v1.0.
- The Martin-sense "paradigm" disambiguation (not Kuhn's sociological sense).
- The Morris (1938) attribution for the semiotic tripartition.
- The Chomsky analogy framed explicitly as structural, not formal equivalence.
- ForgeCraft conflict-of-interest disclosure.

**What was missing:**
- No prologue. The paper opened with theory.
- Abstract stated thesis rather than promising empowerment.
- Related Work was §5 (after the solution) rather than §3.5 (before it).
- Seven properties lacked per-property failure-mode grounding.
- The formula was `I(S) ≈ 1/S` (dimensionally weak — S=1 gives I=0 but S=0
  does not give I=∞ cleanly).
- "Community convergence theorem" — not yet renamed to "principle."
- SlopCodeBench (Orlanski et al.) not yet cited.
- §8.13 The Engineer Elevated did not exist.
- §8.14 The Adoption Ladder did not exist.

---

## Late March 2026 — Adversarial audit fixes: v1.1 (`b10903b`)

**Trigger:** Expert philologist review. Multiple linguistic attack surfaces identified
in the Chomsky analogy and related vocabulary.

**Decisions:**
1. **Chomsky correction:** GS's term "valid" is a deliberate extension of Chomsky's
   "grammatical" — not a misappropriation. Disambiguated explicitly with a note that
   the extension is intentional.
2. **"Generative capacity" → "derivation precision"** throughout. The prior term
   overloaded Chomsky's formal vocabulary.
3. **"Community convergence theorem" → "community convergence principle."** "Theorem"
   implies formal proof; "principle" is the correct epistemic weight.
4. **Analogy-mapping table added** to §4.1.a to make the Chomsky structural parallel
   explicit and bounded.
5. **Plain language summary added** after the abstract — the Jacquard loom / foundry
   historical arc from Babbage to present.
6. **§8.12 "The Application Gate"** added.
7. **§9.5 "Practitioner Path"** added.
8. **Mutation testing framing corrected:** v1.0 incorrectly called line coverage a
   "hallucinated" metric. Fixed.

**Preserved:** The entire seven-property structure, the Morris/Martin/Chomsky theoretical
apparatus, the six case studies as existence proofs.

**Persistent artifact introduced:** The §9.x Discussion sections (§9.1–§9.5) appear
without a parent `## 9. Discussion` heading. This numbering artifact persists through
all subsequent versions and causes ToC generation issues.

---

## Late March / Early April 2026 — §4.2 subheadings + abstract compression (`6c66f24`)

**Trigger:** Internal structural review — §4.2 was a dense unbroken prose block.

**Decisions:**
1. Four named subheadings added to §4.2 (The Three-Tier Taxonomy):
   "The Syntactic and Semantic Tiers," "The Pragmatic Tier,"
   "Prior Occupants of the Pragmatic Surface," "The Derivability Obligation."
2. Abstract compressed — phrasing tightened in the paradigm definition paragraph.
3. "Derivability obligation" given its own named subsection — the concept is now
   retrievable by a stateless reader without reading the full §4.2.

**Preserved:** All §4.2 content. The subheadings are organizational overlays, not
restructuring.

**Open:** The §9 header absence noted but not fixed in this commit.

---

## Early April 2026 — v1.3 Narrative restructure for approachability (`b9cf29c`)

**Trigger:** Approachability failure — the paper opened cold with theory. Reviewers
unfamiliar with the domain were unable to locate the human problem the paper solved.
Winston's "5 S's" rhetorical structure applied.

**Major decisions:**

1. **Prologue added: "The Week That Should Not Have Taken a Week."** A personal
   narrative about OAuth/DNS configuration consuming four days. The paper's first
   non-technical entry point.

2. **Abstract rewritten as empowerment promise.** The opening sentence changed from
   "The ladder has been moving..." to "You will finish this paper able to build any
   software system you can describe with precision, without writing a line of code
   yourself." This framing was locked here and never subsequently changed.

3. **Related Work moved from §5 → §3.5** (before the paradigm claim rather than after).
   Independent corroboration of the problem now precedes the solution.

4. **Seven properties derivation added:** Each property now grounded by naming the
   specific failure mode it prevents. The canonical framing: "not a taxonomy constructed
   in advance, but a record of what breaks and why."

5. **SlopCodeBench added** (Orlanski et al., arXiv:2603.24755) as a third independent
   validation thread in §3.5. This is the first version where the paper cites an
   independent empirical finding that structural deterioration rises in 80% of AI agent
   trajectories — directly corroborating GS's anomaly claim.

6. **Context compaction** added as the mechanistic link between SlopCodeBench's finding
   and GS's response.

7. **CodeSeeker named explicitly** in §6 tooling.

8. **Accessibility pass (Nadjet review):** Martin's three paradigms explained with
   significance; ADR, CLAUDE.md, sentinel, Chomsky hierarchy, all experiment acronyms
   defined at first use.

9. **§8.6.1 "The API-First Future"** added.

10. **§8.13 "The Engineer Elevated"** added.

11. **§8.14 "The Adoption Ladder"** added.

12. **§11 "Onwards"** added as closing section.

**Preserved:** OAuth/DNS story moved to §8.6.1 rather than cut.

**Rejected options:** Opening directly with the Orbiter story (considered; rejected
because it was more abstract than the OAuth/DNS personal narrative). The OAuth/DNS
story was the first prologue choice.

**Structural debt introduced:** Related Work now appears in two locations — §3.5
(problem-side corroboration) and §5 (relationship to prior principles). This split
is intentional but creates a navigation burden that must be managed.

---

## April 5, 2026 — Prologue replacement: v1.2/v1.3 (`309ec58`)

**Trigger:** Academic pre-publication scrutiny. The OAuth/DNS prologue was personal
but not structurally load-bearing. A reviewer noted that the paper needed an opening
that was simultaneously accessible and directly demonstrative of the paradigm claim.

**Decision: OAuth/DNS → Mars Climate Orbiter.**

The Orbiter (1999, $327.6M, pound-force vs. newton-seconds) replaced the personal
week-of-pain narrative as the prologue. Key structural argument: the Orbiter failure
was a specification boundary failure, not an implementation failure. The same class
of failure is produced at AI generation speed with no new mechanisms required.

The OAuth/DNS story was moved to §8.6.1, not cut.

**Why the Orbiter is better:**
- It is historically documented, attributed, and verifiable.
- It names the failure class (implicit unit convention = implicit context) precisely.
- It scales: a $327M government contract is legible to any audience.
- It is structurally integrated with the paradigm claim rather than narratively
  adjacent to it.

**Preserved:** The empowerment promise abstract (unchanged). The OAuth/DNS story
(moved, not cut).

**Rejected options:** Keeping the OAuth/DNS prologue. The trade was narrative warmth
against structural argument. The Orbiter won on structural grounds.

**Note for future revisions:** Some readers found the OAuth/DNS prologue more
personally relatable. If the target audience shifts from academic (arXiv) to
practitioner (workshop, Substack), a personal prologue may be more appropriate.
The OAuth/DNS story in §8.6.1 is available for that recontextualization.

---

## April 5, 2026 — Restriction as activation mechanism: v1.3 reframe (`d549bf6`)

**Trigger:** Recognition that the paper's treatment of restriction was purely negative
— restriction as constraint. A deeper structural insight was not yet named.

**Decision:** Added to §4.1.a: "The act of ruling things out is also the act of
activating what was always present."

The AI's training corpus contains the full formal tradition — Hoare logic, type theory,
design-by-contract, REST, deontic logic, domain-specific vocabularies. Naming these
constructs in a specification does not teach the AI; it unlocks what the model already
holds. The restriction is the activation mechanism, not merely a discipline.

**Figure 1 added:** The Generative Specification Domain Stack — two-axis table showing
Chomsky's upward generative reach against Martin's downward restriction, with the full
tier stack from syntax to business/ethics. First visual element in the paper.

**Significance:** This reframe changes the paper's second-order claim. Beyond "GS is
a methodology," it now claims "GS is the mechanism by which formal specification
traditions become accessible without specialist training." This is a stronger and more
provocative claim.

**Preserved:** The restriction framing in all prior sections (restriction as discipline,
restriction as liberation). The new framing adds a dimension rather than replacing.

---

## April 2026 — Name all novel concepts, enforce pillar hierarchy (`3f09b85`)

**Trigger:** Reviewer critique: the paper introduced novel concepts (coined terms)
without flagging them explicitly. A reader could not distinguish GS's own vocabulary
from borrowed vocabulary.

**Decisions:**
1. All coined terms flagged with "coined here" + nearest established concept:
   - "Architectural constitution" → coined here; maps to ISO/IEC 42010
   - "Phase-collapse" → coined here; no prior exact term
   - "Hardening surface" → coined here; maps to attack surface in security literature
   - "Derivability obligation" → coined here; nearest: specification completeness
     (Parnas 1972)
2. Each property definition expanded with:
   - Automatable checks note
   - Explicit prior literature citations (Parnas, Conway, Beck, Jia & Harman, ISO/IEC)
3. Bounded property: mechanical justification for 300-line limit linked to AI tool
   read budgets.
4. Verifiable property: write-completion ≠ compile-success argument added.
5. Formula updated: `I(S) ≈ 1/S` → `I ∝ (1-S)/S`. The new form is dimensionally
   correct (S=1 gives I=0; S=0 gives I=∞). No explicit decision note in the commit;
   the change was made in passing. This note is its record.
6. §9.4 renamed: "From Theoretical Claim to Running Instrument" → "The Convergence
   Spiral: Expected Iterations as a Function of Specification Completeness."

**Preserved:** All seven property names (no renames). The formula shape (only
precision-corrected).

**Note for future revisions:** "From Theoretical Claim to Running Instrument" was
a more descriptive title for §9.4. "The Convergence Spiral" is more evocative but
less precise about what the formula actually does. If the section is ever extracted
as a standalone technical appendix, restore the original name.

---

## April 13, 2026 — DX results integration + Contract Sufficiency (`f9f13f1`)

**Trigger:** DX experiment ran April 10, 2026 (Mitikah, Mexico City). Results
available. Final adversarial critique pass before arXiv submission.

**Decisions:**

1. **§4.4 "Contract Sufficiency: The What-How Distinction"** added. Closes a gap
   identified in critique: the paper needed a principled account of where the
   specification obligation ends and implementation discretion begins. The spec
   states *what* must be true; it does not prescribe *how* the AI achieves it.
   Promiscuous specification (over-specifying how) is a distinct failure mode.

2. **DX results integrated as §7.8.A.1.** 58 developers (not pre-registered 40).
   Three design deviations from pre-registration acknowledged explicitly:
   - Greenfield project (Vaquita) instead of brownfield
   - Two successive sessions, not one
   - Condition labels inverted
   The two-part finding is stated plainly: GS discipline transfers in one session;
   ForgeCraft revealed a temporal mismatch artifact (non-starter failure mode) that
   is a product gap, not a methodology gap.

3. **"Non-starter failure mode" named** for ForgeCraft: front-loading cognitive
   investment without scaffolded implementation guidance. The fix is a product
   change (guided onboarding), not a methodology change.

4. **§8.2.2 "The Industrial Threshold"** added.

5. **AX study: seven → eight conditions** (one more post-hoc condition from
   iterative gap-closing).

**Preserved:** The pre-registration framing. The paper does not hide that the design
deviated — it states this explicitly and argues the findings are valid despite the
deviation because the two-part reading is more informative than the original
single-question design.

**Rejected options:** Discarding the Vaquita pre-reveal results (the 13% vs. 38%
functional completion finding) on the grounds that ForgeCraft's front-loading cost
confounds the measure. Retained because the confound is itself a finding — it names
a real product failure mode.

**Open:** Whether GS's front-loading cost is tolerable under time pressure (90-120 min
workshop) vs. normal project timelines is unresolved. DX2 is designed to separate
these conditions.

---

## April 14–15, 2026 — Seven structural fixes + three content restorations (session: 74db953f)

**Trigger:** Multi-round adversarial critique session. Seven vulnerabilities identified
in the then-current v1.4. Three content losses identified by auditing v1.0 and v1.1
against current state.

### Seven structural fixes:

**Fix 1 — Abstract: Kuhn/Martin framing separated.**
Prior: The abstract conflated Martin's structural criterion (what defines a paradigm)
with Kuhn's sociological criterion (when a community adopts one). These are different
claims with different falsifiability profiles.
Decision: Rewritten to keep them distinct. "The Martin-sense structural case is
complete is the claim this paper advances." Whether the Kuhnian transition occurs
is left explicitly as a community determination question.

**Fix 2 — Abstract: DX1 two-part finding stated.**
Prior: Abstract described DX as a single study with a single finding.
Decision: Two-part finding stated explicitly in abstract — discipline transfer
(post-reveal free application outperformed tool-mediated compliance) AND temporal
mismatch artifact (ForgeCraft front-loading cost under time pressure).

**Fix 3 — §4 opening: GS removal differs in kind from predecessors.**
Prior: GS's removal was listed alongside structured programming, OOP, FP as
a member of the same category.
Decision: Added paragraph making the categorical difference explicit: prior
paradigms made implicit context *inconvenient* (human readers compensate);
GS makes it *structurally absent* because the reader that would have compensated
does not exist.

**Fix 4 — §4 opening: Enforcement objection answered at the top of §4.**
Prior: The answer to "the compiler knows nothing about the spec" was buried in §4.3.
Decision: Moved to §4 opening as "On enforcement." paragraph. The gate stack
(commit hooks, CI, MCP boundaries) IS the compiler for GS's restriction class.
Removed from §4.3 to avoid duplication.

**Fix 5 — Tier table: Evidence column corrected.**
Prior: T3 cited "Chronicle/Railway, §7.7" but §7.7 is the COMPASS ETL case, not
Chronicle/Railway.
Decision: T1 → "Demonstrated: production cases + DX1"; T2 → "Demonstrated: AX + DX1";
T3 → "Demonstrated: COMPASS ETL (§7.7)"; T4 → "Demonstrated: COMPASS/The Eye (§7.7)".
The word "Proven" was replaced throughout with "Demonstrated" — the epistemic claim
is calibrated to what the evidence actually supports.

**Fix 6 — §3: Auto Dream promoted from footnote to body.**
Prior: Auto Dream was a footnote.
Decision: Promoted to §3 body as a complementary approach. Auto Dream (bottom-up,
reactive consolidation) vs. GS (top-down, preventive specification) are not competing.
Both address the stateless reader problem at different layers.

**Fix 7 — Orphaned footnotes removed.**
Three footnote definitions ([^1], [^2], [^6]) remained in the file after their inline
references were removed during prior condensation. Pandoc generated warnings.
[^6] content promoted to §3 body (Auto Dream paragraph). [^1] and [^2] removed.
Second pandoc run: zero warnings.

### Three content restorations:

**Restoration 1 — §8.13: Synthetic/synaptic/synoptic triad.**
Present in v1.0 and v1.1. Lost during narrative restructure (b9cf29c).
The triad names three properties of cross-domain specification skill:
*Synthetic* (combining domains produces insight neither holds alone),
*Synaptic* (the productive surface is the boundary between domains),
*Synoptic* (holding multiple domains simultaneously enables pattern recognition
rotation cannot achieve). Restored in full.

**Restoration 2 — Provenance section.**
Present in v1.0. Lost during structural hardening.
Records the paper's own authorship process: the author named the doors; the AI
supplied the contents of the rooms. The Blavatsky inversion. The blind-session
rejection of the Austin speech act framing. Restored between Acknowledgements
and References.

**Restoration 3 — About the Author.**
Present in v1.0. Lost during structural hardening.
Brief biographical note including: "The first professional line of code was written
in 2006. The last one typed by hand was written sometime before June 2025."
Restored at end of document.

---

## April 16, 2026 — §5 disciplines table + §4.1.f harness/cascade + §7 reframe + §8.13 evolution (this session)

**Trigger:** User review identified four structural gaps:
1. Structural disciplines described in prose; no table; acronyms unexplained.
2. "Spec is the program" claim uncaveated — harness as guarantor not stated.
3. Six projects framed as experiments; their role as method-development substrate
   not distinguished from the controlled experiments.
4. §8.13 stated that specification skill compounds for cross-domain practitioners
   but did not show the trajectory — the evidence for expertise accumulation.

**Decisions:**

**§5 — Disciplines prose → table.**
The three-tier taxonomy (syntactic/semantic/pragmatic) existed in prose across §4.1
and §5. Converted to a ten-row table in §5 with columns: Discipline, Tier, What it
is (with all acronyms spelled out), Freedom removed, GS property satisfied, What GS
adds. Every acronym (SOLID, TDD, DDD, BDD, CI/CD, OOP, FP) is spelled out with a
plain-language description of what the discipline does and why it exists. The prior
bullet list (four GS-only contributions) was consolidated into a closing paragraph
rather than kept as separate bullets — it now serves as a summary after the table
rather than a repetition of it.

**§4.1.f — "On the role of the harness" paragraph added.**
The claim "spec is the program" requires the harness to be a guarantee rather than
an assertion. New paragraph states this explicitly: the spec establishes intent; the
harness certifies the derivation was faithful. T2 is not optional scaffolding; it is
constitutive of the GS guarantee.

**§4.1.f — "On cascade refinement" paragraph added.**
The tier hierarchy is conceptual; the implementation loop is recursive. T3/T4 failures
are detectors; T1 is almost always the site of correction. Complete NFR register at
T1 is a prerequisite for T3/T4 enforceability, not a documentation exercise.

**§7 intro — Two-category reframe.**
The §7 italic preamble now explicitly separates the six production projects (method
development substrate, existence proofs — "the rubric is their residue, not their
premise") from the controlled experiments (testing phase — AX, RX, BX, EX, DX —
designed to falsify rather than illustrate). The body paragraph adds the practitioner-
arc sentence with forward reference to §8.13.

**§8.13 — Practitioner evolution trajectory added.**
The arc from heavy AI dialogue → nudge-and-correct is evidence of expertise
accumulation and an argument against the structural-dependency concern. Added as
paragraph between the synoptic triad and the four structural changes list.

**Preserved:** The prior §5 closing sentences ("necessary but not sufficient" and the
four GS contributions). The synoptic/synaptic/synthetic triad (restored in prior
session, not touched). The §7 structural observation about SafetyCorePro/BRAD as
natural control conditions.

---

## Open questions for next revision (v3.0, post-DX2/DX3)

1. **§7.8.A.1** — Replace "in progress" with DX2 and DX3 actual results when available.
   Update pre-registered prediction outcomes. Update follow-up studies section.

2. **§9 header** — Verify `## 9. Extended Applications and Technical Notes` (or
   equivalent) exists before §9.1. The missing §9 header is a structural artifact
   present since v1.1 and has never been explicitly fixed.

3. **Formal/informal discipline naming pass** — The table in §5 uses "Syntactic" and
   "Semantic" as tier labels. Consider whether "structural disciplines" (informal tier)
   and "correctness disciplines" (Loom formal tier) should be introduced as named
   categories for the broader GS vocabulary. A full pass through the paper would be
   needed.

4. **DDD/ORM roadmap** — DDD and ORM as informal restriction layers for Loom. These
   were identified as relevant to the ForgeCraft roadmap but not yet in the paper.

5. **Provenance section meta-note** — Consider a footnote or sidebar noting that the
   paper itself is now governed by the same artifact discipline it describes:
   PAPER-DECISIONS.md is its decision record; critique rounds are its harness.
   This is a meta-demonstration worth one sentence in the Provenance section.

6. **NFR → T3/T4 cascade insight** — The insight that T3/T4 failures trace to T1 NFR
   incompleteness is now in §4.1.f as a paragraph. If DX2/DX3 produce data on this
   (teams that had complete vs. incomplete NFRs at T1 and their T3 failure rates),
   promote the paragraph to a subsection with evidence.

7. **The formula title (§9.4)** — "The Convergence Spiral" is evocative but less
   precise than the v1.0 title "From Theoretical Claim to Running Instrument." If
   §9.4 is ever extracted as a standalone technical appendix, restore the original.
