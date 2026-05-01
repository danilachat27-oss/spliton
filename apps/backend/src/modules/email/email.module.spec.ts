import { ServiceUnavailableException } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { EmailService } from './email.service';
import { EmailModule } from './email.module';
import { DevEmailService } from './services/dev-email.service';

describe('EmailModule provider selection', () => {
  it('uses DevEmailService when EMAIL_PROVIDER=dev', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          ignoreEnvFile: true,
          load: [() => ({ EMAIL_PROVIDER: 'dev' })],
        }),
        EmailModule,
      ],
    }).compile();

    const emailService = moduleRef.get(EmailService);
    expect(emailService).toBeInstanceOf(DevEmailService);
    await moduleRef.close();
  });

  it('throws for postmark provider without required env', async () => {
    await expect(
      Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            ignoreEnvFile: true,
            load: [() => ({ EMAIL_PROVIDER: 'postmark' })],
          }),
          EmailModule,
        ],
      }).compile(),
    ).rejects.toThrow(ServiceUnavailableException);
  });
});
