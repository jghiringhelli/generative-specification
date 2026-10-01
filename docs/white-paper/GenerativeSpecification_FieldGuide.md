---
layout: default
title: Field Guide
nav_order: 3
description: "Generative Specification — A Field Guide. The theory, what to do, and the numbers. The short, technical version."
---

# Generative Specification — A Field Guide

*How to give an AI agent the discipline it was already trained on — but won't apply unless you make it.*

$1

> **The arc in a paragraph.** GS began as a way to make the investment viable: write the specification, derive the rest, and verify it without a person writing or reading every line. To do that, what matters was moved out of people's heads and out of the model's context into files and checks: the specification, the document cascade, the sentinel, the gates, and the lock that ties each artifact to the specification version it came from. That substrate produced, without being designed, two forms of governance: continuity, so that what was decided and why survives who did it and who left, and state, so that where each project stands against its requirements, the rubric and the business metrics can be known at any time. We suspect, and have not measured, that this lowers the dependence of average quality on individual talent, while the exceptional keep feeding the substrate with rules and gates. That is a thesis, not a result.

---

## 1. The theory

### The reader is stateless

An AI agent can generate an entire system in one session. To do it, it silently resolves a thousand
implicit decisions — units, field ordering, layer ownership, error semantics — drawing on how such
systems are *usually* built. Each choice is locally reasonable; across sessions, teams, and services
they diverge. This is **architectural drift**.

The cause is not a weak model. It is that the model is a **stateless reader**: it begins every session
with no memory of prior decisions, no shared context, and no ability to ask. Everything you did not write
down is, to it, absent. So the design target is precise: **a specification from which a reader with no
context can derive the correct output, alone.** That property — *derivability by a stateless reader* — is
the whole discipline.

### Why specifying works: the bridge, and its asymmetry

Every structural discipline you already use — naming, SOLID, a schema, a domain language, a contract — is
a **bridge between human meaning and executable code**. It carries intent across the gap. Those bridges
were built for the next *human* reader.

Skilled programmers were always fluent on both banks — that fluency *is* the craft. The transformer is
the first **tireless machine executor** with it, at scale: it reads intent encoded as structure and
emits code that encodes intent, in both directions. And, like us, it grasps an explanation far more
reliably than it reconstructs behavior from raw code.

And the bridge is **asymmetric** — this is the leverage. Training is overwhelmingly natural language;
code is a small, exact, unforgiving slice where one wrong token breaks everything. The model is therefore
*far stronger on human meaning than on exact code*. Encoding intent as structure — names, contracts,
constraints in human-conceptual terms — **routes the hard half of the problem through the model's strong
half.** That is the mechanism: specifying moves the load to the bank the model is fluent on.

### Restriction is activation — take your AI to school

The model already went to school. Its training contains the entire formal tradition — Hoare logic, type
theory, design by contract, SOLID, DDD, REST, deontic constraints. **It does not lack the knowledge; it
lacks the instruction to apply it.**

So every constraint you name in a specification is not teaching — it is **activation**. Naming
"hexagonal architecture" or "idempotent handler" or "per-tenant isolation" rules out the wrong programs
and selects the correct one the model already knew how to write. A discipline of removal, in Robert
Martin's sense: you do not add capability, you *delete the freedom to be wrong*. What remains is the
program that was always latent in the model's training.

Generative Specification is how you make a model that has been to school actually do the coursework.

---

## 2. What to do

### One door: the sentinel navigational tree

Give the agent a single entry point that declares scope and routes to the slice each task needs — not
forty files to guess among. A well-formed sentinel carries five things:

```
# CLAUDE.md (the sentinel — the one door)

## Identity        What this system is (screaming architecture — the name states the domain)
## Standards       The disciplines in force (SOLID, TDD, hexagonal, conventional commits)
## Constraints     Inviolable rules and forbidden patterns (each tied to a real past incident)
## Tool sequencing WHEN to prefer which tool — not just a list          ← most often missing
## Routing         Where each concern lives → links to the scoped child specs
```

Tool sequencing is the single most common gap: a tree that lists tools but never says *when* to prefer
one forces the agent to guess — and guessing is where drift enters.

**Keep the door small.** The agent re-reads the sentinel every turn, and attention degrades with depth —
a rule on line 400 is effectively invisible by turn 50, and long files truncate silently (~300 lines is
the safe ceiling per file). Hold `CLAUDE.md` near 250–300 lines: *name* the disciplines (SOLID, TDD),
don't tutorialize them — the model already went to school. When a *spec* outgrows ~500 lines, don't load
it whole; build a ~50-line **spec-map** that points each task to the exact line ranges it needs. In one
brownfield task this cut spec context ~82% (55k → 9.9k tokens) while raising expected fix correctness. *(pilot)*

**Two logs the door must carry** — each turns a one-time correction into permanent grammar:
- **Corrections Log** — when you tell the agent *"don't do that"* about a pattern it produced, it appends a
  dated one-liner (`[2026-03-12] — handle invalid cases with early-return guards, never nested conditionals`).
  It reads the log next session and won't repeat the deviation.
- **Known Pitfalls** — technology traps, not behavioral ones: the flag that silently no-ops, the library
  whose types lie about runtime. Three parts each — what goes wrong, the wrong pattern, the right one.

The stateless reader can't remember it hit the trap yesterday; these are how the repo remembers *for* it —
the ratchet, pointed at the sentinel.

### Two decision layers the tree routes to: ADR and EDR

The sentinel routes to specs, but a spec answers *what* to build, not *why it is shaped this way* — and the
stateless reader needs the *why*, or on its next visit it will "improve" a deliberate constraint into a bug.
Two kinds of decision record carry that rationale, and keeping them distinct is what makes the tree legible
instead of a single undifferentiated pile (a distinction most people, and most models on the first pass, miss
until it is named):

- **ADR — Architecture Decision Record.** The design envelope: the cross-cutting choices that govern *how the
  system is built* — the language and stack, the structural style, which pattern resolves which class of
  problem, the dependency direction. It answers "why is it shaped this way," and reading it wrong is what makes
  an agent reach for the wrong pattern. This is the layer that needs an engineer who knows *how to implement*
  the decision, not just name it.
- **EDR — Engineering Decision Record.** The implementation layer, in two halves that must travel together: one
  states, *functionally*, what a unit does; the other, *how* it is implemented. Bound side by side, small, they
  hand the agent the full local context for a change without dragging in the whole system.

The two complement each other: the ADR gives the global design frame, the EDR the local build detail. Keep
each record **small and single-purpose** (the Bounded discipline applied to decisions themselves) so the
relevant slice fits the reader's window. These records are also exactly what the **Auditable** property scores
— the retrievable *why* — and what makes value attribution possible later: a decision you can trace is a
decision you can tie an outcome to.

### How to build the sentinel, in order

Don't author the whole tree up front. Grow it in the order a stateless reader needs it:

1. **Root `CLAUDE.md`** — the one door, the five categories above, near 250–300 lines. Identity and Routing first;
   the rest accretes.
2. **A first spec** for the initial slice, with its acceptance criteria decidable (prescriptive, not descriptive).
3. **ADR-000** — the founding architecture decisions (stack, structural style, dependency direction), even if
   short. This is the frame every later generation reads against.
4. **EDRs as units land** — each meaningful implementation choice gets its two-part record, linked from the spec
   and tagged with the files it governs (the doc-to-code index).
5. **Split when a node outgrows its window** — a spec past ~500 lines becomes a spec-map; an architecture file
   past its bound gets its own child sentinel (recursive Bounded). The root always points to the children.

The test that it is working: hand a cold agent only the slice the tree routes it to, and it completes the task
without reaching outside that slice. If it has to scan the whole repo, the tree is not yet doing its job.

### Grade the spec the way an AI reads it: SAVED, and the layer beneath

Grade the spec as a **report card** — a letter per property, evidence on the surface — not an invented number.
Five properties are the ones anyone accountable for what ships can read; they spell **SAVED**. Beneath them is
an engineering layer that keeps SAVED true, and together with two more (runtime and evolution) they form the
fuller standard, the **decagon**. Run it on any repo today:

| Group | Property | Ask of the spec | Removes |
|---|----------|-----------------|---------|
| **S** — SAVED | **Self-describing** | Does the system explain itself from its surface, without its author? | Hidden intent the reader must infer |
| **A** — SAVED | **Auditable** | Is the *why* recorded and retrievable (ADRs, EDRs, commits)? | Lost rationale |
| **V** — SAVED | **Verifiable** | Is correctness *computed* by gates, not claimed ("it compiled")? | Unchecked correctness |
| **E** — SAVED | **Executable** | Are contracts run against a live system, not assumed? | Specs never tested against reality |
| **D** — SAVED | **Defended** | Are rules *enforced* (they fail the build), not advisory? | Rules the model treats as optional |
| eng. | **Bounded** | Can a task load only its slice, not the whole system? | An unbounded surface nobody can scan |
| eng. | **Composable** | Can a unit be understood and changed in isolation? | Tangled coupling |

**Self-describing** and **Bounded** carry most of the weight: a bounded, self-describing spec activates
the model's *relevant* knowledge instead of its full prior. The five SAVED properties are what an auditor
or non-engineer reads first; the engineering layer (and the runtime/evolution properties that complete the
decagon) are how engineers keep it sound. The headline is a **maturity level** (L1 Ad-hoc → L5 Self-improving)
with a letter per property beneath, never a bare score.

**What the rubric does not measure — specify it anyway.** Architectural correctness and supply-chain safety
are orthogonal. A repo can score full marks on all seven properties — perfect layers, full enforcement,
complete audit trail — and still ship high-severity CVEs pulled in by an unconstrained dependency chain.
The rubric grades how the AI *structured* what it produced, not what it *selected*. So state selection as a
constraint too: `npm audit` zero-HIGH as a P1 gate, plus an approved/forbidden library list. An executor
handed no dependency policy is unconstrained in the supply-chain dimension — and will act like it.

### When is your spec complete?

Completeness is not length — it is **closing the output space to the correct programs**. A spec is complete
when a stateless reader can derive the *right* thing from it alone; every open degree of freedom is a place it
will guess (a descriptive spec floors the model to the literal minimum; a prescriptive one recovers full
intent). **Assume nothing — but do not specify the how.**

A complete spec MUST carry: identity and boundary (what it is and is not); per feature, **normative acceptance
criteria** (RFC 2119 MUST/SHOULD/MAY — every MUST is a probe); closed decisions with their *why* (ADR/EDR);
contracts (types, tests-as-spec); constraints and prohibitions; the sentinel routing; and the verifying gates.
It MUST NOT carry: the implementation procedure (the executor derives it), over-marking (keyword only the
load-bearing lines), or restated defaults the domain schema already implies — over-specification is the same
harness excess that degrades any bounded artifact; match the *specificity dial* to the stakes.

**The self-test, per requirement:** if you handed only this to a stranger with no context, would they build the
right thing or guess? Where they would guess is the missing constraint — add it (reframe the defect as the
specification-query that would have ruled it out). Full criterion, an audit-and-complete prompt, and an F-NNN
template: [genspec.dev/method/spec-completeness/](/method/spec-completeness/).

### Six pathologies you'll recognize — and the property that prevents each

The rubric grades structure; the pathologies name what its absence *feels like* in a real repo. Practitioners
recognize their own problems here — that recognition is the hook. Each is one or more absent properties made
concrete:

| Pathology | What you'll recognize | Property that prevents it |
|---|---|---|
| **Session Amnesia** | the model repeats a decision you already corrected | **Auditable** — the correction is on record, so the next session inherits it |
| **Implicit Contract Syndrome** | two systems agreed on nothing (the Mars Orbiter problem) | **Executable** — behavioral contracts run against the live boundary |
| **Specification Absence** | no sentinel, no architecture decision on record | **Bounded** — the sentinel bounds and routes the reader's context; without it, everything must be scanned |
| **Implicit Architecture** | the structure lives in someone's head | **Self-describing** — screaming architecture: naming and layering announce the structure, so it is never inferred |
| **AI Security Blindspot** | the supply chain is ungoverned | *none of the seven — the rubric misses this; spec it separately* (`npm audit` gate + approved-library list) |
| **Test Theater** | high line coverage, low mutation score | **Verifiable** — mutation measures what was *caught*, not what ran |

### The loop: retrieve → generate → verify

Author the structure so the agent **retrieves** context instead of re-deriving it; the agent
**generates**; the harness **verifies** — the full test pyramid (unit, integration, E2E, mutation,
contract, SLO) plus AI-as-QA run against the *live* application, not assumed from a clean compile. The
verify step is **generative execution**: the agent operates the real machine — runs the tests, hits the
endpoints, reads the logs — and checks output against the specification.

**Terminology: guides and sensors.** Böckeler (2026) divides an agent's harness into *guides* (feedforward) and *sensors* (feedback), each computational or inferential. Here the sentinel, specifications, instruction files and skills are guides; tests, linters, structural checks and gates are sensors, and "harness" used for the verification layer means the sensors. An instruction file is advisory, a hook is deterministic; both layers should derive from the same ratified specification, with the guides kept minimal. Böckeler, B. (2026). Harness engineering for coding agent users. martinfowler.com. https://martinfowler.com/articles/harness-engineering.html

**Why the verify step insists on mutation testing.** An AI that writes its own tests *knowing the
implementation* will write them to pass, not to catch. Line coverage rewards exactly that: a suite that
executes every line but asserts nothing scores 100% coverage and 0% mutation score. In one project an
80%-line-coverage suite scored **58%** under Stryker — 22 points of tests that ran the right code and
checked nothing. Run mutation *right after each test batch*, not at release; the surviving mutants are the
assertions you forgot to write. Coverage measures what was executed; mutation measures what was *caught*.

Every defect becomes a permanent test and a named rule. This is **the ratchet**: the rule set only
grows, and each fixed bug makes its class of failure unreachable. A defect is not "the method failed" —
it is a **specification query**: *what constraint, had it been written, would have ruled this out?*

**Six definitions, so the claims mean something checkable.** They are design, not results. The first two are below; the triage, the snapshot and completeness follow.

- *No new debt per change.* For a change *c* and each tool-measured measure *i* (duplicated lines in the diff, complexity of touched functions, unused exports, layer-rule violations, touched lines without coverage): `delta_i(c) = m_i(after) - m_i(before)`, and the change is admitted only if `delta_i <= 0` for every blocking measure. Advisory measures are reported and do not block until their false-positive rate is measured and near zero. The baseline is stored and the executor cannot edit it. It does **not** mean zero debt overall: it means a change may not make the measured debt worse, and only a run against the stored baseline counts, not a sentence in a status file.
- *Criteria coverage.* `coverage = criteria with a verification method and a passing check / all ratified criteria`. A criterion with no way to verify it counts as uncovered. A person in the product or business role ratifies the criteria; the executor cannot edit them or the gates.

- *Lifecycle coverage.* Not covered yet: keeping the lights on, and disposal. Post-mortem and auditability are partial. The table with evidence tiers is in the Compendium.
- *Triage of a failure.* When something fails, say which case it is before acting: does the ratified spec already require the right behavior? If yes, a regression test seen failing first is enough and the spec does not change. If the spec was silent, state the gap as a criterion, have a person ratify it, and derive the test from it. If the spec itself was wrong, record the change and ratify it again. A missing tool is added and named in the sentinel. A newly found way around a gate becomes a permanent test case whose count never goes down. Local hooks can be skipped, and only a check on the shared branch enforces. It was checked on one sample project and one real agent run; it is not a measured effect.
- *Governed as of.* A project is never finished, so a score is a snapshot: say which commit and which spec version it was measured against. "Governed as of a date" means each of the seven audit-facing properties was at level L4 (enforced with no silent skip path) at that snapshot, none below L3, and nothing about later commits; the letter A per property is that same band, so "seven A" and "L4 in the seven" are the same thing. A team that aims lower reports "L3 declared", never "governed". L5 is a trend across several snapshots, not a strictly monotonic curve.
- *Spec completeness.* Keep three numbers apart: criteria with a passing check, open questions, and places a stranger would guess. Each place goes back into the spec, and a person ratifies it. The numbers count what is written, not what nobody has thought of yet.

**Coherence between spec and code.** Divergence is a verification problem, not a generation problem: it does not matter how the code was generated, it matters to detect that code and document stopped saying the same. The mechanism has to live in files and on the shared branch, because the session forgets. Five checks, none using a model: identifiers in both directions (every criterion has a test, and every test cites a live criterion, so an orphan test that still passes is found); the lock (code and derived artifacts carry only a stable tag naming the spec section they came from; the hashes of the sections live in one file, like a lockfile, so a reworded rule makes the old test stale until it is regenerated or re-ratified with a reason on record); a co-change gate (a behavior change cites a criterion, and a refactor must pass its parent's tests unchanged); an inverse inventory (every public route or export is claimed by the spec); and an intent diff in the review (criteria touched, stale artifacts, criteria with no test). It detects that spec and code stopped coinciding, not that the spec is wrong and not a test that proves nothing. Status: design; the checks were verified on 35 crafted scenarios in one sample project; no effect was measured. Compendium Section 8.20 and genspec.dev/method/coherence/.

Full text, evidence tiers and the lifecycle table: Compendium 8.19 and genspec.dev/method/lifecycle/.

### The horizon: what you stop doing

Why bother building all this structure? Because each tier it unlocks removes a whole class of work from your
hands:

- **T1** — you don't write the code, and you don't review what was generated; the harness certifies it.
- **T2** — you don't touch deployment; the spec drives CI/CD.
- **T3** — you don't monitor; the spec's behavioral contracts run against the live system.

Each tier is admissible only when the one before it holds. (The full cascade runs to T6; the treatment is in
the Compendium.) The horizon is not "the AI writes code faster" — it is that specifying correctly is the only
thing left that you do.

### The sharpest move: prescriptive, not descriptive

The most common objection is *"the agent cuts corners."* It is real — and it is a specification problem.
Under speed-and-token pressure, a **descriptive** spec ("build a rate limiter") lets the model floor to
the literal minimum. A **prescriptive** spec — intent made explicit ("reject the 101st request in a 60s
window with HTTP 429, per API key, return `Retry-After`") — closes the output space. What the spec does
not close, the agent is free to floor.

**Reach for the RFC 2119 keywords — they are the lexical tool for closing a degree of freedom.** Phrase
each load-bearing obligation with a capitalized normative word: **MUST** closes the freedom outright (a
blocking gate), **SHOULD** is defeasible (a warning — deviation needs a recorded reason), **MAY** is
ungated (permitted, unchecked). The keyword sets both the obligation and the gate's severity, so "MUST
reject the 101st request in a 60-second window per API key with HTTP 429" closes what "the rate limiter
should handle bursts" leaves open. Every MUST is an acceptance criterion, which makes it a machine-checkable
probe — the keyword is where a prescriptive clause connects to **Verifiable** and the verify loop. Keyword
the obligations that carry weight, not every sentence; over-marking is harness excess.

### The unit of work: a bound prompt, not a task title

A roadmap line like *"build the connection system"* forces the agent to reconstruct scope at execution
time — exactly where it invents. Bind every task to a prompt that carries its own references, scope, and
acceptance test:

```markdown
## [ID] — [task name]
**Load:** [exact artifacts to read — and what NOT to load]
**Scope:** [what to build — and, explicitly, what NOT to touch]
**Acceptance:**
- [ ] [specific, verifiable criterion]
- [ ] full suite passes
- [ ] exercised at the HTTP/CLI boundary
**Commit:** feat(scope): [description]
```

The load-bearing line is **what NOT to touch**. Facing a failing test, an agent's path of least resistance
is to edit the production code until the test passes; a `NOT IN SCOPE: implementation code` line makes that
path unreachable. It is the prescriptive move applied to a whole session.

---

## 3. The numbers

What the discipline buys. Each result is committed, reproducible evidence — *how* each was produced is in
the paper and the linked experiments.

- **Structure** — naive prompting scored **3/14** on the legacy 14-point rubric (retired as a scorecard; it is what the experiments used); GS-structured output reached **14/14**,
  and held even when the harness was *tool-generated*. *(measured)*
- **Retrieval cost** — authored structure costs **up to 3× fewer tokens per query at higher accuracy**
  than dumping context or searching code at query time. *(measured)*
- **Ordered vs. average code** — making the same change to a codebase carrying an average project's mess
  (duplication, dead code, mixed patterns, calibrated to published norms) cost **~2.4× the tokens and 3.5×
  the edits** of the clean version, *even with a navigation map on both*. Two levers: a map fixes *finding*
  things; only removing the duplication removes the rest — no map recovers it. *(mechanism, n=2)*
- **Model independence** — a mid-tier model matched a frontier model **149/149 at ≈6× lower cost**: the
  effect is a property of the specification, not the model. *(pilot)*
- **Formal tier** — a compiler derived from its own specification, **386/386** acceptance tests.
  *(measured)*
- **Production** — a service specified, generated, and deployed to a live runtime: **13/13** behavioral
  probes (1,013 assertions), **6/6** SLO gates. *(measured)*
- **Reproducibility** — **104 tests** regenerated from a committed spec by an independent third party.
  *(measured)*
- **Corner-cutting** — a prescriptive spec moved the same task from **0/3 → 3/3** against a held-out
  oracle at equal token cost. *(pilot)*

**Not claimed.** There is no measured end-to-end "your token bill drops X%"; the binding metric is
*tokens-per-correct-output*, not tokens spent. Leading with these limits is deliberate — it is why the
measured results above can be trusted.

**The other side, measured by someone else.** Independent work shows what happens *without* authored structure:
Orlanski et al.'s SlopCodeBench (2026) instruments agent trajectories that extend their own prior solutions and
finds structural erosion rising in 80% of them, with agent code running 2.2× more verbose than matched
human-authored code and deteriorating each iteration while human code stays flat — the failure mode GS is built
to prevent, measured by a group that never tested GS.

---

## 4. Start here — this week

1. **Create the sentinel** (`CLAUDE.md` at the repo root) with the five categories. One door.
2. **Write the sentinel** before the first agent session — identity, layers and their
   ownership, the schema, a skeleton decision record.
3. **Turn on the harness** — hooks + CI that gate on tests, types, and lint. "Done" = gates pass.
   **ForgeCraft** installs these quality gates in CI — the **Defended** property made installable.
4. **Grade yourself** on the seven-property rubric. Your lowest two scores are your next two moves.
   **`npx pragmaworks audit`** runs the seven-property rubric automatically; **CodeSeeker** (hybrid graph
   search) makes the *retrieve* step operational so the agent traverses structure instead of re-deriving it.

**Hooks aren't just safety — they're budget.** Every check that runs as a hook costs zero context tokens;
the same check done in-conversation — compile, run tests, scan for forbidden patterns — costs a
thousand-plus tokens *each time the agent redoes it by hand*. Move verification into hooks and the freed
budget goes to work instead of re-checking. And **Defended** scores 0 until hooks actually run: *"add
pre-commit hooks"* written in a status file is not a defended system; hooks logging real violations are.

**What GS does not remove — the judgment layer.** Naming what stays human is what makes the promise credible.
GS automates specification, generation, and verification; it does not touch *domain expertise*, the *strategic
decision about what should exist*, real *user research*, *aesthetic judgment*, or *compliance sign-off*. Those
are the terminus every tier routes toward, not the work the harness absorbs. If a pitch claims the machine
decides what to build, it is overselling; GS lowers the cost of everything downstream of that decision so the
decision is all that is left.

The specification is the mold. The AI is the foundry. The scarce resource — the one that does not
regenerate for free — is the judgment to specify correctly.

---

## Links

- **White paper** (the full argument and citations): `github.com/jghiringhelli/generative-specification` → `docs/white-paper/GenerativeSpecification_WhitePaper.md`
- **Compendium** (complete evidence, the 29-pathology catalog, the formal treatment): same repo, `docs/white-paper/GenerativeSpecification_Compendium.md`
- **Experiments** (per-run JSON evidence — AX, EX, KX, RX, MX, RND-1): `github.com/jghiringhelli/generative-specification/tree/main/experiments`
- **Formal-tier experiment (ALX)**: `github.com/jghiringhelli/loom/tree/main/experiments/alx`
- **Run it on your team's codebase**: `pragmaworks.dev`
