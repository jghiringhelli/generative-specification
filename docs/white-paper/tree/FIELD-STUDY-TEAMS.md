# Field study with real teams: what is feasible and what is not (2026-10-03)

Status: **PROPOSAL.** Nothing here is registered, agreed with anyone, approved by an ethics committee or run. Written 2026-10-03 on branch `paper-tree-2026-10-03` for JC. Companion to `C:\workspace\PragmaWorks\gs\gs-paper-tree\docs\white-paper\tree\TREE.md` (leaf TRF-1, decision D13), `TESTING-WITHOUT-DECEPTION.md` (section 3, the transferability test) and `P6-skeleton.md` (staged completeness).

**Publication guard.** This branch lives in the public genspec repository. The file therefore names no company and no person: "Partner A" is a software firm whose CEO is a business partner of the author; "Partner B" is an insurance brokerage that was an earlier workshop client. The mapping to real names stays in JC's private notes. The private source material (workshop recordings, the retired human-subject study, employer context) is not cited with detail; the private lessons note (`C:\workspace\PragmaWorks\soma\docs\experiments\lessons-from-past-designs.md`) is used for rules only. Before any merge to the main branch, JC should re-read this file for anything he wants removed.

Inputs read: `C:\workspace\PragmaWorks\soma\docs\private\personal-repos\personal-repos-project-census-2026-10-03.md`, `...\personal-repos-productivity-analysis-2026-10-03.md`, `...\productivity-studies-dissection-2026-10-03.md` (sections 1.2 and 3.5, METR's lessons), `...\experiments\lessons-from-past-designs.md`, and the tree documents above.

---

## 1. Verdict

| Question | Answer |
|---|---|
| Can the two partner teams be used? | **Yes, as a prospective, registered, non-randomized pilot.** Their projects have real deadlines, repositories, histories and a willingness to talk. Nothing else available to the programme has that. |
| Can it be a controlled, powered test of "the method works"? | **No.** Two organizations give at most a handful of projects (my guess: 4 to 8 clusters; not a power calculation). Intervals will be too wide to exclude large effects or to separate the method from its originator. |
| Can it be randomized? | **Partly.** Randomizing the order in which projects adopt (stepped wedge) is possible if the teams accept a lottery constrained by deadlines. Randomizing individual developers inside a project is not (contamination in one working tree). If order cannot be randomized, it becomes a matched comparison, labelled non-randomized. |
| Is it independent? | **No.** Partner A is the author's business partner; Partner B was a workshop client (prior exposure, already applying part of the discipline). Both have commercial reasons to like a positive result. Independence has to be rebuilt by procedure (sections 5 and 8), and the result is labelled "orbit sample". |
| What tier can it earn? | Registration tier is separate from strength. If the protocol and the frozen scripts are registered externally before enrollment (OSF or Zenodo), it can be tier A by registration, and still be a small, non-independent pilot. Report n, the orbit label and the tier together, never the tier alone. |
| What does a good outcome look like? | A transferable-or-not signal on the registered, untargeted measures across several real projects, with compliance and deadline-pressure effects shown, and a clear statement of what it cannot say. A failed transfer is a full result. |
| Can results be stored without exposing client code? | **Yes**: local execution, aggregate metrics, hashed identifiers, a data-sharing agreement, no code leaving the premises (section 6). |

Recommendation: go only if the go/no-go checklist (section 10) passes in full, in particular the independent analyst, the external registration, and the no-veto clause. Treat it as TRF-1's pilot; keep its claims at the pilot's size.

## 2. Design

**Unit of analysis:** the project (a repository with a team and a date), not the developer. Developers are random effects; individual-level data never leave the company.

**Design choice, in order of preference.**

1. **Stepped wedge (preferred).** Every participating project adopts the "pure GS" kit, at a different time. All projects start in a measurement-only baseline period (at least 6 weeks, scripts running, nothing changed) so that observation effects begin before treatment. The adoption order is drawn by lottery within strata of deadline slack, steps at least 4 weeks apart, at least 3 steps (so at least 3 projects). Each project is its own control before adoption; calendar time and model changes are absorbed by period effects. Constraint: no project adopts within 3 weeks before a hard deadline and none is forced to adopt late if it asks to stop.
2. **Matched non-randomized comparison.** If a lottery is refused: pairs of projects matched before enrollment on registered covariates (language, team size, repository age and size, assistant and model, seniority mix, deadline date, prior exposure to the discipline), one adopts and one does not, with the control receiving equal attention (a monthly retrospective without GS content). Selection by team choice is declared.
3. **Within-project interrupted time series** as a sensitivity analysis in both designs.

Every project, treated or control, also does the same minimal specification hygiene (a written list of acceptance criteria with ids per milestone, section 4), so that "writing criteria" is not part of the treatment. This is itself a threat (criteria writing may help), declared.

**What is claimed at most:** "in these projects, after adoption, the registered untargeted measures moved (or did not) relative to their own baseline and to the not-yet-adopted projects, at this adoption fidelity, under these deadlines". Not: that GS raises productivity, nor that it works for anyone.

**Why not randomize at the individual level or reuse the METR design:** METR's own lessons (dissection note section 3.5) apply: do not force a no-AI arm; the contrast is AI plus generic practice versus AI plus the kit; forecast and covariate by difficulty; measure time by timestamps, not self-report; independent blind raters; a run-in period (here the first 2 weeks after adoption are excluded from the primary window and reported separately as upfront cost); no merge-status outcome (merge is a noisy acceptance signal: Peralta et al. and Cynthia et al.).

## 3. What "pure GS" means when no Companion tool exists

Operational definition, written down so that fidelity can be measured: **the L1 to L5 substrate of `C:\workspace\PragmaWorks\gs\gs-experiment-protocol\docs\experiments\prereg\SDX-1-ARMS.md` section 1, delivered as repository files and hooks, with no live coaching beyond a scripted onboarding.** Concretely, a versioned, hash-pinned kit:

| Component | What the team receives |
|---|---|
| L1 sentinel | root navigation file and subtree pointers, generated from the repository by a script, owned by the team afterwards |
| L2 spec cascade | feature specs with numbered acceptance criteria (the milestone criteria of section 4), derived downward to tasks |
| L3 decision records | ADR and EDR templates, required for decisions that change behaviour or architecture |
| L4 enforced gates | pre-commit and CI hooks: build, tests, lint, criteria-coverage check, no commit that breaks a previous milestone check; failure halts |
| L5 coherence lock | co-change check between spec and code |
| Session prompts | a session-start prompt and the expert practice prompts (a fixed text, not tuned per team) |
| Audit prompt | the stateless read-only audit prompt, run at milestone boundaries; it is a **feedback** instrument, not a measurement (section 5) |
| Ratification points | named human review points on evidence, not impressions |

Excluded from "pure": JC's own judgement and coaching (the minutes of expert contact are logged as the dose of non-kit help), tailored rules, any tool the kit does not contain. The kit is built once from the manifest, validated on a dry-run repository (a harness-validity check in the spirit of SDX-0) and frozen with a tag before enrollment. A kit that works only with its author present is the savant alternative of `TESTING-WITHOUT-DECEPTION.md` and is what this study is able to expose.

## 4. What is measured

**Frozen metrics** (definitions fixed before enrollment, run by the same scripts for every project):

- from the personal-repos census and productivity analysis: test lines per production line; share of production-touching commits that also touch a test; CI pass rate; 30-day churn; fix-after-feature (14 days); clean-clone executability; time to first green CI; commits per active day (reported, not a verdict);
- added because the census lacked them: measured line and branch coverage with a tool no gate uses; a sampled mutation score on a pre-declared module sample; independently counted defects (below); model and assistant logged per commit;
- the scripts of the census were written by a subagent and not validated beyond one developer's repositories: they need a validity pass (known-answer repositories, the same style as SDX-0's V checks) before they are frozen.

**Staged completeness** (the P6 definition, adapted): before each milestone starts, the team and an independent rater write its exit criteria in a fixed template: (a) a list of acceptance criteria with ids; (b) for each, the executed check that would show it (the team's own tests or a manual script); (c) the CI gates that must be green on a clean clone; (d) the open-questions list that must be empty or accepted. The template is hashed and stored before the milestone begins. A frozen script, run by the team, reports at each checkpoint: criteria with a passing executed check over total, gates status, open questions. **Spot check:** the independent rater, on premises under NDA, runs the system against a random 10 criteria per milestone, blind to arm where possible. "Complete" is the script's and the rater's verdict, never the team's or ours.

**Escaped defects:** defects traced to a release within 30 days after a milestone was declared complete, from the team's tracker (a tracker discipline is a requirement of enrollment for all projects), classified by two independent raters on redacted records (severity, whether it falls under a listed criterion or outside it).

**Compliance (dose and fidelity):** kit installed and valid; gate firings and overrides (including bypass attempts such as hook skipping, detected by a server-side check where possible); share of commits that are atomic and descriptive by rule; co-change rate of spec and code; ADR emission for qualifying decisions; ratification events; audit runs; expert-contact minutes; explicit **process-off events** with a reason code (deadline, tool failure, disagreement). Adoption fidelity enables a dose-response analysis: an effect that scales with fidelity and not with prior skill supports the method; one that appears only where the originator coaches, or only in the strongest developers, supports the savant or amplifier readings.

**Context and covariates:** forecast effort per task before assignment (a covariate, as METR's lesson 2 says), repository size and age, language, team size and seniority mix (aggregate), assistant and model version, deadline date and **deadline slack** (below), prior exposure to the discipline (Partner B: yes, a stratum of its own), calendar period.

**Outcomes that carry a verdict** must be untargeted: not the audit's findings, not a rubric score (targeted, reported only), not criteria coverage by the team's own tests alone. Verdict candidates: escaped defects per milestone, the spot-check pass rate, rework and 30-day churn, executability from a clean clone, review minutes per accepted change (timed by the team's own tooling), and scope-adjusted completion at the deadline (criteria complete at the date over criteria planned, since a late-negotiated scope would otherwise hide a miss).

## 5. The conflict: our audit as both treatment and measurement

The offer to the teams ("assemble something that uses pure GS and in passing audits the repo") fuses two roles that must be kept apart.

| Role | What it is | Who runs it | Visible to the team during the study | May carry a verdict |
|---|---|---|---|---|
| **Feedback audit** (treatment) | the audit prompt as a kit component, giving findings at milestone boundaries | the team, with the kit | yes | no (targeted) |
| **Measurement** | the frozen scripts of section 4 | the team's data steward runs them on a schedule (CI job); outputs go to the company's outbox | no, until the study window closes (baseline values may be shown at the end) | yes, only the untargeted ones |
| **Independent rating** | defects classification, milestone spot checks, maintainability sampling | raters recruited outside the author's orbit (no students, no commercial partners), under NDA with the company | no | yes |
| **Analysis** | the registered mixed-effects and stepped-wedge analysis | an independent analyst (a statistician on neither company's payroll nor ours), plan hashed before enrollment | n/a | yes |

Rules: (1) the audit prompt is not an outcome (the protocol measured up to 6 points between two runs of one prompt, AX-K5); (2) a metric the kit's gates optimize is "targeted" and cannot carry a verdict; (3) we do not run, edit or see the measurement scripts' output during the study; (4) we do not rate; (5) the frozen scripts and the plan are tagged and externally timestamped before enrollment, and any later change is a logged deviation.

## 6. Data, storage and confidentiality: no code leaves the premises

Flow: scripts run **inside the company** (a CI job or a local container, read-only on the repository) and write one JSON per project per week, schema fixed in the data-sharing agreement. The company reviews the outbox, then sends the files to the analyst. We never receive code, paths, messages, names or free text.

| Item | Rule |
|---|---|
| Identifiers | repository, developer and branch identifiers replaced at source by keyed hashes; the key is held by the company only; different keys per company so that pooled data cannot be re-linked across firms |
| Content | numbers, counts, ratios and category labels only; no free text, no file paths, no snippets; defect records reach the raters only inside the company, under NDA, redacted |
| Granularity | project-week aggregates; no per-developer series leave the company; cells with fewer than 5 developers or 20 commits are suppressed or merged |
| Agreement | a data-sharing agreement signed before enrollment: scope, schema, retention, deletion, breach handling, jurisdiction (counsel to check the local data-protection rules: pseudonymized data may still be personal data) |
| Storage of results | company keeps raw; the aggregate files go to a restricted record (OSF or Zenodo restricted) readable by the analyst and the partners; **before analysis, the SHA-256 of each company's final aggregate file is deposited with a timestamp** (commit to the data, so later claims about it can be checked without disclosure); public release only of cohort-level aggregates after the company's sign-off |
| Public artefacts | the scripts, the schema, the definitions, the registration, the analysis code and the report; never client names without written consent |
| Embargo | allowed for identifying details, never past the first submission (protocol) |
| Reproducibility without disclosure | the analyst can re-run the analysis from the aggregates; the scripts can be re-run by an auditor on the company's premises on request |

## 7. Consent, ethics and the lessons of the earlier human-subject study

**Company consent:** a written agreement before enrollment covering the data flow, publication, withdrawal and the clauses in section 8 (no veto, redaction only of identifying details).

**Developer consent:** informed and individual, opt-in, with the right to opt out of metrics at any time without consequence; a written commitment that no individual-level data reach management and that nothing from the study enters performance reviews. Opt-outs are counted and reported (differential dropout is an invalid-design trigger). Productivity metrics of people are sensitive: only aggregates are produced and the minimum cell size is enforced.

**Ethics review:** if any of this becomes thesis data, the UOC ethics review applies and must be obtained before enrollment, not after; the companies' own approvals are separate. Counsel should read the agreement for the participants' jurisdictions. The author's own employer: confirm, in writing, that nothing in the study touches employer time, tools, material or clients (the personal-time wall and the identity-commit issue in the census are the reason).

**Lessons from the retired study, applied** (the earlier design's generic mistakes, private note, rules only):

| Earlier mistake | Field-study counterpart |
|---|---|
| intervention given was not the intervention the hypothesis named (tooling ahead of understanding) | pilot the kit with 1 or 2 volunteer developers before enrollment and check fidelity; the kit is the substrate, not onboarding or a tool |
| two different projects in one design | the stepped wedge compares a project with itself; the matched variant matches on type; no mixing of project types inside a contrast |
| condition labels changed after the fact | arms, labels, order and the lottery recorded before enrollment |
| uncapped attendance | cap and confirm the number of projects and developers before the baseline starts |
| a single evaluator | two independent raters, kappa, an adjudicator |
| the treatment's own rubric as the outcome | untargeted outcomes carry the verdict; the rubric and criteria coverage are targeted |
| participants inside the author's orbit | not avoidable here; label "orbit sample", add independent raters and analyst, and report the label in the title or abstract of anything that uses it |
| registration promised but not shown | registration is the gate to enrollment (checklist item) |
| no positive control, no invalid-design triggers | a positive control (a known-effect probe: e.g. restating an earlier decision in a ticket must reduce a planted inconsistency) and written triggers: kit not installed as specified, differential dropout, a floor or ceiling on an outcome, scripts failing to run, unilateral process abandonment before the first checkpoint |

Also from the checklist of that note: write down, with a number, what result would make the hypothesis be dropped (below), and the two audits to run if the result contradicts experience (a validity audit of the study and a falsifiability audit of the intuition).

**What would make the prior wrong here:** no movement of the registered untargeted measures after adoption relative to baseline and to the not-yet-adopted projects (interval including zero and excluding a registered minimal effect), or movement only in projects where expert contact was highest, or only in the strongest developers, or movement of targeted metrics with no movement of escaped defects (obedience, not quality), or process-off events in most projects before the first milestone (the kit does not survive deadlines).

## 8. Threats and how each is handled

| Threat | Handling |
|---|---|
| **Deadline pressure** (teams drop the process when a date is at risk) | a pre-declared deadline-slack index (remaining planned criteria over remaining time, from the team's own plan) recorded weekly and used as a stratifier and an interaction; analysis is intention-to-treat first and per-protocol second; process-off events and reason codes are outcomes, not failures; a minimal "floor" of three items kept under pressure (gates run, atomic commits, sentinel updated), with the floor's compliance measured; no coercion: a team that drops the process under pressure is reported as a result about durability of adoption; the 3-week pre-deadline exclusion for adoption starts |
| **Selection** (the willing teams, the enthusiastic developers) | projects enrolled before the arms are disclosed to the developers; refusals and opt-outs logged; stratify on prior exposure; the claim is scoped to volunteers |
| **Hawthorne and demand effects** | a measurement-only baseline of at least 6 weeks before any change; equal-attention control contacts; measurement outputs not shown during the study |
| **Partner's commercial interest** | the partner is the author's business partner and so not independent. Handling: external registration before enrollment; an independent analyst and independent raters; the partner's staff do not score or analyze outcomes; a signed clause that **the partner has no veto on reporting** (they may request redaction of identifying details, never a change of findings), a conflict-of-interest statement in every output, and the claims ledger rule that marketing may use only claims at their tier and label; a failed transfer is reported in the same voice |
| **Prior exposure (Partner B)** | already trained and partly adopting: not naive; a separate stratum; its observations on continuation and decay are valuable but are not a clean baseline |
| **Contamination** | project-level adoption, not developer-level; shared libraries and shared developers across projects declared; developers on two projects counted in the later-adopting one at adoption |
| **Model and tool drift** | model and assistant version logged per commit; period effects in the stepped wedge; vendor changes recorded |
| **Measurement validity** | scripts validated on known-answer repositories; merge status not an outcome; executability depends on environment (clean-clone container) |
| **Small n and multiplicity** | descriptive estimates with intervals, a small registered set of primary outcomes, no pooled claim across projects without a registered rule |
| **Treatment-aligned metrics** | section 5 |
| **Spec-criteria hygiene as a hidden treatment** | required in every arm and period, declared |
| **Originator effect** | coaching minutes logged; the kit must run without the author; dose-response by fidelity |

## 9. Minimal effort for the teams

- One named **data steward** per company, about 1 hour a week during the baseline and the first month, then about 15 minutes a week to look at the outbox before sending.
- Onboarding to the kit: about half a day for the project (a scripted session), plus a one-time 2 hour setup of the CI job and the container.
- Criteria and exit-criteria templates: about 30 minutes per milestone, with the independent rater.
- Developers: no new tool beyond the hooks; an opt-in form; an optional 10 minute questionnaire at weeks 2 and 6 (friction, trust).
- What the teams get: the kit, a baseline report on their own projects at the end (the audit the offer promised), and the cohort-level result. They are not promised speed.

## 10. Go/no-go checklist

No-go if any of items 1 to 8 is false.

1. [ ] External registration of protocol, outcomes, scripts and analysis plan (tag plus OSF or Zenodo) before enrollment.
2. [ ] An independent analyst named, with no stake in either company or in the author's work.
3. [ ] Two independent raters named, recruited outside the author's orbit, with NDAs.
4. [ ] Data-sharing agreement signed: local execution, aggregates only, hashed identifiers, deletion, no code leaving the premises.
5. [ ] A signed no-veto clause and a conflict-of-interest statement.
6. [ ] Company consent and individual developer consent procedures in place; opt-out without consequence; no use in performance reviews.
7. [ ] Ethics review obtained (UOC if thesis data) and the author's employer conflict check done in writing.
8. [ ] The kit built from the manifest, hash-pinned, validated in a dry run, and the scripts validated on known-answer repositories.
9. [ ] At least 3 projects (for a stepped wedge) with known deadlines, a team size and a tracker; or a matched pair design agreed.
10. [ ] The baseline period and the 3-week pre-deadline exclusion fit each project's calendar.
11. [ ] A data steward and a weekly outbox routine named in each company.
12. [ ] Positive control, invalid-design triggers and the "what would drop the hypothesis" statement written and filed before enrollment.
13. [ ] The primary outcomes are untargeted and one per question.
14. [ ] A pilot of the kit with one or two volunteer developers checked for fidelity.

Gates outside this file: the ROOT submitted first; the UOC commission's answer on how a registered-report or field-pilot output is scored; budget for the raters and the analyst (not estimated here).

## 11. Open decisions for JC

1. Go or no-go to approach the two partners (this is D13 in `TREE.md`).
2. Who is the independent analyst and who are the two raters.
3. Stepped wedge or matched pairs; whether the lottery will be accepted.
4. Whether the field data are meant to be thesis data (which triggers the ethics review and the registration timing) or a separate pilot.
5. Whether the partner's no-veto clause is acceptable to the partner.
6. Whether Partner B's prior exposure makes it a continuation study only.

---

## Annex (PRIVATE DRAFT, remove before any merge to main): one-page pitch, neutral Spanish

**Estudio de campo: probar una práctica de desarrollo con IA en proyectos reales**
*Para [Socio A] y [Socio B]. Propuesta, sin compromiso.*

**Qué es.** Un piloto de entre 3 y 4 meses para ver si un conjunto de prácticas de especificación y verificación (un kit de archivos y controles automáticos que se instala en el repositorio) mejora resultados medibles en proyectos con fechas reales. Es una propuesta de investigación: no sabemos si funciona en equipos distintos del nuestro, y justamente por eso queremos medirlo con ustedes.

**Qué ponemos nosotros.** El kit, instalado con una sesión guiada; un informe de línea base de sus propios proyectos al final (la auditoría); el resultado agregado del estudio. No les prometemos mayor velocidad.

**Qué les pedimos.** Entre 3 y 6 proyectos con fecha conocida; una persona de su lado que revise cada semana, unos 15 minutos, lo que sale del equipo antes de enviarlo; media jornada de arranque por proyecto; la participación voluntaria de los desarrolladores.

**Qué garantizamos.**
- Ningún código sale de sus instalaciones. Las mediciones se ejecutan dentro de su infraestructura y solo salen números agregados, con identificadores cifrados cuya clave guardan ustedes.
- Cada desarrollador participa por decisión propia, puede retirarse sin consecuencias, y nada de esto entra en evaluaciones de desempeño.
- Un acuerdo escrito de uso de datos, antes de empezar.
- Las mediciones las ejecutan scripts congelados y las analiza una persona independiente, no nosotros. Evaluadores externos revisan una muestra de defectos y de criterios de aceptación.
- Registramos el plan en un registro público antes de empezar, de modo que no podamos cambiar lo que se mide después de ver los datos.

**Sobre los intereses.** [Socio A] es socio comercial del autor y [Socio B] fue cliente de un taller: ambos tenemos interés en que funcione. Por eso hay analista independiente, plan registrado y una cláusula por la cual nadie tiene derecho de veto sobre lo que se publique (pueden pedir que se quiten datos que los identifiquen, no que se cambien los hallazgos). Si la práctica no funciona en sus equipos, lo publicaremos igual, con el mismo tono.

**Lo que puede salir mal, y está previsto.** Si una fecha se pone en riesgo y el equipo deja la práctica, no es un fracaso: es un dato que medimos. Existe un mínimo de tres hábitos que sugerimos mantener aun bajo presión, sin obligar a nadie.

**Calendario tentativo.** Semanas 0 a 6: solo medición, sin cambios. Desde la semana 6: adopción escalonada, un proyecto cada 4 semanas, en el orden que se sortee respetando sus fechas. Cierre y entrega del informe: semana 16 aproximadamente.

**Próximo paso.** Una llamada de 45 minutos para ver si hay proyectos y fechas que encajen, y firmar un acuerdo preliminar de confidencialidad. Nada empieza sin el registro del plan, el acuerdo de datos y la aprobación ética.
