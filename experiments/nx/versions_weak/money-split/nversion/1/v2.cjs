module.exports = function splitCents(totalCents, parts) {
    if (totalCents < 0 || !Number.isInteger(totalCents) || parts <= 0 || !Number.isInteger(parts)) {
        throw new Error('Invalid input');
    }

    const base = Math.floor(totalCents / parts);
    const extra = totalCents % parts;
    const result = Array(parts).fill(base);

    for (let i = 0; i < extra; i++) {
        result[i]++;
    }

    return result;
};