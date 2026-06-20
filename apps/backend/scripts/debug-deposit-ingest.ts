import { randomBytes } from 'crypto';
import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';
import { PrismaClient } from '@prisma/client';
import { createE2eApp } from '../test/helpers/create-e2e-app';
import { registerE2eUser } from '../test/helpers/register-e2e-user';
import { seedWalletWithLedger } from '../test/helpers/seed-wallet-ledger';
import { DepositIngestionService } from '../src/modules/deposit-ingestion/deposit-ingestion.service';
import { MockDepositProvider } from '../src/modules/deposit-ingestion/providers/mock-deposit.provider';

const envPath = resolve(__dirname, '../../../.env');
if (existsSync(envPath)) config({ path: envPath });

process.env.NODE_ENV = 'test';
process.env.TRON_PROVIDER_MODE = 'mock';
process.env.DEPOSIT_INGESTION_ENABLED = 'false';
process.env.TRON_CONFIRMATIONS = '20';
process.env.REPORT_WORKER_ENABLED = 'false';
process.env.EVENT_OUTBOX_WORKER_ENABLED = 'false';
process.env.SKIP_SCHEMA_BOOTSTRAP = 'true';
if (!process.env.TWO_FACTOR_ENCRYPTION_KEY?.trim()) {
  process.env.TWO_FACTOR_ENCRYPTION_KEY = randomBytes(32).toString('base64');
}

async function main() {
  const email = `dep-debug-${Date.now()}@example.com`;
  const app = await createE2eApp();
  try {
    const { userId } = await registerE2eUser(app, email);
    const wallet = await seedWalletWithLedger(userId, '10');
    const prisma = new PrismaClient();
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' },
    });

    const provider = app.get(MockDepositProvider);
    const ingestion = app.get(DepositIngestionService);
    provider.clear();
    const txHash = `tx-debug-${Date.now()}`;
    provider.enqueue({
      txHash,
      fromAddress: 'TFromAddress111111111111111111111111111',
      toAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
      amount: '25',
      confirmations: 25,
      blockNumber: 1000n,
      tokenContract: '',
      network: 'TRC20',
      assetCode: 'USDT',
    });
    const out = await ingestion.tick();
    console.log('tick:', out);

    const balance = await prisma.walletBalance.findUnique({
      where: { walletId: wallet.id },
    });
    const dep = await prisma.deposit.findFirst({
      where: { blockchainTxid: txHash },
      include: { walletTx: true },
    });
    const txs = await prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      select: { id: true, idempotencyKey: true, status: true, amount: true },
    });
    const postings = await prisma.ledgerPosting.findMany({
      where: { walletId: wallet.id },
      select: { operationType: true, amount: true, idempotencyKey: true },
    });
    console.log('available:', balance?.available.toString());
    console.log('deposit:', dep?.status, dep?.id);
    console.log('wallet txs:', txs);
    console.log('postings:', postings);
    await prisma.$disconnect();
  } finally {
    await app.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
