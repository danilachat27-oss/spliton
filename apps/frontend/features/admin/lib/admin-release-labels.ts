import type { AppLocale } from "@/lib/i18n/types";
import { ADMIN_MESSAGES } from "@/lib/i18n/admin-messages";
import type { AdminReleasePhase, AdminReleaseRow } from "@/features/admin/mocks/admin-data";

export const RELEASE_STATUS_RU: Record<AdminReleaseRow["status"], string> = {
  listed: "В каталоге",
  paused: "Приостановлен",
  draft: "Черновик",
  settled: "Завершён",
};

export const RELEASE_PHASE_RU: Record<AdminReleasePhase, string> = {
  draft_review: "Проверка макета",
  fundraising: "Раунд сбора",
  post_funded: "Сбор закрыт",
  secondary: "Вторичный рынок",
  payouts: "Выплаты роялти",
};

function releaseMsg(locale: AppLocale, key: string, fallback: string): string {
  return ADMIN_MESSAGES[locale][key] ?? ADMIN_MESSAGES.ru[key] ?? fallback;
}

export function releaseStatusLabelForLocale(
  status: AdminReleaseRow["status"],
  locale: AppLocale = "ru",
): string {
  return releaseMsg(locale, `admin.release.status.${status}`, RELEASE_STATUS_RU[status]);
}

export function releasePhaseLabelForLocale(phase: AdminReleasePhase, locale: AppLocale = "ru"): string {
  return releaseMsg(locale, `admin.release.phase.${phase}`, RELEASE_PHASE_RU[phase]);
}

/** Как карточка будет читаться в каталоге (логика как у `CatalogTrackCard`). */
export function catalogPreviewFromRelease(r: AdminReleaseRow): {
  strip: string;
  detail: string;
} {
  const paused = r.status === "paused";
  if (r.phase === "secondary" && r.status !== "draft") {
    return {
      strip: paused ? "Вторичный рынок · на паузе" : "Вторичный рынок · UNT",
      detail: `Цена ориентира ${r.unitPriceUsdt} USDT · остаток ${r.unitsOutstanding} UNT`,
    };
  }
  if (r.phase === "payouts" || r.status === "settled") {
    return {
      strip: "Выплаты",
      detail: `Роялти инвесторам · прогноз ${r.forecastYieldPct}%`,
    };
  }
  if (r.phase === "fundraising" || r.phase === "post_funded") {
    const open = r.status === "listed" && !paused && r.phase === "fundraising";
    return {
      strip: open ? "Раунд открыт" : paused ? "Раунд · пауза" : "Раунд · закрыт для входа",
      detail: `Цель ${r.goalUsdt} USDT · собрано ${r.raisedUsdt} USDT · в пуле ещё ${r.investorPoolRemainingPct}%`,
    };
  }
  return {
    strip: "Черновик",
    detail: "Не публикуется в каталоге, пока статус «Черновик».",
  };
}
