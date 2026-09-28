module.exports = function hasConflict(existing, candidate, selfId) {
  for (let interval of existing) {
    if (interval.id !== selfId && candidate.start < interval.end && interval.start < candidate.end) {
      return true;
    }
  }
  return false;
};