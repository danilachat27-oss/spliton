# User receipts and statements (Spliton)

## User documents

| Document | Endpoint | Format |
|----------|----------|--------|
| Deposit receipt | `POST /api/v1/wallet/deposits/:id/receipt` | PDF |
| Wallet statement | `POST /api/v1/documents/statement` | PDF or XLSX |
| List documents | `GET /api/v1/documents` | — |
| Download | `GET /api/v1/documents/:id/download` | PDF/XLSX |

## Security

- Owner-only access (JWT)
- No public URLs — download via authenticated API
- Documents expire after 7 days
- Wallet addresses masked in PDF receipts
- Download count tracked

## Storage

`generated_documents` table — file payload as base64 in DB (staging/dev). Production: extend to Supabase `user-documents` bucket.

## Admin

Operators use admin reports for bulk exports. User receipts are single-operation PDFs generated on demand.
