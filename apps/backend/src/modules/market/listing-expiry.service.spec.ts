import { Test, TestingModule } from '@nestjs/testing';
import { ListingStatus, Prisma } from '@prisma/client';

import { CacheInvalidationService } from '../../common/platform/cache/cache-invalidation.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ListingExpiryService } from './listing-expiry.service';

describe('ListingExpiryService', () => {
  let service: ListingExpiryService;
  const prisma = {
    marketListing: {
      findMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const cacheInvalidation = {
    onCatalogOrMarketChange: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingExpiryService,
        { provide: PrismaService, useValue: prisma },
        { provide: CacheInvalidationService, useValue: cacheInvalidation },
      ],
    }).compile();

    service = module.get(ListingExpiryService);
  });

  it('expires due listings and unlocks units', async () => {
    const listingId = 'lst-1';
    prisma.marketListing.findMany.mockResolvedValue([{ id: listingId }]);

    const tx = {
      marketListing: {
        findFirst: jest.fn().mockResolvedValue({
          id: listingId,
          sellerUserId: 'user-1',
          releaseId: 'rel-1',
          unitsAvailable: new Prisma.Decimal(5),
          status: ListingStatus.ACTIVE,
        }),
        update: jest.fn(),
      },
      userPosition: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'pos-1',
          unitsAvailable: new Prisma.Decimal(10),
          unitsLocked: new Prisma.Decimal(5),
        }),
        update: jest.fn(),
      },
      ownershipLedger: {
        create: jest.fn(),
      },
    };

    prisma.$transaction.mockImplementation(async (fn: (client: typeof tx) => unknown) =>
      fn(tx),
    );

    const result = await service.expireDueListings(new Date('2026-06-20T00:00:00Z'));

    expect(result.expired).toBe(1);
    expect(tx.marketListing.update).toHaveBeenCalledWith({
      where: { id: listingId },
      data: { status: ListingStatus.EXPIRED },
    });
    expect(cacheInvalidation.onCatalogOrMarketChange).toHaveBeenCalled();
  });

  it('returns zero when nothing is due', async () => {
    prisma.marketListing.findMany.mockResolvedValue([]);

    const result = await service.expireDueListings();

    expect(result.expired).toBe(0);
    expect(cacheInvalidation.onCatalogOrMarketChange).not.toHaveBeenCalled();
  });
});
