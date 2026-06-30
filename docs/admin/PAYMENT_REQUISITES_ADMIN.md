# Admin: Payment requisites (Deposit)

UI: **`/admin/payment-requisites`**
API: **`/api/admin/v1/payment-requisites`**

## Purpose

Manage everything the user sees on **`/assets/payouts/deposit`** without storing private keys.

- **USDT TRC20** network settings (contract, limits, timings, warnings, instructions RU/EN/ES/PT)
- **Personal address pool** (`deposit_address_pool` -> `user_deposit_addresses`) — not a shared hot wallet
- Preview (safe placeholder address; does not assign pool rows)
- Change history (`deposit_requisite_change_history` + admin audit log)

## RBAC

| Role | View | Edit settings / pool |
|------|------|----------------------|
| SUPER_ADMIN | yes | yes |
| ACCOUNTANT | yes | yes |
| ADMIN | yes | no |
| COMPLIANCE | yes | no |
| BUSINESS_ANALYST | yes | no |
| SUPPORT_MANAGER | yes | no |
| SUPPORT | yes | no |
| Regular user | no | no |

Legacy treasury endpoints under `/api/admin/v1/treasury/deposit-*` remain for compatibility.

## Network settings

`GET/PATCH /api/admin/v1/payment-requisites/network-settings`

Fields include: `networkDisplayName`, `tokenContractAddress`, `minDepositAmount`, `maxDepositAmount`, `minConfirmations`, credit/withdraw minutes, explorer URL templates, warnings and instructions (RU/EN/ES/PT), `depositEnabled`, `status` (DRAFT / ACTIVE / ARCHIVED / DISABLED), `poolLowThreshold`.

**Publish rule:** cannot set `status=ACTIVE` or enable deposits unless network, contract, and min amount are valid.

Dangerous PATCH fields require **`reason`** in body: contract, confirmations, provider mode, deposit/withdraw flags, status.

## Address pool

`GET /api/admin/v1/payment-requisites/address-pool`

`POST .../address-pool` — add one TRC20 address (validated, duplicate rejected)

`POST .../address-pool/bulk` — bulk add

`POST .../address-pool/:id/disable|enable|archive`

- Assigned addresses cannot be deleted; disable/archive only when safe
- Low pool warning when `available < poolLowThreshold`

## Preview & history

`GET .../preview?lang=ru|en|es|pt` — user-facing payload with placeholder address

`GET .../history?limit=30` — recent requisite changes

Full audit: **`/admin/audit-log`**

## User API (unchanged route)

`GET /api/v1/wallet/deposit-info?lang={locale}`

Returns only **ACTIVE** + **depositEnabled** settings. Errors: `DEPOSIT_DISABLED`, `DEPOSIT_ADDRESS_UNAVAILABLE`.

## Security

- Store **public** data only: network, wallet address, contract, memo/tag, instructions, explorer URLs
- Never store private keys, seed phrases, or API secrets in DB or admin UI

## Manual QA before production

1. Apply migration: `npm run prisma:migrate:deploy`
2. Add pool addresses; confirm available count > threshold
3. Set settings to ACTIVE, deposit enabled, valid contract
4. Open `/assets/payouts/deposit` as user — address, QR, warnings, min amount from API
5. Disable deposits — user sees disabled state
6. Empty pool — user sees unavailable state with retry/support
7. Verify SUPPORT can view but not PATCH pool/settings