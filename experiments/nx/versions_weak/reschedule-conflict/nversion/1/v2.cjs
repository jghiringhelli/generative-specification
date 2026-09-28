module.exports = function hasConflict(existing, candidate, selfId) {
  for (let i = 0; i < existing.length; i++) {
    if (existing[i].id !== selfId && 
        candidate.start < existing[i].end && 
        existing[i].start < candidate.end) {
      return true;
    }
  }
  return false;
};