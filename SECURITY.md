# Security

## Injected-code guard (do not disable)

This repo was repeatedly targeted by an **obfuscated JavaScript backdoor** injected
into the `tailwind.config.js` files. The payload was a self-decoding blob hidden
after the closing `};`, padded far to the right with whitespace so it was invisible
in a normal editor. When the config was loaded by Tailwind/Vite it captured Node's
`require`/`module` into `global` and executed attacker code — and it rewrote itself
out of the working tree after running, to hide.

To prevent recurrence there are three layers, all driven by one scanner:

| Layer | File | What it does |
|-------|------|--------------|
| Scanner | [`scripts/scan-malicious-code.sh`](scripts/scan-malicious-code.sh) | Flags obfuscation signatures, `global[…] = require/module` capture, and over-long lines in config files. |
| Pre-commit hook | [`.githooks/pre-commit`](.githooks/pre-commit) | Runs the scanner on staged files and blocks the commit. Auto-installed via the root `package.json` `prepare` script (`git config core.hooksPath .githooks`). |
| CI gate | [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) | The `security-scan` job runs the scanner; the `deploy` job `needs:` it, so a poisoned tree can never deploy. |

Run it manually any time:

```bash
npm run scan:malware
```

**If the scanner flags something:** treat it as a live incident, not a false
positive. Have a human read every flagged line before doing anything else. Only
bypass (`git commit --no-verify`) after confirming the code is genuinely benign.

**If you ever confirm execution again:** assume the environment is compromised and
rotate all reachable secrets (`.env`, DB/Prisma creds, payment-provider keys, JWT
secrets, GitHub/CI/SSH deploy credentials).
