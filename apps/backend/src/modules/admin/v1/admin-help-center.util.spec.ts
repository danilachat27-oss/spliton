import {
  assertPublishableHelpArticle,
  hasNonEmptyTranslation,
  mergeTranslations,
  normalizeHelpSlug,
} from './admin-help-center.util';

describe('admin-help-center.util', () => {
  it('normalizes slug', () => {
    expect(normalizeHelpSlug('  Hello-World  ')).toBe('hello-world');
  });

  it('merges translation patches', () => {
    expect(
      mergeTranslations({ ru: 'Old' }, { en: 'New EN', ru: 'New RU' }),
    ).toEqual({ ru: 'New RU', en: 'New EN' });
  });

  it('validates publishable article fields', () => {
    expect(() =>
      assertPublishableHelpArticle({
        slug: 'test',
        categoryId: null,
        titleTranslations: { ru: 'Title' },
        contentTranslations: { ru: 'Body' },
      }),
    ).toThrow('category is required');

    expect(() =>
      assertPublishableHelpArticle({
        slug: 'test',
        categoryId: 'cat-id',
        titleTranslations: { ru: 'Title' },
        contentTranslations: { ru: 'Body' },
      }),
    ).not.toThrow();
  });

  it('detects non-empty translations', () => {
    expect(hasNonEmptyTranslation({ ru: '  ' })).toBe(false);
    expect(hasNonEmptyTranslation({ en: 'Text' })).toBe(true);
  });
});
