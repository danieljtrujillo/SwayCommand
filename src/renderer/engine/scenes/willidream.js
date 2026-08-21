// Will I Dream — a straight flight through deep space: hyperspace on the hand,
// a black hole on a pad, a new celestial object at the end of every jump.
//
//   FLIGHT      Nothing applied at rest: a star field streams TOWARD the
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
//               object ahead: pulsar, spiral galaxy, solar system, nebula, or
//               ringed planet, never the same twice running. The star/streak
//               layer is drawn above the object (renderOrder 2 > 1).
//   BLACK HOLE  PAD 7 opens it at the center: a Schwarzschild black hole
//               raymarched in the overlay — null geodesics bent by the
//               -1.5·h²·p/r⁵ term, an accretion disk seen nearly edge-on with
//               the far side lensed over and under the shadow, Doppler
//               beaming (bright, blue-shifted approaching side; dim, red
//               receding side), a photon-ring glow — and the ship FALLS IN:
//               the virtual camera closes from 80 to 2.2 rs so the shadow
//               swallows the view from the center out while the star lens
//               pushes the field outward around it, then a beat of void and
//               re-emergence into a re-seeded sky with NO celestial object; a
//               jump in progress ends into the hole instead of spawning one.
//   BANKS       PAD 8 banks left, PAD 15 banks right: the only rotation in
//               the scene, a 2.4 s roll-and-yaw that levels out again; the
//               stars sweep sideways with the turn.
//
// Pads are numbered as the deck shows them (0–15). Three draw calls: the
// celestial object (one camera-facing quad, analytic ray-cast bodies: shaded
// spheres, rings with shadows, a limb-darkened sun, jets, a spiral-galaxy
// plane, layered cloud — all static forms, only light pulses), the stars
// (one instanced mesh of streak capsules), and the overlay quad (black hole,
// vanishing-point glow, flash; premultiplied-additive so one pass adds light
// and occludes). No bloom is requested — no effects. Any other pad strike is
// a thrust surge.
//
// Sources, all MIT CodePen exports in the user's ScifiUI folder, re-written
// here as palette-driven shaders under docs/SCENE_CONTRACT.md: the warp-line
// star field idea (Jamie, "Wormhole"), the lensing pull (Darryl Huffman,
// "Black Hole (WebGL Shader)"), the in-falling horizon (Sean Free,
// "#codevember 13"), the cosmic objects (Techartist, "Cosmic Anomaly
// Visualizer"), the forward-only flight (Rizki Gunawan, "Threejs SciFi
// Flight").

export const meta = { id: 'willidream', name: 'Will I Dream', mood: 'lucid' };

const PADS = 16;
const PAD_BLACKHOLE = 7; // deck PAD 7
const PAD_BANK_LEFT = 8; // deck PAD 8
const PAD_BANK_RIGHT = 15; // deck PAD 15
const SHAPES = 5; // pulsar, galaxy, system, nebula, ringed
const FOV = 62;
const BOX_W = 420;
const BOX_H = 280;
const BOX_DEPTH = 700;
const BOX_NEAR = 8;
const CRUISE = 22;
const WARP_GAIN = 30;
const OBJ_SPAWN_Z = 680;
const BANK_LEN = 2.4;
const T_OPEN = 0.6;
const T_SWALLOW = 3.4;
const T_VOID = 4.0;
const T_END = 5.8;
const OBJ_EXTENT = [66, 26, 40, 34, 21]; // per shape, world units at scale 1

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
  // Black-hole lens on a centred, aspect-corrected screen position (height = 1):
  // a point lens pushes images outward by thetaE^2 / theta. hole = (thetaE^2,
  // shadow radius). Zero is the identity.
  vec2 lens(vec2 q, vec2 hole) {
    if (hole.x <= 0.0) return q;
    float d2 = dot(q, q);
    return q * (1.0 + hole.x / (d2 + 0.003));
  }
`;

// -------------------------------------------------------------- star streaks
const STAR_VERT = /* glsl */ `
  ${GLSL_COMMON}
  uniform float uTravel, uSide, uDepth, uHalfW, uHalfH, uNear, uAspect, uTime, uTwinkle, uBreath, uOrder, uTail, uGain, uFovK;
  uniform vec2 uRes;
  uniform vec2 uHole;
  uniform vec3 uPal0, uPal1, uPal2;
  in vec2 aQuad;  // per vertex: side -1..1, along 0 (head) .. 1 (tail)
  in vec3 aStar;  // per instance: x0, y0, z0
  in vec3 aInfo;  // per instance: magnitude, tint pick, phase
  out vec2 vQ;
  out vec3 vCol;
  out float vA;
  out float vLenR;
  vec2 toScreen(vec4 c) { return c.xy / max(c.w, 0.001) * vec2(uAspect, 1.0) * 0.5; }
  void main() {
    // distribution: random scatter -> lattice under the sway control
    vec3 st = aStar;
    vec3 pitch = vec3(2.0 * uHalfW / 9.0, 2.0 * uHalfH / 6.0, uDepth / 14.0);
    vec3 snapped = (floor(st / pitch + 0.5)) * pitch;
    st = mix(st, snapped, uOrder);
    float x = mod(st.x + uSide + uHalfW, 2.0 * uHalfW) - uHalfW;
    float y = st.y;
    // FORWARD: the box scrolls toward the camera (z rises to uNear) and wraps
    float z = (uNear - uDepth) + mod(st.z + uTravel, uDepth);
    vec4 mvH = modelViewMatrix * vec4(x, y, z, 1.0);
    vec4 mvT = modelViewMatrix * vec4(x, y, z - uTail, 1.0);
    float dist = max(-mvH.z, 0.5);
    vec4 ch = projectionMatrix * mvH;
    vec4 ct = projectionMatrix * mvT;
    float vis = step(0.3, ch.w) * step(0.3, ct.w);
    vec2 sh = lens(toScreen(ch), uHole);
    vec2 stl = lens(toScreen(ct), uHole);
    float horizon = uHole.y > 0.0 ? 1.0 - step(uHole.y, length(sh)) : 0.0;
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
    // a stretched star spreads its light; the jump adds energy back
    vA = (0.42 + mag * 1.3) * (0.5 + 0.5 * near) * tw * uBreath * vis * (1.0 - horizon) * (1.0 + uGain) / sqrt(1.0 + vLenR * 0.22);
    vec3 tint = aInfo.y < 0.33 ? uPal0 : (aInfo.y < 0.66 ? uPal1 : uPal2);
    vCol = mix(vec3(1.0), tint, 0.38 + 0.22 * mag);
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
  uniform float uExtent, uAspect;
  uniform vec2 uHole;
  out vec3 vWorld;
  void main() {
    vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
    vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    vec3 world = uObjPos + (right * position.x + up * position.y) * uExtent;
    vWorld = world;
    vec4 clip = projectionMatrix * viewMatrix * vec4(world, 1.0);
    vec2 ndc = clip.xy / max(clip.w, 0.001);
    vec2 q = lens(ndc * vec2(uAspect, 1.0) * 0.5, uHole);
    clip.xy = q * 2.0 / vec2(uAspect, 1.0) * clip.w;
    gl_Position = clip;
  }
`;

const OBJ_FRAG = /* glsl */ `
  out vec4 fragColor;
  ${GLSL_COMMON}
  uniform vec3 uObjPos;
  uniform float uShape, uScale, uAlpha, uPulse, uTime, uSeed, uIntensity;
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

  // ---- nebula: layered cloud on the billboard, soft sphere mask
  vec4 nebula(vec3 ro, vec3 rd, vec3 C) {
    // billboard coordinates: project onto the camera plane through C
    vec3 oc = ro - C;
    float tC = -dot(oc, rd);
    vec3 p = oc + rd * tC;                 // closest point to C along the ray, relative to C
    vec3 right = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]);
    vec3 up = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
    vec2 q = vec2(dot(p, right), dot(p, up)) / 30.0;   // -1..1 over the cloud
    float r = length(q);
    float mask = 1.0 - smoothstep(0.55, 1.0, r);
    vec2 drift = vec2(uTime * 0.012, uTime * 0.007);
    float n1 = fbm(q * 2.2 + uSeed + drift);
    float n2 = fbm(q * 4.7 + 3.0 + uSeed - drift * 0.6);
    float n3 = fbm(q * 9.0 + 7.0 + uSeed + drift * 0.3);
    float dens = smoothstep(0.32, 0.85, n1 * 0.55 + n2 * 0.3 + n3 * 0.15) * mask;
    float ridged = 1.0 - abs(n2 * 2.0 - 1.0);
    vec3 c = mix(uPal1, uPal0, dens);
    c = mix(c, uPal4, smoothstep(0.6, 0.95, n1) * 0.45);
    c = mix(c, mix(uPal2, vec3(1.0), 0.5), pow(ridged, 6.0) * dens * 0.8);
    // embedded stars
    vec2 cell = floor(q * 28.0);
    vec2 f = fract(q * 28.0) - 0.5;
    float sh = h21(cell + uSeed);
    float star = (sh > 0.93 ? 1.0 : 0.0) * exp(-dot(f, f) * 60.0) * mask * (0.6 + 0.4 * sin(uTime * 3.0 + sh * 30.0));
    vec3 col = c * dens * 1.3 + vec3(1.0) * star * 0.8;
    float cover = dens * 0.55;
    return vec4(col, cover);
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

  void main() {
    vec3 ro = cameraPosition;
    vec3 rd = normalize(vWorld - ro);
    // work in object-local scale: scale the ray origin instead of the shapes
    vec3 C = uObjPos;
    vec3 roS = C + (ro - C) / uScale;
    vec4 o;
    if (uShape < 0.5) o = pulsar(roS, rd, C);
    else if (uShape < 1.5) o = galaxy(roS, rd, C);
    else if (uShape < 2.5) o = solarSystem(roS, rd, C);
    else if (uShape < 3.5) o = nebula(roS, rd, C);
    else o = ringed(roS, rd, C);
    float a = clamp(o.a, 0.0, 1.0) * uAlpha;
    fragColor = vec4(o.rgb * uAlpha * uIntensity, a);
  }
`;

// ------------------------------------------------- overlay: black hole + glow
const OVER_VERT = /* glsl */ `
  out vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const OVER_FRAG = /* glsl */ `
  out vec4 fragColor;
  ${GLSL_COMMON}
  uniform vec2 uRes;
  uniform float uTime, uWarp, uFlash, uVeil, uSwallow, uIntensity, uRoll, uHoleD, uDisk;
  uniform vec3 uPal0, uPal1, uPal2, uPal3, uPal4;
  in vec2 vUv;

  // accretion disk sample: temperature falloff, static streaks + noise,
  // Doppler beaming toward the approaching side; v = ray direction at the hit
  vec4 diskSample(vec3 hit, vec3 N, vec3 U, vec3 V, vec3 v) {
    float rh = length(hit);
    float t = (rh - 2.6) / (9.0 - 2.6);
    float temp = pow(clamp(1.0 - t, 0.0, 1.0), 0.8);
    float phi = atan(dot(hit, V), dot(hit, U));
    float n = vnoise(vec2(phi * 3.0, rh * 1.6)) * 0.6 + vnoise(vec2(phi * 9.0 + 3.0, rh * 4.0)) * 0.4;
    float streaks = 0.5 + 0.5 * sin(phi * 30.0 + rh * 7.0 + n * 7.0);
    float flick = 0.9 + 0.1 * sin(uTime * 6.0 + rh * 5.0);
    float dens = (0.55 + 0.45 * n) * (0.55 + 0.45 * streaks) * smoothstep(0.0, 0.1, t) * (1.0 - smoothstep(0.7, 1.0, t)) * flick;
    vec3 vel = normalize(cross(N, hit));
    float beta = sqrt(0.5 / max(rh, 1.0));
    float cosang = dot(vel, -v);
    float dop = clamp(pow(1.0 / max(1.0 - beta * cosang * 0.95, 0.15), 3.0), 0.15, 5.0);
    vec3 hot = mix(uPal3, vec3(1.0), 0.65);
    vec3 warm = uPal4;
    vec3 cool = mix(uPal2, uPal0, 0.5);
    vec3 c = mix(warm, hot, temp);
    c = mix(c, cool, clamp((dop - 1.0) * 0.3, 0.0, 0.6));
    c = mix(c, warm * 0.5, clamp((1.0 - dop) * 0.9, 0.0, 0.7));
    float a = clamp(dens * 0.9, 0.0, 0.95);
    return vec4(c * dens * dop * (1.0 + temp * 2.2), a);
  }

  void main() {
    vec2 uv = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
    uv = rot2(uRoll) * uv;
    float r = length(uv);
    vec3 col = vec3(0.0);
    float cover = 0.0;
    // vanishing-point glow of the jump, and the exit flash
    col += mix(uPal2, vec3(1.0), 0.5) * uWarp * uWarp * 0.22 / (r * 6.0 + 0.25);
    col += vec3(1.0) * uFlash * 0.35;

    if (uHoleD > 0.0) {
      vec3 ro = vec3(0.0, 0.0, uHoleD);
      vec3 rd = normalize(vec3(uv * 1.1, -1.0));
      vec3 N = normalize(vec3(0.0, 0.976, 0.22));
      vec3 U = normalize(cross(N, vec3(1.0, 0.0, 0.0)));
      vec3 Vv = cross(N, U);
      float b = length(cross(ro, rd));
      vec3 disk = vec3(0.0);
      float T = 1.0;
      float captured = 0.0;
      if (b < 14.0 || uHoleD < 4.0) {
        vec3 p = ro; vec3 v = rd;
        for (int i = 0; i < STEPS; i++) {
          float r2 = dot(p, p);
          float rr = sqrt(r2);
          if (rr < 1.0) { captured = 1.0; break; }
          if (rr > 14.0 && dot(p, v) > 0.0) break;
          vec3 h = cross(p, v);
          float h2 = dot(h, h);
          float dt = clamp(rr * 0.16, 0.03, 0.8);
          vec3 a = -1.5 * h2 * p / (r2 * r2 * rr);
          vec3 pn = p + v * dt + 0.5 * a * dt * dt;
          float s0 = dot(p, N), s1 = dot(pn, N);
          if (s0 * s1 < 0.0) {
            vec3 hit = mix(p, pn, s0 / (s0 - s1));
            float rh = length(hit);
            if (rh > 2.6 && rh < 9.0) {
              vec4 dc = diskSample(hit, N, U, Vv, v);
              disk += dc.rgb * dc.a * T;
              T *= (1.0 - dc.a);
              if (T < 0.03) break;
            }
          }
          v = normalize(v + a * dt);
          p = pn;
        }
      }
      // photon-ring glow just outside the shadow (screen-space approximation)
      float shadowR = 2.36 / uHoleD;
      float ring = exp(-pow((r - shadowR * 1.02) / (shadowR * 0.05 + 0.002), 2.0)) * (1.0 - captured);
      float halo = exp(-(r - shadowR) * (6.0 / (shadowR + 0.05))) * step(shadowR, r) * 0.25;
      vec3 glow = (mix(uPal3, vec3(1.0), 0.7) * ring * 1.6 + mix(uPal4, uPal3, 0.5) * halo) * uDisk;
      col = col * (1.0 - captured) + disk * uDisk + glow;
      cover = max(captured, (1.0 - T) * 0.9);
    }

    float fade = uSwallow > 0.0 ? 1.0 - smoothstep(uSwallow - 0.25, uSwallow, r) : 0.0;
    float dark = max(fade, uVeil);
    cover = max(cover, dark);
    col *= (1.0 - dark);
    fragColor = vec4(col * uIntensity, cover);
  }
`;

export function createScene(ctx) {
  const { THREE, quality } = ctx;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, ctx.width / Math.max(1, ctx.height), 0.5, 4000);
  camera.position.set(0, 0, 0);
  const tier = quality.tier;
  const STARS = tier === 'low' ? 4000 : tier === 'high' ? 16000 : 9000;
  const STEPS = tier === 'low' ? 36 : tier === 'high' ? 72 : 52;
  const fovK = 1 / (2 * Math.tan((FOV * Math.PI) / 360));

  const pal = () => Array.from({ length: 5 }, () => ({ value: new THREE.Color(1, 1, 1) }));
  const [sp0, sp1, sp2] = pal();
  const [op0, op1, op2, op3, op4] = pal();
  const [vp0, vp1, vp2, vp3, vp4] = pal();

  // --- stars: one instanced mesh of streak capsules
  const starGeo = new THREE.InstancedBufferGeometry();
  const quadPos = new Float32Array([-1, 0, 0, 1, 0, 0, -1, 1, 0, 1, 1, 0]);
  const quadUV = new Float32Array([-1, 0, 1, 0, -1, 1, 1, 1]);
  starGeo.setAttribute('position', new THREE.BufferAttribute(quadPos, 3));
  starGeo.setAttribute('aQuad', new THREE.BufferAttribute(quadUV, 2));
  starGeo.setIndex([0, 1, 2, 2, 1, 3]);
  const starPos = new Float32Array(STARS * 3);
  const starInfo = new Float32Array(STARS * 3);
  for (let i = 0; i < STARS; i++) {
    starPos[i * 3] = (Math.random() * 2 - 1) * BOX_W;
    starPos[i * 3 + 1] = (Math.random() * 2 - 1) * BOX_H;
    starPos[i * 3 + 2] = Math.random() * BOX_DEPTH;
    starInfo[i * 3] = Math.pow(Math.random(), 5) * 1.4 + 0.05;
    starInfo[i * 3 + 1] = Math.random();
    starInfo[i * 3 + 2] = Math.random();
  }
  starGeo.setAttribute('aStar', new THREE.InstancedBufferAttribute(starPos, 3));
  starGeo.setAttribute('aInfo', new THREE.InstancedBufferAttribute(starInfo, 3));
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
    uRes: { value: new THREE.Vector2(ctx.width, ctx.height) },
    uHole: { value: new THREE.Vector2(0, 0) },
    uPal0: sp0, uPal1: sp1, uPal2: sp2,
    uIntensity: { value: 1 },
  };
  const starMat = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: starU,
    vertexShader: STAR_VERT,
    fragmentShader: STAR_FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });
  const stars = new THREE.Mesh(starGeo, starMat);
  stars.frustumCulled = false;
  stars.renderOrder = 2;
  scene.add(stars);

  // --- celestial object: one camera-facing quad, analytic bodies
  const objU = {
    uObjPos: { value: new THREE.Vector3(0, 0, -OBJ_SPAWN_Z) },
    uExtent: { value: 1 },
    uAspect: { value: ctx.width / Math.max(1, ctx.height) },
    uHole: { value: new THREE.Vector2(0, 0) },
    uShape: { value: 0 },
    uScale: { value: 1 },
    uAlpha: { value: 0 },
    uPulse: { value: 0 },
    uTime: { value: 0 },
    uSeed: { value: 0.37 },
    uIntensity: { value: 1 },
    uPal0: op0, uPal1: op1, uPal2: op2, uPal3: op3, uPal4: op4,
  };
  const objMat = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: objU,
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
  obj.renderOrder = 1;
  obj.visible = false;
  scene.add(obj);

  // --- overlay: black hole, glow, flash, swallow, veil
  const overU = {
    uRes: { value: new THREE.Vector2(ctx.width, ctx.height) },
    uTime: { value: 0 },
    uWarp: { value: 0 },
    uFlash: { value: 0 },
    uVeil: { value: 0 },
    uSwallow: { value: 0 },
    uIntensity: { value: 1 },
    uRoll: { value: 0 },
    uHoleD: { value: 0 },
    uDisk: { value: 0 },
    uPal0: vp0, uPal1: vp1, uPal2: vp2, uPal3: vp3, uPal4: vp4,
  };
  const overMat = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: overU,
    defines: { STEPS },
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

  // --- state
  const approach = (v, to, tau, dt) => v + (to - v) * (1 - Math.exp(-dt / tau));
  const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const smooth = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
  const ease = (u) => u * u * (3 - 2 * u);

  let travel = 0, side = 0, speed = CRUISE, kick = 0;
  let warpS = 0, sxS = 0, syS = 0, flash = 0, orderS = 0, breath = 1;
  let jumping = false;
  let objActive = false, objShape = -1, objZ = -OBJ_SPAWN_Z, objX = 0, objY = 0, objAlpha = 0, objTarget = 0, objScale = 1;
  let seq = 0.618;
  let bankT = -1, bankSide = 0, roll = 0, yaw = 0, rollT = 0, yawT = 0;
  let holeT = -1, voidDone = false;
  let holeD = 0, disk = 0, lensE = 0, swallow = 0, veil = 0;
  let pulse = 0, beatPrev = 0;
  const padPrev = new Float32Array(PADS);

  function spawnObject() {
    seq = (seq * 9.731 + 0.317) % 1;
    let shape = Math.floor(seq * SHAPES);
    if (shape === objShape) shape = (shape + 1) % SHAPES;
    objShape = shape;
    const s2 = (seq * 7.13 + 0.51) % 1;
    const s3 = (seq * 3.77 + 0.23) % 1;
    objZ = -OBJ_SPAWN_Z;
    objX = (s2 - 0.5) * 0.34 * OBJ_SPAWN_Z;
    objY = (s3 - 0.5) * 0.18 * OBJ_SPAWN_Z;
    objScale = shape === 1 ? 2.2 : shape === 2 ? 1.5 : shape === 4 ? 1.6 : 1.0;
    objU.uSeed.value = (seq * 100) % 10;
    objU.uShape.value = shape;
    objActive = true;
    objAlpha = 0;
    objTarget = 1;
  }

  function endJump() {
    flash = Math.max(flash, 0.8);
    if (holeT < 0) spawnObject();
  }

  return {
    scene,
    camera,
    update(dt, t, io) {
      // ---- hand → warp: speed on X, density on closeness, product = amount
      const sx = smooth(0.30, 1.0, io.xy.x);
      const sy = 1 - smooth(0.0, 0.70, io.xy.y);
      const warpRaw = sx * sy;
      warpS = approach(warpS, warpRaw, warpRaw > warpS ? 0.22 : 0.45, dt);
      sxS = approach(sxS, sx, 0.3, dt);
      syS = approach(syS, sy, 0.3, dt);
      if (!jumping && warpS > 0.55) jumping = true;
      else if (jumping && warpS < 0.25) { jumping = false; endJump(); }
      orderS = approach(orderS, clamp01(io.gestures.sway), 0.6, dt);

      // ---- pads: black hole, banks, thrust
      for (let i = 0; i < PADS; i++) {
        const v = io.pads[i];
        if (v > padPrev[i] + 0.3) {
          if (i === PAD_BLACKHOLE) { if (holeT < 0) { holeT = 0; voidDone = false; } }
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

      // ---- black hole: open (approach), swallow (fall in), void, emerge
      let holeDT = 0, diskT = 0, lensT = 0, swallowT = 0, veilT = 0;
      if (holeT >= 0) {
        holeT += dt;
        if (holeT < T_OPEN) {
          const u = ease(holeT / T_OPEN);
          holeDT = 80 - 60 * u; diskT = u; lensT = 0.004 * u;
        } else if (holeT < T_SWALLOW) {
          const u = (holeT - T_OPEN) / (T_SWALLOW - T_OPEN);
          const ue = u * u;
          holeDT = 20 - 17.8 * ue; diskT = 1; lensT = 0.004 + 0.03 * ue;
          swallowT = 1.3 * smooth(0.55, 1.0, u);
        } else if (holeT < T_VOID) {
          if (!voidDone) {
            voidDone = true;
            travel += 1000 + seq * 500;
            side += 300 + seq * 200;
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
        holeD = holeD === 0 ? holeDT : approach(holeD, holeDT, 0.08, dt);
        disk = approach(disk, diskT, 0.12, dt);
        lensE = approach(lensE, lensT, 0.08, dt);
        swallow = approach(swallow, swallowT, 0.06, dt);
        veil = 0;
      } else if (holeT >= T_SWALLOW && holeT < T_END) {
        holeD = 0; disk = 0; lensE = 0; swallow = 0; veil = veilT;
      } else {
        holeD = 0; disk = 0; lensE = 0; swallow = 0; veil = approach(veil, 0, 0.1, dt);
      }
      const shadowR = holeD > 0 ? (2.36 / holeD) * 1.02 : 0;

      // ---- flight: forward only; the jump multiplies speed, strikes kick it
      const targetSpeed = CRUISE * (1 + warpS * WARP_GAIN) + kick * 160 + io.beat * 30;
      speed = approach(speed, targetSpeed, targetSpeed > speed ? 0.35 : 0.9, dt);
      kick = Math.max(0, kick - dt * 2.2);
      travel += speed * dt;
      flash = Math.max(0, flash - dt * 2.5);
      breath = approach(breath, 0.85 + io.level * 0.45, 0.2, dt);
      // the star's streak: where it was a shutter ago, longer in the jump
      const tail = Math.min(BOX_DEPTH * 0.6, speed * (0.05 + warpS * 0.45) + warpS * 30);

      // ---- the object ahead: approach at flight speed; leave it on a jump
      if (objActive) {
        objZ += speed * dt * (jumping ? 0.25 : 1);
        if (jumping || objZ > -50) objTarget = 0;
        objAlpha = approach(objAlpha, objTarget, objTarget > objAlpha ? 1.2 : 0.5, dt);
        if ((objTarget === 0 && objAlpha < 0.01) || objZ > 30) objActive = false;
      } else {
        objAlpha = 0;
      }
      obj.visible = objActive && objAlpha > 0.002;

      // ---- uniforms
      const pl = io.palette;
      sp0.value.copy(pl[0]); sp1.value.copy(pl[1]); sp2.value.copy(pl[2]);
      op0.value.copy(pl[0]); op1.value.copy(pl[1]); op2.value.copy(pl[2]); op3.value.copy(pl[3]); op4.value.copy(pl[4]);
      vp0.value.copy(pl[0]); vp1.value.copy(pl[1]); vp2.value.copy(pl[2]); vp3.value.copy(pl[3]); vp4.value.copy(pl[4]);

      starU.uTravel.value = travel;
      starU.uSide.value = side;
      starU.uTime.value = t;
      starU.uTwinkle.value = io.bands.high;
      starU.uBreath.value = breath;
      starU.uOrder.value = orderS;
      starU.uTail.value = tail;
      starU.uGain.value = warpS * 1.6 + io.bands.bass * 0.3;
      starU.uHole.value.set(lensE, shadowR);
      starU.uIntensity.value = io.intensity;

      objU.uTime.value = t;
      objU.uScale.value = objScale;
      objU.uExtent.value = (objShape >= 0 ? OBJ_EXTENT[objShape] : 1) * objScale;
      objU.uAlpha.value = objAlpha;
      objU.uPulse.value = Math.max(pulse, 0.5 + 0.5 * Math.sin(t * 7.0));
      objU.uObjPos.value.set(objX, objY, objZ);
      objU.uHole.value.set(lensE, shadowR);
      objU.uIntensity.value = io.intensity;

      overU.uTime.value = t;
      overU.uWarp.value = warpS;
      overU.uFlash.value = flash;
      overU.uVeil.value = veil;
      overU.uSwallow.value = swallow;
      overU.uIntensity.value = io.intensity;
      overU.uRoll.value = roll;
      overU.uHoleD.value = holeD;
      overU.uDisk.value = disk;
    },
    resize(w, h) {
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      starU.uAspect.value = w / Math.max(1, h);
      objU.uAspect.value = w / Math.max(1, h);
      starU.uRes.value.set(w, h);
      overU.uRes.value.set(w, h);
    },
    dispose() {
      starGeo.dispose();
      starMat.dispose();
      objGeo.dispose();
      objMat.dispose();
      overGeo.dispose();
      overMat.dispose();
    },
  };
}
