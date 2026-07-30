---
nav_exclude: true
---

# Reviewing the White Paper

The white paper source is in this directory. Community review is open.

---

## What You Can Do

**Challenge a claim** — Open a GitHub issue titled `[§X.Y] Claim: <short description>`. Describe the claim, your challenge, and evidence or reasoning. The author will respond.

**Propose a factual correction** — Missing citation, incorrect date, miscounted metric, broken reference. Open a PR with the fix. Maintainer reviews and merges.

**Attempt replication** — Clone the repository, run the Rx experiment (see root README), compare your results to the committed evidence. Open an issue if your results differ.

**Dispute the methodology** — Describe your objection in a GitHub issue mapped to the relevant section (§S3, §S10 in the supplement for experimental methodology). The author engages in the issue thread.

---

## What You Cannot Do

Merge substantive changes to the paper's argument without author review. The paper's claims are the author's claims. Community PRs are for factual corrections only. The author retains editorial control.

---

## Section Map (for opening issues)

| Section | Topic |
|---|---|
| §1 | Chomsky/Backus parallel; drift framing |
| §2 | Abstraction ladder |
| §3 | Context-sensitive gap; prosody analogy |
| §4.1 | GS mechanism; economic consequence |
| §4.2 | Paradigm taxonomy |
| §4.3 | Seven properties: Self-describing, Bounded, Verifiable, Defended, Auditable, Composable, Executable |
| §5 | Related work: Gordon (2024), Thirolf (2025), SlopCodeBench (Orlanski et al., arXiv:2603.24755, 2026) |
| §6 | Artifact grammar; ForgeCraft; CodeSeeker |
| §7 | Case studies; adversarial experiment (AX); replication (RX) |
| §8 | Implications |
| §9 | Discussion; I(S) formula |
| §10 | Conclusion; community convergence theorem |
| §11 | Onwards — Therac-25; irreducible value of the expert; obligation at critical domains |
| Supplement §S1–§S14 | Experiment pre-registration, conditions, rubric, results, audit transcripts |

---

## Pre-registration Verification

The supplement (§S1) documents the pre-registration commits. To verify that the rubric and design were committed before any experimental run:

```bash
git log --oneline --all -- experiments/ax/
```

The commit timestamps are the evidence. Clone this repository and inspect them directly.
