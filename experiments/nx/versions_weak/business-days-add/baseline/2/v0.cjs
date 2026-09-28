const moment = require('moment-timezone');

function addBusinessDays(startISO, n, holidays) {
  const startDate = moment.tz(startISO, 'UTC');
  let count = 0;

  while (count < n) {
    startDate.add(1, 'day');
    if (startDate.day() < 6 && !holidays.includes(startDate.format('YYYY-MM-DD'))) {
      count++;
    }
  }

  return startDate.format('YYYY-MM-DD');
}

module.exports = addBusinessDays;