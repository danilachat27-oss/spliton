import { Injectable } from '@nestjs/common';
import { ActorRole, ConsentSource, LegalPolicyType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LegalAuditService {
  constructor(private readonly prisma: PrismaService) {}

  async logUserConsent(params: {
    userId: string;
    policyId: string;
    policyType: LegalPolicyType;
    policyVersion: string;
    source: ConsentSource;
    ip?: string | null;
    userAgent?: string | null;
    metadata?: Prisma.InputJsonValue;
  }): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        actorUserId: params.userId,
        actorRole: ActorRole.USER,
        entityType: 'legal_consent',
        entityId: params.policyId,
        action: 'USER_CONSENT_ACCEPTED',
        afterJsonb: {
          policyType: params.policyType,
          policyVersion: params.policyVersion,
          source: params.source,
          ...(params.metadata && typeof params.metadata === 'object' ? params.metadata : {}),
        },
        ip: params.ip ?? null,
        userAgent: params.userAgent ?? null,
      },
    });
  }
}
