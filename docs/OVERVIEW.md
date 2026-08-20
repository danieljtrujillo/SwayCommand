# System overview

AKSWAYJ is an Electron application with two processes. The main process owns operating-system integration: window lifecycle, USB and registry inspection, downloads from Audima's CDN, driver installation, and the settings file. The renderer process owns everything visible: the user interface, MIDI input, audio analysis, and the WebGL render pipeline. The two communicate over a fixed IPC surface exposed through a context-isolated preload script.

The application has four screens. The first three are entered in order; the documentation viewer opens over any of them and returns to the one it was opened from.

1. **Doctor** — a system check with per-item remediation. When every check passes, the application advances on its own after 1.4 seconds.
2. **Project picker** — the eight bundled projects. Selecting one starts the performance.
3. **Perform** — the render canvas with a heads-up display, keyboard shortcuts, and overlays for help and MIDI monitoring.
4. **Documentation viewer** — the Markdown documentation bundled with the build, rendered in the application. It is entered from the Documentation button on the Doctor and project-picker screens, or with the `D` key from any other screen, and left with the Close button or `Esc`. Opening it from a performance stops the render loop; returning restarts it.

## Purpose and scope

The Sway (Audima Labs Pty Ltd) is a gesture-based MIDI controller: sixteen infrared distance sensors translate hand positions above the unit into MIDI continuous controllers and notes. Audima ships a companion application for preset editing and firmware updates, DAW integration scripts, and demo packs, but no visual-performance software. AKSWAYJ supplies that layer: a self-contained VJ instrument mapped to the Sway's factory MIDI assignments, playable immediately after installation.

The Sway is optional at every point. All Sway controls have mouse, keyboard, and generic-MIDI equivalents, and the audio-analysis layer synthesizes an internal signal when no input device is available, so every scene renders meaningful output on a machine with no peripherals at all.

## Terminology

| Term | Definition |
|---|---|
| Sway | Audima Labs' gesture MIDI controller. USB `VID 0x0483`, `PID 0x52A4` in normal operation; `PID 0xDF11` in firmware-update (DFU) mode. |
| Sway Software | Audima's companion application for preset editing and firmware updates. Optional; not required by AKSWAYJ. |
| Doctor | AKSWAYJ's startup system check and remediation screen. |
| documentation viewer | The `#screen-docs` screen. It renders the Markdown files enumerated by `DOC_ORDER` in `src/main/main.js`, requested over the `docs:list` and `docs:read` IPC channels. |
| scene | A self-contained procedural visual module conforming to [SCENE_CONTRACT.md](SCENE_CONTRACT.md). |
| project | A JSON preset selecting a scene pool, color palette, and Auto-VJ parameters. See [PROJECTS.md](PROJECTS.md). |
| factory map | The Sway's default MIDI assignments, recovered from Audima's own artifacts. See [SWAY_INTEGRATION.md](SWAY_INTEGRATION.md). |
| control state | The normalized input snapshot (XY, gestures, knobs, pads) shared between the MIDI layer and the engine. |
| Auto-VJ | The scheduler that holds a scene for a randomized interval, then crossfades to another scene from the project pool. |
| ColorMaster | The global five-color palette instance that every scene reads each frame. |
| internal groove | A synthesized 120 BPM rhythm routed only into the analyser node; inaudible, used when no audio input is available. |
| quality tier | A particle/instance budget preset passed to scenes at creation: `low` (8,000), `med` (30,000), `high` (80,000). |

## Component map

| Layer | Module | File | Reference |
|---|---|---|---|
| Main | Application entry, window, IPC | `src/main/main.js` | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Main | System checks | `src/main/doctor.js` | [DOCTOR.md](DOCTOR.md) |
| Main | Audima CDN client, minisign verification | `src/main/audima.js` | [DOCTOR.md](DOCTOR.md), [SWAY_INTEGRATION.md](SWAY_INTEGRATION.md) |
| Main | DFU driver installation (Windows) | `src/main/driver-install.js` | [DOCTOR.md](DOCTOR.md) |
| Bridge | IPC surface | `src/preload/preload.js` | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Renderer | Screen flow, HUD, keyboard/mouse input, documentation viewer | `src/renderer/app.js` | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Renderer | Markdown rendering for the documentation viewer | `src/renderer/markdown.js` | [ARCHITECTURE.md](ARCHITECTURE.md) |
| Renderer | MIDI detection, routing, MIDI-learn | `src/renderer/midi/midi.js`, `src/renderer/midi/swaymap.js` | [MIDI.md](MIDI.md) |
| Renderer | Audio analysis | `src/renderer/engine/audio.js` | [AUDIO.md](AUDIO.md) |
| Renderer | Render pipeline, Auto-VJ | `src/renderer/engine/engine.js` | [ENGINE.md](ENGINE.md) |
| Renderer | Palette management | `src/renderer/engine/colormaster.js` | [ENGINE.md](ENGINE.md) |
| Renderer | Visual scenes | `src/renderer/engine/scenes/*.js` | [SCENE_CONTRACT.md](SCENE_CONTRACT.md) |
| Content | Bundled projects | `projects/*.json` | [PROJECTS.md](PROJECTS.md) |
| Content | Bundled documentation | `docs/*.md`, `README.md` | [INDEX.md](INDEX.md) |
| Build | Renderer bundling, icon generation, packaging | `scripts/`, `electron-builder.yml` | [BUILD.md](BUILD.md) |

## External interfaces

The application fetches from Audima's hosts only:

| Endpoint | When | Purpose |
|---|---|---|
| `https://cdn.audima.com.au/software/latest.json` | Doctor run (startup and re-run) | Reachability check; resolves the current Sway Software version and download URLs |
| Companion binary URL from the manifest, or pinned fallbacks | "Download from Audima" fix only | Fetches the Sway Software installer to the local Downloads folder; the minisign signature is verified before the installer is opened |
| `https://cdn.audima.com.au/software/Windows%20DFU%20Driver.zip` | "Install DFU driver" fix only (Windows) | Fetches Audima's official STM32 bootloader driver package |
| `https://audima.com.au/downloads/`, user-manual PDF | Fallback fix actions | Opened in the system browser |

All requests to Audima hosts carry the User-Agent `AKSWAYJ/0.1 (Sway companion; +https://github.com/akswayj)`; the CDN rejects generic tool User-Agents. Requests to any other host are refused by the download layer, and renderer navigation is disabled entirely. The application collects no telemetry and writes no data outside its own settings directory, the Downloads folder (user-initiated), and a driver cache under the settings directory.

Handing a link to the system browser is the second, user-initiated path outward. `shell.openExternal` accepts an `https` URL only when its hostname matches an entry in `EXTERNAL_ALLOW` in `src/main/main.js`, or is a subdomain of one: `audima.com.au`, `github.com`, `githubusercontent.com`, `nodejs.org`, `community.polyexpression.com`, `discord.com`, `vidvox.net`, `huggingface.co`, `unity.com`, `resolume.com`, `st3nd.com`, `serato.com`, `synesthesia.live`, `elektronauts.com`, `indiegogo.com`. The list covers the hosts cited by the bundled documentation, so links in the documentation viewer resolve without widening the policy to arbitrary URLs. A link outside the list is refused; the viewer then shows an inline notice naming the URL so the reader can open it manually.

## Data locations

| Item | Location |
|---|---|
| Settings (`settings.json`; holds `midiOverrides` when configured) | Electron `userData`: `%APPDATA%\AKSWAYJ` on Windows, `~/Library/Application Support/AKSWAYJ` on macOS, `~/.config/AKSWAYJ` on Linux |
| Downloaded Sway Software installer | The system Downloads folder |
| DFU driver package cache | `<userData>/audima/` |
| Documentation read by the viewer | `README.md` and `docs/*.md` at the package root; inside `resources/app.asar` in packaged builds |
| Installed application (Windows) | `%LOCALAPPDATA%\Programs\akswayj` |
