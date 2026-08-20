# Projects

A project is a JSON preset that selects a scene pool, a five-color palette, and Auto-VJ parameters (terminology: [OVERVIEW.md](OVERVIEW.md)). Project files live in the `projects/` directory at the repository root. The application ships eight; the project picker lists them in the order defined by [`projects/index.json`](../projects/index.json).

## File format

Each project is one file, `projects/<id>.json`. Example ([`garage-neon.json`](../projects/garage-neon.json)):

```json
{
  "id": "garage-neon",
  "name": "Garage Neon",
  "description": "…",
  "pairsWith": "Audima Ableton Garage demo pack",
  "vibe": "club",
  "bpmHint": 132,
  "palette": ["#ff2d95", "#7a0bc0", "#2de1fc", "#ff6b35", "#f9f871"],
  "scenes": ["ribbons", "beams", "swarm"],
  "autoVJ": { "enabled": true, "minHold": 16, "maxHold": 32, "fadeTime": 3 },
  "start": { "scene": "ribbons" }
}
```

| Field | Type | Consumed by | Semantics |
|---|---|---|---|
| `id` | string | picker, loader | Stable identifier. Matches the filename stem and the entry in `index.json`. |
| `name` | string | picker | Display name on the project card. |
| `description` | string | picker | Card body text. |
| `pairsWith` | string \| null | picker | Name of the Audima Ableton demo pack the project is tuned for, or `null`. A non-null value produces the pairing badge. |
| `vibe` | string | picker | One-word mood, shown as a badge. Not read by the engine. |
| `bpmHint` | number | picker | Tempo of the paired material in BPM. `0` means no stated tempo and suppresses the BPM badge. Not read by the engine or the audio module. |
| `palette` | string[5] | engine | Exactly five hex color strings, loaded into ColorMaster on project start with a 2-second crossfade. ColorMaster stores five colors; a shorter array wraps (`hexes[i % hexes.length]`). |
| `scenes` | string[] | engine | The Auto-VJ pool. Each entry is a scene id from the registry (`src/renderer/engine/scenes/index.js`); ids not present in the registry are filtered out on load. See [SCENE_CONTRACT.md](SCENE_CONTRACT.md). |
| `autoVJ` | object | engine | Scheduler parameters; see below. |
| `start` | object | engine | `{ "scene": "<id>" }` — the first scene. When absent, the engine falls back to the first entry of the filtered pool. The engine fades the start scene in over 0.8 seconds. |

### The autoVJ block

| Field | Type | Default when field absent | Semantics |
|---|---|---|---|
| `enabled` | boolean | `false` (see below) | Whether the Auto-VJ scheduler runs. |
| `minHold` | number (s) | 18 | Minimum hold before an automatic scene change. |
| `maxHold` | number (s) | 40 | Maximum hold. The engine draws a uniformly random hold in `[minHold, maxHold]`. |
| `fadeTime` | number (s) | 4 | Crossfade length for automatic changes. |

The defaults 18 / 40 / 4 apply per missing field (`??` fallbacks in `loadProject`). The `enabled` flag behaves differently: when the entire `autoVJ` block is absent, Auto-VJ is enabled; when the block is present, `enabled` is coerced with `!!`, so a block that omits `enabled` disables the scheduler. On load, the remaining hold time is reset to `minHold`; because the hold countdown pauses during crossfades, the first automatic change occurs `minHold` seconds after the 0.8-second start fade completes.

During performance, knob 1 (zero-based; the engine-reserved fade-time knob) rescales `fadeTime` continuously to the range 1–8 seconds, overriding the stored value. Auto-VJ pauses while the pool holds fewer than two scenes and while a crossfade is in progress.

### Runtime interaction

Project values set the starting state; several controls modify it during performance:

| Control | Effect on project state |
|---|---|
| `Space` | Crossfades to a random pool scene other than the current one, over 2.5 seconds (engine `nextScene` default). |
| `1`–`8` | Direct scene selection; disables Auto-VJ. |
| `A` | Toggles Auto-VJ on or off. |
| Knob 0 | Rotates the hue of the project palette live, 0–1 mapped to 0–360°; the default value 0.5 applies no rotation. |
| Knob 1 | Rescales the Auto-VJ crossfade length to 1–8 seconds. |

Keys `1`–`8` select from the full eight-scene registry regardless of the project's pool; `Space` and Auto-VJ draw only from the pool. `Esc` with no overlay open returns to the project picker.

Palette changes are never hard cuts: ColorMaster blends from the previous palette to the new one with a smoothstep curve over the requested fade time (2 seconds on project load).

## Load sequence

[`projects/index.json`](../projects/index.json) contains a single `order` array of project ids, currently `first-flight`, `hyperspace`, `chrysanthemum`, `beam-sixteen`, `garage-neon`, `dnb-tunnel`, `hiphop-voxels`, `nebula-drift`. `listProjects()` in [`src/main/main.js`](../src/main/main.js) reads it, then parses `projects/<id>.json` for each entry in order. A file that is missing or fails to parse is logged to the main-process console (`[projects] failed to load <id>`) and dropped; the remaining projects load normally. An id in a project file is not cross-checked against the filename.

The renderer requests the parsed list over the `projects:list` IPC channel (`ipcMain.handle('projects:list', …)`). The main process resolves the directory relative to its own module path, so the files are read from the package root in development and from inside `resources/app.asar` in packaged builds.

The loader performs no schema validation: a file that parses as JSON is delivered to the renderer as-is, and missing or mistyped fields surface at the point of use in the picker or the engine. For automated testing, the main process forwards the environment variables `AKSWAYJ_AUTOPLAY` and `AKSWAYJ_SCENE` to the renderer as URL query parameters.

Selecting a project calls the engine's `loadProject()` ([`src/renderer/engine/engine.js`](../src/renderer/engine/engine.js)), which applies the palette, filters the scene pool, configures Auto-VJ, and crossfades to the start scene.

## Bundled projects

The eight projects, in `index.json` order:

| Id | Name | Scene pool | Start | Auto-VJ | Hold (s) | Fade (s) | BPM hint | Pairs with |
|---|---|---|---|---|---|---|---|---|
| `first-flight` | First Flight | beams, swarm, ribbons, voxels, warp, nebula, mandelbulb, cymatic | beams | on | 20–45 | 5 | — | — |
| `hyperspace` | Hyperspace | warp, mandelbulb, swarm, cymatic | warp | on | 22–46 | 3 | — | — |
| `chrysanthemum` | Chrysanthemum | mandelbulb, cymatic, nebula, warp | mandelbulb | on | 26–52 | 6 | — | — |
| `beam-sixteen` | Beam Sixteen | beams, nebula | beams | off | 30–60 | 6 | — | — |
| `garage-neon` | Garage Neon | ribbons, beams, swarm | ribbons | on | 16–32 | 3 | 132 | Audima Ableton Garage demo pack |
| `dnb-tunnel` | DNB Tunnel | warp, swarm, mandelbulb, beams | warp | on | 12–24 | 2 | 174 | Audima Ableton DNB demo pack |
| `hiphop-voxels` | Hip Hop Voxels | voxels, ribbons, nebula | voxels | on | 24–48 | 5 | 88 | Audima Ableton Hip Hop demo pack |
| `nebula-drift` | Nebula Drift | nebula, cymatic, swarm | nebula | on | 40–80 | 10 | — | — |

`first-flight` is the only project whose pool holds the whole registry. `beam-sixteen` stores hold and fade values but ships with the scheduler disabled; the values take effect if the user toggles Auto-VJ on (`A` key).

| Id | Vibe | Palette |
|---|---|---|
| `first-flight` | welcoming | `#ff2d95` `#7a0bc0` `#2de1fc` `#f9f871` `#ff6b35` |
| `hyperspace` | transluminal | `#ffffff` `#9bf6ff` `#4361ee` `#7209b7` `#f72585` |
| `chrysanthemum` | hyperreal | `#39ff14` `#ff10f0` `#00fff7` `#ffea00` `#ff5400` |
| `beam-sixteen` | anthemic | `#dbe9ff` `#9fc5ff` `#5e8fce` `#2de1fc` `#f4f9ff` |
| `garage-neon` | club | `#ff2d95` `#7a0bc0` `#2de1fc` `#ff6b35` `#f9f871` |
| `dnb-tunnel` | relentless | `#39ff14` `#0affef` `#ff3131` `#cfff04` `#7df9ff` |
| `hiphop-voxels` | heavyweight | `#ffb300` `#ff6f00` `#8d5524` `#fff3c4` `#e63946` |
| `nebula-drift` | ambient | `#0f4c5c` `#5bc0be` `#9bf6ff` `#3a506b` `#e0fbfc` |

Project palettes are passed to ColorMaster as literal hex arrays; ColorMaster records any array-sourced palette under the name `custom`, independent of overlap with its registered named palettes. The `hyperspace` and `chrysanthemum` project palettes repeat the hex values of the ColorMaster palettes of the same name ([ENGINE.md](ENGINE.md#colormaster)) and are still recorded as `custom`.

## Display semantics

The picker code in [`src/renderer/app.js`](../src/renderer/app.js) draws one card per project, in `index.json` order. Each card shows:

| Element | Source | Condition |
|---|---|---|
| Palette swatches | one swatch per `palette` entry | always |
| Title | `name` | always |
| Vibe badge | `vibe` | always |
| BPM badge (`<n> BPM`) | `bpmHint` | only when `bpmHint` is nonzero |
| Pairing badge (`pairs with Audima demo`) | `pairsWith` | only when `pairsWith` is non-null; the full pack name appears in the badge's `title` attribute (hover tooltip) |
| Body text | `description` | always |

Swatch colors are assigned through the CSSOM after the cards render, because the page Content-Security-Policy blocks inline `style` attributes in markup.

## New projects

1. Create `projects/<id>.json` with the fields in the table above. Set `id` to the filename stem. Use scene ids that exist in `src/renderer/engine/scenes/index.js`.
2. Add the id to the `order` array in `projects/index.json`.
3. Restart the application (`npm start`). For packaged builds, rebuild the package (`npm run dist:win`, `dist:mac`, or `dist:linux`) — packaged builds read project files from the asar archive, not from disk.

A malformed file is skipped with a console error and the remaining projects still appear; a scene id absent from the registry is dropped from the pool without an error. A project whose pool filters down to fewer than two scenes still plays, but Auto-VJ has nothing to cycle to and holds the current scene indefinitely.
