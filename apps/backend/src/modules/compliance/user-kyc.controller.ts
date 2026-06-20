import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { UserKycService } from './user-kyc.service';

@Controller('api/v1/kyc')
@UseGuards(JwtAuthGuard)
export class UserKycController {
  constructor(private readonly kyc: UserKycService) {}

  @Get('status')
  status(@CurrentUser() user: AuthUser) {
    return this.kyc.getStatus(user.id);
  }

  @Post('start')
  start(
    @CurrentUser() user: AuthUser,
    @Body() body: { countryCode?: string },
  ) {
    return this.kyc.start(user.id, body.countryCode);
  }

  @Post('submit-manual')
  submitManual(
    @CurrentUser() user: AuthUser,
    @Body()
    body: { countryCode: string; documentType: string; documentReference: string },
  ) {
    return this.kyc.submitManual(user.id, body);
  }
}
