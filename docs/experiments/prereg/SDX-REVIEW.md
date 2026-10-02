# SDX design review (stage 3 of the protocol), 2026-10-02

Reviewed artifact: the proponent's SDX design draft of 2026-10-01 (8 arms, 3 vendors, 12 change requests, hypotheses H1 to H5; private working draft). Protocol applied: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\EXPERIMENT-PROTOCOL.md`.

Method: three fresh, stateless `claude -p` runs (model opus, no tools, no conversation history) that saw only the protocol and the design draft, each with a different focus: (1) construct validity and arm fairness, (2) measurement, oracle, judges, statistics, (3) skeptical outsider and redesign. Raw outputs, unedited: `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\prereg\SDX-review-raw\critic-1.md`, `critic-2.md`, `critic-3.md`.

Limit of this review: all three critics are the same vendor family (the only CLI available in this session). They are independent of the author and of each other's context, not independent of one another's training. A critic from another vendor should re-read SDX-1 before it is frozen (open item in SDX-1 section 13).

## Convergent findings (raised by two or three critics)

| # | Finding | Critics | Disposition |
|---|---|---|---|
| F1 | No positive control, no A/A negative control; ceiling check only on the naive arm, so an expert-vs-substrate ceiling (the AX2 failure) would go undetected | 1, 2, 3 | ACCEPTED. Added A/A arm, "amnesia" positive control, ceiling rule on A1 and A3 |
| F2 | Primary readout (E1 at the last change) is a level, not durability; an arm that starts ahead wins without any durability effect | 1, 3 (2 implicitly) | ACCEPTED. Primary becomes the arm x probe-type interaction on probes tagged state-dependent vs state-independent before any run |
| F3 | H4 reconstruction and the injected-defect taxonomy mirror the substrate's own sensors; they measure the treatment | 1, 2, 3 | ACCEPTED. H4 moved out of SDX-1; reconstruction labelled targeted; defects must be defined against the shared base spec and change list; A3 as comparator |
| F4 | H3 handoff falsifier compares the substrate with "expert prompt with the prompt removed", which is decided by construction; vendor switch confounds handoff | 1, 2, 3 | ACCEPTED. H3 moved to a later experiment, same-vendor fork first, with-prompt comparator |
| F5 | Mutation score with the arm's own tests is treatment-targeted (red-first, ratchet) | 1, 2, 3 | ACCEPTED. Relabelled targeted; only the hidden-suite kill rate stays neutral, and as secondary |
| F6 | Acceptance rule and hooks give A4 a free rollback or extra failed attempts; scored state undefined | 1, 2, 3 | ACCEPTED. Scored state is a harness snapshot of the working tree after the last attempt, same rule for every arm; hook blocks, cap hits, test deletions logged per arm; differential cap-hit rate is a registered INVALID-DESIGN trigger |
| F7 | Too many arms and hypotheses for the power; claim S is a conjunction of two underpowered tests; vendor sign-test at n=5 is noise; Cliff's delta power vs percentage-point SESOI mismatch | 2, 3 (1 partly) | ACCEPTED. One primary contrast; one gatekept key secondary; n derived from the pilot's measured SD; vendor results descriptive; H2 cut |
| F8 | Decision table ends in sellable claims; the "wrong experiment" case appears only as "A0 at ceiling" | 3 (2 via protocol guard) | ACCEPTED. Offer column removed; replaced by a forbidden-conclusion column; explicit INVALID-DESIGN rows added |
| F9 | Content parity is broken in the substrate's favor (token match to the sentinel only; substrate carries contract/use-case files from the same cascade the oracle derives from) | 1, 3 | ACCEPTED in part (see R1, R2) |
| F10 | Oracle: status-class tolerance can be gamed by always-4xx servers; probes must be versioned at the spec-change and the reversal; validate with reference implementation, degenerate stubs and mutants | 2 (1 on holdout) | ACCEPTED. Oracle validation is a pass criterion of SDX-0 |

## Single-critic findings, accepted

- Scripted product-owner reply identical for every arm at the two decision points (critic 1).
- Interim look must be run by a script that outputs only pass/fail flags, never arm-level outcomes (critic 2).
- The external expert-prompt and flat-file author is mandatory, not "preferable"; all three artifacts are revised by someone blind to which arm a change favors (critic 1).
- A flat context file should be the best structured single file, not "unstructured prose" (critic 1).
- Pilot pass criterion must not be "naive below substrate" (peeks at the hypothesis); it becomes "oracle discriminates reference from degenerate, and the comparison arms are below ceiling" (critic 2).
- Judge vendor aliased with executor vendor stratum (critic 2): moot in SDX-1 because no primary metric is judged; carried to the later governance experiment.
- Record which arm asked questions and how often (critic 1).

## Rejected or narrowed, with reasons

- **R1. Total-token parity across arms (critic 1, C3).** Narrowed. The structured substrate is necessarily longer in total than a prompt. Forcing total parity would delete content from the substrate and make the contrast uninteresting. Instead: parity of content (every manifest item present in every arm, checked by a judge from another family), the flat-file arm carries the same total content as the substrate flattened (this is exactly the comparison that isolates structure and enforcement), and artifact sizes are recorded and reported. A1 is a prompt-size artifact on purpose; that is what an expert prompt is.
- **R2. Strip all product information out of the substrate (critic 1, C3).** Narrowed. A substrate legitimately contains specs derived from the base spec. The rule adopted: nothing in any arm artifact may state a fact that is not derivable from the base spec, the change request texts, or the agent's own recorded decisions, and a stateless judge checks every frozen artifact against the oracle probe list for leaked facts.
- **R3. Horizon of 7 to 8 changes (critic 3).** Narrowed to 9. The state-dependent changes need antecedents (an emergency-move change before its reversal, a forage budget before its reuse), so a shorter horizon removes the probes that matter.
- **R4. Independent party writes half the change requests (critic 1).** Narrowed to at least 3 of 9, with the whole list reviewed by an independent person, because an independent author for half is not realistically available. Flagged as a decision for JC (SDX-1 section 13).
- **R5. A fixed fourth-vendor judge for all chains (critic 2).** Deferred, not rejected: no primary SDX-1 metric is judged.
- **R6. Add an enforcement-only arm A1g (expert prompt plus a generic test-must-pass hook) (critic 1).** Deferred to SDX-2, not dropped: it answers a different question (is the active ingredient the gate?) that depends on SDX-1's A4 vs A3 result.
- **R7. Exact amnesia implementation (critic 3: wipe before the two state-dependent changes).** Simplified to one removal event before the spec-change change; the positive control only needs a known large effect.
- **R8. Drop cost (P9) and capacity (P8) predictions entirely (critic 3).** Cost kept as a reported secondary (no prediction attached); capacity (frontier tier) deferred to SDX-2.

## Hypotheses proposed by critics and what happened

| Proposal | Where it went |
|---|---|
| H1': arm x probe-type interaction on state-dependent probes | SDX-1 primary |
| H5': with content equal, flat file ~ substrate on state-dependent probes (cheapest competitor) | SDX-1 key secondary, tested with equivalence test |
| Dose-response: gap grows with distance since the decision | SDX-1 secondary (distance-binned) |
| Scale threshold: state loss binds only when the repo exceeds what a fresh session reads; manipulate repo size or read budget | `C:\workspace\PragmaWorks\gs\generative-specification\docs\experiments\BACKLOG.md` item (proposal) |
| Enforcement-only (generic gate recovers the gap?) | SDX-2 (BACKLOG) |
| Overhead as a pre-registered way to lose (cost per hidden-correct change) | SDX-1 secondary with a decision-table row |
| Spec-change propagation share | SDX-1 secondary (propagation probes) |
