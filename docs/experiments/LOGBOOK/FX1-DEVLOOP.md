# FX1-DEVLOOP: development loop on the formulas and the checker before the registered FX-1 run

**Development, not evidence.** Nothing in this entry supports a claim about the formulas: they were edited and the checker was repaired on these very runs. It exists so that the changes, their reasons and their limits are on record before FX-1 is frozen. Protocol: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\EXPERIMENT-PROTOCOL.md`. Registration it prepares: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\prereg\FX-1.md`. Private report with the tables: `C:\workspace\PragmaWorks\soma\docs\reports\2026-10\fx1-dev-loop-2026-10-06.md`.

| Field | Value |
|---|---|
| ID | FX1-DEVLOOP |
| Status | CLOSED (development loop; stopped at the cap of four iterations) |
| Outcome | none; this is not an experiment |
| Evidence tier | none (development) |
| Refines / refined by | prepares FX-1 / replaced by the FX-0 diagnostic stage and the registered run |
| Registration | none, by design |
| Data and code | harness, fixtures, sandboxes, logs: `C:\workspace\PragmaWorks\lab-runs\fx1-dev\` (local only, not a repository); formulas branch `formulas-2026-10-05` at `C:\workspace\PragmaWorks\gs\gs-formulas`; checker `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\experiments\fx1\checker\` (config version `0.2.1-devloop`) |
| Opened / closed | 2026-10-06 / 2026-10-06 |

## What was done
- Four invented **development** fixtures (one per project type, disjoint from the five confirmatory fixtures of FX-1 section 3.4; the confirmatory fixtures were not written, read or opened): a web API (Hivelog, beekeeping, Node), a command-line tool (Kilnlog, pottery kilns, Python), a data pipeline (Lampwatch, street-lamp reports, Node) and a game rules library (Tallyhouse, trick-taking cards, Python; written as unstructured prose with omissions). English briefs for all, Spanish briefs for all four. Product-owner wording, no GS vocabulary. Path: `C:\workspace\PragmaWorks\lab-runs\fx1-dev\fixtures\`.
- Four batches of six runs (24 runs: four on path A and two on path B per batch, two of the six in Spanish per batch), a fresh `claude -p` session per run (and per path-B step) with an empty configuration directory (no memory, no skills, no connectors, no hooks), seeing only the formula text with the brackets filled by a fixed script and the brief. Scripted human actions: one ratification message at the STOP, one fixed "use your best judgment" message for any question or early end (the FX-1 harness rules). Batches 1 and 2 ran on the Windows development machine; batches 3 and 4 ran, agent and checker, in a Linux container (node 24, python 3.11, pytest, git, bash), which is the registered environment.
- Side probes outside the FX-1 formula set: the lock formula on three finished projects (two rounds) and the change formula on two.
- Independent manual inspection of every batch (a script in the harness that does NOT use the checker: clean clone, hooks, a planted failing test, an `OPEN:` line, a lowered floor, an orphan id, removed floors, a deleted test, a removed criterion, a neutered gate, each committed with `--no-verify` and pushed to a local bare remote).
- A false-positive audit of the checker: nine planted defects on a model-written project.

## Formula changes (each a commit on `formulas-2026-10-05`, reason and run in the commit message)
1. Greenfield and adopt (English and Spanish): a pre-push hook that runs the one command. Motivated by batch 1 (no local gate refused a failing test, an `OPEN:` line or a lowered floor in 6 of 6 runs).
2. Greenfield and adopt: the ratchet check also compares `docs/baseline.json` with earlier commits. Batch 1: lowering all floors was accepted in 4 of 6 runs.
3. Adopt: creates `docs/fixes.md` and `docs/deferred.md`, declares "no stored data". Batch 1: the copied triage block named `docs/fixes.md`, which adopt never created (dangling route, 2 runs).
4. Greenfield and adopt: a requirement id starts exactly one heading, in its feature file; SPEC.md lists the features in a table. Batch 1: title line and requirement heading both carried the id (duplicate ids, 5 of 6 runs).
5. Greenfield and adopt: hooks are committed executable. Batch 2: one run committed both hooks as 100644, silently inert on Linux and invisible on Windows.
6. Lock formula (side probe): the tag section is the GitHub-style anchor, the lock line grammar is stated, the first lock is written by an init step. Two probe runs: 11 unresolved tags; the first lock left the one command red until a person ratified.

## Checker changes (each a commit on `experiment-protocol-2026-10-02`)
C1 table-cell routes; C2 criterion id shape and root listing; C3 coverage command probe (E08); C4 fresh-clone heading and usage syntax; C5 "no stored data"; C6 git-ignored runtime paths; C7 smoke start kills the whole tree and picks a fresh port; C8 committed hook mode; C9 clone folder in the README; C10 the last command of the Fresh clone block is the test command; C11 push-stage paired control; C12 a plain paragraph starting with an id defines nothing; C13 unicode tag anchors, lock hash recomputation off by default. Details and runs in the commit messages.

## Limits that matter for later use
- The formulas and the checker were tuned on 24 runs of four invented projects of one author and one model family. A rate measured on these runs is not a rate of anything.
- Checker changes were made after seeing results; that is the Goodhart risk declared in the checker specification, section 7 item 11. The registered validation (independent controls, held-out audit) is what answers it.
- Only Anthropic models were available. Cross-vendor behaviour is untested.
- The checker's controls are rerun at the end (see the report); the results of that rerun are in the report, not here.

## What this licenses
Nothing about the formulas. It licenses the decision to freeze or to iterate, and the list of known weak points handed to FX-1 (report section "Remaining failure modes").
