# Admin Role Workspaces

**Updated:** 2026-05-30

Роли staff: `SUPER_ADMIN`, `ACCOUNTANT`, `CONTENT_MANAGER`, `SUPPORT_MANAGER`, `COMPLIANCE`. Обычный `USER` / `INVESTOR` не имеет доступа в portal.

Проверка: `canAccessAdminSection()` + backend `GET /admin/access` + `RolesGuard`.

## SUPER_ADMIN / ADMIN

Видит все группы sidebar. Полный контроль платформы.

## ACCOUNTANT — Бухгалтерия

**Видит:** Финансы (кошельки, пополнения, выводы, доходы, доход платформы), отчёты, журнал действий (read), юниты (read), риск-сигналы (read).

**Не видит:** Роли, настройки, треки/раунды (кроме read holdings), support mutations.

## CONTENT_MANAGER — Контент

**Видит:** Треки и релизы, раунды, юниты (limited read), отчёты по релизам.

**Не видит:** Выводы, кошельки, доход платформы, роли, настройки комиссий.

## SUPPORT_MANAGER / SUPPORT — Поддержка

**Видит:** Обзор, пользователи (read), поддержка, пополнения/выводы (read), кошельки (read), holdings (read).

**Не видит:** Изменение балансов, подтверждение выводов, роли, параметры треков.

## COMPLIANCE — Риски

**Видит:** Риски и контроль, вторичный рынок (+ подозрительные), выводы (read + hold), пользователи (read), журнал (read).

**Не видит:** Комиссии, контент, бухгалтерские операции без прав.

## Матрица прав (UI)

Страница `/admin/roles` — `PERMISSION_MATRIX` в `admin-permissions.ts` + русские подписи областей.

Уровни: Полный доступ | Только чтение | Ограниченно | Нет доступа.

Назначение ролей: только SUPER_ADMIN, с confirm + audit (TODO: live API assign).

## Workspace aliases в sidebar

- **Задачи оператора** → `?panel=tasks` на обзоре
- **Риск-сигналы** → compliance
- **Сделки рынка** → secondary-market `?tab=trades`
- **Подозрительные операции** → `?tab=suspicious`
