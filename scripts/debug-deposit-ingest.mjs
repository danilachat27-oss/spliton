import { config } from 'dotenv';
import { resolve } from 'path';
import { randomBytes } from 'crypto';
import { PrismaClient, UserStatus } from '@prisma/client';
import { createE2eApp } from '../apps/backend/test/helpers/create-e2e-app';
import { registerE2eUser } from '../apps/backend/test/helpers/register-e2e-user';
import { seedWalletWithLedger } from '../apps/backend/test/helpers/seed-wallet-ledger';
import { DepositIngestionService } from '../apps/backend/src/modules/deposit-ingestion/deposit-ingestion.service';
import { MockDepositProvider } from '../apps/backend/src/modules/deposit-ingestion/providers/mock-deposit.provider';

config({ path: resolve('.env') });
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
  await prisma.$disconnect();

  const provider = app.get(MockDepositProvider);
  const ingestion = app.get(DepositIngestionService);
  provider.clear();
  provider.enqueue({
    txHash: `tx-debug-${Date.now()}`,
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

  const p2 = new PrismaClient();
  const balance = await p2.walletBalance.findUnique({ where: { walletId: wallet.id } });
  const dep = await p2.deposit.findFirst({ where: { walletTx: { walletId: wallet.id } } });
  const postings = await p2.ledgerPosting.count({ where: { walletId: wallet.id } });
  console.log('available:', balance?.available.toString());
  console.log('deposit status:', dep?.status);
  console.log('postings:', postings);
  await p2.$disconnect();
} finally {
  await app.close();
}
