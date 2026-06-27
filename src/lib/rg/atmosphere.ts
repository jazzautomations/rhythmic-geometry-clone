// Atmosphere renderer — port verbatim of the `kh` function from
// rhythmicgeometry.com bundle (lines 1144-1230 of app.beauty.js).
// Paints the layered atmospheric background for any canvas: base color,
// radial gradients, nebula veils, dust, orbital grid, deep field, stars,
// and final vignette. Used by every mode canvas.

import type { Atmosphere } from "./presets";

type Ctx = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

interface AtmosphereOption {
  presentationMode?: boolean;
  seed?: number;
  layer?: "none" | "stars" | "deep-field" | "dust" | "nebula-haze";
}

// Seeded RNG (xorshift32) — matches the original `a2` helper.
function makeRng(seed: number) {
  let r = seed >>> 0;
  return () => {
    r = (r * 1664525 + 1013904223) >>> 0;
    return r / 4294967296;
  };
}

// Star/dust generator (matches `s2` from the original).
function generateStars(
  w: number,
  h: number,
  layer: string,
  seed: number,
  count: number,
): { x: number; y: number; radius: number; alpha: number; hue: number }[] {
  const rng = makeRng(seed);
  const out: { x: number; y: number; radius: number; alpha: number; hue: number }[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      x: rng() * w,
      y: rng() * h,
      radius: 0.4 + rng() * 1.4,
      alpha: 0.18 + rng() * 0.7,
      hue: rng(),
    });
  }
  void layer;
  return out;
}

// Full port of `kh(t, r, a, s, i)` from the original bundle.
export function paintAtmosphere(
  ctx: Ctx,
  w: number,
  h: number,
  atmosphere: Atmosphere,
  opts: AtmosphereOption = {},
) {
  const o = atmosphere;
  const l = !!opts.presentationMode;
  const p = opts.seed ?? 17;
  const f = opts.layer ?? "none";
  const g = l ? 1.25 : 0.82;
  const v = w * 0.5;
  const y = h * 0.47;
  const R = Math.max(w, h);

  ctx.save();
  ctx.fillStyle = o.base;
  ctx.fillRect(0, 0, w, h);

  // Main radial gradient
  const b = ctx.createRadialGradient(v, y, R * 0.05, v, y, R * 0.72);
  b.addColorStop(0, o.gradient[0]);
  b.addColorStop(0.42, o.gradient[1]);
  b.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = b;
  ctx.globalAlpha = g;
  ctx.fillRect(0, 0, w, h);

  // Top-right accent gradient
  const B = ctx.createRadialGradient(w * 0.82, h * 0.16, 0, w * 0.82, h * 0.16, R * 0.52);
  B.addColorStop(0, o.gradient[2]);
  B.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalAlpha = l ? 0.86 : 0.56;
  ctx.fillStyle = B;
  ctx.fillRect(0, 0, w, h);

  // Nebula-haze / deep-field extra gradients
  if (f === "nebula-haze" || f === "deep-field") {
    const w1 = ctx.createRadialGradient(w * 0.22, h * 0.78, 0, w * 0.22, h * 0.78, R * 0.46);
    w1.addColorStop(0, o.gradient[1]);
    w1.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = f === "nebula-haze" ? (l ? 0.74 : 0.48) : l ? 0.44 : 0.24;
    ctx.fillStyle = w1;
    ctx.fillRect(0, 0, w, h);

    const I = ctx.createRadialGradient(w * 0.76, h * 0.7, 0, w * 0.76, h * 0.7, R * 0.38);
    I.addColorStop(0, o.gradient[0]);
    I.addColorStop(1, "rgba(0,0,0,0)");
    ctx.globalAlpha = f === "nebula-haze" ? (l ? 0.58 : 0.36) : l ? 0.32 : 0.16;
    ctx.fillStyle = I;
    ctx.fillRect(0, 0, w, h);
  }

  // Nebula-haze veils
  if (f === "nebula-haze") {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const w1 = ctx.createLinearGradient(w * 0.08, h * 0.18, w * 0.94, h * 0.84);
    w1.addColorStop(0, "rgba(255,255,255,0)");
    w1.addColorStop(0.35, o.gradient[1]);
    w1.addColorStop(0.62, o.gradient[0]);
    w1.addColorStop(1, "rgba(255,255,255,0)");
    ctx.globalAlpha = l ? 0.2 : 0.12;
    ctx.fillStyle = w1;
    ctx.beginPath();
    ctx.ellipse(w * 0.48, h * 0.56, R * 0.44, R * 0.19, -0.42, 0, Math.PI * 2);
    ctx.fill();

    const I = ctx.createLinearGradient(w * 0.2, h * 0.86, w * 0.86, h * 0.2);
    I.addColorStop(0, "rgba(255,255,255,0)");
    I.addColorStop(0.45, o.gradient[2]);
    I.addColorStop(1, "rgba(255,255,255,0)");
    ctx.globalAlpha = l ? 0.16 : 0.095;
    ctx.fillStyle = I;
    ctx.beginPath();
    ctx.ellipse(w * 0.58, h * 0.42, R * 0.36, R * 0.15, 0.28, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Fine dust
  if (f === "dust") {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const w1 = ctx.createRadialGradient(w * 0.5, h * 0.46, 0, w * 0.5, h * 0.46, R * 0.52);
    w1.addColorStop(0, "rgba(255,235,190,0.08)");
    w1.addColorStop(0.46, "rgba(170,205,255,0.035)");
    w1.addColorStop(1, "rgba(255,255,255,0)");
    ctx.globalAlpha = l ? 0.64 : 0.42;
    ctx.fillStyle = w1;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }

  // Orbital grid / deep-field arcs
  if (f === "orbital-grid" || f === "deep-field") {
    ctx.globalAlpha = f === "orbital-grid" ? (l ? 0.5 : 0.34) : l ? 0.22 : 0.14;
    ctx.strokeStyle = f === "orbital-grid" ? "rgba(180,220,255,0.12)" : "rgba(255,255,255,0.08)";
    ctx.lineWidth = 1;
    for (let i = 0; i < 7; i++) {
      const r = R * (0.18 + i * 0.075);
      ctx.beginPath();
      ctx.arc(v, y, r, Math.PI * 0.12, Math.PI * 1.88);
      ctx.stroke();
    }
    ctx.globalAlpha = f === "orbital-grid" ? (l ? 0.24 : 0.16) : l ? 0.14 : 0.08;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(v, y);
      ctx.lineTo(v + Math.cos(a) * R, y + Math.sin(a) * R);
      ctx.stroke();
    }
  }

  if (f === "deep-field") {
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.lineWidth = 1;
    for (let i = 0; i < 9; i++) {
      const r = R * (0.16 + i * 0.062);
      const start = Math.PI * (0.08 + i * 0.11);
      const end = start + Math.PI * (0.24 + (i % 3) * 0.08);
      ctx.globalAlpha = l ? 0.18 : 0.11;
      ctx.strokeStyle = i % 2 === 0 ? o.swatch[1] : o.swatch[2];
      ctx.beginPath();
      ctx.arc(w * 0.5, h * 0.48, r, start, end);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Stars / dust / deep-field points
  if (f === "stars" || f === "dust" || f === "deep-field") {
    const count = f === "dust" ? 96 : f === "deep-field" ? 70 : 56;
    const stars = generateStars(w, h, f, p, l ? count + 18 : count);
    for (const s of stars) {
      const alpha = s.alpha * (l ? 1.08 : 0.74);
      ctx.globalAlpha = alpha;
      ctx.fillStyle =
        f === "dust"
          ? s.hue > 0.58
            ? "rgba(255,235,190,0.32)"
            : "rgba(210,230,255,0.22)"
          : s.hue > 0.78
            ? o.swatch[2]
            : "rgba(255,255,255,0.72)";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
      if (f === "stars" && s.hue > 0.9) {
        ctx.globalAlpha = alpha * 0.46;
        ctx.strokeStyle = o.swatch[2];
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(s.x - s.radius * 2.2, s.y);
        ctx.lineTo(s.x + s.radius * 2.2, s.y);
        ctx.moveTo(s.x, s.y - s.radius * 2.2);
        ctx.lineTo(s.x, s.y + s.radius * 2.2);
        ctx.stroke();
      }
      if (f === "deep-field" && s.hue > 0.86) {
        ctx.globalAlpha = alpha * 0.34;
        ctx.strokeStyle = o.swatch[1];
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(s.x - s.radius * 3.2, s.y + s.radius * 1.4);
        ctx.lineTo(s.x + s.radius * 3.2, s.y - s.radius * 1.4);
        ctx.stroke();
      }
    }
  }

  // Final vignette
  const E = ctx.createRadialGradient(v, y, R * 0.22, v, y, R * 0.72);
  E.addColorStop(0, "rgba(0,0,0,0)");
  const vignetteStrength = Math.min(0.72, o.vignetteAlpha * (l ? 1.16 : 1));
  E.addColorStop(1, `rgba(0,0,0,${vignetteStrength})`);
  ctx.globalAlpha = 1;
  ctx.fillStyle = E;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
