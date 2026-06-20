import { Module, forwardRef } from '@nestjs/common';

import { PrismaModule } from '../../prisma/prisma.module';

import { LegalModule } from '../legal/legal.module';

import { ComplianceEnforcementService } from './compliance-enforcement.service';

import { ComplianceRiskScoringService } from './compliance-risk-scoring.service';

import { EligibilityService } from './eligibility.service';

import { CountryRestrictionsService } from './country-restrictions.service';

import { UserKycService } from './user-kyc.service';

import { AmlProfileService } from './aml-profile.service';

import { UserKycController } from './user-kyc.controller';

import { AdminKycController } from './admin-kyc.controller';

import { UserComplianceController } from './user-compliance.controller';

import { MarketAbuseModule } from './market-abuse.module';


@Module({

  imports: [PrismaModule, forwardRef(() => LegalModule), MarketAbuseModule],

  controllers: [UserKycController, AdminKycController, UserComplianceController],

  providers: [

    ComplianceEnforcementService,

    ComplianceRiskScoringService,

    EligibilityService,

    CountryRestrictionsService,

    UserKycService,

    AmlProfileService,

  ],

  exports: [

    ComplianceEnforcementService,

    ComplianceRiskScoringService,

    EligibilityService,

    CountryRestrictionsService,

    UserKycService,

    AmlProfileService,

  ],

})

export class ComplianceModule {}


