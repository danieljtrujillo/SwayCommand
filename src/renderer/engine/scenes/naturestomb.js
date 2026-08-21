// Nature's Tomb — an egg cell that divides by mitosis, or un-divides.
//
//   THE CELL    A zygote inside its zona pellucida, lit dark-field on black:
//               a glassy outer shell with a fresnel rim and mild refraction,
//               cytoplasm with granular texture, wrap lighting, a subsurface
//               glow through the membrane, a wet specular, and a nucleus with
//               a nucleolus seen through the cytoplasm (a second short march
//               from the membrane hit, attenuated by depth).
//   MITOSIS     One continuous division LEVEL 0..4: 1 → 2 → 4 → 8 → 16
//               blastomeres. Each stage splits every cell along the next
//               axis (X, Y, Z, then a diagonal); centres ease apart while the
//               radii shrink (volume conserving, 2^-1/3 per stage) and a
//               smooth-min neck forms the cleavage furrow. The level is a
//               real number, so a half-finished division is a pinched cell,
//               and driving it DOWN un-divides — the cells merge back.
//   CONTROL     The user chooses the interface: KNOB 5 (io.knobs[4]) sets the
//               level directly (0..1 → 0..4) the moment it is moved, and any
//               pad STRIKE steps one division further, reversing direction at
//               16 cells (un-divide) and at 1 (divide again). Either wins the
//               moment it is used. The level eases toward its target over
//               ~1.3 s, so a division plays out rather than snapping.
//   GESTURES    SWAY is the membrane-tension morph (a noise displacement that
//               jiggles and softens the membranes); PRESS squeezes the embryo;
//               the hand PANS the embryo (X) and DOLLIES the eye (Y) —
//               translation only, nothing rotates; bass swells the
//               cytoplasm, the beat pulses it, treble shimmers the granules,
//               the level lifts the zona's glow.
//
// One fullscreen quad, one draw call: an SDF raymarch of up to sixteen
// spheres whose centres and radii the CPU computes per frame into a vec4
// table (uCells), a nucleus field from the same table, and the zona as an
// analytic sphere. GLSL3. Colour: cytoplasm from palette 3/4 lifted toward
// white, nucleus from palette 1, membrane rim palette 0, zona palette 2.

export const meta = { id: 'naturestomb', name: "Nature's Tomb", mood: 'cellular' };

const MAX_CELLS = 16;
const R0 = 1.08; // zygote radius
const ZONA = 1.3; // zona pellucida radius (fixed — the embryo compacts inside it)
const SEP = 0.6; // centre separation per stage, as a fraction of the child radius
const AXES = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
  [0.57735, 0.57735, -0.57735],
];

const GLSL = /* glsl */ `
  #define PI 3.14159265359
  uniform vec2 uRes;
  uniform vec4 uCells[16]; // xyz centre, w radius
  uniform int uCount;
  uniform float uTime, uDist, uZona, uJig, uPress, uBeat, uBass, uHigh, uLevelA, uLevel, uIntensity;
  uniform vec2 uPan;
  uniform vec3 uPal0, uPal1, uPal2, uPal3, uPal4;
  in vec2 vUv;
  out vec4 fragColor;

  float h31(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float noise3(vec3 p) {
    vec3 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = h31(i), n100 = h31(i + vec3(1, 0, 0)), n010 = h31(i + vec3(0, 1, 0)), n110 = h31(i + vec3(1, 1, 0));
    float n001 = h31(i + vec3(0, 0, 1)), n101 = h31(i + vec3(1, 0, 1)), n011 = h31(i + vec3(0, 1, 1)), n111 = h31(i + vec3(1, 1, 1));
    return mix(mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y), mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y), f.z);
  }
  float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
  }
  float iSphere(vec3 ro, vec3 rd, vec3 c, float r, out float edge) {
    vec3 oc = ro - c;
    float b = dot(oc, rd);
    float cc = dot(oc, oc) - r * r;
    float h = b * b - cc;
    edge = h / (r * r);
    if (h < 0.0) return -1.0;
    return -b - sqrt(h);
  }
  // the blastomeres: smooth union of the live cells, jiggled by sway, swollen by bass
  float mapCells(vec3 p) {
    p.y *= 1.0 + uPress * 0.22; // press squeezes the embryo flat
    float d = 1e9;
    for (int i = 0; i < 16; i++) {
      if (i >= uCount) break;
      vec4 c = uCells[i];
      float di = length(p - c.xyz) - c.w * (1.0 + uBass * 0.04);
      d = (i == 0) ? di : smin(d, di, c.w * 0.22);
    }
    d += uJig * 0.05 * (noise3(p * 3.0 + vec3(0.0, uTime * 0.35, 0.0)) - 0.5);
    return d;
  }
  float mapNuc(vec3 p) {
    p.y *= 1.0 + uPress * 0.22;
    float d = 1e9;
    for (int i = 0; i < 16; i++) {
      if (i >= uCount) break;
      vec4 c = uCells[i];
      d = min(d, length(p - c.xyz) - c.w * 0.38);
    }
    return d;
  }
  vec3 normalCells(vec3 p) {
    const vec2 e = vec2(0.0025, 0.0);
    return normalize(vec3(
      mapCells(p + e.xyy) - mapCells(p - e.xyy),
      mapCells(p + e.yxy) - mapCells(p - e.yxy),
      mapCells(p + e.yyx) - mapCells(p - e.yyx)));
  }

  void main() {
    vec2 uv = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
    vec3 ro = vec3(0.0, 0.0, uDist);
    vec3 rd = normalize(vec3(uv * 1.05, -1.0));
    vec3 E = vec3(uPan.x, uPan.y, 0.0); // the embryo, panned by the hand
    vec3 col = vec3(0.0);

    // dark-field halo outside the zona
    float dC = length(cross(ro - E, rd));
    vec3 zonaTint = mix(uPal2, vec3(1.0), 0.6);
    col += zonaTint * 0.05 * exp(-(dC - uZona) * 5.0) * step(uZona, dC) * (0.6 + 0.4 * uLevelA);

    float ez;
    float tz = iSphere(ro, rd, E, uZona, ez);
    if (tz > 0.0) {
      vec3 pz = ro + rd * tz;
      vec3 nz = normalize(pz - E);
      float fz = pow(1.0 - max(dot(nz, -rd), 0.0), 3.0);
      vec3 rdi = refract(rd, nz, 1.0 / 1.10);
      // march the cells inside the zona along the refracted ray
      vec3 p = pz;
      float t = 0.0;
      bool hit = false;
      float tExit = 2.0 * uZona + 0.2;
      for (int i = 0; i < STEPS; i++) {
        float d = mapCells(p - E);
        if (d < 0.0015) { hit = true; break; }
        t += d * 0.92;
        if (t > tExit) break;
        p = pz + rdi * t;
      }
      vec3 inner = vec3(0.0);
      if (hit) {
        vec3 q0 = p - E;
        vec3 n = normalCells(q0);
        vec3 L = normalize(vec3(-0.55, 0.7, 0.5));
        vec3 L2 = normalize(vec3(0.7, -0.3, 0.4));
        float gr = noise3(q0 * 14.0 + vec3(0.0, uTime * 0.05, 0.0));
        float gr2 = noise3(q0 * 40.0 + uTime * 0.02);
        vec3 cyto = mix(mix(uPal3, uPal4, 0.3), vec3(1.0), 0.25);
        cyto *= 0.85 + 0.22 * gr + 0.10 * gr2 * (1.0 + uHigh * 1.5);
        float wrap = dot(n, L) * 0.5 + 0.5;
        float lit = wrap * wrap;
        float rim = pow(1.0 - max(dot(n, -rdi), 0.0), 2.0);
        vec3 sss = mix(uPal4, uPal3, 0.5) * (0.35 * rim + 0.25 * pow(max(dot(rdi, L), 0.0), 3.0));
        float spec = pow(max(dot(reflect(-L, n), -rdi), 0.0), 60.0) * 0.45 + pow(max(dot(reflect(-L2, n), -rdi), 0.0), 30.0) * 0.12;
        inner = cyto * (0.12 + 0.88 * lit) + sss + vec3(spec) + uPal0 * rim * 0.25;
        // the nucleus, seen through the cytoplasm
        float tn = 0.02, depth = 0.0;
        bool nuc = false;
        vec3 q = q0;
        for (int j = 0; j < NSTEPS; j++) {
          q = q0 + rdi * tn;
          float dn = mapNuc(q);
          if (dn < 0.003) { nuc = true; depth = tn; break; }
          if (mapCells(q) > 0.02) break;
          tn += max(dn * 0.9, 0.01);
        }
        if (nuc) {
          float nShade = 0.5 + 0.5 * noise3(q * 9.0);
          vec3 nucCol = mix(uPal1, uPal0, 0.2) * (0.6 + 0.4 * nShade);
          float nucleolus = smoothstep(0.6, 0.9, noise3(q * 18.0 + 3.0));
          nucCol = mix(nucCol, uPal1 * 0.5, nucleolus * 0.6);
          inner = mix(inner, nucCol, exp(-depth * 2.5) * 0.62);
        }
        inner *= 1.0 + uBeat * 0.12;
      }
      // the zona: glassy shell, thin bright band, rim
      float ringZ = exp(-pow((dC - uZona * 0.965) / (uZona * 0.018), 2.0));
      col += inner * (0.92 - 0.25 * fz) + zonaTint * (fz * 0.55 + 0.035) * (0.6 + 0.4 * uLevelA) + zonaTint * ringZ * 0.22;
      col *= smoothstep(0.0, max(fwidth(ez) * 1.5, 0.0001), ez);
    }
    fragColor = vec4(col * uIntensity, 1.0);
  }
`;

export function createScene(ctx) {
  const { THREE, quality } = ctx;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const tier = quality.tier;
  const STEPS = tier === 'low' ? 28 : tier === 'high' ? 56 : 40;
  const NSTEPS = tier === 'low' ? 12 : tier === 'high' ? 20 : 16;

  const cells = new Float32Array(MAX_CELLS * 4);
  const pal = Array.from({ length: 5 }, () => ({ value: new THREE.Color(1, 1, 1) }));
  const U = {
    uRes: { value: new THREE.Vector2(ctx.width, ctx.height) },
    uCells: { value: cells },
    uCount: { value: 1 },
    uTime: { value: 0 },
    uDist: { value: 3.4 },
    uZona: { value: ZONA },
    uJig: { value: 0 },
    uPress: { value: 0 },
    uBeat: { value: 0 },
    uBass: { value: 0 },
    uHigh: { value: 0 },
    uLevelA: { value: 0 },
    uLevel: { value: 0 },
    uIntensity: { value: 1 },
    uPan: { value: new THREE.Vector2(0, 0) },
    uPal0: pal[0], uPal1: pal[1], uPal2: pal[2], uPal3: pal[3], uPal4: pal[4],
  };
  const mat = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: U,
    defines: { STEPS, NSTEPS },
    vertexShader: /* glsl */ `
      out vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: GLSL,
    depthTest: false,
    depthWrite: false,
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
  quad.frustumCulled = false;
  scene.add(quad);

  const approach = (v, to, tau, dt) => v + (to - v) * (1 - Math.exp(-dt / tau));
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const smooth01 = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };

  // cell table for a continuous level: every cell i takes the side bit j of
  // its index along axis j for each completed or in-progress stage
  function computeCells(L) {
    let count = 1;
    for (let j = 0; j < 4; j++) if (L - j > 1e-4) count *= 2;
    for (let i = 0; i < MAX_CELLS; i++) {
      let x = 0, y = 0, z = 0, rad = R0;
      for (let j = 0; j < 4; j++) {
        const p = clamp(L - j, 0, 1);
        if (p <= 0) break;
        const sm = smooth01(p);
        const side = (i >> j) & 1 ? 1 : -1;
        const rNext = R0 * Math.pow(2, -(j + 1) / 3);
        const sep = rNext * SEP * sm;
        x += AXES[j][0] * side * sep;
        y += AXES[j][1] * side * sep;
        z += AXES[j][2] * side * sep;
        rad += (rNext - rad) * sm;
      }
      cells[i * 4] = x; cells[i * 4 + 1] = y; cells[i * 4 + 2] = z; cells[i * 4 + 3] = rad;
    }
    return count;
  }

  let level = 0, target = 0, dir = 1;
  let knobPrev = null, strikePrev = 0;
  let jig = 0, press = 0, bass = 0, high = 0, lvl = 0, dist = 3.4, panX = 0, panY = 0, pulse = 0, beatPrev = 0;

  return {
    scene,
    camera,
    update(dt, t, io) {
      // ---- the control interface: KNOB 5 sets the level, any strike steps it
      const k = io.knobs[4];
      if (knobPrev === null) knobPrev = k;
      if (Math.abs(k - knobPrev) > 1 / 256) {
        knobPrev = k;
        target = k * 4;
        dir = target >= level ? 1 : -1;
      }
      if (io.strike > strikePrev + 0.3) {
        if (target >= 4 - 1e-3) dir = -1;
        else if (target <= 1e-3) dir = 1;
        target = clamp(Math.round(target) + dir, 0, 4);
      }
      strikePrev = io.strike;
      level = approach(level, target, 1.3, dt);
      U.uCount.value = computeCells(level);
      U.uLevel.value = level;

      // ---- gestures: sway jiggles, press squeezes, the hand pans and dollies
      jig = approach(jig, io.gestures.sway, 0.4, dt);
      press = approach(press, io.gestures.press, 0.15, dt);
      panX = approach(panX, (io.xy.x - 0.5) * 1.6, 0.3, dt);
      panY = approach(panY, (io.xy.y - 0.5) * 0.9, 0.3, dt);
      dist = approach(dist, 4.3 - io.xy.y * 1.9, 0.35, dt);
      bass = approach(bass, io.bands.bass, 0.12, dt);
      high = approach(high, io.bands.high, 0.1, dt);
      lvl = approach(lvl, io.level, 0.25, dt);
      if (io.beat > beatPrev + 0.3) pulse = 1;
      beatPrev = io.beat;
      pulse = Math.max(0, pulse - dt * 3.5);

      const pl = io.palette;
      for (let i = 0; i < 5; i++) pal[i].value.copy(pl[i]);
      U.uTime.value = t;
      U.uDist.value = dist;
      U.uJig.value = jig;
      U.uPress.value = press;
      U.uBeat.value = pulse;
      U.uBass.value = bass;
      U.uHigh.value = high;
      U.uLevelA.value = lvl;
      U.uIntensity.value = io.intensity;
      U.uPan.value.set(panX, panY);
    },
    resize(w, h) {
      U.uRes.value.set(w, h);
    },
    dispose() {
      quad.geometry.dispose();
      mat.dispose();
    },
  };
}
