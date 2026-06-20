import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import type { OnboardingStepId } from './onboarding.constants';
import { OnboardingService } from './onboarding.service';

@Controller('api/v1/onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private readonly onboarding: OnboardingService) {}

  @Get()
  get(@CurrentUser() user: AuthUser) {
    return this.onboarding.getForUser(user.id);
  }

  @Patch('steps/:stepId')
  completeStep(@CurrentUser() user: AuthUser, @Param('stepId') stepId: OnboardingStepId) {
    return this.onboarding.completeStep(user.id, stepId);
  }

  @Post('steps/:stepId/skip')
  skipStep(@CurrentUser() user: AuthUser, @Param('stepId') stepId: OnboardingStepId) {
    return this.onboarding.skipStep(user.id, stepId);
  }

  @Post('dismiss')
  dismiss(@CurrentUser() user: AuthUser) {
    return this.onboarding.dismiss(user.id);
  }

  @Post('complete')
  complete(@CurrentUser() user: AuthUser) {
    return this.onboarding.markComplete(user.id);
  }
}
