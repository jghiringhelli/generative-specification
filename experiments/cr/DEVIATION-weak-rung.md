# CR deviation — only the 32B rung was dropped; qwen7b was run as pre-registered

_Recorded 2026-09-19. The pre-registration (`PREREGISTRATION.md`) and `ladder.json` name two
weak local rungs: **qwen2.5-coder:7b** (rung 0) and **qwen2.5-coder:32b** (rung 1)._

## What was run vs. dropped
- **Rung 0 `qwen2.5-coder:7b` — run as pre-registered.** The main PC has an RTX 5070 Ti Laptop
  GPU (12 GB VRAM); qwen7b (~4.7 GB + context) runs entirely on the GPU, so the system-RAM
  pressure (15 GB total) is not a factor for generation. naive+gs, k=3, per the design.
- **Rung 1 `qwen2.5-coder:32b` — DROPPED.** 32B (~20 GB) exceeds the 12 GB VRAM and cannot run on
  this machine. This is explicitly permitted by `ladder.json` note_min_rungs: with 32B dropped,
  the rungs `qwen7b → gpt-mid → {frontier}` still span weak-local → mid → strong, and the ≥3-rung
  minimum holds.

## Effect on the analysis
- The a-priori ladder order is unchanged (§8, no post-hoc re-ordering): `qwen2.5-coder:7b →
  gpt-mid → gpt-frontier / gemini-frontier / claude-frontier`.
- The monotone-trend test (PREREGISTRATION §7, Jonckheere-Terpstra / Page) runs over this ordered
  ladder. Dropping the 32B removes one interior point but does not change the direction being
  tested (weak → strong).

## Note
An earlier attempt substituted `llama3.2:3b` for qwen7b out of over-caution about the 15 GB
system RAM, before confirming the model runs on the 12 GB GPU. That was stopped and discarded
before measurement; qwen7b is the model of record for rung 0. To also fill rung 1, re-run
`qwen2.5-coder:32b` on a machine with ≥24 GB VRAM.
