# CR study — final result (weak rung measured; H1 verdict)

_2026-09-19. Weak rung `qwen2.5-coder:7b` (k=3, naive+gs) generated on the main PC (RTX 5070 Ti,
12 GB VRAM) and measured on the **static** suite; combined with the Copilot-arm hosted rungs
(`RESULTS-copilot-arm-mid-frontier.md`). 32B dropped (VRAM). Conformance skipped on the weak rung
(system-RAM constrained; and it was 0/0 there anyway — the 7B apps do not serve). See
`DEVIATION-weak-rung.md`._

## The ladder (Δ oriented as GS-benefit; + = GS better)

Weak → strong: `qwen2.5-coder:7b → gpt-mid → {gpt / gemini / claude}-frontier`. Median over k.

| Metric | qwen7b (weak) | gpt-mid | frontier (gpt / gemini / claude) | H1 (Δ declines weak→strong)? |
|---|---|---|---|---|
| **duplication %** (lower better) | **+14.5** | 0 | −1.2 / −3.5 / 0 | **YES — strong monotone decline** |
| **cyclomatic cc_mean** (lower better) | **+0.63** | +0.15 | +0.15 / +0.07 / +0.16 | YES — mild decline then flat |
| test files (higher better) | −1 | 0 | +3 / +2 / +2 | NO — *increases* weak→strong |
| layer violations | 0 | 0 | 0 | no signal (flat) |
| behavioral oracle /6 | 0/0 (both fail) | −1 | −1 / −1 / 0 | no weak signal; GS ≤ naive |

qwen7b raw per cell (k=3): naive dup=25/17/19, cc=2.3/2.1/1.9, test=1/1/1, ts-files=6/5/5;
gs dup=0/9/(empty), cc=1.7/1.3/(empty), test=0/4/0, ts-files=5/32/0.

## Verdict on H1 (capacity-relative law)

**Partially supported, and only on the structural-cleanliness axis.**

- **Supported (duplication, complexity):** GS's advantage is largest where the model is weakest
  and recedes to ~zero at the frontier — the pre-registered capacity-relative shape. On
  duplication it is strong (+14.5 at the weak rung → 0/negative at mid+frontier). Interpretation:
  the cascade constrains a weak model toward clean, low-duplication, low-complexity structure that
  a frontier model already produces unaided.
- **Not supported (behavior, tests):** the behavioral oracle gives no weak-rung signal (both
  conditions fail to serve, 0/6) and GS ≤ naive at every hosted rung; the test-file count moves
  *opposite* to H1 (a 7B cannot reliably author tests; the frontier GS arm does). Layer violations
  never fire.
- **Consistent with the master line:** the frontier absorbs the mechanical delta. GS's *measurable*
  benefit here is structural, capacity-relative, and receding — not "better code" at the frontier.

**Contribution #4, honestly scoped:** the capacity-relative claim holds as *"specification
scaffolding reduces structural bloat (duplication, complexity) most on weak models, receding to
zero at the frontier"* — NOT as a universal quality law. Report it that bounded, or as a
mechanism demonstration, not a powered effect.

## Caveats (load-bearing — do not drop when citing)
1. **n = 3, and GS is high-variance at the weak rung.** One GS cell emitted a 32-file structured
   app, one ~5 files, one an empty/failed project. The advantage is real when the cascade "takes"
   but unreliable on a 7B. Medians reported, not means; IQRs are wide.
2. **Behavioral axis is null at the weak rung** — the 7B apps do not migrate/serve, so conformance
   is 0/0 for both conditions. The H1 evidence is entirely *static structure*, not runtime quality.
3. **Single benchmark (Pastura), single weak model.** 32B rung dropped (12 GB VRAM < ~20 GB).
   Conformance skipped on the weak rung for system-RAM reasons.
4. **Harness note:** an earlier weak-rung run was invalidated by a background-task race (a stopped
   run's inter-cell `taskkill node` killed live generations); re-run clean, single-run, after
   freeing memory. This result is the clean re-run.

## What would make it clean (future work)
Re-run on a machine with ≥32 GB RAM + ≥24 GB VRAM: qwen7b **and** 32B, k≥5, with conformance on
the weak rung, plus a second invented benchmark. Then a real Jonckheere-Terpstra / Page trend test
on the duplication and complexity deltas (which is where the signal lives) rather than the
direction+magnitude read reported here under §7's small-k rule.
