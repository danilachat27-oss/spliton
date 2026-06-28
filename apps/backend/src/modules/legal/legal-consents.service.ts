import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ConsentSource,
  LegalPolicyStatus,
  LegalPolicyType,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAppError } from '../../common/platform/errors/throw-app-error';
import { ErrorCodes } from '../../common/platform/errors/error-codes';
import { CONSENT_REQUIREMENTS } from './legal-consent-requirements';
import { LegalAuditService } from './legal-audit.service';
import { computeLegalPolicyContentHash } from './legal-content-hash.util';
import {
  defaultTitleForPolicyType,
  isFinancialConsentSource,
  type MissingConsentItem,
} from './legal-consent.types';

export type ConsentMeta = {
  ip?: string | null;
  userAgent?: string | null;
};

type ActivePolicyRow = {
  id: string;
  type: LegalPolicyType;
  version: string;
  status: LegalPolicyStatus;
  content: string;
  contentFormat: import('@prisma/client').LegalPolicyContentFormat;
  contentHash: string | null;
  requiresUserConsent: boolean;
};

@Injectable()
export class LegalConsentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly legalAudit: LegalAuditService,
  ) {}

  private contentHashForPolicy(policy: ActivePolicyRow): string {
    return (
      policy.contentHash ??
      computeLegalPolicyContentHash({
        type: policy.type,
        version: policy.version,
        contentFormat: policy.contentFormat,
        content: policy.content,
      })
    );
  }

  private async assertPolicyAcceptableForSource(
    userId: string,
    policy: ActivePolicyRow,
    source: ConsentSource,
  ): Promise<void> {
    if (policy.status !== LegalPolicyStatus.ACTIVE) {
      throwAppError(
        ErrorCodes.VALIDATION_ERROR,
        'Policy is not active',
        HttpStatus.BAD_REQUEST,
      );
    }

    const activeForType = await this.prisma.legalPolicy.findFirst({
      where: { type: policy.type, status: LegalPolicyStatus.ACTIVE },
      orderBy: { publishedAt: 'desc' },
    });
    if (!activeForType || activeForType.id !== policy.id) {
      throwAppError(
        ErrorCodes.VALIDATION_ERROR,
        'Policy is not the current active version',
        HttpStatus.BAD_REQUEST,
      );
    }

    const requiredTypes = CONSENT_REQUIREMENTS[source] ?? [];
    if (requiredTypes.length > 0) {
      if (!requiredTypes.includes(policy.type)) {
        throwAppError(
          ErrorCodes.VALIDATION_ERROR,
          'Policy type is not required for this action',
          HttpStatus.BAD_REQUEST,
        );
      }
      return;
    }

    if (source === ConsentSource.PROFILE) {
      const missing = await this.getAllMissingPolicyIds(userId);
      if (!missing.has(policy.id)) {
        throwAppError(
          ErrorCodes.VALIDATION_ERROR,
          'Policy is not required for this user',
          HttpStatus.BAD_REQUEST,
        );
      }
    }
  }

  private async getAllMissingPolicyIds(userId: string): Promise<Set<string>> {
    const ids = new Set<string>();
    for (const source of [
      ConsentSource.REGISTER,
      ConsentSource.PRIMARY_PURCHASE,
      ConsentSource.SECONDARY_TRADE,
      ConsentSource.WITHDRAWAL,
    ] as ConsentSource[]) {
      const missing = await this.getMissingConsents(userId, source);
      for (const item of missing) {
        if (item.policyId) ids.add(item.policyId);
      }
    }
    return ids;
  }

  private async upsertConsent(
    userId: string,
    policy: ActivePolicyRow,
    source: ConsentSource,
    meta?: ConsentMeta,
  ) {
    const acceptedContentHash = this.contentHashForPolicy(policy);
    await this.prisma.userLegalConsent.upsert({
      where: {
        userId_policyType_policyVersion: {
          userId,
          policyType: policy.type,
          policyVersion: policy.version,
        },
      },
      create: {
        userId,
        policyId: policy.id,
        policyType: policy.type,
        policyVersion: policy.version,
        acceptedContentHash,
        source,
        ip: meta?.ip ?? null,
        userAgent: meta?.userAgent ?? null,
      },
      update: {
        acceptedAt: new Date(),
        acceptedContentHash,
        source,
        ip: meta?.ip ?? null,
        userAgent: meta?.userAgent ?? null,
      },
    });
    await this.legalAudit.logUserConsent({
      userId,
      policyId: policy.id,
      policyType: policy.type,
      policyVersion: policy.version,
      source,
      ip: meta?.ip ?? null,
      userAgent: meta?.userAgent ?? null,
      metadata: { acceptedContentHash },
    });
  }

  async recordConsentsForSource(
    userId: string,
    source: ConsentSource,
    meta?: ConsentMeta,
    policyTypes?: LegalPolicyType[],
  ) {
    const types = policyTypes ?? CONSENT_REQUIREMENTS[source] ?? [];
    const results = [];
    for (const type of types) {
      const policy = await this.prisma.legalPolicy.findFirst({
        where: { type, status: LegalPolicyStatus.ACTIVE },
        orderBy: { publishedAt: 'desc' },
      });
      if (!policy) continue;
      await this.upsertConsent(userId, policy, source, meta);
      const row = await this.prisma.userLegalConsent.findUnique({
        where: {
          userId_policyType_policyVersion: {
            userId,
            policyType: type,
            policyVersion: policy.version,
          },
        },
      });
      if (row) results.push(row);
    }
    return results;
  }

  async listUserConsents(userId: string) {
    return this.prisma.userLegalConsent.findMany({
      where: { userId },
      orderBy: { acceptedAt: 'desc' },
      include: { policy: { select: { title: true, type: true, version: true } } },
    });
  }

  async getMissingConsents(userId: string, source: ConsentSource): Promise<MissingConsentItem[]> {
    const required = CONSENT_REQUIREMENTS[source] ?? [];
    const missing: MissingConsentItem[] = [];

    for (const type of required) {
      const active = await this.prisma.legalPolicy.findFirst({
        where: { type, status: LegalPolicyStatus.ACTIVE },
        orderBy: { publishedAt: 'desc' },
      });

      if (!active) {
        if (isFinancialConsentSource(source)) {
          missing.push({
            type,
            title: defaultTitleForPolicyType(type),
            reason: 'POLICY_NOT_PUBLISHED',
          });
        }
        continue;
      }

      if (!active.requiresUserConsent) continue;

      const accepted = await this.prisma.userLegalConsent.findUnique({
        where: {
          userId_policyType_policyVersion: {
            userId,
            policyType: type,
            policyVersion: active.version,
          },
        },
      });
      if (!accepted) {
        missing.push({
          type,
          activeVersion: active.version,
          policyId: active.id,
          title: active.title,
          reason: 'CONSENT_REQUIRED',
        });
      }
    }
    return missing;
  }

  getUnpublishedPolicyTypes(missing: MissingConsentItem[]): LegalPolicyType[] {
    return missing
      .filter((m) => m.reason === 'POLICY_NOT_PUBLISHED')
      .map((m) => m.type);
  }

  async assertConsentsForSource(
    userId: string,
    source: ConsentSource,
  ): Promise<void> {
    const missing = await this.getMissingConsents(userId, source);
    const unpublished = this.getUnpublishedPolicyTypes(missing);
    if (unpublished.length > 0 && isFinancialConsentSource(source)) {
      throwAppError(
        ErrorCodes.COMPLIANCE_RESTRICTED,
        'Юридические документы обновляются. Операция временно недоступна.',
        HttpStatus.FORBIDDEN,
        {
          blockingCode: 'LEGAL_POLICY_MISSING',
          missingPolicyTypes: unpublished,
        },
      );
    }

    const consentMissing = missing.filter((m) => m.reason === 'CONSENT_REQUIRED');
    if (consentMissing.length === 0) return;
    throwAppError(
      ErrorCodes.COMPLIANCE_RESTRICTED,
      'Требуется принять актуальные юридические документы Spliton',
      HttpStatus.FORBIDDEN,
      {
        blockingCode: 'CONSENT_REQUIRED',
        missingPolicies: consentMissing.map((m) => ({
          type: m.type,
          version: m.activeVersion,
          policyId: m.policyId,
        })),
        policyLinks: consentMissing.map((m) => `/legal/${m.type.toLowerCase()}`),
      },
    );
  }

  async acceptPolicies(
    userId: string,
    policyIds: string[],
    source: ConsentSource,
    meta?: ConsentMeta,
  ) {
    const uniqueIds = [...new Set(policyIds)];
    for (const policyId of uniqueIds) {
      const policy = await this.prisma.legalPolicy.findUnique({
        where: { id: policyId },
      });
      if (!policy) {
        throwAppError(
          ErrorCodes.VALIDATION_ERROR,
          'Policy not found',
          HttpStatus.BAD_REQUEST,
        );
      }
      await this.assertPolicyAcceptableForSource(userId, policy!, source);
      await this.upsertConsent(userId, policy!, source, meta);
    }
    return this.listUserConsents(userId);
  }
}
