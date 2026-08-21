// Wormhole End — a port of fuad's CodePen "wormhole" (MIT, notice below).
//
// The pen: a sphere of radius 4 scaled (1, 20, 1) into a long tube, drawn
// from the inside (BackSide MeshBasic) with a patched map chunk that samples
// one photo (mirrored repeat) in three scrolling layers —
//
//   uv = vUv · (2, 10) + 0.5;  o = map(uv)
//   nu = 0.3 · map(uv · 2 + (0, t + o.b))    // water
//      + 0.1 · map(uv + t)                   // cyclone
//      + 0.6 · (map(uv + (0, t)) + 0.5)      // closest
//   C  = pow(nu + 0.1, 4)                    // t = time · 0.0001
//
// — a mirror sphere (MeshStandard, metalness 1, roughness 0, a CubeCamera
// env map, a second photo as its map, white emissive 0.12) at the origin,
// and the camera at (−1, −4, 1) looking at (−1, 4, 0) up the tube. gsap spun
// the sphere; that spin is NOT carried over (SCENE_CONTRACT rule 8).
//
// Here the whole thing is ONE fullscreen GLSL3 quad that ray-traces the
// geometry analytically:
//
//   TUBE      the interior of the same ellipsoid — semi-axes (4, 80, 4), the
//             eye inside looking up +y — hit at the ray's far root; the hit
//             point gives the pen's sphere UV (u around, v pole to pole) and
//             the tube colour is the pen's three-layer mix and
//             pow(nu + 0.1, 4) verbatim, with the photo replaced by a
//             PROCEDURAL tile (scenes load no images): a two-channel value-
//             noise fbm over mirrored-repeat coordinates — one channel the
//             luminance, one the warmth — tinted from io.palette (warm = 3/4
//             toward white, cool = 2/0), the warmth channel doubling as the
//             pen's o.b water displacement. The layers scroll along the tube
//             (translation) at the pen's relative rates.
//   SPHERE    an analytic sphere of radius 1 at the origin. Its surface is the
//             tube seen along the reflected ray — reflect the view ray off
//             the normal, intersect the ellipsoid, sample the same tube colour
//             — which is exactly what the pen's CubeCamera rendered, without
//             a second render. The pen's second photo becomes a second tile
//             region used as the metal's F0 tint (what map × metalness 1
//             does), under a Schlick fresnel, plus the faint white emissive
//             the beat pulses, plus a fresnel rim. The sphere does not spin.
//
// Controls (nothing autonomous but the forward travel):
//   travel    the scroll phase is the flight — the pen's rate at rest, bass
//             lifts it, a pad STRIKE (rising edge) kicks it
//   hand      xy.x steers the eye across the tube (translation; the look
//             target stays the pen's, so the view pans by hand), xy.y dollies
//             toward / away from the sphere
//   sway      morphs the tube texture — the layer weights and the flow
//             tightness: right of centre the water layer takes over, finer
//             and more displaced; left the cyclone layer, broader
//   press     squeezes the tube radius (the eye rides in with it)
//   beat      pulses the sphere's emissive
//
// One draw call, no per-frame allocation, all colour from io.palette.
//
// Upstream: https://codepen.io/SafeOsprey52158/pen/RwGjZmd
// The MIT License (MIT) — Copyright (c) 2026 fuad. Permission is hereby
// granted, free of charge, to any person obtaining a copy of this software
// and associated documentation files (the "Software"), to deal in the
// Software without restriction, including without limitation the rights to
// use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions: The above
// copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software. THE SOFTWARE IS PROVIDED
// "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT
// NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
// PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
// HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
// CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

export const meta = { id: 'wormholeend', name: 'Wormhole End', mood: 'transluminal' };

const TUBE_R = 4;       // the pen's sphere radius
const TUBE_LEN = 80;    // radius × the (1, 20, 1) scale: the ellipsoid's y semi-axis
const EYE_Y = -4;       // the pen's camera y; the hand dollies about it
const RATE = 0.1;       // the pen's t = ms × 0.0001 → 0.1 uv units per second

export function createScene(ctx) {
  const { THREE, quality } = ctx;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  // fbm octaves of the procedural tile; four photo samples per tube pixel
  const OCT = quality.tier === 'low' ? 3 : quality.tier === 'high' ? 5 : 4;

  const uniforms = {
    uRes: { value: new THREE.Vector2(ctx.width, ctx.height) },
    uEye: { value: new THREE.Vector3(-1, EYE_Y, 1) },
    uFwd: { value: new THREE.Vector3(0, 1, 0) },
    uRight: { value: new THREE.Vector3(1, 0, 0) },
    uUp: { value: new THREE.Vector3(0, 0, 1) },
    uPhase: { value: 0 },     // scroll phase = distance flown, in the pen's t units
    uRadius: { value: TUBE_R },
    uMorph: { value: 0 },     // sway about centre, −1..1
    uEmis: { value: 0.12 },   // the sphere's emissive, beat-pulsed
    uGain: { value: 1 },
    uIntensity: { value: 1 },
    uWarm: { value: new THREE.Color(1, 0.8, 0.6) },
    uCool: { value: new THREE.Color(0.3, 0.5, 0.9) },
    uWhite: { value: new THREE.Color(1, 1, 1) },
  };

  const mat = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms,
    depthTest: false,
    depthWrite: false,
    vertexShader: /* glsl */ `
      out vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: /* glsl */ `
      #define OCT ${OCT}
      uniform vec2 uRes;
      uniform vec3 uEye, uFwd, uRight, uUp;
      uniform float uPhase, uRadius, uMorph, uEmis, uGain, uIntensity;
      uniform vec3 uWarm, uCool, uWhite;
      in vec2 vUv;
      out vec4 fragColor;

      const float PI = 3.14159265;
      const float TAU = 6.28318531;
      const float TAN_HALF_FOV = 0.76733; // the pen's fov 75
      const float LEN = ${TUBE_LEN.toFixed(1)};

      vec2 h22(vec2 p) {
        p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
        return fract(sin(p) * 43758.5453);
      }

      // two value-noise channels for the price of one lattice walk
      vec2 vnoise2(vec2 p) {
        vec2 i = floor(p), f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        return mix(mix(h22(i), h22(i + vec2(1.0, 0.0)), f.x),
                   mix(h22(i + vec2(0.0, 1.0)), h22(i + vec2(1.0, 1.0)), f.x), f.y);
      }

      vec2 fbm2(vec2 p) {
        vec2 n = vec2(0.0);
        float a = 0.5, w = 0.0;
        for (int i = 0; i < OCT; i++) {
          n += a * vnoise2(p);
          w += a;
          p = p * 2.03 + vec2(5.3, 1.7);
          a *= 0.5;
        }
        return n / w;
      }

      // MirroredRepeatWrapping: the pen's photo tiles back and forth
      vec2 mirrorRep(vec2 uv) { return abs(fract(uv * 0.5) * 2.0 - 1.0); }

      // The procedural photo: one tile in [0,1]^2, a luminance channel and a
      // warmth channel from the same fbm, tinted cool -> warm from the
      // palette. .a is the warmth channel raw — the pen's o.b displacement.
      vec4 photo(vec2 uv) {
        vec2 n = fbm2(mirrorRep(uv) * 3.0 + 11.0);
        float lum = smoothstep(0.22, 0.78, n.x);
        float warmth = smoothstep(0.3, 0.7, n.y);
        return vec4(mix(uCool, uWarm, warmth) * lum, n.y);
      }

      // The pen's three scrolling layers on the sphere UV of hit point h.
      // SphereGeometry's u runs around y (atan(z, -x)), v from the bottom
      // pole (0) to the top (1); uv = vUv · (2, 10) + 0.5 as the pen.
      vec3 tubeColor(vec3 h) {
        float u = atan(h.z, -h.x) / TAU + 0.5;
        float v = 1.0 - acos(clamp(h.y / LEN, -1.0, 1.0)) / PI;
        vec2 uv = vec2(u, v) * vec2(2.0, 10.0) + 0.5;
        float t = uPhase;
        vec4 o = photo(uv);
        // sway morph: layer weights and flow tightness about the pen's
        // 0.3 / 0.1 / 0.6 rest. The tightness scales v only — the tile
        // mirrors with period 2 in uv.x and the seam around the tube is
        // seamless only while the u scale stays integer
        float mp = max(uMorph, 0.0), mn = max(-uMorph, 0.0);
        float wWater = 0.3 + 0.35 * mp;
        float wCyc = 0.1 + 0.2 * mn;
        float wClose = 1.0 - wWater - wCyc;
        vec3 nu = wWater * photo(uv * vec2(2.0, 2.0 + 2.0 * mp) + vec2(0.0, t + o.a * (1.0 + 1.5 * mp))).rgb // water
                + wCyc * photo(uv * vec2(1.0, 1.0 - 0.5 * mn) + vec2(t)).rgb                                  // cyclone
                + wClose * (photo(uv + vec2(0.0, t)).rgb + 0.5);                                               // closest
        return pow(nu + 0.1, vec3(4.0)) * uGain;
      }

      // far root of the ray against the ellipsoid (R, LEN, R) — the inside
      // of the tube; the eye is always inside, so it always exists
      float tubeHit(vec3 ro, vec3 rd) {
        vec3 s = vec3(1.0 / uRadius, 1.0 / LEN, 1.0 / uRadius);
        vec3 p = ro * s, d = rd * s;
        float a = dot(d, d), b = dot(p, d), c = dot(p, p) - 1.0;
        return (-b + sqrt(max(b * b - a * c, 0.0))) / a;
      }

      void main() {
        vec2 sc = (vUv - 0.5) * 2.0;
        sc.x *= uRes.x / uRes.y;
        vec3 rd = normalize(uRight * (sc.x * TAN_HALF_FOV) + uUp * (sc.y * TAN_HALF_FOV) + uFwd);
        vec3 ro = uEye;

        // the mirror sphere, radius 1 at the origin: near root
        float b = dot(ro, rd), c = dot(ro, ro) - 1.0;
        float disc = b * b - c;
        vec3 col;
        if (disc > 0.0 && -b - sqrt(disc) > 0.0) {
          float s = -b - sqrt(disc);
          vec3 hp = ro + rd * s;
          vec3 n = hp; // unit sphere: the point is the normal
          // the reflection: the tube along the reflected ray — the CubeCamera
          vec3 rr = reflect(rd, n);
          vec3 env = tubeColor(hp + rr * tubeHit(hp, rr));
          // the pen's second photo as the sphere's map: with metalness 1 it
          // is the F0 tint of the reflection (a second tile region, static)
          vec2 suv = vec2(atan(n.z, -n.x) / TAU + 0.5, 1.0 - acos(clamp(n.y, -1.0, 1.0)) / PI);
          vec3 F0 = 0.3 + 0.7 * photo(suv * vec2(2.0, 1.0) + 37.0).rgb;
          float ndv = clamp(dot(n, -rd), 0.0, 1.0);
          float fres = pow(1.0 - ndv, 5.0);
          vec3 F = F0 + (1.0 - F0) * fres;
          col = env * F
              + uWhite * uEmis                       // the pen's emissive, beat-pulsed
              + uWhite * pow(1.0 - ndv, 3.0) * 0.25; // fresnel rim
        } else {
          col = tubeColor(ro + rd * tubeHit(ro, rd));
        }
        fragColor = vec4(col * uIntensity, 1.0);
      }`,
  });

  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  quad.frustumCulled = false;
  scene.add(quad);

  // camera basis scratch: the pen's eye (−1, −4, 1) looking at (−1, 4, 0)
  const target = new THREE.Vector3(-1, 4, 0);
  const worldUp = new THREE.Vector3(0, 0, 1);
  const eye = new THREE.Vector3(-1, EYE_Y, 1);
  const fwd = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  const c = new THREE.Color();

  let phase = 0;     // distance flown, in the pen's t units
  let travel = 1;    // smoothed speed multiplier
  let kick = 0;      // strike surge
  let strikePrev = 0;
  let eyeX = -1;
  let eyeY = EYE_Y;
  let radius = TUBE_R;
  let morph = 0;

  const approach = (v, to, tau, dt) => v + (to - v) * (1 - Math.exp(-dt / tau));

  return {
    scene,
    camera,
    update(dt, t, io) {
      // STRIKE (rising edge) kicks the travel; the kick decays
      if (io.strike > 0.3 && strikePrev <= 0.3) kick = Math.max(kick, 3.5);
      strikePrev = io.strike;
      kick = Math.max(0, kick - dt * kick * 2.2);

      // forward motion only: the scroll phase is the flight; bass lifts the
      // rate, the kick surges it — never negative, never reversing
      travel = approach(travel, 1 + io.bands.bass * 1.8 + kick, 0.12, dt);
      phase += dt * RATE * travel;
      uniforms.uPhase.value = phase;

      // PRESS squeezes the tube; the eye's offset from the axis rides in
      // with it so the eye never reaches the wall
      radius = approach(radius, TUBE_R * (1 - io.gestures.press * 0.42), 0.15, dt);
      uniforms.uRadius.value = radius;

      // hand: x steers the eye across the tube, y dollies toward the sphere
      eyeX = approach(eyeX, -1 + (io.xy.x - 0.5) * 2.4, 0.35, dt);
      eyeY = approach(eyeY, EYE_Y + (io.xy.y - 0.5) * 4, 0.35, dt);
      const sq = radius / TUBE_R;
      eye.set(eyeX * sq, eyeY, 1 * sq);
      fwd.subVectors(target, eye).normalize();
      right.crossVectors(fwd, worldUp).normalize();
      up.crossVectors(right, fwd);
      uniforms.uEye.value.copy(eye);
      uniforms.uFwd.value.copy(fwd);
      uniforms.uRight.value.copy(right);
      uniforms.uUp.value.copy(up);

      // SWAY morphs the layer weights and the flow tightness
      morph = approach(morph, (io.gestures.sway - 0.5) * 2, 0.3, dt);
      uniforms.uMorph.value = morph;

      // the beat pulses the sphere's emissive about the pen's 0.12
      uniforms.uEmis.value = 0.12 + io.beat * 0.5;
      uniforms.uGain.value = 0.85;
      uniforms.uIntensity.value = io.intensity;

      // palette: the photo's warmth = 3/4 toward white, the cool layers = 2/0
      uniforms.uWarm.value.copy(io.palette[3]).lerp(io.palette[4], 0.5).lerp(c.setRGB(1, 1, 1), 0.35);
      uniforms.uCool.value.copy(io.palette[2]).lerp(io.palette[0], 0.5);
      uniforms.uWhite.value.copy(io.palette[2]).lerp(c.setRGB(1, 1, 1), 0.75);
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
