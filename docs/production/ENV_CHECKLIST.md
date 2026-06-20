# Production ENV Checklist — Spliton

## Frontend (build-time)

```env
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_API_BASE_URL=https://api.spliton.com
NEXT_PUBLIC_WALLET_DATA_SOURCE=live
NEXT_PUBLIC_CATALOG_DATA_SOURCE=live
NEXT_PUBLIC_MARKET_OVERVIEW_DATA_SOURCE=live
NEXT_PUBLIC_RELEASE_ANALYTICS_DATA_SOURCE=live
NEXT_PUBLIC_PORTFOLIO_DATA_SOURCE=live
NEXT_PUBLIC_PAYOUTS_DATA_SOURCE=live
NEXT_PUBLIC_SERVICES_DATA_SOURCE=live
NEXT_PUBLIC_AUTH_DATA_SOURCE=live
NEXT_PUBLIC_SUPPORT_DATA_SOURCE=live
NEXT_PUBLIC_NEWS_DATA_SOURCE=live
NEXT_PUBLIC_STATUS_DATA_SOURCE=live
NEXT_PUBLIC_ADMIN_DATA_SOURCE=live
```

Build fails if any resolves to `mock` (`apps/frontend/lib/validate-public-env.ts`).

## Backend (runtime)

### Core
```env
NODE_ENV=production
DATABASE_URL=...
DIRECT_URL=...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
TWO_FACTOR_ENCRYPTION_KEY=...   # base64 32 bytes
FRONTEND_ORIGIN=https://spliton.com
AUTH_COOKIE_SECURE=true
AUTH_COOKIE_SAME_SITE=lax
```

### Email
```env
FEATURE_ENABLE_EMAIL_DELIVERY=true
EMAIL_PROVIDER=postmark   # or resend
EMAIL_FROM=notifications@spliton.com
POSTMARK_SERVER_TOKEN=...   # if postmark
POSTMARK_MESSAGE_STREAM=outbound
RESEND_API_KEY=...          # if resend
```

Boot guard (`production-boot-guard.ts`) fails if delivery enabled without provider credentials.

### TRON / deposits
```env
FEATURE_ENABLE_DEPOSITS=true
DEPOSIT_INGESTION_ENABLED=true
TRON_PROVIDER_MODE=tron
TRON_PROVIDER_URL=...
TRON_API_KEY=...
TRON_CONFIRMATIONS=20
ALLOW_DEV_DEPOSIT_ADDRESS=false
```

### Markets / features
```env
FEATURE_ENABLE_PRIMARY_MARKET=true
FEATURE_ENABLE_SECONDARY_MARKET=true
FEATURE_ENABLE_WITHDRAWALS=true
REPORT_STORAGE_MODE=supabase
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### Observability
```env
PRISMA_SLOW_QUERY_MS=500
ERROR_TRACKING_PROVIDER=sentry
SENTRY_DSN=...
LOG_LEVEL=log
HEALTH_DEEP_TOKEN=...
```

### Rate limits (20k multi-instance)
```env
RATE_LIMIT_STORAGE=redis
REDIS_URL=redis://...
RATE_LIMIT_MULTI_INSTANCE=true
RATE_LIMIT_REQUIRE_REDIS_IN_PRODUCTION=true
THROTTLE_TTL_SECONDS=60
THROTTLE_LIMIT=120
```

See [REDIS_RATE_LIMIT_SETUP.md](./REDIS_RATE_LIMIT_SETUP.md) and [SUPABASE_POOL_TUNING.md](./SUPABASE_POOL_TUNING.md).

### Kill switches (default false)
```env
KILL_SWITCH_DISABLE_WITHDRAWALS=false
KILL_SWITCH_DISABLE_DEPOSITS=false
KILL_SWITCH_DISABLE_DEPOSIT_CREDIT=false
KILL_SWITCH_DISABLE_PRIMARY_PURCHASES=false
KILL_SWITCH_DISABLE_SECONDARY_TRADING=false
FEATURE_MAINTENANCE_MODE=false
```

## Verify

```powershell
cd apps/backend
npm run build
$env:NODE_ENV="production"
# set required vars, then:
node -e "require('./dist/config/production-boot-guard').assertProductionBootSafe()"
```
