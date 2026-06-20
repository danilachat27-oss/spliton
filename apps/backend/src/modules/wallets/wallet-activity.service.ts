import { Injectable } from '@nestjs/common';
import {
  Prisma,
  WalletTxDirection,
  WalletTxStatus,
  WalletTxType,
} from '@prisma/client';
import { resolvePagination } from '../../common/pagination/pagination.util';
import { PrismaService } from '../../prisma/prisma.service';
import { activityPeriodSince } from './activity-period.util';
import { UserWalletService } from './user-wallet.service';
import type { WalletActivityQueryDto } from './dto/wallet-activity-query.dto';
import type {
  WalletActivityItemDto,
  WalletActivityListDto,
  WalletActivityTypeSlug,
} from './types/wallet-activity.types';

type TxRow = {
  id: string;
  txType: WalletTxType;
  direction: WalletTxDirection;
  amount: Prisma.Decimal;
  feeAmount: Prisma.Decimal;
  netAmount: Prisma.Decimal;
  currency: string;
  status: WalletTxStatus;
  referenceType: string | null;
  referenceId: string | null;
  happenedAt: Date;
};

@Injectable()
export class WalletActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userWallet: UserWalletService,
  ) {}

  async list(
    userId: string,
    query: WalletActivityQueryDto,
  ): Promise<WalletActivityListDto> {
    const pageSize = query.limit ?? query.pageSize;
    const { page, pageSize: resolvedPageSize, skip } = resolvePagination(
      query.page,
      pageSize,
    );
    const wallet = await this.userWallet.getOrCreateWallet(userId);

    const releaseScope = query.releaseId
      ? await this.buildReleaseScope(userId, query.releaseId)
      : null;

    const searchScope = query.q?.trim()
      ? await this.buildSearchScope(userId, wallet.id, query.q.trim())
      : null;

    const where = this.buildWhere(
      wallet.id,
      query,
      releaseScope,
      searchScope,
    );
    const orderBy = this.resolveOrderBy(query.sort ?? 'newest');

    const [total, rows] = await Promise.all([
      this.prisma.walletTransaction.count({ where }),
      this.prisma.walletTransaction.findMany({
        where,
        orderBy,
        skip,
        take: resolvedPageSize,
      }),
    ]);

    const enriched = await this.enrichRows(rows);
    const items = enriched.map((row) => this.mapRow(row));

    return {
      items,
      total,
      page,
      pageSize: resolvedPageSize,
      hasMore: skip + rows.length < total,
    };
  }

  private resolveOrderBy(
    sort: NonNullable<WalletActivityQueryDto['sort']>,
  ): Prisma.WalletTransactionOrderByWithRelationInput[] {
    switch (sort) {
      case 'oldest':
        return [{ happenedAt: 'asc' }, { id: 'asc' }];
      case 'amount_desc':
        return [{ netAmount: 'desc' }, { happenedAt: 'desc' }];
      case 'amount_asc':
        return [{ netAmount: 'asc' }, { happenedAt: 'desc' }];
      case 'newest':
      default:
        return [{ happenedAt: 'desc' }, { id: 'desc' }];
    }
  }

  private buildWhere(
    walletId: string,
    query: WalletActivityQueryDto,
    releaseScope: Prisma.WalletTransactionWhereInput | null,
    searchScope: Prisma.WalletTransactionWhereInput | null,
  ): Prisma.WalletTransactionWhereInput {
    const where: Prisma.WalletTransactionWhereInput = { walletId };

    if (query.asset?.trim()) {
      where.currency = query.asset.trim().toUpperCase();
    }

    const fromIso =
      query.from ??
      (query.period ? activityPeriodSince(query.period) : undefined);
    const toIso = query.to;

    if (fromIso || toIso) {
      where.happenedAt = {};
      if (fromIso) {
        where.happenedAt.gte = new Date(fromIso);
      }
      if (toIso) {
        where.happenedAt.lte = new Date(toIso);
      }
    }

    if (query.status) {
      const statuses = this.statusFilterToPrisma(query.status);
      if (statuses.length === 1) {
        where.status = statuses[0];
      } else if (statuses.length > 1) {
        where.status = { in: statuses };
      }
    }

    if (query.direction === 'in') {
      where.direction = WalletTxDirection.IN;
    } else if (query.direction === 'out') {
      where.direction = WalletTxDirection.OUT;
    }

    if (query.amountMin != null || query.amountMax != null) {
      where.netAmount = {};
      if (query.amountMin != null) {
        where.netAmount.gte = new Prisma.Decimal(query.amountMin);
      }
      if (query.amountMax != null) {
        where.netAmount.lte = new Prisma.Decimal(query.amountMax);
      }
    }

    const kindWhere = query.kind ? this.kindFilterToWhere(query.kind) : null;
    const typeWhere = query.type ? this.typeFilterToWhere(query.type) : null;
    if (kindWhere) {
      Object.assign(where, kindWhere);
    } else if (typeWhere) {
      Object.assign(where, typeWhere);
    }

    const andParts: Prisma.WalletTransactionWhereInput[] = [];
    if (releaseScope) andParts.push(releaseScope);
    if (searchScope) andParts.push(searchScope);

    if (andParts.length > 0) {
      where.AND = [
        ...(Array.isArray(where.AND)
          ? where.AND
          : where.AND
            ? [where.AND]
            : []),
        ...andParts,
      ];
    }

    return where;
  }

  private kindFilterToWhere(
    kind: NonNullable<WalletActivityQueryDto['kind']>,
  ): Prisma.WalletTransactionWhereInput {
    switch (kind) {
      case 'deposits':
        return { txType: WalletTxType.DEPOSIT };
      case 'withdrawals':
        return { txType: WalletTxType.WITHDRAWAL };
      case 'payouts':
        return {
          txType: {
            in: [
              WalletTxType.DEPOSIT,
              WalletTxType.WITHDRAWAL,
              WalletTxType.PAYOUT,
              WalletTxType.REFUND,
              WalletTxType.ADMIN_ADJUSTMENT,
            ],
          },
        };
      case 'buys':
        return {
          OR: [
            {
              txType: WalletTxType.TRADE_SETTLEMENT,
              referenceType: 'primary_order',
            },
            {
              txType: WalletTxType.TRADE_SETTLEMENT,
              referenceType: 'secondary_trade',
              direction: WalletTxDirection.OUT,
            },
          ],
        };
      case 'sells':
        return {
          txType: WalletTxType.TRADE_SETTLEMENT,
          referenceType: 'secondary_trade',
          direction: WalletTxDirection.IN,
        };
      case 'transfers':
        return {
          txType: {
            in: [
              WalletTxType.FEE,
              WalletTxType.REFUND,
              WalletTxType.TRADE_LOCK,
              WalletTxType.ADMIN_ADJUSTMENT,
              WalletTxType.PAYOUT,
            ],
          },
        };
      default:
        return {};
    }
  }

  private async buildSearchScope(
    userId: string,
    walletId: string,
    q: string,
  ): Promise<Prisma.WalletTransactionWhereInput> {
    const pattern = `%${q}%`;
    const idRows = await this.prisma.$queryRaw<{ id: string }[]>`
      SELECT id
      FROM wallet_transactions
      WHERE wallet_id = ${walletId}::uuid
        AND (
          id::text ILIKE ${pattern}
          OR reference_id::text ILIKE ${pattern}
        )
      LIMIT 50
    `;

    const or: Prisma.WalletTransactionWhereInput[] = idRows.map((row) => ({
      id: row.id,
    }));

    const positions = await this.prisma.userPosition.findMany({
      where: {
        userId,
        release: { title: { contains: q, mode: 'insensitive' } },
      },
      select: { releaseId: true },
      distinct: ['releaseId'],
      take: 20,
    });

    for (const pos of positions) {
      or.push(await this.buildReleaseScope(userId, pos.releaseId));
    }

    if (or.length === 0) {
      return { id: '00000000-0000-0000-0000-000000000000' };
    }

    return { OR: or };
  }

  private statusFilterToPrisma(
    status: NonNullable<WalletActivityQueryDto['status']>,
  ): WalletTxStatus[] {
    switch (status) {
      case 'pending':
        return [WalletTxStatus.PENDING];
      case 'completed':
        return [WalletTxStatus.COMPLETED];
      case 'failed':
        return [WalletTxStatus.FAILED];
      case 'cancelled':
        return [WalletTxStatus.CANCELLED];
      case 'reversed':
        return [WalletTxStatus.REVERSED];
      case 'processing':
        return [WalletTxStatus.PENDING];
      default:
        return [];
    }
  }

  private typeFilterToWhere(
    type: NonNullable<WalletActivityQueryDto['type']>,
  ): Prisma.WalletTransactionWhereInput {
    switch (type) {
      case 'deposit':
        return { txType: WalletTxType.DEPOSIT };
      case 'withdrawal':
        return { txType: WalletTxType.WITHDRAWAL };
      case 'payout':
        return { txType: WalletTxType.PAYOUT };
      case 'fee':
        return { txType: WalletTxType.FEE };
      case 'refund':
        return { txType: WalletTxType.REFUND };
      case 'trade_lock':
        return { txType: WalletTxType.TRADE_LOCK };
      case 'admin_adjustment':
        return { txType: WalletTxType.ADMIN_ADJUSTMENT };
      case 'primary_purchase':
        return {
          txType: WalletTxType.TRADE_SETTLEMENT,
          referenceType: 'primary_order',
        };
      case 'secondary_buy':
        return {
          txType: WalletTxType.TRADE_SETTLEMENT,
          referenceType: 'secondary_trade',
          direction: WalletTxDirection.OUT,
        };
      case 'secondary_sell':
        return {
          txType: WalletTxType.TRADE_SETTLEMENT,
          referenceType: 'secondary_trade',
          direction: WalletTxDirection.IN,
        };
      default:
        return {};
    }
  }

  private async buildReleaseScope(
    userId: string,
    releaseId: string,
  ): Promise<Prisma.WalletTransactionWhereInput> {
    const [orderIds, listingIds, distributionIds, payoutTxIds] =
      await Promise.all([
        this.prisma.order.findMany({
          where: { userId, releaseId },
          select: { id: true },
        }),
        this.prisma.marketListing.findMany({
          where: { releaseId },
          select: { id: true },
        }),
        this.prisma.earningDistribution.findMany({
          where: { releaseId },
          select: { id: true },
        }),
        this.prisma.payout.findMany({
          where: { userId, releaseId, walletTxId: { not: null } },
          select: { walletTxId: true },
        }),
      ]);

    const or: Prisma.WalletTransactionWhereInput[] = [];

    if (orderIds.length) {
      or.push({
        referenceType: 'primary_order',
        referenceId: { in: orderIds.map((o) => o.id) },
      });
      or.push({
        referenceType: 'primary_order_fee',
        referenceId: { in: orderIds.map((o) => o.id) },
      });
    }

    if (listingIds.length) {
      const ids = listingIds.map((l) => l.id);
      or.push({ referenceType: 'secondary_trade', referenceId: { in: ids } });
      or.push({ referenceType: 'secondary_fee', referenceId: { in: ids } });
    }

    if (distributionIds.length) {
      or.push({
        referenceType: 'earning_distribution',
        referenceId: { in: distributionIds.map((d) => d.id) },
      });
    }

    const wtxIds = payoutTxIds
      .map((p) => p.walletTxId)
      .filter((id): id is string => id != null);
    if (wtxIds.length) {
      or.push({ id: { in: wtxIds } });
    }

    if (or.length === 0) {
      return { id: '00000000-0000-0000-0000-000000000000' };
    }

    return { OR: or };
  }

  private classifyType(row: TxRow): WalletActivityTypeSlug {
    if (row.txType === WalletTxType.DEPOSIT) return 'deposit';
    if (row.txType === WalletTxType.WITHDRAWAL) return 'withdrawal';
    if (row.txType === WalletTxType.PAYOUT) return 'payout';
    if (row.txType === WalletTxType.FEE) return 'fee';
    if (row.txType === WalletTxType.REFUND) return 'refund';
    if (row.txType === WalletTxType.TRADE_LOCK) return 'trade_lock';
    if (row.txType === WalletTxType.ADMIN_ADJUSTMENT) return 'admin_adjustment';
    if (row.txType === WalletTxType.TRADE_SETTLEMENT) {
      if (row.referenceType === 'primary_order') return 'primary_purchase';
      if (row.referenceType === 'secondary_trade') {
        return row.direction === WalletTxDirection.OUT
          ? 'secondary_buy'
          : 'secondary_sell';
      }
      return row.direction === WalletTxDirection.OUT
        ? 'secondary_buy'
        : 'secondary_sell';
    }
    return 'other';
  }

  private async enrichRows(rows: TxRow[]) {
    const primaryOrderIds: string[] = [];
    const listingIds: string[] = [];
    const depositIds: string[] = [];
    const withdrawalIds: string[] = [];
    const distributionIds: string[] = [];

    for (const row of rows) {
      if (!row.referenceId) continue;
      switch (row.referenceType) {
        case 'primary_order':
        case 'primary_order_fee':
          primaryOrderIds.push(row.referenceId);
          break;
        case 'secondary_trade':
        case 'secondary_fee':
          listingIds.push(row.referenceId);
          break;
        case 'deposit':
          depositIds.push(row.referenceId);
          break;
        case 'withdrawal':
          withdrawalIds.push(row.referenceId);
          break;
        case 'earning_distribution':
          distributionIds.push(row.referenceId);
          break;
        default:
          break;
      }
    }

    const [orders, listings, deposits, withdrawals, distributions] =
      await Promise.all([
        primaryOrderIds.length
          ? this.prisma.order.findMany({
              where: { id: { in: [...new Set(primaryOrderIds)] } },
              include: { release: { select: { id: true, title: true } } },
            })
          : [],
        listingIds.length
          ? this.prisma.marketListing.findMany({
              where: { id: { in: [...new Set(listingIds)] } },
              include: { release: { select: { id: true, title: true } } },
            })
          : [],
        depositIds.length
          ? this.prisma.deposit.findMany({
              where: { id: { in: [...new Set(depositIds)] } },
            })
          : [],
        withdrawalIds.length
          ? this.prisma.withdrawal.findMany({
              where: { id: { in: [...new Set(withdrawalIds)] } },
            })
          : [],
        distributionIds.length
          ? this.prisma.earningDistribution.findMany({
              where: { id: { in: [...new Set(distributionIds)] } },
              include: { release: { select: { id: true, title: true } } },
            })
          : [],
      ]);

    const orderById = new Map(orders.map((o) => [o.id, o]));
    const listingById = new Map(listings.map((l) => [l.id, l]));
    const depositById = new Map(deposits.map((d) => [d.id, d]));
    const withdrawalById = new Map(withdrawals.map((w) => [w.id, w]));
    const distributionById = new Map(distributions.map((d) => [d.id, d]));

    return rows.map((row) => {
      let releaseId: string | null = null;
      let releaseTitle: string | null = null;
      let units: string | null = null;
      const relatedType = row.referenceType ?? 'wallet_transaction';
      const relatedId = row.referenceId ?? row.id;
      let description = '';

      if (row.referenceId) {
        if (
          row.referenceType === 'primary_order' ||
          row.referenceType === 'primary_order_fee'
        ) {
          const order = orderById.get(row.referenceId);
          if (order) {
            releaseId = order.releaseId;
            releaseTitle = order.release.title;
            units = order.unitsFilled.toString();
            description =
              row.referenceType === 'primary_order_fee'
                ? `Комиссия · ${order.release.title}`
                : `Покупка UNT · ${order.release.title}`;
          }
        } else if (
          row.referenceType === 'secondary_trade' ||
          row.referenceType === 'secondary_fee'
        ) {
          const listing = listingById.get(row.referenceId);
          if (listing) {
            releaseId = listing.releaseId;
            releaseTitle = listing.release.title;
            units = listing.unitsTotal.toString();
            description =
              row.referenceType === 'secondary_fee'
                ? `Комиссия secondary · ${listing.release.title}`
                : `${row.direction === WalletTxDirection.OUT ? 'Покупка' : 'Продажа'} UNT · ${listing.release.title}`;
          }
        } else if (row.referenceType === 'deposit') {
          const dep = depositById.get(row.referenceId);
          description = dep
            ? `Пополнение USDT · ${dep.status}`
            : 'Пополнение USDT';
        } else if (row.referenceType === 'withdrawal') {
          const wd = withdrawalById.get(row.referenceId);
          description = wd
            ? `Вывод на ${wd.toAddress.slice(0, 8)}…`
            : 'Вывод USDT';
        } else if (row.referenceType === 'earning_distribution') {
          const dist = distributionById.get(row.referenceId);
          if (dist) {
            releaseId = dist.releaseId;
            releaseTitle = dist.release.title;
            description = `Выплата дохода · ${dist.release.title}`;
          }
        }
      }

      if (!description) {
        description = this.defaultDescription(row);
      }

      return {
        row,
        releaseId,
        releaseTitle,
        units,
        description,
        relatedType,
        relatedId,
      };
    });
  }

  private defaultDescription(row: TxRow): string {
    const type = this.classifyType(row);
    switch (type) {
      case 'deposit':
        return 'Пополнение кошелька USDT (TRC20)';
      case 'withdrawal':
        return 'Вывод USDT';
      case 'primary_purchase':
        return 'Покупка UNT на первичном рынке';
      case 'secondary_buy':
        return 'Покупка UNT на вторичном рынке';
      case 'secondary_sell':
        return 'Продажа UNT на вторичном рынке';
      case 'payout':
        return 'Начисление дохода по релизу';
      case 'fee':
        return 'Комиссия платформы';
      case 'refund':
        return 'Возврат средств';
      case 'trade_lock':
        return 'Резервирование средств под сделку';
      case 'admin_adjustment':
        return 'Корректировка баланса';
      default:
        return 'Операция по кошельку';
    }
  }

  private mapRow(
    enriched: Awaited<ReturnType<WalletActivityService['enrichRows']>>[number],
  ): WalletActivityItemDto {
    const {
      row,
      releaseId,
      releaseTitle,
      units,
      description,
      relatedType,
      relatedId,
    } = enriched;
    const type = this.classifyType(row);
    const direction = row.direction === WalletTxDirection.IN ? 'in' : 'out';
    const sign = direction === 'in' ? '+' : '−';
    const amount = this.formatMoney(row.netAmount);
    const labels = this.labelsForType(type);

    return {
      id: row.id,
      type,
      title: labels.title,
      description,
      amount: `${sign}${amount}`,
      amountSigned: `${sign}${row.netAmount.toFixed(2)}`,
      asset: row.currency,
      status: row.status.toLowerCase(),
      statusLabel: this.statusLabel(row.status),
      createdAt: row.happenedAt.toISOString(),
      direction,
      userFacingLabel: labels.userFacingLabel,
      referenceId: row.id,
      relatedEntity: {
        type: relatedType,
        id: relatedId,
        releaseId,
        releaseTitle,
      },
      feeAmount: row.feeAmount.greaterThan(0) ? row.feeAmount.toFixed(2) : null,
      units,
      source: this.sourceForType(type),
    };
  }

  private sourceForType(
    type: WalletActivityTypeSlug,
  ): WalletActivityItemDto['source'] {
    switch (type) {
      case 'primary_purchase':
        return 'primary';
      case 'secondary_buy':
      case 'secondary_sell':
        return 'secondary';
      case 'payout':
        return 'payout';
      case 'deposit':
      case 'withdrawal':
      case 'fee':
      case 'refund':
        return 'wallet';
      default:
        return 'system';
    }
  }

  private labelsForType(type: WalletActivityTypeSlug): {
    title: string;
    userFacingLabel: string;
  } {
    switch (type) {
      case 'deposit':
        return { title: 'Пополнение', userFacingLabel: 'Пополнение USDT' };
      case 'withdrawal':
        return { title: 'Вывод', userFacingLabel: 'Вывод USDT' };
      case 'primary_purchase':
        return {
          title: 'Покупка UNT',
          userFacingLabel: 'Первичный рынок',
        };
      case 'secondary_buy':
        return {
          title: 'Покупка UNT',
          userFacingLabel: 'Вторичный рынок · покупка',
        };
      case 'secondary_sell':
        return {
          title: 'Продажа UNT',
          userFacingLabel: 'Вторичный рынок · продажа',
        };
      case 'payout':
        return { title: 'Выплата', userFacingLabel: 'Доход по релизу' };
      case 'fee':
        return { title: 'Комиссия', userFacingLabel: 'Комиссия платформы' };
      case 'refund':
        return { title: 'Возврат', userFacingLabel: 'Возврат средств' };
      case 'trade_lock':
        return { title: 'Резерв', userFacingLabel: 'Блокировка средств' };
      case 'admin_adjustment':
        return { title: 'Корректировка', userFacingLabel: 'Корректировка' };
      default:
        return { title: 'Операция', userFacingLabel: 'Операция' };
    }
  }

  private statusLabel(status: WalletTxStatus): string {
    switch (status) {
      case WalletTxStatus.COMPLETED:
        return 'Завершено';
      case WalletTxStatus.PENDING:
        return 'В обработке';
      case WalletTxStatus.FAILED:
        return 'Ошибка';
      case WalletTxStatus.CANCELLED:
        return 'Отменено';
      case WalletTxStatus.REVERSED:
        return 'Сторнировано';
      default:
        return status;
    }
  }

  private formatMoney(value: Prisma.Decimal): string {
    return value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP).toFixed(2);
  }
}
