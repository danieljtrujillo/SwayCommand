// Ferrofluid Orb — the real cymatics "orb" mode from GANTASMO's theDAW.
//
// Ported from theDAW frontend/src/components/audio/cymatics/sphere-shader.ts
// (https://github.com/gantasmo/theDAW), which carries:
//     @license
//     SPDX-License-Identifier: Apache-2.0
// That notice is retained here as Apache-2.0 requires, along with this
// statement of changes.
//
// CHANGES FROM THE ORIGINAL:
//   * rosensweig() and calc() are reproduced verbatim — the pole-field dropoff,
//     the Fibonacci (13/21/34) phyllotaxis cross-hatch, the witch's-hat
//     foot/apex/sharpTip profile, the stillness-on-silence guard, and the
//     tangent-frame normal rebuild at inc = 0.005 are unchanged.
//   * Upstream injects this by replacing MeshStandardMaterial's whole vertex
//     shader; here the same code is injected through onBeforeCompile, which is
//     the supported r180 route and survives three.js chunk changes.
//   * Upstream reflects an .exr environment through PMREMGenerator. Scenes may
//     not load assets, so the environment is generated procedurally at
//     construction from the light-rig colours.
//   * Upstream's UnrealBloomPass is unavailable (the engine owns the
//     compositor), so an additive fresnel shell stands in for the bloom.
//   * The three-point rig keeps its upstream positions and intensities but is
//     recoloured from io.palette each frame, satisfying the palette rule.
//   * IcosahedronGeometry detail drops from 64 to 24/40/56 by quality tier.
//     Detail 64 is ~163k triangles, far past the target hardware.

export const meta = { id: 'ferrofluid', name: 'Ferrofluid Orb', mood: 'magnetic' };

const PADS = 16;

// Upstream CymaticsRenderer constants.
const SPIKE_AMPLITUDE = 0.45;
const NOISE_VISCOSITY = 1.2;
const CAM_RADIUS = 3.3;

export function createScene(ctx) {
  const { THREE, quality } = ctx;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, ctx.width / Math.max(1, ctx.height), 0.1, 100);
  camera.position.set(0, 0, CAM_RADIUS);

  const detail = quality.tier === 'high' ? 56 : quality.tier === 'low' ? 24 : 40;

  // --- procedural environment: a vertical gradient the black chrome reflects.
  //     Stands in for upstream's piz_compressed.exr.
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
        // a hot key spot so the chrome has something specular to catch
        c += vec3(1.0, 0.96, 0.92) * pow(max(dot(vDir, normalize(vec3(0.5, 0.75, 0.42))), 0.0), 22.0) * 2.4;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  envScene.add(new THREE.Mesh(envGeo, envMat));
  const envRT = pmrem.fromScene(envScene, 0.04);
  scene.environment = envRT.texture;

  // --- the orb: black chrome, displaced in the vertex shader
  const orbGeo = new THREE.IcosahedronGeometry(1.0, detail);
  const orbMat = new THREE.MeshStandardMaterial({
    color: 0x010101,
    metalness: 0.99,
    roughness: 0.003,
    envMapIntensity: 1.35,
  });

  // Uniforms shared into the patched vertex shader. inputData/outputData keep
  // upstream's packed layout: x bass, y mids, z highs, w amplitude.
  const orbUniforms = {
    time: { value: 0 },
    inputData: { value: new THREE.Vector4() },
    outputData: { value: new THREE.Vector4() },
    spikeAmplitude: { value: SPIKE_AMPLITUDE },
    noiseViscosity: { value: NOISE_VISCOSITY },
    isFerrofluid: { value: 1.0 },
  };

  // Upstream's rosensweig()/calc(), verbatim, plus the tangent-frame normal
  // rebuild from its main(). Injected rather than replacing the whole shader.
  const DISPLACE_PARS = /* glsl */ `
    uniform float time;
    uniform vec4 inputData;
    uniform vec4 outputData;
    uniform float spikeAmplitude;
    uniform float noiseViscosity;
    uniform float isFerrofluid;

    float rosensweig(vec3 p, float t, vec4 audio) {
      vec3 np = normalize(p);
      float fieldStrength = abs(np.y);
      fieldStrength = pow(fieldStrength, 1.5);
      float totalAudio = max(audio.x, max(audio.y, audio.z));
      float beatSpin = (audio.y * 1.8 + audio.z * 1.4);
      float theta = atan(np.z, np.x) + t * 0.08 + beatSpin;
      float phi = acos(clamp(np.y, -0.999, 0.999));
      float symPhi = phi;
      if (symPhi > 1.5707963) { symPhi = 3.14159265 - symPhi; }
      float logR = log(max(0.01, symPhi));
      float arm1 = cos(13.0 * theta - 21.0 * logR);
      float arm2 = cos(-21.0 * theta - 34.0 * logR);
      float grid = (arm1 + arm2) / 2.0;
      grid = grid * 0.5 + 0.5;
      float foot = pow(grid, 1.3);
      float magneticStrength = isFerrofluid * (0.15 + 0.85 * totalAudio) * fieldStrength;
      float apexExp = mix(5.0, 28.0, magneticStrength);
      float apexMultiplier = mix(0.1, 7.0, magneticStrength);
      float apex = pow(grid, apexExp) * apexMultiplier;
      float profile = (foot + apex) / (1.0 + apexMultiplier);
      float sharpTip = 1.0 - pow(max(1.5 * (1.0 - grid), 0.0), 0.75);
      profile = mix(profile, profile * clamp(sharpTip, 0.0, 1.0), isFerrofluid);
      return profile * fieldStrength;
    }

    vec3 fluidCalc(vec3 pos, vec3 norm) {
      float t = time * noiseViscosity;
      vec4 totalAudio = inputData + outputData;
      float bass = totalAudio.x;
      float mids = totalAudio.y;
      float highs = totalAudio.z;
      float volume = max(bass, max(mids, highs));
      if (volume < 0.01) { return pos; }
      float pulsation = (0.015 * bass) * sin(t * 0.4 + pos.y * 0.6) * cos(t * 0.35 + pos.x * 0.5);
      float spikeValue = rosensweig(pos, t, totalAudio);
      float dynamicAmp = spikeAmplitude * volume * (0.2 + 0.8 * (bass + mids + highs * 1.2));
      float displacement = pulsation + (spikeValue * dynamicAmp);
      return pos + norm * displacement;
    }
  `;

  const DISPLACE_BODY = /* glsl */ `
    float inc = 0.005;
    vec3 np = fluidCalc(position, objectNormal);
    vec3 t1 = cross(objectNormal, vec3(0.0, 1.0, 0.0));
    if (length(t1) < 0.01) { t1 = cross(objectNormal, vec3(0.0, 0.0, 1.0)); }
    t1 = normalize(t1);
    vec3 t2 = cross(objectNormal, t1);
    vec3 np1 = fluidCalc(position + t1 * inc, objectNormal);
    vec3 np2 = fluidCalc(position + t2 * inc, objectNormal);
    vec3 dTan = np1 - np;
    vec3 dBit = np2 - np;
    // Guarded: at rest all three samples are identical, so the crosses are zero
    // and normalize() would produce NaN and blank the orb.
    if (length(dTan) > 1e-8 && length(dBit) > 1e-8) {
      vec3 nrm = cross(normalize(dTan), normalize(dBit));
      if (length(nrm) > 1e-8) { objectNormal = normalize(nrm); }
    }
    vec3 transformed = np;
  `;

  orbMat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, orbUniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\n' + DISPLACE_PARS)
      // Recompute the normal before three.js transforms it, then supply our own
      // `transformed` in place of the default begin_vertex assignment.
      .replace('#include <defaultnormal_vertex>', DISPLACE_BODY + '\n#include <defaultnormal_vertex>')
      .replace('#include <begin_vertex>', '');
  };
  orbMat.customProgramCacheKey = () => 'swaycommand-ferrofluid';

  const orb = new THREE.Mesh(orbGeo, orbMat);
  orb.frustumCulled = false; // displaced past its bounding sphere
  scene.add(orb);

  // --- additive fresnel shell: stands in for the missing bloom pass
  const haloGeo = new THREE.IcosahedronGeometry(1.06, Math.min(detail, 32));
  const haloMat = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.BackSide,
    uniforms: {
      uColor: { value: new THREE.Color() },
      uPower: { value: 3.0 },
      uAmount: { value: 0.5 },
    },
    vertexShader: /* glsl */ `
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vN = normalize(normalMatrix * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vV = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uPower, uAmount;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        float f = pow(clamp(1.0 - abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0), uPower);
        gl_FragColor = vec4(uColor * f * uAmount, f * uAmount);
      }`,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.frustumCulled = false;
  scene.add(halo);

  // --- upstream three-point neon rig (positions and intensities unchanged)
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
  const target = new THREE.Vector3(0, 0, 0);
  let az = 0;
  let el = 0;
  let spin = 0;
  let burst = 0; // pad-driven spike surge
  let tAccum = 0;
  let bassSm = 0;
  let midSm = 0;
  let highSm = 0;

  const approach = (cur, to, tau, dt) => cur + (to - cur) * (1 - Math.exp(-dt / tau));

  return {
    scene,
    camera,
    update(dt, t, io) {
      // Upstream envelopes its bands before packing them; the same smoothing
      // keeps the spikes from chattering on transients.
      bassSm = approach(bassSm, io.bands.bass, 0.06, dt);
      midSm = approach(midSm, io.bands.mid, 0.08, dt);
      highSm = approach(highSm, io.bands.high, 0.05, dt);

      for (let i = 0; i < PADS; i++) {
        if (io.pads[i] > 0.25 && io.pads[i] > prevPads[i] + 0.06) burst = 1;
        prevPads[i] = io.pads[i];
      }
      burst *= Math.pow(0.05, dt);

      // Upstream advances its own clock by dt * 0.015 * (1 + 0.6 * bass).
      tAccum += dt * 0.015 * (1 + 0.6 * bassSm) * 60;
      orbUniforms.time.value = tAccum;

      // Pack into upstream's two vec4s. press raises the magnetic strength by
      // feeding the highs slot, which is what sharpens the needles.
      //
      // ADAPTATION: upstream returns the undisplaced position whenever volume
      // is under 0.01, so a silent room shows a perfectly smooth ball. That is
      // correct for a reactive art piece and wrong for a VJ scene that has to
      // hold the screen between cues, so a small floor keeps a standing spike
      // field alive. Everything above the floor is upstream's own response.
      const floor = 0.16;
      const boost = 1 + burst * 0.9;
      orbUniforms.inputData.value.set(
        Math.min(1.5, (floor + bassSm) * boost),
        Math.min(1.5, (floor * 0.7 + midSm) * boost),
        Math.min(1.5, (floor * 0.5 + highSm + io.gestures.press * 0.55) * boost),
        io.level
      );
      orbUniforms.outputData.value.set(0, 0, 0, 0);
      orbUniforms.isFerrofluid.value = 1.0;

      // Upstream scales the sphere by 1 + 0.04 * bass.
      const s = 1 + 0.04 * bassSm + burst * 0.05;
      orb.scale.setScalar(s);
      halo.scale.setScalar(s);

      // sway spins the orb on its axis; xy orbits the camera
      spin += dt * (0.12 + (io.gestures.sway - 0.0) * 0.9);
      orb.rotation.y = spin;
      halo.rotation.y = spin;

      az = approach(az, io.xy.x * Math.PI * 2, 0.25, dt);
      el = approach(el, (io.xy.y - 0.5) * 2.2, 0.25, dt);
      const ce = Math.cos(el);
      const rad = CAM_RADIUS - io.gestures.press * 0.55 - io.beat * 0.12;
      camera.position.set(Math.sin(az) * ce * rad, Math.sin(el) * rad, Math.cos(az) * ce * rad);
      camera.lookAt(target);

      // palette drives the rig and the halo (contract rule 1)
      keyLight.color.copy(io.palette[4]);
      rimLight.color.copy(io.palette[1]);
      fillLight.color.copy(io.palette[2]);
      ambient.color.copy(io.palette[3]);
      keyLight.intensity = 1.4 * io.intensity;
      rimLight.intensity = (0.9 + io.beat * 0.8) * io.intensity;
      fillLight.intensity = 0.4 * io.intensity;

      haloMat.uniforms.uColor.value.copy(io.palette[0]);
      haloMat.uniforms.uAmount.value =
        (0.35 + io.level * 0.5 + io.beat * 0.45 + burst * 0.6) * io.intensity;
      haloMat.uniforms.uPower.value = 3.0 - io.gestures.pulse * 1.2;
      orbMat.envMapIntensity = 1.35 + io.bands.high * 0.9;
    },
    resize(w, h) {
      camera.aspect = w / Math.max(1, h);
      camera.updateProjectionMatrix();
    },
    dispose() {
      orbGeo.dispose();
      orbMat.dispose();
      haloGeo.dispose();
      haloMat.dispose();
      envGeo.dispose();
      envMat.dispose();
      envRT.dispose();
      pmrem.dispose();
      scene.environment = null;
    },
  };
}
