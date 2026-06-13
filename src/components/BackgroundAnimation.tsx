import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
  alpha: number;
  life?: number; // only set for click bursts
}

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

const PARTICLE_COUNT = 60;
const LINK_DISTANCE = 140;
const MOUSE_RADIUS = 180;

/**
 * Ambient particle-network background rendered on a single canvas.
 * Particles drift slowly, link to nearby particles and the cursor,
 * and burst on click. Disabled under prefers-reduced-motion.
 */
const BackgroundAnimation = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const particles: Particle[] = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: rand(0, width),
      y: rand(0, height),
      vx: rand(-0.25, 0.25),
      vy: rand(-0.25, 0.25),
      size: rand(1, 2.6),
      hue: Math.random() < 0.6 ? rand(248, 268) : rand(185, 200), // violet or cyan
      alpha: rand(0.25, 0.6),
    }));

    let bursts: Particle[] = [];
    const mouse = { x: -9999, y: -9999 };
    let raf = 0;

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const onMouseMove = (e: MouseEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const onMouseLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    const onClick = (e: MouseEvent) => {
      for (let i = 0; i < 14; i++) {
        const angle = (Math.PI * 2 * i) / 14 + rand(-0.2, 0.2);
        const speed = rand(1.5, 4);
        bursts.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: rand(1.5, 3),
          hue: rand(185, 270),
          alpha: 1,
          life: 60,
        });
      }
    };

    const step = () => {
      ctx.clearRect(0, 0, width, height);

      // Links between nearby particles
      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.hypot(dx, dy);
          if (dist < LINK_DISTANCE) {
            ctx.strokeStyle = `hsla(256, 80%, 70%, ${0.07 * (1 - dist / LINK_DISTANCE)})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }

        // Link to cursor
        const mdx = a.x - mouse.x;
        const mdy = a.y - mouse.y;
        const mdist = Math.hypot(mdx, mdy);
        if (mdist < MOUSE_RADIUS) {
          ctx.strokeStyle = `hsla(190, 90%, 60%, ${0.18 * (1 - mdist / MOUSE_RADIUS)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }

      // Particles
      for (const p of particles) {
        // Gentle repulsion from cursor
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < MOUSE_RADIUS && dist > 0.001) {
          const force = ((MOUSE_RADIUS - dist) / MOUSE_RADIUS) * 0.06;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        p.vx *= 0.985;
        p.vy *= 0.985;
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < -10) p.x = width + 10;
        if (p.x > width + 10) p.x = -10;
        if (p.y < -10) p.y = height + 10;
        if (p.y > height + 10) p.y = -10;

        ctx.fillStyle = `hsla(${p.hue}, 85%, 68%, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Click bursts
      bursts = bursts.filter((f) => (f.life ?? 0) > 0);
      for (const f of bursts) {
        f.x += f.vx;
        f.y += f.vy;
        f.vx *= 0.96;
        f.vy *= 0.96;
        f.alpha *= 0.96;
        f.life = (f.life ?? 0) - 1;

        ctx.fillStyle = `hsla(${f.hue}, 95%, 70%, ${f.alpha})`;
        ctx.shadowColor = `hsla(${f.hue}, 95%, 70%, ${f.alpha})`;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseout", onMouseLeave);
    window.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseout", onMouseLeave);
      window.removeEventListener("click", onClick);
    };
  }, []);

  return (
    <div className="background-animation" aria-hidden>
      <canvas ref={canvasRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default BackgroundAnimation;
