import { AppLocale } from '@prisma/client';

import {
  parseHelpTranslations,
  resolveLocalizedHelpText,
} from './help-content-locale.util';

describe('help-content-locale.util', () => {
  it('resolves requested locale first', () => {
    const result = resolveLocalizedHelpText(
      { ru: 'RU', en: 'EN', es: 'ES' },
      AppLocale.en,
    );
    expect(result.text).toBe('EN');
    expect(result.resolvedLocale).toBe(AppLocale.en);
  });

  it('falls back ru → en when locale missing', () => {
    const result = resolveLocalizedHelpText({ ru: 'RU title' }, AppLocale.en);
    expect(result.text).toBe('RU title');
    expect(result.resolvedLocale).toBe(AppLocale.ru);
  });

  it('returns empty string for invalid translations', () => {
    expect(parseHelpTranslations(null)).toEqual({});
    expect(resolveLocalizedHelpText(null, AppLocale.ru).text).toBe('');
  });
});
