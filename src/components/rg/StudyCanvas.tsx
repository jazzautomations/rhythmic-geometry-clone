"use client";

import { useEffect, useRef, useState } from "react";
import { Download, Music, Plus, Save, Trash2 } from "lucide-react";
import {
  ATMOSPHERES,
  ATMOSPHERE_LAYERS,
  TONE_PRESETS,
} from "@/lib/rg/presets";
import { paintAtmosphere } from "@/lib/rg/atmosphere";
import { paintAtmosphereCached } from "@/lib/rg/atmosphereCache";
import { getAudio } from "@/lib/rg/audio";
import { useRG, getAtmosphere } from "@/lib/rg/store";
import { useSceneLibrary } from "@/lib/rg/useSceneLibrary";
import { exportStudyWav } from "@/lib/rg/render";
import {
  DEFAULT_STUDY_SCENES,
  ORBIT_PALETTE,
  type StudyScene,
  type StudyLayer,
  clamp,
  lcm,
} from "@/lib/rg/types";
import { ModeControlsShell } from "./ModeControlsShell";

interface StudyCanvasProps {
  playing: boolean;
  muted: boolean;
}

export function StudyCanvas({ playing, muted }: StudyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const atmosphereId = useRG((s) => s.atmosphereId);
  const atmosphereLayer = useRG((s) => s.atmosphereLayer);
  const setAtmosphere = useRG((s) => s.setAtmosphere);
  const setAtmosphereLayer = useRG((s) => s.setAtmosphereLayer);

  const [scene, setScene] = useState<StudyScene>(() =>
    structuredClone(DEFAULT_STUDY_SCENES[0].scene),
  );
  const sceneRef = useRef(scene);
  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  const stateRef = useRef({
    startPerf: 0,
    lastFiredStep: -1,
    raf: 0,
    flashes: new Map<string, number>(),
  });
  const [activeSceneId, setActiveSceneId] = useState(DEFAULT_STUDY_SCENES[0].id);
  const [bpm, setBpm] = useState(scene.baseBPM);
  const [highlightIntersections, setHighlightIntersections] = useState(true);
  const [tonePresetId, setTonePresetId] = useState("glass");

  const library = useSceneLibrary();

  useEffect(() => {
    const tone = TONE_PRESETS.find((t) => t.id === tonePresetId);
    if (tone) getAudio().applyTonePreset(tone);
  }, [tonePresetId]);

  useEffect(() => {
    getAudio().setSettings({ muted });
  }, [muted]);

  useEffect(() => {
    if (playing) {
      stateRef.current.startPerf = performance.now();
      stateRef.current.lastFiredStep = -1;
      stateRef.current.flashes.clear();
      // Audio resume is handled by the Play button onClick (iOS Safari requirement)
    }
  }, [playing]);

  useEffect(() => {
    setScene((prev) => {
      const next = { ...prev, baseBPM: bpm };
      sceneRef.current = next;
      return next;
    });
  }, [bpm]);

  const loadScene = (id: string) => {
    const found = DEFAULT_STUDY_SCENES.find((s) => s.id === id);
    if (!found) return;
    const next = structuredClone(found.scene);
    setScene(next);
    sceneRef.current = next;
    setBpm(next.baseBPM);
    setActiveSceneId(id);
    stateRef.current.lastFiredStep = -1;
    stateRef.current.flashes.clear();
  };

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
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (now: number) => {
      const scn = sceneRef.current;
      const st = stateRef.current;
      const atmo = getAtmosphere(atmosphereId);

      // Background atmosphere (cached for performance)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      paintAtmosphereCached(
        ctx as CanvasRenderingContext2D,
        w,
        h,
        atmo,
        "none",
        dpr,
      );

      const totalSteps = scn.stepsPerBar * scn.bars;
      const layerLcm = scn.layers.reduce((acc, l) => lcm(acc, l.pulseCount), 1);
      const effectiveSteps = Math.max(totalSteps, layerLcm);

      const padX = 80;
      const padTop = 60;
      const padBot = 60;
      const usableW = w - padX * 2;
      const usableH = h - padTop - padBot;
      const rowH = usableH / Math.max(1, scn.layers.length);
      const stepW = usableW / effectiveSteps;

      // Title
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.font = "11px ui-monospace, monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `${scn.layers.map((l) => l.label).join(" · ")}  ·  LCM = ${layerLcm}  ·  ${bpm} BPM`,
        padX,
        28,
      );

      const stepDurationSec = 60 / bpm;
      const elapsedSec = playing ? (now - stateRef.current.startPerf) / 1000 : 0;
      const continuousStep = (elapsedSec / stepDurationSec) % effectiveSteps;
      const currentStep = Math.floor(continuousStep);

      const isIntersection = (s: number) => {
        if (!highlightIntersections) return false;
        return scn.layers.every((layer) => {
          const pulseEvery = effectiveSteps / layer.pulseCount;
          return s % Math.round(pulseEvery) === 0;
        });
      };

      // Rows
      scn.layers.forEach((layer, idx) => {
        const y = padTop + idx * rowH;
        const flash = st.flashes.get(layer.id) ?? 0;

        // Row bg with flash
        ctx.fillStyle = `rgba(255,255,255,${0.025 + flash * 0.05})`;
        ctx.fillRect(padX, y + 4, usableW, rowH - 8);

        // Label
        ctx.fillStyle = layer.color;
        ctx.font = "bold 14px ui-monospace, monospace";
        ctx.textAlign = "right";
        ctx.fillText(`1 : ${layer.pulseCount}`, padX - 14, y + rowH / 2 + 5);

        const pulseEvery = effectiveSteps / layer.pulseCount;
        for (let s = 0; s < effectiveSteps; s++) {
          const cellX = padX + s * stepW;
          const isPulse = s % Math.round(pulseEvery) === 0;
          const isCurrent = s === currentStep && playing;
          const intersection = isIntersection(s);
          if (isPulse) {
            // Glow
            ctx.save();
            ctx.globalCompositeOperation = "lighter";
            const glowSize = (isCurrent ? rowH * 0.95 : rowH * 0.65) * atmo.glowMultiplier;
            const grad = ctx.createRadialGradient(
              cellX + stepW / 2,
              y + rowH / 2,
              0,
              cellX + stepW / 2,
              y + rowH / 2,
              glowSize,
            );
            grad.addColorStop(0, `${layer.color}${isCurrent ? "ff" : "aa"}`);
            grad.addColorStop(1, `${layer.color}00`);
            ctx.fillStyle = grad;
            ctx.fillRect(cellX - 4, y + 4, stepW + 8, rowH - 8);
            ctx.restore();

            ctx.fillStyle = isCurrent ? "#ffffff" : layer.color;
            ctx.fillRect(cellX + 1, y + 10, Math.max(2, stepW - 2), rowH - 20);

            if (intersection && idx === 0) {
              ctx.save();
              ctx.globalCompositeOperation = "lighter";
              const igrad = ctx.createLinearGradient(cellX, padTop, cellX, h - padBot);
              igrad.addColorStop(0, "rgba(255,255,255,0.0)");
              igrad.addColorStop(0.5, "rgba(255,255,255,0.2)");
              igrad.addColorStop(1, "rgba(255,255,255,0.0)");
              ctx.fillStyle = igrad;
              ctx.fillRect(cellX, padTop, Math.max(2, stepW - 2), usableH);
              ctx.restore();
            }
          } else {
            ctx.fillStyle = "rgba(255,255,255,0.06)";
            ctx.fillRect(cellX + 1, y + rowH / 2 - 1, Math.max(1, stepW - 2), 2);
          }
        }
      });

      // Playhead
      if (playing) {
        const px = padX + continuousStep * stepW;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        const grad = ctx.createLinearGradient(px - 8, 0, px + 8, 0);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(0.5, "rgba(255,255,255,0.7)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.fillRect(px - 8, padTop - 12, 16, h - padTop - padBot + 24);
        ctx.restore();

        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px, padTop - 12);
        ctx.lineTo(px, h - padBot + 12);
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(px, padTop - 12, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Bar markers
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      ctx.font = "9px ui-monospace, monospace";
      ctx.textAlign = "center";
      for (let bar = 0; bar <= scn.bars; bar++) {
        const x = padX + bar * scn.stepsPerBar * (usableW / effectiveSteps);
        ctx.beginPath();
        ctx.moveTo(x, h - padBot + 6);
        ctx.lineTo(x, h - padBot + 14);
        ctx.stroke();
        if (bar < scn.bars) {
          ctx.fillStyle = "rgba(255,255,255,0.4)";
          ctx.fillText(
            `bar ${bar + 1}`,
            x + (scn.stepsPerBar * (usableW / effectiveSteps)) / 2,
            h - padBot + 24,
          );
        }
      }

      // Decay flashes
      for (const [k, v] of st.flashes) {
        st.flashes.set(k, v * 0.85);
        if (v < 0.02) st.flashes.delete(k);
      }

      // Audio firing
      if (playing && currentStep !== stateRef.current.lastFiredStep && !muted) {
        stateRef.current.lastFiredStep = currentStep;
        scn.layers.forEach((layer, idx) => {
          const pulseEvery = effectiveSteps / layer.pulseCount;
          if (currentStep % Math.round(pulseEvery) === 0) {
            const pan = idx % 2 === 0 ? 0.3 : -0.3;
            getAudio().blip({
              color: layer.color,
              voiceId: layer.id,
              noteIndex: currentStep % 8,
              velocity: scn.layers.length,
              duration: 0.5,
              pan,
              type: "tone",
            });
            st.flashes.set(layer.id, 1);
          }
        });
      }

      st.raf = requestAnimationFrame(draw);
    };
    stateRef.current.raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(stateRef.current.raf);
      ro.disconnect();
    };
  }, [playing, muted, scene, bpm, atmosphereId, highlightIntersections]);

  const addLayer = () => {
    setScene((prev) => {
      if (prev.layers.length >= 5) return prev;
      const usedColors = new Set(prev.layers.map((l) => l.color));
      const color = ORBIT_PALETTE.find((c) => !usedColors.has(c)) ?? ORBIT_PALETTE[prev.layers.length];
      const pc = [4, 5, 7, 11, 13][prev.layers.length % 5];
      const layer: StudyLayer = {
        id: `l${Date.now()}`,
        pulseCount: pc,
        color,
        label: String(pc),
      };
      const next = { ...prev, layers: [...prev.layers, layer] };
      sceneRef.current = next;
      return next;
    });
  };

  const removeLayer = (id: string) => {
    setScene((prev) => {
      const next = { ...prev, layers: prev.layers.filter((l) => l.id !== id) };
      sceneRef.current = next;
      return next;
    });
  };

  const updateLayer = (id: string, patch: Partial<StudyLayer>) => {
    setScene((prev) => {
      const next = {
        ...prev,
        layers: prev.layers.map((l) => {
          if (l.id !== id) return l;
          const merged = { ...l, ...patch };
          if (patch.pulseCount) merged.label = String(patch.pulseCount);
          return merged;
        }),
      };
      sceneRef.current = next;
      return next;
    });
  };

  const layerLcm = scene.layers.reduce((acc, l) => lcm(acc, l.pulseCount), 1);

  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `polyrhythm-${scene.layers.map((l) => l.label).join("v")}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saveToLibrary = () => {
    library.save({ name: `${scene.layers.map((l) => l.label).join(" v ")}`, mode: "polyrhythm-study", data: scene });
  };

  // ---- Export WAV ----
  const [rendering, setRendering] = useState(false);
  const exportWAV = async () => {
    if (rendering) return;
    setRendering(true);
    try {
      const settings = useRG.getState().audio;
      await exportStudyWav(scene, settings);
    } catch (e) {
      console.error("WAV export failed:", e);
    } finally {
      setRendering(false);
    }
  };

  return (
    <ModeControlsShell
      mode="polyrhythm-study"
      scenePresets={DEFAULT_STUDY_SCENES.map((s) => ({ id: s.id, name: s.name }))}
      activeSceneId={activeSceneId}
      onSelectScene={loadScene}
      onReset={() => loadScene(DEFAULT_STUDY_SCENES[0].id)}
      transport={
        <>
          <Slider label="BPM" value={bpm} min={40} max={200} step={1} onChange={setBpm} suffix="bpm" />
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[10px] font-mono uppercase tracking-[0.14em] text-white/55">
            Layers · {scene.layers.length}  ·  LCM = {layerLcm}
          </div>
          <Toggle label="Intersections" value={highlightIntersections} onChange={setHighlightIntersections} />
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-white/45">Tone</div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {TONE_PRESETS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTonePresetId(t.id)}
                  className={`rounded-md border px-2 py-1 text-[9px] font-mono uppercase tracking-[0.1em] transition ${
                    tonePresetId === t.id
                      ? "border-[#7FD7FF]/40 bg-[#7FD7FF]/10 text-[#7FD7FF]"
                      : "border-white/10 text-white/55 hover:border-white/20"
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportPNG}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-white/10 px-2 py-1.5 text-[10px] font-mono uppercase tracking-[0.12em] text-white/70 transition hover:border-[#7FD7FF]/40 hover:text-white"
            >
              <Download size={11} /> PNG
            </button>
            <button
              onClick={exportWAV}
              disabled={rendering}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-[#7FD7FF]/30 bg-[#7FD7FF]/10 px-2 py-1.5 text-[10px] font-mono uppercase tracking-[0.12em] text-[#7FD7FF] transition hover:bg-[#7FD7FF]/20 disabled:cursor-wait disabled:opacity-50"
              title="Render to WAV (offline)"
            >
              <Music size={11} /> {rendering ? "..." : "WAV"}
            </button>
            <button
              onClick={saveToLibrary}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-white/10 px-2 py-1.5 text-[10px] font-mono uppercase tracking-[0.12em] text-white/70 transition hover:border-[#7FD7FF]/40 hover:text-white"
            >
              <Save size={11} /> Save
            </button>
          </div>
        </>
      }
      editor={
        <div className="space-y-3">
          {/* Atmosphere picker */}
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/45">Atmosphere</div>
            <div className="mt-1.5 grid grid-cols-3 gap-1">
              {ATMOSPHERES.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAtmosphere(a.id)}
                  className={`rounded-md border px-2 py-1.5 text-[9px] font-mono uppercase tracking-[0.1em] transition ${
                    atmosphereId === a.id
                      ? "border-[#7FD7FF]/40 bg-[#7FD7FF]/10 text-[#7FD7FF]"
                      : "border-white/10 text-white/55 hover:border-white/20"
                  }`}
                >
                  {a.shortLabel}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/45">Layer</div>
            <div className="mt-1.5 grid grid-cols-3 gap-1">
              {ATMOSPHERE_LAYERS.map((l) => (
                <button
                  key={l.id}
                  onClick={() => setAtmosphereLayer(l.id as "none" | "stars" | "deep-field" | "dust" | "nebula-haze")}
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

          <div className="border-t border-white/[0.06] pt-3">
            <div className="flex items-center justify-between">
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/45">
                Layers · {scene.layers.length}
              </div>
              <button
                onClick={addLayer}
                disabled={scene.layers.length >= 5}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-white/70 transition hover:border-[#7FD7FF]/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
              >
                <Plus size={11} /> Add
              </button>
            </div>
            <div className="mt-2 space-y-2">
              {scene.layers.map((l, i) => (
                <div key={l.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ background: l.color, boxShadow: `0 0 10px ${l.color}88` }}
                      />
                      <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-white/70">
                        Layer {i + 1}
                      </span>
                    </div>
                    <button
                      onClick={() => removeLayer(l.id)}
                      className="text-white/40 transition hover:text-[#FF3366]"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <NumField
                      label="Pulses"
                      value={l.pulseCount}
                      min={1}
                      max={32}
                      onChange={(v) => updateLayer(l.id, { pulseCount: v })}
                    />
                    <div>
                      <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/40">Color</div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {ORBIT_PALETTE.slice(0, 8).map((c) => (
                          <button
                            key={c}
                            onClick={() => updateLayer(l.id, { color: c })}
                            className={`h-5 w-5 rounded-full border ${l.color === c ? "border-white" : "border-transparent"}`}
                            style={{ background: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {library.scenes.filter((s) => s.mode === "polyrhythm-study").length > 0 && (
            <div className="border-t border-white/[0.06] pt-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/45">My Library</div>
              <div className="mt-2 space-y-1.5">
                {library.scenes
                  .filter((s) => s.mode === "polyrhythm-study")
                  .map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2"
                    >
                      <button
                        onClick={() => setScene(structuredClone(s.data) as StudyScene)}
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
            Watch when pulses stack vertically — that&apos;s where the rhythms align. The vertical white bars
            mark intersections where every layer pulses together.
          </div>
        </div>
      }
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
    </ModeControlsShell>
  );
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
        className="mt-1.5 w-full accent-[#7FD7FF]"
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
      <span className={`h-4 w-7 rounded-full p-0.5 transition ${value ? "bg-[#7FD7FF]/80" : "bg-white/15"}`}>
        <span
          className={`block h-3 w-3 rounded-full bg-white transition ${value ? "translate-x-3" : "translate-x-0"}`}
        />
      </span>
    </button>
  );
}

function NumField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/40">{label}</div>
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(clamp(parseInt(e.target.value || "0", 10), min, max))}
        className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[11px] font-mono text-white/85 outline-none focus:border-[#7FD7FF]/40"
      />
    </label>
  );
}
