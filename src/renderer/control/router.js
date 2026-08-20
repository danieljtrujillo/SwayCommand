// Assignment router — the single dispatch point between the control surface
// (hardware MIDI, keyboard pads) and everything that can be played: sampler,
// synth, engine, fx rack, transport. Owns the project's assignment table and
// applies it three ways:
//   * events   — pad strikes, button CCs, note routing (handleMidiEvent)
//   * frames   — knob positions (change-driven) and gesture routes (every
//                frame; gestures win over knobs on the same target), via the
//                engine frame hook
//   * timeline — the transport's visual-lane events (cut vs crossfade), with
//                autoVJ suspended while the timeline drives the stage
// It also records the last physically touched control, which is what lets the
// on-screen surface follow the hardware.

import { defaultAssignments, parseTarget, applyCurve } from '../../shared/swayproject.js';

const SAMPLER_KNOB_INDEX = { master: 4, cutoff: 5, rate: 6, send: 7 };
const KNOB_EPSILON = 1 / 512;

export function createRouter({ engine, sampler, synth, transport, midi, onDirty }) {
  let assignments = defaultAssignments();
  let synthOn = true;
  let synthToggleCb = null;
  let touchCb = null;
  const lastTouched = { id: null, at: 0 };

  const heldPunches = new Map(); // pad idx -> { param, prev, value }
  const lastKnobs = new Array(8).fill(null);
  const lastButtonVals = new Array(8).fill(0);
  const lastGesture = new Map(); // route index -> last mapped value
  const samplerKnobs = { master: 0.5, cutoff: 0.5, rate: 0.5, send: 0.5 };
  let autoVJPrev = null; // engine autoVJ state before the timeline took over

  function touch(id) {
    lastTouched.id = id;
    lastTouched.at = performance.now();
    if (touchCb) touchCb(id);
  }

  function sourceValue(io, source) {
    switch (source) {
      case 'xy:x': return io.xy.x;
      case 'xy:y': return io.xy.y;
      case 'gesture:pulse': return io.gestures.pulse;
      case 'gesture:press': return io.gestures.press;
      case 'gesture:sway': return io.gestures.sway;
      default: return 0;
    }
  }

  // Continuous dispatch. `mapped` is already min/max/curve-applied.
  function driveTarget(targetStr, mapped) {
    const t = parseTarget(targetStr);
    if (!t) return;
    switch (t.ns) {
      case 'engine':
        if (t.key === 'hue') engine.params.hue = mapped;
        else if (t.key === 'intensity') engine.params.intensity = mapped;
        else if (t.key === 'fadeTime') engine.autoVJ.fadeTime = mapped;
        break;
      case 'fx':
        engine.setFxParam(t.key, mapped);
        break;
      case 'synth':
        if (t.key !== 'enabled') synth.setParam(t.key, mapped);
        break;
      case 'sampler': {
        const idx = SAMPLER_KNOB_INDEX[t.key];
        if (idx !== undefined) {
          const v = Math.max(0, Math.min(1, mapped));
          sampler.setKnob(idx, v);
          samplerKnobs[t.key] = v;
        }
        break;
      }
      // transport targets are toggles; a continuous control cannot drive them
    }
  }

  function executeToggle(targetStr) {
    const t = parseTarget(targetStr);
    if (!t) return;
    switch (t.ns) {
      case 'engine':
        if (t.key === 'fxEnabled') engine.fxEnabled = !engine.fxEnabled;
        else if (t.key === 'autoVJ') engine.autoVJ.enabled = !engine.autoVJ.enabled;
        break;
      case 'fx':
        engine.setFxParam(t.key, !engine.fx.params[t.key]);
        break;
      case 'synth':
        if (t.key === 'enabled') {
          synthOn = !synthOn;
          if (!synthOn) synth.allNotesOff();
          if (synthToggleCb) synthToggleCb(synthOn);
        }
        break;
      case 'transport':
        if (t.key === 'playPause') transport.state.playing ? transport.pause() : transport.play();
        else if (t.key === 'stop') transport.stop();
        break;
    }
  }

  function synthWantsNote(idx) {
    const mode = assignments.noteRouting.synth;
    if (!synthOn || mode === 'off') return false;
    if (mode === 'always') return true;
    // 'unassigned': pads with an assignment no longer double-fire the synth;
    // notes outside the pad range (Theory Engine pitches) always reach it.
    return idx == null || idx < 0 || !assignments.pads[idx];
  }

  function firePad(idx, vel) {
    const a = assignments.pads[idx];
    touch(`pad:${idx}`);
    if (!a) return;
    if (a.type === 'sample') {
      sampler.trigger(a.pad ?? idx, vel);
    } else if (a.type === 'scene') {
      engine.autoVJ.enabled = false;
      if (a.transition.type === 'crossfade') engine.setScene(a.scene, a.transition.duration);
      else engine.cutTo(a.scene);
    } else if (a.type === 'fxPunch' && !heldPunches.has(idx)) {
      heldPunches.set(idx, { param: a.param, prev: engine.fx.params[a.param], value: a.value });
      engine.setFxParam(a.param, a.value);
    }
  }

  function releasePad(idx) {
    const a = assignments.pads[idx];
    const punch = heldPunches.get(idx);
    if (punch) {
      heldPunches.delete(idx);
      engine.setFxParam(punch.param, punch.prev);
    }
    if (a && a.type === 'sample') sampler.release(a.pad ?? idx); // gate pads only; no-op otherwise
  }

  function handleCc(e) {
    // Touch-to-select for the factory continuous targets.
    if (e.target) touch(e.target);

    // Button slots match by learned CC number (and channel when pinned).
    for (let i = 0; i < assignments.buttons.length; i++) {
      const b = assignments.buttons[i];
      if (!b || b.cc === null || b.cc !== e.cc) continue;
      if (b.channel !== null && b.channel !== e.channel) continue;
      touch(`button:${i}`);
      const rising = e.value >= 0.5 && lastButtonVals[i] < 0.5;
      lastButtonVals[i] = e.value;
      if (rising && b.action && b.action.type === 'toggle') executeToggle(b.action.target);
    }
  }

  function handleVisualClip({ clip, cause }) {
    if (autoVJPrev === null) {
      autoVJPrev = engine.autoVJ.enabled;
      engine.autoVJ.enabled = false;
    }
    if (cause === 'boundary' && clip.transition.type === 'crossfade') {
      engine.setScene(clip.scene, clip.transition.duration);
    } else {
      engine.cutTo(clip.scene); // seeks and play starts must land instantly
    }
  }
  transport.onVisualClip(handleVisualClip);

  return {
    lastTouched,
    samplerKnobs,

    get synthEnabled() {
      return synthOn;
    },
    set synthEnabled(v) {
      synthOn = !!v;
      if (!synthOn) synth.allNotesOff();
    },
    onSynthToggle(cb) {
      synthToggleCb = cb;
    },
    onTouch(cb) {
      touchCb = cb;
    },

    setAssignments(a) {
      assignments = a || defaultAssignments();
      heldPunches.clear();
      lastGesture.clear();
    },
    getAssignments() {
      return assignments;
    },

    // THE onEvent for createMidi; keyboard pads call it too, so keys and
    // hardware take one dispatch path.
    handleMidiEvent(e) {
      if (e.kind === 'pad') {
        if (e.idx >= 0) firePad(e.idx, e.vel);
      } else if (e.kind === 'note') {
        if (synthWantsNote(e.idx != null ? e.idx : -1) && typeof e.note === 'number') {
          synth.noteOn(e.note, e.vel);
        }
      } else if (e.kind === 'noteoff') {
        if (e.idx != null && e.idx >= 0) releasePad(e.idx);
        if (typeof e.note === 'number' && synthOn && assignments.noteRouting.synth !== 'off') {
          synth.noteOff(e.note); // release is unconditional per mode: a voice must never hang
        }
      } else if (e.kind === 'bend') {
        synth.pitchBend(e.value);
      } else if (e.kind === 'mod') {
        synth.modulation(e.value);
      } else if (e.kind === 'cc') {
        handleCc(e);
      }
    },

    // Registered via engine.setFrameHook — runs inside the frame, after
    // control ingestion, before the palette/intensity update.
    frame(dt, t, io) {
      transport.update();

      // Restore autoVJ once the timeline lets go of the stage.
      if (autoVJPrev !== null && (!transport.state.playing || !transport.state.activeVisualClip)) {
        engine.autoVJ.enabled = autoVJPrev;
        autoVJPrev = null;
      }

      // Knobs: change-driven, so an idle knob never fights a UI edit.
      for (let i = 0; i < 8; i++) {
        const v = io.knobs[i];
        if (lastKnobs[i] === null) {
          lastKnobs[i] = v;
          continue;
        }
        if (Math.abs(v - lastKnobs[i]) < KNOB_EPSILON) continue;
        lastKnobs[i] = v;
        touch(`knob:${i}`);
        const a = assignments.knobs[i];
        if (a) driveTarget(a.target, a.min + applyCurve(a.curve, v) * (a.max - a.min));
      }

      // Gesture routes: applied after knobs — gestures win on a shared target.
      for (let gi = 0; gi < assignments.gestures.length; gi++) {
        const g = assignments.gestures[gi];
        if (!g.enabled) continue;
        const mapped = g.min + applyCurve(g.curve, sourceValue(io, g.source)) * (g.max - g.min);
        if (Math.abs((lastGesture.get(gi) ?? Infinity) - mapped) < 1e-4) continue;
        lastGesture.set(gi, mapped);
        driveTarget(g.target, mapped);
      }

      // A held punch is re-asserted last so nothing overwrites it mid-hold.
      for (const punch of heldPunches.values()) {
        engine.setFxParam(punch.param, punch.value);
      }
    },

    // midi.learn's first caller. Persists device-level overrides and marks
    // the project dirty so the binding lands in the file on next save.
    async learnBinding(target) {
      const result = await midi.learn(target);
      try {
        await window.akswayj.settings.set({ midiOverrides: midi.getOverrides() });
      } catch {
        /* settings persistence is best-effort */
      }
      if (onDirty) onDirty();
      return result;
    },
    cancelLearn() {
      midi.cancelLearn();
    },

    dispose() {
      heldPunches.clear();
      touchCb = null;
    },
  };
}
