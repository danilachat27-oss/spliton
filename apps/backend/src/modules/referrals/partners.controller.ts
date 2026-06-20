import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';
import { PartnersService } from './partners.service';
import { ApplyPartnerDto } from './dto/apply-partner.dto';

@Controller('api/v1/partners')
@UseGuards(JwtAuthGuard)
export class PartnersController {
  constructor(private readonly partners: PartnersService) {}

  @Post('apply')
  apply(@CurrentUser() user: AuthUser, @Body() dto: ApplyPartnerDto) {
    return this.partners.apply(user.id, dto);
  }

  @Get('me')
  getMe(@CurrentUser() user: AuthUser) {
    return this.partners.getMe(user.id);
  }

  @Get('performance')
  performance(@CurrentUser() user: AuthUser) {
    return this.partners.getPerformance(user.id);
  }
}
