# Master prompt for the second PC (GitHub Copilot route)

Status: 2026-10-09, branch `experiment-protocol-2026-10-02`. It registers nothing and changes no registration. The harness it drives is `experiments/fx1/harness/` (tested with a mock model and one real Claude development cell; **the Copilot adapter has never called a model**: it was written from the documentation and its flags were checked against the CLI's own `--help`). Evidence for the route: `docs/experiments/research/COPILOT-ROUTE-2026-10-09.md`. The one-page instructions for JC: `experiments/other-pc/README.md`.

## 1. What JC does (summary; the detail is in `experiments/other-pc/README.md`)

1. `git pull` the branch, then `node experiments/other-pc/setup.mjs` (checks, work tree, private results clone, images, env files).
2. In a NEW shell: load the env file the setup printed, then set the token **in that window only**: `COPILOT_GITHUB_TOKEN` (fine-grained token, permission "Copilot Requests"). Set the caps your plan makes meaningful (`FX_CAP_CREDITS` or `FX_CAP_PREMIUM`).
3. Start `copilot` (CLI) or agent mode from the repository root and paste the prompt of section 3 (everything inside the fence).
4. At each gate the agent stops and reports. Reply `GO phase N` to continue, or `STOP`. At the end open the billing usage page, write the totals in the report, run the push command it prints.

## 2. What this route can and cannot do (read before spending)

| Fact | Status |
|---|---|
| Copilot CLI has a headless mode (`copilot -p`), model flag, tool-permission flags, a per-session state folder, a transcript export | documented [V], flags confirmed in `--help` of CLI 1.0.94 [V*]; never run against a model |
| No API key is needed, but a GitHub token with Copilot access is; billing is token-based AI credits on current plans, premium requests only on legacy annual plans | [V] (see research note, section 1) |
| Token counts per call: the CLI can write OpenTelemetry files with token attributes | documented, **unproven in `-p` mode**; `adapter-probe --live` tests it. Until it passes, treat the route as unmetered |
| Terms for scripted bulk use on JC's plan | nothing permits or forbids it in the pages read; AUP prohibits "excessive automated bulk activity" and reserves suspension. **JC must check his plan and terms before Phase 3** (research note, section 5) |
| Session and weekly limits exist and are not published | expect HTTP 429 messages; the harness runs serially by default and treats them as infrastructure voids |
| Model ids in the CLI: `claude-sonnet-5.5`, `claude-opus-5.5`, `claude-haiku-5.5`, `claude-haiku-4.5`, `gpt-5.4`, `gpt-5.3-codex`, `gpt-6.1-sol`, `gpt-6-astra`, `gpt-6-luna`, `gemini-3.7-flash`, `gemini-3.8-flash` | [V]; which ones answer on JC's account is found by `models-discover.mjs` |

### Which experiments this route can finish

| Experiment or step | Runnable on this route today? | Why, and the substitute for what is missing |
|---|---|---|
| Critic rounds: FX-1, SDX-1, CMP-1, E2E-1, REM-1, SDX-8/9, WP5 panel, Functions panel | **Fully runnable** (Phase 1) | Quality text, no tokens needed. CMP-1, E2E-1, REM-1 use a NEW generic runbook (no Copilot runbook existed). SDX-8/9 are marked DROP by the portfolio decision of 2026-10-04: lowest priority |
| Practitioner prompts A5-m (SDX-0/1/8/9) | **Fully runnable** (Phase 2) | Two sessions per model. Using them needs the SDX harness, which does not exist yet |
| FX-0 diagnostic and FX-1 S0/S1 on development fixtures (Phase 3) | **Runnable**, cost numbers weak | Quality and void counts are exact. Cost per run needs tokens or credits: proxies are the ledger (calls, wall-clock), OTel tokens if the probe passes, and the billing-page delta per batch |
| FX-0 on the five confirmatory briefs (S2) | Runnable **only with JC's written go** (`GO-FX0.txt`) | Diagnostic only; opens the confirmatory briefs; not in this prompt's phases |
| FX-1 registered run (S3/S4, 840 runs) | **Not allowed**, and the cost rule needs metering | Gate: no annotated formulas tag, no `prereg/FX-1-v*` tag, `FX-1.md` is DRAFT. The registration budgets in dollars and stops on cost per run: needs API-metered keys or verified OTel/billing data per run. Claude CLI runs carry `total_cost_usd` (list-price notional) |
| P2, P3, P4 (detection, reconstruction, regression endpoints) | Runnable in principle | Endpoints are rates, not cost. **No registration and no harness exists yet** (portfolio decision) |
| P1 (tokens per accepted change with map upkeep) | **Cannot be completed without per-change token metering** | Substitute: OTel tokens per call if verified; else the Claude CLI route (reports usage per call, notional dollars); wall-clock and calls are weak proxies |
| REM-1 (net cumulative token cost, break-even) | **Cannot be completed without metering** | Cost is the primary endpoint. Substitute: OTel tokens or billing CSV credits per item; the registration says metered harness, so a proxy needs a registered amendment |
| SDX-8 (marginal cost per accepted change), SDX-9 (cost to verified COMPLETE) | **Cannot be completed without metering** | Cost is primary. Both are DROP in the portfolio decision |
| SDX-0/SDX-1, E2E-1, CMP-1 (quality endpoints; cost secondary) | Runnable once their harnesses exist; cost reported with a caveat | Cross-vendor judges (a different vendor from the generator) become possible through the Copilot CLI, which closes the "no non-Claude judge CLI" gap in SDX-1-ARMS |

## 3. The prompt (paste everything inside the fence, nothing else)

~~~~text
ROLE. You are an unattended OPERATOR on a second PC. You run a prepared harness, read ONLY its logs and status files, and write a report. You are not a subject and not a critic of any experiment. These instructions are model-agnostic: follow them literally. If anything here conflicts with your habits, these instructions win. If an instruction cannot be followed, stop and say which one.

0. HARD RULES (they override everything)
R1 Keys. Never write, print, echo, log, paste or commit a key or token (COPILOT_GITHUB_TOKEN, GH_TOKEN, GITHUB_TOKEN, ANTHROPIC_API_KEY, any other). Check that one is set only by its name and length. If you see a secret anywhere, stop, tell JC to revoke it, and write a deviation.
R2 Read-only design. Never edit anything under docs/experiments/prereg/, any runbook or prompt file, any formula, the checker, or anything under experiments/fx1/harness/. You may create files only under $FX_ROOT, in the results clone ($FX_RESULTS, only through the push script), and the report named in section 6.
R3 Statelessness. Every critic, practitioner and run session is started BY THE HARNESS in its own fresh container. You never run a critic, a subject or a formula in this conversation, and you never paste an experiment prompt into this chat.
R4 Blindness. Never open: experiments/fx1/fixtures/FIX-*.md; any critique, deliverable, A5/A6 text, report.json, checker.out.txt, raw turn file or sandbox of any cell; any other cell's output. You may read: phase-N.log, drive.log, phase-N-status.json, verification files, the output of phase-status.mjs, meta.json status/void fields (not outcomes), and this repository's documentation.
R5 Facts only. Record the exact model id strings and dates the harness reports. Never write a model id from memory. Never claim a model served a run unless meta.json says so.
R6 Deviations. The moment anything differs from this prompt or the runbooks (a model unavailable, a flag missing, a retry, a manual action, a timeout), append one line to $FX_ROOT/deviations.md: UTC time | what | what you did | who was told.
R7 No steering and no re-rolling. Never answer a model's question, edit an output, re-run a finished cell, or re-run to get a better result. The harness re-runs a void slot once (re-run the same phase command); a second failure is logged, not retried.
R8 Gates. At every GATE below, stop, write the gate report, and wait for JC to reply "GO phase N". Never start the next phase on your own. If JC says STOP, create $FX_ROOT/STOP and end.
R9 Long jobs. Never run a phase in the foreground. Start it detached and poll with short commands (phase-status.mjs). PowerShell: Start-Process node -ArgumentList '<script>','<args>' -RedirectStandardOutput "$env:FX_ROOT/phase-N.out" -RedirectStandardError "$env:FX_ROOT/phase-N.err" -WindowStyle Hidden. POSIX: nohup node <script> <args> > "$FX_ROOT/phase-N.out" 2>&1 &. Poll at most once every few minutes; do nothing between polls.
R10 Scope. Do exactly the phases below. Do not run Phase 4. Do not open the confirmatory briefs. Do not create tags, branches in the protocol repository, or pushes to the protocol repository (the public one). Pushing is allowed only to the private results repository through push-results.mjs.

1. SET UP AND PRINT (before any model call)
1.1 Find the repository root: the folder that contains docs/experiments/MASTER-PROMPT-COPILOT-PC.md and experiments/fx1/harness/run.mjs. Set REPO to its absolute path on THIS PC and PRINT it. All paths below are relative to REPO.
1.2 Run: git -C <REPO> fetch --all --tags ; git -C <REPO> checkout experiment-protocol-2026-10-02 ; git -C <REPO> pull --ff-only ; then PRINT git branch --show-current and git rev-parse HEAD. The branch must be experiment-protocol-2026-10-02, else stop.
1.3 Confirm the environment is loaded: PRINT (names only, never values of secrets) FX_ROOT, FORMULA_DIR, TOOLS_DIR, FX_RESULTS, and for each of COPILOT_GITHUB_TOKEN, GH_TOKEN, GITHUB_TOKEN whether it is set and its length. At least one token must be set. If FX_ROOT or FORMULA_DIR is missing, stop and tell JC to load the env file from experiments/other-pc/README.md step 2.
1.4 PRINT the caps in force: FX_CAP_CALLS, FX_CAP_HOURS, FX_CAP_PREMIUM, FX_CAP_CREDITS, FX_CAP_USD, FX_SOFT. If neither FX_CAP_PREMIUM nor FX_CAP_CREDITS is set, STOP and ask JC to set the one that matches his plan (do not guess a number). Never raise a cap yourself.
1.5 Create $FX_ROOT/deviations.md with three headings: Decisions, Standing deviations, Events. Under Standing deviations write: "Copilot CLI route: headless -p; no human in the chat of any subject; critic runs are headless with a DRIVER block (DRV-1..4 in critic-run.mjs); token counts only if the OpenTelemetry probe passes; instruction-file name CLAUDE.md for every vendor; network open in agent containers; no web block beyond instructions."
1.6 Data-use check: ask JC (once) to confirm in his Copilot/GitHub settings that his content is not used for training and that his plan's terms allow scripted use (research note docs/experiments/research/COPILOT-ROUTE-2026-10-09.md section 5). Write his answer under Decisions. Do not proceed to model calls without an answer.

2. VERIFY THE ENVIRONMENT (the V1 to V8 checks of docs/experiments/RUNBOOK-FX1-OTHER-PC.md section 10)
Run, in this order, and write each result (pass or fail, first line of output) into $FX_ROOT/verify/verification.md (the scripts write most of it):
V1 V2 V3 V8 + isolation:  node experiments/fx1/harness/verify-env.mjs --controls   (about 5 minutes; builds the checker test image; V3 = checker controls G1 G3 GS1 R06 B05 and unit tests, fail 0)
V4 V5 (adapter probe, one tiny paid call pair per model):  node experiments/fx1/harness/models-discover.mjs   then, for ONE available model of each vendor (openai, google, anthropic):  node experiments/fx1/harness/adapter-probe.mjs --adapter copilot --model <id> --live
   Pass means: every flag found in copilot --help, ping answered OK, the isolation probe lists no file and says no memory and no tools beyond shell/read/write, the served model id is reported, AND token usage was captured (if not captured, write the sentence "TOKENS NOT AVAILABLE ON THIS ROUTE" in the report and in deviations.md; the phases still run, cost numbers are then proxies only).
V6 is the Phase 3 dry run. V7 (golden checker pair) does not exist on this PC: write "V7 not available" in deviations.md.
If any of V1 to V5 or isolation fails, STOP: do not start Phase 1. Report the failing line verbatim (no secrets) and what you think the cause is.
Caution on models: use only ids that models-discover.mjs marked AVAILABLE. If fewer than three vendors answer (anthropic, openai, google), say so at Gate 0; Phase 1 will then be an incomplete round and must be reported as incomplete.
GATE 0: report V1-V8 results, the available model ids by vendor, the token-capture result, the caps, and the estimated number of calls per phase (section 4 of docs/experiments/MASTER-PROMPT-COPILOT-PC.md: Phase 1 about 120 calls, Phase 2 about 12, Phase 3 about 100). Wait for "GO phase 1".

3. PHASE 1 - vendor-diverse CRITIC rounds (all runbooks that exist; each critic is a fresh container with ONLY its allowed files)
The harness runs, per target and per model, the runbook's own instruction with a DRIVER block that supplies the model id and round, and gives the critic a snapshot folder with only the files the runbook allows:
 fx1      docs/experiments/COPILOT-CRITIC-RUNBOOK-FX1.md        (FX-1 study + checker; first in priority)
 sdx1     docs/experiments/COPILOT-CRITIC-RUNBOOK.md            (SDX-1)
 cmp1 e2e1 rem1  docs/experiments/COPILOT-CRITIC-RUNBOOK-CMP-E2E-REM.md   (NEW generic runbook; target set in the message)
 wp5      docs/white-paper/COPILOT-CRITIC-RUNBOOK-WP5.md  on branch white-paper-5.0-draft   (six roles per model)
 functions docs/method/COPILOT-CRITIC-RUNBOOK-FUNCTIONS.md on branch lifecycle-2026-10-08   (six roles, role 1 three times)
 sdx89    docs/experiments/COPILOT-CRITIC-RUNBOOK-SDX-8-9.md    (lowest priority; the portfolio decision marks SDX-8/9 DROP)
Output schemas are the runbooks' own. The harness validates the schema (headings, F-nn blocks, severities) and keeps every file as the model wrote it.
3.1 Start (detached, R9):  node experiments/fx1/harness/run-phase.mjs --phase 1      (models = models.json defaults filtered by availability; to force a list use --models id1,id2,...)
3.2 Poll with:  node experiments/fx1/harness/phase-status.mjs 1   until it says ended. Do not read any critique.
3.3 If it exits 3 (a void) or 6 (a schema failure): run the same command once more (the harness archives the failed slot and re-runs it once). If it exits 4 (cap or STOP): do not raise the cap; go to the gate.
3.4 Push to the private results repository (never the public one):  node experiments/fx1/harness/push-results.mjs --phase phase1 --stage critics --match '^critic-' --push     (the script scans for secrets first and refuses to commit on a hit)
GATE 1: report per target and model: finished / schema-failed / void counts (from phase-status and meta status fields only), the vendors covered (a protocol round needs at least 3 vendors with at least 2 not Anthropic; the WP5 and Functions panels need at least 2 non-Anthropic vendors to complete all roles), the calls and wall-clock used against the caps, the pushed branch name. List what is owed. Wait for "GO phase 2".

4. PHASE 2 - practitioner prompts (A5-m), per docs/experiments/COPILOT-PRACTITIONER-RUNBOOK.md and docs/experiments/PRACTITIONER-HANDLING.md
Two fresh sessions per non-Anthropic model (variants m1 "told" and m2 "not told"), each a snapshot folder with exactly RUNBOOK.md, PASTURA-PRODUCT-DESCRIPTION.md and SESSION-FACTS.md, step 2 sent in the same session only after out/A6.md exists.
4.1 Start detached:  node experiments/fx1/harness/run-phase.mjs --phase 2
4.2 Poll as above. Do not read A5/A6 or any output.
4.3 Push:  node experiments/fx1/harness/push-results.mjs --phase phase2 --stage practitioner --match '^practitioner-' --push
GATE 2: report finished/incomplete/void per model and variant, calls used, pushed branch. Wait for "GO phase 3".

5. PHASE 3 - FX-0 diagnostic on DEVELOPMENT fixtures only (docs/experiments/RUNBOOK-FX1-OTHER-PC.md stages S0 and S1)
S0: environment verification plus one dry cell per vendor (path A, English, DEV-API-hivelog). S1: six cells per vendor from the seeded schedule (A hive-en, A kiln-es, A lamp-en, A tally-en, B kiln-en, B tally-es), run serially. Development fixtures only; the confirmatory briefs stay closed; the harness refuses them anyway.
5.1 Start detached:  node experiments/fx1/harness/run-phase.mjs --phase 3      (seed 20261009 unless JC gave another in FX_SEED; recorded in schedule-s1.txt)
5.2 Poll. Stop rules (create $FX_ROOT/STOP, the queue also does this itself): hard cap on any axis; soft cap (80 percent); two consecutive voids on one vendor; an authentication error; a model id served that differs from the id asked; any single cell with more than three times the median number of calls of its path; a secret found; JC says stop.
5.3 Classify voids from meta.json status/void fields only (infrastructure: 401/403/429/5xx, timeout, crash). Write $FX_ROOT/failures.csv: id, date, class, evidence line, action. Re-run each void slot ONCE by re-running the phase command. Do NOT open report.json or checker.out.txt (R4).
5.4 Push:  node experiments/fx1/harness/push-results.mjs --phase phase3 --stage s1 --match '^(dry|s1)-' --push
GATE 3: report cells launched, finished, voided, failed to start; calls and wall-clock; tokens if captured; model ids served per vendor; deviations. No outcome data. Wait.

6. PHASE 4 - REGISTERED RUN (gate only; you do NOT run it)
Run these exact checks and print their raw output:
  git -C <REPO> fetch --tags
  git -C <REPO> tag --list
  git -C <REPO> tag --list "formulas-v*" ; for each: git -C <REPO> cat-file -t <tag>      (must print: tag. "commit" means lightweight = not frozen)
  git -C <REPO> tag --list "prereg/FX-1-v*"
  grep -m1 "^Status:" docs/experiments/prereg/FX-1.md      (PowerShell: Select-String -Path docs/experiments/prereg/FX-1.md -Pattern '^Status:' | Select-Object -First 1)   (must say FROZEN and not NOT FROZEN, not DRAFT)
  node experiments/fx1/harness/gate-check.mjs                                             (must print: REGISTERED RUN ALLOWED: YES)
If ANY check fails, write exactly this in the report and in your reply: "REGISTERED RUN NOT ALLOWED: <the reasons printed by gate-check.mjs>" and do nothing else for Phase 4. If all pass, still do not start: report "gate open", ask JC for GO plus the seed, the exact model ids, the formulas tag and the schedule file (RUNBOOK-FX1-OTHER-PC.md G-1), and the independent-person conditions (G-4, G-5), and wait. (Today: no annotated formulas tag exists, no prereg tag exists, FX-1.md says DRAFT, NOT FROZEN.)

7. FINAL REPORT (after the last gate you reached, or at any STOP)
Write $FX_ROOT/REPORT.md (at most two pages) with: (a) what ran: phases, jobs, cell counts by status, model ids served by vendor, dates, harness commit and formulas commit; (b) what failed: each void or failure with its class and the first error line (no secrets); (c) what is owed: critic targets/models not completed, missing vendors, Phase 4 not allowed and why, token capture result, items needing JC; (d) spend as the harness sees it: calls, wall-clock, premium estimate (multiplier unknown flagged), tokens if captured; (e) a section "FOR JC TO FILL": "Open GitHub Settings, Billing and licensing, Metered usage, Copilot (or the premium requests page of a legacy plan). Record the totals before and after this run: <JC: before> <JC: after> <JC: AI credits or premium requests used> <JC: any overage charge>. Paste them here and in spend.csv." (f) the list of deviations. Then copy REPORT.md, deviations.md, failures.csv, spend.csv and the verify folder into $FX_ROOT/final-report/ and run: node experiments/fx1/harness/push-results.mjs --phase report --stage final --cells none --extra "$FX_ROOT/final-report" --push Finish by telling JC the branch names pushed, the report path, and what you did NOT do. Then stop.
~~~~

## 4. Caps proposed for JC (his to set; the prompt never raises them)

| Phase | Calls (each call is one headless agent run) | Suggested `FX_CAP_CALLS` | Wall-clock | Notes |
|---|---|---|---|---|
| Gate 0 probes and discovery | about 25 small calls | 40 | 1 h | one ping per candidate model plus the probe pair |
| Phase 1 critics | 5 runbook targets x 5 models + WP5 6 x 5 + Functions 8 x 5 + SDX-8/9 5 = about 120 | 150 | 8 h | each call reads 50 to 500 KB; the Compendium panel may exceed a small context window |
| Phase 2 practitioner | 3 models x 2 variants x 2 messages = 12 | 20 | 1 h | |
| Phase 3 S0 + S1 | 3 dry cells + 18 cells, about 3 to 6 calls each = about 100 | 140 | 6 h | Claude development loop spent about $2 per cell list-notional: 21 cells is roughly $40 notional, **about 4,000 AI credits if the Copilot rates are similar**: check against the plan allowance before GO phase 3 |

`FX_CAP_CREDITS` or `FX_CAP_PREMIUM`: set from the plan page. Premium requests are counted as one per prompt times the multiplier in `models.json` (empty = 1, flagged; the legacy multiplier table was not read). Credits are computed from OTel token counts times the default-context prices in `models.json` (taken from the GitHub pricing page on 2026-10-09; cache-write and long-context tiers are not modelled): **if tokens are not captured, a credits cap cannot be enforced and the harness stops with UNENFORCEABLE after three calls** rather than pretending. The call and wall-clock caps and the billing page are the controls that always work.

## 5. After the run (main PC)

Pull the private results repository branches; read nothing in `phase3` outcome files until the gate decision about FX-0 is made; adjudicate critiques per `docs/experiments/ROLES.md` section 3; compare the ledger with the billing totals JC pasted; decide whether the Copilot adapter earns a place in the freeze list (it is not in it).
