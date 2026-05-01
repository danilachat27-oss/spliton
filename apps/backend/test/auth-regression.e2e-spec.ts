import request from 'supertest';
import { cleanupAuthRegressionUsers } from './helpers/cleanup-auth-regression-users';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';

function regressionEmail(): string {
  return `test-auth-regression-${Date.now()}@example.com`;
}

function requireToken(token: string | null): string {
  expect(token).toEqual(expect.any(String));
  return token as string;
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

  afterAll(async () => {
    await cleanupAuthRegressionUsers();
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

  it('A–E: register -> verify -> login -> me -> refresh rotation', async () => {
    const email = regressionEmail();
    const password = 'TestPwd12!';

    const reg = await request(app!.getHttpServer())
      .post('/auth/register')
      .send({ email, password, displayName: 'Regression' })
      .expect(201);

    expect(reg.body).toEqual({ requiresEmailVerification: true });
    assertNoPasswordLeak(reg.body);

    await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(403)
      .expect(({ body }) => {
        expect(body.message).toMatchObject({
          code: 'EMAIL_NOT_VERIFIED',
          message: 'Email verification required',
        });
      });

    await request(app!.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(409);

    await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'WrongPwd12!' })
      .expect(401);

    const token = requireToken(app!.fakeEmailService.getLatestToken(email));
    await request(app!.getHttpServer())
      .post('/auth/email/verify')
      .send({ token })
      .expect(201)
      .expect(({ body }) => expect(body).toEqual({ verified: true }));

    const login = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    assertAuthShape(login.body);
    const { accessToken, refreshToken } = login.body.tokens;

    await request(app!.getHttpServer()).get('/users/me').expect(401);

    const me = await request(app!.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    assertNoPasswordLeak(me.body);
    expect(me.body.email).toBe(email.toLowerCase());

    const refreshed = await request(app!.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(201);

    assertAuthShape(refreshed.body);
    const access2 = refreshed.body.tokens.accessToken as string;
    const refresh2 = refreshed.body.tokens.refreshToken as string;
    expect(refresh2).not.toBe(refreshToken);
    expect(access2).not.toBe(accessToken);

    await request(app!.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${access2}`)
      .expect(200);

    await request(app!.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(401);

    await request(app!.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: refresh2 })
      .expect(401);
  });

  it('F: resend anti-enumeration and token rotation', async () => {
    const email = regressionEmail();
    const password = 'TestPwd12!';

    await request(app!.getHttpServer())
      .post('/auth/email/resend')
      .send({ email: 'unknown-email@example.com' })
      .expect(201)
      .expect(({ body }) => expect(body).toEqual({ success: true }));

    await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);

    const oldToken = requireToken(app!.fakeEmailService.getLatestToken(email));

    await request(app!.getHttpServer())
      .post('/auth/email/resend')
      .send({ email })
      .expect(201)
      .expect(({ body }) => expect(body).toEqual({ success: true }));

    const newToken = requireToken(app!.fakeEmailService.getLatestToken(email));
    expect(newToken).not.toBe(oldToken);

    await request(app!.getHttpServer())
      .post('/auth/email/verify')
      .send({ token: oldToken })
      .expect(401);

    await request(app!.getHttpServer())
      .post('/auth/email/verify')
      .send({ token: newToken })
      .expect(201);
  });

  it('G: invalid token and used token are rejected', async () => {
    const email = regressionEmail();
    const password = 'TestPwd12!';

    await request(app!.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);

    await request(app!.getHttpServer())
      .post('/auth/email/verify')
      .send({ token: 'x'.repeat(32) })
      .expect(401);

    const token = requireToken(app!.fakeEmailService.getLatestToken(email));
    await request(app!.getHttpServer())
      .post('/auth/email/verify')
      .send({ token })
      .expect(201);
    await request(app!.getHttpServer())
      .post('/auth/email/verify')
      .send({ token })
      .expect(401);
  });

  it('H: logout current session invalidates refresh and access', async () => {
    const email = regressionEmail();
    const password = 'TestPwd12!';

    await request(app!.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);
    const token = requireToken(app!.fakeEmailService.getLatestToken(email));
    await request(app!.getHttpServer())
      .post('/auth/email/verify')
      .send({ token })
      .expect(201);

    const login = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    const accessToken = login.body.tokens.accessToken as string;
    const refreshToken = login.body.tokens.refreshToken as string;

    await request(app!.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken })
      .expect(201);

    await request(app!.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken })
      .expect(401);

    await request(app!.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(401);
  });

  it('I: logout-all revokes every session', async () => {
    const email = regressionEmail();
    const password = 'TestPwd12!';

    await request(app!.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);
    const token = requireToken(app!.fakeEmailService.getLatestToken(email));
    await request(app!.getHttpServer())
      .post('/auth/email/verify')
      .send({ token })
      .expect(201);

    const login1 = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    const login2 = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    const access1 = login1.body.tokens.accessToken as string;
    const refresh1 = login1.body.tokens.refreshToken as string;
    const access2 = login2.body.tokens.accessToken as string;
    const refresh2 = login2.body.tokens.refreshToken as string;

    await request(app!.getHttpServer())
      .post('/auth/logout-all')
      .set('Authorization', `Bearer ${access1}`)
      .expect(201);

    await request(app!.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: refresh1 })
      .expect(401);
    await request(app!.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: refresh2 })
      .expect(401);

    await request(app!.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${access1}`)
      .expect(401);

    await request(app!.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${access2}`)
      .expect(401);
  });
});
