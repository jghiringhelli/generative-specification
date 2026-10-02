# IEEE Access — Submission Checklist & Critical Path (refreshed 2026-10-01)

*State as of the 2026-10-01 revision on branch `paper-fixes-2026-10-01`. The earlier version of this file (dated Sept 1) listed sections as missing that now exist; this one replaces it. Source of the review that drove the revision: `soma/docs/ieee-access-review-2026-10-01.md`.*

## A. Drafting status

| Section | State | Notes |
|---|---|---|
| Abstract, index terms, contributions | Drafted | Abstract 233 words, leads with a number; every figure checked against `stats.json`, `static_ax2.json`, CR results. Index terms are unverified against the IEEE Thesaurus. |
| I Introduction | Drafted | Terms defined in the paper; four contributions; four RQs. |
| II Related work | Drafted | Eight lineages; 55 verified references in `04-references.md`; unverified items in `REFERENCES-TODO.md`. |
| III, IV (with the seven properties, grading, coherence design) | Drafted compact | Detail moved to `supplement/`. |
| V Study design | Drafted | States design, registration status, collected versus planned metrics, and the limited meaning of "blind". |
| VI Results | Drafted | AX k = 5, post-hoc series, KX, TX/SX, AX2, CR. |
| VII Threats | Drafted | Single author, memorized benchmark, treatment-targeted metric, expert-prompt tie, model-written tests are explicit. |
| VIII, IX, data availability | Drafted | VIII.B states the expert-prompt tie and hypothesis H-S. |
| Figures | Partly | Fig. 3 generated; Figs. 1 and 2 need rendering from the Mermaid source. |
| Template assembly | **Not done** | IEEE two-column template, renumbering references by first citation, cross-reference check. |

## B. Hard requirements

- [x] ORCID: 0009-0004-6092-5387.
- [ ] IEEE two-column template (LaTeX preferred), source plus PDF, at most 20 pages (estimate 12 to 14; verify after assembly).
- [ ] Abstract 150 to 250 words, one paragraph (233 now).
- [ ] Index terms from the IEEE Thesaurus (verify each term).
- [x] AI-disclosure line drafted (in `12-...`, Acknowledgement).
- [ ] CrossCheck: similarity check against the Zenodo v4.0 preprint (DOI 10.5281/zenodo.21726017); cite it as the preprint.
- [ ] Replication package with its own DOI (Zenodo). Fix `supplement/S1`, which still says the AX runner is absent. Include the pre-registration evidence if JC can produce it (see C.1).
- [ ] APC $2,160 (approved).
- [ ] Human copy-edit (poor grammar is an immediate rejection).
- [ ] Cover letter and suggested reviewers.

## C. Decisions and evidence JC must supply

1. **Pre-registration evidence.** The commit identifiers cited for the original design (`bd2c05b`, `7661e62`, `6c24f6d`, `7e06e78`, `482a111`) are not in the public repository (its history begins 2026-03-16, after the 2026-03-13 runs). Either supply a verifiable record from the earlier repository or keep the paper's wording ("author-attested").
2. **Whether the k = 5 analysis plan predates the runs.** Public history says the data (2026-09-14) precede the protocol file (2026-09-17). If an earlier record exists, say so; otherwise keep "pre-specified in intent".
3. **Which paper is submitted.** This draft makes the IEEE paper the narrower, more defensible one and the white paper the broader one. Confirm.
4. **Title.** Lead with *Generative Specification: A Discipline of Derivability for the Stateless Reader* or choose a title that names the finding.
5. **Author bio and affiliation.**

## D. Experiments owed for acceptance (ordered by value; none is run)

1. A second, non-memorized benchmark in the main study (Pastura or a held-out task by another author) with the same k = 5 protocol and all three conditions.
2. A metric the treatment does not target (mutation score or a held-out behavioural oracle) obtained for all three conditions, not only the single deep runs.
3. A powered cross-model run of the full comparison on a controlled substrate (locked scaffold plus a convention-tolerant oracle).
4. An independent replicator, or at least two independent human raters on the audit, plus registration at an independent registry (OSF) before any new run.
5. A long-horizon substrate-versus-prompt experiment (H-S, VIII.B).
6. The contamination canary result for CR, or a statement that it was not run.

## E. Critical path

1. JC settles C.1 to C.5.
2. Assemble in the IEEE template, render Figs. 1 and 2, renumber references, cross-check section numbers.
3. Run experiments D.1 and D.2 if the submission should include them; otherwise submit as an honest bounded paper (acceptance is plausible on soundness and honesty, rejection is plausible on scope).
4. Human copy-edit, CrossCheck, stateless external-judge dry run.
5. Cover letter, replication-package DOI, submit.
