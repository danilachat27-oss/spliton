# Spliton — User Wallet (Frontend)

## Env

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NEXT_PUBLIC_WALLET_DATA_SOURCE=live
```

## Service

`apps/frontend/services/wallet.service.ts` — единая точка для кошелька, депозитов, выводов, primary orders и secondary market (отдельных `orders.service` / `market.service` нет).

## Routes

| Route | API |
|-------|-----|
| `/dashboard/profile` | `GET /api/v1/wallet`, transactions, `GET /api/v1/market/holdings` |
| `/assets/payouts/deposit` | `GET deposit-address`, `GET deposits` |
| `/assets/payouts/withdraw` | `POST withdrawals`, `GET withdrawals` |

## UX

- Live: `WalletSummaryPanel`, holdings table, deposit address + history, withdrawal create + history.
- Mock: демо-баннер и статические строки только при `WALLET_DATA_SOURCE≠live`.
- Copy: `CopyValueButton` / `copyTextToClipboard` — адрес, deposit/withdrawal id, tx hash, wallet tx id.

## Terminology

Используйте: **юниты (UNT)**, **права на долю дохода**, **держатели**, **начисления**. Не используйте «акции» / «ценные бумаги».
