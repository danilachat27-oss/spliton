# Dev process management

How to run RevShare locally without duplicate Node processes, runaway CPU, or killing the wrong ports.

## Expected processes (normal dev)

| Mode | Command | What should run | Ports |
|------|---------|-----------------|-------|
| Full stack | `npm run dev` (root) | 1× `concurrently` + 1× Nest (watch) + 1× Next dev | 4000 API, 3000 UI |
| Backend only | `npm run backend:dev` | 1× `nest-dev-restart` wrapper + 1× Nest webpack watch child | `PORT` (default **4000**) |
| Frontend only | `npm run frontend:dev` | 1× `next dev` | **3000** |
| Report worker | `npm run worker:dev` | Same as backend, with `REPORT_WORKER_ENABLED=true` | 4000 |

Optional: PostgreSQL (Supabase local or remote) on **5432** — not started by npm scripts.

### What you should **not** see by default

- Second `next dev` on 3000
- Second Nest on 4000
- `jest --watch` unless you ran it explicitly
- Report worker interval polling when `REPORT_WORKER_ENABLED` is not `true`
- `@nestjs/schedule` cron (removed; worker uses a single guarded `setInterval`)

Extra Node processes from **Cursor**, other terminals, or a crashed restart loop are the usual cause of high CPU.

---

## Script audit

| Script | Package | Starts | Port | Watch | Notes |
|--------|---------|--------|------|-------|-------|
| `dev` | root | `concurrently` → `backend:dev` + `frontend:dev` | 4000 + 3000 | yes | One of each app; `-k` stops all on Ctrl+C |
| `backend:dev` | root → backend | `nest-dev-restart.cjs` → `nest start --watch` | `PORT` / 4000 | yes | +1 wrapper process for crash retry |
| `frontend:dev` | root → frontend | `free-dev-ports` **3000 only** → `next dev -p 3000` | 3000 | yes | Does **not** kill 4000/backend |
| `worker:dev` | root → backend | `start:dev:worker` (env `REPORT_WORKER_ENABLED=true`) | 4000 | yes | Background report polling every 15s |
| `dev:clean` | root | Frees ports 3000, 4000 | — | — | Run before a clean start |
| `ports:check` | root | Prints listeners on 3000, 4000, 5432 | — | — | Diagnostics only |
| `prisma:generate` | root | Prisma generate (+ port warning) | — | — | Stop backend first on Windows (EPERM) |
| `start:dev:plain` | backend | `nest start --watch` (no restart wrapper) | 4000 | yes | Fewer processes if you don't need auto-retry |
| `test:watch` | backend | Jest watch | — | yes | **Do not** leave running during `npm run dev` |
| `test:e2e` | backend | Jest e2e once | — | no | Sets `REPORT_WORKER_ENABLED=false` in helper |

Root scripts do **not** call `dev` recursively. `backend:dev` and `frontend:dev` are separate entry points.

---

## Ports

| Service | Default port | Env |
|---------|--------------|-----|
| Next.js | 3000 | `-p 3000` in `apps/frontend` `dev` script |
| Nest API | 4000 | `PORT` in `.env` (see `apps/backend/src/config/app.config.ts`) |
| Postgres | 5432 | `DATABASE_URL` / Supabase |

Frontend API URL: `NEXT_PUBLIC_API_BASE_URL` (example uses `http://localhost:3001` in comments — align with your real `PORT`, often **4000**).

---

## Report worker (backend)

- **Development default:** `REPORT_WORKER_ENABLED` defaults to **false** (`NODE_ENV=development`).
- **Enable explicitly:** `REPORT_WORKER_ENABLED=true` or `npm run worker:dev`.
- **Polling:** only when enabled; default interval **15s** (`REPORT_WORKER_POLL_MS`, min 5000).
- **Shutdown:** interval cleared in `onModuleDestroy`.
- **Without worker:** report jobs are processed inline on generate/retry (fine for local dev).

---

## Frontend polling (audit summary)

| Area | Polling | Notes |
|------|---------|-------|
| `/admin/reports` | 5s interval | **Only** when jobs are queued/processing |
| `/admin` dashboard | On mount / period change | Cached via `admin-data-cache` |
| `/admin/analytics/*` | On mount / period change | No `refetchInterval` |
| `/admin/platform-revenue` | On mount | Single load per visit |
| `/dashboard/profile` | Wallet summary once | When live wallet enabled |
| `/dashboard/secondary-market` | On tab/mode change | No global interval |

No TanStack Query in this repo; no refetch-on-focus for admin analytics.

---

## Next.js dev

- Single `next dev` per machine on port 3000.
- `turbopack.root` = `apps/frontend` so the monorepo `docs/` tree is **not** treated as app routes.
- `reactCompiler: true` increases compile work in dev — expected.

---

## Nest watch / CPU

Webpack watch ignores (see `apps/backend/webpack.config.js`):

- `node_modules`, `dist`, `.next`, `storage`, `docs`, `coverage`, `prisma`, `*.md`

`nest-dev-restart.cjs` retries after crash (max **12** by default). If the DB is down, stop the loop and fix `.env` instead of letting it spin.

Use `npm run backend:dev` with `start:dev:plain` equivalent: `npm --prefix apps/backend run start:dev:plain` for one fewer wrapper process.

---

## Windows diagnostics

Check who listens on a port:

```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :4000
netstat -ano | findstr :5432
```

Or from repo root:

```powershell
npm run ports:check
```

Stop a **specific** process (replace `<PID>` from the last column of `netstat`):

```powershell
taskkill /PID <PID> /F
```

Free dev ports before restart:

```powershell
npm run dev:clean
npm run dev
```

### Do **not** use as default cleanup

```powershell
taskkill /F /IM node.exe
```

That terminates **all** Node processes, including **Cursor** and other tools.

---

## Prisma generate / EPERM (Windows)

Nest holds `query_engine-windows.dll.node` while running.

1. Stop backend (`Ctrl+C` in the terminal running `backend:dev`).
2. `npm run ports:check` — confirm nothing on 4000 (or your `PORT`).
3. `npm run prisma:generate`

See [PRISMA_WINDOWS_EPERM.md](./PRISMA_WINDOWS_EPERM.md).

---

## Recommended workflow

```powershell
# 1. Clean ports (optional)
npm run dev:clean

# 2. Full stack
npm run dev

# 3. Worker only when testing report queues
npm run worker:dev
```

If CPU stays high: run `npm run ports:check`, close extra terminals, stop `test:watch`, and ensure only one `npm run dev` is active.
