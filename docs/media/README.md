# Media assets

Images referenced by [README.md](../../README.md). Every file here is generated
from this repository's own code, not captured by hand.

| File | Size | Source |
|---|---|---|
| `banner.webp` | 1280x400 | The `willidream` still under a scrim, with the wordmark in the bundled Source Code Pro |
| `hero.webp` | 1280x720 | The `miraclemile` still, DETONATION act |
| `scenes/<id>.webp` | 480x270 | One still per registry scene, `<id>` matching `meta.id` in `src/renderer/engine/scenes/` |

## Regenerating the scene stills

`gallery.plan.json` is the scene-harness plan the stills come from. It carries
one entry per scene in registry order, each with the exact `io` snapshot
(palette, bands, level, beat, knobs, gestures, strikes, transport) that the
scene was photographed under.

```sh
node scripts/scene-harness.js docs/media/gallery.plan.json
```

The harness renders in a hidden Electron window and writes one PNG per shot to
`%TEMP%/swaycommand-harness` unless the plan sets `out`. Shots whose name starts
with an underscore exist to advance a scene into the state the next shot
photographs: `_willidream_bang` runs the universe from the singularity through
the big bang so that `willidream` can fire a hyperspace jump into a settled star
field, and `_miraclemile_open` moves the act knob off zero so that the act
change registers as a move rather than an initial value.

Two properties of the harness affect what comes back. Scene instances are cached
across shots, so a scene's shots must stay contiguous and in order. The clock
`t` is shared by every shot in a run, so a scene's absolute time depends on what
ran before it; re-running the plan reproduces the setup exactly and the frame
approximately.

The PNGs are then scaled and re-encoded to WebP at quality 0.80 (0.86 for the
hero) through a canvas in the same Electron runtime. There is no native image
dependency in this tree.

The plan's `electronArgs` mirror the two switches `src/main/main.js` sets,
`--use-angle=gl` and `--gpu-program-cache-size-kb=524288`, so the stills render
on the backend the application actually uses. Both matter here: without them the
harness falls back to ANGLE's D3D11 path, where fxc unrolls the constant-trip
loops in the largest shaders and the first draw of `naturestomb` costs 135 s
against 5.2 s on GL, and `miraclemile` 103 s against 3.7 s.

## Replacing a still with a recording

The README references each scene by path, so a recording replaces a still by
taking its name. An animated `scenes/<id>.gif` supersedes `scenes/<id>.webp`
once the link in README.md points at it. Keep the 16:9 frame and a width of 480
so the gallery grid stays even.
