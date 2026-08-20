// Quantum Lattice — the real lattice engine from GANTASMO's theDAW: an
// instanced node-and-beam structure with energy filaments, a solar-storm core,
// and beat-driven geometry switching.
//
// Ported from theDAW frontend/src/lib/quantumLattice.ts
// (https://github.com/gantasmo/theDAW). That file carries no SPDX header, so
// the repository licence applies: MIT License, Copyright (c) 2026 Stability AI.
// Its own header states it is meant to be copied into the VJ tree.
//
// CHANGES FROM THE ORIGINAL:
//   * computeTargetCoordinate() is reproduced verbatim for all four geometries
//     — Grand Torus (p=3, q=7 with the delta_r wave), Cubic Frame (three nested
//     scales over the 12 cube edges), Merkabah Star (two tetrahedra plus an
//     octahedron), Cosmos Cage (golden-ratio Fibonacci sphere) — as are
//     STRANDS 3, N_POINTS 120, R_BASE 3.0, r_base 1.0 and the per-shape core
//     scales [1.25, 0.75, 1.05, 0.6].
//   * Both fragment shaders are reproduced: the beam fresnel/energyFlux/grid/
//     burst chain and the node thermal/storm/reactor-core chain.
//   * Upstream's grid lines use fwidth(); GLSL1 needs the derivatives
//     extension, so it is enabled explicitly on the material.
//   * The beat-driven shape switch keeps upstream's envelope (25 ms attack,
//     180 ms release) and hysteresis (re-arm below 0.3, fire above 0.55,
//     0.18 s cooldown). A pad rising edge also forces the next geometry.
//   * Upstream's four named palettes are replaced by io.palette mapped onto the
//     cyan/magenta/gold/white uniform roles, as the contract requires.
//   * The dither/vignette ShaderPass and UnrealBloomPass are omitted: the
//     AKSWAYJ compositor already applies its own tone curve and vignette.
//   * Instance counts scale by quality tier (upstream is a fixed 373/756).

export const meta = { id: 'lattice', name: 'Quantum Lattice', mood: 'crystalline' };

export const QUANTUM_GEOMETRY_NAMES = ['Grand Torus', 'Cubic Frame', 'Merkabah Star', 'Cosmos Cage'];

const PADS = 16;
const N_POINTS = 120;
const STRANDS = 3;
const R_BASE = 3.0;
const R_MINOR = 1.0;
const CORE_SCALES = [1.25, 0.75, 1.05, 0.6];

export function createScene(ctx) {
  const { THREE, quality } = ctx;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x020005, 0.025); // upstream
  const camera = new THREE.PerspectiveCamera(60, ctx.width / Math.max(1, ctx.height), 0.1, 200);

  const total = STRANDS * N_POINTS;
  const nodeCount = quality.tier === 'high' ? total : quality.tier === 'low' ? 160 : 260;
  const beamCount = quality.tier === 'high' ? 756 : quality.tier === 'low' ? 220 : 420;
  const sphereSeg = quality.tier === 'low' ? 8 : quality.tier === 'high' ? 16 : 12;

  const PAL = {
    uColorCyan: { value: new THREE.Color(0x00ffff) },
    uColorMagenta: { value: new THREE.Color(0xff007f) },
    uColorGold: { value: new THREE.Color(0xffaa00) },
    uColorWhite: { value: new THREE.Color(0xffffff) },
  };

  const shared = {
    uTime: { value: 0 },
    uSpeed: { value: 1.2 },
    uWaveScale: { value: 1 },
    uFresnelPow: { value: 2.2 },
    uGridIntensity: { value: 0.5 },
    uHeartbeat: { value: 1.6 },
    uIntensity: { value: 1 },
  };

  const VERT = /* glsl */ `
    varying vec2 vUv;
    varying vec3 vNormalW;
    varying vec3 vViewDir;
    void main() {
      vUv = uv;
      vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
      vNormalW = normalize(normalMatrix * mat3(instanceMatrix) * normal);
      vViewDir = normalize(-mv.xyz);
      gl_Position = projectionMatrix * mv;
    }`;

  // Upstream beam/tube shader.
  const beamMat = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    extensions: { derivatives: true }, // fwidth() below
    uniforms: { ...shared, ...PAL },
    vertexShader: VERT,
    fragmentShader: /* glsl */ `
      uniform float uTime, uSpeed, uWaveScale, uFresnelPow, uGridIntensity, uIntensity;
      uniform vec3 uColorCyan, uColorMagenta, uColorGold, uColorWhite;
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vViewDir;
      void main() {
        float fresnel = pow(clamp(1.0 - abs(dot(vViewDir, vNormalW)), 0.0, 1.0), uFresnelPow);
        float speedFactor = uTime * uSpeed * 4.0;
        float wave1 = sin(vUv.y * 18.0 * uWaveScale - speedFactor);
        float wave2 = cos(vUv.y * 36.0 * uWaveScale + speedFactor * 0.8);
        float wave3 = sin(vUv.y * 90.0 * uWaveScale - speedFactor * 1.5) * 0.4;
        float energyFlux = smoothstep(0.2, 0.8, (wave1 * wave2 + wave3) * 0.5 + 0.5);
        float wireX = sin(vUv.x * 3.14159265 * 4.0);
        float lineX = smoothstep(max(fwidth(wireX), 0.0001) * 1.5, 0.0, abs(wireX));
        float wireY = sin(vUv.y * 3.14159265 * 30.0);
        float lineY = smoothstep(max(fwidth(wireY), 0.0001) * 1.5, 0.0, abs(wireY));
        float grid = max(lineX, lineY);
        vec3 surfaceColor = mix(uColorMagenta * 0.2, uColorCyan, fresnel);
        vec3 activeFilament = mix(surfaceColor, uColorMagenta * 1.8, energyFlux);
        vec3 finalColor = mix(activeFilament, uColorGold * 1.5, grid * uGridIntensity);
        float burst = smoothstep(0.96, 1.0, sin(vUv.y * 6.0 - speedFactor * 1.8));
        finalColor = mix(finalColor, uColorWhite, burst * 0.85);
        float alpha = mix(0.12 + fresnel * 0.65, 1.0, (grid * 0.75) + (energyFlux * 0.35));
        gl_FragColor = vec4(clamp(finalColor * uIntensity, vec3(0.0), vec3(8.0)), clamp(alpha, 0.0, 1.0));
      }`,
  });

  // Upstream node/sphere shader.
  const nodeMat = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: { ...shared, ...PAL },
    vertexShader: VERT,
    fragmentShader: /* glsl */ `
      uniform float uTime, uSpeed, uFresnelPow, uHeartbeat, uIntensity;
      uniform vec3 uColorCyan, uColorMagenta, uColorGold, uColorWhite;
      varying vec2 vUv;
      varying vec3 vNormalW;
      varying vec3 vViewDir;
      void main() {
        float fresnel = pow(clamp(1.0 - abs(dot(vViewDir, vNormalW)), 0.0, 1.0), uFresnelPow);
        float speedFactor = uTime * uSpeed * 4.0;
        float distFromCenter = length(vUv - vec2(0.5));
        float thermalWave = sin(distFromCenter * 28.0 - speedFactor) * 0.5 + 0.5;
        float stormNoise = sin(vUv.x * 24.0 + speedFactor) * cos(vUv.y * 24.0 - speedFactor);
        float activeSolar = smoothstep(0.3, 0.9, stormNoise * thermalWave);
        vec3 basePlasma = mix(uColorMagenta, uColorCyan, fresnel);
        vec3 solarLattice = mix(basePlasma, uColorGold * 1.8, activeSolar);
        float centralReactor = smoothstep(0.28, 0.0, distFromCenter);
        vec3 finalColor = mix(solarLattice, uColorWhite, centralReactor * 0.95);
        finalColor += uColorGold * (fresnel * (sin(uTime * uHeartbeat) * 0.5 + 0.5) * 0.4);
        float alpha = clamp(0.2 + fresnel * 0.7 + centralReactor * 0.6, 0.0, 1.0);
        gl_FragColor = vec4(clamp(finalColor * uIntensity, vec3(0.0), vec3(8.0)), alpha);
      }`,
  });

  const sphereGeo = new THREE.SphereGeometry(1, sphereSeg, sphereSeg);
  const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 8, 1, false);
  const nodes = new THREE.InstancedMesh(sphereGeo, nodeMat, nodeCount);
  const beams = new THREE.InstancedMesh(cylGeo, beamMat, beamCount);
  nodes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  beams.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  nodes.frustumCulled = false;
  beams.frustumCulled = false;
  scene.add(nodes, beams);

  // --- preallocated point buffers and scratch
  const pts = new Float32Array(total * 3);
  const prevPads = new Float32Array(PADS);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s3 = new THREE.Vector3();
  const p3 = new THREE.Vector3();
  const a3 = new THREE.Vector3();
  const b3 = new THREE.Vector3();
  const dir = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const target = new THREE.Vector3(0, 0, 0);

  // Upstream vertex/edge tables, hoisted so the per-frame path allocates nothing.
  const CUBE_V = [
    [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
    [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1],
  ];
  const CUBE_E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  const TETRA_A = [[1, 1, 1], [1, -1, -1], [-1, 1, -1], [-1, -1, 1]];
  const TETRA_B = [[-1, -1, -1], [-1, 1, 1], [1, -1, 1], [1, 1, -1]];
  const TETRA_E = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];
  const OCTA_V = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const OCTA_E = [[0, 2], [2, 1], [1, 3], [3, 0], [0, 4], [1, 4], [2, 4], [3, 4], [0, 5], [1, 5], [2, 5], [3, 5]];
  const CUBE_SCALES = [3.3, 2.2, 1.1];
  const GOLDEN = (1 + Math.sqrt(5)) / 2;

  function lerpEdge(out, verts, edge, f, scale) {
    const A = verts[edge[0]];
    const B = verts[edge[1]];
    out.set(A[0] + (B[0] - A[0]) * f, A[1] + (B[1] - A[1]) * f, A[2] + (B[2] - A[2]) * f).multiplyScalar(scale);
  }

  // Upstream computeTargetCoordinate, verbatim.
  function targetCoord(shape, s, i, time, waveSpeed, out) {
    const alpha = (s * Math.PI * 2) / STRANDS;
    const phi = (i / N_POINTS) * Math.PI * 2;
    if (shape === 0) {
      const p = 3;
      const qq = 7;
      const deltaR = Math.sin(5 * phi - time * waveSpeed) * Math.cos(3 * phi + time * waveSpeed) * 0.15;
      const rCur = R_MINOR + deltaR;
      const ring = R_BASE + rCur * Math.cos(qq * phi + alpha);
      out.set(ring * Math.cos(p * phi), ring * Math.sin(p * phi), rCur * Math.sin(qq * phi + alpha));
    } else if (shape === 1) {
      const edge = CUBE_E[Math.floor(i / 10) % 12];
      lerpEdge(out, CUBE_V, edge, (i % 10) / 9, CUBE_SCALES[s]);
      out.multiplyScalar(1 + Math.sin(time * 2 + i * 0.1) * 0.02);
    } else if (shape === 2) {
      if (s === 0) lerpEdge(out, TETRA_A, TETRA_E[Math.floor(i / 20) % 6], (i % 20) / 19, 2.6);
      else if (s === 1) lerpEdge(out, TETRA_B, TETRA_E[Math.floor(i / 20) % 6], (i % 20) / 19, 2.6);
      else lerpEdge(out, OCTA_V, OCTA_E[Math.floor(i / 10) % 12], (i % 10) / 9, 1.6);
    } else {
      const index = s * N_POINTS + i;
      const y = 1 - (index / (total - 1)) * 2;
      const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = 2 * Math.PI * GOLDEN * index;
      const baseRad = 2.6 + Math.sin(time * 1.5 + index * 0.05) * 0.1;
      out.set(Math.cos(theta) * radiusAtY, y, Math.sin(theta) * radiusAtY).multiplyScalar(baseRad);
    }
  }

  let activeShape = 0;
  let morphEnergy = 0;
  let bassEnv = 0;
  let beatArmed = true;
  let beatCooldown = 0;
  let tAccum = 0;
  let az = 0;
  let el = 0;

  const approach = (cur, to, tau, dt) => cur + (to - cur) * (1 - Math.exp(-dt / tau));

  return {
    scene,
    camera,
    get shapeName() {
      return QUANTUM_GEOMETRY_NAMES[activeShape];
    },
    update(dt, t, io) {
      // Upstream envelope: 25 ms attack, 180 ms release.
      const rb = io.bands.bass;
      const tcUp = 1 - Math.exp(-dt / 0.025);
      const tcDn = 1 - Math.exp(-dt / 0.18);
      bassEnv += (rb - bassEnv) * (rb > bassEnv ? tcUp : tcDn);

      // Upstream hysteresis beat gate advances the geometry.
      beatCooldown = Math.max(0, beatCooldown - dt);
      if (bassEnv < 0.3) beatArmed = true;
      let switched = false;
      if (beatArmed && beatCooldown <= 0 && bassEnv > 0.55) {
        activeShape = (activeShape + 1) % 4;
        morphEnergy = 1;
        beatArmed = false;
        beatCooldown = 0.18;
        switched = true;
      }
      for (let i = 0; i < PADS; i++) {
        if (io.pads[i] > 0.25 && io.pads[i] > prevPads[i] + 0.06 && !switched) {
          activeShape = (activeShape + 1) % 4;
          morphEnergy = 1;
          switched = true;
        }
        prevPads[i] = io.pads[i];
      }
      morphEnergy = Math.max(morphEnergy * Math.pow(0.25, dt), bassEnv * 0.6);

      const waveSpeed = 1.2 * (0.6 + io.bands.mid * 1.4);
      tAccum += dt * (0.6 + io.level * 1.2);
      shared.uTime.value = tAccum;
      shared.uSpeed.value = waveSpeed;
      shared.uWaveScale.value = 0.7 + io.bands.mid * 1.1;
      shared.uGridIntensity.value = 0.25 + io.bands.high * 0.9;
      shared.uHeartbeat.value = 1.2 + bassEnv * 3.0;
      shared.uIntensity.value = io.intensity;

      // rebuild the point set for the active shape
      const coreScale = CORE_SCALES[activeShape];
      for (let s = 0; s < STRANDS; s++) {
        for (let i = 0; i < N_POINTS; i++) {
          targetCoord(activeShape, s, i, tAccum, waveSpeed, p3);
          const idx = (s * N_POINTS + i) * 3;
          pts[idx] = p3.x;
          pts[idx + 1] = p3.y;
          pts[idx + 2] = p3.z;
        }
      }

      // nodes
      const nodeScale = (0.055 + bassEnv * 0.05 + morphEnergy * 0.03) * coreScale;
      const stride = Math.max(1, Math.floor(total / nodeCount));
      for (let n = 0; n < nodeCount; n++) {
        const src = (n * stride) % total;
        p3.set(pts[src * 3], pts[src * 3 + 1], pts[src * 3 + 2]);
        s3.setScalar(nodeScale);
        m.compose(p3, q, s3);
        nodes.setMatrixAt(n, m);
      }
      nodes.instanceMatrix.needsUpdate = true;

      // beams: connect consecutive points within each strand
      const beamR = 0.018 + io.bands.mid * 0.02;
      const bStride = Math.max(1, Math.floor(total / beamCount));
      for (let n = 0; n < beamCount; n++) {
        const i0 = (n * bStride) % total;
        const i1 = (i0 + 1) % total;
        a3.set(pts[i0 * 3], pts[i0 * 3 + 1], pts[i0 * 3 + 2]);
        b3.set(pts[i1 * 3], pts[i1 * 3 + 1], pts[i1 * 3 + 2]);
        dir.subVectors(b3, a3);
        const len = dir.length();
        if (len < 1e-6 || len > 6) {
          // a wrap between strands would draw a beam across the whole lattice
          s3.setScalar(0);
          m.compose(a3, q, s3);
        } else {
          p3.addVectors(a3, b3).multiplyScalar(0.5);
          dir.divideScalar(len);
          q.setFromUnitVectors(up, dir);
          s3.set(beamR, len, beamR);
          m.compose(p3, q, s3);
        }
        beams.setMatrixAt(n, m);
      }
      beams.instanceMatrix.needsUpdate = true;

      // palette onto upstream's four colour roles
      PAL.uColorCyan.value.copy(io.palette[2]);
      PAL.uColorMagenta.value.copy(io.palette[0]);
      PAL.uColorGold.value.copy(io.palette[3]);
      PAL.uColorWhite.value.copy(io.palette[4]);

      az = approach(az, io.xy.x * Math.PI * 2, 0.28, dt);
      el = approach(el, (io.xy.y - 0.5) * 1.8, 0.28, dt);
      const rad = (9.5 - io.gestures.press * 3.2 - morphEnergy * 0.5) * (1 + (activeShape === 0 ? 0.15 : 0));
      const ce = Math.cos(el);
      camera.position.set(Math.sin(az) * ce * rad, Math.sin(el) * rad, Math.cos(az) * ce * rad);
      camera.up.set(0, 1, 0);
      camera.lookAt(target);
      nodes.rotation.y = beams.rotation.y = tAccum * (io.gestures.sway - 0.5) * 0.6;
    },
    resize(w, h) {
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    },
    dispose() {
      nodes.dispose();
      beams.dispose();
      sphereGeo.dispose();
      cylGeo.dispose();
      nodeMat.dispose();
      beamMat.dispose();
    },
  };
}
