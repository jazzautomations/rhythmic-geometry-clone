# Rhythmic Geometry — Clone

Reverse-engineered clone of [rhythmicgeometry.com](https://rhythmicgeometry.com) — a visual rhythm tool that shows polymeters, riffs, orbits, and musical structures as motion and shape.

Built with **Next.js 16 + TypeScript + Web Audio API + Canvas 2D**. Mobile-first, fully unlocked (no paywall, no auth — Pro features are free).

> **Disclaimer**: This is an educational reverse-engineering exercise. Rhythmic Geometry™ is a trademark of Marc DeBlasie. All credit for the original design and concept goes to him. The original is at [rhythmicgeometry.com](https://rhythmicgeometry.com) — go buy the real thing if you like this kind of art.

---

## What's inside

### 3 Modes (matching the original)

1. **Orbit** — pulses orbit at different radii, drawing rose-curve / mandala patterns over time. 8 built-in scenes: Prism Triangles, Glass Pendulum, Deep Moons, Rain Garden, Star Bloom, Mandala Bells, Hammer Tide, Blue Mandala.
2. **Study** — polyrhythm grid showing where layers align. Highlights intersections with vertical bars.
3. **Riff** — step sequencer with kick/snare/hat synthesis. Click to toggle hits, long-press for accents.

### Audio engine (custom synth, no Tone.js)

- Stacked oscillators (sine + triangle + sub) per voice
- Per-voice lowpass filter with envelope
- Convolver reverb (synthesized impulse response, 2.6s decay)
- Stereo delay/echo with feedback
- Master compressor + limiter
- Stereo widener (Haas effect)
- FFT analyser for visual feedback
- Drum synthesis: kick (sine + pitch drop + click), snare (noise + tom), hat (filtered noise)
- 5 tone presets verbatim from the original: Glass, Deep, Rain, Dream, Warm
- 8 scales (major/minor pentatonic, major, minor, dorian, whole tone, diminished, chromatic) × 12 root notes
- **iOS Safari fix**: AudioContext.resume() called synchronously inside the Play button onClick (gesture requirement)

### Visuals

- **9 atmospheres** with exact RGB values from the original bundle (Classic, Void, Deep Space, Nebula, Aurora, Solar, Glass, Paper Dark, Focus)
- **5 atmosphere layers** (Stars, Deep Field, Fine Dust, Nebula Veil, Void)
- Trail buffer with `OffscreenCanvas` + line segments → rose-curve / mandala patterns
- Additive blending (`globalCompositeOperation = "lighter"`)
- Particles on pulse fire
- Sparse stardust (1 per 12000px²)
- Atmosphere background cached for performance

### Exports (all free, no Pro paywall)

- **PNG** — screenshot of current canvas
- **JSON** — scene data
- **WAV** — offline audio render via `OfflineAudioContext` (faster than realtime, includes reverb + delay + filter)
- **Save** — scene library in `localStorage` (replaces the original's Supabase)

### Mobile-first

- Drawer-based control panel (slides up from bottom)
- Touch-friendly buttons (44px minimum)
- Long-press for accents in Riff mode + haptic feedback (`navigator.vibrate`)
- `h-[100dvh]` for iOS Safari toolbar handling
- Responsive landing page

---

## Tech stack

- **Next.js 16** (App Router, Turbopack)
- **TypeScript 5**
- **Tailwind CSS 4** + shadcn/ui
- **Zustand** for state
- **Framer Motion** for landing animations
- **lucide-react** for icons
- **Web Audio API** (raw, no library)
- **Canvas 2D** for rendering

---

## File structure

```
src/
├── app/
│   ├── globals.css         # dark theme + custom utilities
│   ├── layout.tsx          # fonts (Inter + JetBrains Mono + Playfair)
│   └── page.tsx            # SPA router (landing/launch/app)
├── components/
│   ├── rg/
│   │   ├── AppShell.tsx           # mode switcher
│   │   ├── AudioPanel.tsx         # sound engine controls
│   │   ├── LandingView.tsx        # marketing page
│   │   ├── LaunchView.tsx         # mode picker
│   │   ├── ModeControlsShell.tsx  # shared canvas + drawer layout
│   │   ├── OrbitCanvas.tsx        # Orbit mode renderer
│   │   ├── RiffCanvas.tsx         # Riff sequencer
│   │   ├── StudyCanvas.tsx        # Study grid
│   │   └── previews/
│   │       └── OrbitPreview.tsx   # small canvas for landing tiles
│   └── ui/                  # shadcn/ui components
└── lib/
    └── rg/
        ├── audio.ts             # Web Audio engine (live)
        ├── atmosphere.ts        # paintAtmosphere (verbatim port)
        ├── atmosphereCache.ts   # cached atmosphere renderer
        ├── presets.ts           # 9 atmospheres, 5 tones, 8 scenes (verbatim)
        ├── render.ts            # OfflineAudioContext WAV renderer
        ├── store.ts             # Zustand store
        ├── types.ts             # shared types + helpers
        ├── useAudioLevel.ts     # FFT hook
        ├── useSceneLibrary.ts   # localStorage scene library
        └── wav.ts               # PCM 16-bit WAV encoder
```

---

## Run locally

```bash
bun install
bun run dev
```

Open `http://localhost:3000`.

> **Note**: This was built in a sandbox environment. Some scaffold files (Prisma, NextAuth, etc.) are leftover from the Next.js starter and aren't used by the clone.

---

## How the reverse engineering was done

1. Downloaded the original's Vite bundle (HTML + 9 JS chunks + CSS, ~1.7MB)
2. Beautified with `js-beautify` + `prettier`
3. Mined the beautified `app-BDM1Zvm3.js` (1.8MB) for:
   - 9 atmospheres with exact RGB values (`Gd` object)
   - 5 tone presets with noteSet/keyCenter/reverb/delay/filter (`ma` array)
   - 8 built-in scenes with cycles, palettes, tempos (`gi` array)
   - 6 tools + 4 pro features (`ge` / `ue` arrays)
   - Verbatim landing copy (hero, modes, showcase, philosophy, pro, CTA)
4. Ported the `kh(t,r,a,s,i)` atmosphere painter function 1:1 to `atmosphere.ts`
5. Reimplemented the audio chain (reverb + delay + comp + limiter) from the minified `Vf`/`r2` blip functions
6. Built the rose-curve trail renderer from scratch (the original uses a similar OffscreenCanvas approach based on the `Pp` function analysis)

The reverse-engineered bundles are in `/re/` (gitignored — too large, not needed in the repo).

---

## License

MIT for the clone code. The original Rhythmic Geometry™ concept, design, and trademark belong to Marc DeBlasie.
