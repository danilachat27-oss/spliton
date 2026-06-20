import { HttpStatus } from '@nestjs/common';
import {
  throwAdminError,
  coerceUnknownString,
} from '../../common/admin-http.util';

export type RoundBodyInput = Record<string, unknown>;

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

export function validateRoundCreateBody(body: RoundBodyInput) {
  const releaseId = parseOptionalString(body.trackId ?? body.releaseId);
  if (!releaseId) {
    throwAdminError(
      'INVALID_ROUND',
      'Release is required',
      HttpStatus.BAD_REQUEST,
    );
  }
  validateRoundUnits(body);
  validateRoundFinancials(body);
  validateRoundDates(body);
}

export function validateRoundUpdateBody(body: RoundBodyInput) {
  validateRoundUnits(body);
  validateRoundFinancials(body);
  validateRoundDates(body);
}

function validateRoundUnits(body: RoundBodyInput) {
  const total = parseNum(body.totalUnits);
  const sold = parseNum(body.soldUnits);
  const available = parseNum(body.availableUnits);
  const unitPrice = parseNum(body.unitPriceUsdt ?? body.primaryUnitPrice);
  const minP = parseNum(body.minPurchaseUnits);
  const maxP = parseNum(body.maxPurchaseUnits);

  if (total !== null && total <= 0) {
    throwAdminError(
      'INVALID_ROUND_UNITS',
      'Total units must be greater than 0',
      HttpStatus.BAD_REQUEST,
    );
  }
  if (sold !== null && sold < 0) {
    throwAdminError(
      'INVALID_ROUND_UNITS',
      'Sold units cannot be negative',
      HttpStatus.BAD_REQUEST,
    );
  }
  if (available !== null && available < 0) {
    throwAdminError(
      'INVALID_ROUND_UNITS',
      'Available units cannot be negative',
      HttpStatus.BAD_REQUEST,
    );
  }
  if (total !== null && sold !== null && sold > total) {
    throwAdminError(
      'INVALID_ROUND_UNITS',
      'Sold units cannot exceed total units',
      HttpStatus.BAD_REQUEST,
    );
  }
  if (total !== null && available !== null && sold !== null) {
    if (Math.abs(available + sold - total) > 0.01) {
      throwAdminError(
        'INVALID_ROUND_UNITS',
        'Available + sold must equal total units',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  if (unitPrice !== null && unitPrice <= 0) {
    throwAdminError(
      'INVALID_ROUND_PRICE',
      'Unit price must be greater than 0',
      HttpStatus.BAD_REQUEST,
    );
  }
  if (minP !== null && minP <= 0) {
    throwAdminError(
      'INVALID_ROUND_UNITS',
      'Minimum purchase must be greater than 0',
      HttpStatus.BAD_REQUEST,
    );
  }
  if (maxP !== null && minP !== null && maxP < minP) {
    throwAdminError(
      'INVALID_ROUND_UNITS',
      'Maximum purchase cannot be less than minimum purchase',
      HttpStatus.BAD_REQUEST,
    );
  }
}

function validateRoundFinancials(body: RoundBodyInput) {
  const target = parseNum(body.raiseTargetUsdt);
  const cap = parseNum(body.hardCapUsdt);
  const raised = parseNum(body.raisedAmountUsdt);

  if (target !== null && target < 0) {
    throwAdminError(
      'INVALID_ROUND_FINANCE',
      'Raise target cannot be negative',
      HttpStatus.BAD_REQUEST,
    );
  }
  if (cap !== null && cap < 0) {
    throwAdminError(
      'INVALID_ROUND_FINANCE',
      'Hard cap cannot be negative',
      HttpStatus.BAD_REQUEST,
    );
  }
  if (target !== null && cap !== null && cap < target) {
    throwAdminError(
      'INVALID_ROUND_FINANCE',
      'Hard cap cannot be less than raise target',
      HttpStatus.BAD_REQUEST,
    );
  }
  if (raised !== null && cap !== null && raised > cap) {
    throwAdminError(
      'INVALID_ROUND_FINANCE',
      'Raised amount cannot exceed hard cap',
      HttpStatus.BAD_REQUEST,
    );
  }
}

function validateRoundDates(body: RoundBodyInput) {
  const start = body.startDate
    ? new Date(coerceUnknownString(body.startDate))
    : null;
  const end = body.endDate ? new Date(coerceUnknownString(body.endDate)) : null;
  if (start && Number.isNaN(start.getTime())) {
    throwAdminError(
      'INVALID_ROUND_DATE',
      'Invalid start date',
      HttpStatus.BAD_REQUEST,
    );
  }
  if (end && Number.isNaN(end.getTime())) {
    throwAdminError(
      'INVALID_ROUND_DATE',
      'Invalid end date',
      HttpStatus.BAD_REQUEST,
    );
  }
  if (start && end && end < start) {
    throwAdminError(
      'INVALID_ROUND_DATE',
      'End date cannot be before start date',
      HttpStatus.BAD_REQUEST,
    );
  }
}

export function assertRoundPublishReady(params: {
  releaseTitle: string;
  releaseArtist: string;
  releaseCoverUrl: string | null;
  releaseArchived: boolean;
  holderSharePct: number;
  unitPrice: number;
  totalUnits: number;
  raiseTarget: number;
  hardCap: number;
  startDate: Date | null;
  hasOtherLiveRound: boolean;
}) {
  const missing: string[] = [];
  if (!params.releaseTitle.trim()) missing.push('release');
  if (!params.releaseArtist.trim() || params.releaseArtist === '—')
    missing.push('artist');
  if (!params.releaseCoverUrl) missing.push('cover');
  if (params.releaseArchived) missing.push('release_archived');
  if (params.unitPrice <= 0) missing.push('unit_price');
  if (params.totalUnits <= 0) missing.push('total_units');
  if (params.raiseTarget <= 0) missing.push('raise_target');
  if (params.hardCap > 0 && params.hardCap < params.raiseTarget)
    missing.push('hard_cap');
  if (!params.startDate) missing.push('start_date');
  const shareSum = params.holderSharePct;
  if (shareSum <= 0) missing.push('shares');
  if (params.hasOtherLiveRound) missing.push('conflicting_live_round');

  if (missing.length) {
    throwAdminError(
      'ROUND_NOT_READY',
      `Round is not ready to publish: ${missing.join(', ')}`,
      HttpStatus.BAD_REQUEST,
    );
  }
}

export { parseNum, parseOptionalString };
