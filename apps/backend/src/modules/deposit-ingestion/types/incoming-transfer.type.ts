export type IncomingUsdtTransfer = {
  txHash: string;
  fromAddress: string;
  toAddress: string;
  amount: string;
  confirmations: number;
  blockNumber: bigint;
  tokenContract: string;
  network: 'TRC20';
  assetCode: 'USDT';
};

export type ProviderHealth = {
  ok: boolean;
  mode: string;
  message?: string;
  lastBlock?: string;
};
