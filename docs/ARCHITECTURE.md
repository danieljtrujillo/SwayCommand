# Architecture

AKSWAYJ runs as a standard two-process Electron application: a main process with operating-system access and a context-isolated renderer that receives a fixed API surface through a preload script. This document covers the process model, the module inventory, the renderer screen flow, the complete IPC surface, renderer bundling, the security model, and the packaged file layout. System-level context and terminology: [OVERVIEW.md](OVERVIEW.md). Environment variables and file locations: [ENVIRONMENT.md](ENVIRONMENT.md).

## Process model

| Process | Entry | Responsibility |
|---|---|---|
| Main | `src/main/main.js` | Window lifecycle, session permission handlers, IPC handlers, settings file, project loading, bundled-documentation access; delegates to `doctor.js`, `audima.js`, `driver-install.js` |
| Preload | `src/preload/preload.js` | Exposes `window.akswayj` through `contextBridge`; the renderer has no other path to the main process |
| Renderer | `dist/renderer.bundle.js` (built from `src/renderer/app.js`) | Screens, HUD, MIDI input, audio analysis, WebGL rendering, documentation viewer |

The `BrowserWindow` is created with `contextIsolation: true`, `nodeIntegration: false`, and `sandbox: false`. Window parameters: 1440 × 900 default size, 960 × 600 minimum, background color `#05060a`, menu bar auto-hidden, shown only after the `ready-to-show` event. The window loads `dist/index.html` from disk via `loadFile`, with optional `autoplay` and `scene` query parameters taken from the `AKSWAYJ_AUTOPLAY` and `AKSWAYJ_SCENE` environment variables (see [ENVIRONMENT.md](ENVIRONMENT.md)).

On macOS, `activate` recreates the window when none exists; on every other platform, closing the last window quits the application.

## Module inventory

| File | Responsibility | Key exports |
|---|---|---|
| `src/main/main.js` | Entry point: window creation, permission handlers, IPC handlers, settings read/merge/write, project listing, bundled-documentation listing and reading, external-URL allowlist | none (entry point) |
| `src/main/doctor.js` | Main-process system checks: platform summary, Sway USB presence, Sway Software install state, DFU driver state, Audima CDN reachability | `runAll` |
| `src/main/audima.js` | Audima CDN client: host allowlist, `latest.json` fetch, downloads with progress, minisign verification | `fetchLatest`, `downloadCompanion`, `downloadDfuDriver`, `minisignVerify`, `audimaFetch` |
| `src/main/driver-install.js` | Windows DFU driver staging via `pnputil.exe` under a user-approved UAC elevation | `installDfuDriver` |
| `src/preload/preload.js` | `contextBridge` exposure of the IPC surface as `window.akswayj` | none (side effect) |
| `src/shared/constants.js` | Sway USB identity, Audima endpoints and public key, application name | `SWAY`, `AUDIMA`, `APP` |
| `src/renderer/app.js` | Screen flow, Doctor UI, project picker, documentation viewer, HUD, keyboard and pointer input | none (bundle entry) |
| `src/renderer/markdown.js` | Dependency-free Markdown renderer for the documentation viewer, plus the heading-to-anchor slug rule | `renderMarkdown`, `slugify` |
| `src/renderer/engine/engine.js` | Render pipeline and Auto-VJ | `createEngine` |
| `src/renderer/engine/audio.js` | Audio analysis and the internal groove | `createAudioEngine` |
| `src/renderer/midi/midi.js` | MIDI detection, routing, MIDI-learn overrides | `createMidi` |
| `scripts/build-renderer.js` | esbuild renderer bundling into `dist/` | none (build script) |

## Screen flow in app.js

The renderer is a single HTML document with four `<section>` elements — `#screen-boot`, `#screen-projects`, `#screen-docs`, `#screen-perform` — toggled by the `active` class. The startup sequence in `main()`: fetch application info over `app:info`, create the MIDI layer, the audio engine, and the render engine (quality tier `med`), restore `midiOverrides` from the settings file, load the project list, wire event handlers, start audio (`autoStart`: live input when available, internal groove otherwise), then branch on the `autoplay` query parameter.

### Boot (Doctor)

`runDoctor()` runs the main-process checks (`doctor:run`) and three renderer-local checks in parallel, then renders the combined list:

| Check id | Test | Possible statuses |
|---|---|---|
| `gpu` | WebGL2 context creation on a probe canvas | `ok`, `fail` |
| `midi` | WebMIDI availability and connected port (Sway, generic controller, or none) | `ok`, `warn` |
| `audio` | Audio input enumeration | `ok`, `info` |

The aggregate status is `fail` if any check failed, otherwise `warn` if any check warned, otherwise `ok`; checks with status `info` do not raise the aggregate. When the aggregate is `ok` — every check reports `ok` or `info` — a 1400 ms timer advances to the project picker, provided the boot screen is still active. The auto-advance fires at most once per session (`state._autoAdvanced`). Manual paths exist regardless of status: the Enter button (enabled after every run) and the Re-run checks button.

A fix button click invokes `doctor:fix`; progress events arrive on `fix:progress` and are written into the check's progress element. On a successful fix the button is removed and the full Doctor re-runs.

### Project picker

Cards are rendered from `projects:list`; swatch colors are applied through the CSSOM rather than markup-inline style attributes. Click or the Enter key starts the performance; Escape returns to the boot screen. A Documentation button opens the documentation viewer.

### Perform

`startPerformance(project)` loads the project into the engine, switches screens, and starts the render loop. Keyboard handling on this screen: digits `1`–`8` select a scene directly from `engine.sceneList` — the eight-entry registry in `src/renderer/engine/scenes/index.js`, independent of the project pool — and disable Auto-VJ, Space crossfades to another scene from the project pool, `A` toggles Auto-VJ, `F` toggles fullscreen, `H` toggles the help overlay, `K` toggles the MIDI monitor, `D` stops the engine and opens the documentation viewer, `Z X C V B N M ,` strike pads 1–8, and Escape closes an open overlay or stops the engine and returns to the picker. The MIDI monitor sits on `K` because `M` is the pad 7 key: the pad lookup is the final branch of the key handler, so `M` never reaches an overlay toggle. Pointer input feeds the control state whenever no Sway is driving: pointer position maps to XY, buttons to the Press gesture, the wheel to the Pulse gesture. The HUD (scene name, Auto-VJ state, input source, audio source, FPS) updates every animation frame.

With `?autoplay=<projectId>`, the boot screen is bypassed: the performance starts immediately and the Doctor still runs in the background to populate its screen.

### Documentation viewer

`#screen-docs` renders the Markdown documentation that ships inside the package, so the text is available offline and matches the installed build. The screen opens from the Documentation button on the boot and project-picker screens (`[data-open-docs]` in `src/renderer/index.html`) and from the `D` key on any screen except the documentation screen itself. `openDocs()` records the screen it was entered from in `state.docsReturnScreen`; the Close button and Escape both call `returnFromDocs()`, which restores that screen. `D` pressed during a performance stops the render loop before the switch, and `returnFromDocs()` calls `engine.start()` again when the recorded screen is `perform`, so the stage resumes instead of returning frozen.

The document set is fixed in the main process. `DOC_ORDER` in `src/main/main.js` enumerates sixteen package-relative paths — `README.md` followed by the fifteen files in `docs/` — and both handlers work from it. `listDocs()` maps that order to `{ id, title }` records, skipping paths absent from disk and taking each title from the first ATX H1 in the file's leading 4096 characters, falling back to the base name without the `.md` extension. `readDoc(id)` rejects any id outside the array with `Unknown document: <id>`, so no caller-supplied path reaches the filesystem and the channel cannot read arbitrary files. `docsRoot()` resolves two directories above `__dirname`, the same base `projectsDir()` starts from, so both handlers read from the package root in development and from the `app.asar` root when packaged.

The sidebar list is built once, on the first open, from `docs:list`. Selecting an entry calls `loadDoc()`, which fetches the source over `docs:read`, renders it with `renderMarkdown()`, writes the result into `#docs-body`, resets the scroll position, marks the active sidebar button with the `current` class, and rebuilds `#docs-toc` from the returned heading list. The renderer collects headings of level 1 to 3 and the table of contents drops level 1, so the contents list holds the level-2 and level-3 headings, carrying a `lvl-2` or `lvl-3` class for indentation. Heading anchors come from `slugify()`: lowercased, backticks and non-word characters removed, whitespace runs collapsed to single hyphens. A read failure replaces the body with an `Unavailable` heading and the error message.

`src/renderer/markdown.js` covers the subset the documentation uses: ATX headings, fenced code, pipe tables, ordered and unordered lists, blockquotes, horizontal rules, and the inline set of code spans, bold, italic, and links. Source text is HTML-escaped before any markup is generated, and code spans are extracted first behind private-use sentinels so their contents are never reprocessed. Tables are wrapped in a `<div class="table-scroll">`. Links become `<a href="#" data-href="…">`, with `"` in the target replaced by `%22`; the target is classified at click time by `followDocLink()`:

| Target form | Handling |
|---|---|
| Begins with `#` | Scrolls the element with the matching id into view within the current document |
| Matches `^https?:` | Handed to `openExternal`; a rejection — the URL is outside `EXTERNAL_ALLOW` — shows the inline notice `Link not on the allowlist — open manually: <href>` |
| Anything else | Resolved as a relative path against the current document's directory, with empty and `.` segments dropped and each `..` popping one segment. A result matching an id from `docs:list` loads that document and scrolls to the `#` fragment when present; otherwise the inline notice `Not part of the bundled documentation: <href>` appears |

The inline notice is a `.docs-external-note` element appended to the body and removed 6000 ms later. Nothing in the viewer navigates the page: `will-navigate` is prevented for every web contents, and external targets reach the system browser through `shell:openExternal` only.

## IPC surface

Every renderer-to-main channel is an `ipcMain.handle` invocation reached through `window.akswayj`. There is one main-to-renderer event, `fix:progress`.

| Channel | Direction | Request payload | Response | Handler |
|---|---|---|---|---|
| `app:info` | renderer → main (invoke) | none | `{ name, version, platform, arch }` | `src/main/main.js` |
| `doctor:run` | renderer → main (invoke) | none | Array of check records `{ id, label, status, detail, fix? }`; `status` is one of `ok`, `warn`, `fail`, `info` | `src/main/main.js` → `doctor.runAll()` |
| `doctor:fix` | renderer → main (invoke) | `fixId` string | `{ ok, detail }` | `src/main/main.js` (dispatch table below) |
| `projects:list` | renderer → main (invoke) | none | Project objects in `projects/index.json` order; unreadable entries are logged and skipped | `src/main/main.js` |
| `docs:list` | renderer → main (invoke) | none | `{ id, title }` records in `DOC_ORDER` order; paths absent from disk are skipped | `src/main/main.js` → `listDocs()` |
| `docs:read` | renderer → main (invoke) | document id string | The file's UTF-8 text; throws `Error('Unknown document: <id>')` for any id outside `DOC_ORDER` | `src/main/main.js` → `readDoc()` |
| `settings:get` | renderer → main (invoke) | none | Settings object; `{}` when the file is missing or unparsable | `src/main/main.js` |
| `settings:set` | renderer → main (invoke) | patch object | The merged settings object | `src/main/main.js` |
| `shell:openExternal` | renderer → main (invoke) | URL string | Resolves after opening; rejects with `Error('URL not on the allowlist')` for any URL outside `EXTERNAL_ALLOW` | `src/main/main.js` |
| `fix:progress` | main → renderer (event) | — | `{ fixId, phase, pct?, received?, total? }`; `phase` is `download`, `verify`, or `install` | Sent from the `doctor:fix` progress callback in `src/main/main.js` |

The `doctor:fix` dispatch:

| `fixId` | Action | Implementation |
|---|---|---|
| `fetch-companion` | Download, verify, and open the Sway Software installer | `audima.downloadCompanion` |
| `install-dfu-driver` | Download, extract, and stage the STM32 WinUSB driver | `driver.installDfuDriver` |
| `open-downloads-page` | Open `https://audima.com.au/downloads/` in the system browser | `shell.openExternal` |
| `open-manual` | Open the Sway user manual PDF in the system browser | `shell.openExternal(AUDIMA.USER_MANUAL)` |

An unknown `fixId` returns `{ ok: false, detail: 'Unknown fix: <id>' }`.

The preload maps these channels onto `window.akswayj`: `info()`, `doctor.run()`, `doctor.fix(fixId)`, `doctor.onFixProgress(cb)` (returns an unsubscribe function), `projects.list()`, `docs.list()`, `docs.read(id)`, `settings.get()`, `settings.set(patch)`, and `openExternal(url)`.

## Renderer bundling

`scripts/build-renderer.js` bundles the renderer with esbuild: entry point `src/renderer/app.js`, `format: 'iife'`, `platform: 'browser'`, `target: 'chrome120'`, unminified, no source map. three.js (`^0.180.0`, imported by `engine.js` and `colormaster.js`) is statically bundled; the renderer loads no code at runtime beyond the bundle. The script then copies the two static files. Resulting `dist/` layout:

| File | Origin |
|---|---|
| `dist/renderer.bundle.js` | esbuild output |
| `dist/index.html` | copied from `src/renderer/index.html` |
| `dist/styles.css` | copied from `src/renderer/styles.css` |

`npm start` runs the bundle step and then launches Electron; the `dist:*` scripts run it before `electron-builder`.

## Security model

The page CSP, set as a `<meta http-equiv>` tag in `src/renderer/index.html`:

```
default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; media-src 'self' mediastream:
```

`script-src 'self'` restricts execution to local files, and `connect-src 'self'` denies the renderer all network access — every download runs in the main process. `media-src mediastream:` admits microphone capture streams.

Session permissions are governed by an explicit grant set: `{ midi, midiSysex, media, audioCapture }`. Both `setPermissionRequestHandler` and `setPermissionCheckHandler` consult this set; every other permission is denied.

Navigation and window creation are locked down for every web contents the application creates: `will-navigate` is unconditionally prevented, and `setWindowOpenHandler` returns `deny` for every request — when the URL passes `allowedExternal()`, it is handed to `shell.openExternal` and opens in the system browser instead. `allowedExternal()` accepts only `https:` URLs whose hostname equals, or is a subdomain of, an entry in `EXTERNAL_ALLOW`:

| Domain |
|---|
| `audima.com.au` |
| `github.com` |
| `githubusercontent.com` |
| `nodejs.org` |
| `community.polyexpression.com` |
| `discord.com` |
| `vidvox.net` |
| `huggingface.co` |
| `unity.com` |
| `resolume.com` |
| `st3nd.com` |
| `serato.com` |
| `synesthesia.live` |
| `elektronauts.com` |
| `indiegogo.com` |

The list covers the application's own endpoints plus every host cited by the bundled documentation, so a link followed in the documentation viewer resolves without widening the policy to arbitrary URLs. `cdn.audima.com.au` has no entry of its own: the subdomain rule admits it under `audima.com.au`. The same predicate guards the `shell:openExternal` IPC channel, which is the only path the viewer has to the system browser.

The download layer in `src/main/audima.js` applies a stricter, exact-match allowlist: `audimaFetch` refuses any URL that is not `https:` on `cdn.audima.com.au`, `audima.com.au`, or `www.audima.com.au` (no subdomain wildcard). Requests carry the custom User-Agent from `AUDIMA.USER_AGENT`, time out after 15 s by default and 10 min for downloads, and write to a `.part` file that is renamed only on completion. When the manifest supplies a signature, the companion installer's minisign signature is verified against the Ed25519 public key in `src/shared/constants.js` before the file is opened, and a failed verification deletes the download; the pinned fallback URLs carry no signature, so a fallback download is opened unverified. USB identity and CDN interface details: [SWAY_INTEGRATION.md](SWAY_INTEGRATION.md).

## Packaged layout

`electron-builder.yml` packages a whitelist of paths into `resources/app.asar` (`asar: true`):

```
src/main/**/*
src/preload/**/*
src/shared/**/*
dist/**/*
projects/**/*
docs/**/*.md
README.md
package.json
```

Build output lands in `release/`; the application id is `app.akswayj`. `projectsDir()` in `main.js` resolves `projects/` two directories above `__dirname` (`src/main`), which lands at the package root in development and at the `app.asar` root when packaged, so the same code path serves both. `docsRoot()` resolves the same two directories and the `DOC_ORDER` ids are paths relative to it, so the `docs/**/*.md` and `README.md` entries are what make the documentation viewer work in an installed build: without them the Markdown would exist only in the source tree and `listDocs()` would return an empty list.

Per-platform targets: a one-click NSIS installer on Windows (`AKSWAYJ-Setup-${version}.exe`, per-user, launches the application when it finishes, preserves application data on uninstall), a DMG on macOS (category `public.app-category.music`), and an AppImage on Linux (category `AudioVideo`).
