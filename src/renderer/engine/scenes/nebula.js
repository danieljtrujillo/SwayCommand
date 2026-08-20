// Nebula — a fullscreen fbm gas cloud turned psychedelic.
// The original three-layer domain-warp foundation is intact (value-noise fbm
// layers warping each other into gas folds on one quad), but the field is now
// mirror-folded into a slowly spinning kaleidoscope, contoured into hard neon
// filaments, and coloured by a full five-stop palette ramp whose hue travels
// with density — so the gas reads iridescent and layered instead of a dim teal
// smudge. Bass stacks concentric shells, mid drives the warp, treble strobes a
// scintillation layer, beats punch the domain, and each of the sixteen pads
// fires its own expanding shockwave from a pad-indexed screen position.
// One quad, one draw call. Follows docs/SCENE_CONTRACT.md; style: beams.js,
// fullscreen-quad + palette-array plumbing after warp.js.

export const meta = { id: 'nebula', name: 'Nebula', mood: 'psychedelic' };

const PADS = 16;
const TAU = Math.PI * 2;
const FLOOR = 0.70; // minimum peak channel a palette stop is lifted to

export function createScene(ctx) {
  const { THREE, quality } = ctx;
  const scene = new THREE.Scene();
  // fullscreen quad: the vertex shader emits clip-space directly, so the
  // camera is only here to satisfy the contract shape
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const LOW = quality.tier === 'low';
  const HIGH = quality.tier === 'high';

  // --- shockwave slots. Fixed-size uniform array with a compile-time loop
  //     bound; the slot count rides the tier along with the octave counts,
  //     because every slot costs two exp() per pixel whether it is live or not.
  const PULSE_N = LOW ? 4 : (HIGH ? 8 : 6);

  // fbm octaves and the near layer scale with the tier; every count reaching
  // the shader is a #define so GLSL1 sees literal, unrollable loop bounds.
  // OCT_MAIN is paid twice per pixel (layers 2 and 3), so it is the single
  // most expensive knob here — med stays at 3 to hold 60 fps at 1080p on an
  // integrated GPU, and the amplitude normalisation below keeps the 0..1
  // range (and every threshold keyed off it) identical across tiers.
  const defines = {
    OCT_WARP: LOW ? 1 : (HIGH ? 3 : 2), // warp-vector fbm (evaluated twice)
    OCT_MAIN: HIGH ? 4 : 3,             // the two gas-density fbm layers
    PULSE_N,
  };
  if (!LOW) defines.LAYER3 = 1; // low tier drops the near (third) fbm layer

  // --- palette uniforms: five preallocated colors, .copy()'d every frame
  const palette = [
    new THREE.Color(), new THREE.Color(), new THREE.Color(),
    new THREE.Color(), new THREE.Color(),
  ];

  // --- pad shockwave ring: PULSE_N slots of (x, y, radius, energy) in the
  //     same centered aspect-corrected space the shader works in. This exact
  //     Float32Array is the uniform value — three.js uploads flat arrays for
  //     vec4[] directly, so the per-frame path is mutate-in-place, no copies.
  const pulses = new Float32Array(PULSE_N * 4);

  const geo = new THREE.PlaneGeometry(2, 2);
  const mat = new THREE.ShaderMaterial({
    depthWrite: false,
    depthTest: false,
    defines,
    uniforms: {
      uTime: { value: 0 },
      uAspect: { value: ctx.width / ctx.height },
      uPan: { value: new THREE.Vector2(0, 0) },   // hand parallax
      uHue: { value: 0 },     // integrated hue travel (time + level)
      uRot: { value: 0 },     // kaleidoscope mirror spin, integrated
      uFold: { value: 0.4 },  // 0 = free gas, 1 = hard mandala
      uLevel: { value: 0 },
      uBass: { value: 0 },    // smoothed CPU-side, see update()
      uMid: { value: 0 },
      uHigh: { value: 0 },
      uBeat: { value: 0 },
      uKick: { value: 0 },    // fast beat envelope, drives the domain lurch
      uSway: { value: 0.5 },
      uPress: { value: 0 },
      uBloom: { value: 0 },   // io.gestures.pulse
      uIntensity: { value: 1 },
      uColors: { value: palette },
      uPulse: { value: pulses },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = vec4(position.xy, 0.0, 1.0); // fullscreen, no matrices
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime, uAspect, uHue, uRot, uFold;
      uniform vec2  uPan;
      uniform float uLevel, uBass, uMid, uHigh, uBeat, uKick;
      uniform float uSway, uPress, uBloom, uIntensity;
      uniform vec3  uColors[5];
      uniform vec4  uPulse[PULSE_N];
      varying vec2 vUv;

      const float SEGMENTS = 6.0;                        // mirrored wedges
      const mat2 ROT2 = mat2(0.80, 0.60, -0.60, 0.80);   // decorrelate octaves

      // hand-rolled hash -> bilinear value noise -> normalized fbm
      float hash(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }
      float vnoise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        vec2 u = f * f * (3.0 - 2.0 * f);
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
      }
      // both fbms divide by the accumulated amplitude, so the 0..1 range —
      // and therefore every threshold below — is identical on every tier
      float fbmW(vec2 p) {          // cheap fbm feeding the warp vector
        float v = 0.0;
        float amp = 0.5;
        float nrm = 0.0;
        for (int i = 0; i < OCT_WARP; i++) {
          v += amp * vnoise(p);
          nrm += amp;
          p = ROT2 * p * 2.03 + vec2(7.3, 3.1);
          amp *= 0.5;
        }
        return v / nrm;
      }
      float fbmM(vec2 p) {          // full fbm for the gas density layers
        float v = 0.0;
        float amp = 0.5;
        float nrm = 0.0;
        for (int i = 0; i < OCT_MAIN; i++) {
          v += amp * vnoise(p);
          nrm += amp;
          p = ROT2 * p * 2.03 + vec2(7.3, 3.1);
          amp *= 0.5;
        }
        return v / nrm;
      }

      // wrap-around lerp across all five palette entries, t in [0..5)
      vec3 pal(float t) {
        vec3 c = mix(uColors[0], uColors[1], clamp(t, 0.0, 1.0));
        c = mix(c, uColors[2], clamp(t - 1.0, 0.0, 1.0));
        c = mix(c, uColors[3], clamp(t - 2.0, 0.0, 1.0));
        c = mix(c, uColors[4], clamp(t - 3.0, 0.0, 1.0));
        return mix(c, uColors[0], clamp(t - 4.0, 0.0, 1.0));
      }

      // mirror-fold the domain into SEGMENTS wedges. amt blends the folded
      // coordinate against the free one, so the field breathes between loose
      // gas and a hard mandala without the angle ever jumping.
      vec2 kaleido(vec2 v, float rot, float amt) {
        float r = length(v);
        // atan(0,0) is undefined in GLSL1 and returns NaN on some drivers, so
        // the exact centre pixel gets its x nudged to 1.0 (r is 0 there, and
        // the mix below multiplies the angle out anyway)
        float a = atan(v.y, v.x + step(r, 1e-6)) - rot;
        float seg = 6.2831853 / SEGMENTS;
        a = abs(mod(a, seg) - seg * 0.5) + rot;
        return mix(v, vec2(cos(a), sin(a)) * r, amt);
      }

      void main() {
        vec2 uvc = (vUv - 0.5) * vec2(uAspect, 1.0); // centered, aspect-correct

        // --- pad shockwaves: expanding rings + a hot seed bloom, one per
        //     active slot. Inactive slots carry energy 0 and cost nothing
        //     visually, so no branch is needed inside the constant-bound loop.
        //     Hue is accumulated as an energy-weighted average and resolved
        //     with a single pal() call after the loop.
        float pshock = 0.0;
        float phue = 0.0;
        for (int i = 0; i < PULSE_N; i++) {
          vec4 pu = uPulse[i];
          float rd = length(uvc - pu.xy);
          float w = 0.05 + pu.z * 0.32;              // ring thickens as it grows
          float e = (rd - pu.z) / w;
          float amp = pu.w * (exp(-e * e) + 1.3 * exp(-rd * rd * 55.0));
          pshock += amp;
          phue += amp * fract(pu.x * 0.83 + pu.y * 1.37 + 0.5); // pad-stable tint
        }
        phue /= max(pshock, 1e-4);
        pshock = min(pshock, 2.5);

        // --- domain: swayed, beat-lurched, then mirror-folded
        vec2 p = uvc * 3.0;
        p.x += p.y * (uSway - 0.5) * 1.8;   // sway shears the whole field
        p *= 1.0 - uKick * 0.11;            // beat punches the gas toward us
        p = kaleido(p, uRot, uFold);

        // perspective-ish lens: detail crowds toward the center, which also
        // brightens it later — the cheap read on infinite depth
        float depth = clamp(1.0 / (0.30 + length(uvc) * 1.5), 0.65, 2.40);

        // layer 1 (far): slowest parallax; bass widens its scale, and it is
        // the source of the warp vector rather than a visible layer
        vec2 p1 = p * (0.80 + uBass * 0.45) + uPan * 0.35
                + vec2(uTime * 0.021, -uTime * 0.014);
        vec2 q = vec2(fbmW(p1), fbmW(p1 + vec2(5.2, 1.3)));

        // warp strength: mid band owns it, the beat kick slams it, an
        // arriving shockwave bulges the gas it passes through
        float ws = 1.5 + uMid * 3.6 + uKick * 3.0 + pshock * 1.2;
        vec2 wv = q - 0.5;
        wv.x += wv.y * (uSway - 0.5) * 2.2; // sway skews the warp itself

        // layer 2 (mid): domain-warped by layer 1. press pulls its scale down
        // toward layer 1's, condensing the stack into one dense sheet.
        vec2 p2 = p * mix(1.55, 1.05, uPress) + uPan * 0.70
                + vec2(-uTime * 0.027, uTime * 0.019);
        float f2 = fbmM(p2 + wv * ws);

        // layer 3 (near): warped by layer 2 and lensed by depth (med/high)
        float f3 = f2;
        #ifdef LAYER3
        vec2 p3 = p * mix(2.30, 1.25, uPress) * depth + uPan
                + vec2(uTime * 0.034, uTime * 0.024);
        f3 = fbmM(p3 + vec2(f2 - 0.5, wv.y) * ws * 0.85);
        #endif

        float dens = (f2 + f3) * 0.5;

        // --- contrast: the window is placed so the bulk of the fbm bell sits
        //     inside it (bright, layered gas) while its tails fall outside
        //     (true black voids). press narrows it further (condense), beat
        //     and shockwaves drop the floor so the gas visibly blooms open.
        float lo = 0.33 - uLevel * 0.08 - uKick * 0.13 - uPress * 0.11
                 - pshock * 0.10;
        float hi = max(lo + 0.06, 0.78 - uPress * 0.26 - uKick * 0.06);
        float g = smoothstep(lo, hi, dens);
        g = g * g * (3.0 - 2.0 * g); // second S-curve: deepens the voids and
                                     // separates the cores without capping them

        // bass stacks concentric density shells inside the gas; multiplying
        // by g keeps the voids at true black instead of inverting them
        float folds = 2.0 + uBass * 5.0;
        float shell = 1.0 - abs(fract(dens * folds) * 2.0 - 1.0);
        shell = pow(max(shell, 1e-4), 1.2 + uBass * 1.8);
        float gas = g * (0.62 + 0.75 * shell);

        // the same fold count, offset half a cell, becomes the neon contour
        // network threading the gas; treble sharpens it to a hard edge
        float contour = 1.0 - abs(fract(dens * folds + 0.5) * 2.0 - 1.0);
        float fil = pow(max(contour, 1e-4), 7.0 + uHigh * 14.0);

        // --- iridescent ramp: hue travels with density (uHue already carries
        //     the time + level cycling), edges take a complementary offset.
        //     The 2.8 coefficient puts roughly two full palette cycles inside
        //     the visible density range, so the whole ramp is always on screen
        //     and the drifting uHue slides it rather than dimming the frame.
        float ht = dens * 2.80 + uHue;
        vec3 gasCol  = pal(fract(ht) * 5.0);
        vec3 edgeCol = pal(fract(ht + 0.42) * 5.0);

        vec3 col = gasCol * gas * (0.95 + uBass * 1.40 + uLevel * 1.10);
        col += edgeCol * fil * (1.45 + uBeat * 2.60 + uBloom * 1.80)
             * (0.30 + 0.95 * g);
        col += mix(gasCol, vec3(1.0), 0.45) * pow(g, 4.0)
             * (1.10 + uLevel * 2.00 + uBloom * 2.00);   // hot cores

        // --- treble scintillation: hard on/off flecks riding inside the gas,
        //     strobed per noise cell so it reads as sparkle, not as haze
        vec2 ps = p * 24.0 + uPan * 1.8 + vec2(uTime * 0.70, -uTime * 0.52);
        float sn = vnoise(ps);
        float sp = smoothstep(0.56, 0.95, sn);
        sp *= sp;
        float gid = dot(floor(ps), vec2(7.3, 13.1));
        // both uTime * 33 and gid grow without bound over a long set, and
        // float32 sin() range reduction falls apart past ~1e5 — wrap the
        // phase into one turn so the strobe stays a strobe all night
        sp *= 0.18 + 0.82 * step(0.25, sin(mod(uTime * 33.0 + gid, 6.2831853)));
        col += mix(edgeCol, vec3(1.0), 0.40) * sp
             * (0.40 + 6.0 * uHigh) * (0.22 + 1.30 * g);

        // --- pad shockwaves on top, tinted by their seeding position
        col += pal(fract(phue + uHue) * 5.0) * pshock
             * (0.75 + 1.20 * g) * (1.0 + uBloom * 0.80);

        // center-forward gradient sells the depth. No tone rolloff and no
        // vignette here — the compositor owns limiting and vignetting.
        col *= 0.76 + depth * 0.30;

        gl_FragColor = vec4(col * uIntensity, 1.0);
      }`,
  });
  const quad = new THREE.Mesh(geo, mat);
  quad.frustumCulled = false; // clip-space quad, skip culling
  scene.add(quad);

  // --- preallocated CPU-side state (update() allocates nothing)
  const u = mat.uniforms;
  const pan = new THREE.Vector2(0, 0); // smoothed hand pan
  const prevPads = new Float32Array(PADS); // rising-edge detection for pads
  let aspect = ctx.width / ctx.height;
  let bassSm = 0;   // band envelopes: swell rather than flicker, but still fast
  let midSm = 0;
  let kick = 0;     // fast beat envelope for the domain lurch
  let hue = 0;      // integrated palette travel
  let rot = 0;      // kaleidoscope spin
  let fold = 0.4;   // smoothed mirror-fold amount
  let slot = 0;     // shockwave ring write cursor

  return {
    scene,
    camera,
    update(dt, t, io) {
      const bass = io.bands.bass;

      // band envelopes — short time constants so the gas tracks the track
      bassSm += (bass - bassSm) * (1 - Math.exp(-dt * 9));
      midSm += (io.bands.mid - midSm) * (1 - Math.exp(-dt * 12));

      // beat kick: instant attack, ~0.5 s tail; the visible lurch on the beat
      kick = Math.max(kick * Math.pow(0.002, dt), io.beat);

      // hue travel and mirror spin, wrapped so long sets never lose precision
      hue = (hue + dt * (0.035 + io.level * 0.30)) % 1;
      rot = (rot + dt * (0.05 + midSm * 0.28)) % TAU;

      // mandala breathing: a slow autonomous LFO, opened up by loudness and
      // biased by knob 4 (0.5 = neutral; knobs 0-2 stay engine-reserved)
      const foldTarget = Math.min(0.95, Math.max(0,
        0.26 + 0.30 * (0.5 + 0.5 * Math.sin(t * 0.061))
        + 0.26 * io.level + (io.knobs[4] - 0.5) * 0.5));
      fold += (foldTarget - fold) * (1 - Math.exp(-dt * 2.5));

      // hand pans the noise domain with parallax across the three layers
      const k = 1 - Math.exp(-dt * 4.0);
      pan.x += ((io.xy.x - 0.5) * 6.5 - pan.x) * k;
      pan.y += ((io.xy.y - 0.5) * 6.5 - pan.y) * k;
      u.uPan.value.copy(pan);

      // --- shockwaves: age every live slot, then seed on pad rising edges
      const grow = dt * (0.55 + midSm * 0.9 + io.level * 0.5);
      const decay = Math.pow(0.05, dt);
      for (let s = 0; s < PULSE_N; s++) {
        const o = s * 4;
        let e = pulses[o + 3];
        if (e <= 0.0008) { pulses[o + 3] = 0; continue; }
        pulses[o + 2] += grow;                       // radius doubles as age
        e = pulses[o + 2] > 2.0 ? 0 : e * decay;     // retire once off-screen
        pulses[o + 3] = e;
      }
      for (let i = 0; i < PADS; i++) {
        const v = io.pads[i];
        // engine decays io.pads exponentially, so a jump upward is a fresh hit
        if (v > prevPads[i] + 0.05 && v > 0.06) {
          const o = slot * 4;
          // 4x4 grid over the frame, in the shader's centered aspect space
          pulses[o] = (((i & 3) + 0.5) * 0.25 - 0.5) * aspect;
          pulses[o + 1] = 0.5 - ((i >> 2) + 0.5) * 0.25;
          pulses[o + 2] = 0;                 // radius
          pulses[o + 3] = 0.55 + v * 0.90;   // energy, velocity-scaled
          slot = (slot + 1) % PULSE_N;
        }
        prevPads[i] = v;
      }

      u.uTime.value = t;
      u.uHue.value = hue;
      u.uRot.value = rot;
      u.uFold.value = fold;
      u.uLevel.value = io.level;
      u.uBass.value = bassSm;
      u.uMid.value = midSm;
      u.uHigh.value = io.bands.high;
      u.uBeat.value = io.beat;
      u.uKick.value = kick;
      u.uSway.value = io.gestures.sway;
      u.uPress.value = io.gestures.press;
      u.uBloom.value = io.gestures.pulse;
      u.uIntensity.value = io.intensity;

      // Palette animates upstream — copy all five every frame, never mutate
      // io.palette itself. The copies then get a lightness lift (a shift the
      // contract permits): palettes like ambient-teal carry stops as dark as
      // #0f4c5c, which land near 0.1 in the linear working space and would
      // drag whole arcs of the hue ramp to black. Lifting only the stops that
      // fall below the floor keeps hue and relative saturation intact while
      // guaranteeing the gas reads at modest levels on every palette.
      for (let i = 0; i < 5; i++) {
        const c = palette[i].copy(io.palette[i]);
        const m = c.r > c.g ? (c.r > c.b ? c.r : c.b) : (c.g > c.b ? c.g : c.b);
        if (m > 1e-4 && m < FLOOR) c.multiplyScalar(FLOOR / m);
      }
    },
    resize(w, h) {
      aspect = w / h;
      u.uAspect.value = aspect; // ortho quad ignores the camera aspect
    },
    dispose() {
      geo.dispose();
      mat.dispose();
    },
  };
}
