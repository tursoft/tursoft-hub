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
