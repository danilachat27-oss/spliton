import { INestApplication } from '@nestjs/common';
import { NotificationAudienceType } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import request from 'supertest';
import { createE2eApp } from './helpers/create-e2e-app';
import { registerE2eUser } from './helpers/register-e2e-user';
import { e2eEmail } from './helpers/e2e-unique';

async function registerAndLogin(app: INestApplication) {
  const email = e2eEmail('notify');
  const { token, userId } = await registerE2eUser(app, email);
  return { token, userId };
}

describe('Notifications (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  afterEach(async () => {
    await app.close();
  });

  it('lists user notifications and unread count', async () => {
    const { token, userId } = await registerAndLogin(app);
    const prisma = new PrismaClient();
    await prisma.inAppNotification.create({
      data: {
        audience: NotificationAudienceType.USER,
        recipientUserId: userId,
        type: 'test.ping',
        category: 'finance',
        title: 'Test',
        message: 'Hello',
      },
    });
    await prisma.$disconnect();

    const list = await request(app.getHttpServer())
      .get('/api/v1/notifications')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(list.body.items.length).toBeGreaterThan(0);

    const count = await request(app.getHttpServer())
      .get('/api/v1/notifications/unread-count')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(count.body.count).toBeGreaterThanOrEqual(1);
  });

  it('blocks disabling security email preference', async () => {
    const { token } = await registerAndLogin(app);
    await request(app.getHttpServer())
      .patch('/api/v1/notification-preferences')
      .set('Authorization', `Bearer ${token}`)
      .send({ emailSecurity: false })
      .expect(400);
  });
});
