import request from 'supertest';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';
import { registerE2eUser } from './helpers/register-e2e-user';

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}@example.com`;
}

describe('Portfolio metrics API (e2e)', () => {
  let app: E2eApp | undefined;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('returns empty metrics overview for user without positions', async () => {
    const email = uniqueEmail('metrics-empty');
    const { token } = await registerE2eUser(app!, email);

    const res = await request(app!.getHttpServer())
      .get('/api/v1/portfolio/metrics/overview')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.overview.activePositions).toBe(0);
    expect(res.body.overview.portfolioValueUsdt).toBe('0.00');
    expect(res.body.performance.pnl30dPct).toBeNull();
  });

  it('returns 401 for metrics without auth', async () => {
    const res = await request(app!.getHttpServer()).get(
      '/api/v1/portfolio/metrics/overview',
    );
    expect(res.status).toBe(401);
  });

  it('returns paginated empty positions for metrics/positions', async () => {
    const email = uniqueEmail('metrics-pos');
    const { token } = await registerE2eUser(app!, email);

    const res = await request(app!.getHttpServer())
      .get('/api/v1/portfolio/metrics/positions?page=1&limit=10')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items).toEqual([]);
    expect(res.body.total).toBe(0);
    expect(res.body.page).toBe(1);
    expect(res.body.limit).toBe(10);
  });

  it('returns 400 for invalid sort key on metrics/positions', async () => {
    const email = uniqueEmail('metrics-bad-sort');
    const { token } = await registerE2eUser(app!, email);

    const res = await request(app!.getHttpServer())
      .get('/api/v1/portfolio/metrics/positions?sort=invalid')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(400);
  });
});
