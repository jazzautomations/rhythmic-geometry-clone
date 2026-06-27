"use client";

import { create } from "zustand";
import { DEFAULT_AUDIO_SETTINGS, type AudioSettings, getAudio } from "./audio";
import type { ModeId, View } from "./types";

interface RGState {
  view: View;
  mode: ModeId;
  playing: boolean;
  muted: boolean;
  audio: AudioSettings;
  setView: (v: View) => void;
  setMode: (m: ModeId) => void;
  setPlaying: (p: boolean) => void;
  togglePlaying: () => void;
  setMuted: (m: boolean) => void;
  toggleMuted: () => void;
  setAudio: (patch: Partial<AudioSettings>) => void;
  goLaunch: () => void;
  goApp: (mode: ModeId) => void;
  goHome: () => void;
}

export const useRG = create<RGState>((set, get) => ({
  view: "landing",
  mode: "orbital",
  playing: false,
  muted: false,
  audio: { ...DEFAULT_AUDIO_SETTINGS },
  setView: (v) => set({ view: v }),
  setMode: (m) => set({ mode: m }),
  setPlaying: (p) => set({ playing: p }),
  togglePlaying: () => set((s) => ({ playing: !s.playing })),
  setMuted: (m) => set({ muted: m, audio: { ...s_getAudio(get().audio, m) } }),
  toggleMuted: () =>
    set((s) => {
      const nextMuted = !s.muted;
      getAudio().setSettings({ muted: nextMuted });
      return { muted: nextMuted, audio: { ...s.audio, muted: nextMuted } };
    }),
  setAudio: (patch) => {
    const next = { ...get().audio, ...patch };
    getAudio().setSettings(patch);
    set({ audio: next, muted: next.muted });
  },
  goLaunch: () => set({ view: "launch" }),
  goApp: (mode) => set({ view: "app", mode, playing: true }),
  goHome: () => set({ view: "landing", playing: false }),
}));

function s_getAudio(a: AudioSettings, muted: boolean): AudioSettings {
  return { ...a, muted };
}
