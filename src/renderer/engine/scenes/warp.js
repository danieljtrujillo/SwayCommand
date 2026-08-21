// Wormhole — a gravitational throat rendered on one fullscreen quad.
// The screen radius is warped through r' = (throat/r)^flare so the walls
// curve away into an event horizon and the centre reads as a luminous
// aperture instead of a black vanishing point; the angle is dragged by a
// lensing term twist/(r+eps) so material spirals in rather than sliding
// down a cylinder. The wall carries four stacked layers — fbm plasma, a
// triangular tech lattice with hard neon nodes, fine scanline/data-strip
// filigree, and a kaleidoscopic angular fold whose segment count rides the
// treble — all hue-travelling with depth so the corridor reads iridescent.
// Streaking stars fly past outside the throat. SWAY morphs the tunnel's
// topology, not its spin: the flare exponent (funnel <-> corridor), the
// lensing twist rate, and the kaleidoscope fold count all glide with it.
// A STRIKE (pad rising edge, or press crossing its arm threshold through a
// Schmitt latch) fires the HYPERSPACE JUMP: a scripted charge → launch →
// cruise → settle sequence driven by one CPU scalar, and re-seeds the
// flight phase so the corridor re-patterns as the whiteout clears.
// One draw call, GLSL1.
// Follows docs/SCENE_CONTRACT.md; reference style: beams.js.

export const meta = { id: 'warp', name: 'Wormhole', mood: 'transluminal' };

const PADS = 16;
const TAU = Math.PI * 2;

// --- hyperspace jump script (seconds). One CPU scalar walks these four
//     segments; every eased value is computed here and pushed as a uniform.
const J_CHARGE = 0.12; // throat clamps down, colour bleaches, pressure rises
const J_LAUNCH = 0.35; // slingshot: streaks, chromatic split, white blowout
const J_CRUISE = 0.70; // corridor of stretched light, heavy smear
const J_SETTLE = 0.90; // everything eases back into normal flight
const J_T1 = J_CHARGE;          // 0.12
const J_T2 = J_T1 + J_LAUNCH;   // 0.47
const J_T3 = J_T2 + J_CRUISE;   // 1.17
const J_T4 = J_T3 + J_SETTLE;   // 2.07 — total sequence length

const PRESS_ARM = 0.72;   // press must cross this upward to fire a jump
const PRESS_REARM = 0.52; // ...and fall back under this before it can fire again
const PAD_ARM = 0.25;     // and a pad must land at least this hard

// Flight distance wraps here, so the hash inputs stay small enough for float32
// to keep the noise clean. Every structured zr consumer has a period that
// divides 1024 — rings 1.0, lattice 1.0 and 1024/443, scan TAU/SCANF, strips
// 1/4 (and their 256-cell id ring), hue 1/16, ring hue 1/8, star cells 1.0 at
// 0.3125x and 0.5x over a 64-cell id ring — so those layers cross the wrap
// without moving. The one exception is the fbm plasma: value noise is not
// periodic, so the soft gas underlay reshuffles on the wrap frame. At flight
// speed that lands once every few minutes and reads as a flicker in the
// dimmest layer; making it seamless needs a tiling noise, not a constant.
const PHASE_WRAP = 1024.0;

export function createScene(ctx) {
  const { THREE, quality } = ctx;
  const scene = new THREE.Scene();
  // fullscreen quad: the vertex shader emits clip-space directly, so the
  // camera is only here to satisfy the contract shape
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // --- quality ladder: octave count and the extra star/data layers scale
  //     with the tier so the fill cost stays inside an integrated GPU
  const tier = quality.tier;
  const defines = { FBM_OCT: tier === 'high' ? 4 : tier === 'low' ? 2 : 3 };
  if (tier !== 'low') {
    defines.STARS2 = 1;    // second, finer star layer
    defines.DATASTRIP = 1; // flickering data strips on the wall
  }
  // kaleidoscope fold range, also tier-scaled (more folds = finer angular
  // detail = more work per pixel near the throat)
  const FOLD_MIN = 3;
  const FOLD_SPAN = tier === 'high' ? 10 : tier === 'low' ? 4 : 7;

  // --- palette uniforms: five preallocated colors, .copy()'d every frame
  const palette = [
    new THREE.Color(), new THREE.Color(), new THREE.Color(),
    new THREE.Color(), new THREE.Color(),
  ];

  const quadGeo = new THREE.PlaneGeometry(2, 2);
  const quadMat = new THREE.ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    defines,
    uniforms: {
      uTime: { value: 0 },
      uAspect: { value: ctx.width / Math.max(1, ctx.height) },
      uPixel: { value: 2 / Math.max(1, ctx.height) }, // screen units per pixel
      uPhase: { value: 0 },   // flight distance, integrated CPU-side
      uRot: { value: 0 },     // barrel roll, integrated CPU-side
      uHue: { value: 0 },     // palette travel offset, integrated CPU-side
      uLens: { value: 0.35 }, // gravitational swirl strength
      uSkew: { value: 0 },    // sway skews the swirl off-axis
      uThroat: { value: 0.8 },// aperture radius in screen units
      uFlare: { value: 1.32 },// radial flare exponent (funnel vs. corridor)
      uFolds: { value: 5 },   // kaleidoscope segments, treble-driven
      uCenter: { value: new THREE.Vector2(0, 0) }, // off-axis throat centre
      uBass: { value: 0 },
      uMid: { value: 0 },
      uHigh: { value: 0 },
      uBeat: { value: 0 },
      uLevel: { value: 0 },
      uGlow: { value: 0 },    // pulse gesture boosts every emissive term
      // --- jump uniforms, all eased on the CPU
      uJump: { value: 0 },      // 0..1 normalized progress through the script
      uJumpPhase: { value: 0 }, // 0..4: 0-1 charge, 1-2 launch, 2-3 cruise, 3-4 settle
      uStreak: { value: 1 },    // star elongation
      uWhite: { value: 0 },     // desaturation / whiteout
      uAber: { value: 0 },      // radial chromatic aberration
      uFlash: { value: 0 },     // aperture blowout
      uBlur: { value: 0 },      // motion-blur / light-corridor feel
      uColors: { value: palette },
      uIntensity: { value: 1 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0); // fullscreen, no matrices
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uAspect, uPixel;
      uniform float uPhase, uRot, uHue;
      uniform float uLens, uSkew, uThroat, uFlare, uFolds;
      uniform float uBass, uMid, uHigh, uBeat, uLevel, uGlow;
      uniform float uJump, uJumpPhase, uStreak, uWhite, uAber, uFlash, uBlur;
      uniform float uIntensity;
      uniform vec2  uCenter;
      uniform vec3  uColors[5];
      varying vec2  vUv;

      const float TAU = 6.2831853;
      // Scanline filigree frequency, radians per zr unit. Nudged 0.016% off
      // 28.0 so PHASE_WRAP * SCANF is an exact multiple of TAU (4564 cycles)
      // and the flight wrap leaves the filigree phase untouched.
      const float SCANF = 28.0043532;

      // wrap-around lerp across all five palette entries, t in [0..5)
      vec3 pal(float t) {
        vec3 c = mix(uColors[0], uColors[1], clamp(t, 0.0, 1.0));
        c = mix(c, uColors[2], clamp(t - 1.0, 0.0, 1.0));
        c = mix(c, uColors[3], clamp(t - 2.0, 0.0, 1.0));
        c = mix(c, uColors[4], clamp(t - 3.0, 0.0, 1.0));
        return mix(c, uColors[0], clamp(t - 4.0, 0.0, 1.0));
      }

      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float vnoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float a = hash21(i);
        float b = hash21(i + vec2(1.0, 0.0));
        float c = hash21(i + vec2(0.0, 1.0));
        float d = hash21(i + vec2(1.0, 1.0));
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }

      const mat2 ROT2 = mat2(0.80, 0.60, -0.60, 0.80); // decorrelate octaves

      float fbm(vec2 p) {
        float v = 0.0;
        float amp = 0.5;
        for (int i = 0; i < FBM_OCT; i++) {
          v += amp * vnoise(p);
          p = ROT2 * p * 2.03 + vec2(7.3, 3.1);
          amp *= 0.5;
        }
        return v;
      }

      // narrow bright band centred in each unit cell — deep black between
      float pulse(float x, float w) {
        return smoothstep(w, 0.0, abs(fract(x) - 0.5));
      }

      // aperture falloff; sampled three times to split the throat by channel
      float apert(float x) {
        return 1.0 / (1.0 + x * x * 8.0);
      }

      // one streaking star layer. Cells live in (angle, 1/r) so a fixed star
      // sits at constant sc and drifts outward as the flight phase advances;
      // dividing the radial offset by the streak factor smears it into a line.
      float starLayer(float a, float r, float ph, float cols, float seed, float streak) {
        float sc = ph + 2.2 / r;
        float sa = (a / TAU + 0.5) * cols;
        // 64 divides both layers' wrap strides (1024*0.3125 and 1024*0.5), so
        // the star identities survive PHASE_WRAP instead of re-randomising
        vec2 id = vec2(mod(floor(sa), cols), mod(floor(sc), 64.0));
        float h = hash21(id + seed);
        float dx = fract(sa) - 0.15 - 0.70 * fract(h * 41.7);
        float dy = (fract(sc) - 0.15 - 0.70 * fract(h * 91.3)) / streak;
        float mag = 0.45 + 0.55 * fract(h * 13.1);
        return step(0.70, h) * mag * exp(-(dx * dx + dy * dy) * 400.0);
      }

      void main() {
        // --- screen -> centred, aspect-correct plane; uCenter banks the
        //     throat off-axis as the viewer leans around the hole
        vec2 q = (vUv - 0.5) * 2.0;
        q.x *= uAspect;
        vec2 p = q - uCenter;
        float r = length(p);
        // atan(0,0) is undefined in GLSL (NaN on some drivers) and every radial
        // term below divides by r, so pin the exact centre pixel off-axis.
        if (r < 1.0e-4) { p = vec2(1.0e-4, 0.0); r = 1.0e-4; }
        float a = atan(p.y, p.x);
        float ar = r / max(uThroat, 1.0e-3);   // radius in throat widths

        // --- gravitational lensing: the angular drag blows up toward the
        //     throat, so the wall visibly spirals in. Sway skews it so the
        //     hole drags harder on one side than the other.
        float lens = uLens / (r + 0.10);
        lens *= 1.0 + uSkew * cos(a * 2.0 - uTime * 0.35);
        float ang = a + uRot + lens;

        // --- flared throat, not a cylinder: depth = (throat/r)^flare runs
        //     away toward the centre, so ring spacing compresses into an
        //     event horizon instead of a straight tunnel's self-similar
        //     spacing. Clamped so the singularity never aliases.
        float rn = max(ar, 0.05);
        float z = min(pow(1.0 / rn, uFlare), 60.0);
        float zr = z * 1.6 + uPhase;
        zr += uBass * 0.55 * sin(a * 3.0 + uTime * 1.3); // bass buckles the wall

        // Closed-form derivatives -> analytic anti-alias, so no fwidth (and
        // no derivatives extension) is needed. Radial: d(zr)/dr = flare*z/r.
        float dzr = 1.6 * uFlare * z / r * uPixel;  // zr cycles per pixel
        float aaR = clamp(dzr * 1.6, 0.0, 1.0);
        float aaS = clamp(dzr * SCANF * 0.8, 0.0, 1.0);

        // --- kaleidoscopic fold: mirror the angle into uFolds wedges. The
        //     cell count per wedge is fixed, so the lattice stays legible
        //     however many segments the treble asks for.
        float seg = TAU / max(uFolds, 1.0);
        float ka = abs(mod(ang, seg) - seg * 0.5);
        float kc = (ka / seg) * 6.0;

        // Angular derivative of the folded coordinate: the 1/r tangential
        // term plus the lensing swirl's radial term. Without this the
        // lattice shatters into sparkle as the fold count climbs.
        float rl = r + 0.10;
        float aaA = clamp(12.0 / seg * (1.0 / r + uLens / (rl * rl)) * uPixel, 0.0, 1.0);
        float aaW = max(aaR, aaA); // wall-detail blur budget

        // --- layer 1: fbm plasma breathing across the wall (mid band)
        float plasma = clamp(fbm(vec2(kc * 1.7, zr * 0.25) + vec2(uTime * 0.05, 0.0)), 0.0, 1.0);
        plasma = smoothstep(0.26 - uMid * 0.10, 0.86, plasma);
        plasma = mix(plasma, 0.45, aaA * 0.8); // dissolve to the mean, not noise

        // --- layer 2: triangular tech lattice (three line families at ~60
        //     degrees) with hard neon edges and bright nodes at the vertices.
        //     kc spans whole cells, so the mirrored fold seam is invisible.
        //     886/1024 stands in for sqrt(3) so the two diagonal families
        //     advance by exactly 443 cells across PHASE_WRAP and the flight
        //     wrap cannot shear the lattice; 0.09% off equilateral is invisible.
        vec2 g = vec2(kc, zr * 0.5);
        float l1 = abs(fract(g.x) - 0.5);
        float l2 = abs(fract(dot(g, vec2(0.5, 0.865234375))) - 0.5);
        float l3 = abs(fract(dot(g, vec2(-0.5, 0.865234375))) - 0.5);
        float lm = min(min(l1, l2), l3);
        float grid = smoothstep(0.055 + aaW * 0.42 + uBlur * 0.05, 0.0, lm);
        float node = smoothstep(0.30 + aaW * 0.10, 0.0, l1 + l2 + l3);
        node *= node; // tighten to a hard spark at each lattice vertex

        // --- layer 3: fine scanline filigree + flickering data strips (high)
        // max() guards the pow base: sin() is only approximate at large
        // arguments, and a base a hair under zero makes pow() NaN, which would
        // punch a black/white hole straight through the frame.
        float scan = pow(max(0.5 + 0.5 * sin(zr * SCANF), 0.0), 5.0) * (1.0 - aaS);
        float strip = 0.0;
        #ifdef DATASTRIP
        float sid = hash21(vec2(floor(kc * 4.0), mod(floor(zr * 4.0), 256.0) + mod(floor(uTime * 7.0), 64.0)));
        strip = step(0.62, sid) * pulse(zr * 4.0, 0.42) * (1.0 - aaW);
        #endif

        // --- layer 4: hard neon rings, split radially into RGB by the jump
        float rw = 0.14 + aaR * 0.55 + uBlur * 0.22;
        float ao = uAber * (0.05 + 0.40 * r);
        float rgR = pulse(zr + ao, rw);
        float rgG = pulse(zr, rw);
        float rgB = pulse(zr - ao, rw);
        vec3 rings = vec3(rgR * rgR, rgG * rgG, rgB * rgB);

        // --- iridescence: every layer reads the palette at its own depth
        float hd = zr * 0.0625 + uHue;
        vec3 cPlasma = pal(fract(hd) * 5.0);
        vec3 cGrid   = pal(fract(hd + 0.34) * 5.0);
        vec3 cFine   = pal(fract(hd + 0.67) * 5.0);
        vec3 cRing   = pal(fract(zr * 0.125 + uHue + 0.15) * 5.0);

        vec3 wall = cPlasma * plasma * (0.30 + uMid * 1.30);
        wall += cGrid * grid * (0.36 + uBass * 0.80) * (0.35 + 0.65 * plasma);
        wall += mix(cGrid, vec3(1.0), 0.65) * node * (0.90 + uBeat * 2.20 + uHigh * 1.10);
        wall += cFine * (scan * (0.10 + uHigh * 1.25) + strip * (0.08 + uHigh * 0.75));
        wall += cRing * rings * (0.50 + uBeat * 1.60 + uGlow * 0.55);

        // the throat lights its own walls: brightest deep down the funnel,
        // falling away toward the camera so the frame corners go to black
        // without a post vignette (the compositor owns that).
        float lit = 0.06 + 0.94 * smoothstep(0.08, 2.4, z);
        float wallFade = smoothstep(uThroat * 0.09, uThroat * 0.28, r);
        vec3 col = wall * lit * wallFade;

        // --- star field outside the throat, elongating with flight speed
        float sMask = smoothstep(uThroat * 0.30, uThroat * 1.05, r);
        float st = starLayer(a, r, uPhase * 0.3125, 44.0, 0.0, uStreak);
        #ifdef STARS2
        st += starLayer(a, r, uPhase * 0.5, 72.0, 7.3, uStreak * 1.7) * 0.6;
        #endif
        col += mix(vec3(1.0), uColors[4], 0.30) * st * sMask
             * (0.55 + uLevel * 0.90 + uGlow * 0.50);

        // --- jump: soft radial light shafts smear the corridor during blur.
        //     Each angular cell gets its own width and brightness, and the
        //     radial profile ramps out of the throat and decays outward, so
        //     the shafts read as light rather than flat wedges.
        float rc = (a / TAU + 0.5) * 84.0;
        float rh = hash21(vec2(mod(floor(rc), 84.0), 11.0));
        float shaft = smoothstep(0.06 + 0.30 * fract(rh * 7.3), 0.0, abs(fract(rc) - 0.5));
        float ray = shaft * smoothstep(0.52, 1.0, rh) * uBlur
                  * smoothstep(0.30, 1.05, ar) * exp(-ar * 0.55);
        col += mix(uColors[2], vec3(1.0), 0.55) * ray * 2.4;

        // --- jump: charge whine, compression shells rushing into the throat
        float chg = clamp(1.0 - uJumpPhase, 0.0, 1.0) * step(0.0005, uJump);
        float whine = pulse(z * 5.0 - uJump * 70.0, 0.30);
        col += mix(uColors[1], vec3(1.0), 0.50) * whine * whine * chg * 1.8 * wallFade;

        // --- the aperture: a luminous throat, never a black vanishing point
        float ca = uAber * 0.10;
        float a0 = apert(ar - ca);
        float a1 = apert(ar);
        float a2 = apert(ar + ca);
        vec3 apc = vec3(a0 * a0, a1 * a1, a2 * a2);
        vec3 coreCol = mix(uColors[4], vec3(1.0),
                           clamp(0.35 + uFlash * 0.55 + uBeat * 0.20, 0.0, 1.0));
        col += coreCol * apc * (0.90 + uBeat * 1.60 + uFlash * 3.40 + uGlow * 0.80);
        col += mix(uColors[4], uColors[3], 0.5) * apert(ar * 0.5)
             * (0.20 + uBeat * 0.40 + uFlash * 1.20);
        // hot near-white singularity at the very centre of the aperture
        // (a lightness shift of the palette accent, not an unpalettised white)
        float hot = apert(ar * 2.6);
        col += mix(uColors[4], vec3(1.0), 0.80)
             * hot * hot * (0.45 + uBeat * 0.90 + uFlash * 2.00);

        // event-horizon rim: a hard bright ring at the lip of the throat
        float ee = (ar - 0.32) * 9.0;
        float rim = exp(-ee * ee);
        col += mix(uColors[3], vec3(1.0), clamp(0.30 + uFlash * 0.50, 0.0, 1.0))
             * rim * (0.45 + uBass * 1.20 + uBeat * 0.90);

        // --- jump: bleach toward white, then flood the frame from the throat
        float lum = max(max(col.r, col.g), col.b);
        col = mix(col, vec3(lum), uWhite * 0.85);
        col += vec3(uWhite * uWhite * 0.60 * smoothstep(1.6, 0.0, r));

        gl_FragColor = vec4(col * uIntensity, 1.0);
      }`,
  });
  const quad = new THREE.Mesh(quadGeo, quadMat);
  quad.frustumCulled = false; // clip-space quad, skip culling
  scene.add(quad);

  const u = quadMat.uniforms;

  // --- smoothed / integrated CPU state (preallocated; update() allocates
  //     nothing). Speed is accumulated into `phase` so a change of tempo
  //     never jumps the pattern.
  let phase = 0;
  let rot = 0;
  let hue = 0;
  let lens = 0.35;
  let skew = 0;
  let swayS = 0; // smoothed sway -> tunnel topology morph position
  let centerY = 0;
  let press = 0;
  let bassS = 0;
  let highS = 0;

  // --- jump state
  const prevPads = new Float32Array(PADS); // preallocated rising-edge memory
  // Schmitt latch on press. io.gestures.press is a raw, unsmoothed CC (the
  // mouse fallback snaps it 0<->1), so a bare threshold test would re-fire on
  // every frame of a held press and chatter on jitter around the edge. The
  // latch disarms on the strike and only re-arms once press falls back under
  // PRESS_REARM, so one press == one jump however long it is held.
  let pressArmed = false;
  let jumpT = -1; // < 0 == idle

  return {
    scene,
    camera,
    update(dt, t, io) {
      // --- STRIKE: rising edge on any pad past PAD_ARM, or press crossing
      //     PRESS_ARM upward through the latch. Both fire the same jump.
      let strike = false;
      for (let i = 0; i < PADS; i++) {
        const v = io.pads[i];
        if (v > PAD_ARM && v > prevPads[i] + 0.06) strike = true;
        prevPads[i] = v;
      }
      const pr = io.gestures.press;
      if (pressArmed) {
        // every genuine upward crossing fires, fast stab or slow lean alike
        if (pr >= PRESS_ARM) { strike = true; pressArmed = false; }
      } else if (pr < PRESS_REARM) {
        pressArmed = true; // 0.20 of hysteresis before another jump is possible
      }
      // re-arm once the launch is spent, so a roll of hits keeps jumping.
      // Each jump also re-seeds the flight phase: every zr-keyed layer
      // (rings, lattice, strips, star cells) lands on a fresh stretch of
      // corridor, so the tunnel re-patterns behind the charge flash.
      if (strike && (jumpT < 0 || jumpT > J_T2)) {
        jumpT = 0;
        phase += Math.random() * PHASE_WRAP;
        if (phase >= PHASE_WRAP) phase -= PHASE_WRAP;
      }

      // --- scripted jump: one scalar walks charge -> launch -> cruise ->
      //     settle, and every easing lands in a uniform. No allocation.
      let jBoost = 1;
      let jSquash = 0;
      let jFlare = 0;
      let jWhite = 0;
      let jStreak = 0;
      let jAber = 0;
      let jFlash = 0;
      let jBlur = 0;
      let jPhaseN = 0;
      if (jumpT >= 0) {
        jumpT += dt;
        if (jumpT >= J_T4) {
          jumpT = -1; // sequence complete; every j* stays at its rest value
        } else if (jumpT < J_T1) {
          // CHARGE (0.12 s) — throat clamps down, colour bleaches to white,
          // flight stalls while the compression shells whine inward
          const s = jumpT / J_CHARGE;
          const e = s * s;
          jPhaseN = s;
          jBoost = 1 - e * 0.4;
          jSquash = e;
          jFlare = e * 0.55;
          jWhite = e * 0.5;
          jStreak = e * 1.8;
          jAber = e * 0.14;
          jFlash = e * 0.7;
          jBlur = e * 0.18;
        } else if (jumpT < J_T2) {
          // LAUNCH (0.35 s) — slingshot to ~8x, stars smear to full-length
          // streaks, channels split radially, the aperture blows out white
          const s = (jumpT - J_T1) / J_LAUNCH;
          const e = s * s * (3 - 2 * s);
          jPhaseN = 1 + s;
          jBoost = 0.6 + e * 7.6;
          jSquash = 1 - e;
          jFlare = 0.55 - e * 0.95;
          jWhite = 0.5 + e * 0.5;
          jStreak = 1.8 + e * 17.0;
          jAber = 0.14 + e * 0.86;
          jFlash = 0.7 + e * 0.3;
          jBlur = 0.18 + e * 0.82;
        } else if (jumpT < J_T3) {
          // CRUISE (0.70 s) — the funnel flattens into a corridor of
          // stretched light; heavy smear, colour still washed out
          const s = (jumpT - J_T2) / J_CRUISE;
          const e = s * s * (3 - 2 * s);
          jPhaseN = 2 + s;
          jBoost = 8.2 - e * 3.0;
          jFlare = -0.4 + e * 0.15;
          jWhite = 1 - e * 0.55;
          jStreak = 18.8 - e * 6.0;
          jAber = 1 - e * 0.45;
          jFlash = 1 - e * 0.55;
          jBlur = 1 - e * 0.12;
        } else {
          // SETTLE (0.90 s) — ease-out cubic back to flight, colour
          // returning through the palette as the whiteout drains
          const s = (jumpT - J_T3) / J_SETTLE;
          const k = 1 - s;
          const e = 1 - k * k * k;
          const inv = 1 - e;
          jPhaseN = 3 + s;
          jBoost = 5.2 - e * 4.2;
          jFlare = -0.25 * inv;
          jWhite = 0.45 * inv;
          jStreak = 12.8 * inv;
          jAber = 0.55 * inv;
          jFlash = 0.45 * inv;
          jBlur = 0.88 * inv;
        }
      }

      // --- smoothed audio envelopes (swell instead of flicker)
      const ks = 1 - Math.exp(-dt * 4.0);
      bassS += (io.bands.bass - bassS) * ks;
      highS += (io.bands.high - highS) * (1 - Math.exp(-dt * 2.5));

      // --- continuous controls, all lerped so mouse jumps stay fluid.
      // Sway is the topology morph: it deepens the flare, speeds the
      // lensing twist, and (below) raises the fold count. The skew keeps
      // only a mild off-axis drag so the morph reads as shape, not lean.
      const k = 1 - Math.exp(-dt * 6.0);
      swayS += (io.gestures.sway - swayS) * k;
      skew += ((io.gestures.sway - 0.5) * 0.5 - skew) * k;
      centerY += ((io.xy.y - 0.5) * 0.55 - centerY) * k;
      press += (io.gestures.press - press) * k;
      lens += (0.30 + io.bands.mid * 0.45 + io.level * 0.35 + (swayS - 0.5) * 0.55 - lens) * k;

      // --- accumulated flight: level sets the base rate, the jump multiplies
      //     it. Integrating means speed changes never jump the phase.
      phase += dt * (0.55 + io.level * 4.2 + bassS * 1.2) * jBoost;
      if (phase >= PHASE_WRAP) phase -= PHASE_WRAP;
      rot += dt * (0.10 + (io.xy.x - 0.5) * 1.4 + io.bands.mid * 0.30);
      if (rot > TAU) rot -= TAU; else if (rot < -TAU) rot += TAU;
      hue += dt * (0.02 + io.bands.mid * 0.05);
      if (hue > 1) hue -= 1;

      u.uTime.value = t;
      u.uPhase.value = phase;
      u.uRot.value = rot;
      u.uHue.value = hue;
      u.uLens.value = lens * (1 + jBlur * 1.4);
      u.uSkew.value = skew;
      // bass swells the throat, press narrows it, the charge clamps it shut
      u.uThroat.value = Math.max(
        0.12,
        0.80 * (1 - press * 0.50) * (1 + bassS * 0.28) * (1 - jSquash * 0.55),
      );
      // flare: sway morphs the radius profile — a shallow corridor at low
      // sway deepening into a gravity funnel at high — bass swells it, the
      // jump flattens it
      u.uFlare.value = Math.max(0.4, 1.22 + (swayS - 0.5) * 0.85 + bassS * 0.30 + jFlare);
      // kaleidoscope folds: treble snaps between counts (DMT geometry) and
      // sway glides the whole range upward as the topology morph deepens
      u.uFolds.value =
        FOLD_MIN + Math.round(Math.min(1, highS * 0.6 + swayS * 0.7) * FOLD_SPAN);
      u.uCenter.value.set(Math.sin(t * 0.19) * 0.10, centerY);
      u.uBass.value = bassS;
      u.uMid.value = io.bands.mid;
      u.uHigh.value = io.bands.high;
      u.uBeat.value = io.beat;
      u.uLevel.value = io.level;
      u.uGlow.value = io.gestures.pulse;

      u.uJump.value = jumpT >= 0 ? jumpT / J_T4 : 0;
      u.uJumpPhase.value = jPhaseN;
      u.uStreak.value = 1 + io.level * 2.0 + jStreak;
      u.uWhite.value = jWhite;
      u.uAber.value = jAber;
      u.uFlash.value = jFlash;
      u.uBlur.value = jBlur;
      u.uIntensity.value = io.intensity;

      // palette animates upstream — copy all five every frame, never mutate
      for (let i = 0; i < 5; i++) palette[i].copy(io.palette[i]);
    },
    resize(w, h) {
      u.uAspect.value = w / Math.max(1, h); // ortho quad ignores the camera aspect
      // screen units per pixel, for the analytic anti-alias. CSS pixels are
      // used deliberately: at DPR > 1 this over-estimates and simply blurs
      // a touch early, which is the safe direction.
      u.uPixel.value = 2 / Math.max(1, h);
    },
    dispose() {
      quadGeo.dispose();
      quadMat.dispose();
    },
  };
}
