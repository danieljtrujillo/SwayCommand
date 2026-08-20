# Studio

The Studio screen holds the two setup tasks that decide what the application listens to and what it plays: audio source selection and the pad kit. It is reached from the Studio button on the Doctor and project-picker screens, or with the `S` key from any screen. `Esc` or Close returns to the screen it was opened from; opening it from a performance stops the render loop and returning restarts it.

Implementation: the studio section of [`src/renderer/app.js`](../src/renderer/app.js), the audio engine in [`src/renderer/engine/audio.js`](../src/renderer/engine/audio.js), and the sample playback engine in [`src/renderer/audio/sampler.js`](../src/renderer/audio/sampler.js).

## Audio source

Exactly one analysis source feeds the analyser at a time. Selecting a source releases the previous one, stops its media tracks, and resets the auto-gain ceiling so a louder or quieter source re-converges rather than clipping or vanishing.

| Source | Mechanism | Availability |
|---|---|---|
| System audio (loopback) | `getDisplayMedia({ audio: true, video: true })`, resolved by the main process to a screen source with `audio: 'loopback'`. The video track is stopped and removed the moment the stream arrives; only the audio reaches the analyser. | Windows only |
| Input device | `getUserMedia` with `deviceId: { exact }` and echo cancellation, noise suppression, and auto gain all disabled | All platforms |
| Internal groove | A synthesized 120 BPM kick-and-hat bus routed only into the analyser. Inaudible by construction. | All platforms |

At startup the application tries the default input and falls back to the internal groove, so the visuals always have a signal. The level meter beside the source name reflects the smoothed analysis level, which includes any sample playback.

### System audio on macOS and Linux

Chromium exposes loopback capture through Electron on Windows only. On macOS and Linux the entry is disabled and the panel states the alternative: install a virtual loopback device (BlackHole or Loopback on macOS, a PulseAudio or PipeWire monitor source on Linux), then select it in the input list. The main process reports platform support over the `platform:systemAudio` channel; nothing about this is inferred in the renderer.

## Kit builder

The kit maps audio files onto the Sway's sixteen pads. A pad strike plays its sample and drives the visuals at the same time, because the sampler's master output is connected both to the speakers and to the analyser.

### Loading and assigning

1. Choose **Add stems…**. The main process opens the OS file dialog, filtered to `wav`, `mp3`, `flac`, `ogg`, `m4a`, `aac`, `aiff`, `aif`, `opus`, and `webm`.
2. The main process reads each file and returns its bytes over the `files:readAudio` channel. The page CSP forbids `file://` fetches, so this is the only path in. Files above 256 MB are rejected with their size in the message.
3. The renderer decodes the bytes with `decodeAudioData` and lists the sample with its duration and channel count.
4. Select a sample, then click a pad to assign it. Clicking a pad that already holds the selected sample auditions it instead.

Pad options apply to the selected pad and take effect on the next assignment:

| Option | Values | Meaning |
|---|---|---|
| Mode | `oneshot`, `loop`, `gate` | One-shot plays to the end; loop toggles a looping voice on alternate strikes; gate plays while the pad is held |
| Gain | 0 to 1.5 | Scales the voice gain; strike velocity scales it further |
| Choke | empty, or a group number | Triggering a pad stops any playing voice sharing the same non-empty choke group, giving the classic closed-hat-cuts-open-hat behaviour |

### Persistence

**Save kit** writes the pad assignments and the list of source file paths into `settings.json` under the `kit` key. At startup the renderer re-reads each referenced file and restores the assignments; files that have moved or been deleted are reported to the console and their pads are left empty. Sample audio is never copied into the settings directory — only paths are stored.

### Triggering

| Path | Behaviour |
|---|---|
| Sway pads | A note-on that maps to a pad index plays that pad. Handled through the MIDI layer's event callback |
| Keyboard | `Z X C V B N M ,` play pads 1 to 8. Auto-repeat is ignored so a held key does not machine-gun |
| Pad grid | Clicking an assigned pad in the Studio auditions it |

Voices are polyphonic with a concurrency cap; the oldest voice is stolen when the cap is reached. Triggering an unassigned pad, an out-of-range index, or a pad whose sample was removed is a no-op.

### Signal path

```
AudioBufferSourceNode -> voice gain -> master lowpass -> master gain -> speakers
                                                                    -> analyser (drives the visuals)
                                            delay send -> feedback -> master gain
```

Knobs 4 to 7 control master gain, low-pass cutoff, playback rate, and delay send. Knobs 0 to 2 are reserved by the render engine and are ignored by the sampler.
