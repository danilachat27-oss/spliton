import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { cleanupAuthRegressionUsers } from './helpers/cleanup-auth-regression-users';
import { createE2eApp } from './helpers/create-e2e-app';

function regressionEmail(): string {
  return `test-auth-regression-${Date.now()}@example.com`;
}

function assertNoPasswordLeak(payload: unknown): void {
  const raw = JSON.stringify(payload);
  expect(raw.toLowerCase()).not.toContain('password_hash');
  expect(raw).not.toContain('passwordHash');
}

function assertAuthShape(body: {
  user: { id: string; email: string; roles: string[] };
  tokens: { accessToken: string; refreshToken: string };
}): void {
  expect(body.user).toMatchObject({
    id: expect.any(String),
    email: expect.any(String),
    roles: expect.any(Array),
  });
  expect(body.tokens?.accessToken).toEqual(expect.any(String));
  expect(body.tokens?.refreshToken).toEqual(expect.any(String));
  assertNoPasswordLeak(body);
}

describe('Auth regression (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(async () => {
    await cleanupAuthRegressionUsers();
    if (app) {
      await app.close();
    }
  });

  it('H: GET /health -> 200', async () => {
    const res = await request(app.getHttpServer()).get('/health').expect(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      service: 'spliton-backend',
    });
  });

  it('H: GET /health/db -> 200', async () => {
    const res = await request(app.getHttpServer())
      .get('/health/db')
      .expect(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'connected' });
  });

  it('H: GET /releases -> 200', async () => {
    await request(app.getHttpServer()).get('/releases').expect(200);
  });

  it('A–E: register, duplicate, login, me, refresh rotation', async () => {
    const email = regressionEmail();
    const password = 'TestPwd12!';

    const reg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password, displayName: 'Regression' })
      .expect(201);

    assertAuthShape(reg.body);
    expect(reg.body.user.email).toBe(email.toLowerCase());

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(409);

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'WrongPwd12!' })
      .expect(401);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    assertAuthShape(login.body);
    const { accessToken, refreshToken } = login.body.tokens;

    await request(app.getHttpServer()).get('/users/me').expect(401);

    const me = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    assertNoPasswordLeak(me.body);
    expect(me.body.email).toBe(email.toLowerCase());

    const refreshed = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(201);

    assertAuthShape(refreshed.body);
    const access2 = refreshed.body.tokens.accessToken as string;
    const refresh2 = refreshed.body.tokens.refreshToken as string;
    expect(refresh2).not.toBe(refreshToken);
    expect(access2).not.toBe(accessToken);

    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${access2}`)
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: refresh2 })
      .expect(401);
  });

  it('F: logout current session invalidates refresh and access', async () => {
    const email = regressionEmail();
    const password = 'TestPwd12!';

    const reg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);

    const accessToken = reg.body.tokens.accessToken as string;
    const refreshToken = reg.body.tokens.refreshToken as string;

    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken })
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(401);

    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);
  });

  it('G: logout-all revokes every session', async () => {
    const email = regressionEmail();
    const password = 'TestPwd12!';

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);

    const login1 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    const login2 = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    const access1 = login1.body.tokens.accessToken as string;
    const refresh1 = login1.body.tokens.refreshToken as string;
    const access2 = login2.body.tokens.accessToken as string;
    const refresh2 = login2.body.tokens.refreshToken as string;

    await request(app.getHttpServer())
      .post('/auth/logout-all')
      .set('Authorization', `Bearer ${access1}`)
      .expect(201);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: refresh1 })
      .expect(401);
    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: refresh2 })
      .expect(401);

    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${access1}`)
      .expect(401);

    await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${access2}`)
      .expect(401);
  });
});
