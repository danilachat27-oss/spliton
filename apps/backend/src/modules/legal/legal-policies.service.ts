import { HttpStatus, Injectable, OnModuleInit } from '@nestjs/common';
import {
  LegalPolicyContentFormat,
  LegalPolicyStatus,
  LegalPolicyType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAdminError } from '../admin/common/admin-http.util';
import { computeLegalPolicyContentHash } from './legal-content-hash.util';
import { DEFAULT_POLICY_SEEDS } from './legal-policy-seed.content';

const PUBLISHABLE_STATUSES: LegalPolicyStatus[] = [
  LegalPolicyStatus.DRAFT,
  LegalPolicyStatus.REVIEW,
];

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
      const contentFormat = LegalPolicyContentFormat.MARKDOWN;
      const contentHash = computeLegalPolicyContentHash({
        type: seed.type,
        version: seed.version,
        contentFormat,
        content: seed.content,
      });
      await this.prisma.legalPolicy.create({
        data: {
          type: seed.type,
          version: seed.version,
          title: seed.title,
          content: seed.content,
          contentFormat,
          contentHash,
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

  async listGroupedAdmin() {
    const rows = await this.prisma.legalPolicy.findMany({
      orderBy: [{ type: 'asc' }, { version: 'desc' }],
      include: {
        _count: { select: { consents: true } },
        updatedBy: { select: { id: true, email: true } },
        approvedBy: { select: { id: true, email: true } },
      },
    });

    const byType = new Map<
      LegalPolicyType,
      {
        type: LegalPolicyType;
        versionCount: number;
        activePolicy: (typeof rows)[0] | null;
        latestDraft: (typeof rows)[0] | null;
        versions: typeof rows;
      }
    >();

    for (const row of rows) {
      let group = byType.get(row.type);
      if (!group) {
        group = {
          type: row.type,
          versionCount: 0,
          activePolicy: null,
          latestDraft: null,
          versions: [],
        };
        byType.set(row.type, group);
      }
      group.versionCount += 1;
      group.versions.push(row);
      if (row.status === LegalPolicyStatus.ACTIVE && !group.activePolicy) {
        group.activePolicy = row;
      }
      if (
        (row.status === LegalPolicyStatus.DRAFT ||
          row.status === LegalPolicyStatus.REVIEW) &&
        !group.latestDraft
      ) {
        group.latestDraft = row;
      }
    }

    return [...byType.values()].map((g) => ({
      type: g.type,
      versionCount: g.versionCount,
      activePolicy: g.activePolicy ? this.mapAdminSummary(g.activePolicy) : null,
      latestDraft: g.latestDraft ? this.mapAdminSummary(g.latestDraft) : null,
      versions: g.versions.map((v) => this.mapAdminSummary(v)),
    }));
  }

  async listVersionsByType(type: LegalPolicyType) {
    const rows = await this.prisma.legalPolicy.findMany({
      where: { type },
      orderBy: [{ version: 'desc' }],
      include: {
        _count: { select: { consents: true } },
        createdBy: { select: { id: true, email: true } },
        updatedBy: { select: { id: true, email: true } },
        approvedBy: { select: { id: true, email: true } },
      },
    });
    return rows.map((row) => ({
      ...this.mapAdminSummary(row),
      content: row.content,
      contentFormat: row.contentFormat,
      contentHash: row.contentHash,
      createdAt: row.createdAt.toISOString(),
      effectiveAt: row.effectiveAt?.toISOString() ?? null,
      createdBy: row.createdBy,
      updatedBy: row.updatedBy,
      approvedBy: row.approvedBy,
    }));
  }

  async getAdminById(id: string) {
    const row = await this.prisma.legalPolicy.findUnique({
      where: { id },
      include: {
        _count: { select: { consents: true } },
        createdBy: { select: { id: true, email: true } },
        updatedBy: { select: { id: true, email: true } },
        approvedBy: { select: { id: true, email: true } },
      },
    });
    if (!row) {
      throwAdminError('POLICY_NOT_FOUND', 'Policy not found', HttpStatus.NOT_FOUND);
    }
    return row;
  }

  async createDraft(
    data: {
      type: LegalPolicyType;
      version: string;
      title: string;
      content: string;
      contentFormat?: LegalPolicyContentFormat;
      requiresUserConsent?: boolean;
      effectiveAt?: string | null;
    },
    actorUserId: string,
  ) {
    try {
      return await this.prisma.legalPolicy.create({
        data: {
          type: data.type,
          version: data.version,
          title: data.title,
          content: data.content,
          contentFormat: data.contentFormat ?? LegalPolicyContentFormat.MARKDOWN,
          requiresUserConsent: data.requiresUserConsent ?? true,
          effectiveAt: data.effectiveAt ? new Date(data.effectiveAt) : null,
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
      contentFormat: LegalPolicyContentFormat;
      requiresUserConsent: boolean;
      effectiveAt: string | null;
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
    const effectiveAt =
      data.effectiveAt === undefined
        ? undefined
        : data.effectiveAt
          ? new Date(data.effectiveAt)
          : null;
    return this.prisma.legalPolicy.update({
      where: { id },
      data: {
        ...(data.title !== undefined ? { title: data.title } : {}),
        ...(data.content !== undefined ? { content: data.content } : {}),
        ...(data.version !== undefined ? { version: data.version } : {}),
        ...(data.contentFormat !== undefined ? { contentFormat: data.contentFormat } : {}),
        ...(data.requiresUserConsent !== undefined
          ? { requiresUserConsent: data.requiresUserConsent }
          : {}),
        ...(effectiveAt !== undefined ? { effectiveAt } : {}),
        updatedByUserId: actorUserId,
      },
    });
  }

  async submitForReview(id: string, actorUserId: string) {
    const row = await this.prisma.legalPolicy.findUnique({ where: { id } });
    if (!row || row.status !== LegalPolicyStatus.DRAFT) {
      throwAdminError(
        'POLICY_INVALID_STATUS',
        'Only draft policies can be submitted for review',
        HttpStatus.CONFLICT,
      );
    }
    return this.prisma.legalPolicy.update({
      where: { id },
      data: {
        status: LegalPolicyStatus.REVIEW,
        updatedByUserId: actorUserId,
      },
    });
  }

  async publish(id: string, actorUserId: string) {
    const row = await this.prisma.legalPolicy.findUnique({ where: { id } });
    if (!row) {
      throwAdminError('POLICY_NOT_FOUND', 'Policy not found', HttpStatus.NOT_FOUND);
    }
    if (!PUBLISHABLE_STATUSES.includes(row.status)) {
      throwAdminError(
        'POLICY_INVALID_STATUS',
        'Only draft or review policies can be published',
        HttpStatus.CONFLICT,
      );
    }
    const now = new Date();
    const effectiveAt = row.effectiveAt && row.effectiveAt > now ? row.effectiveAt : now;
    const contentHash = computeLegalPolicyContentHash({
      type: row.type,
      version: row.version,
      contentFormat: row.contentFormat,
      content: row.content,
    });

    return this.prisma.$transaction(async (tx) => {
      await tx.legalPolicy.updateMany({
        where: { type: row.type, status: LegalPolicyStatus.ACTIVE },
        data: { status: LegalPolicyStatus.ARCHIVED, updatedByUserId: actorUserId },
      });
      return tx.legalPolicy.update({
        where: { id },
        data: {
          status: LegalPolicyStatus.ACTIVE,
          publishedAt: now,
          effectiveAt,
          contentHash,
          approvedByUserId: actorUserId,
          updatedByUserId: actorUserId,
        },
      });
    });
  }

  async archive(id: string, actorUserId: string) {
    const row = await this.prisma.legalPolicy.findUnique({ where: { id } });
    if (!row) {
      throwAdminError('POLICY_NOT_FOUND', 'Policy not found', HttpStatus.NOT_FOUND);
    }
    if (row.status === LegalPolicyStatus.ARCHIVED) {
      return row;
    }
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

  async backfillContentHashes(): Promise<number> {
    const rows = await this.prisma.legalPolicy.findMany({
      where: { contentHash: null },
    });
    let updated = 0;
    for (const row of rows) {
      const contentHash = computeLegalPolicyContentHash({
        type: row.type,
        version: row.version,
        contentFormat: row.contentFormat,
        content: row.content,
      });
      await this.prisma.legalPolicy.update({
        where: { id: row.id },
        data: { contentHash },
      });
      updated += 1;
    }
    return updated;
  }

  private mapAdminSummary(row: {
    id: string;
    type: LegalPolicyType;
    version: string;
    title: string;
    status: LegalPolicyStatus;
    requiresUserConsent: boolean;
    publishedAt: Date | null;
    effectiveAt: Date | null;
    updatedAt: Date;
    _count?: { consents: number };
  }) {
    return {
      id: row.id,
      type: row.type,
      version: row.version,
      title: row.title,
      status: row.status,
      requiresUserConsent: row.requiresUserConsent,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      effectiveAt: row.effectiveAt?.toISOString() ?? null,
      updatedAt: row.updatedAt.toISOString(),
      consentsCount: row._count?.consents ?? 0,
    };
  }

  private mapPublic(row: {
    id: string;
    type: LegalPolicyType;
    version: string;
    title: string;
    content: string;
    contentFormat: string;
    contentHash: string | null;
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
      contentHash: row.contentHash,
      effectiveAt: row.effectiveAt?.toISOString() ?? null,
      publishedAt: row.publishedAt?.toISOString() ?? null,
      requiresUserConsent: row.requiresUserConsent,
      lawyerReviewRequired: true,
    };
  }
}
