# CR — cross-vendor generation prompt (Copilot PC)

> Run this on the second PC with the Copilot arm to generate the **mid** and **frontier** rungs
> of the ladder. The **local** rungs (Qwen 7B/32B) are generated separately via Ollama on the
> GPU machine (`ollama_generate_cr.cjs` / `measure_cr.sh`). Measurement (static + oracle) runs
> afterward via `measure_cr.sh` — this step only PRODUCES the project trees.

## Non-negotiable rules (these make the experiment valid)
1. **The generating model MUST NOT see `experiments/cr/benchmark/oracle/`.** That folder is the
   grader. Teaching to the test destroys the conformance metric. Never open it, never paste it.
2. **Fresh, independent session per generation.** New chat per (model × condition × rep). No
   carryover between conditions or reps — each is a stateless generation.
3. **Same information, different structure** is the whole experiment. Do NOT give the naive
   condition the GS cascade, and do NOT give the GS condition the raw naive brief. Use exactly
   the inputs listed per condition below, verbatim.
4. **Do not hand-fix the output.** Whatever the model emits is the artifact. If it fails, that
   is data, not a bug to patch.

## Ladder rungs to generate here (from `../ladder.json`)
- `gpt-mid` (a hosted mid model via Copilot)
- `claude-frontier` (Claude Sonnet/Opus via Copilot or CLI)
- Optional extra frontier points: a GPT flagship and/or Gemini flagship (adds strength to the
  strong end; keep the a-priori order by published coding-benchmark rank).

For each rung, generate **both conditions**, **k = 3** reps each (k = 5 if time allows).

## The prompt to paste (per generation)

### NAIVE condition
Open a fresh session with the target model and give it, verbatim:
- `C:\workspace\PragmaWorks\gs\generative-specification\experiments\cr\benchmark\DOMAIN_SPEC.md`
- `C:\workspace\PragmaWorks\gs\generative-specification\experiments\cr\benchmark\naive\README.md`
Then issue the 6 prompts, in order, from:
- `C:\workspace\PragmaWorks\gs\generative-specification\experiments\cr\benchmark\prompts\naive-prompts.md`
Instruction to the model:
> "Build the Pastura API described here as a complete, runnable TypeScript + Node + PostgreSQL
> project. Emit every file in full with its path. I will run it against a local Postgres."

### GS condition
Open a fresh session with the SAME target model and give it the cascade (NOT the raw
DOMAIN_SPEC — the cascade carries the spec):
- The whole folder `C:\workspace\PragmaWorks\gs\generative-specification\experiments\cr\benchmark\gs\`
  (`CLAUDE.md` first — it is the sentinel — then `contracts.md`, `use-cases.md`, `nfrs.md`,
  `test-architecture.md`)
Then issue the prompts, in order, from:
- `C:\workspace\PragmaWorks\gs\generative-specification\experiments\cr\benchmark\prompts\gs-prompts.md`
Instruction to the model:
> "Read CLAUDE.md (the sentinel) first and follow the cascade it routes to. Build the Pastura
> API to this specification as a complete, runnable TypeScript + Node + PostgreSQL project,
> honoring the layered architecture and the dependency rule. Emit every file in full with its path."

## Where to stage each result (exact convention `measure_cr.sh` reads)
```
C:\workspace\PragmaWorks\gs\generative-specification\experiments\cr\runner\runs\<slug>__<cond>\<rep>\project\
```
- `<slug>` = the rung's slug from `ladder.json` (`gpt-mid`, `claude-frontier`, ...).
- `<cond>` = `naive` or `gs`.
- `<rep>` = `1`, `2`, `3`, ...
- `project\` = the materialized source tree (package.json at its root; the app runnable from here).

Example: `...\runner\runs\claude-frontier__gs\2\project\`

## Before generating: the canary (once per model)
Run the cold recall check in `.\canary_probe.md` on each model first and log the result to
`.\runs\canary_results.json` — this confirms none of them has memorized the invented Pastura
domain (contamination control, PREREGISTRATION §2). Near-zero recall is the pass.

## After all cells are staged
Back on either machine:
```
cd C:\workspace\PragmaWorks\gs\generative-specification\experiments\cr\runner
bash measure_cr.sh          # runs static_cr.cjs + conformance_cr.cjs over every runs/ cell
```
Then compute Δ(m) = naive − gs per metric across the ladder and the monotone-trend test
(PREREGISTRATION §7). Push `runs/*.json` summaries (NOT the `runs/` trees — they are gitignored)
or copy them back here for the stats + the Δ-vs-capability plot.
