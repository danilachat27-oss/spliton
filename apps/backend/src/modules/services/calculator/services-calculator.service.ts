import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrimaryRaiseRoundStatus, Prisma, ReleaseStatus } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { CACHE_TTL_MS } from '../../../common/cache/cache-ttl.constants';
import { TtlCacheService } from '../../../common/cache/ttl-cache.service';
import { throwAppError } from '../../../common/platform/errors/throw-app-error';
import { ErrorCodes } from '../../../common/platform/errors/error-codes';
import { PublicPlatformFeesService } from '../../platform/public-platform-fees.service';
import { CalculatorPreviewDto } from './dto/calculator-preview.dto';

const CALCULATOR_CONFIG_CACHE_KEY = 'services:calculator:config';

function dec(v: string | number | Prisma.Decimal | null | undefined): Prisma.Decimal {
  if (v == null) return new Prisma.Decimal(0);
  return v instanceof Prisma.Decimal ? v : new Prisma.Decimal(v);
}

function pctToRate(pct: string): Prisma.Decimal {
  return dec(pct).div(100);
}

@Injectable()
export class ServicesCalculatorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fees: PublicPlatformFeesService,
    private readonly config: ConfigService,
    private readonly cache: TtlCacheService,
  ) {}

  private walletCfg() {
    return this.config.get<{
      minWithdrawalUsdt: number;
      defaultWithdrawalFeeUsdt: number;
    }>('wallet')!;
  }

  async getConfig() {
    return this.cache.getOrSet(
      CALCULATOR_CONFIG_CACHE_KEY,
      CACHE_TTL_MS.servicesCalculatorConfig,
      () => this.buildConfig(),
    );
  }

  private async buildConfig() {
    const feeRow = await this.fees.getPublicFees();
    const walletCfg = this.walletCfg();

    const releases = await this.prisma.release.findMany({
      where: {
        status: { in: [ReleaseStatus.ACTIVE, ReleaseStatus.REVIEW] },
        primaryRaiseRounds: {
          some: { status: PrimaryRaiseRoundStatus.LIVE },
        },
      },
      select: {
        id: true,
        slug: true,
        title: true,
        primaryUnitPrice: true,
        unitsAvailablePrimary: true,
        minPurchaseUnits: true,
        maxPurchaseUnits: true,
        totalUnits: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return {
      fees: {
        primaryPurchaseFeePct: feeRow.primaryPurchaseFeePct,
        secondaryMarketFeePct: feeRow.secondaryMarketFeePct,
        withdrawalFeeFixedUsdt: feeRow.withdrawalFeeFixedUsdt,
        withdrawalFeePct: feeRow.withdrawalFeePct,
        depositFeePct: feeRow.depositFeePct,
        effectiveFrom: feeRow.effectiveFrom,
        source: feeRow.source,
      },
      limits: {
        minWithdrawalUsdt: String(walletCfg.minWithdrawalUsdt),
        minDepositUsdt: '0',
        disclaimer:
          'Расчёты ориентировочные. Фактические суммы и комиссии отображаются в превью операции перед подтверждением. Доходность не гарантируется.',
      },
      releases: releases.map((r) => ({
        id: r.id,
        slug: r.slug,
        title: r.title,
        pricePerUnitUsdt: r.primaryUnitPrice.toString(),
        availableUnits: r.unitsAvailablePrimary.toString(),
        totalUnits: r.totalUnits.toString(),
        minPurchaseUnits: r.minPurchaseUnits?.toString() ?? null,
        maxPurchaseUnits: r.maxPurchaseUnits?.toString() ?? null,
      })),
      updatedAt: new Date().toISOString(),
    };
  }

  async preview(dto: CalculatorPreviewDto) {
    const config = await this.getConfig();
    const primaryRate = pctToRate(config.fees.primaryPurchaseFeePct);
    const secondaryRate = pctToRate(config.fees.secondaryMarketFeePct);
    const withdrawFixed = dec(config.fees.withdrawalFeeFixedUsdt);
    const withdrawRate = pctToRate(config.fees.withdrawalFeePct);

    let release = dto.releaseId
      ? config.releases.find((r) => r.id === dto.releaseId)
      : config.releases[0];

    if (dto.releaseId && !release) {
      throwAppError(ErrorCodes.VALIDATION_ERROR, 'Release not found', HttpStatus.BAD_REQUEST);
    }

    const pricePerUnit = dto.pricePerUnit
      ? dec(dto.pricePerUnit)
      : release
        ? dec(release.pricePerUnitUsdt)
        : null;

    switch (dto.scenario) {
      case 'buy': {
        const mode = dto.buyMode ?? 'usdt';
        if (!pricePerUnit || pricePerUnit.lte(0)) {
          throwAppError(
            ErrorCodes.VALIDATION_ERROR,
            'Price per unit is required for buy preview',
            HttpStatus.BAD_REQUEST,
          );
        }
        if (mode === 'usdt') {
          const total = dec(dto.amount ?? '0');
          if (total.lte(0)) {
            throwAppError(ErrorCodes.VALIDATION_ERROR, 'Amount must be positive', HttpStatus.BAD_REQUEST);
          }
          const platformFee = total.mul(primaryRate);
          const net = total.sub(platformFee);
          const units = net.div(pricePerUnit!);
          return {
            scenario: dto.scenario,
            totalUsdt: total.toString(),
            platformFeeUsdt: platformFee.toString(),
            netUsdt: net.toString(),
            units: units.toString(),
            pricePerUnitUsdt: pricePerUnit!.toString(),
            disclaimer: config.limits.disclaimer,
          };
        }
        const units = dec(dto.units ?? '0');
        if (units.lte(0)) {
          throwAppError(ErrorCodes.VALIDATION_ERROR, 'Units must be positive', HttpStatus.BAD_REQUEST);
        }
        const net = units.mul(pricePerUnit!);
        const total = net.div(new Prisma.Decimal(1).sub(primaryRate));
        const platformFee = total.sub(net);
        return {
          scenario: dto.scenario,
          totalUsdt: total.toString(),
          platformFeeUsdt: platformFee.toString(),
          netUsdt: net.toString(),
          units: units.toString(),
          pricePerUnitUsdt: pricePerUnit!.toString(),
          disclaimer: config.limits.disclaimer,
        };
      }
      case 'sell': {
        const units = dec(dto.units ?? '0');
        const price = dto.pricePerUnit ? dec(dto.pricePerUnit) : pricePerUnit;
        if (!price || price.lte(0) || units.lte(0)) {
          throwAppError(
            ErrorCodes.VALIDATION_ERROR,
            'Units and price are required for sell preview',
            HttpStatus.BAD_REQUEST,
          );
        }
        const gross = units.mul(price);
        const fee = gross.mul(secondaryRate);
        const net = gross.sub(fee);
        return {
          scenario: dto.scenario,
          grossUsdt: gross.toString(),
          secondaryFeeUsdt: fee.toString(),
          netUsdt: net.toString(),
          units: units.toString(),
          pricePerUnitUsdt: price.toString(),
          disclaimer: config.limits.disclaimer,
        };
      }
      case 'withdraw': {
        const amount = dec(dto.amount ?? '0');
        if (amount.lte(0)) {
          throwAppError(ErrorCodes.VALIDATION_ERROR, 'Amount must be positive', HttpStatus.BAD_REQUEST);
        }
        const pctFee = amount.mul(withdrawRate);
        const fee = Prisma.Decimal.max(withdrawFixed, pctFee);
        const net = amount.sub(fee);
        return {
          scenario: dto.scenario,
          amountUsdt: amount.toString(),
          withdrawalFeeUsdt: fee.toString(),
          netUsdt: net.gte(0) ? net.toString() : '0',
          disclaimer: config.limits.disclaimer,
        };
      }
      case 'payout': {
        const units = dec(dto.units ?? '0');
        const pool = dec(dto.poolUsdt ?? '0');
        const totalUnits = dto.totalUnits
          ? dec(dto.totalUnits)
          : release
            ? dec(release.totalUnits)
            : null;
        if (!totalUnits || totalUnits.lte(0) || units.lte(0) || pool.lte(0)) {
          throwAppError(
            ErrorCodes.VALIDATION_ERROR,
            'Units, pool and total units are required for payout preview',
            HttpStatus.BAD_REQUEST,
          );
        }
        const share = units.div(totalUnits);
        const estimated = pool.mul(share);
        return {
          scenario: dto.scenario,
          estimatedUsdt: estimated.toString(),
          sharePct: share.mul(100).toString(),
          disclaimer:
            'Оценка доли в выплате не гарантирует будущие начисления. Фактические выплаты зависят от отчётности релиза.',
        };
      }
      default:
        throwAppError(ErrorCodes.VALIDATION_ERROR, 'Unknown scenario', HttpStatus.BAD_REQUEST);
    }
  }
}
