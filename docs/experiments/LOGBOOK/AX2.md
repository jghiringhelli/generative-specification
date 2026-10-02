# AX2: cross-vendor structural replication (GPT, Gemini, Claude; September 2026)

> Backfilled entry, written 2026-10-02 from the repository files. It does not alter the papers or the result files. Protocol: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\EXPERIMENT-PROTOCOL.md`.

| Field | Value |
|---|---|
| Status | CLOSED (backfilled) |
| Outcome | Naive vs disciplined structural effect: SUPPORTED as mechanism (partly treatment-targeted). GS vs expert prompt: INVALID-DESIGN (saturated). Behavioural oracle and coverage: INVALID-DESIGN. Weak-local tier (RQ3): ABANDONED |
| Evidence tier | C |
| Registration | Author-attested. `experiments\ax2\PROTOCOL.md` committed 2026-09-14 13:33; measurement harness 17:43 the same day. The protocol asked for n of 12 to 15 per cell and for mutation score and branch coverage as headline metrics; the run used n = 5 and the headline became the layer-violation count. Disclosed in prose in RESULTS.md; no deviations file. No external timestamp. |
| Data and code | `C:\workspace\PragmaWorks\gs\generative-specification\experiments\ax2\` (PROTOCOL.md, RESULTS.md); runner and data in `...\experiments\ax\runner\` (static_ax2.json, results_ax2.csv) |

## What was asked
RQ1 quality vs naive and expert prompting on objective metrics; RQ2 cross-vendor consistency; RQ3 widening of the gap as capability falls (weak local models).

## What the design could and could not detect
- 45 backends (3 vendors x 3 conditions x 5), all built inside the Copilot agent harness, so the unit is "vendor plus Copilot".
- Layer violations: naive 18 to 35 mean per project, expert and GS 0. Both disciplined prompts state the layering rule, so the count is a compliance check (treatment-targeted).
- Duplication and complexity fell in both disciplined arms; expert equals or beats GS in some cells (Gemini duplication 2.6 vs 6.3). The arms are saturated: the experiment could not separate expert prompting from GS.
- The strict behavioural oracle encoded REST conventions and scored 0 of 13 for functional apps: it measured convention, not function. Coverage ranged 1% to 95% across repetitions because of test-infrastructure failures. Both defects are reported as such in RESULTS.md.
- The weak-local tier was memory-limited and incomplete.
- Harness faults found and fixed (Docker off, IPv6 localhost, token expiry units) are listed in RESULTS.md.

## Questions
| Question | Result |
|---|---|
| Disciplined (expert or GS) vs naive, cross-vendor, structural metrics | SUPPORTED as mechanism evidence on 3 vendors (n = 5 per cell; layering metric treatment-targeted) |
| GS vs expert prompt | INVALID-DESIGN: saturation; cannot tell equal from undetectable |
| Behavioural conformance, coverage | INVALID-DESIGN |
| Gap widening as capability falls (RQ3) | ABANDONED |

## What it licenses
"A disciplined prompt or specification removes layer violations and reduces duplication relative to a naive prompt on three vendors in one agent harness." Not "GS beats expert prompting"; not behavioural quality.

## Open
Locked scaffold plus convention-tolerant hidden oracle: carried into SDX-1 and BACKLOG B3.
