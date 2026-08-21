// Nature's Tomb — three organisms under dark-field light: an egg cell that
// divides by mitosis (or un-divides), a slime mold foraging across its plate,
// and a mycelium growing out from a spore. One knob picks the organism, one
// knob and the strikes drive its development, sway morphs its generator.
//
//   ORGANISM    KNOB 6 (io.knobs[5]) picks it: the centre (the 0.5 default) is
//               the EGG CELL, turning right dissolves into the SLIME MOLD,
//               turning left into the MYCELIUM. The value is smoothed with a
//               0.15 s time constant, so the dissolve runs exactly as fast as
//               the knob is turned — a flick cuts, a slow turn cross-fades.
//   LEVEL       KNOB 5 (io.knobs[4]) sets the development level 0..4 the
//               moment it moves, and any pad STRIKE steps it one stage,
//               reversing at the top and at the bottom; the level eases over
//               ~1.3 s so every stage plays out. Driving it DOWN reverses the
//               development. What the level means:
//                 egg cell    the division count 1 → 2 → 4 → 8 → 16
//                             blastomeres (each stage along the next axis,
//                             centres easing apart as radii shrink by 2^-1/3,
//                             a smooth-min neck as the cleavage furrow);
//                             driving it down merges the cells back
//                 slime mold  the colony's reach across the plate: the
//                             plasmodium pours out of its inoculum, forages
//                             to the rim, finds the oat flakes on the way and
//                             wires them into its vein network; driving it
//                             down retracts the colony and the outer veins
//                             starve and fade
//                 mycelium    the hyphal growth in time: germ tubes leave the
//                             spore, extend, branch and fill the plate; the
//                             level scrubs that growth forward and back
//   THE EGG     A zygote inside its zona pellucida: a glassy outer shell with
//               a fresnel rim and mild refraction, cytoplasm with granular
//               texture, wrap lighting, a subsurface glow through the
//               membrane, a wet specular, and a nucleus with a nucleolus seen
//               through the cytoplasm (a second short march from the membrane
//               hit, attenuated by depth). An SDF raymarch of up to sixteen
//               spheres whose centres and radii the CPU computes per frame.
//   SLIME MOLD  A Physarum polycephalum plasmodium, simulated rather than
//               drawn: the classic agent model (Jones 2010) — a few thousand
//               protoplasm agents on a trail map sense the trail ahead at
//               three sensors, turn toward the strongest, step, deposit; the
//               map diffuses and decays each frame — runs on the CPU and
//               uploads the trail as an 8-bit texture; that IS the network
//               (thick veins where the flow concentrates, fan-shaped fronts at
//               the edge, nodes at the food). The shader lights the trail as
//               a glossy yellow plasmodium: height from the trail, a normal
//               from its gradient, wrap light, a wet specular, a subsurface
//               glow, and a slow pulse running along the veins (the shuttle
//               streaming, which the beat drives). Food: nine oat flakes on
//               the plate switch on as the colony's reach meets them.
//   MYCELIUM    Hyphae as one instanced mesh of screen-space capsules: a
//               growth simulation (germ tubes from the spore, tip extension
//               with persistence and a radial bias, lateral branching, tips
//               dying at the plate's rim) lays segments down in time order,
//               so the visible prefix of the list is the colony at a point in
//               its growth. The simulation is re-run from the same random
//               table whenever sway moves, so the network deforms
//               continuously instead of re-seeding. The fragment shader draws
//               each segment as a glassy tube — bright core, translucent
//               walls, septa across it — with the growth front glowing as the
//               apices; the plate and the spore come from the quad.
//   GESTURES    SWAY is each organism's morph: the egg's membrane tension (a
//               noise displacement that jiggles and softens the membranes),
//               the slime mold's sensing (sensor angle, turn angle and sensor
//               reach — a fine lattice becomes a coarse web of thick trunk
//               veins, live, the network re-forming as it moves), the
//               mycelium's branching angle and tortuosity (a tight radial
//               brush opens into a spreading, curling web). PRESS squeezes:
//               it flattens the embryo, crowds the colony into a smaller
//               reach so the veins thicken, squashes the mycelium. The hand
//               PANS the plate (X) and DOLLIES the eye (Y) — translation only,
//               nothing rotates. Bass swells the cytoplasm and the veins, the
//               beat pulses them, treble shimmers the granules, the level
//               lifts the plate's rim glow.
//
// Two draw calls: the quad (the egg raymarch, the slime mold's plate, the
// mycelium's plate and spore — whichever organisms have weight, blended by
// it) and the hyphae mesh (only while the mycelium has weight). GLSL3. Colour:
// cytoplasm and plasmodium from palette 3/4 lifted toward white, nucleus from
// palette 1, membrane rim and fans palette 0, the plate and hyphae from
// palette 2 lifted toward white, the spore from palette 1/0.

export const meta = { id: 'naturestomb', name: "Nature's Tomb", mood: 'cellular' };

const MAX_CELLS = 16;
const R0 = 1.08; // zygote radius
const ZONA = 1.3; // zona pellucida radius (fixed — the embryo compacts inside it)
const SEP = 0.6; // centre separation per stage, as a fraction of the child radius
const DISH = 1.5; // the plate's radius (world units) for the slime mold and the mycelium
const AXES = [
  [1, 0, 0],
  [0, 1, 0],
  [0, 0, 1],
  [0.57735, 0.57735, -0.57735],
];
const FOOD_N = 9; // oat flakes on the plate
const MAX_TIPS = 480; // simultaneous hyphal tips
const MYC_STEP = 0.031; // hyphal extension per growth step (world units)
const MYC_STEPS = 96; // growth steps the scrub covers (the rim stops most tips before)
const RND_LEN = 65536; // the mycelium's random table (power of two)

const GLSL = /* glsl */ `
  #define PI 3.14159265359
  uniform vec2 uRes;
  uniform vec4 uCells[16]; // xyz centre, w radius
  uniform int uCount;
  uniform float uTime, uDist, uZona, uJig, uPress, uBeat, uBass, uHigh, uLevelA, uLevel, uIntensity;
  uniform vec2 uPan;
  uniform vec3 uPal0, uPal1, uPal2, uPal3, uPal4;
  uniform vec3 uOrg;        // organism weights: x egg cell, y slime mold, z mycelium
  uniform sampler2D uTrail; // the plasmodium's trail map, 0..1
  uniform float uTexel;     // one trail texel in uv
  uniform float uDish, uFlow;
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

  // ---- the egg cell: zona, blastomeres, nuclei
  vec3 eggCell(vec3 ro, vec3 rd, vec3 E) {
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
    return col;
  }

  // ---- the plate: a dark-field disc with a thin bright rim and a halo outside
  vec3 plate(float r) {
    vec3 tint = mix(uPal2, vec3(1.0), 0.5);
    float inside = 1.0 - smoothstep(uDish * 0.985, uDish, r);
    float rim = exp(-pow((r - uDish * 0.992) / (uDish * 0.012), 2.0));
    float halo = exp(-(r - uDish) * 6.0) * step(uDish, r);
    return tint * (0.012 * inside + rim * 0.26 + halo * 0.04) * (0.6 + 0.4 * uLevelA);
  }

  // ---- the slime mold: the trail map lit as a plasmodium on its plate
  vec3 slimeMold(vec3 ro, vec3 rd, vec3 E) {
    vec3 col = vec3(0.0);
    float tp = (E.z - ro.z) / rd.z;
    if (tp <= 0.0) return col;
    vec2 q = (ro + rd * tp).xy - E.xy;
    float r = length(q);
    col += plate(r);
    float inside = 1.0 - smoothstep(uDish * 0.985, uDish, r);
    if (inside <= 0.0) return col;
    vec2 uvT = q / (2.0 * uDish) + 0.5;
    float tr = texture(uTrail, uvT).r;
    float tx = texture(uTrail, uvT + vec2(uTexel, 0.0)).r - texture(uTrail, uvT - vec2(uTexel, 0.0)).r;
    float ty = texture(uTrail, uvT + vec2(0.0, uTexel)).r - texture(uTrail, uvT - vec2(0.0, uTexel)).r;
    // fans where the trail is faint, veins where the flow concentrates, a
    // brighter ridge along the thickest flow
    float body = smoothstep(0.025, 0.2, tr);
    float vein = pow(smoothstep(0.14, 0.8, tr), 1.3);
    float ridge = smoothstep(0.6, 0.98, tr);
    vec3 n = normalize(vec3(-tx * 16.0, -ty * 16.0, 1.0));
    vec3 L = normalize(vec3(-0.5, 0.65, 0.6));
    float wrap = dot(n, L) * 0.5 + 0.5;
    float spec = pow(max(dot(reflect(-L, n), -rd), 0.0), 48.0);
    // granular protoplasm; the shuttle streaming pulses along the veins
    float gr = noise3(vec3(q * 26.0, uTime * 0.08));
    float stream = 0.82 + 0.18 * sin(uFlow - tr * 7.0 + gr * 2.5);
    vec3 cyto = mix(mix(uPal3, uPal4, 0.2), vec3(1.0), 0.22);
    vec3 fan = mix(uPal3, uPal0, 0.55);
    vec3 plasm = fan * body * (0.16 + 0.24 * wrap) * (0.8 + 0.3 * gr)
      + cyto * vein * (0.3 + 0.55 * wrap * wrap) * stream * (0.9 + 0.2 * gr) * (1.0 + uBass * 0.3)
      + mix(cyto, vec3(1.0), 0.4) * ridge * 0.35 * stream
      + vec3(1.0) * spec * vein * 0.35
      + mix(uPal4, uPal3, 0.5) * vein * 0.14 * (1.0 + uBeat * 0.9);
    plasm *= 1.0 + uHigh * 0.25 * gr;
    col += plasm * inside;
    return col;
  }

  // ---- the mycelium's plate and spore (the hyphae are the second draw call)
  vec3 mycPlate(vec3 ro, vec3 rd, vec3 E) {
    vec3 col = vec3(0.0);
    float tp = (E.z - ro.z) / rd.z;
    if (tp > 0.0) col += plate(length((ro + rd * tp).xy - E.xy));
    vec3 sporeTint = mix(uPal1, uPal0, 0.4);
    float dC = length(cross(ro - E, rd));
    col += sporeTint * 0.3 * exp(-dC * 9.0) * (1.0 + uBeat * 0.4);
    float e;
    float ts = iSphere(ro, rd, E, 0.075, e);
    if (ts > 0.0) {
      vec3 n = normalize(ro + rd * ts - E);
      vec3 L = normalize(vec3(-0.5, 0.65, 0.6));
      float lit = max(dot(n, L), 0.0);
      float rim = pow(1.0 - max(dot(n, -rd), 0.0), 2.5);
      vec3 sc = sporeTint * (0.3 + 0.7 * lit) * (0.9 + 0.2 * noise3(n * 12.0)) + vec3(rim * 0.45);
      col = mix(col, sc, smoothstep(0.0, max(fwidth(e) * 1.5, 0.0001), e));
    }
    return col;
  }

  void main() {
    vec2 uv = (vUv - 0.5) * vec2(uRes.x / uRes.y, 1.0);
    vec3 ro = vec3(0.0, 0.0, uDist);
    vec3 rd = normalize(vec3(uv * 1.05, -1.0));
    vec3 E = vec3(uPan.x, uPan.y, 0.0); // the specimen, panned by the hand
    vec3 col = vec3(0.0);
    if (uOrg.x > 0.002) col += eggCell(ro, rd, E) * uOrg.x;
    if (uOrg.y > 0.002) col += slimeMold(ro, rd, E) * uOrg.y;
    if (uOrg.z > 0.002) col += mycPlate(ro, rd, E) * uOrg.z;
    fragColor = vec4(col * uIntensity, 1.0);
  }
`;

// ------------------------------------------------------------- the hyphae
// Screen-space capsules from aP0 to aP1 (plate-local, the same pinhole as the
// quad: a point at depth d = uDist − z lands at uv = xy / (1.05 d)), so the
// tubes sit exactly on the plate the quad draws.
const MYC_VERT = /* glsl */ `
  uniform vec2 uRes, uPan;
  uniform float uDist, uPress, uBass, uCount, uTotal, uWeight;
  in vec2 aQuad;  // per vertex: side -1..1, along 0 (start) .. 1 (end)
  in vec3 aP0;
  in vec3 aP1;
  in vec4 aInfo;  // generation, tip flag, random, growth step
  out vec2 vQ;
  out float vLenR, vTip, vA, vGen, vRnd;
  vec2 toUv(vec3 p) {
    p.y /= 1.0 + uPress * 0.22; // press squashes the colony like the embryo
    float d = max(uDist - p.z, 0.3);
    return (p.xy + uPan) / (1.05 * d);
  }
  void main() {
    float id = float(gl_InstanceID);
    float vis = step(id + 0.5, uCount);
    vec2 s0 = toUv(aP0);
    vec2 s1 = toUv(aP1);
    float aspect = uRes.x / uRes.y;
    vec2 d = s1 - s0;
    float len = length(d);
    vec2 dir = len > 0.00001 ? d / len : vec2(1.0, 0.0);
    vec2 nrm = vec2(-dir.y, dir.x);
    float depth = uDist - 0.5 * (aP0.z + aP1.z);
    float pxH = 1.0 / uRes.y;
    // radius in height units: thicker main hyphae, thinner branches, bass swells
    float radPx = (2.7 * pow(0.86, aInfo.x)) * (3.4 / depth) * (1.0 + uBass * 0.3);
    float rad = max(radPx, 0.9) * pxH;
    vLenR = len / rad;
    // segments butt flat against each other (no additive doubling at the
    // joints); only a hypha's last segment — its apex — gets a round cap
    float cap = aInfo.y;
    vec2 pos = mix(s0, s1 + dir * rad * cap, aQuad.y) + nrm * aQuad.x * rad;
    vec2 ndc = pos / vec2(aspect, 1.0) * 2.0;
    gl_Position = vec4(ndc * vis, vis > 0.5 ? 0.0 : 2.0, 1.0);
    vQ = vec2(aQuad.x, aQuad.y * (vLenR + cap));
    // the growth front glows as the apices; once grown, the true tips do
    float front = smoothstep(uCount - 70.0, uCount, id);
    vTip = max(front, aInfo.y * smoothstep(uTotal * 0.97, uTotal, uCount));
    vGen = aInfo.x;
    vRnd = aInfo.z;
    vA = uWeight * vis * (0.55 + 0.25 * smoothstep(4.6, 2.6, depth)) * pow(0.9, aInfo.x);
  }
`;

const MYC_FRAG = /* glsl */ `
  uniform vec3 uPal0, uPal1, uPal2;
  uniform float uIntensity, uBeat, uHigh, uTime;
  in vec2 vQ;
  in float vLenR, vTip, vA, vGen, vRnd;
  out vec4 fragColor;
  void main() {
    float along = vQ.y; // 0 at the start, vLenR at the end, beyond it only on a capped apex
    float u = clamp(along, 0.0, vLenR);
    float dx = along - u;
    float d2 = dx * dx + vQ.x * vQ.x;
    if (d2 > 1.0) discard;
    // a glassy tube: bright core, translucent body, brighter walls
    float core = exp(-d2 * 5.0);
    float body = 1.0 - d2;
    float wall = smoothstep(0.3, 0.85, d2) * (1.0 - smoothstep(0.85, 1.0, d2));
    // septa: faint cross-walls along the hypha
    float s = fract((u + vRnd * 9.0) / 9.0);
    float sept = 1.0 - 0.18 * (1.0 - smoothstep(0.0, 0.05, abs(s - 0.5))) * step(0.5, vLenR);
    vec3 hyaline = mix(vec3(1.0), mix(uPal2, uPal0, 0.5), 0.45);
    vec3 col = hyaline * (0.22 * body + 0.55 * core + 0.4 * wall) * sept;
    // the apex: a swollen, brighter tip at the far end
    float apex = exp(-((along - vLenR) * (along - vLenR) + vQ.x * vQ.x) * 1.2) * vTip;
    col += mix(uPal0, vec3(1.0), 0.5) * apex * (1.1 + uBeat * 0.8);
    col *= 1.0 + uHigh * 0.2 * sin(uTime * 6.0 + vRnd * 40.0);
    fragColor = vec4(col * vA * uIntensity, 1.0);
  }
`;

export function createScene(ctx) {
  const { THREE, quality } = ctx;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const tier = quality.tier;
  const STEPS = tier === 'low' ? 28 : tier === 'high' ? 56 : 40;
  const NSTEPS = tier === 'low' ? 12 : tier === 'high' ? 20 : 16;
  const SW = tier === 'low' ? 192 : tier === 'high' ? 320 : 256; // trail map side
  const MYC_SEGS = tier === 'low' ? 6000 : tier === 'high' ? 16000 : 11000;

  // --- the quad: egg, plasmodium, plate ----------------------------------------
  const cells = new Float32Array(MAX_CELLS * 4);
  const pal = Array.from({ length: 5 }, () => ({ value: new THREE.Color(1, 1, 1) }));
  const SCELLS = SW * SW;
  const trailBytes = new Uint8Array(SCELLS);
  const trailTex = new THREE.DataTexture(trailBytes, SW, SW, THREE.RedFormat, THREE.UnsignedByteType);
  trailTex.minFilter = THREE.LinearFilter;
  trailTex.magFilter = THREE.LinearFilter;
  trailTex.generateMipmaps = false;
  trailTex.unpackAlignment = 1;
  trailTex.needsUpdate = true;
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
    uOrg: { value: new THREE.Vector3(1, 0, 0) },
    uTrail: { value: trailTex },
    uTexel: { value: 1 / SW },
    uDish: { value: DISH },
    uFlow: { value: 0 },
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
  quad.renderOrder = 0;
  scene.add(quad);

  // --- the hyphae: one instanced mesh of capsules --------------------------------
  const mycGeo = new THREE.InstancedBufferGeometry();
  mycGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, 0, 0, 1, 0, 0, -1, 1, 0, 1, 1, 0]), 3));
  mycGeo.setAttribute('aQuad', new THREE.BufferAttribute(new Float32Array([-1, 0, 1, 0, -1, 1, 1, 1]), 2));
  mycGeo.setIndex([0, 1, 2, 2, 1, 3]);
  const mycP0 = new Float32Array(MYC_SEGS * 3);
  const mycP1 = new Float32Array(MYC_SEGS * 3);
  const mycInfo = new Float32Array(MYC_SEGS * 4);
  const attrP0 = new THREE.InstancedBufferAttribute(mycP0, 3);
  const attrP1 = new THREE.InstancedBufferAttribute(mycP1, 3);
  const attrInfo = new THREE.InstancedBufferAttribute(mycInfo, 4);
  attrP0.setUsage(THREE.DynamicDrawUsage);
  attrP1.setUsage(THREE.DynamicDrawUsage);
  attrInfo.setUsage(THREE.DynamicDrawUsage);
  mycGeo.setAttribute('aP0', attrP0);
  mycGeo.setAttribute('aP1', attrP1);
  mycGeo.setAttribute('aInfo', attrInfo);
  mycGeo.instanceCount = 1;
  const mpal = Array.from({ length: 3 }, () => ({ value: new THREE.Color(1, 1, 1) }));
  const MU = {
    uRes: { value: new THREE.Vector2(ctx.width, ctx.height) },
    uPan: { value: new THREE.Vector2(0, 0) },
    uDist: { value: 3.4 },
    uPress: { value: 0 },
    uBass: { value: 0 },
    uCount: { value: 0 },
    uTotal: { value: 1 },
    uWeight: { value: 0 },
    uIntensity: { value: 1 },
    uBeat: { value: 0 },
    uHigh: { value: 0 },
    uTime: { value: 0 },
    uPal0: mpal[0], uPal1: mpal[1], uPal2: mpal[2],
  };
  const mycMat = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: MU,
    vertexShader: MYC_VERT,
    fragmentShader: MYC_FRAG,
    transparent: true,
    depthTest: false,
    depthWrite: false,
    side: THREE.DoubleSide, // the capsule's winding follows the segment's direction
    blending: THREE.AdditiveBlending,
  });
  const hyphae = new THREE.Mesh(mycGeo, mycMat);
  hyphae.frustumCulled = false;
  hyphae.renderOrder = 1;
  hyphae.visible = false;
  scene.add(hyphae);

  const approach = (v, to, tau, dt) => v + (to - v) * (1 - Math.exp(-dt / tau));
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const smooth01 = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };

  // --- the egg: cell table for a continuous level -------------------------------
  // every cell i takes the side bit j of its index along axis j for each
  // completed or in-progress stage
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

  // --- the slime mold: Physarum agents on a trail map -----------------------------
  // Jones's model: each agent senses the trail at three sensors ahead, turns
  // toward the strongest, steps, deposits; the map is box-blurred and decays.
  // The colony's reach is a disc the agents turn back from; the population
  // tracks the disc's area, newcomers pouring out of the inoculum at the centre.
  const SAGENTS = Math.floor(SCELLS * 0.14);
  const trail = new Float32Array(SCELLS);
  const trail2 = new Float32Array(SCELLS);
  const occ = new Uint8Array(SCELLS); // one agent per cell — the exclusion that keeps veins thin
  const agX = new Float32Array(SAGENTS);
  const agY = new Float32Array(SAGENTS);
  const agH = new Float32Array(SAGENTS);
  let agActive = 0; // agents stepping this frame (the first agActive)
  let agSpawned = 0; // agents that have ever been placed
  let spawnR = 0; // the reach the last placement filled out to
  const foodX = new Float32Array(FOOD_N);
  const foodY = new Float32Array(FOOD_N);
  for (let k = 0; k < FOOD_N; k++) {
    const a = k * 2.39996 + 0.7;
    const r = (SW * 0.5 - 3) * (0.3 + 0.62 * ((k + 1) / FOOD_N));
    foodX[k] = SW * 0.5 + Math.cos(a) * r;
    foodY[k] = SW * 0.5 + Math.sin(a) * r;
  }
  const TRAIL_MAX = 26;
  const DEP = 5;
  const DECAY = 0.905;
  const BYTE_K = 255 / TRAIL_MAX;

  function slimeStep(swayV, pressV, devel) {
    const W = SW;
    const SA = 0.39 + swayV * 0.75;
    const RA = 0.45 + swayV * 0.5;
    const SD = (4.0 + swayV * 9.0) * (W / 256);
    const SS = 1.0 * (W / 256);
    const cx = W * 0.5, cy = W * 0.5;
    const Rmax = W * 0.5 - 3;
    const R = Rmax * (0.14 + 0.86 * devel) * (1 - 0.42 * pressV);
    const R2 = R * R;
    const frac = (R / Rmax) * (R / Rmax) * 1.15 + 0.02;
    const nAct = Math.floor(SAGENTS * (frac > 1 ? 1 : frac));
    // newcomers fill the ground the reach has just gained, uniformly by area
    // (a spread population is what makes the model wire a network rather
    // than pile into one slug); re-activated agents keep their old places
    if (nAct > agSpawned) {
      const r0sq = spawnR * spawnR, r1sq = R * R;
      for (let i = agSpawned; i < nAct; i++) {
        const a = Math.random() * 6.2831853;
        const rr = Math.sqrt(r0sq + (r1sq - r0sq) * Math.random());
        agX[i] = cx + Math.cos(a) * rr;
        agY[i] = cy + Math.sin(a) * rr;
        agH[i] = Math.random() * 6.2831853;
        occ[(agY[i] | 0) * W + (agX[i] | 0)] = 1;
      }
      agSpawned = nAct;
      spawnR = R;
    }
    agActive = nAct;
    const last = W - 1;
    for (let i = 0; i < nAct; i++) {
      let x = agX[i], y = agY[i], h = agH[i];
      // sense
      let sx = x + Math.cos(h) * SD, sy = y + Math.sin(h) * SD;
      const f = trail[(sy < 0 ? 0 : sy > last ? last : sy | 0) * W + (sx < 0 ? 0 : sx > last ? last : sx | 0)];
      sx = x + Math.cos(h + SA) * SD; sy = y + Math.sin(h + SA) * SD;
      const l = trail[(sy < 0 ? 0 : sy > last ? last : sy | 0) * W + (sx < 0 ? 0 : sx > last ? last : sx | 0)];
      sx = x + Math.cos(h - SA) * SD; sy = y + Math.sin(h - SA) * SD;
      const r = trail[(sy < 0 ? 0 : sy > last ? last : sy | 0) * W + (sx < 0 ? 0 : sx > last ? last : sx | 0)];
      // steer
      if (f > l && f > r) {
        // straight on
      } else if (f < l && f < r) {
        h += Math.random() < 0.5 ? RA : -RA;
      } else if (l > r) {
        h += RA;
      } else if (r > l) {
        h -= RA;
      }
      // step, turning back at the colony's reach
      let nx = x + Math.cos(h) * SS, ny = y + Math.sin(h) * SS;
      const dx = nx - cx, dy = ny - cy;
      if (dx * dx + dy * dy > R2) {
        h = Math.atan2(cy - y, cx - x) + (Math.random() - 0.5) * 1.6;
        nx = x + Math.cos(h) * SS; ny = y + Math.sin(h) * SS;
      }
      // one agent per cell: a taken cell blocks the move and turns the agent
      const from = (y | 0) * W + (x | 0);
      const to = (ny | 0) * W + (nx | 0);
      if (to !== from) {
        if (occ[to]) {
          agH[i] = Math.random() * 6.2831853;
          trail[from] += DEP;
          continue;
        }
        occ[from] = 0;
        occ[to] = 1;
      }
      agX[i] = nx; agY[i] = ny; agH[i] = h;
      trail[to] += DEP;
    }
    // food within reach keeps attracting: a soft mound of attractant the
    // veins find from a distance and anchor to
    const Rf = R - 4;
    for (let k = 0; k < FOOD_N; k++) {
      const fx = foodX[k], fy = foodY[k];
      const ddx = fx - cx, ddy = fy - cy;
      if (ddx * ddx + ddy * ddy > Rf * Rf) continue;
      const ix = fx | 0, iy = fy | 0;
      for (let oy = -5; oy <= 5; oy++) {
        for (let ox = -5; ox <= 5; ox++) {
          const d2 = ox * ox + oy * oy;
          if (d2 > 25) continue;
          trail[(iy + oy) * W + ix + ox] += 2.4 * Math.exp(-d2 * 0.12);
        }
      }
    }
    // diffuse (3 × 3 box, separable), decay, and pack the bytes
    for (let y = 0; y < W; y++) {
      const b = y * W;
      trail2[b] = trail[b] * 2 + trail[b + 1];
      for (let x = 1; x < last; x++) trail2[b + x] = trail[b + x - 1] + trail[b + x] + trail[b + x + 1];
      trail2[b + last] = trail[b + last - 1] + trail[b + last] * 2;
    }
    const k9 = DECAY / 9;
    for (let y = 0; y < W; y++) {
      const b = y * W;
      const bu = (y === 0 ? 0 : y - 1) * W;
      const bd = (y === last ? last : y + 1) * W;
      for (let x = 0; x < W; x++) {
        const v = (trail2[bu + x] + trail2[b + x] + trail2[bd + x]) * k9;
        trail[b + x] = v;
        trailBytes[b + x] = v >= TRAIL_MAX ? 255 : (v * BYTE_K) | 0;
      }
    }
    trailTex.needsUpdate = true;
  }

  // --- the mycelium: hyphal growth in time order ----------------------------------
  // Germ tubes leave the spore; every step each live tip extends by MYC_STEP
  // with heading persistence, a radial bias (hyphae grow away from the colony)
  // and noise; it branches laterally at the branching angle; it dies at the
  // plate's rim. Segments are appended in (step, tip) order, so the first N
  // are the colony N segments into its growth. The same random table is read
  // in the same order every run, so changing the angle or the tortuosity
  // deforms the network instead of re-seeding it.
  const RND = new Float32Array(RND_LEN);
  for (let i = 0; i < RND_LEN; i++) RND[i] = Math.random();
  const tipX = new Float32Array(MAX_TIPS), tipY = new Float32Array(MAX_TIPS), tipZ = new Float32Array(MAX_TIPS);
  const tipHx = new Float32Array(MAX_TIPS), tipHy = new Float32Array(MAX_TIPS), tipHz = new Float32Array(MAX_TIPS);
  const tipGen = new Uint8Array(MAX_TIPS);
  const tipAlive = new Uint8Array(MAX_TIPS);
  const tipGap = new Uint16Array(MAX_TIPS);
  const tipSeg = new Int32Array(MAX_TIPS);
  const stepStart = new Int32Array(MYC_STEPS + 2);
  let mycTotal = 0;
  let mycSteps = 0;

  function growMycelium(branchAngle, tort) {
    let rc = 0;
    let nTips = 0;
    let seg = 0;
    const GERM = 8;
    for (let k = 0; k < GERM; k++) {
      const a = (k / GERM) * 6.2831853 + RND[rc++] * 0.6;
      tipX[k] = Math.cos(a) * 0.06; tipY[k] = Math.sin(a) * 0.06; tipZ[k] = (RND[rc++] - 0.5) * 0.05;
      tipHx[k] = Math.cos(a); tipHy[k] = Math.sin(a); tipHz[k] = (RND[rc++] - 0.5) * 0.3;
      tipGen[k] = 0; tipAlive[k] = 1; tipGap[k] = 0; tipSeg[k] = -1;
    }
    nTips = GERM;
    const rim = DISH * 0.965;
    let step = 0;
    for (; step < MYC_STEPS && seg < MYC_SEGS; step++) {
      stepStart[step] = seg;
      let live = 0;
      const nNow = nTips;
      for (let i = 0; i < nNow && seg < MYC_SEGS; i++) {
        // three draws per tip-step, always, so the branch decisions hold across morphs
        const r0 = RND[rc++ & (RND_LEN - 1)], r1 = RND[rc++ & (RND_LEN - 1)], r2 = RND[rc++ & (RND_LEN - 1)];
        if (!tipAlive[i]) continue;
        live++;
        let x = tipX[i], y = tipY[i], z = tipZ[i];
        let hx = tipHx[i], hy = tipHy[i], hz = tipHz[i];
        // heading: noise, radial bias, the slab's flatness
        const c = Math.cos((r0 - 0.5) * tort), s = Math.sin((r0 - 0.5) * tort);
        const nhx = hx * c - hy * s, nhy = hx * s + hy * c;
        const rl = Math.sqrt(x * x + y * y) + 1e-5;
        hx = nhx + (x / rl) * 0.07; hy = nhy + (y / rl) * 0.07;
        hz = hz * 0.7 + (r1 - 0.5) * 0.12 - z * 0.4;
        const hl = Math.sqrt(hx * hx + hy * hy + hz * hz);
        hx /= hl; hy /= hl; hz /= hl;
        const nx = x + hx * MYC_STEP, ny = y + hy * MYC_STEP, nz = z + hz * MYC_STEP;
        // lay the segment
        const o3 = seg * 3, o4 = seg * 4;
        mycP0[o3] = x; mycP0[o3 + 1] = y; mycP0[o3 + 2] = z;
        mycP1[o3] = nx; mycP1[o3 + 1] = ny; mycP1[o3 + 2] = nz;
        mycInfo[o4] = tipGen[i]; mycInfo[o4 + 2] = r2; mycInfo[o4 + 3] = step;
        if (tipSeg[i] >= 0) mycInfo[tipSeg[i] * 4 + 1] = 0;
        tipSeg[i] = seg;
        mycInfo[o4 + 1] = 1; // the newest segment of a hypha is its tip until it extends
        seg++;
        tipX[i] = nx; tipY[i] = ny; tipZ[i] = nz;
        tipHx[i] = hx; tipHy[i] = hy; tipHz[i] = hz;
        tipGap[i]++;
        // the rim stops the tip
        if (nx * nx + ny * ny > rim * rim) { tipAlive[i] = 0; continue; }
        // lateral branching
        if (tipGap[i] >= 3 && r2 < 0.15 && nTips < MAX_TIPS && tipGen[i] < 8) {
          const side = r1 < 0.5 ? 1 : -1;
          const ca = Math.cos(branchAngle * side), sa = Math.sin(branchAngle * side);
          const j = nTips++;
          tipX[j] = nx; tipY[j] = ny; tipZ[j] = nz;
          tipHx[j] = hx * ca - hy * sa; tipHy[j] = hx * sa + hy * ca; tipHz[j] = hz * 0.5 + (r0 - 0.5) * 0.2;
          tipGen[j] = tipGen[i] + 1; tipAlive[j] = 1; tipGap[j] = 0; tipSeg[j] = -1;
          tipGap[i] = 0;
        }
      }
      if (!live) break;
    }
    mycSteps = Math.max(1, step);
    stepStart[step] = seg;
    mycTotal = seg;
    attrP0.needsUpdate = true;
    attrP1.needsUpdate = true;
    attrInfo.needsUpdate = true;
    MU.uTotal.value = Math.max(1, seg);
  }
  // the visible prefix for a development level, linear in growth time
  function mycCount(devel) {
    const u = clamp(devel, 0, 1) * mycSteps;
    const s = Math.min(Math.floor(u), mycSteps - 1);
    const f = u - s;
    const a = stepStart[s], b = stepStart[s + 1];
    return Math.min(mycTotal, Math.max(1, Math.round(a + (b - a) * f)));
  }

  // --- state ------------------------------------------------------------------------
  let level = 0, target = 0, dir = 1;
  let knobPrev = null, strikePrev = 0;
  let jig = 0, press = 0, bass = 0, high = 0, lvl = 0, dist = 3.4, panX = 0, panY = 0, pulse = 0, beatPrev = 0;
  let orgS = 0, flow = 0;
  let mycSway = -1; // the sway the network was last grown for (−1: never)

  return {
    scene,
    camera,
    update(dt, t, io) {
      // ---- the level: KNOB 5 sets it, any strike steps it
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
      const devel = level / 4;

      // ---- the organism: KNOB 6, centre egg, right slime mold, left mycelium
      orgS = approach(orgS, (io.knobs[5] - 0.5) * 2, 0.15, dt);
      const f = smooth01((Math.abs(orgS) - 0.1) / 0.8);
      const wEgg = 1 - f;
      const wSlime = orgS > 0 ? f : 0;
      const wMyc = orgS < 0 ? f : 0;

      // ---- gestures: sway morphs, press squeezes, the hand pans and dollies
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
      flow += dt * (1.6 + pulse * 4.0);

      // ---- the organisms' generators
      if (wEgg > 0.002) U.uCount.value = computeCells(level);
      if (wSlime > 0.002) slimeStep(jig, press, smooth01(devel));
      if (wMyc > 0.002) {
        if (mycSway < 0 || Math.abs(jig - mycSway) > 0.004) {
          growMycelium(0.58 + jig * 0.62, 0.22 + jig * 0.55);
          mycSway = jig;
        }
        const n = mycCount(devel);
        mycGeo.instanceCount = n;
        MU.uCount.value = n;
      }
      hyphae.visible = wMyc > 0.002;

      // ---- uniforms
      const pl = io.palette;
      for (let i = 0; i < 5; i++) pal[i].value.copy(pl[i]);
      mpal[0].value.copy(pl[0]); mpal[1].value.copy(pl[1]); mpal[2].value.copy(pl[2]);
      U.uTime.value = t;
      U.uDist.value = dist;
      U.uJig.value = jig;
      U.uPress.value = press;
      U.uBeat.value = pulse;
      U.uBass.value = bass;
      U.uHigh.value = high;
      U.uLevelA.value = lvl;
      U.uLevel.value = level;
      U.uIntensity.value = io.intensity;
      U.uPan.value.set(panX, panY);
      U.uOrg.value.set(wEgg, wSlime, wMyc);
      U.uFlow.value = flow;
      MU.uPan.value.set(panX, panY);
      MU.uDist.value = dist;
      MU.uPress.value = press;
      MU.uBass.value = bass;
      MU.uWeight.value = wMyc;
      MU.uIntensity.value = io.intensity;
      MU.uBeat.value = pulse;
      MU.uHigh.value = high;
      MU.uTime.value = t;
    },
    resize(w, h) {
      U.uRes.value.set(w, h);
      MU.uRes.value.set(w, h);
    },
    dispose() {
      quad.geometry.dispose();
      mat.dispose();
      trailTex.dispose();
      mycGeo.dispose();
      mycMat.dispose();
    },
  };
}
