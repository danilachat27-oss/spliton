import request from 'supertest';

import { createE2eApp, E2eApp } from './helpers/create-e2e-app';

import { registerE2eUser } from './helpers/register-e2e-user';



function uniqueEmail(prefix: string): string {

  return `${prefix}-${Date.now()}@example.com`;

}



describe('User profile API (e2e)', () => {

  let app: E2eApp | undefined;



  beforeEach(async () => {

    app = await createE2eApp();

  });



  afterEach(async () => {

    if (app) await app.close();

  });



  it('returns 401 without auth for GET /users/me', async () => {

    const res = await request(app!.getHttpServer()).get('/users/me');

    expect(res.status).toBe(401);

  });



  it('returns profile with accountCenter for authenticated user', async () => {

    const email = uniqueEmail('profile-me');

    const { token } = await registerE2eUser(app!, email);



    const res = await request(app!.getHttpServer())

      .get('/users/me')

      .set('Authorization', `Bearer ${token}`);



    expect(res.status).toBe(200);

    expect(res.body.email).toBe(email);

    expect(res.body.id).toBeDefined();

    expect(res.body.security).toBeDefined();

    expect(res.body.accountCenter).toBeDefined();

    expect(res.body.accountCenter.security.score).toBeGreaterThanOrEqual(0);

    expect(res.body.accountCenter.accountCompleteness.maxScore).toBeGreaterThan(0);

    expect(res.body.accountCenter.verification.status).toBe('NOT_STARTED');

    expect(Array.isArray(res.body.accountCenter.recentSecurityEvents)).toBe(true);

  });



  it('GET /api/v1/me/account-center returns same summary shape', async () => {

    const email = uniqueEmail('profile-center');

    const { token } = await registerE2eUser(app!, email);



    const res = await request(app!.getHttpServer())

      .get('/api/v1/me/account-center')

      .set('Authorization', `Bearer ${token}`);



    expect(res.status).toBe(200);

    expect(res.body.security).toBeDefined();

    expect(res.body.legal).toBeDefined();

    expect(res.body.activity).toBeDefined();

  });



  it('updates preferences', async () => {

    const email = uniqueEmail('profile-prefs');

    const { token } = await registerE2eUser(app!, email);



    const patch = await request(app!.getHttpServer())

      .patch('/users/me/preferences')

      .set('Authorization', `Bearer ${token}`)

      .send({ displayName: 'Spliton User', timezone: 'Europe/Moscow' });



    expect(patch.status).toBe(200);

    expect(patch.body.profile.displayName).toBe('Spliton User');



    const me = await request(app!.getHttpServer())

      .get('/users/me')

      .set('Authorization', `Bearer ${token}`);



    expect(me.body.profile.displayName).toBe('Spliton User');

  });



  it('changes password with current password and rejects wrong current password', async () => {

    const email = uniqueEmail('profile-pwd');

    const { token, password } = await registerE2eUser(app!, email);



    const bad = await request(app!.getHttpServer())

      .patch('/api/v1/me/password')

      .set('Authorization', `Bearer ${token}`)

      .send({ currentPassword: 'wrong-password', newPassword: 'NewPassword2!' });



    expect(bad.status).toBe(401);



    const ok = await request(app!.getHttpServer())

      .patch('/api/v1/me/password')

      .set('Authorization', `Bearer ${token}`)

      .send({ currentPassword: password, newPassword: 'NewPassword2!' });



    expect(ok.status).toBe(200);

    expect(ok.body.ok).toBe(true);



    const me = await request(app!.getHttpServer())

      .get('/users/me')

      .set('Authorization', `Bearer ${token}`);



    expect(me.body.accountCenter.security.passwordChangedAt).toBeTruthy();

  });



  it('logout-all via /api/v1/me/logout-all creates auth audit event', async () => {

    const email = uniqueEmail('profile-logout-all');

    const { token } = await registerE2eUser(app!, email);



    const logout = await request(app!.getHttpServer())

      .post('/api/v1/me/logout-all')

      .set('Authorization', `Bearer ${token}`);



    expect(logout.status).toBe(201);



    const events = await request(app!.getHttpServer())

      .get('/api/v1/me/security-events')

      .set('Authorization', `Bearer ${token}`);



    expect(events.status).toBe(200);

    expect(

      events.body.items.some((item: { action: string }) => item.action === 'LOGOUT_ALL'),

    ).toBe(true);

  });



  it('patches security preferences', async () => {

    const email = uniqueEmail('profile-sec-prefs');

    const { token } = await registerE2eUser(app!, email);



    const patch = await request(app!.getHttpServer())

      .patch('/api/v1/me/security-preferences')

      .set('Authorization', `Bearer ${token}`)

      .send({ withdrawalEmailConfirmationEnabled: true });



    expect(patch.status).toBe(200);

    expect(patch.body.withdrawalEmailConfirmationEnabled).toBe(true);



    const me = await request(app!.getHttpServer())

      .get('/users/me')

      .set('Authorization', `Bearer ${token}`);



    expect(

      me.body.accountCenter.securityPreferences.withdrawalEmailConfirmationEnabled,

    ).toBe(true);

  });



  it('returns KYC not_started for new user', async () => {

    const email = uniqueEmail('profile-kyc');

    const { token } = await registerE2eUser(app!, email);



    const res = await request(app!.getHttpServer())

      .get('/api/v1/kyc/status')

      .set('Authorization', `Bearer ${token}`);



    expect(res.status).toBe(200);

    expect(res.body.status).toBe('NOT_STARTED');

  });



  it('returns 401 without auth for KYC status', async () => {

    const res = await request(app!.getHttpServer()).get('/api/v1/kyc/status');

    expect(res.status).toBe(401);

  });

});


