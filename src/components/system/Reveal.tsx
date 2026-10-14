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
      (entries) => {
        const entry = entries[entries.length - 1];
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
