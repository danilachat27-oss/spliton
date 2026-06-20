import request from 'supertest';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';

describe('Services calculator API (e2e)', () => {
  let app: E2eApp | undefined;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('returns config with fees and limits', async () => {
    const res = await request(app!.getHttpServer()).get(
      '/api/v1/services/calculator/config',
    );
    expect(res.status).toBe(200);
    expect(res.body.fees).toMatchObject({
      primaryPurchaseFeePct: expect.any(String),
      secondaryMarketFeePct: expect.any(String),
      withdrawalFeeFixedUsdt: expect.any(String),
    });
    expect(res.body.limits.minWithdrawalUsdt).toBeTruthy();
    expect(Array.isArray(res.body.releases)).toBe(true);
  });

  it('preview buy scenario uses backend fee math', async () => {
    const res = await request(app!.getHttpServer())
      .post('/api/v1/services/calculator/preview')
      .send({
        scenario: 'buy',
        buyMode: 'usdt',
        amount: '1000',
        pricePerUnit: '10',
      });
    expect(res.status).toBe(201);
    expect(Number(res.body.totalUsdt)).toBe(1000);
    expect(Number(res.body.netUsdt)).toBeLessThan(1000);
    expect(res.body.disclaimer).toContain('не гарант');
  });
});
