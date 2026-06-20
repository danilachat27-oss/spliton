# Prisma Migration Report

**Date:** 2026-05-30  
**Environment:** Windows, PostgreSQL (Supabase)

## Commands executed

| Command | Result |
|---------|--------|
| `npm run prisma:check-backend` | OK (port 3001 free) |
| `npm run prisma:generate` | OK — Prisma Client v6.19.3, no EPERM |
| `npm run prisma:migrate:deploy` | OK after migration fix (see below) |
| `npm run prisma:seed` | OK |

## Migration fix applied

Initial migration `20260530120000_staff_roles_super_admin` failed with:

```
ERROR: unsafe use of new value "SUPER_ADMIN" of enum type user_role_code
HINT: New enum values must be committed before they can be used.
```

**Cause:** PostgreSQL cannot use new enum values in DML in the same transaction as `ALTER TYPE ... ADD VALUE`.

**Fix:** Split into two migrations:

1. `20260530120000_staff_roles_super_admin` — enum extension only  
2. `20260530120001_staff_roles_data` — role rows + SUPER_ADMIN grant  

Resolved failed state with:

```powershell
npx prisma migrate resolve --rolled-back "20260530120000_staff_roles_super_admin"
npx prisma migrate deploy
```

## Roles in database (after seed)

`INVESTOR`, `ARTIST`, `ADMIN`, `SUPPORT`, `SUPER_ADMIN`, `ACCOUNTANT`, `CONTENT_MANAGER`, `SUPPORT_MANAGER`, `COMPLIANCE`, `USER`

## Super Admin assignment

| Email | Role | Status |
|-------|------|--------|
| `danila.chat27@gmail.com` | `SUPER_ADMIN` | **Granted** (user exists in DB) |

Seed output: `Granted SUPER_ADMIN to danila.chat27@gmail.com (idempotent).`

## Manual steps if needed

If `danila.chat27@gmail.com` is **not** registered yet:

1. Register via normal `/register`
2. Run: `npm run prisma:seed`

## Errors

- First `migrate deploy` attempt: failed (enum transaction) — **fixed**
- Subsequent runs: **no errors**

## Next steps

- Start backend: `npm run backend:dev`
- Open operator portal: `/admin/login`
- Sign in with `danila.chat27@gmail.com`
