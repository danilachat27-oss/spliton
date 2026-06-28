import { HttpStatus } from '@nestjs/common';
import {
  LegalPolicyContentFormat,
  LegalPolicyStatus,
  LegalPolicyType,
} from '@prisma/client';
import { LegalPoliciesService } from './legal-policies.service';

describe('LegalPoliciesService', () => {
  const prisma = {
    legalPolicy: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const service = new LegalPoliciesService(prisma as never);

  const draftRow = {
    id: 'pol-draft',
    type: LegalPolicyType.TERMS_OF_SERVICE,
    version: '2026.07.1',
    title: 'Terms',
    content: 'Terms body',
    contentFormat: LegalPolicyContentFormat.MARKDOWN,
    status: LegalPolicyStatus.DRAFT,
    effectiveAt: null,
    contentHash: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.$transaction.mockImplementation(async (fn: (tx: typeof prisma) => unknown) =>
      fn(prisma),
    );
  });

  it('publish DRAFT -> ACTIVE ok', async () => {
    prisma.legalPolicy.findUnique.mockResolvedValue(draftRow);
    prisma.legalPolicy.updateMany.mockResolvedValue({ count: 1 });
    prisma.legalPolicy.update.mockResolvedValue({
      ...draftRow,
      status: LegalPolicyStatus.ACTIVE,
      contentHash: 'abc',
    });

    const row = await service.publish('pol-draft', 'admin-1');
    expect(row.status).toBe(LegalPolicyStatus.ACTIVE);
    expect(prisma.legalPolicy.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { type: LegalPolicyType.TERMS_OF_SERVICE, status: LegalPolicyStatus.ACTIVE },
      }),
    );
  });

  it('publish REVIEW -> ACTIVE ok', async () => {
    prisma.legalPolicy.findUnique.mockResolvedValue({
      ...draftRow,
      status: LegalPolicyStatus.REVIEW,
    });
    prisma.legalPolicy.updateMany.mockResolvedValue({ count: 0 });
    prisma.legalPolicy.update.mockResolvedValue({
      ...draftRow,
      status: LegalPolicyStatus.ACTIVE,
    });

    await expect(service.publish('pol-draft', 'admin-1')).resolves.toMatchObject({
      status: LegalPolicyStatus.ACTIVE,
    });
  });

  it('publish ACTIVE blocked', async () => {
    prisma.legalPolicy.findUnique.mockResolvedValue({
      ...draftRow,
      status: LegalPolicyStatus.ACTIVE,
    });

    await expect(service.publish('pol-draft', 'admin-1')).rejects.toMatchObject({
      status: HttpStatus.CONFLICT,
    });
  });

  it('publish ARCHIVED blocked', async () => {
    prisma.legalPolicy.findUnique.mockResolvedValue({
      ...draftRow,
      status: LegalPolicyStatus.ARCHIVED,
    });

    await expect(service.publish('pol-draft', 'admin-1')).rejects.toMatchObject({
      status: HttpStatus.CONFLICT,
    });
  });

  it('updateDraft blocks ACTIVE policy', async () => {
    prisma.legalPolicy.findUnique.mockResolvedValue({
      ...draftRow,
      status: LegalPolicyStatus.ACTIVE,
    });

    await expect(
      service.updateDraft('pol-active', { title: 'New' }, 'admin-1'),
    ).rejects.toMatchObject({ status: HttpStatus.CONFLICT });
  });
});
