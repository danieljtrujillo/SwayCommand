# MIDI input

The MIDI layer lives in two renderer modules: [`src/renderer/midi/midi.js`](../src/renderer/midi/midi.js) (device binding, message routing, MIDI-learn, monitor) and [`src/renderer/midi/swaymap.js`](../src/renderer/midi/swaymap.js) (the factory map and the control-state constructor). Consumers never read raw MIDI; they read the control state, a normalized snapshot that `createMidi()` owns and the engine receives through `attachControl()`. Hardware provenance for every factory binding: [SWAY_INTEGRATION.md](SWAY_INTEGRATION.md).

## Device detection and binding policy

`createMidi()` requests WebMIDI access with `navigator.requestMIDIAccess({ sysex: false })`. Two flags describe the outcome:

| Flag | Meaning |
|---|---|
| `supported` | `navigator.requestMIDIAccess` exists in this runtime |
| `available` | the access request succeeded; input ports can be bound |

When the API is absent, or the request fails (the failure is logged as a console warning), the layer stays inactive; the control state still exists and mouse/keyboard input drives it (see [Mouse and keyboard equivalents](#mouse-and-keyboard-equivalents)).

A port is recognized as a Sway when its name contains the exact string `Audima Labs The Sway` (`SWAY_PORT_NAME` in `swaymap.js`), tested with `String.prototype.includes()`. The substring match covers Windows and macOS, where the port name equals that string, and Linux/ALSA, where the rawmidi layer typically appends ` MIDI 1`. Port-name provenance: [SWAY_INTEGRATION.md](SWAY_INTEGRATION.md#midi-port-name-per-os).

The `rescan()` routine clears all existing `onmidimessage` handlers, then binds according to one rule: when a Sway port is present, the Sway is bound exclusively; when no Sway is present, every available input port is bound, so any class-compliant controller drives the performance. Hot-plug and hot-unplug are handled by `access.onstatechange`, which triggers a full rescan.

Each rescan writes three connection fields into the control state:

| Field | Value |
|---|---|
| `connected` | `true` when at least one input is bound |
| `isSway` | `true` when the bound port matched the Sway name |
| `portName` | the Sway port name; otherwise a comma-joined list of all bound port names; `null` when nothing is bound |

## Message routing

The message handler ignores the MIDI channel for routing; messages on any channel are accepted. Every incoming message stamps `control.lastEventAt` with `performance.now()`.

| Message | Condition | Handling |
|---|---|---|
| Control Change (`0xB0`) | a learn is pending | The CC number is captured as the binding for the pending target; the value is not applied. |
| Control Change (`0xB0`) | no learn pending | The CC number is resolved to a target — learned overrides first, then the factory map — and the target is set to `value / 127`. An unmatched CC is only logged to the monitor. |
| Note On (`0x90`, velocity > 0) | note resolves to a pad | `pads[index] = velocity / 127`; `lastPad = index`. The optional `onEvent` callback fires with `{ kind: 'pad', idx, vel }` on every Note On, with `idx = -1` when the note maps to no pad. |
| Note Off (`0x80`, or `0x90` with velocity 0) | — | Ignored. Pad values decay in the engine, not in the MIDI layer. |
| Program Change (`0xC0`) | program 37 | `control.awake = false` (the Sway's sleep announcement). |
| Program Change (`0xC0`) | program 38 | `control.awake = true` (wake). |
| Any other status | — | Not handled. |

Pad-index resolution for Note On tries two lookups in order:

1. Chromatic range: notes 24–39 map to pad indices 0–15 (`note - 24`). This is the layout Audima's own Ableton demo packs use and the layout AKSWAYJ normalizes to.
2. Factory B-minor table: the note is looked up in the Theory Engine grid `47 49 50 52 54 55 57 59 61 62 64 66 67 69 71 73`; its position is the pad index. A note in neither set resolves to no pad.

## Normalization

All continuous values are scaled from the 7-bit MIDI range to 0..1 by division by 127. `createControlState()` in `swaymap.js` defines the fields and their initial values:

| Field | Range | Initial value |
|---|---|---|
| `xy.x`, `xy.y` | 0..1 | 0.5, 0.5 |
| `gestures.pulse`, `gestures.press`, `gestures.sway` | 0..1 | 0 |
| `xtrigYmod.x`, `xtrigYmod.y` | 0..1 | 0 |
| `knobs[0..7]` | 0..1 | 0.5 each |
| `pads[0..15]` | velocity 0..1, decays in the engine | 0 each |
| `lastPad` | pad index, or −1 | −1 |
| `awake` | boolean | `true` |
| `lastEventAt` | `performance.now()` timestamp of the last message | 0 |

## Factory map

The factory map in `swaymap.js` reproduces the Sway's Base Project V2 assignments, recovered from Audima's own artifacts (the `.swayproj` file, the official Ableton remote scripts, and the Cubase MIDI Remote script) and not officially published by Audima. Sources and confidence flags: [SWAY_INTEGRATION.md](SWAY_INTEGRATION.md#factory-midi-map-base-project-v2) and [RESEARCH.md](RESEARCH.md). The declared channel is MIDI channel 1 (`channel: 0`, 0-indexed); the router itself applies no channel filter.

| Control | Message | Numbers |
|---|---|---|
| Hand tracking X (full surface, both hands merged) | CC | 50 |
| Hand tracking Y | CC | 38 |
| Pulse gesture (vertical bounce energy) | CC | 35 |
| Press gesture (downward press depth) | CC | 36 |
| Sway gesture (lateral sway amount) | CC | 37 |
| X-trigger region | CC | 73 |
| Y-modulation region | CC | 74 |
| Knobs 1–8, rotation | CC | 20–27 → `knob:0` … `knob:7` |
| Pads, chromatic layout (internal normalization) | Note On | 24–39 → pad index 0–15 |
| Pads, factory Theory Engine grid (B natural minor, low to high) | Note On | 47 49 50 52 54 55 57 59 61 62 64 66 67 69 71 73 |
| Sleep | Program Change | 37 |
| Wake | Program Change | 38 |

The map declares pads on channel 1 or channel 16 (`channels: [0, 15]`) because Audima's `.swayproj` and Ableton script disagree about the transmit channel (unconfirmed); since the router ignores channel entirely, both arrive correctly. Knob-press CCs and the eight mappable buttons have no entry in the factory map; their defaults are not established (unconfirmed).

## MIDI-learn

Any continuous control can be rebound at runtime, which also makes any class-compliant controller a full replacement for the Sway. The API on the object returned by `createMidi()`:

| Function | Behavior |
|---|---|
| `learn(target)` | Arms a learn for `target` and returns a promise. The next incoming CC message becomes the binding: the override `{ type: 'cc', num }` is stored, the promise resolves with `{ target, cc }`, and that CC message is consumed rather than applied. |
| `cancelLearn()` | Clears the pending target; the pending promise never settles. A second `learn()` call before a CC arrives replaces the pending target with the same effect. |
| `setOverrides(o)` | Replaces the whole override set. |
| `getOverrides()` | Returns a shallow copy of the current override set. |

Valid learn targets:

| Target | Control-state field |
|---|---|
| `xy:x`, `xy:y` | `xy.x`, `xy.y` |
| `gesture:pulse`, `gesture:press`, `gesture:sway` | `gestures.*` |
| `xtrig:x`, `xtrig:y` | `xtrigYmod.*` |
| `knob:0` … `knob:7` | `knobs[0]` … `knobs[7]` |

Overrides win over the factory map: incoming CC numbers are checked against the override set first, in insertion order, and only unmatched CCs fall through to the factory table. An override adds a binding for its target without removing the factory CC for that target; when an override claims a CC number the factory map assigns elsewhere, the override wins for that number. Only CC messages can be learned; notes cannot.

Persistence uses the settings IPC surface. At startup, `src/renderer/app.js` reads the settings file over the `settings:get` channel and, when a `midiOverrides` key is present, applies it with `setOverrides()`. The `settings:set` channel merges a patch into `settings.json` in the Electron `userData` directory (locations in [OVERVIEW.md](OVERVIEW.md#data-locations)). The current renderer contains no code path that writes overrides back after a learn; persisting a changed binding requires a caller to pass the result of `getOverrides()` to `window.akswayj.settings.set({ midiOverrides })`.

## Monitor

The layer keeps a 14-entry ring buffer (`MONITOR_SIZE`) of human-readable message lines, newest first. Entry formats, with channels displayed 1-based:

| Event | Format | Example |
|---|---|---|
| Control Change | `CC<num>=<value> ch<n>` plus ` → <target>` when routed | `CC50=64 ch1 → xy:x` |
| Note On | `NOTE <note> vel<velocity> ch<n>` plus ` → pad<index>` when a pad matched | `NOTE 24 vel127 ch16 → pad0` |
| Program Change | `PC <program> ch<n>` | `PC 38 ch1` |
| Learn capture | `LEARN <target> ← CC<num>` | `LEARN knob:3 ← CC71` |

On the perform screen, the `K` key toggles the `#midi-monitor` overlay; the HUD update joins the buffer with newlines and shows `(waiting for MIDI…)` while the buffer is empty. The monitor sits on `K` rather than `M` because `M` is the seventh pad key.

## Mouse and keyboard equivalents

`wirePerform()` in [`src/renderer/app.js`](../src/renderer/app.js) writes the same control state from mouse and keyboard. Pointer and wheel handlers are gated on `control.isSway` being `false`; they stay active while a generic (non-Sway) MIDI controller is bound, and go inert only when a Sway is bound.

| Input | Effect |
|---|---|
| Pointer move over the canvas | `xy.x` = horizontal position 0..1; `xy.y` = vertical position 0..1 with the bottom edge as 0 |
| Pointer button down / up | `gestures.press` = 1 / 0 |
| Wheel | `gestures.pulse` increases by `abs(deltaY) × 0.002`, clamped to 1; each wheel event schedules a halving of the value 150 ms later |
| `Z X C V B N M ,` | pads 0–7: pad value set to 0.9 and `lastPad` updated |

Pad keys are not gated on `isSway`. Pads 8–15 have no keyboard equivalent. A pad strike — from hardware or from a pad key — also fires the Wormhole scene's hyperspace jump: that scene arms the sequence when any pad value exceeds 0.25 and rises more than 0.06 above its previous frame ([SCENE_CONTRACT.md](SCENE_CONTRACT.md#scene-inventory)).

The remaining perform-screen keys address the engine, the HUD, and the screen flow rather than the control state:

| Key | Effect |
|---|---|
| `1`–`8` | Selects the scene at that position in the registry and clears the Auto-VJ flag |
| `Space` | Crossfades to another scene from the project pool |
| `A` | Toggles Auto-VJ |
| `F` | Toggles fullscreen |
| `H` | Toggles the help overlay |
| `K` | Toggles the MIDI monitor overlay |
| `D` | Stops the render loop and opens the documentation viewer |
| `Esc` | Closes an open overlay, otherwise stops the render loop and returns to the project picker |

`D` also opens the viewer from the Doctor and project-picker screens, where `Escape` closes it and returns to the screen it was opened from; returning to a performance restarts the render loop. The README carries the same list alongside the hardware controls ([README](../README.md#controls)).
