import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { TtlCacheService } from '../../common/cache/ttl-cache.service';
import { UserAnalyticsService } from './user-analytics.service';
import { UserAnalyticsResolveService } from './user-analytics-resolve.service';
import { PrismaService } from '../../prisma/prisma.service';
import { PortfolioPositionsService } from '../portfolio/portfolio-positions.service';
import { SecondaryMarketEnrichmentService } from '../market/secondary-market-enrichment.service';

describe('UserAnalyticsService release detail', () => {
  let service: UserAnalyticsService;
  const prisma = {
    release: { findFirst: jest.fn(), findMany: jest.fn() },
    releaseMetricsDaily: { findFirst: jest.fn() },
    releaseFaqItem: { findMany: jest.fn() },
    earningDistribution: { findMany: jest.fn() },
    priceHistory: { findMany: jest.fn() },
    marketListing: { count: jest.fn() },
    trade: { count: jest.fn(), aggregate: jest.fn(), findFirst: jest.fn() },
    orderBookSnapshot: { findFirst: jest.fn() },
    releaseDocument: { findMany: jest.fn() },
    payout: { findMany: jest.fn() },
    order: { findMany: jest.fn() },
    ownershipLedger: { findMany: jest.fn() },
    userPosition: { findUnique: jest.fn() },
  };
  const resolve = {
    resolveReleaseId: jest.fn(),
    assertPublicRelease: jest.fn(),
    loadRelease: jest.fn(),
  };
  const positions = { loadPositions: jest.fn() };
  const enrichment = { loadByReleaseIds: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserAnalyticsService,
        TtlCacheService,
        { provide: PrismaService, useValue: prisma },
        { provide: UserAnalyticsResolveService, useValue: resolve },
        { provide: PortfolioPositionsService, useValue: positions },
        { provide: SecondaryMarketEnrichmentService, useValue: enrichment },
      ],
    }).compile();
    service = module.get(UserAnalyticsService);
  });

  it('getDetail returns FAQ from DB and no mock fields', async () => {
    resolve.resolveReleaseId.mockResolvedValue('rel-1');
    resolve.assertPublicRelease.mockResolvedValue(undefined);
    resolve.loadRelease.mockResolvedValue({
      id: 'rel-1',
      slug: 'neon-drift',
      symbol: 'NDR',
      title: 'Neon Drift',
      genre: 'electronic',
      coverUrl: 'https://cdn/cover.jpg',
      videoUrl: null,
      videoPosterUrl: null,
      videoType: 'NONE',
      videoStatus: 'NONE',
      shortDescription: 'Short',
      description: 'Full desc',
      riskDisclosureText: 'Risk',
      legalDisclaimer: null,
      secondaryEnabled: true,
      releaseDate: null,
      updatedAt: new Date('2026-01-01'),
      status: 'ACTIVE',
      payoutFrequency: 'MONTHLY',
      primaryUnitPrice: new Prisma.Decimal(10),
      totalUnits: new Prisma.Decimal(1000),
      unitsAvailablePrimary: new Prisma.Decimal(200),
      minPurchaseUnits: null,
      maxPurchaseUnits: null,
      raiseTargetUsdt: null,
      hardCapUsdt: null,
      promoBudgetUsdt: null,
      artistUpfrontUsdt: null,
      platformUpfrontUsdt: null,
      holderSharePct: new Prisma.Decimal(26),
      artistSharePct: new Prisma.Decimal(50),
      platformSharePct: new Prisma.Decimal(24),
      releaseArtists: [{ artist: { name: 'Artist' } }],
      primaryRaiseRounds: [],
      publicStatus: null,
      distributionNotes: null,
      createdAt: new Date('2026-01-01'),
    });
    positions.loadPositions.mockResolvedValue([]);
    prisma.releaseMetricsDaily.findFirst.mockResolvedValue({
      yieldPct: new Prisma.Decimal('12.5'),
    });
    prisma.releaseFaqItem.findMany.mockResolvedValue([
      { question: 'Q1', answer: 'A1', sortOrder: 0, locale: 'ru', category: null },
    ]);
    prisma.earningDistribution.findMany.mockResolvedValue([]);

    const result = await service.getDetail('neon-drift', null);

    expect(result.faq).toHaveLength(1);
    expect(result.faq[0]?.question).toBe('Q1');
    expect(result.walletCta.href).toBe('/login');
    expect(result.walletCta.available).toBe(false);
    expect(result.release.videoStatus).toBe('NONE');
  });

  it('getFullDetail includes payoutHistory from distributions', async () => {
    resolve.resolveReleaseId.mockResolvedValue('rel-1');
    resolve.assertPublicRelease.mockResolvedValue(undefined);
    resolve.loadRelease.mockResolvedValue({
      id: 'rel-1',
      slug: 'test',
      symbol: 'TST',
      title: 'Test',
      genre: 'pop',
      coverUrl: null,
      videoUrl: null,
      videoPosterUrl: null,
      videoType: 'NONE',
      videoStatus: 'NONE',
      shortDescription: null,
      description: null,
      riskDisclosureText: null,
      legalDisclaimer: null,
      secondaryEnabled: false,
      releaseDate: null,
      updatedAt: new Date(),
      status: 'ACTIVE',
      payoutFrequency: 'MONTHLY',
      primaryUnitPrice: new Prisma.Decimal(10),
      totalUnits: new Prisma.Decimal(1000),
      unitsAvailablePrimary: new Prisma.Decimal(200),
      minPurchaseUnits: new Prisma.Decimal(1),
      maxPurchaseUnits: null,
      raiseTargetUsdt: null,
      hardCapUsdt: null,
      promoBudgetUsdt: null,
      artistUpfrontUsdt: null,
      platformUpfrontUsdt: null,
      holderSharePct: new Prisma.Decimal(26),
      artistSharePct: new Prisma.Decimal(50),
      platformSharePct: new Prisma.Decimal(24),
      releaseArtists: [{ artistId: 'a1', artist: { name: 'Artist' } }],
      primaryRaiseRounds: [],
      publicStatus: null,
      distributionNotes: null,
      createdAt: new Date(),
    });
    positions.loadPositions.mockResolvedValue([]);
    prisma.releaseMetricsDaily.findFirst.mockResolvedValue(null);
    prisma.releaseFaqItem.findMany.mockResolvedValue([]);
    prisma.earningDistribution.findMany.mockResolvedValue([]);
    prisma.priceHistory.findMany.mockResolvedValue([]);
    prisma.marketListing.count.mockResolvedValue(0);
    prisma.trade.count.mockResolvedValue(0);
    prisma.trade.aggregate.mockResolvedValue({ _sum: { grossAmount: null } });
    prisma.trade.findFirst.mockResolvedValue(null);
    prisma.orderBookSnapshot.findFirst.mockResolvedValue(null);
    prisma.releaseDocument.findMany.mockResolvedValue([]);
    enrichment.loadByReleaseIds.mockResolvedValue(new Map());

    const result = await service.getFullDetail('test', null);

    expect(result.identity.title).toBe('Test');
    expect(Array.isArray(result.payoutHistory)).toBe(true);
    expect(result.secondarySummary.activeListings).toBe(0);
  });
});
