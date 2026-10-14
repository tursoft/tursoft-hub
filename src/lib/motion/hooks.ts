import { useCallback, useEffect, useRef, useState, useSyncExternalStore, type FocusEvent, type RefObject } from "react";
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
    // A transformed <main> contains position:fixed children (the maximised map): drop the skew at once while scroll is locked.
    if (document.body.style.overflow === "hidden") {
      skew.current = 0;
      element.style.transform = "";
      return;
    }
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
      (entries) => {
        const entry = entries[entries.length - 1];
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
 * on touch, a tap on the card (or the hint's button, via `toggle`) toggles the expanded state. The touch card
 * itself has no button role, so a screen reader reaches the toggle and the details link as real buttons.
 */
export function useExpandableCard(onOpen: () => void) {
  const fine = useFinePointer();
  const [expanded, setExpanded] = useState(false);
  const toggle = () => setExpanded((value) => !value);
  const surfaceProps = fine
    ? {
        onMouseEnter: () => setExpanded(true),
        onMouseLeave: () => setExpanded(false),
        onFocus: (event: FocusEvent<HTMLElement>) => {
          // Only keyboard focus expands; a click, or Radix restoring focus after a dialog closes, must not.
          // Check the focused element itself: focus bubbles from inner links, and :focus-visible matches only it.
          if ((event.target as Element).matches(":focus-visible")) setExpanded(true);
        },
        onBlur: () => setExpanded(false),
        onActivate: onOpen,
      }
    : { onClick: toggle };
  return { expanded, fine, toggle, surfaceProps };
}
