# Second PC: what to do, in order (one page)

You need: Git, Node 22 or newer, Docker Desktop in Linux-container mode, the GitHub Copilot CLI (`npm install -g @github/copilot`, or winget/brew) logged in with `copilot login`, and access to `pragma-works` on GitHub. No API keys. Run everything from the repository root of your clone (the folder with `experiments/` and `docs/`). Nothing below needs a path to be typed except the work folder, which defaults to `~/fx1`.

**1. Pull and set up (once).**
```
git fetch --all --tags
git checkout experiment-protocol-2026-10-02
git pull --ff-only
node experiments/other-pc/setup.mjs
```
It prints `REPO=` and `WORK=`, checks the tools, creates the formulas work tree and the clone of the private results repository (`pragma-works/genspec-experiment-results`), builds the images, and writes `env.ps1` and `env.sh` into `WORK`. If it says FAIL on a line, fix that line and run it again; it is safe to repeat.

**2. New shell window: load the paths, set the token in this window only.**
PowerShell:
```
. "$HOME/fx1/env.ps1"
$s = Read-Host "COPILOT_GITHUB_TOKEN" -AsSecureString; $env:COPILOT_GITHUB_TOKEN = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($s)); Remove-Variable s
```
POSIX shell:
```
. ~/fx1/env.sh
read -rs -p "COPILOT_GITHUB_TOKEN: " COPILOT_GITHUB_TOKEN; echo; export COPILOT_GITHUB_TOKEN
```
The token is a **fine-grained personal access token** with the permission "Copilot Requests" and nothing else (GitHub, Settings, Developer settings). Never write it in a file. Then set the caps that match your plan: `$env:FX_CAP_PREMIUM = '200'` (legacy request plans; counts one per prompt unless you fill the multipliers in a copy of `models.json`) or `$env:FX_CAP_CREDITS = '3000'` (token-billed plans: **enforceable only if the CLI's token counts are captured**; the harness stops with "UNENFORCEABLE" if it cannot compute credits, and then `FX_CAP_CALLS` and the billing page are your controls). `FX_CAP_CALLS` (600) and `FX_CAP_HOURS` (30) are already set; the prompt never raises a cap.

**3. Start Copilot in the same window and paste the prompt.**
```
copilot
```
Pick a cheap model for this operator session (it only runs commands; it is not an experiment subject). Paste everything inside the fence of section 3 of `docs/experiments/MASTER-PROMPT-COPILOT-PC.md`. Also fine: VS Code agent mode opened on the repository folder (the harness needs the same environment variables, so start VS Code from the same window with `code .`).

**4. Answer at the gates, then read the usage page.**
The agent stops after verification (Gate 0), after the critic rounds (Gate 1), the practitioner prompts (Gate 2) and the development batch (Gate 3). Reply `GO phase N` to continue or `STOP`. Before replying to Gate 0, answer its question about your plan's terms and training opt-out. At the end open GitHub, Settings, Billing and licensing, Metered usage, Copilot; write the totals into the report where it says "FOR JC TO FILL"; the agent has already pushed the results to the private repository (one branch per phase).

**What can go wrong.** `429` or "session limit" messages: the harness marks the run a void, re-runs it once, stops after two in a row; wait and run the same phase again. A model that does not answer: it is skipped and listed. No tokens captured: the report says so; cost numbers are then not available from this route. The registered FX-1 run is **not** possible yet (no frozen tags); the prompt checks and stops.

More: `experiments/fx1/harness/README.md` (the tool), `docs/experiments/MASTER-PROMPT-COPILOT-PC.md` (what each phase does and which experiments this route cannot finish), `docs/experiments/research/COPILOT-ROUTE-2026-10-09.md` (what the documentation says about scripted use, limits and terms).
