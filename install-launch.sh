#!/usr/bin/env bash
# install-launch.sh - SwayCommand from-source bootstrap (macOS / Linux)
#
# Checks for Node.js >= 18, installs npm dependencies when needed, then
# launches the app with 'npm run start'.
#
# Run from a terminal:   ./install-launch.sh
# macOS double-click:    "Install & Launch SwayCommand.command"
set -euo pipefail

MIN_NODE_MAJOR=18
NODE_DOWNLOAD_URL="https://nodejs.org/en/download"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

ok()   { printf '[OK]   %s\n' "$*"; }
fix()  { printf '[FIX]  %s\n' "$*"; }
fail() { printf '[FAIL] %s\n' "$*" >&2; }

open_url() {
  if command -v open >/dev/null 2>&1; then
    open "$1" >/dev/null 2>&1 || true
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$1" >/dev/null 2>&1 || true
  fi
}

node_major() {
  node --version 2>/dev/null | sed -e 's/^v//' -e 's/\..*$//'
}

print_install_hints() {
  echo
  echo "Install Node.js ${MIN_NODE_MAJOR}+ and then run this script again:"
  local os id="" id_like=""
  os="$(uname -s)"
  if [ "$os" = "Darwin" ]; then
    echo "  macOS:  brew install node"
    echo "          (no Homebrew? Use the LTS installer: ${NODE_DOWNLOAD_URL})"
  else
    if [ -r /etc/os-release ]; then
      id="$(. /etc/os-release; echo "${ID:-}")"
      id_like="$(. /etc/os-release; echo "${ID_LIKE:-}")"
    fi
    case " $id $id_like " in
      *debian*|*ubuntu*)
        echo "  Debian/Ubuntu:  sudo apt-get update && sudo apt-get install -y nodejs npm"
        echo "                  (for the current LTS use NodeSource: https://github.com/nodesource/distributions)"
        ;;
      *fedora*|*rhel*|*centos*)
        echo "  Fedora:  sudo dnf install -y nodejs npm"
        ;;
      *)
        echo "  Debian/Ubuntu:  sudo apt-get install -y nodejs npm   (or NodeSource for the current LTS)"
        echo "  Fedora:         sudo dnf install -y nodejs npm"
        echo "  Other:          ${NODE_DOWNLOAD_URL}"
        ;;
    esac
  fi
  echo
  echo "Download page: ${NODE_DOWNLOAD_URL}"
  echo
}

echo
echo "SwayCommand - Install & Launch"
echo "Folder: $SCRIPT_DIR"
echo

# --- Step (a): Node.js >= 18 on PATH ---
major=""
if command -v node >/dev/null 2>&1; then
  major="$(node_major || true)"
fi

if [ -n "$major" ] && [ "$major" -ge "$MIN_NODE_MAJOR" ] 2>/dev/null; then
  ok "Node.js $(node --version) found (need >= ${MIN_NODE_MAJOR})."
else
  if [ -z "$major" ]; then
    fail "Node.js was not found on PATH."
  else
    fail "Node.js v${major} is too old (need >= ${MIN_NODE_MAJOR})."
  fi
  print_install_hints
  open_url "$NODE_DOWNLOAD_URL"
  exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
  fail "npm was not found on PATH even though Node.js is present."
  print_install_hints
  exit 1
fi

# --- Step (b): install dependencies when missing or stale ---
if [ ! -f package.json ]; then
  fail "package.json was not found in $SCRIPT_DIR - is this a complete copy of the repo?"
  exit 1
fi

need_install=0
if [ ! -d node_modules ]; then
  need_install=1
  fix "node_modules is missing - installing dependencies (first run may take a few minutes)..."
elif [ package.json -nt node_modules ]; then
  need_install=1
  fix "package.json is newer than node_modules - refreshing dependencies..."
else
  ok "Dependencies are already installed."
fi

if [ "$need_install" -eq 1 ]; then
  if ! npm install --no-audit --no-fund; then
    fail "npm install failed. See the output above for details."
    exit 1
  fi
  ok "Dependencies installed."
fi

# --- Step (c): launch ---
ok "Starting SwayCommand (npm run start)..."
exec npm run start
