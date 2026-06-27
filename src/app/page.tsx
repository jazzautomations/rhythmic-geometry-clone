"use client";

import { useRG } from "@/lib/rg/store";
import { LandingView } from "@/components/rg/LandingView";
import { LaunchView } from "@/components/rg/LaunchView";
import { AppShell } from "@/components/rg/AppShell";

export default function Page() {
  const view = useRG((s) => s.view);
  if (view === "launch") return <LaunchView />;
  if (view === "app") return <AppShell />;
  return <LandingView />;
}
