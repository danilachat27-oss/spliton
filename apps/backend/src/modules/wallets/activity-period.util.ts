export const ACTIVITY_PERIODS = [
  '7d',
  '30d',
  '90d',
  '180d',
  '1y',
  'all',
] as const;

export type ActivityPeriod = (typeof ACTIVITY_PERIODS)[number];

export function activityPeriodSince(period: ActivityPeriod): string | undefined {
  const now = Date.now();
  const map: Record<ActivityPeriod, number | null> = {
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
    '180d': 180 * 24 * 60 * 60 * 1000,
    '1y': 365 * 24 * 60 * 60 * 1000,
    all: null,
  };
  const ms = map[period];
  if (ms == null) return undefined;
  return new Date(now - ms).toISOString();
}
