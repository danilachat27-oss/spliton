import { Prisma } from '@prisma/client';
import { WithdrawalApprovalService } from './withdrawal-approval.service';
import { ProviderWithdrawalLifecycleService } from './provider-withdrawal-lifecycle.service';
import { OperationalLimitsService } from './operational-limits.service';

describe('WithdrawalApprovalService', () => {
  const prisma = {
    withdrawalApproval: { findMany: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
    withdrawal: { findUnique: jest.fn() },
  };
  const limits = {
    getLimits: jest.fn().mockResolvedValue({
      mediumWithdrawalUsdt: '1000',
      largeWithdrawalUsdt: '5000',
    }),
  };
  const service = new WithdrawalApprovalService(
    prisma as never,
    limits as unknown as OperationalLimitsService,
  );

  beforeEach(() => jest.clearAllMocks());

  it('requires accountant for small withdrawal', async () => {
    const required = await service.getRequiredRoles(new Prisma.Decimal(100), false);
    expect(required.map((r) => r.role)).toEqual(['ACCOUNTANT']);
  });

  it('requires compliance for medium withdrawal', async () => {
    const required = await service.getRequiredRoles(new Prisma.Decimal(1500), false);
    expect(required.map((r) => r.role)).toContain('COMPLIANCE');
  });

  it('requires super admin for large withdrawal', async () => {
    const required = await service.getRequiredRoles(new Prisma.Decimal(6000), false);
    expect(required.map((r) => r.role)).toContain('SUPER_ADMIN');
  });
});

describe('ProviderWithdrawalLifecycleService', () => {
  const service = new ProviderWithdrawalLifecycleService();

  it('blocks complete without tx hash or provider confirmation', () => {
    expect(() =>
      service.assertCanComplete(
        {
          status: 'APPROVED' as never,
          blockchainTxid: null,
          providerTxHash: null,
          providerStatus: null,
          manualCompleteOverride: false,
        },
        { actorRoles: ['ACCOUNTANT'] },
      ),
    ).toThrow();
  });

  it('allows manual override for super admin with reason', () => {
    expect(() =>
      service.assertCanComplete(
        {
          status: 'APPROVED' as never,
          blockchainTxid: null,
          providerTxHash: null,
          providerStatus: null,
          manualCompleteOverride: false,
        },
        {
          actorRoles: ['SUPER_ADMIN'],
          manualOverride: true,
          manualReason: 'Provider dry-run rehearsal',
        },
      ),
    ).not.toThrow();
  });
});
