# Sway integration

Technical reference for AKSWAYJ's interface to the Audima Labs Sway and to Audima's distribution endpoints. All facts were verified against official Audima artifacts — firmware USB descriptors, companion-application binaries, and the Cubase/Ableton DAW scripts — on 2026-08-19; sources and open questions are recorded in [RESEARCH.md](RESEARCH.md). The code constants live in [`src/shared/constants.js`](../src/shared/constants.js) and [`src/renderer/midi/swaymap.js`](../src/renderer/midi/swaymap.js); this document and those two files record the same values.

## USB identity

The identity is stable across firmware v1.0.0–v1.3.0 (from the official CM7.bin device descriptor).

| Mode | VID | PID | Device |
|---|---|---|---|
| Normal | `0x0483` | `0x52A4` | Composite device (IAD): CDC-ACM serial (the proprietary companion-application protocol) plus class-compliant USB-MIDI, single 1×1 port pair |
| DFU (firmware update) | `0x0483` | `0xDF11` | STM32 ROM bootloader |

USB strings: manufacturer `Audima Labs`, product `Audima Labs The Sway`.

Detection reads an OS device enumeration and matches the VID/PID: `pnputil /enum-devices /connected` on Windows (PowerShell `Get-PnpDevice -PresentOnly` as fallback), `system_profiler SPUSBDataType` on macOS (VID plus product string; DFU mode via the `STM32 BOOTLOADER` marker), `lsusb` on Linux. The implementation is `usbSnapshot()` in [`src/main/doctor.js`](../src/main/doctor.js). The CDC serial port is never identified by its friendly name.

The device runs a dual-core STM32H7 with separate CM7 and CM4 firmware images; firmware is normally flashed through Sway Software.

## MIDI port name per OS

| OS | Port name | Basis |
|---|---|---|
| Windows | `Audima Labs The Sway` (exact) | Confirmed by the official Cubase script's cross-platform equals-match filter |
| macOS | `Audima Labs The Sway` (exact) | Same confirmation |
| Linux (ALSA) | Typically `Audima Labs The Sway MIDI 1` (rawmidi suffix) | ALSA port-naming convention |

AKSWAYJ matches by substring — `name.includes('Audima Labs The Sway')` — which covers the exact name on Windows and macOS and the suffixed name on ALSA in a single test. The string is defined as `SWAY.MIDI_PORT_NAME` in `src/shared/constants.js` and `SWAY_PORT_NAME` in `src/renderer/midi/swaymap.js`. Runtime binding policy: [MIDI.md](MIDI.md#device-detection-and-binding-policy).

## Factory MIDI map (Base Project V2)

The map was recovered from Audima's own artifacts — the Base Project V2 `.swayproj`, the decompiled Ableton remote script, and the inflated Cubase script — and is not officially published. Every binding is overridable at runtime via MIDI-learn ([MIDI.md](MIDI.md#midi-learn)).

Everything transmits on MIDI channel 1 (0-indexed `0` in code) except where the table flags otherwise.

| Control | Message | Value(s) | Confidence |
|---|---|---|---|
| Full-surface hand tracking X | CC | 50 | Confirmed |
| Full-surface hand tracking Y | CC | 38 | Confirmed |
| Gesture isolation: Pulse (vertical bounce energy) | CC | 35 | Confirmed |
| Gesture isolation: Press (downward press depth) | CC | 36 | Confirmed |
| Gesture isolation: Sway (lateral sway amount) | CC | 37 | Confirmed |
| X-trigger / Y-modulation paired regions | CC | 73 (X) / 74 (Y) | Confirmed |
| Knobs 1–8, rotation | CC | 20–27 | Confirmed |
| Knobs 1–8, press | CC | Numbers not established; resolvable with one hardware MIDI-monitor session | (unconfirmed) |
| 8 mappable buttons, defaults | CC or notes | The CC-versus-note default is not established | (unconfirmed) |
| 16 drum pads, factory layout | Note On/Off | B natural minor Theory Engine grid: `47 49 50 52 54 55 57 59 61 62 64 66 67 69 71 73` (low to high) | Confirmed |
| 16 drum pads, Audima Ableton demo packs and AKSWAYJ's internal normalization | Note On/Off | Chromatic 24–39 → pad index 0–15 | Confirmed |
| Pad transmit channel | — | 1 per the `.swayproj`, 16 per the official Ableton script; AKSWAYJ accepts both (`channels: [0, 15]`) | (unconfirmed) |
| Sleep / wake | Program Change (bank 0) | PC 37 = sleep, PC 38 = wake | Confirmed |
| MPE | Per-region flag in projects | Zone and channel details unpublished | (unconfirmed) |

AKSWAYJ maps all CCs to 0..1 and pad velocities to 0..1 in the control state constructed by `createControlState()` in `src/renderer/midi/swaymap.js`; consumers read that state, never raw MIDI. Routing and normalization details: [MIDI.md](MIDI.md#message-routing).

## Driver matrix

| OS | Normal mode (MIDI) | DFU mode (firmware update) |
|---|---|---|
| Windows 10+ | Driverless (class-compliant USB-MIDI) | Requires the ST WinUSB driver for `USB\VID_0483&PID_DF11` |
| macOS | Driverless | No driver at any point |
| Linux | Driverless (ALSA) | No driver at any point |

Audima's official Windows DFU driver package is <https://cdn.audima.com.au/software/Windows%20DFU%20Driver.zip>. It contains `STM32Bootloader.inf` and an ST-signed `.cat`; [`src/main/driver-install.js`](../src/main/driver-install.js) stages the extracted INF with `pnputil /add-driver <inf> /install` under a user-approved UAC elevation. The package is licensed under ST's SLA0048, which permits bundling with notices retained.

AKSWAYJ installs nothing by default; the driver installs only from an explicit Doctor fix click. Two Doctor checks offer that fix on Windows: the Sway USB check, when a device at `0483:DF11` is detected, and the driver check, whenever `STM32Bootloader.inf` is absent from the driver store (`pnputil /enum-drivers`).

## Audima CDN interface

`cdn.audima.com.au` and `audima.com.au` return HTTP 403 to requests whose User-Agent contains curl, python, or Go tool signatures; any honest custom User-Agent passes. AKSWAYJ sends `AUDIMA.USER_AGENT` from `src/shared/constants.js` — `AKSWAYJ/0.1 (Sway companion; +https://github.com/akswayj)` — and never falls back to a default `curl/…` or `python-requests/…` value. The CDN supports Range/206 requests and requires no authentication. The blocking rules can tighten at any time (for example, to a JavaScript challenge); on fetch failure the Doctor offers a fix action that opens <https://audima.com.au/downloads/> in the system browser.

The download layer in [`src/main/audima.js`](../src/main/audima.js) enforces an HTTPS-only host allowlist (`cdn.audima.com.au`, `audima.com.au`, `www.audima.com.au`), a 15-second default timeout (10 minutes for artifact downloads), and writes downloads to a `.part` file renamed only on completion.

### Version manifest

The Tauri updater manifest is queried first; pinned URLs (`AUDIMA.FALLBACK_APP_*` in `constants.js`) are used only when the manifest is unreachable, malformed, or missing the platform entry, because pinned version directories have been deleted before (the v1.0.x directories are gone). Audima ships no Linux build of the companion application.

Endpoint: <https://cdn.audima.com.au/software/latest.json>. Manifest shape (standard Tauri updater):

```json
{
  "version": "1.2.1",
  "platforms": {
    "windows-x86_64": { "url": "https://cdn.audima.com.au/software/v1.2.1/...", "signature": "<minisign>" },
    "darwin-aarch64":  { "url": "...", "signature": "..." },
    "darwin-x86_64":   { "url": "...", "signature": "..." }
  }
}
```

### Minisign verification

Audima's MSIs are not Authenticode-signed; the minisign signature is the only integrity mechanism. The public key, embedded in Audima's own application:

```
RWSHmZALaQgTB08RzBn8ecTwgikkFPA5K01eHmEKTds/Th8QYzV6UlpX
```

The verification algorithm, implemented in `minisignVerify()` in `src/main/audima.js`:

1. The public key decodes from base64 to 42 bytes: the ASCII tag `Ed`, an 8-byte key id, and a 32-byte Ed25519 public key.
2. The signature decodes from base64 to 74 bytes: a 2-byte algorithm tag (`ED` or `Ed`), an 8-byte key id, and a 64-byte signature. Tauri manifests carry the entire `.sig` file base64-encoded; both the raw text and the encoded form are accepted, and comment lines are discarded.
3. The signature's key id must equal the public key's key id.
4. With tag `ED` (prehashed), the Ed25519 signature is verified over the BLAKE2b-512 digest of the file; with tag `Ed` (legacy), over the file bytes directly.

The flow: fetch `latest.json`, download the platform artifact to the user's Downloads folder, verify the minisign signature, and only then hand the file to the OS installer. A failed verification deletes the download. The pinned fallback URLs carry no signature; a fallback download is opened with an explicit unverified notice. Final fallback: the downloads page in the browser.

Audima's terms and conditions prohibit redistributing their content (<https://audima.com.au/terms-and-conditions/>), so AKSWAYJ distributions never bundle Audima binaries; fetching onto the user's machine at the user's request is the compliant path. The ST DFU driver alone may be bundled under SLA0048.

## Serial write prohibition

AKSWAYJ never writes to the Sway's CDC serial interface. This is a hard policy, for three reasons established during research:

1. The official application's serial protocol (Handshake, SendProjectFragment*, EEPROM upload, ACK/retry) was identified in the Tauri executable, but the wire framing — CRC polynomial, baud rate, ACK bytes — is not statically recoverable.
2. `.swayproj` is a versioned raw EEPROM image, and the format has already changed once (the `FF 02` prefix).
3. Audima's own application ships a deliberate `corrupt_eeprom` test demonstrating that a bad write soft-bricks the device's stored configuration.

The supported alternative: any AKSWAYJ-tuned preset is authored as a `.swayproj` in Audima's own Sway Software, shipped as a file, and pushed to the device with Audima's application — no reverse engineering, no brick risk. The Base Project V2 factory map (<https://cdn.audima.com.au/software/Audima%20Labs%20The%20Sway%20V2.swayproj>) plus runtime MIDI-learn covers every remaining case. Direct device configuration would be revisited only under an Audima partnership (contactus@audima.com.au, <https://discord.com/invite/CYUrJXjjN4>).

## Sources

Every claim above traces to a primary source listed in [RESEARCH.md](RESEARCH.md): the firmware descriptor and USB identity to the official firmware archive, the factory map to the Base Project V2 file and the DAW scripts, the CDN behavior to empirical verification dated 2026-08-19, and the serial-protocol findings to binary analysis of the companion application's installer.
