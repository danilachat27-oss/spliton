# Русификация операторской панели Spliton

## Источники переводов

| Файл | Назначение |
|------|------------|
| `features/admin/lib/admin-i18n.ts` | Навигация, таблицы, действия, пустые состояния |
| `features/admin/lib/admin-status-maps.ts` | Статусы, tone для badge |
| `features/admin/lib/admin-role-labels.ts` | Роли staff |
| `features/admin/lib/admin-analytics-i18n.ts` | KPI tooltips, empty charts, insights |
| `features/admin/lib/admin-*-analytics-i18n.ts` | Доменные подписи аналитики |

## Правила

- Enum values → через map, не inline в JSX.
- Продукт называется **Spliton** (не RevShare Platform).
- Вторичный рынок: **стакан листингов**, не «биржевой стакан».

## В работе

Полный проход по `/admin/*` (wallets, compliance, reports) — продолжается по мере рефакторинга разделов.
