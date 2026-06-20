import { Prisma } from '@prisma/client';
import { TreasuryReconciliationService } from './treasury-reconciliation.service';

describe('TreasuryReconciliationService', () => {
  const prisma = {
    treasuryAccount: { findMany: jest.fn(), update: jest.fn().mockResolvedValue({}) },
    walletBalance: { findMany: jest.fn() },
    ledgerPosting: { aggregate: jest.fn() },
    withdrawal: { findMany: jest.fn() },
    deposit: { findMany: jest.fn() },
    treasuryReconciliationRun: { create: jest.fn() },
  };
  const accounts = {
    listAccounts: jest.fn(),
    checkHotWalletThresholds: jest.fn().mockResolvedValue({ alertsCreated: 0 }),
  };

  const service = new TreasuryReconciliationService(
    prisma as never,
    accounts as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.treasuryAccount.findMany.mockResolvedValue([
      {
        id: 'acc-liability',
        type: 'USER_LIABILITY',
        balanceExpected: new Prisma.Decimal('1000'),
        balanceObserved: new Prisma.Decimal('900'),
      },
    ]);
    prisma.walletBalance.findMany.mockResolvedValue([
      { available: new Prisma.Decimal('1000'), locked: new Prisma.Decimal(0), pending: new Prisma.Decimal(0) },
    ]);
    prisma.ledgerPosting.aggregate.mockResolvedValue({ _sum: { amount: new Prisma.Decimal(0) } });
    prisma.withdrawal.findMany.mockResolvedValue([]);
    prisma.deposit.findMany.mockResolvedValue([]);
  });

  it('detects discrepancy on dry-run', async () => {
    const result = await service.runReconciliation({ dryRun: true });
    expect(result.dryRun).toBe(true);
    expect(result.discrepancyCount).toBeGreaterThan(0);
    expect(result.items[0]).toMatchObject({
      type: 'USER_LIABILITY',
    });
  });

  it('persists reconciliation when dryRun false', async () => {
    prisma.treasuryReconciliationRun.create.mockResolvedValue({
      id: 'run-1',
      discrepancyCount: 1,
      items: [],
    });
    const result = await service.runReconciliation({
      dryRun: false,
      startedByUserId: 'admin-1',
    });
    expect(prisma.treasuryReconciliationRun.create).toHaveBeenCalled();
    expect(result).toMatchObject({ id: 'run-1' });
  });
});
