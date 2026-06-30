import { AppLocale } from '@prisma/client';
import { normalizeDepositLang } from '../../common/i18n/app-locale';

type LocalizedRow = {
  ru?: string | null;
  en?: string | null;
  es?: string | null;
  pt?: string | null;
  ka?: string | null;
};

export function pickLocalizedText(
  row: LocalizedRow,
  lang?: string,
): string | null {
  const locale = normalizeDepositLang(lang);
  const chain =
    locale === AppLocale.en
      ? [row.en, row.ru, row.ka]
      : locale === AppLocale.es
        ? [row.es, row.en, row.ru, row.ka]
        : locale === AppLocale.pt
          ? [row.pt, row.en, row.ru, row.ka]
          : [row.ru, row.ka, row.en];

  for (const value of chain) {
    const trimmed = value?.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

export function pickLocalizedLines(
  row: LocalizedRow,
  lang?: string,
  fallbackLines?: string[],
): string[] {
  const text = pickLocalizedText(row, lang);
  const raw = text ?? fallbackLines?.join('\n') ?? '';
  return raw
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function formatMinutesLabel(minutes: number, lang?: string): string {
  const locale = normalizeDepositLang(lang);
  if (locale === AppLocale.en || locale === AppLocale.es || locale === AppLocale.pt) {
    if (minutes <= 1) return '~ 1 min';
    return `~ ${minutes} min`;
  }
  if (minutes <= 1) return '~ 1 \u043c\u0438\u043d\u0443\u0442\u0430';
  if (minutes < 5) return `~ ${minutes} \u043c\u0438\u043d\u0443\u0442\u044b`;
  return `~ ${minutes} \u043c\u0438\u043d\u0443\u0442`;
}
