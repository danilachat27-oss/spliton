import request from 'supertest';
import { e2eRegisterPayload } from './helpers/register-e2e-user';
import { PrismaClient, UserRoleCode, UserStatus } from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';
import { e2eEmail } from './helpers/e2e-unique';

function staffEmail(prefix: string): string {
  return e2eEmail(`e2e-pr-${prefix}`);
}

async function registerUser(app: E2eApp, email: string) {
  const password = 'TestPass123!';
  const reg = await request(app.getHttpServer())
    .post('/auth/register')
    .send(e2eRegisterPayload(email, password, 'E2E PR'));
  expect(reg.status).toBe(201);

  const prisma = new PrismaClient();
  await prisma.user.updateMany({
    where: { email },
    data: { status: UserStatus.ACTIVE, emailVerifiedAt: new Date() },
  });
  await prisma.$disconnect();

  const login = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password });
  expect([200, 201]).toContain(login.status);
  return login.body.tokens.accessToken as string;
}

async function assignRole(email: string, roleCode: UserRoleCode) {
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({ where: { email } });
  const role = await prisma.role.findUnique({ where: { code: roleCode } });
  if (user && role) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      create: { userId: user.id, roleId: role.id },
      update: {},
    });
  }
  await prisma.$disconnect();
}

async function staffToken(app: E2eApp, role: UserRoleCode): Promise<string> {
  const email = staffEmail(role.toLowerCase());
  await registerUser(app, email);
  await assignRole(email, role);
  const login = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password: 'TestPass123!' });
  return login.body.tokens.accessToken as string;
}

describe('Admin payment requisites API (e2e)', () => {
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

  it('GET /api/admin/v1/payment-requisites without session returns 401', async () => {
    const res = await request(app!.getHttpServer()).get(
      '/api/admin/v1/payment-requisites',
    );
    expect(res.status).toBe(401);
  });

  it('regular user is forbidden from payment requisites', async () => {
    const token = await registerUser(app!, staffEmail('holder'));
    const res = await request(app!.getHttpServer())
      .get('/api/admin/v1/payment-requisites')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it('SUPER_ADMIN can read network settings', async () => {
    const token = await staffToken(app!, UserRoleCode.SUPER_ADMIN);
    const res = await request(app!.getHttpServer())
      .get('/api/admin/v1/payment-requisites/network-settings')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      asset: 'USDT',
      network: 'TRC20',
    });
  });

  it('ACCOUNTANT can PATCH network settings with reason', async () => {
    const token = await staffToken(app!, UserRoleCode.ACCOUNTANT);
    const res = await request(app!.getHttpServer())
      .patch('/api/admin/v1/payment-requisites/network-settings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        instructionsEs: 'Copie la dirección',
        reason: 'e2e test',
      });
    expect(res.status).toBe(200);
    expect(res.body.instructionsEs).toBe('Copie la dirección');
  });

  it('SUPPORT can read but not PATCH network settings', async () => {
    const token = await staffToken(app!, UserRoleCode.SUPPORT);
    const read = await request(app!.getHttpServer())
      .get('/api/admin/v1/payment-requisites/network-settings')
      .set('Authorization', `Bearer ${token}`);
    expect(read.status).toBe(200);

    const patch = await request(app!.getHttpServer())
      .patch('/api/admin/v1/payment-requisites/network-settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ minDepositAmount: '99', reason: 'forbidden' });
    expect(patch.status).toBe(403);
  });

  it('rejects invalid TRC20 address on pool add', async () => {
    const token = await staffToken(app!, UserRoleCode.SUPER_ADMIN);
    const res = await request(app!.getHttpServer())
      .post('/api/admin/v1/payment-requisites/address-pool')
      .set('Authorization', `Bearer ${token}`)
      .send({
        address: 'not-a-tron-address',
        asset: 'USDT',
        network: 'TRC20',
        reason: 'e2e invalid',
      });
    expect(res.status).toBe(400);
    expect(res.body?.error?.code).toBe('INVALID_TRC20_ADDRESS');
  });

  it('preview returns localized instructions', async () => {
    const token = await staffToken(app!, UserRoleCode.SUPER_ADMIN);
    await request(app!.getHttpServer())
      .patch('/api/admin/v1/payment-requisites/network-settings')
      .set('Authorization', `Bearer ${token}`)
      .send({
        instructionsEs: 'Instrucción ES e2e',
        reason: 'e2e preview',
      });

    const res = await request(app!.getHttpServer())
      .get('/api/admin/v1/payment-requisites/preview?lang=es')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.depositInstructions).toBe('Instrucción ES e2e');
    expect(res.body.previewMode).toBe(true);
  });
});
