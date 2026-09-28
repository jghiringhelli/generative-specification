module.exports = function splitCents(totalCents, parts) {
  const base = Math.floor(totalCents / parts);
  const extra = totalCents % parts;
  const result = Array(parts).fill(base);
  for (let i = 0; i < extra; i++) {
    result[i]++;
  }
  return result;
};