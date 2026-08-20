// AKSWAYJ main process — window lifecycle, permissions, IPC surface.

'use strict';

const path = require('node:path');
const fs = require('node:fs');
const { app, BrowserWindow, desktopCapturer, dialog, ipcMain, session, shell } = require('electron');

const doctor = require('./doctor');
const audima = require('./audima');
const driver = require('./driver-install');
const { APP } = require('../shared/constants');

let win = null;

// Domains the renderer may ask the main process to open in the system browser.
// Subdomains of each entry are accepted. The list covers the application's own
// endpoints plus every host cited by the bundled documentation, so links in the
// docs viewer resolve without widening the policy to arbitrary URLs.
const EXTERNAL_ALLOW = [
  'audima.com.au',
  'github.com',
  'githubusercontent.com',
  'nodejs.org',
  'community.polyexpression.com',
  'discord.com',
  'vidvox.net',
  'huggingface.co',
  'unity.com',
  'resolume.com',
  'st3nd.com',
  'serato.com',
  'synesthesia.live',
  'elektronauts.com',
  'indiegogo.com',
];

function allowedExternal(url) {
  try {
    const u = new URL(url);
    return (
      u.protocol === 'https:' &&
      EXTERNAL_ALLOW.some((d) => u.hostname === d || u.hostname.endsWith('.' + d))
    );
  } catch {
    return false;
  }
}

function settingsPath() {
  return path.join(app.getPath('userData'), 'settings.json');
}

function readSettings() {
  try {
    return JSON.parse(fs.readFileSync(settingsPath(), 'utf8'));
  } catch {
    return {};
  }
}

function writeSettings(patch) {
  const merged = { ...readSettings(), ...patch };
  fs.mkdirSync(app.getPath('userData'), { recursive: true });
  fs.writeFileSync(settingsPath(), JSON.stringify(merged, null, 2));
  return merged;
}

function projectsDir() {
  // package root in dev; resources/app.asar root when packaged
  return path.join(__dirname, '..', '..', 'projects');
}

function listProjects() {
  const dir = projectsDir();
  const index = JSON.parse(fs.readFileSync(path.join(dir, 'index.json'), 'utf8'));
  return index.order
    .map((id) => {
      try {
        return JSON.parse(fs.readFileSync(path.join(dir, `${id}.json`), 'utf8'));
      } catch (err) {
        console.error(`[projects] failed to load ${id}:`, err.message);
        return null;
      }
    })
    .filter(Boolean);
}

// --- audio files ------------------------------------------------------------
// Stems and one-shots are chosen through the OS file dialog and read in the
// main process; the renderer receives raw bytes and decodes them itself. The
// page CSP forbids file:// fetches, so this is the only path in.

const AUDIO_EXTENSIONS = ['wav', 'mp3', 'flac', 'ogg', 'm4a', 'aac', 'aiff', 'aif', 'opus', 'webm'];
const MAX_AUDIO_BYTES = 256 * 1024 * 1024; // a long stem is fine; a video file is not

async function pickAudioFiles() {
  const result = await dialog.showOpenDialog(win, {
    title: 'Add stems and samples',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Audio', extensions: AUDIO_EXTENSIONS },
      { name: 'All files', extensions: ['*'] },
    ],
  });
  if (result.canceled) return [];
  return result.filePaths.map((p) => ({ path: p, name: path.basename(p) }));
}

function readAudioFile(filePath) {
  const stat = fs.statSync(filePath);
  if (stat.size > MAX_AUDIO_BYTES) {
    throw new Error(`${path.basename(filePath)} is ${Math.round(stat.size / 1e6)} MB; the limit is ${MAX_AUDIO_BYTES / 1e6} MB`);
  }
  return fs.readFileSync(filePath); // arrives in the renderer as a Uint8Array
}

// --- bundled documentation ------------------------------------------------
// Docs ship as Markdown inside the package. The renderer requests them by
// name; names are validated against the enumerated set, so no caller-supplied
// path ever reaches the filesystem.

function docsRoot() {
  return path.join(__dirname, '..', '..');
}

// Reading order for the viewer's sidebar. Entries absent from disk are skipped.
const DOC_ORDER = [
  'README.md',
  'docs/INDEX.md',
  'docs/OVERVIEW.md',
  'docs/INSTALLATION.md',
  'docs/DOCTOR.md',
  'docs/STUDIO.md',
  'docs/SYNTH.md',
  'docs/TROUBLESHOOTING.md',
  'docs/ARCHITECTURE.md',
  'docs/ENGINE.md',
  'docs/SCENE_CONTRACT.md',
  'docs/PROJECTS.md',
  'docs/MIDI.md',
  'docs/AUDIO.md',
  'docs/SWAY_INTEGRATION.md',
  'docs/BUILD.md',
  'docs/ENVIRONMENT.md',
  'docs/RESEARCH.md',
];

function listDocs() {
  const root = docsRoot();
  return DOC_ORDER.map((rel) => {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) return null;
    let title = path.basename(rel, '.md');
    try {
      const head = fs.readFileSync(abs, 'utf8').slice(0, 4096);
      const m = /^#\s+(.+)$/m.exec(head);
      if (m) title = m[1].trim();
    } catch {
      /* fall back to the file name */
    }
    return { id: rel, title };
  }).filter(Boolean);
}

function readDoc(id) {
  // Only ids the enumeration produced are readable.
  if (!DOC_ORDER.includes(id)) throw new Error(`Unknown document: ${id}`);
  return fs.readFileSync(path.join(docsRoot(), id), 'utf8');
}

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 960,
    minHeight: 600,
    backgroundColor: '#05060a',
    title: APP.NAME,
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.once('ready-to-show', () => win.show());

  const query = {};
  if (process.env.AKSWAYJ_AUTOPLAY) query.autoplay = process.env.AKSWAYJ_AUTOPLAY;
  if (process.env.AKSWAYJ_SCENE) query.scene = process.env.AKSWAYJ_SCENE;
  win.loadFile(path.join(__dirname, '..', '..', 'dist', 'index.html'), { query });

  // DOM probe for automated verification: AKSWAYJ_PROBE=<js expression>
  if (process.env.AKSWAYJ_PROBE) {
    win.webContents.once('did-finish-load', () => {
      setTimeout(async () => {
        try {
          const r = await win.webContents.executeJavaScript(process.env.AKSWAYJ_PROBE);
          console.log('[probe]', typeof r === 'string' ? r : JSON.stringify(r));
        } catch (err) {
          console.error('[probe] failed:', err.message);
        }
      }, 3000);
    });
  }

  // Screenshot mode for automated verification: AKSWAYJ_SHOT=<out.png>
  if (process.env.AKSWAYJ_SHOT) {
    const delay = Number(process.env.AKSWAYJ_SHOT_DELAY || 5000);
    win.webContents.once('did-finish-load', () => {
      setTimeout(async () => {
        try {
          const img = await win.webContents.capturePage();
          fs.writeFileSync(process.env.AKSWAYJ_SHOT, img.toPNG());
          console.log(`[shot] saved ${process.env.AKSWAYJ_SHOT}`);
        } catch (err) {
          console.error('[shot] failed:', err);
        }
        app.quit();
      }, delay);
    });
  }
}

app.whenReady().then(() => {
  // WebMIDI + microphone are the only permissions the renderer legitimately needs.
  const ses = session.defaultSession;
  const GRANT = new Set(['midi', 'midiSysex', 'media', 'audioCapture', 'display-capture']);
  ses.setPermissionRequestHandler((_wc, permission, cb) => cb(GRANT.has(permission)));
  ses.setPermissionCheckHandler((_wc, permission) => GRANT.has(permission));

  // System-audio capture. getDisplayMedia in Chromium always requires a video
  // source, so a screen source is supplied and the renderer discards the video
  // track immediately; only the loopback audio is kept. Loopback is a Windows
  // capability — elsewhere the request resolves without audio and the renderer
  // reports that system audio is unavailable on the platform.
  ses.setDisplayMediaRequestHandler(
    async (_request, callback) => {
      try {
        const sources = await desktopCapturer.getSources({ types: ['screen'] });
        if (!sources.length) return callback({});
        callback(
          process.platform === 'win32'
            ? { video: sources[0], audio: 'loopback' }
            : { video: sources[0] }
        );
      } catch (err) {
        console.error('[display-media] failed:', err.message);
        callback({});
      }
    },
    { useSystemPicker: false }
  );

  app.on('web-contents-created', (_e, contents) => {
    contents.setWindowOpenHandler(({ url }) => {
      if (allowedExternal(url)) shell.openExternal(url);
      return { action: 'deny' };
    });
    contents.on('will-navigate', (e) => e.preventDefault());
  });

  // --- IPC surface ---
  ipcMain.handle('app:info', () => ({
    name: APP.NAME,
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
  }));

  ipcMain.handle('doctor:run', () => doctor.runAll());

  ipcMain.handle('doctor:fix', async (_e, fixId) => {
    const progress = (p) => win && win.webContents.send('fix:progress', { fixId, ...p });
    switch (fixId) {
      case 'fetch-companion':
        return audima.downloadCompanion(progress);
      case 'install-dfu-driver':
        return driver.installDfuDriver(progress);
      case 'open-downloads-page':
        await shell.openExternal('https://audima.com.au/downloads/');
        return { ok: true, detail: 'Opened Audima downloads page in your browser.' };
      case 'open-manual':
        await shell.openExternal(require('../shared/constants').AUDIMA.USER_MANUAL);
        return { ok: true, detail: 'Opened the Sway user manual.' };
      default:
        return { ok: false, detail: `Unknown fix: ${fixId}` };
    }
  });

  ipcMain.handle('projects:list', () => listProjects());
  ipcMain.handle('docs:list', () => listDocs());
  ipcMain.handle('docs:read', (_e, id) => readDoc(id));
  ipcMain.handle('files:pickAudio', () => pickAudioFiles());
  ipcMain.handle('files:readAudio', (_e, filePath) => readAudioFile(filePath));
  ipcMain.handle('platform:systemAudio', () => ({
    supported: process.platform === 'win32',
    detail:
      process.platform === 'win32'
        ? 'System audio capture uses WASAPI loopback.'
        : 'System audio capture is available on Windows only. On this platform, route audio to an input device with a virtual loopback driver (BlackHole or Loopback on macOS, PulseAudio or PipeWire monitor sources on Linux) and select that input.',
  }));
  ipcMain.handle('settings:get', () => readSettings());
  ipcMain.handle('settings:set', (_e, patch) => writeSettings(patch));
  ipcMain.handle('shell:openExternal', (_e, url) => {
    if (allowedExternal(url)) return shell.openExternal(url);
    return Promise.reject(new Error('URL not on the allowlist'));
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
