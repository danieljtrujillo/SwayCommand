# AKSWAYJ handoff

Written 2026-08-19 for the next engineer or agent. Every number below was measured against the **installed build**, not inferred from source. Where a claim is a measurement, the measurement and the probe output are given.

This is an internal engineering note. It is deliberately **not** in `docs/`, not in the documentation index, and not packaged into the app — `electron-builder.yml` ships `docs/**/*.md` and `README.md` by exact name, so a root-level file never reaches an end user.

Product documentation lives in [`docs/`](docs/). Start with [docs/OVERVIEW.md](docs/OVERVIEW.md) for terminology; this note assumes it.

---

## 1. Do this before touching anything

**There is no version control.** `git rev-parse` reports "not a git repository". A `.gitignore` exists; `.git` does not. 14 scenes, the synth, the effects rack, and the documentation suite exist only as working-tree files with no history and no recovery path.

```sh
cd c:/Users/Cyboman/Documents/Dev/AKSWAYJ
git init && git add -A && git commit -m "AKSWAYJ initial import"
```

`node_modules` 457 MB, `release` 417 MB, `dist` 2.1 MB — all gitignored.

**Second hazard, hit twice already.** Background agents edited scene files *after* a build was cut, so a packaged installer did not contain the code that had just been reviewed. Both times it was caught only by comparing file mtimes against the build timestamp. Before packaging: confirm nothing is running, and that nothing under `src/` is newer than `dist/renderer.bundle.js`.

---

## 2. The reported problem: scenes the user cannot find

The user reported the Ferrofluid Orb, Cymatic Plate, Chrome Valley, and Quantum Lattice as "not visible anywhere".

**It is five scenes, not four — `spectra` sits in the same blind spot.**

The scenes are correctly registered, correctly pooled, and render perfectly. A probe confirmed that pressing `3` in Chrysanthemum lands on "Ferrofluid Orb" in 3.5 s with the HUD naming it correctly. They are invisible because **every surface that could name a scene declines to**, and because one of them is too dark to notice. Two independent causes; fixing either alone leaves the complaint standing.

### Cause A — nothing in the interface reveals that a scene exists

Ranked by contribution.

**A1 — The default project excludes all of them. Probability of encountering one is exactly zero.**
`projects/index.json` `order[0]` is `first-flight`, the first card and the de-facto default. Its pool is 9 scenes: `beams, swarm, ribbons, voxels, warp, nebula, mandelbulb, cymatic, vjshader`. Auto-VJ, `Space`, and every digit key are all incapable of reaching the other five from there.

| Project | Pool size | Contains, of the five |
|---|---|---|
| `first-flight` (default) | 9 | none |
| `chrysanthemum` | 8 | ferrofluid, chladni, lattice, spectra |
| `hyperspace` | 7 | valley, lattice, spectra |
| `garage-neon` | 5 | valley, lattice |
| `nebula-drift` | 5 | ferrofluid, chladni |
| `dnb-tunnel` | 4 | none |
| `hiphop-voxels` | 3 | none |
| `beam-sixteen` | 2 | none (Auto-VJ disabled) |

Four of eight projects contain none. *Fix: add them to `first-flight.json`.*

**A2 — No project opens on any of them.**
All eight `start.scene` values are legacy scenes: `beams, warp, mandelbulb, beams, ribbons, warp, voxels, nebula`. Even in the four projects that do pool one, the user is never shown one on entry. Combined with A1, the number of ways to see one of these scenes without prior knowledge is **zero**. *Fix: make one of them the `start.scene` of `chrysanthemum` or `hyperspace`.*

**A3 — The picker discloses no scene names.**
`renderProjects()` (`src/renderer/app.js:177-192`) emits swatches, name, vibe/BPM/pairsWith pills, description, and a PLAY affordance. `p.scenes` is never referenced. Measured across the rendered grid: **2,439 characters of picker DOM, zero scene names.** The one case-insensitive hit for "chladni" is prose inside Chrysanthemum's description. There is no scene list, gallery, or browser anywhere — `sceneList` is never imported into `app.js`.

**A4 — The digit keys are unlabeled, and the two labels that exist contradict each other.**
`app.js:934-939` maps `Number(key)-1` into `state.engine.autoVJ.pool` — the *project* pool. The index therefore changes per project:

| Project | Digit map for the five |
|---|---|
| `chrysanthemum` | 3=ferrofluid, 4=chladni, 5=lattice, 8=spectra |
| `hyperspace` | 4=lattice, 5=valley, 6=spectra |
| `garage-neon` | 2=valley, 3=lattice |
| `nebula-drift` | 2=ferrofluid, 3=chladni |

Nothing on screen states any of this. The help bar (`index.html:167`) says `1–9 project scenes`; the help overlay (`index.html:183`) says `1–8 scenes`. They disagree, neither names a scene, and `1–8` is a leftover from the obsolete registry-indexed behaviour still described in `docs/ENGINE.md:42`.

**A5 — The in-app documentation actively asserts these scenes do not exist.**
The Documentation screen renders `docs/*.md`, and those are stale at 8 scenes:

| File | Stale claim |
|---|---|
| `docs/SCENE_CONTRACT.md:114` | "The registry holds eight scenes"; inventory table stops at `cymatic` |
| `docs/ENGINE.md:42` | "the eight scene modules"; claims digits index `sceneList` directly |
| `docs/ENVIRONMENT.md:54` | "the eight ids in the scene registry" |
| `docs/PROJECTS.md:82-89` | Stale pool tables — hyperspace shown as 4 scenes vs its actual 7 |

A grep of `docs/` for the five scene names returns **one** hit, and it is the word "lattice" inside the `warp` shader description. The installed `app.asar` contains all their display names, so the build is current and only the docs lie. *Fix: regenerate the inventory and pool tables from the registry and project JSONs.*

**A6 — Auto-VJ is slow even in the right project.** Expected wait 88–260 s, and never in the four projects above.

### Cause B — the Ferrofluid Orb is near-invisible even when on screen

Specific to `ferrofluid`; a rendering problem, not navigation. Mean luminance and lit-pixel fraction (luma > 18) over the stage area of captured frames:

| Scene | Mean luma | Lit pixels |
|---|---|---|
| **ferrofluid** | **0.9** | **1.0 %** |
| valley | 3.3 | 5.3 % |
| beams | 3.3 | 8.4 % |
| lattice | 3.5 | 3.0 % |
| chladni | 4.1 | 10.1 % |
| voxels | 4.2 | 11.6 % |
| mandelbulb | 11.4 | 26.7 % |
| vjshader | 17.1 | 24.3 % |

**12× dimmer than the Mandelbulb, 3.7× dimmer than the next-dimmest scene.** Causes in order:

1. It is black chrome by design — `MeshStandardMaterial({ color: 0x010101, metalness: 0.99, roughness: 0.003 })`. Nearly all its light is *reflected*.
2. The upstream reflection source is gone. theDAW loads `piz_compressed.exr` through `PMREMGenerator`; scenes may not load assets ([scene contract](docs/SCENE_CONTRACT.md) rule 4), so a weak procedural gradient stands in. Black chrome has almost nothing to reflect.
3. Upstream's `UnrealBloomPass(strength 1.65)` is absent — the compositor owns tone shaping — and an additive fresnel shell substitutes for it.
4. `fieldStrength = pow(abs(np.y), 1.5)` puts structure only at the poles. Faithful to the original; do not "fix" it.
5. Quiet input. A floor of 0.16 was added so silence still shows a standing spike field.

Act on 2 and 3: raise `envMapIntensity`, brighten the procedural environment, strengthen the fresnel shell. **Do not touch the Rosensweig maths** — it is a verified faithful port.

---

## 3. The next objective: a single-page cockpit

The brief: **one page, everything inside the window, a command center for a full-blown Audima Labs Sway entertainment application.** Reference images are coming from the user — **ask for them and treat them as authoritative over everything in this section.**

### The real budget is 1266 × 683, not 1440 × 900

`src/main/main.js:173-177` requests 1440 × 900 (min 960 × 600). Measured in the installed build: **innerWidth 1266, innerHeight 683, dpr 1.5** — the request is clamped by this machine's 1280 × 720 DIP work area at 150 % scaling, and chrome eats 14 px. Budget against **864,678 px²**, not 1,296,000. At the declared minimum the budget falls to ~554,000 px².

### What exists today is the opposite of a cockpit

Five mutually exclusive full-window screens, swapped by `show()` (`app.js:39-46`) toggling one `.active` class. Four of the five scroll.

| Screen | scrollHeight vs 683 | Overflow | Notes |
|---|---|---|---|
| `studio` | 2525 | **+1842 px (3.70 screens)** | 4 stacked panels |
| `docs` body | 4123 | +3440 px (6.0 screens) | screen itself is correctly viewport-locked |
| `boot` | 989 | +306 px | **Enter CTA sits 176 px below the fold** |
| `projects` | 986 | +303 px | 2 of 8 cards cut |
| `perform` | fits | — | the only one that fits |

**Studio holds 138 interactive controls (154 targets with pads). Only 10 — 7.2 % — are fully visible.** At a true 1440 × 900 it is still 17/138 (12.3 %). Control density, not panel size, is the core problem.

| Panel | Height | Controls |
|---|---|---|
| Synth | 1087 px | 87 (59 rows + 17 keys + mod matrix) |
| Audio source | 701 px | 8 |
| Kit builder | 684 px | 6 + 16 pads |
| Effects rack | 559 px | 36 |

A cockpit must absorb ~2.84 M px² of Studio content into 0.86 M px² of window — **3.3 : 1**.

### Four findings that change the design, not just the layout

**3a — Opening Studio or Docs halts the render loop.** Measured: `engine.stats.frames`/`acc` freeze across a 250 ms sample after `s` or `d`, and resume after `Esc`. Cause: `app.js:953-957` calls `state.engine.stop()` before `openStudio()`/`openDocs()`. **Today it is impossible to touch any of the 36 FX params, the 84-entry synth manifest, the 16 pads, or the audio source while a frame is being drawn.** A cockpit removes those `stop()` calls entirely, which also removes `returnFromStudio()`/`returnFromDocs()`.

**3b — `engine.resize()` is bound only to the window `resize` event.** `engine.js:257`, plus one explicit call at `app.js:45`. There is no `ResizeObserver`. `resize()` correctly reads `canvas.clientWidth`, so it *will* work in a grid cell — but any cockpit that changes the stage cell without a window resize (collapsing a drawer, toggling a rail) leaves the renderer, `rtA`/`rtB`/`rtComp`, and the FX rack at stale dimensions. **Add a `ResizeObserver` on the stage element.**

**3c — All three responsive breakpoints are dead.** `@media (max-width: 900px)`, `(max-width: 700px)`, `(max-width: 820px)` in `styles.css:130,160,316` sit below `minWidth: 960`; the narrowest reachable viewport is ~946 px. Roughly 8 lines of stylesheet never fire, and there is currently **no** working layout adaptation.

**3d — The audio level meter renders 0 px wide.** `.meter { flex: 1 }` shares a flex row with `#studio-source`, whose full device label ("DEFAULT - MICROPHONE (4- ARCTIS NOVA PRO) (1038:12CD)") consumes the whole 335 px row. Measured 0 × 8 px. It also only updates while the Studio screen is open (`app.js:841`), so there is no level indication during a performance at all. Needs `min-width: 0` / truncation on the pill, and the update moved out of the screen check.

### Space budget for the redesign

Performance-critical — must be live while frames render:

| Element | Today | Cost today |
|---|---|---|
| Stage canvas | full-bleed | 1266 × 683, 100 % |
| Scene selection (14) | **0 on-screen controls** | keyboard only; 9 of 14 reachable in a session |
| Project selection (8) | separate screen | 1124 × 838 of cards |
| Auto-VJ / transport | 1 read-only pill | 0 buttons; minHold/maxHold/fadeTime have no UI |
| Audio source + level | buried in Studio | 8 controls, 449 px list, 0 px meter |
| 16 pads | Studio | 433 × 433 px = **21.6 % of the window** for 16 cells; 56 px cells would be 248 × 248 |
| MIDI / Sway state, fps | 2 pills | fine as-is |

Setup-only, safe behind a drawer, tab, or overlay: the synth's 87 controls, the rack's 36, the kit builder's file management, the Doctor's 8 checks, and the docs viewer (the clearest candidate for eviction — 6 screens of scroll, and it is already correctly viewport-locked, which is the pattern to reuse).

**Reusable groundwork:** both the synth panel and the FX panel already generate their controls from a manifest — `synth.controlManifest()` (84 entries, theDAW's `VisualControl` shape) and the exported `RANGES` table in `fxrack.js` (36 entries). A cockpit can re-render the same data into any layout without touching the engines.

---

## 4. State of the code

| Path | Purpose |
|---|---|
| `src/main/main.js` | Window, permissions, IPC, doc whitelist, audio-file dialog, loopback handler |
| `src/main/doctor.js` | Startup system checks |
| `src/main/audima.js` | Audima CDN client, minisign verification |
| `src/main/driver-install.js` | Windows DFU driver install via elevated `pnputil` |
| `src/preload/preload.js` | The entire IPC surface behind `contextBridge` |
| `src/renderer/app.js` | Screen flow, HUD, Studio, synth panel, FX panel, docs viewer |
| `src/renderer/markdown.js` | Dependency-free Markdown renderer |
| `src/renderer/engine/engine.js` | Dual-target crossfade compositor, Auto-VJ, FX hook |
| `src/renderer/engine/colormaster.js` | 10 palettes, crossfaded |
| `src/renderer/engine/fxrack.js` | VJ-9000 effect decks, 36 parameters |
| `src/renderer/engine/scenes/*.js` | 14 scenes |
| `src/renderer/audio/audio.js` | Analysis, band split, beat detect, sources |
| `src/renderer/audio/sampler.js` | Pad kit playback |
| `src/renderer/audio/synth.js` + `wavetables.js` | Vital-class wavetable synth |
| `src/renderer/midi/midi.js`, `swaymap.js` | Sway-first MIDI, factory map |

### Scenes and provenance — three licences in play

| Scene | Origin | Licence |
|---|---|---|
| beams, swarm, ribbons, voxels, nebula, cymatic, warp, mandelbulb | original | project MIT |
| **ferrofluid** | theDAW `cymatics/sphere-shader.ts` | **Apache-2.0**, notice retained |
| **chladni** | theDAW `cymatics/cymatics-shader.ts` | **Apache-2.0**, notice retained |
| **valley** | theDAW `cymatics/landscape-shader.ts` | **Apache-2.0**, notice retained |
| **lattice** | theDAW `lib/quantumLattice.ts` | theDAW repo MIT |
| **vjshader** | VJ-9000 `shader/shaderPresets.ts` | **no licence upstream** |
| **spectra** | VJ-9000 `spectra/SpectraRenderer.ts` | **no licence upstream** |
| fxrack | VJ-9000 `components/VideoOutput.tsx` | **no licence upstream** |

**`voxels.js` is the user's favourite and is off-limits.** Unmodified since 18:13 on the day it was written; keep it that way unless the user says otherwise.

Licensing landmines:

1. **VJ-9000 has no LICENCE file in any commit** — verified across full history. Default is all rights reserved. theDAW's README credits Daniel Joaquin Trujillo, matching this user's account, so it is their own work to reuse; a third party could not rely on that. Flagged to the user; a licence should be added before distribution.
2. **Apache-2.0 cymatics shaders** require the notice retained and changes stated. Every port's header does both — **do not strip them**.
3. **theDAW's LICENCE names "Stability AI"**, inherited from `stable-audio-tools`. Attribution to GANTASMO comes from the README.
4. **Audima's terms forbid redistributing their binaries.** The Doctor fetches from `cdn.audima.com.au` onto the user's machine and never bundles. Keep it that way.

### Audio

One analysis source at a time: any input device, Windows WASAPI loopback (`setDisplayMediaRequestHandler` with `audio: 'loopback'`), or a silent internal 120 BPM groove. Loopback is Windows-only; macOS/Linux need a virtual device and the UI says so.

`synth.js` is a Vital-class wavetable synth — 3 oscillators over 7 generated spectral tables, unison, sub, noise, 2 filters, 3 envelopes, 4 LFOs, a 9 × 15 modulation matrix, 7 effects, 7 presets. It does **not** do Vital's spectral warp, sample/text-to-wavetable import, a wavetable editor, or full MPE. See [docs/SYNTH.md](docs/SYNTH.md).

Sampler and synth both connect to speakers *and* analyser, so anything played drives the visuals.

### theDAW alignment already in place — preserve this

- `synth.voiceTrigger()` returns theDAW's exact signature `(ctx, dest, midi, velocity, when, duration, master)`. Verified: arity 7, one voice during the note, zero after release.
- `synth.controlManifest()` returns theDAW's `VisualControl` shape, 84 entries.
- `fxrack.js` mirrors theDAW's audio-routing pattern: a parameter table with per-key ranges and band-driven modulation.
- All audio modules are factory functions taking `ctx` and a destination array.

A module that cannot be lifted into theDAW unchanged is a divergence.

---

## 5. Verifying work without a human

No test suite. Verification drives the real app headlessly through env vars read in `src/main/main.js`.

| Variable | Effect |
|---|---|
| `AKSWAYJ_SHOT` | Capture the window to a PNG, then quit |
| `AKSWAYJ_SHOT_DELAY` | ms before capture, default 5000 |
| `AKSWAYJ_AUTOPLAY` | Boot into a project id |
| `AKSWAYJ_SCENE` | Force a scene id. **Bypasses navigation — never use it to judge discoverability** |
| `AKSWAYJ_PROBE` | Run JS in the page 3000 ms after load; return value prints as `[probe] …` |

`window.__akswayj` exposes `{ state, studio, openStudio, openDocs, renderPads, renderSamples }`; `state` carries `engine, midi, audio, sampler, synth, projects, screen`.

```powershell
$env:ELECTRON_RUN_AS_NODE = ''            # REQUIRED
$env:AKSWAYJ_SHOT = "$env:TEMP\x.png"
$env:AKSWAYJ_SHOT_DELAY = '12000'
$env:AKSWAYJ_PROBE = "(async () => JSON.stringify({ scenes: window.__akswayj.state.engine.sceneList.length }))()"
& "$env:LOCALAPPDATA\Programs\akswayj\AKSWAYJ.exe" 2>$null | Select-String 'probe'
```

Four traps, all hit during this work:

- **`ELECTRON_RUN_AS_NODE` is set in these shells.** Electron then starts as plain Node and dies with `Cannot read properties of undefined (reading 'whenReady')`. Clear it every launch.
- **`AKSWAYJ_SHOT_DELAY` must exceed the probe's own timers**, or the app quits mid-probe and prints nothing.
- **Env vars leak between runs.** Clear `AKSWAYJ_AUTOPLAY`/`AKSWAYJ_SCENE` explicitly.
- **Do not read the WebGL canvas by drawing it into a 2D canvas** — the renderer runs without `preserveDrawingBuffer` and it reads back pure black. Use `AKSWAYJ_SHOT` and measure the PNG; that is how the luminance table in section 2 was produced.

Build: `npm run build:renderer`, then `npm run dist:win`. Output `release/AKSWAYJ-Setup-0.1.0.exe`, one-click, per-user, installs to `%LOCALAPPDATA%\Programs\akswayj`, silent with `/S`.

---

## 6. Known defects

| Item | Detail |
|---|---|
| **No git repository** | Fix first |
| **Five scenes undiscoverable** | Section 2, Cause A. Not fixed |
| **Ferrofluid Orb near-invisible** | Section 2, Cause B. Not fixed |
| **Studio/Docs halt the renderer** | `app.js:953-957`. Blocks all live control |
| **Level meter renders 0 px wide** | Flex row collapse; also only updates on the Studio screen |
| **`engine.resize()` has no ResizeObserver** | Stage in a resizable cell will render stale |
| **3 dead CSS breakpoints** | All below `minWidth: 960` |
| **3 FX params silently unrendered** | `FX_DECKS` names `zoomPunch`, `slitScan`, `timeDisplace`; none has a `RANGES` entry, so they are skipped without warning. Two `RANGES` entries (`audioReactive`, `asciiAccent`) are exposed nowhere |
| **FX rack ships disabled** | `#fx-enable` is unchecked in `index.html` |
| **Docs stale at 8 scenes / 6 projects** | `SCENE_CONTRACT.md`, `ENGINE.md`, `ENVIRONMENT.md`, `PROJECTS.md` |
| **Help bar and overlay disagree** | `1–9` vs `1–8`, neither naming a scene |
| **MIDI-learn has no UI** | `midi.learn()` has no caller; `midiOverrides` is read at startup and hand-editable but never written |
| **Binaries unsigned** | SmartScreen warns; macOS un-notarized |
| **4 factory-map values unconfirmed** | Knob-press CCs, button defaults, pad channel 1 vs 16, MPE. **The Sway is now connected** — a `K` monitor session would settle them |
| **No automated tests** | Screenshot and probe only |

---

## 7. Verified facts

Measured against the installed build, 2026-08-19:

- 14 scenes registered, all rendering at 60 fps on Intel HD 630 / Radeon Vega M
- 8 projects, 18 documents, 84-entry synth manifest, 36 FX parameters, 138 Studio controls
- Sway physically connected: port `Audima Labs The Sway`, manufacturer `STMicroelectronics`, Doctor reports `Connected (normal mode)`, DFU driver staged
- USB identity confirmed on hardware, matching the reverse-engineered values: VID `0x0483`, PID `0x52A4`
- Real viewport 1266 × 683 at dpr 1.5; installer 89.8 MB
