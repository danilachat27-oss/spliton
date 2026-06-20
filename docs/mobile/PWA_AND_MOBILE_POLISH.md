# PWA and mobile polish (Spliton)

## PWA foundation

- `apps/frontend/public/manifest.json` — name **Spliton**, theme color, icons
- Layout metadata в Next.js app

## Mobile checklist

- Catalog, buy flow, secondary market, wallet, documents, notifications — responsive layouts
- Language selector доступен в profile settings

## Offline

Минимальный offline fallback — не кэшировать finance endpoints в service worker (не включён агрессивный SW).

## Smoke

```powershell
npm run ci:frontend
# Playwright mobile viewport — P1 when E2E DB ready
```

## Ограничения

Полноценный installable PWA с offline wallet — **не** реализован (безопасность > convenience).
