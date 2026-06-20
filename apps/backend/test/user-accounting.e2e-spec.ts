import request from 'supertest';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';
import { registerE2eUser } from './helpers/register-e2e-user';

function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}@example.com`;
}

describe('User accounting statements API (e2e)', () => {
  let app: E2eApp | undefined;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('returns 401 without auth', async () => {
    const res = await request(app!.getHttpServer()).get('/api/v1/accounting/statements');
    expect(res.status).toBe(401);
  });

  it('lists statement kinds and queues request for current user', async () => {
    const user = await registerE2eUser(app!, uniqueEmail('statements'));
    const auth = { Authorization: `Bearer ${user.token}` };

    const kinds = await request(app!.getHttpServer())
      .get('/api/v1/accounting/statements')
      .set(auth);
    expect(kinds.status).toBe(200);
    expect(kinds.body.items.length).toBeGreaterThan(0);
    expect(kinds.body.items[0]).toMatchObject({
      kind: expect.any(String),
      label: expect.any(String),
      disclaimer: expect.any(String),
    });

    const kind = kinds.body.items[0].kind as string;
    const queued = await request(app!.getHttpServer())
      .post('/api/v1/accounting/statements/request')
      .set(auth)
      .send({ kind });
    expect(queued.status).toBe(201);
    expect(queued.body).toMatchObject({
      id: expect.any(String),
      kind,
      status: 'queued',
    });
  });

  it('completes statement job and allows owner download', async () => {
    const user = await registerE2eUser(app!, uniqueEmail('statements-dl'));
    const auth = { Authorization: `Bearer ${user.token}` };

    const kinds = await request(app!.getHttpServer())
      .get('/api/v1/accounting/statements')
      .set(auth);
    const kind = kinds.body.items[0].kind as string;
    const queued = await request(app!.getHttpServer())
      .post('/api/v1/accounting/statements/request')
      .set(auth)
      .send({ kind });
    expect(queued.status).toBe(201);
    const docId = queued.body.id as string;

    let status = 'queued';
    for (let i = 0; i < 40; i++) {
      const res = await request(app!.getHttpServer())
        .get(`/api/v1/accounting/statements/requests/${docId}`)
        .set(auth);
      status = res.body.status as string;
      if (status === 'completed' || status === 'failed') break;
      await new Promise((r) => setTimeout(r, 150));
    }
    expect(status).toBe('completed');

    const download = await request(app!.getHttpServer())
      .get(`/api/v1/documents/${docId}/download`)
      .set(auth);
    expect(download.status).toBe(200);
    expect(download.body.mimeType).toBe('application/pdf');
    expect(download.body.contentBase64).toEqual(expect.any(String));
    const pdf = Buffer.from(download.body.contentBase64 as string, 'base64');
    expect(pdf.subarray(0, 5).toString('ascii')).toBe('%PDF-');
  });

  it('returns 400 for unknown statement kind', async () => {
    const user = await registerE2eUser(app!, uniqueEmail('statements-bad'));
    const res = await request(app!.getHttpServer())
      .post('/api/v1/accounting/statements/request')
      .set({ Authorization: `Bearer ${user.token}` })
      .send({ kind: 'invalid_kind' });
    expect(res.status).toBe(400);
  });
});
