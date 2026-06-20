import { randomBytes } from 'crypto';

/** Unique e2e email — avoids collisions when tests run in parallel or share a DB. */
export function e2eEmail(prefix: string): string {
  const suffix = randomBytes(6).toString('hex');
  return `${prefix}-${Date.now()}-${suffix}@example.com`;
}

/** Short unique trading symbol (max ~12 chars for typical DB limits). */
export function e2eSymbol(prefix = 'E'): string {
  return `${prefix}${randomBytes(3).toString('hex').toUpperCase()}`;
}

/** URL-safe slug fragment for releases. */
export function e2eSlug(prefix: string): string {
  return `${prefix}-${Date.now()}-${randomBytes(4).toString('hex')}`;
}

/** Idempotency / correlation keys. */
export function e2eKey(prefix: string): string {
  return `${prefix}-${randomBytes(8).toString('hex')}`;
}
