import { describe, expect, it } from "vitest";
import type { Experience } from "@/models/Experience";
import type { ProjectEntry } from "@/models/Project";
import { countDomainUsage } from "./domains";

const project = (code: string, domainCodes: string[]): ProjectEntry => ({
  id: 0,
  code,
  orderIndex: 0,
  title: code,
  domainCodes,
});

const experience = (companyCode: string, positionDomains: string[][]): Experience => ({
  code: companyCode,
  orderIndex: 0,
  companyCode,
  positions: positionDomains.map((domainCodes) => ({
    title: "Engineer",
    startDate: "01.01.2000",
    endDate: null,
    summary: "",
    domainCodes,
  })),
});

describe("countDomainUsage", () => {
  const projects = [project("A", ["healthcareit"]), project("B", ["healthcareit", "elearning"]), project("C", [])];
  const experiences = [
    experience("DATASEL", [["healthcareit"], ["elearning"]]),
    experience("HALICI", [["elearning"]]),
    experience("ERC", [[]]),
  ];

  it("counts projects and companies that list the domain", () => {
    expect(countDomainUsage("healthcareit", projects, experiences)).toEqual({ projects: 2, companies: 1 });
    expect(countDomainUsage("elearning", projects, experiences)).toEqual({ projects: 1, companies: 2 });
  });

  it("returns zeros for an unused domain", () => {
    expect(countDomainUsage("gaming", projects, experiences)).toEqual({ projects: 0, companies: 0 });
  });
});
