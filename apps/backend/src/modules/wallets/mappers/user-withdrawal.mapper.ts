import { WithdrawalStatus } from '@prisma/client';
import { withdrawalStatusToApi } from '../../admin/v1/mappers/admin-withdrawal.mapper';

export type UserWithdrawalDto = {
  id: string;
  amountUsdt: string;
  feeUsdt: string;
  netAmountUsdt: string;
  toAddress: string;
  status: string;
  requestedAt: string;
  completedAt: string | null;
  blockchainTxid: string | null;
};

type WithdrawalRow = {
  id: string;
  toAddress: string;
  status: WithdrawalStatus;
  requestedAt: Date;
  completedAt: Date | null;
  blockchainTxid: string | null;
  walletTx: {
    amount: { toString(): string };
    feeAmount: { toString(): string };
    netAmount: { toString(): string };
  };
};

export function mapUserWithdrawal(row: WithdrawalRow): UserWithdrawalDto {
  return {
    id: row.id,
    amountUsdt: Number(row.walletTx.amount.toString()).toFixed(2),
    feeUsdt: Number(row.walletTx.feeAmount.toString()).toFixed(2),
    netAmountUsdt: Number(row.walletTx.netAmount.toString()).toFixed(2),
    toAddress: row.toAddress,
    status: withdrawalStatusToApi(row.status),
    requestedAt: row.requestedAt.toISOString(),
    completedAt: row.completedAt?.toISOString() ?? null,
    blockchainTxid: row.blockchainTxid,
  };
}
