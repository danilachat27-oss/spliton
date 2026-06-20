import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ActorRole,
  LedgerOperationType,
  OrderSide,
  OrderStatus,
  OrderType,
  OwnershipEventType,
  Prisma,
  PrimaryRaiseRoundStatus,
  ReleaseStatus,
  ShareLotType,
  TimeInForce,
  ConsentSource,
  UserStatus,
  WalletTxDirection,
  WalletTxStatus,
  WalletTxType,
} from '@prisma/client';
import { resolvePagination } from '../../common/pagination/pagination.util';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAdminError } from '../admin/common/admin-http.util';
import { assertMatrixSection } from '../admin/common/admin-role-matrix';
import { PlatformFeeLedgerService } from '../admin/common/platform-fee-ledger.service';
import { WalletLedgerService } from '../admin/common/wallet-ledger.service';
import { UserWalletService } from '../wallets/user-wallet.service';
import { WalletAuditService } from '../wallets/wallet-audit.service';
import { CacheInvalidationService } from '../../common/platform/cache/cache-invalidation.service';
import { FeatureFlagsService } from '../../common/platform/feature-flags/feature-flags.service';
import { hashRequestPayload } from '../../common/platform/idempotency/request-hash.util';
import { ErrorCodes } from '../../common/platform/errors/error-codes';
import { throwAppError } from '../../common/platform/errors/throw-app-error';
import { EligibilityService } from '../compliance/eligibility.service';
import { NotificationEventsService } from '../notifications/notification-events.service';
import { ReferralEventsService } from '../referrals/referral-events.service';
import type { CreatePrimaryOrderDto } from './dto/create-primary-order.dto';
import {
  mapPrimaryOrderResponse,
  orderStatusToApi,
} from './primary-order.mapper';

@Injectable()
export class PrimaryOrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: WalletLedgerService,
    private readonly feeLedger: PlatformFeeLedgerService,
    private readonly wallets: UserWalletService,
    private readonly audit: WalletAuditService,
    private readonly eligibility: EligibilityService,
    private readonly notificationEvents: NotificationEventsService,
    private readonly flags: FeatureFlagsService,
    private readonly cacheInvalidation: CacheInvalidationService,
    private readonly referralEvents: ReferralEventsService,
  ) {}

  async purchase(
    userId: string,
    dto: CreatePrimaryOrderDto,
    meta?: { ip: string | null; userAgent: string | null },
  ) {
    await this.eligibility.assertAllowed(userId, ConsentSource.PRIMARY_PURCHASE);
    this.flags.assertEnabled('enablePrimaryMarket');

    const idempotencyKey = dto.idempotencyKey.trim();
    const requestHash = hashRequestPayload({
      roundId: dto.roundId,
      units: dto.units,
    });
    const units = new Prisma.Decimal(String(dto.units));

    if (units.lessThanOrEqualTo(0)) {
      throwAdminError(
        'INVALID_UNITS',
        'Units must be positive',
        HttpStatus.BAD_REQUEST,
      );
    }

    const existing = await this.prisma.order.findFirst({
      where: { userId, idempotencyKey },
    });
    if (existing) {
      const priorHash = hashRequestPayload({
        roundId: existing.primaryRaiseRoundId ?? dto.roundId,
        units: Number(existing.unitsTotal.toString()),
      });
      if (priorHash !== requestHash) {
        throwAppError(
          ErrorCodes.IDEMPOTENCY_CONFLICT,
          'Idempotency key was already used with different purchase parameters',
          HttpStatus.CONFLICT,
        );
      }
      return mapPrimaryOrderResponse({
        orderId: existing.id,
        releaseId: existing.releaseId,
        roundId: existing.primaryRaiseRoundId ?? dto.roundId,
        units: existing.unitsTotal.toString(),
        grossAmount: existing.grossAmount?.toString() ?? '0',
        feeAmount: existing.feeAmount?.toString() ?? '0',
        netAmount: existing.netAmount?.toString() ?? '0',
        pricePerUnit: existing.unitPrice?.toString() ?? '0',
        status: existing.status,
        idempotentReplay: true,
      });
    }

    const wallet = await this.wallets.getOrCreateWallet(userId);

    const result = await this.prisma.$transaction(
      async (tx) => {
      const dup = await tx.order.findFirst({
        where: { userId, idempotencyKey },
      });
      if (dup) {
        return mapPrimaryOrderResponse({
          orderId: dup.id,
          releaseId: dup.releaseId,
          roundId: dup.primaryRaiseRoundId ?? dto.roundId,
          units: dup.unitsTotal.toString(),
          grossAmount: dup.grossAmount?.toString() ?? '0',
          feeAmount: dup.feeAmount?.toString() ?? '0',
          netAmount: dup.netAmount?.toString() ?? '0',
          pricePerUnit: dup.unitPrice?.toString() ?? '0',
          status: dup.status,
          idempotentReplay: true,
        });
      }

      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user || user.status !== UserStatus.ACTIVE) {
        throwAdminError(
          'USER_NOT_ACTIVE',
          'User account is not active',
          HttpStatus.FORBIDDEN,
        );
      }

      const fees = await this.activeFeeSettings(tx);

      const lockedRound = await tx.$queryRaw<
        Array<{
          id: string;
          release_id: string;
          status: PrimaryRaiseRoundStatus;
          hard_cap_usdt: Prisma.Decimal;
          raised_amount_usdt: Prisma.Decimal;
          total_units: Prisma.Decimal;
          sold_units: Prisma.Decimal;
        }>
      >`
        SELECT id, release_id, status, hard_cap_usdt, raised_amount_usdt, total_units, sold_units
        FROM primary_raise_rounds
        WHERE id = ${dto.roundId}::uuid
        FOR UPDATE
      `;
      const roundRow = lockedRound[0];
      if (!roundRow) {
        throwAdminError(
          'ROUND_NOT_FOUND',
          'Round not found',
          HttpStatus.NOT_FOUND,
        );
      }

      const lockedRelease = await tx.$queryRaw<
        Array<{
          id: string;
          status: ReleaseStatus;
          primary_unit_price: Prisma.Decimal;
          units_available_primary: Prisma.Decimal;
          min_purchase_units: Prisma.Decimal | null;
          max_purchase_units: Prisma.Decimal | null;
        }>
      >`
        SELECT id, status, primary_unit_price, units_available_primary, min_purchase_units, max_purchase_units
        FROM releases
        WHERE id = ${roundRow.release_id}::uuid AND deleted_at IS NULL
        FOR UPDATE
      `;
      const release = lockedRelease[0];
      if (!release) {
        throwAdminError(
          'TRACK_NOT_FOUND',
          'Track not found',
          HttpStatus.NOT_FOUND,
        );
      }
      if (roundRow.status !== PrimaryRaiseRoundStatus.LIVE) {
        throwAdminError(
          'ROUND_NOT_ACTIVE',
          'Round is not open for purchase',
          HttpStatus.CONFLICT,
        );
      }
      if (release.status !== ReleaseStatus.ACTIVE) {
        throwAdminError(
          'TRACK_NOT_ACTIVE',
          'Track is not active',
          HttpStatus.CONFLICT,
        );
      }

      const availableRoundUnits = roundRow.total_units.minus(
        roundRow.sold_units,
      );
      if (units.greaterThan(availableRoundUnits)) {
        throwAdminError(
          'SOLD_OUT',
          'Not enough units available in this round',
          HttpStatus.CONFLICT,
        );
      }
      if (units.greaterThan(release.units_available_primary)) {
        throwAdminError(
          'INSUFFICIENT_PRIMARY_UNITS',
          'Primary pool exhausted',
          HttpStatus.CONFLICT,
        );
      }

      if (
        release.min_purchase_units &&
        units.lessThan(release.min_purchase_units)
      ) {
        throwAdminError(
          'MIN_PURCHASE_UNITS',
          `Minimum purchase is ${release.min_purchase_units.toString()} units`,
          HttpStatus.BAD_REQUEST,
        );
      }
      if (
        release.max_purchase_units &&
        units.greaterThan(release.max_purchase_units)
      ) {
        throwAdminError(
          'MAX_PURCHASE_UNITS',
          `Maximum purchase is ${release.max_purchase_units.toString()} units`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const pricePerUnit = release.primary_unit_price;
      if (pricePerUnit.lessThanOrEqualTo(0)) {
        throwAdminError(
          'INVALID_UNIT_PRICE',
          'Invalid unit price',
          HttpStatus.CONFLICT,
        );
      }

      const gross = units.mul(pricePerUnit);
      const fee = gross.mul(fees.primaryPurchaseFeePct).div(100);
      const net = gross.minus(fee);

      const nextRaised = roundRow.raised_amount_usdt.plus(net);
      if (nextRaised.greaterThan(roundRow.hard_cap_usdt)) {
        throwAdminError(
          'HARD_CAP_EXCEEDED',
          'Round hard cap would be exceeded',
          HttpStatus.CONFLICT,
        );
      }

      const balance = await this.ledger.getBalanceOrThrow(tx, wallet.id);
      if (balance.available.lessThan(gross)) {
        throwAdminError(
          'INSUFFICIENT_BALANCE',
          'Insufficient wallet balance',
          HttpStatus.CONFLICT,
        );
      }

      const order = await tx.order.create({
        data: {
          userId,
          releaseId: release.id,
          primaryRaiseRoundId: roundRow.id,
          side: OrderSide.BUY,
          orderType: OrderType.MARKET,
          timeInForce: TimeInForce.IOC,
          unitsTotal: units,
          unitsFilled: new Prisma.Decimal(0),
          grossAmount: gross,
          feeAmount: fee,
          netAmount: net,
          unitPrice: pricePerUnit,
          status: OrderStatus.CREATED,
          idempotencyKey,
        },
      });

      await this.ledger.debitAvailable(tx, wallet.id, gross, {
        operationType: LedgerOperationType.PRIMARY_PURCHASE,
        sourceEntityType: 'primary_order',
        sourceEntityId: order.id,
        actorUserId: userId,
        actorRole: ActorRole.USER,
        currency: wallet.assetCode,
        idempotencyKey: `primary-debit:${order.id}`,
      });

      await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PAID, unitsFilled: units },
      });

      const walletTx = await this.ledger.createWalletTransaction(tx, {
        walletId: wallet.id,
        txType: WalletTxType.TRADE_SETTLEMENT,
        direction: WalletTxDirection.OUT,
        amount: gross,
        feeAmount: fee,
        netAmount: gross,
        currency: wallet.assetCode,
        status: WalletTxStatus.COMPLETED,
        referenceType: 'primary_order',
        referenceId: order.id,
        ctx: {
          operationType: LedgerOperationType.PRIMARY_PURCHASE,
          sourceEntityType: 'primary_order',
          sourceEntityId: order.id,
          actorUserId: userId,
          actorRole: ActorRole.USER,
          currency: wallet.assetCode,
          idempotencyKey: `primary-tx:${order.id}`,
        },
      });

      if (fee.greaterThan(0)) {
        const feeTx = await this.ledger.createWalletTransaction(tx, {
          walletId: wallet.id,
          txType: WalletTxType.FEE,
          direction: WalletTxDirection.OUT,
          amount: fee,
          feeAmount: new Prisma.Decimal(0),
          netAmount: fee,
          currency: wallet.assetCode,
          status: WalletTxStatus.COMPLETED,
          referenceType: 'primary_order_fee',
          referenceId: order.id,
          ctx: {
            operationType: LedgerOperationType.PLATFORM_FEE,
            sourceEntityType: 'primary_order',
            sourceEntityId: order.id,
            actorUserId: userId,
            actorRole: ActorRole.USER,
            currency: wallet.assetCode,
            idempotencyKey: `primary-fee-tx:${order.id}`,
          },
        });
        await this.feeLedger.recordFee(tx, {
          walletTransactionId: feeTx.id,
          feeCode: 'primary_purchase_fee',
          subjectType: 'primary_order',
          subjectId: order.id,
          amount: fee,
          currency: wallet.assetCode,
          rate: fees.primaryPurchaseFeePct,
        });
        await this.ledger.recordPlatformFee(tx, wallet.id, fee, {
          operationType: LedgerOperationType.PLATFORM_FEE,
          sourceEntityType: 'primary_order',
          sourceEntityId: order.id,
          actorUserId: userId,
          actorRole: ActorRole.USER,
          currency: wallet.assetCode,
          walletTransactionId: feeTx.id,
          idempotencyKey: `primary-fee-ledger:${order.id}`,
        });
      }

      const roundUpdated = await tx.$executeRaw`
        UPDATE primary_raise_rounds
        SET sold_units = sold_units + ${units},
            raised_amount_usdt = raised_amount_usdt + ${net},
            updated_at = NOW()
        WHERE id = ${roundRow.id}::uuid
          AND sold_units + ${units} <= total_units
          AND raised_amount_usdt + ${net} <= hard_cap_usdt
      `;
      if (roundUpdated !== 1) {
        throwAdminError(
          'SOLD_OUT',
          'Round inventory changed, try again',
          HttpStatus.CONFLICT,
        );
      }

      const releaseUpdated = await tx.$executeRaw`
        UPDATE releases
        SET units_available_primary = units_available_primary - ${units},
            updated_at = NOW()
        WHERE id = ${release.id}::uuid
          AND units_available_primary >= ${units}
          AND deleted_at IS NULL
      `;
      if (releaseUpdated !== 1) {
        throwAdminError(
          'INSUFFICIENT_PRIMARY_UNITS',
          'Primary pool exhausted',
          HttpStatus.CONFLICT,
        );
      }

      await tx.$executeRaw`
        UPDATE release_share_lots
        SET units_remaining = units_remaining - ${units},
            updated_at = NOW()
        WHERE release_id = ${release.id}::uuid
          AND lot_type = ${ShareLotType.PRIMARY}::"share_lot_type"
          AND units_remaining >= ${units}
      `;

      const existingPos = await tx.userPosition.findUnique({
        where: { userId_releaseId: { userId, releaseId: release.id } },
      });
      if (existingPos) {
        const newTotal = existingPos.unitsTotal.plus(units);
        const weighted = existingPos.avgEntryPrice
          .mul(existingPos.unitsTotal)
          .plus(pricePerUnit.mul(units))
          .div(newTotal);
        await tx.userPosition.update({
          where: { id: existingPos.id },
          data: {
            unitsTotal: newTotal,
            unitsAvailable: existingPos.unitsAvailable.plus(units),
            avgEntryPrice: weighted,
          },
        });
      } else {
        await tx.userPosition.create({
          data: {
            userId,
            releaseId: release.id,
            unitsTotal: units,
            unitsAvailable: units,
            unitsLocked: new Prisma.Decimal(0),
            avgEntryPrice: pricePerUnit,
          },
        });
      }

      await tx.ownershipLedger.create({
        data: {
          userId,
          releaseId: release.id,
          eventType: OwnershipEventType.PRIMARY_BUY,
          unitsDelta: units,
          pricePerUnit,
          walletTransactionId: walletTx.id,
          happenedAt: new Date(),
        },
      });

      const settled = await tx.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.SETTLED },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: userId,
          actorRole: ActorRole.USER,
          entityType: 'order',
          entityId: order.id,
          action: 'primary.purchase.settled',
          afterJsonb: {
            roundId: roundRow.id,
            releaseId: release.id,
            units: units.toString(),
            grossAmount: gross.toString(),
            feeAmount: fee.toString(),
            netAmount: net.toString(),
            ledgerMutation: true,
          },
          ip: meta?.ip ?? null,
          userAgent: meta?.userAgent ?? null,
        },
      });

      return mapPrimaryOrderResponse({
        orderId: settled.id,
        releaseId: settled.releaseId,
        roundId: roundRow.id,
        units: units.toString(),
        grossAmount: gross.toString(),
        feeAmount: fee.toString(),
        netAmount: net.toString(),
        pricePerUnit: pricePerUnit.toString(),
        status: OrderStatus.SETTLED,
      });
    },
      { timeout: 20_000 },
    );

    await this.audit.logUserAction({
      actorUserId: userId,
      entityType: 'order',
      entityId: result.orderId,
      action: 'primary.purchase',
      after: result,
      ip: meta?.ip,
      userAgent: meta?.userAgent,
    });

    if (!result.idempotentReplay && result.status === 'settled') {
      const release = await this.prisma.release.findUnique({
        where: { id: result.releaseId },
        select: { title: true },
      });
      void this.notificationEvents.primaryPurchaseSettled({
        userId,
        orderId: result.orderId,
        releaseTitle: release?.title ?? 'Релиз',
        units: result.units,
      });
    }

    if (!result.idempotentReplay) {
      this.cacheInvalidation.onPrimaryPurchase();
      void this.referralEvents.onFirstPrimaryPurchase({
        userId,
        orderId: result.orderId,
        grossAmount: new Prisma.Decimal(result.grossAmount),
      });
    }

    return result;
  }

  async listForUser(userId: string, page = 1, pageSize = 20) {
    const { skip, page: p, pageSize: ps } = resolvePagination(page, pageSize);
    const where = { userId, primaryRaiseRoundId: { not: null } };
    const [total, rows] = await Promise.all([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: ps,
        include: { release: true },
      }),
    ]);
    return {
      items: rows.map((o) => ({
        id: o.id,
        releaseId: o.releaseId,
        roundId: o.primaryRaiseRoundId,
        trackTitle: o.release.title,
        side: o.side.toLowerCase(),
        units: o.unitsTotal.toString(),
        unitsFilled: o.unitsFilled.toString(),
        grossAmount: o.grossAmount?.toString() ?? null,
        feeAmount: o.feeAmount?.toString() ?? null,
        netAmount: o.netAmount?.toString() ?? null,
        pricePerUnit: o.unitPrice?.toString() ?? null,
        status: orderStatusToApi(o.status),
        createdAt: o.createdAt.toISOString(),
      })),
      total,
      page: p,
      pageSize: ps,
      hasMore: skip + rows.length < total,
    };
  }

  async getForUser(userId: string, orderId: string) {
    const o = await this.prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { release: true },
    });
    if (!o) {
      throwAdminError(
        'ORDER_NOT_FOUND',
        'Order not found',
        HttpStatus.NOT_FOUND,
      );
    }
    return {
      id: o.id,
      releaseId: o.releaseId,
      roundId: o.primaryRaiseRoundId,
      trackTitle: o.release.title,
      side: o.side.toLowerCase(),
      units: o.unitsTotal.toString(),
      unitsFilled: o.unitsFilled.toString(),
      grossAmount: o.grossAmount?.toString() ?? null,
      feeAmount: o.feeAmount?.toString() ?? null,
      netAmount: o.netAmount?.toString() ?? null,
      pricePerUnit: o.unitPrice?.toString() ?? null,
      status: orderStatusToApi(o.status),
      failureReason: o.failureReason,
      createdAt: o.createdAt.toISOString(),
      cancelledAt: o.cancelledAt?.toISOString() ?? null,
    };
  }

  async getForAdmin(orderId: string, roles: string[]) {
    assertMatrixSection(roles, 'rounds', 'view');
    const o = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        release: true,
        user: { select: { id: true, email: true, status: true } },
      },
    });
    if (!o) {
      throwAdminError(
        'ORDER_NOT_FOUND',
        'Order not found',
        HttpStatus.NOT_FOUND,
      );
    }
    const audit = await this.prisma.auditLog.findMany({
      where: { entityType: 'order', entityId: orderId },
      orderBy: { createdAt: 'desc' },
      take: 30,
      include: { actorUser: { select: { email: true } } },
    });
    return {
      id: o.id,
      userId: o.userId,
      userEmail: o.user.email,
      releaseId: o.releaseId,
      roundId: o.primaryRaiseRoundId,
      trackTitle: o.release.title,
      units: o.unitsTotal.toString(),
      grossAmount: o.grossAmount?.toString() ?? null,
      feeAmount: o.feeAmount?.toString() ?? null,
      netAmount: o.netAmount?.toString() ?? null,
      pricePerUnit: o.unitPrice?.toString() ?? null,
      status: orderStatusToApi(o.status),
      idempotencyKey: o.idempotencyKey,
      failureReason: o.failureReason,
      createdAt: o.createdAt.toISOString(),
      audit: audit.map((row) => ({
        id: row.id,
        action: row.action,
        actorEmail: row.actorUser?.email ?? null,
        createdAt: row.createdAt.toISOString(),
        after: row.afterJsonb,
      })),
    };
  }

  async preview(userId: string, roundId: string, unitsInput: number) {
    await this.eligibility.assertAllowed(userId, ConsentSource.PRIMARY_PURCHASE);
    const units = new Prisma.Decimal(String(unitsInput));
    if (units.lessThanOrEqualTo(0)) {
      throwAdminError(
        'INVALID_UNITS',
        'Units must be positive',
        HttpStatus.BAD_REQUEST,
      );
    }

    const wallet = await this.wallets.getOrCreateWallet(userId);
    const fees = await this.activeFeeSettings();

    const round = await this.prisma.primaryRaiseRound.findUnique({
      where: { id: roundId },
      include: {
        release: {
          include: {
            releaseArtists: { include: { artist: true }, take: 1 },
          },
        },
      },
    });

    let blockingReason: string | null = null;
    let canPurchase = true;

    if (!round) {
      canPurchase = false;
      blockingReason = 'ROUND_NOT_FOUND';
    } else if (round.status !== PrimaryRaiseRoundStatus.LIVE) {
      canPurchase = false;
      blockingReason = 'ROUND_NOT_ACTIVE';
    } else if (round.release.status !== ReleaseStatus.ACTIVE) {
      canPurchase = false;
      blockingReason = 'TRACK_NOT_ACTIVE';
    } else {
      const availableRoundUnits = round.totalUnits.minus(round.soldUnits);
      if (units.greaterThan(availableRoundUnits)) {
        canPurchase = false;
        blockingReason = 'SOLD_OUT';
      } else if (units.greaterThan(round.release.unitsAvailablePrimary)) {
        canPurchase = false;
        blockingReason = 'INSUFFICIENT_PRIMARY_UNITS';
      } else if (
        round.release.minPurchaseUnits &&
        units.lessThan(round.release.minPurchaseUnits)
      ) {
        canPurchase = false;
        blockingReason = 'MIN_PURCHASE_UNITS';
      } else if (
        round.release.maxPurchaseUnits &&
        units.greaterThan(round.release.maxPurchaseUnits)
      ) {
        canPurchase = false;
        blockingReason = 'MAX_PURCHASE_UNITS';
      }
    }

    const pricePerUnit =
      round?.release.primaryUnitPrice ?? new Prisma.Decimal(0);
    const gross = units.mul(pricePerUnit);
    const fee = gross.mul(fees.primaryPurchaseFeePct).div(100);
    const totalPaid = gross;
    const balance = await this.prisma.walletBalance.findUnique({
      where: { walletId: wallet.id },
    });
    const available = balance?.available ?? new Prisma.Decimal(0);
    if (canPurchase && available.lessThan(gross)) {
      canPurchase = false;
      blockingReason = 'INSUFFICIENT_BALANCE';
    }

    const artist =
      round?.release.releaseArtists?.[0]?.artist.name ??
      round?.release.copyrightOwner ??
      'Unknown Artist';

    return {
      roundId,
      releaseId: round?.releaseId ?? null,
      releaseTitle: round?.release.title ?? null,
      artist,
      symbol: round?.release.symbol ?? null,
      units: units.toString(),
      pricePerUnit: pricePerUnit.toString(),
      grossAmount: gross.toString(),
      feeAmount: fee.toString(),
      feePct: fees.primaryPurchaseFeePct.toString(),
      totalPaid: totalPaid.toString(),
      sellerNet: gross.minus(fee).toString(),
      walletBalance: available.toString(),
      balanceAfter: available.minus(gross).toString(),
      availableUnits: round
        ? round.totalUnits.minus(round.soldUnits).toString()
        : '0',
      minPurchaseUnits: round?.release.minPurchaseUnits?.toString() ?? null,
      maxPurchaseUnits: round?.release.maxPurchaseUnits?.toString() ?? null,
      canPurchase,
      blockingReason,
      roundingNote:
        'Комиссия считается от gross. С кошелька списывается полная сумма gross (fee удерживается платформой).',
    };
  }

  private async activeFeeSettings(tx?: Prisma.TransactionClient) {
    const db = tx ?? this.prisma;
    const row = await db.platformFeeSetting.findFirst({
      where: { isActive: true },
      orderBy: { effectiveFrom: 'desc' },
    });
    return {
      primaryPurchaseFeePct:
        row?.primaryPurchaseFeePct ?? new Prisma.Decimal(2),
    };
  }
}
