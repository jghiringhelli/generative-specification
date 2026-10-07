// quick ledger cli - JC 2019
var args = process.argv.slice(2);
var cmd = args[0];
var nums = args.slice(1).map(Number);

if (cmd == '--version') {
  console.log('ledger 0.1');
  process.exit(0);
}

function bad(a) {
  for (var i = 0; i < a.length; i++) if (!Number.isInteger(a[i])) return true;
  return false;
}

if (cmd == 'balance') {
  if (bad(nums)) { console.error('error: entries must be integers'); process.exit(1); }
  var s = 0;
  for (var i = 0; i < nums.length; i++) s += nums[i];
  console.log(s);
} else if (cmd == 'largest-debit') {
  if (bad(nums)) { console.error('error: entries must be integers'); process.exit(1); }
  var w = 0;
  for (var i = 0; i < nums.length; i++) if (nums[i] < 0 && -nums[i] > w) w = -nums[i];
  console.log(w);
} else {
  console.error('usage: ledger.js balance|largest-debit <integers...>');
  process.exit(2);
}
