/**
 * Prerender and hydration support.
 *
 * Build time: scripts/prerender.mjs opens each route with `?prerender=1` in headless
 * Chrome. Components render their static, complete state; data sections record their
 * final state through `useSnapshotState` (see src/hooks/use-snapshot-state.ts), and the
 * script embeds that state in the page: inline as <script id="__PRERENDER_STATE__"> when
 * it is small, otherwise as a preloaded JSON file named by <meta name="prerender-state">.
 *
 * Visit time: when the page arrives prerendered (root has children and state is embedded
 * or referenced), `isHydrating` is true and main.tsx awaits `loadPrerenderState()` first.
 * Components start from the recorded state so the first client render matches the HTML
 * exactly, React hydrates instead of re-rendering, and animations resume after mount.
 */

type PrerenderTracker = { pending: number; loads: number };

declare global {
  interface Window {
    __prerender?: PrerenderTracker;
    __prerenderState?: Record<string, unknown>;
  }
}

const STATE_ELEMENT_ID = "__PRERENDER_STATE__";

export const isPrerender: boolean =
  typeof window !== "undefined" && new URLSearchParams(window.location.search).has("prerender");

const STATE_META_NAME = "prerender-state";

const isPrerenderedPage: boolean =
  typeof document !== "undefined" && !isPrerender && !!document.getElementById("root")?.hasChildNodes();
const inlineStateElement = isPrerenderedPage ? document.getElementById(STATE_ELEMENT_ID) : null;
const stateUrl: string | null = isPrerenderedPage
  ? document.querySelector(`meta[name="${STATE_META_NAME}"]`)?.getAttribute("content") ?? null
  : null;

function parseInlineState(): Record<string, unknown> | null {
  if (!inlineStateElement) return null;
  try {
    return JSON.parse(inlineStateElement.textContent || "{}") as Record<string, unknown>;
  } catch {
    return null;
  }
}

let embeddedState: Record<string, unknown> | null = parseInlineState();

/** True when this page load hydrates prerendered HTML. */
export const isHydrating: boolean = isPrerenderedPage && (embeddedState !== null || stateUrl !== null);

/**
 * Makes the prerender state available before hydration. Inline state is ready at once;
 * external state is fetched (the page preloads it in parallel with the scripts).
 * Resolves false when the state cannot be loaded; the caller then renders from scratch.
 */
export async function loadPrerenderState(): Promise<boolean> {
  if (!isHydrating) return false;
  if (embeddedState) return true;
  if (!stateUrl) return false;
  try {
    const res = await fetch(stateUrl);
    if (!res.ok) return false;
    embeddedState = (await res.json()) as Record<string, unknown>;
    return true;
  } catch {
    return false;
  }
}

/** Components that animate start in their final, static state in both of these modes. */
export const startsStatic: boolean = isPrerender || isHydrating;

/** Value recorded for `key` during prerender, if this load is hydrating. */
export function readSnapshot<T>(key: string): T | undefined {
  if (!embeddedState || !(key in embeddedState)) return undefined;
  return embeddedState[key] as T;
}

/** Records a state value during prerender so the build can embed it. */
export function recordSnapshot(key: string, value: unknown): void {
  if (!isPrerender || typeof window === "undefined") return;
  (window.__prerenderState ??= {})[key] = value;
}

/** True when the element is at least partly inside the viewport right now. */
export function isInViewport(el: Element): boolean {
  const r = el.getBoundingClientRect();
  return r.bottom > 0 && r.top < (window.innerHeight || document.documentElement.clientHeight);
}

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
