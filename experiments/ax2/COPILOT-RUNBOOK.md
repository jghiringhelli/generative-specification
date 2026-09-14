# AX2 — Copilot runbook (the cross-vendor / OpenAI cell)

> **You are the Copilot agent on JC's second PC.** Your one job: generate the
> **GPT / OpenAI cell** of the AX2 study — the cross-vendor arm this machine can
> produce because it has GitHub Copilot with OpenAI models. You only **generate**
> code. You do **not** measure it: all scoring happens back on the main PC with a
> single toolchain, so metrics stay comparable across every model. When you finish,
> commit and push; JC pulls on the main PC and runs the measurement instrument.

---

## 0. Why paths here are repo-root-relative (not absolute)
JC's usual rule is *absolute paths always*. That rule exists so a target agent on
**the main PC** never mis-resolves a relative path. **You are on a different PC**, so
its absolute repo path is unknown to whoever wrote this. Therefore, first resolve it
yourself and pin it, then treat every path below as relative to it:

1. Find the repo root (the folder containing `experiments/ax2/`) after you `git pull`.
2. Set and **print** it, e.g. `REPO=<the absolute path on THIS PC>`.
3. Confirm these resolve and print them absolute before doing anything else:
   - `$REPO/experiments/ax2/prompts/C1-naive/`
   - `$REPO/experiments/ax2/prompts/C2-expert/`
   - `$REPO/experiments/ax2/prompts/C3-gs/`
   - `$REPO/experiments/ax2/runs/` (create if missing)

Do not proceed until all four print correct absolute paths.

---

## 1. Pick and record the model (this is the whole point of this PC)
- In the Copilot model picker, select the **newest GPT-family (OpenAI) model** your
  Copilot offers (e.g. a GPT-4.1 / GPT-5-class model). This is the **cross-vendor**
  data point (Anthropic is covered on the main PC).
- **Record the exact model id string** the picker shows — it goes in every `meta.json`.
- If your Copilot also offers a **Gemini** model, doing a second pass with it is a
  bonus third vendor (optional; same procedure, different output folder). Do the
  GPT pass first and completely before considering Gemini.

---

## 2. The conditions (frozen — do not edit the prompts)
Three prompting regimes, each a folder of numbered prompt files to feed **in order**:

| Condition | Folder | What it is |
|---|---|---|
| **C1-naive** | `experiments/ax2/prompts/C1-naive/` | bare prompting, the floor |
| **C2-expert** | `experiments/ax2/prompts/C2-expert/` | an expert prompter's control |
| **C3-gs** | `experiments/ax2/prompts/C3-gs/` | mature Generative Specification (infra + spec + gates) |

All three build the **same** target: a RealWorld / Conduit backend (TypeScript +
Express + Prisma/PostgreSQL). Behaviour is later checked against a shared Hurl oracle
on the main PC — you do not run it.

---

## 3. The procedure
Target power: **k = 5 reps per condition** (minimum 3 if time is short; more is better).
So up to 15 independent builds for the GPT pass. Each rep is **independent**: a
**fresh Copilot chat / cleared context** — no memory of any prior rep or condition.

For each `CONDITION` in {C1-naive, C2-expert, C3-gs}, for each `REP` in 0..k-1:

1. **Fresh context.** New chat. The model must carry nothing from earlier reps.
2. **Working directory** (create it):
   `experiments/ax2/runs/gpt-openai/<CONDITION>/rep<REP>/project/`
   (For a Gemini bonus pass, use `runs/gemini/...` instead of `runs/gpt-openai/...`.)
3. **Feed the condition's prompts in order**, exactly as written, as your task —
   `01-*.md`, then `02-*.md`, and so on to the end of that condition's folder. Treat
   each file's contents as the user instruction for that step. Do not add guidance,
   do not fix the spec, do not consult the other conditions' folders.
4. **Build into the `project/` dir above.** Write real source files (this is agent
   mode — write files directly; you need not paste code as chat markdown). The result
   should be a runnable project tree with a `package.json` at its root.
5. **Do NOT** run `npm install`, tests, the Hurl oracle, or any metric. Generation only.
6. **Write `experiments/ax2/runs/gpt-openai/<CONDITION>/rep<REP>/meta.json`:**
   ```json
   {
     "model": "<exact model id from the picker>",
     "vendor": "openai-via-copilot",
     "harness": "github-copilot-agent-vscode",
     "condition": "<CONDITION>",
     "rep": <REP>,
     "prompts_dir": "experiments/ax2/prompts/<CONDITION>",
     "timestamp": "<ISO 8601>",
     "notes": "<anything odd: refusals, truncation, edits you had to make, tool limits>"
   }
   ```

---

## 4. Honesty note to carry (a real threat, recorded, not hidden)
This cell tests **GPT *inside Copilot's agent harness***, not GPT raw. Copilot injects
its own system prompt, tools, and file-editing loop. That is a legitimate real-world
vendor stack (arguably more ecologically valid than a bare API call), but it is **not**
a clean model-only swap versus the main PC's `claude -p` runs. That is exactly why the
`harness` field exists in `meta.json` and why this stays a **named limitation** in the
write-up. Do not try to neutralize it — just record what you did faithfully.

---

## 5. Finish: commit and push
```
git add experiments/ax2/runs/gpt-openai            # + runs/gemini if you did the bonus
git commit -m "ax2(gpt): OpenAI cross-vendor cell — <model id>, C1/C2/C3 x k reps"
git push
```
Then tell JC it is pushed. On the main PC he pulls and runs the AX measurement
instrument (`experiments/ax/runner/` — materialize -> measure -> audit -> aggregate)
over these `project/` trees, identically to the Claude and Ollama cells, then the
Protocol-B stats.

## What you must NOT do
- Do not edit anything under `experiments/ax2/prompts/` (the conditions are frozen).
- Do not run measurement, install deps, or start servers (single-instrument rule).
- Do not carry context between reps or between conditions.
- Do not "improve" a condition's prompts to make its output better — that destroys
  the comparison. C1 is meant to be bare; let it be bare.
