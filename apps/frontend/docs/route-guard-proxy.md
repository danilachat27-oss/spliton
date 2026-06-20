# Spliton route guard (proxy)

## Next.js 16

Проект на **Next.js 16.2.4**. Файл `middleware.ts` переименован в **`proxy.ts`** (официальная рекомендация с v16).

- Экспорт: `export function proxy(request: NextRequest)`
- Логика вынесена в `lib/auth/route-protection.ts` для unit-тестов.

## Что защищает

Session-hint cookie `spliton_session=1` (не JWT):

- `/assets/*`
- `/dashboard/profile`
- `/dashboard/support`
- `/dashboard/notifications`
- `/dashboard/secondary-market`

Без cookie → redirect `/login?next=...`

## Ограничения

- Refresh-token на API-хосте (`spliton_refresh_token`, httpOnly, path `/auth`) proxy не читает.
- **Backend JWT** — единственный источник истины для денег и персональных данных.

## Миграция

При апгрейде Next.js следовать [middleware-to-proxy](https://nextjs.org/docs/messages/middleware-to-proxy).
