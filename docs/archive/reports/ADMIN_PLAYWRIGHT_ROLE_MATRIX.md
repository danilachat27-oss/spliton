# Playwright role matrix (plan)

Playwright **не установлен** в `apps/frontend/package.json` на момент этапа.

## Рекомендуемый setup

```bash
cd apps/frontend
pnpm add -D @playwright/test
npx playwright install chromium
```

## Сценарии (приоритет)

1. Guest → `/admin` → redirect `/admin/login`
2. USER → `/admin` → access denied
3. SUPER_ADMIN → sidebar groups visible
4. BUSINESS_ANALYST → analytics visible, no settings mutation
5. ACCOUNTANT → finance visible, no track create button

## Manual QA checklist (interim)

- [ ] BUSINESS_ANALYST: analytics tabs, no approve on withdrawals
- [ ] SUPER_ADMIN assign: super admin phrase required
- [ ] Export creates queued job → completed → CSV download
- [ ] Track drawer save persists (live mode)
- [ ] Roles page shows live user counts
