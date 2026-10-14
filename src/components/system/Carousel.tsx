import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { wrap } from "@/lib/motion/math";
import { cn } from "@/lib/utils";

const SWIPE_THRESHOLD = 40;
const DRAG_START = 6;
/** Up to this many slides get one progress bar each; more get a counter and a progress line. */
const BAR_LIMIT = 12;

interface CarouselProps<T> {
  items: T[];
  getKey: (item: T, index: number) => string;
  renderItem: (item: T, state: { active: boolean }) => ReactNode;
  ariaLabel: string;
  /** CSS width of one slide; defaults to min(440px, 82vw). */
  slideWidth?: string;
}

/**
 * Flat carousel: the active slide is centred and its neighbours dimmed. Moves with swipe/drag,
 * arrow keys, the previous/next buttons or the progress bars. Clicking a dimmed slide brings it to the centre.
 */
export default function Carousel<T>({ items, getKey, renderItem, ariaLabel, slideWidth }: CarouselProps<T>) {
  const [index, setIndex] = useState(0);
  const [dragX, setDragX] = useState(0);
  const drag = useRef<{ startX: number; pointerId: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const count = items.length;

  useEffect(() => {
    if (index > count - 1) setIndex(0);
  }, [count, index]);

  const go = (delta: number) => setIndex((current) => wrap(current + delta, count));

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    drag.current = { startX: event.clientX, pointerId: event.pointerId, moved: false };
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    const dx = event.clientX - current.startX;
    if (!current.moved && Math.abs(dx) > DRAG_START) {
      current.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (current.moved) setDragX(dx);
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    const current = drag.current;
    if (!current || current.pointerId !== event.pointerId) return;
    drag.current = null;
    if (current.moved) {
      suppressClick.current = true;
      // A mouse drag is followed by a click right after pointerup; a touch swipe produces none, so the flag must not linger.
      window.setTimeout(() => {
        suppressClick.current = false;
      }, 0);
      const dx = event.clientX - current.startX;
      if (Math.abs(dx) > SWIPE_THRESHOLD) go(dx < 0 ? 1 : -1);
    }
    setDragX(0);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      go(1);
    }
  };

  const rootStyle = slideWidth ? ({ "--slide-w": slideWidth } as CSSProperties) : undefined;
  const trackStyle = { "--index": index, "--drag": `${dragX}px` } as CSSProperties;

  return (
    <div
      className="carousel"
      style={rootStyle}
      role="region"
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
    >
      <div
        className="carousel-viewport"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(event) => {
          if (!suppressClick.current) return;
          suppressClick.current = false;
          event.stopPropagation();
          event.preventDefault();
        }}
      >
        <div className={cn("carousel-track", dragX !== 0 && "is-dragging")} style={trackStyle}>
          {items.map((item, itemIndex) => {
            const active = itemIndex === index;
            return (
              <div
                key={getKey(item, itemIndex)}
                className={cn("carousel-slide", active && "is-active")}
                // Keyboard focus on a dimmed slide centres it first, so Enter opens the slide the user sees as active.
                // Keyboard focus only: a mouse/touch press also focuses the slide, and centring then would let that click open it.
                onFocusCapture={(event) => {
                  if ((event.target as Element).matches(":focus-visible")) setIndex(itemIndex);
                }}
                onClickCapture={(event) => {
                  if (active) return;
                  event.stopPropagation();
                  event.preventDefault();
                  setIndex(itemIndex);
                }}
              >
                {renderItem(item, { active })}
              </div>
            );
          })}
        </div>
      </div>

      {count > 1 && (
        <div className="carousel-controls">
          <Button variant="secondary" size="icon" magnetic aria-label="Previous" className="max-sm:hidden" onClick={() => go(-1)}>
            <ChevronLeft />
          </Button>
          <CarouselProgress index={index} count={count} onSelect={setIndex} />
          <Button variant="secondary" size="icon" magnetic aria-label="Next" className="max-sm:hidden" onClick={() => go(1)}>
            <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}

function CarouselProgress({ index, count, onSelect }: { index: number; count: number; onSelect: (index: number) => void }) {
  if (count <= BAR_LIMIT) {
    return (
      <div className="carousel-bars">
        {Array.from({ length: count }, (_, barIndex) => (
          <button
            key={barIndex}
            type="button"
            className="carousel-bar-hit"
            aria-label={`Go to slide ${barIndex + 1}`}
            aria-current={barIndex === index}
            onClick={() => onSelect(barIndex)}
          >
            <span className="carousel-bar" />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="carousel-count">
        {String(index + 1).padStart(2, "0")} / {count}
      </span>
      <span className="carousel-line" aria-hidden="true">
        <span className="carousel-line-fill" style={{ width: `${((index + 1) / count) * 100}%` }} />
      </span>
    </div>
  );
}
