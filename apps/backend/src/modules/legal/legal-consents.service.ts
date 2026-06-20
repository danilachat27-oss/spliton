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

export type ConsentMeta = {
  ip?: string | null;
  userAgent?: string | null;
};

@Injectable()
export class LegalConsentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly legalAudit: LegalAuditService,
  ) {}

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
      const row = await this.prisma.userLegalConsent.upsert({
        where: {
          userId_policyType_policyVersion: {
            userId,
            policyType: type,
            policyVersion: policy.version,
          },
        },
        create: {
          userId,
          policyId: policy.id,
          policyType: type,
          policyVersion: policy.version,
          source,
          ip: meta?.ip ?? null,
          userAgent: meta?.userAgent ?? null,
        },
        update: {
          acceptedAt: new Date(),
          source,
          ip: meta?.ip ?? null,
          userAgent: meta?.userAgent ?? null,
        },
      });
      results.push(row);
      await this.legalAudit.logUserConsent({
        userId,
        policyId: policy.id,
        policyType: type,
        policyVersion: policy.version,
        source,
        ip: meta?.ip ?? null,
        userAgent: meta?.userAgent ?? null,
      });
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

  async getMissingConsents(userId: string, source: ConsentSource) {
    const required = CONSENT_REQUIREMENTS[source] ?? [];
    const missing: Array<{
      type: LegalPolicyType;
      activeVersion: string;
      policyId: string;
      title: string;
    }> = [];

    for (const type of required) {
      const active = await this.prisma.legalPolicy.findFirst({
        where: { type, status: LegalPolicyStatus.ACTIVE },
        orderBy: { publishedAt: 'desc' },
      });
      if (!active?.requiresUserConsent) continue;

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
        });
      }
    }
    return missing;
  }

  async assertConsentsForSource(
    userId: string,
    source: ConsentSource,
  ): Promise<void> {
    const missing = await this.getMissingConsents(userId, source);
    if (missing.length === 0) return;
    throwAppError(
      ErrorCodes.COMPLIANCE_RESTRICTED,
      'Требуется принять актуальные юридические документы Spliton',
      HttpStatus.FORBIDDEN,
      {
        blockingCode: 'CONSENT_REQUIRED',
        missingPolicies: missing.map((m) => ({
          type: m.type,
          version: m.activeVersion,
          policyId: m.policyId,
        })),
        policyLinks: missing.map((m) => `/legal/${m.type.toLowerCase()}`),
      },
    );
  }

  async acceptPolicies(
    userId: string,
    policyIds: string[],
    source: ConsentSource,
    meta?: ConsentMeta,
  ) {
    for (const policyId of policyIds) {
      const policy = await this.prisma.legalPolicy.findUnique({
        where: { id: policyId },
      });
      if (!policy || policy.status !== LegalPolicyStatus.ACTIVE) {
        throwAppError(
          ErrorCodes.VALIDATION_ERROR,
          'Policy is not active',
          HttpStatus.BAD_REQUEST,
        );
      }
      await this.prisma.userLegalConsent.upsert({
        where: {
          userId_policyType_policyVersion: {
            userId,
            policyType: policy!.type,
            policyVersion: policy!.version,
          },
        },
        create: {
          userId,
          policyId: policy!.id,
          policyType: policy!.type,
          policyVersion: policy!.version,
          source,
          ip: meta?.ip ?? null,
          userAgent: meta?.userAgent ?? null,
        },
        update: {
          acceptedAt: new Date(),
          source,
          ip: meta?.ip ?? null,
          userAgent: meta?.userAgent ?? null,
        },
      });
      await this.legalAudit.logUserConsent({
        userId,
        policyId: policy!.id,
        policyType: policy!.type,
        policyVersion: policy!.version,
        source,
        ip: meta?.ip ?? null,
        userAgent: meta?.userAgent ?? null,
      });
    }
    return this.listUserConsents(userId);
  }
}
