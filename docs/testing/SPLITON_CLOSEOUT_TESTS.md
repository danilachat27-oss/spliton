# Spliton closeout — targeted tests

## Backend unit

```bash
cd apps/backend
npm test -- --testPathPattern=report-renderer.service.spec
npm test -- --testPathPattern=csv.util.spec
```

Проверяют: бренд Spliton в PDF, reference/status в квитанции, структуру XLSX (zip signature).

## Backend e2e (при доступной TEST_DATABASE_URL)

```bash
npm run test:e2e -- --testPathPattern=documents
npm run test:e2e -- --testPathPattern=market-charts
```

## Frontend

```bash
cd apps/frontend
npm run build
npm run lint
```

Публичный бренд: в `apps/frontend` не должно остаться `RevShare` в `.ts`/`.tsx` (исключение — deprecated alias `RevShareLogo` в `revshare-logo.tsx`).

```bash
rg "RevShare" apps/frontend --glob "*.{ts,tsx}"
```

## Production guards

- `NODE_ENV=production` + mock Tron/deposit provider → boot fail (Joi).
- `NEXT_PUBLIC_*_DATA_SOURCE=live` на production build.
