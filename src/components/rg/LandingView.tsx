"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CircleDot,
  Layers,
  SquarePlay,
  GalleryVerticalEnd,
  MonitorPlay,
  Waves,
  Sparkles,
} from "lucide-react";
import { MODES, ORBIT_PALETTE } from "@/lib/rg/types";
import { ORBIT_SCENES, TOOLS, PRO_FEATURES } from "@/lib/rg/presets";
import { useRG, getOrbitScene } from "@/lib/rg/store";
import { OrbitPreview } from "./previews/OrbitPreview";

// Verbatim copy from rhythmicgeometry.com landing.
const SCENE_IMAGE_MAP: Record<string, string> = {
  prime_ritual: "https://rhythmicgeometry.com/scene-captures/website_prime_ritual.png",
  rose_engine: "https://rhythmicgeometry.com/scene-captures/website_rose_engine.png",
  blue_mandala: "https://rhythmicgeometry.com/scene-captures/website_standard_replacement.png",
  metallic_whorl: "https://rhythmicgeometry.com/scene-captures/website_metallic_whorl.png",
};

const SHOWCASE_SCENES = [
  "prime_ritual",
  "rose_engine",
  "blue_mandala",
  "metallic_whorl",
].map((id, i) => {
  const preset = getOrbitScene(id === "prime_ritual" ? "deep-moons" : id === "rose_engine" ? "mandala-bells" : id === "blue_mandala" ? "blue-mandala" : "star-bloom");
  return {
    id,
    title: preset.name,
    description: preset.description,
    accent: ["#00FFAA", "#88CCFF", "#FFAA00", "#66DDFF"][i % 4],
    image: SCENE_IMAGE_MAP[id],
    palette: preset.palette,
    cycles: preset.cycles,
    tempo: preset.tempo,
  };
});

const ICONS: Record<string, typeof CircleDot> = {
  Library: GalleryVerticalEnd,
  Edit: SquarePlay,
  Capture: MonitorPlay,
  Fullscreen: CircleDot,
  Layouts: Layers,
  Entry: Waves,
};

export function LandingView() {
  const goApp = useRG((s) => s.goApp);
  const goLaunch = useRG((s) => s.goLaunch);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#090a10] text-white">
      {/* Background — exact radial gradient + grid + concentric rings from original */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0 opacity-90"
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
              "linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,0,0,0.55), rgba(0,0,0,0.9))",
            WebkitMaskImage:
              "linear-gradient(180deg, rgba(0,0,0,0.9), rgba(0,0,0,0.55), rgba(0,0,0,0.9))",
          }}
        />
        {/* Concentric rings (verbatim from original) */}
        <div className="absolute left-1/2 top-28 h-[44rem] w-[44rem] -translate-x-1/2 rounded-full border border-white/[0.06]" />
        <div className="absolute left-1/2 top-28 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full border border-[#3388ff]/10" />
        <div className="absolute left-1/2 top-28 h-[21rem] w-[21rem] -translate-x-1/2 rounded-full border border-[#ff3366]/10" />
        <div className="absolute left-1/2 top-28 h-[12rem] w-[12rem] -translate-x-1/2 rounded-full border border-[#00ffaa]/12" />
      </div>

      {/* Header — exact copy from original, mobile-optimized */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#090a10]/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-3 py-3 sm:px-8 sm:py-4">
          <button onClick={() => useRG.getState().goHome()} className="group block min-w-0">
            <div className="truncate text-[12px] font-medium uppercase tracking-[0.2em] text-white/82 transition-colors group-hover:text-white sm:text-[15px] sm:tracking-[0.34em] md:text-[17px]">
              Rhythmic Geometry
              <span className="align-super text-[0.52em] tracking-[0.08em]">™</span>
            </div>
          </button>
          <nav className="hidden items-center gap-6 text-[12px] font-mono uppercase tracking-[0.14em] text-white/54 md:flex">
            <a href="#modes" className="transition-colors hover:text-white">
              Modes
            </a>
            <a href="#showcase" className="transition-colors hover:text-white">
              Showcase
            </a>
            <a href="#philosophy" className="transition-colors hover:text-white">
              What Is It?
            </a>
            <a href="#tools" className="transition-colors hover:text-white">
              Tools
            </a>
            <a href="#pro" className="transition-colors hover:text-white">
              Pro
            </a>
          </nav>
          <button
            onClick={() => goLaunch()}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#00ffaa]/25 bg-[#00ffaa]/12 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.12em] text-[#00ffaa] transition hover:bg-[#00ffaa]/18 sm:gap-2 sm:px-4 sm:py-2 sm:text-[11px] sm:tracking-[0.14em]"
          >
            Launch App
            <ArrowRight size={12} className="sm:hidden" />
            <ArrowRight size={14} className="hidden sm:inline" />
          </button>
        </div>
      </header>

      <main>
        {/* HERO — exact copy from original, mobile-optimized */}
        <section className="px-3 pt-10 pb-16 sm:px-8 sm:pt-20 sm:pb-24">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mx-auto grid max-w-7xl gap-6 sm:gap-12 lg:grid-cols-[0.84fr_1.16fr] lg:items-end"
          >
            <div className="flex max-w-2xl flex-col items-center sm:block">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-white/62 sm:px-4 sm:py-2 sm:text-[11px] sm:tracking-[0.16em]">
                <Sparkles size={12} className="text-[#7fd7ff] sm:size-3.5" />
                See The Structure Inside Rhythm
              </div>
              <h1 className="mt-6 w-fit text-center font-serif text-[2rem] font-light tracking-[-0.05em] leading-[0.95] text-white sm:mt-14 sm:max-w-2xl sm:w-auto sm:text-left sm:text-[4.25rem] sm:leading-[0.94] lg:text-[5rem]">
                Rhythm
                <br />
                Visualized
                <br />
                Through
                <br />
                Geometry
              </h1>
              <p className="mt-5 max-w-lg text-center text-sm leading-7 text-white/64 sm:mt-12 sm:max-w-xl sm:text-left sm:text-lg sm:leading-8">
                A moving visual instrument for exploring rhythm as structure.
                <br />
                <br />
                Set simple ratios. Watch them unfold into motion, pattern, and form.
              </p>
              <p className="mt-6 hidden max-w-xl text-center text-sm leading-8 text-white/44 sm:block sm:text-left sm:text-base">
                What you hear as rhythm... reveals itself as geometry over time.
              </p>

              {/* Mode launch buttons */}
              <div className="mt-8 flex flex-wrap items-center justify-center gap-2 sm:mt-14 sm:justify-start sm:gap-4">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => goApp(m.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[10px] font-mono uppercase tracking-[0.12em] transition sm:gap-2 sm:px-5 sm:py-3 sm:text-[12px] sm:tracking-[0.14em]"
                    style={{
                      borderColor: `${m.accent}30`,
                      background: `${m.accent}12`,
                      color: m.accent,
                    }}
                  >
                    {m.launchLabel}
                    <ArrowRight size={12} className="sm:hidden" />
                    <ArrowRight size={15} className="hidden sm:inline" />
                  </button>
                ))}
              </div>

              {/* Mini mode cards */}
              <div className="mt-6 hidden w-full gap-3 sm:grid sm:grid-cols-3">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => goApp(m.id)}
                    className="rounded-[1.25rem] border border-white/[0.08] bg-white/[0.02] px-4 py-4 text-left transition hover:bg-white/[0.04]"
                    style={{
                      borderColor: `${m.accent}30`,
                      boxShadow: `0 0 48px ${m.accent}22, inset 0 1px 0 rgba(255,255,255,0.06)`,
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div
                        className="text-[10px] font-mono uppercase tracking-[0.16em]"
                        style={{ color: m.accent }}
                      >
                        {m.name}
                      </div>
                      {m.id === "orbital" ? (
                        <CircleDot size={15} style={{ color: m.accent }} />
                      ) : m.id === "polyrhythm-study" ? (
                        <Layers size={15} style={{ color: m.accent }} />
                      ) : (
                        <SquarePlay size={15} style={{ color: m.accent }} />
                      )}
                    </div>
                    <div className="mt-3 text-sm leading-6 text-white/60">{m.bestFor}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Hero preview canvas */}
            <div className="relative">
              <div
                className="absolute inset-0 rounded-[2rem] blur-3xl sm:rounded-[2.6rem]"
                style={{
                  background: `radial-gradient(circle at 30% 24%, #00FFAA34, transparent 30%), radial-gradient(circle at 74% 26%, rgba(255,255,255,0.14), transparent 20%), radial-gradient(circle at 70% 72%, #00FFAA14, transparent 26%), linear-gradient(180deg, rgba(9,10,16,0.22), rgba(9,10,16,0.02))`,
                }}
              />
              <div className="relative overflow-hidden rounded-[1.9rem] border border-white/10 bg-[#0b0e14]/82 shadow-[0_30px_110px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:rounded-[2.5rem] sm:shadow-[0_40px_160px_rgba(0,0,0,0.5)]">
                <div className="border-b border-white/10 px-5 py-4 sm:px-6 sm:py-5">
                  <div className="mx-auto flex max-w-xl flex-col items-center text-center">
                    <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-[#00FFAA]">
                      See rhythm as motion.
                    </div>
                    <div className="mt-2 font-serif text-[1.6rem] font-light tracking-[-0.05em] leading-[0.95] text-white sm:text-[2.05rem]">
                      Orbit
                    </div>
                    <p className="mt-2 hidden text-sm leading-7 text-white/58 sm:block">
                      Every ratio becomes a path. Every cycle leaves a shape.
                    </p>
                  </div>
                </div>
                <div className="relative h-[14.5rem] overflow-hidden sm:aspect-[1.08/0.86] sm:h-auto">
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(9,10,16,0.08),rgba(9,10,16,0.2)_36%,rgba(9,10,16,0.72)_100%)]" />
                  <div
                    className="absolute inset-0 opacity-60"
                    style={{
                      background:
                        "radial-gradient(circle at 20% 22%, #00FFAA26, transparent 24%), radial-gradient(circle at 74% 20%, rgba(255,255,255,0.12), transparent 18%), radial-gradient(circle at 70% 76%, #00FFAA16, transparent 24%)",
                    }}
                  />
                  <div className="absolute inset-[1rem] rounded-[1.2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_20px_48px_rgba(0,0,0,0.28)] sm:inset-[3.1rem] sm:rounded-[2rem] sm:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_30px_80px_rgba(0,0,0,0.34)]">
                    <div className="absolute inset-[0.7rem] overflow-hidden rounded-[0.95rem] bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.06),rgba(9,10,16,0.22)_52%,rgba(9,10,16,0.92)_100%)] sm:inset-[1.35rem] sm:rounded-[1.4rem]">
                      <OrbitPreview
                        orbits={ORBIT_SCENES[0].cycles.map((c) => ({
                          pulseCount: c.pulseCount,
                          radius: 40 + c.noteIndex * 8,
                          color: c.color,
                          direction: c.noteIndex % 2 === 0 ? 1 : -1,
                          offsetTurns: c.phase ?? 0,
                        }))}
                        bpm={ORBIT_SCENES[0].tempo}
                      />
                    </div>
                  </div>
                </div>
                <div className="hidden gap-3 border-t border-white/10 px-6 py-6 md:grid-cols-[1fr_1fr] sm:grid">
                  <div className="rounded-[1.4rem] border border-white/10 bg-black/24 p-4 backdrop-blur-md">
                    <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/34">
                      Best for
                    </div>
                    <div className="mt-2 text-sm leading-7 text-white/68">
                      Seeing rhythm as motion.
                    </div>
                  </div>
                  <div className="rounded-[1.4rem] border border-white/10 bg-black/24 p-4 backdrop-blur-md">
                    <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/34">
                      First move
                    </div>
                    <div className="mt-2 text-sm leading-7 text-white/68">
                      Set a simple ratio and press Play.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* MODES — exact copy */}
        <section
          id="modes"
          className="border-y border-white/[0.12] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.015))] px-5 py-18 sm:px-8 sm:py-24"
        >
          <div className="mx-auto max-w-7xl lg:grid lg:grid-cols-[0.6fr_0.4fr] lg:gap-14">
            <div>
              <div className="max-w-2xl">
                <div className="inline-flex items-center rounded-full border border-[#7FD7FF]/20 bg-[#7FD7FF]/[0.08] px-4 py-2 text-[11px] font-mono uppercase tracking-[0.2em] text-[#7FD7FF] shadow-[0_0_24px_rgba(127,215,255,0.08)]">
                  Three Clear Entries
                </div>
                <h2 className="mt-4 font-serif text-3xl font-light tracking-[-0.04em] text-white sm:text-5xl sm:leading-[0.98]">
                  The Instrument
                </h2>
                <p className="mt-5 max-w-2xl text-sm leading-8 text-white/48 sm:text-base">
                  Not a visualization. A system.
                </p>
                <p className="mt-4 max-w-2xl text-sm leading-8 text-white/48 sm:text-base">
                  Rhythmic Geometry™ is a space for discovery. Simple inputs create complex results —
                  patterns that emerge, repeat, and transform over time.
                </p>
                <p className="mt-4 max-w-2xl text-sm leading-8 text-white/42 sm:text-base">
                  Set constraints. Watch structure appear.
                </p>
              </div>

              <div className="mt-12 space-y-10 lg:space-y-0">
                {MODES.map((m) => (
                  <div key={m.id} className="lg:flex lg:min-h-[78vh] lg:items-center">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-80px" }}
                      transition={{ duration: 0.55 }}
                      className="max-w-xl rounded-[2rem] border border-white/[0.08] bg-white/[0.02] p-6 sm:p-8"
                      style={{
                        borderColor: `${m.accent}30`,
                        boxShadow: `0 0 80px ${m.accent}10, inset 0 1px 0 rgba(255,255,255,0.06)`,
                      }}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div
                          className="text-[10px] font-mono uppercase tracking-[0.18em]"
                          style={{ color: m.accent }}
                        >
                          {m.eyebrow}
                        </div>
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-2xl border"
                          style={{
                            background: `${m.accent}12`,
                            borderColor: `${m.accent}1f`,
                            color: m.accent,
                          }}
                        >
                          {m.id === "orbital" ? (
                            <CircleDot size={16} />
                          ) : m.id === "polyrhythm-study" ? (
                            <Layers size={16} />
                          ) : (
                            <SquarePlay size={16} />
                          )}
                        </div>
                      </div>
                      <div className="mt-5 font-serif text-[2.65rem] font-light tracking-[-0.05em] leading-[0.95] text-white">
                        {m.name}
                      </div>
                      <p className="mt-4 text-lg leading-8 text-white/72">{m.eyebrow}</p>
                      <p className="mt-5 text-sm leading-8 text-white/58">{m.description}</p>
                      <div className="mt-6 border-t border-white/10 pt-6">
                        <div className="rounded-[1.3rem] border border-white/8 bg-[#090a10]/72 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                          <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/34">
                            Form
                          </div>
                          <div className="mt-2 text-sm leading-7 text-white/66">{m.summary}</div>
                        </div>
                      </div>
                      <div className="mt-6 border-t border-white/10 pt-6">
                        <div className="space-y-3">
                          {m.details.slice(0, 2).map((d) => (
                            <div key={d} className="flex items-start gap-3 text-sm leading-7 text-white/62">
                              <div
                                className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full"
                                style={{ background: m.accent, boxShadow: `0 0 10px ${m.accent}` }}
                              />
                              <span>{d}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-7">
                        <button
                          onClick={() => goApp(m.id)}
                          className="inline-flex items-center gap-2 rounded-full border px-5 py-3 text-[12px] font-mono uppercase tracking-[0.14em] transition"
                          style={{
                            borderColor: `${m.accent}30`,
                            background: `${m.accent}12`,
                            color: m.accent,
                            boxShadow: `0 0 26px ${m.accent}10`,
                          }}
                        >
                          {m.launchLabel}
                          <ArrowRight size={15} />
                        </button>
                      </div>
                    </motion.div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SHOWCASE — exact copy */}
        <section
          id="showcase"
          className="border-y border-white/10 px-5 py-18 sm:px-8 sm:py-24"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <div className="inline-flex items-center rounded-full border border-[#00FFAA]/20 bg-[#00FFAA]/[0.08] px-4 py-2 text-[11px] font-mono uppercase tracking-[0.2em] text-[#00FFAA] shadow-[0_0_24px_rgba(0,255,170,0.08)]">
                Orbits Showcase
              </div>
              <h2 className="mt-4 font-serif text-3xl font-light tracking-[-0.04em] text-white sm:text-5xl sm:leading-[0.98]">
                Orbits scenes where moving ratios leave visible form behind.
              </h2>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {SHOWCASE_SCENES.map((s, i) => (
                <motion.button
                  key={s.id}
                  onClick={() => goApp("orbital")}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-60px" }}
                  transition={{ duration: 0.55, delay: i * 0.05 }}
                  className="group overflow-hidden rounded-[1.8rem] border border-white/8 bg-white/[0.03] text-left shadow-[0_24px_80px_rgba(0,0,0,0.24)] transition hover:border-white/14 hover:bg-white/[0.045]"
                >
                  <div className="flex items-center justify-between px-5 pt-5">
                    <div
                      className="text-[10px] font-mono uppercase tracking-[0.16em]"
                      style={{ color: s.accent }}
                    >
                      {i === 0 ? "Featured Orbits Scene" : "Orbits Scene"}
                    </div>
                    <ArrowRight size={14} style={{ color: s.accent }} />
                  </div>
                  <div className="relative mt-4 aspect-[1.14/1] overflow-hidden border-y border-white/8 bg-[radial-gradient(circle_at_50%_42%,rgba(255,255,255,0.05),rgba(9,10,16,0.22)_52%,rgba(9,10,16,0.92)_100%)]">
                    <OrbitPreview
                      orbits={s.cycles.map((c) => ({
                        pulseCount: c.pulseCount,
                        radius: 30 + c.noteIndex * 7,
                        color: c.color,
                        direction: c.noteIndex % 2 === 0 ? 1 : -1,
                        offsetTurns: c.phase ?? 0,
                      }))}
                      bpm={s.tempo}
                    />
                  </div>
                  <div className="px-5 py-5">
                    <div className="font-serif text-[1.75rem] font-light leading-[0.96] text-white">
                      {s.title}
                    </div>
                    <p className="mt-2 text-sm leading-7 text-white/52">{s.description}</p>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        </section>

        {/* PHILOSOPHY — exact copy */}
        <section
          id="philosophy"
          className="border-y border-white/10 px-5 py-18 sm:px-8 sm:py-24"
        >
          <div className="mx-auto max-w-5xl text-center">
            <div className="mx-auto inline-flex w-fit items-center rounded-full border border-white/10 bg-white/[0.035] px-4 py-2 text-[11px] font-mono uppercase tracking-[0.2em] text-white/54">
              Why it works
            </div>
            <h2 className="mx-auto mt-6 max-w-3xl font-serif text-3xl font-light tracking-[-0.04em] text-white sm:text-5xl sm:leading-[1.02]">
              Rhythm is ratio. Ratio creates motion. Motion forms geometry.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-sm leading-8 text-white/56 sm:text-base">
              What you hear... is structure unfolding in time.
            </p>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-8 text-white/42 sm:text-base">
              Music, math, motion, and form — different expressions of the same relationship.
            </p>
          </div>
        </section>

        {/* TOOLS — exact copy */}
        <section id="tools" className="border-y border-white/10 px-5 py-18 sm:px-8 sm:py-24">
          <div className="mx-auto max-w-7xl">
            <div className="mb-14 max-w-2xl">
              <div className="inline-flex items-center rounded-full border border-[#88CCFF]/20 bg-[#88CCFF]/[0.08] px-4 py-2 text-[11px] font-mono uppercase tracking-[0.2em] text-[#88CCFF] shadow-[0_0_24px_rgba(136,204,255,0.08)]">
                Tools
              </div>
              <h2 className="mt-4 font-serif text-3xl font-light tracking-[-0.04em] text-white sm:text-5xl sm:leading-[0.98]">
                Built to watch, write, and capture.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {TOOLS.map((t, i) => {
                const Icon = ICONS[t.label] ?? CircleDot;
                return (
                  <motion.div
                    key={t.title}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                    className="rounded-[1.5rem] border border-white/[0.08] bg-[#0a0d14] p-6 transition hover:border-white/[0.18]"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#00FFAA]">
                      <Icon size={18} />
                    </div>
                    <div className="mt-5 text-[10px] font-mono uppercase tracking-[0.2em] text-white/45">
                      {t.label}
                    </div>
                    <div className="mt-1 font-serif text-2xl font-light tracking-[-0.02em]">
                      {t.title}
                    </div>
                    <p className="mt-3 text-[13px] leading-7 text-white/55">{t.text}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* PRO — exact copy */}
        <section id="pro" className="border-y border-white/10 px-5 py-8 sm:px-8 sm:py-10">
          <div className="mx-auto max-w-7xl">
            <div className="overflow-hidden rounded-[2.1rem] border border-white/10 bg-[#0d1017]/88 shadow-[0_30px_120px_rgba(0,0,0,0.32)] backdrop-blur-xl">
              <div className="grid gap-0 lg:grid-cols-[0.92fr_1.08fr]">
                <div className="relative px-6 py-8 sm:px-8 sm:py-10">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,170,0,0.12),transparent_30%),radial-gradient(circle_at_76%_72%,rgba(0,255,170,0.08),transparent_28%)]" />
                  <div className="relative">
                    <div className="inline-flex items-center rounded-full border border-[#FFAA00]/20 bg-[#FFAA00]/[0.08] px-4 py-2 text-[11px] font-mono uppercase tracking-[0.2em] text-[#FFAA00] shadow-[0_0_24px_rgba(255,170,0,0.09)]">
                      Extended Access
                    </div>
                    <h2 className="mt-4 max-w-lg text-3xl font-light tracking-[-0.04em] text-white sm:text-[2.65rem] sm:leading-[1.02]">
                      Keep the scenes that matter and go further with them.
                    </h2>
                    <p className="mt-5 max-w-xl text-sm leading-7 text-white/60 sm:text-base">
                      Pro unlocks scene saving, premium studies, broader randomization, export tools,
                      and the wider control set across Orbits, Polyrhythm Study, and Riff Cycle.
                    </p>
                    <p className="mt-4 max-w-xl text-[13px] leading-7 text-white/42 sm:text-sm">
                      It is for the version of the app you come back to: the one where strong ideas
                      stay organized, get refined, and keep turning into finished work.
                    </p>
                    <div className="mt-8 flex flex-wrap items-center gap-4">
                      <button
                        onClick={() => goLaunch()}
                        className="inline-flex items-center gap-2 rounded-full border border-[#FFAA00]/25 bg-[#FFAA00]/10 px-5 py-3 text-[12px] font-mono uppercase tracking-[0.14em] text-[#FFAA00] transition hover:bg-[#FFAA00]/16"
                      >
                        Unlock Pro In App
                        <ArrowRight size={15} />
                      </button>
                      <div className="text-[11px] font-mono uppercase tracking-[0.14em] text-white/42">
                        Pro already active on this account
                      </div>
                    </div>
                  </div>
                </div>
                <div className="border-t border-white/8 px-6 py-8 sm:px-8 sm:py-10 lg:border-l lg:border-t-0">
                  <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    {PRO_FEATURES.map((t) => (
                      <div
                        key={t.title}
                        className="rounded-[1.15rem] border border-white/8 bg-white/[0.03] p-4 sm:rounded-[1.4rem] sm:p-5"
                      >
                        <div className="text-[10px] font-mono uppercase tracking-[0.18em] text-[#FFAA00]/84">
                          {t.label}
                        </div>
                        <div className="mt-2 text-[1rem] font-light leading-[1.08] text-white sm:mt-3 sm:text-xl">
                          {t.title}
                        </div>
                        <p className="mt-2 text-[11px] leading-5 text-white/52 sm:mt-3 sm:text-sm sm:leading-7">
                          {t.text}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA — exact copy */}
        <section className="border-t border-white/10 px-5 pb-20 pt-8 sm:px-8 sm:pb-28">
          <div className="mx-auto max-w-5xl">
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.035] px-6 py-10 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_24px_80px_rgba(0,0,0,0.24)] sm:px-10 sm:py-14">
              <div className="text-[11px] font-mono uppercase tracking-[0.24em] text-white/42">
                Open The Instrument
              </div>
              <h2 className="mt-4 font-serif text-3xl font-light tracking-[-0.04em] text-white sm:text-5xl">
                Start exploring.
              </h2>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={() => goLaunch()}
                  className="inline-flex items-center gap-2 rounded-full border border-[#00ffaa]/25 bg-[#00ffaa]/12 px-5 py-3 text-[12px] font-mono uppercase tracking-[0.14em] text-[#00ffaa] transition hover:bg-[#00ffaa]/18"
                >
                  Choose A Mode
                  <ArrowRight size={15} />
                </button>
                <a
                  href="#modes"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 px-5 py-3 text-[12px] font-mono uppercase tracking-[0.14em] text-white/74 transition hover:border-white/20 hover:text-white"
                >
                  Explore The Modes
                </a>
              </div>
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 px-5 py-8 text-center sm:px-8">
          <p className="mx-auto max-w-3xl text-[11px] font-mono uppercase tracking-[0.14em] text-white/34">
            Rhythmic Geometry™ is a trademark of Marc DeBlasie. The original rhythm geometry app.
          </p>
        </footer>
      </main>
    </div>
  );
}

// Keep ORBIT_PALETTE import used (avoid unused warning)
void ORBIT_PALETTE;
