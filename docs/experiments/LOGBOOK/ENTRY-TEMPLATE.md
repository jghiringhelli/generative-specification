# ENTRY-TEMPLATE: copy to `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\LOGBOOK\<ID>.md`

Rules: append, never rewrite. Corrections are dated and signed notes under "Corrections". Every outcome (positive, null, refuted, inconclusive, invalid) uses these same headings and the same register. Protocol: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\EXPERIMENT-PROTOCOL.md`.

---

# <ID>: <short title>

| Field | Value |
|---|---|
| ID | |
| Status | PROPOSED / DESIGN-REVIEWED / PILOTED / REGISTERED / RUNNING / ANALYSED / CLOSED / ABANDONED / SUPERSEDED-BY <id> |
| Outcome | SUPPORTED / REFUTED / NULL / INCONCLUSIVE / INVALID-DESIGN / DEMONSTRATION (one per question if several; see "Questions") |
| Evidence tier | A / B / C / D (protocol section 1) |
| Refines / refined by | `<id>` / `<id>` |
| Registration | tag, commit, pushed date, external timestamp (OSF/Zenodo DOI or URL), or "none" with how the design text relates to the data in history |
| Data and code | absolute paths or DOI |
| Opened / closed | dates |

## 1. Hypothesis and falsifier
Directional claim, metric, numeric region that counts against it. Versions of the hypothesis (with dates and reasons for change) if revised.

## 2. Intuition behind it
The field experience or belief, in a form a result could contradict.

## 3. Construct-validity check
Construct, number that stands for it, treatment-targeted? (yes/no per metric), memorization risk and canary result, who or what scores and its independence from the generator.

## 4. Design
Arms, units, n and why, models and versions, benchmark and provenance, harness, oracle, judge protocol, stopping rule.

## 5. Controls and guard checklist
| Guard | Pass / fail / not applicable | Evidence |
|---|---|---|
| (a) positive control detected; negative control quiet; no floor/ceiling | | |
| (b) primary metric not targeted by the treatment | | |
| (c) non-memorized benchmark, canary logged | | |
| (d) independent stateless judge, other vendor | | |
| (e) falsifier stated before data | | |
| (f) intuition-vs-result audits done (if the result contradicted experience) | | |
| (g) stopping rule fixed, followed | | |
| (h) power note and limits stated | | |
| (i) reported in the standard form | | |

## 6. Decision table (registered)
Observed -> permitted conclusion -> forbidden conclusion.

## 7. Design review and pilot
Critics, findings, accepted / rejected with reason. Pilot results and any allowed changes.

## 8. Deviations log
Date, what happened, rule it falls under or "no rule", possible effect on the verdict.

## 9. Result
Outcome label, decision-table row, effect sizes with intervals, controls' result, raw data location. Questions answered separately if there are several.

## 10. Intuition-vs-result audit (only if the result contradicted field experience)
Validity audit finding. Falsifiability audit of the intuition. Joint verdict.

## 11. What this licenses
The claim that may be made, its scope, and what must not be claimed. What other documents may cite.

## 12. Refinement
Linked new entries (`refines: <this id>`), with the reason.

## Corrections
Dated, signed, appended notes only.
