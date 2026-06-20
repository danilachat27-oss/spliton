import {
  ActorRole,
  LedgerAccount,
  LedgerOperationType,
  LedgerPostingSide,
  Prisma,
  PrismaClient,
  WalletStatus,
} from '@prisma/client';

/** Creates wallet + balance cache and opening ledger credit aligned with migration baseline. */
export async function seedWalletWithLedger(
  userId: string,
  available: string,
  locked = '0',
) {
  const prisma = new PrismaClient();
  const wallet = await prisma.wallet.create({
    data: {
      userId,
      assetCode: 'USDT',
      network: 'TRC20',
      status: WalletStatus.ACTIVE,
      balance: {
        create: {
          available: new Prisma.Decimal(available),
          locked: new Prisma.Decimal(locked),
          pending: new Prisma.Decimal(0),
        },
      },
    },
  });

  const avail = new Prisma.Decimal(available);
  if (avail.greaterThan(0)) {
    await prisma.ledgerPosting.create({
      data: {
        walletId: wallet.id,
        ledgerAccount: LedgerAccount.USER_AVAILABLE,
        side: LedgerPostingSide.CREDIT,
        amount: avail,
        currency: 'USDT',
        operationType: LedgerOperationType.OPENING_BALANCE,
        sourceEntityType: 'wallet_balance',
        sourceEntityId: wallet.id,
        actorRole: ActorRole.SYSTEM,
      },
    });
  }

  const lockAmt = new Prisma.Decimal(locked);
  if (lockAmt.greaterThan(0)) {
    await prisma.ledgerPosting.create({
      data: {
        walletId: wallet.id,
        ledgerAccount: LedgerAccount.USER_LOCKED,
        side: LedgerPostingSide.CREDIT,
        amount: lockAmt,
        currency: 'USDT',
        operationType: LedgerOperationType.OPENING_BALANCE,
        sourceEntityType: 'wallet_balance',
        sourceEntityId: wallet.id,
        actorRole: ActorRole.SYSTEM,
      },
    });
  }

  await prisma.$disconnect();
  return wallet;
}
