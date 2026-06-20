# Language settings

Пользователь может выбрать язык:

1. **Header** — переключатель с флагами (RU / EN / KA)
2. **Настройки профиля** — селект языка (MVP, синхронизируется через тот же cookie)

## Сохранение

| Состояние | Хранение |
|-----------|----------|
| Гость | `localStorage` + cookie `spliton_locale` |
| Авторизован | + `UserProfile.preferredLocale` через `PATCH /users/me/preferences` |

## Fallback

Если перевод отсутствует — показывается русский текст.

См. также: [I18N.md](../frontend/I18N.md)
