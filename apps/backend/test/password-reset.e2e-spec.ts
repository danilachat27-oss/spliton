import request from 'supertest';
import { e2eRegisterPayload } from './helpers/register-e2e-user';
import { PrismaClient, UserStatus } from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';

function uniqueEmail(): string {
  return `pwd-reset-${Date.now()}@example.com`;
}

function requireToken(token: string | null): string {
  expect(token).toEqual(expect.any(String));
  return token as string;
}

describe('Password reset (e2e)', () => {
  let app: E2eApp | undefined;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  async function registerActiveUser(email: string) {
    const password = 'OldPass123!';
    await request(app!.getHttpServer())
      .post('/auth/register')
      .send(e2eRegisterPayload(email, password))
      .expect(201);

    const prisma = new PrismaClient();
    await prisma.user.update({
      where: { email },
      data: { status: UserStatus.ACTIVE, emailVerifiedAt: new Date() },
    });
    await prisma.$disconnect();
    return password;
  }

  it('forgot password returns generic success; reset changes password', async () => {
    const email = uniqueEmail();
    const oldPassword = await registerActiveUser(email);

    const forgot = await request(app!.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email });
    expect(forgot.status).toBe(201);
    expect(forgot.body).toEqual({ success: true });

    const unknown = await request(app!.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: 'nobody@example.com' });
    expect(unknown.status).toBe(201);
    expect(unknown.body).toEqual({ success: true });

    const token = requireToken(
      app!.fakeEmailService.getLatestResetToken(email),
    );
    const newPassword = 'NewPass456!';

    await request(app!.getHttpServer())
      .post('/auth/reset-password')
      .send({ token, password: newPassword })
      .expect(201)
      .expect(({ body }) => {
        expect(body).toEqual({ success: true });
      });

    await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password: oldPassword })
      .expect(401);

    const login = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password: newPassword });
    expect([200, 201]).toContain(login.status);
  });

  it('rejects reused reset token', async () => {
    const email = uniqueEmail();
    await registerActiveUser(email);

    await request(app!.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email })
      .expect(201);

    const token = requireToken(
      app!.fakeEmailService.getLatestResetToken(email),
    );
    await request(app!.getHttpServer())
      .post('/auth/reset-password')
      .send({ token, password: 'AnotherPass1!' })
      .expect(201);

    await request(app!.getHttpServer())
      .post('/auth/reset-password')
      .send({ token, password: 'ThirdPass12!' })
      .expect(401);
  });
});
