const PLACEHOLDER_MARKERS = [
  'lawyer_review_notice',
  'lorem ipsum',
  'placeholder',
  'draft only',
  'not legal advice',
  'requires lawyer review',
  'needs review',
  'todo',
  'fixme',
  'требует проверки юристом',
  'черновик spliton',
  'requires legal review',
] as const;

export const REQUIRED_POLICY_MIN_CONTENT_LENGTH = 500;

export type PolicyQualityResult = {
  publishable: boolean;
  reasons: string[];
};

export function assessPolicyContentQuality(
  content: string,
  options?: { minLength?: number; required?: boolean },
): PolicyQualityResult {
  const minLength = options?.minLength ?? REQUIRED_POLICY_MIN_CONTENT_LENGTH;
  const trimmed = content.trim();
  const lower = trimmed.toLowerCase();
  const reasons: string[] = [];

  if (!trimmed) reasons.push('empty content');
  if (trimmed.length < minLength) {
    reasons.push(`content shorter than ${minLength} characters`);
  }
  for (const marker of PLACEHOLDER_MARKERS) {
    if (lower.includes(marker)) reasons.push(`contains marker: ${marker}`);
  }

  return { publishable: reasons.length === 0, reasons };
}