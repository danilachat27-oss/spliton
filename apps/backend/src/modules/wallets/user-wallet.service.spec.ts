import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { UserWalletService } from './user-wallet.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('UserWalletService.getBalance', () => {
  let service: UserWalletService;
  const prisma = {
    wallet: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    walletTransaction: { aggregate: jest.fn() },
    withdrawal: { count: jest.fn() },
    platformFeeSetting: { findFirst: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserWalletService,
        { provide: PrismaService, useValue: prisma },
        {
          provide: ConfigService,
          useValue: {
            get: (k: string) =>
              k === 'wallet'
                ? {
                    defaultAssetCode: 'USDT',
                    defaultNetwork: 'TRC20',
                    minWithdrawalUsdt: 50,
                    defaultWithdrawalFeeUsdt: 1,
                  }
                : null,
          },
        },
      ],
    }).compile();
    service = module.get(UserWalletService);
  });

  it('returns balance from wallet row without aggregates or fee lookup', async () => {
    const updatedAt = new Date('2026-01-01T00:00:00.000Z');
    prisma.wallet.findUnique.mockResolvedValue({
      id: 'wallet-1',
      assetCode: 'USDT',
      network: 'TRC20',
      balance: {
        available: new Prisma.Decimal('12.5'),
        locked: new Prisma.Decimal('0'),
        pending: new Prisma.Decimal('0'),
        updatedAt,
      },
    });

    const result = await service.getBalance('user-1');

    expect(result).toEqual({
      walletId: 'wallet-1',
      availableBalance: '12.5',
      lockedBalance: '0',
      pendingBalance: '0',
      asset: 'USDT',
      network: 'TRC20',
      currency: 'USDT',
      updatedAt: updatedAt.toISOString(),
    });
    expect(prisma.walletTransaction.aggregate).not.toHaveBeenCalled();
    expect(prisma.platformFeeSetting.findFirst).not.toHaveBeenCalled();
  });
});
