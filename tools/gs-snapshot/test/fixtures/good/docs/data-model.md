# Data model

Derived from docs/spec/SPEC.md (REQ-001, REQ-002).

## Entry

- An entry is a JavaScript number that must satisfy `Number.isInteger`.
- A positive entry is a credit and a negative entry is a debit.

## Ledger

- A ledger is an array of entries with no persistence.
- The balance is the sum of the entries.
- The largest debit is the absolute value of the most negative entry, or 0.
