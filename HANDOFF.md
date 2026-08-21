# AKSWAYJ handoff

Written 2026-08-20 for the next engineer or agent, after the single-page cockpit redesign. This is an internal engineering note. It is deliberately **not** in `docs/`, not in the documentation index, and not packaged into the app — `electron-builder.yml` ships `docs/**/*.md` and `README.md` by exact name, so a root-level file never reaches an end user.

Product documentation lives in [`docs/`](docs/) and was regenerated against this source tree on 2026-08-20. Start with [docs/OVERVIEW.md](docs/OVERVIEW.md) for terminology; this note assumes it.

---

## 1. Repository state

Version control exists. The working branch is `cockpit`; `main` holds the pre-redesign import. Recent history on `cockpit`:

```
710fd61 Retire legacy presets; template scene pads; verification hooks
bbe9649 Single-surface cockpit
7e29dd8 Assignment router — one dispatch path for every control
e2fb1b0 Transport and project store
b42f1b7 Engine: instant cut, prewarm, ResizeObserver, frame hook, .sway apply
dabe8a2 Add .sway project IPC surface
```

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
- **main.js** — IPC gained `project:*` (openDialog, saveDialog, read, write, recent, templates, readTemplate) and `files:statAudio`; `projects:list` is gone with the picker. `AKSWAYJ_AUTOPLAY` now takes a template id or a `.sway` path; `AKSWAYJ_WINDOW=WxH` forces the initial window size for layout screenshots.
- **app.js** — rebuilt as cockpit assembly. `window.__akswayj` is now `{ state, studio, openStudio(tab), openDocs, renderPads, renderSamples, transport, projectStore, router, selectControl, openProject, saveProject }`; `state.screen` no longer exists.

Projects: the 8 legacy presets became bundled templates (`projects/templates/*.sway`, converted via `legacyToSway`), reachable from the project menu. Format reference: [docs/PROJECTS.md](docs/PROJECTS.md).

---

## 3. What is verified

- Code-level: the documentation set was rewritten 2026-08-20 by reading every claim out of this source tree (module by module, including `swayproject.js`, `router.js`, `transport.js`, `projectfile.js`, and the `ui/` set). The docs are the closest thing to a spec; where they and the code disagree, something regressed.
- 14 scenes registered (`scenes/index.js`); all 8 templates parse and carry the expected pools (checked by script against `projects/templates/`).
- The pre-redesign hardware baseline still applies: Sway USB identity `VID 0x0483` / `PID 0x52A4` confirmed on hardware, port name `Audima Labs The Sway`, factory CC map exercised on the installed build.
- Not re-measured since the redesign: frame rates per scene, window-size budgets, and installed-build behavior. The redesign has not been packaged and installed yet — treat any installed-build claim as stale until a new build is cut and probed.

---

## 4. Known gaps

| Gap | Detail | Fix path |
|---|---|---|
| Loop seam is frame-quantized | `transport.update()` checks the loop boundary once per rAF call, so the seam lands up to one frame late; the audio sources themselves stop at the check, not on the audio clock. Accepted for v1. | Schedule the post-seam sources ahead on the context clock instead of rescheduling at the check (`src/renderer/audio/transport.js`, `update`). |
| Decoded-size pre-flight is an estimate | `projectstore.js` warns above ~600 MB and refuses above ~1.5 GB of estimated decoded size, assuming 48 kHz stereo Float32 — and only when a duration is already cached, so a first-time oversized file has no pre-flight and hits the decoder directly. | Persist duration on first add (already done via `addMedia`) and consider probing the container header for duration before decode. |
| Pad physical order unverified | `PAD_CELLS` in `src/renderer/ui/surface.js` maps screen cells to pad indices assuming bottom rows first, left cluster 0–7, right cluster 8–15. Not yet checked against the hardware. | One `K`-monitor session with the Sway; if wrong, reorder the `PAD_CELLS` entries — nothing else references the geometry. |
| Sway button CCs are learn-only | Audima has not published the eight buttons' CC numbers; slots ship empty (`cc: null`) until LEARN captures them. | Same monitor session could recover the factory numbers; add them to `swaymap.js` as defaults if stable. |
| Dual decode for shared media | A media file used by both the kit and the timeline decodes twice — the sampler decodes internally, the transport needs its own `AudioBuffer` (`projectstore.js`, `loadMediaAsync`). Rare enough that v1 does not share. | Give the sampler a `getBuffer(id)` accessor and hand the same buffer to the transport. |
| ~~Audio-lane clips cannot be selected on the band~~ | Fixed the day this note was written: `#tl-audio` now hit-tests pointerdown — click selects, drag moves, the trailing edge resizes, Delete/arrows apply (`src/renderer/ui/timeline.js`). Kept here because the fix landed after the docs pass. | — |

---

## 5. Packaging hazard

Hit twice before the redesign: source files edited **after** a build was cut, so the packaged installer did not contain the code that had just been reviewed. It was caught only by comparing file mtimes against the build timestamp. Before packaging:

1. Confirm no agent or watcher is still writing under `src/`.
2. Run `npm run build:renderer`, then verify nothing under `src/` is newer than `dist/renderer.bundle.js`.
3. Then `npm run dist:win` (or `dist:mac` / `dist:linux`). Output lands in `release/`; the Windows installer is one-click, per-user, `%LOCALAPPDATA%\Programs\akswayj`, silent with `/S`.

Docs are not bundled by the renderer build — `docs/**/*.md` and `README.md` are packaged as files — so documentation edits need only a repack, not a bundle.

---

## 6. Verifying work without a human

No test suite. Verification drives the real app headlessly through env vars read in `src/main/main.js` ([docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) has the full reference and working probe examples):

| Variable | Effect |
|---|---|
| `AKSWAYJ_SHOT` | Capture the window to a PNG, then quit |
| `AKSWAYJ_SHOT_DELAY` | ms before capture, default 5000 |
| `AKSWAYJ_WINDOW` | `WxH` initial window size, for narrow-layout screenshots |
| `AKSWAYJ_AUTOPLAY` | Template id **or** `.sway` file path; skips the SYSTEM modal |
| `AKSWAYJ_SCENE` | Force a scene id. Bypasses navigation — never use it to judge discoverability |
| `AKSWAYJ_PROBE` | Run JS in the page 3000 ms after load; result prints as `[probe] …` |

`window.__akswayj` is the automation handle (shape in section 2). Standing traps, all hit during earlier work:

- **`ELECTRON_RUN_AS_NODE` may be set in agent shells.** Electron then starts as plain Node and dies with `Cannot read properties of undefined (reading 'whenReady')`. Clear it every launch.
- **`AKSWAYJ_SHOT_DELAY` must exceed the probe's own timers**, or the app quits mid-probe and prints nothing.
- **Env vars leak between runs.** Clear `AKSWAYJ_AUTOPLAY` / `AKSWAYJ_SCENE` explicitly.
- **Do not read the WebGL canvas by drawing it into a 2D canvas** — the renderer runs without `preserveDrawingBuffer` and reads back pure black. Use `AKSWAYJ_SHOT` and measure the PNG.

---

## 7. Standing constraints

- **`voxels.js` is the user's favourite scene and is off-limits** unless they say otherwise.
- **Apache-2.0 ports** (`ferrofluid`, `chladni`, `valley` — from theDAW's cymatics shaders) carry the required licence notice and statement of changes in their headers. Do not strip them.
- **VJ-9000 has no licence file upstream** (`vjshader`, `spectra`, the fx rack derive from it). It is the author's own work, but a licence should be added before third-party distribution.
- **Audima's terms forbid redistributing their binaries.** The Doctor fetches from `cdn.audima.com.au` onto the user's machine and never bundles. Keep it that way.
- **theDAW alignment**: the synth keeps theDAW's `voiceTrigger` signature and `controlManifest` shape; audio modules are factory functions taking `ctx` and a destination array. A module that cannot be lifted into theDAW unchanged is a divergence.
