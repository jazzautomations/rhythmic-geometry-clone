"use client";

import { useEffect, useRef, useState } from "react";
import { getAudio } from "@/lib/rg/audio";

// Hook that returns the current master level (0..1) at ~30fps.
// Used to drive reactive visuals in the canvases.
export function useAudioLevel(active: boolean): number {
  const [level, setLevel] = useState(0);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!active) {
      setLevel(0);
      return;
    }
    let last = 0;
    const tick = (now: number) => {
      if (now - last >= 33) {
        const l = getAudio().getLevel();
        // Smooth
        setLevel((prev) => prev * 0.7 + l * 0.3);
        last = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  return level;
}

// Hook that returns the FFT data (Uint8Array of length 512) at ~30fps.
export function useFFT(active: boolean): Uint8Array | null {
  const [data, setData] = useState<Uint8Array | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!active) {
      setData(null);
      return;
    }
    let last = 0;
    const tick = (now: number) => {
      if (now - last >= 33) {
        const fft = getAudio().getFFT();
        if (fft) {
          // Copy to a plain Uint8Array to avoid sharing the underlying buffer
          const copy = new Uint8Array(fft.length);
          copy.set(fft);
          setData(copy);
        }
        last = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [active]);

  return data;
}
