import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PartnerStatus,
  PartnerTier,
  PartnerType,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAdminError } from '../admin/common/admin-http.util';
import { AdminAuditService } from '../admin/common/admin-audit.service';
import { NotificationService } from '../notifications/notification.service';
import { generateReferralCode } from './referral-code.util';
import { ReferralsService } from './referrals.service';
import { mapRewardForUser } from './referrals.service';

@Injectable()
export class PartnersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly referrals: ReferralsService,
    private readonly audit: AdminAuditService,
    private readonly notifications: NotificationService,
  ) {}

  private frontendOrigin(): string {
    return (
      this.config.get<string>('app.frontendOrigin') ??
      process.env.FRONTEND_ORIGIN ??
      'http://localhost:3000'
    );
  }

  async apply(
    userId: string,
    dto: {
      partnerType: PartnerType;
      applicationNote?: string;
      payoutMethod?: string;
    },
  ) {
    const existing = await this.prisma.partnerProfile.findUnique({
      where: { userId },
    });
    if (existing && existing.status !== PartnerStatus.REJECTED) {
      throwAdminError(
        'PARTNER_ALREADY_APPLIED',
        'Заявка партнёра уже подана',
        HttpStatus.CONFLICT,
      );
    }

    const row =
      existing?.status === PartnerStatus.REJECTED
        ? await this.prisma.partnerProfile.update({
            where: { userId },
            data: {
              partnerType: dto.partnerType,
              status: PartnerStatus.APPLIED,
              applicationNote: dto.applicationNote,
              payoutMethod: dto.payoutMethod,
              rejectedReason: null,
            },
          })
        : await this.prisma.partnerProfile.create({
            data: {
              userId,
              partnerType: dto.partnerType,
              status: PartnerStatus.APPLIED,
              applicationNote: dto.applicationNote,
              payoutMethod: dto.payoutMethod,
            },
          });

    void this.notifications.notifyAdminRoles(
      ['SUPER_ADMIN', 'ACCOUNTANT', 'COMPLIANCE'],
      {
        type: 'partner.application.new',
        category: 'partner',
        title: 'Новая заявка партнёра',
        message: `Пользователь подал заявку (${dto.partnerType}).`,
        actionUrl: '/admin/referrals',
      },
    );

    void this.notifications.notifyUser(userId, {
      type: 'partner.application.submitted',
      category: 'partner',
      title: 'Заявка отправлена',
      message: 'Мы рассмотрим заявку на партнёрскую программу Spliton.',
    });

    return this.mapPartnerMe(row);
  }

  async getMe(userId: string) {
    const row = await this.prisma.partnerProfile.findUnique({
      where: { userId },
    });
    if (!row) {
      return { status: null, canApply: true as const };
    }
    return this.mapPartnerMe(row);
  }

  async getPerformance(userId: string) {
    const partner = await this.prisma.partnerProfile.findUnique({
      where: { userId },
    });
    if (!partner || partner.status !== PartnerStatus.APPROVED) {
      throwAdminError(
        'PARTNER_NOT_APPROVED',
        'Партнёрский профиль не одобрен',
        HttpStatus.FORBIDDEN,
      );
    }

    const referralMe = await this.referrals.getMe(userId);
    const rewards = await this.prisma.referralReward.findMany({
      where: { partnerProfileId: partner.id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return {
      partner: this.mapPartnerMe(partner),
      referral: referralMe,
      commissions: rewards.map((r) => mapRewardForUser(r)),
      totals: {
        paidUsdt: rewards
          .filter((r) => r.status === 'PAID')
          .reduce((s, r) => s.plus(r.amount), new Prisma.Decimal(0))
          .toString(),
      },
    };
  }

  async adminList(status?: PartnerStatus) {
    const rows = await this.prisma.partnerProfile.findMany({
      where: status ? { status } : {},
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: { user: { select: { email: true, id: true } } },
    });
    return {
      items: rows.map((r) => ({
        ...this.mapPartnerMe(r),
        userEmail: r.user.email,
      })),
    };
  }

  async adminReview(
    partnerId: string,
    decision: 'approve' | 'reject' | 'suspend',
    actorUserId: string,
    roles: string[],
    body: {
      reason?: string;
      tier?: PartnerTier;
      commissionPercent?: string;
    },
  ) {
    const row = await this.prisma.partnerProfile.findUnique({
      where: { id: partnerId },
    });
    if (!row) {
      throwAdminError('PARTNER_NOT_FOUND', 'Partner not found', HttpStatus.NOT_FOUND);
    }

    let data: Prisma.PartnerProfileUpdateInput = {};
    if (decision === 'approve') {
      const code = row!.partnerCode ?? `P-${generateReferralCode(6)}`;
      data = {
        status: PartnerStatus.APPROVED,
        tier: body.tier ?? PartnerTier.BRONZE,
        commissionPercent: body.commissionPercent
          ? new Prisma.Decimal(body.commissionPercent)
          : new Prisma.Decimal(15),
        partnerCode: code,
        approvedAt: new Date(),
        reviewedByUserId: actorUserId,
        rejectedReason: null,
      };
    } else if (decision === 'reject') {
      data = {
        status: PartnerStatus.REJECTED,
        rejectedReason: body.reason ?? 'Rejected',
        reviewedByUserId: actorUserId,
      };
    } else {
      data = {
        status: PartnerStatus.SUSPENDED,
        rejectedReason: body.reason ?? 'Suspended',
        reviewedByUserId: actorUserId,
      };
    }

    const updated = await this.prisma.partnerProfile.update({
      where: { id: partnerId },
      data,
    });

    await this.audit.logOperatorAction({
      actorUserId,
      actorRoles: roles,
      entityType: 'partner_profile',
      entityId: partnerId,
      action: `partner.${decision}`,
      after: body,
    });

    if (decision === 'approve') {
      void this.notifications.notifyUser(row!.userId, {
        type: 'partner.approved',
        category: 'partner',
        title: 'Партнёрская программа одобрена',
        message: 'Добро пожаловать в партнёрскую программу Spliton.',
      });
    } else if (decision === 'reject') {
      void this.notifications.notifyUser(row!.userId, {
        type: 'partner.rejected',
        category: 'partner',
        title: 'Заявка отклонена',
        message: body.reason ?? 'Заявка не одобрена.',
      });
    }

    return this.mapPartnerMe(updated);
  }

  private mapPartnerMe(row: {
    id: string;
    userId: string;
    partnerType: PartnerType;
    status: PartnerStatus;
    tier: PartnerTier;
    commissionPercent: Prisma.Decimal | null;
    partnerCode: string | null;
    applicationNote: string | null;
    payoutMethod: string | null;
    approvedAt: Date | null;
    rejectedReason: string | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    const code = row.partnerCode;
    const link = code
      ? `${this.frontendOrigin()}/auth/register?ref=${encodeURIComponent(code)}`
      : null;
    return {
      id: row.id,
      partnerId: row.id,
      userId: row.userId,
      partnerType: row.partnerType,
      status: row.status,
      statusLabel: partnerStatusLabel(row.status),
      tier: row.tier,
      commissionPercent: row.commissionPercent?.toString() ?? null,
      partnerCode: code,
      partnerLink: link,
      applicationNote: row.applicationNote,
      payoutMethod: row.payoutMethod,
      approvedAt: row.approvedAt?.toISOString() ?? null,
      rejectedReason: row.rejectedReason,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
      canApply:
        row.status === PartnerStatus.REJECTED ||
        row.status === PartnerStatus.APPLIED,
    };
  }
}

function partnerStatusLabel(status: PartnerStatus): string {
  const map: Record<PartnerStatus, string> = {
    APPLIED: 'Заявка отправлена',
    IN_REVIEW: 'На рассмотрении',
    APPROVED: 'Одобрен',
    REJECTED: 'Отклонён',
    SUSPENDED: 'Приостановлен',
  };
  return map[status] ?? status;
}
