import {
  listingHasPartialFill,
  mapListingToUserOrder,
} from './secondary-market-rich.mapper';
import { ListingStatus, Prisma } from '@prisma/client';

describe('secondary-market-rich.mapper', () => {
  it('maps active listing to Russian status label', () => {
    const row = {
      id: 'l1',
      releaseId: 'r1',
      sellerUserId: 'u1',
      pricePerUnit: new Prisma.Decimal('10'),
      unitsTotal: new Prisma.Decimal('5'),
      unitsAvailable: new Prisma.Decimal('5'),
      status: ListingStatus.ACTIVE,
      createdAt: new Date(),
      updatedAt: new Date(),
      release: {
        slug: 'slug',
        symbol: 'MNR',
        title: 'Track',
        releaseArtists: [],
        copyrightOwner: null,
      },
    } as Parameters<typeof mapListingToUserOrder>[0];

    const dto = mapListingToUserOrder(row, 'u1');
    expect(dto.statusLabel).toBe('Активна');
    expect(dto.canCancel).toBe(true);
  });

  it('detects partial fill on active listing', () => {
    expect(
      listingHasPartialFill({
        unitsTotal: new Prisma.Decimal('10'),
        unitsAvailable: new Prisma.Decimal('4'),
        status: ListingStatus.ACTIVE,
      }),
    ).toBe(true);
  });
});
