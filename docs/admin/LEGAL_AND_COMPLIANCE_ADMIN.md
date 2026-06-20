# Legal & compliance admin (Spliton)

## Legal policies

- Путь UI: `/admin/legal` (роли: SUPER_ADMIN, ADMIN, COMPLIANCE, BUSINESS_ANALYST read, CONTENT_MANAGER read).
- API: `/api/admin/v1/legal/policies`, publish, archive.
- Compliance review workflow: черновик → publish → пользователи re-consent.

## KYC reviews

- API: `/api/admin/v1/kyc/reviews` (COMPLIANCE, SUPER_ADMIN).
- SUPPORT — без approve (RBAC в controllers).

## Compliance (risk flags)

- Существующий раздел `/admin/compliance` — risk flags, freeze, block user.

## Audit

Действия: `legal.policy.*`, `country.restriction.upsert`, KYC approve/reject — в audit log.
