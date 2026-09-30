---
layout: default
title: The rubric
parent: The Method
nav_order: 1
permalink: /method/rubric/
description: "Seven properties that make a software project derivable by a stateless reader, each with what a checker looks at and the named failure it produces."
---

# The rubric

A machine can build a system in an afternoon. The question that moved is whether you can show it is sound without asking anyone to take your word. The rubric answers it with seven properties that can be checked, and a name for what it looks like when each one fails.

**What the rubric is.** It is an *instrument*, not a mechanism. The mechanisms are the [bridge, the sentinel and phase collapse](/#the-core-in-five-lines); the rubric measures whether a project's substrate is in the state those mechanisms need. The scorecard grades each property with a letter, A to F, like a school report card. Each letter comes with one finding, the file and line behind it, and one step to raise it a grade. A short prioritized task list closes the report. There is no overall grade or level on the free scorecard: an average hides the low letters. This is the free scorecard and it is coarse on purpose: the paid Decagon is finer (ten properties, an overall maturity level from L1 to L5, a score out of 100 with its confidence, the evidence and a full plan). Every grade is a snapshot, as of a date, a commit and a spec version. A project is never finished; it is graded as of a moment, against the spec in force.

**A legacy instrument.** The experiments in the [evidence](../evidence/) were measured with an earlier 14-point instrument that scored each property 0, 1 or 2. That instrument is retired as a scorecard and is kept only because it is what those results were measured with. Definitions are authoritative in [Compendium §4.4](/docs/white-paper/GenerativeSpecification_Compendium.html); the calibration anchors, written for the legacy instrument, still describe what each level of a property looks like and are in the [scoring guide (PDF)](/docs/white-paper/GS_Rubric_ScoringGuide.pdf).

**Two rules of the instrument.**

- A grade is admissible only when the assessor can name the evidence it rests on and the anchor it is closest to. Two assessors who disagree reconcile by comparing evidence and anchors, not by re-arguing definitions.
- **Executable** is graded only when a formal behavioral contract exists to run. Otherwise it is recorded as N/A, not as an F.

**Grouping.** Five of the seven are the ones a non-engineer can care about, because they decide whether a system survives scrutiny. They spell **SAVED**: Self-describing, Auditable, Verifiable, Executable, Defended. The other two, Bounded and Composable, are the engineering layer that keeps the five true under change. (SAVED is the audit-facing name; the product-facing ten-property extension, the *Decagon*, is a separate instrument built after these experiments. This paper's evidence uses the seven.)

Each property below gives a one-line definition, what a checker looks at, and its named failure mode. **That failure mode is the property's F grade.** The names exist so a failure is recognizable, the way medicine names diseases to make diagnosis possible. They are categories, not criticism.

---

## The audit-facing five: SAVED

### Self-describing

*The system explains itself. A stranger, human or AI, can pick it up and understand it from its own artifacts, without the engineer who built it.*

- **A checker looks at:** an explicit statement of intent and an explicit statement of scope boundary (both must be present); conventions for naming, placement and routing written down, not inferred; whether a stateless reader could say what the system is *not* for before writing a line.
- **F grade: Empty Map.** Intent lives in the original author's head. No document says what the system is for or what it must never do. A new session reconstructs intent from the shape of the code, which yields a reconstruction, not a memory: it infers what the code does but not why its constraints exist, and "optimizes" them away, a little more each session.
- **Cure:** write the specification and the sentinel; test them by asking where a stateless reader would have to ask a colleague.

### Auditable

*The decisions are on the record: not only what the system does, but why it was built this way, what was ruled out, and what changed.*

- **A checker looks at:** conventional-commit conformance across history; a decision-record directory (ADRs) with structured entries; a status artifact that is present and current; whether you can recover *why* a non-obvious decision was made without asking anyone.
- **F grade: Amnesia Stack.** No commit discipline, no decision records. The AI meets a constraint that looks suboptimal and "corrects" it, because the rationale exists nowhere it can read. Over many sessions every intentional tradeoff is normalized away, and the code becomes consistent, conventional, and wrong in exactly the ways that mattered.
- **Cure:** record the foundational decision as an ADR and enforce commit conventions. Full recoverability needs both: commit history without ADRs preserves what changed but not why.

### Verifiable

*Correctness is computed, not claimed. "The tests pass" is a fact a machine produces on demand.*

- **A checker looks at:** a blocking verification layer (types, lint, tests, contract and schema checks) that defines completion; whether tests target interfaces and contracts rather than the current implementation; whether the checks can actually fail, for example through a mutation score on changed code.
- **F grade: Unbound Spec.** No executable tests, or tests that exercise implementation details instead of behavior. Coverage looks healthy while asserting nothing behavioral. The AI generates, the output looks plausible, the session closes, and defects surface in production or not at all. Left alone, the AI also writes new tests to match its new code, guaranteeing they pass rather than binding the spec to behavior.
- **Cure:** write behavioral tests before refactoring, and make every feature in the spec map to at least one acceptance check that runs. The verification layer is not optional post-work; it is the definition of done.

### Executable

*The specification is bound to the running system, not to a document describing an older version of it.*

- **A checker looks at:** the result of the contract suite (for example an HTTP contract suite, an OpenAPI diff, a domain runner) against a live environment; whether the project builds and runs from a clean clone using only its manifest; whether a failure is an infrastructure ghost or a real defect.
- **How it differs from Verifiable.** Verifiable says the checks *exist*. Executable says the implementation *passes them against a real environment*. They are scored separately and can diverge: a system can be strong on Verifiable and fail Executable entirely.
- **F grade: Frozen Spec.** The spec describes behavior the system no longer exhibits. The AI reads it and believes it, generating correct code for a fiction, and the two drift further apart every session. If the contract and the code can diverge in silence, the contract is decoration.
- **Cure:** every claim in the spec is verified by a running test, CI runs on the main branch, and the suite runs first in every session.

### Defended

*The rules are enforced, not suggested. A gate that can be skipped when the deadline is tight is a suggestion.*

- **A checker looks at:** pre-commit and CI gates that actually fire and block; branch protection; a declared trust boundary, validation at every boundary, secrets kept out of source; whether each gate traces to the incident it was built to prevent; whether irreversible actions are identified and gated behind human confirmation.
- **The human ceiling.** CI can verify six of the seven properties automatically. Defended is the exception: whether adversarial challenge has been anticipated and answered needs human review, so an automated score marks it provisional.
- **F grade: Open Gates.** The gates are advisory. A failing check can be merged past under pressure, so the constraint holds only when nobody is under pressure. Secrets leak into source, error responses expose internals, and the AI replicates the undefended patterns it observes. The failure is not malice; it is pattern replication at generation speed.
- **Cure:** declare the trust boundary in the specification and turn each rule into a gate that fails the build. Once the enforced pattern is the one the AI observes, it generates defensively by default.

---

## The engineering layer beneath

### Bounded

*Every unit of work has explicit scope and seams. Functions do one thing; modules own one concern.*

- **A checker looks at:** each specification artifact against the assistant's read budget (the Compendium works with roughly 300 lines, and a root index well under that); size limits declared in the spec and enforced in CI; machine-counted boundary violations such as a service reaching straight into the database; and whether the [sentinel](/#the-core-in-five-lines) tree is present with all five categories, including explicit tool sequencing.
- **Why the limit is mechanical.** An assistant's file reads are capped. A file over the budget is silently truncated, and the agent edits against an incomplete view. A specification artifact over the budget is, to the executor, one that does not exist.
- **F grade: Spreading Boundary.** Responsibilities creep outward with every AI-generated addition. Files outgrow the read budget, the AI edits against the part it can see, and adds code that contradicts the part it could not. The pattern compounds: the more is added, the less the AI sees, the worse the additions.
- **Cure:** declare size limits in the spec, reachable from the sentinel, and enforce them as gates; give every module one declared responsibility.

### Composable

*Units can be combined and extended without unexpected coupling. A change stays local.*

- **A checker looks at:** dependency direction declared in the spec and enforced by a tool (no inward-pointing violations, no cycles, no route straight to the database); a duplication metric, since reinvented units inflate it; explicit interface and contract artifacts; whether the impact set of an interface change is confined to its boundary.
- **Why it matters here.** AI search tools match strings, not symbols. In a tangled system a rename or interface change reaches callers, re-exports and dynamic imports that search cannot reliably find. Bounded and Composable together close that gap.
- **F grade: Tangled Web.** Circular imports; one change that cascades into five other modules; no declared direction of dependency. The AI cannot model the blast radius without reading everything, so it assumes a boundary exists and acts as if it does. Changes that are safe in isolation break dependencies it never saw.
- **Cure:** declare module interfaces and the allowed dependency direction in the sentinel, and enforce no-cycles in CI.

---

## Quick reference

| Property | Layer | F grade (failure mode) |
|---|---|---|
| Self-describing | SAVED | Empty Map |
| Auditable | SAVED | Amnesia Stack |
| Verifiable | SAVED | Unbound Spec |
| Executable | SAVED | Frozen Spec |
| Defended | SAVED | Open Gates |
| Bounded | Engineering | Spreading Boundary |
| Composable | Engineering | Tangled Web |

## What the rubric does not claim

- It does not predict outcomes. It scores whether the substrate is in the condition a stateless reader needs; the [evidence](../evidence/) says what has and has not been measured about that.
- It is not a mechanism. Raising a score by the letter of a check, without the underlying property, is the failure the rubric exists to catch.
- The failure-mode names above are the seven headline ones. A fuller pathology catalog exists and each property links to more than one of its entries in the scoring guide.

**Next:** [Spec completeness](../spec-completeness/) · [Quality gates](../gates/) · [The course](../course/) · to apply it on a real project, see the [workflow recipes](/docs/recipes/).
