# Business Analyst (`BUSINESS_ANALYST`)

Read-only роль для BI: dashboard, analytics, reports — **без** финансовых мутаций и управления ролями.

## Database

- `20260531200000_business_analyst_role_enum`
- `20260531200001_business_analyst_role_data`

После schema change: `npm run prisma:generate` (см. [PRISMA_WINDOWS_EPERM.md](../operations/PRISMA_WINDOWS_EPERM.md)).

## Can (read)

| Area | Access |
|------|--------|
| `/admin` dashboard | ✓ |
| `/admin/analytics/*` | ✓ all domains |
| `/admin/reports` | ✓ list, generate export, download CSV |
| Platform revenue | ✓ read + export (if enabled) |
| Platform fees GET | ✓ |

## Cannot (403)

- Approve/reject/complete withdrawals  
- Deposit reconcile / settle  
- PATCH platform fees  
- Assign/remove roles  
- Block users, publish tracks  
- Revenue distribution run  
- Freeze listings, mark trades suspicious  
- Support/compliance write actions  

## Sidebar

Обзор → Аналитика (все подразделы) → Отчёты. Без: Roles, Settings mutations, finance action buttons.

## Enforcement

| Layer | File |
|-------|------|
| Backend | `assertMutate`, `assertAnalyticsArea`, withdrawal `approve` guards |
| Frontend | `admin-action-permissions.ts`, `AdminSectionGuard` |
| E2E | `apps/backend/test/admin-analytics-access.e2e-spec.ts` |

## Access matrix (detail)

| Endpoint pattern | BA |
|------------------|-----|
| `GET /analytics/*` | 200 |
| `GET /dashboard/*` | 200 |
| `POST /reports/generate` | 200 (read export) |
| `POST /withdrawals/*/approve` | 403 |
| `GET /roles` | 403 |

Полная таблица: `archive/reports/BUSINESS_ANALYST_ACCESS_MATRIX.md`.
