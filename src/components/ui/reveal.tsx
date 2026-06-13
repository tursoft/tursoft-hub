import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

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
 * Falls back to always-visible when IntersectionObserver is unavailable
 * or the user prefers reduced motion (handled in CSS).
 */
const Reveal = ({
  children,
  className,
  direction = "up",
  delay = 0,
  threshold = 0.12,
}: RevealProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (typeof IntersectionObserver === "undefined") {
      setRevealed(true);
      return;
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
