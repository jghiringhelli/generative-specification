module.exports = function splitCents(totalCents, parts) {
  if (totalCents < 0 || !Number.isInteger(totalCents) || parts <= 0 || !Number.isInteger(parts)) {
    throw new Error('Invalid input');
  }

  const baseAmount = Math.floor(totalCents / parts);
  const extraAmount = totalCents % parts;
  const result = [];

  for (let i = 0; i < parts; i++) {
    result.push(i < extraAmount ? baseAmount + 1 : baseAmount);
  }

  return result;
};