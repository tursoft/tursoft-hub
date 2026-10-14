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
  frame = 0;
  if (!running) return;
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

  // A throwing listener must not end the loop for everyone else.
  listeners.forEach((listener) => {
    try {
      listener(state);
    } catch (error) {
      console.error(error);
    }
  });
  // Re-arm only while running, and not if a listener already restarted the loop (which queued its own frame).
  if (running && frame === 0) frame = requestAnimationFrame(tick);
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
