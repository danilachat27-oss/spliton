import { Controller, Get, Param } from '@nestjs/common';
import { LegalPolicyType } from '@prisma/client';
import { LegalPoliciesService } from './legal-policies.service';

@Controller('api/v1/legal')
export class PublicLegalController {
  constructor(private readonly policies: LegalPoliciesService) {}

  @Get('policies/active')
  listActive() {
    return this.policies.listActivePublic();
  }

  @Get('policies/:type/active')
  activeByType(@Param('type') type: string) {
    return this.policies.getActiveByType(type as LegalPolicyType);
  }
}
