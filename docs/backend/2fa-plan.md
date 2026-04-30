# План архитектуры 2FA (TOTP + backup codes)

Документ описывает **подход, потоки, модель данных и миграцию** для production-grade двухфакторной аутентификации поверх текущего NestJS auth (`user_sessions`, `audit_logs`). **Реализация кода, Prisma и миграций не входит в этот этап.**

---

## 1. Выбранный подход

| Решение | Обоснование |
|--------|-------------|
| **Основной фактор: TOTP** (RFC 6238) | Работает офлайн, не зависит от доставки SMS, стандарт для Google/Microsoft Authenticator, 1Password, Authy, Apple Passwords. |
| **Обязательные backup codes** | Восстановление при потере телефона; одноразовые, только хеши в БД. |
| **SMS не основной фактор** | SIM-swap, стоимость, доставка, регуляторика; при необходимости — отдельный **опциональный** fallback позже. |
| **WebAuthn / passkeys — позже** | Отдельный этап: другой threat model, UX и хранение credentials. |
| **Интеграция с текущим auth** | Промежуточный шаг между паролем и выдачей `user_sessions` + refresh rotation; события в `audit_logs` с `entityType: "auth"`. |

---

## 2. Анализ текущей Prisma-схемы и auth

### 2.1 `users`

- Идентификатор, `email`, `passwordHash`, `authProvider`, `status`, soft-delete поля.
- **Поля 2FA сейчас отсутствуют** — логично не раздувать `users` секретами; флаги «включена ли 2FA» можно при желании денормализовать позже для быстрого login-path (см. раздел 6).

### 2.2 `user_profiles`

- Профильные данные; **не место** для TOTP secret, challenge или backup codes.

### 2.3 `user_sessions`

- Привязка к `userId`, `refreshTokenHash`, ротация, `revokedAt` / `revokedReason`.
- Создаётся **после** успешной аутентификации, когда уже можно выдавать JWT с `sessionId`.
- Для 2FA нужен **отдельный** артефакт до создания сессии: **challenge** (см. таблицы ниже), чтобы не создавать полноценную `user_session` до завершения второго фактора.

### 2.4 `audit_logs`

- `entityType`, `action` (строка), `afterJsonb` / `beforeJsonb`, `actorUserId`, `ip`, `userAgent`.
- Сейчас `AuthAuditService` пишет `entityType: "auth"` и фиксированный набор `action` в TypeScript (`REGISTER`, `LOGIN_SUCCESS`, …).
- **Достаточно** расширить контракт действий новыми строками (или enum на уровне приложения); **менять схему `AuditLog` не обязательно**, если новые события укладываются в `action` + `afterJsonb` без секретов.

### 2.5 Существующие enum

- `UserStatus`, `UserRoleCode`, `ActorRole` и др. **отдельных enum для 2FA нет** — в миграции разумно ввести, например:
  - `two_factor_method_type` (минимум `TOTP`),
  - `two_factor_method_status` (`PENDING` | `ENABLED` | `DISABLED`),
  - `two_factor_challenge_status` (`PENDING` | `VERIFIED` | `FAILED` | `EXPIRED`).

### 2.6 Где хранить состояние 2FA

| Данные | Рекомендация |
|--------|----------------|
| TOTP secret (pending / active) | Отдельная строка в **`two_factor_methods`** с шифрованием secret, статус `PENDING` → `ENABLED`. |
| Backup codes | Таблица **`two_factor_backup_codes`**, только **hash** + `used_at`. |
| Временное состояние после пароля | Таблица **`two_factor_challenges`**, без выдачи refresh до `VERIFIED`. |

---

## 3. Production-grade потоки

### A. Setup 2FA

1. Пользователь **уже аутентифицирован** (Bearer access JWT, активная `user_session`).
2. `POST /auth/2fa/setup` — создаёт или обновляет запись метода `TOTP` в статусе **`PENDING`**, генерирует secret, **шифрует** и сохраняет в БД.
3. Ответ: `otpauthUrl` (или отдельно `issuer`, `accountName`, `secret` для клиента — **не рекомендуется** отдавать raw secret в JSON, если клиент сам строит URI; безопаснее отдать только `otpauthUrl` и одноразово не логировать).
4. **Не логировать** secret, plaintext backup, TOTP-коды.

### B. Verify setup

1. `POST /auth/2fa/verify-setup` с телом `{ code }` (и при необходимости ссылка на текущий pending метод по `userId` из JWT).
2. Проверка TOTP (окно ±1 шаг — см. security).
3. При успехе: статус метода **`ENABLED`**, `confirmed_at`, сгенерировать N backup codes, **показать plaintext один раз** в ответе, в БД — только **bcrypt/argon2** (или HMAC-SHA256 с server pepper) хеши.
4. Аудит: `TWO_FACTOR_SETUP_STARTED` (можно на setup), `TWO_FACTOR_ENABLED`, при регенерации пачки — `TWO_FACTOR_RECOVERY_CODES_REGENERATED`.

### C. Login при включённой 2FA

1. `POST /auth/login` — как сейчас: проверка email/password и статуса пользователя.
2. Если **2FA не включена** — текущий flow: `issueSessionAndTokens`, `LOGIN_SUCCESS`, ответ с `user` + `tokens`.
3. Если **2FA включена**:
   - **Не** вызывать `issueSessionAndTokens` / **не** создавать `user_session` с refresh.
   - Создать запись **`two_factor_challenges`** (`PENDING`, `expires_at`, `attempts_count = 0`, ip/UA).
   - Ответ, например:
     ```json
     {
       "requires2fa": true,
       "challengeId": "<uuid>",
       "availableMethods": ["totp", "backup_code"]
     }
     ```
   - Опционально тот же ответ при выключенной 2FA для пользователя без сессии — **не делать** (иначе user enumeration). Только после **валидного пароля**.
5. Аудит: `TWO_FACTOR_CHALLENGE_CREATED` (в `afterJsonb` только `challengeId`, `userId`, без кодов).

### D. Verify challenge

1. `POST /auth/2fa/verify` с `{ "challengeId", "code" }` и опционально `{ "method": "totp" | "backup_code" }`.
2. Загрузить challenge по id + `userId` (из тела недостаточно — привязка к пользователю из challenge записи; для анонимного шага после login **не** использовать access JWT — идентификация только `challengeId` + rate limit + короткий TTL).
3. Проверка: не истёк, не `FAILED`/`VERIFIED`, `attempts_count < max`.
4. При успехе TOTP или совпадении hash backup code:
   - Пометить challenge **`VERIFIED`**, `consumed_at`.
   - Для backup: `used_at` на строке кода, аудит `TWO_FACTOR_BACKUP_CODE_USED`.
   - **Затем** создать `user_session`, refresh hash, выдать access/refresh — как сейчас после login.
   - Аудит: `TWO_FACTOR_CHALLENGE_SUCCESS`, затем `LOGIN_SUCCESS` (или один агрегированный event — зафиксировать в реализации единообразно).
5. При неверном коде: инкремент `attempts_count`, аудит `TWO_FACTOR_CHALLENGE_FAILED`; при достижении лимита — статус **`FAILED`** или **`EXPIRED`** по политике (рекомендуется явный `FAILED` с `expires_at` не менять).

### E. Backup code

- Ввод в том же `POST /auth/2fa/verify` с `method: backup_code` или отдельное поле `backupCode`.
- Сравнение **constant-time** по всем неиспользованным хешам пользователя (или индекс по префиксу + hash — осторожно с privacy).
- Одноразовость: `used_at` + инвалидция строки; не переиспользовать.

### F. Disable 2FA

1. `POST /auth/2fa/disable` — **требует** активную сессию + **password** + **TOTP или backup code** (или только TOTP — product decision; минимум пароль + второй фактор).
2. Перевести метод в **`DISABLED`**, `disabled_at`; инвалидировать все backup rows (или пометить revoked); **не** удалять историю `audit_logs`.
3. Аудит: `TWO_FACTOR_DISABLED`.

### G. Regenerate backup codes

1. `POST /auth/2fa/recovery-codes/regenerate` — активная сессия + **TOTP** (backup для регенерации — спорно; лучше только TOTP).
2. Инвалидировать старые неиспользованные коды (soft `revoked_at` или hard delete с аудитом).
3. Выдать новый набор **один раз** в ответе; аудит `TWO_FACTOR_RECOVERY_CODES_REGENERATED`.

---

## 4. План миграции БД (предложение, без правок файлов)

### 4.1 Таблица `two_factor_methods`

| Поле | Тип | Заметки |
|------|-----|---------|
| `id` | UUID PK | |
| `user_id` | UUID FK → `users.id` | `onDelete: Cascade` |
| `method_type` | enum | Пока только `TOTP` |
| `status` | enum | `PENDING`, `ENABLED`, `DISABLED` |
| `secret_ciphertext` | `Bytea` или `Text` (base64) | Зашифрованный secret (не plaintext) |
| `secret_iv` | `Bytea` / фикс. длина | Для AES-GCM |
| `secret_tag` | `Bytea` / фикс. длина | Auth tag GCM |
| `encryption_key_version` | `SmallInt` | Ротация ключа без потери данных |
| `confirmed_at` | `Timestamptz?` | |
| `last_used_at` | `Timestamptz?` | Опционально для TOTP |
| `disabled_at` | `Timestamptz?` | |
| `created_at` / `updated_at` | `Timestamptz` | |

**Индексы / ограничения:**

- `@@unique([user_id, method_type])` — одна активная логическая запись на тип (при смене secret в pending — обновление той же строки или версионирование — product choice).
- `@@index([user_id, status])` — быстрый путь «включена ли 2FA».

**Альтернатива:** одно поле `secret_payload` JSONB `{ v, iv, tag, data }` — меньше колонок, проще миграции; важно задокументировать версию схемы payload.

### 4.2 Таблица `two_factor_backup_codes`

| Поле | Тип |
|------|-----|
| `id` | UUID PK |
| `user_id` | UUID FK → `users` |
| `code_hash` | Text (фикс. длина под алгоритм) |
| `used_at` | Timestamptz? |
| `created_at` | Timestamptz |
| `expires_at` | Timestamptz? | Опционально; по умолчанию бессрочно до использования |

**Индексы:**

- `@@index([user_id, used_at])` — выборка неиспользованных.
- Уникальность **не** на hash (коллизии крайне редки); уникальность на «сырой код» не хранится.

### 4.3 Таблица `two_factor_challenges`

| Поле | Тип |
|------|-----|
| `id` | UUID PK (публикуется как `challengeId`) |
| `user_id` | UUID FK → `users` |
| `status` | enum `PENDING`, `VERIFIED`, `FAILED`, `EXPIRED` |
| `attempts_count` | Int default 0 |
| `expires_at` | Timestamptz |
| `consumed_at` | Timestamptz? |
| `ip` | Text? |
| `user_agent` | Text? |
| `created_at` | Timestamptz |

**Индексы:**

- `@@index([user_id, status, expires_at])` — очистка / rate policies.
- `@@index([expires_at])` — фоновая задача `EXPIRED` (если не только lazy-проверка).

Связь с `user_sessions`: **никакой FK** до успешного verify; после verify создаётся обычная сессия.

### 4.4 Шифрование TOTP secret

- Переменная окружения **`TWO_FACTOR_ENCRYPTION_KEY`** (или общий `SECRETS_ENCRYPTION_KEY`) — **32 байта** для AES-256-GCM (хранить в secret manager; в репозиторий не класть).
- В БД: **ciphertext + iv + auth_tag** (отдельные колонки или один JSONB с версией).
- Ключ ротации: `encryption_key_version` + несколько ключей в env/KMS с префиксом версии.
- **Не** хранить secret в plaintext; **не** писать в `afterJsonb` audit.

### 4.5 Опциональная денормализация на `users`

- `two_factor_enabled_at: Timestamptz?` или `totp_enabled: Boolean` — ускорение ветвления login без join; источник истины остаётся в `two_factor_methods`; обновлять транзакционно с `ENABLED`/`DISABLED`.

---

## 5. Правила безопасности

| Правило | Рекомендация |
|----------|----------------|
| TOTP window | **±1** интервал (30 s) по умолчанию; не увеличивать без причины. |
| Backup codes | Показ **один раз**; в БД только **hash** (argon2id или bcrypt с cost; длина кода 8–10 символов + entropy). |
| Challenge TTL | **5–10 минут** с момента создания. |
| Попытки | Максимум **5** неверных кодов на challenge; затем `FAILED`, новый login с паролем. |
| Аудит | Все перечисленные события; в JSON только безопасные метаданные. |
| Логи | **Запрет** на логирование secret, OTP, backup plaintext, `otpauth` с secret query param в URL-логах. |
| Throttling | Те же или более строгие лимиты, чем у `/auth/login`, на `/auth/2fa/verify` по `challengeId` + IP. |
| Будущие обязательные 2FA-шаги | Вывод средств, смена пароля, отключение 2FA, смена payout/wallet адреса, критичные admin-действия — **re-auth + 2FA** отдельными задачами. |

---

## 6. Планируемые endpoints (сводка)

| Метод | Путь | Назначение |
|-------|------|------------|
| POST | `/auth/2fa/setup` | Начать настройку TOTP (JWT). |
| POST | `/auth/2fa/verify-setup` | Подтвердить TOTP, включить 2FA, выдать backup codes (один раз). |
| POST | `/auth/2fa/verify` | Завершить login по `challengeId` + код. |
| POST | `/auth/2fa/disable` | Отключить (пароль + второй фактор). |
| POST | `/auth/2fa/recovery-codes/regenerate` | Новые коды (TOTP + JWT). |

Существующие `POST /auth/login`, `refresh`, `logout` остаются; меняется только ветка login при включённой 2FA.

---

## 7. Диаграммы потоков (текст)

**Login без 2FA:**  
`login` → password OK → `user_session` + tokens → `LOGIN_SUCCESS`.

**Login с 2FA:**  
`login` → password OK → проверка «2FA enabled» → `two_factor_challenges` insert → ответ `requires2fa` → клиент `verify` с кодом → TOTP/backup OK → `user_session` + tokens → аудит success.

**Setup:**  
JWT → `setup` (pending + encrypted secret) → пользователь сканирует QR → `verify-setup` → enabled + backup plaintext once.

---

## 8. Расширение `AuthAuditService` (план)

Добавить в union / строковый контракт `action` (значения совпадают с требованиями продукта):

- `TWO_FACTOR_SETUP_STARTED`
- `TWO_FACTOR_ENABLED`
- `TWO_FACTOR_DISABLED`
- `TWO_FACTOR_CHALLENGE_CREATED`
- `TWO_FACTOR_CHALLENGE_SUCCESS`
- `TWO_FACTOR_CHALLENGE_FAILED`
- `TWO_FACTOR_BACKUP_CODE_USED`
- `TWO_FACTOR_RECOVERY_CODES_REGENERATED`

`entityType` оставить `"auth"`, `entityId` — `userId` или `challengeId` по событию (без секретов).

---

## 9. Что позже (вне текущего этапа)

- **WebAuthn / passkeys** — отдельная таблица credentials, другой challenge flow (ceremony), возможный приоритет над TOTP в UX.
- **SMS** — только как опциональный fallback с жёстким rate limit и осознанным риском SIM-swap.
- **Обязательная 2FA** для ролей `ADMIN` / чувствительных операций — политика продукта + отдельные middleware/step-up токены.

---

## 10. Что подтвердить перед реализацией

1. Утвердить **Prisma migration** (таблицы, enum, индексы, FK).  
2. Выбрать **алгоритм хеша** backup codes (argon2id vs bcrypt) и **длину / формат** кодов.  
3. Утвердить **формат ответа** login при 2FA (имена полей, нужен ли `user` без токенов).  
4. Нужна ли **денормализация** на `users` для login path.  
5. Где хранить **`TWO_FACTOR_ENCRYPTION_KEY`** (env / KMS) и политика **ротации**.  
6. Единая политика: **`LOGIN_SUCCESS`** только после полной аутентификации или отдельное событие для «password ok, 2FA pending».  
7. Обновление **`.env.example`** (без реальных секретов) — отдельным коммитом после реализации.

---

## 11. Реализовано в backend (TOTP + backup codes)

**Endpoints** (NestJS, `entityType: auth` в audit):

| Метод | Путь | Auth | Назначение |
|--------|------|------|------------|
| `POST` | `/auth/2fa/setup` | JWT | Старт настройки TOTP (`PENDING`, secret только encrypted в БД); при уже `ENABLED` — **409**. |
| `POST` | `/auth/2fa/verify-setup` | JWT | Подтверждение TOTP, включение метода, выдача **plaintext backup codes один раз**. |
| `POST` | `/auth/2fa/verify` | нет | Завершение логина по `challengeId` + `method` (`totp` \| `backup_code`). |
| `POST` | `/auth/2fa/disable` | JWT | Пароль + второй фактор; методы и backup codes сбрасываются. |
| `POST` | `/auth/2fa/recovery-codes/regenerate` | JWT | Только TOTP-код; новая пачка backup codes, старые удаляются. |

**Изменённый login:** при включённом TOTP после верного пароля ответ `{ requires2fa, challengeId, availableMethods }` без `user` и без токенов; `LOGIN_SUCCESS` пишется только после успешного `/auth/2fa/verify`.

**Env:** `TWO_FACTOR_ENCRYPTION_KEY` — в `.env.example` пустое значение; в Joi **optional** на старте приложения. Для setup/verify при отсутствии или невалидном ключе (не base64 на 32 байта) — ошибка сервера (см. `TwoFactorEncryptionService`). Локально ключ: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` (не коммитить вывод).

**Хранение:** TOTP secret — AES-256-GCM (ciphertext + iv + tag в `two_factor_methods`); backup codes — только bcrypt-хеши в `two_factor_backup_codes`.

**Не входит в реализацию:** SMS/Twilio, WebAuthn/passkeys, QR на backend (только `otpauthUrl`).
