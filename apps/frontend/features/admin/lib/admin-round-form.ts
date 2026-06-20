import type { AdminRoundListItem } from "@/features/admin/mocks/admin-rounds.mock";
import type { AdminTrackListItem } from "@/features/admin/mocks/admin-tracks.mock";
import { formatTrackStatus } from "@/features/admin/lib/admin-i18n";

export type AdminRoundFormBody = {
  trackId: string;
  name: string;
  status: string;
  unitPriceUsdt: string;
  totalUnits: string;
  soldUnits: string;
  minPurchaseUnits: string;
  maxPurchaseUnits: string;
  raiseTargetUsdt: string;
  hardCapUsdt: string;
  raisedAmountUsdt: string;
  startDate: string;
  endDate: string;
};

export type RoundChecklistItem = {
  id: string;
  label: string;
  ok: boolean;
  required: boolean;
};

export const ROUND_FIELD_TOOLTIPS = {
  name: "Внутреннее название раунда для операторов Spliton. Пользователи видят название релиза.",
  unitPrice: "Цена одного юнита в USDT. Хранится на релизе и используется при покупке в каталоге.",
  raiseTarget: "Плановая сумма сбора по раунду. Используется для прогресса в каталоге.",
  hardCap: "Максимальная сумма сбора — выше этого лимита новые покупки блокируются.",
  raised: "Сумма успешных покупок юнитов. Обновляется автоматически при сделках.",
  minPurchase: "Минимальное количество юнитов за одну покупку.",
  maxPurchase: "Максимальное количество юнитов за одну покупку. Пусто — без ограничения.",
  platformFee: "Комиссия платформы Spliton при первичной покупке. Настраивается в разделе «Настройки».",
  buyers: "Сейчас покупать могут все зарегистрированные пользователи. Whitelist — отдельный этап.",
} as const;

/** TODO: buyer whitelist for primary rounds */
export const ROUND_BUYER_WHITELIST_TODO =
  "Whitelist покупателей для раунда — запланировано. Сейчас доступны все пользователи.";

function parseNum(value: string): number {
  const n = Number(String(value).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

export function emptyRoundForm(): AdminRoundFormBody {
  return {
    trackId: "",
    name: "Первичный раунд",
    status: "draft",
    unitPriceUsdt: "",
    totalUnits: "",
    soldUnits: "0",
    minPurchaseUnits: "1",
    maxPurchaseUnits: "",
    raiseTargetUsdt: "",
    hardCapUsdt: "",
    raisedAmountUsdt: "0",
    startDate: "",
    endDate: "",
  };
}

export function roundFormFromItem(round: AdminRoundListItem): AdminRoundFormBody {
  return {
    trackId: round.trackId,
    name: round.name || "Первичный раунд",
    status: round.status,
    unitPriceUsdt: round.unitPriceUsdt.replace(/\s/g, ""),
    totalUnits: round.totalUnits,
    soldUnits: round.soldUnits,
    minPurchaseUnits: round.minPurchaseUnits || "1",
    maxPurchaseUnits: round.maxPurchaseUnits || "",
    raiseTargetUsdt: round.raiseTargetUsdt.replace(/\s/g, ""),
    hardCapUsdt: round.hardCapUsdt.replace(/\s/g, ""),
    raisedAmountUsdt: round.raisedAmountUsdt.replace(/\s/g, ""),
    startDate: round.startDate,
    endDate: round.endDate,
  };
}

export function roundFormFromTrack(track: AdminTrackListItem): Partial<AdminRoundFormBody> {
  return {
    trackId: track.id,
    unitPriceUsdt: track.primaryUnitPrice.replace(/\s/g, ""),
    totalUnits: track.availableUnits || track.totalUnits,
    soldUnits: "0",
    minPurchaseUnits: track.minPurchaseUnits || "1",
    maxPurchaseUnits: track.maxPurchaseUnits || "",
    raiseTargetUsdt: track.raiseTargetUsdt.replace(/\s/g, ""),
    hardCapUsdt: track.hardCapUsdt.replace(/\s/g, ""),
  };
}

export function roundFormToPayload(form: AdminRoundFormBody): Record<string, unknown> {
  return {
    trackId: form.trackId,
    name: form.name.trim() || "Первичный раунд",
    raiseTargetUsdt: form.raiseTargetUsdt,
    hardCapUsdt: form.hardCapUsdt,
    totalUnits: form.totalUnits,
    soldUnits: form.soldUnits,
    unitPriceUsdt: form.unitPriceUsdt,
    minPurchaseUnits: form.minPurchaseUnits,
    maxPurchaseUnits: form.maxPurchaseUnits || undefined,
    startDate: form.startDate || undefined,
    endDate: form.endDate || undefined,
  };
}

export function roundAvailableUnits(form: AdminRoundFormBody): number {
  return Math.max(0, parseNum(form.totalUnits) - parseNum(form.soldUnits));
}

export function roundProgressPct(form: AdminRoundFormBody): number {
  const target = parseNum(form.raiseTargetUsdt);
  const raised = parseNum(form.raisedAmountUsdt);
  if (target <= 0) return 0;
  return Math.min(100, Math.round((raised / target) * 100));
}

export function roundFullSalePotential(form: AdminRoundFormBody): number {
  return parseNum(form.totalUnits) * parseNum(form.unitPriceUsdt);
}

export function validateRoundForm(form: AdminRoundFormBody): string | null {
  if (!form.trackId.trim()) return "Выберите релиз";
  if (!form.name.trim()) return "Укажите название раунда";
  if (parseNum(form.totalUnits) <= 0) return "Всего юнитов должно быть больше 0";
  if (parseNum(form.unitPriceUsdt) <= 0) return "Цена за юнит должна быть больше 0";
  if (parseNum(form.minPurchaseUnits) <= 0) return "Минимальная покупка должна быть больше 0";
  const maxP = parseNum(form.maxPurchaseUnits);
  if (maxP > 0 && maxP < parseNum(form.minPurchaseUnits)) {
    return "Максимальная покупка не может быть меньше минимальной";
  }
  const sold = parseNum(form.soldUnits);
  const total = parseNum(form.totalUnits);
  if (sold > total) return "Продано не может превышать всего юнитов";
  const target = parseNum(form.raiseTargetUsdt);
  const cap = parseNum(form.hardCapUsdt);
  if (target < 0 || cap < 0) return "Финансовые лимиты не могут быть отрицательными";
  if (cap > 0 && target > 0 && cap < target) {
    return "Максимальный лимит не может быть меньше цели раунда";
  }
  if (form.startDate && form.endDate && form.endDate < form.startDate) {
    return "Дата окончания не может быть раньше даты начала";
  }
  if (form.status === "live" && !form.startDate) {
    return "Активный раунд должен иметь дату начала";
  }
  return null;
}

export function buildRoundPublishChecklist(
  form: AdminRoundFormBody,
  release: AdminTrackListItem | null,
  round: AdminRoundListItem | null,
  hasLiveConflict?: boolean,
): RoundChecklistItem[] {
  const holderShare = release ? parseNum(release.holderSharePct) : 0;
  const artistShare = release ? parseNum(release.artistSharePct) : 0;
  const platformShare = release ? parseNum(release.platformSharePct) : 0;
  const shareOk = Math.abs(holderShare + artistShare + platformShare - 100) < 0.01;

  return [
    {
      id: "release",
      label: "Релиз выбран",
      ok: Boolean(form.trackId.trim()),
      required: true,
    },
    {
      id: "cover",
      label: "Обложка релиза загружена",
      ok: Boolean(release?.coverUrl?.trim()),
      required: true,
    },
    {
      id: "title",
      label: "Название релиза заполнено",
      ok: Boolean(release?.title?.trim()),
      required: true,
    },
    {
      id: "artist",
      label: "Артист указан",
      ok: Boolean(release?.artist?.trim() && release.artist !== "—"),
      required: true,
    },
    {
      id: "unit_price",
      label: "Цена за юнит указана",
      ok: parseNum(form.unitPriceUsdt) > 0,
      required: true,
    },
    {
      id: "total_units",
      label: "Всего юнитов в раунде указано",
      ok: parseNum(form.totalUnits) > 0,
      required: true,
    },
    {
      id: "available",
      label: "Доступные юниты корректны",
      ok: roundAvailableUnits(form) >= 0 && parseNum(form.soldUnits) <= parseNum(form.totalUnits),
      required: true,
    },
    {
      id: "finance",
      label: "Цель и максимальный лимит согласованы",
      ok:
        parseNum(form.raiseTargetUsdt) > 0 &&
        (parseNum(form.hardCapUsdt) <= 0 || parseNum(form.hardCapUsdt) >= parseNum(form.raiseTargetUsdt)),
      required: true,
    },
    {
      id: "dates",
      label: "Даты раунда корректны",
      ok: Boolean(form.startDate) && (!form.endDate || form.endDate >= form.startDate),
      required: true,
    },
    {
      id: "shares",
      label: "Доли дохода релиза дают 100%",
      ok: shareOk && holderShare > 0,
      required: true,
    },
    {
      id: "conflict",
      label: "Нет другого активного раунда по этому релизу",
      ok: !(hasLiveConflict ?? round?.hasConflictingLiveRound),
      required: true,
    },
  ];
}

export function roundPublishBlockedReason(
  form: AdminRoundFormBody,
  release: AdminTrackListItem | null,
  round: AdminRoundListItem | null,
  hasLiveConflict?: boolean,
): string | null {
  const validation = validateRoundForm(form);
  if (validation) return validation;
  const checklist = buildRoundPublishChecklist(form, release, round, hasLiveConflict);
  const failed = checklist.filter((c) => c.required && !c.ok);
  if (failed.length) return failed[0]!.label;
  return null;
}

export function releaseStatusLabel(status: string): string {
  return formatTrackStatus(status);
}

export function formatUnitsLabel(value: string | number): string {
  const n = typeof value === "string" ? parseNum(value) : value;
  if (!n) return "0 юнитов";
  const word = n === 1 ? "юнит" : n >= 2 && n <= 4 ? "юнита" : "юнитов";
  return `${n.toLocaleString("ru-RU")} ${word}`;
}
