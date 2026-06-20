import { escapeCsvField, buildCsvFromTable, parseCsvToTable } from './csv.util';

describe('csv.util', () => {
  it('escapes formula injection prefixes', () => {
    expect(escapeCsvField('=1+1')).toBe("'=1+1");
    expect(escapeCsvField('+cmd')).toBe("'+cmd");
  });

  it('builds csv with BOM', () => {
    const csv = buildCsvFromTable(['a'], [['1']]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('a');
    expect(csv).toContain('1');
  });

  it('round-trips quoted csv', () => {
    const csv = buildCsvFromTable(['name'], [['Say "hi"']]);
    const table = parseCsvToTable(csv);
    expect(table.headers).toEqual(['name']);
    expect(table.rows[0][0]).toBe('Say "hi"');
  });
});
