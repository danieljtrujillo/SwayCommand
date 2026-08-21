// SwayCommand cockpit — one always-live page. The stage renders in the
// center from boot to quit; the timeline, the Sway deck, the rails, the
// drawer, and every overlay work on top of it without ever stopping the
// render loop. Projects are .sway files; the legacy screens are gone.

import { createEngine } from './engine/engine.js';
import { createAudioEngine } from './engine/audio.js';
import { createMidi } from './midi/midi.js';
import { renderMarkdown } from './markdown.js';
import { createSampler } from './audio/sampler.js';
import { createSynth, PRESET_NAMES, TABLE_NAMES, MOD_SOURCES, MOD_DESTS } from './audio/synth.js';
import { RANGES as fxRanges, DECKS as fxDecks } from './engine/fxrack.js';
import { createTransport } from './audio/transport.js';
import { createProjectStore } from './project/projectstore.js';
import { createRouter } from './control/router.js';
import { initFrames } from './ui/frame.js';
import { openPopover, closePopover, popoverOpen, wirePopover } from './ui/popover.js';
import { createWave } from './ui/wave.js';
import { createSurface } from './ui/surface.js';
import { createAssign } from './ui/assign.js';
import { createDrawer } from './ui/drawer.js';
import { createTimeline } from './ui/timeline.js';

const $ = (sel) => document.querySelector(sel);

const state = {
  docs: [],
  currentDoc: null,
  sampler: null,
  synth: null,
  synthEnabled: true,
  checks: [],
  midi: null,
  audio: null,
  engine: null,
  transport: null,
  router: null,
  projectStore: null,
  monitorVisible: false,
  entered: false, // door opened
};

const ui = {
  surface: null,
  assign: null,
  drawer: null,
  timeline: null,
  wave: null,
};

const studio = {
  sources: [],
  selectedSample: null,
  systemAudio: { supported: false, detail: '' },
};

// ---------------------------------------------------------------- overlays

const MODALS = ['docs', 'help', 'system'];

function openModal(id) {
  $(`#modal-${id}`).hidden = false;
}

function closeModal(id) {
  $(`#modal-${id}`).hidden = true;
}

function modalOpen(id) {
  return !$(`#modal-${id}`).hidden;
}

function topModal() {
  // system sits above the others in z, so it pops first
  for (const id of ['system', 'help', 'docs']) {
    if (modalOpen(id)) return id;
  }
  return null;
}

// Esc peels one layer: popover, then drawer, then the topmost modal, then
// timeline selection, then the deck selection. "Back" does not exist.
function escapePop() {
  if (popoverOpen()) return closePopover();
  if (ui.drawer.isOpen()) return ui.drawer.close();
  const modal = topModal();
  if (modal) {
    if (modal === 'system' && !state.entered) return; // first run gates on ENTER
    return closeModal(modal);
  }
  if (ui.timeline.hasSelection()) return ui.timeline.clearSelection();
  if (ui.assign.current()) return selectControl(null);
}

let noticeTimer = null;
function notice(html, ms = 5000) {
  const el = $('#notice');
  el.innerHTML = html;
  el.classList.add('visible');
  clearTimeout(noticeTimer);
  noticeTimer = setTimeout(() => el.classList.remove('visible'), ms);
}

// ---------------------------------------------------------------- doctor

const STATUS_ICON = { ok: '●', warn: '▲', fail: '✕', info: '○' };

function renderChecks() {
  $('#check-list').innerHTML = state.checks
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

  if (state.midi.available) {
    const c = state.midi.control;
    checks.push({
      id: 'midi',
      label: 'MIDI',
      status: 'ok',
      detail: c.isSway
        ? `Sway online: “${c.portName}” — factory map armed.`
        : c.connected
          ? `No Sway yet, but listening on: ${c.portName}. Incoming CC and note messages are matched against the Sway factory map.`
          : 'No MIDI devices right now. Hot-plug any time — mouse & keyboard are fully mapped meanwhile.',
    });
  } else {
    checks.push({ id: 'midi', label: 'MIDI', status: 'warn', detail: 'WebMIDI unavailable — mouse & keyboard control still work.' });
  }

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
  const [main, local] = await Promise.all([window.swaycommand.doctor.run(), rendererChecks()]);
  state.checks = [...main, ...local];
  renderChecks();

  const worst = state.checks.some((c) => c.status === 'fail')
    ? 'fail'
    : state.checks.some((c) => c.status === 'warn')
      ? 'warn'
      : 'ok';
  $('#boot-status').textContent =
    worst === 'ok'
      ? 'All clear.'
      : worst === 'warn'
        ? 'Playable now — a couple of notes above.'
        : 'Something needs attention above — you can still continue.';
  const enter = $('#btn-enter');
  enter.disabled = false;
  enter.focus();
  if (worst === 'ok' && !state._autoAdvanced && !state.entered) {
    state._autoAdvanced = true;
    setTimeout(() => {
      if (!state.entered && modalOpen('system')) enterCockpit();
    }, 1400);
  }
}

function wireDoctor() {
  window.swaycommand.doctor.onFixProgress(({ fixId, phase, pct }) => {
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
    const result = await window.swaycommand.doctor.fix(btn.dataset.fix);
    const check = state.checks.find((c) => c.id === btn.dataset.check);
    if (check) {
      check.detail = result.detail;
      check.status = result.ok ? 'ok' : 'warn';
      if (result.ok) check.fix = null;
    }
    renderChecks();
    if (result.ok) runDoctor();
  });

  $('#btn-enter').addEventListener('click', enterCockpit);
  $('#btn-recheck').addEventListener('click', runDoctor);
  $('#btn-system').addEventListener('click', () => {
    closeModal('help');
    openModal('system');
    runDoctor();
  });
}

// The blast door opens once the system checks are dismissed; the stage was
// already rendering behind it.
function enterCockpit() {
  closeModal('system');
  if (state.entered) return;
  state.entered = true;
  const door = $('#door');
  door.classList.add('open');
  setTimeout(() => door.classList.add('gone'), 1000);
  notice('<b>H</b> — controls');
}

// ---------------------------------------------------------------- samples / kit

function renderSamples() {
  const list = state.sampler ? state.sampler.listSamples() : [];
  $('#sample-list').innerHTML = list.length
    ? list
        .map(
          (s) =>
            `<li><button draggable="true" data-sample="${s.id.replace(/"/g, '&quot;')}"${s.id === studio.selectedSample ? ' class="current"' : ''}>${s.name}<em>${s.duration.toFixed(2)} s · ${s.channels}ch</em></button></li>`
        )
        .join('')
    : '<li class="none">No samples loaded.</li>';
}

async function addSamples() {
  const note = $('#kit-note');
  let picked;
  try {
    picked = await window.swaycommand.files.pickAudio();
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
      await state.projectStore.addMedia(file);
      loaded++;
    } catch (err) {
      failures.push(`${file.name}: ${err.message}`);
    }
  }
  note.textContent = failures.length
    ? `Loaded ${loaded}. Failed: ${failures.join('; ')}`
    : `Loaded ${loaded} sample${loaded === 1 ? '' : 's'}.`;
  renderSamples();
}

// Re-reads every sample file a legacy saved kit references, then restores the
// pads and mirrors them into pad assignments.
async function restoreKit(saved) {
  if (!saved || !saved.samples || !saved.samples.length) return;
  const missing = [];
  for (const s of saved.samples) {
    try {
      const bytes = await window.swaycommand.files.readAudio(s.id);
      await state.sampler.loadSample(s.id, bytes.slice().buffer, { name: s.name });
    } catch {
      missing.push(s.name);
    }
  }
  state.sampler.setKit(saved);
  const pads = state.router.getAssignments().pads;
  (saved.pads || []).forEach((pad, i) => {
    if (pad && pad.id && !pads[i]) pads[i] = { type: 'sample', pad: i };
  });
  refreshDeck();
  if (missing.length) console.warn('[kit] missing sample files:', missing.join(', '));
}

function wireKit() {
  $('#btn-add-samples').addEventListener('click', addSamples);
  $('#sample-list').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-sample]');
    if (!btn) return;
    studio.selectedSample = btn.dataset.sample;
    renderSamples();
    notice('Click a pad on the deck to place the sample');
  });
  $('#sample-list').addEventListener('dragstart', (e) => {
    const btn = e.target.closest('[data-sample]');
    if (!btn) return;
    e.dataTransfer.setData('application/x-sway-media', btn.dataset.sample);
    e.dataTransfer.effectAllowed = 'copy';
  });
}

// ---------------------------------------------------------------- synth panel

const SYNTH_GROUPS = ['OSC1', 'OSC2', 'FILTER1', 'ENV1', 'LFO', 'FX', 'GLOBAL'];

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
    state.router.synthEnabled = e.target.checked;
    state.projectStore.markDirty();
  });

  $('#synth-preset').addEventListener('change', (e) => {
    state.synth.loadPreset(e.target.value);
    state.projectStore.markDirty();
    renderSynthPanel();
  });

  $('#synth-decks').addEventListener('input', (e) => {
    const el = e.target.closest('[data-synth], [data-synthsel]');
    if (!el) return;
    const key = el.dataset.synth || el.dataset.synthsel;
    const value =
      el.type === 'checkbox' ? el.checked : el.tagName === 'SELECT' ? el.value : Number(el.value);
    state.synth.setParam(key, value);
    state.projectStore.markDirty();
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
    state.projectStore.markDirty();
    renderModMatrix();
  });
  $('#mod-rows').addEventListener('click', (e) => {
    const del = e.target.closest('[data-mod-del]');
    if (!del) return;
    const rows = state.synth.getMatrix();
    rows.splice(Number(del.dataset.modDel), 1);
    state.synth.setMatrix(rows);
    state.projectStore.markDirty();
    renderModMatrix();
  });
  $('#btn-mod-add').addEventListener('click', () => {
    const rows = state.synth.getMatrix();
    rows.push({ source: 'lfo1', dest: 'filter1.cutoff', amount: 0.3 });
    state.synth.setMatrix(rows);
    state.projectStore.markDirty();
    renderModMatrix();
  });

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

// The computer keyboard plays the synth only while the synth drawer is open,
// so it never fights the cockpit shortcuts.
function synthKeyDown(e) {
  if (!ui.drawer.isOpen('synth') || e.repeat) return false;
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

function synthKeyUp(e) {
  const entry = KEY_ROW.find(([k]) => k === e.key.toLowerCase());
  if (!entry || !heldKeys.has(entry[1])) return;
  heldKeys.delete(entry[1]);
  state.synth.noteOff(entry[1]);
  const btn = document.querySelector(`[data-note="${entry[1]}"]`);
  if (btn) btn.classList.remove('down');
}

// ---------------------------------------------------------------- effects rack

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
    state.projectStore.markDirty();
  });
  $('#btn-fx-reset').addEventListener('click', () => {
    state.engine.resetFx();
    state.projectStore.markDirty();
    renderFxPanel();
  });
  $('#fx-decks').addEventListener('input', (e) => {
    const el = e.target.closest('[data-fx]');
    if (!el) return;
    const key = el.dataset.fx;
    const value = el.type === 'checkbox' ? el.checked : el.type === 'color' ? el.value : Number(el.value);
    state.engine.setFxParam(key, value);
    state.projectStore.markDirty();
    const readout = document.querySelector(`[data-fxval="${key}"]`);
    if (readout) readout.textContent = Number(value).toFixed(2);
  });
}

// ---------------------------------------------------------------- documentation

async function openDocs(docId) {
  if (!state.docs.length) {
    state.docs = await window.swaycommand.docs.list();
    $('#docs-list').innerHTML = state.docs
      .map((d) => `<li><button data-doc="${d.id}">${d.title}</button></li>`)
      .join('');
  }
  openModal('docs');
  await loadDoc(docId || state.currentDoc || (state.docs[0] && state.docs[0].id));
}

async function loadDoc(docId, anchor) {
  if (!docId) return;
  const body = $('#docs-body');
  let source;
  try {
    source = await window.swaycommand.docs.read(docId);
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

async function followDocLink(href) {
  if (href.startsWith('#')) {
    scrollToAnchor(href.slice(1));
    return;
  }
  if (/^https?:/i.test(href)) {
    try {
      await window.swaycommand.openExternal(href);
    } catch {
      showExternalNote(`Link not on the allowlist — open manually: ${href}`);
    }
    return;
  }

  const [rel, anchor] = href.split('#');
  const from = state.currentDoc || 'README.md';
  const baseDir = from.includes('/') ? from.slice(0, from.lastIndexOf('/')) : '';
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

function wireDocs() {
  $('#btn-docs').addEventListener('click', () => (modalOpen('docs') ? closeModal('docs') : openDocs()));
  $('#btn-docs-close').addEventListener('click', () => closeModal('docs'));

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

// ---------------------------------------------------------------- topbar

function fmtClock(t) {
  const m = Math.floor(t / 60);
  const s = t - m * 60;
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s.toFixed(1)}`;
}

function updateProjectButton() {
  const btn = $('#project-btn');
  btn.textContent = state.projectStore.state.name;
  btn.classList.toggle('dirty', state.projectStore.state.dirty);
}

async function openProjectMenu() {
  const store = state.projectStore;
  const [recent, templates] = await Promise.all([
    window.swaycommand.project.recent().catch(() => []),
    window.swaycommand.project.templates().catch(() => []),
  ]);
  const rows = [
    '<button class="pop-item" data-choice="new">New</button>',
    '<button class="pop-item" data-choice="open">Open…</button>',
    '<button class="pop-item" data-choice="save">Save</button>',
    '<button class="pop-item" data-choice="saveas">Save as…</button>',
  ];
  const recents = recent.filter((r) => r.path !== store.state.path);
  if (recents.length) {
    rows.push('<div class="pop-label">RECENT</div>');
    for (const r of recents.slice(0, 6)) {
      rows.push(`<button class="pop-item" data-choice="recent" data-path="${r.path.replace(/"/g, '&quot;')}">${r.name}<span>${r.path}</span></button>`);
    }
  }
  if (templates.length) {
    rows.push('<div class="pop-label">TEMPLATES</div>');
    for (const t of templates) {
      rows.push(`<button class="pop-item" data-choice="template" data-id="${t.id}">${t.name}<span>${t.vibe}</span></button>`);
    }
  }
  openPopover($('#project-btn'), rows.join(''), async (choice, data) => {
    const guard = () => !store.state.dirty || window.confirm('Discard unsaved changes?');
    try {
      if (choice === 'new' && guard()) await store.openTemplate('first-flight');
      else if (choice === 'open' && guard()) await store.openFromDialog();
      else if (choice === 'save') await store.save();
      else if (choice === 'saveas') await store.saveAs();
      else if (choice === 'recent' && guard()) await store.openPath(data.path);
      else if (choice === 'template' && guard()) await store.openTemplate(data.id);
    } catch (err) {
      notice(`Project: ${err.message}`, 7000);
    }
    postProjectLoad();
  });
}

function wireTopbar() {
  $('#project-btn').addEventListener('click', openProjectMenu);
  $('#t-play').addEventListener('click', () => {
    state.transport.state.playing ? state.transport.pause() : state.transport.play();
  });
  $('#t-stop').addEventListener('click', () => state.transport.stop());
  $('#t-loop').addEventListener('click', () => {
    const loop = state.transport.state.loop;
    state.transport.setLoop(loop.start, loop.end, !loop.enabled);
    ui.timeline.render();
  });
  $('#deckbar').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-drawer]');
    if (btn) ui.drawer.toggle(btn.dataset.drawer);
  });
  $('#btn-help').addEventListener('click', () => (modalOpen('help') ? closeModal('help') : openModal('help')));
}

// ---------------------------------------------------------------- input box

async function openSourceMenu() {
  let inputs = [];
  try {
    inputs = await state.audio.listInputs();
  } catch {
    inputs = [];
  }
  studio.sources = inputs;
  const a = state.audio.state;
  const rows = [
    `<button class="pop-item${a.source === 'system' ? ' current' : ''}" data-choice="system" ${studio.systemAudio.supported ? '' : 'disabled'}>System audio<span>${
      studio.systemAudio.supported ? 'Everything playing on this computer' : studio.systemAudio.detail || 'Windows only'
    }</span></button>`,
  ];
  for (const d of inputs) {
    rows.push(
      `<button class="pop-item${a.source === 'input' && a.deviceId === d.id ? ' current' : ''}" data-choice="input" data-id="${d.id}">${d.label}<span>Input device</span></button>`
    );
  }
  rows.push(`<button class="pop-item${a.source === 'internal' ? ' current' : ''}" data-choice="internal">Internal groove<span>Silent 120 BPM analysis signal</span></button>`);
  openPopover($('#input-src'), rows.join(''), async (choice, data) => {
    try {
      if (choice === 'system') await state.audio.useSystemAudio();
      else if (choice === 'input') await state.audio.useInput(data.id);
      else {
        state.audio.releaseInput();
        state.audio.startInternal();
      }
    } catch (err) {
      notice(`Source: ${err.message}`, 6000);
    }
    updateSourceLabel();
  });
}

function updateSourceLabel() {
  const a = state.audio.state;
  $('#input-src').textContent = a.deviceLabel || (a.source === 'internal' ? 'Internal groove' : a.source) || '—';
}

// ---------------------------------------------------------------- scenes / auto

function renderSceneBank() {
  const pool = state.engine.autoVJ.pool;
  $('#scene-bank').innerHTML = state.engine.sceneList
    .map((s) => {
      const poolIdx = pool.indexOf(s.id);
      const digit = poolIdx >= 0 && poolIdx < 9 ? poolIdx + 1 : '';
      return `<li><button draggable="true" data-scene="${s.id}" class="${poolIdx >= 0 ? 'pooled' : ''}"><b>${digit}</b>${s.name}</button></li>`;
    })
    .join('');
}

function updateAutoBox() {
  const av = state.engine.autoVJ;
  $('#auto-toggle').classList.toggle('on', av.enabled);
  if (document.activeElement !== $('#auto-min')) $('#auto-min').value = Math.round(av.minHold);
  if (document.activeElement !== $('#auto-max')) $('#auto-max').value = Math.round(av.maxHold);
  if (document.activeElement !== $('#auto-fade')) $('#auto-fade').value = av.fadeTime;
}

function wireScenes() {
  $('#scene-bank').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-scene]');
    if (!btn) return;
    state.engine.autoVJ.enabled = false;
    state.engine.setScene(btn.dataset.scene);
    updateAutoBox();
  });
  $('#scene-bank').addEventListener('dragstart', (e) => {
    const btn = e.target.closest('[data-scene]');
    if (!btn) return;
    e.dataTransfer.setData('application/x-sway-scene', btn.dataset.scene);
    e.dataTransfer.effectAllowed = 'copy';
  });
  $('#auto-toggle').addEventListener('click', () => {
    state.engine.autoVJ.enabled = !state.engine.autoVJ.enabled;
    updateAutoBox();
  });
  $('#auto-min').addEventListener('change', (e) => {
    state.engine.autoVJ.minHold = Math.max(1, Number(e.target.value) || 18);
    state.projectStore.markDirty();
  });
  $('#auto-max').addEventListener('change', (e) => {
    state.engine.autoVJ.maxHold = Math.max(state.engine.autoVJ.minHold, Number(e.target.value) || 40);
    state.projectStore.markDirty();
  });
  $('#auto-fade').addEventListener('change', (e) => {
    state.engine.autoVJ.fadeTime = Math.max(0, Number(e.target.value) || 4);
    state.projectStore.markDirty();
  });
}

// ---------------------------------------------------------------- deck / selection

function selectControl(target) {
  ui.assign.select(target);
  ui.surface.select(target);
}

// Pad labels + button lit states, refreshed on assignment/kit changes.
function refreshDeck() {
  const asg = state.router.getAssignments();
  const samples = state.sampler.listSamples();
  const kit = state.sampler.getKit();
  const labels = [];
  for (let i = 0; i < 16; i++) {
    const a = asg.pads[i];
    if (!a) {
      labels.push('');
    } else if (a.type === 'sample') {
      const pad = kit.pads && kit.pads[a.pad ?? i];
      const s = pad && samples.find((x) => x.id === pad.id);
      labels.push(s ? s.name.replace(/\.[a-z0-9]+$/i, '') : '');
    } else if (a.type === 'scene') {
      const meta = state.engine.sceneList.find((s) => s.id === a.scene);
      labels.push(meta ? meta.name : a.scene);
    } else {
      labels.push(a.param);
    }
  }
  ui.surface.refresh(labels, buttonLitStates());
}

function buttonLitStates() {
  const asg = state.router.getAssignments();
  return asg.buttons.map((b) => {
    if (!b || !b.action) return false;
    const t = b.action.target;
    if (t === 'engine:fxEnabled') return state.engine.fxEnabled;
    if (t === 'engine:autoVJ') return state.engine.autoVJ.enabled;
    if (t === 'synth:enabled') return state.router.synthEnabled;
    if (t === 'transport:playPause') return state.transport.state.playing;
    if (t.startsWith('fx:')) return !!state.engine.fx.params[t.slice(3)];
    return false;
  });
}

function onDeckSelect(target) {
  // With a sample armed from the kit drawer, clicking a pad places it.
  if (studio.selectedSample && target.startsWith('pad:') && ui.drawer.isOpen('kit')) {
    const i = Number(target.slice(4));
    state.sampler.assignPad(i, studio.selectedSample, { mode: 'oneshot', gain: 1 });
    const asg = state.router.getAssignments();
    asg.pads[i] = { type: 'sample', pad: i };
    state.projectStore.markDirty();
    refreshDeck();
  }
  selectControl(target);
}

// ---------------------------------------------------------------- keyboard

const PAD_KEYS = ['z', 'x', 'c', 'v', 'b', 'n', 'm', ','];

function wireKeyboard() {
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      escapePop();
      return;
    }
    if (/^(input|select|textarea)$/i.test(e.target.tagName)) return;
    if (synthKeyDown(e)) return;
    const k = e.key.toLowerCase();

    const sceneIdx = Number(k) - 1;
    const pool = state.engine.autoVJ.pool;
    if (k >= '1' && k <= '9' && sceneIdx < pool.length) {
      state.engine.autoVJ.enabled = false;
      state.engine.setScene(pool[sceneIdx]);
      updateAutoBox();
    } else if (k === ' ') {
      e.preventDefault();
      state.engine.nextScene();
    } else if (k === 'a') {
      state.engine.autoVJ.enabled = !state.engine.autoVJ.enabled;
      updateAutoBox();
    } else if (k === 'f') {
      document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    } else if (k === 'h') {
      modalOpen('help') ? closeModal('help') : openModal('help');
    } else if (k === 'k') {
      // The MIDI monitor is on K because M is a pad key.
      state.monitorVisible = !state.monitorVisible;
      $('#midi-monitor').classList.toggle('visible', state.monitorVisible);
    } else if (k === 'd') {
      modalOpen('docs') ? closeModal('docs') : openDocs();
    } else if (k === 's') {
      ui.drawer.toggle('synth');
    } else if (k === 'r') {
      ui.drawer.toggle('rack');
    } else if (k === 'e') {
      ui.drawer.toggle('kit');
    } else if (k === 'p') {
      state.transport.state.playing ? state.transport.pause() : state.transport.play();
    } else if (k === 'l') {
      const loop = state.transport.state.loop;
      state.transport.setLoop(loop.start, loop.end, !loop.enabled);
      ui.timeline.render();
    } else if (k === 'o') {
      $('#cockpit').classList.toggle('solo');
    } else if (k === 'delete' || k === 'backspace') {
      if (ui.timeline.deleteSelected()) e.preventDefault();
    } else if (k === 'arrowleft' || k === 'arrowright') {
      if (ui.timeline.nudgeSelected(k === 'arrowleft' ? -0.5 : 0.5)) e.preventDefault();
    } else {
      const pad = PAD_KEYS.indexOf(k);
      if (pad >= 0 && !e.repeat) {
        state.midi.control.pads[pad] = 0.9;
        state.midi.control.lastPad = pad;
        state.router.handleMidiEvent({ kind: 'pad', idx: pad, vel: 0.9 });
      }
    }
  });

  // Gate-mode pads need the key release; the router no-ops for other modes.
  window.addEventListener('keyup', (e) => {
    synthKeyUp(e);
    const pad = PAD_KEYS.indexOf(e.key.toLowerCase());
    if (pad >= 0) state.router.handleMidiEvent({ kind: 'noteoff', idx: pad });
  });
}

// ---------------------------------------------------------------- stage input

function wireStageInput() {
  const canvas = $('#stage');
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
}

// ---------------------------------------------------------------- frame tick

let lastTick = 0;
let lastScene = '';
let lastDeckSync = 0;

function frameTick(now) {
  requestAnimationFrame(frameTick);
  const dt = Math.min(0.05, (now - lastTick) / 1000 || 0.016);
  lastTick = now;
  const eng = state.engine;
  const io = eng.io;

  // top bar
  const sceneName = eng.currentScene ? eng.currentScene.name : '';
  if (sceneName !== lastScene) {
    lastScene = sceneName;
    $('#scene-now').textContent = sceneName;
    for (const btn of document.querySelectorAll('#scene-bank [data-scene]')) {
      btn.classList.toggle('current', eng.currentScene && btn.dataset.scene === eng.currentScene.id);
    }
  }
  $('#t-clock').textContent = fmtClock(state.transport.state.position);
  $('#t-play').textContent = state.transport.state.playing ? '❚❚' : '▶';
  $('#t-play').classList.toggle('on', state.transport.state.playing);
  $('#t-loop').classList.toggle('on', state.transport.state.loop.enabled);
  $('#pill-fps').textContent = eng.stats.fps;

  const c = state.midi.control;
  const link = $('#pill-link');
  link.textContent = c.isSway ? 'SWAY' : c.connected ? 'MIDI' : 'KEYS';
  link.classList.toggle('pill-on', c.isSway || c.connected);

  const a = state.audio.state;
  $('#pill-in').textContent =
    a.source === 'input' ? 'LINE' : a.source === 'system' ? 'LOOPBACK' : a.source === 'internal' ? 'GROOVE' : 'MUTE';

  // input box
  $('#input-meter').style.width = `${Math.round(a.level * 100)}%`;
  ui.wave.update(dt, a.bands, '#2de1fc', '#ff2d95');

  // deck + timeline
  ui.surface.update(io, state.midi.monitor);
  ui.timeline.updatePlayhead();

  // periodic sync of cheap-but-not-per-frame things
  if (now - lastDeckSync > 250) {
    lastDeckSync = now;
    refreshDeck();
    updateProjectButton();
    updateAutoBox();
    const v = state.synth.activeVoices;
    const voicePill = $('#synth-voices');
    voicePill.textContent = v;
    voicePill.classList.toggle('pill-on', v > 0);
  }

  if (state.monitorVisible) {
    $('#midi-monitor').textContent = state.midi.monitor.join('\n') || '(waiting for MIDI…)';
  }
}

// ---------------------------------------------------------------- project glue

function postProjectLoad() {
  renderSceneBank();
  updateAutoBox();
  updateProjectButton();
  updateSourceLabel();
  refreshDeck();
  ui.assign.refresh();
  ui.timeline.render();
  renderSamples();
  if (ui.drawer.isOpen('synth')) renderSynthPanel();
  if (ui.drawer.isOpen('rack')) renderFxPanel();
  $('#synth-enable').checked = state.synthEnabled;
}

// ---------------------------------------------------------------- boot

async function main() {
  const info = await window.swaycommand.info();
  $('#boot-version').textContent = `v${info.version} · ${info.platform}`;

  state.audio = await createAudioEngine();
  // Sampler, synth, and the timeline all feed the speakers AND the analyser,
  // so anything the instrument plays drives the visuals.
  const audioOuts = [state.audio.ctx.destination, state.audio.analyser];
  state.sampler = createSampler(state.audio.ctx, audioOuts);
  state.synth = createSynth(state.audio.ctx, audioOuts);
  state.transport = createTransport(state.audio.ctx, audioOuts);

  // Every MIDI event goes to the assignment router — one dispatch path for
  // hardware, keyboard pads, and the timeline alike.
  state.midi = await createMidi({
    onEvent: (e) => state.router && state.router.handleMidiEvent(e),
  });
  state.engine = createEngine({ canvas: $('#stage'), quality: 'med' });
  state.engine.attachAudio(state.audio);
  state.engine.attachControl(state.midi.control);

  state.router = createRouter({
    engine: state.engine,
    sampler: state.sampler,
    synth: state.synth,
    transport: state.transport,
    midi: state.midi,
    onDirty: () => state.projectStore && state.projectStore.markDirty(),
  });
  state.router.onSynthToggle((v) => {
    state.synthEnabled = v;
    $('#synth-enable').checked = v;
  });
  state.engine.setFrameHook(state.router.frame);

  state.projectStore = createProjectStore({
    engine: state.engine,
    audio: state.audio,
    sampler: state.sampler,
    synth: state.synth,
    transport: state.transport,
    midi: state.midi,
    router: state.router,
    setSynthEnabled: (v) => {
      state.synthEnabled = v;
      state.router.synthEnabled = v;
      $('#synth-enable').checked = v;
    },
    onApplied: () => ui.timeline && postProjectLoad(),
    onMediaLoaded: () => {
      if (!ui.timeline) return;
      ui.timeline.render();
      renderSamples();
      refreshDeck();
    },
  });

  // --- UI assembly ---
  initFrames();
  wirePopover();
  ui.wave = createWave($('#input-wave'));
  ui.surface = createSurface($('#swaydeck'), { onSelect: onDeckSelect });
  ui.drawer = createDrawer({
    onOpenTab: (tab, first) => {
      if (tab === 'synth' && first) renderSynthPanel();
      if (tab === 'rack') renderFxPanel();
      if (tab === 'kit') renderSamples();
    },
  });
  ui.assign = createAssign({
    router: state.router,
    sampler: state.sampler,
    synth: state.synth,
    engine: state.engine,
    midi: state.midi,
    fxRanges,
    fxDecks,
    onChanged: () => {
      state.projectStore.markDirty();
      refreshDeck();
    },
    onLearnArmed: (armed) => ui.surface.setArmed(armed),
  });
  ui.timeline = createTimeline({
    transport: state.transport,
    engine: state.engine,
    store: state.projectStore,
    onEdit: () => state.projectStore.markDirty(),
  });
  new ResizeObserver(() => ui.timeline.render()).observe($('#timeline'));
  state.router.onTouch((id) => {
    if (!ui.assign.followEnabled() || popoverOpen()) return;
    if (ui.assign.current() !== id) selectControl(id);
  });

  wireDoctor();
  wireTopbar();
  wireKit();
  wireSynth();
  wireFx();
  wireDocs();
  wireScenes();
  wireKeyboard();
  wireStageInput();
  $('#input-src').addEventListener('click', openSourceMenu);

  // restore learned MIDI bindings
  const settings = await window.swaycommand.settings.get();
  if (settings.midiOverrides) state.midi.setOverrides(settings.midiOverrides);

  // Automation handle. The page CSP admits no remote or inline script, so
  // this is reachable only from the bundle and from SWAYCOMMAND_PROBE.
  window.__swaycommand = {
    state,
    studio,
    openStudio: (tab) => ui.drawer.open(tab || 'synth'),
    openDocs,
    renderPads: refreshDeck,
    renderSamples,
    renderTimeline: () => ui.timeline.render(),
    transport: state.transport,
    projectStore: state.projectStore,
    router: state.router,
    selectControl,
    openProject: (p) => state.projectStore.openPath(p),
    saveProject: () => state.projectStore.save(),
  };

  // The stage runs from the first frame; the door covers it until ENTER.
  state.engine.start();
  requestAnimationFrame(frameTick);
  state.audio.autoStart().then(updateSourceLabel);
  window.swaycommand.platform.systemAudio().then((sa) => (studio.systemAudio = sa));

  // --- boot project ---
  const params = new URLSearchParams(location.search);
  const autoplay = params.get('autoplay');
  let loaded = false;
  try {
    if (autoplay && autoplay.toLowerCase().endsWith('.sway')) {
      await state.projectStore.openPath(autoplay);
      loaded = true;
    } else if (autoplay) {
      await state.projectStore.openTemplate(autoplay);
      loaded = true;
    }
  } catch (err) {
    console.warn('[boot] autoplay failed:', err.message);
  }
  if (!loaded) {
    try {
      const recent = await window.swaycommand.project.recent();
      if (recent.length) {
        await state.projectStore.openPath(recent[0].path);
        loaded = true;
      }
    } catch {
      /* recents are best-effort */
    }
  }
  if (!loaded) await state.projectStore.openTemplate('first-flight');

  const scene = params.get('scene');
  if (scene) {
    state.engine.autoVJ.enabled = false;
    state.engine.setScene(scene, 0.3);
  }

  if (settings.kit) restoreKit(settings.kit); // legacy kit, deliberately not awaited
  postProjectLoad();
  selectControl(null);

  if (autoplay) {
    enterCockpit();
    runDoctor(); // still populate the checks in the background
  } else {
    openModal('system');
    runDoctor();
  }
}

main().catch((err) => {
  document.body.innerHTML = `<pre style="color:#f66;padding:2rem;font-size:14px">SwayCommand failed to start:\n${err.stack}</pre>`;
});
