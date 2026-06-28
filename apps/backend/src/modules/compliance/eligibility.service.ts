import { HttpStatus, Injectable } from '@nestjs/common';
import {
  AmlRiskLevel,
  ConsentSource,
  KycStatus,
  UserStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { FeatureFlagsService } from '../../common/platform/feature-flags/feature-flags.service';
import { throwAppError } from '../../common/platform/errors/throw-app-error';
import { ErrorCodes } from '../../common/platform/errors/error-codes';
import { LegalConsentsService } from '../legal/legal-consents.service';
import { isFinancialConsentSource } from '../legal/legal-consent.types';
import { ComplianceEnforcementService } from './compliance-enforcement.service';
import { CountryRestrictionsService } from './country-restrictions.service';
import {
  ELIGIBILITY_MESSAGES,
  type EligibilityResult,
} from './eligibility.types';

@Injectable()
export class EligibilityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly enforcement: ComplianceEnforcementService,
    private readonly consents: LegalConsentsService,
    private readonly countries: CountryRestrictionsService,
    private readonly flags: FeatureFlagsService,
  ) {}

  private kycRequiredForWithdrawal(): boolean {
    return process.env.COMPLIANCE_KYC_REQUIRED_FOR_WITHDRAWAL === 'true';
  }

  private kycRequiredForTrading(): boolean {
    return process.env.COMPLIANCE_KYC_REQUIRED_FOR_TRADING === 'true';
  }

  async check(userId: string, action: ConsentSource): Promise<EligibilityResult> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        status: true,
        emailVerifiedAt: true,
        deletedAt: true,
        profile: { select: { countryCode: true } },
      },
    });
    if (!user || user.deletedAt) {
      return this.denied('ACCOUNT_RESTRICTED', ELIGIBILITY_MESSAGES.ACCOUNT_RESTRICTED);
    }
    if (!user.emailVerifiedAt) {
      return this.denied('EMAIL_NOT_VERIFIED', ELIGIBILITY_MESSAGES.EMAIL_NOT_VERIFIED, [
        '/verify-email',
      ]);
    }
    if (user.status === UserStatus.SUSPENDED) {
      return this.denied('ACCOUNT_RESTRICTED', ELIGIBILITY_MESSAGES.ACCOUNT_RESTRICTED);
    }

    const aml = await this.prisma.userAmlProfile.findUnique({
      where: { userId },
    });
    if (aml?.riskLevel === AmlRiskLevel.BLOCKED) {
      return this.denied('AML_BLOCKED', ELIGIBILITY_MESSAGES.AML_BLOCKED);
    }
    const restrictions = (aml?.restrictions ?? {}) as Record<string, boolean>;
    if (restrictions.freezeAccount) {
      return this.denied('ACCOUNT_RESTRICTED', ELIGIBILITY_MESSAGES.ACCOUNT_RESTRICTED);
    }

    const country = user.profile?.countryCode ?? undefined;
    const scope = this.actionToCountryScope(action);
    if (scope && country) {
      const countryCheck = await this.countries.checkCountry(country, scope);
      if (!countryCheck.allowed) {
        return this.denied(
          'COUNTRY_BLOCKED',
          ELIGIBILITY_MESSAGES.COUNTRY_BLOCKED,
          undefined,
          countryCheck.reason,
        );
      }
    }

    const missing = await this.consents.getMissingConsents(userId, action);
    const unpublished = this.consents.getUnpublishedPolicyTypes(missing);
    if (unpublished.length > 0 && isFinancialConsentSource(action)) {
      return this.denied(
        'LEGAL_POLICY_MISSING',
        ELIGIBILITY_MESSAGES.LEGAL_POLICY_MISSING,
        undefined,
        undefined,
        unpublished,
      );
    }

    const consentMissing = missing.filter((m) => m.reason === 'CONSENT_REQUIRED');
    if (consentMissing.length > 0) {
      return this.denied(
        'CONSENT_REQUIRED',
        ELIGIBILITY_MESSAGES.CONSENT_REQUIRED,
        consentMissing.map(() => `/terms`),
      );
    }

    const kyc = await this.prisma.kycVerification.findFirst({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    const needsKyc =
      (action === ConsentSource.WITHDRAWAL && this.kycRequiredForWithdrawal()) ||
      ((action === ConsentSource.SECONDARY_TRADE ||
        action === ConsentSource.PRIMARY_PURCHASE) &&
        this.kycRequiredForTrading());

    if (needsKyc) {
      const kycResult = this.evaluateKyc(kyc?.status ?? KycStatus.NOT_STARTED);
      if (!kycResult.allowed) return kycResult;
    }

    if (action === ConsentSource.WITHDRAWAL && restrictions.restrictWithdrawals) {
      return this.denied('AML_BLOCKED', ELIGIBILITY_MESSAGES.AML_BLOCKED);
    }
    if (
      (action === ConsentSource.SECONDARY_TRADE ||
        action === ConsentSource.PRIMARY_PURCHASE) &&
      restrictions.restrictSecondaryTrading
    ) {
      return this.denied('AML_BLOCKED', ELIGIBILITY_MESSAGES.AML_BLOCKED);
    }

    return { allowed: true, userMessage: 'OK' };
  }

  async assertAllowed(userId: string, action: ConsentSource): Promise<void> {
    await this.enforcement.assertUserCanTransact(userId);
    const result = await this.check(userId, action);
    if (result.allowed) {
      this.assertFeatureForAction(action);
      return;
    }
    throwAppError(
      ErrorCodes.COMPLIANCE_RESTRICTED,
      result.userMessage,
      HttpStatus.FORBIDDEN,
      {
        blockingCode: result.blockingCode,
        requiredActions: result.requiredActions,
        policyLinks: result.policyLinks,
        missingPolicyTypes: result.missingPolicyTypes,
      },
    );
  }

  canDeposit(userId: string) {
    return this.check(userId, ConsentSource.LOGIN);
  }

  canWithdraw(userId: string) {
    return this.check(userId, ConsentSource.WITHDRAWAL);
  }

  canBuyPrimary(userId: string) {
    return this.check(userId, ConsentSource.PRIMARY_PURCHASE);
  }

  canTradeSecondary(userId: string) {
    return this.check(userId, ConsentSource.SECONDARY_TRADE);
  }

  canCreateListing(userId: string) {
    return this.check(userId, ConsentSource.SECONDARY_TRADE);
  }

  private assertFeatureForAction(action: ConsentSource): void {
    if (action === ConsentSource.WITHDRAWAL) {
      this.flags.assertEnabled('enableWithdrawals');
    }
    if (action === ConsentSource.PRIMARY_PURCHASE) {
      this.flags.assertEnabled('enablePrimaryMarket');
    }
    if (action === ConsentSource.SECONDARY_TRADE) {
      this.flags.assertEnabled('enableSecondaryMarket');
    }
  }

  private evaluateKyc(status: KycStatus): EligibilityResult {
    if (status === KycStatus.APPROVED) {
      return { allowed: true, userMessage: 'OK' };
    }
    if (
      status === KycStatus.PENDING ||
      status === KycStatus.IN_REVIEW ||
      status === KycStatus.MANUAL_REVIEW_REQUIRED
    ) {
      return this.denied('KYC_IN_REVIEW', ELIGIBILITY_MESSAGES.KYC_IN_REVIEW, [
        '/dashboard/profile',
      ]);
    }
    if (status === KycStatus.REJECTED || status === KycStatus.EXPIRED) {
      return this.denied('KYC_REJECTED', ELIGIBILITY_MESSAGES.KYC_REJECTED, [
        '/dashboard/profile',
      ]);
    }
    return this.denied('KYC_REQUIRED', ELIGIBILITY_MESSAGES.KYC_REQUIRED, [
      '/dashboard/profile',
    ]);
  }

  private actionToCountryScope(
    action: ConsentSource,
  ): 'registration' | 'deposits' | 'withdrawals' | 'primary' | 'secondary' | 'payouts' | null {
    switch (action) {
      case ConsentSource.REGISTER:
        return 'registration';
      case ConsentSource.WITHDRAWAL:
        return 'withdrawals';
      case ConsentSource.PRIMARY_PURCHASE:
        return 'primary';
      case ConsentSource.SECONDARY_TRADE:
        return 'secondary';
      default:
        return null;
    }
  }

  private denied(
    code: string,
    userMessage: string,
    requiredActions?: string[],
    adminMessage?: string,
    missingPolicyTypes?: string[],
  ): EligibilityResult {
    return {
      allowed: false,
      blockingCode: code,
      userMessage,
      adminMessage,
      requiredActions,
      missingPolicyTypes,
    };
  }
}
