import request from 'supertest';
import { e2eRegisterPayload } from './helpers/register-e2e-user';
import {
  PrismaClient,
  SupportTicketCategory,
  SupportTicketStatus,
  UserRoleCode,
  UserStatus,
} from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';

function staffEmail(prefix: string): string {
  return `e2e-${prefix}-${Date.now()}@example.com`;
}

async function registerUser(app: E2eApp, email: string) {
  const password = 'TestPass123!';
  await request(app.getHttpServer())
    .post('/auth/register')
      .send(e2eRegisterPayload(email, password, 'E2E'))
    .expect(201);

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

describe('Admin support center (e2e)', () => {
  let app: E2eApp | undefined;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('lists tickets and staff reply', async () => {
    const email = staffEmail('support-mgr');
    await registerUser(app!, email);
    await assignRole(email, UserRoleCode.SUPPORT_MANAGER);
    const login = await request(app!.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'TestPass123!' });
    const adminToken = login.body.tokens.accessToken as string;

    const prisma = new PrismaClient();
    const holder = await prisma.user.findFirst({
      where: { status: UserStatus.ACTIVE, email: { not: email } },
    });
    expect(holder).toBeTruthy();
    const ticket = await prisma.supportTicket.create({
      data: {
        userId: holder!.id,
        subject: 'E2E admin support',
        category: SupportTicketCategory.DEPOSIT,
        status: SupportTicketStatus.OPEN,
      },
    });
    await prisma.supportTicketMessage.create({
      data: {
        ticketId: ticket.id,
        authorUserId: holder!.id,
        body: 'User message',
        isStaff: false,
      },
    });
    await prisma.$disconnect();

    const auth = { Authorization: `Bearer ${adminToken}` };
    const list = await request(app!.getHttpServer())
      .get('/api/admin/v1/support/tickets')
      .set(auth);
    expect(list.status).toBe(200);

    const reply = await request(app!.getHttpServer())
      .post(`/api/admin/v1/support/tickets/${ticket.id}/reply`)
      .set(auth)
      .send({ body: 'Staff reply from e2e' });
    expect([200, 201]).toContain(reply.status);
    expect(
      reply.body.messages?.some((m: { isStaff: boolean }) => m.isStaff),
    ).toBe(true);
  });
});
