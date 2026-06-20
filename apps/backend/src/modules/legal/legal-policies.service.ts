import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import {
  LegalPolicyStatus,
  LegalPolicyType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAdminError } from '../admin/common/admin-http.util';
import { DEFAULT_POLICY_SEEDS } from './legal-policy-seed.content';

@Injectable()
export class LegalPoliciesService implements OnModuleInit {
  constructor(private readonly prisma: PrismaService) {}

  async onModuleInit(): Promise<void> {
    if (process.env.SEED_LEGAL_POLICIES_ON_BOOT !== 'true') return;
    await this.seedDefaultPoliciesIfEmpty();
  }

  async seedDefaultPoliciesIfEmpty(): Promise<number> {
    const count = await this.prisma.legalPolicy.count();
    if (count > 0) return 0;
    const now = new Date();
    for (const seed of DEFAULT_POLICY_SEEDS) {
      await this.prisma.legalPolicy.create({
        data: {
          type: seed.type,
          version: seed.version,
          title: seed.title,
          content: seed.content,
          status: LegalPolicyStatus.ACTIVE,
          effectiveAt: now,
          publishedAt: now,
          requiresUserConsent: true,
        },
      });
    }
    return DEFAULT_POLICY_SEEDS.length;
  }

  async listActivePublic() {
    const rows = await this.prisma.legalPolicy.findMany({
      where: { status: LegalPolicyStatus.ACTIVE },
      orderBy: [{ type: 'asc' }, { publishedAt: 'desc' }],
    });
    const byType = new Map<LegalPolicyType, (typeof rows)[0]>();
    for (const row of rows) {
      if (!byType.has(row.type)) byType.set(row.type, row);
    }
    return [...byType.values()].map((p) => this.mapPublic(p));
  }

  async getActiveByType(type: LegalPolicyType) {
    const row = await this.prisma.legalPolicy.findFirst({
      where: { type, status: LegalPolicyStatus.ACTIVE },
      orderBy: { publishedAt: 'desc' },
    });
    if (!row) {
      throwAdminError(
        'POLICY_NOT_FOUND',
        'Active policy not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return this.mapPublic(row);
  }

  async listAdmin(filters?: { status?: LegalPolicyStatus; type?: LegalPolicyType }) {
    return this.prisma.legalPolicy.findMany({
      where: {
        ...(filters?.status ? { status: filters.status } : {}),
        ...(filters?.type ? { type: filters.type } : {}),
      },
      orderBy: [{ type: 'asc' }, { version: 'desc' }],
    });
  }

  async createDraft(
    data: {
      type: LegalPolicyType;
      version: string;
      title: string;
      content: string;
      requiresUserConsent?: boolean;
    },
    actorUserId: string,
  ) {
    try {
      return await this.prisma.legalPolicy.create({
        data: {
          ...data,
          status: LegalPolicyStatus.DRAFT,
          createdByUserId: actorUserId,
          updatedByUserId: actorUserId,
        },
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        throwAdminError(
          'POLICY_VERSION_EXISTS',
          'Policy version already exists for this type',
          HttpStatus.CONFLICT,
        );
      }
      throw e;
    }
  }

  async updateDraft(
    id: string,
    data: Partial<{
      title: string;
      content: string;
      version: string;
      requiresUserConsent: boolean;
    }>,
    actorUserId: string,
  ) {
    const row = await this.prisma.legalPolicy.findUnique({ where: { id } });
    if (!row || row.status === LegalPolicyStatus.ARCHIVED) {
      throwAdminError('POLICY_NOT_FOUND', 'Policy not found', HttpStatus.NOT_FOUND);
    }
    if (row.status === LegalPolicyStatus.ACTIVE) {
      throwAdminError(
        'POLICY_IMMUTABLE',
        'Archive active policy before editing; create new version',
        HttpStatus.CONFLICT,
      );
    }
    return this.prisma.legalPolicy.update({
      where: { id },
      data: { ...data, updatedByUserId: actorUserId },
    });
  }

  async publish(id: string, actorUserId: string) {
    const row = await this.prisma.legalPolicy.findUnique({ where: { id } });
    if (!row) {
      throwAdminError('POLICY_NOT_FOUND', 'Policy not found', HttpStatus.NOT_FOUND);
    }
    const now = new Date();
    return this.prisma.$transaction(async (tx) => {
      await tx.legalPolicy.updateMany({
        where: { type: row.type, status: LegalPolicyStatus.ACTIVE },
        data: { status: LegalPolicyStatus.ARCHIVED },
      });
      return tx.legalPolicy.update({
        where: { id },
        data: {
          status: LegalPolicyStatus.ACTIVE,
          publishedAt: now,
          effectiveAt: now,
          approvedByUserId: actorUserId,
          updatedByUserId: actorUserId,
        },
      });
    });
  }

  async archive(id: string, actorUserId: string) {
    return this.prisma.legalPolicy.update({
      where: { id },
      data: {
        status: LegalPolicyStatus.ARCHIVED,
        updatedByUserId: actorUserId,
      },
    });
  }

  async countConsentsForPolicy(policyId: string) {
    return this.prisma.userLegalConsent.count({ where: { policyId } });
  }

  private mapPublic(row: {
    id: string;
    type: LegalPolicyType;
    version: string;
    title: string;
    content: string;
    contentFormat: string;
    effectiveAt: Date | null;
    publishedAt: Date | null;
    requiresUserConsent: boolean;
  }) {
    return {
      id: row.id,
      type: row.type,
      version: row.version,
      title: row.title,
      content: row.content,
      contentFormat: row.contentFormat,
      effectiveAt: row.effectiveAt?.toISOString() ?? null,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      requiresUserConsent: row.requiresUserConsent,
      lawyerReviewRequired: true,
    };
  }
}
