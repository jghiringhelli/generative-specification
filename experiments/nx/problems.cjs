// NX problem set — authored oracles + input batteries. The GENERATOR NEVER SEES THIS FILE.
// Each problem: { id, category, fn, signature, spec (the prompt), oracle, genInput, edgeCases }.
// Oracles are deliberately simple and independently reviewable; they are the ground truth.

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

const PROBLEMS = [
  // ============================ SUBTLE ============================
  {
    id: 'money-split',
    category: 'subtle',
    signature: 'splitCents(totalCents, parts)',
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
  },

  {
    id: 'merge-intervals',
    category: 'subtle',
    signature: 'mergeIntervals(intervals)',
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
        if (out.length && s <= out[out.length - 1][1]) {
          out[out.length - 1][1] = Math.max(out[out.length - 1][1], e);
        } else out.push([s, e]);
      }
      return out;
    },
    genInput(r) {
      const n = ri(r, 0, 6), arr = [];
      for (let i = 0; i < n; i++) { const s = ri(r, 0, 20); arr.push([s, s + ri(r, 0, 6)]); }
      return [arr];
    },
    edgeCases: [[[]], [[[1, 3], [3, 5]]], [[[1, 3], [4, 5]]], [[[5, 6], [1, 2], [2, 2]]],
                [[[1, 10], [2, 3], [4, 5]]], [[[1, 1]]], [[[2, 3], [1, 5]]]],
  },

  {
    id: 'business-days-add',
    category: 'subtle',
    signature: 'addBusinessDays(startISO, n, holidays)',
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
      const hs = new Set(holidays);
      let ms = toMs(startISO), count = 0;
      while (count < n) { ms += DAY; if (isBusiness(ms, hs)) count++; }
      return iso(ms);
    },
    genInput(r) {
      const base = toMs('2026-01-01') + ri(r, 0, 300) * DAY;
      const holidays = [];
      for (let i = 0; i < ri(r, 0, 3); i++) holidays.push(iso(base + ri(r, -3, 12) * DAY));
      return [iso(base), ri(r, 0, 8), holidays];
    },
    edgeCases: [
      ['2026-01-02', 0, []],                 // n=0
      ['2026-01-03', 0, []],                 // n=0 on a Saturday -> unchanged
      ['2026-01-02', 1, []],                 // Fri -> Mon
      ['2026-01-02', 1, ['2026-01-05']],     // Fri, Mon holiday -> Tue
      ['2026-01-01', 3, []],
      ['2026-01-02', 5, ['2026-01-05', '2026-01-06']],
    ],
  },

  {
    id: 'reschedule-conflict',
    category: 'subtle',
    signature: 'hasConflict(existing, candidate, selfId)',
    spec:
`Write a CommonJS module (module.exports = a function) implementing:

  hasConflict(existing, candidate, selfId)

- existing: array of { id, start, end } integer intervals (start < end), half-open [start, end).
- candidate: { start, end } the new position for the move being rescheduled.
- selfId: the id of the move being rescheduled — it MUST be excluded from the check (a move never
  conflicts with its own old position).
- Return true if candidate OVERLAPS any existing interval whose id !== selfId, else false.
- Overlap is half-open: [a,b) overlaps [c,d) iff a < d AND c < b. Touching endpoints do NOT overlap
  (candidate end === other start is fine).

Export exactly: module.exports = hasConflict;  Output only the code, no prose.`,
    oracle(existing, candidate, selfId) {
      return existing.some(e => e.id !== selfId &&
        candidate.start < e.end && e.start < candidate.end);
    },
    genInput(r) {
      const n = ri(r, 1, 4), existing = [];
      for (let i = 0; i < n; i++) { const s = ri(r, 0, 20); existing.push({ id: i, start: s, end: s + ri(r, 1, 5) }); }
      const cs = ri(r, 0, 20);
      return [existing, { start: cs, end: cs + ri(r, 1, 5) }, ri(r, 0, n - 1)];
    },
    edgeCases: [
      [[{ id: 1, start: 10, end: 20 }], { start: 10, end: 20 }, 1],       // moving onto own slot -> false
      [[{ id: 1, start: 10, end: 20 }], { start: 15, end: 25 }, 2],       // overlaps other -> true
      [[{ id: 1, start: 10, end: 20 }], { start: 20, end: 30 }, 2],       // touching -> false
      [[{ id: 1, start: 10, end: 20 }, { id: 2, start: 30, end: 40 }], { start: 18, end: 22 }, 1], // overlaps id2? no; id1 excluded -> false
      [[{ id: 1, start: 10, end: 20 }, { id: 2, start: 19, end: 25 }], { start: 12, end: 16 }, 1], // overlaps id2 -> ... 12<25 && 19<16? no -> false
    ],
  },

  // ============================ TRIVIAL (control — should STAY DEAD) ============================
  {
    id: 'sum-array',
    category: 'trivial',
    signature: 'sumArray(nums)',
    spec:
`Write a CommonJS module (module.exports = a function) implementing sumArray(nums): return the sum
of an array of integers (0 for empty). Export exactly: module.exports = sumArray; code only.`,
    oracle(nums) { return nums.reduce((a, b) => a + b, 0); },
    genInput(r) { const n = ri(r, 0, 8); return [Array.from({ length: n }, () => ri(r, -50, 50))]; },
    edgeCases: [[[]], [[5]], [[-1, 1]], [[1, 2, 3, 4]]],
  },
  {
    id: 'reverse-string',
    category: 'trivial',
    signature: 'reverseString(s)',
    spec:
`Write a CommonJS module (module.exports = a function) implementing reverseString(s): return the
string reversed. Export exactly: module.exports = reverseString; code only.`,
    oracle(s) { return s.split('').reverse().join(''); },
    genInput(r) { const n = ri(r, 0, 10); let s = ''; for (let i = 0; i < n; i++) s += String.fromCharCode(ri(r, 97, 122)); return [s]; },
    edgeCases: [[''], ['a'], ['ab'], ['racecar']],
  },
];

// battery: edge cases + N random inputs per problem (seeded)
function battery(problem, nRandom = 300, seed = 12345) {
  const r = rng(seed + problem.id.length * 7);
  const inputs = problem.edgeCases.map(x => x);
  for (let i = 0; i < nRandom; i++) inputs.push(problem.genInput(r));
  return inputs;
}

module.exports = { PROBLEMS, battery };
