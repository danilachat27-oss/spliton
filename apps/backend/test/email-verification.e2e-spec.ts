import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { cleanupEmailVerificationUsers } from './helpers/cleanup-email-verification-users';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';

function emailVerificationEmail(): string {
  return `test-email-verification-${Date.now()}@example.com`;
}

function requireToken(token: string | null): string {
  expect(token).toEqual(expect.any(String));
  return token as string;
}

describe('Email verification (e2e)', () => {
  let app: E2eApp;

  beforeAll(async () => {
    app = await createE2eApp();
  });

  afterAll(async () => {
    await cleanupEmailVerificationUsers();
    await (app as INestApplication).close();
  });

  it('register does not issue tokens; verify then login works', async () => {
    const email = emailVerificationEmail();
    const password = 'TestPwd12!';

    const reg = await request(app.getHttpServer())
      .post('/auth/register')
      .send({ email, password })
      .expect(201);
    expect(reg.body).toEqual({ requiresEmailVerification: true });
    expect(reg.body.tokens).toBeUndefined();

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(403);

    const token = requireToken(app.fakeEmailService.getLatestToken(email));
    await request(app.getHttpServer())
      .post('/auth/email/verify')
      .send({ token })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toEqual({ verified: true });
      });

    await request(app.getHttpServer())
      .post('/auth/email/verify')
      .send({ token })
      .expect(401);

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);
    expect(login.body.tokens?.accessToken).toEqual(expect.any(String));
  });
});
