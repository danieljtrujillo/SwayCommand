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

const BUILD = typeof __SWAY_EMBED_BUILD__ !== 'undefined' ? __SWAY_EMBED_BUILD__ : {};

const SETTINGS_KEY = 'sway:settings';
const RECENTS_KEY = 'sway:recents';
const PROJECTS_KEY = 'sway:projects';

/** Files handed to us by a picker or a drop, addressed by a synthetic path. */
const fileRegistry = new Map();
let fileSeq = 0;

/** theDAW's API origin. Same-origin by construction, so a bare path works. */
const api = (path) => path;

/** Fetch JSON from theDAW, resolving to null instead of throwing. */
async function apiJson(path, init) {
  try {
    const res = await fetch(api(path), init);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

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
  const order = await templateIndex();
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

async function readAudio(filePath) {
  const file = fileRegistry.get(filePath);
  if (file) {
    return new Uint8Array(await file.arrayBuffer());
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

async function openDialog() {
  const paths = await pickFiles({ multiple: false, accept: '.sway,application/json' });
  return paths[0] || null;
}

async function saveDialog(name) {
  const safe = String(name || 'project').replace(/[\\/:*?"<>|]/g, '_');
  const withExt = safe.toLowerCase().endsWith('.sway') ? safe : `${safe}.sway`;
  return `swayproject:/${withExt}`;
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

async function writeProject(filePath, doc) {
  const store = projectStore();
  store[filePath] = doc;
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

async function listGan() {
  const data = await apiJson('/api/plugin/list');
  if (!data) return [];
  const items = Array.isArray(data) ? data : data.plugins || [];
  return items.map((p) => ({
    id: p.id,
    name: p.name || p.id,
    url: p.entry_url || p.url || '',
    manifest: p.manifest || p,
  }));
}

async function openGan(idOrPath) {
  const data = await apiJson('/api/plugin/open', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(
      typeof idOrPath === 'string' && idOrPath.includes('/')
        ? { path: idOrPath }
        : { id: idOrPath },
    ),
  });
  if (!data) return null;
  return {
    id: data.id || idOrPath,
    name: data.name || data.id || 'plugin',
    url: data.entry_url || data.url || '',
    manifest: data.manifest || data,
  };
}

async function vstStatus() {
  const data = await apiJson('/api/vst/scan');
  if (!data) {
    return { ok: false, detail: 'theDAW VST host is not reachable.', plugins: [] };
  }
  const plugins = Array.isArray(data) ? data : data.plugins || [];
  return { ok: true, detail: 'pedalboard via theDAW', python: 'theDAW', plugins };
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
      pickGan: async () => (await pickFiles({ multiple: false, accept: '.gan' }))[0] || null,
      openGan,
      listGan,
      removeGan: async () => ({ ok: false }),
    },

    vst: {
      status: vstStatus,
      setPython: unsupported('Choosing a Python interpreter'),
      pickPython: unsupported('Choosing a Python interpreter'),
      scan: vstStatus,
      params: async (pluginPath, state) =>
        (await apiJson('/api/vst/load', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ path: pluginPath, state }),
        })) || { ok: false, params: [] },
      render: async () => ({
        ok: false,
        detail: 'Render through theDAW’s MIX chain while the cockpit is embedded.',
      }),
      editor: async (pluginPath) =>
        (await apiJson('/api/vst/open-editor', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ path: pluginPath }),
        })) || { ok: false, detail: 'theDAW VST host is not reachable.' },
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
