#!/usr/bin/env bash
# AKSWAYJ - macOS double-click launcher.
# Delegates to install-launch.sh in the same folder.
#
# If macOS refuses to run this file (e.g. after downloading as a zip),
# make it executable first from Terminal:
#   chmod +x "Install & Launch AKSWAYJ.command" install-launch.sh
cd "$(dirname "$0")"
exec bash ./install-launch.sh
