function addBusinessDays(startISO, n, holidays) {
  const start = new Date(startISO);
  const target = new Date(start);
  let count = 0;

  while (count < n) {
    target.setDate(target.getDate() + 1);
    const day = target.getUTCDay();
    const iso = target.toISOString().split('T')[0];
    if ((day !== 6 && day !== 0) && !holidays.includes(iso)) {
      count++;
    }
  }

  return target.toISOString().split('T')[0];
}

module.exports = addBusinessDays;