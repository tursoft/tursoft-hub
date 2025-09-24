import React, { useEffect, useRef, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  opacity: number;
  life?: number; // for fireworks
}

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

const BackgroundAnimation: React.FC = () => {
  const [particles, setParticles] = useState<Particle[]>(() =>
    Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      x: rand(0, window.innerWidth),
      y: rand(0, window.innerHeight),
      vx: rand(-1, 1),
      vy: rand(-1, 1),
      size: rand(2, 8),
      color: `hsl(${rand(200, 300)}, 70%, 60%)`,
      opacity: rand(0.3, 0.8),
    }))
  );

  const [fireworks, setFireworks] = useState<Particle[]>([]);
  const mouseRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };

    const onClick = (e: MouseEvent) => {
      const burst = Array.from({ length: 15 }).map((_, i) => ({
        id: Date.now() + i,
        x: e.clientX,
        y: e.clientY,
        vx: rand(-5, 5),
        vy: rand(-5, 5),
        size: rand(3, 6),
        color: `hsl(${rand(0, 360)}, 100%, 70%)`,
        opacity: 1,
        life: 60, // frames to live
      }));
      setFireworks((prev) => [...prev, ...burst]);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onClick);
    };
  }, []);

  useEffect(() => {
    const updateParticles = () => {
      setParticles((prev) =>
        prev.map((p) => {
          const dx = mouseRef.current.x - p.x;
          const dy = mouseRef.current.y - p.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const force = Math.min(0.5, 200 / (distance + 1)); // stronger force

          let vx = p.vx + (dx / distance) * force * 0.1; // higher multiplier
          let vy = p.vy + (dy / distance) * force * 0.1;

          // Reduce friction for smoother, faster movement
          vx *= 0.95;
          vy *= 0.95;

          let x = p.x + vx;
          let y = p.y + vy;

          // Wrap around screen
          if (x < 0) x = window.innerWidth;
          if (x > window.innerWidth) x = 0;
          if (y < 0) y = window.innerHeight;
          if (y > window.innerHeight) y = 0;

          return { ...p, x, y, vx, vy };
        })
      );

      setFireworks((prev) =>
        prev
          .map((f) => ({
            ...f,
            x: f.x + f.vx,
            y: f.y + f.vy,
            vx: f.vx * 0.98,
            vy: f.vy * 0.98,
            opacity: f.opacity * 0.98,
            life: (f.life || 0) - 1,
          }))
          .filter((f) => (f.life || 0) > 0)
      );

      rafRef.current = requestAnimationFrame(updateParticles);
    };

    rafRef.current = requestAnimationFrame(updateParticles);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div className="background-animation" aria-hidden>
      {particles.map((p) => (
        <div
          key={p.id}
          className="particle"
          style={{
            left: `${p.x}px`,
            top: `${p.y}px`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            opacity: p.opacity,
          }}
        />
      ))}
      {fireworks.map((f) => (
        <div
          key={f.id}
          className="firework"
          style={{
            left: `${f.x}px`,
            top: `${f.y}px`,
            width: `${f.size}px`,
            height: `${f.size}px`,
            backgroundColor: f.color,
            opacity: f.opacity,
          }}
        />
      ))}
    </div>
  );
};

export default BackgroundAnimation;