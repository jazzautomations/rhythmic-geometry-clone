"use client";

import { create } from "zustand";
import { DEFAULT_AUDIO_SETTINGS, type AudioSettings, getAudio } from "./audio";
import { ATMOSPHERES, type Atmosphere, ORBIT_SCENES, type OrbitScenePreset } from "./presets";
import type { ModeId, View } from "./types";

interface RGState {
  view: View;
  mode: ModeId;
  playing: boolean;
  muted: boolean;
  audio: AudioSettings;
  atmosphereId: string;
  atmosphereLayer: "none" | "stars" | "deep-field" | "dust" | "nebula-haze";
  activeOrbitSceneId: string;
  isPro: boolean; // DESBLOQUEADO - always true
  setView: (v: View) => void;
  setMode: (m: ModeId) => void;
  setPlaying: (p: boolean) => void;
  togglePlaying: () => void;
  setMuted: (m: boolean) => void;
  toggleMuted: () => void;
  setAudio: (patch: Partial<AudioSettings>) => void;
  setAtmosphere: (id: string) => void;
  setAtmosphereLayer: (l: RGState["atmosphereLayer"]) => void;
  setActiveOrbitScene: (id: string) => void;
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
  atmosphereId: "classic",
  atmosphereLayer: "stars",
  activeOrbitSceneId: ORBIT_SCENES[0].id,
  isPro: true, // DESBLOQUEADO
  setView: (v) => set({ view: v }),
  setMode: (m) => set({ mode: m }),
  setPlaying: (p) => set({ playing: p }),
  togglePlaying: () => set((s) => ({ playing: !s.playing })),
  setMuted: (m) => {
    getAudio().setSettings({ muted: m });
    set({ muted: m, audio: { ...get().audio, muted: m } });
  },
  toggleMuted: () => {
    const nextMuted = !get().muted;
    getAudio().setSettings({ muted: nextMuted });
    set({ muted: nextMuted, audio: { ...get().audio, muted: nextMuted } });
  },
  setAudio: (patch) => {
    const next = { ...get().audio, ...patch };
    getAudio().setSettings(patch);
    set({ audio: next, muted: next.muted });
  },
  setAtmosphere: (id) => set({ atmosphereId: id }),
  setAtmosphereLayer: (l) => set({ atmosphereLayer: l }),
  setActiveOrbitScene: (id) => set({ activeOrbitSceneId: id }),
  goLaunch: () => set({ view: "launch" }),
  goApp: (mode) => {
    // Entering a mode starts playback immediately. The card tap IS a user
    // gesture, so unlock/resume the AudioContext here — otherwise on mobile
    // (iOS Safari) the context is created suspended inside the rAF loop and
    // never resumes, leaving the app silent until Play is pressed twice.
    getAudio().resume();
    set({ view: "app", mode, playing: true });
  },
  goHome: () => set({ view: "landing", playing: false }),
}));

export function getAtmosphere(id: string): Atmosphere {
  return ATMOSPHERES.find((a) => a.id === id) ?? ATMOSPHERES[0];
}

export function getOrbitScene(id: string): OrbitScenePreset {
  return ORBIT_SCENES.find((s) => s.id === id) ?? ORBIT_SCENES[0];
}
