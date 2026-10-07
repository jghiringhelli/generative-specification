'use strict';
const { balance, largestDebit } = require('./ledger');
const [cmd, ...rest] = process.argv.slice(2);
const nums = rest.map(Number);
if (cmd === 'balance' || cmd === 'largest-debit') {
  if (!nums.every(Number.isInteger)) {
    console.error('error: entries must be integers');
    process.exit(1);
  }
  console.log(cmd === 'balance' ? balance(nums) : largestDebit(nums));
} else {
  console.error('usage: ledger.js balance|largest-debit <integers...>');
  process.exit(2);
}
