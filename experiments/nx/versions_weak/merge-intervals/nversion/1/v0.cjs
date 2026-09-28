module.exports = function mergeIntervals(intervals) {
  if (intervals.length === 0) return [];

  const sortedIntervals = intervals.slice().sort((a, b) => a[0] - b[0]);
  const merged = [sortedIntervals[0]];

  for (let i = 1; i < sortedIntervals.length; i++) {
    const current = sortedIntervals[i];
    const lastMerged = merged[merged.length - 1];

    if (current[0] <= lastMerged[1]) {
      merged[merged.length - 1] = [lastMerged[0], Math.max(lastMerged[1], current[1])];
    } else {
      merged.push(current);
    }
  }

  return merged;
};