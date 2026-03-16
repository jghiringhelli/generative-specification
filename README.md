# Generative Specification

**Community home for the Generative Specification methodology** — the first programming discipline of the pragmatic dimension, designed for a stateless reader.

→ [White Paper](docs/white-paper/GenerativeSpecification_WhitePaper.md)  
→ [Experiment Supplement](docs/white-paper/GS_Experiment_Supplement.md)  
→ [Practitioner Protocol](docs/white-paper/GenerativeSpecification_PractitionerProtocol.md)

---

## What Is Here

### Experiments

| Experiment | Description | Status |
|---|---|---|
| [**AX**](experiments/ax/) | Multi-agent adversarial study. Naive → expert prompting → treatment v1–v5 with ForgeCraft. Establishes quality gradient as a function of specification completeness under controlled conditions. Seven conditions. RealWorld Conduit API benchmark. | ✅ Complete |
| [**RX**](experiments/rx/) | Replication Experiment. Independent verification: given the committed GS document, any developer with Docker and an Anthropic API key can reproduce 104 passing tests against a live PostgreSQL instance. | ✅ Complete |
| [**DX**](experiments/dx/) | Human practitioner study. 40 developers. Group A: prompt-driven. Group B: GS + ForgeCraft. Dual rubric. April 2026. | 🔵 April 2026 |

### Quality Gates

The [`quality-gates/`](quality-gates/) directory is a community-maintained library of structured quality constraints mapped to the seven GS properties. Anyone can propose a gate via pull request.

→ [How to contribute a quality gate](quality-gates/CONTRIBUTING.md)  
→ [Gate schema reference](quality-gates/schema.yaml)

### White Paper

The paper source is in [`docs/white-paper/`](docs/white-paper/). Community review is open — see [REVIEWING.md](docs/white-paper/REVIEWING.md) for how to challenge a claim, propose a correction, or map an issue to a section.

---

## Reproducing the Experiments

### RX (any reader can reproduce)

Requirements: Docker, Node.js 20+, Anthropic API key.

```bash
git clone https://github.com/jghiringhelli/generative-specification
cd generative-specification/experiments/rx
docker compose up -d postgres
./runner/run.sh          # generate → build → test
cat evidence/jest-output.json   # verify: numFailedTests === 0
```

The GS document (`experiments/rx/spec/conduit-gs.md`) is committed verbatim. ForgeCraft produced it, but you do not need ForgeCraft to run this experiment — the document is the reproducible artifact.

### AX (verify from committed evidence)

The pre-run evidence (scores, evaluation transcripts, session logs) is in `experiments/ax/`. The pre-registration commit timestamps prove rubric and design were locked before any experimental run. Clone the repository and inspect the commit history.

---

## ForgeCraft

[ForgeCraft](https://forgecraft.dev) is the hosted MCP server that implements the GS methodology. It reads from this repository's `quality-gates/` library. It is not open source — it is a service.

Free tier: 2 active projects. Contribution path: a merged quality gate PR earns an additional project slot.

---

## Community Convergence

The structural argument developed in §10 of the white paper: when a practitioner community contributes to a shared GS methodology under quality gates, the specification floor across all governed domains rises monotonically and cannot retreat while quality gates hold. That argument applies to this repository. The quality gate library improves with every accepted contribution. ForgeCraft inherits the improvement. Projects governed by ForgeCraft inherit it in turn.

---

## Citation

```
Ghiringhelli, J.C. (2026). Generative Specification: A Pragmatic Programming Paradigm
for the Stateless Reader. Preprint. https://arxiv.org/abs/[TBD]
```

Contact: jcghiri@gmail.com · [linkedin.com/in/jghiringhelli](https://linkedin.com/in/jghiringhelli)
