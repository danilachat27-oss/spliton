# Frontend Auth Integration

## Environment

- Primary (Next.js): `NEXT_PUBLIC_API_BASE_URL=http://localhost:4000`
- Legacy fallback: `VITE_API_BASE_URL`

## Token Storage Model

- `accessToken` is stored in memory only (`AuthProvider` state).
- `refreshToken` is never stored in `localStorage` / `sessionStorage`.
- `refreshToken` is delivered and rotated via HttpOnly cookie by backend.

## API Transport Rules

- All auth requests use `credentials: "include"`.
- Frontend does not send refresh token manually.
- `/auth/refresh` is called with empty body.
- `/auth/logout` is called with empty body.

## Runtime Session Flow

1. App boot: `AuthProvider` calls `refreshSession()`.
2. If refresh succeeds, provider sets in-memory `accessToken` and `user`.
3. If refresh fails, auth state remains unauthenticated.

## Retry-after-401 Behavior

- `authorizedFetch()` attaches Bearer access token.
- On `401`, it performs one refresh attempt via cookie.
- If refresh succeeds, original request is retried once.
- If retry still fails with `401`, auth state is cleared.

## User Flows

### Register

- `POST /auth/register`
- Expects `{ requiresEmailVerification: true }`
- User is not logged in.
- UI navigates to `/verify-email?email=<address>`.

### Verify Email

- Waiting screen: `/verify-email?email=...`
  - Shows "check your email" state and resend action.
- Verification screen: `/verify-email?token=...`
  - Calls `POST /auth/email/verify` automatically.
- If both `token` and `email` exist, token verification has priority.
- Success: show confirmation and link to login.
- Failure: show generic invalid/expired message and resend option (if email known).
- No auto-login.

### Login

- `POST /auth/login`
- Success response: store in-memory `accessToken`, set user, navigate to dashboard.
- 2FA response (`requires2fa`): store pending challenge, show 2FA step.
- `EMAIL_NOT_VERIFIED`: show resend action and redirect to `/verify-email?email=<address>`.

### Unverified Account Recovery

- Register with existing email (`409`) now shows recovery block:
  - resend verification email
  - navigate to login
- Login with unverified email also offers resend and moves user to verify-email waiting screen.
- Resend copy remains generic:
  - "If account exists and email is unverified, we send a new verification email."

### 2FA Verify

- `POST /auth/2fa/verify`
- On success, backend has already set refresh cookie; frontend stores only access token in memory and continues.

### Logout / Logout-all

- `POST /auth/logout` and `POST /auth/logout-all` with `credentials: "include"`.
- Frontend clears in-memory auth state after request completion.

## Local Run

1. Start backend (`apps/backend`) with auth env configured.
2. Set frontend API URL via `VITE_API_BASE_URL`.
3. Start frontend (`apps/frontend`) and use login/register screens with real backend auth.

## Why email may not arrive in local dev

- With backend `EMAIL_PROVIDER=dev`, real emails are not sent (expected behavior).
- For local verification in dev provider mode, enable:
  - `DEV_EMAIL_OUTBOX_ENABLED=true`
  - read latest link from `GET /dev/email-outbox/latest?email=<your-email>`
  - endpoint is unavailable in production mode and should never be enabled in production.
- For real delivery, configure backend with Postmark provider:
  - `EMAIL_PROVIDER=postmark`
  - `POSTMARK_SERVER_TOKEN`
  - `EMAIL_FROM`
  - `APP_PUBLIC_URL` pointing to frontend URL (local or production).
