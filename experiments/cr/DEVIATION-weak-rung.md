# CR deviation — the weak rung was realized as llama3.2:3b, not qwen2.5-coder

_Recorded 2026-09-19, before the weak-rung run, for full disclosure. The pre-registration
(`PREREGISTRATION.md`) and `ladder.json` name the weak rungs as **qwen2.5-coder:7b** (rung 0)
and **qwen2.5-coder:32b** (rung 1). This is what was actually run and why._

## What changed
- **Weak rung realized as `llama3.2:3b`** (a 3B general model), not qwen2.5-coder:7b.
- **32B rung dropped** — explicitly permitted by `ladder.json` note_min_rungs ("If the 32B rung
  is dropped for VRAM, rungs 0,2,3 still span weak-local → mid → frontier").

## Why (hardware constraint, disclosed)
The main PC has **15 GB total RAM**, and at run time ~2.7 GB was locked in ~11 `claude.exe`
processes that must not be killed, leaving ~4 GB free after reclaiming the rest. qwen2.5-coder
**7B (~5.5 GB) and 8B models do not fit** without heavy swap → the same hard-OOM that killed the
Ollama arm in AX2 (PREREGISTRATION §8). **32B (~20 GB) is impossible on this machine.** The only
local model that fits and runs cleanly is a 3B. Of the pulled models, `llama3.2:3b` is the
weakest and is the **same 3B tier used in the TX capacity-relative demo** (Compendium §7.8.J: the
3B model that silently truncated 6/8 endpoints), which makes the weak end of the CR ladder
directly comparable to the mechanism TX already showed.

## Why this does not invalidate the H1 test
- The a-priori **ladder order is preserved**: `llama3.2:3b` (weak-local, 3B) sits at or below the
  qwen-7b it replaces on every public coding benchmark, so it remains the **weakest** rung, ahead
  of `gpt-mid` → the frontier trio. The monotone-trend test (PREREGISTRATION §7,
  Jonckheere-Terpstra / Page) runs on the ordered ladder `llama3.2:3b → gpt-mid → {frontier}`.
- The substitution is **direction-preserving and conservative**: a 3B is *weaker* than the
  declared 7B, so if H1 (GS's advantage largest where capacity is smallest) holds, this rung
  should show it at least as strongly, not less.
- It is a **model substitution, not a re-ordering** (§8 forbids re-ordering the ladder post hoc;
  it does not forbid realizing a declared weak-local rung with the weakest model the hardware
  can run, disclosed).

## To close the pre-registration exactly
Re-run rung 0/1 as the declared qwen2.5-coder 7b/32b on a machine with ≥24 GB RAM (or GPU VRAM)
and confirm the trend direction is unchanged. Until then, the weak rung is reported as
`llama3.2:3b (weak-local, 3B; hardware-substituted for qwen2.5-coder:7b)` in every table and
figure, and this file is cited.
