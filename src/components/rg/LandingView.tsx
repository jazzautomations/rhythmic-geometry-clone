"use client";

import { motion } from "framer-motion";
import {
  ArrowRight,
  CircleDot,
  Layers,
  SquarePlay,
  Waves,
  MonitorPlay,
  GalleryVerticalEnd,
  Sparkles,
} from "lucide-react";
import { MODES, ORBIT_PALETTE } from "@/lib/rg/types";
import { useRG } from "@/lib/rg/store";
import { OrbitPreview } from "./previews/OrbitPreview";

export function LandingView() {
  const goApp = useRG((s) => s.goApp);
  const goLaunch = useRG((s) => s.goLaunch);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#05070d] text-white">
      {/* Background aurora + grid */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 opacity-90 rg-glow-aurora" />
        <div className="absolute inset-0 opacity-25 rg-grid-bg" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#05070d]/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.28em] text-white/78">
            <span className="inline-block h-2 w-2 rounded-full bg-[#00FFAA] shadow-[0_0_12px_#00FFAA]" />
            Rhythmic Geometry
          </div>
          <nav className="hidden items-center gap-7 text-[11px] font-mono uppercase tracking-[0.18em] text-white/55 md:flex">
            <a href="#modes" className="transition hover:text-white">
              Modes
            </a>
            <a href="#showcase" className="transition hover:text-white">
              Showcase
            </a>
            <a href="#tools" className="transition hover:text-white">
              Tools
            </a>
            <a href="#philosophy" className="transition hover:text-white">
              Why
            </a>
          </nav>
          <button
            onClick={() => goLaunch()}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-2 text-[11px] font-mono uppercase tracking-[0.14em] text-white/78 transition hover:border-[#00FFAA]/40 hover:text-white"
          >
            Open App
            <ArrowRight size={13} />
          </button>
        </div>
      </header>

      {/* Hero */}
      <section className="relative px-5 pt-24 pb-28 sm:px-8 sm:pt-32 sm:pb-36">
        <div className="mx-auto max-w-5xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-[10px] font-mono uppercase tracking-[0.22em] text-white/58"
          >
            <Sparkles size={11} className="text-[#00FFAA]" />
            Reverse-engineered clone · Next.js + Web Audio
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.05 }}
            className="rg-font-serif text-[3.5rem] font-light leading-[0.92] tracking-[-0.05em] sm:text-[5.5rem] lg:text-[7rem]"
          >
            See rhythm
            <br />
            as <span className="italic text-[#00FFAA]">motion</span>, shape,
            <br />
            and return.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
            className="mx-auto mt-9 max-w-2xl text-[15px] leading-8 text-white/64 sm:text-base"
          >
            A visual rhythm tool for seeing polymeters, riffs, orbits, and musical structures as motion and shape.
            Three connected surfaces, one shared geometry engine — every pulse becomes light, every cycle leaves a
            trace.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.25 }}
            className="mt-12 flex flex-wrap items-center justify-center gap-3"
          >
            <button
              onClick={() => goApp("orbital")}
              className="group inline-flex items-center gap-2 rounded-full bg-[#00FFAA] px-7 py-3.5 text-[12px] font-mono uppercase tracking-[0.16em] text-[#05070d] transition hover:shadow-[0_0_40px_rgba(0,255,170,0.45)]"
            >
              Enter Orbit
              <ArrowRight size={14} className="transition group-hover:translate-x-1" />
            </button>
            <button
              onClick={() => goLaunch()}
              className="inline-flex items-center gap-2 rounded-full border border-white/12 px-7 py-3.5 text-[12px] font-mono uppercase tracking-[0.16em] text-white/82 transition hover:border-white/25 hover:text-white"
            >
              Choose a mode
            </button>
          </motion.div>
        </div>

        {/* Floating orbit preview */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.35 }}
          className="relative mx-auto mt-20 max-w-3xl"
        >
          <div className="relative aspect-[16/10] overflow-hidden rounded-[2rem] border border-white/10 bg-[#0a0d14] shadow-[0_50px_180px_rgba(0,0,0,0.55)]">
            <OrbitPreview />
            <div className="absolute left-5 top-5 rounded-full border border-white/10 bg-black/30 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-white/65 backdrop-blur-md">
              Live · Orbit preview
            </div>
          </div>
        </motion.div>
      </section>

      {/* Modes */}
      <section id="modes" className="px-5 py-24 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 max-w-2xl">
            <div className="mb-4 text-[11px] font-mono uppercase tracking-[0.22em] text-[#00FFAA]/85">
              Three modes · one engine
            </div>
            <h2 className="rg-font-serif text-4xl font-light leading-[1] tracking-[-0.04em] sm:text-5xl">
              Each surface reveals a different angle of the same geometry.
            </h2>
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            {MODES.map((m, i) => (
              <motion.button
                key={m.id}
                onClick={() => goApp(m.id)}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.6, delay: i * 0.08 }}
                className="group relative flex min-h-[28rem] flex-col overflow-hidden rounded-[2rem] border border-white/[0.08] bg-[#0c0f16] p-7 text-left transition hover:border-white/[0.18]"
              >
                <div
                  className="pointer-events-none absolute inset-0 opacity-60 transition group-hover:opacity-90"
                  style={{
                    background: `radial-gradient(circle at 20% 10%, ${m.accent}22, transparent 35%), radial-gradient(circle at 80% 90%, rgba(255,255,255,0.06), transparent 30%)`,
                  }}
                />
                <div className="relative flex items-start justify-between">
                  <div
                    className="rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.18em]"
                    style={{
                      borderColor: `${m.accent}30`,
                      color: m.accent,
                      background: `${m.accent}10`,
                    }}
                  >
                    {m.eyebrow}
                  </div>
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl border"
                    style={{
                      background: `${m.accent}12`,
                      borderColor: `${m.accent}22`,
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
                <h3 className="relative mt-7 rg-font-serif text-[2.4rem] font-light tracking-[-0.04em]">
                  {m.name}
                </h3>
                <p className="relative mt-3 text-sm leading-7 text-white/64">{m.summary}</p>
                <p className="relative mt-4 text-[13px] leading-7 text-white/45">{m.description}</p>
                <div className="relative mt-auto flex items-center gap-2 pt-7 text-[11px] font-mono uppercase tracking-[0.16em] transition group-hover:translate-x-1"
                  style={{ color: m.accent }}
                >
                  {m.launchLabel}
                  <ArrowRight size={13} />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </section>

      {/* Showcase */}
      <section id="showcase" className="px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex items-end justify-between gap-6">
            <div>
              <div className="mb-4 text-[11px] font-mono uppercase tracking-[0.22em] text-[#7FD7FF]/85">
                Built-in scenes
              </div>
              <h2 className="rg-font-serif text-4xl font-light leading-[1] tracking-[-0.04em] sm:text-5xl">
                Start from a scene, not a blank canvas.
              </h2>
            </div>
            <button
              onClick={() => goApp("orbital")}
              className="hidden shrink-0 items-center gap-2 rounded-full border border-white/12 px-5 py-2.5 text-[11px] font-mono uppercase tracking-[0.14em] text-white/75 transition hover:border-white/25 hover:text-white sm:inline-flex"
            >
              Open in Orbit
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {SHOWCASE_SCENES.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.55, delay: i * 0.06 }}
                className="group relative aspect-square overflow-hidden rounded-[1.5rem] border border-white/[0.08] bg-[#0c0f16] transition hover:border-white/[0.18]"
              >
                <div
                  className="absolute inset-0 opacity-70 transition group-hover:opacity-100"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${s.accent}30, transparent 60%), radial-gradient(circle at 20% 80%, ${s.accent2}25, transparent 55%)`,
                  }}
                />
                <OrbitPreview
                  seed={s.id}
                  orbits={s.orbits}
                  className="absolute inset-0"
                  small
                />
                <div className="absolute inset-0 flex flex-col justify-end p-5">
                  <div className="text-[10px] font-mono uppercase tracking-[0.2em] text-white/50">
                    Orbit Scene
                  </div>
                  <div className="mt-1 rg-font-serif text-2xl font-light tracking-[-0.02em]">
                    {s.name}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools */}
      <section id="tools" className="px-5 py-24 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 max-w-2xl">
            <div className="mb-4 text-[11px] font-mono uppercase tracking-[0.22em] text-[#FFD166]/85">
              Tools
            </div>
            <h2 className="rg-font-serif text-4xl font-light leading-[1] tracking-[-0.04em] sm:text-5xl">
              Built to watch, write, and capture.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {TOOLS.map((t, i) => (
              <motion.div
                key={t.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="rounded-[1.5rem] border border-white/[0.08] bg-[#0a0d14] p-6 transition hover:border-white/[0.18]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#00FFAA]">
                  <t.icon size={18} />
                </div>
                <div className="mt-5 text-[10px] font-mono uppercase tracking-[0.2em] text-white/45">
                  {t.label}
                </div>
                <div className="mt-1 rg-font-serif text-2xl font-light tracking-[-0.02em]">
                  {t.title}
                </div>
                <p className="mt-3 text-[13px] leading-7 text-white/55">{t.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section id="philosophy" className="px-5 py-28 sm:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 text-[11px] font-mono uppercase tracking-[0.22em] text-[#FF7799]/85">
            Philosophy
          </div>
          <h2 className="rg-font-serif text-4xl font-light leading-[1.05] tracking-[-0.04em] sm:text-6xl">
            Rhythm is not a beat.
            <br />
            It is the <span className="italic text-[#7FD7FF]">shape of return</span>.
          </h2>
          <p className="mx-auto mt-8 max-w-2xl text-[15px] leading-8 text-white/62">
            Every polyrhythm is a curve. Every riff is a path. When you watch cycles turn together, you stop
            counting and start seeing — the moment a pattern comes home is visible long before you can hear it.
            This tool is built around that single idea: make the structure visible, and the music follows.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="px-5 pb-32 sm:px-8">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#0a0d14] px-8 py-16 text-center sm:px-16">
          <div className="mx-auto mb-8 flex max-w-md flex-wrap items-center justify-center gap-2">
            {ORBIT_PALETTE.slice(0, 8).map((c) => (
              <span
                key={c}
                className="h-2 w-8 rounded-full"
                style={{ background: c, boxShadow: `0 0 12px ${c}55` }}
              />
            ))}
          </div>
          <h2 className="rg-font-serif text-4xl font-light leading-[1] tracking-[-0.04em] sm:text-6xl">
            Press play. Watch the cycle return.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[15px] leading-8 text-white/58">
            Three modes. One geometry engine. Zero sign-up. The clone runs entirely in your browser using Web
            Audio and Canvas 2D.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => goApp("orbital")}
              className="inline-flex items-center gap-2 rounded-full bg-[#00FFAA] px-7 py-3.5 text-[12px] font-mono uppercase tracking-[0.16em] text-[#05070d] transition hover:shadow-[0_0_40px_rgba(0,255,170,0.45)]"
            >
              Enter Orbit
              <ArrowRight size={14} />
            </button>
            <button
              onClick={() => goApp("polyrhythm-study")}
              className="inline-flex items-center gap-2 rounded-full border border-[#7FD7FF]/30 bg-[#7FD7FF]/10 px-7 py-3.5 text-[12px] font-mono uppercase tracking-[0.16em] text-[#7FD7FF] transition hover:bg-[#7FD7FF]/15"
            >
              Open Study
            </button>
            <button
              onClick={() => goApp("riff-cycle-study")}
              className="inline-flex items-center gap-2 rounded-full border border-[#FFD166]/30 bg-[#FFD166]/10 px-7 py-3.5 text-[12px] font-mono uppercase tracking-[0.16em] text-[#FFD166] transition hover:bg-[#FFD166]/15"
            >
              Start Riff
            </button>
          </div>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 text-[11px] font-mono uppercase tracking-[0.16em] text-white/40 sm:flex-row sm:items-center">
          <div>Rhythmic Geometry — Clone · Built with Next.js + Web Audio</div>
          <div>Reverse-engineered for educational purposes · No commercial use</div>
        </div>
      </footer>
    </div>
  );
}

const SHOWCASE_SCENES = [
  {
    id: "prime-ritual",
    name: "Prime Ritual",
    accent: "#00FFAA",
    accent2: "#3388FF",
    orbits: [
      { pulseCount: 2, radius: 35, color: "#00FFAA", direction: 1 as const, offsetTurns: 0 },
      { pulseCount: 3, radius: 65, color: "#3388FF", direction: 1 as const, offsetTurns: 0 },
      { pulseCount: 5, radius: 100, color: "#FFAA00", direction: -1 as const, offsetTurns: 0.5 },
    ],
  },
  {
    id: "rose-engine",
    name: "Rose Engine",
    accent: "#88CCFF",
    accent2: "#AA44FF",
    orbits: [
      { pulseCount: 4, radius: 40, color: "#88CCFF", direction: 1 as const, offsetTurns: 0 },
      { pulseCount: 7, radius: 75, color: "#AA44FF", direction: -1 as const, offsetTurns: 0 },
      { pulseCount: 11, radius: 115, color: "#32CD32", direction: 1 as const, offsetTurns: 0.25 },
    ],
  },
  {
    id: "blue-mandala",
    name: "Blue Mandala",
    accent: "#00CCFF",
    accent2: "#7D89FF",
    orbits: [
      { pulseCount: 3, radius: 30, color: "#00CCFF", direction: 1 as const, offsetTurns: 0 },
      { pulseCount: 5, radius: 55, color: "#88CCFF", direction: 1 as const, offsetTurns: 0 },
      { pulseCount: 7, radius: 85, color: "#7D89FF", direction: -1 as const, offsetTurns: 0.5 },
      { pulseCount: 9, radius: 120, color: "#72F1B8", direction: 1 as const, offsetTurns: 0 },
    ],
  },
  {
    id: "metallic-whorl",
    name: "Metallic Whorl",
    accent: "#FFD166",
    accent2: "#FF3366",
    orbits: [
      { pulseCount: 5, radius: 35, color: "#FFD166", direction: 1 as const, offsetTurns: 0 },
      { pulseCount: 8, radius: 70, color: "#FF3366", direction: -1 as const, offsetTurns: 0 },
      { pulseCount: 13, radius: 115, color: "#AA44FF", direction: 1 as const, offsetTurns: 0.3 },
    ],
  },
];

const TOOLS = [
  {
    icon: GalleryVerticalEnd,
    label: "Library",
    title: "Scene Library",
    text: "Built-in scenes give Orbits, Polyrhythm Study, and Riff Cycle a strong starting point instead of a blank canvas.",
  },
  {
    icon: SquarePlay,
    label: "Edit",
    title: "Focused Editors",
    text: "Open a close writing view when you want to shape one ring or one groove directly.",
  },
  {
    icon: MonitorPlay,
    label: "Capture",
    title: "Loop Capture",
    text: "Record short moving studies directly from the live canvas (PNG export included).",
  },
  {
    icon: CircleDot,
    label: "Fullscreen",
    title: "Fullscreen View",
    text: "Hide extra controls so the pattern is easier to watch or record.",
  },
  {
    icon: Layers,
    label: "Layouts",
    title: "Desktop + Mobile",
    text: "A wide desktop instrument or a tighter mobile flow, without changing the core ideas.",
  },
  {
    icon: Waves,
    label: "Entry",
    title: "Three Clear Entries",
    text: "Orbits is for discovery, Polyrhythm Study is for clarity, and Riff Cycle is for writing.",
  },
];
