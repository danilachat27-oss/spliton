import { Global, Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { AdminAuditService } from './admin-audit.service';

/** Shared operator audit logging for admin, legal, compliance, treasury, referrals. */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [AdminAuditService],
  exports: [AdminAuditService],
})
export class AdminAuditModule {}
