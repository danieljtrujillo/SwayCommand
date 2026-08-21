# Render engine

`src/renderer/engine/engine.js` exports `createEngine({ canvas, quality })`. The engine owns the WebGL renderer, the scene instance cache, the crossfade compositor, the effects rack, the Auto-VJ scheduler, the ColorMaster palette, and the per-frame `io` object that every scene reads ([SCENE_CONTRACT.md](SCENE_CONTRACT.md)). The audio engine attaches through `attachAudio` ([AUDIO.md](AUDIO.md)); the control state — the normalized input snapshot defined in [OVERVIEW.md](OVERVIEW.md#terminology) — attaches through `attachControl`; the assignment router attaches through `setFrameHook` ([MIDI.md](MIDI.md)).

## Pipeline

Renderer configuration:

| Setting | Value |
|---|---|
| `antialias` | `true` |
| `powerPreference` | `'high-performance'` |
| Pixel ratio | `min(window.devicePixelRatio, 1.75)` |
| `autoClear` | `true` |

Two half-float offscreen render targets, A and B (depth buffer enabled, no stencil), hold the active and the incoming scene in HDR — additive shader output past 1.0 survives for the bloom pass; a third, `rtComp`, receives the composite whenever bloom or the effects rack needs a texture to work from. The engine also generates a PMREM room environment once at startup and hands it to scenes through `ctx.environment` (the reflection source for the chrome ports). Their initial size is the canvas layout size, with a 1280 × 720 fallback when the canvas has no layout size yet. `resize()` sets the renderer size to the layout size and the render targets (and the rack) to the drawing-buffer size (layout size × pixel ratio), and notifies every cached scene instance; a call while the canvas has a zero layout dimension is ignored. Two triggers exist: a `ResizeObserver` on the stage canvas — the one that actually fires, since the stage lives in a grid cell whose box changes when a drawer opens or solo view toggles — and a window `resize` listener as a backstop.

The frame loop runs on `requestAnimationFrame` with `dt` clamped to 0.05 s. Per frame, in order:

1. Frame statistics accumulate (see [Stats](#stats)).
2. The audio engine's `update(dt)` runs and its state is copied into `io`.
3. The control state is merged into `io` (smoothing and decay rules in [io assembly](#io-assembly)).
4. The frame hook runs — the router's slot: transport update, knob and gesture dispatch, held punches ([MIDI.md](MIDI.md#the-assignment-router)).
5. ColorMaster updates with `params.hue`, and `io.intensity` is computed from `params.intensity`.
6. If the warm queue holds scenes, one is instantiated and shader-compiled (see [Prewarm](#prewarm)).
7. The Auto-VJ scheduler ticks.
8. Fade progress advances: `mix += dt / fadeTime`; at `mix ≥ 1` the incoming scene becomes the active scene and the fade ends.
9. The active scene's `update(dt, t, io)` runs and the scene renders into target A, cleared to opaque black. While a fade is in progress, the incoming scene updates and renders into target B the same way.
10. The composite pass draws — directly to the canvas while bloom and the rack are both idle, or into `rtComp`, where a per-scene UnrealBloom pass adds its glow (strength crossfaded with the scene mix; parameters from `meta.bloom` or the instance's live `bloom` object — [SCENE_CONTRACT.md](SCENE_CONTRACT.md#bloom)) before the rack's passes or a plain copy to the canvas.

The composite pass is a fullscreen quad under an orthographic camera, drawn with a `ShaderMaterial` (depth test and depth write disabled) whose uniforms are `tA`, `tB`, `uMix`, `uMaster`, and `uFlash`:

| Stage | Formula |
|---|---|
| Equal-power crossfade | with `a = cos(uMix · π/2)` and `b = sin(uMix · π/2)`: `col = tA · a² + tB · b²` |
| Beat flash headroom | `col × (1 + uFlash × 0.25)`; `uFlash` is set to `io.beat` each frame |
| Tone curve | `col / (1 + 0.35 · col)` |
| Vignette | `col × smoothstep(1.35, 0.45, length(vUv − 0.5) × 1.6)` |

`uMix` carries the fade progress while a fade runs and 0 otherwise. `uMaster` is set to 1 every frame; master intensity reaches scenes through `io.intensity`, not through the compositor.

## Effects rack

`src/renderer/engine/fxrack.js` implements the post chain: 38 parameters in five decks (Geometrics, Corruption, Chromatics, Timecode, ASCII). It exports two tables the interface layers build from — `RANGES`, the per-key clamp specification (`true` for booleans, `'hex'` for the color input, `[min, max]` for numbers), and `DECKS`, the deck grouping; every `RANGES` key appears in exactly one deck, so the RACK drawer and knob-target lists cannot drift from what the rack accepts. The rack costs several fullscreen passes and stays out of the pipeline until `fxEnabled` is set. `setFxParam` clamps through `RANGES`; `resetFx` restores the upstream defaults. The project stores the full parameter snapshot and replays it through `setFxParam` on load ([PROJECTS.md](PROJECTS.md)).

## Scene management

`scenes/index.js` imports the seventeen scene modules in registry order — `beams`, `swarm`, `ribbons`, `voxels`, `warp`, `nebula`, `mandelbulb`, `cymatic`, `spectra`, `vjshader`, `ferrofluid`, `chladni`, `valley`, `lattice`, `willidream`, `naturestomb`, `miraclemile` — and derives two exports: `sceneList`, the array of each module's `meta`, and `creators`, a map from scene id to its `createScene` function. The digit keys `1`–`9` index the **active project's pool**, not this registry, so the registry can grow past the digits; the SCENES bank in the left rail lists all seventeen and prints each pooled scene's digit.

Scene instances are created on demand at first use and cached in a map for the rest of the session; the engine never disposes them. Creation receives the context `{ THREE, renderer, width, height, quality }` defined in [SCENE_CONTRACT.md](SCENE_CONTRACT.md). Requesting an unregistered id throws `Unknown scene: <id>`.

Scene switches take one of two paths. `cutTo(id)` switches instantly: the id becomes the active slot, any fade is discarded. All fading switches pass through the internal `crossfadeTo(id, seconds)`, reached via `setScene`, `nextScene`, `loadProject`, and the Auto-VJ scheduler:

- A duration of 0.12 s or less becomes a cut.
- A request for the already-active scene while no fade is running is ignored.
- A request during a fade settles the current fade instantly: the dominant slot — the incoming scene when `mix > 0.5`, otherwise the outgoing one — becomes the active scene, `mix` resets to 0, and the new fade begins from there.
- The duration is clamped to a minimum of 0.1 s.

## Prewarm

Cold scene instancing builds geometry and compiles shaders mid-frame, which would stutter a running show. `prewarm(ids)` queues scene ids (defaulting to the Auto-VJ pool) and the frame loop warms **one scene per frame** — instantiating it and running `renderer.compile` — returning a promise that resolves when the queue drains. `applyProject` calls it after applying a project, so a loaded project's pool is compiled before Auto-VJ or the timeline first switches to it.

## Auto-VJ

The `autoVJ` record is exposed on the engine object:

| Field | Default | Meaning |
|---|---|---|
| `enabled` | `true` | Scheduler on/off |
| `pool` | all registered scene ids | Candidate scenes |
| `minHold` | 18 s | Lower hold-interval bound |
| `maxHold` | 40 s | Upper hold-interval bound |
| `fadeTime` | 4 s | Crossfade duration |
| `holdLeft` | 8 s at engine creation; `minHold` after a project load | Countdown to the next switch |

The tick is skipped while the scheduler is disabled, while a fade is in progress, or when the pool holds fewer than two scenes. Otherwise `holdLeft` decreases by `dt`; when it reaches 0, the next scene is drawn uniformly at random from the pool excluding the current scene, a crossfade of `fadeTime` seconds starts, and `holdLeft` re-arms to a uniform random value in [`minHold`, `maxHold`].

`fadeTime` is no longer overwritten every frame: it holds the loaded project value until something writes it — the AUTO group's FADE field, or a knob assigned to `engine:fadeTime` (the default assignment for knob 2, dispatched only on knob movement). The application layer clears `enabled` on direct scene selection (the SCENES bank, digit keys, a pad's visual action) and toggles it with RUN or the `A` key; the router suspends it while the timeline drives the stage and restores it afterward.

## io assembly

`io` is assembled once per frame and handed to every scene's `update`:

| Field | Initial | Source | Per-frame handling |
|---|---|---|---|
| `level` | 0 | audio `state.level` | Copied |
| `bands.bass` / `.mid` / `.high` | 0 | audio `state.bands` | Copied |
| `beat` | 0 | audio `state.beat` | Copied |
| `xy.x`, `xy.y` | 0.5 | control state | One-pole smoothing, `k = 1 − e^(−14 · dt)` |
| `gestures.pulse` / `.press` / `.sway` | 0 | control state | Copied |
| `knobs[0..7]` | 0.5 | control state | Copied — the raw hardware positions, regardless of what the knobs are assigned to |
| `pads[0..15]` | 0 | control state | `max(previous × e^(−5 · dt), hit)`; the control-state slot is zeroed after consumption |
| `lastPad` | −1 | control state | Copied |
| `palette` | ColorMaster output array | ColorMaster | The same five `THREE.Color` instances every frame |
| `intensity` | 1 | computed | `0.25 + 0.75 × params.intensity + 0.35 × gestures.pulse` |

Pad handling divides ownership between the two layers: the control state records a hit as a velocity, the engine consumes it — reads the value, then zeroes the control-state slot — and thereafter owns the decay, multiplying its own copy by `e^(−5 · dt)` each frame. A new hit replaces the decayed value only when it is larger.

Both attachments are optional. Without an audio engine the audio-derived fields keep their initial values; without a control state the input-derived fields keep theirs.

## Engine parameters

`engine.params` holds the two performance parameters that earlier builds hardwired to knobs inside the frame loop:

| Parameter | Default | Consumed |
|---|---|---|
| `hue` | 0 | Passed to ColorMaster every frame as a 0..1 fraction of a full 360° rotation; ColorMaster ignores values of 0.003 or less |
| `intensity` | 0.5 | The knob component of `io.intensity` (formula above) |

Nothing writes them but their assignments: the default knob table maps knob 1 to `engine:hue` with a center detent (center of travel = exactly zero rotation) and knob 3 to `engine:intensity`, reproducing the old behavior — but the mapping is data in the project, not code in the loop, and any control can be reassigned to or away from them ([STUDIO.md](STUDIO.md)).

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

The initial palette is `neon-garage`; an unrecognized initial name falls back to it.

`setPalette(nameOrHexes, fadeSeconds = 1.5)` accepts a registered palette name or an array of five hex strings; a shorter array repeats cyclically to fill the five slots, and an array palette reports the name `custom`. An unrecognized name is ignored. The blend runs over `fadeSeconds` (minimum 0.01 s) with smoothstep easing, `k = b² (3 − 2b)`, interpolating each of the five colors from its value at the moment of the call to its target. Project palettes arrive this way with a 2 s blend, so palette changes are never hard cuts.

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
| `params` | `{ hue, intensity }` — the engine parameters (above) |
| `fx` | The effects-rack instance |
| `fxEnabled` | Getter/setter; whether the rack sits in the pipeline |
| `setFxParam(key, value)` | Sets one rack parameter, clamped through `RANGES` |
| `resetFx()` | Restores every rack parameter to its default |
| `attachAudio(engine)` | Connects the audio engine ([AUDIO.md](AUDIO.md)) |
| `attachControl(c)` | Connects the control state |
| `setFrameHook(fn)` | Registers the per-frame hook `fn(dt, t, io)` — the router's slot; runs after control ingestion, before the palette update |
| `loadProject(project)` | Applies a legacy preset shape (`palette`, `scenes`, `autoVJ`, `start`) with a 0.8 s fade-in |
| `applyProject(project)` | Applies a validated `.sway` `project` object: palette (2 s blend), Auto-VJ configuration, `fxEnabled`, the effects snapshot replayed through `setFxParam` after a `resetFx`, an instant cut to the start scene, then `prewarm()` of the pool |
| `setScene(id, seconds = 2.5)` | Crossfades to a registered scene; unregistered ids are ignored |
| `cutTo(id)` | Switches instantly; discards any running fade |
| `prewarm(ids = pool)` | Queues scenes for one-per-frame instantiation and shader compilation; resolves when the queue drains |
| `nextScene(seconds = 2.5)` | Crossfades to a random pool scene other than the current one |
| `currentScene` | Getter; the incoming scene's metadata once a fade passes `mix > 0.5`, otherwise the active scene's |
| `start()` | Begins the frame loop; no-op while running |
| `stop()` | Halts the frame loop |
| `resize()` | Recomputes canvas, render-target, rack, and scene sizes; also fired by the stage `ResizeObserver` |

`applyProject` reads the scheduler configuration with defaults of 18 / 40 / 4 for `minHold` / `maxHold` / `fadeTime`, filters the pool to registered ids, resets `holdLeft` to `minHold`, and falls back to the first pool entry when `start.scene` is absent or unregistered. `loadProject` remains for the legacy preset shape and differs in two respects: `autoVJ.enabled` defaults to `true` when the whole block is absent, and the start scene fades in over 0.8 s instead of cutting.
