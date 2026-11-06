/**
 * Homepage sections use `content-visibility: auto` (src/index.css), so the browser skips
 * their layout and paint during the first load. Skipped sections only have an estimated
 * height, which makes jumps to a section (navigation, footer links, #hash URLs) land in
 * the wrong place. "Settling" renders every section once at its real size by switching
 * content-visibility off; it runs when the page is idle after load, or immediately before
 * a jump.
 */
import { isPrerender } from "@/lib/prerender";

const SETTLED_CLASS = "cv-settled";
let settled = false;
let userScrolled = false;

/** Lays out every section at its real size (idempotent). */
export function settleSections(): void {
  if (settled || typeof document === "undefined") return;
  settled = true;
  document.documentElement.classList.add(SETTLED_CLASS);
}

/** Scrolls to a section after settling, so the position is exact. */
export function scrollToSection(id: string, behavior: ScrollBehavior = "smooth"): void {
  settleSections();
  document.getElementById(id)?.scrollIntoView({ behavior });
}

/**
 * Called once on the homepage. Settling is deferred to the moments that need exact
 * positions, because laying out every section costs a long task: a URL that opens on a
 * #section, a later hash change (for example a footer link) and the jumps made through
 * scrollToSection. Ordinary scrolling renders sections as they approach the viewport.
 */
export function scheduleSectionSettle(): void {
  if (isPrerender || typeof window === "undefined") return;
  const markScrolled = () => {
    userScrolled = true;
  };
  for (const type of ["wheel", "touchstart", "keydown", "mousedown"]) {
    window.addEventListener(type, markScrolled, { once: true, passive: true });
  }

  const alignToHash = (respectUser: boolean) => {
    const hash = decodeURIComponent(window.location.hash.slice(1));
    const target = hash ? document.getElementById(hash) : null;
    if (!target) return;
    settleSections();
    requestAnimationFrame(() => {
      if (!respectUser || !userScrolled) document.getElementById(hash)?.scrollIntoView();
    });
  };

  alignToHash(true); // page opened on a #section
  window.addEventListener("hashchange", () => alignToHash(false));
}
