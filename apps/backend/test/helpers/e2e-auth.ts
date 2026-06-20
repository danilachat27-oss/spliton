import { INestApplication } from '@nestjs/common';
import { PrismaClient, UserRoleCode, UserStatus } from '@prisma/client';
import request from 'supertest';

import { e2eEmail } from './e2e-unique';
import { e2eRegisterPayload } from './register-e2e-user';

const DEFAULT_PASSWORD = 'TestPass123!';

const RETRYABLE_STATUSES = new Set([429, 502, 503]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatAuthFailure(
  action: 'register' | 'login',
  email: string,
  status: number,
  body: unknown,
): string {
  const errorCode =
    body && typeof body === 'object' && 'errorCode' in body
      ? String((body as { errorCode?: string }).errorCode)
      : 'n/a';
  return (
    `e2e ${action} failed for ${email}: status=${status} errorCode=${errorCode} ` +
    `body=${JSON.stringify(body)}`
  );
}

async function postWithRetry(
  app: INestApplication,
  path: string,
  payload: object,
  action: 'register' | 'login',
  email: string,
  maxAttempts = 3,
): Promise<{ status: number; body: Record<string, unknown> }> {
  let lastStatus = 0;
  let lastBody: Record<string, unknown> = {};

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await request(app.getHttpServer()).post(path).send(payload);
    lastStatus = res.status;
    lastBody = res.body as Record<string, unknown>;

    const success =
      action === 'register'
        ? res.status === 201
        : [200, 201].includes(res.status) &&
          typeof res.body?.tokens?.accessToken === 'string';

    if (success) {
      return { status: res.status, body: lastBody };
    }

    if (RETRYABLE_STATUSES.has(res.status) && attempt < maxAttempts) {
      await sleep(250 * attempt);
      continue;
    }
    break;
  }

  throw new Error(formatAuthFailure(action, email, lastStatus, lastBody));
}

/** Login with retry for throttle/transient failures. */
export async function loginE2eUser(
  app: INestApplication,
  email: string,
  password = DEFAULT_PASSWORD,
): Promise<string> {
  const { body } = await postWithRetry(
    app,
    '/auth/login',
    { email, password },
    'login',
    email,
  );
  const token = body.tokens as { accessToken?: string } | undefined;
  if (!token?.accessToken) {
    throw new Error(
      formatAuthFailure('login', email, 200, body) +
        ' (missing tokens.accessToken after successful status)',
    );
  }
  return token.accessToken;
}

/** Register + activate + login; unique emails recommended via e2eEmail(). */
export async function registerAndLoginE2eUser(
  app: INestApplication,
  email: string,
  password = DEFAULT_PASSWORD,
  displayName = 'E2E User',
): Promise<{ token: string; userId: string; email: string; password: string }> {
  await postWithRetry(
    app,
    '/auth/register',
    e2eRegisterPayload(email, password, displayName),
    'register',
    email,
  );

  const prisma = new PrismaClient();
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    await prisma.$disconnect();
    throw new Error(`e2e register: user not found after register: ${email}`);
  }
  await prisma.user.update({
    where: { id: user.id },
    data: { status: UserStatus.ACTIVE, emailVerifiedAt: new Date() },
  });
  await prisma.$disconnect();

  const token = await loginE2eUser(app, email, password);
  return { token, userId: user.id, email, password };
}

export async function assignE2eStaffRole(
  email: string,
  roleCode: UserRoleCode,
): Promise<void> {
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

/** Register user, assign staff role, login again for JWT with roles. */
export async function registerStaffE2eUser(
  app: INestApplication,
  roleCode: UserRoleCode,
  emailPrefix: string,
): Promise<{ token: string; email: string; userId: string }> {
  const email = e2eEmail(emailPrefix);
  const { userId, password } = await registerAndLoginE2eUser(app, email);
  await assignE2eStaffRole(email, roleCode);
  const token = await loginE2eUser(app, email, password);
  return { token, email, userId };
}
