import { AppLocale } from '@prisma/client';
import {
  DEFAULT_APP_LOCALE,
  normalizeAppLocale,
  normalizeDepositLang,
  SUPPORTED_APP_LOCALE_CODES,
} from './app-locale';

describe('app-locale', () => {
  it('exposes production locale codes', () => {
    expect(SUPPORTED_APP_LOCALE_CODES).toEqual(['ru', 'en', 'es', 'pt']);
  });

  it('normalizes supported locales', () => {
    expect(normalizeAppLocale('en')).toBe(AppLocale.en);
    expect(normalizeAppLocale('es')).toBe(AppLocale.es);
    expect(normalizeAppLocale('pt-BR')).toBe(AppLocale.pt);
    expect(normalizeAppLocale('ru')).toBe(AppLocale.ru);
  });

  it('maps legacy ka/ge to ru', () => {
    expect(normalizeAppLocale('ka')).toBe(AppLocale.ru);
    expect(normalizeAppLocale('ge')).toBe(AppLocale.ru);
    expect(normalizeDepositLang('ka')).toBe(AppLocale.ru);
  });

  it('falls back unknown locales to default', () => {
    expect(normalizeAppLocale('xx')).toBe(DEFAULT_APP_LOCALE);
    expect(normalizeAppLocale(undefined)).toBe(DEFAULT_APP_LOCALE);
  });
});
