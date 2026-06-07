# AGENTS.md

## Cursor Cloud specific instructions

### Monorepo layout

Yarn workspaces monorepo with three packages:

| Directory | Yarn workspace name | Dev port |
|-----------|---------------------|----------|
| `props-capital-backend` | `props-capital-backend` | 5101 |
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

### Environment files (gitignored — create locally)

**`props-capital-backend/.env`** (minimum to boot):

```
DATABASE_URL="postgresql://propcap:propcap_dev@localhost:5432/propcap?schema=public"
JWT_SECRET="<at-least-32-character-local-dev-secret>"
OPENAI_API_KEY="<any-non-empty-placeholder-for-local-boot>"
PORT=5101
EMAIL_ENABLED=false
```

`OPENAI_API_KEY` is required at runtime (`ChatbotService` uses `getOrThrow`), even though env validation only warns about it.

**Frontends** — set `VITE_API_URL=http://localhost:5101` in `.env` under each frontend package. Without this, both default to `http://localhost:5002`, which does not match the backend default port `5101`.

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

- Backend: `curl http://localhost:5101/challenges` → `[]`
- Trader UI: `http://localhost:5173/`
- Admin UI: `http://localhost:5175/SignIn`

### Lint and tests

```bash
yarn workspace props-capital-backend lint    # many pre-existing ESLint issues
yarn workspace props-capital-frontend lint
yarn workspace props-capital-admin lint
yarn workspace props-capital-backend test    # Jest; uuid ESM import failures are a known issue
```
