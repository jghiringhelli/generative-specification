module.exports = function addBusinessDays(startISO, n, holidays) {
  const start = new Date(Date.UTC(startISO.slice(0, 4), startISO.slice(5, 7) - 1, startISO.slice(8, 10)));
  const isBusinessDay = (date) => {
    const day = date.getUTCDay();
    const iso = date.toISOString().split('T')[0];
    return day !== 0 && day !== 6 && !holidays.includes(iso);
  };
  let count = 0;
  while (count < n) {
    start.setUTCDate(start.getUTCDate() + 1);
    if (isBusinessDay(start)) {
      count++;
    }
  }
  return start.toISOString().split('T')[0];
};