import type { AdminTrackListItem } from "@/features/admin/mocks/admin-tracks.mock";
import { formatTrackStatus } from "@/features/admin/lib/admin-i18n";

export type ReleaseType = "single" | "ep" | "album";

export type AdminTrackFormBody = {
  title: string;
  artist: string;
  releaseType: ReleaseType;
  genre: string;
  releaseDate: string;
  status: string;
  description: string;
  shortDescription: string;
  riskDisclosureText: string;
  legalDisclaimer: string;
  secondaryEnabled: boolean;
  coverUrl: string;
  audioPreviewUrl: string;
  labelName: string;
  copyrightOwner: string;
  isrc: string;
  upc: string;
  spotifyUrl: string;
  appleMusicUrl: string;
  youtubeUrl: string;
  yandexMusicUrl: string;
  holderSharePct: string;
  artistSharePct: string;
  platformSharePct: string;
  totalUnits: string;
  availableUnits: string;
  primaryUnitPrice: string;
  minPurchaseUnits: string;
  maxPurchaseUnits: string;
  raiseTargetUsdt: string;
  hardCapUsdt: string;
  promoBudgetUsdt: string;
  artistUpfrontUsdt: string;
  platformUpfrontUsdt: string;
  distributionNotes: string;
};

export const RELEASE_TYPE_LABELS: Record<ReleaseType, string> = {
  single: "Сингл",
  ep: "EP",
  album: "Альбом",
};

export const TRACK_FIELD_TOOLTIPS = {
  raiseTarget: "Целевая сумма первичного раунда — сколько USDT планируется привлечь от держателей.",
  hardCap: "Максимальный объём сбора — после достижения новые покупки юнитов закрываются.",
  promoBudget: "Бюджет на продвижение релиза (маркетинг, медиа, реклама).",
  artistUpfront: "Авансовый платёж артисту до начала или в ходе раунда.",
  platformUpfront: "Аванс платформе Spliton за сопровождение релиза и инфраструктуру.",
  holderShare:
    "Доля дохода держателей UNT (инвесторов). Вместе с долями артиста и платформы должна давать ровно 100%.",
  artistShare: "Доля артиста от потока дохода релиза после выплат держателям.",
  platformShare: "Доля платформы Spliton за инфраструктуру, комплаенс и сопровождение сделки.",
  sharesTotal:
    "Сумма holder + artist + platform должна быть 100%. Иначе публикация и расчёт выплат будут заблокированы.",
  primaryRound:
    "Первичный раунд создаётся в разделе «Раунды» после сохранения релиза — здесь задаются только параметры релиза.",
  releaseType: "Формат релиза влияет на отображение в каталоге и набор обязательных полей (ISRC/UPC).",
  label: "Лейбл дистрибуции или правообладателя. Используйте справочник, чтобы не плодить дубликаты.",
  totalUnits: "Общее количество UNT (долей) релиза. Определяет максимальный объём первичного размещения.",
  unitPrice: "Цена одного UNT в USDT на первичном раунде.",
  minPurchase: "Минимальный лот покупки для инвестора на первичке.",
  maxPurchase: "Максимальный лот за одну сделку на первичке (анти-концентрация).",
  secondaryEnabled: "Если включено, после первички инструмент может торговаться на вторичном рынке Spliton.",
  compliance: "Категория комплаенс-листа определяет обязательные проверки перед публикацией.",
  faq: "Вопросы и ответы отображаются на публичной странице релиза.",
  audioPreview:
    "Короткий preview (30–60 сек). Не загружайте полный трек без необходимости — используйте URL на обрезанный фрагмент.",
  cover:
    "Квадратная обложка JPG/PNG/WebP до 5 MB. Загрузите файл в Supabase Storage (release-covers) или укажите публичный URL.",
} as const;

function parseNum(value: string): number {
  const n = Number(String(value).replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}

function isValidUrl(value: string): boolean {
  if (!value.trim()) return true;
  try {
    const u = new URL(value.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function emptyTrackForm(): AdminTrackFormBody {
  return {
    title: "",
    artist: "",
    releaseType: "single",
    genre: "",
    releaseDate: "",
    status: "draft",
    description: "",
    shortDescription: "",
    riskDisclosureText: "",
    legalDisclaimer: "",
    secondaryEnabled: true,
    coverUrl: "",
    audioPreviewUrl: "",
    labelName: "",
    copyrightOwner: "",
    isrc: "",
    upc: "",
    spotifyUrl: "",
    appleMusicUrl: "",
    youtubeUrl: "",
    yandexMusicUrl: "",
    holderSharePct: "70",
    artistSharePct: "25",
    platformSharePct: "5",
    totalUnits: "10000",
    availableUnits: "10000",
    primaryUnitPrice: "5",
    minPurchaseUnits: "1",
    maxPurchaseUnits: "",
    raiseTargetUsdt: "0",
    hardCapUsdt: "0",
    promoBudgetUsdt: "0",
    artistUpfrontUsdt: "0",
    platformUpfrontUsdt: "0",
    distributionNotes: "",
  };
}

export function trackFormFromItem(track: AdminTrackListItem): AdminTrackFormBody {
  return {
    title: track.title,
    artist: track.artist,
    releaseType: (track.releaseType as ReleaseType) || "single",
    genre: track.genre === "—" ? "" : track.genre,
    releaseDate: track.releaseDate ?? "",
    status: track.status,
    description: track.description ?? "",
    shortDescription: track.shortDescription ?? "",
    riskDisclosureText: track.riskDisclosureText ?? "",
    legalDisclaimer: track.legalDisclaimer ?? "",
    secondaryEnabled: track.secondaryEnabled ?? true,
    coverUrl: track.coverUrl ?? "",
    audioPreviewUrl: track.audioPreviewUrl ?? "",
    labelName: track.labelName ?? "",
    copyrightOwner: track.copyrightOwner ?? "",
    isrc: track.isrc ?? "",
    upc: track.upc ?? "",
    spotifyUrl: track.spotifyUrl ?? "",
    appleMusicUrl: track.appleMusicUrl ?? "",
    youtubeUrl: track.youtubeUrl ?? "",
    yandexMusicUrl: track.yandexMusicUrl ?? "",
    holderSharePct: track.holderSharePct ?? track.revenueSharePoolPct ?? "70",
    artistSharePct: track.artistSharePct ?? "25",
    platformSharePct: track.platformSharePct ?? track.distributionSharePct ?? "5",
    totalUnits: track.totalUnits,
    availableUnits: track.availableUnits,
    primaryUnitPrice: track.primaryUnitPrice ?? "5",
    minPurchaseUnits: track.minPurchaseUnits ?? "1",
    maxPurchaseUnits: track.maxPurchaseUnits ?? "",
    raiseTargetUsdt: track.raiseTargetUsdt,
    hardCapUsdt: track.hardCapUsdt,
    promoBudgetUsdt: track.promoBudgetUsdt,
    artistUpfrontUsdt: track.artistUpfrontUsdt,
    platformUpfrontUsdt: track.platformUpfrontUsdt,
    distributionNotes: track.distributionNotes ?? "",
  };
}

function isPersistableExternalAudioUrl(value: string): boolean {
  const v = value.trim();
  if (!v || v.startsWith("releases/")) return false;
  if (v.includes("/storage/v1/object/sign/") || v.includes("token=")) return false;
  return isValidUrl(v);
}

export function trackFormToPayload(form: AdminTrackFormBody): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    title: form.title.trim(),
    artist: form.artist.trim(),
    releaseType: form.releaseType,
    genre: form.genre.trim() || undefined,
    releaseDate: form.releaseDate || undefined,
    description: form.description.trim() || undefined,
    shortDescription: form.shortDescription.trim() || undefined,
    riskDisclosureText: form.riskDisclosureText.trim() || undefined,
    legalDisclaimer: form.legalDisclaimer.trim() || undefined,
    secondaryEnabled: form.secondaryEnabled,
    coverUrl: form.coverUrl.trim() || undefined,
    labelName: form.labelName.trim() || undefined,
    copyrightOwner: form.copyrightOwner.trim() || undefined,
    isrc: form.isrc.trim() || undefined,
    upc: form.upc.trim() || undefined,
    spotifyUrl: form.spotifyUrl.trim() || undefined,
    appleMusicUrl: form.appleMusicUrl.trim() || undefined,
    youtubeUrl: form.youtubeUrl.trim() || undefined,
    yandexMusicUrl: form.yandexMusicUrl.trim() || undefined,
    holderSharePct: parseNum(form.holderSharePct),
    artistSharePct: parseNum(form.artistSharePct),
    platformSharePct: parseNum(form.platformSharePct),
    totalUnits: parseNum(form.totalUnits),
    availableUnits: parseNum(form.availableUnits),
    primaryUnitPrice: parseNum(form.primaryUnitPrice),
    minPurchaseUnits: form.minPurchaseUnits.trim() ? parseNum(form.minPurchaseUnits) : undefined,
    maxPurchaseUnits: form.maxPurchaseUnits.trim() ? parseNum(form.maxPurchaseUnits) : undefined,
    raiseTargetUsdt: parseNum(form.raiseTargetUsdt),
    hardCapUsdt: parseNum(form.hardCapUsdt),
    promoBudgetUsdt: parseNum(form.promoBudgetUsdt),
    artistUpfrontUsdt: parseNum(form.artistUpfrontUsdt),
    platformUpfrontUsdt: parseNum(form.platformUpfrontUsdt),
    distributionNotes: form.distributionNotes.trim() || undefined,
  };
  if (isPersistableExternalAudioUrl(form.audioPreviewUrl)) {
    payload.audioPreviewUrl = form.audioPreviewUrl.trim();
  }
  return payload;
}

export function shareSplitTotal(form: AdminTrackFormBody): number {
  return (
    parseNum(form.holderSharePct) +
    parseNum(form.artistSharePct) +
    parseNum(form.platformSharePct)
  );
}

export type TrackPublishChecklistItem = {
  id: string;
  fieldId?: string;
  label: string;
  ok: boolean;
};

export function buildTrackPublishChecklist(form: AdminTrackFormBody): TrackPublishChecklistItem[] {
  const shares = shareSplitTotal(form);
  const total = parseNum(form.totalUnits);
  const price = parseNum(form.primaryUnitPrice);
  return [
    { id: "cover", fieldId: "tr-cover", label: "Обложка добавлена", ok: Boolean(form.coverUrl.trim()) },
    { id: "title", fieldId: "tr-title", label: "Название заполнено", ok: Boolean(form.title.trim()) },
    { id: "artist", fieldId: "tr-artist", label: "Артист указан", ok: Boolean(form.artist.trim()) },
    { id: "genre", fieldId: "tr-genre", label: "Жанр указан", ok: Boolean(form.genre.trim()) },
    {
      id: "shares",
      fieldId: "tr-holder",
      label: "Доли дохода дают 100%",
      ok: Math.abs(shares - 100) < 0.01 && shares > 0,
    },
    { id: "units", fieldId: "tr-total", label: "Всего юнитов > 0", ok: total > 0 },
    { id: "price", fieldId: "tr-price", label: "Цена за юнит указана", ok: price > 0 },
    {
      id: "preview",
      label: "Preview карточки выглядит корректно",
      ok: Boolean(form.title.trim() && form.artist.trim()),
    },
  ];
}

export function validateTrackForm(
  form: AdminTrackFormBody,
  kind: "draft" | "review" | "publish",
): string[] {
  const errors: string[] = [];
  if (!form.title.trim()) errors.push("Укажите название релиза.");
  if (!form.artist.trim()) errors.push("Укажите артиста.");
  if (kind !== "draft") {
    if (!form.genre.trim()) errors.push("Укажите жанр.");
  }
  if (parseNum(form.totalUnits) <= 0) errors.push("Всего юнитов должно быть больше 0.");
  if (parseNum(form.primaryUnitPrice) < 0) errors.push("Цена за юнит не может быть отрицательной.");
  const sold = parseNum(form.totalUnits) - parseNum(form.availableUnits);
  if (sold < 0) errors.push("Доступно юнитов не может превышать общее количество.");
  const minP = parseNum(form.minPurchaseUnits);
  const maxP = parseNum(form.maxPurchaseUnits);
  if (form.maxPurchaseUnits.trim() && minP > maxP) {
    errors.push("Минимальная покупка не может превышать максимальную.");
  }
  const shares = shareSplitTotal(form);
  if (shares > 0 && Math.abs(shares - 100) > 0.01) {
    errors.push(`Сумма долей должна быть 100% (сейчас ${shares.toFixed(1)}%).`);
  }
  for (const [label, value] of [
    ["Обложка", form.coverUrl],
    ["Audio preview", form.audioPreviewUrl],
    ["Spotify", form.spotifyUrl],
    ["Apple Music", form.appleMusicUrl],
    ["YouTube", form.youtubeUrl],
    ["Яндекс Музыка", form.yandexMusicUrl],
  ] as const) {
    if (value.trim() && !isValidUrl(value)) {
      errors.push(`Некорректный URL: ${label}.`);
    }
  }
  if (kind === "publish") {
    if (!form.coverUrl.trim()) errors.push("Для публикации нужна обложка.");
    if (parseNum(form.primaryUnitPrice) <= 0) errors.push("Для публикации укажите цену за юнит.");
    if (Math.abs(shares - 100) > 0.01) errors.push("Для публикации доли должны давать ровно 100%.");
  }
  return errors;
}

export function trackStatusLabel(status: string): string {
  return formatTrackStatus(status);
}

export function unitsSold(form: AdminTrackFormBody): number {
  return Math.max(0, parseNum(form.totalUnits) - parseNum(form.availableUnits));
}

export function unitsProgressPct(form: AdminTrackFormBody): number {
  const total = parseNum(form.totalUnits);
  if (total <= 0) return 0;
  return Math.min(100, Math.round((unitsSold(form) / total) * 100));
}

/** TODO: Public/Admin Artists API needed — сейчас текстовое поле + find-or-create на backend. */
export const ARTISTS_API_TODO =
  "Public/Admin Artists API needed: selector с поиском по каталогу артистов.";
