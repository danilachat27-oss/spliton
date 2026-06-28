import {
  ConsentSource,
  LegalPolicyContentFormat,
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

  const activePolicy = {
    id: 'pol-1',
    type: LegalPolicyType.RISK_DISCLOSURE,
    version: '1.0.0',
    status: LegalPolicyStatus.ACTIVE,
    content: 'Risk text',
    contentFormat: LegalPolicyContentFormat.MARKDOWN,
    contentHash: 'hash-1',
    requiresUserConsent: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('records consent and writes audit on acceptPolicies', async () => {
    prisma.legalPolicy.findUnique.mockResolvedValue(activePolicy);
    prisma.legalPolicy.findFirst.mockResolvedValue(activePolicy);
    prisma.userLegalConsent.upsert.mockResolvedValue({ id: 'c1' });
    prisma.userLegalConsent.findMany.mockResolvedValue([]);

    await service.acceptPolicies(
      'user-1',
      ['pol-1'],
      ConsentSource.PRIMARY_PURCHASE,
      { ip: '127.0.0.1', userAgent: 'test' },
    );

    expect(prisma.userLegalConsent.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ acceptedContentHash: 'hash-1' }),
      }),
    );
    expect(legalAudit.logUserConsent).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        policyId: 'pol-1',
        policyType: LegalPolicyType.RISK_DISCLOSURE,
        source: ConsentSource.PRIMARY_PURCHASE,
      }),
    );
  });

  it('rejects unrelated policy for source', async () => {
    prisma.legalPolicy.findUnique.mockResolvedValue({
      ...activePolicy,
      type: LegalPolicyType.AML_POLICY,
    });
    prisma.legalPolicy.findFirst.mockResolvedValue({
      ...activePolicy,
      type: LegalPolicyType.AML_POLICY,
    });

    await expect(
      service.acceptPolicies('user-1', ['pol-1'], ConsentSource.PRIMARY_PURCHASE),
    ).rejects.toMatchObject({
      response: { error: expect.objectContaining({ code: 'VALIDATION_ERROR' }) },
    });
  });

  it('rejects draft policy', async () => {
    prisma.legalPolicy.findUnique.mockResolvedValue({
      ...activePolicy,
      status: LegalPolicyStatus.DRAFT,
    });

    await expect(
      service.acceptPolicies('user-1', ['pol-1'], ConsentSource.PRIMARY_PURCHASE),
    ).rejects.toMatchObject({
      response: { error: expect.objectContaining({ code: 'VALIDATION_ERROR' }) },
    });
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

  it('fail-closed when required ACTIVE policy missing for financial source', async () => {
    prisma.legalPolicy.findFirst.mockImplementation(async ({ where }) => {
      if (where.type === LegalPolicyType.TERMS_OF_SERVICE) return null;
      if (where.type === LegalPolicyType.RISK_DISCLOSURE) {
        return {
          id: 'pol-r',
          type: LegalPolicyType.RISK_DISCLOSURE,
          version: '1.0.0',
          title: 'Risk',
          requiresUserConsent: true,
          status: LegalPolicyStatus.ACTIVE,
        };
      }
      return null;
    });

    const missing = await service.getMissingConsents(
      'user-1',
      ConsentSource.PRIMARY_PURCHASE,
    );
    expect(missing.some((m) => m.type === LegalPolicyType.TERMS_OF_SERVICE)).toBe(true);
    expect(
      missing.find((m) => m.type === LegalPolicyType.TERMS_OF_SERVICE)?.reason,
    ).toBe('POLICY_NOT_PUBLISHED');

    await expect(
      service.assertConsentsForSource('user-1', ConsentSource.PRIMARY_PURCHASE),
    ).rejects.toMatchObject({
      response: {
        error: expect.objectContaining({
          details: expect.objectContaining({ blockingCode: 'LEGAL_POLICY_MISSING' }),
        }),
      },
    });
  });

  it('does not fail-closed for REGISTER when ACTIVE policy missing', async () => {
    prisma.legalPolicy.findFirst.mockResolvedValue(null);
    const missing = await service.getMissingConsents(
      'user-1',
      ConsentSource.REGISTER,
    );
    expect(missing).toEqual([]);
  });
});
