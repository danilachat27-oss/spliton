import { MarketAbuseService } from './market-abuse.service';

describe('MarketAbuseService', () => {
  const prisma = {
    trade: { count: jest.fn() },
    wallet: { findMany: jest.fn().mockResolvedValue([{ id: 'w1' }]) },
    walletTransaction: { count: jest.fn() },
    withdrawal: { count: jest.fn() },
    marketListing: { count: jest.fn() },
  };
  const service = new MarketAbuseService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('flags direct self-trade', async () => {
    const flags = await service.evaluateAfterTrade({
      buyerUserId: 'u1',
      sellerUserId: 'u1',
      releaseId: 'r1',
      tradeId: 't1',
    });
    expect(flags).toContain('self_trade_direct');
  });

  it('flags rapid pair trading', async () => {
    prisma.trade.count.mockResolvedValue(3);
    prisma.walletTransaction.count.mockResolvedValue(0);
    prisma.withdrawal.count.mockResolvedValue(0);
    const flags = await service.evaluateAfterTrade({
      buyerUserId: 'u1',
      sellerUserId: 'u2',
      releaseId: 'r1',
      tradeId: 't1',
    });
    expect(flags).toContain('rapid_pair_trading');
  });
});
