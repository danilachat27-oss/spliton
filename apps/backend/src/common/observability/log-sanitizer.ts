const SENSITIVE_KEY =
  /password|token|secret|authorization|cookie|api[_-]?key|service[_-]?role|jwt|refresh|reset|private/i;

const BEARER = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi;
const JWT_LIKE = /eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g;

export function sanitizeLogValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (typeof value === 'string') {
    return value
      .replace(BEARER, 'Bearer [REDACTED]')
      .replace(JWT_LIKE, '[REDACTED_JWT]');
  }
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeLogValue(item));
  }
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEY.test(key)) {
        out[key] = '[REDACTED]';
      } else {
        out[key] = sanitizeLogValue(val);
      }
    }
    return out;
  }
  return value;
}

export function isTechnicalClientMessage(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('prisma') ||
    lower.includes('sql') ||
    lower.includes('stack') ||
    lower.includes('internal server error') ||
    lower.includes('undefined') ||
    lower.includes('[object object]') ||
    lower.includes('econnrefused') ||
    lower.includes('query engine')
  );
}

export function sanitizeErrorMessage(message: string): string {
  if (isTechnicalClientMessage(message)) {
    return 'Internal server error';
  }
  return String(sanitizeLogValue(message));
}
