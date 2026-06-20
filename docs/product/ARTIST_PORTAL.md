# Artist portal (Spliton)

Эмитенты с ролью `ARTIST` и записью `artist_user_links` получают API:

- `GET /api/v1/artist/dashboard`
- `GET /api/v1/artist/releases`
- `GET /api/v1/artist/releases/:id`
- `GET /api/v1/artist/releases/:id/analytics`
- `GET /api/v1/artist/documents`
- `POST /api/v1/artist/release-submissions`

Frontend: `/dashboard/artist`

Admin управляет релизами и submissions через существующие разделы tracks/rounds. Привязка user→artist — через `ArtistUserLink` (seed/ops).
