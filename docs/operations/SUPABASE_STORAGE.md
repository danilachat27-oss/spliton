# Supabase Storage (Spliton)

Object storage for Spliton Operator Portal and catalog media. **Backend-only** for sensitive operations — `SUPABASE_SERVICE_ROLE_KEY` must never appear in frontend env.

## Buckets

| Bucket | Visibility | Max size | MIME types | Purpose |
|--------|------------|----------|------------|---------|
| `release-covers` | **Public** | 5 MB | `image/jpeg`, `image/png`, `image/webp` | Release cover art (catalog, admin, rounds) |
| `release-audio` | **Private** | 20 MB | `audio/mpeg`, `audio/mp3`, `audio/wav`, `audio/x-wav`, `audio/mp4`, `audio/aac` | Audio preview fragments |
| `reports` | **Private** | 50 MB | CSV, XLSX, JSON | Admin export jobs |
| `user-documents` | **Private** | 20 MB | JPEG, PNG, WebP, PDF | Reserved / future KYC docs |

### Manual dashboard setup (Supabase)

Create buckets in **Storage → Buckets** if not already present:

1. **release-covers** — enable **Public bucket**
2. **release-audio** — **Private** (if created as public, switch to private in bucket settings)
3. **reports** — **Private**
4. **user-documents** — **Private**

Set file size limits and allowed MIME types in bucket policies/settings to match the table above.

Storage policies: backend uses **service role** for upload/delete/signed URLs. Do not expose service role to browsers. Public covers are read via public URL; private objects require backend signed URLs.

## Path conventions

```txt
release-covers/releases/{releaseId}/cover.{ext}
release-audio/releases/{releaseId}/preview.{ext}
reports/reports/{reportType}/{jobId}.csv
user-documents/  (reserved)
```

## Environment variables (backend)

```env
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=

SUPABASE_STORAGE_RELEASE_COVERS_BUCKET=release-covers
SUPABASE_STORAGE_RELEASE_AUDIO_BUCKET=release-audio
SUPABASE_STORAGE_REPORTS_BUCKET=reports
SUPABASE_STORAGE_USER_DOCUMENTS_BUCKET=user-documents

# Reports worker storage mode
REPORT_STORAGE_MODE=supabase   # db | local | object | supabase
```

Optional legacy S3-compatible mode for reports (`REPORT_STORAGE_MODE=object`) still supported via `REPORT_STORAGE_*` AWS SDK vars.

## Backend services

| Service | Role |
|---------|------|
| `SupabaseStorageService` | Supabase client, upload/download/signed URL |
| `MediaStorageService` | Release cover/audio validation + paths |
| `ReportStorageService` | CSV persistence (`supabase` mode → `reports` bucket) |

## Admin API (staff only)

| Method | Path | Roles |
|--------|------|-------|
| POST | `/api/admin/v1/tracks/:id/cover` | CONTENT_MANAGER, SUPER_ADMIN, ADMIN |
| POST | `/api/admin/v1/tracks/:id/audio-preview` | same |
| GET | `/api/admin/v1/tracks/:id/audio-preview-url` | read staff |
| POST | `/api/admin/v1/uploads/release-cover` | multipart: `releaseId`, `file` |
| POST | `/api/admin/v1/uploads/release-audio` | multipart: `releaseId`, `file` |

Report downloads remain `GET /api/admin/v1/reports/:id/download` — backend reads private object and streams CSV (no public URL).

## Database fields

- `releases.cover_url` — public HTTPS URL after cover upload
- `releases.audio_preview_url` — **storage key** `releases/{id}/preview.ext` for private audio (not a public URL)

On `GET /api/admin/v1/tracks/:id`, backend resolves audio storage keys to short-lived signed URLs.

## Audit events

- `track.cover_update`
- `track.audio_update`

## Frontend rules

- Upload via `FormData` + admin API client (`postForm`) — never Supabase SDK in browser
- No `SUPABASE_SERVICE_ROLE_KEY` in `NEXT_PUBLIC_*`
- URL inputs remain as fallback when storage is not configured

## Security checklist

- [ ] `release-audio` bucket is **private**
- [ ] `reports` bucket is **private**
- [ ] `user-documents` bucket is **private**
- [ ] Service role key only in backend `.env` / secrets manager
- [ ] Report/audio access only through authenticated admin API

## Related docs

- [ENVIRONMENT.md](./ENVIRONMENT.md)
- [REPORT_WORKER_AND_STORAGE.md](./REPORT_WORKER_AND_STORAGE.md)
- [TRACKS_ROUNDS_ADMIN_FLOW.md](../admin/TRACKS_ROUNDS_ADMIN_FLOW.md)
