import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import { throwAdminError } from '../common/admin-http.util';

export type AdminSearchGroupType =
  | 'users'
  | 'withdrawals'
  | 'deposits'
  | 'tracks'
  | 'rounds'
  | 'trades'
  | 'audit';

type SearchItem = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  status?: string;
  meta?: string;
};

type SearchGroup = {
  type: AdminSearchGroupType;
  title: string;
  items: SearchItem[];
};

const GROUP_TITLES: Record<AdminSearchGroupType, string> = {
  users: 'Пользователи',
  withdrawals: 'Выводы',
  deposits: 'Пополнения',
  tracks: 'Треки',
  rounds: 'Раунды',
  trades: 'Сделки вторичного рынка',
  audit: 'Audit log',
};

@Injectable()
export class AdminSearchService {
  constructor(private readonly prisma: PrismaService) {}

  private isUuid(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  async search(roles: string[], q: string): Promise<{ groups: SearchGroup[] }> {
    const query = q?.trim();
    if (!query || query.length < 2) {
      return { groups: [] };
    }

    const allowed = this.allowedGroups(roles);
    const limit = 5;
    const groups: SearchGroup[] = [];

    if (allowed.has('users')) {
      const userOr: Prisma.UserWhereInput[] = [
        { email: { contains: query, mode: 'insensitive' } },
        { profile: { displayName: { contains: query, mode: 'insensitive' } } },
      ];
      if (this.isUuid(query)) userOr.push({ id: query });
      const users = await this.prisma.user.findMany({
        where: { OR: userOr },
        take: limit,
        include: { profile: true },
      });
      if (users.length) {
        groups.push({
          type: 'users',
          title: GROUP_TITLES.users,
          items: users.map((u) => ({
            id: u.id,
            title: u.profile?.displayName?.trim() || u.email,
            subtitle: u.email,
            href: `/admin/users?search=${encodeURIComponent(u.email)}`,
            status: u.status.toLowerCase(),
          })),
        });
      }
    }

    if (allowed.has('withdrawals')) {
      const withdrawalOr: Prisma.WithdrawalWhereInput[] = [
        { blockchainTxid: { contains: query, mode: 'insensitive' } },
        { toAddress: { contains: query, mode: 'insensitive' } },
        {
          walletTx: {
            wallet: {
              user: { email: { contains: query, mode: 'insensitive' } },
            },
          },
        },
      ];
      if (this.isUuid(query)) withdrawalOr.unshift({ id: query });
      const withdrawals = await this.prisma.withdrawal.findMany({
        where: { OR: withdrawalOr },
        take: limit,
        include: {
          walletTx: { include: { wallet: { include: { user: true } } } },
        },
      });
      if (withdrawals.length) {
        groups.push({
          type: 'withdrawals',
          title: GROUP_TITLES.withdrawals,
          items: withdrawals.map((w) => ({
            id: w.id,
            title: this.maskFinancial(w.walletTx.wallet.user.email, roles),
            subtitle: this.maskFinancial(
              `${Number(w.walletTx.amount.toString()).toFixed(2)} USDT`,
              roles,
            ),
            href: `/admin/withdrawals?search=${encodeURIComponent(w.id)}`,
            status: w.status.toLowerCase(),
            meta: w.blockchainTxid?.slice(0, 12) ?? undefined,
          })),
        });
      }
    }

    if (allowed.has('deposits')) {
      const depositOr: Prisma.DepositWhereInput[] = [
        { blockchainTxid: { contains: query, mode: 'insensitive' } },
        { toAddress: { contains: query, mode: 'insensitive' } },
        {
          walletTx: {
            wallet: {
              user: { email: { contains: query, mode: 'insensitive' } },
            },
          },
        },
      ];
      if (this.isUuid(query)) depositOr.unshift({ id: query });
      const deposits = await this.prisma.deposit.findMany({
        where: { OR: depositOr },
        take: limit,
        include: {
          walletTx: { include: { wallet: { include: { user: true } } } },
        },
      });
      if (deposits.length) {
        groups.push({
          type: 'deposits',
          title: GROUP_TITLES.deposits,
          items: deposits.map((d) => ({
            id: d.id,
            title: this.maskFinancial(d.walletTx.wallet.user.email, roles),
            subtitle: this.maskFinancial(
              `${Number(d.walletTx.amount.toString()).toFixed(2)} USDT`,
              roles,
            ),
            href: `/admin/deposits?search=${encodeURIComponent(d.id)}`,
            status: d.status.toLowerCase(),
            meta: d.blockchainTxid?.slice(0, 12) ?? undefined,
          })),
        });
      }
    }

    if (allowed.has('tracks')) {
      const trackOr: Prisma.ReleaseWhereInput[] = [
        { title: { contains: query, mode: 'insensitive' } },
        { slug: { contains: query, mode: 'insensitive' } },
        { symbol: { contains: query, mode: 'insensitive' } },
      ];
      if (this.isUuid(query)) trackOr.push({ id: query });
      const tracks = await this.prisma.release.findMany({
        where: { deletedAt: null, OR: trackOr },
        take: limit,
        include: { releaseArtists: { include: { artist: true }, take: 1 } },
      });
      if (tracks.length) {
        groups.push({
          type: 'tracks',
          title: GROUP_TITLES.tracks,
          items: tracks.map((t) => ({
            id: t.id,
            title: t.title,
            subtitle: t.releaseArtists[0]?.artist.name,
            href: `/admin/tracks?search=${encodeURIComponent(t.title)}`,
            status: t.status.toLowerCase(),
          })),
        });
      }
    }

    if (allowed.has('rounds')) {
      const roundOr: Prisma.PrimaryRaiseRoundWhereInput[] = [
        { release: { title: { contains: query, mode: 'insensitive' } } },
      ];
      if (this.isUuid(query)) roundOr.unshift({ id: query });
      const rounds = await this.prisma.primaryRaiseRound.findMany({
        where: { OR: roundOr },
        take: limit,
        include: { release: true },
      });
      if (rounds.length) {
        groups.push({
          type: 'rounds',
          title: GROUP_TITLES.rounds,
          items: rounds.map((r) => ({
            id: r.id,
            title: r.release.title,
            subtitle: `Раунд ${r.id.slice(0, 8)}`,
            href: `/admin/rounds?search=${encodeURIComponent(r.id)}`,
            status: r.status.toLowerCase(),
          })),
        });
      }
    }

    if (allowed.has('trades')) {
      const tradeOr: Prisma.TradeWhereInput[] = [
        { release: { title: { contains: query, mode: 'insensitive' } } },
        { buyer: { email: { contains: query, mode: 'insensitive' } } },
        { seller: { email: { contains: query, mode: 'insensitive' } } },
      ];
      if (this.isUuid(query)) tradeOr.unshift({ id: query });
      const trades = await this.prisma.trade.findMany({
        where: { OR: tradeOr },
        take: limit,
        include: { release: true, buyer: true, seller: true },
      });
      if (trades.length) {
        groups.push({
          type: 'trades',
          title: GROUP_TITLES.trades,
          items: trades.map((t) => ({
            id: t.id,
            title: t.release.title,
            subtitle: `${t.buyer.email} ↔ ${t.seller.email}`,
            href: `/admin/secondary-market?search=${encodeURIComponent(t.id)}`,
            status: t.settlementStatus.toLowerCase(),
          })),
        });
      }
    }

    if (allowed.has('audit')) {
      const auditOr: Prisma.AuditLogWhereInput[] = [
        { action: { contains: query, mode: 'insensitive' } },
        { entityType: { contains: query, mode: 'insensitive' } },
      ];
      if (this.isUuid(query)) auditOr.push({ entityId: query });
      const logs = await this.prisma.auditLog.findMany({
        where: { OR: auditOr },
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      if (logs.length) {
        groups.push({
          type: 'audit',
          title: GROUP_TITLES.audit,
          items: logs.map((l) => ({
            id: l.id,
            title: l.action,
            subtitle: l.entityType,
            href: `/admin/audit-log?search=${encodeURIComponent(l.action)}`,
            meta: l.entityId?.slice(0, 8) ?? undefined,
          })),
        });
      }
    }

    return { groups };
  }

  private allowedGroups(roles: string[]): Set<AdminSearchGroupType> {
    const superRoles = new Set(['SUPER_ADMIN', 'ADMIN']);
    if (roles.some((r) => superRoles.has(r))) {
      return new Set(Object.keys(GROUP_TITLES) as AdminSearchGroupType[]);
    }

    const allowed = new Set<AdminSearchGroupType>();

    if (
      roles.some((r) =>
        ['SUPPORT_MANAGER', 'SUPPORT', 'COMPLIANCE', 'ACCOUNTANT'].includes(r),
      )
    ) {
      allowed.add('users');
    }

    if (
      roles.some((r) =>
        ['ACCOUNTANT', 'COMPLIANCE', 'SUPPORT_MANAGER'].includes(r),
      )
    ) {
      allowed.add('withdrawals');
      allowed.add('deposits');
    }

    if (roles.includes('CONTENT_MANAGER')) {
      allowed.add('tracks');
      allowed.add('rounds');
    }

    if (
      roles.some((r) =>
        ['ACCOUNTANT', 'COMPLIANCE', 'SUPPORT_MANAGER'].includes(r),
      )
    ) {
      allowed.add('trades');
    }

    if (
      roles.some((r) =>
        ['ACCOUNTANT', 'COMPLIANCE', 'SUPPORT_MANAGER'].includes(r),
      )
    ) {
      allowed.add('audit');
    }

    if (allowed.size === 0) {
      throwAdminError(
        'ADMIN_FORBIDDEN',
        'Insufficient permissions for search',
        HttpStatus.FORBIDDEN,
      );
    }

    return allowed;
  }

  private maskFinancial(value: string, roles: string[]): string {
    if (roles.includes('CONTENT_MANAGER')) {
      return '—';
    }
    if (roles.includes('SUPPORT') && value.includes('USDT')) {
      return 'Сумма скрыта';
    }
    return value;
  }
}
