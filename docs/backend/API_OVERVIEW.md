# API Overview

## Surfaces

| Surface | Prefix | Consumers |
|---------|--------|-----------|
| Health | `/health` | Ops |
| Auth | `/auth/*` | All clients |
| User API | `/api/v1/*` | Holder app, wallet, catalog |
| Admin API | `/api/admin/v1/*` | Operator portal only |

Admin mutations **must not** use user endpoints for settlement.

## Documentation map

| Topic | Document |
|-------|----------|
| Backend structure | [architecture.md](architecture.md) |
| Auth & JWT | [auth.md](auth.md) |
| 2FA | [2fa-plan.md](2fa-plan.md) |
| Email verification | [email-verification-plan.md](email-verification-plan.md) |
| Testing | [testing.md](testing.md) |
| Admin endpoints | [ADMIN_API_OVERVIEW.md](ADMIN_API_OVERVIEW.md) |
| Database schema | [../database/schema.md](../database/schema.md) |

## Versioning

Admin API versioned under `v1`. Legacy `GET /admin/access` retained for compatibility.
