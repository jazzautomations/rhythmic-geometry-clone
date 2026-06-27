"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  DEFAULT_STUDY_SCENES,
  ORBIT_PALETTE,
  type StudyScene,
  type StudyLayer,
  clamp,
  lcm,
} from "@/lib/rg/types";
import { getAudio } from "@/lib/rg/audio";
import { ModeControlsShell } from "./ModeControlsShell";

interface StudyCanvasProps {
  playing: boolean;
  muted: boolean;
}

export function StudyCanvas({ playing, muted }: StudyCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
  });
  const [activeSceneId, setActiveSceneId] = useState(DEFAULT_STUDY_SCENES[0].id);
  const [bpm, setBpm] = useState(scene.baseBPM);

  useEffect(() => {
    getAudio().setMuted(muted);
  }, [muted]);

  useEffect(() => {
    if (playing) {
      stateRef.current.startPerf = performance.now();
      stateRef.current.lastFiredStep = -1;
      getAudio().resume();
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
  };

  const reset = () => loadScene(DEFAULT_STUDY_SCENES[0].id);

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
      ctx.fillStyle = "#05070d";
      ctx.fillRect(0, 0, w, h);

      const totalSteps = scn.stepsPerBar * scn.bars;
      const layerLcm = scn.layers.reduce((acc, l) => lcm(acc, l.pulseCount), 1);
      const effectiveSteps = Math.max(totalSteps, layerLcm);

      const padX = 60;
      const padTop = 50;
      const padBot = 50;
      const usableW = w - padX * 2;
      const usableH = h - padTop - padBot;
      const rowH = usableH / Math.max(1, scn.layers.length);
      const stepW = usableW / effectiveSteps;

      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "10px ui-monospace, monospace";
      ctx.textAlign = "left";
      ctx.fillText(
        `${scn.layers.map((l) => l.label).join(" · ")}  ·  LCM = ${layerLcm}  ·  ${bpm} BPM`,
        padX,
        26,
      );

      const stepDurationSec = 60 / bpm;
      const elapsedSec = playing ? (now - stateRef.current.startPerf) / 1000 : 0;
      const continuousStep = (elapsedSec / stepDurationSec) % effectiveSteps;
      const currentStep = Math.floor(continuousStep);

      scn.layers.forEach((layer, idx) => {
        const y = padTop + idx * rowH;
        ctx.fillStyle = "rgba(255,255,255,0.02)";
        ctx.fillRect(padX, y + 4, usableW, rowH - 8);
        ctx.fillStyle = layer.color;
        ctx.font = "11px ui-monospace, monospace";
        ctx.textAlign = "right";
        ctx.fillText(`1 : ${layer.pulseCount}`, padX - 12, y + rowH / 2 + 4);

        const pulseEvery = effectiveSteps / layer.pulseCount;
        for (let s = 0; s < effectiveSteps; s++) {
          const cellX = padX + s * stepW;
          const isPulse = s % Math.round(pulseEvery) === 0;
          const isCurrent = s === currentStep && playing;
          if (isPulse) {
            ctx.fillStyle = layer.color;
            ctx.fillRect(cellX + 1, y + 8, Math.max(2, stepW - 2), rowH - 16);
            if (isCurrent) {
              ctx.fillStyle = "#ffffff";
              ctx.fillRect(cellX + 1, y + 8, Math.max(2, stepW - 2), rowH - 16);
            }
          } else {
            ctx.fillStyle = "rgba(255,255,255,0.06)";
            ctx.fillRect(cellX + 1, y + rowH / 2 - 1, Math.max(1, stepW - 2), 2);
          }
        }
      });

      if (playing) {
        const px = padX + continuousStep * stepW;
        ctx.strokeStyle = "rgba(255,255,255,0.85)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(px, padTop - 8);
        ctx.lineTo(px, h - padBot + 8);
        ctx.stroke();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(px, padTop - 8, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.strokeStyle = "rgba(255,255,255,0.18)";
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

      if (playing && currentStep !== stateRef.current.lastFiredStep && !muted) {
        stateRef.current.lastFiredStep = currentStep;
        for (const layer of scn.layers) {
          const pulseEvery = effectiveSteps / layer.pulseCount;
          if (currentStep % Math.round(pulseEvery) === 0) {
            getAudio().blip({
              color: layer.color,
              orbitId: layer.id,
              velocity: scn.layers.length,
              duration: 0.15,
            });
          }
        }
      }

      stateRef.current.raf = requestAnimationFrame(draw);
    };
    stateRef.current.raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(stateRef.current.raf);
      ro.disconnect();
    };
  }, [playing, muted, scene, bpm]);

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

  return (
    <ModeControlsShell
      mode="polyrhythm-study"
      scenePresets={DEFAULT_STUDY_SCENES.map((s) => ({ id: s.id, name: s.name }))}
      activeSceneId={activeSceneId}
      onSelectScene={loadScene}
      onReset={reset}
      transport={
        <>
          <Slider label="BPM" value={bpm} min={40} max={200} step={1} onChange={setBpm} suffix="bpm" />
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[10px] font-mono uppercase tracking-[0.14em] text-white/55">
            Layers · {scene.layers.length}  ·  LCM = {layerLcm}
          </div>
        </>
      }
      editor={
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-white/45">
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
          <div className="space-y-2">
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
                          className={`h-5 w-5 rounded-full border ${
                            l.color === c ? "border-white" : "border-transparent"
                          }`}
                          style={{ background: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-[11px] leading-6 text-white/55">
            Watch when pulses stack vertically — that&apos;s where the rhythms align. The LCM at the top tells
            you how long until the full pattern returns.
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
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.16em] text-white/45">
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
