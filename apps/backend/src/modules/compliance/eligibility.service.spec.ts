import { ConsentSource, KycStatus, UserStatus, AmlRiskLevel } from '@prisma/client';
import { EligibilityService } from './eligibility.service';

describe('EligibilityService', () => {
  const prisma = {
    user: { findUnique: jest.fn() },
    userAmlProfile: { findUnique: jest.fn() },
    kycVerification: { findFirst: jest.fn() },
  };
  const enforcement = { assertUserCanTransact: jest.fn() };
  const consents = {
    getMissingConsents: jest.fn(),
    getUnpublishedPolicyTypes: jest.fn(),
  };
  const countries = { checkCountry: jest.fn() };
  const flags = { assertEnabled: jest.fn() };

  const service = new EligibilityService(
    prisma as never,
    enforcement as never,
    consents as never,
    countries as never,
    flags as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.COMPLIANCE_KYC_REQUIRED_FOR_WITHDRAWAL;
    delete process.env.COMPLIANCE_KYC_REQUIRED_FOR_TRADING;
    prisma.user.findUnique.mockResolvedValue({
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      deletedAt: null,
      profile: { countryCode: 'DE' },
    });
    prisma.userAmlProfile.findUnique.mockResolvedValue(null);
    prisma.kycVerification.findFirst.mockResolvedValue({
      status: KycStatus.APPROVED,
    });
    consents.getMissingConsents.mockResolvedValue([]);
    consents.getUnpublishedPolicyTypes.mockReturnValue([]);
    countries.checkCountry.mockResolvedValue({ allowed: true });
    enforcement.assertUserCanTransact.mockResolvedValue(undefined);
  });

  it('blocks primary purchase when terms consent missing', async () => {
    consents.getMissingConsents.mockResolvedValue([
      {
        type: 'TERMS_OF_SERVICE',
        policyId: 'p1',
        activeVersion: '1',
        title: 'Terms',
        reason: 'CONSENT_REQUIRED',
      },
    ]);
    consents.getUnpublishedPolicyTypes.mockReturnValue([]);
    const result = await service.check('user-1', ConsentSource.PRIMARY_PURCHASE);
    expect(result.allowed).toBe(false);
    expect(result.blockingCode).toBe('CONSENT_REQUIRED');
  });

  it('blocks financial action when required ACTIVE policy missing', async () => {
    consents.getMissingConsents.mockResolvedValue([
      {
        type: 'TERMS_OF_SERVICE',
        title: 'TERMS OF SERVICE',
        reason: 'POLICY_NOT_PUBLISHED',
      },
    ]);
    consents.getUnpublishedPolicyTypes.mockReturnValue(['TERMS_OF_SERVICE']);
    const result = await service.check('user-1', ConsentSource.WITHDRAWAL);
    expect(result.allowed).toBe(false);
    expect(result.blockingCode).toBe('LEGAL_POLICY_MISSING');
    expect(result.missingPolicyTypes).toEqual(['TERMS_OF_SERVICE']);
  });

  it('allows user with consents and verified email', async () => {
    const result = await service.check('user-1', ConsentSource.PRIMARY_PURCHASE);
    expect(result.allowed).toBe(true);
  });

  it('blocks withdrawal when KYC required and missing', async () => {
    process.env.COMPLIANCE_KYC_REQUIRED_FOR_WITHDRAWAL = 'true';
    prisma.kycVerification.findFirst.mockResolvedValue({
      status: KycStatus.NOT_STARTED,
    });
    const result = await service.check('user-1', ConsentSource.WITHDRAWAL);
    expect(result.allowed).toBe(false);
    expect(result.blockingCode).toBe('KYC_REQUIRED');
  });

  it('blocks AML BLOCKED users', async () => {
    prisma.userAmlProfile.findUnique.mockResolvedValue({
      riskLevel: AmlRiskLevel.BLOCKED,
      restrictions: {},
    });
    const result = await service.check('user-1', ConsentSource.SECONDARY_TRADE);
    expect(result.allowed).toBe(false);
    expect(result.blockingCode).toBe('AML_BLOCKED');
  });
});
