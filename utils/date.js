function startOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function addMonths(date, months) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function addByFrequency(date, frequency) {
  const d = new Date(date);
  switch (frequency) {
    case 'daily':
      d.setDate(d.getDate() + 1);
      break;
    case 'weekly':
      d.setDate(d.getDate() + 7);
      break;
    case 'monthly':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'yearly':
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      throw new Error(`Unknown frequency: ${frequency}`);
  }
  return d;
}

function monthsBetween(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
}

function lastNMonths(n, from = new Date()) {
  const months = [];
  for (let i = n - 1; i >= 0; i -= 1) {
    const d = addMonths(new Date(from.getFullYear(), from.getMonth(), 1), -i);
    months.push({ month: d.getMonth() + 1, year: d.getFullYear() });
  }
  return months;
}

module.exports = {
  startOfMonth,
  endOfMonth,
  addMonths,
  addByFrequency,
  monthsBetween,
  lastNMonths,
};
