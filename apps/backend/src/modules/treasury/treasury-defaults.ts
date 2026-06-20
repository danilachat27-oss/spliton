import { TreasuryAccountType } from '@prisma/client';

/** Launch-safe defaults for first 7 days — override via admin treasury console. */
export const TREASURY_LIMIT_DEFAULTS = {
  userDailyWithdrawalUsdt: '500',
  userMonthlyWithdrawalUsdt: '10000',
  userDailyTradeUsdt: '10000',
  maxOpenListingUsdt: '50000',
  maxFailedWithdrawalAttempts: 5,
  maxAutoCreditDepositUsdt: '2000',
  maxAutoCompleteWithdrawalUsdt: '200',
  mediumWithdrawalUsdt: '200',
  largeWithdrawalUsdt: '5000',
  hotWalletMaxDailyOutflowUsdt: '50000',
  reportExportMaxRows: 50000,
} as const;

export const TREASURY_ACCOUNT_SEED: Array<{
  type: TreasuryAccountType;
  label: string;
  addressEnv?: string;
  minEnv?: string;
  maxEnv?: string;
}> = [
  {
    type: TreasuryAccountType.USER_LIABILITY,
    label: 'Совокупные обязательства пользователям',
  },
  {
    type: TreasuryAccountType.PLATFORM_FEES,
    label: 'Комиссии платформы',
  },
  {
    type: TreasuryAccountType.DEPOSIT_CLEARING,
    label: 'Клиринг депозитов',
  },
  {
    type: TreasuryAccountType.WITHDRAWAL_CLEARING,
    label: 'Клиринг выводов',
  },
  {
    type: TreasuryAccountType.PAYOUT_CLEARING,
    label: 'Клиринг выплат роялти',
  },
  {
    type: TreasuryAccountType.HOT_WALLET,
    label: 'Hot wallet (операционный)',
    addressEnv: 'TREASURY_HOT_WALLET_ADDRESS',
    minEnv: 'TREASURY_HOT_MIN_BALANCE_USDT',
    maxEnv: 'TREASURY_HOT_MAX_BALANCE_USDT',
  },
  {
    type: TreasuryAccountType.COLD_WALLET,
    label: 'Cold wallet (хранение, manual)',
    addressEnv: 'TREASURY_COLD_WALLET_ADDRESS',
  },
  {
    type: TreasuryAccountType.REVENUE_DISTRIBUTION,
    label: 'Распределение выручки',
  },
  {
    type: TreasuryAccountType.SUSPENSE,
    label: 'Suspense / нераспределённые средства',
  },
];
