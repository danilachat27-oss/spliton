import { createHash } from 'crypto';
import type { LegalPolicyContentFormat, LegalPolicyType } from '@prisma/client';

export function normalizeLegalPolicyContent(content: string): string {
  return content.replace(/\r\n/g, '\n').trim();
}

export function computeLegalPolicyContentHash(params: {
  type: LegalPolicyType;
  version: string;
  contentFormat: LegalPolicyContentFormat;
  content: string;
}): string {
  const normalized = normalizeLegalPolicyContent(params.content);
  const payload = `${params.type}\n${params.version}\n${params.contentFormat}\n${normalized}`;
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}
