/** Pure time-zone-aware reminder decision shared by Worker and Node tests. */
export function localDayAndHour(timezone, now = new Date()) {
  const fields = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", hourCycle: "h23",
  }).formatToParts(now);
  const parts = Object.fromEntries(fields.map(({ type, value }) => [type, value]));
  return {
    day: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
  };
}
export function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const utc = new Date(value + "T00:00:00.000Z");
  return Number.isFinite(utc.getTime()) && utc.toISOString().slice(0,10) === value;
}
export function countDue(chores, day) {
  if (!Array.isArray(chores)) return 0;
  return chores.filter((chore) => isValidDate(chore.dueDate) && chore.dueDate <= day).length;
}
