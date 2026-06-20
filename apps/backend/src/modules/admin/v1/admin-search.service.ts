import { HttpStatus, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { throwAdminError } from '../common/admin-http.util';

export type AdminSearchGroupType =
  | 'users'
  | 'withdrawals'
  | 'deposits'
  | 'tracks'
  | 'rounds'
  | 'trades'
  | 'audit'
  | 'artists'
  | 'disputes'
  | 'support'
  | 'wallets'
  | 'news';

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

type AdminSearchRow = {
  group_type: string;
  entity_id: string;
  title: string;
  subtitle: string | null;
  status: string | null;
  meta: string | null;
  rank: number | bigint | string;
};

const GROUP_TITLES: Record<AdminSearchGroupType, string> = {
  users: 'Пользователи',
  withdrawals: 'Выводы',
  deposits: 'Пополнения',
  tracks: 'Треки / релизы',
  rounds: 'Раунды',
  trades: 'Сделки вторичного рынка',
  audit: 'Audit log',
  artists: 'Артисты',
  disputes: 'Споры',
  support: 'Поддержка',
  wallets: 'Кошельки',
  news: 'Новости',
};

const GROUP_ORDER: AdminSearchGroupType[] = [
  'users',
  'tracks',
  'rounds',
  'artists',
  'withdrawals',
  'deposits',
  'wallets',
  'trades',
  'disputes',
  'support',
  'news',
  'audit',
];

@Injectable()
export class AdminSearchService {
  constructor(private readonly prisma: PrismaService) {}

  async search(roles: string[], q: string): Promise<{ groups: SearchGroup[] }> {
    const query = q?.trim();
    if (!query || query.length < 2) {
      return { groups: [] };
    }

    const allowed = this.allowedGroups(roles);
    const limit = 5;

    let rows: AdminSearchRow[] = [];
    try {
      rows = await this.prisma.$queryRawUnsafe<AdminSearchRow[]>(
        `SELECT * FROM admin_global_search($1::text, $2::text[], $3::integer)`,
        query.slice(0, 64),
        Array.from(allowed),
        limit,
      );
    } catch {
      return { groups: [] };
    }

    const grouped = new Map<AdminSearchGroupType, SearchItem[]>();

    for (const row of rows) {
      const type = row.group_type as AdminSearchGroupType;
      if (!allowed.has(type)) continue;

      const item: SearchItem = {
        id: row.entity_id,
        title: row.title,
        subtitle: this.maskField(row.subtitle ?? undefined, roles, type),
        href: this.buildHref(type, row),
        status: row.status ?? undefined,
        meta: row.meta ?? undefined,
      };

      const bucket = grouped.get(type) ?? [];
      bucket.push(item);
      grouped.set(type, bucket);
    }

    const groups: SearchGroup[] = [];
    for (const type of GROUP_ORDER) {
      const items = grouped.get(type);
      if (!items?.length) continue;
      groups.push({
        type,
        title: GROUP_TITLES[type],
        items,
      });
    }

    return { groups };
  }

  private buildHref(type: AdminSearchGroupType, row: AdminSearchRow): string {
    const id = row.entity_id;
    switch (type) {
      case 'users':
        return `/admin/users?search=${encodeURIComponent(row.subtitle ?? row.title)}`;
      case 'withdrawals':
        return `/admin/withdrawals?search=${encodeURIComponent(id)}`;
      case 'deposits':
        return `/admin/deposits?search=${encodeURIComponent(id)}`;
      case 'tracks':
        return `/admin/tracks?search=${encodeURIComponent(row.title)}`;
      case 'rounds':
        return `/admin/rounds?search=${encodeURIComponent(id)}`;
      case 'trades':
        return `/admin/secondary-market?search=${encodeURIComponent(id)}`;
      case 'audit':
        return `/admin/audit-log?search=${encodeURIComponent(row.title)}`;
      case 'artists':
        return `/admin/artists?search=${encodeURIComponent(row.title)}`;
      case 'disputes':
        return `/admin/disputes?dispute=${encodeURIComponent(id)}`;
      case 'support':
        return `/admin/support?search=${encodeURIComponent(row.title)}`;
      case 'wallets':
        return `/admin/wallets?search=${encodeURIComponent(id)}`;
      case 'news':
        return `/admin/news?search=${encodeURIComponent(row.title)}`;
      default:
        return '/admin';
    }
  }

  private maskField(
    value: string | undefined,
    roles: string[],
    type: AdminSearchGroupType,
  ): string | undefined {
    if (!value) return undefined;

    const financialTypes: AdminSearchGroupType[] = [
      'withdrawals',
      'deposits',
      'wallets',
      'trades',
    ];

    if (roles.includes('CONTENT_MANAGER') && financialTypes.includes(type)) {
      return '—';
    }

    if (roles.includes('SUPPORT') && value.includes('USDT')) {
      return 'Сумма скрыта';
    }

    return value;
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
      allowed.add('wallets');
    }

    if (roles.includes('CONTENT_MANAGER')) {
      allowed.add('tracks');
      allowed.add('rounds');
      allowed.add('artists');
      allowed.add('news');
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

    if (roles.some((r) => ['SUPPORT_MANAGER', 'COMPLIANCE', 'SUPPORT'].includes(r))) {
      allowed.add('disputes');
      allowed.add('support');
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
}
