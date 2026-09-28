const moment = require('moment-timezone');

function addBusinessDays(startISO, n, holidays) {
    let currentDate = moment.tz(startISO, 'UTC');
    let businessDaysCount = 0;

    while (businessDaysCount < n) {
        currentDate.add(1, 'day');
        if (currentDate.day() !== 6 && currentDate.day() !== 0 && !holidays.includes(currentDate.format('YYYY-MM-DD'))) {
            businessDaysCount++;
        }
    }

    return currentDate.format('YYYY-MM-DD');
}

module.exports = addBusinessDays;