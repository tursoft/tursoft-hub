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
