import { useEffect, useRef, useState } from 'react';
import { isInViewport, isPrerender, startsStatic } from '@/lib/prerender';

interface AnimatedCounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  className?: string;
}

/**
 * Counts up to `end` when scrolled into view.
 *
 * Prerendered and hydrating pages start at the final value so the HTML carries the
 * real number. After hydration, counters below the fold count up when reached;
 * counters already on screen keep their value.
 */
const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  end,
  duration = 2000,
  suffix = '',
  className = ''
}) => {
  const [count, setCount] = useState(startsStatic ? end : 0);
  const [isVisible, setIsVisible] = useState(false);
  const countRef = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(isPrerender);

  useEffect(() => {
    const currentRef = countRef.current;
    if (!currentRef || isPrerender) return;
    if (startsStatic && isInViewport(currentRef)) {
      hasAnimated.current = true; // already showing the final value on screen
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated.current) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(currentRef);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (isVisible && !hasAnimated.current) {
      hasAnimated.current = true;
      let startTime: number | null = null;

      const animate = (currentTime: number) => {
        if (startTime === null) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        setCount(Math.floor(easeOutQuart * end));
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };

      requestAnimationFrame(animate);
    }
  }, [isVisible, end, duration]);

  // Once the animation has run (or was skipped), follow later changes to `end`.
  const shown = hasAnimated.current && !isVisible ? end : count;

  return (
    <span ref={countRef} className={className}>
      {isPrerender ? end : shown}{suffix}
    </span>
  );
};

export default AnimatedCounter;
