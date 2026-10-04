# §VI.H-I — Cross-vendor comparison (AX2) and capacity ladder (CR) (v0.3)

### H. Cross-vendor structural comparison, AX2 (controlled comparison, exploratory; an internal, conceptual replication of AX's structural contrast)

**Question.** Is the structural separation a single-model artifact? **Design.** 45 Conduit backends: three vendors, three conditions (naive, expert prompt, mature GS), five independent runs each. The model identifiers recorded in the run metadata are `gpt-5.6-sol`, `gemini-3.8-flash` and `claude-opus-4.8`, each run as a fresh sub-agent inside one agent harness (GitHub Copilot CLI), so the comparison is across vendors within one harness. **Metrics.** Only convention-independent static metrics are comparable across heterogeneous projects, so only they are reported: layer-boundary violations, duplication (jscpd), cyclomatic complexity (eslint) and test files.

| Vendor | Layer violations, naive median (runs) | Disciplined (expert and GS) | Duplication %, naive mean to disciplined means | Test files, naive mean to disciplined means |
|---|---|---|---|---|
| GPT | 30 (0, 0, 30, 32, 32) | 0 in all 10 runs | 5.2 to 1.6 and 0.8 | 1.4 to 11.4 and 6.8 |
| Gemini | 35 (34, 35, 35, 35, 38) | 0 in all 10 runs | 17.1 to 2.6 and 6.3 | 4.2 to 11.8 and 11.0 |
| Claude | 33 (31, 33, 33, 33, 35) | 0 in all 10 runs | 7.9 to 1.0 and 0.4 | 1.0 to 9.0 and 12.8 |

Layer violations are absent in all 30 disciplined runs, duplication falls roughly two to four fold and test files multiply. The expert and GS conditions are saturated against each other and on some cells the expert prompt is better (Gemini duplication 2.6% against 6.3%). The separation is therefore **naive-to-disciplined** and not GS-over-expert, consistent with Section VI.B. **Limits.** Five runs per cell where the protocol targeted twelve to fifteen; one benchmark; vendor and harness are confounded; the GS condition supplied the cascade as prompting and did not run an enforced verification loop. Runtime metrics (coverage, mutation score, a strict behavioural oracle) produced no comparable numbers: the oracle measured REST-convention conformance (0 of 13 on functional apps) and coverage was dominated by each project's test-infrastructure failures. Those sub-metrics are withdrawn and not reported. Obtaining comparable runtime metrics needs a controlled substrate (a locked scaffold and a convention-tolerant oracle), which is the next experiment.

### I. Capacity ladder on a non-memorized benchmark, CR (controlled comparison, exploratory)

**Question.** Does the structural benefit depend on model capacity, on a benchmark the models cannot have memorized? **Design.** An invented domain, "Pastura" (a rangeland grazing-rotation API with temporal business rules, no public implementation), a ladder from a small local model (qwen2.5-coder 7B) through a mid model to three frontier models, naive and GS conditions, k = 3 per cell, medians reported. The design and prediction were committed on 17 September 2026 (commit `c4c855e`) before any CR run.

**TABLE IV. GS benefit (naive minus GS for lower-better metrics) by rung.**

| Metric | Weak (7B) | Mid | Frontier (GPT, Gemini, Claude) |
|---|---|---|---|
| Duplication, percentage points | +14.5 | 0 | -1.2, -3.5, 0 |
| Mean cyclomatic complexity | +0.63 | +0.15 | +0.15, +0.07, +0.16 |
| Behavioural oracle (of 6) | both arms fail | -1 | -1, -1, 0 |
| Layer violations | 0 | 0 | 0, 0, 0 |

The pre-registered gradient held for duplication and complexity and for no other metric: layer violations never fired on this benchmark (unlike Conduit), the oracle gave no weak-rung signal because neither arm's apps served, GS scored equal to or below naive at every hosted rung, and test files moved against the prediction. **Limits.** k = 3; the GS arm at the weak rung was highly dispersed (one 32-file app, one 5-file app, one empty project); one benchmark; one weak model (a 32B rung was dropped for lack of VRAM); and the contamination canary that the design calls for has no results file in the repository, so non-memorization rests on the invented domain and unpublished specification and not on a measured recall.

**Reading the three capacity studies together.** TX (one system), CR (a non-memorized benchmark, structure only) and AX2 (cross-vendor, saturated between expert and GS) are consistent with a structural benefit that is capacity-relative and recedes as models strengthen. Each has the limits above and none is a powered estimate.
