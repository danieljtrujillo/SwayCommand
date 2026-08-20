// The .sway project document — schema, defaults, validation, legacy conversion.
// Shared between the main process (CommonJS require) and the renderer bundle
// (esbuild interops the require form), so this file must stay dependency-free
// and must not touch fs, DOM, or Electron.
//
// A .sway file is one pretty-printed JSON document: header keys that mirror a
// .tasmo manifest (format / format_version / audio_mode / dates) plus a single
// `project` object. A future v2 can wrap the same two parts in a ZIP
// (manifest.json + project.json + audio/*) without renaming a key. Media is
// linked, never embedded, in v1: `project.media[]` is the only place file
// paths live, and pads and timeline clips reference media by id.

'use strict';

const FORMAT = 'sway';
const FORMAT_VERSION = 1;

const PALETTE_FALLBACK = ['#ff2d95', '#7a0bc0', '#2de1fc', '#f9f871', '#ff6b35'];
const GESTURE_SOURCES = ['xy:x', 'xy:y', 'gesture:pulse', 'gesture:press', 'gesture:sway'];
const TARGET_NAMESPACES = ['engine', 'fx', 'synth', 'sampler', 'transport'];
const PAD_ACTION_TYPES = ['sample', 'scene', 'fxPunch'];
const CURVES = ['linear', 'detent'];
const NOTE_ROUTING = ['always', 'unassigned', 'off'];
const SAMPLER_KNOB_TARGETS = ['sampler:master', 'sampler:cutoff', 'sampler:rate', 'sampler:send'];

const HEX_COLOR = /^#[0-9a-f]{6}$/i;

let uidCounter = 0;
function uid(prefix) {
  uidCounter = (uidCounter + 1) % 0xffff;
  return `${prefix}-${Date.now().toString(36)}${uidCounter.toString(36)}`;
}

// Knob defaults reproduce the behavior the engine used to hardwire (hue on 0,
// fade length on 1, intensity on 2) and give the sampler knobs their factory
// slots on the right cluster.
function defaultKnobs() {
  return [
    { target: 'engine:hue', min: 0, max: 1, curve: 'detent' },
    { target: 'engine:fadeTime', min: 1, max: 8, curve: 'linear' },
    { target: 'engine:intensity', min: 0, max: 1, curve: 'linear' },
    null,
    { target: 'sampler:master', min: 0, max: 1, curve: 'linear' },
    { target: 'sampler:cutoff', min: 0, max: 1, curve: 'linear' },
    { target: 'sampler:rate', min: 0, max: 1, curve: 'linear' },
    { target: 'sampler:send', min: 0, max: 1, curve: 'linear' },
  ];
}

function defaultAssignments() {
  return {
    version: 1,
    noteRouting: { synth: 'unassigned' },
    pads: new Array(16).fill(null),
    knobs: defaultKnobs(),
    // Slot = physical button index; the Sway's button CC numbers are not
    // published, so cc stays null until LEARN fills it.
    buttons: Array.from({ length: 8 }, () => ({ cc: null, channel: null, action: null })),
    gestures: [],
  };
}

function defaultProject() {
  return {
    format: FORMAT,
    format_version: FORMAT_VERSION,
    app_version: '',
    audio_mode: 'linked',
    created_at: null,
    modified_at: null,
    project: {
      meta: {
        id: 'untitled',
        name: 'Untitled',
        description: '',
        author: '',
        vibe: '',
        bpmHint: 0,
        pairsWith: null,
        template: false,
      },
      palette: PALETTE_FALLBACK.slice(),
      engine: {
        quality: 'med',
        fxEnabled: false,
        autoVJ: { enabled: true, pool: [], minHold: 18, maxHold: 40, fadeTime: 4 },
        start: { scene: null },
      },
      fx: { params: {} },
      synth: { enabled: true, preset: 'Init', patch: null },
      media: [],
      sampler: {
        kit: { version: 1, pads: new Array(16).fill(null) },
        knobs: { master: 0.5, cutoff: 0.5, rate: 0.5, send: 0.5 },
      },
      timeline: {
        loop: { enabled: false, start: 0, end: 0 },
        locators: [],
        tracks: [
          { id: 'audio-1', type: 'audio', name: 'Audio', gain: 1, muted: false, clips: [] },
          { id: 'visual-1', type: 'visual', name: 'Scenes', clips: [] },
        ],
      },
      assignments: defaultAssignments(),
      midiOverrides: {},
    },
  };
}

function parseTarget(str) {
  if (typeof str !== 'string') return null;
  const at = str.indexOf(':');
  if (at < 1) return null;
  const ns = str.slice(0, at);
  const key = str.slice(at + 1);
  if (!TARGET_NAMESPACES.includes(ns) || !key) return null;
  return { ns, key };
}

function applyCurve(curve, v) {
  // Curves map a 0..1 control position before the min/max range is applied.
  // 'detent' preserves the old knob-0 hue semantics: center = exactly zero.
  if (curve === 'detent') return Math.abs(v - 0.5) < 0.004 ? 0 : v;
  return v;
}

// --- validation --------------------------------------------------------------

function isObj(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function num(v, fallback, lo, hi) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  if (lo !== undefined && n < lo) return lo;
  if (hi !== undefined && n > hi) return hi;
  return n;
}

function str(v, fallback) {
  return typeof v === 'string' ? v : fallback;
}

function bool(v, fallback) {
  return typeof v === 'boolean' ? v : fallback;
}

// Fills every missing key with its default, clamps what it understands, and
// keeps keys it does not recognize so a newer minor version's data survives a
// round-trip. Never throws on content: problems land in `warnings`, matching
// the sampler.setKit posture. Structural rejection (wrong format, newer
// format_version) is the caller's job — see projectfile.readProject.
function validateProject(input) {
  const warnings = [];
  const doc = isObj(input) ? input : {};
  const out = { ...defaultProject(), ...doc };
  out.format = FORMAT;
  out.format_version = FORMAT_VERSION;
  out.audio_mode = 'linked';

  const dp = defaultProject().project;
  const p = (out.project = { ...dp, ...(isObj(doc.project) ? doc.project : {}) });

  p.meta = { ...dp.meta, ...(isObj(p.meta) ? p.meta : {}) };
  p.meta.name = str(p.meta.name, 'Untitled') || 'Untitled';
  p.meta.id = str(p.meta.id, 'untitled') || 'untitled';
  p.meta.bpmHint = num(p.meta.bpmHint, 0, 0, 999);
  p.meta.template = bool(p.meta.template, false);

  // Palette: exactly five hex entries; short arrays repeat cyclically the way
  // colormaster accepts them, junk falls back per slot.
  const rawPal = Array.isArray(p.palette) && p.palette.length ? p.palette : PALETTE_FALLBACK;
  p.palette = Array.from({ length: 5 }, (_, i) => {
    const c = rawPal[i % rawPal.length];
    if (typeof c === 'string' && HEX_COLOR.test(c)) return c.toLowerCase();
    warnings.push(`palette[${i}] is not a #rrggbb color; default used`);
    return PALETTE_FALLBACK[i];
  });

  p.engine = { ...dp.engine, ...(isObj(p.engine) ? p.engine : {}) };
  if (!['low', 'med', 'high'].includes(p.engine.quality)) p.engine.quality = 'med';
  p.engine.fxEnabled = bool(p.engine.fxEnabled, false);
  const av = (p.engine.autoVJ = { ...dp.engine.autoVJ, ...(isObj(p.engine.autoVJ) ? p.engine.autoVJ : {}) });
  av.enabled = bool(av.enabled, true);
  av.pool = (Array.isArray(av.pool) ? av.pool : []).filter((s) => typeof s === 'string');
  av.minHold = num(av.minHold, 18, 1, 3600);
  av.maxHold = num(av.maxHold, 40, av.minHold, 7200);
  av.fadeTime = num(av.fadeTime, 4, 0, 60);
  p.engine.start = { scene: str(isObj(p.engine.start) ? p.engine.start.scene : null, null) };

  p.fx = { params: isObj(p.fx) && isObj(p.fx.params) ? p.fx.params : {} };

  p.synth = { ...dp.synth, ...(isObj(p.synth) ? p.synth : {}) };
  p.synth.enabled = bool(p.synth.enabled, true);
  p.synth.preset = str(p.synth.preset, null);
  if (!isObj(p.synth.patch)) p.synth.patch = null;

  // Media table — the only path-bearing structure in the document.
  const mediaIds = new Set();
  p.media = (Array.isArray(p.media) ? p.media : []).filter((m) => {
    if (!isObj(m) || typeof m.id !== 'string' || !m.id || typeof m.path !== 'string' || !m.path) {
      warnings.push('media entry without id/path dropped');
      return false;
    }
    if (mediaIds.has(m.id)) {
      warnings.push(`duplicate media id ${m.id} dropped`);
      return false;
    }
    mediaIds.add(m.id);
    m.name = str(m.name, m.path.split(/[\\/]/).pop());
    m.sha256 = str(m.sha256, null);
    m.bytes = m.bytes == null ? null : num(m.bytes, null, 0);
    m.duration = m.duration == null ? null : num(m.duration, null, 0);
    return true;
  });

  p.sampler = { ...dp.sampler, ...(isObj(p.sampler) ? p.sampler : {}) };
  const kit = (p.sampler.kit = { version: 1, pads: [], ...(isObj(p.sampler.kit) ? p.sampler.kit : {}) });
  const rawPads = Array.isArray(kit.pads) ? kit.pads : [];
  kit.pads = Array.from({ length: 16 }, (_, i) => {
    const pad = rawPads[i];
    if (!isObj(pad)) return null;
    if (typeof pad.id !== 'string' || !mediaIds.has(pad.id)) {
      warnings.push(`kit pad ${i} references unknown media; cleared`);
      return null;
    }
    return {
      id: pad.id,
      gain: num(pad.gain, 1, 0, 4),
      pitch: num(pad.pitch, 1, 0.25, 4),
      loop: bool(pad.loop, false),
      chokeGroup: pad.chokeGroup == null ? null : String(pad.chokeGroup),
      mode: ['oneshot', 'loop', 'gate'].includes(pad.mode) ? pad.mode : 'oneshot',
    };
  });
  const kn = (p.sampler.knobs = { ...dp.sampler.knobs, ...(isObj(p.sampler.knobs) ? p.sampler.knobs : {}) });
  for (const k of ['master', 'cutoff', 'rate', 'send']) kn[k] = num(kn[k], 0.5, 0, 1);

  // Timeline: exactly one audio track and one visual track in v1.
  const tl = (p.timeline = { ...dp.timeline, ...(isObj(p.timeline) ? p.timeline : {}) });
  const loop = (tl.loop = { ...dp.timeline.loop, ...(isObj(tl.loop) ? tl.loop : {}) });
  loop.enabled = bool(loop.enabled, false);
  loop.start = num(loop.start, 0, 0);
  loop.end = num(loop.end, 0, 0);
  if (loop.end <= loop.start) loop.enabled = false;
  tl.locators = (Array.isArray(tl.locators) ? tl.locators : [])
    .filter((l) => isObj(l) && Number.isFinite(Number(l.time)))
    .map((l) => ({ id: str(l.id, uid('loc')), name: str(l.name, ''), time: num(l.time, 0, 0), color: str(l.color, null) }));

  const tracks = Array.isArray(tl.tracks) ? tl.tracks : [];
  const audioIn = tracks.find((t) => isObj(t) && t.type === 'audio') || dp.timeline.tracks[0];
  const visualIn = tracks.find((t) => isObj(t) && t.type === 'visual') || dp.timeline.tracks[1];
  const audioTrack = {
    id: str(audioIn.id, 'audio-1'),
    type: 'audio',
    name: str(audioIn.name, 'Audio'),
    gain: num(audioIn.gain, 1, 0, 2),
    muted: bool(audioIn.muted, false),
    clips: (Array.isArray(audioIn.clips) ? audioIn.clips : [])
      .filter((c) => {
        if (!isObj(c)) return false;
        if (typeof c.media !== 'string' || !mediaIds.has(c.media)) {
          warnings.push('audio clip references unknown media; dropped');
          return false;
        }
        return num(c.end, 0, 0) > num(c.start, 0, 0);
      })
      .map((c) => ({
        id: str(c.id, uid('c')),
        name: str(c.name, ''),
        media: c.media,
        start: num(c.start, 0, 0),
        end: num(c.end, 0, 0),
        offset: num(c.offset, 0, 0),
        gain: num(c.gain, 1, 0, 4),
        fadeIn: num(c.fadeIn, 0, 0, 60),
        fadeOut: num(c.fadeOut, 0, 0, 60),
      }))
      .sort((a, b) => a.start - b.start),
  };
  const visualTrack = {
    id: str(visualIn.id, 'visual-1'),
    type: 'visual',
    name: str(visualIn.name, 'Scenes'),
    clips: (Array.isArray(visualIn.clips) ? visualIn.clips : [])
      .filter((c) => isObj(c) && typeof c.scene === 'string' && num(c.end, 0, 0) > num(c.start, 0, 0))
      .map((c) => {
        const tr = isObj(c.transition) ? c.transition : {};
        return {
          id: str(c.id, uid('v')),
          scene: c.scene,
          start: num(c.start, 0, 0),
          end: num(c.end, 0, 0),
          transition: {
            type: tr.type === 'crossfade' ? 'crossfade' : 'cut',
            duration: num(tr.duration, 0, 0, 60),
          },
        };
      })
      .sort((a, b) => a.start - b.start),
  };
  tl.tracks = [audioTrack, visualTrack];

  // Assignments.
  const da = defaultAssignments();
  const asg = (p.assignments = { ...da, ...(isObj(p.assignments) ? p.assignments : {}) });
  asg.version = 1;
  const nr = isObj(asg.noteRouting) ? asg.noteRouting : {};
  asg.noteRouting = { synth: NOTE_ROUTING.includes(nr.synth) ? nr.synth : 'unassigned' };

  const rawPadA = Array.isArray(asg.pads) ? asg.pads : [];
  asg.pads = Array.from({ length: 16 }, (_, i) => {
    const a = rawPadA[i];
    if (!isObj(a) || !PAD_ACTION_TYPES.includes(a.type)) return null;
    if (a.type === 'sample') return { type: 'sample', pad: num(a.pad, i, 0, 15) };
    if (a.type === 'scene') {
      if (typeof a.scene !== 'string' || !a.scene) return null;
      const tr = isObj(a.transition) ? a.transition : {};
      return {
        type: 'scene',
        scene: a.scene,
        transition: { type: tr.type === 'crossfade' ? 'crossfade' : 'cut', duration: num(tr.duration, 0, 0, 60) },
      };
    }
    // fxPunch
    if (typeof a.param !== 'string' || !a.param) return null;
    return { type: 'fxPunch', param: a.param, value: num(a.value, 1) };
  });

  const rawKnobA = Array.isArray(asg.knobs) ? asg.knobs : [];
  asg.knobs = Array.from({ length: 8 }, (_, i) => {
    const a = rawKnobA[i];
    if (a === undefined) return da.knobs[i];
    if (!isObj(a)) return null;
    if (!parseTarget(a.target)) {
      warnings.push(`knob ${i} has an invalid target; cleared`);
      return null;
    }
    return {
      target: a.target,
      min: num(a.min, 0),
      max: num(a.max, 1),
      curve: CURVES.includes(a.curve) ? a.curve : 'linear',
    };
  });

  const rawBtnA = Array.isArray(asg.buttons) ? asg.buttons : [];
  asg.buttons = Array.from({ length: 8 }, (_, i) => {
    const b = rawBtnA[i];
    if (!isObj(b)) return { cc: null, channel: null, action: null };
    let action = null;
    if (isObj(b.action) && b.action.type === 'toggle' && parseTarget(b.action.target)) {
      action = { type: 'toggle', target: b.action.target };
    }
    return {
      cc: b.cc == null ? null : num(b.cc, null, 0, 127),
      channel: b.channel == null ? null : num(b.channel, null, 0, 15),
      action,
    };
  });

  asg.gestures = (Array.isArray(asg.gestures) ? asg.gestures : []).filter((g) => {
    if (!isObj(g) || !GESTURE_SOURCES.includes(g.source) || !parseTarget(g.target)) {
      warnings.push('gesture route with invalid source/target dropped');
      return false;
    }
    g.min = num(g.min, 0);
    g.max = num(g.max, 1);
    g.curve = CURVES.includes(g.curve) ? g.curve : 'linear';
    g.enabled = bool(g.enabled, true);
    return true;
  });

  p.midiOverrides = isObj(p.midiOverrides) ? p.midiOverrides : {};

  return { doc: out, warnings };
}

// --- legacy conversion -------------------------------------------------------

// Maps a legacy projects/<id>.json preset onto a full v1 document. Everything
// the legacy shape does not cover stays at defaults; the result is a template.
function legacyToSway(legacy) {
  const base = defaultProject();
  const p = base.project;
  p.meta.id = str(legacy.id, 'untitled');
  p.meta.name = str(legacy.name, p.meta.id);
  p.meta.description = str(legacy.description, '');
  p.meta.vibe = str(legacy.vibe, '');
  p.meta.bpmHint = num(legacy.bpmHint, 0, 0, 999);
  p.meta.pairsWith = str(legacy.pairsWith, null);
  p.meta.template = true;
  if (Array.isArray(legacy.palette) && legacy.palette.length) p.palette = legacy.palette;
  if (Array.isArray(legacy.scenes)) p.engine.autoVJ.pool = legacy.scenes.slice();
  const av = isObj(legacy.autoVJ) ? legacy.autoVJ : null;
  if (av) {
    p.engine.autoVJ.enabled = !!av.enabled;
    p.engine.autoVJ.minHold = num(av.minHold, 18, 1, 3600);
    p.engine.autoVJ.maxHold = num(av.maxHold, 40, 1, 7200);
    p.engine.autoVJ.fadeTime = num(av.fadeTime, 4, 0, 60);
  }
  p.engine.start.scene = isObj(legacy.start) ? str(legacy.start.scene, null) : null;
  return validateProject(base).doc;
}

module.exports = {
  FORMAT,
  FORMAT_VERSION,
  GESTURE_SOURCES,
  SAMPLER_KNOB_TARGETS,
  defaultProject,
  defaultAssignments,
  validateProject,
  legacyToSway,
  parseTarget,
  applyCurve,
  uid,
};
