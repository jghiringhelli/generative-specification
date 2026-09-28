module.exports = function addBusinessDays(startISO, n, holidays) {
  const start = new Date(Date.UTC(startISO.split('-')[0], startISO.split('-')[1] - 1, startISO.split('-')[2]));
  const dayOfWeek = start.getUTCDay();
  let count = 0;

  while (count < n) {
    start.setUTCDate(start.getUTCDate() + 1);
    const dayOfWeek = start.getUTCDay();
    const isoDate = start.toISOString().split('T')[0];
    if ((dayOfWeek !== 0 && dayOfWeek !== 6) && !holidays.includes(isoDate)) {
      count++;
    }
  }

  return start.toISOString().split('T')[0];
};