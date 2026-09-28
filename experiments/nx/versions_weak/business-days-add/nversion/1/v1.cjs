const moment = require('moment-timezone');

module.exports = function addBusinessDays(startISO, n, holidays) {
  if (n === 0) return startISO;

  const start = moment.tz(startISO, 'UTC');
  const holidaySet = new Set(holidays.map(holiday => moment.tz(holiday, 'UTC')));

  let businessDaysCount = 0;
  while (businessDaysCount < n) {
    start.add(1, 'day');
    if (start.day() < 6 && !holidaySet.has(start.format('YYYY-MM-DD'))) {
      businessDaysCount++;
    }
  }

  return start.format('YYYY-MM-DD');
};