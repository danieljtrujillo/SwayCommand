// Decide, once and for all, which `window.swaycommand` the cockpit talks to.
//
// This module is imported FIRST by src/renderer/embed.js, ahead of app.js, and
// its only job is a top-level side effect. esbuild emits imported modules in
// dependency order and evaluates them before the importer's own body, so by the
// time app.js's `main()` is even defined the decision is made. That matters:
// main()'s first statement is `await window.swaycommand.info()`.
//
// The discriminator is the PRESENCE of window.swaycommand and nothing else.
// In Electron, preload.js installs the real contextBridge object at
// document-start, so this file is a no-op there and the desktop app is
// completely untouched. Served over http -- theDAW's SWAY tab, or any plain
// browser -- there is no preload, so the browser adapter stands in.
//
// Do NOT sniff `window.parent !== window`: SwayCommand may legitimately be
// framed inside its own shell. Do NOT sniff the user agent: Electron's UA
// contains "Chrome".

import { createBrowserBridge } from './browser-bridge.js';
import { installHostChannel } from './host-channel.js';

export const NATIVE = typeof window.swaycommand !== 'undefined';

if (!NATIVE) {
  window.swaycommand = createBrowserBridge();
  // The embedding host (theDAW) relays MIDI, audio analysis and visibility over
  // postMessage. Installed here, before app.js runs, so no frame is missed
  // during boot.
  installHostChannel();
}
