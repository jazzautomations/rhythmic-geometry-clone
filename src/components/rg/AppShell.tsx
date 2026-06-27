"use client";

import { useRG } from "@/lib/rg/store";
import { OrbitCanvas } from "./OrbitCanvas";
import { StudyCanvas } from "./StudyCanvas";
import { RiffCanvas } from "./RiffCanvas";

export function AppShell() {
  const mode = useRG((s) => s.mode);
  const playing = useRG((s) => s.playing);
  const muted = useRG((s) => s.muted);

  if (mode === "orbital") return <OrbitCanvas playing={playing} muted={muted} />;
  if (mode === "polyrhythm-study") return <StudyCanvas playing={playing} muted={muted} />;
  return <RiffCanvas playing={playing} muted={muted} />;
}
