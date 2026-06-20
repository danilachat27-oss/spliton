# Admin Mock Data Map

`NEXT_PUBLIC_ADMIN_DATA_SOURCE=mock` (default)

| Service | Mock file | Key types |
|---------|-----------|-----------|
| adminDashboard.service | admin-dashboard.mock.ts, admin-finance.mock | KPIs, alerts |
| adminUsers.service | admin-users.mock.ts | AdminUserListItem |
| adminTracks.service | admin-tracks.mock.ts | AdminTrackListItem |
| adminRounds.service | admin-rounds.mock.ts | AdminRoundListItem |
| adminWallets.service | admin-finance.mock.ts, admin-wallet-ledger.mock.ts | Wallet + ledger |
| adminDeposits.service | admin-finance.mock.ts | AdminDepositListItem |
| adminWithdrawals.service | admin-finance.mock.ts | AdminWithdrawalListItem |
| adminHoldings.service | admin-holdings.mock.ts | AdminHoldingListItem |
| adminRevenue.service | admin-revenue.mock.ts | AdminRevenueEventListItem |
| adminSecondaryMarket.service | admin-secondary-market.mock.ts | Listings, trades |
| adminPlatformRevenue | admin-platform-revenue.mock.ts | Revenue rows |
| adminSupport.service | admin-support.mock.ts | Tickets |
| adminCompliance.service | admin-compliance.mock.ts | Compliance items |
| adminAudit.service | admin-audit.mock.ts | Audit rows |
| adminSettings.service | inline MOCK_SETTINGS | Fees, limits |
| adminReports.service | — | Generated id only |
| adminRoles.service | admin-users.mock.ts | Aggregated by role |

Legacy: `admin-data.ts` — old tab workspace; do not use in new code.

## Switching to live

Set `NEXT_PUBLIC_ADMIN_DATA_SOURCE=live` and implement backend routes listed in `ADMIN_API_TODO.md`.
