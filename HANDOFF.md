# SwayCommand handoff

Internal engineering note for the next engineer or agent. It is deliberately **not** in `docs/`, not in the documentation index, and not packaged — `electron-builder.yml` ships `docs/**/*.md` and `README.md` by exact name, so a root-level file never reaches an end user. Product documentation lives in [`docs/`](docs/); start with [docs/OVERVIEW.md](docs/OVERVIEW.md) for terminology. Last revised 2026-08-21, after the fourth pass.

**How this note stays short.** Delivered work waits for the user's approval inside `<!-- prune:<id> -->` … `<!-- /prune:<id> -->` blocks in §2, one block per task, most recent last. When the user approves a task, run `node scripts/handoff-prune.js <id>` (`--list` prints the ids, `--all` clears them) and the block goes; its id lands on the ledger line at the end, and git history keeps the detail. Everything outside the blocks is the durable core — state, standing rules, how to verify, known gaps, packaging — and is edited in place, never appended to.

---

## 1. State

- Branch `cockpit` tracks `origin/cockpit`; `main` holds the pre-redesign import (the merge is the user's call). `b98991a` committed the third pass (Will I Dream's CodePen lens, Nature's Tomb's egg cell); the fourth pass — Nature's Tomb's slime mold and mycelium, Miracle Mile, the scene harness, this note's structure — follows it.
- Registry: seventeen scenes (`src/renderer/engine/scenes/index.js`). Templates: eleven (`projects/templates/index.json`), all validating through `validateProject` with no warnings.
- Installed build: `release/SwayCommand-Setup-0.1.0.exe` built 2026-08-21 00:06 from commit `9f7d8b4` (the hazard check passed: no `src/` file newer than `dist/renderer.bundle.js`; the asar carries `miraclemile`, the slime and mycelium simulations, zero old-name strings), installed per-user with `/S` while the app was not running, and probed from the installed exe with the console hooked: 17 scenes, zero errors or warnings, the slime mold at full reach, the mycelium, and all four Miracle Mile acts with their events at 60 fps (58 in the detonation's first fireball frames and the blast's flash frames — the same first-compile dip Cymatic Orb shows). The user's persisted `settings.layout` was left alone.
- **Next steps in order:** the user reviews §2 and prunes what they approve; the physical session at the Sway (`scripts/midi-session.ps1`) to confirm the pad order, the button and knob-press CCs, Beam Sixteen's KNOB 4, Nature's Tomb's KNOB 5 / KNOB 6 and strikes, Miracle Mile's KNOB 5 / KNOB 6 and strikes, Will I Dream's warp corner and PADS 7 / 8 / 15; then the `scene:<param>` assignment target (§5) if the user wants it; then the remaining §5 gaps.

---

## 2. Delivered, awaiting approval

<!-- prune:cockpit-redesign -->
### cockpit-redesign — the single-surface cockpit (2026-08-20)

The five full-window screens (boot, projects, studio, docs, perform) became one always-live page: the stage renders from the first frame to quit and every panel works on top of it (layout and interaction model in [docs/OVERVIEW.md](docs/OVERVIEW.md#the-cockpit)). New modules: `src/shared/swayproject.js` (the `.sway` document: schema, defaults, `validateProject`, `legacyToSway`), `src/main/projectfile.js` (`.sway` I/O, id-gated bundled templates, recents, `statAudio`), `src/renderer/project/projectstore.js` (document lifecycle), `src/renderer/control/router.js` (the single dispatch point for pads, buttons, knobs, gestures, timeline clips, LEARN), `src/renderer/audio/transport.js` (timeline playback on the context clock), `src/renderer/ui/` — `frame.js`, `popover.js`, `wave.js`, `surface.js` (the deck schematic and `PAD_CELLS`), `assign.js`, `drawer.js`, `timeline.js`, later `layout.js`. Existing modules gained: engine `cutTo` / `prewarm` / `params` / `setFrameHook` / `applyProject` / fx accessors; fxrack `DECKS` and `DEFAULTS`; midi's full event set; WASAPI loopback in audio analysis; `project:*` IPC and the `SWAYCOMMAND_*` hooks in main; `app.js` rebuilt as cockpit assembly with `window.__swaycommand` as the automation handle. The eight legacy presets became bundled templates. The rename from the former product name was total (code, wordmarks, preload API, env hooks, appId, installer, docs); the Electron userData directory moved with it, so settings written under the old name did not carry over.
<!-- /prune:cockpit-redesign -->

<!-- prune:visuals-pass -->
### visuals-pass — theDAW ports, morph passes, the Wormhole, rack and knobs (2026-08-20)

Engine: half-float render targets, a per-scene UnrealBloomPass (`meta.bloom` or a live `instance.bloom`), a PMREM RoomEnvironment handed to scenes as `ctx.environment`, `io.strike` as the strike dimension. Faithful theDAW ports with Apache-2.0 notices: `lattice.js`, `ferrofluid.js`, `chladni.js`, `valley.js`. Morph passes (sway reshapes a generative parameter, strike restructures) over beams, swarm, ribbons, nebula, mandelbulb, cymatic, vjshader, spectra; `warp.js` redesigned as the hard-science Wormhole (DRIFT / WARP / WORMHOLE). Rack: `anaglyph` and `mosaic` (38 params); driving any `fx:` target auto-enables the rack. Every scene screenshot-verified at 60 fps plus a sweep probe.
<!-- /prune:visuals-pass -->

<!-- prune:will-i-dream -->
### will-i-dream — the scene, its v2, and the CodePen lens (2026-08-20)

`scenes/willidream.js` + `projects/templates/will-i-dream.sway` (the song from the user's Music folder linked by absolute path on the audio lane, the scene on the visual lane; rack off, Auto-VJ off, pads unassigned). Built to the user's brief from the MIT CodePen exports in `C:\Users\Cyboman\Downloads\ScifiUI`: nothing applied at rest, hyperspace on the hand peaking at the highest X / lowest Y as a layer above everything, forward motion only, PAD 7 the black hole, PAD 8 / PAD 15 banks, a new celestial object after every jump except a swallowed one. v2 after review: forward motion fixed, the stars ARE the streaks (instanced screen-space capsules), sway = distribution control (scatter ↔ lattice), analytic celestial objects (pulsar, spiral galaxy, solar system, layered nebula, ringed giant). Third pass: the black hole is Darryl Huffman's CodePen lens from the user's `BLACKHOLE.zip` by explicit instruction ("use THIS black hole") — `pull = mass / dist²`, the view rotated about the mass by `(pull + held)·π` with upstream's zero sine term, darkening `colour − pull·0.25`; PAD 7 eases the mass in, the hold climbs, the mass grows until its own darkening swallows the view, void, re-emergence, no object. Verified at 60 fps through warp, banks, jumps and the swallow.
<!-- /prune:will-i-dream -->

<!-- prune:second-pass -->
### second-pass — pad numbering, nothing-by-default, no auto-rotation, GLSL3, Beam Sixteen styles, the resizable cockpit (2026-08-20)

The user's review set rules that now bind the whole project (kept in §3): pads numbered 0–15 as the deck is drawn, nothing drives an effect by default (`defaultKnobs()` all null, the router's `reconcileFx`), nothing auto-rotates anywhere (every scene swept, including the one-term orbit in the off-limits `voxels.js`, and the rack's spoke wheel), every shader GLSL3, no AI attribution. Built: Beam Sixteen v2 (HOLOGRAM / LASER / ELECTRICITY on KNOB 4, `io.knobs[3]`, a floor with impact pools, dust), the resizable / collapsible cockpit (`ui/layout.js`: grips, collapse chips, persisted under `settings.layout`). Stack raised to three 0.185.1 / Electron 43.4.1 / esbuild 0.28.2 (target chrome140); npm's allow-scripts gating skipped Electron's postinstall once — `node node_modules/electron/install.js` fixes a missing `dist/electron.exe`. `scripts/midi-session.ps1` + `midi-session-probe.js` prepared for the hardware session.
<!-- /prune:second-pass -->

<!-- prune:natures-tomb -->
### natures-tomb — the egg cell (third pass), the slime mold and the mycelium (fourth pass)

`scenes/naturestomb.js`, template `natures-tomb`. The user's brief: "a realistic looking egg cell that divides into more cells via mitosis, or undivides, with a control interface of the user's choosing" — then "add these kinds of visuals to the plan for nature's tomb: slime mold, mycelia". Controls (raw knobs, documented in the SCENE_CONTRACT inventory): **KNOB 6** (`io.knobs[5]`) picks the organism — centre (the 0.5 default) the egg cell, right the slime mold, left the mycelium, a 0.15 s dissolve so the knob's speed is the transition's; **KNOB 5** (`io.knobs[4]`) sets the shared development level 0–4 the moment it moves and **any pad strike** steps it one stage, reversing at the ends, eased over ~1.3 s — the division count for the egg (1 → 2 → 4 → 8 → 16, un-dividing when driven down), the colony's reach for the slime mold, the growth time for the mycelium. Sway morphs each generator (membrane jiggle; sensing — fine lattice to coarse trunk veins; branching angle and tortuosity), press squeezes, the hand pans (X) and dollies (Y), translation only. The slime mold is a real Physarum simulation on the CPU (Jones's agent model on a trail map, including the one-agent-per-cell rule that keeps veins thin — without it the colony collapses into one slug; a spread spawn over the newly gained ground, nine oat flakes as attractants the veins anchor to; the trail uploaded as an 8-bit `DataTexture`, lit as a glossy plasmodium with a shuttle-streaming pulse). The mycelium is a hyphal growth simulation laid down in time order as one instanced mesh of screen-space capsules (flat-butted joints, round apices, septa) and re-run from one random table whenever sway moves so the network deforms instead of re-seeding. Costs on this machine: the slime sim ~4 ms/frame at full reach, the rest negligible. Verified: harness stills of every organism and morph; the app probe at 60 fps through the egg, the slime mold (full reach, sway), the mycelium and a strike. Realism follow-ups not done: cells flattening against each other and the zona, a thickness-based SSS, a microscope DOF.
<!-- /prune:natures-tomb -->

<!-- prune:miracle-mile -->
### miracle-mile — four acts of the atom (fourth pass)

`scenes/miraclemile.js` (id `miraclemile`), template `miracle-mile` (palette hot / fire / cyan / magenta / ash; rack off; nothing assigned). The user's brief: "New Scene: Miracle Mile — atom splitting, mushroom cloud, shockwave, cern/particle smashing". Controls: **KNOB 6** (`io.knobs[5]`) picks the act in quarter turns — COLLIDER, FISSION, DETONATION (the 0.5 rest: the mature cloud), SHOCKWAVE — with a 0.7 s dissolve and a little hysteresis at the band edges; **any pad strike** fires the act's event; **KNOB 5** (`io.knobs[4]`) is the yield (multiplicity, prompt neutrons and fragment speed, cloud scale, blast speed and dust); sway morphs (field strength, scission symmetry, the cloud's build, hemisphere ↔ Mach stem); press squeezes (dives to the vertex, compresses the nuclei, flattens the cap, ducks); the hand drives the eye (orbits in the collider and the lattice — the only rotations, all the hand's; dolly and height at the cloud and on the boulevard). Systems: the world quad (analytic backgrounds, the raymarched mushroom SDF with noise flows for the cap's roll and the stem's updraft, the boulevard with lamps, facades and the blast's refraction / condensation band / dust wall / veil), one instanced capsule mesh (detector rings and axials, helix tracks rebuilt per frame so sway's field curls them live, calorimeter bars, neutron streaks, lamp posts), two impostor meshes (solid nucleons with depth; additive bunches, hits, neutrons, lamp heads, embers); live bloom rides the flash. Verified: harness stills of every act and event (the first cut hid the cloud behind a too-tall skyline and left it unlit at maturity — fixed with a lower, farther skyline, a bigger cloud, sky / city / ember light; the shockwave's front was too subtle — taller dust wall, lit veil, longer lamp flare); the app probe at 60 fps through all four acts and their events; the template opens in 44 ms.
<!-- /prune:miracle-mile -->

<!-- prune:scene-harness -->
### scene-harness — offscreen verification, and this note's prune mechanism (fourth pass)

`scripts/scene-harness.js` + `scripts/scene-harness.entry.js`: bundles the scene registry with esbuild, opens a **hidden** Electron window (not the app — no focus steal, no hardware interplay), creates scenes with the engine's creation context, drives `update()` with a patched `io` per planned shot (knobs, gestures, bands, strike, palette), reports hooked console errors / warnings, update cost and ms/frame, and saves a PNG still per shot (`node scripts/scene-harness.js plan.json`; the plan format is in the file's header). It is what made the slime mold's collapse, the mycelium's culled quads and the hidden cloud visible without app launches. `scripts/handoff-prune.js` removes approved blocks from this note (see the top). Also noted: the Bash tool in this agent environment fails with ENAMETOOLONG on ~20 KB heredocs — write large files with the file tools.
<!-- /prune:scene-harness -->

---

## 3. Standing rules

- **Pads are numbered 0–15 as the user drew them on the deck**: top rows first, left cluster 0–3, right cluster 4–7, then the bottom rows, left 8–11, right 12–15 (`PAD_CELLS` in `surface.js`; the assignment panel shows `PAD n` 0-based). The note→index map is unchanged (chromatic base 24).
- **Nothing drives an effect by default — ever.** `defaultKnobs()` is eight nulls; templates carry no `fx:*` or `engine:intensity` knobs (the factory presets keep hue / fade length / kit level; the authored templates map nothing). The router reconciles fx every frame (`reconcileFx`): a key no assignment drives any more resets to its rack default, and a rack a control switched on switches off again when nothing drives it. Clearing a pad / knob / route therefore also stops whatever effect it drove.
- **Nothing auto-rotates, in any scene or effect** (hard rule 8 in [docs/SCENE_CONTRACT.md](docs/SCENE_CONTRACT.md)). Hand-driven orbits, per-particle flow, scrolling, breathing, path travel and noise-domain flows stay. Forward motion only in flight scenes; hyperspace as a layer above the scene.
- **Every shader is GLSL3** (`glslVersion: THREE.GLSL3`, `in` / `out`, `out vec4 fragColor`, `texture()`); `onBeforeCompile` injections into three's built-in materials keep three's conventions by necessity. Keep the stack current (three 0.185.1, Electron 43.4.1, esbuild 0.28.2, target chrome140).
- **No AI attribution anywhere**: no `Co-Authored-By` trailers, no "generated by" lines in headers, docs, or PR bodies. Commit messages are plain.
- **Scenes that read raw knobs say so in the SCENE_CONTRACT inventory**: Beam Sixteen KNOB 4; Nature's Tomb KNOB 5 (level, plus any strike) and KNOB 6 (organism); Miracle Mile KNOB 5 (yield) and KNOB 6 (act, plus any strike). A generic `scene:<param>` assignment target stays a proposal (§5).
- **`voxels.js` is the user's favourite scene and is off-limits** unless they say otherwise (the one-term orbit removal was the only edit, forced by the "any scene" rule).
- **Apache-2.0 ports** (`ferrofluid`, `chladni`, `valley` — theDAW's cymatics shaders) carry the licence notice and statement of changes in their headers; do not strip them. **VJ-9000 has no licence file upstream** (`vjshader`, `spectra`, the fx rack derive from it); add one before third-party distribution. **Audima's terms forbid redistributing their binaries** — the Doctor fetches from `cdn.audima.com.au` onto the user's machine and never bundles. **theDAW alignment**: the synth keeps theDAW's `voiceTrigger` signature and `controlManifest` shape; audio modules are factory functions taking `ctx` and a destination array.
- **UI naming**: no element titled twice, no juvenile wording, no AI-UI tropes; terse instrument labels; the sci-fi cockpit aesthetic from the user's `ScifiUI` packs (the user's memory note `user-naming-constraints` has the full rule).
- **Keep headless app launches rare**: iterate with the scene harness, batch app checks into one probe per pass, reserve screenshots for milestones. The user runs the installed build while work happens; their persisted `settings.layout` is theirs — a dev run restoring collapsed rails is the feature working, not a regression.

---

## 4. Verifying without a human

No test suite. Two tools:

- **The scene harness** (`node scripts/scene-harness.js plan.json`): compile + render + stills in a hidden Electron window. Use it for any scene work; it does not touch the app, the settings, or the hardware.
- **The app, headlessly**, through env vars read in `src/main/main.js` ([docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) has the reference and working probe examples): `SWAYCOMMAND_SHOT` (capture to PNG, then quit), `SWAYCOMMAND_SHOT_DELAY` (ms, default 5000 — must exceed the probe's own timers), `SWAYCOMMAND_WINDOW` (`WxH`), `SWAYCOMMAND_AUTOPLAY` (template id or `.sway` path; skips the SYSTEM modal), `SWAYCOMMAND_SCENE` (force a scene id — never use it to judge discoverability), `SWAYCOMMAND_PROBE` (JS evaluated 3000 ms after load; an async IIFE returning a promise is awaited; the result prints as `[probe] …`). `window.__swaycommand` is the automation handle: `{ state, studio, openStudio(tab), openDocs, renderPads, renderSamples, transport, projectStore, router, selectControl, openProject, saveProject }`; `state.engine` / `state.midi.control` drive scenes and fake strikes (`control.pads[i] = 1` is one strike; `control.knobs[i]`, `control.gestures.*`, `control.xy`). Launch: `node scripts/build-renderer.js`, then `npx electron .` with the env set (or `npm start`). The packaged exe can be launched the same way and its stdout redirected. `scripts/midi-session.ps1` is the prepared hardware session.

Standing traps: `ELECTRON_RUN_AS_NODE` may be set in agent shells (Electron then starts as Node and dies on `whenReady`) — clear it every launch; env vars leak between runs (clear `SWAYCOMMAND_AUTOPLAY` / `SWAYCOMMAND_SCENE`); the hardware may be live (a scene changing "by itself" mid-probe is usually a real strike on a template-assigned pad); do not read the WebGL canvas by drawing it into a 2D canvas (no `preserveDrawingBuffer` — it reads black); the Bash tool's command length limit (write large files with the file tools).

---

## 5. Known gaps

| Gap | Detail | Fix path |
|---|---|---|
| Pad physical order unverified | `PAD_CELLS` (`src/renderer/ui/surface.js`) follows the user's drawing; not yet checked against the hardware. | Run `scripts/midi-session.ps1` with the Sway connected; `padStrikeOrder.pad` must read 0..15, otherwise reorder `PAD_CELLS` — nothing else references the geometry. |
| Sway button CCs are learn-only | Audima has not published the eight buttons' CC numbers; slots ship `cc: null` until LEARN captures them. | The same session lists them as `unmappedCCs` (0 / 127 pairs; knob presses surface there too); add them to `swaymap.js` as defaults if stable. |
| Scene parameters ride raw knobs | Beam Sixteen, Nature's Tomb and Miracle Mile read `io.knobs[...]` by convention. | A generic `scene:<param>` assignment target (router + assign panel) so any control can drive a scene parameter through the normal assignment UI. |
| Loop seam is frame-quantized | `transport.update()` checks the loop boundary once per rAF, so the seam lands up to one frame late. Accepted for v1. | Schedule the post-seam sources ahead on the context clock (`src/renderer/audio/transport.js`, `update`). |
| Decoded-size pre-flight is an estimate | `projectstore.js` warns above ~600 MB and refuses above ~1.5 GB of estimated decoded size, and only when a duration is cached. | Probe the container header for duration before decode. |
| Dual decode for shared media | A file used by both the kit and the timeline decodes twice. | Give the sampler a `getBuffer(id)` accessor and hand the same buffer to the transport. |
| Nature's Tomb realism | Cells do not flatten against each other or the zona; no thickness-based SSS; no microscope DOF. | Follow-ups in `naturestomb.js`'s egg raymarch. |
| Window-size budgets unmeasured | The 60 fps figures are at the dev / probe stage sizes. | A sweep at 1080p with `SWAYCOMMAND_WINDOW`. |

---

## 6. Packaging hazard

Hit twice before the redesign: source files edited **after** a build was cut, so the installer did not contain the reviewed code; caught only by comparing file mtimes against the build timestamp. Before packaging: confirm no agent or watcher is still writing under `src/`; run `npm run build:renderer` and verify nothing under `src/` is newer than `dist/renderer.bundle.js`; then `npm run dist:win` (or `dist:mac` / `dist:linux`) — output lands in `release/`; the Windows installer is one-click, per-user, `%LOCALAPPDATA%\Programs\swaycommand`, silent with `/S`. Docs are packaged as files, not bundled, so documentation edits need only a repack.

Approved and pruned: (none yet)
