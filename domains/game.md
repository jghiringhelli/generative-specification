---
layout: default
title: Game Development
parent: Domain Guides
nav_order: 3
description: "GS methodology for game engines, real-time systems, and interactive applications"
---

# GS for Game Development

## Why This Domain Is Different

Games have hard **frame budget constraints** and **emergent behavior** from physics and AI systems. A game that runs at 30fps in development may drop to 12fps with more entities on screen. Save/load corruption is a catastrophic failure mode with no equivalent in web services. Player-facing behavior must be deterministic enough to reproduce bugs.

## Relevant Tag

`GAME` — activates game-specific gates and verification strategies.

## Active Quality Gates

| Gate | Why it matters here |
|---|---|
| [no-circular-dependencies](../quality-gates/gates/no-circular-dependencies.yaml) | Circular deps in game systems cause initialization-order crashes |
| [no-hardcoded-secrets](../quality-gates/gates/no-hardcoded-secrets.yaml) | API keys for analytics, leaderboards, cloud saves |
| [environment-variables-config](../quality-gates/gates/environment-variables-config.yaml) | Frame budget thresholds, physics substep counts, draw call limits |

### Domain-Specific Gates Needed (Contribution Targets)

| Gate ID (proposed) | GS Property | Description |
|---|---|---|
| `frame-budget-profiling` | Verifiable | P95 frame time under benchmark scene must be below spec budget |
| `save-load-roundtrip` | Verifiable | `save(state)` then `load()` must produce a state equal to original |
| `no-physics-in-render-loop` | Bounded | Physics updates must not be called from the render/draw path |
| `audio-budget` | Verifiable | Simultaneous audio source count must not exceed hardware limit |
| `deterministic-replay` | Verifiable | Given the same input sequence and seed, the simulation produces identical output |

## Verification Strategy

| What to verify | How |
|---|---|
| Frame performance | Automated benchmark scene: record P50/P95/P99 frame time |
| Save/load integrity | Property test: save any valid game state, reload, assert equality |
| Memory | Peak memory profiling under maximum-entity load scenario |
| Physics correctness | Property tests on pure physics functions (collision detection, resolution) |
| AI behavior | Determinism test: replay recorded input, assert same entity positions |

## Spec Patterns

A GS PRD for a game must include:

1. **Performance budget** — target platform, frame budget in ms, memory ceiling
2. **Entity capacity** — maximum concurrent entities the simulation must support
3. **Save format contract** — schema version, migration policy for format changes
4. **Physics parameters** — substep count, gravity constant, collision layers
5. **Determinism requirements** — which systems must be seeded and reproducible

## Contribute a Gate

Most underrepresented GS properties for GAME: **Verifiable** (performance) and **Executable** (automated playback).

See [CONTRIBUTING.md](../quality-gates/CONTRIBUTING.md).
