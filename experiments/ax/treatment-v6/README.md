# AX Condition: treatment-v6

**Hypothesis**: GS-built semantic tooling (CodeSeeker v2.0.0) reduces structural duplication and catches interface incompleteness that static prompting alone misses.

## What changed from v5

| Change | Rationale |
|---|---|
| CodeSeeker MCP v2.0.0 activated | Semantic search + graph expansion available during generation. Author's own tool — full COI disclosure in CLAUDE.md. |
| §8 DRY gate added to Verification Protocol | Operationalizes the search-first rule as a self-check before each response ends |
| §9 Interface Completeness gate added | Closes the v3 defect: `IArticleRepository` missing `.favorite()`/`.unfavorite()` with no detection |
| ESLint config emitted in P0 (infrastructure) | Makes lint a P1 gate from the first commit — caught 38 errors in v3 post-hoc |

## What did NOT change

- GS specification (all 7 GS properties and their definitions)
- Verification Protocol §1–§7 (unchanged from v5)
- Model: `claude-sonnet-4-5`
- Feature prompts (P1–P6): identical to v5
- RealWorld Conduit benchmark spec: unchanged

## Conflict of interest disclosure

CodeSeeker is the author's own tool, built under Generative Specification methodology (documented in §7.4 of the white paper). Using it in v6 tests **GS ecosystem compounding** — whether a GS-built tool measurably improves a GS-guided build. This is not a comparison against v5 specification quality; it is an orthogonal dimension: **tooling × specification**.

CodeSeeker v2.0.0 was published to NPM on 2026-03-23 (prior to this experiment run). The published version is independently auditable at `https://www.npmjs.com/package/codeseeker`.

## Expected outcomes

- jscpd duplication < v5's 5.37% (target: < 4%)
- Zero `IArticleRepository` method completeness gaps
- Zero ESLint errors (vs v3's 38)
- Test ratio ≥ v2's 0.24 (vs v5's declining trend)

## How to run

This condition requires:
1. CodeSeeker v2.0.0 installed: `npm install -g codeseeker@2`
2. MCP server configured in Claude Code: `npx codeseeker serve --project ./output/project`
3. Run prompts in order: P0 (infrastructure) → P1 (auth) → ... → P6 (integration)
4. Run fix pass if tsc/lint errors remain after P6

## Evaluation

Scoring uses the same blind audit rubric as all prior conditions (0–2 per GS property, 14 total). External analysis (jscpd, madge, ESLint, tsc, interface detection, test ratio) documented in `EXTERNAL_ANALYSIS.md`.
