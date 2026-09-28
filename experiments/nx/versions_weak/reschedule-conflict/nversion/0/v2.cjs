module.exports = function hasConflict(existing, candidate, selfId) {
  for (let i = 0; i < existing.length; i++) {
    if (existing[i].id !== selfId && 
        candidate.start < existing[i].end && 
        candidate.end > existing[i].start) {
      return true;
    }
  }
  return false;
};