module.exports = function hasConflict(existing, candidate, selfId) {
  return existing.some(item => item.id !== selfId && item.start < candidate.end && candidate.start < item.end);
};