import {
  isAnnouncementActiveNow,
  localizedAnnouncementFields,
  matchesAnnouncementAudience,
  parseTranslations,
  resolveAnnouncementLocale,
} from './system-announcements.util';

describe('system-announcements.util', () => {
  it('resolves locale with ru fallback', () => {
    expect(resolveAnnouncementLocale('en')).toBe('en');
    expect(resolveAnnouncementLocale('es')).toBe('es');
    expect(resolveAnnouncementLocale('pt')).toBe('pt');
    expect(resolveAnnouncementLocale('ka')).toBe('ru');
    expect(resolveAnnouncementLocale('xx')).toBe('ru');
  });

  it('localizes announcement fields with fallback to base title', () => {
    const row = {
      title: 'RU title',
      message: 'RU message',
      shortMessage: null,
      actionLabel: null,
      translations: {
        en: { title: 'EN title', message: 'EN message' },
      },
    };
    expect(localizedAnnouncementFields(row, 'en').title).toBe('EN title');
    expect(localizedAnnouncementFields(row, 'es').title).toBe('EN title');
    expect(localizedAnnouncementFields(row, 'pt').message).toBe('EN message');
  });

  it('filters active announcements by schedule', () => {
    const now = new Date('2026-06-03T12:00:00.000Z');
    expect(
      isAnnouncementActiveNow(
        { status: 'ACTIVE', startsAt: new Date('2026-06-03T11:00:00.000Z'), endsAt: null },
        now,
      ),
    ).toBe(true);
    expect(
      isAnnouncementActiveNow(
        { status: 'ACTIVE', startsAt: new Date('2026-06-03T13:00:00.000Z'), endsAt: null },
        now,
      ),
    ).toBe(false);
  });

  it('matches audience for guests and users', () => {
    expect(
      matchesAnnouncementAudience({
        audience: 'GUESTS',
        targetRoles: [],
        isAuthenticated: false,
        userRoles: [],
        isAdminSurface: false,
      }),
    ).toBe(true);
    expect(
      matchesAnnouncementAudience({
        audience: 'GUESTS',
        targetRoles: [],
        isAuthenticated: true,
        userRoles: [],
        isAdminSurface: false,
      }),
    ).toBe(false);
  });

  it('parses translations json safely', () => {
    expect(parseTranslations({ en: { title: 'Hello' } }).en?.title).toBe('Hello');
    expect(parseTranslations(null)).toEqual({});
  });
});
