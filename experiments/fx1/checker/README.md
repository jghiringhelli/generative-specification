# The FX-1 checker has moved

The conformance checker is no longer maintained in this repository. **The canonical copy is one file, `tools/gs-check/gs-check.mjs`, in the formulas repository** (branch `formulas-2026-10-05` at `C:\workspace\PragmaWorks\gs\gs-formulas`; after the merge, `tools/gs-check/` of the genspec repository). Its tests, controls, fixtures, Dockerfile and README live beside it (`tools/gs-check/test/`, `tools/gs-check/README.md`). There is no second copy here on purpose: two copies drift, and a registration must pin one.

What stays in this repository is the **study design** around it: `docs/experiments/prereg/FX-1.md`, `docs/experiments/FX-1-CHECKER-SPEC.md` (what each element must mean; section 11 records the 2026-10-07 changes), the fixtures and the simulation (`experiments/fx1/fixtures`, `experiments/fx1/simulation`).

To register a checker for FX-1, pin three things in the freeze list: the commit of the formulas/genspec repository, the SHA-256 of `tools/gs-check/gs-check.mjs`, and the configuration hash printed by `node gs-check.mjs --print-config` (also carried in every report as `config_sha256`). Run the checker in the pinned Linux image (`tools/gs-check/test/Dockerfile`). Decide before freeze whether the registered mode is `--strict` (a failing package script is not credited), the default, or both (`--both`); the checker spec, section 11, says why.
