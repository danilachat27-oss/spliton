/**
 * Admin API contracts — align with backend `/api/admin/v1`.
 * User/public API uses separate types under `types/` or feature modules.
 */

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

/** Backend `AdminListQueryDto` caps pageSize at 100. */
export const ADMIN_LIST_MAX_PAGE_SIZE = 100;

export type AdminListQuery = {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  /** ISO date */
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  role?: string;
  entityType?: string;
  userId?: string;
  q?: string;
  /** Фильтр жанра (mock и будущий backend) */
  genre?: string;
  categoryId?: string;
};

export type AdminMutationResult<T = void> = {
  ok: true;
  data: T;
};

/** Wallet ledger entry kinds — traceable operations */
export type WalletLedgerEntryType =
  | "deposit"
  | "withdrawal"
  | "payout"
  | "trade_buy"
  | "trade_sell"
  | "platform_fee"
  | "secondary_fee"
  | "withdrawal_fee"
  | "lock"
  | "unlock"
  | "adjustment";

export type WalletLedgerEntryDto = {
  id: string;
  walletId: string;
  type: WalletLedgerEntryType;
  amountUsdt: string;
  balanceAfterUsdt: string;
  referenceType: string;
  referenceId: string;
  createdAt: string;
  note: string | null;
};

export type WalletDetailDto = {
  id: string;
  userId: string;
  userEmail: string;
  availableUsdt: string;
  lockedUsdt: string;
  earnedTotalUsdt: string;
  withdrawnTotalUsdt: string;
  depositsTotalUsdt: string;
  withdrawalsTotalUsdt: string;
  ledger: WalletLedgerEntryDto[];
};
