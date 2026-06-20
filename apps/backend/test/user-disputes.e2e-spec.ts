import request from 'supertest';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';
import { registerE2eUser } from './helpers/register-e2e-user';

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}@example.com`;
}

describe('User disputes API (e2e)', () => {
  let app: E2eApp | undefined;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('returns 401 without auth', async () => {
    const res = await request(app!.getHttpServer()).get('/api/v1/disputes');
    expect(res.status).toBe(401);
  });

  it('returns 400 for invalid dispute payload', async () => {
    const user = await registerE2eUser(app!, uniqueEmail('disputes-bad'));
    const auth = { Authorization: `Bearer ${user.token}` };

    const badType = await request(app!.getHttpServer())
      .post('/api/v1/disputes')
      .set(auth)
      .send({
        type: 'not_a_real_type',
        subject: 'x',
        description: 'too short',
      });
    expect(badType.status).toBe(400);

    const shortSubject = await request(app!.getHttpServer())
      .post('/api/v1/disputes')
      .set(auth)
      .send({
        type: 'other',
        subject: 'ab',
        description: 'Valid description length for dispute',
      });
    expect(shortSubject.status).toBe(400);

    const created = await request(app!.getHttpServer())
      .post('/api/v1/disputes')
      .set(auth)
      .send({
        type: 'other',
        subject: 'Valid subject',
        description: 'Valid description for dispute message test',
      });
    expect(created.status).toBe(201);

    const longMessage = await request(app!.getHttpServer())
      .post(`/api/v1/disputes/${created.body.id}/messages`)
      .set(auth)
      .send({ body: 'x'.repeat(6000) });
    expect(longMessage.status).toBe(400);
  });

  it('creates dispute, lists own disputes, blocks other user access', async () => {
    const userA = await registerE2eUser(app!, uniqueEmail('disputes-a'));
    const userB = await registerE2eUser(app!, uniqueEmail('disputes-b'));
    const authA = { Authorization: `Bearer ${userA.token}` };

    const created = await request(app!.getHttpServer())
      .post('/api/v1/disputes')
      .set(authA)
      .send({
        type: 'deposit_not_credited',
        subject: 'Deposit missing',
        description: 'My deposit was not credited after 2 hours',
      });
    expect(created.status).toBe(201);
    const disputeId = created.body.id as string;
    expect(created.body.type).toBe('deposit_not_credited');

    const list = await request(app!.getHttpServer()).get('/api/v1/disputes').set(authA);
    expect(list.status).toBe(200);
    expect(list.body.items.some((d: { id: string }) => d.id === disputeId)).toBe(true);

    const forbidden = await request(app!.getHttpServer())
      .get(`/api/v1/disputes/${disputeId}`)
      .set({ Authorization: `Bearer ${userB.token}` });
    expect(forbidden.status).toBe(404);

    const detail = await request(app!.getHttpServer())
      .get(`/api/v1/disputes/${disputeId}`)
      .set(authA);
    expect(detail.status).toBe(200);
    expect(detail.body.messages.length).toBeGreaterThan(0);

    await request(app!.getHttpServer())
      .post(`/api/v1/disputes/${disputeId}/messages`)
      .set(authA)
      .send({ body: 'Additional context from user' })
      .expect(201);
  });
});
