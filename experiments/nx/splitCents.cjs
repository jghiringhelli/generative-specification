function splitCents(totalCents, parts) {
  const base = Math.floor(totalCents / parts);
  const remainder = totalCents % parts;
  const result = [];

  for (let i = 0; i < remainder; i++) {
    result.push(base + 1);
  }

  for (let i = 0; i < parts - remainder; i++) {
    result.push(base);
  }

  return result;
}

module.exports = splitCents;
