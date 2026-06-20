import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { assertProductionBootSafe } from './config/production-boot-guard';

async function bootstrap() {
  assertProductionBootSafe();
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const rawOrigins =
    configService.get<string>('app.frontendOrigin') ?? 'http://localhost:3000';
  const allowlist = rawOrigins
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowlist,
    credentials: true,
  });
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
  app.enableShutdownHooks();

  const port = configService.get<number>('app.port', 4001);
  const throttle = configService.get<{
    enabled: boolean;
    limit: number;
    ttlMs: number;
    loadTestMode: boolean;
  }>('throttle');
  if (throttle) {
    const storage = (process.env.RATE_LIMIT_STORAGE ?? 'memory').trim().toLowerCase();
    console.log(
      `[throttle] enabled=${throttle.enabled} limit=${throttle.limit}/${throttle.ttlMs}ms loadTestMode=${throttle.loadTestMode} storage=${storage}`,
    );
  }

  await app.listen(port);
}
void bootstrap();
