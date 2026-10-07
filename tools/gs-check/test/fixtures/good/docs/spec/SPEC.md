# Ledger library specification

Source of truth for behaviour. Decisions are recorded in docs/decisions/.

## Requirements

- REQ-001 The library computes the balance of a list of signed integer entries.
- REQ-002 The library rejects entries that are not integers.
- REQ-003 The library reports the largest single debit.

## Acceptance criteria

- [ ] AC-001 The balance of the entries 3, -1 and 4 is 6 (REQ-001).
- [ ] AC-002 The balance of an empty list is 0 (REQ-001).
- [ ] AC-003 A non-integer entry makes the balance function throw a TypeError (REQ-002).
- [ ] AC-004 The largest debit of the entries 3, -1 and -5 is 5 (REQ-003).
- [ ] AC-005 The largest debit of a list without any debit is 0 (REQ-003).

## Open questions

None.

## Decisions

See docs/decisions/0001-use-node-test-runner.md.
