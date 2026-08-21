// Chrome Valley — the real cymatics "landscape" modes from GANTASMO's theDAW:
// an infinite-scroll synthwave valley that morphs into a ferrofluid spike field.
//
// Ported from theDAW frontend/src/components/audio/cymatics/landscape-shader.ts
// (https://github.com/gantasmo/theDAW), which carries:
//     @license
//     SPDX-License-Identifier: Apache-2.0
// That notice is retained here as Apache-2.0 requires, along with this
// statement of changes.
//
// CHANGES FROM THE ORIGINAL:
//   * baseTerrain(), spikeField() and calcLandscape() are reproduced verbatim:
//     the sideMask that carves the flat valley floor between mountain walls,
//     the three sine/cosine octaves, the valleyWave, the 7-direction
//     golden-angle quasicrystal, the phi/romanesco modulation, the same
//     witch's-hat foot/apex/sharpTip profile as the orb, the ebb term, and the
//     e = 0.18 finite-difference base normal that the spikes grow along.
//   * Upstream replaces MeshStandardMaterial's whole vertex shader; this port
//     injects through onBeforeCompile instead.
//   * Environment is procedural (no .exr), the bloom pass is replaced by an
//     emissive ridge term, and the light rig is recoloured from io.palette.
//   * Plane segments drop from 300 to 140/220/300 by quality tier.
//   * isFerrofluid is driven by io.gestures.press, so one scene covers both
//     upstream modes (landscape-chrome at rest, landscape-ferrofluid pressed).

export const meta = { id: 'valley', name: 'Chrome Valley', mood: 'synthwave' };

const PADS = 16;
const MOUNTAIN_HEIGHT = 1.5; // upstream default
const SCROLL_SPEED = 1.0; // upstream default

export function createScene(ctx) {
  const { THREE, quality } = ctx;
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 5, 16); // upstream
  const camera = new THREE.PerspectiveCamera(50, ctx.width / Math.max(1, ctx.height), 0.1, 100);
  camera.position.set(0, 0.6, 2.4); // upstream fixed camera

  const seg = quality.tier === 'high' ? 300 : quality.tier === 'low' ? 140 : 220;

  // --- procedural environment for the chrome terrain
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

  // --- terrain
  const landGeo = new THREE.PlaneGeometry(34, 40, seg, seg);
  const landMat = new THREE.MeshStandardMaterial({
    color: 0x010101,
    metalness: 0.99,
    roughness: 0.008,
    envMapIntensity: 1.25,
  });

  const landUniforms = {
    time: { value: 0 },
    audioData: { value: new THREE.Vector4() }, // x bass, y mid, z high, w level
    mountainHeight: { value: MOUNTAIN_HEIGHT },
    scrollSpeed: { value: SCROLL_SPEED },
    isFerrofluid: { value: 0 },
    uRidgeColor: { value: new THREE.Color(1, 1, 1) },
    uRidgeGain: { value: 0.5 },
  };

  const LAND_PARS = /* glsl */ `
    uniform float time;
    uniform vec4 audioData;
    uniform float mountainHeight;
    uniform float scrollSpeed;
    uniform float isFerrofluid;
    varying float vHeight;

    float baseTerrain(vec3 pos) {
      vec2 p = pos.xy + vec2(0.0, time * scrollSpeed);
      float sideMask = smoothstep(1.2, 4.5, abs(pos.x));
      float n1 = sin(p.x * 0.35) * cos(p.y * 0.22);
      float n2 = sin(p.x * 0.8 + 1.2) * cos(p.y * 0.5) * 0.45;
      float n3 = sin(p.x * 1.6 - 0.5) * cos(p.y * 1.1) * 0.18;
      float baseMountains = (n1 + n2 + n3) * mountainHeight * 1.7 * (1.0 + 0.45 * audioData.x);
      float valleyWave = sin(p.y * 1.4 - time * 1.6) * 0.25 * (audioData.x + audioData.y);
      return mix(valleyWave, baseMountains, sideMask);
    }

    float spikeField(vec3 pos) {
      if (isFerrofluid < 0.001) return 0.0;
      vec2 p = pos.xy + vec2(0.0, time * scrollSpeed);
      float totalAudio = max(audioData.x, max(audioData.y, audioData.z));
      float phi = 1.61803398875;
      float dens = 8.0;
      float field = 0.0;
      for (int i = 0; i < 7; i++) {
        float a = float(i) * 2.39996323; // golden angle
        field += cos(dot(p, vec2(cos(a), sin(a))) * dens);
      }
      float grid = clamp(field / 7.0 * 0.5 + 0.5, 0.0, 1.0);
      float macro = cos(p.x / phi) * sin(p.y / phi);
      float romanesco = 0.6 + 0.4 * (macro * 0.5 + 0.5);
      float foot = pow(grid, 1.3);
      float magneticStrength = isFerrofluid * (0.15 + 0.85 * totalAudio);
      float apexExp = mix(5.0, 28.0, magneticStrength);
      float apexMul = mix(0.1, 7.0, magneticStrength);
      float apex = pow(grid, apexExp) * apexMul;
      float profile = (foot + apex) / (1.0 + apexMul);
      float sharpTip = 1.0 - pow(max(1.5 * (1.0 - grid), 0.0), 0.75);
      profile = mix(profile, profile * clamp(sharpTip, 0.0, 1.0), isFerrofluid);
      float ebb = 0.55 + 0.45 * sin(time * 0.5 + p.x * 1.3 + p.y * 0.9);
      float amount = (0.4 + 0.9 * totalAudio) * ebb;
      return profile * mountainHeight * 3.0 * romanesco * amount * isFerrofluid;
    }

    vec3 calcLandscape(vec3 pos) {
      float e = 0.18;
      float b0 = baseTerrain(pos);
      float bx = baseTerrain(pos + vec3(e, 0.0, 0.0));
      float by = baseTerrain(pos + vec3(0.0, e, 0.0));
      vec3 baseN = normalize(cross(vec3(e, 0.0, bx - b0), vec3(0.0, e, by - b0)));
      float s = spikeField(pos);
      return pos + vec3(0.0, 0.0, b0) + baseN * s;
    }
  `;

  const LAND_BODY = /* glsl */ `
    float inc = 0.06;
    vec3 np = calcLandscape(position);
    vec3 npDX = calcLandscape(position + vec3(inc, 0.0, 0.0));
    vec3 npDY = calcLandscape(position + vec3(0.0, inc, 0.0));
    vec3 dTan = npDX - np;
    vec3 dBit = npDY - np;
    if (length(dTan) > 1e-9 && length(dBit) > 1e-9) {
      vec3 nrm = cross(normalize(dTan), normalize(dBit));
      if (length(nrm) > 1e-9) { objectNormal = normalize(nrm); }
    }
    vHeight = np.z;
    vec3 transformed = np;
  `;

  landMat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, landUniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + LAND_PARS)
      .replace('#include <defaultnormal_vertex>', LAND_BODY + '\n#include <defaultnormal_vertex>')
      .replace('#include <begin_vertex>', '');
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nvarying float vHeight;\nuniform vec3 uRidgeColor;\nuniform float uRidgeGain;'
      )
      .replace(
        '#include <dithering_fragment>',
        `#include <dithering_fragment>
         float ridge = smoothstep(0.35, 2.4, abs(vHeight));
         gl_FragColor.rgb += uRidgeColor * ridge * uRidgeGain;`
      );
  };
  landMat.customProgramCacheKey = () => 'swaycommand-valley';

  const land = new THREE.Mesh(landGeo, landMat);
  land.frustumCulled = false;
  land.rotation.x = -Math.PI / 2.3; // upstream
  land.position.set(0, -1.15, -8); // upstream
  scene.add(land);

  // --- upstream starfield: 240 points on a golden-angle scatter
  const STARS = 240;
  const starGeo = new THREE.BufferGeometry();
  const starPos = new Float32Array(STARS * 3);
  for (let i = 0; i < STARS; i++) {
    const a = i * 2.39996323;
    const r = 6 + (i / STARS) * 18;
    starPos[i * 3] = Math.cos(a) * r;
    starPos[i * 3 + 1] = 2 + ((i * 7919) % 100) / 100 * 9;
    starPos[i * 3 + 2] = -6 - ((i * 104729) % 100) / 100 * 26;
  }
  starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
  const starMat = new THREE.PointsMaterial({
    color: 0x8fa8d8,
    size: 0.13,
    fog: false,
    transparent: true,
    depthWrite: false,
  });
  const stars = new THREE.Points(starGeo, starMat);
  scene.add(stars);

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
  const prevPads = new Float32Array(PADS);
  const lookAt = new THREE.Vector3(0, 2.2, -6.5); // upstream
  let tAccum = 0;
  let bassSm = 0;
  let shock = 0;
  let bank = 0;

  const approach = (cur, to, tau, dt) => cur + (to - cur) * (1 - Math.exp(-dt / tau));

  return {
    scene,
    camera,
    update(dt, t, io) {
      bassSm = approach(bassSm, io.bands.bass, 0.07, dt);

      for (let i = 0; i < PADS; i++) {
        if (io.pads[i] > 0.25 && io.pads[i] > prevPads[i] + 0.06) shock = 1;
        prevPads[i] = io.pads[i];
      }
      shock *= Math.pow(0.08, dt);

      // Upstream: time += dt * 0.012 * scrollSpeed * (1 + bass * 0.6).
      // io.level rides on top so the valley flies with the music.
      landUniforms.scrollSpeed.value = SCROLL_SPEED * (0.7 + io.level * 1.8);
      tAccum += dt * 0.012 * landUniforms.scrollSpeed.value * (1 + bassSm * 0.6) * 60;
      landUniforms.time.value = tAccum;

      landUniforms.audioData.value.set(bassSm, io.bands.mid, io.bands.high, io.level);
      landUniforms.mountainHeight.value = MOUNTAIN_HEIGHT * (1 + bassSm * 0.5 + shock * 0.6);
      // press morphs chrome valley into ferrofluid valley
      landUniforms.isFerrofluid.value = Math.min(1, io.gestures.press * 1.15 + io.beat * 0.12);

      bank = approach(bank, (io.gestures.sway - 0.5) * 0.5, 0.4, dt);
      camera.position.set(bank * 2.2, 0.6 + io.xy.y * 1.6, 2.4 - io.gestures.press * 0.5);
      camera.rotation.z = bank * 0.35;
      camera.lookAt(lookAt);

      keyLight.color.copy(io.palette[4]);
      rimLight.color.copy(io.palette[1]);
      fillLight.color.copy(io.palette[2]);
      ambient.color.copy(io.palette[3]);
      keyLight.intensity = 1.4 * io.intensity;
      rimLight.intensity = (0.9 + io.beat * 0.7) * io.intensity;

      starMat.color.copy(io.palette[2]);
      starMat.opacity = 0.5 + io.bands.high * 0.5;

      landUniforms.uRidgeColor.value.copy(io.palette[0]);
      landUniforms.uRidgeGain.value = (0.25 + io.bands.mid * 0.7 + shock * 0.8) * io.intensity;
      landMat.envMapIntensity = 1.25 + io.bands.high * 0.7;
    },
    resize(w, h) {
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    },
    dispose() {
      landGeo.dispose();
      landMat.dispose();
      starGeo.dispose();
      starMat.dispose();
      envGeo.dispose();
      envMat.dispose();
      envRT.dispose();
      pmrem.dispose();
      scene.environment = null;
    },
  };
}
