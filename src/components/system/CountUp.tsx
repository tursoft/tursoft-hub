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
  const [value, setValue] = useState(reduce ? end : 0);

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
