"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CircleDot, Layers, SquarePlay } from "lucide-react";
import { MODES } from "@/lib/rg/types";
import { ORBIT_SCENES } from "@/lib/rg/presets";
import { useRG } from "@/lib/rg/store";
import { OrbitPreview } from "./previews/OrbitPreview";

// Each mode previews a different built-in scene
const MODE_PREVIEW_SCENE: Record<string, (typeof ORBIT_SCENES)[number]> = {
  orbital: ORBIT_SCENES.find((s) => s.id === "deep-moons")!,
  "polyrhythm-study": ORBIT_SCENES.find((s) => s.id === "glass-pendulum")!,
  "riff-cycle-study": ORBIT_SCENES.find((s) => s.id === "hammer-tide")!,
};

export function LaunchView() {
  const goApp = useRG((s) => s.goApp);
  const goHome = useRG((s) => s.goHome);

  return (
    <div className="relative min-h-screen bg-[#090a10] text-white">
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0 opacity-85"
          style={{
            background:
              "radial-gradient(circle at 18% 18%, rgba(0,255,170,0.07), transparent 28%), radial-gradient(circle at 80% 20%, rgba(127,215,255,0.08), transparent 26%), radial-gradient(circle at 70% 76%, rgba(255,209,102,0.08), transparent 24%), linear-gradient(180deg, #090a10 0%, #0d1017 48%, #090a10 100%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
            maskImage:
              "linear-gradient(180deg, rgba(0,0,0,0.92), rgba(0,0,0,0.6), rgba(0,0,0,0.92))",
            WebkitMaskImage:
              "linear-gradient(180deg, rgba(0,0,0,0.92), rgba(0,0,0,0.6), rgba(0,0,0,0.92))",
          }}
        />
      </div>

      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#090a10]/72 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <button
            onClick={goHome}
            className="inline-flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-white/58 transition hover:text-white"
          >
            <ArrowLeft size={14} />
            Back To Site
          </button>
          <div className="text-[14px] font-medium uppercase tracking-[0.28em] text-white/78">
            Rhythmic Geometry
          </div>
          <button
            onClick={() => goApp("orbital")}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-[11px] font-mono uppercase tracking-[0.14em] text-white/72 transition hover:border-white/20 hover:text-white"
          >
            Last Used Mode
          </button>
        </div>
      </header>

      <main className="px-5 pb-16 pt-10 sm:px-8 sm:pb-20 sm:pt-14">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl text-center"
          >
            <h1 className="font-serif text-5xl font-light tracking-[-0.05em] leading-[0.92] sm:text-6xl lg:text-[5.2rem]">
              Geometry Modes
            </h1>
          </motion.div>

          <div className="mt-16 grid gap-5 lg:grid-cols-3">
            {MODES.map((m, i) => {
              const scene = MODE_PREVIEW_SCENE[m.id];
              return (
                <motion.button
                  key={m.id}
                  onClick={() => goApp(m.id)}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: i * 0.08 }}
                  className="group relative flex min-h-[34rem] flex-col overflow-hidden rounded-[2.35rem] border border-white/[0.08] bg-[#0c0f16] p-6 text-left shadow-[0_34px_140px_rgba(0,0,0,0.36)] transition hover:border-white/[0.14] lg:min-h-[39rem]"
                >
                  <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(9,10,16,0.12),rgba(9,10,16,0.26)_32%,rgba(9,10,16,0.88)_100%)]" />
                  <div
                    className="pointer-events-none absolute inset-0 opacity-75"
                    style={{
                      background: `radial-gradient(circle at 22% 18%, ${m.accent}24, transparent 24%), radial-gradient(circle at 75% 70%, rgba(255,255,255,0.12), transparent 20%)`,
                    }}
                  />
                  <div className="relative flex items-start justify-between gap-4 p-1">
                    <div
                      className="rounded-full border border-white/10 bg-black/24 px-4 py-2 text-[10px] font-mono uppercase tracking-[0.16em]"
                      style={{ color: m.accent }}
                    >
                      {m.eyebrow}
                    </div>
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border backdrop-blur-sm"
                      style={{
                        background: `${m.accent}12`,
                        borderColor: `${m.accent}22`,
                        color: m.accent,
                      }}
                    >
                      {m.id === "orbital" ? (
                        <CircleDot size={18} />
                      ) : m.id === "polyrhythm-study" ? (
                        <Layers size={18} />
                      ) : (
                        <SquarePlay size={18} />
                      )}
                    </div>
                  </div>

                  <div className="relative mt-6 flex-1 overflow-hidden rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01))] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_30px_90px_rgba(0,0,0,0.34)]">
                    <div className="h-full overflow-hidden rounded-[1.45rem] bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.06),rgba(9,10,16,0.22)_52%,rgba(9,10,16,0.92)_100%)]">
                      <OrbitPreview
                        orbits={scene.cycles.map((c) => ({
                          pulseCount: c.pulseCount,
                          radius: 30 + c.noteIndex * 6,
                          color: c.color,
                          direction: c.noteIndex % 2 === 0 ? 1 : -1,
                          offsetTurns: c.phase ?? 0,
                        }))}
                        bpm={scene.tempo}
                      />
                    </div>
                  </div>

                  <div className="relative space-y-4 pt-6">
                    <div>
                      <div className="rg-font-serif text-[2.7rem] font-light tracking-[-0.05em] leading-[0.94]">
                        {m.name}
                      </div>
                      <p className="mt-3 max-w-sm text-sm leading-7 text-white/66">{m.summary}</p>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-[1.35rem] border border-white/10 bg-black/28 p-4 backdrop-blur-md">
                        <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/36">
                          Best for
                        </div>
                        <div className="mt-2 text-sm leading-7 text-white/70">{m.bestFor}</div>
                      </div>
                      <div className="rounded-[1.35rem] border border-white/10 bg-black/28 p-4 backdrop-blur-md">
                        <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/36">
                          First move
                        </div>
                        <div className="mt-2 text-sm leading-7 text-white/70">{m.firstMove}</div>
                      </div>
                    </div>
                    <div
                      className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-[12px] font-mono uppercase tracking-[0.14em] transition group-hover:translate-x-1"
                      style={{
                        borderColor: `${m.accent}30`,
                        background: `${m.accent}12`,
                        color: m.accent,
                        boxShadow: `0 0 34px ${m.accent}12`,
                      }}
                    >
                      {m.launchLabel}
                      <ArrowRight size={15} />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="mt-10 grid gap-4 lg:grid-cols-[1.08fr_0.92fr]">
            <div className="rounded-[1.8rem] border border-white/[0.08] bg-white/[0.03] px-6 py-6 text-sm leading-8 text-white/52 sm:px-7">
              <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-white/38">
                How to choose
              </div>
              <div className="mt-4 space-y-3">
                <p>
                  Start with <span className="text-white/78">Orbits</span> if you want the strongest
                  first impression.
                </p>
                <p>
                  Start with <span className="text-white/78">Polyrhythm Study</span> if you want to
                  hear how layered rhythms meet.
                </p>
                <p>
                  Start with <span className="text-white/78">Riff Cycle</span> if you already want to
                  write phrases against a bar frame.
                </p>
              </div>
            </div>
            <div className="rounded-[1.8rem] border border-white/[0.08] bg-[#0c0f16] px-6 py-6 text-sm leading-8 text-white/54 sm:px-7">
              <div className="text-[11px] font-mono uppercase tracking-[0.18em] text-white/38">
                After launch
              </div>
              <p className="mt-4">
                The choice is not permanent. The app opens on one surface first, but the system stays
                connected once you are inside — switch modes from the top nav at any time.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
