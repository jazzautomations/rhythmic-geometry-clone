"use client";

import { type ReactNode, useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, Pause, Play, RotateCcw, Sliders, Volume2, VolumeX, X } from "lucide-react";
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

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [level, setLevel] = useState(0);

  // Level meter (visual feedback that audio is firing)
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

  // CRITICAL: iOS Safari requires AudioContext.resume() inside a user gesture.
  // The Play button onClick calls handlePlay synchronously — this is the
  // only place where audio is unlocked.
  const handlePlay = () => {
    if (!playing) {
      // Starting playback — resume audio FIRST (synchronously, in the gesture)
      getAudio().resume();
    }
    togglePlaying();
  };

  return (
    <div className="relative flex h-[100dvh] flex-col bg-[#05070d] text-white">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute inset-0 opacity-90 rg-glow-aurora" />
        <div className="absolute inset-0 opacity-15 rg-grid-bg" />
      </div>

      {/* Header — compact, mobile-first */}
      <header className="z-30 flex shrink-0 items-center justify-between gap-2 border-b border-white/[0.06] bg-[#05070d]/85 px-3 py-2.5 backdrop-blur-xl sm:px-6 sm:py-3">
        <div className="flex min-w-0 items-center gap-1.5 sm:gap-3">
          <button
            onClick={goHome}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/10 text-white/65 transition hover:border-white/25 hover:text-white sm:h-9 sm:w-9"
            aria-label="Home"
          >
            <ArrowLeft size={14} />
          </button>
          <button
            onClick={goLaunch}
            className="hidden shrink-0 rounded-full border border-white/10 px-3 py-1.5 text-[10px] font-mono uppercase tracking-[0.14em] text-white/65 transition hover:border-white/25 hover:text-white sm:inline-flex"
          >
            Modes
          </button>
          <div className="flex min-w-0 items-center gap-1 overflow-x-auto rg-scroll-thin">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMode(m.id)}
                className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-[0.12em] transition sm:px-3 sm:py-1.5 sm:text-[10px] ${
                  m.id === mode
                    ? "text-white"
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

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          {/* Level meter — desktop only */}
          <div className="hidden h-7 w-20 items-center gap-[2px] rounded-full border border-white/10 bg-black/30 px-2 lg:flex">
            {Array.from({ length: 14 }).map((_, i) => {
              const active = level * 18 > i;
              const hue = i < 9 ? 160 : i < 12 ? 50 : 0;
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
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:border-white/25 hover:text-white sm:h-9 sm:w-9"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <button
            onClick={handlePlay}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-4 py-2 text-[11px] font-mono uppercase tracking-[0.14em] transition sm:px-5 sm:gap-2 sm:tracking-[0.16em]"
            style={{
              background: playing ? "rgba(255,255,255,0.06)" : meta.accent,
              color: playing ? "#ffffff" : "#05070d",
              border: `1px solid ${playing ? "rgba(255,255,255,0.18)" : meta.accent}`,
              boxShadow: playing ? "none" : `0 0 24px ${meta.accent}55`,
            }}
          >
            {playing ? <Pause size={13} /> : <Play size={13} />}
            <span className="hidden sm:inline">{playing ? "Pause" : "Play"}</span>
          </button>
          {/* Mobile drawer toggle */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/70 transition hover:border-white/25 hover:text-white lg:hidden"
            aria-label="Open controls"
          >
            <Sliders size={14} />
          </button>
        </div>
      </header>

      {/* Body: canvas + side panel (desktop) / drawer (mobile) */}
      <div className="relative flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Canvas area — full screen on mobile */}
        <div className="relative min-h-0 flex-1 overflow-hidden">
          <div className="pointer-events-none absolute left-3 top-3 z-10 sm:left-5 sm:top-4">
            <div
              className="rounded-full border px-2.5 py-1 text-[9px] font-mono uppercase tracking-[0.14em] backdrop-blur-md sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.16em]"
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

        {/* Desktop side panel */}
        <aside className="hidden w-[340px] shrink-0 flex-col gap-4 overflow-y-auto border-l border-white/[0.06] bg-[#080a10]/80 p-4 rg-scroll-thin lg:flex">
          <SidePanelContent
            meta={meta}
            scenePresets={scenePresets}
            activeSceneId={activeSceneId}
            onSelectScene={onSelectScene}
            onReset={onReset}
            transport={transport}
            editor={editor}
          />
        </aside>

        {/* Mobile drawer */}
        {drawerOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
            />
            {/* Drawer */}
            <div className="absolute bottom-0 left-0 right-0 max-h-[85dvh] overflow-y-auto rounded-t-[1.5rem] border-t border-white/10 bg-[#080a10] p-4 rg-scroll-thin">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-[12px] font-mono uppercase tracking-[0.16em] text-white/70">
                  Controls
                </div>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 text-white/70"
                >
                  <X size={14} />
                </button>
              </div>
              <SidePanelContent
                meta={meta}
                scenePresets={scenePresets}
                activeSceneId={activeSceneId}
                onSelectScene={(id) => {
                  onSelectScene(id);
                  setDrawerOpen(false);
                }}
                onReset={onReset}
                transport={transport}
                editor={editor}
              />
              <div className="h-4" />
              <button
                onClick={() => setDrawerOpen(false)}
                className="sticky bottom-0 inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-[12px] font-mono uppercase tracking-[0.14em] text-white"
              >
                Close
                <ChevronRight size={14} className="rotate-90" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Shared panel content (used by both desktop sidebar and mobile drawer)
function SidePanelContent({
  meta,
  scenePresets,
  activeSceneId,
  onSelectScene,
  onReset,
  transport,
  editor,
}: {
  meta: (typeof MODES)[number];
  scenePresets: { id: string; name: string }[];
  activeSceneId: string;
  onSelectScene: (id: string) => void;
  onReset: () => void;
  transport: ReactNode;
  editor: ReactNode;
}) {
  return (
    <>
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
              className={`rounded-lg border px-3 py-2.5 text-left text-[12px] transition ${
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
    </>
  );
}
