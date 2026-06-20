import { Prisma, PrismaClient } from '@prisma/client';

import { resolveE2eDatabaseUrl } from './e2e-database-url';

/**
 * Deletes e2e users and dependent rows (orders, trades, wallets, …) in FK-safe order.
 * Only for dedicated test DB — guarded by resolveE2eDatabaseUrl().
 */
export async function deleteE2eUsersWhere(
  where: Prisma.UserWhereInput,
): Promise<number> {
  resolveE2eDatabaseUrl();
  const prisma = new PrismaClient();

  try {
    const users = await prisma.user.findMany({ where, select: { id: true } });
    const ids = users.map((u) => u.id);
    if (ids.length === 0) return 0;

    await prisma.$transaction(
      async (tx) => {
      const walletIds = (
        await tx.wallet.findMany({ where: { userId: { in: ids } }, select: { id: true } })
      ).map((w) => w.id);

      const orderIds = (
        await tx.order.findMany({ where: { userId: { in: ids } }, select: { id: true } })
      ).map((o) => o.id);

      await tx.orderFill.deleteMany({
        where: {
          OR: [
            { orderId: { in: orderIds } },
            { trade: { OR: [{ buyerUserId: { in: ids } }, { sellerUserId: { in: ids } }] } },
          ],
        },
      });

      await tx.payoutClaim.deleteMany({ where: { payout: { userId: { in: ids } } } });
      await tx.payout.deleteMany({ where: { userId: { in: ids } } });
      await tx.earningPeriodHolderSnapshot.deleteMany({ where: { userId: { in: ids } } });
      await tx.ownershipLedger.deleteMany({ where: { userId: { in: ids } } });

      await tx.trade.deleteMany({
        where: { OR: [{ buyerUserId: { in: ids } }, { sellerUserId: { in: ids } }] },
      });

      await tx.order.deleteMany({ where: { userId: { in: ids } } });
      await tx.marketListing.deleteMany({ where: { sellerUserId: { in: ids } } });
      await tx.userPosition.deleteMany({ where: { userId: { in: ids } } });

      if (walletIds.length > 0) {
        const walletTxIds = (
          await tx.walletTransaction.findMany({
            where: { walletId: { in: walletIds } },
            select: { id: true },
          })
        ).map((t) => t.id);

        if (walletTxIds.length > 0) {
          await tx.withdrawalApproval.deleteMany({
            where: { withdrawal: { walletTxId: { in: walletTxIds } } },
          });
          await tx.withdrawal.deleteMany({ where: { walletTxId: { in: walletTxIds } } });
          await tx.depositIngestionLog.deleteMany({
            where: { deposit: { walletTxId: { in: walletTxIds } } },
          });
          await tx.deposit.deleteMany({ where: { walletTxId: { in: walletTxIds } } });
          await tx.fee.deleteMany({ where: { walletTransactionId: { in: walletTxIds } } });
          await tx.ledgerPosting.deleteMany({
            where: { walletTransactionId: { in: walletTxIds } },
          });
          await tx.walletTransaction.deleteMany({ where: { id: { in: walletTxIds } } });
        }

        await tx.ledgerPosting.deleteMany({ where: { walletId: { in: walletIds } } });
        await tx.userDepositAddress.deleteMany({ where: { walletId: { in: walletIds } } });
        await tx.wallet.deleteMany({ where: { id: { in: walletIds } } });
      }

      await tx.supportTicketMessage.deleteMany({
        where: {
          OR: [{ authorUserId: { in: ids } }, { ticket: { userId: { in: ids } } }],
        },
      });
      await tx.supportTicketNote.deleteMany({
        where: {
          OR: [{ authorUserId: { in: ids } }, { ticket: { userId: { in: ids } } }],
        },
      });
      await tx.supportTicket.deleteMany({
        where: {
          OR: [{ userId: { in: ids } }, { assignedToUserId: { in: ids } }],
        },
      });
      await tx.adminAction.deleteMany({ where: { adminUserId: { in: ids } } });
      await tx.auditLog.deleteMany({
        where: { OR: [{ actorUserId: { in: ids } }, { entityId: { in: ids } }] },
      });
      await tx.userSession.deleteMany({ where: { userId: { in: ids } } });
      await tx.userRole.deleteMany({ where: { userId: { in: ids } } });
      await tx.userProfile.deleteMany({ where: { userId: { in: ids } } });
      await tx.emailVerificationToken.deleteMany({ where: { userId: { in: ids } } });
      await tx.userLegalConsent.deleteMany({ where: { userId: { in: ids } } });
      await tx.referralAttribution.deleteMany({
        where: { OR: [{ referredUserId: { in: ids } }, { referrerUserId: { in: ids } }] },
      });
      await tx.reportJob.deleteMany({ where: { requestedById: { in: ids } } });
      await tx.complianceFreeze.deleteMany({
        where: {
          OR: [{ frozenByUserId: { in: ids } }, { releasedByUserId: { in: ids } }],
        },
      });
      await tx.complianceNote.deleteMany({
        where: {
          OR: [{ authorUserId: { in: ids } }, { userId: { in: ids } }],
        },
      });
      await tx.riskFlag.deleteMany({ where: { userId: { in: ids } } });

      await tx.disputeMessage.deleteMany({
        where: {
          OR: [{ authorUserId: { in: ids } }, { dispute: { userId: { in: ids } } }],
        },
      });
      await tx.dispute.deleteMany({
        where: {
          OR: [{ userId: { in: ids } }, { assignedToUserId: { in: ids } }],
        },
      });

      await tx.generatedDocument.deleteMany({ where: { ownerUserId: { in: ids } } });
      await tx.inAppNotification.deleteMany({ where: { recipientUserId: { in: ids } } });
      await tx.newsPost.deleteMany({
        where: {
          OR: [{ authorUserId: { in: ids } }, { publishedByUserId: { in: ids } }],
        },
      });
      await tx.helpArticle.deleteMany({ where: { authorUserId: { in: ids } } });
      await tx.withdrawalApproval.deleteMany({ where: { approverUserId: { in: ids } } });

      const announcementIds = (
        await tx.systemAnnouncement.findMany({
          where: {
            OR: [
              { createdByUserId: { in: ids } },
              { updatedByUserId: { in: ids } },
              { publishedByUserId: { in: ids } },
            ],
          },
          select: { id: true },
        })
      ).map((a) => a.id);
      if (announcementIds.length > 0) {
        await tx.systemAnnouncementDismissal.deleteMany({
          where: { announcementId: { in: announcementIds } },
        });
        await tx.systemAnnouncement.deleteMany({ where: { id: { in: announcementIds } } });
      }
      await tx.systemAnnouncementDismissal.deleteMany({ where: { userId: { in: ids } } });

      await tx.releaseSubmission.deleteMany({
        where: {
          OR: [{ artistUserId: { in: ids } }, { reviewedByUserId: { in: ids } }],
        },
      });
      await tx.referralReward.deleteMany({
        where: {
          OR: [{ referrerUserId: { in: ids } }, { referredUserId: { in: ids } }],
        },
      });
      await tx.operatorSlaTask.deleteMany({ where: { assignedToUserId: { in: ids } } });

      const incidentIds = (
        await tx.systemStatusIncident.findMany({
          where: { createdByUserId: { in: ids } },
          select: { id: true },
        })
      ).map((i) => i.id);
      if (incidentIds.length > 0) {
        await tx.systemStatusUpdate.deleteMany({ where: { incidentId: { in: incidentIds } } });
        await tx.systemStatusIncident.deleteMany({ where: { id: { in: incidentIds } } });
      }
      await tx.systemStatusUpdate.deleteMany({ where: { createdByUserId: { in: ids } } });

      await tx.user.deleteMany({ where: { id: { in: ids } } });
      },
      { timeout: 120_000, maxWait: 30_000 },
    );

    return ids.length;
  } finally {
    await prisma.$disconnect();
  }
}
