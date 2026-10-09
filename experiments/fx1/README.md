# FX-1: formulas reliability study (materials)

Registration draft: `docs/experiments/prereg/FX-1.md`. Checker specification: `docs/experiments/FX-1-CHECKER-SPEC.md`. Nothing here has been run against model output; no model was contacted to build any of it.

| Folder | What | How to run |
|---|---|---|
| `checker/` | **a pointer only** (`checker/README.md`). The checker is one file, `tools/gs-check/gs-check.mjs` in the formulas repository, which is the canonical copy, with its configuration embedded, its controls and its tests beside it | in the formulas repository: `node tools/gs-check/gs-check.mjs --repo <path> --strict --out report.json`; tests in `tools/gs-check/README.md` |
| `fixtures/` | five invented product briefs (web API, command-line tool, data pipeline, game rules engine, MCP tool server) | read; an independent reader must approve or rewrite them before freeze |
| `runner/` | NEW, review before use: `schedule.mjs` (seeded blocked run order), `drive.mjs` (queue runner with a STOP file), `patch-harness.mjs` (makes a portable copy of the development harness), `run-record.mjs` (per-run model, token and cost summary). Used by `docs/experiments/RUNBOOK-FX1-OTHER-PC.md`; never run against a model | see the runbook |
| `simulation/` | sample-size and decisiveness simulation (`simulate.js`, `results.md`, `results.json`) | `node simulate.js` (about 2 s; `--quick` for a coarse run) |

The checker executes arbitrary project code (install scripts, hooks, tests). Run it on model-written projects only inside a disposable container (checker spec section 6).
