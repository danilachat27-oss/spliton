import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import helmet from 'helmet';
import { AppModule } from '../../src/app.module';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';

const throttleBypass = {
  canActivate: () => true,
};

export async function createE2eApp(): Promise<INestApplication> {
  const base = Test.createTestingModule({
    imports: [AppModule],
  });
  /** AppModule skips Throttler under Jest; only override when the guard is registered. */
  const moduleFixture: TestingModule = await (
    process.env.JEST_WORKER_ID
      ? base
      : base.overrideGuard(ThrottlerGuard).useValue(throttleBypass)
  ).compile();

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
  return app;
}
