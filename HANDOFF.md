# SwayCommand handoff

Written 2026-08-20 for the next engineer or agent, after the single-page cockpit redesign. This is an internal engineering note. It is deliberately **not** in `docs/`, not in the documentation index, and not packaged into the app — `electron-builder.yml` ships `docs/**/*.md` and `README.md` by exact name, so a root-level file never reaches an end user.

Product documentation lives in [`docs/`](docs/) and was regenerated against this source tree on 2026-08-20. Start with [docs/OVERVIEW.md](docs/OVERVIEW.md) for terminology; this note assumes it.

---

## 1. Repository state

Version control exists. The working branch is `cockpit`; `main` holds the pre-redesign import. Recent history on `cockpit`:

```
f8f6338 Handoff: record the visuals engine pass and verification discipline
353d0fa Wormhole: hard-science space in three regimes; doc updates
228b9e2 Sway and strike morph the generators: vjshader, spectra
a6aaf47 Sway and strike morph the generators: nebula, mandelbulb, cymatic
1c6ee2e Sway and strike morph the generators: beams, swarm, ribbons, warp
ea3adb2 Cymatic Plate: faithful theDAW cymatics platform
46bf7c8 Ferrofluid Orb: faithful theDAW port with real reflections
7b3f0ea Anaglyph and mosaic in the rack; frame-wrecking knob defaults; real valley
d0c2098 Real Quantum Lattice, HDR pipeline, per-scene UnrealBloom, shared environment
e8856d9 Rename AKSWAYJ to SwayCommand everywhere
709d2b3 Regenerate documentation for the cockpit; select audio clips on the band
710fd61 Retire legacy presets; template scene pads; verification hooks
bbe9649 Single-surface cockpit
```

The rename in `e8856d9` is total: product name, wordmarks, `window.swaycommand` (preload API), `window.__swaycommand` (automation handle), the `SWAYCOMMAND_*` env hooks, appId, installer artifact, launcher scripts, and every doc. The Electron userData directory follows the product name, so settings written under the old name (learned MIDI overrides, the legacy kit) did not carry over. A fresh installer — `release/SwayCommand-Setup-0.1.0.exe`, built 2026-08-20 18:58 after the visuals pass and the doc reconciliation — was installed per-user and probed (§3). The `AKSWAYJ-Setup-0.1.0.exe` beside it and the `akswayj` install under `%LOCALAPPDATA%\Programs` are the pre-rename build; neither was removed.

`node_modules`, `release`, and `dist` are gitignored. Commit in small units; the pre-git era of this project lost history it never had.

---

## 2. What the redesign did

The five full-window screens (boot, projects, studio, docs, perform) are gone. The app is one always-live page: the stage renders from the first frame to quit, and every panel works on top of it. Layout and interaction model: [docs/OVERVIEW.md](docs/OVERVIEW.md#the-cockpit).

New modules:

| Path | Purpose |
|---|---|
| `src/shared/swayproject.js` | The `.sway` document: schema, defaults, `validateProject` (fills defaults, warns, never throws on content), `legacyToSway`. Shared by main and renderer; dependency-free. |
| `src/main/projectfile.js` | `.sway` I/O: read/write with atomic rename, size cap, format gating; id-gated bundled templates; recents pruning; `statAudio` (sha256 + bytes). |
| `src/renderer/project/projectstore.js` | Document lifecycle: open/apply (fixed hydration order), async sequential media loading, collect-on-save, media registration. |
| `src/renderer/control/router.js` | The single dispatch point: pad/button/note events, change-driven knob dispatch, per-frame gesture routes, timeline visual clips, LEARN persistence, touch-to-select. |
| `src/renderer/audio/transport.js` | Timeline playback: `AudioBufferSourceNode` scheduling on the context clock, loop, seek, per-clip fades; visual lane fires the router. |
| `src/renderer/ui/frame.js`, `popover.js`, `wave.js` | Chrome: panel frames, the shared popover, the INPUT box band display. |
| `src/renderer/ui/surface.js` | The Sway deck schematic (SVG, mutated per frame); the control-id grammar; `PAD_CELLS`. |
| `src/renderer/ui/assign.js` | The assignment panel: per-control editors, FOLLOW/LEARN/CLEAR. |
| `src/renderer/ui/drawer.js` | The SYNTH / RACK / KIT drawer shell; lazy first render. |
| `src/renderer/ui/timeline.js` | The timeline band: ruler (scrub/loop/locators), visual lane (DOM clips), audio lane (canvas waveforms), playhead. |

Changes in existing modules:

- **engine.js** — `cutTo` (instant switch), `prewarm` (one scene per frame after project apply), a `ResizeObserver` on the stage canvas, `params { hue, intensity }` replacing the hardwired knobs 0–2, `setFrameHook` (the router's slot), `applyProject` (the `.sway` shape; replays the fx snapshot through `setFxParam`), and `fx` / `fxEnabled` / `setFxParam` / `resetFx` on the public object. `autoVJ.fadeTime` is no longer overwritten per frame.
- **fxrack.js** — exports `DECKS` beside `RANGES`; the phantom deck keys `zoomPunch` / `slitScan` / `timeDisplace` are dropped and `audioReactive` / `asciiAccent` are surfaced, so every deck key has a range entry and the UI cannot silently skip parameters.
- **midi.js** — emits the full event set (`pad`, `note`, `noteoff`, `bend`, `mod`, `cc` with resolved target); note-offs are no longer swallowed. The router is the one `onEvent` consumer.
- **audio.js** (analysis) — `useSystemAudio()` reads Windows WASAPI loopback correctly (video track dropped on arrival, explicit no-audio-track failure), `state.source` gained `'system'`, `state.deviceId` records the granted input, `releaseInput`/`stopInternal` exported.
- **main.js** — IPC gained `project:*` (openDialog, saveDialog, read, write, recent, templates, readTemplate) and `files:statAudio`; `projects:list` is gone with the picker. `SWAYCOMMAND_AUTOPLAY` now takes a template id or a `.sway` path; `SWAYCOMMAND_WINDOW=WxH` forces the initial window size for layout screenshots.
- **app.js** — rebuilt as cockpit assembly. `window.__swaycommand` is now `{ state, studio, openStudio(tab), openDocs, renderPads, renderSamples, transport, projectStore, router, selectControl, openProject, saveProject }`; `state.screen` no longer exists.

Projects: the 8 legacy presets became bundled templates (`projects/templates/*.sway`, converted via `legacyToSway`), reachable from the project menu. Format reference: [docs/PROJECTS.md](docs/PROJECTS.md).

---

## 2b. The visuals engine pass (same day, after the docs regen)

The user's directive: use the REAL effects and visuals from theDAW, make striking and swaying morph each visual's own generative parameters (never rotate-the-object responses), and put frame-wrecking effects on the knobs.

**Engine (`engine.js`)** — render targets A/B/comp are now half-float (additive HDR survives), a per-scene **UnrealBloomPass** runs over the composite (`meta.bloom { strength, radius, threshold }` or a live `instance.bloom` that `update()` mutates; strength crossfades with the scene mix; skipped when absent), a **PMREM RoomEnvironment** is generated once and handed to scenes as `ctx.environment` (the reflection source that fixed the invisible chrome), and `io.strike` = max pad energy per frame is the strike dimension. Auto-VJ starts disabled at boot until a project decides (boot-race fix).

**Faithful theDAW ports** (upstream at `c:\Users\Cyboman\Documents\Dev\theDAW`): `lattice.js` (full 373-node / 756-beam topology from `lib/quantumLattice.ts`, positions pouring at 0.06/frame, morphEnergy shockwave, per-shape scales and bloom multipliers; strike advances the geometry, sway morphs the filament field), `ferrofluid.js` (`cymatics/sphere-shader.ts` verbatim + RoomEnvironment + three-point rig + backdrop dome; stage luminance ~11% vs the old ~1%; strike cycles spike density, sway glides density/viscosity, press crushes to mirror chrome), `chladni.js` (`cymatics/cymatics-shader.ts` verbatim, spectral-centroid mode index, cover camera; strike jumps the nodal mode with ring-down, sway bows it), `valley.js` (`cymatics/landscape-shader.ts` verbatim + fbm plasma sun + halo + palette point light + 240-star sky; **sway crossfades the whole terrain chrome↔ferrofluid via isFerrofluid**, strike quakes the ridges, press dives between them). All carry Apache-2.0 notices with updated change statements.

**Morph passes over the rest** (voxels untouched — standing constraint): beams (field spread/cross-tilt + phase reseed), swarm (murmuration↔orbiting cells + scatter shock), ribbons (silk↔coils + traveling whipcrack), nebula (fbm spectrum re-weighting + curl rotation + ignition front), mandelbulb (power 6..12 + golden-angle basin jumps), cymatic (resonance-mode lift + jump/ring-down), vjshader (preset-space morph vectors, zero-at-rest; strike kicks + seed-jumps; a Mandelbox scale <~1.6 engulfs the camera — documented in its table), spectra (log↔lin axis warp, fold comb, radial burst; strike = full-band slam through the mel machinery).

**`warp.js` — the Wormhole, redesigned to the user's spec** (hard science, photoreal, one fullscreen quad): three regimes — DRIFT (blackbody starfield via octahedral cell hashing, limb-darkened G-type star with corona under bloom, faint palette nebulosity, slow coast, xy looks around), WARP (STRIKE toggles it; stars streak along great circles toward the travel direction — aberration integration over STREAK_K samples — with Doppler blue/red fore/aft; **SWAY sets velocity**, `2^((sway−0.5)·2.6)`), WORMHOLE (**press ≥ 0.7 held 0.25 s**; thin-lens deflection ~1/b bends the sky around the mouth, Einstein ring at the photon radius, the throat shows a second seed's sky inverted; the ~4.2 s transit swaps seeds — you exit somewhere else — then settles back to drift). Tuning notes: star PSF widens with magnitude and the per-star peak clamps at 1.7 or isolated hot pixels turn UnrealBloom's low mips into squares; bloom base 0.55/0.5/0.7 rising with warp/hole/flash.

**Rack + knobs**: `fxrack.js` gains `anaglyph` (depth-scaled red/cyan stereo in FRAG_FINAL, counter-rotation at high drive) and `mosaic` (grouted tile quantiser in the geometry pass, per-cell brightness hash) — 38 params now, both arm-gated, free at zero. Default knob table: 1 hue (detent), 2 fade length, 3 intensity, 4 glitch, 5 anaglyph, 6 mosaic, 7 echo trails, 8 kit level; **driving any `fx:` target auto-enables the rack** (router `driveTarget` + punches). Templates regenerated with the new knob table.

**Verification state**: every scene screenshot-verified individually by its author at 60 fps (A/B sway/strike pairs), plus a 14-scene sweep probe — all 60 fps. One sweep anomaly was traced to the live hardware: the physical Sway was connected and a pad strike legitimately cut scenes mid-run. **Verification discipline (user request): keep headless app launches RARE — batch probes into one run, prefer build-only checks, never fire per-tweak screenshot loops.**

---

## 2c. Will I Dream (later on 2026-08-20)

User brief: use the black hole / wormhole / hyperspace / warp effects added to `C:\Users\Cyboman\Downloads\ScifiUI` (all MIT CodePen exports — Jamie's "Wormhole", Darryl Huffman's "Black Hole (WebGL Shader)", Sean Free's "#codevember 13" event horizon, Techartist's "Cosmic Anomaly Visualizer", Rizki Gunawan's "Threejs SciFi Flight"); a scene with NO effects applied at rest; hyperspace/warp on X and Y with the maximum at highest X, lowest Y (right of the deck, close to the sensors); PAD 7 opens a black hole that radially fades everything from the center out; hyperspace as a layer ABOVE everything else; nothing rotating, forward motion only, except PAD 8 banks left and PAD 15 banks right; a new celestial object at the end of every hyperspace jump except when the black hole was pressed; named "Will I Dream", with the song of that name from this machine's Music folder.

Delivered: `src/renderer/engine/scenes/willidream.js` — the 15th registry entry; its header documents the four regimes and the state machine; pads follow the deck's 1-based numbering, so PAD 7 / 8 / 15 are indices 6 / 7 / 14 (`PAD_BLACKHOLE`, `PAD_BANK_LEFT`, `PAD_BANK_RIGHT`). Three draw calls: the star field (`Points`, scrolled and wrapped in the vertex shader, forward only), the celestial object (`Points`, one static generator per shape — pulsar, spiral galaxy, solar system, nebula, ringed planet — no time term in any angle), and the overlay quad drawn last (renderOrder 10, premultiplied-additive custom blending so one pass both adds the streak field and occludes with the black disc and the radial swallow). The black-hole lens (pull ~ mass / d²) is applied at vertex level to stars and object and in UV space to the overlay. No `meta.bloom` — the scene asks for no effects. `projects/templates/will-i-dream.sway` (second in `index.json`) links `C:\Users\Cyboman\Music\New Will I Dream Master Style 2 - Live Punchy.mp3` by absolute path (sha256 `510de9de…`, 9,167,722 bytes, 229.008 s, 48 kHz CBR 320) on the audio lane 0:00–3:49 with the scene on the visual lane; rack off, Auto-VJ off, pads unassigned so strikes reach only the scene. Docs updated to fifteen scenes / nine templates: README, OVERVIEW, ENGINE, ENVIRONMENT, SCENE_CONTRACT (inventory row), PROJECTS (template table + the absolute-path note).

Verified in two dev-app runs (~19:25): the console was hooked before the scene's first shader compile — zero errors or warnings; 60 fps at rest, at full warp, through both banks, at the jump end, and with the hole opening over hyperspace; `projectStore.openTemplate('will-i-dream')` took 25 ms, the media decoded (229.008 s), the transport held the buffer, `play()` advanced the clock and drove the analysis (level 0.99). Screenshots: the arrival (pulsar ahead over the star field) and the black hole mid-swallow over the streak field. **Not yet packaged** — the installed build (18:58) predates this scene; repack before judging installed behavior.

---

## 2d. The second pass (2026-08-20, evening) — standing rules changed

The user reviewed Will I Dream and the cockpit and set rules that now bind the whole project. Read these before touching anything:

- **Pads are numbered 0–15 as the user drew them on the deck**: top rows first, left cluster 0–3, right cluster 4–7, then the bottom rows, left 8–11, right 12–15 (`PAD_CELLS` in `surface.js`; the assignment panel shows `PAD n` 0-based). The note→index map is unchanged (chromatic base 24); `scripts/midi-session.ps1` prints the new strike order.
- **Nothing drives an effect by default — ever.** `defaultKnobs()` is eight nulls; every template lost its `fx:*` and `engine:intensity` knobs (the factory presets keep hue / fade length / kit level; `will-i-dream` maps nothing). The router reconciles fx every frame (`reconcileFx`): a key no assignment drives any more is reset to its rack default, and if a control had switched the rack on (`rackOnByControl`) and nothing drives it, the rack switches off. `fxrack.js` exports `DEFAULTS` for that. Clearing a pad/knob/route therefore also stops whatever effect it was driving.
- **Nothing auto-rotates, in any scene or effect.** Every scene was swept: Wormhole's coast yaw, Nebula's kaleidoscope spin, Mandelbulb's solid spin and haze phase, Cymatic Orb's orb spin / camera drift / azimuthal phase advance, VJ Shader's camera self-drift, Spectra's auto-orbit modes and world-group sway rotation, Swarm's revolving cell ring and camera orbit, Ribbons' camera orbit, Ferrofluid's camera drift and phyllotaxis spin, Cymatic Plate's nodal-spoke drift, Chrome Valley's star-field roll, Voxels' slow camera orbit (the one-term `t * 0.06` — the only edit ever made to the off-limits scene, made because the rule said "any scene"), and the rack's radial-spoke wheel (`baseRotation` held at 0). Hand-driven orbits, per-particle flow, scrolling, breathing, and path travel stay. It is hard rule 8 in the scene contract.
- **Every shader is GLSL3** (`glslVersion: THREE.GLSL3`, `in`/`out`, `out vec4 fragColor`, `texture()`): all fifteen scenes' custom materials, the engine composite pass, and the seven rack passes were converted in place (maths identical; `onBeforeCompile` injections into three's built-in materials stay in three's own conventions by necessity). Hard rule 4 in the contract; the memory file `no-ai-attribution-modern-stack` records it.
- **No AI attribution anywhere**: no `Co-Authored-By` trailers, no "generated by" lines in headers, docs, or PR bodies. The older commits on `cockpit` carry such trailers; they were not rewritten.

What was built in this pass:

- **Will I Dream v2** (`scenes/willidream.js`): forward motion fixed (the field now streams toward the camera); the stars ARE the streaks — one instanced mesh of screen-space capsules from each star's position to where it was a shutter ago, so hyperspace radiates along each star's own line of flight with no pattern; sway morphs the distribution from random scatter to an ordered lattice; a raymarched Schwarzschild black hole in the overlay (geodesic bending, accretion disk seen nearly edge-on with its far side lensed over and under the shadow, Doppler beaming, photon-ring glow) that the ship falls into (virtual camera 80 → 2.2 rs) while a point lens pushes the star field outward; celestial objects ray-cast analytically on one camera-facing quad — pulsar (core, jets, magnetosphere tori), spiral galaxy (inclined plane, log-spiral arms, bulge, dust), solar system (limb-darkened sun, six shaded planets with atmospheres, one ringed with mutual shadows, a belt, faint orbit lines), layered nebula, ringed gas giant — instead of particle blobs; pads 7 / 8 / 15 as the deck numbers them. Three draw calls, GLSL3, no bloom.
- **Beam Sixteen v2** (`scenes/beams.js`): one instanced mesh of axial-billboard beam quads whose fragment shader crossfades HOLOGRAM / LASER / ELECTRICITY on `io.knobs[3]` (KNOB 4; `s = knob × 2`, τ = 0.15 s so the knob's speed is the transition's speed; 0.5 = pure laser at rest), a floor with impact pools and reflection streaks, dust that catches the beams; sway fan/cross-tilt morph and strike re-seed kept; fixed eye.
- **Resizable / collapsible cockpit** (`ui/layout.js`, wired from `app.js`): grips on the rails, timeline, deck, and the assign/input split (`--rail-w-left`, `--rail-w-right`, `--tl-h`, `--deck-h`, `--input-h`; double-click resets), a collapse chip per region (rails, assign, input, timeline, deck → 18 px strips), persisted in settings under `layout`, composing with solo view.

---

## 2e. Third pass (2026-08-20, late) — compaction note

Written for whoever picks this up after a context reset. State of play:

- **Everything from §2d is committed and pushed** (`cockpit` → `origin/cockpit`, eight plain commits `42ebee5`…`cbcf892`, no trailers). A PR link `cockpit → main` exists on GitHub but no PR was opened.
- **Uncommitted at the time of writing** (this pass): `scenes/willidream.js` (black hole swapped), `scenes/naturestomb.js` (new), `scenes/index.js` (16 scenes), `projects/templates/natures-tomb.sway` + `index.json` (ten templates), docs (README, OVERVIEW, ENGINE, ENVIRONMENT, SCENE_CONTRACT inventory rows, PROJECTS table), this file. Build passes; two dev-app runs verified it (below). The installed build (21:27) predates this pass.
- **Will I Dream's black hole is now Darryl Huffman's CodePen lens** — the user's `C:\Users\Cyboman\Downloads\ScifiUI\BLACKHOLE.zip` (`black-hole-webgl-shader`, MIT), by explicit instruction ("use THIS black hole"). Maths kept: `pull = mass / dist²`, the view rotated about the mass by `(pull + held)·π` with upstream's zero sine term (a signed radial scaling that collapses and inverts the sky in rings), darkening `colour − pull·0.25`. Sequence: PAD 7 → mass eases to 0.015 (the pen's 3 %-per-frame ease), then the hold value climbs (the pen's held click, 0.03/frame) while the mass grows to 4.0 so its own darkening swallows the screen from the center out, void, re-emergence, no object. The lens is applied to the streak endpoints and the object quad (`lens()` in `GLSL_COMMON`), the overlay carries the darkening (`lensDark()`); the raymarched Schwarzschild disk is gone. Verified mid-swallow at 60 fps.
- **Nature's Tomb** (`scenes/naturestomb.js`, id `naturestomb`, template `natures-tomb`): an egg cell under dark-field light — zona pellucida (fresnel, mild refraction, thin band), an SDF raymarch of up to sixteen blastomeres with a smooth-min cleavage furrow, granular cytoplasm, wrap light, subsurface glow, wet specular, a nucleus with a nucleolus seen through the cytoplasm by a second short march. One continuous division level 0–4 (1→2→4→8→16, each stage along the next axis; the CPU computes the vec4 cell table per frame); driving it down un-divides. **The control interface, as the user asked, is the user's choice**: KNOB 5 (`io.knobs[4]`) sets the level the moment it moves; any strike steps one division, reversing at 16 and at 1; sway jiggles the membranes, press squeezes, the hand pans (X) and dollies (Y) — nothing rotates. Verified at 60 fps through strikes and knob moves; the capture shows a four-nucleus embryo mid-merge. Realism can go further (real cells flatten against each other and the zona; a thickness-based SSS; a microscope DOF) — noted as a follow-up, not done.
- **Proposal, not done**: a generic `scene:<param>` assignment target (router + assign panel) so any control can drive a scene parameter through the normal assignment UI instead of raw-knob conventions (Beam Sixteen's KNOB 4, Nature's Tomb's KNOB 5).
- **The user was using the installed build during this pass** (settings show `Documents\SwayCommand Projects\Hyperspace.sway` opened at 21:32 and the rails + timeline collapsed through the new chips). Their persisted `layout` was therefore left alone. Any dev-app run restores the same layout — that is the feature working, not a regression.
- **Repo description + topics** were drafted in chat (not applied — `gh` is not on the bash PATH): "SwayCommand — a real-time, audio-reactive VJ and live-visuals instrument for the Audima Labs Sway gesture MIDI controller…" with topics vj, vjing, live-visuals, audio-reactive, audio-visualizer, music-visualizer, generative-art, creative-coding, threejs, webgl, webgl2, glsl, shaders, electron, midi, midi-controller, web-midi, gesture-control, audima-sway, wavetable-synth, web-audio, real-time-graphics, procedural-generation, performance-tool, desktop-app, raymarching, particle-system, black-hole, hyperspace, javascript.
- **Next steps in order**: commit this pass (plain messages) and push; repack + install (the installed build is one pass behind); physical session at the Sway (`scripts/midi-session.ps1`) to confirm the new pad order, Beam Sixteen's KNOB 4, Nature's Tomb's KNOB 5 and strikes, Will I Dream's warp corner and PADS 7 / 8 / 15; then the `scene:` target proposal if the user wants it; then the open v1 gaps in §4.

---

## 3. What is verified

- Code-level: the documentation set was rewritten 2026-08-20 by reading every claim out of this source tree (module by module, including `swayproject.js`, `router.js`, `transport.js`, `projectfile.js`, and the `ui/` set). The docs are the closest thing to a spec; where they and the code disagree, something regressed.
- Reconciled after the visuals pass (later on 2026-08-20): `README.md` (rack parameter count, gesture and knob tables, the Wormhole row) and the scene inventory table in `docs/SCENE_CONTRACT.md` (every morph-pass scene and the theDAW ports, re-read from each scene's header and `update()`) now describe the shipped scenes. `ENGINE.md`, `STUDIO.md`, `OVERVIEW.md`, `PROJECTS.md` were already current.
- 16 scenes registered (`scenes/index.js`); all 10 templates parse through `validateProject` with no warnings and carry the expected pools (checked by script against `projects/templates/`; `will-i-dream` carries 1 media, 1 audio clip, 1 visual clip; `natures-tomb` opens on `naturestomb` with nothing assigned).
- Third pass, dev app (2026-08-20 ~21:45): Will I Dream with the Huffman lens — 60 fps through warp, open, and mid-swallow (captured: the black core with the streak field collapsing into it); Nature's Tomb — 60 fps at one cell, through two strikes, a KNOB 5 move to 3.4 and back to 1.5 (captured: a four-nucleus embryo mid-merge inside its zona); zero console errors; 16 scenes listed.
- The pre-redesign hardware baseline still applies: Sway USB identity `VID 0x0483` / `PID 0x52A4` confirmed on hardware, port name `Audima Labs The Sway`, factory CC map exercised on the installed build.
- Second pass (2026-08-20, late evening), dev app on the upgraded stack — three 0.185.1, Electron 43.4.1, esbuild 0.28.2 (target chrome140): three runs, console hooked before any compile — all fifteen scenes compiled as GLSL3 with zero errors or warnings; Will I Dream at 60 fps at rest, through two jumps (galaxy, then the solar system arrival captured: limb-darkened sun, ringed giant, shaded planets, belt), the sway distribution morph, and the black-hole fall (60 fps with the geodesic raymarch at 52 steps; captured mid-fall: lensed shadow, photon ring, edge-on disk, streaks bending in); the `will-i-dream` template opened with all-null knobs and the rack off, the song decoded and played; Beam Sixteen at 60 fps in laser, hologram, and electricity (captured at electricity under a full sway fan); the layout found 5 grips and 6 chips, and the left rail collapsed to 18 px. MIDI access was granted but no port was present during these runs (the Sway was unplugged) — hardware behaviour of the new pad order is still unverified. A note for the next Electron upgrade: npm's allow-scripts gating skipped Electron's postinstall, so `node node_modules/electron/install.js` had to be run by hand before `dist/electron.exe` existed.
- Installed build, 2026-08-20 21:27 (supersedes the 19:02 line below): `SwayCommand-Setup-0.1.0.exe` built 21:26 on Electron 43.4.1 / three 0.185.1 (asar checked for GLSL3 materials, `willidream`, `lay-grip`, `reconcileFx`, the new pad constants, zero `AKSWAYJ`), installed with `/S`, probed from the installed exe with the console hooked: 15 scenes compiled with zero errors, every scene at 60 fps in the `cutTo` sweep (Cymatic Orb read 58 in its first-compile window), Will I Dream at full warp 60 fps, 5 grips / 6 chips present, First Flight's knobs hue / fade / kit only, rack off. The probe's rail-collapse was persisted by the layout store and then cleared again from `%APPDATA%\SwayCommand\settings.json` so the next launch opens uncollapsed.
- Installed build, 2026-08-20 19:02: `SwayCommand-Setup-0.1.0.exe` (built 18:58 from a bundle with no newer `src/` file; the asar checked for the new code and the refreshed docs, zero `AKSWAYJ` strings) installed with `/S` to `%LOCALAPPDATA%\Programs\swaycommand` and probed headlessly from the installed exe in one run — `SWAYCOMMAND_AUTOPLAY=first-flight`, one batched `SWAYCOMMAND_PROBE`, `SWAYCOMMAND_SHOT` at 30 s. Result: blast door entered, First Flight loaded with no warnings, 14 scenes registered, the new knob table in the assignments, 8 template pads, MIDI on `Audima Labs The Sway` (the hardware was connected; no strikes landed during the run), audio on the default input, and a `cutTo` sweep over all 14 scenes reading 60 fps each at a 1275 × 583 stage; the screenshot shows the Wormhole in DRIFT with the top-bar counter at 60. Window-size budgets remain unmeasured.

---

## 4. Known gaps

| Gap | Detail | Fix path |
|---|---|---|
| Loop seam is frame-quantized | `transport.update()` checks the loop boundary once per rAF call, so the seam lands up to one frame late; the audio sources themselves stop at the check, not on the audio clock. Accepted for v1. | Schedule the post-seam sources ahead on the context clock instead of rescheduling at the check (`src/renderer/audio/transport.js`, `update`). |
| Decoded-size pre-flight is an estimate | `projectstore.js` warns above ~600 MB and refuses above ~1.5 GB of estimated decoded size, assuming 48 kHz stereo Float32 — and only when a duration is already cached, so a first-time oversized file has no pre-flight and hits the decoder directly. | Persist duration on first add (already done via `addMedia`) and consider probing the container header for duration before decode. |
| Pad physical order unverified | `PAD_CELLS` in `src/renderer/ui/surface.js` maps screen cells to pad indices assuming bottom rows first, left cluster 0–7, right cluster 8–15. Not yet checked against the hardware. | Run `scripts/midi-session.ps1` with the Sway connected and strike the pads in the order it prints; `padStrikeOrder.pad` in the report must read 0..15, otherwise reorder the `PAD_CELLS` entries — nothing else references the geometry. |
| Sway button CCs are learn-only | Audima has not published the eight buttons' CC numbers; slots ship empty (`cc: null`) until LEARN captures them. | The same `scripts/midi-session.ps1` run lists them as `unmappedCCs` in first-seen order (buttons should show 0 / 127 value pairs; knob presses surface there too); add them to `swaymap.js` as defaults if stable. |
| Dual decode for shared media | A media file used by both the kit and the timeline decodes twice — the sampler decodes internally, the transport needs its own `AudioBuffer` (`projectstore.js`, `loadMediaAsync`). Rare enough that v1 does not share. | Give the sampler a `getBuffer(id)` accessor and hand the same buffer to the transport. |
| ~~Audio-lane clips cannot be selected on the band~~ | Fixed the day this note was written: `#tl-audio` now hit-tests pointerdown — click selects, drag moves, the trailing edge resizes, Delete/arrows apply (`src/renderer/ui/timeline.js`). Kept here because the fix landed after the docs pass. | — |

---

## 5. Packaging hazard

Hit twice before the redesign: source files edited **after** a build was cut, so the packaged installer did not contain the code that had just been reviewed. It was caught only by comparing file mtimes against the build timestamp. Before packaging:

1. Confirm no agent or watcher is still writing under `src/`.
2. Run `npm run build:renderer`, then verify nothing under `src/` is newer than `dist/renderer.bundle.js`.
3. Then `npm run dist:win` (or `dist:mac` / `dist:linux`). Output lands in `release/`; the Windows installer is one-click, per-user, `%LOCALAPPDATA%\Programs\swaycommand`, silent with `/S`.

Docs are not bundled by the renderer build — `docs/**/*.md` and `README.md` are packaged as files — so documentation edits need only a repack, not a bundle.

---

## 6. Verifying work without a human

No test suite. Verification drives the real app headlessly through env vars read in `src/main/main.js` ([docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) has the full reference and working probe examples):

| Variable | Effect |
|---|---|
| `SWAYCOMMAND_SHOT` | Capture the window to a PNG, then quit |
| `SWAYCOMMAND_SHOT_DELAY` | ms before capture, default 5000 |
| `SWAYCOMMAND_WINDOW` | `WxH` initial window size, for narrow-layout screenshots |
| `SWAYCOMMAND_AUTOPLAY` | Template id **or** `.sway` file path; skips the SYSTEM modal |
| `SWAYCOMMAND_SCENE` | Force a scene id. Bypasses navigation — never use it to judge discoverability |
| `SWAYCOMMAND_PROBE` | Run JS in the page 3000 ms after load; result prints as `[probe] …` |

`window.__swaycommand` is the automation handle (shape in section 2). Two prepared runs live in `scripts/`: `midi-session.ps1` (with `midi-session-probe.js`) is the hardware monitor session for §4 — it runs the dev app with a probe that wraps the MIDI monitor ring buffer for N seconds and prints one JSON report (pad strike order, unmapped CCs, mapped CCs, raw lines), then quits through a late `SWAYCOMMAND_SHOT`. The installed-build probe used for §3 is the pattern for any packaged check: launch `%LOCALAPPDATA%\Programs\swaycommand\SwayCommand.exe` itself with the env vars set — its main-process stdout reaches a redirected file — and batch everything into one async probe expression (`executeJavaScript` awaits a returned promise) with the shot delay past the probe's own timers. Standing traps, all hit during earlier work:

- **`ELECTRON_RUN_AS_NODE` may be set in agent shells.** Electron then starts as plain Node and dies with `Cannot read properties of undefined (reading 'whenReady')`. Clear it every launch.
- **`SWAYCOMMAND_SHOT_DELAY` must exceed the probe's own timers**, or the app quits mid-probe and prints nothing.
- **Env vars leak between runs.** Clear `SWAYCOMMAND_AUTOPLAY` / `SWAYCOMMAND_SCENE` explicitly.
- **Launch sparingly.** The user has asked for restraint on headless app launches: batch multiple checks into one probe, prefer `node scripts/build-renderer.js` alone for syntax-level verification, and reserve screenshots for milestones.
- **The hardware may be live.** With the Sway connected, its pad strikes and CCs reach the router during headless runs — a scene changing "by itself" mid-probe is usually a real strike on a template-assigned pad, not a bug.
- **Do not read the WebGL canvas by drawing it into a 2D canvas** — the renderer runs without `preserveDrawingBuffer` and reads back pure black. Use `SWAYCOMMAND_SHOT` and measure the PNG.

---

## 7. Standing constraints

- **`voxels.js` is the user's favourite scene and is off-limits** unless they say otherwise.
- **Apache-2.0 ports** (`ferrofluid`, `chladni`, `valley` — from theDAW's cymatics shaders) carry the required licence notice and statement of changes in their headers. Do not strip them.
- **VJ-9000 has no licence file upstream** (`vjshader`, `spectra`, the fx rack derive from it). It is the author's own work, but a licence should be added before third-party distribution.
- **Audima's terms forbid redistributing their binaries.** The Doctor fetches from `cdn.audima.com.au` onto the user's machine and never bundles. Keep it that way.
- **theDAW alignment**: the synth keeps theDAW's `voiceTrigger` signature and `controlManifest` shape; audio modules are factory functions taking `ctx` and a destination array. A module that cannot be lifted into theDAW unchanged is a divergence.
