---
layout: default
title: "RX - Replication"
parent: Experiments
nav_order: 4
description: "Any reader can reproduce 104 passing tests against a live PostgreSQL instance from a GS document alone."
---

# RX — Replication Experiment

Demonstrates that the **Executable property** of Generative Specification is reproducible by any developer with a PostgreSQL instance and an Anthropic API key.

Full specification: [`docs/specs/rx.md`](https://github.com/jghiringhelli/generative-specification/blob/main/docs/specs/rx.md)

---

## Prerequisites

- Docker (for PostgreSQL)
- Node.js 20+
- `ANTHROPIC_API_KEY` environment variable set

## Quick Start

```bash
# 1. Start PostgreSQL
docker compose up -d postgres

# 2. Run the full generate → build → test cycle
./runner/run.sh

# 3. Review evidence artifacts
cat evidence/score.json
cat evidence/jest-output.json
```

## Directory Structure

```
experiments/rx/
  spec/               GS document fed to the AI agent (committed verbatim)
  runner/             Orchestration scripts
  score/              Rubric scoring scripts
  evidence/           Committed output artifacts (jest --json, build log, scores)
  generated/          AI-generated project source (gitignored)
  docker-compose.yml  PostgreSQL 16 ephemeral instance
```

## Evidence Artifacts

After a successful run, `evidence/` contains:

| File | Description |
|---|---|
| `jest-output.json` | Raw `jest --json` output — primary evidence |
| `build-log.txt` | `npm install` + `tsc --noEmit` output |
| `score.json` | Per-property rubric scores |
| `run-metadata.json` | Model version, date, API call count, cost |

These files are committed. Anyone who clones the repository gets the pre-run evidence and can verify the results without re-running, or re-run to produce their own evidence.

## Pass Criteria

- `tsc --noEmit` exits 0
- `jest --json` → `numFailedTests === 0`
- No hardcoded credentials in generated output

## Relationship to Other Experiments

- **AX** (complete) — adversarial AI vs AI study, v1–v5, 40 participants. Establishes the claim under controlled conditions.
- **RX** (this) — automated replication. Makes the claim independently verifiable.
- **DX** (April 2026) — human developer comparative study. Tests adoption in the wild.
