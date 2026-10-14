import { describe, expect, it } from "vitest";
import { ENTITY_HEX_COLORS, ENTITY_TAG_TONE, getEntityHexColor } from "./colors";

describe("entity colours", () => {
  it("matches the Quiet Swiss palette", () => {
    expect(ENTITY_HEX_COLORS).toEqual({
      experience: "#7cc4ff",
      project: "#5ec8f2",
      education: "#f5c66b",
      customer: "#f87b9b",
      partner: "#5fd6bd",
    });
  });

  it("maps every entity to a tag tone", () => {
    expect(ENTITY_TAG_TONE).toEqual({
      experience: "exp",
      project: "proj",
      education: "edu",
      customer: "cust",
      partner: "part",
    });
  });

  it("falls back to the project colour for unknown types", () => {
    expect(getEntityHexColor("unknown" as never)).toBe("#5ec8f2");
  });
});
