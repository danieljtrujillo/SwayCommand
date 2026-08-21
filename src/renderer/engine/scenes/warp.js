// Wormhole — hard-science deep space in three regimes.
//
//   DRIFT     A photoreal starfield seen from a coasting ship: blackbody-
//             tinted stars (dim red dwarfs through blue giants) on the
//             celestial sphere, a G-type star in the distance with limb
//             darkening and a thin corona, faint palette-tinted nebulosity.
//             The view drifts slowly; the hand (xy) turns the eye.
//   WARP      A STRIKE engages warp. Stars streak along great circles toward
//             the direction of travel — relativistic aberration crowds the
//             sky forward while the Doppler shift blues and brightens what
//             lies ahead and reddens what falls behind. SWAY sets the
//             velocity: left of center slows, right accelerates.
//   WORMHOLE  Pressing down to the sensors (press ≥ ~0.7, held) opens the
//             mouth: a gravitationally lensed sphere — background stars bend
//             around it (deflection ~ 1/impact parameter), an Einstein ring
//             brightens at the photon radius, and the interior shows another
//             region of sky, inverted by the lens. Transit swaps the sky
//             seed: you come out somewhere else.
//
// Everything is one fullscreen quad; the physics are approximations chosen
// to look the way the real effects would (aberration, Doppler, thin-lens
// deflection, limb darkening), not fantasy coloring. Bloom carries the
// star's glare and the ring.

export const meta = {
  id: 'warp',
  name: 'Wormhole',
  mood: 'transluminal',
  bloom: { strength: 0.9, radius: 0.5, threshold: 0.55 },
};

export function createScene(ctx) {
  const { THREE, quality } = ctx;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  const STREAK_K = quality.tier === 'low' ? 5 : quality.tier === 'high' ? 12 : 8;

  const uniforms = {
    uRes: { value: new THREE.Vector2(ctx.width, ctx.height) },
    uTime: { value: 0 },
    uWarp: { value: 0 }, // 0 drift .. 1 full warp
    uHole: { value: 0 }, // wormhole mouth opening 0..1
    uSpeed: { value: 1 }, // sway-set warp velocity multiplier
    uSeed: { value: 3.7 }, // sky region; changes on transit
    uSeedB: { value: 9.2 }, // the region seen THROUGH the mouth
    uLook: { value: new THREE.Vector2(0, 0) },
    uDrift: { value: 0 }, // slow coasting rotation phase
    uFlash: { value: 0 }, // strike / transit flash
    uTintA: { value: new THREE.Color(0x18104a) },
    uTintB: { value: new THREE.Color(0x0a2a3a) },
    uIntensity: { value: 1 },
  };

  const mat = new THREE.ShaderMaterial({
    uniforms,
    depthTest: false,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: /* glsl */ `
      #define STREAK_K ${STREAK_K}
      uniform vec2 uRes;
      uniform float uTime, uWarp, uHole, uSpeed, uSeed, uSeedB, uDrift, uFlash, uIntensity;
      uniform vec2 uLook;
      uniform vec3 uTintA, uTintB;
      varying vec2 vUv;

      float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      float h22x(vec2 p) { return fract(sin(dot(p, vec2(269.5, 183.3))) * 43758.5453); }

      float vnoise(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x),
                   mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y);
      }

      // Octahedral map: direction sphere -> [-1,1]^2, cheap and pole-safe.
      vec2 octa(vec3 d) {
        d /= (abs(d.x) + abs(d.y) + abs(d.z));
        vec2 o = d.xy;
        if (d.z < 0.0) o = (1.0 - abs(o.yx)) * vec2(o.x >= 0.0 ? 1.0 : -1.0, o.y >= 0.0 ? 1.0 : -1.0);
        return o;
      }

      // Blackbody-ish tint: cool red dwarfs -> solar white -> blue giants.
      vec3 starTint(float t) {
        vec3 warm = vec3(1.0, 0.55, 0.32);
        vec3 sol  = vec3(1.0, 0.94, 0.85);
        vec3 blue = vec3(0.66, 0.78, 1.0);
        return t < 0.6 ? mix(warm, sol, t / 0.6) : mix(sol, blue, (t - 0.6) / 0.4);
      }

      // Point stars on the celestial sphere: three cell densities, magnitude
      // law heavily skewed so bright stars are rare.
      vec3 starSphere(vec3 rd, float seed) {
        vec3 col = vec3(0.0);
        vec2 o = octa(rd);
        for (int L = 0; L < 3; L++) {
          float sc = 26.0 + float(L) * 42.0;
          vec2 p = o * sc + seed * (7.13 + float(L) * 3.71);
          vec2 cell = floor(p);
          vec2 f = fract(p);
          vec2 sp = vec2(h21(cell), h22x(cell)); // star position in cell
          float d = length(f - sp) / sc;         // distance in octa units
          float m = h21(cell + 17.0);
          float mag = pow(m, 18.0) * 3.0 + pow(m, 5.0) * 0.12; // rare bright, many faint
          // brighter stars get a wider point spread (airy-ish), and the peak
          // is clamped so an isolated hot pixel cannot blow the bloom mips
          float psf = 0.0016 + min(mag, 2.5) * 0.0011;
          float b = mag * smoothstep(psf, 0.0, d);
          col += starTint(h22x(cell + 5.0)) * min(b, 1.7);
        }
        return col;
      }

      // Faint nebulosity — the only palette voice; space stays near-black.
      vec3 nebula(vec3 rd, float seed) {
        vec2 o = octa(rd) * 3.0 + seed;
        float n = 0.0, a = 0.5;
        for (int i = 0; i < 4; i++) {
          n += a * vnoise(o);
          o = o * 2.03 + 11.7;
          a *= 0.5;
        }
        n = smoothstep(0.55, 0.95, n);
        return mix(uTintA, uTintB, vnoise(o * 0.5)) * n * 0.05;
      }

      // The distant G-type star: limb-darkened disc + thin corona.
      vec3 sun(vec3 rd, vec3 sdir, float doppler) {
        float ca = dot(rd, sdir);
        float ang = acos(clamp(ca, -1.0, 1.0));
        float R = 0.016;
        vec3 col = vec3(0.0);
        if (ang < R) {
          float mu = sqrt(max(0.0, 1.0 - (ang / R) * (ang / R)));
          col += vec3(1.0, 0.955, 0.90) * (0.35 + 0.65 * mu) * 3.2; // limb darkening
        }
        col += vec3(1.0, 0.9, 0.78) * exp(-ang * 55.0) * 0.5;  // inner glare
        col += vec3(1.0, 0.85, 0.7) * exp(-ang * 14.0) * 0.05; // outer corona
        return col * mix(vec3(1.0), vec3(0.75, 0.85, 1.25), clamp(doppler, 0.0, 1.0));
      }

      void main() {
        vec2 sc = (vUv - 0.5) * 2.0;
        sc.x *= uRes.x / uRes.y;
        vec3 fwd = vec3(0.0, 0.0, 1.0);
        vec3 rd = normalize(vec3(sc * 0.62, 1.0));

        // eye direction: slow coast + the hand's look offset
        float yaw = uDrift + uLook.x;
        float pit = uLook.y;
        float cy = cos(yaw), sy = sin(yaw), cp = cos(pit), sp2 = sin(pit);
        rd = vec3(rd.x * cy + rd.z * sy, rd.y, -rd.x * sy + rd.z * cy);
        rd = vec3(rd.x, rd.y * cp - rd.z * sp2, rd.y * sp2 + rd.z * cp);
        vec3 sdir = normalize(vec3(0.32, 0.10, 1.0));

        // ---- wormhole lens ----------------------------------------------
        float mouth = uHole * 0.5;
        float bimp = acos(clamp(dot(rd, fwd), -1.0, 1.0)); // impact angle
        float inside = 0.0;
        float ring = 0.0;
        if (mouth > 0.002) {
          if (bimp > mouth) {
            // thin-lens deflection toward the mouth, ~ 1/b
            float defl = (mouth * mouth) / max(bimp * bimp, 1e-4) * 0.55;
            rd = normalize(mix(rd, fwd, clamp(defl, 0.0, 0.85)));
          } else {
            // through the throat: the far sky, inverted by the lens
            inside = 1.0;
            vec3 rel = rd - fwd * dot(rd, fwd);
            rd = normalize(fwd - rel * (mouth / max(bimp, 1e-3)) * 1.6);
          }
          // Einstein ring at the photon radius
          ring = exp(-pow((bimp - mouth * 1.04) / (mouth * 0.06 + 1e-3), 2.0));
        }

        // ---- relativistic aberration + streaking ------------------------
        float v = uWarp * uSpeed;
        float ab = clamp(v * 0.55, 0.0, 0.93);
        float ahead = dot(rd, fwd) * 0.5 + 0.5;
        float seed = mix(uSeed, uSeedB, inside);

        vec3 col = vec3(0.0);
        if (v > 0.003) {
          // integrate along the aberration path: stars smear toward the
          // direction of travel as the sky crowds forward
          float wsum = 0.0;
          for (int k = 0; k < STREAK_K; k++) {
            float f = float(k) / float(STREAK_K - 1);
            vec3 rk = normalize(mix(rd, fwd, ab * f * 0.28));
            float w = 1.0 - f * 0.75;
            col += starSphere(rk, seed + f * v * 0.35) * w; // seed advance = flight
            wsum += w;
          }
          col /= wsum;
          // Doppler: blue and bright ahead, red and dim behind
          col *= mix(vec3(0.9, 0.5, 0.35) * 0.6, vec3(0.8, 0.95, 1.45) * 1.6, ahead) * (1.0 + v * 0.4);
        } else {
          col = starSphere(rd, seed);
        }

        col += nebula(rd, seed);
        col += sun(rd, sdir, v * ahead) * (1.0 - inside) * (1.0 - uWarp * 0.55);
        col += vec3(0.85, 0.93, 1.2) * ring * (1.5 + uFlash * 2.0);
        col += vec3(1.0) * uFlash * 0.12; // strike / transit flash headroom
        gl_FragColor = vec4(col * uIntensity, 1.0);
      }`,
  });

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  quad.frustumCulled = false;
  scene.add(quad);

  const bloom = { strength: 0.55, radius: 0.5, threshold: 0.7 };

  // state machine: drift <-> warp (strike), wormhole transit (press held)
  let warpOn = 0;
  let warpT = 0;
  let holdT = 0; // press-held accumulator
  let transit = -1; // -1 idle, else 0..1 script phase
  let seed = 3.7;
  let seedB = 9.2;
  let drift = 0;
  let flash = 0;
  let lookX = 0;
  let lookY = 0;
  let strikePrev = 0;

  const approach = (v, to, tau, dt) => v + (to - v) * (1 - Math.exp(-dt / tau));

  return {
    scene,
    camera,
    bloom,
    update(dt, t, io) {
      // STRIKE toggles warp (rising edge)
      if (io.strike > 0.3 && strikePrev <= 0.3 && transit < 0) {
        warpOn = warpOn ? 0 : 1;
        flash = Math.max(flash, 0.6);
      }
      strikePrev = io.strike;

      // SWAY sets velocity around center: left slows, right accelerates
      uniforms.uSpeed.value = Math.pow(2, (io.gestures.sway - 0.5) * 2.6);

      // PRESS held deep opens the mouth
      if (transit < 0) {
        holdT = io.gestures.press > 0.7 ? holdT + dt : 0;
        if (holdT > 0.25) {
          transit = 0;
          holdT = 0;
        }
      }
      if (transit >= 0) {
        transit += dt / 4.2; // full transit ~4 s
        if (transit >= 0.5 && transit - dt / 4.2 < 0.5) {
          // the throat: come out somewhere else
          seed = seedB;
          seedB = (seedB * 7.13 + 3.1) % 97;
          flash = 1;
          warpOn = 0;
        }
        if (transit >= 1) transit = -1;
      }
      const hole = transit < 0 ? 0 : Math.sin(Math.min(1, transit) * Math.PI);

      warpT = approach(warpT, warpOn, warpOn ? 1.1 : 0.6, dt);
      flash = Math.max(0, flash - dt * 1.8);
      drift += dt * (0.006 + warpT * 0.002);
      lookX = approach(lookX, (io.xy.x - 0.5) * 0.5, 0.4, dt);
      lookY = approach(lookY, (io.xy.y - 0.5) * 0.34, 0.4, dt);

      uniforms.uTime.value = t;
      uniforms.uWarp.value = warpT;
      uniforms.uHole.value = approach(uniforms.uHole.value, hole, 0.18, dt);
      uniforms.uSeed.value = seed;
      uniforms.uSeedB.value = seedB;
      uniforms.uDrift.value = drift;
      uniforms.uFlash.value = flash + io.beat * 0.05;
      uniforms.uLook.value.set(lookX, lookY);
      uniforms.uIntensity.value = io.intensity;
      uniforms.uTintA.value.copy(io.palette[1]).multiplyScalar(0.5);
      uniforms.uTintB.value.copy(io.palette[2]).multiplyScalar(0.5);

      // glare rides the regimes: the star's bloom at drift, streak energy at
      // warp, the ring during transit
      bloom.strength = 0.55 + warpT * 0.45 + hole * 1.1 + flash * 0.5;
    },
    resize(w, h) {
      uniforms.uRes.value.set(w, h);
    },
    dispose() {
      quad.geometry.dispose();
      mat.dispose();
    },
  };
}
