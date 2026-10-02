# Raw output of stateless critic 3 (claude -p, model opus, no tools, saw only the protocol and the 2026-10-01 SDX design draft)

Unedited. Focus prompt: YOUR FOCUS (critic 3, skeptical outsider and redesign): act as a hostile but fair reviewer of an empirical-SE venue. (a)...

# SDX design review: critic 3 (skeptical outsider and redesign)

**Verdict:** I would not run this as registered. The core question is answerable, but the design buries it under 8 arms and 5 hypotheses. Several key contrasts favor A4 by construction, and the controls the protocol requires are missing.

## Critical

**C1. Positive and negative controls are missing, which breaks protocol guard (a).**
- §10 has only an A0 floor/ceiling check.
- There is no planted known effect and no A/A arm. Without them, a NULL on E1 cannot be told apart from INVALID-DESIGN.
- *Fix:*
  - Add an A/A arm: a duplicate of A1 with a separate seed and run order.
  - Add a positive control with a known effect. One option is an "amnesia" arm: A4 whose sentinel and specs are wiped before CR7 and CR11. Another is planting regressions at a known rate into end states and checking that E1, E2 and E4 detect them at n=15.
  - Register: "positive control not detected → INVALID-DESIGN".

**C2. H1 measures a level, but the claim is about a slope.**
- §1 and §6 read E1 at CR12. If A4 already beats A1 at CR0 (gates, red-first), a gap at CR12 is a single-shot quality effect, not durability.
- *Fix:*
  - Make the primary H1 contrast a difference-in-differences: (A4 − A1) at CR12 minus (A4 − A1) at CR0–2.
  - Better still, use a within-chain control: tag each probe in advance as **state-dependent** (needs information from an earlier CR: CR7 supersession, CR10 reuse, CR11 reversal, CR6 invariants) or **state-independent**.
  - H1′ then reads: the arm × probe-type interaction is ≥ SESOI. This isolates "state must outlive the prompt" from general capability.

**C3. Without a ceiling rule on the comparison arm, AX2 repeats.**
- §10 only stops if A0 is at ≥95%. If A1 sits at 94% on E1, an 8 pp gap cannot be reached.
- *Fix:* register that if A1 or A3 is at ≥ (100 − SESOI)% at CR12 on E1, H1 and H5 are INVALID-DESIGN. Run the pilot on the full 12-CR horizon so this is known before freezing.

**C4. H4 and H3 favor A4 by construction.**
- §2 forbids A1 from keeping notes. §8 then asks auditors "what was decided and why". A1 cannot win reconstruction. P7 is guaranteed and is mechanism evidence, not a finding.
- The injected-defect taxonomy (renumbered criterion, stale derived test) mostly has no target outside spec-bearing arms.
- The H3 falsifier (§1) compares A4 with **A1-no-prompt**, the arm stripped of the content. That handicaps the comparison arm.
- *Fix:*
  - Run the H4 contrast as A4 vs A3 (both can write rationale).
  - Make query (ii) primary.
  - Use defect classes that every arm can host (code vs base spec/CR list).
  - Run the H3 contrast against A1-with-prompt and A3.
  - Hand off to the **same** vendor. A vendor switch confounds "new agent" with "new model", and the arms carry different vendor-specific files (§2 A3).

## Major

**M1. E1 may leak information from the substrate.**
- The oracle (§4) and the manifest (§3) both derive from the same Pastura cascade (contracts.md, use-cases.md).
- §2 does not say who writes A4's "feature specs with acceptance criteria" per CR. If the experimenter supplies them, A4 gets more information per change than R_k. If the resolutions of the D1/D2 ambiguities are encoded anywhere in the substrate or the ADR templates, the oracle rewards A4 for knowing the oracle's answer.
- *Fix:*
  - State that every per-CR artifact in every arm is agent-authored from R_k only.
  - Have a stateless judge check every frozen arm artifact for oracle-probe content.
  - Score the D1/D2 probes as exploratory, or accept any registered-reasonable resolution.

**M2. E5 is a targeted metric.**
- Mutation score with the arm's own tests rewards A4's red-first rule and fixture ratchet. Guard (b) says this is mechanism evidence only.
- "Kill rate of the hidden suite on the arm's mutants" has no stated construct.
- *Fix:* move E5 to the secondary (targeted) metrics, or drop it.

**M3. The harness can drive the result.**
- Per-change state is undefined. When a pre-commit hook blocks a commit, is the accepted state the working tree or HEAD? The answer determines A4's collapse rate.
- "Turn" means different things in each CLI.
- Substrate arms read more and will hit the 60-turn, 15-minute and token caps more often. That can bias against A4, or for it if timeouts are retried.
- Agent behavior on hook failure is vendor-specific: some retry, some use `--no-verify`.
- *Fix:*
  - Define acceptance on a harness-made snapshot, not on agent commits.
  - Log cap hits per arm and treat a differential rate above 10 points as a registered INVALID-DESIGN trigger.
  - Count circumvention events and add a row: if A4's circumvention rate > X%, A4 is not "enforced" and H5(A4 vs A5) is INVALID-DESIGN.

**M4. H2 tests a different construct than it claims.**
- A2 differs from A1 in two ways at once: who wrote the prompt (an LLM role-playing a non-GS engineer) and whether the prompt is reused or rewritten each change. Neither is "a human who doesn't know what to ask".
- An interaction contrast at n=15 per arm needs roughly 4× the n of a main effect, so the design cannot detect anything short of a huge effect.
- *Fix:* drop H2 from SDX and test it in the human study (§16).

**M5. The H1 falsifier has two problems.**
- "Upper CI bound below SESOI" is fine.
- "A1 not worse than A4 in 2 of 3 vendors" is a sign test at n=5 per vendor, so it will fire or fail on noise.
- *Fix:* keep one pooled falsifier and report vendor results descriptively.

## The §17 outcome table licenses conclusions the data do not support

- **Every row ends in a sellable claim.**
  - "A1 > A4 → restrict the claim to higher stakes, larger teams, weaker models": none of these regimes is tested. This is the rescue §6 of the protocol forbids.
  - "A4 ~ A1 on quality, wins H3/H4 → recast as governance": H4 is circular (C4).
  - "Consistent with capacity-relative recession" cannot be falsified here.
- **Offer conclusions don't belong in a decision table.** Strike the Offer column. Replace it with a Forbidden-conclusion column, as protocol §6 requires.
- **The wrong-experiment possibility appears only as "A0 at ceiling".** It needs explicit INVALID-DESIGN rows with concrete evidence:
  - positive control not detected;
  - A1/A3 at ceiling;
  - A/A difference ≥ SESOI (noise exceeds the effect);
  - differential collapse or cap-hit rates across arms;
  - parity judge finds a manifest gap after the fact;
  - leakage of oracle content into an artifact (M1);
  - circumvention above threshold;
  - canary recall above zero;
  - a CLI or model version change mid-window;
  - pilot showing D1/D2 probes reward one specific resolution.

## (a) Is this the right experiment?

Only partly. "An expert prompt is not enough once the project lives" is close to true by definition when A1 is a reused prompt with memory forbidden. The real rival, a practitioner whose agent keeps notes, is **A3**. The question worth deciding is A4 vs A3 on state-dependent probes, with A1 as the reference point.

## (e) Staged redesign and cuts

**Stage 1 (decisive, cheap):**
- Arms: A1, A3, A4, an A1 A/A duplicate, and a positive control (amnesia-A4). Keep A0 only as a floor check, at k=3.
- One vendor; a cross-vendor judge.
- Horizon: CR0, then 7–8 CRs selected so that about half the probes are state-dependent.
- n=15 chains per arm in one vendor rather than 5 × 3 vendors. Within-vendor power is what the contrast needs.
- Primary test: H1′, the arm × probe-type interaction.
- Cost: roughly 70 chains × 9 steps ≈ 800 sessions.

**Stage 2 (only if stage 1 is SUPPORTED or NULL with valid controls):**
- A5 (enforcement vs structure).
- A second vendor as replication, not pooling.
- Full 12-CR horizon.
- Handoff as a same-vendor fork.

**Stage 3:**
- H4 governance with A3 as comparator.
- The human study for H2 and H3.
- Frontier-tier P8.

**Cut from SDX entirely:** A2, A4n, A4e (all of H2), the vendor-switch handoff, E5, and the P8/P9 sensitivity arms. Of P1–P9, register only the predictions tied to a primary falsifier.

**A better H5:** "A4 − A3 on state-dependent probes ≥ SESOI." This tests whether structure beats a flat file where state actually matters, rather than on aggregate E1–E4 where differences dilute.
econd vendor.

**Stage 3.** Same-vendor handoff, then the human study.

## Better hypotheses than H1–H5

- **H1'.** The gap on decision-dependent probes between A1* and A4 grows with the distance (in CRs) since the decision. Falsified if the slope interaction is ≤ 0 or within SESOI by TOST.
- **H5'.** With content held equal, A3 ≈ A4 on decision probes. That is the cheapest competitor. If it holds, the structure-and-gates claim is unneeded for durability.
- **H0 (scale threshold).** State loss binds only once the repo exceeds what a fresh session reads. Manipulate repo size or read budget directly. That turns "horizon too short" from an excuse into a tested regime.
