"use client";

import { type ReactNode, useEffect, useState } from "react";
import { ArrowLeft, Pause, Play, RotateCcw, Volume2, VolumeX } from "lucide-react";
import { MODES, type ModeId } from "@/lib/rg/types";
import { useRG } from "@/lib/rg/store";
import { getAudio } from "@/lib/rg/audio";
import { AudioPanel } from "./AudioPanel";

interface ModeControlsShellProps {
  mode: ModeId;
  scenePresets: { id: string; name: string }[];
  activeSceneId: string;
  onSelectScene: (id: string) => void;
  onReset: () => void;
  transport: ReactNode;
  editor: ReactNode;
  children: ReactNode;
}

export function ModeControlsShell({
  mode,
  scenePresets,
  activeSceneId,
  onSelectScene,
  onReset,
  transport,
  editor,
  children,
}: ModeControlsShellProps) {
  const meta = MODES.find((m) => m.id === mode) ?? MODES[0];
  const playing = useRG((s) => s.playing);
  const muted = useRG((s) => s.muted);
  const togglePlaying = useRG((s) => s.togglePlaying);
  const toggleMuted = useRG((s) => s.toggleMuted);
  const setMode = useRG((s) => s.setMode);
  const goLaunch = useRG((s) => s.goLaunch);
  const goHome = useRG((s) => s.goHome);

  // Level meter (visual feedback that audio is firing)
  const [level, setLevel] = useState(0);
  useEffect(() => {
    if (!playing) {
      setLevel(0);
      return;
    }
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      if (now - last >= 33) {
        const l = getAudio().getLevel();
        setLevel((prev) => prev * 0.65 + l * 0.35);
        last = now;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  return (
    <div className="relative flex h-screen flex-col bg-[#05070d] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 opacity-90 rg-glow-aurora" />
        <div className="absolute inset-0 opacity-15 rg-grid-bg" />
      </div>

      {/* Header */}
      <header className="z-30 flex shrink-0 items-center justify-between border-b border-white/[0.06] bg-[#05070d]/80 px-4 py-3 backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={goHome}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-white/65 transition hover:border-white/25 hover:text-white"
          >
            <ArrowLeft size={12} />
            <span className="hidden sm:inline">Home</span>
          </button>
          <button
            onClick={goLaunch}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-white/65 transition hover:border-white/25 hover:text-white"
          >
            Modes
          </button>
          <div className="ml-2 hidden items-center gap-2 md:flex">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`rounded-full border px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.14em] transition ${
                  m.id === mode
                    ? "border-white/25 text-white"
                    : "border-white/[0.06] text-white/55 hover:text-white"
                }`}
                style={
                  m.id === mode
                    ? {
                        background: `${m.accent}12`,
                        borderColor: `${m.accent}40`,
                        color: m.accent,
                      }
                    : undefined
                }
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Level meter */}
          <div className="hidden h-7 w-24 items-center gap-[2px] rounded-full border border-white/10 bg-black/30 px-2 sm:flex">
            {Array.from({ length: 16 }).map((_, i) => {
              const active = level * 20 > i;
              const hue = i < 10 ? 160 : i < 13 ? 50 : 0;
              return (
                <span
                  key={i}
                  className="h-3 w-[3px] rounded-full transition-opacity"
                  style={{
                    background: `hsl(${hue}, 100%, 55%)`,
                    opacity: active ? 1 : 0.18,
                  }}
                />
              );
            })}
          </div>
          <button
            onClick={toggleMuted}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:border-white/25 hover:text-white"
            title={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <button
            onClick={togglePlaying}
            className="inline-flex items-center gap-2 rounded-full px-5 py-2 text-[11px] font-mono uppercase tracking-[0.16em] transition"
            style={{
              background: playing ? "rgba(255,255,255,0.06)" : meta.accent,
              color: playing ? "#ffffff" : "#05070d",
              border: `1px solid ${playing ? "rgba(255,255,255,0.18)" : meta.accent}`,
              boxShadow: playing ? "none" : `0 0 32px ${meta.accent}55`,
            }}
          >
            {playing ? <Pause size={13} /> : <Play size={13} />}
            {playing ? "Pause" : "Play"}
          </button>
        </div>
      </header>

      {/* Mobile mode tabs */}
      <div className="z-20 flex shrink-0 items-center gap-2 border-b border-white/[0.06] bg-[#05070d]/80 px-4 py-2 backdrop-blur-xl md:hidden">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={`rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.14em] transition ${
              m.id === mode ? "text-white" : "border-white/[0.06] text-white/55"
            }`}
            style={
              m.id === mode
                ? {
                    background: `${m.accent}12`,
                    borderColor: `${m.accent}40`,
                    color: m.accent,
                  }
                : undefined
            }
          >
            {m.name}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Canvas area */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div className="pointer-events-none absolute left-5 top-4 z-10">
            <div
              className="rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-[0.16em] backdrop-blur-md"
              style={{
                borderColor: `${meta.accent}40`,
                background: `${meta.accent}10`,
                color: meta.accent,
              }}
            >
              {meta.eyebrow}
            </div>
          </div>
          {children}
        </div>

        {/* Side panel */}
        <aside className="flex w-full shrink-0 flex-col gap-4 overflow-y-auto border-t border-white/[0.06] bg-[#080a10]/80 p-4 rg-scroll-thin lg:w-[340px] lg:border-l lg:border-t-0">
          {/* Scene presets */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] font-mono uppercase tracking-[0.16em] text-white/45">Scenes</div>
              <button
                onClick={onReset}
                className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-[0.14em] text-white/45 transition hover:text-white"
              >
                <RotateCcw size={10} /> Reset
              </button>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {scenePresets.map((s) => (
                <button
                  key={s.id}
                  onClick={() => onSelectScene(s.id)}
                  className={`rounded-lg border px-3 py-2 text-left text-[12px] transition ${
                    s.id === activeSceneId
                      ? "border-white/25 bg-white/[0.06] text-white"
                      : "border-white/[0.06] text-white/65 hover:border-white/15 hover:text-white"
                  }`}
                  style={
                    s.id === activeSceneId
                      ? {
                          borderLeftColor: meta.accent,
                          borderLeftWidth: 3,
                        }
                      : undefined
                  }
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Transport */}
          <div>
            <div className="mb-2 text-[11px] font-mono uppercase tracking-[0.16em] text-white/45">Transport</div>
            <div className="space-y-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">{transport}</div>
          </div>

          {/* Editor */}
          <div>
            <div className="mb-2 text-[11px] font-mono uppercase tracking-[0.16em] text-white/45">Editor</div>
            {editor}
          </div>

          {/* Audio Engine */}
          <AudioPanel />
        </aside>
      </div>
    </div>
  );
}
