# KX Results — Harness-as-Knowledge-Retrieval (CKG-benchmark replication)

Token-level F1 (SQuAD-style) and RDS = F1/tokens, per Yarmoluk & McCreary.
Tokens = input + output + cache_creation + cache_read per query session.

## Macro (all query types)

| Condition | n | Macro F1 | Tokens/q | RDS | RDS ratio | Cost/q | Turns/q | Errors |
|---|---|---|---|---|---|---|---|---|
| monolith | 45 | 0.6106 | 100,237 | 6.09e-6 | 0.59× | $0.5606 | 1.0 | 0 |
| cnt | 45 | 0.8080 | 78,603 | 1.03e-5 | 1.00× | $0.1017 | 2.8 | 0 |
| bare | 45 | 0.4310 | 233,583 | 1.85e-6 | 0.18× | $0.2432 | 8.7 | 0 |

## F1 by query type

| Condition | T1 entity | T2 obligation | T3 path | T4 aggregate | T5 cross-link |
|---|---|---|---|---|---|
| monolith | 0.833 | 0.607 | 0.458 | 0.909 | 0.135 |
| cnt | 0.813 | 0.672 | 0.642 | 0.909 | 1.000 |
| bare | 0.875 | 0.040 | 0.544 | 0.006 | 0.946 |

## Tokens/query by type

| Condition | T1 | T2 | T3 | T4 | T5 |
|---|---|---|---|---|---|
| monolith | 100,804 | 100,838 | 100,873 | 98,258 | 101,002 |
| cnt | 78,936 | 27,673 | 142,511 | 92,229 | 59,287 |
| bare | 62,649 | 492,445 | 105,995 | 294,462 | 124,818 |
