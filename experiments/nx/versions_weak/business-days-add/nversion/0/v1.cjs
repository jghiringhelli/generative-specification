const moment = require('moment-timezone');

function addBusinessDays(startISO, n, holidays) {
  const startDate = moment.tz(startISO, 'YYYY-MM-DD', 'UTC');
  const holidaySet = new Set(holidays.map(holiday => moment.tz(holiday, 'YYYY-MM-DD', 'UTC')));

  let count = 0;
  while (count < n) {
    startDate.add(1, 'day');
    if (startDate.day() < 6 && !holidaySet.has(startDate)) {
      count++;
    }
  }

  return startDate.format('YYYY-MM-DD');
}

module.exports = addBusinessDays;