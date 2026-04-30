# Spliton Auth Foundation (MVP)

## Scope

Implemented backend auth endpoints:

- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /users/me` (protected with JWT access token)

This is a secure MVP foundation only. It does not implement advanced session management yet.

## Token Model

- **Access token**
  - JWT signed with `JWT_SECRET`
  - payload: `sub`, `email`, `roles`
  - TTL: `15m`
- **Refresh token**
  - JWT signed with `JWT_REFRESH_SECRET`
  - payload: `sub`, `email`, `roles`
  - TTL: `7d`

## Flows

### Register

1. Normalize email (`trim + lowercase`).
2. Check duplicate email.
3. Hash password via `bcrypt`.
4. Create user (`ACTIVE`), profile, and default `INVESTOR` role.
5. Return safe user object + tokens.

### Login

1. Normalize email.
2. Load user by email.
3. Compare password hash.
4. Block login for `BANNED`, `SUSPENDED`, `DELETED`.
5. Return safe user object + tokens.

Security note: login uses generic unauthorized message to avoid leaking whether email exists.

### Refresh

1. Verify refresh token with refresh secret.
2. Load user by `sub`.
3. Validate user status.
4. Return new access + refresh token pair.

### Logout (stateless MVP)

- Returns `{ success: true }`.
- Client must remove local tokens.
- Refresh token rotation/session table is planned for later.

## What is intentionally not implemented

- No auth UI integration.
- No Redis/session storage.
- No refresh token persistence/rotation/revocation DB table.
- No OAuth/social login.
- No wallet/payment/blockchain behavior.
