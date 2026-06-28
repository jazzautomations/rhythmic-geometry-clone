# Rhythmic Geometry — Clone (Real Bundle)

**True clone of [rhythmicgeometry.com](https://rhythmicgeometry.com)** — serves the actual production bundle from the original site, patched to bypass Supabase auth and unlock all Pro features.

> **Disclaimer**: Rhythmic Geometry™ is a trademark of Marc DeBlasie. This is an educational reverse-engineering exercise. All credit for the design, code, and concept goes to the original author. If you like this, [buy the real thing](https://rhythmicgeometry.com).

---

## What this is

Instead of reimplementing the app from scratch, this clone **uses the original production bundle directly**. The actual JavaScript, CSS, and image assets from `rhythmicgeometry.com` are served as static files. Two surgical patches to the bundle unlock everything:

1. **Auth bypass** — the Supabase client is disabled (`bt = null`), and the `AuthProvider` is patched to return a hardcoded Pro user (`{plan: "pro", comped: true}`) instead of calling Supabase. No login required.
2. **Analytics removed** — Google Tag Manager script stripped from the HTML so the clone doesn't send analytics to the original site.

That's it. The entire original app runs unchanged — same React components, same TanStack Router, same Web Audio engine, same Canvas rendering, same 8 scenes, same 9 atmospheres, same 5 tone presets.

---

## Routes (all 5 from the original TanStack Router)

| Route | Description |
|-------|-------------|
| `/` | Landing page — hero, modes, showcase, philosophy, pro, CTA |
| `/app` | Main app (TanStack Router reads `?mode=` and `?scene=` query params) |
| `/app?mode=orbital` | Orbit mode — rose-curve / mandala patterns |
| `/app?mode=polyrhythm-study` | Study mode — polyrhythm grid |
| `/app?mode=riff-cycle-study` | Riff mode — step sequencer |
| `/app?mode=orbital&scene=prime_ritual` | Specific scene |
| `/app?mode=orbital&scene=rose_engine` | Specific scene |
| `/app?mode=orbital&scene=blue_mandala` | Specific scene |
| `/app?mode=orbital&scene=metallic_whorl` | Specific scene |
| `/app?mode=orbital&scene=aeolian_tide` | Specific scene |
| `/app?mode=orbital&scene=dorian_bloom` | Specific scene |
| `/app?mode=orbital&scene=silent_cosmology` | Specific scene |
| `/launch` | Mode picker — 3 cards |
| `/how-it-works` | Explainer page — Ratio, Phase, Form |
| `/riff` | Direct riff entry |

---

## How it works

```
public/
├── index-original.html      ← original HTML shell (GA stripped)
├── assets/
│   ├── index-BrRyRw8g.js    ← MAIN BUNDLE (patched: auth bypass)
│   ├── index-B5Z24pGn.css   ← original CSS (Tailwind v4 + custom)
│   ├── app-BDM1Zvm3.js      ← /app route chunk (954KB, all 3 modes)
│   ├── index-DLPGNDmB.js    ← / route chunk (landing)
│   ├── launch-DJk1hVU6.js   ← /launch route chunk
│   ├── how-it-works-D6Fr2e7d.js ← /how-it-works route chunk
│   ├── siteModes-Dkmd9zKS.js ← shared mode metadata
│   ├── x-DCv-q93X.js        ← shared UI chunk
│   ├── arrow-left-BF_3f1wS.js
│   ├── chevron-down-Qu89FAnn.js
│   └── circle-dot-j8fhbUEM.js
└── scene-captures/
    ├── website_prime_ritual.png
    ├── website_rose_engine.png
    ├── website_standard_replacement.png
    ├── website_metallic_whorl.png
    ├── website_study_mode.png
    ├── website_riff_mode.png
    ├── aeolian_tide.jpg
    ├── blue_mandala.jpg
    ├── dorian_bloom.jpg
    └── silent_cosmology.jpg

src/app/
├── route.ts                 ← serves index-original.html at /
├── app/route.ts             ← serves index-original.html at /app
├── launch/route.ts          ← serves index-original.html at /launch
├── how-it-works/route.ts    ← serves index-original.html at /how-it-works
└── riff/route.ts            ← serves index-original.html at /riff
```

### The patches

**Patch 1** — in `public/assets/index-BrRyRw8g.js`:
```js
// Original: iv = !!(rv && sv)  →  bt = createClient(rv, sv, {...})
// Patched:  iv = false          →  bt = null
```
This makes the Supabase client null, so all auth calls short-circuit.

**Patch 2** — in the same file, the `AuthProvider` useEffect:
```js
// Original: if (!bt) { s(!1); return }  // loading=false, no user
// Patched:  if (!bt) {
//   const FU = {id:"local-pro", email:"pro@rhythmic.geometry"};
//   const FA = {id:"local-pro", email:"pro@rhythmic.geometry", plan:"pro", comped:true, access_source:"comped", onboarded:true, ...};
//   l(FU);  // setUser(fakeUser)
//   p(FA);  // setAccount(fakeAccount)
//   s(!1);  // setLoading(false)
//   return;
// }
```
This makes the app think you're signed in as a comped Pro user. All Pro features (scene saving, premium studies, broader randomization, export tools, wider control set) are unlocked.

---

## Run locally

```bash
bun install
bun run dev
```

Then open any of the routes listed above. The app runs exactly like the original — same tutorial, same audio, same visuals.

---

## What's unlocked

- ✅ All 3 modes (Orbit / Study / Riff)
- ✅ All 8 built-in scenes (Prime Ritual, Rose Engine, Blue Mandala, Metallic Whorl, Aeolian Tide, Dorian Bloom, Silent Cosmology, + more)
- ✅ All 9 atmospheres
- ✅ All 5 tone presets
- ✅ Scene saving (localStorage instead of Supabase)
- ✅ Export tools (PNG, JSON, MIDI where applicable)
- ✅ Premium studies
- ✅ Broader randomization
- ✅ Wider control ranges
- ✅ No login required
- ✅ No analytics sent to original

---

## Reverse engineering process

1. Downloaded the original's Vite bundle:
   - `index.html` (1.4KB shell)
   - `index-BrRyRw8g.js` (573KB main bundle)
   - `index-B5Z24pGn.css` (153KB Tailwind v4 CSS)
   - 9 code-split chunks (app, launch, how-it-works, siteModes, x, + icon chunks)
   - 10 scene-capture images (PNG + JPG, ~18MB total)

2. Beautified with `js-beautify` + `prettier` to read the minified code

3. Identified the stack:
   - **React 19** + **TanStack Router** (not react-router as initially assumed)
   - **Vite** build with code-splitting
   - **Tailwind CSS v4**
   - **Supabase** for auth + user data
   - **Web Audio API** (raw, no Tone.js)
   - **Canvas 2D** for rendering

4. Found the 5 routes in the TanStack Router route tree (`bundle.beauty.js` lines 26880-26920)

5. Found the Supabase config hardcoded in the bundle:
   - URL: `https://vqgxstfkxskclpfpkbis.supabase.co`
   - Anon key: `eyJhbGc...` (JWT)

6. Found the `AuthProvider` (`MT` function) and its fallback behavior when `bt` (Supabase client) is null

7. Applied 2 surgical patches (12 bytes + 240 bytes) to the minified bundle

8. Created Next.js route handlers that serve the original HTML shell at all 5 routes — TanStack Router handles client-side routing from there

---

## Tech stack (of the wrapper)

- **Next.js 16** (App Router) — serves the original SPA
- **TypeScript** — route handlers
- That's it. The actual app is the original Vite bundle, unchanged except for 2 patches.

---

## License

MIT for the wrapper code. The original Rhythmic Geometry™ concept, design, code, trademark, and all assets belong to Marc DeBlasie.
