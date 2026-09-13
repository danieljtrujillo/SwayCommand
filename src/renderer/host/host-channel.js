// The postMessage channel to the embedding host (theDAW's SWAY tab).
//
// theDAW owns the only navigator.requestMIDIAccess() in its renderer, and
// Windows lets exactly one process hold a MIDI input, so the cockpit must not
// open the hardware itself when embedded -- it would either steal the port from
// theDAW or report PORT BUSY. Instead theDAW relays raw MIDI bytes here and the
// cockpit's own decoding (factory map, learned overrides, pad channels) applies
// to them unchanged.
//
// The same channel carries audio analysis (so the visuals follow whatever
// theDAW is playing) and a visibility signal (so a hidden tab stops rendering
// instead of burning the GPU for the rest of the session).
//
// Everything here is inert in the desktop app: bridge.js only installs it when
// there is no Electron preload.
//
// Protocol v1, host to cockpit: sway/host-ready, sway/visibility, sway/midi,
// sway/audio-source (host | input), sway/analysis, sway/host-status
// ({ hardware, tone }), sway/host-scenes ({ rows, recent, error }).
// Cockpit to host: sway/ready (with caps), sway/set-audio-source, sway/request-
// scenes, sway/open-scene ({ name } or { path }), sway/choose-scene-file.
// Every addition is optional on both sides: a host that ignores caps keeps its
// own bar, and a cockpit that never sends them gets today's two headers.

const PROTOCOL = 1;

/**
 * What this cockpit can carry for the host. 'host-header': ui/hostbar.js folds
 * the host's own bar into #topbar, so the host may hide its bar. 'host-scenes':
 * the cockpit shows the host's scene list and asks the host to open one.
 */
export const HOST_CAPS = ['host-header', 'host-scenes'];

/** Set by the host handshake; used to pin outbound posts. */
let hostOrigin = null;

/** The host's name from its handshake ('theDAW'), or null before it. */
let hostName = null;

/**
 * What the host last said about itself, for ui/hostbar.js. Each field stays
 * null until the host sends it; a message replaces its field whole.
 */
export const hostState = {
  audioSource: null, // 'host' | 'input'
  status: null, // { hardware: string, tone: 'off' | 'none' | 'ok' }
  scenes: null, // { rows: [{ name, path, builtin, mtime }], recent: [{ name, path }], error }
};
const eventListeners = new Map(); // message type -> Set of callbacks

/** Latest analysis frame from the host, consumed by engine/audio.js. */
export const hostAudio = {
  active: false,
  bass: 0,
  mid: 0,
  high: 0,
  level: 0,
  t: 0,
};

/** Raw MIDI frames from the host, consumed by midi/midi.js in bridge mode. */
const midiListeners = new Set();

/** Visibility from the host, consumed by app.js to idle the render loop. */
export const hostVisibility = { visible: true, known: false };
const visibilityListeners = new Set();

export function onHostMidi(cb) {
  midiListeners.add(cb);
  return () => midiListeners.delete(cb);
}

export function onHostVisibility(cb) {
  visibilityListeners.add(cb);
  return () => visibilityListeners.delete(cb);
}

/** Called after the channel has applied a message of `type` (sway/host-ready, sway/audio-source, sway/host-status, sway/host-scenes). */
export function onHostEvent(type, cb) {
  if (!eventListeners.has(type)) eventListeners.set(type, new Set());
  eventListeners.get(type).add(cb);
  return () => eventListeners.get(type).delete(cb);
}

function emit(type) {
  const set = eventListeners.get(type);
  if (!set) return;
  for (const cb of set) {
    try {
      cb();
    } catch (err) {
      console.error(`[host] ${type} listener threw:`, err);
    }
  }
}

/** True when a host is driving this cockpit (i.e. we are embedded). */
export function hasHost() {
  return hostOrigin !== null;
}

/** True once the handshake came from a host that named itself `name`. */
export function hostIs(name) {
  return hostName === name;
}

/** True when theDAW frames this cockpit and has answered its handshake. */
export function framedByTheDAW() {
  return isFramed() && hasHost() && hostIs('theDAW');
}

/**
 * True when this document is framed by another page.
 *
 * Deliberately separate from hasHost(): the handshake completes a few frames
 * after boot, but createMidi() runs DURING boot and has to decide there and
 * then whether to open the hardware. Being framed is the synchronous, race-free
 * signal that someone else owns the MIDI port -- and on Windows only one
 * process may hold it.
 */
export function isFramed() {
  try {
    return window.parent !== window;
  } catch {
    // A cross-origin parent throws on access; that still means we are framed.
    return true;
  }
}

/**
 * True when something other than this page owns the MIDI hardware.
 *
 * Being framed implies it, which is theDAW's case. An Android WebView is the
 * opposite shape: the page is top level, so isFramed() is false, yet the host
 * absolutely owns the port because a WebView implements no Web MIDI at all and
 * the device is opened through android.media.midi. Such a host says so before
 * app.js runs by setting the flag below.
 */
export function hostOwnsMidi() {
  return isFramed() || window.__SWAY_HOST_MIDI__ === true;
}

export function postToHost(payload) {
  if (!window.parent || window.parent === window) return;
  try {
    window.parent.postMessage({ ...payload, v: PROTOCOL }, hostOrigin || '*');
  } catch {
    /* the host went away; nothing to do */
  }
}

export function installHostChannel() {
  window.addEventListener('message', (e) => {
    // Only the embedder may drive this cockpit. Before the handshake we accept
    // the parent frame alone; afterwards we also pin the origin it declared.
    if (e.source !== window.parent) return;
    if (hostOrigin !== null && e.origin !== hostOrigin) return;
    const d = e.data;
    if (!d || typeof d.type !== 'string' || !d.type.startsWith('sway/')) return;

    switch (d.type) {
      case 'sway/host-ready':
        hostOrigin = e.origin;
        hostName = typeof d.host === 'string' ? d.host : null;
        emit(d.type);
        break;

      case 'sway/host-status': {
        const tone = d.tone === 'off' || d.tone === 'ok' ? d.tone : 'none';
        hostState.status = { hardware: typeof d.hardware === 'string' ? d.hardware : '', tone };
        emit(d.type);
        break;
      }

      case 'sway/host-scenes': {
        const text = (v) => (typeof v === 'string' ? v : '');
        const rows = Array.isArray(d.rows) ? d.rows : [];
        const recent = Array.isArray(d.recent) ? d.recent : [];
        hostState.scenes = {
          rows: rows
            .filter((r) => r && typeof r.name === 'string')
            .map((r) => ({ name: r.name, path: text(r.path), builtin: r.builtin === true, mtime: Number(r.mtime) || 0 })),
          recent: recent
            .filter((r) => r && typeof r.path === 'string' && r.path)
            .map((r) => ({ name: text(r.name) || r.path.split(/[\\/]/).pop(), path: r.path })),
          error: text(d.error) || null,
        };
        emit(d.type);
        break;
      }

      case 'sway/midi': {
        if (!Array.isArray(d.data)) break;
        for (const cb of midiListeners) {
          try {
            cb(d.data, d.t);
          } catch (err) {
            console.error('[host] midi listener threw:', err);
          }
        }
        break;
      }

      case 'sway/analysis': {
        hostAudio.active = true;
        hostAudio.bass = Number(d.bass) || 0;
        hostAudio.mid = Number(d.mid) || 0;
        hostAudio.high = Number(d.high) || 0;
        hostAudio.level = Number(d.volume) || 0;
        hostAudio.t = performance.now();
        break;
      }

      case 'sway/audio-source':
        // 'host' = theDAW's master feeds the analysis frames above.
        // 'input' = the cockpit opens its own input device, as it does
        // standalone, so stop honouring stale host frames.
        hostAudio.active = d.source === 'host';
        hostState.audioSource = d.source === 'input' ? 'input' : 'host';
        emit(d.type);
        break;

      case 'sway/visibility': {
        hostVisibility.visible = d.visible !== false;
        hostVisibility.known = true;
        for (const cb of visibilityListeners) {
          try {
            cb(hostVisibility.visible);
          } catch (err) {
            console.error('[host] visibility listener threw:', err);
          }
        }
        break;
      }

      default:
        break;
    }
  });

  // Announce readiness. The host queues anything it wanted to send before this
  // and flushes on receipt, so a race during boot loses nothing.
  const announce = () => postToHost({ type: 'sway/ready', app: 'swaycommand', caps: HOST_CAPS });
  if (document.readyState === 'complete') announce();
  else window.addEventListener('load', announce, { once: true });
  // Also announce immediately: the host tolerates duplicates, and 'load' can be
  // late behind the bundle's own work.
  announce();
}
