# Dev performance (Next.js / Turbopack)

Recommendations for fast first-route compile in apps/frontend.

## Scripts (apps/frontend)

- `pnpm dev` — Turbopack (port 3000)
- `pnpm dev:webpack` — Webpack fallback
- `pnpm dev:trace` — NEXT_TURBOPACK_TRACING=1
- `pnpm dev:reset` — clear `.next` and `node_modules/.cache`

## Root scripts

- `npm run dev` — backend + frontend Turbopack
- `npm run dev:webpack` — backend + frontend Webpack
- `npm run dev:trace` — backend + frontend trace
- `npm run dev:reset` — frontend cache reset

## Windows

- Avoid OneDrive/synced folders
- Exclude project from Windows Defender scans
- Avoid Docker bind mounts for frontend dev on Windows
- Use `pnpm dev:reset` when cache sticks

## Trace

```bash
cd apps/frontend
pnpm dev:trace
# reproduce slow route, stop dev
npx next internal trace .next/dev/trace-turbopack
```
