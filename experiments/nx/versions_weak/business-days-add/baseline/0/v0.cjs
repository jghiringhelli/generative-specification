module.exports = function addBusinessDays(startISO, n, holidays) {
    const start = new Date(Date.UTC(startISO.slice(0, 4), startISO.slice(5, 7) - 1, startISO.slice(8, 10)));
    const dayOfWeek = start.getUTCDay();
    let count = 0;

    while (count < n) {
        start.setUTCDate(start.getUTCDate() + 1);
        const day = start.getUTCDay();
        const iso = start.toISOString().slice(0, 10);
        if ((day !== 0 && day !== 6) && !holidays.includes(iso)) {
            count++;
        }
    }

    return start.toISOString().slice(0, 10);
};