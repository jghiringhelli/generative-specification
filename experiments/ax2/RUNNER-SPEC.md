# AX2 runner spec — frozen before first run

> Freeze this, then run cell by cell. One cell at a time. Never two concurrent
> generation processes (the SX concurrency disaster: two race the workspace and
> destroy it). Reuse the SX harness discipline (`experiments/sx/run_sx.sh`):
> lockfile guard, snapshot/restore, kill-port, Hurl oracle, token metric.

## Cells
A **cell** = (model × condition). Conditions are frozen in `prompts/`:
- **C1-naive** — `prompts/C1-naive/` (6 prompts)
- **C2-expert** — `prompts/C2-expert/` (7 prompts, the control)
- **C3-gs** — `prompts/C3-gs/` (7 prompts, mature GS v5.0: infra + sentinel + gates)
- (Optional **C4** = C3 with gates enforced in the loop — add only if time allows.)

Models are frozen in `models.txt`. Freeze the exact set actually run in `RESULTS.md`.

## n and power
- Target **n ≥ 12** independent stateless runs per cell (pre-registered here).
- Runs are independent: fresh workspace per run, no shared state, no memory.
- Report effect sizes (Cliff's delta) + CIs + exact p (Mann-Whitney per pair,
  Kruskal-Wallis across the three conditions), one results subsection per RQ.

## Per-run procedure (one run of one cell)
1. **Acquire the lock** (`.run_ax2.lock`); refuse if held. Trap-release on exit.
2. **Fresh workspace**: copy the frozen scaffold (`scaffold/`, a bare TS+Prisma+
   Express skeleton identical for all conditions) to a run dir. Never generate
   into a shared tree.
3. **Generate**: feed the condition's prompts in order to the model via its runner
   (claude-cli / openai-api / gemini-api / ollama). Capture raw stream + tokens.
4. **Typecheck**: `tsc --noEmit`.
5. **Conformance gate (the precondition, not a score)**: reset DB, serve, run the
   shared Hurl oracle (`experiments/sx/repos/realworld-oracle/specs/api/hurl`, 13
   files). Record pass/total. **A run that does not pass is recorded but NOT
   scored on quality** — correctness is the precondition, quality is the question.
6. **Objective metrics** (only on passing runs): `node ax2_metrics.cjs <run_dir>`.
   Set `AX2_HEAVY=1` to include branch coverage (c8) + mutation (stryker); these
   are minutes-per-run, so batch them as a second pass over passing runs only.
7. **Kill server; archive the run dir metrics JSON; delete the heavy build output**
   (keep the metrics + raw log, not node_modules) to stay memory/disk safe.

## Execution order (memory-safe)
- One cell fully before the next. Within a cell, one rep at a time.
- Between reps: kill stray `node`/`tsx`/model processes; do NOT kill `claude.exe`
  (risk of killing the orchestrating session — the SX/OOM lesson).
- Ollama cells: only one model loaded at a time (`ollama stop` the previous).
- Order suggestion: cheap+local first (Ollama capacity spine → validates the
  pipeline end to end at ~0 marginal cost), then Claude, then any vendor-key tier.

## What we measure — see `ax2_metrics.cjs`
Headline (objective, blind): mutation score, real branch coverage, cyclomatic
complexity (mean/p95/max/over-10), duplication %, dead exports, tsc-strict pass +
explicit-any, npm audit high/critical, file/function length violations.
Secondary (continuity only, NOT the claim): 14-point rubric, cost per accepted
output (never a reduction %).

## RQ mapping
- **RQ1 quality** — C3 vs C1 and C3 vs C2 on the headline metrics, on frontier.
- **RQ2 cross-vendor** — does the C3>C1 advantage hold on Claude AND a GPT/Gemini
  model? (Needs a vendor key — see `models.txt`.)
- **RQ3 capacity-relative (novel)** — regress the (C3−C1) quality gap on model
  capability across {Claude, llama3.1:8b, llama3.2:3b}; negative slope (gap grows
  as capability falls) confirms capacity-relative scaffolding. Runnable NOW.

## Readiness (2026-09-14)
- READY now: Claude (frontier) + llama3.1:8b + llama3.2:3b → the **RQ3 spine**,
  cross-capability, ~0 marginal $ on the Ollama tier.
- BLOCKED: RQ2 cross-vendor until `OPENAI_API_KEY` or `GEMINI_API_KEY` is set.
- TODO before run: freeze `scaffold/` (bare skeleton), write `run_ax2.sh` (fork of
  `run_sx.sh` with per-condition prompt loop + the model-runner switch), pull an
  optional `qwen2.5-coder:7b` if a code-specialized local tier is wanted.
