# Branch Evidence — DX Experiment April 10 2026

Ground truth for condition assignment: presence of .claude/ directory (ForgeCraft pre-generated artifacts).
7 branches had condition mismatches between recorded assignment and artifact presence — all corrected here.

## Population Summary

| Classification | n | Notes |
|---|---|---|
| analyzable | 83 | Scored, has meaningful code/tests |
| submitted_incomplete | 4 | Scored but no tests and GS ≤ 3 (all taskflow). Included in intent-to-treat. |
| did_not_submit | 29 | Never pushed code. Excluded from scoring analysis. |

## Per-Branch Evidence

### VAQUITA

| ID | Real Cond | Recorded | Corrected? | Classification | GS/8 | V | B | A | Dup% | Branch | Cov% | TSC | Anomaly |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| P001 | A | A |  | did_not_submit | — | — | — | — | — | — | — | — | no_submission |
| P002 | B | B |  | analyzable | 7 | 2 | 2 | 2 | 7.3% | 73 | 95% | 0 |  |
| P003 | A | A |  | analyzable | 8 | 2 | 2 | 2 | 3.5% | 41 | 93% | 0 |  |
| P004 | B | B |  | analyzable | 7 | 2 | 1 | 2 | 0.6% | 81 | 96% | 0 |  |
| P005 | A | A |  | did_not_submit | — | — | — | — | — | — | — | — | no_submission |
| P006 | B | B |  | analyzable | 5 | 0 | 2 | 2 | 4.4% | 77 | — | 38 |  |
| P007 | A | A |  | analyzable | 8 | 2 | 2 | 2 | 5.8% | 52 | 91% | 0 |  |
| P008 | B | B |  | analyzable | 7 | 2 | 1 | 2 | 2.2% | 83 | 87% | 0 |  |
| P009 | A | A |  | analyzable | 8 | 2 | 2 | 2 | 2% | 41 | 74% | 0 |  |
| P010 | B | B |  | analyzable | 6 | 2 | 1 | 2 | 9.4% | 62 | 89% | 0 |  |
| P011 | A | A |  | analyzable | 8 | 2 | 2 | 2 | 5.9% | 103 | 84% | 0 |  |
| P012 | B | B |  | analyzable | 4 | 0 | 1 | 2 | 0.8% | 63 | 0% | 0 |  |
| P013 | A | A |  | analyzable | 8 | 2 | 2 | 2 | 9.3% | 71 | 88% | 0 |  |
| P014 | B | B |  | did_not_submit | — | — | — | — | — | — | — | — | no_submission |
| P015 | A | A |  | analyzable | 6 | 2 | 2 | 1 | 0% | 49 | 93% | 10 |  |
| P016 | B | B |  | analyzable | 8 | 2 | 2 | 2 | 4.5% | 70 | 86% | 0 |  |
| P017 | A | A |  | analyzable | 6 | 2 | 2 | 1 | 5.5% | 65 | 88% | 0 |  |
| P018 | B | B |  | analyzable | 7 | 2 | 2 | 2 | 4.2% | 53 | 96% | 0 |  |
| P019 | A | A |  | analyzable | 8 | 2 | 2 | 2 | 2.8% | 44 | 93% | 0 |  |
| P020 | B | B |  | analyzable | 8 | 2 | 2 | 2 | 2.8% | 61 | 96% | 0 |  |
| P021 | A | A |  | analyzable | 4 | 0 | 2 | 1 | 12.8% | 81 | — | 0 |  |
| P022 | B | B |  | analyzable | 8 | 2 | 2 | 2 | 0% | 61 | 91% | 0 |  |
| P023 | A | A |  | analyzable | 6 | 2 | 2 | 1 | 4.5% | 75 | 85% | 0 |  |
| P024 | B | B |  | analyzable | 6 | 2 | 1 | 2 | 2.6% | 117 | 81% | 0 |  |
| P025 | A | A |  | analyzable | 8 | 2 | 2 | 2 | 0% | 71 | 100% | 0 |  |
| P026 | B | B |  | analyzable | 8 | 2 | 2 | 2 | 4% | 115 | 91% | 0 |  |
| P027 | A | A |  | analyzable | 7 | 2 | 2 | 1 | 1.6% | 76 | 92% | 0 |  |
| P028 | B | B |  | analyzable | 7 | 2 | 2 | 2 | 1.4% | 42 | 94% | 0 |  |
| P029 | A | A |  | analyzable | 4 | 0 | 2 | 1 | 0% | 2 | 0% | 0 |  |
| P030 | B | B |  | analyzable | 8 | 2 | 2 | 2 | 0% | 49 | 94% | 0 |  |
| P031 | A | A |  | analyzable | 8 | 2 | 2 | 2 | 6% | 57 | 91% | 0 |  |
| P032 | B | B |  | analyzable | 8 | 2 | 2 | 2 | 5.5% | 97 | 73% | 0 |  |
| P033 | A | A |  | analyzable | 8 | 2 | 2 | 2 | 5.3% | 68 | 88% | 0 |  |
| P034 | B | B |  | analyzable | 8 | 2 | 2 | 2 | 7.3% | 47 | 90% | 0 |  |
| P035 | A | A |  | did_not_submit | — | — | — | — | — | — | — | — | no_submission |
| P036 | B | B |  | analyzable | 8 | 2 | 2 | 2 | 0.5% | 87 | 100% | 0 |  |
| P037 | A | A |  | analyzable | 6 | 2 | 2 | 1 | 18.3% | 58 | 92% | 0 |  |
| P038 | B | B |  | did_not_submit | — | — | — | — | — | — | — | — | no_submission |
| P039 | A | A |  | did_not_submit | — | — | — | — | — | — | — | — | no_submission |
| P040 | B | B |  | analyzable | 8 | 2 | 2 | 2 | 5.6% | 137 | 98% | 0 |  |
| P041 | A | A |  | analyzable | 4 | 0 | 2 | 1 | 9.2% | 76 | — | 10 |  |
| P042 | B | B |  | analyzable | 5 | 1 | 1 | 2 | 3.9% | 80 | 49% | 0 |  |
| P043 | A | A |  | analyzable | 8 | 2 | 2 | 2 | 7.4% | 52 | 91% | 0 |  |
| P044 | B | B |  | analyzable | 6 | 2 | 1 | 2 | 0% | 53 | 76% | 0 |  |
| P045 | A | A |  | analyzable | 8 | 2 | 2 | 2 | 1.4% | 42 | 97% | 0 |  |
| P046 | B | B |  | did_not_submit | — | — | — | — | — | — | — | — | no_submission |
| P047 | A | A |  | analyzable | 7 | 2 | 2 | 2 | 18.6% | 68 | 90% | 0 |  |
| P048 | B | B |  | analyzable | 8 | 2 | 2 | 2 | 3% | 68 | 92% | 0 |  |
| P049 | A | A |  | analyzable | 5 | 1 | 2 | 1 | 5.4% | 98 | 59% | 0 |  |
| P050 | B | B |  | analyzable | 5 | 2 | 0 | 2 | 2.3% | 113 | 92% | 0 |  |
| P051 | A | A |  | did_not_submit | — | — | — | — | — | — | — | — | no_submission |
| P052 | B | B |  | did_not_submit | — | — | — | — | — | — | — | — | no_submission |
| P053 | A | A |  | analyzable | 4 | 0 | 2 | 1 | — | 0 | — | 0 |  |
| P054 | B | B |  | analyzable | 6 | 2 | 1 | 2 | 2.7% | 65 | 96% | 0 |  |
| P055 | A | A |  | analyzable | 6 | 0 | 2 | 2 | 4.8% | 85 | — | 0 |  |
| P056 | B | B |  | did_not_submit | — | — | — | — | — | — | — | — | no_submission |
| P057 | A | A |  | analyzable | 4 | 0 | 2 | 1 | 2.2% | 77 | — | 0 |  |
| P058 | B | B |  | did_not_submit | — | — | — | — | — | — | — | — | no_submission |

### TASKFLOW

| ID | Real Cond | Recorded | Corrected? | Classification | GS/8 | V | B | A | Dup% | Branch | Cov% | TSC | Anomaly |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| P001 | B | B |  | analyzable | 5 | 0 | 2 | 2 | 0% | 18 | 0% | 0 |  |
| P002 | A | A |  | did_not_submit | — | — | — | — | — | — | — | — | no_submission |
| P003 | B | B |  | analyzable | 8 | 2 | 2 | 2 | 3.6% | 56 | 69% | 0 |  |
| P004 | A | A |  | analyzable | 8 | 2 | 2 | 2 | 0.6% | 41 | 86% | 0 |  |
| P005 | B | B |  | did_not_submit | — | — | — | — | — | — | — | — | no_submission |
| P006 | B | A | ✓ | analyzable | 5 | 2 | 0 | 2 | 3.9% | 18 | 91% | 0 | condition_mismatch_corrected_by_forgecraft_presence |
| P007 | B | B |  | analyzable | 8 | 2 | 2 | 2 | 3.2% | 48 | 61% | 0 |  |
| P008 | A | A |  | did_not_submit | — | — | — | — | — | — | — | — | no_submission |
| P009 | B | B |  | did_not_submit | — | — | — | — | — | — | — | — | no_submission |
| P010 | A | A |  | analyzable | 4 | 2 | 0 | 1 | 5.9% | 27 | 99% | 0 |  |
| P011 | B | B |  | analyzable | 6 | 1 | 1 | 2 | 6.3% | 29 | 42% | 0 |  |
| P012 | A | A |  | analyzable | 3 | 1 | 0 | 1 | 5.6% | 25 | 18% | 0 |  |
| P013 | B | B |  | analyzable | 7 | 1 | 2 | 2 | 0.7% | 79 | 54% | 0 |  |
| P014 | A | A |  | did_not_submit | — | — | — | — | — | — | — | — | no_submission |
| P015 | B | B |  | did_not_submit | — | — | — | — | — | — | — | — | no_submission |
| P016 | A | A |  | analyzable | 8 | 2 | 2 | 2 | 4% | 22 | 91% | 0 |  |
| P017 | B | B |  | analyzable | 3 | 0 | 0 | 2 | 14.2% | 23 | — | 74 |  |
| P018 | A | A |  | did_not_submit | — | — | — | — | — | — | — | — | no_submission |
| P019 | B | B |  | analyzable | 7 | 1 | 2 | 2 | 16.7% | 25 | — | 1 |  |
| P020 | B | A | ✓ | analyzable | 4 | 1 | 0 | 2 | 6.6% | 28 | 21% | 0 | condition_mismatch_corrected_by_forgecraft_presence |
| P021 | B | B |  | did_not_submit | — | — | — | — | — | — | — | — | no_submission |
| P022 | A | A |  | analyzable | 4 | 0 | 0 | 2 | 8% | 39 | — | 3 |  |
| P023 | B | B |  | did_not_submit | — | — | — | — | — | — | — | — | no_submission |
| P024 | A | A |  | submitted_incomplete | 2 | 0 | 0 | 1 | 5.7% | 26 | 0% | 0 | submitted_no_tests_gs_le_3 |
| P025 | B | B |  | analyzable | 8 | 2 | 2 | 2 | 0% | 12 | 100% | 0 |  |
| P026 | A | A |  | analyzable | 6 | 2 | 1 | 1 | 1.8% | 29 | 89% | 0 |  |
| P027 | B | B |  | analyzable | 4 | 1 | 0 | 2 | 1.2% | 34 | 42% | 0 |  |
| P028 | A | A |  | analyzable | 3 | 1 | 0 | 1 | 0.9% | 19 | 43% | 0 |  |
| P029 | B | B |  | analyzable | 6 | 0 | 2 | 2 | 2.9% | 54 | — | 0 |  |
| P030 | A | A |  | analyzable | 6 | 2 | 0 | 2 | 4.6% | 26 | 90% | 0 |  |
| P031 | A | B | ✓ | analyzable | 8 | 2 | 2 | 2 | 9.5% | 18 | 79% | 0 | condition_mismatch_corrected_by_forgecraft_presence |
| P032 | A | A |  | analyzable | 8 | 2 | 2 | 2 | 7% | 37 | 89% | 0 |  |
| P033 | B | B |  | analyzable | 8 | 2 | 2 | 2 | 1.1% | 43 | 94% | 0 |  |
| P034 | A | A |  | analyzable | 7 | 1 | 2 | 2 | 6.8% | 20 | 31% | 2 |  |
| P035 | B | B |  | analyzable | 7 | 1 | 2 | 2 | 2.5% | 39 | 33% | 0 |  |
| P036 | A | A |  | analyzable | 8 | 2 | 2 | 2 | 6.9% | 16 | 90% | 0 |  |
| P037 | A | B | ✓ | analyzable | 2 | 0 | 0 | — | — | — | — | — | condition_mismatch_corrected_by_forgecraft_presence |
| P038 | A | A |  | did_not_submit | — | — | — | — | — | — | — | — | no_submission |
| P039 | B | B |  | did_not_submit | — | — | — | — | — | — | — | — | no_submission |
| P040 | A | A |  | analyzable | 3 | 1 | 0 | 1 | 5% | 27 | 19% | 0 |  |
| P041 | B | B |  | did_not_submit | — | — | — | — | — | — | — | — | no_submission |
| P042 | A | A |  | analyzable | 5 | 0 | 2 | 1 | 10.8% | 28 | — | 0 |  |
| P043 | B | B |  | did_not_submit | — | — | — | — | — | — | — | — | no_submission |
| P044 | A | A |  | analyzable | 7 | 1 | 2 | 2 | 1.8% | 42 | 31% | 0 |  |
| P045 | A | B | ✓ | analyzable | 8 | 2 | 2 | 2 | 0% | 30 | 94% | 0 | condition_mismatch_corrected_by_forgecraft_presence |
| P046 | A | A |  | submitted_incomplete | 2 | 0 | 0 | 1 | 7.4% | 17 | 0% | 0 | submitted_no_tests_gs_le_3 |
| P047 | B | B |  | did_not_submit | — | — | — | — | — | — | — | — | no_submission |
| P048 | A | A |  | analyzable | 6 | 0 | 2 | 2 | 1.2% | 25 | — | 0 |  |
| P049 | B | B |  | analyzable | 4 | 0 | 0 | 2 | 3.5% | 45 | — | 0 |  |
| P050 | A | A |  | analyzable | 3 | 1 | 0 | 1 | 5.7% | 26 | 15% | 0 |  |
| P051 | B | B |  | did_not_submit | — | — | — | — | — | — | — | — | no_submission |
| P052 | A | A |  | did_not_submit | — | — | — | — | — | — | — | — | no_submission |
| P053 | B | B |  | did_not_submit | — | — | — | — | — | — | — | — | no_submission |
| P054 | A | A |  | analyzable | 3 | 1 | 0 | 1 | 9% | 49 | 54% | 0 |  |
| P055 | B | B |  | did_not_submit | — | — | — | — | — | — | — | — | no_submission |
| P056 | B | A | ✓ | submitted_incomplete | 3 | 0 | 0 | 2 | 7.4% | 17 | 0% | 0 | condition_mismatch_corrected_by_forgecraft_presence |
| P057 | B | B |  | submitted_incomplete | 3 | 0 | 0 | 2 | 1.2% | 22 | 0% | 0 | submitted_no_tests_gs_le_3 |
| P058 | B | A | ✓ | analyzable | 4 | 1 | 0 | 2 | 8.8% | 31 | 21% | 0 | condition_mismatch_corrected_by_forgecraft_presence |

## Corrected Score Summary (Analyzable Only)

| Project | Cond | n | GS/8 | Verifiable | Bounded | Auditable | Dup% | BranchCount | Coverage% | TSC errors |
|---|---|---|---|---|---|---|---|---|---|---|
| vaquita | A | 24 | 6.54 | 1.46 | 2 | 1.54 | 5.75% | 60.5 | 83.66% | 0.83 |
| vaquita | B | 23 | 6.87 | 1.78 | 1.57 | 2 | 3.27% | 76.26 | 84.77% | 1.65 |
| taskflow | A | 20 | 5.5 | 1.25 | 1.05 | 1.58 | 5.02% | 28.74 | 63.69% | 0.26 |
| taskflow | B | 16 | 5.88 | 1.06 | 1.19 | 2 | 4.69% | 36.38 | 52.3% | 4.69 |

