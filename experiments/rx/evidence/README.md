# Evidence Artifacts

This directory contains committed evidence from each RX run.

After each run, commit:
- `jest-output.json` — raw `jest --json` output
- `build-log.txt` — npm install + tsc output
- `score.json` — per-property rubric scores
- `run-metadata.json` — model, date, API cost

These artifacts are the claims. Anyone who clones the repo gets them. Anyone who runs `runner/run.sh` can produce their own version and compare.
