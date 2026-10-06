# FX-1 fixtures: five invented product briefs (DRAFT)

Registered with `docs/experiments/prereg/FX-1.md`. Each brief is a plain product-owner description of an invented project of a different type. Rules they obey:

1. **Invented, not memorized.** No public reference implementation of these exact rule sets is known. The canary probe of FX-1 section 4.1 checks recall per vendor and per fixture before the study.
2. **Independent of GS.** The briefs use no GS vocabulary (no spec, sentinel, cascade, ratchet, lock, acceptance criteria with ids). They say what the owner wants, and one line of owner quality bar. The formulas under test turn a brief into a specification; the brief is not already one.
3. **Machine-sized.** About 10 observable behaviours each, enough for a first slice of three features and for a hidden check later (SDX-style oracles are not part of FX-1).
4. **Runtime stack fixed per brief** so the checker has finite stack adapters (node and python); development tooling is unrestricted. Allowed runtime dependencies are stated in each brief; everything else is the model's choice.

Form: every brief contains a numbered list of behaviours and exact numbers, so they are close to specifications. FX-1 section 4.1 requires at least two of the five to be rewritten as unstructured prose with ambiguities before freeze, and reported as a separate fixture class.

Authorship disclosure: the five briefs were drafted by the assistant on the GS side on 2026-10-05. FX-1 requires an independent person (not JC, not an agent) to read them and rewrite or replace any brief before freeze (FX-1 section 13, item 3). Nothing here has been run.

| Id | Name | Type | Stack |
|---|---|---|---|
| FIX-API | Lendmark | web API | Node 24, built-in `node:http` and `node:sqlite` or in-memory |
| FIX-CLI | Stitchcount | command-line tool | Python 3.11, standard library and pytest only |
| FIX-PIPE | Tidewatch | data pipeline | Python 3.11, standard library and pytest only (SQLite via `sqlite3`) |
| FIX-GAME | Cinderfall | game rules engine (library) | Node 24, no runtime packages |
| FIX-MCP | Shelfwise | MCP tool server | Node 24, the official MCP SDK package as the only runtime dependency |
