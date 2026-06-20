import { HttpException, HttpStatus } from '@nestjs/common';
import type { AppErrorCode } from './error-codes';

export type AppErrorBody = {
  error: {
    code: AppErrorCode | string;
    message: string;
    details?: unknown;
  };
};

export function throwAppError(
  code: AppErrorCode | string,
  message: string,
  status: HttpStatus = HttpStatus.BAD_REQUEST,
  details?: unknown,
): never {
  throw new HttpException(
    {
      error: { code, message, details },
    } satisfies AppErrorBody,
    status,
  );
}

export function isAppErrorBody(value: unknown): value is AppErrorBody {
  if (!value || typeof value !== 'object') return false;
  const err = (value as AppErrorBody).error;
  return Boolean(err && typeof err.code === 'string' && typeof err.message === 'string');
}
