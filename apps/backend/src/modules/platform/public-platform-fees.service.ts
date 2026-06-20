import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { CACHE_TTL_MS } from '../../common/cache/cache-ttl.constants';
import { TtlCacheService } from '../../common/cache/ttl-cache.service';
import { PrismaService } from '../../prisma/prisma.service';

const FEES_CACHE_KEY = 'platform:public-fees';

@Injectable()
export class PublicPlatformFeesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly cache: TtlCacheService,
  ) {}

  async getPublicFees() {
    return this.cache.getOrSet(FEES_CACHE_KEY, CACHE_TTL_MS.publicPlatformFees, () =>
      this.loadPublicFees(),
    );
  }

  private async loadPublicFees() {
    const walletCfg = this.config.get<{
      defaultWithdrawalFeeUsdt: number;
    }>('wallet');

    const active = await this.prisma.platformFeeSetting.findFirst({
      where: { isActive: true },
      orderBy: { effectiveFrom: 'desc' },
    });

    const primaryPct =
      active?.primaryPurchaseFeePct ?? new Prisma.Decimal(2);
    const secondaryPct =
      active?.secondaryMarketFeePct ?? new Prisma.Decimal(1);
    const withdrawFixed =
      active?.withdrawalFeeFixed ??
      new Prisma.Decimal(walletCfg?.defaultWithdrawalFeeUsdt ?? 1);
    const withdrawPct = active?.withdrawalFeePct ?? new Prisma.Decimal(0);

    return {
      primaryPurchaseFeePct: primaryPct.toString(),
      secondaryMarketFeePct: secondaryPct.toString(),
      withdrawalFeeFixedUsdt: withdrawFixed.toString(),
      withdrawalFeePct: withdrawPct.toString(),
      depositFeePct: '0',
      effectiveFrom: active?.effectiveFrom.toISOString() ?? null,
      source: active ? 'platform_fee_settings' : 'defaults',
      disclaimer:
        'Тарифы носят справочный характер. Фактическая комиссия отображается в превью сделки перед подтверждением.',
    };
  }
}
