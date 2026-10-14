import { describe, expect, it } from "vitest";
import experiencesData from "@/data/experiences.json";
import { CAREER, CV_LINKS, NAV_ITEMS } from "./site";

describe("site constants", () => {
  it("links to every page section in page order", () => {
    expect(NAV_ITEMS.map((item) => item.id)).toEqual([
      "about",
      "experience",
      "domains",
      "skills",
      "portfolio",
      "customers",
      "references",
      "education",
      "map",
      "timeline",
      "contact",
    ]);
  });

  it("derives career numbers from experiences.json", () => {
    const items = experiencesData.items;
    expect(CAREER.companies).toBe(items.length);
    expect(CAREER.positions).toBe(items.reduce((total, item) => total + item.positions.length, 0));
    expect(CAREER.years).toBeGreaterThanOrEqual(26);
  });

  it("exposes both CV downloads", () => {
    expect(CV_LINKS.compact).toMatch(/\.pdf$/);
    expect(CV_LINKS.detailed).toMatch(/\.pdf$/);
  });
});
