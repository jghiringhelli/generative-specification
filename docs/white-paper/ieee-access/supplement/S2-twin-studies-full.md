# Section VI.G. Experiment IX: The Twin Study (TX): Structure, Retrieval, and Model Capacity

> Gate: seven properties, objective metrics only, no token-reduction percentage, no confidential data.
> No em-dashes. Derives from Compendium §7.8.J. Benchmark: RealWorld/Conduit + the AX naive reps + a
> local small model; no proprietary project is used.

## Purpose
The AX series measures generation quality by rubric. TX isolates a different question: holding behaviour
constant, what does disciplined structure contribute to how an executor *reads* and *modifies* a codebase,
and does that contribution depend on the capability of the model doing the work?

## Method
From the AX naive condition we froze one representative default generation of the Conduit backend as the
undisciplined twin M: a single 489-line route file concentrating article, favourite, and feed logic with
direct database access and no interfaces. An executor refactored M into a behaviour-preserving disciplined
twin D: a layered domain, application, and infrastructure structure with repository interfaces, small units,
and a centralized response builder. Behavioural equivalence was established by the shared conformance suite
(13 files) passing identically on both twins, so the twins differ only in structure. All measures are
objective: read breadth (the count of distinct files an assistant opens, parsed from its tool calls),
compilation status, the count of endpoints preserved, and per-run cost, over k independent stateless runs.

## Findings
1. **Disciplined layering, at fixed content, did not reduce read cost.** On cold comprehension and on a
   feature-addition task, the disciplined twin's read breadth was equal to or slightly higher than the mud
   twin's (median 5 files versus 4), because one concern is distributed across several small files where the
   mud holds it in the single file already open. This bounds the claim to the organization axis: layering is
   not, by itself, cheaper for a stateless reader at this scale. The companion study SX (Section VI.H) varies
   the other axis, content quality, and finds the complementary lever.
2. **The read economy belongs to the authored map.** Placing a sentinel navigation node in each twin drove
   exploratory search to zero and made read breadth deterministic on both twins. The saving is a property of
   authored navigation, that is, of Self-describing and Bounded, not of layering as such. This replicates, at
   file granularity, the knowledge-retrieval result reported in Section VI (KX): explicit structure beats
   inferred structure on structural queries.
3. **The decisive effect is capacity-relative.** Given a cross-cutting modification on a small local model,
   the mud twin was regenerated in truncated form: the model produced a file that retained two of the eight
   route handlers, dropping most of the API, and it still compiled, because untyped code carries no contract
   whose violation a gate could catch. The disciplined twin's small units regenerated whole, and its type
   contracts turned the same model's error into a compilation failure that a human or a verification loop then
   corrects. A capable model on the same small system showed no difference between the twins, holding the
   entire file within its working capacity.

## Interpretation
The contribution of the disciplines to construction is capacity-relative scaffolding. Bounded units keep a
fallible model coherent, so it does not silently drop functionality (the Bounded property). Type and test
contracts act as a gate that converts the model's errors into caught failures rather than shipped defects
(the Verifiable and Defended properties). The benefit is largest where the model's capacity is smallest
relative to the task, and it diminishes as the model strengthens, relocating from raw output quality to
reliability, to larger and more entangled systems, and to longer working horizons.

## Implication (economic and architectural)
This identifies a second, cheaper route to model coherence. A capable agent stays coherent on a large task by
planning sub-tasks and managing its own context window. TX shows that disciplined structure plus enforced
read scope (inversion of control, in which the harness supplies the model only the relevant slice rather than
trusting it to restrict itself) externalizes that same bounding into the codebase, so a *less capable model,
or a pure language model without an orchestration layer, recovers much of the coherence a strong agent obtains
through orchestration.* Where frontier-model cost is prohibitive, or where a self-hosted model is required for
data-control reasons, disciplined structure and enforced retrieval are therefore a viable substitute for model
scale on the classes of task this study covers. We state this as an implication supported by the capacity
result above, not as a measured cost claim, and mark the general-scale version as future work.

## Threats and scope
Single benchmark, one small and one capable model, one system. Read breadth is a proxy for retrieval effort.
The capacity result is a single-system demonstration of a mechanism, not an effect size across benchmarks; the
larger-scale and multi-model confirmation is the next experiment. Full log and per-arm data are committed at
`experiments/ax/bridge/` (`RESULTS.md`).

# Section VI.H. Experiment X: The Surface Study (SX): Duplication, Navigation, and the Bounding Lever

> Gate: seven properties, objective metrics only, no token-reduction percentage, no confidential data. No
> em-dashes. Derives from Compendium §7.8.K. Cost is reported as tokens to complete an accepted change, a
> per-run measure, never as a savings percentage.

## Purpose
TX held content constant and varied organization. SX holds organization roughly constant and varies content
quality, to isolate the second lever the discipline-role taxonomy names in Section IV: bounding, the removal
of duplicated and dead surface, as distinct from navigation.

## Method
A clean disciplined generation of the Conduit backend served as the reference twin. A behaviour-preserving
degraded twin was produced by injecting the average condition of a real project, calibrated to published
empirical norms across eight dimensions: about thirteen percent live code duplication, several functions at
cyclomatic complexity between twenty and forty over an otherwise low mean, about seventeen percent unused
functions, about thirty-eight percent line coverage with several modules at zero, a comment density near
fifteen to twenty percent carrying documentation drift, mixed architectural patterns in which three read
endpoints access the database directly in the controller while their sibling writes remain layered, and
dependencies about one year behind current. Each parameter is recorded with its source. Both twins pass the
shared conformance suite identically (thirteen of thirteen), so they differ only in surface. The task adds a
computed field to every article response: one edit against the reference twin's centralized response builder,
and five live duplicated copies to reconcile on the degraded twin. Runs are agentic on a capable model, under
a three level navigation ablation (no authored map anywhere, a map on the reference twin only, a map on both
twins), two runs per cell. All measures are objective: edit count, read breadth, localization tokens (the
tokens spent before the first edit), tokens to complete the change, conformance pass, and a coherence probe
checking the new field on every path that returns an article.

## Findings
1. **The authored map reduces the localization cost, on both twins.** A navigation node placed with each twin
   collapses the tokens spent locating the change site by roughly a factor of three on the degraded twin, and
   lowers it on the reference twin as well. This is the authored-structure result reported for KX and TX, on
   the read side of a modification.
2. **The authored map does not remove the surface cost.** With a map present on both twins, the degraded twin
   still requires about 2.4 times the tokens and 3.5 times the edits (seven versus two) to complete the same
   change, because the change must be applied to the five duplicated copies. No navigation removes this cost;
   only removing the duplication does.
3. **Without an authored map, behaviour is high variance even on the reference twin.** One run completed the
   change in two edits, another wandered to eleven. The map reduces variance as well as the mean.
Conformance held on every run, and the coherence probe passed on every run, because the capable model pays the
additional cost rather than omitting a copy. The failure mode in which a model omits a duplicated copy and
ships inconsistent behaviour is the weaker-model case, consistent with the truncation TX observed, and is
left to a local-model study.

## Interpretation
TX and SX together decompose the read-and-modify economy into the two levers named in Section IV. Navigation,
supplied by the authored map, recovers the search cost on any codebase. Bounding, supplied only by
refactoring, removes a surface cost that no map recovers. The surface cost persists on a capable model, so
this lever is structural rather than capacity-relative, in contrast to the coherence effect TX isolates. The
practical consequence is that reorganizing a codebase at constant content does not make it cheaper to read,
whereas reducing its duplicated and dead surface does, for any model.

## Threats and scope
Single benchmark, one capable model, two runs per cell. The no-map condition is high variance and would need
more runs to fix a mean; the load-bearing comparisons are the map-present cells, which are stable across both
runs. The weaker-model coherence-failure arm is future work. Cost is reported as tokens to complete an accepted
change, not as a reduction claim. Full per-cell data are committed at `experiments/sx/` (`RESULTS.md`,
`calibration.json`).
