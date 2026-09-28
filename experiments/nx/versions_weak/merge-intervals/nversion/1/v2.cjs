module.exports = function mergeIntervals(intervals) {
  if (intervals.length === 0) return [];

  const sortedIntervals = intervals.slice().sort((a, b) => a[0] - b[0]);
  const merged = [sortedIntervals[0]];

  for (let i = 1; i < sortedIntervals.length; i++) {
    const last = merged[merged.length - 1];
    const current = sortedIntervals[i];

    if (current[0] <= last[1]) {
      merged[merged.length - 1] = [last[0], Math.max(last[1], current[1])];
    } else {
      merged.push(current);
    }
  }

  return merged;
};