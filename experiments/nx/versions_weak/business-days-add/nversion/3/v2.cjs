const moment = require('moment-timezone');

module.exports = function addBusinessDays(startISO, n, holidays) {
  let currentDate = moment.tz(startISO, 'UTC');
  let count = 0;

  while (count < n) {
    currentDate = currentDate.add(1, 'day');
    if (currentDate.day() < 6 && !holidays.includes(currentDate.format('YYYY-MM-DD'))) {
      count++;
    }
  }

  return currentDate.format('YYYY-MM-DD');
};