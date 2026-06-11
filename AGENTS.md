# AGENTS.md

## Cursor Cloud specific instructions

### Monorepo layout

**pnpm** workspaces monorepo with three packages (workspaces are defined in
`pnpm-workspace.yaml`; pnpm is pinned via the root `packageManager` field and
provisioned with Corepack — `corepack enable pnpm`):

| Directory | Workspace name (`pnpm --filter`) | Dev port |
|-----------|----------------------------------|----------|
| `props-capital-backend` | `props-capital-backend` | 5002 (from `PORT` secret) or 5101 locally |
| `props-capital-frontend` | `props-capital-frontend` | 5173 |
| `props-capital-frontend-admin` | `props-capital-admin` | 5175 |

**Gotcha:** the admin app folder is `props-capital-frontend-admin`, but the workspace name is `props-capital-admin` (see `package.json` `"name"`).

Install deps from the repo root with `pnpm install` (use `--frozen-lockfile` in
CI/deploys). `.npmrc` sets `node-linker=hoisted` (flat `node_modules`, like npm)
and `enable-pre-post-scripts=true` (so backend `prebuild` → `prisma generate`
runs). Dependency build scripts are blocked by default; the allowlist lives under
`allowBuilds:` in `pnpm-workspace.yaml`.

### PostgreSQL (required)

The backend needs a local Postgres instance. It is **not** in docker-compose.

```bash
sudo pg_ctlcluster 16 main start   # if not already running
pg_isready -h localhost -p 5432
```

First-time DB setup (once per VM):

```bash
sudo -u postgres psql -c "CREATE USER propcap WITH PASSWORD 'propcap_dev' CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE propcap OWNER propcap;"
```

### Environment variables

**Cursor Cloud:** backend/payment/email keys are injected as process env vars (see repo Secrets). Sync them into gitignored `.env` files before starting Nest/Vite — Prisma and Nest load `props-capital-backend/.env`; Vite reads per-package `.env`.

```bash
# Example: regenerate backend .env from injected secrets (run from repo root)
python3 -c "
import os
from pathlib import Path
keys = [k for k in os.environ if k.startswith(('DATABASE_', 'JWT_', 'OPENAI_', 'SENDGRID_', 'XOALA_', 'WORLDCARD_', 'MASSIVE_', 'APP_', 'EMAIL_', 'CHATBOT_', 'TWELVE_', 'PORT', 'NODE_ENV'))]
Path('props-capital-backend/.env').write_text('\\n'.join(f'{k}={os.environ[k]!r}' for k in sorted(keys)) + '\\n')
port = os.environ.get('PORT', '5002')
for p in ['props-capital-frontend/.env', 'props-capital-frontend-admin/.env']:
    Path(p).write_text(f'VITE_API_URL=http://localhost:{port}\\nVITE_WEBSOCKET_URL=http://localhost:{port}\\n')
"
```

**Local-only fallback** (no secrets): use local Postgres (`propcap` user/db) plus placeholder `OPENAI_API_KEY` and `PORT=5101`, with `VITE_API_URL=http://localhost:5101` on frontends.

`OPENAI_API_KEY` is required at runtime (`ChatbotService` uses `getOrThrow`). Injected `PORT` is typically `5002`, which matches the frontend dev default when `VITE_API_URL` is unset.

### Database schema and seeds

```bash
pnpm --filter props-capital-backend db:push
pnpm --filter props-capital-backend db:seed:admins
```

Seeded admin login: `admin1@prop-capitals.com` / `Admin1@12345`

### Running services

Start each in its own terminal/tmux session:

```bash
pnpm --filter props-capital-backend start:dev
pnpm --filter props-capital-frontend dev --host 0.0.0.0 --port 5173
pnpm --filter props-capital-admin dev --host 0.0.0.0
```

Quick health checks:

- Backend: `curl http://localhost:5002/challenges` → `[]` (or `:5101` if using local-only env)
- Trader UI: `http://localhost:5173/`
- Admin UI: `http://localhost:5175/SignIn`

### Lint and tests

```bash
pnpm --filter props-capital-backend lint    # many pre-existing ESLint issues
pnpm --filter props-capital-frontend lint
pnpm --filter props-capital-admin lint
pnpm --filter props-capital-backend test    # Jest; uuid ESM import failures are a known issue
```

## CI/CD and the malicious-code guard

GitHub Actions deploys to the server `45.32.154.10` (PM2). Vercel deploys the
frontends via its own Git integration.

| Workflow | Trigger | Deploys |
|----------|---------|---------|
| `.github/workflows/deploy.yml` | push to `master` | backend (`prop-Cs-prod-be`) + trader frontend (`prop-capitals-frontend`) under `/var/www/prop-capitals-prod/prop-capitals-com` |
| `.github/workflows/deploy-dev.yml` | push to `dev` | backend only (`Prop-Capitals-Dev-New`) under `/var/www/prop-capitals-dev`; dev frontend is on Vercel |

Required GitHub secrets: `SSH_HOST`, `SSH_USER`, `SSH_PRIVATE_KEY` (shared by both
workflows — same server). Lint/tests run as an **informational** job; they do not
gate the deploy (pre-existing failures). The admin panel is on Vercel and is not
deployed by Actions.

### Malicious-code guard (why the extra steps exist)

An obfuscated backdoor has repeatedly been **re-injected into the two
`tailwind.config.js` files at install time** (a compromised post-install). The
guard runs in three places:

1. **CI `security-scan` gate** — `scripts/scan-malicious-code.sh` over the fresh
   checkout. Blocks the deploy if the *committed* code carries a signature.
2. **On-server, after `pnpm install`, before build** — `scripts/strip-and-scan.sh`:
   restores the clean committed tailwind configs (removal), then re-scans and
   hard-fails (`set -e`) if anything remains.
3. **Vercel** — each frontend has a `vercel-build` script that runs
   `strip-and-scan.sh && pnpm run build`. Vercel runs `vercel-build` instead of
   `build`, so a detected payload short-circuits the build and **no deployment
   happens**. This requires the Vercel project's Build Command to stay default
   (or be set to `pnpm run vercel-build`).

`scan-malicious-code.sh` is detection-only (exit 1 on a hit); `strip-and-scan.sh`
does removal-then-detection. The scanner is also wired into a pre-commit hook
(`.githooks/`). If it flags a line, **a human must review before deploying** — do
not bypass it.

Note: `deploy-dev.yml` and the `vercel-build` scripts only take effect on the
branch that builds them — make sure they are present on `dev` (and the branch the
admin Vercel project builds from), not just `master`.
