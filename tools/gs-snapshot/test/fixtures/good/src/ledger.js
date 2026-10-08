'use strict';
// @gs AC-001 docs/spec/SPEC.md#acceptance-criteria
function balance(entries) {
  let sum = 0;
  for (const e of entries) {
    if (!Number.isInteger(e)) throw new TypeError('entries must be integers');
    sum += e;
  }
  return sum;
}

// @gs AC-004 docs/spec/SPEC.md#acceptance-criteria
function largestDebit(entries) {
  let worst = 0;
  for (const e of entries) if (e < 0 && -e > worst) worst = -e;
  return worst;
}

module.exports = { balance, largestDebit };
