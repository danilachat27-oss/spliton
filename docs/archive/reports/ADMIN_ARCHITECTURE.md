# Admin Architecture

## Layers

```
apps/frontend/
  app/admin/              # Next.js routes (thin pages)
  features/admin/
    api/                  # Versioned contracts + AdminApiClient
    components/           # Shell, login, drawers, list page scaffold
    config/               # Nav, permissions matrix, sections
    hooks/                # useAdminApi, useAdminPermissions, useAdminPaginatedList
    lib/                  # Access, breadcrumbs, action permissions
    mocks/                # Realistic mock DTOs (no mock in pages)
    sections/             # Feature screens (business UI)
    types/                # Staff roles
    ui/                   # Design system primitives
  services/
    admin.service.ts      # Portal gate (verifyAdminAccess)
    admin/*.service.ts    # Data access (mock | live)

apps/backend/
  modules/admin/
    admin-v1.controller.ts   # GET /api/admin/v1/access
    admin.controller.ts      # Legacy GET /admin/access
    admin-panel-roles.ts
```

## Data flow

1. **Page** → `createAdminSectionPage` + `AdminSectionGuard`
2. **Section** → hooks (`useAdminPaginatedList`, `useAdminPermissions`)
3. **Service** → `getAdminDataSource()` === `mock` | `live`
4. **Live** → `AdminApiClient` + `authorizedFetch` (JWT, cookies)
5. **Mock** → `features/admin/mocks/*` + `paginateMock()`

## API separation

| Surface | Prefix | Consumers |
|---------|--------|-----------|
| User / public | `/api/v1/...` (planned) | Holder app, catalog, wallet |
| Admin | `/api/admin/v1/...` | Operator portal only |

Admin financial mutations **must not** use user endpoints.

## ENV (frontend, no secrets)

- `NEXT_PUBLIC_API_BASE_URL` — backend origin
- `NEXT_PUBLIC_ADMIN_API_BASE_URL` — optional dedicated admin origin
- `NEXT_PUBLIC_ADMIN_DATA_SOURCE` — `mock` (default) | `live`
