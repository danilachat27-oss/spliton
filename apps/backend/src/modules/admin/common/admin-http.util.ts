import { HttpException, HttpStatus } from '@nestjs/common';
import type { Request } from 'express';

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export function throwAdminError(
  code: string,
  message: string,
  status: HttpStatus = HttpStatus.BAD_REQUEST,
  details?: unknown,
): never {
  throw new HttpException(
    {
      error: { code, message, details },
    } satisfies ApiErrorBody,
    status,
  );
}

export function requestMeta(req: Request): {
  ip: string | null;
  userAgent: string | null;
} {
  const forwarded = req.headers['x-forwarded-for'];
  const ip =
    typeof forwarded === 'string'
      ? (forwarded.split(',')[0]?.trim() ?? null)
      : (req.ip ?? null);
  const userAgent =
    typeof req.headers['user-agent'] === 'string'
      ? req.headers['user-agent']
      : null;
  return { ip, userAgent };
}

export function primaryStaffRole(roles: string[]): string | null {
  const order = [
    'SUPER_ADMIN',
    'ADMIN',
    'COMPLIANCE',
    'ACCOUNTANT',
    'CONTENT_MANAGER',
    'SUPPORT_MANAGER',
    'SUPPORT',
  ];
  for (const code of order) {
    if (roles.includes(code)) return code;
  }
  return null;
}

/** Safe string coercion for unknown admin DTO fields (avoids [object Object]). */
export function coerceUnknownString(value: unknown, fallback = ''): string {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint'
  ) {
    return String(value);
  }
  return fallback;
}

export function formatUnknownError(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === 'string') return err;
  return 'unknown error';
}
