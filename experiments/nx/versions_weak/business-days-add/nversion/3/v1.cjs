const moment = require('moment-timezone');

module.exports = function addBusinessDays(startISO, n, holidays) {
  if (n === 0) return startISO;
  const start = moment.tz(startISO, 'UTC');
  let count = 0;
  while (count < n) {
    start.add(1, 'day');
    if (start.day() < 6 && !holidays.includes(start.format('YYYY-MM-DD'))) {
      count++;
    }
  }
  return start.format('YYYY-MM-DD');
};