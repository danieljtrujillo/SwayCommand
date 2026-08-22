// Will I Dream — the universe begins on the downbeat and you fly out of it:
// a cold open at the singularity, a big bang that resolves into the star
// field, hyperspace on the hand, a wormhole, a black hole, and a new
// celestial object waiting at the end of every crossing.
//
//   COLD OPEN   The scene opens DARK. Nothing streams, nothing flies: one
//               very faint singularity ahead — the whole particle population
//               collapsed onto a single point — breathing with io.level, so
//               the stage reads as held, not dead. It waits for the show.
//   BIG BANG    On the RISING EDGE of io.transport.playing the singularity
//               ignites: 20,000-odd particles leave the point along their own
//               random velocities (Majid Manzarpour's pen, ported below), the
//               expansion decelerating as it ages; the light cools from
//               white-hot to the palette; the young universe gathers into
//               clusters as it ages; a panoramic sky washes in behind and
//               drains away again; and then, WITHOUT A CROSSFADE, the same
//               particles hand over — staggered, one by one — into their
//               slots in the star field and stream on toward the camera.
//               The bang IS the star field's first ten seconds.
//               A pad assigned to `big bang` fires it without the transport,
//               and while the scene is dark ANY pad ignites it, so a project
//               with no timeline is never stuck in the dark.
//               STOP then PLAY restarts the universe (the transport is back
//               at 0: the scene returns to the singularity and bangs again).
//               PAUSE then PLAY does not (the position is kept: the flight
//               simply resumes — a paused transport never freezes the
//               flight). The restart is read off the transport's POSITION,
//               not off the edge of `playing` alone: a scene only sees the
//               clock on the frames it is rendered, so a show stopped and
//               started while Will I Dream was off screen would otherwise
//               come back mid-flight with the cold open silently skipped.
//               A clock at the top, or one that has moved BACKWARDS since
//               this scene last looked — a stop, a scrub back, a loop seam —
//               is a new run of the show and gets a new universe, however
//               long ago it happened and whoever was on screen at the time
//               (a bang already running is left alone, so a short loop cannot
//               strobe universes). A scene that comes on screen with the show
//               ALREADY underway, the position well past the start and never
//               having moved back, opens in the flight instead: the bang
//               belongs to the downbeat and there is not one to wait for.
//   FLIGHT      Nothing applied at rest: the star field streams TOWARD the
//               camera (forward motion only — no roll, no drift, no orbit,
//               nothing spins). Stars are palette tints pulled toward white;
//               the level breathes their brightness, treble twinkles them.
//   HYPERSPACE  The hand drives it. Warp lives on X and Y together and peaks
//               at the highest X, lowest Y — right of the deck, close to the
//               sensors: X sets the speed, closeness (1 − Y) the density;
//               their product is the warp amount, zero with the hand at rest.
//               THE STARS THEMSELVES BECOME THE STREAKS: every star is a
//               screen-space capsule from where it is to where it was a
//               shutter ago, so the streaks radiate from the vanishing point
//               along each star's own line of flight — random, never a
//               pattern. SWAY is the distribution control: it morphs the
//               field from random scatter toward an ordered lattice and back.
//               Past 0.55 the jump engages (speed ×30, long streaks); under
//               0.25 it ends — a flash, deceleration, and a NEW celestial
//               object ahead. The `hyperspace jump` action runs the same
//               envelope from a pad with no hand at all.
//   OBJECTS     Thirteen bodies, analytically ray-cast on one camera-facing
//               quad, static forms, never the same twice running: pulsar,
//               spiral galaxy, solar system, the volumetric "Nebula Madness"
//               remnant, ringed giant, HALO ringworld, DYSON SHELL (a shell
//               that grew out of one equatorial ring and is nowhere near
//               finished: solid plate inside the build front, nothing outside
//               it, the front itself ragged and wandering with longitude, and
//               whole longitude sectors nobody has started — through those
//               the star burns, and past it you see the far shell's panels
//               lit from inside by the star they enclose), DERELICT SHIPYARD
//               (a broken hull in two pieces with a gash between them, deck
//               and spine lights and two nav beacons still running on the
//               level, and a field of tumbling debris whose tumble is the
//               hand's — sway turns every chunk, nothing turns by itself),
//               VOLCANIC WORLD (basalt crust with a sunlit half; a fissure
//               network and lava basins that emit their own light, dull red
//               at the edge of a flow and white only in its core, so across
//               the terminator the cracks are the ONLY thing you see, under
//               an ash haze), ICE WORLD (crevasse fields, a hard sheen, limb
//               scatter), BANDED GAS GIANT (zonal bands sheared by
//               turbulence, three fixed storm ovals whose filaments stream
//               along the band, the largest of them placed on the face that
//               is turned toward the eye), OCEAN WORLD (a wave-roughened sun
//               glint and domain-warped cloud swirls) and TERRESTRIAL WORLD
//               (land, sea, ice caps, cloud, and city lights clustered on the
//               coasts of its night side).
//   ARRIVAL     A body never pops in at its size: it GROWS from a point at
//               the place it arrives, over 1.6 s on an ease-out (quick to
//               read, slow to settle), under the same alpha fade as before.
//   SCALE AND   `object scale` sets apparent size and applies LIVE to
//   PLACEMENT   whatever is on screen. `object x`, `object y`, `object
//               distance` and `next object` apply to the NEXT object to
//               arrive, so a performer places each jump's arrival before it
//               happens and never teleports the one already in the frame.
//               Each of the four keeps the scene's own random placement until
//               the performer first moves it, and x and y keep it one axis at
//               a time — assign only `object x` and the vertical scatter is
//               still the scene's. A body begins to fade at its own radius,
//               so the flight never passes through one, and the size has a
//               ceiling at the body's own distance: past it the eye would end
//               up INSIDE the body, every ray would miss, and the quad would
//               be paying full-frame fill for nothing. The ceiling is the
//               MAPPING, not a silent clamp — the travel above 1× is stretched
//               into whatever headroom the distance leaves, so the top of the
//               knob always reaches the ceiling and 1× is always 1×. Since the
//               ceiling is proportional to the distance, `object distance`
//               raises it: at the 900-unit default a body tops out near 3×,
//               and only past ~1800 units does the declared 6× fit.
//   WORMHOLE    Its own event, neither the hole nor the jump. A throat opens
//               ahead: a mouth disc showing ANOTHER sky (a second seed —
//               different stars, different nebulae) while the star field
//               around it bends inward on a thin-lens deflection and the
//               flight is drawn in, speed climbing. The mouth swallows the
//               frame, and inside is the tunnel: the wall is the sky you LEFT
//               — smeared around the tube, dimming as it recedes, ringed with
//               lensing bands streaming past — and the aperture ahead is the
//               sky you are going TO, both visible in the same frame. The
//               aperture rushes up, takes the screen in a flash, and you are
//               out in a re-seeded field with a new object ahead.
//   BLACK HOLE  PAD 7 opens it at the center — Darryl Huffman's "Black Hole
//               (WebGL Shader)" lens (the user's BLACKHOLE.zip), its maths
//               kept: pull = mass / dist², the view is rotated about the mass
//               by (pull + held)·π — with the sine term at zero, as upstream
//               ships it, that is a signed radial scaling that collapses and
//               inverts the sky in concentric rings — and every pixel is
//               darkened by pull·0.25, which blacks out the core. The pen's
//               mass eases in (cur += (target − cur)·0.03 per frame); then,
//               as with its held click, the hold value climbs so the rings
//               sweep inward while the mass grows until its own darkening
//               covers the screen — the swallow from the center out — then a
//               beat of void and re-emergence into a re-seeded sky with NO
//               celestial object; a jump in progress ends into the hole
//               instead of spawning one. The lens is applied to the stars'
//               streak endpoints and the object quad; the overlay carries the
//               darkening. As the mass comes fully into view a high-resolution
//               panoramic sky fades in behind everything — procedural and
//               therefore resolution-free (stars at three densities, a Milky
//               Way band with dust, nebula fields), since scenes load no
//               files — and the pen's shader samples THAT sky per pixel at
//               the rotated coordinate, so the ring inversion reads on a
//               textured sky and the hole's interior shows the mirrored sky:
//               the reflective lensing on the hole itself.
//   BANKS       PAD 8 banks left, PAD 15 banks right: the only rotation in
//               the scene, a 2.4 s roll-and-yaw that levels out again; the
//               stars sweep sideways with the turn.
//
// THE CONTROL SURFACE. Everything above is assignable — meta.controls
// declares nine actions (big bang, black hole, hyperspace jump, wormhole
// transit, bank left, bank right, thrust surge, spawn object, swallow and
// re-seed) and seven parameters (object scale, object x, object y, object
// distance, next object, warp amount, star distribution), and action() /
// setParam() implement them, so any pad, knob, button or gesture reaches them
// through the normal assignment UI. The hard-wired pads stay as the
// no-assignment fallback: PAD 7 the black hole, PAD 8 / PAD 15 the banks, any
// other pad a thrust surge (or the ignition, while the scene is dark).
// `warp amount` and `star distribution` take the maximum of the hand and the
// assigned value, so an assignment adds to the hand instead of fighting it.
//
// Pads are numbered as the deck shows them (0–15). Four draw calls, in this
// order: the sky quad (the panorama behind the black hole, the wash behind the
// young universe, and the wormhole's tunnel), the stars (one instanced mesh of
// streak capsules, which is also the big bang's particle system), the
// celestial object (one camera-facing quad of analytic ray-cast bodies, drawn
// ABOVE the stars so a solid body occludes the field behind it) and the
// overlay quad (black hole darkening, singularity core, wormhole rim,
// vanishing-point glow, flash; premultiplied-additive so one pass adds light
// and occludes). Bloom is a LIVE request: zero at rest — no effects with
// nothing applied — rising for the bang (the pen's 2.0 / 0.5 / 0.0), the exit
// flashes and the wormhole.
//
// PORT — "Big bang simulation three.js", Majid Manzarpour
// (https://codepen.io/Majid-Manzarpour/pen/PwYrYdg), which ships as:
//
//     The MIT License (MIT)
//     Copyright (c) 2026 Majid Manzarpour
//     Permission is hereby granted, free of charge, to any person obtaining a
//     copy of this software and associated documentation files (the
//     "Software"), to deal in the Software without restriction, including
//     without limitation the rights to use, copy, modify, merge, publish,
//     distribute, sublicense, and/or sell copies of the Software, and to
//     permit persons to whom the Software is furnished to do so, subject to
//     the following conditions: the above copyright notice and this
//     permission notice shall be included in all copies or substantial
//     portions of the Software. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT
//     WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO
//     THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
//     NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
//     LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
//     OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
//     WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
//
// CHANGES FROM THAT ORIGINAL:
//   * The model is kept: every particle starts at the singularity with a
//     random direction on the sphere (theta uniform, phi = acos(2u − 1)) and
//     a speed in [0.5, 1.0], and position integrates outward along it. Here
//     the integration is a single scalar — the expansion radius — evaluated
//     on the CPU and the position rebuilt in the vertex shader from the
//     particle's own velocity, so the 20,000 positions are never written per
//     frame (hard rule 3: no per-frame allocation, and no 240 KB upload).
//     The pen's constant expansionSpeed becomes a decelerating one,
//     R = R∞·(1 − e^(−t/τ)), because the expansion has to ARRIVE somewhere:
//     it settles into the flight's box instead of running off to infinity.
//   * The CanvasTexture sprite is gone (scenes build no textures): the soft
//     point is drawn analytically in the fragment shader as the capsule
//     profile the star field already uses, so a bang particle and a star are
//     the same primitive — which is what makes the handover continuous.
//   * dat.GUI and OrbitControls are gone; nothing orbits (hard rule 8). The
//     pen's UnrealBloom (strength 2, radius 0.5, threshold 0) is requested
//     through the engine's per-scene bloom, live, and only while the bang,
//     a flash or the wormhole needs it.
//   * The galaxy cluster the pen adds at t > 10 s as a second 5,000-point
//     system becomes structure formation inside the SAME population: as the
//     universe ages the particles gather toward fourteen cluster directions
//     — the young universe going lumpy — with no second draw call.
//   * The nebula the pen adds at t > 15 s as a 500-unit textured BackSide
//     sphere becomes the scene's existing procedural panoramic sky quad,
//     washing in behind the expansion and draining out again as the flight
//     takes over, so the cruise afterwards is exactly the cruise before.
//   * Colour is palette-driven: white-hot at ignition, cooling into
//     io.palette as the universe ages.
//
// Other sources, all MIT CodePen exports in the user's ScifiUI folder,
// re-written here as palette-driven shaders under docs/SCENE_CONTRACT.md: the
// warp-line star field idea (Jamie, "Wormhole"), the lensing pull (Darryl
// Huffman, "Black Hole (WebGL Shader)"), the in-falling horizon (Sean Free,
// "#codevember 13"), the cosmic objects (Techartist, "Cosmic Anomaly
// Visualizer"), the forward-only flight (Rizki Gunawan, "Threejs SciFi
// Flight"), the nebula remnant (Filip Zrnzevic, "threejs-nebula-madness",
// after Duke's supernova) and the ringworld (Rob Glazebrook, "Halo").

// `object scale`'s declared range, shared by meta.controls, setParam and the
// distance mapping in update() so the three can never drift apart.
const SCALE_MIN = 0.2;
const SCALE_MAX = 6;
const GROW_LEN = 1.6; // seconds a new body takes to grow from nothing to its size
const GROW_FLOOR = 0.015; // where the growth starts — not zero, so 1/uScale stays finite

export const meta = {
  id: 'willidream',
  name: 'Will I Dream',
  mood: 'lucid',
  // Declared for the assignment UI, which lists these without instancing the
  // scene; the router dispatches scene:willidream:<key> to action()/setParam().
  controls: {
    actions: [
      { key: 'bigbang', label: 'big bang' },
      { key: 'blackhole', label: 'black hole' },
      { key: 'hyperspace', label: 'hyperspace jump' },
      { key: 'wormhole', label: 'wormhole transit' },
      { key: 'bankLeft', label: 'bank left' },
      { key: 'bankRight', label: 'bank right' },
      { key: 'thrust', label: 'thrust surge' },
      { key: 'spawn', label: 'spawn object' },
      { key: 'swallow', label: 'swallow and re-seed' },
    ],
    params: [
      { key: 'objectScale', label: 'object scale', min: SCALE_MIN, max: SCALE_MAX, default: 1 },
      { key: 'objectX', label: 'object x', min: -1, max: 1, default: 0 },
      { key: 'objectY', label: 'object y', min: -1, max: 1, default: 0 },
      { key: 'objectDistance', label: 'object distance', min: 200, max: 2000, default: 900 },
      { key: 'objectNext', label: 'next object', min: 0, max: 13, default: 0 },
      { key: 'warpAmount', label: 'warp amount', min: 0, max: 1, default: 0 },
      { key: 'starDistribution', label: 'star distribution', min: 0, max: 1, default: 0 },
    ],
  },
};

const PADS = 16;
const PAD_BLACKHOLE = 7; // deck PAD 7
const PAD_BANK_LEFT = 8; // deck PAD 8
const PAD_BANK_RIGHT = 15; // deck PAD 15
const SHAPES = 13;
const FOV = 62;
const TAN_HALF = Math.tan((FOV * Math.PI) / 360);
const BOX_W = 420;
const BOX_H = 280;
const BOX_DEPTH = 700;
const BOX_NEAR = 8;
const CRUISE = 22;
const WARP_GAIN = 30;
const OBJ_SPAWN_Z = 900; // far enough that the post-jump deceleration (~300 units) leaves a long cruise toward it
const BANK_LEN = 2.4;
const T_OPEN = 0.6;
const T_SWALLOW = 3.4;
const T_VOID = 4.0;
const T_END = 5.8;
// big bang: ignition, expansion, structure, handover
const BANG_LEN = 10.5;
const BANG_R = 430; // the expansion settles at roughly the flight box's own scale
const BANG_TAU = 1.9; // R = BANG_R · (1 − e^(−t/τ))
const BANG_Z = -340; // the singularity sits at the box's centre, dead ahead
// wormhole: mouth, draw-in, transit, exit
const W_OPEN = 1.7;
const W_DRAW = 3.4;
const W_TRANSIT = 6.4;
const W_EXIT = 7.4;
// the hyperspace action's own envelope, when no hand is driving the warp
const JUMP_LEN = 3.2;
// per shape, object-local units at scale 1 (the nebula lives in the pen's
// units, radius sqrt 8; the worlds are a radius-6 body plus its limb glow).
// This is the radius of the window the body is drawn through, so it has to
// clear the body's own content: the window starts falling off at 0.86 of it
// (see uWindow in the object shader), and the solar system's outermost planet
// reaches 38.8 — at 40 its far limb was cut in half and the outer orbit line
// stopped mid-arc.
const OBJ_EXTENT = [74, 26, 46, 3.0, 21, 38, 13, 26, 8.5, 8.5, 8.5, 8.5, 8.5];
// Every body is modelled in whatever units suit it, so the default scale is
// derived rather than tuned: OBJ_UNIT is the world half-size the quad wants at
// the default spawn distance — a body of that size fills about a sixth of the
// frame when it arrives and grows as the flight closes on it — and the taste
// row is the only judgement in it (a world is smaller than a galaxy).
const OBJ_UNIT = 190;
// (the nebula is held smaller than the rest: it is the one body that is
// marched rather than intersected, so its cost is its screen area)
const OBJ_TASTE = [0.90, 1.00, 1.05, 0.52, 1.00, 1.00, 0.80, 0.90, 0.72, 0.72, 0.78, 0.72, 0.72];
const OBJ_SCALE = OBJ_EXTENT.map((e, i) => (OBJ_UNIT * OBJ_TASTE[i]) / e);

const GLSL_COMMON = /* glsl */ `
  #define PI 3.14159265359
  #define TAU 6.28318530718
  float h11(float n) { return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
  float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float vnoise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float fbm(vec2 p) {
    float n = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { n += a * vnoise(p); p = p * 2.03 + 11.7; a *= 0.5; }
    return n;
  }
  mat2 rot2(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
  // Darryl Huffman's black-hole lens (CodePen gRZrpv, MIT) on a centred,
  // aspect-corrected screen position (height = 1): pull = mass / dist², the
  // point is rotated about the mass by (pull + held)·π with the sine term at
  // zero exactly as upstream ships it, i.e. a signed radial scaling that
  // collapses and inverts the view in rings. hole = (mass, held). Zero mass is
  // the identity.
  vec2 lens(vec2 q, vec2 hole) {
    if (hole.x <= 0.0) return q;
    float pull = hole.x / max(dot(q, q), 0.00001);
    return q * cos((pull + hole.y) * PI);
  }
  // the pen's darkening of what the lens shows: colour − pull·0.25
  float lensDark(vec2 q, vec2 hole) {
    if (hole.x <= 0.0) return 0.0;
    float pull = hole.x / max(dot(q, q), 0.00001);
    return clamp(pull * 0.25, 0.0, 1.0);
  }
  // the wormhole mouth: a thin-lens deflection toward the throat, ~ r₀²/r²,
  // which pulls the field inward as the mouth opens. worm = (radius, pull).
  vec2 mouthLens(vec2 q, vec2 worm) {
    if (worm.x <= 0.0 || worm.y <= 0.0) return q;
    float r2 = max(dot(q, q), 0.00001);
    float defl = clamp((worm.x * worm.x) / r2 * worm.y * 0.55, 0.0, 0.94);
    return q * (1.0 - defl);
  }
`;

// -------------------------------------------------------------- star streaks
// One instanced screen-space capsule per particle, from where it is to where
// it was a shutter ago. The same primitive serves both populations: in the
// flight the capsule runs from the star's position to its position one
// shutter back along the line of flight, and in the big bang from the
// particle's position back along its own outward velocity — which is why the
// handover between them is a lerp of two endpoints and not a crossfade.
const STAR_VERT = /* glsl */ `
  ${GLSL_COMMON}
  uniform float uTravel, uSide, uDepth, uHalfW, uHalfH, uNear, uAspect, uTime, uTwinkle, uBreath, uOrder, uTail, uGain, uFovK, uFade;
  uniform float uBang, uBangR, uBangTail, uBangGain, uBangHeat, uCluster;
  uniform vec3 uOrigin;
  uniform vec2 uRes;
  uniform vec2 uHole;
  uniform vec3 uWorm; // mouth radius, mouth pull, fade inside the mouth
  uniform vec3 uPal0, uPal1, uPal2;
  in vec2 aQuad;  // per vertex: side -1..1, along 0 (head) .. 1 (tail)
  in vec3 aStar;  // per instance: x0, y0, z0
  in vec3 aInfo;  // per instance: magnitude, tint pick, phase
  in vec4 aBang;  // per instance: outward velocity xyz (speed 0.5..1), handover stagger w
  out vec2 vQ;
  out vec3 vCol;
  out float vA;
  out float vLenR;
  vec2 toScreen(vec4 c) { return c.xy / max(c.w, 0.001) * vec2(uAspect, 1.0) * 0.5; }
  void main() {
    // ---- flight slot: distribution morphs random scatter -> lattice on sway
    vec3 st = aStar;
    vec3 pitch = vec3(2.0 * uHalfW / 9.0, 2.0 * uHalfH / 6.0, uDepth / 14.0);
    vec3 snapped = (floor(st / pitch + 0.5)) * pitch;
    st = mix(st, snapped, uOrder);
    float x = mod(st.x + uSide + uHalfW, 2.0 * uHalfW) - uHalfW;
    float y = st.y;
    // FORWARD: the box scrolls toward the camera (z rises to uNear) and wraps
    float z = (uNear - uDepth) + mod(st.z + uTravel, uDepth);

    // ---- big bang slot: the pen's model — out from the singularity along
    // this particle's own velocity, gathering into clusters as it ages
    vec3 vel = aBang.xyz;
    float ci = floor(aBang.w * float(CLUSTERS));
    vec3 craw = normalize(vec3(h11(ci * 1.7 + 0.3), h11(ci * 3.9 + 1.1), h11(ci * 7.3 + 2.7)) * 2.0 - 1.0);
    vec3 cdir = normalize(mix(normalize(vel), craw, 0.85));
    // knots at their own distances, not all on one shell
    vec3 vClus = cdir * (0.55 + 0.6 * h11(ci * 11.3 + 5.9)) + vel * 0.22;
    vec3 pBang = uOrigin + mix(vel, vClus, uCluster) * uBangR;
    vec3 vBang = mix(vel, vClus, uCluster) * uBangTail;

    // ---- handover: staggered per particle, so the field resolves into the
    // flight one particle at a time instead of snapping as a layer
    float bm = clamp((uBang - aBang.w * 0.30) / 0.70, 0.0, 1.0);
    bm = bm * bm * (3.0 - 2.0 * bm);
    vec3 headP = mix(vec3(x, y, z), pBang, bm);
    vec3 tailP = mix(vec3(x, y, z - uTail), pBang - vBang, bm);

    vec4 mvH = modelViewMatrix * vec4(headP, 1.0);
    vec4 mvT = modelViewMatrix * vec4(tailP, 1.0);
    float dist = max(-mvH.z, 0.5);
    vec4 ch = projectionMatrix * mvH;
    vec4 ct = projectionMatrix * mvT;
    float vis = step(0.3, ch.w) * step(0.3, ct.w);
    vec2 qh = toScreen(ch);
    vec2 sh = mouthLens(lens(qh, uHole), uWorm.xy);
    vec2 stl = mouthLens(lens(toScreen(ct), uHole), uWorm.xy);
    float dark = lensDark(qh, uHole);
    vec2 d = sh - stl;
    float len = length(d);
    vec2 dir = len > 0.00001 ? d / len : vec2(1.0, 0.0);
    vec2 nrm = vec2(-dir.y, dir.x);
    float mag = aInfo.x;
    // dot radius in height units: world size over distance, clamped in pixels
    float pxH = 1.0 / uRes.y;
    float rad = clamp((0.55 + mag * 0.9) * uFovK / dist, 0.7 * pxH, 5.0 * pxH);
    vLenR = len / rad;
    vec2 pos = mix(sh + dir * rad, stl - dir * rad, aQuad.y) + nrm * aQuad.x * rad;
    vec2 ndc = pos / vec2(uAspect, 1.0) * 2.0;
    gl_Position = vec4(ndc * vis, 0.0, 1.0);
    vQ = aQuad;
    float near = smoothstep(uDepth, uDepth * 0.3, dist);
    float tw = 1.0 - 0.18 * uTwinkle * (0.5 + 0.5 * sin(uTime * (2.0 + aInfo.z * 7.0) + aInfo.z * 40.0));
    // stars falling into the open throat are gone from the field
    float mIn = uWorm.x > 0.0 ? 1.0 - smoothstep(uWorm.x * 0.72, uWorm.x * 1.02, length(sh)) : 0.0;
    // a stretched star spreads its light; the jump adds energy back
    vA = (0.42 + mag * 1.3) * (0.5 + 0.5 * near) * tw * uBreath * vis * (1.0 - dark) * (1.0 + uGain) / sqrt(1.0 + vLenR * 0.22);
    vA *= uFade * (1.0 - mIn * uWorm.z) * mix(1.0, uBangGain, bm);
    vec3 tint = aInfo.y < 0.33 ? uPal0 : (aInfo.y < 0.66 ? uPal1 : uPal2);
    vCol = mix(vec3(1.0), tint, 0.38 + 0.22 * mag);
    // ignition is white-hot and cools into the palette as the universe ages
    vCol = mix(vCol, mix(vec3(1.0), uPal2, 0.16), uBangHeat * bm);
  }
`;

const STAR_FRAG = /* glsl */ `
  out vec4 fragColor;
  uniform float uIntensity;
  in vec2 vQ;
  in vec3 vCol;
  in float vA;
  in float vLenR;
  void main() {
    // capsule profile in radius units: head centre at 0, tail centre at vLenR
    float along = vQ.y * (vLenR + 2.0) - 1.0;
    float u = clamp(along, 0.0, vLenR);
    float dx = along - u;
    float d2 = dx * dx + vQ.x * vQ.x;
    if (d2 > 1.0) discard;
    float prof = exp(-d2 * 3.2) * (1.0 - d2 * 0.15);
    float tailFade = 1.0 - 0.75 * (u / max(vLenR, 0.001)) * step(0.5, vLenR);
    fragColor = vec4(vCol * prof * tailFade * vA * uIntensity, 1.0);
  }
`;

// ---------------------------------------------------------- celestial object
const OBJ_VERT = /* glsl */ `
  ${GLSL_COMMON}
  uniform vec3 uObjPos;
  uniform float uExtent, uAspect, uWarm;
  uniform vec2 uHole;
  uniform vec3 uWorm;
  out vec3 vWorld;
  void main() {
    // uWarm shrinks the quad into a two-pixel patch in the corner of the
    // frame so the driver has to translate this program — see the note at the
    // end of update(). It has to RASTERISE: a draw that clips away entirely
    // is skipped and the translation is deferred all over again.
    if (uWarm > 0.5) { vWorld = uObjPos; gl_Position = vec4(position.xy * 0.002 - 0.998, 0.0, 1.0); return; }
    vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
    vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    vec3 world = uObjPos + (right * position.x + up * position.y) * uExtent;
    vWorld = world;
    vec4 clip = projectionMatrix * viewMatrix * vec4(world, 1.0);
    vec2 ndc = clip.xy / max(clip.w, 0.001);
    vec2 q = mouthLens(lens(ndc * vec2(uAspect, 1.0) * 0.5, uHole), uWorm.xy);
    clip.xy = q * 2.0 / vec2(uAspect, 1.0) * clip.w;
    gl_Position = clip;
  }
`;

const OBJ_FRAG = /* glsl */ `
  out vec4 fragColor;
  ${GLSL_COMMON}
  uniform vec3 uObjPos;
  uniform float uShape, uScale, uAlpha, uPulse, uTime, uSeed, uIntensity, uSway, uLevel, uWindow;
  uniform vec3 uPal0, uPal1, uPal2, uPal3, uPal4;
  in vec3 vWorld;

  // returns t of the nearest hit, or -1; edge = normalized discriminant for AA
  float iSphere(vec3 ro, vec3 rd, vec3 c, float r, out float edge) {
    vec3 oc = ro - c;
    float b = dot(oc, rd);
    float cc = dot(oc, oc) - r * r;
    float h = b * b - cc;
    edge = h / (r * r);
    if (h < 0.0) return -1.0;
    return -b - sqrt(h);
  }
  float iPlane(vec3 ro, vec3 rd, vec3 c, vec3 n) {
    float d = dot(rd, n);
    if (abs(d) < 0.00001) return -1.0;
    return dot(c - ro, n) / d;
  }
  float aa(float edge) { return smoothstep(0.0, max(fwidth(edge) * 1.5, 0.0001), edge); }
  // axis-aligned box in the ray's own frame (iq's slab form); returns the
  // nearest positive hit and its normal, or -1
  float iBox(vec3 ro, vec3 rd, vec3 rad, out vec3 nrm) {
    vec3 m = 1.0 / rd;
    vec3 n = m * ro;
    vec3 k = abs(m) * rad;
    vec3 t1 = -n - k, t2 = -n + k;
    float tN = max(max(t1.x, t1.y), t1.z);
    float tF = min(min(t2.x, t2.y), t2.z);
    if (tN > tF || tF < 0.0) return -1.0;
    nrm = -sign(rd) * step(t1.yzx, t1.xyz) * step(t1.zxy, t1.xyz);
    return tN > 0.0 ? tN : tF;
  }

  // --- 3-D value noise on the body's own surface normal, so the pattern is
  // seamless over the sphere (no polar pinch, no lon/lat seam)
  float wh3(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float wn3(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(wh3(i), wh3(i + vec3(1, 0, 0)), f.x), mix(wh3(i + vec3(0, 1, 0)), wh3(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(wh3(i + vec3(0, 0, 1)), wh3(i + vec3(1, 0, 1)), f.x), mix(wh3(i + vec3(0, 1, 1)), wh3(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
  float wf3(vec3 p) {
    float n = 0.0, a = 0.5;
    for (int i = 0; i < WORLD_OCT; i++) { n += a * wn3(p); p = p * 2.07 + 9.3; a *= 0.5; }
    return n * WORLD_NORM; // normalized to 0..1 (the constant comes in as a
                           // literal: folding 1/(1 − 2^−oct) in the shader
                           // makes the HLSL translator warn about precision)
  }
  float ridged(vec3 p) { return 1.0 - abs(wf3(p) * 2.0 - 1.0); }

  vec3 shadePlanet(vec3 n, vec3 rd, vec3 L, vec3 base, vec3 atmo, float bandFreq, vec3 axis) {
    float lit = max(dot(n, L), 0.0);
    float wrap = smoothstep(-0.25, 0.45, dot(n, L));
    float lat = dot(n, axis);
    float bands = 0.82 + 0.18 * sin(lat * bandFreq + sin(lat * bandFreq * 2.7) * 0.6);
    vec3 col = base * bands * (0.04 + 0.96 * wrap);
    float fres = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
    col += atmo * fres * (0.12 + 0.88 * lit) * 1.3;
    float spec = pow(max(dot(reflect(-L, n), -rd), 0.0), 28.0) * 0.22;
    return col + vec3(spec) * lit;
  }

  // ---- pulsar: core, two jets, magnetosphere rings, halo; pulses in place
  vec4 pulsar(vec3 ro, vec3 rd, vec3 C) {
    vec3 J = normalize(vec3(0.35, 1.0, 0.22));
    vec3 U = normalize(cross(J, vec3(0.0, 0.0, 1.0)));
    vec3 V = cross(J, U);
    float pulse = 0.55 + 0.45 * uPulse;
    vec3 col = vec3(0.0); float cover = 0.0;
    // core
    float e; float t = iSphere(ro, rd, C, 1.6, e);
    if (t > 0.0) { float k = aa(e); col += mix(uPal2, vec3(1.0), 0.8) * 3.0 * k; cover = k; }
    // closest approach to the jet axis (both directions), with taper along h
    vec3 oc = ro - C;
    float hAlong = dot(oc, J) ; float vAlong = dot(rd, J);
    // parameter of closest approach between ray and the axis line
    vec3 w0 = oc - J * hAlong;  vec3 w1 = rd - J * vAlong;
    float a = dot(w1, w1), b = dot(w0, w1);
    float tc = a > 0.00001 ? -b / a : 0.0;
    tc = max(tc, 0.0);
    vec3 pc = ro + rd * tc - C;
    float h = dot(pc, J);
    float dAx = length(pc - J * h);
    float ah = abs(h);
    float taper = smoothstep(62.0, 8.0, ah);
    float w = 0.6 + ah * 0.045;
    float flow = 0.7 + 0.3 * sin(ah * 0.9 - uTime * 9.0) * (0.5 + 0.5 * sin(ah * 0.31 + 1.7));
    float jet = exp(-dAx * dAx / (w * w)) * taper * flow;
    float jetCore = exp(-dAx * dAx / (0.12 + ah * 0.004)) * taper;
    col += (uPal2 * 1.4 * jet + vec3(1.0) * jetCore * 0.9) * pulse * (ah < 64.0 ? 1.0 : 0.0);
    // magnetosphere: two static tori around the equator (distance to circle)
    float rXY = length(pc - J * h);
    float dT1 = length(vec2(rXY - 9.0, h));
    float dT2 = length(vec2(rXY - 16.0, h * 0.7));
    col += mix(uPal1, uPal0, 0.5) * (exp(-dT1 * dT1 * 0.9) * 0.35 + exp(-dT2 * dT2 * 0.5) * 0.12) * (0.6 + 0.4 * pulse);
    // halo around the core (volumetric-ish)
    float dC = length(cross(oc, rd));
    col += mix(uPal2, vec3(1.0), 0.4) * exp(-dC * 0.55) * 0.9 * pulse;
    return vec4(col, cover);
  }

  // ---- spiral galaxy: an inclined plane with log-spiral arms, bulge, dust
  vec4 galaxy(vec3 ro, vec3 rd, vec3 C) {
    vec3 N = normalize(vec3(0.55, 0.75, 0.35));
    vec3 U = normalize(cross(N, vec3(0.0, 1.0, 0.0)));
    vec3 V = cross(N, U);
    vec3 col = vec3(0.0); float cover = 0.0;
    float t = iPlane(ro, rd, C, N);
    if (t > 0.0) {
      vec3 p = ro + rd * t - C;
      float r = length(p);
      float phi = atan(dot(p, V), dot(p, U));
      float bulge = exp(-r / 3.2) * 2.2;
      float armW = 0.55;
      float arms = 0.0;
      for (int k = 0; k < 2; k++) {
        float phiArm = log(max(r, 0.3) / 1.2) / 0.34 + float(k) * PI;
        float dphi = phi - phiArm;
        dphi = mod(dphi + PI, TAU) - PI;
        float across = dphi * r;           // arc distance from the arm ridge
        arms += exp(-(across * across) / (armW * armW + r * 0.08));
      }
      float n = fbm(vec2(phi * 2.5 + uSeed, r * 0.9));
      float clumps = smoothstep(0.45, 0.8, n) * 0.8;
      float disc = exp(-r / 14.0) * smoothstep(0.0, 1.5, r);
      float dust = smoothstep(0.3, 0.6, fbm(vec2(phi * 4.0 + 9.0, r * 1.4 + uSeed))) * disc * 0.6;
      float dens = bulge + (arms * (0.6 + clumps) + 0.10) * disc;
      dens *= (1.0 - dust * 0.7);
      vec3 warm = mix(uPal3, vec3(1.0), 0.5);
      vec3 cool = mix(uPal2, uPal0, 0.5);
      vec3 c = mix(cool, warm, clamp(bulge * 0.9, 0.0, 1.0));
      c = mix(c, uPal1 * 0.5, dust);
      c += uPal4 * clumps * 0.25;
      col = c * dens * 1.2;
      cover = clamp(dens * 0.55, 0.0, 0.9) * (1.0 - smoothstep(24.0, 30.0, r));
      col *= (1.0 - smoothstep(24.0, 30.0, r));
    }
    // bulge glow sphere (volumetric-ish) so the core has depth
    float dC = length(cross(ro - C, rd));
    col += mix(uPal3, vec3(1.0), 0.6) * exp(-dC * 0.5) * 0.5;
    return vec4(col, cover);
  }

  // ---- solar system: sun, six planets (one ringed), belt, faint orbit lines
  vec4 solarSystem(vec3 ro, vec3 rd, vec3 C) {
    vec3 N = normalize(vec3(0.15, 0.9, 0.4));
    vec3 U = normalize(cross(N, vec3(1.0, 0.0, 0.0)));
    vec3 V = cross(N, U);
    vec3 col = vec3(0.0); float cover = 0.0;
    float tBest = 1e9; vec3 bestCol = vec3(0.0); float bestCov = 0.0;
    // sun
    float e; float t = iSphere(ro, rd, C, 3.0, e);
    if (t > 0.0 && t < tBest) {
      vec3 n = normalize(ro + rd * t - C);
      float mu = max(dot(n, -rd), 0.0);
      float k = aa(e);
      bestCol = mix(uPal3, vec3(1.0), 0.55) * (0.45 + 0.55 * mu) * 3.2; bestCov = k; tBest = t;
    }
    // planets
    for (int i = 0; i < 6; i++) {
      float fi = float(i);
      float orbit = 7.5 + fi * 5.4 + (fi > 2.5 ? 3.0 : 0.0);
      float ang = fi * 2.39996 + 1.3 + uSeed;
      vec3 pc = C + orbit * (cos(ang) * U + sin(ang) * V);
      float pr = i == 0 ? 0.7 : i == 1 ? 1.0 : i == 2 ? 0.95 : i == 3 ? 2.6 : i == 4 ? 2.1 : 1.3;
      float ep; float tp = iSphere(ro, rd, pc, pr, ep);
      if (tp > 0.0 && tp < tBest) {
        vec3 n = normalize(ro + rd * tp - pc);
        vec3 L = normalize(C - pc);          // lit by the sun
        vec3 base = i == 0 ? mix(uPal3, uPal4, 0.5) * 0.6 : i == 1 ? mix(uPal0, uPal2, 0.3) : i == 2 ? mix(uPal1, uPal0, 0.4) : i == 3 ? mix(uPal3, uPal4, 0.35) : i == 4 ? mix(uPal2, uPal1, 0.5) : mix(uPal0, vec3(1.0), 0.3);
        vec3 atmo = i == 1 ? uPal2 : i == 3 ? uPal3 : uPal0;
        float bf = i >= 3 ? 14.0 : 5.0;
        vec3 axis = normalize(N + U * 0.35 * sin(fi * 2.1));
        vec3 sc = shadePlanet(n, rd, L, base, atmo, bf, axis);
        // ring shadow on planet 3
        if (i == 3) {
          vec3 hp = ro + rd * tp;
          float tl = iPlane(hp, L, pc, N);
          if (tl > 0.0) { float rr = length(hp + L * tl - pc); if (rr > 3.6 && rr < 5.8) sc *= 0.45; }
        }
        bestCol = sc; bestCov = aa(ep); tBest = tp;
      }
      // rings around planet 3
      if (i == 3) {
        float tr = iPlane(ro, rd, pc, N);
        if (tr > 0.0 && tr < tBest) {
          float rr = length(ro + rd * tr - pc);
          if (rr > 3.6 && rr < 5.8) {
            float g = 0.55 + 0.45 * sin(rr * 9.0 + uSeed) * sin(rr * 3.1);
            float inner = smoothstep(3.6, 3.8, rr) * (1.0 - smoothstep(5.6, 5.8, rr));
            // planet shadow on the ring
            vec3 hp = ro + rd * tr; vec3 L = normalize(C - pc);
            float esh; float tsh = iSphere(hp, L, pc, pr, esh);
            float sh = tsh > 0.0 ? 0.35 : 1.0;
            vec3 rc = mix(uPal3, uPal4, 0.4) * (0.5 + 0.5 * g) * sh;
            float ra = (0.35 + 0.45 * g) * inner;
            bestCol = mix(bestCol, rc, ra); bestCov = max(bestCov, ra); tBest = tr;
          }
        }
      }
    }
    // asteroid belt: a dusty annulus between planets 2 and 3
    float tb = iPlane(ro, rd, C, N);
    if (tb > 0.0 && tb < tBest) {
      vec3 p = ro + rd * tb - C;
      float r = length(p);
      float phi = atan(dot(p, V), dot(p, U));
      float band = smoothstep(17.5, 18.5, r) * (1.0 - smoothstep(20.5, 21.5, r));
      float n = fbm(vec2(phi * 9.0 + uSeed, r * 2.2));
      float belt = band * smoothstep(0.55, 0.85, n) * 0.22;
      // faint orbit lines
      float lines = 0.0;
      for (int i = 0; i < 6; i++) { float fi = float(i); float orbit = 7.5 + fi * 5.4 + (fi > 2.5 ? 3.0 : 0.0); lines += exp(-pow((r - orbit) / 0.06, 2.0)); }
      lines *= 0.035;
      vec3 bc = uPal3 * belt + mix(uPal2, uPal0, 0.5) * lines;
      bestCol = mix(bestCol, bc, belt) + bc * (1.0 - belt);
      bestCov = max(bestCov, belt * 0.6);
    }
    col = bestCol; cover = bestCov;
    // sun corona (additive)
    float dC = length(cross(ro - C, rd));
    col += mix(uPal3, vec3(1.0), 0.5) * (exp(-dC * 0.9) * 1.2 + exp(-dC * 0.25) * 0.15);
    return vec4(col, cover);
  }

  // ---- nebula: "Nebula Madness" (Filip Zrnzevic, MIT; after Duke's supernova
  // remnant) — the volumetric march kept line for line; the 256² noise texture
  // becomes a hash of the same texel lookup, the theme colours come from the
  // palette, and the pen's mouse rotation is the hand's sway (no self-spin).
  float nebNoise(vec3 x) {
    vec3 p = floor(x), f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    vec2 uv2 = (p.xy + vec2(37.0, 17.0) * p.z) + f.xy;
    return 1.0 - 0.82 * h21(floor(uv2 + 0.5));
  }
  float nebFbm(vec3 p) { return nebNoise(p * .06125) * .5 + nebNoise(p * .125) * .25 + nebNoise(p * .25) * .125 + nebNoise(p * .4) * .2; }
  float length8(vec2 p) { p = p * p; p = p * p; p = p * p; return pow(p.x + p.y, 1.0 / 8.0); }
  float nebDisk(vec3 p, vec3 t) { vec2 q = vec2(length(p.xy) - t.x, p.z * 0.5); return max(length8(q) - t.y, abs(p.z) - t.z); }
  float spiralNoiseC(vec3 p) {
    const float nudge = 0.9;
    const float normalizer = 1.0 / sqrt(1.0 + nudge * nudge);
    float n = 0.0, iter = 2.0;
    for (int i = 0; i < 8; i++) {
      n += -abs(sin(p.y * iter) + cos(p.x * iter)) / iter;
      p.xy += vec2(p.y, -p.x) * nudge; p.xy *= normalizer;
      p.xz += vec2(p.z, -p.x) * nudge; p.xz *= normalizer;
      iter *= 1.733733;
    }
    return n;
  }
  float nebField(vec3 p) {
    float f = nebDisk(p.xzy, vec3(2.0, 1.8, 1.25));
    f += nebFbm(p * 90.0);
    f += spiralNoiseC(p.zxy * 0.5123 + 100.0) * 3.0;
    return f;
  }
  float nebMap(vec3 p) {
    float c = cos(uSway), sn = sin(uSway);
    p.xz = vec2(c * p.x + sn * p.z, -sn * p.x + c * p.z);
    return abs(nebField(p / 0.5) * 0.5) + 0.07;
  }
  vec3 nebColor(float density, float radius, vec3 base, vec3 edge, vec3 accent, vec3 glow) {
    vec3 r = mix(base, edge, density);
    r *= mix(7.0 * accent, 1.5 * glow, min((radius + .05) / .9, 1.15));
    return r;
  }
  vec4 nebula(vec3 ro, vec3 rd, vec3 C) {
    vec3 org = ro - C;
    vec3 base = mix(uPal3, vec3(1.0), 0.35), accent = uPal4, edge = uPal1, glow = uPal2;
    float b = dot(rd, org);
    float c = dot(org, org) - 8.0;
    float delta = b * b - c;
    if (delta < 0.0) return vec4(0.0);
    float ds = sqrt(delta);
    float tn = -b - ds, tf = -b + ds;
    if (tf < 0.0) return vec4(0.0);
    float t = max(tn, 0.0);
    float ld = 0.0, td = 0.0, w = 0.0;
    const float h = 0.1;
    vec4 sum = vec4(0.0);
    for (int i = 0; i < NEB_STEPS; i++) {
      vec3 pos = org + t * rd;
      if (td > 0.7 || sum.a > 0.99 || t > tf) break; // the pen's t > 10 assumed its camera 6 units out; tf bounds ours
      float d = max(nebMap(pos), 0.0);
      float lDist = max(length(pos), 0.001);
      vec3 lightColor = accent * 1.5;
      sum.rgb += (base / (lDist * lDist * 10.) / 80.);
      sum.rgb += (lightColor / exp(lDist * lDist * lDist * .08) / 30.);
      if (d < h) {
        ld = h - d;
        w = (1. - td) * ld;
        td += w + 1. / 200.;
        vec4 col = vec4(nebColor(td, lDist, base, edge, accent, glow), td);
        sum += sum.a * vec4(sum.rgb, 0.0) * 0.2;
        col.a *= 0.2;
        col.rgb *= col.a;
        sum = sum + col * (1.0 - sum.a);
      }
      td += 1. / 70.;
      t += max(d * 0.12 * max(min(length(pos), length(org)), 1.0), 0.01);
    }
    sum *= 1. / exp(ld * 0.02) * 0.57;
    sum = clamp(sum, 0.0, 1.0);
    sum.xyz = sum.xyz * sum.xyz * (3.0 - 2.0 * sum.xyz);
    return vec4(sum.xyz * (1.0 + uPulse * 0.15), sum.a * 0.9);
  }

  // ---- ringed planet: gas giant with atmosphere, banded rings, mutual shadows
  vec4 ringed(vec3 ro, vec3 rd, vec3 C) {
    vec3 N = normalize(vec3(0.3, 0.85, 0.42));
    vec3 L = normalize(vec3(-0.6, 0.5, 0.6));
    vec3 col = vec3(0.0); float cover = 0.0;
    float tBest = 1e9;
    float e; float tp = iSphere(ro, rd, C, 6.5, e);
    if (tp > 0.0) {
      vec3 n = normalize(ro + rd * tp - C);
      vec3 base = mix(uPal1, uPal4, 0.45);
      col = shadePlanet(n, rd, L, base, mix(uPal0, uPal2, 0.5), 16.0, N);
      vec3 hp = ro + rd * tp;
      float tl = iPlane(hp, L, C, N);
      if (tl > 0.0) { float rr = length(hp + L * tl - C); if (rr > 9.0 && rr < 18.0) col *= 0.4 + 0.3 * sin(rr * 4.0); }
      cover = aa(e); tBest = tp;
    }
    float tr = iPlane(ro, rd, C, N);
    if (tr > 0.0 && tr < tBest) {
      float rr = length(ro + rd * tr - C);
      if (rr > 9.0 && rr < 18.0) {
        float g = 0.55 + 0.45 * sin(rr * 4.0 + uSeed) * (0.7 + 0.3 * sin(rr * 11.0));
        float gaps = smoothstep(0.25, 0.4, fract(rr * 0.7 + 0.2));
        float inner = smoothstep(9.0, 9.4, rr) * (1.0 - smoothstep(17.4, 18.0, rr));
        vec3 hp = ro + rd * tr;
        float esh; float tsh = iSphere(hp, L, C, 6.5, esh);
        float sh = tsh > 0.0 ? 0.25 : 1.0;
        float lit = 0.5 + 0.5 * abs(dot(N, L));
        vec3 rc = mix(uPal3, mix(uPal4, vec3(1.0), 0.3), fract(rr * 0.37)) * (0.45 + 0.55 * g) * sh * lit;
        float ra = (0.3 + 0.5 * g) * gaps * inner;
        col = mix(col, rc, ra); cover = max(cover, ra);
      }
    }
    // thin atmosphere glow
    float dC = length(cross(ro - C, rd));
    col += mix(uPal0, uPal2, 0.5) * exp(-(dC - 6.5) * 1.6) * step(6.5, dC) * 0.35;
    return vec4(col, cover);
  }

  // ---- halo: a ringworld after Rob Glazebrook's "Halo" (MIT) — the inner
  // habitable band and the outer hull, analytic cylinder band, static (the
  // pen's CSS spin is not carried over)
  vec4 halo(vec3 ro, vec3 rd, vec3 C) {
    vec3 N = normalize(vec3(0.25, 0.9, 0.36));
    vec3 U = normalize(cross(N, vec3(1.0, 0.0, 0.0)));
    vec3 V = cross(N, U);
    vec3 L = normalize(vec3(-0.5, 0.6, 0.62));
    const float R = 30.0, W = 5.0;
    vec3 o = ro - C;
    vec3 ol = vec3(dot(o, U), dot(o, N), dot(o, V));
    vec3 dl = vec3(dot(rd, U), dot(rd, N), dot(rd, V));
    float a = dl.x * dl.x + dl.z * dl.z;
    float b = 2.0 * (ol.x * dl.x + ol.z * dl.z);
    float c = ol.x * ol.x + ol.z * ol.z - R * R;
    float disc = b * b - 4.0 * a * c;
    if (disc < 0.0 || a < 0.000001) return vec4(0.0);
    float sq = sqrt(disc);
    float t1 = (-b - sq) / (2.0 * a), t2 = (-b + sq) / (2.0 * a);
    vec3 col = vec3(0.0);
    float cover = 0.0;
    for (int k = 1; k >= 0; k--) {
      float t = k == 1 ? t2 : t1;
      if (t <= 0.0) continue;
      vec3 p = ol + dl * t;
      float band = smoothstep(W * 0.5 + 0.15, W * 0.5 - 0.15, abs(p.y));
      if (band <= 0.001) continue;
      vec3 nrm = normalize(vec3(p.x, 0.0, p.z));
      float along = atan(p.z, p.x) * R;
      vec3 sc;
      if (k == 1) {
        vec3 n = -nrm;
        float terr = fbm(vec2(along * 0.06 + uSeed, p.y * 0.5));
        float sea = smoothstep(0.42, 0.5, terr);
        float cloud = smoothstep(0.55, 0.8, fbm(vec2(along * 0.11 + 7.0 + uTime * 0.01, p.y * 0.7)));
        vec3 land = mix(mix(uPal3, uPal4, 0.4), uPal1, smoothstep(0.5, 0.8, terr));
        vec3 ocean = mix(uPal2, uPal0, 0.4) * 0.7;
        vec3 surf = mix(mix(ocean, land, sea), vec3(1.0), cloud * 0.6);
        float lit = max(dot(n, L), 0.0);
        float wrap = smoothstep(-0.3, 0.5, dot(n, L));
        sc = surf * (0.08 + 0.92 * wrap) + mix(uPal2, uPal0, 0.5) * pow(1.0 - max(dot(n, -rd), 0.0), 2.0) * 0.35 * (0.3 + lit);
        sc += uPal3 * (1.0 - wrap) * smoothstep(0.7, 0.95, fbm(vec2(along * 0.4, p.y * 3.0))) * 0.35;
      } else {
        vec3 n = nrm;
        float plate = h21(floor(vec2(along * 0.25, p.y * 0.8)));
        float seams = smoothstep(0.02, 0.0, abs(fract(along * 0.25) - 0.5) - 0.47) + smoothstep(0.02, 0.0, abs(fract(p.y * 0.8) - 0.5) - 0.47);
        vec3 hull = mix(uPal1, uPal0, 0.35) * (0.55 + 0.45 * plate);
        float lit = max(dot(n, L), 0.0);
        float spec = pow(max(dot(reflect(-L, n), -rd), 0.0), 40.0) * 0.5;
        sc = hull * (0.1 + 0.9 * lit) * (1.0 - seams * 0.5) + vec3(spec) + uPal2 * smoothstep(0.875, 0.96875, h21(floor(vec2(along * 0.5, p.y * 2.0)))) * 0.3;
      }
      col = mix(col, sc, band);
      cover = max(cover, band);
    }
    return vec4(col, cover);
  }

  // ---- dyson shell: a star inside a sphere that is only half built. The
  // shell is cut into panel cells; a cell is built when its hash falls under
  // a build fraction that is high at the equator and near zero at the poles,
  // so the structure reads as a machine growing outward from its first ring.
  // Unbuilt cells are simply not there — the ray passes through them to the
  // star, which is what leaks the light — and where the ray leaves through a
  // gap and lands on the FAR shell you see the finished panels lit from
  // inside by their own star.
  #define DYSON_LON 56.0
  #define DYSON_LAT 28.0
  vec2 dysonCell(vec3 d) {
    float lon = atan(d.z, d.x);
    float lat = asin(clamp(d.y, -1.0, 1.0));
    return vec2(floor(lon / TAU * DYSON_LON), floor(lat / PI * DYSON_LAT + 0.5));
  }
  // The shell grew outward from one equatorial ring and is nowhere near
  // finished. Inside the build front it is solid plate; outside it there is
  // nothing at all; the front itself wanders with longitude and is ragged at
  // the panel scale, and two or three longitude sectors have not been started.
  // Solid-then-nothing is the point: a per-cell coin toss everywhere gives a
  // mirror ball, not a machine.
  float dysonBuilt(vec3 d) {
    vec2 cell = dysonCell(d);
    float lon = atan(d.z, d.x);
    float lat = asin(clamp(d.y, -1.0, 1.0));
    float front = 0.60 + 0.26 * sin(lon * 2.0 + uSeed * 3.0) + 0.12 * h11(floor(lon / TAU * 22.0) * 5.3 + uSeed);
    float reach = abs(sin(lat)) / max(front, 0.08);
    float sec = floor(lon / TAU * 9.0 + 9.0);
    float open = step(0.70, h11(sec * 4.7 + uSeed * 2.3));  // sectors nobody has reached
    float frac = (1.0 - smoothstep(0.74, 1.06, reach)) * (1.0 - open * 0.94);
    // clamped past 1 and below 0 so the middle of the shell is genuinely
    // solid and the empty sky is genuinely empty; only the front is a coin toss
    return step(h21(cell + uSeed * 7.0), clamp(frac * 1.30 - 0.14, 0.0, 1.0));
  }
  vec3 dysonPanel(vec3 d, vec3 nrm, vec3 rd, float inside) {
    vec2 cell = dysonCell(d);
    float lon = atan(d.z, d.x), lat = asin(clamp(d.y, -1.0, 1.0));
    vec2 f = vec2(fract(lon / TAU * DYSON_LON), fract(lat / PI * DYSON_LAT + 0.5));
    float edge = min(min(f.x, 1.0 - f.x), min(f.y, 1.0 - f.y));
    float seam = smoothstep(0.04, 0.0, edge);
    // panel to panel the plating varies — a flat tone under a bright grid is
    // what makes a sphere of squares read as a mirror ball
    float plate = 0.30 + 0.70 * h21(cell + 31.0) * (0.55 + 0.45 * h21(cell * 3.0 + 7.0));
    vec3 hull = mix(uPal1, uPal0, 0.4) * plate;
    vec3 warm = mix(uPal3, vec3(1.0), 0.35);
    // The near shell is a silhouette — plate, barely lit, against its own
    // star. The far shell is the same plate lit from inside by that star.
    vec3 col = hull * mix(0.055, 0.66, inside);
    // a radiator strip down every panel, running hot on the lit shell
    float strip = smoothstep(0.42, 0.47, f.y) * (1.0 - smoothstep(0.53, 0.58, f.y));
    col += warm * strip * mix(0.09, 0.34, inside) * (0.55 + 0.45 * uPulse);
    // seams: a thin line, not a lit grid — a grid is what reads as a ball
    col += warm * seam * mix(0.10, 0.14, inside);
    // the star's light spilling round the limb of its own shell
    col += warm * pow(1.0 - abs(dot(normalize(d), -rd)), 6.0) * 0.5;
    float spec = pow(max(dot(reflect(normalize(vec3(0.3, 0.6, 0.5)), nrm), -rd), 0.0), 30.0) * 0.14;
    return col + vec3(spec) * (1.0 - inside);
  }
  vec4 dyson(vec3 ro, vec3 rd, vec3 C) {
    const float RS = 9.0, RSTAR = 3.8;
    vec3 oc = ro - C;
    float b = dot(oc, rd), cc = dot(oc, oc) - RS * RS;
    float h = b * b - cc;
    vec3 col = vec3(0.0); float cover = 0.0;
    float tN = -1.0, tF = -1.0;
    if (h > 0.0) { float s = sqrt(h); tN = -b - s; tF = -b + s; }
    bool blocked = false;
    if (tN > 0.0) {
      vec3 d = normalize(oc + rd * tN);
      if (dysonBuilt(d) > 0.5) {
        col = dysonPanel(d, d, rd, 0.0);
        cover = 1.0;
        blocked = true;
      }
    }
    if (!blocked) {
      // through a gap: the star
      float e; float ts = iSphere(ro, rd, C, RSTAR, e);
      if (ts > 0.0) {
        // limb-darkened rather than a clipped white disc, so the panels that
        // cross it read as plates against a star and not as holes in a lamp
        vec3 n = normalize(ro + rd * ts - C);
        float mu = max(dot(n, -rd), 0.0);
        col = mix(uPal3, vec3(1.0), 0.42) * (0.26 + 0.74 * mu) * 1.28;
        cover = aa(e);
      } else if (tF > 0.0) {
        // the far shell, lit from inside by the star it encloses
        vec3 d = normalize(oc + rd * tF);
        if (dysonBuilt(d) > 0.5) {
          col = dysonPanel(d, -d, rd, 1.0) * 1.15;
          cover = 1.0;
        }
      }
      // the light escaping through the unbuilt sectors
      float dC = length(cross(oc, rd));
      col += mix(uPal3, vec3(1.0), 0.45) * (exp(-max(dC - RSTAR, 0.0) * 0.62) * 1.25 + exp(-dC * 0.26) * 0.18);
    }
    return vec4(col, cover);
  }

  // ---- derelict shipyard: a hull broken in two with a gash between the
  // sections, its nav beacons still running on the audio level, in a field of
  // tumbling debris. Nothing turns by itself — the chunks hold the attitude
  // they were built with until the hand's sway turns them (hard rule 8).
  // The hull is painted, not black: the first cut mixed two dark palette
  // entries at a third of their value and the whole yard disappeared into the
  // star field. A hard key from the local star, a cold fill so the shadowed
  // faces still read, a rim off the limb, and the plating on top of that.
  vec3 hullShade(vec3 n, vec3 p, vec3 rd, vec3 L, float wreck) {
    float lit = max(dot(n, L), 0.0);
    vec2 uv = abs(n.x) > 0.5 ? p.zy : (abs(n.y) > 0.5 ? p.xz : p.xy);
    float panel = h21(floor(uv * vec2(0.7, 1.6)) + uSeed);
    float seam = smoothstep(0.06, 0.0, min(fract(uv.x * 0.7), fract(uv.y * 1.6)));
    vec3 base = mix(mix(uPal1, uPal0, 0.55), vec3(1.0), 0.30) * (0.55 + 0.45 * panel);
    base = mix(base, mix(uPal4, uPal1, 0.55) * 0.26, wreck); // scorched near the break
    vec3 col = base * (0.10 + 0.90 * lit) + base * 0.15 * (0.5 + 0.5 * n.y);
    col *= 1.0 - seam * 0.35;
    col += vec3(pow(max(dot(reflect(-L, n), -rd), 0.0), 40.0)) * 0.7 * lit;
    col += mix(uPal2, vec3(1.0), 0.5) * pow(1.0 - max(dot(n, -rd), 0.0), 4.0) * 0.22;
    return col;
  }
  vec4 junk(vec3 ro, vec3 rd, vec3 C) {
    vec3 L = normalize(vec3(0.52, 0.38, 0.76));
    vec3 A = normalize(vec3(0.90, 0.13, 0.42));  // the hull's long axis
    vec3 U = normalize(cross(A, vec3(0.0, 1.0, 0.0)));
    vec3 V = cross(A, U);
    vec3 o = ro - C;
    vec3 ol = vec3(dot(o, A), dot(o, U), dot(o, V));
    vec3 dl = vec3(dot(rd, A), dot(rd, U), dot(rd, V));
    vec3 col = vec3(0.0); float cover = 0.0; float tBest = 1e9;
    // two sections of one hull, a gash of empty space between them
    for (int s = 0; s < 2; s++) {
      float sgn = s == 0 ? 1.0 : -1.0;
      vec3 off = vec3(sgn * 8.5, s == 0 ? 0.0 : 0.55, s == 0 ? 0.0 : 0.5);
      vec3 rad = s == 0 ? vec3(6.2, 1.5, 2.0) : vec3(4.4, 1.25, 1.7);
      vec3 nb;
      float t = iBox(ol - off, dl, rad, nb);
      if (t > 0.0 && t < tBest) {
        vec3 p = ol + dl * t - off;
        vec3 n = nb.x * A + nb.y * U + nb.z * V;
        float wreck = smoothstep(6.0, 2.0, abs(p.x) + (s == 0 ? 0.0 : 2.0));
        col = hullShade(n, p, rd, L, wreck);
        // spine lights and a deck row along the flank, still burning
        float run = smoothstep(0.84375, 0.96875, sin(p.x * 1.7) * 0.5 + 0.5) * step(abs(nb.y), 0.5);
        float deck = smoothstep(0.7, 0.95, sin(p.x * 5.3) * 0.5 + 0.5) * smoothstep(0.55, 0.2, abs(p.z))
                   * step(abs(nb.z), 0.5) * (1.0 - wreck);
        col += mix(uPal2, vec3(1.0), 0.5) * (run * 0.55 + deck * 0.30) * (0.35 + 0.65 * uLevel);
        cover = 1.0; tBest = t;
      }
    }
    // debris: chunks on hashed sites with hashed attitudes; sway turns them
    for (int i = 0; i < JUNK_N; i++) {
      float fi = float(i) + uSeed * 3.0;
      vec3 site = (vec3(h11(fi * 1.7), h11(fi * 3.3 + 1.1), h11(fi * 5.9 + 2.3)) * 2.0 - 1.0) * vec3(19.0, 7.0, 9.0);
      // mostly small chunks with a few big pieces of hull among them
      float sc = 0.40 + 1.85 * pow(h11(fi * 7.7 + 4.1), 1.7);
      vec3 p = ol - site;
      vec3 d = dl;
      float a1 = h11(fi * 2.9 + 0.7) * TAU + uSway * 1.4;
      float a2 = h11(fi * 4.3 + 3.1) * TAU + uSway * 0.9;
      p.xy = rot2(a1) * p.xy; d.xy = rot2(a1) * d.xy;
      p.yz = rot2(a2) * p.yz; d.yz = rot2(a2) * d.yz;
      vec3 nb;
      float t = iBox(p, d, vec3(sc, sc * 0.62, sc * 0.8), nb);
      if (t > 0.0 && t < tBest) {
        vec3 nr = nb;
        nr.yz = rot2(-a2) * nr.yz; nr.xy = rot2(-a1) * nr.xy;
        vec3 n = nr.x * A + nr.y * U + nr.z * V;
        col = hullShade(n, (p + d * t) * 3.0, rd, L, 0.45) * 1.2;
        cover = 1.0; tBest = t;
      }
    }
    // beacons on the wreck, and the dust the yard sits in
    for (int k = 0; k < 2; k++) {
      vec3 bp = C + A * (k == 0 ? 14.0 : -12.5) + U * (k == 0 ? 1.4 : -1.2);
      float dB = length(cross(ro - bp, rd));
      float phase = 0.5 + 0.5 * sin(uTime * 2.2 + float(k) * 2.1);
      col += mix(k == 0 ? uPal4 : uPal2, vec3(1.0), 0.4) * exp(-dB * dB * 1.1) * (0.35 + 0.65 * phase) * (1.2 + 1.4 * uLevel);
    }
    float dC = length(cross(o, rd));
    col += mix(uPal0, uPal1, 0.5) * exp(-dC * 0.14) * 0.10;
    return vec4(col, cover);
  }

  // ---- the worlds: one radius-6 body, five surfaces on a shape index.
  //   0 volcanic   fissure network and lava seas that emit their own light,
  //                so the night side of the terminator is nothing but cracks
  //   1 ice        crevasse fields, hard sheen, limb scatter
  //   2 gas giant  zonal bands sheared by turbulence, three storm ovals
  //   3 ocean      wave-roughened sun glint, domain-warped cloud swirls
  //   4 terrestrial land/sea/ice, cloud, city lights on the coasts at night
  vec4 world(vec3 ro, vec3 rd, vec3 C, int kind) {
    const float R = 6.0;
    // the sun sits nearly side-on, so every world carries a real terminator —
    // the volcanic one's fissures are the only light across it, and the
    // terrestrial one's cities come up on the dark half
    vec3 L = normalize(vec3(-0.88, 0.32, 0.24));
    vec3 axis = normalize(vec3(0.16, 1.0, 0.22));
    vec3 col = vec3(0.0); float cover = 0.0;
    float e; float t = iSphere(ro, rd, C, R, e);
    // The air is chosen BEFORE the sphere test. The limb term at the bottom is
    // the atmosphere seen where the ray MISSES the body — exactly the rays for
    // which the surface branch never runs — so a colour picked inside it never
    // reaches the halo, and every world wore the same default rim.
    vec3 atmo; float atmoK;
    if (kind == 0) { atmo = mix(uPal4, uPal3, 0.55); atmoK = 0.52; }        // volcanic: ash lit from below
    else if (kind == 1) { atmo = mix(uPal2, vec3(1.0), 0.35); atmoK = 0.5; } // ice: thin and bright
    else if (kind == 2) { atmo = mix(uPal3, uPal0, 0.5); atmoK = 0.7; }      // gas giant: deep haze
    else if (kind == 3) { atmo = mix(uPal2, uPal0, 0.35); atmoK = 0.9; }     // ocean: the thickest air here
    else { atmo = mix(uPal2, uPal0, 0.3); atmoK = 0.5; }                     // terrestrial
    // (a surface branch may still deepen atmoK per pixel for the fresnel on
    // the disc; the limb term below is masked off wherever that has happened)
    if (t > 0.0) {
      vec3 n = normalize(ro + rd * t - C);
      vec3 sp = n * 1.0 + uSeed * 0.7;
      float lit = max(dot(n, L), 0.0);
      float ndl = dot(n, L);
      float wrap = smoothstep(-0.16, 0.38, ndl);
      float night = 1.0 - smoothstep(-0.04, 0.20, ndl);
      float term = exp(-ndl * ndl * 11.0);
      float fres = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);
      if (kind == 0) {
        // VOLCANIC — a basalt crust with a sunlit half and a night half, cut
        // by a fissure network and flooded in the low ground by lava that
        // lights itself, so across the terminator the cracks are all there is
        float base = wf3(sp * 2.4);
        // the ridge of value noise sits at its own mode, so the fissures have
        // to be cut close to 1 or the whole crust glows
        float fis = smoothstep(0.88, 0.99, ridged(sp * 5.5)) + 0.55 * smoothstep(0.92, 0.99, ridged(sp * 12.0));
        // lava seas: the basins, skinned over with a cooling crust
        float sea = smoothstep(0.34, 0.15, base);
        float crust = smoothstep(0.34, 0.78, wf3(sp * 13.0 + vec3(0.0, uTime * 0.035, 0.0)));
        float molten = clamp(fis * (0.35 + 0.65 * crust) + sea * (0.22 + 0.78 * crust), 0.0, 1.6);
        // the crust reads as rock in the sun and as nothing at all at night
        vec3 basalt = mix(mix(uPal1, uPal2, 0.30) * 0.16, mix(uPal0, uPal1, 0.30) * 0.50, base);
        basalt *= 0.62 + 0.38 * wf3(sp * 9.0);
        // molten rock is dull red at the edge of a flow and white only in its
        // core — the old ramp started at 72 % white and the whole planet
        // looked like cracked marble
        vec3 dull = mix(uPal4, uPal3, 0.22) * 0.55;
        vec3 core = mix(uPal3, vec3(1.0), 0.55);
        vec3 lava = mix(dull, uPal3, clamp(molten * 1.5, 0.0, 1.0));
        lava = mix(lava, core, clamp((molten - 0.72) * 2.4, 0.0, 1.0));
        col = basalt * (0.04 + 1.40 * wrap);
        col += lava * molten * 1.15;  // emissive: the only light at night
        // ash: a haze that catches the sun, and glows from beneath over a flow
        float ash = wf3(sp * 3.1 + 4.0);
        col += mix(uPal4, uPal0, 0.5) * ash * (0.05 + 0.34 * wrap) * 0.5;
        col += mix(uPal3, vec3(1.0), 0.3) * molten * ash * 0.30;
        atmoK = 0.38 + molten * 0.45;  // the ash over a flow carries its light
      } else if (kind == 1) {
        // ICE
        float base = wf3(sp * 3.0);
        float crev = smoothstep(0.90625, 0.96875, ridged(sp * 7.5));
        vec3 ice = mix(mix(uPal2, vec3(1.0), 0.74), mix(uPal0, vec3(1.0), 0.55), base);
        col = ice * (0.06 + 0.94 * wrap) * (1.0 - crev * 0.5);
        col += mix(uPal2, vec3(1.0), 0.75) * pow(max(dot(reflect(-L, n), -rd), 0.0), 90.0) * 0.85 * lit;
        col += mix(uPal2, vec3(1.0), 0.6) * fres * (0.15 + 0.85 * lit) * 0.55;
        col += mix(uPal2, uPal0, 0.5) * night * 0.02;
      } else if (kind == 2) {
        // GAS GIANT — bands shear along the flow, storms hold their place
        float la = dot(n, axis);
        float flow = uTime * 0.02;
        float turb = wf3(sp * 3.2 + vec3(flow * 2.4, 0.0, flow)) * 2.0 - 1.0;
        float bands = sin(la * 15.0 + turb * 2.6);
        vec3 c1 = mix(uPal3, vec3(1.0), 0.42), c2 = mix(uPal4, uPal1, 0.45), c3 = mix(uPal0, vec3(1.0), 0.25);
        vec3 surf = mix(mix(c2, c1, 0.5 + 0.5 * bands), c3, smoothstep(0.55, 0.98, abs(la)));
        for (int k = 0; k < 3; k++) {
          float fk = float(k) + uSeed;
          // the first storm is placed on the hemisphere that faces the eye —
          // three storms on random directions leave the visible face plain
          // more often than not, and a banded giant with no spot is a stripe
          vec3 sc = k == 0
            ? normalize(vec3(0.44 * (h11(fk * 2.3) * 2.0 - 1.0), -0.30 + 0.24 * h11(fk * 5.1), 0.80))
            : normalize(vec3(h11(fk * 2.3) * 2.0 - 1.0, (h11(fk * 5.1) - 0.5) * 0.9, h11(fk * 7.9) * 2.0 - 1.0));
          float dLat = dot(n - sc, axis);
          float dAlong = length(n - sc) ;
          float oval = exp(-(dAlong * dAlong * (k == 0 ? 8.5 : 14.0) + dLat * dLat * (k == 0 ? 42.0 : 70.0)));
          float streak = 0.5 + 0.5 * sin(dAlong * 46.0 - uTime * 0.7 + turb * 3.0);
          vec3 storm = mix(mix(uPal4, vec3(1.0), 0.5), mix(uPal3, vec3(1.0), 0.2), streak);
          surf = mix(surf, storm * (0.7 + 0.5 * streak), clamp(oval * 1.3, 0.0, 0.95));
        }
        col = surf * (0.05 + 0.95 * wrap);
      } else if (kind == 3) {
        // OCEAN
        float base = wf3(sp * 2.2);
        vec3 deep = mix(uPal2, uPal1, 0.45) * 0.28, shallow = mix(uPal2, vec3(1.0), 0.45) * 0.75;
        vec3 sea = mix(deep, shallow, smoothstep(0.40, 0.70, base) * 0.8);
        vec3 wp = sp * 3.2 + vec3(uTime * 0.014, 0.0, uTime * 0.008);
        float warp = wf3(wp * 1.8);
        float cl = smoothstep(0.58, 0.86, wf3(wp + warp * 0.9));
        col = mix(sea, vec3(0.95), cl * 0.85) * (0.05 + 0.95 * wrap);
        vec3 H = normalize(L - rd);
        float rough = 0.30 + 0.45 * wf3(sp * 20.0 + vec3(uTime * 0.05, 0.0, 0.0));
        float glint = pow(max(dot(n, H), 0.0), mix(620.0, 55.0, rough)) * (1.0 - cl) * lit;
        col += mix(uPal3, vec3(1.0), 0.80) * glint * 3.2;
      } else {
        // TERRESTRIAL
        float base = wf3(sp * 2.6);
        float landM = smoothstep(0.475, 0.535, base);
        float coast = smoothstep(0.44, 0.48, base) * (1.0 - smoothstep(0.53, 0.60, base));
        float cap = smoothstep(0.70, 0.90, abs(dot(n, axis)));
        vec3 land = mix(mix(uPal1, uPal3, 0.45) * 0.42, mix(uPal4, uPal3, 0.6) * 0.55, wf3(sp * 6.5));
        vec3 sea = mix(uPal2, uPal0, 0.55) * 0.26;
        vec3 surf = mix(sea, land, landM);
        surf = mix(surf, vec3(0.86), cap);
        float cl = smoothstep(0.58, 0.86, wf3(sp * 3.4 + vec3(uTime * 0.012, 0.0, 0.0)));
        surf = mix(surf, vec3(0.92), cl * 0.62);
        col = surf * (0.04 + 0.96 * wrap);
        // city lights: hashed cells, clustered on land and along the coasts,
        // each a point inside its cell rather than the cell itself
        vec3 g = n * 64.0;
        vec3 gc = floor(g + 0.5);
        vec3 gf = g - gc;
        float grid = wh3(gc);
        float point = exp(-dot(gf, gf) * 13.0);
        float lights = smoothstep(0.72, 0.96, grid) * point * landM * (0.30 + 0.70 * coast) * night * (1.0 - cl * 0.8);
        col += mix(uPal3, vec3(1.0), 0.4) * lights * 4.0 * (0.65 + 0.35 * sin(uTime * 2.4 + grid * 60.0));
        atmoK = 0.5 + term * 0.7;  // the terminator's own scattering
      }
      col += atmo * fres * (0.10 + 0.90 * lit + term * 0.5) * atmoK;
      cover = aa(e);
    }
    // the limb's own scattering, just outside the disc
    float dC = length(cross(ro - C, rd));
    col += atmo * exp(-max(dC - R, 0.0) * 2.2) * step(R, dC) * 0.28 * atmoK;
    return vec4(col, cover);
  }

  void main() {
    vec3 ro = cameraPosition;
    vec3 rd = normalize(vWorld - ro);
    // work in object-local scale: scale the ray origin instead of the shapes
    vec3 C = uObjPos;
    vec3 roS = C + (ro - C) / uScale;
    vec4 o;
    if (uShape < 5.5) {
      if (uShape < 0.5) o = pulsar(roS, rd, C);
      else if (uShape < 1.5) o = galaxy(roS, rd, C);
      else if (uShape < 2.5) o = solarSystem(roS, rd, C);
      else if (uShape < 3.5) o = nebula(roS, rd, C);
      else if (uShape < 4.5) o = ringed(roS, rd, C);
      else o = halo(roS, rd, C);
    } else if (uShape < 6.5) o = dyson(roS, rd, C);
    else if (uShape < 7.5) o = junk(roS, rd, C);
    else o = world(roS, rd, C, int(uShape) - 8);
    // the quad is a window onto the body, and a window must not have edges:
    // everything falls off inside the disc inscribed in it, so no halo, dust
    // or corona can ever run into the corner of its own billboard
    float dWin = length(cross(roS - C, rd));
    float win = 1.0 - smoothstep(0.859375, 0.96875, dWin / max(uWindow, 0.001));
    o *= win;
    float a = clamp(o.a, 0.0, 1.0) * uAlpha;
    fragColor = vec4(o.rgb * uAlpha * uIntensity, a);
  }
`;

// ------------------------------------------- sky: the panorama and the throat
// One quad behind everything, in two modes.
//
//   PANORAMA  (the black hole) A procedural sky — stars at three cell
//             densities, a Milky Way band with dust lanes, nebula fields —
//             sampled per pixel THROUGH the pen's lens at the rotated
//             coordinate (texture(sky, rotate(mt, st, pull)) in the original)
//             and darkened by pull·0.25, so the ring inversion reads on a
//             textured sky and the hole's interior shows the mirrored sky.
//             It also serves the big bang, washing in behind the expansion as
//             the pen's nebula does when its universe ages.
//   THROAT    (the wormhole) The disc ahead is the sky you are going TO
//             (seed B) through the mouth; outside it, once you are inside,
//             the tube wall is the sky you LEFT (seed A) smeared around the
//             tube, dimming as it recedes behind you, with lensing rings
//             streaming past — so both skies are in the frame at once and
//             they do not match.
const SKY_FRAG = /* glsl */ `
  ${GLSL_COMMON}
  uniform vec2 uRes;
  uniform float uTime, uSky, uIntensity, uRoll, uYaw, uMode, uSeedA, uSeedB, uFlow, uNebula;
  uniform vec2 uHole;
  uniform vec4 uThroat; // aperture radius, inside 0..1, rim, wall gain
  uniform vec3 uPal0, uPal1, uPal2, uPal3, uPal4;
  in vec2 vUv;
  out vec4 fragColor;
  vec2 octa(vec3 d) {
    d /= (abs(d.x) + abs(d.y) + abs(d.z));
    vec2 o = d.xy;
    if (d.z < 0.0) o = (1.0 - abs(o.yx)) * vec2(o.x >= 0.0 ? 1.0 : -1.0, o.y >= 0.0 ? 1.0 : -1.0);
    return o;
  }
  vec3 starTint(float t) {
    vec3 warm = vec3(1.0, 0.55, 0.32), sol = vec3(1.0, 0.94, 0.85), blue = vec3(0.66, 0.78, 1.0);
    return t < 0.6 ? mix(warm, sol, t / 0.6) : mix(sol, blue, (t - 0.6) / 0.4);
  }
  // the star cells get their own sin-free hash for the same reason as h31,
  // and the magnitude curve is a chain of squarings rather than two pow()s
  float sh21(vec2 p) {
    vec3 q = fract(vec3(p.xyx) * 0.1031);
    q += dot(q, q.yzx + 33.33);
    return fract((q.x + q.y) * q.z);
  }
  vec3 starSphere(vec3 rd, float seed) {
    vec3 col = vec3(0.0);
    vec2 o = octa(rd);
    for (int L = 0; L < 3; L++) {
      float sc = 26.0 + float(L) * 42.0;
      vec2 p = o * sc + seed * (7.13 + float(L) * 3.71);
      vec2 cell = floor(p);
      vec2 f = fract(p);
      vec2 sp = vec2(sh21(cell), sh21(cell + 91.0));
      float d = length(f - sp) / sc;
      float m = sh21(cell + 17.0);
      float m2 = m * m, m4 = m2 * m2, m8 = m4 * m4, m16 = m8 * m8;
      float mag = m16 * m2 * 3.0 + m4 * m * 0.12;
      float psf = 0.0008 + min(mag, 2.5) * 0.0006;
      col += starTint(sh21(cell + 5.0)) * min(mag * smoothstep(psf, 0.0, d), 1.7);
    }
    return col;
  }
  // Seamless on the sphere: value noise on the direction itself (the
  // octahedral map is only used for the star cells, whose seams are
  // invisible). The hash is deliberately sin-free — this is the one shader in
  // the scene that evaluates noise over every pixel of the frame, and a
  // transcendental per lattice corner is most of its cost.
  float h31(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.yzx + 33.33);
    return fract((p.x + p.y) * p.z);
  }
  float noise3(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    // Quintic fade, not the cubic one. A cubic fade leaves a second-derivative
    // kink on every lattice plane; a smoothstep threshold over it — which is
    // how every nebula field below is cut — turns those planes into visible
    // cube faces, and the sky reads as stacked boxes instead of gas.
    f = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    return mix(mix(mix(h31(i), h31(i + vec3(1, 0, 0)), f.x), mix(h31(i + vec3(0, 1, 0)), h31(i + vec3(1, 1, 0)), f.x), f.y),
               mix(mix(h31(i + vec3(0, 0, 1)), h31(i + vec3(1, 0, 1)), f.x), mix(h31(i + vec3(0, 1, 1)), h31(i + vec3(1, 1, 1)), f.x), f.y), f.z);
  }
  // Each octave is turned as well as scaled (iq's rotation, scaled by 2), so
  // the lattices never line up and the sum has no preferred axis — the other
  // half of what stops the field looking like masonry.
  const mat3 OCT = mat3(0.0, 1.6, 1.2, -1.6, 0.72, -0.96, -1.2, -0.96, 1.28);
  float fbm3(vec3 p) {
    float n = 0.0, a = 0.5;
    for (int i = 0; i < SKY_OCT; i++) { n += a * noise3(p); p = OCT * p + 11.7; a *= 0.5; }
    return n;
  }
  vec3 skyColor(vec3 rd, float seed) {
    vec3 col = starSphere(rd, 3.7 + seed) * 1.3;
    vec3 N = normalize(vec3(0.35, 1.0, 0.2));
    float lat = dot(rd, N);
    float band = exp(-lat * lat * 18.0);
    float mw = fbm3(rd * 6.0 + 3.0 + seed) * band;
    // the dust lanes live at one scale, so they cost one octave, not four
    float dust = smoothstep(0.42, 0.72, noise3(rd * 14.0 + 9.0 + seed) * 0.65 + noise3(OCT * rd * 14.5 + seed) * 0.35) * band;
    col += mix(uPal3, vec3(1.0), 0.6) * mw * 0.6 * (1.0 - dust * 0.8);
    col += mix(uPal0, vec3(1.0), 0.4) * band * 0.12;
    // one fbm for the big nebula field; the second is a single octave, which
    // is all a soft blob needs and half the cost of the whole function
    float n1 = fbm3(rd * 3.5 + 17.0 + seed);
    float n2 = noise3(rd * 4.0 + 41.0 + seed) * 0.7 + noise3(OCT * rd * 4.5 + seed) * 0.3;
    vec3 neb = uPal1 * smoothstep(0.5, 0.85, n1) * 0.4 + uPal4 * smoothstep(0.55, 0.9, n2) * 0.35 + uPal2 * smoothstep(0.6, 0.95, n1 * n2 * 1.6) * 0.45;
    return col + neb * (1.0 + uNebula * 2.2);
  }
  // The two modes and the throat's two halves choose a DIRECTION, a seed and a
  // gain; skyColor itself is evaluated exactly once per pixel, at the end. The
  // HLSL translator flattens branches in code with no side effects, so a
  // skyColor call inside each branch would be paid for three times over on
  // every pixel of the frame — the difference between 5 ms and 27 ms at 1080p.
  void main() {
    vec2 uv = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
    uv = rot2(uRoll) * uv;
    float r = length(uv);
    vec3 rd; float seed, gain, alpha;
    vec3 add = vec3(0.0);
    if (uMode > 0.5) {
      // ---- the wormhole throat
      float ap = max(uThroat.x, 0.0001);
      float inDisc = step(r, ap);
      float wall = uThroat.w * uThroat.y;
      // the sky AHEAD, through the mouth: the far hemisphere compressed into
      // the disc, so the aperture is a window and not a hole
      vec2 p = uv / ap;
      vec3 rdA = normalize(vec3(p * 1.25, -1.0));
      // the tube wall: the sky BEHIND, wrapped around the throat. dep = 1 at
      // the aperture rim, falling to 0 at the frame edge (right beside the
      // eye), so the mapping is the lensing itself.
      float ang = atan(uv.y, uv.x);
      float dep = clamp(ap / r, 0.0, 1.0);
      vec3 rdW = normalize(vec3(cos(ang), sin(ang), 0.0) * (0.30 + 0.70 * dep) + vec3(0.0, 0.0, dep * 1.7 - 0.85));
      float s = -log(max(dep, 0.002)) * 0.85 + uFlow;
      // the sky you left dims toward the frame edge — that is the wall
      // passing the eye — and carries lensing bands streaming down it. The
      // falloff is gentle on purpose: the whole point of the transit is that
      // the sky BEHIND and the sky AHEAD are in the frame together and do not
      // match, and a steeper curve leaves the wall black and the point unmade.
      float gW = pow(dep, 1.5) * 0.85 * (0.40 + 0.60 * (0.5 + 0.5 * sin(s * 5.0))) * wall;
      float gA = 1.15 + 0.85 * (1.0 - length(p));
      rd = mix(rdW, rdA, inDisc);
      seed = mix(uSeedA, uSeedB, inDisc);
      gain = mix(gW, gA, inDisc);
      add = (1.0 - inDisc) * wall * (mix(uPal2, uPal0, 0.55) * pow(dep, 1.5) * (0.10 + 0.34 * pow(0.5 + 0.5 * sin(s * 5.0 + 1.1), 3.0))
           + mix(uPal1, uPal4, 0.5) * pow(dep, 3.5) * 0.45);
      // the rim where the two skies meet
      float rim = exp(-pow((r - ap) / (ap * 0.05 + 0.004), 2.0));
      add += mix(uPal2, vec3(1.0), 0.32) * rim * uThroat.z * 0.5;
      alpha = max(mix(uThroat.y, 1.0, inDisc), rim * uThroat.z * 0.9);
    } else {
      // ---- the panorama, seen through the pen's lens
      vec2 q = lens(uv, uHole);
      vec3 rr = normalize(vec3(q * 1.2, -1.0));
      float cy = cos(uYaw), sy = sin(uYaw);
      rd = vec3(rr.x * cy + rr.z * sy, rr.y, -rr.x * sy + rr.z * cy);
      seed = uSeedA;
      gain = 1.0 - lensDark(uv, uHole);
      alpha = 1.0;
    }
    // where the hole's darkening (or the receding tube wall) has taken the
    // pixel to nothing there is no sky to evaluate — a real early-out, which
    // is most of the frame through the swallow
    if (gain < 0.004) {
      fragColor = vec4(add * uIntensity * uSky, clamp(alpha, 0.0, 1.0) * uSky);
      return;
    }
    vec3 col = skyColor(rd, seed) * gain + add;
    fragColor = vec4(col * uIntensity * uSky, clamp(alpha, 0.0, 1.0) * uSky);
  }
`;

// ------------------------------------------------- overlay: black hole + glow
const OVER_VERT = /* glsl */ `
  out vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

// The sky's own vertex shader: the overlay's, plus the same warm-up collapse
// the object quad carries (see the note at the end of update()).
const SKY_VERT = /* glsl */ `
  uniform float uWarm;
  out vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = uWarm > 0.5 ? vec4(position.xy * 0.002 - 0.998, 0.0, 1.0) : vec4(position.xy, 0.0, 1.0);
  }
`;

const OVER_FRAG = /* glsl */ `
  ${GLSL_COMMON}
  uniform vec2 uRes;
  uniform float uTime, uWarp, uFlash, uVeil, uIntensity, uRoll, uSing;
  uniform vec2 uHole;
  uniform vec3 uMouth; // wormhole: aperture radius, rim brightness, surrounding darkening
  uniform vec3 uPal0, uPal1, uPal2, uPal3, uPal4;
  in vec2 vUv;
  out vec4 fragColor;
  void main() {
    vec2 uv = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
    uv = rot2(uRoll) * uv;
    float r = length(uv);
    vec3 col = vec3(0.0);
    // the cold open: the singularity, breathing on the level, and nothing else
    col += mix(uPal2, vec3(1.0), 0.7) * uSing * (0.010 / (r * r * 26.0 + 0.004) + 0.05 * exp(-r * 34.0));
    // vanishing-point glow of the jump, and the exit flash
    col += mix(uPal2, vec3(1.0), 0.5) * uWarp * uWarp * 0.22 / (r * 6.0 + 0.25);
    col += vec3(1.0) * uFlash * 0.35;
    // the wormhole mouth: a gravitational darkening around the throat. The
    // rim itself belongs to the sky pass — drawing it twice blows it out.
    float ap = max(uMouth.x, 0.0001);
    float mouthDark = uMouth.z * smoothstep(ap * 0.97, ap * 1.06, r) * (1.0 - smoothstep(ap * 1.05, ap * 3.4, r));
    // the pen's darkening: the core goes black, the rings dim toward it
    float dark = lensDark(uv, uHole);
    float cover = max(max(dark, uVeil), clamp(mouthDark, 0.0, 1.0));
    col *= (1.0 - cover);
    fragColor = vec4(col * uIntensity, cover);
  }
`;

export function createScene(ctx) {
  const { THREE, quality } = ctx;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, ctx.width / Math.max(1, ctx.height), 0.5, 4000);
  camera.position.set(0, 0, 0);
  const tier = quality.tier;
  // one population serves both the big bang and the star field, so the count
  // is the pen's 20,000 at the top tier and a budget fraction below it
  // One population serves both the big bang and the star field. The pen's
  // 20,000 particles are the high tier; the middle sits where the jump's
  // streak overdraw — the scene's real cost centre — stays where it was.
  const STARS = tier === 'low' ? 5000 : tier === 'high' ? 20000 : 10000;
  const NEB_STEPS = tier === 'low' ? 28 : tier === 'high' ? 56 : 40;
  // the sky is a fullscreen noise field, so its octave count is the scene's
  // single biggest fill-rate lever; it is only on screen during the hole,
  // the wormhole and the young universe
  const SKY_OCT = tier === 'low' ? 2 : tier === 'high' ? 4 : 3;
  const WORLD_OCT = tier === 'low' ? 3 : tier === 'high' ? 5 : 4;
  const JUNK_N = tier === 'low' ? 10 : tier === 'high' ? 26 : 18;
  const CLUSTERS = 14; // how many knots the young universe gathers into
  const fovK = 1 / (2 * Math.tan((FOV * Math.PI) / 360));

  const pal = () => Array.from({ length: 5 }, () => ({ value: new THREE.Color(1, 1, 1) }));
  const [sp0, sp1, sp2] = pal();
  const [op0, op1, op2, op3, op4] = pal();
  const [vp0, vp1, vp2, vp3, vp4] = pal();

  // --- stars: one instanced mesh of streak capsules, and the big bang's
  // particle system — the same instances, so the handover is a lerp
  const starGeo = new THREE.InstancedBufferGeometry();
  const quadPos = new Float32Array([-1, 0, 0, 1, 0, 0, -1, 1, 0, 1, 1, 0]);
  const quadUV = new Float32Array([-1, 0, 1, 0, -1, 1, 1, 1]);
  starGeo.setAttribute('position', new THREE.BufferAttribute(quadPos, 3));
  starGeo.setAttribute('aQuad', new THREE.BufferAttribute(quadUV, 2));
  starGeo.setIndex([0, 1, 2, 2, 1, 3]);
  const starPos = new Float32Array(STARS * 3);
  const starInfo = new Float32Array(STARS * 3);
  const starBang = new Float32Array(STARS * 4);
  for (let i = 0; i < STARS; i++) {
    starPos[i * 3] = (Math.random() * 2 - 1) * BOX_W;
    starPos[i * 3 + 1] = (Math.random() * 2 - 1) * BOX_H;
    starPos[i * 3 + 2] = Math.random() * BOX_DEPTH;
    starInfo[i * 3] = Math.pow(Math.random(), 5) * 1.4 + 0.05;
    starInfo[i * 3 + 1] = Math.random();
    starInfo[i * 3 + 2] = Math.random();
    // the pen's launch: a uniform direction on the sphere and a speed in
    // [0.5, 1.0] — theta uniform, phi = acos(2u − 1)
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 2 - 1);
    const speed = Math.random() * 0.5 + 0.5;
    starBang[i * 4] = speed * Math.sin(phi) * Math.cos(theta);
    starBang[i * 4 + 1] = speed * Math.sin(phi) * Math.sin(theta);
    starBang[i * 4 + 2] = speed * Math.cos(phi);
    starBang[i * 4 + 3] = Math.random(); // handover stagger, and the cluster it joins
  }
  starGeo.setAttribute('aStar', new THREE.InstancedBufferAttribute(starPos, 3));
  starGeo.setAttribute('aInfo', new THREE.InstancedBufferAttribute(starInfo, 3));
  starGeo.setAttribute('aBang', new THREE.InstancedBufferAttribute(starBang, 4));
  starGeo.instanceCount = STARS;
  const starU = {
    uTravel: { value: 0 },
    uSide: { value: 0 },
    uDepth: { value: BOX_DEPTH },
    uHalfW: { value: BOX_W },
    uHalfH: { value: BOX_H },
    uNear: { value: BOX_NEAR },
    uAspect: { value: ctx.width / Math.max(1, ctx.height) },
    uTime: { value: 0 },
    uTwinkle: { value: 0 },
    uBreath: { value: 1 },
    uOrder: { value: 0 },
    uTail: { value: 1 },
    uGain: { value: 0 },
    uFovK: { value: fovK },
    uFade: { value: 1 },
    uBang: { value: 1 }, // 1 = every particle sits in its bang slot (the cold open)
    uBangR: { value: 0 },
    uBangTail: { value: 0 },
    uBangGain: { value: 0 },
    uBangHeat: { value: 1 },
    uCluster: { value: 0 },
    uOrigin: { value: new THREE.Vector3(0, 0, BANG_Z) },
    uRes: { value: new THREE.Vector2(ctx.width, ctx.height) },
    uHole: { value: new THREE.Vector2(0, 0) },
    uWorm: { value: new THREE.Vector3(0, 0, 0) },
    uPal0: sp0, uPal1: sp1, uPal2: sp2,
    uIntensity: { value: 1 },
  };
  const starMat = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: starU,
    defines: { CLUSTERS },
    vertexShader: STAR_VERT,
    fragmentShader: STAR_FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const stars = new THREE.Mesh(starGeo, starMat);
  stars.frustumCulled = false;
  stars.renderOrder = 1; // below the object: a solid body occludes the field behind it
  scene.add(stars);

  // --- celestial object: one camera-facing quad, analytic bodies
  const objU = {
    uObjPos: { value: new THREE.Vector3(0, 0, -OBJ_SPAWN_Z) },
    uExtent: { value: 1 },
    uAspect: { value: ctx.width / Math.max(1, ctx.height) },
    uHole: { value: new THREE.Vector2(0, 0) },
    uWorm: { value: new THREE.Vector3(0, 0, 0) },
    uWarm: { value: 1 },
    uShape: { value: 0 },
    uScale: { value: 1 },
    uAlpha: { value: 0 },
    uPulse: { value: 0 },
    uLevel: { value: 0 },
    uWindow: { value: 1 },
    uTime: { value: 0 },
    uSeed: { value: 0.37 },
    uSway: { value: 0 },
    uIntensity: { value: 1 },
    uPal0: op0, uPal1: op1, uPal2: op2, uPal3: op3, uPal4: op4,
  };
  const objMat = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: objU,
    defines: { NEB_STEPS, WORLD_OCT, JUNK_N, WORLD_NORM: (1 / (1 - Math.pow(0.5, WORLD_OCT))).toFixed(6) },
    vertexShader: OBJ_VERT,
    fragmentShader: OBJ_FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
  });
  const objGeo = new THREE.PlaneGeometry(2, 2);
  const obj = new THREE.Mesh(objGeo, objMat);
  obj.frustumCulled = false;
  obj.renderOrder = 2;
  // Visible at creation ON PURPOSE: the engine warms a scene with
  // renderer.compileAsync, which walks the scene with traverseVisible, so a
  // mesh hidden here never has its program linked and the first body to
  // arrive links it inside a live frame instead — an 80 ms hitch at 1080p,
  // five dropped frames on the jump's exit flash. The first update() hides it
  // again (uAlpha is 0 until then, so nothing shows either way).
  obj.visible = true;
  scene.add(obj);

  // --- overlay: singularity, black hole, throat rim, glow, flash, veil
  const overU = {
    uRes: { value: new THREE.Vector2(ctx.width, ctx.height) },
    uTime: { value: 0 },
    uWarp: { value: 0 },
    uFlash: { value: 0 },
    uVeil: { value: 0 },
    uSing: { value: 0 },
    uIntensity: { value: 1 },
    uRoll: { value: 0 },
    uHole: { value: new THREE.Vector2(0, 0) },
    uMouth: { value: new THREE.Vector3(0, 0, 0) },
    uPal0: vp0, uPal1: vp1, uPal2: vp2, uPal3: vp3, uPal4: vp4,
  };
  const overMat = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: overU,
    vertexShader: OVER_VERT,
    fragmentShader: OVER_FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
  });
  const overGeo = new THREE.PlaneGeometry(2, 2);
  const overlay = new THREE.Mesh(overGeo, overMat);
  overlay.frustumCulled = false;
  overlay.renderOrder = 10;
  scene.add(overlay);

  // --- sky: the panorama behind the hole, the nebula behind the bang, and
  // the wormhole's throat (drawn first)
  const [kp0, kp1, kp2, kp3, kp4] = pal();
  const skyU = {
    uRes: { value: new THREE.Vector2(ctx.width, ctx.height) },
    uTime: { value: 0 },
    uSky: { value: 0 },
    uWarm: { value: 1 },
    uIntensity: { value: 1 },
    uRoll: { value: 0 },
    uYaw: { value: 0 },
    uMode: { value: 0 },
    uSeedA: { value: 0 },
    uSeedB: { value: 11.3 },
    uFlow: { value: 0 },
    uNebula: { value: 0 },
    uHole: { value: new THREE.Vector2(0, 0) },
    uThroat: { value: new THREE.Vector4(0.05, 0, 0, 1) },
    uPal0: kp0, uPal1: kp1, uPal2: kp2, uPal3: kp3, uPal4: kp4,
  };
  const skyMat = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: skyU,
    defines: { SKY_OCT },
    vertexShader: SKY_VERT,
    fragmentShader: SKY_FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation,
    blendSrc: THREE.OneFactor,
    blendDst: THREE.OneMinusSrcAlphaFactor,
  });
  const skyGeo = new THREE.PlaneGeometry(2, 2);
  const sky = new THREE.Mesh(skyGeo, skyMat);
  sky.frustumCulled = false;
  sky.renderOrder = 0;
  sky.visible = true; // linked at warm time, hidden by the first update — as above
  scene.add(sky);

  // Live bloom: nothing at rest — no effects with nothing applied — and the
  // pen's own numbers (strength 2, radius 0.5, threshold 0) while the bang,
  // a flash or the throat needs them.
  const bloom = { strength: 0, radius: 0.5, threshold: 0 };

  // --- state
  const approach = (v, to, tau, dt) => v + (to - v) * (1 - Math.exp(-dt / tau));
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const clampTo = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);
  const smooth = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const ease = (u) => u * u * (3 - 2 * u);

  const DARK = 0, BANG = 1, FLIGHT = 2;
  let phase = DARK;
  let warmFrames = 2; // see the note at the end of update()
  let firstFrame = true, playPrev = false, tpPrev = 0;
  let bangT = -1, singA = 0, flowT = 0;

  let travel = 0, side = 0, speed = 0, kick = 0;
  let warpS = 0, flash = 0, orderS = 0, breath = 1, fadeS = 1, scaleS = 1;
  let objGrowT = -1; // seconds since the current body was spawned; drives its growth from nothing
  let jumping = false, jumpT = -1, autoWarp = 0;
  let objActive = false, objShape = -1, objZ = -OBJ_SPAWN_Z, objX = 0, objY = 0, objAlpha = 0, objTarget = 0, objBase = 1, objSpawnDist = OBJ_SPAWN_Z;
  let seq = 0.618;
  let bankT = -1, bankSide = 0, roll = 0, yaw = 0, rollT = 0, yawT = 0;
  let holeT = -1, voidDone = false;
  let wormT = -1, wormDone = false, wormSwapped = false, wormSpeed = 1;
  // the mouth's lens on the star field — radius, pull, fade — smoothed, so no
  // stage of the transit can hand the field back in a single frame
  let mouthRS = 0, mouthPullS = 0, mouthFadeS = 0;
  let mass = 0, held = 0, veil = 0, skyA = 0;
  let seedA = 0, seedB = 11.3;
  let pulse = 0, beatPrev = 0;
  let aspect = ctx.width / Math.max(1, ctx.height);
  const padPrev = new Float32Array(PADS);

  // assignable parameters. Each placement parameter keeps the scene's own
  // random placement until the performer first moves it, so a project that
  // assigns nothing behaves exactly as it did before — and x and y hold that
  // separately, so binding one axis does not pin the other to the centre line.
  let scaleUser = 1, pendX = 0, pendY = 0, pendDist = OBJ_SPAWN_Z, nextShape = -1;
  let xSet = false, ySet = false, distSet = false;
  let paramWarp = 0, paramOrder = 0;

  function reseed() {
    seq = (seq * 9.731 + 0.317) % 1;
    travel += 1100 + seq * 800;
    side += 240 + seq * 200;
  }

  function spawnObject() {
    seq = (seq * 9.731 + 0.317) % 1;
    let shape;
    if (nextShape >= 0) shape = nextShape;
    else {
      shape = Math.floor(seq * SHAPES);
      if (shape === objShape) shape = (shape + 1) % SHAPES;
    }
    objShape = shape;
    const s2 = (seq * 7.13 + 0.51) % 1;
    const s3 = (seq * 3.77 + 0.23) % 1;
    const dist = distSet ? pendDist : OBJ_SPAWN_Z;
    objSpawnDist = dist;
    objZ = -dist;
    // the placement parameters are fractions of the half-frame at the spawn
    // distance, so ±1 is the frame edge whatever the distance is; an axis
    // nobody has assigned keeps its own scatter
    objX = xSet ? pendX * TAN_HALF * aspect * dist * 0.8 : (s2 - 0.5) * 0.34 * dist;
    objY = ySet ? pendY * TAN_HALF * dist * 0.8 : (s3 - 0.5) * 0.18 * dist;
    objBase = OBJ_SCALE[shape];
    objU.uSeed.value = (seq * 100) % 10;
    objU.uShape.value = shape;
    objActive = true;
    objAlpha = 0;
    objTarget = 1;
    objGrowT = 0;
  }

  function endJump() {
    flash = Math.max(flash, 0.8);
    if (holeT < 0 && wormT < 0) spawnObject();
  }

  // The cold open's ignition: the singularity flares and the universe runs.
  // Everything in flight is cleared first — a big bang starts a universe, it
  // does not continue one.
  function fireBang() {
    phase = BANG;
    bangT = 0;
    holeT = -1; wormT = -1; jumpT = -1; autoWarp = 0;
    mass = 0; held = 0; veil = 0; skyA = 0;
    objActive = false; objAlpha = 0; objTarget = 0; obj.visible = false;
    jumping = false; warpS = 0; kick = 0; speed = 0;
    bankT = -1;
    flash = 1.3;
    reseed();
  }

  function fireWormhole() {
    if (wormT >= 0) return;
    wormT = 0; wormDone = false; wormSwapped = false;
    holeT = -1;
    objTarget = 0; // whatever was ahead is left behind
  }

  // The hole's ending, on its own: a flash, a re-seeded sky and nothing in it.
  function swallow() {
    flash = Math.max(flash, 1.0);
    holeT = -1; wormT = -1; jumpT = -1; autoWarp = 0;
    mass = 0; held = 0;
    veil = 1;
    jumping = false;
    objActive = false; objTarget = 0; objAlpha = 0;
    speed = CRUISE;
    reseed();
  }

  return {
    scene,
    camera,
    bloom,
    update(dt, t, io) {
      // ---- the transport decides whether the universe has started, and the
      // POSITION is the ground truth, not the edge of `playing` on its own: a
      // scene sees the clock only on the frames the engine renders it, so a
      // show stopped and restarted while Will I Dream was off screen leaves
      // `playing` looking unchanged when it comes back. A clock that has
      // jumped BACKWARDS to the top since this scene last looked is a new run
      // of the show whether or not the scene was watching, and gets a new
      // universe; a clock well past the start is a show already underway, and
      // a scene arriving into that opens in the flight.
      const tp = io.transport || null;
      const playing = !!(tp && tp.playing);
      const tpTime = tp ? tp.time || 0 : 0;
      const atTop = tpTime < 0.5;
      // the clock has moved BACKWARDS since this scene last looked: a stop, a
      // scrub back, or a loop seam — whenever it happened, and whether or not
      // the scene was on screen to watch it happen
      const rewound = tpTime < tpPrev - 0.5;
      if (firstFrame) {
        firstFrame = false;
        if (playing && !atTop) { phase = FLIGHT; speed = CRUISE; }
        else if (playing) fireBang(); // created ON the downbeat: it still bangs
      } else if (playing && (!playPrev || rewound)) {
        // STOP then PLAY comes back at 0 and restarts the universe; PAUSE
        // then PLAY keeps its position and simply resumes the flight. A bang
        // already running is left alone, so a short loop cannot keep
        // re-igniting a universe it never lets finish.
        if (phase !== BANG) {
          if (atTop || rewound) fireBang();
          else if (phase === DARK) { phase = FLIGHT; speed = CRUISE; }
        }
      } else if (!playing && (playPrev || rewound)) {
        // a stop (position back at 0) returns the stage to the singularity;
        // a pause leaves the flight running
        if (atTop) { phase = DARK; bangT = -1; objActive = false; objTarget = 0; }
      }
      playPrev = playing;
      tpPrev = tpTime;

      // ---- hand → warp: speed on X, density on closeness, product = amount.
      // The `hyperspace jump` action and the `warp amount` parameter feed the
      // same number, so an assignment adds to the hand instead of fighting it.
      const sx = smooth(0.30, 1.0, io.xy.x);
      const sy = 1 - smooth(0.0, 0.70, io.xy.y);
      if (jumpT >= 0) {
        jumpT += dt;
        const fall = JUMP_LEN - 0.7;
        autoWarp = jumpT < 0.4 ? ease(jumpT / 0.4) : jumpT < fall ? 1 : 1 - ease((jumpT - fall) / 0.7);
        if (jumpT > JUMP_LEN) { jumpT = -1; autoWarp = 0; }
      }
      const handWarp = phase === FLIGHT ? sx * sy : 0;
      const warpRaw = Math.max(handWarp, autoWarp, paramWarp);
      warpS = approach(warpS, warpRaw, warpRaw > warpS ? 0.22 : 0.45, dt);
      if (phase === FLIGHT && wormT < 0) {
        if (!jumping && warpS > 0.55) jumping = true;
        else if (jumping && warpS < 0.25) { jumping = false; endJump(); }
      }
      orderS = approach(orderS, Math.max(clamp01(io.gestures.sway), paramOrder), 0.6, dt);

      // ---- pads: the no-assignment fallback. While the stage is dark ANY
      // pad ignites the universe, so a project with no timeline is never
      // stuck looking at nothing.
      for (let i = 0; i < PADS; i++) {
        const v = io.pads[i];
        if (v > padPrev[i] + 0.3) {
          if (phase === DARK) fireBang();
          else if (i === PAD_BLACKHOLE) { if (holeT < 0) { holeT = 0; voidDone = false; wormT = -1; } }
          else if (i === PAD_BANK_LEFT) { bankT = 0; bankSide = -1; }
          else if (i === PAD_BANK_RIGHT) { bankT = 0; bankSide = 1; }
          else kick = Math.max(kick, 0.6 + v * 0.4);
        }
        padPrev[i] = v;
      }
      if (io.beat > beatPrev + 0.3) pulse = 1;
      beatPrev = io.beat;
      pulse = Math.max(0, pulse - dt * 3.2);

      // ---- bank: the one rotation — roll and yaw in, level out
      rollT = 0; yawT = 0;
      if (bankT >= 0) {
        bankT += dt;
        const u = bankT / BANK_LEN;
        if (u >= 1) bankT = -1;
        else {
          const s = Math.sin(Math.PI * u);
          rollT = -bankSide * 0.5 * s;
          yawT = -bankSide * 0.16 * s;
          side += -bankSide * 55 * s * dt;
        }
      }
      roll = approach(roll, rollT, 0.12, dt);
      yaw = approach(yaw, yawT, 0.12, dt);
      camera.rotation.set(0, yaw, roll);

      // ---- black hole (Huffman's lens): the mass eases in, the hold takes us in
      let massT = 0, heldT = 0, veilT = 0;
      if (holeT >= 0) {
        holeT += dt;
        if (holeT < T_OPEN) {
          massT = 0.015; heldT = 0;
        } else if (holeT < T_SWALLOW) {
          const u = (holeT - T_OPEN) / (T_SWALLOW - T_OPEN);
          // the pen's held click: its hold value climbs 0.03 per frame and the
          // rings sweep inward; the mass grows until its own darkening
          // (pull · 0.25) covers the screen — the swallow from the center out
          heldT = u * 2.4;
          massT = 0.015 + 4.0 * u * u * u * u; // a long, fully-in-view hold before the darkening takes the screen
        } else if (holeT < T_VOID) {
          if (!voidDone) {
            voidDone = true;
            reseed();
            jumping = false;
            objActive = false; objTarget = 0; objAlpha = 0;
            speed = CRUISE;
            flash = 0;
          }
          veilT = 1;
        } else if (holeT < T_END) {
          veilT = 1 - ease((holeT - T_VOID) / (T_END - T_VOID));
        } else {
          holeT = -1;
        }
      }
      if (holeT >= 0 && holeT < T_SWALLOW) {
        mass = approach(mass, massT, 0.25, dt); // the pen eases cur toward target 3 % per frame
        held = heldT;
        veil = 0;
      } else if (holeT >= T_SWALLOW && holeT < T_END) {
        mass = 0; held = 0; veil = veilT;
      } else {
        mass = 0; held = 0; veil = approach(veil, 0, 0.1, dt);
      }

      // ---- wormhole: the throat opens, draws the flight in, and the transit
      // shows the sky ahead through the aperture and the sky behind on the
      // wall of the tube at the same time
      let apR = 0.05, wIn = 0, wRim = 0, wDark = 0, wWall = 1;
      // The mouth's hold on the star field runs through EVERY stage of the
      // transit, not just the two that open it. Dropping it at the draw-in /
      // transit boundary handed the field back in one frame — the stars sprang
      // out of the lens and 20× brighter at the exact moment the mouth is
      // supposed to be swallowing the frame — so these are targets now, eased
      // like fadeS rather than assigned raw.
      let mouthT = 0, pullT = 0, fadeT = 0;
      wormSpeed = 1;
      if (wormT >= 0) {
        wormT += dt;
        if (wormT < W_OPEN) {
          const u = ease(wormT / W_OPEN);
          apR = 0.02 + 0.16 * u;
          wRim = 0.4 * u; wDark = 0.35 * u;
          mouthT = apR; pullT = 0.6 * u; fadeT = 0.95 * u;
          wormSpeed = 1 + 0.7 * u;
        } else if (wormT < W_DRAW) {
          const u = ease((wormT - W_OPEN) / (W_DRAW - W_OPEN));
          apR = 0.18 + 1.55 * u * u;
          wRim = 0.4 + 0.5 * u; wDark = 0.35 * (1 - u * 0.7);
          mouthT = Math.min(apR, 0.95); pullT = 0.6 + 1.2 * u; fadeT = 0.95;
          wIn = smooth(0.5, 0.95, u);
          wormSpeed = 1.7 + 8 * u;
        } else if (wormT < W_TRANSIT) {
          const u = (wormT - W_DRAW) / (W_TRANSIT - W_DRAW);
          wIn = 1;
          // entering, the mouth sweeps out past the frame and the tube closes
          // around us; then the exit aperture grows as we run down the throat
          apR = u < 0.18 ? 1.73 - 1.62 * (u / 0.18) : 0.11 + 0.46 * Math.pow((u - 0.18) / 0.82, 2.0);
          wRim = 0.8; wWall = 1;
          // inside the tube the sky belongs to the wall: the mouth keeps the
          // field bent and held down across the whole frame
          mouthT = 0.95; pullT = 1.8; fadeT = 0.95;
          wormSpeed = 20;
          if (!wormSwapped && u > 0.5) wormSwapped = true;
        } else if (wormT < W_EXIT) {
          const u = (wormT - W_TRANSIT) / (W_EXIT - W_TRANSIT);
          wIn = 1 - ease(u);
          apR = 0.57 + 6.5 * u * u;
          wRim = 0.8 * (1 - u);
          // and lets it go as the aperture takes the screen — the new field
          // comes back with the new sky, over the exit, not on one frame
          mouthT = 0.95; pullT = 1.8 * (1 - ease(u)); fadeT = 0.95 * (1 - ease(u));
          wormSpeed = 20 * (1 - u) + 2;
          if (!wormDone && u > 0.5) {
            wormDone = true;
            flash = Math.max(flash, 1.0);
            seedA = seedB;
            seedB = (seedB * 7.13 + 3.1) % 97;
            reseed();
            jumping = false;
            // you come out of the throat at cruise, not at the speed it drew
            // you in with — otherwise the object waiting outside is in your
            // face before the flash has cleared
            speed = CRUISE;
            spawnObject();
          }
        } else {
          wormT = -1;
        }
      }
      // eased, so no stage boundary — and not the end of the transit either —
      // can return the field in a single frame. Below a thousandth the radius
      // is snapped to zero: a lens that never quite closes is a lens the star
      // shader keeps evaluating for the rest of the show.
      mouthRS = approach(mouthRS, mouthT, 0.12, dt);
      mouthPullS = approach(mouthPullS, pullT, 0.12, dt);
      mouthFadeS = approach(mouthFadeS, fadeT, 0.12, dt);
      if (wormT < 0 && mouthRS < 0.001) { mouthRS = 0; mouthPullS = 0; mouthFadeS = 0; }
      flowT += dt * 0.55;

      // ---- big bang, and the cold open before it
      let bangMix = 0, bangR = 0, bangTail = 0, bangGain = 1, bangHeat = 0, bangClus = 0;
      let nebulaT = 0, singT = 0, bloomT = 0;
      let speedT;
      if (phase === DARK) {
        // the whole population collapsed on the singularity, breathing
        bangMix = 1; bangHeat = 1; bangClus = 0;
        bangR = 1.05 + io.level * 0.85;
        bangGain = 0.00016 * (0.55 + io.level * 1.1);
        singT = 0.22 + io.level * 0.45;
        speedT = 0;
      } else if (phase === BANG) {
        bangT += dt;
        const u = bangT / BANG_LEN;
        // the pen's outward run, damped so the expansion ARRIVES: it settles
        // into the flight's own box instead of running off to infinity
        const decay = Math.exp(-bangT / BANG_TAU);
        bangR = BANG_R * (1 - decay);
        const rate = (BANG_R / BANG_TAU) * decay;
        bangTail = Math.min(70, rate * 0.055);
        bangHeat = Math.exp(-bangT * 0.5);
        bangClus = smooth(0.16, 0.44, u);
        bangMix = 1 - smooth(0.55, 0.99, u);
        bangGain = 0.6 + 2.2 * Math.exp(-bangT * 0.30);
        // the pen's nebula, as a wash BEHIND the expansion — never bright
        // enough to become the subject, and gone before the cruise
        nebulaT = 0.42 * smooth(0.26, 0.50, u) * (1 - smooth(0.68, 0.94, u));
        singT = 1 - smooth(0.0, 0.10, u);
        bloomT = 2.0 * (smooth(0.0, 0.04, u) * (1 - smooth(0.62, 0.97, u)));
        // the flight is already streaming under the handover, so the field
        // never stalls between the expansion and the cruise
        speedT = CRUISE * smooth(0.26, 0.72, u);
        if (bangT > BANG_LEN) { phase = FLIGHT; bangT = -1; }
      } else {
        speedT = CRUISE * (1 + warpS * WARP_GAIN) + kick * 160 + io.beat * 30;
        speedT *= wormSpeed;
      }

      // ---- flight: forward only; the jump multiplies speed, strikes kick it
      speed = approach(speed, speedT, speedT > speed ? 0.35 : 0.45, dt);
      kick = Math.max(0, kick - dt * 2.2);
      travel += speed * dt;
      flash = Math.max(0, flash - dt * 2.5);
      breath = approach(breath, 0.85 + io.level * 0.45, 0.2, dt);
      // the star's streak: where it was a shutter ago, longer in the jump
      // the streak is where the star was a shutter ago; the cap is a fill-rate
      // budget as much as a look — a longer tail spreads the same light thinner
      const tail = Math.min(BOX_DEPTH * 0.45, speed * (0.05 + warpS * 0.45) + warpS * 30);
      fadeS = approach(fadeS, 1 - wIn * 0.78, 0.15, dt);

      // ---- the object ahead: approach at flight speed; leave it on a jump
      if (objActive) {
        objZ += speed * dt * (jumping || wormT >= 0 ? 0.25 : 1);
        // a body starts to go as the flight reaches it, and a big body reaches
        // you first: the fade begins at its own radius, so nothing ever flies
        // through the lens (and nothing ever fills the frame with the most
        // expensive shader in the scene)
        // ...but never further out than half the distance it arrived from, so
        // turning `object scale` up does not dismiss a body that is still a
        // long way off
        const size = (objShape >= 0 ? OBJ_EXTENT[objShape] : 1) * objBase * scaleS;
        const nearZ = -Math.min(60 + size * 1.8, objSpawnDist * 0.6);
        if (jumping || objZ > nearZ) objTarget = 0;
        objAlpha = approach(objAlpha, objTarget, objTarget > objAlpha ? 1.2 : 0.3, dt);
        if ((objTarget === 0 && objAlpha < 0.01) || objZ > 30) objActive = false;
      } else {
        objAlpha = 0;
      }
      obj.visible = objActive && objAlpha > 0.002;
      scaleS = approach(scaleS, scaleUser, 0.12, dt);
      if (objGrowT >= 0) objGrowT = Math.min(GROW_LEN, objGrowT + dt);

      // ---- the sky: the panorama for the hole and the bang, the throat for
      // the wormhole. It comes in as the hole's mass fills the view, washes
      // in behind the young universe, and is the wormhole's own surface.
      let skyT;
      if (wormT >= 0) skyT = 1;
      else if (phase === BANG) skyT = nebulaT;
      else skyT = holeT >= 0 && holeT < T_SWALLOW ? Math.min(1, mass / 0.015) : 0;
      skyA = approach(skyA, skyT, skyT > skyA ? (wormT >= 0 ? 0.12 : 0.35) : 0.2, dt);
      sky.visible = skyA > 0.003;
      singA = approach(singA, singT, 0.25, dt);
      bloom.strength = Math.max(bloomT, flash * 0.9 + wRim * 0.5);

      // ---- uniforms
      const pl = io.palette;
      sp0.value.copy(pl[0]); sp1.value.copy(pl[1]); sp2.value.copy(pl[2]);
      op0.value.copy(pl[0]); op1.value.copy(pl[1]); op2.value.copy(pl[2]); op3.value.copy(pl[3]); op4.value.copy(pl[4]);
      vp0.value.copy(pl[0]); vp1.value.copy(pl[1]); vp2.value.copy(pl[2]); vp3.value.copy(pl[3]); vp4.value.copy(pl[4]);
      kp0.value.copy(pl[0]); kp1.value.copy(pl[1]); kp2.value.copy(pl[2]); kp3.value.copy(pl[3]); kp4.value.copy(pl[4]);

      starU.uTravel.value = travel;
      starU.uSide.value = side;
      starU.uTime.value = t;
      starU.uTwinkle.value = io.bands.high;
      starU.uBreath.value = breath;
      starU.uOrder.value = orderS;
      starU.uTail.value = tail;
      starU.uGain.value = warpS * 1.6 + io.bands.bass * 0.3;
      starU.uFade.value = fadeS;
      starU.uHole.value.set(mass, held);
      starU.uWorm.value.set(mouthRS, mouthPullS, mouthFadeS);
      starU.uBang.value = bangMix;
      starU.uBangR.value = bangR;
      starU.uBangTail.value = bangTail;
      starU.uBangGain.value = bangGain;
      starU.uBangHeat.value = bangHeat;
      starU.uCluster.value = bangClus;
      starU.uIntensity.value = io.intensity;

      objU.uTime.value = t;
      // `object scale` has a CEILING at the body's own distance: scaled past
      // it the eye ends up INSIDE the body, every ray misses, and the quad is
      // paying full-frame fill for nothing (the ceiling holds the window at
      // ~104 % of frame height, which is also the fill-rate guard).
      // The ceiling is the mapping, not a silent clamp: the knob's travel
      // ABOVE 1× is stretched into whatever headroom the distance leaves, so
      // the top of the range always reaches the ceiling and never dies
      // half-way — at the 900-unit default that ceiling is under 3×, so more
      // than half the declared range used to be the same picture. Below 1×
      // and wherever the full range fits (past ~1800 units) the mapping is
      // the identity, so a scale still means what it says.
      const ext = objShape >= 0 ? OBJ_EXTENT[objShape] : 1;
      const ceilScale = Math.max(0.05, -objZ / Math.max(ext * objBase * 1.6, 0.001));
      const topScale = Math.min(ceilScale, SCALE_MAX);
      let useScale = scaleS;
      if (scaleS > 1) useScale = 1 + (scaleS - 1) * ((Math.max(topScale, 1) - 1) / (SCALE_MAX - 1));
      useScale = Math.min(useScale, ceilScale);
      // Nothing appears at its size: a body GROWS out of the point it arrives
      // at — from (almost) nothing to its size over GROW_LEN, fast at first and
      // settling, an ease-out cubic — under the alpha that was always there.
      // The floor keeps the shader's 1/uScale finite on the first frame.
      const gu = objGrowT < 0 ? 1 : objGrowT / GROW_LEN;
      const grow = GROW_FLOOR + (1 - GROW_FLOOR) * (1 - (1 - gu) * (1 - gu) * (1 - gu));
      useScale *= grow;
      objU.uScale.value = objBase * useScale;
      objU.uExtent.value = ext * objBase * useScale;
      objU.uWindow.value = ext;
      objU.uAlpha.value = objAlpha;
      // the clock is the floor and the beat is the swing: a hit reads on the
      // body without the pulsar and the radiator strips going dead between
      // beats — and without the free-running sine masking io.beat, which is
      // what a max() of the two did
      objU.uPulse.value = 0.35 + 0.25 * Math.sin(t * 7.0) + 0.4 * pulse;
      objU.uLevel.value = io.level;
      objU.uObjPos.value.set(objX, objY, objZ);
      objU.uHole.value.set(mass, held);
      objU.uWorm.value.set(mouthRS, mouthPullS, mouthFadeS);
      objU.uIntensity.value = io.intensity;
      objU.uSway.value = orderS * 1.2;

      overU.uTime.value = t;
      overU.uWarp.value = warpS;
      overU.uFlash.value = flash;
      overU.uVeil.value = veil;
      overU.uSing.value = singA;
      overU.uIntensity.value = io.intensity;
      overU.uRoll.value = roll;
      overU.uHole.value.set(mass, held);
      overU.uMouth.value.set(Math.max(apR, 0.0001), wRim, wDark);

      skyU.uTime.value = t;
      skyU.uSky.value = skyA;
      skyU.uIntensity.value = io.intensity;
      skyU.uRoll.value = roll;
      skyU.uYaw.value = yaw;
      skyU.uMode.value = wormT >= 0 ? 1 : 0;
      skyU.uSeedA.value = seedA;
      skyU.uSeedB.value = seedB;
      skyU.uFlow.value = flowT;
      skyU.uNebula.value = nebulaT;
      skyU.uHole.value.set(mass, held);
      skyU.uThroat.value.set(Math.max(apR, 0.0001), wIn, wRim, wWall);

      // A shader program is translated by the driver at its FIRST DRAW THAT
      // RASTERISES, not when it is linked and not when it is merely bound:
      // the engine's compileAsync hands it over, but ANGLE keeps the HLSL
      // until fragments are actually wanted. The object quad and the sky quad
      // are hidden for most of this scene's life, so without this the driver
      // did that translation inside the live frame where the first body
      // arrives — measured once, on a cold shader cache, at 115 ms at 720 p
      // and 170 ms at 1080 p: ten dropped frames on the very flash that is
      // meant to reveal it. For the first two frames both quads are drawn
      // shrunk into a two-pixel patch in the corner with their output at zero
      // alpha: the driver gets a real rasterised draw and the stage gets
      // nothing to look at.
      // BE CLEAR ABOUT WHERE THAT COST LANDS. update() runs only while the
      // scene is VISIBLE (docs/SCENE_CONTRACT.md: the active scene, or the
      // incoming one mid-fade), so these two frames are the scene's first two
      // frames ON SCREEN — the head of the cut, or the head of the crossfade
      // where the incoming scene is still weighted near zero. The stall is
      // moved, not removed: out of the flash that reveals the first body and
      // into the transition that introduces the scene. Paying it genuinely
      // off screen needs a rasterising warm hook in the engine's `ready` /
      // compileAsync pipeline — a renderer-side change, not this file's.
      if (warmFrames > 0) {
        warmFrames--;
        obj.visible = true;
        sky.visible = true;
      } else {
        objU.uWarm.value = 0;
        skyU.uWarm.value = 0;
      }
    },
    // Discrete events. The router only delivers these while the scene is on
    // screen. Firing anything at a dark stage lights the universe first.
    action(key) {
      if (phase === DARK && key !== 'bigbang') fireBang();
      switch (key) {
        case 'bigbang': fireBang(); break;
        case 'blackhole': if (holeT < 0) { holeT = 0; voidDone = false; wormT = -1; } break;
        case 'hyperspace': jumpT = 0; break;
        case 'wormhole': fireWormhole(); break;
        case 'bankLeft': bankT = 0; bankSide = -1; break;
        case 'bankRight': bankT = 0; bankSide = 1; break;
        case 'thrust': kick = Math.max(kick, 1.0); break;
        case 'spawn': spawnObject(); break;
        case 'swallow': swallow(); break;
        default: break;
      }
    },
    // Continuous parameters, already mapped into the declared range.
    setParam(key, value) {
      const v = Number(value);
      if (!Number.isFinite(v)) return;
      switch (key) {
        case 'objectScale': scaleUser = clampTo(v, SCALE_MIN, SCALE_MAX); break;
        case 'objectX': pendX = clampTo(v, -1, 1); xSet = true; break;
        case 'objectY': pendY = clampTo(v, -1, 1); ySet = true; break;
        case 'objectDistance': pendDist = clampTo(v, 200, 2000); distSet = true; break;
        case 'objectNext': { const n = Math.round(clampTo(v, 0, SHAPES)); nextShape = n <= 0 ? -1 : n - 1; break; }
        case 'warpAmount': paramWarp = clamp01(v); break;
        case 'starDistribution': paramOrder = clamp01(v); break;
        default: break;
      }
    },
    resize(w, h) {
      aspect = w / Math.max(1, h);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
      starU.uAspect.value = aspect;
      objU.uAspect.value = aspect;
      starU.uRes.value.set(w, h);
      overU.uRes.value.set(w, h);
      skyU.uRes.value.set(w, h);
    },
    dispose() {
      starGeo.dispose();
      starMat.dispose();
      objGeo.dispose();
      objMat.dispose();
      overGeo.dispose();
      overMat.dispose();
      skyGeo.dispose();
      skyMat.dispose();
    },
  };
}
