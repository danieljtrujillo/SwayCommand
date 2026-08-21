// Miracle Mile — four acts of the atom, one knob apart: the collider, the
// split atom, the mushroom cloud, the shockwave down the boulevard.
//
//   ACT         KNOB 6 (io.knobs[5]) picks it in quarter turns: 0–¼ COLLIDER,
//               ¼–½ FISSION, ½–¾ DETONATION, ¾–1 SHOCKWAVE — so the 0.5
//               default rests on the mature mushroom cloud, turning left walks
//               back to the split atom and the collider, turning right goes
//               to the boulevard. An act change dissolves over 0.7 s.
//   EVENT       Any pad STRIKE fires the act's event: a collision, a neutron
//               into the nucleus, a detonation, a blast down the boulevard.
//   YIELD       KNOB 5 (io.knobs[4]) is the yield, 0.5 nominal: collision
//               multiplicity, prompt-neutron count and fragment speed, the
//               cloud's scale, the blast's speed and dust.
//   COLLIDER    Inside the detector: a barrel of tracker and calorimeter
//               layers (thin cyan rings and axial lines, one instanced mesh
//               of capsules), the beam pipe on the axis, two bunches racing
//               in from either end and crossing at the interaction point. A
//               strike is the collision: 40–120 charged tracks spray from the
//               vertex as helices in the solenoid field (the helix is rebuilt
//               every frame from each track's pT, φ, η and charge, so the
//               field is live), propagate outward in 0.4 s, leave hits on
//               every layer they cross and dump energy into calorimeter bars
//               at the barrel, then the event fades over ~3 s. Jets: most
//               tracks cluster about three random axes. SWAY is the field
//               strength — the tracks curl tighter as it rises; PRESS dives
//               the eye toward the vertex; the hand orbits the detector (a
//               hand-driven orbit, the one rotation here).
//   FISSION     A lattice of thirteen nuclei in a void — one at the centre,
//               twelve around it on an icosahedron — each a packed cluster of
//               nucleons (sphere impostors, protons warm, neutrons cool) that
//               jitter in place. A strike fires a neutron at the nearest idle
//               nucleus: on capture the drop swells and oscillates, elongates,
//               necks and splits; the two fragments fly apart hot and cooling
//               while two to four prompt neutrons leave for neighbouring
//               nuclei, which split in turn — the chain reaction runs across
//               the lattice with a gamma flash and an expanding shell at
//               every scission, white-out when the last one goes, then the
//               lattice re-forms. SWAY morphs the split from a clean symmetric
//               scission to a wobbling asymmetric one (unequal fragments, a
//               long neck); PRESS compresses the nuclei; the hand orbits.
//   DETONATION  A desert night with a city skyline between the eye and ground
//               zero. At rest the cloud stands mature and churns (the cap's
//               convective roll and the stem's updraft are flows of the noise
//               domain, not rotation of anything). A strike detonates: the
//               flash bleaches the world, the fireball swells and lifts,
//               drawing the stem up out of the ground dust, the cap forms and
//               broadens, glows from within and cools through orange to ash
//               over ~25 s, the base surge rolls out across the ground. The
//               cloud is a raymarched volume: a mushroom SDF (cap ellipsoid
//               and rim torus, stem, bell) broken by three octaves of value
//               noise, lit by its own embers and by the fireball, with a
//               density probe toward the light for self-shadow. SWAY morphs
//               the cloud's build (squat and broad ↔ tall and narrow, calmer
//               ↔ more turbulent); PRESS flattens the cap under an inversion;
//               the hand dollies the eye sideways (X) and raises it (Y); the
//               eye keeps looking at the cloud.
//   SHOCKWAVE   The boulevard at night: a road running to the vanishing
//               point, lit by two rows of lamps, facades with lit windows on
//               both sides. A strike detonates at the vanishing point: the
//               flash, a fireball dome, and the blast front rushes down the
//               boulevard toward the eye — a spherical shell that refracts
//               what lies behind it, a white condensation band just inside
//               it, a wall of dust torn up where it meets the ground, the
//               lamps flaring and dying as it passes them — then it arrives:
//               the eye shakes, dust sweeps over the view, embers fall in the
//               dark, and the boulevard relights near-to-far to be ready
//               again. SWAY morphs the front (a clean hemisphere ↔ a flat
//               Mach stem with a taller dust wall); PRESS ducks the eye; the
//               hand sets the position across the road (X) and the eye's
//               height (Y).
//
// Nothing rotates by itself: the orbits are the hand's, bunches, tracks,
// fragments and the front travel paths, the cloud's roll is a flow. Three
// systems: the world quad (backgrounds, the cloud, the boulevard, the blast
// — GLSL3 raymarch and analytic geometry from the camera's frame), one
// instanced mesh of screen-space capsules (detector lines, tracks,
// calorimeter bars, neutron streaks, lamp posts), two instanced meshes of
// sphere impostors (solid: nucleons; additive glows: bunches, hits, free
// neutrons, lamp heads, embers). Live bloom rides the flash. Colour comes
// from the palette: 0 the hot core, 1 fire, 2 the detector and cool matter,
// 3 the secondary tracks and gamma, 4 ash and dust.

export const meta = { id: 'miraclemile', name: 'Miracle Mile', mood: 'critical' };

const ACTS = 4; // collider, fission, detonation, shockwave
const ACT_FADE = 0.7;
const FOV = 55;

// the collider
const LAYERS = [1.1, 1.8, 2.6, 3.5, 4.6, 5.8];
const HALF_Z = 6;
const RING_SEGS = 36;
const AXIALS = 18;
const DET_CAPS = LAYERS.length * (2 * RING_SEGS + AXIALS) + 1;
const MAX_TRACKS = 120;
const TRACK_SEGS = 20;
const TRACK_CAPS = MAX_TRACKS * TRACK_SEGS;
const MAX_HITS = MAX_TRACKS * 4;
const CALO_R = 6.2;
const TRACK_C = 18; // propagation speed, units per second

// fission
const NUCLEI = 13;
const NUCLEONS = 72;
const NUC_R = 1.0;
const LATTICE_D = 4.0;
const MAX_NEUTRONS = 48;

// shockwave
const LAMPS = 28;
const LAMP_DZ = 14;
const LAMP_Z0 = -12;
const LAMP_X = 8.5;
const LAMP_H = 7;
const GZ_Z = -160;
const BLAST_V = 60;
const EMBERS = 160;

const N_CAPS = DET_CAPS + TRACK_CAPS + MAX_TRACKS + MAX_NEUTRONS + LAMPS * 2;
const CAP_TRACK0 = DET_CAPS;
const CAP_CALO0 = CAP_TRACK0 + TRACK_CAPS;
const CAP_NEUT0 = CAP_CALO0 + MAX_TRACKS;
const CAP_LAMP0 = CAP_NEUT0 + MAX_NEUTRONS;
const N_SOLID = NUCLEI * NUCLEONS;
const N_GLOW = 2 + MAX_HITS + MAX_NEUTRONS + LAMPS * 2 + EMBERS + 1;
const GL_BUNCH0 = 0;
const GL_HIT0 = 2;
const GL_NEUT0 = GL_HIT0 + MAX_HITS;
const GL_LAMP0 = GL_NEUT0 + MAX_NEUTRONS;
const GL_EMBER0 = GL_LAMP0 + LAMPS * 2;
const GL_VERTEX = GL_EMBER0 + EMBERS;

const GLSL_COMMON = /* glsl */ `
  #define PI 3.14159265359
  #define TAU 6.28318530718
  float h11(float n) { return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
  float h21(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float h31(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float vnoise2(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y);
  }
  float vnoise3(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = h31(i), n100 = h31(i + vec3(1, 0, 0)), n010 = h31(i + vec3(0, 1, 0)), n110 = h31(i + vec3(1, 1, 0));
    float n001 = h31(i + vec3(0, 0, 1)), n101 = h31(i + vec3(1, 0, 1)), n011 = h31(i + vec3(0, 1, 1)), n111 = h31(i + vec3(1, 1, 1));
    return mix(mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y), mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y), f.z);
  }
  float fbm2(vec2 p) {
    float n = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { n += a * vnoise2(p); p = p * 2.03 + 7.1; a *= 0.5; }
    return n;
  }
  float fbm3(vec3 p) {
    float n = 0.0, a = 0.5;
    for (int i = 0; i < 3; i++) { n += a * vnoise3(p); p = p * 2.07 + 5.3; a *= 0.5; }
    return n;
  }
  // palette ramp: 0..4 between the five entries, 4..5 toward white
  vec3 ramp(vec3 p0, vec3 p1, vec3 p2, vec3 p3, vec3 p4, float t) {
    t = clamp(t, 0.0, 5.0);
    if (t < 1.0) return mix(p0, p1, t);
    if (t < 2.0) return mix(p1, p2, t - 1.0);
    if (t < 3.0) return mix(p2, p3, t - 2.0);
    if (t < 4.0) return mix(p3, p4, t - 3.0);
    return mix(p4, vec3(1.0), t - 4.0);
  }
`;

// ------------------------------------------------------------- the world quad
// Rays come from the camera's frame (uCamPos, uCamFwd/Right/Up, uTanHalf) so
// the analytic backgrounds, the cloud march and the blast agree with the
// capsule and impostor meshes drawn by the same camera.
const WORLD_FRAG = /* glsl */ `
  ${GLSL_COMMON}
  uniform vec2 uRes;
  uniform vec3 uCamPos, uCamFwd, uCamRight, uCamUp;
  uniform float uTanHalf, uTime, uIntensity, uFlash, uBass, uBeat, uHigh;
  uniform vec4 uActW; // act weights: collider, fission, detonation, shockwave
  uniform vec3 uPal0, uPal1, uPal2, uPal3, uPal4;
  // collider
  uniform float uVertexGlow, uCollFlash;
  // fission
  uniform vec4 uNuc[${NUCLEI}];  // xyz centre, w glow (0 gone, 1 intact, >1 hot)
  uniform vec4 uGamma[4];        // xyz centre, w radius (<=0 none)
  uniform float uGammaA[4];      // the four shells' brightness
  // detonation
  uniform float uCloudAge, uCloudScale, uCloudMorph, uCloudPress, uSkySeed;
  // shockwave
  uniform float uBlastAge, uBlastR, uBlastMorph, uBlastFire, uVeil, uDustH;
  in vec2 vUv;
  out vec4 fragColor;

  // ---- collider: the hall, the beam pipe, the interaction point
  vec3 colliderBg(vec3 ro, vec3 rd) {
    vec3 c = cross(rd, vec3(0.0, 0.0, 1.0));
    float cl = length(c);
    float dAx = cl > 1e-5 ? abs(dot(ro, c)) / cl : length(ro.xy);
    float dC = length(cross(ro, rd));
    vec3 col = uPal2 * 0.018 * (0.6 + 0.4 * rd.y);
    col += mix(uPal2, vec3(1.0), 0.3) * 0.07 * exp(-dAx * 2.2);
    col += mix(uPal2, vec3(1.0), 0.5) * (0.3 + uVertexGlow) * exp(-dC * 1.6) * 0.5;
    col += vec3(1.0) * uCollFlash * 0.6 * exp(-dC * 0.35);
    return col;
  }

  // ---- fission: the void, each nucleus's glow, the gamma shells
  vec3 fissionBg(vec3 ro, vec3 rd) {
    vec3 col = uPal1 * 0.01 + uPal4 * 0.02 * (0.5 + 0.5 * rd.y);
    for (int i = 0; i < ${NUCLEI}; i++) {
      vec4 n = uNuc[i];
      vec3 v = n.xyz - ro;
      float ahead = step(0.0, dot(v, rd));
      float dC = length(cross(v, rd));
      col += mix(uPal1, uPal0, 0.4) * n.w * 0.1 * exp(-dC * dC * 0.8) * ahead;
    }
    for (int k = 0; k < 4; k++) {
      vec4 g = uGamma[k];
      if (g.w <= 0.0) continue;
      float dC = length(cross(g.xyz - ro, rd));
      float ring = exp(-pow((dC - g.w) / (0.06 + g.w * 0.07), 2.0));
      col += mix(uPal3, vec3(1.0), 0.5) * ring * uGammaA[k] * 0.9;
    }
    return col;
  }

  // ---- the mushroom cloud
  float sdTorus(vec3 p, float R, float r) { return length(vec2(length(p.xz) - R, p.y)) - r; }
  float sdEllipsoid(vec3 p, vec3 r) { float k0 = length(p / r); float k1 = length(p / (r * r)); return k0 * (k0 - 1.0) / max(k1, 1e-5); }
  float sdCapCyl(vec3 p, float h, float r) { vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)); }
  float smin(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }

  // cap centre height for an age (the march needs it for its bound and light)
  float capHeight(float a, float m, float q, float sc) {
    float rise = 1.0 - exp(-a / 7.0);
    return sc * (1.5 + 9.0 * rise) * (1.0 + 0.35 * m) * (1.0 - 0.25 * q);
  }
  // density at p (ground zero at the origin, y up); heat is the emissive temperature
  float cloudMap(vec3 p, float a, float m, float q, float sc, out float heat) {
    float s = smoothstep(0.6, 16.0, a);
    float yc = capHeight(a, m, q, sc);
    float Rc = sc * (1.6 + 2.8 * s) * (1.0 - 0.3 * m) * (1.0 + 0.35 * q);
    float rc = sc * (1.4 + 0.8 * s) * (1.0 - 0.35 * q);
    float rs = sc * (0.5 + 0.7 * s) * (1.0 - 0.2 * m);
    vec3 pc = p - vec3(0.0, yc, 0.0);
    float dCap = sdEllipsoid(pc, vec3(Rc + rc, rc * 1.15, Rc + rc));
    float dRim = sdTorus(pc - vec3(0.0, -rc * 0.25, 0.0), Rc + rc * 0.5, rc * 0.85);
    float stemR = rs * (1.0 + 0.4 * (1.0 - clamp(p.y / yc, 0.0, 1.0)));
    float dStem = sdCapCyl(p - vec3(0.0, yc * 0.5, 0.0), yc * 0.5, stemR);
    float dBell = sdTorus(pc - vec3(0.0, -rc * 1.3, 0.0), Rc * 1.1, rc * 0.3) + (1.0 - s) * sc;
    float d = min(smin(min(dCap, dRim), dStem, sc * 0.7), dBell);
    // the cap rolls about its core ring, the stem draws upward: flows of the noise domain
    float r = length(p.xz);
    float phi = atan(p.z, p.x);
    float wc = smoothstep(yc - rc * 2.2, yc - rc * 0.8, p.y);
    float theta = atan(pc.y, r - Rc) + uTime * (0.3 + 0.5 * m) * wc;
    float rho = length(vec2(r - Rc, pc.y));
    float rr = Rc + rho * cos(theta);
    vec3 pn = vec3(rr * cos(phi), yc + rho * sin(theta), rr * sin(phi));
    vec3 ps = mix(p - vec3(0.0, uTime * 1.2, 0.0), pn, wc) / sc;
    float n = fbm3(ps * (1.1 + 0.6 * m) + vec3(0.0, 0.0, 17.0));
    float dn = d + (0.55 - n) * sc * (0.9 + 0.9 * m);
    float dens = smoothstep(0.0, -0.8 * sc, dn);
    float fire = exp(-a / 2.2);
    float dCore = length(pc) / (sc * (1.6 + 1.6 * s));
    heat = fire * exp(-dCore * dCore * 1.2) * 4.0 + exp(-a / 22.0) * 0.45 * smoothstep(1.0, 0.2, dCore);
    return dens;
  }
  vec4 marchCloud(vec3 ro, vec3 rd, float a, float m, float q, float sc, float tMax) {
    float s = smoothstep(0.6, 16.0, a);
    float yc = capHeight(a, m, q, sc);
    float Rb = max(yc * 0.7, sc * 2.5) + sc * (1.0 + 3.4 * s) * 1.4;
    vec3 cb = vec3(0.0, yc * 0.55, 0.0);
    vec3 oc = ro - cb;
    float b = dot(oc, rd);
    float c = dot(oc, oc) - Rb * Rb;
    float h = b * b - c;
    if (h < 0.0) return vec4(0.0);
    h = sqrt(h);
    float t0 = max(-b - h, 0.0);
    float t1 = min(-b + h, tMax);
    if (t1 <= t0) return vec4(0.0);
    float stepLen = (t1 - t0) / float(CLOUD_STEPS);
    float t = t0 + stepLen * h31(rd * 100.0 + uTime);
    vec3 acc = vec3(0.0);
    float T = 1.0;
    vec3 lightPos = vec3(0.0, yc, 0.0);
    vec3 ash = mix(uPal4, vec3(1.0), 0.3);
    float fireL = 3.5 * exp(-a / 2.5) + 0.35 * exp(-a / 16.0);
    for (int i = 0; i < CLOUD_STEPS; i++) {
      vec3 p = ro + rd * t;
      float heat;
      float dens = cloudMap(p, a, m, q, sc, heat);
      if (dens > 0.003) {
        vec3 toL = normalize(lightPos - p);
        float hp;
        float dl = cloudMap(p + toL * sc * 0.7, a, m, q, sc, hp);
        float lit = exp(-dl * 2.2);
        float dist = length(lightPos - p) / sc;
        float fl = fireL / (1.0 + dist * dist * 0.35);
        float du = cloudMap(p + vec3(0.0, sc * 0.8, 0.0), a, m, q, sc, hp);
        // the night sky from above, the city's glow from below, the fireball from within
        float sky = 0.34 * exp(-du * 1.8);
        float city = 0.14 * smoothstep(yc, 0.0, p.y);
        vec3 emit = mix(uPal1, uPal0, clamp(heat * 0.5, 0.0, 1.0)) * heat;
        vec3 col = emit + ash * (fl * lit * mix(uPal1, vec3(1.0), 0.3) + sky) + uPal1 * city;
        float al = 1.0 - exp(-dens * stepLen * 1.6 / sc);
        acc += T * col * al;
        T *= 1.0 - al;
        if (T < 0.02) break;
      }
      t += stepLen;
    }
    return vec4(acc, 1.0 - T);
  }

  // ---- detonation: desert night, the skyline, the cloud behind it
  vec3 detonation(vec3 ro, vec3 rd) {
    float a = uCloudAge, sc = uCloudScale, m = uCloudMorph, q = uCloudPress;
    vec3 GZ = vec3(0.0, 0.0, -40.0);
    float fire = 3.5 * exp(-a / 2.0) + 0.3 * exp(-a / 12.0);
    vec3 col = mix(uPal4, uPal1, 0.3) * 0.03 * exp(-max(rd.y, 0.0) * 9.0);
    vec3 sc3 = rd * 90.0;
    vec3 sf = fract(sc3) - 0.5;
    col += vec3(1.0) * step(0.9935, h31(floor(sc3))) * exp(-dot(sf, sf) * 40.0) * 0.5 * smoothstep(0.0, 0.2, rd.y);
    float tg = rd.y < -0.0005 ? -ro.y / rd.y : -1.0;
    float tc = rd.z < -0.0005 ? (-22.0 - ro.z) / rd.z : -1.0;
    bool building = false;
    if (tc > 0.0 && (tg < 0.0 || tc < tg)) {
      vec3 pc = ro + rd * tc;
      float cellX = floor(pc.x / 3.0);
      float skyH = 0.8 + 3.4 * pow(h11(cellX * 1.7 + uSkySeed), 1.6);
      if (pc.y > 0.0 && pc.y < skyH) {
        // a backlit silhouette: dark, windows, a rim the fireball throws over its edge
        vec2 wuv = vec2(pc.x / 0.5, pc.y / 0.7);
        float win = step(0.55, h21(floor(wuv) + uSkySeed)) * step(0.35, fract(wuv.x)) * (1.0 - step(0.8, fract(wuv.x))) * step(0.4, fract(wuv.y)) * (1.0 - step(0.85, fract(wuv.y)));
        vec3 b = uPal4 * 0.02 + mix(uPal0, uPal1, 0.5) * win * 0.3;
        b += uPal1 * exp(-(skyH - pc.y) * 2.5) * fire * 0.25;
        col = b;
        building = true;
      }
    }
    float tMax = 1e9;
    if (!building && tg > 0.0) {
      vec3 pg = ro + rd * tg;
      float dist = length(pg - GZ);
      float gl = fire * 6.0 / (4.0 + dist * dist * 0.02);
      float gn = 0.7 + 0.3 * vnoise2(pg.xz * 0.7);
      vec3 gcol = mix(uPal4, uPal1, 0.35) * 0.04 * gn + uPal1 * gl * gn * 0.5;
      float ring = 2.0 * sc + a * 1.3 * sc;
      float dust = smoothstep(1.6 * sc, 0.0, abs(dist - ring)) * fbm2(pg.xz * 0.5 + a) * smoothstep(30.0, 4.0, a);
      gcol += mix(uPal4, uPal1, 0.4) * dust * (0.3 + fire * 0.2);
      col = gcol * (1.0 - smoothstep(40.0, 140.0, dist));
      tMax = tg;
    }
    if (!building) {
      vec4 cl = marchCloud(ro - GZ, rd, a, m, q, sc, tMax);
      col = col * (1.0 - cl.a) + cl.rgb;
      float dC = length(cross(GZ + vec3(0.0, capHeight(a, m, q, sc), 0.0) - ro, rd));
      col += mix(uPal1, uPal0, 0.6) * fire * 0.12 / (1.0 + dC * dC * 0.05);
    }
    return col;
  }

  // ---- shockwave: the boulevard and the blast front
  float lampOn(vec3 lp, float a, float rs) {
    if (a < 0.0) return 1.0;
    float d = length(lp - vec3(0.0, 0.0, ${GZ_Z}.0));
    float passed = step(d, rs);
    float flare = passed * exp(-(rs - d) / (${BLAST_V}.0 * 0.35)) * 4.0;
    float relight = smoothstep(0.0, 1.0, (a - 7.0) * 0.7 - (-lp.z) / 120.0);
    return max((1.0 - passed) + flare, relight);
  }
  float lampLight(vec3 p, float a, float rs) {
    float k0 = floor((-p.z - ${-LAMP_Z0}.0) / ${LAMP_DZ}.0);
    float sum = 0.0;
    for (int i = -1; i <= 2; i++) {
      float k = clamp(k0 + float(i), 0.0, ${LAMPS - 1}.0);
      float lz = ${LAMP_Z0}.0 - ${LAMP_DZ}.0 * k;
      for (int s = 0; s < 2; s++) {
        vec3 lp = vec3(s == 0 ? -${LAMP_X} : ${LAMP_X}, ${LAMP_H}.0, lz);
        vec3 dv = p - lp;
        float d2 = dot(dv, dv);
        float cosT = max(-dv.y, 0.0) / sqrt(d2);
        sum += lampOn(lp, a, rs) * 28.0 * cosT / (d2 + 4.0);
      }
    }
    return sum;
  }
  vec3 boulevardBg(vec3 ro, vec3 rd, float a, float rs, out float tHit) {
    tHit = 1e9;
    vec3 col = mix(uPal4, uPal1, 0.4) * 0.035 * exp(-max(rd.y, 0.0) * 10.0);
    vec3 sc3 = rd * 120.0;
    vec3 sf = fract(sc3) - 0.5;
    col += vec3(1.0) * step(0.994, h31(floor(sc3))) * exp(-dot(sf, sf) * 40.0) * 0.45 * smoothstep(0.02, 0.3, rd.y);
    float tf = abs(rd.x) > 1e-4 ? ((rd.x > 0.0 ? 10.0 : -10.0) - ro.x) / rd.x : -1.0;
    float tg = rd.y < -1e-4 ? -ro.y / rd.y : -1.0;
    bool done = false;
    if (tf > 0.0 && (tg < 0.0 || tf < tg)) {
      vec3 p = ro + rd * tf;
      float block = floor(-p.z / 18.0);
      float hB = 5.0 + 16.0 * pow(h11(block * 3.1 + (rd.x > 0.0 ? 0.0 : 7.0)), 1.4);
      if (p.y < hB && p.z < -2.0) {
        tHit = tf;
        vec2 wuv = vec2(-p.z / 1.4, p.y / 1.1);
        float on = step(0.62, h21(floor(wuv) + block));
        float win = on * step(0.3, fract(wuv.x)) * (1.0 - step(0.75, fract(wuv.x))) * step(0.35, fract(wuv.y)) * (1.0 - step(0.8, fract(wuv.y)));
        float lit = lampOn(vec3(p.x, 0.0, p.z), a, rs);
        vec3 f = uPal4 * 0.015 + mix(uPal0, uPal1, 0.45) * win * 0.3 * clamp(lit, 0.0, 1.0);
        f += lampLight(p, a, rs) * mix(uPal4, uPal0, 0.3) * 0.25;
        col = f * (1.0 - smoothstep(120.0, 300.0, -p.z));
        done = true;
      }
    }
    if (!done && tg > 0.0) {
      vec3 p = ro + rd * tg;
      tHit = tg;
      float ax = abs(p.x);
      float road = 1.0 - smoothstep(8.0, 8.3, ax);
      float dash = step(0.5, fract(-p.z / 6.0)) * (1.0 - smoothstep(0.08, 0.14, abs(ax - 4.0)));
      float median = 1.0 - smoothstep(0.06, 0.12, ax);
      float gn = 0.8 + 0.4 * vnoise2(p.xz * 0.8);
      vec3 asphalt = uPal4 * 0.03 * gn;
      vec3 paint = mix(uPal2, vec3(1.0), 0.6) * 0.2;
      vec3 g = mix(uPal4 * 0.015, asphalt + paint * (dash + median * 0.6), road);
      g += lampLight(p, a, rs) * mix(uPal0, uPal1, 0.35) * 0.9 * gn;
      col = g * (1.0 - smoothstep(120.0, 320.0, -p.z));
    }
    return col;
  }
  vec3 shockwave(vec3 ro, vec3 rd, vec2 uv) {
    float a = uBlastAge;
    float rs = uBlastR;
    vec3 GZ = vec3(0.0, 0.0, ${GZ_Z}.0);
    float fire = uBlastFire;
    // the front: where the ray meets the shell (the eye outside it)
    float tIn = -1.0;
    vec3 nIn = vec3(0.0);
    vec3 oc = ro - GZ;
    if (a >= 0.0 && dot(oc, oc) > rs * rs) {
      float b = dot(oc, rd);
      float h = b * b - (dot(oc, oc) - rs * rs);
      if (h > 0.0) { tIn = -b - sqrt(h); nIn = normalize(oc + rd * tIn); }
    }
    float tBg;
    vec3 col = boulevardBg(ro, rd, a, rs, tBg);
    float bImp = length(cross(GZ - ro, rd));
    if (tIn > 0.0 && tBg > tIn) {
      // what lies behind the front is seen through the shell's density jump
      float graze = pow(1.0 - abs(dot(nIn, rd)), 2.0);
      vec3 rd2 = normalize(rd + nIn * 0.25 * graze * (0.6 + 0.5 * uBlastMorph));
      float t2;
      col = boulevardBg(ro, rd2, a, rs, t2);
      // the condensation band just inside the front, brightest at the limb
      float w = rs * 0.07;
      float c1 = sqrt(max(rs * rs - bImp * bImp, 0.0));
      float c2 = sqrt(max((rs - w) * (rs - w) - bImp * bImp, 0.0));
      float band = clamp((c1 - c2) / (w * 3.0), 0.0, 1.0) * smoothstep(0.1, 0.5, a) * exp(-max(a - 0.5, 0.0) / 1.8);
      col += mix(uPal2, vec3(1.0), 0.7) * band * 0.9;
      col += mix(uPal2, vec3(1.0), 0.5) * exp(-pow((bImp - rs) / (rs * 0.015), 2.0)) * 0.9;
    }
    if (a >= 0.0) {
      // the dust wall torn up where the front meets the ground
      vec2 oc2 = ro.xz - GZ.xz;
      float bq = dot(oc2, rd.xz);
      float cq = dot(oc2, oc2) - rs * rs;
      float aq = dot(rd.xz, rd.xz);
      float hq = bq * bq - aq * cq;
      if (hq > 0.0 && aq > 1e-5) {
        float tw = (-bq - sqrt(hq)) / aq;
        if (tw < 0.0) tw = (-bq + sqrt(hq)) / aq;
        if (tw > 0.0 && tw < tBg) {
          vec3 pw = ro + rd * tw;
          float hd = uDustH;
          if (pw.y > 0.0 && pw.y < hd) {
            float dn = fbm3(vec3(pw.x * 0.25, pw.y * 0.3 - a * 1.5, pw.z * 0.25));
            float op = smoothstep(0.22, 0.6, dn) * smoothstep(hd, hd * 0.45, pw.y);
            // dark at the foot, fire-lit along its crest
            float crest = smoothstep(hd * 0.3, hd * 0.95, pw.y);
            vec3 dustCol = mix(uPal4 * 0.35, mix(uPal1, uPal0, 0.35) * (0.4 + fire * 0.6), crest);
            col = mix(col, dustCol, clamp(op * 1.4, 0.0, 0.96));
          }
        }
      }
      // the fireball dome at ground zero, and its glow
      float rf = 4.0 + 12.0 * (1.0 - exp(-a / 1.5));
      float bq2 = dot(oc, rd);
      float hf = bq2 * bq2 - (dot(oc, oc) - rf * rf);
      if (hf > 0.0 && -bq2 - sqrt(hf) > 0.0 && -bq2 - sqrt(hf) < tBg) {
        vec3 n = normalize(oc + rd * (-bq2 - sqrt(hf)));
        float rim = pow(1.0 - max(dot(n, -rd), 0.0), 2.0);
        col = mix(uPal1, uPal0, 0.5 + 0.5 * fire) * (0.5 + fire * 1.5) * (0.7 + 0.5 * rim);
      }
      col += mix(uPal1, uPal0, 0.5) * fire * 0.25 / (1.0 + bImp * bImp * 0.003);
    }
    // the passage: dust sweeping over the eye, lit by the fire behind it
    float veil = uVeil * fbm2(vec2(uv.x * 3.0 + uTime * 6.0, uv.y * 2.0 - uTime * 3.0));
    float streak = uVeil * fbm2(vec2(uv.x * 1.5 + uTime * 14.0, uv.y * 9.0));
    col = col * (1.0 - veil * 0.8) + mix(uPal4, uPal1, 0.4) * (veil * 0.42 + streak * 0.22) * (0.5 + fire * 0.5);
    return col;
  }

  void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    float aspect = uRes.x / uRes.y;
    vec3 rd = normalize(uCamFwd + uCamRight * (uv.x * uTanHalf * aspect) + uCamUp * (uv.y * uTanHalf));
    vec3 ro = uCamPos;
    vec3 col = vec3(0.0);
    if (uActW.x > 0.002) col += colliderBg(ro, rd) * uActW.x;
    if (uActW.y > 0.002) col += fissionBg(ro, rd) * uActW.y;
    if (uActW.z > 0.002) col += detonation(ro, rd) * uActW.z;
    if (uActW.w > 0.002) col += shockwave(ro, rd, uv) * uActW.w;
    col = mix(col, vec3(1.0), uFlash);
    fragColor = vec4(col * uIntensity, 1.0);
  }
`;

// ---------------------------------------------------- capsules in world space
// Endpoints in world units, projected by the scene camera; the quad is built
// in screen space so a segment is a constant-width capsule at any depth.
// aS = (radius px, alpha, palette index, mode: 0 line, 1 glow, 2 bar).
const CAP_VERT = /* glsl */ `
  uniform vec2 uRes;
  in vec2 aQuad;
  in vec3 aP0;
  in vec3 aP1;
  in vec4 aS;
  out vec2 vQ;
  out float vLenR, vA, vTint, vMode;
  vec2 toScreen(vec3 p, out float w) {
    vec4 c = projectionMatrix * viewMatrix * vec4(p, 1.0);
    w = c.w;
    return c.xy / max(c.w, 0.001) * vec2(uRes.x / uRes.y, 1.0) * 0.5;
  }
  void main() {
    float w0, w1;
    vec2 s0 = toScreen(aP0, w0);
    vec2 s1 = toScreen(aP1, w1);
    float vis = step(0.1, w0) * step(0.1, w1) * step(0.001, aS.y);
    float aspect = uRes.x / uRes.y;
    vec2 d = s1 - s0;
    float len = length(d);
    vec2 dir = len > 1e-5 ? d / len : vec2(1.0, 0.0);
    vec2 nrm = vec2(-dir.y, dir.x);
    float glow = step(0.5, aS.w) * (1.0 - step(1.5, aS.w));
    float rad = max(aS.x, 0.75) / uRes.y * (1.0 + glow * 2.0);
    float cap = 1.0 - step(1.5, aS.w);
    vLenR = len / rad;
    vec2 pos = mix(s0 - dir * rad * cap, s1 + dir * rad * cap, aQuad.y) + nrm * aQuad.x * rad;
    gl_Position = vec4(pos / vec2(aspect, 1.0) * 2.0 * vis, vis > 0.5 ? 0.0 : 2.0, 1.0);
    vQ = vec2(aQuad.x, aQuad.y * (vLenR + 2.0 * cap) - cap);
    vA = aS.y;
    vTint = aS.z;
    vMode = aS.w;
  }
`;
const CAP_FRAG = /* glsl */ `
  ${GLSL_COMMON}
  uniform vec3 uPal0, uPal1, uPal2, uPal3, uPal4;
  uniform float uIntensity;
  in vec2 vQ;
  in float vLenR, vA, vTint, vMode;
  out vec4 fragColor;
  void main() {
    float u = clamp(vQ.y, 0.0, vLenR);
    float dx = vQ.y - u;
    float d2 = dx * dx + vQ.x * vQ.x;
    if (d2 > 1.0) discard;
    float prof;
    if (vMode < 0.5) prof = exp(-d2 * 3.0) * (1.0 - d2 * 0.2);
    else if (vMode < 1.5) prof = exp(-d2 * 2.2) * 0.35;
    else prof = 0.9 * (1.0 - smoothstep(0.7, 1.0, vQ.x * vQ.x));
    vec3 col = ramp(uPal0, uPal1, uPal2, uPal3, uPal4, vTint);
    fragColor = vec4(col * prof * vA * uIntensity, 1.0);
  }
`;

// ------------------------------------------------------------ sphere impostors
// A camera-facing quad per sphere; the fragment shader rebuilds the sphere's
// normal from the quad coordinate. aS = (radius world, alpha, palette index,
// heat). The solid mesh writes depth (nucleons occlude each other); the glow
// mesh is additive.
const SPH_VERT = /* glsl */ `
  in vec2 aQuad;
  in vec3 aPos;
  in vec4 aS;
  out vec2 vQ;
  out float vA, vTint, vHeat;
  void main() {
    vec4 mv = viewMatrix * vec4(aPos, 1.0);
    float vis = step(0.001, aS.y);
    mv.xy += aQuad * aS.x * 1.05;
    vec4 clip = projectionMatrix * mv;
    gl_Position = vis > 0.5 ? clip : vec4(0.0, 0.0, 2.0, 1.0);
    vQ = aQuad * 1.05;
    vA = aS.y;
    vTint = aS.z;
    vHeat = aS.w;
  }
`;
const SPH_FRAG_SOLID = /* glsl */ `
  ${GLSL_COMMON}
  uniform vec3 uPal0, uPal1, uPal2, uPal3, uPal4;
  uniform float uIntensity;
  in vec2 vQ;
  in float vA, vTint, vHeat;
  out vec4 fragColor;
  void main() {
    float r2 = dot(vQ, vQ);
    if (r2 > 1.0) discard;
    vec3 n = vec3(vQ, sqrt(1.0 - r2));
    vec3 L = normalize(vec3(-0.45, 0.6, 0.66));
    float lit = max(dot(n, L), 0.0);
    float rim = pow(1.0 - n.z, 2.5);
    vec3 base = ramp(uPal0, uPal1, uPal2, uPal3, uPal4, vTint);
    float spec = pow(max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0), 40.0);
    vec3 col = base * (0.22 + 0.78 * lit) + vec3(spec * 0.35) + uPal0 * rim * 0.3;
    col += mix(uPal1, uPal0, 0.6) * vHeat * (0.6 + 0.6 * rim);
    col *= 1.0 - smoothstep(0.86, 1.0, r2);
    fragColor = vec4(col * vA * uIntensity, 1.0);
  }
`;
const SPH_FRAG_GLOW = /* glsl */ `
  ${GLSL_COMMON}
  uniform vec3 uPal0, uPal1, uPal2, uPal3, uPal4;
  uniform float uIntensity;
  in vec2 vQ;
  in float vA, vTint, vHeat;
  out vec4 fragColor;
  void main() {
    float r2 = dot(vQ, vQ);
    if (r2 > 1.0) discard;
    float prof = exp(-r2 * 3.5) * (1.0 - r2);
    vec3 col = ramp(uPal0, uPal1, uPal2, uPal3, uPal4, vTint);
    col = mix(col, vec3(1.0), vHeat * 0.5 * exp(-r2 * 6.0));
    fragColor = vec4(col * prof * vA * uIntensity, 1.0);
  }
`;

export function createScene(ctx) {
  const { THREE, quality } = ctx;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, ctx.width / Math.max(1, ctx.height), 0.1, 1200);
  const tier = quality.tier;
  const CLOUD_STEPS = tier === 'low' ? 26 : tier === 'high' ? 60 : 42;
  const pal5 = () => Array.from({ length: 5 }, () => ({ value: new THREE.Color(1, 1, 1) }));
  const wp = pal5(), cp = pal5(), sp = pal5(), gp = pal5();
  const palUniforms = (p) => ({ uPal0: p[0], uPal1: p[1], uPal2: p[2], uPal3: p[3], uPal4: p[4] });

  // --- the world quad -----------------------------------------------------------------
  const nucU = new Float32Array(NUCLEI * 4);
  const gammaU = new Float32Array(16);
  const WU = {
    uRes: { value: new THREE.Vector2(ctx.width, ctx.height) },
    uCamPos: { value: new THREE.Vector3() },
    uCamFwd: { value: new THREE.Vector3(0, 0, -1) },
    uCamRight: { value: new THREE.Vector3(1, 0, 0) },
    uCamUp: { value: new THREE.Vector3(0, 1, 0) },
    uTanHalf: { value: Math.tan((FOV * Math.PI) / 360) },
    uTime: { value: 0 },
    uIntensity: { value: 1 },
    uFlash: { value: 0 },
    uBass: { value: 0 },
    uBeat: { value: 0 },
    uHigh: { value: 0 },
    uActW: { value: new THREE.Vector4(0, 0, 1, 0) },
    uVertexGlow: { value: 0 },
    uCollFlash: { value: 0 },
    uNuc: { value: nucU },
    uGamma: { value: gammaU },
    uGammaA: { value: new Float32Array(4) },
    uCloudAge: { value: 30 },
    uCloudScale: { value: 1 },
    uCloudMorph: { value: 0 },
    uCloudPress: { value: 0 },
    uSkySeed: { value: 3.7 },
    uBlastAge: { value: -1 },
    uBlastR: { value: 0 },
    uBlastMorph: { value: 0 },
    uBlastFire: { value: 0 },
    uVeil: { value: 0 },
    uDustH: { value: 4 },
    ...palUniforms(wp),
  };
  const worldMat = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: WU,
    defines: { CLOUD_STEPS },
    vertexShader: /* glsl */ `
      out vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: WORLD_FRAG,
    depthTest: false,
    depthWrite: false,
  });
  const world = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), worldMat);
  world.frustumCulled = false;
  world.renderOrder = 0;
  scene.add(world);

  // --- one quad geometry for every instanced system ----------------------------------
  const quadPos = new Float32Array([-1, 0, 0, 1, 0, 0, -1, 1, 0, 1, 1, 0]);
  const quadUV = new Float32Array([-1, 0, 1, 0, -1, 1, 1, 1]);
  const sphUV = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
  function instancedQuad(uvs) {
    const g = new THREE.InstancedBufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(quadPos, 3));
    g.setAttribute('aQuad', new THREE.BufferAttribute(uvs, 2));
    g.setIndex([0, 1, 2, 2, 1, 3]);
    return g;
  }
  const dyn = (arr, n) => { const a = new THREE.InstancedBufferAttribute(arr, n); a.setUsage(THREE.DynamicDrawUsage); return a; };

  // capsules
  const capGeo = instancedQuad(quadUV);
  const capP0 = new Float32Array(N_CAPS * 3);
  const capP1 = new Float32Array(N_CAPS * 3);
  const capS = new Float32Array(N_CAPS * 4);
  const capAP0 = dyn(capP0, 3), capAP1 = dyn(capP1, 3), capAS = dyn(capS, 4);
  capGeo.setAttribute('aP0', capAP0);
  capGeo.setAttribute('aP1', capAP1);
  capGeo.setAttribute('aS', capAS);
  capGeo.instanceCount = N_CAPS;
  const CU = { uRes: { value: new THREE.Vector2(ctx.width, ctx.height) }, uIntensity: { value: 1 }, ...palUniforms(cp) };
  const capMat = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3, uniforms: CU, vertexShader: CAP_VERT, fragmentShader: CAP_FRAG,
    transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending,
  });
  const caps = new THREE.Mesh(capGeo, capMat);
  caps.frustumCulled = false;
  caps.renderOrder = 2;
  scene.add(caps);

  // spheres: solids (depth) and glows (additive)
  function sphereSystem(n, frag, pal, solid, order) {
    const geo = instancedQuad(sphUV);
    const pos = new Float32Array(n * 3);
    const s = new Float32Array(n * 4);
    const aPos = dyn(pos, 3), aS = dyn(s, 4);
    geo.setAttribute('aPos', aPos);
    geo.setAttribute('aS', aS);
    geo.instanceCount = n;
    const U = { uIntensity: { value: 1 }, ...palUniforms(pal) };
    const mat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, uniforms: U, vertexShader: SPH_VERT, fragmentShader: frag,
      transparent: !solid, depthTest: solid, depthWrite: solid, side: THREE.DoubleSide,
      blending: solid ? THREE.NormalBlending : THREE.AdditiveBlending,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = order;
    scene.add(mesh);
    return { geo, mat, mesh, pos, s, aPos, aS, U };
  }
  const solids = sphereSystem(N_SOLID, SPH_FRAG_SOLID, sp, true, 1);
  const glows = sphereSystem(N_GLOW, SPH_FRAG_GLOW, gp, false, 3);

  const cap = (i, x0, y0, z0, x1, y1, z1, rad, alpha, tint, mode) => {
    const o = i * 3, q = i * 4;
    capP0[o] = x0; capP0[o + 1] = y0; capP0[o + 2] = z0;
    capP1[o] = x1; capP1[o + 1] = y1; capP1[o + 2] = z1;
    capS[q] = rad; capS[q + 1] = alpha; capS[q + 2] = tint; capS[q + 3] = mode;
  };
  const sph = (sys, i, x, y, z, r, alpha, tint, heat) => {
    const o = i * 3, q = i * 4;
    sys.pos[o] = x; sys.pos[o + 1] = y; sys.pos[o + 2] = z;
    sys.s[q] = r; sys.s[q + 1] = alpha; sys.s[q + 2] = tint; sys.s[q + 3] = heat;
  };

  // --- the detector: static capsules, their alpha set per frame ------------------------
  {
    let i = 0;
    for (const R of LAYERS) {
      for (let e = 0; e < 2; e++) {
        const z = e ? HALF_Z : -HALF_Z;
        for (let k = 0; k < RING_SEGS; k++) {
          const a0 = (k / RING_SEGS) * Math.PI * 2, a1 = ((k + 1) / RING_SEGS) * Math.PI * 2;
          cap(i++, Math.cos(a0) * R, Math.sin(a0) * R, z, Math.cos(a1) * R, Math.sin(a1) * R, z, 1.0, 0, 2, 0);
        }
      }
      for (let k = 0; k < AXIALS; k++) {
        const a = (k / AXIALS) * Math.PI * 2 + 0.1;
        cap(i++, Math.cos(a) * R, Math.sin(a) * R, -HALF_Z, Math.cos(a) * R, Math.sin(a) * R, HALF_Z, 0.9, 0, 2, 0);
      }
    }
    cap(DET_CAPS - 1, 0, 0, -9, 0, 0, 9, 2.2, 0, 2.4, 1); // the beam pipe
  }

  // --- the nuclei: one packed nucleon cloud, the lattice, the states -------------------
  const nucBase = new Float32Array(NUCLEONS * 3);
  const nucType = new Uint8Array(NUCLEONS); // 0 proton, 1 neutron
  {
    for (let i = 0; i < NUCLEONS; i++) {
      let x, y, z;
      do { x = Math.random() * 2 - 1; y = Math.random() * 2 - 1; z = Math.random() * 2 - 1; } while (x * x + y * y + z * z > 1);
      nucBase[i * 3] = x * 0.75; nucBase[i * 3 + 1] = y * 0.75; nucBase[i * 3 + 2] = z * 0.75;
      nucType[i] = Math.random() < 0.42 ? 0 : 1;
    }
    for (let it = 0; it < 60; it++) {
      for (let i = 0; i < NUCLEONS; i++) {
        let fx = 0, fy = 0, fz = 0;
        const xi = nucBase[i * 3], yi = nucBase[i * 3 + 1], zi = nucBase[i * 3 + 2];
        for (let j = 0; j < NUCLEONS; j++) {
          if (j === i) continue;
          const dx = xi - nucBase[j * 3], dy = yi - nucBase[j * 3 + 1], dz = zi - nucBase[j * 3 + 2];
          const d2 = dx * dx + dy * dy + dz * dz + 1e-4;
          if (d2 < 0.25) { const f = (0.25 - d2) * 0.9; fx += dx * f; fy += dy * f; fz += dz * f; }
        }
        let nx = xi + fx * 0.2, ny = yi + fy * 0.2, nz = zi + fz * 0.2;
        const rl = Math.sqrt(nx * nx + ny * ny + nz * nz);
        const rMax = NUC_R - 0.22;
        if (rl > rMax) { nx *= rMax / rl; ny *= rMax / rl; nz *= rMax / rl; }
        nucBase[i * 3] = nx; nucBase[i * 3 + 1] = ny; nucBase[i * 3 + 2] = nz;
      }
    }
  }
  const latPos = new Float32Array(NUCLEI * 3);
  {
    const phi = (1 + Math.sqrt(5)) / 2;
    const v = [[0, 1, phi], [0, -1, phi], [0, 1, -phi], [0, -1, -phi], [1, phi, 0], [-1, phi, 0], [1, -phi, 0], [-1, -phi, 0], [phi, 0, 1], [-phi, 0, 1], [phi, 0, -1], [-phi, 0, -1]];
    const n = Math.sqrt(1 + phi * phi);
    for (let i = 0; i < 12; i++) {
      latPos[(i + 1) * 3] = (v[i][0] / n) * LATTICE_D;
      latPos[(i + 1) * 3 + 1] = (v[i][1] / n) * LATTICE_D;
      latPos[(i + 1) * 3 + 2] = (v[i][2] / n) * LATTICE_D;
    }
  }
  const nPhase = new Uint8Array(NUCLEI); // 0 idle, 1 excited, 2 split, 3 re-forming
  const nT = new Float32Array(NUCLEI);
  const nAxis = new Float32Array(NUCLEI * 3);
  const nOff = new Float32Array(NUCLEI); // the split plane's offset (asymmetry)
  const nFrag = new Float32Array(NUCLEI * 2); // fragment separations (+ side, − side)
  const nHeat = new Float32Array(NUCLEI);
  const neutAlive = new Uint8Array(MAX_NEUTRONS);
  const neutFrom = new Float32Array(MAX_NEUTRONS * 3);
  const neutTo = new Float32Array(MAX_NEUTRONS * 3);
  const neutT = new Float32Array(MAX_NEUTRONS);
  const neutDur = new Float32Array(MAX_NEUTRONS);
  const neutTarget = new Int8Array(MAX_NEUTRONS);
  const gAge = new Float32Array(4).fill(-1);
  let gNext = 0;

  // --- the collider's event -------------------------------------------------------------
  const trkPhi = new Float32Array(MAX_TRACKS), trkTheta = new Float32Array(MAX_TRACKS), trkPt = new Float32Array(MAX_TRACKS);
  const trkQ = new Float32Array(MAX_TRACKS), trkTint = new Float32Array(MAX_TRACKS), trkE = new Float32Array(MAX_TRACKS);
  let evT = -1, evN = 0;

  // --- the boulevard's embers -------------------------------------------------------------
  const embX = new Float32Array(EMBERS), embY = new Float32Array(EMBERS), embZ = new Float32Array(EMBERS), embV = new Float32Array(EMBERS);
  for (let i = 0; i < EMBERS; i++) { embX[i] = (Math.random() - 0.5) * 24; embY[i] = Math.random() * 12; embZ[i] = -Math.random() * 40; embV[i] = 0.6 + Math.random() * 1.4; }

  // --- state ------------------------------------------------------------------------------
  const approach = (v, to, tau, dt) => v + (to - v) * (1 - Math.exp(-dt / tau));
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const smooth01 = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 0.8;
  const camPos = new THREE.Vector3(0, 2, 0);
  const camTarget = new THREE.Vector3(0, 4, -40);
  const wantPos = new THREE.Vector3();
  const wantTarget = new THREE.Vector3();
  const jetPhi = new Float32Array(3), jetTheta = new Float32Array(3);
  const nucPh = new Float32Array(NUCLEONS * 3);
  for (let i = 0; i < NUCLEONS * 3; i++) nucPh[i] = Math.random() * 6.2831853;
  let act = 2;
  const actW = new Float32Array(4);
  actW[2] = 1;
  let knob6Prev = null;
  let yieldS = 0.5, swayS = 0, pressS = 0, bass = 0, high = 0, pulse = 0, beatPrev = 0, strikePrev = 0, flash = 0;
  let hx = 0.5, hy = 0.5;
  let vertexGlow = 0, collFlash = 0, bunchT = 0;
  let cloudAge = 30;
  let blastAge = -1, passAge = -1, veil = 0, shake = 0, emberA = 0, fireS = 0;
  let cascadeFlash = 0;

  // --- the collider ----------------------------------------------------------------------
  function fireCollision() {
    evT = 0;
    evN = Math.floor(40 + yieldS * 80);
    for (let k = 0; k < 3; k++) { jetPhi[k] = Math.random() * 6.2831853; jetTheta[k] = 0.6 + Math.random() * 1.9; }
    for (let j = 0; j < MAX_TRACKS; j++) {
      const inJet = Math.random() < 0.65;
      const k = (Math.random() * 3) | 0;
      const eta = (Math.random() - 0.5) * 4.8;
      trkPhi[j] = inJet ? jetPhi[k] + gauss() * 0.22 : Math.random() * 6.2831853;
      trkTheta[j] = inJet ? clamp(jetTheta[k] + gauss() * 0.18, 0.2, 2.94) : 2 * Math.atan(Math.exp(-eta));
      const pt = 0.3 + 5 * Math.pow(Math.random(), 3) + (inJet ? 1.5 * Math.random() : 0);
      trkPt[j] = pt;
      const r = Math.random();
      trkQ[j] = r < 0.15 ? 0 : r < 0.575 ? 1 : -1;
      trkTint[j] = pt < 2.5 ? 3.0 - 0.4 * pt : 4.3 + 0.7 * Math.min(1, (pt - 2.5) / 3);
      trkE[j] = pt * (0.8 + Math.random() * 0.6);
    }
    collFlash = 1;
  }
  function updateCollider(dt, t, w) {
    const base = w * (0.22 + pulse * 0.08);
    for (let i = 0; i < DET_CAPS - 1; i++) capS[i * 4 + 1] = base;
    capS[(DET_CAPS - 1) * 4 + 1] = w * 0.5;
    bunchT += dt;
    const u = (bunchT * 0.7) % 1;
    sph(glows, GL_BUNCH0, 0, 0, 12 - 24 * u, 0.12, w * 1.1, 4.7, 1);
    sph(glows, GL_BUNCH0 + 1, 0, 0, -12 + 24 * u, 0.12, w * 1.1, 4.7, 1);
    sph(glows, GL_VERTEX, 0, 0, 0, 0.6, w * (0.25 + bass * 0.6 + collFlash), 2.5, collFlash);
    vertexGlow = bass * 0.6 + collFlash;
    collFlash = Math.max(0, collFlash - dt * 3);
    if (evT < 0) return;
    evT += dt;
    if (evT > 4.5) {
      evT = -1;
      for (let i = CAP_TRACK0; i < CAP_NEUT0; i++) capS[i * 4 + 1] = 0;
      for (let i = GL_HIT0; i < GL_NEUT0; i++) glows.s[i * 4 + 1] = 0;
      return;
    }
    const B = 0.5 + swayS * 3.5;
    const front = TRACK_C * evT;
    const fade = (evT < 0.6 ? 1 : Math.exp(-(evT - 0.6) / 1.6)) * w;
    const L = 7.5, ds = L / TRACK_SEGS;
    for (let j = 0; j < MAX_TRACKS; j++) {
      const c0 = CAP_TRACK0 + j * TRACK_SEGS;
      if (j >= evN) {
        for (let k = 0; k < TRACK_SEGS; k++) capS[(c0 + k) * 4 + 1] = 0;
        capS[(CAP_CALO0 + j) * 4 + 1] = 0;
        for (let n = 0; n < 4; n++) glows.s[(GL_HIT0 + j * 4 + n) * 4 + 1] = 0;
        continue;
      }
      const phi = trkPhi[j], th = trkTheta[j], q = trkQ[j];
      const st = Math.sin(th), ct = Math.cos(th);
      const Rs = q === 0 ? 0 : (q * trkPt[j]) / (0.3 * B);
      let px = 0, py = 0, pz = 0, pr = 0, hits = 0, alive = true, exitS = -1;
      let ex = 0, ey = 0, ez = 0;
      for (let k = 0; k < TRACK_SEGS; k++) {
        const s1 = (k + 1) * ds;
        let x, y, z;
        if (q === 0) { x = s1 * st * Math.cos(phi); y = s1 * st * Math.sin(phi); z = s1 * ct; }
        else { const psi = (s1 * st) / Rs; x = Rs * (Math.sin(phi + psi) - Math.sin(phi)); y = -Rs * (Math.cos(phi + psi) - Math.cos(phi)); z = s1 * ct; }
        const r = Math.sqrt(x * x + y * y);
        const ci = c0 + k;
        if (!alive) { capS[ci * 4 + 1] = 0; continue; }
        const s0 = k * ds;
        const vis = s0 < front ? 1 : 0;
        const f = s1 <= front ? 1 : (front - s0) / ds;
        cap(ci, px, py, pz, px + (x - px) * f, py + (y - py) * f, pz + (z - pz) * f, 1.3, fade * vis * 0.9, trkTint[j], 0);
        // hits where the track crosses a layer
        for (let li = 0; li < LAYERS.length && hits < 4; li++) {
          const LR = LAYERS[li];
          if (pr < LR && r >= LR) {
            const u2 = (LR - pr) / (r - pr);
            const hs = s0 + ds * u2;
            sph(glows, GL_HIT0 + j * 4 + hits, px + (x - px) * u2, py + (y - py) * u2, pz + (z - pz) * u2, 0.09, hs < front ? fade * 0.9 : 0, 4.6, 0.5);
            hits++;
          }
        }
        px = x; py = y; pz = z; pr = r;
        if (r >= CALO_R || Math.abs(z) > 6.5) { alive = false; exitS = s1; ex = x; ey = y; ez = z; }
      }
      for (let n = hits; n < 4; n++) glows.s[(GL_HIT0 + j * 4 + n) * 4 + 1] = 0;
      // the calorimeter takes the energy where the track leaves the barrel
      if (exitS > 0 && pr >= CALO_R * 0.98) {
        const el = Math.sqrt(ex * ex + ey * ey + ez * ez);
        const dx = ex / el, dy = ey / el, dz = ez / el;
        const len = 0.5 + trkE[j] * 0.35;
        cap(CAP_CALO0 + j, dx * CALO_R, dy * CALO_R, dz * CALO_R, dx * (CALO_R + len), dy * (CALO_R + len), dz * (CALO_R + len), 4.5, front >= exitS ? fade * 0.8 : 0, 0.6, 2);
      } else {
        capS[(CAP_CALO0 + j) * 4 + 1] = 0;
      }
    }
  }

  // --- fission ------------------------------------------------------------------------------
  function exciteNucleus(n) {
    nPhase[n] = 1;
    nT[n] = 0;
    let ax = Math.random() - 0.5, ay = Math.random() - 0.5, az = Math.random() - 0.5;
    const l = Math.sqrt(ax * ax + ay * ay + az * az) + 1e-6;
    nAxis[n * 3] = ax / l; nAxis[n * 3 + 1] = ay / l; nAxis[n * 3 + 2] = az / l;
    nOff[n] = (Math.random() < 0.5 ? 1 : -1) * 0.24 * swayS;
    nFrag[n * 2] = 0; nFrag[n * 2 + 1] = 0;
    nHeat[n] = 0;
  }
  function fireNeutron(fx, fy, fz, target) {
    for (let i = 0; i < MAX_NEUTRONS; i++) {
      if (neutAlive[i]) continue;
      neutAlive[i] = 1;
      neutFrom[i * 3] = fx; neutFrom[i * 3 + 1] = fy; neutFrom[i * 3 + 2] = fz;
      let tx, ty, tz;
      if (target >= 0) { tx = latPos[target * 3]; ty = latPos[target * 3 + 1]; tz = latPos[target * 3 + 2]; }
      else { const l = Math.sqrt(fx * fx + fy * fy + fz * fz) + 1e-6; tx = fx + (fx / l) * 14; ty = fy + (fy / l) * 14 + 2; tz = fz + (fz / l) * 14; }
      neutTo[i * 3] = tx; neutTo[i * 3 + 1] = ty; neutTo[i * 3 + 2] = tz;
      const d = Math.sqrt((tx - fx) ** 2 + (ty - fy) ** 2 + (tz - fz) ** 2);
      neutDur[i] = Math.max(0.25, d / (8 + yieldS * 4));
      neutT[i] = 0;
      neutTarget[i] = target;
      return;
    }
  }
  function nearestIdle(x, y, z, exclude) {
    let best = -1, bd = 1e9;
    for (let n = 0; n < NUCLEI; n++) {
      if (n === exclude || nPhase[n] !== 0) continue;
      const d = (latPos[n * 3] - x) ** 2 + (latPos[n * 3 + 1] - y) ** 2 + (latPos[n * 3 + 2] - z) ** 2;
      if (d < bd) { bd = d; best = n; }
    }
    return best;
  }
  function fireFission() {
    const target = nearestIdle(0, 0, 0, -1);
    if (target < 0) return;
    const a = Math.random() * 6.2831853, e = (Math.random() - 0.5) * 1.2;
    fireNeutron(Math.cos(a) * Math.cos(e) * 9, Math.sin(e) * 9, Math.sin(a) * Math.cos(e) * 9, target);
  }
  function scission(n) {
    nPhase[n] = 2;
    nT[n] = 0;
    nHeat[n] = 1;
    const k = gNext; gNext = (gNext + 1) & 3;
    gammaU[k * 4] = latPos[n * 3]; gammaU[k * 4 + 1] = latPos[n * 3 + 1]; gammaU[k * 4 + 2] = latPos[n * 3 + 2]; gammaU[k * 4 + 3] = 0.5;
    gAge[k] = 0;
    flash = Math.max(flash, 0.3);
    const count = 2 + Math.floor(yieldS * 2.5);
    for (let c = 0; c < count; c++) {
      const tgt = nearestIdle(latPos[n * 3], latPos[n * 3 + 1], latPos[n * 3 + 2], n);
      if (tgt >= 0) nPhase[tgt] = 4; // claimed: a neutron is on its way
      fireNeutron(latPos[n * 3], latPos[n * 3 + 1], latPos[n * 3 + 2], tgt);
    }
    let intact = 0;
    for (let m = 0; m < NUCLEI; m++) if (nPhase[m] === 0) intact++;
    if (intact === 0) { flash = 1; cascadeFlash = 1; }
  }
  function updateFission(dt, t, w) {
    // neutrons in flight
    for (let i = 0; i < MAX_NEUTRONS; i++) {
      const gi = GL_NEUT0 + i, ci = CAP_NEUT0 + i;
      if (!neutAlive[i]) { glows.s[gi * 4 + 1] = 0; capS[ci * 4 + 1] = 0; continue; }
      neutT[i] += dt / neutDur[i];
      const u = Math.min(neutT[i], 1);
      const o = i * 3;
      const x = neutFrom[o] + (neutTo[o] - neutFrom[o]) * u, y = neutFrom[o + 1] + (neutTo[o + 1] - neutFrom[o + 1]) * u, z = neutFrom[o + 2] + (neutTo[o + 2] - neutFrom[o + 2]) * u;
      const dx = neutTo[o] - neutFrom[o], dy = neutTo[o + 1] - neutFrom[o + 1], dz = neutTo[o + 2] - neutFrom[o + 2];
      const dl = Math.sqrt(dx * dx + dy * dy + dz * dz) + 1e-6;
      sph(glows, gi, x, y, z, 0.17, w, 4.8, 1);
      cap(ci, x - (dx / dl) * 0.9, y - (dy / dl) * 0.9, z - (dz / dl) * 0.9, x, y, z, 2.0, w * 0.7, 4.6, 1);
      if (neutT[i] >= 1) {
        neutAlive[i] = 0;
        const tgt = neutTarget[i];
        if (tgt >= 0 && (nPhase[tgt] === 0 || nPhase[tgt] === 4)) exciteNucleus(tgt);
      }
    }
    // gamma shells
    for (let k = 0; k < 4; k++) {
      if (gAge[k] < 0) { gammaU[k * 4 + 3] = 0; WU.uGammaA.value[k] = 0; continue; }
      gAge[k] += dt;
      gammaU[k * 4 + 3] = 0.6 + gAge[k] * 9;
      WU.uGammaA.value[k] = Math.exp(-gAge[k] / 0.45) * 1.2;
      if (gAge[k] > 1.3) { gAge[k] = -1; gammaU[k * 4 + 3] = 0; }
    }
    // the nuclei
    const rad = 0.23 * (1 - 0.3 * pressS);
    const squeeze = 1 - 0.3 * pressS;
    const jitAmp = 0.035 * (1 + swayS * 1.2 + pressS * 1.5);
    const jitRate = 7 + pressS * 6;
    for (let n = 0; n < NUCLEI; n++) {
      const ph = nPhase[n];
      let e = 0, sep = 0, alpha = 1, grow = 1, glow = 1;
      if (ph === 1) {
        nT[n] += dt;
        e = smooth01(nT[n] / 0.9) * (1 + 0.5 * swayS);
        glow = 1 + e;
        if (nT[n] >= 0.95) scission(n);
      } else if (ph === 2) {
        nT[n] += dt;
        sep = 0.45 + (2.5 + yieldS * 2.5) * nT[n];
        nHeat[n] = Math.exp(-nT[n] / 1.2);
        alpha = clamp((3.0 - nT[n]) / 0.8, 0, 1);
        glow = 0.2 + 2 * nHeat[n];
        if (nT[n] >= 3.0) { nPhase[n] = 3; nT[n] = 0; }
      } else if (ph === 3) {
        nT[n] += dt;
        const r = smooth01(nT[n] / 1.5);
        alpha = r; grow = 1 + 2 * (1 - r); glow = r;
        if (nT[n] >= 1.5) nPhase[n] = 0;
      }
      const cx = latPos[n * 3], cy = latPos[n * 3 + 1], cz = latPos[n * 3 + 2];
      const fog = n === 0 ? 1 : 0.78;
      const ux = nAxis[n * 3], uy = nAxis[n * 3 + 1], uz = nAxis[n * 3 + 2];
      nucU[n * 4] = cx; nucU[n * 4 + 1] = cy; nucU[n * 4 + 2] = cz; nucU[n * 4 + 3] = glow * w;
      for (let i = 0; i < NUCLEONS; i++) {
        const b = i * 3;
        let x = nucBase[b] * squeeze * grow, y = nucBase[b + 1] * squeeze * grow, z = nucBase[b + 2] * squeeze * grow;
        const ja = jitAmp * (ph === 1 ? 1 + e : 1);
        x += ja * Math.sin(t * jitRate + nucPh[b]);
        y += ja * Math.sin(t * (jitRate + 1.3) + nucPh[b + 1]);
        z += ja * Math.sin(t * (jitRate + 2.1) + nucPh[b + 2]);
        if (ph === 1 || ph === 2) {
          const d = x * ux + y * uy + z * uz - nOff[n];
          if (ph === 1) {
            // the liquid drop: elongate along the axis, neck at the plane, wobble
            const wob = 0.12 * e * Math.sin(t * 14 + nucPh[b]);
            const stretch = e * 0.9 + wob;
            const neck = e * 0.45 * Math.exp(-d * d / 0.12);
            x += ux * d * stretch - (x - ux * (d + nOff[n])) * neck;
            y += uy * d * stretch - (y - uy * (d + nOff[n])) * neck;
            z += uz * d * stretch - (z - uz * (d + nOff[n])) * neck;
          } else {
            const side = d > 0 ? 1 : -1;
            x += ux * side * sep; y += uy * side * sep; z += uz * side * sep;
          }
        }
        sph(solids, n * NUCLEONS + i, cx + x, cy + y, cz + z, rad, alpha * fog * w, nucType[i] ? 2.0 : 1.0, nHeat[n]);
      }
    }
  }

  // --- detonation ------------------------------------------------------------------------------
  function updateDetonation(dt) {
    cloudAge = Math.min(cloudAge + dt, 60);
    WU.uCloudAge.value = cloudAge;
    WU.uCloudScale.value = 0.75 + yieldS * 1.1;
    WU.uCloudMorph.value = swayS;
    WU.uCloudPress.value = pressS;
  }

  // --- the shockwave ---------------------------------------------------------------------------
  // mirrors the shader's lampOn for the heads and posts
  const lampOn = (lz, a, rs) => {
    if (a < 0) return 1;
    const d = Math.sqrt(LAMP_X * LAMP_X + LAMP_H * LAMP_H + (lz - GZ_Z) * (lz - GZ_Z));
    const passed = d <= rs ? 1 : 0;
    const flare = passed * Math.exp(-(rs - d) / (BLAST_V * 0.12)) * 3;
    const relight = smooth01((a - 7) * 0.7 - -lz / 120);
    return Math.max(1 - passed + flare, relight);
  };
  function updateShockwave(dt, t, w) {
    const v = BLAST_V * (0.7 + yieldS * 0.6);
    let rs = 0, fire = 0;
    if (blastAge >= 0) {
      blastAge += dt;
      rs = v * blastAge;
      fire = 3 * Math.exp(-blastAge / 2) + 0.3 * Math.exp(-blastAge / 10);
      const dCam = Math.sqrt(camPos.x * camPos.x + camPos.y * camPos.y + (camPos.z - GZ_Z) ** 2);
      if (passAge < 0 && rs >= dCam) { passAge = blastAge; shake = 1; emberA = 1; }
      if (blastAge > 10) { blastAge = -1; passAge = -1; }
    }
    const sincePass = passAge >= 0 && blastAge >= 0 ? blastAge - passAge : -1;
    const veiling = sincePass >= 0 && sincePass < 2.5;
    veil = approach(veil, veiling ? 1 : 0, veiling ? 0.25 : 0.8, dt);
    shake = Math.max(0, shake - dt * 1.4);
    if (blastAge < 0 || blastAge > 8.5) emberA = approach(emberA, 0, 0.6, dt);
    WU.uBlastAge.value = blastAge;
    WU.uBlastR.value = rs;
    WU.uBlastMorph.value = swayS;
    WU.uBlastFire.value = fire;
    WU.uVeil.value = veil;
    WU.uDustH.value = 6 + 10 * swayS + 4 * yieldS;
    for (let k = 0; k < LAMPS; k++) {
      const lz = LAMP_Z0 - LAMP_DZ * k;
      const on = lampOn(lz, blastAge, rs);
      for (let s = 0; s < 2; s++) {
        const lx = s ? LAMP_X : -LAMP_X;
        const i = k * 2 + s;
        cap(CAP_LAMP0 + i, lx, 0, lz, lx, LAMP_H, lz, 1.2, w * 0.25, 4.0, 0);
        sph(glows, GL_LAMP0 + i, lx, LAMP_H, lz, 0.7, w * Math.min(on, 3) * 0.9, 0.4, 0.3);
      }
    }
    for (let i = 0; i < EMBERS; i++) {
      if (emberA > 0.01) {
        embY[i] -= embV[i] * dt * 1.5;
        embX[i] += Math.sin(t * 1.3 + i) * dt * 0.6;
        if (embY[i] < 0) { embY[i] = 8 + Math.random() * 6; embX[i] = camPos.x + (Math.random() - 0.5) * 24; embZ[i] = camPos.z - Math.random() * 40; }
      }
      sph(glows, GL_EMBER0 + i, embX[i], embY[i], embZ[i], 0.08 + 0.05 * (i % 3), w * emberA * (0.5 + 0.5 * Math.sin(t * 6 + i)), 1.0, 0.6);
    }
  }

  const bloom = { strength: 0.45, radius: 0.45, threshold: 0.55 };

  return {
    scene,
    camera,
    bloom,
    update(dt, t, io) {
      // ---- the act: KNOB 6 in quarter turns, a little hysteresis at the edges
      const k6 = io.knobs[5];
      const band = Math.min(3, Math.floor(k6 * 4));
      if (band !== act) {
        const edge = band > act ? band / 4 : (band + 1) / 4;
        if (Math.abs(k6 - edge) > 0.012) act = band;
      }
      for (let i = 0; i < ACTS; i++) actW[i] = approach(actW[i], i === act ? 1 : 0, ACT_FADE / 3, dt);
      yieldS = approach(yieldS, io.knobs[4], 0.3, dt);
      swayS = approach(swayS, io.gestures.sway, 0.4, dt);
      pressS = approach(pressS, io.gestures.press, 0.15, dt);
      hx = approach(hx, io.xy.x, 0.3, dt);
      hy = approach(hy, io.xy.y, 0.3, dt);
      bass = approach(bass, io.bands.bass, 0.12, dt);
      high = approach(high, io.bands.high, 0.1, dt);
      if (io.beat > beatPrev + 0.3) pulse = 1;
      beatPrev = io.beat;
      pulse = Math.max(0, pulse - dt * 3.5);

      // ---- the event: any strike fires the act in force
      const struck = io.strike > strikePrev + 0.3;
      strikePrev = io.strike;
      if (struck) {
        if (act === 0) fireCollision();
        else if (act === 1) fireFission();
        else if (act === 2) { cloudAge = 0; flash = 1; WU.uSkySeed.value = Math.random() * 10; }
        else { blastAge = 0; passAge = -1; flash = 1; }
      }
      flash = Math.max(0, flash - dt * 2.2);
      cascadeFlash = Math.max(0, cascadeFlash - dt * 4.0);

      // ---- the eye: the act in force places it, the hand drives it, the move eases
      if (act <= 1) {
        const dist0 = act === 0 ? 9 - pressS * 4.5 : 11 - pressS * 4;
        const az = (hx - 0.5) * 2.4, el = 0.15 + (hy - 0.5) * 0.9;
        wantPos.set(Math.sin(az) * Math.cos(el) * dist0, Math.sin(el) * dist0, Math.cos(az) * Math.cos(el) * dist0);
        wantTarget.set(0, 0, 0);
      } else if (act === 2) {
        wantPos.set((hx - 0.5) * 16, 2.5 + hy * 7, 0);
        wantTarget.set(0, 6.0 * (0.75 + yieldS * 1.1), -40);
      } else {
        wantPos.set((hx - 0.5) * 6, 1.7 + (hy - 0.5) * 1.6 - pressS * 1.1, 0);
        wantTarget.set(wantPos.x * 0.3, 1.2 - pressS * 0.6, -60);
      }
      camPos.x = approach(camPos.x, wantPos.x, 0.35, dt);
      camPos.y = approach(camPos.y, wantPos.y, 0.35, dt);
      camPos.z = approach(camPos.z, wantPos.z, 0.35, dt);
      camTarget.x = approach(camTarget.x, wantTarget.x, 0.35, dt);
      camTarget.y = approach(camTarget.y, wantTarget.y, 0.35, dt);
      camTarget.z = approach(camTarget.z, wantTarget.z, 0.35, dt);
      camera.position.copy(camPos);
      if (shake > 0) {
        const s = shake * shake * 0.35;
        camera.position.x += (Math.random() - 0.5) * s;
        camera.position.y += (Math.random() - 0.5) * s;
      }
      camera.lookAt(camTarget);
      camera.updateMatrixWorld();
      const e = camera.matrixWorld.elements;
      WU.uCamPos.value.copy(camera.position);
      WU.uCamRight.value.set(e[0], e[1], e[2]);
      WU.uCamUp.value.set(e[4], e[5], e[6]);
      WU.uCamFwd.value.set(-e[8], -e[9], -e[10]);

      // ---- the acts (every act keeps running; only weighted ones show)
      updateCollider(dt, t, actW[0]);
      updateFission(dt, t, actW[1]);
      updateDetonation(dt);
      updateShockwave(dt, t, actW[3]);

      // ---- uniforms and buffers
      const pl = io.palette;
      for (let i = 0; i < 5; i++) { wp[i].value.copy(pl[i]); cp[i].value.copy(pl[i]); sp[i].value.copy(pl[i]); gp[i].value.copy(pl[i]); }
      WU.uTime.value = t;
      WU.uIntensity.value = io.intensity;
      WU.uFlash.value = Math.min(0.97, flash * flash * 0.9 + cascadeFlash * 0.6);
      WU.uBass.value = bass;
      WU.uBeat.value = pulse;
      WU.uHigh.value = high;
      WU.uActW.value.set(actW[0], actW[1], actW[2], actW[3]);
      WU.uVertexGlow.value = vertexGlow;
      WU.uCollFlash.value = collFlash;
      CU.uIntensity.value = io.intensity;
      solids.U.uIntensity.value = io.intensity;
      glows.U.uIntensity.value = io.intensity;
      capAP0.needsUpdate = true; capAP1.needsUpdate = true; capAS.needsUpdate = true;
      solids.aPos.needsUpdate = true; solids.aS.needsUpdate = true;
      glows.aPos.needsUpdate = true; glows.aS.needsUpdate = true;
      caps.visible = actW[0] > 0.002 || actW[1] > 0.002 || actW[3] > 0.002;
      solids.mesh.visible = actW[1] > 0.002;
      glows.mesh.visible = caps.visible;
      bloom.strength = 0.45 + flash * 1.2 + collFlash * 0.4 + cascadeFlash * 0.8;
    },
    resize(w, h) {
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
      WU.uRes.value.set(w, h);
      CU.uRes.value.set(w, h);
    },
    dispose() {
      world.geometry.dispose();
      worldMat.dispose();
      capGeo.dispose();
      capMat.dispose();
      solids.geo.dispose();
      solids.mat.dispose();
      glows.geo.dispose();
      glows.mat.dispose();
    },
  };
}
