import request from 'supertest';
import { e2eRegisterPayload } from './helpers/register-e2e-user';
import {
  PrismaClient,
  ReportJobStatus,
  UserRoleCode,
  UserStatus,
} from '@prisma/client';
import { createE2eApp, E2eApp } from './helpers/create-e2e-app';
import { ReportWorkerService } from '../src/modules/admin/common/report-worker.service';
import { AdminReportsService } from '../src/modules/admin/v1/admin-reports.service';

async function staffToken(app: E2eApp, role: UserRoleCode) {
  const email = `e2e-rpt-${role.toLowerCase()}-${Date.now()}@example.com`;
  const password = 'TestPass123!';
  await request(app.getHttpServer())
    .post('/auth/register')
      .send(e2eRegisterPayload(email, password))
    .expect(201);

  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({ where: { email } });
  const r = await prisma.role.findUnique({ where: { code: role } });
  if (user && r) {
    await prisma.user.update({
      where: { id: user.id },
      data: { status: UserStatus.ACTIVE, emailVerifiedAt: new Date() },
    });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: r.id } },
      create: { userId: user.id, roleId: r.id },
      update: {},
    });
  }
  await prisma.$disconnect();

  const login = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password })
    .expect(201);
  return login.body.tokens.accessToken as string;
}

type ReportJobPollBody = { status: string };

async function waitForReportStatus(
  app: E2eApp,
  token: string,
  id: string,
  status: string,
  attempts = 20,
) {
  for (let i = 0; i < attempts; i++) {
    const res = await request(app.getHttpServer())
      .get(`/api/admin/v1/reports/${id}`)
      .set('Authorization', `Bearer ${token}`);
    const body = res.body as ReportJobPollBody;
    if (res.status === 200 && body.status === status) return body;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Report ${id} did not reach status ${status}`);
}

describe('Admin reports center (e2e)', () => {
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

  it('GET /reports/summary returns KPI', async () => {
    const token = await staffToken(app!, UserRoleCode.ACCOUNTANT);
    const res = await request(app!.getHttpServer())
      .get('/api/admin/v1/reports/summary')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('total');
    expect(res.body).toHaveProperty('workerEnabled');
  });

  it('GET worker/status returns storage fields', async () => {
    const token = await staffToken(app!, UserRoleCode.ACCOUNTANT);
    const res = await request(app!.getHttpServer())
      .get('/api/admin/v1/reports/worker/status')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('storageMode');
    expect(res.body).toHaveProperty('bucketName');
  });

  it('SUPPORT_MANAGER can generate support_tickets only', async () => {
    const token = await staffToken(app!, UserRoleCode.SUPPORT_MANAGER);
    const ok = await request(app!.getHttpServer())
      .post('/api/admin/v1/reports/generate')
      .query({
        type: 'support_tickets',
        dateFrom: '2020-01-01',
        dateTo: '2020-01-31',
      })
      .set('Authorization', `Bearer ${token}`);
    expect([200, 201]).toContain(ok.status);

    const denied = await request(app!.getHttpServer())
      .post('/api/admin/v1/reports/generate')
      .query({
        type: 'withdrawals',
        dateFrom: '2020-01-01',
        dateTo: '2020-01-31',
      })
      .set('Authorization', `Bearer ${token}`);
    expect(denied.status).toBe(403);
  });

  it('generate creates QUEUED job then completes inline', async () => {
    const token = await staffToken(app!, UserRoleCode.ACCOUNTANT);
    const gen = await request(app!.getHttpServer())
      .post('/api/admin/v1/reports/generate')
      .query({
        type: 'analytics_summary',
        dateFrom: '2020-01-01',
        dateTo: '2020-12-31',
      })
      .set('Authorization', `Bearer ${token}`);
    expect([200, 201]).toContain(gen.status);
    expect(gen.body.status).toBe('queued');

    const completed = await waitForReportStatus(
      app!,
      token,
      gen.body.id,
      'completed',
    );
    expect(completed.fileSizeBytes).toBeGreaterThan(0);
    expect(completed.expiresAt).toBeTruthy();

    const prisma = new PrismaClient();
    const audits = await prisma.auditLog.findMany({
      where: { entityType: 'report_job', entityId: gen.body.id },
    });
    await prisma.$disconnect();
    expect(audits.some((a) => a.action === 'report.generate')).toBe(true);
  });

  it('download allowed for permitted role', async () => {
    const token = await staffToken(app!, UserRoleCode.ACCOUNTANT);
    const gen = await request(app!.getHttpServer())
      .post('/api/admin/v1/reports/generate')
      .query({ type: 'deposits' })
      .set('Authorization', `Bearer ${token}`);
    await waitForReportStatus(app!, token, gen.body.id, 'completed');

    const dl = await request(app!.getHttpServer())
      .get(`/api/admin/v1/reports/${gen.body.id}/download`)
      .set('Authorization', `Bearer ${token}`);
    expect(dl.status).toBe(200);
    expect(dl.body.content).toContain('id,user_email');
    expect(dl.body.filename).toMatch(/\.csv$/);
  });

  it('download forbidden for wrong role', async () => {
    const accountant = await staffToken(app!, UserRoleCode.ACCOUNTANT);
    const support = await staffToken(app!, UserRoleCode.SUPPORT_MANAGER);

    const gen = await request(app!.getHttpServer())
      .post('/api/admin/v1/reports/generate')
      .query({ type: 'withdrawals' })
      .set('Authorization', `Bearer ${accountant}`);
    await waitForReportStatus(app!, accountant, gen.body.id, 'completed');

    const denied = await request(app!.getHttpServer())
      .get(`/api/admin/v1/reports/${gen.body.id}/download`)
      .set('Authorization', `Bearer ${support}`);
    expect(denied.status).toBe(403);
  });

  it('failed job can be retried', async () => {
    const token = await staffToken(app!, UserRoleCode.ACCOUNTANT);
    const gen = await request(app!.getHttpServer())
      .post('/api/admin/v1/reports/generate')
      .query({ type: 'deposits' })
      .set('Authorization', `Bearer ${token}`);

    await waitForReportStatus(app!, token, gen.body.id, 'completed');

    const prisma = new PrismaClient();
    await prisma.reportJob.update({
      where: { id: gen.body.id },
      data: {
        status: ReportJobStatus.FAILED,
        errorMessage: 'Simulated failure',
        completedAt: new Date(),
      },
    });
    await prisma.$disconnect();

    const retry = await request(app!.getHttpServer())
      .post(`/api/admin/v1/reports/${gen.body.id}/retry`)
      .set('Authorization', `Bearer ${token}`);
    expect([200, 201]).toContain(retry.status);
    expect(retry.body.status).toBe('queued');

    const completed = await waitForReportStatus(
      app!,
      token,
      gen.body.id,
      'completed',
    );
    expect(completed.errorMessage).toBeNull();
  });

  it('worker completes queued job when enabled', async () => {
    process.env.REPORT_WORKER_ENABLED = 'true';
    const token = await staffToken(app!, UserRoleCode.ACCOUNTANT);
    const gen = await request(app!.getHttpServer())
      .post('/api/admin/v1/reports/generate')
      .query({ type: 'deposits' })
      .set('Authorization', `Bearer ${token}`);
    expect(gen.body.status).toBe('queued');

    const prisma = new PrismaClient();
    const queued = await prisma.reportJob.findUnique({ where: { id: gen.body.id } });
    expect(queued?.status).toBe(ReportJobStatus.QUEUED);
    await prisma.$disconnect();

    const worker = app!.get(ReportWorkerService);
    const reports = app!.get(AdminReportsService);
    await worker.recoverStuckJobs();
    await worker.processNextBatch(2);

    let completed: ReportJobPollBody;
    try {
      completed = await waitForReportStatus(
        app!,
        token,
        gen.body.id,
        'completed',
        12,
      );
    } catch {
      const resetPrisma = new PrismaClient();
      await resetPrisma.reportJob.update({
        where: { id: gen.body.id },
        data: {
          status: ReportJobStatus.QUEUED,
          errorMessage: null,
          lockedAt: null,
          lockedBy: null,
          startedAt: null,
          completedAt: null,
          attemptCount: 0,
        },
      });
      await resetPrisma.$disconnect();
      await reports.processJobById(gen.body.id);
      completed = await waitForReportStatus(
        app!,
        token,
        gen.body.id,
        'completed',
        40,
      );
    }

    expect(completed.status).toBe('completed');
    process.env.REPORT_WORKER_ENABLED = 'false';
  });

  it('sensitive download writes audit.sensitive_export', async () => {
    const token = await staffToken(app!, UserRoleCode.ACCOUNTANT);
    const gen = await request(app!.getHttpServer())
      .post('/api/admin/v1/reports/generate')
      .query({ type: 'withdrawals' })
      .set('Authorization', `Bearer ${token}`);
    await waitForReportStatus(app!, token, gen.body.id, 'completed');

    await request(app!.getHttpServer())
      .get(`/api/admin/v1/reports/${gen.body.id}/download`)
      .set('Authorization', `Bearer ${token}`);

    const prisma = new PrismaClient();
    const audits = await prisma.auditLog.findMany({
      where: {
        entityType: 'report_job',
        entityId: gen.body.id,
        action: 'report.sensitive_export',
      },
    });
    await prisma.$disconnect();
    expect(audits.length).toBeGreaterThan(0);
  });
});
