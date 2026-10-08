# REM-1-REVIEW: first critic round and dispositions (2026-10-08)

Draft reviewed: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\prereg\REM-1.md` revision 1. Revised file: revision 2. Raw reviews, unedited: `...\prereg\REM-1-review-raw\critic-1.md` (statistics and measurement, 20 findings: 3 BLOCKER, 10 MAJOR, 7 MINOR) and `...\prereg\REM-1-review-raw\critic-2.md` (construct validity and fairness, 20 findings: 2 BLOCKER, 13 MAJOR, 5 MINOR). Cited as C1-Fnn and C2-Fnn.

Method: two fresh stateless `claude -p` runs (model opus, no tools, no session persistence, no slash commands, no settings sources, run from a neutral directory) that saw only the fixed critic prompt, a lens line and the draft file inline. They did not see the protocol, E2E-1, the simulation script or any other file, so they could not check consistency with the sibling designs.

**Independence statement, plainly.** Both critics are the same vendor family as the author of the draft; they share its training and blind spots, and neither is a person. **Vendor-diverse review is owed**: at least three vendors, two not Anthropic (the Copilot-PC pattern is adequate for critics since they need no token counts), and the stop rule of `ROLES.md` has not started to count; the structural changes below reset it in any case. The assistant that wrote the draft also wrote these dispositions; per `ROLES.md` a BLOCKER is not closed on the author's word alone, so JC should read the BLOCKER rows. No finding below is a statement that the design is right.

Both critics found defects the author had not found, among them one that falsifies a claim in the draft: **the simulated interval coverage of 0.68 to 0.94 is not repaired by widening 95% to 97.5%** (C1-F3, C2-F18), and the class probabilities in section 9 are therefore optimistic until the simulation is rerun with the registered procedure.

## Dispositions (A accepted and applied in revision 2; P partly; O owed to JC or to later work; N not applied)

| # | Finding (short) | Severity | Disposition |
|---|---|---|---|
| C1-F1 | Decision table rows not exclusive or reachable ((vii), (viii) unreachable; (ii) and (iii) overlap) | BLOCKER | A: rewritten as Axis 0 (invalid) and three independent axes (payback, B against C, modifiers) |
| C1-F2 | "Saving not above zero" turned into a strong negative claim | BLOCKER | A: NOT WITHIN 200 now requires the upper bound of D_B(200) below zero; other cases INCONCLUSIVE |
| C1-F3, C2-F18 | Bootstrap coverage 0.68 to 0.94 not repaired by 97.5%; replicates nested; codebases not resampled | BLOCKER | A: two-stage cluster bootstrap registered; precondition 14.9 requires rerunning `simulate.py` with it and coverage at least 0.93, or 4 replicates; section 9 states the optimism. Simulation not yet rerun (owed) |
| C1-F4 | Ratio estimand unstable | MAJOR | A: primary is the net cumulative difference D(k) at 60 and 200; k* by Fieller, descriptive |
| C1-F5, C2-F8 | Pooling rules contradict; token categories cannot be summed | MAJOR | A: pooled means of R and savings in dollars at pinned prices; rows on dollars only; tokens per category and vendor, descriptive |
| C1-F6, C2-F2 | Early-stopping C analysed as if it spent B's budget; matching cannot test "cheaper" prior | BLOCKER (C2), MAJOR (C1) | A: C-natural primary (ceiling, measured R_C), C-matched secondary, D_BC uses realized R_C, matching in dollars |
| C1-F7 | m mixes spend and acceptance; unaccepted items censored; upkeep undefined; cap turns overhead into non-acceptance | MAJOR | A: m = spend per attempted item over acceptance, both reported; fallback cost for unaccepted items; upkeep = classifier categories (b) and (c); cap-hit trigger |
| C1-F8, C2-F1 | Remediation screened by the oracle; bug-fix steelman contradicts "no behaviour change"; pre-solved bug items | BLOCKER (C2), MAJOR (C1) | A: intention to treat; bug-targeted behaviours excluded from the characterization suite; pre-solved rule; overlap computed |
| C1-F9, C2-F6 | Growth sensitivity one-sided; remediation substrate never stale | MAJOR | A: symmetric g_A, g_B, g_C estimated from the chain probe; threat 3 rewritten |
| C1-F10 | REM-0 too small to estimate variance components; go/no-go selects on its own effect | MAJOR | A: 2 codebases, 2 replicates; go/no-go on variance estimates only |
| C1-F11 | B-versus-C contrast not simulated; no scenario with B worse | MAJOR | O: stated in sections 9 and 14.9 as owed; the decision table is declared not powered until done |
| C1-F12, C2-F3 | Stop rule of B unbracketed; checker validity threshold absent | MAJOR | A: brackets `[AT FREEZE]`; `gs-check` agreement threshold in FX-1 as precondition 14.5; stop reason reported |
| C1-F13, C2-F5 | Headroom rule selects items on A's outcome; ceiling invalidates a legitimate "native navigation" world | MAJOR | A: per-codebase calibration items, random reserve pool, ceiling makes acceptance rows unevaluable, not the cost outcome |
| C1-F14, C2-F19 | Classifier agreement n=40, voids primary | MINOR (C1), MINOR (C2) | A: 150 turns, kappa, voids only the decomposition |
| C1-F15 | Human-time proxy driven by the treatment | MINOR | A: sensitivity only, hashed replies, production lines apart, calibrated by a timed sample |
| C1-F16, C2-F11 | Strata rule uses "rows" as an ordinal scale | MINOR | A: interval-overlap and sign rule |
| C1-F17, C2-F9 | Contradictory metered-vendor fallback; harness heterogeneity; home-vendor advantage | MAJOR | A: no Anthropic-only fallback; one API harness; study not frozen without two metered vendors, one not Anthropic; developer vendor of the formulas logged |
| C1-F18 | Two co-primary metrics, multiplicity | MINOR | A: rows on dollars only; everything else descriptive |
| C1-F19 | Second attempt leaks oracle information | MINOR | A: first-attempt co-primary; trap failures return only "a regression was detected" |
| C1-F20, C2-F16 | Positive control without numbers or owner; trap raters unnamed | MINOR | A: 8 discoverable items per codebase, 20-point margin, "premise failed" label; two raters, kappa |
| C2-F4 | Cheap-fix steelman crippled (no hooks, ratchets) and unprepared | MAJOR | A: C may use anything non-GS; preparation parity and a pilot codebase |
| C2-F7 | Wrapper confound; B' optional | MAJOR | A: B' mandatory on four codebases, C' on two; wrapper modifier; row wording changed |
| C2-F10 | Item authors not independent; veto held by interested party; assistant vendor | MAJOR | A: independence definition applied to all authors; skeptic decides vetoes; assistance from non-experiment vendor |
| C2-F12 | No result commits to an offer change; offer consequences in a private file | MAJOR | A: section 13 rewritten with committed consequences, hashed at freeze |
| C2-F13 | Synthetic generator vendor and regrowth loop | MAJOR | A: generator outside the experiment vendors or reported apart; three seeds |
| C2-F14, C2-F15 | Maturity reference set underspecified; canary has no control | MINOR | A: seeded reference set; two attesters; fabricated control for the canary |
| C2-F17 | Blinding claimed where impossible; JC reads pairs | MINOR | A: declared unblinded; skeptic reads stripped diffs; JC does not |
| C2-F20 | Better allocations for the same money | MAJOR | P: listed in section 9 and offered to JC as a choice; no change to the plan until he answers (the simulation supports more codebases over more items) |

## What the round did not examine

The critics were not shown the protocol, the sibling designs, the formulas or the simulation, so consistency with E2E-1, FX-1 and `EXPERIMENT-PROTOCOL.md` was not checked. They did not verify the hidden-test authoring cost, whether the formulas can actually be run by an agent at 10 to 25 kLOC, or whether the token metering of each vendor's harness is as assumed. The next round should be vendor-diverse and should receive the protocol and the simulation.

**Stop-rule counter: 0 consecutive clean rounds** (two BLOCKER-class findings, several structural changes). Nothing was frozen, merged or run.
