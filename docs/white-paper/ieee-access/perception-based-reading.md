# Perception-Based Reading — the cognitive mechanism under the bridge

> Concept note (2026-09-04). Feeds Compendium §4.1 (the bridge) and gives the bridge test (BX)
> its cognitive-theory backing + a qualitative read-mode DV. "Perception-based reading" is JC's
> phrase; it is not a standard term, so this note fixes the interpretation and grounds it.

## The distinction
Two modes of reading code, borrowed from reading science (perceive a word whole vs decode it
letter by letter):
- **Perception-based (top-down, schema-driven).** The reader recognizes structure and intent *at
  a glance* from surface cues ("beacons"): intention-revealing names, interface signatures, known
  file locations, type signatures, test names. Cheap, near-parallel, low-token. The reader
  *confirms a hypothesis* rather than building one from nothing.
- **Decode-based (bottom-up, line-by-line).** No reliable surface cues, so the reader must
  simulate execution and reverse-engineer intent from implementation detail. Expensive,
  sequential, high-token. This is what unstructured "mud" forces.

## Grounding (cite, do not re-prove)
- Expert readers use top-down pattern recognition; novices fall back to bottom-up reconstruction
  (Brooks' *beacons*; Soloway & Ehrlich's *programming plans*; von Mayrhauser & Vans' integrated
  comprehension model). This is the perception/decode split under another name.
- Code comprehension recruits the **domain-general executive / multiple-demand network, not the
  language centers** (Ivanova/Fedorenko, eLife 2020; arXiv:2304.12373). Comprehension is a
  working-memory/reasoning cost. Structure lowers it by moving load from reconstruction (decode)
  to recognition (perception). This is the neuro-level form of the read-asymmetry.

## Why this sharpens the bridge (not a new contribution, a mechanism under an existing one)
The stateless AI reader is the extreme case: it carries **vast schema knowledge** (trained on all
code, so it knows every idiom and pattern) but **zero project context** (no session memory). That
makes it primed for perception-based reading *iff the code presents recognizable beacons*, and
forces it into expensive decode when it does not. The bridge premise ("fluent on both banks")
gains a mechanism: the model *has* the schemas; the disciplines are what let it **perceive**
(match a known schema) instead of **decode** (reconstruct intent from detail). Human-maintainability
== AI-derivability, restated cognitively: the disciplines are perception affordances.

## Each discipline is a perception affordance (a beacon)
| Discipline (GS property) | Beacon it supplies | Decode cost it removes |
|---|---|---|
| Intention-revealing names (Self-describing) | semantic beacon: intent from the name | reconstructing purpose from usage (Le/Li: stripping names destroys this) |
| SOLID interfaces (Composable) | the signature *is* the contract | reading the body to learn behavior |
| Hexagonal / layered known-locations (Bounded/Composable) | where each concern lives | cross-file localization search (the SWE-bench bottleneck) |
| Tests-as-contracts (Verifiable) | the invariant, named | reverse-engineering invariants from implementation |
| Bounded / small units | fits one perceptual "fixation" (a working-memory chunk) | a 489-line God Class overflows the chunk, forcing decode |
| ADRs / conventional commits (Auditable) | the *why*, at a glance | code archaeology across history |

## Integration into GS (three concrete moves)
1. **§4.1 backing.** Add perception-vs-decode as the cognitive mechanism under the bridge and the
   RETRIEVE role: perception = the CKG lookup (authored structure enables recognition); decode =
   the RAG scan (no structure, must reconstruct). This is the read-asymmetry at the cognitive level.
2. **Bridge test (BX) read-mode DV.** The BX read-breadth + token metrics already measure
   perception vs decode: D → targeted reads, few fixations, low tokens (perception); M →
   whole-tree sweeps, high tokens (decode). Add a *qualitative* classification of each assistant's
   read trace as perception-dominant (targeted, hypothesis-confirming) vs decode-dominant (broad,
   reconstructive). Gives BX a theory-named DV, not just a number.
3. **Cross-link to the specificity dial (§4.5.1).** Verification has the same two modes.
   *Perception-verify* = bring the system up and look (does it behave/look right?); cheap, gestalt.
   *Decode-verify* = line-audit the code against a pinned spec; expensive. Low specificity → the
   reviewer verifies by perception; high specificity → by decode. Perception-based reading is thus
   the single mechanism under BOTH the read side (the bridge) and the verification side (the dial):
   structure that is perceivable is both cheaper to comprehend and cheaper to verify.

## Multimodal extension (JC's "ejecución generativa")
Perception-based reading generalizes past source to the *running* system: screenshots, logs,
diagrams, DB state. Verifying by perceiving the running system is the multimodal verification loop
(the low-specificity, perception-verify end of the dial). Same mechanism, different surface.

## Alternatives to confirm with JC
This note reads "perception-based reading" as the perceive/decode (top-down/bottom-up) comprehension
split. Two other readings, if that is not what was meant: (a) how the *transformer* reads (attention
as parallel/perceptual vs sequential parse); (b) literal multimodal/visual perception (reading
UI/diagrams). (a) and (b) are compatible with, not rivals to, the framing above.
