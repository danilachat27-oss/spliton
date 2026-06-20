import { Test, TestingModule } from '@nestjs/testing';
import { DepositAddressPoolService } from './deposit-address-pool.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('DepositAddressPoolService', () => {
  let service: DepositAddressPoolService;
  const prisma = {
    depositAddressPool: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
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
    prisma.depositAddressPool.create.mockResolvedValue({ id: 'p1', address: valid });

    await service.adminAddAddress(valid);

    expect(prisma.depositAddressPool.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ address: valid }),
      }),
    );
  });

  it('requires reason on disable', async () => {
    await expect(service.adminDisable('id1', '  ')).rejects.toMatchObject({
      response: { error: { code: 'REASON_REQUIRED' } },
    });
  });
});
