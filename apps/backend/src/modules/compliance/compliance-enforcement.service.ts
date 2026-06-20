import { HttpStatus, Injectable } from '@nestjs/common';
import {
  ComplianceRiskStatus,
  ListingStatus,
  Prisma,
  UserStatus,
  WalletStatus,
  WithdrawalStatus,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAdminError } from '../admin/common/admin-http.util';

/** User-safe compliance restriction errors (no internal details). */
export const COMPLIANCE_USER_ERRORS = {
  ACCOUNT_RESTRICTED:
    'Операция временно недоступна. Обратитесь в поддержку Spliton.',
  WALLET_FROZEN:
    'Кошелёк заморожен по решению службы безопасности. Обратитесь в поддержку.',
  WITHDRAWAL_HELD:
    'Вывод удержан для проверки. Мы уведомим вас после завершения review.',
  LISTING_UNAVAILABLE: 'Листинг недоступен для сделки.',
} as const;

@Injectable()
export class ComplianceEnforcementService {
  constructor(private readonly prisma: PrismaService) {}

  async assertUserCanTransact(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { status: true, deletedAt: true },
    });
    if (!user || user.deletedAt) {
      throwAdminError(
        'USER_NOT_FOUND',
        COMPLIANCE_USER_ERRORS.ACCOUNT_RESTRICTED,
        HttpStatus.FORBIDDEN,
      );
    }
    if (user.status === UserStatus.SUSPENDED) {
      throwAdminError(
        'ACCOUNT_SUSPENDED',
        COMPLIANCE_USER_ERRORS.ACCOUNT_RESTRICTED,
        HttpStatus.FORBIDDEN,
      );
    }

    const blockedWallet = await this.prisma.wallet.findFirst({
      where: { userId, status: WalletStatus.BLOCKED },
      select: { id: true },
    });
    if (blockedWallet) {
      throwAdminError(
        'WALLET_FROZEN',
        COMPLIANCE_USER_ERRORS.WALLET_FROZEN,
        HttpStatus.FORBIDDEN,
      );
    }

    const activeWalletFreeze = await this.activeWalletFreezeForUser(userId);
    if (activeWalletFreeze) {
      throwAdminError(
        'WALLET_FROZEN',
        COMPLIANCE_USER_ERRORS.WALLET_FROZEN,
        HttpStatus.FORBIDDEN,
      );
    }

    const blockingFlag = await this.prisma.riskFlag.findFirst({
      where: {
        userId,
        isActive: true,
        status: ComplianceRiskStatus.BLOCKED,
      },
    });
    if (blockingFlag) {
      throwAdminError(
        'COMPLIANCE_BLOCKED',
        COMPLIANCE_USER_ERRORS.ACCOUNT_RESTRICTED,
        HttpStatus.FORBIDDEN,
      );
    }
  }

  async assertWithdrawalCanProceed(
    withdrawalId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const db = tx ?? this.prisma;
    const row = await db.withdrawal.findUnique({
      where: { id: withdrawalId },
      select: {
        status: true,
        walletTx: { select: { wallet: { select: { userId: true } } } },
      },
    });
    if (!row) return;

    if (
      row.status === WithdrawalStatus.ON_HOLD ||
      row.status === WithdrawalStatus.REVIEW
    ) {
      throwAdminError(
        'WITHDRAWAL_ON_HOLD',
        COMPLIANCE_USER_ERRORS.WITHDRAWAL_HELD,
        HttpStatus.CONFLICT,
      );
    }

    const freeze = await db.complianceFreeze.findFirst({
      where: {
        operationType: 'withdrawal',
        operationId: withdrawalId,
        isActive: true,
      },
    });
    if (freeze) {
      throwAdminError(
        'WITHDRAWAL_FROZEN',
        COMPLIANCE_USER_ERRORS.WITHDRAWAL_HELD,
        HttpStatus.CONFLICT,
      );
    }

    const userId = row.walletTx.wallet.userId;
    await this.assertUserCanTransact(userId);
  }

  async assertWithdrawalCanComplete(
    withdrawalId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    await this.assertWithdrawalCanProceed(withdrawalId, tx);
  }

  async assertListingCanBeBought(listingId: string): Promise<void> {
    const listing = await this.prisma.marketListing.findFirst({
      where: { id: listingId, deletedAt: null },
      select: { status: true, sellerUserId: true },
    });
    if (!listing || listing.status !== ListingStatus.ACTIVE) {
      throwAdminError(
        'LISTING_NOT_ACTIVE',
        COMPLIANCE_USER_ERRORS.LISTING_UNAVAILABLE,
        HttpStatus.CONFLICT,
      );
    }

    const listingFreeze = await this.prisma.complianceFreeze.findFirst({
      where: {
        operationType: 'listing',
        operationId: listingId,
        isActive: true,
      },
    });
    if (listingFreeze) {
      throwAdminError(
        'LISTING_FROZEN',
        COMPLIANCE_USER_ERRORS.LISTING_UNAVAILABLE,
        HttpStatus.CONFLICT,
      );
    }

    await this.assertUserCanTransact(listing.sellerUserId);
  }

  async assertBuyerCanTrade(
    buyerUserId: string,
    listingId: string,
  ): Promise<void> {
    await this.assertUserCanTransact(buyerUserId);
    await this.assertListingCanBeBought(listingId);
  }

  assertComplianceFreezeRole(roles: string[]): void {
    const ok = roles.some((r) => ['SUPER_ADMIN', 'COMPLIANCE'].includes(r));
    if (!ok) {
      throwAdminError(
        'ADMIN_FORBIDDEN',
        'Only COMPLIANCE or SUPER_ADMIN can freeze operations',
        HttpStatus.FORBIDDEN,
      );
    }
  }

  private async activeWalletFreezeForUser(userId: string) {
    const ids = await this.walletIds(userId);
    if (ids.length === 0) return null;
    return this.prisma.complianceFreeze.findFirst({
      where: {
        operationType: 'wallet',
        isActive: true,
        operationId: { in: ids },
      },
    });
  }

  private async walletIds(userId: string): Promise<string[]> {
    const rows = await this.prisma.wallet.findMany({
      where: { userId },
      select: { id: true },
    });
    return rows.map((w) => w.id);
  }
}
