// Tunnel Ending — a flight down a corridor of glowing floor and ceiling
// tiles: Rizki Gunawan's CodePen "Threejs SciFi Flight"
// (https://codepen.io/mrizkigunawan/pen/NPNjQdE), MIT License, Copyright (c)
// 2026 Rizki Gunawan, ported to the scene contract.
//
// The pen: 800 unit planes lying flat (rotation.x = -pi/2) on integer lanes
// x = round(rand * 30) - 15.5 (31 lanes, 30 units wide), in two rows, floor
// y = 0 and ceiling y = 4, at depths z = round(rand * -80) - 0.5, each a flat
// MeshBasicMaterial in one of five hex colours (0x4e5dff, 0x6a00ff, 0x00c8ff,
// 0x12005e, 0x03204d), scrolling toward the camera at 0.05 per frame and
// wrapping from z > 4 back to -81; FogExp2 black at 0.02; the camera at
// (0, 2, 5), fov 75, near 0.1, far 100; UnrealBloom strength 3, radius 0,
// threshold 0; and camera.rotation.z += 0.0006 every frame.
//
// CHANGES FROM THE ORIGINAL:
//   * The autonomous roll is gone (hard rule 8 — nothing rotates by itself).
//     The camera rolls only as far as the hand SWAYS, and levels when the
//     sway does.
//   * The 800 meshes (800 draw calls, 800 materials) are ONE InstancedMesh
//     under one GLSL3 ShaderMaterial. Each instance carries its lane, row,
//     depth offset and palette slot in a static attribute; the scroll
//     z = 4 - (LOOP - mod(z0 + travel, LOOP)) * comp is evaluated in the
//     vertex shader, so the CPU pushes only uniforms each frame. FogExp2 is
//     evaluated in the fragment shader with three.js's own formula
//     (1 - exp(-(d * depth)^2) toward the fog colour).
//   * The five hex colours become the five io.palette entries (slot i -> the
//     i-th entry), copied into a uniform array every frame; the flat emissive
//     look is kept, scaled by io.intensity.
//   * The pen's 60 Hz frame step (0.05 units) becomes a cruise of 3 units/s
//     in dt time.
//
// Controls (nothing moves on its own but the scroll):
//   FLIGHT   forward only. io.level lifts the cruise speed (3 -> ~9 u/s); a
//            pad STRIKE (io.strike rising edge) is a speed kick — a burst of
//            up to +30 u/s that decays over ~0.6 s.
//   HAND     x slides the eye across the corridor (the range follows the
//            corridor width); y lifts it between floor and ceiling (the
//            pen's y = 2 at the centre). The eye looks straight down the
//            corridor otherwise.
//   SWAY     the morph dimension, and the roll: the corridor tightens — lane
//            pitch 1 -> 0.3 (30 -> 9 units wide), the floor-ceiling gap
//            4 -> 2.4, the depth field compresses toward the eye (the same
//            tiles pack into half the length, so the tunnel doubles in
//            density) with the fog thickening to keep the far end hidden
//            and the tile footprint shrinking with the pitch so the tiling
//            never overlaps — and the camera rolls up to ~43 degrees,
//            hand-driven, no accumulation.
//   PRESS    narrows the corridor further (pitch x 0.45, gap x 0.65).
//   BEAT     flashes the tile colours toward white.
//   BASS     thickens the fog glow: the fog density rises and the fog colour
//            lifts from black toward a faint palette tint, so the deep tunnel
//            hazes on the low end.
//
// One draw call (400 / 800 / 1400 tiles by tier). Bloom is the pen's,
// requested through meta.bloom (strength 3, radius 0, threshold 0). All
// colour derives from io.palette, copied per frame. GLSL3 shaders.
// (docs/SCENE_CONTRACT.md)

export const meta = {
  id: 'tunnelending',
  name: 'Tunnel Ending',
  mood: 'transluminal',
  bloom: { strength: 3, radius: 0, threshold: 0 },
};

const LOOP = 85;        // depth cycle: the pen wraps from z > 4 back to -81
const RESET_Z = 4;      // the wrap point, just ahead of the eye at z = 5
const LANES = 31;       // pen: round(rand * 30) -> 0..30
const LANE_OFFSET = -15.5;
const GAP = 4;          // floor y = 0, ceiling y = 4
const CRUISE = 3;       // pen: 0.05 units per frame at 60 Hz
const KICK_SPEED = 30;  // strike kick, units/s at full kick
const ROLL_MAX = 0.75;  // sway roll, radians
const FOG_D = 0.02;     // pen: FogExp2 density

export function createScene(ctx) {
  const { THREE, quality } = ctx;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, ctx.width / ctx.height, 0.1, 100);
  camera.position.set(0, 2, 5);

  const COUNT = quality.tier === 'high' ? 1400 : quality.tier === 'low' ? 400 : 800;

  // --- one unit tile lying flat (the pen's PlaneGeometry(1, 1) rotated -pi/2
  // about x), instanced COUNT times. Per-instance: lane x, row, depth offset
  // z0 (0.5..80.5 — the pen's initial z plus 81) and palette slot.
  const geo = new THREE.PlaneGeometry(1, 1);
  geo.rotateX(-Math.PI * 0.5);
  const inst = new Float32Array(COUNT * 4);
  for (let i = 0; i < COUNT; i++) {
    inst[i * 4] = Math.round(Math.random() * (LANES - 1)) + LANE_OFFSET;
    inst[i * 4 + 1] = Math.round(Math.random());
    inst[i * 4 + 2] = Math.round(Math.random() * 80) + 0.5;
    inst[i * 4 + 3] = Math.floor(Math.random() * 5);
  }
  geo.setAttribute('aInst', new THREE.InstancedBufferAttribute(inst, 4));

  const pal = new Float32Array(15); // the five palette entries, copied per frame
  const mat = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    side: THREE.DoubleSide,
    uniforms: {
      uTravel: { value: 0 },        // forward distance, kept in [0, LOOP)
      uPitch: { value: 1 },         // lane pitch and tile width (1 = the pen)
      uGap: { value: GAP },         // floor-to-ceiling height
      uComp: { value: 1 },          // depth compression (1 = the pen's 85-unit field)
      uFogD: { value: FOG_D },      // FogExp2 density
      uFogCol: { value: new THREE.Color(0, 0, 0) },
      uPal: { value: pal },
      uBeat: { value: 0 },
      uIntensity: { value: 1 },
    },
    vertexShader: /* glsl */ `
      #define LOOP ${LOOP.toFixed(1)}
      #define RESET_Z ${RESET_Z.toFixed(1)}
      in vec4 aInst;      // lane x, row (0 floor / 1 ceiling), z0, palette slot
      uniform float uTravel, uPitch, uGap, uComp, uBeat, uIntensity;
      uniform vec3 uPal[5];
      out vec3 vCol;
      out float vDepth;
      void main() {
        // the pen's scroll: z = -81 + mod(z0 + travel, 85); under compression
        // the wrap point holds at 4 and the far end draws in toward the eye
        float zRel = mod(aInst.z + uTravel, LOOP);
        float z = RESET_Z - (LOOP - zRel) * uComp + position.z * uComp;
        float x = (aInst.x + position.x) * uPitch;
        float y = aInst.y * uGap;
        vec4 mv = modelViewMatrix * vec4(x, y, z, 1.0);
        gl_Position = projectionMatrix * mv;
        vDepth = -mv.z;
        // flat emissive colour from the slot's palette entry; the beat
        // lifts it toward white
        vec3 c = uPal[int(aInst.w)];
        c = mix(c, vec3(1.0), uBeat * 0.3) * (1.0 + uBeat * 0.4);
        vCol = c * uIntensity;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uFogD, uIntensity;
      uniform vec3 uFogCol;
      in vec3 vCol;
      in float vDepth;
      out vec4 fragColor;
      void main() {
        // three.js FogExp2: 1 - exp(-(density * depth)^2)
        float f = 1.0 - exp(-uFogD * uFogD * vDepth * vDepth);
        fragColor = vec4(mix(vCol, uFogCol * uIntensity, f), 1.0);
      }`,
  });

  const tiles = new THREE.InstancedMesh(geo, mat, COUNT);
  tiles.frustumCulled = false; // positions live in the shader
  const identity = new THREE.Matrix4();
  for (let i = 0; i < COUNT; i++) tiles.setMatrixAt(i, identity); // the shader ignores it
  tiles.instanceMatrix.needsUpdate = true;
  scene.add(tiles);

  // --- state
  let travel = 0;     // forward distance, wrapped at LOOP (mod-invariant)
  let speed = CRUISE;
  let kick = 0;       // strike kick energy, decays
  let swayS = 0;      // smoothed sway -> corridor morph + roll
  let pressS = 0;     // smoothed press -> narrowing
  let camX = 0;
  let camY = 2;
  let strikePrev = 0; // last frame's strike energy, for rising-edge detection

  const approach = (v, to, tau, dt) => v + (to - v) * (1 - Math.exp(-dt / tau));

  return {
    scene,
    camera,
    update(dt, t, io) {
      const bass = io.bands.bass;

      // sway morphs the corridor; press narrows it; both smoothed
      swayS = approach(swayS, io.gestures.sway, 0.25, dt);
      pressS = approach(pressS, io.gestures.press, 0.15, dt);
      const pitch = (1 - 0.7 * swayS) * (1 - 0.55 * pressS);
      const gap = GAP * (1 - 0.4 * swayS) * (1 - 0.35 * pressS);
      const comp = 1 - 0.5 * swayS;

      // strike (pad-energy rising edge) kicks the speed
      if (io.strike > strikePrev + 0.25) kick = Math.max(kick, 0.6 + 0.4 * io.strike);
      strikePrev = io.strike;
      kick = Math.max(0, kick - dt * 1.8);

      // forward only: the level lifts the cruise, the kick punches it
      const targetSpeed = CRUISE * (1 + 2 * io.level) + kick * KICK_SPEED;
      speed = approach(speed, targetSpeed, targetSpeed > speed ? 0.25 : 0.9, dt);
      // the depth field is compressed by comp, so the scroll runs 1/comp
      // faster in field units to hold the apparent speed in world units
      travel = (travel + (speed * dt) / comp) % LOOP;

      // the hand steers: x across the corridor (range follows the width),
      // y between floor and ceiling (the pen's y = 2 at centre, gap 4)
      camX = approach(camX, (io.xy.x - 0.5) * (LANES * 0.5 * pitch) * 0.7, 0.3, dt);
      camY = approach(camY, gap * (0.25 + 0.5 * io.xy.y), 0.3, dt);
      camera.position.set(camX, camY, 5);
      // the roll is the sway's, set — never accumulated
      camera.rotation.set(0, 0, swayS * ROLL_MAX);

      // palette: slot i -> entry i, copied every frame
      for (let k = 0; k < 5; k++) {
        const pk = io.palette[k];
        pal[k * 3] = pk.r;
        pal[k * 3 + 1] = pk.g;
        pal[k * 3 + 2] = pk.b;
      }

      const u = mat.uniforms;
      u.uTravel.value = travel;
      u.uPitch.value = pitch;
      u.uGap.value = gap;
      u.uComp.value = comp;
      // fog: the pen's 0.02, rising with compression so the far end stays
      // hidden (density x depth held), thickened by bass; the fog colour
      // lifts from black toward a palette tint on the low end
      u.uFogD.value = (FOG_D / comp) * (1 + 0.4 * bass);
      u.uFogCol.value.copy(io.palette[0]).multiplyScalar(bass * bass * 0.16);
      u.uBeat.value = io.beat;
      u.uIntensity.value = io.intensity;
    },
    resize(w, h) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },
    dispose() {
      tiles.dispose(); // frees the instanceMatrix GPU buffer
      geo.dispose();
      mat.dispose();
    },
  };
}
