import request from 'supertest';
import { e2eRegisterPayload } from './helpers/register-e2e-user';
import { PrismaClient, UserRoleCode, UserStatus } from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';

function staffEmail(): string {
  return `e2e-status-${Date.now()}@example.com`;
}

async function registerAdmin(app: E2eApp, email: string) {
  const password = 'TestPass123!';
  await request(app.getHttpServer())
    .post('/auth/register')
      .send(e2eRegisterPayload(email, password))
    .expect(201);

  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({ where: { email } });
  const role = await prisma.role.findUnique({
    where: { code: UserRoleCode.ADMIN },
  });
  if (user && role) {
    await prisma.user.update({
      where: { id: user.id },
      data: { status: UserStatus.ACTIVE, emailVerifiedAt: new Date() },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      create: { userId: user.id, roleId: role.id },
      update: {},
    });
  }
  await prisma.$disconnect();

  const login = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password });
  return login.body.tokens.accessToken as string;
}

describe('Admin system status (e2e)', () => {
  let app: E2eApp | undefined;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    if (app) await app.close();
  });

  it('lists components, patches status, creates and resolves incident', async () => {
    const token = await registerAdmin(app!, staffEmail());
    const auth = { Authorization: `Bearer ${token}` };

    const components = await request(app!.getHttpServer())
      .get('/api/admin/v1/system-status/components')
      .set(auth);
    expect(components.status).toBe(200);
    expect(components.body.items.length).toBeGreaterThan(0);
    const code = components.body.items[0].code as string;

    await request(app!.getHttpServer())
      .patch(`/api/admin/v1/system-status/components/${code}`)
      .set(auth)
      .send({ status: 'degraded', message: 'E2E test degradation' })
      .expect(200);

    const incident = await request(app!.getHttpServer())
      .post('/api/admin/v1/system-status/incidents')
      .set(auth)
      .send({
        title: 'E2E incident',
        description: 'Testing incident flow',
        severity: 'medium',
        affectedComponentCodes: [code],
        visiblePublic: true,
      });
    expect(incident.status).toBe(201);
    const incidentId = incident.body.id as string;

    await request(app!.getHttpServer())
      .post(`/api/admin/v1/system-status/incidents/${incidentId}/updates`)
      .set(auth)
      .send({ body: 'Investigating root cause', status: 'investigating' })
      .expect(201);

    await request(app!.getHttpServer())
      .post(`/api/admin/v1/system-status/incidents/${incidentId}/resolve`)
      .set(auth)
      .expect(201);

    const prisma = new PrismaClient();
    const audits = await prisma.auditLog.findMany({
      where: {
        entityId: incidentId,
        action: {
          in: [
            'status.incident_create',
            'status.incident_update',
            'status.incident_resolve',
          ],
        },
      },
    });
    const componentAudits = await prisma.auditLog.findMany({
      where: {
        action: 'status.component_update',
        entityType: 'system_status_component',
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
    await prisma.$disconnect();

    expect(audits.length).toBeGreaterThanOrEqual(2);
    expect(
      componentAudits.some((a) => a.action === 'status.component_update'),
    ).toBe(true);
  });
});
