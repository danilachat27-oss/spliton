import request from 'supertest';
import { e2eRegisterPayload } from './helpers/register-e2e-user';
import { PrismaClient, UserStatus } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { ValidationPipe } from '@nestjs/common';
import { EmailService } from '../src/modules/email/email.service';
import { FakeEmailService } from './helpers/fake-email.service';
import { ConfigurableThrottlerGuard } from '../src/common/guards/configurable-throttler.guard';

/** Login route limit from AuthController: 5 attempts per 60s per IP (see @Throttle on POST /auth/login). */
const LOGIN_ROUTE_LIMIT = 5;

describe('Performance hardening (e2e)', () => {
  describe('pagination validation', () => {
    let app: Awaited<ReturnType<typeof bootstrapApp>>;

    beforeEach(async () => {
      app = await bootstrapApp(true);
    });

    afterEach(async () => {
      await app.close();
    });

    it('rejects pageSize above max on wallet activity', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/v1/wallet/activity?pageSize=101',
      );
      expect(res.status).toBe(401);
    });

    it('rejects pageSize above max when authenticated', async () => {
      const token = await loginActiveUser(app);
      const res = await request(app.getHttpServer())
        .get('/api/v1/wallet/activity?pageSize=150')
        .set('Authorization', `Bearer ${token}`);
      expect(res.status).toBe(400);
    });

    it('returns hasMore on public news list', async () => {
      const res = await request(app.getHttpServer()).get(
        '/api/v1/news?page=1&pageSize=5',
      );
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('hasMore');
      expect(res.body.pageSize).toBeLessThanOrEqual(100);
    });
  });

  describe('rate limiting', () => {
    let app: Awaited<ReturnType<typeof bootstrapApp>>;
    let savedLoadTestMode: string | undefined;
    let savedE2eBypassThrottle: string | undefined;

    beforeEach(async () => {
      // Global jest-e2e.setup enables bypass — disable for throttle assertions only.
      savedLoadTestMode = process.env.LOAD_TEST_MODE;
      savedE2eBypassThrottle = process.env.E2E_BYPASS_THROTTLE;
      delete process.env.LOAD_TEST_MODE;
      delete process.env.E2E_BYPASS_THROTTLE;
      app = await bootstrapApp(false);
    });

    afterEach(async () => {
      await app.close();
      if (savedLoadTestMode === undefined) {
        delete process.env.LOAD_TEST_MODE;
      } else {
        process.env.LOAD_TEST_MODE = savedLoadTestMode;
      }
      if (savedE2eBypassThrottle === undefined) {
        delete process.env.E2E_BYPASS_THROTTLE;
      } else {
        process.env.E2E_BYPASS_THROTTLE = savedE2eBypassThrottle;
      }
    });

    it('returns 429 after burst login attempts', async () => {
      // ThrottlerGuard runs before AuthService — invalid credentials still count toward the limit.
      // Expect 401 for attempts 1..5, then 429 once the route @Throttle limit is exceeded.
      const email = `throttle-${Date.now()}@example.com`;
      const password = 'TestPass123!';
      const statuses: number[] = [];
      for (let i = 0; i < LOGIN_ROUTE_LIMIT + 3; i++) {
        const res = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email, password });
        statuses.push(res.status);
        if (res.status === 429) break;
      }
      expect(statuses.some((s) => s === 429)).toBe(true);
      expect(statuses.slice(0, LOGIN_ROUTE_LIMIT).every((s) => s === 401)).toBe(true);
    });
  });
});

async function bootstrapApp(bypassThrottle: boolean) {
  process.env.REPORT_WORKER_ENABLED = 'false';
  process.env.EVENT_OUTBOX_WORKER_ENABLED = 'false';
  process.env.DEPOSIT_INGESTION_ENABLED = 'false';
  process.env.SKIP_SCHEMA_BOOTSTRAP = 'true';
  const fakeEmail = new FakeEmailService();
  let builder = Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(EmailService)
    .useValue(fakeEmail);
  if (bypassThrottle) {
    builder = builder
      .overrideGuard(ConfigurableThrottlerGuard)
      .useValue({ canActivate: () => true });
  }
  const moduleFixture: TestingModule = await builder.compile();
  const app = moduleFixture.createNestApplication();
  app.use(cookieParser());
  app.use(helmet());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  await app.init();
  return app;
}

async function loginActiveUser(
  app: Awaited<ReturnType<typeof bootstrapApp>>,
): Promise<string> {
  const email = `perf-${Date.now()}@example.com`;
  const password = 'TestPass123!';
  await request(app.getHttpServer())
    .post('/auth/register')
      .send(e2eRegisterPayload(email, password, 'Perf'));
  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({ where: { email } });
  await prisma.user.update({
    where: { id: user!.id },
    data: { status: UserStatus.ACTIVE, emailVerifiedAt: new Date() },
  });
  await prisma.$disconnect();
  const login = await request(app.getHttpServer())
    .post('/auth/login')
    .send({ email, password });
  return login.body.tokens.accessToken as string;
}
