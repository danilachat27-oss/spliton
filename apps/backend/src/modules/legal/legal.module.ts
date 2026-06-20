import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { ComplianceModule } from '../compliance/compliance.module';
import { AdminLegalController } from './admin-legal.controller';
import { PublicLegalController } from './public-legal.controller';
import { UserLegalController } from './user-legal.controller';
import { LegalConsentsService } from './legal-consents.service';
import { LegalPoliciesService } from './legal-policies.service';
import { LegalAuditService } from './legal-audit.service';

@Module({
  imports: [PrismaModule, forwardRef(() => ComplianceModule)],
  controllers: [PublicLegalController, UserLegalController, AdminLegalController],
  providers: [LegalPoliciesService, LegalConsentsService, LegalAuditService],
  exports: [LegalPoliciesService, LegalConsentsService, LegalAuditService],
})
export class LegalModule {}
