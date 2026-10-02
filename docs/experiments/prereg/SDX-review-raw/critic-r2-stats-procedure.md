# Stage-3 design review: SDX-1 rev. 2, SDX-1-ARMS and SDX-0

I reviewed the files you sent against the protocol, with no other context. I'm a Claude-family critic, so this does not satisfy the different-vendor requirement in SDX-1 §13 item 3. Findings are ranked by severity: **B** = blocks the freeze, **M** = major, **m** = minor. Each has a proposed fix. Accept, reject or defer each one in SDX-REVIEW.md.

## Blocking

**B1. The BETTER rule leaves the co-primaries with about 50% power, not 80%.**
- BETTER needs the interval to exclude zero *and* the point estimate to be at least delta.
- When the true effect equals delta, the point estimate falls below delta about half the time. The power formula in §2a only covers "interval excludes zero", so it overstates power for the rule actually registered.
- Your own central estimates are below the SESOI: H1 about 9 against delta 10, H2 about 3 against delta 5. So BETTER is less likely than not, even if your priors are right. That is "giving up in advance" built into the classification, at $400 to $2,400.
- **Fix.** Separate two questions: is there an effect (lower bound above 0), and is it at least the SESOI (lower bound above delta, a minimal-effect test). Then redo the power calculation for the rule you actually use.

**B2. There is no label for "significant but smaller than the SESOI", and such results get mislabelled EQUIVALENT.**
- Example: an H1 interval of [+1, +8] with delta 10 lies inside ±delta, so it is labelled EQUIVALENT. Row (iii) would then say the substrate "adds no measurable correctness" while the data show it does.
- **Fix.** Add a category, "POSITIVE, below SESOI", with its own decision row and permitted wording ("a measurable effect smaller than the decision-relevant size"). EQUIVALENT should also be checked with TOST at the 1−2α interval; using 97.5% is legal but should be stated as a choice.

**B3. D rewards arms that do badly on state-independent probes.**
- D = E1-SD − E1-SI. Example: A5 with SI 60 and SD 50, and A4 with SI 90 and SD 80, both get D = −10. A4 dominates on everything and H1 still reads EQUIVALENT.
- If A4's hooks also raise SI (they plausibly do, via tests-must-pass), D understates the substrate's effect. If A5 collapses on SI, D flatters A5.
- **Fix.** Make E1-SD the primary readout, with E1-SI as a pre-registered covariate (ANCOVA or a regression adjustment per chain). Report D only as exploratory.

**B4. The state-dependent / state-independent tag is ambiguous, and as written almost every probe is state-dependent.**
- Probes are scored at the final state. Relative to the change-9 session, almost every probe needs information from an earlier change request. That matches the SD definition ("not stated in … the current change text").
- **Fix.** Define the tag relative to the change that introduces the probe. Also note that SD probes all come from changes 6 to 9 and SI probes from changes 1 to 5. As drafted, D confounds "needs remembered state" with "introduced late, on a larger codebase, after a supersession".
- **Fix, continued.** Include early-introduced SD-type probes (for example decision D1 tested at changes 4 and 5), or add change position as a covariate.

**B5. Two INVALID triggers absorb exactly the outcomes that hurt the substrate.**
- "Circumvention in A4 above X% means A4 was not enforced, so INVALID." Agents routing around gates is the treatment working badly in practice. Under intention-to-treat it is a result, not a validity defect.
- "Emergence in half or more of A5 chains means INVALID." If an expert prompt leads agents to build their own substrate and match A4, that is a finding about the thesis.
- With both rules in place, the two most plausible routes to an outcome unfavourable to GS are both converted into "no result". That is the "forcing the truth" failure the protocol names.
- **Fix.**
  - A4 circumvention: make it a reported fidelity measure, with the per-protocol result as a sensitivity analysis.
  - A5 emergence: register a decision row in advance, "A5 self-induced a substrate", with its own permitted conclusion, instead of INVALID.

**B6. The authors of the treatment arm know the benchmark; the author of the comparison arm does not.**
- The A5 practitioner gets the base spec and the change process, not the 9 change texts.
- The GS side builds A4 (and the oracle, and the change list) knowing that a supersession at change 6 and an unannounced reversal at change 9 are coming. A sentinel or ledger shaped around the surfaces change 6 will hit passes the leak rule (everything is derivable from the base spec), yet it is teaching to the test.
- **Fix.** Build A4's initial substrate generically before the change texts exist (or by someone who has not seen them), hash it then, and attest to this. Apply the same rule to A1 and A3.

**B7. The pilot firewall applies only to A5.**
- SDX-0 §4 lets A4, A1 and A3 be revised by "someone blind to which arm a change favors". In practice the GS side sees all pilot outputs across the full 9-change horizon, then freezes artifacts for a main run on the same 9 changes.
- **Fix.** Use a symmetric firewall. Revisions are triggered only by a failed V-criterion; each reviser sees only their own arm's outputs, never hidden-oracle numbers. Log every revision with its trigger.

## Major

**M1. The strength check M2 partly decides H2 in advance and tunes A5 on the outcome metric.**
- A5 must differ from A0 and be "not worse on any" metric, including hidden-oracle pass at change 3. Revisions are made against those pilot numbers.
- If generic expertise really doesn't help (an H2 null), the design revises A5 or declares it INVALID instead of reporting NULL.
- **Fix.** M2 should use only the expert review plus *targeted* metrics (layer violations, duplication). Drop hidden-oracle pass from M2.

**M2. The positive control A4x is neither "known" nor clean.**
1. The 20-point threshold sits at the bottom of your own predicted range (20 to 45), so a large chance of INVALID is built in. The protocol asks for *detection at planned n*, not a magnitude.
2. Deleting the substrate also deletes A4's G content and probably breaks its hooks or lock. A4x − A4 then measures generic guidance loss plus breakage, not lost state.
3. Fork each A4x chain from an A4 chain's state after change 5 (paired), which lowers variance a lot.

**Better positive control (recommended addition): A0+S, "state in text".** This is A0 with the antecedent information restated in each later change text.
- The effect is known by construction.
- A0+S − A0 on SD gives the *largest effect any persistence mechanism could have*.
- If the pilot shows A0+S − A0 below delta, H1 cannot reach the SESOI, and you learn that before spending on the main run.

**M3. A hidden substrate already exists in the harness: Claude Code's own persistence.**
- Claude Code has file-based auto-memory keyed by project path (`~/.claude/projects/<path>/memory/`), plus session resume, todo and plan files, and auto-loading of a `CLAUDE.md` that an agent can create.
- A "clean configuration directory" per *chain* still lets memory carry across sessions inside a chain, in every arm. If chains reuse the same working path, it can carry across chains and arms.
- **Fix.**
  - Use a fresh config directory *per session*, auto-memory off, and a unique repo path per chain.
  - Add a V-check that plants a memory and verifies it is not recalled.
  - The emergent-substrate detector must flag any `CLAUDE.md` an agent creates, because it is auto-loaded.

**M4. The decision points have no mechanism in headless mode.**
- `claude -p` cannot ask a question mid-session.
- If the product-owner reply is delivered only when the agent "asks" (ending a session with a question), D1 and D2 depend on how often each arm asks. A4's triage rule and A5's "ask if ambiguous" instruct this differently from A0.
- **Fix.** Specify the mechanism. Preferably deliver the scripted reply unconditionally inside the change-3 and change-7 sessions. Then the decision lives only in that session, which is the construct you want.

**M5. The oracle may be too lenient for the state-dependent probes.**
- "Bodies checked only for field names" cannot detect a wrong rule in change 8's alert list (membership) or change 1's budget values.
- Status-class probes balanced 2xx/4xx have a 50% guessing floor, which compresses differences.
- **Fix.** Score paired probes as a pair, and check list membership or values wherever the change contract defines them.

**M6. The oracle author chooses the state-dependent probes while knowing what A4 records.**
- **Fix.** Derive SD probes with a mechanical rule (one probe per rule, surface and change, enumerated from the change texts), or have the independent person write them. Freeze them before the substrate is designed.

**M7. The guard-f audit applies only to results unfavourable to GS.**
- Row (iii) (and row (iv), which carries "guard-f audits mandatory") require the validity and falsifiability audits. Rows (i), (ii) and (vii) do not.
- A favourable result is at least as likely to be an artifact here, given that the proponent authored the substrate, the oracle and the change list.
- **Fix.** Make the validity audit mandatory for every verdict row (protocol guard i).

**M8. The authoring vendor matches the generator vendor for A4 but not for A5.**
- A4 is presumably built with Claude assistance; A5 is human-written. A Claude-authored substrate read by a Claude generator is a self-preference-type confound (Panickssery 2024 is about judges, but the mechanism is analogous).
- **Fix.** Disclose authoring tools per artifact in §12, and preferably have a human edit A4's text.

**M9. The retry trigger and the commit policy must not depend on the arm.**
- "At most 3 attempts": what triggers a retry? If it is "the agent's tests fail", A4's ratchet makes retries more likely, so A4 gets more compute.
- **Fix.** Use an arm-neutral trigger (it builds, starts, and passes a base-spec smoke check).
- Likewise, specify who commits after each session in every arm (the harness, with a neutral message), since A4's hooks fire on commits.

## Minor

- **m1.** H2 on E1-ALL dilutes the generic-expertise effect with SD probes, where A5 and A0 should both fail. E1-SI is the cleaner readout for "is expertise better than naive"; consider it.
- **m2.** "Separate seed" for A5b is meaningless with `claude -p`, which has no seed parameter. Say "independent runs, interleaved order".
- **m3.** The A5 vs A5b trigger doesn't say whether it compares the point estimate or the interval. Specify which.
- **m4.** Pin a dated model id; an alias can change silently inside the window.
- **m5.** Floor checks are missing: if A4's E1-SD is near the floor, or SI is at the ceiling for every arm, H1 cannot be tested.
- **m6.** Code comments recording decisions ("// Decision: …") fall through the L3 grey-case rule. Decide now whether A5 may instruct them, and whether the detector counts them.
- **m7.** SDX-0 housekeeping:
  - The A5 path in §1 item 7 lost its backslashes.
  - V4 and V5 still say "P_expert" (the revision-1 name).
  - V9 is listed after V12.
  - V6's "primary readout" should name D, or E1-SD if you adopt B3.
- **m8.** The negative control (n=10) is weak for detecting drift, and the between-chain SD already estimates noise. Either justify it as a check for time drift (interleave it), or move those chains into A0+S.

## Better hypotheses or design options

1. **Bound H1 by A0+S − A0** ("how much of the recoverable state does each arm recover"). Expressed as a recovery share, H1 is far less sensitive to how hard the benchmark is.
2. **Promote dose-response to a primary hypothesis.** The gap on SD probes grows with distance from the antecedent change. It is mechanism-specific, harder to produce by chance, and uses the chain structure you already have.
3. **Focus SD probes on information that is provably absent from the code**: rationale, rejected alternatives, and the targets of the change-9 reversal. Code-recoverable state measures a frontier agent's grep skill (your SX evidence), not the substrate.

**Verdict.** B1 to B7 should be resolved before SDX-0 is tagged, since several of them change the pilot's pass criteria. M3 and M4 are harness facts the pilot should check explicitly. A different-vendor critic is still required.
