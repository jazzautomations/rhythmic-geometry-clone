// Cached atmosphere background renderer.
// paintAtmosphere is expensive (many gradient fills + stars). On mobile it
// can drop frames. This caches the painted atmosphere on an OffscreenCanvas
// keyed by (atmosphereId, atmosphereLayer, w, h, dpr) and just blits it
// each frame.

import type { Atmosphere } from "./presets";
import { paintAtmosphere } from "./atmosphere";

interface CacheKey {
  atmoId: string;
  layer: string;
  w: number;
  h: number;
  dpr: number;
}

let cachedCanvas: OffscreenCanvas | HTMLCanvasElement | null = null;
let cachedCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null = null;
let cachedKey: CacheKey | null = null;

export function paintAtmosphereCached(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  atmo: Atmosphere,
  layer: "none" | "stars" | "deep-field" | "dust" | "nebula-haze",
  dpr: number,
) {
  const key: CacheKey = {
    atmoId: atmo.id,
    layer,
    w: Math.floor(w),
    h: Math.floor(h),
    dpr,
  };

  const needRebuild =
    !cachedCanvas ||
    !cachedCtx ||
    !cachedKey ||
    cachedKey.atmoId !== key.atmoId ||
    cachedKey.layer !== key.layer ||
    cachedKey.w !== key.w ||
    cachedKey.h !== key.h ||
    cachedKey.dpr !== key.dpr;

  if (needRebuild) {
    const tw = Math.floor(w * dpr);
    const th = Math.floor(h * dpr);
    try {
      cachedCanvas = new OffscreenCanvas(tw, th);
      const c = (cachedCanvas as OffscreenCanvas).getContext("2d");
      if (c) {
        c.setTransform(dpr, 0, 0, dpr, 0, 0);
        cachedCtx = c;
      }
    } catch {
      const c = document.createElement("canvas");
      c.width = tw;
      c.height = th;
      cachedCanvas = c;
      const cx = c.getContext("2d");
      if (cx) {
        cx.setTransform(dpr, 0, 0, dpr, 0, 0);
        cachedCtx = cx;
      }
    }
    if (cachedCtx) {
      paintAtmosphere(
        cachedCtx as CanvasRenderingContext2D,
        w,
        h,
        atmo,
        { presentationMode: false, seed: 47, layer },
      );
    }
    cachedKey = key;
  }

  if (cachedCanvas && cachedCtx) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(cachedCanvas as OffscreenCanvas | HTMLCanvasElement, 0, 0);
    ctx.restore();
  }
}

export function invalidateAtmosphereCache() {
  cachedCanvas = null;
  cachedCtx = null;
  cachedKey = null;
}
