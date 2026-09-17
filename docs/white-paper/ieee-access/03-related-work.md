# §II — Related Work (draft v0.1)

> Positioning strategy: IEEE Access gates on **distinctness + soundness, not novelty**. So this
> section CREDITS each lineage explicitly, then names the specific unoccupied slot GS fills
> (derivability by a stateless reader as a binding constraint). Never says prior work was wrong,
> only that it answered a different question. Placed early (readers need the map).
> Citations [1]-[13] resolve against `04-references.md` (verified Aug 2026).

## II. Background and Related Work

Generative Specification stands on four established lines of work. We state what each contributes
and where it stops, so the discipline's distinct contribution is visible against them rather than
asserted.

### A. Paradigms as removals of freedom

Structured programming, object orientation, and functional programming each advanced by removing a
freedom: unrestricted jumps, unrestricted access to internal data, and unrestricted reassignment,
respectively [1], [2]. Each removal bought order by
constraining what a program could express. We adopt this lens directly. Generative Specification is
defined by a further removal, the freedom to leave intention implicit, and inherits the same logic:
the constraint is what buys the guarantee. Where the prior paradigms constrained the *structure* of
a program, Generative Specification constrains the *completeness of its stated intent* for the
benefit of a reader that carries no prior context.

### B. Semantic-tier design disciplines

The SOLID principles, test-driven development, domain-driven design, and clean-code practice
[3], [4], [5], [6] raise the maintainability of code by making structure and intent legible
to a human who returns to it later. Generative Specification does not replace these. It re-purposes
them. In our framing they are carriers of intention across the second bridge, from human language
toward code, and their new function is to instruct a stateless generator which region of its
capability to apply, in addition to helping a later human reader. The distinction is the beneficiary
and the mechanism: these disciplines were designed for human maintainability, and we show they
double as activation instructions for an AI executor.

### C. Formal methods and specification-driven development

Hoare logic, type theory, and design by contract [7], [8] establish that
behavior can be specified and checked rather than assumed. Specification-driven development applies
the sequence directly: specify first, then implement [9], [10]. Generative
Specification is a member of this family and says so plainly. What distinguishes it is not the idea
of specifying before coding but a change in the **executor**. When the agent that derives the code
is an AI that already carries the formal tradition in its training, the specification no longer has
to teach or to prove. It has to *close the space* the generator would otherwise fill by guessing,
and it becomes the source from which code and tests are derived and re-derived rather than a
document written once and left behind. The binding constraint we identify, derivability by a
stateless reader, is what turns specification-driven development from a recommended sequence into an
enforceable one.

### D. LLM code generation and prompt engineering

A large and fast-moving literature studies how to elicit better code from large language models,
largely through prompt design and in-context examples [11], [12], [13]. Our
contribution is orthogonal and complementary. Generative Specification is a discipline over the
*specification and its verification*, not a catalogue of prompt tactics. Its claim is that most of
the capability practitioners try to coax out with prompt tricks is already latent, and that a
bounded, self-describing, verifiable specification activates it more reliably than clever phrasing,
while a harness confirms the result against a running system rather than trusting the model's
fluency.

### E. The unoccupied slot

Across these lines, no prior work treats *derivability by a reader carrying no accumulated context*
as the binding design constraint. Structured disciplines assume a human reader who can ask a
colleague. Specification-driven development assumes a human implementer. The LLM-generation
literature optimizes the prompt rather than the specification. Generative Specification occupies
that slot: it makes the specification complete enough that a stateless reader, human or AI, can
derive the system without guessing, and it is evaluated on whether that derivation holds up under
adversarial audit. This is a distinct question, and the remainder of the paper defines the discipline
and tests it.
