/** Spliton Supabase Storage — bucket names and validation limits. */

export const SUPABASE_BUCKETS = {
  releaseCovers: 'release-covers',
  releaseAudio: 'release-audio',
  reports: 'reports',
  userDocuments: 'user-documents',
  newsImages: 'news-images',
} as const;

export const NEWS_IMAGE_LIMITS = {
  maxBytes: 5 * 1024 * 1024,
  mimeTypes: new Set(['image/jpeg', 'image/png', 'image/webp']),
  extensions: new Set(['jpg', 'jpeg', 'png', 'webp']),
} as const;

export const RELEASE_COVER_LIMITS = {
  maxBytes: 5 * 1024 * 1024,
  mimeTypes: new Set(['image/jpeg', 'image/png', 'image/webp']),
  extensions: new Set(['jpg', 'jpeg', 'png', 'webp']),
} as const;

export const RELEASE_AUDIO_LIMITS = {
  maxBytes: 20 * 1024 * 1024,
  mimeTypes: new Set([
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-wav',
    'audio/mp4',
    'audio/aac',
  ]),
  extensions: new Set(['mp3', 'wav', 'm4a', 'aac', 'mp4']),
} as const;

export const REPORT_FILE_LIMITS = {
  maxBytes: 50 * 1024 * 1024,
  mimeTypes: new Set([
    'text/csv',
    'application/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/json',
  ]),
} as const;

export const USER_DOCUMENT_LIMITS = {
  maxBytes: 20 * 1024 * 1024,
  mimeTypes: new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/pdf',
  ]),
} as const;

/** Private audio preview keys stored in `audio_preview_url` without http prefix. */
export const AUDIO_STORAGE_KEY_PREFIX = 'releases/';

export function isAudioStorageKey(value: string | null | undefined): boolean {
  return Boolean(value?.trim().startsWith(AUDIO_STORAGE_KEY_PREFIX));
}

export function newsCoverPath(newsId: string, ext: string): string {
  return `news/${newsId}/cover.${ext}`;
}

export function releaseCoverPath(releaseId: string, ext: string): string {
  return `releases/${releaseId}/cover.${ext}`;
}

export function releaseAudioPath(releaseId: string, ext: string): string {
  return `releases/${releaseId}/preview.${ext}`;
}

export function reportStoragePath(
  type: string,
  jobId: string,
  ext = 'csv',
): string {
  return `reports/${type}/${jobId}.${ext}`;
}
