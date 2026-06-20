import { HttpStatus, Injectable } from '@nestjs/common';
import {
  DepositAddressPoolStatus,
  DepositAddressSource,
} from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { throwAdminError } from '../admin/common/admin-http.util';
import { isValidTrc20Address } from '../wallets/validators/trc20-address.validator';

@Injectable()
export class DepositAddressPoolService {
  constructor(private readonly prisma: PrismaService) {}

  async claimForWallet(
    walletId: string,
    userId: string,
    asset: string,
    network: string,
  ): Promise<string | null> {
    return this.prisma.$transaction(async (tx) => {
      const poolRow = await tx.depositAddressPool.findFirst({
        where: {
          asset,
          network,
          status: DepositAddressPoolStatus.AVAILABLE,
        },
        orderBy: { createdAt: 'asc' },
      });
      if (!poolRow) return null;

      await tx.depositAddressPool.update({
        where: { id: poolRow.id },
        data: {
          status: DepositAddressPoolStatus.ASSIGNED,
          assignedWalletId: walletId,
          assignedUserId: userId,
          assignedAt: new Date(),
        },
      });
      return poolRow.address;
    });
  }

  async adminAddAddress(
    address: string,
    asset = 'USDT',
    network = 'TRC20',
  ) {
    const trimmed = address.trim();
    if (!isValidTrc20Address(trimmed)) {
      throwAdminError(
        'INVALID_TRC20_ADDRESS',
        'Некорректный TRON-адрес',
        HttpStatus.BAD_REQUEST,
      );
    }
    const existing = await this.prisma.depositAddressPool.findUnique({
      where: { address: trimmed },
    });
    if (existing) {
      throwAdminError(
        'ADDRESS_ALREADY_EXISTS',
        'Адрес уже есть в пуле',
        HttpStatus.CONFLICT,
      );
    }
    return this.prisma.depositAddressPool.create({
      data: {
        address: trimmed,
        asset,
        network,
        status: DepositAddressPoolStatus.AVAILABLE,
        source: DepositAddressSource.ADMIN_POOL,
      },
    });
  }

  async listPool(asset = 'USDT', network = 'TRC20', limit = 100) {
    const rows = await this.prisma.depositAddressPool.findMany({
      where: { asset, network },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    const available = rows.filter(
      (r) => r.status === DepositAddressPoolStatus.AVAILABLE,
    ).length;
    return { items: rows, availableCount: available, total: rows.length };
  }

  async adminDisable(id: string, reason: string, compromised = false) {
    if (!reason?.trim()) {
      throwAdminError(
        'REASON_REQUIRED',
        'Укажите причину',
        HttpStatus.BAD_REQUEST,
      );
    }
    const row = await this.prisma.depositAddressPool.findUnique({ where: { id } });
    if (!row) {
      throwAdminError('ADDRESS_NOT_FOUND', 'Address not found', HttpStatus.NOT_FOUND);
    }
    return this.prisma.depositAddressPool.update({
      where: { id },
      data: {
        status: compromised
          ? DepositAddressPoolStatus.COMPROMISED
          : DepositAddressPoolStatus.DISABLED,
        disabledAt: new Date(),
      },
    });
  }
}
