// Miracle Mile — the atom, and the city it ends. Four acts on one knob, a noir
// city under all of them, and a deck of sixteen re-entry vehicles over the top.
//
//   ACT         KNOB 6 (io.knobs[5]) picks it in quarter turns the moment the
//               knob moves: 0–¼ COLLIDER, ¼–½ FISSION, ½–¾ DETONATION, ¾–1
//               SHOCKWAVE — so the 0.5 default rests on the city under its
//               mature cloud. The 'act' parameter drives the same choice from
//               any assigned control.
//   YIELD       KNOB 5 (io.knobs[4]), or the 'yield' parameter: collision
//               multiplicity, prompt-neutron count, and the size of every
//               cloud the deck lands.
//   PADS        In the COLLIDER and FISSION acts a strike fires that act's
//               event, as it always did. In the two CITY acts every pad is its
//               own re-entry vehicle (below). A strike thrown with the hand
//               CLENCHED (press ≥ 0.8) fires ground zero instead — that is how
//               the classic single-cloud detonation stays on an unassigned
//               deck; 'detonate' is the assignable form of the same event.
//
//   COLLIDER    Inside the detector: a barrel of tracker and calorimeter
//               layers (thin rings and axial lines, one instanced mesh of
//               capsules), the beam pipe on the axis, two bunches racing in
//               from either end and crossing at the interaction point. A
//               strike is the collision: 40–120 charged tracks spray from the
//               vertex as helices in the solenoid field (rebuilt every frame
//               from each track's pT, φ, η and charge, so the field is live),
//               propagate outward in 0.4 s, leave hits on every layer they
//               cross and dump energy into calorimeter bars at the barrel,
//               then fade over ~3 s. Most tracks cluster about three jet axes.
//               SWAY is the field strength; PRESS dives the eye toward the
//               vertex; the hand orbits.
//   FISSION     Thirteen nuclei in the dark — one at the centre, twelve around
//               it on an icosahedron — each a packed cluster of nucleons that
//               jitters in place. A strike fires a neutron at the nearest idle
//               nucleus: the drop swells, oscillates, elongates, necks and
//               splits; two hot fragments fly apart while two to four prompt
//               neutrons leave for neighbouring nuclei, which split in turn.
//               The chain crosses the lattice with a gamma flash and an
//               expanding shell at every scission, whites out when the last
//               one goes, and the lattice re-forms. SWAY morphs clean
//               symmetric scission into a wobbling asymmetric one; PRESS
//               compresses the nuclei; the hand orbits.
//   THE CUT     FISSION → DETONATION is not a dissolve. The lattice hangs
//               forty-six metres up in the middle of a boulevard, and the act
//               change is one continuous pull-back along a single straight
//               line — no turn, no cross-fade, no flare. The eye recedes from
//               eleven metres to five hundred and twenty on a LOG schedule, so
//               the field of view opens at a constant rate and the picture
//               never lurches. As it opens, every nucleon leaves its shell and
//               travels to a REAL LIT WINDOW: the block grid is keyed by an
//               integer hash that JS and GLSL evaluate bit for bit alike, and
//               the JS runs the shader's window rule verbatim — the same
//               pitch, the same lit fraction, the same pane inside its cell,
//               the same on/off hash and colour temperature, and the SAME
//               MASSES: a lot stands as up to three stacked boxes, and a JS
//               copy that knew only the total height sent most of the deco
//               tower's panes to a wall plane that does not exist above the
//               setback. It has to be verbatim in every one of those, or the
//               cluster lands on panes the city leaves dark or on air, and the
//               points wink out instead of becoming windows. Only panes bright
//               enough to read at that distance are candidates; a nucleon that
//               lands on a desk lamp has landed on nothing. Each nucleon is
//               then matched to a window by WHERE IT SITS IN THE FRAME — its
//               place seen from the near station against the window's place
//               seen from the far one — so the point crosses the move without
//               crossing the screen, and it ARRIVES HOLDING THAT PANE'S OWN
//               COLOUR, computed from the shader's own window expression and
//               carried on a per-instance colour rather than a palette ramp
//               coordinate, because the ramp and the window rule only agree at
//               the warm end and a constellation resolving cyan over a gold
//               and blue-white grid is the hand-off showing. The cluster does
//               not dissolve into the city; it unfolds onto it, and what was a
//               shell of nucleons is the pattern of lit windows down the
//               canyon. The city's own window emission only comes up under
//               them at the end of the move, when a pane is a pixel wide and
//               the hand-off cannot be seen. Reversing the knob runs it
//               backwards; the 'transition' parameter scrubs it by hand. The
//               MIRV deck stands down for the move: it is the one time the eye
//               flies THROUGH the block the near row of the deck lands on, and
//               a cloud column the eye is standing inside is not readable at
//               any step count. The clouds thin out as the move starts and
//               stand again as it lands, ageing all the way through; ground
//               zero, five hundred metres beyond where the move ends, stays.
//   CITY        One noir city serves both city acts; the act weight only moves
//               the eye. It is a raymarched block grid — a DDA across thirty-
//               metre lots, avenues every fourth lot and cross streets every
//               fifth, the boulevard on the centre line — with four
//               architectural families drawn from the lot's hash: a DECO
//               SETBACK TOWER (three stacked masses, cornices and a banded
//               crown at each setback, vertical piers), a BRICK LOW-RISE (fire
//               escape down the street face, water tank on the roof), a GLASS
//               SLAB (thin plan, dense grid, one hard specular sliver,
//               mechanical penthouse and an aerial mast) and a WAREHOUSE BLOCK
//               (long, low, a ghost sign painted across the flank, roof
//               vents). Footprint, setback, height, cornice, window pitch, the
//               lit fraction of the grid and its colour temperature are all
//               per building. The light is noir: near-black material, one hard
//               key from a low angle squared so the shadow side goes black,
//               venetian bars barred across the facades, and saturation held
//               back for the windows and the signs. Wet asphalt takes a
//               second, shorter trace of the reflected ray, torn up vertically
//               so the reflection smears the way a wet street smears; lamp
//               rows down the boulevard throw long streaks in it and stand
//               light shafts in the air (the closed form of the 1/r² integral
//               along the ray); low fog banks sit in an exponential height
//               layer; rain falls in two slanted layers; steam stands off four
//               gratings. Window grids fold into their own average as a pane
//               falls under a pixel, so the skyline never crawls.
//   DETONATION  The eye is seventy metres up on the boulevard's axis, the city
//               running away under it to ground zero at the far end. At rest
//               the cloud there stands mature and churns — the cap's
//               convective roll and the stem's updraft are flows of the noise
//               domain, not rotation of anything. Ground zero detonates on
//               'detonate' (or a clenched strike): flash, fireball, stem, cap
//               broadening and cooling through orange to ash, and the front
//               out across the city. SWAY morphs the build (squat and broad ↔
//               tall and turbulent); PRESS flattens the cap; the hand dollies
//               and lifts the eye.
//   SHOCKWAVE   The same city from the pavement, looking down the boulevard.
//               When ground zero goes, the front comes down the road — a shell
//               that refracts what lies behind it, a condensation band just
//               inside it, a dust wall where it meets the ground, lamps
//               flaring and dying as it passes — then arrival: the eye shakes,
//               dust sweeps the view, embers fall, and the boulevard relights.
//               SWAY morphs hemisphere ↔ Mach stem; PRESS ducks; the hand sets
//               the position across the road and the eye's height.
//
//   MIRV        In the two city acts every pad is an independent re-entry
//               vehicle with its own place, its own yield and its own cloud;
//               several fly and several clouds stand at once (six cloud slots
//               on med, eight on high, four on low; slot zero is ground
//               zero's). A cloud never leaves the frame by winking out: it
//               thins over its last three and a half seconds, whether its life
//               ran out or the deck did. When the deck IS full the slot that
//               goes is the one furthest through its own life, not the one
//               launched first — the deck runs clouds whose lifetimes differ
//               by a factor of three side by side, and evicting by launch
//               order deleted a one-second-old fireball at its brightest while
//               a minute-old ash column stood next to it. The 'full salvo'
//               action fires exactly as many vehicles as the deck is deep,
//               spread across the pad map, for the same reason.
//               PLACE — the Sway's deck is physically two rows of eight, not a
//               four-by-four, so that is the map: the TOP row (pads 0–7) is
//               the far half of the city, the BOTTOM row (pads 8–15) the near
//               half, and the column runs left to right across the boulevard.
//               Each cell carries a fixed offset of its own so the pattern
//               never reads as a grid, and the map is deterministic, so it can
//               be learned.
//               YIELD — the pads are chromatic, 0 the lowest note and 15 the
//               highest, and the yield falls with pitch on 0.30 + 0.70·(1 −
//               i/15)^1.35. Pad 0 is a city-killer: a cap five hundred metres
//               up, ten seconds to full height, a minute standing, a front
//               that crosses the whole city. Pad 15 is a tactical burst that
//               tops out around a hundred and fifty — three and a third times
//               smaller in every dimension, up in four seconds, gone in
//               twenty-five. The curve's floor is set by the skyline and not by
//               the arithmetic: a cap that tops out under the rooftops is a
//               flash on a wall and nothing else, which is what the first cut
//               of this scene delivered on the high notes. Cap height and
//               width, stem width, rise, lifetime, front radius, dust, flash
//               and flight time all ride the same curve; velocity trims it.
//               RE-ENTRY — the strike does not begin with the burst. It begins
//               fifteen hundred metres beyond the far skyline and eight
//               hundred and eighty up, on the bus's track, and comes in over
//               the city so the whole descent is inside the frame: a small
//               extremely bright body inside a plasma sheath on a shallow arc
//               down the sky, heating as it reaches denser air, its ablation
//               trail streaming and breaking into puffs behind it,
//               decelerating, then the terminal dive onto the target — 1.0 s
//               for the smallest, 1.65 s for the largest, so the trail reads
//               as flight and not as a spark. The body and its sheath are
//               sized in ANGLE, not in metres: a two-metre vehicle two
//               kilometres out is under a pixel, so a physical radius left the
//               first half of every flight invisible. It is an unresolved
//               point source and it is drawn as one — hard and small at
//               release, swelling and whitening as the air thickens. Several
//               notes at once arrive as one bus's payload, fanned across the
//               same track. The city and the deck HIDE them: the world quad
//               writes no depth, so nothing it draws can occlude an impostor
//               on its own, and a vehicle diving at a target twenty-eight
//               blocks away was painted flat across the face of the tower in
//               front of it. The CPU asks the question the depth buffer cannot
//               — the DDA's own lot grid and the same masses, run from the eye
//               to four stations along the track, then the cap and stem bounds
//               of every standing cloud — and eases the answer into the body's
//               and the trail's alpha, so a vehicle passing behind a cornice
//               dims through it instead of blinking.
//               THEN — the flash, the fireball, the cap rising with its
//               toroidal roll, the stem drawing dust off the ground, the
//               condensation cap, and the front crossing the city: every
//               facade turned toward a fireball burns, windows and lamps flare
//               white as the front reaches them and go dark behind it, glass
//               glitters in the front, the ground scorches under the fireball,
//               and the grid relights from the outside in. The shell the eye
//               sees and the blackout the city takes are one radius law, so
//               they are always the same front.
//
// Nothing rotates by itself: the orbits and the dollies are the hand's, the
// pull-back is the knob's, bunches, tracks, fragments, vehicles and the front
// travel paths, the cloud's roll is a flow of the noise domain. Four draw
// calls: the world quad (the analytic backgrounds, the city DDA and its wet
// reflection trace, the cloud march, the front), one instanced mesh of
// screen-space capsules (detector lines, tracks, calorimeter bars, neutron
// streaks, lamp posts, ablation trails), and two instanced meshes of sphere
// impostors (solid, depth-writing: nucleons; additive: bunches, layer hits,
// free neutrons, re-entry bodies and sheaths, the windows the nucleons become,
// embers). Live bloom rides the flash.
//
// The cost centre is the city shading and the cloud deck, in that order: the
// boulevard alone is thirteen milliseconds a frame at 1080p on med, which
// leaves about three for everything the pads land, so every cloud has to be
// cheap by construction rather than by luck.
//
// TWO clouds are marched per ray on med and high and ONE on low. Every extra
// inlined copy of the density map costs the WHOLE shader its occupancy — a
// second march measured 2.4 ms a frame at 1080p even on frames where no ray
// took it — so a deck of six or eight will never fit in marches. The two the
// ray gets are ranked by where it ENTERS their bounds, nearest first, with a
// grazing guard that demotes a cloud the ray only clips behind every cloud it
// goes squarely through: without it a near cloud's grazed limb claims the ray,
// contributes almost nothing, and the cloud behind it is the one that suffers.
// Every cloud past the second is composited COARSELY — the same solid, sampled
// once across the ray's span, with the noise left off — and not dropped: a
// dropped third cloud leaves the silhouette of the second one's BOUND cut out
// of the deck in straight black edges, which is a worse artefact than an
// under-detailed mass at the back. The bound itself is a cap ellipsoid unioned
// with a capped stem cylinder rather than a ball, because empty sky inside a
// bound is a crescent bitten out of whatever stands behind it; the steps are
// apportioned by how much of the frame the cloud fills; a step further outside
// the solid than the noise can carve leaves before it evaluates the noise at
// all, and hands back its distance so the next step strides the whole of the
// empty space instead of walking it.
//
// The deck's uniforms are PACKED: the standing clouds sit at the front of five
// vec4 arrays with a uniform count, so an idle slot costs nothing (a uniform
// loop bound is coherent across the draw where a per-slot skip is not, and five
// idle slots measured a third of a millisecond each), and everything past the
// first array — cap height and radius, stem, carve depth, fire, embers, the
// flow of the noise domain, the fireball's light — is worked out once a frame
// on the CPU, because none of it depends on the pixel and every one of them was
// being recomputed once per cloud per pixel. The DDA skips any mass whose
// height band the ray cannot reach inside that cell; the dust veil's noise runs
// only while there is dust; the fireball terms leave before their divide once
// the fireball is out. Step budgets, the slot cap and the second march come off
// ctx.quality.tier.
//
// Colour comes from the palette: 0 the hot core, 1 fire and tungsten, 2 the
// detector, cool matter and cold window light, 3 the secondary tracks, gamma
// and signage, 4 ash, asphalt and dust — everything structural pulled most of
// the way to its own luminance, because noir keeps its saturation for the
// windows and the signs. Nothing lifts a wall that is turned away from the
// light: the fireballs' term on a facade is purely directional and the air
// glow rides the ray's own fog integral, so a deck standing over the city
// lights the haze and the faces turned toward it and leaves the rest black.

export const meta = {
  id: 'miraclemile',
  name: 'Miracle Mile',
  mood: 'critical',
  controls: {
    actions: [
      { key: 'collide', label: 'collision' },
      { key: 'split', label: 'fission' },
      { key: 'detonate', label: 'ground zero' },
      { key: 'blast', label: 'front only' },
      { key: 'strike', label: 'launch vehicle' },
      { key: 'salvo', label: 'full salvo' },
      { key: 'rebuild', label: 're-seed city' },
    ],
    params: [
      { key: 'act', label: 'act', min: 0, max: 3, default: 2 },
      { key: 'yield', label: 'yield', min: 0.05, max: 1, default: 0.5 },
      { key: 'transition', label: 'atom to city', min: 0, max: 1, default: 1 },
      { key: 'cloudScale', label: 'cloud scale', min: 0.35, max: 2.4, default: 1 },
      { key: 'place', label: 'strike place', min: 0, max: 15, default: 0 },
    ],
  },
};

const ACTS = 4; // collider, fission, detonation, shockwave
const ACT_FADE = 0.7;
const TRANSIT_T = 2.6; // seconds for the atom -> city pull-back
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

// the city: metres. The lot grid is keyed by an integer hash mirrored exactly
// in GLSL, so the CPU knows where every facade and every lit window stands.
const CELL = 30;      // lot pitch
const AV = 4;         // an avenue every fourth lot (lot 0 is the boulevard)
const ST = 5;         // a cross street every fifth lot
const H_MAX = 168;    // the DDA's ceiling: nothing stands taller
const CITY_FAR = 1700;
const LAMPS = 46;
const LAMP_DZ = 30;
const LAMP_Z0 = 60;
const LAMP_X = 19;
const LAMP_H = 8.5;
const EMBERS = 220;

// the atom hangs in the boulevard; the city eye is 520 m straight back from it
const ATOM_X = 0, ATOM_Y = 46, ATOM_Z = -360;
const TD_LEN = Math.sqrt(0.03 * 0.03 + 1);
const TDX = 0, TDY = 0.03 / TD_LEN, TDZ = 1 / TD_LEN;
const CITY_DIST = 520;
const ATOM_DIST = 11;

// ground zero, and the front that leaves it
const GZ_X = 0, GZ_Z = -900;
const GZ_SCALE = 1.22; // ground zero is the big one: the act's hero cloud

// re-entry vehicles and their clouds
const MAX_RV = 16;
const TRAIL_SEGS = 22;
const CLOUD_U = 31;      // metres of cloud scale at full yield
const PAD_SPREAD = 240;  // half the deck's reach across the ground
const PAD_Z = [-700, -300];
const RV_RANGE = 1500;   // downrange distance the bus releases at
const RV_ALT = 880;

const GLSL_COMMON = /* glsl */ `
  // shared helpers
  #define PI 3.14159265359
  #define TAU 6.28318530718
  // Hashes without a transcendental in them. The cloud march evaluates three
  // octaves of 3-D value noise three times a step, which is eight corner
  // hashes an octave: a sine in the hash would put thousands of them in every
  // pixel, and it did — this is the difference between 25 ms and 8 ms a frame.
  float h11(float n) { n = fract(n * 0.1031); n *= n + 33.33; n *= n + n; return fract(n); }
  float h21(vec2 p) { vec3 q = fract(vec3(p.xyx) * 0.1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
  float h31(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
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
  float fbm2b(vec2 p) {
    return 0.667 * vnoise2(p) + 0.333 * vnoise2(p * 2.03 + 7.1);
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
  // the cloud's own field: two octaves, normalised to the same range
  float fbm3c(vec3 p) {
    return (0.5 * vnoise3(p) + 0.25 * vnoise3(p * 2.07 + 5.3)) * 1.1667;
  }
  // noir holds saturation back for the signs and the windows: everything
  // structural is the palette pulled most of the way toward its own luminance
  vec3 grey(vec3 c, float k) { return mix(c, vec3(dot(c, vec3(0.299, 0.587, 0.114))), k); }
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
// the analytic backgrounds, the city DDA, the cloud march and the blast agree
// with the capsule and impostor meshes drawn by the same camera.
const WORLD_FRAG = /* glsl */ `
  ${GLSL_COMMON}
  #define CELLF ${CELL}.0
  #define HMAXF ${H_MAX}.0
  #define CFAR ${CITY_FAR}.0
  uniform vec2 uRes;
  uniform vec3 uCamPos, uCamFwd, uCamRight, uCamUp;
  uniform float uTanHalf, uTime, uIntensity, uFlash;
  uniform vec4 uActW; // act weights: collider, fission, detonation, shockwave
  uniform vec3 uPal0, uPal1, uPal2, uPal3, uPal4;
  // collider
  uniform float uVertexGlow, uCollFlash;
  // fission
  uniform vec4 uNuc[${NUCLEI}];  // xyz centre, w glow (0 gone, 1 intact, >1 hot)
  uniform vec4 uGamma[4];        // xyz centre, w radius (<=0 none)
  uniform float uGammaA[4];      // the four shells' brightness
  // the city
  uniform float uCitySeed, uCityFade, uWinFade, uRain, uFogD, uStreet;
  // The clouds. The standing ones are packed at the front of these arrays and
  // uNCloud says how many there are, so an idle slot costs the frame nothing —
  // a uniform loop bound is coherent across the whole draw where a per-slot
  // skip is not, and five idle slots measured a third of a millisecond each.
  // Everything past A is worked out ONCE A FRAME on the CPU, because none
  // of it depends on the pixel and every one of these arrays is read once per
  // cloud per pixel: the two exponentials and the page of arithmetic that used
  // to open every cloud's shading are gone from the fragment shader entirely.
  //   A = (x, z, age, scale)
  //   B = (front radius, stem drift, fire light, fireball amplitude)
  //   C = (cap height, air-glow amplitude, density fade, maturity)
  //   D = (cap radius, cap thickness, stem radius, carve depth)
  //   E = (core radius, fire, ember, cap roll)
  uniform int uNCloud;
  uniform vec4 uCloudA[MAX_CLOUDS];
  uniform vec4 uCloudB[MAX_CLOUDS];
  uniform vec4 uCloudC[MAX_CLOUDS];
  uniform vec4 uCloudD[MAX_CLOUDS];
  uniform vec4 uCloudE[MAX_CLOUDS];
  uniform float uMorph, uPress;
  // the front out of ground zero
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

  // ---- fission: the dark, each nucleus's glow, the gamma shells
  vec3 fissionBg(vec3 ro, vec3 rd) {
    vec3 col = uPal1 * 0.008;
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
      float rw = (dC - g.w) / (0.06 + g.w * 0.07);
      float ring = exp(-rw * rw);
      col += mix(uPal3, vec3(1.0), 0.5) * ring * uGammaA[k] * 0.9;
    }
    return col;
  }

  // ================================================================ the city
  // An integer hash, evaluated bit-for-bit the same in JS, keys every lot; the
  // CPU reads the same grid to find the windows the nucleons land on.
  uint hu(uint x) { x ^= x >> 16u; x *= 0x7feb352du; x ^= x >> 15u; x *= 0x846ca68bu; x ^= x >> 16u; return x; }
  float hf(uint x) { return float(hu(x) & 0xffffffu) / 16777216.0; }
  uint lotKey(ivec2 c) { return uint(c.x + 1024) * 4096u + uint(c.y + 1024) + uint(uCitySeed) * 7919u; }
  bool lotStreet(ivec2 c) {
    // the offsets are multiples of both spacings, so the fraction of the scaled
    // index is the modulo — and no integer division reaches the DDA's inner loop
    return fract((float(c.x) + 4100.0) * ${(1 / AV).toFixed(6)}) < 0.05
        || fract((float(c.y) + 4100.0) * ${(1 / ST).toFixed(6)}) < 0.05;
  }

  // one lot: family, plan centre, and the up-to-three masses it stands as.
  // b* = (half x, half z, y base, y top); off = (mass 1 offset, mass 2 offset)
  void lotOf(ivec2 c, out int fam, out vec2 ctr, out vec4 b0, out vec4 b1, out vec4 b2, out vec4 off, out vec4 rnd, out float top) {
    uint k = lotKey(c);
    uint a = hu(k), b = hu(k ^ 0x9e3779b9u);
    rnd = vec4(float(a & 255u), float((a >> 8) & 255u), float((a >> 16) & 255u), float(a >> 24)) * (1.0 / 255.0);
    float f = float(b & 4095u) * (1.0 / 4096.0);
    float g = float((b >> 12) & 4095u) * (1.0 / 4096.0);
    fam = f < 0.17 ? 0 : (f < 0.55 ? 1 : (f < 0.73 ? 2 : 3));
    float hx = CELLF * 0.5 - (3.0 + rnd.x * 4.0);
    float hz = CELLF * 0.5 - (3.0 + rnd.y * 4.0);
    vec2 o = vec2((rnd.z - 0.5) * 3.0, (rnd.w - 0.5) * 3.0);
    if (abs(c.x) == 1) { hx -= 4.0; o.x += c.x > 0 ? 4.0 : -4.0; } // the boulevard is set back
    ctr = vec2(c) * CELLF + o;
    off = vec4(0.0);
    b1 = vec4(0.0); b2 = vec4(0.0);
    if (fam == 0) {          // deco setback tower
      float H = 62.0 + g * 74.0;
      b0 = vec4(hx, hz, 0.0, H * 0.42);
      b1 = vec4(hx * 0.74, hz * 0.74, H * 0.42, H * 0.76);
      b2 = vec4(hx * 0.46, hz * 0.46, H * 0.76, H);
    } else if (fam == 1) {   // brick low-rise, water tank on the roof
      float H = 13.0 + g * 23.0;
      b0 = vec4(hx, hz, 0.0, H);
      b1 = vec4(3.2, 3.2, H, H + 6.5);
      off.xy = vec2(hx * 0.45, -hz * 0.4);
    } else if (fam == 2) {   // glass slab, plant room and a mast
      hx *= 1.06; hz *= 0.60;
      float H = 44.0 + g * 58.0;
      b0 = vec4(hx, hz, 0.0, H);
      b1 = vec4(hx * 0.55, hz * 0.75, H, H + 5.5);
      b2 = vec4(0.55, 0.55, H + 5.5, H + 22.0);
      off.zw = vec2(hx * 0.32, 0.0);
    } else {                 // warehouse block, roof vents
      float H = 9.0 + g * 13.0;
      b0 = vec4(hx, hz, 0.0, H);
      b1 = vec4(hx * 0.4, hz * 0.34, H, H + 4.0);
      off.xy = vec2(-hx * 0.3, hz * 0.22);
    }
    top = max(max(b0.w, b1.w), b2.w);
  }

  float lotTop(uint k, out int fam, out float g) {
    uint b = hu(k ^ 0x9e3779b9u);
    float f = float(b & 4095u) * (1.0 / 4096.0);
    g = float((b >> 12) & 4095u) * (1.0 / 4096.0);
    fam = f < 0.17 ? 0 : (f < 0.55 ? 1 : (f < 0.73 ? 2 : 3));
    if (fam == 0) return 62.0 + g * 74.0;
    if (fam == 1) return 19.5 + g * 23.0;
    if (fam == 2) return 66.0 + g * 58.0;
    return 13.0 + g * 13.0;
  }

  vec3 safeInv(vec3 v) {
    vec3 s = vec3(v.x >= 0.0 ? 1.0 : -1.0, v.y >= 0.0 ? 1.0 : -1.0, v.z >= 0.0 ? 1.0 : -1.0);
    return s / max(abs(v), vec3(1e-7));
  }
  // slab test; the normal comes from whichever slab produced the entry
  float boxT(vec3 ro, vec3 ird, vec3 bmn, vec3 bmx, out vec3 n) {
    vec3 t1 = (bmn - ro) * ird, t2 = (bmx - ro) * ird;
    vec3 tn = min(t1, t2), tf = max(t1, t2);
    float tN = max(max(tn.x, tn.y), tn.z);
    float tF = min(min(tf.x, tf.y), tf.z);
    if (tF < max(tN, 0.0)) return -1.0;
    vec3 sel = step(tn.yzx, tn.xyz) * step(tn.zxy, tn.xyz);
    n = -sign(ird) * sel;
    return tN > 0.0 ? tN : tF;
  }

  // A DDA across the lot grid. Street lots cost nothing; a built lot tests its
  // masses only while the ray's height band could reach them.
  float traceCity(vec3 ro, vec3 rd, float tMax, int steps, out vec3 nrm, out ivec2 hc, out int hlvl) {
    nrm = vec3(0.0, 1.0, 0.0); hc = ivec2(0); hlvl = -1;
    if (ro.y > HMAXF && rd.y >= 0.0) return -1.0;
    vec3 ird = safeInv(rd);
    vec2 g = ro.xz / CELLF + 0.5;
    vec2 rg = rd.xz / CELLF;
    ivec2 c = ivec2(floor(g));
    ivec2 st = ivec2(rg.x >= 0.0 ? 1 : -1, rg.y >= 0.0 ? 1 : -1);
    vec2 dl = abs(vec2(1.0) / max(abs(rg), vec2(1e-7)));
    vec2 nx = vec2(
      ((float(c.x) + (st.x > 0 ? 1.0 : 0.0)) - g.x) / (abs(rg.x) < 1e-7 ? 1e-7 * float(st.x) : rg.x),
      ((float(c.y) + (st.y > 0 ? 1.0 : 0.0)) - g.y) / (abs(rg.y) < 1e-7 ? 1e-7 * float(st.y) : rg.y));
    float t0 = 0.0;
    int famQ; float gQ;
    for (int i = 0; i < steps; i++) {
      float tc = min(nx.x, nx.y);
      float t1 = min(tc, tMax);
      float ya = ro.y + rd.y * t0, yb = ro.y + rd.y * t1;
      float ylo = min(ya, yb), yhi = max(ya, yb);
      if (ylo < HMAXF && !lotStreet(c) && ylo < lotTop(lotKey(c), famQ, gQ)) {
        int fam; vec2 ctr; vec4 b0, b1, b2, off, rnd; float top;
        lotOf(c, fam, ctr, b0, b1, b2, off, rnd, top);
        {
          float best = 1e9; vec3 bn = vec3(0.0); int bl = -1;
          for (int j = 0; j < 3; j++) {
            vec4 b = j == 0 ? b0 : (j == 1 ? b1 : b2);
            // the ray's height band inside this cell decides which masses it
            // can reach at all: a water tank on a roof costs nothing to a ray
            // running along the pavement
            if (b.x < 0.05 || b.w < ylo || b.z > yhi) continue;
            vec2 cc = ctr + (j == 1 ? off.xy : (j == 2 ? off.zw : vec2(0.0)));
            vec3 n;
            float t = boxT(ro, ird, vec3(cc.x - b.x, b.z, cc.y - b.y), vec3(cc.x + b.x, b.w, cc.y + b.y), n);
            if (t > 0.0 && t < best && t <= t1 + 0.001 && t <= tMax) { best = t; bn = n; bl = j; }
          }
          if (bl >= 0) { nrm = bn; hc = c; hlvl = bl; return best; }
        }
      }
      if (t1 >= tMax) break;
      if (rd.y > 0.0 && ro.y + rd.y * t1 > HMAXF) break;
      if (nx.x < nx.y) { nx.x += dl.x; c.x += st.x; } else { nx.y += dl.y; c.y += st.y; }
      t0 = t1;
    }
    return -1.0;
  }

  // ---- the front each burst drives across the city (its radius arrives as
  // uCloudB[i].x and its fireball's brightness as uCloudB[i].w, both computed
  // once a frame on the CPU rather than once per pixel per cloud)
  // at a ground point: how much light survives, how hard the front is flaring
  // there right now, how much glass is glittering in it, how burnt the ground
  // is, and how hard the fireballs are lighting it
  void frontAt(vec2 q, out float blown, out float flare, out float glint, out float scorch, out float fireLit, out vec2 fireDir) {
    blown = 1.0; flare = 0.0; glint = 0.0; scorch = 0.0; fireLit = 0.0; fireDir = vec2(0.0);
    for (int i = 0; i < MAX_CLOUDS; i++) {
      if (i >= uNCloud) break;
      vec4 A = uCloudA[i];
      vec4 B = uCloudB[i];
      float sc = A.w;
      vec2 dv = q - A.xy;
      float d2 = dot(dv, dv);
      // Every fireball lights the whole quarter it stands in — while there is a
      // fireball. A cloud a minute old contributes a number with twenty zeroes
      // after the point, and this loop runs once per pixel per cloud, so it
      // leaves before the divide rather than after it.
      if (B.w > 0.0008) {
        float r2 = sc * sc * 170.0;
        float fl = B.w * r2 / (r2 + d2);
        fireLit += fl;
        fireDir -= dv * (fl * inversesqrt(max(d2, 1.0)));
      }
      if (d2 > B.x * B.x) continue;                          // the front is not here yet
      float d = sqrt(d2);
      // when it did reach here. The exact inverse of the radius law wants a
      // pow; a quarter root off it is the same curve to the eye and it is the
      // only transcendental in this loop that ran per pixel per cloud.
      float xr = max(d, 0.001) / (sc * 9.0);
      float since = A.z - xr * sqrt(sqrt(xr));
      // the grid comes back from the outside in: the blocks the front reached
      // last are the ones the crews reach first
      float relight = smoothstep(0.0, 1.0, (since - 14.0 - (1.0 - d / (sc * 45.0)) * 14.0) * 0.075);
      blown *= 1.0 - (1.0 - relight) * 0.95;
      float e = exp(-max(since, 0.0) / 1.2);
      glint += e;
      flare += e * e * 2.0;
      scorch = max(scorch, smoothstep(sc * 3.0, sc * 0.8, d) * smoothstep(0.0, 1.5, A.z));
    }
    flare = min(flare, 2.4);
    fireLit = min(fireLit, 1.9);   // a salvo lights the city, it does not bleach it
    fireDir = fireLit > 0.001 ? normalize(fireDir + vec2(1e-5, 0.0)) : vec2(0.0);
  }

  // ---- lamps down the boulevard: surface light, head glow, and the shaft.
  // "on" is the front's verdict on this stretch of the boulevard, sampled once
  // by the caller: the lamps in a group stand within a few metres of each other
  // and the front is metres wide, so one query serves the whole group.
  float lampLight(vec3 p, float on) {
    float k0 = floor((-p.z - ${-LAMP_Z0}.0) / ${LAMP_DZ}.0);
    float sum = 0.0;
    for (int i = -1; i <= 1; i++) {
      float k = clamp(k0 + float(i), 0.0, ${LAMPS - 1}.0);
      float lz = ${LAMP_Z0}.0 - ${LAMP_DZ}.0 * k;
      for (int s = 0; s < 2; s++) {
        vec3 lp = vec3(s == 0 ? -${LAMP_X}.0 : ${LAMP_X}.0, ${LAMP_H.toFixed(2)}, lz);
        vec3 dv = p - lp;
        float d2 = dot(dv, dv);
        float cosT = max(-dv.y, 0.0) / sqrt(max(d2, 1e-4));
        sum += on * 130.0 * cosT / (d2 + 20.0);
      }
    }
    return sum;
  }
  // the closed form of the integral of 1/(r^2+k) along the ray: real shafts
  vec3 lampAir(vec3 ro, vec3 rd, float tEnd, float on) {
    float tm = min(tEnd, 260.0) * 0.5;
    float zc = ro.z + rd.z * tm;
    float k0 = floor((-zc - ${-LAMP_Z0}.0) / ${LAMP_DZ}.0);
    float sum = 0.0;
    float head = 0.0;
    for (int i = -1; i <= 1; i++) {
      float k = clamp(k0 + float(i), 0.0, ${LAMPS - 1}.0);
      float lz = ${LAMP_Z0}.0 - ${LAMP_DZ}.0 * k;
      for (int s = 0; s < 2; s++) {
        vec3 lp = vec3(s == 0 ? -${LAMP_X}.0 : ${LAMP_X}.0, ${LAMP_H.toFixed(2)}, lz);
        vec3 w = lp - ro;
        float b = dot(w, rd);
        float perp = max(dot(w, w) - b * b, 0.0);
        float c2 = perp + 3.0;
        float sq = sqrt(c2);
        float seen = smoothstep(-40.0, 40.0, b) * smoothstep(tEnd + 40.0, tEnd - 40.0, b);
        sum += 180.0 / (c2 + sq * 57.3) * seen;
        // the head itself: a glow of fixed angular size falling off as 1/d²
        if (b > 3.0 && b < tEnd) head += exp(-perp * 2600.0 / max(b * b, 9.0)) * 2400.0 / max(dot(w, w), 60.0);
      }
    }
    return mix(uPal1, vec3(1.0), 0.35) * on * (sum * 0.12 * (0.35 + uFogD * 90.0) + head * 0.8);
  }

  // ---- facades
  // window emission at a facade point; aa folds the grid into its average once
  // a pane falls under a pixel, so the city never crawls
  vec3 windows(float u, float v, uint k, int fam, vec4 rnd, vec4 bx, float aa, float blown, out float lum) {
    float wx = 3.0 + rnd.x * 1.5, wy = 3.3 + rnd.y * 0.9;
    // most buildings are mostly dark; a few burn late. The cube pulls the mass
    // of the distribution down so the skyline reads as blocks with a scatter of
    // occupied floors, not a lit grid.
    float litF = 0.03 + 0.5 * rnd.z * rnd.z;
    float ct = rnd.w * 0.5;
    if (fam == 2) { wx = 2.1 + rnd.x * 0.7; wy = 3.1; litF = 0.10 + 0.55 * rnd.z * rnd.z; ct = 0.55 + rnd.w * 0.45; }
    else if (fam == 3) { wx = 4.5 + rnd.x * 2.0; wy = 4.2; litF = 0.03 + rnd.z * 0.12; }
    vec3 warm = mix(uPal1, uPal0, 0.30);
    vec3 cool = mix(uPal2, vec3(1.0), 0.30);
    float above = step(bx.z + 1.2, v) * step(v, bx.w - 1.4);
    // past a pane a pixel wide the grid is its own average, so the far half of
    // the skyline never pays for the pane, the blind or the flicker
    if (aa > 0.985) {
      lum = litF * 0.30 * above;
      return mix(warm, cool, ct) * lum * blown;
    }
    float fu = u / wx, fv = (v - 1.6 - rnd.w * 1.4) / wy;
    ivec2 wi = ivec2(floor(fu), floor(fv));
    uint wk = k * 131u + uint(wi.x + 512) * 17u + uint(wi.y + 512) * 71u;
    uint w1 = hu(wk), w2 = hu(wk ^ 0x85ebca6bu);
    float on = step(float(w1 & 4095u) * (1.0 / 4096.0), litF);
    // brightness spread over more than a decade: a desk lamp and a whole floor
    float bh = float((w1 >> 12) & 4095u) * (1.0 / 4096.0);
    float br = 0.06 + 0.95 * bh * bh * bh;
    float ctj = clamp(ct + (float(w2 & 255u) * (1.0 / 255.0) - 0.5) * 0.5, 0.0, 1.0);
    float gu = fract(fu), gv = fract(fv);
    // mullion and spandrel: the pane is well short of its cell
    float pane = step(0.24, gu) * step(gu, 0.78) * step(0.18, gv) * step(gv, 0.64);
    // a blind drawn in a third of them, and the odd fluorescent flicker
    float blind = 1.0 - 0.55 * step(0.62, float((w2 >> 8) & 255u) * (1.0 / 255.0)) * step(0.5, fract(gv * 6.0));
    float flk = 1.0 - 0.6 * step(0.94, float((w2 >> 16) & 255u) * (1.0 / 255.0)) * step(0.5, h11(floor(uTime * 11.0) + float(wi.x + wi.y)));
    float sharp = on * pane * br * blind * flk;
    lum = mix(sharp, litF * 0.30, aa) * above;
    return mix(warm, cool, mix(ctj, ct, aa)) * lum * blown;
  }

  // just the material and the panes: what a wet road can carry
  vec3 shadeFacadeLite(vec3 p, vec3 n, ivec2 c, int lvl, float dist, float blown) {
    int fam; vec2 ctr; vec4 b0, b1, b2, off, rnd; float top;
    lotOf(c, fam, ctr, b0, b1, b2, off, rnd, top);
    vec4 bx = lvl == 0 ? b0 : (lvl == 1 ? b1 : b2);
    if (n.y > 0.5) return grey(uPal4, 0.8) * 0.02;
    float u = abs(n.x) > 0.5 ? p.z : p.x;
    float key = max(dot(n, vec3(-0.823632, 0.220974, 0.522303)), 0.0);
    key *= key;
    vec3 stone = grey(mix(uPal4, vec3(1.0), 0.18), 0.82);
    vec3 col = stone * (0.009 + 0.34 * key);
    float lum = 0.0;
    if (bx.w - bx.z > 8.0) col += windows(u, p.y, lotKey(c), fam, rnd, bx, smoothstep(1.4, 4.2, dist * uTanHalf * 2.0 / uRes.y), blown, lum) * (0.06 + 1.05 * uWinFade);
    return col;
  }

  vec3 shadeFacade(vec3 p, vec3 n, ivec2 c, int lvl, float dist, float blown, float flare, float glint, float scorch, float fireLit, vec2 fireDir) {
    int fam; vec2 ctr; vec4 b0, b1, b2, off, rnd; float top;
    lotOf(c, fam, ctr, b0, b1, b2, off, rnd, top);
    vec4 bx = lvl == 0 ? b0 : (lvl == 1 ? b1 : b2);
    uint k = lotKey(c);
    bool roof = n.y > 0.5;
    float u = abs(n.x) > 0.5 ? p.z : p.x;
    float v = p.y;
    float px = dist * uTanHalf * 2.0 / uRes.y;           // metres per pixel
    float aa = smoothstep(1.4, 4.2, px);
    float near = 1.0 - aa;

    // one hard key from a low angle, barred by venetian shadow
    vec3 KEY = vec3(-0.823632, 0.220974, 0.522303); // unit by construction: no constant normalize
    float key = max(dot(n, KEY), 0.0);
    key *= key;                                        // hard: the shadow side goes black
    float bar = mix(1.0, 0.16 + 0.84 * smoothstep(0.28, 0.50, fract(v * 0.20 + u * 0.055 + rnd.z * 4.0)), near * (roof ? 0.0 : 0.9));
    float grain = 0.78 + 0.44 * vnoise2(vec2(u, v) * (fam == 1 ? 2.2 : 0.55) + rnd.xy * 17.0);
    vec3 stone = grey(mix(uPal4, vec3(1.0), fam == 1 ? 0.06 : 0.18), 0.82);
    vec3 col = stone * (0.009 + 0.40 * key * bar) * grain;
    if (fam == 2 && !roof) {
      // a glass skin: near black, one sharp specular sliver off the key, the
      // spandrel bands between floors darker than the glass
      float k3 = key * key * key;
      col = stone * 0.004 + grey(mix(uPal2, vec3(1.0), 0.5), 0.4) * k3 * k3 * 0.55;
      col += stone * 0.05 * step(0.86, fract(u / (2.1 + rnd.x * 0.7))) * near;
    }
    if (roof) {
      // tar and gravel, standing water, and whatever the block keeps up there
      float wetR = smoothstep(0.45, 0.7, vnoise2(p.xz * 0.09 + rnd.zw * 7.0));
      col = stone * (0.010 + 0.10 * key) * (0.6 + 0.7 * vnoise2(p.xz * 1.6))
          + grey(mix(uPal2, vec3(1.0), 0.45), 0.35) * wetR * 0.030;
      if (lvl > 0) col += stone * 0.02;
    }
    float lum = 0.0;
    if (bx.w - bx.z > 8.0 && !roof) col += windows(u, v, k, fam, rnd, bx, aa, blown, lum) * (0.06 + 1.05 * uWinFade);

    if (!roof) {
      // cornice: a lit lip and the shadow it throws
      float cn = smoothstep(bx.w - 1.5, bx.w - 0.9, v) * (1.0 - step(bx.w, v));
      float cnS = smoothstep(bx.w - 3.4, bx.w - 1.6, v) * (1.0 - smoothstep(bx.w - 1.6, bx.w - 1.4, v));
      float hasCn = fam == 2 ? 0.15 : 1.0;
      col += stone * cn * (0.02 + 0.55 * key) * hasCn - stone * cnS * 0.02 * hasCn;
      if (fam == 0) {
        // deco piers: vertical ribs catching the key, and a banded crown
        float rib = smoothstep(0.40, 0.5, abs(fract(u / 3.6) - 0.5));
        col += stone * rib * key * 0.16;
        float crown = step(bx.w - 7.0, v) * step(0.55, fract(v * 0.9));
        col += stone * crown * key * 0.20;
      }
      if (fam == 1) {
        // fire escape: platforms every floor, rails, a diagonal run, over a
        // band of the facade
        float wy = 3.3 + rnd.y * 0.9;
        float uc = abs(n.x) > 0.5 ? ctr.y : ctr.x;
        float band = 1.0 - smoothstep(2.4, 3.2, abs(u - (uc + (rnd.w - 0.5) * 9.0)));
        float fvv = fract((v - 1.0) / wy);
        float plat = step(fvv, 0.10);
        float rail = step(0.10, fvv) * step(fvv, 0.16);
        float diag = step(abs(fract(u * 0.32 + fvv) - 0.5), 0.06) * step(0.16, fvv);
        float fe = clamp(plat + rail * 0.6 + diag * 0.5, 0.0, 1.0) * band * near;
        col = mix(col, stone * (0.010 + 0.55 * key), fe * 0.9);
      }
      if (fam == 3) {
        // a painted sign across the flank, ghosted
        float paint = smoothstep(0.45, 0.55, vnoise2(vec2(u * 0.35, v * 0.7) + rnd.zw * 9.0)) * step(v, bx.w - 2.0) * step(bx.z + 3.0, v);
        col += stone * paint * key * 0.22;
      }
      // signage: saturated, one of the few things in the frame that has colour
      if (rnd.w > 0.74) {
        float sy = bx.z + (bx.w - bx.z) * (0.6 + rnd.z * 0.35);
        float sc0 = (rnd.x - 0.5) * 9.0 + (abs(n.x) > 0.5 ? ctr.y : ctr.x);
        float sh = 0.9 + rnd.y * 0.8, sw = 3.0 + rnd.x * 3.5;
        float sm = (1.0 - smoothstep(sh, sh + 0.35, abs(v - sy))) * (1.0 - smoothstep(sw, sw + 0.5, abs(u - sc0)));
        float glyph = step(0.34, fract((u - sc0) * 1.6));
        float dead = step(0.5, fract((u - sc0) * 0.30 + 0.2));
        float fl = 0.5 + 0.5 * step(0.16, h11(floor(uTime * 8.0) + rnd.w * 31.0 + dead * 5.0));
        vec3 sgn = mix(uPal3, uPal0, rnd.z * 0.85);
        col += sgn * sm * mix(glyph, 0.6, aa) * fl * 3.4 * blown;
        col += sgn * sm * 0.4 * blown;
      }
    }
    // the street lamps reach the lower floors
    if (p.y < 46.0) col += lampLight(p, clamp(blown + flare * 0.5, 0.0, 2.0)) * mix(uPal1, uPal0, 0.3) * 0.22 * max(1.0 - n.y, 0.15);
    // Every fireball is a light: the facades turned toward it burn. The term is
    // PURELY directional and carries no ambient share at all — the smallest
    // floor here is a floor under every wall in frame, and with a deck standing
    // it lifted the whole city to a flat mid grey and took the blacks with it.
    // A wall turned away from every fireball stays unlit however many stand.
    vec3 fireCol = mix(uPal1, uPal0, 0.45);
    float face = roof ? 0.75 : clamp(n.x * fireDir.x + n.z * fireDir.y, 0.0, 1.0);
    col += fireCol * fireLit * 0.16 * face * face * grain;
    // the front: a hard white edge as it arrives, glass glittering behind it
    col += mix(uPal0, vec3(1.0), 0.6) * flare * (0.05 + key * 0.14);
    col += vec3(1.0) * glint * (0.15 + lum) * 0.5 * near;
    col *= 1.0 - scorch * 0.6;
    return col;
  }

  // ---- the ground: asphalt, kerbs, markings, wet reflection
  vec3 shadeGround(vec3 ro, vec3 rd, vec3 p, float dist, float blown, float flare, float glint, float scorch, float fireLit) {
    // the ground faces every fireball equally, so it takes the sum as it comes
    ivec2 c = ivec2(floor(p.xz / CELLF + 0.5));
    bool street = lotStreet(c);
    vec2 lc = p.xz - vec2(c) * CELLF;                 // position inside the lot
    float kerb = 1.0 - smoothstep(0.35, 0.7, min(CELLF * 0.5 - abs(lc.x), CELLF * 0.5 - abs(lc.y)));
    float gn = 0.75 + 0.5 * vnoise2(p.xz * 0.7);
    float wet = uRain * smoothstep(0.34, 0.66, fbm2b(p.xz * 0.035 + 3.1));
    vec3 col;
    vec3 tar = grey(uPal4, 0.85);
    if (street) {
      vec3 asphalt = tar * 0.019 * gn;
      float centre = 1.0 - smoothstep(0.10, 0.22, abs(p.x));
      float lane = step(0.5, fract(-p.z / 9.0)) * (1.0 - smoothstep(0.10, 0.2, abs(abs(p.x) - 7.5)));
      float edge = 1.0 - smoothstep(0.12, 0.26, abs(abs(p.x) - 13.6));
      float onBlvd = c.x == 0 ? 1.0 : 0.0;
      vec3 paint = mix(tar, vec3(1.0), 0.8) * 0.10 * onBlvd;
      col = asphalt + paint * (centre * 0.8 + lane + edge * 0.5);
    } else {
      col = mix(tar, vec3(1.0), 0.16) * 0.026 * gn + mix(tar, vec3(1.0), 0.3) * kerb * 0.020;
    }
    float lampOn = clamp(blown + flare * 0.5, 0.0, 2.0);
    col += lampLight(p, lampOn) * mix(uPal1, uPal0, 0.25) * 0.62 * gn * (0.55 + wet * 0.8);
    col += grey(mix(uPal4, uPal1, 0.5), 0.5) * 0.008 * gn;   // the overcast bouncing back down
    col += mix(uPal1, uPal0, 0.45) * fireLit * 0.055 * gn;
    // wet asphalt: a second, shorter trace of the reflected ray, torn up
    // vertically so it smears the way a wet road smears
    #if REF_STEPS > 0
    // the blend weight decides whether the second trace is worth taking at all:
    // a steep look at the road reflects almost nothing, and tracing the city
    // again to multiply it by two per cent is the pavement act's worst bargain
    float fr = 1.0 - max(-rd.y, 0.0);
    float fr2 = fr * fr;
    float fres = 0.06 + 0.94 * fr2 * fr2 * fr;
    float kw = clamp(wet * fres * 2.2, 0.0, 0.62) * (1.0 - smoothstep(110.0, 170.0, dist));
    if (kw > 0.015) {
      vec3 rr = reflect(rd, vec3(0.0, 1.0, 0.0));
      float rough = 0.035 + 0.05 * (1.0 - wet);
      rr.y += rough * (vnoise2(p.xz * vec2(1.9, 0.16) + uTime * 0.4) - 0.5) * 2.0;
      rr = normalize(rr);
      vec3 rn; ivec2 rc; int rl;
      float rt = traceCity(p + vec3(0.0, 0.02, 0.0), rr, 260.0, REF_STEPS, rn, rc, rl);
      vec3 refl = grey(mix(uPal4, uPal1, 0.45), 0.55) * 0.05;
      if (rt > 0.0) refl = mix(shadeFacadeLite(p + rr * rt + vec3(0.0, 0.02, 0.0), rn, rc, rl, dist + rt, blown), refl, clamp(rt / 260.0, 0.0, 0.7));
      col = mix(col, col * 0.7 + refl * 0.9, kw);
    }
    #endif
    // long lamp streaks in the film of water. The grain does not depend on
    // which lamp is throwing the streak, so it is sampled once and not six
    // times, and a lamp more than twenty metres across the road contributes a
    // number with twenty zeroes after the point.
    float k0 = floor((-p.z - ${-LAMP_Z0}.0) / ${LAMP_DZ}.0);
    float grainS = 0.7 + 0.5 * vnoise2(vec2(p.x * 2.4, p.z * 0.12));
    float streak = 0.0;
    for (int i = -1; i <= 1; i++) {
      float k = clamp(k0 + float(i), 0.0, ${LAMPS - 1}.0);
      float lz = ${LAMP_Z0}.0 - ${LAMP_DZ}.0 * k;
      for (int s = 0; s < 2; s++) {
        vec3 lp = vec3(s == 0 ? -${LAMP_X}.0 : ${LAMP_X}.0, ${LAMP_H.toFixed(2)}, lz);
        float dx = p.x - lp.x;
        float dz = p.z - lp.z;
        if (dx * dx > 220.0 || dz > 0.0) continue;
        streak += lampOn * exp(-dx * dx * 0.06 + dz * 0.055) * grainS;
      }
    }
    col += mix(uPal1, vec3(1.0), 0.35) * streak * wet * 0.15;
    col += mix(uPal0, vec3(1.0), 0.6) * flare * 0.05;
    col *= 1.0 - scorch * 0.7;
    // dust torn up along each front where it crosses the ground
    float dustSum = 0.0;
    for (int i = 0; i < MAX_CLOUDS; i++) {
      if (i >= uNCloud) break;
      vec4 A = uCloudA[i];
      float d = length(p.xz - A.xy);
      float rs = uCloudB[i].x;
      float m = smoothstep(A.w * 2.2, 0.0, abs(d - rs)) * smoothstep(30.0, 4.0, A.z);
      if (m > 0.01) dustSum += m * fbm2(p.xz * 0.02 + A.z);
    }
    col = mix(col, mix(uPal4, uPal1, 0.35) * 0.10, clamp(dustSum * 0.8, 0.0, 0.75));
    return col;
  }

  // ---- sky: a low overcast lit from beneath by the city, stars through the gaps
  vec3 skyCol(vec3 rd) {
    float up = max(rd.y, 0.0);
    vec3 col = mix(uPal4, uPal1, 0.55) * 0.075 * exp(-up * 5.0);
    float deck = fbm2b(vec2(rd.x, rd.z) / max(up + 0.09, 0.10) * 0.5 + 11.0);
    col += mix(uPal1, uPal4, 0.5) * smoothstep(0.30, 0.80, deck) * 0.085 * exp(-up * 1.9);
    vec3 sc3 = rd * 110.0;
    vec3 sf = fract(sc3) - 0.5;
    col += vec3(1.0) * step(0.9955, h31(floor(sc3))) * exp(-dot(sf, sf) * 40.0) * 0.35 * smoothstep(0.10, 0.6, rd.y) * (1.0 - smoothstep(0.25, 0.7, deck));
    return col;
  }

  // ================================================================ the cloud
  float sdTorus(vec3 p, float R, float r) { return length(vec2(length(p.xz) - R, p.y)) - r; }
  float sdEllipsoid(vec3 p, vec3 r) { float k0 = length(p / r); float k1 = length(p / (r * r)); return k0 * (k0 - 1.0) / max(k1, 1e-5); }
  float sdCapCyl(vec3 p, float h, float r) { vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h); return min(max(d.x, d.y), 0.0) + length(max(d, 0.0)); }
  float smin(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0); return mix(b, a, h) - k * h * (1.0 - h); }

  // Everything about a cloud that does not depend on the point being sampled,
  // worked out ONCE per cloud per pixel. It used to be worked out again on
  // every step of every march — three exponentials and a page of arithmetic,
  // fifteen steps deep, for each of the three map calls a step can make, which
  // is a couple of hundred transcendentals a pixel spent on constants.
  struct Cloud {
    vec2 at;
    float age, sc, s, yc, Rc, rc, rs, carve, core, fire, ember, roll, drift, fade, fireL;
  };
  Cloud cloudPrep(vec4 A, vec4 B, vec4 C, vec4 D, vec4 E) {
    Cloud c;
    c.at = A.xy; c.age = A.z; c.sc = A.w;
    c.drift = B.y; c.fireL = B.z;
    c.yc = C.x; c.fade = C.z; c.s = C.w;
    c.Rc = D.x; c.rc = D.y; c.rs = D.z; c.carve = D.w;
    c.core = E.x; c.fire = E.y; c.ember = E.z; c.roll = E.w;
    return c;
  }
  // The cloud without its noise: the cap ellipsoid, its rim torus, the stem and
  // the base bell, blended. This is a real signed distance to the solid, which
  // is what lets the march stride across empty sky instead of walking it.
  float cloudSolid(vec3 p, Cloud c) {
    vec3 pc = p - vec3(0.0, c.yc, 0.0);
    float dCap = sdEllipsoid(pc, vec3(c.Rc + c.rc, c.rc * 1.45, c.Rc + c.rc));
    float dRim = sdTorus(pc - vec3(0.0, -c.rc * 0.25, 0.0), c.Rc + c.rc * 0.5, c.rc * 0.85);
    float stemR = c.rs * (1.0 + 0.4 * (1.0 - clamp(p.y / c.yc, 0.0, 1.0)));
    float dStem = sdCapCyl(p - vec3(0.0, c.yc * 0.5, 0.0), c.yc * 0.5, stemR);
    float dBell = sdTorus(pc - vec3(0.0, -c.rc * 1.3, 0.0), c.Rc * 1.1, c.rc * 0.3) + (1.0 - c.s) * c.sc;
    return min(smin(min(dCap, dRim), dStem, c.sc * 0.7), dBell);
  }
  // the fireball's own emission at p: hot core early, embers long after
  float cloudHeat(vec3 pc, Cloud c) {
    float dCore = length(pc) / c.core;
    return (c.fire * exp(-dCore * dCore * 1.2) * 4.0 + c.ember * 0.45 * smoothstep(1.0, 0.2, dCore)) * c.fade;
  }
  // density at p, p already relative to this cloud's ground point; heat is the
  // emissive temperature and sd the distance to the solid the caller strides
  // on. The cap rolls about its core ring and the stem draws upward: both are
  // flows of the noise domain, not rotation of anything.
  float cloudMap(vec3 p, Cloud c, out float heat, out float sd) {
    vec3 pc = p - vec3(0.0, c.yc, 0.0);
    float d = cloudSolid(p, c);
    sd = d;
    // The noise can only carve so far off the solid, so a step this far outside
    // it is empty whatever the noise says — and it can leave before paying for
    // the roll and the two octaves. Most of a bound is empty space: this is
    // what makes the march affordable, and the distance it hands back is what
    // lets the next step jump the whole of it.
    heat = 0.0;
    if (d > 0.26 * c.carve) return 0.0;
    // The cap's toroidal roll, without an atan or a second sine in sight: the
    // azimuth's cosine and sine are p.xz/r already, and the poloidal angle is
    // advanced by the angle-addition identity from its own cosine and sine.
    float r = length(p.xz);
    float invR = 1.0 / max(r, 1e-4);
    float wc = smoothstep(c.yc - c.rc * 2.2, c.yc - c.rc * 0.8, p.y);
    float ex = r - c.Rc, ey = pc.y;
    float rho = sqrt(ex * ex + ey * ey);
    float invRho = 1.0 / max(rho, 1e-4);
    float ct = ex * invRho, st = ey * invRho;
    float ang = c.roll * wc;
    float ca = cos(ang), sa = sin(ang);
    float rr = c.Rc + rho * (ct * ca - st * sa);
    vec3 pn = vec3(p.x * invR * rr, c.yc + rho * (st * ca + ct * sa), p.z * invR * rr);
    vec3 ps = mix(p - vec3(0.0, c.drift, 0.0), pn, wc) / c.sc;
    float n = fbm3c(ps * (1.15 + 0.6 * uMorph) + vec3(0.0, 0.0, 17.0));
    float dens = smoothstep(0.0, -0.65 * c.sc, d + (0.62 - n) * c.carve);
    heat = cloudHeat(pc, c);
    return dens * c.fade;
  }
  // Ray vs the cloud's bound. With one march per ray the bound has to be the
  // SHAPE and not a ball or a box around it: a sphere round a column three
  // hundred metres tall is mostly empty sky, and whichever bound the ray enters
  // first is the cloud it marches, so slack in the bound erases whatever stands
  // behind it — as a ball in soft patches, as a box in hard rectangles. So the
  // bound is a sphere on the cap unioned with a capped cylinder on the stem,
  // each carrying the margin the noise can carve past the solid.
  bool cloudSpan(vec3 ro, vec3 rd, Cloud c, float tMax, out float t0, out float t1, out float ang, out float depth) {
    float sc = c.sc, yc = c.yc, rc = c.rc, Rc = c.Rc, rs = c.rs;
    float slack = sc * (0.42 + 0.4 * uMorph);
    // the cap is a disc twice as wide as it is thick, so its bound is an
    // ellipsoid: a sphere round it is empty sky above and below, and empty sky
    // in the bound is a crescent bitten out of the cloud standing behind
    vec3 er = vec3(Rc + 1.4 * rc + slack, 1.55 * rc + slack, Rc + 1.4 * rc + slack);
    float Rcap = er.x;
    float Rstem = rs * 1.9 + slack;
    float tN = 1e9, tF = -1e9;
    vec3 oc = ro - vec3(c.at.x, yc, c.at.y);
    vec3 oe = oc / er, de = rd / er;
    float ae = dot(de, de);
    float be = dot(oe, de);
    float h = be * be - ae * (dot(oe, oe) - 1.0);
    if (h > 0.0) { h = sqrt(h); tN = (-be - h) / ae; tF = (-be + h) / ae; }
    float a2 = dot(rd.xz, rd.xz);
    if (a2 > 1e-6) {
      vec2 o2 = ro.xz - c.at;
      float b2 = dot(o2, rd.xz);
      float h2 = b2 * b2 - a2 * (dot(o2, o2) - Rstem * Rstem);
      if (h2 > 0.0) {
        h2 = sqrt(h2);
        float u0 = (-b2 - h2) / a2, u1 = (-b2 + h2) / a2;
        if (abs(rd.y) > 1e-5) {
          float ya = -ro.y / rd.y, yb = (yc + slack - ro.y) / rd.y;
          u0 = max(u0, min(ya, yb));
          u1 = min(u1, max(ya, yb));
        } else if (ro.y < 0.0 || ro.y > yc + slack) { u1 = u0 - 1.0; }
        if (u1 > u0) { tN = min(tN, u0); tF = max(tF, u1); }
      }
    }
    ang = 2.0 * Rcap / max(length(oc), 1.0);   // how much of the frame it fills
    depth = 0.0;
    if (tF <= max(tN, 0.0)) return false;
    t0 = max(tN, 0.0);
    t1 = min(tF, tMax);
    depth = (t1 - t0) / (2.0 * Rcap);          // how squarely the ray goes through
    return t1 > t0;
  }
  // steps in proportion to that: a burst two blocks wide on the far side of the
  // city does not deserve the same march as the column standing over the eye
  int cloudSteps(float ang, float k) {
    return int(clamp(float(CLOUD_STEPS) * k * min(1.0, ang * 1.9), 7.0, float(CLOUD_STEPS)));
  }
  // one cloud, front to back, carrying the running transmittance. The step is
  // the shorter of the ray's own budget and the distance to the solid: inside
  // the cloud it walks, and across the empty two thirds of the bound it strides,
  // so a bound that fills the frame no longer costs the frame. That stride is
  // what pays for a deck standing at once.
  void marchCloud(vec3 ro, vec3 rd, Cloud c, float t0, float t1, int steps, inout vec3 acc, inout float T) {
    float sc = c.sc, yc = c.yc;
    vec3 base = vec3(c.at.x, 0.0, c.at.y);
    float stepLen = (t1 - t0) / float(steps);
    float t = t0 + stepLen * h31(rd * 100.0 + uTime);
    vec3 lightPos = base + vec3(0.0, yc, 0.0);
    vec3 ash = grey(mix(uPal4, vec3(1.0), 0.34), 0.45);
    float fireL = c.fireL;
    vec3 fireTint = mix(uPal1, vec3(1.0), 0.3);
    vec3 cityTint = mix(uPal1, uPal0, 0.25);
    float skip = 0.26 * c.carve;
    for (int i = 0; i < CLOUD_STEPS; i++) {
      if (i >= steps || T < 0.06 || t > t1) break;
      vec3 p = ro + rd * t - base;
      float heat, sd;
      float dens = cloudMap(p, c, heat, sd);
      if (dens > 0.004) {
        // the two lighting probes are the expensive part: a wisp gets the
        // average instead, and only real density pays for them
        float lit = 0.55, du = 0.55;
        if (dens > 0.055) {
          vec3 toL = normalize(lightPos - (p + base));
          float hp, hs;
          lit = exp(-cloudMap(p + toL * sc * 0.7, c, hp, hs) * 2.2);
          du = cloudMap(p + vec3(0.0, sc * 0.85, 0.0), c, hp, hs);
        }
        float dist = length(lightPos - (p + base)) / sc;
        float fl = fireL / (1.0 + dist * dist * 0.35);
        // the overcast from above (the up-probe is the self-shadow that gives
        // the cap its form), the city's glow from below, the fireball within
        float sky = 0.14 + 0.55 * exp(-du * 2.4);
        float city = 0.40 * smoothstep(yc * 0.9, 0.0, p.y) * uCityFade;
        vec3 emit = mix(uPal1, uPal0, clamp(heat * 0.5, 0.0, 1.0)) * heat;
        vec3 col = emit + ash * (fl * lit * fireTint + sky) + cityTint * city;
        float al = 1.0 - exp(-dens * stepLen * 2.6 / sc);
        acc += T * col * al;
        T *= 1.0 - al;
      }
      t += max(stepLen, (sd - skip) * 0.9);
    }
  }
  // A cloud the ray could afford to bound but not to march still has to stand
  // where it stands. This is the same body with the noise left off: the solid
  // sampled once across the ray's span, shaded with the cloud's own average
  // light. It reads as an under-detailed mass at the back of a deck — which is
  // what it is — instead of the straight-edged hole a dropped cloud leaves. The
  // coarse clouds composite behind the marched ones; they ranked worse because
  // the ray entered them later or only clipped them, so behind is where they
  // almost always are.
  void coarseCloud(vec3 ro, vec3 rd, Cloud c, float t0, float t1, inout vec3 acc, inout float T) {
    if (T < 0.03) return;
    vec3 base = vec3(c.at.x, 0.0, c.at.y);
    vec3 p = ro + rd * ((t0 + t1) * 0.5) - base;
    float d = cloudSolid(p, c);
    float dens = smoothstep(0.0, -0.55 * c.sc, d + 0.10 * c.carve) * c.fade;
    if (dens < 0.004) return;
    float al = 1.0 - exp(-dens * (t1 - t0) * 1.5 / c.sc);
    vec3 ash = grey(mix(uPal4, vec3(1.0), 0.34), 0.45);
    float heat = cloudHeat(p - vec3(0.0, c.yc, 0.0), c);
    float fireL = c.fireL * 0.6;
    vec3 emit = mix(uPal1, uPal0, clamp(heat * 0.5, 0.0, 1.0)) * heat;
    vec3 col = emit + ash * (0.42 + fireL * 0.35) + mix(uPal1, uPal0, 0.25) * 0.22 * uCityFade;
    acc += T * col * al;
    T *= 1.0 - al;
  }

  // ================================================================ the world
  vec3 cityWorld(vec3 ro, vec3 rd, vec2 uv) {
    // the front bends the ray before anything is traced
    float bImp = length(cross(vec3(${GZ_X}.0, 0.0, ${GZ_Z}.0) - ro, rd));
    float band = 0.0, lip = 0.0;
    vec3 oc = ro - vec3(${GZ_X}.0, 0.0, ${GZ_Z}.0);
    if (uBlastAge >= 0.0 && dot(oc, oc) > uBlastR * uBlastR) {
      float b = dot(oc, rd);
      float h = b * b - (dot(oc, oc) - uBlastR * uBlastR);
      if (h > 0.0) {
        float tIn = -b - sqrt(h);
        if (tIn > 0.0) {
          vec3 nIn = normalize(oc + rd * tIn);
          float gz = 1.0 - abs(dot(nIn, rd));
          float graze = gz * gz;
          rd = normalize(rd + nIn * 0.085 * graze * (0.6 + 0.5 * uBlastMorph));
          float w = uBlastR * 0.030;
          float c1 = sqrt(max(uBlastR * uBlastR - bImp * bImp, 0.0));
          float c2 = sqrt(max((uBlastR - w) * (uBlastR - w) - bImp * bImp, 0.0));
          band = clamp((c1 - c2) / (w * 4.0), 0.0, 1.0) * smoothstep(0.1, 0.5, uBlastAge) * exp(-max(uBlastAge - 0.5, 0.0) / 2.2);
          float lw = (bImp - uBlastR) / (uBlastR * 0.022);
          lip = exp(-lw * lw);
        }
      }
    }

    float tg = rd.y < -1e-4 ? -ro.y / rd.y : -1.0;
    float tLimit = tg > 0.0 ? min(tg, CFAR) : CFAR;
    vec3 nrm; ivec2 hc; int hlvl;
    float tB = traceCity(ro, rd, tLimit, CITY_STEPS, nrm, hc, hlvl);
    float tOpaque = tB > 0.0 ? tB : (tg > 0.0 && tg < CFAR ? tg : CFAR);
    vec3 pHit = ro + rd * min(tOpaque, 900.0);
    float blown, flare, glint, scorch, fireLit; vec2 fireDir;
    frontAt(pHit.xz, blown, flare, glint, scorch, fireLit, fireDir);
    vec3 col;
    if (tB > 0.0) col = shadeFacade(ro + rd * tB, nrm, hc, hlvl, tB, blown, flare, glint, scorch, fireLit, fireDir);
    else if (tg > 0.0 && tg < CFAR) col = shadeGround(ro, rd, ro + rd * tg, tg, blown, flare, glint, scorch, fireLit);
    else col = skyCol(rd);

    // fog: an exponential height layer, banded, integrated along the ray
    float Hf = 90.0;
    float dens = uFogD * (0.5 + 1.1 * fbm2b((ro.xz + rd.xz * min(tOpaque, 400.0) * 0.5) * 0.0022 + uTime * 0.01));
    float ky = rd.y;
    float I = abs(ky) < 1e-4
      ? dens * exp(-ro.y / Hf) * min(tOpaque, CFAR)
      : dens * Hf / ky * (exp(-ro.y / Hf) - exp(-(ro.y + ky * min(tOpaque, CFAR)) / Hf));
    float fog = 1.0 - exp(-max(I, 0.0));
    vec3 fogCol = grey(mix(uPal4, uPal1, 0.45), 0.55) * 0.075;
    col = mix(col, fogCol, clamp(fog, 0.0, 0.96));
    col += lampAir(ro, rd, min(tOpaque, 420.0), clamp(blown + flare * 0.5, 0.0, 2.0)) * (0.35 + uStreet * 0.9);

    // The clouds this ray marches, ranked by where it enters their bounds. Two
    // are marched on med and high and one on low: every extra call to cloudMap
    // that the compiler inlines costs the WHOLE shader its occupancy — a second
    // march measured 2.4 ms a frame at 1080p even on frames where no ray took
    // it. A deck of six or eight will not fit in two marches, so every cloud
    // past the second is composited coarsely instead of dropped.
    int i0 = -1, i1 = -1;
    float a0 = 1e9, a1 = 1e9, b0v = 0.0, b1v = 0.0, g0 = 0.0, g1 = 0.0;
    float k0 = 1e18, k1 = 1e18;
    Cloud c0, c1;
    vec3 cAcc = vec3(0.0);
    float cT = 1.0;
    for (int i = 0; i < MAX_CLOUDS; i++) {
      if (i >= uNCloud) break;
      Cloud c = cloudPrep(uCloudA[i], uCloudB[i], uCloudC[i], uCloudD[i], uCloudE[i]);
      float s0, s1, ang, depth;
      if (!cloudSpan(ro, rd, c, tOpaque, s0, s1, ang, depth)) continue;
      // A cloud the ray only clips is ranked behind every cloud it goes
      // squarely through. Without that a near cloud's grazed limb claims the
      // ray, contributes almost nothing, and the cloud standing behind it is
      // shaded coarsely — which reads as a notch bitten out of it.
      float key = s0 + (depth < 0.22 ? 1e6 : 0.0);
      if (key < k0) {
        #if MARCH2
        if (i1 >= 0) coarseCloud(ro, rd, c1, a1, b1v, cAcc, cT);
        i1 = i0; k1 = k0; a1 = a0; b1v = b0v; g1 = g0; c1 = c0;
        #else
        if (i0 >= 0) coarseCloud(ro, rd, c0, a0, b0v, cAcc, cT);
        #endif
        i0 = i; k0 = key; a0 = s0; b0v = s1; g0 = ang; c0 = c;
      }
      #if MARCH2
      else if (key < k1) {
        if (i1 >= 0) coarseCloud(ro, rd, c1, a1, b1v, cAcc, cT);
        i1 = i; k1 = key; a1 = s0; b1v = s1; g1 = ang; c1 = c;
      }
      #endif
      else {
        coarseCloud(ro, rd, c, s0, s1, cAcc, cT);
      }
    }
    vec3 acc = vec3(0.0);
    float T = 1.0;
    #if MARCH2
    // two marches composite front to back, whatever the rank said
    if (i1 >= 0 && a1 < a0) {
      Cloud ct = c0; c0 = c1; c1 = ct;
      float tf = a0; a0 = a1; a1 = tf;
      tf = b0v; b0v = b1v; b1v = tf;
      tf = g0; g0 = g1; g1 = tf;
      int ti = i0; i0 = i1; i1 = ti;
    }
    #endif
    if (i0 >= 0) marchCloud(ro, rd, c0, a0, b0v, cloudSteps(g0, 1.0), acc, T);
    #if MARCH2
    if (i1 >= 0) marchCloud(ro, rd, c1, a1, b1v, cloudSteps(g1, 0.55), acc, T);
    #endif
    col = (col * cT + cAcc) * T + acc;

    // Every fireball throws its own glow into the air — and it is the AIR it
    // lifts. A flat add put a share of every fireball on every facade in frame,
    // and a salvo handed back a grey city instead of a noir one lit from four
    // directions at once, so the term rides the ray's own fog integral: a wall
    // thirty metres off has almost no air in front of it and takes almost none
    // of this, while the haze between the eye and the cloud takes all of it.
    float glowSum = 0.0;
    for (int i = 0; i < MAX_CLOUDS; i++) {
      if (i >= uNCloud) break;
      float amp = uCloudC[i].y;              // the fireball's brightness, from the CPU
      if (amp < 0.0008) continue;
      vec4 A = uCloudA[i];
      vec3 cr = cross(vec3(A.x, uCloudC[i].x, A.y) - ro, rd);
      float r2 = A.w * A.w * 5.0;
      glowSum += amp * r2 / (r2 + dot(cr, cr));
    }
    col += mix(uPal1, uPal0, 0.6) * min(glowSum, 2.0) * (0.07 + 0.93 * clamp(fog, 0.0, 1.0));

    // ground zero's own front: the dust wall, the fireball dome, the shell
    if (uBlastAge >= 0.0) {
      vec3 GZ = vec3(${GZ_X}.0, 0.0, ${GZ_Z}.0);
      vec2 oc2 = ro.xz - GZ.xz;
      float bq = dot(oc2, rd.xz);
      float cq = dot(oc2, oc2) - uBlastR * uBlastR;
      float aq = dot(rd.xz, rd.xz);
      float hq = bq * bq - aq * cq;
      if (hq > 0.0 && aq > 1e-5) {
        float tw = (-bq - sqrt(hq)) / aq;
        if (tw < 0.0) tw = (-bq + sqrt(hq)) / aq;
        if (tw > 0.0 && tw < tOpaque) {
          vec3 pw = ro + rd * tw;
          if (pw.y > 0.0 && pw.y < uDustH) {
            float dn = fbm3(vec3(pw.x * 0.05, pw.y * 0.06 - uBlastAge * 0.6, pw.z * 0.05));
            float op = smoothstep(0.22, 0.6, dn) * smoothstep(uDustH, uDustH * 0.45, pw.y);
            float crest = smoothstep(uDustH * 0.25, uDustH * 0.9, pw.y);
            // dark and neutral at the foot, fire-lit along the crest
            vec3 dustCol = mix(grey(uPal4, 0.6) * 0.055, mix(uPal1, uPal0, 0.35) * (0.16 + uBlastFire * 0.55), crest);
            col = mix(col, dustCol, clamp(op * 1.1, 0.0, 0.86));
          }
        }
      }
      col += grey(mix(uPal2, vec3(1.0), 0.7), 0.45) * band * 0.16;
      col += grey(mix(uPal2, vec3(1.0), 0.6), 0.35) * lip * 0.22;
    }

    // rain in two slanted layers, and the dust that sweeps the eye
    float r1 = h21(floor(vec2(uv.x * 130.0 + uv.y * 22.0, uv.y * 26.0 - uTime * 26.0)));
    float r2 = h21(floor(vec2(uv.x * 74.0 - uv.y * 15.0 + 31.0, uv.y * 15.0 - uTime * 15.0)));
    float rain = (step(0.986, r1) + step(0.991, r2) * 0.7) * uRain;
    col += mix(uPal2, vec3(1.0), 0.6) * rain * 0.09;
    // the dust that sweeps the eye, only while there is dust to sweep: eight
    // octaves of noise on every pixel of every frame was a millisecond spent
    // multiplying by zero
    if (uVeil > 0.002) {
      float veil = uVeil * fbm2(vec2(uv.x * 3.0 + uTime * 6.0, uv.y * 2.0 - uTime * 3.0));
      float streak = uVeil * fbm2(vec2(uv.x * 1.5 + uTime * 14.0, uv.y * 9.0));
      col = col * (1.0 - veil * 0.8) + mix(uPal4, uPal1, 0.4) * (veil * 0.42 + streak * 0.22) * (0.5 + uBlastFire * 0.5);
    }

    // steam standing off four gratings on the boulevard
    if (uStreet > 0.02) {
      for (int i = 0; i < 4; i++) {
        vec2 gp = vec2(i == 0 || i == 2 ? -11.0 : 11.0, -55.0 - 130.0 * float(i));
        vec2 d2 = ro.xz - gp;
        float aq2 = dot(rd.xz, rd.xz);
        float tc = -dot(d2, rd.xz) / max(aq2, 1e-5);
        if (tc > 1.0 && tc < tOpaque) {
          vec3 pp = ro + rd * tc;
          vec2 dg = pp.xz - gp;
          float r2q = dot(dg, dg);
          // the plume is gone by eleven metres out, so the fbm only runs where
          // there is a plume to shape
          float fall = exp(-r2q / 26.0) * smoothstep(13.0, 0.4, pp.y) * step(0.0, pp.y);
          if (fall > 0.004) {
            float amt = fall * smoothstep(0.25, 0.7, fbm3(vec3(pp.x * 0.22, pp.y * 0.16 - uTime * 0.42, pp.z * 0.22)));
            col += grey(mix(uPal4, uPal1, 0.5), 0.4) * amt * 0.40 * uStreet;
          }
        }
      }
    }
    return col;
  }

  void main() {
    vec2 uv = (vUv - 0.5) * 2.0;
    float aspect = uRes.x / uRes.y;
    vec3 rd = normalize(uCamFwd + uCamRight * (uv.x * uTanHalf * aspect) + uCamUp * (uv.y * uTanHalf));
    vec3 ro = uCamPos;
    vec3 col = vec3(0.0);
    float cityW = uActW.z + uActW.w;
    if (uActW.x > 0.002) col += colliderBg(ro, rd) * uActW.x;
    if (uActW.y > 0.002) col += fissionBg(ro, rd) * uActW.y;
    if (cityW > 0.002) col += cityWorld(ro, rd, uv) * cityW;
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
// heat) and aC = (rgb, blend) an explicit colour the instance is pulled toward,
// which is how a nucleon arrives holding the exact colour of the window it
// becomes rather than a ramp coordinate that only agrees with the city's window
// rule at the warm end. The solid mesh writes depth (nucleons occlude each
// other); the glow mesh is additive.
const SPH_VERT = /* glsl */ `
  in vec2 aQuad;
  in vec3 aPos;
  in vec4 aS;
  in vec4 aC;
  out vec2 vQ;
  out vec4 vC;
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
    vC = aC;
  }
`;
const SPH_FRAG_SOLID = /* glsl */ `
  ${GLSL_COMMON}
  uniform vec3 uPal0, uPal1, uPal2, uPal3, uPal4;
  uniform float uIntensity;
  in vec2 vQ;
  in vec4 vC;
  in float vA, vTint, vHeat;
  out vec4 fragColor;
  void main() {
    float r2 = dot(vQ, vQ);
    if (r2 > 1.0) discard;
    vec3 n = vec3(vQ, sqrt(1.0 - r2));
    vec3 L = vec3(-0.450428, 0.600571, 0.660628); // unit by construction
    float lit = max(dot(n, L), 0.0);
    float rr = 1.0 - n.z;
    float rim = rr * rr * sqrt(rr);
    vec3 base = mix(ramp(uPal0, uPal1, uPal2, uPal3, uPal4, vTint), vC.rgb, vC.a);
    float sp = max(dot(reflect(-L, n), vec3(0.0, 0.0, 1.0)), 0.0);
    float sp2 = sp * sp, sp4 = sp2 * sp2, sp8 = sp4 * sp4;
    float spec = sp8 * sp8 * sp8 * sp8 * sp8; // the 40th power, written out
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
  in vec4 vC;
  in float vA, vTint, vHeat;
  out vec4 fragColor;
  void main() {
    float r2 = dot(vQ, vQ);
    if (r2 > 1.0) discard;
    float prof = exp(-r2 * 3.5) * (1.0 - r2);
    vec3 col = mix(ramp(uPal0, uPal1, uPal2, uPal3, uPal4, vTint), vC.rgb, vC.a);
    col = mix(col, vec3(1.0), vHeat * 0.5 * exp(-r2 * 6.0));
    fragColor = vec4(col * prof * vA * uIntensity, 1.0);
  }
`;

// ---------------------------------------------------------- the lot grid on JS
// The same integer hash the shader runs, so the CPU knows exactly where every
// facade and every lit pane stands: that is what lets the nucleon cluster land
// on real windows instead of dissolving into an unrelated picture.
const hu = (x) => {
  x = x >>> 0;
  x ^= x >>> 16; x = Math.imul(x, 0x7feb352d) >>> 0;
  x ^= x >>> 15; x = Math.imul(x, 0x846ca68b) >>> 0;
  x ^= x >>> 16;
  return x >>> 0;
};
const hf = (x) => (hu(x) & 0xffffff) / 16777216;
const lotKeyJS = (cx, cz, seed) => ((cx + 1024) * 4096 + (cz + 1024) + seed * 7919) >>> 0;
const lotStreetJS = (cx, cz) => (cx + 4100) % AV === 0 || (cz + 4100) % ST === 0;

// `lotOf` in full, not just its base height: a lot stands as up to three
// stacked masses, each with its own plan, its own offset off the lot centre and
// its own height band, and the deco tower's mass 0 tops out at 0.42 of its
// height with the two above it recessed. A JS copy that knows only the total
// height sends the cluster to panes that hang in the air in front of the
// setbacks — sixty-two per cent of that family's candidates — so it mirrors all
// three. out.b holds four floats per mass (half x, half z, y base, y top) and
// out.off two per mass (the plan offset).
function lotOfJS(cx, cz, seed, out) {
  const k = lotKeyJS(cx, cz, seed);
  const a = hu(k), b = hu((k ^ 0x9e3779b9) >>> 0);
  const r0 = (a & 255) / 255, r1 = ((a >>> 8) & 255) / 255, r2 = ((a >>> 16) & 255) / 255, r3 = (a >>> 24) / 255;
  const f = (b & 4095) / 4096;
  const g = ((b >>> 12) & 4095) / 4096;
  const fam = f < 0.17 ? 0 : f < 0.55 ? 1 : f < 0.73 ? 2 : 3;
  let hx = CELL * 0.5 - (3 + r0 * 4);
  let hz = CELL * 0.5 - (3 + r1 * 4);
  let ox = (r2 - 0.5) * 3, oz = (r3 - 0.5) * 3;
  if (Math.abs(cx) === 1) { hx -= 4; ox += cx > 0 ? 4 : -4; }
  const B = out.b, O = out.off;
  B.fill(0); O.fill(0);
  let H;
  if (fam === 0) {                 // deco setback tower
    H = 62 + g * 74;
    B[0] = hx; B[1] = hz; B[2] = 0; B[3] = H * 0.42;
    B[4] = hx * 0.74; B[5] = hz * 0.74; B[6] = H * 0.42; B[7] = H * 0.76;
    B[8] = hx * 0.46; B[9] = hz * 0.46; B[10] = H * 0.76; B[11] = H;
  } else if (fam === 1) {          // brick low-rise, water tank on the roof
    H = 13 + g * 23;
    B[0] = hx; B[1] = hz; B[2] = 0; B[3] = H;
    B[4] = 3.2; B[5] = 3.2; B[6] = H; B[7] = H + 6.5;
    O[2] = hx * 0.45; O[3] = -hz * 0.4;
  } else if (fam === 2) {          // glass slab, plant room and a mast
    hx *= 1.06; hz *= 0.60;
    H = 44 + g * 58;
    B[0] = hx; B[1] = hz; B[2] = 0; B[3] = H;
    B[4] = hx * 0.55; B[5] = hz * 0.75; B[6] = H; B[7] = H + 5.5;
    B[8] = 0.55; B[9] = 0.55; B[10] = H + 5.5; B[11] = H + 22;
    O[4] = hx * 0.32; O[5] = 0;
  } else {                         // warehouse block, roof vents
    H = 9 + g * 13;
    B[0] = hx; B[1] = hz; B[2] = 0; B[3] = H;
    B[4] = hx * 0.4; B[5] = hz * 0.34; B[6] = H; B[7] = H + 4;
    O[2] = -hx * 0.3; O[3] = hz * 0.22;
  }
  out.fam = fam;
  out.k = k;
  out.cx = cx * CELL + ox;
  out.cz = cz * CELL + oz;
  out.top = Math.max(B[3], B[7], B[11]);
  out.r[0] = r0; out.r[1] = r1; out.r[2] = r2; out.r[3] = r3;
  return out;
}

export function createScene(ctx) {
  const { THREE, quality } = ctx;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, ctx.width / Math.max(1, ctx.height), 0.4, 4000);
  const tier = quality.tier;
  const CLOUD_STEPS = tier === 'low' ? 11 : tier === 'high' ? 34 : 15;
  const CITY_STEPS = tier === 'low' ? 26 : tier === 'high' ? 72 : 34;
  const REF_STEPS = tier === 'low' ? 0 : tier === 'high' ? 22 : 7;
  const MAX_CLOUDS = tier === 'low' ? 4 : tier === 'high' ? 8 : 6;
  // A second inlined march costs the whole shader its occupancy — 2.5 ms a
  // frame at 1080p — but without it a cloud in front bites a crescent out of
  // the cloud behind, and clouds standing together is the point of the deck.
  // Med and high pay for it; low marches one and takes the coarse composite
  // for everything else.
  const MARCH2 = tier === 'low' ? 0 : 1;
  const SALVO_STEP = Math.max(1, Math.floor(16 / (MAX_CLOUDS - 1))); // the salvo's pitch across the deck

  // instance layout
  const N_CAPS_DET = DET_CAPS;
  const CAP_TRACK0 = N_CAPS_DET;
  const CAP_CALO0 = CAP_TRACK0 + TRACK_CAPS;
  const CAP_NEUT0 = CAP_CALO0 + MAX_TRACKS;
  const CAP_LAMP0 = CAP_NEUT0 + MAX_NEUTRONS;
  const CAP_RV0 = CAP_LAMP0 + LAMPS * 2;
  const N_CAPS = CAP_RV0 + MAX_RV * TRAIL_SEGS;
  const N_SOLID = NUCLEI * NUCLEONS;
  const GL_BUNCH0 = 0;
  const GL_HIT0 = 2;
  const GL_NEUT0 = GL_HIT0 + MAX_HITS;
  const GL_EMBER0 = GL_NEUT0 + MAX_NEUTRONS;
  const GL_RV0 = GL_EMBER0 + EMBERS;
  const GL_WIN0 = GL_RV0 + MAX_RV * 2;
  const GL_VERTEX = GL_WIN0 + N_SOLID;
  const N_GLOW = GL_VERTEX + 1;

  const pal5 = () => Array.from({ length: 5 }, () => ({ value: new THREE.Color(1, 1, 1) }));
  const wp = pal5(), cp = pal5(), sp = pal5(), gp = pal5();
  const palUniforms = (p) => ({ uPal0: p[0], uPal1: p[1], uPal2: p[2], uPal3: p[3], uPal4: p[4] });

  // --- the world quad -----------------------------------------------------------------
  const nucU = new Float32Array(NUCLEI * 4);
  const gammaU = new Float32Array(16);
  // The uniform side of the deck: five packed vec4 arrays, rebuilt from the
  // logical slots once a frame, holding only the clouds that stand.
  const cloudA = new Float32Array(MAX_CLOUDS * 4);
  const cloudB = new Float32Array(MAX_CLOUDS * 4);
  const cloudC = new Float32Array(MAX_CLOUDS * 4);
  const cloudD = new Float32Array(MAX_CLOUDS * 4);
  const cloudE = new Float32Array(MAX_CLOUDS * 4);
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
    uActW: { value: new THREE.Vector4(0, 0, 1, 0) },
    uVertexGlow: { value: 0 },
    uCollFlash: { value: 0 },
    uNuc: { value: nucU },
    uGamma: { value: gammaU },
    uGammaA: { value: new Float32Array(4) },
    uCitySeed: { value: 3 },
    uCityFade: { value: 1 },
    uWinFade: { value: 1 },
    uRain: { value: 0.45 },
    uFogD: { value: 0.0075 },
    uStreet: { value: 0 },
    uNCloud: { value: 1 },
    uCloudA: { value: cloudA },
    uCloudB: { value: cloudB },
    uCloudC: { value: cloudC },
    uCloudD: { value: cloudD },
    uCloudE: { value: cloudE },
    uMorph: { value: 0 },
    uPress: { value: 0 },
    uBlastAge: { value: -1 },
    uBlastR: { value: 0 },
    uBlastMorph: { value: 0 },
    uBlastFire: { value: 0 },
    uVeil: { value: 0 },
    uDustH: { value: 40 },
    ...palUniforms(wp),
  };
  const worldMat = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    uniforms: WU,
    defines: { CLOUD_STEPS, CITY_STEPS, REF_STEPS, MAX_CLOUDS, MARCH2 },
    vertexShader: /* glsl */ `
      out vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: WORLD_FRAG,
    depthTest: false,
    depthWrite: false,
  });
  worldMat.name = "mile-world";
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
  capMat.name = "mile-caps";
  const caps = new THREE.Mesh(capGeo, capMat);
  caps.frustumCulled = false;
  caps.renderOrder = 2;
  scene.add(caps);

  // spheres: solids (depth) and glows (additive)
  function sphereSystem(n, frag, pal, solid, order) {
    const geo = instancedQuad(sphUV);
    const pos = new Float32Array(n * 3);
    const s = new Float32Array(n * 4);
    const c = new Float32Array(n * 4);   // explicit colour, zero blend at rest
    const aPos = dyn(pos, 3), aS = dyn(s, 4), aC = dyn(c, 4);
    geo.setAttribute('aPos', aPos);
    geo.setAttribute('aS', aS);
    geo.setAttribute('aC', aC);
    geo.instanceCount = n;
    const U = { uIntensity: { value: 1 }, ...palUniforms(pal) };
    const mat = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3, uniforms: U, vertexShader: SPH_VERT, fragmentShader: frag,
      transparent: !solid, depthTest: solid, depthWrite: solid, side: THREE.DoubleSide,
      blending: solid ? THREE.NormalBlending : THREE.AdditiveBlending,
    });
    mat.name = solid ? "mile-solids" : "mile-glows";
    const mesh = new THREE.Mesh(geo, mat);
    mesh.frustumCulled = false;
    mesh.renderOrder = order;
    scene.add(mesh);
    return { geo, mat, mesh, pos, s, c, aPos, aS, aC, U };
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

  // --- embers ---------------------------------------------------------------------------
  const embX = new Float32Array(EMBERS), embY = new Float32Array(EMBERS), embZ = new Float32Array(EMBERS), embV = new Float32Array(EMBERS);
  for (let i = 0; i < EMBERS; i++) { embX[i] = (Math.random() - 0.5) * 90; embY[i] = Math.random() * 60; embZ[i] = -Math.random() * 200; embV[i] = 2.5 + Math.random() * 6; }

  // --- the windows the nucleons become --------------------------------------------------
  // Every lit pane on the facades that flank and face the atom, gathered from
  // the same hash the shader runs, then matched to the nucleons by direction so
  // the shell unfolds outward instead of scattering.
  const WIN_CAP = 9000;
  const winPool = new Float32Array(WIN_CAP * 3);
  const winPoolCt = new Float32Array(WIN_CAP);    // each pane's colour temperature
  const winDir = new Float32Array(WIN_CAP * 2);   // each window's place in the frame
  const winNuc = new Float32Array(NUCLEI * NUCLEONS * 2); // each nucleon's place in the frame
  const winUsed = new Uint8Array(WIN_CAP);
  const winTarget = new Float32Array(N_SOLID * 3);
  const winCt = new Float32Array(N_SOLID);
  const order = new Int32Array(N_SOLID);
  const rank = new Float32Array(N_SOLID);
  const lotRec = { fam: 0, k: 0, cx: 0, cz: 0, top: 0, b: new Float64Array(12), off: new Float64Array(6), r: [0, 0, 0, 0] };
  let winCount = 0;

  function gatherWindows(seed) {
    winCount = 0;
    const push = (x, y, z, ct) => {
      if (winCount >= WIN_CAP) return;
      winPool[winCount * 3] = x; winPool[winCount * 3 + 1] = y; winPool[winCount * 3 + 2] = z;
      winPoolCt[winCount] = ct;
      winCount++;
    };
    // one mass of one lot, one wall of it.
    //   axis 0: the plane is x = ccx + sign*halfX, u runs along z
    //   axis 1: the plane is z = ccz + sign*halfZ, u runs along x
    // Every number below is the shader's `windows()` verbatim — the pitch, the
    // lit fraction, the pane's place inside its cell, the height band it is
    // allowed to stand in, the on/off hash and the colour temperature. They
    // have to be, or the cluster lands on panes the city leaves dark and the
    // hand-off shows.
    const facade = (L, m, axis, sign) => {
      const B = L.b, off = L.off;
      const bz = B[m * 4 + 2], bw = B[m * 4 + 3];
      if (bw - bz <= 8) return;                     // the shader's own window gate
      const bx = B[m * 4], bzz = B[m * 4 + 1];
      if (bx < 0.05) return;
      const ccx = L.cx + off[m * 2], ccz = L.cz + off[m * 2 + 1];
      const r = L.r;
      let wx = 3.0 + r[0] * 1.5, wy = 3.3 + r[1] * 0.9;
      let litF = 0.03 + 0.5 * r[2] * r[2];
      let ct = r[3] * 0.5;
      if (L.fam === 2) { wx = 2.1 + r[0] * 0.7; wy = 3.1; litF = 0.10 + 0.55 * r[2] * r[2]; ct = 0.55 + r[3] * 0.45; }
      else if (L.fam === 3) { wx = 4.5 + r[0] * 2.0; wy = 4.2; litF = 0.03 + r[2] * 0.12; }
      const uc = axis === 0 ? ccz : ccx;
      const uh = axis === 0 ? bzz : bx;
      const plane = axis === 0 ? ccx + sign * bx : ccz + sign * bzz;
      const v00 = 1.6 + r[3] * 1.4;                 // the grid's own vertical origin
      const vLo = bz + 1.2, vHi = bw - 1.4;
      const u0 = Math.floor((uc - uh) / wx), u1 = Math.ceil((uc + uh) / wx);
      const v0 = Math.floor((vLo - v00) / wy), v1 = Math.ceil((vHi - v00) / wy);
      for (let iu = u0; iu <= u1; iu++) {
        const u = (iu + 0.51) * wx;                 // the pane sits at gu 0.24..0.78
        if (u < uc - uh + 0.6 || u > uc + uh - 0.6) continue;
        for (let iv = v0; iv <= v1; iv++) {
          const v = (iv + 0.41) * wy + v00;         // and at gv 0.18..0.64
          if (v < vLo + 0.2 || v > vHi - 0.2) continue;
          const wk = ((L.k * 131 + (iu + 512) * 17 + (iv + 512) * 71) >>> 0);
          const w1 = hu(wk);
          if ((w1 & 4095) / 4096 > litF) continue;
          // the shader spreads a pane's brightness over a decade; a nucleon that
          // lands on a desk lamp has landed on nothing, so only the panes that
          // read at this distance are candidates
          const bh = ((w1 >>> 12) & 4095) / 4096;
          if (0.06 + 0.95 * bh * bh * bh < 0.22) continue;
          // The glass slabs carry the densest grid and the highest lit
          // fraction, so left alone they are two thirds of everything the
          // cluster can land on and it resolves entirely in their cool light.
          // Thinning their share of the CANDIDATES (not of the city — every
          // pane skipped here still burns on the wall) hands the constellation
          // the skyline's own mix of warm and cool.
          if (L.fam === 2 && (w1 >>> 24) > 150) continue;
          // At the distance the cluster resolves at, a pane is under a pixel and
          // the shader has already folded the grid into its average, which uses
          // the building's own colour temperature and not the per-pane jitter —
          // so that is the number the point has to arrive holding.
          if (axis === 0) push(plane + sign * 0.3, v, u, ct);
          else push(u, v, plane + sign * 0.3, ct);
        }
      }
    };
    // Every lot down the canyon the cluster can reach. The pool wants to be
    // several times the nucleon count: the match is greedy and exclusive, and a
    // pool the size of the cluster leaves the last nucleons taking whatever is
    // left instead of the pane they belong on.
    const cz0 = Math.round(ATOM_Z / CELL);
    for (let cz = cz0 - 1; cz >= cz0 - 26; cz--) {
      for (let cx = -8; cx <= 8; cx++) {
        if (lotStreetJS(cx, cz)) continue;
        const L = lotOfJS(cx, cz, seed, lotRec);
        const side = Math.abs(cx) <= 5 && cz >= cz0 - 14;
        for (let m = 0; m < 3; m++) {
          facade(L, m, 1, 1); // the face turned toward the eye
          if (side) facade(L, m, 0, cx > 0 ? -1 : 1);
        }
      }
    }
    // Match each nucleon to a window by WHERE IT SITS IN THE FRAME, not by
    // where it sits in the world. The eye starts MATCH_A metres behind the atom
    // and ends at MATCH_B, both on the same line, so a nucleon's frame position
    // at the first station and its window's frame position at the second are
    // directly comparable: match them and the point crosses the move without
    // crossing the screen. The window field is scaled to BLOOM times the
    // cluster's own reach, so the shell opens outward a little as it resolves
    // while the pull-back pulls it back in — the two nearly cancel.
    const MATCH_A = 24, MATCH_B = 118, BLOOM = 1.7;
    const e2y = TDZ, e2z = -TDY;                  // the frame's up, perpendicular to the axis
    const c1 = [ATOM_X + TDX * MATCH_A, ATOM_Y + TDY * MATCH_A, ATOM_Z + TDZ * MATCH_A];
    const c2 = [ATOM_X + TDX * MATCH_B, ATOM_Y + TDY * MATCH_B, ATOM_Z + TDZ * MATCH_B];
    const frame = (px, py, pz, c, out) => {
      const vx = px - c[0], vy = py - c[1], vz = pz - c[2];
      const along = -(vy * TDY + vz * TDZ);
      if (along < 12) return false;
      out[0] = vx / along;
      out[1] = (vy * e2y + vz * e2z) / along;
      return true;
    };
    const fa = [0, 0], fb = [0, 0];
    let nMax = 0;
    for (let i = 0; i < N_SOLID; i++) {
      const n = (i / NUCLEONS) | 0, j = i % NUCLEONS;
      if (!frame(ATOM_X + latPos[n * 3] + nucBase[j * 3], ATOM_Y + latPos[n * 3 + 1] + nucBase[j * 3 + 1], ATOM_Z + latPos[n * 3 + 2] + nucBase[j * 3 + 2], c1, fa)) { rank[i] = 0; continue; }
      winNuc[i * 2] = fa[0]; winNuc[i * 2 + 1] = fa[1];
      rank[i] = fa[0] * fa[0] + fa[1] * fa[1];
      if (rank[i] > nMax) nMax = rank[i];
    }
    nMax = Math.sqrt(nMax) || 1;
    let keep = 0;
    const cone = nMax * BLOOM;
    for (let w = 0; w < winCount; w++) {
      if (!frame(winPool[w * 3], winPool[w * 3 + 1], winPool[w * 3 + 2], c2, fb)) continue;
      if (fb[0] * fb[0] + fb[1] * fb[1] > cone * cone) continue;
      winPool[keep * 3] = winPool[w * 3];
      winPool[keep * 3 + 1] = winPool[w * 3 + 1];
      winPool[keep * 3 + 2] = winPool[w * 3 + 2];
      winPoolCt[keep] = winPoolCt[w];
      winDir[keep * 2] = fb[0];
      winDir[keep * 2 + 1] = fb[1];
      keep++;
    }
    winCount = keep;
    if (winCount === 0) return;
    // the outermost nucleons claim first, so the silhouette survives the match
    for (let i = 0; i < N_SOLID; i++) order[i] = i;
    order.sort((a, b) => rank[b] - rank[a]);
    winUsed.fill(0, 0, winCount);
    for (let q = 0; q < N_SOLID; q++) {
      const idx = order[q];
      const ax = winNuc[idx * 2] * BLOOM, ay = winNuc[idx * 2 + 1] * BLOOM;
      let best = -1, bs = 1e9;
      for (let w = 0; w < winCount; w++) {
        if (winUsed[w]) continue;
        const dx = winDir[w * 2] - ax, dy = winDir[w * 2 + 1] - ay;
        const s = dx * dx + dy * dy;
        if (s < bs) { bs = s; best = w; }
      }
      if (best < 0) best = idx % winCount;
      winUsed[best] = 1;
      winTarget[idx * 3] = winPool[best * 3];
      winTarget[idx * 3 + 1] = winPool[best * 3 + 1];
      winTarget[idx * 3 + 2] = winPool[best * 3 + 2];
      winCt[idx] = winPoolCt[best];
    }
  }

  // --- clouds and re-entry vehicles -----------------------------------------------------
  // The logical deck: one slot per cloud, indexed as the scene thinks of them
  // (slot 0 is ground zero's), independent of where they land in the packed
  // uniform arrays.
  const cX = new Float32Array(MAX_CLOUDS), cZ = new Float32Array(MAX_CLOUDS);
  const cSc = new Float32Array(MAX_CLOUDS), cTau = new Float32Array(MAX_CLOUDS);
  const cFireS = new Float32Array(MAX_CLOUDS);   // how hard this yield's fireball burns
  const cYc = new Float32Array(MAX_CLOUDS);      // cap height, this frame
  const cFade = new Float32Array(MAX_CLOUDS);    // density, thinning at end of life
  const cAge = new Float32Array(MAX_CLOUDS).fill(-1);
  // Ground zero always stands: the resting subject of the act. It rests OLD —
  // the cloud is mature either way, but an old one has let the grid come back
  // on, so the city is lit at rest instead of blacked out by its own front.
  cAge[0] = 90;
  cFade[0] = 1;
  const cLife = new Float32Array(MAX_CLOUDS);
  const cSeq = new Float32Array(MAX_CLOUDS); // launch order, for eviction
  let cSeqNext = 1;
  const rvAlive = new Uint8Array(MAX_RV);
  const rvT = new Float32Array(MAX_RV);
  const rvDur = new Float32Array(MAX_RV);
  const rvFade = new Float32Array(MAX_RV);
  const rvYf = new Float32Array(MAX_RV);
  const rvSc = new Float32Array(MAX_RV);
  const rvNoise = new Float32Array(MAX_RV * TRAIL_SEGS);
  for (let i = 0; i < rvNoise.length; i++) rvNoise[i] = Math.random();
  const RV_VIS = 4;                              // visibility stations per vehicle
  const rvVis = new Float32Array(MAX_RV * RV_VIS).fill(1);
  const rvP0 = new Float32Array(MAX_RV * 3);
  const rvCP = new Float32Array(MAX_RV * 3);
  const rvTG = new Float32Array(MAX_RV * 3);
  const pv = new Float32Array(3), pv2 = new Float32Array(3);

  // pad index -> the place it lands. The deck is two rows of eight: the top row
  // is the far half of the city, the bottom row the near half, columns left to
  // right across the boulevard, each cell offset by a fixed amount of its own.
  const padX = new Float32Array(16), padZ = new Float32Array(16), padYf = new Float32Array(16);
  for (let i = 0; i < 16; i++) {
    const col = i & 7, row = i >> 3;
    padX[i] = ((col - 3.5) / 3.5) * PAD_SPREAD + (hf(i * 2654435761 + 11) - 0.5) * 74;
    padZ[i] = PAD_Z[row] + (hf(i * 40503 + 977) - 0.5) * 120;
    // Low note big, high note small — but the floor is set by the skyline, not
    // by the curve: a burst whose cap tops out under the rooftops is a flash on
    // a wall and nothing else. At 0.30 the highest note still stands a cloud
    // about a hundred and fifty metres up, and pad 0 is three and a third times
    // that in every dimension.
    padYf[i] = 0.30 + 0.70 * Math.pow(1 - i / 15, 1.35);
  }

  const bez = (i, u, out) => {
    const w0 = (1 - u) * (1 - u), w1 = 2 * u * (1 - u), w2 = u * u;
    for (let k = 0; k < 3; k++) out[k] = w0 * rvP0[i * 3 + k] + w1 * rvCP[i * 3 + k] + w2 * rvTG[i * 3 + k];
  };

  // --- state ------------------------------------------------------------------------------
  const approach = (v, to, tau, dt) => v + (to - v) * (1 - Math.exp(-dt / tau));
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const smooth01 = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) * 0.8;
  const camPos = new THREE.Vector3(0, ATOM_Y + TDY * CITY_DIST, ATOM_Z + TDZ * CITY_DIST);
  const camTarget = new THREE.Vector3(0, 20, -760);
  const wantPos = new THREE.Vector3();
  const wantTarget = new THREE.Vector3();
  const jetPhi = new Float32Array(3), jetTheta = new Float32Array(3);
  // the two ends of the city's window colour, refreshed from the palette
  const winWarm = new Float32Array(3), winCool = new Float32Array(3);
  const nucPh = new Float32Array(NUCLEONS * 3);
  for (let i = 0; i < NUCLEONS * 3; i++) nucPh[i] = Math.random() * 6.2831853;
  let act = 2;
  const actW = new Float32Array(4);
  actW[2] = 1;
  let k5Prev = null, k6Prev = null;
  let yieldTarget = 0.5, cloudScaleP = 1, placeP = 0;
  let transit = 1, transitTarget = 1;
  let citySeed = 3;
  let yieldS = 0.5, swayS = 0, pressS = 0, bass = 0, high = 0, pulse = 0, beatPrev = 0, flash = 0;
  let hx = 0.5, hy = 0.5;
  let vertexGlow = 0, collFlash = 0, bunchT = 0;
  let blastAge = -1, passAge = -1, veil = 0, shake = 0, emberA = 0;
  let cascadeFlash = 0;
  let salvoLeft = 0, salvoT = 0, salvoIdx = 0;
  let deckStand = 1;      // how much of the MIRV deck stands: out for the pull-back
  const padPrev = new Float32Array(16);

  gatherWindows(citySeed);

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
    gammaU[k * 4] = latPos[n * 3] + ATOM_X; gammaU[k * 4 + 1] = latPos[n * 3 + 1] + ATOM_Y; gammaU[k * 4 + 2] = latPos[n * 3 + 2] + ATOM_Z; gammaU[k * 4 + 3] = 0.5;
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
  function updateFission(dt, t, w, morphU) {
    for (let i = 0; i < MAX_NEUTRONS; i++) {
      const gi = GL_NEUT0 + i, ci = CAP_NEUT0 + i;
      if (!neutAlive[i]) { glows.s[gi * 4 + 1] = 0; capS[ci * 4 + 1] = 0; continue; }
      neutT[i] += dt / neutDur[i];
      const u = Math.min(neutT[i], 1);
      const o = i * 3;
      const x = neutFrom[o] + (neutTo[o] - neutFrom[o]) * u, y = neutFrom[o + 1] + (neutTo[o + 1] - neutFrom[o + 1]) * u, z = neutFrom[o + 2] + (neutTo[o + 2] - neutFrom[o + 2]) * u;
      const dx = neutTo[o] - neutFrom[o], dy = neutTo[o + 1] - neutFrom[o + 1], dz = neutTo[o + 2] - neutFrom[o + 2];
      const dl = Math.sqrt(dx * dx + dy * dy + dz * dz) + 1e-6;
      sph(glows, gi, x + ATOM_X, y + ATOM_Y, z + ATOM_Z, 0.17, w, 4.8, 1);
      cap(ci, x - (dx / dl) * 0.9 + ATOM_X, y - (dy / dl) * 0.9 + ATOM_Y, z - (dz / dl) * 0.9 + ATOM_Z, x + ATOM_X, y + ATOM_Y, z + ATOM_Z, 2.0, w * 0.7, 4.6, 1);
      if (neutT[i] >= 1) {
        neutAlive[i] = 0;
        const tgt = neutTarget[i];
        if (tgt >= 0 && (nPhase[tgt] === 0 || nPhase[tgt] === 4)) exciteNucleus(tgt);
      }
    }
    for (let k = 0; k < 4; k++) {
      if (gAge[k] < 0) { gammaU[k * 4 + 3] = 0; WU.uGammaA.value[k] = 0; continue; }
      gAge[k] += dt;
      gammaU[k * 4 + 3] = 0.6 + gAge[k] * 9;
      WU.uGammaA.value[k] = Math.exp(-gAge[k] / 0.45) * 1.2;
      if (gAge[k] > 1.3) { gAge[k] = -1; gammaU[k * 4 + 3] = 0; }
    }
    const rad = 0.23 * (1 - 0.3 * pressS);
    const squeeze = 1 - 0.3 * pressS;
    const jitAmp = 0.035 * (1 + swayS * 1.2 + pressS * 1.5);
    const jitRate = 7 + pressS * 6;
    // the pull-back: every nucleon travels to its window, staggered a little so
    // the shell peels instead of snapping
    const solidW = 1 - smooth01((morphU - 0.12) / 0.16);
    const glowW = smooth01((morphU - 0.06) / 0.14) * (1 - smooth01((morphU - 0.74) / 0.22));
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
      nucU[n * 4] = cx + ATOM_X; nucU[n * 4 + 1] = cy + ATOM_Y; nucU[n * 4 + 2] = cz + ATOM_Z; nucU[n * 4 + 3] = glow * w;
      for (let i = 0; i < NUCLEONS; i++) {
        const b = i * 3;
        const idx = n * NUCLEONS + i;
        let x = nucBase[b] * squeeze * grow, y = nucBase[b + 1] * squeeze * grow, z = nucBase[b + 2] * squeeze * grow;
        const ja = jitAmp * (ph === 1 ? 1 + e : 1);
        x += ja * Math.sin(t * jitRate + nucPh[b]);
        y += ja * Math.sin(t * (jitRate + 1.3) + nucPh[b + 1]);
        z += ja * Math.sin(t * (jitRate + 2.1) + nucPh[b + 2]);
        if (ph === 1 || ph === 2) {
          const d = x * ux + y * uy + z * uz - nOff[n];
          if (ph === 1) {
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
        let wx = cx + x + ATOM_X, wy2 = cy + y + ATOM_Y, wz = cz + z + ATOM_Z;
        let r = rad, mu = 0;
        const tint = nucType[i] ? 2.0 : 1.0;
        if (morphU > 0.001) {
          const stag = (((idx * 2654435761) >>> 8) & 255) / 255;
          mu = smooth01((morphU - 0.20 - stag * 0.06) / 0.42);
          wx += (winTarget[idx * 3] - wx) * mu;
          wy2 += (winTarget[idx * 3 + 1] - wy2) * mu;
          wz += (winTarget[idx * 3 + 2] - wz) * mu;
          r = rad + (0.9 - rad) * mu;
        }
        // The colour the point arrives holding is the shader's own window
        // expression at that pane's colour temperature — warm is palette 1
        // pulled 30 % to palette 0, cool is palette 2 lifted 30 % toward white
        // — and not a ramp coordinate walking 0 -> 1 -> 2. The two only agree at
        // the warm end; at the cool end the ramp handed back raw palette 2 where
        // the city lifts it, and the constellation resolved in a colour family
        // the windows under it do not use. That is the whole of the hand-off
        // this move exists to hide.
        const ct = winCt[idx];
        const cr = winWarm[0] + (winCool[0] - winWarm[0]) * ct;
        const cg = winWarm[1] + (winCool[1] - winWarm[1]) * ct;
        const cb = winWarm[2] + (winCool[2] - winWarm[2]) * ct;
        const qs = idx * 4, qg = (GL_WIN0 + idx) * 4;
        solids.c[qs] = cr; solids.c[qs + 1] = cg; solids.c[qs + 2] = cb; solids.c[qs + 3] = mu;
        glows.c[qg] = cr; glows.c[qg + 1] = cg; glows.c[qg + 2] = cb; glows.c[qg + 3] = mu;
        sph(solids, idx, wx, wy2, wz, r, alpha * fog * w * solidW, tint, nHeat[n]);
        sph(glows, GL_WIN0 + idx, wx, wy2, wz, r * 1.15, glowW * alpha * 1.0, tint, 0.35);
      }
    }
  }

  // --- the clouds ---------------------------------------------------------------------------
  // One law for every front: the radius the eye sees as a shell and the radius
  // that leaves the grid dark behind it are the same number.
  const ringR = (age, sc) => Math.min(sc * 45, sc * 9 * Math.pow(Math.max(age, 0), 0.7));
  const capHeightJS = (a, m, q, sc, tau) => sc * (1.5 + 9 * (1 - Math.exp(-a / tau))) * (1 + 0.35 * m) * (1 - 0.25 * q);
  const CLOUD_TAIL = 3.5; // seconds a cloud takes to thin out of the deck
  // Which slot a new burst takes. An empty one first; failing that the slot
  // furthest through its own life, NOT the one launched first — the deck runs
  // clouds of wildly different lifetimes side by side, and evicting by launch
  // order deletes a one-second-old fireball at its brightest while a minute-old
  // ash column stands next to it.
  function allocCloud() {
    for (let i = 1; i < MAX_CLOUDS; i++) if (cAge[i] < 0) return i;
    let worn = 1, bs = -1, bseq = 1e18;
    for (let i = 1; i < MAX_CLOUDS; i++) {
      const s = cAge[i] / Math.max(cLife[i], 0.001);
      if (s > bs || (s === bs && cSeq[i] < bseq)) { bs = s; bseq = cSeq[i]; worn = i; }
    }
    return worn;
  }
  function burst(slot, x, z, yf, vel) {
    const sc = CLOUD_U * yf * (0.55 + yieldTarget * 0.9) * cloudScaleP * (0.78 + vel * 0.35);
    cAge[slot] = 0;
    cLife[slot] = 8 + 58 * yf;
    cSeq[slot] = cSeqNext++;
    cX[slot] = x;
    cZ[slot] = z;
    cSc[slot] = Math.max(3, sc);
    cTau[slot] = 1.6 + 8 * yf;            // rise time: the big ones take ten seconds
    cFireS[slot] = 0.6 + yf * 1.1;
    cFade[slot] = 1;
    const dx = camPos.x - x, dz = camPos.z - z;
    const d = Math.sqrt(dx * dx + dz * dz + camPos.y * camPos.y);
    flash = Math.max(flash, clamp((sc * 26) / (110 + d), 0, 0.94));
    emberA = Math.max(emberA, clamp(0.35 + yf * 0.8, 0, 1) * clamp(700 / (200 + d), 0, 1));
    for (let i = 0; i < EMBERS; i++) {
      if (Math.random() > 0.35) continue;
      embX[i] = x + (Math.random() - 0.5) * sc * 5;
      embZ[i] = z + (Math.random() - 0.5) * sc * 5;
      embY[i] = Math.random() * sc * 3;
      embV[i] = 2 + Math.random() * 8;
    }
  }
  // ---- what the city and the deck hide -------------------------------------
  // The world quad writes no depth (it is a fullscreen analytic image, not a
  // surface), so nothing it draws can occlude the impostor meshes on its own,
  // and a vehicle diving at a target twenty-eight blocks away was painted flat
  // across the face of the tower in front of it. So the CPU asks the question
  // the depth buffer cannot: it runs the DDA's own lot grid from the eye to the
  // point and tests the same masses `lotOf` builds, then the same cap and stem
  // bounds the cloud march uses. One query per vehicle body and four along each
  // trail is nothing — sixteen vehicles at twenty lots apiece — and the answer
  // drives alpha, so a body passing behind a cornice fades instead of popping.
  const visRec = { fam: 0, k: 0, cx: 0, cz: 0, top: 0, b: new Float64Array(12), off: new Float64Array(6), r: [0, 0, 0, 0] };
  function visibleFrom(px, py, pz) {
    const ox = camPos.x, oy = camPos.y, oz = camPos.z;
    let dx = px - ox, dy = py - oy, dz = pz - oz;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (len < 1e-3) return 1;
    dx /= len; dy /= len; dz /= len;
    // the clouds first: they are few and the test is analytic
    for (let i = 0; i < MAX_CLOUDS; i++) {
      if (cAge[i] < 0 || cFade[i] < 0.05) continue;
      const cx = cX[i], cz = cZ[i], cy = cYc[i];
      const R = cSc[i] * 3.4;
      const wx = cx - ox, wy = cy - oy, wz = cz - oz;
      const b = wx * dx + wy * dy + wz * dz;
      if (b <= 0 || b >= len) continue;
      const perp = wx * wx + wy * wy + wz * wz - b * b;
      if (perp < R * R) return 0;
    }
    // then the block grid, one lot at a time along the ray
    let gx = ox / CELL + 0.5, gz = oz / CELL + 0.5;
    const rgx = dx / CELL, rgz = dz / CELL;
    let cx = Math.floor(gx), cz = Math.floor(gz);
    const sx = rgx >= 0 ? 1 : -1, sz = rgz >= 0 ? 1 : -1;
    const dlx = Math.abs(1 / (Math.abs(rgx) < 1e-7 ? 1e-7 : rgx));
    const dlz = Math.abs(1 / (Math.abs(rgz) < 1e-7 ? 1e-7 : rgz));
    let nx = ((cx + (sx > 0 ? 1 : 0)) - gx) / (Math.abs(rgx) < 1e-7 ? 1e-7 * sx : rgx);
    let nz = ((cz + (sz > 0 ? 1 : 0)) - gz) / (Math.abs(rgz) < 1e-7 ? 1e-7 * sz : rgz);
    let t0 = 0;
    for (let step = 0; step < 96; step++) {
      const t1 = Math.min(Math.min(nx, nz), len);
      if (!lotStreetJS(cx, cz)) {
        const ya = oy + dy * t0, yb = oy + dy * t1;
        const ylo = ya < yb ? ya : yb;
        if (ylo < H_MAX) {
          const L = lotOfJS(cx, cz, citySeed, visRec);
          if (ylo < L.top) {
            const yhi = ya < yb ? yb : ya;
            for (let m = 0; m < 3; m++) {
              const bx = L.b[m * 4];
              if (bx < 0.05 || L.b[m * 4 + 3] < ylo || L.b[m * 4 + 2] > yhi) continue;
              const ccx = L.cx + L.off[m * 2], ccz = L.cz + L.off[m * 2 + 1];
              const bzz = L.b[m * 4 + 1], b2 = L.b[m * 4 + 2], b3 = L.b[m * 4 + 3];
              // the slab test the shader runs, on the segment's own range,
              // written out three times rather than through a closure so the
              // frame allocates nothing
              let tn = t0, tf = t1, a, b, q;
              if (Math.abs(dx) < 1e-7) { if (ox < ccx - bx || ox > ccx + bx) tf = tn - 1; }
              else { a = (ccx - bx - ox) / dx; b = (ccx + bx - ox) / dx; if (a > b) { q = a; a = b; b = q; } if (a > tn) tn = a; if (b < tf) tf = b; }
              if (Math.abs(dy) < 1e-7) { if (oy < b2 || oy > b3) tf = tn - 1; }
              else { a = (b2 - oy) / dy; b = (b3 - oy) / dy; if (a > b) { q = a; a = b; b = q; } if (a > tn) tn = a; if (b < tf) tf = b; }
              if (Math.abs(dz) < 1e-7) { if (oz < ccz - bzz || oz > ccz + bzz) tf = tn - 1; }
              else { a = (ccz - bzz - oz) / dz; b = (ccz + bzz - oz) / dz; if (a > b) { q = a; a = b; b = q; } if (a > tn) tn = a; if (b < tf) tf = b; }
              if (tf > tn) return 0;
            }
          }
        }
      }
      if (t1 >= len) break;
      if (nx < nz) { nx += dlx; cx += sx; } else { nz += dlz; cz += sz; }
      t0 = t1;
    }
    return 1;
  }
  function launchRV(idx, vel) {
    let slot = -1;
    for (let i = 0; i < MAX_RV; i++) if (!rvAlive[i]) { slot = i; break; }
    if (slot < 0) { slot = 0; let bt = -1; for (let i = 0; i < MAX_RV; i++) if (rvT[i] > bt) { bt = rvT[i]; slot = i; } }
    const yf = padYf[idx];
    rvAlive[slot] = 1;
    rvT[slot] = 0;
    rvDur[slot] = 0.85 + 0.8 * yf;
    rvFade[slot] = 0;
    rvYf[slot] = yf;
    rvSc[slot] = clamp(vel, 0.2, 1);
    for (let k = 0; k < RV_VIS; k++) rvVis[slot * RV_VIS + k] = 1; // released above the skyline
    const tx = padX[idx], tz = padZ[idx];
    rvTG[slot * 3] = tx; rvTG[slot * 3 + 1] = 0; rvTG[slot * 3 + 2] = tz;
    // The bus's track runs in over the far end of the city, so the whole
    // descent is inside the frame: a shallow arc down the sky from beyond the
    // skyline, then the terminal dive. Each cell carries a fixed lateral place
    // in the spread, so a chord arrives as a fan.
    const fan = ((idx & 7) - 3.5) * 30;
    rvP0[slot * 3] = tx + fan; rvP0[slot * 3 + 1] = RV_ALT; rvP0[slot * 3 + 2] = tz - RV_RANGE;
    rvCP[slot * 3] = tx + fan * 0.25; rvCP[slot * 3 + 1] = RV_ALT * 0.5; rvCP[slot * 3 + 2] = tz - RV_RANGE * 0.18;
  }
  function updateRVs(dt) {
    for (let i = 0; i < MAX_RV; i++) {
      const g0 = GL_RV0 + i * 2, c0 = CAP_RV0 + i * TRAIL_SEGS;
      if (!rvAlive[i]) {
        glows.s[g0 * 4 + 1] = 0; glows.s[(g0 + 1) * 4 + 1] = 0;
        for (let k = 0; k < TRAIL_SEGS; k++) capS[(c0 + k) * 4 + 1] = 0;
        continue;
      }
      let u;
      let live = true;
      if (rvT[i] < rvDur[i]) {
        rvT[i] += dt;
        const s = clamp(rvT[i] / rvDur[i], 0, 1);
        u = 1 - Math.pow(1 - s, 1.42); // fast at altitude, decelerating in denser air
        if (rvT[i] >= rvDur[i]) {
          const slot = allocCloud();
          burst(slot, rvTG[i * 3], rvTG[i * 3 + 2], rvYf[i], rvSc[i]);
          rvFade[i] = 0.001;
        }
      } else {
        u = 1;
        live = false;
        rvFade[i] += dt;
        if (rvFade[i] > 1.4) {
          rvAlive[i] = 0;
          glows.s[g0 * 4 + 1] = 0; glows.s[(g0 + 1) * 4 + 1] = 0;
          for (let k = 0; k < TRAIL_SEGS; k++) capS[(c0 + k) * 4 + 1] = 0;
          continue;
        }
      }
      const heat = smooth01((u - 0.10) / 0.42);
      const dies = live ? 1 : Math.max(0, 1 - rvFade[i] / 1.4);
      bez(i, u, pv);
      // Four stations along the track carry the visibility for the whole
      // vehicle: the body takes the head's, and the trail interpolates between
      // them. Each is eased rather than switched, so a body crossing a cornice
      // dims through it instead of blinking.
      for (let k = 0; k < RV_VIS; k++) {
        const uv = Math.max(0, u - (k / (RV_VIS - 1)) * (TRAIL_SEGS - 1) * (0.017 + heat * 0.017));
        bez(i, uv, pv2);
        const vi = i * RV_VIS + k;
        rvVis[vi] = approach(rvVis[vi], visibleFrom(pv2[0], pv2[1], pv2[2]), 0.06, dt);
      }
      const body = (live ? 1 : 0) * rvVis[i * RV_VIS];
      // The body inside its plasma sheath. A vehicle released fifteen hundred
      // metres downrange is a two-metre object two kilometres off — under a
      // pixel, which is to say invisible for the first half of the flight. It
      // is an unresolved point source, so it is sized in ANGLE and not in
      // metres: a hard bright point from release that swells and brightens as
      // the air thickens, and the sheath around it likewise.
      const dcx = pv[0] - camPos.x, dcy = pv[1] - camPos.y, dcz = pv[2] - camPos.z;
      const dCam = Math.sqrt(dcx * dcx + dcy * dcy + dcz * dcz);
      sph(glows, g0, pv[0], pv[1], pv[2], dCam * (0.0072 + 0.0060 * heat), body * (0.8 + heat * 1.3), 4.97, 1);
      sph(glows, g0 + 1, pv[0], pv[1], pv[2], dCam * (0.013 + 0.030 * heat), body * (0.05 + heat * 0.26), 0.2, 1);
      const step = 0.017 + heat * 0.017;
      for (let k = 0; k < TRAIL_SEGS; k++) {
        const uA = u - k * step, uB = u - (k + 1) * step;
        if (uB < 0) { capS[(c0 + k) * 4 + 1] = 0; continue; }
        bez(i, uA, pv);
        bez(i, uB, pv2);
        const f = k / TRAIL_SEGS;
        const nz = rvNoise[i * TRAIL_SEGS + k];
        // the visibility of this stretch, read off the four stations
        const fv = (k / Math.max(1, TRAIL_SEGS - 1)) * (RV_VIS - 1);
        const fi = Math.min(RV_VIS - 2, fv | 0), ff = fv - fi;
        const vis = rvVis[i * RV_VIS + fi] + (rvVis[i * RV_VIS + fi + 1] - rvVis[i * RV_VIS + fi]) * ff;
        // the ablation trail: incandescent at the body, breaking into puffs and
        // dissipating behind it, white-hot cooling through to fire
        const a = Math.pow(1 - f, 1.7) * (0.55 + heat * 1.35) * (0.65 + nz * 0.7) * dies * vis;
        cap(c0 + k, pv[0], pv[1], pv[2], pv2[0], pv2[1], pv2[2],
          (1.2 + f * 4.6 + heat * 1.6) * (0.7 + nz * 0.6), a, 0.10 + f * 0.85, 1);
      }
    }
  }
  function updateClouds(dt, t) {
    for (let i = 0; i < MAX_CLOUDS; i++) {
      if (cAge[i] < 0) continue;
      cAge[i] += dt;
      if (i > 0 && cAge[i] > cLife[i]) { cAge[i] = -1; continue; }
      if (i === 0) cAge[i] = Math.min(cAge[i], 90);
    }
    // ground zero always stands; the yield knob keeps sizing it
    cX[0] = GZ_X;
    cZ[0] = GZ_Z;
    cSc[0] = Math.max(6, CLOUD_U * GZ_SCALE * (0.55 + yieldTarget * 0.9) * cloudScaleP);
    cTau[0] = 10.5;
    cFireS[0] = 1.6;
    // Everything the fragment shader needs about a cloud that does not depend
    // on the pixel — the front's radius, the fireball's brightness and its
    // light, the cap's height and radius, the stem, the carve depth, the flow
    // of the noise domain — computed here once, and packed so the shader's
    // loops run over the standing clouds and no further.
    const m = swayS, q = pressS;
    // THE DECK STANDS DOWN FOR THE PULL-BACK. The atom -> city move is the only
    // time the eye flies THROUGH the block the near row of the deck lands on —
    // it starts three hundred and forty-nine metres out from the atom and ends
    // five hundred and twenty back, and the near row stands between the two — so
    // for a second in the middle of it every pixel in the lower half of the
    // frame is inside a cloud, three hundred metres of bound deep. A column the
    // eye is standing inside is not readable at any step count and costs eleven
    // milliseconds a frame to say so. The move already carries the fission
    // lattice and the city at once; it does not also carry the deck. So the
    // MIRV clouds thin out the moment the move starts, stay out for as long as
    // it is running — a scrub parked mid-move is still mid-move — and stand
    // again over the second after it lands, ageing all the way through. Ground
    // zero, five hundred metres beyond where the move ends, never leaves.
    const deckW = deckStand;
    let n = 0;
    for (let i = 0; i < MAX_CLOUDS; i++) {
      const age = cAge[i];
      if (age < 0) { cFade[i] = 0; continue; }
      const sc = cSc[i], tau = cTau[i], fs = cFireS[i];
      // a cloud thins out of the deck over its last few seconds; it does not
      // wink out of the frame when its life runs out
      const fade = i === 0 ? 1 : clamp((cLife[i] - age) / CLOUD_TAIL, 0, 1) * deckW;
      cFade[i] = fade;
      if (fade < 0.02) continue;
      const s = smooth01((age - 0.084 * tau) / (2.116 * tau));
      const yc = capHeightJS(age, m, q, sc, tau);
      const fire = Math.exp(-age / (1.4 + 0.09 * sc));
      const fireAmp = fs * 3.2 * fire;
      const rate = clamp(16 / sc, 0.22, 1.7);
      cYc[i] = yc;
      const o = n * 4;
      cloudA[o] = cX[i]; cloudA[o + 1] = cZ[i]; cloudA[o + 2] = age; cloudA[o + 3] = sc;
      cloudB[o] = ringR(age, sc);
      cloudB[o + 1] = t * 0.9 * sc * rate;                       // the stem's updraft
      cloudB[o + 2] = (3.5 * Math.exp(-age / ((1.4 + 0.09 * sc) * 1.1)) + 0.35 * Math.exp(-age / (tau * 2))) * fs * fade;
      cloudB[o + 3] = fireAmp;
      cloudC[o] = yc;
      cloudC[o + 1] = (fireAmp + 0.22 * Math.exp(-age / (tau * 2)) * fs) * 0.55 * fade;
      cloudC[o + 2] = fade;
      cloudC[o + 3] = s;
      cloudD[o] = sc * (1.6 + 2.8 * s) * (1 - 0.3 * m) * (1 + 0.35 * q);
      cloudD[o + 1] = sc * (1.4 + 0.8 * s) * (1 - 0.35 * q);
      cloudD[o + 2] = sc * (0.62 + 0.85 * s) * (1 - 0.2 * m);
      cloudD[o + 3] = sc * (0.85 + 0.9 * m);
      cloudE[o] = sc * (1.6 + 1.6 * s);
      cloudE[o + 1] = fire;
      cloudE[o + 2] = Math.exp(-age / (tau * 2.6));
      cloudE[o + 3] = t * (0.30 + 0.5 * m) * rate;               // the cap's overturn
      n++;
    }
    WU.uNCloud.value = n;
  }

  // --- ground zero's front ------------------------------------------------------------------
  function detonate() {
    if (cAge[0] < 0) cAge[0] = 0;
    cAge[0] = 0;
    cSeq[0] = cSeqNext++;
    blastAge = 0;
    passAge = -1;
    flash = 1;
    emberA = 1;
    for (let i = 0; i < EMBERS; i++) {
      embX[i] = camPos.x + (Math.random() - 0.5) * 120;
      embZ[i] = camPos.z - Math.random() * 260;
      embY[i] = 6 + Math.random() * 70;
      embV[i] = 2 + Math.random() * 9;
    }
  }
  function updateShockwave(dt, t, w) {
    const sc0 = cSc[0];
    let rs = 0, fire = 0;
    if (blastAge >= 0) {
      blastAge += dt;
      rs = ringR(blastAge, sc0);
      fire = 3 * Math.exp(-blastAge / 2) + 0.3 * Math.exp(-blastAge / 10);
      const dCam = Math.sqrt((camPos.x - GZ_X) ** 2 + camPos.y * camPos.y + (camPos.z - GZ_Z) ** 2);
      if (passAge < 0 && rs >= dCam) { passAge = blastAge; shake = 1; emberA = 1; }
      if (blastAge > 12) { blastAge = -1; passAge = -1; }
    }
    const sincePass = passAge >= 0 && blastAge >= 0 ? blastAge - passAge : -1;
    const veiling = sincePass >= 0 && sincePass < 2.5;
    veil = approach(veil, veiling ? w : 0, veiling ? 0.25 : 0.8, dt);
    shake = Math.max(0, shake - dt * 1.4);
    if (blastAge < 0 || blastAge > 9) emberA = approach(emberA, 0, 1.4, dt);
    WU.uBlastAge.value = blastAge;
    WU.uBlastR.value = rs;
    WU.uBlastMorph.value = swayS;
    WU.uBlastFire.value = fire;
    WU.uVeil.value = veil;
    WU.uDustH.value = sc0 * (0.7 + 1.5 * swayS) + 20;
  }

  // --- the lamps and the embers ---------------------------------------------------------------
  function updateStreet(dt, t, w) {
    for (let k = 0; k < LAMPS; k++) {
      const lz = LAMP_Z0 - LAMP_DZ * k;
      for (let s = 0; s < 2; s++) {
        const lx = s ? LAMP_X : -LAMP_X;
        const i = k * 2 + s;
        cap(CAP_LAMP0 + i, lx, 0, lz, lx, LAMP_H, lz, 1.4, w * 0.16, 4.0, 0);
      }
    }
    for (let i = 0; i < EMBERS; i++) {
      if (emberA > 0.01) {
        embY[i] -= embV[i] * dt;
        embX[i] += Math.sin(t * 1.3 + i) * dt * 2.5;
        if (embY[i] < 0) { embY[i] = 30 + Math.random() * 50; embX[i] = camPos.x + (Math.random() - 0.5) * 140; embZ[i] = camPos.z - Math.random() * 240; }
      }
      sph(glows, GL_EMBER0 + i, embX[i], embY[i], embZ[i], 0.5 + 0.4 * (i % 3), emberA * (0.4 + 0.5 * Math.sin(t * 6 + i)), 1.0, 0.6);
    }
  }

  const bloom = { strength: 0.45, radius: 0.45, threshold: 0.55 };

  function setAct(next) {
    next = clamp(next | 0, 0, ACTS - 1);
    if (next === act) return;
    const pair = (act === 1 && next === 2) || (act === 2 && next === 1);
    act = next;
    transitTarget = act >= 2 ? 1 : 0;
    if (!pair) transit = transitTarget;
  }
  function padEvent(idx, vel) {
    if (act === 0) fireCollision();
    else if (act === 1) fireFission();
    else if (pressS >= 0.8) detonate();
    else launchRV(idx, vel);
  }

  return {
    scene,
    camera,
    bloom,
    action(key) {
      if (key === 'collide') fireCollision();
      else if (key === 'split') fireFission();
      else if (key === 'detonate') detonate();
      else if (key === 'blast') { blastAge = 0; passAge = -1; flash = Math.max(flash, 0.55); }
      else if (key === 'strike') launchRV(clamp(Math.round(placeP), 0, 15), 1);
      // A salvo fills the deck and no more. Firing eight into five slots evicted
      // three of its own bursts at their brightest, half a second after they
      // landed — so the salvo is exactly as long as the deck is deep, spread
      // across the pad map so it reads as a bus's payload and not a cluster.
      else if (key === 'salvo') { salvoLeft = MAX_CLOUDS - 1; salvoT = 0; salvoIdx = 0; }
      else if (key === 'rebuild') { citySeed = 1 + ((Math.random() * 900) | 0); WU.uCitySeed.value = citySeed; gatherWindows(citySeed); }
    },
    setParam(key, value) {
      if (key === 'act') setAct(Math.round(value));
      else if (key === 'yield') yieldTarget = clamp(value, 0, 1);
      else if (key === 'transition') { transit = clamp(value, 0, 1); transitTarget = transit; }
      else if (key === 'cloudScale') cloudScaleP = clamp(value, 0.2, 3);
      else if (key === 'place') placeP = clamp(value, 0, 15);
    },
    update(dt, t, io) {
      // ---- KNOB 6 picks the act the moment it moves; KNOB 5 the yield
      const k6 = io.knobs[5];
      if (k6Prev === null) k6Prev = k6;
      if (Math.abs(k6 - k6Prev) > 0.004) setAct(Math.min(3, Math.floor(k6 * 4)));
      k6Prev = k6;
      const k5 = io.knobs[4];
      if (k5Prev === null) k5Prev = k5;
      if (Math.abs(k5 - k5Prev) > 0.004) yieldTarget = k5;
      k5Prev = k5;

      // ---- the pull-back: linear in time so it always completes
      if (transit !== transitTarget) {
        const step = dt / TRANSIT_T;
        transit = transitTarget > transit ? Math.min(transitTarget, transit + step) : Math.max(transitTarget, transit - step);
      }
      const transiting = (act === 1 || act === 2) && transit > 0.002 && transit < 0.998;
      if (transiting) {
        actW[0] = approach(actW[0], 0, ACT_FADE / 3, dt);
        actW[3] = approach(actW[3], 0, ACT_FADE / 3, dt);
        actW[1] = 1 - smooth01((transit - 0.52) / 0.46);
        actW[2] = smooth01((transit - 0.10) / 0.36);
      } else {
        for (let i = 0; i < ACTS; i++) actW[i] = approach(actW[i], i === act ? 1 : 0, ACT_FADE / 3, dt);
      }
      WU.uCityFade.value = clamp(actW[2] + actW[3], 0, 1);
      WU.uWinFade.value = transiting ? smooth01((transit - 0.62) / 0.30) : (act >= 2 ? 1 : 0);
      // the deck leaves fast when the move starts and comes back over the
      // second after it lands (updateClouds says why)
      deckStand = approach(deckStand, transiting ? 0 : 1, transiting ? 0.09 : 0.30, dt);

      yieldS = approach(yieldS, yieldTarget, 0.3, dt);
      swayS = approach(swayS, io.gestures.sway, 0.4, dt);
      pressS = approach(pressS, io.gestures.press, 0.15, dt);
      hx = approach(hx, io.xy.x, 0.3, dt);
      hy = approach(hy, io.xy.y, 0.3, dt);
      bass = approach(bass, io.bands.bass, 0.12, dt);
      high = approach(high, io.bands.high, 0.1, dt);
      if (io.beat > beatPrev + 0.3) pulse = 1;
      beatPrev = io.beat;
      pulse = Math.max(0, pulse - dt * 3.5);

      // ---- every pad is its own event; the rising edge is the strike
      for (let i = 0; i < 16; i++) {
        const v = io.pads[i];
        if (v > padPrev[i] + 0.25 && v > 0.12) padEvent(i, v);
        padPrev[i] = v;
      }
      if (salvoLeft > 0) {
        salvoT -= dt;
        if (salvoT <= 0) { launchRV(salvoIdx, 1); salvoIdx = (salvoIdx + SALVO_STEP) % 16; salvoLeft--; salvoT = 0.07; }
      }
      flash = Math.max(0, flash - dt * 2.2);
      cascadeFlash = Math.max(0, cascadeFlash - dt * 4.0);

      // ---- the eye
      const camTau = transiting ? 0.09 : 0.35;
      if (act === 0) {
        const dist0 = 9 - pressS * 4.5;
        const az = (hx - 0.5) * 2.4, el = 0.15 + (hy - 0.5) * 0.9;
        wantPos.set(Math.sin(az) * Math.cos(el) * dist0, Math.sin(el) * dist0, Math.cos(az) * Math.cos(el) * dist0);
        wantTarget.set(0, 0, 0);
      } else if (act === 3) {
        wantPos.set((hx - 0.5) * 16, 1.8 + (hy - 0.5) * 2.4 - pressS * 1.1, 40);
        wantTarget.set(wantPos.x * 0.3, 7 - pressS * 4, -420);
      } else {
        // one straight line out of the nucleus: the direction blends to the
        // city axis early, then the whole move is a dolly on a log schedule
        const az = (hx - 0.5) * 2.4, el = 0.15 + (hy - 0.5) * 0.9;
        let dx = Math.sin(az) * Math.cos(el), dy = Math.sin(el), dz = Math.cos(az) * Math.cos(el);
        const b = smooth01(transit / 0.26);
        dx += (TDX - dx) * b; dy += (TDY - dy) * b; dz += (TDZ - dz) * b;
        const dl = Math.sqrt(dx * dx + dy * dy + dz * dz) + 1e-6;
        dx /= dl; dy /= dl; dz /= dl;
        const dist0 = Math.exp(Math.log(ATOM_DIST) + (Math.log(CITY_DIST) - Math.log(ATOM_DIST)) * transit);
        const hw = smooth01((transit - 0.7) / 0.3);
        wantPos.set(
          ATOM_X + dx * dist0 + (hx - 0.5) * 140 * hw,
          ATOM_Y + dy * dist0 + ((hy - 0.5) * 64 + 12) * hw,
          ATOM_Z + dz * dist0,
        );
        wantTarget.set(ATOM_X - TDX * 400 * transit, ATOM_Y - TDY * 400 * transit, ATOM_Z - TDZ * 400 * transit);
      }
      camPos.x = approach(camPos.x, wantPos.x, camTau, dt);
      camPos.y = approach(camPos.y, wantPos.y, camTau, dt);
      camPos.z = approach(camPos.z, wantPos.z, camTau, dt);
      camTarget.x = approach(camTarget.x, wantTarget.x, camTau, dt);
      camTarget.y = approach(camTarget.y, wantTarget.y, camTau, dt);
      camTarget.z = approach(camTarget.z, wantTarget.z, camTau, dt);
      camera.position.copy(camPos);
      if (shake > 0) {
        const s = shake * shake * 1.6;
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

      // the city's own two window colours, read off the palette before the acts
      // run so a nucleon on its way to a pane arrives holding that pane's colour
      const pw = io.palette;
      winWarm[0] = pw[1].r + (pw[0].r - pw[1].r) * 0.30;
      winWarm[1] = pw[1].g + (pw[0].g - pw[1].g) * 0.30;
      winWarm[2] = pw[1].b + (pw[0].b - pw[1].b) * 0.30;
      winCool[0] = pw[2].r + (1 - pw[2].r) * 0.30;
      winCool[1] = pw[2].g + (1 - pw[2].g) * 0.30;
      winCool[2] = pw[2].b + (1 - pw[2].b) * 0.30;

      // ---- the acts (every act keeps running; only weighted ones show)
      updateCollider(dt, t, actW[0]);
      updateFission(dt, t, actW[1], transit);
      updateClouds(dt, t);
      updateRVs(dt);
      updateShockwave(dt, t, actW[3]);
      updateStreet(dt, t, actW[3]);

      // ---- uniforms and buffers
      const pl = io.palette;
      for (let i = 0; i < 5; i++) { wp[i].value.copy(pl[i]); cp[i].value.copy(pl[i]); sp[i].value.copy(pl[i]); gp[i].value.copy(pl[i]); }
      WU.uTime.value = t;
      WU.uIntensity.value = io.intensity;
      WU.uFlash.value = Math.min(0.97, flash * flash * 0.9 + cascadeFlash * 0.6);
      WU.uActW.value.set(actW[0], actW[1], actW[2], actW[3]);
      WU.uVertexGlow.value = vertexGlow;
      WU.uCollFlash.value = collFlash;
      WU.uStreet.value = actW[3];
      WU.uMorph.value = swayS;
      WU.uPress.value = pressS;
      WU.uRain.value = 0.35 + high * 0.5;
      WU.uFogD.value = 0.0020 + bass * 0.0015;
      CU.uIntensity.value = io.intensity;
      solids.U.uIntensity.value = io.intensity;
      glows.U.uIntensity.value = io.intensity;
      capAP0.needsUpdate = true; capAP1.needsUpdate = true; capAS.needsUpdate = true;
      solids.aPos.needsUpdate = true; solids.aS.needsUpdate = true; solids.aC.needsUpdate = true;
      glows.aPos.needsUpdate = true; glows.aS.needsUpdate = true; glows.aC.needsUpdate = true;
      const cityOn = actW[2] > 0.002 || actW[3] > 0.002;
      caps.visible = actW[0] > 0.002 || actW[1] > 0.002 || cityOn;
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
