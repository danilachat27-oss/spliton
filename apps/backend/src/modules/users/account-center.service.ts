import { Injectable } from '@nestjs/common';
import {
  ConsentSource,
  DisputeStatus,
  KycStatus,
  SupportTicketStatus,
  WithdrawalStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EligibilityService } from '../compliance/eligibility.service';
import { LegalConsentsService } from '../legal/legal-consents.service';
import { NotificationService } from '../notifications/notification.service';
import type { AccountCenterSummary } from './account-center.types';
import {
  buildAccountCompleteness,
  buildSecuritySummary,
  type CompletenessCheckContext,
} from './account-center.scoring';

@Injectable()
export class AccountCenterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly legalConsents: LegalConsentsService,
    private readonly eligibility: EligibilityService,
    private readonly notifications: NotificationService,
  ) {}

  async buildSummary(userId: string, roles: string[]): Promise<AccountCenterSummary> {
    const [
      user,
      twoFaCount,
      activeSessionsCount,
      lastLogin,
      kyc,
      registerMissing,
      primaryMissing,
      secondaryMissing,
      withdrawalMissing,
      securityPrefs,
      notificationPrefs,
      securityEvents,
      openSupportTicketsCount,
      openDisputesCount,
      pendingWithdrawalsCount,
      hasWalletActivity,
      canDeposit,
      canWithdraw,
      canBuyPrimary,
      canTradeSecondary,
      unreadNotificationsCount,
    ] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          emailVerifiedAt: true,
          passwordHash: true,
          profile: {
            select: {
              displayName: true,
              timezone: true,
              passwordChangedAt: true,
            },
          },
        },
      }),
      this.prisma.twoFactorMethod.count({
        where: { userId, status: 'ENABLED' },
      }),
      this.prisma.userSession.count({
        where: { userId, revokedAt: null },
      }),
      this.prisma.auditLog.findFirst({
        where: { entityType: 'auth', actorUserId: userId, action: 'LOGIN_SUCCESS' },
        orderBy: { createdAt: 'desc' },
        select: { createdAt: true },
      }),
      this.prisma.kycVerification.findFirst({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        select: { status: true, level: true },
      }),
      this.legalConsents.getMissingConsents(userId, ConsentSource.REGISTER),
      this.legalConsents.getMissingConsents(userId, ConsentSource.PRIMARY_PURCHASE),
      this.legalConsents.getMissingConsents(userId, ConsentSource.SECONDARY_TRADE),
      this.legalConsents.getMissingConsents(userId, ConsentSource.WITHDRAWAL),
      this.prisma.userSecurityPreference.findUnique({ where: { userId } }),
      this.prisma.notificationPreference.findUnique({ where: { userId } }),
      this.prisma.auditLog.findMany({
        where: { entityType: 'auth', actorUserId: userId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, action: true, ip: true, userAgent: true, createdAt: true },
      }),
      this.prisma.supportTicket.count({
        where: {
          userId,
          status: { not: SupportTicketStatus.CLOSED },
        },
      }),
      this.prisma.dispute.count({
        where: {
          userId,
          status: {
            notIn: [DisputeStatus.RESOLVED, DisputeStatus.REJECTED, DisputeStatus.CLOSED],
          },
        },
      }),
      this.prisma.withdrawal.count({
        where: {
          status: {
            in: [
              WithdrawalStatus.REQUESTED,
              WithdrawalStatus.LOCKED,
              WithdrawalStatus.REVIEW,
              WithdrawalStatus.APPROVED,
              WithdrawalStatus.PROCESSING,
              WithdrawalStatus.ON_HOLD,
            ],
          },
          walletTx: { wallet: { userId } },
        },
      }),
      this.prisma.walletTransaction
        .findFirst({
          where: { wallet: { userId } },
          select: { id: true },
        })
        .then((row) => Boolean(row)),
      this.eligibility.canDeposit(userId).then((r) => r.allowed),
      this.eligibility.canWithdraw(userId).then((r) => r.allowed),
      this.eligibility.canBuyPrimary(userId).then((r) => r.allowed),
      this.eligibility.canTradeSecondary(userId).then((r) => r.allowed),
      this.notifications.unreadCountForUser(userId, roles).then((r) => r.count),
    ]);

    const emailVerified = Boolean(user?.emailVerifiedAt);
    const twoFaEnabled = twoFaCount > 0;
    const passwordSet = Boolean(user?.passwordHash);
    const kycStatus = kyc?.status ?? KycStatus.NOT_STARTED;
    const registerLegalComplete = registerMissing.length === 0;
    const missingRequiredConsentsCount =
      registerMissing.length +
      primaryMissing.length +
      secondaryMissing.length +
      withdrawalMissing.length;

    const completenessCtx: CompletenessCheckContext = {
      displayName: user?.profile?.displayName,
      timezone: user?.profile?.timezone,
      emailVerified,
      kycStatus,
      registerLegalComplete,
      twoFaEnabled,
      hasWalletActivity,
    };

    const accountCompleteness = buildAccountCompleteness(completenessCtx);
    const securityPreferences = {
      withdrawalEmailConfirmationEnabled:
        securityPrefs?.withdrawalEmailConfirmationEnabled ?? false,
      withdrawalAddressWhitelistEnabled:
        securityPrefs?.withdrawalAddressWhitelistEnabled ?? false,
      suspiciousLoginAlertsEnabled: securityPrefs?.suspiciousLoginAlertsEnabled ?? true,
      emailSecurityNotificationsEnabled: notificationPrefs?.emailSecurity ?? true,
      enforcementReady: false,
    };

    const security = buildSecuritySummary({
      emailVerified,
      twoFaEnabled,
      passwordSet,
      passwordChangedAt: user?.profile?.passwordChangedAt ?? null,
      activeSessionsCount,
      lastLoginAt: lastLogin?.createdAt ?? null,
      kycStatus,
      registerLegalComplete,
      securityPreferences: {
        withdrawalEmailConfirmationEnabled:
          securityPreferences.withdrawalEmailConfirmationEnabled,
        emailSecurityNotificationsEnabled:
          securityPreferences.emailSecurityNotificationsEnabled,
      },
    });

    return {
      accountCompleteness,
      security,
      verification: {
        status: kycStatus,
        level: kyc?.level ?? null,
        canDeposit,
        canWithdraw,
        canBuyPrimary,
        canTradeSecondary,
      },
      legal: {
        missingRequiredConsentsCount,
        hasAcceptedCurrentRequiredPolicies: registerMissing.length === 0,
      },
      activity: {
        openSupportTicketsCount,
        openDisputesCount,
        unreadNotificationsCount,
        pendingWithdrawalsCount,
      },
      securityPreferences,
      recentSecurityEvents: securityEvents.map((ev) => ({
        id: ev.id,
        action: ev.action,
        ip: ev.ip,
        userAgent: ev.userAgent,
        createdAt: ev.createdAt.toISOString(),
      })),
    };
  }
}
