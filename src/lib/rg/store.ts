// Zustand store for the clone — drives the SPA "navigation" (since the
// sandbox only exposes a single / route). Holds current view + mode +
// transport state shared between canvas and controls.

"use client";

import { create } from "zustand";
import type { ModeId, View } from "./types";

interface RGState {
  view: View;
  mode: ModeId;
  playing: boolean;
  muted: boolean;
  setView: (v: View) => void;
  setMode: (m: ModeId) => void;
  setPlaying: (p: boolean) => void;
  togglePlaying: () => void;
  setMuted: (m: boolean) => void;
  toggleMuted: () => void;
  goLaunch: () => void;
  goApp: (mode: ModeId) => void;
  goHome: () => void;
}

export const useRG = create<RGState>((set) => ({
  view: "landing",
  mode: "orbital",
  playing: false,
  muted: false,
  setView: (v) => set({ view: v }),
  setMode: (m) => set({ mode: m }),
  setPlaying: (p) => set({ playing: p }),
  togglePlaying: () => set((s) => ({ playing: !s.playing })),
  setMuted: (m) => set({ muted: m }),
  toggleMuted: () => set((s) => ({ muted: !s.muted })),
  goLaunch: () => set({ view: "launch" }),
  goApp: (mode) => set({ view: "app", mode, playing: true }),
  goHome: () => set({ view: "landing", playing: false }),
}));
