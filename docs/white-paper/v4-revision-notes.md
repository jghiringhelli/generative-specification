# White Paper V4 — revision punch-list (from JC's read, Jul 2026)

> North star of this revision: the paper is **impactful but loaded and a bit confusing** (JC's words).
> Every change below serves **clarity + sharpening JC's real contributions + honest prior-art**, without
> weakening the evidence. Rule: write it technically correct, then **always land a plain-language corollary**
> (a natural TL;DR, never labeled as one).

## 1. Framing / status
- [ ] **Drop "Preprint" tone.** V4 is the *print* (final statement), not a work-in-progress. Remove
  `Status: Preprint`; label `Version 4.0`. (On arXiv it's technically a preprint — that's fine — but the
  *document* must read finished, not in-progress.)
- [ ] **Kill the in-progress feel of the top block.** The italic "This is the white paper… derived from the
  Compendium" + the "Full story and verification" repo-link dump reads like internal scaffolding. Move
  provenance + repo links to a small **footer / "Materials & evidence"** note at the end. Open clean with
  the abstract. Decide: is that block worth keeping at all, or a one-liner + footer.
- [ ] **Open or close with the massive impact on those who use it well** — a practitioner-transformation
  statement (the "you will build correct systems you can describe" energy), so a dev who wants to code with
  agents is *excited about what comes next* straight from the abstract.

## 2. Structure & sequencing (the big one)
- [ ] **Introduce "structural disciplines" explicitly and early**, with concrete examples, BEFORE the bridge:
  naming = **intentional / clean-code naming**; SOLID; DDD ubiquitous language; design-by-contract;
  type-driven design; hexagonal layering. Define the *term*. The bridge must **stem from** "we force these
  disciplines," so they have to exist on the page first.
- [ ] **The bridge → then the sentinel**, both up front as JC's flagship contributions (see §3).
- [ ] **Phase collapse** — JC's biggest differentiator (spec+impl+verify collapse into one derivation) — is
  under-introduced and lands too late. Give it a proper early introduction.
- [ ] Abstract: concept-heavy is OK, but **the raw numbers confuse there** — soften/relocate the F1/token
  figures out of the abstract; keep the abstract about the *promise + the shape of the proof*.

## 3. JC's real contributions — elevate; be honest the rest is industry-convergent
JC's own map: **the bridge**, **the sentinel (CNT in prompts)**, and **a few concepts inside larger topics**
are his; the rest is taken from an industry converging toward ~GS. Make this explicit and confident.
- [ ] **Spec-as-driver is NOT novel** — spec-driven development predates AI assistants. Say so.
- [ ] **The stateless reader** concept isn't JC's — but the **naming + wrapping** is. Good that we open there;
  frame it as *naming a condition everyone lived with*.
- [ ] **CKG is McCreary's term** (Yarmoluk & McCreary) — attribute clearly.
- [ ] Add a short **"what's ours vs. what's the field's"** honesty beat — it *strengthens* credibility and
  matches the paper's honesty spine.
- [ ] **Map each named concept to the seven properties** (which property carries the sentinel, the bridge,
  the read-asymmetry, phase collapse…) so the reader sees the seven cover everything.

## 4. Concept clarifications JC asked for
- [ ] **Derivability obligation vs. sentinel/context-degradation.** They are different levels and the paper
  must connect them explicitly:
  - *Derivability obligation* = the GOAL: the spec must be complete enough that a **stateless reader derives
    correct output from it alone** (the WHAT).
  - *Sentinel navigational tree + bounded context (few MCPs)* = the MECHANISM that keeps the reader's working
    context clean so it **doesn't degrade** — which is what makes derivation reliable in practice (the HOW).
  - §4.1 currently has the sentinel + bridge but **never links the sentinel to context-window degradation**.
    Make that link explicit.
- [ ] **The read-asymmetry (this contribution is doing a lot of work — surface it).** You comprehend a system
  by reading its **structural surface — contracts, unit tests, interfaces, design patterns, ADRs** — a small
  high-signal slice, **instead of reading all the code to infer behavior and interactions**. This is the
  READ side of the bridge asymmetry, and it's what makes Bounded + the sentinel + KX actually work. Today
  it's only implicit (§4.3 Legibility/Bounding). **Name it and connect it to derivability + Bounded + the
  bridge.** (Yes — it's part of derivability: the reader derives understanding from the surface, not the code.)

## 5. Specific fixes / tensions
- [ ] **Cost-inversion contradiction.** We say the spec "can't be reconstructed from code" — but a codebase
  that **fully satisfies the seven-property rubric gets very close**, precisely because it's *Auditable* and
  has the *document cascade*. Fix: the spec is unrecoverable from a **non-GS** codebase; a fully GS-compliant
  one is *near-reconstructable* — and that's a **feature**, not a contradiction. Reword §4.2.
- [ ] **"A correct spec makes prompt engineering unnecessary"** — keep it. Polemic but true (it abstracts the
  prompting into the instructions/spec). **This is the kind of line that viralizes the paper.** Sharpen, don't hedge.
- [ ] **Explain what Loom is** — one short, punchy sentence + a URL. (The formal-tier language; ALX = a
  compiler derived from its own spec.) A concrete hook that grabs attention.

## 6. Per-experiment: add the layman outcome
- [ ] For **every** experiment, keep the metric AND add the **plain-language outcome** — what it *means* for a
  practitioner. "AX 3/14 → 14/14" → *"AI output went from structurally broken to production-grade."* Same for
  EX, KX, ALX, RX, BX, **MX, RND-1**. End each with the natural corollary.

## 7. New framing to add
- [ ] **The inverted-pyramid / walls-of-correctness image.** The verification pyramid whose walls are
  *correctness*, often driven by the good practices that **enable the bridge**: GS shows the agent the
  hard-won, shared wisdom of expert veterans (the structural disciplines). Tie "structural disciplines =
  encoded veteran wisdom" to the bridge.

## 8. Outreach
- [ ] **Send to Robert C. Martin?** YES — but AFTER this clarity revision (the paper extends *his*
  discipline-of-removal paradigm; don't send the loaded version to the one authority whose framework you're
  building on). Zenodo/precedent first (timestamp), then a respectful DM/X or email: *"extending your
  discipline-of-removal paradigm to the stateless-reader problem."*
