# Spliton — Frontend Smoke Checklist

Перед релизом при `NEXT_PUBLIC_*_DATA_SOURCE=live` и рабочем backend.

## Auth

- [ ] Login / logout
- [ ] Register + verify email (if enabled)
- [ ] Staff: `/admin/login` → dashboard

## Wallet (user)

- [ ] Profile: balances, transactions load
- [ ] Deposit: address copy, history, unavailable state if no address
- [ ] Withdraw: validation, fee, insufficient balance, success
- [ ] Copy: address, tx id, withdrawal id

## Catalog & primary

- [ ] `/catalog` shows releases from API (UUID ids)
- [ ] `/catalog/buy/[uuid]`: round info, purchase, insufficient balance
- [ ] Mock catalog id in live mode → buy page 404 (expected)

## Secondary market

- [ ] Guest sees login prompt on market/orders/history in live mode
- [ ] Listings, create/cancel listing, buy listing
- [ ] Cannot buy own listing

## Admin (SUPER_ADMIN)

- [ ] Users list KPI + user detail tabs
- [ ] Role assign/remove (SUPER_ADMIN confirm)
- [ ] Reports generate + download
- [ ] Fees read (ADMIN) / patch (SUPER_ADMIN only)
- [ ] Forbidden section shows Access Denied + nav links

## Regression

- [ ] Backend e2e smoke (see FRONTEND_LIVE_AUDIT.md)
