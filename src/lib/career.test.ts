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
