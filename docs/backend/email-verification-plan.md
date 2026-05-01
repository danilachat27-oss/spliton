# Email Verification Architecture + Migration Plan

## Implementation Status

- DB layer is applied:
  - `UserStatus.PENDING_EMAIL_VERIFICATION`
  - `users.email_verified_at`
  - `email_verification_tokens`
- Backend flow implemented:
  - `POST /auth/register` returns `{ requiresEmailVerification: true }` (no tokens)
  - `POST /auth/email/verify`
  - `POST /auth/email/resend`
  - `POST /auth/login` returns `403 EMAIL_NOT_VERIFIED` for unverified users
- Verification token rules:
  - high-entropy token, DB stores SHA-256 hash only
  - TTL 24h
  - single-active-token policy with revoke on register/resend
- No auto-login after verification.
- Existing `ACTIVE` users stay compatible (legacy accounts with `email_verified_at = null` are not broken).

## Current State (as-is)

- `UserStatus` enum: `ACTIVE`, `PENDING`, `SUSPENDED`, `BANNED`, `DELETED`.
- `users` table has no `email_verified_at` (or equivalent explicit flag/timestamp).
- `users.status` defaults to `PENDING` in Prisma schema, but `AuthService.register` currently creates users with `UserStatus.ACTIVE`.
- `register` immediately creates session + access/refresh tokens.
- `login` allows `ACTIVE` and `PENDING` (only blocks `SUSPENDED`, `BANNED`, `DELETED` through shared status guard).
- `JwtStrategy` also allows `PENDING` users because it only rejects `SUSPENDED`/`BANNED`/`DELETED`.
- `GET /users/me` is JWT protected and currently assumes user is already fully active.
- `AuthAuditService` currently has auth/2FA events, but no email verification-specific events.
- Existing e2e tests (`auth-regression`, `two-factor-auth`) assume immediate post-register authenticated flow.

## Goals

- Add production-grade email verification before enabling financial modules.
- Avoid email enumeration and token leakage.
- Keep auth UX predictable and backward-compatible during rollout.
- Do not implement provider integration yet; define interfaces and rollout sequence.

## Proposed Target Flow

### Register (`POST /auth/register`)

1. Normalize email and create user with:
   - status: `PENDING_EMAIL_VERIFICATION` (preferred) or reuse `PENDING` (fallback).
   - password hash saved as now.
   - profile + default `INVESTOR` role created as now.
2. Generate verification token (plaintext once), store only token hash in DB.
3. Send verification email via `EmailService` abstraction.
4. Response policy (recommended): return **no auth tokens**.
   - Response: `201` with generic message, e.g. `{ requiresEmailVerification: true }`.
   - Rationale: simplest and safest boundary; avoids partial-session abuse and extra JWT modes.
5. Audit: `EMAIL_VERIFICATION_SENT` (no token in metadata).

Why no limited session for now:
- Reduced complexity, fewer auth states, no special-scope JWT branch.
- Lower risk of accidental privilege bleed before verification.
- Easier migration of existing guards and endpoints.

### Verify Email (`POST /auth/email/verify`)

Body:
- `token` (opaque plaintext token from email link).

Flow:
1. Hash incoming token, find pending non-expired non-used row.
2. If invalid/expired/revoked/used -> generic failure response (avoid details).
3. Mark token as `used_at = now`.
4. Activate user:
   - set status to `ACTIVE`,
   - set `email_verified_at = now`.
5. Audit `EMAIL_VERIFIED`.
6. Response policy (recommended): do **not** auto-login, return success and ask user to login.
   - Rationale: no token issuance in link-driven endpoint, simpler threat model.

Optional alternative (not recommended now): auto-issue tokens after verify. This adds complexity around email client/browser context and replay hardening.

### Resend Verification (`POST /auth/email/resend`)

Input:
- email (public endpoint) **or** future limited-auth context.

Flow:
1. Always return generic success regardless of account existence.
2. If user exists and is unverified:
   - enforce resend cooldown/rate limit,
   - revoke previous active verification tokens (single-active-token policy),
   - create and send a new token.
3. Audit `EMAIL_VERIFICATION_RESENT` for real internal actions.

### Login Before Verification (`POST /auth/login`)

Recommended behavior:
- If credentials valid but email unverified: return `403` with stable code:
  - `{ code: "EMAIL_NOT_VERIFIED", message: "Email verification required" }`
- Do not issue access/refresh tokens.
- Avoid overexposing account state in failure cases (still keep generic `401` for invalid creds).

Notes on UX/API:
- This is explicit enough for frontend branching later.
- Keeps brute-force/account-enumeration surface controlled by credential check first.

## API Contract Proposal

- `POST /auth/email/verify`
  - body: `{ token: string }`
  - success: `{ verified: true }`
  - fail: `400/401` generic invalid/expired token message.

- `POST /auth/email/resend`
  - body: `{ email: string }`
  - success always: `{ success: true }` (generic).
  - strict throttling by IP + email key.

- `POST /auth/register` (changed behavior)
  - success: `{ requiresEmailVerification: true }` (no session tokens).

- `POST /auth/login` (changed behavior)
  - unverified user: `403` + `EMAIL_NOT_VERIFIED`.

## DB Model Proposal

### `users` additions

- add nullable `email_verified_at DateTime?`.

Rationale:
- canonical immutable point-in-time marker for verification.
- easy analytics and compliance checks.

### New table: `email_verification_tokens`

- `id UUID PK`
- `user_id UUID FK -> users.id ON DELETE CASCADE`
- `token_hash TEXT UNIQUE`
- `expires_at TIMESTAMP NOT NULL`
- `used_at TIMESTAMP NULL`
- `revoked_at TIMESTAMP NULL`
- `created_at TIMESTAMP NOT NULL DEFAULT now()`
- `ip TEXT NULL`
- `user_agent TEXT NULL`

Indexes:
- `(user_id, used_at, expires_at)`
- `(expires_at)` for cleanup jobs.
- `UNIQUE(token_hash)`.

Storage rule:
- plaintext token only in outbound email link; DB contains hash only.

## UserStatus Strategy

Preferred:
- extend enum with `PENDING_EMAIL_VERIFICATION`.

Why explicit status is better than generic `PENDING`:
- removes ambiguity with other onboarding states (KYC/policy/etc).
- cleaner auth guards and audit analysis.
- easier future policy composition.

Fallback (if avoiding enum change initially):
- keep `PENDING` for unverified + rely on `email_verified_at`.
- downside: overloaded semantics.

## Security Rules

- Token format: high-entropy random (at least 32 bytes before encoding).
- DB stores only hash (e.g., SHA-256 with app-level pepper optional).
- Token TTL recommendation: **24h** (balanced UX + security).
  - Optional short TTL (30-60 min) only if resend UX is strong; otherwise increases support load.
- Resend cooldown recommendation:
  - per-email: 1 request / 60s burst, capped (e.g., 5/hour),
  - per-IP: stricter global throttle.
- Single-active-token policy: revoke old pending tokens on resend.
- Never log token plaintext, hash, or full verification URL.
- Audit metadata should include only safe context (`userId`, `reason`, request source).

## Audit Events to Add

- `EMAIL_VERIFICATION_SENT`
- `EMAIL_VERIFICATION_RESENT`
- `EMAIL_VERIFIED`
- `EMAIL_VERIFICATION_FAILED`

Guidelines:
- no token/link/hash in `safeMeta`.
- keep `entityType = "auth"` for consistency.

## Email Provider Abstraction (no integration yet)

Proposed module shape:
- `EmailModule`
- `EmailService` interface:
  - `sendVerificationEmail(input: { to: string; verifyUrl: string; locale?: string }): Promise<void>`

Implementations:
- `DevEmailService` (local/dev):
  - no real send,
  - logs only delivery attempt metadata (recipient masked, template key),
  - no full token/link in logs.
- future prod adapters:
  - `ResendEmailService`,
  - `PostmarkEmailService`,
  - `SesEmailService`.

Provider recommendation for later production:
- **Postmark** for transactional reliability and templating ergonomics.
- `Resend` is also strong for fast iteration; SES is cost-effective at scale but more operational overhead.

## Impact on Existing Auth and Tests

Expected code impact (future implementation stage):
- `AuthService.register`: no immediate token issuance; create verification token + send email.
- `AuthService.login`: explicit unverified branch (`403 EMAIL_NOT_VERIFIED`).
- `JwtStrategy` / status guard helpers: block unverified statuses if needed.
- add endpoints for verify/resend.

E2E impact:
- current auth regression tests that assert immediate register/login tokens must be updated.
- new e2e suites needed:
  - register -> verify -> login happy path,
  - resend throttling and generic responses,
  - expired/revoked/used token handling,
  - no enumeration guarantees.

## Migration Plan (staged)

1. **Schema migration design (separate approval)**
   - add `users.email_verified_at`,
   - add `email_verification_tokens`,
   - add enum value `PENDING_EMAIL_VERIFICATION` (if approved).
2. **Backend implementation**
   - token service + repository + endpoints + audits.
3. **Dual-compat window**
   - temporarily allow existing ACTIVE users unchanged,
   - rollout register behavior change behind feature flag if needed.
4. **Test updates**
   - adjust existing auth regression assumptions,
   - add dedicated email verification e2e coverage.
5. **Provider integration**
   - start with `DevEmailService`, then production adapter.
6. **Operational readiness**
   - monitoring dashboards, alerting on verify failure rates, token cleanup cron.

## Rollout / Backward Compatibility Notes

- Existing already ACTIVE users remain unaffected.
- New registrations transition to unverified-first flow.
- 2FA activation should require verified email once flow is enabled (policy decision to confirm).
- No frontend implementation in this stage; backend API contracts are prepared for next phase.

## Decisions To Confirm Before Migration

1. Use explicit enum value `PENDING_EMAIL_VERIFICATION` vs reusing `PENDING`.
2. Register response contract: no tokens (recommended) vs limited session.
3. Verify endpoint behavior: login-after-verify vs auto-login (recommended: login required).
4. Token TTL: 24h (recommended) vs shorter window.
5. Resend limits exact numbers and abuse policy.
6. First production provider choice (Postmark vs Resend vs SES).
