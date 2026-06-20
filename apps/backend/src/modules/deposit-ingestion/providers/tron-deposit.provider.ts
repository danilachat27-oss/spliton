import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { DepositBlockchainProvider } from './deposit-blockchain-provider.interface';
import type {
  IncomingUsdtTransfer,
  ProviderHealth,
} from '../types/incoming-transfer.type';

/**
 * TRON/TRC20 provider stub — polls configured HTTP endpoint when TRON_PROVIDER_URL is set.
 * Production should wire TronGrid / custody webhook payloads into the same IncomingUsdtTransfer shape.
 */
@Injectable()
export class TronDepositProvider implements DepositBlockchainProvider {
  readonly mode = 'tron';

  private readonly logger = new Logger(TronDepositProvider.name);

  constructor(private readonly config: ConfigService) {}

  private tronConfig() {
    return this.config.get<{
      providerUrl?: string;
      apiKey?: string;
      usdtContract: string;
    }>('tron')!;
  }

  async health(): Promise<ProviderHealth> {
    const { providerUrl } = this.tronConfig();
    if (!providerUrl?.trim()) {
      return {
        ok: false,
        mode: this.mode,
        message: 'TRON_PROVIDER_URL not configured',
      };
    }
    try {
      const res = await fetch(
        `${providerUrl.replace(/\/$/, '')}/wallet/getnowblock`,
        {
          headers: this.headers(),
        },
      );
      if (!res.ok) {
        return { ok: false, mode: this.mode, message: `HTTP ${res.status}` };
      }
      const body = (await res.json()) as {
        block_header?: { raw_data?: { number?: number } };
      };
      const num = body.block_header?.raw_data?.number;
      return {
        ok: true,
        mode: this.mode,
        lastBlock: num != null ? String(num) : undefined,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`TRON health check failed: ${message}`);
      return { ok: false, mode: this.mode, message };
    }
  }

  async fetchTransfersSince(
    fromBlock: bigint,
  ): Promise<IncomingUsdtTransfer[]> {
    const { providerUrl, usdtContract } = this.tronConfig();
    if (!providerUrl?.trim()) return [];

    const url = `${providerUrl.replace(/\/$/, '')}/v1/contracts/${usdtContract}/transactions?only_to=true&min_block=${fromBlock.toString()}&limit=50`;
    try {
      const res = await fetch(url, { headers: this.headers() });
      if (!res.ok) {
        this.logger.warn(`TRON fetch failed: HTTP ${res.status}`);
        return [];
      }
      const body = (await res.json()) as {
        data?: Array<{
          transaction_id?: string;
          block_number?: number;
          from?: string;
          to?: string;
          value?: string;
          confirmations?: number;
        }>;
      };
      return (body.data ?? [])
        .filter((row) => row.transaction_id && row.to && row.value)
        .map((row) => ({
          txHash: row.transaction_id!,
          fromAddress: row.from ?? '',
          toAddress: row.to!,
          amount: this.fromSun(row.value!),
          confirmations: row.confirmations ?? 0,
          blockNumber: BigInt(row.block_number ?? 0),
          tokenContract: usdtContract,
          network: 'TRC20' as const,
          assetCode: 'USDT' as const,
        }));
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`TRON fetch error: ${message}`);
      return [];
    }
  }

  private headers(): Record<string, string> {
    const { apiKey } = this.tronConfig();
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (apiKey?.trim()) headers['TRON-PRO-API-KEY'] = apiKey.trim();
    return headers;
  }

  /** USDT TRC20 uses 6 decimals. */
  private fromSun(raw: string): string {
    const n = BigInt(raw);
    const whole = n / 1_000_000n;
    const frac = n % 1_000_000n;
    return `${whole}.${frac.toString().padStart(6, '0').replace(/0+$/, '') || '0'}`;
  }
}
