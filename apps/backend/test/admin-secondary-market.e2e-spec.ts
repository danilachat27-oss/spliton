import request from 'supertest';
import {
  Prisma,
  PrismaClient,
  ReleaseStatus,
  UserRoleCode,
  UserStatus,
} from '@prisma/client';
import { registerE2eUser } from './helpers/register-e2e-user';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';
import { e2eRegisterPayload } from './helpers/register-e2e-user';

function staffEmail(prefix: string): string {
  return `e2e-secondary-market-${prefix}-${Date.now()}@example.com`;
}

async function registerUser(app: E2eApp, email: string) {
  const password = 'TestPass123!';
  const reg = await request(app.getHttpServer())
    .post('/auth/register')
    .send(e2eRegisterPayload(email, password, 'E2E Secondary Market Admin'));
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

describe('Admin secondary market API (e2e)', () => {
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

  it('GET /api/admin/v1/secondary-market/summary without session returns 401', async () => {
    const res = await request(app!.getHttpServer()).get(
      '/api/admin/v1/secondary-market/summary',
    );
    expect(res.status).toBe(401);
  });

  it('BUSINESS_ANALYST can view secondary market summary and listings', async () => {
    const token = await staffToken(app!, UserRoleCode.BUSINESS_ANALYST);
    const summary = await request(app!.getHttpServer())
      .get('/api/admin/v1/secondary-market/summary?period=30d')
      .set('Authorization', `Bearer ${token}`);
    expect(summary.status).toBe(200);
    expect(summary.body).toMatchObject({
      activeListingsCount: expect.any(Number),
      tradeVolumeUsdt: expect.any(String),
    });

    const listings = await request(app!.getHttpServer())
      .get('/api/admin/v1/listings')
      .set('Authorization', `Bearer ${token}`);
    expect(listings.status).toBe(200);
    expect(listings.body).toMatchObject({
      items: expect.any(Array),
      total: expect.any(Number),
    });
  });

  it('ACCOUNTANT cannot freeze listings', async () => {
    const token = await staffToken(app!, UserRoleCode.ACCOUNTANT);
    const res = await request(app!.getHttpServer())
      .post(
        '/api/admin/v1/listings/00000000-0000-0000-0000-000000000001/freeze',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({ note: 'test' });
    expect(res.status).toBe(403);
  });

  it('admin cancel active listing unlocks seller units', async () => {
    const seller = await registerE2eUser(app!, `seller-${Date.now()}@example.com`);
    const complianceToken = await staffToken(app!, UserRoleCode.COMPLIANCE);
    const prisma = new PrismaClient();
    const release = await prisma.release.create({
      data: {
        slug: `e2e-admin-cancel-${Date.now()}`,
        symbol: `AC${Date.now() % 10000}`,
        title: 'Admin Cancel',
        payoutFrequency: 'MONTHLY',
        totalUnits: new Prisma.Decimal(20),
        unitsAvailablePrimary: new Prisma.Decimal(0),
        primaryUnitPrice: new Prisma.Decimal(5),
        status: ReleaseStatus.ACTIVE,
      },
    });
    await prisma.userPosition.create({
      data: {
        userId: seller.userId,
        releaseId: release.id,
        unitsTotal: new Prisma.Decimal(5),
        unitsAvailable: new Prisma.Decimal(5),
        unitsLocked: new Prisma.Decimal(0),
        avgEntryPrice: new Prisma.Decimal(10),
      },
    });
    await prisma.$disconnect();

    const listingRes = await request(app!.getHttpServer())
      .post('/api/v1/market/listings')
      .set('Authorization', `Bearer ${seller.token}`)
      .send({ releaseId: release.id, units: 2, pricePerUnit: 15 });
    expect(listingRes.status).toBe(201);
    const listingId = listingRes.body.id as string;

    const cancel = await request(app!.getHttpServer())
      .post(`/api/admin/v1/listings/${listingId}/cancel`)
      .set('Authorization', `Bearer ${complianceToken}`)
      .send({ note: 'policy violation' });
    expect([200, 201]).toContain(cancel.status);

    const prisma2 = new PrismaClient();
    const pos = await prisma2.userPosition.findUnique({
      where: {
        userId_releaseId: { userId: seller.userId, releaseId: release.id },
      },
    });
    const listing = await prisma2.marketListing.findUnique({
      where: { id: listingId },
    });
    await prisma2.$disconnect();
    expect(listing!.status).toBe('CANCELLED');
    expect(pos!.unitsLocked.toString()).toBe('0');
    expect(pos!.unitsAvailable.toString()).toBe('5');
  });

  it('admin cancel already cancelled listing returns 409', async () => {
    const seller = await registerE2eUser(app!, `seller2-${Date.now()}@example.com`);
    const complianceToken = await staffToken(app!, UserRoleCode.COMPLIANCE);
    const prisma = new PrismaClient();
    const release = await prisma.release.create({
      data: {
        slug: `e2e-admin-cancel2-${Date.now()}`,
        symbol: `AC2${Date.now() % 10000}`,
        title: 'Admin Cancel 2',
        payoutFrequency: 'MONTHLY',
        totalUnits: new Prisma.Decimal(20),
        unitsAvailablePrimary: new Prisma.Decimal(0),
        primaryUnitPrice: new Prisma.Decimal(5),
        status: ReleaseStatus.ACTIVE,
      },
    });
    await prisma.userPosition.create({
      data: {
        userId: seller.userId,
        releaseId: release.id,
        unitsTotal: new Prisma.Decimal(3),
        unitsAvailable: new Prisma.Decimal(3),
        unitsLocked: new Prisma.Decimal(0),
        avgEntryPrice: new Prisma.Decimal(10),
      },
    });
    await prisma.$disconnect();

    const listingRes = await request(app!.getHttpServer())
      .post('/api/v1/market/listings')
      .set('Authorization', `Bearer ${seller.token}`)
      .send({ releaseId: release.id, units: 1, pricePerUnit: 12 });
    const listingId = listingRes.body.id as string;

    await request(app!.getHttpServer())
      .post(`/api/admin/v1/listings/${listingId}/cancel`)
      .set('Authorization', `Bearer ${complianceToken}`)
      .send({ note: 'first cancel' })
      .expect((res) => expect([200, 201]).toContain(res.status));

    const again = await request(app!.getHttpServer())
      .post(`/api/admin/v1/listings/${listingId}/cancel`)
      .set('Authorization', `Bearer ${complianceToken}`)
      .send({ note: 'second cancel' });
    expect(again.status).toBe(409);
  });

  it('COMPLIANCE freeze requires note', async () => {
    const token = await staffToken(app!, UserRoleCode.COMPLIANCE);
    const res = await request(app!.getHttpServer())
      .post(
        '/api/admin/v1/listings/00000000-0000-0000-0000-000000000001/freeze',
      )
      .set('Authorization', `Bearer ${token}`)
      .send({});
    expect([400, 404]).toContain(res.status);
  });
});
