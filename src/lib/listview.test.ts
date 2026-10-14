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
