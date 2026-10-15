import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export interface CloudItem {
  code: string;
  title: string;
  image?: string;
  /** Relative importance; drives the rendered size. */
  weight: number;
}

interface ItemCloudProps {
  items: CloudItem[];
  onItemClick?: (code: string) => void;
  /** Fires with the hovered (or keyboard-focused) item's code, or null. */
  onHoverChange?: (code: string | null) => void;
  /** Controlled selection; when omitted the cloud tracks its own selection. */
  selectedCode?: string | null;
  height?: number;
  minSize?: number;
  maxSize?: number;
}

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));
const IDLE_SPEED = 0.003; // radians per frame when nothing is happening
const DRAG_SENSITIVITY = 0.006; // radians per pixel dragged
const MAX_VELOCITY = 0.08;
const KEY_STEP = 0.12;
const CLICK_DISTANCE = 5; // px; moving further than this turns a click into a drag
const MIN_WEIGHT_OPACITY = 0.35; // opacity of the lowest-weight item at the front
const MIN_DEPTH_OPACITY = 0.35; // extra fade applied to items at the back
const INITIAL_ROTATION = { x: 0.3, y: 0 };
const GRID_FALLBACK_COLOR = '167 139 250'; // light purple, used when --primary is unavailable

type Vec3 = { x: number; y: number; z: number };

/** Globe wireframe on the unit sphere: parallels and meridians every 30 degrees. */
const GRID_LINES: Vec3[][] = (() => {
  const lines: Vec3[][] = [];
  const steps = 72;
  for (const latDeg of [-60, -30, 0, 30, 60]) {
    const lat = (latDeg * Math.PI) / 180;
    const r = Math.cos(lat);
    const y = Math.sin(lat);
    const ring: Vec3[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      ring.push({ x: Math.cos(t) * r, y, z: Math.sin(t) * r });
    }
    lines.push(ring);
  }
  for (const lonDeg of [0, 30, 60, 90, 120, 150]) {
    const lon = (lonDeg * Math.PI) / 180;
    const ring: Vec3[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = (i / steps) * Math.PI * 2;
      const r = Math.cos(t);
      ring.push({ x: Math.cos(lon) * r, y: Math.sin(t), z: Math.sin(lon) * r });
    }
    lines.push(ring);
  }
  return lines;
})();

/**
 * Interactive 3D sphere ("cloud") of icons.
 *
 * - Idle: slowly auto-rotates.
 * - Pointer down: rotation stops; dragging turns the sphere, releasing keeps
 *   its momentum which then eases back into the idle rotation.
 * - Hovering an item pauses rotation so it can be clicked.
 * - Clicking (or pressing Enter on) an item selects and highlights it.
 * - Focused container: arrow keys rotate, Escape clears the selection.
 *
 * Every item is a DOM node, so clicks, focus and hover work natively. No 3D
 * library is required.
 */
export const ItemCloud = ({
  items,
  onItemClick,
  onHoverChange,
  selectedCode,
  height = 560,
  minSize = 26,
  maxSize = 88,
}: ItemCloudProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rotation = useRef({ ...INITIAL_ROTATION });
  const velocity = useRef({ x: 0, y: IDLE_SPEED });
  const drag = useRef<{ pointerId: number; lastX: number; lastY: number; moved: number } | null>(null);
  const hoveredRef = useRef<string | null>(null);
  const selectedRef = useRef<string | null>(null);
  const [width, setWidth] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [internalSelected, setInternalSelected] = useState<string | null>(null);
  const selected = selectedCode !== undefined ? selectedCode : internalSelected;
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  // Even distribution on a unit sphere (Fibonacci lattice). The slots are
  // ranked by how close they face the viewer in the initial orientation and
  // handed out heaviest-item-first, so the biggest scores are front and centre
  // when the cloud first appears. basePoints[i] belongs to items[i].
  const basePoints = useMemo(() => {
    const n = items.length;
    const slots = items.map((_, i) => {
      // Half-step offset keeps small sets off the exact poles.
      const y = n > 1 ? 1 - ((i + 0.5) / n) * 2 : 0;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = GOLDEN_ANGLE * i;
      return { x: Math.cos(theta) * r, y, z: Math.sin(theta) * r };
    });
    const sinX = Math.sin(INITIAL_ROTATION.x);
    const cosX = Math.cos(INITIAL_ROTATION.x);
    const facing = (p: { y: number; z: number }) => p.y * sinX + p.z * cosX; // rotated z
    const slotOrder = slots.map((p, i) => i).sort((a, b) => facing(slots[b]) - facing(slots[a]));
    const itemOrder = items.map((it, i) => i).sort((a, b) => (items[b].weight || 0) - (items[a].weight || 0));
    const result: { x: number; y: number; z: number }[] = new Array(n);
    itemOrder.forEach((itemIndex, rank) => {
      result[itemIndex] = slots[slotOrder[rank]];
    });
    return result;
  }, [items]);

  // Weight -> normalized 0..1 (square root keeps mid-weight items from
  // vanishing next to the few heaviest ones), pixel size, and base opacity so
  // low scores read as faint and high scores as solid.
  const { sizes, opacities } = useMemo(() => {
    const weights = items.map((i) => (Number.isFinite(i.weight) ? i.weight : 0));
    const min = Math.min(...weights);
    const max = Math.max(...weights);
    const norm = weights.map((w) => Math.sqrt(max > min ? (w - min) / (max - min) : 0.5));
    return {
      sizes: norm.map((t) => minSize + (maxSize - minSize) * t),
      opacities: norm.map((t) => MIN_WEIGHT_OPACITY + (1 - MIN_WEIGHT_OPACITY) * t),
    };
  }, [items, minSize, maxSize]);

  // Use nearly the full box; the largest icons may poke slightly past the
  // edge at the extremes, which reads better than a small sphere.
  const radius = width ? Math.max(40, Math.min(width, height) / 2 - maxSize / 4) : 0;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Animation loop: integrates velocity into rotation and projects every point.
  useEffect(() => {
    if (!width || basePoints.length === 0) return;
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
    const idleSpeed = reduceMotion ? 0 : IDLE_SPEED;
    const cx = width / 2;
    const cy = height / 2;
    let frame = 0;

    // Wireframe canvas: sized for the device pixel ratio, tinted with the
    // theme's primary colour (shadcn stores it as "h s% l%" in --primary).
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d') ?? null;
    const dpr = window.devicePixelRatio || 1;
    if (canvas && ctx) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const primary = containerRef.current ? getComputedStyle(containerRef.current).getPropertyValue('--primary').trim() : '';
    const gridColor = (alpha: number) =>
      primary ? `hsl(${primary} / ${alpha})` : `rgb(${GRID_FALLBACK_COLOR} / ${alpha})`;

    const drawGrid = (sinX: number, cosX: number, sinY: number, cosY: number) => {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 7]);
      ctx.lineCap = 'round';
      for (const pass of [{ front: false, alpha: 0.07 }, { front: true, alpha: 0.28 }]) {
        ctx.strokeStyle = gridColor(pass.alpha);
        ctx.beginPath();
        for (const line of GRID_LINES) {
          let pen = false;
          for (const p of line) {
            const x1 = p.x * cosY - p.z * sinY;
            const z1 = p.x * sinY + p.z * cosY;
            const y2 = p.y * cosX - z1 * sinX;
            const z2 = p.y * sinX + z1 * cosX;
            const sx = cx + x1 * radius;
            const sy = cy + y2 * radius;
            if ((z2 >= 0) === pass.front) {
              if (pen) ctx.lineTo(sx, sy);
              else ctx.moveTo(sx, sy);
              pen = true;
            } else {
              pen = false;
            }
          }
        }
        ctx.stroke();
      }
    };

    const tick = () => {
      const v = velocity.current;
      if (drag.current) {
        // Rotation is applied directly by the pointer handler while dragging.
      } else if (hoveredRef.current) {
        v.x *= 0.8;
        v.y *= 0.8;
      } else {
        // Momentum eases back into the idle rotation.
        v.x += (0 - v.x) * 0.04;
        v.y += (idleSpeed - v.y) * 0.04;
      }
      if (!drag.current) {
        rotation.current.x += v.x;
        rotation.current.y += v.y;
      }

      const sinX = Math.sin(rotation.current.x);
      const cosX = Math.cos(rotation.current.x);
      const sinY = Math.sin(rotation.current.y);
      const cosY = Math.cos(rotation.current.y);

      drawGrid(sinX, cosX, sinY, cosY);

      for (let i = 0; i < basePoints.length; i++) {
        const node = nodeRefs.current[i];
        if (!node) continue;
        const p = basePoints[i];
        // Rotate around Y, then X.
        const x1 = p.x * cosY - p.z * sinY;
        const z1 = p.x * sinY + p.z * cosY;
        const y2 = p.y * cosX - z1 * sinX;
        const z2 = p.y * sinX + z1 * cosX;

        const depth = (z2 + 1) / 2; // 0 = back, 1 = front
        const scale = 0.5 + 0.5 * depth;
        node.style.transform = `translate3d(${cx + x1 * radius}px, ${cy + y2 * radius}px, 0) translate(-50%, -50%) scale(${scale})`;
        node.style.setProperty('--cloud-depth', String(depth));
        // Hovered or selected icons always render above their neighbours.
        const code = items[i].code;
        const onTop = code === hoveredRef.current || code === selectedRef.current;
        node.style.zIndex = onTop ? '2000' : String(Math.round(depth * 1000));
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [width, height, basePoints, radius, items]);

  const clamp = (n: number) => Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, n));

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { pointerId: e.pointerId, lastX: e.clientX, lastY: e.clientY, moved: 0 };
    velocity.current = { x: 0, y: 0 }; // mouse down stops the turn
    setDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.lastX;
    const dy = e.clientY - d.lastY;
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    d.moved += Math.abs(dx) + Math.abs(dy);
    // Dragging right turns the front of the sphere to the right; dragging
    // down turns it downward.
    const rx = -dy * DRAG_SENSITIVITY;
    const ry = -dx * DRAG_SENSITIVITY;
    rotation.current.x += rx;
    rotation.current.y += ry;
    velocity.current = { x: clamp(rx), y: clamp(ry) };
  };

  const select = useCallback(
    (code: string) => {
      if (selectedCode === undefined) setInternalSelected(code);
      onItemClick?.(code);
    },
    [onItemClick, selectedCode],
  );

  // Pointer capture (needed so a drag can leave the box) redirects the native
  // click to the container, so a short press is resolved here instead: the
  // item under the pointer on release is the one picked.
  const endDrag = (e: React.PointerEvent<HTMLDivElement>, allowPick = true) => {
    const d = drag.current;
    if (!d || d.pointerId !== e.pointerId) return;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    const wasDrag = d.moved > CLICK_DISTANCE;
    drag.current = null;
    setDragging(false);
    if (allowPick && !wasDrag) {
      const target = document.elementFromPoint(e.clientX, e.clientY);
      const code = target?.closest<HTMLElement>('[data-cloud-code]')?.dataset.cloudCode;
      if (code) select(code);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return; // let items handle their own keys
    const r = rotation.current;
    switch (e.key) {
      case 'ArrowLeft':
        r.y += KEY_STEP;
        break;
      case 'ArrowRight':
        r.y -= KEY_STEP;
        break;
      case 'ArrowUp':
        r.x += KEY_STEP;
        break;
      case 'ArrowDown':
        r.x -= KEY_STEP;
        break;
      case 'Escape':
        if (selectedCode === undefined) setInternalSelected(null);
        break;
      default:
        return;
    }
    e.preventDefault();
    velocity.current = { x: 0, y: 0 };
  };

  const setHover = (code: string | null) => {
    if (hoveredRef.current === code) return;
    hoveredRef.current = code;
    setHovered(code);
    onHoverChange?.(code);
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full overflow-hidden select-none rounded-xl outline-none',
        'focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        dragging ? 'cursor-grabbing' : 'cursor-grab',
      )}
      style={{ height, touchAction: 'none' }}
      tabIndex={0}
      role="listbox"
      aria-label="Skill cloud"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={(e) => endDrag(e, false)}
      onKeyDown={handleKeyDown}
    >
      {/* Atmosphere: lit from the upper left, darker rim, soft outer glow. */}
      {radius > 0 && (
        <div
          aria-hidden="true"
          className="absolute rounded-full pointer-events-none"
          style={{
            left: width / 2 - radius,
            top: height / 2 - radius,
            width: radius * 2,
            height: radius * 2,
            background:
              'radial-gradient(circle at 32% 28%, hsl(var(--primary) / 0.22) 0%, hsl(var(--primary) / 0.08) 45%, hsl(var(--primary) / 0.03) 70%, transparent 100%)',
            boxShadow:
              'inset -24px -36px 80px hsl(var(--primary) / 0.22), inset 12px 16px 48px hsl(var(--primary) / 0.06), 0 0 90px hsl(var(--primary) / 0.12)',
          }}
        />
      )}
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{ width, height }}
      />
      {items.map((item, i) => {
        const isSelected = selected === item.code;
        const isHovered = hovered === item.code;
        const active = isSelected || isHovered;
        return (
          <div
            key={item.code}
            ref={(el) => {
              nodeRefs.current[i] = el;
            }}
            role="option"
            aria-selected={isSelected}
            tabIndex={-1}
            data-cloud-code={item.code}
            className={cn(
              'group absolute left-0 top-0 will-change-transform rounded-xl outline-none',
              'transition-[box-shadow,background-color] duration-200',
              dragging ? 'cursor-grabbing' : 'cursor-pointer',
              isSelected && 'ring-2 ring-primary bg-primary/10 shadow-lg shadow-primary/30',
              !isSelected && isHovered && 'ring-1 ring-primary/50 bg-primary/5',
            )}
            style={{
              width: sizes[i],
              height: sizes[i],
              // weight opacity × depth fade; selected or hovered items are always solid
              opacity: active
                ? 1
                : `calc(${opacities[i]} * (${MIN_DEPTH_OPACITY} + ${1 - MIN_DEPTH_OPACITY} * var(--cloud-depth, 1)))`,
            }}
            onPointerEnter={() => setHover(item.code)}
            onPointerLeave={() => setHover(null)}
            onFocus={() => setHover(item.code)}
            onBlur={() => setHover(null)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                select(item.code);
              }
            }}
          >
            {item.image ? (
              <img
                src={item.image}
                alt={item.title}
                draggable={false}
                className={cn(
                  'w-full h-full object-contain drop-shadow-md transition-transform duration-200',
                  active && 'scale-110',
                )}
              />
            ) : (
              <div className="w-full h-full rounded-full bg-card border border-border flex items-center justify-center text-[10px] font-medium text-foreground text-center leading-tight px-1 overflow-hidden">
                {item.title}
              </div>
            )}
            <span
              className={cn(
                'pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium shadow-md transition-opacity duration-150',
                isSelected ? 'bg-primary text-primary-foreground' : 'bg-popover text-popover-foreground',
                active ? 'opacity-100' : 'opacity-0',
              )}
            >
              {item.title}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default ItemCloud;
