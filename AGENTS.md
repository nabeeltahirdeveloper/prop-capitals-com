# AGENTS.md

## Cursor Cloud specific instructions

### Monorepo layout

Yarn workspaces monorepo with three packages:

| Directory | Yarn workspace name | Dev port |
|-----------|---------------------|----------|
| `props-capital-backend` | `props-capital-backend` | 5002 (from `PORT` secret) or 5101 locally |
| `props-capital-frontend` | `props-capital-frontend` | 5173 |
| `props-capital-frontend-admin` | `props-capital-admin` | 5175 |

**Gotcha:** the admin app folder is `props-capital-frontend-admin`, but the workspace name is `props-capital-admin` (see `package.json` `"name"`).

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
yarn workspace props-capital-backend db:push
yarn workspace props-capital-backend db:seed:admins
```

Seeded admin login: `admin1@prop-capitals.com` / `Admin1@12345`

### Running services

Start each in its own terminal/tmux session:

```bash
yarn workspace props-capital-backend start:dev
yarn workspace props-capital-frontend dev --host 0.0.0.0 --port 5173
yarn workspace props-capital-admin dev --host 0.0.0.0
```

Quick health checks:

- Backend: `curl http://localhost:5002/challenges` → `[]` (or `:5101` if using local-only env)
- Trader UI: `http://localhost:5173/`
- Admin UI: `http://localhost:5175/SignIn`

### Lint and tests

```bash
yarn workspace props-capital-backend lint    # many pre-existing ESLint issues
yarn workspace props-capital-frontend lint
yarn workspace props-capital-admin lint
yarn workspace props-capital-backend test    # Jest; uuid ESM import failures are a known issue
```
