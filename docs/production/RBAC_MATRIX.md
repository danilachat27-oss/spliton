# RBAC Matrix — Spliton Admin Portal

Source of truth (keep in sync):

- `apps/backend/src/modules/admin/common/admin-role-matrix.ts`
- `apps/frontend/features/admin/config/admin-role-matrix.ts`

## Synced sections (2026-06-14 P0)

### Tracks
| Role | Level |
|------|-------|
| SUPER_ADMIN, ADMIN, CONTENT_MANAGER | full |
| ACCOUNTANT, COMPLIANCE, BUSINESS_ANALYST | read |

Backend `admin-tracks.service.ts` uses `assertMatrixSection`.

### Disputes
| Role | Level | Actions |
|------|-------|---------|
| SUPER_ADMIN, ADMIN, SUPPORT_MANAGER | full | status, assign, notes |
| SUPPORT, COMPLIANCE | read | **reply only** (backend `assertReply`) |
| BUSINESS_ANALYST | read | view/export |

Frontend: mutate buttons hidden for SUPPORT; reply enabled via `canReply`.

### Legal
| Role | Level |
|------|-------|
| SUPER_ADMIN, ADMIN, COMPLIANCE | full mutate |
| CONTENT_MANAGER, BUSINESS_ANALYST | read |

Backend `LEGAL_VIEW` includes `CONTENT_MANAGER`.

### KYC / Compliance
| Role | KYC view | KYC approve/reject |
|------|----------|-------------------|
| SUPER_ADMIN | yes | yes |
| COMPLIANCE | yes | yes |
| ADMIN | yes | **no** (read-only compliance matrix) |
| BUSINESS_ANALYST | compliance read | no |

Frontend `kyc-section.tsx`: approve buttons only for SUPER_ADMIN + COMPLIANCE.

### Dashboard
`/admin` wrapped in `AdminSectionGuard sectionId="dashboard"` — same pattern as other sections.

## Tests

```powershell
cd apps/backend
$env:ALLOW_E2E_ON_DATABASE_URL="1"
npx jest --config ./test/jest-e2e.json --runInBand test/admin-rbac-hardening.e2e-spec.ts
```

## Direct URL rule

Portal gate (`AdminLayoutClient`) + section guard must both pass. Backend always enforces matrix on API.
