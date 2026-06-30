import { Test, TestingModule } from '@nestjs/testing';
import { DepositAddressPoolStatus } from '@prisma/client';
import { DepositAddressPoolService } from './deposit-address-pool.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('DepositAddressPoolService', () => {
  let service: DepositAddressPoolService;
  const prisma = {
    depositAddressPool: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DepositAddressPoolService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get(DepositAddressPoolService);
  });

  it('rejects invalid TRON address on admin add', async () => {
    await expect(
      service.adminAddAddress('not-a-tron-address'),
    ).rejects.toMatchObject({
      response: { error: { code: 'INVALID_TRC20_ADDRESS' } },
    });
    expect(prisma.depositAddressPool.create).not.toHaveBeenCalled();
  });

  it('accepts valid TRON address on admin add', async () => {
    const valid = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
    prisma.depositAddressPool.findUnique.mockResolvedValue(null);
    prisma.depositAddressPool.create.mockResolvedValue({
      id: 'p1',
      address: valid,
      asset: 'USDT',
      network: 'TRC20',
      status: DepositAddressPoolStatus.AVAILABLE,
      source: 'ADMIN_POOL',
      assignedWalletId: null,
      assignedUserId: null,
      assignedAt: null,
      disabledAt: null,
      disabledByUserId: null,
      disableReason: null,
      archivedAt: null,
      archivedByUserId: null,
      createdByUserId: 'u1',
      createdAt: new Date(),
    });

    await service.adminAddAddress(valid, 'USDT', 'TRC20', 'u1');

    expect(prisma.depositAddressPool.create).toHaveBeenCalled();
  });

  it('requires reason on disable', async () => {
    await expect(service.adminDisable('id1', '  ', 'u1')).rejects.toMatchObject({
      response: { error: { code: 'REASON_REQUIRED' } },
    });
  });

  it('rejects archive for assigned address', async () => {
    prisma.depositAddressPool.findUnique.mockResolvedValue({
      id: 'id1',
      status: DepositAddressPoolStatus.ASSIGNED,
    });
    await expect(
      service.adminArchive('id1', 'cleanup', 'u1'),
    ).rejects.toMatchObject({
      response: { error: { code: 'ADDRESS_ASSIGNED' } },
    });
  });

  it('bulk add separates invalid and duplicate addresses', async () => {
    const valid = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
    prisma.depositAddressPool.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'existing' });
    prisma.depositAddressPool.create.mockResolvedValue({
      id: 'p1',
      address: valid,
      asset: 'USDT',
      network: 'TRC20',
      status: DepositAddressPoolStatus.AVAILABLE,
      source: 'ADMIN_POOL',
      assignedWalletId: null,
      assignedUserId: null,
      assignedAt: null,
      disabledAt: null,
      disabledByUserId: null,
      disableReason: null,
      archivedAt: null,
      archivedByUserId: null,
      createdByUserId: 'u1',
      createdAt: new Date(),
    });

    const result = await service.adminBulkAddAddresses(
      [valid, valid, 'bad'],
      'u1',
    );
    expect(result.added).toHaveLength(1);
    expect(result.duplicates).toHaveLength(1);
    expect(result.invalid).toEqual(['bad']);
  });
});
