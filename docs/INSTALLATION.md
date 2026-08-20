# Installation

AKSWAYJ installs from a packaged build or from a source checkout. Packaged builds install per-user and request no elevation on any platform. The pipeline that produces the packages is documented in [BUILD.md](BUILD.md).

## Packaged installation

| Platform | Minimum version | Artifact |
|---|---|---|
| Windows | 10 (x64) | `AKSWAYJ-Setup-<version>.exe` (NSIS one-click installer) |
| macOS | 11 | DMG |
| Linux | glibc-based x64 distribution | AppImage |

### Windows

The installer is a one-click NSIS package (`oneClick: true` in [electron-builder.yml](../electron-builder.yml)). Running `AKSWAYJ-Setup-<version>.exe` installs without further prompts:

- Installation is per-user (`perMachine: false`). Files are written to `%LOCALAPPDATA%\Programs\akswayj`, no administrator elevation is requested, and the Apps list entry is created for the current user only.
- When installation completes, the installer launches the application (`runAfterFinish: true`), which opens on the Doctor screen.

The artifact name follows the `AKSWAYJ-Setup-${version}.${ext}` pattern; at version 0.1.0 the file is `AKSWAYJ-Setup-0.1.0.exe`.

#### Silent installation

The standard NSIS silent switch performs the same per-user installation with no user interface:

```bat
AKSWAYJ-Setup-0.1.0.exe /S
```

`runAfterFinish` does not apply in silent mode; a silent installation completes without launching the application.

### macOS

The DMG contains the application bundle. Installation is a copy of `AKSWAYJ.app` into `/Applications` (or any writable location). The build is not signed or notarized; the first launch is subject to Gatekeeper, as described under [Code-signing status](#code-signing-status).

### Linux

The AppImage is a self-contained executable and performs no system installation.

1. Mark the file executable: `chmod +x <file>.AppImage`.
2. Run the file.

Settings are written to `~/.config/AKSWAYJ` on first run.

## Uninstallation

| Platform | Removal | Data left behind |
|---|---|---|
| Windows | "AKSWAYJ" entry in Settings → Apps → Installed apps | `%APPDATA%\AKSWAYJ` |
| macOS | deletion of `AKSWAYJ.app` | `~/Library/Application Support/AKSWAYJ` |
| Linux | deletion of the AppImage file | `~/.config/AKSWAYJ` |

The Windows uninstaller does not delete application data (`deleteAppDataOnUninstall: false`): the settings file and any MIDI control overrides in `%APPDATA%\AKSWAYJ` survive uninstallation and are reused by a subsequent installation. The DFU driver package cache under `<userData>/audima/` persists for the same reason. Complete removal requires manual deletion of the directories listed above.

## Code-signing status

The distributed binaries are not Authenticode-signed, and the macOS build is neither signed nor notarized. Consequences:

- Windows SmartScreen shows an unknown-publisher warning the first time the installer runs; installation proceeds through "More info" → "Run anyway".
- macOS Gatekeeper refuses to open the application until an exception is granted in System Settings → Privacy & Security.

The signing hooks of electron-builder are the place to configure a certificate: the `win` and `mac` sections of [electron-builder.yml](../electron-builder.yml) currently contain no signing options.

## From-source installation

Installation from source requires Node.js 18 or later on `PATH`; npm ships with Node.js. The repository includes three bootstrap scripts that verify this requirement, install npm dependencies when needed, and launch the application:

| Platform | Entry point | Implementation |
|---|---|---|
| Windows | `Install & Launch AKSWAYJ.bat` (double-click) | [`scripts/install-launch.ps1`](../scripts/install-launch.ps1) |
| macOS | `Install & Launch AKSWAYJ.command` (double-click) | [`install-launch.sh`](../install-launch.sh) |
| Linux | `./install-launch.sh` from a terminal | same file |

All three follow the same three steps: (a) verify Node.js ≥ 18, (b) install dependencies when missing or stale, (c) launch with `npm run start`.

The staleness check in step (b) is identical on every platform: `npm install --no-audit --no-fund` runs when `node_modules` is absent, or when `package.json` carries a newer modification time than `node_modules`; otherwise the installed dependencies are reused.

### Windows bootstrap

`Install & Launch AKSWAYJ.bat` switches the console to UTF-8 (code page 65001), changes to the repository root, and runs `scripts/install-launch.ps1` under Windows PowerShell with `-NoProfile -ExecutionPolicy Bypass`. On a non-zero exit code the window pauses so the messages remain readable.

The PowerShell script itself requires no administrator rights. When Node.js is absent from `PATH` or older than major version 18:

- With winget available, the script runs `winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements`; the Node.js installer may raise a User Account Control prompt of its own. After installation the script rebuilds the session `PATH` from the Machine and User registry values, so the new `node.exe` is detected without opening a new terminal.
- When the winget installation succeeded but Node.js is still undetected in the current window, the script prints an instruction to close the window and run the launcher again, then exits with code 1.
- Without winget, or when the winget installation fails, the script opens `https://nodejs.org/en/download` in the default browser, prints manual instructions, and exits with code 1.

The script also verifies that `npm` reached `PATH` and that `package.json` exists in the repository root before installing dependencies.

### macOS and Linux bootstrap

`Install & Launch AKSWAYJ.command` changes to its own directory and executes `install-launch.sh`. When macOS refuses to run the file — for example after the repository arrives as a zip download — executable permission is restored from Terminal:

```sh
chmod +x "Install & Launch AKSWAYJ.command" install-launch.sh
```

`install-launch.sh` does not install Node.js itself. When Node.js is absent or older than 18, it prints installation hints matched to the detected system, opens the download page (`open` on macOS, `xdg-open` on Linux), and exits with code 1:

| Detected system | Hint printed |
|---|---|
| macOS (`uname -s` = `Darwin`) | `brew install node`; without Homebrew, the LTS installer from `https://nodejs.org/en/download` |
| `/etc/os-release` `ID`/`ID_LIKE` matches `debian`/`ubuntu` | `sudo apt-get update && sudo apt-get install -y nodejs npm`; NodeSource for the current LTS |
| `/etc/os-release` `ID`/`ID_LIKE` matches `fedora`/`rhel`/`centos` | `sudo dnf install -y nodejs npm` |
| other | both hints above in abbreviated form (the `apt-get` line without the preceding `apt-get update`), plus the download page |

### Manual installation

The bootstrap scripts are a convenience; the equivalent manual procedure is:

1. Install Node.js 18 or later.
2. Run `npm install` in the repository root.
3. Run `npm start`.

## First run

From source, `npm run start` first builds the renderer bundle (`scripts/build-renderer.js`), then launches Electron; packaged builds contain a prebuilt bundle and start directly. In both cases the application opens on the Doctor, the startup system check. Each check reports its result with a remediation action where one exists; when every check passes, the application advances to the project picker on its own after 1.4 seconds. The individual checks, their detection methods, and the fix actions are documented in [DOCTOR.md](DOCTOR.md).

A Sway, other MIDI hardware, and an audio input are optional at first run: the application substitutes mouse and keyboard control and an internal analysis signal when they are absent, so every scene renders output on a machine with no peripherals.
