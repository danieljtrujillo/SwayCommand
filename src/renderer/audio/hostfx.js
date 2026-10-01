// Host effects, the embedding host's own effects on a cockpit track.
//
// Inside theDAW the cockpit is framed same-origin, and theDAW puts an API
// object on this window (`window.theDAWHost`) before it answers the handshake
// with the 'rack-fx' cap:
//
//   catalog()                 [{ id, name, group, mix, params: [...] }]
//   prepare(audioContext)     registers the worklet modules its effects need on
//                             that context; resolves with the effect ids whose
//                             module did not load
//   build(audioContext, id, params)
//                             { input, output, setParams(params), dispose() },
//                             built by the host's own effect code on the
//                             context it is given
//
// adoptHostFx() takes that object, registers its catalog as `host:<id>` kinds
// (shared/trackfx.js) and keeps it for createHostFxNode(), which the transport
// calls for a chain entry of such a kind. The node it returns has the shape of
// audio/trackfx.js createFxNode, so the chain wiring does not tell them apart.
//
// Without a host API (the desktop app, a host that predates the cap, or the
// moments before the handshake) a host entry is a pass-through: input wired to
// output, parameters remembered, nothing heard. The transport rebuilds those
// entries when the API arrives (refreshHostFx).

import { registerHostFx, hostFxId, fxSpec, fxClamp } from '../../shared/trackfx.js';

/** The property the host sets on this window. */
export const HOST_FX_KEY = 'theDAWHost';

let api = null; // the adopted host API
let adopting = null; // one being adopted, so a repeated handshake waits its turn
let degraded = []; // effect ids whose worklet module did not load

function usable(candidate) {
  return !!candidate && typeof candidate.catalog === 'function' && typeof candidate.build === 'function';
}

/** True once a host API is adopted and its effects are listed. */
export function hostFxReady() {
  return api !== null;
}

/** True when the host said this effect's worklet module could not load. */
export function hostFxDegraded(kind) {
  return degraded.includes(hostFxId(kind));
}

// Adopts the API the host put on this window. Resolves true when the list of
// kinds changed, which is the caller's cue to rebuild chains and redraw.
// Never rejects: a host that throws leaves the cockpit as it was.
export async function adoptHostFx(candidate, ctx) {
  if (!usable(candidate) || candidate === api || candidate === adopting) return false;
  adopting = candidate;
  try {
    const catalog = candidate.catalog();
    let failed = [];
    if (typeof candidate.prepare === 'function') {
      try {
        failed = await candidate.prepare(ctx);
      } catch (err) {
        console.warn('[hostfx] the host could not prepare its effects:', err && err.message);
      }
    }
    if (adopting !== candidate) return false; // a newer API took over while this one prepared
    if (!registerHostFx(catalog)) return false;
    degraded = Array.isArray(failed) ? failed.filter((id) => typeof id === 'string') : [];
    api = candidate;
    return true;
  } catch (err) {
    console.warn('[hostfx] the host effect list could not be read:', err && err.message);
    return false;
  } finally {
    if (adopting === candidate) adopting = null;
  }
}

// One chain entry of a `host:<id>` kind. `live` says whether the host built it;
// a node that is not live passes audio through untouched.
export function createHostFxNode(ctx, kind, params) {
  const p = { ...(params || {}) };
  let handle = null;
  if (api && fxSpec(kind)) {
    try {
      const built = api.build(ctx, hostFxId(kind), p);
      if (built && built.input && built.output && typeof built.setParams === 'function') handle = built;
    } catch (err) {
      console.warn(`[hostfx] ${kind} could not be built:`, err && err.message);
    }
  }
  let input;
  let output;
  if (handle) {
    input = handle.input;
    output = handle.output;
  } else {
    input = ctx.createGain();
    output = ctx.createGain();
    input.connect(output);
  }

  return {
    kind,
    input,
    output,
    params: p,
    live: handle !== null,
    set(key, value) {
      const v = fxClamp(kind, key, value);
      if (v === null) return false;
      p[key] = v;
      if (handle) {
        try {
          handle.setParams({ [key]: v });
        } catch (err) {
          console.warn(`[hostfx] ${kind} ${key}:`, err && err.message);
        }
      }
      return true;
    },
    // A host effect keeps its own time; the cockpit's tempo does not retune it.
    retune() {},
    syncPhase() {},
    dispose() {
      try {
        if (handle && typeof handle.dispose === 'function') handle.dispose();
        else {
          input.disconnect();
          output.disconnect();
        }
      } catch {
        /* detached already */
      }
    },
  };
}

/** Test seam: forget the adopted API. */
export function resetHostFx() {
  api = null;
  adopting = null;
  degraded = [];
  registerHostFx([]);
}
