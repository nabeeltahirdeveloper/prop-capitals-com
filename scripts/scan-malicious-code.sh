#!/usr/bin/env bash
#
# scan-malicious-code.sh — detects obfuscated / injected malicious JavaScript
# AND verifies the integrity of security-sensitive config files.
#
# Background: an obfuscated backdoor was repeatedly injected into the
# tailwind.config.js files (a self-decoding payload that captured `require`
# and `module` into `global`, hidden after the closing `};` behind a wall of
# whitespace). This guard fails the build / blocks the commit if:
#   (a) that class of payload reappears anywhere, OR
#   (b) a file listed in scripts/known-good-hashes.txt no longer matches its
#       known-good checksum — which catches a brand-new payload no signature knows.
#
# Usage:
#   scripts/scan-malicious-code.sh              # scan all tracked source/config + checksum gate
#   scripts/scan-malicious-code.sh <files...>   # scan specific files (pre-commit); checksum gate still runs
#
# Exit codes: 0 = clean, 1 = something suspicious found.
#
# Compatible with bash 3.2 (macOS) and bash 5 (CI). No mapfile / arrays-of-args.

set -u

ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
cd "$ROOT" || exit 2

SELF="scripts/scan-malicious-code.sh"
HASHES="scripts/known-good-hashes.txt"

status=0

# Portable sha256: prefer sha256sum (Linux/CI), fall back to shasum -a 256 (macOS).
sha256_of() {
  if command -v sha256sum >/dev/null 2>&1; then
    sha256sum "$1" 2>/dev/null | awk '{print $1}'
  else
    shasum -a 256 "$1" 2>/dev/null | awk '{print $1}'
  fi
}

# ── Integrity gate: security-sensitive files must match known-good hashes ──
# Strongest defense: catches ANY change to these files, not just known signatures.
# If a change is legitimate, re-bless the hash in scripts/known-good-hashes.txt.
if [ -f "$HASHES" ]; then
  OLDIFS="$IFS"
  IFS='
'
  for line in $(cat "$HASHES"); do
    case "$line" in ''|\#*) continue ;; esac
    want="${line%% *}"          # first field = hash
    file="${line##* }"          # last field  = path
    [ -n "$want" ] && [ -n "$file" ] || continue
    if [ ! -f "$file" ]; then
      echo "  $file: MISSING — a known-good file is expected here"
      status=1
      continue
    fi
    got="$(sha256_of "$file")"
    if [ "$got" != "$want" ]; then
      echo "  $file: INTEGRITY MISMATCH (contents changed)"
      echo "      expected $want"
      echo "      actual   $got"
      echo "      → if this change is legitimate: shasum -a 256 \"$file\"  and update $HASHES"
      status=1
    fi
  done
  IFS="$OLDIFS"
fi

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

# Patterns that are NEVER legitimate inside a tailwind/postcss config file
# (kept off vite.config, which developers sometimes extend with real tooling).
CONFIG_BAD_REGEX='\beval\(|\bnew[[:space:]]+Function\(|child_process|execSync|\batob\(|Buffer\.from\([^)]*base64'

# NOTE: $status carries over from the integrity gate above — do not reset it here.
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

  # 3. Config files: never very long lines (that is how the payload hid itself).
  case "$f" in
    *.config.js|*.config.cjs|*.config.mjs|*.config.ts|*tailwind.config.*|*postcss.config.*|*vite.config.*)
      if awk 'length > 500 { print "  '"$f"': suspicious long line "NR" ("length" chars) — configs never need this"; found=1 } END { exit (found ? 0 : 1) }' "$f"; then
        file_hit=1
      fi
      ;;
  esac

  # 4. tailwind/postcss configs: extra forbidden patterns (eval, child_process, base64…).
  case "$f" in
    *tailwind.config.*|*postcss.config.*)
      if grep -nE -- "$CONFIG_BAD_REGEX" "$f" >/dev/null 2>&1; then
        file_hit=1
        grep -nE -- "$CONFIG_BAD_REGEX" "$f" | cut -c1-100 | sed "s#^#  $f: forbidden-in-config line #"
      fi
      ;;
  esac

  [ "$file_hit" -eq 1 ] && status=1
done
IFS="$OLDIFS"

echo ""
if [ "$status" -ne 0 ]; then
  echo "✖ Potential malicious code / tampering detected (see above)."
  echo "  This guard exists because a backdoor was repeatedly injected into config files."
  echo "  Do NOT commit/deploy until a human has reviewed every flagged line."
  exit 1
fi

echo "✓ scan-malicious-code: signatures clean + config integrity verified."
exit 0
