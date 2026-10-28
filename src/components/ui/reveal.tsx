import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { isInViewport, isPrerender, startsStatic } from "@/lib/prerender";

type RevealDirection = "up" | "left" | "right" | "scale";

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Animation direction; defaults to fade-up */
  direction?: RevealDirection;
  /** Transition delay in milliseconds (for staggering) */
  delay?: number;
  /** How much of the element must be visible before revealing (0–1) */
  threshold?: number;
}

const directionClass: Record<RevealDirection, string> = {
  up: "",
  left: "reveal-left",
  right: "reveal-right",
  scale: "reveal-scale",
};

/**
 * Reveals its children with a smooth fade/slide when scrolled into view.
 *
 * Prerendered pages start revealed so crawlers and the first paint see the content.
 * After hydration, blocks that are below the fold are hidden again and animate in
 * when the visitor scrolls to them; blocks already on screen stay put.
 * Falls back to always-visible without IntersectionObserver or under reduced motion (CSS).
 */
const Reveal = ({
  children,
  className,
  direction = "up",
  delay = 0,
  threshold = 0.12,
}: RevealProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(startsStatic);

  useEffect(() => {
    const node = ref.current;
    if (!node || isPrerender) return;
    if (typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
    }
    // Hydrated page: keep what is on screen, re-arm the animation for the rest.
    if (startsStatic) {
      if (isInViewport(node)) return;
      setRevealed(false);
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -8% 0px" }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  const style = delay ? ({ "--reveal-delay": `${delay}ms` } as CSSProperties) : undefined;

  return (
    <div
      ref={ref}
      style={style}
      className={cn("reveal", directionClass[direction], revealed && "is-revealed", className)}
    >
      {children}
    </div>
  );
};

export default Reveal;
