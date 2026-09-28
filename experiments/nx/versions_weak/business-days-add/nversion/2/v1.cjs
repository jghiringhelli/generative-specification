module.exports = function addBusinessDays(startISO, n, holidays) {
  const start = new Date(Date.UTC(startISO.replace(/-/g, '/')));
  const isBusinessDay = (date) => {
    const day = date.getUTCDay();
    return day !== 0 && day !== 6 && !holidays.includes(date.toISOString().split('T')[0]);
  };
  while (n > 0) {
    start.setUTCDate(start.getUTCDate() + 1);
    if (isBusinessDay(start)) {
      n--;
    }
  }
  return start.toISOString().split('T')[0];
};