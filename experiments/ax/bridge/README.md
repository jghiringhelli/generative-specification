# Bridge Test (TX) — Architecture as AI-Derivability

> Runnable protocol. Grounding + literature: `../../docs/white-paper/ieee-access/bridge-test-grounding.md`.
> Theory: Compendium §4.1 (the bridge). This supersedes the prompting-altitude design in
> `../bridge-strong/` + `../bridge-weak/` FOR THE BRIDGE CLAIM; those two prompts are retained
> as the instrument for the *sibling* specificity-dial study (§ Specificity Dial below).

## Claim under test
Human-maintainability structure == AI-derivability. The architectural disciplines (SOLID
interfaces + SRP, hexagonal/layered known-locations, tests-as-contracts, intention-revealing
names) were built so a HUMAN derives intent without reverse-engineering; the SAME structure
lets a stateless AI reader derive intent without reverse-engineering. Measured on the READ side.

## The gap we fill (from grounding doc)
Naming (Le/Li 2025), comments (Vitale 2026), and smells (Xue 2025) → AI comprehension are shown.
No study manipulates the **architectural** disciplines on the **same** system measuring AI
comprehension + modification + token cost. "Architecture as AI-derivability" is OPEN.

## Twins (the only free variable is structure)
- **M (mud)** = a real default-prompt Conduit generation, NO bridge signal. Source: an existing
  `runner/runs/naive/{i}/project` rep. Selection rule: pick the rep whose measured smell profile
  best matches the documented default profile (Long Method / God Class / poor names / no
  interfaces; see grounding §"natural default"). Cite that M is representative, not fabricated.
- **D (disciplined)** = a **behavior-preserving** disciplined refactor of *that same M*: extract
  SOLID interfaces + SRP units, hexagonal ports/adapters (known locations), intention-revealing
  names, tests-as-contracts. NOTHING about observable behavior changes.
- **Oracle (behavioral equivalence proof)** = the shared Hurl suite `../evidence/hurl/*.hurl`
  (13 files: auth, articles, comments, profiles, favorites, feed, pagination, tags, + 5 error
  suites). D and M are admissible as twins ONLY when the identical suite passes GREEN on both.
  If default M fails an oracle case behaviorally, fix behavior MINIMALLY (no restructuring) and
  log it; M's *structure* stays untouched so it remains a genuine default-smell artifact.

## Confound control: architecture ABOVE naming
Naming is a known-strong channel (Le/Li). To attribute the effect to ARCHITECTURE and not just
names, run two D contrasts:
- **D-full** = architecture + naming disciplined.
- **D-arch** = architecture disciplined, names held at M-quality (obfuscated/generic), a
  ClassEval-Obf-style naming control. Effect of D-arch over M isolates the architecture channel.

## Dependent variables (fresh, stateless assistant per twin, per task)
Each assistant gets ONLY the twin's source tree, no session history, no bridge narration.
1. **Comprehension** — a fixed bank of ~18 questions across three types: intent ("what does X
   guarantee?"), location ("where is invariant Y enforced?"), invariant ("what breaks if Z
   changes?"). Score token-level F1 against fixed ground truth. Metric: mean F1.
2. **Modification** — a SWE-bench-style task set (add/change a feature, e.g. add article
   tag-rename cascade, add favorite-count denormalization). Metric: does the shared Hurl oracle
   stay GREEN after the patch? (binary pass) + tokens spent + read-breadth.
3. **Cost / reverse-engineering** — tokens consumed and read-breadth (files opened, targeted vs
   whole-tree sweep) per Ma-2026 accounting. Reverse-engineering-cost proxy.

## Prediction
D → accurate, cheap, targeted reads; M → error-prone, expensive, whole-codebase sweeps. Closes
the lifecycle-economics arc: AX (GS costs MORE to generate) + KX + TX (disciplined structure is
CHEAPER to read/comprehend/extend) = the real answer to the token-cost objection (pay at
generation, recover across maintenance). NO token-reduction % asserted.

## Protocol (binary first)
1. **Select M** — measure smell profile across naive/{0..4}, pick best-matching rep. [measure.cjs]
2. **Oracle-baseline M** — run Hurl suite against M; record green/red; minimal behavior-only fixes.
3. **Build D-full and D-arch** — behavior-preserving refactor; Hurl suite must stay green on both.
4. **Author DV instruments** — the 18-Q comprehension bank + ground truth; the SWE-bench-style
   modification tasks + their acceptance (oracle-green); the token/read-breadth accounting harness.
5. **Run** — k stateless assistants per {M, D-arch, D-full} × {comprehension, modification}.
6. **Stats** — paired per twin; Mann-Whitney U + Cliff's delta + Holm-Bonferroni (reuse stats.py).
   Binary D-vs-M first; discipline-ladder (strip one discipline at a time) only if binary separates.

## Pre-registered caveats
Varies by language/prompt/project (Zhu, Paul) — run on >=1 system, ideally add a 2nd
language/domain for external validity. Architecture effect must be shown ABOVE the naming effect
(the D-arch contrast). M is one representative default, not a claim about all defaults.

## Specificity Dial (sibling study, reuses bridge-strong/weak)
Distinct claim (Compendium §4.5.1): specificity (not specification) is a DIAL; low specificity →
high AI freedom → light verification; high specificity → heavy human control. `../bridge-strong/`
(conceptual = low specificity) and `../bridge-weak/` (mechanical = high specificity) are the two
dial ends. Design (later): vary specificity × stakes, measure time-to-acceptable-quality +
verification cost. Not part of the binary bridge test; documented here so the prompts are not lost.
