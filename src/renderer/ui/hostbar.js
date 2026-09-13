// The one header inside theDAW.
//
// Framed by theDAW, the cockpit's #topbar is the SWAY tab's only header. The
// cockpit announces caps 'host-header' and 'host-scenes' on sway/ready
// (host/host-channel.js); theDAW hides its own bar when it sees them, and once
// theDAW answers the handshake this module turns #topbar into one 34 px row:
//
//   wordmark | stop play loop clock | scene menu (the loaded scene) |
//   flexible space | Sway status | synth rack kit plugins | ?
//
// The scene menu holds New, Open, Save and Save as, theDAW's GANTASMO scenes
// (sway/host-scenes rows with builtin true), its SAVED scenes, RECENT files,
// the cockpit's own templates theDAW did not list, and Choose a .sway file.
// A theDAW scene opens through theDAW (sway/open-scene, sway/choose-scene-file),
// which reloads the cockpit into it.
//
// The Sway status panel holds the device from sway/host-status, the audio
// source select (sway/audio-source in, sway/set-audio-source out), the link to
// theDAW and the frame rate. The ? menu holds Docs, Help and the shortcuts.
//
// Standalone, in the desktop app and in the Android WebView none of this
// activates, and #topbar stays exactly as index.html draws it.

import { isFramed, hasHost, hostState, onHostEvent, postToHost } from '../host/host-channel.js';
import { openPopover, closePopover, popoverAnchor, popoverOwner } from './popover.js';
import { displayPortName } from '../midi/swaymap.js';

const $ = (sel) => document.querySelector(sel);

// 16 px glyphs drawn in currentColor, for the transport keys.
const glyph = (cls, body) => `<svg class="${cls}" viewBox="0 0 16 16" aria-hidden="true" focusable="false">${body}</svg>`;
const GLYPH = {
  play: glyph('g-play', '<path d="M5 3.2v9.6l7.5-4.8z" fill="currentColor"/>'),
  pause: glyph('g-pause', '<path d="M4.5 3h2.6v10H4.5zM8.9 3h2.6v10H8.9z" fill="currentColor"/>'),
  stop: glyph('g-stop', '<rect x="4" y="4" width="8" height="8" fill="currentColor"/>'),
  loop: glyph(
    'g-loop',
    '<path d="M3 7a4 4 0 0 1 4-4h4.5M11 1l2 2-2 2M13 9a4 4 0 0 1-4 4H4.5M5 15l-2-2 2-2" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>'
  ),
};

// The cockpit's keyboard, as wireKeyboard() in app.js reads it.
const SHORTCUTS = [
  ['Play / pause', 'P'],
  ['Loop', 'L'],
  ['Next scene', 'Space'],
  ['Pool scene', '1 to 9'],
  ['Auto rotation', 'A'],
  ['Synth', 'S'],
  ['Rack', 'R'],
  ['Kit', 'E'],
  ['Plugins', 'G'],
  ['Import stems', 'I'],
  ['MIDI monitor', 'K'],
  ['Fullscreen', 'F'],
  ['Solo view', 'O'],
  ['Close a panel', 'Esc'],
];

const STATE_WORD = { ok: 'Connected', none: 'No MIDI device', off: 'MIDI off' };

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function folderOf(path) {
  const i = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));
  return i > 0 ? path.slice(0, i) : '';
}

function savedAt(mtime) {
  if (!mtime) return '';
  // theDAW sends seconds (a file's st_mtime); a millisecond value reads too.
  const d = new Date(mtime < 1e11 ? mtime * 1000 : mtime);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString();
}

// "will-i-dream", "Will I Dream" and "Will I Dream.sway" name one scene.
function sceneKey(s) {
  return String(s || '')
    .replace(/\.sway$/i, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function item(choice, attrs, name, detail, current) {
  return (
    `<button class="pop-item${current ? ' current' : ''}" data-choice="${choice}"${attrs}${current ? ' aria-current="true"' : ''}>` +
    `<b class="pop-name">${esc(name)}</b>${detail ? `<span>${esc(detail)}</span>` : ''}</button>`
  );
}

export function createHostBar({ project, runProjectChoice, templates, toggleDrawer, openDocs, openHelp, fps }) {
  const cockpit = $('#cockpit');
  const sceneBtn = $('#host-scene');
  const sceneName = $('#host-scene .hk-name');
  const swayBtn = $('#host-sway');
  const swayDot = $('#host-sway .hk-dot');
  const helpBtn = $('#host-help');
  let active = false;
  let shownScene = null;
  let loopShown = null;
  let templateList = null; // the cockpit's own templates, read once
  let fpsTimer = 0;

  function activate() {
    if (active || !isFramed() || !hasHost()) return;
    active = true;
    cockpit.classList.add('hosted');
    document.body.classList.add('hosted');
    // Stop, play, loop, then the clock, as glyph keys.
    const tStop = $('#t-stop');
    const tPlay = $('#t-play');
    const tLoop = $('#t-loop');
    tStop.innerHTML = GLYPH.stop;
    tStop.setAttribute('aria-label', 'Stop');
    tPlay.innerHTML = GLYPH.play + GLYPH.pause;
    tPlay.setAttribute('aria-label', 'Play / pause (P)');
    tLoop.innerHTML = GLYPH.loop;
    tLoop.setAttribute('aria-label', 'Loop (L)');
    $('#transport').append(tStop, tPlay, tLoop, $('#t-clock'));
    for (const el of document.querySelectorAll('[data-hosted]')) el.hidden = false;
    api.setScene(project().name, project().dirty);
    paintStatus();
  }

  // --- scene menu -----------------------------------------------------------

  function sceneHtml() {
    const p = project();
    const here = sceneKey(p.name);
    const isHere = (name, path) => (!!path && path === p.path) || sceneKey(name) === here;
    const out = [
      '<div class="pop-keys" role="none">' +
        [
          ['new', 'New'],
          ['open', 'Open'],
          ['save', 'Save'],
          ['saveas', 'Save as'],
        ]
          .map(([choice, label]) => `<button class="pop-item pop-key" data-choice="${choice}">${label}</button>`)
          .join('') +
        '</div>',
    ];
    const listed = new Set();
    const s = hostState.scenes;
    if (!s) {
      out.push('<div class="pop-note">Asking theDAW for its scenes...</div>');
    } else {
      if (s.error) out.push(`<div class="pop-note pop-error">${esc(s.error)}</div>`);
      // Grouped by the flag whatever order the rows arrive in; theDAW's order holds inside each group.
      const groups = [
        ['GANTASMO', s.rows.filter((r) => r.builtin), () => ''],
        ['SAVED', s.rows.filter((r) => !r.builtin), (r) => savedAt(r.mtime)],
      ];
      for (const [label, rows, detail] of groups) {
        if (!rows.length) continue;
        out.push(`<div class="pop-label">${label}</div>`);
        for (const r of rows) {
          listed.add(sceneKey(r.name));
          out.push(item('scene', ` data-name="${esc(r.name)}" title="${esc(r.path)}"`, r.name, detail(r), isHere(r.name, r.path)));
        }
      }
      if (s.recent.length) {
        out.push('<div class="pop-label">RECENT</div>');
        for (const r of s.recent) {
          listed.add(sceneKey(r.name));
          out.push(item('recent', ` data-path="${esc(r.path)}" title="${esc(r.path)}"`, r.name, folderOf(r.path), isHere(r.name, r.path)));
        }
      }
    }
    const extra = (templateList || []).filter((t) => !listed.has(sceneKey(t.name)) && !listed.has(sceneKey(t.id)));
    if (extra.length) {
      out.push('<div class="pop-label">TEMPLATES</div>');
      for (const t of extra) {
        const current = !p.path && (sceneKey(t.name) === here || sceneKey(t.id) === here);
        out.push(item('template', ` data-id="${esc(t.id)}"`, t.name, t.vibe, current));
      }
    }
    out.push('<button class="pop-item pop-action" data-choice="choose"><b class="pop-name">Choose a .sway file</b></button>');
    return out.join('');
  }

  function onSceneChoice(choice, data) {
    if (['new', 'open', 'save', 'saveas', 'template'].includes(choice)) {
      runProjectChoice(choice, data);
      return;
    }
    // theDAW reloads the cockpit into the scene, and unsaved work here goes with it.
    if (project().dirty && !window.confirm('Discard unsaved changes?')) return;
    if (choice === 'scene') postToHost({ type: 'sway/open-scene', name: data.name });
    else if (choice === 'recent') postToHost({ type: 'sway/open-scene', path: data.path });
    else if (choice === 'choose') postToHost({ type: 'sway/choose-scene-file' });
  }

  function showScene() {
    openPopover(sceneBtn, sceneHtml(), onSceneChoice, { owner: 'scene', align: 'left' });
  }

  sceneBtn.addEventListener('click', () => {
    if (popoverAnchor() === sceneBtn) {
      closePopover();
      return;
    }
    postToHost({ type: 'sway/request-scenes' });
    showScene();
    if (!templateList) {
      Promise.resolve(templates())
        .then((list) => {
          templateList = Array.isArray(list) ? list : [];
          if (popoverOwner() === 'scene') showScene();
        })
        .catch(() => {
          templateList = [];
        });
    }
  });

  // --- Sway status ------------------------------------------------------------

  function device() {
    const st = hostState.status;
    if (!st) return { tone: 'none', word: 'Waiting for theDAW', name: '' };
    const name = displayPortName(st.hardware.replace(/^Sway:\s*/i, ''));
    return { tone: st.tone, word: STATE_WORD[st.tone], name };
  }

  function paintStatus() {
    const d = device();
    for (const tone of ['ok', 'none', 'off']) swayDot.classList.toggle(`tone-${tone}`, tone === d.tone);
    const text = d.name ? `${d.word}, ${d.name}` : d.word;
    swayBtn.setAttribute('aria-label', `Audima Labs Sway status: ${text}`);
    swayBtn.title = `Audima Labs Sway: ${text}`;
  }

  function swayHtml() {
    const d = device();
    const src = hostState.audioSource || 'host';
    return (
      '<div class="pop-label">AUDIMA LABS SWAY</div>' +
      `<div class="pop-row"><i class="hk-dot tone-${d.tone}" id="host-dev-dot"></i><span id="host-dev-word">${esc(d.word)}</span>` +
      `<b class="pop-val" id="host-dev-name">${esc(d.name)}</b></div>` +
      '<div class="pop-sep" role="separator"></div>' +
      '<div class="pop-row"><label for="host-audio">Audio input</label><select id="host-audio" name="host-audio">' +
      `<option value="host"${src === 'host' ? ' selected' : ''}>theDAW master</option>` +
      `<option value="input"${src === 'input' ? ' selected' : ''}>Input device</option></select></div>` +
      `<div class="pop-row"><span>theDAW link</span><b class="pop-val" id="host-link">${hasHost() ? 'Linked' : 'Not linked'}</b></div>` +
      `<div class="pop-row"><span>Frame rate</span><b class="pop-val" id="host-fps">${fps()} fps</b></div>`
    );
  }

  // Values change in place, so an open select is never torn down under the pointer.
  function updateSwayPanel() {
    if (popoverOwner() !== 'sway') return;
    const d = device();
    const set = (sel, text) => {
      const el = document.querySelector(sel);
      if (el && el.textContent !== text) el.textContent = text;
    };
    const dot = document.querySelector('#host-dev-dot');
    if (dot) dot.className = `hk-dot tone-${d.tone}`;
    set('#host-dev-word', d.word);
    set('#host-dev-name', d.name);
    set('#host-link', hasHost() ? 'Linked' : 'Not linked');
    set('#host-fps', `${fps()} fps`);
    const sel = document.querySelector('#host-audio');
    if (sel && hostState.audioSource && sel.value !== hostState.audioSource) sel.value = hostState.audioSource;
  }

  swayBtn.addEventListener('click', () => {
    if (popoverAnchor() === swayBtn) {
      closePopover();
      return;
    }
    openPopover(swayBtn, swayHtml(), null, { owner: 'sway', role: 'dialog', label: 'Audima Labs Sway status', align: 'right' });
    clearInterval(fpsTimer);
    fpsTimer = setInterval(() => {
      if (popoverOwner() !== 'sway') {
        clearInterval(fpsTimer);
        fpsTimer = 0;
        return;
      }
      updateSwayPanel();
    }, 500);
  });

  $('#popover').addEventListener('change', (e) => {
    if (e.target.id !== 'host-audio') return;
    postToHost({ type: 'sway/set-audio-source', source: e.target.value === 'input' ? 'input' : 'host' });
  });

  // --- tools and help ------------------------------------------------------------

  $('#host-tools').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-drawer]');
    if (btn) toggleDrawer(btn.dataset.drawer);
  });

  function helpHtml() {
    return (
      '<button class="pop-item" data-choice="docs"><b class="pop-name">Docs</b><kbd>D</kbd></button>' +
      '<button class="pop-item" data-choice="help"><b class="pop-name">Help</b><kbd>H</kbd></button>' +
      '<div class="pop-label">SHORTCUTS</div>' +
      SHORTCUTS.map(
        ([what, keys]) => `<div class="pop-short" role="menuitem" aria-disabled="true"><span>${what}</span><kbd>${keys}</kbd></div>`
      ).join('')
    );
  }

  helpBtn.addEventListener('click', () => {
    if (popoverAnchor() === helpBtn) {
      closePopover();
      return;
    }
    openPopover(helpBtn, helpHtml(), (choice) => (choice === 'docs' ? openDocs() : openHelp()), { owner: 'help', align: 'right' });
  });

  // --- host messages ----------------------------------------------------------------

  onHostEvent('sway/host-ready', activate);
  onHostEvent('sway/host-status', () => {
    if (active) paintStatus();
    updateSwayPanel();
  });
  onHostEvent('sway/audio-source', updateSwayPanel);
  onHostEvent('sway/host-scenes', () => {
    if (popoverOwner() === 'scene') showScene();
  });

  const api = {
    get active() {
      return active;
    },
    // The scene key reads the loaded scene; a dirty project shows on it.
    setScene(name, dirty) {
      if (!active) return;
      const label = name || 'Untitled';
      if (label !== shownScene) {
        shownScene = label;
        sceneName.textContent = label;
        sceneBtn.title = `Scene: ${label}`;
        sceneBtn.setAttribute('aria-label', `Scene menu, ${label}`);
      }
      sceneBtn.classList.toggle('dirty', !!dirty);
    },
    // The loop key's pressed state, for assistive technology.
    paintTransport(loopOn) {
      if (loopOn === loopShown) return;
      loopShown = loopOn;
      $('#t-loop').setAttribute('aria-pressed', String(!!loopOn));
    },
  };
  activate(); // the handshake can finish before the cockpit's UI is built
  return api;
}
