import { KycStatus } from '@prisma/client';
import {
  buildAccountCompleteness,
  buildSecuritySummary,
} from './account-center.scoring';

describe('account-center.scoring', () => {
  it('scores completeness higher when more items complete', () => {
    const low = buildAccountCompleteness({
      displayName: null,
      timezone: null,
      emailVerified: false,
      kycStatus: KycStatus.NOT_STARTED,
      registerLegalComplete: false,
      twoFaEnabled: false,
      hasWalletActivity: false,
    });
    const high = buildAccountCompleteness({
      displayName: 'Spliton',
      timezone: 'Europe/Moscow',
      emailVerified: true,
      kycStatus: KycStatus.APPROVED,
      registerLegalComplete: true,
      twoFaEnabled: true,
      hasWalletActivity: true,
    });
    expect(high.score).toBeGreaterThan(low.score);
    expect(high.level).not.toBe('LOW');
  });

  it('increases security score when 2FA enabled', () => {
    const prefs = {
      withdrawalEmailConfirmationEnabled: false,
      emailSecurityNotificationsEnabled: true,
    };
    const base = buildSecuritySummary({
      emailVerified: true,
      twoFaEnabled: false,
      passwordSet: true,
      passwordChangedAt: null,
      activeSessionsCount: 1,
      lastLoginAt: null,
      kycStatus: KycStatus.NOT_STARTED,
      registerLegalComplete: true,
      securityPreferences: prefs,
    });
    const with2fa = buildSecuritySummary({
      emailVerified: true,
      twoFaEnabled: true,
      passwordSet: true,
      passwordChangedAt: null,
      activeSessionsCount: 1,
      lastLoginAt: null,
      kycStatus: KycStatus.NOT_STARTED,
      registerLegalComplete: true,
      securityPreferences: prefs,
    });
    expect(with2fa.score).toBeGreaterThan(base.score);
    expect(
      with2fa.recommendations.find((r) => r.code === 'ENABLE_2FA'),
    ).toBeUndefined();
  });
});
