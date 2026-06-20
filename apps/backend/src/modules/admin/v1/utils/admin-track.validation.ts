import { HttpStatus } from '@nestjs/common';
import {
  throwAdminError,
  coerceUnknownString,
} from '../../common/admin-http.util';

export type AdminTrackBodyInput = Record<string, unknown>;

export type NormalizedTrackShares = {
  holderSharePct: number;
  artistSharePct: number;
  platformSharePct: number;
};

const URL_FIELDS = [
  'coverUrl',
  'audioPreviewUrl',
  'spotifyUrl',
  'appleMusicUrl',
  'youtubeUrl',
  'yandexMusicUrl',
] as const;

const RELEASE_TYPES = new Set(['single', 'ep', 'album']);

function parseNum(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(
    coerceUnknownString(value).replace(/\s/g, '').replace(',', '.'),
  );
  return Number.isFinite(n) ? n : null;
}

function parseOptionalString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = coerceUnknownString(value).trim();
  return s.length ? s : null;
}

function isValidHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

export function normalizeTrackShares(
  body: AdminTrackBodyInput,
): NormalizedTrackShares | null {
  const holder =
    parseNum(body.holderSharePct) ?? parseNum(body.revenueSharePoolPct);
  const artist = parseNum(body.artistSharePct);
  const platform =
    parseNum(body.platformSharePct) ?? parseNum(body.distributionSharePct);

  if (holder === null && artist === null && platform === null) return null;
  return {
    holderSharePct: holder ?? 0,
    artistSharePct: artist ?? 0,
    platformSharePct: platform ?? 0,
  };
}

export function assertTrackSharesSum(
  shares: NormalizedTrackShares,
  required = false,
) {
  const sum =
    shares.holderSharePct + shares.artistSharePct + shares.platformSharePct;
  const allSet =
    shares.holderSharePct > 0 ||
    shares.artistSharePct > 0 ||
    shares.platformSharePct > 0;
  if (!allSet && !required) return;
  if (Math.abs(sum - 100) > 0.01) {
    throwAdminError(
      'INVALID_TRACK_SHARES',
      `Share split must total 100% (got ${sum.toFixed(2)}%)`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export function validateTrackUrls(body: AdminTrackBodyInput) {
  for (const key of URL_FIELDS) {
    const raw = body[key];
    if (raw === null || raw === undefined || raw === '') continue;
    const value = coerceUnknownString(raw).trim();
    if (key === 'audioPreviewUrl' && value.startsWith('releases/')) continue;
    if (!isValidHttpUrl(value)) {
      throwAdminError(
        'INVALID_TRACK_URL',
        `Invalid URL for ${key}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}

export function validateTrackCreateBody(body: AdminTrackBodyInput) {
  const title = parseOptionalString(body.title);
  if (!title) {
    throwAdminError(
      'INVALID_TRACK',
      'Title is required',
      HttpStatus.BAD_REQUEST,
    );
  }
  const artist = parseOptionalString(body.artist);
  if (!artist) {
    throwAdminError(
      'INVALID_TRACK',
      'Artist is required',
      HttpStatus.BAD_REQUEST,
    );
  }

  const totalUnits = parseNum(body.totalUnits);
  if (totalUnits !== null && totalUnits <= 0) {
    throwAdminError(
      'INVALID_TRACK_UNITS',
      'Total units must be greater than 0',
      HttpStatus.BAD_REQUEST,
    );
  }

  const primaryUnitPrice = parseNum(body.primaryUnitPrice);
  if (primaryUnitPrice !== null && primaryUnitPrice < 0) {
    throwAdminError(
      'INVALID_TRACK_PRICE',
      'Unit price cannot be negative',
      HttpStatus.BAD_REQUEST,
    );
  }

  const releaseType = parseOptionalString(body.releaseType);
  if (releaseType && !RELEASE_TYPES.has(releaseType)) {
    throwAdminError(
      'INVALID_TRACK_TYPE',
      'Invalid release type',
      HttpStatus.BAD_REQUEST,
    );
  }

  validateTrackUrls(body);

  const shares = normalizeTrackShares(body);
  if (shares) assertTrackSharesSum(shares, false);

  validateUnitsConstraints(body);
}

export function validateTrackUpdateBody(body: AdminTrackBodyInput) {
  if (body.title !== undefined && !parseOptionalString(body.title)) {
    throwAdminError(
      'INVALID_TRACK',
      'Title cannot be empty',
      HttpStatus.BAD_REQUEST,
    );
  }
  if (body.artist !== undefined && !parseOptionalString(body.artist)) {
    throwAdminError(
      'INVALID_TRACK',
      'Artist cannot be empty',
      HttpStatus.BAD_REQUEST,
    );
  }

  const totalUnits = parseNum(body.totalUnits);
  if (totalUnits !== null && totalUnits <= 0) {
    throwAdminError(
      'INVALID_TRACK_UNITS',
      'Total units must be greater than 0',
      HttpStatus.BAD_REQUEST,
    );
  }

  const primaryUnitPrice = parseNum(body.primaryUnitPrice);
  if (primaryUnitPrice !== null && primaryUnitPrice < 0) {
    throwAdminError(
      'INVALID_TRACK_PRICE',
      'Unit price cannot be negative',
      HttpStatus.BAD_REQUEST,
    );
  }

  const releaseType = parseOptionalString(body.releaseType);
  if (releaseType && !RELEASE_TYPES.has(releaseType)) {
    throwAdminError(
      'INVALID_TRACK_TYPE',
      'Invalid release type',
      HttpStatus.BAD_REQUEST,
    );
  }

  validateTrackUrls(body);

  const shares = normalizeTrackShares(body);
  if (shares) assertTrackSharesSum(shares, true);

  validateUnitsConstraints(body);
}

function validateUnitsConstraints(body: AdminTrackBodyInput) {
  const total = parseNum(body.totalUnits);
  const sold = parseNum(body.soldUnits);
  const available = parseNum(body.availableUnits);
  const minPurchase = parseNum(body.minPurchaseUnits);
  const maxPurchase = parseNum(body.maxPurchaseUnits);

  if (sold !== null && sold < 0) {
    throwAdminError(
      'INVALID_TRACK_UNITS',
      'Sold units cannot be negative',
      HttpStatus.BAD_REQUEST,
    );
  }
  if (available !== null && available < 0) {
    throwAdminError(
      'INVALID_TRACK_UNITS',
      'Available units cannot be negative',
      HttpStatus.BAD_REQUEST,
    );
  }
  if (total !== null && sold !== null && sold > total) {
    throwAdminError(
      'INVALID_TRACK_UNITS',
      'Sold units cannot exceed total units',
      HttpStatus.BAD_REQUEST,
    );
  }
  if (total !== null && available !== null && available > total) {
    throwAdminError(
      'INVALID_TRACK_UNITS',
      'Available units cannot exceed total units',
      HttpStatus.BAD_REQUEST,
    );
  }
  if (minPurchase !== null && minPurchase < 0) {
    throwAdminError(
      'INVALID_TRACK_UNITS',
      'Minimum purchase cannot be negative',
      HttpStatus.BAD_REQUEST,
    );
  }
  if (maxPurchase !== null && maxPurchase < 0) {
    throwAdminError(
      'INVALID_TRACK_UNITS',
      'Maximum purchase cannot be negative',
      HttpStatus.BAD_REQUEST,
    );
  }
  if (
    minPurchase !== null &&
    maxPurchase !== null &&
    minPurchase > maxPurchase
  ) {
    throwAdminError(
      'INVALID_TRACK_UNITS',
      'Minimum purchase cannot exceed maximum purchase',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export function parseReleaseDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === '') return null;
  const d = new Date(coerceUnknownString(value));
  if (Number.isNaN(d.getTime())) {
    throwAdminError(
      'INVALID_TRACK_DATE',
      'Invalid release date',
      HttpStatus.BAD_REQUEST,
    );
  }
  return d;
}

export { parseNum, parseOptionalString };
