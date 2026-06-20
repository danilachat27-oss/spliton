export type WalletActivityTypeSlug =
  | 'deposit'
  | 'withdrawal'
  | 'primary_purchase'
  | 'secondary_buy'
  | 'secondary_sell'
  | 'payout'
  | 'fee'
  | 'refund'
  | 'trade_lock'
  | 'admin_adjustment'
  | 'other';

export type WalletActivityRelatedEntityDto = {
  type: string;
  id: string;
  releaseId: string | null;
  releaseTitle: string | null;
};

export type WalletActivityItemDto = {
  id: string;
  type: WalletActivityTypeSlug;
  title: string;
  description: string;
  amount: string;
  amountSigned: string;
  asset: string;
  status: string;
  statusLabel: string;
  createdAt: string;
  direction: 'in' | 'out';
  userFacingLabel: string;
  referenceId: string;
  relatedEntity: WalletActivityRelatedEntityDto | null;
  feeAmount: string | null;
  units: string | null;
  source: 'wallet' | 'primary' | 'secondary' | 'payout' | 'system';
};

export type WalletActivityListDto = {
  items: WalletActivityItemDto[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};
