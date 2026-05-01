# Frontend Auth Integration

## Environment

- `VITE_API_BASE_URL=http://localhost:3001`
- Optional Next.js-compatible alias: `NEXT_PUBLIC_API_BASE_URL`

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

- Route: `/verify-email?token=...`
- Calls `POST /auth/email/verify`.
- Success: show confirmation and link to login.
- Failure: show generic invalid/expired message and resend option (if email known).
- No auto-login.

### Login

- `POST /auth/login`
- Success response: store in-memory `accessToken`, set user, navigate to dashboard.
- 2FA response (`requires2fa`): store pending challenge, show 2FA step.
- `EMAIL_NOT_VERIFIED`: show verify-email prompt and resend action.

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
