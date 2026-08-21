# SwayCommand

SwayCommand is a desktop application that renders real-time, audio-reactive visuals controlled by the Audima Labs Sway, a gesture-based MIDI controller. The application targets live performance: everything happens on one always-live cockpit page — stage, timeline, control deck, and instrument panels — it starts into a ready-to-play project, analyzes any audio input, and accepts control from the Sway, from any class-compliant MIDI controller, or from mouse and keyboard.

SwayCommand is an independent project. It is not affiliated with or endorsed by Audima Labs Pty Ltd. It never redistributes Audima binaries; optional Audima components are downloaded from Audima's official CDN at the user's request. See [Legal](#legal).

## Feature summary

- A single-page cockpit: the stage renders from boot to quit while the scene bank, transport, timeline, assignment panel, and drawers work on top of it — no screen switching, no interrupted frames.
- Sixteen procedural visual scenes, each driven by audio analysis and gesture input, rendered with three.js on WebGL2 — every shader GLSL3, no autonomous rotation anywhere.
- Projects as `.sway` files: one JSON document carrying palette, engine settings, effects snapshot, synth patch, linked media, kit, timeline, and every control assignment. Save, open, and recent files live in the project menu; ten bundled templates (three tuned to pair with Audima's official Ableton demo packs — Garage, DNB, Hip Hop) provide starting points.
- A timeline with an audio lane (waveform clips scheduled sample-accurately on the audio clock) and a visual lane (scene clips with per-clip cut or fade entry), plus loop region, locators, and scrubbing.
- An on-screen Sway deck — a line-art schematic of the hardware. Click any pad, knob, button, or gesture chip to assign it: pads fire samples, scene switches, or momentary effect punches; knobs drive any engine, rack, synth, or kit parameter with range and curve; buttons learn a hardware CC and toggle anything; the five gesture dimensions hold modulation routes. Touching a control on the hardware selects it on screen.
- Automated scene cycling with palette-synchronized crossfades (Auto-VJ), after the pattern established by Keijiro Takahashi's Akvj.
- A startup system check (the Doctor) that detects the Sway over USB, including firmware-update (DFU) mode, and offers one-click remediation for missing optional components.
- Factory-map support for the Sway, MIDI-learn for any continuous control, and per-control overrides persisted in settings and in the project; any class-compliant MIDI controller drives the same controls.
- Audio analysis from any input device or, on Windows, from system-audio loopback, with an internal fallback signal when no input exists.
- A built-in wavetable synth covering the ground Vital does, playable from the Sway, with seven factory presets and a modulation matrix.
- A sample kit on the deck's sixteen pads with one-shot, loop, and gate modes and choke groups; triggered samples, the synth, and timeline playback are all heard and drive the visuals.
- A 38-parameter effects rack (mirror, kaleidoscope, glitch, anaglyph, mosaic, color, trails, ASCII, and more) applied to the composited frame when enabled; driving any rack parameter from a knob switches the rack on.
- An in-application documentation viewer that renders the bundled Markdown documentation, including this file, without network access.
- Full offline operation. The application contains no telemetry. Its own network access is limited to Audima endpoints: a reachability check at startup and user-initiated downloads. Links the user follows are handed to the system browser, restricted to an allowlist of hosts.

## Requirements

| Platform | Minimum version | Package |
|---|---|---|
| Windows | 10 (x64) | NSIS installer (`SwayCommand-Setup-<version>.exe`) |
| macOS | 11 | DMG |
| Linux | glibc-based x64 distribution | AppImage |

A WebGL2-capable GPU is required. A Sway, other MIDI hardware, and an audio input are optional; the application substitutes mouse/keyboard control and an internal analysis signal when they are absent.

## Installation

Packaged builds install per-user and require no elevation. The Windows installer is a one-click NSIS package that launches the application when installation completes. Installation from source requires Node.js 18 or later; the repository includes double-click bootstrap scripts (`Install & Launch SwayCommand.bat` on Windows, `Install & Launch SwayCommand.command` on macOS, `install-launch.sh` on Linux) that install dependencies and start the application. Details, including silent installation and uninstallation: [docs/INSTALLATION.md](docs/INSTALLATION.md).

## Development

```sh
npm install
npm start            # build renderer bundle, launch Electron
npm run dist:win     # Windows installer
npm run dist:mac     # macOS DMG
npm run dist:linux   # Linux AppImage
```

Build-system details: [docs/BUILD.md](docs/BUILD.md). Environment variables and file locations: [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md).

## Controls

| Input | Effect |
|---|---|
| Hand position over the Sway (XY) | Continuous steering of the active scene; assignable to any parameter as modulation routes |
| Pulse / Press / Sway gestures | Pulse surges brightness; press compresses — each scene's own crush or dive; sway morphs the active scene's generative parameters (mode numbers, field strengths, warp velocity). Each dimension also holds any number of modulation routes |
| Knobs 1–8 | Assignable. Nothing by default: no knob drives an effect, the intensity, or anything else until you assign it, and clearing a control resets the effect it drove (the rack switches off again if a control had switched it on). Templates carry their own knob tables |
| Pads 0–15 | Assignable: sample, scene switch (cut or fade entry), or momentary effect punch — numbered 0–15 as the deck shows them (top rows first, left cluster then right, then the bottom rows). Every strike is also the active scene's morph event — a geometry advance, mode jump, or re-seed |
| Buttons 1–8 | Learned from the hardware, then toggle anything: rack, Auto-VJ, synth, transport |
| Wormhole scene | A pad strike toggles warp (stars streak with aberration and Doppler shift); sway sets the warp velocity; a press held deep (≥ 0.7 for 0.25 s) opens the wormhole — a ~4.2 s lensed transit that exits into a different sky |
| Mouse move / button / wheel on the stage | XY position / Press / Pulse when no Sway is bound |
| Click a control on the deck | Selects it in the assignment panel (touching it on the hardware does the same) |
| Panel grips / chips | Drag to resize the rails, timeline, deck, and input box; the corner chip collapses or expands a panel; double-click a grip resets it |
| `1`–`9` | Select a scene from the active project's pool (disables Auto-VJ) |
| `Space` | Crossfade to another scene from the project pool |
| `A` | Toggle Auto-VJ |
| `Z X C V B N M ,` | Pads 0–7 |
| `P` / `L` | Play or pause the timeline / toggle the loop |
| `Delete`, `←` `→` | Remove / nudge the selected timeline clip |
| `S` / `R` / `E` | Synth / rack / kit drawer |
| `F` | Toggle fullscreen |
| `O` | Solo view: hide the rails and bands, stage only |
| `H` | Controls modal (the SYSTEM check is reachable from it) |
| `K` | MIDI monitor (`M` is a pad key) |
| `D` | Documentation |
| `A W S E D F T G Y H U J K O L P ;` | Play the synth — only while the synth drawer is open |
| `Esc` | Close the topmost layer: popover, drawer, modal, then selection |

## Documentation

The documentation viewer inside the application renders this file and every document below from the copies bundled with the build, so the text always matches the installed version. The `D` key, or the DOCS button in the top bar, opens it.

| Document | Scope |
|---|---|
| [docs/INDEX.md](docs/INDEX.md) | Documentation map and reading order |
| [docs/OVERVIEW.md](docs/OVERVIEW.md) | System overview, the cockpit, terminology, component map |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Process model, module inventory, IPC surface, security model |
| [docs/INSTALLATION.md](docs/INSTALLATION.md) | Packaged and from-source installation, uninstallation |
| [docs/DOCTOR.md](docs/DOCTOR.md) | Every system check, detection method, and fix action |
| [docs/SYNTH.md](docs/SYNTH.md) | The built-in wavetable synth, its capability against Vital, and theDAW alignment |
| [docs/STUDIO.md](docs/STUDIO.md) | The drawers (synth, rack, kit), the sample pool, and control assignments |
| [docs/MIDI.md](docs/MIDI.md) | Device detection, factory map, MIDI-learn, the assignment router |
| [docs/AUDIO.md](docs/AUDIO.md) | Analysis chain, signal sources, beat detection, the timeline transport |
| [docs/ENGINE.md](docs/ENGINE.md) | Render pipeline, crossfade compositor, effects rack, Auto-VJ, ColorMaster |
| [docs/PROJECTS.md](docs/PROJECTS.md) | The `.sway` project format, templates, and the timeline model |
| [docs/SCENE_CONTRACT.md](docs/SCENE_CONTRACT.md) | Scene module interface and authoring rules |
| [docs/SWAY_INTEGRATION.md](docs/SWAY_INTEGRATION.md) | Sway USB identity, MIDI map, driver matrix, CDN interface |
| [docs/BUILD.md](docs/BUILD.md) | Build scripts, packaging, release artifacts |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | Environment variables, settings file, network endpoints |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Known issues and resolutions |
| [docs/RESEARCH.md](docs/RESEARCH.md) | Source research record with citations |

## Credits

SwayCommand draws on three prior projects: [theDAW](https://github.com/gantasmo/theDAW) by GANTASMO (MIT) for the web-native VJ-engine approach and local-first design; [Akvj](https://github.com/keijiro/Akvj) and [MetavidoVFX](https://github.com/keijiro/MetavidoVFX) by Keijiro Takahashi (Unlicense) for the VfxController crossfade-cycling pattern, ColorMaster palette synchronization, and the runtime effect-switcher architecture, reimplemented here in three.js.

## Legal

SwayCommand is released under the MIT license. "Sway" and "Audima Labs" are the property of Audima Labs Pty Ltd. In accordance with Audima's terms and conditions, the application does not bundle or redistribute Audima software; the Doctor downloads Audima's official driver package and companion application directly from `cdn.audima.com.au` onto the local machine, and verifies the companion application against Audima's published minisign signature before opening the installer.
