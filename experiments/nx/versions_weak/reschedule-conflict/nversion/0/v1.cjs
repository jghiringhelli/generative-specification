module.exports = function hasConflict(existing, candidate, selfId) {
  return existing.some(interval => 
    interval.id !== selfId && 
    candidate.start < interval.end && 
    interval.start < candidate.end
  );
};