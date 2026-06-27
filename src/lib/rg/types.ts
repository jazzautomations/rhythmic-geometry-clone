// Core types and constants for the Rhythmic Geometry clone.

export type ModeId = "orbital" | "polyrhythm-study" | "riff-cycle-study";

export type View = "landing" | "launch" | "app";

export interface ModeMeta {
  id: ModeId;
  name: string;
  eyebrow: string;
  summary: string;
  description: string;
  details: string[];
  bestFor: string;
  firstMove: string;
  accent: string;
  launchLabel: string;
}

export const MODES: ModeMeta[] = [
  {
    id: "orbital",
    name: "Orbit",
    eyebrow: "See rhythm as motion.",
    summary: "Every ratio becomes a path. Every cycle leaves a shape.",
    description:
      "Two cycles rotating in time. As they repeat, their relationship traces a pattern — a geometric memory of the rhythm itself.",
    details: [
      "Layer simple pulse counts into moving orbits.",
      "Watch the drawing reveal how the cycles relate.",
    ],
    bestFor: "Seeing rhythm as motion.",
    firstMove: "Set a simple ratio and press Play.",
    accent: "#00FFAA",
    launchLabel: "Enter Orbit",
  },
  {
    id: "polyrhythm-study",
    name: "Study",
    eyebrow: "See how rhythms align.",
    summary: "Where do the pulses agree? Where do they drift apart?",
    description:
      "Break rhythm into shared structure. Visualize how cycles meet, divide, and resolve — revealing the hidden framework behind polyrhythm.",
    details: [
      "Compare rhythm layers on one shared grid.",
      "See exactly where the pulses line up.",
    ],
    bestFor: "Seeing how rhythms align.",
    firstMove: "Start with two layers and watch where they meet.",
    accent: "#7FD7FF",
    launchLabel: "Open Study",
  },
  {
    id: "riff-cycle-study",
    name: "Riff",
    eyebrow: "Build rhythm as structure.",
    summary: "Not just what you play — but how it cycles.",
    description:
      "Write and explore patterns through time. Shape grooves, displace accents, and feel how structure evolves when rhythm becomes a system instead of a loop.",
    details: [
      "Build hits, rests, and accents into a riff.",
      "See where the phrase returns, shifts, or lands.",
    ],
    bestFor: "Building rhythm as structure.",
    firstMove: "Write a pattern, then let it cycle through time.",
    accent: "#FFD166",
    launchLabel: "Start Riff",
  },
];

export function getMode(id: ModeId | string | null | undefined): ModeMeta {
  if (!id) return MODES[0];
  return MODES.find((m) => m.id === id) ?? MODES[0];
}

// 16-color palette used by the original app for orbits.
export const ORBIT_PALETTE: string[] = [
  "#00FFAA",
  "#32CD32",
  "#72F1B8",
  "#44FF88",
  "#3388FF",
  "#88CCFF",
  "#00CCFF",
  "#7D89FF",
  "#FF3366",
  "#FF4488",
  "#FF0088",
  "#FF7799",
  "#FFAA00",
  "#FFCC00",
  "#FF6600",
  "#AA44FF",
];

export interface Orbit {
  id: string;
  pulseCount: number;
  radius: number;
  color: string;
  direction: 1 | -1;
  offsetTurns: number;
}

export interface OrbitScene {
  baseBPM: number;
  speedMultiplier: number;
  orbits: Orbit[];
  trailAlpha: number;
  glow: boolean;
}

export const DEFAULT_ORBIT_SCENES: { id: string; name: string; scene: OrbitScene }[] = [
  {
    id: "prime-ritual",
    name: "Prime Ritual",
    scene: {
      baseBPM: 84,
      speedMultiplier: 1,
      trailAlpha: 0.06,
      glow: true,
      orbits: [
        { id: "o1", pulseCount: 2, radius: 60, color: ORBIT_PALETTE[0], direction: 1, offsetTurns: 0 },
        { id: "o2", pulseCount: 3, radius: 110, color: ORBIT_PALETTE[4], direction: 1, offsetTurns: 0 },
        { id: "o3", pulseCount: 5, radius: 170, color: ORBIT_PALETTE[12], direction: -1, offsetTurns: 0.5 },
      ],
    },
  },
  {
    id: "rose-engine",
    name: "Rose Engine",
    scene: {
      baseBPM: 96,
      speedMultiplier: 1,
      trailAlpha: 0.04,
      glow: true,
      orbits: [
        { id: "o1", pulseCount: 4, radius: 70, color: ORBIT_PALETTE[5], direction: 1, offsetTurns: 0 },
        { id: "o2", pulseCount: 7, radius: 130, color: ORBIT_PALETTE[15], direction: -1, offsetTurns: 0 },
        { id: "o3", pulseCount: 11, radius: 200, color: ORBIT_PALETTE[1], direction: 1, offsetTurns: 0.25 },
      ],
    },
  },
  {
    id: "blue-mandala",
    name: "Blue Mandala",
    scene: {
      baseBPM: 72,
      speedMultiplier: 1,
      trailAlpha: 0.05,
      glow: true,
      orbits: [
        { id: "o1", pulseCount: 3, radius: 50, color: ORBIT_PALETTE[6], direction: 1, offsetTurns: 0 },
        { id: "o2", pulseCount: 5, radius: 95, color: ORBIT_PALETTE[5], direction: 1, offsetTurns: 0 },
        { id: "o3", pulseCount: 7, radius: 145, color: ORBIT_PALETTE[7], direction: -1, offsetTurns: 0.5 },
        { id: "o4", pulseCount: 9, radius: 205, color: ORBIT_PALETTE[2], direction: 1, offsetTurns: 0 },
      ],
    },
  },
];

export interface StudyLayer {
  id: string;
  pulseCount: number;
  color: string;
  label: string;
}

export interface StudyScene {
  baseBPM: number;
  bars: number;
  stepsPerBar: number;
  layers: StudyLayer[];
}

export const DEFAULT_STUDY_SCENES: { id: string; name: string; scene: StudyScene }[] = [
  {
    id: "2-vs-3",
    name: "2 against 3",
    scene: {
      baseBPM: 96,
      bars: 2,
      stepsPerBar: 12,
      layers: [
        { id: "l1", pulseCount: 2, color: ORBIT_PALETTE[0], label: "2" },
        { id: "l2", pulseCount: 3, color: ORBIT_PALETTE[4], label: "3" },
      ],
    },
  },
  {
    id: "3-vs-4-vs-5",
    name: "3 · 4 · 5",
    scene: {
      baseBPM: 84,
      bars: 1,
      stepsPerBar: 60,
      layers: [
        { id: "l1", pulseCount: 3, color: ORBIT_PALETTE[0], label: "3" },
        { id: "l2", pulseCount: 4, color: ORBIT_PALETTE[5], label: "4" },
        { id: "l3", pulseCount: 5, color: ORBIT_PALETTE[12], label: "5" },
      ],
    },
  },
  {
    id: "4-vs-7",
    name: "4 against 7",
    scene: {
      baseBPM: 108,
      bars: 1,
      stepsPerBar: 28,
      layers: [
        { id: "l1", pulseCount: 4, color: ORBIT_PALETTE[12], label: "4" },
        { id: "l2", pulseCount: 7, color: ORBIT_PALETTE[15], label: "7" },
      ],
    },
  },
];

export interface RiffStep {
  hit: boolean;
  accent: boolean;
}

export interface RiffTrack {
  id: string;
  name: string;
  color: string;
  pitch: number;
  steps: RiffStep[];
}

export interface RiffScene {
  baseBPM: number;
  stepsPerBar: number;
  bars: number;
  tracks: RiffTrack[];
}

export const DEFAULT_RIFF_SCENES: { id: string; name: string; scene: RiffScene }[] = [
  {
    id: "first-return",
    name: "First Return",
    scene: {
      baseBPM: 110,
      stepsPerBar: 7,
      bars: 4,
      tracks: [
        {
          id: "t1",
          name: "Kick",
          color: ORBIT_PALETTE[12],
          pitch: 36,
          steps: [
            { hit: true, accent: true },
            { hit: false, accent: false },
            { hit: false, accent: false },
            { hit: true, accent: false },
            { hit: false, accent: false },
            { hit: false, accent: false },
            { hit: true, accent: false },
            { hit: false, accent: false },
            { hit: false, accent: false },
            { hit: true, accent: false },
            { hit: false, accent: false },
            { hit: false, accent: false },
            { hit: true, accent: true },
            { hit: false, accent: false },
            { hit: false, accent: false },
            { hit: true, accent: false },
            { hit: false, accent: false },
            { hit: true, accent: false },
            { hit: false, accent: false },
            { hit: false, accent: false },
            { hit: true, accent: false },
            { hit: false, accent: false },
            { hit: false, accent: false },
            { hit: true, accent: true },
            { hit: false, accent: false },
            { hit: false, accent: false },
            { hit: false, accent: false },
            { hit: true, accent: false },
          ],
        },
        {
          id: "t2",
          name: "Hat",
          color: ORBIT_PALETTE[5],
          pitch: 60,
          steps: Array.from({ length: 28 }, (_, i) => ({
            hit: i % 2 === 1,
            accent: i % 4 === 3,
          })),
        },
        {
          id: "t3",
          name: "Bass",
          color: ORBIT_PALETTE[15],
          pitch: 48,
          steps: Array.from({ length: 28 }, (_, i) => ({
            hit: i === 0 || i === 7 || i === 14 || i === 21,
            accent: i === 0 || i === 14,
          })),
        },
      ],
    },
  },
  {
    id: "syncopated-pocket",
    name: "Syncopated Pocket",
    scene: {
      baseBPM: 102,
      stepsPerBar: 8,
      bars: 2,
      tracks: [
        {
          id: "t1",
          name: "Kick",
          color: ORBIT_PALETTE[12],
          pitch: 36,
          steps: Array.from({ length: 16 }, (_, i) => ({
            hit: i === 0 || i === 6 || i === 10,
            accent: i === 0,
          })),
        },
        {
          id: "t2",
          name: "Snare",
          color: ORBIT_PALETTE[8],
          pitch: 40,
          steps: Array.from({ length: 16 }, (_, i) => ({
            hit: i === 4 || i === 12,
            accent: true,
          })),
        },
        {
          id: "t3",
          name: "Lead",
          color: ORBIT_PALETTE[5],
          pitch: 67,
          steps: Array.from({ length: 16 }, (_, i) => ({
            hit: [0, 3, 6, 7, 10, 11, 14].includes(i),
            accent: i === 0,
          })),
        },
      ],
    },
  },
];

const PENTATONIC_FREQS = [
  261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0,
  1046.5, 1174.66, 1318.51, 1567.98, 1760.0,
];

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

export function midiToName(midi: number): string {
  const n = NOTE_NAMES[midi % 12];
  const oct = Math.floor(midi / 12) - 1;
  return `${n}${oct}`;
}

export function hexToHue(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  if (max !== min) {
    const d = max - min;
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }
  return h;
}

export function colorToFreq(color: string): number {
  const hue = hexToHue(color);
  const idx = Math.floor(hue * (PENTATONIC_FREQS.length - 1));
  return PENTATONIC_FREQS[Math.min(idx, PENTATONIC_FREQS.length - 1)];
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

export function lcm(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / gcd(a, b);
}
