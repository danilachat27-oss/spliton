import { UserStatus } from '@prisma/client';
import type {
  AdminUserDetailDto,
  AdminUserListItemDto,
} from '../dto/admin-user.dto';

const STATUS_TO_API: Record<UserStatus, string> = {
  ACTIVE: 'ACTIVE',
  PENDING: 'PENDING',
  PENDING_EMAIL_VERIFICATION: 'PENDING_EMAIL_VERIFICATION',
  SUSPENDED: 'SUSPENDED',
  BANNED: 'BANNED',
  DELETED: 'BANNED',
};

const API_TO_STATUS: Record<string, UserStatus> = {
  ACTIVE: UserStatus.ACTIVE,
  active: UserStatus.ACTIVE,
  pending: UserStatus.PENDING,
  PENDING: UserStatus.PENDING,
  pending_verification: UserStatus.PENDING_EMAIL_VERIFICATION,
  PENDING_EMAIL_VERIFICATION: UserStatus.PENDING_EMAIL_VERIFICATION,
  suspended: UserStatus.SUSPENDED,
  SUSPENDED: UserStatus.SUSPENDED,
  banned: UserStatus.BANNED,
  BANNED: UserStatus.BANNED,
  deleted: UserStatus.DELETED,
};

export function userStatusToApi(status: UserStatus): string {
  return STATUS_TO_API[status] ?? 'ACTIVE';
}

export function apiStatusToUser(status: string): UserStatus {
  return API_TO_STATUS[status] ?? UserStatus.ACTIVE;
}

type UserRow = {
  id: string;
  email: string;
  status: UserStatus;
  createdAt: Date;
  updatedAt: Date;
  profile: { displayName: string | null } | null;
  userRoles: { role: { code: string } }[];
  wallets: {
    balance: {
      available: { toString(): string };
      locked: { toString(): string };
    } | null;
  }[];
  _count?: { positions: number };
  kycVerifications?: { status: string }[];
};

function formatUsdt(value: { toString(): string } | undefined | null): string {
  if (!value) return '0.00';
  const n = Number(value.toString());
  return Number.isFinite(n) ? n.toFixed(2) : value.toString();
}

export function mapUserListItem(row: UserRow): AdminUserListItemDto {
  const balance = row.wallets[0]?.balance;
  return {
    id: row.id,
    email: row.email,
    name: row.profile?.displayName ?? null,
    status: userStatusToApi(row.status),
    roles: row.userRoles.map((ur) => ur.role.code),
    availableBalanceUsdt: formatUsdt(balance?.available),
    lockedBalanceUsdt: formatUsdt(balance?.locked),
    totalHoldingsUnits: String(row._count?.positions ?? 0),
    createdAt: row.createdAt.toISOString(),
    lastActivityAt: row.updatedAt.toISOString(),
  };
}

export function mapUserDetail(row: UserRow): AdminUserDetailDto {
  const kyc = row.kycVerifications?.[0]?.status ?? null;
  return {
    ...mapUserListItem(row),
    phone: null,
    kycStatus: kyc,
  };
}
