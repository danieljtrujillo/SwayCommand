// AKSWAYJ renderer shell — three screens:
//   boot     the Doctor: system checks + one-click fixes
//   projects official project picker
//   perform  the show: engine canvas + HUD
// Design goal: a user who double-clicked the installer reaches "playing"
// with exactly one more click (or zero, via ?autoplay=).

import { createEngine } from './engine/engine.js';
import { createAudioEngine } from './engine/audio.js';
import { createMidi } from './midi/midi.js';
import { renderMarkdown, slugify } from './markdown.js';
import { createSampler } from './audio/sampler.js';
import { createSynth, PRESET_NAMES, TABLE_NAMES, MOD_SOURCES, MOD_DESTS } from './audio/synth.js';
import { RANGES as fxRanges, DECKS as fxDecks } from './engine/fxrack.js';
import { createTransport } from './audio/transport.js';
import { createProjectStore } from './project/projectstore.js';

const $ = (sel) => document.querySelector(sel);

const state = {
  screen: 'boot',
  docs: [],
  currentDoc: null,
  docsReturnScreen: 'boot',
  studioReturnScreen: 'boot',
  sampler: null,
  synth: null,
  synthEnabled: true,
  projects: [],
  project: null,
  checks: [],
  midi: null,
  audio: null,
  engine: null,
  helpVisible: false,
  monitorVisible: false,
};

// ---------------------------------------------------------------- screens

function show(screen) {
  state.screen = screen;
  for (const s of ['boot', 'projects', 'studio', 'docs', 'perform']) {
    $(`#screen-${s}`).classList.toggle('active', s === screen);
  }
  if (screen === 'perform') state.engine.resize();
}

// ---------------------------------------------------------------- boot / doctor

const STATUS_ICON = { ok: '●', warn: '▲', fail: '✕', info: '○' };

function renderChecks() {
  const list = $('#check-list');
  list.innerHTML = state.checks
    .map(
      (c) => `
    <li class="check ${c.status}">
      <span class="check-icon">${STATUS_ICON[c.status] || '○'}</span>
      <div class="check-body">
        <div class="check-label">${c.label}</div>
        <div class="check-detail">${c.detail}</div>
        <div class="check-progress" id="progress-${c.id}"></div>
      </div>
      ${c.fix ? `<button class="btn btn-fix" data-fix="${c.fix.id}" data-check="${c.id}">${c.fix.label}</button>` : ''}
    </li>`
    )
    .join('');
}

async function rendererChecks() {
  const checks = [];

  // WebGL2
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2');
    const info = gl ? gl.getParameter(gl.RENDERER) : null;
    checks.push(
      gl
        ? { id: 'gpu', label: 'Graphics (WebGL2)', status: 'ok', detail: `Ready — ${info}.` }
        : { id: 'gpu', label: 'Graphics (WebGL2)', status: 'fail', detail: 'WebGL2 unavailable. Update your GPU drivers.' }
    );
  } catch (e) {
    checks.push({ id: 'gpu', label: 'Graphics (WebGL2)', status: 'fail', detail: e.message });
  }

  // MIDI
  if (state.midi.available) {
    const c = state.midi.control;
    checks.push({
      id: 'midi',
      label: 'MIDI',
      status: 'ok',
      detail: c.isSway
        ? `Sway online: “${c.portName}” — factory map armed.`
        : c.connected
          ? `No Sway yet, but listening on: ${c.portName}. Incoming CC and note messages are matched against the Sway factory map; bindings can be overridden in settings.json.`
          : 'No MIDI devices right now. Hot-plug any time — mouse & keyboard are fully mapped meanwhile.',
    });
  } else {
    checks.push({ id: 'midi', label: 'MIDI', status: 'warn', detail: 'WebMIDI unavailable — mouse & keyboard control still work.' });
  }

  // Audio inputs
  try {
    const inputs = await state.audio.listInputs();
    checks.push({
      id: 'audio',
      label: 'Audio input',
      status: 'ok',
      detail: inputs.length
        ? `${inputs.length} input(s) found — visuals will follow the music. No input? The internal groove takes over.`
        : 'No audio inputs — the internal groove (silent, analysis-only) will drive the visuals.',
    });
  } catch {
    checks.push({ id: 'audio', label: 'Audio input', status: 'info', detail: 'Could not enumerate inputs; the internal groove will drive the visuals.' });
  }

  return checks;
}

async function runDoctor() {
  $('#boot-status').textContent = 'Checking your system…';
  const [main, local] = await Promise.all([window.akswayj.doctor.run(), rendererChecks()]);
  state.checks = [...main, ...local];
  renderChecks();

  const worst = state.checks.some((c) => c.status === 'fail')
    ? 'fail'
    : state.checks.some((c) => c.status === 'warn')
      ? 'warn'
      : 'ok';
  $('#boot-status').textContent =
    worst === 'ok'
      ? 'All clear. Pick a project and play.'
      : worst === 'warn'
        ? 'Playable now — a couple of notes above.'
        : 'Something needs attention above — you can still continue.';
  const enter = $('#btn-enter');
  enter.disabled = false;
  enter.focus();
  if (worst === 'ok' && !state._autoAdvanced) {
    state._autoAdvanced = true;
    setTimeout(() => state.screen === 'boot' && show('projects'), 1400);
  }
}

function wireDoctor() {
  window.akswayj.doctor.onFixProgress(({ fixId, phase, pct }) => {
    const check = state.checks.find((c) => c.fix && c.fix.id === fixId);
    if (!check) return;
    const el = $(`#progress-${check.id}`);
    if (el) el.textContent = phase === 'download' ? `downloading… ${pct || 0}%` : `${phase}…`;
  });

  $('#check-list').addEventListener('click', async (e) => {
    const btn = e.target.closest('[data-fix]');
    if (!btn) return;
    btn.disabled = true;
    btn.textContent = 'Working…';
    const result = await window.akswayj.doctor.fix(btn.dataset.fix);
    const check = state.checks.find((c) => c.id === btn.dataset.check);
    if (check) {
      check.detail = result.detail;
      check.status = result.ok ? 'ok' : 'warn';
      if (result.ok) check.fix = null;
    }
    renderChecks();
    if (result.ok) runDoctor(); // re-verify the whole picture
  });

  $('#btn-enter').addEventListener('click', () => show('projects'));
  $('#btn-recheck').addEventListener('click', runDoctor);
}

// ---------------------------------------------------------------- projects

function renderProjects() {
  $('#project-grid').innerHTML = state.projects
    .map(
      (p) => `
    <article class="card" data-project="${p.id}" tabindex="0">
      <div class="card-swatches">${p.palette.map(() => '<i></i>').join('')}</div>
      <h3>${p.name}</h3>
      <div class="card-meta">
        <span class="pill">${p.vibe}</span>
        ${p.bpmHint ? `<span class="pill">${p.bpmHint} BPM</span>` : ''}
        ${p.pairsWith ? `<span class="pill pill-pair" title="${p.pairsWith}">pairs with Audima demo</span>` : ''}
      </div>
      <p>${p.description}</p>
      <div class="card-go">PLAY&nbsp;→</div>
    </article>`
    )
    .join('');

  // Swatch colors via CSSOM — the page CSP (rightly) blocks markup-inline styles.
  for (const card of document.querySelectorAll('#project-grid .card')) {
    const p = state.projects.find((x) => x.id === card.dataset.project);
    card.querySelectorAll('.card-swatches i').forEach((el, i) => {
      el.style.background = p.palette[i % p.palette.length];
    });
  }
}

function wireProjects() {
  const grid = $('#project-grid');
  const open = (el) => {
    const p = state.projects.find((x) => x.id === el.dataset.project);
    if (p) startPerformance(p);
  };
  grid.addEventListener('click', (e) => {
    const card = e.target.closest('[data-project]');
    if (card) open(card);
  });
  grid.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const card = e.target.closest('[data-project]');
      if (card) open(card);
    }
  });
}

// ---------------------------------------------------------------- studio
// Audio source selection and the pad kit builder. Both live here because they
// are two halves of one job: deciding what the application listens to, and
// what it plays back.

const studio = {
  sources: [],
  selectedSample: null,
  selectedPad: 0,
  systemAudio: { supported: false, detail: '' },
};

async function openStudio() {
  if (state.screen !== 'studio') state.studioReturnScreen = state.screen;
  show('studio');
  if (!studio.systemAudio.detail) {
    studio.systemAudio = await window.akswayj.platform.systemAudio();
    $('#system-audio-note').textContent = studio.systemAudio.detail;
  }
  await refreshSources();
  renderSamples();
  renderPads();
  renderSynthPanel();
  renderFxPanel();
}

function returnFromStudio() {
  const target = state.studioReturnScreen || 'boot';
  show(target);
  if (target === 'perform') state.engine.start();
}

async function refreshSources() {
  let inputs = [];
  try {
    inputs = await state.audio.listInputs();
  } catch {
    inputs = [];
  }
  studio.sources = inputs;

  const rows = [];
  rows.push(
    `<li><button data-src="system" ${studio.systemAudio.supported ? '' : 'disabled'}>System audio (loopback)<span>${
      studio.systemAudio.supported ? 'Everything playing on this computer' : 'Windows only on this platform'
    }</span></button></li>`
  );
  for (const d of inputs) {
    rows.push(`<li><button data-src="input" data-id="${d.id}">${d.label}<span>Input device</span></button></li>`);
  }
  rows.push('<li><button data-src="internal">Internal groove<span>Silent 120 BPM analysis signal</span></button></li>');
  $('#source-list').innerHTML = rows.join('');
  markCurrentSource();
}

function markCurrentSource() {
  const a = state.audio.state;
  for (const btn of document.querySelectorAll('#source-list button')) {
    const kind = btn.dataset.src;
    const isCurrent =
      (kind === 'system' && a.source === 'system') ||
      (kind === 'internal' && a.source === 'internal') ||
      (kind === 'input' && a.source === 'input' && a.deviceId === btn.dataset.id);
    btn.classList.toggle('current', isCurrent);
  }
  $('#studio-source').textContent = a.deviceLabel || a.source || '—';
}

async function selectSource(kind, id) {
  try {
    if (kind === 'system') await state.audio.useSystemAudio();
    else if (kind === 'input') await state.audio.useInput(id);
    else {
      state.audio.releaseInput();
      state.audio.startInternal();
    }
  } catch (err) {
    $('#system-audio-note').textContent = `Could not switch source: ${err.message}`;
  }
  markCurrentSource();
}

// --- kit builder -------------------------------------------------------------

function renderSamples() {
  const list = state.sampler ? state.sampler.listSamples() : [];
  $('#sample-list').innerHTML = list.length
    ? list
        .map(
          (s) =>
            `<button data-sample="${s.id}"${s.id === studio.selectedSample ? ' class="current"' : ''}>${s.name}<em>${s.duration.toFixed(2)} s · ${s.channels}ch</em></button>`
        )
        .join('')
    : '<li style="color:var(--info);font-size:12px">No samples loaded.</li>';
}

function renderPads() {
  const kit = state.sampler ? state.sampler.getKit() : { pads: [] };
  const samples = state.sampler ? state.sampler.listSamples() : [];
  const nameOf = (id) => {
    const s = samples.find((x) => x.id === id);
    return s ? s.name : '';
  };
  const cells = [];
  for (let i = 0; i < 16; i++) {
    const pad = kit.pads && kit.pads[i];
    const filled = pad && pad.id;
    cells.push(
      `<div class="pad${filled ? ' filled' : ''}${i === studio.selectedPad ? ' selected' : ''}" data-pad="${i}" id="pad-${i}">
        <b>${i + 1}</b><span>${filled ? nameOf(pad.id) : ''}</span>
      </div>`
    );
  }
  $('#pad-grid').innerHTML = cells.join('');
  $('#pad-selected').textContent = `· pad ${studio.selectedPad + 1}`;

  const pad = kit.pads && kit.pads[studio.selectedPad];
  $('#pad-mode').value = (pad && pad.mode) || 'oneshot';
  $('#pad-gain').value = pad && typeof pad.gain === 'number' ? pad.gain : 1;
  $('#pad-choke').value = pad && pad.chokeGroup !== null && pad.chokeGroup !== undefined ? pad.chokeGroup : '';
}

function padOptions() {
  const choke = $('#pad-choke').value;
  return {
    mode: $('#pad-mode').value,
    gain: Number($('#pad-gain').value),
    chokeGroup: choke === '' ? null : Number(choke),
  };
}

async function addSamples() {
  const note = $('#kit-note');
  let picked;
  try {
    picked = await window.akswayj.files.pickAudio();
  } catch (err) {
    note.textContent = `File dialog failed: ${err.message}`;
    return;
  }
  if (!picked.length) return;

  let loaded = 0;
  const failures = [];
  for (const file of picked) {
    note.textContent = `Loading ${file.name}…`;
    try {
      const bytes = await window.akswayj.files.readAudio(file.path);
      // The IPC layer delivers a Uint8Array view; decodeAudioData needs its
      // own ArrayBuffer, and the view may not span the whole buffer.
      const copy = bytes.slice().buffer;
      await state.sampler.loadSample(file.path, copy, { name: file.name });
      loaded++;
    } catch (err) {
      failures.push(`${file.name}: ${err.message}`);
    }
  }
  note.textContent = failures.length
    ? `Loaded ${loaded}. Failed: ${failures.join('; ')}`
    : `Loaded ${loaded} sample${loaded === 1 ? '' : 's'}.`;
  renderSamples();
  renderPads();
}

function flashPad(index) {
  const el = document.getElementById(`pad-${index}`);
  if (!el) return;
  el.classList.add('hit');
  setTimeout(() => el.classList.remove('hit'), 110);
}

async function saveKit() {
  const kit = state.sampler.getKit();
  const samples = state.sampler.listSamples().map((s) => ({ id: s.id, name: s.name }));
  await window.akswayj.settings.set({ kit: { ...kit, samples } });
  $('#kit-note').textContent = 'Kit saved. It reloads automatically at startup.';
}

// Re-reads every sample file the saved kit references, then restores the pads.
async function restoreKit(saved) {
  if (!saved || !saved.samples || !saved.samples.length) return;
  const missing = [];
  for (const s of saved.samples) {
    try {
      const bytes = await window.akswayj.files.readAudio(s.id);
      await state.sampler.loadSample(s.id, bytes.slice().buffer, { name: s.name });
    } catch {
      missing.push(s.name);
    }
  }
  state.sampler.setKit(saved);
  if (missing.length) {
    console.warn('[kit] missing sample files:', missing.join(', '));
  }
}

// --- synth -------------------------------------------------------------------
// Controls are generated from the synth's own control manifest, which is in
// theDAW's VisualControl shape, so the same manifest can drive theDAW's mapper.

// Only the groups worth surfacing live; the manifest carries more.
const SYNTH_GROUPS = ['OSC1', 'OSC2', 'FILTER1', 'ENV1', 'LFO', 'FX', 'GLOBAL'];

// Two octaves from C3, in the standard tracker layout.
const KEY_ROW = [
  ['a', 48], ['w', 49], ['s', 50], ['e', 51], ['d', 52], ['f', 53], ['t', 54],
  ['g', 55], ['y', 56], ['h', 57], ['u', 58], ['j', 59],
  ['k', 60], ['o', 61], ['l', 62], ['p', 63], [';', 64],
];
const heldKeys = new Set();

function renderSynthPanel() {
  const synth = state.synth;
  const manifest = synth.controlManifest();

  $('#synth-preset').innerHTML = PRESET_NAMES.map(
    (n) => `<option value="${n}"${n === synth.patch.name ? ' selected' : ''}>${n}</option>`
  ).join('');

  const html = [];
  for (const group of SYNTH_GROUPS) {
    const rows = [];
    // Wavetable choice is a list, not a range, so it is added by hand.
    if (group === 'OSC1' || group === 'OSC2') {
      const osc = group.toLowerCase();
      const cur = synth.getParam(`${osc}.table`);
      rows.push(
        `<label class="fx-row"><select data-synthsel="${osc}.table">${TABLE_NAMES.map(
          (t) => `<option value="${t}"${t === cur ? ' selected' : ''}>${t}</option>`
        ).join('')}</select><span>table</span></label>`
      );
    }
    for (const c of manifest) {
      if (c.group !== group) continue;
      const value = synth.getParam(c.key);
      if (c.kind === 'toggle') {
        rows.push(
          `<label class="fx-row"><input type="checkbox" data-synth="${c.key}"${value ? ' checked' : ''}><span>${c.label}</span></label>`
        );
      } else {
        rows.push(
          `<label class="fx-row"><input type="range" data-synth="${c.key}" min="${c.min}" max="${c.max}" step="${c.step}" value="${value}"><span>${c.label} <b data-synthval="${c.key}">${Number(value).toFixed(3)}</b></span></label>`
        );
      }
    }
    if (rows.length) html.push(`<div class="fx-deck"><div class="kit-label">${group}</div>${rows.join('')}</div>`);
  }
  $('#synth-decks').innerHTML = html.join('');

  // on-screen keyboard
  $('#synth-keys').innerHTML = KEY_ROW.map(([key, note]) => {
    const sharp = [1, 3, 6, 8, 10].includes(note % 12);
    return `<button class="skey${sharp ? ' sharp' : ''}" data-note="${note}"><b>${key}</b></button>`;
  }).join('');

  renderModMatrix();
}

function renderModMatrix() {
  const rows = state.synth.getMatrix();
  $('#mod-rows').innerHTML = rows
    .map(
      (r, i) => `<div class="mod-row">
        <select data-mod="${i}" data-field="source">${MOD_SOURCES.map((s) => `<option${s === r.source ? ' selected' : ''}>${s}</option>`).join('')}</select>
        <span>→</span>
        <select data-mod="${i}" data-field="dest">${MOD_DESTS.map((d) => `<option${d === r.dest ? ' selected' : ''}>${d}</option>`).join('')}</select>
        <input type="range" data-mod="${i}" data-field="amount" min="-1" max="1" step="0.01" value="${r.amount}">
        <b>${r.amount.toFixed(2)}</b>
        <button class="btn btn-ghost btn-small" data-mod-del="${i}">✕</button>
      </div>`
    )
    .join('');
}

function wireSynth() {
  $('#synth-enable').addEventListener('change', (e) => {
    state.synthEnabled = e.target.checked;
    if (!state.synthEnabled) state.synth.allNotesOff();
  });

  $('#synth-preset').addEventListener('change', (e) => {
    state.synth.loadPreset(e.target.value);
    renderSynthPanel();
  });

  $('#synth-decks').addEventListener('input', (e) => {
    const el = e.target.closest('[data-synth], [data-synthsel]');
    if (!el) return;
    const key = el.dataset.synth || el.dataset.synthsel;
    const value =
      el.type === 'checkbox' ? el.checked : el.tagName === 'SELECT' ? el.value : Number(el.value);
    state.synth.setParam(key, value);
    const readout = document.querySelector(`[data-synthval="${key}"]`);
    if (readout) readout.textContent = Number(value).toFixed(3);
  });

  $('#mod-rows').addEventListener('input', (e) => {
    const el = e.target.closest('[data-mod]');
    if (!el) return;
    const rows = state.synth.getMatrix();
    const i = Number(el.dataset.mod);
    if (!rows[i]) return;
    rows[i][el.dataset.field] = el.dataset.field === 'amount' ? Number(el.value) : el.value;
    state.synth.setMatrix(rows);
    renderModMatrix();
  });
  $('#mod-rows').addEventListener('click', (e) => {
    const del = e.target.closest('[data-mod-del]');
    if (!del) return;
    const rows = state.synth.getMatrix();
    rows.splice(Number(del.dataset.modDel), 1);
    state.synth.setMatrix(rows);
    renderModMatrix();
  });
  $('#btn-mod-add').addEventListener('click', () => {
    const rows = state.synth.getMatrix();
    rows.push({ source: 'lfo1', dest: 'filter1.cutoff', amount: 0.3 });
    state.synth.setMatrix(rows);
    renderModMatrix();
  });

  // on-screen keyboard: pointer plays, release stops
  const keys = $('#synth-keys');
  keys.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('[data-note]');
    if (!b) return;
    b.classList.add('down');
    state.synth.noteOn(Number(b.dataset.note), 0.85);
  });
  const releaseAll = () => {
    for (const b of keys.querySelectorAll('.down')) {
      b.classList.remove('down');
      state.synth.noteOff(Number(b.dataset.note));
    }
  };
  keys.addEventListener('pointerup', releaseAll);
  keys.addEventListener('pointerleave', releaseAll);
  window.addEventListener('blur', releaseAll);
}

// The computer keyboard plays the synth only while the Studio is open, so it
// never fights the perform-screen shortcuts.
function studioKeyDown(e) {
  if (state.screen !== 'studio' || e.repeat) return false;
  if (/^(input|select|textarea)$/i.test(e.target.tagName)) return false;
  const entry = KEY_ROW.find(([k]) => k === e.key.toLowerCase());
  if (!entry) return false;
  if (heldKeys.has(entry[1])) return true;
  heldKeys.add(entry[1]);
  state.synth.noteOn(entry[1], 0.85);
  const btn = document.querySelector(`[data-note="${entry[1]}"]`);
  if (btn) btn.classList.add('down');
  return true;
}

function studioKeyUp(e) {
  const entry = KEY_ROW.find(([k]) => k === e.key.toLowerCase());
  if (!entry || !heldKeys.has(entry[1])) return;
  heldKeys.delete(entry[1]);
  state.synth.noteOff(entry[1]);
  const btn = document.querySelector(`[data-note="${entry[1]}"]`);
  if (btn) btn.classList.remove('down');
}

// --- effects rack ------------------------------------------------------------
// Controls are generated from the rack's own RANGES table and DECKS grouping,
// so the panel cannot drift out of step with what setParam actually accepts.

function renderFxPanel() {
  const rack = state.engine.fx;
  const ranges = fxRanges;
  const html = [];
  for (const deck of fxDecks) {
    const rows = [];
    for (const key of deck.keys) {
      const spec = ranges[key];
      if (spec === undefined || !(key in rack.params)) continue; // rack owns the truth
      const value = rack.params[key];
      if (spec === true) {
        rows.push(
          `<label class="fx-row"><input type="checkbox" data-fx="${key}"${value ? ' checked' : ''}><span>${key}</span></label>`
        );
      } else if (spec === 'hex') {
        rows.push(`<label class="fx-row"><input type="color" data-fx="${key}" value="${value}"><span>${key}</span></label>`);
      } else if (Array.isArray(spec)) {
        const [min, max] = spec;
        const step = Number.isInteger(min) && Number.isInteger(max) && max - min >= 4 ? 1 : (max - min) / 200;
        rows.push(
          `<label class="fx-row"><input type="range" data-fx="${key}" min="${min}" max="${max}" step="${step}" value="${value}"><span>${key} <b data-fxval="${key}">${(+value).toFixed(2)}</b></span></label>`
        );
      }
    }
    if (rows.length) html.push(`<div class="fx-deck"><div class="kit-label">${deck.name}</div>${rows.join('')}</div>`);
  }
  $('#fx-decks').innerHTML = html.join('');
  $('#fx-enable').checked = state.engine.fxEnabled;
}

function wireFx() {
  $('#fx-enable').addEventListener('change', (e) => {
    state.engine.fxEnabled = e.target.checked;
  });
  $('#btn-fx-reset').addEventListener('click', () => {
    state.engine.resetFx();
    renderFxPanel();
  });
  $('#fx-decks').addEventListener('input', (e) => {
    const el = e.target.closest('[data-fx]');
    if (!el) return;
    const key = el.dataset.fx;
    const value = el.type === 'checkbox' ? el.checked : el.type === 'color' ? el.value : Number(el.value);
    state.engine.setFxParam(key, value);
    const readout = document.querySelector(`[data-fxval="${key}"]`);
    if (readout) readout.textContent = Number(value).toFixed(2);
  });
}

function wireStudio() {
  for (const btn of document.querySelectorAll('[data-open-studio]')) {
    btn.addEventListener('click', () => openStudio());
  }
  $('#btn-studio-close').addEventListener('click', returnFromStudio);

  $('#source-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-src]');
    if (btn && !btn.disabled) selectSource(btn.dataset.src, btn.dataset.id);
  });
  $('#btn-refresh-sources').addEventListener('click', refreshSources);

  $('#btn-add-samples').addEventListener('click', addSamples);
  $('#btn-save-kit').addEventListener('click', saveKit);
  $('#btn-clear-pad').addEventListener('click', () => {
    state.sampler.clearPad(studio.selectedPad);
    renderPads();
  });

  $('#sample-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-sample]');
    if (!btn) return;
    studio.selectedSample = btn.dataset.sample;
    renderSamples();
  });

  // Clicking a pad assigns the selected sample, or auditions an assigned pad.
  $('#pad-grid').addEventListener('click', (e) => {
    const cell = e.target.closest('[data-pad]');
    if (!cell) return;
    const index = Number(cell.dataset.pad);
    studio.selectedPad = index;
    const kit = state.sampler.getKit();
    const assigned = kit.pads && kit.pads[index] && kit.pads[index].id;
    if (studio.selectedSample && studio.selectedSample !== assigned) {
      state.sampler.assignPad(index, studio.selectedSample, padOptions());
    } else if (assigned) {
      state.sampler.trigger(index, 0.9);
      flashPad(index);
    }
    renderPads();
  });

  for (const id of ['#pad-mode', '#pad-gain', '#pad-choke']) {
    $(id).addEventListener('change', () => {
      const kit = state.sampler.getKit();
      const pad = kit.pads && kit.pads[studio.selectedPad];
      if (pad && pad.id) state.sampler.assignPad(studio.selectedPad, pad.id, padOptions());
    });
  }
}

// ---------------------------------------------------------------- documentation

// The viewer reads the Markdown that ships with the application, so the
// documentation is available offline and always matches the installed build.

async function openDocs(docId) {
  if (state.screen !== 'docs') state.docsReturnScreen = state.screen;
  if (!state.docs.length) {
    state.docs = await window.akswayj.docs.list();
    $('#docs-list').innerHTML = state.docs
      .map((d) => `<li><button data-doc="${d.id}">${d.title}</button></li>`)
      .join('');
  }
  show('docs');
  await loadDoc(docId || state.currentDoc || (state.docs[0] && state.docs[0].id));
}

async function loadDoc(docId, anchor) {
  if (!docId) return;
  const body = $('#docs-body');
  let source;
  try {
    source = await window.akswayj.docs.read(docId);
  } catch (err) {
    body.innerHTML = `<h1>Unavailable</h1><p>${docId} could not be read: ${err.message}</p>`;
    return;
  }
  state.currentDoc = docId;

  const { html, headings } = renderMarkdown(source);
  body.innerHTML = html;
  body.scrollTop = 0;

  for (const btn of document.querySelectorAll('#docs-list button')) {
    btn.classList.toggle('current', btn.dataset.doc === docId);
  }

  $('#docs-toc').innerHTML = headings
    .filter((h) => h.level > 1)
    .map((h) => `<li><button data-anchor="${h.id}" class="lvl-${h.level}">${h.text}</button></li>`)
    .join('');

  if (anchor) scrollToAnchor(anchor);
}

function scrollToAnchor(anchor) {
  const target = document.getElementById(anchor);
  if (target) target.scrollIntoView({ block: 'start', behavior: 'auto' });
}

let externalNoteTimer = null;
function showExternalNote(text) {
  let el = $('.docs-external-note');
  if (!el) {
    el = document.createElement('div');
    el.className = 'docs-external-note';
    document.body.appendChild(el);
  }
  el.textContent = text;
  clearTimeout(externalNoteTimer);
  externalNoteTimer = setTimeout(() => el.remove(), 6000);
}

// Documentation links fall into three classes: another bundled document,
// an anchor within the current one, or an external URL for the system browser.
async function followDocLink(href) {
  if (href.startsWith('#')) {
    scrollToAnchor(href.slice(1));
    return;
  }
  if (/^https?:/i.test(href)) {
    try {
      await window.akswayj.openExternal(href);
    } catch {
      showExternalNote(`Link not on the allowlist — open manually: ${href}`);
    }
    return;
  }

  const [rel, anchor] = href.split('#');
  const from = state.currentDoc || 'README.md';
  const baseDir = from.includes('/') ? from.slice(0, from.lastIndexOf('/')) : '';
  // Resolve the relative target against the current document's directory.
  const segments = (baseDir ? baseDir.split('/') : []).concat(rel.split('/'));
  const resolved = [];
  for (const seg of segments) {
    if (seg === '.' || seg === '') continue;
    if (seg === '..') resolved.pop();
    else resolved.push(seg);
  }
  const id = resolved.join('/');
  if (state.docs.some((d) => d.id === id)) {
    await loadDoc(id, anchor);
  } else if (anchor && !rel) {
    scrollToAnchor(anchor);
  } else {
    showExternalNote(`Not part of the bundled documentation: ${href}`);
  }
}

// Opening the docs from a performance stops the render loop, so returning
// restarts it rather than leaving a frozen stage.
function returnFromDocs() {
  const target = state.docsReturnScreen;
  show(target);
  if (target === 'perform') state.engine.start();
}

function wireDocs() {
  for (const btn of document.querySelectorAll('[data-open-docs]')) {
    btn.addEventListener('click', () => openDocs());
  }
  $('#btn-docs-close').addEventListener('click', returnFromDocs);

  $('#docs-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-doc]');
    if (btn) loadDoc(btn.dataset.doc);
  });
  $('#docs-toc').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-anchor]');
    if (btn) scrollToAnchor(btn.dataset.anchor);
  });
  $('#docs-body').addEventListener('click', (e) => {
    const link = e.target.closest('[data-href]');
    if (!link) return;
    e.preventDefault();
    followDocLink(link.dataset.href);
  });
}

// ---------------------------------------------------------------- perform

function startPerformance(project) {
  state.project = project;
  state.engine.loadProject(project);
  $('#hud-project').textContent = project.name;
  show('perform');
  state.engine.start();
  bumpHelpBar();
}

// Interim, replaced by the assignment router: mirror hardware knobs 0-2 onto
// the engine params they used to be hardwired to. Change-driven so an idle
// knob never stomps a project's fadeTime or a UI edit.
const knobShim = { last: null };
function applyKnobShim() {
  const k = state.midi.control.knobs;
  if (!knobShim.last) {
    knobShim.last = [k[0], k[1], k[2]];
    return;
  }
  if (k[0] !== knobShim.last[0]) {
    knobShim.last[0] = k[0];
    state.engine.params.hue = k[0] === 0.5 ? 0 : k[0];
  }
  if (k[1] !== knobShim.last[1]) {
    knobShim.last[1] = k[1];
    state.engine.autoVJ.fadeTime = 1 + k[1] * 7;
  }
  if (k[2] !== knobShim.last[2]) {
    knobShim.last[2] = k[2];
    state.engine.params.intensity = k[2];
  }
}

function updateHud() {
  applyKnobShim();
  if (state.transport) state.transport.update();
  if (state.screen === 'studio') {
    // The analyser is shared, so the meter reflects whatever source is live.
    state.audio.update(1 / 60);
    $('#studio-meter').style.width = `${Math.round(state.audio.state.level * 100)}%`;
    const v = state.synth.activeVoices;
    const voicePill = $('#synth-voices');
    voicePill.textContent = `${v} voice${v === 1 ? '' : 's'}`;
    voicePill.classList.toggle('pill-on', v > 0);
  }
  if (state.screen === 'perform') {
    const eng = state.engine;
    $('#hud-scene').textContent = eng.currentScene ? eng.currentScene.name : '';
    $('#hud-auto').textContent = eng.autoVJ.enabled ? 'AUTO-VJ' : 'MANUAL';
    $('#hud-auto').classList.toggle('pill-on', eng.autoVJ.enabled);
    $('#hud-fps').textContent = `${eng.stats.fps} fps`;

    const c = state.midi.control;
    const midiPill = $('#hud-midi');
    midiPill.textContent = c.isSway ? 'SWAY' : c.connected ? 'MIDI' : 'MOUSE/KEYS';
    midiPill.classList.toggle('pill-on', c.isSway || c.connected);

    const a = state.audio.state;
    $('#hud-audio').textContent =
      a.source === 'input' ? 'LIVE AUDIO' : a.source === 'system' ? 'SYSTEM AUDIO' : a.source === 'internal' ? 'INT. GROOVE' : 'NO AUDIO';

    if (state.monitorVisible) {
      $('#midi-monitor').textContent = state.midi.monitor.join('\n') || '(waiting for MIDI…)';
    }
  }
  requestAnimationFrame(updateHud);
}

let helpBarTimer = null;
function bumpHelpBar() {
  const bar = $('#help-bar');
  bar.classList.add('visible');
  clearTimeout(helpBarTimer);
  helpBarTimer = setTimeout(() => bar.classList.remove('visible'), 6000);
}

function wirePerform() {
  const canvas = $('#stage');

  // Mouse = hand position whenever the Sway isn't driving; buttons/wheel map gestures.
  canvas.addEventListener('pointermove', (e) => {
    if (state.midi.control.isSway) return;
    const r = canvas.getBoundingClientRect();
    state.midi.control.xy.x = (e.clientX - r.left) / r.width;
    state.midi.control.xy.y = 1 - (e.clientY - r.top) / r.height;
  });
  canvas.addEventListener('pointerdown', () => {
    if (!state.midi.control.isSway) state.midi.control.gestures.press = 1;
  });
  canvas.addEventListener('pointerup', () => {
    if (!state.midi.control.isSway) state.midi.control.gestures.press = 0;
  });
  canvas.addEventListener(
    'wheel',
    (e) => {
      if (!state.midi.control.isSway) {
        const g = state.midi.control.gestures;
        g.pulse = Math.min(1, g.pulse + Math.abs(e.deltaY) * 0.002);
        setTimeout(() => (g.pulse *= 0.5), 150);
      }
    },
    { passive: true }
  );

  const PAD_KEYS = ['z', 'x', 'c', 'v', 'b', 'n', 'm', ','];

  window.addEventListener('keydown', (e) => {
    if (state.screen !== 'perform') {
      // The Studio's musical keyboard claims its keys before any shortcut.
      if (studioKeyDown(e)) return;
      const key = e.key.toLowerCase();
      const typing = /^(input|select|textarea)$/i.test(e.target.tagName);
      if (e.key === 'Escape') {
        if (state.screen === 'docs') returnFromDocs();
        else if (state.screen === 'studio') returnFromStudio();
        else if (state.screen === 'projects') show('boot');
      } else if (typing) {
        // a form control has focus; leave the keystroke alone
      } else if (key === 'd' && state.screen !== 'docs') {
        openDocs();
      } else if (key === 's' && state.screen !== 'studio') {
        openStudio();
      }
      return;
    }
    const k = e.key.toLowerCase();
    // Number keys select within the ACTIVE PROJECT's scene pool rather than the
    // global registry: a project holds a handful of scenes, the registry holds
    // more than there are digits, and the pool is what the performer chose.
    const sceneIdx = Number(k) - 1;
    const pool = state.engine.autoVJ.pool;
    if (sceneIdx >= 0 && sceneIdx < pool.length) {
      state.engine.autoVJ.enabled = false;
      state.engine.setScene(pool[sceneIdx]);
    } else if (k === ' ') {
      e.preventDefault();
      state.engine.nextScene();
    } else if (k === 'a') {
      state.engine.autoVJ.enabled = !state.engine.autoVJ.enabled;
    } else if (k === 'f') {
      document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    } else if (k === 'h') {
      state.helpVisible = !state.helpVisible;
      $('#help-overlay').classList.toggle('visible', state.helpVisible);
    } else if (k === 'k') {
      // The MIDI monitor is on K because M is a pad key.
      state.monitorVisible = !state.monitorVisible;
      $('#midi-monitor').classList.toggle('visible', state.monitorVisible);
    } else if (k === 'd') {
      state.engine.stop();
      openDocs();
    } else if (k === 's') {
      state.engine.stop();
      openStudio();
    } else if (k === 'escape') {
      if (state.helpVisible || state.monitorVisible) {
        state.helpVisible = state.monitorVisible = false;
        $('#help-overlay').classList.remove('visible');
        $('#midi-monitor').classList.remove('visible');
      } else {
        state.engine.stop();
        show('projects');
      }
    } else {
      const pad = PAD_KEYS.indexOf(k);
      if (pad >= 0 && !e.repeat) {
        state.midi.control.pads[pad] = 0.9;
        state.midi.control.lastPad = pad;
        state.sampler.trigger(pad, 0.9);
      }
    }
    bumpHelpBar();
  });

  $('#btn-back').addEventListener('click', () => {
    state.engine.stop();
    show('projects');
  });

  window.addEventListener('mousemove', () => state.screen === 'perform' && bumpHelpBar());
}

// ---------------------------------------------------------------- boot sequence

async function main() {
  const info = await window.akswayj.info();
  $('#boot-version').textContent = `v${info.version} · ${info.platform}`;

  state.audio = await createAudioEngine();
  // Sampler output goes to the speakers AND into the analyser, so stems the
  // player triggers drive the visuals exactly like any other audio source.
  const audioOuts = [state.audio.ctx.destination, state.audio.analyser];
  state.sampler = createSampler(state.audio.ctx, audioOuts);
  // The synth shares the sampler's routing: heard on the speakers and mixed
  // into the analyser, so playing it drives the visuals.
  state.synth = createSynth(state.audio.ctx, audioOuts);
  // Timeline playback rides the same bus, so the backing track drives the
  // visuals through the one analyser like every other sound in the app.
  state.transport = createTransport(state.audio.ctx, audioOuts);

  // A pad strike plays its sample and feeds the visuals; the raw note plays
  // the synth, so the Sway is an instrument as well as a controller.
  state.midi = await createMidi({
    onEvent: (e) => {
      if (e.kind === 'pad' && e.idx >= 0) {
        state.sampler.trigger(e.idx, e.vel);
        if (state.screen === 'studio') flashPad(e.idx);
      } else if (e.kind === 'note') {
        if (state.synthEnabled) state.synth.noteOn(e.note, e.vel);
      } else if (e.kind === 'noteoff') {
        state.synth.noteOff(e.note);
      } else if (e.kind === 'bend') {
        state.synth.pitchBend(e.value);
      } else if (e.kind === 'mod') {
        state.synth.modulation(e.value);
      }
    },
  });
  state.engine = createEngine({ canvas: $('#stage'), quality: 'med' });
  state.engine.attachAudio(state.audio);
  state.engine.attachControl(state.midi.control);

  state.projectStore = createProjectStore({
    engine: state.engine,
    audio: state.audio,
    sampler: state.sampler,
    synth: state.synth,
    transport: state.transport,
    midi: state.midi,
    setSynthEnabled: (v) => {
      state.synthEnabled = v;
      const el = $('#synth-enable');
      if (el) el.checked = v;
    },
  });
  // Interim visual-lane routing until the assignment router owns it: seeks
  // and play starts cut, clip boundaries honor the clip's transition.
  state.transport.onVisualClip(({ clip, cause }) => {
    if (cause === 'boundary' && clip.transition.type === 'crossfade') {
      state.engine.setScene(clip.scene, clip.transition.duration);
    } else {
      state.engine.cutTo(clip.scene);
    }
  });

  // restore learned MIDI bindings
  const settings = await window.akswayj.settings.get();
  if (settings.midiOverrides) state.midi.setOverrides(settings.midiOverrides);
  if (settings.kit) restoreKit(settings.kit); // deliberately not awaited: startup must not block on disk

  state.projects = await window.akswayj.projects.list();
  renderProjects();

  // Automation handle. The page CSP admits no remote or inline script, so this
  // is reachable only from the app's own bundle and from AKSWAYJ_PROBE, which
  // is how the build is verified headlessly (see docs/ENVIRONMENT.md).
  window.__akswayj = {
    state,
    studio,
    openStudio,
    openDocs,
    renderPads,
    renderSamples,
    transport: state.transport,
    projectStore: state.projectStore,
  };

  wireDoctor();
  wireProjects();
  wireStudio();
  wireSynth();
  wireFx();
  window.addEventListener('keyup', studioKeyUp);
  wireDocs();
  wirePerform();
  updateHud();

  state.audio.autoStart(); // live input if possible, silent internal groove otherwise

  const params = new URLSearchParams(location.search);
  const autoplay = params.get('autoplay');
  if (autoplay) {
    const p = state.projects.find((x) => x.id === autoplay) || state.projects[0];
    startPerformance(p);
    const scene = params.get('scene');
    if (scene) {
      state.engine.autoVJ.enabled = false;
      state.engine.setScene(scene, 0.3);
    }
    runDoctor(); // still populate the doctor screen in the background
  } else {
    show('boot');
    runDoctor();
  }
}

main().catch((err) => {
  document.body.innerHTML = `<pre style="color:#f66;padding:2rem;font-size:14px">AKSWAYJ failed to start:\n${err.stack}</pre>`;
});
