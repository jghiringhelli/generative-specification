# Generative Specification: Book Bible

**Purpose of this document:** Canonical source of truth for a practitioner-facing book
about Generative Specification. To be used by StoryCraft for chapter generation and by
Scholaris for chapter critique. This is not a chapter draft. It is the structured source
the book derives from.

**Author:** Juan Carlos Ghiringhelli  
**Audience:** Senior developers, tech leads, engineering managers, data team leads;
secondarily CTOs and VPs of Engineering  
**Date:** April 2026  
**Status:** Living document — update when the research moves

---

## TABLE OF CONTENTS

1. [The Problem](#1-the-problem)
2. [The Core Inversion](#2-the-core-inversion)
3. [The Specification Stack](#3-the-specification-stack)
4. [The Six-Tier Cascade](#4-the-six-tier-cascade)
5. [The Seven GS Properties](#5-the-seven-gs-properties)
6. [The Tool Kit](#6-the-tool-kit)
7. [The Closed Loop](#7-the-closed-loop)
8. [Documentation Just-In-Time](#8-documentation-just-in-time)
9. [Case Studies](#9-case-studies)
10. [The Formal Underpinning](#10-the-formal-underpinning)
11. [The Biological Isomorphisms](#11-the-biological-isomorphisms)
12. [The Research Horizon](#12-the-research-horizon)
13. [Voice and Tone Guide](#13-voice-and-tone-guide)
14. [Book Positioning](#14-book-positioning)

---

## 1. THE PROBLEM

### What AI drift is and why it happens

Every organization using AI coding tools is discovering the same thing: AI can write code
faster than any human, but the results drift. One session produces something good; the
next session, on the same project, produces something incompatible. The team gets more
output but also more chaos. The code is abundant; quality is not.

The reason is structural. An AI assistant has no persistent memory of what your system is
supposed to be. Every session starts from scratch. Without a persistent description of
what correctness means for your specific system, the AI fills the gap with its best
guess — which changes every time.

The failure mode is not poor code on any given session. It is *cumulative incoherence*:
across sessions, teams, and time, the system drifts toward the statistical average of
whatever the model was trained on, not toward what your system specifically requires.
Generated output is locally plausible and globally incoherent.

### Why better prompting doesn't fix it

Prompt quality is the wrong variable. More precise prompts produce better single-session
results. They do not solve the structural problem: the next session — with a new context
window, possibly a different team member — has no access to the decisions, conventions,
and constraints the previous session operated under.

This is not a model quality problem. It is an architecture problem. The intent that
should govern the system lives in people's heads and informal Slack threads, not in a
form any executor can read at session start.

### The one-sentence diagnosis

Every session starts from scratch because there is no persistent description of what
correctness means for this system.

### What makes it worse at scale

With AI-assisted development, output speed has increased dramatically. This means:
- Drift accumulates faster, because more code is generated per unit time
- The gap between "code that compiles" and "code that belongs to this system" is wider,
  because the AI fills underspecified intent with plausible defaults
- Multiple AI-assisted developers on the same codebase diverge faster, because each
  session loads a different subset of informal context

The speed advantage of AI becomes a liability when the system has no formal description
of what correct looks like.

---

## 2. THE CORE INVERSION

### Specification is primary; code is derived

Generative Specification is built around a single inversion: **the specification is the
primary artifact, and code is derived from it.**

In conventional software development, code is primary. Documentation, tests, and
architecture diagrams try to describe the code after it exists — and immediately begin
to go stale. The AI, reading stale documentation, produces stale code.

In GS, you write a complete, precise description of what your system must be — what it
does, what it must never do, how it handles failures, what compliance obligations it
carries, how it should be tested — before any code exists. That description is
machine-readable. The AI reads it at the start of every session and derives the code
from it, every time, without drift.

The specification does not go stale because the specification *is* the source. If the
system changes, the specification changes first. Code is always derived. The artifact
that governs the system and the artifact the AI reads are the same thing.

### What this means in practice

"The blueprint was the work." This is not a slogan. When JC built CodeSeeker — a
production code intelligence tool — he did not write a single line of application code.
He wrote behavioral contracts, architectural constitutions, use cases, and quality gates.
The AI derived the implementation from those artifacts. The specification was the program.
The code was what the program derived.

This changes the practitioner's job description. The practitioner no longer writes code.
The practitioner writes the precise description of what correct behavior looks like, and
the AI satisfies it.

### Why this was not possible before LLMs that read human language at senior-engineer level

The disciplines that GS draws on — Domain-Driven Design, Test-Driven Development, clean
architecture, Hoare contracts, design by contract — were always the right approach. They
were too expensive for human practitioners to apply fully. A developer under deadline
pressure makes pragmatic choices: skip the invariant annotation, defer the ADR, write the
test later.

The cost structure changed with LLMs. An AI assistant does not experience deadline
pressure. It does not deprioritize invariants because the sprint ends Friday. It does not
decide that this function is simple enough to skip the contract. Given a specification
that encodes what correct behavior looks like, it will satisfy that specification —
indefinitely, without erosion, without the annotation fatigue that stopped human
practitioners from sustaining formal discipline.

What was always right and too expensive is now affordable. The disciplines that the formal
tradition produced over 2,376 years — from Aristotle's categories through Hoare's
contracts to Rust's type system — had been waiting for an executor that would never get
tired. That executor exists now.

---

## 3. THE SPECIFICATION STACK

The specification is not one document. It is a structured set of artifacts, each serving
a distinct cognitive function for the AI reader. The Practitioner Protocol organizes
these into five memory types. The book should explain them as a practical stack.

---

### Artifact 1: Architectural Constitution (CLAUDE.md)

**What it is:** The primary semantic artifact. The grammar the AI reads before any session
prompt. Everything the AI must do and must never do, regardless of session instructions,
lives here.

**What it contains:**
- Target architecture: layer names, allowed dependency directions, forbidden patterns
- Quality gates: coverage threshold (as a number), lint rules, complexity ceiling
- Naming conventions: precise enough that layer ownership is legible from the name alone
- Error handling standard: exception hierarchy, required context fields
- Technology decisions: locked versions, approved libraries, explicitly forbidden libraries
- Guard clause mandate: the most common AI deviation (nested conditionals instead of
  early-return guards) must be stated explicitly as forbidden, with the correct pattern shown
- Commit format: conventional commit prefix set, scope conventions
- Corrections Log: every time the practitioner corrects the AI's output, the correction
  is recorded here as a one-line entry. This is a feedback loop written into the grammar.
- Techniques subsection: named techniques (RAPTOR indexing, BM25+vector hybrid retrieval,
  deontic modal logic) activate the AI's full depth on those techniques. The name is the
  activation key.
- Known Pitfalls subsection: technology traps documented with wrong pattern / correct pattern.
  Prevents the AI from falling into the same trap twice.

**Why it exists:** Without this, every session starts as a blank-slate design problem.
The AI treats each request in isolation, optimizing locally and violating boundary rules
without knowing they exist.

**What breaks without it:** Global incoherence at AI-generation speed. The AI produces
code that is locally correct (compiles, passes unit tests) and globally wrong (violates
the architectural boundary that was only in someone's head).

**Practical note:** Keep it under 300 lines. The AI reads it in full on every turn.
A 600-line constitution means the lower half is invisible by session turn 50. ForgeCraft's
`setup_project` command generates the initial constitution and can compress it when it
grows too large.

**Pattern vocabulary as specification shorthand.** The constitution should name the design
patterns in use. "This module uses the Repository pattern" is a compact specification that
carries enormous implicit structure — the AI already knows Repository means: collection
abstraction interface, no SQL in the domain layer, CRUD through typed methods, isolated
testability. Naming the pattern specifies all of that without restating it. The name is
the specification.

**GoF patterns mapped to GS properties.** Each pattern satisfies a specific GS property
structurally — not as a side effect, but as its essential purpose:

| Pattern | GS Property | What naming it enforces |
|---|---|---|
| Strategy | Composable | Algorithm family as interface; each strategy independently testable; interchangeable without structural change |
| Adapter | Bounded + Composable | Hard boundary between governed code and external dependencies; domain never touches infrastructure directly |
| Command | Auditable | Operations as named, traceable objects; every action logged, undoable, queueable by structure |
| State | Verifiable | Formal state machine; every valid state and transition explicit; each transition a testable assertion |
| Decorator | Defended | Cross-cutting concerns (auth, logging, rate limiting) without touching core logic; defense is structural |
| Observer | Executable | Event notification verifiable: harness registers test observer, triggers event, asserts receipt |
| Factory Method | Self-describing | Creation contract named and discoverable; no hidden instantiation scattered through the codebase |
| Repository | Bounded + Self-describing | Persistence abstraction named; SQL stays outside the domain layer by structural contract |
| Template Method | Verifiable | Algorithm skeleton testable at the base class; each step a discrete assertion point |
| Chain of Responsibility | Defended | Validation and security pipeline structured; each handler a discrete, testable gate |

The fit is not coincidental. GoF patterns emerged from the same problem GS addresses: how
do you communicate structural intent to a reader who cannot ask questions? The patterns
are a vocabulary for that communication. GS adds a new reader — the AI — and the vocabulary
works on the AI for exactly the same reason it works on humans: the names carry the structure.

**Tier 2 — Use where the domain requires it:**
Builder (complex object construction), Facade (subsystem simplification), Proxy (lazy
loading, access control), Composite (recursive structures), Mediator (decoupled coordination),
Memento (undo/redo, state snapshots).

**The Singleton exclusion.** Singleton is the one pattern to prohibit in the constitution
rather than encourage. It creates hidden global state (violates Bounded), makes testing
harder (violates Verifiable), and creates implicit dependencies (violates Composable). AI
assistants reach for Singleton frequently — it is common in training data and a common
shortcut. The GS-aligned replacement: dependency injection at the composition root. The
single-instance constraint is enforced by the container, not the class. Any exception
requires an ADR.

**Architectural and domain patterns** work identically:
- **CQRS, Event Sourcing, Outbox, Saga, BFF** — naming constrains the AI to the canonical
  structure, not an ad-hoc invention.
- **Aggregate, Value Object, Domain Event, Domain Service** — the DDD vocabulary governs
  an entire domain layer from a list of names.
- **Custom techniques:** RAPTOR indexing, BM25+vector hybrid retrieval, deontic modal
  logic — named techniques activate the AI's full trained depth.

A constitution that names patterns is denser per token and more reliably executed than
one that describes the same structure in prose.

---

### Artifact 2: Structural Files (Bounded Contexts, Domain Model, ADRs)

**What it is:** The layer that captures what the system *is* and *what decisions shaped it*.
Technical specification, C4 diagrams, Architecture Decision Records.

**What it contains:**
- Functional scope: what the system does and what it explicitly excludes
- Data models: entity definitions, field types, constraints, relationships — precise enough
  that two developers writing separate modules produce compatible schemas
- API contracts: endpoint signatures, inputs, outputs, error shapes, authentication requirements
- Non-functional requirements: latency targets, throughput ceiling, availability SLA,
  data retention policy, security compliance
- C4 diagrams: Level 1 (context: what the system is and what it communicates with),
  Level 2 (containers: deployable units and their boundaries)
- ADRs: every non-obvious architectural decision, before implementation begins.
  Format: Decision (one sentence) / Context (problem and rejected alternatives) / Consequences.
  Once accepted, never edited — superseded by a new record.

**Why it exists:** An ADR is the memory of a decision that would otherwise be "optimized"
by a future AI session. Without the ADR recording that this design choice was deliberate,
the next session will "improve" it with a different approach, breaking the rationale that
was never written down.

**What breaks without it:** The AI treats every session as a greenfield design problem.
It revisits and overturns intentional decisions. Naming diverges across the codebase as
the AI uses different terminology for the same concept in different sessions.

---

### Artifact 3: Behavioral Contracts (Use Cases, Pre/Postconditions, Failure Modes)

**What it is:** The specification layer that describes what the system does, precisely
enough that three things derive from a single artifact without redundancy: implementation
contracts, acceptance tests, and user documentation.

**What it contains:**
Use case format (minimum): Actor / Precondition (what must be true before) / Trigger /
Main flow (step-by-step, precise enough to be executable) / Postcondition (what is true
after successful completion) / Error cases (condition → system response) / Out of scope.

**Why it exists:** A use case is not a requirements document. It is a production rule.
The service layer is written against it. The acceptance test is the use case transcribed
into executable form. When a test is hard to write, the use case is underspecified —
test difficulty is the diagnostic for specification quality.

**What breaks without it:** The AI cannot distinguish "feature the specification anticipates"
from "feature the specification does not yet cover." It generates plausible behavior for
unspecified cases, which accumulates as specification debt that is invisible until integration.

---

### Artifact 4: Quality Gates (Coverage Thresholds, Mutation Score, Hygiene Rules)

**What it is:** The enforcement layer. The specification of what a correct derivation looks
like, stated as blocking criteria the AI must satisfy before any output is accepted.

**What it contains:**
- Line coverage thresholds: 80% overall, 90% on new or changed code, 95%+ on critical paths
  (auth, financial calculations, PHI handling)
- Mutation score thresholds (MSI): ≥65% overall, ≥70% on new or changed code.
  Line coverage measures what was executed. Mutation score measures what was caught. An
  AI-generated suite can hit 80% line coverage and 0% mutation score — tests that run
  the right code but assert nothing. Both thresholds are gate conditions, not guidelines.
- Pre-commit hook: runs full lint + type-check + unit test suite before every commit.
  The AI maintains the hook as part of the constitution; it cannot remove or weaken the
  gate without a documented ADR.
- Hygiene rules: no hardcoded values, no bare exception throws, no `console.log` in
  production paths, no TODO/FIXME stubs returning hardcoded values

**Why it exists:** "The spec is the program" holds only when the derivation is verified.
A specification without behavioral verification is an assertion about intent, not a
guarantee about behavior. The harness is constitutive of the GS guarantee — not optional
scaffolding that can be added later.

**What breaks without it:** The AI can drift from the specification silently, at generation
speed, across sessions, without the practitioner noticing until integration. Authoring
without the dev-time harness is an unverified claim. The harness without authoring is
theater. Both halves are inside T1; neither stands on its own.

**The hook cycle as a lived experience.** This is what happens when the practitioner types
`git commit`:

1. **Atomic commit hook fires first.** It checks that the staged changes constitute one
   logical change — a single feature, a single fix, a single refactor. If the diff crosses
   multiple unrelated concerns, the commit is blocked. The discipline is imposed automatically;
   the practitioner does not decide whether to apply it.
2. **Pre-commit hooks run in sequence.** Full lint + type-check + unit test suite. Zero
   errors required. If any gate fails, the commit is blocked with a specific, actionable
   message. The AI cannot bypass or weaken these hooks without a documented ADR — ForgeCraft
   enforces this.
3. **Coverage and mutation gates.** Coverage below threshold blocks the commit. Mutation
   score below threshold blocks the commit. These are not warnings. A commit that weakens
   the test suite does not land.
4. **Security and hygiene checks.** Hardcoded secrets, bare exception throws, console.log
   in production paths — each blocks the commit with the specific violation identified.

The practitioner experiences this as: *I write the specification; the AI generates the
code; I commit; the system tells me if the derivation was faithful.* The hooks are the
automated voice of the specification saying "this is not what you described." The cycle
is the guarantee.

**The structural disciplines insight.** The core discovery of T1: the structural
disciplines that made code easier for humans to understand and modify — clean architecture,
DDD, TDD, conventional naming — have the same effect for AI assistants. An AI reading a
well-structured codebase navigates it correctly; an AI reading a badly structured one
makes the same mistakes a new human developer would make: coupling, leakage, inconsistency.

This is not obvious. It seems like the AI should be indifferent to naming conventions or
layer boundaries. It is not. The structure is the grammar. The AI is a language model.
Language models respond to grammar. A codebase with intentional naming, clear boundaries,
and a consistent vocabulary is a high-quality grammar. The AI reads it correctly and
produces output that belongs to it. This is the structural foundation of the entire
methodology.

---

### Artifact 5: Relationship Memory (C4 Diagrams, Sequence Diagrams, Dependency Maps)

**What it is:** The layer that captures how things connect — component topology, flows,
protocols, state machines. In a generative specification, diagrams are not illustrations.
They are constraints the AI reads before generating implementations.

**What it contains:**
- C4 diagrams (static structure): context (L1) and container (L2) at minimum. Generated
  at initialization, kept current through the ADR update cycle.
- Sequence diagrams (temporal contracts): a sequence diagram that specifies authorization
  precedes data fetch — and not the reverse — is a stricter constraint than prose.
- State machine diagrams: enumerate every valid state and every valid transition. A component
  that can be in an undocumented state will accumulate bugs in that state until the diagram
  is drawn.
- Use case flow diagrams: the behavioral grammar at the human layer, and simultaneously
  the script for every E2E test in that flow.

**Why it exists:** Inter-component contracts are implicit without relationship memory. Each
AI session re-derives the topology from what it can see in the files, producing structural
drift at integration points.

**What breaks without it:** Integration points drift. The AI connects components in ways
that are locally plausible but globally inconsistent with the intended architecture. This
failure is invisible until the system is tested end-to-end.

---

## 4. THE SIX-TIER CASCADE

Each tier names a *lifecycle stage* — development, staging, production, evolution,
synthesis, meta-telos — and at each stage the practitioner stops carrying two
obligations at once: an *authoring obligation* (what they no longer write) and a
*verification obligation* (what they no longer have to check by hand). The pairing
is the load-bearing structural claim. The verification removal is what makes the
authoring removal safe at that stage, because a stage-appropriate harness now
certifies the derivation was faithful. Earlier formulations counted seven tiers and
treated the dev-time harness as its own rung; doing so obscured the symmetry. The
harness is not a tier. It is a cross-cutting capability that recurs *at* every
tier with stage-appropriate tests — dev-time at T1, staging at T2, production
runtime at T3, evolution-time at T4, colony-level at T5.

The cascade is not a checklist to reach the end of. T1 is the entry point for every
practitioner. Higher tiers become relevant when the project's failure modes reach
that level. T1 through T4 are proven across production deployments and the Loom
colony simulation. T5 is architecturally specified; T6 is a research agenda named
honestly as the logical terminus.

**Template for each tier:**
- Authoring obligation removed
- Verification obligation removed
- What makes both removals possible
- What the practitioner does instead
- What breaks before it works
- Proof status

---

### T1 — Development: you stop writing code, and you stop reading what was generated

**Authoring obligation removed:** Writing application code.

**Verification obligation removed:** Reading, reviewing, and auditing generated code
to confirm it satisfies the spec. The dev-time harness — the verification half of
T1 — does what a manual QA practitioner would do, automatically.

The two halves were once treated as separate tiers, and the cost of separating them
was a structural ambiguity: it suggested the spec could exist as a guarantee without
the harness, or that the harness was a peer to the spec rather than the mechanism
that closes the spec's derivation loop. Neither is true. The spec authors; the
dev-time harness verifies; both halves run in one cycle.

**What makes both removals possible:** A specification precise enough — architectural
constitution, structural files, behavioral contracts, quality gates — that a
stateless reader carrying no prior context can derive any valid implementation state
from the artifact set alone, *and* a dev-time harness that compiles every behavioral
contract in the spec into a running validation against the live application. The
test: apply the derivability gate. If you would need to narrate something that isn't
in the artifacts, the spec half is incomplete. If a behavioral contract has no
corresponding executable check, the harness half is incomplete.

The harness drives the application through each use case, observes what actually
happens at every boundary (UI, service, database, API), and compares observed
behavior against the postconditions declared in the spec. If the comparison fails,
the specification is tightened and the derivation runs again. The test cases are
not written by hand — they are derived from T1 contracts. The tools are existing
(Playwright, Cypress, Supertest, k6, visual regression runners) — GS adds
spec-derivation, not new tooling. This is the industry concept of **executable
specification** or **living documentation**: the spec generates its own verification.

**A note on terminology:** What Gabriel and the industry sometimes call "Harness
Engineering" — the AI behavioral guardrails, CLAUDE.md rules, prompt constraints
that keep the AI on track — is the *authoring half* of T1. It specifies how the AI
should behave. The dev-time harness is T1's *verification half*: it certifies the
live system did what the spec said. Both halves are T1.

**What the practitioner does instead:** Writes and maintains the specification.
Reviews whether the spec is complete, not whether the code is correct. Confirms the
harness certifies the derivation. If a gate fails, the response is to tighten the
specification — not to patch the code. The work moves upstream: architectural
decision-making, domain modeling, behavioral contract authoring.

**What breaks before it works:** An underspecified intent. The AI cannot fix a vague
scope. Specification gaps propagate into every derived artifact. The most common
failure: the practitioner writes a specification that sounds complete but is
actually a collection of categories without sufficient constraint — "handle errors
appropriately" instead of a named exception hierarchy with required fields. The
second most common failure is on the verification side: test suites that cover
execution but not behavior. An AI-generated test suite is at risk of this
structural failure — tests written by a system that knows the correct implementation
may be written to pass it rather than to catch violations. Mutation testing closes
this gap. Without it, 80% line coverage can coexist with 0% behavioral verification.

**Proof status:** Demonstrated in production. JC built CodeSeeker — a multi-language
code intelligence system with four retrieval layers, graph traversal, and coding
standards detection — without writing a line of application code. DX1 study (58
developers, April 2026) confirmed that developers with a GS introduction achieved
75% perfect implementations in a single session. ALX self-applicability experiment:
the Loom compiler was derived entirely from its own formal specification
(`spec/loom.loom`), with 386/386 acceptance tests passing (S_realized = 1.0) — the
highest-tier T1 proof produced to date. The 386-test harness certified the
formally-specified system at S_realized = 1.0 — every test derived from T1
contracts, not written by hand.

**The MVC harness walkthrough.** For a typical layered system (UI / Service / DB),
the dev-time harness follows this sequence for each use case under test:

1. **Pre-execution state capture.** Run a defined set of queries against the database and
   record the state before any action. These are not assertions yet — they are the baseline.
2. **Playwright executes the use case.** The E2E test drives the UI through the complete
   user journey: inputs, interactions, transitions.
3. **Service layer log check.** After the action, inspect the service layer logs for the
   expected entries — the correct method called, the correct parameters, the correct sequence.
   This verifies that the UI correctly invoked the service layer and that the service layer
   processed correctly, without reading the service layer code.
4. **DB state diff.** Run the same pre-execution queries again and compare. The diff between
   pre and post state is the assertion: exactly these records were created/modified/deleted.
   A state diff that does not match the use case postcondition is a harness failure, not a
   code review item.
5. **UI confirmation.** Return to the UI to verify the transition happened — the screen
   shows what the use case says it should show after successful completion.
6. **Optionally: service layer check again.** For complex flows, verify the service layer
   state a second time to confirm no unexpected side effects.

For systems that expose API endpoints separately (REST, GraphQL): test these independently
with curl, Postman, or a dedicated API test suite. These are not redundant — they verify
the service contract independently of the UI path, and they are often the integration
point other systems hit in production.

**One trigger, inspected at every boundary it crosses.** The harness makes code review
structurally unnecessary: if every boundary is verified after every action, there is no
behavior the practitioner needs to read the code to confirm.

---

### T2 — Staging / Pre-prod: you stop touching deployment, and you stop manually validating the staged system

**Authoring obligation removed:** Manual infrastructure management — provisioning,
configuration, deployment, environment setup. The practitioner never issues a CLI
command or edits an infrastructure file. A CLI command issued by a human is a
specification gap.

**Verification obligation removed:** Manually walking through the staged build to
confirm it works. The staging-stage harness extends the harness pattern from T1
into the deployed environment: NFR contracts (latency, throughput, memory, security)
become executable thresholds; integration smoke tests fire against the real
environment with real services; gateway, load, and security tests execute
automatically before any promotion to production.

**What makes both removals possible:** The same specification that governs code
governs infrastructure. The specification states desired resource topology, IAM
boundaries, encryption policy, ingress/egress rules, monitoring requirements, cost
tagging — and the NFRs from T1 expressed as executable gate conditions. With these
stated, the AI issues every command at the CLI without returning to the engineer
between commands, and the staging harness certifies the staged environment satisfies
every NFR contract.

**What the practitioner does instead:** States the desired infrastructure environment
and the NFRs in the specification. Reviews the resulting environment against the
specification's acceptance criteria — but the review is gate output, not a manual
walkthrough.

**The staging harness extends T1 into NFR territory.** Where T1's harness verifies
behavioral correctness — does the system do what the use cases say? — T2's harness
introduces a second category of tests: environment-specific,
non-functional-requirement-driven verification. These are not new tests bolted on at
deployment; they are the NFRs from T1 expressed as executable gate conditions:

- **Security harness:** DAST scan, dependency vulnerability audit (`npm audit --audit-level=critical`),
  OWASP ZAP or equivalent. For systems handling authentication, payments, or PII, penetration
  testing is not optional.
- **Load harness:** Target concurrent user population + target throughput (req/sec) + p99
  latency ceiling. A "load test" without stated acceptance criteria is a manual observation,
  not a gate.
- **Stress harness:** Push beyond the load target until failure, document the failure mode
  and recovery procedure. The failure mode is the deliverable.
- **Speed harness:** p50/p95/p99 latency assertions against the specification's latency budget.
- **Any other NFR** stated in the specification: data retention, availability SLA,
  compliance policy (HIPAA, PCI-DSS, SOC 2) — each becomes a gate at T2.

**What breaks before it works:** Incomplete NFRs at T1. T2 failures almost always
trace to T1 gaps: an NFR not stated, a data flow label missing, a compliance
constraint left implicit. The AI cannot govern what it was not told about.
Infrastructure gaps are not infrastructure problems — they are specification problems.

**Proof status:** Demonstrated in active development on COMPASS (multi-tier regulated
data platform, in progress). `[EXPAND when COMPASS reaches stable milestone]`

---

### T3 — Production: you stop monitoring, and you stop diagnosing bugs

**Authoring obligation removed:** Diagnosing bugs, interpreting runtime signals,
triaging production incidents.

**Verification obligation removed:** Watching dashboards. The production-stage
harness — drift detection, runtime contract verification, automatic anomaly
detection — runs continuously against the same formal properties that governed
construction. Drift from specification is a specification violation, detectable
and correctable by the same mechanism that built the system.

**What makes both removals possible:** Runtime signals are evaluated against the
same formal properties that governed construction. The monitoring layer (The Eye)
watches; the system corrects. The diagnostic agent does not produce a code patch —
it produces a specification-level diagnosis that the practitioner ratifies.

**What the practitioner does instead:** Reviews whether the specification's
observability requirements — alert thresholds, SLO definitions, correlation ID
schema, PII redaction policy — are correctly stated. The AI monitors against these
automatically.

**The T3 → T1 feedback loop.** T3 is not a terminal tier — it feeds back. The concrete cycle:

1. **Log aggregator reads important exceptions.** A log parser or aggregator (Splunk,
   Datadog, CloudWatch, or equivalent) monitors structured logs for exception patterns
   defined in the monitoring specification. "Important" is defined in the specification —
   not all exceptions, not error volume, but the specific exception classes that signal
   specification drift.
2. **The diagnostic agent evaluates the signal.** The exception is evaluated against the
   formal properties that governed construction. Is this a known failure mode specified
   in the behavioral contracts? An undocumented edge case? A violation of an invariant
   the specification declared?
3. **Signal routed back to T1.** The diagnostic agent produces a specification-level
   diagnosis, not a code patch. "The retry logic for the payment gateway does not handle
   rate limit responses — the use case postcondition for failed payments needs to include
   this case." The specification is updated.
4. **AI regenerates and redeploys.** With the updated specification, T1 derives the fix,
   T2 deploys it. The practitioner does not write the patch; they approve the
   specification update.

The loop is: production signal → specification diagnosis → specification update → rederivation
→ verified deployment. The AI is the executor at every step; the specification is the
authority at every step.

**What breaks before it works:** A monitoring specification that is too vague to be
actionable. Alert thresholds stated as "when errors are high" instead of "when the
5-minute error rate exceeds 0.5%." The diagnostic agent cannot act on ambiguous criteria
any more than it can derive correct code from ambiguous behavioral contracts.

**Proof status:** In active development on COMPASS with The Eye diagnostic agent.
`[EXPAND when COMPASS T3 milestone completes]`

**T3 architecture: three components, one loop.**

T3 is a runtime construct that lives in the production environment and communicates back
to the development environment via Chronicle. It is not part of the development toolchain
— it runs alongside the production system and writes what it observes into the shared
memory layer the AI reads at the start of every development session.

The three components:

**1. `monitoring-spec.md` — the production contract.** Generated by `forgecraft setup_monitoring`
from the NFR section of the project specification. It contains: exception classes that signal
specification drift, alert thresholds stated with exact numeric criteria, SLO definitions in
PromQL or equivalent query language, correlation ID schema, PII redaction policy, and the
mapping from each exception class to the specification property it violates. This document is
what `forgecraft-eye` evaluates runtime signals against. Without it, T3 is not possible — a
diagnostic agent without a formal contract produces noise, not signal.

**2. `forgecraft-eye` — the runtime diagnostic agent.** A serverless function (Lambda or
equivalent) deployed alongside the production system. It subscribes to the log aggregator
(Splunk, CloudWatch, Datadog) for the exception classes listed in `monitoring-spec.md`. When
an exception fires, it evaluates the signal against the contract: is this a known failure mode
already covered in the behavioral contracts? An undocumented edge case? A specification
invariant violation? It produces a structured diagnosis — not a code patch — and writes it to
Chronicle as an `architectural` memory entry tagged `t4-signal`.[^t4-prefix]

[^t4-prefix]: The literal tag string `t4-signal` and the CLI command `check_t4` retain their original "t4" prefix from the legacy seven-tier numbering (where Production was T4). The conceptual tier in this book is T3 (Production), but the operational artifact names will not change until a code-change session renames the commands, tag strings, and `t4-signals.json` filename coherently. Read every `t4-...` token in this section as referring to the T3 (Production) tier.

**3. Chronicle as the bridge.** The key architectural decision: T3 does not write to a
separate monitoring dashboard or ticket system. It writes to the same memory layer the AI
reads at the start of every T1 development session. The entry:

```
memory_type: architectural
tags: [t4-signal, <project-name>]
confirmed: true
content: "Payment gateway retry logic does not handle HTTP 429 rate limit responses.
  Exception class: PaymentRetryExhausted. Violates postcondition: 'failed payment
  must enter retry queue with exponential backoff.' NFR-14. Suggested spec update:
  add rate-limit branch to retry use case."
```

Because `architectural` + `confirmed: true` entries never decay and start in Chronicle's
Core tier, they persist until the development session explicitly resolves them. The AI
reads them at session start and surfaces them as specification update candidates before
any code is written.

**4. `forgecraft check_t4` — the development-side intake.** Run at the start of a
development session (or triggered by the session prompt). Queries Chronicle for
`t4-signal` entries on the current project. For each entry, it proposes a specification
update: the use case postcondition to modify, the NFR contract to extend, the invariant
to add. The practitioner approves the update, the specification changes, and T1 derives
the fix from the updated specification. The entry is then marked resolved.

**The complete T3 loop:**

```
Production exception fires
  → forgecraft-eye evaluates against monitoring-spec.md
  → writes architectural Chronicle entry (t4-signal — legacy operational name; conceptually T3)
  → next T1 session: forgecraft check_t4 surfaces pending signals
  → practitioner approves spec update
  → AI derives fix from updated specification
  → T2 deploys
  → forgecraft-eye monitors the deployment
```

The practitioner never reads the exception log. They read the specification diagnosis.

**Proof status:** In active development on COMPASS with The Eye diagnostic agent.
`[EXPAND when COMPASS T3 milestone completes]`

---

### Human in the loop — a configurable choice, not a fixed position

At every tier, a human can be in or out of the approval gate. This is a project-level
decision, not a methodology constraint.

**In the loop:** The practitioner reviews the AI's output before it is accepted — the
specification update, the generated code, the infrastructure change, the fix. This is the
appropriate posture for: regulated systems, high-stakes production environments, early
stages of a new project where the specification is not yet fully calibrated.

**Out of the loop:** The harness is the only gate. If the output passes all behavioral
contracts, mutation gates, security checks, and NFR gates, it is accepted and deployed
without human review. This is the appropriate posture for: well-specified systems with
proven harnesses, lower-stakes domains, T4 environments where the system governs its own
evolution.

The decision of where to place the human is itself a specification decision. It should be
stated explicitly in the architectural constitution: "human approval required before
deployment" or "harness-verified output is accepted automatically." Default to human-in-the-loop
until the harness has been adversarially validated and the specification has been through
at least one full fix cycle.

---

### The judgment layer — what the discipline does not remove

The cascade removes obligations the practitioner previously executed: writing and
reviewing code (T1), managing and validating staged infrastructure (T2), diagnosing
production (T3), maintaining the system over time (T4). What it does not remove —
and does not claim to remove — is the work that depends irreducibly on human
judgment. This is the **judgment layer**, and naming it explicitly matters because
practitioners under GS report it as the single most disorienting part of the
experience.

**What lives in the judgment layer:**

- **Domain expert validation.** Does the AI's interpretation of finance, law, medicine,
  game design, music, regulatory compliance, or any other specialized field match what a
  real domain expert would do? The AI knows the literature. It does not know the lived
  practice of a senior practitioner in the field.
- **Edge-case discovery from lived experience.** The practitioner's daughter does
  something to a doll that the AI did not predict. The user clicks the button in an order
  no spec author imagined. The market behaves in a way the historical data does not show.
  These cases are surfaced by humans encountering the system in context.
- **Aesthetic and quality judgment.** Is this UI good? Does this story land emotionally?
  Is this music right? The judgment of qualitative excellence is not a measurement; it is
  a perception, and the practitioner who built it owns it.
- **Strategic and business judgment.** Should this feature exist at all? Does this
  product solve a problem the customer actually has? Is the price right? These are not
  questions a specification can answer; they are questions the specification serves.
- **Compliance and legal sign-off.** A regulator, an auditor, a lawyer reads the artifact
  and signs. The AI cannot replace them — not because it lacks the knowledge but because
  the social and legal weight of the sign-off is constitutive of the act.
- **Real user research.** Real humans interacting with the actual product, in their
  actual context, on their actual hardware. Synthetic users are not users. Usability
  studies, A/B tests, longitudinal observation — these run at human pace because the
  signal is generated by humans.
- **Performance tuning at production scale.** Often requires real workload, real
  network, real concurrent users. Synthetic load is a starting point, not a substitute
  for what production reveals.

**Why the judgment layer is not a tier.** Tiers in the GS cascade are layers of tooling:
each tier removes a category of mechanical work by introducing a class of derived artifact
or automated check. The judgment layer is not mechanical work. It is what remains when
mechanical work is removed. Treating it as a tier would imply it can be automated away by
the next layer of tooling, which is not the claim. Some of it can be assisted by AI (a
multimodal model can pre-screen UI candidates, a domain-fine-tuned model can flag
likely-incorrect medical interpretations for a clinician's review), but the act of judgment
itself remains with the human who carries the accountability.

**The perception problem.** Practitioners under GS report that the judgment layer feels
glacial by comparison to the AI-paced work that precedes it. This is a contrast effect, not
a methodological problem. Ninety percent of the work that previously consumed weeks now
resolves in hours; the ten percent that has always required judgment now occupies
proportionally more of the practitioner's attention. The work has not gotten harder. The
adjacent work has gotten dramatically faster, which makes the judgment work feel slow.

The correct response is expectation-setting upfront: *"You will do 90% of the work in 1/20
the time, then spend most of your remaining attention on the 10% the discipline cannot
compress."* Practitioners who go in with this framing do not experience the judgment layer
as a failure of the methodology. Practitioners who do not are at risk of concluding that
GS broke at the last step, when in fact the last step is the only one that was ever the
practitioner's alone.

**Capacity implications.** A practitioner with a single project absorbs the judgment layer
naturally. A practitioner with twenty projects faces a capacity problem: each project
demands its own judgment layer, and judgment does not parallelize the way mechanical work
does. The honest options are:

1. **Triage.** Not all projects deserve full judgment-layer investment. Exploratory work
   may ship at 80% quality forever; commercial work earns judgment proportional to revenue
   stakes; personal craft warrants the practitioner's own time.
2. **Specialist engagement.** Hire judgment-layer specialists per domain — a music
   producer for the music project, a TTRPG editor for the rules manual, a copy editor
   for literature, a usability researcher for the SaaS — for finite, scoped engagements at
   the end of each project's AI-paced phase.
3. **Judgment-layer playbook.** A repeatable checklist per project type. For a SaaS:
   X usability tests with Y users, Z compliance reviewers. For a TTRPG: three playtests
   with a rules editor. For music: one mastering pass. The discipline of judgment work,
   like the discipline of code, can itself be specified.
4. **Sequencing.** Stagger projects so judgment work does not all land in the same week.

**The honesty signal.** GS does not claim to replace human judgment. It claims to ensure
everything before the judgment layer is correct, so that judgment is spent only on what
it alone can decide. This is the strongest possible position both philosophically and
commercially: practitioners trust a methodology that names what it cannot do.

---

### T4 — Evolution: the system maintains and extends itself

**Authoring obligation removed:** Manually maintaining or extending the living system —
applying changes, deploying them, retiring components that no longer serve.

**Verification obligation removed:** Vetting candidate mutations by hand. The
evolution-stage harness — the governed mutation gauntlet — admits only mutations
that pass the harness chain at every prior tier.

**What makes both removals possible:** A GS-governed system already has, as a side
effect of correct practice, the structural properties that biological organisms use
for self-maintenance: operational closure, error correction before propagation,
immune memory, adaptive response within governed constraints. Close the remaining
gap and the system can govern its own mutation — applying changes, verifying them
against the telos, committing them if they pass, discarding them if they do not.

**What the practitioner does instead:** Defines the telos (the formal statement of what the
system exists to do, precise enough to govern every decision in its construction and evolution).
The system evolves within the constraints of that telos.

**What breaks before it works:** A telos that is too vague to evaluate against. "Provide
fast and reliable search" is not a telos. A complete telos names the formal properties that
must hold, the constraints that must not be violated, and the fitness function against which
mutations are evaluated.

**Proof status:** Demonstrated in the Loom research project. A Loom colony with
governed genome mutation is running, with auto-applied mutations committed under the
`[GS T4]` tag in the public repository ([github.com/jghiringhelli/loom](https://github.com/jghiringhelli/loom)).
Self-modification within a formal specification has been achieved at the language
level.

---

### T5 — Synthesis: you stop designing the system architecture [RESEARCH FRONTIER]

**Authoring obligation removed:** System architecture and design. The practitioner
states a problem; a colony of self-governing programs derives itself from that
statement — each with its own telos, interacting through typed channels, expiring
when their purpose is fulfilled.

**Verification obligation removed:** Reviewing the colony as a whole. The
colony-level harness is each entity's own T1–T4 harness chain applied to itself,
with cross-entity contracts enforced at the typed channels: the system as a whole
admits only configurations where every member can certify its own derivation.

**What makes both removals possible:** Axon / Conclave — the designed (not yet
empirically demonstrated) architecture in which a stateless reader derives what
programs need to exist, what each is for, how they should interact, and when each
should die. Programs are instantiated, evolve individually and in relationship to
each other, and are extinguished when their telos is fulfilled.

**What the practitioner does instead:** Holds only the problem statement — the pure
intent. The architect's role dissolves into the problem-holder's role.

**Proof status:** Architecturally specified. Not yet empirically demonstrated. The
Loom colony simulation is the first embryonic demonstration of multiple interacting
entities with individual lifecycles serving a collective telos. T5 is presented
honestly here as a forward statement of where the formal tradition points, not a
near-term availability claim.

**Important framing note:** Never present T5 as available or near-term. The book should
explain what would need to be true for T5 to work, why the formal tradition predicts it
is possible, and what the honest evidence status is.

---

### T6 — Meta-telos: you stop initiating the process [RESEARCH AGENDA]

**Authoring obligation removed:** Even initiating the process. A system that has
accumulated enough formal history of the practitioner's work infers what is needed
before it is asked.

**Verification obligation removed:** None — the verification at T6 is the
practitioner's own ratification. Observation surfaced as a candidate intent must be
accepted before any action is taken.

**What makes it possible:** This is stated as a research agenda, not an
implementation claim. A system observing the practitioner infers intent from a
modeled practitioner — not from a stated problem, but from accumulated formal
history of the practitioner's decisions, corrections, and preferences.

**Proof status:** Not demonstrated. Not designed. T6 is the logical terminus of the
cascade — named here because the intellectual architecture requires it, and because
governance must precede capability at this level.

**Governance note (critical):** What T6 requires is not more formal theory. It is a
careful answer to who decides what the practitioner needs before any autonomous
inference becomes action. A system that models the practitioner well enough to
infer intent without being asked has a model of the practitioner. What that system
is permitted to do with that model is a governance question that must be answered
before the capability is built. The book should be explicit about this. The science
fiction writers of the mid-twentieth century expressed in literature what they
could not yet express in formalism. We can now express in formalism what they
could only express in literature.

---

## 5. THE SEVEN GS PROPERTIES

These are the seven properties every GS-governed system must satisfy. ForgeCraft scores
systems against them — zero, one, or two points per property, fourteen points total,
adoption threshold eleven of fourteen. The structure of this chapter is deliberate. Each
property is presented failure-mode-first, because that is how a practitioner encounters
them: not as an abstract ideal to aspire to, but as the specific way an AI agent goes
wrong when the property is missing. The score progression is calibration-anchored: a
zero, a one, and a two each describe a recognisable state of a real project, drawn from
SafetyCorePro (greenfield, GS from day one), COMPASS (in active production migration),
and CPQ Front (a four-year-old codebase that adopted GS incrementally over eleven
sessions).

A property at zero is a project where the failure mode is happening unnoticed. A property
at one is a project where the failure mode has been recognised but the structural
defence is partial. A property at two is a project where the failure mode has been
made architecturally unreachable. The score is not a grade; it is a diagnostic.

---

### Self-Describing

**Failure mode prevented.** The agent enters the project cold and does not know what it
is, what state it is in, or what rules apply. It spends the first ten minutes of the
session rediscovering basics that the previous session also rediscovered. It makes
changes that contradict in-progress work because nothing told it that work existed. Two
sessions converging on the same problem produce incompatible answers because each
inferred the project's identity from a different subset of files.

**What it means.** The project explains itself. Any new agent — human or AI — can
understand what the system is for, how it is structured, and what is happening right
now without talking to anyone who has worked on it before. The artifacts carry the
identity that was previously transmitted through conversation, Slack channels, and
the institutional memory of senior engineers.

**Artifacts.**
- `CLAUDE.md` (or its agent-specific equivalent) — the architectural constitution, loaded
  automatically at session start. Contains: project identity, package map, naming
  conventions, dependency governance, known pitfalls, corrections log, skills index, ADR
  index. Hard line cap: ~300 lines, because the agent reads it on every turn and
  middle-of-context degradation eats anything past the leading position.
- `Status.md` — what was completed last session, what is in progress, what is next,
  decisions made, active branches, blockers. Updated at session open and close.
- `docs/ARCHITECTURE.md` — the system map: component topology, data flows, package
  boundaries.

**What makes it work, and what breaks it.** These artifacts have value only if they are
current. A `Status.md` three sessions stale is worse than no `Status.md` — it
confidently delivers wrong context. The rule "Read `Status.md` at the start of every
session" in `CLAUDE.md` is the enforcement mechanism, but it is a convention, not an
automatic barrier. What sustains the property in practice is the discipline of closing
each session with a Status update before the push. Self-Describing fails not from
absence but from rot.

**Score progression.**
- **0** — No `CLAUDE.md`, no `Status.md`, no architecture document. The AI infers
  structure from code on every session, repeatedly producing different inferences. New
  contributors onboard by interrogating teammates. *A four-year-old SaaS service whose
  `README.md` says "Tech Stack: Node, Postgres" and nothing else.*
- **1** — A `CLAUDE.md` exists but is stale, or covers some of the five categories
  (architectural identity, standards, constraints, tool sequencing, routing) but not
  others. Or all three artifacts exist but `Status.md` is updated weekly rather than
  per-session. *COMPASS at week four — the constitution covers the data layer well but
  says nothing about the compliance-gate sequencing across tiers.*
- **2** — All three artifacts present, current within the last working day, covering
  the five categories the sentinel navigational tree requires. *SafetyCorePro at v1.0
  — the constitution loaded each session is exhaustive. CPQ Front at 2/2 after eleven
  sessions of brownfield migration, where `Status.md` is updated as the last act of
  every session and a corrections log captures the previous session's mistakes.*

**What raises the score.** Generate `CLAUDE.md` with ForgeCraft's `setup_project` (it
covers the five categories by construction). Add the "read `Status.md` at session start"
rule to the constitution. Configure a post-commit hook that nudges Status.md updates.
Run `forgecraft audit_project` quarterly to detect staleness drift before it becomes
load-bearing.

---

### Bounded

**Failure mode prevented.** The agent interprets a vague request too broadly or too
narrowly. "Fix the display" becomes a refactor of the rendering pipeline. "Improve
generation" turns into thirteen unrelated changes nobody asked for. Or, in the inverse
failure: the agent stays so close to the literal text of the prompt that it produces a
patch which works for the example but breaks the use case the example was drawn from.

**What it means.** Every unit of work has explicit scope and seams. Functions do one
thing. Modules own one concern. Sessions know what is in scope, what is explicitly out,
and what the expected behaviour should be. Architectural boundaries — no DB calls from
route handlers, no business logic in adapters, no React imports in the domain core —
are stated as prohibitions, not guidelines.

**Artifacts.**
- `docs/specs/<system>.md` — the functional specification. The source of truth for "is
  this a bug or expected behaviour?" When the agent sees a computed field returning
  zero, it reads the spec to know whether that is correct. Without the spec, it guesses.
- `DEVELOPMENT_PROMPTS.md` — bound prompts (`DP-013`: "fix frozen slot objects in
  HYDRATE_STATE — acceptance: dispatch with `Object.freeze`'d slots must not throw"). Each
  one carries: objective, acceptance criteria, files probably involved, and what is
  explicitly out of scope.
- The sentinel navigational tree — child specs the agent descends only when relevant.
  Loading the full spec into a single context is itself a Bounded violation: it forces
  the agent to operate against context it does not need.

**What makes it work, and what breaks it.** The spec must be a living document. When
CPQ Front added a `month` field type, the spec entry came in the same commit as the
code. If it had not, a future session might have deleted `month` as "not supported."
The property breaks when developers treat the spec as documentation rather than
contract — updates happen "later" and "later" never arrives. Bounded works only when
the spec touch is part of the same commit as the behaviour change.

**Score progression.**
- **0** — No spec, or specs that say "the system handles X cases appropriately."
  Sessions invent scope. Pull requests sprawl across unrelated concerns. *A five-year-old
  startup whose only documents are tickets and Slack threads.*
- **1** — Spec exists for the core domain but bound prompts are absent or used
  inconsistently. The agent knows what the system *is* but not what the *current task*
  is. *COMPASS at week six — the data model is fully specified but feature work is still
  requested as free-form prose.*
- **2** — Spec covers behaviour; bound prompts are the request format; "NOT IN SCOPE"
  is mandatory in every prompt; the sentinel tree limits each session's context to what
  the task needs. *SafetyCorePro from day one (greenfield, never accepted free-form
  prompts). CPQ Front at 2/2 after introducing the DP-007 to DP-014 series.*

**What raises the score.** Adopt the bound prompt template. Move free-form requests
through it — the practitioner writes the DP entry before opening Claude. Add a CI
check that flags PRs whose diff exceeds the bound prompt's stated file list by more
than one file without an explicit override note. Split the sentinel tree once any
single spec file exceeds 300 lines.

---

### Verifiable

**Failure mode prevented.** The agent writes code that looks correct but breaks
something else. "It compiles" passes for verification. The agent says the fix works,
but no test proves it. Or, more insidiously: tests exist, but they are tests of
execution rather than behaviour — they run the right code and assert nothing
meaningful, so they pass against any plausible implementation including the wrong one.
An AI-generated suite at 80% line coverage and 0% mutation score is the canonical
signature of this failure.

**What it means.** Every claim about the code can be verified mechanically. Tests
exist, coverage thresholds enforce them, mutation testing validates that the tests
actually catch bugs, and the agent runs the suite before declaring done.

**Artifacts.**
- Coverage thresholds in `vitest.config.ts` / `jest.config.ts` / `pyproject.toml` — the
  floor can only rise, never fall. Adding tests raises the floor.
- Mutation testing configuration (Stryker for JS, mutmut for Python, PIT for Java).
  Mutation score answers the harder question: do the tests actually catch bugs? Line
  coverage measures what was executed; mutation score measures what was caught.
- Behavioral test files derived from use cases. The DP-013 test in CPQ Front
  (`hydrate-state-sync.node.test.js`) freezes every slot and node, dispatches
  `hydrateState`, and verifies no crash plus valid state. It catches that regression
  for life.
- A pre-commit hook that runs the fast suite — not a token sample.

**What makes it work, and what breaks it.** Verifiable breaks when the test suite is
written by the same agent that wrote the code, with no mutation gate. The agent will
write tests that pass against its own implementation rather than tests that catch
violations. Mutation testing is the structural defence: a 0% mutation score reveals
that 80% line coverage was theatre. The other failure mode is a pre-commit hook
that runs `test:core` (one test) rather than `test:fast` (the fifty-one that would
catch the regression you are about to commit).

**Score progression.**
- **0** — No coverage thresholds, no mutation testing, no behavioural tests. The agent
  declares completion based on "it compiled." *A brownfield prototype where the only
  assertion is whether `npm run dev` starts.*
- **1** — Coverage exists with thresholds; tests are run on commit; mutation testing is
  absent; behavioural tests cover the happy path but edge cases are inferred at
  integration time. *CPQ Front at 1/2 — coverage gates are in place but pre-commit
  only runs `test:core`; there is no mutation testing yet (DP-007 deferred); E2E tests
  are still manual in Chrome DevTools.*
- **2** — Mutation score thresholds met (≥65% overall, ≥70% on new or changed code);
  pre-commit runs the full fast suite; behavioural tests are derived from use cases; at
  least one E2E test gates CI. *SafetyCorePro at v1.0 — mutation score 72%, every use
  case generates an acceptance test, the Playwright suite is the merge gate.*

**What raises the score.** Promote pre-commit from `test:core` to `test:fast`. Add
Stryker or equivalent. Raise coverage thresholds incrementally each session — the
ratchet only goes up. Generate at least one E2E test per use case, not per release.

---

### Defended

**Failure mode prevented.** The agent — or a human — commits code that breaks the
build, introduces lint violations, or skips tests. The "I will fix it later" pattern
where debt accumulates silently. Pre-commit hooks that exist as files but never block.
Branch protection that is advisory. Architectural prohibitions stated in the
constitution that nothing actually enforces — so the constitution says "no React in
the domain core" while the domain core imports React in fifteen places.

**What it means.** Automatic barriers prevent bad code from entering the codebase.
Commits that fail the gates are rejected. Merges without green CI are blocked.
Architectural prohibitions are mechanically enforced — not left to model discretion.
Destructive operations are structurally prevented rather than merely discouraged.

**Artifacts.**
- `.husky/pre-commit` — runs `lint-staged` (ESLint `--fix` on staged files) plus the
  test gate. If either fails, the commit is rejected.
- ESLint flat config (`eslint.config.js`) — the project's rules, with warnings
  promoted to errors in batches as cleanup completes.
- `.github/workflows/test.yml` — install, build, lint, full test suite, coverage
  report. The coverage step is blocking, not informational. PRs cannot merge without
  green CI.
- Branch protection on `main`: PR required, status checks required, no force pushes,
  no deletions. The setting that prevents an AI from routing around the human review
  gate.

**What makes it work, and what breaks it.** Defended works because the layers
compose. Pre-commit catches problems in seconds, locally, before they enter history.
CI catches what pre-commit may miss (full suite, different environment). ESLint catches
patterns (no-unused-vars, no-undef) that tests do not cover. Branch protection
prevents anyone — AI or human — from bypassing the gates. Defended breaks when one
layer is bypassed routinely; a team that uses `--no-verify` weekly has lost the
property regardless of how strict the configuration is.

**Score progression.**
- **0** — No pre-commit, no CI gates, or gates exist as files but are routinely
  overridden. *A small repo where `--no-verify` is the team's normal commit path.*
- **1** — Pre-commit and CI exist but enforcement is partial: pre-commit runs a
  token sample, CI is informational, branch protection is opt-in. *COMPASS at week
  three, before the team turned on required status checks on `main`.*
- **2** — All three layers active and load-bearing: pre-commit runs the fast suite,
  CI is blocking, branch protection rejects merges that lack green checks; `--no-verify`
  triggers a changelog entry that surfaces in the next audit. *CPQ Front at 2/2 — the
  husky chain is the team's first line, the GitHub Actions workflow is the second,
  branch protection is the third.*

**What raises the score.** Turn on required status checks in branch protection. Move
the pre-commit hook from `test:core` to `test:fast`. Adopt the cookbook hook chain —
`pre-commit-secrets`, `pre-commit-no-temp-files`, `pre-commit-prod-quality`. Promote
ESLint warnings to errors in batches each session.

---

### Auditable

**Failure mode prevented.** "Why is it built like this?" has no answer. A future
session reverts a deliberate decision because nothing recorded why it was made. The
same mistake is committed twice because the first occurrence was not logged. The agent
treats every architectural choice as up for renegotiation because nothing said it was
settled. A practitioner who joins the project in month eighteen has to interview five
people to reconstruct decisions made in month two.

**What it means.** Every significant decision has a written record with context. Every
recurring AI mistake is captured so future sessions do not repeat it. The current state
of the system, and the history of how it arrived there, is fully recoverable from the
artifacts alone.

**Artifacts.**
- ADRs (`docs/adrs/active/ADR-*.md`) — Architecture Decision Records. Each captures
  decision (one sentence), context (alternatives considered and why rejected), and
  consequences. Once accepted, never edited; superseded by a new record.
- Corrections log (in `CLAUDE.md`) — one-line entries capturing AI mistakes and the
  correct pattern. Cheaper than an ADR; for implementation errors rather than
  architectural choices. *"[2026-05-07] Display.jsx routed all select fields to XSelect
  (radio) regardless of option count. Fields with 4+ options should use XComboBox."*
- Conventional commits as a typed corpus of change. `git log --grep='feat(billing)'`
  produces the audit trail of how the billing module evolved.

**What makes it work, and what breaks it.** ADRs and corrections work as a pair. ADRs
cover architectural decisions — large, infrequent, hard to reverse. Corrections cover
implementation errors — small, frequent, easy to commit again. Together they form a
complete audit trail of "why is it this way?" (ADRs) and "what went wrong before?"
(corrections). The property breaks when ADRs are written reluctantly ("this seemed
obvious at the time"), or when the corrections log is treated as an apology log rather
than an instruction set for the next session.

**Score progression.**
- **0** — No ADRs, no corrections log, no conventional commits. Decisions live in
  Slack threads or in the heads of three people. *A four-year-old SaaS where every
  "why is it like this?" question requires interrupting a senior engineer.*
- **1** — ADRs exist for big decisions but the corrections log is missing, or vice
  versa. Conventional commits are sporadic. *SafetyCorePro at week two — eight ADRs
  from the design phase, but no corrections log because no AI mistake has been logged
  yet (this changes by week four).*
- **2** — ADRs cover architectural decisions; corrections log captures recurring AI
  mistakes; conventional commits are enforced by hook; ADR-to-commit linking via
  `Refs:` footers. *CPQ Front at 2/2 — eight ADRs (some retroactive, written when
  investigation revealed the original justification was real but undocumented), a
  corrections log with two entries from the past week, every commit typed.*

**What raises the score.** Adopt the ADR template. Write the first ADRs retroactively
for decisions you discover were intentional but undocumented. Add a corrections-log
section to `CLAUDE.md` with one entry as seed. Promote `commit-msg` enforcement of
conventional commits.

---

### Composable

**Failure mode prevented.** The agent needs to work on the schema layer but has to
load the entire project context (100K+ tokens) to do it. Knowledge about formulas is
scattered across ten files and the agent misses half. Modules that should have been
independent are coupled because boundaries were implicit and the agent crossed them
freely. A change to one module requires changes in three unrelated modules. The "lost
in the middle" effect (Liu et al., 2023) silently degrades quality on every session
that loads more context than the task requires.

**What it means.** Knowledge is modular. The agent loads only what it needs for the
task, and each module is self-contained. Architectural layers — service, repository,
domain — have explicit boundaries that may not cross.

**Artifacts.**
- Skills (`.claude/skills/<skill>.md`) — focused knowledge modules. CPQ Front has
  twenty-six: `/schema-ir`, `/formula-dsl`, `/transitions`, `/validate-doc`,
  `/create-document`. Loaded on demand. Working on formulas? Load `/formula-dsl`.
  Debugging the LLM agent? Load `/llm-agent`. The agent does not pay for context it
  does not need.
- Spec sections as composable units: section 3.7 covers document creation; section 2
  covers core entities. The agent reads the relevant section, not the whole spec.
- Architectural layer boundaries enforced through dependency direction: the domain
  layer cannot import the infrastructure layer. ADR-001 names the rule; lint or
  import-cycle detection enforces it.

**What makes it work, and what breaks it.** Composability works because LLMs have
finite context windows. A project where every session loads 80K tokens of spec
produces worse code than one that loads 8K tokens of *the right* spec. Composability
breaks when skills accumulate without taxonomy (forty skills, no router) or when
layer boundaries are stated in prose but not enforced (no lint rule for "no React
imports in `packages/core`"). Without enforcement, prose is aspirational.

**Score progression.**
- **0** — Monolithic spec, no skills, no enforced layer boundaries. Every session pays
  for the full context whether it is relevant or not. *A startup whose spec is a single
  4,000-line `SPEC.md`.*
- **1** — Skills exist but are unevenly developed; layer boundaries are stated in the
  constitution but not enforced. *COMPASS at week five — six skills covering the data
  layer, but no skill yet for the compliance gates; layer boundaries are documented but
  no `import/no-restricted-paths` rule is configured.*
- **2** — Skills cover the project's domain areas; the sentinel tree routes the agent
  to the relevant subset; layer boundaries enforced by lint or `madge` import-cycle
  checks. *CPQ Front at 2/2 — twenty-six skills, spec organised by domain section,
  ADR-001 ("`@cpq/core` never imports React") enforced by ESLint
  `no-restricted-imports`.*

**What raises the score.** Create skills for the top three domain areas your sessions
repeatedly load context about. Add `madge` or equivalent for circular import
detection. Add `import/no-restricted-paths` rules for the layer boundaries declared in
your ADRs.

---

### Executable

**Failure mode prevented.** The specification says one thing, the code does another,
and nothing reconciles them. Documentation drifts from reality. Barriers exist but
are not enforced — the constitution prohibits a pattern that the codebase contains in
fifteen places. NFRs are aspirational text rather than gate conditions ("the API must
be fast" instead of "p99 < 200ms under 1k rps load"). The spec is a wish; the code is
whatever the agent felt like.

**What it means.** The specification is mechanically enforced. Not "please follow the
spec" but "the system will not let you violate the spec." Every behavioural claim,
every NFR, every architectural constraint produces a runnable check.

**Artifacts.**
- Blocking CI steps — the GitHub Actions workflow rejects PRs that fail tests, lint,
  coverage, or mutation thresholds. Spec-as-code: the test suite *is* the executable
  spec.
- `npm run verify` — a single command that runs lint, type-check, tests, coverage. If
  `verify` passes locally, CI passes. No "works on my machine" surprises.
- Behavioural acceptance tests derived from use cases. Each use case postcondition
  becomes an assertion. Each NFR (latency, availability, security) becomes a runtime
  gate.
- For T2-aware projects: the staging NFR harness — DAST scan, k6 load test, p99
  latency assertion — runs against the deployed environment, not just the build.

**What makes it work, and what breaks it.** Executable is the property that
distinguishes "we have a spec" from "the spec is the program." It works when every
behavioural assertion in the spec corresponds to a test the agent runs as part of the
merge cycle. It breaks when spec assertions exist but are not derived into tests, or
when NFRs are stated as prose rather than thresholds. The CPQ Front spec asserts that
fields support seven kinds (string, number, date, boolean, select, reference, month),
but no test validates that all seven render correctly — so the property is at 1/2,
not 2/2, despite everything else being mature.

**Score progression.**
- **0** — Tests exist but are not tied to spec assertions; CI is informational; NFRs
  are prose. *Most pre-GS production systems — the test suite passes, the spec drifts.*
- **1** — Test suite gates merges; spec-derived behavioural tests exist for the core
  flows; NFRs are stated but not gated; ADR architectural constraints have no
  corresponding lint rule. *CPQ Front at 1/2 — CI is blocking, but spec assertions like
  "fields support seven kinds" have no corresponding test, and ADR-001's "no React
  imports in core" has no lint rule (it is enforced by reviewer attention).*
- **2** — Every behavioural spec assertion has a test; every NFR has a
  threshold-driven gate; ADR architectural constraints have lint or CI enforcement.
  *SafetyCorePro at v1.0 — every postcondition is an assertion, every NFR has a k6 or
  load harness, ADR constraints are lint rules. COMPASS at the T2 milestone — the DAST
  scan blocks deploy when the security NFR fails.*

**What raises the score.** Generate behavioural tests from use cases (one assertion
per postcondition is the floor). Add lint rules for ADR-encoded architectural
constraints — `eslint-plugin-import` with `no-restricted-paths` is the cheapest first
step. Add the deployment-time NFR harness (DAST + load + latency) and gate the deploy
on it.

---

## 6. THE TOOL KIT

The tools in this section are the current practitioner's toolkit. They are all built using
GS — eating their own cooking. Each is an entry point at a specific tier.

---

### ForgeCraft-MCP

**What it is:** The quality contract enforcement tool. Generates production-grade
architectural constitutions from a library of 116 curated template blocks covering
24 project classification tags and 6 AI assistants. Scores systems against the 7 GS
properties (0–14, threshold 11/14). Enforces ADR sequencing, quality gates, pre-commit
hooks, and session hygiene.

**Which tier(s) it serves:** T1 (specification scaffolding, constitution generation,
quality gates, mutation testing protocol, dev-time harness setup), T2 (infrastructure
specification templates, staging harness gates), T3 (monitoring specification
templates, runtime diagnostic agent).

**Free or paid:** Free and open source. MIT license. No limits, no tiers, no API keys.
Teams tier (Axon coordination layer) available through Chronicle.

**What the practitioner does with it:**
- `setup_project`: Run once on project initialization. Analyzes the spec, auto-detects
  the stack, generates CLAUDE.md, PRD.md, TechSpec.md, Status.md, hooks, and ADR-000.
- `refresh_project`: Run when scope drifts. Detects tag drift and regenerates cleanly.
- `audit_project`: Run before release or external review. Scores compliance, identifies gaps.
- `check_spec_consistency`: Before a major feature or release — scans for orphan probes,
  hollow probes, stale ADRs, unresolved clarification markers.
- `generate_adr`: Create a new Architecture Decision Record.

The MCP sentinel is a single tool (~200 tokens per request). It reads three artifacts
(`forgecraft.yaml`, `CLAUDE.md`, hooks), derives the correct next CLI command, and
returns it. Remove the sentinel after setup to reclaim token budget; re-add when needed
for drift detection. This design is the methodology expressed as tool architecture: a
stateless reader, a bounded artifact set, a derived action.

**What happens without it:** Architectural constitutions are written ad hoc, missing
critical categories (the five-category grid: architectural identity, standards, constraints
and prohibitions, tool sequencing, routing). Quality gates are aspirational. ADRs are
skipped. The specification is incomplete in predictable ways, producing predictable
downstream failures.

---

### CodeSeeker

**What it is:** Four-layer hybrid code search and knowledge graph. BM25 (exact symbols,
camelCase tokenized) + vector search (384-dim Xenova embeddings) + RAPTOR directory
summaries + knowledge graph expansion. Fused with Reciprocal Rank Fusion. Three tools
(search, analyze, index), 13 actions. Zero configuration — indexes on first use.

**Which tier(s) it serves:** T1 (ensures the AI's derivations are consistent
with the existing codebase, and structural analysis — dead code, duplicates,
dependency chains — serves the dev-time harness).

**Free or paid:** Free and open source. MIT license.

**What the practitioner does with it:**
Install as an MCP server. CodeSeeker operates automatically — the AI calls it when searching
code or analyzing relationships. Primary value for GS practice:
- `search` with graph mode: surfaces structurally connected files across indirect dependencies.
  Grep finds text; CodeSeeker finds meaning and structure.
- `analyze dependencies`: traverse the knowledge graph — imports, calls, extends.
- `analyze standards`: detect the project's established patterns so the AI follows existing
  conventions instead of inventing new ones.
- `analyze dead_code`: find unused exports and orphaned files.

The AX v6 experiment confirmed that CodeSeeker's structural analysis during generation
reduced structural duplication from 5.37% to 2.50% and eliminated interface completeness
gaps that static prompting missed. Bundled as a recommended companion with ForgeCraft 1.5.0.

**What happens without it:** The AI navigates code like a tourist. It finds text patterns
but misses re-exports, dynamic imports, type references vs value references, and barrel
file entries. Interface changes miss call sites. Structural duplication accumulates.
The codebase grows incoherent at the structural level even when the spec is complete.

---

### Chronicle

**What it is:** Persistent tiered AI memory. Five cognitive memory types (Semantic,
Episodic, Procedural, Architectural, Preference), three tiers (Buffer → Working → Core),
decay model. Memories promote automatically through tiers as they are accessed. Architectural
and Procedural memories start in Core and never decay. SQLite local-first; optional Railway
Postgres for cross-machine sync.

**Which tier(s) it serves:** T2–T3 (persistent memory across staging and production
monitoring sessions), essential for teams. The Axon coordination layer (teams tier)
decomposes GS specs into dependency-ordered work packages, assigns by role, and gates
merges on ForgeCraft quality scores.

**Free or paid:** Free personal tier (open source, MIT). Teams tier (Axon) requires a
team license token.

**What the practitioner does with it:**
On session start: `session_start` loads Core memories for the current project.
During work: `remember` stores architectural decisions, solutions to hard problems,
technology gotchas. `recall` retrieves relevant memories ranked by relevance and recency.
`trigger` fires warnings before risky actions ("you were about to deploy — here's what
broke last time").

For teams (Axon): a specwright syncs the GS spec; the AI decomposes it into ranked,
dependency-ordered work packages; contributors receive assignments by role; builders
submit with ForgeCraft scores; mergers gate on quality results.

**What happens without it:** Every session starts blank. Hard-won decisions about why
the architecture is shaped a certain way — decisions that would be in an ADR if written
down — live only in the session that made them. When sessions are interrupted, restarted,
or handed off to a different team member, that context is gone. For teams, work is not
coordinated against the spec; parallel efforts drift in incompatible directions.

---

### Loom

**What it is:** A programming language where the primary executor is an AI agent, not a
human. Compiles to Rust, TypeScript, and WebAssembly from a single source file. The
primary executor is designed to be an AI agent — token-efficient, correctness properties
embedded in the syntax, machine-checkable without executing the code.

Every construct in Loom traces to a published formal proof in the lineage from 350 BCE
to 2011. As of April 2026: 634 tests pass, 23 completed milestones, 5 emission targets.

**Which tier(s) it serves:** T4 (the evolution tier — Loom is the language layer proof
that the formal tradition is executable at T4). T5 and T6 as designed architecture and
research agenda.

**Free or paid:** Research compiler, open source. Not production-ready.

**What the practitioner does with it:**
At the research and advanced practitioner level: Loom is the surface language where
specifications written for human readers can also be compiled by a machine into formally
correct code. A Loom function signature carries the full behavioral contract:
```
fn charge_card @requires_auth @conserved(Value) @idempotent
    :: PaymentDetails -> Effect<[DB<Relational>, Network]> -> Receipt
```
From this signature alone — without reading the body — an AI agent knows authentication
is required, total value is preserved, the operation is safe to retry, it touches a
relational database and a network, and it produces a receipt. The compiler has already
verified all of it.

**What Loom checks at compile time:** Physical laws (mass conservation), security context
(pseudo-random generators rejected in auth contexts), information flow (PII cannot flow
to log output without explicit declassification), communication protocols (session type
duality: what the client sends, the server receives), temporal ordering (authorization
must precede data fetch).

**What happens without it:** The formal tradition's correctness properties are applied
informally, through specification prose, relying on the AI to apply them without structural
enforcement. Loom makes the application structural: if it compiles, the stated properties hold.

---

## 7. THE CLOSED LOOP

The seven properties describe what a GS-governed project must satisfy. The six-tier
cascade describes what obligations dissolve as the discipline deepens. Neither, on its
own, conveys what the system feels like in motion. A working GS project is not a
sequence of separate practices stitched together — it is a closed loop, and watching
it run is the moment the methodology stops feeling like a set of rules and starts
feeling like a single coherent organism.

This chapter narrates that loop.

---

### The cycle: spec to decision and back

A change in a GS project enters at the spec layer and propagates downward through a
fixed sequence of layers. Each layer derives from the one above it. Each layer feeds
back observations to the layer above it. Stated once, in full:

```
            ┌─────────────────────────────────────────────┐
            │                                             │
            v                                             │
        SPEC ──→ USE-CASE ──→ SCHEMA / CONTRACT ──→ CODE  │
                                                    │     │
                                                    v     │
                                                  TEST    │
                                                    │     │
                                                    v     │
                                                HARNESS   │
                                                    │     │
                                                    v     │
                                              OBSERVATION │
                                                    │     │
                                                    v     │
                                                 DECISION─┘
```

The arrow from `decision` back into `spec` is the loop. A decision is the layer at
which what was learned during one cycle reshapes the spec that governs the next
cycle. Without that arrow, the diagram is a waterfall — the failure mode every prior
methodology fell into. With it, the diagram is a circulatory system.

Each transition in the chain is governed by a rule about what the layer above must
contain before the layer below is allowed to change. The spec must name the
behaviour before a use case can describe its flow. The use case must name the actor
and postcondition before a schema or contract can encode them. The schema must close
its types before code can implement them. The code must declare its interface before
a test can assert against it. The test must specify its precondition before the
harness can execute it. The harness must produce a structured result before an
observation can be drawn. The observation must reach a sufficient threshold before a
decision is made. And the decision — the smallest unit of new spec content — is what
re-enters the loop.

This is not aspirational sequencing. It is the actual order of the artifacts
ForgeCraft and Chronicle produce, in the order their hooks fire, in the order CI
gates evaluate. The order matters because each downstream layer carries no authority
of its own. A test cannot be more correct than the use case it derives from. A
schema cannot be more correct than the spec that named the entity. The cascade is
the answer to the question every sceptic asks first: who governs the AI? The layer
above governs the layer below, and the spec governs the layer above all the others.

### Three layers of recording: cells, tissue, organism

The loop operates at one timescale: the session. But sessions accumulate, and the
mechanism by which they accumulate is the three-layer recording structure. Each
layer corresponds to a different scope of memory, and the biological metaphor is not
decoration — the structure mirrors the scopes biology evolved for the same problem.

**Short-term memory — the cell.** Chronicle's individual layer holds the per-session,
per-developer state: what the practitioner just told the agent, which findings
emerged in this session, what the agent learned about the practitioner's preferences,
which prompts produced which outputs. This is the cell-level memory: bounded,
specific, often discarded when the session ends. It corresponds to what a single cell
remembers across the time it is alive.

**Project memory — the tissue.** ForgeCraft's repository state holds the project
layer: the specs, ADRs, decisions, use cases, roadmaps, schemas, contracts, hooks,
and gates that constitute the project's identity. This memory survives sessions,
survives developer turnover, survives the calendar. It corresponds to tissue-level
memory: the organisation of cells into a structure with persistent identity that
outlives any individual cell. Cells die; tissue persists.

**Cultural memory — the organism.** Chronicle-team holds the team layer: shared
findings, prompt analytics across the whole team, patterns discovered in one
project that should propagate to the next, ticket-to-spec mapping, dependency-ranked
work assignment. This is organism-level memory: the patterns the entire body has
learned across all its tissues, available to any new tissue that grows. A team
joining a new project inherits the cultural memory before they touch a single file.

The three layers are independent in implementation — Chronicle, ForgeCraft, and
Chronicle-team are separate tools, no SDK couples them — but they propagate at every
boundary. A finding at the cell layer (an individual session insight) can promote to
tissue (an ADR or decision in the repository) and from there to organism (a pattern
adopted across the team's projects). The propagation is asymmetric, like biology: a
useful mutation at cell level can promote to tissue and organism; a structural
change at organism level cascades back down to every tissue and every cell.

### Promotion: how findings move between layers

The propagation has a shape, and naming it makes it operational. A finding's
lifecycle moves through four stages:

1. **Individual insight.** "I noticed that our LLM agent re-fetches the same
   embedding three times during a single retrieval call." The finding is in the
   session; it lives in Chronicle's individual layer.
2. **Project pattern.** The finding is verified — the embedding fetch is indeed
   redundant — and is significant enough that the next session should know. The
   practitioner promotes it: a one-line entry in the corrections log, or a full ADR
   if the resolution is architectural ("decision: cache embeddings at request scope
   for the duration of a retrieval call"). The finding now lives in the project
   layer; every future session reads it at start.
3. **Team pattern.** Several projects encounter the same redundant-fetch pattern.
   The finding promotes again — it appears in Chronicle-team's pattern feed. New
   projects inherit it as part of their starter context. The team has learned
   something that no individual project would have learned alone.
4. **Next-session input.** The pattern returns to the individual layer of the next
   session that touches retrieval, in any project. The cycle has closed.

Promotion is not automatic, and it should not be. The decision to promote a finding
from cell to tissue is itself a judgment — the finding has been verified, it is
worth carrying forward, it generalises beyond the session that surfaced it. The same
decision applies one layer up: not every project finding deserves to become a team
pattern. The tools make the promotion ergonomic; the practitioner decides the
promotion is warranted.

### Anti-drift: one operative rule

The rule that keeps the loop honest is operative — a single sentence the practitioner
can hold in working memory while making any change:

> **A change is allowed iff its layer above explains it.**

The biconditional is load-bearing. Code can change only if a test changed, or the
contract changed, or the spec changed. A test can change only if the use case
changed or the spec changed. A use case can change only if the spec changed. A spec
change is the *only* change that requires no upstream explanation, because the spec
is the top of the cascade — it is governed by judgment, not by another layer.

Stated as enforcement, this becomes the cascade gate that runs at commit time: a
`feat:` commit that touches code without touching the spec is flagged. A `fix:`
commit that touches code without touching a test is flagged. A `refactor:` commit
that changes a public interface without touching the contract is flagged. Severity
starts as warning and is promoted to error once the project's baseline is clean.
The rule is the same at every layer: the change is allowed if and only if the layer
above explains it.

This is the entire anti-drift mechanism in one sentence. Everything else — the
hooks, the CI gates, the manifest, the cascade severity — is the implementation of
that sentence.

### Conventional commits as the cascade trigger

The mechanism by which the cascade gate knows what to enforce is the commit type. A
commit message of the form `<type>(<scope>): <description>` is parsed by the
commit-msg hook and the validate-pr workflow, and the type drives which cascade rule
applies. `feat:` requires a spec touch. `fix:` requires a regression test. `perf:`
encourages a benchmark and a decision. `refactor:` requires an ADR if it changes an
architectural choice. `docs:`, `test:`, `chore:`, `ci:` are unconstrained — they
cannot drive a code change without one of the above appearing first.

Conventional commits are the simplest possible interface to the cascade. The
practitioner writes `feat(billing): add deferred-charge use case`; the cascade gate
reads `feat`, demands a spec touch, finds one, allows the commit. The same line of
text is the audit trail in `git log`, the input to the changelog generator, the
input to the team-layer prompt analytics, and the cascade trigger. One artifact,
many readers.

The discipline is small but decisive. A team that adopts conventional commits gains
a typed corpus of change for free. A team that adopts them and adds the cascade gate
gains drift prevention for free on top.

### The judgment layer as the loop's terminus

The loop closes at decision. Decisions are written by humans. Some are written by
practitioners ratifying an AI's proposal; some are written from scratch when the
practitioner sees something the AI did not surface. Either way, the decision is
where human judgment enters the system, and the design of GS is to ensure that human
judgment enters here and only here.

Everything before the decision can be automated. The spec is read by an agent. The
use case is decomposed by an agent. The schema is written by an agent. The code is
generated by an agent. The test is generated by an agent and run by a runner. The
harness is executed by CI. The observation is structured by the harness output. All
of this happens at AI speed.

The decision happens at human speed because the decision is what cannot be
automated: was this observation the right one to act on? Should we accept the
AI's proposed correction, or is there a better one we can see and the AI cannot? Is
this the moment to widen the spec, or to leave it narrow and let the failure
re-occur until we understand it better? These are judgment questions. They are not
lifecycle work the cascade can dissolve. They are what the cascade exists to
preserve attention for.

The loop is closed by judgment ratifying direction. The cascade is the mechanism by
which everything else gets out of the way.

### What the closed loop produces

A team running the closed loop notices three changes. The first: the volume of code
review collapses, because review happens at the spec layer rather than the code
layer. A pull request becomes a vehicle for verifying that the cascade fired
correctly and the human ratification is recorded — not for arguing about whether a
function is well-named.

The second: drift becomes visible at commit time, not at integration time. The
cascade gate flags a missing spec touch the moment the commit is attempted, not three
sprints later when the QA team finds the discrepancy. The cost of fixing drift drops
by the amount it usually costs to rediscover it.

The third — and this is the one that surprises practitioners new to the discipline —
the team's collective judgment improves over time, because the team-layer recording
captures what was learned across sessions and projects. The third project's first
session inherits the lessons of the first two projects automatically. The fourth
project's first session inherits more. The cultural memory compounds.

This compounding is the GS bargain stated as a result, not a promise. The discipline
is a structure that captures judgment so judgment does not have to be re-paid every
session. The closed loop is the shape of that capture.

---

## 8. DOCUMENTATION JUST-IN-TIME

A GS-governed project that began in greenfield carries no documentation debt. SafetyCorePro
was specified before its first commit; the cascade has been firing from session one. A
GS-governed project that began in brownfield is in a different situation entirely. CPQ
Front existed for four years before GS adoption began. There were features without ADRs,
behaviours not covered by the spec, subsystems with no architecture diagram, and modules
with no tests. Stopping the project to write all that documentation upfront was not an
option. The codebase had to keep moving.

The brownfield reality is the situation most senior practitioners encounter when adopting
GS. The rule that makes adoption tractable is operative and short:

> **When you touch something, leave the area better-documented than you found it.**

This is the just-in-time documentation principle. It does not paralyse work on missing
documentation, and it does not ignore that the documentation is missing. It binds new
documentation to the moment a change happens, on the area the change touches. Over twenty
sessions, the coverage becomes significant. Over a hundred, it becomes complete. The
alternative — stop everything, document the whole project, then resume — does not work,
because a four-year-old codebase under active development cannot be paused for the
weeks that would require.

The principle resolves into specific brownfield strategies, one per missing artifact.

### When the ADR is missing

You are about to modify something that looks like an architectural decision but no ADR
documents why it was chosen. The question to ask first is whether the decision was
intentional or accidental. `git log` and `git blame` on the relevant files often
reveal the commit that introduced the pattern, and the commit message sometimes
explains the why. Searching `docs/` for an unattributed mention can also reveal that
the decision was discussed but never formalised.

If you find evidence the decision was intentional, write the ADR retroactively
documenting what you discovered. Most of the ADRs in CPQ Front (ADR-001 through
ADR-007) are retroactive — they were written by the practitioner who investigated
why a pattern existed and recorded what they learned. A retroactive ADR is no less
valid than a prospective one; it is the act of recording, not the timing, that
matters.

If you find no evidence the decision was intentional, the pattern may have grown
organically. You can change it, but you should write a new ADR documenting your
investigation and your decision, so that the next session inherits both. If you have
real doubt, ask the human before changing — "I found no ADR for this pattern.
Current behaviour is X. I want to change it to Y. Proceed?" — because a brownfield
project's accidental patterns sometimes encode constraints nobody remembered to
write down.

### When the spec does not cover what you are touching

The spec was written after the codebase. There are features that work but were never
documented. The wrong move is to assume "if it is not in the spec, it does not exist."
The right move is to investigate the current behaviour, then decide whether the
behaviour is significant enough to document.

Read the code; it is the source of truth when the spec is silent. Read the existing
tests — sometimes the tests are the spec. Run the harness and observe what the
system does. If the behaviour is significant — covered by use cases, called by other
systems, exposed to users — add it to the spec before making your change. If it is a
minor implementation detail, a comment in the code is enough. The threshold is
roughly: would a future session need to know this to avoid breaking it? If yes, it
goes in the spec.

### When there are no tests

The area you are about to modify has zero test coverage. The wrong move is to write
tests for everything in the area before making your change — that is a separate
task, a separate session, a separate justification. The right move is to write a
test for *your* change. If the change is a bug fix, write a test that reproduces the
bug and watch it fail before you fix it. If the change is a feature, write a test
that asserts the feature works. Then add to the coverage threshold so that your
test cannot be silently deleted by a future session.

This produces incremental coverage growth bound to feature work. After fifty
sessions, fifty changes have brought their tests with them, and the coverage gate
has ratcheted up fifty times. The area is no longer untested.

### When the architecture is not documented

You need to understand how components in a subsystem interact, and `ARCHITECTURE.md`
does not cover that subsystem. Do not invent the architecture; discover it. Trace
imports through the relevant files. Use a code-search tool with graph mode to surface
structurally connected files. Search `docs/` for subsystem-specific notes that
predate the architecture document.

Once you understand the interaction, draw what you discovered — at the minimum
useful level, no more. A list of components and arrows of data flow is enough; it
does not need to be a full C4 diagram. Add it to `ARCHITECTURE.md` as a new
subsection. Then validate with the human: "I investigated and I understand the flow
is A → B → C. Is that correct?" If the human corrects you, fix the diagram before
you make your change.

### The cumulative effect

Each strategy is small and local. None requires stopping the project, and none
requires the practitioner to be more than honest about what they had to learn to do
their work. But each session closes with the area in slightly better documentation
shape than it opened. The project's documental coverage compounds at the rate of
sessions, not at the rate of dedicated documentation sprints — and the coverage
that grows is the coverage that proved load-bearing in actual work, not the
coverage someone speculated would be useful.

The brownfield bargain is honest: the project will not be fully GS-compliant on day
one, and pretending otherwise would only break the team's ability to ship. The
property scores will be partial; the spec will have gaps; the corrections log will
be empty until the first AI mistake gets logged. What just-in-time documentation
guarantees is that each session moves the score in the right direction. In twenty
sessions, the project crosses the 11/14 threshold. In a hundred, the gaps that
remain are the gaps the team has explicitly chosen not to close — because the work
that lives there is rare enough, or the cost of closing them outweighs the benefit.
That is a different kind of incompleteness from the one a brownfield project starts
with. It is the incompleteness of a finished decision rather than an unfinished
investigation.

---

## 9. CASE STUDIES

### CodeSeeker as a T1 Example

JC built CodeSeeker — a production code intelligence system with four search layers
(BM25, vector embeddings, RAPTOR hierarchical directory summaries, and graph expansion),
cross-language AST parsing, knowledge graph construction, coding standards detection, and
dead code analysis — without writing a single line of application code.

The work was writing behavioral contracts and specifications: what the search pipeline
must return, what the graph must contain, how the ranking must behave, what each analysis
action must produce, what the acceptance criteria were for each component. The blueprint
was the work. The AI derived the implementation from those artifacts. The dev-time
harness — derived directly from those contracts — verified each derivation without the
practitioner reading a line of generated code.

CodeSeeker is now on npm as `codeseeker` (v2.0.1). It runs in production against real
codebases. The methodology produced a tool that now serves as an entry point to the
methodology itself — the GS ecosystem compounding.

This case establishes T1 in concrete terms — both halves: specification authorship is
not reduced-form software work, it is the actual work; and the dev-time harness derived
from those specifications is what makes "you do not read generated code" a guarantee
rather than an act of faith. The code is the artifact the specification derives, not the
thing you do when you have time.

---

### COMPASS: Full T1–T3 Cascade at Prototype Level

`[IN PROGRESS — expand when COMPASS ships or reaches stable prototype milestone]`

COMPASS is a multi-layer regulated data platform being built under full GS discipline.
Two data sources, master entity reconciliation, full ETL pipeline with compliance gate
coverage. It is the primary case study for T2 and T3 in the book — the place where
infrastructure-as-specification and runtime monitoring become concrete rather than
abstract.

When complete, the case study will cover:

T1 — Specification governing every component: data models, API contracts, transformation
logic, compliance requirements, non-functional requirements. No implementation decisions
made outside the specification. The dev-time harness verifies the derivation: integration
tests against real data sources, schema validation, data lineage contracts, mutation
testing across the transformation layer.

T2 — Infrastructure provisioned and wired from the specification: resource topology, IAM
boundaries, encryption policy, monitoring requirements — all executed by the AI without
manual CLI intervention. The staging harness — NFR thresholds, integration smoke tests,
load and security automation against the real environment — certifies the staged build
without a manual walkthrough.

T3 — The Eye diagnostic agent evaluating runtime signals against the formal properties
that governed construction. Drift detectable and correctable by the same mechanism that
built the system.

**Current status:** In active development. Frame in the book as: "I am building COMPASS
under GS discipline now, and this is what the cascade looks like in progress." The in-progress
framing is honest and more interesting to a data team audience than a retrospective — they
can watch it happen. Expand this section as each tier completes.

**For data team audiences (MinneAnalytics):** COMPASS is the entry point. It speaks their
language — ETL, regulated data, master entity reconciliation. The pipeline drift problem
is identical to the code drift problem, just with data instead of functions.

---

### DX1: The Discipline Transfers in a Session

In April 2026 at Mitikah, Mexico City, 58 developers produced 83 analyzable submissions
across two projects (Vaquita — greenfield, and Taskflow — brownfield) in a controlled study.

**Session 1 (pre-reveal): Condition A vs. Condition B**
Neither group knew GS. Condition A prompted freely. Condition B used ForgeCraft specification
tooling without understanding the discipline behind it.

Result: Condition A = 38% perfect implementations. Condition B = 13% perfect implementations.
Mann-Whitney p=.076, rank-biserial r=.28, Cohen's d≈0.5.

Finding 1: Tooling without methodology is a liability. Condition B was given tools they did
not understand and artifacts whose purpose they could not evaluate. The result was worse
than unconstrained free prompting. Three times the rate of complete failures.

**Session 2 (post-reveal): Both groups had a one-session GS introduction**
Condition A applied the discipline freely. Condition B was constrained to follow a
pre-generated roadmap that predated the session — stale artifacts from before the GS
introduction.

Result: Condition A = 75% perfect implementations. Condition B = 63% perfect implementations.
Complete failures: Condition A = 5%, Condition B = 25%.

Finding 2: The discipline transfers in a single session. A one-session GS introduction
was sufficient for practitioners to apply the methodology effectively when given freedom
to do so. Free GS application outperformed stale artifact compliance.

Finding 3: Stale artifacts are worse than no artifacts. Condition B was constrained to
follow a roadmap that had been generated before they understood GS. The roadmap was
correct in structure but aligned to a pre-session understanding of the problem. Practitioners
applying the methodology freely — and adjusting specifications as they learned — outperformed
practitioners following correct-form artifacts they could not evaluate.

**What the study means for the book:**
- The methodology is learnable in a session. This is not a "takes years" discipline.
- The order matters: discipline before tooling. Tooling without discipline is a liability.
  Discipline with tooling is the intended state.
- ForgeCraft has been significantly improved since April 10. The version participants used
  was an earlier iteration. The study's treatment condition understates current tooling
  capability.

---

## 10. THE FORMAL UNDERPINNING

This section must be accessible to practitioners who have never read a formal methods paper.
The goal is not to teach the theory — the AI holds the theory already. The goal is to name
what the practitioner is activating when they write a GS specification.

---

### Hoare Triples (Pre/Postconditions): What They Mean in Practice

C.A.R. Hoare proved in 1969 that programs can carry mathematical contracts. A Hoare triple
`{P} C {Q}` says: if condition P holds before executing C, then condition Q will hold after.

In practice, this is the use case format. Precondition (what must be true before the trigger)
+ operation + Postcondition (what is true after successful completion) = a Hoare triple
written in practitioner language. When you write a use case with a precondition and
postcondition, you are writing a Hoare triple. The AI knows it and applies it.

The reason this matters: a function specified with a precondition and postcondition cannot
be "improved" by the AI in a way that violates either condition. The contract is part of
the specification the AI is satisfying. Without the contract, the AI optimizes locally
without constraint.

---

### Curry-Howard Correspondence: Programs as Proofs

In 1934–1969, Curry and Howard independently arrived at the same observation: there is a
structural equivalence between programs and mathematical proofs. A type is a proposition.
A program of that type is a proof that the proposition holds.

In practice: a type system is not just a lint tool. It is a way of encoding correctness
as a property the compiler can verify. When you write a function signature with precise
input and output types, you are writing a theorem. When the function compiles, the theorem
is proved.

This is why Rust's type system matters for GS. It is not a safety feature. It is a proof
system. A program that compiles in Rust with its ownership model and type constraints has
proved a substantial set of correctness properties — memory safety, no data races, no
use-after-free — not by testing but by construction.

Loom takes this further: additional correctness properties (information flow, session type
duality, temporal ordering, mass conservation) become part of the type system. If it
compiles, those properties hold.

---

### Rust's Type System: The Formal Properties GS Inherits

GS inherits Rust's formal correctness properties through Loom (which compiles to Rust)
and through specifying Rust as the implementation language in projects where correctness
properties matter. These properties are not invented by GS — they are inherited from
50 years of formal methods research, encoded in a production compiler.

Key properties: memory safety without garbage collection (ownership system), no data
races (borrow checker), no use-after-free (lifetime system), no null pointer dereferences
(Option type), exhaustive pattern matching (compiler forces handling of all cases).

For practitioners who do not use Rust directly: the same formal properties can be activated
through GS specification in other languages, as behavioral constraints that the AI enforces.
The specification names the property; the AI applies it; the harness verifies it. The
compiler enforcement is strongest in Rust; the specification approach extends analogous
guarantees to any AI-accessible language.

---

### Loom as the Surface Language

Loom is described fully in Section 6. For the formal underpinning section: Loom is the
first language designed explicitly for an AI executor — for a reader that understands
human language and can derive formally correct programs from specifications written in it.

Every construct in Loom traces to a published formal proof. The lineage document traces
the arc from Aristotle's categories (350 BCE) through every major formal methods milestone
to the present. Loom is the implementation of the claim that specification can be made
precise enough to compile — not just for a human reader, but for a machine.

The formal tradition was always correct. It was abandoned because the cost of applying it
exceeded what human practitioners could recover. Loom makes the application structural:
the annotation is in the syntax, the compiler checks it, the AI maintains it. The annotation
burden disappears because the annotator is the same entity that benefits from the annotations.

---

## 11. THE BIOLOGICAL ISOMORPHISMS

### What BIOISOs are

Biological Isomorphisms (BIOISOs) are formal mappings between GS-governed system properties
and biological self-maintenance mechanisms. They are not metaphors. They are structural
descriptions of the same formal properties, arrived at by a completely different path.

Both biology and correct software solve the same underlying problem: maintaining organized,
goal-directed behavior in the presence of entropy. The formal solutions converge because
the problem is the same.

### How they were found

Once the first three tiers were working — once JC was not writing code, not reading it,
not managing infrastructure, not diagnosing bugs — a different question arrived: what is
a GS-governed system, formally? Not what does it do, but what kind of thing is it.

The answer came from biology. A system with a complete telos, a type system that enforces
its own constraints, a harness that continuously verifies its behavior, a monitoring layer
that detects and corrects drift — what has that structure?

Maturana and Varela had formalized autopoiesis — the property of a system that continuously
regenerates its own components through its own processes. The immune system has memory of
past threats. Organisms express different behaviors from the same genome depending on
context. Cells maintain their boundaries while metabolizing the environment.

These were not metaphors for what GS-governed systems do. They were structural descriptions
of the same properties, arrived at by a completely different path.

### They are the first derivative of GS

The methodology produced systems with these properties as a side effect of correct practice.
BIOISOs made the properties visible, named them, and pointed toward the next question: if
a system already has most of what makes a biological organism self-maintaining, what would
it take to close the remaining gap? That question is what became T4.

### Key mappings

| Biological Mechanism | GS / Loom Equivalent | Function |
|---|---|---|
| **DNA** | Generative Specification | Information that is never consumed, always read; enables derivation of the entire organism |
| **Gene Expression / Transcription** | Session Execution | Load the spec, generate the output |
| **DNA Repair / Error Correction** | Quality Gates + Commit Hooks | Error correction before propagation |
| **Immune System** | Defended property + Regression Tests | Memory of past failures; targeted response to known threats |
| **Apoptosis** | `@mortal`, orphan code deletion | Programmed end-of-life; elements that no longer serve the system are removed |
| **Homeostasis** | Verification Loop (The Eye) | Continuous measurement + correction to maintain stable state |
| **Cell Differentiation** | Universal spec + domain overlays | Same genome, different expression; same spec, different deployment |
| **Epigenetic Modulation** | AOP aspects (Loom M66) | Behavioral change without structural change; cross-cutting concerns without touching function bodies |
| **Telomere Limits** | `telomere: limit: N` (Loom) | Hard bound on lifecycle iterations; prevents runaway self-modification |
| **Immune Memory (Chronicle)** | Chronicle's Architectural tier | Memories of past decisions and solutions that never decay; available in every future session |

### What this means for practitioners

A fully GS-governed system already has most of what makes a biological organism self-maintaining
as a side effect of correct practice. This is not a design goal — it is a structural consequence
of applying the discipline completely.

Boundary maintenance: the specification enforces what may enter and exit each component.
Error correction before propagation: the pre-commit hook catches violations before they
commit; the behavioral harness catches specification drift before it compounds.
Immune memory: Chronicle's Architectural tier stores hard-won decisions that never decay.
Adaptive response: the monitoring layer (T3) responds to drift from specification without
human intervention.

The biological framing is not decoration. It is a sequenced gap list. Biological mechanisms
present in more complex organisms that have no current equivalent in GS or Loom are
candidates for missing constructs — with the dependency ordering that evolution already
worked out. You do not implement telomeres before cells, quorum sensing before multicellularity.

---

## 12. THE RESEARCH HORIZON

This section is for readers who want to understand the intellectual architecture of GS,
not a prerequisite for practice. T1 through T3 are sufficient for most practitioners.

### Where the cascade ends: T5 and T6 as honest forward statements

T5 (synthesis — Axon / Conclave) is designed architecture. The formal tradition points
here: a stateless reader that derives what programs need to exist, what each is for, how
they should interact, and when each should die. The Loom colony simulation is the first
embryonic demonstration. The direction is visible.

T6 (meta-telos) is a research agenda, not a product direction. A system that observes
the practitioner and builds what they need before they ask has a model of the practitioner.
What that system is permitted to do with that model must be answered before the capability
is built. Governance precedes capability at this level.

### Loom as the language-layer proof

The formal tradition stretches from Aristotle's categories through Curry-Howard to Rust's
type system. Each addition was made by a practitioner who noticed that the structure of
this problem was the same as the structure of that one. The lineage is the record of a
single recurring act: the synoptic recognition, held long enough to name.

Loom is the implementation of that recognition as a compiler. Every construct traces to
a published proof. The lineage document closes with one sentence: "The final piece was not
a theorem. It was the stateless reader: a machine that knows all the theory, never forgets,
never gets annotation-fatigued, and can derive every correct artifact from a complete
specification."

### BIOISOs as the methodology proof

The biological isomorphisms arose from a completely different path — not from the formal
methods tradition, but from asking what a GS-governed system is, formally. The convergence
on the same organizational properties is not coincidence. Both biology and formal systems
solve the same underlying problem. The convergence is structural inevitability.

This is the deepest claim in the research program: the executor that arrived to close the
gap is itself a biological isomorphism — an artificial imitation of the organ that
coordinates biological self-maintenance. Once we solved the brain, the brain solved the rest.

### What the practitioner can ignore

The practitioner applying T1 does not need to understand Loom, BIOISOs, Curry-Howard,
or directed formal autopoiesis. These are the intellectual architecture that explains why
the discipline works and where it is headed. They are not prerequisites for practice.

The practitioner who wants to understand the full architecture — who asks "why does this
work, formally?" — will find that GS is not a set of ad hoc practices that happened to
produce good results. It is the activation of 2,376 years of formal tradition that was
always correct and too expensive for human practitioners to sustain. The executor arrived.
The tradition activates.

---

## 13. VOICE AND TONE GUIDE

### The primary calibration source

Read "The Threads" (`the-threads.md`) before drafting any chapter. It is the primary voice
calibration document. Every chapter should sound like it was written by the same person
who wrote that essay.

---

### First person where JC was there

The personal narrative is not decoration. It is evidence. JC was there when CodeSeeker
was built without a line of application code. He was there when the biological isomorphisms
became visible. He was there when the DX1 results came in.

Use first person in these moments. "I spent months understanding that variable" is more
credible than "practitioners often discover" because it is a specific claim, locatable in
time, made by the person who lived it.

Do not use first person for general claims or for things JC did not personally witness.

---

### No academic hedging; state things directly

Wrong: "It could be argued that specification might potentially offer advantages in cases
where AI-assisted development is employed."

Right: "The blueprint was the work."

Make the claim. Follow it with the evidence that earns it. The reader is smart enough to
evaluate the evidence; they do not need the claim pre-softened.

---

### "The blueprint was the work" — compressed claims followed by earned explanation

This sentence does two things: it makes a strong claim, and it inverts the expected order
(normally, you expect "the code was the work"). That inversion creates productive tension
— the reader wants to know how it could be true. What follows earns the claim.

Every chapter should have at least one compressed claim of this kind, followed by the
explanation that earns it. This is the structural unit of the book: claim, then proof.

---

### Honest about what's proved and what isn't

T1 through T4: proved. State this directly.
T5: architecturally specified, not yet empirically demonstrated. State this directly.
T6: research agenda. State this directly.

Never let the forward momentum of the argument blur the line between demonstrated and
designed. The book's credibility depends on this honesty. Practitioners will notice
overselling immediately, and it will undermine everything that is legitimately proved.

---

### Practitioner respect: assume the reader is smart, experienced, and skeptical

The reader is a senior developer or tech lead who has seen many methodologies claim to
solve the same problem and deliver partial results. This reader will give the methodology
one chance to prove itself before dismissing it.

The book earns that chance by:
- Making specific, falsifiable claims
- Citing specific evidence (DX1 numbers, named case studies, named tools)
- Being honest about failure modes and edge cases
- Not requiring the reader to accept anything on faith

Do not explain what a unit test is. Do not explain what a deployment is. Assume the reader
has built production systems and knows what the words mean. The explanation is of the GS
discipline, not of software engineering fundamentals.

---

### No motivational language, no "imagine a world where..." framing

Wrong: "Imagine a world where you never have to write another line of boilerplate code again!"

Right: "In April 2026, 58 developers at Mitikah tested this claim directly."

The methodology is demonstrated. Evidence exists. Use the evidence.

---

### The tone of someone who found something that works and is explaining it clearly

Not a salesperson. Not a skeptic who has been talked into it. Not an academic hedging every
claim. Someone who spent months understanding why the variance was so high, built a working
system from the insight, and is now explaining what they found to a reader who can evaluate it.

The closest analog in tone: Richard Feynman explaining physics. He found it genuinely
interesting. He explains it because it is interesting and because understanding it matters,
not because he is trying to sell it. The thing is good enough to explain itself honestly.

---

## 14. BOOK POSITIONING

### Primary audience

Senior developers, tech leads, engineering managers, and data team leads who are:
- Using AI coding tools and experiencing drift (the problem is live)
- Responsible for the quality of AI-assisted output on their teams
- Capable of evaluating technical claims and seeing through methodology hype
- Looking for a structural approach that produces consistent results, not productivity tips

Secondary audience: CTOs and VPs of Engineering evaluating AI development practices at
the organizational level. They need to understand the methodology well enough to evaluate
it and communicate its tradeoffs to stakeholders.

### Comparable books

- *The Pragmatic Programmer* (Hunt and Thomas) — practitioner-facing, concrete, earned
  authority, organized around actionable practices
- *Clean Architecture* (Martin) — makes a structural argument, names it precisely, defends
  it against alternatives, is honest about tradeoffs
- *Working Effectively with Legacy Code* (Feathers) — practitioners actually use this;
  it is about real problems that real teams face, with real techniques that work

What these books have in common: they are written by practitioners for practitioners. They
make specific claims. They provide techniques. They do not require the reader to trust the
author on faith — they provide the reasoning.

### What this book is not

- An AI hype book: does not claim AI will solve every problem
- A productivity book: does not frame GS as "code faster"
- An academic text: no excessive citations, no hedged claims, no passive voice throughout
- A tool vendor's manual: the tools are explained in context of the methodology, not as
  marketing

### The promise

By the end of this book, the reader can:
1. Set up a GS-governed project from scratch using the specification stack
2. Know exactly which tier they are operating at and what enables the next tier
3. Evaluate whether a specification is complete enough to derive from
4. Apply the dev-time harness (T1's verification half) so generated code is verified, not hoped for
5. Know when and how to use each tool in the kit
6. Be honest with their team about what is proved and what is research

The promise is not "you will never write code again after reading this book." The promise
is: "you will know exactly what GS is, how to apply it, what it removes from your
responsibility when you do, and what the evidence base is."

### The structure the promise implies

The book moves from the problem (AI drift, structural not model-quality) to the solution
(the specification stack) to the evidence (case studies, DX1) to the practice (the cascade)
to the depth (formal underpinning, biological isomorphisms) to the horizon (T5, T6).

The reader who finishes Part 1 (Chapters covering the problem, the inversion, and the
specification stack) can start applying GS immediately. Everything after Part 1 is depth —
important depth, but not a prerequisite for practice.

---

## APPENDIX: KEY NUMBERS AND CLAIMS

The following specific numbers and claims appear in the source material and should be
used accurately in the book. Do not round, approximate, or overstate.

### DX1 Study
- 58 registered developers, 83 analyzable submissions (2 projects each)
- Vaquita (pre-reveal): Condition A = 38% perfect, Condition B = 13%. Mann-Whitney p=.076,
  rank-biserial r=.28, Cohen's d≈0.5
- Taskflow (post-reveal): Condition A = 75% perfect, Condition B = 63% perfect
- Complete failures: Condition A = 5%, Condition B = 25%
- Location: Mitikah, Mexico City, April 2026

### ForgeCraft
- 116 curated template blocks, 24 project classification tags
- Six AI assistants supported: Claude, Cursor, GitHub Copilot, Windsurf, Cline, Aider
- Scoring: 7 properties × 2 points each = 14 total, threshold 11/14
- MCP sentinel: ~200 tokens per request (vs ~1,500 for a full tool suite)
- npm: `forgecraft-mcp` (latest: v1.5.0)

### CodeSeeker
- 4 retrieval layers: BM25 + 384-dim Xenova vector + RAPTOR + knowledge graph
- Average graph connectivity: 20.8 edges/node
- Ablation study: BM25 + embedding fusion drives ~94% of ranking quality
- AX v6 experiment: structural duplication reduced from 5.37% to 2.50% with CodeSeeker active
- npm: `codeseeker` (v2.0.1)

### Loom
- Compiles to Rust, TypeScript, WebAssembly, OpenAPI 3.0, JSON Schema
- 634 tests pass, 23 completed milestones, 5 emission targets
- Research compiler — not production-ready. Do not claim production readiness.
- Formal tradition in Loom: 350 BCE (Aristotle) to 2011 (CRDTs)

### Quality Gates
- Line coverage: 80% overall, 90% new/changed code, 95%+ critical paths
- Mutation score: ≥65% overall, ≥70% new/changed code
- These are gate conditions, not guidelines

### Chronicle
- 5 memory types: Semantic, Episodic, Procedural, Architectural, Preference
- 3 tiers: Buffer → Working → Core
- Architectural and Procedural start in Core, never decay
- npm: `chronicle-mcp`

### Tier Status (definitive, for StoryCraft and Scholaris enforcement)
- T1 (Development): Demonstrated in production + DX study + AX adversarial series.
  Both halves — authoring and dev-time harness — are proven.
- T2 (Staging / Pre-prod): In progress: COMPASS regulated platform ETL `[EXPAND on milestone]`
- T3 (Production): In progress: COMPASS / The Eye diagnostic agent `[EXPAND on milestone]`
- T4 (Evolution): Demonstrated: Loom colony, governed genome mutation running under the
  `[GS T4]` tag at github.com/jghiringhelli/loom `[VERIFY current status]`
- T5 (Synthesis): Axon / Conclave architecture designed; research frontier; NOT
  empirically demonstrated
- T6 (Meta-telos): Research agenda; governance prerequisite; NOT a product claim

---

*This bible is maintained as the canonical source for the GS book. When the research
moves — new experimental results, Loom milestones, DX2 or DX3 data — update this document
before any chapter drafts are generated from it.*

*Version: 1.0 — April 2026*
