# Email Provider Setup — Spliton

## Supported providers

| Provider | Env | Package |
|----------|-----|---------|
| Dev (local) | `EMAIL_PROVIDER=dev` | In-memory outbox |
| **Postmark** (recommended) | `EMAIL_PROVIDER=postmark` | `postmark` SDK |
| Resend | `EMAIL_PROVIDER=resend` | REST API |

## Postmark production setup

1. Create Postmark server + message stream `outbound`.
2. Verify sending domain (SPF, DKIM, DMARC).
3. Set env:
```env
EMAIL_PROVIDER=postmark
EMAIL_FROM=notifications@yourdomain.com
POSTMARK_SERVER_TOKEN=...
POSTMARK_MESSAGE_STREAM=outbound
FEATURE_ENABLE_EMAIL_DELIVERY=true
```
4. Boot guard validates token + from when `NODE_ENV=production`.

## Resend alternative

```env
EMAIL_PROVIDER=resend
EMAIL_FROM=notifications@yourdomain.com
RESEND_API_KEY=re_...
FEATURE_ENABLE_EMAIL_DELIVERY=true
```

## Events covered

| Event | Implementation |
|-------|----------------|
| Email verification | `PostmarkEmailService` / `ResendEmailService` dedicated template |
| Password reset | dedicated template |
| Deposit credited | `NotificationService` → `sendNotificationEmail` |
| Withdrawal lifecycle | notification + email |
| Trade / purchase | notification + email |
| Support reply | notification + email |
| Security alerts | notification + email |

All notification emails use `buildSplitonEmailHtml` (Spliton branding, no dev text).

## Safe logging

- Logs mask recipient: `d***@domain.com`
- Never log tokens or full URLs with secrets

## Smoke test (staging)

```powershell
# Register new user → check verification email in Postmark activity
# Or dev only:
curl http://localhost:4001/dev/email-outbox/latest
```

## Disable email (incident)

```env
FEATURE_ENABLE_EMAIL_DELIVERY=false
```
Restart API. Verify `/api/admin/v1/safety/console`.
