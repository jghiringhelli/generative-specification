module.exports = function splitCents(totalCents, parts) {
    const base = Math.floor(totalCents / parts);
    const remainder = totalCents % parts;
    const result = Array(parts).fill(base);
    for (let i = 0; i < remainder; i++) {
        result[i]++;
    }
    return result;
};