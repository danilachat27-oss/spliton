import { HttpStatus, Injectable } from '@nestjs/common';
import { AmlRiskLevel, ComplianceRiskStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAdminError } from '../admin/common/admin-http.util';
import { AdminAuditService } from '../admin/common/admin-audit.service';

@Injectable()
export class AmlProfileService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  async getOrCreate(userId: string) {
    let row = await this.prisma.userAmlProfile.findUnique({ where: { userId } });
    if (!row) {
      const flags = await this.prisma.riskFlag.count({
        where: { userId, isActive: true },
      });
      row = await this.prisma.userAmlProfile.create({
        data: { userId, activeFlagsCount: flags },
      });
    }
    return this.map(row);
  }

  async updateRisk(
    userId: string,
    data: {
      riskLevel?: AmlRiskLevel;
      restrictions?: Record<string, boolean>;
      notes?: string;
    },
    actorUserId: string,
    actorRoles: string[],
  ) {
    const row = await this.prisma.userAmlProfile.upsert({
      where: { userId },
      create: {
        userId,
        riskLevel: data.riskLevel ?? AmlRiskLevel.MEDIUM,
        restrictions: data.restrictions ?? {},
        notes: data.notes,
        reviewedByUserId: actorUserId,
        lastReviewAt: new Date(),
      },
      update: {
        riskLevel: data.riskLevel,
        restrictions: data.restrictions,
        notes: data.notes,
        reviewedByUserId: actorUserId,
        lastReviewAt: new Date(),
      },
    });
    await this.audit.logOperatorAction({
      actorUserId,
      actorRoles,
      entityType: 'user_aml_profile',
      entityId: userId,
      action: 'aml.profile.update',
      after: { riskLevel: row.riskLevel, restrictions: row.restrictions },
      ip: null,
      userAgent: null,
    });
    return this.map(row);
  }

  async syncFlagsCount(userId: string) {
    const count = await this.prisma.riskFlag.count({
      where: {
        userId,
        isActive: true,
        status: { in: [ComplianceRiskStatus.OPEN, ComplianceRiskStatus.BLOCKED] },
      },
    });
    await this.prisma.userAmlProfile.upsert({
      where: { userId },
      create: { userId, activeFlagsCount: count },
      update: { activeFlagsCount: count },
    });
  }

  async getForAdmin(userId: string) {
    const row = await this.prisma.userAmlProfile.findUnique({ where: { userId } });
    if (!row) {
      throwAdminError('AML_PROFILE_NOT_FOUND', 'AML profile not found', HttpStatus.NOT_FOUND);
    }
    return this.map(row!);
  }

  private map(row: {
    userId: string;
    riskLevel: AmlRiskLevel;
    activeFlagsCount: number;
    restrictions: unknown;
    notes: string | null;
    lastReviewAt: Date | null;
    nextReviewAt: Date | null;
  }) {
    return {
      userId: row.userId,
      riskLevel: row.riskLevel,
      activeFlagsCount: row.activeFlagsCount,
      restrictions: (row.restrictions as Record<string, boolean>) ?? {},
      notes: row.notes,
      lastReviewAt: row.lastReviewAt?.toISOString() ?? null,
      nextReviewAt: row.nextReviewAt?.toISOString() ?? null,
    };
  }
}
