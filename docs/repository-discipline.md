# Repository Discipline

*The tool-agnostic reference for what a GS-compliant repository contains, how it's touched, and what discipline survives the absence of tooling.*

This document consolidates the repo-mechanical content scattered across the White Paper (§6, artifact grammar), the Practitioner Protocol (§3, §G, §8.4-§8.5), the Bible (§6, §7), and the pure-GS variants of every skill in `pragmaworks/skills/`. It is the single reference for the workshop, for new practitioners, and for the "what do I do without ForgeCraft installed?" question.

The discipline below works on any repository, in any stack, using only `git`, a text editor, and the practitioner's attention. ForgeCraft and pragmaworks make the discipline cheap and survivable under operational pressure — they do not replace it. A practitioner who understands this document can run GS by hand. A practitioner who installs the tools without understanding it will produce green CI on broken artifacts.

---

## Preface — What the discipline is for

The repository is the stateless reader's address space. Every AI session begins with no memory of the prior one. The repository must answer, without human narration: *what is this system, why does it exist, what is correct here, what is not.*

Repository discipline is the set of mechanical practices that keep the address space answerable. Everything in this document derives from one principle: **a session that begins with a correct repository inherits the discipline; a session that begins with a corrupt repository inherits the drift.**

---

## §1 — The five mandatory artifact types

Every GS-compliant repository contains five categories of artifact. They map to a grammar; missing any category creates a derivability gap that the AI fills with guesses.

### 1.1 Architectural constitution

The root sentinel file. Contains: identity (what this system is), standards (the disciplines this repo follows), constraints (what is forbidden), tool sequencing (what to run in what order), and routing (where to look for what).

**Filename is agent-specific:** `CLAUDE.md` (Claude), `AGENTS.md` (OpenAI), `.cursor/rules/*.md` (Cursor), `.github/copilot-instructions.md` (Copilot), `.windsurfrules` (Windsurf), `GEMINI.md` (Gemini CLI). The concept is universal; the filename is not.

**One file or many?** If the constitution fits in ~500 lines, one file. If it exceeds that, split into a sentinel navigational tree: a root file always loaded plus scoped child files loaded by routing condition. The leaf nodes collectively must cover all five categories.

### 1.2 Functional specification

What the system does, for whom, under what conditions. Lives at `docs/specs/spec.md` (or `docs/PRD.md` if you prefer that name). Contains: objective, user stories or use cases, acceptance criteria, NFR contracts (performance, security, compliance, audit). The harness derives from the NFR section; the implementation derives from the use cases.

### 1.3 Architecture decision records

The audit trail of *why*. Lives at `docs/adrs/0001-*.md` … `docs/adrs/NNNN-*.md`. Format: MADR (Markdown Any Decision Record) — one decision per file, with status (proposed/accepted/superseded), context, alternatives, consequences. Every non-trivial architectural decision lands as an ADR. Decisions overturned by later decisions get marked `status: superseded by ADR-NNNN`.

### 1.4 Structural diagrams

The system's parsed structural representation. PlantUML, Mermaid, or C4 — whichever your team can read fluently. Lives at `docs/diagrams/`. Required diagrams: container view (what services exist), component view for any non-trivial service, sequence diagram for the three or four most load-bearing flows.

### 1.5 Use cases and bound prompts

Behavioral contracts. Lives at `docs/specs/use-cases.md` (or split per use case under `docs/specs/use-cases/`). Each use case names: the actor, the precondition, the main flow, the postcondition, the failure modes, and what is out of scope. Bound prompts (DP-XXX style — specific, scope-locked AI prompts) live at `docs/specs/prompts/` and reference the use cases they implement.

---

## §2 — The sentinel navigational tree

The root sentinel file is always loaded into AI context. Therefore it must be bounded (~500 lines). The completeness rule: between the root and every leaf, the tree must cover **five categories**:

| Category | What it answers |
|---|---|
| Architectural identity | What this system is, what kind of project this is |
| Standards | Which disciplines this repo follows (TDD, DDD, hexagonal, REST, etc.) |
| Constraints and prohibitions | What is forbidden, what shortcuts are not allowed |
| Tool sequencing | What to install, what to run, in what order, what each failure means |
| Routing | Where to look for what — pointers from the root to deeper specs |

A constitution that omits any category will produce sessions that drift in the corresponding dimension. Tool sequencing is the category most commonly missing: the AI infers from context, sees three valid setups, picks one, half-installs it, fails halfway, leaves the repo in a weird state. State the order explicitly.

---

## §3 — Branch isolation

**Never modify `main` directly.** Every GS flow operates on a fresh branch:

- `pragmaworks/audit-<timestamp>` — read-only audit
- `pragmaworks/remediate-<timestamp>` — fix cycle, one DP-XXX per commit
- `pragmaworks/migration-<timestamp>` — migration audit + bootstrap
- `feat/<scope>-<description>` — normal feature work
- `fix/<scope>-<description>` — normal fix work
- `chore/<scope>-<description>` — non-functional repo work

The branch is a unit of accountability. A reviewer asks: *what is this branch trying to do?* If the answer is more than one sentence, the branch is too broad — split it.

**Branch protection** on `main` (configurable via `gh api repos/<owner>/<repo>/branches/main/protection` or the GitHub UI) enforces:

- Required reviews (minimum 1 for solo, 2 for team)
- Required status checks (CI must pass, cascade-check must pass)
- No direct pushes (force-push to main is refused even with admin)
- Require linear history (no merge commits — squash or rebase)

The protection is what makes the discipline survive operational pressure. Without it, "I'll just push the fix directly this time" becomes the failure mode that detonates the cascade.

---

## §4 — Conventional commits as cascade trigger

The commit type is the cascade trigger. Each prefix mandates a corresponding artifact touch:

| Prefix | Means | Must also touch |
|---|---|---|
| `feat(scope):` | New feature | A spec file (`docs/specs/spec.md` or `docs/specs/use-cases/*.md`) |
| `fix(scope):` | Bug fix | A test file that reproduces the bug |
| `refactor(scope):` | Structural change without behavior change | (no extra; but no spec or test changes allowed in same commit) |
| `docs(scope):` | Documentation change | (the docs themselves) |
| `chore(scope):` | Non-functional work (deps, tooling, build) | (none) |
| `test(scope):` | Test-only change | (the test itself) |
| `spec(scope):` | Spec change | An ADR file (`docs/adrs/NNNN-*.md`) |
| `arch(scope):` | Architecture change | An ADR + a diagram update |
| `verify(deploy):` | Deployment verification | A capture of the verification result (`pragmaworks/verify-<timestamp>/results.json` or equivalent) |

A `feat:` commit without a spec touch is incoherent — there is no source of intent for the code to derive from. Reject the commit; rework the change as either two commits (spec first, code second) or revise the spec in the same commit.

---

## §5 — The doc-first cascade

Every change to a running system consists of two decisions: *what* to change, and *which artifacts* that change affects. The cascade is the order in which artifacts are touched:

```
1. Sentinel / standards  (root constitution)
2. Specification         (docs/specs/spec.md, use-cases)
3. ADR                   (docs/adrs/, recording the decision)
4. Diagram               (docs/diagrams/, if structure changed)
5. Implementation        (src/)
6. Harness               (tests/, hurl, k6)
7. Deployment scripts    (infra/, terraform, railway.toml)
8. Monitoring contract   (docs/specs/monitoring-spec.md if T3 is active)
```

**The doc-first rule:** a downstream artifact never changes without the upstream one having changed first. The reason is derivability — the AI must be able to derive any layer from the one above. If implementation changes without spec, the spec no longer derives the implementation. The cascade is poisoned.

**Minimum cascade depth.** Not every change requires touching all eight layers. Determine the minimum:

- **Identity / constraint change** → all eight layers downstream
- **New feature** → spec, ADR (if non-trivial), use case, implementation, tests, possibly deployment + monitoring
- **Bug fix** → test (reproducing), implementation, possibly ADR (if the fix reveals a wrong assumption)
- **Refactor** → implementation, tests (no spec or behavior change allowed)
- **Doc clarification** → docs only
- **Chore** → the chore artifact only

Name the depth before writing code. A change applied at the wrong depth detonates the cascade silently.

---

## §6 — Gates: pre-commit, pre-merge, pre-deploy

In a ForgeCraft-governed repo, hooks at `.claude/hooks/*.sh` enforce these checks. Without ForgeCraft, run them manually before each commit / merge / deploy.

### 6.1 Pre-commit (run before every `git commit`)

```
- [ ] Conventional commit prefix matches the file changes
- [ ] No secrets / credentials / API keys in staged content
- [ ] No `.env` files staged (unless explicitly intended)
- [ ] Test suite passes
- [ ] Linter passes
- [ ] Build succeeds (if applicable)
- [ ] If the commit prefix is `feat:`, a spec file is in the diff
- [ ] If the commit prefix is `fix:`, a test file is in the diff
- [ ] If the commit prefix is `spec:`, an ADR is in the diff
```

Failing any check: do not commit. Fix the gap, then re-attempt.

### 6.2 Pre-merge (run before every merge to main)

```
- [ ] All pre-commit checks pass for every commit in the branch
- [ ] PR has the minimum required reviewers (per branch protection)
- [ ] CI is green
- [ ] No "WIP" or "DRAFT" or "TODO" in the diff
- [ ] No commented-out code in the diff
- [ ] The cascade check (§7) is green
- [ ] If this is a hotfix, the documentation debt is logged for next session
```

### 6.3 Pre-deploy (run before every push to production)

```
- [ ] Pre-merge checks all pass
- [ ] Deployment scripts have been updated if the spec changed
- [ ] Monitoring contract (docs/specs/monitoring-spec.md) is current
- [ ] Rollback plan is documented (where? to what? in what time bound?)
- [ ] Harness will be run against the deployed artifact (see §6 verify-deploy in skills)
```

---

## §7 — The 5-step cascade check (manual)

Walk this checklist at session start, before every merge, before every deploy:

### Step 1 — Sentinel tree completeness

- [ ] Root constitution exists and is under the bounded line limit
- [ ] All five categories (§2) are covered between root and leaves
- [ ] No leaf references a file that doesn't exist
- [ ] No file is referenced by no leaf

### Step 2 — Spec/ADR alignment

- [ ] Every ADR references a spec section that still exists
- [ ] Every spec section has at least one ADR justifying it (or `provenance: initial-authoring`)
- [ ] No ADR with `status: superseded` is referenced by a non-superseded ADR

### Step 3 — Spec/code alignment

- [ ] Every public function / type / exported name in `src/` traces to a use case or NFR contract
- [ ] Every use case has at least one implementing file
- [ ] No "ghost" code: implementation that no spec section explains

### Step 4 — Spec/harness alignment

- [ ] Every NFR contract has at least one harness test (hurl, k6, unit, integration, e2e)
- [ ] Every harness test cites the spec section it derives from (in a comment or doc string)
- [ ] No "ghost" tests: tests that no spec section explains

### Step 5 — No orphan artifacts

- [ ] No use cases without implementation (use case → no code = unfulfilled promise)
- [ ] No test files for use cases that no longer exist (dead test → false confidence)
- [ ] No ADRs in `proposed` status older than 14 days (decision-debt accumulates)
- [ ] No deployment scripts referencing services that no longer exist

A cascade-check fails any step → the cascade is broken → no merge / no deploy / surface the breakage and route to the relevant fix flow.

---

## §8 — The public-surface diff rule

A change to a public API surface is a versioning event, not a silent edit. The rule:

**Before any change to:**

- An exported function / class / type / interface
- A public HTTP endpoint
- A CLI command or flag
- An emitted event or message shape
- A database schema (column adds / removes / type changes)

**Run the diff:**

```
1. List every external caller / consumer of this surface
2. For each: name what change they will observe
3. Decide: backward-compatible (extend) or breaking (version)?
4. If breaking: write the migration note + deprecation window
5. Write the ADR; cite which ADR superseded this surface
6. Then change the code
```

The public-surface diff is what prevents the "silently broke 14 consumers" failure mode. ForgeCraft's `manifest.yaml` `api_surface` field declares what's public; the diff is the discipline of treating that field as load-bearing.

---

## §9 — Severity ramps and exceptions

Not every cascade violation is critical. The severity ramp:

| Severity | Means | When invoked |
|---|---|---|
| **Info** | Pattern noted, no action required | Session-start observations; nothing-broken-yet patterns |
| **Warning** | Should be fixed, not blocking | Orphan ADRs, deferred decisions, doc drift |
| **Error** | Must be fixed before merge | Spec/code misalignment, missing tests, broken cascade |
| **Critical** | Must be fixed before commit | Secrets staged, broken build, broken test suite |

The ramp **escalates** under specific conditions: a warning unresolved for 14 days becomes an error; an info repeated three times becomes a warning. The ramp lives in `.forgecraft/exceptions.json` when ForgeCraft is installed; otherwise, maintain it as a comment block in the relevant ADRs.

### When to file an exception

Sometimes the discipline blocks legitimate work — emergency hotfix, time-bounded experiment, intentional violation with a reason. File an exception:

```json
{
  "rule": "feat-commit-requires-spec-touch",
  "scope": "branch:hotfix/payment-429-handler",
  "severity_override": "info",
  "rationale": "Production incident IN-2026-04-29; spec update follows within 24h per hotfix loop §7",
  "expires_at": "2026-04-30T23:59:59Z",
  "approved_by": "user-id"
}
```

Exceptions are not silent — they are **recorded waivers**. An exception without `rationale` and `expires_at` is not a waiver; it is an undocumented bypass.

---

## §10 — Manifest schema (manual authoring)

When ForgeCraft is installed, `templates/docs-manifest.yaml` (or equivalently `forgecraft@1.6.0`'s shipped schema) is the canonical contract. Without it, author the same content by hand at `docs/manifest.yaml`:

```yaml
project: <name>
description: <one-line description>
tier: T1                              # current operating tier (T1 / T2 / T3 / ...)
api_surface:
  public:
    - src/api/*.ts                    # paths to public surface declarations
    - openapi.yaml
  internal:
    - src/lib/**                      # explicit "internal, not part of contract"
specs:
  - docs/specs/spec.md
  - docs/specs/use-cases/
adrs:
  path: docs/adrs/
  starting_id: 1
harness:
  path: tests/
  contracts:
    - tests/harness/hurl/             # HTTP contract tests
    - tests/harness/k6/               # SLO ramp tests
monitoring:
  path: docs/specs/monitoring-spec.md  # only if T3 active
human_judgment:
  min_reviewers: 1                    # solo mode = 0 + branch protection
  block_ai_only_merge: true
  required_review_categories:
    - "domain correctness"
    - "compliance / regulated logic"
cascade_overrides: []                 # severity ramp adjustments per scope
```

This file is the contract between the repo and any external tool that reads it (ForgeCraft, pragmaworks, CI, IDE plugins). Without ForgeCraft, the file still serves as documentation — the human reader sees the same contract the absent tool would have read.

---

## §11 — Three-layer recording (without team memory)

GS distinguishes three layers of record:

| Layer | Where it lives | What it records |
|---|---|---|
| **Project** | The repository (`docs/`, `.forgecraft/`, `.claude/hooks/`) | Specs, ADRs, decisions, schemas, contracts — version-controlled |
| **Individual** | Local AI memory (Chronicle: `~/.chronicle/chronicle.db`) | Personal session notes, debugging context, preference patterns |
| **Team** | Shared memory (Chronicle Team: cloud Postgres) | Cross-developer patterns, team-level insights, shared anti-patterns |

**Without Chronicle Team:** the team layer reduces to the team's commit log + ADR archive + retrospective notes. This is fine for small teams (≤5 devs) where the social cost of "ask the channel" is low. As the team grows, the team layer should be promoted to a tooled memory — the human cost of repeated explanation scales superlinearly with team size.

**Without individual Chronicle:** the individual layer reduces to the practitioner's local notes (text files, notebook, scratch docs). This is fine for short engagements. For long engagements or multi-context work, individual Chronicle is what prevents the "where did I leave off?" cost from compounding across weeks.

The repository must work correctly when the individual and team layers are empty. If a session begins with no individual memory and no team memory, the repo alone must be enough for any AI session to derive a correct implementation state from any layer of the cascade. This is the **stateless reader principle**: the address space must be self-contained.

---

## §12 — Failure modes

The discipline fails in patterned ways. Recognize them; name them when they happen.

### Cascade short-circuit

Symptom: a `feat:` commit lands without a spec touch.
Cause: rushing, hook bypassed (`--no-verify`), or hook not installed.
Recovery: revert the commit OR back-fill the spec immediately and reference the back-fill ADR in the next commit.

### Sentinel drift

Symptom: CLAUDE.md doesn't match the actual repo state — references files that don't exist, prescribes patterns the code no longer uses.
Cause: code changed; constitution not updated; doc-first cascade skipped.
Recovery: run the cascade-check; restore the sentinel to match observed state; OR restore the code to match the sentinel (whichever was intended).

### Orphan ADR

Symptom: an ADR exists, but the decision it describes is no longer in the code; nothing references it.
Cause: code was rewritten without superseding the ADR.
Recovery: mark the ADR `superseded by ADR-XXXX` (where XXXX is the new decision); if there is no new decision, write one — "decided to remove X because Y" is still a decision worth recording.

### Ghost code

Symptom: implementation exists in `src/` that no spec, use case, or ADR explains.
Cause: AI generated speculatively; or refactor left dead code; or scope-creep code that was never specified.
Recovery: either spec-it-now-or-delete-it. Both are valid; "leave it and hope" is not.

### Ghost test

Symptom: a test passes against code that no longer exists, or tests behavior no spec claims.
Cause: same as ghost code, but in the test layer.
Recovery: same — spec-it-now-or-delete-it.

### Cascade explosion

Symptom: a single change should have touched 3 artifacts; it touched 30. The cascade ballooned.
Cause: the change was at the wrong depth — applied at a foundational layer when a leaf change would have done it; OR a foundational change was discovered mid-flight.
Recovery: stop. Re-scope the change. Either commit the foundational change separately and the leaf changes follow, or revert and re-attempt at the smaller scope.

### Exception sprawl

Symptom: `.forgecraft/exceptions.json` has 40 entries; nobody knows what's active.
Cause: exceptions filed without `expires_at`; exceptions for one-time work never closed.
Recovery: quarterly exception audit. Any exception with `expires_at` in the past gets either removed (no longer needed) or refreshed (still needed; renew the rationale). Any exception without `expires_at` gets one added or removed.

---

## What's not in this document

This document is repo-mechanical. The following are deliberately elsewhere:

- **The seven canonical properties** (Self-describing · Bounded · Composable · Verifiable · Auditable · Defended · Executable): see White Paper §5
- **The six-tier lifecycle cascade** (T1-T6): see White Paper §4, Bible §6
- **The biological isomorphisms** and the philosophical layer: see Onwards essay, Bible §11
- **The judgment layer** (what humans irreducibly hold): see Practitioner Protocol Part I §G
- **Skill catalog** (entry-point + enforcement skills): see `pragmaworks/skills/`
- **Forge teaching plan**: see `soma/docs/PRAGMAWORKS-PLAYBOOK.md` and the Forge playbook

If you are looking for *why*, those documents are home. If you are looking for *what to do mechanically*, this document is.

---

## Reference index

For each section above, the corresponding location in the canonical sources:

| Section | White Paper | Practitioner Protocol | Bible | Skills |
|---|---|---|---|---|
| §1 Five artifacts | §6 Artifact Grammar | §3 | §6 | (all routing skills reference) |
| §2 Sentinel tree | §6 + §4.4 | §3, §G | §6 | `using-gs-skills` |
| §3 Branch isolation | — | §3 | §7 | All skills, "Branch Isolation" non-negotiable |
| §4 Conventional commits | §4.2 cascade trigger | §8.1, §8.4 | §7 | All cascade refs |
| §5 Doc-first cascade | §4.2 | §6, §7 | §7 | `gs-cascade-check` |
| §6 Pre-* gates | §4.2 | §8.4 | §7 | `gs-cascade-check`, hook integration sections |
| §7 5-step cascade check | §4.2 | §6 | §7 | `gs-cascade-check` |
| §8 Public-surface diff | §4.2 | §8.3 | §7 | All skills, "Public-Surface Diff" non-negotiable |
| §9 Severity + exceptions | §4.4 | §8.6, §8.7 | §8 brownfield | `gs-cascade-check` "Gate is a Wall" |
| §10 Manifest schema | §6 | §8.5 | §7 | `gs-bootstrap` |
| §11 Three-layer recording | §4.2 | Part I extension | §7 cells/tissue/organism | `using-gs-skills` |
| §12 Failure modes | — | §7 loop types | §8 brownfield, §11 BIOISO | All skills, "When NOT to use" sections |

When in doubt, the order of authority is: White Paper (canonical theory) > Practitioner Protocol (canonical practice) > Bible (canonical narrative) > Skills (canonical routing). Conflicts get resolved by promoting the resolution upstream.
