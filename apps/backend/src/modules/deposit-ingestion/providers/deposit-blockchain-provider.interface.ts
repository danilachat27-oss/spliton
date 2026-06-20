import type {
  IncomingUsdtTransfer,
  ProviderHealth,
} from '../types/incoming-transfer.type';

export const DEPOSIT_BLOCKCHAIN_PROVIDER = Symbol(
  'DEPOSIT_BLOCKCHAIN_PROVIDER',
);

export interface DepositBlockchainProvider {
  readonly mode: string;
  health(): Promise<ProviderHealth>;
  /** Poll transfers since block (inclusive). */
  fetchTransfersSince(fromBlock: bigint): Promise<IncomingUsdtTransfer[]>;
}
