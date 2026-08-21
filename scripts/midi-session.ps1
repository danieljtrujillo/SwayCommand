# One hardware monitor session with the Sway connected. Resolves the three
# open hardware questions in HANDOFF.md section 4 in a single run: the
# physical pad order behind PAD_CELLS, the eight buttons' CC numbers, and the
# knob-press CCs. Runs the development app (npm start) with
# scripts/midi-session-probe.js as the SWAYCOMMAND_PROBE, captures MIDI for
# -Seconds, prints one JSON report as `[probe] ...`, then the app quits by
# itself.
#
#   powershell -ExecutionPolicy Bypass -File scripts/midi-session.ps1 [-Seconds 120]
#
# Read the report with HANDOFF.md section 4 open: padStrikeOrder.pad must read
# 0..15 if PAD_CELLS is right; unmappedCCs are the button / knob-press
# candidates.
#
# This file is deliberately ASCII-only: Windows PowerShell 5.1 reads a .ps1
# without a BOM as ANSI, and a stray em dash decodes into a smart quote that
# breaks the parse. The probe file is UTF-8 (its regexes carry the monitor's
# arrows), so it is read with -Encoding UTF8 explicitly.
param([int]$Seconds = 120)
$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')

# Standing traps (HANDOFF.md section 6): Electron-as-Node, leaked scene/autoplay vars.
Remove-Item Env:ELECTRON_RUN_AS_NODE -ErrorAction SilentlyContinue
Remove-Item Env:SWAYCOMMAND_SCENE -ErrorAction SilentlyContinue

$probe = Get-Content -Raw -Encoding UTF8 (Join-Path $PSScriptRoot 'midi-session-probe.js')
$env:SWAYCOMMAND_AUTOPLAY = 'first-flight'
$env:SWAYCOMMAND_PROBE = "window.__midiSessionMs = $($Seconds * 1000); " + $probe
$env:SWAYCOMMAND_SHOT = Join-Path $env:TEMP 'swaycommand-midi-session.png'
# The probe fires 3 s after load and runs $Seconds; the shot must land after
# the probe has printed, or the app quits mid-capture and prints nothing.
$env:SWAYCOMMAND_SHOT_DELAY = [string](($Seconds + 8) * 1000)

Write-Host ''
Write-Host "SwayCommand hardware monitor session: $Seconds s of capture, starting ~3 s after the window loads."
Write-Host 'Keep the Sway connected and awake. Do these in order, with a short pause between steps:'
Write-Host ''
Write-Host '  1. PADS - strike each pad once, in the order the deck numbers them (0-15):'
Write-Host '       left cluster, top row, left to right      (pads 0-3)'
Write-Host '       right cluster, top row, left to right     (pads 4-7)'
Write-Host '       left cluster, bottom row, left to right   (pads 8-11)'
Write-Host '       right cluster, bottom row, left to right  (pads 12-15)'
Write-Host '  2. BUTTONS - press and release the eight mappable buttons: left cluster then right, top row then bottom.'
Write-Host '  3. KNOB PRESSES - click (press, do not turn) knobs 1 to 8, left to right.'
Write-Host '  4. Optionally turn knob 1 a little, so mappedCCs confirms the rotation map.'
Write-Host ''
Write-Host 'The report prints as [probe] { ... } when the capture ends; the window closes on its own a few seconds later.'
Write-Host ''

npm start
