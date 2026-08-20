# Audio analysis

`src/renderer/engine/audio.js` exports the async factory `createAudioEngine()`. It constructs an `AudioContext` (`latencyHint: 'interactive'`) and a single `AnalyserNode`, and publishes a per-frame snapshot — overall level, three band energies, and a beat impulse — that the engine copies into the per-frame `io` object each frame ([ENGINE.md](ENGINE.md#io-assembly)).

No node in the module connects to the context destination. Both the external input and the internal groove feed the analyser only, so the analysis layer emits no sound regardless of source.

## Signal sources

`state.source` reports which signal feeds the analyser:

| `state.source` | Meaning | `state.deviceLabel` |
|---|---|---|
| `none` | Initial state; nothing connected | `''` (empty) |
| `input` | A `getUserMedia` audio stream feeds the analyser | The audio track's label, or `audio input` when the stream has no audio track |
| `internal` | The internal groove feeds the analyser | `internal groove (120 BPM)` |

### External input

`useInput(deviceId)` requests an audio stream with all three browser processing stages disabled — `echoCancellation: false`, `noiseSuppression: false`, `autoGainControl: false` — so the analyser receives the unprocessed signal. When `deviceId` is given, the constraint is `{ exact: deviceId }`; otherwise the platform default input is used. On success the function stops the internal groove if it is running, disconnects any previous input node, connects a `MediaStreamSource` to the analyser, sets the source state, and resolves to the device label. On failure (no device, permission denied) the promise rejects and the current source is left unchanged.

`listInputs()` resolves to the available `audioinput` devices as `{ id, label }` pairs. A device that reports no label appears as `Audio input`.

### Start order

`autoStart()` runs the bootstrap sequence:

1. The `AudioContext` is resumed if it is suspended; a resume failure is ignored.
2. `useInput()` is attempted with the platform default device.
3. On any failure, the internal groove starts.

The promise resolves to the resulting `state.source`.

## Analysis chain

The analyser is configured with `fftSize` 2048 (1,024 frequency bins) and `smoothingTimeConstant` 0.55, the node's built-in averaging of successive spectra. Each frame, `update(dt)` reads the byte-domain spectrum with `getByteFrequencyData` and averages three bands:

| Band | Range | Weight in `level` |
|---|---|---|
| bass | 20–250 Hz | 0.50 |
| mid | 250–2,000 Hz | 0.35 |
| high | 2,000–9,000 Hz | 0.15 |

A band edge converts to a bin index as `round(hz / nyquist × 1024)`, clamped to bin 1,023, where nyquist is half the context sample rate; the exact indices therefore depend on the sample rate the platform selects. A band's raw value is the mean of its bins, boundary bins inclusive, divided by 255, giving a 0..1 value. The raw overall level is the weighted sum of the three raw bands with the weights above.

## Auto-gain

A running loudness ceiling `agcMax` (initial value 0.12) rescales the raw values so that a quiet room and a loud rig converge to the same 0..1 range. Each frame:

```
agcMax = max(agcMax × (1 − 0.05 · dt), rawLevel, 0.06)
```

The ceiling decays at 5 % per second, rises instantly to the current raw level, and never falls below the floor of 0.06. Each raw band value and the raw level are normalized as `min(1, value / agcMax)`.

## Smoothing

The published `state.bands.*` and `state.level` values follow the normalized raw values through a one-pole low-pass filter with the per-frame coefficient

```
k = 1 − e^(−12 · dt)
```

a time constant of 1/12 s (about 83 ms). The raw values themselves are not published.

## Beat detection

Each frame's raw bass value enters a 43-sample rolling buffer — about 0.7 s of history at 60 fps — and the buffer mean is recomputed. A beat triggers when all three conditions hold:

| Condition | Threshold |
|---|---|
| Onset ratio | raw bass > 1.35 × the rolling mean |
| Absolute floor | raw bass > 0.06 |
| Refractory period | more than 180 ms since the previous trigger, measured with `performance.now()` |

On a trigger, `state.beat` is set to 1. On every other frame it decays as `e^(−6 · dt)` (time constant 1/6 s, about 167 ms), so the engine reads a 0..1 impulse with a sharp attack and an exponential tail.

## Internal groove

`startInternal()` synthesizes a 120 BPM rhythm with WebAudio nodes and routes it into a gain bus that connects only to the analyser — inaudible by construction. It is the fallback source when no input is available ([OVERVIEW.md](OVERVIEW.md#terminology)) and is stopped automatically when `useInput` succeeds. Starting the groove sets `state.bpmHint` to 120; the initial value is 0, and no tempo is estimated from external input. Stopping the groove does not reset the hint.

A `setInterval` timer fires every 120 ms; each tick schedules all events falling within a 300 ms lookahead window on the `AudioContext` clock. The schedule advances in half-beat steps (0.25 s at 120 BPM), with the first event placed 100 ms after start:

| Placement | Event |
|---|---|
| Every even step (every beat, four on the floor) | Kick |
| Half a beat after every step | Hat; the one scheduled on every fourth step carries the accented gain |

| Voice | Synthesis |
|---|---|
| Kick | Sine oscillator (the `OscillatorNode` default) sweeping exponentially from 120 Hz to 42 Hz over 120 ms; gain envelope from 1.0 to 0.001 exponentially over 240 ms; the oscillator stops at 260 ms |
| Hat | 60 ms white-noise buffer with a linear decay envelope, high-pass filtered at 6,000 Hz; gain 0.5 accented, 0.28 otherwise |

Stopping the groove clears the timer and disconnects the bus. `startInternal()` is a no-op while the groove is already running.

## Public interface

The factory resolves to an object with one state record and six methods.

`state` fields:

| Field | Range | Meaning |
|---|---|---|
| `source` | `'none'` \| `'input'` \| `'internal'` | Active signal source |
| `deviceLabel` | string | Human-readable source name (table above) |
| `level` | 0..1 | Smoothed, normalized overall loudness |
| `bands.bass` / `.mid` / `.high` | 0..1 | Smoothed, normalized band energies |
| `beat` | 0..1 | Beat impulse; 1 on trigger, exponential decay |
| `bpmHint` | number | 0 initially; 120 once the internal groove has started (not reset on a later source switch) |

Methods:

| Method | Behavior |
|---|---|
| `update(dt)` | Per-frame analysis step; `dt` in seconds. Called by the engine's frame loop |
| `autoStart()` | Async bootstrap (resume, input attempt, groove fallback); resolves to `state.source` |
| `useInput(deviceId)` | Async; switches to an external input; resolves to the device label; rejects on `getUserMedia` failure |
| `listInputs()` | Async; resolves to `{ id, label }` for each `audioinput` device |
| `startInternal()` | Starts the internal groove; no-op while running |
| `resume()` | Resumes the `AudioContext`; returns the context's resume promise |

The engine's frame loop calls only `update(dt)` and copies `state` into `io`; it never switches sources itself.
