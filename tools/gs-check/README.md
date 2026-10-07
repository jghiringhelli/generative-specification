# gs-check: the substrate conformance checker

One file, `gs-check.mjs`. Node 18+, no dependencies, no model, no network. It judges the twelve items of the [substrate checklist](../../docs/formulas/SUBSTRATE-CHECKLIST.md) as **present and working** on a git repository and prints, for each item, a status and the raw probe lines. MIT (see `../LICENSE`).

**Canonical copy: this file.** `tools/gs-check/gs-check.mjs` in the formulas repository (branch `formulas-2026-10-05` until merged) is the only maintained copy. The study design that uses it (FX-1: `experiments/fx1/` and `docs/experiments/FX-1-CHECKER-SPEC.md` in the protocol repository) keeps a pointer and no code. The default configuration is embedded; `node gs-check.mjs --print-config` prints it and its SHA-256 (the value every report carries as `config_sha256`).

**Status: a prototype.** Tuned on hand-built control projects and on 24 development runs (13 defects fixed, mostly false negatives); the controls are by the checker's author; independent controls and a held-out audit are owed. A green run says the form is there and a planted violation is refused, not that the software is right.

## Use

```
node gs-check.mjs --repo <path> [--strict] [--both] [--verbose] [--only E01,E05] [--since <rev>] [--config <file>] [--out <report.json>] [--keep]
```

- It clones the **committed** state into a temporary folder and never modifies the repository under test. It executes project code (install scripts, hooks, tests): use a disposable container for a project you did not write.
- `--strict` is **strict enforcement**: only a commit hook or a push hook that refuses a planted violation is credited. A package script that fails (`npm run check`) is **not** credited, because nothing runs it unless a person does. The default mode credits such scripts (it is what the development loop used); `--both` runs both and prints a table with the two columns. A project whose E05 to E07 or E10 depend on a script reads PASS by default and PARTIAL in strict mode (controls `GS2` and `R06`).
- `--verbose` prints every reason and the probe flags of each item (what the verify formula pastes). `--only` pulls in the items the chosen ones depend on (E10 needs E02 and E04). `--since <rev>` limits the commit check (E09) to `rev..HEAD`.
- Exit 0 only if all twelve are PASS; 1 otherwise; 2 on a usage error. Status values: `PASS` present and working, `PARTIAL` present and not (fully) working, `ABSENT`, `UNDETERMINABLE` (an environment fault: network, missing tool, timeout).

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
node --test tools/gs-check/test/controls.test.mjs             # the controls, about 30 minutes
FX1_ONLY=G1,GS1 node --test tools/gs-check/test/controls.test.mjs
node --test tools/gs-check/test/smoke-cli.test.mjs            # the verify formula's command on known-good and broken projects
```

The controls build a hand-made project from `test/fixtures/` (node `good`, python `good-py`, and `good-gs`, which is `good` wired to the reference lock tool, copied from `tools/gs-lock/` and never stored twice) and variants with one element removed or broken, and compare every item with its declared expectation. A variant with a `strict` key is checked a second time in strict mode. `test/Dockerfile` builds the Linux image used to run them (Node 22, python3 with pytest, git, bash).

## What it cannot see

Server-side CI results, branch protection and required review (a clone cannot show them); `git commit --no-verify`; whether a spec is right or a test is good; whether a derived document is true of the code; anything an agent can fake with a file. See "What no program can check" in the checklist.
