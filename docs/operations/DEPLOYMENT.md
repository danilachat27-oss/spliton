# Deployment

## Target environments

| Env | Frontend | Backend | Database |
|-----|----------|---------|----------|
| Production | Vercel production | Hetzner prod | Supabase prod |
| Staging | Vercel preview | Hetzner staging | Supabase staging |

## Deploy checklist

1. `npx prisma migrate deploy` on target DB (no reset)  
2. `prisma generate` in CI (before `nest build`)  
3. Backend: env from [ENVIRONMENT.md](ENVIRONMENT.md)  
4. Frontend: `NEXT_PUBLIC_*` for API URLs and `ADMIN_DATA_SOURCE=live`  
5. Smoke: `/health`, `/admin/login`, `GET /api/admin/v1/access`  

## Prisma on deploy

- CI: generate does not need stopped server  
- Windows dev: see [PRISMA_WINDOWS_EPERM.md](PRISMA_WINDOWS_EPERM.md)  

## Related

- [TODO_PRODUCTION.md](TODO_PRODUCTION.md) — backlog  
- [Admin Live API Progress](../admin/ADMIN_LIVE_API_PROGRESS.md)
