"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useRG } from "@/lib/rg/store";
import { SCALES, type AudioSettings } from "@/lib/rg/audio";

const ROOT_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function AudioPanel() {
  const audio = useRG((s) => s.audio);
  const setAudio = useRG((s) => s.setAudio);
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02]">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-3 py-2 text-[11px] font-mono uppercase tracking-[0.16em] text-white/65"
      >
        <span>Sound Engine</span>
        {open ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      {open && (
        <div className="space-y-3 border-t border-white/[0.04] p-3">
          <Slider label="Master" value={audio.masterVolume} min={0} max={1} step={0.01} onChange={(v) => setAudio({ masterVolume: v })} suffix="" format="percent" />
          <Slider label="Reverb" value={audio.reverbAmount} min={0} max={1} step={0.01} onChange={(v) => setAudio({ reverbAmount: v })} suffix="" format="percent" />
          <Slider label="Delay" value={audio.delayAmount} min={0} max={1} step={0.01} onChange={(v) => setAudio({ delayAmount: v })} suffix="" format="percent" />
          <Slider label="Delay Time" value={audio.delayTime} min={0.05} max={0.7} step={0.01} onChange={(v) => setAudio({ delayTime: v })} suffix="s" />
          <Slider label="Feedback" value={audio.delayFeedback} min={0} max={0.85} step={0.02} onChange={(v) => setAudio({ delayFeedback: v })} suffix="" format="percent" />
          <Slider label="Filter" value={audio.filterCutoff} min={200} max={8000} step={50} onChange={(v) => setAudio({ filterCutoff: v })} suffix="Hz" format="round" />
          <Slider label="Resonance" value={audio.filterResonance} min={0} max={12} step={0.1} onChange={(v) => setAudio({ filterResonance: v })} suffix="Q" />
          <Slider label="Attack" value={audio.attack} min={0.001} max={0.05} step={0.001} onChange={(v) => setAudio({ attack: v })} suffix="s" />
          <Slider label="Release" value={audio.release} min={0.05} max={1.2} step={0.01} onChange={(v) => setAudio({ release: v })} suffix="s" />

          <Toggle label="Sub Osc" value={audio.subOsc} onChange={(v) => setAudio({ subOsc: v })} />
          <Toggle label="Triangle Layer" value={audio.triangleLayer} onChange={(v) => setAudio({ triangleLayer: v })} />

          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/45">Scale</div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {Object.keys(SCALES).map((s) => (
                <button
                  key={s}
                  onClick={() => setAudio({ scale: s as AudioSettings["scale"] })}
                  className={`rounded-md border px-2 py-1 text-[9px] font-mono uppercase tracking-[0.1em] transition ${
                    audio.scale === s
                      ? "border-[#00FFAA]/40 bg-[#00FFAA]/10 text-[#00FFAA]"
                      : "border-white/10 text-white/55 hover:border-white/20"
                  }`}
                >
                  {s.replace("Pentatonic", " Pent")}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] font-mono uppercase tracking-[0.16em] text-white/45">Root</div>
            <div className="mt-1.5 flex flex-wrap gap-1">
              {ROOT_NOTES.map((n, i) => (
                <button
                  key={n}
                  onClick={() => setAudio({ rootNote: i })}
                  className={`h-7 w-7 rounded-md border text-[10px] font-mono transition ${
                    audio.rootNote === i
                      ? "border-[#00FFAA]/40 bg-[#00FFAA]/10 text-[#00FFAA]"
                      : "border-white/10 text-white/55 hover:border-white/20"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  suffix,
  format,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix: string;
  format?: "percent" | "round";
}) {
  const display =
    format === "percent"
      ? `${Math.round(value * 100)}%`
      : format === "round"
        ? `${Math.round(value)}${suffix}`
        : `${value.toFixed(step < 0.01 ? 3 : step < 1 ? 2 : 0)}${suffix}`;
  return (
    <label className="block">
      <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-[0.14em] text-white/45">
        <span>{label}</span>
        <span className="text-white/80">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="mt-1.5 w-full accent-[#00FFAA]"
      />
    </label>
  );
}

function Toggle({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-[10px] font-mono uppercase tracking-[0.14em] text-white/55 transition hover:border-white/15"
    >
      <span>{label}</span>
      <span className={`h-4 w-7 rounded-full p-0.5 transition ${value ? "bg-[#00FFAA]/80" : "bg-white/15"}`}>
        <span
          className={`block h-3 w-3 rounded-full bg-white transition ${value ? "translate-x-3" : "translate-x-0"}`}
        />
      </span>
    </button>
  );
}
