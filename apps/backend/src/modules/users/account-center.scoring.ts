import { KycStatus } from '@prisma/client';
import type {
  AccountCompletenessLevel,
  SecurityLevel,
  SecurityRecommendation,
} from './account-center.types';

export type CompletenessCheckContext = {
  displayName: string | null | undefined;
  timezone: string | null | undefined;
  emailVerified: boolean;
  kycStatus: KycStatus;
  registerLegalComplete: boolean;
  twoFaEnabled: boolean;
  hasWalletActivity: boolean;
};

const COMPLETENESS_CHECKS: Array<{
  id: string;
  weight: number;
  isComplete: (ctx: CompletenessCheckContext) => boolean;
}> = [
  { id: 'display_name', weight: 10, isComplete: (c) => Boolean(c.displayName?.trim()) },
  { id: 'timezone', weight: 5, isComplete: (c) => Boolean(c.timezone?.trim()) },
  { id: 'email_verified', weight: 15, isComplete: (c) => c.emailVerified },
  { id: 'kyc_started', weight: 10, isComplete: (c) => c.kycStatus !== KycStatus.NOT_STARTED },
  { id: 'kyc_approved', weight: 20, isComplete: (c) => c.kycStatus === KycStatus.APPROVED },
  {
    id: 'register_legal_consents',
    weight: 15,
    isComplete: (c) => c.registerLegalComplete,
  },
  { id: 'two_factor', weight: 15, isComplete: (c) => c.twoFaEnabled },
  { id: 'wallet_activity', weight: 10, isComplete: (c) => c.hasWalletActivity },
];

export const SECURITY_WEIGHTS = {
  emailVerified: 15,
  passwordSet: 10,
  twoFactorEnabled: 25,
  kycApproved: 20,
  registerLegalConsents: 15,
  emailSecurityNotifications: 5,
  withdrawalEmailConfirmation: 10,
} as const;

export function buildAccountCompleteness(ctx: CompletenessCheckContext) {
  const completedItems: string[] = [];
  const missingItems: string[] = [];
  let score = 0;
  let maxScore = 0;

  for (const item of COMPLETENESS_CHECKS) {
    maxScore += item.weight;
    if (item.isComplete(ctx)) {
      score += item.weight;
      completedItems.push(item.id);
    } else {
      missingItems.push(item.id);
    }
  }

  const pct = maxScore > 0 ? score / maxScore : 0;
  let level: AccountCompletenessLevel = 'LOW';
  if (pct >= 0.95) level = 'COMPLETE';
  else if (pct >= 0.75) level = 'HIGH';
  else if (pct >= 0.5) level = 'MEDIUM';

  return { score, maxScore, level, completedItems, missingItems };
}

export function buildSecuritySummary(params: {
  emailVerified: boolean;
  twoFaEnabled: boolean;
  passwordSet: boolean;
  passwordChangedAt: Date | null;
  activeSessionsCount: number;
  lastLoginAt: Date | null;
  kycStatus: KycStatus;
  registerLegalComplete: boolean;
  securityPreferences: {
    withdrawalEmailConfirmationEnabled: boolean;
    emailSecurityNotificationsEnabled: boolean;
  };
}) {
  const recommendations: SecurityRecommendation[] = [];

  if (!params.emailVerified) {
    recommendations.push({
      code: 'VERIFY_EMAIL',
      title: 'Подтвердите email',
      description: 'Подтверждённый email нужен для входа и уведомлений о безопасности.',
      severity: 'HIGH',
      isCompleted: false,
      actionHref: '/verify-email',
    });
  }

  if (!params.twoFaEnabled) {
    recommendations.push({
      code: 'ENABLE_2FA',
      title: 'Включите двухфакторную аутентификацию',
      description: 'TOTP защищает аккаунт при компрометации пароля.',
      severity: 'HIGH',
      isCompleted: false,
      actionHref: '/dashboard/profile?tab=security',
    });
  }

  if (params.kycStatus !== KycStatus.APPROVED) {
    recommendations.push({
      code: 'COMPLETE_KYC',
      title: 'Завершите верификацию личности',
      description:
        params.kycStatus === KycStatus.NOT_STARTED
          ? 'Верификация открывает полный доступ к выплатам и торговле.'
          : 'Заявка на верификацию ещё не одобрена.',
      severity: 'MEDIUM',
      isCompleted: false,
      actionHref: '/dashboard/profile?tab=verification',
    });
  }

  if (!params.registerLegalComplete) {
    recommendations.push({
      code: 'ACCEPT_LEGAL',
      title: 'Примите актуальные условия',
      description: 'Нужны принятые версии Terms и Privacy Policy.',
      severity: 'HIGH',
      isCompleted: false,
      actionHref: '/dashboard/profile?tab=legal',
    });
  }

  if (!params.securityPreferences.withdrawalEmailConfirmationEnabled) {
    recommendations.push({
      code: 'ENABLE_WITHDRAWAL_EMAIL_CONFIRM',
      title: 'Подтверждение вывода по email',
      description:
        'Настройка сохранена в профиле; проверка при выводе будет включена в следующем релизе.',
      severity: 'MEDIUM',
      isCompleted: false,
      actionHref: '/dashboard/profile?tab=security',
    });
  }

  if (params.activeSessionsCount > 5) {
    recommendations.push({
      code: 'REVIEW_SESSIONS',
      title: 'Проверьте активные сессии',
      description: `Сейчас активно ${params.activeSessionsCount} сессий. Завершите незнакомые устройства.`,
      severity: 'LOW',
      isCompleted: false,
      actionHref: '/dashboard/profile?tab=security',
    });
  }

  let score = 0;
  const maxScore = Object.values(SECURITY_WEIGHTS).reduce((a, b) => a + b, 0);

  if (params.emailVerified) score += SECURITY_WEIGHTS.emailVerified;
  if (params.passwordSet) score += SECURITY_WEIGHTS.passwordSet;
  if (params.twoFaEnabled) score += SECURITY_WEIGHTS.twoFactorEnabled;
  if (params.kycStatus === KycStatus.APPROVED) score += SECURITY_WEIGHTS.kycApproved;
  if (params.registerLegalComplete) score += SECURITY_WEIGHTS.registerLegalConsents;
  if (params.securityPreferences.emailSecurityNotificationsEnabled) {
    score += SECURITY_WEIGHTS.emailSecurityNotifications;
  }
  if (params.securityPreferences.withdrawalEmailConfirmationEnabled) {
    score += SECURITY_WEIGHTS.withdrawalEmailConfirmation;
  }

  const pct = maxScore > 0 ? score / maxScore : 0;
  let level: SecurityLevel = 'LOW';
  if (pct >= 0.75) level = 'HIGH';
  else if (pct >= 0.45) level = 'MEDIUM';

  return {
    score,
    maxScore,
    level,
    recommendations,
    emailVerified: params.emailVerified,
    twoFactorEnabled: params.twoFaEnabled,
    passwordSet: params.passwordSet,
    passwordChangedAt: params.passwordChangedAt?.toISOString() ?? null,
    activeSessionsCount: params.activeSessionsCount,
    lastLoginAt: params.lastLoginAt?.toISOString() ?? null,
  };
}
