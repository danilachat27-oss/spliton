import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createE2eApp } from './helpers/create-e2e-app';

describe('App (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    app = await createE2eApp();
  });

  it('/health (GET)', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body.status).toBe('ok');
        expect(res.body.service).toBe('spliton-backend');
        expect(res.body.timestamp).toBeDefined();
      });
  });

  afterEach(async () => {
    if (app) {
      await app.close();
    }
  });
});
