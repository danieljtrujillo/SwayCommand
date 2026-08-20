# Scene contract

A scene is one self-contained ES module in `src/renderer/engine/scenes/`. The engine ([`engine.js`](../src/renderer/engine/engine.js)) renders the active scene — and, during a crossfade, the incoming scene — into offscreen render targets and composites them with equal-power weights, after the Akvj VfxController pattern. Scenes never touch the canvas, the compositor, or each other. Scene instances are created once per engine lifetime and cached for glitch-free switching, so a scene remains valid across repeated activations.

The requirement keywords MUST, MUST NOT, and SHOULD are used as in RFC 2119: MUST is absolute; SHOULD is the default expectation, deviating only where the scene design gives a documented reason.

## Engine integration

The engine renders each active scene into its own `WebGLRenderTarget`, cleared to opaque black, sized to the canvas times the device pixel ratio (capped at 1.75). A fullscreen composite pass then mixes the two targets with equal-power weights (`cos²`/`sin²` of the fade progress) and applies, in order: a beat flash of up to +25 percent driven by `io.beat`, an S-curve soft limiter (`col / (1 + 0.35·col)`), and a vignette. Tone shaping is therefore owned by the compositor; a scene supplies raw emissive color and does not apply its own limiting or vignetting.

Lifecycle: `createScene` runs lazily on a scene's first activation, and the instance is cached in the engine's instance map for the rest of the engine's lifetime. `update` is called only while the scene is visible — as the active scene, or as the incoming scene during a fade. `resize` is called on every cached instance, visible or not. The engine does not call `dispose` mid-performance; the method covers teardown paths.

## Module shape

A scene module MUST export `meta` and `createScene`:

```js
// src/renderer/engine/scenes/<id>.js
export const meta = { id: '<id>', name: '<Display Name>', mood: '<one word>' };

export function createScene(ctx) {
  const { THREE, quality } = ctx; // use ctx.THREE — never import 'three' directly
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, ctx.width / ctx.height, 0.1, 400);
  // build everything procedurally — no textures or assets from disk, no fetch
  return {
    scene, camera,
    update(dt, t, io) { /* animate; allocation-free per frame */ },
    resize(w, h) { camera.aspect = w / h; camera.updateProjectionMatrix(); },
    dispose() { /* dispose every geometry, material, and render target created here */ },
  };
}
```

`meta.id` keys the scene registry ([`scenes/index.js`](../src/renderer/engine/scenes/index.js)) and is the id that project files reference ([PROJECTS.md](PROJECTS.md)). Registration is by import: `scenes/index.js` imports each module and builds `sceneList` (the `meta` objects) and `creators` (id → `createScene`).

`createScene(ctx)` runs once, on the scene's first activation. The returned object MUST provide:

| Member | Called | Semantics |
|---|---|---|
| `scene` | every frame | The `THREE.Scene` the engine renders. |
| `camera` | every frame | The camera the engine renders with. |
| `update(dt, t, io)` | every frame while active | `dt` is the frame delta in seconds, clamped to 0.05 by the engine; `t` is elapsed time in seconds; `io` is the input snapshot below. |
| `resize(w, h)` | on canvas resize, all cached instances | New canvas size in CSS pixels. |
| `dispose()` | on teardown | Releases every GPU resource the scene created. |

## Creation context (`ctx`)

| Field | Contents |
|---|---|
| `THREE` | The three.js namespace. Scenes MUST NOT import `three` themselves. |
| `renderer` | The shared `WebGLRenderer`. For capability checks only; scenes MUST NOT call `render` or alter renderer state. |
| `width`, `height` | Canvas size in CSS pixels at creation time. Later changes arrive through `resize(w, h)`. |
| `quality` | `{ tier, particles }` — the quality tier (table below). Scenes SHOULD derive instance and particle counts from `quality.particles`. |

Quality tiers:

| `tier` | `particles` |
|---|---|
| `low` | 8,000 |
| `med` | 30,000 |
| `high` | 80,000 |

The engine defaults to `med`; an unknown quality name also falls back to `med`. `quality.particles` is a budget, not a mandate — a scene divides it among its systems (the reference implementation sizes its dust field as `max(500, particles / 12)`). A scene with no per-instance geometry keys off `quality.tier` instead: the fullscreen-quad scenes resolve their shader loop bounds and optional layers into `#define` values so GLSL1 sees literal, unrollable counts, and `cymatic` picks its icosahedron subdivision detail (12 / 18 / 26) the same way.

## Per-frame input (`io`)

`io` is one shared object, mutated in place by the engine each frame and passed to both scenes during a fade. Scenes MUST treat it as read-only.

| Field | Range | Meaning |
|---|---|---|
| `io.level` | 0–1 | Overall audio loudness, smoothed. |
| `io.bands.bass` / `.mid` / `.high` | 0–1 | Smoothed band energies. |
| `io.beat` | 0–1 | Beat impulse: 1 on beat, exponential decay. |
| `io.xy.x`, `io.xy.y` | 0–1 | Hand position, engine-smoothed. The mouse fallback maps the canvas bottom edge to `y = 0`; on Sway hardware the raw CC value passes through unchanged, with `y = 0` as the low/near hand (unconfirmed). |
| `io.gestures.pulse` / `.press` / `.sway` | 0–1 | Sway gesture dimensions. |
| `io.knobs[0..7]` | 0–1 | Knob values; default 0.5. Knobs 0–2 are engine-reserved (table below); scenes MUST NOT repurpose them and SHOULD key scene parameters off knobs 3–7. |
| `io.pads[0..15]` | 0–1 | Pad velocities. The engine decays each value exponentially after the hit (time constant 0.2 s). |
| `io.lastPad` | −1 to 15 | Most recently struck pad; −1 before any hit. |
| `io.palette` | `THREE.Color[5]` | The current ColorMaster palette. Scenes MUST copy values out and MUST NOT mutate the array or the colors. |
| `io.intensity` | 0.25–1.35 | Master brightness: `0.25 + 0.75 × knob 2 + 0.35 × pulse`. Scenes SHOULD scale emissive output by it. |

Engine-reserved knobs:

| Knob | Engine use |
|---|---|
| 0 | Palette hue rotation, 0–1 mapped to 0–360°. The default value 0.5 is treated as no rotation. |
| 1 | Auto-VJ crossfade length, rescaled to 1–8 s. |
| 2 | Master intensity component of `io.intensity`. |

## Hard rules

1. **Palette-driven color.** All visible color MUST derive from `io.palette`; lightness and saturation shifts are permitted. Uniforms holding colors MUST be refreshed with `.copy()` every frame — the palette animates (crossfades on project load, live hue rotation from knob 0).
2. **Audio-reactive and gesture-reactive.** At minimum, one element MUST breathe with `io.bands.*` or `io.beat`, and one element MUST follow `io.xy` continuously. Pads SHOULD cause visible discrete events where they fit the scene.
3. **No per-frame allocation.** Vectors, arrays, and buffers MUST be preallocated in `createScene`. `update` MUST NOT construct objects; scratch objects created once outside `update` are permitted.
4. **Self-contained.** A scene MUST NOT import anything beyond what `ctx` provides, and MUST NOT load assets, fetch, access the DOM, or read window globals. Shaders are inlined as template strings.
5. **Dark-background friendly.** The engine clears each render target to black and the compositor blends additively toward black. Scenes MUST read well on a black background and SHOULD avoid full-screen solid fills.
6. **Performance.** A scene MUST hold 60 fps at 1080 p at `quality.tier === 'med'` on a mid-range integrated GPU. Scenes SHOULD render each system in one draw call (instancing, or `BufferGeometry` with a custom `ShaderMaterial`) and MUST NOT spawn per-object `Mesh` instances in large numbers.
7. **Complete disposal.** `dispose()` MUST release every geometry, material, and render target the scene created. `InstancedMesh` requires its own `.dispose()` call, which frees the `instanceMatrix` and `instanceColor` GPU buffers.

## Reference implementation

[`scenes/beams.js`](../src/renderer/engine/scenes/beams.js) is the reference implementation; new scenes match its style, structure, and comment density. It demonstrates a single `InstancedMesh` for the sixteen columns, per-frame `.copy()` of palette colors into a preallocated `THREE.Color`, preallocated matrix/vector scratch, pad energy folded into per-column flash state, and a `dispose()` that covers the instanced mesh, its geometry and material, the particle system, and the grid helper.

## New scenes

1. Create `src/renderer/engine/scenes/<id>.js` exporting `meta` and `createScene` per the module shape above.
2. Import the module in [`scenes/index.js`](../src/renderer/engine/scenes/index.js) and append it to the `modules` array; `sceneList` and `creators` derive from that array.
3. Add the id to the `scenes` array of at least one project ([PROJECTS.md](PROJECTS.md)) so the scene enters a pool.
4. Run `npm start` to rebuild the renderer bundle and launch.

## Scene inventory

The registry holds eight scenes, listed here in registry order — the order that fixes the `1`–`8` keyboard selection ([ENGINE.md](ENGINE.md#scene-management)).

| Id | Name | Mood | Mechanism |
|---|---|---|---|
| `beams` | Beam Sixteen | anthemic | Sixteen vertical light columns, one per Sway IR sensor, drawn as one `InstancedMesh`; the hand sweeps a highlight across the row, pads flash single columns, bass fattens the beams. |
| `swarm` | Swarm | hypnotic | Stateless GPU particle cloud around an attractor that chases the hand; positions are computed in the vertex shader from random seeds and time, so the CPU pushes only uniforms. One `Points` draw call. |
| `ribbons` | Ribbons | fluid | Glowing triangle-strip trails on per-ribbon Lissajous paths, blended toward the hand; mid band and press fatten the strips, pads teleport a ribbon head with a flash. One draw call for all strips plus one for head sprites. |
| `voxels` | Voxels | chunky | An N × N slab of boxes forming a living heightfield; bass pumps radial waves from the center, pads drop expanding ripples, the hand drags a gaussian hill, press crushes the field flat. |
| `warp` | Wormhole | transluminal | Fragment-shader gravitational throat on one fullscreen quad: depth runs as `(throat/r)^flare` and the angle is dragged by a `lens/(r + 0.1)` lensing term, under a kaleidoscopic wall of fbm plasma, a triangular tech lattice, scanline and data-strip filigree, and streaking stars. Loudness drives flight speed. A pad rising edge past 0.25, or a press crossing 0.72 from below, fires the scripted hyperspace jump: charge 0.12 s, launch 0.35 s, cruise 0.70 s, settle 0.90 s — 2.07 s in total. One draw call. |
| `nebula` | Nebula | psychedelic | Three value-noise fbm layers domain-warp each other into gas folds on one quad, mirror-folded into six kaleidoscope wedges; the hand pans the domain with parallax, mid drives warp strength, bass stacks concentric shells, the beat lurches the domain, and each pad fires an expanding shockwave from its own cell of a 4 × 4 screen grid. One draw call. |
| `mandelbulb` | Mandelbulb | infinite | Raymarched power-8 Mandelbulb distance estimator on one fullscreen quad; bass swells the exponent between 7.0 and 9.5, press blends the iteration constant toward a Lissajous Julia constant, orbit trap and escape count drive the palette lookup, pads detonate a power and glow spike. One draw call. |
| `cymatic` | Cymatic Orb | resonant | A tessellated icosahedron displaced in the vertex shader by three band-driven spherical standing-wave modes plus a zonal ring term; the fragment shader re-evaluates the same field and lights its zero set as nodal Chladni lines, press collapses the displacement while the lines burn brighter, pads and beats launch travelling ripples. Two draw calls, the second a back-facing aura shell. |
