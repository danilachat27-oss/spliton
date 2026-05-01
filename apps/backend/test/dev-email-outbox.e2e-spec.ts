import request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from '../src/modules/email/email.module';
import { EmailService } from '../src/modules/email/email.service';

describe('Dev email outbox (e2e)', () => {
  let app: INestApplication;
  let emailService: EmailService;

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });

  it('returns 404 when outbox disabled', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              NODE_ENV: 'development',
              EMAIL_PROVIDER: 'dev',
              DEV_EMAIL_OUTBOX_ENABLED: false,
            }),
          ],
        }),
        EmailModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();

    await request(app.getHttpServer())
      .get('/dev/email-outbox/latest')
      .expect(404);
  });

  it('returns latest verify url when outbox enabled', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [
            () => ({
              NODE_ENV: 'development',
              EMAIL_PROVIDER: 'dev',
              DEV_EMAIL_OUTBOX_ENABLED: true,
            }),
          ],
        }),
        EmailModule,
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
    emailService = app.get(EmailService);
    await emailService.sendVerificationEmail({
      to: 'dev-outbox@example.com',
      userId: 'user-dev',
      verifyUrl: 'http://localhost:3000/verify-email?token=dev-token',
    });

    await request(app.getHttpServer())
      .get('/dev/email-outbox/latest')
      .expect(200)
      .expect(({ body }) => {
        expect(body).toMatchObject({
          to: 'dev-outbox@example.com',
          maskedTo: 'd***@example.com',
          userId: 'user-dev',
          verifyUrl: expect.stringContaining('/verify-email?token='),
          createdAt: expect.any(String),
        });
      });
  });
});
