/**
 * Prerender mode support.
 *
 * The production build is prerendered with a headless browser (scripts/prerender.mjs),
 * which opens each route with `?prerender=1`. In that mode components render their
 * "complete" state: lists show every item, scroll reveals are visible, counters show
 * their final value. The captured HTML is what crawlers and AI fetchers receive.
 */

type PrerenderTracker = { pending: number; loads: number };

declare global {
  interface Window {
    __prerender?: PrerenderTracker;
  }
}

export const isPrerender: boolean =
  typeof window !== "undefined" && new URLSearchParams(window.location.search).has("prerender");

function tracker(): PrerenderTracker | null {
  if (typeof window === "undefined") return null;
  if (!window.__prerender) window.__prerender = { pending: 0, loads: 0 };
  return window.__prerender;
}

/** Call when an async data load starts. */
export function trackLoadStart(): void {
  const t = tracker();
  if (t) t.pending += 1;
}

/** Call when an async data load finishes (success or failure). */
export function trackLoadEnd(): void {
  const t = tracker();
  if (!t) return;
  t.pending = Math.max(0, t.pending - 1);
  t.loads += 1;
  if (t.pending === 0) {
    document.documentElement.setAttribute("data-prerender-ready", "1");
  } else {
    document.documentElement.removeAttribute("data-prerender-ready");
  }
}
