# Auth Token Transport Security Plan

## Current State

Implemented transport:

- `POST /auth/login` -> sets HttpOnly refresh cookie, returns `user + accessToken` (+ optional deprecated body refresh token).
- `POST /auth/2fa/verify` -> same behavior after challenge success.
- `POST /auth/refresh` reads cookie first, optional deprecated body fallback, rotates and sets new cookie.
- `POST /auth/logout` reads cookie first, optional deprecated body fallback, clears cookie.
- `POST /auth/logout-all` requires access token.
- `GET /users/me` requires Bearer access token.

Current platform-level behavior:

- Access token TTL ~15m.
- Refresh token TTL ~7d with rotation and reuse detection.
- CORS uses explicit allowlist from `FRONTEND_ORIGIN` with `credentials: true`.

## Threat Model

Primary web threats relevant to token transport:

1. **XSS token exfiltration**
   - If refresh token is in `localStorage`/`sessionStorage`, injected JS can steal long-lived credential.
2. **Token replay**
   - Stolen refresh token allows session continuation unless rotation/reuse protections catch quickly.
3. **CSRF**
   - If auth relies on cookies, cross-site requests can carry credentials automatically.
4. **Origin misconfiguration**
   - `Access-Control-Allow-Origin: *` is incompatible with credentialed cookies and increases risk if misused.

## Options Compared

### A) Both tokens in JSON + web storage

- Pros: simple; no cookie plumbing.
- Cons: refresh token readable by JS; high impact under XSS.
- Verdict: **not recommended** for production web frontend.

### B) Access token in JSON/in-memory, refresh token in HttpOnly cookie

- Pros:
  - refresh token not readable by JS;
  - keeps existing Bearer access token model for API guards;
  - balanced complexity and security.
- Cons:
  - needs cookie/CORS/CSRF discipline.
- Verdict: **recommended approach for Spliton**.

### C) Cookie-only (access + refresh in cookies)

- Pros: avoids JS token handling completely.
- Cons:
  - broader CSRF surface (all authenticated endpoints become cookie-authenticated);
  - requires larger CSRF framework changes.
- Verdict: possible later, but **not preferred now**.

## Recommended Approach (Spliton)

Use **hybrid transport**:

- Access token:
  - short-lived JWT;
  - returned in JSON and kept in frontend memory only.
- Refresh token:
  - moved to `HttpOnly` cookie (`Secure` in production);
  - never stored in `localStorage/sessionStorage`.

This preserves current JWT guard model while materially reducing XSS impact on long-lived credentials.

## Backend Contract

### Register / Login / 2FA verify

- Access token remains in JSON.
- Refresh token is set in HttpOnly cookie.
- `AUTH_RETURN_REFRESH_TOKEN_IN_BODY=false` should be used in production to disable deprecated body refresh token.

### Refresh

- Primary source: refresh cookie.
- Transitional compatibility: optionally accept body `refreshToken` during migration window (deprecated).
- On successful rotation: overwrite refresh cookie with new token.

### Logout

- Read refresh token from cookie.
- Revoke corresponding session.
- Clear refresh cookie.

### Logout-all

- Keep access token auth as now.
- Revoke all sessions.
- Clear refresh cookie.

## Env / Config

- `FRONTEND_ORIGIN` (comma-separated strict origins list).
- `AUTH_REFRESH_COOKIE_NAME` (default `spliton_refresh_token`).
- `AUTH_COOKIE_DOMAIN` (optional; env-specific).
- `AUTH_COOKIE_SECURE` (`true` in staging/prod, local exception allowed).
- `AUTH_COOKIE_SAME_SITE` (`lax|strict|none`).
- `AUTH_RETURN_REFRESH_TOKEN_IN_BODY` (temporary compatibility fallback).

Validation rule:

- `AUTH_COOKIE_SAME_SITE=none` requires `AUTH_COOKIE_SECURE=true`.

## Cookie Policy by Environment

### Local dev (single origin or localhost split ports)

- `HttpOnly=true`
- `Secure=false` only for localhost http
- `SameSite=Lax` (or `None` + HTTPS local tunnel when cross-site needed)

### Staging / Production

- `HttpOnly=true`
- `Secure=true`
- `SameSite=Lax` by default
  - use `None` only when truly cross-site and with explicit CSRF controls
- Explicit `Domain` only if required by subdomain strategy.

## CORS Implications

For cookie-based refresh:

- `credentials: true` must be enabled.
- `origin` must be explicit trusted origins (no wildcard with credentials).
- Do not use `*` with credentialed requests.

Current backend default `CORS_ORIGIN='*'` must be tightened before enabling cookie transport.

## CSRF Notes

Once refresh/logout use cookies, CSRF becomes relevant for those endpoints.

Recommended phased controls:

1. Start with `SameSite=Lax` + strict CORS origin allowlist.
2. Add CSRF token/double-submit mechanism for state-changing cookie-authenticated endpoints if cross-site requirements emerge.
3. Keep login/refresh/logout throttling strict.

## Frontend Integration Guidance

- Keep `accessToken` in memory only.
- Use `credentials: 'include'` for refresh/logout endpoints.
- On app reload:
  - call `/auth/refresh` to obtain fresh access token from cookie.
- Never store refresh token in browser storage.

## E2E Impact

- Switch tests to `supertest.agent()` to persist cookies.
- Add assertions for `Set-Cookie` on login/refresh and cookie clearing on logout/logout-all.
- Keep body-refresh fallback tests only while deprecated path exists.
- Ensure e2e continues using `FakeEmailService` (no real outbound email).

## Rollout / Migration Plan

1. Backend hybrid transport is enabled.
2. Frontend should use `credentials: 'include'` for refresh/logout.
3. Set `AUTH_RETURN_REFRESH_TOKEN_IN_BODY=false` in staging/prod.
4. After frontend cutover, remove deprecated body fallback.
5. Monitor refresh failure/reuse metrics and CSRF-related anomalies.

## What Not To Do

- Do not keep refresh token in `localStorage`/`sessionStorage`.
- Do not use wildcard CORS with credentialed cookies.
- Do not log refresh token/cookie values.
- Do not disable rotation/reuse protections.

## Remaining Decisions

1. Cookie domain model (single domain vs subdomains).
2. Timeline for disabling deprecated body fallback.
3. Whether to add CSRF token protection when cookie-authenticated state-changing endpoints expand.
