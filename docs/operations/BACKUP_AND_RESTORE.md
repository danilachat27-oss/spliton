# Backup & restore readiness

## Database (Supabase)

- Enable PITR / daily backups before production
- Document `DATABASE_URL` (pooler) vs `DIRECT_URL` (migrations)
- **Never** `prisma migrate reset` on production

## Restore drill (staging quarterly)

1. Restore snapshot to isolated project
2. Run `prisma migrate deploy`
3. Run `npm run db:constraint-prechecks`
4. Smoke: login, wallet read, catalog list

## Storage

- Backup buckets: `reports`, `user-documents`, `support-attachments`
- Reports in DB mode: export `report_jobs` metadata + file blobs

## Failed migration

1. Stop API workers
2. Assess forward-fix migration
3. Do not delete financial tables

See also [PRODUCTION_DEPLOYMENT_CHECKLIST.md](./PRODUCTION_DEPLOYMENT_CHECKLIST.md).
