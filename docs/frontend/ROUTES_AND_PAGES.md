# Маршруты и страницы (пользователь)

См. также [USER_NAVIGATION_MAP.md](./USER_NAVIGATION_MAP.md).

Константы: `apps/frontend/constants/routes.ts`.

Публичные страницы: `/`, `/catalog`, `/fees`, `/system-status`, `/news`, `/login`, `/register`, `/terms`, `/privacy`.

Кабинет (header Spliton): префиксы `/app`, `/assets/*`, `/dashboard/*`, `/catalog/*`, `/analytics/*`.

Проверка маршрутов: `npx vitest run constants/routes.navigation.spec.ts` в `apps/frontend`.
