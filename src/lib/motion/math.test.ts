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
