# Spliton Admin — UI/UX

## Unified Analytics UX Standard

1. **Layout**: `AdminAnalyticsPageShell` — заголовок, период, фильтры, компактная навигация между разделами, внутренние табы страницы.
2. **Compact nav**: `AdminAnalyticsCompactNav` — горизонтальные pill-вкладки, без больших карточек-маршрутов.
3. **Page tabs**: `AdminAnalyticsTabs` + `?tab=` в URL — контент по вкладкам, не длинная лента.
4. **Статусы**: зелёный = хорошо, синий = нейтрально/инфо, красный = плохо, жёлтый = предупреждение (`AdminAnalyticsStatusBadge`, `admin-status-maps`).
5. **Empty states**: контекстные тексты в `CHART_EMPTY_STATES` (`admin-analytics-i18n.ts`).
6. **Стиль**: мягкие карточки `rounded-3xl`, лёгкие тени, без тяжёлых бордеров.
7. **Русификация**: `admin-i18n.ts`, `admin-status-maps.ts`, `admin-role-labels.ts`, доменные `*-analytics-i18n.ts`.

См. также `docs/analytics/ANALYTICS_DASHBOARDS.md`, `docs/admin/ADMIN_RUSSIAN_LOCALIZATION.md`.
