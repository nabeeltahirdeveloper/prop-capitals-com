#!/usr/bin/env bash
#
# scan-malicious-code.sh — detects obfuscated / injected malicious JavaScript.
#
# Background: an obfuscated backdoor was repeatedly injected into the
# tailwind.config.js files (a self-decoding payload that captured `require`
# and `module` into `global`, hidden after the closing `};` behind a wall of
# whitespace). This guard fails the build / blocks the commit if that class of
# payload reappears.
#
# Usage:
#   scripts/scan-malicious-code.sh              # scan all tracked source/config
#   scripts/scan-malicious-code.sh <files...>   # scan specific files (pre-commit)
#
# Exit codes: 0 = clean, 1 = something suspicious found.
#
# Compatible with bash 3.2 (macOS) and bash 5 (CI). No mapfile / arrays-of-args.

set -u

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT" || exit 2

SELF="scripts/scan-malicious-code.sh"

# Collect the file list: explicit args (pre-commit staged files) or all tracked code.
if [ "$#" -gt 0 ]; then
  FILE_LIST="$*"
else
  FILE_LIST="$(git ls-files '*.js' '*.jsx' '*.ts' '*.tsx' '*.mjs' '*.cjs')"
fi

# Fixed-string signatures of the known obfuscator payload.
SIG_FIXED="fromCharCode(127)
global['!']"

# Regex signatures: the require/module capture, obfuscator var naming.
SIG_REGEX='global\[[^]]{1,60}\][[:space:]]*=[[:space:]]*(require|module)\b|global\[_\$_|(^|[^A-Za-z0-9_])_\$_[A-Za-z0-9]|_0x[0-9a-f]{4,}'

status=0
OLDIFS="$IFS"
IFS='
'
for f in $FILE_LIST; do
  [ -f "$f" ] || continue
  case "$f" in
    node_modules/*|*/node_modules/*|dist/*|*/dist/*|*.min.js|"$SELF"|.githooks/*) continue ;;
  esac

  file_hit=0

  # 1. Fixed-string obfuscator signatures.
  for s in $SIG_FIXED; do
    if grep -nF -- "$s" "$f" >/dev/null 2>&1; then
      file_hit=1
      grep -nF -- "$s" "$f" | cut -c1-100 | sed "s#^#  $f: signature [$s] line #"
    fi
  done

  # 2. Regex obfuscation / backdoor patterns.
  if grep -nE -- "$SIG_REGEX" "$f" >/dev/null 2>&1; then
    file_hit=1
    grep -nE -- "$SIG_REGEX" "$f" | cut -c1-100 | sed "s#^#  $f: obfuscation-pattern line #"
  fi

  # 3. Config files must never contain very long lines — that is how the
  #    payload hid itself (legit config lines are short; source SVGs are not config).
  case "$f" in
    *.config.js|*.config.cjs|*.config.mjs|*.config.ts|*tailwind.config.*|*postcss.config.*|*vite.config.*)
      if awk 'length > 500 { print "  '"$f"': suspicious long line "NR" ("length" chars) — configs never need this"; found=1 } END { exit (found ? 0 : 1) }' "$f"; then
        file_hit=1
      fi
      ;;
  esac

  [ "$file_hit" -eq 1 ] && status=1
done
IFS="$OLDIFS"

echo ""
if [ "$status" -ne 0 ]; then
  echo "✖ Potential malicious / obfuscated code detected (see above)."
  echo "  This guard exists because a backdoor was repeatedly injected into config files."
  echo "  Do NOT commit/deploy until a human has reviewed every flagged line."
  exit 1
fi

echo "✓ scan-malicious-code: no obfuscation/backdoor signatures found."
exit 0
