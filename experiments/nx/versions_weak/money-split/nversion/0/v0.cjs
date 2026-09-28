module.exports = function splitCents(totalCents, parts) {
    const baseAmount = Math.floor(totalCents / parts);
    const extraAmount = totalCents % parts;
    const result = Array(parts).fill(baseAmount);
    for (let i = 0; i < extraAmount; i++) {
        result[i]++;
    }
    return result;
};