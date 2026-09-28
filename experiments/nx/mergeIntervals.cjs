module.exports = function mergeIntervals(intervals) {
  if (intervals.length === 0) return [];

  const sorted = intervals.slice().sort((a, b) => a[0] - b[0]);
  const merged = [[sorted[0][0], sorted[0][1]]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current[0] <= last[1]) {
      last[1] = Math.max(last[1], current[1]);
    } else {
      merged.push([current[0], current[1]]);
    }
  }

  return merged;
};
