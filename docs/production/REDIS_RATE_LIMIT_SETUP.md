# Redis Rate Limit Setup — Spliton (20K OPS P0)

See ENV_CHECKLIST.md for env vars. Implementation: apps/backend/src/common/throttle/redis-throttler.storage.ts

## Required for 20K

- RATE_LIMIT_STORAGE=redis
- REDIS_URL=...
- RATE_LIMIT_MULTI_INSTANCE=true
- RATE_LIMIT_REQUIRE_REDIS_IN_PRODUCTION=true (boot guard hard fail)

## Railway

Add Redis plugin, wire REDIS_URL to backend, redeploy. Logs: [throttle] storage=redis

## Per-route limits

Auth 5/min, withdraw 5/min, buy 20/min, support 5/min. Global THROTTLE_LIMIT=120/min.
