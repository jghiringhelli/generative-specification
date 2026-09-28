// Revival problem set — authored oracles + input batteries + invariants. THE GENERATOR NEVER SEES THIS FILE.
// Each problem: { id, tier, signature, spec, oracle, genInput, edgeCases, invariants }.
//   tier: T0 trivial | T1 moderate | T2 hard | T3 edge-dense  (fixed per pre-registration §C1)
//   oracle: ground truth, deliberately simple + independently reviewable.
//   invariants: [{name, check(argsArray, output)->bool}] — properties true for any valid input,
//     checkable WITHOUT the oracle. Used by practice P3 (property-based/formal spec).
// Run `node selftest.cjs` to confirm every oracle runs and its invariants hold on oracle output.

// --- deterministic PRNG (mulberry32) so batteries are reproducible ---
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const ri = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1)); // inclusive int
const rstr = (r, lo, hi, a = 97, b = 122) => { let n = ri(r, lo, hi), s = ''; for (let i = 0; i < n; i++) s += String.fromCharCode(ri(r, a, b)); return s; };

// ---------- helpers for the date problem ----------
const DAY = 86400000;
function isBusiness(ms, holidaySet) {
  const d = new Date(ms);
  const wd = d.getUTCDay();               // 0=Sun 6=Sat
  if (wd === 0 || wd === 6) return false;
  return !holidaySet.has(iso(ms));
}
function iso(ms) { return new Date(ms).toISOString().slice(0, 10); }
function toMs(s) { return Date.parse(s + 'T00:00:00Z'); }

// ---------- invariant helpers ----------
const isInt = (x) => Number.isInteger(x);
const sorted = (a) => a.every((x, i) => i === 0 || a[i - 1] <= x);
const unique = (a) => new Set(a).size === a.length;

const PROBLEMS = [
  // ================================ T0 — TRIVIAL (control: predicted STILL-DEAD) ================================
  {
    id: 'sum-array', tier: 'T0', signature: 'sumArray(nums)',
    spec:
`Write a CommonJS module (module.exports = a function) implementing sumArray(nums): return the sum
of an array of integers (0 for empty). Export exactly: module.exports = sumArray; code only.`,
    oracle(nums) { return nums.reduce((a, b) => a + b, 0); },
    genInput(r) { const n = ri(r, 0, 8); return [Array.from({ length: n }, () => ri(r, -50, 50))]; },
    edgeCases: [[[]], [[5]], [[-1, 1]], [[1, 2, 3, 4]]],
    invariants: [
      { name: 'number', check: (_a, o) => typeof o === 'number' && Number.isFinite(o) },
      { name: 'empty-is-zero', check: (a, o) => a[0].length !== 0 || o === 0 },
    ],
  },
  {
    id: 'reverse-string', tier: 'T0', signature: 'reverseString(s)',
    spec:
`Write a CommonJS module (module.exports = a function) implementing reverseString(s): return the
string reversed. Export exactly: module.exports = reverseString; code only.`,
    oracle(s) { return s.split('').reverse().join(''); },
    genInput(r) { return [rstr(r, 0, 10)]; },
    edgeCases: [[''], ['a'], ['ab'], ['racecar']],
    invariants: [
      { name: 'same-length', check: (a, o) => typeof o === 'string' && o.length === a[0].length },
      { name: 'involution', check: (a, o) => o.split('').reverse().join('') === a[0] },
    ],
  },
  {
    id: 'max-array', tier: 'T0', signature: 'maxArray(nums)',
    spec:
`Write a CommonJS module (module.exports = a function) implementing maxArray(nums): return the
maximum integer in the array, or null if the array is empty. Export exactly: module.exports = maxArray; code only.`,
    oracle(nums) { return nums.length ? Math.max(...nums) : null; },
    genInput(r) { const n = ri(r, 0, 8); return [Array.from({ length: n }, () => ri(r, -50, 50))]; },
    edgeCases: [[[]], [[5]], [[-3, -1]], [[2, 2, 2]], [[-10, 0, 10]]],
    invariants: [
      { name: 'empty-null', check: (a, o) => a[0].length !== 0 || o === null },
      { name: 'is-member-and-max', check: (a, o) => a[0].length === 0 || (a[0].includes(o) && a[0].every(x => x <= o)) },
    ],
  },
  {
    id: 'count-vowels', tier: 'T0', signature: 'countVowels(s)',
    spec:
`Write a CommonJS module (module.exports = a function) implementing countVowels(s): return the count
of vowels (a, e, i, o, u — case-insensitive) in the string. Export exactly: module.exports = countVowels; code only.`,
    oracle(s) { return (s.match(/[aeiou]/gi) || []).length; },
    genInput(r) { return [rstr(r, 0, 12)]; },
    edgeCases: [[''], ['xyz'], ['aeiou'], ['AEIOU'], ['Hello World']],
    invariants: [
      { name: 'in-range', check: (a, o) => isInt(o) && o >= 0 && o <= a[0].length },
    ],
  },

  // ================================ T1 — MODERATE ================================
  {
    id: 'money-split', tier: 'T1', signature: 'splitCents(totalCents, parts)',
    spec:
`Write a CommonJS module (module.exports = a function) implementing:

  splitCents(totalCents, parts)

- totalCents: a non-negative integer number of cents. parts: a positive integer.
- Split totalCents into exactly \`parts\` INTEGER amounts that SUM EXACTLY to totalCents.
- Make them as even as possible: every amount is either floor(total/parts) or that +1.
- The larger amounts come FIRST: exactly (totalCents mod parts) of the amounts are the +1 ones,
  and they are the first ones in the returned array.
- Return an array of \`parts\` integers.

Export exactly: module.exports = splitCents;  Output only the code, no prose.`,
    oracle(total, parts) {
      const base = Math.floor(total / parts), rem = total % parts;
      return Array.from({ length: parts }, (_, i) => base + (i < rem ? 1 : 0));
    },
    genInput(r) { return [ri(r, 0, 100000), ri(r, 1, 12)]; },
    edgeCases: [[100, 3], [0, 1], [5, 10], [10, 10], [1, 1], [7, 2], [0, 5], [99, 4]],
    invariants: [
      { name: 'count', check: (a, o) => Array.isArray(o) && o.length === a[1] },
      { name: 'sum-exact', check: (a, o) => o.reduce((x, y) => x + y, 0) === a[0] },
      { name: 'even-spread', check: (_a, o) => Math.max(...o) - Math.min(...o) <= 1 },
      { name: 'non-increasing', check: (_a, o) => o.every((x, i) => i === 0 || o[i - 1] >= x) },
    ],
  },
  {
    id: 'rle', tier: 'T1', signature: 'rle(s)',
    spec:
`Write a CommonJS module (module.exports = a function) implementing rle(s): run-length encode a
string. Each maximal run of the same character becomes that character followed by the run length
(the length is ALWAYS written, even when it is 1). Example: "aaabbc" -> "a3b2c1". "" -> "".
Export exactly: module.exports = rle;  Output only the code, no prose.`,
    oracle(s) {
      let out = '';
      for (let i = 0; i < s.length;) { let j = i; while (j < s.length && s[j] === s[i]) j++; out += s[i] + (j - i); i = j; }
      return out;
    },
    genInput(r) { let n = ri(r, 0, 10), s = ''; for (let i = 0; i < n; i++) s += String.fromCharCode(ri(r, 97, 99)); return [s]; },
    edgeCases: [[''], ['a'], ['aaa'], ['abc'], ['aabbbc'], ['aaaaaaaaaa']],
    invariants: [
      { name: 'counts-sum-to-length', check: (a, o) => { const nums = (o.match(/\d+/g) || []).map(Number); return nums.reduce((x, y) => x + y, 0) === a[0].length; } },
      { name: 'empty-maps-empty', check: (a, o) => a[0].length !== 0 || o === '' },
    ],
  },
  {
    id: 'palindrome-clean', tier: 'T1', signature: 'isPalindrome(s)',
    spec:
`Write a CommonJS module (module.exports = a function) implementing isPalindrome(s): return true if
the string is a palindrome IGNORING all non-alphanumeric characters and IGNORING case, else false.
Example: "A man, a plan, a canal: Panama" -> true. "" -> true.
Export exactly: module.exports = isPalindrome;  Output only the code, no prose.`,
    oracle(s) { const c = s.toLowerCase().replace(/[^a-z0-9]/g, ''); return c === c.split('').reverse().join(''); },
    genInput(r) { return [rstr(r, 0, 10, 97, 99)]; }, // small alphabet -> some palindromes
    edgeCases: [[''], ['a'], ['ab'], ['Aa'], ['12321'], ['A man, a plan, a canal: Panama'], ['Not!']],
    invariants: [
      { name: 'boolean', check: (_a, o) => typeof o === 'boolean' },
    ],
  },
  {
    id: 'chunk-array', tier: 'T1', signature: 'chunk(arr, size)',
    spec:
`Write a CommonJS module (module.exports = a function) implementing chunk(arr, size): split arr into
consecutive sub-arrays of length \`size\` (size >= 1). The LAST chunk may be shorter if arr does not
divide evenly. "chunk([1,2,3,4,5], 2)" -> [[1,2],[3,4],[5]]. "chunk([], 3)" -> [].
Export exactly: module.exports = chunk;  Output only the code, no prose.`,
    oracle(arr, size) { const out = []; for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size)); return out; },
    genInput(r) { const n = ri(r, 0, 10); return [Array.from({ length: n }, () => ri(r, 0, 9)), ri(r, 1, 4)]; },
    edgeCases: [[[1, 2, 3, 4, 5], 2], [[], 3], [[1], 1], [[1, 2, 3], 5], [[1, 2, 3, 4], 2]],
    invariants: [
      { name: 'flatten-equals-input', check: (a, o) => JSON.stringify([].concat(...o)) === JSON.stringify(a[0]) },
      { name: 'chunk-sizes', check: (a, o) => o.every((c, i) => c.length === a[1] || (i === o.length - 1 && c.length <= a[1] && c.length > 0)) },
    ],
  },

  // ================================ T2 — HARD ================================
  {
    id: 'merge-intervals', tier: 'T2', signature: 'mergeIntervals(intervals)',
    spec:
`Write a CommonJS module (module.exports = a function) implementing:

  mergeIntervals(intervals)

- intervals: an array of [start, end] pairs of integers with start <= end. May be unsorted.
- Merge intervals that OVERLAP **or merely TOUCH**: [1,3] and [3,5] must merge into [1,5]
  (touching endpoints merge). [1,3] and [4,5] do NOT merge.
- Return the merged, disjoint intervals sorted ascending by start, as an array of [start,end].
- Do not mutate the input.

Export exactly: module.exports = mergeIntervals;  Output only the code, no prose.`,
    oracle(intervals) {
      const a = intervals.map(x => x.slice()).sort((p, q) => p[0] - q[0] || p[1] - q[1]);
      const out = [];
      for (const [s, e] of a) {
        if (out.length && s <= out[out.length - 1][1]) out[out.length - 1][1] = Math.max(out[out.length - 1][1], e);
        else out.push([s, e]);
      }
      return out;
    },
    genInput(r) { const n = ri(r, 0, 6), arr = []; for (let i = 0; i < n; i++) { const s = ri(r, 0, 20); arr.push([s, s + ri(r, 0, 6)]); } return [arr]; },
    edgeCases: [[[]], [[[1, 3], [3, 5]]], [[[1, 3], [4, 5]]], [[[5, 6], [1, 2], [2, 2]]], [[[1, 10], [2, 3], [4, 5]]], [[[1, 1]]], [[[2, 3], [1, 5]]]],
    invariants: [
      { name: 'sorted-by-start', check: (_a, o) => o.every((x, i) => i === 0 || o[i - 1][0] <= x[0]) },
      { name: 'well-formed', check: (_a, o) => o.every(([s, e]) => s <= e) },
      { name: 'disjoint-not-touching', check: (_a, o) => o.every((x, i) => i === 0 || o[i - 1][1] < x[0]) },
    ],
  },
  {
    id: 'reschedule-conflict', tier: 'T2', signature: 'hasConflict(existing, candidate, selfId)',
    spec:
`Write a CommonJS module (module.exports = a function) implementing:

  hasConflict(existing, candidate, selfId)

- existing: array of { id, start, end } integer intervals (start < end), half-open [start, end).
- candidate: { start, end } the new position for the move being rescheduled.
- selfId: the id of the move being rescheduled — it MUST be excluded from the check.
- Return true if candidate OVERLAPS any existing interval whose id !== selfId, else false.
- Overlap is half-open: [a,b) overlaps [c,d) iff a < d AND c < b. Touching endpoints do NOT overlap.

Export exactly: module.exports = hasConflict;  Output only the code, no prose.`,
    oracle(existing, candidate, selfId) {
      return existing.some(e => e.id !== selfId && candidate.start < e.end && e.start < candidate.end);
    },
    genInput(r) {
      const n = ri(r, 1, 4), existing = [];
      for (let i = 0; i < n; i++) { const s = ri(r, 0, 20); existing.push({ id: i, start: s, end: s + ri(r, 1, 5) }); }
      const cs = ri(r, 0, 20);
      return [existing, { start: cs, end: cs + ri(r, 1, 5) }, ri(r, 0, n - 1)];
    },
    edgeCases: [
      [[{ id: 1, start: 10, end: 20 }], { start: 10, end: 20 }, 1],
      [[{ id: 1, start: 10, end: 20 }], { start: 15, end: 25 }, 2],
      [[{ id: 1, start: 10, end: 20 }], { start: 20, end: 30 }, 2],
      [[{ id: 1, start: 10, end: 20 }, { id: 2, start: 30, end: 40 }], { start: 18, end: 22 }, 1],
    ],
    invariants: [
      { name: 'boolean', check: (_a, o) => typeof o === 'boolean' },
    ],
  },
  {
    id: 'most-frequent', tier: 'T2', signature: 'mostFrequent(nums)',
    spec:
`Write a CommonJS module (module.exports = a function) implementing mostFrequent(nums): return the
value that appears most often in the non-empty integer array. If there is a TIE, return the SMALLEST
of the tied values. Export exactly: module.exports = mostFrequent;  Output only the code, no prose.`,
    oracle(nums) {
      const m = new Map();
      for (const x of nums) m.set(x, (m.get(x) || 0) + 1);
      let best = null, bc = -1;
      for (const [v, c] of m) if (c > bc || (c === bc && v < best)) { bc = c; best = v; }
      return best;
    },
    genInput(r) { const n = ri(r, 1, 8); return [Array.from({ length: n }, () => ri(r, 0, 5))]; },
    edgeCases: [[[1]], [[1, 1, 2]], [[3, 3, 2, 2]], [[5, 1, 5, 1]], [[4, 4, 4, 1, 1, 2]]],
    invariants: [
      { name: 'is-member', check: (a, o) => a[0].includes(o) },
      { name: 'is-a-mode', check: (a, o) => { const cnt = x => a[0].filter(y => y === x).length; const co = cnt(o); return a[0].every(y => cnt(y) <= co); } },
    ],
  },
  {
    id: 'parse-duration', tier: 'T2', signature: 'parseDuration(s)',
    spec:
`Write a CommonJS module (module.exports = a function) implementing parseDuration(s): parse a
duration string into a total number of SECONDS. The string has optional integer components in the
order hours, minutes, seconds, each an integer followed by its unit letter: h, m, s. Examples:
"1h30m" -> 5400, "45m" -> 2700, "2h" -> 7200, "90s" -> 90, "1h30m15s" -> 5415, "0s" -> 0.
You may assume the input is well-formed and has at least one component.
Export exactly: module.exports = parseDuration;  Output only the code, no prose.`,
    oracle(s) { let total = 0; const mult = { h: 3600, m: 60, s: 1 }; let mt; const re = /(\d+)([hms])/g; while ((mt = re.exec(s))) total += parseInt(mt[1], 10) * mult[mt[2]]; return total; },
    genInput(r) {
      const parts = []; const h = ri(r, 0, 5), m = ri(r, 0, 59), s = ri(r, 0, 59);
      if (h) parts.push(h + 'h'); if (m) parts.push(m + 'm'); if (s) parts.push(s + 's');
      if (!parts.length) parts.push('0s');
      return [parts.join('')];
    },
    edgeCases: [['0s'], ['1h'], ['30m'], ['1h30m'], ['2h0m0s'], ['90s'], ['1h30m15s']],
    invariants: [
      { name: 'non-negative-int', check: (_a, o) => isInt(o) && o >= 0 },
    ],
  },

  // ================================ T3 — EDGE-DENSE ================================
  {
    id: 'business-days-add', tier: 'T3', signature: 'addBusinessDays(startISO, n, holidays)',
    spec:
`Write a CommonJS module (module.exports = a function) implementing:

  addBusinessDays(startISO, n, holidays)

- startISO: a date string "YYYY-MM-DD". n: a non-negative integer. holidays: array of "YYYY-MM-DD".
- A BUSINESS DAY is any date that is NOT Saturday, NOT Sunday, and NOT in holidays.
- Move FORWARD n business days from startISO and return the reached date as "YYYY-MM-DD".
- Precise rule: repeatedly advance to the next calendar day; count a day ONLY if it is a business
  day; stop when you have counted n business days. If n === 0, return startISO UNCHANGED (even if
  startISO itself is a weekend or holiday).
- Use UTC. Do not depend on local timezone.

Export exactly: module.exports = addBusinessDays;  Output only the code, no prose.`,
    oracle(startISO, n, holidays) {
      const hs = new Set(holidays); let ms = toMs(startISO), count = 0;
      while (count < n) { ms += DAY; if (isBusiness(ms, hs)) count++; }
      return iso(ms);
    },
    genInput(r) {
      const base = toMs('2026-01-01') + ri(r, 0, 300) * DAY; const holidays = [];
      for (let i = 0; i < ri(r, 0, 3); i++) holidays.push(iso(base + ri(r, -3, 12) * DAY));
      return [iso(base), ri(r, 0, 8), holidays];
    },
    edgeCases: [
      ['2026-01-02', 0, []], ['2026-01-03', 0, []], ['2026-01-02', 1, []],
      ['2026-01-02', 1, ['2026-01-05']], ['2026-01-01', 3, []], ['2026-01-02', 5, ['2026-01-05', '2026-01-06']],
    ],
    invariants: [
      { name: 'iso-format', check: (_a, o) => typeof o === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(o) },
      { name: 'zero-is-identity', check: (a, o) => a[1] !== 0 || o === a[0] },
      { name: 'never-earlier', check: (a, o) => toMs(o) >= toMs(a[0]) },
    ],
  },
  {
    id: 'roman-numeral', tier: 'T3', signature: 'toRoman(n)',
    spec:
`Write a CommonJS module (module.exports = a function) implementing toRoman(n): convert an integer
1..3999 to its Roman numeral string. Use subtractive notation: 4=IV, 9=IX, 40=XL, 90=XC, 400=CD,
900=CM. Examples: 58 -> "LVIII", 1994 -> "MCMXCIV", 3999 -> "MMMCMXCIX".
Export exactly: module.exports = toRoman;  Output only the code, no prose.`,
    oracle(n) {
      const table = [[1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
      let out = ''; for (const [v, sym] of table) while (n >= v) { out += sym; n -= v; } return out;
    },
    genInput(r) { return [ri(r, 1, 3999)]; },
    edgeCases: [[1], [4], [9], [40], [90], [400], [900], [58], [1994], [3999]],
    invariants: [
      { name: 'roman-chars', check: (_a, o) => typeof o === 'string' && o.length > 0 && /^[MDCLXVI]+$/.test(o) },
      { name: 'no-four-repeats', check: (_a, o) => !/(.)\1\1\1/.test(o) },
    ],
  },
  {
    id: 'luhn-check', tier: 'T3', signature: 'luhnValid(digits)',
    spec:
`Write a CommonJS module (module.exports = a function) implementing luhnValid(digits): given a
non-empty string of decimal digits, return true if it passes the Luhn checksum, else false.
Luhn: from the RIGHTMOST digit moving left, double every SECOND digit; if a doubled value exceeds 9
subtract 9; the total of all resulting digits must be a multiple of 10. Example: "4111111111111111"
-> true, "1234" -> false. Export exactly: module.exports = luhnValid;  Output only the code, no prose.`,
    oracle(digits) {
      let sum = 0, alt = false;
      for (let i = digits.length - 1; i >= 0; i--) { let d = digits.charCodeAt(i) - 48; if (alt) { d *= 2; if (d > 9) d -= 9; } sum += d; alt = !alt; }
      return sum % 10 === 0;
    },
    genInput(r) { let n = ri(r, 1, 16), s = ''; for (let i = 0; i < n; i++) s += ri(r, 0, 9); return [s]; },
    edgeCases: [['0'], ['18'], ['1234'], ['4111111111111111'], ['79927398713'], ['79927398710']],
    invariants: [
      { name: 'boolean', check: (_a, o) => typeof o === 'boolean' },
    ],
  },
  {
    id: 'expand-ranges', tier: 'T3', signature: 'expandRanges(s)',
    spec:
`Write a CommonJS module (module.exports = a function) implementing expandRanges(s): parse a
comma-separated list of integers and integer ranges into a SORTED, DEDUPLICATED ascending array.
A range "a-b" (a <= b) expands to a,a+1,...,b. A bare "n" is just n. Examples:
"1-3,5,7-9" -> [1,2,3,5,7,8,9], "3,1,2" -> [1,2,3], "1-2,2-3" -> [1,2,3], "5" -> [5].
You may assume the input is well-formed. Export exactly: module.exports = expandRanges;  Output only the code, no prose.`,
    oracle(s) {
      const set = new Set();
      for (const part of s.split(',')) {
        if (part.includes('-')) { const [a, b] = part.split('-').map(Number); for (let x = a; x <= b; x++) set.add(x); }
        else set.add(Number(part));
      }
      return [...set].sort((a, b) => a - b);
    },
    genInput(r) {
      const k = ri(r, 1, 4), parts = [];
      for (let i = 0; i < k; i++) { const a = ri(r, 0, 20); if (r() < 0.5) { const b = a + ri(r, 0, 5); parts.push(a + '-' + b); } else parts.push('' + a); }
      return [parts.join(',')];
    },
    edgeCases: [['1-3'], ['5'], ['1-3,5,7-9'], ['3,1,2'], ['1-2,2-3'], ['5-5'], ['10,10,10']],
    invariants: [
      { name: 'sorted-unique', check: (_a, o) => Array.isArray(o) && sorted(o) && unique(o) },
      { name: 'all-integers', check: (_a, o) => o.every(isInt) },
    ],
  },
];

// battery: edge cases + N random inputs per problem (seeded, reproducible)
function battery(problem, nRandom = 300, seed = 12345) {
  const r = rng(seed + problem.id.length * 7);
  const inputs = problem.edgeCases.map(x => x);
  for (let i = 0; i < nRandom; i++) inputs.push(problem.genInput(r));
  return inputs;
}

module.exports = { PROBLEMS, battery };
