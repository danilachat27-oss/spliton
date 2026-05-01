import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import helmet from 'helmet';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { EmailService } from '../../src/modules/email/email.service';
import { FakeEmailService } from './fake-email.service';

const throttleBypass = {
  canActivate: () => true,
};

export type E2eApp = INestApplication & { fakeEmailService: FakeEmailService };

export async function createE2eApp(): Promise<E2eApp> {
  const fakeEmailService = new FakeEmailService();
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideGuard(ThrottlerGuard)
    .useValue(throttleBypass)
    .overrideProvider(EmailService)
    .useValue(fakeEmailService)
    .compile();

  const app = moduleFixture.createNestApplication();
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
  (app as E2eApp).fakeEmailService = fakeEmailService;
  return app as E2eApp;
}
