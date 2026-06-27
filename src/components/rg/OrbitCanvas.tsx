"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Music, Plus, Save, Trash2 } from "lucide-react";
import {
  ATMOSPHERES,
  ATMOSPHERE_LAYERS,
  ORBIT_SCENES,
  TONE_PRESETS,
  type Atmosphere,
  type OrbitScenePreset,
  type Cycle,
} from "@/lib/rg/presets";
import { paintAtmosphere } from "@/lib/rg/atmosphere";
import { paintAtmosphereCached } from "@/lib/rg/atmosphereCache";
import { getAudio } from "@/lib/rg/audio";
import { useRG, getAtmosphere } from "@/lib/rg/store";
import { useSceneLibrary } from "@/lib/rg/useSceneLibrary";
import { exportOrbitWav } from "@/lib/rg/render";
import { ModeControlsShell } from "./ModeControlsShell";

interface OrbitCanvasProps {
  playing: boolean;
  muted: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

// Compute the screen radius for a cycle based on its index in the scene.
function cycleRadius(c: Cycle, idx: number, maxR: number): number {
  const base = c.size ?? 11;
  // Map noteIndex to a fraction of maxR, with a small offset for index
  const frac = 0.18 + (idx / 6) * 0.7;
  return Math.max(20, Math.min(maxR, frac * maxR));
}

export function OrbitCanvas({ playing, muted }: OrbitCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const atmosphereId = useRG((s) => s.atmosphereId);
  const atmosphereLayer = useRG((s) => s.atmosphereLayer);
  const setAtmosphere = useRG((s) => s.setAtmosphere);
  const setAtmosphereLayer = useRG((s) => s.setAtmosphereLayer);
  const activeSceneId = useRG((s) => s.activeOrbitSceneId);
  const setActiveOrbitScene = useRG((s) => s.setActiveOrbitScene);

  const [scene, setScene] = useState<OrbitScenePreset>(() =>
    structuredClone(ORBIT_SCENES.find((s) => s.id === activeSceneId) ?? ORBIT_SCENES[0]),
  );
  const sceneRef = useRef(scene);
  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  const stateRef = useRef({
    startPerf: 0,
    lastPulse: new Map<string, number>(),
    raf: 0,
    particles: [] as Particle[],
    flashes: new Map<string, number>(),
    trailCanvas: null as OffscreenCanvas | HTMLCanvasElement | null,
    trailCtx: null as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null,
    // Previous pulse positions per "cycleId:pulseIdx" — used to draw line segments
    // between consecutive frames, creating the rose-curve / mandala trail effect.
    prevPositions: new Map<string, { x: number; y: number }>(),
    // Static stardust field — generated once per resize.
    stardust: [] as { x: number; y: number; r: number; a: number }[],
    stardustW: 0,
    stardustH: 0,
  });
  const [bpm, setBpm] = useState(scene.tempo);
  const [speed, setSpeed] = useState(1);
  const [trail, setTrail] = useState(scene.trail);
  const [bloom, setBloom] = useState(scene.bloom);
  const [connections, setConnections] = useState(true);
  const [particlesOn, setParticlesOn] = useState(true);

  // Library
  const library = useSceneLibrary();

  // Apply the scene's tone preset to the audio engine
  useEffect(() => {
    const tone = TONE_PRESETS.find((t) => t.id === scene.soundId);
    if (tone) getAudio().applyTonePreset(tone);
  }, [scene.soundId]);

  useEffect(() => {
    if (playing) {
      stateRef.current.startPerf = performance.now();
      stateRef.current.lastPulse.clear();
      stateRef.current.flashes.clear();
      // Audio resume is handled by the Play button onClick (iOS Safari requirement)
    }
  }, [playing]);

  useEffect(() => {
    getAudio().setSettings({ muted });
  }, [muted]);

  useEffect(() => {
    setBpm(scene.tempo);
    setTrail(scene.trail);
    setBloom(scene.bloom);
  }, [scene]);

  const loadScene = (id: string) => {
    const found = ORBIT_SCENES.find((s) => s.id === id);
    if (!found) return;
    const next = structuredClone(found);
    setScene(next);
    sceneRef.current = next;
    setActiveOrbitScene(id);
    stateRef.current.lastPulse.clear();
    stateRef.current.flashes.clear();
    stateRef.current.particles = [];
    stateRef.current.prevPositions.clear();
    // Reset trail canvas
    stateRef.current.trailCanvas = null;
    stateRef.current.trailCtx = null;
  };

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let w = 0;
    let h = 0;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // Reset trail buffer
      stateRef.current.trailCanvas = null;
      stateRef.current.trailCtx = null;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // Build / get the persistent trail buffer (where the rosacea trails live).
    const getTrailCtx = (): CanvasRenderingContext2D | null => {
      const st = stateRef.current;
      if (!st.trailCanvas || (st.trailCanvas as HTMLCanvasElement).width !== Math.floor(w * dpr)) {
        try {
          const off = new OffscreenCanvas(Math.floor(w * dpr), Math.floor(h * dpr));
          st.trailCanvas = off;
          const c = off.getContext("2d");
          if (c) {
            c.setTransform(dpr, 0, 0, dpr, 0, 0);
            st.trailCtx = c;
          }
        } catch {
          // Fallback to a regular canvas
          const c = document.createElement("canvas");
          c.width = Math.floor(w * dpr);
          c.height = Math.floor(h * dpr);
          st.trailCanvas = c;
          const cx = c.getContext("2d");
          if (cx) {
            cx.setTransform(dpr, 0, 0, dpr, 0, 0);
            st.trailCtx = cx;
          }
        }
      }
      return (st.trailCtx as CanvasRenderingContext2D) ?? null;
    };

    const draw = (now: number) => {
      const scn = sceneRef.current;
      const st = stateRef.current;
      const atmo = getAtmosphere(atmosphereId);

      // 1) Paint atmosphere onto main canvas (cached for performance)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintAtmosphereCached(
        ctx as CanvasRenderingContext2D,
        w,
        h,
        atmo,
        atmosphereLayer,
        dpr,
      );

      // 1b) Subtle stardust field — sparse, just adds depth without competing
      // with the rose-curve trails. Regenerate on resize only.
      if (st.stardust.length === 0 || st.stardustW !== w || st.stardustH !== h) {
        let seed = 1337;
        const rng = () => {
          seed = (seed * 1664525 + 1013904223) >>> 0;
          return seed / 4294967296;
        };
        // Fewer stars — about 1 per 12000 px² (sparse, not a starfield)
        const count = Math.floor((w * h) / 12000);
        st.stardust = Array.from({ length: count }, () => ({
          x: rng() * w,
          y: rng() * h,
          r: 0.3 + rng() * 0.8,
          a: 0.08 + rng() * 0.25,
        }));
        st.stardustW = w;
        st.stardustH = h;
      }
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const s of st.stardust) {
        ctx.globalAlpha = s.a;
        ctx.fillStyle = "rgba(255,255,255,0.7)";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      const cx = w / 2;
      const cy = h / 2;
      const maxR = Math.min(w, h) * 0.42;
      const elapsedSec = (now - st.startPerf) / 1000;
      const cyclesPerSec = (bpm / 60) * speed;
      const trailCtx = getTrailCtx();

      // 2) Fade the trail buffer SLOWLY — long trails = rose-curve / mandala patterns.
      // Lower trail value (closer to 0.5) = shorter trails; closer to 0.99 = very long.
      if (trailCtx) {
        const fadeAlpha = Math.max(0.002, 0.025 - trail * 0.023);
        trailCtx.globalCompositeOperation = "destination-out";
        trailCtx.fillStyle = `rgba(0,0,0,${fadeAlpha})`;
        trailCtx.fillRect(0, 0, w, h);
      }

      // 3) Draw guide rings (very subtle)
      ctx.lineWidth = 1;
      ctx.strokeStyle = `rgba(255,255,255,${0.03 * atmo.lineAlpha})`;
      scn.cycles.forEach((c, i) => {
        const r = cycleRadius(c, i, maxR);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        ctx.stroke();
      });

      // 4) Compute current pulse positions + draw LINE SEGMENTS into trail buffer.
      // This is the KEY change — instead of just glowing dots, we draw the path
      // each pulse travels between frames. Over time this builds the rose-curve /
      // mandala patterns visible in the original.
      const positions: {
        x: number;
        y: number;
        color: string;
        cycleId: string;
        size: number;
        type: Cycle["type"];
        pulseIdx: number;
      }[] = [];
      scn.cycles.forEach((c, i) => {
        const r = cycleRadius(c, i, maxR);
        const angularVel = cyclesPerSec * Math.PI * 2;
        const baseAngle = elapsedSec * angularVel + (c.phase ?? 0) * Math.PI * 2;
        const count = Math.max(1, c.pulseCount);
        for (let p = 0; p < count; p++) {
          const a = baseAngle + (p / count) * Math.PI * 2;
          const x = cx + Math.cos(a) * r;
          const y = cy + Math.sin(a) * r;
          positions.push({
            x,
            y,
            color: c.color,
            cycleId: c.id,
            size: c.size ?? 11,
            type: c.type,
            pulseIdx: p,
          });

          // Draw line segment from previous position to current into the trail buffer.
          // This is what creates the continuous rose-curve / mandala trails.
          if (trailCtx) {
            const key = `${c.id}:${p}`;
            const prev = st.prevPositions.get(key);
            if (prev) {
              const dx = x - prev.x;
              const dy = y - prev.y;
              const dist = Math.sqrt(dx * dx + dy * dy);
              // Only draw if the segment is small (avoids huge jumps on resize/reset)
              if (dist > 0.1 && dist < 80) {
                // Use a soft translucent stroke — this is what gives the
                // "sinuous lines" / organic feel of the original.
                const grad = trailCtx.createLinearGradient(prev.x, prev.y, x, y);
                grad.addColorStop(0, hexWithAlpha(c.color, 0.32));
                grad.addColorStop(1, hexWithAlpha(c.color, 0.42));
                trailCtx.strokeStyle = grad;
                trailCtx.lineWidth = (c.size ?? 11) * 0.18;
                trailCtx.lineCap = "round";
                trailCtx.beginPath();
                trailCtx.moveTo(prev.x, prev.y);
                trailCtx.lineTo(x, y);
                trailCtx.stroke();
              }
            }
            st.prevPositions.set(key, { x, y });
          }
        }
      });

      // 5) Composite trail buffer onto main canvas with additive blending.
      // The trail buffer now holds the cumulative line-art mandala.
      if (trailCtx && st.trailCanvas) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.globalAlpha = 0.9 * bloom;
        ctx.drawImage(st.trailCanvas as OffscreenCanvas | HTMLCanvasElement, 0, 0, w, h);
        ctx.restore();
      }

      // 6) Connections between pulses from different cycles (additive, ephemeral)
      if (connections && scn.cycles.length > 1) {
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const maxDist = 110;
        for (let i = 0; i < positions.length; i++) {
          for (let j = i + 1; j < positions.length; j++) {
            if (positions[i].cycleId === positions[j].cycleId) continue;
            const dx = positions[j].x - positions[i].x;
            const dy = positions[j].y - positions[i].y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < maxDist) {
              const alpha = (1 - dist / maxDist) * 0.5 * atmo.glowMultiplier;
              const grad = ctx.createLinearGradient(
                positions[i].x,
                positions[i].y,
                positions[j].x,
                positions[j].y,
              );
              grad.addColorStop(0, hexWithAlpha(positions[i].color, alpha));
              grad.addColorStop(1, hexWithAlpha(positions[j].color, alpha));
              ctx.strokeStyle = grad;
              ctx.lineWidth = 1.0;
              ctx.beginPath();
              ctx.moveTo(positions[i].x, positions[i].y);
              ctx.lineTo(positions[j].x, positions[j].y);
              ctx.stroke();
            }
          }
        }
        ctx.restore();
      }

      // 7) Particles
      if (particlesOn) {
        const newParts: Particle[] = [];
        for (const p of st.particles) {
          p.life -= 0.016;
          if (p.life > 0) {
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.96;
            p.vy *= 0.96;
            newParts.push(p);
          }
        }
        st.particles = newParts;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (const p of st.particles) {
          const a = p.life / p.maxLife;
          ctx.fillStyle = hexWithAlpha(p.color, a * 0.8);
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      // 8) Live pulse glow + sharp white core (smaller, sharper than before)
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (const pos of positions) {
        const flash = st.flashes.get(pos.cycleId) ?? 0;
        const radius = (pos.size * 0.7 + flash * 10) * atmo.glowMultiplier;
        // Outer soft glow
        const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius);
        grad.addColorStop(0, hexWithAlpha(pos.color, 0.9));
        grad.addColorStop(0.3, hexWithAlpha(pos.color, 0.5));
        grad.addColorStop(1, hexWithAlpha(pos.color, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Sharp white cores (small, bright — like stars at line intersections)
      for (const pos of positions) {
        const flash = st.flashes.get(pos.cycleId) ?? 0;
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 1.5 + flash * 1.5, 0, Math.PI * 2);
        ctx.fill();
        // Tiny cross spike on flash for star-like sparkle
        if (flash > 0.3) {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          ctx.strokeStyle = hexWithAlpha(pos.color, flash * 0.6);
          ctx.lineWidth = 0.8;
          const sp = pos.size * 0.6 * flash;
          ctx.beginPath();
          ctx.moveTo(pos.x - sp, pos.y);
          ctx.lineTo(pos.x + sp, pos.y);
          ctx.moveTo(pos.x, pos.y - sp);
          ctx.lineTo(pos.x, pos.y + sp);
          ctx.stroke();
          ctx.restore();
        }
      }

      // 9) Center mark with master level
      const level = getAudio().getLevel();
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${0.25 + level * 0.4})`;
      ctx.arc(cx, cy, 1.5 + level * 6, 0, Math.PI * 2);
      ctx.fill();

      // 10) Decay flashes
      for (const [k, v] of st.flashes) {
        st.flashes.set(k, v * 0.85);
        if (v < 0.02) st.flashes.delete(k);
      }

      // 11) Audio firing — when a cycle's pulse crosses the playhead boundary
      if (playing && !muted) {
        for (let i = 0; i < scn.cycles.length; i++) {
          const c = scn.cycles[i];
          if (c.pulseCount <= 0) continue;
          const angularVel = cyclesPerSec * Math.PI * 2;
          const baseAngle = elapsedSec * angularVel + (c.phase ?? 0) * Math.PI * 2;
          const phase = (baseAngle / (Math.PI * 2 / c.pulseCount)) % c.pulseCount;
          const idx = Math.floor(((phase % c.pulseCount) + c.pulseCount) % c.pulseCount);
          const lastIdx = st.lastPulse.get(c.id) ?? -1;
          if (idx !== lastIdx) {
            st.lastPulse.set(c.id, idx);
            const r = cycleRadius(c, i, maxR);
            const a = baseAngle + (idx / c.pulseCount) * Math.PI * 2;
            const x = cx + Math.cos(a) * r;
            const y = cy + Math.sin(a) * r;
            getAudio().blip({
              color: c.color,
              voiceId: c.id,
              noteIndex: c.noteIndex + idx,
              velocity: scn.cycles.length,
              duration: 0.4,
              pan: c.pan ?? (i % 2 === 0 ? 0.3 : -0.3),
              type: c.type,
            });
            st.flashes.set(c.id, 1);
            if (particlesOn) {
              for (let k = 0; k < 8; k++) {
                const ang = Math.random() * Math.PI * 2;
                const sp = 1 + Math.random() * 3;
                st.particles.push({
                  x,
                  y,
                  vx: Math.cos(ang) * sp,
                  vy: Math.sin(ang) * sp,
                  life: 0.6 + Math.random() * 0.4,
                  maxLife: 1.0,
                  color: c.color,
                  size: 1.5 + Math.random() * 1.5,
                });
              }
            }
          }
        }
      }

      st.raf = requestAnimationFrame(draw);
    };
    stateRef.current.raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(stateRef.current.raf);
      ro.disconnect();
    };
  }, [playing, muted, scene, atmosphereId, atmosphereLayer, bpm, speed, trail, bloom, connections, particlesOn]);

  // ---- Export PNG (matches original behavior) ----
  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `${scene.id}-scene.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ---- Save to library (localStorage — replaces Supabase Pro feature) ----
  const saveToLibrary = () => {
    library.save({
      name: scene.name,
      mode: "orbital",
      data: scene,
    });
  };

  // ---- Export JSON ----
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(scene, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${scene.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // ---- Export WAV (offline render) ----
  const [rendering, setRendering] = useState(false);
  const exportWAV = async () => {
    if (rendering) return;
    setRendering(true);
    try {
      const settings = useRG.getState().audio;
      await exportOrbitWav(scene, settings);
    } catch (e) {
      console.error("WAV export failed:", e);
    } finally {
      setRendering(false);
    }
  };

  return (
    <ModeControlsShell
      mode="orbital"
      scenePresets={ORBIT_SCENES.map((s) => ({ id: s.id, name: s.name }))}
      activeSceneId={scene.id}
      onSelectScene={loadScene}
      onReset={() => loadScene(ORBIT_SCENES[0].id)}
      transport={
        <>
          <Slider label="BPM" value={bpm} min={30} max={200} step={1} onChange={setBpm} suffix="bpm" />
          <Slider label="Speed" value={speed} min={0.1} max={4} step={0.05} onChange={setSpeed} suffix="x" />
          <Slider label="Trail" value={trail} min={0.5} max={0.99} step={0.01} onChange={setTrail} suffix="" />
          <Slider label="Bloom" value={bloom} min={0} max={1.5} step={0.02} onChange={setBloom} suffix="" />
          <Toggle label="Connections" value={connections} onChange={setConnections} />
          <Toggle label="Particles" value={particlesOn} onChange={setParticlesOn} />
          <div className="flex gap-2">
            <button
              onClick={exportPNG}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-white/10 px-2 py-1.5 text-[10px] font-mono uppercase tracking-[0.12em] text-white/70 transition hover:border-[#00FFAA]/40 hover:text-white"
            >
              <Download size={11} /> PNG
            </button>
            <button
              onClick={exportJSON}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-white/10 px-2 py-1.5 text-[10px] font-mono uppercase tracking-[0.12em] text-white/70 transition hover:border-[#00FFAA]/40 hover:text-white"
            >
              <Download size={11} /> JSON
            </button>
            <button
              onClick={exportWAV}
              disabled={rendering}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-[#00FFAA]/30 bg-[#00FFAA]/10 px-2 py-1.5 text-[10px] font-mono uppercase tracking-[0.12em] text-[#00FFAA] transition hover:bg-[#00FFAA]/20 disabled:cursor-wait disabled:opacity-50"
              title="Render scene to WAV (offline)"
            >
              <Music size={11} /> {rendering ? "..." : "WAV"}
            </button>
            <button
              onClick={saveToLibrary}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-white/10 px-2 py-1.5 text-[10px] font-mono uppercase tracking-[0.12em] text-white/70 transition hover:border-[#00FFAA]/40 hover:text-white"
            >
              <Save size={11} /> Save
            </button>
          </div>
        </>
      }
      editor={
        <div className="space-y-3">
          {/* Atmosphere picker — verbatim list from original */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/45">
              Atmosphere
            </div>
            <div className="mt-1.5 grid grid-cols-3 gap-1">
              {ATMOSPHERES.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAtmosphere(a.id)}
                  className={`rounded-md border px-2 py-1.5 text-[9px] font-mono uppercase tracking-[0.1em] transition ${
                    atmosphereId === a.id
                      ? "border-[#00FFAA]/40 bg-[#00FFAA]/10 text-[#00FFAA]"
                      : "border-white/10 text-white/55 hover:border-white/20"
                  }`}
                >
                  {a.shortLabel}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/45">
              Layer
            </div>
            <div className="mt-1.5 grid grid-cols-3 gap-1">
              {ATMOSPHERE_LAYERS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setAtmosphereLayer(l.id as typeof atmosphereLayer)}
                  className={`rounded-md border px-2 py-1.5 text-[9px] font-mono uppercase tracking-[0.1em] transition ${
                    atmosphereLayer === l.id
                      ? "border-[#7FD7FF]/40 bg-[#7FD7FF]/10 text-[#7FD7FF]"
                      : "border-white/10 text-white/55 hover:border-white/20"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cycle list */}
          <div className="border-t border-white/[0.06] pt-3">
            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/45">
              Cycles · {scene.cycles.length}
            </div>
            <div className="mt-2 space-y-1.5">
              {scene.cycles.map((c, i) => (
                <div
                  key={c.id}
                  className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ background: c.color, boxShadow: `0 0 8px ${c.color}` }}
                      />
                      <span className="text-[10px] font-mono uppercase tracking-[0.12em] text-white/65">
                        {c.type}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-white/35">:{c.pulseCount}</span>
                  </div>
                  <div className="mt-1 text-[9px] font-mono text-white/40">
                    note {c.noteIndex} · pan {c.pan?.toFixed(2) ?? "0"} · vel {c.velocity?.toFixed(2) ?? "—"}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Saved scenes */}
          {library.scenes.filter((s) => s.mode === "orbital").length > 0 && (
            <div className="border-t border-white/[0.06] pt-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/45">
                My Library
              </div>
              <div className="mt-2 space-y-1.5">
                {library.scenes
                  .filter((s) => s.mode === "orbital")
                  .map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2"
                    >
                      <button
                        onClick={() => setScene(structuredClone(s.data) as OrbitScenePreset)}
                        className="flex-1 text-left text-[11px] font-mono text-white/70 hover:text-white"
                      >
                        {s.name}
                      </button>
                      <button
                        onClick={() => library.remove(s.id)}
                        className="text-white/40 transition hover:text-[#FF3366]"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-[11px] leading-6 text-white/55">
            <b className="text-white/75">{scene.name}</b>: {scene.description}
            <div className="mt-2 text-[9px] font-mono uppercase tracking-[0.14em] text-white/35">
              engine: {scene.engine} · sound: {scene.soundId} · tempo: {scene.tempo}bpm
            </div>
          </div>
        </div>
      }
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </ModeControlsShell>
  );
}

// Convert #rrggbb + alpha 0..1 → #rrggbbAA
function hexWithAlpha(hex: string, alpha: number): string {
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, "0");
  return `${hex}${a}`;
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix: string;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.14em] text-white/45">
        <span>{label}</span>
        <span className="text-white/80">
          {value.toFixed(step < 1 ? 2 : 0)}
          {suffix && ` ${suffix}`}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="mt-1.5 w-full accent-[#00FFAA]"
      />
    </label>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[10px] font-mono uppercase tracking-[0.14em] text-white/55 transition hover:border-white/15"
    >
      <span>{label}</span>
      <span className={`h-4 w-7 rounded-full p-0.5 transition ${value ? "bg-[#00FFAA]/80" : "bg-white/15"}`}>
        <span
          className={`block h-3 w-3 rounded-full bg-white transition ${value ? "translate-x-3" : "translate-x-0"}`}
        />
      </span>
    </button>
  );
}
