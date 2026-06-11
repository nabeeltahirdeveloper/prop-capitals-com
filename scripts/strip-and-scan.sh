#!/usr/bin/env bash
#
# strip-and-scan.sh — removes the known re-injected backdoor, then scans.
#
# The obfuscated backdoor has historically been re-injected into the two
# tailwind.config.js files at `npm i` time (a compromised dependency's
# post-install step). This script, meant to run AFTER install and BEFORE build:
#
#   1. Removal  — restores the clean committed tailwind configs, undoing any
#                 payload re-introduced after checkout/install.
#   2. Detection — runs scan-malicious-code.sh, which exits non-zero if any
#                 signature remains anywhere, failing the build/deploy before
#                 we ship.
#
# Used by the server deploy steps (prod + dev) and by Vercel (the frontend
# "vercel-build" script). Safe to run from any directory inside the repo.

set -u

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT" || exit 2

# 1. Removal: restore the clean committed configs, undoing any re-injection.
git checkout -- \
  props-capital-frontend/tailwind.config.js \
  props-capital-frontend-admin/tailwind.config.js 2>/dev/null || true

# 2. Detection: hard-fail (exit 1) if anything suspicious remains.
exec bash "$ROOT/scripts/scan-malicious-code.sh"
