"use client";

import { useEffect, useRef } from "react";

interface Particle {
  x: number; y: number; vx: number; vy: number;
  r: number; hue: "red" | "blue" | "chrome"; a: number;
  /** twinkle phase and speed; 0 speed = steady star */
  tp: number; ts: number;
}

/**
 * Ambient drifting star/particle field. Canvas-only, painted after mount, so it
 * contributes nothing to server markup and cannot cause a hydration mismatch.
 * Stars twinkle on their own and ease away from the cursor. It automatically
 * becomes a single static frame on constrained connections, low-power
 * devices, and reduced-motion preferences.
 */
export function ParticleField({ density = 0.00012 }: { density?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const connection = (navigator as Navigator & {
      connection?: { saveData?: boolean; effectiveType?: string };
    }).connection;
    const constrainedConnection = connection?.saveData || ["slow-2g", "2g", "3g"].includes(connection?.effectiveType ?? "");
    const lowPower = reduce || constrainedConnection || (navigator.hardwareConcurrency ?? 8) <= 4;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    let raf = 0;
    let particles: Particle[] = [];
    let w = 0, h = 0;
    const pointer = { x: -9999, y: -9999, active: false };
    const REPEL = 150;

    const COLORS = {
      red: "232, 18, 28",
      blue: "7, 144, 255",
      chrome: "214, 217, 219",
    } as const;

    function seed() {
      const maximum = lowPower ? 72 : 160;
      const count = Math.min(maximum, Math.floor(w * h * density));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.16,
        vy: -0.06 - Math.random() * 0.22,
        r: 0.6 + Math.random() * 1.7,
        hue: Math.random() < 0.18 ? "red" : Math.random() < 0.3 ? "blue" : "chrome",
        a: 0.15 + Math.random() * 0.5,
        tp: Math.random() * Math.PI * 2,
        ts: Math.random() < 0.35 ? 0.9 + Math.random() * 1.8 : 0,
      }));
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas!.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function draw(now: number) {
      if (document.hidden) return;
      const t = now / 1000;
      ctx!.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        // Ease away from the cursor, then drift back to the natural flow.
        if (pointer.active) {
          const dx = p.x - pointer.x;
          const dy = p.y - pointer.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < REPEL * REPEL && d2 > 0.01) {
            const d = Math.sqrt(d2);
            const push = ((REPEL - d) / REPEL) * 0.9;
            p.x += (dx / d) * push;
            p.y += (dy / d) * push;
          }
        }

        if (p.y < -6) { p.y = h + 6; p.x = Math.random() * w; }
        if (p.x < -6) p.x = w + 6;
        if (p.x > w + 6) p.x = -6;

        const alpha = p.ts ? p.a * (0.55 + 0.45 * Math.sin(t * p.ts + p.tp)) : p.a;
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${COLORS[p.hue]}, ${alpha})`;
        ctx!.shadowBlur = p.hue === "chrome" ? 0 : 8;
        ctx!.shadowColor = `rgba(${COLORS[p.hue]}, 0.7)`;
        ctx!.fill();
      }
      ctx!.shadowBlur = 0;
      raf = requestAnimationFrame(draw);
    }

    function paintStaticFrame() {
      for (const p of particles) {
        ctx!.beginPath();
        ctx!.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${COLORS[p.hue]}, ${p.a})`;
        ctx!.fill();
      }
    }

    function onVisibilityChange() {
      cancelAnimationFrame(raf);
      if (!document.hidden && !lowPower) raf = requestAnimationFrame(draw);
    }

    function onPointerMove(e: PointerEvent) {
      const rect = canvas!.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= w && pointer.y <= h;
    }
    function onPointerLeave() { pointer.active = false; }

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibilityChange);
    if (finePointer && !lowPower) {
      window.addEventListener("pointermove", onPointerMove, { passive: true });
      document.addEventListener("pointerleave", onPointerLeave);
    }

    if (lowPower) paintStaticFrame();
    else raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [density]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
