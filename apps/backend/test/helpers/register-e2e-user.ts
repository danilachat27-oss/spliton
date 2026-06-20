import { INestApplication } from '@nestjs/common';



import { registerAndLoginE2eUser } from './e2e-auth';



export function e2eRegisterPayload(

  email: string,

  password = 'TestPass123!',

  displayName = 'E2E User',

) {

  return {

    email,

    password,

    displayName,

    acceptedTerms: true,

    acceptedPrivacy: true,

  };

}



/** Register + activate user for e2e (matches current RegisterDto). */

export async function registerE2eUser(app: INestApplication, email: string) {

  const result = await registerAndLoginE2eUser(app, email);

  return {

    token: result.token,

    userId: result.userId,

    password: result.password,

  };

}


