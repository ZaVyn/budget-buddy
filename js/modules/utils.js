export function formatBaht(num) {
  return '฿ ' + num.toLocaleString('th-TH');
}

export function getDateRange(period) {
  const now = new Date();
  const start = new Date(now);
  
  if (period === 'daily') {
    start.setHours(0, 0, 0, 0);
  } else if (period === 'weekly') {
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
  } else if (period === 'monthly') {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  }
  
  return { start, end: now };
}