# gs-check: the substrate conformance checker

One file, `gs-check.mjs`. Node 18+, no dependencies, no model, no network. It judges the twelve items of the [substrate checklist](../../docs/formulas/SUBSTRATE-CHECKLIST.md) as **present and working** on a git repository and prints, for each item, a status and the raw probe lines. MIT (see `../LICENSE`).

**Canonical copy: this file.** `tools/gs-check/gs-check.mjs` in the formulas repository (branch `formulas-2026-10-05` until merged) is the only maintained copy. The study design that uses it (FX-1: `experiments/fx1/` and `docs/experiments/FX-1-CHECKER-SPEC.md` in the protocol repository) keeps a pointer and no code. The default configuration is embedded; `node gs-check.mjs --print-config` prints it and its SHA-256 (the value every report carries as `config_sha256`).

**Status: a prototype.** Tuned on hand-built control projects and on 24 development runs (13 defects fixed, mostly false negatives); the controls are by the checker's author; independent controls and a held-out audit are owed. A green run says the form is there and a planted violation is refused, not that the software is right.

## Use

```
node gs-check.mjs --repo <path> [--strict] [--both] [--verbose] [--migration] [--mutants N] [--only E01,E05] [--since <rev>] [--config <file>] [--out <report.json>] [--keep]
```

- It clones the **committed** state into a temporary folder and never modifies the repository under test. It executes project code (install scripts, hooks, tests): use a disposable container for a project you did not write.
- `--strict` is **strict enforcement**: only a commit hook or a push hook that refuses a planted violation is credited. A package script that fails (`npm run check`) is **not** credited, because nothing runs it unless a person does. The default mode credits such scripts (it is what the development loop used); `--both` runs both and prints a table with the two columns. A project whose E05 to E07 or E10 depend on a script reads PASS by default and PARTIAL in strict mode (controls `GS2` and `R06`).
- `--verbose` prints every reason and the probe flags of each item (what the verify formula pastes). `--only` pulls in the items the chosen ones depend on (E10 needs E02 and E04). `--since <rev>` limits the commit check (E09) to `rev..HEAD`.
- Exit 0 only if all twelve are PASS; 1 otherwise; 2 on a usage error. Status values: `PASS` present and working, `PARTIAL` present and not (fully) working, `ABSENT`, `UNDETERMINABLE` (an environment fault: network, missing tool, timeout).

## Migration checks (`--migration`)

For a project migrated with [formula 12, case A](../../docs/formulas/migrate.md) (existing code became a recovered spec and a characterization suite, then a greenfield substrate), `--migration` adds nine items after E01 to E12. The exit code is 0 only if all twenty-one are `PASS`. The suite is black-box: it runs the system through `GS_SUT_CMD` from `GS_SUT_ROOT` and never imports its code, so the checker can run the same suite against a checkout of the base commit (the original) and against the current code.

| Item | What it establishes | How |
|---|---|---|
| M01 | manifest `docs/migration/equivalence.json` (base commit, suite command, how to invoke original and current) and a characterization suite of at least 5 tests that does not import the system's source | JSON, `git merge-base --is-ancestor`, static scan of the suite |
| M02 | the suite passes on the **original** (a checkout of the base commit) and **fails on an empty system** | two runs of the suite command with `GS_SUT_ROOT` changed |
| M03 | the suite passes on the migrated code | one run |
| M04 | the suite is an **oracle**: a few comparison operators, booleans, signs and numbers are flipped one at a time (deterministic selection, up to 12 per tree, `--mutants N`), in the original and in the new code; the suite must refuse at least 60 percent | mutation probe; survivors are listed (they are the unpinned behavior) |
| M05 | every characterization test cites a criterion id that the recovered spec defines | static |
| M06 | every criterion (except `N-` ids) is cited by a characterization test, or is deferred | static |
| M07 | the inventory (`docs/migration/inventory.md`, columns element, where in the code, claimed by, decision, reason): every row has `keep`, `drop` or `defer`; a kept row claims criteria that exist and are tested and is not `UNCLAIMED`; a dropped or deferred row has a reason | static |
| M08 | the public surface found in the **original code** by pattern matching (routes, commands, flags, environment variables) appears in the inventory (at least 90 percent): a check that does not depend on the assistant's own list | heuristic; `UNDETERMINABLE` when it recognises nothing |
| M09 | `docs/deferred.md` exists and gives every dropped or deferred element a reason | static |

Limits: M04 samples (12 mutants), so a small suite can pass by luck and a large one can fail by equivalent mutants; M08 is blind to routes built dynamically; none of it sees timing, ordering or side effects outside what the suite observes. Controls `MG1` to `MG13` (`test/migration.test.mjs`) pin each outcome.

## E10 and E11 verified for real

When the project carries the reference tool (`tools/gs-lock/`, see its README), E10 and E11 run the tool itself in the throwaway clone, **and** probe the same behavior through the project's own hooks:

| Probe | What it plants | What must happen |
|---|---|---|
| E10 drift | one sentence written **inside** a tagged heading section of a spec file | `gs-lock check` exits non-zero and names STALE; the same edit, committed, is refused by a commit or push hook |
| E10 twin (control) | a **new spec file** next to it (never inside a locked section) | `check` exits 0 and the commit is accepted: a hook that refuses every spec edit is not a lock |
| E10 ratify | `ratify --all` without a reason, then with one | refused and the lock unchanged; then `check` exits 0 and `docs/ratifications.md` has the line |
| E10 commit-check | the ratified state staged, then staged without the record | accepted, then refused |
| E11 uncited / cited | a source change with `feat:` and no id; the same citing an id; the same staging a doc | refused; accepted; accepted |
| E11 refactor (isolated) | with **only the project's commit-msg hook active**: a `refactor:` that breaks the parent's tests with a test edited in the same commit; and a comment-only `refactor:` | refused; accepted (a failing test gate at pre-commit cannot be the cause) |
| E11 refactor (direct) | the same two changes given straight to `gs-cochange` in the clone | exit 1 naming NOT A REFACTOR; exit 0 (so a proof that cannot run the project's tests is not credited) |

Without the reference tool (an ad hoc lock) E10 falls back to the behavioral drift and twin probes through the hooks; E11 to the commit-msg and refactor probes. A refactor exemption without a proof reads PARTIAL.

## Tests

```
node --test tools/gs-check/test/unit.test.mjs                 # 10 helper tests, seconds
node --test tools/gs-check/test/controls.test.mjs             # the controls (53 tests): about 20 minutes on Windows, 4 minutes in the Linux container
FX1_ONLY=G1,GS1 node --test tools/gs-check/test/controls.test.mjs
node --test tools/gs-check/test/smoke-cli.test.mjs            # the verify formula command on 3 known-good and 8 broken projects (11 tests)
node --test tools/gs-check/test/migration.test.mjs            # the migration checks on a migrated legacy script and 12 broken variants (MG1 to MG13)
```

The controls build a hand-made project from `test/fixtures/` (node `good`, python `good-py`, and `good-gs`, which is `good` wired to the reference lock tool, copied from `tools/gs-lock/` and never stored twice) and variants with one element removed or broken, and compare every item with its declared expectation. A variant with a `strict` key is checked a second time in strict mode. `test/Dockerfile` builds the Linux image used to run them (Node 22, python3 with pytest, git, bash).

## What it cannot see

Server-side CI results, branch protection and required review (a clone cannot show them); `git commit --no-verify`; whether a spec is right or a test is good; whether a derived document is true of the code; anything an agent can fake with a file. See "What no program can check" in the checklist.
