# IV. GENERATIVE SPECIFICATION: THE DISCIPLINE (v0.3, compact; extended text in `supplement/S4-discipline-extended.md` and `supplement/S5-structure-of-the-seven-extended.md`)

## IV. GENERATIVE SPECIFICATION: THE DISCIPLINE

Following R. C. Martin's sense of a discipline as defined by what it removes [13], GS removes the freedom to leave architectural intent implicit. For a human reader the removal is a convenience; for a stateless reader it is structural, because the recovery mechanisms (memory, collaboration, accumulated convention) do not exist. GS does not invent the underlying practices. It forces them, as the measurable definition of a well-specified system, because they are the structures a stateless reader needs.

### A. The seven properties

Each property names a failure mode observed in production, and together they are intended to make each class of failure structurally unreachable (Table I).

**TABLE I. The seven specification properties.**

| Property | Definition | Failure mode removed |
|---|---|---|
| **Self-describing** | The artifact set explains its own architecture, decisions and conventions; no external knowledge is required. | The reader cannot recover what the system is or why, and completes the gap arbitrarily. |
| **Bounded** | Every unit declares an explicit scope and seams and stays within the reader's finite read budget. | Scope leakage and silent truncation: the reader edits against an incomplete view. |
| **Verifiable** | The correctness of any output can be checked without human judgment. | "Done" mistaken for "written". |
| **Defended** | Forbidden operations are structurally prevented, not discouraged. | Controls that never run, so a known-forbidden pattern still ships. |
| **Auditable** | Current state and the history that produced it are recoverable from the artifacts. | Intentional trade-offs read as defects and "corrected" into silent drift. |
| **Composable** | Units combine and extend without unexpected coupling and are navigable in isolation. | A local change breaks distant callers the reader cannot locate. |
| **Executable** | Output satisfies its behavioral contracts against a real execution environment. | Statically valid output that fails every integration test against a live system. |

The seven are grouped in two ways that answer different questions. By *audience*: five are audit-facing (Self-describing, Auditable, Verifiable, Executable, Defended), properties that someone accountable for the system, who need not be an engineer, can check over its life; two form the engineering layer (Bounded, Composable) that keeps the five true under change. By *the function of the disciplines that satisfy them* (Section IV.D): verify (Verifiable, Defended, Executable) and retrieve (legibility: Self-describing, Composable; bounding: Bounded; decision memory: Auditable). The groupings cut across each other on purpose and neither asserts that the properties are independent.

We conjecture that Self-describing and Bounded carry disproportionate weight. A model's training already contains the formal tradition a correct implementation draws on; what it lacks at generation time is the instruction of which part to apply. A bounded, self-describing specification narrows it to the relevant region, by analogy with schema activation in comprehension [19]. This is a mechanism hypothesis and is not tested here.

**Grading.** Each property is graded with a letter from A to F, with the evidence behind it. A (90 to 100 out of 100) is the top band: enforced with no silent way around the check, and tied to the running system, which is level L4 of a maturity scale from L1 to L5; L5 is a trend, namely L4 sustained across at least three dated snapshots. A project is *governed as of a date* only when each of the seven properties is at L4 at one commit and one specification version, with none below L3. The letter and level scales are definitions and are not measured in this paper. The study uses static and emission metrics and a secondary audit on an earlier 0, 1 or 2 per property scale (a 14-point total, since retired as a scorecard).

### B. Prescriptive specification

A *descriptive* obligation records a state of affairs and leaves the reader to resolve its ambiguity, which a stateless reader resolves toward the literal minimum. A *prescriptive* obligation removes the degree of freedom. GS phrases load-bearing obligations with RFC 2119 and RFC 8174 vocabulary: MUST maps to a blocking gate, SHOULD to a warning and MAY to an ungated permission. The practice is selective, since over-marking is the same excess that degrades any bounded artifact. A single-shot experiment found that a descriptive specification let a model floor to the literal minimum (0 of 3 against a held-out oracle) while a prescriptive one recovered the full intent (3 of 3) at equal cost; at n = 1 per arm this is an example, not a rate (supplementary material).

### C. Phase collapse and cost inversion

When the specification is complete and the executor capable, specification, implementation and verification collapse into one derivation step. The phases do not disappear as obligations; they cease to be separate moments, so gates must reconstitute the guarantees that temporal separation used to provide. Where regeneration is cheap, a defect is read as a query to the specification (what constraint, had it been present, would have ruled this out?) and the fix is written once and regenerated. We hold the economic claim qualitatively. Generation under GS costs more than under naive or expert prompting (Section VI.A); what is measured to fall is retrieval cost per question (Section VI.F), and the full-session claim is not measured.

### D. The loop: retrieve, generate, verify

A session runs as retrieve (assemble the right context from authored structure), generate, and verify (check output against the specification in a real execution environment, not assumed from compilation). The verify step realizes Executable. Verify also covers *coherence over time*: divergence between specification and code is a verification problem and not a generation problem. Five checks that use no model were designed: identifiers in both directions (no orphaned tests), a *lock* tying each derived artifact to the specification section and version it came from, a co-change gate (a behavior change cites a criterion, stages the specification change, or declares itself a refactor and passes its parent's tests unchanged), an inverse inventory of the public surface, and an intent diff for the person who signs. They were implemented in one sample project and verified on 35 crafted scenarios (the assertions of one self-test script in that project; 22 before the lock scenarios were added). This shows that they detect what they are defined to detect, not that they reduce defects; no effect was measured. They cannot detect that a specification is wrong, and an agent could run a ratification itself, so the real enforcement is a person's review of the ratification record. Following Böckeler [35], we call the sentinel, specifications and instruction files *guides* and the tests, linters and gates *sensors*.
