import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import type { MotionState } from "@/lib/motion/engine";
import { useFinePointer, useFrame, usePrefersReducedMotion } from "@/lib/motion/hooks";
import { linePush, lineWave } from "@/lib/motion/math";

const LINE_GAP = 48;
const SAMPLE_STEP = 10;
const HIGHLIGHT_RADIUS = 170;
const DUST_COUNT = 34;

interface DustParticle {
  left: number;
  top: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
  drift: number;
}

const createDust = (): DustParticle[] =>
  Array.from({ length: DUST_COUNT }, () => ({
    left: Math.random() * 100,
    top: Math.random() * 100,
    size: 1 + Math.random() * 2,
    duration: 18 + Math.random() * 26,
    delay: -Math.random() * 40,
    opacity: 0.15 + Math.random() * 0.4,
    drift: (Math.random() - 0.5) * 60,
  }));

/** Horizontal hairlines that bend away from the cursor and light up around it; they ripple while scrolling fast. */
function drawLines(context: CanvasRenderingContext2D, state: Readonly<MotionState>) {
  const { width, height, pointerX, pointerY, pointerActive } = state;
  context.clearRect(0, 0, width, height);
  const ripple = Math.min(1, Math.abs(state.velocity) / 30);
  const offset = (state.scrollY * 0.25) % LINE_GAP;

  for (let y = -offset; y < height + LINE_GAP; y += LINE_GAP) {
    context.beginPath();
    for (let x = 0; x <= width; x += SAMPLE_STEP) {
      const push = pointerActive ? linePush(x - pointerX, y - pointerY, HIGHLIGHT_RADIUS) : 0;
      const pointY = y + push + lineWave(x, y, state.time, ripple);
      if (x === 0) context.moveTo(x, pointY);
      else context.lineTo(x, pointY);
    }
    context.strokeStyle = "rgba(250, 250, 250, 0.045)";
    context.lineWidth = 1;
    context.stroke();

    if (pointerActive && Math.abs(y - pointerY) < HIGHLIGHT_RADIUS * 2.2) {
      const glow = context.createRadialGradient(pointerX, pointerY, 0, pointerX, pointerY, HIGHLIGHT_RADIUS * 2);
      glow.addColorStop(0, "rgba(94, 200, 242, 0.55)");
      glow.addColorStop(0.5, "rgba(94, 200, 242, 0.18)");
      glow.addColorStop(1, "rgba(94, 200, 242, 0)");
      context.strokeStyle = glow;
      context.lineWidth = 1.2;
      context.stroke();
    }
  }
}

/** Fixed ambient layer: drifting glows, halo, dot grid, cursor-reactive lines and flashlight, light beams, dust, grain. */
export default function AmbientBackdrop() {
  const reduce = usePrefersReducedMotion();
  const fine = useFinePointer();
  const interactive = fine && !reduce;
  const rootRef = useRef<HTMLDivElement>(null);
  const glowsRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const dust = useMemo(createDust, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!interactive || !canvas) return;
    const resize = () => {
      const ratio = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(window.innerWidth * ratio);
      canvas.height = Math.round(window.innerHeight * ratio);
      const context = canvas.getContext("2d");
      context?.setTransform(ratio, 0, 0, ratio, 0, 0);
      contextRef.current = context;
    };
    resize();
    window.addEventListener("resize", resize);
    return () => {
      window.removeEventListener("resize", resize);
      contextRef.current = null;
    };
  }, [interactive]);

  useFrame((state) => {
    const glows = glowsRef.current;
    if (glows) {
      const pointerShiftX = state.pointerActive && state.width ? (state.pointerX / state.width - 0.5) * 40 : 0;
      const pointerShiftY = state.pointerActive && state.height ? (state.pointerY / state.height - 0.5) * 40 : 0;
      // Glows sway with scroll but never leave the viewport.
      const swayX = Math.cos(state.scrollY * 0.001) * 30 - 30;
      const swayY = Math.sin(state.scrollY * 0.0015) * 70;
      glows.style.transform = `translate3d(${(pointerShiftX + swayX).toFixed(1)}px, ${(pointerShiftY + swayY).toFixed(1)}px, 0)`;
    }

    const root = rootRef.current;
    if (root && interactive) {
      root.style.setProperty("--mx", `${state.pointerActive ? state.pointerX.toFixed(1) : -999}px`);
      root.style.setProperty("--my", `${state.pointerActive ? state.pointerY.toFixed(1) : -999}px`);
    }

    const context = contextRef.current;
    if (context) drawLines(context, state);
  }, !reduce);

  return (
    <div ref={rootRef} className="ambient" aria-hidden="true">
      <div ref={glowsRef} className="ambient-glows">
        <div className="ambient-glow ambient-glow-1" />
        <div className="ambient-glow ambient-glow-2" />
        <div className="ambient-glow ambient-glow-3" />
        <div className="ambient-glow ambient-glow-4" />
      </div>
      <div className="ambient-halo" />
      <div className="ambient-grid" />
      {interactive && <div className="ambient-grid-hot" />}
      {interactive && <canvas ref={canvasRef} className="ambient-lines" />}
      {!reduce && (
        <>
          <div className="ambient-beam" />
          <div className="ambient-beam ambient-beam-2" />
          <div className="ambient-dust">
            {dust.map((particle, index) => (
              <i
                key={index}
                className="ambient-dust-particle"
                style={
                  {
                    left: `${particle.left}%`,
                    top: `${particle.top}%`,
                    width: particle.size,
                    height: particle.size,
                    "--dur": `${particle.duration}s`,
                    "--delay": `${particle.delay}s`,
                    "--o": particle.opacity,
                    "--dx": `${particle.drift}px`,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        </>
      )}
      <div className="ambient-grain" />
    </div>
  );
}
