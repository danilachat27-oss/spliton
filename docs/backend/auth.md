# Spliton Production Auth

## Scope

Implemented auth endpoints:

- `POST /auth/register`
- `POST /auth/login` (если у пользователя включён TOTP 2FA — см. раздел «Two-factor (TOTP)» ниже)
- `POST /auth/email/verify`
- `POST /auth/email/resend`
- `POST /auth/refresh`
- `POST /auth/logout` (current session by refresh token)
- `POST /auth/logout-all` (all user sessions, JWT protected)
- `GET /users/me` (JWT protected)
- Two-factor: `POST /auth/2fa/setup`, `verify-setup`, `verify`, `disable`, `recovery-codes/regenerate` — см. [2fa-plan.md](./2fa-plan.md) §11

## Token Model

- **Access token**
  - signed with `JWT_SECRET`
  - payload: `sub`, `email`, `roles`, `sessionId`, `type: "access"`
  - TTL: `15m`
- **Refresh token**
  - signed with `JWT_REFRESH_SECRET`
  - payload: `sub`, `email`, `roles`, `sessionId`, `type: "refresh"`
  - TTL: `7d`

## Session Model (`user_sessions`)

- Each login (and register in old flow) creates a DB session.
- DB stores only `refresh_token_hash` (`bcrypt`), never raw refresh token.
- Session lifecycle fields:
  - `expires_at`
  - `last_active_at`
  - `revoked_at`
  - `revoked_reason`
  - `replaced_by_session_id`
  - `ip`, `user_agent`, `device`

## Register Flow

1. Normalize email (`trim + lowercase`).
2. Reject duplicate email.
3. Hash password (`bcrypt`).
4. Create `user` + `user_profile` + default `INVESTOR` role with status `PENDING_EMAIL_VERIFICATION`.
5. Create email verification token (store only hash) and queue verification email through `EmailService`.
6. Do **not** create session and do **not** issue access/refresh tokens.
7. Return `{ requiresEmailVerification: true }`.
8. Write `REGISTER` + `EMAIL_VERIFICATION_SENT` audit events.

## Login Flow

1. Normalize email.
2. Validate credentials with generic error (`Invalid credentials`).
3. Reject blocked statuses (`SUSPENDED`, `BANNED`, `DELETED`).
4. If user status is `PENDING_EMAIL_VERIFICATION`: return `403` with code `EMAIL_NOT_VERIFIED`; no session/tokens.
5. If TOTP 2FA **включена**: создать `two_factor_challenges` (без `user_session` и без токенов), вернуть `{ requires2fa, challengeId, availableMethods }`, аудит `TWO_FACTOR_CHALLENGE_CREATED` (без `LOGIN_SUCCESS`).
6. Иначе: создать новую сессию и пару токенов, сохранить refresh hash, записать `LOGIN_SUCCESS` или `LOGIN_FAILED`.

## Email Verification

- Token generation: high-entropy random token (32 bytes), stored as SHA-256 hash only.
- Token TTL: `24h` (`EMAIL_VERIFICATION_TOKEN_TTL_HOURS`).
- Verify endpoint (`POST /auth/email/verify`) activates user (`ACTIVE` + `email_verified_at`) and returns `{ verified: true }`.
- Verify does **not** auto-login.
- Resend endpoint (`POST /auth/email/resend`) is anti-enumeration and always returns `{ success: true }`.
- Dev-only provider abstraction is used now; production provider integration (Postmark/Resend/SES) is deferred.

## Two-factor (TOTP + backup codes)

Требуется `TWO_FACTOR_ENCRYPTION_KEY` (base64 → 32 байта) для операций setup/verify. Backup codes показываются **plaintext только один раз** в ответах `verify-setup` и `recovery-codes/regenerate`. Подробности и список endpoints: [2fa-plan.md](./2fa-plan.md) §11.

## Refresh Rotation

Refresh token is one-time use:

1. Verify JWT signature + token type (`refresh`).
2. Validate referenced session is active and unexpired.
3. Compare incoming refresh token with `refresh_token_hash`.
4. Create new session, revoke old session with:
   - `revoked_reason = "ROTATED"`
   - `replaced_by_session_id = <new_session_id>`
5. Return new access + refresh pair for new session.
6. Write `REFRESH_SUCCESS`.

Why one-time refresh token:

- Limits replay window.
- Gives deterministic chain of session replacements.
- Enables robust reuse detection and forced global revocation.

## Reuse Detection

If refresh token hash mismatch is detected, system treats it as potential token reuse:

- revoke all active user sessions;
- write `REFRESH_REUSE_DETECTED`;
- return `401`.

If a rotated (already revoked) token is reused, it is also treated as suspicious and logged.

## Logout

- `POST /auth/logout`
  - accepts `refreshToken`
  - revokes only that session with `revoked_reason = "LOGOUT"`
  - idempotent response: `{ success: true }`
  - writes `LOGOUT` when session is found and active

- `POST /auth/logout-all`
  - requires valid access token
  - revokes all active sessions of current user with `revoked_reason = "LOGOUT_ALL"`
  - writes `LOGOUT_ALL`

## Access Token Validation (`JwtStrategy`)

For protected endpoints (`users/me` etc.) strategy validates:

- token type is `access`;
- user exists and is not blocked;
- session exists, not revoked, not expired.

This gives immediate logout effect for protected routes even if access token TTL has not elapsed.

## Audit Events

Auth audit events:

- `REGISTER`
- `LOGIN_SUCCESS`
- `LOGIN_FAILED`
- `REFRESH_SUCCESS`
- `REFRESH_FAILED`
- `REFRESH_REUSE_DETECTED`
- `LOGOUT`
- `LOGOUT_ALL`

Safe metadata only (no secrets/tokens/passwords):

- `userId`
- `email`
- `sessionId`
- `reason`
- `ip`
- `userAgent`

## Rate Limiting and Security Headers

- `helmet` is enabled globally.
- Global throttling is enabled with `@nestjs/throttler`.
- Auth endpoints use stricter endpoint-level limits for `register`, `login`, `refresh`.

For multi-instance production, throttling must be backed by Redis store (not implemented in current single-instance setup).
