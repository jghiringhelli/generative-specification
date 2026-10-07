# FX1-LOCK-VERIFY: the lock tool, the checker as one file, and E10 and E11 verified for real

**Development, not evidence.** No model was contacted; no formula was run. This entry records what was built after the development loop (`FX1-DEVLOOP.md`) so that the changes, their reasons and their limits are on record before FX-1 is frozen. Private report with the counts and the open questions: `C:\workspace\PragmaWorks\soma\docs\lock-migration-verify-2026-10-07.md`.

| Field | Value |
|---|---|
| ID | FX1-LOCK-VERIFY |
| Status | CLOSED (tools built and tested on their own scenarios; no registered run) |
| Outcome | none; this is not an experiment |
| Evidence tier | none (development) |
| Refines / refined by | refines FX1-DEVLOOP (its lock and E10 findings) / replaced by the FX-0 diagnostic stage and, for the lock, a separate lock study |
| Registration | none, by design |
| Data and code | formulas branch `formulas-2026-10-05` at `C:\workspace\PragmaWorks\gs\gs-formulas`: `tools\gs-lock\` (`gs-lock.mjs`, `gs-cochange.mjs`, `gs-redproof.mjs`, 75 tests), `tools\gs-check\gs-check.mjs` (canonical checker, config version `0.3.0-lock`, 10 unit tests, 53 control tests, 11 CLI smoke tests, Dockerfile) |
| Opened / closed | 2026-10-07 / 2026-10-07 |

## What was done
- **A reference lock tool**, three Node files, no dependencies: tags `@gs <id> <spec-path>#<section>`, `docs/spec.lock`, `init`, `check` (UNLOCKED, STALE, LOCK-BEHIND, DANGLING, UNCOVERED, MISSING-SOURCE, MISMATCH, MALFORMED, CONFLICT, NOLOCK), `ratify --reason` with an append-only record, `resolve`, `commit-check`, `diff`; the co-change gate `gs-cochange.mjs` (a `refactor:` must pass the parent commit's tests unchanged); `gs-redproof.mjs` (the red proofs as one command each). Ported from the lab sensors of the divergence work (35 scenarios; two ports are reinterpretations, said in the tool's README) plus 40 edge cases. 75 of 75 on Windows (Node 24) and in a Linux container (Node 22).
- **The checker as one file** (`tools/gs-check/gs-check.mjs`), canonical there; this repository keeps a pointer. Strict enforcement (`--strict`, `--both`), `--verbose`, `--print-config`, `--only` with dependencies. The dev-loop recommendation to add a strict mode and to fix the E10 probe is implemented (checker spec section 11).
- **E10** drift inside a tagged section, twin as a new spec file, and with the reference tool the ratify path and the commit check; **E11** a breaking refactor with an edited test and a comment-only control, with only the commit-msg hook active. Nine new controls (GS1 to GS9), strict-mode expectations, a CLI smoke test of the verify formula's command.
- Formulas (branch `formulas-2026-10-05`): lock rewritten to install the tool; new 12 Migrate (case A new stack, case B older GS layout) and 13 Verify the substrate; checklist items 10 and 11; greenfield and adopt checks.

## Findings worth keeping
- The old "unlocked edit accepted" twin (a trailing section appended to the same spec file) cannot tell a lock from a frozen spec when sections nest; a new spec file can.
- E11's refactor proof had to be isolated to the commit-msg hook: planted as a plain commit, the breaking refactor was stopped by the project's test gate at pre-commit, which proves nothing about the co-change gate.
- The hand-built known-good gates had no refactor proof; they gained one, or E11 would read PARTIAL by design. A project with no tests also reads PARTIAL on E11 (control R05).
- Found only by the Linux container: the python control needs pip and `PIP_BREAK_SYSTEM_PACKAGES` on Debian; `node --test <folder>` is not accepted on Node 24 (pass files).

## Limits
Everything was tested on hand-built projects by the author of the tools; no model-written project, no second vendor, no independent controls (FX-1 V-C1, V-C4 still owed). The probes were designed after seeing the dev-loop results (Goodhart risk, checker spec section 7 item 11).
