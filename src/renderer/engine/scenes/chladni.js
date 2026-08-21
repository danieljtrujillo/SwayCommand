// Cymatic Plate — the real cymatics "cymatics" mode from GANTASMO's theDAW:
// a Chladni/Faraday standing-wave liquid plate.
//
// Ported from theDAW frontend/src/components/audio/cymatics/cymatics-shader.ts
// (https://github.com/gantasmo/theDAW), which carries:
//     @license
//     SPDX-License-Identifier: Apache-2.0
// That notice is retained here as Apache-2.0 requires, along with this
// statement of changes.
//
// CHANGES FROM THE ORIGINAL:
//   * getCymaticValue() and calcPlane() are reproduced verbatim: the 16-entry
//     n/m/sign mode tables, the quadrature traveling-wave trick that stops the
//     plate strobing flat, the polar Faraday cell, the even/odd geometryMix,
//     the 1.75 half-extent, the 0.45 * smoothedAmplitude excitation, the
//     clamped-edge damping, and the central-difference normals at inc = 0.01.
//   * Upstream declares the tables with the GLSL3 constructor float[16](...),
//     which is illegal in the GLSL1 that three.js ShaderMaterial compiles.
//     They are emitted here as an if/else selector over the same values.
//   * Upstream reads a real 16-band FFT. SwayCommand scenes receive three bands, so
//     the 16 bins are interpolated across bass/mid/high. The spectral-centroid
//     mode picker and its asymmetric smoothing (0.04 down, 0.08 up) then run on
//     that synthesized spectrum unchanged.
//   * Environment is generated procedurally (scenes cannot load the upstream
//     .exr), the bloom pass is replaced by an emissive nodal-line term, and the
//     light rig is recoloured from io.palette each frame.
//   * Plane segments drop from 160 to 96/140/180 by quality tier.

export const meta = { id: 'chladni', name: 'Cymatic Plate', mood: 'resonant' };

const PADS = 16;
const MODES = 16;

// Upstream's tables, verbatim.
const NS = [2, 3, 3, 4, 4, 5, 5, 6, 6, 6, 7, 7, 8, 8, 10, 12];
const MS = [2, 1, 3, 2, 4, 3, 5, 2, 4, 6, 3, 5, 4, 8, 6, 10];
const SIGNS = [1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1, 1, -1];

// GLSL1 has no array constructors, so the tables become a selector chain.
function modeSelector(name, values) {
  const lines = values.map(
    (v, i) => `  if (i < ${i}.5) return ${v.toFixed(1)};`
  );
  return `float ${name}(float i) {\n${lines.join('\n')}\n  return ${values[values.length - 1].toFixed(1)};\n}`;
}

export function createScene(ctx) {
  const { THREE, quality } = ctx;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, ctx.width / Math.max(1, ctx.height), 0.1, 100);

  const seg = quality.tier === 'high' ? 180 : quality.tier === 'low' ? 96 : 140;

  // --- procedural environment for the chrome plate
  const pmrem = new THREE.PMREMGenerator(ctx.renderer);
  const envScene = new THREE.Scene();
  const envGeo = new THREE.SphereGeometry(10, 24, 16);
  const envMat = new THREE.ShaderMaterial({
    side: THREE.BackSide,
    uniforms: {
      cTop: { value: new THREE.Color(0xb14dff) },
      cBottom: { value: new THREE.Color(0x00d2ff) },
      cHorizon: { value: new THREE.Color(0x0c0714) },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 cTop, cBottom, cHorizon;
      varying vec3 vDir;
      void main() {
        float y = clamp(vDir.y * 0.5 + 0.5, 0.0, 1.0);
        vec3 c = mix(cBottom, cTop, y);
        c = mix(cHorizon, c, abs(vDir.y) * 0.85 + 0.15);
        c += vec3(1.0, 0.96, 0.92) * pow(max(dot(vDir, normalize(vec3(0.5, 0.75, 0.42))), 0.0), 22.0) * 2.4;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  envScene.add(new THREE.Mesh(envGeo, envMat));
  const envRT = pmrem.fromScene(envScene, 0.04);
  scene.environment = envRT.texture;

  // --- the plate
  const plateGeo = new THREE.PlaneGeometry(3.5, 3.5, seg, seg);
  const plateMat = new THREE.MeshStandardMaterial({
    color: 0x010101,
    metalness: 0.98,
    roughness: 0.005,
    envMapIntensity: 1.3,
  });

  const plateUniforms = {
    time: { value: 0 },
    activeModeIndex: { value: 0 },
    smoothedAmplitude: { value: 0 },
    cymaticAmplitude: { value: 1 },
    uNodeColor: { value: new THREE.Color(1, 1, 1) },
    uNodeGain: { value: 1 },
  };

  const PLATE_PARS = /* glsl */ `
    uniform float time;
    uniform float activeModeIndex;
    uniform float smoothedAmplitude;
    uniform float cymaticAmplitude;
    varying float vDisp;

    ${modeSelector('modeN', NS)}
    ${modeSelector('modeM', MS)}
    ${modeSelector('modeS', SIGNS)}

    float getCymaticValue(float u, float v, float r, float theta, float idx, float t) {
      float n = modeN(idx);
      float m = modeM(idx);
      float s = modeS(idx);
      float chladni1 = cos(n * PI * u) * cos(m * PI * v);
      float chladni2 = cos(m * PI * u) * cos(n * PI * v);
      float chladni = chladni1 * sin(t * 3.5) + s * chladni2 * cos(t * 3.5);
      float polarCymatic = cos(m * PI * r - t * 3.5) * cos(n * theta - t * 0.4);
      float geometryMix = mod(idx, 2.0) < 0.5 ? 0.3 : 0.7;
      return mix(chladni, polarCymatic, geometryMix);
    }

    vec3 calcPlane(vec3 pos) {
      float u = pos.x / 1.75;
      float v = pos.y / 1.75;
      float r = length(vec2(u, v));
      float theta = atan(v, u + (r < 1e-6 ? 1e-6 : 0.0));
      float idx0 = clamp(floor(activeModeIndex), 0.0, 15.0);
      float idx1 = clamp(idx0 + 1.0, 0.0, 15.0);
      float tBlend = fract(activeModeIndex);
      float val0 = getCymaticValue(u, v, r, theta, idx0, time);
      float val1 = getCymaticValue(u, v, r, theta, idx1, time);
      float z = mix(val0, val1, tBlend);
      float excitation = 0.45 * smoothedAmplitude;
      z *= excitation;
      float edgeDamping = (1.0 - smoothstep(0.85, 1.0, abs(u))) * (1.0 - smoothstep(0.85, 1.0, abs(v)));
      z *= edgeDamping;
      z *= cymaticAmplitude;
      return pos + vec3(0.0, 0.0, z);
    }
  `;

  const PLATE_BODY = /* glsl */ `
    float inc = 0.01;
    vec3 np = calcPlane(position);
    vec3 npDX = calcPlane(position + vec3(inc, 0.0, 0.0));
    vec3 npDY = calcPlane(position + vec3(0.0, inc, 0.0));
    vec3 dTan = npDX - np;
    vec3 dBit = npDY - np;
    if (length(dTan) > 1e-9 && length(dBit) > 1e-9) {
      vec3 nrm = cross(normalize(dTan), normalize(dBit));
      if (length(nrm) > 1e-9) { objectNormal = normalize(nrm); }
    }
    vDisp = np.z;
    vec3 transformed = np;
  `;

  plateMat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, plateUniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + PLATE_PARS)
      .replace('#include <defaultnormal_vertex>', PLATE_BODY + '\n#include <defaultnormal_vertex>')
      .replace('#include <begin_vertex>', '');
    // Emissive nodal lines stand in for upstream's bloom pass: the Chladni
    // nodes are where displacement crosses zero, which is exactly where sand
    // collects on a real plate.
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying float vDisp;\nuniform vec3 uNodeColor;\nuniform float uNodeGain;'
      )
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
         float node = 1.0 - smoothstep(0.0, 0.012, abs(vDisp));
         gl_FragColor.rgb += uNodeColor * node * uNodeGain;`
      );
  };
  plateMat.customProgramCacheKey = () => 'swaycommand-chladni';

  const plate = new THREE.Mesh(plateGeo, plateMat);
  plate.frustumCulled = false;
  plate.rotation.x = -Math.PI / 2.6;
  scene.add(plate);

  // --- upstream light rig
  const keyLight = new THREE.DirectionalLight(0xfff5ea, 1.4);
  keyLight.position.set(6, 9, 5);
  const rimLight = new THREE.DirectionalLight(0xb14dff, 0.9);
  rimLight.position.set(-6, -3, -4);
  const fillLight = new THREE.DirectionalLight(0x00d2ff, 0.4);
  fillLight.position.set(0, -6, 5);
  const ambient = new THREE.AmbientLight(0x0c0714, 0.15);
  scene.add(keyLight, rimLight, fillLight, ambient);

  // --- preallocated state
  const bins = new Float32Array(MODES);
  const prevPads = new Float32Array(PADS);
  const target = new THREE.Vector3(0, 0, 0);
  let smoothedMode = 0;
  let smoothedAmp = 0;
  let tAccum = 0;
  let az = 0;
  let el = 0.55;
  let padJump = 0;

  const approach = (cur, to, tau, dt) => cur + (to - cur) * (1 - Math.exp(-dt / tau));

  return {
    scene,
    camera,
    update(dt, t, io) {
      // ADAPTATION: synthesize upstream's 16 bands from three. Bins 0-3 bass,
      // 4-10 mid, 11-15 high, matching upstream's own split, with a small
      // deterministic ripple so the centroid is never perfectly static.
      const { bass, mid, high } = io.bands;
      let sumW = 0;
      let sumI = 0;
      for (let i = 0; i < MODES; i++) {
        const base = i < 4 ? bass : i < 11 ? mid : high;
        const ripple = 0.85 + 0.15 * Math.sin(t * (0.7 + i * 0.13) + i);
        const v = base * ripple;
        bins[i] = v;
        const weight = i === 0 ? v * 0.15 : v * v;
        sumW += weight;
        sumI += weight * i;
      }

      // Upstream's spectral-centroid picker with asymmetric smoothing.
      const targetMode = sumW > 0.005 ? sumI / sumW : 0;
      const biased = Math.min(15, Math.max(0, targetMode + (io.xy.x - 0.5) * 7 + padJump));
      const modeFactor = biased < smoothedMode ? 0.04 : 0.08;
      smoothedMode += (biased - smoothedMode) * Math.min(1, modeFactor * dt * 60);
      plateUniforms.activeModeIndex.value = Math.min(15, Math.max(0, smoothedMode));

      // Upstream amplitude envelope: fast up, slow down.
      const avg = (bass + mid + high) / 3;
      const ampFactor = avg > smoothedAmp ? 0.28 : 0.07;
      smoothedAmp += (avg - smoothedAmp) * Math.min(1, ampFactor * dt * 60);
      plateUniforms.smoothedAmplitude.value = Math.max(0.12, smoothedAmp) * (1 + io.beat * 0.5);
      plateUniforms.cymaticAmplitude.value = 1 + io.gestures.press * 1.6;

      for (let i = 0; i < PADS; i++) {
        if (io.pads[i] > 0.25 && io.pads[i] > prevPads[i] + 0.06) padJump = (i % MODES) - smoothedMode;
        prevPads[i] = io.pads[i];
      }
      padJump *= Math.pow(0.2, dt);

      tAccum += dt * 0.04 * 60 * (1 + io.level * 0.6);
      plateUniforms.time.value = tAccum;

      plate.rotation.z = (io.gestures.sway - 0.5) * 0.6;

      az = approach(az, (io.xy.x - 0.5) * 1.6, 0.3, dt);
      el = approach(el, 0.35 + io.xy.y * 0.9, 0.3, dt);
      const rad = 4.4 - io.gestures.press * 0.8;
      camera.position.set(Math.sin(az) * rad, Math.sin(el) * rad, Math.cos(az) * rad * Math.cos(el * 0.4));
      camera.lookAt(target);

      keyLight.color.copy(io.palette[4]);
      rimLight.color.copy(io.palette[1]);
      fillLight.color.copy(io.palette[2]);
      ambient.color.copy(io.palette[3]);
      keyLight.intensity = 1.4 * io.intensity;
      rimLight.intensity = (0.9 + io.beat * 0.7) * io.intensity;

      plateUniforms.uNodeColor.value.copy(io.palette[0]);
      plateUniforms.uNodeGain.value =
        (0.5 + io.bands.high * 1.4 + io.beat * 0.8 + io.gestures.press * 0.9) * io.intensity;
      plateMat.envMapIntensity = 1.3 + io.bands.high * 0.8;
    },
    resize(w, h) {
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    },
    dispose() {
      plateGeo.dispose();
      plateMat.dispose();
      envGeo.dispose();
      envMat.dispose();
      envRT.dispose();
      pmrem.dispose();
      scene.environment = null;
    },
  };
}
