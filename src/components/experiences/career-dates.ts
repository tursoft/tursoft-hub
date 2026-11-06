// Dates in the career record, in one format everywhere: "Dec 2022 – Apr 2026", "May 2026 – present".
// The data stores dates as "dd.mm.yyyy".

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY = 1000 * 60 * 60 * 24;
const NBSP = String.fromCharCode(0xa0);

export function parseDate(value: string): Date {
  const [day, month, year] = value.split(".").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

/** "Dec 2022", with a no-break space so a month never parts from its year. */
export function formatMonth(value: string): string {
  const date = parseDate(value);
  return MONTHS[date.getMonth()] + NBSP + date.getFullYear();
}

export function formatRange(start: string, end: string | null | undefined): string {
  if (!start) return "";
  return `${formatMonth(start)} – ${end ? formatMonth(end) : "present"}`;
}

/**
 * Length of a stay: "3 years 4 months", "8 months"; a current one is "2+ years" or "6 months".
 * Counts to today when `end` is empty, so call it from effects, not during render.
 */
export function formatDuration(start: string, end: string | null | undefined): string {
  const from = parseDate(start).getTime();

  if (!end) {
    const totalMonths = Math.floor((Date.now() - from) / (DAY * 30.44));
    const years = Math.floor(totalMonths / 12);
    if (years >= 1) return `${years}+ years`;
    const months = Math.max(totalMonths, 1);
    return `${months} month${months > 1 ? "s" : ""}`;
  }

  const span = parseDate(end).getTime() - from;
  const years = Math.floor(span / (DAY * 365));
  const months = Math.floor((span % (DAY * 365)) / (DAY * 30));

  let duration = "";
  if (years > 0) duration += `${years} year${years > 1 ? "s" : ""}`;
  if (months > 0) duration += `${duration ? " " : ""}${months} month${months > 1 ? "s" : ""}`;
  return duration || "< 1 month";
}
