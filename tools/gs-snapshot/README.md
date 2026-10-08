# gs-snapshot: the "governed as of [date]" snapshot generator

One file, `gs-snapshot.mjs`, Node 18+, no dependencies, no model, no network, MIT (see `../LICENSE`). It sits beside `gs-check`, `gs-lock` and `gs-decide` and uses them when it finds them (as modules for lock and decisions, as a command for the checker); it says so when it does not.

**Status: written to the canon; tested only by its own suite (19 tests, below); not yet used in a registered run.** It is the first implementation of the snapshot that the [functions map](../../docs/method/functions-map.md) ranks second among the gaps in SHOW, and of the "what changed between two dates" report.

## What it does

Gathers what a project can compute about itself, deterministically, writes `docs/snapshots/snapshot-YYYY-MM-DD.md` and `.json`, and diffs against the previous snapshot. Same repository state, same date, same checker report: the same bytes (no wall-clock time is written; the date is `--date` or today).

| Section | Source | Computed how |
|---|---|---|
| The 12 substrate items | `gs-check --strict` | run as a command (`--check <path>`, `$GS_CHECK`, next to this tool, `$GS_FORMULAS_TOOLS`, or the formulas worktree next to this one); `--check-report <json>` reads a saved report; `--no-check` skips; absent or failing is **said** in the report, never guessed. Only item id, name and status are kept (no paths, no timings). Takes minutes |
| Spec | spec folders and roots (as gs-lock) | files, declared version (a `version:` line) or a 12-hex digest of the normalised text, requirements, open-question markers (`OPEN:`) |
| Criteria | ids defined under an acceptance/criteria heading | total, ticked, **cited by a test file** (static), listed in the coverage file, the ids no test cites |
| Tests | test files | static count of cases; `--run-tests` also runs the project's test command and records exit, pass, fail |
| Ratchet floors | files named ratchet, baseline or floor | each numeric floor against what the tool can measure (`tests_min` against the static count); the rest are `unknown`, not guessed |
| Spec lock | `gs-lock` as a module | CURRENT, FAILING (with the finding counts), NOT-VERIFIED (lock present, tool absent), NOLOCK |
| Decisions | `gs-decide` as a module, and gs-lock's `docs/ratifications.md` | entries, chain verifies or not, chain head, open waivers, expired, protected files no entry approves, recent entries |
| Drift since the previous snapshot | `git` | commits and files changed, by class (spec, gate, ratchet, waiver, tests, source, docs), the protected files that changed |
| Dependencies | manifests and lockfiles | package.json, requirements*.txt, go.mod, Cargo.toml (name to version), lockfile sha256 and line count |
| KPIs | **supplied** with `--kpi <json>` | shown with their source; an entry with no source is marked so. The tool never computes or invents one |
| Audit | **supplied** with `--audit <json>` | level, score, confidence, rubric, grades of a separate audit, labelled "supplied" |

The line (the Compendium's §8.19 snapshot, with what is not computed said as `n/a`):

```
level n/a · score n/a @ rubric n/a @ 9ab12cd @ spec unversioned-3f9c01aa @ 2026-10-08 | checker strict 12/12 PASS | 14 commit(s) since 2026-10-01
```

## Use

```
node tools/gs-snapshot/gs-snapshot.mjs [generate] [--date YYYY-MM-DD] [--out <dir>] [--check <gs-check.mjs> | --no-check | --check-report <json>] [--run-tests]
                                       [--kpi kpis.json] [--audit audit.json] [--against <snapshot.json>] [--dry-run] [--fail-on-check] [--root <dir>]
node tools/gs-snapshot/gs-snapshot.mjs diff <older.json> <newer.json>       the differences between two snapshots, as markdown
node tools/gs-snapshot/gs-snapshot.mjs latest                               the line of the newest snapshot
```

`kpis.json`: `[{"name": "lead time", "value": 6, "unit": "days", "source": "jira export 2026-10", "measured_by": "PM", "as_of": "2026-10-07"}]`.
`audit.json`: `{"level": "L3", "score": 72, "confidence": 6, "rubric": "v1", "grades": {"Verifiable": "B"}, "runs": 2, "assessor": "external", "date": "2026-09-30"}`.

The diff (in each snapshot against its predecessor, and by the `diff` command): spec digest and version, criteria added or removed, criteria that lost their last citing test, test counts, checker items that changed status, floors **raised or LOWERED**, lock status, new decision entries (and whether the earlier ones are unchanged: a rewritten log is called out), open waivers, dependencies added, removed or bumped, lockfile changes, and KPIs side by side as supplied. When the spec changed between the two, the diff says to read the criteria before the numbers (scores are comparable only at the same spec version).

## What this is NOT

It is **not an audit status**. The letter grade per property and the word "governed" (all seven properties at L4, enforced, tied to reality) come from a separate audit that is not deterministic (a model reads the repository; run-to-run agreement is about 0.62 kappa); this tool does not compute them and never prints "governed" on its own. It **cannot detect a wrong spec**, a test that proves nothing, or a document that is false of the code. A passing checker says the form is there and a planted violation was refused. "Cited by a test" says a test file mentions the id, not that the test passes or means what the criterion says. Counts age: read the commits-since figure. The snapshot lists the commit it describes; uncommitted files are counted and are not judged by the checker (it clones the committed state).

## Tests

```
node --test tools/gs-snapshot/test/snapshot.test.mjs      # 19 tests (18 offline, about 15 s; S19 runs the real gs-check, minutes)
GS_CHECK_JS=<path to gs-check.mjs> node --test tools/gs-snapshot/test/snapshot.test.mjs
```

`S1` to `S18` use hand-built projects copied from the known-good controls of `gs-check` (`test/fixtures/good`, `good-gs`) and a stand-in checker that writes the report shape; `S19` builds the wired known-good project with gs-check's own fixture builder and runs the real checker in strict mode. They cover: determinism, the missing and failing checker, strict mode, criteria and open questions, floors below and unknown, the lock current and failing, decisions with an open and an expired waiver, a tampered log, the diff across dates (including a lowered floor, dependencies and KPIs), CRLF, no git, and the supplied-not-computed fields. `test/vendor/` and `test/fixtures/` are copies used only by the tests; delete them when the tools are merged side by side.
