// Beams — sixteen vertical light columns, one per Sway IR sensor.
// The hand position sweeps a highlight across the row, pads flash their
// column, bass fattens everything. Reference implementation of the
// scene contract (docs/SCENE_CONTRACT.md).

export const meta = { id: 'beams', name: 'Beam Sixteen', mood: 'anthemic' };

const COUNT = 16;

export function createScene(ctx) {
  const { THREE, quality } = ctx;
  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.018);
  const camera = new THREE.PerspectiveCamera(55, ctx.width / ctx.height, 0.1, 400);
  camera.position.set(0, 6, 34);

  // --- 16 beams: one InstancedMesh, additive so overlaps bloom naturally
  const beamGeo = new THREE.BoxGeometry(1, 60, 1);
  const beamMat = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const beams = new THREE.InstancedMesh(beamGeo, beamMat, COUNT);
  beams.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(beams);

  // --- floor grid catches the beams visually
  const grid = new THREE.GridHelper(160, 40, 0xffffff, 0xffffff);
  grid.material.transparent = true;
  grid.material.opacity = 0.12;
  grid.material.blending = THREE.AdditiveBlending;
  grid.material.depthWrite = false;
  grid.position.y = -8;
  scene.add(grid);

  // --- dust motes drifting through the beams
  const dustCount = Math.max(500, Math.floor(quality.particles / 12));
  const dustGeo = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  const dustSeed = new Float32Array(dustCount);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 90;
    dustPos[i * 3 + 1] = Math.random() * 44 - 8;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 40;
    dustSeed[i] = Math.random() * Math.PI * 2;
  }
  dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  dustGeo.setAttribute('aSeed', new THREE.BufferAttribute(dustSeed, 1));
  const dustMat = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color(1, 1, 1) },
      uLevel: { value: 0 },
    },
    vertexShader: /* glsl */ `
      attribute float aSeed;
      uniform float uTime;
      varying float vTw;
      void main() {
        vec3 p = position;
        p.y += sin(uTime * 0.3 + aSeed) * 2.0;
        p.x += cos(uTime * 0.2 + aSeed * 1.7) * 1.5;
        vTw = 0.5 + 0.5 * sin(uTime * 2.0 + aSeed * 13.0);
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_PointSize = (1.5 + vTw) * (140.0 / -mv.z);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uLevel;
      varying float vTw;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d) * (0.25 + 0.75 * vTw) * (0.3 + uLevel);
        gl_FragColor = vec4(uColor, a);
      }`,
  });
  const dust = new THREE.Points(dustGeo, dustMat);
  scene.add(dust);

  // --- preallocated scratch
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const s = new THREE.Vector3();
  const p = new THREE.Vector3();
  const c = new THREE.Color();
  const camTarget = new THREE.Vector3(0, 4, 0);
  const flash = new Float32Array(COUNT); // per-beam pad flash energy

  const SPACING = 4.6;
  const X0 = -((COUNT - 1) * SPACING) / 2;

  return {
    scene,
    camera,
    update(dt, t, io) {
      const bass = io.bands.bass;
      const sweep = io.xy.x * (COUNT - 1); // hand position in beam-index space

      for (let i = 0; i < COUNT; i++) {
        // pad hits inject flash energy into their own column
        flash[i] = Math.max(flash[i] * Math.pow(0.06, dt), io.pads[i]);

        // proximity of the hand sweep to this beam (soft highlight)
        const prox = Math.exp(-Math.pow(i - sweep, 2) * 0.5);
        const idle = 0.55 + 0.45 * Math.sin(t * 0.8 + i * 0.62);
        const energy = Math.min(1.5, idle * 0.25 + prox * (0.4 + io.xy.y) + flash[i] + bass * 0.5);

        const w = 0.25 + energy * (0.9 + bass * 1.6) + io.gestures.press * 0.8;
        p.set(X0 + i * SPACING, 22 - io.gestures.press * 10, 0);
        s.set(w, 1 + io.beat * 0.05, w);
        m.compose(p, q, s);
        beams.setMatrixAt(i, m);

        // palette: cycle across the row, pushed toward white by flash energy
        c.copy(io.palette[(i + ((t * 0.4) | 0)) % 5]);
        c.multiplyScalar(0.25 + energy * 1.1 * io.intensity);
        beams.setColorAt(i, c);
      }
      beams.instanceMatrix.needsUpdate = true;
      if (beams.instanceColor) beams.instanceColor.needsUpdate = true;

      // dust follows palette accent, twinkles with treble
      dustMat.uniforms.uTime.value = t;
      dustMat.uniforms.uColor.value.copy(io.palette[4]).multiplyScalar(io.intensity);
      dustMat.uniforms.uLevel.value = io.bands.high;

      // slow orbit; sway gesture leans the camera, y raises it
      const orbit = t * 0.07 + (io.gestures.sway - 0.5) * 1.2;
      camera.position.x = Math.sin(orbit) * 36;
      camera.position.z = Math.cos(orbit) * 36;
      camera.position.y = 4 + io.xy.y * 10 + io.beat * 0.6;
      camera.lookAt(camTarget);

      grid.material.opacity = 0.06 + bass * 0.18;
    },
    resize(w, h) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    },
    dispose() {
      beams.dispose(); // frees instanceMatrix/instanceColor GPU buffers
      beamGeo.dispose();
      beamMat.dispose();
      dustGeo.dispose();
      dustMat.dispose();
      grid.geometry.dispose();
      grid.material.dispose();
    },
  };
}
