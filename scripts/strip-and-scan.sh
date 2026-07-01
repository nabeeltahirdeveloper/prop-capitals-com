#!/usr/bin/env bash
#
# strip-and-scan.sh — removes a re-injected backdoor from the tailwind configs
# (only when one is actually detected), then runs the full scan.
#
# The obfuscated backdoor has historically been re-injected into the two
# tailwind.config.js files at install time. This script runs AFTER install and
# BEFORE build, and also as the root `postinstall` (so every `pnpm install`
# on any machine self-heals + hard-fails on a new payload):
#
#   1. Removal  — for each tailwind config, ONLY if it currently carries a
#                 payload signature, restore the clean committed version
#                 (git checkout). Clean files — including legitimate uncommitted
#                 edits — are left untouched.
#   2. Detection — run scan-malicious-code.sh, which exits non-zero if any
#                 signature remains OR an integrity checksum fails.
#
# Safe to run from any directory inside the repo.

set -u

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT" || exit 2

CONFIGS="props-capital-frontend/tailwind.config.js
props-capital-frontend-admin/tailwind.config.js"

# A file is "infected" if it has an over-long line (the whitespace-hidden trick)
# or matches a known obfuscator signature.
PAYLOAD_SIG='fromCharCode\(127\)|global\[|_0x[0-9a-f]{4,}|_\$_'

OLDIFS="$IFS"
IFS='
'
for f in $CONFIGS; do
  [ -f "$f" ] || continue
  infected=0
  if awk 'length > 500 { exit 0 } END { exit 1 }' "$f"; then infected=1; fi
  if grep -qE -- "$PAYLOAD_SIG" "$f" 2>/dev/null; then infected=1; fi
  if [ "$infected" -eq 1 ]; then
    if git checkout -- "$f" 2>/dev/null; then
      echo "strip-and-scan: removed re-injected payload from $f (restored committed version)"
    else
      echo "strip-and-scan: WARNING — payload in $f but could not git-restore it"
    fi
  fi
done
IFS="$OLDIFS"

# 2. Detection: hard-fail (exit 1) if anything suspicious remains.
exec bash "$ROOT/scripts/scan-malicious-code.sh"
