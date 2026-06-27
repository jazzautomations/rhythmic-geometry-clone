"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  DEFAULT_RIFF_SCENES,
  ORBIT_PALETTE,
  type RiffScene,
  type RiffTrack,
  midiToName,
  clamp,
} from "@/lib/rg/types";
import { getAudio } from "@/lib/rg/audio";
import { ModeControlsShell } from "./ModeControlsShell";

interface RiffCanvasProps {
  playing: boolean;
  muted: boolean;
}

export function RiffCanvas({ playing, muted }: RiffCanvasProps) {
  const [scene, setScene] = useState<RiffScene>(() =>
    structuredClone(DEFAULT_RIFF_SCENES[0].scene),
  );
  const sceneRef = useRef(scene);
  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  const stateRef = useRef({
    startPerf: 0,
    lastFiredStep: -1,
    raf: 0,
    flashes: new Map<string, number>(), // trackId+step -> flash
  });
  const [activeSceneId, setActiveSceneId] = useState(DEFAULT_RIFF_SCENES[0].id);
  const [bpm, setBpm] = useState(scene.baseBPM);
  const [swing, setSwing] = useState(0);
  const [fftBg, setFftBg] = useState(true);
  const [, forceRender] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    getAudio().setSettings({ muted });
  }, [muted]);

  useEffect(() => {
    if (playing) {
      stateRef.current.startPerf = performance.now();
      stateRef.current.lastFiredStep = -1;
      stateRef.current.flashes.clear();
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
    const found = DEFAULT_RIFF_SCENES.find((s) => s.id === id);
    if (!found) return;
    const next = structuredClone(found.scene);
    setScene(next);
    sceneRef.current = next;
    setBpm(next.baseBPM);
    setActiveSceneId(id);
    stateRef.current.lastFiredStep = -1;
    stateRef.current.flashes.clear();
  };

  const reset = () => loadScene(DEFAULT_RIFF_SCENES[0].id);

  const totalSteps = scene.stepsPerBar * scene.bars;

  // Audio loop
  useEffect(() => {
    let raf = 0;
    const draw = (now: number) => {
      if (playing && !muted) {
        const stepDur = 60 / bpm / 2;
        const elapsedSec = (now - stateRef.current.startPerf) / 1000;
        const cont = elapsedSec / stepDur;
        const currentStep = Math.floor(cont) % totalSteps;
        if (currentStep !== stateRef.current.lastFiredStep) {
          stateRef.current.lastFiredStep = currentStep;
          const scn = sceneRef.current;
          scn.tracks.forEach((track, idx) => {
            const step = track.steps[currentStep];
            if (step?.hit) {
              const pan = idx % 2 === 0 ? 0.2 : -0.2;
              getAudio().drumHit({
                midi: track.pitch,
                color: track.color,
                accent: step.accent,
                trackId: track.id,
                pan,
              });
              stateRef.current.flashes.set(`${track.id}-${currentStep}`, 1);
            }
          });
        }
      }
      // Decay flashes
      for (const [k, v] of stateRef.current.flashes) {
        stateRef.current.flashes.set(k, v * 0.88);
        if (v < 0.02) stateRef.current.flashes.delete(k);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [playing, muted, bpm, totalSteps]);

  // Background FFT canvas
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

    let raf = 0;
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      if (fftBg) {
        const fft = getAudio().getFFT();
        if (fft && fft.length > 0) {
          ctx.save();
          ctx.globalCompositeOperation = "lighter";
          const bars = 80;
          const step = Math.floor(fft.length / bars);
          for (let i = 0; i < bars; i++) {
            const v = fft[i * step] / 255;
            const barW = w / bars;
            const barH = v * h * 0.5;
            const hue = 50 + (i / bars) * 60; // yellow→amber
            const grad = ctx.createLinearGradient(0, h, 0, h - barH);
            grad.addColorStop(0, `hsla(${hue}, 90%, 60%, 0.3)`);
            grad.addColorStop(1, `hsla(${hue}, 90%, 60%, 0)`);
            ctx.fillStyle = grad;
            ctx.fillRect(i * barW, h - barH, barW - 1, barH);
          }
          ctx.restore();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [fftBg]);

  const toggleStep = (trackId: string, stepIdx: number) => {
    setScene((prev) => {
      const next = {
        ...prev,
        tracks: prev.tracks.map((t) => {
          if (t.id !== trackId) return t;
          const steps = t.steps.map((s, i) => {
            if (i !== stepIdx) return s;
            if (s.hit) return { hit: false, accent: false };
            return { hit: true, accent: false };
          });
          return { ...t, steps };
        }),
      };
      sceneRef.current = next;
      return next;
    });
  };

  const toggleAccent = (trackId: string, stepIdx: number) => {
    setScene((prev) => {
      const next = {
        ...prev,
        tracks: prev.tracks.map((t) => {
          if (t.id !== trackId) return t;
          const steps = t.steps.map((s, i) => {
            if (i !== stepIdx) return s;
            if (!s.hit) return { hit: true, accent: true };
            return { hit: s.hit, accent: !s.accent };
          });
          return { ...t, steps };
        }),
      };
      sceneRef.current = next;
      return next;
    });
  };

  const addTrack = () => {
    setScene((prev) => {
      if (prev.tracks.length >= 6) return prev;
      const usedColors = new Set(prev.tracks.map((t) => t.color));
      const color = ORBIT_PALETTE.find((c) => !usedColors.has(c)) ?? ORBIT_PALETTE[prev.tracks.length];
      const total = prev.stepsPerBar * prev.bars;
      const t: RiffTrack = {
        id: `t${Date.now()}`,
        name: `Track ${prev.tracks.length + 1}`,
        color,
        pitch: 60 + prev.tracks.length * 3,
        steps: Array.from({ length: total }, () => ({ hit: false, accent: false })),
      };
      const next = { ...prev, tracks: [...prev.tracks, t] };
      sceneRef.current = next;
      return next;
    });
  };

  const removeTrack = (id: string) => {
    setScene((prev) => {
      const next = { ...prev, tracks: prev.tracks.filter((t) => t.id !== id) };
      sceneRef.current = next;
      return next;
    });
  };

  const updateTrack = (id: string, patch: Partial<RiffTrack>) => {
    setScene((prev) => {
      const next = {
        ...prev,
        tracks: prev.tracks.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      };
      sceneRef.current = next;
      return next;
    });
  };

  // Force re-render at ~30fps while playing so playhead moves
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const tick = () => {
      forceRender((n) => (n + 1) % 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const stepDur = 60 / bpm / 2;
  const elapsedSec = playing ? (performance.now() - stateRef.current.startPerf) / 1000 : 0;
  const currentStep = playing ? Math.floor(elapsedSec / stepDur) % totalSteps : -1;
  void swing; // swing is a placeholder for future swing implementation

  return (
    <ModeControlsShell
      mode="riff-cycle-study"
      scenePresets={DEFAULT_RIFF_SCENES.map((s) => ({ id: s.id, name: s.name }))}
      activeSceneId={activeSceneId}
      onSelectScene={loadScene}
      onReset={reset}
      transport={
        <>
          <Slider label="BPM" value={bpm} min={50} max={200} step={1} onChange={setBpm} suffix="bpm" />
          <Slider label="Swing" value={swing} min={0} max={0.5} step={0.02} onChange={setSwing} suffix="" />
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[10px] font-mono uppercase tracking-[0.14em] text-white/55">
            {scene.stepsPerBar} steps/bar × {scene.bars} bars = {totalSteps} steps
          </div>
          <Toggle label="FFT Background" value={fftBg} onChange={setFftBg} />
        </>
      }
      editor={
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-white/45">
              Tracks · {scene.tracks.length}
            </div>
            <button
              onClick={addTrack}
              disabled={scene.tracks.length >= 6}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-white/70 transition hover:border-[#FFD166]/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Plus size={11} /> Add
            </button>
          </div>
          <div className="space-y-2">
            {scene.tracks.map((t, i) => (
              <div key={t.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ background: t.color, boxShadow: `0 0 10px ${t.color}88` }}
                    />
                    <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-white/70">
                      {t.name}
                    </span>
                  </div>
                  <button
                    onClick={() => removeTrack(t.id)}
                    className="text-white/40 transition hover:text-[#FF3366]"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <label className="block">
                    <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/40">Name</div>
                    <input
                      type="text"
                      value={t.name}
                      onChange={(e) => updateTrack(t.id, { name: e.target.value })}
                      className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[11px] font-mono text-white/85 outline-none focus:border-[#FFD166]/40"
                    />
                  </label>
                  <NumField
                    label={`Pitch (${midiToName(t.pitch)})`}
                    value={t.pitch}
                    min={24}
                    max={96}
                    onChange={(v) => updateTrack(t.id, { pitch: v })}
                  />
                </div>
                <div className="mt-2">
                  <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/40">Color</div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {ORBIT_PALETTE.slice(0, 8).map((c) => (
                      <button
                        key={c}
                        onClick={() => updateTrack(t.id, { color: c })}
                        className={`h-5 w-5 rounded-full border ${t.color === c ? "border-white" : "border-transparent"}`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-2 text-[9px] font-mono uppercase tracking-[0.14em] text-white/35">
                  Type: {t.pitch < 50 ? "Kick" : t.pitch < 70 ? "Snare" : "Hat"}
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3 text-[11px] leading-6 text-white/55">
            <b className="text-white/75">Click</b> to toggle a hit. <b className="text-white/75">Right-click</b>{" "}
            (or shift-click) to toggle accent. Pitch &lt; 50 = kick, 50-70 = snare, &gt; 70 = hat.
          </div>
        </div>
      }
    >
      {/* FFT background canvas */}
      <canvas ref={canvasRef} className="pointer-events-none absolute inset-0 h-full w-full opacity-50" />

      <div className="absolute inset-0 overflow-auto rg-scroll-thin">
        <div className="min-w-full p-5">
          {/* Step ruler */}
          <div className="mb-3 flex items-end gap-[3px]" style={{ paddingLeft: 110 }}>
            {Array.from({ length: totalSteps }).map((_, i) => {
              const isBar = i % scene.stepsPerBar === 0;
              const isBeat = scene.stepsPerBar > 4 && i % Math.round(scene.stepsPerBar / 4) === 0;
              return (
                <div key={i} className="flex h-5 flex-col items-center justify-end" style={{ width: 26, marginRight: 1 }}>
                  <span
                    className={`text-[9px] font-mono ${isBar ? "text-white/80" : isBeat ? "text-white/50" : "text-white/25"}`}
                  >
                    {isBar ? i / scene.stepsPerBar + 1 : isBeat ? "·" : ""}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Tracks */}
          <div className="space-y-1.5">
            {scene.tracks.map((t) => (
              <div key={t.id} className="flex items-stretch gap-2">
                <div
                  className="flex w-[100px] shrink-0 items-center gap-2 rounded-md border border-white/10 bg-black/30 px-2 py-1.5"
                  style={{ borderLeftColor: t.color, borderLeftWidth: 3 }}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: t.color, boxShadow: `0 0 10px ${t.color}88` }}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-[11px] font-mono text-white/85">{t.name}</div>
                    <div className="text-[9px] font-mono text-white/40">{midiToName(t.pitch)}</div>
                  </div>
                </div>
                <div className="flex gap-[3px]">
                  {t.steps.map((s, i) => {
                    const isBar = i % scene.stepsPerBar === 0;
                    const isCurrent = i === currentStep;
                    const flash = stateRef.current.flashes.get(`${t.id}-${i}`) ?? 0;
                    return (
                      <button
                        key={i}
                        onClick={() => toggleStep(t.id, i)}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          toggleAccent(t.id, i);
                        }}
                        onMouseDown={(e) => {
                          if (e.shiftKey) {
                            e.preventDefault();
                            toggleAccent(t.id, i);
                          }
                        }}
                        className={`relative h-9 w-[26px] rounded-md border transition ${
                          s.hit
                            ? s.accent
                              ? "border-white/80"
                              : "border-white/20"
                            : isBar
                              ? "border-white/15"
                              : "border-white/[0.06]"
                        } ${isCurrent ? "ring-2 ring-white/70" : ""}`}
                        style={{
                          background: s.hit
                            ? s.accent
                              ? t.color
                              : `${t.color}88`
                            : isBar
                              ? "rgba(255,255,255,0.04)"
                              : "rgba(255,255,255,0.015)",
                          boxShadow: s.hit
                            ? `0 0 ${14 + flash * 20}px ${t.color}${flash > 0.3 ? "ff" : "55"}`
                            : flash > 0.1
                              ? `inset 0 0 ${flash * 20}px ${t.color}66`
                              : "none",
                          transform: flash > 0.5 ? `scale(${1 + flash * 0.08})` : "scale(1)",
                        }}
                        title={`Step ${i + 1} · ${midiToName(t.pitch)}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.16em] text-white/40">
            <span>Step {currentStep >= 0 ? currentStep + 1 : "—"} / {totalSteps}</span>
            <span>{playing ? "Playing" : "Paused"} · {bpm} BPM</span>
          </div>
        </div>
      </div>
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
        className="mt-1.5 w-full accent-[#FFD166]"
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
      <span className={`h-4 w-7 rounded-full p-0.5 transition ${value ? "bg-[#FFD166]/80" : "bg-white/15"}`}>
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
        className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[11px] font-mono text-white/85 outline-none focus:border-[#FFD166]/40"
      />
    </label>
  );
}
