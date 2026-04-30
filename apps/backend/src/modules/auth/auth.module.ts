import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthRepository } from './auth.repository';
import { AuthService } from './auth.service';
import { TwoFactorRepository } from './repositories/two-factor.repository';
import { AuthAuditService } from './services/auth-audit.service';
import { SessionService } from './services/session.service';
import { TokenService } from './services/token.service';
import { TwoFactorBackupCodeService } from './services/two-factor-backup-code.service';
import { TwoFactorEncryptionService } from './services/two-factor-encryption.service';
import { TwoFactorLoginCompletionService } from './services/two-factor-login-completion.service';
import { TwoFactorService } from './services/two-factor.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TwoFactorAuthController } from './two-factor-auth.controller';

@Module({
  imports: [
    ConfigModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '15m' },
      }),
    }),
  ],
  controllers: [AuthController, TwoFactorAuthController],
  providers: [
    AuthService,
    AuthRepository,
    TwoFactorRepository,
    TwoFactorEncryptionService,
    TwoFactorBackupCodeService,
    TwoFactorLoginCompletionService,
    TwoFactorService,
    TokenService,
    SessionService,
    AuthAuditService,
    JwtStrategy,
  ],
  exports: [AuthService, PassportModule, JwtModule],
})
export class AuthModule {}
