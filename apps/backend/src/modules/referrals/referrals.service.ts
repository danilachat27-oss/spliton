import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PartnerStatus, Prisma, ReferralRewardStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAdminError } from '../admin/common/admin-http.util';
import { NotificationService } from '../notifications/notification.service';
import { generateReferralCode, normalizeReferralCode } from './referral-code.util';

const ATTRIBUTION_WINDOW_DAYS = 30;

@Injectable()
export class ReferralsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly notifications: NotificationService,
  ) {}

  private frontendOrigin(): string {
    return (
      this.config.get<string>('app.frontendOrigin') ??
      process.env.FRONTEND_ORIGIN ??
      'http://localhost:3000'
    );
  }

  async ensureProfile(userId: string) {
    const existing = await this.prisma.referralProfile.findUnique({
      where: { userId },
    });
    if (existing) return existing;

    for (let attempt = 0; attempt < 8; attempt++) {
      const code = generateReferralCode();
      try {
        return await this.prisma.referralProfile.create({
          data: { userId, code },
        });
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === 'P2002'
        ) {
          continue;
        }
        throw e;
      }
    }
    throwAdminError(
      'REFERRAL_CODE_GENERATION_FAILED',
      'Could not generate referral code',
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  async getMe(userId: string) {
    const profile = await this.ensureProfile(userId);
    const link = `${this.frontendOrigin()}/auth/register?ref=${encodeURIComponent(profile.code)}`;

    const [invites, rewards] = await Promise.all([
      this.prisma.referralAttribution.findMany({
        where: { referrerUserId: userId },
        orderBy: { attributedAt: 'desc' },
        take: 200,
        include: {
          referredUser: { select: { id: true, email: true, createdAt: true, status: true } },
        },
      }),
      this.prisma.referralReward.findMany({
        where: { referrerUserId: userId },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const activeInvited = invites.filter(
      (i) => i.referredUser.status === 'ACTIVE',
    ).length;

    const sumByStatus = (statuses: ReferralRewardStatus[]) =>
      rewards
        .filter((r) => statuses.includes(r.status))
        .reduce((s, r) => s.plus(r.amount), new Prisma.Decimal(0));

    return {
      referralCode: profile.code,
      referralLink: link,
      invitedUsersCount: invites.length,
      activeInvitedUsersCount: activeInvited,
      pendingRewards: sumByStatus([
        ReferralRewardStatus.PENDING,
        ReferralRewardStatus.QUALIFIED,
        ReferralRewardStatus.HELD_FOR_REVIEW,
      ]).toString(),
      approvedRewards: sumByStatus([ReferralRewardStatus.APPROVED]).toString(),
      paidRewards: sumByStatus([ReferralRewardStatus.PAID]).toString(),
      rejectedRewards: sumByStatus([
        ReferralRewardStatus.REJECTED,
        ReferralRewardStatus.CANCELLED,
      ]).toString(),
      createdAt: profile.createdAt.toISOString(),
      conversionRatePct:
        invites.length > 0
          ? ((activeInvited / invites.length) * 100).toFixed(1)
          : '0',
    };
  }

  async listInvites(userId: string, page = 1, pageSize = 20) {
    const skip = (page - 1) * pageSize;
    const where = { referrerUserId: userId };
    const [total, rows] = await Promise.all([
      this.prisma.referralAttribution.count({ where }),
      this.prisma.referralAttribution.findMany({
        where,
        orderBy: { attributedAt: 'desc' },
        skip,
        take: pageSize,
        include: {
          referredUser: {
            select: {
              id: true,
              email: true,
              createdAt: true,
              status: true,
              emailVerifiedAt: true,
            },
          },
        },
      }),
    ]);
    return {
      items: rows.map((r) => ({
        id: r.id,
        referredUserId: r.referredUserId,
        maskedEmail: maskEmail(r.referredUser.email),
        status: r.referredUser.status,
        emailVerified: Boolean(r.referredUser.emailVerifiedAt),
        attributedAt: r.attributedAt.toISOString(),
        utmSource: r.utmSource,
        utmCampaign: r.utmCampaign,
      })),
      total,
      page,
      pageSize,
      hasMore: skip + rows.length < total,
    };
  }

  async listRewards(userId: string, status?: string, page = 1, pageSize = 30) {
    const skip = (page - 1) * pageSize;
    const where: Prisma.ReferralRewardWhereInput = {
      referrerUserId: userId,
      ...(status
        ? { status: status.toUpperCase() as ReferralRewardStatus }
        : {}),
    };
    const [total, rows] = await Promise.all([
      this.prisma.referralReward.count({ where }),
      this.prisma.referralReward.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
      }),
    ]);
    return {
      items: rows.map((r) => mapRewardForUser(r)),
      total,
      page,
      pageSize,
      hasMore: skip + rows.length < total,
    };
  }

  async getStatement(userId: string) {
    const me = await this.getMe(userId);
    const rewards = await this.listRewards(userId, undefined, 1, 500);
    return {
      generatedAt: new Date().toISOString(),
      summary: me,
      rewards: rewards.items,
    };
  }

  async applyCodeForExistingUser(
    userId: string,
    rawCode: string,
    meta?: { utmSource?: string; utmCampaign?: string },
  ) {
    const existing = await this.prisma.referralAttribution.findUnique({
      where: { referredUserId: userId },
    });
    if (existing) {
      throwAdminError(
        'REFERRAL_ALREADY_ATTRIBUTED',
        'Реферальный код уже применён к аккаунту',
        HttpStatus.CONFLICT,
      );
    }
    return this.attachOnRegistration(userId, rawCode, meta);
  }

  async attachOnRegistration(
    referredUserId: string,
    rawCode?: string,
    meta?: { utmSource?: string; utmCampaign?: string },
  ) {
    if (!rawCode?.trim()) return null;
    const code = normalizeReferralCode(rawCode);
    if (!code) return null;

    const referrer = await this.resolveReferrerByCode(code);
    if (!referrer) {
      throwAdminError(
        'REFERRAL_CODE_INVALID',
        'Неверный реферальный код',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (referrer.userId === referredUserId) {
      await this.prisma.riskFlag.create({
        data: {
          userId: referredUserId,
          flagCode: 'REFERRAL_SELF_ATTEMPT',
          severity: 'high',
          note: 'Self-referral attempt blocked',
        },
      });
      throwAdminError(
        'REFERRAL_SELF',
        'Нельзя использовать собственный реферальный код',
        HttpStatus.BAD_REQUEST,
      );
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + ATTRIBUTION_WINDOW_DAYS);

    const attribution = await this.prisma.referralAttribution.create({
      data: {
        referredUserId,
        referrerUserId: referrer.userId,
        referralCode: code,
        utmSource: meta?.utmSource,
        utmCampaign: meta?.utmCampaign,
        expiresAt,
      },
    });

    void this.notifications.notifyUser(referrer.userId, {
      type: 'referral.invite.attributed',
      category: 'referral',
      title: 'Новое приглашение',
      message: 'К вашему реферальному коду привязан новый пользователь.',
    });

    return attribution;
  }

  async resolveReferrerByCode(code: string): Promise<{
    userId: string;
    partnerProfileId: string | null;
  } | null> {
    const normalized = normalizeReferralCode(code);
    if (!normalized) return null;

    const profile = await this.prisma.referralProfile.findUnique({
      where: { code: normalized },
    });
    if (profile) {
      return { userId: profile.userId, partnerProfileId: null };
    }

    const partner = await this.prisma.partnerProfile.findFirst({
      where: {
        partnerCode: normalized,
        status: PartnerStatus.APPROVED,
      },
    });
    if (partner) {
      return { userId: partner.userId, partnerProfileId: partner.id };
    }

    return null;
  }
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const head = local.slice(0, 2);
  return `${head}***@${domain}`;
}

export function mapRewardForUser(r: {
  id: string;
  eventType: string;
  amount: Prisma.Decimal;
  currency: string;
  status: ReferralRewardStatus;
  createdAt: Date;
  paidAt: Date | null;
  rejectedReason: string | null;
}) {
  const uiStatus = rewardStatusToUi(r.status);
  return {
    id: r.id,
    eventType: r.eventType,
    amountUsdt: Number(r.amount),
    currency: r.currency,
    status: uiStatus,
    statusLabel: rewardUiLabel(uiStatus),
    createdAt: r.createdAt.toISOString(),
    paidAt: r.paidAt?.toISOString() ?? null,
    rejectedReason: r.rejectedReason,
  };
}

export function rewardStatusToUi(
  status: ReferralRewardStatus,
): 'pending' | 'available' | 'paid' | 'rejected' | 'cancelled' {
  if (status === ReferralRewardStatus.PAID) return 'paid';
  if (status === ReferralRewardStatus.REJECTED) return 'rejected';
  if (status === ReferralRewardStatus.CANCELLED) return 'cancelled';
  if (
    status === ReferralRewardStatus.APPROVED ||
    status === ReferralRewardStatus.QUALIFIED
  ) {
    return 'available';
  }
  return 'pending';
}

function rewardUiLabel(
  s: 'pending' | 'available' | 'paid' | 'rejected' | 'cancelled',
): string {
  const map = {
    pending: 'В ожидании',
    available: 'Доступно',
    paid: 'Выплачено',
    rejected: 'Отклонено',
    cancelled: 'Отменено',
  };
  return map[s];
}
