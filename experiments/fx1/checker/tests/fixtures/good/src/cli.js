'use strict';
const { balance } = require('./ledger');
const nums = process.argv.slice(2).map(Number);
console.log(balance(nums));
