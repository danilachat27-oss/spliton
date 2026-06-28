/**
 * Idempotent seed: admin product update + user system announcement for calculator release.
 * Usage: npx tsx apps/backend/scripts/seed-calculator-release.ts
 */
import "dotenv/config";
import {
  PrismaClient,
  SystemAnnouncementAudience,
  SystemAnnouncementSeverity,
  SystemAnnouncementStatus,
  SystemAnnouncementType,
  UserRoleCode,
} from "@prisma/client";
import { AdminUpdatesService } from "../src/modules/admin-updates/admin-updates.service";
import { PrismaService } from "../src/prisma/prisma.service";

const USER_ANNOUNCEMENT_TITLE = "Обновлён калькулятор покупки UNT";

async function seedUserAnnouncement(prisma: PrismaClient): Promise<"created" | "skipped"> {
  const existing = await prisma.systemAnnouncement.findFirst({
    where: { title: USER_ANNOUNCEMENT_TITLE },
  });
  if (existing) return "skipped";

  const adminUser = await prisma.user.findFirst({
    where: {
      roles: {
        some: { role: { code: UserRoleCode.SUPER_ADMIN }, revokedAt: null },
      },
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (!adminUser) {
    throw new Error("No SUPER_ADMIN user found — cannot create system announcement");
  }

  const now = new Date();
  await prisma.systemAnnouncement.create({
    data: {
      type: SystemAnnouncementType.RELEASE,
      audience: SystemAnnouncementAudience.ALL,
      severity: SystemAnnouncementSeverity.LOW,
      status: SystemAnnouncementStatus.ACTIVE,
      title: USER_ANNOUNCEMENT_TITLE,
      shortMessage:
        "Расчёт UNT теперь привязан к цене релиза; сумма к оплате и лимиты совпадают с checkout.",
      message: `Мы обновили калькулятор и экран покупки UNT.

• Сумма к оплате считается как units × цена конкретного релиза
• Комиссия платформы показывается отдельно и не завышает итог для secondary buy
• Учитываются минимум и максимум покупки из активного раунда
• Standalone-калькулятор в разделе «Активы → Калькулятор» использует ту же логику

Фактическая сделка по-прежнему подтверждается на странице покупки релиза с расчётом сервера.`,
      actionLabel: "Открыть калькулятор",
      actionUrl: "/assets/calculator",
      dismissible: true,
      sticky: false,
      showOnPublic: true,
      showInApp: true,
      showInAdmin: false,
      translations: {
        en: {
          title: "UNT purchase calculator updated",
          shortMessage:
            "UNT math now follows each release price; totals and limits match catalog checkout.",
          message:
            "We updated the UNT purchase calculator and buy screen.\n\n• Total = units × the release price\n• Platform fee is shown separately; secondary buy total is not inflated\n• Min/max purchase limits from the active round are respected\n• The standalone calculator under Assets uses the same model\n\nLive trades are still confirmed on the release buy page with server-side pricing.",
          actionLabel: "Open calculator",
        },
        es: {
          title: "Calculadora de compra UNT actualizada",
          shortMessage:
            "El cálculo UNT sigue el precio del release; totales y límites coinciden con el checkout.",
          message:
            "Actualizamos la calculadora de compra UNT.\n\n• Total = units × precio del release\n• La comisión se muestra aparte; el total secondary no se infla\n• Se respetan mínimo y máximo del round activo\n• La calculadora en Activos usa la misma lógica\n\nLa operación real se confirma en la página de compra con precio del servidor.",
          actionLabel: "Abrir calculadora",
        },
        pt: {
          title: "Calculadora de compra UNT atualizada",
          shortMessage:
            "O cálculo UNT segue o preço do release; totais e limites coincidem com o checkout.",
          message:
            "Atualizámos a calculadora de compra UNT.\n\n• Total = units × preço do release\n• A comissão é mostrada à parte; o total secondary não é inflacionado\n• Respeitam-se mínimo e máximo do round ativo\n• A calculadora em Ativos usa a mesma lógica\n\nA operação real confirma-se na página de compra com preço do servidor.",
          actionLabel: "Abrir calculadora",
        },
      },
      createdByUserId: adminUser.id,
      updatedByUserId: adminUser.id,
      publishedByUserId: adminUser.id,
      publishedAt: now,
    },
  });
  return "created";
}

async function main() {
  const prisma = new PrismaClient();
  const service = new AdminUpdatesService(prisma as unknown as PrismaService);
  try {
    const adminUpdate = await service.seedCalculatorUnitsUpdateIfMissing();
    const userBanner = await seedUserAnnouncement(prisma);
    console.log(`Calculator release seed: adminUpdate=${adminUpdate}, userBanner=${userBanner}`);
  } finally {
    await prisma.$disconnect();
  }
}

void main();
