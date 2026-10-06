'use strict';
// @gs AC-001 docs/spec/SPEC.md#acceptance-criteria
const test = require('node:test');
const assert = require('node:assert');
const { balance, largestDebit } = require('../src/ledger');

test('AC-001 balance of 3, -1, 4 is 6', () => { assert.strictEqual(balance([3, -1, 4]), 6); });
test('AC-002 balance of an empty list is 0', () => { assert.strictEqual(balance([]), 0); });
test('AC-003 a non-integer entry throws TypeError', () => { assert.throws(() => balance([1.5]), TypeError); });
test('AC-004 largest debit of 3, -1, -5 is 5', () => { assert.strictEqual(largestDebit([3, -1, -5]), 5); });
test('AC-005 largest debit without debits is 0', () => { assert.strictEqual(largestDebit([1, 2]), 0); });
test('AC-001 balance is order independent', () => { assert.strictEqual(balance([4, 3, -1]), 6); });
