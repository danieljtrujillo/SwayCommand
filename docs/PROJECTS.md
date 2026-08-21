# Projects

A project is a `.sway` file: one pretty-printed JSON document holding everything a performance needs — palette, engine settings, an effects snapshot, the synth patch, the media list, the kit, the timeline, and the control assignments (terminology: [OVERVIEW.md](OVERVIEW.md)). The schema, defaults, and validation live in [`src/shared/swayproject.js`](../src/shared/swayproject.js), shared verbatim between the main process and the renderer; file I/O lives in [`src/main/projectfile.js`](../src/main/projectfile.js); the renderer-side document lifecycle lives in [`src/renderer/project/projectstore.js`](../src/renderer/project/projectstore.js).

Projects are opened and saved through the project button in the top bar. Its menu offers New, Open…, Save, Save as…, the most recent files, and the bundled templates. The default save location is `~/Documents/SwayCommand Projects`; any location outside the application directory is accepted, and the last-used directory is remembered in settings.

## Document shape

Header keys sit beside a single `project` object:

| Key | Value | Semantics |
|---|---|---|
| `format` | `"sway"` | File-type marker. A file without it is rejected as not a project. |
| `format_version` | `1` | Schema version. The loader rejects only versions **newer** than it supports, with a message to update SwayCommand; older or equal versions load. |
| `app_version` | string | The application version that last saved the file. Informational. |
| `audio_mode` | `"linked"` | Media policy: v1 links audio files by path and never embeds them. |
| `created_at`, `modified_at` | ISO 8601 or `null` | Stamped by the save path; `created_at` is set once. |
| `project` | object | Everything below. |

The `project` object:

| Section | Contents |
|---|---|
| `meta` | `id`, `name`, `description`, `author`, `vibe`, `bpmHint`, `pairsWith`, `template` |
| `palette` | Exactly five `#rrggbb` strings, loaded into ColorMaster with a 2-second blend |
| `engine` | `quality` (`low`/`med`/`high`), `fxEnabled`, `autoVJ` (`enabled`, `pool`, `minHold`, `maxHold`, `fadeTime`), `start.scene` |
| `fx.params` | The full 38-key effects-rack snapshot ([ENGINE.md](ENGINE.md)); replayed through the rack on load, never trusted raw |
| `synth` | `enabled`, `preset`, `patch` (the full patch object, or `null` to load the preset by name) |
| `media` | The media table — the **only** place file paths live. Each entry: `id`, `name`, `path` (project-relative when possible), `sha256`, `bytes`, `duration` |
| `sampler` | `kit` (16 pad slots referencing media by id, each with `gain`, `pitch`, `loop`, `chokeGroup`, `mode`) and `knobs` (`master`, `cutoff`, `rate`, `send`) |
| `timeline` | `loop` (`enabled`, `start`, `end`), `locators`, and exactly one audio track and one visual track (below) |
| `assignments` | `noteRouting`, `pads[16]`, `knobs[8]`, `buttons[8]`, `gestures[]` ([STUDIO.md](STUDIO.md)) |
| `midiOverrides` | Learned CC bindings, keyed by control target ([MIDI.md](MIDI.md)) |

A trimmed example:

```json
{
  "format": "sway",
  "format_version": 1,
  "app_version": "0.1.0",
  "audio_mode": "linked",
  "created_at": "2026-08-20T10:00:00.000Z",
  "modified_at": "2026-08-20T10:30:00.000Z",
  "project": {
    "meta": { "id": "my-set", "name": "My Set", "vibe": "club", "bpmHint": 132,
              "description": "", "author": "", "pairsWith": null, "template": false },
    "palette": ["#ff2d95", "#7a0bc0", "#2de1fc", "#f9f871", "#ff6b35"],
    "engine": {
      "quality": "med", "fxEnabled": false,
      "autoVJ": { "enabled": true, "pool": ["ribbons", "beams", "swarm"],
                  "minHold": 16, "maxHold": 32, "fadeTime": 3 },
      "start": { "scene": "ribbons" }
    },
    "fx": { "params": {} },
    "synth": { "enabled": true, "preset": "Init", "patch": null },
    "media": [
      { "id": "m-abc123", "name": "kick.wav", "path": "stems/kick.wav",
        "sha256": "…", "bytes": 220500, "duration": 1.25 }
    ],
    "sampler": {
      "kit": { "version": 1, "pads": [ { "id": "m-abc123", "gain": 1, "pitch": 1,
               "loop": false, "chokeGroup": null, "mode": "oneshot" }, null ] },
      "knobs": { "master": 0.5, "cutoff": 0.5, "rate": 0.5, "send": 0.5 }
    },
    "timeline": {
      "loop": { "enabled": false, "start": 0, "end": 0 },
      "locators": [],
      "tracks": [
        { "id": "audio-1", "type": "audio", "name": "Audio", "gain": 1, "muted": false,
          "clips": [ { "id": "c-1", "media": "m-abc123", "start": 0, "end": 8,
                       "offset": 0, "gain": 1, "fadeIn": 0, "fadeOut": 0, "name": "kick" } ] },
        { "id": "visual-1", "type": "visual", "name": "Scenes",
          "clips": [ { "id": "v-1", "scene": "beams", "start": 0, "end": 8,
                       "transition": { "type": "cut", "duration": 0 } } ] }
      ]
    },
    "assignments": {
      "version": 1,
      "noteRouting": { "synth": "unassigned" },
      "pads": [ { "type": "sample", "pad": 0 },
                 { "type": "sceneAction", "scene": "willidream", "action": "blackhole" }, null ],
      "knobs": [ { "target": "engine:hue", "min": 0, "max": 1, "curve": "detent" }, null ],
      "buttons": [ { "cc": null, "channel": null, "action": null } ],
      "gestures": [ { "source": "gesture:press", "target": "fx:glitch",
                      "min": 0, "max": 1, "curve": "linear", "enabled": true } ]
    },
    "midiOverrides": {}
  }
}
```

(The real file always carries all 16 pad slots, all 8 knob and button slots, and both tracks; the arrays here are truncated for reading.)

## Validation and loading

`validateProject()` never throws on content: every missing key is filled with its default, out-of-range numbers are clamped, and anything unusable — a media entry without a path, a clip referencing unknown media, a knob with an invalid target — is dropped with a message appended to a `warnings` array. Unrecognized keys survive the round-trip, so data written by a newer minor version is not destroyed by an older one. Only two conditions reject a file outright, both in `readProject()`: `format` is not `"sway"`, or `format_version` is newer than the build supports. A size cap of 8 MB keeps the read channel from being pointed at non-project files.

A pad action is one of `sample`, `scene` (switch the stage), `sceneAction` (fire an event the active scene declares), or `fxPunch`. A continuous target is `<namespace>:<key>` over the namespaces `engine`, `fx`, `synth`, `sampler` and `transport`, or `scene:<sceneId>:<key>` for a parameter a scene declares in its `meta.controls` ([SCENE_CONTRACT.md](SCENE_CONTRACT.md#the-scene-control-surface)). Scene ids and keys are not resolved at validation time — a project may reference a scene the build does not have, and the reference simply never fires — so a file written against a newer scene registry still loads.

On open, the project store applies the document in a fixed order: synth patch first (a patch swap is silent; a scene cut is visible), then `engine.applyProject` (palette, Auto-VJ, effects snapshot, start scene as an instant cut, scene prewarm), then router assignments, MIDI overrides, the timeline into the transport, and the sampler knobs. Media then loads asynchronously — one decode at a time so the render loop keeps breathing — and the show starts before the stems finish streaming in.

## Media linking

`project.media[]` is the only path-bearing structure in the document. Pads and timeline clips reference media by `id`, never by path.

- On save, each path is stored **project-relative** when the file sits under the project's directory, absolute otherwise; `sha256` and `bytes` are filled from the file (over the `files:statAudio` channel) for later integrity checks. Audio is never copied or embedded.
- On open, relative paths resolve against the project file's directory. A missing or unreadable file produces a warning and an empty pad or silent clip, never a failed load.
- Reads are capped at 256 MB per file. Because compressed audio decodes to Float32 PCM, the loader also estimates the decoded size from the cached duration: above roughly 600 MB it warns, above roughly 1.5 GB it refuses to decode the file.
- Files enter the project through the KIT drawer's LOAD button ([STUDIO.md](STUDIO.md)); the OS dialog filters to `wav`, `mp3`, `flac`, `ogg`, `m4a`, `aac`, `aiff`, `aif`, `opus`, and `webm`.

## Timeline model

Version 1 fixes the track layout: exactly one audio track and one visual track.

| Element | Fields | Semantics |
|---|---|---|
| `loop` | `enabled`, `start`, `end` | The loop region; disabled automatically when `end ≤ start`. Set from the ruler with Shift+drag, toggled with LOOP or `L`. |
| `locators` | `id`, `name`, `time`, `color` | Ruler markers. Double-click the ruler to add one; clicking within 6 px of one seeks to it. |
| Audio clip | `id`, `name`, `media`, `start`, `end`, `offset`, `gain`, `fadeIn`, `fadeOut` | A slice of a media file placed on the lane; `offset` is the position inside the source. Scheduled sample-accurately by the transport ([AUDIO.md](AUDIO.md)). |
| Visual clip | `id`, `scene`, `start`, `end`, `transition` (`cut` or `crossfade` + `duration`) | Entering the clip during playback fires the scene at the router: the transition applies at a played boundary; any seek lands as a cut. Auto-VJ is suspended while the timeline drives the stage and restored afterward. |

Clips are kept sorted by start time; validation drops zero-length clips. Editing gestures on the band: drag a clip to move it, drag its edges to resize, double-click the visual lane to lay the current scene, drag a scene from the SCENES bank or a sample from the KIT drawer onto the matching lane, wheel to zoom, Shift+wheel to pan, `Delete` to remove the selected clip, arrow keys to nudge it by half a second.

## Templates

Eleven templates are bundled as full `.sway` documents at `projects/templates/*.sway`: the eight factory presets of earlier builds, produced from the legacy JSON by `legacyToSway()` (everything the legacy shape did not cover sits at defaults, and `meta.template` is `true`), plus three authored projects: `will-i-dream`, whose timeline carries a linked track — the only template with media, linked by the absolute path of the author's machine, so on any other machine the audio clip loads with a missing-file warning and the scene still plays; `natures-tomb`, which opens on the Nature's Tomb scene with nothing assigned; and `miracle-mile`, which opens on Miracle Mile with nothing assigned. They appear at the bottom of the project menu; opening one loads a fresh untitled copy — templates are read-only and are addressed by id through a gated channel, never by path. `projects/templates/index.json` fixes the menu order.

| Id | Name | Vibe | Scene pool | Start | Auto-VJ | Hold (s) | Fade (s) | BPM hint | Pairs with |
|---|---|---|---|---|---|---|---|---|---|
| `first-flight` | First Flight | welcoming | beams, swarm, ribbons, voxels, warp, nebula, mandelbulb, cymatic, vjshader | beams | on | 20–45 | 5 | — | — |
| `will-i-dream` | Will I Dream | lucid | willidream | willidream | off | 60–120 | 4 | — | the track "Will I Dream" on the audio lane (0:00–3:49) with the scene on the visual lane |
| `natures-tomb` | Nature's Tomb | cellular | naturestomb | naturestomb | off | 60–120 | 4 | — | — |
| `miracle-mile` | Miracle Mile | critical | miraclemile | miraclemile | off | 60–120 | 4 | — | — |
| `hyperspace` | Hyperspace | transluminal | warp, vjshader, mandelbulb, lattice, valley, spectra, swarm | warp | on | 22–46 | 3 | — | — |
| `chrysanthemum` | Chrysanthemum | hyperreal | mandelbulb, vjshader, ferrofluid, chladni, lattice, nebula, warp, spectra | mandelbulb | on | 26–52 | 6 | — | — |
| `beam-sixteen` | Beam Sixteen | anthemic | beams, nebula | beams | off | 30–60 | 6 | — | — |
| `garage-neon` | Garage Neon | club | ribbons, valley, lattice, beams, swarm | ribbons | on | 16–32 | 3 | 132 | Audima Ableton Garage demo pack |
| `dnb-tunnel` | DNB Tunnel | relentless | warp, swarm, mandelbulb, beams | warp | on | 12–24 | 2 | 174 | Audima Ableton DNB demo pack |
| `hiphop-voxels` | Hip Hop Voxels | heavyweight | voxels, ribbons, nebula | voxels | on | 24–48 | 5 | 88 | Audima Ableton Hip Hop demo pack |
| `nebula-drift` | Nebula Drift | ambient | nebula, ferrofluid, chladni, cymatic, swarm | nebula | on | 40–80 | 10 | — | — |

`beam-sixteen` stores hold and fade values but ships with the scheduler disabled; the values take effect if Auto-VJ is toggled on (RUN, or the `A` key). New (`project menu → New`) opens the `first-flight` template.

## Saving

`Save` writes to the current path; `Save as…` (and `Save` on an untitled project) opens the OS dialog. Before writing, the store collects live state back into the document — kit, synth patch, effects snapshot, Auto-VJ values, assignments, MIDI overrides, timeline — so the file always reflects what is playing. Writes are atomic (a `.tmp` file renamed into place), and saving inside the application directory is refused. Every save and open pushes the file onto the recents list in settings (up to 10 entries; paths that no longer exist are pruned on read).

The project button shows the project name and marks unsaved changes; New, Open, a recent file, and a template all ask for confirmation while changes are unsaved.

## Startup selection

At boot the renderer loads, in order of preference: the `autoplay` query parameter (a `.sway` file path, or a template id — supplied by the `SWAYCOMMAND_AUTOPLAY` environment variable, [ENVIRONMENT.md](ENVIRONMENT.md)); the most recent project from settings; the `first-flight` template. A failed candidate logs a console warning and falls through to the next.
