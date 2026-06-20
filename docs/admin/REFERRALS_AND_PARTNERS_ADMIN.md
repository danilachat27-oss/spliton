# Admin: рефералы и партнёры

Путь: **`/admin/referrals`** (legacy `/admin/partners` редиректит сюда).

## RBAC

| Роль | Просмотр | Approve reward | Reject reward | Partner approve | Suspend partner |
|------|----------|----------------|---------------|-----------------|-----------------|
| SUPER_ADMIN | да | да | да | да | да |
| ACCOUNTANT | да | да | да | да | нет |
| COMPLIANCE | да | нет | да | нет | да |
| BUSINESS_ANALYST | read-only | нет | нет | нет | нет |
| SUPPORT_MANAGER | limited | нет | нет | нет | нет |

## API

- `GET /api/admin/v1/referrals/summary`
- `GET /api/admin/v1/referrals/rewards`
- `POST .../rewards/:id/approve` | `reject`
- `GET /api/admin/v1/referrals/partners`
- `POST .../partners/:id/approve` | `reject` | `suspend`

## Действия

- Одобрить/отклонить начисление (причина обязательна при reject).
- Одобрить партнёра (tier, commission %).
- Suspend — compliance / super admin.

Fraud flags: `REFERRAL_SELF_ATTEMPT`, `REWARD_HELD_FOR_REVIEW`, `PARTNER_FRAUD_SUSPECTED` — в compliance / user risk.
