"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "rg-scene-library-v1";

export interface SavedScene {
  id: string;
  name: string;
  mode: "orbital" | "polyrhythm-study" | "riff-cycle-study";
  data: unknown;
  createdAt: number;
  thumbnail?: string;
}

function read(): SavedScene[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedScene[]) : [];
  } catch {
    return [];
  }
}

function write(scenes: SavedScene[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scenes));
  } catch {
    // storage full — silently fail
  }
}

export function useSceneLibrary() {
  const [scenes, setScenes] = useState<SavedScene[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setScenes(read());
    setLoaded(true);
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setScenes(read());
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const save = useCallback((scene: Omit<SavedScene, "id" | "createdAt">) => {
    const next: SavedScene = {
      ...scene,
      id: `scene-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
    };
    const all = read();
    all.unshift(next);
    write(all);
    setScenes(all);
    return next;
  }, []);

  const remove = useCallback((id: string) => {
    const all = read().filter((s) => s.id !== id);
    write(all);
    setScenes(all);
  }, []);

  const rename = useCallback((id: string, name: string) => {
    const all = read().map((s) => (s.id === id ? { ...s, name } : s));
    write(all);
    setScenes(all);
  }, []);

  return { scenes, loaded, save, remove, rename };
}
