---
title: White paper v5.0 (proposed, not published)
published: false
nav_exclude: true
search_exclude: true
description: "White paper 5.0 (proposed, not yet published): the method specification. Not published, not deposited."
---

# Generative Specification: A Discipline of Derivability for the Stateless Reader

**Author:** Juan Carlos Ghiringhelli (PragmaWorks)
**Version:** 5.0, proposed, not yet published · October 2026

> **If you build software with AI agents, this paper specifies a method for describing a system precisely enough that the agent can derive it, and for keeping what it derived verifiable, auditable and ratifiable by people.** It states the method, what it is intended to give a developer and what it is intended to give a team, and the instrument that tests whether a project meets it. It is a proposal of work and of method. It reports no experimental result as a finding; the experiments live in the Compendium (the long-form master from which this paper derives), in the experiment logbook and in future papers.


**Summary for leaders.** AI assistants write software faster than a team can read it, and they begin every session without memory of why anything was decided. This paper proposes a method, Generative Specification, for keeping intent in files and checks instead of in people and sessions: a specification precise enough for the assistant to build from, decision records, small descriptive commits, checks that run and stop the work when they fail, and a person who ratifies what enters force. A seven-property instrument grades a project, and a project can be reported as "governed as of" a date. What the paper offers: a defined method, a statement of what it is intended to give a developer, a team and an organization, and a way to tell whether a given project meets it. What it does not offer: evidence that it pays. The experiments so far are small, exploratory and run by the author; the advantages are design intentions or hypotheses and each is labelled with how far it has been tested; no figure here is a return on investment. It has costs (upkeep, ratification, extra generation) and is not expected to help short-lived work. The practical advice is at the end (§10): grade one project, add one gate, and keep every defect.

---

## 1. Abstract and thesis

We argue that a central failure mode of AI-assisted software development is **architectural drift**. An AI agent, capable of generating a system in one session, resolves a thousand implicit decisions (units, field ordering, layer ownership, error semantics) silently, drawing on everything it has read about how such systems are *usually* built. Each decision is locally reasonable; across sessions, people and services they diverge. The cause is in part structural: the agent is a **stateless reader and a stateless writer**. It begins every session with none of the memory, shared context or ability to ask that a human colleague uses to compensate for an underspecified system, and what it writes today is read tomorrow by a session that remembers nothing of why. (Model capacity changes how much it can compensate; it does not recover what was never written.)

**Generative Specification (GS)** is a **discipline of removal** in Robert C. Martin's sense: like structured, object-oriented and functional programming it is defined by a freedom it takes away. Those disciplines constrained control flow, data access and mutability for a human reader. GS removes the freedom to leave architectural intent implicit, for a reader that cannot recover it, and requires a specification from which a stateless reader can **derive** correct output unaided. (*Paradigm* is used only in Martin's narrow sense.) The obligation is operationalized as **seven properties** (Self-describing, Bounded, Verifiable, Defended, Auditable, Composable, Executable), each named for a failure mode, graded per property and summarized as a maturity level (§5).

The method rests on three ideas the author offers as his own, and on a substrate that carries them. **The bridge** is proposed as an account of why externalizing intent into structure yields correct derivation, and why the load moves to the model's stronger side. **The sentinel**, a navigational tree of scoped specification files, bounds each session's context so it stays clean enough to derive from. **Phase collapse** is specification, implementation and verification converging into one derivation step once the specification is complete and the executor capable. The **substrate** is the set of files and checks that keep intent outside the model and outside the session: the sentinel, the specification and the cascade of documents derived downward from it, decision records, atomic descriptive commits, gates that execute, the ratchet, the **lock** that ties each derived artifact to the version of the specification it came from, and **ratification** by a person (§3).

Version 5.0 adds to 4.0 the lock and the other coherence checks, ratification, the capacity-relative bound, the specificity dial, a letter-and-level instrument with a "governed as of" definition, and a statement of **what the method is intended to give**, in three layers that share one method: the developer (Part A), the team (Part B) and the organization (Part C, not a separate method but what emerges when every project carries the substrate) (§4). Each is an **intended effect with its mechanism and a status tag**, and most are design only or hypotheses. Version 4.0 also carried the experimental evidence; 5.0 does not (§7).

### 1.1 What is ours and what is the field's

Specification-as-driver is not novel; spec-driven development predates AI assistants by decades. The stateless-reader condition is not the author's discovery; the naming and the discipline attached to it are. The structural disciplines (naming, SOLID, domain-driven design, design by contract, type-driven design, test-driven development, hexagonal layering) and decision records are prior art, which GS forces for a new reason. The compact knowledge graph is McCreary's (Yarmoluk & McCreary, 2026); guides and sensors are Böckeler's (2026). The author's contributions are three, the bridge and its asymmetry, the sentinel and phase collapse, plus smaller coinages inside convergent territory (the read-asymmetry, the ratchet, the specification query, the lock, the specificity dial). None is claimed as a new property of software or as a priority discovery.

### 1.2 How to read the status tags

Section 3 states the method; its premises (the bridge, the read-asymmetry, phase collapse, cost inversion) are design hypotheses unless tagged otherwise. Section 4 states advantages, each with one or more tags informed by the evidence vocabulary of the ACM SIGSOFT Empirical Standards (Ralph et al., 2020).

- **Design only.** Specified here; no run has produced a number about it.
- **Demonstrated once in a worked example, no comparison.** An author-built example shows it can be done; it does not show an effect.
- **Exploratory measure.** An author-run comparison, small, one benchmark, one author, not registered with an external timestamp. It can illustrate, not confirm.
- **Test designed.** The experiment that would test it is designed in the logbook and has not been run.
- **Observation by the author.** The author's field experience; motivation, not evidence.
- **Hypothesis.** Stated so that it can fail.

No study in this programme is confirmatory and none has been replicated externally. The word *finding* is not used for any advantage.

---

## 2. The problem: what AI-assisted development changes

On September 23, 1999 the Mars Climate Orbiter entered the Martian atmosphere roughly 170 kilometers lower than intended and was lost. The cause was not a bug in any module. One team reported thruster impulse in pound-force seconds; the flight computer expected newton-seconds. Both components were internally correct and the code compiled. The failure lived at the seam where two coherent systems had to agree on a language they were never required to write down. The contract had been **assumed, not written**.

An AI assistant now produces an equivalent interface in one session: it compiles, the types check, the unit tests pass, and embedded in it are assumptions the model resolved silently. The assistant is also a **stateless writer**. The session that wrote a rule is gone when the next one reads the code, and code carries no record of the reasons behind a decision, so a deliberate constraint looks like a defect to be corrected. The method requires an agent with direct command-line access (it reads and writes files, runs tests, commits); it does not apply to chat interfaces.

Three studies bear on what is lost when assistants meet real software, and they are cited as motivation, not as tests of GS. In a randomized trial with 16 experienced open-source developers on 246 tasks in mature repositories they knew well, Becker et al. (2025) found that allowing early-2025 AI tools increased completion time by 19%, although the developers had forecast a 24% reduction and afterwards estimated a 20% one; the authors list as plausible contributors low reliability of generations, the size and complexity of the repositories, and the assistant's ignorance of implicit repository context. In a difference-in-differences study of open-source projects adopting Cursor, He et al. (2026) found a large but transient rise in velocity and a persistent rise in static-analysis warnings and code complexity, which their panel estimates indicate are major drivers of the later slowdown (the authors caution that this debt does not by itself fully explain the fade). In SlopCodeBench (Orlanski et al., 2026) agents extend their own earlier solutions: no agent solved any problem end to end, structural erosion rose in 77% of trajectories, and a prompt asking for cleaner code improved the starting point without stopping degradation across iterations. A fourth study is a caution that bears directly on the sentinel: repository-level context files did not generally improve task success and raised inference cost by more than 20% (Gloaguen et al., 2026).

We read these as suggesting three kinds of loss: review and rework that grow with the volume of generated change, complexity that accumulates and slows later work, and degradation across long chains of change that advice does not arrest. GS is aimed at the second and third, and at context that was never written down. It is not aimed at everything: it cannot supply tacit knowledge nobody wrote, it does not address novelty and abandonment of tools, and it adds steps around each change, so its own overhead is a cost to measure and not assume away (§4.4, §6).

---

## 3. The method

### 3.1 The obligation, and the raw material

The obligation is **derivability**: the specification, with the artifacts the reader is routed to, must be complete enough that a stateless reader derives correct output from it alone. Every degree of freedom left open is a place the reader will guess. Operationally, derivability is probed by handing a fresh session only the specification and the slice the sentinel routes to, and listing where it guessed (§5.3); the person who ratifies decides when the specification is complete enough for the stakes. The axis is orthogonal to the earlier disciplines (a functional or an object-oriented program can be wholly GS-compliant or wholly not), so GS is a peer of them in the sense of removal, not a successor in a lineage.

The raw material is the **structural disciplines**: long-established practices that force intent out of a developer's head and into durable structure. Each is encoded veteran wisdom. GS does not invent them; it **forces** them, making their presence the measurable definition of a well-specified system, because they are the structures a stateless reader needs. Placing the discipline in the pragmatic tier of Morris's (1938) semiotic tripartition is a conceptual proposal developed separately; nothing here depends on it.

### 3.2 The bridge and the read-asymmetry

Every structural discipline is a **bridge between human conceptual language and executable code**, the gap Gordon (2024) calls the linguistics of programming. Skilled programmers were always fluent on both banks; the transformer is the first tireless machine executor with that dual fluency. The premise is that it **shares the human asymmetry**: it comprehends an *explanation* of behavior more reliably than it reconstructs behavior from raw code, and code carries no record of the reasons behind it. Training text is overwhelmingly natural language and code is a small, exact slice, so encoding intent in human-conceptual terms is proposed to route the hard half of the problem (exact code) through the model's strong half (meaning). GS supplies the bridge as plain text in the repository: decision records, diagrams, schemas, contracts and acceptance criteria. The **read-asymmetry** is the same premise on the reading side: a system is comprehended from its **structural surface** (contracts, tests, interfaces, patterns, decision records), a small, high-signal slice that states what the code does and why, and not by inferring behavior from all the code. This is why Bounded matters and why the sentinel is expected to help.

*Status: design hypothesis.* No experiment isolates the bridge. Exploratory results neither confirm nor contradict it directly but bound it: reorganizing code into layers at fixed content did not make a cold reader cheaper; an expert prompt carrying the same obligations tied the full cascade in single-shot generation; context files without this discipline raised cost (§2). The disciplines are the constructive route to a correct system and the seven properties its evaluative description; the risk that the two merely agree because one author derived both is real, and the instrument's validity is open (§5.4).

### 3.3 The substrate

The substrate keeps intent outside the model and outside the session. It has eight parts; §4 states what they are intended to produce.

**The sentinel.** The project's root instruction file (`CLAUDE.md`, `AGENTS.md` or `.cursor/rules`) plus a tree of scoped child files, a **canonical navigational tree** in the agent's context. Each node declares its scope and routes to its children, so a session loads the slice its task needs. A session's context degrades as it fills, and derivability in principle is worthless if the reader's context is too polluted to exercise it: **derivability is the goal; the sentinel plus a bounded tool surface is the means.** A well-formed tree carries five categories: architectural identity, standards, constraints and prohibitions, tool sequencing (when to prefer which tool) and routing. It is itself bounded: over-building it re-creates the problem it solves, so the rule is minimal and sufficient, and the root stays small enough to read whole.

**The specification and the cascade.** At its most precise the specification is an obligation-bearing contract, borrowing the requirement levels of RFC 2119 (MUST, SHOULD, MAY, force only in capitals) and the testable structure of a service-level agreement (defined terms, acceptance criteria). Documents derive downward: criteria, then diagrams and schemas, then tests, then living documentation regenerated from the specification, so no layer is a separately maintained description of the one above. Each criterion has an identifier. The specification precedes the code it governs.

**Decision records.** An **ADR** records a cross-cutting design decision and why; an **EDR** records an implementation-level decision in two halves kept together, what a unit does and how it is built. Records are small, single-purpose and append-only: superseded, not rewritten. They give the stateless reader the *why*.

**Atomic descriptive commits.** Each change is one small commit with a typed conventional message that says what changed and cites the criterion or record behind it. The history is a corpus a reader can query, and each diff is small enough to review as a unit.

**Executed gates.** Checks that run and whose failure blocks the change: types, lint, tests written against interfaces, coverage and complexity thresholds, mutation testing of changed code, dependency audit, contract checks, and probes against the live system. Following Böckeler (2026), the sentinel, specifications and instruction files are **guides** (feedforward, advisory) and tests and gates are **sensors** (feedback, deterministic); a hook is deterministic, an instruction file is not.

**The ratchet.** The rule set only grows: each resolved defect becomes a test and a permanent rule, each closed ambiguity an ADR. A defect is a **specification query**: what constraint, had it been present, would have ruled this out? For structural debt the definition is operational: a change is admitted only if no blocking measure (duplication introduced, complexity of touched functions, layer violations, uncovered touched lines) worsens against a stored baseline that the executor cannot edit and that only moves downward. It does not mean zero debt overall.

**The lock** and **ratification** (§3.5) complete the substrate.

### 3.4 Phase collapse

In conventional development, specification, implementation and verification are separate phases with hand-offs and drift at every seam. When the specification is complete enough to derive from and the executor capable enough to derive, the machine steps **collapse into one derivation**: the assistant generates and the sensors verify in one session without hand-offs. The person's decisions (stating intent, ratifying) do not collapse; they are what the collapse serves. One caution follows from the mechanism: in one context the agent that writes the implementation is already present when it writes the test, so test-first can collapse into compliance in grammar only. Instructions cannot close that gap; gates can (a hook that rejects a commit adding only tests that already pass, the sign of tests written after the code).

### 3.5 The lock, coherence and ratification

A specification and the code under it can stop saying the same thing without anyone deciding that they should. This is a problem of verification, not generation, and the mechanism must live in files and in checks on the shared branch, because a session forgets. The Compendium (§8.20) defines five checks that use no model.

1. **Identifiers in both directions.** Every criterion has a passing check, and every test citing an identifier cites a live one, so an orphan (green, proving something no longer asked) is found.
2. **The lock.** Each derived artifact carries a stable comment tag naming the specification section it came from (`@gs <criterion-id> <spec-path>#<section>`) and nothing else, so a specification change never forces an edit in the code. The hashes live in one file, a lockfile for specifications: the hash of each normalized section (markup, list markers and whitespace removed) and of the version each artifact was derived against. If a section changed after its artifact, the artifact is **stale** and the check fails until it is regenerated or re-ratified. This is the derivation fingerprint: a later reader, human or model, can know from which version of the intent each artifact came and regenerate *with knowledge of cause*. Records are append-only and are not locked.
3. **A co-change gate.** A commit that changes behavior cites a criterion, stages the specification change that is its citation, or declares itself a refactor, and a refactor must pass its parent's tests unchanged.
4. **An inverse inventory.** Every element of the public surface is claimed by some rule of the specification.
5. **An intent diff** in the review: for the person who signs, the criteria touched, the derived artifacts that became stale and the criteria with no test.

**Ratification** is the act by which an accountable person accepts something into force: a criterion, a change to the specification, a stale artifact. It states a reason and appends who, when, what and why to a record that only grows; only a ratification moves the hash of an existing artifact, so the escape for a cosmetic change leaves a trail. A person performs it, not the executor. An agent could run the same command, so the real enforcement is a person's review of the record on the shared branch.

*Status: design only for effect; demonstrated once in a worked example for the checks.* The five were implemented as deterministic scripts in one sample project and run against 35 scenarios crafted by the author, which shows they detect what they are defined to detect and not that they reduce defects. False positives were found: a typo fix in a criterion needs a ratification; inserting a criterion shifts positional identifiers and marks later artifacts stale; the refactor proof misses an edge no test pins. The checks detect that specification and code stopped coinciding; they cannot detect that the specification is wrong or that a test proves nothing (mutation testing and live probes address the second, triage the first).

### 3.6 The cycle

1. **State the intent** and write the criteria as the contract; a person ratifies them.
2. **Derive**: the assistant, bounded by the sentinel, generates code, tests and derived documents.
3. **Verify**: the sensors run, including probes against the live system. A failing check stops the line.
4. **Triage** each failure before acting. Does the ratified specification require the right behavior and the code violate it (a regression test; specification unchanged)? Is the specification silent (a criterion is added and ratified, then the test)? Is it wrong (the change is recorded and ratified again)? Is a tool or sensor missing (it is added and named in the sentinel)? Is it a way around a gate (a permanent test case for the gate, whose count never decreases)?
5. **Ratify** the intent diff, commit atomically with its record, update the lock.
6. **Ratchet**: what was learned becomes a permanent test, rule or record.

**Cost inversion.** In traditional development implementation accumulates sunk cost and the rational response to a conflict is to amend the specification. When regeneration is cheap, fix the specification and regenerate; code is closer to implementation residue and the scarce capacity is the judgment to specify correctly. The qualifications matter: regeneration is cheap only for the mechanical part, it is not deterministic (two regenerations differ, which is why the gates and the lock, not the generator, hold the invariants), and the specification must be good enough for regeneration to be safe.

**The specificity dial** (a design heuristic). Completeness (how much of what must be true is stated) and specificity (how much of the *how* is pinned) are independent axes. At low specificity the generator has latitude and human verification can be light; at high specificity the latitude narrows and verification grows heavier, because a pinned mechanism must be checked against the pin. Set specificity to the required assurance of each component rather than maximizing it: over-specifying a low-stakes component wastes authoring and review; under-specifying an irreversible one admits defects or moves the cost to review. *Status: design only; no experiment varies it.*

**The capacity-relative bound.** The mechanical advantages (cheaper navigation, structural cleanliness, coherence kept in a weak model) are **capacity-relative**: largest where the model is weak relative to the task and receding as models strengthen and larger contexts, orchestration and native planning absorb them. ("Weak relative to the task" has no defined measure here; the one design that probes it uses a ladder of models.) What the method claims to retain as models strengthen is **hypothesis H-G**: a guarantee arbitrated by a non-model check outside the model, and a specification imprint outside the session from which code can be regenerated with knowledge of cause. A language model cannot be its own trustworthy verifier, so the guarantee has to live in a gate. Whether an external gate catches what a strong model's own verification misses is not established; it is the experiment the claim is owed (§7).

### 3.7 Starting small

No packaged tool is part of this paper; the sample implementation of the coherence checks is a set of scripts. The order that follows from the method is: (1) a root sentinel with the five categories and one specification slice with identified criteria; (2) the gates your project already has, made blocking; (3) a founding ADR and conventional commits; (4) the triage and the ratchet on every defect; (5) only then the lock and the coherence checks. An illustration of one criterion carried through the lock (the format is illustrative):

```
spec    docs/spec/rate-limit.md  RL-1  The API MUST reject the 101st request per key
                                       in a 60-second window with HTTP 429 and Retry-After.
test    // @gs RL-1 docs/spec/rate-limit.md#RL-1
lock    rate-limit.md#RL-1  <hash of normalized section>   rate_limit.test  <hash it derived against>
record  2026-10-05  RL-1  wording only, no behavior change  reason: clarity  ratified-by: <person>
```

For an existing codebase the order is the same; "no new debt per change" admits a large existing debt, and repaying it is a separate scope.

---

## 4. What it gives

The three parts share one method. Part A is what the substrate is intended to give the person working in it; Part B what it is intended to give the team; Part C what appears at the level of the organization. Each item states the intended effect, the mechanism and the status (§1.2); where evidence points against, it is stated beside the claim. Pointers to the experiments are to the Compendium, where each is written up with its design.

### 4.1 Part A. For the developer

**A1. Controlled inversion.** *Intended effect:* the human states intent and ratifies, the assistant derives, and the checks verify; the developer's effort moves from writing and reading code to specifying correctly and judging evidence. It is *controlled* because gates and ratification bound it, so more latitude for the assistant does not mean less assurance. *Mechanism:* the specification as source, phase collapse, the cycle (§3.6) and the dial. *Status:* demonstrated once in a worked example, no comparison (one specification-to-deployment chain, Compendium §7.8.D, and one regeneration from a committed specification passing the 104 tests of its own suite, §7.8.G; these show it can be done, not that it lowers effort). That inversion lowers effort or improves outcomes is a hypothesis; test designed (a staged specification-to-complete study).

**A2. More routine tasks become mechanical.** *Intended effect:* the work a developer does by hand around a change (keeping documents consistent with code, finding what a rule change made stale, writing the commit message and record, re-running checks, carrying each fixed defect forward as a test) is performed by the substrate and the assistant. *Mechanism:* derived documents, the lock, conventional commits, the ratchet, the coherence checks. *Status:* demonstrated once in a worked example for the checks (§3.5); labor saved is not measured. Against it, the substrate adds work (§4.4) and context files cost inference (§2).

**A3. A map that keeps sessions bounded.** *Intended effect:* a session loads the slice it needs, spends fewer tokens locating things and stays inside a context that still derives reliably. *Mechanism:* the sentinel and a bounded tool surface; the read-asymmetry. *Status:* exploratory measure. In KX (Compendium §7.8.E: one model, one Conduit backend, 45 structural queries, a fresh session each) answering through a routed authored map used about three times fewer tokens than unstructured code search and 1.3 times fewer than loading all documents; accuracy is not claimed, because the answer key came from the structure under test. In SX (§7.8.K, n = 2, one frontier model) localization cost was lower with the map. Bounding: TX (§7.8.J) found that layering at fixed content did not make a cold reader cheaper, and SX that a twin with its duplication removed was cheaper to change. That the benefit grows as a repository outgrows a session is a hypothesis; test designed. The map is to be small, routed and not a restated overview, given the cost finding of §2.

**A4. Less repeated prompting.** *Intended effect:* with architecture, conventions, constraints, gates and decisions in the substrate, the prompt shrinks toward behavioral intent and need not restate structure each session. *Mechanism:* the substrate carries what a good prompt would otherwise carry. *Status:* hypothesis (H-S, the substrate against an expert prompt carrying the same obligations over a long horizon); test designed, not run. The one measure points the other way for short horizons: in AX (§7.8.B, k = 5, one model, one benchmark) an expert prompt carrying the same obligations tied the full cascade on median quality, so for one increment the content matters and the vehicle does not. We claim that what a good prompt contains is specification and belongs in the substrate, not that prompting stops mattering; that claim is close to true by definition, and the open question is persistence across sessions and people. It is capacity-relative: a stronger model needs fewer words of intent either way.

**A5. Evidence in place of impression.** *Intended effect:* the developer reviews criteria, an intent diff and the results of checks that ran, not the implementation line by line, and a wrong change is intended to be rejected before a human reads it. *Mechanism:* executed gates not authored by the building agent, probes against the live system, atomic descriptive commits, the intent diff. *Status:* demonstrated once in a worked example, no comparison: in EX (§7.8.D) failing probes surfaced fifteen defects, counted by the builder, before the cycle could close. That an outside gate catches what a model's own verification misses is H-G, a hypothesis; test designed. The independent-verification arm of RND-1 (§7.8.I) returned a null by floor effect (the model did not fake its tests; n = 2), so the conditions under which the gate earns its cost are not established.

**A6. What working in the method is like.** *Observation by the author, not evidence.* The author reports that a session begins from a map instead of a re-explanation, that a corrected mistake stays corrected because the correction is on record, and that the work shifts toward deciding what is true and checking that it holds. He reports that absolute token spend rose, and the cost objection recurred in a workshop for eight practitioners (one cohort, no control; Compendium §7.8.A). These are accounts of one practitioner and one cohort, offered to motivate §7 and not as support for any claim above.

### 4.2 Part B. For teams

**B1. Auditable decisions and history.** *Intended effect:* what was decided, why, what was ruled out and what changed are on the record in files, not in people. *Mechanism:* ADRs and EDRs, atomic descriptive commits, the append-only ratification record, one source for the cascade. *Status:* design only for effect. The artifacts are in use in the author's projects and a public reference project; no third party has tested whether they carry the reasons.

**B2. Reconstruction by actors who have no memory.** *Intended effect:* a newcomer, an auditor or a fresh session can reconstruct what a change was for and which version of the intent it derived from, and regenerate with knowledge of cause. A codebase that fully satisfies the properties should be near-reconstructable; one that does not is not, since decisions were never written down. *Mechanism:* the lock as derivation fingerprint, the records, the typed history, the sentinel as entry point. *Status:* hypothesis; test designed (a memoryless-actor audit with injected divergence and a fact list for reconstruction, against the nearest rival, a decision log plus ordinary history).

**B3. Reports generated from files.** *Intended effect:* at any moment one can state where a project stands against its requirements and grades without asking anyone. *Mechanism:* criteria coverage, open questions, places a reader guessed, the intent diff, the snapshot line (§5). *Status:* design only. The coverage and open-question counts come from sensors checked on two small sample projects; no gate yet produces the snapshot line.

**B4. A quality floor that does not depend on who the practitioner is.** *Intended effect:* the substrate holds the floor, so quality depends less on the individual talent of whoever works, while the exceptional feed it rules and gates that raise everyone's floor. A related claim is that a team need not learn the method to benefit, because gates and specification steer the assistant and the reviewer reads evidence. *Mechanism:* gates and the ratchet apply alike to every contributor; shared specification and records. *Status:* **hypotheses**, both; test designed (a between-practitioner variance study; a prospective adoption by other developers). A rival prediction is that structure helps strong teams most and weak teams least, and the designs are meant to separate the two. Nothing is measured, and the author's own results cannot separate "it works" from "it works for its author".

**B5. Continuity when people leave.** *Intended effect:* knowledge that lives in people (bus-factor debt) lives instead in artifacts a successor can read. *Mechanism:* records, lock, sentinel, specification as source. *Status:* design only; hypothesis. It follows from B1 and B2 and is not tested separately.

**B6. Governance evidence.** *Intended effect:* the artifacts a change-management or audit control asks for (request, decision, gate result, history) are those the method already produces, so a governance claim can rest on a dated snapshot with its evidence and not on an assertion. *Mechanism:* change governance by construction (the specification update as the request, the record as the change record, the gate as the approval check, the history as the trail) and the governed-as-of snapshot (§5.3). *Status:* design only. Whether an auditor or regime accepts these artifacts is untested and varies; the method does not certify compliance with any standard.

### 4.3 Part C. For the organization: what emerges when every project is governed

Part C is not a separate method. It is the aggregate that appears when each project carries the substrate. The spine is the same at every scale: cheap, enforced checks that stop the line, repeated at the layers of code (a gate on every commit), team (ratification and decision records), project (a governed-as-of snapshot), portfolio (the snapshots side by side) and organization (what was decided, by whom, and what survives a departure). The idea is Toyota's *jidoka*: a loom that stops itself when a thread breaks, generalized by the Andon cord to a line any worker may halt. GS does not claim to have invented it; the proposal is that the same mechanism can be repeated at each layer, with the machine building and a person judging. *Status: design only; that the spine generalizes across layers is a hypothesis.*

**C1. The maturity ladder as the path.** *Intended effect:* an organization can say, for a given date, where each project stands against the seven properties, and the ladder from L1 to L5 gives each project a next step instead of a verdict. *Mechanism:* the snapshot of §5.3 (level, grade per property, commit, specification version, date), read as a row in a portfolio table, with the number of commits since the snapshot. *Status:* design only. No gate yet produces the snapshot line, and the instrument has not been validated (§5.4).

**C2. Reports that fall out of the substrate.** *Intended effect:* questions a leader cannot answer today without interviews become queries over files: which projects are governed and as of when; where the drift is (stale artifacts, orphan tests, criteria without a passing check, gate failures per change); what was decided, by whom and why; what survives when people leave. *Mechanism:* the decision records, the append-only ratification record, the lock and the coverage counts of §3.5 and §5.3, aggregated across repositories. *Status:* design only for the aggregate; the single-project counts were produced on small sample projects. These reports are only as honest as the snapshots behind them, which age and can be taken against a thin specification.

**C3. Andon as the team operating layer.** *Intended effect:* a team process in which gates halt the line, changes are atomic and described, decisions are recorded, and a named person ratifies what enters force; the machine builds and the human judges. *Mechanism:* the substrate of §3.3 organized as practices with roles and cadence. *Status:* **proposed**. The principles exist (the specification is the source of truth; a failing check stops the line; every escaped defect becomes a permanent check; irreversible actions need a human signature). The roles, cadence and ceremonies that would make it a process a team can follow are not defined, and whether a team other than the author's can run it is open; no team has tried it. *Hypothesis, test designed in part (a prospective adoption by other developers).*

**C4. A record of cost and outcome.** *Intended effect:* each feature carries a short ledger entry linking what it cost (generation, upkeep, review) to what happened after it shipped (usage, an agreed indicator, an experiment), each entry stating how it was measured. A decision that can be traced can be tied to an outcome. *Mechanism:* the decision records and criteria identifiers as the keys; the ledger as one more append-only file. *Status:* **proposed**, design only; nothing is built, and the paper offers no figures.

**What Part C does not claim.** No return on investment, no estimate of savings, no guarantee of quality or compliance, and no claim that governed projects add up to a governed organization: they add up to a table, and the table is only as good as its rows. A portfolio view also invites gaming, since a grade becomes a target; the instrument names that as the failure it exists to catch (a grade raised by the letter of a check without the property behind it), and nothing here prevents it. Whether leaders, teams or auditors find the reports useful is untested.

### 4.4 What it costs, and where it is expected to pay

The advantages above are not net of these costs. The substrate has to be built and kept true: specification upkeep, ratifications (cosmetic ones included), tagging derived artifacts, gate waits and failed-gate loops, and agent output for records. The cascade cost more per generation than a bare prompt: in AX it cost about 2.9 times the unstructured run and 1.4 times an expert prompt, with no return on the measured single-shot metrics. Ratifying a text is not understanding the code, and if the substrate lets a reviewer read less code, ratification may become less informative. Early in a project the substrate may be slower than an expert prompt; where it pays, if it does, is a crossover hypothesis stated in advance in the logbook designs, not an assumption. The team-level process (roles, cadence, ceremonies) is not yet defined, and whether a team other than the author's can run the method and obtain the intended effects is open.

*The author's expectation, a hypothesis:* the method is worth its cost for long-lived, multi-contributor or audit-sensitive work, and not for short-horizon work, spikes and prototypes, where an expert prompt is expected to tie. Indicators the substrate itself produces (criteria coverage, stale artifacts, orphan tests, gate failures per change, review minutes per change) can show whether it is working on a given project; none is validated as a predictor.

### 4.5 The advantages at a glance

| # | Intended effect | Status |
|---|---|---|
| A1 | Controlled inversion | Worked example; effect on effort a hypothesis, test designed |
| A2 | More routine work mechanical | Worked example (checks); labor saved not measured |
| A3 | Bounded sessions | Exploratory measure (tokens, one model); growth with scale a hypothesis, test designed |
| A4 | Less repeated prompting | Hypothesis (H-S), test designed |
| A5 | Evidence in place of impression | Worked example; H-G a hypothesis, test designed |
| A6 | The experience of the method | Observation by the author |
| B1 | Auditable decisions and history | Design only |
| B2 | Reconstruction without memory | Hypothesis, test designed |
| B3 | Reports from files | Design only |
| B4 | Floor independent of practitioner; team need not learn it | Hypotheses, test designed |
| B5 | Continuity when people leave | Design only; hypothesis |
| B6 | Governance evidence | Design only |
| C1 | Maturity ladder as the path; portfolio view | Design only |
| C2 | Portfolio reports from the substrate | Design only |
| C3 | Andon as the team operating layer | Proposed; hypothesis, test designed in part |
| C4 | Record of cost and outcome | Proposed; design only |

---

## 5. The instrument

The instrument tests whether a project's substrate is in the condition a stateless reader needs. It is an instrument, not a mechanism: the mechanisms are the bridge, the sentinel and phase collapse. A project is graded from its artifacts, as a stateless reader would meet them, and raising a grade by the letter of a check without the underlying property is the failure the instrument exists to catch. The anchored scoring guide (`docs/white-paper/GS_Rubric_ScoringGuide.md`) is needed to grade a real project.

### 5.1 Seven properties

| Property | A checker looks at | Failure named (F) |
|---|---|---|
| **Self-describing** (explains itself to a stranger) | an explicit statement of intent and of scope; conventions written, not inferred | Empty Map |
| **Auditable** (decisions on record) | conventional commits; decision records; a current status artifact; whether the *why* is recoverable | Amnesia Stack |
| **Verifiable** (correctness computed, not claimed) | a blocking verification layer; tests that target contracts; whether checks can fail (mutation score) | Unbound Spec |
| **Executable** (specification bound to the running system) | a contract suite passing against a live environment; build from a clean clone | Frozen Spec |
| **Defended** (rules enforced, not suggested) | gates that fire and block; branch protection; a declared trust boundary; each gate traced to its incident | Open Gates |
| **Bounded** (explicit scope and seams) | artifacts within the reader's read budget; enforced size limits; the sentinel with its five categories | Spreading Boundary |
| **Composable** (units combine without unexpected coupling) | enforced dependency direction; duplication; explicit interfaces | Tangled Web |

Each property's lowest grade is its named failure. Five are **audit-facing**, checkable over a project's life by a person accountable for it (Self-describing, Auditable, Verifiable, Executable, Defended; the acronym SAVED); two are the **engineering layer** (Bounded, Composable) that keeps the five true under change. The grouping is by audience, not a claim that the properties are independent.

### 5.2 Letters and levels

Each property is graded with a **letter from A to F**, like a school report card, with the evidence it rests on (file and line) and one step that would raise it. **A** is the top band, 90 to 100 on a per-property 0-to-100 scale whose procedure this paper does not define: the property is enforced, with no silent way around the check, and tied to the running system. **F** is the named failure. **Proposed anchors for B to E, not yet calibrated against real projects**, given in words and not as numeric cutoffs: **B**, enforced over most of the surface, with a known way around the check or no run against the live system; **C**, present and looked at but advisory, so a failing check does not stop the change; **D**, partial, present in some units or artifacts and absent in others, with no check; **E**, stated once as intent and not applied. A numeric display (1 to 10, half points at most) would carry the same information. A grade is admissible only when the assessor can name the evidence and the anchor it is closest to. **Executable** is graded only when a formal behavioral contract exists to run, otherwise N/A (whether an N/A property can be governed is not defined here). **Defended** has a human ceiling: whether adversarial challenge was anticipated needs human review, so an automated grade is provisional.

Levels **L1 to L5** apply per property, and a headline overall maturity level is reported beside the letters (how property levels combine into it is not defined here). **L4** is *enforced and bound*: enforced with no silent skip path and tied to reality; it is the level of letter A. **L5** is a *trend*, not a state: L4 sustained across at least three dated snapshots (a provisional convention), where a score may legitimately drop when the specification raises the bar, so snapshots are compared at the same specification version or the change is annotated. L1 is ad hoc; L2 and L3 are not defined here beyond L3 being the floor in the definition below.

### 5.3 Governed as of

A project is never finished; a score is a snapshot against the specification in force:

`level, grade per property, score ± confidence, rubric version, commit, specification version, date`

A project is **governed as of a date** when, at one commit and against one version of its specification, each of the seven properties is at L4, none is below L3, and the evidence is in the audit trail. "Governed" always means L4; the seven are a fixed minimum (a team may add properties, not drop any); a team that aims lower reports "L3 declared", never "governed". The claim says nothing about later commits or about what the specification does not state, so **a project can be governed against a thin specification**. A snapshot ages, so a report states how many commits separate it from the head. The word is *aligned with* another maturity model, never *equivalent to*, never *certified*. Where an AI reader scores a property, the score is a guide: run it independently more than once and quote the range; confidence rises when two independent runs land within one letter.

The companion definition is **spec completeness**, kept as three numbers that are never combined: criteria coverage (ratified criteria with a passing check over all ratified criteria), open-question markers (a specification with any open marker is not implemented), and the places a stranger given only the specification guessed. The lifecycle table (Compendium §8.19) states what the method does not yet cover: keeping the lights on and disposal.

### 5.4 What the instrument has and has not shown

No experiment measured the letter or level scales, and no reliability is reported for them. An earlier instrument scored each property 0, 1 or 2 for a 14-point total; it is retired as a scorecard and appears only in the Compendium and experiment records, where the experiments were measured with it. Its one external check, three independent implementations, is a feasibility check at n = 3, circular for one repository, and gives **no validity evidence** yet. The instrument grades how a project was structured, not what it selected (a dependency policy must be stated as a constraint). It does not predict outcomes; whether each property predicts its own outcome and not the others is open (§7).

---

## 6. What this paper does not claim

- It reports no experimental result as a finding and states no speed or productivity multiplier. Whether AI-assisted development is faster, with or without GS, is contested in the literature of §2 and untested here.
- It does not claim that GS produces better code than a strong model or a strong expert prompt. In the author's single-shot comparisons (Compendium §7.8.B, §7.8.L) a structured specification separated from unstructured use on structural metrics and tied an expert prompt with the same obligations; the substrate's value over a long horizon is open.
- It does not claim that the mechanical advantages persist as models strengthen; the working assumption is the opposite (§3.6).
- It does not claim that the method works for every team, that a team-level process exists, or that others obtain the author's results; A6 is one practitioner's observation.
- It does not claim that the instrument is valid or reliable, or that a governed snapshot certifies compliance with any standard.
- It does not claim that the coherence checks reduce defects, that a passing test proves anything, or that GS removes unwritten tacit knowledge, novelty and abandonment effects, or the cost of review.
- It does not claim to cover the lifecycle (keeping the lights on and disposal are not covered; ideation only in part), and it makes no commercial claim, none about price, market or adoption.
- Where an advantage carries the tag *design only* or *hypothesis*, that is all it has.

---

## 7. The research programme

The advantages of §4 and the instrument of §5 are tested, if at all, in separate work that cites this paper and the Compendium. Nothing below is a result. Each question names the design that would answer it; the logbook records each design in the same voice whether the outcome is positive or negative. The designs assume the honest prior that the substrate may be slower or equal at first.

- **Durability under iteration (A4, A5, B4).** Do enforced gates halt erosion over a long chain of changes where advisory guidance only shifts the starting point (H-S, the substrate against an expert prompt with the same obligations), and does the substrate's upkeep repay itself as a repository grows (a thirty-change chain with a crossover point declared in advance)?
- **Navigation economy (A3).** Does a routed authored map lower the cost per accepted change once a repository outgrows a session, separately from bounding what must be read? Three repository sizes, a stale-map control.
- **Executed-verification yield and the external guarantee (A5, H-G).** For defects visible only in the real runtime, does executing the artifact in the open catch a share that static checks, self-written tests and effort-matched review miss?
- **Coherence and reconstructability (B2, B3, B5).** With identifiers, the lock and the co-change gate, do memoryless auditors detect injected divergence and reconstruct history better than a decision log with ordinary history?
- **Practitioner variance and learning (B4).** Holding the AI constant, does the substrate narrow the spread between practitioners, and does using it replace training? A prospective adoption by other developers is the external test the author's results cannot supply.
- **Specification-to-complete (A1).** Given a fixed reviewed specification, how fast and at what cost does an assistant reach a verified complete implementation in stages, with setup and upkeep counted and escapes after completion measured?
- **Instrument validity (§5), and the organization layer (Part C).** Does each property predict its own outcome and not the others, on projects the method never guided? **The capacity moderator** is a factor inside the above, not a separate study.

Pointers: Compendium (§4.5.1, §4.6, §7.8, §8.19 to §8.20); the experiment logbook and protocol (`docs/experiments/`); the paper tree (`docs/white-paper/tree/`).

---

## 8. Related work

GS sits in a lineage of work on specifying software and instructing models. Each neighbor supplies part of the picture; GS names the obligation they leave less explicit, that a stateless reader must be able to *derive* correct output from the artifacts alone, and proposes a graded instrument for it whose validity is untested.

**Specification theory and structural disciplines.** Hoare (1969), Parnas (1972), Meyer (1992), Jackson (2001) and Brooks (1987) established the axiomatic, information-hiding, contractual, problem-frame and essential-versus-accidental views of specification. Clean code, SOLID, test-driven development and domain-driven design (Martin, 2008, 2017; Beck, 2003; Evans, 2003) are the disciplines of §3.1; decision records come from Nygard (2011). Each specifies for a human who can still ask, remember and infer. Perry and Wolf (1992), Lehman (1980) and de Silva and Balasubramaniam (2012) name and survey architectural erosion.

**Spec-driven development.** Kiro (Swaminathan & Singh, 2025) and Spec Kit (Delimarsky, 2025) scaffold a requirements, design and tasks workflow; Piskala (2026) describes tiers of specification rigor; traceSDD (Panda, 2026) requires a per-line requirement citation in generated code. Each makes part of the obligation explicit; GS supplies a criterion for what the specification must contain and an instrument for whether it does. No claim is made that GS outperforms any of them.

**Agent context files and harnesses.** Chatlatanagulchai et al. (2025) study context files across repositories, Galster et al. (2026) the configuration mechanisms of agentic tools, Gloaguen et al. (2026) whether context files help (no general gain, higher cost). Context engineering is surveyed by Mei et al. (2025) and Anthropic (2025). Böckeler (2026) divides a harness into guides and sensors; the verify half of GS is not distinct from harness engineering.

**Code generation, measured degradation and loss of gains.** HumanEval (Chen et al., 2021), EvalPlus (Liu et al., 2023), SWE-bench (Jimenez et al., 2024) and SWE-agent (Yang et al., 2024) establish that agents resolve real tasks. Becker et al. (2025), He et al. (2026) and SlopCodeBench (Orlanski et al., 2026), summarized in §2, bear on how gains erode; they do not test GS. Thirolf (2025) identifies the same implicit-context failure through traceability gaps; a bachelor's thesis, cited as independent problem identification, not validation.

**Prompting, retrieval, long context, contamination.** Few-shot and chain-of-thought prompting (Brown et al., 2020; Wei et al., 2022) shape the transient input; GS treats much of it as specification content delivered through a transient channel. Retrieval-augmented generation (Lewis et al., 2020) retrieves at query time; GS authors the structure instead of inferring it. Yarmoluk and McCreary (2026) benchmark the compact knowledge graph that the reading side generalizes. Memorization threatens any benchmark in public training data (Magar & Schwartz, 2022; Dong et al., 2024), and reward hacking in test-graded settings is catalogued by ImpossibleBench (Zhong et al., 2025), EvilGenie (Gabor et al., 2025) and the Reward Hacking Benchmark (Thaman, 2026).

**The through-line.** Most neighbors leave derivability as an assumption: prompt engineering patches it per session, retrieval infers it at query time, specification theory trusts a human reader to close gaps, evaluation measures the executor, and spec-driven tools supply a workflow. What GS adds is the criterion, the substrate that keeps it true across sessions, and the instrument. It does not add a new property of software, and it does not show an advantage over a prompt that carries the same content.

---

## 9. Changelog: from 4.0 to 5.0

Version 4.0 (Zenodo preprint, 31 July 2026) was a method paper that also carried its evidence. Version 5.0 keeps its voice, thesis, bridge, sentinel and phase collapse, and changes what the paper is for.

**Kept.** The thesis; the discipline of removal and the structural disciplines as raw material; the three contributions and the honest map of what is the field's; the bridge, its asymmetry and the read-asymmetry; the sentinel and its link to context degradation; phase collapse; cost inversion; the ratchet and the specification query; the contract-form cascade; the seven properties with their failure modes.

**Added.** A summary for leaders; Part C (the organization layer) and a closing "Where to start"; proposed anchors for letters B to E; the stateless writer; a motivation section citing verified studies; the substrate as a defined whole (ADR and EDR, atomic descriptive commits, guides and sensors, the debt ratchet); the lock, companion coherence checks and ratification; the cycle with triage; a minimal start; the capacity-relative bound; the specificity dial; Part A and Part B of what the method gives, with mechanisms and status tags; the instrument with letters, levels and "governed as of"; a statement of what is not claimed; a research programme.

**Changed.** The 0-to-14 score is retired from the paper's definitions. The abstract carries no experimental figures. The statement that a complete specification makes prompt engineering unnecessary is withdrawn and replaced by a narrower hypothesis (A4). The practitioner corollaries ("what it means") attached to each experiment in 4.0 are not carried over, and the observational field evidence survives only as one labelled observation (A6).

**Moved out.** The experiments and their tables, the production projects, the threats to validity, the expert-prompt analysis and the H-S design are in the Compendium (§7.8 and its additions), the logbook and the papers that will report them. The lexicon of coined terms is replaced by definitions in the text. Section 4 cites a few figures only as pointers to where a status was established.

**Why.** The experimental claims of 4.0 were over-labelled relative to their designs. Moving them out lets each result be stated once, with its design, where it can be checked.

---

## 10. Where to start

The path is deliberately small and does not require adopting everything.

1. **Look at one project against the seven properties.** Pick a project that matters, grade each property with the evidence behind it (the file and line) and one step that would raise it. Treat the grades as a map, not a score to defend.
2. **Add the sentinel and one blocking gate.** A small root file with the five categories, one specification slice with identified criteria, and one check that already exists in your toolchain, made to stop the change when it fails.
3. **Ratchet.** Each defect that escapes becomes a test, a rule or a record before it is closed. Add the lock and the coherence checks only after this has become routine.
4. **For a leader:** ask for a governed-as-of snapshot of one project, with its evidence, before asking for a portfolio.

Applied work and services live at pragmaworks.dev.

---

## References

Every entry was confirmed against a primary or indexing source (log: `docs/white-paper/ieee-access/references-verification-log.md`; Becker et al. and He et al. confirmed on 2026-10-05 against the arXiv record).

- Anthropic (2025). Effective context engineering for AI agents. Anthropic Engineering Blog, Sep. 29, 2025. https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
- Beck, K. (2003). *Test-Driven Development: By Example.* Addison-Wesley.
- Becker, J., Rush, N., Barnes, E., & Rein, D. (2025). Measuring the impact of early-2025 AI on experienced open-source developer productivity. arXiv:2507.09089.
- Böckeler, B. (2026). Harness engineering for coding agent users. martinfowler.com, Apr. 2, 2026. https://martinfowler.com/articles/harness-engineering.html
- Brooks, F. P. (1987). No silver bullet: Essence and accidents of software engineering. *IEEE Computer*, 20(4), 10-19.
- Brown, T. B., et al. (2020). Language models are few-shot learners. *NeurIPS* 33, 1877-1901.
- Chatlatanagulchai, W., et al. (2025). Agent READMEs: An empirical study of context files for agentic coding. arXiv:2511.12884.
- Chen, M., et al. (2021). Evaluating large language models trained on code. arXiv:2107.03374.
- de Silva, L., & Balasubramaniam, D. (2012). Controlling software architecture erosion: A survey. *J. Systems and Software*, 85(1), 132-151.
- Delimarsky, D. (2025). Spec-driven development with AI: Get started with a new open source toolkit. The GitHub Blog, Sep. 2, 2025.
- Dong, Y., et al. (2024). Generalization or memorization: Data contamination and trustworthy evaluation for large language models. *Findings of ACL 2024*, 12039-12050.
- Evans, E. (2003). *Domain-Driven Design.* Addison-Wesley.
- Gabor, J., Lynch, J., & Rosenfeld, J. (2025). EvilGenie: A reward hacking benchmark. arXiv:2511.21654.
- Galster, M., et al. (2026). Harness engineering for agentic AI coding tools: An exploratory study. arXiv:2602.14690.
- Gloaguen, T., et al. (2026). Evaluating AGENTS.md: Are repository-level context files helpful for coding agents? arXiv:2602.11988.
- Gordon, C. S. (2024). The linguistics of programming. *Onward! 2024*, 162-182. https://doi.org/10.1145/3689492.3689806
- He, H., Miller, C., Agarwal, S., Kästner, C., & Vasilescu, B. (2026). Speed at the cost of quality: How Cursor AI increases short-term velocity and long-term complexity in open-source projects. *MSR 2026*. arXiv:2511.04427.
- Hoare, C. A. R. (1969). An axiomatic basis for computer programming. *CACM*, 12(10), 576-580.
- Jackson, M. (2001). *Problem Frames.* Addison-Wesley.
- Jimenez, C. E., et al. (2024). SWE-bench: Can language models resolve real-world GitHub issues? *ICLR*. arXiv:2310.06770.
- Lehman, M. M. (1980). Programs, life cycles, and laws of software evolution. *Proc. IEEE*, 68(9), 1060-1076.
- Lewis, P., et al. (2020). Retrieval-augmented generation for knowledge-intensive NLP tasks. *NeurIPS* 33, 9459-9474.
- Liu, J., et al. (2023). Is your code generated by ChatGPT really correct? *NeurIPS 2023*. arXiv:2305.01210.
- Magar, I., & Schwartz, R. (2022). Data contamination: From memorization to exploitation. *ACL 2022 (Short Papers)*, 157-165.
- Martin, R. C. (2008). *Clean Code.* Prentice Hall. Martin, R. C. (2017). *Clean Architecture.* Pearson.
- Mei, L., et al. (2025). A survey of context engineering for large language models. arXiv:2507.13334.
- Meyer, B. (1992). Applying "design by contract". *IEEE Computer*, 25(10), 40-51.
- Morris, C. W. (1938). *Foundations of the Theory of Signs.* University of Chicago Press.
- NASA (1999). *Mars Climate Orbiter Mishap Investigation Board Phase I Report.* Nov. 10, 1999.
- Nygard, M. (2011). Documenting architecture decisions. Cognitect Blog, Nov. 15, 2011.
- Orlanski, G., et al. (2026). SlopCodeBench: Benchmarking how coding agents degrade over long-horizon iterative tasks. arXiv:2603.24755 (rev. May 2026).
- Panda, S. (2026). Citation discipline in spec-driven development (traceSDD). arXiv:2606.30689.
- Parnas, D. L. (1972). On the criteria to be used in decomposing systems into modules. *CACM*, 15(12), 1053-1058.
- Perry, D. E., & Wolf, A. L. (1992). Foundations for the study of software architecture. *ACM SIGSOFT SEN*, 17(4), 40-52.
- Piskala, D. B. (2026). Spec-driven development: From code to contract in the age of AI coding assistants. arXiv:2602.00180.
- Ralph, P., et al. (2020). Empirical standards for software engineering research. arXiv:2010.03525.
- Swaminathan, N., & Singh, D. (2025). Introducing Kiro. Kiro Blog, Jul. 14, 2025.
- Thaman, K. (2026). Reward Hacking Benchmark: Measuring exploits in LLM agents with tool use. arXiv:2605.02964.
- Thirolf, T. (2025). *Analysis of Project-Intrinsic Context for Automated Traceability Between Documentation and Code.* Bachelor's thesis, KIT (KASTEL).
- Wei, J., et al. (2022). Chain-of-thought prompting elicits reasoning in large language models. *NeurIPS* 35, 24824-24837.
- Yang, J., et al. (2024). SWE-agent: Agent-computer interfaces enable automated software engineering. *NeurIPS 2024*. arXiv:2405.15793.
- Yarmoluk, D., & McCreary, D. (2026). Benchmarking knowledge retrieval architectures: RAG, GraphRAG, and compact knowledge graphs. v0.6.2. https://github.com/Yarmoluk/ckg-benchmark
- Zhong, Z., Raghunathan, A., & Carlini, N. (2025). ImpossibleBench: Measuring LLMs' propensity of exploiting test cases. arXiv:2510.20270.

---

## Materials

The Compendium (`docs/white-paper/GenerativeSpecification_Compendium.md`) is the canonical master from which this paper derives; where this paper compresses, the Compendium expands. The experiments, their data and the replication instructions are in `experiments/` of the public repository and in the Experiment Supplement.
