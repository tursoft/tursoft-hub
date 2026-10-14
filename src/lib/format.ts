import { calculateDuration, parseDate } from "./datetimeutils";

const ONES = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen",
];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

/** Spells out whole numbers 0–99 in English ("twenty-six"); anything else is returned as digits. */
export function numberToWords(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 99) return String(n);
  if (n < 20) return ONES[n];
  const tens = TENS[Math.floor(n / 10)];
  const ones = n % 10;
  return ones === 0 ? tens : `${tens}-${ONES[ones]}`;
}

export function capitalize(text: string): string {
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

/** "1 project", "2 projects", "2 companies". */
export function plural(count: number, singular: string, pluralForm = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

const MONTH_YEAR = new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" });

/** "01.06.2023" or "2023-06" → "Jun 2023"; unparseable input is returned unchanged. */
export function formatMonthYear(value: string | null | undefined): string {
  const date = parseDate(value);
  return date ? MONTH_YEAR.format(date) : value ?? "";
}

/** "Jun 2023 — Dec 2024", or "Jun 2023 — present" when the range is open; "" without a start. */
export function formatMonthRange(
  start: string | null | undefined,
  end: string | null | undefined,
  presentLabel = "present",
): string {
  if (!start) return "";
  return `${formatMonthYear(start)} — ${end ? formatMonthYear(end) : presentLabel}`;
}

/** Month range plus duration: "Jan 2012 — Mar 2014 · 2 yrs 2 mos"; "" without a start. */
export function formatPeriod(start: string | null | undefined, end: string | null | undefined): string {
  if (!start) return "";
  const range = formatMonthRange(start, end);
  const duration = calculateDuration([{ startDate: start, endDate: end }]);
  return duration ? `${range} · ${duration}` : range;
}

/** "2015 — 2019", a single year when both ends match, "2023 — now" for open ranges ("2023" when presentLabel is ""). */
export function formatYearRange(
  start: string | null | undefined,
  end: string | null | undefined,
  presentLabel = "now",
): string {
  const startYear = parseDate(start)?.getFullYear();
  if (startYear === undefined) return "";
  if (!end) return presentLabel ? `${startYear} — ${presentLabel}` : String(startYear);
  const endYear = parseDate(end)?.getFullYear();
  if (endYear === undefined || endYear === startYear) return String(startYear);
  return `${startYear} — ${endYear}`;
}

/** Splits a position summary on <br/> tags into trimmed, non-empty lines. */
export function splitSummary(summary: string | null | undefined): string[] {
  return (summary ?? "")
    .split(/<br\s*\/?>/i)
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Plain text from a trusted HTML snippet (for one-line subtitles): breaks become spaces, tags are dropped. */
export function stripHtml(html: string | null | undefined): string {
  return (html ?? "")
    .replace(/<(br|\/p|\/li|\/div|\/h\d)\b[^>]*>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}
