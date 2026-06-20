import request from 'supertest';

import { createE2eApp, E2eApp } from './helpers/create-e2e-app';

import { e2eEmail } from './helpers/e2e-unique';

import { registerAndLoginE2eUser } from './helpers/e2e-auth';



describe('User support tickets (e2e)', () => {

  let app: E2eApp | undefined;



  beforeEach(async () => {

    app = await createE2eApp();

  });



  afterEach(async () => {

    if (app) await app.close();

  });



  it('creates ticket, lists own tickets, replies and closes', async () => {

    const { token } = await registerAndLoginE2eUser(

      app!,

      e2eEmail('user-support'),

      'TestPass123!',

      'Support E2E',

    );

    const auth = { Authorization: `Bearer ${token}` };



    const created = await request(app!.getHttpServer())

      .post('/api/v1/support/tickets')

      .set(auth)

      .send({

        category: 'deposit',

        subject: 'Deposit not credited',

        message: 'Please help with my deposit',

      });

    expect(created.status).toBe(201);

    const ticketId = created.body.id as string;



    const list = await request(app!.getHttpServer())

      .get('/api/v1/support/tickets')

      .set(auth);

    expect(list.status).toBe(200);

    expect(list.body.items.some((t: { id: string }) => t.id === ticketId)).toBe(

      true,

    );



    const otherToken = (

      await registerAndLoginE2eUser(app!, e2eEmail('user-support-other'))

    ).token;

    const forbidden = await request(app!.getHttpServer())

      .get(`/api/v1/support/tickets/${ticketId}`)

      .set({ Authorization: `Bearer ${otherToken}` });

    expect(forbidden.status).toBe(404);



    await request(app!.getHttpServer())

      .post(`/api/v1/support/tickets/${ticketId}/messages`)

      .set(auth)

      .send({ body: 'Additional info' })

      .expect(201);



    const closed = await request(app!.getHttpServer())

      .patch(`/api/v1/support/tickets/${ticketId}/close`)

      .set(auth);

    expect(closed.status).toBe(200);

    expect(closed.body.status).toBe('closed');



    const closedAgain = await request(app!.getHttpServer())

      .patch(`/api/v1/support/tickets/${ticketId}/close`)

      .set(auth);

    expect(closedAgain.status).toBe(200);

    expect(closedAgain.body.status).toBe('closed');

  });

});


