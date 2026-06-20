/** Normalize display name: trim, collapse spaces, underscores to hyphen. */
export function normalizeGenreName(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === '\u2014') return null;
  return trimmed.replace(/_/g, '-').replace(/\s+/g, ' ');
}

/** Case/spacing/punctuation-insensitive key for duplicate detection. */
export function genreMatchKey(raw: string): string {
  const s = normalizeGenreName(raw)?.toLowerCase() ?? '';
  return s
    .replace(/[-_]/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** URL-safe slug from display name. */
export function genreSlugFromName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9\u0400-\u04ff]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 64);
  return base || `genre-${Date.now()}`;
}
