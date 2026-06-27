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
// Renders orbiting pulses with CONTINUOUS LINE TRAILS — same rose-curve /
// mandala effect as the main OrbitCanvas. No audio.
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

    // Persistent trail buffer (OffscreenCanvas) — accumulates line segments
    let trailCanvas: OffscreenCanvas | HTMLCanvasElement | null = null;
    let trailCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
    const prevPositions = new Map<string, { x: number; y: number }>();
    // Static stardust
    let stardust: { x: number; y: number; r: number; a: number }[] = [];

    const getTrailCtx = () => {
      const tw = Math.floor(w * dpr);
      const th = Math.floor(h * dpr);
      if (!trailCanvas || (trailCanvas as HTMLCanvasElement).width !== tw) {
        try {
          const off = new OffscreenCanvas(tw, th);
          trailCanvas = off;
          const c = off.getContext("2d");
          if (c) {
            c.setTransform(dpr, 0, 0, dpr, 0, 0);
            trailCtx = c;
          }
        } catch {
          const c = document.createElement("canvas");
          c.width = tw;
          c.height = th;
          trailCanvas = c;
          const cx = c.getContext("2d");
          if (cx) {
            cx.setTransform(dpr, 0, 0, dpr, 0, 0);
            trailCtx = cx;
          }
        }
      }
      return (trailCtx as CanvasRenderingContext2D) ?? null;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Reset trail buffer
      trailCanvas = null;
      trailCtx = null;
      prevPositions.clear();
      // Regenerate sparse stardust (1 per 14000 px²)
      let s = 1337;
      const rng = () => {
        s = (s * 1664525 + 1013904223) >>> 0;
        return s / 4294967296;
      };
      const count = Math.floor((w * h) / 14000);
      stardust = Array.from({ length: count }, () => ({
        x: rng() * w,
        y: rng() * h,
        r: 0.3 + rng() * 0.8,
        a: 0.08 + rng() * 0.25,
      }));
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const hexA = (hex: string, a: number) => {
      const v = Math.round(Math.max(0, Math.min(1, a)) * 255)
        .toString(16)
        .padStart(2, "0");
      return `${hex}${v}`;
    };

    const draw = (now: number) => {
      const t = (now - start) / 1000;
      const cx = w / 2;
      const cy = h / 2;

      // Background — deep black with subtle vignette
      ctx.fillStyle = "#05070d";
      ctx.fillRect(0, 0, w, h);

      // Stardust (sparse, always present)
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const s of stardust) {
        ctx.globalAlpha = s.a;
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Fade trail buffer slowly
      const tctx = getTrailCtx();
      if (tctx) {
        const fade = small ? 0.02 : 0.012;
        tctx.globalCompositeOperation = "destination-out";
        tctx.fillStyle = `rgba(0,0,0,${fade})`;
        tctx.fillRect(0, 0, w, h);
      }

      // Faint guide rings
      ctx.lineWidth = 1;
      for (const o of resolvedOrbits) {
        ctx.beginPath();
        ctx.strokeStyle = `${o.color}1a`;
        ctx.arc(cx, cy, o.radius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Compute positions + draw line segments into trail buffer
      const cyclePerSec = bpm / 60;
      const positions: { x: number; y: number; color: string; key: string; size: number }[] = [];
      resolvedOrbits.forEach((o, oi) => {
        const angle =
          (o.direction * t * cyclePerSec * Math.PI * 2) / o.pulseCount +
          o.offsetTurns * Math.PI * 2;
        for (let p = 0; p < o.pulseCount; p++) {
          const a = angle + (p / o.pulseCount) * Math.PI * 2;
          const x = cx + Math.cos(a) * o.radius;
          const y = cy + Math.sin(a) * o.radius;
          const key = `${oi}:${p}`;
          positions.push({ x, y, color: o.color, key, size: small ? 6 : 10 });

          if (tctx) {
            const prev = prevPositions.get(key);
            if (prev) {
              const dx = x - prev.x;
              const dy = y - prev.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              if (dist > 0.1 && dist < 60) {
                const grad = tctx.createLinearGradient(prev.x, prev.y, x, y);
                grad.addColorStop(0, hexA(o.color, 0.35));
                grad.addColorStop(1, hexA(o.color, 0.45));
                tctx.strokeStyle = grad;
                tctx.lineWidth = (small ? 6 : 10) * 0.18;
                tctx.lineCap = "round";
                tctx.beginPath();
                tctx.moveTo(prev.x, prev.y);
                tctx.lineTo(x, y);
                tctx.stroke();
              }
            }
            prevPositions.set(key, { x, y });
          }
        }
      });

      // Composite trail buffer
      if (tctx && trailCanvas) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.9;
        ctx.drawImage(trailCanvas as OffscreenCanvas | HTMLCanvasElement, 0, 0, w, h);
        ctx.restore();
      }

      // Pulses — soft glow + sharp white core
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const pos of positions) {
        const r = pos.size * 0.7;
        const g = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, r);
        g.addColorStop(0, hexA(pos.color, 0.9));
        g.addColorStop(0.3, hexA(pos.color, 0.5));
        g.addColorStop(1, hexA(pos.color, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      for (const pos of positions) {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, small ? 1.4 : 1.8, 0, Math.PI * 2);
        ctx.fill();
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
