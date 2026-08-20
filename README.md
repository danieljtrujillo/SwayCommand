# AKSWAYJ

AKSWAYJ is a desktop application that renders real-time, audio-reactive visuals controlled by the Audima Labs Sway, a gesture-based MIDI controller. The application targets live performance: it starts into a ready-to-play project, analyzes any audio input, and accepts control from the Sway, from any class-compliant MIDI controller, or from mouse and keyboard.

AKSWAYJ is an independent project. It is not affiliated with or endorsed by Audima Labs Pty Ltd. It never redistributes Audima binaries; optional Audima components are downloaded from Audima's official CDN at the user's request. See [Legal](#legal).

## Feature summary

- Fourteen procedural visual scenes, each driven by audio analysis and gesture input, rendered with three.js on WebGL2.
- Eight preconfigured projects. Three are tuned to pair with Audima's official Ableton demo packs (Garage, DNB, Hip Hop).
- Automated scene cycling with palette-synchronized crossfades (Auto-VJ), after the pattern established by Keijiro Takahashi's Akvj.
- A startup system check (the Doctor) that detects the Sway over USB, including firmware-update (DFU) mode, and offers one-click remediation for missing optional components.
- Factory-map support for the Sway, with per-control overrides applied from the settings file; any class-compliant MIDI controller drives the same controls.
- An in-application documentation viewer that renders the bundled Markdown documentation, including this file, without network access.
- Audio analysis from any input device or, on Windows, from system-audio loopback, with an internal fallback signal when no input exists.
- A built-in wavetable synth covering the ground Vital does, playable from the Sway, with seven factory presets and a modulation matrix.
- A kit builder that maps stems and one-shots onto the Sway's sixteen pads; triggered samples are heard and also drive the visuals.
- Full offline operation. The application contains no telemetry. Its own network access is limited to Audima endpoints: a reachability check at startup and user-initiated downloads. Links the user follows are handed to the system browser, restricted to an allowlist of hosts.

## Requirements

| Platform | Minimum version | Package |
|---|---|---|
| Windows | 10 (x64) | NSIS installer (`AKSWAYJ-Setup-<version>.exe`) |
| macOS | 11 | DMG |
| Linux | glibc-based x64 distribution | AppImage |

A WebGL2-capable GPU is required. A Sway, other MIDI hardware, and an audio input are optional; the application substitutes mouse/keyboard control and an internal analysis signal when they are absent.

## Installation

Packaged builds install per-user and require no elevation. The Windows installer is a one-click NSIS package that launches the application when installation completes. Installation from source requires Node.js 18 or later; the repository includes double-click bootstrap scripts (`Install & Launch AKSWAYJ.bat` on Windows, `Install & Launch AKSWAYJ.command` on macOS, `install-launch.sh` on Linux) that install dependencies and start the application. Details, including silent installation and uninstallation: [docs/INSTALLATION.md](docs/INSTALLATION.md).

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
| Hand position over the Sway (XY) | Continuous steering of the active scene |
| Pulse / Press / Sway gestures | Brightness surge / compression / camera lean |
| Knobs 1–3 | Palette hue rotation, crossfade length, master intensity (reserved by the engine) |
| Knobs 4–8 | Scene-specific parameters |
| Pads 1–16 | Discrete scene events (beam bursts, grid ripples, ribbon jumps) |
| Pad strike, or a sharp Press, in the Wormhole scene | Fires the hyperspace jump: charge, launch, cruise, and settle segments, 2.07 seconds in total |
| Mouse move / button / wheel | XY position / Press / Pulse when no Sway is bound |
| `1`–`9` | Select a scene from the active project’s pool (disables Auto-VJ) |
| `Space` | Crossfade to another scene from the project pool |
| `A` | Toggle Auto-VJ |
| `Z X C V B N M ,` | Pads 1–8 |
| `F` | Toggle fullscreen |
| `H` | Help overlay |
| `K` | MIDI monitor (`M` is a pad key) |
| `S` | Studio: audio source, kit builder, synth, effects rack |
| `D` | Documentation viewer |
| `Esc` | Close an overlay, leave the documentation viewer, or step back one screen |

## Documentation

The documentation viewer inside the application renders this file and every document below from the copies bundled with the build, so the text always matches the installed version. The `D` key, or the Documentation button on the Doctor and project-picker screens, opens it.

| Document | Scope |
|---|---|
| [docs/INDEX.md](docs/INDEX.md) | Documentation map and reading order |
| [docs/OVERVIEW.md](docs/OVERVIEW.md) | System overview, terminology, component map |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Process model, module inventory, IPC surface, security model |
| [docs/INSTALLATION.md](docs/INSTALLATION.md) | Packaged and from-source installation, uninstallation |
| [docs/DOCTOR.md](docs/DOCTOR.md) | Every system check, detection method, and fix action |
| [docs/SYNTH.md](docs/SYNTH.md) | The built-in wavetable synth, its capability against Vital, and theDAW alignment |
| [docs/STUDIO.md](docs/STUDIO.md) | Audio source selection (including system-audio loopback) and the pad kit builder |
| [docs/MIDI.md](docs/MIDI.md) | Device detection, factory map, MIDI-learn, message routing |
| [docs/AUDIO.md](docs/AUDIO.md) | Analysis chain, band definitions, beat detection, internal groove |
| [docs/ENGINE.md](docs/ENGINE.md) | Render pipeline, crossfade compositor, Auto-VJ, ColorMaster |
| [docs/PROJECTS.md](docs/PROJECTS.md) | Project file format and the bundled projects |
| [docs/SCENE_CONTRACT.md](docs/SCENE_CONTRACT.md) | Scene module interface and authoring rules |
| [docs/SWAY_INTEGRATION.md](docs/SWAY_INTEGRATION.md) | Sway USB identity, MIDI map, driver matrix, CDN interface |
| [docs/BUILD.md](docs/BUILD.md) | Build scripts, packaging, release artifacts |
| [docs/ENVIRONMENT.md](docs/ENVIRONMENT.md) | Environment variables, settings file, network endpoints |
| [docs/TROUBLESHOOTING.md](docs/TROUBLESHOOTING.md) | Known issues and resolutions |
| [docs/RESEARCH.md](docs/RESEARCH.md) | Source research record with citations |

## Credits

AKSWAYJ draws on three prior projects: [theDAW](https://github.com/gantasmo/theDAW) by GANTASMO (MIT) for the web-native VJ-engine approach and local-first design; [Akvj](https://github.com/keijiro/Akvj) and [MetavidoVFX](https://github.com/keijiro/MetavidoVFX) by Keijiro Takahashi (Unlicense) for the VfxController crossfade-cycling pattern, ColorMaster palette synchronization, and the runtime effect-switcher architecture, reimplemented here in three.js.

## Legal

AKSWAYJ is released under the MIT license. "Sway" and "Audima Labs" are the property of Audima Labs Pty Ltd. In accordance with Audima's terms and conditions, the application does not bundle or redistribute Audima software; the Doctor downloads Audima's official driver package and companion application directly from `cdn.audima.com.au` onto the local machine, and verifies the companion application against Audima's published minisign signature before opening the installer.
