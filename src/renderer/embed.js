// Entry point for the embedded build (dist-embed), served over http by a host
// application instead of loaded from Electron.
//
// The only difference from the desktop entry is that the host bridge is
// installed first. app.js itself is imported unchanged, and every one of its
// window.swaycommand call sites works exactly as it does on the desktop.
import './host/bridge.js';
import './app.js';
