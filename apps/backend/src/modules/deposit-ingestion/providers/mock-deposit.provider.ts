import { Injectable } from '@nestjs/common';
import type { DepositBlockchainProvider } from './deposit-blockchain-provider.interface';
import type {
  IncomingUsdtTransfer,
  ProviderHealth,
} from '../types/incoming-transfer.type';

/** In-memory queue for e2e and local dev. */
@Injectable()
export class MockDepositProvider implements DepositBlockchainProvider {
  readonly mode = 'mock';

  private readonly queue: IncomingUsdtTransfer[] = [];

  /** Test helper: enqueue a transfer to be picked up on next poll. */
  enqueue(transfer: IncomingUsdtTransfer): void {
    this.queue.push(transfer);
  }

  clear(): void {
    this.queue.length = 0;
  }

  async health(): Promise<ProviderHealth> {
    await Promise.resolve();
    return {
      ok: true,
      mode: this.mode,
      message: `${this.queue.length} queued`,
    };
  }

  async fetchTransfersSince(
    _fromBlock: bigint,
  ): Promise<IncomingUsdtTransfer[]> {
    await Promise.resolve();
    void _fromBlock;
    if (!this.queue.length) return [];
    return this.queue.splice(0, this.queue.length);
  }
}
