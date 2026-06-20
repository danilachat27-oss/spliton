# Supabase Pool Tuning — Spliton (20K OPS P0)

Runtime: DATABASE_URL pooler :6543. Migrations: DIRECT_URL :5432.

## Bottleneck

read30 showed market_overview 503 (pool checkout timeout). read10 OK.

## Fix (ops)

- connection_limit=5-10 per API instance in DATABASE_URL
- Do not run e2e + load on same pool
- PRISMA_SLOW_QUERY_MS=500
- market_overview cache TTL 60s (code)
