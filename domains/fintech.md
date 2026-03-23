---
layout: default
title: Fintech & Optimization
parent: Domain Guides
nav_order: 1
description: "GS methodology for financial systems, trading algorithms, and optimization problems"
---

# GS for Fintech & Optimization

## Why This Domain Is Different

Financial systems have two quality dimensions that most software does not: **statistical correctness** (the algorithm behaves correctly across the distribution of inputs, not just the happy path) and **regulatory auditability** (every decision must be traceable to its inputs with an immutable record).

A system that passes all unit tests can still have look-ahead bias in a backtesting harness, or accumulate floating-point rounding errors that compound over thousands of trades. These are not bugs caught by structural testing — they require domain-specific verification strategies.

## Relevant Tag

`FINTECH` — add to `forgecraft.yaml` tags to activate fintech-specific gates and guidance.

## Active Quality Gates

Gates from the universal library that apply with high priority to FINTECH projects:

| Gate | Why it matters here |
|---|---|
| [npm-audit-no-high-cve](../quality-gates/gates/npm-audit-no-high-cve.yaml) | Financial data libraries are high-value CVE targets |
| [no-hardcoded-secrets](../quality-gates/gates/no-hardcoded-secrets.yaml) | API keys for market data, exchange connections |
| [environment-variables-config](../quality-gates/gates/environment-variables-config.yaml) | Exchange endpoints, risk thresholds, fee structures |
| [adr-files-emitted](../quality-gates/gates/adr-files-emitted.yaml) | Regulatory bodies require documented decision rationale |
| [conventional-commits](../quality-gates/gates/conventional-commits.yaml) | Audit trail requires traceable change history |

### Domain-Specific Gates Needed (Contribution Targets)

| Gate ID (proposed) | GS Property | Description |
|---|---|---|
| `no-float-arithmetic-for-money` | Bounded | No `+`, `-`, `*`, `/` on `number` for monetary values — use decimal library |
| `backtesting-no-lookahead` | Verifiable | Backtesting harness must not access data beyond the simulation date |
| `audit-log-immutable` | Auditable | Trade/decision log must be append-only with no delete or update path |
| `deterministic-given-seed` | Verifiable | Given the same random seed, the algorithm produces the same result |
| `position-invariant` | Verifiable | Property-based: `position + buy(n) - sell(n)` is always non-negative |

## Verification Strategy

| What to verify | How |
|---|---|
| Algorithm correctness | Backtesting against historical data with known outcomes |
| Statistical properties | Property-based tests (fast-check / Hypothesis) for pure functions |
| Precision | Decimal library usage enforced by gate; snapshot tests on monetary arithmetic |
| Audit trail | Integration test: execute a trade sequence, replay the log, verify reproducibility |
| Performance | Latency budget for order execution path (P99 < threshold) |

## Spec Patterns

A GS PRD for a FINTECH project must include:

1. **Risk parameters** — maximum drawdown, position limits, stop-loss thresholds as named constants
2. **Regulatory constraints** — which jurisdiction, which reporting requirements
3. **Precision specification** — which monetary operations use decimal and why
4. **Data contracts** — exact schema of market data inputs including timezone, adjustment policy
5. **Audit requirements** — what must be logged, retention period, immutability guarantee

The AI cannot infer these from context. If they are absent from the PRD, it will use plausible defaults that may be wrong.

## Contribute a Gate

Most underrepresented GS property for FINTECH: **Verifiable** (statistical correctness is under-gated).

See [CONTRIBUTING.md](../quality-gates/CONTRIBUTING.md).
