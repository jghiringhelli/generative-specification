# Start Here ΓÇö Apply Generative Specification to Your Project

This is the practical entry point. You can get a working GS setup on your own project in under an hour. No tools required beyond what you already use.

---

## What You Are Setting Up

A **generative specification** is an artifact set that is self-contained enough that a stateless reader ΓÇö a model with no prior context ΓÇö can derive correct, coherent implementation from it alone. It has seven properties: Self-describing, Bounded, Verifiable, Defended, Auditable, Composable, Executable.

You will produce:
1. A **GS document** ΓÇö the single source of truth for what your project is and how it must be built
2. An **architectural constitution** (`CLAUDE.md` or equivalent) ΓÇö the operative grammar an AI reads before every session
3. A **quality gate set** ΓÇö the automated constraints that make incorrect output architecturally unreachable

---

## Option A ΓÇö New Project (Greenfield)

### Step 1: Write the GS document

Create `docs/spec.md`. Fill in these sections:

```markdown
# [Project Name] ΓÇö Generative Specification

## Domain
[One paragraph: what this system does, for whom, and why it exists.
Be specific. "A task management tool" is not a domain statement.
"A CLI tool for tracking billable hours across client projects, outputting
to CSV for import into QuickBooks" is.]

## Functional Scope
[What is in scope for this specification. Use numbered requirements.
Each requirement must be verifiable ΓÇö if you can't write a test for it,
rewrite the requirement until you can.]

### Out of Scope
[Explicit list. Things left out of scope are things the AI will fill
with its own judgment. Name them so the gap is deliberate, not accidental.]

## Architecture
[The architectural decisions already made. Layer structure, technology
choices, patterns mandated. Not "we might use PostgreSQL" ΓÇö "PostgreSQL
is the persistence layer. No other database is permitted."]

## Quality Gates
[The constraints that apply to this project specifically. Coverage threshold.
Complexity ceiling. Any project-specific rules (e.g., "all API responses must
include a requestId for tracing").]

## Acceptance Criteria
[How you will know the project is done. Runnable tests, measurable outputs,
observable behaviors. Not "the UI should look good."]
```

### Step 2: Derive the architectural constitution

From the GS document, write `CLAUDE.md` ΓÇö the instruction file every AI session reads first. Template:

```markdown
# [Project Name] ΓÇö Architectural Constitution

## What This Project Is
[Two sentences from the GS document Domain section.]

## Layer Structure
[The exact layer names and their rules. E.g.: "Controllers call Services.
Services call Repositories. No controller calls a Repository directly.
No Repository imports from Services."]

## Naming Conventions
[The naming rules. Tables, files, functions, variables. State the rule,
not the preference: "Repository classes end in Repository. Not Repo,
not Store, not Manager."]

## Forbidden Patterns
[What must not exist. E.g.: "No console.log in production code.
No any type in TypeScript. No raw SQL strings outside Repository classes."]

## Technology Decisions
[Stack choices and why. What replaces what. E.g.: "Jest for testing.
Not Vitest. Not Mocha. Jest."]

## Known Pitfalls
[Things this specific project has hit before. Type quirks. Library gotchas.
Configuration traps. Document them here so the next session does not
repeat them.]
```

### Step 3: Apply quality gates

Copy the relevant gates from this repository's [`quality-gates/gates/`](quality-gates/gates/) into your project's `.forgecraft/gates/` directory, or reference them in your CI pipeline. Start with:

- [`conventional-commits.yaml`](quality-gates/gates/conventional-commits.yaml) ΓÇö enforces commit discipline
- [`adr-files-emitted.yaml`](quality-gates/gates/adr-files-emitted.yaml) ΓÇö ensures decisions are documented
- [`jest-no-failed-tests.yaml`](quality-gates/gates/jest-no-failed-tests.yaml) ΓÇö if you use Jest

Then add the technology-specific gates for your stack.

---

## Option B ΓÇö Existing Project (Brownfield)

The GS methodology works backwards from what exists. The goal is to surface and externalize the implicit decisions that are currently only in someone's head.

### Step 1: Archaeology pass

Run a session with this prompt:

```
Read the entire codebase. Produce a list of:
1. Every architectural decision that is implied by the current structure
   but not documented anywhere.
2. Every naming convention currently in use.
3. Every forbidden pattern (things that don't exist in the codebase that
   would break it if introduced).
4. Every external dependency and what it is responsible for.
5. Any patterns that appear in some files but not others ΓÇö inconsistencies
   that suggest an undocumented decision was never fully applied.

Do not suggest improvements. Document what is actually here.
```

### Step 2: Write the constitution from the archaeology

Take the session output and write the `CLAUDE.md`. Every item from the archaeology pass becomes an explicit rule. The architectural constitution is not aspirational ΓÇö it describes the system as it is, so every future session starts from a correct model of what exists.

### Step 3: Audit against the seven properties

Score your current GS document against the rubric:

| Property | Question | Score (0ΓÇô2) |
|---|---|---|
| **Self-describing** | Does the spec contain its own domain context, fully, without external references? | |
| **Bounded** | Is the scope explicit? Is out-of-scope named? | |
| **Verifiable** | Can every requirement be tested? | |
| **Defended** | Are hooks, linting, and CI enforcing the rules automatically? | |
| **Auditable** | Are ADRs emitted as committed files? Is the changelog substantive? | |
| **Composable** | Are cross-cutting concerns (auth, error handling, logging) defined once? | |
| **Executable** | Has a test suite run against a live environment and passed? | |

Any property scoring 0 is a gap. Gaps concentrate correction iterations. Fix the lowest-scoring property first.

---

## Verifying Your Setup Works

Run one session with only your GS document and architectural constitution in context ΓÇö no other files, no prior conversation. Ask the model to:

1. Describe the system's architecture in its own words
2. Implement one small, bounded feature
3. Name the test it would write to verify the feature

If the description is accurate, the implementation follows your layer rules, and the test is meaningful ΓÇö your GS setup is working. If any of these fail, the gap is in the specification, not the model.

---

## Reproducing the Rx Experiment

The fastest way to see the methodology produce a verified, test-passing result from a GS document alone:

```bash
git clone https://github.com/jghiringhelli/generative-specification
cd generative-specification/experiments/rx
docker compose up -d    # starts PostgreSQL
# Run the GS document (experiments/rx/spec/conduit-gs.md) through your
# preferred model with the runner prompts in runner/prompts/
# Then:
npm test                # 104 tests, 0 failures expected
```

The GS document is the reproducible artifact. ForgeCraft produced it but is not required to run the experiment.

---

## Questions

Open an issue or start a discussion in this repository. The methodology is under active development ΓÇö every gap found is a quality gate waiting to be written.

ΓåÆ [Contribute a quality gate](quality-gates/CONTRIBUTING.md)  
ΓåÆ [White paper](docs/white-paper/GenerativeSpecification_WhitePaper.md)  
ΓåÆ [Compendium (full canonical source)](docs/white-paper/GenerativeSpecification_Compendium.md)  
ΓåÆ [Practitioner Protocol](docs/white-paper/GenerativeSpecification_PractitionerProtocol.md)
