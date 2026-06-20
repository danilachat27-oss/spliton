import { aggregateDepthLevels } from './secondary-market-depth.util';

describe('aggregateDepthLevels', () => {
  it('sorts asks ascending and computes cumulative depth', () => {
    const levels = [
      { price: '18.52', units: '10' },
      { price: '18.51', units: '5' },
      { price: '18.518', units: '3' },
    ];
    const out = aggregateDepthLevels(levels, 0.01, 'ask');
    expect(out.length).toBeGreaterThan(0);
    expect(Number(out[0]!.price)).toBeLessThanOrEqual(Number(out[out.length - 1]!.price));
    const last = out[out.length - 1]!;
    expect(Number(last.cumulativeUnits)).toBeGreaterThan(0);
    expect(Number(last.depthPercent)).toBe(100);
  });

  it('sorts bids descending', () => {
    const levels = [
      { price: '18.40', units: '20' },
      { price: '18.44', units: '10' },
    ];
    const out = aggregateDepthLevels(levels, 0.05, 'bid');
    expect(Number(out[0]!.price)).toBeGreaterThanOrEqual(Number(out[out.length - 1]!.price));
  });
});
