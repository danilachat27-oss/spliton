import request from 'supertest';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';
import { registerE2eUser } from './helpers/register-e2e-user';

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}@example.com`;
}

describe('Portfolio payouts API (e2e)', () => {
  let app: E2eApp | undefined;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('returns 401 without auth for payouts overview', async () => {
    const res = await request(app!.getHttpServer()).get(
      '/api/v1/portfolio/payouts/overview',
    );
    expect(res.status).toBe(401);
  });

  it('returns empty payouts overview for new user', async () => {
    const email = uniqueEmail('payouts-overview');
    const { token } = await registerE2eUser(app!, email);

    const res = await request(app!.getHttpServer())
      .get('/api/v1/portfolio/payouts/overview')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.totalAccruedUsdt).toBe('0.00');
    expect(res.body.totalPaidUsdt).toBe('0.00');
    expect(res.body.pendingPayoutUsdt).toBe('0.00');
    expect(res.body.availableBalance).toBeDefined();
  });

  it('returns insufficient data for payouts compare when user has no activity', async () => {
    const email = uniqueEmail('payouts-compare');
    const { token } = await registerE2eUser(app!, email);

    const res = await request(app!.getHttpServer())
      .get('/api/v1/portfolio/payouts/compare?window=30d')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.emptyReason).toBe('INSUFFICIENT_DATA');
  });

  it('returns paginated payouts history for new user', async () => {
    const email = uniqueEmail('payouts-history');
    const { token } = await registerE2eUser(app!, email);

    const res = await request(app!.getHttpServer())
      .get('/api/v1/portfolio/payouts/history?page=1&limit=20')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
    expect(res.body.page).toBe(1);
  });
});
