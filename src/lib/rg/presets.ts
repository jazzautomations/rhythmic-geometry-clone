// ====================================================================
// DATA EXTRACTED FROM RHYTHMICGEOMETRY.COM BUNDLE
// Reverse-engineered from app-BDM1Zvm3.js (954KB minified → 1.8MB beautified)
// All atmospheres, tone presets, built-in scenes, palettes and copy are
// verbatim from the original (Marc DeBlasie / Rhythmic Geometry™).
// ====================================================================

// 9 ATMOSPHERES (exact RGB values from `Gd` object, lines 875-1018)
export interface Atmosphere {
  id: string;
  label: string;
  shortLabel: string;
  summary: string;
  base: string;
  gradient: [string, string, string];
  swatch: [string, string, string];
  lineAlpha: number;
  inactiveAlpha: number;
  glowMultiplier: number;
  vignetteAlpha: number;
}

export const ATMOSPHERES: Atmosphere[] = [
  {
    id: "classic",
    label: "Classic",
    shortLabel: "Classic",
    summary: "original dark canvas",
    base: "#111116",
    gradient: ["rgba(255,255,255,0.018)", "rgba(255,255,255,0.012)", "rgba(0,0,0,0)"],
    swatch: ["#111116", "#24242d", "#f4f4ff"],
    lineAlpha: 1,
    inactiveAlpha: 1,
    glowMultiplier: 1,
    vignetteAlpha: 0.12,
  },
  {
    id: "void",
    label: "Void",
    shortLabel: "Void",
    summary: "black clarity",
    base: "#05060a",
    gradient: ["rgba(255,255,255,0.035)", "rgba(86,116,255,0.055)", "rgba(0,0,0,0)"],
    swatch: ["#05060a", "#11131d", "#f4f7ff"],
    lineAlpha: 0.92,
    inactiveAlpha: 0.82,
    glowMultiplier: 0.82,
    vignetteAlpha: 0.34,
  },
  {
    id: "deep-space",
    label: "Deep Space",
    shortLabel: "Space",
    summary: "stars + blue depth",
    base: "#060817",
    gradient: ["rgba(77,116,255,0.18)", "rgba(91,255,218,0.08)", "rgba(255,255,255,0.035)"],
    swatch: ["#060817", "#3149ff", "#72f1b8"],
    lineAlpha: 1,
    inactiveAlpha: 0.88,
    glowMultiplier: 1,
    vignetteAlpha: 0.38,
  },
  {
    id: "nebula",
    label: "Nebula",
    shortLabel: "Nebula",
    summary: "violet haze",
    base: "#080512",
    gradient: ["rgba(182,113,255,0.22)", "rgba(62,218,255,0.13)", "rgba(255,112,189,0.12)"],
    swatch: ["#080512", "#b671ff", "#3edaff"],
    lineAlpha: 1.04,
    inactiveAlpha: 0.86,
    glowMultiplier: 1.18,
    vignetteAlpha: 0.42,
  },
  {
    id: "aurora",
    label: "Aurora",
    shortLabel: "Aurora",
    summary: "green cyan field",
    base: "#03100f",
    gradient: ["rgba(80,255,190,0.19)", "rgba(96,165,255,0.12)", "rgba(230,255,190,0.08)"],
    swatch: ["#03100f", "#50ffbe", "#60a5ff"],
    lineAlpha: 1,
    inactiveAlpha: 0.88,
    glowMultiplier: 1.08,
    vignetteAlpha: 0.36,
  },
  {
    id: "solar",
    label: "Solar",
    shortLabel: "Solar",
    summary: "warm edge glow",
    base: "#120806",
    gradient: ["rgba(255,175,65,0.22)", "rgba(255,70,106,0.13)", "rgba(255,226,141,0.08)"],
    swatch: ["#120806", "#ffaf41", "#ff466a"],
    lineAlpha: 1.02,
    inactiveAlpha: 0.84,
    glowMultiplier: 1.12,
    vignetteAlpha: 0.4,
  },
  {
    id: "glass",
    label: "Glass",
    shortLabel: "Glass",
    summary: "cool high-tech",
    base: "#071018",
    gradient: ["rgba(174,226,255,0.15)", "rgba(105,130,180,0.1)", "rgba(255,255,255,0.045)"],
    swatch: ["#071018", "#aee2ff", "#6982b4"],
    lineAlpha: 1.08,
    inactiveAlpha: 0.92,
    glowMultiplier: 0.96,
    vignetteAlpha: 0.32,
  },
  {
    id: "paper-dark",
    label: "Paper Dark",
    shortLabel: "Paper",
    summary: "warm readable",
    base: "#12100d",
    gradient: ["rgba(255,220,160,0.09)", "rgba(110,92,72,0.08)", "rgba(255,255,255,0.02)"],
    swatch: ["#12100d", "#e2c086", "#5d5247"],
    lineAlpha: 1.16,
    inactiveAlpha: 1,
    glowMultiplier: 0.58,
    vignetteAlpha: 0.22,
  },
  {
    id: "focus",
    label: "Focus",
    shortLabel: "Focus",
    summary: "maximum clarity",
    base: "#090a0e",
    gradient: ["rgba(255,255,255,0.05)", "rgba(120,140,180,0.045)", "rgba(0,0,0,0)"],
    swatch: ["#090a0e", "#dce6ff", "#576078"],
    lineAlpha: 1.22,
    inactiveAlpha: 1,
    glowMultiplier: 0.46,
    vignetteAlpha: 0.16,
  },
];

// 5 ATMOSPHERIC LAYERS (`vh` object, lines 1020-1036)
export interface AtmosphereLayer {
  id: string;
  label: string;
  summary: string;
}

export const ATMOSPHERE_LAYERS: AtmosphereLayer[] = [
  { id: "none", label: "Void", summary: "clean black depth" },
  { id: "stars", label: "Stars", summary: "sharp night points" },
  { id: "deep-field", label: "Deep Field", summary: "distant arcs and glints" },
  { id: "dust", label: "Fine Dust", summary: "quiet suspended grain" },
  { id: "nebula-haze", label: "Nebula Veil", summary: "soft layered color fog" },
];

// 3 GLOW LEVELS (`nu` object, lines 1019-1029)
export const GLOW_LEVELS = [
  { id: "low", label: "Low", multiplier: 0.72 },
  { id: "medium", label: "Med", multiplier: 1 },
  { id: "high", label: "High", multiplier: 1.34 },
] as const;

// 5 TONE PRESETS (`ma` object, lines 4540-4600)
export interface TonePreset {
  id: string;
  name: string;
  description: string;
  keyCenter: number; // MIDI note
  noteSet: number[]; // semitone offsets
  reverb: number;
  delay: number;
  filter: number;
  warmth: number;
  padMix: number;
}

export const TONE_PRESETS: TonePreset[] = [
  {
    id: "glass",
    name: "Glass",
    description: "Clear bell tones with soft bass anchors.",
    keyCenter: 50,
    noteSet: [0, 3, 5, 7, 10, 12, 15],
    reverb: 0.66,
    delay: 0.34,
    filter: 3200,
    warmth: 0.48,
    padMix: 0.42,
  },
  {
    id: "deep",
    name: "Deep",
    description: "Warm low pulses and rounded mallets.",
    keyCenter: 38,
    noteSet: [0, 2, 5, 7, 9, 12, 14],
    reverb: 0.48,
    delay: 0.22,
    filter: 1800,
    warmth: 0.76,
    padMix: 0.5,
  },
  {
    id: "rain",
    name: "Rain",
    description: "Tiny droplets with long, quiet tails.",
    keyCenter: 57,
    noteSet: [0, 2, 4, 7, 9, 12, 16],
    reverb: 0.72,
    delay: 0.44,
    filter: 4200,
    warmth: 0.36,
    padMix: 0.36,
  },
  {
    id: "shimmer",
    name: "Dream",
    description: "Wide sparkles and floating harmonic color.",
    keyCenter: 53,
    noteSet: [0, 5, 7, 11, 12, 16, 19],
    reverb: 0.82,
    delay: 0.48,
    filter: 5200,
    warmth: 0.42,
    padMix: 0.56,
  },
  {
    id: "warm",
    name: "Warm",
    description: "Soft wooden hits with gentle glow.",
    keyCenter: 45,
    noteSet: [0, 3, 5, 8, 10, 12, 15],
    reverb: 0.58,
    delay: 0.26,
    filter: 2400,
    warmth: 0.68,
    padMix: 0.48,
  },
];

// 8 BUILT-IN ORBITAL SCENES (`gi` array, lines 4615-4870)
// Each scene uses different engines (triangle, pendulum, orbit, rain, mandala, wave)
// with custom palettes and cycle configurations.
export interface Cycle {
  id: string;
  pulseCount: number;
  type: "bass" | "tone" | "spark" | "ghost";
  noteIndex: number;
  color: string;
  size?: number;
  pan?: number;
  velocity?: number;
  amplitude?: number;
  phase?: number;
  impactEvery?: number;
  octave?: number;
}

export interface OrbitScenePreset {
  id: string;
  name: string;
  description: string;
  engine: "triangle" | "pendulum" | "orbit" | "rain" | "mandala" | "wave";
  tempo: number;
  cycleSeconds: number;
  soundId: string;
  trail: number;
  bloom: number;
  density: number;
  cameraDrift: number;
  palette: string[];
  cycles: Cycle[];
}

export const ORBIT_SCENES: OrbitScenePreset[] = [
  {
    id: "prism-triangles",
    name: "Prism Triangles",
    description: "Glowing vertices trace a slow 3D triangle lattice.",
    engine: "triangle",
    tempo: 52,
    cycleSeconds: 18,
    soundId: "shimmer",
    trail: 0.94,
    bloom: 0.98,
    density: 0.36,
    cameraDrift: 0.06,
    palette: ["#BFC8FF", "#FFF8B8", "#B6A0FF", "#7FD7FF", "#FFFFFF"],
    cycles: [
      { id: "prism-anchor", pulseCount: 1, type: "bass", noteIndex: 0, color: "#B6A0FF", size: 20, pan: 0, velocity: 0.5, amplitude: 0.44 },
      { id: "prism-a", pulseCount: 3, type: "tone", noteIndex: 7, color: "#BFC8FF", phase: 0, pan: -0.36, velocity: 0.34, amplitude: 0.64 },
      { id: "prism-b", pulseCount: 5, type: "tone", noteIndex: 12, color: "#FFF8B8", phase: 0.18, pan: 0.26, velocity: 0.32, amplitude: 0.6 },
      { id: "prism-c", pulseCount: 7, type: "spark", noteIndex: 17, color: "#7FD7FF", phase: 0.34, pan: 0.48, velocity: 0.2, amplitude: 0.52 },
      { id: "prism-d", pulseCount: 11, type: "ghost", noteIndex: 22, color: "#FFFFFF", phase: 0.56, pan: -0.54, velocity: 0.13, size: 5, amplitude: 0.48 },
    ],
  },
  {
    id: "glass-pendulum",
    name: "Glass Pendulum",
    description: "Slow swings, clear bell impacts, and one deep pulse.",
    engine: "pendulum",
    tempo: 54,
    cycleSeconds: 14,
    soundId: "glass",
    trail: 0.92,
    bloom: 0.88,
    density: 0.34,
    cameraDrift: 0.08,
    palette: ["#7FD7FF", "#B6A0FF", "#72F1B8", "#FFD68A", "#FFFFFF"],
    cycles: [
      { id: "bass-moon", pulseCount: 1, type: "bass", noteIndex: 0, color: "#72F1B8", size: 22, pan: 0, velocity: 0.7, impactEvery: 1, amplitude: 0.58 },
      { id: "glass-a", pulseCount: 2, type: "tone", noteIndex: 7, color: "#7FD7FF", phase: 0.04, pan: -0.42, amplitude: 0.72, velocity: 0.44 },
      { id: "glass-b", pulseCount: 3, type: "tone", noteIndex: 12, color: "#B6A0FF", phase: 0.14, pan: 0.35, amplitude: 0.78, velocity: 0.42 },
      { id: "spark-a", pulseCount: 5, type: "spark", noteIndex: 17, color: "#FFD68A", phase: 0.28, pan: -0.18, velocity: 0.26, amplitude: 0.66 },
      { id: "spark-b", pulseCount: 8, type: "ghost", noteIndex: 22, color: "#FFFFFF", phase: 0.46, pan: 0.52, velocity: 0.18, size: 5, amplitude: 0.54 },
    ],
  },
  {
    id: "deep-moons",
    name: "Deep Moons",
    description: "Orbiting bodies with bass-centered pulse alignments.",
    engine: "orbit",
    tempo: 50,
    cycleSeconds: 18,
    soundId: "deep",
    trail: 0.93,
    bloom: 0.78,
    density: 0.28,
    cameraDrift: 0.06,
    palette: ["#72F1B8", "#5AB8FF", "#FFAA66", "#D8F3FF"],
    cycles: [
      { id: "moon-bass", pulseCount: 1, type: "bass", noteIndex: 0, color: "#72F1B8", size: 22, velocity: 0.78 },
      { id: "moon-low", pulseCount: 2, type: "tone", noteIndex: 5, color: "#5AB8FF", phase: 0.08, pan: -0.28, velocity: 0.42 },
      { id: "moon-mid", pulseCount: 3, type: "tone", noteIndex: 9, color: "#FFAA66", phase: 0.24, pan: 0.22, velocity: 0.38 },
      { id: "moon-high", pulseCount: 5, type: "spark", noteIndex: 14, color: "#D8F3FF", phase: 0.42, pan: 0.48, velocity: 0.24 },
    ],
  },
  {
    id: "rain-garden",
    name: "Rain Garden",
    description: "Droplets cross quiet bands and leave soft ripples.",
    engine: "rain",
    tempo: 62,
    cycleSeconds: 13,
    soundId: "rain",
    trail: 0.94,
    bloom: 0.68,
    density: 0.44,
    cameraDrift: 0.04,
    palette: ["#8FE9FF", "#B6A0FF", "#E8FFF7", "#72F1B8", "#FFD68A"],
    cycles: [
      { id: "rain-low", pulseCount: 2, type: "tone", noteIndex: 0, color: "#72F1B8", pan: -0.5, velocity: 0.3 },
      { id: "rain-a", pulseCount: 3, type: "spark", noteIndex: 7, color: "#8FE9FF", phase: 0.16, pan: -0.2, velocity: 0.24 },
      { id: "rain-b", pulseCount: 5, type: "spark", noteIndex: 12, color: "#B6A0FF", phase: 0.33, pan: 0.12, velocity: 0.22 },
      { id: "rain-c", pulseCount: 8, type: "spark", noteIndex: 16, color: "#E8FFF7", phase: 0.5, pan: 0.45, velocity: 0.18 },
      { id: "rain-d", pulseCount: 13, type: "ghost", noteIndex: 19, color: "#FFD68A", phase: 0.67, pan: 0.65, velocity: 0.12, size: 5 },
    ],
  },
  {
    id: "star-bloom",
    name: "Star Bloom",
    description: "Bright orbit pulses bloom when their paths line up.",
    engine: "orbit",
    tempo: 58,
    cycleSeconds: 16,
    soundId: "shimmer",
    trail: 0.9,
    bloom: 0.96,
    density: 0.46,
    cameraDrift: 0.12,
    palette: ["#FF88C2", "#B6A0FF", "#7FD7FF", "#72F1B8", "#FFF4A8"],
    cycles: [
      { id: "star-ground", pulseCount: 2, type: "bass", noteIndex: 0, color: "#72F1B8", size: 18, velocity: 0.48 },
      { id: "star-a", pulseCount: 3, type: "tone", noteIndex: 7, color: "#FF88C2", phase: 0.08, pan: -0.38, velocity: 0.38 },
      { id: "star-b", pulseCount: 5, type: "tone", noteIndex: 11, color: "#B6A0FF", phase: 0.24, pan: 0.28, velocity: 0.34 },
      { id: "star-c", pulseCount: 8, type: "spark", noteIndex: 16, color: "#7FD7FF", phase: 0.4, pan: -0.12, velocity: 0.22 },
      { id: "star-d", pulseCount: 13, type: "ghost", noteIndex: 19, color: "#FFF4A8", phase: 0.58, pan: 0.52, velocity: 0.15 },
    ],
  },
  {
    id: "mandala-bells",
    name: "Mandala Bells",
    description: "Radial pulses draw a symmetrical bell pattern.",
    engine: "mandala",
    tempo: 52,
    cycleSeconds: 17,
    soundId: "warm",
    trail: 0.9,
    bloom: 0.78,
    density: 0.4,
    cameraDrift: 0.1,
    palette: ["#72F1B8", "#B6A0FF", "#FFAA66", "#7FD7FF", "#FFFFFF"],
    cycles: [
      { id: "mandala-bass", pulseCount: 2, type: "bass", noteIndex: 0, color: "#72F1B8", size: 17, velocity: 0.46 },
      { id: "mandala-a", pulseCount: 3, type: "tone", noteIndex: 5, color: "#B6A0FF", phase: 0.06, pan: -0.32, velocity: 0.38 },
      { id: "mandala-b", pulseCount: 4, type: "tone", noteIndex: 8, color: "#FFAA66", phase: 0.22, pan: 0.2, velocity: 0.34 },
      { id: "mandala-c", pulseCount: 6, type: "spark", noteIndex: 12, color: "#7FD7FF", phase: 0.4, pan: 0.42, velocity: 0.2 },
      { id: "mandala-d", pulseCount: 8, type: "ghost", noteIndex: 17, color: "#FFFFFF", phase: 0.56, pan: -0.48, velocity: 0.12 },
    ],
  },
  {
    id: "hammer-tide",
    name: "Hammer Tide",
    description: "Soft hammers ride a slow wave and strike glowing bars.",
    engine: "wave",
    tempo: 66,
    cycleSeconds: 12,
    soundId: "deep",
    trail: 0.86,
    bloom: 0.78,
    density: 0.48,
    cameraDrift: 0.06,
    palette: ["#FFAA66", "#72F1B8", "#7FD7FF", "#FFD68A"],
    cycles: [
      { id: "tide-bass", pulseCount: 1, type: "bass", noteIndex: 0, color: "#72F1B8", size: 20, velocity: 0.72 },
      { id: "tide-a", pulseCount: 2, type: "tone", noteIndex: 7, color: "#FFAA66", phase: 0.1, pan: -0.38, velocity: 0.42 },
      { id: "tide-b", pulseCount: 3, type: "tone", noteIndex: 10, color: "#7FD7FF", phase: 0.3, pan: 0.26, velocity: 0.36 },
      { id: "tide-c", pulseCount: 5, type: "spark", noteIndex: 14, color: "#FFD68A", phase: 0.48, pan: 0.48, velocity: 0.24 },
    ],
  },
  {
    id: "blue-mandala",
    name: "Blue Mandala",
    description: "Symmetric blue pulses trace a frozen bloom.",
    engine: "mandala",
    tempo: 60,
    cycleSeconds: 16,
    soundId: "glass",
    trail: 0.92,
    bloom: 0.86,
    density: 0.38,
    cameraDrift: 0.08,
    palette: ["#7FD7FF", "#B6A0FF", "#5AB8FF", "#72F1B8"],
    cycles: [
      { id: "blue-bass", pulseCount: 1, type: "bass", noteIndex: 0, color: "#5AB8FF", size: 20, velocity: 0.7 },
      { id: "blue-a", pulseCount: 3, type: "tone", noteIndex: 7, color: "#7FD7FF", phase: 0, pan: -0.3, velocity: 0.4 },
      { id: "blue-b", pulseCount: 5, type: "tone", noteIndex: 11, color: "#B6A0FF", phase: 0.25, pan: 0.25, velocity: 0.36 },
      { id: "blue-c", pulseCount: 7, type: "spark", noteIndex: 16, color: "#72F1B8", phase: 0.5, pan: 0.45, velocity: 0.22 },
    ],
  },
];

// Showcase scene order (from index-DLPGNDmB.js, line 121)
export const SHOWCASE_SCENE_ORDER = [
  "prime_ritual",
  "rose_engine",
  "blue_mandala",
  "metallic_whorl",
];

// 6 TOOLS (from `ge` array in index.beauty.js, lines ~148-185)
export interface Tool {
  label: string;
  title: string;
  text: string;
}

export const TOOLS: Tool[] = [
  {
    label: "Library",
    title: "Scene Library",
    text: "Built-in scenes give Orbits, Polyrhythm Study, and Riff Cycle a strong starting point instead of a blank canvas.",
  },
  {
    label: "Edit",
    title: "Focused Editors",
    text: "Open a close writing view when you want to shape one ring or one groove directly.",
  },
  {
    label: "Capture",
    title: "Loop Capture",
    text: "Record short moving studies directly from the live canvas.",
  },
  {
    label: "Fullscreen",
    title: "Fullscreen View",
    text: "Hide extra controls so the pattern is easier to watch or record.",
  },
  {
    label: "Layouts",
    title: "Desktop + Mobile",
    text: "A wide desktop instrument or a tighter mobile flow, without changing the core ideas.",
  },
  {
    label: "Entry",
    title: "Three Clear Entries",
    text: "Orbits is for discovery, Polyrhythm Study is for clarity, and Riff Cycle is for writing.",
  },
];

// 4 PRO features (from `ue` array in index.beauty.js, lines ~152-170)
export const PRO_FEATURES: Tool[] = [
  {
    label: "Save",
    title: "Personal Scene Library",
    text: "Keep the scenes worth revisiting and return to them as the work grows.",
  },
  {
    label: "Export",
    title: "Still + Motion",
    text: "Take scenes out as clean images and short captured loops.",
  },
  {
    label: "Expand",
    title: "Deeper Control",
    text: "Open the wider control ranges and broader randomization across all three modes.",
  },
  {
    label: "Access",
    title: "Premium Studies",
    text: "Step into the richer built-in scenes and more advanced starting points.",
  },
];

// Cycle type defaults (from `yr` helper)
export const CYCLE_DEFAULTS: Record<
  Cycle["type"],
  { size: number; octave: number; velocity: number }
> = {
  bass: { size: 15, octave: -1, velocity: 0.72 },
  tone: { size: 11, octave: 0, velocity: 0.54 },
  spark: { size: 8, octave: 1, velocity: 0.42 },
  ghost: { size: 11, octave: 0, velocity: 0.54 },
};

// Note name lookup
const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
export function midiToName(midi: number): string {
  const n = NOTE_NAMES[midi % 12];
  const oct = Math.floor(midi / 12) - 1;
  return `${n}${oct}`;
}
