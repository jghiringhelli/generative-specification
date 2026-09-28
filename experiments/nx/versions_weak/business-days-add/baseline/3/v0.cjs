module.exports = function addBusinessDays(startISO, n, holidays) {
  const start = new Date(Date.UTC(startISO.slice(0, 4), startISO.slice(5, 7) - 1, startISO.slice(8, 10)));
  const dayOfWeek = start.getUTCDay();
  let daysToAdd = n + (dayOfWeek === 0 ? 2 : (dayOfWeek === 6 ? 1 : 0));
  while (daysToAdd > 0) {
    start.setUTCDate(start.getUTCDate() + 1);
    if (start.getUTCDay() !== 0 && start.getUTCDay() !== 6 && !holidays.includes(start.toISOString().slice(0, 10))) {
      daysToAdd--;
    }
  }
  return start.toISOString().slice(0, 10);
};