import {
  ConsentSource,
  LegalPolicyStatus,
  LegalPolicyType,
} from '@prisma/client';
import { LegalConsentsService } from './legal-consents.service';
import { LegalAuditService } from './legal-audit.service';

describe('LegalConsentsService', () => {
  const prisma = {
    legalPolicy: { findFirst: jest.fn(), findUnique: jest.fn() },
    userLegalConsent: { upsert: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
  };
  const legalAudit = { logUserConsent: jest.fn() };

  const service = new LegalConsentsService(
    prisma as never,
    legalAudit as unknown as LegalAuditService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('records consent and writes audit on acceptPolicies', async () => {
    prisma.legalPolicy.findUnique.mockResolvedValue({
      id: 'pol-1',
      type: LegalPolicyType.RISK_DISCLOSURE,
      version: '1.0.0',
      status: LegalPolicyStatus.ACTIVE,
    });
    prisma.userLegalConsent.upsert.mockResolvedValue({ id: 'c1' });
    prisma.userLegalConsent.findMany.mockResolvedValue([]);

    await service.acceptPolicies(
      'user-1',
      ['pol-1'],
      ConsentSource.PRIMARY_PURCHASE,
      { ip: '127.0.0.1', userAgent: 'test' },
    );

    expect(prisma.userLegalConsent.upsert).toHaveBeenCalled();
    expect(legalAudit.logUserConsent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        policyId: 'pol-1',
        policyType: LegalPolicyType.RISK_DISCLOSURE,
        source: ConsentSource.PRIMARY_PURCHASE,
      }),
    );
  });

  it('throws when active consent missing via assertConsentsForSource', async () => {
    prisma.legalPolicy.findFirst.mockResolvedValue({
      id: 'pol-2',
      type: LegalPolicyType.TERMS_OF_SERVICE,
      version: '2.0.0',
      title: 'Terms',
      requiresUserConsent: true,
      status: LegalPolicyStatus.ACTIVE,
    });
    prisma.userLegalConsent.findUnique.mockResolvedValue(null);

    await expect(
      service.assertConsentsForSource('user-1', ConsentSource.PRIMARY_PURCHASE),
    ).rejects.toMatchObject({
      response: {
        error: expect.objectContaining({ code: 'COMPLIANCE_RESTRICTED' }),
      },
    });
  });
});
