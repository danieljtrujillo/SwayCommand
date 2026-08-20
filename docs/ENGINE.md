# Render engine

`src/renderer/engine/engine.js` exports `createEngine({ canvas, quality })`. The engine owns the WebGL renderer, the scene instance cache, the crossfade compositor, the Auto-VJ scheduler, the ColorMaster palette, and the per-frame `io` object that every scene reads ([SCENE_CONTRACT.md](SCENE_CONTRACT.md)). The audio engine attaches through `attachAudio` ([AUDIO.md](AUDIO.md)); the control state — the normalized input snapshot defined in [OVERVIEW.md](OVERVIEW.md#terminology) — attaches through `attachControl`.

## Pipeline

Renderer configuration:

| Setting | Value |
|---|---|
| `antialias` | `true` |
| `powerPreference` | `'high-performance'` |
| Pixel ratio | `min(window.devicePixelRatio, 1.75)` |
| `autoClear` | `true` |

Two offscreen render targets, A and B (depth buffer enabled, no stencil), hold the active and the incoming scene. Their initial size is the canvas layout size, with a 1280 × 720 fallback when the canvas has no layout size yet. `resize()` — also bound to the window `resize` event — sets the renderer size to the layout size and the render targets to the drawing-buffer size (layout size × pixel ratio), and notifies every cached scene instance; a call while the canvas has a zero layout dimension is ignored.

The frame loop runs on `requestAnimationFrame` with `dt` clamped to 0.05 s. Per frame, in order:

1. Frame statistics accumulate (see [Stats](#stats)).
2. The audio engine's `update(dt)` runs and its state is copied into `io`.
3. The control state is merged into `io` (smoothing and decay rules in [io assembly](#io-assembly)).
4. The reserved knobs are applied and ColorMaster updates.
5. The Auto-VJ scheduler ticks.
6. Fade progress advances: `mix += dt / fadeTime`; at `mix ≥ 1` the incoming scene becomes the active scene and the fade ends.
7. The active scene's `update(dt, t, io)` runs and the scene renders into target A, cleared to opaque black. While a fade is in progress, the incoming scene updates and renders into target B the same way.
8. The composite pass draws to the canvas.

The composite pass is a fullscreen quad under an orthographic camera, drawn with a `ShaderMaterial` (depth test and depth write disabled) whose uniforms are `tA`, `tB`, `uMix`, `uMaster`, and `uFlash`:

| Stage | Formula |
|---|---|
| Equal-power crossfade | with `a = cos(uMix · π/2)` and `b = sin(uMix · π/2)`: `col = tA · a² + tB · b²` |
| Beat flash headroom | `col × (1 + uFlash × 0.25)`; `uFlash` is set to `io.beat` each frame |
| Tone curve | `col / (1 + 0.35 · col)` |
| Vignette | `col × smoothstep(1.35, 0.45, length(vUv − 0.5) × 1.6)` |

`uMix` carries the fade progress while a fade runs and 0 otherwise. `uMaster` is set to 1 every frame; master intensity reaches scenes through `io.intensity`, not through the compositor.

## Scene management

`scenes/index.js` imports the eight scene modules in registry order — `beams`, `swarm`, `ribbons`, `voxels`, `warp`, `nebula`, `mandelbulb`, `cymatic` — and derives two exports: `sceneList`, the array of each module's `meta`, and `creators`, a map from scene id to its `createScene` function. That order also fixes the `1`–`8` keyboard scene selection on the perform screen, which indexes `sceneList` directly.

Scene instances are created on demand at first use and cached in a map for the rest of the session; the engine never disposes them. Creation receives the context `{ THREE, renderer, width, height, quality }` defined in [SCENE_CONTRACT.md](SCENE_CONTRACT.md). Requesting an unregistered id throws `Unknown scene: <id>`.

All scene switches pass through the internal `crossfadeTo(id, seconds)`, reached via `setScene`, `nextScene`, `loadProject`, and the Auto-VJ scheduler:

- A request for the already-active scene while no fade is running is ignored.
- A request during a fade settles the current fade instantly: the dominant slot — the incoming scene when `mix > 0.5`, otherwise the outgoing one — becomes the active scene, `mix` resets to 0, and the new fade begins from there.
- The duration is clamped to a minimum of 0.1 s.

## Auto-VJ

The `autoVJ` record is exposed on the engine object:

| Field | Default | Meaning |
|---|---|---|
| `enabled` | `true` | Scheduler on/off |
| `pool` | all registered scene ids | Candidate scenes |
| `minHold` | 18 s | Lower hold-interval bound |
| `maxHold` | 40 s | Upper hold-interval bound |
| `fadeTime` | 4 s | Crossfade duration (recomputed from knob 1 every frame; see [Reserved knobs](#reserved-knobs)) |
| `holdLeft` | 8 s at engine creation; `minHold` after `loadProject` | Countdown to the next switch |

The tick is skipped while the scheduler is disabled, while a fade is in progress, or when the pool holds fewer than two scenes. Otherwise `holdLeft` decreases by `dt`; when it reaches 0, the next scene is drawn uniformly at random from the pool excluding the current scene, a crossfade of `fadeTime` seconds starts, and `holdLeft` re-arms to a uniform random value in [`minHold`, `maxHold`].

Within the engine, only `loadProject` writes `enabled`; `setScene` does not. The application layer clears the flag on direct scene selection (keys `1`–`8`) and toggles it with `A` ([README](../README.md#controls)).

## io assembly

`io` is assembled once per frame and handed to every scene's `update`:

| Field | Initial | Source | Per-frame handling |
|---|---|---|---|
| `level` | 0 | audio `state.level` | Copied |
| `bands.bass` / `.mid` / `.high` | 0 | audio `state.bands` | Copied |
| `beat` | 0 | audio `state.beat` | Copied |
| `xy.x`, `xy.y` | 0.5 | control state | One-pole smoothing, `k = 1 − e^(−14 · dt)` |
| `gestures.pulse` / `.press` / `.sway` | 0 | control state | Copied |
| `knobs[0..7]` | 0.5 | control state | Copied |
| `pads[0..15]` | 0 | control state | `max(previous × e^(−5 · dt), hit)`; the control-state slot is zeroed after consumption |
| `lastPad` | −1 | control state | Copied |
| `palette` | ColorMaster output array | ColorMaster | The same five `THREE.Color` instances every frame |
| `intensity` | 1 | computed | `0.25 + 0.75 × knobs[2] + 0.35 × gestures.pulse` |

Pad handling divides ownership between the two layers: the control state records a hit as a velocity, the engine consumes it — reads the value, then zeroes the control-state slot — and thereafter owns the decay, multiplying its own copy by `e^(−5 · dt)` each frame. A new hit replaces the decayed value only when it is larger.

Both attachments are optional. Without an audio engine the audio-derived fields keep their initial values; without a control state the input-derived fields keep theirs.

## Reserved knobs

Knobs 0–2 are consumed by the engine every frame; scenes key their own parameters off knobs 3–7 ([SCENE_CONTRACT.md](SCENE_CONTRACT.md)).

| Knob | Function | Mapping |
|---|---|---|
| 0 | Palette hue rotation | The knob value is passed to ColorMaster as a 0..1 fraction of a full 360° rotation; the exact value 0.5 — the resting default — passes 0, meaning no rotation |
| 1 | Auto-VJ fade time | `1 + 7 × value`, giving 1–8 s |
| 2 | Master intensity | `0.25 + 0.75 × value`, giving a 0.25–1.0 base, plus `0.35 × gestures.pulse` |

These assignments run unconditionally every frame. Knob 1 therefore overwrites the `fadeTime` loaded from the project once the render loop is running; at the knob default of 0.5 the effective fade time is 4.5 s. The knob 0 mapping is discontinuous around its neutral point: 0.5 exactly disables rotation, while neighboring values map proportionally (ColorMaster additionally ignores shift values of 0.003 or less).

## ColorMaster

`src/renderer/engine/colormaster.js` maintains the global five-color palette that every scene reads each frame. The ten built-in palettes, in declaration order:

| Name | Colors |
|---|---|
| `neon-garage` | `#ff2d95` `#7a0bc0` `#2de1fc` `#f9f871` `#ff6b35` |
| `dnb-acid` | `#39ff14` `#0affef` `#ff3131` `#cfff04` `#7df9ff` |
| `hiphop-gold` | `#ffb300` `#ff6f00` `#8d5524` `#fff3c4` `#e63946` |
| `ambient-teal` | `#0f4c5c` `#5bc0be` `#9bf6ff` `#3a506b` `#e0fbfc` |
| `mono-ice` | `#dbe9ff` `#9fc5ff` `#5e8fce` `#2e4a7d` `#f4f9ff` |
| `sunset-vhs` | `#ff5f6d` `#ffc371` `#a83279` `#3c1053` `#ffd9e8` |
| `deep-space` | `#4d1bff` `#00c2ff` `#ff2fb9` `#08f7fe` `#ffe66d` |
| `dmt-jewel` | `#ff006e` `#fb5607` `#ffbe0b` `#8338ec` `#3a86ff` |
| `hyperspace` | `#ffffff` `#9bf6ff` `#4361ee` `#7209b7` `#f72585` |
| `chrysanthemum` | `#39ff14` `#ff10f0` `#00fff7` `#ffea00` `#ff5400` |

The last four are the deep-space and hyperreal sets added for the fractal, wormhole, and orb scenes. The initial palette is `neon-garage`; an unrecognized initial name falls back to it.

`setPalette(nameOrHexes, fadeSeconds = 1.5)` accepts a registered palette name or an array of five hex strings; a shorter array repeats cyclically to fill the five slots, and an array palette reports the name `custom`. An unrecognized name is ignored. The blend runs over `fadeSeconds` (minimum 0.01 s) with smoothstep easing, `k = b² (3 − 2b)`, interpolating each of the five colors from its value at the moment of the call to its target.

`update(dt, hueShift)` advances the blend and writes the result into a fixed output array of five `THREE.Color` instances — the array exposed as `palette` and delivered to scenes as `io.palette`. When `hueShift` exceeds 0.003, each output color is rotated in HSL space by `hueShift × 360°` on top of the base palette. Scenes receive the same five instances every frame and copy values from them; mutating the array or the colors is prohibited by [SCENE_CONTRACT.md](SCENE_CONTRACT.md).

## Quality tiers

| Tier | Particle budget |
|---|---|
| `low` | 8,000 |
| `med` | 30,000 |
| `high` | 80,000 |

The current default is `med`; an unrecognized tier string also resolves to `med`. The selected tier reaches every scene at creation as `ctx.quality = { tier, particles }`, and scenes scale their instance counts from `particles`.

## Stats

The `stats` record holds `{ fps, frames, acc }`. Frame times and counts accumulate; each time the accumulator reaches 0.5 s, `fps` is recomputed as the frame count divided by the accumulated time, rounded to the nearest integer, and the window resets.

## Public interface

`createEngine` returns:

| Member | Description |
|---|---|
| `sceneList` | Scene metadata array from the registry |
| `stats` | Frame-rate counter (above) |
| `io` | Per-frame scene input (above) |
| `colorMaster` | The palette instance (above) |
| `autoVJ` | The scheduler record (above) |
| `attachAudio(engine)` | Connects the audio engine ([AUDIO.md](AUDIO.md)) |
| `attachControl(c)` | Connects the control state |
| `loadProject(project)` | Applies a project preset (below) |
| `setScene(id, seconds = 2.5)` | Crossfades to a registered scene; unregistered ids are ignored |
| `nextScene(seconds = 2.5)` | Crossfades to a random pool scene other than the current one |
| `currentScene` | Getter; the incoming scene's metadata once a fade passes `mix > 0.5`, otherwise the active scene's |
| `start()` | Begins the frame loop; no-op while running |
| `stop()` | Halts the frame loop |
| `resize()` | Recomputes canvas, render-target, and scene sizes |

`loadProject(project)` applies `project.palette` through ColorMaster with a 2 s blend, sets the Auto-VJ pool to `project.scenes` filtered to registered ids, and reads the scheduler configuration with these defaults:

| Project field | Default when absent |
|---|---|
| `autoVJ.enabled` | `true` when the whole `autoVJ` block is absent; `false` when the block is present without the field |
| `autoVJ.minHold` | 18 s |
| `autoVJ.maxHold` | 40 s |
| `autoVJ.fadeTime` | 4 s |
| `start.scene` | the first pool entry |

`holdLeft` resets to `minHold`, any fade in progress is cleared, and the start scene fades in over 0.8 s.
