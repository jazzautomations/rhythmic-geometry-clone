"use client";

import { useEffect, useRef } from "react";

interface PreviewOrbit {
  pulseCount: number;
  radius: number;
  color: string;
  direction: 1 | -1;
  offsetTurns: number;
}

interface OrbitPreviewProps {
  seed?: string;
  orbits?: PreviewOrbit[];
  className?: string;
  small?: boolean;
  bpm?: number;
}

// Tiny self-running canvas used on the landing / showcase tiles.
// Renders orbiting pulses + faint trails. No audio.
export function OrbitPreview({
  seed = "default",
  orbits,
  className,
  small = false,
  bpm = 84,
}: OrbitPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resolvedOrbits: PreviewOrbit[] =
      orbits ?? [
        { pulseCount: 2, radius: 40, color: "#00FFAA", direction: 1, offsetTurns: 0 },
        { pulseCount: 3, radius: 75, color: "#3388FF", direction: 1, offsetTurns: 0 },
        { pulseCount: 5, radius: 115, color: "#FFAA00", direction: -1, offsetTurns: 0.5 },
      ];

    let raf = 0;
    let start = performance.now();
    let w = 0;
    let h = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Repaint background once on resize
      ctx.fillStyle = "#0a0d14";
      ctx.fillRect(0, 0, w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const cx = w / 2;
      const cy = h / 2;

      // Trail fade — paint a translucent dark rect each frame.
      ctx.fillStyle = small ? "rgba(10,13,20,0.18)" : "rgba(10,13,20,0.08)";
      ctx.fillRect(0, 0, w, h);

      // Faint guide rings
      ctx.lineWidth = 1;
      for (const o of resolvedOrbits) {
        ctx.beginPath();
        ctx.strokeStyle = `${o.color}22`;
        ctx.arc(cx, cy, o.radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Pulses
      const cyclePerSec = bpm / 60;
      for (const o of resolvedOrbits) {
        const angle =
          (o.direction * t * cyclePerSec * Math.PI * 2) / o.pulseCount +
          o.offsetTurns * Math.PI * 2;
        for (let p = 0; p < o.pulseCount; p++) {
          const a = angle + (p / o.pulseCount) * Math.PI * 2;
          const x = cx + Math.cos(a) * o.radius;
          const y = cy + Math.sin(a) * o.radius;
          // Glow
          const g = ctx.createRadialGradient(x, y, 0, x, y, small ? 10 : 18);
          g.addColorStop(0, o.color);
          g.addColorStop(1, `${o.color}00`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, small ? 10 : 18, 0, Math.PI * 2);
          ctx.fill();
          // Core
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(x, y, small ? 1.8 : 2.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [seed, orbits, small, bpm]);

  return <canvas ref={canvasRef} className={className} style={{ width: "100%", height: "100%" }} />;
}
