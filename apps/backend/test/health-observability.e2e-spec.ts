import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createE2eApp } from './helpers/create-e2e-app';

describe('Health observability (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('GET /health/live returns ok', async () => {
    const res = await request(app.getHttpServer())
      .get('/health/live')
      .expect(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('spliton-backend');
    expect(res.headers['x-request-id']).toBeDefined();
  });

  it('GET /health/ready returns checks', async () => {
    const res = await request(app.getHttpServer())
      .get('/health/ready')
      .expect(200);
    expect(res.body.status).toBe('ok');
    expect(Array.isArray(res.body.checks)).toBe(true);
    const db = res.body.checks.find(
      (c: { name: string }) => c.name === 'database',
    );
    expect(db?.status).toBe('ok');
  });

  it('GET /health/deep hides secrets without token when configured', async () => {
    const prev = process.env.HEALTH_DEEP_TOKEN;
    process.env.HEALTH_DEEP_TOKEN = 'test-deep-token';
    try {
      await request(app.getHttpServer()).get('/health/deep').expect(401);
      const res = await request(app.getHttpServer())
        .get('/health/deep')
        .set('x-health-token', 'test-deep-token')
        .expect(200);
      expect(res.body.status).toBe('ok');
      expect(JSON.stringify(res.body)).not.toMatch(
        /JWT_SECRET|SENTRY_DSN|service_role/i,
      );
      expect(res.body.operations).toBeDefined();
    } finally {
      process.env.HEALTH_DEEP_TOKEN = prev;
    }
  });
});
