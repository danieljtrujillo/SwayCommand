// Wormhole Pt 1 — a high-energy particle wormhole: a tunnel of glowing
// particles (radius 400, length 2500) streaming toward a fixed eye parked at
// its mouth, held on the throat by a confinement radius that a "zeta
// resonance" wobbles, spun along the wall by a tangential swirl, torn into
// turbulent foam by simplex noise and bent toward the hand. One scalar —
// STABILITY — runs the look: 1 is the stable beam (cool palette pair, tight
// wall, full swirl, no shake), 0 is the collapsing throat (warm palette pair,
// wobbling radius, foam, camera shake).
//
// Ported from DULA's CodePen "PIE: High-Energy Wormhole (V3 - Tuned)"
// (https://codepen.io/DULA2025/pen/dPXjxKQ, MIT, Copyright (c) 2026 DULA),
// re-written under docs/SCENE_CONTRACT.md. The pen simulated 1,048,576
// particles with GPUComputationRenderer — a position pass (pos += vel·dt,
// respawn at z = −2500 on a ring of radius 400·(0.8..1.2) once past z = 200)
// and a velocity pass (confinement toward a dynamic radius, a tangential
// spin force ·stability, simplex foam ·(1 − stability), a mouse warp force
// ·(1 − stability), forward acceleration toward 120·(0.3 + 0.7·stability),
// damping 0.96). A scene may not run compute passes, so the motion is
// re-expressed STATELESSLY in the vertex shader from per-particle seeds plus
// a few integrated scalars, the way swarm.js does it:
//
//   * z: the lap.  z = −2500 + mod(z0 + travel·sv, 2700), travel being the
//     forward distance integrated on the CPU (so bass swelling the speed
//     never snaps positions), sv a per-particle speed step. A particle that
//     passes z = 200 reappears at −2500 — the pen's respawn.
//   * radius: the pen's spring settles a spawned particle from its ring
//     radius r0 onto the dynamic radius within a second of a 22 s lap, so the
//     radius is mix(r0, 400 + zeta(z, t)·80·(1 − stability), settle(age)).
//   * swirl: the pen's spin force balances damping at ~125 units/s, i.e.
//     ~0.31 rad/s on the wall. Here each particle advances its angle by its
//     own rate (0.375..1.625 × that) times an integrated swirl phase that
//     only grows while stability is up — per-particle shearing flow, not a
//     rigid turn of the tube, and nothing at stability 0.
//   * foam: the pen's noise force against the confinement spring settles at
//     ~150 units of displacement, so the foam is a 3-D simplex offset of
//     that amplitude ·(1 − stability), evaluated as one coherent field.
//   * warp: the mouse pull becomes a translation of the beam toward the
//     hand target (±800 in tunnel xy), weighted by (1 − stability) over a
//     small floor so the hand always bends the beam, strongest at the eye.
//
// Controls: SWAY is stability (the morph), PRESS raises it while held (the
// pen's held click), a STRIKE is a zeta shock — a decaying burst that
// kicks the radius wobble, foam and shake and flushes the beam warm — the
// hand is the warp target, bass swells the forward speed, the beat pulses
// the brightness. Camera shake is (1 − stability)·3 of random translation,
// no roll; the eye sits at z = 200 looking down the tunnel and never turns.
// Colour keeps the pen's speed/stability logic with the two pairs drawn from
// io.palette each frame — the stable pair from the two coolest entries
// (toward white), the unstable pair from the two warmest. Two draw calls:
// the particle Points and the faint additive wireframe tunnel.

export const meta = {
  id: 'wormholept1',
  name: 'Wormhole Pt 1',
  mood: 'transluminal',
  bloom: { strength: 0.8, radius: 0.3, threshold: 0.85 },
};

const TUNNEL_RADIUS = 400;
const TUNNEL_LENGTH = 2500;
const LAP = TUNNEL_LENGTH + 200; // spawn at −2500, respawn past 200
const SPEED_STEPS = 9; // sv = 0.8 + k·0.05, k in 0..8, so 20·sv is an integer
const TRAVEL_WRAP = LAP * 20; // every sv·TRAVEL_WRAP is a whole number of laps
const SWIRL_BASE = 0.31 / 8; // rad/s per swirl step at full stability
const SWIRL_WRAP = (Math.PI * 2) / SWIRL_BASE; // every rate·SWIRL_WRAP is a whole turn

export function createScene(ctx) {
  const { THREE, quality } = ctx;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, ctx.width / ctx.height, 1, 4000);
  camera.position.set(0, 0, 200); // looks down −z: the tunnel

  const COUNT = quality.tier === 'low' ? 120000 : quality.tier === 'high' ? 600000 : 300000;

  // --- geometry: nothing but seeds; the shader does all the motion.
  // position = (z0 lap fraction, angle fraction, ring radius fraction),
  // aSeed = (swirl rate, speed step, foam jitter, colour jitter), all in [0,1).
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(COUNT * 3);
  const seed = new Float32Array(COUNT * 4);
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = Math.random();
    pos[i * 3 + 1] = Math.random();
    pos[i * 3 + 2] = Math.random();
    seed[i * 4] = Math.random();
    seed[i * 4 + 1] = Math.random();
    seed[i * 4 + 2] = Math.random();
    seed[i * 4 + 3] = Math.random();
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));

  const uniforms = {
    uTime: { value: 0 },
    uTravel: { value: 0 }, // integrated forward distance, wrapped at TRAVEL_WRAP
    uSwirl: { value: 0 }, // integrated swirl phase (∫stability dt), wrapped at SWIRL_WRAP
    uStab: { value: 0 }, // effective stability 0..1 (sway/press, knocked down by a shock)
    uShock: { value: 0 }, // zeta shock burst 0..1, strike-fired, decaying
    uSpeedZ: { value: 36 }, // current forward speed, for colour and point size
    uWarp: { value: new THREE.Vector2(0, 0) }, // hand target in tunnel xy (±800)
    uWarpW: { value: 0 }, // pull weight toward it
    uBright: { value: 1 }, // intensity × beat pulse
    uSize: { value: ctx.height / 1080 }, // resolution-stable point scale
    // fewer particles than the pen's million -> each one a little brighter
    uAlpha: { value: Math.min(1.8, Math.sqrt(1048576 / COUNT)) },
    uStableA: { value: new THREE.Color(0, 0.6, 0.9) },
    uStableB: { value: new THREE.Color(0.6, 0.9, 1) },
    uUnstableA: { value: new THREE.Color(0.9, 0.1, 0) },
    uUnstableB: { value: new THREE.Color(1, 0.7, 0.1) },
  };

  const mat = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    vertexShader: /* glsl */ `
      in vec4 aSeed; // x swirl rate, y speed step, z foam jitter, w colour jitter
      uniform float uTime, uTravel, uSwirl, uStab, uShock, uSpeedZ, uWarpW, uBright, uSize;
      uniform vec2 uWarp;
      uniform vec3 uStableA, uStableB, uUnstableA, uUnstableB;
      out vec3 vColor;
      out float vAlpha;

      const float TUNNEL_LENGTH = ${TUNNEL_LENGTH.toFixed(1)};
      const float TUNNEL_RADIUS = ${TUNNEL_RADIUS.toFixed(1)};
      const float LAP = ${LAP.toFixed(1)};
      const float SWIRL_BASE = ${SWIRL_BASE.toFixed(6)};

      // --- Ashima simplex noise (MIT), as the pen's velocity pass used it
      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
      vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
      float snoise(vec3 v) {
        const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
        const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
        vec3 i = floor(v + dot(v, C.yyy));
        vec3 x0 = v - i + dot(i, C.xxx);
        vec3 g = step(x0.yzx, x0.xyz);
        vec3 l = 1.0 - g;
        vec3 i1 = min(g.xyz, l.zxy);
        vec3 i2 = max(g.xyz, l.zxy);
        vec3 x1 = x0 - i1 + C.xxx;
        vec3 x2 = x0 - i2 + C.yyy;
        vec3 x3 = x0 - D.yyy;
        i = mod289(i);
        vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0))
                                        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
                                        + i.x + vec4(0.0, i1.x, i2.x, 1.0));
        float n_ = 0.142857142857;
        vec3 ns = n_ * D.wyz - D.xzx;
        vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
        vec4 x_ = floor(j * ns.z);
        vec4 y_ = floor(j - 7.0 * x_);
        vec4 x = x_ * ns.x + ns.yyyy;
        vec4 y = y_ * ns.x + ns.yyyy;
        vec4 h = 1.0 - abs(x) - abs(y);
        vec4 b0 = vec4(x.xy, y.xy);
        vec4 b1 = vec4(x.zw, y.zw);
        vec4 s0 = floor(b0) * 2.0 + 1.0;
        vec4 s1 = floor(b1) * 2.0 + 1.0;
        vec4 sh = -step(h, vec4(0.0));
        vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
        vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
        vec3 p0 = vec3(a0.xy, h.x);
        vec3 p1 = vec3(a0.zw, h.y);
        vec3 p2 = vec3(a1.xy, h.z);
        vec3 p3 = vec3(a1.zw, h.w);
        vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
        p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
        vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
        m = m * m;
        return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
      }

      // the pen's zeta resonance: three standing waves along z at the first
      // three zeta zeros' frequencies, wobbling the confinement radius
      float zetaResonance(float z, float t) {
        return sin(z * 0.01 + t * 1.41347)
             + 0.5 * sin(z * 0.02 - t * 2.10220)
             + 0.25 * sin(z * 0.05 + t * 2.50108);
      }

      void main() {
        // --- the lap: forward travel through the tunnel, respawn at −2500
        float sv = 0.8 + floor(aSeed.y * ${SPEED_STEPS}.0) * 0.05; // 0.8..1.2 in 0.05 steps
        float z = -TUNNEL_LENGTH + mod(position.x * LAP + uTravel * sv, LAP);
        float age = (z + TUNNEL_LENGTH) / LAP; // 0 at spawn, 1 at the eye

        // --- radius: the ring it spawned on, settling onto the dynamic
        // radius that the zeta resonance wobbles when stability is low (a
        // shock kicks the wobble harder)
        float r0 = TUNNEL_RADIUS * (0.8 + 0.4 * position.z);
        float wob = (1.0 - uStab) + uShock * 2.0;
        float dynR = TUNNEL_RADIUS + zetaResonance(z, uTime) * 80.0 * wob;
        float r = mix(r0, dynR, 1.0 - exp(-age * 30.0));

        // --- swirl: per-particle angular advance on an integrated phase
        float rateStep = 3.0 + floor(aSeed.x * 10.999); // 3..13 steps
        float theta = position.y * 6.2831853 + uSwirl * rateStep * SWIRL_BASE;
        vec3 p = vec3(cos(theta) * r, sin(theta) * r, z);

        // --- foam: one coherent simplex field, (1 − stability) plus shock
        float foamAmp = (1.0 - uStab) * 150.0 + uShock * 60.0;
        float foamSpeed = 0.0;
        if (foamAmp > 0.5) {
          vec3 q = p * 0.01 + uTime * 0.6 + aSeed.z * 0.15;
          vec3 n = vec3(snoise(q), snoise(q + 10.0), snoise(q + 20.0));
          p += n * foamAmp;
          foamSpeed = foamAmp * 2.0 * length(n);
        }

        // --- warp: the beam bends toward the hand, most at the eye
        p.xy += uWarp * uWarpW * mix(0.3, 1.0, age);

        // --- colour from the pen's speed/stability logic
        float tang = 125.0 * uStab * rateStep * 0.125;
        float speed = uSpeedZ * sv + tang + foamSpeed;
        float sm = clamp(speed * 0.005, 0.0, 1.0);
        vec3 colStable = mix(uStableA, uStableB, sm);
        vec3 colUnstable = mix(uUnstableA, uUnstableB, sm);
        float st = clamp(uStab + (aSeed.w - 0.5) * 0.2, 0.0, 1.0);
        vColor = mix(colUnstable, colStable, st) * (1.0 + speed * 0.005) * uBright;

        float fog = smoothstep(2000.0, 0.0, abs(p.z));
        vAlpha = 0.2 + fog * 0.8;

        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float px = uSize * 400.0 * (1.0 + speed * 0.02) / max(-mv.z, 1.0);
        gl_PointSize = min(px, 64.0 * uSize); // cap fill cost as particles pass the eye
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uAlpha;
      in vec3 vColor;
      in float vAlpha;
      out vec4 fragColor;
      void main() {
        vec2 cxy = 2.0 * gl_PointCoord - 1.0;
        float r = dot(cxy, cxy);
        if (r > 1.0) discard;
        float glow = pow(1.0 / (r * 8.0 + 0.1), 1.2); // the pen's glow sprite
        // the targets are half-float, so the additive alpha is not clamped by
        // the blend; cap it so a hot core cannot run away under bloom
        // the pen ran this under Reinhard tone mapping; without it the additive
        // sum of a few hundred thousand sprites whites out, so each sprite is
        // held lower and the alpha is capped at one — the colour survives
        float a = min(vAlpha * glow * 0.8 * uAlpha, 1.0);
        fragColor = vec4(vColor * 0.55, a);
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false; // real positions live in the shader
  scene.add(points);

  // --- the faint additive wireframe tunnel (the pen's 48 × 40 open cylinder,
  // opacity ~0.1, FogExp2 0.0008), baked into place along −z and bent toward
  // the hand like the beam; tint from the palette by stability
  const cylGeo = new THREE.CylinderGeometry(TUNNEL_RADIUS, TUNNEL_RADIUS, TUNNEL_LENGTH, 48, 40, true);
  cylGeo.rotateX(-Math.PI / 2);
  cylGeo.translate(0, 0, -TUNNEL_LENGTH / 2);
  const wireGeo = new THREE.WireframeGeometry(cylGeo);
  cylGeo.dispose(); // WireframeGeometry copied what it needs
  const lineUniforms = {
    uWarp: uniforms.uWarp,
    uWarpW: uniforms.uWarpW,
    uTint: { value: new THREE.Color(0, 1, 1) },
    uOpacity: { value: 0.1 },
  };
  const lineMat = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: lineUniforms,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    vertexShader: /* glsl */ `
      uniform vec2 uWarp;
      uniform float uWarpW;
      out float vFog;
      void main() {
        vec3 p = position;
        float age = (p.z + ${TUNNEL_LENGTH.toFixed(1)}) / ${LAP.toFixed(1)};
        p.xy += uWarp * uWarpW * mix(0.3, 1.0, age);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        float d = length(mv.xyz) * 0.0008; // FogExp2 density
        vFog = exp(-d * d);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uTint;
      uniform float uOpacity;
      in float vFog;
      out vec4 fragColor;
      void main() { fragColor = vec4(uTint, uOpacity * vFog); }`,
  });
  const tunnel = new THREE.LineSegments(wireGeo, lineMat);
  tunnel.frustumCulled = false;
  scene.add(tunnel);

  // --- preallocated scratch + scalar state
  const white = new THREE.Color(1, 1, 1);
  const order = [0, 1, 2, 3, 4]; // palette indices sorted cool -> warm, in place
  const warmth = [0, 0, 0, 0, 0];
  const warpTarget = new THREE.Vector2();
  let stab = 0; // smoothed stability (sway, lifted by press)
  let shock = 0; // zeta shock energy, strike-fired
  let strikePrev = 0; // last frame's strike energy, for rising-edge detection
  let travel = 0; // forward distance, wrapped
  let swirl = 0; // ∫ stability dt, wrapped

  return {
    scene,
    camera,
    update(dt, t, io) {
      const u = uniforms;

      // STRIKE (rising edge): a zeta shock — the throat buckles, foams and
      // shakes, then settles over ~1.5 s
      if (io.strike > strikePrev + 0.25) shock = 1;
      strikePrev = io.strike;
      shock *= Math.pow(0.08, dt);

      // SWAY is stability; PRESS (the pen's held click) lifts it toward 1
      const target = io.gestures.sway + (1 - io.gestures.sway) * io.gestures.press;
      stab += (target - stab) * (1 - Math.exp(-dt / 0.35));
      const stabEff = stab * (1 - shock * 0.85);

      // forward speed: the pen's 120·(0.3 + 0.7·stability), swollen by bass;
      // integrated so the particles never snap when it changes
      const speedZ = 120 * (0.3 + 0.7 * stab) * (1 + io.bands.bass * 0.8);
      travel = (travel + speedZ * dt) % TRAVEL_WRAP;
      swirl = (swirl + stabEff * dt) % SWIRL_WRAP;

      // hand: the warp target in tunnel xy (the pen's (mouse·2 − 1)·800),
      // eased; the pull weight rides (1 − stability) over a small floor
      warpTarget.set((io.xy.x - 0.5) * 1600, (io.xy.y - 0.5) * 1600);
      u.uWarp.value.lerp(warpTarget, 1 - Math.exp(-dt / 0.25));
      u.uWarpW.value = 0.1 + 0.3 * (1 - stabEff);

      u.uTime.value = t;
      u.uTravel.value = travel;
      u.uSwirl.value = swirl;
      u.uStab.value = stabEff;
      u.uShock.value = shock;
      u.uSpeedZ.value = speedZ;
      u.uBright.value = io.intensity * (1 + io.beat * 0.35);

      // palette: sort the five entries cool -> warm by (r − b), in place
      for (let i = 0; i < 5; i++) {
        const c = io.palette[i];
        warmth[i] = c.r - c.b;
        order[i] = i;
      }
      for (let i = 1; i < 5; i++) {
        const k = order[i];
        let j = i - 1;
        while (j >= 0 && warmth[order[j]] > warmth[k]) { order[j + 1] = order[j]; j--; }
        order[j + 1] = k;
      }
      // stable pair: the two coolest, the bright end pulled toward white;
      // unstable pair: the two warmest
      u.uStableA.value.copy(io.palette[order[0]]);
      u.uStableB.value.copy(io.palette[order[1]]).lerp(white, 0.55);
      u.uUnstableA.value.copy(io.palette[order[4]]);
      u.uUnstableB.value.copy(io.palette[order[3]]).lerp(white, 0.3);

      // tunnel: tinted warm -> cool by stability, the pen's opacity pulse
      lineUniforms.uTint.value
        .copy(io.palette[order[4]])
        .lerp(io.palette[order[0]], stabEff)
        .multiplyScalar(io.intensity);
      lineUniforms.uOpacity.value = 0.05 + 0.1 * Math.sin(t * 5 * (1.5 - stabEff));

      // camera shake: (1 − stability)·3 of random translation, the shock
      // adds its own; no roll, the eye keeps looking down the tunnel
      const shake = (1 - stabEff) * 3 + shock * 6;
      camera.position.x = (Math.random() - 0.5) * shake;
      camera.position.y = (Math.random() - 0.5) * shake;
    },
    resize(w, h) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      uniforms.uSize.value = h / 1080; // keep point size resolution-stable
    },
    dispose() {
      geo.dispose();
      mat.dispose();
      wireGeo.dispose();
      lineMat.dispose();
    },
  };
}
