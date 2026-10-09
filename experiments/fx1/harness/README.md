# FX harness (portable, in git)

The working flow of the FX-1 development loops, made portable and given adapters for the Claude CLI and the GitHub Copilot CLI. No keys, no personal paths: every path comes from an environment variable or an argument. Nothing here is a registered instrument until the freeze list hashes it; **status: tested with a mock model end to end and with one real Claude development cell; the Copilot adapter was written from the documentation and has never called a model** (its flags were checked against the CLI's own `--help`).

## What is here

| File | Job |
|---|---|
| `run.mjs` | one cell: path A (greenfield), B (plain MVP then adopt) or C (legacy migrate), then the lock formula, copy-out, then the checker in a separate container |
| `queue.mjs`, `schedule.mjs` | seeded blocked random order; queue with parallelism, resume, one re-run per void slot, caps, `STOP` file, stop rules |
| `critic-run.mjs`, `critic-targets.json` | one vendor-diverse critic (or panel role) per fresh container, with only the files its runbook allows |
| `practitioner-run.mjs` | one model-authored expert prompt session (A5-m) per `COPILOT-PRACTITIONER-RUNBOOK.md` |
| `run-phase.mjs`, `models-discover.mjs` | a whole phase as one resumable unattended job; which model ids this account can call |
| `adapter-probe.mjs`, `verify-env.mjs`, `isolation-test.mjs` | checks of the real CLI, of the PC, and the proof that the agent cannot see the checker |
| `push-results.mjs`, `scan-secrets.mjs` | copy finished cells to the private results clone, scan for secrets, commit on a branch per phase, push only to `genspec-experiment-results` |
| `gate-check.mjs`, `lib/gate.mjs` | may a registered run start? (annotated formulas tag, `prereg/FX-1-v*` tag, `FX-1.md` says FROZEN) |
| `record.mjs`, `check.mjs`, `manual-prompts.mjs`, `collect-manual.mjs` | run summary; re-score a cell; semi-automatic editor-agent route |
| `adapters/` | `claude.mjs`, `copilot.mjs` (+ `copilot.profile.json`: the flags as data), `mock.mjs` |
| `docker/` | `Dockerfile` (Node 24, Python 3.11, pytest, git, bash), `Dockerfile.claude`, `Dockerfile.copilot` (CLI pinned by build argument) |
| `fixtures-dev/`, `fixtures-legacy/` | the four development briefs (English and Spanish) and three legacy projects as git bundles (history preserved) |
| `models.json` | the CLI model ids, multipliers and prices (empty until filled from the plan page), the default model sets |
| `test/harness.test.mjs` | tests that need no model |

## Environment

| Variable | Meaning |
|---|---|
| `FX_ROOT` (required) | work folder for cells, ledger, queue state; outside the repository; no spaces |
| `FORMULA_DIR`, `TOOLS_DIR` | `docs/formulas` and `tools` of the formulas checkout (`origin/formulas-2026-10-05` until a frozen tag exists) |
| `FX_RESULTS` | clone of the private results repository |
| `FX_MODEL_ANTH`, `FX_MODEL_OAI`, `FX_MODEL_GOOG` | exact model id per vendor tag of the schedule |
| `FX_ROUTE_<VENDOR>` | `claude`, `copilot` or `mock`; default `copilot` (Claude only if a Claude credential is in the environment) |
| `COPILOT_GITHUB_TOKEN` (or `GH_TOKEN`, `GITHUB_TOKEN`) | fine-grained token with the "Copilot Requests" permission; set in the shell, never in a file |
| `ANTHROPIC_API_KEY`, `CLAUDE_CODE_OAUTH_TOKEN`, `FX_CLAUDE_CREDS_FILE` | Claude route credentials (any one); the last copies only the access token into a per-session folder and deletes it afterwards |
| `FX_CAP_CALLS`, `FX_CAP_HOURS`, `FX_CAP_PREMIUM`, `FX_CAP_CREDITS`, `FX_CAP_USD`, `FX_SOFT` | caps per stage (hard) and the soft fraction (default 0.8) at which the queue stops launching |
| `FX_MAX_AI_CREDITS`, `FX_MAX_BUDGET_USD`, `FX_CALL_TIMEOUT_MIN` | per-call guards (Copilot soft cap per response, Claude budget per call, minutes per call; defaults 800, 14, 55) |
| `FX_SENTINEL_NAME`, `FX_DATE` | the instruction-file name and the scripted date the formulas get (defaults `CLAUDE.md` and `2026-10-07`, the development values; recorded in `meta.json`) |
| `FX_SKIP_CHECKER=1` | tests only |

## The isolation rules (what changed from the development harness)

1. The agent container mounts exactly three things: its own volume at `/work`, its session folder at `/cfg`, and `tools/gs-lock` read-only. The development harness mounted the whole `tools` folder, so the checker source was readable; here an allow-list (`assertAgentArgs`) refuses any other mount, host networking, the Docker socket or privileged flags before a container starts. `isolation-test.mjs` runs a probe through the same code path and fails if it finds the checker, the checklist, a fixture, another cell or any harness variable; it also runs a negative control showing that the old mount would have exposed the checker.
2. Every flow session has its own configuration folder (the Claude CLI `CLAUDE_CONFIG_DIR`; the Copilot CLI `COPILOT_HOME`). The development harness shared one folder across all runs.
3. Containers run as uid 1001 with all capabilities dropped, `no-new-privileges`, a pids limit and a memory limit. The network is open (the CLIs need their API); the checker container is separate and gets the cell's output read-only.
4. A registered fixture (`FIX-*`) is refused unless `gate-check` passes. The FX-0 diagnostic on those briefs (ids starting `fx0`) needs the file `$FX_ROOT/GO-FX0.txt` written by JC.
5. The `verify` formula (13), which needs the checker inside the agent container, is disabled; enabling it is a registered-design decision, not a harness switch.

Known gaps: no web restriction beyond the instructions (a shell can reach the network); the Claude route under a login syncs the account's plugins and skills into the session folder (they are deleted before collection; use an API key for a clean run); the instruction-file name is `CLAUDE.md` for every vendor (development value); `Dockerfile.claude` does not pin the Claude CLI version.

## Commands

```
node experiments/other-pc/setup.mjs                                # once: tools check, work tree, results clone, images, env files
node experiments/fx1/harness/test/harness.test.mjs                 # no model needed: use  node --test <file>
node experiments/fx1/harness/isolation-test.mjs
node experiments/fx1/harness/adapter-probe.mjs --adapter copilot --model gpt-5.4 --live
node experiments/fx1/harness/models-discover.mjs
node experiments/fx1/harness/run-phase.mjs --phase 1 | 2 | 3       # start detached; poll with  node .../phase-status.mjs
node experiments/fx1/harness/push-results.mjs --phase phase1 --stage critics --push
```

One cell by hand: `node run.mjs --id dry-A-hive-en-oai-r1 --path A --lang en --fixture DEV-API-hivelog --adapter copilot --model gpt-5.4`.

## Layout of `$FX_ROOT`

```
cells/<id>/logs/    meta.json (model asked and served, dates, versions, hashes, duration, output size, tokens if known, status), turnNN-label.raw.txt, report.json, checker.out.txt
cells/<id>/cfg/     per session: prompts sent, CLI session state (transcripts), share files, OpenTelemetry files   (credentials and CLI noise removed)
cells/<id>/work/    the produced project (a git repository; root-owned; never opened in an editor, never pushed)
cells/<id>/deliverables/   critic files, practitioner outputs
ledger.jsonl  queue-state.json  drive.log  STOP  phase-N.log  phase-N-status.json  models-available.json  schedule-*.csv  console/  verify/  probe/
```
