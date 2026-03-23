---
layout: default
title: Machine Learning
parent: Domain Guides
nav_order: 2
description: "GS methodology for ML systems, model training pipelines, and AI-powered applications"
---

# GS for Machine Learning

## Why This Domain Is Different

ML systems have **non-deterministic outputs** and **data-dependent correctness**. A model that scores 94% accuracy in development may score 71% on production data because of distribution shift, data leakage, or an incorrect train/test split. These are not caught by structural code testing.

The quality question for ML is not "does the code run" — it is "does the model generalize."

## Relevant Tag

`ML` — activates ML-specific gates, verification strategies, and guidance.

## Active Quality Gates

| Gate | Why it matters here |
|---|---|
| [coverage-threshold-80](../quality-gates/gates/coverage-threshold-80.yaml) | Pipeline logic (preprocessing, feature engineering) is testable |
| [no-hardcoded-secrets](../quality-gates/gates/no-hardcoded-secrets.yaml) | Model registry credentials, data warehouse keys |
| [environment-variables-config](../quality-gates/gates/environment-variables-config.yaml) | Model endpoints, evaluation thresholds, feature toggles |
| [conventional-commits](../quality-gates/gates/conventional-commits.yaml) | Model versioning requires traceable experiment history |

### Domain-Specific Gates Needed (Contribution Targets)

| Gate ID (proposed) | GS Property | Description |
|---|---|---|
| `model-evaluation-threshold` | Verifiable | Held-out test set F1/accuracy/AUC must exceed spec threshold before merge |
| `no-test-data-in-training` | Defended | Test split indices must not overlap with training indices |
| `dataset-version-pinned` | Auditable | Training dataset must be referenced by commit SHA or versioned artifact ID |
| `model-versioned` | Auditable | Every model artifact is tagged with the code commit that produced it |
| `no-pickle-untrusted-input` | Defended | No `pickle.load` on user-supplied or network-sourced data |

## Verification Strategy

| What to verify | How |
|---|---|
| Model performance | Holdout test set (never seen during training) — metrics against spec thresholds |
| Data integrity | Assert no row overlap between train/val/test splits |
| Reproducibility | Given pinned dataset + seed, training produces the same metric ± epsilon |
| Distribution shift | Canary evaluation on a sample of production data before full rollout |
| Feature pipeline | Unit tests on pure transformation functions; property tests on invariants |

## Spec Patterns

A GS PRD for an ML project must include:

1. **Evaluation metrics** — which metrics, at what thresholds, on which dataset splits
2. **Dataset description** — source, version, size, class distribution, known biases
3. **Acceptable drift thresholds** — when does production performance trigger a retrain
4. **Feature contract** — schema of input features, types, expected ranges, null policy
5. **Model explainability requirements** — is a black-box acceptable, or is interpretability required

## Contribute a Gate

Most underrepresented GS property for ML: **Verifiable** (model evaluation is almost entirely ungated in the current library).

See [CONTRIBUTING.md](../quality-gates/CONTRIBUTING.md).
