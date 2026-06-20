import { clampPageSize, resolvePagination } from './pagination.util';
import { MAX_PAGE_SIZE } from './pagination.constants';

describe('pagination.util', () => {
  it('clamps pageSize to MAX_PAGE_SIZE', () => {
    expect(clampPageSize(500)).toBe(MAX_PAGE_SIZE);
    expect(clampPageSize(0)).toBe(1);
  });

  it('resolvePagination computes skip', () => {
    const r = resolvePagination(2, 25);
    expect(r).toEqual({ page: 2, pageSize: 25, skip: 25 });
  });
});
