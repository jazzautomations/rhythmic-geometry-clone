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
import { exportRiffWav } from "@/lib/rg/render";
import {
  DEFAULT_RIFF_SCENES,
  ORBIT_PALETTE,
  type RiffScene,
  type RiffTrack,
  midiToName,
  clamp,
} from "@/lib/rg/types";
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
    flashes: new Map<string, number>(),
  });
  const [activeSceneId, setActiveSceneId] = useState(DEFAULT_RIFF_SCENES[0].id);
  const [bpm, setBpm] = useState(scene.baseBPM);
  const [swing, setSwing] = useState(0);
  const [tonePresetId, setTonePresetId] = useState("deep");
  const [, forceRender] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const atmosphereId = useRG((s) => s.atmosphereId);
  const atmosphereLayer = useRG((s) => s.atmosphereLayer);
  const setAtmosphere = useRG((s) => s.setAtmosphere);
  const setAtmosphereLayer = useRG((s) => s.setAtmosphereLayer);

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
      for (const [k, v] of stateRef.current.flashes) {
        stateRef.current.flashes.set(k, v * 0.88);
        if (v < 0.02) stateRef.current.flashes.delete(k);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [playing, muted, bpm, totalSteps]);

  // Background FFT canvas + atmosphere
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
    const atmo = getAtmosphere(atmosphereId);
    const draw = () => {
      // Atmosphere background (cached)
      paintAtmosphereCached(
        ctx as CanvasRenderingContext2D,
        w,
        h,
        atmo,
        "none",
        dpr,
      );
      // FFT overlay
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
          const hue = 50 + (i / bars) * 60;
          const grad = ctx.createLinearGradient(0, h, 0, h - barH);
          grad.addColorStop(0, `hsla(${hue}, 90%, 60%, 0.3)`);
          grad.addColorStop(1, `hsla(${hue}, 90%, 60%, 0)`);
          ctx.fillStyle = grad;
          ctx.fillRect(i * barW, h - barH, barW - 1, barH);
        }
        ctx.restore();
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [atmosphereId, atmosphereLayer]);

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
  void swing;

  const exportPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.href = canvas.toDataURL("image/png");
    link.download = `riff-${scene.tracks.length}t.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const saveToLibrary = () => {
    library.save({ name: `Riff ${bpm}bpm`, mode: "riff-cycle-study", data: scene });
  };

  // ---- Export WAV ----
  const [rendering, setRendering] = useState(false);
  const exportWAV = async () => {
    if (rendering) return;
    setRendering(true);
    try {
      const settings = useRG.getState().audio;
      await exportRiffWav(scene, settings);
    } catch (e) {
      console.error("WAV export failed:", e);
    } finally {
      setRendering(false);
    }
  };

  return (
    <ModeControlsShell
      mode="riff-cycle-study"
      scenePresets={DEFAULT_RIFF_SCENES.map((s) => ({ id: s.id, name: s.name }))}
      activeSceneId={activeSceneId}
      onSelectScene={loadScene}
      onReset={() => loadScene(DEFAULT_RIFF_SCENES[0].id)}
      transport={
        <>
          <Slider label="BPM" value={bpm} min={50} max={200} step={1} onChange={setBpm} suffix="bpm" />
          <Slider label="Swing" value={swing} min={0} max={0.5} step={0.02} onChange={setSwing} suffix="" />
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[10px] font-mono uppercase tracking-[0.14em] text-white/55">
            {scene.stepsPerBar} steps/bar × {scene.bars} bars = {totalSteps} steps
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-white/45">Tone</div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {TONE_PRESETS.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTonePresetId(t.id)}
                  className={`rounded-md border px-2 py-1 text-[9px] font-mono uppercase tracking-[0.1em] transition ${
                    tonePresetId === t.id
                      ? "border-[#FFD166]/40 bg-[#FFD166]/10 text-[#FFD166]"
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
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-white/10 px-2 py-1.5 text-[10px] font-mono uppercase tracking-[0.12em] text-white/70 transition hover:border-[#FFD166]/40 hover:text-white"
            >
              <Download size={11} /> PNG
            </button>
            <button
              onClick={exportWAV}
              disabled={rendering}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-[#FFD166]/30 bg-[#FFD166]/10 px-2 py-1.5 text-[10px] font-mono uppercase tracking-[0.12em] text-[#FFD166] transition hover:bg-[#FFD166]/20 disabled:cursor-wait disabled:opacity-50"
              title="Render beat to WAV (offline)"
            >
              <Music size={11} /> {rendering ? "..." : "WAV"}
            </button>
            <button
              onClick={saveToLibrary}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-md border border-white/10 px-2 py-1.5 text-[10px] font-mono uppercase tracking-[0.12em] text-white/70 transition hover:border-[#FFD166]/40 hover:text-white"
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
                      ? "border-[#FFD166]/40 bg-[#FFD166]/10 text-[#FFD166]"
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
                      ? "border-[#FFD166]/40 bg-[#FFD166]/10 text-[#FFD166]"
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
            <div className="mt-2 space-y-2">
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
          </div>

          {library.scenes.filter((s) => s.mode === "riff-cycle-study").length > 0 && (
            <div className="border-t border-white/[0.06] pt-3">
              <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/45">My Library</div>
              <div className="mt-2 space-y-1.5">
                {library.scenes
                  .filter((s) => s.mode === "riff-cycle-study")
                  .map((s) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2"
                    >
                      <button
                        onClick={() => setScene(structuredClone(s.data) as RiffScene)}
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
            <b className="text-white/75">Click</b> to toggle a hit. <b className="text-white/75">Right-click</b>{" "}
            (or shift-click) to toggle accent. Pitch &lt; 50 = kick, 50-70 = snare, &gt; 70 = hat.
          </div>
        </div>
      }
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-50" />

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
                  className="flex w-[80px] shrink-0 items-center gap-2 rounded-md border border-white/10 bg-black/30 px-2 py-1.5 sm:w-[100px]"
                  style={{ borderLeftColor: t.color, borderLeftWidth: 3 }}
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: t.color, boxShadow: `0 0 10px ${t.color}88` }}
                  />
                  <div className="min-w-0">
                    <div className="truncate text-[10px] font-mono text-white/85 sm:text-[11px]">{t.name}</div>
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
                        // Long-press for accent (mobile touch)
                        onTouchStart={(e) => {
                          const timer = setTimeout(() => {
                            e.preventDefault();
                            toggleAccent(t.id, i);
                            // Haptic feedback if available
                            if (navigator.vibrate) navigator.vibrate(15);
                          }, 400);
                          const cancel = () => clearTimeout(timer);
                          window.addEventListener("touchend", cancel, { once: true });
                          window.addEventListener("touchmove", cancel, { once: true });
                        }}
                        className={`relative h-10 w-7 rounded-md border transition sm:h-9 sm:w-[26px] ${
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
                          touchAction: "manipulation",
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
