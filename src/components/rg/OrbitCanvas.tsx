"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import {
  DEFAULT_ORBIT_SCENES,
  ORBIT_PALETTE,
  type Orbit,
  type OrbitScene,
  clamp,
} from "@/lib/rg/types";
import { getAudio } from "@/lib/rg/audio";
import { ModeControlsShell } from "./ModeControlsShell";

interface OrbitCanvasProps {
  playing: boolean;
  muted: boolean;
}

export function OrbitCanvas({ playing, muted }: OrbitCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scene, setScene] = useState<OrbitScene>(() =>
    structuredClone(DEFAULT_ORBIT_SCENES[0].scene),
  );
  const sceneRef = useRef(scene);
  useEffect(() => {
    sceneRef.current = scene;
  }, [scene]);

  const stateRef = useRef({
    startPerf: 0,
    lastPulse: new Map<string, number>(),
    raf: 0,
  });
  const [activeSceneId, setActiveSceneId] = useState(DEFAULT_ORBIT_SCENES[0].id);
  const [bpm, setBpm] = useState(scene.baseBPM);
  const [speed, setSpeed] = useState(scene.speedMultiplier);
  const [trail, setTrail] = useState(1 - scene.trailAlpha);
  const [glow, setGlow] = useState(scene.glow);

  useEffect(() => {
    if (playing) {
      stateRef.current.startPerf = performance.now();
      stateRef.current.lastPulse.clear();
      getAudio().resume();
    }
  }, [playing]);

  useEffect(() => {
    getAudio().setMuted(muted);
  }, [muted]);

  // Push transport state into the scene ref (the RAF loop reads from there).
  useEffect(() => {
    setScene((prev) => {
      const next = { ...prev, baseBPM: bpm, speedMultiplier: speed, trailAlpha: 1 - trail, glow };
      sceneRef.current = next;
      return next;
    });
  }, [bpm, speed, trail, glow]);

  const loadScene = (id: string) => {
    const found = DEFAULT_ORBIT_SCENES.find((s) => s.id === id);
    if (!found) return;
    const next = structuredClone(found.scene);
    setScene(next);
    sceneRef.current = next;
    setBpm(next.baseBPM);
    setSpeed(next.speedMultiplier);
    setTrail(1 - next.trailAlpha);
    setGlow(next.glow);
    setActiveSceneId(id);
    stateRef.current.lastPulse.clear();
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#05070d";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
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
      ctx.fillStyle = "#05070d";
      ctx.fillRect(0, 0, w, h);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = (now: number) => {
      const scn = sceneRef.current;
      const st = stateRef.current;

      ctx.fillStyle = `rgba(5,7,13,${scn.trailAlpha})`;
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2;

      const elapsedSec = (now - st.startPerf) / 1000;
      const playhead = playing ? elapsedSec : elapsedSec;

      const cyclesPerSec = (scn.baseBPM / 60) * scn.speedMultiplier;
      const totalPulses = scn.orbits.reduce((acc, o) => acc + o.pulseCount, 0);

      ctx.lineWidth = 1;
      for (const o of scn.orbits) {
        ctx.beginPath();
        ctx.strokeStyle = `${o.color}20`;
        ctx.arc(cx, cy, o.radius, 0, Math.PI * 2);
        ctx.stroke();
        for (let p = 0; p < o.pulseCount; p++) {
          const a = (p / o.pulseCount) * Math.PI * 2;
          ctx.beginPath();
          ctx.strokeStyle = `${o.color}10`;
          ctx.moveTo(cx + Math.cos(a) * (o.radius - 5), cy + Math.sin(a) * (o.radius - 5));
          ctx.lineTo(cx + Math.cos(a) * (o.radius + 5), cy + Math.sin(a) * (o.radius + 5));
          ctx.stroke();
        }
      }

      ctx.beginPath();
      ctx.fillStyle = "rgba(255,255,255,0.4)";
      ctx.arc(cx, cy, 2, 0, Math.PI * 2);
      ctx.fill();

      for (const o of scn.orbits) {
        const angularVel = (o.direction * cyclesPerSec * Math.PI * 2) / o.pulseCount;
        const baseAngle = playhead * angularVel + o.offsetTurns * Math.PI * 2;
        for (let p = 0; p < o.pulseCount; p++) {
          const a = baseAngle + (p / o.pulseCount) * Math.PI * 2;
          const x = cx + Math.cos(a) * o.radius;
          const y = cy + Math.sin(a) * o.radius;
          if (scn.glow) {
            const g = ctx.createRadialGradient(x, y, 0, x, y, 22);
            g.addColorStop(0, o.color);
            g.addColorStop(1, `${o.color}00`);
            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.arc(x, y, 22, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        }

        if (playing && !muted) {
          const turns = playhead * cyclesPerSec;
          const phase = (turns * o.pulseCount + o.offsetTurns * o.pulseCount) % o.pulseCount;
          const idx = Math.floor(phase);
          const lastIdx = st.lastPulse.get(o.id) ?? -1;
          if (idx !== lastIdx) {
            st.lastPulse.set(o.id, idx);
            const velocity = Math.max(1, totalPulses);
            getAudio().blip({
              color: o.color,
              orbitId: o.id,
              velocity,
              duration: 0.12,
            });
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
  }, [playing, muted, scene]);

  const addOrbit = () => {
    setScene((prev) => {
      if (prev.orbits.length >= 6) return prev;
      const idx = prev.orbits.length;
      const o: Orbit = {
        id: `o${Date.now()}`,
        pulseCount: [3, 4, 5, 7, 11][idx % 5],
        radius: 50 + idx * 50,
        color: ORBIT_PALETTE[idx % ORBIT_PALETTE.length],
        direction: idx % 2 === 0 ? 1 : -1,
        offsetTurns: 0,
      };
      const next = { ...prev, orbits: [...prev.orbits, o] };
      sceneRef.current = next;
      return next;
    });
  };

  const removeOrbit = (id: string) => {
    setScene((prev) => {
      const next = { ...prev, orbits: prev.orbits.filter((o) => o.id !== id) };
      sceneRef.current = next;
      return next;
    });
  };

  const updateOrbit = (id: string, patch: Partial<Orbit>) => {
    setScene((prev) => {
      const next = {
        ...prev,
        orbits: prev.orbits.map((o) => (o.id === id ? { ...o, ...patch } : o)),
      };
      sceneRef.current = next;
      return next;
    });
  };

  const reset = () => loadScene(DEFAULT_ORBIT_SCENES[0].id);

  return (
    <ModeControlsShell
      mode="orbital"
      scenePresets={DEFAULT_ORBIT_SCENES.map((s) => ({ id: s.id, name: s.name }))}
      activeSceneId={activeSceneId}
      onSelectScene={loadScene}
      onReset={reset}
      transport={
        <>
          <Slider label="BPM" value={bpm} min={40} max={200} step={1} onChange={setBpm} suffix="bpm" />
          <Slider label="Speed" value={speed} min={0.25} max={3} step={0.05} onChange={setSpeed} suffix="x" />
          <Slider label="Trails" value={trail} min={0.02} max={1} step={0.02} onChange={setTrail} suffix="" />
          <Toggle label="Glow" value={glow} onChange={setGlow} />
        </>
      }
      editor={
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-white/45">
              Orbits · {scene.orbits.length}
            </div>
            <button
              onClick={addOrbit}
              disabled={scene.orbits.length >= 6}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-white/70 transition hover:border-[#00FFAA]/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              <Plus size={11} /> Add
            </button>
          </div>
          <div className="space-y-2">
            {scene.orbits.map((o, i) => (
              <div key={o.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ background: o.color, boxShadow: `0 0 10px ${o.color}88` }}
                    />
                    <span className="text-[11px] font-mono uppercase tracking-[0.14em] text-white/70">
                      Ring {i + 1}
                    </span>
                  </div>
                  <button
                    onClick={() => removeOrbit(o.id)}
                    className="text-white/40 transition hover:text-[#FF3366]"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <NumField
                    label="Pulses"
                    value={o.pulseCount}
                    min={1}
                    max={32}
                    onChange={(v) => updateOrbit(o.id, { pulseCount: v })}
                  />
                  <NumField
                    label="Radius"
                    value={o.radius}
                    min={20}
                    max={320}
                    onChange={(v) => updateOrbit(o.id, { radius: v })}
                  />
                  <div>
                    <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/40">
                      Direction
                    </div>
                    <div className="mt-1 flex gap-1">
                      <button
                        onClick={() => updateOrbit(o.id, { direction: 1 })}
                        className={`flex-1 rounded-md border px-2 py-1 text-[10px] font-mono ${
                          o.direction === 1
                            ? "border-[#00FFAA]/40 bg-[#00FFAA]/10 text-[#00FFAA]"
                            : "border-white/10 text-white/55"
                        }`}
                      >
                        CW
                      </button>
                      <button
                        onClick={() => updateOrbit(o.id, { direction: -1 })}
                        className={`flex-1 rounded-md border px-2 py-1 text-[10px] font-mono ${
                          o.direction === -1
                            ? "border-[#00FFAA]/40 bg-[#00FFAA]/10 text-[#00FFAA]"
                            : "border-white/10 text-white/55"
                        }`}
                      >
                        CCW
                      </button>
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] font-mono uppercase tracking-[0.16em] text-white/40">
                      Color
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {ORBIT_PALETTE.slice(0, 8).map((c) => (
                        <button
                          key={c}
                          onClick={() => updateOrbit(o.id, { color: c })}
                          className={`h-5 w-5 rounded-full border ${
                            o.color === c ? "border-white" : "border-transparent"
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
      className="flex w-full items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[10px] font-mono uppercase tracking-[0.16em] text-white/55 transition hover:border-white/15"
    >
      <span>{label}</span>
      <span
        className={`h-4 w-7 rounded-full p-0.5 transition ${
          value ? "bg-[#00FFAA]/80" : "bg-white/15"
        }`}
      >
        <span
          className={`block h-3 w-3 rounded-full bg-white transition ${
            value ? "translate-x-3" : "translate-x-0"
          }`}
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
        className="mt-1 w-full rounded-md border border-white/10 bg-black/30 px-2 py-1 text-[11px] font-mono text-white/85 outline-none focus:border-[#00FFAA]/40"
      />
    </label>
  );
}
