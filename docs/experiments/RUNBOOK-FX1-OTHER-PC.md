# FX-1 on another PC: step-by-step runbook (FX-0 diagnostic first, then the registered run)

Status: 2026-10-09, branch `experiment-protocol-2026-10-02`. Written for the person at the second PC (JC or someone JC names). Nothing here has been run on another machine. The runbook does not change the registration (`docs/experiments/prereg/FX-1.md`, draft revision 3, not frozen); where this runbook and FX-1.md differ, FX-1.md wins and the difference is logged as a deviation (section 12).

Every command is given twice: **PowerShell** (Windows PowerShell 5.1 or 7) and **POSIX shell** (bash or zsh, macOS or Linux, or Git Bash). Use one shell for the whole session. Files that this runbook calls "NEW, review before use" were written for this purpose, have been syntax-checked but never run against a model, and are listed in section 14.

## 0. Read this first (five minutes)

### 0.1 What you can and cannot do today

| Stage | What it is | Can it run today? | Needs |
|---|---|---|---|
| S0 | set up the PC and prove it with a dry run on a development fixture and the known-good controls (section 10) | **yes** | sections 2 to 9 |
| S1 | development batch per vendor: 6 runs per vendor on development fixtures, to see vendor-sensitive clauses (JC's default from the dev-loop reports) | **yes**, for the vendors that have a working adapter (section 7) | S0 passed |
| S2 | **FX-0 diagnostic part**: 60 runs registered (5 fixtures x 3 vendors x 4 streams); only the English streams (30 runs) are runnable today | **yes, if JC says go**; English only | S0, adapters for 3 vendors, JC's written go, gate G-1 |
| S3 | FX-0 held-out part: 24 runs, a different seed, never used to repair anything; it is the checker's validation sample | not yet | S2 closed, checker repairs finished, independent auditor named |
| S4 | the **registered FX-1 run** (840 runs of FORM, plus F0 and CHK, and path C if kept) | **no** | the gates G-2 to G-6 below |

### 0.2 Gates (each has a command; a gate that fails stops the stage that needs it)

| Gate | Needed for | What must be true | Check (section 4.5 and 10) | State on 2026-10-09 |
|---|---|---|---|---|
| G-0 | everything | the PC passed section 10 | V1 to V8 | to do |
| G-1 | S2 | JC wrote "go" for FX-0 and gave you: the formulas commit to use, the seed, the model ids, the per-stage spend cap | message from JC | not given |
| G-2 | S4 | an **annotated** tag of the formulas (`formulas-v1` or the name FX-1.md item 1 fixes), English and neutral-Spanish texts hashed | `git cat-file -t <tag>` prints `tag` | **missing**: the only tag is `formulas-2026-10-05`, a lightweight tag (prints `commit`) on the branch head; it is a bookmark, not a freeze |
| G-3 | S4 | the registration tag `prereg/FX-1-v1`, with the freeze list (checker SHA-256, config hash, harness hash, model ids, seeds) | `git tag -l 'prereg/FX-1-v*'` | **missing** |
| G-4 | S4 | the checker validated: controls by an independent person, held-out audit passed (FX-1.md section 6) | JC's message and the logbook | **open** |
| G-5 | S4 | the five fixture briefs approved or rewritten by an independent reader, at least two as unstructured prose; Spanish briefs translated | the freeze list | **open** (briefs are drafts by the GS side; no Spanish) |
| G-6 | S4 | the funds: metered API keys for all three vendors, spend limits set at each vendor's console | section 3 | **keys absent** |

**Until G-2 to G-6 hold, this runbook is for S0, S1 and the FX-0 diagnostic only.** Do not start S4 "to save time": a run before the freeze is not a registered run, and its data would have to be excluded.

### 0.3 The ten rules that matter most

1. **Never write a key to a file, a repo, a log or the shell history.** Section 3.2 shows how.
2. **Never push a sandbox project** (`runs/<id>`), and never push anything from `runs/`, `logs2/`, `cfg/` or `results/` to the public remote (`https://github.com/jghiringhelli/generative-specification`). A sandbox has hooks that run code.
3. **Do not open the confirmatory fixtures early** (section 6): they stay out of your working tree until S2 starts and JC has said go.
4. **Each run is stateless**: a new container, a new empty configuration folder, a new volume, no resume across runs, no memory, no web, no MCP (the harness enforces; V4 and V5 prove it).
5. **The agent never sees the repository, the checker, the checklist or another run.** Only the formula text, the brief, and the reference lock tool.
6. **Do not read other cells' outputs while a stage is running**, and do not read the checker reports until the stage is over, except to classify a void (section 13) from the turn logs.
7. **Record the exact model id the vendor returns**, never an alias, and the date. A model change mid-stage voids the stage for that vendor.
8. **Log every deviation** in `deviations.md` the moment it happens (section 12).
9. **Stop on the stop rules** (section 11), not on feelings. Create the file `STOP` in the run folder to stop launching.
10. **Nothing is "fixed" by hand** in a sandbox, a transcript or a report. A failed run is data; a void run is archived and re-run once.

## 1. Folder layout used below

```
<FX_WORK>/                 any folder with 60 GB free, no spaces in the path, e.g. C:\fx1  or  ~/fx1
  repo/                    clone of the protocol repository, branch experiment-protocol-2026-10-02
  formulas/                a second work tree of the same clone, branch formulas-2026-10-05 (or the frozen tag)
  run/                     FX_ROOT: harness, docker files, dev fixtures, runs, logs, per-run config folders
    harness/ docker/ fixtures/ fixtures-legacy/        (from the bundle JC gives you, section 5)
    runs/<id>/             one sandbox per run (copied out of the container at the end)
    logs2/<id>/            raw turn outputs, meta.json, checker report
    cfg/<id>/              the empty configuration folder of one run, plus the session transcripts it wrote
  results/                 a separate git repository for what you send back (section 15)
```

## 2. Prerequisites

Install these once. Versions are minimums that the development loop used or that the tools document.

| Need | Version | Why | Check (PowerShell) | Check (POSIX) |
|---|---|---|---|---|
| git | 2.30 or later | clone, work tree, tags, bundles | `git --version` | `git --version` |
| Node.js on the host | 22 or 24 | the runner scripts and the harness (`run2.js`) run on the host; the agent and the checker run in the container (Node 24 inside) | `node --version` | `node --version` |
| Docker with **Linux containers** | Docker Desktop 4.x (Windows, macOS) or Docker Engine 24+ (Linux) | the registered environment is one pinned Linux image for agent and checker (FX-1.md section 3.3) | `docker version`, `docker run --rm hello-world` | same |
| Disk and memory | 60 GB free, 16 GB RAM | images, sandboxes, 4 parallel runs | `Get-PSDrive` | `df -h .` |
| Network | outbound HTTPS to the vendors and to the npm and PyPI registries | the agent installs project dependencies | none | none |
| Vendor tool for each vendor you will run | see section 3 | the headless agent | `claude --version` etc. | same |

Windows notes: Docker Desktop must be in Linux-container mode; keep `FX_WORK` on a local drive (not a network share or a synced folder); long paths enabled (`git config --global core.longpaths true`). Linux notes: your user must be in the `docker` group; files that the container writes into `runs/` are owned by root, so removing a sandbox needs `sudo rm -rf`.

Python is **not** needed on the host (the image has Python 3.11 and pytest).

## 3. Vendors, keys and metering

### 3.1 Which route gives tokens and cost, and which does not

The prerequisite for a **cost** number is a route that returns token counts. The prereg budgets in dollars (hard cap $3,500) and the stop rule uses cost per run, so a route without metering cannot carry the registered run.

| Route | Headless? | Tokens and cost per call | Use |
|---|---|---|---|
| Claude Code CLI with an Anthropic **API key** (`claude -p`) | yes | **yes**: the JSON result carries `usage` (input, output, cache read and write tokens), `modelUsage` (the model id actually served) and `total_cost_usd`. Observed in the development logs. Under a subscription login the cost is a list-price notional (`costBasis: list`), not a bill | S0 to S4. The dev loop used a subscription login; the registered run must use an API key so that spend is real |
| OpenAI Codex CLI (`codex exec`) with an OpenAI API key | yes | expected to report token usage in its JSON event stream; **not verified on this machine** | S1 to S4 once an adapter exists and V4 shows usage in the raw output |
| Gemini CLI (`gemini -p`) with a Gemini API key | yes | expected to report token statistics in its JSON output; **not verified** | same |
| GitHub Copilot CLI (`copilot -p`) or the Copilot agent in the editor | the CLI possibly, the editor agent no | **none**: Copilot returns no token counts and no cost | not for cost. Only appendix A (a manual FX-0 sample, no spend numbers) |

The tool names above come from memory and are unverified on this PC (FX-1.md item 4 says the same about Copilot). For every vendor, run `<tool> --help` and map its flags to the adapter contract in section 7 before anything else. **If a vendor cannot give tokens through its own CLI, use its HTTP API through an adapter that records `usage`; a vendor with neither is excluded from the cost analysis and must be declared so.**

Independent check that never relies on the CLI: create **one API key per vendor per stage** at the vendor's console, name it (`fx1-s2-<pc>`), and set a **hard spend limit** at the console equal to the stage cap (section 11). The console's usage page then gives ground-truth spend per key. Save an export (CSV or a screenshot without the key) to `results/<stage>/console/`.

Data handling (FX-1.md item 4): before sending any fixture to a vendor, confirm in that vendor's account settings that your content is not used for training, and write the decision (vendor, setting, date, screenshot without secrets) in `deviations.md` under "Decisions".

### 3.2 Putting a key in the environment without writing it anywhere

The key lives only in the environment of the shell window that starts the runs. Open a **new** window for each stage and close it when the stage ends.

**PowerShell** (the input is not echoed and is not saved by the history):
```powershell
$s = Read-Host "ANTHROPIC_API_KEY" -AsSecureString
$env:ANTHROPIC_API_KEY = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s))
Remove-Variable s
```
Repeat for `OPENAI_API_KEY` and `GEMINI_API_KEY` (the names the vendors' tools read; confirm with each tool's help).

**POSIX shell**:
```sh
read -rs -p "ANTHROPIC_API_KEY: " ANTHROPIC_API_KEY; echo; export ANTHROPIC_API_KEY
read -rs -p "OPENAI_API_KEY: " OPENAI_API_KEY; echo; export OPENAI_API_KEY
read -rs -p "GEMINI_API_KEY: " GEMINI_API_KEY; echo; export GEMINI_API_KEY
```

Rules: never `echo` a key, never put it in a profile (`$PROFILE`, `.bashrc`, `.zshrc`), a `.env` file, a script, a Docker image or an issue; never pass it as a command-line argument (arguments are visible in process lists). The harness hands it to the container as `-e ANTHROPIC_API_KEY` (a name without a value, which makes Docker copy it from the calling process; section 5 patch 4). Check it is set without printing it:
```powershell
if ($env:ANTHROPIC_API_KEY) { "set, length " + $env:ANTHROPIC_API_KEY.Length } else { "NOT SET" }
```
```sh
[ -n "$ANTHROPIC_API_KEY" ] && echo "set, length ${#ANTHROPIC_API_KEY}" || echo "NOT SET"
```

If a key leaks (pasted in a chat, committed, shown on screen): revoke it at the vendor's console at once, make a new one, and write a deviation. A run in progress when a key is revoked is void (section 13).

### 3.3 Model ids

Use **dated snapshot ids**, not aliases such as `sonnet` (FX-1.md section 4.2). The development loop used the alias `sonnet`, which served `claude-sonnet-5-5` according to the raw JSON; for the registered run the harness argument must be the full id. Get the exact ids from JC (G-1). The runner reads them from environment variables named `FX_MODEL_<VENDOR>` where `<VENDOR>` is the tag in the schedule (`ANTH`, `OAI`, `GOOG`):

```powershell
$env:FX_MODEL_ANTH = "<exact Anthropic model id from JC>"
$env:FX_MODEL_OAI  = "<exact OpenAI model id from JC>"
$env:FX_MODEL_GOOG = "<exact Google model id from JC>"
```
```sh
export FX_MODEL_ANTH="<exact Anthropic model id from JC>"
export FX_MODEL_OAI="<exact OpenAI model id from JC>"
export FX_MODEL_GOOG="<exact Google model id from JC>"
```
After the first call of every run, `run-record.mjs` (section 10) prints the model id the vendor says it served. If it differs from the id you asked for, stop and log it.

## 4. Get the code

### 4.1 Resolve and print the repository root first (do this before anything else)

JC's usual rule is absolute paths always. You are on a different PC, so the absolute location of the repository is unknown to whoever wrote this runbook. Resolve it, print it, and treat every path below as relative to it.

**PowerShell**
```powershell
$FX_WORK = "C:\fx1"                      # your choice; no spaces
New-Item -ItemType Directory -Force $FX_WORK | Out-Null
git clone -c core.autocrlf=false https://github.com/jghiringhelli/generative-specification.git "$FX_WORK\repo"
$REPO = (Resolve-Path "$FX_WORK\repo").Path
"REPO=$REPO"
Test-Path "$REPO\docs\experiments\prereg\FX-1.md"     # must print True
```
**POSIX**
```sh
FX_WORK="$HOME/fx1"; mkdir -p "$FX_WORK"
git clone -c core.autocrlf=false https://github.com/jghiringhelli/generative-specification.git "$FX_WORK/repo"
REPO="$(cd "$FX_WORK/repo" && pwd)"; echo "REPO=$REPO"
test -f "$REPO/docs/experiments/prereg/FX-1.md" && echo present
```
`core.autocrlf=false` matters: a Windows checkout that rewrites line endings changes the SHA-256 of every file, breaks the hash checks below and puts CRLF into shell scripts and hooks.

### 4.2 The two branches

The protocol, the preregistration and the runner scripts are on `experiment-protocol-2026-10-02`. The formulas, the checker and the reference lock tool are on `formulas-2026-10-05` (until a frozen tag exists). They are two work trees of one clone.

**PowerShell**
```powershell
git -C $REPO fetch --all --tags
git -C $REPO checkout experiment-protocol-2026-10-02
git -C $REPO pull --ff-only
git -C $REPO worktree add --detach "$FX_WORK\formulas" origin/formulas-2026-10-05
$FORMULAS = (Resolve-Path "$FX_WORK\formulas").Path
"FORMULAS=$FORMULAS"
git -C $REPO branch --show-current       # must print experiment-protocol-2026-10-02
git -C $FORMULAS rev-parse HEAD           # print it; it must equal the commit JC gave you (G-1)
```
**POSIX**
```sh
git -C "$REPO" fetch --all --tags
git -C "$REPO" checkout experiment-protocol-2026-10-02 && git -C "$REPO" pull --ff-only
git -C "$REPO" worktree add --detach "$FX_WORK/formulas" origin/formulas-2026-10-05
FORMULAS="$(cd "$FX_WORK/formulas" && pwd)"; echo "FORMULAS=$FORMULAS"
git -C "$REPO" branch --show-current
git -C "$FORMULAS" rev-parse HEAD
```
If JC gives a specific commit or tag for the formulas, check it out instead: `git -C $FORMULAS checkout --detach <commit-or-tag>`.

### 4.3 Keep the confirmatory fixtures closed

The five registered briefs (`experiments/fx1/fixtures/FIX-*.md`) are in the same branch. They are **not opened** until S2 starts. Do not read them, do not list their contents, do not copy them to the run folder. Opening them early would void the claim that nobody tuned anything on them (FX-1.md sections 4.1 and 10 row (v)). If your tooling indexes the folder, exclude it, or use a sparse checkout:
```sh
git -C "$REPO" sparse-checkout init --no-cone
git -C "$REPO" sparse-checkout set '/*' '!/experiments/fx1/fixtures/FIX-*.md'
```
```powershell
git -C $REPO sparse-checkout init --no-cone
git -C $REPO sparse-checkout set '/*' '!/experiments/fx1/fixtures/FIX-*.md'
```
To open them at S2: `git -C $REPO sparse-checkout disable` (and write the time in `daily-log.md`). The development fixtures are different files and live in the bundle (section 5).

### 4.4 Record the hashes you will need

Print and save these in `results/ENV-RECORD.txt` (section 10, V1). Expected values at the development commit `76092e0` of the formulas branch; **the freeze list overrides them**:

| What | Expected (dev commit 76092e0) |
|---|---|
| `tools/gs-check/gs-check.mjs` SHA-256 | `249ddd878a101e1e4844083cd847d16e2afa21ddf61633bb2d248c0da614354d` |
| `node tools/gs-check/gs-check.mjs --print-config` line `config_sha256` | `07bc5880d5e1c500d86352f2075c8273623606d7aca63d68190cf5f5c80210c9` |
| `tools/gs-lock/gs-lock.mjs` SHA-256 | `7019c73e4e00f4e74a5ec9df3871657d83cb9ccaec42afd5da9180b710e81403` |

```powershell
Get-FileHash "$FORMULAS\tools\gs-check\gs-check.mjs" -Algorithm SHA256
node "$FORMULAS\tools\gs-check\gs-check.mjs" --print-config | Select-String config_sha256
```
```sh
sha256sum "$FORMULAS/tools/gs-check/gs-check.mjs" "$FORMULAS/tools/gs-lock/gs-lock.mjs"
node "$FORMULAS/tools/gs-check/gs-check.mjs" --print-config | grep config_sha256
```
A mismatch means a different commit, or line-ending conversion. Fix the cause (section 4.1) before going on.

### 4.5 The frozen-tag gate (G-2, G-3): the check command

```powershell
git -C $REPO fetch --tags
git -C $REPO tag -l 'prereg/FX-1-v*' 'formulas-v*'        # expect the registration tag and the formulas tag
$TAG = "formulas-v1"                                       # or the name JC gives
git -C $REPO cat-file -t $TAG                              # must print: tag   (annotated). "commit" = lightweight = NOT frozen
git -C $REPO rev-parse "$TAG^{commit}"                     # the commit it freezes; equals the FORMULAS head you use
git -C $REPO verify-tag $TAG                               # only if JC signs tags; otherwise skip
```
```sh
git -C "$REPO" fetch --tags
git -C "$REPO" tag -l 'prereg/FX-1-v*' 'formulas-v*'
TAG=formulas-v1                                            # or the name JC gives
git -C "$REPO" cat-file -t "$TAG"                          # must print: tag
git -C "$REPO" rev-parse "$TAG^{commit}"
```
Expected today: the first command prints nothing; `formulas-2026-10-05` prints `commit`. **Result: not frozen, FX-0 and below only.** At the freeze, also compare the printed hashes against the freeze list, and compare the SHA-256 of the English block and of the Spanish block of each formula (prompt-pack section E lists the files).

## 5. Build the harness folder (from the bundle) and patch it

The development harness, the Docker files and the development fixtures are **not in git**; they live in `C:\workspace\PragmaWorks\lab-runs\fx1-dev\` on the main PC. JC sends you one archive made there (commands in appendix B), `fx1-bundle-<date>.zip`, with a `MANIFEST.sha256` file. The runner scripts (NEW) and the patch are in git: `experiments/fx1/runner/`.

### 5.1 Unpack and verify the bundle

```powershell
$FX_ROOT = "$FX_WORK\run"
New-Item -ItemType Directory -Force $FX_ROOT | Out-Null
Expand-Archive -Path .\fx1-bundle-*.zip -DestinationPath $FX_ROOT
Get-Content "$FX_ROOT\MANIFEST.sha256" | ForEach-Object {
  $h,$f = $_ -split '\s+\*?',2; $a = (Get-FileHash "$FX_ROOT\$f" -Algorithm SHA256).Hash.ToLower()
  if ($a -ne $h) { "MISMATCH $f" } }
"manifest check done (no MISMATCH lines = good)"
```
```sh
FX_ROOT="$FX_WORK/run"; mkdir -p "$FX_ROOT"; unzip -q fx1-bundle-*.zip -d "$FX_ROOT"
(cd "$FX_ROOT" && sha256sum -c MANIFEST.sha256 | grep -v ': OK$' ; echo "manifest check done (only this line = good)")
```
The folder must now hold `harness/`, `docker/`, `fixtures/` (the four development briefs, English and Spanish), `fixtures-legacy/` (three legacy projects for path C), and optionally `golden/` (section 10, V7).

### 5.2 Patch a copy of the harness

`harness/run2.js` is the working flow of the second development loop (section 8 explains it). It is written for the main PC and for one login-based Claude setup. Five things must change; `patch-harness.mjs` makes a **copy** (`run2-portable.js`) and fails loudly if the original is not the expected version:

1. `ROOT` comes from the environment variable `FX_ROOT` instead of a fixed `C:/workspace/...` path.
2. The OAuth copy step (`sync-creds.js`) is removed: you use an API key.
3. The container gets `-e ANTHROPIC_API_KEY` (name only, no value).
4. A fresh, empty configuration folder per run (`cfg/<id>`), as FX-1.md section 5 step 1 requires (the development harness shared one folder), whose session transcripts you keep as evidence.
5. The agent container mounts **only** `tools/gs-lock` (the reference lock tool the lock formula installs), not the whole `tools` folder. The development harness mounted the whole folder, which made the checker's source readable by the agent; for the registered run that would be a leak.

```powershell
node "$REPO\experiments\fx1\runner\patch-harness.mjs" "$FX_ROOT\harness\run2.js" "$FX_ROOT\harness\run2-portable.js"
node --check "$FX_ROOT\harness\run2-portable.js"; "syntax ok"
```
```sh
node "$REPO/experiments/fx1/runner/patch-harness.mjs" "$FX_ROOT/harness/run2.js" "$FX_ROOT/harness/run2-portable.js"
node --check "$FX_ROOT/harness/run2-portable.js" && echo "syntax ok"
```
Expected: `patches applied: 7`. If it prints `PATTERN NOT FOUND`, the harness differs from the version this runbook was written for: stop and tell JC; do not edit by hand.

Two more environment variables the harness reads (it already supports them):
```powershell
$env:FORMULA_DIR = "$FORMULAS\docs\formulas"
$env:TOOLS_DIR   = "$FORMULAS\tools"
$env:FX_ROOT     = $FX_ROOT
```
```sh
export FORMULA_DIR="$FORMULAS/docs/formulas" TOOLS_DIR="$FORMULAS/tools" FX_ROOT="$FX_ROOT"
```
Constants inside the harness that you do **not** change but must record (deviation list, section 12): the brackets' `DATE = '2026-10-07'` (a constant, not today's date), `--max-budget-usd 14` per call, 55 minutes per call, 5 or 6 calls per session, `--permission-mode acceptEdits`, tools `Bash,Read,Write,Edit,Glob,Grep`, and the unrestricted container network (FX-1.md section 3.3 asks for registries only; the development harness does not restrict it).

### 5.3 Build the two images

```powershell
cd $FX_ROOT
docker build -t fx1-linux -f docker\Dockerfile docker
docker build -t fx1-linux-claude -f docker\Dockerfile.claude docker
docker image ls fx1-linux fx1-linux-claude
```
```sh
cd "$FX_ROOT"
docker build -t fx1-linux -f docker/Dockerfile docker
docker build -t fx1-linux-claude -f docker/Dockerfile.claude docker
docker image ls fx1-linux fx1-linux-claude
```
`fx1-linux` is Node 24, Python 3.11, pytest, git and bash (the registered image for agent and checker). `fx1-linux-claude` adds the Claude Code CLI and a non-root user `agent` (uid 1001) with `/work`. Record the image IDs (`docker image inspect --format '{{.Id}}' fx1-linux`) in `ENV-RECORD.txt`; the freeze list pins the image, so on the registered run these must equal JC's values. Note that `Dockerfile.claude` installs the CLI at its current version (no version pin): record `docker run --rm fx1-linux-claude claude --version`.

## 6. Fixtures: development versus confirmatory

| Class | Files | Use | Open? |
|---|---|---|---|
| **Development** (4 briefs, EN and ES) | `run/fixtures/DEV-API-hivelog`, `DEV-CLI-kilnlog`, `DEV-PIPE-lampwatch`, `DEV-GAME-tallyhouse` (`.en.md`, `.es.md`) | S0 dry run, S1 vendor batch, any harness test | yes; tuned on already |
| **Development legacy** (3 projects) | `run/fixtures-legacy/habits`, `shortly`, `rollup` | path C dry runs only | yes |
| **Confirmatory** (5 briefs) | in git: `experiments/fx1/fixtures/FIX-API-lendmark.md`, `FIX-CLI-stitchcount.md`, `FIX-PIPE-tidewatch.md`, `FIX-GAME-cinderfall.md`, `FIX-MCP-shelfwise.md` | S2, S3, S4 only | **no, until S2 starts and JC says go** |
| **Confirmatory legacy** (5 projects, path C) | not selected: an independent person must choose them (FX-1.md section 4.1c) | S4 path C | do not use the development legacy projects in the study |

Rules: development fixtures are never used in S2, S3 or S4. Confirmatory fixtures are never used for a harness test or a dry run. The briefs are drafts by the GS side; FX-1.md item 3 requires an independent reader to approve or rewrite them before the freeze, so an FX-0 on the drafts is diagnostic only. There are **no Spanish confirmatory briefs yet**: until they exist, S2 runs the English streams only (A-EN, B-EN: 30 of the 60 registered runs).

To use a confirmatory brief at S2, copy it into the harness fixture folder under the name the harness expects (`<key>.<lang>.md`):
```powershell
Copy-Item "$REPO\experiments\fx1\fixtures\FIX-API-lendmark.md" "$FX_ROOT\fixtures\FIX-API-lendmark.en.md"     # repeat for the other four
```
```sh
cp "$REPO/experiments/fx1/fixtures/FIX-API-lendmark.md" "$FX_ROOT/fixtures/FIX-API-lendmark.en.md"            # repeat for the other four
```
The canary probe (FX-1.md section 4.1) must have been run for every fixture and vendor before S4; prompt draft PP-NEW-CANARY in the prompt pack; the fact lists are owed (prompt-pack section G item 1). A canary hit makes that fixture `INVALID-DESIGN` for that vendor.

## 7. The vendor adapter: what exists and what is missing

`run2.js` calls one function, `claude(label, prompt, resume)`, which runs `docker run ... fx1-linux-claude claude -p <prompt> --model <id> --output-format json --permission-mode acceptEdits --tools Bash,Read,Write,Edit,Glob,Grep --allowedTools ... --disable-slash-commands --strict-mcp-config --max-budget-usd 14 [--resume <session>]` and reads the JSON back (`session_id`, `result`, `is_error`, `total_cost_usd`). **It supports Anthropic only.** The other vendors need an *adapter*: the same function for their tool, and an image that contains their tool (`fx1-linux-<vendor>`, built `FROM fx1-linux` like `Dockerfile.claude`). **No adapter exists. Until one exists and passes V4 to V6 for a vendor, this PC can run that vendor in no stage.** (FX-1.md section 4.2 and item 4 say that automated access to three vendors is a precondition of the freeze.)

### 7.1 The adapter contract (every vendor must meet every line)

| # | Requirement | Why |
|---|---|---|
| A1 | non-interactive: one prompt in, the agent works until it stops, one result out | the harness defines "finished" as a turn that ends without a tool call |
| A2 | tools limited to shell, file read, file write, file edit, search; **no web, no MCP, no skills or slash commands, no memory, no user instruction file, no hooks from the user's configuration** | FX-1.md section 5 step 1; the agent sees only the formula and the brief |
| A3 | edits and shell commands auto-approved inside the container | unattended |
| A4 | the model is set by an exact id; the vendor's response states the id actually served | no aliases (FX-1.md 4.2); drift is detected |
| A5 | a spend or turn cap per call | the dev harness used `--max-budget-usd 14` |
| A6 | a conversation handle that lets the **next call continue the same conversation** (the formulas are multi-step: ratify, then continue) | resume inside a run is allowed (FX-1.md section 5 step 1); across runs it is not |
| A7 | the final text, an error flag, and token usage per call (input, output, cached) | analysis and the cost stop rule |
| A8 | raw stdout and stderr saved unchanged to `logs2/<id>/turnNN-<label>.raw.txt` | evidence, guard (i) |
| A9 | a vendor failure (auth, rate limit, outage) is distinguishable from the agent stopping | section 13 |
| A10 | the key arrives as an environment variable passed by name (`-e NAME`), never in the image or the arguments | rule 1 |

If a vendor's tool cannot continue a conversation headlessly (A6), say so in `deviations.md`: the adapter would have to resend the transcript, which changes the session and must be a decision of JC, not of the runner.

### 7.2 Smoke test of an adapter (before V6)

Use the NEW probe `PP-NEW-PROBE` (prompt pack, section D) in an empty folder, through the adapter. A good answer lists no files, says there is no instruction file or memory and no web or other tool, and states a model id equal to the one you asked for. Save the raw output as `results/S0/probe-<vendor>.raw.txt`. Anything else (a project file listed, a memory quoted, web access) blocks that vendor.

## 8. How a run works (the flow you are automating)

This is the flow of `harness/run2.js` as run in development loop 2 (`soma/docs/fx1-dev-loop-2-2026-10-07.md`). Each run is one invocation: `node run2-portable.js <id> <A|B|C> <en|es> <fixtureKey>`, with `FX_MODEL` set to the exact model id.

1. A Docker volume `fxvol2-<id>` is the sandbox (`/work`). A fresh empty folder `cfg/<id>` is the agent's configuration folder. The sandbox starts empty (A, B) or with a copy of a legacy project (C; `git init` state as in the fixture).
2. **Path A (greenfield)**: the harness fills the brackets of the English or Spanish block of `greenfield.md` (brief, stack "as my spec says", file name `CLAUDE.md`), sends it as the first message of a fresh `claude -p` session. When the turn ends without finishing, it sends the scripted messages (`RATIFY`, then `CONT`; section 8.2) up to 6 calls. "Finished" = a reply that contains the words PRESENT or MISSING and a table, after at least two calls.
3. **Path B (adopt)**: a *plain MVP* is built first by a separate session with the neutral prompt (no GS words; PP-FX1-NEUTRAL; the base commit is recorded as `meta.base`/`mvpBoundary`). Then `adopt.md` runs in a fresh session with the spec set to "none" (no brief), with the same scripted messages. The generated spec comes from reading the code. (FX-1.md item 14: whether to delete the MVP's own spec file before F2 is undecided; the harness does not delete; record whether the MVP wrote any spec file: `git ls-files docs` in the sandbox after the MVP, and note it.)
4. **Path C (re-platform)**: stage A1 = block 1 of `migrate.md` (recover the spec, inventory, characterization suite), then the scripted `DECIDE` message; stage A2 = `greenfield.md` + the migration addendum in a **fresh** session, spec "already ratified by id". The target stack, new feature and cleanup list come from the `REPLAT` table inside `run2.js` (three development projects only). The registered inputs are to be written by an independent person; there are none yet.
5. **Lock (all paths)**: formula 8 (`lock.md`) in another fresh session; the reference lock tool is at `/tools/gs-lock/` inside the container.
6. The sandbox volume is copied to `runs/<id>/` (ownership set to root), the volume is deleted, `logs2/<id>/meta.json` is written (model, turns per stage, cost per stage, `git log`, `base`).
7. The **checker** runs in the `fx1-linux` image against `runs/<id>` with `--strict --verbose` (`--migration` for C; `--sync --base <commit>` for B; `--since <commit>` so that the commit-message check starts after the boundary), report in `logs2/<id>/report.json`, text in `checker.out.txt`. The console prints `<id> done cost <usd> {...} checker exit <0|1>`. Exit 0 means all items passed; 1 means at least one did not. That is not a run failure.

### 8.1 Time and cost to expect (development loop 2, Anthropic mid-tier, list price)

Path A about $1.9 and 10 minutes, B about $1.7 and 12 minutes, C about $2.7 and 16 minutes; the checker 1 to 3 minutes. Other vendors: assume 0.5x to 2.5x (FX-1.md section 14).

### 8.2 The scripted human messages (fixed; do not improvise)

`RATIFY`, `DECIDE`, `CONT` and `NEUTRAL`, English and Spanish, are in the harness and are quoted in the prompt pack (entry PP-FX1-HARNESS-ES). The only free text a person may ever type into a run is none: the harness is the human. Do **not** answer an agent's question yourself; the harness answers with the fixed sentence (PP-FX1-REPLY) and logs it. Do not watch a run and nudge it.

## 9. Schedule, randomization, naming and where outputs go

### 9.1 Ids

`<stage>-<path>-<fixture>-<lang>-<vendor>-r<rep>`, for example `s2-A-lendmark-en-oai-r1`. The id must contain `-A-`, `-B-` or `-C-` exactly once (the re-score scripts read the path from it). `<vendor>` is the tag `anth`, `oai` or `goog`. A re-run of a void slot keeps the id and appends `.void1` to the voided folders (section 13).

### 9.2 The seeded random order

FX-1.md section 5 step 4: "order of runs randomised in blocks over cells", seed registered. `schedule.mjs` (NEW) writes the order from a seed; the same arguments give the same file on any PC. One block = one repetition of every cell.

S1 (6 runs per vendor, the composition of development batches 3 and 4):
```powershell
node "$REPO\experiments\fx1\runner\schedule.mjs" --stage s1 --seed <SEED-FROM-JC> --vendors anth,oai,goog --cells A:hive:en,A:kiln:es,A:lamp:en,A:tally:en,B:kiln:en,B:tally:es --reps 1 | Out-File -Encoding ascii "$FX_ROOT\schedule-s1.csv"
```
```sh
node "$REPO/experiments/fx1/runner/schedule.mjs" --stage s1 --seed <SEED-FROM-JC> --vendors anth,oai,goog --cells A:hive:en,A:kiln:es,A:lamp:en,A:tally:en,B:kiln:en,B:tally:es --reps 1 > "$FX_ROOT/schedule-s1.csv"
```
S2, English streams (A-EN and B-EN; 5 fixtures x 3 vendors x 2 paths = 30 runs):
```sh
node "$REPO/experiments/fx1/runner/schedule.mjs" --stage s2 --seed <SEED-FROM-JC> --paths A,B --langs en --vendors anth,oai,goog --fixtures lendmark,stitchcount,tidewatch,cinderfall,shelfwise --reps 1 > "$FX_ROOT/schedule-s2.csv"
```
S3 (held-out, 6 per stream, a **different seed**, different fixture-vendor pairings where possible): JC supplies the exact schedule file; do not generate it yourself.

The seed is a number JC gives you (it is a registered value at S4). Save the seed and the command line in `schedule-<stage>.txt` beside the csv. Do not re-roll a seed because you dislike the order.

### 9.3 Starting the runs

`drive.mjs` (NEW) runs the rows N at a time, skips any run that already has a `meta.json` (so a restart never repeats or overwrites), and stops launching when a file named `STOP` appears in `FX_ROOT`. Start with 1, then 2 after the dry run, at most 4 (FX-1.md section 14 plans 4 in parallel; the development loop ran up to 8, and rate limits then voided a batch).

```powershell
node "$REPO\experiments\fx1\runner\drive.mjs" "$FX_ROOT\schedule-s1.csv" 1 --dry      # prints what it would start; check the model ids
node "$REPO\experiments\fx1\runner\drive.mjs" "$FX_ROOT\schedule-s1.csv" 2            # real
```
```sh
node "$REPO/experiments/fx1/runner/drive.mjs" "$FX_ROOT/schedule-s1.csv" 1 --dry
node "$REPO/experiments/fx1/runner/drive.mjs" "$FX_ROOT/schedule-s1.csv" 2
```
To start one run by hand (S0 dry run, a void re-run):
```powershell
$env:FX_MODEL = $env:FX_MODEL_ANTH; node "$FX_ROOT\harness\run2-portable.js" dry-A-hive-en-anth-r1 A en DEV-API-hivelog
```
```sh
FX_MODEL="$FX_MODEL_ANTH" node "$FX_ROOT/harness/run2-portable.js" dry-A-hive-en-anth-r1 A en DEV-API-hivelog
```
(Today `run2-portable.js` talks to the Claude CLI only, so `drive.mjs` starts it only for vendor tag `anth`. For another vendor it looks for `harness/run2-<vendor>.js` (the adapter, section 7) and, if that file does not exist, refuses the row and logs `NO ADAPTER`. A row whose `FX_MODEL_<VENDOR>` is unset is refused too.)

### 9.4 Where outputs go

| Output | Path |
|---|---|
| raw per-call output (JSON, stderr) | `run/logs2/<id>/turnNN-<label>.raw.txt` |
| run summary (model, turns, cost per stage, git log) | `run/logs2/<id>/meta.json` |
| checker report and text | `run/logs2/<id>/report.json`, `checker.out.txt` |
| console of the harness process | `run/logs2/<id>.console.txt` |
| the project the agent built (a git repository) | `run/runs/<id>/` |
| the agent's own session transcripts | `run/cfg/<id>/projects/**.jsonl` |
| runner queue log | `run/drive.log` |

## 10. Verification: prove the PC is set up correctly (S0)

Do V1 to V8 in order. Write the result of each in `results/S0/verification.md` (pass or fail, the command, the output's first line). All of V1 to V6 must pass for a vendor before that vendor does S1. This takes about 1 to 2 hours and costs about $2 to $6 per vendor.

**V1 Environment record.** One text file with everything that identifies this PC and these tools.
```powershell
New-Item -ItemType Directory -Force "$FX_WORK\results\S0" | Out-Null
$f = "$FX_WORK\results\S0\ENV-RECORD.txt"
"date $(Get-Date -Format o)"; "host $env:COMPUTERNAME $([Environment]::OSVersion.VersionString)" | Out-File $f
"git $(git --version)"; "node $(node --version)" | Out-File $f -Append
docker version --format "docker client {{.Client.Version}} server {{.Server.Version}} {{.Server.Os}}" | Out-File $f -Append
"repo HEAD $(git -C $REPO rev-parse HEAD)"; "formulas HEAD $(git -C $FORMULAS rev-parse HEAD)" | Out-File $f -Append
"gs-check $((Get-FileHash $FORMULAS\tools\gs-check\gs-check.mjs).Hash)" | Out-File $f -Append
docker image inspect --format "{{.RepoTags}} {{.Id}}" fx1-linux fx1-linux-claude | Out-File $f -Append
```
```sh
mkdir -p "$FX_WORK/results/S0"; f="$FX_WORK/results/S0/ENV-RECORD.txt"
{ echo "date $(date -u +%FT%TZ)"; echo "host $(uname -a)"; git --version; node --version
  docker version --format 'docker client {{.Client.Version}} server {{.Server.Version}} {{.Server.Os}}'
  echo "repo HEAD $(git -C "$REPO" rev-parse HEAD)"; echo "formulas HEAD $(git -C "$FORMULAS" rev-parse HEAD)"
  sha256sum "$FORMULAS/tools/gs-check/gs-check.mjs"
  docker image inspect --format '{{.RepoTags}} {{.Id}}' fx1-linux fx1-linux-claude; } > "$f"
```
Pass: file exists, `docker ... Os` says `linux`, the two hashes of section 4.4 match.

**V2 Repository and gates.** `git -C $REPO branch --show-current` prints `experiment-protocol-2026-10-02`; section 4.5 run and its (expected) failing result written down; the confirmatory fixtures are **not** in the working tree if you used sparse checkout (`ls $REPO/experiments/fx1/fixtures` shows only `README.md`).

**V3 The checker controls, on the Linux image.** This proves the checker behaves as specified on projects whose properties are known (it is not a validity result). Known-good controls: `G1` (node), `G3` (python), `GS1` (node wired to the reference lock tool); two negative controls: `R06`, `B05`.
```powershell
docker build -t gs-check-test -f "$FORMULAS\tools\gs-check\test\Dockerfile" "$FORMULAS\tools\gs-check\test"
docker run --rm -v "${FORMULAS}:/w:ro" -w /w -e FX1_ONLY=G1,G3,GS1,R06,B05 gs-check-test node --test tools/gs-check/test/controls.test.mjs
docker run --rm -v "${FORMULAS}:/w:ro" -w /w gs-check-test node --test tools/gs-check/test/unit.test.mjs
```
```sh
docker build -t gs-check-test -f "$FORMULAS/tools/gs-check/test/Dockerfile" "$FORMULAS/tools/gs-check/test"
docker run --rm -v "$FORMULAS:/w:ro" -w /w -e FX1_ONLY=G1,G3,GS1,R06,B05 gs-check-test node --test tools/gs-check/test/controls.test.mjs
docker run --rm -v "$FORMULAS:/w:ro" -w /w gs-check-test node --test tools/gs-check/test/unit.test.mjs
```
Pass: the summary lines show `# fail 0` for both. The full control suite is 53 tests (about 4 minutes in the Linux image per the checker README); run it once on this PC without `FX1_ONLY` and keep the summary. If a control fails here and passes on the main PC, the cause is the environment (Docker, line endings, network): stop and send the output back.

**V4 One call through the vendor adapter.** For Anthropic, with the patched harness' own flags, send the probe (`PP-NEW-PROBE`, section 7.2; its exact text is in the prompt pack, section D, end), then read the raw output. Put the probe text in a file first, so no quoting can alter it:
```powershell
Set-Content -Encoding ascii "$FX_WORK\probe.txt" "<paste the PP-NEW-PROBE text here, exactly, as one line>"
$p = Get-Content -Raw "$FX_WORK\probe.txt"
New-Item -ItemType Directory -Force "$FX_WORK\probe","$FX_ROOT\cfg-probe" | Out-Null
docker run --rm -v "$FX_WORK\probe:/work" -v "$FX_ROOT\cfg-probe:/cfg" -e CLAUDE_CONFIG_DIR=/cfg -e ANTHROPIC_API_KEY -w /work fx1-linux-claude claude -p $p --model $env:FX_MODEL_ANTH --output-format json --permission-mode acceptEdits --tools "Bash,Read,Write,Edit,Glob,Grep" --disable-slash-commands --strict-mcp-config --max-budget-usd 1 > "$FX_WORKesults\S0\probe-anth.raw.txt"
```
```sh
printf '%s' "<paste the PP-NEW-PROBE text here, exactly>" > "$FX_WORK/probe.txt"
mkdir -p "$FX_WORK/probe" "$FX_ROOT/cfg-probe"; chmod 777 "$FX_WORK/probe" "$FX_ROOT/cfg-probe"
docker run --rm -v "$FX_WORK/probe:/work" -v "$FX_ROOT/cfg-probe:/cfg" -e CLAUDE_CONFIG_DIR=/cfg -e ANTHROPIC_API_KEY -w /work fx1-linux-claude claude -p "$(cat "$FX_WORK/probe.txt")" --model "$FX_MODEL_ANTH" --output-format json --permission-mode acceptEdits --tools "Bash,Read,Write,Edit,Glob,Grep" --disable-slash-commands --strict-mcp-config --max-budget-usd 1 > "$FX_WORK/results/S0/probe-anth.raw.txt"
```
Pass: JSON with `is_error: false`; `usage` present; `modelUsage` has one key, the model id asked (`FX_MODEL_ANTH`); the text lists no files and says no memory and no web. For another vendor: the same with its adapter; **a vendor whose raw output has no token usage cannot enter the cost analysis** (section 3.1): write it down.

**V5 Isolation.** In the probe answer: no instruction file, no memory, no extra tool. Also run `docker run --rm -v "$FX_ROOT/cfg-probe:/c" fx1-linux ls -la /c` and confirm that the configuration folder holds nothing but the session folders the call created (no `CLAUDE.md`, no `settings`, no credentials file with an OAuth token). A credentials file means a login was used instead of the key: delete the folder and redo V4.

**V6 A full dry run on a development fixture.** One path A run, English, with the cheapest vendor first:
```powershell
$env:FX_MODEL = $env:FX_MODEL_ANTH
node "$FX_ROOT\harness\run2-portable.js" dry-A-hive-en-anth-r1 A en DEV-API-hivelog
node "$REPO\experiments\fx1\runner\run-record.mjs" "$FX_ROOT\logs2\dry-A-hive-en-anth-r1" | Out-File -Encoding ascii "$FX_ROOT\logs2\dry-A-hive-en-anth-r1\RUN-RECORD.json"
```
```sh
FX_MODEL="$FX_MODEL_ANTH" node "$FX_ROOT/harness/run2-portable.js" dry-A-hive-en-anth-r1 A en DEV-API-hivelog
node "$REPO/experiments/fx1/runner/run-record.mjs" "$FX_ROOT/logs2/dry-A-hive-en-anth-r1" > "$FX_ROOT/logs2/dry-A-hive-en-anth-r1/RUN-RECORD.json"
```
Pass (this proves the setup, not the formula; the number of PASS items is **not** a criterion): the console ends with `done cost ... checker exit 0` or `1`; `logs2/<id>/` holds `turn01-f1.raw.txt`, `turn03-lock.raw.txt` (or similar), `meta.json`, `report.json` with 12 items and **no `UNDETERMINABLE`**; `runs/<id>/` is a git repository with commits; `RUN-RECORD.json` shows `tokensAvailable: true`, one model id, `errors: 0`; the cost is in the range of section 8.1 (above $6 for a path A run: stop and ask JC). Repeat with `B` (`dry-B-kiln-en-anth-r1 B en DEV-CLI-kilnlog`) and once with Spanish (`dry-A-kiln-es-anth-r1 A es DEV-CLI-kilnlog`). Dry-run ids start with `dry-`; their data are discarded for analysis but kept for the audit trail.

**V7 Cross-PC determinism of the checker (if `golden/` is in the bundle).** JC includes one finished development sandbox and its report from the main PC (`golden/<id>/` and `golden/<id>.report.json`). Run the checker on it here and compare the statuses.
```sh
docker run --rm -v "$FX_ROOT/golden:/runs:ro" -v "$FORMULAS/tools:/tools:ro" -v "$FX_WORK/results/S0:/out" fx1-linux node /tools/gs-check/gs-check.mjs --repo /runs/<id> --strict --verbose --out /out/golden-recheck.json
node -e "const a=require('$FX_ROOT/golden/<id>.report.json'),b=require('$FX_WORK/results/S0/golden-recheck.json');const s=r=>r.items.map(i=>i.id+i.status).join(' ');console.log(s(a)===s(b)?'SAME STATUSES':'DIFFERENT\n'+s(a)+'\n'+s(b))"
```
(PowerShell: the same command with `${FX_ROOT}` mounts and `$FX_ROOT\golden\...` paths.) Pass: `SAME STATUSES`. A difference points at the PC (Docker, line endings, the hash of `gs-check.mjs`).

**V8 No secrets in anything you will send.**
```sh
grep -rEn "(sk-[A-Za-z0-9_-]{20,}|AIza[0-9A-Za-z_-]{30,}|ghp_[0-9A-Za-z]{30,}|ANTHROPIC_API_KEY=|OPENAI_API_KEY=|GEMINI_API_KEY=)" "$FX_ROOT/logs2" "$FX_ROOT/cfg" "$FX_WORK/results" 2>/dev/null | head
```
```powershell
Select-String -Path "$FX_ROOT\logs2\*\*","$FX_WORK\results\*\*" -Pattern "sk-[A-Za-z0-9_-]{20,}","AIza[0-9A-Za-z_-]{30,}","ghp_[0-9A-Za-z]{30,}","API_KEY=" -ErrorAction SilentlyContinue | Select-Object -First 10
```
Pass: no output. Any hit: revoke that key now (section 3.2).

When V1 to V8 pass for a vendor, write `S0 PASSED for <vendor> on <date>` in `results/S0/verification.md` and send that file to JC (section 15) before starting S1.

## 11. Budget, caps and stop rules

All spend is "list-price notional on the CLI's own figures" unless the route is API-metered; the vendor console is the check.

| Rule | Value | Source |
|---|---|---|
| Hard cap, whole FX-1 | $3,500 | FX-1.md section 14 (JC's per-experiment default of 2026-10-04) |
| Central estimate FX-1 incl. path C | about $3.6k, range $1.0k to $4.3k; **over the cap before retries** | FX-1.md section 14 (REV3) |
| Reduced design if the cap binds | A-EN, B-EN (and C-EN) at 210 runs each; F0 and CHK in English; **all Spanish streams deferred to FX-1c**; never fewer runs per cell | FX-1.md section 14 stop rule |
| Cost check before the freeze | 90th percentile per-run cost x planned runs must not exceed the cap; computed from the FX-0 diagnostic data | FX-1.md section 14 |
| Interim validity look | after the first 15 percent of S4 runs, by a script that prints **only flags**: cost per run above 1.7 times the FX-0 estimate, infrastructure loss, UNDETERMINABLE rate, canary hits; triggers the reduction **before** any element rate is looked at; after outcome data exist no amendment is allowed | FX-1.md section 14 |
| Infrastructure loss | above 5 percent in any stream before outcome data: stop and amend; a gap above 10 percentage points between vendors: same | FX-1.md section 9.2 |
| UNDETERMINABLE | more than 3 percent of an element's run results adjudicated by a human: that element is `INVALID-DESIGN` | FX-1.md section 9.1 |
| Per-step turn cap and per-run wall-clock cap (S4) | 3 times the 90th percentile of the FX-0 diagnostic runs per path, by script | FX-1.md section 3.4 |
| Caps inside S0 to S3 | the harness limits only: `--max-budget-usd 14` per call, 55 minutes per call, 6 calls per session | `run2.js` |
| S0 and S1 spend ceiling per vendor | **proposed (NEW, JC to confirm): $25 for S0 and $25 for S1** | this runbook; dev loop 2 spent $12 to $19 per batch of 8 runs |
| S2 spend ceiling | **proposed (NEW, JC to confirm): 2.5 times the central estimate: about $400 for the English half**; FX-1.md gives $170 central for the 84 FX-0 runs | this runbook |

**Operational stop rules** (apply in every stage): create `FX_ROOT/STOP` and stop when: (a) the cumulative spend on the vendor console reaches 80 percent of the ceiling; (b) any single run costs more than 3 times the median of its path so far; (c) 2 consecutive voids on one vendor (section 13); (d) an authentication or billing error on any call; (e) the model id served differs from the one asked; (f) you find a secret in a log (V8); (g) JC says stop. After `STOP`, running jobs finish; do not launch more; send `daily-log.md` to JC.

Track spend in `results/<stage>/spend.csv` (columns: date, vendor, runs finished, console spend, harness-reported spend), once at the end of each day.

## 12. Integrity rules and the deviations log

1. **Stateless sessions.** A new container, volume and configuration folder per run; the only continuity is the multi-step conversation of one run (resume by session id inside a run). No run reads another's folder; never reuse a `runs/<id>` path; the harness refuses an existing sandbox.
2. **No access to the repo or the checklist from inside the project.** The agent container mounts `/work` (the sandbox), `/cfg` (its empty configuration) and `/tools/gs-lock` (read-only, the lock tool). It must not see `SUBSTRATE-CHECKLIST`, the checker, the fixtures folder, the formulas folder, other sandboxes or the results folder. Never add a mount to the agent container.
3. **Never push a sandbox.** Do not add a remote to a project in `runs/`, do not run `git push` inside one, do not open one in an editor that auto-syncs. They contain hooks written by a model.
4. **Do not read other cells' outputs.** Do not open `report.json`, `checker.out.txt` or the agent's final texts while a stage runs. The runner reads only what section 13 needs (turn logs, to classify voids). Section 16 lists the daily steps that need no outcome data.
5. **Record versions and dates.** The model id served (from `RUN-RECORD.json`), the date and time of each run (in `meta.json`), the CLI version (`claude --version` inside the image), the image IDs, the formulas commit, the checker hash. Check these against the freeze list at the start of every day.
6. **Hash-verify before every batch (FX-1.md section 5 step 4).** Before launching, recompute the SHA-256 of the formula files, the brief files, the harness file and the checker file, compare with the freeze list (S4) or with the values you recorded at the start of the stage (S0 to S3), and log the match:
```sh
( cd "$FORMULAS" && sha256sum docs/formulas/greenfield.md docs/formulas/adopt.md docs/formulas/lock.md docs/formulas/migrate.md tools/gs-check/gs-check.mjs ) > "$FX_WORK/results/hash-check-$(date -u +%FT%H%M).txt"
sha256sum "$FX_ROOT/harness/run2-portable.js" "$FX_ROOT"/fixtures/*.md >> "$FX_WORK/results/hash-check-$(date -u +%FT%H%M).txt"
```
```powershell
$o = "$FX_WORK\results\hash-check-$(Get-Date -Format yyyy-MM-ddTHHmm).txt"
Get-FileHash "$FORMULAS\docs\formulas\greenfield.md","$FORMULAS\docs\formulas\adopt.md","$FORMULAS\docs\formulas\lock.md","$FORMULAS\docs\formulas\migrate.md","$FORMULAS\tools\gs-check\gs-check.mjs","$FX_ROOT\harness\run2-portable.js" | Out-File $o
Get-FileHash "$FX_ROOT\fixtures\*.md" | Out-File $o -Append
```
A mismatch, or a `git status` that is not clean in `$FORMULAS`, stops the batch (a formula text that changes mid-window makes the stream `INVALID-DESIGN`).
7. **Do not touch the formulas.** At S2 the formula author may revise a formula (at most 3 revisions each, FX-1.md section 3.4) on the main PC; you only receive a new commit from JC. You never edit a formula, a brief, the harness, the checker or a prompt.

### 12.1 `deviations.md`

Create `results/deviations.md` on day 1 with three headings: **Decisions** (data handling, who authorised what), **Standing deviations** (things known to differ from FX-1.md), **Events** (dated, one line each: what, what you did, who you told). Seed "Standing deviations" with these, which are true of the development harness today:
- the container network is unrestricted (FX-1.md 3.3 asks for registries only);
- `DATE` in the brackets is the constant `2026-10-07`;
- model ids were aliases in development (use full ids here);
- the MVP's own spec file is not deleted before `adopt` on path B (FX-1.md item 14 undecided);
- scripted messages are in code, not in a registered file (prompt-pack gap);
- no per-run wall-clock cap beyond 55 minutes per call;
- the Claude CLI version is not pinned in `Dockerfile.claude`;
- vendors other than Anthropic: no adapter (state which, and what you used instead).

## 13. Failure handling: what voids a run and what does not

Classify from the **turn logs and the console only**, before you open the checker report (rule 4). Write each classification in `results/<stage>/failures.csv` (id, date, class, evidence line, action).

| What happened | Class | Action |
|---|---|---|
| a call returned `is_error: true` with an API, authentication, billing or rate-limit message; HTTP 401, 403, 429, 5xx; `PARSE FAIL` with empty stdout; the process killed (host sleep, reboot, Docker crash, disk full); the harness 55-minute timeout caused by a hung connection | **infrastructure, VOID** | archive the original folders (`logs2/<id>` and `runs/<id>` renamed to `.void1`; also `cfg/<id>`), remove the leftover Docker volume (`docker volume rm -f fxvol2-<id>`, otherwise the re-run starts from stale content), **re-run once in the same slot** with the same id; count it in the failure log (FX-1.md 9.2) |
| the API key or the OAuth token was revoked or expired during a run | **VOID**, and all runs in flight on that key | same; stop the stage (rule d), log, new key |
| the vendor outage or a rate limit hit a whole batch (the development loop lost 8 runs to a session rate limit) | **VOID the batch** | wait, lower parallelism by half, re-run each once |
| the sandbox already existed, or was empty because the harness crashed before the first call | VOID (harness) | re-run once |
| the model id served differs from the id asked | VOID for that vendor from that run on | stop the vendor, tell JC |
| the agent ended its turn early, asked to continue, stopped, produced nothing, hit the turn, time or spend cap, or wrote a red test suite and said so | **NOT infrastructure**: scored as is, counts against the formula (intention to treat) | do nothing; it is data |
| the checker report has an item `UNDETERMINABLE` (network, missing tool, timeout) | checker/environment | the checker re-runs once in a fresh sandbox (re-score: `docker run ... gs-check.mjs ... --out report-r2.json`); if still undetermined, send to JC for human adjudication, blind to vendor |
| a systematic checker defect found after data | row (h) | do not fix; report to JC; he bumps the version and all runs are re-scored |

A second void of the same slot is **not** re-run: log it and tell JC. Re-run a voided slot once; never "re-roll" a run that completed because its result is bad.

## 14. NEW files this runbook introduced (review before use)

All were checked with `node --check` and the schedule and run-record scripts against development logs; none has been run against a model on any machine.

| File | What | State |
|---|---|---|
| `experiments/fx1/runner/schedule.mjs` | seeded blocked random order, full factorial or explicit cells | tested: same arguments give the same file |
| `experiments/fx1/runner/drive.mjs` | queue runner: parallel N, resume, `STOP` file, per-vendor model id | tested in `--dry` mode only |
| `experiments/fx1/runner/patch-harness.mjs` | the 7 patches of section 5.2 on a copy of `run2.js` | tested: applies to the current `run2.js`, result passes `node --check` |
| `experiments/fx1/runner/run-record.mjs` | per-run summary: model ids served, tokens, cost, errors | tested on development logs |
| prompt pack `PP-NEW-PROBE`, `PP-NEW-CANARY`, `PP-NEW-F0-WRAP`, `PP-NEW-CHK` | drafts of prompts the registration describes but does not write | not reviewed by JC |
| proposed spend ceilings (section 11) | numbers, not registered | JC to confirm |

## 15. Results: commit, and exactly what to send back

### 15.1 What to keep, per stage

For every run: `logs2/<id>/` entire folder (including `RUN-RECORD.json`), `cfg/<id>/` entire folder (the session transcripts), and the sandbox `runs/<id>/` as a **git bundle** (a file that keeps the history and runs no hooks). For every stage: the schedule csv and its seed note, `drive.log`, `daily-log.md`, `deviations.md`, `failures.csv`, `spend.csv`, the console spend export, `ENV-RECORD.txt`, the hash-check files, and a `STAGE-REPORT.md` of at most one page: runs launched, finished, voided, spend (harness and console), anything odd, and the open questions. **No keys, no `FX_ROOT/cfg-probe` OAuth files, no screenshots showing a key.**

Bundle each sandbox and collect:
```sh
cd "$FX_ROOT" && for d in runs/*/; do id=$(basename "$d"); mkdir -p "$FX_WORK/results/<stage>/runs"; git -C "$d" bundle create "$FX_WORK/results/<stage>/runs/$id.bundle" --all; done
mkdir -p "$FX_WORK/results/<stage>/logs"; cp -r "$FX_ROOT/logs2/." "$FX_WORK/results/<stage>/logs/"
mkdir -p "$FX_WORK/results/<stage>/cfg"; cp -r "$FX_ROOT/cfg/." "$FX_WORK/results/<stage>/cfg/"
```
```powershell
Get-ChildItem "$FX_ROOT\runs" -Directory | ForEach-Object { New-Item -ItemType Directory -Force "$FX_WORK\results\<stage>\runs" | Out-Null; git -C $_.FullName bundle create "$FX_WORK\results\<stage>\runs\$($_.Name).bundle" --all }
Copy-Item "$FX_ROOT\logs2" "$FX_WORK\results\<stage>\logs" -Recurse; Copy-Item "$FX_ROOT\cfg" "$FX_WORK\results\<stage>\cfg" -Recurse
```
(`<stage>` is `S0`, `S1`, `S2`. Run V8 again on `results/` before committing.)

### 15.2 Commit to a results branch, in a repository that is not the public one

Results are raw experimental data. The confirmatory data must not go to a public place before the registration rules allow it (FX-1.md sections 5 and 15, `PREREG-HOWTO.md`). So the results repository is **separate and private**; it is never `origin` of the generative-specification clone.
```sh
cd "$FX_WORK/results" && git init -q -b main 2>/dev/null; git checkout -q -B "results/<stage>-<pc-name>-<YYYYMMDD>"
git add -A && git -c user.name="<you>" -c user.email="<you>@example.invalid" commit -q -m "results(<stage>): <n> runs, <vendors>, <date>; no secrets (V8 passed)"
```
```powershell
cd "$FX_WORK\results"; git init -q 2>$null; git checkout -B "results/<stage>-<pc-name>-<YYYYMMDD>"
git add -A; git commit -q -m "results(<stage>): <n> runs, <vendors>, <date>; no secrets (V8 passed)"
```
Push only to a **private** remote that JC names in writing. If he has not named one, do not push: make a transfer file and send it by the channel JC chooses (encrypted drive, private share):
```sh
git -C "$FX_WORK/results" bundle create "$FX_WORK/fx1-results-<stage>-<pc-name>-<YYYYMMDD>.bundle" --all
sha256sum "$FX_WORK"/fx1-results-*.bundle > "$FX_WORK/fx1-results-<stage>.sha256"
```
```powershell
git -C "$FX_WORK\results" bundle create "$FX_WORK\fx1-results-<stage>-<pc-name>-<YYYYMMDD>.bundle" --all
Get-FileHash "$FX_WORK\fx1-results-*.bundle" | Out-File "$FX_WORK\fx1-results-<stage>.sha256"
```
The bundle's SHA-256 goes in the message to JC. If a bundle exceeds the channel's limit, split the stage (one bundle per vendor).

### 15.3 The exact files to send back for S0 (the first thing JC needs)

1. `results/S0/verification.md` (V1 to V8, pass or fail, one line each)
2. `results/S0/ENV-RECORD.txt`
3. `results/S0/probe-<vendor>.raw.txt` (one per vendor tried)
4. the V3 summary (`# pass` and `# fail` lines of the full control suite, as text)
5. for each dry run: `logs2/<dry id>/RUN-RECORD.json`, `meta.json`, `report.json`, `checker.out.txt`
6. `results/deviations.md` (even if only the seeded list)
7. the output of section 4.5 (the gate check), unedited
8. a note of which vendors have an adapter, which flags you mapped, and which of A1 to A10 each fails

For S1 and S2 add the items of section 15.1.

## 16. Daily checklist

**Before you start (about 10 minutes; no outcome data are read)**
- [ ] New shell window; keys entered (section 3.2); `FX_MODEL_*`, `FX_ROOT`, `FORMULA_DIR`, `TOOLS_DIR` set.
- [ ] `docker ps` shows no leftover containers; free disk above 20 GB; `docker volume ls` shows no stale `fxvol2-*` volumes (remove only volumes of voided runs after archiving).
- [ ] Hash check done and logged (section 12 rule 6); `git -C "$FORMULAS" status --short` is clean and the HEAD is the one in the plan.
- [ ] Confirm the model ids have not changed (the vendor's model list) and the vendor consoles show no incident.
- [ ] Spend so far versus the ceiling (section 11); `STOP` file absent.
- [ ] `daily-log.md`: date, time, what you will launch (ids from the schedule), parallelism.

**While it runs**
- [ ] Look at `drive.log` and the console tail, nothing else. Do not open reports or sandboxes.
- [ ] If a call fails with an authentication, billing or rate-limit message: create `STOP`, classify as in section 13.
- [ ] Do not type into a run. Do not change anything on the machine that could stop Docker (sleep, updates).

**When the day's runs end**
- [ ] `drive.log` ends with `queue empty`; count finished, voided, failed.
- [ ] For each finished run: `run-record.mjs` -> `RUN-RECORD.json`; model id equals the id asked; `errors: 0`.
- [ ] Classify voids from the turn logs (section 13) into `failures.csv`; re-run each void once.
- [ ] Spend: note the console figure and the harness figure in `spend.csv`; if they differ by more than 15 percent, write an event line.
- [ ] Add a line to `deviations.md` for every event.
- [ ] Copy new results into `results/`, V8, commit (section 15). Close the shell window that held the keys.
- [ ] Send JC the one-page `STAGE-REPORT.md` section for the day (what ran, voids, spend, questions). No outcome data.

## Appendix A. The Copilot route (manual; no cost data; FX-0 sample only)

FX-1.md section 4.2 allows the Copilot agent only for critic rounds and for a **sample of the FX-0 diagnostic part**, because a person cannot drive 840 chats. Copilot returns no tokens and no cost, and the editor agent runs on the host (not in the pinned container), so a project built that way carries Windows line endings and non-executable hooks that the Linux checker will flag for reasons the agent could not see. If you use it anyway for the FX-0 sample:
1. One new chat per run; agent mode; no custom instructions or memory (switch them off); pick the model; record the exact id the picker shows.
2. Paste the formula block with brackets filled the way `run2.js` does (the same script text; use the prompt pack for the scripted replies), in an **empty folder outside any repository**.
3. Do not answer questions except with the fixed sentence; do not edit files.
4. When the chat ends, copy the folder into `FX_ROOT/runs/<id>/` and run the checker from the Linux image with `--strict`; mark the run `copilot-manual` in `meta.json` and in `deviations.md` (host build, no spend data).
5. These runs are reported separately and never pooled with API-metered runs.

## Appendix B. For JC, on the main PC: make the bundle

```powershell
cd C:\workspace\PragmaWorks\lab-runs\fx1-dev
# harness, docker files and the development fixtures only: no runs, logs, cfg, void, claude-config, credentials
Compress-Archive -Path harness,docker,fixtures,fixtures-legacy -DestinationPath C:\temp\fx1-bundle-2026-10-09.zip
# optional golden pair for V7 (a finished development sandbox and its report):
#   copy runs\n5-A-hive-en and logs2\n5-A-hive-en\report-h.json (check the right report) into a folder 'golden' and add it to the archive
Get-ChildItem harness,docker,fixtures,fixtures-legacy -Recurse -File | ForEach-Object { "$((Get-FileHash $_.FullName -Algorithm SHA256).Hash.ToLower()) *$($_.FullName.Substring((Get-Location).Path.Length+1).Replace('\','/'))" } | Set-Content MANIFEST.sha256
```
Put `MANIFEST.sha256` into the archive root. Send it, the seed, the model ids and the formulas commit (G-1) through a private channel. **Do not include** `claude-config\` (it holds a login token), `logs`, `logs2`, `runs`, `void`.
