import request from 'supertest';
import { UserRoleCode } from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';
import { registerStaffE2eUser } from './helpers/e2e-auth';

describe('Admin withdrawals API (e2e)', () => {
  let app: E2eApp | undefined;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    if (app) {
      await app.close();
      app = undefined;
    }
  });

  it('GET /api/admin/v1/withdrawals without session returns 401', async () => {
    const res = await request(app!.getHttpServer()).get(
      '/api/admin/v1/withdrawals',
    );
    expect(res.status).toBe(401);
  });

  it('ACCOUNTANT can view withdrawals summary', async () => {
    const { token } = await registerStaffE2eUser(
      app!,
      UserRoleCode.ACCOUNTANT,
      'e2e-withdrawals',
    );
    const res = await request(app!.getHttpServer())
      .get('/api/admin/v1/withdrawals/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      totalWithdrawnUsdt: expect.any(String),
      pendingCount: expect.any(Number),
    });
  });

  it('GET /api/admin/v1/withdrawals/:id returns 404 for unknown id', async () => {
    const { token } = await registerStaffE2eUser(
      app!,
      UserRoleCode.SUPER_ADMIN,
      'e2e-withdrawals-sa',
    );
    const res = await request(app!.getHttpServer())
      .get('/api/admin/v1/withdrawals/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(404);
  });
});
