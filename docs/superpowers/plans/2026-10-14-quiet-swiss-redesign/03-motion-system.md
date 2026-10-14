# Task 3: Motion system — engine, hooks, Reveal, CountUp, AmbientBackdrop

Part of [the Quiet Swiss plan](../2026-10-14-quiet-swiss-redesign.md). Read its **Global Constraints** first.

**Files:**
- Create: `src/lib/motion/engine.ts`
- Create: `src/lib/motion/hooks.ts`
- Create: `src/components/system/Reveal.tsx`
- Create: `src/components/system/CountUp.tsx`
- Create: `src/components/system/AmbientBackdrop.tsx`
- Modify: `src/App.tsx`
- Delete: `src/components/BackgroundAnimation.tsx`

**Interfaces:**
- Consumes (Task 2): `lerp`, `skewFromVelocity`, `driftOffset`, `tiltFromPointer`, `magneticOffset`, `countUpValue`, `linePush`, `lineWave` from `src/lib/motion/math.ts`. CSS classes from Task 1: `reveal`, `is-revealed`, `is-tilting`, `ambient*`.
- Produces:
  - `engine.ts`: `MotionState`, `FrameListener`, `subscribeFrame(listener): () => void`, `getMotionState()`
  - `hooks.ts`: `REDUCED_MOTION_QUERY`, `FINE_POINTER_QUERY`, `DESKTOP_QUERY`, `useMediaQuery(query)`, `usePrefersReducedMotion()`, `useFinePointer()`, `useFrame(listener, enabled = true)`, `useScrollSkew(ref)`, `useDrift(ref, amplitude)`, `useInView(ref, { threshold?, once?, rootMargin? })`, `useSurfacePointer(ref, { enabled?, tilt? })`, `useMagnetic(ref, enabled = true)`, `useExpandableCard(onOpen) → { expanded, fine, surfaceProps }`
  - `Reveal` (default): `{ children, className?, index? }` — fades/slides in on entering the viewport, replays when re-entering from below, staggers by `index` (75 ms each, max 10).
  - `CountUp` (default): `{ end, suffix?, duration = 1400, className? }`
  - `AmbientBackdrop` (default): no props.

Unit tests for this task's logic already exist (Task 2 covers the maths). These modules are DOM glue, verified by the gates and a visual check.

- [ ] **Step 1: Create `src/lib/motion/engine.ts`**

```ts
import { lerp } from "./math";

/** Shared animation-loop state, updated once per frame. */
export interface MotionState {
  /** Smoothed pointer position in viewport px (meaningful only while pointerActive). */
  pointerX: number;
  pointerY: number;
  /** Latest raw pointer position. */
  targetX: number;
  targetY: number;
  /** False until a mouse/pen moves, and after it leaves the window. Touch never activates it. */
  pointerActive: boolean;
  scrollY: number;
  /** Smoothed scroll velocity in px per frame; positive while scrolling down. */
  velocity: number;
  /** Seconds since the loop first started. */
  time: number;
  /** Seconds since the previous frame (capped at 0.1). */
  delta: number;
  width: number;
  height: number;
}

export type FrameListener = (state: Readonly<MotionState>) => void;

const POINTER_SMOOTHING = 0.12;
const VELOCITY_SMOOTHING = 0.15;

const state: MotionState = {
  pointerX: -9999,
  pointerY: -9999,
  targetX: -9999,
  targetY: -9999,
  pointerActive: false,
  scrollY: 0,
  velocity: 0,
  time: 0,
  delta: 0,
  width: 0,
  height: 0,
};

const listeners = new Set<FrameListener>();
let frame = 0;
let running = false;
let attached = false;
let startTimestamp = 0;
let lastTimestamp = 0;
let lastScrollY = 0;

function handlePointerMove(event: PointerEvent) {
  if (event.pointerType === "touch") return;
  state.targetX = event.clientX;
  state.targetY = event.clientY;
  if (!state.pointerActive) {
    state.pointerActive = true;
    state.pointerX = event.clientX;
    state.pointerY = event.clientY;
  }
}

function handlePointerOut(event: MouseEvent) {
  if (event.relatedTarget === null) state.pointerActive = false;
}

function handleResize() {
  state.width = window.innerWidth;
  state.height = window.innerHeight;
}

function handleVisibility() {
  if (document.hidden) stop();
  else if (listeners.size > 0) start();
}

function tick(timestamp: number) {
  if (!startTimestamp) startTimestamp = timestamp;
  state.delta = lastTimestamp ? Math.min((timestamp - lastTimestamp) / 1000, 0.1) : 0;
  lastTimestamp = timestamp;
  state.time = (timestamp - startTimestamp) / 1000;

  if (state.pointerActive) {
    state.pointerX = lerp(state.pointerX, state.targetX, POINTER_SMOOTHING);
    state.pointerY = lerp(state.pointerY, state.targetY, POINTER_SMOOTHING);
  }

  const scrollY = window.scrollY;
  state.velocity = lerp(state.velocity, scrollY - lastScrollY, VELOCITY_SMOOTHING);
  lastScrollY = scrollY;
  state.scrollY = scrollY;

  listeners.forEach((listener) => listener(state));
  frame = requestAnimationFrame(tick);
}

function start() {
  if (running) return;
  running = true;
  lastTimestamp = 0;
  lastScrollY = window.scrollY;
  handleResize();
  frame = requestAnimationFrame(tick);
}

function stop() {
  running = false;
  cancelAnimationFrame(frame);
}

function attach() {
  if (attached) return;
  attached = true;
  window.addEventListener("pointermove", handlePointerMove, { passive: true });
  window.addEventListener("mouseout", handlePointerOut);
  window.addEventListener("resize", handleResize);
  document.addEventListener("visibilitychange", handleVisibility);
}

function detach() {
  if (!attached) return;
  attached = false;
  window.removeEventListener("pointermove", handlePointerMove);
  window.removeEventListener("mouseout", handlePointerOut);
  window.removeEventListener("resize", handleResize);
  document.removeEventListener("visibilitychange", handleVisibility);
}

/** Adds a per-frame listener to the shared animation loop; returns the unsubscribe function. */
export function subscribeFrame(listener: FrameListener): () => void {
  listeners.add(listener);
  attach();
  if (!document.hidden) start();
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stop();
      detach();
    }
  };
}

export function getMotionState(): Readonly<MotionState> {
  return state;
}
```

- [ ] **Step 2: Create `src/lib/motion/hooks.ts`**

```ts
import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type RefObject } from "react";
import { subscribeFrame, type FrameListener, type MotionState } from "./engine";
import { driftOffset, lerp, magneticOffset, skewFromVelocity, tiltFromPointer } from "./math";

export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
export const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";
export const DESKTOP_QUERY = "(min-width: 1025px)";

/** Live result of a CSS media query. */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

export const usePrefersReducedMotion = (): boolean => useMediaQuery(REDUCED_MOTION_QUERY);

export const useFinePointer = (): boolean => useMediaQuery(FINE_POINTER_QUERY);

/** Runs `listener` on every frame of the shared motion loop while `enabled`. */
export function useFrame(listener: FrameListener, enabled = true): void {
  const listenerRef = useRef(listener);
  useEffect(() => {
    listenerRef.current = listener;
  });
  useEffect(() => {
    if (!enabled) return;
    return subscribeFrame((state) => listenerRef.current(state));
  }, [enabled]);
}

/** Leans the element (skewY) with the smoothed scroll velocity; the transform is cleared at rest. */
export function useScrollSkew(ref: RefObject<HTMLElement>): void {
  const reduce = usePrefersReducedMotion();
  const skew = useRef(0);
  useFrame((state) => {
    const element = ref.current;
    if (!element) return;
    skew.current = lerp(skew.current, skewFromVelocity(state.velocity), 0.2);
    element.style.transform = Math.abs(skew.current) > 0.02 ? `skewY(${skew.current.toFixed(3)}deg)` : "";
  }, !reduce);
  useEffect(() => {
    if (reduce && ref.current) ref.current.style.transform = "";
  }, [reduce, ref]);
}

// All drifting elements share one frame listener so layout reads happen before style writes.
const driftTargets = new Map<HTMLElement, number>();
let stopDrift: (() => void) | null = null;

function driftFrame(state: Readonly<MotionState>) {
  const updates: Array<[HTMLElement, number]> = [];
  driftTargets.forEach((amplitude, element) => {
    const rect = element.getBoundingClientRect();
    if (rect.bottom < -200 || rect.top > state.height + 200) return;
    updates.push([element, driftOffset(rect.top, rect.height, state.height, amplitude)]);
  });
  for (const [element, x] of updates) {
    element.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
  }
}

function registerDrift(element: HTMLElement, amplitude: number): () => void {
  driftTargets.set(element, amplitude);
  if (!stopDrift) stopDrift = subscribeFrame(driftFrame);
  return () => {
    driftTargets.delete(element);
    element.style.transform = "";
    if (driftTargets.size === 0 && stopDrift) {
      stopDrift();
      stopDrift = null;
    }
  };
}

/** Moves the element sideways as it travels through the viewport (desktop widths only). */
export function useDrift(ref: RefObject<HTMLElement>, amplitude: number): void {
  const reduce = usePrefersReducedMotion();
  const desktop = useMediaQuery(DESKTOP_QUERY);
  useEffect(() => {
    const element = ref.current;
    if (!element || reduce || !desktop || amplitude === 0) return;
    return registerDrift(element, amplitude);
  }, [ref, amplitude, reduce, desktop]);
}

interface InViewOptions {
  threshold?: number;
  once?: boolean;
  rootMargin?: string;
}

/** True while the element intersects the viewport (or forever after the first time, with `once`). */
export function useInView(
  ref: RefObject<Element>,
  { threshold = 0.1, once = false, rootMargin = "0px" }: InViewOptions = {},
): boolean {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, threshold, once, rootMargin]);
  return inView;
}

interface SurfacePointerOptions {
  enabled?: boolean;
  tilt?: boolean;
}

/** Cursor spotlight (--mx/--my) and optional 3D tilt (--rx/--ry + .is-tilting) for interactive surfaces. */
export function useSurfacePointer(
  ref: RefObject<HTMLElement>,
  { enabled = true, tilt = true }: SurfacePointerOptions = {},
): void {
  const fine = useFinePointer();
  const reduce = usePrefersReducedMotion();
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled || !fine) return;
    const allowTilt = tilt && !reduce;
    const handleMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      element.style.setProperty("--mx", `${x}px`);
      element.style.setProperty("--my", `${y}px`);
      if (!allowTilt || rect.width === 0 || rect.height === 0) return;
      const { rx, ry } = tiltFromPointer(x / rect.width, y / rect.height);
      element.style.setProperty("--rx", `${rx.toFixed(2)}deg`);
      element.style.setProperty("--ry", `${ry.toFixed(2)}deg`);
      element.classList.add("is-tilting");
    };
    const handleLeave = () => {
      element.classList.remove("is-tilting");
      element.style.setProperty("--rx", "0deg");
      element.style.setProperty("--ry", "0deg");
    };
    element.addEventListener("pointermove", handleMove);
    element.addEventListener("pointerleave", handleLeave);
    return () => {
      element.removeEventListener("pointermove", handleMove);
      element.removeEventListener("pointerleave", handleLeave);
      handleLeave();
    };
  }, [ref, enabled, tilt, fine, reduce]);
}

/** Pulls the element slightly towards the cursor while it is hovered (fine pointers only). */
export function useMagnetic(ref: RefObject<HTMLElement>, enabled = true): void {
  const fine = useFinePointer();
  const reduce = usePrefersReducedMotion();
  useEffect(() => {
    const element = ref.current;
    if (!element || !enabled || !fine || reduce) return;
    const handleMove = (event: PointerEvent) => {
      const rect = element.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const { x, y } = magneticOffset((event.clientX - rect.left) / rect.width, (event.clientY - rect.top) / rect.height);
      element.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    };
    const handleLeave = () => {
      element.style.transform = "";
    };
    element.addEventListener("pointermove", handleMove);
    element.addEventListener("pointerleave", handleLeave);
    return () => {
      element.removeEventListener("pointermove", handleMove);
      element.removeEventListener("pointerleave", handleLeave);
      handleLeave();
    };
  }, [ref, enabled, fine, reduce]);
}

/**
 * Expandable cards: on fine pointers hover or keyboard focus expands and activation opens details;
 * on touch, a tap toggles the expanded state.
 */
export function useExpandableCard(onOpen: () => void) {
  const fine = useFinePointer();
  const [expanded, setExpanded] = useState(false);
  const surfaceProps = fine
    ? {
        onMouseEnter: () => setExpanded(true),
        onMouseLeave: () => setExpanded(false),
        onFocus: () => setExpanded(true),
        onBlur: () => setExpanded(false),
        onActivate: onOpen,
      }
    : { onActivate: () => setExpanded((value) => !value) };
  return { expanded, fine, surfaceProps };
}
```

- [ ] **Step 3: Create `src/components/system/Reveal.tsx`**

```tsx
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

const MAX_STAGGER = 10;

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Position in a group; each step delays the reveal by 75 ms. */
  index?: number;
}

/** Fades and lifts its children in when they enter the viewport; replays when re-entering from below. */
export default function Reveal({ children, className, index = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setRevealed(true);
        else if (entry.boundingClientRect.top > window.innerHeight * 0.9) setRevealed(false);
      },
      { threshold: 0.05 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ "--i": Math.min(index, MAX_STAGGER) } as CSSProperties}
      className={cn("reveal", revealed && "is-revealed", className)}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 4: Create `src/components/system/CountUp.tsx`**

```tsx
import { useEffect, useRef, useState } from "react";
import { useInView, usePrefersReducedMotion } from "@/lib/motion/hooks";
import { countUpValue } from "@/lib/motion/math";

interface CountUpProps {
  end: number;
  suffix?: string;
  duration?: number;
  className?: string;
}

/** Counts from 0 to `end` the first time the number is mostly visible. */
export default function CountUp({ end, suffix = "", duration = 1400, className }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { threshold: 0.6, once: true });
  const reduce = usePrefersReducedMotion();
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    if (reduce || end === 0) {
      setValue(end);
      return;
    }
    let frame = 0;
    const startedAt = performance.now();
    const step = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      setValue(countUpValue(progress, end));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [inView, reduce, end, duration]);

  return (
    <span ref={ref} className={className}>
      {value}
      {suffix}
    </span>
  );
}
```

- [ ] **Step 5: Create `src/components/system/AmbientBackdrop.tsx`**

```tsx
import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import type { MotionState } from "@/lib/motion/engine";
import { useFinePointer, useFrame, usePrefersReducedMotion } from "@/lib/motion/hooks";
import { linePush, lineWave } from "@/lib/motion/math";

const LINE_GAP = 48;
const SAMPLE_STEP = 10;
const HIGHLIGHT_RADIUS = 170;
const DUST_COUNT = 34;

interface DustParticle {
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  drift: number;
}

const createDust = (): DustParticle[] =>
  Array.from({ length: DUST_COUNT }, () => ({
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 1 + Math.random() * 2,
    duration: 18 + Math.random() * 26,
    delay: -Math.random() * 40,
    opacity: 0.15 + Math.random() * 0.4,
    drift: (Math.random() - 0.5) * 60,
  }));

/** Horizontal hairlines that bend away from the cursor and light up around it; they ripple while scrolling fast. */
function drawLines(context: CanvasRenderingContext2D, state: Readonly<MotionState>) {
  const { width, height, pointerX, pointerY, pointerActive } = state;
  context.clearRect(0, 0, width, height);
  const ripple = Math.min(1, Math.abs(state.velocity) / 30);
  const offset = (state.scrollY * 0.25) % LINE_GAP;

  for (let y = -offset; y < height + LINE_GAP; y += LINE_GAP) {
    context.beginPath();
    for (let x = 0; x <= width; x += SAMPLE_STEP) {
      const push = pointerActive ? linePush(x - pointerX, y - pointerY, HIGHLIGHT_RADIUS) : 0;
      const pointY = y + push + lineWave(x, y, state.time, ripple);
      if (x === 0) context.moveTo(x, pointY);
      else context.lineTo(x, pointY);
    }
    context.strokeStyle = "rgba(250, 250, 250, 0.045)";
    context.lineWidth = 1;
    context.stroke();

    if (pointerActive && Math.abs(y - pointerY) < HIGHLIGHT_RADIUS * 2.2) {
      const glow = context.createRadialGradient(pointerX, pointerY, 0, pointerX, pointerY, HIGHLIGHT_RADIUS * 2);
      glow.addColorStop(0, "rgba(94, 200, 242, 0.55)");
      glow.addColorStop(0.5, "rgba(94, 200, 242, 0.18)");
      glow.addColorStop(1, "rgba(94, 200, 242, 0)");
      context.strokeStyle = glow;
      context.lineWidth = 1.2;
      context.stroke();
    }
  }
}

/** Fixed ambient layer: drifting glows, halo, dot grid, cursor-reactive lines and flashlight, light beams, dust, grain. */
export default function AmbientBackdrop() {
  const reduce = usePrefersReducedMotion();
  const fine = useFinePointer();
  const interactive = fine && !reduce;
  const rootRef = useRef<HTMLDivElement>(null);
  const glowsRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const dust = useMemo(createDust, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!interactive || !canvas) return;
    const resize = () => {
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(window.innerWidth * ratio);
      canvas.height = Math.round(window.innerHeight * ratio);
      const context = canvas.getContext("2d");
      context?.setTransform(ratio, 0, 0, ratio, 0, 0);
      contextRef.current = context;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      contextRef.current = null;
    };
  }, [interactive]);

  useFrame((state) => {
    const glows = glowsRef.current;
    if (glows) {
      const pointerShiftX = state.pointerActive && state.width ? (state.pointerX / state.width - 0.5) * 40 : 0;
      const pointerShiftY = state.pointerActive && state.height ? (state.pointerY / state.height - 0.5) * 40 : 0;
      // Glows sway with scroll but never leave the viewport.
      const swayX = Math.cos(state.scrollY * 0.001) * 30 - 30;
      const swayY = Math.sin(state.scrollY * 0.0015) * 70;
      glows.style.transform = `translate3d(${(pointerShiftX + swayX).toFixed(1)}px, ${(pointerShiftY + swayY).toFixed(1)}px, 0)`;
    }

    const root = rootRef.current;
    if (root && interactive) {
      root.style.setProperty("--mx", `${state.pointerActive ? state.pointerX.toFixed(1) : -999}px`);
      root.style.setProperty("--my", `${state.pointerActive ? state.pointerY.toFixed(1) : -999}px`);
    }

    const context = contextRef.current;
    if (context) drawLines(context, state);
  }, !reduce);

  return (
    <div ref={rootRef} className="ambient" aria-hidden="true">
      <div ref={glowsRef} className="ambient-glows">
        <div className="ambient-glow ambient-glow-1" />
        <div className="ambient-glow ambient-glow-2" />
        <div className="ambient-glow ambient-glow-3" />
        <div className="ambient-glow ambient-glow-4" />
      </div>
      <div className="ambient-halo" />
      <div className="ambient-grid" />
      {interactive && <div className="ambient-grid-hot" />}
      {interactive && <canvas ref={canvasRef} className="ambient-lines" />}
      {!reduce && (
        <>
          <div className="ambient-beam" />
          <div className="ambient-beam ambient-beam-2" />
          <div className="ambient-dust">
            {dust.map((particle, index) => (
              <i
                key={index}
                className="ambient-dust-particle"
                style={
                  {
                    left: `${particle.left}%`,
                    top: `${particle.top}%`,
                    width: particle.size,
                    height: particle.size,
                    "--dur": `${particle.duration}s`,
                    "--delay": `${particle.delay}s`,
                    "--o": particle.opacity,
                    "--dx": `${particle.drift}px`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        </>
      )}
      <div className="ambient-grain" />
    </div>
  );
}
```

- [ ] **Step 6: Mount the backdrop in `src/App.tsx`**

Replace the whole file with:

```tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AmelBookPrivacy from "./pages/AmelBookPrivacy";
import AmbientBackdrop from "./components/system/AmbientBackdrop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider delayDuration={200}>
      <div className="dark">
        <AmbientBackdrop />
        <Toaster />
        <Sonner />
        {/* Page content sits above the fixed ambient layer. */}
        <div className="relative z-[1]">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/privacy/amelbook" element={<AmelBookPrivacy />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </div>
      </div>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
```

- [ ] **Step 7: Delete the old particle canvas**

```bash
git rm src/components/BackgroundAnimation.tsx
```

Confirm `git grep -n "BackgroundAnimation" -- src` prints nothing.

- [ ] **Step 8: Run all quality gates**

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Expected: all pass (`0 errors` from lint).

- [ ] **Step 9: Visual check**

Start `npm run dev -- --port 5199 --strictPort` in the background, then run
`node docs/superpowers/tools/shoot.cjs .superpowers/shots/task-03 http://localhost:5199/` and open `.superpowers/shots/task-03/desktop_00.png`.
Expected: behind the (still old) hero there are soft cyan/indigo glows, a faint dot grid fading out below the nav area, faint horizontal hairlines, and no browser console errors. Stop the dev server.

- [ ] **Step 10: Commit**

```bash
git add -A
git commit -m "feat(motion): add shared animation engine, motion hooks, reveal, count-up and ambient backdrop

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```
