import { generateSync } from 'otplib';
import request from 'supertest';
import { cleanupTwoFactorRegressionUsers } from './helpers/cleanup-two-factor-regression-users';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';

function twoFaEmail(): string {
  return `test-2fa-regression-${Date.now()}@example.com`;
}

function totpSecretFromOtpauthUrl(otpauthUrl: string): string {
  const parsed = new URL(otpauthUrl.replace(/^otpauth:\/\//i, 'http://'));
  const secret = parsed.searchParams.get('secret');
  if (!secret) {
    throw new Error('otpauthUrl missing secret');
  }
  return secret;
}

function totpCode(secret: string): string {
  return generateSync({ secret, period: 30 });
}

function requireToken(token: string | null): string {
  expect(token).toEqual(expect.any(String));
  return token as string;
}

async function registerVerifyAndLogin(params: {
  app: E2eApp;
  email: string;
  password: string;
}): Promise<{ accessToken: string }> {
  await request(params.app.getHttpServer())
    .post('/auth/register')
    .send({
      email: params.email,
      password: params.password,
      displayName: '2FA',
    })
    .expect(201)
    .expect(({ body }) => {
      expect(body).toEqual({ requiresEmailVerification: true });
    });

  const verifyToken = requireToken(
    params.app.fakeEmailService.getLatestToken(params.email),
  );
  await request(params.app.getHttpServer())
    .post('/auth/email/verify')
    .send({ token: verifyToken })
    .expect(201);

  const login = await request(params.app.getHttpServer())
    .post('/auth/login')
    .send({ email: params.email, password: params.password })
    .expect(201);
  return { accessToken: login.body.tokens.accessToken as string };
}

describe('Two-factor auth (e2e)', () => {
  /** Set in `beforeEach`; closed in `afterEach`. */
  let app: E2eApp | undefined;

  /** Fresh Nest app per test: long single-app runs were intermittently tripping register (500) after heavy 2FA flows. */
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
    await cleanupTwoFactorRegressionUsers();
  });

  it('A: POST /auth/2fa/setup without JWT -> 401', async () => {
    await request(app!.getHttpServer()).post('/auth/2fa/setup').expect(401);
  });

  it('B: setup + verify-setup (wrong then valid TOTP, backup codes once)', async () => {
    const email = twoFaEmail();
    const password = 'TestPwd12!';
    const { accessToken } = await registerVerifyAndLogin({
      app: app!,
      email,
      password,
    });

    const setup = await request(app!.getHttpServer())
      .post('/auth/2fa/setup')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(setup.body).toMatchObject({
      methodId: expect.any(String),
      otpauthUrl: expect.stringMatching(/^otpauth:\/\//),
    });

    await request(app!.getHttpServer())
      .post('/auth/2fa/verify-setup')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: '000000' })
      .expect(401);

    const secret = totpSecretFromOtpauthUrl(setup.body.otpauthUrl as string);
    const code = totpCode(secret);

    const verified = await request(app!.getHttpServer())
      .post('/auth/2fa/verify-setup')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code })
      .expect(201);

    expect(verified.body).toMatchObject({ enabled: true });
    const backupCodes = verified.body.backupCodes as string[];
    expect(Array.isArray(backupCodes)).toBe(true);
    expect(backupCodes.length).toBeGreaterThan(0);
    backupCodes.forEach((c) => expect(c).toEqual(expect.any(String)));

    const me = await request(app!.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(JSON.stringify(me.body)).not.toMatch(/backupCodes/i);
  });

  it('C: login with 2FA enabled returns challenge, no tokens', async () => {
    const email = twoFaEmail();
    const password = 'TestPwd12!';
    const { accessToken } = await registerVerifyAndLogin({
      app: app!,
      email,
      password,
    });

    const setup = await request(app!.getHttpServer())
      .post('/auth/2fa/setup')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);
    const secret = totpSecretFromOtpauthUrl(setup.body.otpauthUrl as string);
    const code = totpCode(secret);
    await request(app!.getHttpServer())
      .post('/auth/2fa/verify-setup')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code })
      .expect(201);

    const login = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);

    expect(login.body).toMatchObject({
      requires2fa: true,
      challengeId: expect.any(String),
      availableMethods: ['totp', 'backup_code'],
    });
    expect(login.body.tokens).toBeUndefined();
    expect(login.body.accessToken).toBeUndefined();
    expect(login.body.refreshToken).toBeUndefined();
  });

  it('D: verify challenge with TOTP issues tokens; /users/me works', async () => {
    const email = twoFaEmail();
    const password = 'TestPwd12!';
    const { accessToken } = await registerVerifyAndLogin({
      app: app!,
      email,
      password,
    });

    const setup = await request(app!.getHttpServer())
      .post('/auth/2fa/setup')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);
    const secret = totpSecretFromOtpauthUrl(setup.body.otpauthUrl as string);
    await request(app!.getHttpServer())
      .post('/auth/2fa/verify-setup')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: totpCode(secret) })
      .expect(201);

    const login = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);
    const challengeId = login.body.challengeId as string;

    const verify = await request(app!.getHttpServer())
      .post('/auth/2fa/verify')
      .send({
        challengeId,
        code: totpCode(secret),
        method: 'totp',
      })
      .expect(201);

    expect(verify.body.user?.id).toEqual(expect.any(String));
    expect(verify.body.tokens?.accessToken).toEqual(expect.any(String));
    expect(verify.body.tokens?.refreshToken).toEqual(expect.any(String));

    await request(app!.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${verify.body.tokens.accessToken}`)
      .expect(200);
  });

  it('E: invalid codes increment attempts; after limit challenge no longer succeeds', async () => {
    const email = twoFaEmail();
    const password = 'TestPwd12!';
    const { accessToken } = await registerVerifyAndLogin({
      app: app!,
      email,
      password,
    });

    const setup = await request(app!.getHttpServer())
      .post('/auth/2fa/setup')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);
    const secret = totpSecretFromOtpauthUrl(setup.body.otpauthUrl as string);
    await request(app!.getHttpServer())
      .post('/auth/2fa/verify-setup')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: totpCode(secret) })
      .expect(201);

    const login = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);
    const challengeId = login.body.challengeId as string;

    for (let i = 0; i < 5; i += 1) {
      await request(app!.getHttpServer())
        .post('/auth/2fa/verify')
        .send({ challengeId, code: '000000', method: 'totp' })
        .expect(401);
    }

    await request(app!.getHttpServer())
      .post('/auth/2fa/verify')
      .send({
        challengeId,
        code: totpCode(secret),
        method: 'totp',
      })
      .expect(401);
  });

  it('F: backup code succeeds once; reuse with new challenge -> 401', async () => {
    const email = twoFaEmail();
    const password = 'TestPwd12!';
    const { accessToken } = await registerVerifyAndLogin({
      app: app!,
      email,
      password,
    });

    const setup = await request(app!.getHttpServer())
      .post('/auth/2fa/setup')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);
    const secret = totpSecretFromOtpauthUrl(setup.body.otpauthUrl as string);
    const verified = await request(app!.getHttpServer())
      .post('/auth/2fa/verify-setup')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: totpCode(secret) })
      .expect(201);
    const backupCode = (verified.body.backupCodes as string[])[0];

    const login1 = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);
    const ch1 = login1.body.challengeId as string;

    const v1 = await request(app!.getHttpServer())
      .post('/auth/2fa/verify')
      .send({ challengeId: ch1, code: backupCode, method: 'backup_code' })
      .expect(201);
    expect(v1.body.tokens?.accessToken).toEqual(expect.any(String));

    const login2 = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);
    const ch2 = login2.body.challengeId as string;

    await request(app!.getHttpServer())
      .post('/auth/2fa/verify')
      .send({ challengeId: ch2, code: backupCode, method: 'backup_code' })
      .expect(401);
  });

  it('G: disable 2FA — wrong password 401; password + TOTP success; login issues tokens', async () => {
    const email = twoFaEmail();
    const password = 'TestPwd12!';
    let accessToken = (
      await registerVerifyAndLogin({
        app: app!,
        email,
        password,
      })
    ).accessToken;

    const setup = await request(app!.getHttpServer())
      .post('/auth/2fa/setup')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);
    const secret = totpSecretFromOtpauthUrl(setup.body.otpauthUrl as string);
    await request(app!.getHttpServer())
      .post('/auth/2fa/verify-setup')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: totpCode(secret) })
      .expect(201);

    await request(app!.getHttpServer())
      .post('/auth/2fa/disable')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        password: 'WrongPwd12!',
        code: totpCode(secret),
        method: 'totp',
      })
      .expect(401);

    await request(app!.getHttpServer())
      .post('/auth/2fa/disable')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        password,
        code: totpCode(secret),
        method: 'totp',
      })
      .expect(201);

    const direct = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);
    expect(direct.body.requires2fa).toBeUndefined();
    expect(direct.body.tokens?.accessToken).toEqual(expect.any(String));
    accessToken = direct.body.tokens.accessToken;
    await request(app!.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
  });

  it('H: regenerate backup codes invalidates old unused codes', async () => {
    const email = twoFaEmail();
    const password = 'TestPwd12!';
    const { accessToken } = await registerVerifyAndLogin({
      app: app!,
      email,
      password,
    });

    const setup = await request(app!.getHttpServer())
      .post('/auth/2fa/setup')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);
    const secret = totpSecretFromOtpauthUrl(setup.body.otpauthUrl as string);
    const verified = await request(app!.getHttpServer())
      .post('/auth/2fa/verify-setup')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: totpCode(secret) })
      .expect(201);
    const oldUnused = (verified.body.backupCodes as string[])[1];

    const regen = await request(app!.getHttpServer())
      .post('/auth/2fa/recovery-codes/regenerate')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: totpCode(secret) })
      .expect(201);
    expect((regen.body.backupCodes as string[]).length).toBeGreaterThan(0);

    const login = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(201);
    const challengeId = login.body.challengeId as string;

    await request(app!.getHttpServer())
      .post('/auth/2fa/verify')
      .send({
        challengeId,
        code: oldUnused,
        method: 'backup_code',
      })
      .expect(401);
  });

  it('setup when TOTP already enabled -> 409', async () => {
    const email = twoFaEmail();
    const password = 'TestPwd12!';
    const { accessToken } = await registerVerifyAndLogin({
      app: app!,
      email,
      password,
    });

    const setup = await request(app!.getHttpServer())
      .post('/auth/2fa/setup')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);
    const secret = totpSecretFromOtpauthUrl(setup.body.otpauthUrl as string);
    await request(app!.getHttpServer())
      .post('/auth/2fa/verify-setup')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ code: totpCode(secret) })
      .expect(201);

    await request(app!.getHttpServer())
      .post('/auth/2fa/setup')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(409);
  });
});
