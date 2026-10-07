# E2E-1-REVIEW: first critic round and dispositions (2026-10-07)

Draft reviewed: `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\prereg\E2E-1.md` revision 1 and `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\REVIEW-SURFACE-SPEC.md`. Raw reviews: `...\prereg\E2E-1-review-raw\critic-1.md` (statistics and power, 13 findings) and `...\prereg\E2E-1-review-raw\critic-2.md` (fairness and construct validity, 16 findings).

**Independence statement, plainly.** Both critics were fresh, stateless Claude agents (the same vendor as the authors of the draft). They share the authors' training and blind spots, and neither is a person. **Vendor-diverse review is owed**: at least three vendors, two not Anthropic, and the stop rule of `ROLES.md` has not started to count. No finding below is a statement that the design is right; the round only removed what two critics of one family could see. Nothing was frozen, merged or run.

The first critic recomputed section 9 and found the arithmetic correct (8.7, 12.3 and 17.4 points at SD 12); its findings concern what the arithmetic leaves out.

## Dispositions (A accepted and applied in revision 2; P partly; N not applied; O owed to JC)

| # | Finding | Severity | Disposition |
|---|---|---|---|
| 1-1 | Ceiling trigger (95%) inconsistent with SESOI 8 | BLOCKER | A: trigger is 100 minus SESOI (92 and 90) |
| 1-2 | EQUIVALENT almost unreachable at this n; simple effects cannot be equivalent | BLOCKER | A: stated in section 9; simple effects cannot be labelled EQUIVALENT; rows (c) and (i) reworded |
| 1-3 | Decision table gaps and overlaps, no precedence | BLOCKER | A: precedence rule and one row per pair of co-primary classes; row k folded into (v) |
| 1-4 | No power picture for P-REG | MAJOR | P: binomial noise stated, SD from E2E-0; no number invented |
| 1-5 | Fewer independent units than 72 runs (two projects) | MAJOR | A: inference conditional on these projects; three projects the minimum for more |
| 1-6 | Pilot too small; controls not counted in n or cost | MAJOR | A: pilot 12 runs, controls counted, about 95 runs |
| 1-7 | "Sign agrees in three vendors" is noise-driven (25% under null) | MAJOR | A: estimates plus heterogeneity estimate |
| 1-8 | Interaction on a bounded share depends on scale | MAJOR | A: both scales reported |
| 1-9 | Cluster-robust invalid with two clusters | MAJOR | A: stratified permutation |
| 1-10 | Multiplicity incoherent; cost rows lack alpha, rate | MAJOR | A: secondary wording, 95% intervals, rate at freeze |
| 1-11 | SD borrowed; z vs t; sensitivity | MINOR | A: sensitivity stated; SD from E2E-0 |
| 1-12 | Per-vendor contrast is 12 vs 12 | MINOR | A |
| 1-13 | Power at SESOI is about 0.7 and 0.4, not 0.8; "5 points" understated | MINOR | A: restated (about 6 points or less is inconclusive) |
| 2-1 | Auto-loaded substrate text is a second prompt | BLOCKER | A: factor renamed "GS bundle"; optional flat-file arm named; rows g to i reworded |
| 2-2 | Arm X: persistence allowed but leak check required | MAJOR | A: A6 with M1 descriptive; independence secures "no GS"; INVALID trigger replaced |
| 2-3 | Practitioner independence unenforceable | MAJOR | A: what each party sees declared; GS side's knowledge of P4 trap classes declared; O: names |
| 2-4 | Trap authoring circular for P-REG | MAJOR | A: trap classes by rule visibility; skeptic's traps frozen first; veto log to reviewer |
| 2-5 | Setup and upkeep cost uneven | MAJOR | A: every human intervention logged; three horizons, no verdict on horizon |
| 2-6 | Gate blocks and retries confound the factor | MAJOR | A: scored state fixed; blocks as mediators |
| 2-7 | Blinding nominal; disagreement set chosen after seeing results | MAJOR | A: non-GS checker does primary pass; set drawn by an assistant; guess test |
| 2-8 | Judges see the substrate | MINOR | A: paths stripped, residual traces stated |
| 2-9 | Pilot and trap hardening tuned on study arms | MINOR | A: hardening uses arm N only, logged |
| 2-10 | Equal tooling unenforceable across vendor CLIs | MINOR | A: neutral harness default; registered ports otherwise |
| 2-11 | Phase 1 repository state differs by arm | MINOR | A: declared |
| 2-12 | Prior inconsistent with complete-spec limit | MINOR | A: prior restated |
| 2-13 | Recall measurement circular (tool spec) | MAJOR | A: held-out natural escapes are the headline; independent instance authors |
| 2-14 | Location recall can match for the wrong reason | MINOR | A: MUST-only headline, S7 and S11 off |
| 2-15 | Rules not all deterministic as written | MINOR | A: per-rule input and stack list, `not covered` printed |
| 2-16 | Escape-conditioned view depends on the study's nets | MINOR | A: per-arm, nets stated |

## Still open

Names for the practitioner, independent reviewer, skeptic and second checker; vendor and harness decisions; SD and n from E2E-0; budget; arm X definition (default A6 form) and the optional fifth arm. A vendor-diverse round (the pattern of `COPILOT-CRITIC-RUNBOOK.md`, a new runbook for E2E-1 not yet written) must follow before any freeze; its findings may change the structure. This round does not count toward the stop rule.
