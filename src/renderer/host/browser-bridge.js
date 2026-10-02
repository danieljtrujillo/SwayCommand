// The browser implementation of the `window.swaycommand` surface.
//
// In Electron, preload.js installs that object at document-start over
// contextBridge. When the cockpit is served over http instead -- theDAW embeds
// it in an iframe at /sway-app/ -- there is no preload and no ipcRenderer, so
// this stands in with the same 8 namespaces and the same method signatures.
// Not one of the ~42 call sites in the renderer changes.
//
// Two rules govern everything below.
//
//   1. NOTHING MAY REJECT. app.js ends with `main().catch(err => document.body
//      .innerHTML = <red stack trace>)`, and main() awaits this bridge about a
//      dozen times. One rejected promise replaces the entire cockpit with a
//      stack dump inside theDAW's tab. Every method resolves, degraded if it
//      must, and reports trouble through its return shape.
//
//   2. Shapes are copied from src/main/*, not invented. `project.readTemplate`
//      returning `{doc, path, dir, warnings}` and `docs.list` returning
//      `[{id, title}]` are contracts the UI already destructures.
//
// Capabilities that genuinely need a desktop process -- USB enumeration, the
// DFU driver installer, WASAPI loopback -- report themselves unsupported here
// rather than pretending. The desktop app remains the place for those.

import { framedByTheDAW } from './host-channel.js';

const BUILD = typeof __SWAY_EMBED_BUILD__ !== 'undefined' ? __SWAY_EMBED_BUILD__ : {};

// theDAW's SWAY tab boots into this template (SwayView's DEFAULT_TEMPLATE), so
// inside theDAW the TEMPLATES list leads with it.
const THEDAW_FIRST_TEMPLATE = 'will-i-dream';

const SETTINGS_KEY = 'sway:settings';
const RECENTS_KEY = 'sway:recents';
const PROJECTS_KEY = 'sway:projects';

/** Files handed to us by a picker or a drop, addressed by a synthetic path. */
const fileRegistry = new Map();
let fileSeq = 0;

/** theDAW's API origin. Same-origin by construction, so a bare path works. */
const api = (path) => path;

function readJson(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch {
    // A private window, cleared site data, or a browser blocking storage.
    return fallback;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

// --- settings ---------------------------------------------------------------
// Mirrors main.js's readSettings/writeSettings, including its shallow-merge
// semantics: writeSettings(patch) merges and returns the whole object.

function readSettings() {
  return readJson(SETTINGS_KEY, {});
}

function writeSettings(patch) {
  const next = { ...readSettings(), ...(patch || {}) };
  writeJson(SETTINGS_KEY, next);
  return next;
}

// --- templates and docs -----------------------------------------------------
// Both ship inside the embed bundle, so they need no backend at all. The build
// copies projects/templates/ and the DOC_ORDER markdown into dist-embed/, plus
// a prebuilt docs-index.json so listing costs one request.

async function fetchStatic(relPath) {
  // Relative to the document base (<base href="/sway-app/">), so this works
  // under any mount point without knowing it.
  const res = await fetch(`./${relPath}`);
  if (!res.ok) throw new Error(`${relPath}: HTTP ${res.status}`);
  return res;
}

async function templateIndex() {
  try {
    const res = await fetchStatic('templates/index.json');
    const idx = await res.json();
    return Array.isArray(idx.order) ? idx.order : [];
  } catch {
    return [];
  }
}

async function listTemplates() {
  let order = await templateIndex();
  if (framedByTheDAW() && order.includes(THEDAW_FIRST_TEMPLATE)) {
    order = [THEDAW_FIRST_TEMPLATE, ...order.filter((id) => id !== THEDAW_FIRST_TEMPLATE)];
  }
  const out = [];
  for (const id of order) {
    try {
      const res = await fetchStatic(`templates/${id}.sway`);
      const doc = await res.json();
      const meta = (doc.project && doc.project.meta) || {};
      out.push({
        id,
        name: meta.name || id,
        description: meta.description || '',
        vibe: meta.vibe || '',
        bpmHint: meta.bpmHint || 0,
        palette: (doc.project && doc.project.palette) || [],
      });
    } catch (err) {
      console.error(`[templates] failed to load ${id}:`, err.message);
    }
  }
  return out;
}

async function readTemplate(id) {
  const order = await templateIndex();
  if (!order.includes(id)) throw new Error(`Unknown template: ${id}`);
  const res = await fetchStatic(`templates/${id}.sway`);
  const raw = await res.json();
  // validateProject lives in src/shared and is bundled; the host module imports
  // it lazily to keep this file free of a hard dependency cycle.
  const { validateProject } = await import('../../shared/swayproject.js');
  const { doc, warnings } = validateProject(raw);
  return { doc, path: null, dir: null, warnings };
}

async function listDocs() {
  try {
    const res = await fetchStatic('docs-index.json');
    const list = await res.json();
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function readDoc(id) {
  const list = await listDocs();
  if (!list.some((d) => d.id === id)) throw new Error(`Unknown document: ${id}`);
  const res = await fetchStatic(`docs/${id}`);
  return await res.text();
}

// --- files ------------------------------------------------------------------
// A browser has no real paths. Files reach us as File objects (a picker or a
// drop) and are addressed by a synthetic `swaydrop:` path. The EXTENSION is
// load-bearing: app.js regexes it to decide audio vs .gan, so it is preserved.

function registerFile(file) {
  const id = ++fileSeq;
  const path = `swaydrop:/${id}/${file.name}`;
  fileRegistry.set(path, file);
  return path;
}

function pickFiles({ multiple = true, accept = '' } = {}) {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = multiple;
    if (accept) input.accept = accept;
    input.style.display = 'none';
    document.body.appendChild(input);
    let settled = false;
    const done = (paths) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(paths);
    };
    input.addEventListener('change', () => {
      done(Array.from(input.files || []).map(registerFile));
    });
    // A cancelled picker fires no 'change' in most browsers. Resolve empty on
    // the next focus so a cancel never leaves the caller awaiting forever.
    window.addEventListener(
      'focus',
      () => setTimeout(() => done([]), 400),
      { once: true },
    );
    input.click();
  });
}

/** A media path that is a URL the host serves (its library, a stem). */
const isUrlPath = (p) => /^(https?:\/\/|\/api\/)/.test(p);

async function readAudio(filePath) {
  const file = fileRegistry.get(filePath);
  if (file) {
    return new Uint8Array(await file.arrayBuffer());
  }
  if (isUrlPath(filePath)) {
    // Media the host handed over by URL (sway/load-audio): fetched as is, so it
    // survives a reload as long as the host still serves it.
    const res = await fetch(filePath);
    if (!res.ok) throw new Error(`Cannot read ${filePath}: HTTP ${res.status}`);
    return new Uint8Array(await res.arrayBuffer());
  }
  // A path from a saved project: ask theDAW, which also transcodes formats
  // Chromium cannot decode.
  try {
    const res = await fetch(api(`/api/project/clip-audio?path=${encodeURIComponent(filePath)}`));
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return new Uint8Array(await res.arrayBuffer());
  } catch (err) {
    throw new Error(`Cannot read ${filePath}: ${err.message}`);
  }
}

async function statAudio(filePath) {
  const file = fileRegistry.get(filePath);
  if (!file && isUrlPath(filePath)) return { size: 0, sha256: '', missing: false };
  if (!file) return { size: 0, sha256: '', missing: true };
  const buf = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buf);
  const sha256 = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return { size: file.size, sha256, missing: false };
}

// --- projects ---------------------------------------------------------------
// Saved into localStorage under a virtual path, and additionally offered as a
// download so a project can leave the browser. Opening accepts a real file.

function projectStore() {
  return readJson(PROJECTS_KEY, {});
}

function pushRecent(path, name) {
  const list = readJson(RECENTS_KEY, []).filter((r) => r && r.path !== path);
  list.unshift({ path, name });
  writeJson(RECENTS_KEY, list.slice(0, 10));
}

// Both dialogs resolve to { path } or null, the shape main.js returns and
// projectstore.js reads (picked.path).
async function openDialog() {
  const paths = await pickFiles({ multiple: false, accept: '.sway,application/json' });
  return paths[0] ? { path: paths[0] } : null;
}

async function saveDialog(name) {
  const safe = String(name || 'project').replace(/[\\/:*?"<>|]/g, '_');
  const withExt = safe.toLowerCase().endsWith('.sway') ? safe : `${safe}.sway`;
  return { path: `swayproject:/${withExt}` };
}

async function readProject(filePath) {
  const { validateProject } = await import('../../shared/swayproject.js');
  const file = fileRegistry.get(filePath);
  let raw;
  if (file) {
    raw = JSON.parse(await file.text());
  } else {
    const stored = projectStore()[filePath];
    if (!stored) throw new Error(`No such project: ${filePath}`);
    raw = stored;
  }
  const { doc, warnings } = validateProject(raw);
  pushRecent(filePath, filePath.split('/').pop() || filePath);
  return { doc, path: filePath, dir: null, warnings };
}

// Inside theDAW every save also lands as a real .sway in theDAW's
// data/sway-projects (POST /api/sway/project-save), so it survives cleared
// browser storage and appears in theDAW's scene lists. Fire and forget: a
// mirror that fails never fails the save.
function mirrorToTheDAW(filePath, doc) {
  try {
    fetch(api('/api/sway/project-save'), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: filePath.split('/').pop() || filePath, doc }),
    }).catch(() => {});
  } catch {
    /* the localStorage copy is the durable half */
  }
}

async function writeProject(filePath, doc) {
  const store = projectStore();
  store[filePath] = doc;
  if (framedByTheDAW()) mirrorToTheDAW(filePath, doc);
  const ok = writeJson(PROJECTS_KEY, store);
  pushRecent(filePath, filePath.split('/').pop() || filePath);
  // Also hand the user a real file, since browser storage is not a place to
  // keep work that matters.
  try {
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filePath.split('/').pop() || 'project.sway';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch {
    /* the localStorage copy above is the durable half */
  }
  return {
    path: filePath,
    warnings: ok ? [] : ['Browser storage is full; the downloaded copy is the only one.'],
  };
}

// --- plugins and VST, through theDAW ----------------------------------------
// theDAW's routes answer in their own shapes; everything here reshapes them
// into what src/main/ganfile.js and src/main/vsthost.js return on the desktop,
// so app.js and ui/assign.js read one shape in both hosts.

/** Fetch JSON from theDAW and keep the failure: { ok, status, data, detail }. */
async function apiCall(path, init) {
  try {
    const res = await fetch(api(path), init);
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok) {
      const detail =
        data && typeof data.detail === 'string' && data.detail ? data.detail : `theDAW answered HTTP ${res.status}.`;
      return { ok: false, status: res.status, data, detail };
    }
    return { ok: true, status: res.status, data, detail: '' };
  } catch {
    return { ok: false, status: 0, data: null, detail: 'theDAW is not reachable.' };
  }
}

const postJson = (path, body) =>
  apiCall(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });

const stemOf = (p) =>
  String(p || '')
    .split(/[\\/]/)
    .pop()
    .replace(/\.[a-z0-9]+$/i, '');

/** ganfile.js describe(): the one .gan shape the plugin panel renders. */
function describeGan(id, manifest, source, url) {
  const m = manifest && typeof manifest === 'object' ? manifest : {};
  const entry = String(m.entry_html || 'index.html').replace(/^\/+/, '');
  return {
    id,
    name: m.name || id,
    description: m.description || '',
    source: source || null,
    entry,
    url: url || '',
    controls: (Array.isArray(m.controls) ? m.controls : []).map((c) => ({
      id: String(c.id),
      name: String(c.name || c.id),
      kind: String(c.kind || 'value'),
    })),
    params: Array.isArray(m.params) ? m.params : [],
    canvas: m.canvas || null,
  };
}

/** theDAW's installed .gan plugins (GET /api/plugin/list). */
async function listGan() {
  const r = await apiCall('/api/plugin/list');
  if (!r.ok) return [];
  const items = Array.isArray(r.data) ? r.data : (r.data && r.data.plugins) || [];
  return items.filter((p) => p && p.id).map((p) => describeGan(String(p.id), p, p.gan_path || null, p.entry_url || ''));
}

/** A .gan on disk, or one of theDAW's installed ids. Anything with a path
 *  separator or the .gan extension is a file; a bare word is an id. */
const looksLikeGanPath = (s) => /[\\/]/.test(s) || /\.gan$/i.test(s);

/**
 * Opens (installing when needed) a .gan through theDAW. Throws with theDAW's
 * reason on failure: loadGan and showGan in app.js catch and show it, the
 * same contract the desktop's ipc handler has.
 */
async function openGan(idOrPath) {
  const key = String(idOrPath || '');
  if (!key) throw new Error('nothing to open');
  if (key.startsWith('swaydrop:')) {
    throw new Error('a .gan picked in the browser has no file theDAW can read; use LOAD to choose one from theDAW');
  }
  const r = await postJson('/api/plugin/open', looksLikeGanPath(key) ? { path: key } : { id: key });
  if (!r.ok) throw new Error(r.detail);
  const d = r.data || {};
  const manifest = d.manifest && typeof d.manifest === 'object' ? d.manifest : {};
  const id = String(manifest.id || (looksLikeGanPath(key) ? stemOf(key) : key));
  return describeGan(id, manifest, d.gan_path || (looksLikeGanPath(key) ? key : null), d.entry_url || '');
}

/** pedalboard's own effects have no .vst3 file; only the desktop renders them. */
const isBuiltin = (p) => typeof p === 'string' && p.startsWith('builtin:');
const BUILTIN_DETAIL = "pedalboard's built-in effects render in the SwayCommand desktop app; theDAW hosts VST3 plugins.";

/** vsthost.js status(): the pill reads `pedalboard`, the note reads `python`. */
async function vstStatus() {
  const r = await apiCall('/api/vst/scan');
  if (!r.ok) {
    return { ok: false, python: null, pedalboard: null, pythonVersion: null, error: r.detail, script: null };
  }
  return { ok: true, python: 'theDAW', pedalboard: 'theDAW', pythonVersion: null, error: null, script: null };
}

/** vsthost.js scan(): [{ name, path, vendor, category }] from theDAW's scanner rows. */
async function vstScan() {
  const r = await apiCall('/api/vst/scan');
  if (!r.ok) throw new Error(r.detail);
  const rows = Array.isArray(r.data) ? r.data : (r.data && r.data.plugins) || [];
  return rows
    .filter((p) => p && typeof p.path === 'string')
    .map((p) => ({
      name: p.display_name || p.name || stemOf(p.path),
      path: p.path,
      vendor: p.manufacturer || p.vendor || '',
      category: p.category || 'unknown',
    }));
}

/**
 * vst-host.py's param rows from theDAW's parameter descriptors: one row per
 * parameter, keyed the way pedalboard keys `plugin.parameters`. A value the
 * track panel already holds for a row replaces the plugin's default, so what
 * the panel shows is what a render applies.
 */
function paramRows(parameters, stored) {
  const rows = [];
  for (const [key, p] of Object.entries(parameters && typeof parameters === 'object' ? parameters : {})) {
    const held = stored && stored[key] !== undefined ? Number(stored[key]) : NaN;
    const raw = Number.isFinite(held) ? held : typeof (p && p.raw_value) === 'number' ? p.raw_value : null;
    rows.push({ name: key, raw, text: String((p && p.label) || '').slice(0, 48) });
  }
  return rows;
}

/**
 * The plugin's parameter list. theDAW loads the plugin into a worker of its
 * own (POST /api/vst/load), answers the descriptors, and the worker is
 * released again (DELETE /api/vst/unload) once the rows are read.
 */
async function vstParams(pluginPath, state) {
  if (isBuiltin(pluginPath)) return { ok: false, name: pluginPath, params: [], error: BUILTIN_DETAIL };
  const r = await postJson('/api/vst/load', { plugin_path: pluginPath });
  if (!r.ok) return { ok: false, name: stemOf(pluginPath), params: [], error: r.detail };
  const d = r.data || {};
  if (d.instance_id) {
    await apiCall(`/api/vst/unload/${encodeURIComponent(d.instance_id)}`, { method: 'DELETE' });
  }
  return { ok: true, name: d.plugin_name || stemOf(pluginPath), params: paramRows(d.parameters, state && state.params) };
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const EDITOR_POLL_MS = 750;
const EDITOR_WAIT_MS = 6 * 3600 * 1000; // the desktop sidecar's own ceiling

/**
 * Opens the plugin's own window on the machine running theDAW (POST
 * /api/vst/open-editor) and waits for it to close, polling GET
 * /api/vst/editor-result the way theDAW's MIX view does. Resolves with the
 * state the window captured; `params` is empty because that state is the
 * whole plugin, and a render applies it before any row of the track panel.
 */
async function vstEditor(pluginPath, state) {
  if (isBuiltin(pluginPath)) {
    return { ok: false, error: 'this effect has no window of its own; set its values in the track panel' };
  }
  const opened = await postJson('/api/vst/open-editor', {
    plugin_path: pluginPath,
    raw_state: (state && state.rawState) || null,
  });
  if (!opened.ok) return { ok: false, error: opened.detail };
  const started = Date.now();
  let silent = 0;
  while (Date.now() - started < EDITOR_WAIT_MS) {
    await sleep(EDITOR_POLL_MS);
    const r = await apiCall(`/api/vst/editor-result?plugin_path=${encodeURIComponent(pluginPath)}`);
    const d = r.ok && r.data && typeof r.data === 'object' ? r.data : null;
    if (d && d.status === 'ok') {
      return { ok: true, rawState: typeof d.raw_state === 'string' && d.raw_state ? d.raw_state : null, params: [] };
    }
    if (d && d.status === 'error') return { ok: false, error: d.error || 'the plugin window could not open' };
    if (d && (d.status === 'launching' || d.status === 'opening')) {
      silent = 0;
      continue;
    }
    // No session on file, or theDAW unreachable: a few misses in a row mean
    // the window is gone without a result.
    if (++silent > 4) return { ok: false, error: r.ok ? 'theDAW lost track of the plugin window.' : r.detail };
  }
  return { ok: false, error: 'the plugin window stayed open too long and theDAW stopped waiting for it' };
}

/** The path the render route reads for a clip, or null for browser-only media. */
function renderableInput(mediaPath) {
  const p = typeof mediaPath === 'string' ? mediaPath.trim() : '';
  if (!p || p.startsWith('swaydrop:') || p.startsWith('swayproject:')) return null;
  // An absolute path from a scene, or the URL theDAW served the clip from
  // (its library, a stem, clip-audio): theDAW resolves both to the file.
  return p;
}

/**
 * vsthost.js render(): the clip through the track's chain, rendered by
 * theDAW (POST /api/sway/vst-render) to a WAV under its data folder, which
 * readAudio then fetches through clip-audio like any scene media.
 */
async function vstRender(inputPath, plugins, opts) {
  const input = renderableInput(inputPath);
  if (!input) {
    return {
      ok: false,
      detail:
        'This clip was picked in the browser and has no file theDAW can read. Load it from theDAW instead (right-click the track and pick it from the library), then render.',
    };
  }
  const chain = Array.isArray(plugins) ? plugins : [];
  const builtin = chain.find((p) => isBuiltin(p && p.path));
  if (builtin) return { ok: false, detail: `${builtin.name || builtin.path}: ${BUILTIN_DETAIL}` };
  const r = await postJson('/api/sway/vst-render', {
    input,
    plugins: chain.map((p) => ({ path: p.path, params: p.params || {}, rawState: p.rawState || null })),
    tail: opts && Number.isFinite(opts.tail) ? opts.tail : 3,
  });
  if (!r.ok) {
    const noRoute = r.status === 404 && r.detail === 'Not Found';
    return {
      ok: false,
      detail: noRoute ? 'This theDAW backend has no render route for the cockpit yet; restart theDAW and render again.' : r.detail,
    };
  }
  const d = r.data || {};
  if (typeof d.output !== 'string' || !d.output) return { ok: false, detail: 'theDAW rendered nothing.' };
  return {
    ok: true,
    output: d.output,
    seconds: Number(d.seconds) || 0,
    sampleRate: Number(d.sampleRate) || 0,
    cached: d.cached === true,
    warnings: Array.isArray(d.warnings) ? d.warnings : [],
  };
}

// --- the surface ------------------------------------------------------------

export function createBrowserBridge() {
  const unsupported = (what) => async () => ({
    ok: false,
    detail: `${what} is available in the SwayCommand desktop app.`,
  });

  return {
    info: async () => ({
      name: BUILD.name || 'SwayCommand',
      version: BUILD.version || '0.0.0',
      platform: 'browser',
      arch: 'wasm',
      // Lets anything that cares tell the two hosts apart without sniffing.
      mode: 'browser',
      host: 'theDAW',
      build: BUILD,
    }),

    plugins: {
      // A list of paths, as the desktop's dialog answers. Inside theDAW the
      // LOAD button asks the host instead (app.js), since a browser pick has
      // no disk path for theDAW to open.
      pickGan: () => pickFiles({ multiple: false, accept: '.gan' }),
      openGan,
      listGan,
      removeGan: async () => ({ ok: false }),
    },

    // The methods a click reaches (params, editor, render) report a failure as
    // { ok: false, error | detail }, which ui/assign.js and app.js turn into
    // the notice the desktop shows for a rejected ipc call.
    vst: {
      status: vstStatus,
      setPython: unsupported('Choosing a Python interpreter'),
      pickPython: unsupported('Choosing a Python interpreter'),
      scan: vstScan,
      params: vstParams,
      render: vstRender,
      editor: vstEditor,
    },

    doctor: {
      // Two honest rows. The renderer's own checks (WebGL2, Web MIDI ports,
      // audio inputs) run alongside these and answer the questions that
      // actually matter for playing.
      run: async () => [
        {
          id: 'platform',
          label: 'Running inside theDAW',
          status: 'ok',
          detail: 'The cockpit is embedded. theDAW supplies MIDI and audio.',
        },
        {
          id: 'desktop-only',
          label: 'Hardware checks',
          status: 'info',
          detail:
            'USB detection, driver installation and system-audio capture run in the SwayCommand desktop app.',
        },
      ],
      fix: async () => ({ ok: false, detail: 'Fixes run in the desktop app.' }),
      onFixProgress: () => () => {},
    },

    project: {
      openDialog,
      saveDialog,
      read: readProject,
      write: writeProject,
      recent: async () => readJson(RECENTS_KEY, []),
      templates: listTemplates,
      readTemplate,
    },

    docs: { list: listDocs, read: readDoc },

    files: {
      pickAudio: () => pickFiles({ multiple: true, accept: 'audio/*' }),
      readAudio,
      statAudio,
      // Synchronous by contract (app.js calls it inline during a drop).
      pathOf: (file) => {
        try {
          return registerFile(file);
        } catch {
          return '';
        }
      },
    },

    platform: {
      systemAudio: async () => ({
        supported: false,
        detail:
          'Inside theDAW, choose "theDAW master" as the audio source to make the visuals follow what you are making, or pick a hardware input. System-audio capture is a desktop-app capability.',
      }),
    },

    settings: {
      get: async () => readSettings(),
      set: async (patch) => writeSettings(patch),
    },

    openExternal: async (url) => {
      try {
        window.open(url, '_blank', 'noopener,noreferrer');
        return { ok: true };
      } catch {
        return { ok: false };
      }
    },
  };
}
