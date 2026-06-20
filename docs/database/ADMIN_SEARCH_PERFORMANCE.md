# Admin Search Performance

**Endpoint:** `GET /api/admin/v1/search?q=`  
**Implementation:** `AdminSearchService` — Prisma `contains` + `mode: 'insensitive'` (ILIKE).

## Current guards

| Guard | Value |
|-------|-------|
| Min query length | 2 characters |
| Per group limit | 5 items |
| Role filtering | `allowedGroups(roles)` |

## Indexes (existing)

| Table | Index | Helps |
|-------|-------|-------|
| `users` | `email` UNIQUE | Exact email |
| `users` | `created_at` | Lists |
| `withdrawals` | status + requested_at | ID prefix scans still seq |
| `deposits` | status + created_at | Same |
| `releases` | status + created_at | Title search partial |

## `pg_trgm` status (2026-05-31)

```sql
SELECT * FROM pg_extension WHERE extname = 'pg_trgm';
-- 0 rows — not enabled on dev Supabase
```

**Decision:** Do **not** enable in migration yet. ILIKE acceptable at current data volume.

## Future plan (when search > 300ms p95)

1. Enable extension (manual or migration without CONCURRENTLY in txn):

   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   ```

2. GIN indexes (run **outside** Prisma txn if using CONCURRENTLY):

   ```sql
   CREATE INDEX CONCURRENTLY users_email_trgm_idx
     ON users USING gin (email gin_trgm_ops);
   ```

3. Frontend: debounce 300ms, disable below 2 chars (already)  
4. Backend: max 32 char query, reject `%`-only patterns  
5. Optional: dedicated `search_vector` tsvector for audit log  

## Prisma migration note

`CREATE INDEX CONCURRENTLY` **cannot** run inside Prisma's default migration transaction. Options:

- Supabase SQL editor manual run  
- Custom migration with `prisma migrate` + `--create-only` and edited SQL  

## Full-text search

Defer until cross-entity ranking required. Prefer domain-specific endpoints over one mega-index.
