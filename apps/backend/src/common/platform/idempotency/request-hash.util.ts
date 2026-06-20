import { createHash } from 'node:crypto';

export function hashRequestPayload(payload: unknown): string {
  const normalized =
    payload === undefined
      ? ''
      : JSON.stringify(payload, Object.keys(payload as object).sort());
  return createHash('sha256').update(normalized).digest('hex');
}
