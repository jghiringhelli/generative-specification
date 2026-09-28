module.exports = function hasConflict(existing, candidate, selfId) {
  for (let interval of existing) {
    if (interval.id !== selfId && candidate.start < interval.end && candidate.end > interval.start) {
      return true;
    }
  }
  return false;
};