import request from 'supertest';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';

describe('Public system status API (e2e)', () => {
  let app: E2eApp | undefined;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('returns components and active incidents snapshot', async () => {
    const res = await request(app!.getHttpServer()).get(
      '/api/v1/system-status',
    );
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      overall: expect.any(String),
      components: expect.any(Array),
      activeIncidents: expect.any(Array),
    });
    expect(res.body.components.length).toBeGreaterThan(0);
    expect(res.body.components[0]).toMatchObject({
      code: expect.any(String),
      name: expect.any(String),
      status: expect.any(String),
    });
  });
});
