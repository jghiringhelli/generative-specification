# @gs AC-001 docs/spec/SPEC.md#acceptance-criteria
def balance(entries):
    total = 0
    for e in entries:
        if isinstance(e, bool) or not isinstance(e, int):
            raise TypeError("entries must be integers")
        total += e
    return total


# @gs AC-004 docs/spec/SPEC.md#acceptance-criteria
def largest_debit(entries):
    worst = 0
    for e in entries:
        if e < 0 and -e > worst:
            worst = -e
    return worst
