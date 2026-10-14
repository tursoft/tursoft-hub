# Task 2: Pure helpers (TDD) — format, career, listview, motion maths

Part of [the Quiet Swiss plan](../2026-10-14-quiet-swiss-redesign.md). Read its **Global Constraints** first.

**Files:**
- Create: `src/lib/format.ts`, `src/lib/format.test.ts`
- Create: `src/lib/career.ts`, `src/lib/career.test.ts`
- Create: `src/lib/listview.ts`, `src/lib/listview.test.ts`
- Create: `src/lib/motion/math.ts`, `src/lib/motion/math.test.ts`

**Interfaces:**
- Consumes: `parseDate` from `src/lib/datetimeutils.ts` (existing: parses `dd.mm.yyyy` and `yyyy-mm`, returns `Date | null`); `Experience`, `Position` from `src/models/Experience.ts`.
- Produces (used by Tasks 3–17):
  - `format.ts`: `numberToWords(n)`, `capitalize(text)`, `plural(count, singular, pluralForm?)`, `formatMonthYear(value)`, `formatMonthRange(start, end, presentLabel = "present")`, `formatPeriod(start, end)`, `formatYearRange(start, end, presentLabel = "now")`, `splitSummary(summary)`, `stripHtml(html)`
  - `career.ts`: `CareerStats`, `Span`, `careerYears(experiences, now?)`, `computeCareerStats(experiences, projectCount, now?)`, `sortPositionsDesc(positions)`, `sortExperiencesDesc(experiences)`, `experienceSpan(experience)`
  - `listview.ts`: `ALL_CATEGORY`, `FieldAccessor<T>`, `FilterOptions<T>`, `getFieldValue`, `buildCategories`, `countForCategory`, `filterItems`
  - `motion/math.ts`: `clamp`, `lerp`, `easeOutCubic`, `wrap`, `skewFromVelocity`, `driftOffset`, `linePush`, `lineWave`, `tiltFromPointer`, `magneticOffset`, `countUpValue`

All date ranges use an em dash with spaces: `" — "`.

---

### Part A — `format.ts`

- [ ] **Step 1: Write the failing test `src/lib/format.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import {
  capitalize,
  formatMonthRange,
  formatMonthYear,
  formatPeriod,
  formatYearRange,
  numberToWords,
  plural,
  splitSummary,
  stripHtml,
} from "./format";

describe("numberToWords", () => {
  it.each([
    [0, "zero"],
    [7, "seven"],
    [14, "fourteen"],
    [19, "nineteen"],
    [20, "twenty"],
    [26, "twenty-six"],
    [99, "ninety-nine"],
  ])("spells %i as %s", (n, words) => {
    expect(numberToWords(n)).toBe(words);
  });

  it("returns digits outside 0–99 or for non-integers", () => {
    expect(numberToWords(100)).toBe("100");
    expect(numberToWords(-1)).toBe("-1");
    expect(numberToWords(2.5)).toBe("2.5");
  });
});

describe("capitalize", () => {
  it("upper-cases the first letter", () => {
    expect(capitalize("twenty-six")).toBe("Twenty-six");
    expect(capitalize("")).toBe("");
  });
});

describe("plural", () => {
  it("chooses the singular or plural form", () => {
    expect(plural(1, "project")).toBe("1 project");
    expect(plural(0, "project")).toBe("0 projects");
    expect(plural(2, "company", "companies")).toBe("2 companies");
  });
});

describe("formatMonthYear", () => {
  it("formats dd.mm.yyyy and yyyy-mm dates", () => {
    expect(formatMonthYear("01.06.2023")).toBe("Jun 2023");
    expect(formatMonthYear("2019-04")).toBe("Apr 2019");
  });

  it("returns the input when it cannot be parsed", () => {
    expect(formatMonthYear("someday")).toBe("someday");
    expect(formatMonthYear(null)).toBe("");
  });
});

describe("formatMonthRange", () => {
  it("joins start and end with an em dash", () => {
    expect(formatMonthRange("01.01.2012", "31.12.2012")).toBe("Jan 2012 — Dec 2012");
  });

  it("uses the present label for open ranges", () => {
    expect(formatMonthRange("01.06.2023", null)).toBe("Jun 2023 — present");
  });

  it("is empty without a start", () => {
    expect(formatMonthRange(undefined, "01.01.2020")).toBe("");
  });
});

describe("formatPeriod", () => {
  it("adds the duration to the month range", () => {
    expect(formatPeriod("01.01.2012", "01.03.2014")).toBe("Jan 2012 — Mar 2014 · 2 yrs 2 mos");
  });

  it("leaves out a duration shorter than a month", () => {
    expect(formatPeriod("01.05.2020", "20.05.2020")).toBe("May 2020 — May 2020");
  });

  it("is empty without a start", () => {
    expect(formatPeriod(null, "01.01.2020")).toBe("");
  });
});

describe("formatYearRange", () => {
  it("formats closed ranges", () => {
    expect(formatYearRange("01.01.2015", "31.12.2019")).toBe("2015 — 2019");
  });

  it("collapses ranges within one year", () => {
    expect(formatYearRange("01.01.2015", "31.12.2015")).toBe("2015");
  });

  it("marks open ranges", () => {
    expect(formatYearRange("01.06.2023", null)).toBe("2023 — now");
    expect(formatYearRange("01.06.2023", null, "")).toBe("2023");
  });

  it("returns an empty string without a start", () => {
    expect(formatYearRange(undefined, null)).toBe("");
  });
});

describe("splitSummary", () => {
  it("splits on <br/> and drops empty lines", () => {
    expect(splitSummary("First line.<br/> Second line.<br /><br/>")).toEqual(["First line.", "Second line."]);
    expect(splitSummary(undefined)).toEqual([]);
  });
});

describe("stripHtml", () => {
  it("turns line breaks and block ends into spaces and drops other tags", () => {
    expect(stripHtml("Line one.<br/>Line <b>two</b>.")).toBe("Line one. Line two.");
    expect(stripHtml("<p>A</p><p>B &amp; C&nbsp;D</p>")).toBe("A B & C D");
  });

  it("returns an empty string for missing input", () => {
    expect(stripHtml(undefined)).toBe("");
  });
});
```

- [ ] **Step 2: Run it and confirm it fails**

Run: `npx vitest run src/lib/format.test.ts`
Expected: FAIL — `Failed to resolve import "./format"`.

- [ ] **Step 3: Implement `src/lib/format.ts`**

```ts
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
```

- [ ] **Step 4: Run it and confirm it passes**

Run: `npx vitest run src/lib/format.test.ts`
Expected: PASS (all tests).

---

### Part B — `career.ts`

- [ ] **Step 5: Write the failing test `src/lib/career.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import type { Experience, Position } from "@/models/Experience";
import {
  careerYears,
  computeCareerStats,
  experienceSpan,
  sortExperiencesDesc,
  sortPositionsDesc,
} from "./career";

const position = (startDate: string, endDate: string | null, title = "Engineer"): Position => ({
  title,
  startDate,
  endDate,
  summary: "",
});

const experience = (code: string, positions: Position[]): Experience => ({
  code,
  orderIndex: 0,
  companyCode: code,
  positions,
});

const datasel = experience("DATASEL", [
  position("01.05.2000", "01.05.2003", "Developer"),
  position("01.06.2003", "01.01.2005", "Architect"),
]);
const jengai = experience("JENGAI", [position("01.12.2022", null, "Director")]);
const now = new Date(2026, 9, 14);

describe("careerYears", () => {
  it("counts whole years since the first position", () => {
    expect(careerYears([jengai, datasel], now)).toBe(26);
  });

  it("is zero without positions", () => {
    expect(careerYears([], now)).toBe(0);
  });
});

describe("computeCareerStats", () => {
  it("counts companies, positions, years and projects", () => {
    expect(computeCareerStats([datasel, jengai], 86, now)).toEqual({
      companies: 2,
      positions: 3,
      years: 26,
      projects: 86,
    });
  });
});

describe("experienceSpan", () => {
  it("spans the earliest start to the latest end", () => {
    expect(experienceSpan(datasel)).toEqual({ start: "01.05.2000", end: "01.01.2005" });
  });

  it("is open-ended while a position is current", () => {
    expect(experienceSpan(jengai)).toEqual({ start: "01.12.2022", end: null });
  });

  it("is null without positions", () => {
    expect(experienceSpan(experience("EMPTY", []))).toBeNull();
  });
});

describe("sorting", () => {
  it("sorts positions newest first", () => {
    expect(sortPositionsDesc(datasel.positions).map((p) => p.title)).toEqual(["Architect", "Developer"]);
  });

  it("sorts experiences by their most recent position", () => {
    expect(sortExperiencesDesc([datasel, jengai]).map((e) => e.code)).toEqual(["JENGAI", "DATASEL"]);
  });

  it("does not mutate the input", () => {
    const input = [datasel, jengai];
    sortExperiencesDesc(input);
    expect(input.map((e) => e.code)).toEqual(["DATASEL", "JENGAI"]);
  });
});
```

- [ ] **Step 6: Run it and confirm it fails**

Run: `npx vitest run src/lib/career.test.ts`
Expected: FAIL — `Failed to resolve import "./career"`.

- [ ] **Step 7: Implement `src/lib/career.ts`**

```ts
import type { Experience, Position } from "@/models/Experience";
import { parseDate } from "./datetimeutils";

const YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

export interface CareerStats {
  companies: number;
  positions: number;
  years: number;
  projects: number;
}

/** Overall period of a company: earliest start, and latest end (null while any position is current). */
export interface Span {
  start: string;
  end: string | null;
}

const time = (value: string | null | undefined): number | undefined => parseDate(value)?.getTime();

/** Whole years since the first position started. */
export function careerYears(experiences: Experience[], now: Date = new Date()): number {
  let earliest = Number.POSITIVE_INFINITY;
  for (const experience of experiences) {
    for (const position of experience.positions ?? []) {
      const start = time(position.startDate);
      if (start !== undefined && start < earliest) earliest = start;
    }
  }
  if (!Number.isFinite(earliest)) return 0;
  return Math.max(0, Math.floor((now.getTime() - earliest) / YEAR_MS));
}

export function computeCareerStats(experiences: Experience[], projectCount: number, now: Date = new Date()): CareerStats {
  return {
    companies: experiences.length,
    positions: experiences.reduce((total, experience) => total + (experience.positions?.length ?? 0), 0),
    years: careerYears(experiences, now),
    projects: projectCount,
  };
}

/** Positions sorted newest first by start date (the input is not mutated). */
export function sortPositionsDesc(positions: Position[]): Position[] {
  return [...positions].sort((a, b) => (time(b.startDate) ?? 0) - (time(a.startDate) ?? 0));
}

const latestStart = (experience: Experience): number =>
  Math.max(0, ...(experience.positions ?? []).map((position) => time(position.startDate) ?? 0));

/** Experiences sorted by their most recent position start, newest first (the input is not mutated). */
export function sortExperiencesDesc(experiences: Experience[]): Experience[] {
  return [...experiences].sort((a, b) => latestStart(b) - latestStart(a));
}

export function experienceSpan(experience: Experience): Span | null {
  let start: string | null = null;
  let startTime = Number.POSITIVE_INFINITY;
  let end: string | null = null;
  let endTime = Number.NEGATIVE_INFINITY;
  let current = false;

  for (const position of experience.positions ?? []) {
    const positionStart = time(position.startDate);
    if (positionStart !== undefined && positionStart < startTime) {
      startTime = positionStart;
      start = position.startDate;
    }
    if (!position.endDate) {
      current = true;
      continue;
    }
    const positionEnd = time(position.endDate);
    if (positionEnd !== undefined && positionEnd > endTime) {
      endTime = positionEnd;
      end = position.endDate;
    }
  }

  if (start === null) return null;
  return { start, end: current ? null : end };
}
```

- [ ] **Step 8: Run it and confirm it passes**

Run: `npx vitest run src/lib/career.test.ts`
Expected: PASS.

---

### Part C — `listview.ts`

- [ ] **Step 9: Write the failing test `src/lib/listview.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import { ALL_CATEGORY, buildCategories, countForCategory, filterItems, getFieldValue } from "./listview";

interface Item {
  code: string;
  title: string;
  group: string;
}

const items: Item[] = [
  { code: "a", title: "Alpha", group: "HIS" },
  { code: "b", title: "Beta", group: "LMS" },
  { code: "c", title: "Gamma", group: "HIS" },
  { code: "d", title: "Delta", group: "" },
];

describe("getFieldValue", () => {
  it("reads a property by name", () => {
    expect(getFieldValue(items[0], "title")).toBe("Alpha");
  });

  it("calls an accessor function", () => {
    expect(getFieldValue(items[0], (item: Item) => item.title.toUpperCase())).toBe("ALPHA");
  });

  it("returns an empty string for missing values", () => {
    expect(getFieldValue(items[0], "missing")).toBe("");
    expect(getFieldValue(items[0], undefined)).toBe("");
    expect(getFieldValue(items[0], () => null)).toBe("");
  });
});

describe("buildCategories", () => {
  it("lists unique non-empty categories after All, alphabetically", () => {
    expect(buildCategories(items, "group")).toEqual([ALL_CATEGORY, "HIS", "LMS"]);
  });

  it("honours a preferred order", () => {
    expect(buildCategories(items, "group", ["LMS"])).toEqual([ALL_CATEGORY, "LMS", "HIS"]);
  });
});

describe("countForCategory", () => {
  it("counts items in a category", () => {
    expect(countForCategory(items, "group", "HIS")).toBe(2);
  });

  it("counts everything for All", () => {
    expect(countForCategory(items, "group", ALL_CATEGORY)).toBe(4);
  });
});

describe("filterItems", () => {
  it("filters by category", () => {
    expect(filterItems(items, { categoryField: "group", category: "HIS" }).map((i) => i.code)).toEqual(["a", "c"]);
  });

  it("searches the given fields, case-insensitively and trimmed", () => {
    expect(filterItems(items, { search: " ALP ", searchFields: ["title"] }).map((i) => i.code)).toEqual(["a"]);
  });

  it("combines category and search", () => {
    expect(
      filterItems(items, { categoryField: "group", category: "HIS", search: "gam", searchFields: ["title"] }).map(
        (i) => i.code,
      ),
    ).toEqual(["c"]);
  });

  it("accepts a function returning field names", () => {
    expect(filterItems(items, { search: "lms", searchFields: () => ["group"] }).map((i) => i.code)).toEqual(["b"]);
  });

  it("returns everything without filters", () => {
    expect(filterItems(items, {})).toHaveLength(4);
  });
});
```

- [ ] **Step 10: Run it and confirm it fails**

Run: `npx vitest run src/lib/listview.test.ts`
Expected: FAIL — `Failed to resolve import "./listview"`.

- [ ] **Step 11: Implement `src/lib/listview.ts`**

```ts
export const ALL_CATEGORY = "All";

/** A property name, or a function that derives the value from an item. */
export type FieldAccessor<T> = string | ((item: T) => string | null | undefined);

export function getFieldValue<T>(item: T, field?: FieldAccessor<T>): string {
  if (!field) return "";
  const value = typeof field === "function" ? field(item) : (item as unknown as Record<string, unknown>)[field];
  return value === null || value === undefined ? "" : String(value);
}

/** "All" followed by the unique non-empty categories, in the preferred order first, then alphabetically. */
export function buildCategories<T>(data: T[], field: FieldAccessor<T>, order: string[] = []): string[] {
  const unique = Array.from(new Set(data.map((item) => getFieldValue(item, field)).filter(Boolean)));
  const rank = (category: string) => {
    const index = order.indexOf(category);
    return index === -1 ? Number.POSITIVE_INFINITY : index;
  };
  unique.sort((a, b) => {
    const diff = rank(a) - rank(b);
    return Number.isNaN(diff) || diff === 0 ? a.localeCompare(b) : diff;
  });
  return [ALL_CATEGORY, ...unique];
}

export function countForCategory<T>(data: T[], field: FieldAccessor<T> | undefined, category: string): number {
  if (!field || category === ALL_CATEGORY) return data.length;
  return data.filter((item) => getFieldValue(item, field) === category).length;
}

export interface FilterOptions<T> {
  categoryField?: FieldAccessor<T>;
  category?: string;
  search?: string;
  /** Fields to search in, or a function returning field names for an item. */
  searchFields?: FieldAccessor<T>[] | ((item: T) => string[]);
}

export function filterItems<T>(
  data: T[],
  { categoryField, category = ALL_CATEGORY, search = "", searchFields = [] }: FilterOptions<T>,
): T[] {
  const query = search.trim().toLowerCase();
  return data.filter((item) => {
    if (categoryField && category !== ALL_CATEGORY && getFieldValue(item, categoryField) !== category) return false;
    if (!query) return true;
    const fields: FieldAccessor<T>[] = typeof searchFields === "function" ? searchFields(item) : searchFields;
    return fields.some((field) => getFieldValue(item, field).toLowerCase().includes(query));
  });
}
```

- [ ] **Step 12: Run it and confirm it passes**

Run: `npx vitest run src/lib/listview.test.ts`
Expected: PASS.

---

### Part D — `motion/math.ts`

- [ ] **Step 13: Write the failing test `src/lib/motion/math.test.ts`**

```ts
import { describe, expect, it } from "vitest";
import {
  clamp,
  countUpValue,
  driftOffset,
  easeOutCubic,
  lerp,
  linePush,
  lineWave,
  magneticOffset,
  skewFromVelocity,
  tiltFromPointer,
  wrap,
} from "./math";

describe("basic maths", () => {
  it("clamps", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(clamp(2, 0, 3)).toBe(2);
  });

  it("interpolates", () => {
    expect(lerp(0, 10, 0.25)).toBe(2.5);
  });

  it("eases out", () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
    expect(easeOutCubic(0.5)).toBeCloseTo(0.875);
    expect(easeOutCubic(2)).toBe(1);
  });

  it("wraps", () => {
    expect(wrap(-1, 5)).toBe(4);
    expect(wrap(7, 5)).toBe(2);
    expect(wrap(3, 0)).toBe(0);
  });
});

describe("scroll effects", () => {
  it("maps velocity to a bounded skew", () => {
    expect(skewFromVelocity(10)).toBeCloseTo(0.6);
    expect(skewFromVelocity(100)).toBe(2.2);
    expect(skewFromVelocity(-100)).toBe(-2.2);
  });

  it("drifts nothing at the viewport centre", () => {
    expect(driftOffset(400, 100, 900, 56)).toBe(0);
  });

  it("drifts by half the amplitude at the top edge", () => {
    expect(driftOffset(-50, 100, 900, 56)).toBe(28);
  });

  it("caps the drift far outside the viewport", () => {
    expect(driftOffset(5000, 100, 900, 56)).toBe(-28);
  });
});

describe("pointer effects", () => {
  it("pushes lines away from the cursor", () => {
    expect(linePush(0, 10)).toBeCloseTo(33.94, 1);
    expect(linePush(0, -10)).toBeCloseTo(-33.94, 1);
    expect(linePush(1000, 0)).toBeCloseTo(0, 5);
  });

  it("keeps the wave within its amplitude", () => {
    expect(lineWave(0, 0, 0, 0)).toBe(0);
    for (let x = 0; x < 2000; x += 37) {
      expect(Math.abs(lineWave(x, 120, 3.3, 5))).toBeLessThanOrEqual(11.5);
    }
  });

  it("tilts towards the pointer", () => {
    expect(tiltFromPointer(0.5, 0.5)).toEqual({ rx: 0, ry: 0 });
    expect(tiltFromPointer(1, 0)).toEqual({ rx: 2.5, ry: 3 });
  });

  it("pulls magnetic elements towards the pointer with a lift", () => {
    expect(magneticOffset(0.5, 0.5)).toEqual({ x: 0, y: -2 });
    expect(magneticOffset(1, 1)).toEqual({ x: 5, y: 2 });
  });
});

describe("count-up", () => {
  it("eases from zero to the end value", () => {
    expect(countUpValue(0, 86)).toBe(0);
    expect(countUpValue(0.5, 86)).toBe(75);
    expect(countUpValue(1, 86)).toBe(86);
  });
});
```

- [ ] **Step 14: Run it and confirm it fails**

Run: `npx vitest run src/lib/motion/math.test.ts`
Expected: FAIL — `Failed to resolve import "./math"`.

- [ ] **Step 15: Implement `src/lib/motion/math.ts`**

```ts
export const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - clamp(t, 0, 1), 3);

/** Positive modulo, for wrapping offsets and indices. */
export const wrap = (value: number, size: number): number => (size <= 0 ? 0 : ((value % size) + size) % size);

/** skewY in degrees for a smoothed scroll velocity (px per frame). */
export const skewFromVelocity = (velocity: number, factor = 0.06, max = 2.2): number =>
  clamp(velocity * factor, -max, max);

/** Horizontal drift (px): 0 when the element's centre is mid-viewport, ±amplitude/2 at the edges and beyond. */
export const driftOffset = (rectTop: number, rectHeight: number, viewportHeight: number, amplitude: number): number => {
  if (viewportHeight <= 0) return 0;
  return clamp(0.5 - (rectTop + rectHeight / 2) / viewportHeight, -0.5, 0.5) * amplitude;
};

/** Vertical push (px) of an ambient-line point at (dx, dy) from the cursor, away from the cursor. */
export const linePush = (dx: number, dy: number, radius = 170, strength = 34): number =>
  (dy >= 0 ? 1 : -1) * strength * Math.exp(-(dx * dx + dy * dy) / (2 * radius * radius));

/** Idle wave of the ambient lines; ripple (0–1) grows it while scrolling fast. */
export const lineWave = (x: number, y: number, time: number, ripple: number): number =>
  Math.sin(x * 0.012 + time * 0.9 + y * 0.01) * (1.5 + 10 * clamp(ripple, 0, 1));

/** Tilt angles (deg) for a pointer at relative position (px, py) within [0, 1]. */
export const tiltFromPointer = (px: number, py: number, maxX = 5, maxY = 6) => ({
  rx: (0.5 - py) * maxX,
  ry: (px - 0.5) * maxY,
});

/** Magnetic pull (px) towards the pointer, plus a small lift. */
export const magneticOffset = (px: number, py: number, strengthX = 10, strengthY = 8, lift = 2) => ({
  x: (px - 0.5) * strengthX,
  y: (py - 0.5) * strengthY - lift,
});

/** Count-up value for an animation progress within [0, 1]. */
export const countUpValue = (progress: number, end: number): number => Math.round(end * easeOutCubic(progress));
```

- [ ] **Step 16: Run it and confirm it passes**

Run: `npx vitest run src/lib/motion/math.test.ts`
Expected: PASS.

---

- [ ] **Step 17: Run all quality gates**

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Expected: no type errors; `0 errors` from lint; all test files pass (colors, format, career, listview, math); build succeeds.

- [ ] **Step 18: Commit**

```bash
git add src/lib
git commit -m "feat(lib): add tested format, career, list-view and motion helpers

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
