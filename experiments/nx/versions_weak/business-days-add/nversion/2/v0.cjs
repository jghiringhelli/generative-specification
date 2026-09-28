module.exports = function addBusinessDays(startISO, n, holidays) {
  const start = new Date(startISO);
  const dayOfWeek = start.getUTCDay();
  let daysToAdd = n + (dayOfWeek === 6 ? 2 : (dayOfWeek === 0 ? 1 : 0));

  while (daysToAdd > 0) {
    start.setUTCDate(start.getUTCDate() + 1);
    const dayOfWeek = start.getUTCDay();
    if (dayOfWeek !== 6 && dayOfWeek !== 0 && !holidays.includes(start.toISOString().split('T')[0])) {
      daysToAdd--;
    }
  }

  return start.toISOString().split('T')[0];
};