// Swarm — a stateless GPU particle cloud orbiting an attractor that chases
// the hand. Every particle's position is computed in the vertex shader from
// pure random seeds + time (layered sin/cos pseudo-curl), so the CPU only
// pushes uniforms: bass swells the orbits, beats detonate a radial burst,
// press clenches the swarm and sway shears it. One Points draw call.
// Scene contract: docs/SCENE_CONTRACT.md.

export const meta = { id: 'swarm', name: 'Swarm', mood: 'hypnotic' };

export function createScene(ctx) {
  const { THREE, quality } = ctx;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, ctx.width / ctx.height, 0.1, 400);
  camera.position.set(0, 4, 30);

  // --- geometry: nothing but random seeds; the shader does all the motion.
  // position = per-particle scatter direction in [-1,1]^3 (doubles as a seed),
  // aSeed = (phase, speed, radius, colorMix) each in [0,1].
  const count = quality.particles;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count * 3);
  const seed = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    pos[i * 3] = Math.random() * 2 - 1;
    pos[i * 3 + 1] = Math.random() * 2 - 1;
    pos[i * 3 + 2] = Math.random() * 2 - 1;
    seed[i * 4] = Math.random();
    seed[i * 4 + 1] = Math.random();
    seed[i * 4 + 2] = Math.random();
    seed[i * 4 + 3] = Math.random();
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 4));

  const mat = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    uniforms: {
      uTime: { value: 0 },
      uAttractor: { value: new THREE.Vector3(0, 0, 0) }, // lagged hand position
      uBass: { value: 0 },
      uBurst: { value: 0 }, // beat/pad impulse, decayed CPU-side
      uPress: { value: 0 },
      uSway: { value: 0 },
      uHigh: { value: 0 },
      uSize: { value: 2.0 * (ctx.height / 1080) }, // resolution-stable point scale
      // more particles -> each one dimmer, so brightness stays tier-stable
      uAlpha: { value: Math.min(1, Math.max(0.3, 24000 / count)) },
      uColorA: { value: new THREE.Color(1, 1, 1) },
      uColorB: { value: new THREE.Color(1, 1, 1) },
    },
    vertexShader: /* glsl */ `
      attribute vec4 aSeed; // x phase, y speed, z radius, w color mix
      uniform float uTime;
      uniform vec3 uAttractor;
      uniform float uBass;
      uniform float uBurst;
      uniform float uPress;
      uniform float uSway;
      uniform float uHigh;
      uniform float uSize;
      varying float vMix;
      varying float vTw;
      void main() {
        float ph = aSeed.x * 6.2831853;
        float sp = 0.25 + aSeed.y * 0.75;   // per-particle angular speed
        float t1 = uTime * sp + ph;

        // orbit radius: seeded spread, swollen by bass, clenched by press
        float rad = 3.0 + aSeed.z * 9.0;
        rad *= 1.0 + uBass * 0.9;
        rad *= 1.0 - uPress * 0.6;

        // layered incommensurate sin/cos = cheap stateless pseudo-curl orbit
        vec3 p;
        p.x = sin(t1) * rad + sin(t1 * 1.73 + ph * 3.0) * rad * 0.35;
        p.y = sin(t1 * 0.91 + ph) * rad * 0.55 + cos(t1 * 2.17 + ph * 5.0) * rad * 0.2;
        p.z = cos(t1) * rad + cos(t1 * 1.31 + ph * 4.0) * rad * 0.35;
        p += position * rad * 0.45;              // scatter the ring into a cloud

        p *= 1.0 + uBurst * (0.4 + aSeed.z * 0.9); // beat: expanding radial shell
        p.x += p.y * uSway;                        // sway gesture shears the swarm

        vec4 mv = modelViewMatrix * vec4(uAttractor + p, 1.0);
        vMix = aSeed.w;
        vTw = 0.5 + 0.5 * sin(uTime * (1.5 + uHigh * 6.0) + ph * 13.0); // treble twinkle
        float px = uSize * (0.6 + aSeed.y * 0.8) * (1.0 + uBass * 1.6) * (160.0 / -mv.z);
        gl_PointSize = min(px, 40.0); // cap fill cost for near particles
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform float uAlpha;
      varying float vMix;
      varying float vTw;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        float a = smoothstep(0.5, 0.0, d); // soft round sprite
        a *= a * (0.35 + 0.65 * vTw) * uAlpha;
        gl_FragColor = vec4(mix(uColorA, uColorB, vMix), a);
      }`,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false; // real positions live in the shader
  scene.add(points);

  // --- preallocated scratch + scalar state
  const target = new THREE.Vector3(); // where the hand says the attractor should be
  const camTarget = new THREE.Vector3(0, 0, 0);
  let burst = 0; // beat/pad impulse energy, exponential decay

  return {
    scene,
    camera,
    update(dt, t, io) {
      const u = mat.uniforms;

      // attractor chases the hand in world space with exponential lag
      target.set((io.xy.x - 0.5) * 26, (io.xy.y - 0.5) * 16, 0);
      u.uAttractor.value.lerp(target, 1 - Math.exp(-dt * 3.5));

      // burst: beats and pad hits detonate, then decay fast
      burst = Math.max(burst * Math.pow(0.04, dt), io.beat);
      for (let i = 0; i < 16; i++) if (io.pads[i] > burst) burst = io.pads[i];

      u.uTime.value = t;
      u.uBass.value = io.bands.bass;
      u.uHigh.value = io.bands.high;
      u.uBurst.value = burst;
      u.uPress.value = io.gestures.press;
      u.uSway.value = (io.gestures.sway - 0.5) * 1.2;

      // two palette entries per frame; slow cycle, lastPad shoves the accent
      const ia = ((t * 0.15) | 0) % 5;
      const ib = (ia + 2 + (io.lastPad >= 0 ? io.lastPad : 0)) % 5;
      u.uColorA.value.copy(io.palette[ia]).multiplyScalar(io.intensity);
      u.uColorB.value.copy(io.palette[ib]).multiplyScalar(io.intensity);

      // slow drifting orbit around the swarm; look-at eases toward the attractor
      const orbit = t * 0.05;
      camera.position.x = Math.sin(orbit) * 30;
      camera.position.z = Math.cos(orbit) * 30;
      camera.position.y = 4 + Math.sin(t * 0.11) * 3 + io.beat * 0.5;
      camTarget.lerp(u.uAttractor.value, 1 - Math.exp(-dt * 1.5));
      camera.lookAt(camTarget);
    },
    resize(w, h) {
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      mat.uniforms.uSize.value = 2.0 * (h / 1080); // keep point size resolution-stable
    },
    dispose() {
      geo.dispose();
      mat.dispose();
    },
  };
}
