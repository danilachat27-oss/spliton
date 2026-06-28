import { localizeCatalogItem } from "@/lib/catalog/catalog-adapter";
import { catalogItems } from "@/lib/catalog-mock";
import { analyticsReleaseStatusLabel } from "./analytics-messages";
import { CLIENT_DICTIONARIES } from "./client-dictionaries";
import { containsCyrillic, localeMessage, messageForApiError } from "./dictionaries";
import { referralStatusLabel } from "./referral-messages";
import { mergeAppLocale } from "./locale-dictionary-merge";
import { PROFILE_MESSAGES } from "./profile-messages";
import { profileTabLabel } from "./profile-messages";
import { completenessItemLabel } from "@/lib/profile/overview-labels";

const RU_KEYS = Object.keys(mergeAppLocale("ru")).sort();
const FORBIDDEN_EN_STRINGS = ["Доступно", "Недоступно", "нет данных", "Нет данных", "Ошибка", "Загрузка"];

describe("i18n error mapping", () => {
  it("maps wallet error to RU", () => {
    expect(messageForApiError("WALLET_INSUFFICIENT_BALANCE", "ru")).toMatch(/Недостаточно/);
  });

  it("maps wallet error to EN", () => {
    expect(messageForApiError("WALLET_INSUFFICIENT_BALANCE", "en")).toMatch(/Insufficient/);
  });

  it("falls back for unknown codes", () => {
    expect(messageForApiError("NOT_A_REAL_CODE", "ru")).toMatch(/Не удалось/);
  });

  it("sanitizes technical fallback", () => {
    expect(
      messageForApiError(undefined, "en", "Internal server error: prisma P2002"),
    ).toMatch(/Something went wrong|Operation failed|Try again/i);
  });
});

describe("EN locale gate", () => {
  it("EN client dictionary must not contain Cyrillic", () => {
    for (const [key, value] of Object.entries(CLIENT_DICTIONARIES.en)) {
      expect(containsCyrillic(value), `en:${key}`).toBe(false);
    }
  });

  it("EN dictionary includes all RU user-facing keys", () => {
    const enKeys = new Set(Object.keys(CLIENT_DICTIONARIES.en));
    for (const key of RU_KEYS) {
      expect(enKeys.has(key), `missing en key: ${key}`).toBe(true);
    }
  });

  it("known problematic Russian strings are absent from EN dictionary values", () => {
    const values = Object.values(CLIENT_DICTIONARIES.en).join("\n");
    for (const needle of FORBIDDEN_EN_STRINGS) {
      expect(values.includes(needle), needle).toBe(false);
    }
  });

  it("messageForApiError never returns Russian text for EN locale", () => {
    const msg = messageForApiError("NOT_A_REAL_CODE", "en");
    expect(containsCyrillic(msg)).toBe(false);
  });

  it("localizeCatalogItem renders EN labels and decimal formatting for mock cards", () => {
    const item = localizeCatalogItem(catalogItems[0]!, "en");
    expect(item.kind).toBe("funding");
    if (item.kind !== "funding") return;
    expect(item.statusLabel).toBe("Available");
    expect(item.forecastYield).toMatch(/10\.1%/);
    expect(item.unitPriceUsdt).toBe("22.00");
    expect(item.availablePct).toBe("High");
    expect(containsCyrillic(JSON.stringify(item))).toBe(false);
  });

  it("EN locale exposes Available purchase state label", () => {
    const label = CLIENT_DICTIONARIES.en["catalog.purchaseState.available"];
    expect(label).toBe("Available");
    expect(containsCyrillic(label)).toBe(false);
  });

  it("ES/PT locales do not leak Cyrillic for purchase state label", () => {
    for (const locale of ["es", "pt"] as const) {
      const label = CLIENT_DICTIONARIES[locale]["catalog.purchaseState.available"];
      expect(containsCyrillic(label)).toBe(false);
      expect(label).not.toBe("Доступно");
    }
  });

  it("localeMessage does not fall back to Russian for EN", () => {
    const msg = localeMessage(PROFILE_MESSAGES, "en", "profile.tabs.__missing__", "Fallback");
    expect(msg).toBe("Fallback");
    expect(containsCyrillic(msg)).toBe(false);
  });

  it("profile tab labels are English for EN locale", () => {
    const label = profileTabLabel("overview", "en");
    expect(containsCyrillic(label)).toBe(false);
  });

  it("referral status labels are English for EN locale", () => {
    const label = referralStatusLabel("ACTIVE", "en");
    expect(containsCyrillic(label)).toBe(false);
  });

  it("analytics release status labels are English for EN locale", () => {
    expect(analyticsReleaseStatusLabel("Active", "en")).toBe("Active");
    expect(containsCyrillic(analyticsReleaseStatusLabel("Paused", "en"))).toBe(false);
  });

  it("profile overview labels do not leak Russian for EN", () => {
    const label = completenessItemLabel("email", "en");
    expect(containsCyrillic(label)).toBe(false);
  });
});
