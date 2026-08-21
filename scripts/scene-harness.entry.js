// Browser side of scripts/scene-harness.js: the scene registry and three.js,
// bundled by esbuild and loaded into a hidden Electron window. Exposes
// window.__h — init(width, height, tier) builds the renderer and the creation
// context the engine would pass (docs/SCENE_CONTRACT.md); run(id, frames, dt,
// patch) drives one scene's update() for a number of frames with a patched
// io snapshot, renders, times a few frames, and returns the still as a PNG
// data URL. Shader compile errors surface through the console hooks.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { creators, sceneList } from '../src/renderer/engine/scenes/index.js';

const logs = [];
for (const k of ['error', 'warn']) {
  const orig = console[k].bind(console);
  console[k] = (...a) => {
    logs.push(`${k[0].toUpperCase()}: ${a.map((x) => String((x && x.message) || x)).join(' ').slice(0, 2000)}`);
    orig(...a);
  };
}

const TIERS = { low: 8000, med: 30000, high: 80000 };
const instances = new Map();
let renderer = null;
let ctx = null;
let io = null;
let t = 0;

function init(width, height, tier = 'med') {
  const canvas = document.getElementById('c');
  canvas.width = width;
  canvas.height = height;
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  pmrem.dispose();
  ctx = { THREE, renderer, width, height, quality: { tier, particles: TIERS[tier] || TIERS.med }, environment };
  io = {
    level: 0,
    bands: { bass: 0, mid: 0, high: 0 },
    beat: 0,
    xy: { x: 0.5, y: 0.5 },
    gestures: { pulse: 0, press: 0, sway: 0 },
    knobs: new Array(8).fill(0.5),
    pads: new Array(16).fill(0),
    lastPad: -1,
    strike: 0,
    palette: ['#f2c9a6', '#5b3f9e', '#bfefff', '#ffb26b', '#e88aa8'].map((c) => new THREE.Color(c)),
    intensity: 1,
  };
  return sceneList.map((s) => s.id);
}

function instance(id) {
  if (!instances.has(id)) {
    const create = creators[id];
    if (!create) throw new Error(`Unknown scene: ${id}`);
    const inst = create({ ...ctx });
    instances.set(id, inst);
    renderer.compile(inst.scene, inst.camera);
  }
  return instances.get(id);
}

function applyPatch(patch) {
  if (!patch) return;
  if (patch.palette) patch.palette.forEach((c, i) => io.palette[i].set(c));
  if (patch.knobs) for (const [k, v] of Object.entries(patch.knobs)) io.knobs[Number(k)] = v;
  if (patch.xy) Object.assign(io.xy, patch.xy);
  if (patch.gestures) Object.assign(io.gestures, patch.gestures);
  if (patch.bands) Object.assign(io.bands, patch.bands);
  if ('level' in patch) io.level = patch.level;
  if ('beat' in patch) io.beat = patch.beat;
  if ('intensity' in patch) io.intensity = patch.intensity;
}

// frames of update() with the patched io; a strike lands on the first frame
// and decays as the engine decays it; then one render, then a timed burst
function run(id, frames, dt, patch) {
  const inst = instance(id);
  applyPatch(patch);
  const strikePad = patch && patch.strike != null ? patch.strike : -1;
  const t0 = performance.now();
  for (let f = 0; f < frames; f++) {
    if (strikePad >= 0) {
      io.pads[strikePad] = f === 0 ? 1 : io.pads[strikePad] * Math.exp(-dt * 5);
      io.lastPad = strikePad;
    }
    let s = 0;
    for (let i = 0; i < 16; i++) if (io.pads[i] > s) s = io.pads[i];
    io.strike = s;
    inst.update(dt, t, io);
    t += dt;
  }
  const updateMs = (performance.now() - t0) / Math.max(1, frames);
  const gl = renderer.getContext();
  renderer.setRenderTarget(null);
  renderer.setClearColor(0x000000, 1);
  renderer.clear();
  inst.update(dt, t, io);
  t += dt;
  renderer.render(inst.scene, inst.camera);
  gl.finish();
  const N = 20;
  const t2 = performance.now();
  for (let f = 0; f < N; f++) {
    inst.update(dt, t, io);
    t += dt;
    renderer.render(inst.scene, inst.camera);
  }
  gl.finish();
  const msPerFrame = (performance.now() - t2) / N;
  for (let i = 0; i < 16; i++) io.pads[i] = 0;
  io.strike = 0;
  return { updateMs, msPerFrame, png: renderer.domElement.toDataURL('image/png') };
}

window.__h = { init, run, logs, ids: () => sceneList.map((s) => s.id) };
