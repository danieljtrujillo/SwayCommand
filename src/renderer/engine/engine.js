// Engine — renders two scenes into offscreen targets and crossfades them
// (equal-power), after Akvj's VfxController: an Auto-VJ timer holds a scene
// for a random interval, then fades to another from the project's pool.
// Scene instances are cached for glitch-free switching.

import * as THREE from 'three';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { creators, sceneList } from './scenes/index.js';
import { createColorMaster } from './colormaster.js';
import { createFxRack } from './fxrack.js';

const QUALITY_TIERS = {
  low: { tier: 'low', particles: 8000 },
  med: { tier: 'med', particles: 30000 },
  high: { tier: 'high', particles: 80000 },
};

export function createEngine({ canvas, quality = 'med' }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.autoClear = true;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

  const q = QUALITY_TIERS[quality] || QUALITY_TIERS.med;
  const colorMaster = createColorMaster();

  let width = canvas.clientWidth || 1280;
  let height = canvas.clientHeight || 720;

  // Half-float targets keep the scenes' additive HDR (values past 1.0) alive
  // for the bloom pass, exactly like theDAW's EffectComposer buffers.
  const rtOpts = { depthBuffer: true, stencilBuffer: false, type: THREE.HalfFloatType };
  let rtA = new THREE.WebGLRenderTarget(width, height, rtOpts);
  let rtB = new THREE.WebGLRenderTarget(width, height, rtOpts);

  // The crossfade composite lands here when bloom or the FX rack needs a
  // texture to work from. Straight to the screen when both are idle.
  let rtComp = new THREE.WebGLRenderTarget(width, height, { depthBuffer: false, stencilBuffer: false, type: THREE.HalfFloatType });
  const fxRack = createFxRack(THREE, renderer, width, height);

  // Shared reflection environment for the chrome scenes — the no-asset
  // stand-in for theDAW's EXR: a PMREM-filtered RoomEnvironment, generated
  // once and handed to scenes through ctx.environment.
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();

  // Per-scene bloom (theDAW's UnrealBloomPass). Scenes request it through
  // meta.bloom { strength, radius, threshold } or a live instance.bloom that
  // update() mutates; the engine crossfades strength with the scene mix.
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0, 0.4, 0.6);
  const copyMat = new THREE.MeshBasicMaterial({ map: rtComp.texture, depthTest: false, depthWrite: false });
  const copyScene = new THREE.Scene();
  copyScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), copyMat));

  // Fullscreen composite pass
  const compScene = new THREE.Scene();
  const compCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const compMat = new THREE.ShaderMaterial({
    uniforms: {
      tA: { value: rtA.texture },
      tB: { value: rtB.texture },
      uMix: { value: 0 },
      uMaster: { value: 1 },
      uFlash: { value: 0 },
    },
    glslVersion: THREE.GLSL3,
    vertexShader: /* glsl */ `
      out vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D tA, tB;
      uniform float uMix, uMaster, uFlash;
      in vec2 vUv;
      out vec4 fragColor;
      void main() {
        float a = cos(uMix * 1.5707963) ;
        float b = sin(uMix * 1.5707963);
        vec3 col = texture(tA, vUv).rgb * a * a + texture(tB, vUv).rgb * b * b;
        // gentle S-curve + master fader + beat flash headroom
        col = col * (1.0 + uFlash * 0.25);
        col = col / (1.0 + 0.35 * col);
        // subtle vignette keeps edges calm on projectors
        float vig = smoothstep(1.35, 0.45, length(vUv - 0.5) * 1.6);
        fragColor = vec4(col * uMaster * vig, 1.0);
      }`,
    depthTest: false,
    depthWrite: false,
  });
  compScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), compMat));

  // --- scene management --------------------------------------------------------

  const instances = new Map(); // id -> created scene
  const ctx = { THREE, renderer, width, height, quality: q, environment };

  function instance(id) {
    if (!instances.has(id)) {
      const create = creators[id];
      if (!create) throw new Error(`Unknown scene: ${id}`);
      instances.set(id, create({ ...ctx, width, height }));
    }
    return instances.get(id);
  }

  let slotA = null; // active scene id
  let slotB = null; // incoming scene id during a fade
  let mix = 0; // 0 = full A, 1 = full B
  let fading = false;
  let fadeTime = 4;

  function cutTo(id) {
    if (!creators[id]) return;
    slotA = id;
    slotB = null;
    mix = 0;
    fading = false;
  }

  function crossfadeTo(id, seconds) {
    if (seconds <= 0.12) return cutTo(id);
    if (id === slotA && !fading) return;
    if (fading) {
      // settle the current fade instantly, then start the new one
      slotA = mix > 0.5 ? slotB : slotA;
      mix = 0;
    }
    slotB = id;
    fading = true;
    fadeTime = Math.max(0.1, seconds);
  }

  // Cold scene instancing builds geometry and compiles shaders mid-frame, so
  // a project load queues its scenes here and the loop warms one per frame.
  const warmQueue = [];
  let warmResolvers = [];
  function prewarm(ids = autoVJ.pool) {
    for (const id of ids) {
      if (creators[id] && !instances.has(id) && !warmQueue.includes(id)) warmQueue.push(id);
    }
    if (!warmQueue.length) return Promise.resolve();
    return new Promise((resolve) => warmResolvers.push(resolve));
  }

  // --- Auto-VJ (VfxController pattern) ------------------------------------------

  const autoVJ = {
    enabled: true,
    pool: sceneList.map((s) => s.id),
    minHold: 18,
    maxHold: 40,
    fadeTime: 4,
    holdLeft: 8,
  };

  function autoVJTick(dt) {
    if (!autoVJ.enabled || fading || autoVJ.pool.length < 2) return;
    autoVJ.holdLeft -= dt;
    if (autoVJ.holdLeft <= 0) {
      const others = autoVJ.pool.filter((id) => id !== slotA);
      const next = others[(Math.random() * others.length) | 0];
      crossfadeTo(next, autoVJ.fadeTime);
      autoVJ.holdLeft = autoVJ.minHold + Math.random() * (autoVJ.maxHold - autoVJ.minHold);
    }
  }

  // --- io assembly ----------------------------------------------------------------

  const io = {
    level: 0,
    bands: { bass: 0, mid: 0, high: 0 },
    beat: 0,
    xy: { x: 0.5, y: 0.5 },
    gestures: { pulse: 0, press: 0, sway: 0 },
    knobs: new Array(8).fill(0.5),
    pads: new Array(16).fill(0),
    lastPad: -1,
    strike: 0, // max pad energy this frame — the strike dimension scenes morph on
    palette: colorMaster.palette,
    intensity: 1,
  };

  const stats = { fps: 0, frames: 0, acc: 0 };

  // Engine-level performance parameters. These used to be hardwired to knobs
  // 0/1/2 inside the frame loop; the assignment router writes them now, and
  // io.knobs keeps mirroring the raw hardware for scenes that read it.
  const params = { hue: 0, intensity: 0.5 };

  // The rack costs several fullscreen passes, so it stays out of the pipeline
  // until something actually enables it.
  let fxEnabled = false;

  // --- main loop --------------------------------------------------------------------

  let running = false;
  let last = 0;
  let audioEngine = null;
  let control = null;
  let frameHook = null; // fn(dt, t, io) — router/transport slot, same-frame

  function frame(now) {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    const t = now / 1000;

    stats.acc += dt;
    stats.frames++;
    if (stats.acc >= 0.5) {
      stats.fps = Math.round(stats.frames / stats.acc);
      stats.frames = 0;
      stats.acc = 0;
    }

    // pull inputs
    if (audioEngine) {
      audioEngine.update(dt);
      const a = audioEngine.state;
      io.level = a.level;
      io.bands.bass = a.bands.bass;
      io.bands.mid = a.bands.mid;
      io.bands.high = a.bands.high;
      io.beat = a.beat;
    }
    if (control) {
      io.xy.x += (control.xy.x - io.xy.x) * (1 - Math.exp(-dt * 14));
      io.xy.y += (control.xy.y - io.xy.y) * (1 - Math.exp(-dt * 14));
      io.gestures.pulse = control.gestures.pulse;
      io.gestures.press = control.gestures.press;
      io.gestures.sway = control.gestures.sway;
      for (let i = 0; i < 8; i++) io.knobs[i] = control.knobs[i];
      let strike = 0;
      for (let i = 0; i < 16; i++) {
        io.pads[i] = Math.max(io.pads[i] * Math.exp(-dt * 5), control.pads[i]);
        control.pads[i] = 0; // consume the hit; engine owns the decay
        if (io.pads[i] > strike) strike = io.pads[i];
      }
      io.strike = strike;
      io.lastPad = control.lastPad;
    }

    if (frameHook) frameHook(dt, t, io);

    colorMaster.update(dt, params.hue);
    io.intensity = 0.25 + params.intensity * 0.75 + io.gestures.pulse * 0.35;

    if (warmQueue.length) {
      const id = warmQueue.shift();
      try {
        const inst = instance(id);
        renderer.compile(inst.scene, inst.camera);
      } catch (err) {
        console.warn(`[engine] prewarm ${id} failed:`, err.message);
      }
      if (!warmQueue.length) {
        for (const resolve of warmResolvers) resolve();
        warmResolvers = [];
      }
    }

    autoVJTick(dt);

    // fade progress
    if (fading) {
      mix = Math.min(1, mix + dt / fadeTime);
      if (mix >= 1) {
        slotA = slotB;
        slotB = null;
        mix = 0;
        fading = false;
      }
    }

    // render A (and B mid-fade) into targets, then composite
    const a = slotA ? instance(slotA) : null;
    if (a) {
      a.update(dt, t, io);
      renderer.setRenderTarget(rtA);
      renderer.setClearColor(0x000000, 1);
      renderer.clear();
      renderer.render(a.scene, a.camera);
    }
    if (fading && slotB) {
      const b = instance(slotB);
      b.update(dt, t, io);
      renderer.setRenderTarget(rtB);
      renderer.clear();
      renderer.render(b.scene, b.camera);
    }
    compMat.uniforms.uMix.value = fading ? mix : 0;
    compMat.uniforms.uMaster.value = 1;
    compMat.uniforms.uFlash.value = io.beat;

    // Per-scene bloom, crossfaded with the scene mix. A live instance.bloom
    // (mutated in update()) wins over the static meta.bloom.
    const bloomA = bloomOf(slotA);
    const bloomB = fading ? bloomOf(slotB) : null;
    const wB = fading ? mix : 0;
    const strength = (bloomA ? bloomA.strength : 0) * (1 - wB) + (bloomB ? bloomB.strength : 0) * wB;
    const lead = wB > 0.5 ? bloomB || bloomA : bloomA || bloomB;
    const bloomOn = strength > 0.01 && lead;

    if (fxEnabled || bloomOn) {
      renderer.setRenderTarget(rtComp);
      renderer.clear();
      renderer.render(compScene, compCam);
      if (bloomOn) {
        bloomPass.strength = strength;
        bloomPass.radius = lead.radius ?? 0.4;
        bloomPass.threshold = lead.threshold ?? 0.6;
        bloomPass.render(renderer, null, rtComp, dt, false); // adds bloom into rtComp
      }
      renderer.setRenderTarget(null);
      if (fxEnabled) {
        fxRack.render(rtComp.texture, null, dt, io);
      } else {
        renderer.render(copyScene, compCam);
      }
    } else {
      renderer.setRenderTarget(null);
      renderer.render(compScene, compCam);
    }
  }

  function bloomOf(id) {
    if (!id) return null;
    const inst = instances.get(id);
    if (inst && inst.bloom) return inst.bloom;
    const m = sceneList.find((s) => s.id === id);
    return (m && m.bloom) || null;
  }

  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    if (!width || !height) return;
    const pr = renderer.getPixelRatio();
    renderer.setSize(width, height, false);
    rtA.setSize(width * pr, height * pr);
    rtB.setSize(width * pr, height * pr);
    rtComp.setSize(width * pr, height * pr);
    bloomPass.setSize(width, height);
    fxRack.resize(width * pr, height * pr);
    instances.forEach((s) => s.resize(width, height));
  }
  window.addEventListener('resize', resize);
  // The stage lives in a grid cell now, so its box changes without a window
  // resize (drawer, solo view, breakpoints). The window listener stays as a
  // no-op backstop; this is the one that actually fires.
  if (typeof ResizeObserver !== 'undefined') {
    new ResizeObserver(() => resize()).observe(canvas);
  }

  return {
    sceneList,
    stats,
    io,
    colorMaster,
    autoVJ,
    params,

    // --- effects rack (ported from the VJ-9000 decks) ---
    fx: fxRack,
    get fxEnabled() {
      return fxEnabled;
    },
    set fxEnabled(v) {
      fxEnabled = !!v;
    },
    setFxParam(key, value) {
      fxRack.setParam(key, value);
    },
    resetFx() {
      fxRack.reset();
    },

    attachAudio(engine) {
      audioEngine = engine;
    },
    attachControl(c) {
      control = c;
    },

    loadProject(project) {
      colorMaster.setPalette(project.palette, 2);
      autoVJ.pool = project.scenes.filter((id) => creators[id]);
      autoVJ.enabled = project.autoVJ ? !!project.autoVJ.enabled : true;
      if (project.autoVJ) {
        autoVJ.minHold = project.autoVJ.minHold ?? 18;
        autoVJ.maxHold = project.autoVJ.maxHold ?? 40;
        autoVJ.fadeTime = project.autoVJ.fadeTime ?? 4;
      }
      autoVJ.holdLeft = autoVJ.minHold;
      const first = (project.start && project.start.scene) || autoVJ.pool[0];
      slotA = null;
      fading = false;
      mix = 0;
      crossfadeTo(first, 0.8);
    },

    // .sway-format sibling of loadProject: takes a validated project object
    // and replays the fx snapshot through the rack so the file is never
    // trusted with raw parameter values.
    applyProject(project) {
      colorMaster.setPalette(project.palette, 2);
      const eng = project.engine || {};
      const av = eng.autoVJ || {};
      autoVJ.pool = (av.pool || []).filter((id) => creators[id]);
      autoVJ.enabled = !!av.enabled;
      autoVJ.minHold = av.minHold ?? 18;
      autoVJ.maxHold = av.maxHold ?? 40;
      autoVJ.fadeTime = av.fadeTime ?? 4;
      autoVJ.holdLeft = autoVJ.minHold;
      fxEnabled = !!eng.fxEnabled;
      fxRack.reset();
      for (const [key, value] of Object.entries((project.fx && project.fx.params) || {})) {
        fxRack.setParam(key, value);
      }
      const first = (eng.start && eng.start.scene) || autoVJ.pool[0];
      if (first) cutTo(creators[first] ? first : autoVJ.pool[0]);
      prewarm();
    },

    setScene(id, seconds = 2.5) {
      if (creators[id]) crossfadeTo(id, seconds);
    },
    cutTo,
    prewarm,
    setFrameHook(fn) {
      frameHook = typeof fn === 'function' ? fn : null;
    },
    nextScene(seconds = 2.5) {
      const others = autoVJ.pool.filter((id) => id !== slotA);
      if (others.length) crossfadeTo(others[(Math.random() * others.length) | 0], seconds);
    },
    get currentScene() {
      const id = fading && mix > 0.5 ? slotB : slotA;
      const meta = sceneList.find((s) => s.id === id);
      return meta || { id, name: id };
    },

    start() {
      if (running) return;
      running = true;
      resize();
      last = performance.now();
      requestAnimationFrame(frame);
    },
    stop() {
      running = false;
    },
    resize,
  };
}
